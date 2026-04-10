"use client";

import { useState, useCallback, useMemo } from "react";
import AdUnit from "@/components/AdUnit";
import JsonLd from "@/components/JsonLd";
import RelatedTools from "@/components/RelatedTools";
import ToolBreadcrumb from "@/components/ToolBreadcrumb";
import { generateFAQSchema, generateWebAppSchema, generateBreadcrumbSchema } from "@/lib/jsonld";

interface FormData {
  // Required
  title: string;
  description: string;
  url: string;
  image: string;
  siteName: string;
  type: "website" | "article" | "product";
  locale: string;
  twitterCard: "summary" | "summary_large_image";
  // Optional
  author: string;
  publishDate: string;
  modifiedDate: string;
  section: string;
}

interface Validation {
  titleLength: boolean;
  descriptionLength: boolean;
  imageEmpty: boolean;
}

const SAMPLE_DATA: FormData = {
  title: "My Awesome Product | Brand Name",
  description:
    "Discover the best tool for developers. Free, fast, and easy to use. Start building better apps today with our powerful platform.",
  url: "https://example.com/my-page",
  image: "https://example.com/og-image.jpg",
  siteName: "My Brand",
  type: "website",
  locale: "en_US",
  twitterCard: "summary_large_image",
  author: "",
  publishDate: "",
  modifiedDate: "",
  section: "",
};

function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + "...";
}

function getPlatformDomain(url: string): string {
  try {
    const domain = new URL(url).hostname.replace("www.", "");
    return domain;
  } catch {
    return "example.com";
  }
}

export default function OGMetaTagGeneratorPage() {
  const [formData, setFormData] = useState<FormData>(SAMPLE_DATA);
  const [copied, setCopied] = useState(false);

  const handleChange = useCallback(
    (field: keyof FormData, value: string) => {
      setFormData((prev) => ({
        ...prev,
        [field]: value,
      }));
    },
    []
  );

  const validation: Validation = useMemo(() => {
    return {
      titleLength: formData.title.length > 60,
      descriptionLength: formData.description.length > 160,
      imageEmpty: formData.image.trim() === "",
    };
  }, [formData.title, formData.description, formData.image]);

  const warnings = useMemo(() => {
    const w = [];
    if (validation.titleLength) {
      w.push(
        "Title exceeds 60 characters — may be truncated on some platforms"
      );
    }
    if (validation.descriptionLength) {
      w.push(
        "Description exceeds 160 characters — may be truncated by search engines"
      );
    }
    if (validation.imageEmpty) {
      w.push(
        "No image URL provided — social previews will show a placeholder or nothing"
      );
    }
    return w;
  }, [validation]);

  const generatedHTML = useMemo(() => {
    const lines: string[] = [];

    // Title
    lines.push(`<title>${escapeHtml(formData.title)}</title>`);

    // Description
    lines.push(
      `<meta name="description" content="${escapeHtml(formData.description)}" />`
    );

    // Canonical
    lines.push(`<link rel="canonical" href="${escapeHtml(formData.url)}" />`);

    // Author (if provided)
    if (formData.author.trim()) {
      lines.push(`<meta name="author" content="${escapeHtml(formData.author)}" />`);
    }

    // Open Graph
    lines.push(`<meta property="og:title" content="${escapeHtml(formData.title)}" />`);
    lines.push(
      `<meta property="og:description" content="${escapeHtml(formData.description)}" />`
    );
    lines.push(`<meta property="og:url" content="${escapeHtml(formData.url)}" />`);
    lines.push(`<meta property="og:type" content="${escapeHtml(formData.type)}" />`);
    lines.push(`<meta property="og:site_name" content="${escapeHtml(formData.siteName)}" />`);
    lines.push(`<meta property="og:locale" content="${escapeHtml(formData.locale)}" />`);

    // OG Image
    if (formData.image.trim()) {
      lines.push(`<meta property="og:image" content="${escapeHtml(formData.image)}" />`);
      lines.push(`<meta property="og:image:width" content="1200" />`);
      lines.push(`<meta property="og:image:height" content="630" />`);
      lines.push(
        `<meta property="og:image:alt" content="${escapeHtml(formData.title)}" />`
      );
    }

    // Article-specific tags
    if (formData.type === "article") {
      if (formData.publishDate) {
        lines.push(
          `<meta property="article:published_time" content="${escapeHtml(formData.publishDate)}" />`
        );
      }
      if (formData.modifiedDate) {
        lines.push(
          `<meta property="article:modified_time" content="${escapeHtml(formData.modifiedDate)}" />`
        );
      }
      if (formData.section.trim()) {
        lines.push(
          `<meta property="article:section" content="${escapeHtml(formData.section)}" />`
        );
      }
    }

    // Twitter Card
    lines.push(
      `<meta name="twitter:card" content="${escapeHtml(formData.twitterCard)}" />`
    );
    lines.push(`<meta name="twitter:title" content="${escapeHtml(formData.title)}" />`);
    lines.push(
      `<meta name="twitter:description" content="${escapeHtml(formData.description)}" />`
    );
    if (formData.image.trim()) {
      lines.push(`<meta name="twitter:image" content="${escapeHtml(formData.image)}" />`);
    }

    return lines.join("\n");
  }, [formData]);

  const copyToClipboard = useCallback(async () => {
    await navigator.clipboard.writeText(generatedHTML);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }, [generatedHTML]);

  const platformDomain = getPlatformDomain(formData.url);
  const titlePreview = truncateText(formData.title, 60);
  const descPreview = truncateText(formData.description, 160);

  return (
    <div className="min-h-screen bg-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <ToolBreadcrumb slug="og-meta-tag-generator" />

        {/* Header */}
        <div className="mt-6 mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            Open Graph & Meta Tag Generator
          </h1>
          <p className="text-slate-400 text-lg">
            Generate and preview Open Graph and meta tags for social media sharing. See exactly
            how your content will look when shared on Facebook, Twitter, LinkedIn, and more.
          </p>
        </div>

        {/* Top Ad Unit */}
        <div className="mb-8">
          <AdUnit slot="7681" format="horizontal" className="w-full" />
        </div>

        {/* Main Content - Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* LEFT: Form */}
          <div className="space-y-6">
            {/* Required Fields Section */}
            <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
              <h2 className="text-xl font-semibold text-white mb-4">Required Fields</h2>
              <div className="space-y-4">
                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Title
                    <span className="text-slate-500 ml-2">
                      {formData.title.length}/60
                    </span>
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => handleChange("title", e.target.value)}
                    placeholder="Page title for social sharing"
                    className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Description
                    <span className="text-slate-500 ml-2">
                      {formData.description.length}/160
                    </span>
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleChange("description", e.target.value)}
                    placeholder="Brief description for social preview"
                    rows={3}
                    className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </div>

                {/* URL */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    URL
                  </label>
                  <input
                    type="url"
                    value={formData.url}
                    onChange={(e) => handleChange("url", e.target.value)}
                    placeholder="https://example.com/page"
                    className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Image URL */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Image URL
                  </label>
                  <input
                    type="url"
                    value={formData.image}
                    onChange={(e) => handleChange("image", e.target.value)}
                    placeholder="https://example.com/og-image.jpg"
                    className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Recommended: 1200×630px (1.91:1 aspect ratio)
                  </p>
                </div>

                {/* Site Name */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Site Name
                  </label>
                  <input
                    type="text"
                    value={formData.siteName}
                    onChange={(e) => handleChange("siteName", e.target.value)}
                    placeholder="Your brand name"
                    className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Type */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Content Type
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => handleChange("type", e.target.value as any)}
                    className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="website">Website</option>
                    <option value="article">Article</option>
                    <option value="product">Product</option>
                  </select>
                </div>

                {/* Twitter Card */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Twitter Card Type
                  </label>
                  <select
                    value={formData.twitterCard}
                    onChange={(e) => handleChange("twitterCard", e.target.value as any)}
                    className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="summary">Summary</option>
                    <option value="summary_large_image">Summary with Large Image</option>
                  </select>
                </div>

                {/* Locale */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Locale
                  </label>
                  <input
                    type="text"
                    value={formData.locale}
                    onChange={(e) => handleChange("locale", e.target.value)}
                    placeholder="en_US"
                    className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Optional Fields Section */}
            <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
              <h2 className="text-xl font-semibold text-white mb-4">Optional Fields</h2>
              <div className="space-y-4">
                {/* Author */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Author
                  </label>
                  <input
                    type="text"
                    value={formData.author}
                    onChange={(e) => handleChange("author", e.target.value)}
                    placeholder="Author name"
                    className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Publish Date */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Publish Date
                  </label>
                  <input
                    type="date"
                    value={formData.publishDate}
                    onChange={(e) => handleChange("publishDate", e.target.value)}
                    className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Modified Date */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Modified Date
                  </label>
                  <input
                    type="date"
                    value={formData.modifiedDate}
                    onChange={(e) => handleChange("modifiedDate", e.target.value)}
                    className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Section */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Section / Category
                  </label>
                  <input
                    type="text"
                    value={formData.section}
                    onChange={(e) => handleChange("section", e.target.value)}
                    placeholder="Article category (only for articles)"
                    className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: Platform Previews */}
          <div className="space-y-6">
            {/* Facebook Preview */}
            <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
              <div className="bg-slate-700 px-4 py-2 text-xs font-semibold text-slate-300">
                Facebook Preview
              </div>
              <div className="p-4">
                <div className="border border-slate-600 rounded overflow-hidden bg-white text-slate-900">
                  {formData.image ? (
                    <div className="w-full h-40 bg-slate-300 flex items-center justify-center text-xs text-slate-600">
                      <img
                        src={formData.image}
                        alt="Preview"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                    </div>
                  ) : (
                    <div className="w-full h-40 bg-slate-300 flex items-center justify-center text-xs text-slate-600">
                      No Image
                    </div>
                  )}
                  <div className="p-3">
                    <p className="text-xs text-slate-500">{platformDomain}</p>
                    <p className="font-bold text-sm text-slate-900 line-clamp-2">
                      {titlePreview}
                    </p>
                    <p className="text-xs text-slate-600 line-clamp-2">{descPreview}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Twitter/X Preview */}
            <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
              <div className="bg-slate-700 px-4 py-2 text-xs font-semibold text-slate-300">
                Twitter/X Preview
              </div>
              <div className="p-4">
                <div className="border border-slate-600 rounded bg-white text-slate-900 p-3 text-xs">
                  {formData.twitterCard === "summary_large_image" ? (
                    <>
                      {formData.image ? (
                        <div className="w-full h-32 bg-slate-300 rounded mb-2 flex items-center justify-center">
                          <img
                            src={formData.image}
                            alt="Preview"
                            className="w-full h-full object-cover rounded"
                            onError={(e) => {
                              e.currentTarget.style.display = "none";
                            }}
                          />
                        </div>
                      ) : (
                        <div className="w-full h-32 bg-slate-300 rounded mb-2 flex items-center justify-center text-slate-600">
                          No Image
                        </div>
                      )}
                      <p className="font-bold text-sm text-slate-900">{titlePreview}</p>
                      <p className="text-slate-600">{descPreview}</p>
                    </>
                  ) : (
                    <div className="flex gap-2">
                      {formData.image ? (
                        <div className="w-16 h-16 bg-slate-300 rounded flex-shrink-0 flex items-center justify-center">
                          <img
                            src={formData.image}
                            alt="Preview"
                            className="w-full h-full object-cover rounded"
                            onError={(e) => {
                              e.currentTarget.style.display = "none";
                            }}
                          />
                        </div>
                      ) : (
                        <div className="w-16 h-16 bg-slate-300 rounded flex-shrink-0" />
                      )}
                      <div className="flex-1">
                        <p className="font-bold text-sm text-slate-900">{titlePreview}</p>
                        <p className="text-slate-600 text-xs">{descPreview}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* LinkedIn Preview */}
            <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
              <div className="bg-slate-700 px-4 py-2 text-xs font-semibold text-slate-300">
                LinkedIn Preview
              </div>
              <div className="p-4">
                <div className="border border-slate-600 rounded overflow-hidden bg-white text-slate-900">
                  {formData.image ? (
                    <div className="w-full h-32 bg-slate-300 flex items-center justify-center text-xs text-slate-600">
                      <img
                        src={formData.image}
                        alt="Preview"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                    </div>
                  ) : (
                    <div className="w-full h-32 bg-slate-300 flex items-center justify-center text-xs text-slate-600">
                      No Image
                    </div>
                  )}
                  <div className="p-3">
                    <p className="text-xs text-slate-500">{formData.siteName}</p>
                    <p className="font-bold text-sm text-slate-900">{titlePreview}</p>
                    <p className="text-xs text-slate-600">{descPreview}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Discord Preview */}
            <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
              <div className="bg-slate-700 px-4 py-2 text-xs font-semibold text-slate-300">
                Discord Preview
              </div>
              <div className="p-4">
                <div className="flex gap-3 bg-slate-700 rounded p-3 border-l-4 border-blue-500">
                  {formData.image ? (
                    <div className="w-16 h-16 bg-slate-600 rounded flex-shrink-0 flex items-center justify-center">
                      <img
                        src={formData.image}
                        alt="Preview"
                        className="w-full h-full object-cover rounded"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                    </div>
                  ) : (
                    <div className="w-16 h-16 bg-slate-600 rounded flex-shrink-0" />
                  )}
                  <div className="flex-1 text-xs text-slate-200">
                    <p className="text-slate-400">{platformDomain}</p>
                    <p className="font-bold text-slate-100">{titlePreview}</p>
                    <p className="text-slate-400 text-xs">{descPreview}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Slack Preview */}
            <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
              <div className="bg-slate-700 px-4 py-2 text-xs font-semibold text-slate-300">
                Slack Preview
              </div>
              <div className="p-4">
                <div className="bg-white text-slate-900 rounded p-3 flex gap-3 text-xs border border-slate-300">
                  <div className="flex-1">
                    <p className="text-slate-500 text-xs">{formData.siteName}</p>
                    <p className="font-bold text-sm">{titlePreview}</p>
                    <p className="text-slate-600 text-xs">{descPreview}</p>
                  </div>
                  {formData.image && (
                    <div className="w-12 h-12 bg-slate-300 rounded flex-shrink-0 flex items-center justify-center">
                      <img
                        src={formData.image}
                        alt="Preview"
                        className="w-full h-full object-cover rounded"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Validation Warnings */}
        {warnings.length > 0 && (
          <div className="mb-8 bg-yellow-900/40 border border-yellow-700 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-yellow-200 mb-2">
              Optimization Warnings
            </h3>
            <ul className="space-y-1">
              {warnings.map((warning, idx) => (
                <li key={idx} className="text-sm text-yellow-200">
                  • {warning}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Generated HTML Output */}
        <div className="bg-slate-800 rounded-lg border border-slate-700 p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Generated Meta Tags</h2>
            <button
              onClick={copyToClipboard}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition"
            >
              {copied ? "Copied!" : "Copy All Tags"}
            </button>
          </div>
          <pre className="bg-slate-700 rounded-lg p-4 overflow-x-auto text-xs text-slate-200 font-mono max-h-96">
            {generatedHTML}
          </pre>
          <p className="text-xs text-slate-500 mt-2">
            {generatedHTML.split("\n").length} lines • {generatedHTML.length} characters
          </p>
        </div>

        {/* Bottom Ad Unit */}
        <div className="mb-8">
          <AdUnit slot="7681" format="horizontal" className="w-full" />
        </div>

        {/* Related Tools */}
        <div className="mb-8">
          <RelatedTools currentSlug="og-meta-tag-generator" />
        </div>

        {/* FAQ & JSON-LD */}
        <div className="bg-slate-800 rounded-lg border border-slate-700 p-6 mb-8">
          <h2 className="text-2xl font-bold text-white mb-6">Frequently Asked Questions</h2>
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">
                What is an Open Graph tag?
              </h3>
              <p className="text-slate-400">
                Open Graph tags are meta tags that control how URLs appear when shared on
                social media platforms like Facebook, Twitter, and LinkedIn. They let you
                customize the title, description, image, and other properties that appear in
                social previews, ensuring your content looks exactly how you want it when
                shared.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-white mb-2">
                What size should my og:image be?
              </h3>
              <p className="text-slate-400">
                The recommended og:image size is 1200×630 pixels with an aspect ratio of
                1.91:1. This is the standard size for Facebook and most social platforms.
                Ensure your image is at least 600×315px for best results, and keep the file
                size reasonable (under 8 MB) for fast loading.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-white mb-2">
                What&apos;s the difference between og:title and the page title?
              </h3>
              <p className="text-slate-400">
                The page &lt;title&gt; tag controls browser tab text and search engine
                display, while og:title controls how your page title appears specifically when
                shared on social media. You can use different text for each to optimize for
                different contexts — a longer, SEO-focused title in the page title tag, and a
                shorter, more compelling title in og:title.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-white mb-2">
                Do I need Twitter Card meta tags if I have Open Graph tags?
              </h3>
              <p className="text-slate-400">
                Yes — Twitter reads its own twitter: tags first before falling back to og:
                tags. Including both ensures maximum compatibility across platforms. Twitter
                Card tags give you more control over how your content appears on Twitter/X
                specifically, including the card type and image sizing.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* JSON-LD Schema */}
      <JsonLd
        data={[
          generateWebAppSchema({
            slug: "og-meta-tag-generator",
            name: "Open Graph & Meta Tag Generator",
            description:
              "Generate and preview Open Graph and meta tags for social media sharing. See exactly how your content will look when shared on Facebook, Twitter, LinkedIn, and more.",
            category: "developer",
          }),
          generateBreadcrumbSchema({
            slug: "og-meta-tag-generator",
            name: "Open Graph & Meta Tag Generator",
            description:
              "Generate and preview Open Graph and meta tags for social media sharing.",
            category: "developer",
          }),
          generateFAQSchema([
            {
              question: "What is an Open Graph tag?",
              answer:
                "Open Graph tags are meta tags that control how URLs appear when shared on social media platforms like Facebook, Twitter, and LinkedIn. They let you customize the title, description, image, and other properties that appear in social previews.",
            },
            {
              question: "What size should my og:image be?",
              answer:
                "The recommended og:image size is 1200×630 pixels with an aspect ratio of 1.91:1. This is the standard size for Facebook and most social platforms.",
            },
            {
              question: "What's the difference between og:title and the page title?",
              answer:
                "The page <title> tag controls browser tab text and search engine display, while og:title controls how your page title appears when shared on social media.",
            },
            {
              question: "Do I need Twitter Card meta tags if I have Open Graph tags?",
              answer:
                "Yes — Twitter reads its own twitter: tags first before falling back to og: tags. Including both ensures maximum compatibility across platforms.",
            },
          ]),
        ]}
      />
    </div>
  );
}

function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  };
  return text.replace(/[&<>"']/g, (char) => map[char]);
}
