# CLAUDE.md — micro-tools (DevTools Hub)

## Project Overview
DevTools Hub (`devtools.page`) is a Next.js 14 static/SSR multi-tool site with 100+ free online tools grouped into categories (developer, text, converter, calculator, AI, etc.). Each tool is a standalone route under `/tools/[slug]`. AI-powered tools call `/api/ai` which proxies Anthropic Claude. Monetised via Google AdSense. SEO-first architecture with per-tool metadata, OG images, JSON-LD, sitemap, and robots.ts.

## Architecture
```
src/
  app/
    layout.tsx          # Root layout: Inter font, dark theme, GA, AdSense, JSON-LD schemas
    page.tsx            # Homepage: search + category filter over tools-manifest.json
    tools/
      page.tsx          # /tools — all tools grouped by category
      [slug]/           # ~100 individual tool routes (each has page.tsx)
    api/
      ai/route.ts       # POST /api/ai — Anthropic SDK, TOOL_PROMPTS map, rate-limited
      og/               # Dynamic OG image generation
    analytics/          # GA analytics page
    privacy/ terms/     # Static legal pages
    sitemap.ts robots.ts opengraph-image.tsx
  components/
    ToolLayout.tsx      # Wraps every tool: breadcrumb, AdUnit, related tools
    ToolCard.tsx        # Card on homepage/listing
    AdUnit.tsx          # Google AdSense unit (NEXT_PUBLIC_ADSENSE_ID env)
    GoogleAnalytics.tsx RelatedTools.tsx ToolBreadcrumb.tsx JsonLd.tsx
  lib/
    tools-manifest.json # SOURCE OF TRUTH: all tool metadata (slug, name, desc, category, status)
    tool-metadata.ts    # generateToolMetadata(slug) — builds Next.js Metadata from manifest
    ai-helpers.ts       # Client-side rate limiting: 5 uses/day/tool via localStorage
    analytics.ts        # GA event helpers
    jsonld.ts           # Org + WebSite schema generators
    related-tools.ts    # Related tool lookup by category
docs/                   # Build log, QA audit, SEO checklist, plans
scripts/                # index-now.js, ping-google.sh (SEO submission scripts)
```

## Key Dependencies
| Package | Role |
|---|---|
| `next@14` | App Router, SSR/SSG, metadata API, route handlers |
| `react@18` | UI |
| `tailwindcss@4` | Styling (v4 — PostCSS plugin, no tailwind.config.js) |
| `@anthropic-ai/sdk` | AI tool backend (`/api/ai`) — uses `ANTHROPIC_API_KEY` env |
| `qrcode` | QR code generator tool |
| `sql-formatter` | SQL formatter tool |
| `playwright` | E2E/QA testing (`docs/qa-test.mjs`) |

## Dev Commands
```bash
npm run dev      # Next.js dev server (localhost:3000)
npm run build    # Production build
npm run start    # Serve production build
npm run lint     # ESLint via next lint
node docs/qa-test.mjs  # Playwright QA smoke tests
node scripts/index-now.js  # Submit URLs to IndexNow
```

## Style Conventions
- **Dark theme only**: `bg-slate-900` body, `bg-slate-800` cards, `text-white` primary
- **Tailwind v4**: No `tailwind.config.js` — config via CSS `@theme` in `globals.css`
- **Path alias**: `@/` maps to `src/` (set in tsconfig)
- **Tool pages**: Always use `ToolLayout` wrapper with `{title, description, category, children}`
- **Metadata**: Always call `generateToolMetadata(slug)` and export as `metadata` — do not hand-roll
- **Manifest-driven**: Add new tools to `tools-manifest.json` first (`status: "live"|"draft"`)
- **AI tools**: Client calls `POST /api/ai` with `{tool, input}` — add new prompt to `TOOL_PROMPTS` in `api/ai/route.ts`; guard with `getRemainingUses` / `recordUsage` from `ai-helpers.ts`
- **Strict TS**: `"strict": true` — no implicit any, proper typing required
- **Components**: PascalCase filenames, named default exports

## Important Notes
- `ANTHROPIC_API_KEY` must be set server-side; `NEXT_PUBLIC_ADSENSE_ID` for ads (optional)
- AI rate limiting is **client-side only** (localStorage) — 5 uses/day/tool, no server enforcement
- Tailwind v4 uses `@tailwindcss/postcss` plugin — importing `tailwindcss` directly in PostCSS will break
- Duplicate tool slugs exist in `/tools/` dir (e.g. both `svg-to-png` and `svg-to-png-converter`) — manifest controls which is live; only `status: "live"` tools show on homepage
- OG images are dynamically generated at `/api/og?title=...&description=...`
- Production domain is `devtools.page` — hardcoded in `tool-metadata.ts` and `jsonld.ts`
- Google Search Console verification key is in `layout.tsx` metadata
