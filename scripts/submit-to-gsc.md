# Google Search Console Setup for devtools.page

## Step 1: Verify Domain Ownership

### Option A: DNS TXT Record (Recommended — covers all subdomains)

1. Go to [Google Search Console](https://search.google.com/search-console)
2. Click **Add Property** → select **Domain** → enter `devtools.page`
3. Google will give you a TXT record like:
   ```
   google-site-verification=XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
   ```
4. Go to your domain registrar's DNS settings
5. Add a new **TXT** record:
   - **Host/Name**: `@` (or leave blank)
   - **Type**: `TXT`
   - **Value**: paste the verification string from step 3
   - **TTL**: 3600 (or default)
6. Click **Verify** in GSC (may take up to 48 hours, usually minutes)

### Option B: HTML File Upload

1. Go to [Google Search Console](https://search.google.com/search-console)
2. Click **Add Property** → select **URL prefix** → enter `https://devtools.page`
3. Choose **HTML file** verification method
4. Download the `googleXXXXXXXXXXXXXXXX.html` file
5. Place it in `/public/` in the project root
6. Deploy to Vercel: `vercel --prod` or push to main
7. Confirm the file is accessible at `https://devtools.page/googleXXXXXXXXXXXXXXXX.html`
8. Click **Verify** in GSC

## Step 2: Submit the Sitemap

1. In GSC, go to **Sitemaps** (left sidebar)
2. Enter `sitemap.xml` in the "Add a new sitemap" field
3. Click **Submit**
4. The sitemap URL is: `https://devtools.page/sitemap.xml`
5. Verify status shows "Success" (may take a few minutes)

## Step 3: Request Indexing for High-Priority Pages

Use the **URL Inspection** tool in GSC to manually request indexing.
Google allows ~10-20 requests per day, so prioritize by search volume.

### Priority Order (by estimated monthly search volume)

Submit these first — highest traffic potential:

| Priority | URL | Search Volume |
|----------|-----|---------------|
| 1 | `https://devtools.page/tools/bmi-calculator` | ~550K/mo |
| 2 | `https://devtools.page/tools/calorie-calculator` | ~450K/mo |
| 3 | `https://devtools.page/tools/base64-encoder` | ~150K/mo |
| 4 | `https://devtools.page/tools/password-generator` | ~120K/mo |
| 5 | `https://devtools.page/tools/json-formatter` | ~80K/mo |
| 6 | `https://devtools.page/tools/lorem-ipsum-generator` | ~60K/mo |
| 7 | `https://devtools.page/tools/qr-code-generator` | very-high |
| 8 | `https://devtools.page/tools/image-resizer` | very-high |
| 9 | `https://devtools.page/tools/image-compressor` | very-high |
| 10 | `https://devtools.page/tools/image-cropper` | very-high |
| 11 | `https://devtools.page/tools/ip-address-lookup` | very-high |
| 12 | `https://devtools.page/tools/image-format-converter` | very-high |
| 13 | `https://devtools.page/tools/compound-interest-calculator` | very-high |
| 14 | `https://devtools.page/tools/salary-to-hourly-calculator` | very-high |
| 15 | `https://devtools.page/tools/tip-calculator` | very-high |
| 16 | `https://devtools.page/tools/due-date-calculator` | very-high |
| 17 | `https://devtools.page` | (homepage) |
| 18 | `https://devtools.page/tools` | (tools index) |
| 19 | `https://devtools.page/tools/regex-tester` | high |
| 20 | `https://devtools.page/tools/jwt-decoder` | high |

### How to Request Indexing

For each URL above:

1. In GSC, click **URL Inspection** (top search bar)
2. Paste the URL and press Enter
3. Wait for the inspection to complete
4. If it says "URL is not on Google", click **Request Indexing**
5. Wait for the confirmation (takes ~1-2 minutes per URL)
6. Move to the next URL

### Day 2+ (remaining high-volume pages)

After the top 20, continue with these in subsequent days:

- `/tools/diff-checker`
- `/tools/uuid-generator`
- `/tools/timestamp-converter`
- `/tools/sql-formatter`
- `/tools/markdown-editor`
- `/tools/color-converter`
- `/tools/text-case-converter`
- `/tools/svg-to-png`
- `/tools/box-shadow-generator`
- `/tools/border-radius-generator`
- `/tools/emoji-picker`
- `/tools/csv-to-json`
- `/tools/json-to-csv`
- `/tools/xml-formatter`
- `/tools/css-minifier`
- `/tools/javascript-minifier`
- `/tools/html-beautifier`
- `/tools/barcode-generator`
- `/tools/color-picker-from-image`
- `/tools/markdown-to-html`
- `/tools/json-schema-validator`
- `/tools/json-tree-viewer`
- `/tools/code-to-image`
- `/tools/hash-generator`
- `/tools/body-fat-calculator`
- `/tools/macro-calculator`
- `/tools/roi-calculator`
- `/tools/markup-calculator`

## Step 4: Monitor Performance

- Check **Performance** tab in GSC after 3-7 days for impressions
- Check **Coverage** tab for any indexing errors
- Re-submit any pages that show errors after fixing them

## Bonus: IndexNow (Bing/Yandex)

Run the IndexNow script to ping Bing and Yandex for faster indexing:

```bash
node scripts/index-now.js
```

This uses the IndexNow protocol which Bing and Yandex support. Google does not
currently support IndexNow but may in the future.
