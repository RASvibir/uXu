# AGENTS.md

## Cursor Cloud specific instructions

uXu is a "shared archive commons". There are two services:

### 1. Frontend — the `0?0` console / uXu PWA (static site)
- Lives in `archives/` and is a pure static site (HTML/CSS/JS, no build step). GitHub Pages publishes the `archives/` tree as the site root (see `.github/workflows/deploy-pages.yml`).
- Run locally by serving the `archives/` directory as the web root, e.g. `python3 -m http.server 8000` from inside `archives/`, then open `http://localhost:8000/index.html`.
- Non-obvious: the console hardcodes `API_BASE` to the production Worker (`https://rasvibir-api.chrf-podcast.workers.dev`) in `archives/index.html`. So the registry/manuals/logs load from that live API, not from a local worker, unless you edit `API_BASE`. This means the frontend works standalone as long as outbound network egress is available.
- There is no lint or test tooling configured for the frontend (no `package.json` at the repo root).

### 2. Backend — the `ini` runtime Cloudflare Worker (API)
- Lives in `apps/ini/` (the only `package.json` in the repo). Run with `npm run dev` (aliases `wrangler dev`) or `npx wrangler dev --port 8787 --ip 127.0.0.1`. Deploy is `npm run deploy`. No login is needed for local `wrangler dev`.
- Requires a `DATABASE_URL`. Provide it via `apps/ini/.dev.vars` (gitignored) as `DATABASE_URL="postgresql://..."`. `wrangler dev` auto-loads `.dev.vars`.
- Non-obvious: the worker uses `@neondatabase/serverless` (`neon()`), which talks to a **Neon-hosted / Neon-compatible Postgres over HTTPS** — a plain local Postgres will not work. For a throwaway dev DB, provision a temporary Neon database (no signup): `curl -s -X POST https://neon.new/api/v1/database -H 'Content-Type: application/json' -d '{"ref":"uXu-dev"}'` and use the returned `connection_string`.
- Non-obvious: on the first DB-backed request, `ensureDbInit()` in `src/index.js` creates all tables, seeds the 5 manual pages, and inserts/updates the master-admin user. It is idempotent and runs against a fresh DB, so no separate migration step is needed to boot.
- The `prisma/schema.prisma` describes a richer/legacy schema, but the Worker does **not** use Prisma at runtime (it issues raw SQL). You do not need to run Prisma migrate to run the worker.
- There is no test suite; `wrangler dev` + curl against the routes documented in `apps/ini/README.md` is the way to exercise the API.

### Quick end-to-end API check (worker running on :8787)
```
curl -s localhost:8787/api/root/system
curl -s localhost:8787/api/root/registry
curl -s -X POST localhost:8787/api/auth/signup -H 'Content-Type: application/json' -d '{"email":"a@b.test","password":"pw","handle":"Tester"}'
```
