import express from 'express';
import db from '../db.js';
import { authRequired, requireRole } from '../auth.js';
import { generateRAGAnswer } from '../ai/claude.js';
import { auditAI } from '../audit.js';

const router = express.Router();

const normalize = (v) => String(v ?? '').trim().toLowerCase().replace(/\s+/g, ' ');
const firstMatch = (text, patterns) => {
  for (const pattern of patterns) {
    const m = String(text || '').match(pattern);
    if (m?.[1]) return m[1].trim();
  }
  return null;
};
const extractFields = (text) => ({
  applicant_name: firstMatch(text, [/(?:applicant|owner|landowner|name)\s*[:\-]\s*([^\n,;]+)/i, /(?:नाम|आवेदक)\s*[:\-]\s*([^\n,;]+)/i]),
  survey_number: firstMatch(text, [/(?:survey|khasra|plot|gat)\s*(?:no\.?|number)?\s*[:\-]?\s*([A-Z0-9\/-]+)/i, /(?:सर्वे|खसरा)\s*(?:नं|नंबर)?\s*[:\-]?\s*([A-Z0-9\/-]+)/i]),
  land_area: firstMatch(text, [/(?:land\s*area|area|extent)\s*[:\-]?\s*([0-9]+(?:\.[0-9]+)?\s*(?:acre|acres|hectare|ha|sq\.?\s*m|sqm))/i]),
  district: firstMatch(text, [/(?:district|zilla)\s*[:\-]\s*([^\n,;]+)/i]),
  document_date: firstMatch(text, [/(?:date|issued\s*on|registration\s*date)\s*[:\-]\s*([0-9]{1,2}[\/-][0-9]{1,2}[\/-][0-9]{2,4})/i])
});

router.post('/verify', authRequired, requireRole('researcher', 'policymaker'), (req, res) => {
  try {
    const ids = Array.isArray(req.body.document_ids) ? req.body.document_ids.map(Number).filter(Boolean).slice(0, 6) : [];
    if (ids.length < 2) return res.status(400).json({ success: false, error: 'Select at least 2 documents.' });
    const placeholders = ids.map(() => '?').join(',');
    const docs = db.prepare(`SELECT id,title,category,theme,author,district_tags,extracted_text FROM documents WHERE id IN (${placeholders}) AND publication_status='published'`).all(...ids);
    if (docs.length < 2) return res.status(404).json({ success: false, error: 'At least two published documents are required.' });

    const parsed = docs.map(d => ({ id: d.id, title: d.title, fields: extractFields(d.extracted_text) }));
    const fields = ['applicant_name','survey_number','land_area','district','document_date'];
    const checks = fields.map(field => {
      const values = parsed.map(d => ({ document_id: d.id, title: d.title, value: d.fields[field] })).filter(x => x.value);
      const unique = [...new Set(values.map(x => normalize(x.value)))];
      let status = values.length < 2 ? 'insufficient_evidence' : unique.length === 1 ? 'match' : 'conflict';
      return { field, status, values };
    });
    const conflicts = checks.filter(c => c.status === 'conflict');
    const score = Math.max(0, Math.min(100, 100 - conflicts.length * 18 - checks.filter(c => c.status === 'insufficient_evidence').length * 4));
    const risk = score >= 85 ? 'LOW' : score >= 65 ? 'MEDIUM' : 'HIGH';
    res.json({ success: true, documents: parsed, checks, risk_score: score, risk_level: risk, recommendation: conflicts.length ? 'Manual verification recommended before approval.' : 'No extracted field conflicts detected. Continue with standard verification.' });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.get('/overview', authRequired, (req, res) => {
  try {
    const districts = db.prepare('SELECT id,name,state,dispute_count,digitization_progress_pct,pending_court_cases,climate_vulnerability_index,land_use_efficiency FROM districts ORDER BY dispute_count DESC').all();
    const ranked = districts.map(d => {
      const risk = Math.round(Math.min(100, Math.max(0, (100 - (d.digitization_progress_pct || 0)) * 0.45 + (d.climate_vulnerability_index || 0) * 0.25 + Math.min(100, (d.dispute_count || 0) / 180) * 0.3)));
      const alerts = [];
      if (d.digitization_progress_pct < 80) alerts.push('Digitization below 80%');
      if (d.pending_court_cases > 4500) alerts.push('High court-case backlog');
      if (d.climate_vulnerability_index > 70) alerts.push('High climate vulnerability');
      return { ...d, risk_score: risk, risk_level: risk >= 70 ? 'HIGH' : risk >= 45 ? 'MEDIUM' : 'LOW', alerts };
    });
    const alerts = ranked.flatMap(d => d.alerts.map(message => ({ district_id: d.id, district: d.name, state: d.state, message, risk_score: d.risk_score })));
    res.json({ success: true, districts: ranked, alerts: alerts.slice(0, 12), methodology: 'Risk score combines digitization gap, dispute burden and climate vulnerability. It is an analytical indicator, not an official government risk rating.' });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.post('/explain', authRequired, requireRole('researcher','policymaker'), async (req, res) => {
  try {
    const { district_id, metric = 'risk_score' } = req.body;
    const district = db.prepare('SELECT * FROM districts WHERE id=?').get(district_id);
    if (!district) return res.status(404).json({ success:false,error:'District not found' });
    const risk = Math.round(Math.min(100, Math.max(0, (100 - (district.digitization_progress_pct || 0)) * 0.45 + (district.climate_vulnerability_index || 0) * 0.25 + Math.min(100, (district.dispute_count || 0) / 180) * 0.3)));
    const context = `District ${district.name}, ${district.state}. Disputes: ${district.dispute_count}. Digitization: ${district.digitization_progress_pct}%. Court cases: ${district.pending_court_cases}. Climate vulnerability: ${district.climate_vulnerability_index}. Land-use efficiency: ${district.land_use_efficiency}. Computed risk score: ${risk}/100. Metric: ${metric}.`;
    const result = await generateRAGAnswer(`Explain this district metric in plain language. Identify the strongest contributing factors, what a policymaker should investigate next, and avoid claiming causation from this sample data. ${context}`, []);
    auditAI({ userId:req.user.id, operation:'district_metric_explanation', input:{district_id,metric}, output:result, modelName:result.provider || process.env.CLAUDE_MODEL || 'unknown', success:true });
    res.json({ success:true, district:district.name, risk_score:risk, explanation:result.answer, provider:result.provider, disclaimer:'AI explanation is decision support only. Verify against official records before taking administrative action.' });
  } catch (err) { res.status(500).json({ success:false,error:err.message }); }
});

export default router;
