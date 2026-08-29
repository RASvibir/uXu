import { promises as fs } from 'node:fs';
import path from 'node:path';

export const runtime = 'nodejs';

const ARCHIVES_DIR = path.resolve(process.cwd(), 'archives');

export async function GET() {
  try {
    const entries = await fs.readdir(ARCHIVES_DIR, { withFileTypes: true });
    const archives: Array<Record<string, unknown>> = [];
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const htmlPath = path.join(ARCHIVES_DIR, entry.name, 'index.html');
      try {
        await fs.access(htmlPath);
      } catch {
        continue;
      }
      let meta: Record<string, unknown> = {};
      const dataPath = path.join(ARCHIVES_DIR, entry.name, 'data.json');
      try {
        meta = JSON.parse(await fs.readFile(dataPath, 'utf8'));
      } catch {
        /* data.json is optional */
      }
      const id = String(meta.archiveId || entry.name);
      archives.push({
        id,
        slug: id.toLowerCase().replace(/_/g, '-'),
        title: String(meta.archiveName || entry.name),
        path: `${entry.name}/index.html`,
        meta,
      });
    }
    archives.sort((a, b) => String(a.id).localeCompare(String(b.id)));
    return Response.json({ archives });
  } catch (err) {
    return Response.json({ archives: [], error: String(err) }, { status: 500 });
  }
}