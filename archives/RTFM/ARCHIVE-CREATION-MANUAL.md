# Archive Creation Manual

Tags: archive-creation, beginners, complexity-tree, templates, contributing
Source: uXu RTFM library · 0?0 CREATE ARCHIVE

## Start Here (The Simple Path)

You can make a real archive with three small pieces:

```text
archives/Your-Archive-Name/
  index.html     ← the page people open
  data.json      ← your list of items (shows, files, notes…)
  README.md      ← a short story: what this is and why
```

That is enough.

### Tiny checklist

1. Copy `/templates/` (includes home door + fork policy fields) or fork an
   existing archive that allows template forks.
2. Put your folder under `archives/`.
3. Write a clear name, a short **description**, and at least one item in `data.json`.
   That description is what visitors see in the 0?0 registry when they hover (or
   focus) the archive title. At registration, keep the Neon registry `summary`
   in sync with the same short line when possible.
4. Pick a **commons link** style: public **uXu** chip (default) or **← 0?0** back control.
5. List visitor manuals under `uxu.manuals` (starter: `manuals/USER-MANUAL.md`) so
   **0?0 → RTFM → INDEX ARCHIVE MANUALS** can find them.
6. Open `index.html` in a browser and confirm it loads.
7. Open a pull request, or email **rasip@chloreform.org** and ask to be registered.
8. Stay legal and safe (see CONTRIBUTING.md).

You do not need a custom app, a database, or special security on day one.
Do **not** attach the public uXu PWA manifest to child archives — that install is the invite app only.

## Commons link (← 0?0 vs uXu chip)

Creators decide how the link home looks:

| `homeLink.style` | Looks like | Feels like |
|------------------|------------|------------|
| `"uXu"` | **uXu** badge | Website / ad chip for outsiders |
| `"0?0"` | **← 0?0** | Back to the root console |

```json
"uxu": {
  "homeLink": { "style": "uXu", "href": "../index.html" }
}
```

Same destination either way. Optional `"label"` overrides the text.
Snippet: `templates/snippets/home-link.html`.

## Archive manuals (for INDEX ARCHIVE MANUALS)

Publish visitor docs so 0?0 can index them:

```json
"uxu": {
  "manuals": [
    {
      "title": "Visitor Guide",
      "path": "manuals/USER-MANUAL.md",
      "description": "How to use this archive"
    }
  ]
}
```

Paths are relative to your archive folder. Starter file:
`templates/manuals/USER-MANUAL.md`.

On 0?0: **RTFM** → interactive 0?0 manual → **INDEX ARCHIVE MANUALS**, or type `ARCHIVE MANUALS` /
`FIND MANUAL cybercat`.

## iNi provenance (opt-in)

Optional authenticity protocol. Leave `optIn: false` unless you fill provenance seriously.

```json
"uxu": {
  "ini": {
    "optIn": true,
    "tag": "iNi",
    "provenance": {
      "origin": "…",
      "authors": ["…"],
      "custody": "…",
      "lineage": "…",
      "conditions": "…",
      "attestedAt": "2026-08-12"
    }
  }
}
```

On 0?0: Quick Nav **iNi Provenance** or type **INI**. Full pamphlet: `INI-PROVENANCE.md`.

## Template forks (creator's choice)

You may allow others to start from your archive as a template:

```json
"uxu": {
  "allowTemplateForks": true,
  "templateForkDepth": 2
}
```

| Depth | Meaning |
|------|---------|
| 0 | No forks |
| 1 | Direct forks only |
| 2 | Forks of forks allowed up to depth 2 |
| 3+ | Deeper chains up to your number |

When forking, record lineage:

```json
"templateOf": "Source_Archive.uXu.0007",
"templateDepth": 1
```

Only publish a further-forkable template if your new depth stays within the
source archive's `templateForkDepth`. Details: `templates/README.md`.

## Complexity Tree

Grow only when you want to. Each tier builds on the one above it.

```text
Tier 0  STORY
        README + a few links or embedded media
           │
Tier 1  SIMPLE ARCHIVE  ← most people start and stay here
        index.html + data.json + README
           │
        ┌──┴──────────────────────────────┐
        ▼                                 ▼
Tier 2  RICH CATALOG                 Tier 2b  PUBLIC ACCESS
        search, filters, setlists         clear public URLs,
        alternate sources                 friendly landing copy
           │                                 │
        ┌──┴──────────────┐                  │
        ▼                 ▼                  ▼
Tier 3  INTERACTIVE APP            Tier 3b  SHARED CACHE
        custom UI, audio EQ,         shared data people can
        galleries, keyboards         request / download later
           │
           ▼
Tier 4  HARDENED / HIGH ASSURANCE
        auth gates, careful caching,
        audited sources, stronger privacy
        (talk to admin before you go deep)
```

### Tier 0 — Story
A page that explains a collection and points to files elsewhere.
Good for: “here is my shelf of links.”

### Tier 1 — Simple Archive (recommended default)
Static HTML + JSON. Fast, durable, easy to host on Pages.
Good for: curated lists, tape indexes, photo runs, zines.

### Tier 2 — Rich Catalog
Add search, sorting, notes, and ranked sources (best recording first).
Good for: CyberCat-style decks without inventing a new platform.

### Tier 2b — Public Access
Make sure strangers can open your archive from 0?0, understand the title,
and leave with one clear action (listen, read, browse).

### Tier 3 — Interactive App
Custom controls, EQ, lightboxes, keyboard maps, offline-friendly UI.
Still usually static front-end + public media URLs.

### Tier 3b — Shared Cache
Compressed / shared activity archives tied to accounts (commons feature).
Coordinate with admin before promising downloads.

### Tier 4 — Hardened
Accounts, restricted surfaces, careful caching, threat modeling.
Only when you truly need it — email rasip@chloreform.org first.

## Pick Your Lane

| I want… | Start at | Then read |
|---------|----------|-----------|
| Something online this week | Tier 1 | this manual |
| A listening deck | Tier 2 | CyberCat Manual + RTFM audio notes |
| A full custom app feel | Tier 3 | Developers Handbook |
| Locked / private / high trust | Tier 4 | admin email + Source Code Pamphlet |

## Naming & Belonging

Archive ids in the commons look like:

```text
Title.uXu.NNNN
```

Examples already in the registry:

```text
0?0.uXu.0000
CyberCat_Sunflower.uXu.0001
```

**New archives receive whatever number is next.**  
If `0001` is taken, yours becomes `0002`, then `0003`, and so on.
The number is a historical registration serial — not rank, ownership, or quality.

On 0?0, **CREATE ARCHIVE** shows the next free serial before the guide body.

Use a clear human **name** (shown in the NAME column) plus the full **archive id**.
In the registry table, hover (or focus) the name to see the full title and a brief
explanation (your `data.json` description, else registry summary, else a short
line from public metadata).

### Forever placemarkers

Once an archive id is issued, the registry row stays forever — even after teardown.
Public open may stop; the id and a marker remain so history stays pure.

| Marker | Meaning |
|--------|---------|
| (live archive) | Open to the commons |
| (audience only) | Public can view/listen; contributions frozen |
| (locked archive) | Public access disconnected (killswitch) |
| (deleted by user) | Owner removed public archive; placemarker kept |
| (removed by admin) | Admin removed public archive; placemarker kept |
| (under investigation) | Flagged / review in progress |
| (planned archive) | Reserved / not live yet |

Relationships between archives can be declared with `*:*` (a link, not control).

## Legal Quick Rules

- Share only what you may share (permission, license, or clear taping policy).
- Prefer public libraries like Internet Archive when they already host the file.
- uXu repo code/docs are **MIT**; media you link stays under **its** terms — registration does not transfer ownership.
- Optional `uxu.ini` / iNi provenance documents origin honestly; it is not a title deed.
- If unsure, ask the admin before publishing.

## After You Build

1. Test locally.
2. PR to the uXu repo, or email rasip@chloreform.org.
3. Ask for registry listing so 0?0 can OPEN your archive.
4. Optional: add a short note to RTFM if you invented something reusable.

## Need Help?

Admin: **rasip@chloreform.org**

Everyday 0?0 use: READ user-guide  
Code patterns: READ developers-handbook  
Repo map: READ source-code-pamphlet
