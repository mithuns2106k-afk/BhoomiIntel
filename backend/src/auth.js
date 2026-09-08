import crypto from 'node:crypto';
import db from './db.js';

const TOKEN_COOKIE = 'bhoomi_session';
const TTL_SECONDS = 8 * 60 * 60;

function base64url(input) {
  return Buffer.from(input).toString('base64url');
}

export function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const derived = crypto.scryptSync(password, salt, 64);
  return `${salt.toString('hex')}:${derived.toString('hex')}`;
}

export function verifyPassword(password, stored) {
  try {
    const [saltHex, hashHex] = String(stored).split(':');
    const derived = crypto.scryptSync(password, Buffer.from(saltHex, 'hex'), 64);
    return crypto.timingSafeEqual(Buffer.from(hashHex, 'hex'), derived);
  } catch {
    return false;
  }
}

function sign(payload) {
  const secret = process.env.JWT_SECRET || 'change-this-development-secret';
  const body = base64url(JSON.stringify(payload));
  const sig = crypto.createHmac('sha256', secret).update(body).digest('base64url');
  return `${body}.${sig}`;
}

function verify(token) {
  try {
    const secret = process.env.JWT_SECRET || 'change-this-development-secret';
    const [body, sig] = token.split('.');
    if (!body || !sig) return null;
    const expected = crypto.createHmac('sha256', secret).update(body).digest('base64url');
    if (sig.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString());
    if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

function parseCookies(header = '') {
  return Object.fromEntries(header.split(';').filter(Boolean).map(part => {
    const i = part.indexOf('=');
    return [part.slice(0, i).trim(), decodeURIComponent(part.slice(i + 1).trim())];
  }));
}

export function issueSession(res, user) {
  const token = sign({
    sub: user.id,
    role: user.role,
    email: user.email,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + TTL_SECONDS
  });
  res.setHeader('Set-Cookie', `${TOKEN_COOKIE}=${encodeURIComponent(token)}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${TTL_SECONDS}`);
}

export function clearSession(res) {
  res.setHeader('Set-Cookie', `${TOKEN_COOKIE}=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0`);
}

export function authRequired(req, res, next) {
  const token = parseCookies(req.headers.cookie || '')[TOKEN_COOKIE];
  const payload = token ? verify(token) : null;
  if (!payload) return res.status(401).json({ success: false, error: 'Authentication required.' });
  const user = db.prepare('SELECT id, name, role, email, designation, is_active FROM users WHERE id = ?').get(payload.sub);
  if (!user || !user.is_active) return res.status(401).json({ success: false, error: 'Session is invalid or inactive.' });
  req.user = user;
  next();
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ success: false, error: 'Authentication required.' });
    if (!roles.includes(req.user.role)) return res.status(403).json({ success: false, error: 'You do not have permission for this operation.' });
    next();
  };
}

export function optionalAuth(req, _res, next) {
  const token = parseCookies(req.headers.cookie || '')[TOKEN_COOKIE];
  const payload = token ? verify(token) : null;
  if (payload) {
    req.user = db.prepare('SELECT id, name, role, email, designation, is_active FROM users WHERE id = ?').get(payload.sub) || null;
  }
  next();
}
