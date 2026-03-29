"use client";

import { useState, useCallback } from "react";
import JsonLd from "@/components/JsonLd";
import RelatedTools from "@/components/RelatedTools";
import ToolBreadcrumb from "@/components/ToolBreadcrumb";
import {
  generateFAQSchema,
  generateWebAppSchema,
  generateBreadcrumbSchema,
} from "@/lib/jsonld";

// ── JSONPath evaluator (subset: dot notation, bracket notation, wildcards, array slices, filters) ──

type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

interface MatchResult {
  path: string;
  value: JsonValue;
}

const evaluateJsonPath = (data: JsonValue, expression: string): MatchResult[] => {
  const results: MatchResult[] = [];

  if (!expression.startsWith("$")) {
    throw new Error("JSONPath expression must start with $");
  }

  const resolve = (current: JsonValue, tokens: string[], pathSoFar: string) => {
    if (tokens.length === 0) {
      results.push({ path: pathSoFar, value: current });
      return;
    }

    const token = tokens[0];
    const rest = tokens.slice(1);

    // Recursive descent (..)
    if (token === "..") {
      if (rest.length === 0) return;
      // Apply next token at every level
      const nextToken = rest[0];
      const afterNext = rest.slice(1);

      const walk = (node: JsonValue, p: string) => {
        // Try to apply nextToken here
        applyToken(node, nextToken, afterNext, p);
        // Recurse into children
        if (node && typeof node === "object") {
          if (Array.isArray(node)) {
            node.forEach((item, idx) => walk(item, `${p}[${idx}]`));
          } else {
            for (const key of Object.keys(node)) {
              walk(node[key], `${p}.${key}`);
            }
          }
        }
      };
      walk(current, pathSoFar);
      return;
    }

    applyToken(current, token, rest, pathSoFar);
  };

  const applyToken = (current: JsonValue, token: string, rest: string[], pathSoFar: string) => {
    // Wildcard
    if (token === "*") {
      if (current && typeof current === "object") {
        if (Array.isArray(current)) {
          current.forEach((item, idx) => resolve(item, rest, `${pathSoFar}[${idx}]`));
        } else {
          for (const key of Object.keys(current)) {
            resolve(current[key], rest, `${pathSoFar}.${key}`);
          }
        }
      }
      return;
    }

    // Array slice [start:end:step] or [index] or [index1,index2]
    const bracketMatch = token.match(/^\[(.+)\]$/);
    if (bracketMatch) {
      const inner = bracketMatch[1];

      // Filter expression [?(@.key == value)]
      const filterMatch = inner.match(/^\?\((.+)\)$/);
      if (filterMatch && Array.isArray(current)) {
        const filterExpr = filterMatch[1].trim();
        current.forEach((item, idx) => {
          if (evaluateFilter(item, filterExpr)) {
            resolve(item, rest, `${pathSoFar}[${idx}]`);
          }
        });
        return;
      }

      // Comma-separated indices or names
      if (inner.includes(",")) {
        const parts = inner.split(",").map((s) => s.trim());
        for (const part of parts) {
          const cleanPart = part.replace(/^['"]|['"]$/g, "");
          if (Array.isArray(current)) {
            const idx = parseInt(cleanPart, 10);
            if (!isNaN(idx) && idx >= 0 && idx < current.length) {
              resolve(current[idx], rest, `${pathSoFar}[${idx}]`);
            }
          } else if (current && typeof current === "object") {
            if (cleanPart in current) {
              resolve((current as Record<string, JsonValue>)[cleanPart], rest, `${pathSoFar}.${cleanPart}`);
            }
          }
        }
        return;
      }

      // Slice [start:end] or [start:end:step]
      if (inner.includes(":") && Array.isArray(current)) {
        const sliceParts = inner.split(":").map((s) => s.trim());
        const len = current.length;
        let start = sliceParts[0] ? parseInt(sliceParts[0], 10) : 0;
        let end = sliceParts[1] ? parseInt(sliceParts[1], 10) : len;
        const step = sliceParts[2] ? parseInt(sliceParts[2], 10) : 1;
        if (start < 0) start = Math.max(0, len + start);
        if (end < 0) end = Math.max(0, len + end);
        if (end > len) end = len;
        for (let i = start; i < end; i += Math.max(1, step)) {
          resolve(current[i], rest, `${pathSoFar}[${i}]`);
        }
        return;
      }

      // Negative index
      const idx = parseInt(inner, 10);
      if (!isNaN(idx) && Array.isArray(current)) {
        const realIdx = idx < 0 ? current.length + idx : idx;
        if (realIdx >= 0 && realIdx < current.length) {
          resolve(current[realIdx], rest, `${pathSoFar}[${realIdx}]`);
        }
        return;
      }

      // Quoted property name
      const quotedMatch = inner.match(/^['"](.+)['"]$/);
      if (quotedMatch && current && typeof current === "object" && !Array.isArray(current)) {
        const key = quotedMatch[1];
        if (key in current) {
          resolve((current as Record<string, JsonValue>)[key], rest, `${pathSoFar}['${key}']`);
        }
        return;
      }

      // Unquoted number index
      if (!isNaN(idx) && Array.isArray(current) && idx >= 0 && idx < current.length) {
        resolve(current[idx], rest, `${pathSoFar}[${idx}]`);
        return;
      }
    }

    // Dot notation property
    if (current && typeof current === "object" && !Array.isArray(current)) {
      if (token in current) {
        resolve((current as Record<string, JsonValue>)[token], rest, `${pathSoFar}.${token}`);
      }
    }
  };

  const evaluateFilter = (item: JsonValue, expr: string): boolean => {
    if (!item || typeof item !== "object" || Array.isArray(item)) return false;
    const obj = item as Record<string, JsonValue>;

    // Simple comparisons: @.key == value, @.key != value, @.key > value, etc.
    const compMatch = expr.match(/^@\.(\w+)\s*(==|!=|>=|<=|>|<)\s*(.+)$/);
    if (compMatch) {
      const key = compMatch[1];
      const op = compMatch[2];
      let rhs = compMatch[3].trim();

      if (!(key in obj)) return false;
      const lhs = obj[key];

      // Parse RHS
      let rhsVal: JsonValue;
      if (rhs === "true") rhsVal = true;
      else if (rhs === "false") rhsVal = false;
      else if (rhs === "null") rhsVal = null;
      else if ((rhs.startsWith('"') && rhs.endsWith('"')) || (rhs.startsWith("'") && rhs.endsWith("'"))) {
        rhsVal = rhs.slice(1, -1);
      } else if (!isNaN(Number(rhs))) {
        rhsVal = Number(rhs);
      } else {
        rhsVal = rhs;
      }

      switch (op) {
        case "==": return JSON.stringify(lhs) === JSON.stringify(rhsVal);
        case "!=": return JSON.stringify(lhs) !== JSON.stringify(rhsVal);
        case ">": return typeof lhs === "number" && typeof rhsVal === "number" && lhs > rhsVal;
        case "<": return typeof lhs === "number" && typeof rhsVal === "number" && lhs < rhsVal;
        case ">=": return typeof lhs === "number" && typeof rhsVal === "number" && lhs >= rhsVal;
        case "<=": return typeof lhs === "number" && typeof rhsVal === "number" && lhs <= rhsVal;
      }
    }

    // Existence check: @.key
    const existsMatch = expr.match(/^@\.(\w+)$/);
    if (existsMatch) {
      return existsMatch[1] in obj;
    }

    return false;
  };

  // Tokenize the expression
  const tokenize = (expr: string): string[] => {
    const tokens: string[] = [];
    let i = 1; // skip $

    while (i < expr.length) {
      // Skip leading dots
      if (expr[i] === ".") {
        if (expr[i + 1] === ".") {
          tokens.push("..");
          i += 2;
          continue;
        }
        i++;
        continue;
      }

      // Bracket notation
      if (expr[i] === "[") {
        let depth = 1;
        let j = i + 1;
        while (j < expr.length && depth > 0) {
          if (expr[j] === "[") depth++;
          if (expr[j] === "]") depth--;
          j++;
        }
        tokens.push(expr.slice(i, j));
        i = j;
        continue;
      }

      // Dot notation key or wildcard
      let j = i;
      while (j < expr.length && expr[j] !== "." && expr[j] !== "[") {
        j++;
      }
      if (j > i) {
        tokens.push(expr.slice(i, j));
      }
      i = j;
    }

    return tokens;
  };

  const tokens = tokenize(expression);
  resolve(data, tokens, "$");
  return results;
};

const formatJson = (value: JsonValue): string => {
  return JSON.stringify(value, null, 2);
};

const EXAMPLE_JSON = `{
  "store": {
    "name": "Tech Books",
    "books": [
      {
        "title": "JavaScript: The Good Parts",
        "author": "Douglas Crockford",
        "price": 29.99,
        "category": "programming",
        "inStock": true
      },
      {
        "title": "Clean Code",
        "author": "Robert C. Martin",
        "price": 37.50,
        "category": "programming",
        "inStock": true
      },
      {
        "title": "Design Patterns",
        "author": "Gang of Four",
        "price": 49.99,
        "category": "programming",
        "inStock": false
      },
      {
        "title": "The Art of War",
        "author": "Sun Tzu",
        "price": 12.99,
        "category": "classics",
        "inStock": true
      }
    ],
    "location": {
      "city": "San Francisco",
      "state": "CA",
      "zip": "94102"
    }
  }
}`;

const EXAMPLE_QUERIES: { expr: string; desc: string }[] = [
  { expr: "$.store.name", desc: "Get store name" },
  { expr: "$.store.books[0].title", desc: "First book title" },
  { expr: "$.store.books[-1]", desc: "Last book" },
  { expr: "$.store.books[*].title", desc: "All book titles" },
  { expr: "$.store.books[0:2]", desc: "First two books" },
  { expr: "$.store.books[?(@.price > 30)]", desc: "Books over $30" },
  { expr: "$.store.books[?(@.category == 'classics')]", desc: "Classics" },
  { expr: "$.store.books[?(@.inStock == true)]", desc: "In-stock books" },
  { expr: "$..author", desc: "All authors (recursive)" },
  { expr: "$..price", desc: "All prices (recursive)" },
  { expr: "$.store.location.*", desc: "All location values" },
  { expr: "$.store.books[0,2]", desc: "1st and 3rd books" },
];

export default function JsonPathTesterPage() {
  const [jsonInput, setJsonInput] = useState("");
  const [pathInput, setPathInput] = useState("");
  const [results, setResults] = useState<MatchResult[]>([]);
  const [error, setError] = useState("");
  const [evaluated, setEvaluated] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleEvaluate = useCallback(() => {
    setError("");
    setResults([]);
    setEvaluated(false);

    if (!jsonInput.trim() || !pathInput.trim()) {
      setError("Both JSON data and JSONPath expression are required.");
      return;
    }

    let data: JsonValue;
    try {
      data = JSON.parse(jsonInput);
    } catch (e) {
      setError(`Invalid JSON: ${e instanceof Error ? e.message : "Parse error"}`);
      return;
    }

    try {
      const matches = evaluateJsonPath(data, pathInput.trim());
      setResults(matches);
      setEvaluated(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "JSONPath evaluation failed");
    }
  }, [jsonInput, pathInput]);

  const handleCopy = useCallback(async () => {
    if (results.length === 0) return;
    const output = results.length === 1
      ? formatJson(results[0].value)
      : formatJson(results.map((r) => r.value));
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [results]);

  const handleClear = useCallback(() => {
    setJsonInput("");
    setPathInput("");
    setResults([]);
    setError("");
    setEvaluated(false);
  }, []);

  const loadExample = useCallback((expr?: string) => {
    setJsonInput(EXAMPLE_JSON);
    setPathInput(expr || "$.store.books[*].title");
    setResults([]);
    setError("");
    setEvaluated(false);
  }, []);

  return (
    <>
      <title>JSONPath Tester - Free Online Tool | DevTools Hub</title>
      <meta
        name="description"
        content="Test and evaluate JSONPath expressions online for free. Query JSON data with dot notation, wildcards, array slices, filters, and recursive descent — all in your browser."
      />
      <JsonLd
        data={[
          generateWebAppSchema({
            slug: "json-path-tester",
            name: "JSON Path Tester",
            description: "Test JSONPath expressions against JSON data with real-time results",
            category: "json",
          }),
          generateBreadcrumbSchema({
            slug: "json-path-tester",
            name: "JSON Path Tester",
            description: "Test JSONPath expressions against JSON data with real-time results",
            category: "json",
          }),
          generateFAQSchema([
            { question: "What is JSONPath?", answer: "JSONPath is a query language for JSON, similar to XPath for XML. It lets you extract specific values from complex JSON structures using path expressions. Originally proposed by Stefan Goessner in 2007, it's widely used in API testing, data processing, and configuration management." },
            { question: "What JSONPath features does this tool support?", answer: "This tool supports: dot notation ($.key), bracket notation ($['key']), array indexing ([0], [-1]), slicing ([0:3], [::2]), wildcards (*), recursive descent (..), union ([0,2]), and filter expressions ([?(@.price > 10)]). Filters support ==, !=, >, <, >=, <= operators and existence checks." },
            { question: "What is recursive descent (..)?", answer: "The .. operator searches through all levels of the JSON structure. For example, $..price finds every 'price' field regardless of depth. It's useful when you know the key name but not its exact location in the hierarchy." },
            { question: "Is my data safe?", answer: "Yes. All JSONPath evaluation happens entirely in your browser using JavaScript. No data is sent to any server. Your JSON data never leaves your machine." },
          ]),
        ]}
      />

      <main className="min-h-screen bg-slate-900 text-white">
        <div className="max-w-6xl mx-auto px-4 py-12">
          <ToolBreadcrumb slug="json-path-tester" />

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
              JSONPath Tester
            </h1>
            <p className="text-slate-400 max-w-2xl text-lg">
              Test JSONPath expressions against your JSON data. Supports dot notation, bracket notation, wildcards, array slices, recursive descent, and filter expressions.
            </p>
          </div>

          {/* JSONPath input bar */}
          <div className="mb-4">
            <label className="text-sm font-medium text-slate-300 mb-2 block">JSONPath Expression</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={pathInput}
                onChange={(e) => { setPathInput(e.target.value); setEvaluated(false); }}
                placeholder="$.store.books[*].title"
                className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 font-mono text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                onKeyDown={(e) => { if (e.key === "Enter") handleEvaluate(); }}
              />
              <button
                onClick={handleEvaluate}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors whitespace-nowrap"
              >
                Evaluate
              </button>
            </div>
          </div>

          {/* Quick queries */}
          <div className="flex flex-wrap gap-1.5 mb-6">
            {EXAMPLE_QUERIES.map((q) => (
              <button
                key={q.expr}
                onClick={() => { if (!jsonInput.trim()) loadExample(q.expr); else { setPathInput(q.expr); setEvaluated(false); } }}
                title={q.desc}
                className="px-2 py-1 text-[11px] font-mono bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded transition-colors"
              >
                {q.expr}
              </button>
            ))}
          </div>

          {/* Controls */}
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <button
              onClick={handleCopy}
              disabled={results.length === 0}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-sm"
            >
              {copied ? "Copied!" : "Copy Results"}
            </button>
            <button
              onClick={handleClear}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors text-sm"
            >
              Clear
            </button>
            <button
              onClick={() => loadExample()}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors text-sm"
            >
              Load Example
            </button>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 p-4 bg-red-900/40 border border-red-700 rounded-lg text-red-300 text-sm">
              {error}
            </div>
          )}

          {/* Panels */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
            {/* JSON Input */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-slate-300">JSON Data</label>
                <span className="text-xs text-slate-500">{jsonInput.length} chars</span>
              </div>
              <textarea
                value={jsonInput}
                onChange={(e) => { setJsonInput(e.target.value); setEvaluated(false); }}
                placeholder='Paste your JSON here...'
                className="w-full h-96 bg-slate-800 border border-slate-700 rounded-lg p-4 font-mono text-sm text-slate-200 placeholder-slate-500 resize-y focus:outline-none focus:ring-2 focus:ring-blue-500"
                spellCheck={false}
              />
            </div>

            {/* Results */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-slate-300">
                  Results {evaluated && <span className="text-slate-500">({results.length} match{results.length !== 1 ? "es" : ""})</span>}
                </label>
              </div>
              {evaluated && results.length === 0 ? (
                <div className="w-full h-96 bg-slate-800 border border-slate-700 rounded-lg p-4 flex items-center justify-center">
                  <div className="text-center text-slate-500">
                    <div className="text-2xl mb-2">0</div>
                    <div className="text-sm">No matches found</div>
                  </div>
                </div>
              ) : (
                <div className="w-full h-96 bg-slate-800 border border-slate-700 rounded-lg overflow-y-auto">
                  {results.length > 0 ? (
                    <div className="divide-y divide-slate-700/50">
                      {results.map((r, i) => (
                        <div key={i} className="p-3">
                          <div className="text-xs font-mono text-blue-400 mb-1">{r.path}</div>
                          <pre className="text-sm font-mono text-green-300 whitespace-pre-wrap break-all">
                            {typeof r.value === "object" ? formatJson(r.value) : String(r.value)}
                          </pre>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 flex items-center justify-center h-full">
                      <p className="text-slate-500 text-sm">Results will appear here...</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* JSONPath syntax reference */}
          <div className="bg-slate-800 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">JSONPath Syntax Reference</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left py-2 text-slate-400 font-medium">Expression</th>
                    <th className="text-left py-2 text-slate-400 font-medium">Description</th>
                    <th className="text-left py-2 text-slate-400 font-medium">Example</th>
                  </tr>
                </thead>
                <tbody className="text-slate-300">
                  {[
                    ["$", "Root object", "$ (the entire document)"],
                    [".key", "Child property", "$.store.name"],
                    ["['key']", "Bracket notation", "$['store']['name']"],
                    ["[0]", "Array index", "$.books[0]"],
                    ["[-1]", "Last element", "$.books[-1]"],
                    ["[0:3]", "Array slice (start:end)", "$.books[0:3]"],
                    ["[0:4:2]", "Slice with step", "$.books[0:4:2]"],
                    ["[0,2]", "Multiple indices", "$.books[0,2]"],
                    [".*", "All children (wildcard)", "$.store.*"],
                    ["[*]", "All array elements", "$.books[*]"],
                    ["..", "Recursive descent", "$..price"],
                    ["[?()]", "Filter expression", "$.books[?(@.price > 20)]"],
                    ["@.key", "Current node (in filter)", "[?(@.inStock == true)]"],
                  ].map((row) => (
                    <tr key={row[0]} className="border-b border-slate-700/50">
                      <td className="py-2 font-mono text-blue-400 text-xs whitespace-nowrap">{row[0]}</td>
                      <td className="py-2">{row[1]}</td>
                      <td className="py-2 font-mono text-xs text-green-400">{row[2]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <RelatedTools currentSlug="json-path-tester" />

          {/* FAQ */}
          <div className="bg-slate-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Frequently Asked Questions</h2>
            <div className="space-y-4">
              {[
                {
                  q: "What is JSONPath?",
                  a: "JSONPath is a query language for JSON, similar to XPath for XML. It lets you extract specific values from complex JSON structures using path expressions. Originally proposed by Stefan Goessner in 2007, it's widely used in API testing, data processing, and configuration management."
                },
                {
                  q: "What JSONPath features does this tool support?",
                  a: "This tool supports: dot notation ($.key), bracket notation ($['key']), array indexing ([0], [-1]), slicing ([0:3], [::2]), wildcards (*), recursive descent (..), union ([0,2]), and filter expressions ([?(@.price > 10)]). Filters support ==, !=, >, <, >=, <= operators and existence checks."
                },
                {
                  q: "What is recursive descent (..)?",
                  a: "The .. operator searches through all levels of the JSON structure. For example, $..price finds every 'price' field regardless of depth. It's useful when you know the key name but not its exact location in the hierarchy."
                },
                {
                  q: "Is my data safe?",
                  a: "Yes. All JSONPath evaluation happens entirely in your browser using JavaScript. No data is sent to any server. Your JSON data never leaves your machine."
                },
              ].map((item) => (
                <div key={item.q}>
                  <h3 className="font-medium text-white text-sm">{item.q}</h3>
                  <p className="text-slate-400 text-sm mt-1">{item.a}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
