-- 001_init_root.sql
-- Additive migration only. Does not touch archive_records if it already
-- exists (index.js is already querying it in production) — this just
-- makes the create idempotent so it's safe to run against a fresh
-- Neon branch or the existing one.

-- Column set matches prisma/schema.prisma's `archive_records` model exactly
-- (that model has never been migrated, so this is a same-shape bridge,
-- not an adoption of Prisma). Nullable/defaulted so the existing 5-column
-- writes in the live index.js keep working unchanged.
CREATE TABLE IF NOT EXISTS archive_records (
  id                TEXT PRIMARY KEY,
  title             TEXT NOT NULL,
  slug              TEXT NOT NULL,
  status            TEXT NOT NULL DEFAULT 'planned',
  type              TEXT NOT NULL,
  root              TEXT,
  archive           TEXT NOT NULL,
  parent            TEXT REFERENCES archive_records(id),
  path              TEXT,
  canonical_source  TEXT,
  backup_source     TEXT,
  summary           TEXT,
  creator           TEXT,
  date_label        TEXT,
  schema_version    TEXT NOT NULL DEFAULT '1.0.0',
  certainty         TEXT NOT NULL DEFAULT 'partial',
  tags              JSONB DEFAULT '[]'::jsonb,
  distribution      JSONB DEFAULT '[]'::jsonb,
  provenance        JSONB DEFAULT '{}'::jsonb,
  relations         JSONB DEFAULT '{}'::jsonb,
  validation        JSONB DEFAULT '{}'::jsonb,
  unresolved        JSONB DEFAULT '[]'::jsonb,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_archive_records_parent ON archive_records(parent);

CREATE TABLE IF NOT EXISTS manual_entries (
  id            TEXT PRIMARY KEY,
  slug          TEXT NOT NULL,
  title         TEXT NOT NULL,
  summary       TEXT,
  path          TEXT,
  status        TEXT NOT NULL DEFAULT 'draft',
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS provenance_events (
  id            SERIAL PRIMARY KEY,
  record_id     TEXT NOT NULL REFERENCES archive_records(id),
  event_type    TEXT NOT NULL,
  event_date    TIMESTAMPTZ NOT NULL DEFAULT now(),
  actor         TEXT,
  source_path   TEXT,
  notes         TEXT,
  certainty     TEXT NOT NULL DEFAULT 'unknown'
    CHECK (certainty IN ('defined', 'partial', 'inferred', 'unknown'))
);

CREATE INDEX IF NOT EXISTS idx_provenance_events_record ON provenance_events(record_id);

CREATE TABLE IF NOT EXISTS transparency_logs (
  id              SERIAL PRIMARY KEY,
  scope           TEXT NOT NULL,
  message         TEXT NOT NULL,
  schema_version  TEXT NOT NULL DEFAULT '1.0.0',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  revision_note   TEXT
);

CREATE TABLE IF NOT EXISTS system_state (
  id              TEXT PRIMARY KEY DEFAULT 'singleton',
  schema_version  TEXT NOT NULL DEFAULT '1.0.0',
  runtime         TEXT NOT NULL DEFAULT 'cloudflare-worker',
  neon_branch     TEXT,
  status          TEXT NOT NULL DEFAULT 'ok',
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
