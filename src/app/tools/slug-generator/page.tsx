"use client";

import { useState, useCallback, useMemo } from "react";
import JsonLd from "@/components/JsonLd";
import RelatedTools from "@/components/RelatedTools";
import {
  generateFAQSchema,
  generateWebAppSchema,
  generateBreadcrumbSchema,
} from "@/lib/jsonld";

type Separator = "-" | "_";

const STOP_WORDS = new Set([
  "a", "an", "the", "and", "or", "but", "in", "on", "at", "to", "for",
  "of", "with", "by", "from", "is", "it", "as", "be", "was", "are",
  "been", "being", "have", "has", "had", "do", "does", "did", "will",
  "would", "could", "should", "may", "might", "shall", "can", "this",
  "that", "these", "those", "not", "no", "nor", "so", "if", "then",
]);

function generateSlug(
  input: string,
  separator: Separator,
  lowercase: boolean,
  maxLength: number,
  removeStopWords: boolean
): string {
  let text = input;

  // Normalize unicode to ASCII equivalents
  text = text.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  // Replace common special characters
  text = text
    .replace(/&/g, " and ")
    .replace(/@/g, " at ")
    .replace(/%/g, " percent ");

  // Apply lowercase
  if (lowercase) {
    text = text.toLowerCase();
  }

  // Split into words
  let words = text
    .replace(/[^a-zA-Z0-9\s-_]/g, "")
    .replace(/[\s\-_]+/g, " ")
    .trim()
    .split(" ")
    .filter((w) => w.length > 0);

  // Remove stop words
  if (removeStopWords) {
    const filtered = words.filter((w) => !STOP_WORDS.has(w.toLowerCase()));
    if (filtered.length > 0) words = filtered;
  }

  let slug = words.join(separator);

  // Enforce max length (break on separator boundary)
  if (maxLength > 0 && slug.length > maxLength) {
    slug = slug.substring(0, maxLength);
    const lastSep = slug.lastIndexOf(separator);
    if (lastSep > 0) {
      slug = slug.substring(0, lastSep);
    }
  }

  return slug;
}

export default function SlugGeneratorPage() {
  const [input, setInput] = useState("");
  const [separator, setSeparator] = useState<Separator>("-");
  const [lowercase, setLowercase] = useState(true);
  const [maxLength, setMaxLength] = useState(0);
  const [removeStopWords, setRemoveStopWords] = useState(false);
  const [bulkMode, setBulkMode] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const output = useMemo(() => {
    if (!input.trim()) return "";
    if (bulkMode) {
      return input
        .split("\n")
        .filter((line) => line.trim())
        .map((line) => generateSlug(line, separator, lowercase, maxLength, removeStopWords))
        .join("\n");
    }
    return generateSlug(input, separator, lowercase, maxLength, removeStopWords);
  }, [input, separator, lowercase, maxLength, removeStopWords, bulkMode]);

  const lineCount = bulkMode
    ? input.split("\n").filter((l) => l.trim()).length
    : 0;

  const copyText = useCallback(async (text: string, label: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  }, []);

  return (
    <>
      <title>URL Slug Generator - Free Online Tool | DevTools Hub</title>
      <meta
        name="description"
        content="Generate clean, SEO-friendly URL slugs from any text. Options for separator, lowercase, max length, stop word removal, and bulk mode. Free, instant, runs in your browser."
      />
      <JsonLd
        data={[
          generateWebAppSchema({
            slug: "slug-generator",
            name: "URL Slug Generator",
            description:
              "Generate clean, SEO-friendly URL slugs from any text with customizable options",
            category: "developer",
          }),
          generateBreadcrumbSchema({
            slug: "slug-generator",
            name: "URL Slug Generator",
            description:
              "Generate clean, SEO-friendly URL slugs from any text with customizable options",
            category: "developer",
          }),
          generateFAQSchema([
            {
              question: "What is a URL slug?",
              answer:
                "A URL slug is the part of a web address that identifies a specific page in a human-readable form. For example, in \"example.com/blog/my-first-post\", the slug is \"my-first-post\". Good slugs are lowercase, use hyphens as separators, and contain only relevant keywords.",
            },
            {
              question: "Should I use hyphens or underscores in URL slugs?",
              answer:
                "Hyphens (-) are strongly recommended over underscores (_) for URL slugs. Google treats hyphens as word separators but treats underscores as word joiners. So \"my-keyword\" is read as two words while \"my_keyword\" is read as one. Hyphens are the standard convention for URLs and better for SEO.",
            },
            {
              question: "Should I remove stop words from slugs?",
              answer:
                "Removing common stop words like \"the\", \"and\", \"of\", and \"in\" can make slugs shorter and more focused on keywords. For example, \"the-ultimate-guide-to-seo\" becomes \"ultimate-guide-seo\". However, sometimes stop words improve readability — use your judgment based on the context.",
            },
            {
              question: "Is my text data safe?",
              answer:
                "Yes. All slug generation happens entirely in your browser using JavaScript. No text is sent to any server. You can safely convert confidential titles and content.",
            },
          ]),
        ]}
      />

      <div className="min-h-screen bg-slate-900 text-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Breadcrumb */}
          <nav className="text-sm text-slate-400 mb-6" aria-label="Breadcrumb">
            <ol className="flex items-center gap-2">
              <li>
                <a href="/" className="hover:text-white transition-colors">
                  Home
                </a>
              </li>
              <li>
                <span className="mx-1">/</span>
              </li>
              <li>
                <a href="/tools" className="hover:text-white transition-colors">
                  Developer Tools
                </a>
              </li>
              <li>
                <span className="mx-1">/</span>
              </li>
              <li className="text-slate-200">URL Slug Generator</li>
            </ol>
          </nav>

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
              URL Slug Generator
            </h1>
            <p className="text-slate-400 max-w-2xl text-lg">
              Generate clean, SEO-friendly URL slugs from any text. Customize
              separator, case, length, and stop word removal. Supports bulk mode
              for multiple titles at once.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* Input Column */}
            <div className="lg:col-span-2">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-slate-300">
                  {bulkMode ? "Input Titles (one per line)" : "Input Text"}
                </label>
                <div className="flex items-center gap-3">
                  {bulkMode && lineCount > 0 && (
                    <span className="text-xs text-slate-500">
                      {lineCount} line{lineCount !== 1 ? "s" : ""}
                    </span>
                  )}
                  <span className="text-xs text-slate-500">
                    {input.length} character{input.length !== 1 ? "s" : ""}
                  </span>
                </div>
              </div>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={
                  bulkMode
                    ? "How to Build a REST API with Node.js\n10 Tips for Better CSS Architecture\nThe Ultimate Guide to TypeScript Generics"
                    : "How to Build a REST API with Node.js"
                }
                className="w-full h-40 bg-slate-800 border border-slate-600 rounded-lg p-4 text-sm text-slate-200 placeholder-slate-500 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                spellCheck={false}
              />
            </div>

            {/* Options Column */}
            <div className="space-y-4">
              <h2 className="text-sm font-medium text-slate-300">Options</h2>

              {/* Separator */}
              <div>
                <label className="text-xs text-slate-400 mb-1.5 block">
                  Separator
                </label>
                <div className="flex gap-2">
                  {(
                    [
                      { value: "-", label: "Hyphen (-)" },
                      { value: "_", label: "Underscore (_)" },
                    ] as const
                  ).map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setSeparator(opt.value)}
                      className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors border ${
                        separator === opt.value
                          ? "bg-blue-600 border-blue-500 text-white"
                          : "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Lowercase */}
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={lowercase}
                  onChange={(e) => setLowercase(e.target.checked)}
                  className="w-4 h-4 rounded bg-slate-800 border-slate-600 text-blue-600 focus:ring-blue-500 focus:ring-offset-0 cursor-pointer"
                />
                <span className="text-sm text-slate-300">
                  Force lowercase
                </span>
              </label>

              {/* Remove Stop Words */}
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={removeStopWords}
                  onChange={(e) => setRemoveStopWords(e.target.checked)}
                  className="w-4 h-4 rounded bg-slate-800 border-slate-600 text-blue-600 focus:ring-blue-500 focus:ring-offset-0 cursor-pointer"
                />
                <span className="text-sm text-slate-300">
                  Remove stop words
                </span>
              </label>

              {/* Bulk Mode */}
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={bulkMode}
                  onChange={(e) => setBulkMode(e.target.checked)}
                  className="w-4 h-4 rounded bg-slate-800 border-slate-600 text-blue-600 focus:ring-blue-500 focus:ring-offset-0 cursor-pointer"
                />
                <span className="text-sm text-slate-300">
                  Bulk mode (one per line)
                </span>
              </label>

              {/* Max Length */}
              <div>
                <label className="text-xs text-slate-400 mb-1.5 block">
                  Max length {maxLength === 0 ? "(unlimited)" : `(${maxLength})`}
                </label>
                <input
                  type="range"
                  min={0}
                  max={200}
                  step={5}
                  value={maxLength}
                  onChange={(e) => setMaxLength(Number(e.target.value))}
                  className="w-full accent-blue-600"
                />
                <div className="flex justify-between text-xs text-slate-500 mt-1">
                  <span>No limit</span>
                  <span>200</span>
                </div>
              </div>
            </div>
          </div>

          {/* Output */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-slate-300">
                Generated Slug{bulkMode ? "s" : ""}
              </label>
              {output && (
                <span className="text-xs text-slate-500">
                  {output.length} character{output.length !== 1 ? "s" : ""}
                </span>
              )}
            </div>
            <div className="bg-slate-800 border border-slate-600 rounded-lg p-4 min-h-[6rem]">
              <pre className="text-sm text-green-400 whitespace-pre-wrap break-words font-mono select-all">
                {output || "Your slug will appear here..."}
              </pre>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <button
              onClick={() => copyText(output, "output")}
              disabled={!output}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {copied === "output" ? "Copied!" : "Copy Slug"}
            </button>
            <button
              onClick={() => setInput("")}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors"
            >
              Clear
            </button>
            <button
              onClick={() => {
                if (bulkMode) {
                  setInput(
                    "How to Build a REST API with Node.js\n10 Tips for Better CSS Architecture\nThe Ultimate Guide to TypeScript Generics"
                  );
                } else {
                  setInput("How to Build a REST API with Node.js & Express");
                }
              }}
              className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
            >
              Load example
            </button>
          </div>

          {/* Live Preview Card */}
          {output && !bulkMode && (
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-5 mb-6">
              <h2 className="text-sm font-semibold text-white mb-3">
                URL Preview
              </h2>
              <div className="bg-slate-900 rounded px-4 py-3">
                <span className="text-sm text-slate-500 font-mono">
                  https://example.com/blog/
                </span>
                <span className="text-sm text-green-400 font-mono font-medium">
                  {output}
                </span>
              </div>
            </div>
          )}

          {/* Best Practices Reference */}
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 mb-6">
            <h2 className="text-lg font-semibold text-white mb-4">
              URL Slug Best Practices
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
              {[
                {
                  name: "Use hyphens",
                  tip: "Google treats hyphens as word separators, making your URLs more SEO-friendly",
                },
                {
                  name: "Keep it short",
                  tip: "Aim for 3-5 words. Shorter slugs are easier to read and share",
                },
                {
                  name: "Use lowercase",
                  tip: "URLs are case-sensitive on most servers. Lowercase avoids duplicate content issues",
                },
                {
                  name: "Include keywords",
                  tip: "Put your target keyword in the slug for better search engine visibility",
                },
                {
                  name: "Remove stop words",
                  tip: "Words like 'the', 'and', 'of' add length without SEO value",
                },
                {
                  name: "Avoid special characters",
                  tip: "Stick to alphanumeric characters and hyphens for maximum compatibility",
                },
              ].map((item) => (
                <div key={item.name}>
                  <h3 className="text-sm font-medium text-white mb-1">
                    {item.name}
                  </h3>
                  <p className="text-xs text-slate-400">{item.tip}</p>
                </div>
              ))}
            </div>
          </div>

          <RelatedTools currentSlug="slug-generator" />

          {/* FAQ Section */}
          <section className="mt-16 border-t border-slate-700 pt-10">
            <h2 className="text-2xl font-bold text-white mb-6">
              Frequently Asked Questions
            </h2>

            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  What is a URL slug?
                </h3>
                <p className="text-slate-400">
                  A URL slug is the part of a web address that identifies a
                  specific page in a human-readable form. For example, in
                  &ldquo;example.com/blog/my-first-post&rdquo;, the slug is
                  &ldquo;my-first-post&rdquo;. Good slugs are lowercase, use
                  hyphens as separators, and contain only relevant keywords.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Should I use hyphens or underscores in URL slugs?
                </h3>
                <p className="text-slate-400">
                  Hyphens (-) are strongly recommended over underscores (_) for
                  URL slugs. Google treats hyphens as word separators but treats
                  underscores as word joiners. So &ldquo;my-keyword&rdquo; is
                  read as two words while &ldquo;my_keyword&rdquo; is read as
                  one. Hyphens are the standard convention for URLs and better
                  for SEO.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Should I remove stop words from slugs?
                </h3>
                <p className="text-slate-400">
                  Removing common stop words like &ldquo;the&rdquo;,
                  &ldquo;and&rdquo;, &ldquo;of&rdquo;, and &ldquo;in&rdquo; can
                  make slugs shorter and more focused on keywords. For example,
                  &ldquo;the-ultimate-guide-to-seo&rdquo; becomes
                  &ldquo;ultimate-guide-seo&rdquo;. However, sometimes stop
                  words improve readability — use your judgment based on the
                  context.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Is my text data safe?
                </h3>
                <p className="text-slate-400">
                  Yes. All slug generation happens entirely in your browser using
                  JavaScript. No text is sent to any server. You can safely
                  convert confidential titles and content.
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
