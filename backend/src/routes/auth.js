import express from 'express';
import db from '../db.js';
import { hashPassword, verifyPassword, issueSession, clearSession, authRequired } from '../auth.js';

const router = express.Router();
const ROLES = new Set(['researcher', 'policymaker', 'public']);

router.post('/register', (req, res) => {
  try {
    const { name, email, password, role = 'public', designation = '' } = req.body || {};
    if (!name || !email || !password) return res.status(400).json({ success: false, error: 'Name, email and password are required.' });
    if (!ROLES.has(role)) return res.status(400).json({ success: false, error: 'Invalid role.' });
    if (password.length < 8) return res.status(400).json({ success: false, error: 'Password must be at least 8 characters.' });
    const normalized = String(email).trim().toLowerCase();
    if (db.prepare('SELECT id FROM users WHERE lower(email) = ?').get(normalized)) return res.status(409).json({ success: false, error: 'An account with this email already exists.' });
    const now = new Date().toISOString();
    const result = db.prepare(`
      INSERT INTO users (name, role, email, designation, password_hash, is_active, created_at)
      VALUES (?, ?, ?, ?, ?, 1, ?)
    `).run(String(name).trim(), role, normalized, String(designation).trim(), hashPassword(password), now);
    const user = db.prepare('SELECT id, name, role, email, designation FROM users WHERE id = ?').get(result.lastInsertRowid);
    issueSession(res, user);
    res.status(201).json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Unable to create account.' });
  }
});

router.post('/login', (req, res) => {
  try {
    const { email, password } = req.body || {};
    const normalized = String(email || '').trim().toLowerCase();
    if (!normalized || !password) return res.status(400).json({ success: false, error: 'Email and password are required.' });
    const row = db.prepare('SELECT * FROM users WHERE lower(email) = ?').get(normalized);
    if (!row || !row.is_active || !row.password_hash || !verifyPassword(password, row.password_hash)) {
      return res.status(401).json({ success: false, error: 'Invalid email or password.' });
    }
    const now = new Date().toISOString();
    db.prepare('UPDATE users SET last_login_at = ? WHERE id = ?').run(now, row.id);
    const user = { id: row.id, name: row.name, role: row.role, email: row.email, designation: row.designation };
    issueSession(res, user);
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Unable to sign in.' });
  }
});

router.post('/logout', (req, res) => {
  clearSession(res);
  res.json({ success: true });
});

router.get('/me', authRequired, (req, res) => {
  res.json({ success: true, user: req.user });
});

export default router;
