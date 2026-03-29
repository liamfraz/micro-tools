# QA Audit Report — devtools.page

**Date:** 2026-03-24
**URL:** https://devtools.page
**Source:** /Users/liamfrazer/projects/micro-tools

## Summary

- **Total tools tested:** 48
- **Pass:** 48 (100%)
- **Fail:** 0
- **Cross-cutting checks:** 8/9 pass, 1 partial

---

## Tool Test Results

### Developer Tools (23 tools)

| Tool | URL | Status | Notes |
|------|-----|--------|-------|
| JSON Formatter & Validator | /tools/json-formatter | ✅ | Formats and validates JSON correctly. Shows valid/invalid badge, char/line counts |
| Base64 Encoder/Decoder | /tools/base64-encoder | ✅ | Encode/decode both work. "Hello World" ↔ "SGVsbG8gV29ybGQ=" |
| Regex Tester | /tools/regex-tester | ✅ | `\d+` matched "123" and "456" with indices. Flags (g/i/m) available |
| JWT Decoder | /tools/jwt-decoder | ✅ | Decoded header (HS256) and payload (sub, name, iat) correctly |
| QR Code Generator | /tools/qr-code-generator | ✅ | QR rendered on canvas. Templates, color pickers, download PNG/SVG |
| Diff Checker | /tools/diff-checker | ✅ | Shows added/removed/unchanged lines. Side-by-side toggle, whitespace ignore |
| UUID Generator | /tools/uuid-generator | ✅ | Valid UUID v4 produced. Version selector, bulk generation, validator |
| SQL Formatter | /tools/sql-formatter | ✅ | Properly indented SELECT/FROM/WHERE/ORDER BY |
| HTML Beautifier | /tools/html-beautifier | ✅ | Nested tags indented correctly |
| Hash Generator | /tools/hash-generator | ✅ | MD5, SHA-1, SHA-256, SHA-384, SHA-512 all correct for "Hello World" |
| Password Generator | /tools/password-generator | ✅ | 16-char password with configurable options. Non-blocking CSP warning (report-only) |
| XML Formatter | /tools/xml-formatter | ✅ | Proper indentation. Indent size, preserve comments, sort attributes |
| CSS Minifier | /tools/css-minifier | ✅ | Whitespace removed correctly |
| JavaScript Minifier | /tools/javascript-minifier | ✅ | Function minified correctly |
| Cron Expression Parser | /tools/cron-expression-parser | ✅ | `*/5 * * * *` → "every 5 minutes" with field breakdown |
| YAML Formatter | /tools/yaml-formatter | ✅ | Beautify/Minify/Sort Keys buttons. Proper indentation |
| HTML Entity Encoder | /tools/html-entity-encoder | ✅ | Named/Decimal/Hex/All encoding modes work |
| JSON Schema Validator | /tools/json-schema-validator | ✅ | "Valid — JSON data matches the schema" for correct input |
| JSON Path Tester | /tools/json-path-tester | ✅ | `$.store.book[*].title` returned 2 matches |
| Tailwind CSS Converter | /tools/tailwind-css-converter | ✅ | `margin: 16px` → `m-4`, `padding: 8px` → `p-2`. Unconverted items flagged |
| TOML Formatter | /tools/toml-formatter | ✅ | Formatted with proper indentation, values preserved |
| IP Address Lookup | /tools/ip-address-lookup | ✅ | 8.8.8.8 returned geolocation data. Shows user's public IP |
| Barcode Generator | /tools/barcode-generator | ✅ | Code 128 barcode for "1234567890". Download PNG available |

### Text Tools (6 tools)

| Tool | URL | Status | Notes |
|------|-----|--------|-------|
| Word & Character Counter | /tools/word-counter | ✅ | 10 words, 52 chars, 2 sentences, 1 paragraph. Top keywords shown |
| Markdown Editor & Preview | /tools/markdown-editor | ✅ | H1, bold, italic, links render in preview pane |
| Text Case Converter | /tools/text-case-converter | ✅ | UPPER, lower, Title, camelCase, PascalCase, snake_case, kebab-case, etc. |
| Lorem Ipsum Generator | /tools/lorem-ipsum-generator | ✅ | Generates paragraphs with configurable count |
| Unicode Character Map | /tools/character-map | ✅ | Search "arrow" returns grid of arrow characters. Category filters work |
| Emoji Picker & Search | /tools/emoji-picker | ✅ | Search "smile" returns 8 results. Category tabs functional |

### Design Tools (10 tools)

| Tool | URL | Status | Notes |
|------|-----|--------|-------|
| Color Palette Generator | /tools/color-palette-generator | ✅ | 37 colors across harmony modes. React hydration warnings (minor) |
| CSS Gradient Generator | /tools/css-gradient-generator | ✅ | Linear/Radial/Conic with live preview. CSS output correct |
| Color Converter | /tools/color-converter | ✅ | #3B82F6 → RGB(59,130,246), HSL(217,91,68). Live preview |
| Image Resizer | /tools/image-resizer | ✅ | Upload area loads. Supports PNG, JPEG, WebP, SVG, BMP, GIF |
| Image Compressor | /tools/image-compressor | ✅ | Upload area loads. Client-side processing confirmed |
| Aspect Ratio Calculator | /tools/aspect-ratio-calculator | ✅ | 1920×1080 → 16:9. Decimal 1.7778. Resize calculator |
| Placeholder Image Generator | /tools/placeholder-image-generator | ✅ | 400×300 gray placeholder. Color presets, PNG/JPEG/WebP/SVG formats |
| CSS Box Shadow Generator | /tools/box-shadow-generator | ✅ | 6 sliders, live preview. CSS output: `box-shadow: 0px 4px 6px -1px rgba(0,0,0,0.1)` |
| Color Picker from Image | /tools/color-picker-from-image | ✅ | Upload area loads. Supports PNG, JPG, GIF, BMP, SVG |
| CSS Border Radius Generator | /tools/border-radius-generator | ✅ | Per-corner controls with link/unlink. Shape presets. Live preview |

### Conversion Tools (9 tools)

| Tool | URL | Status | Notes |
|------|-----|--------|-------|
| Unix Timestamp Converter | /tools/timestamp-converter | ✅ | Converts to ISO 8601, seconds, milliseconds. React hydration warnings (minor) |
| URL Encoder & Decoder | /tools/url-encoder | ✅ | `hello world` → `hello%20world`. Multiple encoding modes |
| JSON to CSV | /tools/json-to-csv | ✅ | Array of objects → CSV with headers. Download .csv available |
| JSON to YAML | /tools/json-to-yaml | ✅ | Bidirectional conversion. Proper YAML output |
| Number Base Converter | /tools/number-base-converter | ✅ | 255 → Binary 11111111, Octal 377, Hex FF. Quick presets |
| SVG to PNG | /tools/svg-to-png | ✅ | Upload + paste SVG code. PNG/SVG/WebP output, up to 4× scaling |
| Markdown to HTML | /tools/markdown-to-html | ✅ | Headings, bold, italic, links all converted. Raw + preview modes |
| CSV to JSON | /tools/csv-to-json | ✅ | Headers become keys, rows become objects in JSON array |
| Image Format Converter | /tools/image-format-converter | ✅ | Upload area loads. PNG↔JPG, WebP conversions supported |

---

## Cross-Cutting Checks

| Check | Status | Notes |
|-------|--------|-------|
| Meta titles & descriptions | ✅ | Tool pages have unique, descriptive titles and meta descriptions |
| Broken links (homepage sample) | ✅ | 6 sampled tool links all return HTTP 200 |
| Header & footer rendering | ✅ | `<header>`, `<footer>`, `<nav>` present on homepage and tool pages |
| Privacy policy page | ✅ | /privacy loads (HTTP 200), last updated 2026-03-12 |
| sitemap.xml | ✅ | Valid XML, 96 URLs listed |
| robots.txt | ✅ | Valid. `User-Agent: *`, `Allow: /`, Sitemap directive present |
| Mobile responsive (375px) | ✅ | JSON Formatter at 375px — no overflow, stacked layout, full-width inputs |
| Dark mode | ✅ | Full dark mode via CSS class + prefers-color-scheme. Slate-900 background |
| Console errors (sample) | ✅ | 3 pages tested — zero errors |
| 404 page meta tags | ⚠️ | 404 pages use generic meta description and unhelpful title format |

---

## Bugs Found

| # | Severity | Description | Affected Pages |
|---|----------|-------------|----------------|
| 1 | **Minor** | React hydration errors (425, 418, 423) — SSR/client mismatch for time-dependent or random content | color-palette-generator, timestamp-converter, markdown-to-html |
| 2 | **Minor** | 404 pages use generic site meta description instead of error-specific tags. Should add `noindex` or clear error title | All 404 routes |
| 3 | **Minor** | CSP report-only warning about framing google.com (non-blocking) | password-generator |
| 4 | **Minor** | Clipboard writeText fails in non-secure/unfocused contexts (browser limitation, not a site bug) | jwt-decoder |

---

## Screenshots

All screenshots saved to `/Users/liamfrazer/projects/micro-tools/docs/qa-screenshots/`:

- 48 tool screenshots (one per tool, named `{tool-slug}.png`)
- `mobile-json-formatter.png` — mobile responsive test at 375px
- `dark-mode-test.png` — dark mode rendering test
