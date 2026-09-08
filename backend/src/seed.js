import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import db from './db.js';
import { hashPassword } from './auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sampleDataDir = path.resolve(__dirname, '../../sample-data');
const backendDataDir = path.resolve(__dirname, '../data');
const samplePapersDir = path.resolve(backendDataDir, 'sample_papers');

if (!fs.existsSync(samplePapersDir)) {
  fs.mkdirSync(samplePapersDir, { recursive: true });
}

export function seedDatabase() {
  console.log('Seeding BhoomiIntel Database...');

  // 1. Seed Users
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  const insertUser = db.prepare(`
    INSERT OR IGNORE INTO users (name, role, email, designation, password_hash, is_active, created_at)
    VALUES (?, ?, ?, ?, ?, 1, ?)
  `);
  const now = new Date().toISOString();
  if (userCount === 0) {
    insertUser.run('Dr. Ananya Sharma', 'researcher', 'researcher@bhoomiintel.local', 'Lead Land Policy Researcher', hashPassword('Research@123'), now);
    insertUser.run('Rajesh Verma', 'policymaker', 'policymaker@bhoomiintel.local', 'Land Governance Policy Officer', hashPassword('Policy@123'), now);
    insertUser.run('Citizen Observer', 'public', 'public@bhoomiintel.local', 'Public Knowledge Access', hashPassword('Public@123'), now);
    console.log('Seed: Development users created.');
  } else {
    const legacy = [
      ['Dr. Ananya Sharma', 'researcher', 'researcher@bhoomiintel.local', 'Lead Land Policy Researcher', 'Research@123'],
      ['Rajesh Verma', 'policymaker', 'policymaker@bhoomiintel.local', 'Land Governance Policy Officer', 'Policy@123'],
      ['Citizen Observer', 'public', 'public@bhoomiintel.local', 'Public Knowledge Access', 'Public@123']
    ];
    for (const u of legacy) {
      const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(u[2]);
      if (!existing) insertUser.run(u[0], u[1], u[2], u[3], hashPassword(u[4]), now);
    }
    db.prepare("UPDATE users SET password_hash = ? WHERE email = 'researcher@bhoomiintel.local' AND (password_hash IS NULL OR password_hash = '')").run(hashPassword('Research@123'));
    db.prepare("UPDATE users SET password_hash = ? WHERE email = 'policymaker@bhoomiintel.local' AND (password_hash IS NULL OR password_hash = '')").run(hashPassword('Policy@123'));
    db.prepare("UPDATE users SET password_hash = ? WHERE email = 'public@bhoomiintel.local' AND (password_hash IS NULL OR password_hash = '')").run(hashPassword('Public@123'));
  }

  // 2. Seed Districts from GeoJSON
  const districtCount = db.prepare('SELECT COUNT(*) as count FROM districts').get().count;
  if (districtCount === 0) {
    const geojsonPath = path.join(sampleDataDir, 'districts.geojson');
    if (fs.existsSync(geojsonPath)) {
      const geojson = JSON.parse(fs.readFileSync(geojsonPath, 'utf-8'));
      const insertDistrict = db.prepare(`
        INSERT INTO districts (
          id, name, state, dispute_count, climate_vulnerability_index,
          land_use_efficiency, geojson_coords, agricultural_pct, urban_pct,
          forest_pct, digitization_progress_pct, pending_court_cases,
          population, dispute_density_per_sqkm, area_sqkm, common_dispute_types,
          key_challenges
        ) VALUES (
          @id, @name, @state, @dispute_count, @climate_vulnerability_index,
          @land_use_efficiency, @geojson_coords, @agricultural_pct, @urban_pct,
          @forest_pct, @digitization_progress_pct, @pending_court_cases,
          @population, @dispute_density_per_sqkm, @area_sqkm, @common_dispute_types,
          @key_challenges
        )
      `);

      for (const feature of geojson.features) {
        const p = feature.properties;
        insertDistrict.run({
          id: p.id,
          name: p.name,
          state: p.state,
          dispute_count: p.dispute_count,
          climate_vulnerability_index: p.climate_vulnerability_index,
          land_use_efficiency: p.land_use_efficiency,
          geojson_coords: JSON.stringify(feature.geometry),
          agricultural_pct: p.agricultural_pct,
          urban_pct: p.urban_pct,
          forest_pct: p.forest_pct,
          digitization_progress_pct: p.digitization_progress_pct,
          pending_court_cases: p.pending_court_cases,
          population: p.population,
          dispute_density_per_sqkm: p.dispute_density_per_sqkm,
          area_sqkm: p.area_sqkm,
          common_dispute_types: JSON.stringify(p.common_dispute_types || []),
          key_challenges: p.key_challenges
        });
      }
      console.log(`Seed: ${geojson.features.length} districts loaded from GeoJSON.`);
    }
  }

  // 3. Seed Documents
  const docCount = db.prepare('SELECT COUNT(*) as count FROM documents').get().count;
  if (docCount === 0) {
    const docsDir = path.join(sampleDataDir, 'sample_documents');
    if (fs.existsSync(docsDir)) {
      const files = fs.readdirSync(docsDir).filter(f => f.endsWith('.txt'));
      const insertDoc = db.prepare(`
        INSERT INTO documents (
          title, category, theme, upload_date, file_path, extracted_text,
          uploaded_by_role, author, district_tags
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      for (const file of files) {
        const filePath = path.join(docsDir, file);
        const content = fs.readFileSync(filePath, 'utf-8');

        // Parse header metadata if present
        let title = file.replace(/_/g, ' ').replace(/\.txt$/, '');
        let category = 'National Policy Document';
        let theme = 'Land Records Digitization';
        let author = 'Ministry of Rural Development';
        let districtTags = 'Pune, Varanasi, Bengaluru Rural';
        let uploadDate = '2025-01-20';

        const lines = content.split('\n');
        for (const line of lines.slice(0, 10)) {
          if (line.startsWith('TITLE:')) title = line.replace('TITLE:', '').trim();
          if (line.startsWith('CATEGORY:')) category = line.replace('CATEGORY:', '').trim();
          if (line.startsWith('THEME:')) theme = line.replace('THEME:', '').trim();
          if (line.startsWith('AUTHOR:')) author = line.replace('AUTHOR:', '').trim();
          if (line.startsWith('DISTRICT_TAGS:')) districtTags = line.replace('DISTRICT_TAGS:', '').trim();
          if (line.startsWith('DATE:')) uploadDate = line.replace('DATE:', '').trim();
        }

        // Copy file to sample_papers
        const destPath = path.join(samplePapersDir, file);
        fs.writeFileSync(destPath, content);

        insertDoc.run(
          title,
          category,
          theme,
          uploadDate,
          `/data/sample_papers/${file}`,
          content,
          'researcher',
          author,
          districtTags
        );
      }
      console.log(`Seed: ${files.length} sample policy papers seeded.`);
      // Persist chunks for seeded documents.
      const seededDocs = db.prepare('SELECT id, extracted_text FROM documents').all();
      const chunkStmt = db.prepare('INSERT OR IGNORE INTO document_chunks (document_id, chunk_index, text, created_at) VALUES (?, ?, ?, ?)');
      for (const doc of seededDocs) {
        const paragraphs = doc.extracted_text.split(/\n\s*\n/).map(s => s.trim()).filter(Boolean);
        let chunks = [];
        for (const para of paragraphs) {
          const last = chunks[chunks.length - 1];
          if (last && last.length + para.length + 2 <= 900) chunks[chunks.length - 1] = `${last}\n\n${para}`;
          else chunks.push(para);
        }
        chunks.forEach((chunk, i) => chunkStmt.run(doc.id, i, chunk, new Date().toISOString()));
      }
    }
  }

  // 4. Seed Baseline Simulations
  const simCount = db.prepare('SELECT COUNT(*) as count FROM simulations').get().count;
  if (simCount === 0) {
    const insertSim = db.prepare(`
      INSERT INTO simulations (district_id, district_name, policy_type, parameters_json, predicted_impact_json, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    // Simulation 1: Pune - Digitize Land Records at 80% Rollout
    const sim1Params = {
      rollout_pct: 80,
      timeline_years: 3,
      enforcement_level: 'high',
      focus_area: 'balanced'
    };
    const sim1Impact = {
      policy_name: "Digitize Land Records & Cadastral Blockchain Hashing",
      district_name: "Pune",
      dispute_reduction_pct: 42,
      projected_dispute_count: 8282,
      baseline_dispute_count: 14280,
      land_use_efficiency_change_pct: 12.8,
      projected_land_use_efficiency: 87.3,
      agricultural_preservation_score: 82,
      economic_value_unlocked_crores: 510,
      budget_feasibility: "High",
      implementation_risk_score: 28,
      rationale: "Digitizing 80% of cadastral parcels with CORS-based drone mapping in Pune eradicates legacy pot-hissa discrepancies and speeds up mutation clearances from 94 to 14 days.",
      key_beneficiaries: ["Smallholder Farmers", "Peri-urban Homeowners", "Commercial Banks"],
      risk_factors: [
        "Elderly farmer digital literacy gap during online objection periods",
        "Legacy partition deeds lacking explicit spatial metes and bounds",
        "High Court writ petitions challenging drone orthophoto accuracy"
      ],
      timeline_milestones: [
        { year: 1, dispute_reduction_pct: 14, projected_dispute_count: 12280, milestone: "Phase 1: DGPS control network & public village objection camp." },
        { year: 2, dispute_reduction_pct: 28, projected_dispute_count: 10280, milestone: "Phase 2: 55% cadastral overlay complete; automated sub-registrar integration." },
        { year: 3, dispute_reduction_pct: 42, projected_dispute_count: 8282, milestone: "Phase 3: 80% rollout consolidated; conclusive title certification issued." }
      ],
      is_ai_generated: true,
      provider: "claude-3-5-sonnet"
    };

    insertSim.run(
      1,
      'Pune',
      'Digitize Land Records & Cadastral Blockchain Hashing',
      JSON.stringify(sim1Params),
      JSON.stringify(sim1Impact),
      '2026-02-15T10:30:00Z'
    );

    // Simulation 2: Varanasi - Dedicated Fast-Track Dispute Tribunals
    const sim2Params = {
      rollout_pct: 75,
      timeline_years: 2,
      enforcement_level: 'high',
      focus_area: 'dispute_resolution'
    };
    const sim2Impact = {
      policy_name: "Specialized Fast-Track Land Dispute Tribunals",
      district_name: "Varanasi",
      dispute_reduction_pct: 46,
      projected_dispute_count: 6183,
      baseline_dispute_count: 11450,
      land_use_efficiency_change_pct: 8.5,
      projected_land_use_efficiency: 76.7,
      agricultural_preservation_score: 79,
      economic_value_unlocked_crores: 380,
      budget_feasibility: "Medium",
      implementation_risk_score: 35,
      rationale: "Implementing dedicated revenue tribunals with 180-day summary disposal caps directly addresses Varanasi's 5,920 pending court cases, accelerating capital unlocking in riverine agricultural belts.",
      key_beneficiaries: ["Co-sharing Khata Heirs", "Small Agricultural Tenants", "District Revenue Registry"],
      risk_factors: [
        "Shortage of retired judicial officers willing to preside over rural tehsil benches",
        "Bar association boycotts over strict statutory adjournment limits",
        "Seasonal monsoon floods delaying on-ground commissioner inspections"
      ],
      timeline_milestones: [
        { year: 1, dispute_reduction_pct: 23, projected_dispute_count: 8816, milestone: "Tribunals established in 5 tehsils; pre-litigation Lok Adalats launched." },
        { year: 2, dispute_reduction_pct: 46, projected_dispute_count: 6183, milestone: "Summary disposal protocol active; digital evidence integration live." }
      ],
      is_ai_generated: true,
      provider: "claude-3-5-sonnet"
    };

    insertSim.run(
      2,
      'Varanasi',
      'Specialized Fast-Track Land Dispute Tribunals',
      JSON.stringify(sim2Params),
      JSON.stringify(sim2Impact),
      '2026-02-28T14:15:00Z'
    );

    console.log('Seed: Baseline policy simulations seeded.');
  }

  console.log('BhoomiIntel Database seeding complete.');
}

// Run directly if invoked from command line
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  seedDatabase();
}
