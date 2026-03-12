import { MetadataRoute } from "next";
import manifest from "@/lib/tools-manifest.json";

const BASE_URL = "https://micro-tools-lilac.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const toolPages = manifest.tools
    .filter((tool) => tool.status === "live")
    .map((tool) => ({
      url: `${BASE_URL}/tools/${tool.slug}`,
      lastModified: new Date(tool.dateAdded),
      changeFrequency: "monthly" as const,
      priority: 0.8,
    }));

  return [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${BASE_URL}/privacy`,
      lastModified: new Date("2026-03-12"),
      changeFrequency: "yearly" as const,
      priority: 0.3,
    },
    ...toolPages,
  ];
}
