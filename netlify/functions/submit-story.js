const { createClient } = require('@supabase/supabase-js');
const { verifySession, isValidStory } = require('./lib/security.cjs');
function cookieValue(header, name) {
  return (header || '').split(';').map(v => v.trim()).find(v => v.startsWith(`${name}=`))?.slice(name.length + 1) || '';
}
exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers: { Allow: 'POST' }, body: 'Method not allowed' };
  const { SESSION_SECRET, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;
  if (!SESSION_SECRET || SESSION_SECRET.length < 32 || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return { statusCode: 503, body: JSON.stringify({ error: 'Penyimpanan belum dikonfigurasi.' }) };
  const token = cookieValue(event.headers.cookie || event.headers.Cookie, 'adek_session');
  if (!verifySession(token, SESSION_SECRET)) return { statusCode: 401, body: JSON.stringify({ error: 'Sesi berakhir. Masuk lagi ya.' }) };
  let body; try { body = JSON.parse(event.body || '{}'); } catch { return { statusCode: 400, body: JSON.stringify({ error: 'Cerita tidak terbaca.' }) }; }
  if (!isValidStory(body.story)) return { statusCode: 400, body: JSON.stringify({ error: 'Tulis sedikit ceritamu dulu ya.' }) };
  if (body.story.length > 100000) return { statusCode: 413, body: JSON.stringify({ error: 'Cerita terlalu panjang untuk satu kiriman.' }) };
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
  const { error } = await supabase.from('vent_entries').insert({ content: body.story.trim() });
  if (error) return { statusCode: 500, body: JSON.stringify({ error: 'Cerita belum berhasil disimpan. Coba lagi sebentar ya.' }) };
  return { statusCode: 201, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }, body: JSON.stringify({ ok: true }) };
};
