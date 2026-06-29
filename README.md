# 🌻 uXu: The Archive Without Limits

> **No gatekeepers. No gatekeeping. No rules—just culture.**

uXu is a decentralized archive platform where **anyone can preserve and share anything**. Music, theater, comedy, sports, lectures, podcasts, streams, live events—if it's documented and legal, it belongs here.

Built on GitHub. Owned by communities. Answering to no one.

## What is uXu?

Culture doesn't belong to corporations. It belongs to the people who lived it, loved it, and want to keep it alive.

uXu is the platform for that. No gatekeepers. No paywalls. No "sorry, we can't archive that." If it's legal, it's in.

Every archive on uXu is:

- ✅ **Totally open** — Archive whatever you want (if it's legal)
- ✅ **Verified by community** — GitHub PRs keep it honest
- ✅ **Attributed** — Your name stays on your work forever
- ✅ **Free forever** — No paywalls, no ads, no bullshit
- ✅ **Forkable** — Remix it, rebrand it, make it yours
- ✅ **Transparent** — Every change tracked, nothing hidden

---

## Getting Started: Archive Anything

### What Can You Archive?

**Literally anything legal:**

- 🎵 **Music** — Live concerts, studio sessions, rare recordings, bootlegs, lost albums
- 🎭 **Performance** — Theater, comedy, improv, dance, circus, street performances
- 🏀 **Sports** — Historic games, legendary moments, athlete interviews, training footage
- 🎤 **Spoken Word** — Lectures, podcasts, speeches, debates, poetry readings
- 📺 **Video** — Twitch streams, YouTube lives, TV recordings, documentaries
- 🎬 **Film** — Underground cinema, experimental video, home movies, documentaries
- 📚 **Audio** — Audiobooks, radio shows, sound art, ambient recordings
- 🌐 **Culture** — Any live event, any documented moment worth keeping

**The only rule:** It's gotta be legal. Public domain? Licensed? Artist-approved? You're good. Stolen? Nope.

---

## Build Your Archive in 5 Minutes

### Option 1: Use an Archive Tool (Easiest)

We recommend **[Archive.org's Upload Tool](https://archive.org/account/login.createaccount.php)** or **[MediahawkCA](https://mediahawkca.com/)** to find and organize shows, then add them to uXu.

### Option 2: DIY Archive

1. **Fork this repo**
```bash
   git clone https://github.com/RASvibir/uXu.git
   cd uXu
```

2. **Create your archive folder**
```bash
   mkdir -p archives/{YourArchiveName}
```

3. **Add your data** (`data.json`):
```json
   {
     "archiveName": "Your Archive Name",
     "artist": "Artist/Creator Name",
     "curator": "Your Name",
     "description": "What this is and why it matters",
     "shows": [
       {
         "date": "YYYY-MM-DD",
         "venue": "Location",
         "city": "City",
         "country": "Country",
         "setlist": ["Item 1", "Item 2", "Item 3"],
         "notes": "Your notes",
         "archiveOrgId": "optional-archive-id"
       }
     ]
   }
```

4. **Submit a PR** with your archive
   - Describe what you archived
   - Explain why it matters
   - Link to your sources

5. **Done.** Your archive goes live when merged.

---

## Example: CyberCat Sunflower

**CyberCat Sunflower** is our first archive—a cyberpunk-themed collection of Grateful Dead shows (1966-1995) with full audio integration.

**Why we started with this:**
- ✅ Public domain recordings (no licensing issues)
- ✅ Band encouraged taping ("Go ahead and tape us")
- ✅ Perfect template for music archives
- ✅ Shows what's possible with Internet Archive integration

### How It Works

**View it:** `/archives/CyberCat-Sunflower/index.html`

**The tech stack:**
- 📄 **`data.json`** — Show data (date, venue, setlist, audio ID)
- 🌐 **`index.html`** — Interactive interface (search, browse, play audio)
- 📋 **`data.schema.json`** — Validation rules (keeps data clean)
- 🎵 **Internet Archive API** — Streams full shows (free, legal)

### Basic Audio Integration

1. **Find your show on [archive.org](https://archive.org)**
   - Search: `"Artist Name" "YYYY-MM-DD"`
   - Look for `sbd` (soundboard) or `aud` (audience) recordings

2. **Copy the archive ID**
   - Example: `archive.org/details/gd1977-05-08.sbd` → ID: `gd1977-05-08.sbd`

3. **Add to your data.json**
```json
   {
     "date": "1977-05-08",
     "venue": "Cornell University",
     "city": "Ithaca",
     "state": "NY",
     "country": "USA",
     "setlist": ["Bertha", "Good Lovin'", "Tennessee Jed"],
     "archiveOrgId": "gd1977-05-08.sbd"
   }
```

4. **The platform auto-embeds the player.** Your archive streams it.

**That's it.** No backend. No hosting fees. Just GitHub + Internet Archive.

### Customize the Interface

Copy CyberCat Sunflower's `index.html` to your archive folder and modify:
- Change artist name in the header
- Swap colors (`#00ff88` → your color, etc.)
- Update branding to match your vibe

Make it yours.

---

## Archive Requirements

Keep it simple. Your archive needs:

- ✅ **Legal content** (public domain, licensed, or artist-approved)
- ✅ **Minimum 10 items** (enough to matter)
- ✅ **Your attribution** (your name stays on it)
- ✅ **Valid JSON** (follow the schema, keep it clean)
- ✅ **A README** (explain what you archived and why)

**That's it.** No approval committee. No restrictions on genre, style, or discipline. If it's documented and legal, it lives here.

---

## Data Schema

See `archives/CyberCat-Sunflower/data.schema.json` for complete details.

**Required per archive:**
- `archiveName`, `artist`, `curator`, `description`, `shows`

**Required per show:**
- `date`, `venue`, `city`, `country`, `setlist`

**Optional:**
- `state`, `notes`, `archiveOrgId`, `spotifyLink`, `youtubeLink`, `attendance`, `ticketPrice`

---

## What Archives Exist (And What Could)

**Music:** Grateful Dead, jazz legends, blues pioneers, punk bands, garage rock, lo-fi bedroom pop, symphonies, opera, electronic live sets, jam bands, folk singers, hip-hop cyphers

**Performance:** Theater productions, comedy specials, improv shows, dance recitals, circus acts, magic performances, street performers, busking videos, wrestling matches

**Spoken Word:** Lectures, conference talks, podcasts, audiobooks, speeches, poetry readings, TED talks, interviews, oral histories, activist speeches

**Video:** Twitch livestreams, YouTube uploads, TV recordings, concert films, documentaries, home videos, live performance captures, art installations

**Anything else:** If it's documented and legal, archive it.

**The point:** No gatekeeping. No "that's not music enough" or "that doesn't fit our brand." This is a commons. Build your archive. Preserve what matters to you.

---

## How It Works

uXu is intentionally **simple and decentralized**:
Your Archive (data.json)

↓

GitHub Repo

↓

GitHub Pages (serves HTML)

↓

Internet Archive API (streams audio)

↓

User's Browser
**Why this approach?**
- ✅ No backend server needed
- ✅ No database to maintain
- ✅ No hosting costs
- ✅ No single point of failure
- ✅ Everyone can fork and modify
- ✅ Full version control via Git
- ✅ Community moderation via PRs

---

## Contributing

### Add Shows to Existing Archive

1. Fork this repo
2. Edit `archives/{ArchiveName}/data.json`
3. Add your show(s) following the schema
4. Submit a PR with context

### Report Issues

Found an error? Open a GitHub issue with:
- Which archive
- What's wrong
- Suggested correction + source

---

## FAQ

**Q: Do I need technical skills?**
A: Basic GitHub knowledge helps. We have templates and examples.

**Q: Can I monetize my archive?**
A: No. All archives must remain free and public. This is about culture, not profit.

**Q: What if someone submits copyrighted material?**
A: We only accept public domain or properly licensed content. PRs reviewed for legality.

**Q: Can I edit archives after merged?**
A: Yes! Submit a PR with corrections/additions. All changes tracked.

**Q: How do I promote my archive?**
A: Once merged, share the link. We'll index it here.

**Q: Can I customize the interface?**
A: Yes! Edit colors, branding, layout. Make it yours.

**Q: What about privacy?**
A: This is public. No personal data collected.

**Q: Can this work for non-music events?**
A: Absolutely! Theater, comedy, lectures, sports, streams—anything.

---

## Roadmap

- ✅ v0.1 — Core platform + Grateful Dead archive + GitHub workflow
- 🔄 v0.2 — Keycloak authentication (when ready)
- 🔄 v0.3 — Real-time contributions (no PR required)
- 🔄 v0.4 — Archive statistics & analytics
- 🔄 v0.5 — Discord bot for announcements
- 🔄 v1.0 — Multi-archive federation

---

## Community

- **GitHub Issues** — Report bugs, suggest features
- **GitHub Discussions** — Share tips and best practices
- **Pull Requests** — Submit your archive
- **Gists** — Share announcements

---

## License

MIT License — Use this code however you want. See `LICENSE` for details.

---

## Credits

**uXu Platform** created by [Victor Birkle III](https://github.com/RASvibir)

Inspired by:
- The Grateful Dead's philosophy of archival freedom
- Community passion for preserving live performance
- Open-source culture and decentralized systems

---

## Quick Links

- 📁 [CyberCat Sunflower Archive](./archives/CyberCat-Sunflower/)
- 📋 [Data Schema](./archives/CyberCat-Sunflower/data.schema.json)
- 📜 [MIT License](./LICENSE)
- 🎨 [Project Gist](https://gist.github.com/RASvibir/a3a949cd8368aeb057744f3bba314d14)

---

**🌻 Eternally archived. Community-owned. Forever accessible. 🌻**

*Because culture belongs to everyone.*
