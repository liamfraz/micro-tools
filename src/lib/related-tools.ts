import manifest from "@/lib/tools-manifest.json";

const liveTools = manifest.tools.filter((t) => t.status === "live");

export interface RelatedTool {
  slug: string;
  name: string;
  description: string;
  category: string;
}

/**
 * Cross-category semantic relationships between tools.
 * Each key maps to slugs of tools in OTHER categories that are semantically related.
 */
const crossCategoryLinks: Record<string, string[]> = {
  "json-tree-viewer": ["json-to-csv", "json-to-yaml"],
  "json-formatter": ["json-to-csv", "json-to-yaml", "json-path-tester", "json-tree-viewer"],
  "csv-to-json": ["json-formatter", "json-to-csv"],
  "json-to-csv": ["json-formatter", "csv-to-json"],
  "json-to-yaml": ["json-formatter"],
  "json-path-tester": ["json-formatter", "json-tree-viewer"],
  "markdown-editor": ["markdown-to-html"],
  "markdown-to-html": ["markdown-editor"],
  "url-encoder": ["base64-encoder", "url-encode-decode"],
  "url-encode-decode": ["base64-encoder", "url-encoder", "hash-generator"],
  "base64-encoder": ["url-encoder", "url-encode-decode", "hash-generator"],
  "color-picker": ["color-converter", "color-palette-generator", "css-gradient-generator"],
  "color-converter": ["color-picker", "color-palette-generator", "css-gradient-generator"],
  "color-palette-generator": ["color-picker", "color-converter", "css-gradient-generator"],
  "css-gradient-generator": ["color-converter", "color-palette-generator", "box-shadow-generator", "css-glassmorphism-generator"],
  "image-resizer": ["image-compressor", "image-format-converter", "image-cropper"],
  "image-compressor": ["image-resizer", "image-format-converter", "image-cropper"],
  "image-format-converter": ["image-resizer", "image-compressor", "image-cropper"],
  "image-cropper": ["image-resizer", "image-compressor", "image-format-converter"],
  "code-to-image": ["image-format-converter", "image-compressor"],
  "slug-generator": ["url-encoder", "text-case-converter"],
  "hash-generator": ["password-generator", "base64-encoder"],
  "password-generator": ["hash-generator", "password-strength-checker"],
  "password-strength-checker": ["password-generator", "hash-generator"],
  "html-beautifier": ["css-minifier", "javascript-minifier"],
  "css-minifier": ["html-beautifier", "javascript-minifier"],
  "javascript-minifier": ["html-beautifier", "css-minifier"],
  "html-entity": ["html-entity-encoder", "url-encoder", "base64-encoder"],
  "html-entity-encoder": ["url-encoder", "html-beautifier", "base64-encoder"],
  "og-meta-tag-generator": ["html-entity-encoder", "html-beautifier", "markdown-to-html", "url-encoder"],
  "cron-expression-generator": ["cron-expression-parser", "regex-tester", "timestamp-converter"],
  "cron-expression-parser": ["cron-expression-generator", "regex-tester", "timestamp-converter"],
  "regex-tester": ["json-path-tester", "slug-generator"],
  "qr-code-generator": ["barcode-generator", "base64-encoder"],
  "barcode-generator": ["qr-code-generator"],
  "lorem-ipsum-generator": ["word-counter", "text-case-converter", "password-generator", "slug-generator"],
  "compound-interest-calculator": ["roi-calculator", "profit-margin-calculator"],
  "salary-to-hourly-calculator": ["tip-calculator", "invoice-generator"],
  "roi-calculator": ["compound-interest-calculator", "profit-margin-calculator"],
  "markup-calculator": ["roi-calculator", "profit-margin-calculator"],
  "tip-calculator": ["salary-to-hourly-calculator", "markup-calculator"],
  "invoice-generator": ["profit-margin-calculator", "business-name-generator"],
  "profit-margin-calculator": ["markup-calculator", "roi-calculator"],
  "business-name-generator": ["invoice-generator", "ai-prompt-generator"],
  "bmi-calculator": ["calorie-calculator", "body-fat-calculator", "macro-calculator"],
  "calorie-calculator": ["macro-calculator", "bmi-calculator", "body-fat-calculator"],
  "body-fat-calculator": ["bmi-calculator", "calorie-calculator", "macro-calculator"],
  "macro-calculator": ["calorie-calculator", "body-fat-calculator", "bmi-calculator"],
  "due-date-calculator": ["bmi-calculator", "calorie-calculator"],
  "ai-prompt-generator": ["ai-email-writer", "lorem-ipsum-generator"],
  "ai-email-writer": ["ai-prompt-generator", "ai-meeting-summary-template"],
  "ai-resume-bullet-points": ["ai-prompt-generator", "word-counter"],
  "ai-product-description-generator": ["ai-prompt-generator", "ai-email-writer"],
  "ai-meeting-summary-template": ["ai-email-writer", "word-counter"],
  "ai-paragraph-rewriter": ["word-counter", "text-case-converter"],
  "ai-blog-title-generator": ["ai-prompt-generator", "word-counter"],
  "ai-linkedin-post-generator": ["ai-email-writer", "ai-prompt-generator"],
  "ai-color-palette-generator": ["color-palette-generator", "color-converter", "css-gradient-generator"],
  "ai-meta-description-generator": ["ai-blog-title-generator", "ai-prompt-generator", "word-counter"],
  "ai-regex-generator": ["regex-tester", "ai-prompt-generator"],
  "ai-commit-message-generator": ["ai-prompt-generator", "diff-checker"],
  "ai-privacy-policy-generator": ["ai-email-writer", "business-name-generator", "invoice-generator"],
  "concrete-calculator": ["brick-calculator", "roof-pitch-calculator", "paint-coverage-calculator"],
  "brick-calculator": ["concrete-calculator", "paint-coverage-calculator", "roof-pitch-calculator"],
  "roof-pitch-calculator": ["concrete-calculator", "electrical-cable-size-calculator"],
  "electrical-cable-size-calculator": ["roof-pitch-calculator", "concrete-calculator"],
  "paint-coverage-calculator": ["brick-calculator", "concrete-calculator"],
  "bas-calculator": ["sole-trader-tax-estimator", "abn-lookup"],
  "sole-trader-tax-estimator": ["bas-calculator", "wfh-deduction-calculator", "crypto-tax-calculator-au"],
  "abn-lookup": ["bas-calculator", "sole-trader-tax-estimator"],
  "wfh-deduction-calculator": ["sole-trader-tax-estimator", "bas-calculator"],
  "crypto-tax-calculator-au": ["sole-trader-tax-estimator", "compound-interest-calculator"],
};

export function getRelatedTools(
  currentSlug: string,
  count: number = 4
): RelatedTool[] {
  const current = liveTools.find((t) => t.slug === currentSlug);
  if (!current) return [];

  const sameCategory = liveTools.filter(
    (t) => t.category === current.category && t.slug !== currentSlug
  );

  // Determine how many cross-category tools to include
  const crossSlugs = crossCategoryLinks[currentSlug] ?? [];
  const crossTools = crossSlugs
    .map((slug) => liveTools.find((t) => t.slug === slug))
    .filter(
      (t): t is (typeof liveTools)[number] =>
        t !== undefined && t.category !== current.category
    );

  // Reserve up to 3 slots for cross-category tools when available
  const crossCount = Math.min(crossTools.length, Math.max(2, Math.floor(count / 2)));
  const sameCategoryCount = count - crossCount;

  const samePick = sameCategory.slice(0, sameCategoryCount);
  const crossPick = crossTools.slice(0, crossCount);
  const result = [...samePick, ...crossPick];

  // If we still need more to reach `count`, backfill from same-category or random others
  if (result.length < count) {
    const usedSlugs = new Set(result.map((t) => t.slug));
    usedSlugs.add(currentSlug);

    const remaining = sameCategory.filter((t) => !usedSlugs.has(t.slug));
    const others = liveTools.filter(
      (t) => !usedSlugs.has(t.slug) && t.slug !== currentSlug
    );
    const backfill = [...remaining, ...others].slice(
      0,
      count - result.length
    );
    result.push(...backfill);
  }

  return result.slice(0, count);
}
