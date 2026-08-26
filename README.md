# Contagium — a comparative virus family reference

Every virus family in the current ICTV taxonomy, with curated replication
mechanism, capsid, envelope and receptor data for a group of 40 — cited, and
explicit about what is not known.

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

**Depth — 40 families.** Capsid symmetry, envelope, entry receptor, replication
site and tropism. No open source publishes these in bulk; they are assembled by
hand from ViralZone and the literature. The first group of 25 was chosen to
cover all seven Baltimore classes, so a comparison has real mechanistic contrast
rather than seven variations on one theme. The next 15 were the families that
already had a ViralZone factsheet at family rank — the only tranche where the
source supports a family-level claim without inference.

A family with no depth layer is not hidden and is not an error. The interface
distinguishes two different absences:

- **not curated** — a gap in this reference
- **not characterised** — the field itself has not established the answer

The second is information a working scientist wants, which is why receptor rows
carry a confidence tag (`established` / `varies` / `contested` / `unknown`)
rather than a single confident value.

## What it does

- **Browse and filter** all 427 families by Baltimore class, host source, or text.
  Colour runs on replication strategy — DNA, RNA, reverse-transcribing — rather
  than on Baltimore class. Seven hues cannot be told apart when any two families
  can end up adjacent in the grid; three can, and three is also the real
  structure the classes sit on. The class itself is always printed beside the
  colour, so nothing is encoded by hue alone.
- **Read a family** — lineage, mechanism with per-field confidence, genome and
  host composition, and every isolate the release carries with its GenBank
  accession, exemplar and additional alike.
- **Search by what you actually know** — family, order, realm, species, virus
  name, abbreviation or accession. `SARS-CoV-2` and `MN908947` both find
  Coronaviridae.
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

**The catalog is complete, and that is what it costs.** All 16,674 isolate rows
ship in the bundle — 423 kB gzipped, up from 96 kB when the build kept only the
first eight exemplars per family. That cap was dropping 85.8% of the release and
cutting by spreadsheet order, so Coronaviridae listed eight *Alphacoronavirus*
bat isolates and no SARS at all. A reference that quietly withholds five sixths
of its source is worse than a large one, so the bundle is the price. If it ever
needs to come down, the fix is splitting the isolate tables out of the main
chunk and loading them per family — not reinstating a cap.

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
instability does not belong in a first build.

Plant, insect and fungal viruses are no longer wholly absent: the second tranche
brought in Tombusviridae, Nodaviridae, Metaviridae and Genomoviridae, because
the selection rule was "has a family-rank factsheet" rather than "infects a
vertebrate". Coverage there is still incidental rather than deliberate, and
Virgaviridae remains the obvious next plant addition.

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
