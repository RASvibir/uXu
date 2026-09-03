# uXu

**Shared archive commons.** Independent archives keep their own voice, stack, and curation. uXu registers, connects, and helps people find them.

uXu is **set up independently**. It is open source (MIT). It is not a product of any studio, and it does not speak for archives that register here.

**Live:** [https://rasvibir.github.io/uXu/](https://rasvibir.github.io/uXu/)  
**Repo:** [https://github.com/RASvibir/uXu](https://github.com/RASvibir/uXu)  
**Invite app:** Install **uXu** from the live page (PWA wordmark icon). The public invite does **not** brand itself as `0?0`.

Questions: [GitHub Issues](https://github.com/RASvibir/uXu/issues)

## What you will find

| Surface | Role |
|---------|------|
| **uXu** (landing / PWA) | Public door into the commons |
| **0?0** (`0?0.uXu.0000`) | Root console — registry, manuals, map, logs |
| **iNi** | Independent opt-in provenance practice (self-attestation). Public notes: [rasvibir.github.io/uXu](https://rasvibir.github.io/uXu) · paper trail: [RASvibir/iNi](https://github.com/RASvibir/iNi) · via **iNi Provenance** / `INI` / `INI SITE` |
| **CyberCat Sunflower** | Grateful Dead catalog deck (`OPEN CYBERCAT`) — Relisten → Internet Archive transfers |
| **CyberCat Deck Builder** | Make a CyberCat deck (`DECK` / Quick Nav **CYBERCAT DECK**) — files you add, not Sunflower’s catalog |
| **Ledger** | Private steward room (`Ledger.uXu.0001`, `OPEN LEDGER`) |
| **RTFM** | Canonical friendly manuals (`archives/RTFM/` + 0?0 **RTFM**) |
| **templates/** | Optional starters (commons link + template-fork + iNi fields) |

## Canonical hierarchy

```text
uXu
└── 0?0.uXu.0000
    ├── Registry (forever placemarkers)
    ├── RTFM / MANUAL library / iNi
    ├── Transparency
    └── Relationships (*:*)
```

## Archive identity

```text
Title.uXu.NNNN
```

- `NNNN` is a registration serial (`0000` root). New rooms should receive the **next unused** number; the serial is unique per id.
- Numbers are historical — not rank or ownership.
- **Ids are forever.** Delete/lock/investigate change the **marker**, not the row. Examples: `(deleted by user)`, `(removed by admin)`, `(locked archive)`, `(under investigation)`, `(live archive)`, `(audience only)`.
- **iNi / MAP are honesty, not enforcement.** Each MAP child has one `files:` line (where that room’s catalog/streams come from). Inspect shows the catalog URL.
- **Operator tools are separate.** Admin **MONITOR** alerts (creates, contacts). **FLAG / LOCK / REMOVE / RESTORE** (ADMIN + SUDO) apply at the operator’s will to a selected row — not automatic, not a rewrite of someone else’s archive files. Other people’s rooms are not edited as curation; restrictions use registry markers.

## Commons link on archives

Creators choose how the link home looks (same destination):

| Style | Appearance | Feel |
|-------|------------|------|
| `uXu` | **uXu** chip | Public / site-ad style |
| `0?0` | **← 0?0** | Console back-link |

See `templates/` and the Archive Creation Manual.

## Accounts & copying on 0?0

You can browse as a guest. **Sign In** / **Sign Up** (form or `SIGNIN` / `SIGNUP`) talk to the uXu API. The public name is your **handle**; login email stays private (you and the operator). The operator account displays as **RAS.ip** with role **ADMIN**.

On 0?0, **highlight text then copy** with **⌘C** / **Ctrl+C** or right-click **Copy**. Letter shortcuts (`c` command, `a` account, …) do not run while a chord or a live highlight is active.

## Relationships

`*:*` declares a connection between archives. It is not ownership, endorsement, or control.

```text
Archive_A.uXu*:*Archive_B.uXu
```

## CyberCat deck template

Independent CyberCat decks (like `CyberCat-Sunflower`) are spawned from the
generic template (`archives/CyberCat-Generic/index.html`) via
`./save-sed-to-rave`. Each spawn is fully self-contained — one `index.html`,
isolated `uxu_deck_<ID>_*` storage, optional lazy manifest with graceful
inline fallback — plus a conformant `data.json`, `data.schema.json`, and
`song-index.json`. Runtime details: `docs/runtime/cybercat-deck-template.md`.

## Documentation

On the live console:

- **ABOUT** / **RTFM** — canonical 0?0 how-to (tabs: About · Ease · Nav · Commands · Depth · Code · Source)  
- **CYBERCAT DECK** / `DECK` — Deck Builder (not Sunflower)  
- **iNi Provenance** — opt-in authenticity · `INI` / `INI SITE` · paper trail [RASvibir/iNi](https://github.com/RASvibir/iNi)  
- **USER OPTIONS → PROVENANCE MAP** / `MAP` / **F4** — commons tree (not Sunflower **F5**, which is Ripple catalog trail)  
- **CREATE ARCHIVE** — next serial + creation guide  
- **MONITOR** — admin intake; **FLAG · LOCK · REMOVE · RESTORE** — admin + SUDO, at will  

In the repo: `archives/RTFM/` (User Guide, CyberCat manual, iNi pamphlet, Master Admin Guide, …).

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). Keep content legal and safe. Optional templates under `/templates/`.

**Tests:** `npm test` runs the node suite (syntax, smoke, token lint,
generator, Sunflower immutability, route typecheck). Browser checks skip if Chrome is unavailable.

**Open doctrine (uXu · iNi):** the console documents protocols; optional public pages explain practice. Neither is a membership gate. Opt-in provenance is self-attestation — honesty about origin and custody, not enrollment theater and not an enforcement engine. uXu and iNi are set up independently: uXu is the commons; iNi is optional provenance practice.

## License

**Software, templates, and original documentation** in this repository are licensed under the [MIT License](LICENSE) — Copyright (c) 2026 The uXu Project.

**Media clarification (not a second license):**

- The MIT grant covers code, templates, and original docs in this repo, including the **0?0** console and API worker source as shipped here.
- It does **not** claim ownership of third-party media, recordings, or other assets linked or embedded by independent archives.
- Those remain under their own licenses, permissions, and taping policies (e.g. Internet Archive items, Grateful Dead taping tradition).
- **uXu is a commons layer for registration and discovery** — not a rights holder for contributor content.
- Independent archives remain their creators’. Registration does not transfer ownership.
- Optional **iNi** provenance fields document origin/custody; they are self-attestation, not a legal title deed.

## Data & privacy

Account-authenticated activity may be stored for authenticity. Users may request downloads of their own shared archive data after authentication. The operator does not casually browse private files or rewrite other people’s archive folders. **MONITOR** surfaces creates and contact messages; **malice-hint** is an alert only. Restrictions or removals are **at-will markers** on the registry (`FLAG` / `LOCK` / `REMOVE` / `RESTORE`) after ADMIN + SUDO — see Master Admin Guide.

## Finding the center

Searching for `0` or `?` resolves toward the root console.  
> If you can’t decide which home is better... why not both?!
