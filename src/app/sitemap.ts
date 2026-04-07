import { MetadataRoute } from "next";
import { readdirSync, existsSync } from "fs";
import { join } from "path";
import manifest from "@/lib/tools-manifest.json";

const BASE_URL = "https://devtools.page";

const categories = Object.keys(manifest.categories);

function discoverToolSlugs(): string[] {
  const toolsDir = join(process.cwd(), "src/app/tools");
  const dirs = readdirSync(toolsDir, { withFileTypes: true })
    .filter(
      (d) =>
        d.isDirectory() &&
        d.name !== "category" &&
        existsSync(join(toolsDir, d.name, "page.tsx"))
    )
    .map((d) => d.name);
  return dirs;
}

export default function sitemap(): MetadataRoute.Sitemap {
  const manifestSlugs = new Map(
    manifest.tools
      .filter((tool) => tool.status === "live")
      .map((tool) => [tool.slug, tool])
  );

  const allSlugs = new Set([
    ...Array.from(manifestSlugs.keys()),
    ...discoverToolSlugs(),
  ]);

  const toolPages = Array.from(allSlugs)
    .sort()
    .map((slug) => {
      const tool = manifestSlugs.get(slug);
      return {
        url: `${BASE_URL}/tools/${slug}`,
        lastModified: tool ? new Date(tool.dateAdded) : new Date(),
        changeFrequency: "weekly" as const,
        priority: 0.8,
      };
    });

  const categoryPages = categories.map((category) => ({
    url: `${BASE_URL}/tools/category/${category}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.9,
  }));

  return [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${BASE_URL}/tools`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/about`,
      lastModified: new Date("2026-04-07"),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/blog`,
      lastModified: new Date("2026-04-07"),
      changeFrequency: "weekly" as const,
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/blog/what-is-base64-encoding`,
      lastModified: new Date("2026-04-07"),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/blog/json-guide-for-developers`,
      lastModified: new Date("2026-04-07"),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/blog/css-tools-every-developer-should-know`,
      lastModified: new Date("2026-04-07"),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/blog/regular-expressions-practical-guide`,
      lastModified: new Date("2026-04-07"),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/blog/url-encoding-explained`,
      lastModified: new Date("2026-04-07"),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/privacy`,
      lastModified: new Date("2026-03-12"),
      changeFrequency: "yearly" as const,
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/terms`,
      lastModified: new Date("2026-03-26"),
      changeFrequency: "yearly" as const,
      priority: 0.3,
    },
    ...categoryPages,
    ...toolPages,
  ];
}
