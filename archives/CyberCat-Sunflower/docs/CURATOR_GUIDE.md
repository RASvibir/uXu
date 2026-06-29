# Curator Guide

This is for anyone maintaining an archive on uXu — whether it's your own new archive or you've taken on ongoing curation of an existing one.

## Your responsibilities as a curator

- **Accuracy** — dates, venues, and setlists should be sourced from something reliable (official archives, taper communities, ticket stubs, contemporaneous reviews). Note your sources in `notes` where it helps.
- **Legal audio only** — every `archiveOrgId` you add must point to a recording that's legitimately public on Internet Archive.
- **Schema compliance** — your `data.json` must validate against [`data.schema.json`](../../../data.schema.json). Invalid JSON will break the platform UI for your archive specifically.

## Ranking audio sources

List `audioSources` best-first. The player defaults to the first entry in the array for one-click playback, so put your best recommendation there:

```json
"audioSources": [
  { "archiveOrgId": "...", "sourceType": "sbd", "label": "Best available soundboard" },
  { "archiveOrgId": "...", "sourceType": "aud", "label": "Audience recording, for comparison" }
]
```

## Growing your archive

- Aim for richly-documented shows over sheer quantity — a well-sourced show with accurate setlist and notes is worth more than a bare date-venue stub.
- Use `notes` to add the human context that makes an archive worth browsing: why a show matters, what's unusual about it, what tape lineage the recording comes from.
- If your archive accepts community contributions the way uXu itself does, document that in your own archive's README — you set the rules for your corner of the repo.

## A personal touch

The `accentGlyph` field on your archive lets you add one small, unobtrusive symbol next to your curator credit — a quiet signature, not a theme. Keep it subtle; one glyph, not a redesign.

## Featured status

Featured placement on the uXu front page is set by the platform maintainer via the `featured` field, not something curators toggle themselves. If you'd like your archive considered, mention it in your PR — but it's never a requirement to participate in uXu.
