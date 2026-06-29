# 🌻 CyberCat Sunflower: Decentralized Music Archive Protocol

> **A cyberpunk-inspired, community-driven music archival platform where anyone can create, maintain, and share live performance history.**

## What is CyberCat Sunflower?

CyberCat Sunflower is a **decentralized archival system** for live music. Instead of relying on a single centralized authority, we believe music history belongs to the community—curated by passionate fans, verified through GitHub, and accessible to all.

This repository contains:
1. **The Grateful Dead Archive** — A complete starting archive of GD shows (1966-1995)
2. **The CyberCat Sunflower Platform** — A template system for creating your own music archives
3. **Community Submissions** — Archives created and maintained by community members

### Why CyberCat Sunflower?

- 🌻 **Decentralized** — No central authority; community-owned archives
- ✅ **Verified** — Every archive is tracked via GitHub PRs; all changes are auditable
- 🎵 **Audio-Integrated** — Direct links to Internet Archive streams (legal, public domain)
- 🎨 **Cyberpunk Vibes** — Because archival culture deserves aesthetics
- 📖 **Template-Ready** — Fork it and create archives for *any* artist
- 🤝 **Community-Driven** — Add shows, fix errors, expand archives via PRs

---

## Project Structure

```
uXu/
├── README.md (main platform overview)
└── archives/
    ├── CyberCat-Sunflower/
    │   ├── index.html (main archive interface)
    │   ├── data.schema.json (data validation schema)
    │   ├── grateful-dead.json (sample archive data)
    │   ├── README.md (this file)
    │   └── docs/
    │       ├── CONTRIBUTING.md (how to contribute)
    │       └── CURATOR_GUIDE.md (guide for archive creators)
    ├── {OtherArchiveName}/
    │   ├── index.html
    │   ├── data.json
    │   └── README.md
    └── ...
```

---

## Getting Started

### For Viewers

Visit the [CyberCat Sunflower Index](./index.html) to:
- **Browse Archives** — Explore existing music archives
- **Search Shows** — Find specific performances by date, venue, or song
- **Stream Audio** — Listen to full shows via Internet Archive embeds
- **Learn** — Understand how the platform works

### For Contributors

Want to add shows to an existing archive or create your own?

#### Option 1: Add to Existing Archive (Easiest)

1. Fork the [uXu repo](https://github.com/RASvibir/uXu)
2. Edit `archives/{ArchiveName}/data.json` to add new shows
3. Submit a PR with your changes
4. Maintainer reviews and merges

**Show Format:**
```json
{
  "date": "YYYY-MM-DD",
  "venue": "Venue Name",
  "city": "City",
  "state": "State",
  "country": "Country",
  "setlist": ["Song 1", "Song 2", "Song 3"],
  "notes": "Optional context about this show",
  "archiveOrgId": "identifier-for-audio (optional)"
}
```

#### Option 2: Create Your Own Archive

1. **Fork the repo**
   ```bash
   git clone https://github.com/RASvibir/uXu.git
   cd uXu
   ```

2. **Create your archive directory**
   ```bash
   mkdir -p archives/{YourArchiveName}
   cd archives/{YourArchiveName}
   ```

3. **Add a `data.json` file** (following `data.schema.json`)
   ```json
   {
     "archiveName": "Your Archive Name",
     "artist": "Artist Name",
     "curator": "Your Name",
     "description": "Description of what this archive contains",
     "shows": [
       {
         "date": "YYYY-MM-DD",
         "venue": "Venue Name",
         "city": "City",
         "country": "Country",
         "setlist": ["Song 1", "Song 2"],
         "notes": "Any notes",
         "archiveOrgId": "archive-id (optional)"
       }
     ]
   }
   ```

4. **Create a `README.md`**
   ```markdown
   # Your Archive Name
   
   **Artist:** Artist Name
   **Curator:** Your Name
   **Shows:** Number of shows
   
   ## About
   
   Brief description of this archive and why it matters.
   
   ## How to Contribute
   
   Found an error? Want to add more shows? Submit a PR!
   ```

5. **Optional: Add audio**
   - Search [Internet Archive](https://archive.org/advancedsearch.php?q=collection:audio_bees+mediatype:audio&fl=identifier&output=json)
   - Find your show's archive.org ID
   - Add `"archiveOrgId"` to the show object

6. **Commit and push**
   ```bash
   git add archives/{YourArchiveName}/
   git commit -m "Add {YourArchiveName} archive"
   git push origin main
   ```

7. **Open a Pull Request**
   - Go to [uXu main repo](https://github.com/RASvibir/uXu)
   - Click "New Pull Request"
   - Describe your archive and why you created it
   - Maintainer will review and merge!

---

## Data Schema

All archives must follow the `data.schema.json` specification:

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `archiveName` | string | ✓ | Display name of archive |
| `artist` | string | ✓ | Artist/band name |
| `curator` | string | ✓ | Your name or handle (for attribution) |
| `description` | string | ✓ | What this archive contains (10-1000 chars) |
| `shows` | array | ✓ | Array of show objects (min. 10 shows) |
| `websiteUrl` | string | - | Optional link to your site/social |

### Show Object Requirements

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `date` | string | ✓ | YYYY-MM-DD format |
| `venue` | string | ✓ | Venue/theater name |
| `city` | string | ✓ | City |
| `country` | string | ✓ | Country |
| `state` | string | - | State/province (US/Canada) |
| `setlist` | array | ✓ | List of songs performed |
| `notes` | string | - | Context about the show |
| `archiveOrgId` | string | - | Internet Archive identifier |
| `spotifyLink` | string | - | Spotify link if available |
| `youtubeLink` | string | - | YouTube link if available |
| `attendance` | integer | - | Attendance estimate |
| `ticketPrice` | string | - | Original ticket price |

---

## Finding Audio on Internet Archive

Most live music is archived at [archive.org](https://archive.org). Here's how to find your show:

1. Go to https://archive.org
2. Search: `"Artist Name" "YYYY-MM-DD"` or `"Artist Name" "Venue Name"`
3. Look for recordings labeled `sbd` (soundboard) or `aud` (audience)
4. Click the show, then copy the identifier from the URL
   - Example: `archive.org/details/gd1977-05-08.sbd` → `archiveOrgId: "gd1977-05-08.sbd"`
5. Add to your `data.json`

**Quality Hierarchy:**
- `sbd` (soundboard) — Best quality, direct from mixing board
- `mat` (matrix) — Multi-track masters
- `aud` (audience) — Fan recordings, good energy
- MP3 VBR — Highest quality streamable format (FLAC available but not browser-streamable)

---

## Audio Streaming

The CyberCat Sunflower interface automatically:
- Detects the `archiveOrgId` in your show data
- Embeds the Internet Archive player
- Lets users click **"Play Full Show"** to stream all tracks
- Falls back to "Search Archive.org" if no ID is provided

**Important:** All audio must be legally available (public domain, Creative Commons, or artist-approved). The Grateful Dead encourage taping and sharing, making them perfect for this platform.

---

## Archive Requirements for Submission

To submit your archive via PR, it must meet these criteria:

- ✅ **Legal Data** — Public domain, Creative Commons, or licensed for sharing
- ✅ **Minimum 10 Shows** — Enough data to be meaningful
- ✅ **Proper Attribution** — Your name as curator
- ✅ **Valid JSON** — Must pass `data.schema.json` validation
- ✅ **README** — Explains the archive and how to contribute
- ✅ **Legal Audio** — All audio links must be licensed/public domain

---

## Contributing to Existing Archives

Want to add a show to the Grateful Dead archive or another existing collection?

1. **Fork the repo**
2. **Edit `archives/{ArchiveName}/data.json`**
3. **Add your show object** (following the schema)
4. **Submit a PR** with context about the show

Example:
```json
{
  "date": "1974-08-06",
  "venue": "Red Rocks Amphitheater",
  "city": "Morrison",
  "state": "CO",
  "country": "USA",
  "setlist": ["Lazy Lightning", "Supplication", "Sugar Magnolia", "Johnny B. Goode"],
  "notes": "First Red Rocks run - legendary recordings",
  "archiveOrgId": "gd1974-08-06.sbd"
}
```

---

## How the Platform Works

### Static Site Architecture

CyberCat Sunflower is intentionally **static and lightweight**:
- **No backend server** required
- **No database** needed
- **All data in JSON** files in the repo
- **GitHub is the database** — changes tracked, verified, attributed
- **Internet Archive API** for audio streaming (no hosting cost)

### Data Flow

```
Community PR → GitHub Review → Merge → GitHub Pages Rebuild → Live on Archive
```

### Why GitHub?

1. **Decentralized** — Anyone can fork and create their own platform variant
2. **Transparent** — All changes, contributors, and history visible
3. **Verified** — Pull requests enable curation and review
4. **Free** — No hosting fees or infrastructure costs
5. **Versioned** — Every change has a timestamp and attribution
6. **Community** — Familiar to developers, encourages forks

---

## Customization

### For Your Own Platform Variant

Want to create your own branded archive platform?

1. **Fork this repo**
2. **Edit `index.html`**:
   - Change colors in the `<style>` section
   - Modify the header/footer
   - Customize the aesthetic
3. **Load your own archives** from your fork's JSON files
4. **Deploy to GitHub Pages** or any static host

### CSS Variables (Easy Customization)

The design uses these color themes—edit `index.html` to change:
- Neon green: `#00ff88`
- Neon cyan: `#00ffff`
- Hot magenta: `#ff00ff`
- Dark background: `#0a0e27`

---

## FAQ

**Q: Can I use this for a non-music archive?**
A: Absolutely! The schema works for any live event (theater, comedy, lectures, sports, etc.). Fork it and customize!

**Q: Do I need technical skills to contribute?**
A: Basic GitHub knowledge helps, but we have templates. Contact the maintainer if you need help.

**Q: What if I find an error in an archive?**
A: Open an issue or submit a PR with the correction and source.

**Q: Can I monetize shows in my archive?**
A: No. All shows must remain free and public. CyberCat Sunflower celebrates shared culture.

**Q: How do I promote my archive?**
A: Share the link! Once merged into the main repo, it's indexed on the CyberCat Sunflower homepage.

**Q: What about copyright?**
A: Only include audio that's legally available (public domain, Creative Commons, artist-approved). We link to Internet Archive, which handles licensing verification.

---

## Roadmap

- ✅ v0.1 — Static archive platform with GitHub PR workflow
- 🔄 v0.2 — Keycloak user authentication (when Keycloak realm is ready)
- 🔄 v0.3 — Real-time community contributions without PRs
- 🔄 v0.4 — Archive stats & analytics
- 🔄 v0.5 — Discord bot for archive announcements
- 🔄 v1.0 — Multi-archive platform federation

---

## Community

- **GitHub Issues** — Report bugs, suggest features
- **GitHub Discussions** — Discuss archival practices, share tips
- **Pull Requests** — Submit your archive or contribute to existing ones

---

## License

All code in this repository is open source. Archive data is maintained by individual curators. Check individual archive READMEs for specific licensing of show data.

---

## Credits

**CyberCat Sunflower** created by [Victor Birkle III](https://github.com/RASvibir)

Inspired by the Grateful Dead's philosophy of archival freedom and the community's passion for preserving live music history.

---

*🌻 Eternally archived. Community-owned. Forever accessible. 🌻*
