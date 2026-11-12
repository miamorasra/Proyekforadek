const { passwordsMatch, createSession } = require('./lib/security.cjs');
const COOKIE = 'adek_session';
exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers: { Allow: 'POST' }, body: 'Method not allowed' };
  const { GUEST_PASSWORD, SESSION_SECRET } = process.env;
  if (!GUEST_PASSWORD || !SESSION_SECRET || SESSION_SECRET.length < 32) return { statusCode: 503, body: JSON.stringify({ error: 'Akses belum dikonfigurasi.' }) };
  let body; try { body = JSON.parse(event.body || '{}'); } catch { return { statusCode: 400, body: JSON.stringify({ error: 'Permintaan tidak valid.' }) }; }
  if (!passwordsMatch(GUEST_PASSWORD, body.password)) return { statusCode: 401, body: JSON.stringify({ error: 'Password belum tepat. Coba lagi ya, sayang.' }) };
  const token = createSession(SESSION_SECRET);
  const host = event.headers.host || '';
  const secure = !host.startsWith('localhost') && !host.startsWith('127.0.0.1');
  const cookie = `${COOKIE}=${token}; HttpOnly; ${secure ? 'Secure; ' : ''}SameSite=Strict; Path=/; Max-Age=86400`;
  return { statusCode: 200, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'Set-Cookie': cookie }, body: JSON.stringify({ ok: true }) };
};
