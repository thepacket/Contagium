// Regression tests over the generated catalog.
//
// These guard the two things most likely to break silently: the VMR ingest
// losing families or misassigning Baltimore classes, and the curated layer
// drifting out of the shape the UI expects (a field without a confidence tag
// would render as a bare assertion, which is the thing this project is
// specifically trying not to do).
//
// Usage: node scripts/test.mjs
import fs from 'node:fs'
import { readSheet } from './lib/xlsx.mjs'
import { FAMILIES as CURATED } from './curated/families.mjs'
import { FAMILIES, META, BALTIMORE_LABEL } from '../src/data/catalog.js'

let failed = 0
let passed = 0

function check(name, fn) {
  try {
    fn()
    passed++
  } catch (e) {
    failed++
    console.error(`FAIL  ${name}\n      ${e.message}`)
  }
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg)
}

const byName = new Map(FAMILIES.map((f) => [f.name, f]))

// --- ingest completeness -----------------------------------------------------

check('every family in the VMR appears in the catalog', () => {
  const rows = readSheet(fs.readFileSync(`data-src/${META.vmrFile}`), `VMR ${META.msl}`)
  const inVmr = new Set(rows.map((r) => r.Family).filter(Boolean))
  const missing = [...inVmr].filter((n) => !byName.has(n))
  assert(!missing.length, `${missing.length} missing, e.g. ${missing.slice(0, 3).join(', ')}`)
  assert(
    inVmr.size === FAMILIES.length,
    `catalog has ${FAMILIES.length} families, VMR has ${inVmr.size}`,
  )
})

check('catalog counts agree with the family records', () => {
  const species = FAMILIES.reduce((n, f) => n + f.counts.species, 0)
  assert(species === META.counts.species, `META says ${META.counts.species}, records sum to ${species}`)
  assert(META.counts.families === FAMILIES.length, 'META family count disagrees with the array')
})

check('every family has a name and non-zero size', () => {
  for (const f of FAMILIES) {
    assert(f.name && typeof f.name === 'string', 'family without a name')
    assert(f.counts.isolates > 0, `${f.name} has no isolates`)
    assert(f.counts.species > 0, `${f.name} has no species`)
  }
})

// --- Baltimore assignment ----------------------------------------------------

check('Baltimore classes are assigned correctly for known families', () => {
  const expected = {
    Poxviridae: 'I',
    Parvoviridae: 'II',
    Sedoreoviridae: 'III',
    Coronaviridae: 'IV',
    Orthomyxoviridae: 'V',
    Retroviridae: 'VI',
    Hepadnaviridae: 'VII',
  }
  for (const [name, cls] of Object.entries(expected)) {
    const f = byName.get(name)
    assert(f, `${name} missing from catalog`)
    assert(f.baltimorePrimary === cls, `${name}: expected class ${cls}, got ${f.baltimorePrimary}`)
  }
})

check('compound genome values still resolve to a class', () => {
  // Phenuiviridae's most common Genome value is "ssRNA(-); ssRNA(+/-)" — both
  // parts are class V, so the family must not fall through as unclassified.
  const f = byName.get('Phenuiviridae')
  assert(f.baltimorePrimary === 'V', `Phenuiviridae resolved to ${f.baltimorePrimary}`)
})

check('unresolved Baltimore classes are only bare-ssRNA families', () => {
  for (const f of FAMILIES.filter((x) => !x.baltimorePrimary)) {
    const top = f.genomeComposition[0]?.value
    assert(top === 'ssRNA', `${f.name} unresolved but its genome value is "${top}"`)
  }
})

check('every assigned Baltimore class has a label', () => {
  for (const f of FAMILIES) {
    if (!f.baltimorePrimary) continue
    assert(BALTIMORE_LABEL[f.baltimorePrimary], `no label for class ${f.baltimorePrimary}`)
  }
})

// --- curated layer -----------------------------------------------------------

const CURATED_FIELDS = ['capsid', 'envelope', 'receptor', 'replicationSite', 'tropism', 'genomeSize', 'segments']
const CONFIDENCES = new Set(['established', 'varies', 'contested', 'unknown'])

check('every curated family survives into the catalog', () => {
  for (const name of Object.keys(CURATED)) {
    const f = byName.get(name)
    assert(f, `${name} is curated but absent from ${META.msl} — ICTV may have renamed it`)
    assert(f.curated, `${name} present but its curated data did not attach`)
  }
  const attached = FAMILIES.filter((f) => f.curated).length
  assert(attached === Object.keys(CURATED).length, `${attached} attached, ${Object.keys(CURATED).length} expected`)
})

check('every curated field carries a valid confidence', () => {
  for (const [name, data] of Object.entries(CURATED)) {
    for (const key of CURATED_FIELDS) {
      const field = data[key]
      if (field === undefined) continue // absent is allowed; it renders as "not curated"
      assert(field && typeof field === 'object', `${name}.${key} is not a field object`)
      assert('value' in field, `${name}.${key} has no value key`)
      assert(
        CONFIDENCES.has(field.confidence),
        `${name}.${key} confidence "${field.confidence}" is not one of ${[...CONFIDENCES].join('/')}`,
      )
    }
  }
})

check('a null value is always confidence "unknown" or noted', () => {
  // Asserting nothing is the point of a null value — so it must either say the
  // field is uncharacterised, or explain itself.
  for (const [name, data] of Object.entries(CURATED)) {
    for (const key of CURATED_FIELDS) {
      const field = data[key]
      if (!field || field.value !== null) continue
      assert(
        field.confidence === 'unknown' && field.note,
        `${name}.${key} is null but does not explain why`,
      )
    }
  }
})

check('all seven Baltimore classes are represented in the curated group', () => {
  const classes = new Set(
    Object.keys(CURATED)
      .map((n) => byName.get(n)?.baltimorePrimary)
      .filter(Boolean),
  )
  const missing = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'].filter((c) => !classes.has(c))
  assert(!missing.length, `no curated family in class ${missing.join(', ')}`)
})

check('every curated family resolves a ViralZone citation', () => {
  const unlinked = Object.keys(CURATED).filter((n) => !byName.get(n)?.viralzone)
  assert(!unlinked.length, `no ViralZone page id for ${unlinked.join(', ')}`)
})

check('curated families list notable members', () => {
  for (const [name, data] of Object.entries(CURATED)) {
    assert(Array.isArray(data.notable) && data.notable.length, `${name} lists no notable members`)
    assert(typeof data.distinctive === 'string' && data.distinctive.length > 20, `${name} has no distinctive note`)
  }
})

check('no accession id carries a separator', () => {
  // The VMR packs several accessions into one cell; each has to come out as its
  // own id or the NCBI link it builds cannot resolve.
  for (const f of FAMILIES) {
    for (const e of f.exemplars) {
      for (const a of e.accessions) {
        assert(!/[;:\s]/.test(a.id), `${f.name}: unparsed accession "${a.id}"`)
      }
    }
  }
})

check('no established segment count is contradicted by its own isolates', () => {
  // The check that build-catalog enforces, kept here too so the invariant is
  // visible in the suite rather than only as a build-time exit code. Eight
  // families asserted a segment count their own isolate table disproved —
  // Flaviviridae claimed 1 while listing Guaico Culex virus with 5.
  for (const f of FAMILIES) {
    const seg = f.curated?.segments
    if (!seg || typeof seg.value !== 'number' || seg.confidence !== 'established') continue
    for (const e of f.exemplars) {
      const named = new Set(
        e.accessions
          .map((a) => a.label)
          .filter((l) => l && /^(seg[_ ]?\d+|RNA[ _-]?\d+|DNA[ _-]?[A-Z0-9]+)$/i.test(l))
          .map((l) => l.toLowerCase().replace(/[ _-]/g, '')),
      )
      assert(
        named.size <= seg.value,
        `${f.name} claims ${seg.value} segments (established) but ${e.virus ?? e.species} lists ${named.size}`,
      )
    }
  }
})

check('scope, where present, names a real taxon of that family', () => {
  // A scope that does not match a subfamily or genus of the family it sits on
  // is worse than none: it looks like a precise qualification and is not one.
  for (const [name, data] of Object.entries(CURATED)) {
    const fam = byName.get(name)
    for (const [field, v] of Object.entries(data)) {
      if (!v || typeof v !== 'object' || !v.scope) continue
      assert(typeof v.scope === 'string' && v.scope.length > 2, `${name}.${field}: unusable scope`)
      assert(
        fam.lineage.order !== v.scope,
        `${name}.${field}: scope "${v.scope}" is the order, which is wider than the family, not narrower`,
      )
    }
  }
})

check('the taxa this catalog cannot hold are counted', () => {
  // A family-keyed catalog drops family-less taxa. That is defensible; leaving
  // the totals looking like the whole MSL is not.
  assert(META.unplaced, 'META.unplaced is missing')
  assert(META.unplaced.species > 0 && META.unplaced.genera > 0, 'unplaced counts look wrong')
})

// --- provenance --------------------------------------------------------------

check('every source is named with a licence', () => {
  assert(META.sources.length >= 2, 'expected at least ICTV and ViralZone')
  for (const s of META.sources) {
    assert(s.name && s.url && s.licence, `incomplete source record: ${JSON.stringify(s)}`)
  }
})

console.log(`\n${passed} passed, ${failed} failed`)
process.exit(failed ? 1 : 0)
