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
- **Read a family** — a virion schematic, then lineage, mechanism with
  per-field confidence, genome and host composition, and every isolate the
  release carries with its GenBank accession, exemplar and additional alike.
- **Search by what you actually know** — family, order, realm, species, virus
  name, abbreviation or accession. `SARS-CoV-2` and `MN908947` both find
  Coronaviridae.
- **Compare two or three side by side.** This is the view that is hard to
  assemble by hand, and the reason the project exists in this shape.

## The virion schematics

Both the family page and the compare view open with a schematic drawn from the
curated fields — capsid shape, envelope, segment count, particle size — rather
than from shipped artwork. Nothing is fetched, nothing is licensed, and the
figure inherits the theme and the replication-strategy hue.

A picture has no room for a confidence tag, which is the discipline the rest of
the app runs on. So the drawing shows only values marked `established` and the
caption carries every qualifier. Nine of the 40 curated families draw nothing at
all — Retroviridae because its capsid is `varies`, and any single core shape
would assert what the table is careful not to.

Shapes stay categorical for the same reason. A T=1 and a T=217 icosahedron are
not distinguishable at this size, so the drawing says "icosahedral" and the
T-number is left to the cell that can state it exactly.

In the compare view the schematics are drawn to scale against each other when
every family in view has an established size and the spread is under 6:1; past
that the smallest particle collapses to a few pixels, so the row falls back to
uniform size. A family page has nothing to scale against and says "not to
scale" outright. The label is always present, because an unlabelled figure gets
read as proportional whether it is or not.

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

## What the totals leave out

Contagium reports 427 families, 3,265 genera and 14,943 species. MSL41 itself
contains 4,149 genera and 17,554 species. The difference is not a partial
ingest: the VMR carries all of them, and **2,611 species across 884 genera sit
in no family at all** — overwhelmingly *Caudoviricetes* bacteriophage left
unplaced after the morphology-based families were dissolved. A family-keyed
catalog has nowhere to file them.

That is a limitation of the shape of this reference rather than of its source,
and the About page and the family list both say so. Anyone reconciling these
numbers against the published Master Species List should expect the gap.

## Consistency the build enforces

Two invariants fail `build:catalog` rather than being trusted:

- **A curated family name absent from the release.** Taxonomy churn makes a
  stale name a live risk, and a wrong family name in a scientific reference is
  the one unrecoverable error.
- **An `established` segment count contradicted by the family's own isolates.**
  Flaviviridae asserted "1 segment — established" on a page that also listed
  Guaico Culex virus with five segment accessions. Eight families were doing
  this. An internally falsified claim is worse than a missing one in a
  reference whose whole discipline is qualifying values, and it is mechanically
  detectable — so it is now checked. `varies` is exempt, since it already
  declares the family is not uniform.

Both are mirrored in `npm test` so the invariant is visible in the suite and
not only as a build exit code.

## What the confidence tags are, and are not

`established` / `varies` / `contested` / `unknown` are editorial judgments made
while reading the family factsheet and the literature around it. They are not
evidence codes: no vote count or study threshold sits behind them, and a second
curator would not reproduce every one. The About page says this in the
interface rather than only here.

The related limit is citation granularity. A curated value links to the
ViralZone factsheet for its **family**, which is not the same as identifying
the paper behind that particular receptor or measurement. Per-cell
primary-literature citations remain the outstanding work, and until they exist
this is not a source to cite in a publication.

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
