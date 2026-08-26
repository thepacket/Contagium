# Contagium — a comparative virus family reference

Every virus family in the current ICTV taxonomy, with curated replication
mechanism, capsid, envelope and receptor data for a first group of 25 — cited,
and explicit about what is not known.

The name is Beijerinck's: *contagium vivum fluidum*, the term he coined in 1898
for something infectious that passed through a filter no bacterium could. It was
a name for a thing nobody had seen.

**Contagium is a reference, not a diagnostic tool.** It carries no clinical
guidance, and where the literature disagrees it says so rather than picking a
winner. For contested values — the flavivirus receptor, the human norovirus
receptor — the honest move is to read the papers, and the citation is there so
you can.

## Run

```
npm install
npm run dev
```

To regenerate the catalog from the ICTV Virus Metadata Resource, and to run the
tests:

```
npm run build:catalog
npm test
```

`npm run build` produces the static bundle. Deployment — a Vite build served by
nginx on fly.io — is in [DEPLOY.md](DEPLOY.md).

## Two layers, kept visibly separate

**Skeleton — every family.** All 427 families in ICTV MSL41, with taxonomy,
genome composition, host source and counts, derived directly from the VMR
spreadsheet. Nothing in it is hand-typed, so it is complete and as current as
the release ingested.

**Depth — 25 families.** Capsid symmetry, envelope, entry receptor, replication
site and tropism. No open source publishes these in bulk; they are assembled by
hand from ViralZone and the literature. The first group was chosen to cover all
seven Baltimore classes, so a comparison has real mechanistic contrast rather
than seven variations on one theme.

A family with no depth layer is not hidden and is not an error. The interface
distinguishes two different absences:

- **not curated** — a gap in this reference
- **not characterised** — the field itself has not established the answer

The second is information a working scientist wants, which is why receptor rows
carry a confidence tag (`established` / `varies` / `contested` / `unknown`)
rather than a single confident value.

## What it does

- **Browse and filter** all 427 families by Baltimore class, host source, or text.
- **Read a family** — lineage, mechanism with per-field confidence, genome and
  host composition, and the ICTV exemplar isolates with their GenBank accessions.
- **Compare two or three side by side.** This is the view that is hard to
  assemble by hand, and the reason the project exists in this shape.

## Architecture

No runtime backend, and no network requests at all: the catalog is bundled at
build time and the app is static files.

```
build time (npm run build:catalog)      runtime (browser)
├─ ICTV VMR xlsx  → src/data/catalog.js └─ nothing. connect-src 'none'.
└─ ViralZone page ids (cached index)
```

This is a deliberate departure from the proxy architecture used elsewhere in
this portfolio. Virus reference data moves on the scale of taxonomy releases,
not minutes, so there is no reason to reach for it from the browser — and
ViralZone, the one source that sends no CORS headers, becomes a build-time
ingest rather than something to proxy. `npm run check:csp` enforces the
consequence.

`scripts/lib/xlsx.mjs` is a small dependency-free xlsx reader. It exists so the
build pipeline does not carry a spreadsheet library for the sake of one file
read once a year.

## Taxonomy churn is a live risk

ICTV renames and splits families continuously. Recent changes affecting this
catalog: Herpesviridae → **Orthoherpesviridae**, Reoviridae split into
**Sedoreoviridae** and Spinareoviridae, rubella moved to **Matonaviridae**, and
the old Bunyaviridae split into **Hantaviridae**, **Nairoviridae**,
**Phenuiviridae** and Peribunyaviridae.

`build:catalog` **fails the build** if a curated family name no longer appears
in the release. A wrong family name in a reference for scientists is the one
unrecoverable error, so it is checked rather than trusted.

## Deliberately out of scope for now

**Bacteriophage.** ICTV dissolved the morphology-based families (Siphoviridae,
Myoviridae and the rest) and the replacement taxonomy is still settling. That
instability does not belong in a first build. Plant and insect viruses are
absent from the depth layer for the same budget reason rather than any
principled one — Virgaviridae is the obvious first addition.

## Sources and licences

| Source | Licence | Used for |
|---|---|---|
| [ICTV Virus Metadata Resource](https://ictv.global/vmr) | CC BY 4.0 | taxonomy, genome composition, host source, exemplars |
| [ViralZone](https://viralzone.expasy.org) (SIB Swiss Institute of Bioinformatics) | CC BY 4.0 | mechanism fields, factsheet citations |
| [NCBI Nucleotide](https://www.ncbi.nlm.nih.gov/nuccore/) | US Government work | accession links |

Both primary sources are CC BY 4.0, so attribution is a licence obligation as
much as a scientific one. It is carried per record rather than as a footnote —
which is also why the citation field was required from the first migration
rather than retrofitted.
