"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import JsonLd from "@/components/JsonLd";
import RelatedTools from "@/components/RelatedTools";
import ToolBreadcrumb from "@/components/ToolBreadcrumb";
import AdUnit from "@/components/AdUnit";
import {
  generateFAQSchema,
  generateWebAppSchema,
  generateBreadcrumbSchema,
} from "@/lib/jsonld";

interface MatchResult {
  fullMatch: string;
  index: number;
  groups: string[];
  namedGroups: Record<string, string>;
}

interface PatternExplanation {
  token: string;
  description: string;
}

const COMMON_PATTERNS: { label: string; pattern: string; flags: string; description: string }[] = [
  { label: "Email Address", pattern: "[a-zA-Z0-9._%+\\-]+@[a-zA-Z0-9.\\-]+\\.[a-zA-Z]{2,}", flags: "g", description: "Matches standard email addresses" },
  { label: "URL", pattern: "https?:\\/\\/[\\w\\-._~:/?#\\[\\]@!$&'()*+,;=%]+", flags: "gi", description: "Matches HTTP and HTTPS URLs" },
  { label: "Phone (US)", pattern: "\\(?\\d{3}\\)?[\\s.\\-]?\\d{3}[\\s.\\-]?\\d{4}", flags: "g", description: "Matches US phone numbers in common formats" },
  { label: "IPv4 Address", pattern: "\\b(?:\\d{1,3}\\.){3}\\d{1,3}\\b", flags: "g", description: "Matches IPv4 addresses like 192.168.1.1" },
  { label: "Date (YYYY-MM-DD)", pattern: "\\d{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\\d|3[01])", flags: "g", description: "Matches ISO 8601 date format" },
  { label: "Hex Color", pattern: "#(?:[0-9a-fA-F]{3}){1,2}\\b", flags: "gi", description: "Matches hex color codes like #fff or #a1b2c3" },
  { label: "HTML Tag", pattern: "<\\/?[a-zA-Z][a-zA-Z0-9]*(?:\\s[^>]*)?\\/?>", flags: "g", description: "Matches opening and closing HTML tags" },
  { label: "Number", pattern: "-?\\d+(?:\\.\\d+)?", flags: "g", description: "Matches integers and decimals, positive or negative" },
  { label: "IPv6 Address", pattern: "(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}", flags: "gi", description: "Matches full IPv6 addresses" },
  { label: "Credit Card", pattern: "\\b(?:\\d[ -]*?){13,19}\\b", flags: "g", description: "Matches 13-19 digit credit card numbers" },
  { label: "Time (HH:MM:SS)", pattern: "(?:[01]\\d|2[0-3]):[0-5]\\d(?::[0-5]\\d)?", flags: "g", description: "Matches 24-hour time with optional seconds" },
  { label: "Slug", pattern: "[a-z0-9]+(?:-[a-z0-9]+)*", flags: "g", description: "Matches URL-friendly slugs like my-page-title" },
  { label: "Username", pattern: "[a-zA-Z0-9_]{3,16}", flags: "g", description: "Matches 3-16 char alphanumeric usernames" },
  { label: "Strong Password", pattern: "(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}", flags: "", description: "Requires uppercase, lowercase, digit, and special char" },
  { label: "MAC Address", pattern: "(?:[0-9a-fA-F]{2}[:-]){5}[0-9a-fA-F]{2}", flags: "gi", description: "Matches MAC addresses like 00:1B:44:11:3A:B7" },
  { label: "CSS Property", pattern: "[a-z-]+\\s*:\\s*[^;]+;", flags: "gi", description: "Matches CSS property: value pairs" },
  { label: "Markdown Link", pattern: "\\[([^\\]]+)\\]\\(([^)]+)\\)", flags: "g", description: "Matches [text](url) markdown links" },
  { label: "UUID", pattern: "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}", flags: "gi", description: "Matches standard UUIDs" },
  { label: "Whitespace Trim", pattern: "^\\s+|\\s+$", flags: "gm", description: "Matches leading and trailing whitespace" },
  { label: "Duplicate Words", pattern: "\\b(\\w+)\\s+\\1\\b", flags: "gi", description: "Finds repeated words like 'the the'" },
];

const QUICK_INSERT = [
  { label: "\\d", value: "\\d", tip: "Digit [0-9]" },
  { label: "\\w", value: "\\w", tip: "Word char [a-zA-Z0-9_]" },
  { label: "\\s", value: "\\s", tip: "Whitespace" },
  { label: "\\b", value: "\\b", tip: "Word boundary" },
  { label: "[a-z]", value: "[a-z]", tip: "Lowercase letter" },
  { label: "[0-9]", value: "[0-9]", tip: "Digit range" },
  { label: ".", value: ".", tip: "Any character" },
  { label: "*", value: "*", tip: "0 or more" },
  { label: "+", value: "+", tip: "1 or more" },
  { label: "?", value: "?", tip: "0 or 1" },
  { label: "{n,m}", value: "{,}", tip: "Between n and m" },
  { label: "()", value: "()", tip: "Capture group" },
  { label: "(?:)", value: "(?:)", tip: "Non-capture group" },
  { label: "|", value: "|", tip: "Alternation (OR)" },
  { label: "^", value: "^", tip: "Start of string" },
  { label: "$", value: "$", tip: "End of string" },
];

const CHEAT_SHEET: { category: string; items: { token: string; desc: string }[] }[] = [
  {
    category: "Character Classes",
    items: [
      { token: ".", desc: "Any character except newline" },
      { token: "\\d", desc: "Digit [0-9]" },
      { token: "\\D", desc: "Not a digit [^0-9]" },
      { token: "\\w", desc: "Word character [a-zA-Z0-9_]" },
      { token: "\\W", desc: "Not a word character" },
      { token: "\\s", desc: "Whitespace (space, tab, newline)" },
      { token: "\\S", desc: "Not whitespace" },
    ],
  },
  {
    category: "Anchors",
    items: [
      { token: "^", desc: "Start of string (or line with m flag)" },
      { token: "$", desc: "End of string (or line with m flag)" },
      { token: "\\b", desc: "Word boundary" },
      { token: "\\B", desc: "Not a word boundary" },
    ],
  },
  {
    category: "Quantifiers",
    items: [
      { token: "*", desc: "0 or more" },
      { token: "+", desc: "1 or more" },
      { token: "?", desc: "0 or 1 (optional)" },
      { token: "{n}", desc: "Exactly n times" },
      { token: "{n,}", desc: "n or more times" },
      { token: "{n,m}", desc: "Between n and m times" },
      { token: "*?", desc: "0 or more (lazy)" },
      { token: "+?", desc: "1 or more (lazy)" },
    ],
  },
  {
    category: "Groups & Lookaround",
    items: [
      { token: "(abc)", desc: "Capture group" },
      { token: "(?:abc)", desc: "Non-capturing group" },
      { token: "(?<name>abc)", desc: "Named capture group" },
      { token: "(?=abc)", desc: "Positive lookahead" },
      { token: "(?!abc)", desc: "Negative lookahead" },
      { token: "(?<=abc)", desc: "Positive lookbehind" },
      { token: "(?<!abc)", desc: "Negative lookbehind" },
      { token: "\\1", desc: "Backreference to group 1" },
    ],
  },
  {
    category: "Flags",
    items: [
      { token: "g", desc: "Global — find all matches" },
      { token: "i", desc: "Case-insensitive matching" },
      { token: "m", desc: "Multiline — ^ and $ match line boundaries" },
      { token: "s", desc: "Dotall — . matches newline" },
      { token: "u", desc: "Unicode — full Unicode support" },
    ],
  },
];

function summarizeRegexInEnglish(pattern: string, flagStr: string): string {
  if (!pattern) return "";

  const parts: string[] = [];

  // Detect anchors
  const startsWithCaret = pattern.startsWith("^");
  const endsWithDollar = pattern.endsWith("$");
  if (startsWithCaret && endsWithDollar) {
    parts.push("Match the entire string that");
  } else if (startsWithCaret) {
    parts.push("Starting from the beginning of the string, match");
  } else if (endsWithDollar) {
    parts.push("Match text ending at the end of the string:");
  } else {
    parts.push("Find");
  }

  // Build description from known structures
  const core = pattern.replace(/^\^/, "").replace(/\$$/, "");

  // Detect common high-level patterns
  const knownPatterns: [RegExp, string][] = [
    [/^\[a-zA-Z0-9._%\+\\-\]\+@\[a-zA-Z0-9.\\-\]\+\\\.\[a-zA-Z\]\{2,\}$/, "an email address (user@domain.tld)"],
    [/^https\?/, "a URL starting with http:// or https://"],
    [/^\\\(?\\d\{3\}/, "a US phone number"],
    [/^(?:\(\?:[^)]+\)|\[0-9a-fA-F\]).*:/, "a colon-separated hex sequence (e.g., MAC address, IPv6)"],
    [/^\[0-9a-f\]\{8\}-/, "a UUID"],
    [/^\\d\{4\}-/, "a date in YYYY-MM-DD format"],
  ];

  let matched = false;
  for (const [re, desc] of knownPatterns) {
    if (re.test(core)) {
      parts.push(desc);
      matched = true;
      break;
    }
  }

  if (!matched) {
    // Build a generic description by scanning the pattern
    const descriptions: string[] = [];

    // Character classes
    if (core.includes("\\d")) descriptions.push("digits");
    if (core.includes("\\w")) descriptions.push("word characters");
    if (core.includes("\\s")) descriptions.push("whitespace");
    if (core.includes("[a-z]") || core.includes("[a-zA-Z]")) descriptions.push("letters");

    // Quantifiers
    const quantMatch = core.match(/\{(\d+)(?:,(\d*))?\}/);
    if (quantMatch) {
      const min = quantMatch[1];
      const max = quantMatch[2];
      if (max === undefined) {
        descriptions.push(`exactly ${min} times`);
      } else if (max === "") {
        descriptions.push(`${min} or more times`);
      } else {
        descriptions.push(`between ${min} and ${max} times`);
      }
    }

    // Groups
    const groupCount = (core.match(/\((?!\?)/g) || []).length;
    if (groupCount > 0) {
      descriptions.push(`with ${groupCount} capture group${groupCount > 1 ? "s" : ""}`);
    }

    // Lookahead/lookbehind
    if (core.includes("(?=")) descriptions.push("using positive lookahead");
    if (core.includes("(?!")) descriptions.push("using negative lookahead");
    if (core.includes("(?<=")) descriptions.push("using positive lookbehind");
    if (core.includes("(?<!")) descriptions.push("using negative lookbehind");

    // Alternation
    if (core.includes("|")) descriptions.push("with alternation (OR)");

    if (descriptions.length > 0) {
      parts.push(`a pattern involving ${descriptions.join(", ")}`);
    } else {
      // Fallback: describe literal characters
      const literalOnly = /^[a-zA-Z0-9 _-]+$/.test(core);
      if (literalOnly) {
        parts.push(`the literal text "${core}"`);
      } else {
        parts.push("a custom pattern");
      }
    }
  }

  // Describe flags
  const flagDescs: string[] = [];
  if (flagStr.includes("g")) flagDescs.push("all occurrences (global)");
  if (flagStr.includes("i")) flagDescs.push("case-insensitively");
  if (flagStr.includes("m")) flagDescs.push("across multiple lines");
  if (flagStr.includes("s")) flagDescs.push("with dot matching newlines");
  if (flagStr.includes("u")) flagDescs.push("with full Unicode support");

  if (flagDescs.length > 0) {
    parts.push("— " + flagDescs.join(", "));
  }

  return parts.join(" ") + ".";
}

function explainPattern(pattern: string): PatternExplanation[] {
  const explanations: PatternExplanation[] = [];
  let i = 0;

  while (i < pattern.length) {
    const ch = pattern[i];

    if (ch === "\\") {
      const next = pattern[i + 1];
      if (!next) {
        explanations.push({ token: "\\", description: "Trailing backslash (incomplete escape)" });
        i++;
        continue;
      }
      const escapes: Record<string, string> = {
        d: "Match any digit [0-9]",
        D: "Match any non-digit [^0-9]",
        w: "Match any word character [a-zA-Z0-9_]",
        W: "Match any non-word character",
        s: "Match any whitespace character",
        S: "Match any non-whitespace character",
        b: "Match a word boundary",
        B: "Match a non-word boundary",
        n: "Match a newline",
        t: "Match a tab",
        r: "Match a carriage return",
        "0": "Match a null character",
      };
      if (escapes[next]) {
        explanations.push({ token: `\\${next}`, description: escapes[next] });
      } else if (/\d/.test(next)) {
        explanations.push({ token: `\\${next}`, description: `Backreference to capture group ${next}` });
      } else {
        explanations.push({ token: `\\${next}`, description: `Match literal "${next}"` });
      }
      i += 2;
      continue;
    }

    if (ch === "[") {
      let end = i + 1;
      if (pattern[end] === "^") end++;
      if (pattern[end] === "]") end++;
      while (end < pattern.length && pattern[end] !== "]") end++;
      const charClass = pattern.slice(i, end + 1);
      const negated = charClass[1] === "^";
      explanations.push({
        token: charClass,
        description: `${negated ? "Match any character NOT in" : "Match any character in"} the set ${charClass}`,
      });
      i = end + 1;
      continue;
    }

    if (ch === "(") {
      if (pattern[i + 1] === "?" && pattern[i + 2] === ":") {
        explanations.push({ token: "(?:", description: "Start non-capturing group" });
        i += 3;
      } else if (pattern[i + 1] === "?" && pattern[i + 2] === "<" && pattern[i + 3] !== "=" && pattern[i + 3] !== "!") {
        let end = i + 3;
        while (end < pattern.length && pattern[end] !== ">") end++;
        const name = pattern.slice(i + 3, end);
        explanations.push({ token: pattern.slice(i, end + 1), description: `Start named capture group "${name}"` });
        i = end + 1;
      } else if (pattern[i + 1] === "?" && pattern[i + 2] === "=") {
        explanations.push({ token: "(?=", description: "Start positive lookahead" });
        i += 3;
      } else if (pattern[i + 1] === "?" && pattern[i + 2] === "!") {
        explanations.push({ token: "(?!", description: "Start negative lookahead" });
        i += 3;
      } else if (pattern[i + 1] === "?" && pattern[i + 2] === "<" && pattern[i + 3] === "=") {
        explanations.push({ token: "(?<=", description: "Start positive lookbehind" });
        i += 4;
      } else if (pattern[i + 1] === "?" && pattern[i + 2] === "<" && pattern[i + 3] === "!") {
        explanations.push({ token: "(?<!", description: "Start negative lookbehind" });
        i += 4;
      } else {
        explanations.push({ token: "(", description: "Start capture group" });
        i++;
      }
      continue;
    }

    if (ch === ")") {
      explanations.push({ token: ")", description: "End group" });
      i++;
      continue;
    }

    if (ch === "{") {
      let end = i + 1;
      while (end < pattern.length && pattern[end] !== "}") end++;
      const quantifier = pattern.slice(i, end + 1);
      const inner = quantifier.slice(1, -1);
      if (inner.includes(",")) {
        const [min, max] = inner.split(",");
        if (max === "") {
          explanations.push({ token: quantifier, description: `Match ${min} or more times` });
        } else {
          explanations.push({ token: quantifier, description: `Match between ${min} and ${max} times` });
        }
      } else {
        explanations.push({ token: quantifier, description: `Match exactly ${inner} times` });
      }
      i = end + 1;
      continue;
    }

    const simpleTokens: Record<string, string> = {
      ".": "Match any character (except newline)",
      "*": "Match 0 or more of the preceding token",
      "+": "Match 1 or more of the preceding token",
      "?": "Match 0 or 1 of the preceding token (optional)",
      "^": "Match the start of the string",
      "$": "Match the end of the string",
      "|": "OR — match either the expression before or after",
    };

    if (simpleTokens[ch]) {
      explanations.push({ token: ch, description: simpleTokens[ch] });
    } else {
      explanations.push({ token: ch, description: `Match literal "${ch}"` });
    }
    i++;
  }

  return explanations;
}

export default function RegexTesterPage() {
  const [pattern, setPattern] = useState("(\\w+)@(\\w+\\.\\w+)");
  const [testString, setTestString] = useState(
    "Contact us at hello@example.com or support@devtools.page for help."
  );
  const [flags, setFlags] = useState({ g: true, i: false, m: false, s: false, u: false });
  const [replacement, setReplacement] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [cheatSheetOpen, setCheatSheetOpen] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"match" | "replace">("match");

  const flagString = useMemo(
    () =>
      Object.entries(flags)
        .filter(([, v]) => v)
        .map(([k]) => k)
        .join(""),
    [flags]
  );

  const toggleFlag = useCallback((flag: keyof typeof flags) => {
    setFlags((prev) => ({ ...prev, [flag]: !prev[flag] }));
  }, []);

  const matches: MatchResult[] = useMemo(() => {
    if (!pattern) {
      setError(null);
      return [];
    }
    try {
      const re = new RegExp(pattern, flagString);
      setError(null);
      const results: MatchResult[] = [];
      if (flagString.includes("g")) {
        let match: RegExpExecArray | null;
        const seen = new Set<number>();
        while ((match = re.exec(testString)) !== null) {
          if (seen.has(match.index)) break;
          seen.add(match.index);
          results.push({
            fullMatch: match[0],
            index: match.index,
            groups: match.slice(1),
            namedGroups: match.groups ? { ...match.groups } : {},
          });
          if (match[0].length === 0) re.lastIndex++;
        }
      } else {
        const match = re.exec(testString);
        if (match) {
          results.push({
            fullMatch: match[0],
            index: match.index,
            groups: match.slice(1),
            namedGroups: match.groups ? { ...match.groups } : {},
          });
        }
      }
      return results;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Invalid regular expression");
      return [];
    }
  }, [pattern, testString, flagString]);

  const replacedText = useMemo(() => {
    if (!pattern || !testString || !replacement) return "";
    try {
      const regex = new RegExp(pattern, flagString);
      return testString.replace(regex, replacement);
    } catch {
      return "";
    }
  }, [pattern, flagString, testString, replacement]);

  const highlightedText = useMemo(() => {
    if (!pattern || matches.length === 0 || error) return null;

    const segments: { text: string; highlight: boolean; matchIndex: number }[] = [];
    let lastEnd = 0;
    const sorted = [...matches].sort((a, b) => a.index - b.index);

    for (let mi = 0; mi < sorted.length; mi++) {
      const m = sorted[mi];
      if (m.index > lastEnd) {
        segments.push({ text: testString.slice(lastEnd, m.index), highlight: false, matchIndex: -1 });
      }
      segments.push({ text: m.fullMatch, highlight: true, matchIndex: mi });
      lastEnd = m.index + m.fullMatch.length;
    }

    if (lastEnd < testString.length) {
      segments.push({ text: testString.slice(lastEnd), highlight: false, matchIndex: -1 });
    }

    return segments;
  }, [pattern, matches, testString, error]);

  const explanation = useMemo(() => {
    if (!pattern) return [];
    return explainPattern(pattern);
  }, [pattern]);

  const englishSummary = useMemo(() => {
    if (!pattern) return "";
    return summarizeRegexInEnglish(pattern, flagString);
  }, [pattern, flagString]);

  const insertAtCursor = useCallback((value: string) => {
    setPattern((prev) => prev + value);
  }, []);

  const loadPreset = useCallback((preset: (typeof COMMON_PATTERNS)[number]) => {
    setPattern(preset.pattern);
    const newFlags = { g: false, i: false, m: false, s: false, u: false };
    for (const f of preset.flags) {
      if (f in newFlags) newFlags[f as keyof typeof newFlags] = true;
    }
    setFlags(newFlags);
  }, []);

  const copyRegex = useCallback(async () => {
    const text = `/${pattern}/${flagString}`;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [pattern, flagString]);

  const clearAll = useCallback(() => {
    setPattern("");
    setFlags({ g: true, i: false, m: false, s: false, u: false });
    setTestString("");
    setReplacement("");
    setError(null);
  }, []);

  // Load state from URL parameters on mount
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [shareCopied, setShareCopied] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const p = params.get("pattern");
    const t = params.get("text");
    const f = params.get("flags");
    if (p !== null) setPattern(p);
    if (t !== null) setTestString(t);
    if (f !== null) {
      const newFlags = { g: false, i: false, m: false, s: false, u: false };
      for (const ch of f) {
        if (ch in newFlags) newFlags[ch as keyof typeof newFlags] = true;
      }
      setFlags(newFlags);
    }
  }, []);

  const shareRegex = useCallback(() => {
    const params = new URLSearchParams();
    if (pattern) params.set("pattern", pattern);
    if (testString) params.set("text", testString);
    if (flagString) params.set("flags", flagString);
    const url = `${window.location.origin}${window.location.pathname}?${params.toString()}`;
    setShareUrl(url);
    navigator.clipboard.writeText(url);
    setShareCopied(true);
    setTimeout(() => setShareCopied(false), 2000);
    // Update URL without reload
    window.history.replaceState(null, "", url);
  }, [pattern, testString, flagString]);

  return (
    <>
      <title>
        Regex Tester &amp; Debugger — Free Online Tool | DevTools Hub
      </title>
      <meta
        name="description"
        content="Free online regex tester and validator. Test regular expressions with real-time match highlighting, capture groups, pattern explanation, and cheat sheet. JavaScript regex engine — 100% client-side."
      />
      <meta
        name="keywords"
        content="regex tester, regex tester online, regular expression tester, regex validator, regex matcher, regex pattern tester, test regex, regex debugger, javascript regex, regex online"
      />
      <JsonLd
        data={[
          generateWebAppSchema({
            slug: "regex-tester",
            name: "Regex Tester",
            description:
              "Test regular expressions online with real-time match highlighting, capture groups, pattern explanation, and cheat sheet.",
            category: "developer",
          }),
          generateBreadcrumbSchema({
            slug: "regex-tester",
            name: "Regex Tester",
            description:
              "Test regular expressions online with real-time match highlighting, capture groups, pattern explanation, and cheat sheet.",
            category: "developer",
          }),
          generateFAQSchema([
            {
              question: "What is a regular expression (regex)?",
              answer:
                "A regular expression (regex) is a sequence of characters that defines a search pattern. Regex is used in programming for tasks like string matching, validation, search-and-replace, and data extraction. Most programming languages support regex natively.",
            },
            {
              question: "What regex engine does this tester use?",
              answer:
                "This tool uses the JavaScript (ECMAScript) RegExp engine built into your browser. It supports all standard regex features including lookahead, lookbehind, named capture groups, and Unicode mode. All processing runs client-side — no data is sent to any server.",
            },
            {
              question: "What do the regex flags (g, i, m, s, u) mean?",
              answer:
                "g (global) finds all matches instead of stopping after the first. i (case-insensitive) ignores letter case. m (multiline) makes ^ and $ match line boundaries. s (dotall) makes . match newline characters. u (unicode) enables full Unicode matching including surrogate pairs.",
            },
            {
              question: "How do capture groups work in regex?",
              answer:
                "Capture groups are created with parentheses (). They extract specific parts of a match. For example, (\\d{4})-(\\d{2})-(\\d{2}) matching '2024-03-15' captures three groups: '2024', '03', and '15'. Named groups use (?<name>...) syntax for clearer code.",
            },
            {
              question: "Is my data safe when using this regex tester?",
              answer:
                "Yes. All regex matching is performed entirely in your browser using JavaScript's built-in RegExp engine. No data is transmitted to any server. Your patterns and test strings never leave your device.",
            },
            {
              question: "Can I test multiline strings?",
              answer:
                "Yes. The test string input supports multiline text. Enable the 'm' (multiline) flag to make ^ and $ match the start and end of each line rather than the entire string. Enable the 's' (dotall) flag to make . match newline characters.",
            },
          ]),
        ]}
      />

      <div className="min-h-screen bg-slate-900 text-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <ToolBreadcrumb slug="regex-tester" />

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
              Regex Tester &amp; Debugger
            </h1>
            <p className="text-slate-400 max-w-2xl text-lg">
              Test regular expressions with real-time match highlighting,
              capture groups, pattern explanation, and a complete cheat sheet.
              Uses the JavaScript regex engine — 100% client-side.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Panel */}
            <div className="lg:col-span-2 space-y-6">
              {/* Regex Input */}
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-medium text-slate-300">
                    Regular Expression
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={shareRegex}
                      disabled={!pattern}
                      className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-medium transition-colors disabled:opacity-40"
                    >
                      {shareCopied ? "Link Copied!" : "Share URL"}
                    </button>
                    <button
                      onClick={copyRegex}
                      disabled={!pattern}
                      className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-white rounded text-xs font-medium transition-colors disabled:opacity-40"
                    >
                      {copied ? "Copied!" : "Copy Regex"}
                    </button>
                    <button
                      onClick={clearAll}
                      className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-white rounded text-xs font-medium transition-colors"
                    >
                      Clear All
                    </button>
                  </div>
                </div>
                <div className={`flex items-center gap-2 bg-slate-900 border rounded-lg px-3 py-2 focus-within:ring-2 focus-within:ring-blue-500 ${error ? "border-red-600" : "border-slate-600"}`}>
                  <span className="text-slate-500 font-mono text-lg">/</span>
                  <input
                    type="text"
                    value={pattern}
                    onChange={(e) => setPattern(e.target.value)}
                    className="flex-1 bg-transparent font-mono text-sm text-slate-200 placeholder-slate-500 focus:outline-none"
                    placeholder="Enter regex pattern..."
                    spellCheck={false}
                    autoComplete="off"
                  />
                  <span className="text-slate-500 font-mono text-lg">/</span>
                  <span className="text-blue-400 font-mono text-sm min-w-[24px]">
                    {flagString}
                  </span>
                </div>

                {/* Flags */}
                <div className="flex flex-wrap items-center gap-3 mt-3">
                  <span className="text-xs text-slate-500">Flags:</span>
                  {(Object.keys(flags) as (keyof typeof flags)[]).map((flag) => (
                    <label
                      key={flag}
                      className="flex items-center gap-1.5 text-sm text-slate-300 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={flags[flag]}
                        onChange={() => toggleFlag(flag)}
                        className="w-3.5 h-3.5 rounded bg-slate-700 border-slate-600 text-blue-500 focus:ring-blue-500"
                      />
                      <code className="text-xs">{flag}</code>
                      <span className="text-xs text-slate-500">
                        {flag === "g" && "(global)"}
                        {flag === "i" && "(ignore case)"}
                        {flag === "m" && "(multiline)"}
                        {flag === "s" && "(dotall)"}
                        {flag === "u" && "(unicode)"}
                      </span>
                    </label>
                  ))}
                  {!error && pattern && (
                    <span className="ml-auto text-xs text-green-400 bg-green-900/40 px-2 py-0.5 rounded">
                      {matches.length} match{matches.length !== 1 ? "es" : ""}
                    </span>
                  )}
                </div>

                {error && (
                  <div className="mt-3 p-3 rounded-lg border bg-red-900/30 border-red-700 text-red-300 text-sm font-mono">
                    {error}
                  </div>
                )}
              </div>

              {/* Quick Insert */}
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
                <div className="text-xs text-slate-500 mb-2 font-medium">
                  Quick Insert
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {QUICK_INSERT.map((qi) => (
                    <button
                      key={qi.label}
                      onClick={() => insertAtCursor(qi.value)}
                      title={qi.tip}
                      className="px-2.5 py-1 bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white rounded text-xs font-mono transition-colors"
                    >
                      {qi.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tabs */}
              <div className="flex gap-1">
                <button
                  onClick={() => setActiveTab("match")}
                  className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                    activeTab === "match"
                      ? "bg-slate-800 text-white border border-slate-700 border-b-slate-800"
                      : "bg-slate-900 text-slate-400 hover:text-white"
                  }`}
                >
                  Match
                </button>
                <button
                  onClick={() => setActiveTab("replace")}
                  className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                    activeTab === "replace"
                      ? "bg-slate-800 text-white border border-slate-700 border-b-slate-800"
                      : "bg-slate-900 text-slate-400 hover:text-white"
                  }`}
                >
                  Replace
                </button>
              </div>

              {/* Test String */}
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 -mt-2 rounded-tl-none">
                <label className="block text-sm font-medium text-slate-300 mb-3">
                  Test String
                </label>
                <textarea
                  value={testString}
                  onChange={(e) => setTestString(e.target.value)}
                  rows={6}
                  className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-3 font-mono text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
                  placeholder="Enter text to test against your regex..."
                  spellCheck={false}
                />

                {/* Replace tab content */}
                {activeTab === "replace" && (
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Replacement String
                    </label>
                    <input
                      type="text"
                      value={replacement}
                      onChange={(e) => setReplacement(e.target.value)}
                      placeholder="Enter replacement (supports $1, $2, $&, etc.)..."
                      className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2 font-mono text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      spellCheck={false}
                    />
                    {replacedText && (
                      <div className="mt-3">
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                          Result
                        </label>
                        <div className="bg-slate-900 border border-slate-600 rounded-lg px-4 py-3 font-mono text-sm text-green-300 whitespace-pre-wrap break-all">
                          {replacedText}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Highlighted Matches */}
              {highlightedText && highlightedText.length > 0 && (
                <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
                  <h2 className="text-sm font-medium text-slate-300 mb-3">
                    Match Highlighting
                  </h2>
                  <div className="bg-slate-900 rounded-lg px-4 py-3 font-mono text-sm whitespace-pre-wrap break-all leading-relaxed">
                    {highlightedText.map((seg, i) =>
                      seg.highlight ? (
                        <mark
                          key={i}
                          className="bg-yellow-500/30 text-yellow-200 border-b-2 border-yellow-500 px-0.5 rounded-sm"
                          title={`Match ${seg.matchIndex + 1}`}
                        >
                          {seg.text}
                        </mark>
                      ) : (
                        <span key={i}>{seg.text}</span>
                      )
                    )}
                  </div>
                </div>
              )}

              {/* Match Results */}
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-white">
                    Match Results
                  </h2>
                  <span className="text-sm text-slate-400">
                    {matches.length} match{matches.length !== 1 && "es"}
                  </span>
                </div>

                {matches.length === 0 && !error ? (
                  <p className="text-slate-500 text-sm">
                    {pattern
                      ? "No matches found."
                      : "Enter a regex pattern to start matching."}
                  </p>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {matches.map((m, i) => (
                      <div
                        key={i}
                        className="bg-slate-900 rounded-lg p-4 border border-slate-700/50"
                      >
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-xs font-medium text-slate-500 bg-slate-800 px-2 py-0.5 rounded">
                            Match {i + 1}
                          </span>
                          <span className="text-xs text-slate-500">
                            Index: {m.index}
                          </span>
                        </div>
                        <code className="text-sm font-mono text-green-400 break-all">
                          {m.fullMatch}
                        </code>

                        {m.groups.length > 0 && (
                          <div className="mt-3 border-t border-slate-700 pt-3">
                            <div className="text-xs text-slate-500 mb-2 font-medium">
                              Capture Groups
                            </div>
                            <div className="space-y-1">
                              {m.groups.map((g, gi) => {
                                const namedKey = Object.entries(
                                  m.namedGroups
                                ).find(([, v]) => v === g)?.[0];
                                return (
                                  <div
                                    key={gi}
                                    className="flex items-center gap-2 text-sm"
                                  >
                                    <span className="text-xs text-slate-500 bg-slate-800 px-1.5 py-0.5 rounded font-mono shrink-0">
                                      {namedKey
                                        ? namedKey
                                        : `Group ${gi + 1}`}
                                    </span>
                                    <code className="text-blue-400 font-mono break-all">
                                      {g ?? "(undefined)"}
                                    </code>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Regex to English */}
              {pattern && englishSummary && (
                <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
                  <h2 className="text-lg font-semibold text-white mb-3">
                    Regex to English
                  </h2>
                  <div className="bg-slate-900 rounded-lg px-4 py-3 text-sm text-blue-300 leading-relaxed">
                    <span className="text-slate-500 text-xs uppercase tracking-wide block mb-1">Plain English</span>
                    {englishSummary}
                  </div>
                </div>
              )}

              {/* Pattern Explanation */}
              {pattern && explanation.length > 0 && (
                <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
                  <h2 className="text-lg font-semibold text-white mb-4">
                    Token-by-Token Breakdown
                  </h2>
                  <div className="space-y-1">
                    {explanation.map((e, i) => (
                      <div key={i} className="flex items-start gap-3 py-1.5">
                        <code className="text-sm font-mono text-yellow-400 bg-slate-900 px-2 py-0.5 rounded shrink-0 min-w-[60px] text-center">
                          {e.token}
                        </code>
                        <span className="text-sm text-slate-400">
                          {e.description}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Common Patterns Library */}
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-5">
                <h2 className="text-sm font-semibold text-white mb-1">
                  Regex Library
                </h2>
                <p className="text-xs text-slate-500 mb-3">
                  {COMMON_PATTERNS.length} ready-to-use patterns
                </p>
                <div className="space-y-1.5 max-h-[600px] overflow-y-auto pr-1">
                  {COMMON_PATTERNS.map((cp) => (
                    <button
                      key={cp.label}
                      onClick={() => loadPreset(cp)}
                      className="w-full text-left px-3 py-2 bg-slate-700/50 hover:bg-slate-700 rounded-lg transition-colors group"
                    >
                      <div className="text-sm font-medium text-blue-400 group-hover:text-blue-300">
                        {cp.label}
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        {cp.description}
                      </div>
                      <div className="text-xs text-slate-500 font-mono truncate mt-0.5">
                        /{cp.pattern}/{cp.flags}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Ad Slot — Sidebar */}
              <AdUnit slot="SIDEBAR_SLOT" format="rectangle" className="my-4" />

              {/* Cheat Sheet Accordion */}
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-5">
                <h2 className="text-sm font-semibold text-white mb-3">
                  Cheat Sheet
                </h2>
                <div className="space-y-1">
                  {CHEAT_SHEET.map((section) => (
                    <div key={section.category}>
                      <button
                        onClick={() =>
                          setCheatSheetOpen(
                            cheatSheetOpen === section.category
                              ? null
                              : section.category
                          )
                        }
                        className="w-full flex items-center justify-between px-3 py-2 bg-slate-700/50 hover:bg-slate-700 rounded-lg text-sm text-slate-300 transition-colors"
                      >
                        <span>{section.category}</span>
                        <svg
                          className={`w-4 h-4 text-slate-500 transition-transform ${
                            cheatSheetOpen === section.category
                              ? "rotate-180"
                              : ""
                          }`}
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      </button>
                      {cheatSheetOpen === section.category && (
                        <div className="px-3 py-2 space-y-1">
                          {section.items.map((item) => (
                            <div
                              key={item.token}
                              className="flex items-center gap-2 text-xs"
                            >
                              <code className="text-yellow-400 font-mono bg-slate-900 px-1.5 py-0.5 rounded min-w-[50px] text-center shrink-0">
                                {item.token}
                              </code>
                              <span className="text-slate-400">
                                {item.desc}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Ad Slot — Bottom Banner */}
          <AdUnit slot="BOTTOM_SLOT" format="horizontal" className="mt-10" />

          <RelatedTools currentSlug="regex-tester" />

          {/* FAQ Section */}
          <section className="mt-16 border-t border-slate-700 pt-10">
            <h2 className="text-2xl font-bold text-white mb-6">
              Frequently Asked Questions
            </h2>

            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  What is a regular expression (regex)?
                </h3>
                <p className="text-slate-400">
                  A regular expression (regex) is a sequence of characters that
                  defines a search pattern. Regex is used in programming for
                  tasks like string matching, validation, search-and-replace,
                  and data extraction. Most programming languages support regex
                  natively.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  What regex engine does this tester use?
                </h3>
                <p className="text-slate-400">
                  This tool uses the JavaScript (ECMAScript) RegExp engine built
                  into your browser. It supports all standard regex features
                  including lookahead, lookbehind, named capture groups, and
                  Unicode mode. All processing runs client-side — no data is
                  sent to any server.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  What do the regex flags (g, i, m, s, u) mean?
                </h3>
                <p className="text-slate-400">
                  <strong>g</strong> (global) finds all matches instead of
                  stopping after the first. <strong>i</strong>{" "}
                  (case-insensitive) ignores letter case. <strong>m</strong>{" "}
                  (multiline) makes ^ and $ match line boundaries.{" "}
                  <strong>s</strong> (dotall) makes . match newline characters.{" "}
                  <strong>u</strong> (unicode) enables full Unicode matching
                  including surrogate pairs.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  How do capture groups work in regex?
                </h3>
                <p className="text-slate-400">
                  Capture groups are created with parentheses (). They extract
                  specific parts of a match. For example,{" "}
                  <code className="text-slate-300">
                    (\d&#123;4&#125;)-(\d&#123;2&#125;)-(\d&#123;2&#125;)
                  </code>{" "}
                  matching &quot;2024-03-15&quot; captures three groups:
                  &quot;2024&quot;, &quot;03&quot;, and &quot;15&quot;. Named
                  groups use{" "}
                  <code className="text-slate-300">
                    (?&lt;name&gt;...)
                  </code>{" "}
                  syntax for clearer code.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Is my data safe when using this regex tester?
                </h3>
                <p className="text-slate-400">
                  Yes. All regex matching is performed entirely in your browser
                  using JavaScript&apos;s built-in RegExp engine. No data is
                  transmitted to any server. Your patterns and test strings
                  never leave your device.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Can I test multiline strings?
                </h3>
                <p className="text-slate-400">
                  Yes. The test string input supports multiline text. Enable the
                  &quot;m&quot; (multiline) flag to make ^ and $ match the start
                  and end of each line rather than the entire string. Enable the
                  &quot;s&quot; (dotall) flag to make . match newline characters.
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
