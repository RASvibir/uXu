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

function isValidEmail(email) {
  return typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254;
}

async function readJson(request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

async function neonAuthPost(env, path, body) {
  const base = String(env.NEON_AUTH_BASE_URL || '').replace(/\/$/, '');
  if (!base) return { ok: false, status: 500, data: { error: 'NEON_AUTH_BASE_URL missing' } };
  const res = await fetch(`${base}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}

async function ensureEmailTables(sql) {
  await sql`
    create table if not exists uxu_email_change_requests (
      id bigserial primary key,
      user_id uuid not null,
      current_email text not null,
      new_email text not null,
      created_at timestamptz not null default now(),
      expires_at timestamptz not null,
      confirmed_at timestamptz,
      cancelled_at timestamptz
    )
  `;
  await sql`
    create table if not exists uxu_archive_contacts (
      archive_id text primary key,
      contact_email text,
      contact_public boolean not null default false,
      holder_user_id uuid,
      updated_at timestamptz not null default now(),
      updated_by uuid
    )
  `;
  await sql`
    create table if not exists uxu_archive_contact_requests (
      id bigserial primary key,
      archive_id text not null,
      requested_by uuid not null,
      requested_email text not null,
      make_public boolean not null default false,
      status text not null default 'pending',
      created_at timestamptz not null default now(),
      decided_at timestamptz,
      decided_by uuid,
      note text
    )
  `;
}

async function verifyCurrentPassword(sql, env, email, password) {
  const result = await neonAuthPost(env, '/sign-in/email', { email, password });
  if (!result.ok) {
    return { ok: false, error: result.data?.message || result.data?.error || 'password check failed' };
  }
  // Sign-in creates a throwaway session — revoke it so the caller's bearer token stays current.
  if (result.data?.token) {
    await sql`delete from neon_auth.session where token = ${result.data.token}`;
  }
  return { ok: true };
}

async function hasCredentialPassword(sql, userId) {
  const rows = await sql`
    select 1 as ok
    from neon_auth.account
    where "userId" = ${userId}
      and "providerId" = 'credential'
      and password is not null
    limit 1
  `;
  return rows.length > 0;
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
    'ini-provenance': 6,
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
    privacy: {
      loginEmailPublic: false,
      note: 'Login emails are private. Admins (SUDO) can list accounts. Archive contact emails are opt-in public and changes to public holder emails need admin approval.',
    },
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
    account: {
      commands: [
        'CHANGE EMAIL <new> <password>',
        'CHANGE EMAIL CONFIRM <otp>',
        'ACCOUNTS',
        'ARCHIVE CONTACT <archiveId> <email> [public]',
        'ARCHIVE CONTACT PENDING',
        'ARCHIVE CONTACT APPROVE <id>',
        'ARCHIVE CONTACT DENY <id>',
      ],
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
  const revealEmails = ctx.role === 'ADMIN' && !!ctx.sudo;
  const stats = await sql`
    select
      count(*)::int as n,
      coalesce(bool_or(two_factor_attested), false) as any_2fa
    from uxu_recovery_accounts
    where revoked_at is null
  `;
  const recoveryCount = stats[0]?.n || 0;
  const any2fa = !!stats[0]?.any_2fa;
  const recovery = ctx.user ? await getActiveRecovery(sql, ctx.user.id) : null;
  const body = {
    signedIn: !!ctx.user,
    role: ctx.role,
    sudo: !!ctx.sudo,
    adminCount,
    claimSealed: adminCount > 0,
    recoveryCount,
    isRecovery: !!recovery,
    steps: [
      { id: 1, key: 'signin', done: !!ctx.user, title: 'Sign in on 0?0' },
      { id: 2, key: 'claim', done: adminCount > 0, title: 'Claim master (only if throne empty)' },
      { id: 3, key: 'sudo', done: !!ctx.sudo, title: 'SUDO as admin' },
      { id: 4, key: 'recovery', done: recoveryCount >= 1, title: 'Add recovery email (second account)' },
      { id: 5, key: '2fa', done: any2fa, title: 'Optional: attest 2FA on recovery' },
      { id: 6, key: 'seal', done: adminCount > 0, title: 'Rite seals automatically when admin exists' },
    ],
  };
  if (revealEmails) {
    const recoveryRows = await sql`
      select email, two_factor_attested
      from uxu_recovery_accounts
      where revoked_at is null
      order by created_at asc
    `;
    body.recoveryEmails = recoveryRows.map((r) => ({
      email: r.email,
      twoFactorAttested: !!r.two_factor_attested,
    }));
  }
  return json(request, body);
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

async function handleAuthAudit(sql, request) {
  const { ctx, error } = await requireUser(sql, request);
  if (error) return error;
  const body = await readJson(request);
  if (!body) return json(request, { error: 'invalid json' }, 400);
  const eventType = String(body.eventType || '').trim().toLowerCase();
  if (!['signup', 'signin'].includes(eventType)) {
    return json(request, { error: 'eventType must be signup or signin' }, 400);
  }
  await logAuthEvent(sql, {
    userId: ctx.user.id,
    email: ctx.user.email,
    eventType,
    detail: body.detail || null,
  });
  return json(request, { ok: true });
}

async function handleAccountsList(sql, request) {
  const { error } = await requireAdminSudo(sql, request);
  if (error) return error;
  const users = await sql`
    select
      id,
      email,
      name,
      role,
      banned,
      "emailVerified" as email_verified,
      "createdAt" as created_at,
      "updatedAt" as updated_at
    from neon_auth."user"
    order by "createdAt" desc
    limit 200
  `;
  return json(request, {
    users,
    privacy: 'Login emails are admin-only. Not shown on public archive pages.',
    count: users.length,
  });
}

async function handleChangeEmailRequest(sql, request, env) {
  const { ctx, error } = await requireUser(sql, request);
  if (error) return error;
  const body = await readJson(request);
  if (!body) return json(request, { error: 'invalid json' }, 400);

  const newEmail = String(body.newEmail || '').trim().toLowerCase();
  const password = String(body.password || '');
  if (!isValidEmail(newEmail)) {
    return json(request, { error: 'valid newEmail required' }, 400);
  }
  if (newEmail === String(ctx.user.email || '').toLowerCase()) {
    return json(request, { error: 'new email is the same as current' }, 400);
  }

  const taken = await sql`
    select id from neon_auth."user" where lower(email) = ${newEmail} limit 1
  `;
  if (taken.length) {
    return json(request, { error: 'that email already has an account' }, 409);
  }

  const needsPassword = await hasCredentialPassword(sql, ctx.user.id);
  if (needsPassword) {
    if (!password) {
      return json(request, { error: 'password required — CHANGE EMAIL <new> <password>' }, 400);
    }
    const check = await verifyCurrentPassword(sql, env, ctx.user.email, password);
    if (!check.ok) {
      return json(request, { error: 'current password incorrect' }, 403);
    }
  }

  await ensureEmailTables(sql);
  await sql`
    update uxu_email_change_requests
    set cancelled_at = now()
    where user_id = ${ctx.user.id}
      and confirmed_at is null
      and cancelled_at is null
  `;

  const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
  await sql`
    insert into uxu_email_change_requests (user_id, current_email, new_email, expires_at)
    values (${ctx.user.id}, ${ctx.user.email}, ${newEmail}, ${expiresAt})
  `;

  const otp = await neonAuthPost(env, '/email-otp/send-verification-otp', {
    email: ctx.user.email,
    type: 'email-verification',
  });
  if (!otp.ok) {
    return json(request, {
      error: 'could not send verification code to current email',
      detail: otp.data?.message || otp.data?.error || null,
    }, 502);
  }

  await logAuthEvent(sql, {
    userId: ctx.user.id,
    email: ctx.user.email,
    eventType: 'email_change_requested',
    detail: `pending → ${newEmail}`,
  });

  return json(request, {
    ok: true,
    message: `Verification code sent to ${ctx.user.email}. Confirm with: CHANGE EMAIL CONFIRM <otp>`,
    currentEmail: ctx.user.email,
    newEmail,
    expiresAt,
  });
}

async function handleChangeEmailConfirm(sql, request, env) {
  const { ctx, error } = await requireUser(sql, request);
  if (error) return error;
  const body = await readJson(request);
  if (!body) return json(request, { error: 'invalid json' }, 400);
  const otp = String(body.otp || '').trim();
  if (!otp) return json(request, { error: 'otp required' }, 400);

  await ensureEmailTables(sql);
  const pending = await sql`
    select id, current_email, new_email, expires_at
    from uxu_email_change_requests
    where user_id = ${ctx.user.id}
      and confirmed_at is null
      and cancelled_at is null
    order by created_at desc
    limit 1
  `;
  if (!pending.length) {
    return json(request, { error: 'no pending email change — run CHANGE EMAIL <new> <password> first' }, 404);
  }
  const row = pending[0];
  if (new Date(row.expires_at).getTime() < Date.now()) {
    await sql`update uxu_email_change_requests set cancelled_at = now() where id = ${row.id}`;
    return json(request, { error: 'pending change expired — request again' }, 410);
  }
  if (String(row.current_email).toLowerCase() !== String(ctx.user.email || '').toLowerCase()) {
    return json(request, { error: 'session email no longer matches pending request' }, 409);
  }

  const check = await neonAuthPost(env, '/email-otp/check-verification-otp', {
    email: row.current_email,
    otp,
    type: 'email-verification',
  });
  if (!check.ok) {
    return json(request, {
      error: 'invalid or expired verification code',
      detail: check.data?.message || check.data?.error || null,
    }, 403);
  }

  const taken = await sql`
    select id from neon_auth."user"
    where lower(email) = ${row.new_email} and id <> ${ctx.user.id}
    limit 1
  `;
  if (taken.length) {
    return json(request, { error: 'that email was claimed while you were confirming' }, 409);
  }

  await sql`
    update neon_auth."user"
    set email = ${row.new_email},
        "emailVerified" = false,
        "updatedAt" = now()
    where id = ${ctx.user.id}
  `;
  await sql`
    update uxu_recovery_accounts
    set email = ${row.new_email}
    where user_id = ${String(ctx.user.id)}
      and revoked_at is null
      and lower(email) = ${String(row.current_email).toLowerCase()}
  `;
  await sql`
    update uxu_email_change_requests
    set confirmed_at = now()
    where id = ${row.id}
  `;

  await logAuthEvent(sql, {
    userId: ctx.user.id,
    email: row.new_email,
    eventType: 'email_change_confirmed',
    detail: `${row.current_email} → ${row.new_email}`,
  });

  return json(request, {
    ok: true,
    message: `Login email updated to ${row.new_email}. Sign in with the new address next time.`,
    email: row.new_email,
  });
}

async function handleChangeEmailStatus(sql, request) {
  const { ctx, error } = await requireUser(sql, request);
  if (error) return error;
  await ensureEmailTables(sql);
  const rows = await sql`
    select id, current_email, new_email, created_at, expires_at, confirmed_at, cancelled_at
    from uxu_email_change_requests
    where user_id = ${ctx.user.id}
    order by created_at desc
    limit 5
  `;
  const pending = rows.find((r) => !r.confirmed_at && !r.cancelled_at && new Date(r.expires_at) > new Date()) || null;
  return json(request, { email: ctx.user.email, pending, recent: rows });
}

async function handleArchiveAccess(sql, request, archiveId) {
  const session = await resolveSession(sql, request);
  if (!session.user) {
    return json(request, { allowed: false, reason: 'sign in on 0?0 first' }, 401);
  }
  const email = String(session.user.email || '').trim().toLowerCase();
  const rows = await sql`
    select email from uxu_archive_access
    where archive_id = ${archiveId} and lower(email) = ${email}
    limit 1
  `;
  const isAdmin = session.role === 'ADMIN';
  const allowed = rows.length > 0 || isAdmin;
  return json(request, {
    allowed,
    archiveId,
    reason: allowed
      ? (isAdmin && !rows.length ? 'admin' : 'steward')
      : 'not on the access list for this archive',
  });
}

function publicContactView(row) {
  if (!row) return null;
  return {
    archiveId: row.archive_id,
    contactEmail: row.contact_public ? row.contact_email : null,
    contactPublic: !!row.contact_public,
    hasContact: !!row.contact_email,
  };
}

async function handleArchiveContactGet(sql, request, archiveId) {
  await ensureEmailTables(sql);
  const rows = await sql`
    select archive_id, contact_email, contact_public, holder_user_id, updated_at
    from uxu_archive_contacts
    where archive_id = ${archiveId}
    limit 1
  `;
  const session = await resolveSession(sql, request);
  const row = rows[0] || null;
  const isHolder = row && session.user && String(row.holder_user_id) === String(session.user.id);
  const isAdmin = session.role === 'ADMIN' && session.sudo;

  if (!row) {
    return json(request, { archiveId, contactEmail: null, contactPublic: false, hasContact: false });
  }
  if (row.contact_public || isHolder || isAdmin) {
    return json(request, {
      archiveId: row.archive_id,
      contactEmail: row.contact_email,
      contactPublic: !!row.contact_public,
      hasContact: !!row.contact_email,
      holder: isHolder || isAdmin ? { userId: row.holder_user_id } : undefined,
      updatedAt: row.updated_at,
      visibility: row.contact_public ? 'public' : 'private',
    });
  }
  return json(request, publicContactView(row));
}

async function handleArchiveContactRequest(sql, request) {
  const { ctx, error } = await requireUser(sql, request);
  if (error) return error;
  const body = await readJson(request);
  if (!body) return json(request, { error: 'invalid json' }, 400);

  const archiveId = String(body.archiveId || '').trim();
  const email = String(body.email || '').trim().toLowerCase();
  const makePublic = !!body.makePublic;
  if (!archiveId) return json(request, { error: 'archiveId required' }, 400);
  if (!isValidEmail(email)) return json(request, { error: 'valid email required' }, 400);

  const archives = await sql`
    select id from archive_records where id = ${archiveId} limit 1
  `;
  if (!archives.length) {
    return json(request, { error: 'archive not found in registry' }, 404);
  }

  await ensureEmailTables(sql);
  const existing = await sql`
    select archive_id, contact_email, contact_public, holder_user_id
    from uxu_archive_contacts
    where archive_id = ${archiveId}
    limit 1
  `;
  const row = existing[0] || null;
  if (row?.holder_user_id && String(row.holder_user_id) !== String(ctx.user.id)) {
    return json(request, { error: 'this archive contact is held by another account' }, 403);
  }

  const needsApproval = makePublic || !!(row && row.contact_public);

  // Private steward contact (not public): apply immediately — never shown on public pages.
  if (!needsApproval) {
    await sql`
      insert into uxu_archive_contacts (archive_id, contact_email, contact_public, holder_user_id, updated_at, updated_by)
      values (${archiveId}, ${email}, false, ${ctx.user.id}, now(), ${ctx.user.id})
      on conflict (archive_id) do update set
        contact_email = excluded.contact_email,
        contact_public = false,
        holder_user_id = coalesce(uxu_archive_contacts.holder_user_id, excluded.holder_user_id),
        updated_at = now(),
        updated_by = excluded.updated_by
    `;
    await logAuthEvent(sql, {
      userId: ctx.user.id,
      email: ctx.user.email,
      eventType: 'archive_contact_set_private',
      detail: `${archiveId} → ${email} (private)`,
    });
    return json(request, {
      ok: true,
      applied: true,
      pending: false,
      message: `Private contact email set for ${archiveId}. Not shown publicly. Publishing or changing a public holder email needs admin approval.`,
      contact: { archiveId, contactEmail: email, contactPublic: false },
    });
  }

  await sql`
    update uxu_archive_contact_requests
    set status = 'cancelled', decided_at = now(), note = 'superseded'
    where archive_id = ${archiveId}
      and requested_by = ${ctx.user.id}
      and status = 'pending'
  `;
  const inserted = await sql`
    insert into uxu_archive_contact_requests
      (archive_id, requested_by, requested_email, make_public, status)
    values (${archiveId}, ${ctx.user.id}, ${email}, ${makePublic}, 'pending')
    returning id, archive_id, requested_email, make_public, status, created_at
  `;
  await logAuthEvent(sql, {
    userId: ctx.user.id,
    email: ctx.user.email,
    eventType: 'archive_contact_requested',
    detail: `${archiveId} → ${email} public=${makePublic}`,
  });
  return json(request, {
    ok: true,
    applied: false,
    pending: true,
    request: inserted[0],
    message: `Request #${inserted[0].id} queued for admin approval.`,
  });
}

async function handleArchiveContactPending(sql, request) {
  const { error } = await requireAdminSudo(sql, request);
  if (error) return error;
  await ensureEmailTables(sql);
  const rows = await sql`
    select r.id, r.archive_id, r.requested_by, r.requested_email, r.make_public,
           r.status, r.created_at, u.email as requester_email, u.name as requester_name
    from uxu_archive_contact_requests r
    left join neon_auth."user" u on u.id = r.requested_by
    where r.status = 'pending'
    order by r.created_at asc
    limit 100
  `;
  return json(request, { pending: rows });
}

async function handleArchiveContactDecide(sql, request, approve) {
  const { ctx, error } = await requireAdminSudo(sql, request);
  if (error) return error;
  const body = await readJson(request);
  if (!body) return json(request, { error: 'invalid json' }, 400);
  const id = Number(body.id);
  if (!Number.isFinite(id)) return json(request, { error: 'id required' }, 400);
  const note = body.note ? String(body.note).slice(0, 500) : null;

  await ensureEmailTables(sql);
  const rows = await sql`
    select * from uxu_archive_contact_requests
    where id = ${id} and status = 'pending'
    limit 1
  `;
  if (!rows.length) return json(request, { error: 'pending request not found' }, 404);
  const req = rows[0];

  if (approve) {
    await sql`
      insert into uxu_archive_contacts (archive_id, contact_email, contact_public, holder_user_id, updated_at, updated_by)
      values (${req.archive_id}, ${req.requested_email}, ${req.make_public}, ${req.requested_by}, now(), ${ctx.user.id})
      on conflict (archive_id) do update set
        contact_email = excluded.contact_email,
        contact_public = excluded.contact_public,
        holder_user_id = coalesce(uxu_archive_contacts.holder_user_id, excluded.holder_user_id),
        updated_at = now(),
        updated_by = excluded.updated_by
    `;
  }

  await sql`
    update uxu_archive_contact_requests
    set status = ${approve ? 'approved' : 'denied'},
        decided_at = now(),
        decided_by = ${ctx.user.id},
        note = ${note}
    where id = ${id}
  `;

  await logAuthEvent(sql, {
    userId: ctx.user.id,
    email: ctx.user.email,
    eventType: approve ? 'archive_contact_approved' : 'archive_contact_denied',
    detail: `#${id} ${req.archive_id} → ${req.requested_email}`,
  });

  return json(request, {
    ok: true,
    status: approve ? 'approved' : 'denied',
    message: approve
      ? `Approved contact for ${req.archive_id}: ${req.requested_email}${req.make_public ? ' (public)' : ' (private)'}`
      : `Denied request #${id}`,
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

function slugifyArchiveTitle(title) {
  return String(title || '')
    .trim()
    .toLowerCase()
    .replace(/['"]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48) || 'archive';
}

function archiveIdFromTitle(title, serial) {
  const safe = String(title || 'Archive')
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[^A-Za-z0-9_?-]/g, '')
    .slice(0, 48) || 'Archive';
  return `${safe}.uXu.${serial}`;
}

async function nextArchiveSerialDb(sql) {
  const rows = await sql`
    select id from archive_records
  `;
  let max = -1;
  for (const row of rows) {
    const m = String(row.id || '').match(/\.(\d{4})$/);
    if (m) max = Math.max(max, parseInt(m[1], 10));
  }
  return String(max + 1).padStart(4, '0');
}

async function ensureCreatedArchivesTable(sql) {
  await sql`
    create table if not exists uxu_created_archives (
      archive_id text primary key,
      owner_user_id uuid not null,
      owner_email text not null,
      folder_slug text not null,
      data_json jsonb not null,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    )
  `;
  await sql`
    create table if not exists uxu_archive_access (
      archive_id text not null,
      email text not null,
      created_at timestamptz not null default now(),
      primary key (archive_id, email)
    )
  `;
}

async function handleArchiveCreate(sql, request, env) {
  const { ctx, error } = await requireUser(sql, request);
  if (error) return error;
  const body = await readJson(request);
  if (!body) return json(request, { error: 'invalid json' }, 400);
  if (!body.confirm) {
    return json(request, { error: 'confirm required — set confirm:true after the user accepts the warning' }, 400);
  }

  const title = String(body.title || body.archiveName || '').trim().slice(0, 80);
  const description = String(body.description || '').trim().slice(0, 400);
  if (!title) return json(request, { error: 'title required' }, 400);

  const homeStyle = String(body.homeLinkStyle || 'uXu').toLowerCase() === '0?0' ? '0?0' : 'uXu';
  const firstItem = String(body.firstItem || '').trim().slice(0, 120);
  const isPrivate = !!body.private;

  await ensureCreatedArchivesTable(sql);
  const serial = await nextArchiveSerialDb(sql);
  const archiveId = archiveIdFromTitle(title, serial);
  const folderSlug = slugifyArchiveTitle(title);
  const existing = await sql`select id from archive_records where id = ${archiveId} limit 1`;
  if (existing.length) {
    return json(request, { error: `id ${archiveId} already taken — try a different title` }, 409);
  }

  const dataJson = {
    archiveName: title,
    artist: '',
    curator: '',
    description: description || `Created on 0?0 by ${ctx.user.email}`,
    uxu: {
      homeLink: { style: homeStyle, href: '../index.html' },
      allowTemplateForks: false,
      templateForkDepth: 1,
      templateOf: null,
      templateDepth: 1,
      manuals: [
        {
          title: 'Visitor Guide',
          path: 'manuals/USER-MANUAL.md',
          description: 'How to use this archive',
        },
      ],
      tags: [],
      contactEmail: null,
      contactEmailPublic: false,
      ini: {
        optIn: false,
        tag: 'iNi',
        provenance: {
          origin: '',
          authors: [],
          custody: '',
          lineage: '',
          conditions: '',
          attestedAt: null,
        },
      },
    },
    shows: firstItem
      ? [{ title: firstItem, date: new Date().toISOString().slice(0, 10), venue: 'First note', setlist: [] }]
      : [],
  };

  const livePath = `/api/archives/${encodeURIComponent(archiveId)}/app`;
  await sql`
    insert into archive_records (
      id, title, slug, status, type, root, archive, parent, path,
      canonical_source, summary, creator, date_label, schema_version, certainty,
      tags, distribution, provenance, relations, validation, unresolved
    ) values (
      ${archiveId},
      ${title},
      ${folderSlug},
      ${isPrivate ? 'private' : 'active'},
      'archive',
      ${ROOT_ID},
      'uXu',
      ${ROOT_ID},
      ${livePath},
      '/api/root',
      ${dataJson.description},
      ${ctx.user.name || ctx.user.email},
      ${new Date().getFullYear().toString()},
      '1.0.0',
      'defined',
      '[]'::jsonb,
      '[]'::jsonb,
      ${{
        certainty: 'defined',
        holdingOrganization: 'uXu',
        createdVia: '0?0-create',
      }},
      ${{ children: [], siblings: [], references: [] }},
      ${{ pathStatus: 'live-worker', metadataStatus: 'complete' }},
      '[]'::jsonb
    )
  `;

  await sql`
    insert into uxu_created_archives (archive_id, owner_user_id, owner_email, folder_slug, data_json)
    values (
      ${archiveId},
      ${ctx.user.id},
      ${ctx.user.email},
      ${folderSlug},
      ${dataJson}
    )
  `;

  await sql`
    insert into uxu_archive_access (archive_id, email)
    values (${archiveId}, ${String(ctx.user.email).toLowerCase()})
    on conflict do nothing
  `;

  await logAuthEvent(sql, {
    userId: ctx.user.id,
    email: ctx.user.email,
    eventType: 'archive_created',
    detail: `${archiveId} private=${isPrivate}`,
  });

  return json(request, {
    ok: true,
    id: archiveId,
    title,
    serial,
    folderSlug,
    status: isPrivate ? 'private' : 'active',
    path: livePath,
    data: dataJson,
    message: `Created ${archiveId}. Open it from the registry or type OPEN ${title.split(/\s+/)[0].toUpperCase()}.`,
  });
}

function renderLiveArchiveHtml(archiveId, data) {
  const title = String(data.archiveName || 'Archive').replace(/</g, '&lt;');
  const desc = String(data.description || '').replace(/</g, '&lt;');
  const items = Array.isArray(data.shows) ? data.shows : [];
  const listHtml = items.length
    ? items
        .map((item) => {
          const label = String(item.title || item.venue || 'Item').replace(/</g, '&lt;');
          const meta = [item.date, item.venue].filter(Boolean).join(' · ').replace(/</g, '&lt;');
          return `<div class="card"><div>${label}</div>${meta ? `<div class="meta">${meta}</div>` : ''}</div>`;
        })
        .join('')
    : '<p class="meta">No items yet — edit this archive later or download the starter pack from 0?0.</p>';
  const homeStyle = data?.uxu?.homeLink?.style === '0?0' ? '0?0' : 'uXu';
  const homeLabel = homeStyle === '0?0' ? '← 0?0' : 'uXu';
  // Prefer relative back to GitHub Pages console when opened from there; absolute fallback.
  return `<!DOCTYPE html>
<html lang="en"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title} · uXu</title>
<style>
:root{--bg:#0a0c0a;--text:#d8ffe6;--accent:#3de872;--muted:#7a8f84;--mono:ui-monospace,Menlo,monospace}
*{box-sizing:border-box}body{margin:0;min-height:100vh;font-family:var(--mono);background:var(--bg);color:var(--text);padding:1rem 1.25rem 2rem;max-width:40rem}
a.home{display:inline-block;margin-bottom:1rem;color:#041208;background:var(--accent);padding:.2rem .65rem;text-decoration:none;font-weight:700}
a.home.back{color:var(--accent);background:transparent;border:1px solid rgba(61,232,114,.35)}
h1{font-size:1.35rem;margin:0 0 .35rem}.tag{color:var(--muted);font-size:.8rem;margin-bottom:1rem}
.card{border:1px solid rgba(61,232,114,.25);padding:.65rem .75rem;background:rgba(61,232,114,.04);margin:.4rem 0}
.meta{color:var(--muted);font-size:.75rem;margin-top:.25rem}
.note{margin-top:1.25rem;font-size:.75rem;color:var(--muted);line-height:1.45}
</style></head><body>
<a class="home ${homeStyle === '0?0' ? 'back' : ''}" href="javascript:history.length>1?history.back():location.href='https://rasvibir.github.io/uXu/'">${homeLabel}</a>
<h1>${title}</h1>
<p class="tag">${archiveId.replace(/</g, '&lt;')} · ${desc}</p>
${listHtml}
<p class="note">Created on 0?0. This live page is served from your account draft. Download the folder pack from the console if you want files in the repo.</p>
</body></html>`;
}

async function handleArchiveApp(sql, request, archiveId) {
  await ensureCreatedArchivesTable(sql);
  const rows = await sql`
    select data_json, owner_email from uxu_created_archives
    where archive_id = ${archiveId}
    limit 1
  `;
  if (!rows.length) {
    return new Response('Archive not found (or not a 0?0-created live draft).', {
      status: 404,
      headers: { 'Content-Type': 'text/plain; charset=utf-8', ...corsHeaders(request) },
    });
  }

  const rec = await sql`select status from archive_records where id = ${archiveId} limit 1`;
  const status = String(rec[0]?.status || '').toLowerCase();
  if (status === 'private' || status === 'locked' || status === 'sealed') {
    const session = await resolveSession(sql, request);
    const email = String(session.user?.email || '').toLowerCase();
    const access = email
      ? await sql`
          select 1 from uxu_archive_access
          where archive_id = ${archiveId} and lower(email) = ${email}
          limit 1
        `
      : [];
    const ok = access.length || session.role === 'ADMIN';
    if (!ok) {
      const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Private</title>
<style>body{font-family:monospace;background:#0a0c0a;color:#d8ffe6;padding:2rem}a{color:#3de872}</style></head>
<body><h1>Private archive</h1><p>Sign in on <a href="https://rasvibir.github.io/uXu/">0?0</a> as a steward, then open again.</p></body></html>`;
      return new Response(html, {
        status: 401,
        headers: { 'Content-Type': 'text/html; charset=utf-8', ...corsHeaders(request) },
      });
    }
  }

  const data = rows[0].data_json;
  const html = renderLiveArchiveHtml(archiveId, typeof data === 'string' ? JSON.parse(data) : data);
  return new Response(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
      ...corsHeaders(request),
    },
  });
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
  '/api/auth/accounts': handleAccountsList,
  '/api/auth/change-email/status': handleChangeEmailStatus,
  '/api/auth/archive-contact/pending': handleArchiveContactPending,
};

const MANUAL_SLUG_RE = /^\/api\/root\/manuals\/([a-z0-9][a-z0-9_-]*)$/i;
const ARCHIVE_CONTACT_RE = /^\/api\/archives\/([^/]+)\/contact$/i;
const ARCHIVE_ACCESS_RE = /^\/api\/archives\/([^/]+)\/access$/i;
const ARCHIVE_APP_RE = /^\/api\/archives\/([^/]+)\/app$/i;

const POST_ROUTES = {
  '/api/auth/claim-master': handleClaimMaster,
  '/api/auth/sudo': handleSudo,
  '/api/auth/unsudo': handleUnsudo,
  '/api/auth/sign-out': handleSignOut,
  '/api/auth/recovery/add': handleRecoveryAdd,
  '/api/auth/recovery/remove': handleRecoveryRemove,
  '/api/auth/recovery/attest-2fa': handleRecoveryAttest2fa,
  '/api/auth/assume-master': handleAssumeMaster,
  '/api/auth/audit': handleAuthAudit,
  '/api/auth/change-email/request': handleChangeEmailRequest,
  '/api/auth/change-email/confirm': handleChangeEmailConfirm,
  '/api/auth/archive-contact/request': handleArchiveContactRequest,
  '/api/auth/archive-contact/approve': (sql, request) => handleArchiveContactDecide(sql, request, true),
  '/api/auth/archive-contact/deny': (sql, request) => handleArchiveContactDecide(sql, request, false),
  '/api/archives/create': handleArchiveCreate,
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
        const contactMatch = url.pathname.match(ARCHIVE_CONTACT_RE);
        if (contactMatch) {
          return await handleArchiveContactGet(sql, request, decodeURIComponent(contactMatch[1]));
        }
        const accessMatch = url.pathname.match(ARCHIVE_ACCESS_RE);
        if (accessMatch) {
          return await handleArchiveAccess(sql, request, decodeURIComponent(accessMatch[1]));
        }
        const appMatch = url.pathname.match(ARCHIVE_APP_RE);
        if (appMatch) {
          return await handleArchiveApp(sql, request, decodeURIComponent(appMatch[1]));
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
