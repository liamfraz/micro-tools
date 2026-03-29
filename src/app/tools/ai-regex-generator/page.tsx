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

const SLUG = "ai-regex-generator";

interface RegexResult {
  pattern: string;
  flags: string;
  explanation: string;
  examples: {
    matches: string[];
    nonMatches: string[];
  };
}

const toolInfo = {
  slug: SLUG,
  name: "AI Regex Generator",
  description:
    "Describe what you want to match in plain English and get the regex pattern with explanation. Free AI-powered regex generator with live testing",
  category: "ai",
};

function highlightMatches(
  text: string,
  pattern: string,
  flags: string
): React.ReactNode[] {
  try {
    const regex = new RegExp(pattern, flags.includes("g") ? flags : flags + "g");
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;
    let key = 0;

    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(
          <span key={key++}>{text.slice(lastIndex, match.index)}</span>
        );
      }
      parts.push(
        <mark
          key={key++}
          className="bg-green-500/30 text-green-300 rounded px-0.5"
        >
          {match[0]}
        </mark>
      );
      lastIndex = match.index + match[0].length;
      if (match[0].length === 0) {
        regex.lastIndex++;
      }
    }

    if (lastIndex < text.length) {
      parts.push(<span key={key++}>{text.slice(lastIndex)}</span>);
    }

    return parts.length > 0 ? parts : [<span key={0}>{text}</span>];
  } catch {
    return [<span key={0}>{text}</span>];
  }
}

export default function AIRegexGeneratorPage() {
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<RegexResult | null>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [testText, setTestText] = useState("");
  const [remaining, setRemaining] = useState(() => getRemainingUses(SLUG));

  const handleGenerate = useCallback(async () => {
    const trimmed = description.trim();
    if (!trimmed) return;

    const uses = getRemainingUses(SLUG);
    if (uses <= 0) {
      setError("Daily limit reached. Please try again tomorrow.");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);
    setCopied(false);

    try {
      const response = await callAI("regex-generator", {
        description: trimmed,
      });

      if (response.error) {
        setError(response.error);
        return;
      }

      const data = response.result as RegexResult;
      if (!data || !data.pattern) {
        setError("Invalid response from AI. Please try again.");
        return;
      }

      // Validate the regex pattern
      try {
        new RegExp(data.pattern, data.flags || "");
      } catch {
        // Pattern is invalid but we still show it with a warning
        setError(
          "Warning: The generated pattern may not be valid. Please verify before using."
        );
      }

      recordUsage(SLUG);
      setRemaining(getRemainingUses(SLUG));
      setResult(data);
    } catch {
      setError("Failed to generate regex. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }, [description]);

  const copyPattern = useCallback(async () => {
    if (!result) return;
    try {
      const fullPattern = `/${result.pattern}/${result.flags}`;
      await navigator.clipboard.writeText(fullPattern);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard not available */
    }
  }, [result]);

  return (
    <>
      <title>
        Free AI Regex Generator - Plain English to Regex Pattern | DevTools
      </title>
      <meta
        name="description"
        content="Describe what you want to match in plain English and get the regex pattern with explanation. Free AI-powered regex generator with live testing."
      />
      <JsonLd
        data={[
          generateWebAppSchema(toolInfo),
          generateBreadcrumbSchema(toolInfo),
          generateFAQSchema([
            {
              question: "How does the AI Regex Generator work?",
              answer:
                "You describe what you want to match in plain English (e.g., 'match email addresses' or 'extract phone numbers'). The AI analyzes your description and generates a regular expression pattern with flags, a step-by-step explanation, and example matches and non-matches. You can then test the pattern against your own text right in the browser.",
            },
            {
              question: "Is the generated regex reliable?",
              answer:
                "The AI generates patterns based on common regex conventions and your description. While it works well for most use cases, you should always test the generated pattern against your actual data using the built-in test feature. Complex or edge-case-heavy patterns may need manual refinement.",
            },
            {
              question: "How many regex patterns can I generate per day?",
              answer:
                "You can generate up to 5 regex patterns per day for free. The limit resets at midnight. Each generation provides the pattern, explanation, example matches, and a live testing area.",
            },
          ]),
        ]}
      />

      <div className="min-h-screen bg-slate-900 text-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <ToolBreadcrumb slug={SLUG} />

          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-3">
              <h1 className="text-3xl sm:text-4xl font-bold text-white">
                AI Regex Generator
              </h1>
              <span className="px-2 py-0.5 bg-purple-600/20 text-purple-400 text-xs font-medium rounded-full border border-purple-500/30">
                Powered by AI
              </span>
            </div>
            <p className="text-slate-400 max-w-2xl text-lg">
              Describe what you want to match in plain English and get a regex
              pattern with step-by-step explanation. Test it instantly against
              your own text.
            </p>
          </div>

          <AdUnit slot="1234567890" format="horizontal" className="my-6" />

          {/* Input Section */}
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 mb-6">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-slate-300">
                Describe what you want to match
              </label>
              <span className="text-xs text-slate-500">
                {remaining}/5 free generations remaining today
              </span>
            </div>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder='e.g., "Match email addresses", "Extract phone numbers from text", "Find URLs starting with https", "Match dates in MM/DD/YYYY format"'
              className="w-full h-28 bg-slate-900 border border-slate-600 rounded-lg p-4 text-sm text-slate-200 placeholder-slate-500 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              spellCheck={false}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey && description.trim()) {
                  e.preventDefault();
                  handleGenerate();
                }
              }}
            />

            <div className="flex flex-wrap items-center gap-3 mt-4">
              <button
                onClick={handleGenerate}
                disabled={!description.trim() || loading || remaining <= 0}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading && (
                  <svg
                    className="animate-spin h-4 w-4"
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
                {loading ? "Generating..." : "Generate Regex"}
              </button>
              <button
                onClick={() => {
                  setDescription("");
                  setResult(null);
                  setError("");
                  setTestText("");
                  setCopied(false);
                }}
                className="px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors"
              >
                Clear
              </button>
              <div className="flex flex-wrap gap-2">
                {[
                  "Match email addresses",
                  "Extract phone numbers",
                  "Find URLs in text",
                ].map((example) => (
                  <button
                    key={example}
                    onClick={() => setDescription(example)}
                    className="text-xs text-slate-500 hover:text-slate-300 transition-colors bg-slate-700/50 px-2 py-1 rounded"
                  >
                    {example}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-900/20 border border-red-700/50 rounded-lg p-4 mb-6">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {/* Results */}
          {result && (
            <div className="space-y-6 mb-6">
              {/* Pattern */}
              <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
                  <h2 className="text-sm font-medium text-white">
                    Generated Pattern
                  </h2>
                  <button
                    onClick={copyPattern}
                    className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white rounded text-xs font-medium transition-colors"
                  >
                    {copied ? "Copied!" : "Copy"}
                  </button>
                </div>
                <div className="p-4">
                  <div className="bg-slate-900 border border-slate-600 rounded-lg p-4 font-mono text-lg text-green-400 break-all">
                    /{result.pattern}/{result.flags}
                  </div>
                  {result.flags && (
                    <div className="mt-3 flex items-center gap-2">
                      <span className="text-xs text-slate-400">Flags:</span>
                      {result.flags.split("").map((flag) => (
                        <span
                          key={flag}
                          className="px-2 py-0.5 bg-blue-600/20 text-blue-400 text-xs font-mono rounded border border-blue-500/30"
                        >
                          {flag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Explanation */}
              <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-700">
                  <h2 className="text-sm font-medium text-white">
                    Step-by-Step Explanation
                  </h2>
                </div>
                <div className="p-4">
                  <pre className="text-sm text-slate-300 whitespace-pre-wrap break-words font-sans leading-relaxed">
                    {result.explanation}
                  </pre>
                </div>
              </div>

              {/* Examples */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Matches */}
                <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
                  <div className="px-4 py-3 border-b border-slate-700">
                    <h2 className="text-sm font-medium text-green-400">
                      Example Matches
                    </h2>
                  </div>
                  <div className="p-4 space-y-2">
                    {result.examples.matches.map((match, i) => (
                      <div
                        key={i}
                        className="bg-green-900/20 border border-green-700/30 rounded px-3 py-2 font-mono text-sm text-green-300"
                      >
                        {match}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Non-Matches */}
                <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
                  <div className="px-4 py-3 border-b border-slate-700">
                    <h2 className="text-sm font-medium text-red-400">
                      Example Non-Matches
                    </h2>
                  </div>
                  <div className="p-4 space-y-2">
                    {result.examples.nonMatches.map((nonMatch, i) => (
                      <div
                        key={i}
                        className="bg-red-900/20 border border-red-700/30 rounded px-3 py-2 font-mono text-sm text-red-300"
                      >
                        {nonMatch}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Test It */}
              <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-700">
                  <h2 className="text-sm font-medium text-white">
                    Test Your Regex
                  </h2>
                </div>
                <div className="p-4 space-y-4">
                  <textarea
                    value={testText}
                    onChange={(e) => setTestText(e.target.value)}
                    placeholder="Paste your text here to test the regex pattern against it..."
                    className="w-full h-32 bg-slate-900 border border-slate-600 rounded-lg p-4 text-sm text-slate-200 placeholder-slate-500 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                    spellCheck={false}
                  />
                  {testText && (
                    <div>
                      <h3 className="text-xs text-slate-400 mb-2">
                        Matches highlighted:
                      </h3>
                      <div className="bg-slate-900 border border-slate-600 rounded-lg p-4 font-mono text-sm text-slate-300 whitespace-pre-wrap break-words">
                        {highlightMatches(
                          testText,
                          result.pattern,
                          result.flags
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-2">
                        {(() => {
                          try {
                            const regex = new RegExp(
                              result.pattern,
                              result.flags.includes("g")
                                ? result.flags
                                : result.flags + "g"
                            );
                            const matchCount =
                              testText.match(regex)?.length || 0;
                            return `${matchCount} match${matchCount !== 1 ? "es" : ""} found`;
                          } catch {
                            return "Could not execute regex";
                          }
                        })()}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Empty State */}
          {!result && !loading && !error && (
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-8 mb-6 text-center">
              <p className="text-slate-500">
                Describe what you want to match above and click &ldquo;Generate
                Regex&rdquo; to get a pattern with explanation.
              </p>
            </div>
          )}

          {/* Regex Tips */}
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 mb-6">
            <h2 className="text-lg font-semibold text-white mb-4">
              Regex Quick Reference
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
              {[
                {
                  name: "Character Classes",
                  tip: "\\d matches digits, \\w matches word characters (letters, digits, underscore), \\s matches whitespace. Uppercase versions (\\D, \\W, \\S) match the opposite.",
                },
                {
                  name: "Quantifiers",
                  tip: "* means 0 or more, + means 1 or more, ? means 0 or 1. {n} matches exactly n times, {n,m} matches between n and m times.",
                },
                {
                  name: "Anchors",
                  tip: "^ matches the start of a string (or line with m flag), $ matches the end. \\b matches a word boundary.",
                },
                {
                  name: "Groups & Alternation",
                  tip: "( ) creates a capture group, (?: ) creates a non-capturing group. | means OR between alternatives.",
                },
                {
                  name: "Common Flags",
                  tip: "g = global (find all matches), i = case-insensitive, m = multiline (^ and $ match line boundaries), s = dotAll (. matches newlines).",
                },
                {
                  name: "Lookahead & Lookbehind",
                  tip: "(?=...) positive lookahead, (?!...) negative lookahead. (?<=...) positive lookbehind, (?<!...) negative lookbehind.",
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
                  How does the AI Regex Generator work?
                </h3>
                <p className="text-slate-400">
                  You describe what you want to match in plain English (e.g.,
                  &ldquo;match email addresses&rdquo; or &ldquo;extract phone
                  numbers&rdquo;). The AI analyzes your description and generates
                  a regular expression pattern with flags, a step-by-step
                  explanation, and example matches and non-matches. You can then
                  test the pattern against your own text right in the browser.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Is the generated regex reliable?
                </h3>
                <p className="text-slate-400">
                  The AI generates patterns based on common regex conventions and
                  your description. While it works well for most use cases, you
                  should always test the generated pattern against your actual
                  data using the built-in test feature. Complex or
                  edge-case-heavy patterns may need manual refinement.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  How many regex patterns can I generate per day?
                </h3>
                <p className="text-slate-400">
                  You can generate up to 5 regex patterns per day for free. The
                  limit resets at midnight. Each generation provides the pattern,
                  explanation, example matches, and a live testing area.
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
