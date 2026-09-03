# uXu contribution guidelines

1. **Isolation** — Each archive lives in its own folder under `/archives/`.
2. **Neutrality** — Repo root is for governance and indexing. No portfolio branding, personal tracking scripts, or unrelated marketing in root.
3. **Autonomy** — Build however you want. Templates and schemas are optional.
4. **Legal & safe** — Only share what you have the right to share. No harassment, malware, or illegal content.
5. **Forever ids** — Once registered, an archive id stays as a placemarker even if access is deleted, locked, or removed. Do not reuse serials.
6. **Commons link** — Prefer a home link to the uXu landing. Choose style `uXu` (public chip) or `0?0` (console back-link). See `templates/snippets/home-link.html`.
7. **Template forks** — Only fork archives that set `allowTemplateForks` and stay within their `templateForkDepth`.
8. **No landing PWA on child archives** — The installable **uXu** app is the public invite surface only.
9. **License** — Code and original docs are MIT ([LICENSE](LICENSE)). Media and third-party works stay under their own terms; do not imply uXu owns them. Prefer clear provenance (optional iNi fields).
10. **Deck changes run the suite** — For CyberCat deck template / `save-sed-to-rave` / catalog changes, run `npm test` (`tests/run.js`) and keep it green. Spawn new decks with `./save-sed-to-rave`; never hand-edit a spawned deck's `{{TOKEN}}` leftovers. Reference: `docs/runtime/cybercat-deck-template.md`.
11. **Sunflower immutability** — `CyberCat-Sunflower` is the reference first-registered archive; treat it as read-only in PRs.
12. **Deck Builder names** — On this device, each CyberCat rest-of-name is unique. A repeat save is `deck exists`. Do not treat Sunflower as a name example.
13. **0?0 copy** — Do not steal browser copy/cut/paste. Letter jumps wait while text is highlighted or ⌘/Ctrl is held.

`/templates/` and entries like `CyberCat-Sunflower/` are optional references.

Questions / registration: [GitHub Issues](https://github.com/RASvibir/uXu/issues)
