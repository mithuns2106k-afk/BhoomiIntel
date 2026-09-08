import express from 'express';
import db from '../db.js';
import { getAnthropicApiKey, isClaudeConfigured } from '../ai/claude.js';
import { authRequired, requireRole } from '../auth.js';

const router = express.Router();

// GET /api/config/status - check AI configuration
router.get('/status', (req, res) => {
  try {
    const configured = isClaudeConfigured();
    const apiKey = getAnthropicApiKey();
    const maskedKey = apiKey ? `${apiKey.slice(0, 7)}...${apiKey.slice(-4)}` : null;

    res.json({
      success: true,
      claude_configured: configured,
      masked_key: maskedKey,
      active_model: process.env.CLAUDE_MODEL || 'claude-sonnet-4-6',
      mode: configured ? 'live-claude' : 'unconfigured'
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/config/api-key - update Claude API key dynamically
router.post('/api-key', authRequired, requireRole('policymaker'), (req, res) => {
  try {
    const { api_key } = req.body;
    if (!api_key || typeof api_key !== 'string') {
      return res.status(400).json({ success: false, error: 'Valid api_key string is required' });
    }

    const trimmed = api_key.trim();
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO system_config (key, value, updated_at)
      VALUES ('anthropic_api_key', ?, ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
    `).run(trimmed, now);

    res.json({
      success: true,
      message: 'Anthropic API key updated successfully.',
      claude_configured: true,
      masked_key: `${trimmed.slice(0, 7)}...${trimmed.slice(-4)}`
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/config/reset-key - reset to demo mode
router.post('/reset-key', authRequired, requireRole('policymaker'), (req, res) => {
  try {
    db.prepare("DELETE FROM system_config WHERE key = 'anthropic_api_key'").run();
    res.json({
      success: true,
      message: 'API key cleared. System is now running in demo simulation mode.',
      claude_configured: false
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
