# 🌻 uXu: The Archive Without Limits

> **No gatekeepers. No standards. No requirements—just culture.**

uXu is a **decentralized community archive**. A safe hub where anyone can preserve and share anything—live performances, lectures, cultural events, text files, images, code, documentation, or whatever you want to archive.

We believe culture belongs to the people who lived it. Every contribution is a standalone archive, curated and presented however the contributor chooses. No templates. No schemas. No enforced structure.

---

## What is uXu?

**A repository of repositories.** Each folder under `archives/` is an independent archive created and maintained by a community member. You own your archive. You design it. You curate it.

Some archives might be:
- Interactive web players with rich metadata (like CyberCat Sunflower)
- Simple folders with audio files and a text description
- A single `.md` file with links
- Video documentation with custom styling
- Anything legal and cyber-safe

**There is no "correct" way to archive. Your way is the right way.**

---

## How to Contribute Your Archive

### The Only Requirements

- **Legal:** You must have the right to share the content you're archiving.
- **Safe:** Content must not violate basic safety guidelines (no harassment, dangerous content, etc.).

**That's it. Everything else is up to you.**

### Steps to Add Your Archive

1. **Fork the repository**
   ```bash
   git clone https://github.com/RASvibir/uXu.git
   cd uXu
   ```

2. **Create your archive folder**
   ```bash
   mkdir -p archives/{YourArchiveName}
   ```

3. **Build your archive however you want**
   - Create an `index.html` with custom styling and interactivity
   - Write a README describing your collection
   - Add a `data.json` file (or don't)
   - Include images, code, documentation, audio files
   - Use whatever structure makes sense for your content

4. **Commit and push**
   ```bash
   git add archives/{YourArchiveName}/
   git commit -m "Add {YourArchiveName} archive"
   git push origin main
   ```

5. **Open a Pull Request**
   - Link to your archive in the PR description
   - Briefly explain what you're archiving and why it matters
   - We review for legality and safety only
   - If it passes, it's merged into uXu

---

## Examples in This Repo

**CyberCat Sunflower** — An interactive web-based archive of transformative Grateful Dead performances. Includes a custom audio player, setlist browsing, and cyberpunk-themed UI. This is one contributor's vision of how to present a music archive.

**RTFM** — A searchable archive of working code, templates, and instructions. If you want to build an interactive archive like CyberCat, or learn how others solved problems, this is where contributors share what worked.

---

## What Belongs in RTFM?

RTFM is a **shared resource archive**—not rules, not a standard, but **working examples and helpful documentation** that other contributors can learn from if they choose.

Examples:
- HTML/CSS/JS code that works for audio players, galleries, etc.
- Markdown templates for common archive types
- Guides on sourcing legal audio (Internet Archive, Creative Commons, etc.)
- Tips on structuring metadata
- Examples of data.json files
- Troubleshooting and gotchas

**Using RTFM is optional.** You can completely ignore it and build from scratch. Or you can learn from it. Your choice.

---

## Community Values

- **No gatekeepers**: We don't tell you what to archive or how to present it.
- **No standards**: Massive interactive app? Single text file? Both are valid.
- **Radical transparency**: Your archive is public. Your curation is visible. Your choices stand.
- **Legal & safe**: The only hard lines. Everything else is free thought.
- **Preservation**: Once archived here, it stays. We're not a platform—we're a vault.

---

## License

MIT License — Use this code however you want. See `LICENSE` for details.

---

## Questions?

- **"Can I archive [thing]?"** → If it's legal and safe, yes.
- **"Do I have to follow a format?"** → No. Build what you want.
- **"Can I look at how others did it?"** → Yes. Check RTFM or browse existing archives.
- **"What if my archive is weird/experimental?"** → Perfect. That's the point.

---

**The perimeter is protected, but the gates are open for sharing.** 🌻
