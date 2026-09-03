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
4. **Create your own archive** — `CREATE ARCHIVE` (or Create Archive). Name + description, save, confirm. Expand options only if you want them.
5. **Try CyberCat Sunflower** — Grateful Dead catalog (`OPEN CYBERCAT`). Files: Relisten catalog → Internet Archive transfers.
6. **CyberCat Deck Builder** — Quick Nav **CYBERCAT DECK** or `DECK` — your files/links, not Sunflower’s index. One name per device (`deck exists` if you reuse it). Name examples: antelope, ur mom, bout treefiddy.
7. **Optional: iNi Provenance** — origin/custody honesty (`INI`). Not enforcement. Notes: https://rasvibir.github.io/uXu (`INI SITE`). Paper trail: https://github.com/RASvibir/iNi.

## Finding Your Way (0?0)

- On load, **↑ ↓** drive **Quick Nav** (starts on ARCHIVE INDEX)
- **Tab / Shift+Tab** move between zones: Quick Nav → registry → command → account
- **← →** stay local: **→** opens USER OPTIONS from any Quick Nav item; **←** closes it; on registry, toggle table ↔ actions toolbar
- **Click** a panel to adopt it as the keyboard highlight (mouse and keys share one focus)
- **r** registry · **q** Quick Nav · **a** account · **/** jump to the command line · **?** keyboard map
- **⌘C** / **Ctrl+C** and right-click **Copy** work on a highlight; letter **c** still opens command when nothing is selected
- **F1** Help · **F2** Index · **F3** Manuals · **F4** Map · **F5** Logs · **F6** System
- Long docs (ABOUT / RTFM / FAQ / iNi) open scrolled to the **top**

Quick Nav (always visible): **ABOUT · CREATE · CYBERCAT DECK · FAQ · ARCHIVE INDEX · USER OPTIONS · iNi Provenance · RTFM**  
USER OPTIONS folds Manual Library, Install, Map, Logs, System, Setup Master, Exit.

On 0?0, **F4** opens **MAP** (commons tree). On CyberCat Sunflower, **F5** is Ripple provenance (herd/catalog trail), not MAP.

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
DECK
CREATE ARCHIVE
MAP
```

If you get lost, remember: searching for **0** or **?** always points back toward the center.

## Manuals At A Glance

| Guide | Who it is for |
|-------|----------------|
| **ABOUT / RTFM** | **ABOUT** = what uXu is (site · repo · app); RTFM = using the 0?0 archive interface |
| **iNi Provenance** | Opt-in authenticity protocol · notes https://rasvibir.github.io/uXu · paper trail https://github.com/RASvibir/iNi |
| User Guide (this page) | Everyday visitors — also in MANUAL LIBRARY |
| Archive Creation Manual | Anyone ready to add an archive |
| CyberCat Sunflower Manual | Listening / using that deck (F4 on the deck) |
| CyberCat Deck Builder | F4 on that room · `DECK` from 0?0 · unique names |
| Master Admin Guide | Operator succession + MONITOR / markers (not visitor required) |
| Developers Handbook | Builders and coders |
| Source Code Pamphlet | Curious readers who want a map of the repo |

On 0?0: **RTFM** opens the interactive 0?0 manual. **MANUAL LIBRARY** opens
the pamphlet index. **INDEX ARCHIVE MANUALS** finds creator manuals declared in
`data.json` → `uxu.manuals`.

The registry lists **ID** (`uXu.NNNN`) and **NAME**. Hover a moment on a name
or id for a small tooltip. Tap **i** if you want the fuller pathway card while
using the keyboard. **Esc** dismisses it.
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
Signing up is optional. **Sign In / Sign Up** (form or `SIGNIN` / `SIGNUP`) talk to the uXu API worker — not a separate Neon Auth form. The public name is your **handle**; login email stays private (you and the admin). The operator account shows as **RAS.ip** with role **ADMIN**.
Day-to-day visitors do not need admin powers.

**Privacy:** your login email stays private (you and the admin). It is not shown on archives.

- Change login email: `CHANGE EMAIL new@… yourpassword`, then `CHANGE EMAIL CONFIRM <otp>` (code goes to your **current** inbox).
- Archive steward contact (optional): `ARCHIVE CONTACT <archiveId> you@…` — private by default. Add `public` only if you want it shown; that needs admin approval.

## License & rights (plain language)

- **Code and original docs** in the uXu repo are **MIT** (Copyright 2026 The uXu Project). See the repo `LICENSE`.
- **Audio, images, and other media** linked by archives are **not** owned by uXu. Follow each source’s license, permission, or taping policy.
- **Registering an archive** does not transfer ownership of your collection.
- Optional **iNi** fields are honesty / provenance notes — not a legal title certificate.

## Reach An Admin

Need help, want an archive registered, found a problem, or have a question?

Open a GitHub issue:

https://github.com/RASvibir/uXu/issues

Please include:

- what you were trying to do
- which page or archive (for example 0?0 or CyberCat Sunflower)
- a short description of what happened

You will get a human reply. There is no automated ticket maze.

## Safety & Respect

- Only share material you have the right to share.
- Be kind in notes, titles, and contributions.
- Archives stay independent — different looks and rules are normal.
- The commons operator does **not** rewrite other people’s archive folders as curation. If something dangerous is reported, **MONITOR** alerts; **FLAG / LOCK / REMOVE** are at-will registry markers (ADMIN + SUDO), not an automatic cop.

## Next Steps

- Curious listener → `OPEN CYBERCAT`, then read its Manual (F4 on that deck).
- Make a deck → `DECK` / CYBERCAT DECK.
- Ready to contribute → CREATE ARCHIVE or READ archive-creation.
- Want provenance practice → **iNi Provenance** / `INI` · notes `INI SITE` → https://rasvibir.github.io/uXu · paper trail https://github.com/RASvibir/iNi.
- Builder / coder → READ developers-handbook.
- Want the big picture of files → READ source-code-pamphlet.
