// Contagium — comparative virus family reference.
//
// Two data layers, kept visibly distinct throughout the UI: a complete skeleton
// derived from the ICTV VMR, and a curated depth layer for a first group of
// families. Absence is rendered rather than hidden — "we have not curated this"
// and "the field has not characterised this" are different statements and the
// interface says which one it means.

import './style.css'
import { FAMILIES, META, BALTIMORE_LABEL } from './data/catalog.js'

const REPO_URL = 'https://github.com/thepacket/Contagium'

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
  } else if (Array.isArray(value) && value.length === 2 && value.every((v) => typeof v === 'number')) {
    // A measured range, not a list of things. [18, 26] is one fact about a
    // particle, so it reads as "18–26 nm" rather than as two bullets.
    wrap.append(document.createTextNode(nmRange(value)), confidenceTag(confidence))
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

// --- virion schematic --------------------------------------------------------
//
// Drawn from the curated fields rather than shipped as artwork: no licensing to
// carry, nothing added to the bundle, and it inherits the theme through
// currentColor and the strategy hue.
//
// The hard part is not the drawing, it is that a picture has no room for a
// confidence tag. So the rule is: the diagram shows only what the data marks
// `established`, and the caption underneath carries every qualifier. A family
// whose capsid is `varies` — Retroviridae, whose cores are conical in the
// lentiviruses and spherical or polyhedral elsewhere — gets no diagram at all,
// because any single shape would be a claim the text is careful not to make.
//
// Shapes stay categorical on purpose. A T=1 and a T=217 icosahedron are not
// distinguishable at this size, so the drawing says "icosahedral" and the
// T-number is left to the table cell that can state it exactly.

const SVG_NS = 'http://www.w3.org/2000/svg'

function svg(spec, props, ...children) {
  const [tag, ...classes] = spec.split('.')
  const node = document.createElementNS(SVG_NS, tag)
  if (classes.length) node.setAttribute('class', classes.join(' '))
  if (props) {
    for (const [k, v] of Object.entries(props)) {
      if (v === null || v === undefined || v === false) continue
      node.setAttribute(k, String(v))
    }
  }
  children.flat().forEach((c) => c && node.append(c))
  return node
}

/** 'icosahedral' | 'helical' | 'complex', or null when it cannot be drawn. */
function capsidShape(f) {
  const c = f.curated?.capsid
  if (!c || c.confidence !== 'established' || typeof c.value !== 'string') return null
  if (/^icosahedral/i.test(c.value)) return 'icosahedral'
  if (/^helical/i.test(c.value)) return 'helical'
  if (/^complex/i.test(c.value)) return 'complex'
  return null
}

/** A coil, drawn as `humps` arches — the side view of a helical nucleocapsid. */
function coilPath(x, y, width, height, humps) {
  const step = width / humps
  let d = `M ${x} ${y}`
  for (let i = 0; i < humps; i++) d += ` q ${step / 2} ${-height} ${step} 0`
  return d
}

function hexPoints(cx, cy, r) {
  return [-90, -30, 30, 90, 150, 210]
    .map((deg) => {
      const a = (deg * Math.PI) / 180
      return `${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`
    })
    .join(' ')
}

/** Upper bound of the particle's extent in nm, or null when not established. */
function diameterOf(f) {
  const d = f.curated?.diameter
  if (!d || d.confidence !== 'established' || !Array.isArray(d.value)) return null
  return d.value[1]
}

/** True when the capsid is described as having more than one protein shell. */
function isMultilayer(f) {
  return /multilayer|multi-layer|layered|double capsid/i.test(f.curated?.capsid?.value ?? '')
}

/**
 * `extraBits` are appended to the caption. The family page uses it to say
 * "not to scale": on a single-family page there is nothing to scale against,
 * and a lone figure at a fixed size is read as proportional unless it says
 * otherwise. Scaling every page against a fixed global reference was the
 * alternative and it does not work — the largest curated particle is a 1400 nm
 * filovirus, which would render a coronavirus at 8% and a parvovirus as a dot.
 */
function virionFigure(f, scale = 1, extraBits = []) {
  const shape = capsidShape(f)
  const env = f.curated?.envelope
  const enveloped = env && env.confidence === 'established' && typeof env.value === 'boolean' ? env.value : null
  if (!shape || enveloped === null) return null

  const seg = f.curated?.segments
  const segCount = typeof seg?.value === 'number' && seg.value > 0 ? seg.value : null
  const drawn = segCount ? Math.min(segCount, 8) : 1

  const C = 36
  const k = scale
  const envR = 30 * k
  const R = (enveloped ? 19 : 27) * k
  const parts = []

  if (enveloped) {
    parts.push(svg('circle.v-env', { cx: C, cy: C, r: envR.toFixed(1) }))
    for (let i = 0; i < 16; i++) {
      const a = (i * 22.5 * Math.PI) / 180
      parts.push(
        svg('line.v-spike', {
          x1: (C + envR * Math.cos(a)).toFixed(1),
          y1: (C + envR * Math.sin(a)).toFixed(1),
          x2: (C + (envR + 4.5 * Math.min(k * 1.4, 1)) * Math.cos(a)).toFixed(1),
          y2: (C + (envR + 4.5 * Math.min(k * 1.4, 1)) * Math.sin(a)).toFixed(1),
        }),
      )
    }
  }

  if (shape === 'helical') {
    const w = R * 1.9
    if (drawn === 1) {
      parts.push(svg('path.v-capsid', { d: coilPath(C - w / 2, C + R * 0.5, w, Math.min(R * 0.9, 20), 4), fill: 'none' }))
    } else {
      // Segmented helical genomes are drawn as separate rods, not as separate
      // coils. Eight coils across this width leave 4px each, which renders as
      // one solid blob rather than eight of anything — the rods stay countable,
      // and ribonucleoprotein segments are conventionally drawn this way.
      const gap = w / drawn
      for (let i = 0; i < drawn; i++) {
        const x = C - w / 2 + gap * (i + 0.5)
        const h = R * (0.85 - 0.06 * (i % 3))
        parts.push(
          svg('line.v-rod', { x1: x.toFixed(1), y1: (C - h / 2).toFixed(1), x2: x.toFixed(1), y2: (C + h / 2).toFixed(1) }),
        )
      }
    }
  } else {
    if (shape === 'complex') {
      parts.push(svg('rect.v-capsid', { x: C - R, y: C - R * 0.68, width: R * 2, height: R * 1.36, rx: 5 }))
    } else {
      parts.push(svg('polygon.v-capsid', { points: hexPoints(C, C, R) }))
      // A concentric second shell where the capsid is described as multilayered.
      // Reoviruses are the case that forced this: the layering is the defining
      // feature of the particle, and a single outline threw it away entirely.
      if (isMultilayer(f)) parts.push(svg('polygon.v-capsid-inner', { points: hexPoints(C, C, R * 0.62) }))
      // Facet lines: alternating vertices, which reads as an icosahedron rather
      // than a flat hexagon without pretending to a specific triangulation.
      const p = [-90, -30, 30, 90, 150, 210].map((deg) => {
        const a = (deg * Math.PI) / 180
        return [C + R * Math.cos(a), C + R * Math.sin(a)]
      })
      for (const [i, j] of [[0, 2], [2, 4], [4, 0]]) {
        parts.push(
          svg('line.v-facet', { x1: p[i][0].toFixed(1), y1: p[i][1].toFixed(1), x2: p[j][0].toFixed(1), y2: p[j][1].toFixed(1) }),
        )
      }
    }
    // Genome strands go inside the innermost shell. This runs for icosahedral
    // as well as complex: without it a segmented icosahedral family drew an
    // empty shell while its caption announced eleven segments.
    const inner = isMultilayer(f) ? R * 0.62 : R
    const span = inner * 0.62
    for (let i = 0; i < drawn; i++) {
      const y = drawn === 1 ? C : C - span / 2 + (i * span) / (drawn - 1)
      parts.push(
        svg('line.v-genome', { x1: (C - inner * 0.5).toFixed(1), y1: y.toFixed(1), x2: (C + inner * 0.5).toFixed(1), y2: y.toFixed(1) }),
      )
    }
  }

  // Caption carries the qualifiers the drawing cannot.
  const bits = [isMultilayer(f) ? `${shape}, layered` : shape, enveloped ? 'enveloped' : 'non-enveloped']
  const d = f.curated?.diameter
  if (d?.value) bits.push(nmRange(d.value))
  if (segCount && segCount > 1) {
    bits.push(`${segCount} segments${seg.confidence !== 'established' ? ` (${seg.confidence})` : ''}`)
  }
  if (segCount > 8) bits.push('8 shown')
  bits.push(...extraBits)

  return el(
    'figure.virion',
    svg(
      'svg',
      {
        viewBox: '0 0 72 72',
        // Rendered larger than the geometry needs so that a particle scaled
        // down against a bigger neighbour still shows its coil or its segments.
        // At 84px a 4:1 reduction left nothing legible inside the envelope.
        width: 112,
        height: 112,
        role: 'img',
        'aria-label': `Schematic virion: ${bits.join(', ')}`,
      },
      ...parts,
    ),
    el('figcaption', bits.join(' · ')),
  )
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
        `${META.counts.curated} carry curated mechanism data; the rest show taxonomy and genome composition only. ` +
        `A further ${META.unplaced.species.toLocaleString()} species in ${META.msl} sit in no family at all and are ` +
        'not catalogued here — see About.',
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
          `${e.species} ${e.virus ?? ''} ${e.abbreviation ?? ''} ${e.accessions.map((a) => a.id).join(' ')}`
            .toLowerCase()
            .includes(q),
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

/** [18, 26] -> "18–26 nm"; [30, 30] -> "30 nm". */
function nmRange([min, max]) {
  return min === max ? `${min} nm` : `${min}–${max} nm`
}

const FIELDS = [
  ['capsid', 'Capsid'],
  ['diameter', 'Particle size'],
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
    // The schematic sits above the table it summarises. Same rules as in the
    // compare view: drawn only from `established` values, absent entirely where
    // the shape or the envelope is not settled.
    const fig = virionFigure(f, 1, ['not to scale'])
    if (fig) {
      // Carries the strategy class itself so --bc resolves: unlike a compare
      // cell, nothing above this figure sets one, and without it the schematic
      // falls back to plain ink while the rest of the page is in its hue.
      fig.classList.add('virion-solo')
      const cls = strategyClass(f)
      if (cls) fig.classList.add(cls)
      root.append(fig)
    }
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
            // The abbreviation is the name a reader recognises — SARS-CoV-2,
            // MERS-CoV, HIV-1 — and it is often the only form they know. It was
            // in the data and searchable but never printed, so scanning a
            // family for "SARS-CoV-2" found nothing while the row sat there
            // reading "severe acute respiratory syndrome coronavirus 2".
            el('td.abbr', e.abbreviation ?? ''),
            // One link per accession. The VMR packs a segmented genome into a
            // single cell — "Seg_1: KM461666; Seg_2: KM461667" — and linking
            // the cell whole produced a URL containing the semicolons and
            // spaces, which NCBI cannot resolve. 2,354 isolates had a dead
            // link that way. The segment label is kept beside each id, because
            // which segment an accession is for is part of the record.
            el(
              'td.acc',
              e.accessions.length
                ? e.accessions.map((a, i) =>
                    el(
                      'span.acc-item',
                      i ? ' ' : null,
                      a.label ? el('span.acc-label', `${a.label} `) : null,
                      el(
                        'a',
                        { href: `https://www.ncbi.nlm.nih.gov/nuccore/${encodeURIComponent(a.id)}`, target: '_blank', rel: 'noopener' },
                        a.id,
                      ),
                    ),
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

  // Draw the schematics to scale against each other, but only where that is
  // honest: every family in view has an established size, and the spread is
  // narrow enough that the smallest still renders. Past about 8:1 — a poxvirus
  // beside a parvovirus is 17:1 — the small particle collapses to a few pixels
  // and the comparison stops being readable, so the row drops to uniform size.
  // Either way the label says which, because an unlabelled figure is read as
  // being to scale whether or not it is.
  const MAX_SCALE_RATIO = 6
  const dias = families.map(diameterOf)
  const scalable = dias.every((d) => d !== null) && Math.max(...dias) / Math.min(...dias) <= MAX_SCALE_RATIO
  const maxDia = scalable ? Math.max(...dias) : null
  const scaleFor = (f) => (scalable ? diameterOf(f) / maxDia : 1)

  const rows = [
    [
      scalable ? 'Structure (to scale)' : 'Structure (not to scale)',
      (f) =>
        virionFigure(f, scaleFor(f)) ??
        el(
          'span.absent',
          capsidShape(f) === null && f.curated?.capsid
            ? 'no single shape — see Capsid'
            : 'not curated',
        ),
    ],
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
    // The strategy class rides every body cell, not just the header, so --bc
    // resolves for anything drawn inside a column — the schematic reads in its
    // family's hue rather than falling back to plain ink.
    el(
      'tbody',
      ...rows.map(([label, get]) =>
        el('tr', el('td', label), ...families.map((f) => el('td', { class: strategyClass(f) }, get(f)))),
      ),
    ),
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
    el('h2', 'What the family counts leave out'),
    el(
      'p',
      `This is a family-keyed catalog, and ICTV does not place every taxon in a family. ${META.msl} contains ` +
        `${(META.counts.genera + META.unplaced.genera).toLocaleString()} genera and ` +
        `${(META.counts.species + META.unplaced.species).toLocaleString()} species; Contagium holds the ` +
        `${META.counts.genera.toLocaleString()} genera and ${META.counts.species.toLocaleString()} species that ` +
        `belong to a named family. The remaining ${META.unplaced.genera} genera and ` +
        `${META.unplaced.species.toLocaleString()} species — overwhelmingly Caudoviricetes bacteriophage left ` +
        'unplaced after the morphology-based families were dissolved — have no family to file them under, so this ' +
        'catalog has nowhere to put them.',
    ),
    el(
      'p',
      'That is a limitation of the shape of this reference, not of the source: the VMR carries them. Anyone ' +
        'comparing these totals against the published Master Species List should expect the difference.',
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
    el('h2', 'What the confidence tags mean'),
    el(
      'p',
      'These are editorial judgments made while reading the family factsheet and the literature around it. They are ' +
        'not evidence codes: there is no vote count or study threshold behind them, and a second curator would not ' +
        'reproduce every one. Read them as a warning system rather than a metric.',
    ),
    el(
      'table.facts',
      el('tr', el('th', { scope: 'row' }, 'established'), el('td', 'Well characterised and not seriously disputed for the family as a whole.')),
      el(
        'tr',
        el('th', { scope: 'row' }, 'varies'),
        el(
          'td',
          'Genuinely differs between genera or species, so a single family-level value would mislead. The note says how it differs.',
        ),
      ),
      el('tr', el('th', { scope: 'row' }, 'contested'), el('td', 'Reported in the literature, but the literature disagrees with itself.')),
      el('tr', el('th', { scope: 'row' }, 'unknown'), el('td', 'The field has not established it — distinct from us not having curated it.')),
    ),
    el(
      'p',
      'One consistency rule is enforced mechanically rather than trusted: a segment count marked established fails ' +
        'the build if any isolate in that family is deposited with more segments than the count claims. Eight ' +
        'families were contradicting themselves that way before the check existed.',
    ),
    el('h2', 'Provenance and reuse'),
    el(
      'p',
      'Citations are at family-factsheet granularity, not per cell. A curated value links to the ViralZone factsheet ' +
        'for its family, which is not the same as identifying the paper behind that particular receptor or ' +
        'measurement. Per-cell primary-literature citations are the outstanding work, and until they exist this is ' +
        'not a source to cite in a publication — follow the factsheet and read the papers.',
    ),
    el(
      'p',
      'The catalog is generated, not hand-maintained: ',
      el('a', { href: REPO_URL, target: '_blank', rel: 'noopener' }, 'the source repository'),
      ' carries the build script, the curated field definitions with their schema, the ViralZone page-id cache and ' +
        'the full commit history. The generated catalog is a single JavaScript module of plain objects, so anyone ' +
        'wanting the structured data can take it from there.',
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
      'It is not a diagnostic tool and carries no clinical guidance. It is not exhaustive on mechanism — ' +
        `${META.counts.curated} of ${META.counts.families} families have depth data today. And it is not a ` +
        'substitute for the primary literature: where a value is contested, the honest move is to read the ' +
        'papers, not to trust a table cell.',
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

document.getElementById('colophon-text').replaceChildren(
  document.createTextNode(
    `Built from ICTV ${META.msl} (${META.vmrFile}) and ViralZone, both CC BY 4.0. Catalog generated ${META.generated}. ` +
      `${META.counts.families} families, ${META.counts.curated} with curated mechanism data. `,
  ),
  el('a', { href: REPO_URL, target: '_blank', rel: 'noopener' }, 'Source and data on GitHub'),
  document.createTextNode('.'),
)

addEventListener('hashchange', route)
route()
