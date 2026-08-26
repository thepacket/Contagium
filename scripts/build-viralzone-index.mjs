// Builds data-src/viralzone-index.json: a ViralZone page id -> title map.
//
// ViralZone (https://viralzone.expasy.org, SIB Swiss Institute of
// Bioinformatics) is CC BY 4.0. It publishes no API, so the family/genus
// factsheets have to be fetched as HTML. Page ids are opaque integers, and the
// only enumeration the site offers is its sitemap — so we take the sitemap,
// fetch each page once, and keep the <title>, which carries the taxon name.
//
// This is deliberately a build-time step, not a runtime proxy: ViralZone is
// reference data that moves on the scale of taxonomy releases, so there is no
// reason to hit it from the browser. Output is cached in data-src/ and only
// re-fetched for ids that are missing.
//
// Polite by construction: low concurrency, a delay between batches, an
// identifying User-Agent, and resumable so an interrupted run does not refetch.
//
// Usage: node scripts/build-viralzone-index.mjs
import fs from 'node:fs'

const SITEMAP = 'data-src/viralzone-sitemap.xml'
const SITEMAP_URL = 'https://viralzone.expasy.org/sitemap.xml'
const OUT = 'data-src/viralzone-index.json'

const CONCURRENCY = 6
const BATCH_DELAY_MS = 250
const UA = 'contagium-catalog-build/0.1 (personal project; one-time index)'

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function loadSitemap() {
  if (!fs.existsSync(SITEMAP)) {
    console.log('fetching sitemap...')
    const res = await fetch(SITEMAP_URL, { headers: { 'User-Agent': UA } })
    if (!res.ok) throw new Error(`sitemap: HTTP ${res.status}`)
    fs.writeFileSync(SITEMAP, await res.text())
  }
  const xml = fs.readFileSync(SITEMAP, 'utf8')
  const ids = new Set()
  for (const m of xml.matchAll(/<loc>https:\/\/viralzone\.expasy\.org\/(\d+)<\/loc>/g)) {
    ids.add(Number(m[1]))
  }
  return [...ids].sort((a, b) => a - b)
}

/** ViralZone titles read "Coronaviridae ~ ViralZone". Keep the taxon part. */
function titleOf(html) {
  const raw = /<title>([\s\S]*?)<\/title>/i.exec(html)?.[1]
  if (!raw) return null
  return raw.replace(/\s*~\s*ViralZone\s*$/i, '').replace(/\s+/g, ' ').trim() || null
}

async function main() {
  const ids = await loadSitemap()
  const index = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, 'utf8')) : {}
  const todo = ids.filter((id) => index[String(id)] === undefined)

  console.log(`sitemap ids: ${ids.length}  cached: ${ids.length - todo.length}  to fetch: ${todo.length}`)
  if (!todo.length) return

  let done = 0
  for (let i = 0; i < todo.length; i += CONCURRENCY) {
    const batch = todo.slice(i, i + CONCURRENCY)
    await Promise.all(
      batch.map(async (id) => {
        try {
          const res = await fetch(`https://viralzone.expasy.org/${id}`, {
            headers: { 'User-Agent': UA },
          })
          // null records a page that exists but has no usable title; false
          // records one we could not read. Both stop us refetching forever.
          index[id] = res.ok ? titleOf(await res.text()) : false
        } catch {
          index[id] = false
        }
      }),
    )
    done += batch.length
    if (done % 120 < CONCURRENCY) {
      fs.writeFileSync(OUT, JSON.stringify(index, null, 0))
      console.log(`  ${done}/${todo.length}`)
    }
    await sleep(BATCH_DELAY_MS)
  }

  fs.writeFileSync(OUT, JSON.stringify(index, null, 0))
  const named = Object.values(index).filter((v) => typeof v === 'string').length
  console.log(`done. ${named} titled pages indexed -> ${OUT}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
