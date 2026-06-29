# Contributing to uXu

uXu is open to anyone who wants to archive live music legally and share it. You don't need pre-approval to start building — just follow this guide and open a PR when you're ready.

## Adding shows to an existing archive

1. Fork the repo
2. Open `archives/{ArchiveName}/data.json`
3. Add your show object to the `shows` array, following the schema below
4. Open a PR describing the show and where the recording/setlist info came from

```json
{
  "date": "1974-08-06",
  "venue": "Red Rocks Amphitheatre",
  "city": "Morrison",
  "state": "CO",
  "country": "USA",
  "setlist": ["Promised Land", "Sugaree", "Mexicali Blues"],
  "notes": "Optional context about this show",
  "audioSources": [
    {
      "archiveOrgId": "gd1974-08-06.sbd.miller.32257.sbeok.flac16",
      "sourceType": "sbd",
      "label": "Soundboard (Miller transfer)"
    }
  ]
}
```

## Creating your own archive

1. **Fork and clone**
   ```bash
   git clone https://github.com/RASvibir/uXu.git
   cd uXu
   ```

2. **Create your archive folder**
   ```bash
   mkdir -p archives/{YourArchiveName}
   ```

3. **Add `data.json`**, following [`data.schema.json`](../../../data.schema.json):
   ```json
   {
     "archiveName": "Your Archive Name",
     "artist": "Artist Name",
     "curator": "Your Name",
     "description": "What this archive contains and why it matters.",
     "featured": false,
     "shows": [ ]
   }
   ```
   `featured` should stay `false` — only the uXu maintainer sets that to `true`, to promote an archive to the front page. It doesn't gate whether your archive exists in the repo, only where it's displayed.

4. **Register your archive** so the platform UI picks it up. Open `index.html` and add your data.json path to the `ARCHIVE_REGISTRY` array near the top of the `<script>` block:
   ```js
   const ARCHIVE_REGISTRY = [
     "archives/CyberCat-Sunflower/data.json",
     "archives/{YourArchiveName}/data.json"
   ];
   ```

5. **Find audio on Internet Archive** for your shows (see below)

6. **Commit, push, open a PR**
   ```bash
   git add archives/{YourArchiveName}/ index.html
   git commit -m "Add {YourArchiveName} archive"
   git push origin main
   ```
   Open a PR against `RASvibir/uXu`. GitHub will notify the maintainer automatically — there's no separate approval step required before your archive is mergeable, but the maintainer reviews everything that comes in and may reach out with questions or feedback.

## What gets featured

Anything legal is welcome in the repo. **Featured** placement (the top section of the front page) is at the maintainer's discretion, generally going to archives that are well-documented, have solid audio sources, and meet the schema cleanly. You can request to be considered for featuring in your PR description, but it's never required to participate.

## Finding audio on Internet Archive

1. Go to [archive.org](https://archive.org)
2. Search `"Artist Name" "YYYY-MM-DD"` or `"Artist Name" "Venue Name"`
3. Look for recordings tagged `sbd` (soundboard, best quality) or `aud` (audience)
4. Copy the identifier from the URL — e.g. `archive.org/details/gd1977-05-08.sbd.hicks.4982.sbeok.shnf` → `archiveOrgId: "gd1977-05-08.sbd.hicks.4982.sbeok.shnf"`
5. Leave `tracks` out of your `audioSources` entry unless you want to hand-specify filenames — the player will automatically resolve the real tracklist from Internet Archive's metadata API at load time.

**Quality hierarchy**, best to worst for `sourceType`:
- `sbd` — soundboard, direct from the mixing board
- `matrix` — multi-track masters/blends
- `fm` — FM broadcast
- `aud` — audience recording

List your best available source first in the `audioSources` array — the player defaults to index 0.

## Legal requirements

- Only link to recordings that are legitimately public on Internet Archive (public domain, Creative Commons, or artist/taper-permitted circulation)
- uXu never re-hosts audio files — only streams from sources that are already public
- If you're unsure whether a recording is legally streamable, don't add it — open an issue to ask first
