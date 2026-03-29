# Google Search Console Setup

## 1. Domain Verification

If not already verified, go to [Google Search Console](https://search.google.com/search-console) and add the property `https://devtools.page`.

Verification options:
- **DNS TXT record** (recommended) — add a TXT record to your domain's DNS
- **HTML file upload** — upload a verification file to the site root
- **HTML meta tag** — add a meta tag to the homepage `<head>`

## 2. Submit Sitemap

1. Go to **Sitemaps** in the left sidebar
2. Enter `sitemap.xml` in the "Add a new sitemap" field
3. Click **Submit**
4. Verify status shows "Success" after Google processes it

The sitemap at `https://devtools.page/sitemap.xml` includes:
- 93 tool pages
- 11 category pages
- Homepage, /tools index, /privacy, /terms

## 3. Request Indexing for Top 10 High-Value Pages

Use **URL Inspection** (top search bar) for each URL below, then click **Request Indexing**.

Google limits indexing requests — do these first as they have the highest search volume potential:

| Priority | URL | Why |
|----------|-----|-----|
| 1 | `https://devtools.page/tools/json-formatter` | Extremely high search volume keyword |
| 2 | `https://devtools.page/tools/password-generator` | High volume, broad audience |
| 3 | `https://devtools.page/tools/qr-code-generator` | High volume, universal use case |
| 4 | `https://devtools.page/tools/uuid-generator` | High dev search volume |
| 5 | `https://devtools.page/tools/regex-tester` | High dev search volume |
| 6 | `https://devtools.page/tools/color-converter` | Broad audience (designers + devs) |
| 7 | `https://devtools.page/tools/base64-encoder` | Strong dev utility keyword |
| 8 | `https://devtools.page/tools/jwt-decoder` | High intent dev keyword |
| 9 | `https://devtools.page/tools/hash-generator` | Strong dev + security keyword |
| 10 | `https://devtools.page/tools/word-counter` | High volume, broad non-dev audience |

## 4. Optional Follow-ups

- **Check Coverage report** after 48-72 hours to see which pages Google has discovered
- **Monitor Performance** tab for impressions and clicks
- **Submit to Bing Webmaster Tools** at https://www.bing.com/webmasters — same sitemap URL works
- Consider submitting via **IndexNow** (already have `/IndexNow-key.txt`) for faster Bing/Yandex indexing
