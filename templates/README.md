# Archive templates

Optional starters for new uXu archives. Nothing here is required.

## Files

| File | Purpose |
|------|---------|
| `index.html` | Starter page with **← 0?0** / **← uXu** home door wired from `data.json` |
| `data.json` | Example metadata + `uxu` automations block |
| `data.schema.json` | Shape reference (including template-fork fields) |
| `snippets/home-link.html` | Copy-paste home-door markup |

## Automations included by default

1. **Home door** — link back to the uXu landing (0?0). Label `0?0` or `uXu`.
2. **No nested PWA** — do not attach the landing `manifest.webmanifest` to child archives. The installable app is landing-only.
3. **Template forks (opt-in)** — set in `data.json`:

```json
"uxu": {
  "allowTemplateForks": true,
  "templateForkDepth": 2
}
```

| `templateForkDepth` | Meaning |
|---------------------|---------|
| `0` | Forks disallowed (even if allow is true) |
| `1` | Direct forks only |
| `2` | Forks of forks (depth ≤ 2) |
| `3+` | Deeper chains, capped at your number |

When you fork someone else's archive as a template, set:

```json
"templateOf": "Their_Archive.uXu.0007",
"templateDepth": 1
```

Honor their `templateForkDepth`: if your new depth would exceed theirs, do not publish the fork as a further template (or ask them / admin).

## Create flow (simple)

1. Copy `templates/` → `archives/Your-Archive-Name/`.
2. Edit `data.json` (name, homeLink style, fork policy).
3. Build out `index.html` or keep the starter.
4. Register via PR or email rasip@chloreform.org — next `Title.uXu.NNNN` is assigned.

See RTFM **Archive Creation Manual** for the complexity tree and placemarker rules.
