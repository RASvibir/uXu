# Source Code Pamphlet

Tags: source-code, architecture, pamphlet, archives, worker, pages, neon
Source: uXu repository map

## What This Pamphlet Is

A plain-language tour of how the public uXu repo is arranged.
It explains structure so you can learn and remix.
It deliberately omits secrets, credentials, bootstrap procedures, and
security-sensitive operator details.

## Top-Level Map

```text
uXu/
  README.md           commons charter (public)
  LICENSE             MIT (media clarification in README)
  CONTRIBUTING.md     contributor rules (incl. license / provenance)
  archives/           what people open in a browser (GitHub Pages root)
    index.html        0?0 root CRT console + uXu invite PWA hooks
    manifest.webmanifest / sw.js / icons/   public uXu install (landing only)
    CyberCat-Sunflower/
    RTFM/             manuals & reusable notes
    seed-13/          additional archive seed
  apps/ini/           runtime Worker (API) + Prisma schema
  templates/          optional starter HTML / JSON + home-link snippet
  docs/runtime/       runtime layout notes
```

GitHub Pages publishes the `archives/` tree as the public site root.
The Cloudflare Worker under `apps/ini` answers JSON API routes used by the console.
The installable **uXu** PWA is a public invite into that landing — it does not
present as 0?0; 0?0 is the console identity once you are inside.

## 0?0 Console (archives/index.html)

A phosphor CRT UI that lists the registry, opens archives, and browses manuals.
Commands are text-driven (HELP shows the visitor-facing set).
Registry rows come from the live API when the Worker is reachable.

## CyberCat Sunflower (archives/CyberCat-Sunflower/)

Self-contained deck: HTML/CSS/JS + catalog data.
Loads shows, streams audio, renders setlists, and exposes a 5-band EQ via the
Web Audio API. Docs under that folder cover curators and contributors.

## RTFM (archives/RTFM/)

Markdown pamphlets and code notes. Not a standard — optional inspiration.
Interactive copies of selected manuals are also stored in the database table
manual_pages and served through the Worker manuals endpoints.

## Runtime App (apps/ini/)

- src/index.js — Worker entry: root/registry/manuals/logs/provenance/system
  and account-related routes
- prisma/schema.prisma — describes tables such as archive_records and manual_pages
- wrangler.toml — Worker project name and non-secret public config

Public conceptual endpoints (no auth required for reading):

- GET /api/root
- GET /api/root/registry
- GET /api/root/manuals
- GET /api/root/manuals/:slug
- GET /api/root/logs
- GET /api/root/provenance
- GET /api/root/system

Exact production hostnames change with deploy; the root console points at the
active Worker base URL in its script.

## Data Sketch (High Level)

- archive_records — registry identities, paths, summaries, parent/child links
- manual_pages — slug, title, body text for the MANUAL library
- transparency_logs / provenance_events — optional public trail entries

There may be additional tables used by auth or older experiments. Treat anything
credential-bearing as private; this pamphlet will not document those fields.

## How Pieces Talk

```text
Browser (Pages)
  → archives/index.html (0?0)
      → Worker /api/root/registry  → Neon archive_records
      → Worker /api/root/manuals   → Neon manual_pages
  → CyberCat-Sunflower/index.html
      → catalog APIs / archive media
      → optional manuals fetch by slug
```

## Building Locally (Idea Level)

1. Clone the repo.
2. Open archives/index.html or CyberCat via a static server.
3. For API work, run the Worker with your own local env — never commit secrets.
4. Prefer editing archive HTML/JSON in place; keep manuals mirrored in RTFM.

## Redaction Promise

This pamphlet will not list environment secret names as how-tos, connection
strings, bootstrap claims, elevation procedures, allowlist bypass notes, or
token header recipes. If you need operator access, use private channels —
not this library.

## License

MIT for software and original documentation in this repository (`LICENSE`).
Third-party media and linked assets keep their own licenses. See the root README.
