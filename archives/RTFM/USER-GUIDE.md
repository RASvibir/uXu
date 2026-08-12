# User Guide

Tags: user-guide, beginners, 0q0, visitors, non-tech, landing
Source: 0?0 root archive · uXu commons

## Welcome

You are in **0?0** — the front door of uXu.

uXu is a shared place where independent archives live side by side.
Nobody takes your archive away from you. The root helps people find,
open, and understand what is here.

This guide is for everyone. No coding required.

## What You Can Do Here

1. **Browse the registry** — the table lists archives that belong to this commons.
2. **Open an archive** — select a row and press Enter, or click Open Archive.
3. **Read manuals** — **RTFM** for the 0?0 manual; **MANUAL LIBRARY** for pamphlets.
4. **Try CyberCat Sunflower** — a Grateful Dead listening deck. Type OPEN CYBERCAT.
5. **Create your own archive** — use CREATE ARCHIVE (Quick Nav) when you are ready.
   Start simple; grow later.

## Finding Your Way (0?0)

- **↑ ↓** move through the registry or a manual list
- **Enter** open the selected archive or manual
- **/** jump to the command line
- **F1** Help · **F2** Index · **F3** Manuals · **F4** Map · **F5** Logs · **F6** System

Useful commands:

```text
HELP
INDEX
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
| **RTFM** (0?0 console tabs) | Navigation, commands, depth, code examples, safe source list |
| User Guide (this page) | Everyday visitors — also in MANUAL LIBRARY |
| Archive Creation Manual | Anyone ready to add an archive |
| CyberCat Sunflower Manual | Listening / using that deck |
| Developers Handbook | Builders and coders |
| Source Code Pamphlet | Curious readers who want a map of the repo |

On 0?0: **RTFM** opens the interactive 0?0 manual. **MANUAL LIBRARY** opens
the pamphlet index. While docs are open, **INDEX ARCHIVE MANUALS** finds
creator manuals declared in `data.json` → `uxu.manuals`.

The registry lists **ARCHIVE ID** (`Title.uXu.NNNN`) and **NAME**.
Hover the name for the full title when the column is clipped.

Ids are forever. If access ends you still see a placemarker such as
**(deleted by user)**, **(removed by admin)**, **(locked archive)**, or
**(under investigation)** — so the count of created archives stays honest.

## Install uXu (public invite app)

Share **uXu** — not 0?0 — when inviting people from outside.

On the root console: **Install uXu** (or type `INSTALL`).
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

- Curious listener → OPEN CYBERCAT, then read its Manual (F4 on that deck).
- Ready to contribute → CREATE ARCHIVE or READ archive-creation.
- Builder / coder → READ developers-handbook.
- Want the big picture of files → READ source-code-pamphlet.
