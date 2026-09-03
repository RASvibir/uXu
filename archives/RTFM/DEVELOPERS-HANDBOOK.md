# Developers Handbook

Tags: developers, handbook, architecture-patterns, data-json, rtfm, contributing
Source: uXu RTFM library

## Audience

Builders and coders. For non-technical orientation use the **User Guide**.
For a from-scratch archive path use the **Archive Creation Manual**.

## Commons Stance

uXu registers and connects independent archives. It does not own your content.
Keep your stack, curation rules, and voice. Prefer durable, boring formats unless
you have a reason to go further.

## Patterns Worth Reusing

- One archive, one job.
- First viewport = place, not dashboard.
- Keyboard paths early (index / open / help).
- Provenance in the open (source + why it is legal).
- HTML + JSON + CSS/JS until complexity truly demands more.
- Document the weird parts for future-you.

## Reference Layout

```text
archives/Your-Archive/
  index.html
  data.json
  README.md
  docs/            optional curator notes
```

`templates/` and CyberCat Sunflower are optional references — not requirements.
CyberCat Deck Builder (`archives/CyberCat-Deck-Builder/`) is a separate room:
unique rest-of-names on the device, bolt wordmark a hair taller than type (not favicon).
Empty-deck look is Lathe; Sunflower CRT packs are not in that room.

## data.json Craft

Stable identity fields (name, curator, description) plus an items array with
consistent keys: date, place/venue, notes, media sources ranked best-first.
Validate against `templates/data.schema.json` when it applies.

## Relationships

```text
Archive_A.uXu*:*Archive_B.uXu
```

Declares a connection. Not ownership, endorsement, or control.

## Climbing The Complexity Tree

See Archive Creation Manual for the full tier tree. Quick map for builders:

- Tier 1–2: static catalog + polish
- Tier 3: interactive app surfaces (EQ, galleries, custom state)
- Tier 3b: shared/account-linked cache features (coordinate with admin)
- Tier 4: hardened access — design with threat model; do not invent secrets in-repo

## RTFM Contributions

Add tagged markdown under `archives/RTFM/`, credit the source archive, keep
licenses clear. Repo software/docs are MIT (`LICENSE`, media-scope note at
the end of that file); media stays with its own terms.
Do not treat another person’s archive folder as yours to rewrite. Commons
operator markers live on the registry, not in their files.
Optional inspiration — never a rule book.

## Out Of Scope Here

Visitor onboarding, admin contact scripts for non-tech users, and control-plane
secrets. Those live in the User Guide, Archive Creation Manual, or private
admin channels — not this handbook.
