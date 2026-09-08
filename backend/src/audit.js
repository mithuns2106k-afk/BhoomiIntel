import db from './db.js';

export function auditAI({ userId = null, operation, input, sourceDocumentIds = [], modelName = '', output = null, success = true }) {
  try {
    db.prepare(`INSERT INTO ai_audit_logs
      (user_id, operation, input_json, source_document_ids_json, model_name, output_json, success, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).run(
      userId, operation, JSON.stringify(input ?? {}), JSON.stringify(sourceDocumentIds),
      modelName || process.env.CLAUDE_MODEL || 'unknown', JSON.stringify(output ?? {}),
      success ? 1 : 0, new Date().toISOString()
    );
  } catch (err) {
    console.warn('Audit log unavailable:', err.message);
  }
}
