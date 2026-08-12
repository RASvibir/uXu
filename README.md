# uXu

**Shared archive commons.** Independent archives keep their own voice, stack, and curation. uXu registers, connects, and helps people find them.

**Live:** [https://rasvibir.github.io/uXu/](https://rasvibir.github.io/uXu/)  
**Repo:** [https://github.com/RASvibir/uXu](https://github.com/RASvibir/uXu)  
**Invite app:** Install **uXu** from the live page (PWA wordmark icon). The public invite does **not** brand itself as `0?0`.

Admin (humans): **rasip@chloreform.org**

## What you will find

| Surface | Role |
|---------|------|
| **uXu** (landing / PWA) | Public door into the commons |
| **0?0** (`0?0.uXu.0000`) | Root console — registry, manuals, map, logs |
| **iNi** | Opt-in provenance protocol (Quick Nav **iNi Provenance** / `INI`) |
| **CyberCat Sunflower** | First registered non-root archive (Grateful Dead deck) |
| **RTFM** | Friendly manuals & reusable notes (`archives/RTFM/`) |
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

- `NNNN` is the next free serial when an archive is created (`0000` root, `0001` first child, …).
- Numbers are historical — not rank or ownership.
- **Ids are forever.** Delete/lock/investigate change the **marker**, not the row. Examples: `(deleted by user)`, `(removed by admin)`, `(locked archive)`, `(under investigation)`, `(live archive)`, `(audience only)`.

## Commons link on archives

Creators choose how the link home looks (same destination):

| Style | Appearance | Feel |
|-------|------------|------|
| `uXu` | **uXu** chip | Public / site-ad style |
| `0?0` | **← 0?0** | Console back-link |

See `templates/` and the Archive Creation Manual.

## Relationships

`*:*` declares a connection between archives. It is not ownership, endorsement, or control.

```text
Archive_A.uXu*:*Archive_B.uXu
```

## Documentation

On the live console:

- **ABOUT** / **RTFM** — 0?0 story and operator manual  
- **iNi Provenance** — opt-in authenticity protocol  
- **USER OPTIONS** — Manual Library, Install, Map, Logs, System, …  
- **CREATE ARCHIVE** — next serial + creation guide  

In the repo: `archives/RTFM/` (User Guide, CyberCat manual, iNi pamphlet, …).

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). Keep content legal and safe. Optional templates under `/templates/`.

## License

**Software, templates, and original documentation** in this repository are licensed under the [MIT License](LICENSE) — Copyright (c) 2026 Victor Birkle.

**Media clarification (not a second license):**

- The MIT grant covers code, templates, and docs in this repo.
- It does **not** claim ownership of third-party media, recordings, or other assets linked or embedded by independent archives.
- Those remain under their own licenses, permissions, and taping policies (e.g. Internet Archive items, Grateful Dead taping tradition).
- **uXu is a commons layer for registration and discovery** — not a rights holder for contributor content.
- Independent archives remain their creators’. Registration does not transfer ownership.
- Optional **iNi** provenance fields document origin/custody; they are self-attestation, not a legal title deed.

## Data & privacy

Account-authenticated activity may be stored for authenticity. Users may request downloads of their own shared archive data after authentication. Admins do not casually browse private files; illegal or malicious material may be flagged and inspected under documented oversight (see User Guide).

## Finding the center

Searching for `0` or `?` resolves toward the root console.  
> If you can’t decide which home is better... why not both?!
