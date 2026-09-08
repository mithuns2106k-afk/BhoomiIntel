import db from '../db.js';
import { embedText, cosineSimilarity } from './embeddings.js';

// Simple stop words list for query processing
const STOP_WORDS = new Set([
  'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and',
  'any', 'are', 'aren\'t', 'as', 'at', 'be', 'because', 'been', 'before', 'being',
  'below', 'between', 'both', 'but', 'by', 'can', 'can\'t', 'cannot', 'could',
  'did', 'do', 'does', 'doing', 'down', 'during', 'each', 'few', 'for', 'from',
  'further', 'had', 'has', 'have', 'having', 'he', 'her', 'here', 'hers', 'herself',
  'him', 'himself', 'his', 'how', 'i', 'if', 'in', 'into', 'is', 'it', 'its',
  'itself', 'let\'s', 'me', 'more', 'most', 'my', 'myself', 'no', 'nor', 'not',
  'of', 'off', 'on', 'once', 'only', 'or', 'other', 'ought', 'our', 'ours',
  'ourselves', 'out', 'over', 'own', 'same', 'she', 'should', 'so', 'some', 'such',
  'than', 'that', 'the', 'their', 'theirs', 'them', 'themselves', 'then', 'there',
  'these', 'they', 'this', 'those', 'through', 'to', 'too', 'under', 'until', 'up',
  'very', 'was', 'we', 'were', 'what', 'when', 'where', 'which', 'while', 'who',
  'whom', 'why', 'with', 'would', 'you', 'your', 'yours', 'yourself', 'yourselves'
]);

function tokenize(text) {
  if (!text) return [];
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(token => token.length > 2 && !STOP_WORDS.has(token));
}

// Split document text into coherent paragraphs/chunks
export function chunkDocument(text, chunkSize = 800) {
  if (!text) return [];
  const paragraphs = text.split(/\n\s*\n/);
  const chunks = [];
  let currentChunk = '';

  for (const para of paragraphs) {
    const cleanPara = para.trim();
    if (!cleanPara) continue;

    if ((currentChunk + '\n\n' + cleanPara).length > chunkSize && currentChunk.length > 0) {
      chunks.push(currentChunk.trim());
      currentChunk = cleanPara;
    } else {
      currentChunk = currentChunk ? currentChunk + '\n\n' + cleanPara : cleanPara;
    }
  }

  if (currentChunk.trim().length > 0) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}

// Retrieve relevant document chunks using BM25 / TF-IDF style ranking
export async function retrieveRelevantChunks(query, options = {}) {
  const { topK = 5, themeFilter, districtFilter } = options;
  const conditions = [];
  const params = [];
  if (themeFilter) { conditions.push('d.theme = ?'); params.push(themeFilter); }
  if (districtFilter) { conditions.push('d.district_tags LIKE ?'); params.push(`%${districtFilter}%`); }

  let sql = `SELECT d.id as docId, d.title, d.category, d.theme, d.author, d.district_tags as districtTags,
                    c.chunk_index, c.text as excerpt, c.embedding
             FROM documents d JOIN document_chunks c ON c.document_id = d.id`;
  if (conditions.length) sql += ' WHERE ' + conditions.join(' AND ');
  sql += ' ORDER BY d.id DESC';
  let rows = params.length ? db.prepare(sql).all(...params) : db.prepare(sql).all();

  // Backward-compatible index rebuild for older databases.
  if (!rows.length) {
    const docs = db.prepare('SELECT id, title, category, theme, author, district_tags as districtTags, extracted_text FROM documents').all();
    const insert = db.prepare('INSERT OR IGNORE INTO document_chunks (document_id, chunk_index, text, created_at) VALUES (?, ?, ?, ?)');
    for (const d of docs) {
      chunkDocument(d.extracted_text, 800).forEach((chunk, i) => insert.run(d.id, i, chunk, new Date().toISOString()));
    }
    rows = db.prepare(sql).all(...params);
  }

  const queryTokens = tokenize(query);
  let queryEmbedding = null;
  try { queryEmbedding = await embedText(query); } catch {}

  const scored = [];
  for (const row of rows) {
    const tokens = tokenize(row.excerpt);
    const titleTokens = tokenize(row.title);
    const themeTokens = tokenize(row.theme);
    const tagTokens = tokenize(row.districtTags || '');
    let lexical = 0;
    const matched = new Set();

    for (const token of queryTokens) {
      const occurrences = tokens.filter(t => t === token || t.includes(token) || token.includes(t)).length;
      if (occurrences) { lexical += occurrences * 2.5; matched.add(token); }
      if (titleTokens.includes(token)) { lexical += 6; matched.add(token); }
      if (themeTokens.includes(token)) { lexical += 4; matched.add(token); }
      if (tagTokens.includes(token)) { lexical += 5; matched.add(token); }
    }
    lexical *= 1 + (matched.size / Math.max(queryTokens.length, 1)) * 2;

    let semantic = 0;
    if (queryEmbedding) {
      let rowEmbedding = row.embedding;
      if (!rowEmbedding) {
        try {
          rowEmbedding = JSON.stringify(await embedText(row.excerpt));
          db.prepare('UPDATE document_chunks SET embedding = ? WHERE document_id = ? AND chunk_index = ?').run(rowEmbedding, row.docId, row.chunk_index);
        } catch {}
      }
      if (rowEmbedding) {
        try { semantic = cosineSimilarity(queryEmbedding, JSON.parse(rowEmbedding)); } catch {}
      }
    }
    const score = lexical + semantic * 20;
    if (score > 0 || !queryTokens.length) {
      scored.push({ ...row, score: Math.round(score * 10) / 10 });
    }
  }

  if (!scored.length) return [];
  scored.sort((a, b) => b.score - a.score);
  const selected = [];
  const counts = new Map();
  for (const item of scored) {
    const count = counts.get(item.docId) || 0;
    if (count < 2 || selected.length < topK) {
      selected.push({ ...item, chunkIndex: item.chunk_index, districtTags: item.districtTags });
      counts.set(item.docId, count + 1);
      if (selected.length >= topK) break;
    }
  }
  return selected;
}
