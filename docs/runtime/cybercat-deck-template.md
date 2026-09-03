# CyberCat deck runtime

The CyberCat deck is a self-contained archive surface: one `index.html`, no
build step, isolated browser storage. `archives/CyberCat-Generic/index.html`
is the canonical template; every other CyberCat deck is a spawned instance.

## Template tokens (the six hooks)

Spawning replaces these `{{TOKEN}}` placeholders in the config block:

| Token | Replace with | Default |
|-------|--------------|---------|
| `{{ARCHIVE_ID}}` | uppercase id, e.g. `MY_TAPE` — storage namespace + herd channel | required |
| `{{ARCHIVE_TITLE}}` | human title | required |
| `{{ARCHIVE_MODE}}` | `STANDALONE` / `HERD` / `FULL` | `STANDALONE` |
| `{{SHOW_MANIFEST_URL}}` | optional manifest URL (lazy, offline-safe fetch) | removed when absent |
| `{{RIPPLE_ENABLED}}` | `false` → comment stays OFF-default; SPAWN_SED flips to `true` | `off` |
| `{{INITIAL_TRACKS}}` | seeded setlist entries or empty baseline | none (Track 0 / 0) |

Rules the linter enforces (`tests/token-lint.js`):

- The four g-tokens are fully gone from spawned decks.
- The OFF-default ripple/setlist comments and the `{{TOKEN}}` / `{{next}}`
  documentation escapes are the only sanctioned `{{` leftovers; everything
  else in a spawned deck must be token-free.
- Deck Builder (`archives/CyberCat-Deck-Builder/`) is a spawn *host*, not a
  spawned room: unique rest-of-names on the device; bolt height is a hair
  above type; empty-deck look is Lathe (no Sunflower CRT packs).
- `SPAWN_SED` (documented sed recipe inside the template) covers all six
  hooks, and `save-sed-to-rave` must always handle the same set — see
  `tests/generator.js` for the sync invariant.

## Boot lifecycle

1. Read `ARCHIVE_CONFIG`; derive `STORAGE_KEY` (`uxu_deck_<ARCHIVE_ID>_`),
   control IDs, and the ripple herd channel (`<archiveId>:herd-sync`).
2. If a `manifestUrl` is configured, try `fetchManifest()`:
   - `{ shows: [...] }` → populate the show chip bar and load the first show.
   - `{ tracks: [...] }` → load the remote track list (label `Manifest tape`).
   - network error, non-200, or empty object → inline fallback
     (`Inline seed tape`), or markup baseline (`0 / 0`, `No Track Loaded`,
     `IDLE`) when there is no inline seed either.
3. No `manifestUrl` → seed directly from `ARCHIVE_CONFIG.setlist` (INLINE
   autoplay) or the quiet baseline.
4. Manual room renders regardless; the `MANIFEST` log line reports the final
   state (`fetching…` / `applied — remote catalog` / `empty — inline
   fallback` / `offline — inline fallback`).

## Storage & isolation

- Every archive writes only under `uxu_deck_<ARCHIVE_ID>_*`
  (`last-play`, `volume`, ripple state). Sibling decks share an origin but
  never reach into each other's namespace (verified in `tests/browser.js`).
- Audio load failures surface as a clean toast (`Stream error — skipping`),
  never an uncaught exception.

## Spawning a new deck

`./save-sed-to-rave --id MY_TAPE --title "My Tape Archive" --manifest
api/my_tape/shows.json --number 0005 --tracks "audio/one.wav:8"`

Emits `index.html`, `data.json` (uXu metadata + isolated `uxu.ini` block,
`optIn: false`), a copy of `templates/data.schema.json`, and
`song-index.json` when tracks are seeded. See the script header for the full
flag list; `--number` is the `.uXu.NNNN` serial (never reuse a serial).

After spawning: drop audio under `archives/<Deck>/audio/`, register the key
(`CyberCat_<Name>.uXu.<NNNN>` + alias) in `archives/index.html`
`LOCAL_ARCHIVE_PATHS`, and add resolvers to `app/api/archive/{index,open}`
if it should be linkable from the root catalog.

## Testing

`npm test` runs the full node suite (`tests/run.js`): syntax checks, smoke
tests for the template/manifest/spawned runtime, token lint, generator
integrity, Sunflower immutability, and route typecheck. `tests/browser.js`
runs real Chrome only when `puppeteer-core` and a browser are available;
otherwise it self-SKIPs.