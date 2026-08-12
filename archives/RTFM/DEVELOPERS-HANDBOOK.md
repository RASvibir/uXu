# Developers Handbook

Tags: developers, handbook, archives, ideas, templates, rtfm, contributing
Source: uXu RTFM library

## Why This Exists

uXu is a shared archive commons. It does not own your content.
You keep your voice, stack, and curation rules. The commons registers,
connects, and helps people find independent archives.

This handbook is for builders who want ideas — not a rule book for operating
the root console.

## Ideas You Can Steal

- One archive, one job. A Dead deck, a zine shelf, a photo run — pick a focus.
- Make the first screen feel like a place, not a dashboard.
- Ship keyboard paths early (index, open, help). Power users will thank you.
- Put provenance in the open: where audio/images came from, and why they are legal.
- Prefer boring, durable formats (HTML + JSON + plain CSS/JS) unless you need more.
- Document the weird parts. Future-you is a stranger.

## Archive Shape (Common Pattern)

Many uXu archives look like:

```text
archives/Your-Archive/
  index.html      interactive surface
  data.json       catalog / metadata
  README.md       human story
  docs/           curator notes (optional)
```

`templates/` and existing entries (CyberCat Sunflower, RTFM) are optional references.
Use them if they help; ignore them if they do not.

## data.json Thinking

Keep a clear top-level identity (name, curator, description) and a list of items
with stable fields: date, venue/place, notes, and media sources ranked best-first.
Validate against the shared schema when one applies (see templates/data.schema.json).

## Relationships

`*:*` is the uXu declared relationship marker.

```text
Archive_A.uXu*:*Archive_B.uXu
```

means A declares a connection with B. It is not ownership, endorsement, or control.

## RTFM

RTFM (Read The Friendly Manual) is a library of working examples:
audio players, sourcing guides, contribution patterns.
Browse it in the repo under archives/RTFM/, or from 0?0 MANUAL when manuals are ingested.

Share what works: add a tagged markdown file, credit the source archive, keep licenses clear.

## Contributing Without Gatekeeping

Fork, build, open a PR. Respect legality and safety.
Your archive remains independent even when it is registered in the commons.

## What This Handbook Skips On Purpose

Inner workings of the root control plane, credentials, elevation flows, and deploy
secrets are out of scope here. Curious about structure? Read the Source Code Pamphlet.
Want to listen? Open CyberCat Sunflower and its Manual.
