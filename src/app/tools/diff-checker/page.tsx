"use client";

import { useState, useMemo, useCallback } from "react";
import JsonLd from "@/components/JsonLd";
import RelatedTools from "@/components/RelatedTools";
import ToolBreadcrumb from "@/components/ToolBreadcrumb";
import AdUnit from "@/components/AdUnit";
import {
  generateFAQSchema,
  generateWebAppSchema,
  generateBreadcrumbSchema,
} from "@/lib/jsonld";

// ---- Types ----

interface DiffLine {
  type: "equal" | "added" | "removed";
  text: string;
  leftNum: number | null;
  rightNum: number | null;
}

interface WordDiffSegment {
  type: "equal" | "added" | "removed";
  text: string;
}

// ---- Line Diff Algorithm (LCS) ----

function computeLineDiff(textA: string, textB: string): DiffLine[] {
  const linesA = textA.split("\n");
  const linesB = textB.split("\n");
  const m = linesA.length;
  const n = linesB.length;

  if (m * n > 1_000_000) {
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
      result.push({ type: "equal", text: a!, leftNum: i + 1, rightNum: i + 1 });
    } else {
      if (a !== undefined) {
        result.push({ type: "removed", text: a, leftNum: i + 1, rightNum: null });
      }
      if (b !== undefined) {
        result.push({ type: "added", text: b, leftNum: null, rightNum: i + 1 });
      }
    }
  }

  return result;
}

// ---- Word Diff Algorithm ----

function tokenize(line: string): string[] {
  const tokens: string[] = [];
  let current = "";
  for (const ch of line) {
    if (/\s/.test(ch)) {
      if (current) { tokens.push(current); current = ""; }
      tokens.push(ch);
    } else if (/[^\w]/.test(ch)) {
      if (current) { tokens.push(current); current = ""; }
      tokens.push(ch);
    } else {
      current += ch;
    }
  }
  if (current) tokens.push(current);
  return tokens;
}

function computeWordDiff(lineA: string, lineB: string): WordDiffSegment[] {
  const tokensA = tokenize(lineA);
  const tokensB = tokenize(lineB);
  const m = tokensA.length;
  const n = tokensB.length;

  if (m * n > 100_000) {
    return [
      { type: "removed", text: lineA },
      { type: "added", text: lineB },
    ];
  }

  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    Array(n + 1).fill(0)
  );

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (tokensA[i - 1] === tokensB[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  const segments: WordDiffSegment[] = [];
  let i = m;
  let j = n;

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && tokensA[i - 1] === tokensB[j - 1]) {
      segments.unshift({ type: "equal", text: tokensA[i - 1] });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      segments.unshift({ type: "added", text: tokensB[j - 1] });
      j--;
    } else {
      segments.unshift({ type: "removed", text: tokensA[i - 1] });
      i--;
    }
  }

  // Merge adjacent segments of the same type
  const merged: WordDiffSegment[] = [];
  for (const seg of segments) {
    if (merged.length > 0 && merged[merged.length - 1].type === seg.type) {
      merged[merged.length - 1].text += seg.text;
    } else {
      merged.push({ ...seg });
    }
  }

  return merged;
}

// ---- Component ----

export default function DiffCheckerPage() {
  const [textA, setTextA] = useState("");
  const [textB, setTextB] = useState("");
  const [ignoreWhitespace, setIgnoreWhitespace] = useState(false);
  const [ignoreCase, setIgnoreCase] = useState(false);
  const [viewMode, setViewMode] = useState<"unified" | "side-by-side">("unified");
  const [diffMode, setDiffMode] = useState<"line" | "word">("line");
  const [copied, setCopied] = useState(false);

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
    return computeLineDiff(a, b);
  }, [textA, textB, normalizeText]);

  const stats = useMemo(() => {
    const added = diff.filter((d) => d.type === "added").length;
    const removed = diff.filter((d) => d.type === "removed").length;
    const unchanged = diff.filter((d) => d.type === "equal").length;
    const identical = added === 0 && removed === 0 && (textA || textB);
    return { added, removed, unchanged, identical };
  }, [diff, textA, textB]);

  // Build word-level diffs for paired removed/added lines
  const wordDiffs = useMemo(() => {
    if (diffMode !== "word") return new Map<number, WordDiffSegment[]>();
    const map = new Map<number, WordDiffSegment[]>();
    for (let i = 0; i < diff.length; i++) {
      if (
        diff[i].type === "removed" &&
        i + 1 < diff.length &&
        diff[i + 1].type === "added"
      ) {
        const segments = computeWordDiff(diff[i].text, diff[i + 1].text);
        map.set(i, segments.filter((s) => s.type !== "added"));
        map.set(i + 1, segments.filter((s) => s.type !== "removed"));
      }
    }
    return map;
  }, [diff, diffMode]);

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

  const copyDiffOutput = useCallback(async () => {
    const lines = diff.map((line) => {
      const prefix =
        line.type === "added" ? "+" : line.type === "removed" ? "-" : " ";
      return `${prefix} ${line.text}`;
    });
    await navigator.clipboard.writeText(lines.join("\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [diff]);

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

  const renderWordDiffLine = (segments: WordDiffSegment[], lineType: "removed" | "added") => {
    return segments.map((seg, i) => {
      if (seg.type === "equal") {
        return (
          <span key={i} className={lineType === "removed" ? "text-red-300" : "text-green-300"}>
            {seg.text}
          </span>
        );
      }
      return (
        <span
          key={i}
          className={
            lineType === "removed"
              ? "bg-red-700/60 text-red-100 rounded-sm"
              : "bg-green-700/60 text-green-100 rounded-sm"
          }
        >
          {seg.text}
        </span>
      );
    });
  };

  const renderLineContent = (line: DiffLine, index: number) => {
    const wordDiff = wordDiffs.get(index);
    if (wordDiff && (line.type === "removed" || line.type === "added")) {
      return renderWordDiffLine(wordDiff, line.type);
    }
    return <span className={getTextColor(line.type)}>{line.text}</span>;
  };

  // Split diff for side-by-side view
  const sideBySide = useMemo(() => {
    const left: { line: DiffLine | null; idx: number }[] = [];
    const right: { line: DiffLine | null; idx: number }[] = [];

    let i = 0;
    while (i < diff.length) {
      const line = diff[i];
      if (line.type === "equal") {
        left.push({ line, idx: i });
        right.push({ line, idx: i });
        i++;
      } else if (line.type === "removed") {
        if (i + 1 < diff.length && diff[i + 1].type === "added") {
          left.push({ line, idx: i });
          right.push({ line: diff[i + 1], idx: i + 1 });
          i += 2;
        } else {
          left.push({ line, idx: i });
          right.push({ line: null, idx: i });
          i++;
        }
      } else {
        left.push({ line: null, idx: i });
        right.push({ line, idx: i });
        i++;
      }
    }

    return { left, right };
  }, [diff]);

  return (
    <>
      <title>
        Diff Checker — Compare Text Online Free | DevTools
      </title>
      <meta
        name="description"
        content="Free online diff checker to compare two texts instantly. Side-by-side and unified views, word-by-word highlighting, ignore whitespace. Compare code, configs, and documents — no data uploaded."
      />
      <meta
        name="keywords"
        content="diff checker, diff checker online, text compare, text compare tool, compare two texts, online diff tool, code diff, text difference checker, compare text online, file compare, diff viewer"
      />
      <JsonLd
        data={[
          generateWebAppSchema({
            slug: "diff-checker",
            name: "Diff Checker",
            description:
              "Compare two blocks of text online and highlight differences. Line-by-line and word-by-word diff with unified and side-by-side views.",
            category: "developer",
          }),
          generateBreadcrumbSchema({
            slug: "diff-checker",
            name: "Diff Checker",
            description:
              "Compare two blocks of text online and highlight differences",
            category: "developer",
          }),
          generateFAQSchema([
            {
              question: "What is a diff checker?",
              answer:
                "A diff checker compares two blocks of text and highlights the differences between them. It shows which lines were added, removed, or remain unchanged. This is essential for comparing code versions, configuration files, documents, and any text where you need to track changes.",
            },
            {
              question:
                "What is the difference between line-by-line and word-by-word diff?",
              answer:
                "Line-by-line diff highlights entire lines that differ. Word-by-word diff goes further by highlighting the specific words within a changed line that are different, making it much easier to spot small changes within long lines.",
            },
            {
              question:
                "What is the difference between unified and side-by-side view?",
              answer:
                'Unified view shows all changes in a single column with + and - prefixes, similar to git diff output. Side-by-side view shows the original and modified text in two columns, making it easier to visually compare corresponding lines.',
            },
            {
              question: 'What does "ignore whitespace" do?',
              answer:
                "When enabled, the diff checker trims leading and trailing whitespace from each line and collapses multiple spaces into one before comparing. This is useful when you only care about content changes and want to ignore formatting differences like indentation changes.",
            },
            {
              question: "Is my data processed on a server?",
              answer:
                "No. The diff algorithm runs entirely in your browser using JavaScript. Your text never leaves your device. The comparison uses a Longest Common Subsequence (LCS) algorithm to produce an optimal diff.",
            },
            {
              question: "Can I compare code files?",
              answer:
                "Yes. The diff checker works with any text including source code, configuration files, JSON, XML, CSV, and plain text documents. It preserves formatting with a monospace font and supports syntax-aware word-by-word comparisons.",
            },
          ]),
        ]}
      />

      <div className="min-h-screen bg-slate-900 text-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <ToolBreadcrumb slug="diff-checker" />

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
              Diff Checker
            </h1>
            <p className="text-slate-400 max-w-2xl text-lg">
              Compare two blocks of text and see the differences highlighted.
              Supports line-by-line and word-by-word diff modes with unified and
              side-by-side views. Ignore whitespace and case differences.
            </p>
          </div>

          <AdUnit slot="TOP_SLOT" format="horizontal" className="mb-6" />

          {/* Controls */}
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <button
              onClick={loadExample}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors text-sm"
            >
              Load Example
            </button>
            <button
              onClick={swapTexts}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors text-sm"
              title="Swap original and modified text"
            >
              Swap Panels
            </button>
            <button
              onClick={clearAll}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors text-sm"
            >
              Clear
            </button>

            <div className="ml-auto flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm text-slate-400 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={ignoreWhitespace}
                  onChange={(e) => setIgnoreWhitespace(e.target.checked)}
                  className="accent-blue-500"
                />
                Ignore whitespace
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-400 cursor-pointer select-none">
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

              <div className="ml-auto flex items-center gap-2">
                {/* Diff mode toggle */}
                <div className="flex rounded-lg overflow-hidden border border-slate-600 mr-2">
                  <button
                    onClick={() => setDiffMode("line")}
                    className={`px-3 py-1 text-xs font-medium transition-colors ${
                      diffMode === "line"
                        ? "bg-blue-600 text-white"
                        : "bg-slate-700 text-slate-400 hover:text-white"
                    }`}
                  >
                    Line
                  </button>
                  <button
                    onClick={() => setDiffMode("word")}
                    className={`px-3 py-1 text-xs font-medium transition-colors ${
                      diffMode === "word"
                        ? "bg-blue-600 text-white"
                        : "bg-slate-700 text-slate-400 hover:text-white"
                    }`}
                  >
                    Word
                  </button>
                </div>

                {/* View mode toggle */}
                <div className="flex rounded-lg overflow-hidden border border-slate-600 mr-2">
                  <button
                    onClick={() => setViewMode("unified")}
                    className={`px-3 py-1 text-xs font-medium transition-colors ${
                      viewMode === "unified"
                        ? "bg-blue-600 text-white"
                        : "bg-slate-700 text-slate-400 hover:text-white"
                    }`}
                  >
                    Unified
                  </button>
                  <button
                    onClick={() => setViewMode("side-by-side")}
                    className={`px-3 py-1 text-xs font-medium transition-colors ${
                      viewMode === "side-by-side"
                        ? "bg-blue-600 text-white"
                        : "bg-slate-700 text-slate-400 hover:text-white"
                    }`}
                  >
                    Side by Side
                  </button>
                </div>

                {/* Copy diff */}
                {diff.length > 0 && (
                  <button
                    onClick={copyDiffOutput}
                    className="px-3 py-1 text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white rounded-lg transition-colors"
                  >
                    {copied ? "Copied!" : "Copy Diff"}
                  </button>
                )}
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
                    <span className="flex-1 px-2 py-0.5 whitespace-pre">
                      {renderLineContent(line, i)}
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
                <div className="px-3 py-1.5 bg-slate-700/50 text-xs text-slate-400 font-medium sticky top-0 z-10">
                  Original
                </div>
                {sideBySide.left.map(({ line, idx }, i) => (
                  <div
                    key={i}
                    className={`flex font-mono text-sm ${
                      line ? getLineClass(line.type) : ""
                    } min-h-[1.5rem]`}
                  >
                    <span className="w-10 text-right px-2 py-0.5 text-slate-500 select-none shrink-0 border-r border-slate-700">
                      {line?.leftNum ?? ""}
                    </span>
                    <span className="flex-1 px-2 py-0.5 whitespace-pre">
                      {line
                        ? line.type === "equal"
                          ? <span className={getTextColor(line.type)}>{line.text}</span>
                          : renderLineContent(line, idx)
                        : ""}
                    </span>
                  </div>
                ))}
              </div>
              <div className="max-h-[600px] overflow-y-auto">
                <div className="px-3 py-1.5 bg-slate-700/50 text-xs text-slate-400 font-medium sticky top-0 z-10">
                  Modified
                </div>
                {sideBySide.right.map(({ line, idx }, i) => (
                  <div
                    key={i}
                    className={`flex font-mono text-sm ${
                      line ? getLineClass(line.type) : ""
                    } min-h-[1.5rem]`}
                  >
                    <span className="w-10 text-right px-2 py-0.5 text-slate-500 select-none shrink-0 border-r border-slate-700">
                      {line?.rightNum ?? ""}
                    </span>
                    <span className="flex-1 px-2 py-0.5 whitespace-pre">
                      {line
                        ? line.type === "equal"
                          ? <span className={getTextColor(line.type)}>{line.text}</span>
                          : renderLineContent(line, idx)
                        : ""}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <AdUnit slot="MIDDLE_SLOT" format="rectangle" className="mb-6" />

          {/* Tips */}
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 mb-6">
            <h2 className="text-lg font-semibold text-white mb-4">
              Diff Checker Tips
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
              {[
                {
                  name: "Word-by-word mode",
                  tip: "Switch to Word mode to see exactly which words changed within a line, not just that the line is different.",
                },
                {
                  name: "Ignore whitespace",
                  tip: "Toggle this to skip indentation and trailing space differences — useful when comparing code reformatted by different editors.",
                },
                {
                  name: "Side-by-side view",
                  tip: "Use side-by-side to visually align original and modified text. Great for code reviews and comparing config files.",
                },
                {
                  name: "Swap panels",
                  tip: "Click Swap Panels to flip original and modified text. Useful when you pasted them in the wrong order.",
                },
                {
                  name: "Copy diff output",
                  tip: "Copy the unified diff output to share with teammates or paste into a pull request comment.",
                },
                {
                  name: "All processing is local",
                  tip: "Your text never leaves your browser. The diff runs entirely in JavaScript — no server, no uploads, completely private.",
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

          <RelatedTools currentSlug="diff-checker" />

          <AdUnit slot="BOTTOM_SLOT" format="auto" className="my-8" />

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
                  What is the difference between line-by-line and word-by-word
                  diff?
                </h3>
                <p className="text-slate-400">
                  <strong>Line-by-line diff</strong> highlights entire lines that
                  have changed. <strong>Word-by-word diff</strong> goes further
                  by highlighting the specific words that differ within changed
                  lines, making it much easier to spot small edits in long lines
                  of code or text.
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
                  compare corresponding lines.
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
                  Can I compare code files?
                </h3>
                <p className="text-slate-400">
                  Yes. This diff checker works with any text including source
                  code, configuration files, JSON, XML, CSV, and plain text
                  documents. It preserves formatting with a monospace font and
                  supports syntax-aware word-by-word comparisons.
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
