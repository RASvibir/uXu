# User Guide

Tags: user-guide, beginners, 0q0, visitors, non-tech, landing, license
Source: 0?0 root archive · uXu commons

## Welcome

You are in **0?0** — the front door of uXu.

uXu is a shared place where independent archives live side by side.
Nobody takes your archive away from you. The root helps people find,
open, and understand what is here.

This guide is for everyone. No coding required.

**Live:** https://rasvibir.github.io/uXu/  
**Repo:** https://github.com/RASvibir/uXu

## What You Can Do Here

1. **Browse the registry** — the table lists archives that belong to this commons.
2. **Open an archive** — select a row and press Enter, or click Open Archive.
3. **Read manuals** — **RTFM** for the 0?0 manual; **MANUAL LIBRARY** (under USER OPTIONS) for pamphlets.
4. **Try CyberCat Sunflower** — a Grateful Dead listening deck. Type `OPEN CYBERCAT`.
5. **Create your own archive** — use CREATE ARCHIVE when you are ready. Start simple; grow later.
6. **Optional: iNi Provenance** — document origin, authorship, and custody if you want that authenticity layer. Optional notes page: https://soloist.ai/uxu (`INI SITE` on the INI panel).

## Finding Your Way (0?0)

- On load, **↑ ↓** drive **Quick Nav** (starts on ARCHIVE INDEX)
- **Tab / Shift+Tab** move between zones: Quick Nav → registry → command → account
- **← →** stay local: open/close USER OPTIONS; on registry, toggle table ↔ actions toolbar
- **Click** a panel to adopt it as the keyboard highlight (mouse and keys share one focus)
- **r** registry · **q** Quick Nav · **a** account · **/** jump to the command line · **?** keyboard map
- **F1** Help · **F2** Index · **F3** Manuals · **F4** Map · **F5** Logs · **F6** System
- Long docs (ABOUT / RTFM / FAQ / iNi) open scrolled to the **top**

Quick Nav (always visible): **ABOUT · CREATE · FAQ · ARCHIVE INDEX · USER OPTIONS · iNi Provenance · RTFM**  
USER OPTIONS folds Manual Library, Install, Map, Logs, System, Setup Master, Exit.

Useful commands:

```text
HELP
INDEX
ABOUT
FAQ
INI
INI SITE
RTFM
MANUAL
ARCHIVE MANUALS
OPEN CYBERCAT
CREATE ARCHIVE
```

If you get lost, remember: searching for **0** or **?** always points back toward the center.

## Manuals At A Glance

| Guide | Who it is for |
|-------|----------------|
| **ABOUT / RTFM** | **ABOUT** = what uXu is (site · repo · app); RTFM = using the 0?0 archive interface |
| **iNi Provenance** | Opt-in authenticity protocol · optional notes https://soloist.ai/uxu |
| User Guide (this page) | Everyday visitors — also in MANUAL LIBRARY |
| Archive Creation Manual | Anyone ready to add an archive |
| CyberCat Sunflower Manual | Listening / using that deck |
| Developers Handbook | Builders and coders |
| Source Code Pamphlet | Curious readers who want a map of the repo |

On 0?0: **RTFM** opens the interactive 0?0 manual. **MANUAL LIBRARY** opens
the pamphlet index. **INDEX ARCHIVE MANUALS** finds creator manuals declared in
`data.json` → `uxu.manuals`.

The registry lists **ID** (`uXu.NNNN`) and **NAME**. Tap **i** for keyboard
detail modals; hover still works for pathway / full name.
Ids are forever. If access ends you still see a placemarker such as
**(deleted by user)**, **(removed by admin)**, **(locked archive)**, or
**(under investigation)** — so the count of created archives stays honest.

## Install uXu (public invite app)

Share **uXu** — not 0?0 — when inviting people from outside.

On the root console: open **USER OPTIONS → INSTALL uXu** (or type `INSTALL`).
Or use the browser’s Add to Home Screen / Install App.

- Icon: **uXu** wordmark  
- Link: https://rasvibir.github.io/uXu/  
- This app is the public door into the commons. It does not brand itself as 0?0.

Inside the commons, **0?0** is still the root console. Archives pick how they link home.

## Commons link on your archive

Creation users choose the look:

| Style | Appearance | When to use |
|-------|------------|-------------|
| `uXu` | Site chip **uXu** (ad / website style) | Public visitors, sharing |
| `0?0` | **← 0?0** | People already in the console |

```json
"uxu": { "homeLink": { "style": "uXu", "href": "../index.html" } }
```

Use `"style": "0?0"` for the console back-link. Snippet: `templates/snippets/home-link.html`.

## Accounts (Simple View)

You can browse as a guest.
Signing up is optional and lets you keep an account with the commons.
Day-to-day visitors do not need admin powers.

## License & rights (plain language)

- **Code and original docs** in the uXu repo are **MIT** (Copyright 2026 Victor Birkle). See the repo `LICENSE`.
- **Audio, images, and other media** linked by archives are **not** owned by uXu. Follow each source’s license, permission, or taping policy.
- **Registering an archive** does not transfer ownership of your collection.
- Optional **iNi** fields are honesty / provenance notes — not a legal title certificate.

## Reach An Admin

Need help, want an archive registered, found a problem, or have a question?

Email the uXu admin:

**rasip@chloreform.org**

Please include:

- what you were trying to do
- which page or archive (for example 0?0 or CyberCat Sunflower)
- a short description of what happened

You will get a human reply. There is no automated ticket maze.

## Safety & Respect

- Only share material you have the right to share.
- Be kind in notes, titles, and contributions.
- Archives stay independent — different looks and rules are normal.

## Next Steps

- Curious listener → `OPEN CYBERCAT`, then read its Manual (F4 on that deck).
- Ready to contribute → CREATE ARCHIVE or READ archive-creation.
- Want provenance practice → **iNi Provenance** / `INI` · optional notes `INI SITE` → https://soloist.ai/uxu.
- Builder / coder → READ developers-handbook.
- Want the big picture of files → READ source-code-pamphlet.
