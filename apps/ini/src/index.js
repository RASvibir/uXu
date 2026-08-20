import { neon } from '@neondatabase/serverless';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

function json(data, status = 200) {
  return Response.json(data, { status, headers: CORS_HEADERS });
}

async function resolveSession(sql, token) {
  if (!token) return null;
  try {
    const sessions = await sql`
      select s.*, u.role, u.email, u.id as user_db_id
      from neon_auth.session s
      join neon_auth.users u on s.email = u.email
      where s.token = ${token} and s.expires_at > now()
    `;
    if (!sessions.length) return null;
    const row = sessions[0];
    let sudo = false;

    if (row.role === 'ADMIN' && row.sudo_activated_at) {
      const activatedAt = new Date(row.sudo_activated_at).getTime();
      sudo = (Date.now() - activatedAt) < (60 * 60 * 1000);
    }

    await sql`
      update neon_auth.session
      set last_accessed = now()
      where token = ${token}
    `;

    return {
      token,
      userId: row.user_db_id || row.user_id,
      email: row.email,
      role: row.role,
      sudo,
    };
  } catch (err) {
    console.error('Session resolution error:', err);
    return null;
  }
}

function getAuthToken(request) {
  const authHeader = request.headers.get('Authorization') || '';
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  return match ? match[1].trim() : null;
}

async function handleRoot() {
  return json({ status: 'ok', service: 'uxu-ini-auth' });
}

async function handleLogin(sql, request) {
  if (request.method !== 'POST') return json({ error: 'method not allowed' }, 405);
  try {
    const body = await request.json();
    const email = (body.email || body.username || '').trim();
    const password = (body.password || '').trim();

    if (!email || !password) {
      return json({ error: 'email and password required' }, 400);
    }
    const users = await sql`select id, password_hash, role, email from neon_auth.users where lower(email) = lower(${email})`;
    if (!users.length) {
      return json({ error: 'invalid credentials' }, 401);
    }
    const user = users[0];
    if (user.password_hash !== password) {
      return json({ error: 'invalid credentials' }, 401);
    }
    
    const token = `token_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    
    await sql`
      insert into neon_auth.session (token, user_id, email, role, expires_at)
      values (${token}, ${user.id}, ${user.email}, ${user.role}, now() + interval '1 hour')
    `;
    
    return json({ token, email: user.email, role: user.role }, 200);
  } catch (err) {
    console.error('Login error:', err);
    return json({ error: 'login failed', detail: String(err) }, 500);
  }
}

async function handleMe(sql, request, ctx) {
  if (!ctx.session) {
    return json({ error: 'unauthorized' }, 401);
  }
  return json({
    userId: ctx.session.userId,
    email: ctx.session.email,
    role: ctx.session.role,
    sudo: ctx.session.sudo,
  });
}

async function handleSudo(sql, request, ctx) {
  if (request.method !== 'POST') return json({ error: 'method not allowed' }, 405);
  if (!ctx.session) {
    return json({ error: 'unauthorized' }, 401);
  }
  if (ctx.session.role !== 'ADMIN') {
    return json({ error: 'forbidden: admin only' }, 403);
  }
  try {
    await sql`
      update neon_auth.session
      set sudo_activated_at = now()
      where token = ${ctx.session.token}
    `;
    return json({ sudo: true, validFor: '60 minutes' }, 200);
  } catch (err) {
    console.error('SUDO elevation error:', err);
    return json({ error: 'sudo activation failed' }, 500);
  }
}

const ROUTES = {
  '/': handleRoot,
  '/api/auth/login': handleLogin,
  '/api/auth/me': handleMe,
  '/api/auth/sudo': handleSudo,
};

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }
    if (!env.DATABASE_URL) {
      return json({ error: 'DATABASE_URL binding missing' }, 500);
    }
    const sql = neon(env.DATABASE_URL);
    try {
      const url = new URL(request.url);
      const handler = ROUTES[url.pathname];
      if (!handler) {
        return json({ error: 'not found' }, 404);
      }
      const token = getAuthToken(request);
      const session = await resolveSession(sql, token);
      const ctx = { session, token };
      return await handler(sql, request, ctx);
    } catch (err) {
      console.error('Handler error:', err);
      return json({ error: 'internal server error', detail: String(err) }, 500);
    }
  },
};
