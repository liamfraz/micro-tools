"use client";

import { useState, useCallback, useMemo, useRef } from "react";
import JsonLd from "@/components/JsonLd";
import RelatedTools from "@/components/RelatedTools";
import {
  generateFAQSchema,
  generateWebAppSchema,
  generateBreadcrumbSchema,
} from "@/lib/jsonld";

type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

function getType(
  value: JsonValue
): "string" | "number" | "boolean" | "null" | "array" | "object" {
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";
  return typeof value as "string" | "number" | "boolean" | "object";
}

const typeColors: Record<string, string> = {
  string: "text-green-400",
  number: "text-blue-400",
  boolean: "text-yellow-400",
  null: "text-red-400",
  array: "text-purple-400",
  object: "text-cyan-400",
};

const typeBadgeColors: Record<string, string> = {
  string: "bg-green-900/40 text-green-400",
  number: "bg-blue-900/40 text-blue-400",
  boolean: "bg-yellow-900/40 text-yellow-400",
  null: "bg-red-900/40 text-red-400",
  array: "bg-purple-900/40 text-purple-400",
  object: "bg-cyan-900/40 text-cyan-400",
};

function formatValue(value: JsonValue, type: string): string {
  if (type === "string") return `"${value}"`;
  if (type === "null") return "null";
  return String(value);
}

function countChildren(value: JsonValue): number {
  if (Array.isArray(value)) return value.length;
  if (value && typeof value === "object") return Object.keys(value).length;
  return 0;
}

interface TreeNodeProps {
  keyName: string | number | null;
  value: JsonValue;
  path: string;
  depth: number;
  expandedPaths: Set<string>;
  toggleExpand: (path: string) => void;
  onCopyPath: (path: string) => void;
  searchTerm: string;
  matchingPaths: Set<string>;
}

function matchesSearch(
  key: string | number | null,
  value: JsonValue,
  searchTerm: string
): boolean {
  if (!searchTerm) return false;
  const lower = searchTerm.toLowerCase();
  if (key !== null && String(key).toLowerCase().includes(lower)) return true;
  const type = getType(value);
  if (type !== "object" && type !== "array") {
    return formatValue(value, type).toLowerCase().includes(lower);
  }
  return false;
}

function TreeNode({
  keyName,
  value,
  path,
  depth,
  expandedPaths,
  toggleExpand,
  onCopyPath,
  searchTerm,
  matchingPaths,
}: TreeNodeProps) {
  const type = getType(value);
  const isExpandable = type === "object" || type === "array";
  const isExpanded = expandedPaths.has(path);
  const childCount = countChildren(value);
  const isMatch = matchesSearch(keyName, value, searchTerm);
  const isInMatchPath = matchingPaths.has(path);

  if (searchTerm && !isMatch && !isInMatchPath && !isExpandable) return null;
  if (searchTerm && isExpandable && !isInMatchPath && !isMatch) return null;

  const entries = isExpandable
    ? Array.isArray(value)
      ? value.map((v, i) => ({ key: i, value: v }))
      : Object.entries(value as Record<string, JsonValue>).map(([k, v]) => ({
          key: k,
          value: v,
        }))
    : [];

  return (
    <div className={depth > 0 ? "ml-4 border-l border-slate-700/50 pl-2" : ""}>
      <div
        className={`group flex items-center gap-1.5 py-0.5 rounded px-1 -ml-1 hover:bg-slate-700/30 cursor-pointer ${
          isMatch ? "bg-yellow-900/20 ring-1 ring-yellow-600/30" : ""
        }`}
        onClick={() => {
          if (isExpandable) toggleExpand(path);
        }}
      >
        {/* Expand/collapse toggle */}
        {isExpandable ? (
          <button
            className="w-4 h-4 flex items-center justify-center text-slate-500 hover:text-white flex-shrink-0"
            aria-label={isExpanded ? "Collapse" : "Expand"}
          >
            <svg
              className={`w-3 h-3 transition-transform ${
                isExpanded ? "rotate-90" : ""
              }`}
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        ) : (
          <span className="w-4 flex-shrink-0" />
        )}

        {/* Key name */}
        {keyName !== null && (
          <>
            <span className="text-slate-300 font-medium text-sm">
              {typeof keyName === "number" ? `[${keyName}]` : keyName}
            </span>
            <span className="text-slate-600 text-sm">:</span>
          </>
        )}

        {/* Value or summary */}
        {isExpandable ? (
          <span className="text-slate-500 text-sm">
            {type === "array" ? "[" : "{"}
            {!isExpanded && (
              <span className="text-slate-600">
                {childCount} {childCount === 1 ? "item" : "items"}
              </span>
            )}
            {!isExpanded && (type === "array" ? "]" : "}")}
          </span>
        ) : (
          <span className={`text-sm ${typeColors[type]}`}>
            {formatValue(value, type)}
          </span>
        )}

        {/* Type badge */}
        <span
          className={`ml-1.5 px-1.5 py-0 rounded text-[10px] font-medium opacity-0 group-hover:opacity-100 transition-opacity ${typeBadgeColors[type]}`}
        >
          {type}
        </span>

        {/* Copy path button */}
        <button
          className="ml-auto px-1.5 py-0.5 text-[10px] text-slate-600 hover:text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => {
            e.stopPropagation();
            onCopyPath(path);
          }}
          title={`Copy path: ${path}`}
        >
          copy path
        </button>
      </div>

      {/* Children */}
      {isExpandable && isExpanded && (
        <div>
          {entries.map((entry) => {
            const childPath =
              typeof entry.key === "number"
                ? `${path}[${entry.key}]`
                : `${path}.${entry.key}`;
            return (
              <TreeNode
                key={String(entry.key)}
                keyName={entry.key}
                value={entry.value}
                path={childPath}
                depth={depth + 1}
                expandedPaths={expandedPaths}
                toggleExpand={toggleExpand}
                onCopyPath={onCopyPath}
                searchTerm={searchTerm}
                matchingPaths={matchingPaths}
              />
            );
          })}
          <div className={`ml-4 pl-2 text-slate-500 text-sm`}>
            {type === "array" ? "]" : "}"}
          </div>
        </div>
      )}
    </div>
  );
}

// Build set of all ancestor paths for matching nodes
function buildMatchingPaths(
  value: JsonValue,
  path: string,
  searchTerm: string,
  result: Set<string>
): boolean {
  if (!searchTerm) return false;

  const type = getType(value);
  let hasMatch = false;

  // Check if this node itself matches
  const keyPart = path.includes(".")
    ? path.split(".").pop() ?? ""
    : path.includes("[")
      ? path.split("[").pop()?.replace("]", "") ?? ""
      : path;

  if (matchesSearch(keyPart, value, searchTerm)) {
    hasMatch = true;
  }

  // Recurse into children
  if (type === "object" && value && typeof value === "object" && !Array.isArray(value)) {
    for (const [k, v] of Object.entries(value)) {
      if (buildMatchingPaths(v, `${path}.${k}`, searchTerm, result)) {
        hasMatch = true;
      }
    }
  } else if (type === "array" && Array.isArray(value)) {
    value.forEach((v, i) => {
      if (buildMatchingPaths(v, `${path}[${i}]`, searchTerm, result)) {
        hasMatch = true;
      }
    });
  }

  if (hasMatch) result.add(path);
  return hasMatch;
}

// Collect all paths in the tree
function collectAllPaths(
  value: JsonValue,
  path: string,
  result: Set<string>
) {
  const type = getType(value);
  if (type === "object" || type === "array") {
    result.add(path);
    if (Array.isArray(value)) {
      value.forEach((v, i) => collectAllPaths(v, `${path}[${i}]`, result));
    } else if (value && typeof value === "object") {
      for (const [k, v] of Object.entries(value)) {
        collectAllPaths(v, `${path}.${k}`, result);
      }
    }
  }
}

const SAMPLE_JSON = `{
  "name": "DevTools Hub",
  "version": "1.0.0",
  "tools": [
    {
      "slug": "json-tree-viewer",
      "category": "developer",
      "features": ["collapse", "search", "copy-path"]
    },
    {
      "slug": "json-formatter",
      "category": "developer",
      "features": ["format", "minify", "validate"]
    }
  ],
  "stats": {
    "totalTools": 49,
    "isOpenSource": true,
    "rating": null
  }
}`;

export default function JsonTreeViewerPage() {
  const [input, setInput] = useState("");
  const [parsed, setParsed] = useState<JsonValue | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(
    new Set(["$"])
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [copiedPath, setCopiedPath] = useState<string | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const parseInput = useCallback((text: string) => {
    setInput(text);
    if (!text.trim()) {
      setParsed(undefined);
      setError(null);
      return;
    }
    try {
      const result = JSON.parse(text);
      setParsed(result);
      setError(null);
      setExpandedPaths(new Set(["$"]));
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Invalid JSON";
      setError(msg);
      setParsed(undefined);
    }
  }, []);

  const toggleExpand = useCallback((path: string) => {
    setExpandedPaths((prev) => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  }, []);

  const expandAll = useCallback(() => {
    if (parsed === undefined) return;
    const all = new Set<string>();
    collectAllPaths(parsed, "$", all);
    setExpandedPaths(all);
  }, [parsed]);

  const collapseAll = useCallback(() => {
    setExpandedPaths(new Set(["$"]));
  }, []);

  const onCopyPath = useCallback((path: string) => {
    navigator.clipboard.writeText(path);
    setCopiedPath(path);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setCopiedPath(null), 2000);
  }, []);

  const loadSample = useCallback(() => {
    parseInput(SAMPLE_JSON);
  }, [parseInput]);

  const clearAll = useCallback(() => {
    setInput("");
    setParsed(undefined);
    setError(null);
    setSearchTerm("");
    setExpandedPaths(new Set(["$"]));
  }, []);

  const matchingPaths = useMemo(() => {
    if (!searchTerm || parsed === undefined) return new Set<string>();
    const result = new Set<string>();
    buildMatchingPaths(parsed, "$", searchTerm, result);
    return result;
  }, [parsed, searchTerm]);

  // Auto-expand matching paths when searching
  const effectiveExpanded = useMemo(() => {
    if (!searchTerm || matchingPaths.size === 0) return expandedPaths;
    return new Set([...Array.from(expandedPaths), ...Array.from(matchingPaths)]);
  }, [expandedPaths, searchTerm, matchingPaths]);

  return (
    <>
      <title>JSON Tree Viewer - Free Online Tool | DevTools Hub</title>
      <meta
        name="description"
        content="Visualize JSON as a collapsible tree with color-coded data types, search filtering, and copy-path-to-node. Free, client-side, no data sent to servers."
      />
      <JsonLd
        data={[
          generateWebAppSchema({
            slug: "json-tree-viewer",
            name: "JSON Tree Viewer",
            description:
              "Parse and display JSON as a collapsible tree view with data type color coding, search, and path copying",
            category: "developer",
          }),
          generateBreadcrumbSchema({
            slug: "json-tree-viewer",
            name: "JSON Tree Viewer",
            description:
              "Parse and display JSON as a collapsible tree view with data type color coding, search, and path copying",
            category: "developer",
          }),
          generateFAQSchema([
            {
              question: "What is a JSON Tree Viewer?",
              answer:
                "A JSON Tree Viewer parses raw JSON text and displays it as an interactive, collapsible tree structure. Each node can be expanded or collapsed, making it easy to navigate deeply nested data without scrolling through raw text.",
            },
            {
              question: "What do the colors mean?",
              answer:
                'Each data type has a distinct color: strings are green, numbers are blue, booleans are yellow, null values are red, arrays are purple, and objects are cyan. This makes it easy to identify data types at a glance.',
            },
            {
              question: "How do I copy the path to a specific value?",
              answer:
                'Hover over any node in the tree and click the "copy path" button that appears on the right. The path is copied in dot-notation (e.g. $.users[0].name) which you can use in code or JSONPath queries.',
            },
            {
              question: "Is my data safe?",
              answer:
                "Yes. All parsing and rendering happens entirely in your browser using JavaScript. No data is sent to any server.",
            },
          ]),
        ]}
      />

      <div className="min-h-screen bg-slate-900 text-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Breadcrumb */}
          <nav
            className="text-sm text-slate-400 mb-6"
            aria-label="Breadcrumb"
          >
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
                <a
                  href="/tools"
                  className="hover:text-white transition-colors"
                >
                  Developer Tools
                </a>
              </li>
              <li>
                <span className="mx-1">/</span>
              </li>
              <li className="text-slate-200">JSON Tree Viewer</li>
            </ol>
          </nav>

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
              JSON Tree Viewer
            </h1>
            <p className="text-slate-400 max-w-2xl text-lg">
              Paste JSON below to visualize it as a collapsible tree. Color-coded
              data types, search filtering, and click-to-copy paths make it easy
              to explore complex data.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
            {/* Input panel */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-slate-300">
                  JSON Input
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={loadSample}
                    className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    Load sample
                  </button>
                  <button
                    onClick={clearAll}
                    className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    Clear
                  </button>
                </div>
              </div>
              <textarea
                value={input}
                onChange={(e) => parseInput(e.target.value)}
                placeholder='Paste your JSON here...\n\n{"example": "value"}'
                className={`w-full h-[500px] bg-slate-800 border rounded-lg p-4 font-mono text-sm text-slate-200 placeholder-slate-500 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  error ? "border-red-600" : "border-slate-600"
                }`}
                spellCheck={false}
              />
              {error && (
                <div className="mt-2 p-3 bg-red-900/40 border border-red-700 rounded-lg text-red-300 text-sm font-mono">
                  <span className="font-bold">Error:</span> {error}
                </div>
              )}
            </div>

            {/* Tree panel */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-slate-300">
                  Tree View
                </label>
                {parsed !== undefined && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={expandAll}
                      className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
                    >
                      Expand all
                    </button>
                    <span className="text-slate-700">|</span>
                    <button
                      onClick={collapseAll}
                      className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
                    >
                      Collapse all
                    </button>
                  </div>
                )}
              </div>

              {/* Search */}
              {parsed !== undefined && (
                <div className="mb-2 relative">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search keys and values..."
                    className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm("")}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white text-sm"
                    >
                      &times;
                    </button>
                  )}
                  {searchTerm && (
                    <div className="mt-1 text-xs text-slate-500">
                      {matchingPaths.size === 0
                        ? "No matches"
                        : `${matchingPaths.size} matching ${matchingPaths.size === 1 ? "path" : "paths"}`}
                    </div>
                  )}
                </div>
              )}

              <div className="w-full h-[500px] bg-slate-800 border border-slate-600 rounded-lg p-4 font-mono text-sm overflow-auto">
                {parsed === undefined ? (
                  <div className="h-full flex items-center justify-center text-slate-500">
                    {input.trim()
                      ? "Fix JSON errors to see tree"
                      : "Paste JSON to visualize as tree"}
                  </div>
                ) : (
                  <TreeNode
                    keyName={null}
                    value={parsed}
                    path="$"
                    depth={0}
                    expandedPaths={effectiveExpanded}
                    toggleExpand={toggleExpand}
                    onCopyPath={onCopyPath}
                    searchTerm={searchTerm}
                    matchingPaths={matchingPaths}
                  />
                )}
              </div>

              {/* Copied toast */}
              {copiedPath && (
                <div className="mt-2 text-xs text-green-400">
                  Copied: <code className="text-green-300">{copiedPath}</code>
                </div>
              )}

              {/* Type legend */}
              {parsed !== undefined && (
                <div className="mt-3 flex flex-wrap gap-3 text-xs">
                  {Object.entries(typeColors).map(([type, color]) => (
                    <span key={type} className="flex items-center gap-1">
                      <span
                        className={`inline-block w-2 h-2 rounded-full ${color.replace("text-", "bg-")}`}
                      />
                      <span className="text-slate-500">{type}</span>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          <RelatedTools currentSlug="json-tree-viewer" />

          {/* FAQ Section */}
          <section className="mt-16 border-t border-slate-700 pt-10">
            <h2 className="text-2xl font-bold text-white mb-6">
              Frequently Asked Questions
            </h2>

            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  What is a JSON Tree Viewer?
                </h3>
                <p className="text-slate-400">
                  A JSON Tree Viewer parses raw JSON text and displays it as an
                  interactive, collapsible tree structure. Each node can be
                  expanded or collapsed, making it easy to navigate deeply nested
                  data without scrolling through raw text.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  What do the colors mean?
                </h3>
                <p className="text-slate-400">
                  Each data type has a distinct color: strings are green, numbers
                  are blue, booleans are yellow, null values are red, arrays are
                  purple, and objects are cyan. This makes it easy to identify
                  data types at a glance.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  How do I copy the path to a specific value?
                </h3>
                <p className="text-slate-400">
                  Hover over any node in the tree and click the &ldquo;copy
                  path&rdquo; button that appears on the right. The path is
                  copied in dot-notation (e.g.{" "}
                  <code className="text-slate-300">$.users[0].name</code>) which
                  you can use in code or JSONPath queries.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Is my data safe?
                </h3>
                <p className="text-slate-400">
                  Yes. All parsing and rendering happens entirely in your browser
                  using JavaScript. No data is sent to any server.
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
