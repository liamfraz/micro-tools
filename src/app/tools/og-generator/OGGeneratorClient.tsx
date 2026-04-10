"use client";

import { useState, useCallback } from "react";
import JsonLd from "@/components/JsonLd";
import RelatedTools from "@/components/RelatedTools";
import ToolBreadcrumb from "@/components/ToolBreadcrumb";
import AdUnit from "@/components/AdUnit";
import {
  generateFAQSchema,
  generateWebAppSchema,
  generateBreadcrumbSchema,
} from "@/lib/jsonld";

interface OGData {
  title: string;
  description: string;
  url: string;
  imageUrl: string;
  siteName: string;
  type: "website" | "article" | "product";
  twitterCardType: "summary" | "summary_large_image";
}

function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.replace("www.", "");
  } catch {
    return "example.com";
  }
}

function generateMetaTags(ogData: OGData): string {
  return `<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${ogData.title}</title>
<meta name="description" content="${ogData.description}">

<!-- Open Graph Meta Tags -->
<meta property="og:title" content="${ogData.title}">
<meta property="og:description" content="${ogData.description}">
<meta property="og:url" content="${ogData.url}">
<meta property="og:image" content="${ogData.imageUrl}">
<meta property="og:type" content="${ogData.type}">
<meta property="og:site_name" content="${ogData.siteName}">

<!-- Twitter Card Meta Tags -->
<meta name="twitter:card" content="${ogData.twitterCardType}">
<meta name="twitter:title" content="${ogData.title}">
<meta name="twitter:description" content="${ogData.description}">
<meta name="twitter:image" content="${ogData.imageUrl}">`;
}

export default function OGGeneratorClient() {
  const [ogData, setOgData] = useState<OGData>({
    title: "Awesome Page Title",
    description: "This is an awesome page description that will show up on social media",
    url: "https://example.com/page",
    imageUrl: "https://example.com/image.jpg",
    siteName: "My Website",
    type: "website",
    twitterCardType: "summary_large_image",
  });

  const [copied, setCopied] = useState<string | null>(null);

  const updateOGData = useCallback((key: keyof OGData, value: string) => {
    setOgData((prev) => ({ ...prev, [key]: value }));
  }, []);

  const allTags = generateMetaTags(ogData);
  const domain = extractDomain(ogData.url);

  const copyToClipboard = useCallback(async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(type);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      // fallback for older browsers
      const el = document.createElement("textarea");
      el.value = text;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopied(type);
      setTimeout(() => setCopied(null), 2000);
    }
  }, []);

  const loadExample = useCallback(() => {
    setOgData({
      title: "Best Web Development Tool of 2026",
      description: "Create stunning web applications with our all-in-one developer toolkit",
      url: "https://devtools.page/tools/og-generator",
      imageUrl: "https://devtools.page/og-image.jpg",
      siteName: "DevTools",
      type: "website",
      twitterCardType: "summary_large_image",
    });
  }, []);

  const clearAll = useCallback(() => {
    setOgData({
      title: "",
      description: "",
      url: "https://",
      imageUrl: "",
      siteName: "",
      type: "website",
      twitterCardType: "summary_large_image",
    });
  }, []);

  const ogOnlyTags = allTags
    .split("\n")
    .filter(
      (line) =>
        line.includes("og:") ||
        line.includes("charset") ||
        line.includes("viewport") ||
        line.includes("<title>") ||
        line.includes('name="description"') ||
        line.startsWith("<!-- Open Graph")
    )
    .join("\n");

  const twitterOnlyTags = allTags
    .split("\n")
    .filter((line) => line.includes("twitter:") || line.startsWith("<!-- Twitter"))
    .join("\n");

  return (
    <>
      <JsonLd
        data={[
          generateWebAppSchema({
            slug: "og-generator",
            name: "Open Graph & Meta Tag Generator",
            description:
              "Generate Open Graph and Twitter Card meta tags instantly. Preview how your page looks when shared on social media.",
            category: "developer",
          }),
          generateBreadcrumbSchema({
            slug: "og-generator",
            name: "Open Graph & Meta Tag Generator",
            description:
              "Generate Open Graph and Twitter Card meta tags for social media sharing",
            category: "developer",
          }),
          generateFAQSchema([
            {
              question: "What are Open Graph meta tags?",
              answer:
                "Open Graph (OG) meta tags are HTML elements that control how content is displayed when shared on social platforms like Facebook, LinkedIn, and Discord. They define the title, description, image, and URL that appear in preview cards.",
            },
            {
              question: "What is the difference between og:image and twitter:image?",
              answer:
                "og:image is used by Facebook, LinkedIn, Discord, and other platforms that support Open Graph. twitter:image is specifically for Twitter/X. While they often point to the same image, you can specify different images for different platforms.",
            },
            {
              question: "What image dimensions should I use for og:image?",
              answer:
                "The recommended size is 1200x630 pixels (1.91:1 aspect ratio) for optimal display on most platforms. Minimum size is 600x315 pixels. Keep file size under 8MB. Use JPG or PNG formats for best compatibility.",
            },
            {
              question: "What is og:type and when should I change it?",
              answer:
                'Set og:type to "website" for general pages, "article" for blog posts and news, or "product" for e-commerce items.',
            },
            {
              question: "Which Twitter Card type should I use?",
              answer:
                '"summary" displays a small card with title, description, and thumbnail. "summary_large_image" shows a larger card with a prominent image.',
            },
            {
              question: "Will these meta tags improve my SEO?",
              answer:
                "Meta tags don't directly impact search rankings, but they improve click-through rates by making your content more attractive in social previews.",
            },
            {
              question: "Is my data safe when using this tool?",
              answer:
                "Yes. All tag generation happens entirely in your browser. Nothing is sent to any server. Your content and data never leave your device.",
            },
          ]),
        ]}
      />

      <div className="min-h-screen bg-slate-900 text-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <ToolBreadcrumb slug="og-generator" />

          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
              Open Graph &amp; Meta Tag Generator
            </h1>
            <p className="text-slate-400 max-w-2xl text-lg">
              Generate Open Graph and Twitter Card meta tags instantly. Preview how your page
              looks when shared on social media. Copy ready-to-paste HTML.
            </p>
          </div>

          <AdUnit slot="TOP_SLOT" format="horizontal" className="mb-6" />

          <div className="flex flex-wrap items-center gap-3 mb-6">
            <button
              onClick={loadExample}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors"
            >
              Load Example
            </button>
            <button
              onClick={clearAll}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors"
            >
              Clear All
            </button>
          </div>

          {/* Main Grid: Form + Preview */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Left: Form */}
            <div className="space-y-5">
              {/* Title */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-slate-300">Page Title</label>
                  <span
                    className={`text-xs ${ogData.title.length > 55 ? "text-amber-400" : "text-slate-500"}`}
                  >
                    {ogData.title.length}/60
                  </span>
                </div>
                <input
                  type="text"
                  value={ogData.title}
                  onChange={(e) => updateOGData("title", e.target.value.slice(0, 60))}
                  placeholder="Enter page title"
                  className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-slate-500 mt-1">Recommended: under 60 characters</p>
              </div>

              {/* Description */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-slate-300">Description</label>
                  <span
                    className={`text-xs ${ogData.description.length > 150 ? "text-amber-400" : "text-slate-500"}`}
                  >
                    {ogData.description.length}/160
                  </span>
                </div>
                <textarea
                  value={ogData.description}
                  onChange={(e) => updateOGData("description", e.target.value.slice(0, 160))}
                  placeholder="Enter page description"
                  className="w-full h-24 bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 text-slate-200 placeholder-slate-500 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-slate-500 mt-1">Recommended: under 160 characters</p>
              </div>

              {/* URL */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Page URL</label>
                <input
                  type="url"
                  value={ogData.url}
                  onChange={(e) => updateOGData("url", e.target.value)}
                  placeholder="https://example.com/page"
                  className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Image URL */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Image URL
                </label>
                <input
                  type="url"
                  value={ogData.imageUrl}
                  onChange={(e) => updateOGData("imageUrl", e.target.value)}
                  placeholder="https://example.com/image.jpg"
                  className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-slate-500 mt-1">Recommended: 1200×630px, under 8MB</p>
              </div>

              {/* Site Name */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Site Name
                </label>
                <input
                  type="text"
                  value={ogData.siteName}
                  onChange={(e) => updateOGData("siteName", e.target.value)}
                  placeholder="My Website"
                  className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Type */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Content Type
                </label>
                <select
                  value={ogData.type}
                  onChange={(e) => updateOGData("type", e.target.value as OGData["type"])}
                  className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="website">Website</option>
                  <option value="article">Article / Blog Post</option>
                  <option value="product">Product</option>
                </select>
              </div>

              {/* Twitter Card Type */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Twitter Card Type
                </label>
                <select
                  value={ogData.twitterCardType}
                  onChange={(e) =>
                    updateOGData("twitterCardType", e.target.value as OGData["twitterCardType"])
                  }
                  className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="summary">Summary (Small Card)</option>
                  <option value="summary_large_image">Summary Large Image</option>
                </select>
              </div>
            </div>

            {/* Right: Social Previews */}
            <div className="space-y-6">
              {/* Facebook Preview */}
              <div>
                <h3 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
                  <span className="inline-block w-3 h-3 rounded-full bg-blue-600"></span>
                  Facebook / Open Graph Preview
                </h3>
                <div className="rounded-lg overflow-hidden border border-slate-600 max-w-sm">
                  <div className="bg-slate-600 h-44 flex items-center justify-center overflow-hidden">
                    {ogData.imageUrl ? (
                      <img
                        src={ogData.imageUrl}
                        alt="OG preview"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).style.display = "none";
                        }}
                      />
                    ) : (
                      <span className="text-slate-400 text-sm">No image set</span>
                    )}
                  </div>
                  <div className="p-3 bg-slate-100">
                    <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">
                      {domain}
                    </p>
                    <p className="text-sm font-bold text-slate-900 leading-tight line-clamp-2">
                      {ogData.title || "Page Title"}
                    </p>
                    <p className="text-xs text-slate-600 mt-1 line-clamp-2">
                      {ogData.description || "Page description will appear here"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Twitter Preview */}
              <div>
                <h3 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
                  <span className="inline-block w-3 h-3 rounded-full bg-sky-400"></span>
                  Twitter / X Preview
                </h3>
                <div className="rounded-2xl overflow-hidden border border-slate-600 max-w-sm">
                  {ogData.twitterCardType === "summary_large_image" ? (
                    <div className="bg-slate-600 h-44 flex items-center justify-center overflow-hidden">
                      {ogData.imageUrl ? (
                        <img
                          src={ogData.imageUrl}
                          alt="Twitter preview"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).style.display = "none";
                          }}
                        />
                      ) : (
                        <span className="text-slate-400 text-sm">No image set</span>
                      )}
                    </div>
                  ) : null}
                  <div
                    className={`p-3 bg-slate-900 border-t border-slate-700 ${ogData.twitterCardType === "summary" ? "flex gap-3 items-center" : ""}`}
                  >
                    {ogData.twitterCardType === "summary" && (
                      <div className="bg-slate-600 w-16 h-16 flex-shrink-0 rounded overflow-hidden flex items-center justify-center">
                        {ogData.imageUrl ? (
                          <img
                            src={ogData.imageUrl}
                            alt="Twitter thumbnail"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).style.display = "none";
                            }}
                          />
                        ) : null}
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-bold text-white leading-tight line-clamp-1">
                        {ogData.title || "Page Title"}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">
                        {ogData.description || "Page description will appear here"}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">{domain}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <AdUnit slot="MIDDLE_SLOT" format="rectangle" className="mb-8" />

          {/* Generated Tags Output */}
          <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden mb-6">
            <div className="px-4 py-3 border-b border-slate-700 flex items-center justify-between">
              <h2 className="text-base font-semibold text-white">Generated Meta Tags</h2>
              <button
                onClick={() => copyToClipboard(allTags, "all")}
                className="px-3 py-1 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded font-medium transition-colors"
              >
                {copied === "all" ? "Copied!" : "Copy All"}
              </button>
            </div>
            <pre className="p-4 bg-slate-950 text-slate-300 font-mono text-xs overflow-x-auto leading-relaxed">
              {allTags}
            </pre>
          </div>

          {/* Quick Copy Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
            <button
              onClick={() => copyToClipboard(allTags, "all")}
              className="px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
            >
              {copied === "all" ? "Copied All Tags!" : "Copy All Tags"}
            </button>
            <button
              onClick={() => copyToClipboard(ogOnlyTags, "og")}
              className="px-4 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-semibold transition-colors"
            >
              {copied === "og" ? "Copied OG Tags!" : "Copy OG Only"}
            </button>
            <button
              onClick={() => copyToClipboard(twitterOnlyTags, "twitter")}
              className="px-4 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-semibold transition-colors"
            >
              {copied === "twitter" ? "Copied Twitter Tags!" : "Copy Twitter Only"}
            </button>
          </div>

          <RelatedTools currentSlug="og-generator" />

          <AdUnit slot="BOTTOM_SLOT" format="auto" className="my-8" />

          {/* FAQ */}
          <section className="mt-16 border-t border-slate-700 pt-10">
            <h2 className="text-2xl font-bold text-white mb-6">Frequently Asked Questions</h2>
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  What are Open Graph meta tags?
                </h3>
                <p className="text-slate-400">
                  Open Graph (OG) meta tags are HTML elements that control how content is
                  displayed when shared on social platforms like Facebook, LinkedIn, and Discord.
                  They define the title, description, image, and URL that appear in preview cards.
                  Without OG tags, platforms use generic defaults which may not represent your
                  content accurately.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  What is the difference between og:image and twitter:image?
                </h3>
                <p className="text-slate-400">
                  og:image is used by Facebook, LinkedIn, Discord, and other platforms that
                  support Open Graph. twitter:image is specifically for Twitter/X. While they
                  often point to the same image, you can specify different images to optimize for
                  each platform&apos;s audience and dimensions.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  What image dimensions should I use for og:image?
                </h3>
                <p className="text-slate-400">
                  The recommended size is 1200×630 pixels (1.91:1 aspect ratio) for optimal
                  display on most platforms. Minimum is 600×315 pixels. Keep file size under 8MB
                  and use JPG or PNG for best compatibility.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  What is og:type and when should I change it?
                </h3>
                <p className="text-slate-400">
                  Set og:type to &quot;website&quot; for general pages, &quot;article&quot; for
                  blog posts and news, or &quot;product&quot; for e-commerce items. The type tells
                  platforms how to interpret and display your content.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Which Twitter Card type should I use?
                </h3>
                <p className="text-slate-400">
                  Use &quot;summary&quot; for a small card with title, description, and thumbnail.
                  Use &quot;summary_large_image&quot; for a larger card with a prominent image —
                  ideal if you have an eye-catching visual.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  How do I test my meta tags?
                </h3>
                <p className="text-slate-400">
                  After adding tags to your HTML, use platform-specific debugging tools: Facebook
                  Sharing Debugger, Twitter Card Validator, and LinkedIn Post Inspector. These
                  tools show exactly how your content appears when shared and highlight any issues.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Will these meta tags improve my SEO?
                </h3>
                <p className="text-slate-400">
                  Meta tags don&apos;t directly impact search rankings, but they improve
                  click-through rates by making your content more attractive in social previews.
                  This increased engagement indirectly benefits SEO.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Is my data safe when using this tool?
                </h3>
                <p className="text-slate-400">
                  Yes. All tag generation happens entirely in your browser using JavaScript. No
                  data is sent to any server. Your content and URLs never leave your device.
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
