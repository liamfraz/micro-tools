#!/usr/bin/env bash
# Ping search engines with sitemap URL and submit via IndexNow.
#
# Google's /ping endpoint is deprecated — use Google Search Console for manual submission.
# Bing's /ping endpoint is deprecated — replaced by IndexNow.
#
# Usage: bash scripts/ping-google.sh

set -euo pipefail

SITEMAP_URL="https://devtools.page/sitemap.xml"

echo "=== Sitemap Ping ==="
echo "Sitemap: $SITEMAP_URL"
echo ""

echo "Google (deprecated, may return 404):"
curl -s -o /dev/null -w "  HTTP %{http_code}\n" "https://www.google.com/ping?sitemap=$SITEMAP_URL"

echo "Bing (deprecated, may return 410):"
curl -s -o /dev/null -w "  HTTP %{http_code}\n" "https://www.bing.com/ping?sitemap=$SITEMAP_URL"

echo ""
echo "=== IndexNow (Bing + Yandex instant indexing) ==="
node "$(dirname "$0")/index-now.js"

echo ""
echo "Tip: For Google, submit sitemap via Search Console:"
echo "  https://search.google.com/search-console/sitemaps"
