# 🎵 Sourcing Legal Audio for Archives

A guide to finding, verifying, and legally sourcing audio recordings for your archive.

**Tags:** audio, sourcing, legal, internet-archive, creative-commons, permissions

---

## The Legal Foundation

Before sourcing anything, understand the basics:

- **Public Domain**: Recordings older than a certain date (varies by country). Generally pre-1928 in US.
- **Creative Commons**: Artist licenses their work for sharing (check the specific CC license).
- **Artist Permission**: Contact the artist or estate directly—often worth asking.
- **Taper Culture**: Some artists (Grateful Dead, Phish, etc.) explicitly allow fan recordings to be shared.
- **Internet Archive**: Massive free repository of legally archived material, including bootlegs artists have approved.

**Golden Rule**: If you don't have explicit permission or a clear legal basis, don't source it.

---

## Internet Archive (Primary Method)

### What It Is
[archive.org](https://archive.org) — A non-profit library hosting millions of digitized items. For live music, it's the gold standard. Thousands of concerts, bootlegs, radio broadcasts, all legally hosted and searchable.

### Finding Recordings

1. Go to [archive.org](https://archive.org)
2. Search: `"Grateful Dead 1977"` or `"Phish 1995"` or your artist
3. Browse results—each has metadata (venue, date, setlist, quality notes)
4. Click into a show to see formats (FLAC, MP3, OGG, WAV)
5. Note the **item ID** (e.g., `gd77-05-08.sbd.seamons.86046.flac16`)

### URL Structure

Internet Archive download URLs follow this pattern:

```
https://archive.org/download/{ITEM_ID}/{FILE_NAME}.mp3
```

**Example:**
```
https://archive.org/download/gd77-05-08.sbd.seamons.86046.flac16/gd1977-05-08d1t01.mp3
```

Breaking it down:
- `gd77-05-08` = Band (GD), Date (May 8, 1977)
- `sbd` = Source type (soundboard = professional, best quality)
- `seamons.86046` = Transfer engineer & collection ID
- `flac16` = Format (FLAC, 16-bit)
- `gd1977-05-08d1t01.mp3` = Specific file (disc 1, track 1, MP3)

### Source Types

- **`sbd`** = Soundboard (professional board mix, cleanest audio, highest quality)
- **`aud`** = Audience (recorded from crowd, more character, lower quality, lots of crowd noise)
- **`fm`** = FM Radio broadcast (professional but compressed)
- **`stream`** = Live stream or other source

**Pro tip**: Sort by source type. SBD is usually best, but AUD has charm.

### Why Internet Archive Works

**For Grateful Dead & Phish**: Jerry Garcia explicitly allowed taping. Community tapers documented everything. Archive.org respects this and hosts legally.

**For other artists**: Check if they have a similar taper-friendly policy before assuming you can share recordings.

---

## Adding Recordings to Your Archive

Once you've found a recording, add it to your data structure:

### JSON Format (if using structured data)

```json
{
  "date": "1977-05-08",
  "venue": "Barton Hall, Cornell University",
  "city": "Ithaca",
  "state": "NY",
  "country": "USA",
  "setlist": ["Bertha", "Good Lovin'", "Tennessee Jed", "Jack Straw", "Deal"],
  "notes": "Widely considered the greatest live performance ever recorded.",
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

- **`url`**: Direct download link from Internet Archive (or your CDN)
- **`sourceType`**: `sbd`, `aud`, `fm`, `stream`, etc.
- **`label`**: Human-readable description (who transferred it, quality notes, etc.)

### Multiple Versions of the Same Show

Internet Archive often has multiple tapes of one show (different tapers, different quality). List them all:

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

---

## Alternative Audio Sources

### 1. Direct Artist Sites / Bandcamp

Many artists host official recordings:

```json
{
  "url": "https://yourband.bandcamp.com/track/live-concert-2024",
  "sourceType": "stream",
  "label": "Official Bandcamp Release"
}
```

### 2. Creative Commons Libraries

- [Free Music Archive](https://freemusicarchive.org)
- [ccMixter](http://ccmixter.org)
- [Incompetech](https://incompetech.com)

Check the specific CC license (BY, BY-SA, BY-NC, etc.).

### 3. YouTube (With Caution)

Videos get removed. Use as secondary only:

```json
{
  "url": "https://www.youtube.com/watch?v=...",
  "sourceType": "stream",
  "label": "YouTube (may be removed)"
}
```

### 4. Your Own Server / CDN

If you have hosting:

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

List songs in performance order. For multi-set shows:

```json
"setlist": [
  "Bertha",
  "Good Lovin'",
  "Tennessee Jed",
  "SET 2: Jack Straw",
  "Deal",
  "Scarlet Begonias",
  "ENCORE: Johnny B. Goode"
]
```

### Notes Field

Explain why this recording matters:

```json
"notes": "Widely considered the greatest live performance ever recorded. 
Pristine SBD recording from a college gym. Every instrument sits perfectly 
in the mix. This is the gateway show for newcomers."
```

**Good notes include:**
- Historical significance
- Why it's a standout
- Audio quality notes
- Rare performances or debuts
- Recording lineage (who transferred it, how many generations)

**Avoid:** Trivial details, spoilers, redundant metadata.

---

## Genre-Specific Tips

### Jazz / Funk / Experimental
- **Primary**: Internet Archive, YouTube
- **Secondary**: Artist Bandcamp, local archives
- **Best approach**: Contact artist directly—many are open to sharing

### Grateful Dead, Phish, Jam Bands
- **Primary**: Internet Archive (taper-friendly culture)
- **Bonus**: Check archive-specific sites (phish.net, etree.org community links)
- **Community**: Join taper forums for sourcing advice

### Classical / Academic
- **Primary**: YouTube, official recordings, institutional archives
- **Secondary**: Universities may have recording policies
- **Contact**: Email departments—they sometimes release recordings openly

### Hip-Hop / Electronic
- **Primary**: Artist Bandcamp, SoundCloud
- **Secondary**: YouTube (verify uploader has rights)
- **Legal**: Usually copyright-restricted; get explicit permission

---

## Red Flags: What NOT to Do

❌ **Don't use copyrighted commercial releases without permission**
- Official albums are owned by record labels
- You need explicit licensing

❌ **Don't assume "it exists online" = "I can share it"**
- Just because YouTube has it doesn't mean you can re-distribute it

❌ **Don't skip artist permission for non-taper-friendly bands**
- If unclear, ask. Most artists appreciate the respect.

❌ **Don't archive content you don't have rights to**
- This is the only hard line uXu has

---

## Verification Checklist

Before adding a recording:

- ✅ **Legal**: Artist allows / CC license / Public Domain / Explicit permission
- ✅ **Accurate**: Venue, date, setlist match the recording
- ✅ **Quality**: Audio is listenable (no harsh artifacts, acceptable bitrate)
- ✅ **Complete**: If partial show, clearly note it
- ✅ **Reliable**: URL works and isn't rate-limited
- ✅ **Format**: MP3 or web-friendly codec (not WAV for streaming)

---

## Contributing Your Own Recordings

If you recorded something or have original recordings:

1. **Verify rights**: Did you record it? Do you own it?
2. **Get permission** from artists (if not taper-friendly)
3. **Upload to Internet Archive**
   - Create account at archive.org
   - Click "Upload"
   - Fill in metadata (artist, date, venue, etc.)
   - Choose appropriate license
4. **Add to your archive** with the Internet Archive URL
5. **Submit PR** to uXu

---

## Questions?

**"Can I archive [artist]?"**
→ Check their website for taping policy. If unclear, ask.

**"What if my link breaks?"**
→ Internet Archive URLs are permanent (rare to break). If it does, contact maintainer.

**"Can I use Spotify/Apple Music links?"**
→ No. They're access-controlled and region-locked. Use archive.org or artist direct sources.

**"Do I need permission for everything?"**
→ No. Taper-friendly bands (Dead, Phish, etc.) have blanket policies. Public domain is free. CC is clear. Everything else: ask.

---

**Source responsibly. Archive thoughtfully. Share legally.** 🎵
