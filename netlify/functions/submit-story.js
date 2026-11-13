
const { createClient } = require('@supabase/supabase-js');
const { verifySession, isValidStory } = require('./lib/security.cjs');

function cookieValue(header, name) {
  return (header || '')
    .split(';')
    .map((value) => value.trim())
    .find((value) => value.startsWith(`${name}=`))
    ?.slice(name.length + 1) || '';
}

function jsonResponse(statusCode, data) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store'
    },
    body: JSON.stringify(data)
  };
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { Allow: 'POST' },
      body: 'Method not allowed'
    };
  }

  const {
    SESSION_SECRET,
    SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY
  } = process.env;

  if (
    !SESSION_SECRET ||
    SESSION_SECRET.length < 32 ||
    !SUPABASE_URL ||
    !SUPABASE_SERVICE_ROLE_KEY
  ) {
    return jsonResponse(503, {
      error: 'Penyimpanan belum dikonfigurasi.'
    });
  }

  const token = cookieValue(
    event.headers?.cookie || event.headers?.Cookie,
    'adek_session'
  );

  if (!verifySession(token, SESSION_SECRET)) {
    return jsonResponse(401, {
      error: 'Sesi berakhir. Masuk lagi ya.'
    });
  }

  let body;

  try {
    body = JSON.parse(event.body || '{}');
  } catch {
    return jsonResponse(400, {
      error: 'Cerita tidak terbaca.'
    });
  }

  if (!isValidStory(body.story)) {
    return jsonResponse(400, {
      error: 'Tulis sedikit ceritamu dulu ya.'
    });
  }

  // Tidak ada lagi batas khusus 100.000 karakter di sini.
  const supabase = createClient(
    SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: { persistSession: false }
    }
  );

  try {
    const { error } = await supabase
      .from('vent_entries')
      .insert({
        content: body.story.trim()
      });

    if (error) {
      // Jangan pernah mencatat isi cerita atau API key.
      console.error('submit-story Supabase insert failed:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      });

      return jsonResponse(500, {
        error: 'Cerita belum berhasil disimpan. Coba lagi sebentar ya.'
      });
    }

    return jsonResponse(201, {
      ok: true
    });

  } catch (error) {
    console.error('submit-story unexpected error:', {
      message: error.message
    });

    return jsonResponse(500, {
      error: 'Terjadi gangguan saat menyimpan cerita.'
    });
  }
};
