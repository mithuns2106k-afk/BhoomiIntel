import express from 'express';
import db from '../db.js';
import { synthesizeResearchAssistant } from '../ai/claude.js';
import { authRequired, requireRole } from '../auth.js';
import { auditAI } from '../audit.js';

const router = express.Router();

// POST /api/research-assistant - multi-document trend synthesis & gap analysis
router.post('/', authRequired, requireRole('researcher', 'policymaker'), async (req, res) => {
  try {
    const { document_ids } = req.body;

    if (!document_ids || !Array.isArray(document_ids) || document_ids.length < 2) {
      return res.status(400).json({
        success: false,
        error: 'Please select at least 2 documents (up to 4) for comparative synthesis.'
      });
    }

    if (document_ids.length > 5) {
      return res.status(400).json({
        success: false,
        error: 'Maximum 4 documents can be analyzed simultaneously in this tier.'
      });
    }

    // Fetch the documents from database
    const placeholders = document_ids.map(() => '?').join(',');
    const docs = db.prepare(`SELECT * FROM documents WHERE id IN (${placeholders})`).all(...document_ids);

    if (docs.length < 2) {
      return res.status(404).json({
        success: false,
        error: 'Could not locate all specified documents in the repository.'
      });
    }

    // Call Claude AI multi-document synthesis engine
    const synthesisReport = await synthesizeResearchAssistant(docs);

    const report = { ...synthesisReport, generated_at: new Date().toISOString() };
    auditAI({
      userId: req.user.id,
      operation: 'research_assistant',
      input: { document_ids },
      sourceDocumentIds: document_ids,
      output: report,
      modelName: report.provider || process.env.CLAUDE_MODEL || 'unknown',
      success: true
    });
    res.json({
      success: true,
      report,
      is_ai_generated: Boolean(report.is_ai_generated ?? true)
    });
  } catch (err) {
    console.error('Research assistant error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;


router.post('/reports', authRequired, requireRole('researcher', 'policymaker'), (req, res) => {
  try {
    const { document_ids, report } = req.body || {};
    if (!Array.isArray(document_ids) || document_ids.length < 2 || !report) {
      return res.status(400).json({ success: false, error: 'document_ids and report are required.' });
    }
    const now = new Date().toISOString();
    const result = db.prepare(`
      INSERT INTO research_reports (created_by, document_ids_json, report_json, created_at)
      VALUES (?, ?, ?, ?)
    `).run(req.user.id, JSON.stringify(document_ids), JSON.stringify(report), now);
    res.status(201).json({ success: true, id: Number(result.lastInsertRowid), created_at: now });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Unable to save research report.' });
  }
});

router.get('/reports', authRequired, requireRole('researcher', 'policymaker'), (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM research_reports WHERE created_by = ? ORDER BY id DESC').all(req.user.id);
    res.json({ success: true, data: rows.map(r => ({
      id: r.id, document_ids: JSON.parse(r.document_ids_json), report: JSON.parse(r.report_json), created_at: r.created_at
    }))});
  } catch {
    res.status(500).json({ success: false, error: 'Unable to load reports.' });
  }
});

router.get('/reports/:id', authRequired, requireRole('researcher', 'policymaker'), (req, res) => {
  try {
    const r = db.prepare('SELECT * FROM research_reports WHERE id = ? AND created_by = ?').get(req.params.id, req.user.id);
    if (!r) return res.status(404).json({ success: false, error: 'Report not found.' });
    res.json({ success: true, data: { id: r.id, document_ids: JSON.parse(r.document_ids_json), report: JSON.parse(r.report_json), created_at: r.created_at }});
  } catch {
    res.status(500).json({ success: false, error: 'Unable to load report.' });
  }
});
