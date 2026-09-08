import express from 'express';
import db from '../db.js';
import { simulatePolicyIntervention } from '../ai/claude.js';
import { authRequired, requireRole } from '../auth.js';
import { auditAI } from '../audit.js';

const router = express.Router();

// POST /api/simulate - run AI policy simulation
router.post('/', authRequired, requireRole('policymaker', 'researcher'), async (req, res) => {
  try {
    const {
      district_id,
      policy_type = 'Digitize Land Records & Cadastral Drone Mapping',
      rollout_pct = 80,
      timeline_years = 3,
      enforcement_level = 'high',
      focus_area = 'balanced'
    } = req.body;

    if (!district_id) {
      return res.status(400).json({ success: false, error: 'district_id is required' });
    }

    const district = db.prepare('SELECT * FROM districts WHERE id = ?').get(district_id);
    if (!district) {
      return res.status(404).json({ success: false, error: `District with ID ${district_id} not found` });
    }

    // Call Claude AI simulation engine
    const prediction = await simulatePolicyIntervention({
      district,
      policyType: policy_type,
      rolloutPct: Number(rollout_pct),
      timelineYears: Number(timeline_years),
      enforcementLevel: enforcement_level,
      focusArea: focus_area
    });

    const now = new Date().toISOString();
    const paramsJson = JSON.stringify({
      district_id: district.id,
      rollout_pct: Number(rollout_pct),
      timeline_years: Number(timeline_years),
      enforcement_level,
      focus_area
    });
    const impactJson = JSON.stringify(prediction);

    const stmt = db.prepare(`
      INSERT INTO simulations (
        district_id, district_name, policy_type, parameters_json, predicted_impact_json, created_at, user_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(district.id, district.name, policy_type, paramsJson, impactJson, now, req.user.id);
    const simulationId = Number(result.lastInsertRowid);
    auditAI({
      userId: req.user.id,
      operation: 'policy_simulation',
      input: { district_id: district.id, policy_type, rollout_pct, timeline_years, enforcement_level, focus_area },
      output: prediction,
      modelName: prediction.provider || process.env.CLAUDE_MODEL || 'unknown',
      success: true
    });

    res.status(201).json({
      success: true,
      simulation_id: simulationId,
      district: {
        id: district.id,
        name: district.name,
        state: district.state,
        baseline_disputes: district.dispute_count,
        baseline_efficiency: district.land_use_efficiency,
        climate_vulnerability: district.climate_vulnerability_index
      },
      policy_type,
      parameters: {
        rollout_pct: Number(rollout_pct),
        timeline_years: Number(timeline_years),
        enforcement_level,
        focus_area
      },
      predicted_impact: prediction,
      created_at: now
    });
  } catch (err) {
    console.error('Policy simulation error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/simulate - list past simulations
router.get('/', authRequired, requireRole('policymaker', 'researcher'), (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM simulations WHERE user_id = ? OR user_id IS NULL ORDER BY id DESC LIMIT 50').all(req.user.id);
    const simulations = rows.map(r => ({
      id: r.id,
      district_id: r.district_id,
      district_name: r.district_name,
      policy_type: r.policy_type,
      parameters: JSON.parse(r.parameters_json || '{}'),
      predicted_impact: JSON.parse(r.predicted_impact_json || '{}'),
      created_at: r.created_at
    }));

    res.json({ success: true, count: simulations.length, data: simulations });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/simulate/:id - get single simulation
router.get('/:id', authRequired, requireRole('policymaker', 'researcher'), (req, res) => {
  try {
    const row = db.prepare('SELECT * FROM simulations WHERE id = ?').get(req.params.id);
    if (!row || (row.user_id && Number(row.user_id) !== Number(req.user.id))) {
      return res.status(404).json({ success: false, error: 'Simulation not found' });
    }

    res.json({
      success: true,
      data: {
        id: row.id,
        district_id: row.district_id,
        district_name: row.district_name,
        policy_type: row.policy_type,
        parameters: JSON.parse(row.parameters_json || '{}'),
        predicted_impact: JSON.parse(row.predicted_impact_json || '{}'),
        created_at: row.created_at
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/simulate/:id
router.delete('/:id', authRequired, requireRole('policymaker', 'researcher'), (req, res) => {
  try {
    const simId = req.params.id;
    const row = db.prepare('SELECT user_id FROM simulations WHERE id = ?').get(simId);
    if (!row) return res.status(404).json({ success: false, error: 'Simulation not found' });
    if (row.user_id && Number(row.user_id) !== Number(req.user.id)) {
      return res.status(403).json({ success: false, error: 'You can only remove your own simulations.' });
    }
    db.prepare('DELETE FROM simulations WHERE id = ?').run(simId);
    res.json({ success: true, message: 'Simulation run removed.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
