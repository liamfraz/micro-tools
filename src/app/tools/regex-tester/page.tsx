"use client";

import { useState, useMemo, useCallback } from "react";
import JsonLd from "@/components/JsonLd";
import RelatedTools from "@/components/RelatedTools";
import {
  generateFAQSchema,
  generateWebAppSchema,
  generateBreadcrumbSchema,
} from "@/lib/jsonld";

interface MatchResult {
  match: string;
  index: number;
  groups: Record<string, string> | null;
}

export default function RegexTesterPage() {
  const [pattern, setPattern] = useState("");
  const [flags, setFlags] = useState("g");
  const [testString, setTestString] = useState("");
  const [replacement, setReplacement] = useState("");
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"match" | "replace">("match");

  const flagOptions = [
    { flag: "g", label: "Global", desc: "Find all matches" },
    { flag: "i", label: "Case Insensitive", desc: "Ignore case" },
    { flag: "m", label: "Multiline", desc: "^ and $ match line boundaries" },
    { flag: "s", label: "Dotall", desc: ". matches newlines" },
    { flag: "u", label: "Unicode", desc: "Unicode support" },
  ];

  const toggleFlag = useCallback(
    (f: string) => {
      setFlags((prev) => (prev.includes(f) ? prev.replace(f, "") : prev + f));
    },
    []
  );

  const { matches, error, matchCount } = useMemo(() => {
    if (!pattern || !testString) {
      return { matches: [] as MatchResult[], error: null, matchCount: 0 };
    }
    try {
      const regex = new RegExp(pattern, flags);
      const results: MatchResult[] = [];

      if (flags.includes("g")) {
        let m;
        while ((m = regex.exec(testString)) !== null) {
          results.push({
            match: m[0],
            index: m.index,
            groups: m.groups ? { ...m.groups } : null,
          });
          if (m[0].length === 0) {
            regex.lastIndex++;
          }
        }
      } else {
        const m = regex.exec(testString);
        if (m) {
          results.push({
            match: m[0],
            index: m.index,
            groups: m.groups ? { ...m.groups } : null,
          });
        }
      }

      return { matches: results, error: null, matchCount: results.length };
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Invalid regex";
      return { matches: [] as MatchResult[], error: msg, matchCount: 0 };
    }
  }, [pattern, flags, testString]);

  const replacedText = useMemo(() => {
    if (!pattern || !testString || !replacement) return "";
    try {
      const regex = new RegExp(pattern, flags);
      return testString.replace(regex, replacement);
    } catch {
      return "";
    }
  }, [pattern, flags, testString, replacement]);

  const highlightedText = useMemo(() => {
    if (!pattern || !testString || matches.length === 0) return null;

    const parts: { text: string; highlighted: boolean }[] = [];
    let lastIndex = 0;

    for (const m of matches) {
      if (m.index > lastIndex) {
        parts.push({
          text: testString.slice(lastIndex, m.index),
          highlighted: false,
        });
      }
      parts.push({ text: m.match, highlighted: true });
      lastIndex = m.index + m.match.length;
    }

    if (lastIndex < testString.length) {
      parts.push({ text: testString.slice(lastIndex), highlighted: false });
    }

    return parts;
  }, [pattern, testString, matches]);

  const copyPattern = useCallback(async () => {
    const full = `/${pattern}/${flags}`;
    await navigator.clipboard.writeText(full);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [pattern, flags]);

  const clearAll = useCallback(() => {
    setPattern("");
    setFlags("g");
    setTestString("");
    setReplacement("");
  }, []);

  return (
    <>
      <title>Regex Tester - Free Online Regular Expression Tool | DevTools Hub</title>
      <meta
        name="description"
        content="Test and debug regular expressions online for free. Real-time matching with highlighting, flag toggles, match groups, replacement preview, and instant validation."
      />
      <JsonLd
        data={[
          generateWebAppSchema({
            slug: "regex-tester",
            name: "Regex Tester",
            description: "Test and debug regular expressions with real-time matching, highlighting, and replacement preview",
            category: "developer",
          }),
          generateBreadcrumbSchema({
            slug: "regex-tester",
            name: "Regex Tester",
            description: "Test and debug regular expressions with real-time matching, highlighting, and replacement preview",
            category: "developer",
          }),
          generateFAQSchema([
            { question: "What is a regular expression?", answer: "A regular expression (regex) is a sequence of characters that defines a search pattern. It is used for pattern matching within strings -- finding, validating, extracting, and replacing text. Regex is supported in virtually all programming languages including JavaScript, Python, Java, and Go." },
            { question: "What do the flags mean?", answer: "g (global) finds all matches instead of stopping at the first. i makes the match case-insensitive. m (multiline) lets ^ and $ match line boundaries instead of the full string. s (dotall) lets the dot (.) match newlines. u enables full Unicode matching." },
            { question: "How do capture groups work?", answer: "Parentheses (...) create capture groups that extract parts of a match. You can reference them in replacements as $1, $2, etc. Named groups use the syntax (?<name>...) and can be referenced as $<name>. Non-capturing groups (?:...) group without capturing." },
            { question: "Is my data processed on a server?", answer: "No. All regex testing runs entirely in your browser using JavaScript's built-in RegExp engine. Your data never leaves your device." },
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
              <li className="text-slate-200">Regex Tester</li>
            </ol>
          </nav>

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
              Regex Tester
            </h1>
            <p className="text-slate-400 max-w-2xl text-lg">
              Test and debug your regular expressions in real time. See matches
              highlighted instantly, inspect capture groups, and preview
              replacements — all in your browser.
            </p>
          </div>

          {/* Pattern Input */}
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <label className="text-sm font-medium text-slate-300">
                Pattern
              </label>
              {error && (
                <span className="text-xs text-red-400 bg-red-900/40 px-2 py-0.5 rounded">
                  {error}
                </span>
              )}
              {!error && pattern && (
                <span className="text-xs text-green-400 bg-green-900/40 px-2 py-0.5 rounded">
                  {matchCount} match{matchCount !== 1 ? "es" : ""}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-500 text-xl font-mono">/</span>
              <input
                type="text"
                value={pattern}
                onChange={(e) => setPattern(e.target.value)}
                placeholder="Enter regex pattern..."
                className={`flex-1 bg-slate-800 border rounded-lg px-4 py-3 font-mono text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  error ? "border-red-600" : "border-slate-600"
                }`}
                spellCheck={false}
              />
              <span className="text-slate-500 text-xl font-mono">/</span>
              <input
                type="text"
                value={flags}
                onChange={(e) => setFlags(e.target.value)}
                className="w-20 bg-slate-800 border border-slate-600 rounded-lg px-3 py-3 font-mono text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                spellCheck={false}
              />
            </div>
          </div>

          {/* Flag Toggles */}
          <div className="flex flex-wrap gap-2 mb-6">
            {flagOptions.map((opt) => (
              <button
                key={opt.flag}
                onClick={() => toggleFlag(opt.flag)}
                title={opt.desc}
                className={`px-3 py-1.5 text-xs font-mono rounded-lg border transition-colors ${
                  flags.includes(opt.flag)
                    ? "bg-blue-600 border-blue-500 text-white"
                    : "bg-slate-800 border-slate-600 text-slate-400 hover:text-white"
                }`}
              >
                {opt.flag} <span className="font-sans ml-1">{opt.label}</span>
              </button>
            ))}
            <div className="ml-auto flex items-center gap-2">
              <button
                onClick={copyPattern}
                disabled={!pattern}
                className="px-3 py-1.5 text-xs bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors disabled:opacity-40"
              >
                {copied ? "Copied!" : "Copy Regex"}
              </button>
              <button
                onClick={clearAll}
                className="px-3 py-1.5 text-xs bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
              >
                Clear All
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mb-4">
            <button
              onClick={() => setActiveTab("match")}
              className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                activeTab === "match"
                  ? "bg-slate-800 text-white"
                  : "bg-slate-900 text-slate-400 hover:text-white"
              }`}
            >
              Match
            </button>
            <button
              onClick={() => setActiveTab("replace")}
              className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                activeTab === "replace"
                  ? "bg-slate-800 text-white"
                  : "bg-slate-900 text-slate-400 hover:text-white"
              }`}
            >
              Replace
            </button>
          </div>

          {/* Test String */}
          <div className="mb-4">
            <label className="text-sm font-medium text-slate-300 mb-2 block">
              Test String
            </label>
            <textarea
              value={testString}
              onChange={(e) => setTestString(e.target.value)}
              placeholder="Enter text to test against your regex..."
              className="w-full h-40 bg-slate-800 border border-slate-600 rounded-lg p-4 font-mono text-sm text-slate-200 placeholder-slate-500 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              spellCheck={false}
            />
          </div>

          {/* Highlighted Preview */}
          {highlightedText && highlightedText.length > 0 && (
            <div className="mb-6">
              <label className="text-sm font-medium text-slate-300 mb-2 block">
                Highlighted Matches
              </label>
              <div className="bg-slate-800 border border-slate-600 rounded-lg p-4 font-mono text-sm whitespace-pre-wrap break-all">
                {highlightedText.map((part, i) =>
                  part.highlighted ? (
                    <mark
                      key={i}
                      className="bg-yellow-400/30 text-yellow-200 rounded px-0.5"
                    >
                      {part.text}
                    </mark>
                  ) : (
                    <span key={i} className="text-slate-300">
                      {part.text}
                    </span>
                  )
                )}
              </div>
            </div>
          )}

          {/* Replace Tab Content */}
          {activeTab === "replace" && (
            <div className="mb-6">
              <label className="text-sm font-medium text-slate-300 mb-2 block">
                Replacement String
              </label>
              <input
                type="text"
                value={replacement}
                onChange={(e) => setReplacement(e.target.value)}
                placeholder="Enter replacement (supports $1, $2, $&, etc.)..."
                className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-3 font-mono text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-3"
                spellCheck={false}
              />
              {replacedText && (
                <div>
                  <label className="text-sm font-medium text-slate-300 mb-2 block">
                    Result
                  </label>
                  <div className="bg-slate-800 border border-slate-600 rounded-lg p-4 font-mono text-sm text-green-300 whitespace-pre-wrap break-all">
                    {replacedText}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Match Details */}
          {matches.length > 0 && (
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-white mb-3">
                Match Details ({matchCount})
              </h2>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {matches.map((m, i) => (
                  <div
                    key={i}
                    className="bg-slate-800 border border-slate-700 rounded-lg p-3 flex flex-wrap items-center gap-4 text-sm"
                  >
                    <span className="text-slate-500 font-mono w-8">
                      #{i + 1}
                    </span>
                    <span className="font-mono text-yellow-300">
                      &quot;{m.match}&quot;
                    </span>
                    <span className="text-slate-400">
                      index: {m.index}
                    </span>
                    {m.groups && Object.keys(m.groups).length > 0 && (
                      <span className="text-slate-400">
                        groups:{" "}
                        {Object.entries(m.groups)
                          .map(([k, v]) => `${k}="${v}"`)
                          .join(", ")}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick Reference */}
          <section className="mb-16 border-t border-slate-700 pt-10">
            <h2 className="text-xl font-bold text-white mb-4">
              Quick Reference
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {[
                { token: ".", desc: "Any character" },
                { token: "\\d", desc: "Digit [0-9]" },
                { token: "\\w", desc: "Word char [a-zA-Z0-9_]" },
                { token: "\\s", desc: "Whitespace" },
                { token: "^", desc: "Start of string" },
                { token: "$", desc: "End of string" },
                { token: "*", desc: "0 or more" },
                { token: "+", desc: "1 or more" },
                { token: "?", desc: "0 or 1" },
                { token: "{n,m}", desc: "n to m times" },
                { token: "[abc]", desc: "Character class" },
                { token: "(group)", desc: "Capture group" },
                { token: "(?:x)", desc: "Non-capturing group" },
                { token: "(?<name>x)", desc: "Named group" },
                { token: "x|y", desc: "Alternation" },
                { token: "\\b", desc: "Word boundary" },
              ].map((ref) => (
                <div
                  key={ref.token}
                  className="bg-slate-800 border border-slate-700 rounded p-2 text-xs"
                >
                  <code className="text-blue-400 font-mono">{ref.token}</code>
                  <span className="text-slate-400 ml-2">{ref.desc}</span>
                </div>
              ))}
            </div>
          </section>

          <RelatedTools currentSlug="regex-tester" />

          {/* FAQ Section */}
          <section className="border-t border-slate-700 pt-10">
            <h2 className="text-2xl font-bold text-white mb-6">
              Frequently Asked Questions
            </h2>

            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  What is a regular expression?
                </h3>
                <p className="text-slate-400">
                  A regular expression (regex) is a sequence of characters that
                  defines a search pattern. It is used for pattern matching
                  within strings — finding, validating, extracting, and
                  replacing text. Regex is supported in virtually all
                  programming languages including JavaScript, Python, Java, and
                  Go.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  What do the flags mean?
                </h3>
                <p className="text-slate-400">
                  <strong>g</strong> (global) finds all matches instead of
                  stopping at the first. <strong>i</strong> makes the match
                  case-insensitive. <strong>m</strong> (multiline) lets ^ and $
                  match line boundaries instead of the full string.{" "}
                  <strong>s</strong> (dotall) lets the dot (.) match newlines.{" "}
                  <strong>u</strong> enables full Unicode matching.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  How do capture groups work?
                </h3>
                <p className="text-slate-400">
                  Parentheses (...) create capture groups that extract parts of
                  a match. You can reference them in replacements as $1, $2, etc.
                  Named groups use the syntax (?&lt;name&gt;...) and can be
                  referenced as $&lt;name&gt;. Non-capturing groups (?:...)
                  group without capturing.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Is my data processed on a server?
                </h3>
                <p className="text-slate-400">
                  No. All regex testing runs entirely in your browser using
                  JavaScript&apos;s built-in RegExp engine. Your data never
                  leaves your device.
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
