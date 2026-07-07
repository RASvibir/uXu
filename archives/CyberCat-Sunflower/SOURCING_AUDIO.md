# 🎵 How to Source Audio for uXu Archives

This guide explains how to find, verify, and legally source audio recordings for your uXu archive. The CyberCat Sunflower archive (Grateful Dead) uses Internet Archive as the primary source—follow this model.

---

## The Legal & Ethical Foundation

Before sourcing anything, understand the landscape:

- **Public Domain**: Some recordings are in the public domain (generally pre-1928 in the US, but varies by country and recording type).
- **Creative Commons**: Many artists license their work under CC licenses that allow sharing for non-commercial use.
- **Artist Permission**: The best path—contact the artist or their estate directly.
- **Internet Archive**: A massive repository of legally archived material, including bootlegs that artists have explicitly allowed to be shared.
- **Community Taper Culture**: For live music, many "taper" communities exist where recordings are shared with permission. Example: Grateful Dead taping is explicitly legal under a blanket taping policy.

**DO NOT source copyrighted material without explicit permission or a valid legal basis.**

---

## The Internet Archive Approach (Primary Method)

### What is Internet Archive?

[archive.org](https://archive.org) is a massive non-profit library of digitized material. For live music, it hosts thousands of bootleg recordings that artists have given permission to share. It's the gold standard for Dead, Phish, jam band, and folk music archives.

### Finding Recordings on Internet Archive

1. **Go to [archive.org](https://archive.org)**
2. **Search for your artist/band**: Try "Grateful Dead 1977" or "Phish 1995"
3. **Click into a show listing**—you'll see:
   - Multiple audio formats (FLAC, MP3, WAV, OGG)
   - Detailed metadata (venue, setlist, quality notes)
   - A unique archive ID (e.g., `gd77-05-08.sbd.seamons.86046.flac16`)

### Understanding the URL Structure

Internet Archive audio downloads follow this pattern:

```
https://archive.org/download/{ITEM_ID}/{FILE_NAME}.mp3
```

**Example from CyberCat Sunflower:**
```
https://archive.org/download/gd77-05-08.sbd.seamons.86046.flac16/gd1977-05-08d1t01.mp3
```

Breaking it down:
- `gd77-05-08` = Grateful Dead, May 8, 1977
- `sbd` = Soundboard recording (professional audio, not audience)
- `seamons.86046` = Transfer engineer & collection ID
- `flac16` = Format (FLAC, 16-bit)
- `gd1977-05-08d1t01.mp3` = File name (disc 1, track 1, MP3 format)

### Why This Works for the Dead

The Grateful Dead has an **explicit taping policy**:
- Jerry Garcia explicitly allowed fans to record shows (with microphones, no commercial intent)
- This created a massive community of "tapers" who documented the band
- Internet Archive hosts these community recordings with permission
- The GD community considers tape-sharing as part of the culture

**For other artists**: Check if they have a similar policy before assuming you can share recordings.

---

## Adding Recordings to Your Archive

Once you've found a show on Internet Archive, add it to your `data.json`:

```json
{
  "date": "1977-05-08",
  "venue": "Barton Hall, Cornell University",
  "city": "Ithaca",
  "state": "NY",
  "country": "USA",
  "setlist": ["Bertha", "Good Lovin'", "Tennessee Jed", "Jack Straw", "Deal"],
  "notes": "Widely considered the greatest live GD show ever recorded.",
  "audioSources": [
    {
      "url": "https://archive.org/download/gd77-05-08.sbd.seamons.86046.flac16/gd1977-05-08d1t01.mp3",
      "sourceType": "sbd",
      "label": "Soundboard (Seamons transfer)"
    }
  ]
}
```

### Key Fields

- **`url`**: The direct download link from Internet Archive (or your own CDN)
- **`sourceType`**: One of:
  - `sbd` (Soundboard—professional board mix, best quality)
  - `aud` (Audience—recorded from the crowd, more character, lower quality)
  - `fm` (FM Radio broadcast)
  - `stream` (Live stream or other source)
- **`label`**: Human-readable description of this specific recording

---

## Advanced: Finding Multiple Versions of the Same Show

Internet Archive often has multiple tapes of the same show (different tapers, different quality). You can list them all:

```json
"audioSources": [
  {
    "url": "https://archive.org/download/gd77-05-08.sbd.seamons.86046.flac16/gd1977-05-08d1t01.mp3",
    "sourceType": "sbd",
    "label": "Soundboard (Seamons transfer) - BEST QUALITY"
  },
  {
    "url": "https://archive.org/download/gd77-05-08.aud.unknown.7411.flac16/gd1977-05-08d1t01.mp3",
    "sourceType": "aud",
    "label": "Audience Recording - More atmosphere"
  }
]
```

**The player defaults to the first entry**, so list your recommended version first.

---

## Alternative: Direct URLs from Other Sources

You don't have to use Internet Archive. Other options:

### 1. **Artist Websites / Bandcamp**
Some artists host recordings directly on Bandcamp or their official site:
```json
{
  "url": "https://yourband.bandcamp.com/track/live-at-venue-2024",
  "sourceType": "stream",
  "label": "Official Bandcamp Release"
}
```

### 2. **YouTube (with caution)**
YouTube often has concert recordings, but they're unreliable (videos get removed). Use as a secondary source only:
```json
{
  "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  "sourceType": "stream",
  "label": "YouTube (may be removed)"
}
```

### 3. **Your Own Server / CDN**
If you have bandwidth and hosting, upload files directly:
```json
{
  "url": "https://yoursite.com/audio/show-2024-06-15.mp3",
  "sourceType": "sbd",
  "label": "Direct upload"
}
```

---

## Metadata Best Practices

### Setlist Format

List songs in performance order. For multi-set shows, prefix with set notation:

```json
"setlist": [
  "Bertha",
  "Good Lovin'",
  "Tennessee Jed",
  "SET 2: Jack Straw",
  "Deal",
  "Scarlet Begonias"
]
```

### Notes Field

Use `notes` to provide context that makes the show historically significant:

```json
"notes": "Widely considered the greatest live GD performance ever recorded. Pristine SBD recording from a college gym. Every instrument sits perfectly in the mix."
```

**Good notes include:**
- Why this show matters historically
- Unique performances or rare songs
- Audio quality notes
- Attendance or venue info
- Cultural/musical significance

**Avoid:** Trivial details, spoilers, or metadata already in other fields.

---

## Sourcing Strategy by Genre

### Jazz / Funk / Experimental
- **Primary**: Internet Archive (check if artist allows taping)
- **Secondary**: Artist Bandcamp, private archives
- **Research**: Contact artist directly—many are open to sharing

### Grateful Dead, Phish, Jam Bands
- **Primary**: Internet Archive (massive taping culture)
- **Bonus**: Archive.org has dedicated projects (phish.net, etree.org links)
- **Community**: Join taper forums (deadlists, phish.net) for sourcing advice

### Classical / Academic
- **Primary**: YouTube, official recordings
- **Secondary**: Performance archives at institutions
- **Contact**: Universities often have recording policies

### Hip-Hop / Electronic
- **Primary**: Artist Bandcamp, SoundCloud
- **Secondary**: YouTube, official releases
- **Legal**: Often copyright-restricted; get explicit permission

---

## Red Flags & What NOT to Do

❌ **Don't use copyrighted commercial releases without permission**
- Official album versions are copyrighted by record labels
- You need explicit licensing to share them

❌ **Don't scrape YouTube without checking terms**
- Individual creators may upload copyrighted material
- Always verify the uploader has rights to share

❌ **Don't assume "archive" = "freely shareable"**
- Just because something exists on archive.org doesn't mean you can re-host it
- Check the Creative Commons license on each item

❌ **Don't skip the artist permission step**
- Taper-friendly bands (Grateful Dead, Phish, etc.) have explicit policies
- Other artists may have unwritten policies—ask

---

## Verification Checklist

Before adding a recording to your archive, verify:

- ✅ **Legal status**: Artist allows taping/sharing OR Creative Commons OR Public Domain
- ✅ **Accuracy**: Venue, date, and setlist match the recording
- ✅ **Quality**: Audio is listenable (no harsh digital artifacts)
- ✅ **Completeness**: If partial show, clearly note in description
- ✅ **URL reliability**: Link works and isn't rate-limited
- ✅ **Format**: MP3 or other web-friendly codec (avoid WAV for streaming)

---

## Contributing Your Own Recordings

If you're a taper or have original recordings:

1. **Verify your rights**: Did you record it? Do you own the recording?
2. **Get artist permission** (if not a taper-friendly band)
3. **Upload to Internet Archive** (free, permanent hosting)
   - Create an account at archive.org
   - Click "Upload" in the top menu
   - Fill in metadata (artist, date, venue, etc.)
   - Accept the license terms
4. **Add to uXu** with your Internet Archive item link
5. **Open a PR** to add your show to the archive

---

## Questions?

- **"Can I share [specific band]?"** → Check their website for taping policy. If unclear, ask.
- **"My link broke—what do I do?"** → Internet Archive URLs are permanent. If it's broken, the original item may have been removed (rare). Contact the maintainer.
- **"Can I use streaming service URLs?"** → Generally no—they're access-controlled and may be region-locked. Use archive.org or direct artist sources instead.

---

## Examples from CyberCat Sunflower

All URLs in the CyberCat Sunflower archive follow this pattern:

```
https://archive.org/download/{ARCHIVE_ID}/{FILE_NAME}.mp3
```

Why? 
- **Permanent**: Internet Archive doesn't remove Dead recordings (taping is legally approved)
- **High quality**: SBD and AUD recordings available
- **Searchable**: Easy for users to verify source
- **Ethical**: Artist-approved, community-maintained

---

**Start here, ask questions, and respect the artists. Culture belongs to the people who lived it.** 🎵
