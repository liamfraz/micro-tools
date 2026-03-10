"use client";

import { useState, useMemo, useCallback } from "react";

// ---- Diff Algorithm (Myers-like LCS approach) ----

interface DiffLine {
  type: "equal" | "added" | "removed";
  text: string;
  leftNum: number | null;
  rightNum: number | null;
}

function computeDiff(textA: string, textB: string): DiffLine[] {
  const linesA = textA.split("\n");
  const linesB = textB.split("\n");

  // Compute LCS table
  const m = linesA.length;
  const n = linesB.length;

  // For performance, limit to reasonable size
  if (m * n > 1_000_000) {
    // Fall back to simple line-by-line comparison for very large inputs
    return simpleCompare(linesA, linesB);
  }

  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    Array(n + 1).fill(0)
  );

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (linesA[i - 1] === linesB[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  // Backtrack to build diff
  const result: DiffLine[] = [];
  let i = m;
  let j = n;

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && linesA[i - 1] === linesB[j - 1]) {
      result.unshift({
        type: "equal",
        text: linesA[i - 1],
        leftNum: i,
        rightNum: j,
      });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      result.unshift({
        type: "added",
        text: linesB[j - 1],
        leftNum: null,
        rightNum: j,
      });
      j--;
    } else {
      result.unshift({
        type: "removed",
        text: linesA[i - 1],
        leftNum: i,
        rightNum: null,
      });
      i--;
    }
  }

  return result;
}

function simpleCompare(linesA: string[], linesB: string[]): DiffLine[] {
  const result: DiffLine[] = [];
  const maxLen = Math.max(linesA.length, linesB.length);

  for (let i = 0; i < maxLen; i++) {
    const a = i < linesA.length ? linesA[i] : undefined;
    const b = i < linesB.length ? linesB[i] : undefined;

    if (a === b) {
      result.push({
        type: "equal",
        text: a!,
        leftNum: i + 1,
        rightNum: i + 1,
      });
    } else {
      if (a !== undefined) {
        result.push({
          type: "removed",
          text: a,
          leftNum: i + 1,
          rightNum: null,
        });
      }
      if (b !== undefined) {
        result.push({
          type: "added",
          text: b,
          leftNum: null,
          rightNum: i + 1,
        });
      }
    }
  }

  return result;
}

// ---- Component ----

export default function DiffCheckerPage() {
  const [textA, setTextA] = useState("");
  const [textB, setTextB] = useState("");
  const [ignoreWhitespace, setIgnoreWhitespace] = useState(false);
  const [ignoreCase, setIgnoreCase] = useState(false);
  const [viewMode, setViewMode] = useState<"unified" | "side-by-side">(
    "unified"
  );

  const normalizeText = useCallback(
    (text: string): string => {
      let result = text;
      if (ignoreWhitespace) {
        result = result
          .split("\n")
          .map((line) => line.trim().replace(/\s+/g, " "))
          .join("\n");
      }
      if (ignoreCase) {
        result = result.toLowerCase();
      }
      return result;
    },
    [ignoreWhitespace, ignoreCase]
  );

  const diff = useMemo(() => {
    if (!textA && !textB) return [];
    const a = normalizeText(textA);
    const b = normalizeText(textB);
    return computeDiff(a, b);
  }, [textA, textB, normalizeText]);

  const stats = useMemo(() => {
    const added = diff.filter((d) => d.type === "added").length;
    const removed = diff.filter((d) => d.type === "removed").length;
    const unchanged = diff.filter((d) => d.type === "equal").length;
    const identical = added === 0 && removed === 0 && (textA || textB);
    return { added, removed, unchanged, identical };
  }, [diff, textA, textB]);

  const clearAll = useCallback(() => {
    setTextA("");
    setTextB("");
  }, []);

  const swapTexts = useCallback(() => {
    setTextA(textB);
    setTextB(textA);
  }, [textA, textB]);

  const loadExample = useCallback(() => {
    setTextA(
      `function greet(name) {\n  console.log("Hello, " + name);\n  return true;\n}\n\nconst result = greet("World");`
    );
    setTextB(
      `function greet(name, greeting = "Hello") {\n  console.log(greeting + ", " + name + "!");\n  return { success: true };\n}\n\nconst result = greet("World", "Hi");`
    );
  }, []);

  const getLineClass = (type: DiffLine["type"]): string => {
    switch (type) {
      case "added":
        return "bg-green-900/30 border-l-2 border-green-500";
      case "removed":
        return "bg-red-900/30 border-l-2 border-red-500";
      default:
        return "";
    }
  };

  const getLinePrefix = (type: DiffLine["type"]): string => {
    switch (type) {
      case "added":
        return "+";
      case "removed":
        return "-";
      default:
        return " ";
    }
  };

  const getTextColor = (type: DiffLine["type"]): string => {
    switch (type) {
      case "added":
        return "text-green-300";
      case "removed":
        return "text-red-300";
      default:
        return "text-slate-300";
    }
  };

  // Split diff for side-by-side view
  const sideBySide = useMemo(() => {
    const left: (DiffLine | null)[] = [];
    const right: (DiffLine | null)[] = [];

    let i = 0;
    while (i < diff.length) {
      const line = diff[i];
      if (line.type === "equal") {
        left.push(line);
        right.push(line);
        i++;
      } else if (line.type === "removed") {
        // Check if next line is added (replacement)
        if (i + 1 < diff.length && diff[i + 1].type === "added") {
          left.push(line);
          right.push(diff[i + 1]);
          i += 2;
        } else {
          left.push(line);
          right.push(null);
          i++;
        }
      } else {
        // added
        left.push(null);
        right.push(line);
        i++;
      }
    }

    return { left, right };
  }, [diff]);

  return (
    <>
      <title>Diff Checker - Free Online Text Compare Tool | DevTools Hub</title>
      <meta
        name="description"
        content="Compare two texts and find differences online for free. Side-by-side and unified diff views, ignore whitespace and case options. Perfect for comparing code, configs, and documents."
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
              <li className="text-slate-200">Diff Checker</li>
            </ol>
          </nav>

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
              Diff Checker
            </h1>
            <p className="text-slate-400 max-w-2xl text-lg">
              Compare two blocks of text and see the differences highlighted.
              Supports unified and side-by-side views with options to ignore
              whitespace and case differences.
            </p>
          </div>

          {/* Controls */}
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <button
              onClick={loadExample}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              Load Example
            </button>
            <button
              onClick={swapTexts}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors"
            >
              Swap
            </button>
            <button
              onClick={clearAll}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors"
            >
              Clear
            </button>

            <div className="ml-auto flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm text-slate-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={ignoreWhitespace}
                  onChange={(e) => setIgnoreWhitespace(e.target.checked)}
                  className="accent-blue-500"
                />
                Ignore whitespace
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={ignoreCase}
                  onChange={(e) => setIgnoreCase(e.target.checked)}
                  className="accent-blue-500"
                />
                Ignore case
              </label>
            </div>
          </div>

          {/* Input Panels */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-slate-300">
                  Original
                </label>
                <span className="text-xs text-slate-500">
                  {textA.split("\n").length} lines
                </span>
              </div>
              <textarea
                value={textA}
                onChange={(e) => setTextA(e.target.value)}
                placeholder="Paste original text here..."
                className="w-full h-48 bg-slate-800 border border-slate-600 rounded-lg p-4 font-mono text-sm text-slate-200 placeholder-slate-500 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                spellCheck={false}
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-slate-300">
                  Modified
                </label>
                <span className="text-xs text-slate-500">
                  {textB.split("\n").length} lines
                </span>
              </div>
              <textarea
                value={textB}
                onChange={(e) => setTextB(e.target.value)}
                placeholder="Paste modified text here..."
                className="w-full h-48 bg-slate-800 border border-slate-600 rounded-lg p-4 font-mono text-sm text-slate-200 placeholder-slate-500 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                spellCheck={false}
              />
            </div>
          </div>

          {/* Stats Bar */}
          {(textA || textB) && (
            <div className="flex flex-wrap items-center gap-4 mb-4 p-3 bg-slate-800 border border-slate-700 rounded-lg">
              {stats.identical ? (
                <span className="text-green-400 font-medium">
                  Texts are identical
                </span>
              ) : (
                <>
                  <span className="text-green-400 text-sm">
                    +{stats.added} added
                  </span>
                  <span className="text-red-400 text-sm">
                    -{stats.removed} removed
                  </span>
                  <span className="text-slate-400 text-sm">
                    {stats.unchanged} unchanged
                  </span>
                </>
              )}

              <div className="ml-auto flex items-center gap-1">
                <button
                  onClick={() => setViewMode("unified")}
                  className={`px-3 py-1 text-xs rounded-lg transition-colors ${
                    viewMode === "unified"
                      ? "bg-blue-600 text-white"
                      : "bg-slate-700 text-slate-400 hover:text-white"
                  }`}
                >
                  Unified
                </button>
                <button
                  onClick={() => setViewMode("side-by-side")}
                  className={`px-3 py-1 text-xs rounded-lg transition-colors ${
                    viewMode === "side-by-side"
                      ? "bg-blue-600 text-white"
                      : "bg-slate-700 text-slate-400 hover:text-white"
                  }`}
                >
                  Side by Side
                </button>
              </div>
            </div>
          )}

          {/* Diff Output - Unified */}
          {diff.length > 0 && viewMode === "unified" && (
            <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden mb-8">
              <div className="max-h-[600px] overflow-y-auto">
                {diff.map((line, i) => (
                  <div
                    key={i}
                    className={`flex font-mono text-sm ${getLineClass(
                      line.type
                    )} hover:bg-slate-700/30`}
                  >
                    <span className="w-12 text-right px-2 py-0.5 text-slate-500 select-none shrink-0 border-r border-slate-700">
                      {line.leftNum ?? ""}
                    </span>
                    <span className="w-12 text-right px-2 py-0.5 text-slate-500 select-none shrink-0 border-r border-slate-700">
                      {line.rightNum ?? ""}
                    </span>
                    <span
                      className={`w-6 text-center py-0.5 select-none shrink-0 ${
                        line.type === "added"
                          ? "text-green-400"
                          : line.type === "removed"
                          ? "text-red-400"
                          : "text-slate-600"
                      }`}
                    >
                      {getLinePrefix(line.type)}
                    </span>
                    <span
                      className={`flex-1 px-2 py-0.5 whitespace-pre ${getTextColor(
                        line.type
                      )}`}
                    >
                      {line.text}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Diff Output - Side by Side */}
          {diff.length > 0 && viewMode === "side-by-side" && (
            <div className="grid grid-cols-2 gap-0 bg-slate-800 border border-slate-700 rounded-lg overflow-hidden mb-8">
              <div className="border-r border-slate-700 max-h-[600px] overflow-y-auto">
                <div className="px-3 py-1.5 bg-slate-700/50 text-xs text-slate-400 font-medium sticky top-0">
                  Original
                </div>
                {sideBySide.left.map((line, i) => (
                  <div
                    key={i}
                    className={`flex font-mono text-sm ${
                      line ? getLineClass(line.type) : ""
                    } min-h-[1.5rem]`}
                  >
                    <span className="w-10 text-right px-2 py-0.5 text-slate-500 select-none shrink-0 border-r border-slate-700">
                      {line?.leftNum ?? ""}
                    </span>
                    <span
                      className={`flex-1 px-2 py-0.5 whitespace-pre ${
                        line ? getTextColor(line.type) : ""
                      }`}
                    >
                      {line?.text ?? ""}
                    </span>
                  </div>
                ))}
              </div>
              <div className="max-h-[600px] overflow-y-auto">
                <div className="px-3 py-1.5 bg-slate-700/50 text-xs text-slate-400 font-medium sticky top-0">
                  Modified
                </div>
                {sideBySide.right.map((line, i) => (
                  <div
                    key={i}
                    className={`flex font-mono text-sm ${
                      line ? getLineClass(line.type) : ""
                    } min-h-[1.5rem]`}
                  >
                    <span className="w-10 text-right px-2 py-0.5 text-slate-500 select-none shrink-0 border-r border-slate-700">
                      {line?.rightNum ?? ""}
                    </span>
                    <span
                      className={`flex-1 px-2 py-0.5 whitespace-pre ${
                        line ? getTextColor(line.type) : ""
                      }`}
                    >
                      {line?.text ?? ""}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* FAQ Section */}
          <section className="mt-16 border-t border-slate-700 pt-10">
            <h2 className="text-2xl font-bold text-white mb-6">
              Frequently Asked Questions
            </h2>

            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  What is a diff checker?
                </h3>
                <p className="text-slate-400">
                  A diff checker compares two blocks of text and highlights the
                  differences between them. It shows which lines were added,
                  removed, or remain unchanged. This is essential for comparing
                  code versions, configuration files, documents, and any text
                  where you need to track changes.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  What is the difference between unified and side-by-side view?
                </h3>
                <p className="text-slate-400">
                  <strong>Unified view</strong> shows all changes in a single
                  column with + and - prefixes, similar to git diff output.{" "}
                  <strong>Side-by-side view</strong> shows the original and
                  modified text in two columns, making it easier to visually
                  compare corresponding lines. Choose the view that works best
                  for your use case.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  What does &ldquo;ignore whitespace&rdquo; do?
                </h3>
                <p className="text-slate-400">
                  When enabled, the diff checker trims leading and trailing
                  whitespace from each line and collapses multiple spaces into
                  one before comparing. This is useful when you only care about
                  content changes and want to ignore formatting differences like
                  indentation changes.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Is my data processed on a server?
                </h3>
                <p className="text-slate-400">
                  No. The diff algorithm runs entirely in your browser using
                  JavaScript. Your text never leaves your device. The comparison
                  uses a Longest Common Subsequence (LCS) algorithm to produce
                  an optimal diff.
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
