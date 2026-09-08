import express from 'express';
import cors from 'cors';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import fs from 'node:fs';

import db from './db.js';
import { seedDatabase } from './seed.js';

import documentsRouter from './routes/documents.js';
import searchRouter from './routes/search.js';
import simulateRouter from './routes/simulate.js';
import districtsRouter from './routes/districts.js';
import assistantRouter from './routes/assistant.js';
import analyticsRouter from './routes/analytics.js';
import configRouter from './routes/config.js';
import intelligenceRouter from './routes/intelligence.js';
import authRouter from './routes/auth.js';
import { getLiveDILRMP, liveStatus, getLiveSourceCatalog } from './liveData.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
const allowedOrigin = process.env.FRONTEND_URL || true;
app.use(cors({ origin: allowedOrigin, credentials: true }));
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Static file hosting for uploaded and sample documents
app.use('/data', express.static(path.resolve(__dirname, '../data')));

// Ensure database has initial seeds
try {
  const docCount = db.prepare('SELECT COUNT(*) as count FROM documents').get().count;
  if (docCount === 0) {
    seedDatabase();
  }
} catch (err) {
  console.warn('Auto-seed check notice:', err.message);
}

// API Routes
app.use('/api/auth', authRouter);
const aiHits = new Map();
app.use(['/api/search', '/api/simulate', '/api/research-assistant'], (req, res, next) => {
  const key = req.ip || 'unknown';
  const now = Date.now();
  const hits = (aiHits.get(key) || []).filter(t => now - t < 60_000);
  if (hits.length >= 30) return res.status(429).json({ success: false, error: 'Too many AI requests. Please wait a minute.' });
  hits.push(now); aiHits.set(key, hits); next();
});

app.use('/api/documents', documentsRouter);
app.use('/api/search', searchRouter);
app.use('/api/simulate', simulateRouter);
app.use('/api/districts', districtsRouter);
app.use('/api/research-assistant', assistantRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/config', configRouter);
app.use('/api/intelligence', intelligenceRouter);

// Direct shortcut for dashboard metrics matching prompt spec: GET /api/dashboard-metrics
app.get('/api/dashboard-metrics', (req, res) => {
  try {
    const totalDocs = db.prepare('SELECT COUNT(*) as count FROM documents').get().count;
    const totalDistricts = db.prepare('SELECT COUNT(*) as count FROM districts').get().count;
    const totalSimulations = db.prepare('SELECT COUNT(*) as count FROM simulations').get().count;

    const allSims = db.prepare('SELECT predicted_impact_json FROM simulations').all();
    let totalReduction = 0;
    let simCountWithReduction = 0;

    for (const sim of allSims) {
      try {
        const impact = JSON.parse(sim.predicted_impact_json || '{}');
        if (impact.dispute_reduction_pct) {
          totalReduction += Number(impact.dispute_reduction_pct);
          simCountWithReduction++;
        }
      } catch (e) {}
    }

    const avgDisputeReduction = simCountWithReduction > 0 
      ? Math.round(totalReduction / simCountWithReduction) 
      : 0;

    const districtStats = db.prepare(`
      SELECT 
        SUM(dispute_count) as total_disputes,
        AVG(digitization_progress_pct) as avg_digitization,
        AVG(land_use_efficiency) as avg_efficiency,
        SUM(pending_court_cases) as total_pending_cases
      FROM districts
    `).get();

    res.json({
      success: true,
      metrics: {
        total_research_docs: totalDocs,
        active_policy_simulations: totalSimulations,
        districts_covered: totalDistricts,
        avg_dispute_reduction_pct: avgDisputeReduction,
        total_monitored_disputes: districtStats.total_disputes || 0,
        avg_digitization_progress: Math.round((districtStats.avg_digitization || 0) * 10) / 10,
        avg_land_use_efficiency: Math.round((districtStats.avg_efficiency || 0) * 10) / 10,
        total_pending_court_cases: districtStats.total_pending_cases || 0
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Live official land-governance source
app.get('/api/live/status', (req, res) => {
  res.json({ success: true, ...liveStatus(), generated_at: new Date().toISOString() });
});

app.get('/api/live/sources', (req, res) => {
  res.json({ success: true, sources: getLiveSourceCatalog(), generated_at: new Date().toISOString() });
});

app.get('/api/live/dilrmp', async (req, res) => {
  try {
    const data = await getLiveDILRMP({ force: req.query.refresh === '1' });
    res.status(data.success ? 200 : 503).json(data);
  } catch (err) {
    res.status(503).json({ success: false, live: false, error: err.message });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    platform: 'BhoomiIntel / LandGov AI',
    problem_statement: 'SIH 26019 - Ministry of Rural Development',
    version: '3.2.2',
    ai_model: process.env.CLAUDE_MODEL || 'claude-sonnet-4-6',
    live_data_source: 'DILRMP-MIS / Department of Land Resources',
    live_data_mode: 'runtime_fetch_with_10_minute_cache',
    ocr_mode: process.env.ENABLE_OCR === 'true' ? 'enabled' : 'optional_not_enabled',
    timestamp: new Date().toISOString()
  });
});

// Serve the production React build when it exists, turning the project into a single deployable website.
const frontendDist = path.resolve(__dirname, '../../frontend/dist');
if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/') || req.path.startsWith('/data/')) return next();
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
}

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({
    success: false,
    error: err.message || 'Internal server error occurred in BhoomiIntel platform'
  });
});

app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`BhoomiIntel Land Governance Backend running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
  console.log(`Smart India Hackathon Problem Statement 26019`);
  console.log(`=======================================================`);
});
