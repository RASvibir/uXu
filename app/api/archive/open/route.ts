import { promises as fs } from 'node:fs';
import path from 'node:path';

export const runtime = 'nodejs';

const ARCHIVES_DIR = path.resolve(process.cwd(), 'archives');

const ALIASES: Record<string, string> = {
  'cybercat-deck-builder': 'CyberCat-Deck-Builder',
  'deck-builder': 'CyberCat-Deck-Builder',
  'cybercat-generic': 'CyberCat-Generic',
  'cybercat-mytape': 'CyberCat-My-Tape',
  'my-tape': 'CyberCat-My-Tape',
};

async function resolveDir(key: string): Promise<string | null> {
  const hit = ALIASES[key.toLowerCase()] || ALIASES[key];
  if (hit) return hit;
  const entries = await fs.readdir(ARCHIVES_DIR, { withFileTypes: true }).catch(() => []);
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    if (entry.name.toLowerCase() === key.toLowerCase()) return entry.name;
    const dataPath = path.join(ARCHIVES_DIR, entry.name, 'data.json');
    try {
      const meta = JSON.parse(await fs.readFile(dataPath, 'utf8'));
      if (String(meta.archiveId || '').toLowerCase() === key.toLowerCase()) return entry.name;
      if (String(meta.archiveName || '').toLowerCase() === key.toLowerCase()) return entry.name;
    } catch {
      /* no data.json — fall through */
    }
  }
  return null;
}

export async function GET(req: Request) {
  const q = new URL(req.url).searchParams;
  const key = String(q.get('archiveId') || q.get('archive') || q.get('id') || '').trim();
  if (!key) {
    return Response.json({ archive: null, error: 'missing archiveId' }, { status: 400 });
  }
  const dir = await resolveDir(key);
  if (!dir) {
    return Response.json({ archive: null, error: 'not found' });
  }
  let meta: Record<string, unknown> = {};
  try {
    meta = JSON.parse(await fs.readFile(path.join(ARCHIVES_DIR, dir, 'data.json'), 'utf8'));
  } catch {
    /* no data.json */
  }
  return Response.json({
    archive: {
      id: String(meta.archiveId || dir),
      title: String(meta.archiveName || dir),
      path: `${dir}/index.html`,
      meta,
    },
  });
}