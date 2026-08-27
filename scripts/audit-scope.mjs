// Lists curated claims that may be narrower than the family they sit on.
//
// This exists because the first scope audit was done by filtering on subfamily
// count, which structurally could not see Caliciviridae — 11 genera, no
// subfamilies, and a family-wide "intestinal epithelium" that was true only of
// the enteric genera. An external reviewer found it. A repeatable check beats
// a one-off sweep, so the sweep is a script.
//
// It cannot decide correctness: many families really are uniform, and
// Papillomaviridae is epithelial across all 53 genera. Treat the output as a
// reading list, worst first, and check each against the factsheet.
//
// Usage: npm run audit:scope
import { FAMILIES } from '../src/data/catalog.js'

const RISKY = ['tropism', 'receptor']

const rows = []
for (const f of FAMILIES) {
  if (!f.curated) continue
  for (const field of RISKY) {
    const v = f.curated[field]
    if (!v || v.confidence !== 'established' || v.scope) continue
    rows.push({
      family: f.name,
      field,
      genera: f.counts.genera,
      hosts: f.hosts.length,
      bare: !v.note,
      value: String(Array.isArray(v.value) ? v.value.join(', ') : v.value).slice(0, 44),
    })
  }
}

// Genus count is the proxy for how much a family-wide claim is covering, and a
// claim with no note at all has nothing qualifying it.
rows.sort((a, b) => b.genera - a.genera || (b.bare ? 1 : 0) - (a.bare ? 1 : 0))

console.log(`${rows.length} established tropism/receptor claims carry no scope.\n`)
console.log('  family              field     genera hosts note   value')
for (const r of rows) {
  console.log(
    `  ${r.family.padEnd(20)}${r.field.padEnd(10)}${String(r.genera).padEnd(7)}${String(r.hosts).padEnd(6)}${(r.bare ? 'BARE' : 'note').padEnd(7)}${r.value}`,
  )
}
console.log('\nNot all are wrong. Check each against its factsheet before adding a scope.')

// --- the famous-member pattern -----------------------------------------------
//
// A second, weaker signal, and the one that would have caught Matonaviridae:
// a small family where the curated text names far fewer viruses than the family
// holds is often a family whose entry was written when the famous member was
// the only member. Matonaviridae had three species and named one, with rubella
// standing in for a family that had since acquired the neurotropic rustrela
// virus. ViralZone's factsheet predated both new species, so no check against
// the factsheet could have found it either.
//
// Weak because "names fewer viruses" is usually just editorial brevity. Worth
// scanning when a release adds species to a family that used to be monotypic.
const famous = []
for (const f of FAMILIES) {
  if (!f.curated || f.counts.species > 12) continue
  const named = (f.curated.notable ?? []).length
  if (named >= f.counts.species) continue
  const unscoped = ['tropism', 'receptor', 'capsid'].filter(
    (k) => f.curated[k]?.confidence === 'established' && !f.curated[k].scope,
  )
  if (unscoped.length) famous.push({ family: f.name, species: f.counts.species, named, fields: unscoped.join(', ') })
}

console.log(`\n${famous.length} small families name fewer viruses than they hold and still assert unscoped values.\n`)
console.log('  family              species named  unscoped established')
for (const r of famous) {
  console.log(`  ${r.family.padEnd(20)}${String(r.species).padEnd(8)}${String(r.named).padEnd(6)}${r.fields}`)
}
console.log('\nCapsid is usually conserved across a family and is rarely the problem here;')
console.log('tropism and receptor are. Check any family a recent release grew.')
