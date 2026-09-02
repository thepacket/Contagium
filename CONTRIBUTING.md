# Contributing

**Pull requests are welcome.** Bear in mind that the curated layer is an
editorial position rather than a collection of patches — a mechanism value
carries a confidence tag, a taxonomic scope and sometimes a citation, and those
judgments have to stay consistent across all 40 families to mean anything. So a
pull request that changes a curated value needs the same evidence a good issue
carries (below), and will be reviewed against the neighbouring families before
it is merged. Fixes to the build, the application or the tests are simpler.

**Corrections are just as welcome as issues.** This is a scientific reference,
so an error in it is a real defect and reporting one is a contribution. The
most useful reports, roughly in order:

1. **A value contradicted by its own source.** The factsheet says one thing and
   the row says another.
2. **A value that is right but over-scoped** — true of the well-studied genus
   and asserted across the family. `npm run audit:scope` lists the current
   suspects; several were found this way.
3. **A source that has fallen behind the literature.** These are the ones no
   check here can catch. Astroviridae, Matonaviridae and Bornaviridae were all
   found by reading rather than by the build.
4. **Taxonomy drift** after an ICTV release renames or moves something.

A report is most actionable with the family name, the field, and what the
evidence actually says. A DOI or PMID is ideal; the repository has a `citation`
field for exactly this and rows that depart from the family factsheet are
expected to carry one.

## Things that are known, not bugs

- **40 of 427 families have mechanism data.** The rest are taxonomy only. This
  is a curation budget, not an oversight.
- **Most rows have no per-cell citation.** They rest on the family factsheet,
  which the family page links. Building that out per cell is the outstanding
  work and is acknowledged on the About page.
- **2,611 species are absent** because ICTV places them in no family and this
  catalog is family-keyed. See "What the totals leave out" in the README.
- **No structured export or versioned release.** Not planned at present.
