# 🌻 CyberCat Sunflower: Grateful Dead Archive

A cyberpunk-inspired collection of landmark Grateful Dead performances—the shows that shifted musical paradigms, defined eras, and remain touchstones for the community.

## What This Archive Is

Interactive web player with:
- **Audio playback** — Soundboard and audience recordings from Internet Archive
- **5-band equalizer** — Retro-styled analog audio controls
- **Setlist browser** — Song-by-song breakdown for each show
- **Cyberpunk UI** — A deliberately retro-futuristic aesthetic (1996 vibes)
- **Historical context** — Notes on why each show matters

## The Shows

18 transformative performances spanning 1968-1995:

- **Cornell '77** (1977-05-08) — Widely considered the greatest live Dead show ever recorded
- **Europe '72** (1972-05-26, 1973-05-26) — The legendary international tour
- **Veneta '72** (1972-08-27) — Peak golden era
- **The Final Show** (1995-07-09) — Soldier Field, Chicago. The last concert. Jerry passed two months later.
- ...and 14 more pivotal moments

Each show includes setlist, venue info, attendance, and a note about its historical significance.

## How to Use

1. Open `index.html` in a browser
2. Click a show from the "TAPES_INDEX" tab on the right
3. The audio player loads and the setlist displays
4. Use the 5-band EQ to adjust bass, mids, treble
5. Switch tabs to read the archive description or system specs

## Technical Details

- **Audio source**: Internet Archive (archive.org)
- **Format**: MP3 streams from Internet Archive's Grateful Dead collection
- **Data**: `data.json` contains all show metadata, audio URLs, and setlists
- **Styling**: Pure CSS, no external dependencies (except Google Fonts)
- **JavaScript**: Vanilla JS with Web Audio API for EQ filtering

## The Data Structure

`data.json` contains:
```json
{
  "archiveName": "CyberCat Sunflower",
  "artist": "Grateful Dead",
  "curator": "Victor Birkle III",
  "description": "...",
  "shows": [
    {
      "date": "1977-05-08",
      "venue": "Barton Hall, Cornell University",
      "city": "Ithaca",
      "state": "NY",
      "country": "USA",
      "setlist": ["Song 1", "Song 2", ...],
      "notes": "Why this show matters...",
      "audioSources": [
        {
          "url": "https://archive.org/download/...",
          "sourceType": "sbd",
          "label": "Soundboard"
        }
      ]
    }
  ]
}
```

## Why This Archive Exists

The Grateful Dead has an explicit **taping policy**—Jerry Garcia explicitly allowed fans to record shows. This created a massive community of tapers who documented the band's entire history. Internet Archive hosts thousands of these recordings.

This archive is my curatorial selection: 18 shows I believe are essential listening, with context on why each matters. You can listen, or you can build your own archive with different shows. Both are valid.

## Contributing

Want to add more shows? Fork the repo, add shows to `data.json`, and submit a PR. No approval needed beyond checking legality and safety.

## License

MIT — Do whatever you want with this code.

---

**One contributor's vision. One archive among many. 🌻**
