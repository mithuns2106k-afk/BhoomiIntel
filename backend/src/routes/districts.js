import express from 'express';
import db from '../db.js';
import { getLiveDILRMP } from '../liveData.js';

const router = express.Router();

// GET /api/districts - returns GeoJSON FeatureCollection
router.get('/', async (req, res) => {
  try {
    const districts = db.prepare('SELECT * FROM districts ORDER BY name ASC').all();

    const features = districts.map(d => {
      let geometry = null;
      try {
        geometry = JSON.parse(d.geojson_coords);
      } catch (e) {
        // default fallback polygon
        geometry = { type: 'Polygon', coordinates: [] };
      }

      let commonDisputeTypes = [];
      try {
        commonDisputeTypes = JSON.parse(d.common_dispute_types || '[]');
      } catch (e) {
        commonDisputeTypes = [];
      }

      return {
        type: 'Feature',
        id: d.id,
        geometry,
        properties: {
          id: d.id,
          name: d.name,
          state: d.state,
          dispute_count: d.dispute_count,
          climate_vulnerability_index: d.climate_vulnerability_index,
          land_use_efficiency: d.land_use_efficiency,
          agricultural_pct: d.agricultural_pct,
          urban_pct: d.urban_pct,
          forest_pct: d.forest_pct,
          digitization_progress_pct: d.digitization_progress_pct,
          pending_court_cases: d.pending_court_cases,
          population: d.population,
          dispute_density_per_sqkm: d.dispute_density_per_sqkm,
          area_sqkm: d.area_sqkm,
          common_dispute_types: commonDisputeTypes,
          key_challenges: d.key_challenges
        }
      };
    });

    // Merge live DILRMP indicators when the official portal is reachable.
    const live = await getLiveDILRMP();
    const liveRows = new Map((live.districts || []).map(row => [`${row.state}|${row.district}`.toLowerCase().replace(/[^a-z0-9|]/g, ''), row]));
    const normalize = (v) => String(v || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    for (const feature of features) {
      const p = feature.properties;
      const key = `${normalize(p.state)}|${normalize(p.name)}`;
      const row = [...liveRows.entries()].find(([k]) => k === key)?.[1];
      if (row) {
        p.live_source = 'DILRMP-MIS';
        p.live_clr_completed_villages = row.clr_completed_villages;
        p.live_digitized_mapsheets = row.digitized_mapsheets;
        p.live_maps_linked_to_ror = row.maps_linked_to_ror;
        p.live_sro_computerized = row.sro_computerized;
        p.live_sro_integrated_with_land_records = row.sro_integrated_with_land_records;
      }
    }

    res.json({
      type: 'FeatureCollection',
      metadata: {
        total_districts: features.length,
        data_mode: live.success ? 'live_official_plus_local_geometry' : 'live_source_unavailable',
        live_source: live.source,
        live_source_url: live.source_url,
        live_fetched_at: live.fetched_at,
        live_stale: Boolean(live.stale),
        live_error: live.error || null,
        disclaimer: live.success
          ? 'Official DILRMP indicators are fetched at runtime. District geometry and non-DILRMP indicators remain local platform data.'
          : 'The official DILRMP source could not be reached. No simulated live values are substituted.'
      },
      features
    });
  } catch (err) {
    console.error('Districts route error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/districts/:id - single district profile with related research documents
router.get('/:id', (req, res) => {
  try {
    const district = db.prepare('SELECT * FROM districts WHERE id = ?').get(req.params.id);
    if (!district) {
      return res.status(404).json({ success: false, error: 'District not found' });
    }

    let commonDisputeTypes = [];
    try {
      commonDisputeTypes = JSON.parse(district.common_dispute_types || '[]');
    } catch (e) {
      commonDisputeTypes = [];
    }

    // Find related documents matching district name or tags
    const relatedDocs = db.prepare(`
      SELECT id, title, category, theme, author, upload_date
      FROM documents
      WHERE district_tags LIKE ? OR extracted_text LIKE ?
      ORDER BY id DESC
      LIMIT 6
    `).all(`%${district.name}%`, `%${district.name}%`);

    // Find previous simulations for this district
    const pastSimulations = db.prepare(`
      SELECT id, policy_type, parameters_json, predicted_impact_json, created_at
      FROM simulations
      WHERE district_id = ?
      ORDER BY id DESC
      LIMIT 5
    `).all(district.id).map(s => ({
      id: s.id,
      policy_type: s.policy_type,
      parameters: JSON.parse(s.parameters_json || '{}'),
      predicted_impact: JSON.parse(s.predicted_impact_json || '{}'),
      created_at: s.created_at
    }));

    res.json({
      success: true,
      data: {
        ...district,
        common_dispute_types: commonDisputeTypes,
        related_documents: relatedDocs,
        past_simulations: pastSimulations
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
