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

1. Copy the idea from `/templates/` or from CyberCat Sunflower (optional).
2. Put your folder under `archives/`.
3. Write a clear name, a short description, and at least one item in `data.json`.
4. Open `index.html` in a browser and confirm it loads.
5. Open a pull request, or email **rasip@chloreform.org** and ask to be registered.
6. Stay legal and safe (see CONTRIBUTING.md).

You do not need a custom app, a database, or special security on day one.

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
In the registry table, hover (or focus) the name to see the full title if it is truncated.

Relationships between archives can be declared with `*:*` (a link, not control).

## Legal Quick Rules

- Share only what you may share (permission, license, or clear taping policy).
- Prefer public libraries like Internet Archive when they already host the file.
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
