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

const SLUG = "ai-commit-message-generator";

const toolInfo = {
  slug: SLUG,
  name: "AI Commit Message Generator",
  description:
    "Paste a git diff and get a conventional commit message instantly. AI-powered commit message generator following conventional commits standard",
  category: "ai",
};

interface CommitResult {
  type: string;
  scope: string;
  subject: string;
  body: string;
  full: string;
}

const TYPE_COLORS: Record<string, string> = {
  feat: "bg-green-600",
  fix: "bg-red-600",
  refactor: "bg-blue-600",
  docs: "bg-purple-600",
  style: "bg-pink-600",
  test: "bg-yellow-600",
  chore: "bg-gray-600",
};

export default function AICommitMessageGeneratorPage() {
  const [diff, setDiff] = useState("");
  const [result, setResult] = useState<CommitResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [remaining, setRemaining] = useState(() =>
    getRemainingUses(SLUG)
  );

  const handleGenerate = useCallback(async () => {
    const trimmed = diff.trim();
    if (!trimmed) return;

    const uses = getRemainingUses(SLUG);
    if (uses <= 0) {
      setError("Daily limit reached. Come back tomorrow for 5 more free generations.");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);
    setCopied(false);

    try {
      const response = await callAI("commit-message", { diff: trimmed });

      if (response.error) {
        setError(response.error);
        return;
      }

      const commitResult = (response as { result: CommitResult }).result;
      if (!commitResult || !commitResult.full) {
        setError("Failed to generate commit message. Please try again.");
        return;
      }

      recordUsage(SLUG);
      setResult(commitResult);
      setRemaining(getRemainingUses(SLUG));
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [diff]);

  const copyToClipboard = useCallback(async () => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result.full);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard not available */
    }
  }, [result]);

  const typeBadgeColor = result
    ? TYPE_COLORS[result.type] || "bg-slate-600"
    : "";

  return (
    <>
      <JsonLd
        data={[
          generateWebAppSchema(toolInfo),
          generateBreadcrumbSchema(toolInfo),
          generateFAQSchema([
            {
              question: "How does the AI commit message generator work?",
              answer:
                "Paste your git diff output into the text area and click Generate. The AI analyzes your code changes and produces a conventional commit message with type, scope, subject, and optional body. It follows the Conventional Commits specification used by many open-source projects.",
            },
            {
              question: "What commit message format does it follow?",
              answer:
                "The tool follows the Conventional Commits standard (conventionalcommits.org). Each message includes a type (feat, fix, refactor, docs, style, test, chore), an optional scope in parentheses, a short subject line, and an optional body with more detail about the changes.",
            },
            {
              question: "Is there a usage limit?",
              answer:
                "Yes, you get 5 free AI-powered generations per day. The limit resets at midnight. No sign-up or account is required to use the tool.",
            },
          ]),
        ]}
      />

      <div className="min-h-screen bg-slate-900 text-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <ToolBreadcrumb slug={SLUG} />

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
              AI Commit Message Generator
            </h1>
            <p className="text-slate-400 max-w-2xl text-lg">
              Paste a git diff and get a conventional commit message instantly.
              AI-powered analysis generates properly formatted commit messages
              following the Conventional Commits standard.
            </p>
          </div>

          <AdUnit slot="1234567890" format="horizontal" className="my-6" />

          {/* Usage Counter */}
          <div className="flex items-center gap-3 mb-4">
            <span className="text-sm text-slate-400">
              {remaining}/5 free generations remaining today
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-purple-900/40 border border-purple-700/50 rounded-full text-xs text-purple-300">
              <svg
                className="w-3 h-3"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zm0 16a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
              </svg>
              Powered by AI
            </span>
          </div>

          {/* Diff Input */}
          <div className="mb-4">
            <label className="text-xs text-slate-400 mb-1.5 block">
              Git Diff
            </label>
            <textarea
              value={diff}
              onChange={(e) => setDiff(e.target.value)}
              placeholder={`diff --git a/src/utils/auth.ts b/src/utils/auth.ts
index 1a2b3c4..5e6f7a8 100644
--- a/src/utils/auth.ts
+++ b/src/utils/auth.ts
@@ -12,6 +12,15 @@ export function validateToken(token: string) {
+  if (!token) {
+    throw new Error('Token is required');
+  }
+
+  const decoded = jwt.verify(token, process.env.JWT_SECRET);
+  if (decoded.exp < Date.now() / 1000) {
+    throw new Error('Token expired');
+  }
+
   return decoded;
 }`}
              rows={14}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-sm text-slate-200 font-mono placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y"
            />
          </div>

          {/* Generate Button */}
          <div className="flex items-center gap-3 mb-6">
            <button
              onClick={handleGenerate}
              disabled={!diff.trim() || loading || remaining <= 0}
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
              {loading ? "Generating..." : "Generate Commit Message"}
            </button>
            {diff.trim() && (
              <button
                onClick={() => {
                  setDiff("");
                  setResult(null);
                  setError("");
                  setCopied(false);
                }}
                className="px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors text-sm"
              >
                Clear
              </button>
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-900/30 border border-red-700/50 rounded-lg px-4 py-3 mb-6 text-sm text-red-300">
              {error}
            </div>
          )}

          {/* Results */}
          {result && (
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 mb-6 space-y-4">
              <h2 className="text-lg font-semibold text-white">
                Generated Commit Message
              </h2>

              {/* Type + Scope + Subject */}
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`${typeBadgeColor} text-white text-xs font-bold px-2.5 py-1 rounded`}
                >
                  {result.type}
                </span>
                {result.scope && (
                  <span className="text-slate-400 text-sm">
                    ({result.scope})
                  </span>
                )}
                <span className="text-white text-sm font-medium">
                  {result.subject}
                </span>
              </div>

              {/* Body */}
              {result.body && (
                <div className="text-sm text-slate-400 whitespace-pre-wrap leading-relaxed">
                  {result.body}
                </div>
              )}

              {/* Full message code block */}
              <div>
                <label className="text-xs text-slate-500 mb-1.5 block">
                  Full commit message
                </label>
                <pre className="bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-sm text-slate-200 font-mono whitespace-pre-wrap overflow-x-auto">
                  {result.full}
                </pre>
              </div>

              {/* Copy button */}
              <button
                onClick={copyToClipboard}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                {copied ? "Copied!" : "Copy Commit Message"}
              </button>
            </div>
          )}

          {/* Empty State */}
          {!result && !loading && !error && (
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-8 mb-6 text-center">
              <p className="text-slate-500">
                Paste your git diff above and click &ldquo;Generate Commit
                Message&rdquo; to get a conventional commit message.
              </p>
            </div>
          )}

          {/* Tips Section */}
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 mb-6">
            <h2 className="text-lg font-semibold text-white mb-4">
              Conventional Commits Quick Reference
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
              {[
                {
                  name: "feat",
                  color: "text-green-400",
                  tip: "A new feature or capability added to the codebase. Use when introducing functionality that didn't exist before.",
                },
                {
                  name: "fix",
                  color: "text-red-400",
                  tip: "A bug fix that corrects broken behavior. Use when something was working incorrectly and you've resolved it.",
                },
                {
                  name: "refactor",
                  color: "text-blue-400",
                  tip: "Code restructuring without changing behavior. Use when improving code quality, readability, or performance without adding features or fixing bugs.",
                },
                {
                  name: "docs",
                  color: "text-purple-400",
                  tip: "Documentation-only changes. Use for README updates, code comments, JSDoc annotations, or any non-code documentation.",
                },
                {
                  name: "test",
                  color: "text-yellow-400",
                  tip: "Adding or updating tests. Use when adding new test cases, fixing broken tests, or improving test coverage.",
                },
                {
                  name: "chore",
                  color: "text-gray-400",
                  tip: "Maintenance tasks like dependency updates, build config changes, CI/CD tweaks, or other non-production code changes.",
                },
              ].map((item) => (
                <div key={item.name}>
                  <h3 className={`text-sm font-mono font-medium ${item.color} mb-1`}>
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
                  How does the AI commit message generator work?
                </h3>
                <p className="text-slate-400">
                  Paste your git diff output into the text area and click
                  Generate. The AI analyzes your code changes and produces a
                  conventional commit message with type, scope, subject, and
                  optional body. It follows the Conventional Commits
                  specification used by many open-source projects.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  What commit message format does it follow?
                </h3>
                <p className="text-slate-400">
                  The tool follows the Conventional Commits standard
                  (conventionalcommits.org). Each message includes a type (feat,
                  fix, refactor, docs, style, test, chore), an optional scope in
                  parentheses, a short subject line, and an optional body with
                  more detail about the changes.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Is there a usage limit?
                </h3>
                <p className="text-slate-400">
                  Yes, you get 5 free AI-powered generations per day. The limit
                  resets at midnight. No sign-up or account is required to use
                  the tool.
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
