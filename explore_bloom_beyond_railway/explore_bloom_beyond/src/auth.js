const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { query } = require('./db');

const COOKIE_NAME = 'ebb_session';
let generatedDevelopmentSecret;

function getJwtSecret() {
  const configured = String(process.env.JWT_SECRET || '');
  if (configured.length >= 32) return configured;
  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET must be set to at least 32 random characters in production.');
  }
  generatedDevelopmentSecret ||= crypto.randomBytes(48).toString('hex');
  return generatedDevelopmentSecret;
}

function createSessionToken(user) {
  return jwt.sign(
    { sub: user.id, role: user.role, email: user.email },
    getJwtSecret(),
    { expiresIn: '7d', issuer: 'explore-bloom-beyond', audience: 'website' }
  );
}

function setSessionCookie(res, user) {
  const token = createSessionToken(user);
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/'
  });
}

function clearSessionCookie(res) {
  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/'
  });
}

async function attachUser(req, res, next) {
  try {
    const token = req.cookies?.[COOKIE_NAME];
    if (!token) {
      req.user = null;
      return next();
    }
    const payload = jwt.verify(token, getJwtSecret(), {
      issuer: 'explore-bloom-beyond',
      audience: 'website'
    });
    const result = await query(
      `SELECT id, full_name, email, phone, nationality, role, status, created_at
       FROM users WHERE id = $1`,
      [payload.sub]
    );
    if (!result.rowCount || result.rows[0].status !== 'active') {
      clearSessionCookie(res);
      req.user = null;
      return next();
    }
    req.user = result.rows[0];
    return next();
  } catch (error) {
    clearSessionCookie(res);
    req.user = null;
    return next();
  }
}

function requireAuth(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'Please log in to continue.' });
  return next();
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Please log in to continue.' });
    if (!roles.includes(req.user.role)) return res.status(403).json({ error: 'You do not have permission for this action.' });
    return next();
  };
}

function publicUser(user) {
  if (!user) return null;
  return {
    id: user.id,
    fullName: user.full_name,
    email: user.email,
    phone: user.phone,
    nationality: user.nationality,
    role: user.role,
    status: user.status,
    createdAt: user.created_at
  };
}

module.exports = {
  COOKIE_NAME,
  getJwtSecret,
  setSessionCookie,
  clearSessionCookie,
  attachUser,
  requireAuth,
  requireRole,
  publicUser
};
