# JSON-LD Structured Data + Cross-Linking Design

**Date:** 2026-03-17
**Goal:** Improve Google rich snippet eligibility and internal linking to increase CTR and pageviews per session, driving more AdSense impressions.

## Priority Order (by monetization impact)

1. **FAQPage JSON-LD** — All 48 pages have FAQ sections. Wrapping in FAQPage schema triggers rich snippets (up to 2-3x CTR increase).
2. **Auto-generated Related Tools** — Fills 24 missing cross-link sections + replaces 24 hardcoded ones. More pageviews per session = more ad impressions.
3. **BreadcrumbList JSON-LD** — Improves SERP breadcrumb trails. Low effort (HTML already exists).
4. **WebApplication JSON-LD** — Marks each tool as free web software. Can trigger "Software App" rich results.
5. **Organization JSON-LD** — Homepage only. Brand recognition in search.

## Implementation Approach

Shared components with minimal per-page changes (Option B).

### New Files

- `src/lib/jsonld.ts` — Utility functions generating schema objects from manifest data
  - `generateFAQSchema(faqs: {question: string, answer: string}[])` — FAQPage schema
  - `generateWebAppSchema(tool: ManifestTool)` — WebApplication schema
  - `generateBreadcrumbSchema(tool: ManifestTool)` — BreadcrumbList schema
  - `generateOrgSchema()` — Organization schema (homepage only)

- `src/components/JsonLd.tsx` — Renders `<script type="application/ld+json">` tag
  - Props: `data: object | object[]`
  - Serializes with `JSON.stringify`, escapes `</script>` for safety

- `src/components/RelatedTools.tsx` — Auto-generated related tools grid
  - Props: `currentSlug: string`
  - Reads manifest, returns 3-4 tools from same category (excluding self)
  - Matches existing visual style of hardcoded related sections
  - Falls back gracefully if < 2 tools in category (pulls from adjacent categories)

- `src/lib/related-tools.ts` — Helper function
  - `getRelatedTools(slug: string, count?: number)` — Returns related tool objects from manifest

### Per-Page Changes (48 tool pages)

Each tool page gets:
1. Import `JsonLd` component + relevant generator functions
2. Import `RelatedTools` component
3. Add `<JsonLd>` with FAQPage + WebApplication + BreadcrumbList schemas
4. Replace hardcoded related tools section (or add if missing) with `<RelatedTools currentSlug="..." />`
5. Export FAQ data as structured array (for JSON-LD consumption)

Minimal diff per file: ~10-15 lines changed.

### Homepage Changes

- Add Organization + WebSite JSON-LD schema via `<JsonLd>` component

## Schema Specifications

### FAQPage (per tool page)
```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "Question text",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Answer text"
      }
    }
  ]
}
```

### WebApplication (per tool page)
```json
{
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "name": "Tool Name",
  "description": "Tool description from manifest",
  "url": "https://devtools.page/tools/{slug}",
  "applicationCategory": "DeveloperApplication",
  "operatingSystem": "Any",
  "browserRequirements": "Requires JavaScript",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD"
  }
}
```

### BreadcrumbList (per tool page)
```json
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://devtools.page" },
    { "@type": "ListItem", "position": 2, "name": "Category Label" },
    { "@type": "ListItem", "position": 3, "name": "Tool Name", "item": "https://devtools.page/tools/{slug}" }
  ]
}
```

### Organization (homepage only)
```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "DevTools Hub",
  "url": "https://devtools.page",
  "description": "Free online developer tools"
}
```

## Out of Scope
- Rating/review schema (no user reviews exist)
- Page content or styling changes
- New pages or routes
- Manifest schema changes
- Analytics or AdSense configuration
