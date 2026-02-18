# shfmt.web

Browser-based shell script formatter powered by [shfmt](https://github.com/mvdan/sh) compiled to WebAssembly. All formatting runs entirely client-side — no data is sent to any server.

## Setup

```bash
npm install
```

## Development

```bash
npm run dev
```

Opens a dev server at `http://localhost:5173`.

## Build

```bash
npm run build
```

Outputs static files to `dist/`. Deploy the contents of `dist/` to any static file server.

## Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server |
| `npm run build` | TypeScript check + Vite production build |
| `npm run preview` | Preview production build (port 4173) |
| `npm run typecheck` | TypeScript type check only |
| `npm test` | Run Playwright E2E tests (all browsers) |
| `npm run test:ui` | Run Playwright in UI mode |

## WASM Build

To rebuild the shfmt WASM binary (requires Go 1.22+):

```bash
git clone https://github.com/mvdan/sh.git /tmp/shfmt-build
cd /tmp/shfmt-build
GOOS=js GOARCH=wasm go build -o shfmt.wasm ./cmd/shfmt
cp shfmt.wasm /path/to/shfmt.web/public/
cp "$(go env GOROOT)/lib/wasm/wasm_exec.js" /path/to/shfmt.web/public/
```

## Testing

```bash
# First time: install browsers
npx playwright install

# Run all tests
npm test

# Run specific test file
npx playwright test tests/e2e/format.spec.ts

# Run specific browser only
npx playwright test --project=chromium
```

## Tech Stack

- **UI**: HTML + CSS + TypeScript (no framework)
- **Formatter**: shfmt (WASM build)
- **Build**: Vite
- **Tests**: Playwright (E2E)
- **Fonts**: IBM Plex Mono + DM Sans (Google Fonts CDN)
