# Deploying to fly.io

Deployed at **[contagium.fly.dev](https://contagium.fly.dev)**.

Contagium has no server component. The Docker image is a Vite build served by
nginx, so a deployment is static files behind Fly's TLS terminator — no
secrets, no environment variables, no volumes, no database.

That falls out of the architecture rather than being a simplification of it.
The catalog is bundled at build time and the app makes no network requests at
all, so there is nothing here to configure, nothing to rotate and nothing to
leak. `connect-src 'none'` is enforced on the running deployment, not merely
claimed in the README.

## Files

| File | Purpose |
| --- | --- |
| `Dockerfile` | Two stages: `node:22-alpine` runs `npm ci && npm run build`, `nginx:1.27-alpine` serves `dist/` |
| `nginx.conf` | Caching, gzip, fallback for a stray path, `/healthz` |
| `security-headers.conf` | CSP and the other response headers, included per-location |
| `fly.toml` | App name, region, machine size, health check |
| `.dockerignore` | Keeps `node_modules`, `dist`, `.git`, `data-src`, `docs/` and `*.md` out of the build context |

`data-src/` is excluded deliberately: the ICTV spreadsheet and the ViralZone
index are inputs to `npm run build:catalog`, which runs at development time and
commits its output to `src/data/catalog.js`. The image build never reads them,
and the 400 kB spreadsheet has no reason to enter the build context.

## First deploy

```bash
fly launch --no-deploy
```

Answer no when it offers to overwrite `fly.toml`. It will rename the app if
`contagium` is taken, and it may change `primary_region` — the config here
defaults to `yyz` (Toronto).

Then:

```bash
fly deploy
```

Subsequent deploys are the same `fly deploy`. Nothing else needs configuring;
the app is reachable at `https://<app>.fly.dev`.

## What the configuration assumes

**The machine can sleep.** `auto_stop_machines = 'suspend'` with
`min_machines_running = 0` means an idle deployment costs nothing and the first
request after an idle period pays a wake-up of roughly a second. Set
`min_machines_running = 1` if that matters.

**256 MB, one shared CPU.** nginx serving three files needs a fraction of this.
Every comparison, filter and search runs in the visitor's browser.

**The catalog is the bundle.** 447 kB of JavaScript, 93 kB gzipped, almost all
of it the 427-family catalog compiled from the VMR. It is served once per cold
visit and then cached for a year, which is the trade the build-time ingest
makes: a larger first load in exchange for no runtime backend and no per-view
requests.

## Caching

`/assets/*` is fingerprinted by Vite and served `immutable` for a year;
`index.html` is served `no-cache` so a deploy reaches clients that already have
the shell. Getting this backwards is the usual way a static deploy appears not
to have taken effect.

Routing is entirely in the fragment — `#/`, `#/compare`, `#/family/…` — so the
server has only ever one document to hand over. The `try_files` fallback covers
a stray path rather than the router.

## Content Security Policy

The policy served by `security-headers.conf` is the one asserted by
`scripts/check-csp.mjs`, and the script now reads the conf file and **fails the
build if the two drift**. This matters because nginx is the only place the
policy is applied — there is no `<meta>` fallback and the dev server sets no CSP
— so a mismatch would be invisible until production either blocked something
the app needs or quietly permitted something the check forbids.

The check also scans `src/` and `index.html` for the things the policy would
refuse: an inline script or style, an inline event handler, a remote `<link>`,
and any `fetch` / `XMLHttpRequest` / `WebSocket` / `EventSource` / `eval`.
`npm run build` runs it first, so those fail the image build rather than the
deployment.

`img-src` allows `data:` for the empty favicon in `index.html`. Everything else
is `'none'` or `'self'`.

## Verified

Against a local container, when this was written — a record of one occasion,
not a standing guarantee:

- image builds clean at 76.5 MB; `nginx -t` passes; `/healthz` returns 200
- CSP, `X-Frame-Options`, `X-Content-Type-Options` and `Referrer-Policy`
  present on the shell, on a hashed asset and on a fallback path
- `Cache-Control: no-cache` on the shell, `immutable` on `/assets/*`
- 404 for a missing asset rather than the index fallback
- gzip active on a real GET: 447 kB → 113 kB (Fly's edge re-encodes in front of
  this, so visitors get brotli/zstd; the nginx directive covers a direct hit on
  the container, which is how the image is smoke tested)
- the app loaded and rendered under the production CSP with **no console
  output at all** — the family list (427 families, 3,265 genera, 14,943
  species), a curated family page (Adenoviridae, mechanism rows and confidence
  tags intact) and the compare view
- the CSP drift check fails as intended: flipping `connect-src` to `'self'` in
  the conf file failed `npm run check:csp`

To repeat the local half:

```bash
docker build -t contagium:test . && docker run --rm -p 8099:80 contagium:test
```

And on https://contagium.fly.dev, after the first deploy:

- plain http redirects with a 301; all four security headers survive Fly's
  proxy unchanged, CSP included
- the caching split holds — `no-cache` on the shell, `immutable` on the hashed
  asset
- Fly's edge re-encodes: the bundle arrives `content-encoding: br` at 117 kB
  against 447 kB uncompressed
- `/healthz` 200, both machines passing their check
- the app loaded and rendered with a clean console
