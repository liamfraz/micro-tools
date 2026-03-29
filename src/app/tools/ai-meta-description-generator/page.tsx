"use client";

import { useState, useCallback } from "react";
import JsonLd from "@/components/JsonLd";
import RelatedTools from "@/components/RelatedTools";
import AdUnit from "@/components/AdUnit";
import ToolBreadcrumb from "@/components/ToolBreadcrumb";
import {
  generateFAQSchema,
  generateWebAppSchema,
  generateBreadcrumbSchema,
} from "@/lib/jsonld";
import { getRemainingUses, recordUsage, callAI } from "@/lib/ai-helpers";

const SLUG = "ai-meta-description-generator";

interface DescriptionResult {
  text: string;
  charCount: number;
}

function getCharCountColor(count: number): string {
  if (count >= 150 && count <= 160) return "text-green-400";
  if ((count >= 140 && count < 150) || (count > 160 && count <= 170))
    return "text-yellow-400";
  return "text-red-400";
}

function getCharCountLabel(count: number): string {
  if (count >= 150 && count <= 160) return "Optimal";
  if (count < 150) return "Short";
  return "Long";
}

export default function AIMetaDescriptionGeneratorPage() {
  const [title, setTitle] = useState("");
  const [descriptions, setDescriptions] = useState<DescriptionResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [remainingUses, setRemainingUses] = useState(() =>
    getRemainingUses(SLUG)
  );

  const handleGenerate = useCallback(async () => {
    if (!title.trim()) return;

    const remaining = getRemainingUses(SLUG);
    if (remaining <= 0) {
      setError(
        "You have reached your daily limit of 5 free generations. Please try again tomorrow."
      );
      return;
    }

    setLoading(true);
    setError(null);
    setDescriptions([]);
    setCopiedIndex(null);

    try {
      const response = await callAI("meta-description", { title: title.trim() });

      if (response.error) {
        setError(response.error);
        return;
      }

      const data = response.result as {
        descriptions: DescriptionResult[];
      } | null;

      if (!data?.descriptions || data.descriptions.length === 0) {
        setError("No descriptions were generated. Please try again.");
        return;
      }

      setDescriptions(data.descriptions);
      recordUsage(SLUG);
      setRemainingUses(getRemainingUses(SLUG));
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [title]);

  const copyToClipboard = useCallback(
    async (text: string, index: number) => {
      try {
        await navigator.clipboard.writeText(text);
        setCopiedIndex(index);
        setTimeout(() => setCopiedIndex(null), 2000);
      } catch {
        /* clipboard not available */
      }
    },
    []
  );

  return (
    <>
      <JsonLd
        data={[
          generateWebAppSchema({
            slug: SLUG,
            name: "AI Meta Description Generator",
            description:
              "Generate 3 SEO-optimized meta descriptions for any page. AI-powered meta description generator with character count and keyword optimization.",
            category: "ai",
          }),
          generateBreadcrumbSchema({
            slug: SLUG,
            name: "AI Meta Description Generator",
            description:
              "Generate 3 SEO-optimized meta descriptions for any page. AI-powered meta description generator with character count and keyword optimization.",
            category: "ai",
          }),
          generateFAQSchema([
            {
              question:
                "What is a meta description and why does it matter for SEO?",
              answer:
                "A meta description is an HTML attribute that provides a brief summary of a web page. Search engines like Google often display it in search results below the page title. A well-written meta description improves click-through rates by giving searchers a compelling reason to visit your page, even though it is not a direct ranking factor.",
            },
            {
              question:
                "What is the ideal length for a meta description?",
              answer:
                "The optimal length for a meta description is between 150 and 160 characters. Descriptions shorter than 150 characters may not provide enough context, while those longer than 160 characters risk being truncated in search results. This tool shows a character count indicator so you can pick the best option.",
            },
            {
              question:
                "How does this AI meta description generator work?",
              answer:
                "Enter your page title or topic and click Generate. The tool uses AI to create 3 unique, SEO-optimized meta descriptions tailored to your content. Each result includes a character count with a color-coded indicator showing whether it falls within the optimal 150-160 character range. You get 5 free generations per day.",
            },
          ]),
        ]}
      />

      <div className="min-h-screen bg-slate-900 text-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <ToolBreadcrumb slug={SLUG} />

          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-3">
              <h1 className="text-3xl sm:text-4xl font-bold text-white">
                AI Meta Description Generator
              </h1>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-violet-600/20 text-violet-400 border border-violet-500/30">
                Powered by AI
              </span>
            </div>
            <p className="text-slate-400 max-w-2xl text-lg">
              Generate 3 SEO-optimized meta descriptions for any page. Enter
              your page title or URL and get compelling descriptions with
              character count optimization -- no sign-up required.
            </p>
          </div>

          <AdUnit slot="1234567890" format="horizontal" className="my-6" />

          {/* Input Section */}
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 mb-6">
            <label className="text-sm font-medium text-slate-300 mb-2 block">
              Page Title or Topic *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && title.trim() && !loading) {
                  handleGenerate();
                }
              }}
              placeholder="e.g., Best project management tools 2026"
              className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-3 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-4"
            />

            <div className="flex items-center justify-between">
              <button
                onClick={handleGenerate}
                disabled={!title.trim() || loading || remainingUses <= 0}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading && (
                  <svg
                    className="animate-spin h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                )}
                {loading ? "Generating..." : "Generate Meta Descriptions"}
              </button>

              <span className="text-sm text-slate-400">
                {remainingUses}/5 free generations remaining today
              </span>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-900/30 border border-red-700 rounded-lg p-4 mb-6">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {/* Results */}
          {descriptions.length > 0 && (
            <div className="space-y-4 mb-6">
              <h2 className="text-lg font-semibold text-white">
                Generated Meta Descriptions ({descriptions.length})
              </h2>
              {descriptions.map((desc, index) => (
                <div
                  key={index}
                  className="bg-slate-800 border border-slate-700 rounded-lg p-4 hover:border-slate-600 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-mono bg-slate-700 text-slate-400 px-2 py-0.5 rounded">
                          {index + 1}
                        </span>
                        <span
                          className={`text-xs font-medium ${getCharCountColor(
                            desc.charCount
                          )}`}
                        >
                          {desc.charCount} chars -{" "}
                          {getCharCountLabel(desc.charCount)}
                        </span>
                      </div>
                      <p className="text-sm text-slate-200 leading-relaxed">
                        {desc.text}
                      </p>
                    </div>
                    <button
                      onClick={() => copyToClipboard(desc.text, index)}
                      className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white rounded text-xs font-medium transition-colors shrink-0"
                    >
                      {copiedIndex === index ? "Copied!" : "Copy"}
                    </button>
                  </div>

                  {/* Character count bar */}
                  <div className="mt-3 flex items-center gap-2">
                    <div className="flex-1 bg-slate-700 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          desc.charCount >= 150 && desc.charCount <= 160
                            ? "bg-green-500"
                            : (desc.charCount >= 140 && desc.charCount < 150) ||
                              (desc.charCount > 160 && desc.charCount <= 170)
                            ? "bg-yellow-500"
                            : "bg-red-500"
                        }`}
                        style={{
                          width: `${Math.min(
                            100,
                            (desc.charCount / 200) * 100
                          )}%`,
                        }}
                      />
                    </div>
                    <span className="text-xs text-slate-500 shrink-0">
                      150-160 optimal
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty State */}
          {descriptions.length === 0 && !loading && !error && (
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-8 mb-6 text-center">
              <p className="text-slate-500">
                Enter a page title or topic above and click &ldquo;Generate Meta
                Descriptions&rdquo; to get 3 SEO-optimized options.
              </p>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-8 mb-6 text-center">
              <svg
                className="animate-spin h-8 w-8 text-blue-500 mx-auto mb-3"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              <p className="text-slate-400">
                Generating meta descriptions...
              </p>
            </div>
          )}

          {/* Tips Section */}
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 mb-6">
            <h2 className="text-lg font-semibold text-white mb-4">
              Meta Description Best Practices
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
              {[
                {
                  name: "Aim for 150-160 Characters",
                  tip: "Google typically truncates meta descriptions beyond 160 characters. Staying in the 150-160 range ensures your full description displays in search results.",
                },
                {
                  name: "Include Your Target Keyword",
                  tip: "Google bolds matching search terms in the meta description. Including your primary keyword naturally increases visibility and click-through rates.",
                },
                {
                  name: "Write a Clear Call to Action",
                  tip: "Encourage clicks with action-oriented language like 'Learn how to...', 'Discover...', or 'Find out why...'. Give searchers a reason to click.",
                },
                {
                  name: "Make Each Page Unique",
                  tip: "Avoid duplicate meta descriptions across pages. Each page should have a unique description that accurately reflects its specific content.",
                },
                {
                  name: "Match Search Intent",
                  tip: "Align your description with what users expect to find. If they search for a comparison, mention you compare options. If they want a guide, say so.",
                },
                {
                  name: "Avoid Clickbait",
                  tip: "Your meta description should accurately preview page content. Misleading descriptions increase bounce rates, which can hurt your rankings over time.",
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

          <AdUnit slot="0987654321" format="rectangle" className="my-6" />

          <RelatedTools currentSlug={SLUG} />

          {/* FAQ Section */}
          <section className="mt-16 border-t border-slate-700 pt-10">
            <h2 className="text-2xl font-bold text-white mb-6">
              Frequently Asked Questions
            </h2>

            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  What is a meta description and why does it matter for SEO?
                </h3>
                <p className="text-slate-400">
                  A meta description is an HTML attribute that provides a brief
                  summary of a web page. Search engines like Google often display
                  it in search results below the page title. A well-written meta
                  description improves click-through rates by giving searchers a
                  compelling reason to visit your page, even though it is not a
                  direct ranking factor.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  What is the ideal length for a meta description?
                </h3>
                <p className="text-slate-400">
                  The optimal length for a meta description is between 150 and
                  160 characters. Descriptions shorter than 150 characters may
                  not provide enough context, while those longer than 160
                  characters risk being truncated in search results. This tool
                  shows a character count indicator so you can pick the best
                  option.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  How does this AI meta description generator work?
                </h3>
                <p className="text-slate-400">
                  Enter your page title or topic and click Generate. The tool
                  uses AI to create 3 unique, SEO-optimized meta descriptions
                  tailored to your content. Each result includes a character
                  count with a color-coded indicator showing whether it falls
                  within the optimal 150-160 character range. You get 5 free
                  generations per day.
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
