// Verifies the app can be served under a strict Content-Security-Policy.
//
// Contagium has no runtime backend and makes no network requests: the whole
// catalog is bundled at build time. That means the policy can be about as tight
// as a policy gets, and this check keeps it that way — it fails the build if
// something inline or remote creeps into the page.
//
// Runs before vite build, so it checks the source rather than the bundle.
//
// Usage: node scripts/check-csp.mjs
import fs from 'node:fs'

export const POLICY = [
  "default-src 'none'",
  "script-src 'self'",
  "style-src 'self'",
  "img-src 'self' data:",
  "font-src 'self'",
  "connect-src 'none'",
  "base-uri 'none'",
  "form-action 'none'",
  "frame-ancestors 'none'",
].join('; ')

const problems = []

const html = fs.readFileSync('index.html', 'utf8')

// Inline script or style would need 'unsafe-inline' or a nonce.
for (const m of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
  if (!/\bsrc=/.test(m[1])) problems.push('inline <script> in index.html')
  else if (/\bsrc="(https?:)?\/\//i.test(m[1])) problems.push(`remote script: ${m[1].trim()}`)
}
for (const m of html.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)) {
  if (m[1].trim()) problems.push('inline <style> in index.html')
}
if (/\son[a-z]+\s*=/i.test(html)) problems.push('inline event handler attribute in index.html')

// Remote stylesheets, fonts and images all need their origin allow-listed.
for (const m of html.matchAll(/<link\b[^>]*href="(https?:)?\/\/[^"]*"[^>]*>/gi)) {
  problems.push(`remote <link>: ${m[0].slice(0, 70)}`)
}

// Nothing in src/ should be reaching the network at runtime — connect-src is
// 'none', so a stray fetch would fail silently in production but work in dev.
for (const file of fs.readdirSync('src', { recursive: true })) {
  const path = `src/${file}`
  if (!/\.(js|mjs)$/.test(path) || !fs.statSync(path).isFile()) continue
  if (path.startsWith('src/data/')) continue // generated catalog, data only
  const code = fs.readFileSync(path, 'utf8')
  for (const call of ['fetch(', 'XMLHttpRequest', 'WebSocket', 'EventSource', 'importScripts(']) {
    if (code.includes(call)) problems.push(`${path} uses ${call} but connect-src is 'none'`)
  }
  if (/\beval\s*\(|new Function\s*\(/.test(code)) problems.push(`${path} evaluates code at runtime`)
}

// The deployment must serve the policy this file checks against. nginx is the
// only place it is actually applied — there is no <meta> fallback — so a drift
// between the two would mean the build passes while production either blocks
// something the app needs or permits something this check forbids.
const headers = 'security-headers.conf'
if (fs.existsSync(headers)) {
  const served = fs.readFileSync(headers, 'utf8').match(/Content-Security-Policy\s+"([^"]*)"/)
  if (!served) problems.push(`${headers} sets no Content-Security-Policy`)
  else if (served[1] !== POLICY) problems.push(`${headers} serves a different policy:\n      ${served[1]}`)
} else {
  problems.push(`${headers} is missing — the deployment would serve no CSP`)
}

if (problems.length) {
  console.error('CSP check failed:')
  for (const p of problems) console.error(`  - ${p}`)
  console.error(`\npolicy: ${POLICY}`)
  process.exit(1)
}

console.log('CSP check passed.')
console.log(`policy: ${POLICY}`)
