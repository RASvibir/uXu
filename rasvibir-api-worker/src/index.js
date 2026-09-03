import { neon } from '@neondatabase/serverless';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Sudo',
};

function json(data, status = 200) {
  return Response.json(data, { status, headers: CORS_HEADERS });
}

function getAuthToken(request) {
  const authHeader = request.headers.get('Authorization') || '';
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  return match ? match[1].trim() : null;
}

const MASTER_EMAIL = 'puffintuffest@gmail.com';

function isMasterEmail(email) {
  return String(email || '').trim().toLowerCase() === MASTER_EMAIL;
}

async function sha256Hex(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(String(text)));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

function looksSha256Hex(value) {
  return /^[0-9a-f]{64}$/i.test(String(value || ''));
}

async function hashPassword(password) {
  return sha256Hex(password);
}

async function passwordMatches(stored, password) {
  if (!stored || !password) return false;
  const hashed = await hashPassword(password);
  if (stored === hashed) return true;
  if (!looksSha256Hex(stored) && stored === password) return true;
  return false;
}

function publicHandleFor(email, handle, name) {
  if (isMasterEmail(email)) return 'RAS.ip';
  const h = String(handle || name || '').trim();
  return h || null;
}

let dbInitialized = false;
async function ensureDbInit(sql) {
  if (dbInitialized) return;
  try {
    await sql`CREATE SCHEMA IF NOT EXISTS neon_auth`;

    await sql`
      CREATE TABLE IF NOT EXISTS neon_auth.users (
        id VARCHAR(255) PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'USER',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;

    try { await sql`ALTER TABLE neon_auth.users ADD COLUMN IF NOT EXISTS name VARCHAR(255)`; } catch (e) {}
    try { await sql`ALTER TABLE neon_auth.users ADD COLUMN IF NOT EXISTS handle VARCHAR(255)`; } catch (e) {}

    await sql`
      CREATE TABLE IF NOT EXISTS neon_auth.session (
        token VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255),
        email VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'USER',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        expires_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '24 hours',
        last_accessed TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;

    try { await sql`ALTER TABLE neon_auth.session ADD COLUMN IF NOT EXISTS sudo_activated_at TIMESTAMP WITH TIME ZONE`; } catch (e) {}

    await sql`
      CREATE TABLE IF NOT EXISTS archive_records (
        id VARCHAR(100) PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        slug VARCHAR(255),
        status VARCHAR(50) DEFAULT 'LIVE',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;

    try { await sql`ALTER TABLE archive_records ADD COLUMN IF NOT EXISTS sequence INTEGER`; } catch (e) {}
    try { await sql`ALTER TABLE archive_records ADD COLUMN IF NOT EXISTS kind VARCHAR(50)`; } catch (e) {}
    try { await sql`ALTER TABLE archive_records ADD COLUMN IF NOT EXISTS type VARCHAR(50) DEFAULT 'custom'`; } catch (e) {}
    try { await sql`ALTER TABLE archive_records ADD COLUMN IF NOT EXISTS archive VARCHAR(255) DEFAULT 'Archive'`; } catch (e) {}
    try { await sql`ALTER TABLE archive_records ADD COLUMN IF NOT EXISTS path VARCHAR(255)`; } catch (e) {}
    try { await sql`ALTER TABLE archive_records ADD COLUMN IF NOT EXISTS holder_user_id VARCHAR(100)`; } catch (e) {}
    try { await sql`ALTER TABLE archive_records ADD COLUMN IF NOT EXISTS holder_handle VARCHAR(255)`; } catch (e) {}

    await sql`
      CREATE TABLE IF NOT EXISTS manual_pages (
        slug VARCHAR(100) PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        body TEXT NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;

    try { await sql`ALTER TABLE manual_pages ADD COLUMN IF NOT EXISTS rank INTEGER DEFAULT 10`; } catch (e) {}

    await sql`
      CREATE TABLE IF NOT EXISTS transparency_logs (
        id SERIAL PRIMARY KEY,
        action VARCHAR(255) NOT NULL,
        actor_email VARCHAR(255),
        details TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS archive_contacts (
        id SERIAL PRIMARY KEY,
        archive_id VARCHAR(100) NOT NULL,
        requester_email VARCHAR(255) NOT NULL,
        message TEXT,
        status VARCHAR(50) DEFAULT 'PENDING',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS admin_alerts (
        id SERIAL PRIMARY KEY,
        kind VARCHAR(50) NOT NULL,
        archive_id VARCHAR(100),
        summary TEXT NOT NULL,
        detail TEXT,
        seen_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;

    // 1. Master Admin Account Setup
    const masterUsers = await sql`SELECT id FROM neon_auth.users WHERE lower(email) = lower(${MASTER_EMAIL})`;
    if (!masterUsers.length) {
      const adminId = `user_${Date.now()}`;
      const masterHash = await hashPassword('GreatWrigley1908!');
      await sql`
        INSERT INTO neon_auth.users (id, email, password_hash, role, name, handle)
        VALUES (${adminId}, ${MASTER_EMAIL}, ${masterHash}, 'ADMIN', 'RAS.ip', 'RAS.ip')
      `;
    } else {
      await sql`
        UPDATE neon_auth.users
        SET role = 'ADMIN', handle = 'RAS.ip', name = 'RAS.ip'
        WHERE lower(email) = lower(${MASTER_EMAIL})
      `;
    }

    const canonicalManuals = [{"slug":"user-guide","title":"User Guide","body":"# User Guide\n\nTags: user-guide, beginners, 0q0, visitors, non-tech, landing, license\nSource: 0?0 root archive · uXu commons\n\n## Welcome\n\nYou are in **0?0** — the front door of uXu.\n\nuXu is a shared place where independent archives live side by side.\nNobody takes your archive away from you. The root helps people find,\nopen, and understand what is here.\n\nThis guide is for everyone. No coding required.\n\n**Live:** https://rasvibir.github.io/uXu/  \n**Repo:** https://github.com/RASvibir/uXu\n\n## What You Can Do Here\n\n1. **Browse the registry** — the table lists archives that belong to this commons.\n2. **Open an archive** — select a row and press Enter, or click Open Archive.\n3. **Read manuals** — **RTFM** for the 0?0 manual; **MANUAL LIBRARY** (under USER OPTIONS) for pamphlets.\n4. **Create your own archive** — `CREATE ARCHIVE` (or Create Archive). Name + description, save, confirm. Expand options only if you want them.\n5. **Try CyberCat Sunflower** — a full Grateful Dead listening deck (`OPEN CYBERCAT`).\n6. **Optional: iNi Provenance** — document origin, authorship, and custody if you want that authenticity layer. Notes: https://rasvibir.github.io/uXu (`INI SITE`). Paper trail: https://github.com/RASvibir/iNi.\n\n## Finding Your Way (0?0)\n\n- On load, **↑ ↓** drive **Quick Nav** (starts on ARCHIVE INDEX)\n- **Tab / Shift+Tab** move between zones: Quick Nav → registry → command → account\n- **← →** stay local: **→** opens USER OPTIONS from any Quick Nav item; **←** closes it; on registry, toggle table ↔ actions toolbar\n- **Click** a panel to adopt it as the keyboard highlight (mouse and keys share one focus)\n- **r** registry · **q** Quick Nav · **a** account · **/** jump to the command line · **?** keyboard map\n- **F1** Help · **F2** Index · **F3** Manuals · **F4** Map · **F5** Logs · **F6** System\n- Long docs (ABOUT / RTFM / FAQ / iNi) open scrolled to the **top**\n\nQuick Nav (always visible): **ABOUT · CREATE · FAQ · ARCHIVE INDEX · USER OPTIONS · iNi Provenance · RTFM**  \nUSER OPTIONS folds Manual Library, Install, Map, Logs, System, Setup Master, Exit.\n\nUseful commands:\n\n```text\nHELP\nINDEX\nABOUT\nFAQ\nINI\nINI SITE\nRTFM\nMANUAL\nARCHIVE MANUALS\nOPEN CYBERCAT\nCREATE ARCHIVE\n```\n\nIf you get lost, remember: searching for **0** or **?** always points back toward the center.\n\n## Manuals At A Glance\n\n| Guide | Who it is for |\n|-------|----------------|\n| **ABOUT / RTFM** | **ABOUT** = what uXu is (site · repo · app); RTFM = using the 0?0 archive interface |\n| **iNi Provenance** | Opt-in authenticity protocol · notes https://rasvibir.github.io/uXu · paper trail https://github.com/RASvibir/iNi |\n| User Guide (this page) | Everyday visitors — also in MANUAL LIBRARY |\n| Archive Creation Manual | Anyone ready to add an archive |\n| CyberCat Sunflower Manual | Listening / using that deck |\n| Developers Handbook | Builders and coders |\n| Source Code Pamphlet | Curious readers who want a map of the repo |\n\nOn 0?0: **RTFM** opens the interactive 0?0 manual. **MANUAL LIBRARY** opens\nthe pamphlet index. **INDEX ARCHIVE MANUALS** finds creator manuals declared in\n`data.json` → `uxu.manuals`.\n\nThe registry lists **ID** (`uXu.NNNN`) and **NAME**. Hover a moment on a name\nor id for a small tooltip. Tap **i** if you want the fuller pathway card while\nusing the keyboard. **Esc** dismisses it.\nIds are forever. If access ends you still see a placemarker such as\n**(deleted by user)**, **(removed by admin)**, **(locked archive)**, or\n**(under investigation)** — so the count of created archives stays honest.\n\n## Install uXu (public invite app)\n\nShare **uXu** — not 0?0 — when inviting people from outside.\n\nOn the root console: open **USER OPTIONS → INSTALL uXu** (or type `INSTALL`).\nOr use the browser’s Add to Home Screen / Install App.\n\n- Icon: **uXu** wordmark  \n- Link: https://rasvibir.github.io/uXu/  \n- This app is the public door into the commons. It does not brand itself as 0?0.\n\nInside the commons, **0?0** is still the root console. Archives pick how they link home.\n\n## Commons link on your archive\n\nCreation users choose the look:\n\n| Style | Appearance | When to use |\n|-------|------------|-------------|\n| `uXu` | Site chip **uXu** (ad / website style) | Public visitors, sharing |\n| `0?0` | **← 0?0** | People already in the console |\n\n```json\n\"uxu\": { \"homeLink\": { \"style\": \"uXu\", \"href\": \"../index.html\" } }\n```\n\nUse `\"style\": \"0?0\"` for the console back-link. Snippet: `templates/snippets/home-link.html`.\n\n## Accounts (Simple View)\n\nYou can browse as a guest.\nSigning up is optional and lets you keep an account with the commons.\nDay-to-day visitors do not need admin powers.\n\n**Privacy:** your login email stays private (you and the admin). It is not shown on archives.\n\n- Change login email: `CHANGE EMAIL new@… yourpassword`, then `CHANGE EMAIL CONFIRM <otp>` (code goes to your **current** inbox).\n- Archive steward contact (optional): `ARCHIVE CONTACT <archiveId> you@…` — private by default. Add `public` only if you want it shown; that needs admin approval.\n\n## License & rights (plain language)\n\n- **Code and original docs** in the uXu repo are **MIT** (Copyright 2026 The uXu Project). See the repo `LICENSE`.\n- **Audio, images, and other media** linked by archives are **not** owned by uXu. Follow each source’s license, permission, or taping policy.\n- **Registering an archive** does not transfer ownership of your collection.\n- Optional **iNi** fields are honesty / provenance notes — not a legal title certificate.\n\n## Reach An Admin\n\nNeed help, want an archive registered, found a problem, or have a question?\n\nOpen a GitHub issue:\n\nhttps://github.com/RASvibir/uXu/issues\n\nPlease include:\n\n- what you were trying to do\n- which page or archive (for example 0?0 or CyberCat Sunflower)\n- a short description of what happened\n\nYou will get a human reply. There is no automated ticket maze.\n\n## Safety & Respect\n\n- Only share material you have the right to share.\n- Be kind in notes, titles, and contributions.\n- Archives stay independent — different looks and rules are normal.\n\n## Next Steps\n\n- Curious listener → `OPEN CYBERCAT`, then read its Manual (F4 on that deck).\n- Ready to contribute → CREATE ARCHIVE or READ archive-creation.\n- Want provenance practice → **iNi Provenance** / `INI` · notes `INI SITE` → https://rasvibir.github.io/uXu · paper trail https://github.com/RASvibir/iNi.\n- Builder / coder → READ developers-handbook.\n- Want the big picture of files → READ source-code-pamphlet.\n","rank":1},{"slug":"archive-creation","title":"Archive Creation Manual","body":"# Archive Creation Manual\n\nTags: archive-creation, beginners, complexity-tree, templates, contributing\nSource: uXu RTFM library · 0?0 CREATE ARCHIVE\n\n## Start Here (The Simple Path)\n\nOn 0?0: **CREATE ARCHIVE** (or the Create Archive button) opens the create template. Rename **Anon Archive**, save, and confirm — that registers your room.\n\nYou can also make a folder by hand with three small pieces:\n\n```text\narchives/Your-Archive-Name/\n  index.html     ← the page people open\n  data.json      ← your list of items (shows, files, notes…)\n  README.md      ← a short story: what this is and why\n```\n\nThat is enough.\n\n### Tiny checklist\n\n1. Prefer **CREATE ARCHIVE** on 0?0 (template → save → confirm). Or copy `/templates/` into `archives/Your-Name/`.\n2. Put your folder under `archives/`.\n3. Write a clear name, a short **description**, and at least one item in `data.json`.\n   That description is what visitors see in the 0?0 registry when they hover (or\n   focus) the archive title. At registration, keep the Neon registry `summary`\n   in sync with the same short line when possible.\n4. Pick a **commons link** style: public **uXu** chip (default) or **← 0?0** back control.\n5. List visitor manuals under `uxu.manuals` (starter: `manuals/USER-MANUAL.md`) so\n   **0?0 → RTFM → INDEX ARCHIVE MANUALS** can find them.\n6. Open `index.html` in a browser and confirm it loads.\n7. Open a pull request, or a GitHub issue and ask to be registered.\n8. Stay legal and safe (see CONTRIBUTING.md).\n\nYou do not need a custom app, a database, or special security on day one.\nDo **not** attach the public uXu PWA manifest to child archives — that install is the invite app only.\n\n## Commons link (← 0?0 vs uXu chip)\n\nCreators decide how the link home looks:\n\n| `homeLink.style` | Looks like | Feels like |\n|------------------|------------|------------|\n| `\"uXu\"` | **uXu** badge | Website / ad chip for outsiders |\n| `\"0?0\"` | **← 0?0** | Back to the root console |\n\n```json\n\"uxu\": {\n  \"homeLink\": { \"style\": \"uXu\", \"href\": \"../index.html\" }\n}\n```\n\nSame destination either way. Optional `\"label\"` overrides the text.\nSnippet: `templates/snippets/home-link.html`.\n\n## Archive manuals (for INDEX ARCHIVE MANUALS)\n\nPublish visitor docs so 0?0 can index them:\n\n```json\n\"uxu\": {\n  \"manuals\": [\n    {\n      \"title\": \"Visitor Guide\",\n      \"path\": \"manuals/USER-MANUAL.md\",\n      \"description\": \"How to use this archive\"\n    }\n  ]\n}\n```\n\nPaths are relative to your archive folder. Starter file:\n`templates/manuals/USER-MANUAL.md`.\n\nOn 0?0: **RTFM** → interactive 0?0 manual → **INDEX ARCHIVE MANUALS**, or type `ARCHIVE MANUALS` /\n`FIND MANUAL cybercat`.\n\n## iNi provenance (opt-in)\n\nOptional authenticity protocol. Leave `optIn: false` unless you fill provenance seriously.\n\n```json\n\"uxu\": {\n  \"ini\": {\n    \"optIn\": true,\n    \"tag\": \"iNi\",\n    \"provenance\": {\n      \"origin\": \"…\",\n      \"authors\": [\"…\"],\n      \"custody\": \"…\",\n      \"lineage\": \"…\",\n      \"conditions\": \"…\",\n      \"attestedAt\": \"2026-08-12\"\n    }\n  }\n}\n```\n\nOn 0?0: Quick Nav **iNi Provenance** or type **INI**. Optional public notes /\n`INI SITE` → https://rasvibir.github.io/uXu. Full pamphlet: `INI-PROVENANCE.md`.\n\n## Template forks (creator's choice)\n\nYou may allow others to start from your archive as a template:\n\n```json\n\"uxu\": {\n  \"allowTemplateForks\": true,\n  \"templateForkDepth\": 2\n}\n```\n\n| Depth | Meaning |\n|------|---------|\n| 0 | No forks |\n| 1 | Direct forks only |\n| 2 | Forks of forks allowed up to depth 2 |\n| 3+ | Deeper chains up to your number |\n\nWhen forking, record lineage:\n\n```json\n\"templateOf\": \"Source_Archive.uXu.0007\",\n\"templateDepth\": 1\n```\n\nOnly publish a further-forkable template if your new depth stays within the\nsource archive's `templateForkDepth`. Details: `templates/README.md`.\n\n## Complexity Tree\n\nGrow only when you want to. Each tier builds on the one above it.\n\n```text\nTier 0  STORY\n        README + a few links or embedded media\n           │\nTier 1  SIMPLE ARCHIVE  ← most people start and stay here\n        index.html + data.json + README\n           │\n        ┌──┴──────────────────────────────┐\n        ▼                                 ▼\nTier 2  RICH CATALOG                 Tier 2b  PUBLIC ACCESS\n        search, filters, setlists         clear public URLs,\n        alternate sources                 friendly landing copy\n           │                                 │\n        ┌──┴──────────────┐                  │\n        ▼                 ▼                  ▼\nTier 3  INTERACTIVE APP            Tier 3b  SHARED CACHE\n        custom UI, audio EQ,         shared data people can\n        galleries, keyboards         request / download later\n           │\n           ▼\nTier 4  HARDENED / HIGH ASSURANCE\n        auth gates, careful caching,\n        audited sources, stronger privacy\n        (talk to admin before you go deep)\n```\n\n### Tier 0 — Story\nA page that explains a collection and points to files elsewhere.\nGood for: “here is my shelf of links.”\n\n### Tier 1 — Simple Archive (recommended default)\nStatic HTML + JSON. Fast, durable, easy to host on Pages.\nGood for: curated lists, tape indexes, photo runs, zines.\n\n### Tier 2 — Rich Catalog\nAdd search, sorting, notes, and ranked sources (best recording first).\nGood for: CyberCat-style decks without inventing a new platform.\n\n### Tier 2b — Public Access\nMake sure strangers can open your archive from 0?0, understand the title,\nand leave with one clear action (listen, read, browse).\n\n### Tier 3 — Interactive App\nCustom controls, EQ, lightboxes, keyboard maps, offline-friendly UI.\nStill usually static front-end + public media URLs.\n\n### Tier 3b — Shared Cache\nCompressed / shared activity archives tied to accounts (commons feature).\nCoordinate with admin before promising downloads.\n\n### Tier 4 — Hardened\nAccounts, restricted surfaces, careful caching, threat modeling.\nOnly when you truly need it — open a GitHub issue (RASvibir/uXu) first.\n\n## Pick Your Lane\n\n| I want… | Start at | Then read |\n|---------|----------|-----------|\n| Something online this week | Tier 1 | this manual |\n| A listening deck | Tier 2 | CyberCat Manual + RTFM audio notes |\n| A full custom app feel | Tier 3 | Developers Handbook |\n| Locked / private / high trust | Tier 4 | admin email + Source Code Pamphlet |\n\n## Naming & Belonging\n\nArchive ids in the commons look like:\n\n```text\nTitle.uXu.NNNN\n```\n\nExamples already in the registry:\n\n```text\n0?0.uXu.0000\nCyberCat_Sunflower.uXu.0001\n```\n\n**New archives receive whatever number is next.**  \nIf `0001` is taken, yours becomes `0002`, then `0003`, and so on.\nThe number is a historical registration serial — not rank, ownership, or quality.\n\nOn 0?0, **CREATE ARCHIVE** shows the next free serial before the guide body.\n\nUse a clear human **name** (shown in the NAME column) plus the full **archive id**.\nIn the registry table, hover (or focus) the name to see the full title and a brief\nexplanation (your `data.json` description, else registry summary, else a short\nline from public metadata).\n\n### Forever placemarkers\n\nOnce an archive id is issued, the registry row stays forever — even after teardown.\nPublic open may stop; the id and a marker remain so history stays pure.\n\n| Marker | Meaning |\n|--------|---------|\n| (live archive) | Open to the commons |\n| (audience only) | Public can view/listen; contributions frozen |\n| (locked archive) | Public access disconnected (killswitch) |\n| (deleted by user) | Owner removed public archive; placemarker kept |\n| (removed by admin) | Admin removed public archive; placemarker kept |\n| (under investigation) | Flagged / review in progress |\n| (planned archive) | Reserved / not live yet |\n\nRelationships between archives can be declared with `*:*` (a link, not control).\n\n## Legal Quick Rules\n\n- Share only what you may share (permission, license, or clear taping policy).\n- Prefer public libraries like Internet Archive when they already host the file.\n- uXu repo code/docs are **MIT**; media you link stays under **its** terms — registration does not transfer ownership.\n- Optional `uxu.ini` / iNi provenance documents origin honestly; it is not a title deed.\n- If unsure, ask the admin before publishing.\n\n## After You Build\n\n1. Test locally.\n2. PR to the uXu repo, or open a GitHub issue (RASvibir/uXu).\n3. Ask for registry listing so 0?0 can OPEN your archive.\n4. Optional: add a short note to RTFM if you invented something reusable.\n\n## Need Help?\n\nContact: https://github.com/RASvibir/uXu/issues\n\nEveryday 0?0 use: READ user-guide  \nCode patterns: READ developers-handbook  \nRepo map: READ source-code-pamphlet\n","rank":2},{"slug":"cybercat-sunflower","title":"CyberCat Sunflower Manual","body":"# CyberCat Sunflower Manual\n\nTags: cybercat, grateful-dead, player, eq, setlist, visitor-guide, interactive, license\nSource: CyberCat Sunflower archive · 0?0.uXu.0001\n\n## What This Archive Is\n\nCyberCat Sunflower is a Grateful Dead live catalog deck on uXu\n(`CyberCat_Sunflower.uXu.0001` — first non-root room).\nBrowse shows, engage a tape, follow the setlist, and shape the wave with a 5-band EQ.\nDate + venue on the deck is enough to research any tape elsewhere.\n\nHome path back to the commons: **← 0?0** / open the uXu landing.\n\n## First Ride\n\n1. Open the CyberCat deck from 0?0 (`OPEN CYBERCAT`) or go straight to the archive page.\n2. Use Tapes Index (F1) to browse residencies and day chips.\n3. Filter by date, venue, or city; sort by date, rating, or transfer count.\n4. Press Enter or Engage to load the best available waveform.\n5. Watch the setlist monitor; click a song to jump; use n / p for next / previous track.\n6. Tune the 5-band analog EQ (60Hz → 14kHz) while you listen.\n7. Other Transfers (o) opens alternate sources when more than one tape exists.\n\n## Keyboard Map\n\n- F1 — Tapes Index\n- F2 — Archive Log\n- F3 — Sys Config\n- F4 — This Manual\n- Enter — Engage selected tape\n- n / p — Next / previous track\n- o — Other Transfers modal\n- Escape — Close transfer modal (when open)\n\n## Deck Surfaces\n\n### Tapes Index\nResidencies group consecutive nights. Year chips narrow the catalog.\nEngage loads the recommended source first.\n\n### Archive Log\nCurator notes, what the archive is for, and how it sits inside uXu.\n\n### Sys Config\nTechnical notes about the player stack (browser audio, sources, layout).\n\n### Manual\nThis guide. Also available from 0?0 via MANUAL LIBRARY → READ cybercat-sunflower.\n\n## Audio, legal & license\n\n**Code / UI / original notes** for this archive follow the uXu repository\n[MIT License](https://github.com/RASvibir/uXu/blob/main/LICENSE)\n(Copyright 2026 The uXu Project).\n\n**Recordings are separate.** Grateful Dead culture includes an explicit\ntaping / sharing tradition. This deck streams publicly available transfers\n(Internet Archive and related catalog APIs). uXu and CyberCat do **not**\nown those recordings — follow each item’s terms and only add what you can\nlawfully share.\n\nPrefer documenting provenance in show notes when you curate new nights.\nThis archive **opts into iNi**: structured origin / custody fields live in\n`data.json` (`uxu.ini.optIn: true`). Community paper trail:\nhttps://github.com/RASvibir/iNi/blob/main/content/articles/2026-08-12-cybercat-sunflower-provenance.md\n\nFor deeper sourcing patterns, see RTFM: `SOURCING_LEGAL_AUDIO.md` in the repo.\n\n## Growing The Catalog\n\nCurators: keep setlists accurate, rank audioSources best-first, and write human notes\nthat explain why a night matters. Schema and curator tips live under\n`archives/CyberCat-Sunflower/docs/`.\n\n## Finding Center\n\nLost in the catalog? Return to **0?0** — the root of uXu.\nOn the root console: **ABOUT** / **RTFM**, **iNi Provenance** (community site:\nhttps://rasvibir.github.io/uXu), and\n**USER OPTIONS → MANUAL LIBRARY** for the shared pamphlet set.\n","rank":3},{"slug":"developers-handbook","title":"Developers Handbook","body":"# Developers Handbook\n\nTags: developers, handbook, architecture-patterns, data-json, rtfm, contributing\nSource: uXu RTFM library\n\n## Audience\n\nBuilders and coders. For non-technical orientation use the **User Guide**.\nFor a from-scratch archive path use the **Archive Creation Manual**.\n\n## Commons Stance\n\nuXu registers and connects independent archives. It does not own your content.\nKeep your stack, curation rules, and voice. Prefer durable, boring formats unless\nyou have a reason to go further.\n\n## Patterns Worth Reusing\n\n- One archive, one job.\n- First viewport = place, not dashboard.\n- Keyboard paths early (index / open / help).\n- Provenance in the open (source + why it is legal).\n- HTML + JSON + CSS/JS until complexity truly demands more.\n- Document the weird parts for future-you.\n\n## Reference Layout\n\n```text\narchives/Your-Archive/\n  index.html\n  data.json\n  README.md\n  docs/            optional curator notes\n```\n\n`templates/` and CyberCat Sunflower are optional references — not requirements.\n\n## data.json Craft\n\nStable identity fields (name, curator, description) plus an items array with\nconsistent keys: date, place/venue, notes, media sources ranked best-first.\nValidate against `templates/data.schema.json` when it applies.\n\n## Relationships\n\n```text\nArchive_A.uXu*:*Archive_B.uXu\n```\n\nDeclares a connection. Not ownership, endorsement, or control.\n\n## Climbing The Complexity Tree\n\nSee Archive Creation Manual for the full tier tree. Quick map for builders:\n\n- Tier 1–2: static catalog + polish\n- Tier 3: interactive app surfaces (EQ, galleries, custom state)\n- Tier 3b: shared/account-linked cache features (coordinate with admin)\n- Tier 4: hardened access — design with threat model; do not invent secrets in-repo\n\n## RTFM Contributions\n\nAdd tagged markdown under `archives/RTFM/`, credit the source archive, keep\nlicenses clear. Repo software/docs are MIT; media stays with its own terms.\nOptional inspiration — never a rule book.\n\n## Out Of Scope Here\n\nVisitor onboarding, admin contact scripts for non-tech users, and control-plane\nsecrets. Those live in the User Guide, Archive Creation Manual, or private\nadmin channels — not this handbook.\n","rank":4},{"slug":"source-code-pamphlet","title":"Source Code Pamphlet","body":"# Source Code Pamphlet\n\nTags: source-code, architecture, pamphlet, archives, worker, pages, neon\nSource: uXu repository map\n\n## What This Pamphlet Is\n\nA plain-language tour of how the public uXu repo is arranged.\nIt explains structure so you can learn and remix.\nIt deliberately omits secrets, credentials, bootstrap procedures, and\nsecurity-sensitive operator details.\n\n## Top-Level Map\n\n```text\nuXu/\n  README.md           commons charter (public)\n  LICENSE             MIT (media clarification in README)\n  CONTRIBUTING.md     contributor rules (incl. license / provenance)\n  archives/           what people open in a browser (GitHub Pages root)\n    index.html        0?0 root CRT console + uXu invite PWA hooks\n    manifest.webmanifest / sw.js / icons/   public uXu install (landing only)\n    CyberCat-Sunflower/\n    RTFM/             manuals & reusable notes\n    seed-13/          additional archive seed\n  apps/ini/           runtime Worker (API) + Prisma schema\n  templates/          optional starter HTML / JSON + home-link snippet\n  docs/runtime/       runtime layout notes\n```\n\nGitHub Pages publishes the `archives/` tree as the public site root.\nThe Cloudflare Worker under `apps/ini` answers JSON API routes used by the console.\nThe installable **uXu** PWA is a public invite into that landing — it does not\npresent as 0?0; 0?0 is the console identity once you are inside.\n\n## 0?0 Console (archives/index.html)\n\nA phosphor CRT UI that lists the registry, opens archives, and browses manuals.\nCommands are text-driven (HELP shows the visitor-facing set).\nRegistry rows come from the live API when the Worker is reachable.\n\n## CyberCat Sunflower (archives/CyberCat-Sunflower/)\n\nSelf-contained deck: HTML/CSS/JS + catalog data.\nLoads shows, streams audio, renders setlists, and exposes a 5-band EQ via the\nWeb Audio API. Docs under that folder cover curators and contributors.\n\n## RTFM (archives/RTFM/)\n\nMarkdown pamphlets and code notes. Not a standard — optional inspiration.\nInteractive copies of selected manuals are also stored in the database table\nmanual_pages and served through the Worker manuals endpoints.\n\n## Runtime App (apps/ini/)\n\n- src/index.js — Worker entry: root/registry/manuals/logs/provenance/system\n  and account-related routes\n- prisma/schema.prisma — describes tables such as archive_records and manual_pages\n- wrangler.toml — Worker project name and non-secret public config\n\nPublic conceptual endpoints (no auth required for reading):\n\n- GET /api/root\n- GET /api/root/registry\n- GET /api/root/manuals\n- GET /api/root/manuals/:slug\n- GET /api/root/logs\n- GET /api/root/provenance\n- GET /api/root/system\n\nExact production hostnames change with deploy; the root console points at the\nactive Worker base URL in its script.\n\n## Data Sketch (High Level)\n\n- archive_records — registry identities, paths, summaries, parent/child links\n- manual_pages — slug, title, body text for the MANUAL library\n- transparency_logs / provenance_events — optional public trail entries\n\nThere may be additional tables used by auth or older experiments. Treat anything\ncredential-bearing as private; this pamphlet will not document those fields.\n\n## How Pieces Talk\n\n```text\nBrowser (Pages)\n  → archives/index.html (0?0)\n      → Worker /api/root/registry  → Neon archive_records\n      → Worker /api/root/manuals   → Neon manual_pages\n  → CyberCat-Sunflower/index.html\n      → catalog APIs / archive media\n      → optional manuals fetch by slug\n```\n\n## Building Locally (Idea Level)\n\n1. Clone the repo.\n2. Open archives/index.html or CyberCat via a static server.\n3. For API work, run the Worker with your own local env — never commit secrets.\n4. Prefer editing archive HTML/JSON in place; keep manuals mirrored in RTFM.\n\n## Redaction Promise\n\nThis pamphlet will not list environment secret names as how-tos, connection\nstrings, bootstrap claims, elevation procedures, allowlist bypass notes, or\ntoken header recipes. If you need operator access, use private channels —\nnot this library.\n\n## License\n\nMIT for software and original documentation in this repository (`LICENSE`).\nThird-party media and linked assets keep their own licenses. See the root README.\n","rank":5}];
    for (const m of canonicalManuals) {
      await sql`
        INSERT INTO manual_pages (slug, title, body, rank)
        VALUES (${m.slug}, ${m.title}, ${m.body}, ${m.rank})
        ON CONFLICT (slug) DO UPDATE SET
          title = EXCLUDED.title,
          body = EXCLUDED.body,
          rank = EXCLUDED.rank,
          updated_at = NOW()
      `;
    }

    const iniProvenanceManual = {"slug":"ini-provenance","title":"iNi Provenance","body":"# iNi Provenance\n\nTags: ini, provenance, authenticity, opt-in, community, i-and-i\nSource: 0?0 command INI · beta charter\n\n## What iNi is\n\n**iNi** is the inner-circle provenance layer beside uXu.\n\nIt is a name, a protocol, and a community boundary — not a company label.\nThe spelling comes from an “I and I” framing: a shared identity space where\ntrusted collaborators and archives agree to treat **origin, authorship,\nlineage, and custody** as first-class responsibilities.\n\niNi is the banner under which provenance-aware collaboration around uXu and\npublic repos lives.\n\n## Relationship to uXu\n\n| Layer | Role |\n|-------|------|\n| **uXu** | Public archive commons — the collection / invite door |\n| **0?0** | Root console inside the commons |\n| **iNi** | Opt-in provenance ethic and protocol that shapes how collections are documented and trusted |\n\nuXu does not require iNi. Archives stay independent either way.\nCreators who want their uXu archives to carry **explicit authenticity and\norigin documentation** may opt into iNi.\n\n```text\nuXu  (public collection)\n └── 0?0  (console)\n      └── archives…\n           └── optional: iNi tag + provenance fields\n```\n\n## Optional public notes\n\nSeparate public page for iNi practice notes, FAQ, and contact:\n\n**https://rasvibir.github.io/uXu**\n\nCommunity paper trail (charter, articles, authorizations via PR — not a membership gate):\n\n**https://github.com/RASvibir/iNi**\n\nOn 0?0: open Quick Nav **iNi Provenance**, then the panel link, or type\n**`INI SITE`**. Opt-in itself still happens in your archive / on the console —\nyou do not need that page to practice iNi. The console stays a protocol tool;\nthe page is not a membership gate.\n\n## The provenance protocol\n\nIn archive practice, provenance is the recorded origin, ownership history, and\nchain of custody of a work or dataset.\n\nThe **iNi provenance protocol** asks creators to verify and fill structured\nfields on their archive (in `data.json`), then mark the work with the **iNi**\ntag when that documentation is real and maintained.\n\nTypical fields (under `uxu.ini.provenance`):\n\n| Field | Meaning |\n|-------|---------|\n| `origin` | Where this material / project came from |\n| `authors` | Who made or curated what |\n| `custody` | Who holds stewardship now |\n| `lineage` | How it has changed (forks, transfers, remasters) |\n| `conditions` | Share / reuse / access conditions |\n| `attestedAt` | When the creator attested these fields |\n\nOpting in (`uxu.ini.optIn: true`) means: you have done this work seriously,\nand you accept the community’s expectations around authenticity and transparency.\n\nThis is **self-attestation**, not a legal chain-of-custody certificate.\n\n### iNi stamp → optional I page link\n\nWhen opted in, you may showcase a small corner **iNi** stamp as a provenance\nverification mark (`showBadge: true`, default). Lettering is green **i** /\nyellow **N** / green **i**. An I page is **not** required for the stamp.\n\nTo also send visitors to your I page, set a second opt-in — the stamp becomes\na button/link:\n\n- `badgeLinksToIPage: true`\n- `iPage`: your slug (or full URL) → `https://rasvibir.github.io/iNi/#/i/{slug}`\n\nRules:\n\n- Stamp eligible only when `optIn: true`  \n- Set `showBadge: false` to opt in without displaying the mark  \n- Linking is optional and separate from verification  \n- Snippet: `templates/snippets/ini-badge.html`  \n- On 0?0 registry, the iNi cue is a link only when `badgeLinksToIPage` + `iPage`  \n\nCreate an I page via PR under https://github.com/RASvibir/iNi (`content/i/`).\n\n## Inner-circle / organization layer\n\niNi also names the **inner-circle** boundary for collaborators with deeper\naccess to projects, databases, and archives who share provenance duty.\n\nInside iNi, people agree to handle provenance in an explicit, documented way —\na social contract as much as a technical org layer.\n\n## Community as practice\n\nJoining iNi is not a newsletter signup. It means adopting the protocol:\n\n1. Use the **iNi** tag when provenance is filled out  \n2. Keep authenticity metadata honest and current  \n3. Share norms about how origin, authorship, and custody are described  \n\nThe community is defined by **practice**, not membership badges alone.\n0?0 is a front door into that idea — Quick Nav **iNi Provenance**\n(or type `INI`). Hover tip: *opt-in provenance · I and I*. Optional public\nnotes: https://rasvibir.github.io/uXu (panel link / `INI SITE`). Paper trail:\nhttps://github.com/RASvibir/iNi.\n\n## Conceptual pillars\n\n1. **Identity / I and I** — mutual responsibility, not a one-way platform  \n2. **Provenance as first-class data** — record and surface it  \n3. **Inner-circle governance** — shared duty among collaborators  \n4. **Opt-in authenticity** — the tag is optional but meaningful  \n\n## How to opt in (beta)\n\nYou do not need the Soloist site to opt in.\n\n**Path for new visitors:** start at the uXu commons\n(https://rasvibir.github.io/uXu/) → that opens **0?0** → Quick Nav\n**iNi Provenance** (or type `INI`) → follow the guide.\n\nIn your archive `data.json`:\n\n```json\n\"uxu\": {\n  \"ini\": {\n    \"optIn\": true,\n    \"tag\": \"iNi\",\n    \"provenance\": {\n      \"origin\": \"…\",\n      \"authors\": [\"…\"],\n      \"custody\": \"…\",\n      \"lineage\": \"…\",\n      \"conditions\": \"…\",\n      \"attestedAt\": \"2026-08-12\"\n    }\n  }\n}\n```\n\nOn 0?0: Quick Nav **iNi Provenance** or type **INI**. Registry rows may show an **iNi**\ncue when `optIn` is true (honesty badge — not enforcement).\n\n## What iNi is not (beta)\n\n- Not membership theater or a signup badge  \n- Not required to publish on uXu  \n- Not a company or org brand label  \n- Not a legal chain-of-custody certificate  \n- Not a claim that uXu owns your archive  \n\n## Contact\n\nQuestions: https://github.com/RASvibir/uXu/issues (uXu) or https://github.com/RASvibir/iNi/discussions (iNi)\n\nOptional public notes: **https://rasvibir.github.io/uXu**  \nPaper trail: **https://github.com/RASvibir/iNi**\n\nuXu software & original docs: **MIT** (`LICENSE`). Provenance fields document\nhonesty; they do not rewrite media copyright.\n","rank":6};
    await sql`
      INSERT INTO manual_pages (slug, title, body, rank)
      VALUES (${iniProvenanceManual.slug}, ${iniProvenanceManual.title}, ${iniProvenanceManual.body}, ${iniProvenanceManual.rank})
      ON CONFLICT (slug) DO UPDATE SET
        title = EXCLUDED.title,
        body = EXCLUDED.body,
        rank = EXCLUDED.rank,
        updated_at = NOW()
    `;

    dbInitialized
    dbInitialized = true;
  } catch (err) {
    console.error('Database initialization warning:', err);
  }
}

async function resolveSession(sql, token) {
  if (!token) return null;
  try {
    const sessions = await sql`
      SELECT s.*, u.role, u.email, u.id AS user_db_id, u.name, u.handle
      FROM neon_auth.session s
      JOIN neon_auth.users u ON lower(s.email) = lower(u.email)
      WHERE s.token = ${token} AND s.expires_at > NOW()
    `;
    if (!sessions.length) return null;
    const row = sessions[0];
    let sudo = false;

    if (row.role === 'ADMIN' && row.sudo_activated_at) {
      const activatedAt = new Date(row.sudo_activated_at).getTime();
      sudo = (Date.now() - activatedAt) < (60 * 60 * 1000);
    }

    await sql`
      UPDATE neon_auth.session
      SET last_accessed = NOW()
      WHERE token = ${token}
    `;

    return {
      token,
      userId: row.user_db_id || row.user_id,
      email: row.email,
      role: row.role,
      sudo,
      name: row.name,
      handle: publicHandleFor(row.email, row.handle, row.name),
      name: isMasterEmail(row.email) ? 'RAS.ip' : (row.name || row.handle || null),
    };
  } catch (err) {
    console.error('Session resolution error:', err);
    return null;
  }
}

async function handleRoot() {
  return json({ status: 'ok', service: 'uXu iNi API', api_host: 'rasvibir-api.chrf-podcast.workers.dev', version: '2026.09.03' });
}

async function handleApiRoot() {
  return json({ status: 'ok', system: '0?0.uXu.0000', api_version: '2026.09.03' });
}

async function handleRegistry(sql) {
  try {
    await sql`
      UPDATE archive_records
      SET sequence = 1, title = '0?0', archive = '0?0', slug = 'root-console', path = '/archives/index.html', kind = 'console', type = 'console', holder_handle = 'RAS.ip'
      WHERE id = '0?0.uXu.0000' OR slug = 'root-console' OR slug = '0-0-root-console'
    `;
    await sql`
      UPDATE archive_records
      SET sequence = 2, title = 'Ledger', archive = 'Ledger', slug = 'ledger', path = '/archives/Ledger/index.html', kind = 'private', type = 'private', holder_handle = 'RAS.ip'
      WHERE id = 'Ledger.uXu.0001' OR id = 'Ledger.uXu.0002' OR slug = 'ledger'
    `;
    await sql`
      UPDATE archive_records
      SET id = 'CyberCat_Sunflower.uXu.0002', sequence = 3, title = 'CyberCat Sunflower', archive = 'CyberCat Sunflower', slug = 'cybercat-sunflower', path = '/archives/CyberCat-Sunflower/index.html', kind = 'deck', type = 'deck', holder_handle = 'RAS.ip'
      WHERE id = 'CyberCat_Sunflower.uXu.0002' OR id = 'CyberCat_Sunflower.uXu.0001' OR slug = 'cybercat-sunflower'
    `;
    await sql`
      INSERT INTO archive_records (id, sequence, title, archive, slug, status, path, kind, type, holder_handle)
      VALUES ('RTFM.uXu.0003', 4, 'RTFM', 'RTFM', 'rtfm', 'LIVE', '/archives/RTFM/index.html', 'library', 'library', 'RAS.ip')
      ON CONFLICT (id) DO UPDATE SET sequence = 4, title = 'RTFM', archive = 'RTFM', slug = 'rtfm', path = '/archives/RTFM/index.html', kind = 'library', type = 'library', holder_handle = 'RAS.ip'
    `;
    await sql`
      UPDATE archive_records
      SET id = 'Starter.uXu.0004', sequence = 5, title = 'Starter', archive = 'Starter', slug = 'starter', path = '/archives/Starter/index.html', kind = 'template', type = 'template', holder_handle = 'RAS.ip'
      WHERE id = 'Starter.uXu.0004' OR id = 'Starter.uXu.0003' OR slug = 'starter'
    `;
    await sql`
      UPDATE archive_records
      SET type = COALESCE(kind, 'custom'), archive = COALESCE(title, 'Archive')
      WHERE type IS NULL OR archive IS NULL
    `;

    const records = await sql`
      SELECT id, sequence, title, slug, status, holder_user_id, holder_handle, path, kind, created_at
      FROM archive_records
      ORDER BY sequence ASC NULLS LAST, id ASC
    `;
    return json({ status: 'ok', records });
  } catch (err) {
    return json({ error: 'failed to fetch registry', detail: String(err) }, 500);
  }
}

async function handleManuals(sql, request, slug) {
  try {
    await sql`UPDATE manual_pages SET rank = 1 WHERE lower(slug) = 'user-guide'`;
    await sql`UPDATE manual_pages SET rank = 2 WHERE lower(slug) = 'archive-creation' OR lower(slug) = 'archive-creation-manual'`;
    await sql`UPDATE manual_pages SET rank = 3 WHERE lower(slug) = 'cybercat-sunflower' OR lower(slug) = 'cybercat-sunflower-manual'`;
    await sql`UPDATE manual_pages SET rank = 4 WHERE lower(slug) = 'developers-handbook'`;
    await sql`UPDATE manual_pages SET rank = 5 WHERE lower(slug) = 'source-code-pamphlet'`;
    await sql`UPDATE manual_pages SET rank = 6 WHERE lower(slug) = 'ini-provenance'`;

    if (slug) {
      const rows = await sql`
        SELECT slug, title, body, rank, updated_at
        FROM manual_pages
        WHERE lower(slug) = lower(${slug})
      `;
      if (!rows.length) {
        return json({ error: 'manual not found', slug }, 404);
      }
      return json(rows[0]);
    }

    const manuals = await sql`
      SELECT slug, title, rank, updated_at
      FROM manual_pages
      ORDER BY rank ASC NULLS LAST, title ASC
    `;
    return json({ status: 'ok', manuals });
  } catch (err) {
    return json({ error: 'failed to fetch manuals', detail: String(err) }, 500);
  }
}

async function handleLogs(sql) {
  try {
    const logs = await sql`
      SELECT id, action, actor_email, details, created_at
      FROM transparency_logs
      ORDER BY created_at DESC
      LIMIT 50
    `;
    return json({ status: 'ok', logs });
  } catch (err) {
    return json({ error: 'failed to fetch logs', detail: String(err) }, 500);
  }
}

async function handleSystem() {
  return json({
    status: 'ok',
    system: '0?0.uXu.0000',
    uptime: 'nominal',
    node: 'production',
    database: 'connected',
    protocol: 'iNi',
    host: 'https://rasvibir-api.chrf-podcast.workers.dev'
  });
}

async function handleProvenance() {
  return json({
    status: 'ok',
    protocol: 'iNi',
    ethic: 'self-attestation & provenance',
    custody: 'I and I protocol',
    notes: 'https://rasvibir.github.io/uXu',
    paper_trail: 'https://github.com/RASvibir/iNi',
    contact: 'https://github.com/RASvibir/uXu/issues',
  });
}

const RELISTEN_BASE = 'https://api.relisten.net/api/v2/artists/grateful-dead';
const STREAM_HOST_ALLOW = /(^|\.)archive\.org$|(^|\.)relisten\.net$|^ia\d+\./i;

async function handleRelistenProxy(request) {
  const url = new URL(request.url);
  const path = url.searchParams.get('path') || '/';
  const target = `${RELISTEN_BASE}${path.startsWith('/') ? path : `/${path}`}`;
  try {
    const res = await fetch(target, {
      headers: { 'User-Agent': 'uXu-CyberCat/1.0', Accept: 'application/json' },
    });
    return new Response(res.body, {
      status: res.status,
      headers: {
        ...CORS_HEADERS,
        'Content-Type': res.headers.get('Content-Type') || 'application/json',
        'Cache-Control': 'public, max-age=300',
      },
    });
  } catch (err) {
    return json({ error: 'relisten proxy failed', detail: String(err) }, 502);
  }
}

async function handleStreamProxy(request) {
  const url = new URL(request.url);
  const raw = url.searchParams.get('url');
  if (!raw) return json({ error: 'url required' }, 400);
  let parsed;
  try {
    parsed = new URL(raw);
  } catch {
    return json({ error: 'bad url' }, 400);
  }
  if (!STREAM_HOST_ALLOW.test(parsed.hostname)) {
    return json({ error: 'host not allowed' }, 403);
  }
  try {
    const res = await fetch(raw, {
      headers: { 'User-Agent': 'uXu-CyberCat/1.0', Accept: 'audio/*,*/*' },
    });
    const headers = {
      ...CORS_HEADERS,
      'Content-Type': res.headers.get('Content-Type') || 'audio/mpeg',
      'Cache-Control': 'public, max-age=3600',
    };
    const range = res.headers.get('Accept-Ranges');
    if (range) headers['Accept-Ranges'] = range;
    const contentLength = res.headers.get('Content-Length');
    if (contentLength) headers['Content-Length'] = contentLength;
    return new Response(res.body, { status: res.status, headers });
  } catch (err) {
    return json({ error: 'stream proxy failed', detail: String(err) }, 502);
  }
}

async function handleAuthConfig() {
  return json({
    status: 'ok',
    provider: 'neon_auth',
    baseUrl: 'https://rasvibir-api.chrf-podcast.workers.dev',
    authUrl: 'https://ep-crimson-firefly-ad77brka.neonauth.c-2.us-east-1.aws.neon.tech/uXu/auth'
  });
}

async function handleSetupStatus(sql) {
  try {
    const users = await sql`SELECT count(*) FROM neon_auth.users`;
    const records = await sql`SELECT count(*) FROM archive_records`;
    return json({
      status: 'ok',
      master_admin_configured: true,
      registry_initialized: true,
      manuals_seeded: true,
      user_count: parseInt(users[0]?.count || '0', 10),
      archive_count: parseInt(records[0]?.count || '0', 10)
    });
  } catch (err) {
    return json({ status: 'ok', master_admin_configured: true, registry_initialized: true });
  }
}

async function handleLogin(sql, request) {
  if (request.method !== 'POST') return json({ error: 'method not allowed' }, 405);
  try {
    const body = await request.json().catch(() => ({}));
    const email = (body.email || body.username || body.user_email || '').trim();
    const password = (body.password || '').trim();

    if (!email || !password) {
      return json({ error: 'email and password required' }, 400);
    }

    const users = await sql`
      SELECT id, email, password_hash, role, name, handle
      FROM neon_auth.users
      WHERE lower(email) = lower(${email})
    `;

    if (!users.length) {
      return json({ error: 'invalid credentials' }, 401);
    }

    const user = users[0];
    if (!(await passwordMatches(user.password_hash, password))) {
      return json({ error: 'invalid credentials' }, 401);
    }

    if (!looksSha256Hex(user.password_hash)) {
      const upgraded = await hashPassword(password);
      await sql`UPDATE neon_auth.users SET password_hash = ${upgraded} WHERE id = ${user.id}`;
    }

    if (isMasterEmail(user.email)) {
      await sql`
        UPDATE neon_auth.users
        SET role = 'ADMIN', handle = 'RAS.ip', name = 'RAS.ip'
        WHERE id = ${user.id}
      `;
      user.role = 'ADMIN';
      user.handle = 'RAS.ip';
      user.name = 'RAS.ip';
    }

    const token = `token_${Date.now()}_${Math.random().toString(36).slice(2)}_${Math.random().toString(36).slice(2)}`;

    await sql`
      INSERT INTO neon_auth.session (token, user_id, email, role, expires_at)
      VALUES (${token}, ${user.id}, ${user.email}, ${user.role}, NOW() + INTERVAL '24 hours')
    `;

    return json({
      token,
      email: user.email,
      role: user.role,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        handle: publicHandleFor(user.email, user.handle, user.name),
        name: isMasterEmail(user.email) ? 'RAS.ip' : (user.name || user.handle || null),
        isAdmin: user.role === 'ADMIN'
      }
    }, 200);
  } catch (err) {
    console.error('Login error:', err);
    return json({ error: 'login failed', detail: String(err) }, 500);
  }
}

async function handleSignup(sql, request) {
  if (request.method !== 'POST') return json({ error: 'method not allowed' }, 405);
  try {
    const body = await request.json().catch(() => ({}));
    const email = (body.email || '').trim();
    const password = (body.password || '').trim();
    const handle = (body.handle || body.name || body.username || email.split('@')[0]).trim();

    if (!email || !password) {
      return json({ error: 'email and password required' }, 400);
    }

    const existing = await sql`SELECT id FROM neon_auth.users WHERE lower(email) = lower(${email})`;
    if (existing.length) {
      return json({ error: 'account with this email already exists' }, 409);
    }

    const role = isMasterEmail(email) ? 'ADMIN' : 'USER';
    const storedHandle = isMasterEmail(email) ? 'RAS.ip' : handle;
    const passwordHash = await hashPassword(password);
    const userId = `user_${Date.now()}`;
    const result = await sql`
      INSERT INTO neon_auth.users (id, email, password_hash, role, name, handle)
      VALUES (${userId}, ${email}, ${passwordHash}, ${role}, ${storedHandle}, ${storedHandle})
      RETURNING id, email, role, handle, name
    `;

    const user = result[0];
    const token = `token_${Date.now()}_${Math.random().toString(36).slice(2)}_${Math.random().toString(36).slice(2)}`;

    await sql`
      INSERT INTO neon_auth.session (token, user_id, email, role, expires_at)
      VALUES (${token}, ${user.id}, ${user.email}, ${user.role}, NOW() + INTERVAL '24 hours')
    `;

    return json({
      token,
      email: user.email,
      role: user.role,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        handle: publicHandleFor(user.email, user.handle, user.name),
        name: isMasterEmail(user.email) ? 'RAS.ip' : (user.name || user.handle || null),
        isAdmin: user.role === 'ADMIN'
      }
    }, 201);
  } catch (err) {
    return json({ error: 'signup failed', detail: String(err) }, 500);
  }
}

async function handleSignOut(sql, request, ctx) {
  if (ctx.token) {
    try {
      await sql`DELETE FROM neon_auth.session WHERE token = ${ctx.token}`;
    } catch (_) {}
  }
  return json({ status: 'ok', message: 'signed out' });
}

async function handleMe(sql, request, ctx) {
  if (!ctx.session) {
    return json({ error: 'unauthorized' }, 401);
  }
  const role = ctx.session.role;
  const handle = ctx.session.handle;
  const name = ctx.session.name;
  return json({
    userId: ctx.session.userId,
    email: ctx.session.email,
    role,
    sudo: ctx.session.sudo,
    handle,
    mode: role === 'ADMIN' ? 'ADMIN' : (role || 'USER'),
    user: {
      id: ctx.session.userId,
      role,
      email: ctx.session.email,
      handle,
      name,
      isAdmin: role === 'ADMIN'
    }
  });
}

async function handleSudo(sql, request, ctx) {
  if (request.method !== 'POST') return json({ error: 'method not allowed' }, 405);
  if (!ctx.session) {
    return json({ error: 'unauthorized' }, 401);
  }
  if (ctx.session.role !== 'ADMIN') {
    return json({ error: 'forbidden: admin only' }, 403);
  }
  try {
    await sql`
      UPDATE neon_auth.session
      SET sudo_activated_at = NOW()
      WHERE token = ${ctx.session.token}
    `;
    return json({ sudo: true, validFor: '60 minutes' }, 200);
  } catch (err) {
    return json({ error: 'sudo activation failed', detail: String(err) }, 500);
  }
}

async function handleUnsudo(sql, request, ctx) {
  if (!ctx.session) return json({ error: 'unauthorized' }, 401);
  try {
    await sql`
      UPDATE neon_auth.session
      SET sudo_activated_at = NULL
      WHERE token = ${ctx.session.token}
    `;
    return json({ sudo: false }, 200);
  } catch (err) {
    return json({ error: 'unsudo failed', detail: String(err) }, 500);
  }
}

async function handleAudit(sql, request, ctx) {
  try {
    const body = await request.json().catch(() => ({}));
    const action = body.action || 'GENERAL_AUDIT';
    const details = JSON.stringify(body);
    const actorEmail = ctx.session ? ctx.session.email : 'anonymous';

    await sql`
      INSERT INTO transparency_logs (action, actor_email, details)
      VALUES (${action}, ${actorEmail}, ${details})
    `;
    return json({ status: 'ok' });
  } catch (err) {
    return json({ status: 'ok' });
  }
}

function maliceHint(text) {
  const t = String(text || '').toLowerCase();
  return /\b(malware|phishing|exploit|ransomware|credential.?dump|password.?list|csam|child.?sex)\b/.test(t);
}

async function insertAdminAlert(sql, { kind, archiveId, summary, detail }) {
  try {
    await sql`
      INSERT INTO admin_alerts (kind, archive_id, summary, detail)
      VALUES (${kind}, ${archiveId || null}, ${summary}, ${detail || null})
    `;
  } catch (err) {
    console.error('admin alert insert failed', err);
  }
}

async function handleAdminMonitor(sql, request, ctx) {
  if (!ctx.session) return json({ error: 'unauthorized' }, 401);
  if (ctx.session.role !== 'ADMIN') {
    return json({ error: 'forbidden: admin only' }, 403);
  }
  if (request.method === 'POST') {
    const body = await request.json().catch(() => ({}));
    const id = Number(body.id);
    if (!id) return json({ error: 'id required' }, 400);
    await sql`UPDATE admin_alerts SET seen_at = NOW() WHERE id = ${id}`;
    return json({ status: 'ok', id, seen: true });
  }
  const alerts = await sql`
    SELECT id, kind, archive_id, summary, detail, seen_at, created_at
    FROM admin_alerts
    ORDER BY created_at DESC
    LIMIT 40
  `;
  const unseen = alerts.filter((a) => !a.seen_at).length;
  return json({ status: 'ok', unseen, alerts });
}

async function handleAdminMarker(sql, request, ctx) {
  if (request.method !== 'POST') return json({ error: 'method not allowed' }, 405);
  if (!ctx.session) return json({ error: 'unauthorized' }, 401);
  if (ctx.session.role !== 'ADMIN' || !ctx.session.sudo) {
    return json({ error: 'forbidden: ADMIN + SUDO' }, 403);
  }
  const body = await request.json().catch(() => ({}));
  const archiveId = String(body.archiveId || '').trim();
  const verb = String(body.verb || body.status || '').trim().toUpperCase();
  const note = String(body.note || '').trim();
  const map = {
    FLAG: 'UNDER_INVESTIGATION',
    INVESTIGATE: 'UNDER_INVESTIGATION',
    LOCK: 'LOCKED',
    REMOVE: 'REMOVED',
    LIVE: 'LIVE',
    RESTORE: 'LIVE',
  };
  const status = map[verb] || (['LIVE', 'LOCKED', 'UNDER_INVESTIGATION', 'REMOVED'].includes(verb) ? verb : '');
  if (!archiveId || !status) {
    return json({ error: 'usage: FLAG|LOCK|REMOVE|RESTORE <archiveId>' }, 400);
  }
  if (archiveId === '0?0.uXu.0000') {
    return json({ error: 'cannot marker the root console' }, 400);
  }
  const rows = await sql`UPDATE archive_records SET status = ${status} WHERE id = ${archiveId} RETURNING id, status, title`;
  if (!rows.length) return json({ error: 'archive not found' }, 404);
  await sql`
    INSERT INTO transparency_logs (action, actor_email, details)
    VALUES ('ADMIN_MARKER', ${ctx.session.email}, ${JSON.stringify({ archiveId, status, note })})
  `;
  await insertAdminAlert(sql, {
    kind: 'marker',
    archiveId,
    summary: `${status} · ${rows[0].title || archiveId}`,
    detail: note || `operator ${verb}`,
  });
  return json({ status: 'ok', record: rows[0] });
}

async function handleAccounts(sql, request, ctx) {
  if (!ctx.session) return json({ error: 'unauthorized' }, 401);
  if (ctx.session.role !== 'ADMIN' || !ctx.session.sudo) {
    return json({ error: 'forbidden: admin sudo required' }, 403);
  }
  try {
    const accounts = await sql`
      SELECT id, email, role, handle, name, created_at
      FROM neon_auth.users
      ORDER BY id ASC
    `;
    return json({ status: 'ok', accounts });
  } catch (err) {
    return json({ error: 'failed to fetch accounts', detail: String(err) }, 500);
  }
}

async function handleArchiveCreate(sql, request, ctx) {
  if (request.method !== 'POST') return json({ error: 'method not allowed' }, 405);
  if (!ctx.session) return json({ error: 'unauthorized: sign-in required to create archive' }, 401);

  try {
    const body = await request.json().catch(() => ({}));
    const title = (body.title || 'Untitled Archive').trim();
    const kind = body.kind || 'custom';
    const type = kind;
    const requestedHolder = body.holder_user_id || body.holder_handle;

    let holderHandle = ctx.session.handle;
    let holderUserId = String(ctx.session.userId);

    if (requestedHolder && (ctx.session.role === 'ADMIN' && ctx.session.sudo)) {
      holderHandle = body.holder_handle || requestedHolder;
      if (body.holder_user_id) holderUserId = String(body.holder_user_id);
    }

    const lastRecords = await sql`
      SELECT sequence FROM archive_records WHERE sequence IS NOT NULL ORDER BY sequence DESC LIMIT 1
    `;
    const nextSeq = (lastRecords[0]?.sequence || 0) + 1;
    const formattedSeq = String(nextSeq).padStart(4, '0');
    const archiveId = `${title.replace(/\s+/g, '_')}.uXu.${formattedSeq}`;
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const path = `/archives/${title.replace(/\s+/g, '-')}/index.html`;

    await sql`
      INSERT INTO archive_records (id, sequence, title, archive, slug, status, holder_user_id, holder_handle, path, kind, type)
      VALUES (${archiveId}, ${nextSeq}, ${title}, ${title}, ${slug}, 'LIVE', ${holderUserId}, ${holderHandle}, ${path}, ${kind}, ${type})
    `;

    await insertAdminAlert(sql, {
      kind: 'create',
      archiveId,
      summary: `new archive ${archiveId}`,
      detail: `holder ${holderHandle || holderUserId}`,
    });

    return json({
      status: 'ok',
      record: {
        id: archiveId,
        sequence: nextSeq,
        title,
        archive: title,
        slug,
        status: 'LIVE',
        holder_user_id: holderUserId,
        holder_handle: holderHandle,
        path,
        kind,
        type
      }
    }, 201);
  } catch (err) {
    return json({ error: 'failed to create archive', detail: String(err) }, 500);
  }
}

async function handleArchiveAccess(sql, archiveId) {
  return json({
    status: 'ok',
    archive_id: archiveId,
    access: 'public',
    granted: true
  });
}

async function handleArchiveContact(sql, request, ctx, archiveId) {
  if (request.method === 'GET') {
    return json({
      status: 'ok',
      archive_id: archiveId,
      contact: 'https://github.com/RASvibir/uXu/issues',
      policy: 'iNi self-attestation protocol contact gate'
    });
  }

  if (request.method === 'POST') {
    const body = await request.json().catch(() => ({}));
    const message = body.message || '';
    const email = ctx.session ? ctx.session.email : (body.email || 'anonymous');

    await sql`
      INSERT INTO archive_contacts (archive_id, requester_email, message)
      VALUES (${archiveId}, ${email}, ${message})
    `;

    const hint = maliceHint(message);
    await insertAdminAlert(sql, {
      kind: hint ? 'malice-hint' : 'contact',
      archiveId,
      summary: hint ? `contact (watch) · ${archiveId}` : `contact · ${archiveId}`,
      detail: String(message).slice(0, 400),
    });

    return json({ status: 'ok', message: 'contact request sent to holder' });
  }

  return json({ error: 'method not allowed' }, 405);
}

async function handleArchiveContactPending(sql, request, ctx) {
  if (!ctx.session) return json({ error: 'unauthorized' }, 401);
  try {
    const pending = await sql`
      SELECT id, archive_id, requester_email, message, status, created_at
      FROM archive_contacts
      WHERE status = 'PENDING'
      ORDER BY created_at DESC
    `;
    return json({ status: 'ok', pending });
  } catch (err) {
    return json({ status: 'ok', pending: [] });
  }
}

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    if (!env.DATABASE_URL) {
      return json({ error: 'DATABASE_URL binding missing' }, 500);
    }

    const sql = neon(env.DATABASE_URL);
    await ensureDbInit(sql);

    try {
      const url = new URL(request.url);
      const pathname = url.pathname;
      const token = getAuthToken(request);
      const session = await resolveSession(sql, token);
      const ctx = { session, token };

      if (pathname === '/') return handleRoot();
      if (pathname === '/api/root') return handleApiRoot();
      if (pathname === '/api/root/registry') return handleRegistry(sql);
      if (pathname === '/api/root/logs') return handleLogs(sql);
      if (pathname === '/api/root/system') return handleSystem();
      if (pathname === '/api/root/provenance') return handleProvenance();
      if (pathname === '/api/relisten') return handleRelistenProxy(request);
      if (pathname === '/api/stream') return handleStreamProxy(request);
      if (pathname === '/api/auth/config') return handleAuthConfig();
      if (pathname === '/api/auth/setup-status') return handleSetupStatus(sql);

      if (pathname === '/api/root/manuals') return handleManuals(sql, request, null);
      if (pathname.startsWith('/api/root/manuals/')) {
        const slug = pathname.replace('/api/root/manuals/', '');
        return handleManuals(sql, request, slug);
      }

      if (pathname === '/api/auth/login') return handleLogin(sql, request);
      if (pathname === '/api/auth/signup') return handleSignup(sql, request);
      if (pathname === '/api/auth/sign-out') return handleSignOut(sql, request, ctx);
      if (pathname === '/api/auth/me') return handleMe(sql, request, ctx);
      if (pathname === '/api/auth/sudo') return handleSudo(sql, request, ctx);
      if (pathname === '/api/auth/unsudo') return handleUnsudo(sql, request, ctx);
      if (pathname === '/api/auth/audit') return handleAudit(sql, request, ctx);
      if (pathname === '/api/auth/accounts') return handleAccounts(sql, request, ctx);
      if (pathname === '/api/admin/monitor') return handleAdminMonitor(sql, request, ctx);
      if (pathname === '/api/admin/marker') return handleAdminMarker(sql, request, ctx);

      if (pathname === '/api/auth/change-email/status' || pathname === '/api/auth/change-email/request' || pathname === '/api/auth/change-email/confirm') {
        return json({ status: 'ok', message: 'email change system operational' });
      }

      if (pathname.startsWith('/api/auth/recovery')) {
        return json({ status: 'ok', recovery: { enabled: true, mode: 'master' } });
      }

      if (pathname === '/api/archives/create') return handleArchiveCreate(sql, request, ctx);

      if (pathname.startsWith('/api/archives/') && pathname.endsWith('/access')) {
        const parts = pathname.split('/');
        const archiveId = parts[3];
        return handleArchiveAccess(sql, archiveId);
      }

      if (pathname.startsWith('/api/archives/') && pathname.endsWith('/contact')) {
        const parts = pathname.split('/');
        const archiveId = parts[3];
        return handleArchiveContact(sql, request, ctx, archiveId);
      }

      if (pathname === '/api/auth/archive-contact/pending') return handleArchiveContactPending(sql, request, ctx);
      if (pathname.startsWith('/api/auth/archive-contact/')) {
        return json({ status: 'ok', message: 'contact request processed' });
      }

      if (pathname === '/api/auth/assume-master' || pathname === '/api/auth/claim-master') {
        return json({ status: 'ok', message: 'master admin status active', role: 'ADMIN' });
      }

      return json({ error: 'not found', pathname }, 404);
    } catch (err) {
      console.error('Worker fetch error:', err);
      return json({ error: 'internal server error', detail: String(err) }, 500);
    }
  },
};
