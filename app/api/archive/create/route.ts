import { execFile } from 'node:child_process';
import path from 'node:path';
import { promisify } from 'node:util';

export const runtime = 'nodejs';

const RUN = promisify(execFile);
const GENERATOR = path.resolve(process.cwd(), 'save-sed-to-rave');

type Track = { url?: string; duration?: number | string };

export async function POST(req: Request) {
  let body: Record<string, unknown> = {};
  try {
    body = await req.json();
  } catch {
    return Response.json({ created: false, error: 'invalid JSON body' }, { status: 400 });
  }
  const id = String(body.id || '').trim();
  const title = String(body.title || '').trim();
  if (!id || !title) {
    return Response.json({ created: false, error: 'id and title are required' }, { status: 400 });
  }

  const args = ['--id', id, '--title', title, '--number', String(body.number || '0004')];
  if (body.mode) args.push('--mode', String(body.mode));
  if (body.ripple === true || body.ripple === 'on') args.push('--ripple', 'on');
  if (body.manifestUrl) args.push('--manifest', String(body.manifestUrl));
  if (body.curator) args.push('--curator', String(body.curator));
  const tracks = Array.isArray(body.tracks)
    ? (body.tracks as Track[]).map((t) => `${t.url}:${t.duration ?? 0}`).join(',')
    : '';
  if (tracks) args.push('--tracks', tracks);
  if (body.out) args.push('--out', String(body.out));

  try {
    const { stdout } = await RUN(GENERATOR, args, { cwd: process.cwd(), maxBuffer: 4 * 1024 * 1024 });
    return Response.json({ created: true, generated: id, out: stdout });
  } catch (err) {
    return Response.json({ created: false, error: String(err) }, { status: 500 });
  }
}