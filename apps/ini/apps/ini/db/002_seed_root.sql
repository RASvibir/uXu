-- 002_seed_root.sql
-- Root only. No CyberCat_Sunflower rows — out of scope per handoff doc
-- section 3 ("CyberCat Sunflower integration for now" is excluded).
-- Add child archive rows in a separate, later migration.

INSERT INTO archive_records (
  id, title, slug, status, type, path, summary, parent, root, archive,
  certainty, tags, validation
) VALUES (
  '0?0.uXu.0000',
  '0?0',
  '0-0-root-console',
  'functional',
  'root-console',
  '/archives/index.html',
  'Root archive console for registry, manuals, provenance, logs, system info, and direct archive loading.',
  NULL,
  '0?0.uXu.0000',
  'uXu',
  'defined',
  '["root","registry","provenance"]'::jsonb,
  jsonb_build_object(
    'pathStatus', 'verified',
    'metadataStatus', 'complete'
  )
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO system_state (id, schema_version, runtime, status)
VALUES ('singleton', '1.0.0', 'cloudflare-worker', 'ok')
ON CONFLICT (id) DO UPDATE SET updated_at = now();
