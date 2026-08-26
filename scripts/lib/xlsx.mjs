// Minimal dependency-free .xlsx reader.
//
// An xlsx is a zip of XML parts. We need three of them: the workbook (to map
// sheet names to files), the shared string table, and the sheet itself. That is
// little enough work to do directly, and it keeps the build pipeline free of a
// spreadsheet dependency for the sake of one file we read once a year.
//
// Handles what the ICTV VMR actually uses: deflate and stored entries, shared
// strings with rich-text runs, and inline strings. It is not a general xlsx
// implementation — no styles, no dates, no formulas.
import { inflateRawSync } from 'node:zlib'

// --- zip ---------------------------------------------------------------------

/** Read the zip central directory and return name -> decompressed Buffer. */
function unzip(buf) {
  // The end-of-central-directory record sits at the tail, after a variable
  // length comment, so scan backwards for its signature.
  let eocd = -1
  for (let i = buf.length - 22; i >= 0 && i > buf.length - 22 - 0xffff; i--) {
    if (buf.readUInt32LE(i) === 0x06054b50) { eocd = i; break }
  }
  if (eocd < 0) throw new Error('not a zip: no end-of-central-directory record')

  const count = buf.readUInt16LE(eocd + 10)
  let p = buf.readUInt32LE(eocd + 16)
  const files = new Map()

  for (let n = 0; n < count; n++) {
    if (buf.readUInt32LE(p) !== 0x02014b50) throw new Error('bad central directory entry')
    const method = buf.readUInt16LE(p + 10)
    const compressedSize = buf.readUInt32LE(p + 20)
    const nameLen = buf.readUInt16LE(p + 28)
    const extraLen = buf.readUInt16LE(p + 30)
    const commentLen = buf.readUInt16LE(p + 32)
    const localOffset = buf.readUInt32LE(p + 42)
    const name = buf.toString('utf8', p + 46, p + 46 + nameLen)

    // The local header repeats the name and extra fields, and its extra field
    // length can differ from the central one — so re-read it rather than assume.
    const lNameLen = buf.readUInt16LE(localOffset + 26)
    const lExtraLen = buf.readUInt16LE(localOffset + 28)
    const start = localOffset + 30 + lNameLen + lExtraLen
    const raw = buf.subarray(start, start + compressedSize)

    files.set(name, method === 0 ? raw : inflateRawSync(raw))
    p += 46 + nameLen + extraLen + commentLen
  }
  return files
}

// --- xml ---------------------------------------------------------------------

const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" }

function decodeXml(s) {
  if (!s.includes('&')) return s
  return s.replace(/&(?:#(\d+)|#x([0-9a-fA-F]+)|([a-z]+));/g, (m, dec, hex, name) => {
    if (dec) return String.fromCodePoint(Number(dec))
    if (hex) return String.fromCodePoint(parseInt(hex, 16))
    return ENTITIES[name] ?? m
  })
}

/** Concatenate the text of every <t> in a fragment (rich-text runs included). */
function textOf(fragment) {
  let out = ''
  for (const m of fragment.matchAll(/<t(?:\s[^>]*)?>([\s\S]*?)<\/t>|<t\s*\/>/g)) {
    out += m[1] ? decodeXml(m[1]) : ''
  }
  return out
}

function columnOf(ref) {
  let i = 0
  while (i < ref.length && ref.charCodeAt(i) >= 65) i++
  return ref.slice(0, i)
}

// --- public ------------------------------------------------------------------

/**
 * Read one sheet by name. Returns an array of objects keyed by the header row,
 * with empty cells present as ''. Row order is preserved.
 */
export function readSheet(fileBuffer, sheetName) {
  const files = unzip(fileBuffer)
  const read = (name) => {
    const b = files.get(name)
    if (!b) throw new Error(`missing part: ${name}`)
    return b.toString('utf8')
  }

  // workbook.xml gives sheet name -> r:id; the rels file maps r:id -> target.
  const workbook = read('xl/workbook.xml')
  const rels = read('xl/_rels/workbook.xml.rels')

  let rid = null
  for (const m of workbook.matchAll(/<sheet\b[^>]*>/g)) {
    const name = /name="([^"]*)"/.exec(m[0])?.[1]
    if (name && decodeXml(name) === sheetName) {
      rid = /r:id="([^"]*)"/.exec(m[0])?.[1]
      break
    }
  }
  if (!rid) {
    const found = [...workbook.matchAll(/<sheet\b[^>]*name="([^"]*)"/g)].map((m) => m[1])
    throw new Error(`no sheet named "${sheetName}" (found: ${found.join(', ')})`)
  }

  let target = null
  for (const m of rels.matchAll(/<Relationship\b[^>]*>/g)) {
    if (/Id="([^"]*)"/.exec(m[0])?.[1] === rid) target = /Target="([^"]*)"/.exec(m[0])?.[1]
  }
  if (!target) throw new Error(`no relationship for ${rid}`)
  const sheetPath = 'xl/' + target.replace(/^\/?(xl\/)?/, '')

  // Shared strings are optional — a sheet can be entirely inline.
  const shared = []
  if (files.has('xl/sharedStrings.xml')) {
    for (const m of read('xl/sharedStrings.xml').matchAll(/<si>([\s\S]*?)<\/si>/g)) {
      shared.push(textOf(m[1]))
    }
  }

  const sheet = read(sheetPath)
  const rows = []
  for (const rowMatch of sheet.matchAll(/<row\b[^>]*>([\s\S]*?)<\/row>/g)) {
    const cells = new Map()
    // Non-greedy attrs: a greedy [^>]* eats the slash of a self-closing empty
    // cell, which then swallows every cell up to the next </c>.
    for (const c of rowMatch[1].matchAll(/<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
      const attrs = c[1]
      const body = c[2] ?? ''
      const ref = /r="([^"]*)"/.exec(attrs)?.[1]
      if (!ref) continue
      const type = /t="([^"]*)"/.exec(attrs)?.[1]

      let value = ''
      if (type === 'inlineStr') {
        value = textOf(body)
      } else {
        const v = /<v>([\s\S]*?)<\/v>/.exec(body)?.[1]
        if (v != null) value = type === 's' ? (shared[Number(v)] ?? '') : decodeXml(v)
      }
      cells.set(columnOf(ref), value)
    }
    rows.push(cells)
  }

  if (!rows.length) return []
  const header = rows[0]
  const columns = [...header.entries()].map(([col, name]) => [col, name.trim()])

  return rows.slice(1).map((cells) => {
    const record = {}
    for (const [col, name] of columns) record[name] = (cells.get(col) ?? '').trim()
    return record
  })
}
