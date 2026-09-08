import express from 'express';
import db from '../db.js';
import { getLiveDILRMP } from '../liveData.js';

const router = express.Router();

// GET /api/dashboard-metrics - summary cards for home overview
router.get('/dashboard-metrics', (req, res) => {
  try {
    const totalDocs = db.prepare('SELECT COUNT(*) as count FROM documents').get().count;
    const totalDistricts = db.prepare('SELECT COUNT(*) as count FROM districts').get().count;
    const totalSimulations = db.prepare('SELECT COUNT(*) as count FROM simulations').get().count;
    
    // Calculate average dispute reduction from all simulations
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
      } catch (e) {
        // ignore
      }
    }

    const avgDisputeReduction = simCountWithReduction > 0 
      ? Math.round(totalReduction / simCountWithReduction) 
      : null;

    // District stats
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
        total_monitored_disputes: districtStats.total_disputes || null,
        avg_digitization_progress: districtStats.avg_digitization == null ? null : Math.round(districtStats.avg_digitization * 10) / 10,
        avg_land_use_efficiency: districtStats.avg_efficiency == null ? null : Math.round(districtStats.avg_efficiency * 10) / 10,
        total_pending_court_cases: districtStats.total_pending_cases || null
      }
    });
  } catch (err) {
    console.error('Dashboard metrics error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/analytics/trends - rich analytics for charts and visualizations
router.get('/trends', async (req, res) => {
  try {
    const themeRows = db.prepare(`
      SELECT theme, COUNT(*) as count
      FROM documents
      GROUP BY theme
      ORDER BY count DESC
    `).all();

    const live = await getLiveDILRMP();
    const districts = (live.districts || []).map(d => ({
      name: d.district,
      state: d.state,
      clr_completed_villages: d.clr_completed_villages,
      digitized_mapsheets: d.digitized_mapsheets,
      maps_linked_to_ror: d.maps_linked_to_ror,
      sro_computerized: d.sro_computerized,
      sro_integrated_with_land_records: d.sro_integrated_with_land_records
    }));

    const simulations = db.prepare(`
      SELECT policy_type, predicted_impact_json
      FROM simulations
      ORDER BY id DESC
    `).all();
    const grouped = new Map();
    for (const row of simulations) {
      let impact = {};
      try { impact = JSON.parse(row.predicted_impact_json || '{}'); } catch {}
      const reduction = Number(impact.dispute_reduction_pct);
      if (!Number.isFinite(reduction)) continue;
      const current = grouped.get(row.policy_type) || { intervention: row.policy_type, total: 0, count: 0 };
      current.total += reduction;
      current.count += 1;
      grouped.set(row.policy_type, current);
    }
    const policyEfficacy = [...grouped.values()].map(x => ({
      intervention: x.intervention,
      avg_reduction: Math.round(x.total / x.count),
      efficiency_gain: null,
      risk: 'Model output',
      sample_count: x.count
    }));

    res.json({
      success: true,
      live: Boolean(live.success),
      stale: Boolean(live.stale),
      live_source: live.source,
      live_source_url: live.source_url,
      live_fetched_at: live.fetched_at,
      live_national: live.national,
      documents_by_theme: themeRows,
      districts_comparison: districts,
      multi_year_trend: [],
      policy_efficacy_benchmarks: policyEfficacy,
      disclaimer: 'Charts use official DILRMP runtime data where available. No fabricated historical trend or policy benchmark is presented. Policy simulations are model forecasts, not official statistics.'
    });
  } catch (err) {
    console.error('Analytics trends error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
