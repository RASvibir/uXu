import { neon } from '@neondatabase/serverless';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname !== '/api/root') {
      return new Response('Not found', { status: 404 });
    }
    if (!env.DATABASE_URL) {
      return Response.json({ error: 'DATABASE_URL missing' }, { status: 500 });
    }

    const sql = neon(env.DATABASE_URL);
    const root = await sql`
      select * from archive_records
      where id = '0?0.uXu.0000'
      limit 1
    `;
    const children = await sql`
      select id, title, type, status, parent
      from archive_records
      where parent = '0?0.uXu.0000'
      order by id
    `;

    return Response.json({ root: root[0] || null, children });
  }
};
