# JSON-LD + Cross-Linking Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add structured data (JSON-LD) and auto-generated related tools to all 48 tool pages to improve Google rich snippet eligibility and increase pageviews per session.

**Architecture:** Create shared utility functions (`src/lib/jsonld.ts`, `src/lib/related-tools.ts`) and a `RelatedTools` component. Then update each tool page to import these and inject JSON-LD + related tools. Pages are `"use client"` components that render `<title>` and `<meta>` tags inline, so JSON-LD `<script>` tags go in the same JSX return.

**Tech Stack:** Next.js 14.2, TypeScript, React 18, Tailwind CSS v4

---

### Task 1: Create JSON-LD utility functions

**Files:**
- Create: `src/lib/jsonld.ts`

**Step 1: Create the JSON-LD generator module**

```typescript
// src/lib/jsonld.ts
import manifest from "@/lib/tools-manifest.json";

const SITE_URL = "https://devtools.page";

const categories = manifest.categories as Record<
  string,
  { label: string; color: string }
>;

interface FAQ {
  question: string;
  answer: string;
}

interface ToolMeta {
  slug: string;
  name: string;
  description: string;
  category: string;
}

export function generateFAQSchema(faqs: FAQ[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}

export function generateWebAppSchema(tool: ToolMeta) {
  return {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: tool.name,
    description: tool.description,
    url: `${SITE_URL}/tools/${tool.slug}`,
    applicationCategory: "DeveloperApplication",
    operatingSystem: "Any",
    browserRequirements: "Requires JavaScript",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
  };
}

export function generateBreadcrumbSchema(tool: ToolMeta) {
  const categoryLabel = categories[tool.category]?.label ?? tool.category;
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: SITE_URL,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: categoryLabel,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: tool.name,
        item: `${SITE_URL}/tools/${tool.slug}`,
      },
    ],
  };
}

export function generateOrgSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "DevTools Hub",
    url: SITE_URL,
    description: "Free online developer tools",
  };
}

export function generateWebSiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "DevTools Hub",
    url: SITE_URL,
    description:
      "Free online developer tools, text utilities, and converters.",
  };
}
```

**Step 2: Verify it compiles**

Run: `cd /Users/liamfrazer/projects/micro-tools && npx tsc --noEmit src/lib/jsonld.ts 2>&1 | head -20`
Expected: No errors (or only unrelated warnings)

**Step 3: Commit**

```bash
git add src/lib/jsonld.ts
git commit -m "feat: add JSON-LD schema generator utilities"
```

---

### Task 2: Create related tools helper

**Files:**
- Create: `src/lib/related-tools.ts`

**Step 1: Create the helper**

```typescript
// src/lib/related-tools.ts
import manifest from "@/lib/tools-manifest.json";

const liveTools = manifest.tools.filter((t) => t.status === "live");

export interface RelatedTool {
  slug: string;
  name: string;
  description: string;
  category: string;
}

export function getRelatedTools(
  currentSlug: string,
  count: number = 4
): RelatedTool[] {
  const current = liveTools.find((t) => t.slug === currentSlug);
  if (!current) return [];

  // Same category first (excluding self)
  const sameCategory = liveTools.filter(
    (t) => t.category === current.category && t.slug !== currentSlug
  );

  if (sameCategory.length >= count) {
    return sameCategory.slice(0, count);
  }

  // Fill remaining from other categories
  const others = liveTools.filter(
    (t) => t.category !== current.category && t.slug !== currentSlug
  );
  return [...sameCategory, ...others].slice(0, count);
}
```

**Step 2: Commit**

```bash
git add src/lib/related-tools.ts
git commit -m "feat: add related tools helper with category-based matching"
```

---

### Task 3: Create JsonLd component

**Files:**
- Create: `src/components/JsonLd.tsx`

**Step 1: Create the component**

```typescript
// src/components/JsonLd.tsx
interface JsonLdProps {
  data: object | object[];
}

export default function JsonLd({ data }: JsonLdProps) {
  const schemas = Array.isArray(data) ? data : [data];
  return (
    <>
      {schemas.map((schema, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(schema),
          }}
        />
      ))}
    </>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/JsonLd.tsx
git commit -m "feat: add JsonLd component for structured data rendering"
```

---

### Task 4: Create RelatedTools component

**Files:**
- Create: `src/components/RelatedTools.tsx`

**Step 1: Create the component**

This component must match the existing visual style used in pages like `base64-encoder/page.tsx` (lines 291-308): dark slate cards with blue text, grid layout.

```typescript
// src/components/RelatedTools.tsx
import { getRelatedTools } from "@/lib/related-tools";

interface RelatedToolsProps {
  currentSlug: string;
}

export default function RelatedTools({ currentSlug }: RelatedToolsProps) {
  const tools = getRelatedTools(currentSlug, 4);

  if (tools.length === 0) return null;

  return (
    <div className="bg-slate-800 rounded-lg p-6 mt-8 mb-6">
      <h2 className="text-xl font-semibold mb-4">Related Tools</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {tools.map((tool) => (
          <a
            key={tool.slug}
            href={`/tools/${tool.slug}`}
            className="bg-slate-700/50 hover:bg-slate-700 rounded p-3 transition-colors block"
          >
            <div className="font-medium text-blue-400 text-sm">
              {tool.name}
            </div>
            <div className="text-xs text-slate-400 mt-1">
              {tool.description}
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/RelatedTools.tsx
git commit -m "feat: add RelatedTools component with manifest-driven links"
```

---

### Task 5: Add Organization + WebSite JSON-LD to homepage

**Files:**
- Modify: `src/app/layout.tsx`

**Step 1: Add JSON-LD to the root layout**

In `src/app/layout.tsx`, add imports and the JSON-LD script tags inside `<head>`:

After line 3 (`import "./globals.css";`), add:
```typescript
import { generateOrgSchema, generateWebSiteSchema } from "@/lib/jsonld";
```

Inside the `<head>` tag (after the GA4 config script, before `</head>`), add:
```tsx
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(generateOrgSchema()),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(generateWebSiteSchema()),
          }}
        />
```

**Step 2: Verify build works**

Run: `cd /Users/liamfrazer/projects/micro-tools && npm run build 2>&1 | tail -20`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add src/app/layout.tsx
git commit -m "feat: add Organization and WebSite JSON-LD to root layout"
```

---

### Task 6: Update all 48 tool pages — batch with subagents

**Files:**
- Modify: All 48 files in `src/app/tools/*/page.tsx`

**Context for each page update:**

Each tool page needs these changes:

1. **Add imports** at the top (after existing imports):
```typescript
import JsonLd from "@/components/JsonLd";
import RelatedTools from "@/components/RelatedTools";
import {
  generateFAQSchema,
  generateWebAppSchema,
  generateBreadcrumbSchema,
} from "@/lib/jsonld";
```

2. **Add JSON-LD tags** — right after `<title>` and `<meta name="description">`, add:
```tsx
      <JsonLd
        data={[
          generateWebAppSchema({
            slug: "TOOL_SLUG",
            name: "TOOL_NAME",
            description: "TOOL_DESCRIPTION",
            category: "TOOL_CATEGORY",
          }),
          generateBreadcrumbSchema({
            slug: "TOOL_SLUG",
            name: "TOOL_NAME",
            description: "TOOL_DESCRIPTION",
            category: "TOOL_CATEGORY",
          }),
          generateFAQSchema([
            { question: "EXISTING Q1", answer: "EXISTING A1" },
            { question: "EXISTING Q2", answer: "EXISTING A2" },
            // ... extract from existing FAQ section
          ]),
        ]}
      />
```

3. **Replace hardcoded Related Tools** (if present) with:
```tsx
      <RelatedTools currentSlug="TOOL_SLUG" />
```

4. **Add RelatedTools** (if missing) — place it just before the FAQ section.

**How to extract FAQ data:** Each page has an FAQ section with `<h3>` questions and `<p>` answers. Extract the text content from each Q&A pair into the `generateFAQSchema` call. Strip HTML entities (convert `&ldquo;` etc to plain quotes).

**Execution strategy:** Split into 4 batches of 12 tools each. Use parallel subagents per batch.

**Batch 1 — Developer tools A-J (12 tools):**
base64-encoder, cron-expression-parser, css-minifier, diff-checker, hash-generator, html-beautifier, html-entity-encoder, javascript-minifier, json-formatter, json-path-tester, json-schema-validator, json-to-csv

**Batch 2 — Developer tools J-Z + Text (12 tools):**
json-to-yaml, jwt-decoder, markdown-editor, markdown-to-html, password-generator, regex-tester, sql-formatter, timestamp-converter, url-encoder, uuid-generator, xml-formatter, yaml-formatter

**Batch 3 — Text + Conversion tools (12 tools):**
word-counter, text-case-converter, lorem-ipsum-generator, character-map, emoji-picker, toml-formatter, csv-to-json, number-base-converter, tailwind-css-converter, image-compressor, image-format-converter, image-resizer

**Batch 4 — Design + Remaining tools (12 tools):**
color-converter, color-palette-generator, color-picker-from-image, css-gradient-generator, qr-code-generator, svg-to-png, placeholder-image-generator, aspect-ratio-calculator, box-shadow-generator, border-radius-generator, barcode-generator, ip-address-lookup

**Step for each batch:**
1. Read each page.tsx
2. Add imports
3. Add `<JsonLd>` with extracted FAQ data + tool metadata
4. Replace/add `<RelatedTools currentSlug="..." />`
5. Remove hardcoded related tools section if present

**After all batches, commit:**

```bash
git add src/app/tools/
git commit -m "feat: add JSON-LD structured data and auto-generated related tools to all 48 tool pages"
```

---

### Task 7: Build verification and final check

**Step 1: Run the build**

Run: `cd /Users/liamfrazer/projects/micro-tools && npm run build 2>&1 | tail -30`
Expected: Build succeeds with all 48 tool pages + homepage

**Step 2: Spot-check JSON-LD in built output**

Run: `grep -l "application/ld+json" /Users/liamfrazer/projects/micro-tools/.next/server/app/tools/json-formatter.html 2>/dev/null || echo "Check .next output for ld+json"`

**Step 3: Verify with Google Rich Results Test**

After deploying, test a few tool URLs at https://search.google.com/test/rich-results to confirm FAQPage, WebApplication, and BreadcrumbList schemas are detected.

**Step 4: Commit any fixes**

```bash
git add -A
git commit -m "fix: address build issues from JSON-LD integration"
```

---

## Execution Notes

- No test framework exists in this project — verification is via `npm run build` and manual spot-checks
- All 48 pages are `"use client"` components, so JSON-LD renders client-side. Google's crawler executes JavaScript, so this is fine for indexing
- The `tools-manifest.json` is the source of truth for tool metadata (slug, name, description, category)
- The existing ToolLayout.tsx component is NOT used by any pages — we're not adopting it to avoid massive page rewrites. Instead, we add minimal imports to existing pages
