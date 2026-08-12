# Archive templates

Optional starters for new uXu archives. Nothing here is required.

## Files

| File | Purpose |
|------|---------|
| `index.html` | Starter page with configurable commons link |
| `data.json` | Example metadata + `uxu` automations block |
| `data.schema.json` | Shape reference (including template-fork fields) |
| `manuals/USER-MANUAL.md` | Starter visitor manual (declare in `uxu.manuals`) |
| `snippets/home-link.html` | Copy-paste home-link markup |

## Commons link (creator chooses)

Point people to the public commons without forcing 0?0 branding.

| `uxu.homeLink.style` | Looks like | Good for |
|----------------------|------------|----------|
| `"uXu"` (default) | Site chip / ad-style **uXu** | Public pages, sharing, new visitors |
| `"0?0"` | **← 0?0** back control | People already navigating the console |

```json
"uxu": {
  "homeLink": { "style": "uXu", "href": "../index.html" }
}
```

Optional `"label"` overrides the visible text.

The installable **uXu** app (PWA) is the public invite surface — it does not present as 0?0.
0?0 remains the root console *inside* the commons. Child archives should not attach the landing PWA manifest.

## Template forks (opt-in)

```json
"uxu": {
  "allowTemplateForks": true,
  "templateForkDepth": 2
}
```

| `templateForkDepth` | Meaning |
|---------------------|---------|
| `0` | Forks disallowed |
| `1` | Direct forks only |
| `2` | Forks of forks (depth ≤ 2) |
| `3+` | Deeper chains, capped at your number |

When forking:

```json
"templateOf": "Their_Archive.uXu.0007",
"templateDepth": 1
```

Honor the source's depth cap.

## Archive manuals (optional but recommended)

List visitor manuals in `data.json` so **0?0 → RTFM → INDEX ARCHIVE MANUALS** can find them:

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

Starter file: `templates/manuals/USER-MANUAL.md`. Paths are relative to your archive folder.

On 0?0: open **RTFM**, then the **INDEX ARCHIVE MANUALS** button (or type `ARCHIVE MANUALS` / `FIND MANUAL <words>`).

## iNi provenance (opt-in)

iNi is an optional authenticity protocol beside uXu — not required to publish.

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

Setting `optIn: true` means you filled provenance seriously and accept iNi
expectations. Starter fields ship in `templates/data.json` with `optIn: false`.
On 0?0: **INI**. Pamphlet: `archives/RTFM/INI-PROVENANCE.md`.

## Create flow (simple)

1. Copy `templates/` → `archives/Your-Archive-Name/`.
2. Edit `data.json` (name, `homeLink.style`, fork policy, `uxu.manuals`, optional `uxu.ini`).
3. Build out `index.html` or keep the starter; edit `manuals/USER-MANUAL.md`.
4. Register via PR or email rasip@chloreform.org — next `Title.uXu.NNNN` is assigned.

See RTFM **Archive Creation Manual** for the complexity tree and placemarker rules.

## License

Templates are part of the uXu repository and ship under the same **MIT** license
(`LICENSE`). Media you attach to a new archive remains under its own terms.
