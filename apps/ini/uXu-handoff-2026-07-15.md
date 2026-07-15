# uXu — session handoff, 2026-07-15

Repo: github.com/RASvibir/uXu
Local: ~/uXu_repo on TuffPuter

This doc only states things that were actually verified this session (checked
against the live GitHub repo, the live Neon database, or command output you
pasted back). Anything not verified is marked as such. Paste this whole file
into a new thread to continue.

---

## 1. How to apply the download

The zip has three top-level folders that map directly onto your repo root:

```
apps/       -> overwrite ~/uXu_repo/apps
archives/   -> overwrite ~/uXu_repo/archives
.github/    -> overwrite ~/uXu_repo/.github
```

Steps:

```bash
cd ~/Downloads   # or wherever the zip landed
unzip uXu-ini-neon-patch.zip -d uXu-patch
cd uXu-patch

# review the diff before overwriting anything
diff -rq apps ~/uXu_repo/apps
diff -rq archives ~/uXu_repo/archives
diff -rq .github ~/uXu_repo/.github

# if the diffs look right, copy over
cp -r apps/*      ~/uXu_repo/apps/
cp -r archives/*  ~/uXu_repo/archives/
cp -r .github/*   ~/uXu_repo/.github/

cd ~/uXu_repo
git status
git add apps archives .github
git commit -m "feat: wire root console to live Neon registry, add CORS, publish archives/ via Pages"
git push
```

**Before pushing, do these two things — the patch does not work without them:**

1. Open `archives/index.html`, find this line near the top of the `<script>` block:
   ```js
   const API_BASE = ""; // e.g. "https://uxu-ini-production.<subdomain>.workers.dev"
   ```
   Set it to your actual deployed Worker URL.

2. Deploy the Worker so the CORS change is live:
   ```bash
   cd ~/uXu_repo/apps/ini
   npx wrangler deploy
   ```

---

## 2. What changed and why (verified this session)

- **`apps/ini/src/index.js`** — added `GET /api/root`, `/api/root/registry`,
  `/api/root/manuals`, `/api/root/provenance`, `/api/root/logs`,
  `/api/root/system`, all querying the live Neon `archive_records` table
  (confirmed to exist via `\dt` in psql). Added CORS headers + `OPTIONS`
  handling so a browser on GitHub Pages can call it cross-origin.
- **`archives/index.html`** — this is the real, working CRT-terminal root
  console (confirmed by pulling the file directly from the repo). It
  previously had a hardcoded 3-entry registry in the `<script>` block. That's
  now replaced with a live `fetch()` against `/api/root/registry`, and the
  `LOGS`/`MANUAL`/`SYSTEM`/`MAP` commands now hit their matching live routes
  instead of printing static strings.
- **`.github/workflows/deploy-pages.yml`** — changed `path: 'docs'` to
  `path: 'archives'`. Confirmed this session that GitHub Pages was
  previously serving `docs/index.html`, which is a *different*, older,
  unrelated landing page ("uXu: The Archive Without Limits") with broken
  links — not the CRT console. This change makes the CRT console the actual
  public homepage.

---

## 3. Confirmed live state (via psql against the real Neon DB)

- Connected successfully to `ep-crimson-firefly-ad77brka-pooler.c-2.us-east-1.aws.neon.tech`,
  database `uXu`. (Earlier in the session, `DATABASE_URL` was pointing at a
  Supabase pooler by mistake — that was the actual root cause of an earlier
  connection failure, now resolved.)
- **8 tables exist**: `archive_records`, `archives`, `archive_links`, `items`,
  `manual_pages`, `provenance_events`, `tags`, `transparency_logs`.
- `archive_records` has 3 rows: `0?0.uXu.0000` (root), `CyberCat_Sunflower.uXu`,
  `CyberCat_Sunflower.uXu.0001`.
- `archives` (the separate, unrelated relational table) has 1 row: an
  independently-seeded `0?0` root record with a different id scheme
  (`BigInt`, `id=1`) that has never been reconciled with `archive_records`.
- The root row's `path`/`canonical_source` were stale (`/0?0/index.html`,
  `/registry/registry.json` — neither exists in the repo) and were corrected
  this session to `/archives/index.html` and `/api/root`.
- Prisma (`prisma/schema.prisma`, `prisma.config.ts`) exists locally but is
  **untracked in git** (`git status --short` showed `?? prisma/`,
  `?? prisma.config.ts`) and **has never run a migration**
  (`no migrations dir`). It defines both `archive_records` (matching what's
  live) and the separate `archives`/`items`/`tags` relational family
  (also live in the DB, unexplained how — no migration history exists to
  account for it).

**⚠️ Security:** a live Neon password was pasted in plaintext into this
chat earlier in the session (`npg_i3oSwOXTpJ2H`). If you haven't already,
rotate it in the Neon console before continuing.

---

## 4. Open items — not resolved, need a decision before more code

In priority order, roughly:

1. **`docs/` is now a dead mirror.** It's no longer published by Pages
   (see section 2) but `docs/CyberCat-Sunflower/`, `docs/seed-13/`,
   `docs/index.html` still exist as stale duplicates of `archives/` content.
   Decide: delete them, or repurpose `docs/` for what
   `docs/runtime/ini-runtime-layout.md` already says it's for (manuals /
   protocols), not archive content.

2. **`CyberCat_Sunflower.uXu`'s path in Neon is still wrong**, and now that
   Pages serves from `archives/` directly, the correct value is
   `/CyberCat-Sunflower/index.html` (hyphen, no `/archives/` prefix — the old
   value had both a typo *and* a now-redundant path segment). One-line fix,
   never applied:
   ```sql
   UPDATE archive_records
   SET path = '/CyberCat-Sunflower/index.html',
       canonical_source = '/api/root',
       updated_at = now()
   WHERE id = 'CyberCat_Sunflower.uXu';
   ```

3. **Unverified provenance claim sitting in the live DB as if settled.**
   `CyberCat_Sunflower.uXu.0001`'s row points directly at
   `http://www.textfiles.com/magazines/UXU/` (a real but *separate* 1990s
   Swedish ezine archive) with no `unresolved` flag or `partial` certainty
   visible. Nothing found this session actually links that historical archive
   to this GitHub repo — they just share a name. Needs a decision: is this a
   real, confirmed connection, or should the row be corrected to mark it
   `certainty: partial` / add an `unresolved` note?

4. **Two competing schemas for "the root record" exist simultaneously**:
   `archive_records` (flat, live, what the deployed Worker actually uses) and
   `archives` + its relational family (`archive_links`, `items`, `tags`,
   separately-scoped `provenance_events`/`transparency_logs` keyed to
   `archives.id`, not `archive_records.id`). Both have data in them. One of
   these needs to be picked as canonical, or a plan made for consolidating —
   right now they silently disagree about what "0?0" even is.

---

## 5. What NOT to re-litigate

These were already checked and confirmed this session — no need to re-verify:

- The GitHub repo's real file tree (pulled via `codeload.github.com` tarball,
  not GitHub's cached page render, which was stale/misleading early on).
- The Worker (`apps/ini`) is a real, already-configured Cloudflare Worker
  (`wrangler.toml`: `name = "uxu-ini"`), using `@neondatabase/serverless`
  against a real Neon project also named `uXu`.
- The historical 1990s textfiles.com uXu ezine and this GitHub repo are two
  different things that happen to share a name — treat any assumed link
  between them as unconfirmed (see item 3 above) until proven otherwise.
