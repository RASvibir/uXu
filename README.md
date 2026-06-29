# 🌻 uXu: Decentralized Music Archive Protocol

> **A cyberpunk-inspired, community-driven platform for archiving live music history — fork it, build your own archive, and add it here.**

## What is uXu?

**uXu is the platform.** It's a decentralized, GitHub-based system for archiving live music — no central server, no database, just JSON data and static pages, verified through pull requests.

**CyberCat Sunflower is the example.** It's the flagship archive living inside uXu — a Grateful Dead collection built to show exactly what's possible: full shows, real setlists, and a working in-browser audio player streaming directly from the Internet Archive.

Anyone can add their own archive — any artist, any genre, any legal live-music collection — right alongside it.

### Why uXu?

- 🌻 **Decentralized** — no central authority; every archive is community-owned
- 🎵 **Actually playable** — full shows stream and play track-to-track with a persistent player, not just links out
- ✅ **Open contribution** — anyone can add an archive; nothing is gatekept before it exists in the repo
- 📌 **Curated front page** — the maintainer can feature any archive (starting with CyberCat Sunflower) so quality work gets visibility
- 🔔 **Notified, not blind** — every addition comes in as a GitHub PR, so the maintainer always knows what's been proposed
- 🎨 **Cyberpunk vibes** — archival culture deserves aesthetics

---

## Project Structure

```
uXu/
├── README.md              ← you are here
├── index.html              ← the platform UI (archive browser + player)
├── data.schema.json         ← schema every archive's data.json must follow
└── archives/
    ├── CyberCat-Sunflower/   ← the flagship example archive (Grateful Dead)
    │   ├── data.json
    │   └── docs/
    │       ├── CONTRIBUTING.md
    │       └── CURATOR_GUIDE.md
    ├── {YourArchiveName}/    ← your archive goes here
    │   └── data.json
    └── ...
```

---

## For Listeners

Open `index.html` (or the live GitHub Pages link) to:

- **Browse archives** — featured archives up top, everything else below
- **Search shows** — by date, venue, city, or song
- **Stream full shows** — soundboard-quality audio where available, playable straight from the browser with a persistent player bar (play, pause, skip, seek)

## For Contributors

Want to add your own archive, or shows to an existing one? See [`archives/CyberCat-Sunflower/docs/CONTRIBUTING.md`](archives/CyberCat-Sunflower/docs/CONTRIBUTING.md) for the full guide. Short version:

1. Fork the repo
2. Add `archives/{YourArchiveName}/data.json` (validates against `data.schema.json`)
3. Register it in `ARCHIVE_REGISTRY` inside `index.html`
4. Open a PR

You don't need permission to start — any legal archive is welcome. The maintainer gets notified of every PR automatically through GitHub, and may choose to feature standout archives on the front page.

---

## Data Schema

Every archive's `data.json` must validate against [`data.schema.json`](data.schema.json). Key fields:

| Field | Required | Notes |
|---|---|---|
| `archiveName`, `artist`, `curator`, `description` | ✓ | Basic identity of the archive |
| `shows` | ✓ | Array of show objects |
| `featured` | – | Set by the uXu maintainer to promote an archive to the front page |
| `accentGlyph` | – | Optional small personal signature glyph next to your curator credit |

Each show supports `audioSources` — one or more Internet Archive recordings, ranked best-first (soundboard > matrix > audience), which the player resolves live and queues up for full-show playback. See `data.schema.json` for the complete spec.

---

## Audio & Legality

All audio streams directly from the [Internet Archive](https://archive.org), which hosts these recordings under terms the rights holders or taper communities have agreed to (the Grateful Dead, for instance, explicitly encourage taping and free circulation of live recordings). uXu never re-hosts audio — it only links to and streams from sources that are already legally public. Contributors are responsible for only adding `archiveOrgId`s that are legitimately public on Internet Archive.

---

## License

Code in this repository is open source. Archive data is maintained by individual curators; check each archive's own documentation for specifics.

---

*🌻 Eternally archived. Community-owned. Forever accessible. 🌻*
