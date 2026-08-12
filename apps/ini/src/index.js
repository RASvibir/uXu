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

async function handleTags(sql, request) {
  try {
    const rows = await sql`
      select id, name, slug from tags order by name asc
    `;
    return json(request, { tags: rows });
  } catch (err) {
    // Table may be empty / missing in older DBs — fail soft for the console.
    return json(request, { tags: [], warning: String(err?.message || err) });
  }
}

async function handleTagUpsert(sql, request) {
  let body = {};
  try {
    body = await request.json();
  } catch {
    return json(request, { error: 'invalid json' }, 400);
  }
  const rawName = String(body.name || body.tag || '').trim();
  if (!rawName || rawName.length > 64) {
    return json(request, { error: 'tag name required (max 64 chars)' }, 400);
  }
  const slug = String(body.slug || rawName)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-_]/g, '')
    .slice(0, 64);
  if (!slug) return json(request, { error: 'invalid tag slug' }, 400);

  try {
    const existing = await sql`
      select id, name, slug from tags
      where slug = ${slug} or lower(name) = ${rawName.toLowerCase()}
      limit 1
    `;
    if (existing.length) {
      return json(request, { tag: existing[0], linked: true, created: false });
    }
    const inserted = await sql`
      insert into tags (name, slug)
      values (${rawName}, ${slug})
      returning id, name, slug
    `;
    return json(request, { tag: inserted[0], linked: true, created: true });
  } catch (err) {
    return json(request, { error: 'tag upsert failed', detail: String(err) }, 500);
  }
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
  `;
  // Stable library order: User Guide lands first (0?0 orientation).
  const rank = {
    'user-guide': 0,
    'archive-creation': 1,
    'cybercat-sunflower': 2,
    'master-admin-guide': 3,
    'developers-handbook': 4,
    'source-code-pamphlet': 5,
  };
  manuals.sort((a, b) => {
    const ra = rank[a.slug] ?? 50;
    const rb = rank[b.slug] ?? 50;
    if (ra !== rb) return ra - rb;
    return String(a.title).localeCompare(String(b.title));
  });
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

async function countAdmins(sql) {
  const rows = await sql`
    select count(*)::int as n
    from neon_auth."user"
    where role = 'admin' and coalesce(banned, false) = false
  `;
  return rows[0]?.n || 0;
}

async function getActiveRecovery(sql, userId) {
  if (!userId) return null;
  const rows = await sql`
    select id, user_id, email, two_factor_attested, two_factor_attested_at, created_at
    from uxu_recovery_accounts
    where user_id = ${userId} and revoked_at is null
    limit 1
  `;
  return rows[0] || null;
}

async function handleAuthMe(sql, request) {
  const ctx = await resolveSession(sql, request);
  if (ctx.invalid) return json(request, { error: 'session invalid or expired', role: 'GUEST' }, 401);
  if (ctx.banned) return json(request, { error: 'account banned', role: 'GUEST' }, 403);
  const recovery = ctx.user ? await getActiveRecovery(sql, ctx.user.id) : null;
  const adminCount = await countAdmins(sql);
  return json(request, {
    role: ctx.role,
    sudo: ctx.sudo,
    mode: ctx.mode,
    user: ctx.user,
    recovery: recovery
      ? {
          active: true,
          email: recovery.email,
          twoFactorAttested: !!recovery.two_factor_attested,
          twoFactorAttestedAt: recovery.two_factor_attested_at,
        }
      : { active: false },
    throne: {
      adminCount,
      claimSealed: adminCount > 0,
    },
    session: ctx.session
      ? { expiresAt: ctx.session.expiresAt }
      : null,
  });
}

async function handleAuthConfig(request, env) {
  return json(request, {
    authBaseUrl: env.NEON_AUTH_BASE_URL || null,
    signupEnabled: true,
    roles: ['GUEST', 'USER', 'ADMIN', 'RECOVERY'],
    claim: {
      method: 'CLAIM MASTER <bootstrap-secret>',
      note: 'Founding rite. Sealed once any admin exists. Empty-throne break-glass only.',
      sealedWhenAdminExists: true,
    },
    recovery: {
      commands: ['RECOVERY ADD <email>', 'RECOVERY LIST', 'RECOVERY REMOVE <email>', 'RECOVERY 2FA <email>', 'ASSUME MASTER'],
      minAccounts: 1,
      twoFactor: {
        optional: true,
        neonConsole: 'https://console.neon.tech',
        docs: 'https://neon.com/docs/manage/accounts#two-factor-authentication',
        note: 'Attest 2FA after enabling it on the Neon account that protects the project, and use a strong unique password on the recovery uXu login.',
      },
    },
    setupGuide: 'SETUP MASTER',
  });
}

async function handleClaimMaster(sql, request, env) {
  const { ctx, error } = await requireUser(sql, request);
  if (error) return error;

  const adminCount = await countAdmins(sql);
  const forceSeal = String(env.CLAIM_MASTER_SEALED || '').toLowerCase() === '1';

  // Sealed rite: throne occupied (or operator forced seal)
  if (forceSeal || adminCount > 0) {
    await logAuthEvent(sql, {
      userId: ctx.user.id,
      email: ctx.user.email,
      eventType: 'claim_master_sealed',
      detail: forceSeal ? 'forced seal flag' : `admin_count=${adminCount}`,
    });
    return json(request, {
      ok: false,
      sealed: true,
      lore: true,
      message:
        'CLAIM MASTER :: RITE SEALED\nThe crown is already spoken for.\nCatastrophic recovery is offline — use RECOVERY / ASSUME MASTER or Neon console.\nTry OPEN CYBERCAT instead.',
    }, 403);
  }

  let body = {};
  try {
    body = await request.json();
  } catch {
    return json(request, { error: 'JSON body required' }, 400);
  }

  const secret = String(body.secret || '').trim();
  const expected = (env.ADMIN_BOOTSTRAP_SECRET || '').trim();
  if (!expected) {
    return json(request, {
      error: 'empty throne but ADMIN_BOOTSTRAP_SECRET not configured — set it in Wrangler for break-glass, or promote admin in Neon Auth console',
    }, 503);
  }
  if (!secret || secret !== expected) {
    await logAuthEvent(sql, {
      userId: ctx.user.id,
      email: ctx.user.email,
      eventType: 'claim_master_denied',
      detail: 'invalid bootstrap secret (empty throne)',
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
    detail: 'empty-throne break-glass; role set to admin',
  });

  return json(request, {
    ok: true,
    role: 'ADMIN',
    message: 'Master administrator claimed (empty throne). Run SUDO, then SETUP MASTER to add a recovery account and seal the rite.',
    user: { ...ctx.user, dbRole: 'admin' },
    next: ['SUDO', 'SETUP MASTER', 'RECOVERY ADD <backup-email>'],
  });
}

async function handleRecoveryList(sql, request) {
  const { error } = await requireAdminSudo(sql, request);
  if (error) return error;
  const rows = await sql`
    select id, user_id, email, two_factor_attested, two_factor_attested_at, created_at
    from uxu_recovery_accounts
    where revoked_at is null
    order by created_at asc
  `;
  return json(request, { recovery: rows });
}

async function handleRecoveryAdd(sql, request) {
  const { ctx, error } = await requireAdminSudo(sql, request);
  if (error) return error;

  let body = {};
  try {
    body = await request.json();
  } catch {
    return json(request, { error: 'JSON body required' }, 400);
  }
  const email = String(body.email || '').trim().toLowerCase();
  if (!email || !email.includes('@')) {
    return json(request, { error: 'valid email required' }, 400);
  }
  if (email === String(ctx.user.email || '').toLowerCase()) {
    return json(request, { error: 'use a second email — recovery must not be the same as master' }, 400);
  }

  const users = await sql`
    select id, email, role, banned
    from neon_auth."user"
    where lower(email) = ${email}
    limit 1
  `;
  if (!users.length) {
    return json(request, {
      error: 'no account for that email yet — have them SIGNUP / SIGNIN on 0?0 first, then RECOVERY ADD again',
      email,
    }, 404);
  }
  const target = users[0];
  if (target.banned) {
    return json(request, { error: 'that account is banned' }, 403);
  }

  const existing = await sql`
    select id from uxu_recovery_accounts
    where user_id = ${target.id} and revoked_at is null
    limit 1
  `;
  if (existing.length) {
    return json(request, { ok: true, message: 'already a recovery account', email: target.email });
  }

  await sql`
    insert into uxu_recovery_accounts (user_id, email, added_by)
    values (${target.id}, ${target.email}, ${ctx.user.id})
  `;
  await logAuthEvent(sql, {
    userId: ctx.user.id,
    email: ctx.user.email,
    eventType: 'recovery_add',
    detail: `added recovery ${target.email}`,
  });

  return json(request, {
    ok: true,
    message: `Recovery key added: ${target.email}. Optional: RECOVERY 2FA ${target.email} after they enable 2FA.`,
    email: target.email,
  });
}

async function handleRecoveryRemove(sql, request) {
  const { ctx, error } = await requireAdminSudo(sql, request);
  if (error) return error;

  let body = {};
  try {
    body = await request.json();
  } catch {
    return json(request, { error: 'JSON body required' }, 400);
  }
  const email = String(body.email || '').trim().toLowerCase();
  if (!email) return json(request, { error: 'email required' }, 400);

  const rows = await sql`
    update uxu_recovery_accounts
    set revoked_at = now()
    where lower(email) = ${email} and revoked_at is null
    returning email
  `;
  if (!rows.length) {
    return json(request, { error: 'no active recovery account for that email' }, 404);
  }
  await logAuthEvent(sql, {
    userId: ctx.user.id,
    email: ctx.user.email,
    eventType: 'recovery_remove',
    detail: `revoked recovery ${rows[0].email}`,
  });
  return json(request, { ok: true, message: `Recovery removed: ${rows[0].email}` });
}

async function handleRecoveryAttest2fa(sql, request) {
  const { ctx, error } = await requireAdminSudo(sql, request);
  if (error) return error;

  let body = {};
  try {
    body = await request.json();
  } catch {
    return json(request, { error: 'JSON body required' }, 400);
  }
  const email = String(body.email || '').trim().toLowerCase();
  const attested = body.attested !== false;

  const rows = await sql`
    update uxu_recovery_accounts
    set two_factor_attested = ${attested},
        two_factor_attested_at = case when ${attested} then now() else null end
    where lower(email) = ${email} and revoked_at is null
    returning email, two_factor_attested, two_factor_attested_at
  `;
  if (!rows.length) {
    return json(request, { error: 'no active recovery account for that email' }, 404);
  }
  await logAuthEvent(sql, {
    userId: ctx.user.id,
    email: ctx.user.email,
    eventType: 'recovery_2fa_attest',
    detail: `${rows[0].email} attested=${attested}`,
  });
  return json(request, {
    ok: true,
    message: attested
      ? `2FA attested for recovery ${rows[0].email}`
      : `2FA attestation cleared for ${rows[0].email}`,
    recovery: rows[0],
  });
}

async function handleAssumeMaster(sql, request, env) {
  const { ctx, error } = await requireUser(sql, request);
  if (error) return error;

  const recovery = await getActiveRecovery(sql, ctx.user.id);
  if (!recovery) {
    return json(request, { error: 'not a recovery account — ask master to RECOVERY ADD your email' }, 403);
  }

  // Optional: only allow assume when no admins, OR always allow succession (user asked for backup recovery)
  // Allow always for catastrophic succession; audit heavily.
  if (env.MASTER_ADMIN_EMAIL) {
    // Recovery may assume even if email differs — that's the point of a second email.
  }

  await sql`
    update neon_auth."user"
    set role = 'admin', "updatedAt" = now()
    where id = ${ctx.user.id}
  `;
  await logAuthEvent(sql, {
    userId: ctx.user.id,
    email: ctx.user.email,
    eventType: 'assume_master',
    detail: 'recovery account assumed admin crown',
  });

  return json(request, {
    ok: true,
    role: 'ADMIN',
    message: 'Crown assumed via recovery key. Run SUDO. Review RECOVERY LIST and rotate secrets if this was an emergency.',
    recovery: {
      email: recovery.email,
      twoFactorAttested: !!recovery.two_factor_attested,
    },
  });
}

async function handleSetupStatus(sql, request) {
  const ctx = await resolveSession(sql, request);
  const adminCount = await countAdmins(sql);
  const recoveryRows = await sql`
    select email, two_factor_attested from uxu_recovery_accounts where revoked_at is null
  `;
  const recovery = ctx.user ? await getActiveRecovery(sql, ctx.user.id) : null;
  return json(request, {
    signedIn: !!ctx.user,
    role: ctx.role,
    sudo: !!ctx.sudo,
    adminCount,
    claimSealed: adminCount > 0,
    recoveryCount: recoveryRows.length,
    recoveryEmails: recoveryRows.map((r) => ({
      email: r.email,
      twoFactorAttested: !!r.two_factor_attested,
    })),
    isRecovery: !!recovery,
    steps: [
      { id: 1, key: 'signin', done: !!ctx.user, title: 'Sign in on 0?0' },
      { id: 2, key: 'claim', done: adminCount > 0, title: 'Claim master (only if throne empty)' },
      { id: 3, key: 'sudo', done: !!ctx.sudo, title: 'SUDO as admin' },
      { id: 4, key: 'recovery', done: recoveryRows.length >= 1, title: 'Add recovery email (second account)' },
      { id: 5, key: '2fa', done: recoveryRows.some((r) => r.two_factor_attested), title: 'Optional: attest 2FA on recovery' },
      { id: 6, key: 'seal', done: adminCount > 0, title: 'Rite seals automatically when admin exists' },
    ],
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
  '/api/root/tags': handleTags,
  '/api/auth/me': handleAuthMe,
  '/api/auth/config': (sql, request, env) => handleAuthConfig(request, env),
  '/api/auth/events': handleAuthEvents,
  '/api/auth/setup-status': handleSetupStatus,
  '/api/auth/recovery': handleRecoveryList,
};

const MANUAL_SLUG_RE = /^\/api\/root\/manuals\/([a-z0-9][a-z0-9_-]*)$/i;

const POST_ROUTES = {
  '/api/auth/claim-master': handleClaimMaster,
  '/api/auth/sudo': handleSudo,
  '/api/auth/unsudo': handleUnsudo,
  '/api/auth/sign-out': handleSignOut,
  '/api/auth/recovery/add': handleRecoveryAdd,
  '/api/auth/recovery/remove': handleRecoveryRemove,
  '/api/auth/recovery/attest-2fa': handleRecoveryAttest2fa,
  '/api/auth/assume-master': handleAssumeMaster,
  '/api/root/tags': handleTagUpsert,
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
