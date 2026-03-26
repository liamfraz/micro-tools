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
  "url-encoder": ["base64-encoder"],
  "base64-encoder": ["url-encoder", "hash-generator"],
  "color-converter": ["color-palette-generator", "css-gradient-generator"],
  "color-palette-generator": ["color-converter", "css-gradient-generator"],
  "css-gradient-generator": ["color-converter", "color-palette-generator"],
  "image-resizer": ["image-compressor", "image-format-converter", "image-cropper"],
  "image-compressor": ["image-resizer", "image-format-converter", "image-cropper"],
  "image-format-converter": ["image-resizer", "image-compressor", "image-cropper"],
  "image-cropper": ["image-resizer", "image-compressor", "image-format-converter"],
  "code-to-image": ["image-format-converter", "image-compressor"],
  "slug-generator": ["url-encoder", "text-case-converter"],
  "hash-generator": ["password-generator", "base64-encoder"],
  "password-generator": ["hash-generator"],
  "html-beautifier": ["css-minifier", "javascript-minifier"],
  "css-minifier": ["html-beautifier", "javascript-minifier"],
  "javascript-minifier": ["html-beautifier", "css-minifier"],
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

  // Reserve 1-2 slots for cross-category tools when available
  const crossCount = Math.min(crossTools.length, 2);
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
