# iNi Provenance

Tags: ini, provenance, authenticity, opt-in, community, i-and-i
Source: 0?0 command INI · beta charter

## What iNi is

**iNi** is the inner-circle provenance layer beside uXu.

It is a name, a protocol, and a community boundary — not a company label.
The spelling comes from an “I and I” framing: a shared identity space where
trusted collaborators and archives agree to treat **origin, authorship,
lineage, and custody** as first-class responsibilities.

iNi is the banner under which provenance-aware collaboration around uXu and
public repos lives.

## Relationship to uXu

| Layer | Role |
|-------|------|
| **uXu** | Public archive commons — the collection / invite door |
| **0?0** | Root console inside the commons |
| **iNi** | Opt-in provenance ethic and protocol that shapes how collections are documented and trusted |

uXu does not require iNi. Archives stay independent either way.
Creators who want their uXu archives to carry **explicit authenticity and
origin documentation** may opt into iNi.

```text
uXu  (public collection)
 └── 0?0  (console)
      └── archives…
           └── optional: iNi tag + provenance fields
```

## Optional public notes

Separate public page for iNi practice notes, FAQ, and contact:

**https://soloist.ai/uxu**

On 0?0: open Quick Nav **iNi Provenance**, then the panel link, or type
**`INI SITE`**. Opt-in itself still happens in your archive / on the console —
you do not need that page to practice iNi. The console stays a protocol tool;
the page is not a membership gate.

## The provenance protocol

In archive practice, provenance is the recorded origin, ownership history, and
chain of custody of a work or dataset.

The **iNi provenance protocol** asks creators to verify and fill structured
fields on their archive (in `data.json`), then mark the work with the **iNi**
tag when that documentation is real and maintained.

Typical fields (under `uxu.ini.provenance`):

| Field | Meaning |
|-------|---------|
| `origin` | Where this material / project came from |
| `authors` | Who made or curated what |
| `custody` | Who holds stewardship now |
| `lineage` | How it has changed (forks, transfers, remasters) |
| `conditions` | Share / reuse / access conditions |
| `attestedAt` | When the creator attested these fields |

Opting in (`uxu.ini.optIn: true`) means: you have done this work seriously,
and you accept the community’s expectations around authenticity and transparency.

This is **self-attestation**, not a legal chain-of-custody certificate.

## Inner-circle / organization layer

iNi also names the **inner-circle** boundary for collaborators with deeper
access to projects, databases, and archives who share provenance duty.

Inside iNi, people agree to handle provenance in an explicit, documented way —
a social contract as much as a technical org layer.

## Community as practice

Joining iNi is not a newsletter signup. It means adopting the protocol:

1. Use the **iNi** tag when provenance is filled out  
2. Keep authenticity metadata honest and current  
3. Share norms about how origin, authorship, and custody are described  

The community is defined by **practice**, not membership badges alone.
0?0 is a front door into that idea — Quick Nav **iNi Provenance**
(or type `INI`). Hover tip: *opt-in provenance · I and I*. Optional public
notes: https://soloist.ai/uxu (panel link / `INI SITE`).

## Conceptual pillars

1. **Identity / I and I** — mutual responsibility, not a one-way platform  
2. **Provenance as first-class data** — record and surface it  
3. **Inner-circle governance** — shared duty among collaborators  
4. **Opt-in authenticity** — the tag is optional but meaningful  

## How to opt in (beta)

You do not need the Soloist site to opt in.

**Path for new visitors:** start at the uXu commons
(https://rasvibir.github.io/uXu/) → that opens **0?0** → Quick Nav
**iNi Provenance** (or type `INI`) → follow the guide.

In your archive `data.json`:

```json
"uxu": {
  "ini": {
    "optIn": true,
    "tag": "iNi",
    "provenance": {
      "origin": "…",
      "authors": ["…"],
      "custody": "…",
      "lineage": "…",
      "conditions": "…",
      "attestedAt": "2026-08-12"
    }
  }
}
```

On 0?0: Quick Nav **iNi Provenance** or type **INI**. Registry rows may show an **iNi**
cue when `optIn` is true (honesty badge — not enforcement).

## What iNi is not (beta)

- Not membership theater or a signup badge  
- Not required to publish on uXu  
- Not a company or org brand label  
- Not a legal chain-of-custody certificate  
- Not a claim that uXu owns your archive  

## Contact

Questions about iNi practice or registration: **rasip@chloreform.org**

Optional public notes: **https://soloist.ai/uxu**

uXu software & original docs: **MIT** (`LICENSE`). Provenance fields document
honesty; they do not rewrite media copyright.
