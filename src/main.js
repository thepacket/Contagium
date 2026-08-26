// Contagium — comparative virus family reference.
//
// Two data layers, kept visibly distinct throughout the UI: a complete skeleton
// derived from the ICTV VMR, and a curated depth layer for a first group of
// families. Absence is rendered rather than hidden — "we have not curated this"
// and "the field has not characterised this" are different statements and the
// interface says which one it means.

import './style.css'
import { FAMILIES, META, BALTIMORE_LABEL } from './data/catalog.js'

const BY_NAME = new Map(FAMILIES.map((f) => [f.name, f]))
const CURATED = FAMILIES.filter((f) => f.curated)
const MAX_COMPARE = 3

// --- theme -------------------------------------------------------------------
//
// Three states, and "system" is the default rather than a fourth option: no
// data-theme attribute means the CSS falls through to prefers-color-scheme.
// An explicit choice stamps the attribute, which flips `color-scheme` and with
// it every light-dark() pair in the stylesheet.
//
// Applied from here rather than from an inline <script> in index.html, which is
// the usual way to avoid a flash of the wrong theme: the CSP is script-src
// 'self' with no nonce, so an inline script would not run in production and
// check-csp.mjs fails the build for one. The trade is a possible flicker on
// first paint for a reader whose stored choice contradicts their system, which
// is the cheaper of the two costs.

const THEMES = ['system', 'light', 'dark']
const THEME_KEY = 'contagium:theme'
const THEME_LABEL = { system: 'Auto', light: 'Light', dark: 'Dark' }

/** localStorage throws in some privacy modes; a themeless page is fine. */
function storedTheme() {
  try {
    const v = localStorage.getItem(THEME_KEY)
    return THEMES.includes(v) ? v : 'system'
  } catch {
    return 'system'
  }
}

function applyTheme(theme) {
  if (theme === 'system') document.documentElement.removeAttribute('data-theme')
  else document.documentElement.setAttribute('data-theme', theme)

  const btn = document.getElementById('theme-toggle')
  if (!btn) return
  const next = THEMES[(THEMES.indexOf(theme) + 1) % THEMES.length]
  btn.textContent = THEME_LABEL[theme]
  btn.setAttribute(
    'aria-label',
    `Colour theme: ${THEME_LABEL[theme]}${theme === 'system' ? ' (following your system setting)' : ''}. ` +
      `Activate to switch to ${THEME_LABEL[next]}.`,
  )
  btn.title = btn.getAttribute('aria-label')
}

function initTheme() {
  let theme = storedTheme()
  applyTheme(theme)
  document.getElementById('theme-toggle')?.addEventListener('click', () => {
    theme = THEMES[(THEMES.indexOf(theme) + 1) % THEMES.length]
    applyTheme(theme)
    try {
      if (theme === 'system') localStorage.removeItem(THEME_KEY)
      else localStorage.setItem(THEME_KEY, theme)
    } catch {
      // Choice applies for this page view and is simply not remembered.
    }
  })
}

// --- tiny DOM helper ---------------------------------------------------------

/** el('div.card', {href}, child, child…) — strings become text nodes. */
function el(spec, props, ...children) {
  const [tag, ...classes] = spec.split('.')
  const node = document.createElement(tag || 'div')
  if (classes.length) node.className = classes.join(' ')
  if (props && (props.nodeType || typeof props === 'string' || Array.isArray(props))) {
    children.unshift(props)
  } else if (props) {
    for (const [k, v] of Object.entries(props)) {
      if (v === null || v === undefined || v === false) continue
      if (k === 'class') node.className = [node.className, v].filter(Boolean).join(' ')
      else if (k.startsWith('on')) node.addEventListener(k.slice(2).toLowerCase(), v)
      else node.setAttribute(k, v === true ? '' : String(v))
    }
  }
  const add = (c) => {
    if (c === null || c === undefined || c === false) return
    if (Array.isArray(c)) c.forEach(add)
    else node.append(c.nodeType ? c : document.createTextNode(String(c)))
  }
  children.forEach(add)
  return node
}

const plural = (n, one, many = one + 's') => `${n.toLocaleString()} ${n === 1 ? one : many}`

// --- shared bits -------------------------------------------------------------

// Colour runs on replication strategy rather than on Baltimore class. Seven
// hues cannot be told apart reliably when any two of them can end up adjacent
// in the grid, and three can; the three are also the real structure — classes
// I–II copy DNA, III–V copy RNA, VI–VII reverse-transcribe. The class stays
// legible because the numeral and the label are always printed beside the
// colour, so nothing here is encoded by hue alone.
const STRATEGY = {
  I: 'dna', II: 'dna',
  III: 'rna', IV: 'rna', V: 'rna',
  VI: 'rt', VII: 'rt',
}

const STRATEGY_LEGEND = [
  ['dna', 'DNA', 'I–II'],
  ['rna', 'RNA', 'III–V'],
  ['rt', 'reverse-transcribing', 'VI–VII'],
]

/** The `bc-*` class carries the strategy hue; absent when the class is unresolved. */
const strategyClass = (f) => (f.baltimorePrimary ? `bc-${STRATEGY[f.baltimorePrimary]}` : null)

function baltimorePill(f) {
  if (!f.baltimorePrimary) return el('span.pill', { title: 'genome composition does not determine a Baltimore class' }, '—')
  const label = BALTIMORE_LABEL[f.baltimorePrimary]
  return el(
    'span.pill.bc',
    {
      class: strategyClass(f),
      title: `Baltimore class ${f.baltimorePrimary} — ${label}`,
    },
    `${f.baltimorePrimary} · ${label}`,
  )
}

/** Names the three hues, so the colour is readable without being guessed at. */
function strategyLegend() {
  return el(
    'div.legend',
    el('span.legend-label', 'Replication strategy'),
    ...STRATEGY_LEGEND.map(([key, label, classes]) =>
      el('span.legend-item', { class: `bc-${key}` }, el('i', { 'aria-hidden': true }), label, el('span.cls', classes)),
    ),
  )
}

function confidenceTag(confidence) {
  return el('span.conf', { class: `conf-${confidence}` }, confidence)
}

/** Render one curated field, or an explicit absence. */
function fieldValue(field) {
  if (!field) return el('span.absent', 'not curated')

  const { value, confidence, note } = field
  const wrap = el('div')

  if (value === null || value === undefined) {
    wrap.append(el('span.absent', 'not characterised'), confidenceTag(confidence ?? 'unknown'))
  } else if (Array.isArray(value)) {
    const list = el('ul.val-list')
    value.forEach((v) => list.append(el('li', v)))
    wrap.append(list, confidenceTag(confidence))
  } else if (typeof value === 'boolean') {
    wrap.append(document.createTextNode(value ? 'enveloped' : 'non-enveloped'), confidenceTag(confidence))
  } else {
    wrap.append(document.createTextNode(String(value)), confidenceTag(confidence))
  }

  if (note) wrap.append(el('span.note', note))
  return wrap
}

function viralzoneLink(f) {
  if (!f.viralzone) return null
  return el('a', { href: `https://viralzone.expasy.org/${f.viralzone}`, target: '_blank', rel: 'noopener' }, 'ViralZone factsheet')
}

// --- view: family list -------------------------------------------------------

const listState = { q: '', bc: '', host: '', curatedOnly: false }

function viewList() {
  const root = el('div')
  root.append(
    el('h1', 'Virus families'),
    el(
      'p.lede',
      `Every family in ICTV ${META.msl} — ${plural(META.counts.families, 'family', 'families')}, ` +
        `${plural(META.counts.genera, 'genus', 'genera')}, ${plural(META.counts.species, 'species', 'species')}. ` +
        `${META.counts.curated} carry curated mechanism data; the rest show taxonomy and genome composition only.`,
    ),
  )

  const hosts = [...new Set(FAMILIES.flatMap((f) => f.hosts.map((h) => h.value)).filter(Boolean))].sort()

  const search = el('input', {
    type: 'search',
    placeholder: 'Search families, viruses, accessions…',
    value: listState.q,
    'aria-label': 'Search families',
  })
  const bcSel = el(
    'select',
    { 'aria-label': 'Baltimore class' },
    el('option', { value: '' }, 'All Baltimore classes'),
    ...['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'].map((c) =>
      el('option', { value: c, selected: listState.bc === c }, `${c} — ${BALTIMORE_LABEL[c]}`),
    ),
  )
  const hostSel = el(
    'select',
    { 'aria-label': 'Host source' },
    el('option', { value: '' }, 'All hosts'),
    ...hosts.map((h) => el('option', { value: h, selected: listState.host === h }, h)),
  )
  const curatedBox = el('input', { type: 'checkbox', checked: listState.curatedOnly })
  const count = el('span.count')
  const grid = el('div.grid')

  function apply() {
    listState.q = search.value.trim().toLowerCase()
    listState.bc = bcSel.value
    listState.host = hostSel.value
    listState.curatedOnly = curatedBox.checked

    const q = listState.q
    const shown = FAMILIES.filter((f) => {
      if (listState.curatedOnly && !f.curated) return false
      if (listState.bc && f.baltimorePrimary !== listState.bc) return false
      if (listState.host && !f.hosts.some((h) => h.value === listState.host)) return false
      if (!q) return true
      if (f.name.toLowerCase().includes(q)) return true
      if (f.lineage.order?.toLowerCase().includes(q)) return true
      if (f.lineage.realm?.toLowerCase().includes(q)) return true
      // Abbreviation and accession are searched too, because they are what a
      // reader actually types. "SARS-CoV-2" is an abbreviation and appears in
      // no species or virus name — searching those two alone returned nothing
      // for the best-known virus in the catalog.
      if (
        f.exemplars.some((e) =>
          `${e.species} ${e.virus ?? ''} ${e.abbreviation ?? ''} ${e.accession ?? ''}`.toLowerCase().includes(q),
        )
      ) {
        return true
      }
      return false
    })

    count.textContent = `${shown.length} of ${FAMILIES.length}`
    grid.replaceChildren(
      ...shown.map((f) =>
        el(
          'div.card',
          { class: [strategyClass(f), f.curated ? 'is-curated' : null].filter(Boolean).join(' ') || null },
          el(
            'div.card-head',
            el('a.card-title', { href: `#/family/${encodeURIComponent(f.name)}` }, f.name),
            f.curated ? el('span.pill', { title: 'curated mechanism data available' }, 'curated') : null,
          ),
          el('div.card-meta', [f.lineage.order, f.lineage.realm].filter(Boolean).join(' · ') || 'unassigned lineage'),
          el('div.card-meta', `${plural(f.counts.genera, 'genus', 'genera')}, ${plural(f.counts.species, 'species', 'species')}`),
          el(
            'div.card-foot',
            baltimorePill(f),
            f.hosts[0] ? el('span.pill', f.hosts[0].value) : null,
          ),
        ),
      ),
    )
    if (!shown.length) grid.replaceChildren(el('p.absent', 'No families match those filters.'))
  }

  search.addEventListener('input', apply)
  bcSel.addEventListener('change', apply)
  hostSel.addEventListener('change', apply)
  curatedBox.addEventListener('change', apply)

  root.append(
    el('div.controls', search, bcSel, hostSel, el('label.check', curatedBox, 'Curated only'), count),
    strategyLegend(),
    grid,
  )
  apply()
  return root
}

// --- view: family detail -----------------------------------------------------

const FIELDS = [
  ['capsid', 'Capsid'],
  ['envelope', 'Envelope'],
  ['receptor', 'Entry receptor'],
  ['replicationSite', 'Replication site'],
  ['tropism', 'Tropism'],
  ['genomeSize', 'Genome size'],
  ['segments', 'Segments'],
]

function viewFamily(name) {
  const f = BY_NAME.get(name)
  if (!f) return el('div', el('h1', 'Not found'), el('p.lede', `No family named “${name}” in ICTV ${META.msl}.`))

  const root = el('div')
  const lineage = [
    ['Realm', f.lineage.realm],
    ['Kingdom', f.lineage.kingdom],
    ['Phylum', f.lineage.phylum],
    ['Class', f.lineage.class],
    ['Order', f.lineage.order],
  ].filter(([, v]) => v)

  root.append(
    el(
      'div.fam-head',
      { class: strategyClass(f) },
      el('h1', f.name),
      el(
        'p.lineage',
        lineage.length
          ? lineage.flatMap(([k, v], i) => [i ? ' › ' : '', el('b', k + ' '), v])
          : 'No higher lineage assigned in this release.',
      ),
      el(
        'div.card-foot',
        baltimorePill(f),
        ...f.hosts.slice(0, 4).map((h) => el('span.pill', `${h.value} (${h.count})`)),
      ),
    ),
  )

  if (f.curated?.distinctive) {
    root.append(el('div.callout', el('span.label', 'What sets it apart'), el('p', f.curated.distinctive)))
  }

  root.append(el('h2', 'Mechanism'))
  if (f.curated) {
    const table = el('table.facts')
    for (const [key, label] of FIELDS) {
      table.append(el('tr', el('th', { scope: 'row' }, label), el('td', fieldValue(f.curated[key]))))
    }
    root.append(table)
    root.append(
      el(
        'p.srcline',
        'Mechanism fields from ',
        viralzoneLink(f) ?? 'ViralZone',
        ' (SIB Swiss Institute of Bioinformatics), CC BY 4.0. Per-cell primary-literature citations are still to come — ',
        'the confidence tag says how settled each value is, and contested values are marked rather than resolved.',
      ),
    )
  } else {
    root.append(
      el(
        'div.gap',
        el('p', el('strong', 'Not curated.'), ' '),
        el(
          'p',
          `${f.name} is present in the skeleton layer with everything the ICTV VMR carries, but its capsid, ` +
            'receptor and replication fields have not been assembled yet. That is a gap in this reference, ' +
            'not a statement about the family — the first curated group was chosen for Baltimore class coverage ' +
            'and medical relevance, and it is meant to grow.',
        ),
        viralzoneLink(f) ? el('p', 'ViralZone has a factsheet: ', viralzoneLink(f), '.') : null,
      ),
    )
  }

  root.append(el('h2', 'Composition'))
  const comp = el('table.facts')
  comp.append(
    el(
      'tr',
      el('th', { scope: 'row' }, 'Genome'),
      el('td', el('ul.val-list', ...f.genomeComposition.map((g) => el('li', `${g.value} — ${plural(g.count, 'isolate')}`)))),
    ),
    el(
      'tr',
      el('th', { scope: 'row' }, 'Host source'),
      el('td', el('ul.val-list', ...f.hosts.map((h) => el('li', `${h.value} — ${plural(h.count, 'isolate')}`)))),
    ),
    el(
      'tr',
      el('th', { scope: 'row' }, 'Size'),
      el(
        'td',
        `${plural(f.counts.genera, 'genus', 'genera')}, ${plural(f.counts.species, 'species', 'species')}, ` +
          `${plural(f.counts.isolates, 'isolate')}` +
          (f.counts.subfamilies ? `, ${plural(f.counts.subfamilies, 'subfamily', 'subfamilies')}` : ''),
      ),
    ),
  )
  root.append(comp)

  if (f.curated?.notable?.length) {
    root.append(el('h3', 'Notable members'), el('p', el('span.sp', f.curated.notable.join(', '))))
  }

  if (f.exemplars.length) {
    root.append(
      el('h2', 'ICTV isolates'),
      el(
        'p.lede',
        `Every isolate ${f.name} carries in ${META.msl} — ${plural(f.exemplars.length, 'isolate')}, complete. ` +
          'An exemplar is the one ICTV designates as the reference for its species, the anchor a sequence record ' +
          'hangs on; the rest are additional isolates of those same species and are marked as such.',
      ),
      el(
        'table.exemplars',
        ...f.exemplars.map((e) =>
          el(
            'tr',
            el('td', el('span.sp', e.species)),
            el('td', e.virus ?? '', e.exemplar ? null : el('span.addl', { title: 'additional isolate, not the ICTV exemplar for this species' }, 'additional')),
            el(
              'td.acc',
              e.accession
                ? el(
                    'a',
                    { href: `https://www.ncbi.nlm.nih.gov/nuccore/${encodeURIComponent(e.accession)}`, target: '_blank', rel: 'noopener' },
                    e.accession,
                  )
                : '—',
            ),
          ),
        ),
      ),
    )
  }

  root.append(
    el(
      'p.srcline',
      el('a', { href: `#/compare?f=${encodeURIComponent(f.name)}` }, `Compare ${f.name} with another family →`),
    ),
  )
  return root
}

// --- view: compare -----------------------------------------------------------

function viewCompare(query) {
  const picked = (query.get('f') ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter((s) => BY_NAME.has(s))
    .slice(0, MAX_COMPARE)

  const root = el('div')
  root.append(
    el('h1', 'Compare families'),
    el(
      'p.lede',
      'Put families side by side and the replication strategies separate. This is the view that is hard to ' +
        'assemble by hand: two or three families, the same rows, and the differences legible at a glance.',
    ),
  )

  const setHash = (names) => {
    location.hash = names.length ? `#/compare?f=${names.map(encodeURIComponent).join(',')}` : '#/compare'
  }

  const picker = el('div.picker')
  picked.forEach((name) => {
    picker.append(
      el(
        'span.chip',
        name,
        el('button', { 'aria-label': `Remove ${name}`, onClick: () => setHash(picked.filter((n) => n !== name)) }, '×'),
      ),
    )
  })

  if (picked.length < MAX_COMPARE) {
    const options = CURATED.filter((f) => !picked.includes(f.name))
    const sel = el(
      'select',
      { 'aria-label': 'Add a family to compare' },
      el('option', { value: '' }, picked.length ? 'Add a family…' : 'Choose a family…'),
      ...options.map((f) => el('option', { value: f.name }, `${f.name} — ${BALTIMORE_LABEL[f.baltimorePrimary] ?? '?'}`)),
    )
    sel.addEventListener('change', () => sel.value && setHash([...picked, sel.value]))
    picker.append(sel)
  }

  if (picked.length) {
    picker.append(
      el(
        'button',
        {
          onClick: () => {
            const pool = CURATED.map((f) => f.name)
            const shuffled = pool.sort(() => Math.random() - 0.5).slice(0, 3)
            setHash(shuffled)
          },
        },
        'Surprise me',
      ),
    )
  }
  root.append(picker)

  if (!picked.length) {
    const suggestions = [
      ['Coronaviridae', 'Retroviridae', 'Poxviridae'],
      ['Orthomyxoviridae', 'Paramyxoviridae', 'Pneumoviridae'],
      ['Hepadnaviridae', 'Retroviridae'],
    ]
    root.append(
      el('h3', 'Try one of these'),
      el(
        'ul',
        ...suggestions.map((s) =>
          el('li', el('a', { href: `#/compare?f=${s.map(encodeURIComponent).join(',')}` }, s.join(' vs '))),
        ),
      ),
    )
    return root
  }

  const families = picked.map((n) => BY_NAME.get(n))
  const rows = [
    ['Baltimore class', (f) => (f.baltimorePrimary ? `${f.baltimorePrimary} — ${BALTIMORE_LABEL[f.baltimorePrimary]}` : el('span.absent', 'unresolved'))],
    ['Order', (f) => f.lineage.order ?? el('span.absent', 'unassigned')],
    ...FIELDS.map(([key, label]) => [label, (f) => (f.curated ? fieldValue(f.curated[key]) : el('span.absent', 'not curated'))]),
    ['Genome', (f) => f.genomeComposition.map((g) => g.value).join(', ')],
    ['Hosts', (f) => f.hosts.slice(0, 3).map((h) => h.value).join(', ')],
    ['Species', (f) => f.counts.species.toLocaleString()],
    ['Distinctive', (f) => f.curated?.distinctive ?? el('span.absent', 'not curated')],
  ]

  const table = el(
    'table.cmp',
    el(
      'thead',
      el(
        'tr',
        el('th', ''),
        ...families.map((f) =>
          el('th', { class: strategyClass(f) }, el('a', { href: `#/family/${encodeURIComponent(f.name)}` }, f.name)),
        ),
      ),
    ),
    el('tbody', ...rows.map(([label, get]) => el('tr', el('td', label), ...families.map((f) => el('td', get(f)))))),
  )
  root.append(el('div.cmp-wrap', table))
  return root
}

// --- view: about -------------------------------------------------------------

function viewAbout() {
  return el(
    'div.prose',
    el('h1', 'About Contagium'),
    el(
      'p.lede',
      'A comparative reference for virus families: what the genome is, how the particle is built, what it binds, ' +
        'where it replicates — with the sources named and the gaps left visible.',
    ),
    el('h2', 'Two layers'),
    el(
      'p',
      `The skeleton layer is every family in ICTV ${META.msl} — ${META.counts.families} of them — derived directly ` +
        'from the Virus Metadata Resource spreadsheet. Nothing in it is hand-typed, so it is complete and it is as ' +
        'current as the release ingested.',
    ),
    el(
      'p',
      `The depth layer is capsid, envelope, receptor, replication site and tropism for ${META.counts.curated} families, ` +
        'chosen to cover all seven Baltimore classes so that comparisons have real mechanistic contrast. These fields ' +
        'are not published in bulk by any open source; they are assembled by hand from ViralZone and the literature.',
    ),
    el('h2', 'On absence'),
    el(
      'p',
      'An empty cell here means one of two things, and the interface distinguishes them. “Not curated” is a gap in ' +
        'this reference. “Not characterised” means the field itself has not established the answer — which is ' +
        'information worth having, and the reason receptor rows carry a confidence tag rather than a single ' +
        'confident value.',
    ),
    el(
      'p',
      'Where the literature disagrees — the flavivirus receptor, the human norovirus receptor, the CCHFV receptor — ' +
        'the value is marked contested rather than resolved in favour of whichever paper is most cited.',
    ),
    el('h2', 'Sources and licences'),
    el(
      'ul',
      ...META.sources.map((s) =>
        el('li', el('a', { href: s.url, target: '_blank', rel: 'noopener' }, s.name), ` — ${s.licence}`),
      ),
      el('li', 'Exemplar accessions link to NCBI Nucleotide (US Government work, no use restrictions).'),
    ),
    el(
      'p',
      'Both primary sources are CC BY 4.0, so attribution is a licence obligation as much as a scientific one. ' +
        'It is carried per record rather than as a footnote.',
    ),
    el('h2', 'What this is not'),
    el(
      'p',
      'It is not a diagnostic tool and carries no clinical guidance. It is not exhaustive on mechanism — 25 of 427 ' +
        'families have depth data today. And it is not a substitute for the primary literature: where a value is ' +
        'contested, the honest move is to read the papers, not to trust a table cell.',
    ),
  )
}

// --- router ------------------------------------------------------------------

function route() {
  const raw = location.hash.replace(/^#\/?/, '')
  const [path, qs] = raw.split('?')
  const query = new URLSearchParams(qs ?? '')
  const parts = path.split('/').filter(Boolean)
  const main = document.getElementById('main')

  let view
  if (parts[0] === 'family' && parts[1]) view = viewFamily(decodeURIComponent(parts.slice(1).join('/')))
  else if (parts[0] === 'compare') view = viewCompare(query)
  else if (parts[0] === 'about') view = viewAbout()
  else view = viewList()

  main.replaceChildren(view)
  document.title =
    parts[0] === 'family' && parts[1]
      ? `${decodeURIComponent(parts[1])} — Contagium`
      : 'Contagium — a comparative virus family reference'
  window.scrollTo(0, 0)
}

// Before the first route() so the stored theme is in place for the first paint
// of the view, not applied a frame after it.
initTheme()

document.getElementById('colophon-text').textContent =
  `Built from ICTV ${META.msl} (${META.vmrFile}) and ViralZone, both CC BY 4.0. Catalog generated ${META.generated}. ` +
  `${META.counts.families} families, ${META.counts.curated} with curated mechanism data.`

addEventListener('hashchange', route)
route()
