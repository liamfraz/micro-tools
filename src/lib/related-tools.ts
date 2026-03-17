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

  const sameCategory = liveTools.filter(
    (t) => t.category === current.category && t.slug !== currentSlug
  );

  if (sameCategory.length >= count) {
    return sameCategory.slice(0, count);
  }

  const others = liveTools.filter(
    (t) => t.category !== current.category && t.slug !== currentSlug
  );
  return [...sameCategory, ...others].slice(0, count);
}
