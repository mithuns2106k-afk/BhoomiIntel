import express from 'express';
import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';
import pdfParse from 'pdf-parse';
import db from '../db.js';
import { fileURLToPath } from 'node:url';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { authRequired, requireRole, optionalAuth } from '../auth.js';

const router = express.Router();
const execFileAsync = promisify(execFile);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadsDir = path.resolve(__dirname, '../../data/documents');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e6);
    cb(null, uniqueSuffix + '-' + file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_'));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB
  fileFilter: (req, file, cb) => {
    const allowed = ['.pdf', '.txt', '.md', '.png', '.jpg', '.jpeg', '.tif', '.tiff'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Supported formats: PDF, TXT, MD, PNG, JPG, JPEG, TIF and TIFF'));
    }
  }
});

// GET /api/documents - list with optional filters
router.get('/', optionalAuth, (req, res) => {
  try {
    const { category, theme, district, search } = req.query;
    let query = 'SELECT id, title, category, theme, upload_date, file_path, uploaded_by_role, author, district_tags, publication_status, uploaded_by, length(extracted_text) as text_length FROM documents';
    const conditions = [];
    const params = [];

    if (!req.user || req.user.role === 'public') {
      conditions.push("publication_status = 'published'");
    }

    if (category && category !== 'all') {
      conditions.push('category = ?');
      params.push(category);
    }
    if (theme && theme !== 'all') {
      conditions.push('theme = ?');
      params.push(theme);
    }
    if (district && district !== 'all') {
      conditions.push('district_tags LIKE ?');
      params.push(`%${district}%`);
    }
    if (search) {
      conditions.push('(title LIKE ? OR extracted_text LIKE ? OR author LIKE ?)');
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    query += ' ORDER BY id DESC';

    const docs = params.length > 0 ? db.prepare(query).all(...params) : db.prepare(query).all();
    res.json({ success: true, count: docs.length, data: docs });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/documents/categories-and-themes
router.get('/categories-and-themes', (req, res) => {
  try {
    const categories = db.prepare('SELECT DISTINCT category FROM documents WHERE category IS NOT NULL').all().map(r => r.category);
    const themes = db.prepare('SELECT DISTINCT theme FROM documents WHERE theme IS NOT NULL').all().map(r => r.theme);
    res.json({ success: true, categories, themes });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/documents/:id - get single document with extracted text
router.get('/:id', optionalAuth, (req, res) => {
  try {
    const doc = db.prepare('SELECT * FROM documents WHERE id = ?').get(req.params.id);
    if (!doc) {
      return res.status(404).json({ success: false, error: 'Document not found' });
    }
    if ((!req.user || req.user.role === 'public') && doc.publication_status !== 'published') {
      return res.status(404).json({ success: false, error: 'Document not found' });
    }
    res.json({ success: true, data: doc });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/documents/upload - upload and extract text
router.post('/upload', authRequired, requireRole('researcher'), upload.single('file'), async (req, res) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ success: false, error: 'Please attach a PDF, TXT, or MD document' });
    }

    const {
      title = file.originalname.replace(/\.[^/.]+$/, '').replace(/_/g, ' '),
      category = 'Policy Research Paper',
      theme = 'Land Records Digitization',
      author = 'Research Contributor',
      district_tags = 'National',
      uploaded_by_role = 'researcher'
    } = req.body;

    let extractedText = '';
    let extractionMethod = 'text';
    let ocrStatus = 'not_required';
    const ext = path.extname(file.originalname).toLowerCase();

    if (ext === '.pdf') {
      const dataBuffer = fs.readFileSync(file.path);
      const pdfData = await pdfParse(dataBuffer);
      extractedText = pdfData.text || '';
      extractionMethod = extractedText.trim() ? 'pdf-text' : 'pdf-scan-detected';
      ocrStatus = extractedText.trim() ? 'not_required' : 'required';
      // Optional OCR bridge: if pdftoppm + tesseract are installed, OCR the first five pages.
      if (!extractedText.trim() && process.env.ENABLE_OCR === 'true') {
        try {
          const ocrDir = path.join(uploadsDir, `ocr-${Date.now()}`);
          fs.mkdirSync(ocrDir, { recursive: true });
          const prefix = path.join(ocrDir, 'page');
          await execFileAsync(process.env.PDFTOPPM_CMD || 'pdftoppm', ['-png', '-f', '1', '-l', '5', file.path, prefix], { timeout: 60000 });
          const images = fs.readdirSync(ocrDir).filter(n => n.endsWith('.png')).sort();
          const pages = [];
          for (const image of images) {
            try {
              const out = await execFileAsync(process.env.TESSERACT_CMD || 'tesseract', [path.join(ocrDir, image), 'stdout', '--psm', '6'], { timeout: 60000, maxBuffer: 5 * 1024 * 1024 });
              if (out.stdout?.trim()) pages.push(out.stdout.trim());
            } catch {}
          }
          extractedText = pages.join('\n\n');
          if (extractedText.trim()) { extractionMethod = 'pdf-ocr'; ocrStatus = 'completed'; }
          else ocrStatus = 'failed';
          fs.rmSync(ocrDir, { recursive: true, force: true });
        } catch { ocrStatus = 'unavailable'; }
      }
    } else if (['.png','.jpg','.jpeg','.tif','.tiff'].includes(ext)) {
      extractionMethod = 'image-ocr';
      ocrStatus = 'required';
      if (process.env.ENABLE_OCR === 'true') {
        try {
          const out = await execFileAsync(process.env.TESSERACT_CMD || 'tesseract', [file.path, 'stdout', '--psm', '6'], { timeout: 60000, maxBuffer: 8 * 1024 * 1024 });
          extractedText = out.stdout || '';
          ocrStatus = extractedText.trim() ? 'completed' : 'failed';
        } catch { ocrStatus = 'unavailable'; }
      }
    } else {
      extractedText = fs.readFileSync(file.path, 'utf-8');
    }

    if (!extractedText.trim()) {
      extractedText = `Document Title: ${title}\nCategory: ${category}\nUploaded on: ${new Date().toISOString()}\n\nOCR STATUS: ${ocrStatus}. No machine-readable text was extracted. Do not use this document as evidence until OCR/manual transcription is completed.`;
    }

    // Persist retrieval chunks so indexing survives restarts.
    const chunks = extractedText.split(/\n\s*\n/).reduce((acc, para) => {
      const clean = para.trim();
      if (!clean) return acc;
      const prev = acc[acc.length - 1];
      if (prev && (prev.length + clean.length + 2) <= 900) acc[acc.length - 1] = prev + '\n\n' + clean;
      else acc.push(clean);
      return acc;
    }, []);

    const today = new Date().toISOString().split('T')[0];
    const relativeFilePath = `/data/documents/${file.filename}`;

    const stmt = db.prepare(`
      INSERT INTO documents (
        title, category, theme, upload_date, file_path, extracted_text,
        uploaded_by_role, author, district_tags, uploaded_by, publication_status, created_at, updated_at, extraction_method, ocr_status, source_type
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft', ?, ?, ?, ?, 'user_upload')
    `);

    const result = stmt.run(
      title,
      category,
      theme,
      today,
      relativeFilePath,
      extractedText,
      uploaded_by_role,
      author,
      district_tags,
      req.user.id,
      today,
      today,
      extractionMethod,
      ocrStatus
    );
    const documentId = Number(result.lastInsertRowid);
    const chunkStmt = db.prepare('INSERT OR REPLACE INTO document_chunks (document_id, chunk_index, text, embedding, created_at) VALUES (?, ?, ?, ?, ?)');
    let semanticIndexed = false;
    try {
      const { embedText } = await import('../ai/embeddings.js');
      for (let i = 0; i < chunks.length; i++) {
        const embedding = await embedText(chunks[i]);
        chunkStmt.run(documentId, i, chunks[i], embedding ? JSON.stringify(embedding) : null, new Date().toISOString());
        semanticIndexed = semanticIndexed || Boolean(embedding);
      }
    } catch {
      chunks.forEach((chunk, i) => chunkStmt.run(documentId, i, chunk, null, new Date().toISOString()));
    }

    res.status(201).json({
      success: true,
      message: 'Document uploaded and indexed successfully into BhoomiIntel repository.',
      documentId,
      data: {
        id: documentId,
        title,
        category,
        theme,
        author,
        district_tags,
        upload_date: today,
        text_length: extractedText.length,
        chunks_indexed: chunks.length,
        semantic_indexed: semanticIndexed,
        extraction_method: extractionMethod,
        ocr_status: ocrStatus,
        evidence_ready: Boolean(extractedText.trim() && !['required','failed','unavailable'].includes(ocrStatus))
      }
    });
  } catch (err) {
    console.error('Document upload error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});


router.patch('/:id/publish', authRequired, requireRole('researcher'), (req, res) => {
  try {
    const doc = db.prepare('SELECT uploaded_by FROM documents WHERE id = ?').get(req.params.id);
    if (!doc) return res.status(404).json({ success: false, error: 'Document not found' });
    if (doc.uploaded_by && Number(doc.uploaded_by) !== Number(req.user.id)) return res.status(403).json({ success: false, error: 'You can only publish your own documents.' });
    const now = new Date().toISOString();
    db.prepare("UPDATE documents SET publication_status = 'published', updated_at = ? WHERE id = ?").run(now, req.params.id);
    res.json({ success: true, message: 'Document published.', publication_status: 'published' });
  } catch {
    res.status(500).json({ success: false, error: 'Unable to publish document.' });
  }
});

// DELETE /api/documents/:id
router.delete('/:id', authRequired, requireRole('researcher'), (req, res) => {
  try {
    const docId = req.params.id;
    const doc = db.prepare('SELECT file_path, uploaded_by FROM documents WHERE id = ?').get(docId);
    if (!doc) {
      return res.status(404).json({ success: false, error: 'Document not found' });
    }

    if (doc.uploaded_by && Number(doc.uploaded_by) !== Number(req.user.id)) {
      return res.status(403).json({ success: false, error: 'You can only remove documents you uploaded.' });
    }
    db.prepare('DELETE FROM document_chunks WHERE document_id = ?').run(docId);
    db.prepare('DELETE FROM documents WHERE id = ?').run(docId);
    if (doc.file_path && doc.file_path.startsWith('/data/documents/')) {
      const absolute = path.resolve(__dirname, '../..', doc.file_path.replace('/data/', 'data/'));
      if (fs.existsSync(absolute)) fs.unlinkSync(absolute);
    }
    res.json({ success: true, message: 'Document removed from repository.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
