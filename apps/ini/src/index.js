import { neon } from '@neondatabase/serverless';

const ROOT_ID = '0?0.uXu.0000';
const ALLOWED_ORIGINS = [
  'https://rasvibir.github.io',
  'http://localhost:8787',
  'http://127.0.0.1:8787',
  'http://localhost:5500',
  'http://127.0.0.1:5500',
];

function corsHeaders(request) {
  const origin = request.headers.get('Origin') || '';
  const allow = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allow,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Session-Token, X-Sudo',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
}

function json(request, data, status = 200) {
  return Response.json(data, { status, headers: corsHeaders(request) });
}

function bearerToken(request) {
  const auth = request.headers.get('Authorization') || '';
  if (auth.toLowerCase().startsWith('bearer ')) return auth.slice(7).trim();
  return (request.headers.get('X-Session-Token') || '').trim() || null;
}

function mapRole(dbRole) {
  if (dbRole === 'admin') return 'ADMIN';
  if (dbRole) return 'USER';
  return 'GUEST';
}

async function resolveSession(sql, request) {
  const token = bearerToken(request);
  if (!token) return { role: 'GUEST', user: null, session: null, sudo: false };

  const rows = await sql`
    select
      u.id,
      u.email,
      u.name,
      u.role as db_role,
      u.banned,
      s.token as session_token,
      s."expiresAt" as expires_at
    from neon_auth.session s
    join neon_auth."user" u on u.id = s."userId"
    where s.token = ${token}
      and s."expiresAt" > now()
    limit 1
  `;

  if (!rows.length) return { role: 'GUEST', user: null, session: null, sudo: false, invalid: true };

  const row = rows[0];
  if (row.banned) return { role: 'GUEST', user: null, session: null, sudo: false, banned: true };

  const role = mapRole(row.db_role);
  const sudoRequested = (request.headers.get('X-Sudo') || '').toLowerCase() === '1';
  const sudo = role === 'ADMIN' && sudoRequested;
  const mode = sudo ? 'ADMIN' : role === 'GUEST' ? 'GUEST' : 'USER';

  return {
    role,
    sudo,
    mode,
    user: {
      id: row.id,
      email: row.email,
      name: row.name,
      dbRole: row.db_role,
    },
    session: {
      token: row.session_token,
      expiresAt: row.expires_at,
    },
  };
}

async function requireUser(sql, request) {
  const ctx = await resolveSession(sql, request);
  if (!ctx.user) {
    return { error: json(request, { error: 'not signed in' }, 401), ctx };
  }
  return { ctx };
}

async function requireAdminSudo(sql, request) {
  const { ctx, error } = await requireUser(sql, request);
  if (error) return { error, ctx };
  if (ctx.role !== 'ADMIN') {
    return { error: json(request, { error: 'admin role required' }, 403), ctx };
  }
  if (!ctx.sudo) {
    return { error: json(request, { error: 'sudo required — run SUDO in 0?0 first' }, 403), ctx };
  }
  return { ctx };
}

async function logAuthEvent(sql, { userId, email, eventType, detail }) {
  await sql`
    insert into uxu_auth_events (user_id, email, event_type, detail)
    values (${userId || null}, ${email || null}, ${eventType}, ${detail || null})
  `;
}

async function handleRoot(sql, request) {
  const root = await sql`select * from archive_records where id = ${ROOT_ID} limit 1`;
  const children = await sql`
    select id, title, type, status, parent, path, summary
    from archive_records
    where parent = ${ROOT_ID}
    order by id
  `;
  return json(request, { root: root[0] || null, children });
}

async function handleRegistry(sql, request) {
  const records = await sql`
    select * from archive_records order by root, parent nulls first, id
  `;
  return json(request, { records });
}

async function handleProvenance(sql, request) {
  const events = await sql`
    select * from provenance_events order by event_date desc limit 200
  `;
  return json(request, { events });
}

async function handleLogs(sql, request) {
  const logs = await sql`
    select * from transparency_logs order by created_at desc limit 200
  `;
  return json(request, { logs });
}

async function handleManuals(sql, request) {
  const manuals = await sql`
    select slug, title, updated_at
    from manual_pages
    order by title
  `;
  return json(request, { manuals });
}

async function handleManualBySlug(sql, request, slug) {
  const rows = await sql`
    select slug, title, body, updated_at
    from manual_pages
    where slug = ${slug}
    limit 1
  `;
  if (!rows.length) {
    return json(request, { error: 'manual not found', slug }, 404);
  }
  return json(request, { manual: rows[0] });
}

async function handleSystem(sql, request) {
  const root = await sql`
    select schema_version, updated_at, status
    from archive_records
    where id = ${ROOT_ID}
    limit 1
  `;
  const row = root[0] || {};
  return json(request, {
    system: {
      schema_version: row.schema_version || '1.0.0',
      runtime: 'cloudflare-worker',
      neon_branch: 'production',
      status: row.status || 'unknown',
      updated_at: row.updated_at || null,
    },
  });
}

async function handleAuthMe(sql, request) {
  const ctx = await resolveSession(sql, request);
  if (ctx.invalid) return json(request, { error: 'session invalid or expired', role: 'GUEST' }, 401);
  if (ctx.banned) return json(request, { error: 'account banned', role: 'GUEST' }, 403);
  return json(request, {
    role: ctx.role,
    sudo: ctx.sudo,
    mode: ctx.mode,
    user: ctx.user,
    session: ctx.session
      ? { expiresAt: ctx.session.expiresAt }
      : null,
  });
}

async function handleAuthConfig(request, env) {
  return json(request, {
    authBaseUrl: env.NEON_AUTH_BASE_URL || null,
    signupEnabled: true,
    roles: ['GUEST', 'USER', 'ADMIN'],
    claim: {
      method: 'CLAIM MASTER <bootstrap-secret>',
      note: 'First-time master admin bootstrap. After claim, use SUDO to elevate.',
    },
  });
}

async function handleClaimMaster(sql, request, env) {
  const { ctx, error } = await requireUser(sql, request);
  if (error) return error;

  let body = {};
  try {
    body = await request.json();
  } catch {
    return json(request, { error: 'JSON body required' }, 400);
  }

  const secret = String(body.secret || '').trim();
  const expected = (env.ADMIN_BOOTSTRAP_SECRET || '').trim();
  if (!expected) {
    return json(request, { error: 'ADMIN_BOOTSTRAP_SECRET not configured on Worker' }, 503);
  }
  if (!secret || secret !== expected) {
    await logAuthEvent(sql, {
      userId: ctx.user.id,
      email: ctx.user.email,
      eventType: 'claim_master_denied',
      detail: 'invalid bootstrap secret',
    });
    return json(request, { error: 'invalid bootstrap secret' }, 403);
  }

  if (env.MASTER_ADMIN_EMAIL) {
    const allowed = String(env.MASTER_ADMIN_EMAIL).trim().toLowerCase();
    if (ctx.user.email.toLowerCase() !== allowed) {
      return json(request, { error: `master email must be ${allowed}` }, 403);
    }
  }

  await sql`
    update neon_auth."user"
    set role = 'admin', "updatedAt" = now()
    where id = ${ctx.user.id}
  `;

  await logAuthEvent(sql, {
    userId: ctx.user.id,
    email: ctx.user.email,
    eventType: 'claim_master',
    detail: 'bootstrap secret accepted; role set to admin',
  });

  return json(request, {
    ok: true,
    role: 'ADMIN',
    message: 'Master administrator claimed. Run SUDO to elevate this session.',
    user: { ...ctx.user, dbRole: 'admin' },
  });
}

async function handleSudo(sql, request) {
  const { ctx, error } = await requireUser(sql, request);
  if (error) return error;
  if (ctx.role !== 'ADMIN') {
    return json(request, { error: 'only ADMIN accounts can SUDO' }, 403);
  }

  await logAuthEvent(sql, {
    userId: ctx.user.id,
    email: ctx.user.email,
    eventType: 'sudo',
    detail: 'admin elevated session',
  });

  return json(request, {
    ok: true,
    role: 'ADMIN',
    sudo: true,
    mode: 'ADMIN',
    message: 'SUDO engaged. Admin commands unlocked until UNSUDO or sign-out.',
  });
}

async function handleUnsudo(sql, request) {
  const { ctx, error } = await requireUser(sql, request);
  if (error) return error;

  await logAuthEvent(sql, {
    userId: ctx.user.id,
    email: ctx.user.email,
    eventType: 'unsudo',
    detail: 'admin dropped elevation',
  });

  return json(request, {
    ok: true,
    role: ctx.role,
    sudo: false,
    mode: ctx.role,
    message: 'SUDO dropped. Signed in as ' + ctx.role + '.',
  });
}

async function handleAuthEvents(sql, request) {
  const { error } = await requireAdminSudo(sql, request);
  if (error) return error;
  const events = await sql`
    select id, user_id, email, event_type, detail, created_at
    from uxu_auth_events
    order by created_at desc
    limit 100
  `;
  return json(request, { events });
}

async function handleSignOut(sql, request) {
  const token = bearerToken(request);
  if (token) {
    const rows = await sql`
      delete from neon_auth.session
      where token = ${token}
      returning "userId"
    `;
    if (rows.length) {
      await logAuthEvent(sql, {
        userId: rows[0].userId,
        eventType: 'sign_out',
        detail: 'session revoked via worker',
      });
    }
  }
  return json(request, { ok: true, role: 'GUEST' });
}

const GET_ROUTES = {
  '/api/root': handleRoot,
  '/api/root/registry': handleRegistry,
  '/api/root/provenance': handleProvenance,
  '/api/root/logs': handleLogs,
  '/api/root/manuals': handleManuals,
  '/api/root/system': handleSystem,
  '/api/auth/me': handleAuthMe,
  '/api/auth/config': (sql, request, env) => handleAuthConfig(request, env),
  '/api/auth/events': handleAuthEvents,
};

const MANUAL_SLUG_RE = /^\/api\/root\/manuals\/([a-z0-9][a-z0-9_-]*)$/i;

const POST_ROUTES = {
  '/api/auth/claim-master': handleClaimMaster,
  '/api/auth/sudo': handleSudo,
  '/api/auth/unsudo': handleUnsudo,
  '/api/auth/sign-out': handleSignOut,
};

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(request) });
    }

    const url = new URL(request.url);

    if (!env.DATABASE_URL) {
      return json(request, { error: 'DATABASE_URL missing' }, 500);
    }

    const sql = neon(env.DATABASE_URL);

    try {
      if (request.method === 'GET') {
        const manualMatch = url.pathname.match(MANUAL_SLUG_RE);
        if (manualMatch) {
          return await handleManualBySlug(sql, request, decodeURIComponent(manualMatch[1]));
        }
        const handler = GET_ROUTES[url.pathname];
        if (!handler) return json(request, { error: 'not found' }, 404);
        return await handler(sql, request, env);
      }

      if (request.method === 'POST') {
        const handler = POST_ROUTES[url.pathname];
        if (!handler) return json(request, { error: 'not found' }, 404);
        return await handler(sql, request, env);
      }

      return json(request, { error: 'method not allowed' }, 405);
    } catch (err) {
      return json(request, { error: 'query failed', detail: String(err) }, 500);
    }
  },
};
