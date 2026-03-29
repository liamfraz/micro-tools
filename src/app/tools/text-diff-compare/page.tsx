"use client";

import { useState, useMemo, useCallback } from "react";
import JsonLd from "@/components/JsonLd";
import RelatedTools from "@/components/RelatedTools";
import ToolBreadcrumb from "@/components/ToolBreadcrumb";
import {
  generateFAQSchema,
  generateWebAppSchema,
  generateBreadcrumbSchema,
} from "@/lib/jsonld";

type DiffMode = "line" | "word";

interface DiffLine {
  type: "added" | "removed" | "unchanged";
  content: string;
  leftNum?: number;
  rightNum?: number;
}

function computeLCS(a: string[], b: string[]): number[][] {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }
  return dp;
}

function computeLineDiff(
  original: string,
  modified: string,
  ignoreWhitespace: boolean,
  ignoreCase: boolean
): DiffLine[] {
  const normalise = (s: string) => {
    let r = s;
    if (ignoreWhitespace) r = r.replace(/\s+/g, " ").trim();
    if (ignoreCase) r = r.toLowerCase();
    return r;
  };

  const aLines = original.split("\n");
  const bLines = modified.split("\n");
  const aNorm = aLines.map(normalise);
  const bNorm = bLines.map(normalise);

  const dp = computeLCS(aNorm, bNorm);
  const result: DiffLine[] = [];

  let i = aLines.length;
  let j = bLines.length;

  const stack: DiffLine[] = [];
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && aNorm[i - 1] === bNorm[j - 1]) {
      stack.push({ type: "unchanged", content: aLines[i - 1], leftNum: i, rightNum: j });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      stack.push({ type: "added", content: bLines[j - 1], rightNum: j });
      j--;
    } else {
      stack.push({ type: "removed", content: aLines[i - 1], leftNum: i });
      i--;
    }
  }

  for (let k = stack.length - 1; k >= 0; k--) {
    result.push(stack[k]);
  }
  return result;
}

interface WordSegment {
  type: "added" | "removed" | "unchanged";
  text: string;
}

function computeWordDiff(
  original: string,
  modified: string,
  ignoreWhitespace: boolean,
  ignoreCase: boolean
): WordSegment[] {
  const normalise = (s: string) => {
    let r = s;
    if (ignoreCase) r = r.toLowerCase();
    return r;
  };

  const splitWords = (s: string) => {
    if (ignoreWhitespace) {
      return s.split(/(\s+)/).filter((t) => t.length > 0 && t.trim().length > 0);
    }
    return s.split(/(\s+)/).filter((t) => t.length > 0);
  };

  const aWords = splitWords(original);
  const bWords = splitWords(modified);
  const aNorm = aWords.map(normalise);
  const bNorm = bWords.map(normalise);

  const dp = computeLCS(aNorm, bNorm);
  const stack: WordSegment[] = [];

  let i = aWords.length;
  let j = bWords.length;

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && aNorm[i - 1] === bNorm[j - 1]) {
      stack.push({ type: "unchanged", text: bWords[j - 1] });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      stack.push({ type: "added", text: bWords[j - 1] });
      j--;
    } else {
      stack.push({ type: "removed", text: aWords[i - 1] });
      i--;
    }
  }

  stack.reverse();

  // Merge adjacent segments of the same type
  const merged: WordSegment[] = [];
  for (const seg of stack) {
    if (merged.length > 0 && merged[merged.length - 1].type === seg.type) {
      merged[merged.length - 1].text += seg.text;
    } else {
      merged.push({ ...seg });
    }
  }
  return merged;
}

export default function TextDiffComparePage() {
  const [original, setOriginal] = useState("");
  const [modified, setModified] = useState("");
  const [ignoreWhitespace, setIgnoreWhitespace] = useState(false);
  const [ignoreCase, setIgnoreCase] = useState(false);
  const [diffMode, setDiffMode] = useState<DiffMode>("line");

  const handleSwap = useCallback(() => {
    setOriginal((prev) => {
      setModified(prev);
      return modified;
    });
  }, [modified]);

  const handleClear = useCallback(() => {
    setOriginal("");
    setModified("");
  }, []);

  const lineDiff = useMemo(
    () => computeLineDiff(original, modified, ignoreWhitespace, ignoreCase),
    [original, modified, ignoreWhitespace, ignoreCase]
  );

  const wordDiff = useMemo(
    () => computeWordDiff(original, modified, ignoreWhitespace, ignoreCase),
    [original, modified, ignoreWhitespace, ignoreCase]
  );

  const stats = useMemo(() => {
    const added = lineDiff.filter((d) => d.type === "added").length;
    const removed = lineDiff.filter((d) => d.type === "removed").length;
    const unchanged = lineDiff.filter((d) => d.type === "unchanged").length;
    return { added, removed, unchanged };
  }, [lineDiff]);

  const hasDiff = original.length > 0 || modified.length > 0;

  return (
    <>
      <title>Text Diff & Compare - Free Online Diff Checker | DevTools Hub</title>
      <meta
        name="description"
        content="Compare two texts and see differences highlighted side by side. Line-by-line and word-by-word diff with options to ignore whitespace and case. Free online diff checker tool."
      />
      <JsonLd
        data={[
          generateWebAppSchema({
            slug: "text-diff-compare",
            name: "Text Diff & Compare",
            description:
              "Compare two texts and find differences with line-by-line and word-by-word highlighting",
            category: "text",
          }),
          generateBreadcrumbSchema({
            slug: "text-diff-compare",
            name: "Text Diff & Compare",
            description:
              "Compare two texts and find differences with line-by-line and word-by-word highlighting",
            category: "text",
          }),
          generateFAQSchema([
            {
              question: "How does the text diff tool work?",
              answer:
                "The tool uses a Longest Common Subsequence (LCS) algorithm to compare the two texts. It identifies lines or words that are added, removed, or unchanged, then highlights them with colour coding: green for additions, red for deletions, and no highlight for unchanged content.",
            },
            {
              question: "What is the difference between line-by-line and word-by-word diff?",
              answer:
                "Line-by-line diff compares entire lines and marks each line as added, removed, or unchanged. Word-by-word diff breaks the text into individual words and highlights exactly which words changed, making it easier to spot small edits within a line.",
            },
            {
              question: "What does 'ignore whitespace' do?",
              answer:
                "When enabled, the tool normalises all whitespace (spaces, tabs, multiple spaces) to a single space before comparing. This means differences caused only by formatting or indentation changes are ignored.",
            },
            {
              question: "Is there a size limit for the texts?",
              answer:
                "No server-imposed limit. The tool runs entirely in your browser. Very large texts (over 100,000 lines) may cause some lag due to the comparison algorithm running client-side.",
            },
            {
              question: "Can I use this to compare code?",
              answer:
                "Yes. The tool works with any plain text, including source code, configuration files, JSON, CSV, and more. Use the line-by-line mode for code diffs and enable ignore-whitespace to focus on meaningful changes.",
            },
          ]),
        ]}
      />

      <div className="min-h-screen bg-slate-900 text-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <ToolBreadcrumb slug="text-diff-compare" />

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
              Text Diff & Compare
            </h1>
            <p className="text-slate-400 max-w-2xl text-lg">
              Paste your original and modified text below to see differences
              highlighted instantly. Supports line-by-line and word-by-word
              comparison.
            </p>
          </div>

          {/* Options bar */}
          <div className="flex flex-wrap items-center gap-4 mb-6">
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-400">Mode:</span>
              <button
                onClick={() => setDiffMode("line")}
                className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                  diffMode === "line"
                    ? "bg-blue-600 text-white"
                    : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                }`}
              >
                Line-by-Line
              </button>
              <button
                onClick={() => setDiffMode("word")}
                className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                  diffMode === "word"
                    ? "bg-blue-600 text-white"
                    : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                }`}
              >
                Word-by-Word
              </button>
            </div>

            <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={ignoreWhitespace}
                onChange={(e) => setIgnoreWhitespace(e.target.checked)}
                className="rounded border-slate-500 bg-slate-700 text-blue-500 focus:ring-blue-500"
              />
              Ignore whitespace
            </label>

            <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={ignoreCase}
                onChange={(e) => setIgnoreCase(e.target.checked)}
                className="rounded border-slate-500 bg-slate-700 text-blue-500 focus:ring-blue-500"
              />
              Ignore case
            </label>

            <div className="flex items-center gap-2 ml-auto">
              <button
                onClick={handleSwap}
                className="px-3 py-1.5 rounded text-sm font-medium bg-slate-700 text-slate-300 hover:bg-slate-600 transition-colors"
                title="Swap original and modified"
              >
                Swap Sides
              </button>
              <button
                onClick={handleClear}
                className="px-3 py-1.5 rounded text-sm font-medium bg-slate-700 text-slate-300 hover:bg-slate-600 transition-colors"
              >
                Clear All
              </button>
            </div>
          </div>

          {/* Input areas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Original Text
              </label>
              <textarea
                value={original}
                onChange={(e) => setOriginal(e.target.value)}
                placeholder="Paste original text here..."
                className="w-full h-56 bg-slate-800 border border-slate-600 rounded-lg p-4 text-sm text-slate-200 placeholder-slate-500 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                spellCheck={false}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Modified Text
              </label>
              <textarea
                value={modified}
                onChange={(e) => setModified(e.target.value)}
                placeholder="Paste modified text here..."
                className="w-full h-56 bg-slate-800 border border-slate-600 rounded-lg p-4 text-sm text-slate-200 placeholder-slate-500 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                spellCheck={false}
              />
            </div>
          </div>

          {/* Stats */}
          {hasDiff && (
            <div className="flex flex-wrap items-center gap-6 mb-6 p-4 bg-slate-800 border border-slate-700 rounded-lg">
              <div className="flex items-center gap-2">
                <span className="inline-block w-3 h-3 rounded-sm bg-green-600" />
                <span className="text-sm text-slate-300">
                  <span className="font-semibold text-green-400">{stats.added}</span> line{stats.added !== 1 ? "s" : ""} added
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-block w-3 h-3 rounded-sm bg-red-600" />
                <span className="text-sm text-slate-300">
                  <span className="font-semibold text-red-400">{stats.removed}</span> line{stats.removed !== 1 ? "s" : ""} removed
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-block w-3 h-3 rounded-sm bg-slate-600" />
                <span className="text-sm text-slate-300">
                  <span className="font-semibold text-slate-200">{stats.unchanged}</span> line{stats.unchanged !== 1 ? "s" : ""} unchanged
                </span>
              </div>
            </div>
          )}

          {/* Diff output */}
          {hasDiff && (
            <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden mb-8">
              <div className="px-4 py-3 border-b border-slate-700">
                <h2 className="text-lg font-semibold text-white">
                  Diff Result
                </h2>
              </div>

              {diffMode === "line" ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm font-mono">
                    <tbody>
                      {lineDiff.map((line, idx) => (
                        <tr
                          key={idx}
                          className={
                            line.type === "added"
                              ? "bg-green-950/50"
                              : line.type === "removed"
                              ? "bg-red-950/50"
                              : ""
                          }
                        >
                          <td className="w-12 text-right pr-2 pl-3 py-0.5 text-slate-500 select-none border-r border-slate-700/50">
                            {line.leftNum ?? ""}
                          </td>
                          <td className="w-12 text-right pr-2 pl-2 py-0.5 text-slate-500 select-none border-r border-slate-700/50">
                            {line.rightNum ?? ""}
                          </td>
                          <td className="w-6 text-center py-0.5 select-none">
                            {line.type === "added" ? (
                              <span className="text-green-400 font-bold">+</span>
                            ) : line.type === "removed" ? (
                              <span className="text-red-400 font-bold">-</span>
                            ) : (
                              <span className="text-slate-600">&nbsp;</span>
                            )}
                          </td>
                          <td
                            className={`px-3 py-0.5 whitespace-pre-wrap break-all ${
                              line.type === "added"
                                ? "text-green-300"
                                : line.type === "removed"
                                ? "text-red-300"
                                : "text-slate-300"
                            }`}
                          >
                            {line.content || "\u00A0"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-4 font-mono text-sm whitespace-pre-wrap break-all leading-relaxed">
                  {wordDiff.map((seg, idx) => (
                    <span
                      key={idx}
                      className={
                        seg.type === "added"
                          ? "bg-green-800/60 text-green-300 rounded px-0.5"
                          : seg.type === "removed"
                          ? "bg-red-800/60 text-red-300 line-through rounded px-0.5"
                          : "text-slate-300"
                      }
                    >
                      {seg.text}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          <RelatedTools currentSlug="text-diff-compare" />

          {/* FAQ Section */}
          <section className="mt-16 border-t border-slate-700 pt-10">
            <h2 className="text-2xl font-bold text-white mb-6">
              Frequently Asked Questions
            </h2>

            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  How does the text diff tool work?
                </h3>
                <p className="text-slate-400">
                  The tool uses a Longest Common Subsequence (LCS) algorithm to
                  compare the two texts. It identifies lines or words that are
                  added, removed, or unchanged, then highlights them with colour
                  coding: green for additions, red for deletions, and no
                  highlight for unchanged content.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  What is the difference between line-by-line and word-by-word
                  diff?
                </h3>
                <p className="text-slate-400">
                  Line-by-line diff compares entire lines and marks each line as
                  added, removed, or unchanged. Word-by-word diff breaks the
                  text into individual words and highlights exactly which words
                  changed, making it easier to spot small edits within a line.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  What does &ldquo;ignore whitespace&rdquo; do?
                </h3>
                <p className="text-slate-400">
                  When enabled, the tool normalises all whitespace (spaces, tabs,
                  multiple spaces) to a single space before comparing. This means
                  differences caused only by formatting or indentation changes
                  are ignored.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Is there a size limit for the texts?
                </h3>
                <p className="text-slate-400">
                  No server-imposed limit. The tool runs entirely in your
                  browser. Very large texts (over 100,000 lines) may cause some
                  lag due to the comparison algorithm running client-side.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Can I use this to compare code?
                </h3>
                <p className="text-slate-400">
                  Yes. The tool works with any plain text, including source code,
                  configuration files, JSON, CSV, and more. Use the line-by-line
                  mode for code diffs and enable ignore-whitespace to focus on
                  meaningful changes.
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
