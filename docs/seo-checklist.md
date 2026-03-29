# SEO & Monetisation Checklist — devtools.page

## 1. Google Search Console (GSC)

### Verify Domain Ownership
1. Go to https://search.google.com/search-console
2. Add property → select "URL prefix" → enter `https://devtools.page`
3. Verification should auto-pass — the HTML meta tag is already in `layout.tsx`:
   ```
   verification: { google: "6IQzjMi4CJbMgDMuMo3dJHxD_WBwxNCM6mA-n7eMQKY" }
   ```
4. If it fails, use the "HTML tag" method and confirm the tag matches

### Submit Sitemap
1. In GSC → Sitemaps (left sidebar)
2. Enter `sitemap.xml` and click Submit
3. The sitemap is dynamically generated at `https://devtools.page/sitemap.xml`
4. It includes the homepage, privacy page, terms page, and all 53+ tool pages

### Monitor Indexing
1. GSC → Pages → check "Why pages aren't indexed"
2. Common issues to watch for:
   - "Discovered — currently not indexed" → wait, or use URL Inspection to request indexing
   - "Crawled — currently not indexed" → check page quality, thin content
   - "Duplicate without user-selected canonical" → verify canonical tags
3. Use URL Inspection tool to request indexing for priority pages
4. Check Coverage report weekly for the first month

## 2. Google AdSense

### Apply for AdSense
1. Go to https://www.google.com/adsense/start/
2. Sign in with a Google account
3. Enter site URL: `https://devtools.page`
4. AdSense script is already loaded in `layout.tsx` via `NEXT_PUBLIC_ADSENSE_ID`
5. `ads.txt` is already configured in `public/ads.txt` with publisher ID

### Configure Ad Units
1. Once approved, go to AdSense dashboard → Ads → By ad unit
2. Create two ad units:
   - **Top unit** (horizontal banner): Copy the `data-ad-slot` value
   - **Bottom unit** (responsive): Copy the `data-ad-slot` value
3. Replace `"TOP_SLOT"` and `"BOTTOM_SLOT"` in `src/components/ToolLayout.tsx` with real slot IDs
4. Alternatively, use AdSense Auto Ads for automatic placement

### Environment Variable
- Set `NEXT_PUBLIC_ADSENSE_ID` in your Vercel project settings:
  - Value: `ca-pub-5516095417661827`
- The AdSense script and ad units only render when this env var is set

## 3. Technical SEO Verification

### Already Implemented
- [x] Dynamic `sitemap.xml` with all live tools (src/app/sitemap.ts)
- [x] Dynamic `robots.txt` allowing all crawlers, disallowing /api/ (src/app/robots.ts)
- [x] Canonical URLs on every page via `alternates.canonical`
- [x] Open Graph + Twitter Card meta tags on all pages
- [x] Dynamic OG images per tool (src/app/api/og/route.tsx)
- [x] JSON-LD structured data: Organization, WebSite (layout), WebApplication + BreadcrumbList (each tool)
- [x] Google Search Console verification meta tag
- [x] Google Analytics (GA4: G-ZLF2PP7RR1)
- [x] Security headers (HSTS, X-Content-Type-Options, X-Frame-Options, Referrer-Policy)
- [x] Custom 404 page with navigation
- [x] Privacy Policy page
- [x] Terms of Service page
- [x] ads.txt with Google publisher ID

### Post-Launch Checks
- [ ] Verify sitemap loads at https://devtools.page/sitemap.xml
- [ ] Test robots.txt at https://devtools.page/robots.txt
- [ ] Run Google Rich Results Test on a tool page
- [ ] Run PageSpeed Insights on homepage and 2-3 tool pages
- [ ] Verify mobile-friendliness via Google Mobile-Friendly Test
- [ ] Check all tool pages return 200 status codes
- [ ] Verify canonical URLs resolve correctly
- [ ] Test OG images render on social share debuggers (Facebook, Twitter, LinkedIn)

## 4. Ongoing SEO Tasks

### Weekly
- Check GSC for indexing issues
- Review search performance (clicks, impressions, CTR, position)

### Monthly
- Review top-performing pages and optimise underperformers
- Check for broken links
- Monitor Core Web Vitals in GSC

### When Adding New Tools
- Tool is auto-included in sitemap via tools-manifest.json (status: "live")
- JSON-LD WebApplication schema is auto-generated per tool
- OG image is auto-generated per tool
- Submit updated sitemap in GSC after deploy
