import express from 'express';
import { retrieveRelevantChunks } from '../ai/rag.js';
import { generateRAGAnswer } from '../ai/claude.js';
import db from '../db.js';
import { optionalAuth } from '../auth.js';

const router = express.Router();

// POST /api/search - natural language query -> RAG retrieval -> Claude synthesized answer
router.post('/', optionalAuth, async (req, res) => {
  try {
    const { query, theme, district } = req.body;

    if (!query || !query.trim()) {
      return res.status(400).json({ success: false, error: 'Query parameter is required' });
    }

    const cleanQuery = query.trim();
    
    // 1. Retrieve top matching chunks from repository documents
    const retrievedChunks = await retrieveRelevantChunks(cleanQuery, {
      topK: 4,
      themeFilter: theme && theme !== 'all' ? theme : null,
      districtFilter: district && district !== 'all' ? district : null
    });

    // 2. Synthesize answer using Claude API (or fallback engine)
    const aiResult = await generateRAGAnswer(cleanQuery, retrievedChunks);
    try {
      db.prepare(`INSERT INTO ai_audit_logs (user_id, operation, input_json, source_document_ids_json, model_name, output_json, success, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).run(
        req.user?.id || null, 'research_search', JSON.stringify({ query: cleanQuery, theme, district }),
        JSON.stringify(retrievedChunks.map(c => c.docId)),
        aiResult.provider || process.env.CLAUDE_MODEL || 'unknown',
        JSON.stringify({ answer: aiResult.answer, citations: aiResult.citations }),
        1, new Date().toISOString()
      );
    } catch {}
    res.json({
      success: true,
      query: cleanQuery,
      answer: aiResult.answer,
      citations: aiResult.citations,
      is_ai_generated: Boolean(aiResult.is_ai_generated),
      provider: aiResult.provider,
      chunks_analyzed: retrievedChunks.length
    });
  } catch (err) {
    console.error('Semantic search error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
