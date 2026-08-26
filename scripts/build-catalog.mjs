// Builds src/data/catalog.js from the ICTV Virus Metadata Resource.
//
// Two layers come out of this, and the distinction matters:
//
//   skeleton — every family in the current Master Species List, with taxonomy,
//              genome composition, host source and counts. Entirely derived
//              from the VMR spreadsheet; nothing here is hand-typed, so it is
//              complete and it is as current as the release we ingested.
//
//   depth    — capsid, envelope, receptor, replication site and tropism for the
//              curated first group in scripts/curated/families.mjs. The VMR does
//              not carry these fields and no open source publishes them in bulk.
//
// A family with no depth layer is not an error and is not hidden: "not curated"
// and "not characterised by the field" are both real states, and the UI shows
// which one applies.
//
// Sources:
//   ICTV VMR      — https://ictv.global/vmr        CC BY 4.0
//   ViralZone     — https://viralzone.expasy.org   CC BY 4.0 (page ids only)
//
// Usage: node scripts/build-catalog.mjs
import fs from 'node:fs'
import { readSheet } from './lib/xlsx.mjs'
import { FAMILIES } from './curated/families.mjs'

const VMR = 'data-src/VMR_MSL41.v1.20260729.xlsx'
const SHEET = 'VMR MSL41'
const MSL = 'MSL41'
const VMR_FILE = VMR.split('/').pop()
const VZ_INDEX = 'data-src/viralzone-index.json'
const OUT = 'src/data/catalog.js'

// The VMR's Genome column is a controlled vocabulary, so Baltimore class is
// derivable rather than something to type out 427 times.
const BALTIMORE = {
  dsDNA: 'I',
  ssDNA: 'II',
  'ssDNA(+)': 'II',
  'ssDNA(-)': 'II',
  'ssDNA(+/-)': 'II',
  dsRNA: 'III',
  'ssRNA(+)': 'IV',
  'ssRNA(-)': 'V',
  'ssRNA(+/-)': 'V', // ambisense; conventionally grouped with class V
  'ssRNA-RT': 'VI',
  'dsDNA-RT': 'VII',
  // bare "ssRNA" states the strandedness without the sense, which is not
  // enough to assign a class. Left unresolved on purpose.
}

/**
 * Map one Genome value to a Baltimore class. Some families carry compound
 * values ("ssRNA(-); ssRNA(+/-)" for the ambisense bunyavirals), which resolve
 * to a single class only when every part agrees.
 */
function baltimoreOf(genome) {
  if (!genome) return null
  if (BALTIMORE[genome]) return BALTIMORE[genome]
  const parts = genome.split(';').map((p) => p.trim()).filter(Boolean)
  if (parts.length < 2) return null
  const classes = new Set(parts.map((p) => BALTIMORE[p]))
  return classes.size === 1 && !classes.has(undefined) ? [...classes][0] : null
}

const BALTIMORE_LABEL = {
  I: 'dsDNA',
  II: 'ssDNA',
  III: 'dsRNA',
  IV: '+ssRNA',
  V: '−ssRNA',
  VI: 'ssRNA-RT',
  VII: 'dsDNA-RT',
}

/** Count occurrences, returned most-frequent first. */
function tally(counter) {
  return [...counter.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([value, count]) => ({ value, count }))
}

function bump(map, key) {
  if (key) map.set(key, (map.get(key) ?? 0) + 1)
}

function main() {
  if (!fs.existsSync(VMR)) {
    console.error(`missing ${VMR}\n  curl -sL -o ${VMR} https://ictv.global/vmr/current`)
    process.exit(1)
  }

  const rows = readSheet(fs.readFileSync(VMR), SHEET)
  console.log(`VMR rows: ${rows.length}`)

  const viralzone = new Map()
  if (fs.existsSync(VZ_INDEX)) {
    const index = JSON.parse(fs.readFileSync(VZ_INDEX, 'utf8'))
    // Lowest id wins: ViralZone has duplicate titles for some taxa, and the
    // lower id is consistently the canonical factsheet.
    for (const [id, title] of Object.entries(index)) {
      if (typeof title !== 'string') continue
      const n = Number(id)
      if (!viralzone.has(title) || n < viralzone.get(title)) viralzone.set(title, n)
    }
  } else {
    console.warn(`no ${VZ_INDEX} — citations will lack ViralZone links`)
  }

  const families = new Map()
  let unclassified = 0

  for (const row of rows) {
    const name = row.Family
    if (!name) {
      unclassified++
      continue
    }
    let f = families.get(name)
    if (!f) {
      f = {
        name,
        lineage: {
          realm: row.Realm || null,
          kingdom: row.Kingdom || null,
          phylum: row.Phylum || null,
          class: row.Class || null,
          order: row.Order || null,
        },
        genome: new Map(),
        hosts: new Map(),
        genera: new Set(),
        species: new Set(),
        subfamilies: new Set(),
        isolates: 0,
        exemplars: [],
      }
      families.set(name, f)
    }

    f.isolates++
    bump(f.genome, row.Genome)
    // Host source carries provenance suffixes like "soil (S)" for metagenomic
    // records. Strip them; the distinction belongs in a column of its own.
    bump(f.hosts, row['Host source'].replace(/\s*\(S\)\s*$/, '').trim())
    if (row.Genus) f.genera.add(row.Genus)
    if (row.Species) f.species.add(row.Species)
    if (row.Subfamily) f.subfamilies.add(row.Subfamily)
    // "E" marks the exemplar isolate ICTV designates for the species.
    if (row['Exemplar or additional isolate'] === 'E' && row.Species && f.exemplars.length < 8) {
      f.exemplars.push({
        species: row.Species,
        virus: row['Virus name(s)'] || null,
        abbreviation: row['Virus name abbreviation(s)'] || null,
        accession: row['Virus GENBANK accession'] || null,
      })
    }
  }

  const out = []
  for (const f of families.values()) {
    const genome = tally(f.genome)
    const classes = [...new Set(genome.map((g) => baltimoreOf(g.value)).filter(Boolean))]
    const curated = FAMILIES[f.name] ?? null

    out.push({
      name: f.name,
      lineage: f.lineage,
      baltimore: classes,
      baltimorePrimary: baltimoreOf(genome[0]?.value),
      genomeComposition: genome,
      hosts: tally(f.hosts),
      counts: {
        subfamilies: f.subfamilies.size,
        genera: f.genera.size,
        species: f.species.size,
        isolates: f.isolates,
      },
      exemplars: f.exemplars,
      viralzone: viralzone.get(f.name) ?? null,
      curated,
    })
  }
  out.sort((a, b) => a.name.localeCompare(b.name))

  // Fail loudly if a curated family name no longer exists in the release. A
  // stale family name in a reference for scientists is the one unrecoverable
  // error, and taxonomy churn makes it a live risk at every re-ingest.
  const stale = Object.keys(FAMILIES).filter((n) => !families.has(n))
  if (stale.length) {
    console.error(`\ncurated families absent from ${MSL}: ${stale.join(', ')}`)
    console.error('ICTV has renamed or abolished them — update scripts/curated/families.mjs')
    process.exit(1)
  }

  const meta = {
    msl: MSL,
    vmrFile: VMR_FILE,
    generated: new Date().toISOString().slice(0, 10),
    counts: {
      families: out.length,
      genera: out.reduce((n, f) => n + f.counts.genera, 0),
      species: out.reduce((n, f) => n + f.counts.species, 0),
      isolates: rows.length,
      curated: Object.keys(FAMILIES).length,
    },
    sources: [
      { name: 'ICTV Virus Metadata Resource', url: 'https://ictv.global/vmr', licence: 'CC BY 4.0' },
      { name: 'ViralZone, SIB Swiss Institute of Bioinformatics', url: 'https://viralzone.expasy.org', licence: 'CC BY 4.0' },
    ],
  }

  const banner = `// Generated by scripts/build-catalog.mjs — do not edit.
// Source: ICTV ${MSL} (${VMR_FILE}), CC BY 4.0, https://ictv.global/vmr
// Mechanism fields: ViralZone, SIB Swiss Institute of Bioinformatics, CC BY 4.0.
`
  fs.mkdirSync('src/data', { recursive: true })
  fs.writeFileSync(
    OUT,
    `${banner}\nexport const META = ${JSON.stringify(meta, null, 2)}\n\nexport const BALTIMORE_LABEL = ${JSON.stringify(BALTIMORE_LABEL, null, 2)}\n\nexport const FAMILIES = ${JSON.stringify(out)}\n`,
  )

  const noClass = out.filter((f) => !f.baltimorePrimary).length
  console.log(`families: ${meta.counts.families}  genera: ${meta.counts.genera}  species: ${meta.counts.species}`)
  console.log(`curated: ${meta.counts.curated}   viralzone links: ${out.filter((f) => f.viralzone).length}`)
  console.log(`rows without a family: ${unclassified}   families without a Baltimore class: ${noClass}`)
  console.log(`-> ${OUT} (${(fs.statSync(OUT).size / 1024).toFixed(0)} kB)`)
}

main()
