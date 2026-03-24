import type { Metadata } from "next";
import manifest from "@/lib/tools-manifest.json";

export function generateToolMetadata(slug: string): Metadata {
  const tool = manifest.tools.find((t) => t.slug === slug);
  if (!tool) {
    return {};
  }

  const title = tool.name;
  const description = tool.description;
  const url = `https://devtools.page/tools/${slug}`;
  const ogImageUrl = `https://devtools.page/api/og?title=${encodeURIComponent(title)}&description=${encodeURIComponent(description)}`;

  return {
    title,
    description,
    alternates: {
      canonical: `/tools/${slug}`,
    },
    openGraph: {
      title: `${title} | DevTools Hub`,
      description,
      url,
      siteName: "DevTools Hub",
      type: "website",
      locale: "en_US",
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: `${title} - DevTools Hub`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | DevTools Hub`,
      description,
      images: [ogImageUrl],
    },
  };
}
