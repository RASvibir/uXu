import { neon } from '@neondatabase/serverless';

const ROOT_ID = '0?0.uXu.0000';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function json(data, status = 200) {
  return Response.json(data, { status, headers: CORS_HEADERS });
}

async function handleRoot(sql) {
  const root = await sql`
    select * from archive_records where id = ${ROOT_ID} limit 1
  `;
  const children = await sql`
    select id, title, type, status, parent, path, summary
    from archive_records
    where parent = ${ROOT_ID}
    order by id
  `;
  return json({ root: root[0] || null, children });
}

async function handleRegistry(sql) {
  const records = await sql`
    select * from archive_records order by root, parent nulls first, id
  `;
  return json({ records });
}

async function handleProvenance(sql) {
  const events = await sql`
    select * from provenance_events order by event_date desc limit 200
  `;
  return json({ events });
}

async function handleLogs(sql) {
  const logs = await sql`
    select * from transparency_logs order by created_at desc limit 200
  `;
  return json({ logs });
}

const ROUTES = {
  '/api/root': handleRoot,
  '/api/root/registry': handleRegistry,
  '/api/root/provenance': handleProvenance,
  '/api/root/logs': handleLogs,
};

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS_HEADERS });
    }

    const url = new URL(request.url);
    const handler = ROUTES[url.pathname];

    if (!handler) {
      return new Response('Not found', { status: 404 });
    }

    if (!env.DATABASE_URL) {
      return json({ error: 'DATABASE_URL missing' }, 500);
    }

    const sql = neon(env.DATABASE_URL);

    try {
      return await handler(sql);
    } catch (err) {
      return json({ error: 'query failed', detail: String(err) }, 500);
    }
  },
};
