const crypto = require('node:crypto');
const SESSION_MS = 24 * 60 * 60 * 1000;
function passwordsMatch(expected, supplied) {
  if (typeof expected !== 'string' || typeof supplied !== 'string') return false;
  const a = Buffer.from(expected); const b = Buffer.from(supplied);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
function isValidStory(value) { return typeof value === 'string' && value.trim().length > 0; }
function createSession(secret, now = Date.now()) {
  const payload = Buffer.from(JSON.stringify({ exp: now + SESSION_MS })).toString('base64url');
  const signature = crypto.createHmac('sha256', secret).update(payload).digest('base64url');
  return `${payload}.${signature}`;
}
function verifySession(token, secret, now = Date.now()) {
  if (typeof token !== 'string' || typeof secret !== 'string') return false;
  const [payload, signature, extra] = token.split('.');
  if (!payload || !signature || extra) return false;
  const expected = crypto.createHmac('sha256', secret).update(payload).digest();
  let actual; try { actual = Buffer.from(signature, 'base64url'); } catch { return false; }
  if (actual.length !== expected.length || !crypto.timingSafeEqual(actual, expected)) return false;
  try { const data = JSON.parse(Buffer.from(payload, 'base64url').toString()); return Number.isFinite(data.exp) && data.exp > now; }
  catch { return false; }
}
module.exports = { SESSION_MS, passwordsMatch, isValidStory, createSession, verifySession };
