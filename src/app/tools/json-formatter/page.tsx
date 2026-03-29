"use client";

import { useState, useCallback, useMemo } from "react";
import JsonLd from "@/components/JsonLd";
import RelatedTools from "@/components/RelatedTools";
import ToolBreadcrumb from "@/components/ToolBreadcrumb";
import AdUnit from "@/components/AdUnit";
import {
  generateFAQSchema,
  generateWebAppSchema,
  generateBreadcrumbSchema,
} from "@/lib/jsonld";

type IndentMode = "2" | "4" | "tab";
type ViewMode = "text" | "tree";

type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

const SAMPLE_JSON = `{
  "name": "DevTools Hub",
  "version": "1.0.0",
  "description": "Free online developer tools",
  "features": ["JSON Formatter", "Base64 Encoder", "Regex Tester"],
  "settings": {
    "theme": "dark",
    "autoSave": true,
    "maxFileSize": 5242880
  },
  "contributors": [
    { "name": "Alice", "role": "developer" },
    { "name": "Bob", "role": "designer" }
  ]
}`;

/* ─── Tree View helpers ─── */

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

interface TreeNodeProps {
  keyName: string | number | null;
  value: JsonValue;
  path: string;
  depth: number;
  expandedPaths: Set<string>;
  toggleExpand: (path: string) => void;
}

function TreeNode({
  keyName,
  value,
  path,
  depth,
  expandedPaths,
  toggleExpand,
}: TreeNodeProps) {
  const type = getType(value);
  const isExpandable = type === "object" || type === "array";
  const isExpanded = expandedPaths.has(path);
  const childCount = countChildren(value);

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
        className="group flex items-center gap-1.5 py-0.5 rounded px-1 -ml-1 hover:bg-slate-700/30 cursor-pointer"
        onClick={() => {
          if (isExpandable) toggleExpand(path);
        }}
      >
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

        {keyName !== null && (
          <>
            <span className="text-slate-300 font-medium text-sm">
              {typeof keyName === "number" ? `[${keyName}]` : keyName}
            </span>
            <span className="text-slate-600 text-sm">:</span>
          </>
        )}

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

        <span
          className={`ml-1.5 px-1.5 py-0 rounded text-[10px] font-medium opacity-0 group-hover:opacity-100 transition-opacity ${
            type === "string"
              ? "bg-green-900/40 text-green-400"
              : type === "number"
                ? "bg-blue-900/40 text-blue-400"
                : type === "boolean"
                  ? "bg-yellow-900/40 text-yellow-400"
                  : type === "null"
                    ? "bg-red-900/40 text-red-400"
                    : type === "array"
                      ? "bg-purple-900/40 text-purple-400"
                      : "bg-cyan-900/40 text-cyan-400"
          }`}
        >
          {type}
        </span>
      </div>

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
              />
            );
          })}
          <div className="ml-4 pl-2 text-slate-500 text-sm">
            {type === "array" ? "]" : "}"}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Edge-case error helpers ─── */

function getEdgeCaseHint(input: string, errorMsg: string): string | null {
  // Trailing commas
  if (/,\s*[}\]]/.test(input)) {
    return "Tip: JSON does not allow trailing commas. Remove the comma before the closing } or ].";
  }
  // Single quotes
  if (/'[^']*'/.test(input) && !/"/.test(input)) {
    return "Tip: JSON requires double quotes (\"), not single quotes ('). Replace all single quotes with double quotes.";
  }
  // Comments
  if (/\/\/.*|\/\*[\s\S]*?\*\//.test(input)) {
    return "Tip: Standard JSON does not support comments (// or /* */). Remove all comments before parsing.";
  }
  // Unquoted keys
  if (/{\s*[a-zA-Z_]\w*\s*:/.test(input) && errorMsg.includes("position")) {
    return "Tip: JSON requires all keys to be wrapped in double quotes. Use {\"key\": value} instead of {key: value}.";
  }
  return null;
}

function getLineInfo(
  errorMsg: string,
  input: string
): string | null {
  const match = errorMsg.match(/position (\d+)/i);
  if (match && input) {
    const pos = parseInt(match[1], 10);
    const lines = input.substring(0, pos).split("\n");
    return `Line ${lines.length}, Column ${lines[lines.length - 1].length + 1}`;
  }
  return null;
}

/* ─── Syntax highlighting ─── */

function highlightJson(json: string): React.ReactNode[] {
  // Tokenize JSON string into colored spans
  const lines = json.split("\n");
  return lines.map((line, i) => {
    const parts: React.ReactNode[] = [];
    let remaining = line;
    let key = 0;

    while (remaining.length > 0) {
      // Leading whitespace
      const wsMatch = remaining.match(/^(\s+)/);
      if (wsMatch) {
        parts.push(<span key={key++}>{wsMatch[1]}</span>);
        remaining = remaining.slice(wsMatch[1].length);
        continue;
      }

      // String (key or value)
      const strMatch = remaining.match(/^("(?:[^"\\]|\\.)*")/);
      if (strMatch) {
        const afterStr = remaining.slice(strMatch[1].length);
        // It's a key if followed by a colon
        const isKey = /^\s*:/.test(afterStr);
        parts.push(
          <span
            key={key++}
            className={isKey ? "text-cyan-300" : "text-green-400"}
          >
            {strMatch[1]}
          </span>
        );
        remaining = afterStr;
        continue;
      }

      // Number
      const numMatch = remaining.match(/^(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)/);
      if (numMatch) {
        parts.push(
          <span key={key++} className="text-blue-400">
            {numMatch[1]}
          </span>
        );
        remaining = remaining.slice(numMatch[1].length);
        continue;
      }

      // Boolean
      const boolMatch = remaining.match(/^(true|false)/);
      if (boolMatch) {
        parts.push(
          <span key={key++} className="text-yellow-400">
            {boolMatch[1]}
          </span>
        );
        remaining = remaining.slice(boolMatch[1].length);
        continue;
      }

      // Null
      const nullMatch = remaining.match(/^(null)/);
      if (nullMatch) {
        parts.push(
          <span key={key++} className="text-red-400">
            {nullMatch[1]}
          </span>
        );
        remaining = remaining.slice(4);
        continue;
      }

      // Punctuation and other chars (one at a time)
      parts.push(
        <span key={key++} className="text-slate-400">
          {remaining[0]}
        </span>
      );
      remaining = remaining.slice(1);
    }

    return (
      <div key={i} className="table-row">
        <span className="table-cell pr-4 text-right text-slate-600 select-none w-[3ch] min-w-[3ch]">
          {i + 1}
        </span>
        <span className="table-cell">{parts}</span>
      </div>
    );
  });
}

/* ─── Main component ─── */

export default function JsonFormatterPage() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [parsedData, setParsedData] = useState<JsonValue | undefined>(
    undefined
  );
  const [error, setError] = useState<string | null>(null);
  const [indentMode, setIndentMode] = useState<IndentMode>("2");
  const [viewMode, setViewMode] = useState<ViewMode>("text");
  const [copied, setCopied] = useState(false);
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(
    new Set(["$"])
  );

  const getIndent = (mode: IndentMode): string | number => {
    if (mode === "tab") return "\t";
    return Number(mode);
  };

  const formatJson = useCallback(() => {
    if (!input.trim()) {
      setOutput("");
      setError(null);
      setParsedData(undefined);
      return;
    }
    try {
      const parsed = JSON.parse(input);
      setOutput(JSON.stringify(parsed, null, getIndent(indentMode)));
      setParsedData(parsed);
      setError(null);
      // Auto-expand root when formatting
      const paths = new Set<string>();
      collectAllPaths(parsed, "$", paths);
      setExpandedPaths(paths);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Invalid JSON";
      setError(msg);
      setOutput("");
      setParsedData(undefined);
    }
  }, [input, indentMode]);

  const minifyJson = useCallback(() => {
    if (!input.trim()) {
      setOutput("");
      setError(null);
      setParsedData(undefined);
      return;
    }
    try {
      const parsed = JSON.parse(input);
      setOutput(JSON.stringify(parsed));
      setParsedData(parsed);
      setError(null);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Invalid JSON";
      setError(msg);
      setOutput("");
      setParsedData(undefined);
    }
  }, [input]);

  const validateJson = useCallback(() => {
    if (!input.trim()) {
      setError(null);
      setOutput("");
      setParsedData(undefined);
      return;
    }
    try {
      const parsed = JSON.parse(input);
      setParsedData(parsed);
      setOutput(JSON.stringify(parsed, null, getIndent(indentMode)));
      setError(null);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Invalid JSON";
      setError(msg);
      setOutput("");
      setParsedData(undefined);
    }
  }, [input, indentMode]);

  const copyOutput = useCallback(async () => {
    if (!output) return;
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [output]);

  const downloadJson = useCallback(() => {
    if (!output) return;
    const blob = new Blob([output], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "formatted.json";
    a.click();
    URL.revokeObjectURL(url);
  }, [output]);

  const clearAll = useCallback(() => {
    setInput("");
    setOutput("");
    setError(null);
    setParsedData(undefined);
    setExpandedPaths(new Set(["$"]));
  }, []);

  const loadExample = useCallback(() => {
    setInput(SAMPLE_JSON);
    setError(null);
    setOutput("");
    setParsedData(undefined);
  }, []);

  const handleFileUpload = useCallback(
    (file: File) => {
      if (!file.name.endsWith(".json") && file.type !== "application/json") {
        setError("Please upload a .json file");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError("File too large (max 5 MB)");
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        setInput(text);
        setError(null);
        setOutput("");
        setParsedData(undefined);
      };
      reader.readAsText(file);
    },
    []
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file) handleFileUpload(file);
    },
    [handleFileUpload]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFileUpload(file);
    },
    [handleFileUpload]
  );

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
    if (parsedData === undefined) return;
    const all = new Set<string>();
    collectAllPaths(parsedData, "$", all);
    setExpandedPaths(all);
  }, [parsedData]);

  const collapseAll = useCallback(() => {
    setExpandedPaths(new Set(["$"]));
  }, []);

  const lineInfo = error ? getLineInfo(error, input) : null;
  const edgeCaseHint = error ? getEdgeCaseHint(input, error) : null;

  const inputLines = input.split("\n").length;
  const inputChars = input.length;
  const outputLines = output.split("\n").length;
  const outputChars = output.length;

  const isValid = useMemo(() => {
    if (!input.trim()) return false;
    try {
      JSON.parse(input);
      return true;
    } catch {
      return false;
    }
  }, [input]);

  return (
    <>
      <title>
        JSON Formatter & Beautifier - Free Online JSON Pretty Print Tool | DevTools Hub
      </title>
      <meta
        name="description"
        content="Free online JSON formatter, beautifier, and pretty print tool. Format JSON with syntax highlighting, line numbers, tree view, and 2-space, 4-space, or tab indentation. Validate, minify, copy, or download as .json file."
      />
      <meta
        name="keywords"
        content="json formatter, json beautifier, json pretty print, json validator, json prettifier, json minifier, format json online, validate json, json syntax highlighting, json tree view, how to format json"
      />
      <JsonLd
        data={[
          generateWebAppSchema({
            slug: "json-formatter",
            name: "JSON Formatter & Validator",
            description:
              "Format, validate, beautify, and minify JSON data online for free. Supports 2-space, 4-space, and tab indentation with tree view and error highlighting.",
            category: "json",
          }),
          generateBreadcrumbSchema({
            slug: "json-formatter",
            name: "JSON Formatter & Validator",
            description:
              "Format, validate, beautify, and minify JSON data online for free",
            category: "json",
          }),
          generateFAQSchema([
            {
              question: "What is JSON formatting?",
              answer:
                'JSON formatting (also called "pretty-printing" or "beautifying") adds consistent indentation and line breaks to raw JSON data, making it easier to read and debug. This tool parses your JSON and re-serializes it with your chosen indentation level (2 spaces, 4 spaces, or tabs).',
            },
            {
              question: "What does minifying JSON do?",
              answer:
                "Minifying removes all unnecessary whitespace from JSON, producing the smallest possible output. This is useful for reducing payload sizes when sending JSON over a network or storing it in databases.",
            },
            {
              question: 'How do I fix "Unexpected token" errors?',
              answer:
                "This usually means your JSON has a syntax error such as a trailing comma, missing quote, or unescaped special character. Check the line and column number shown in the error message to locate the issue. Common fixes include removing trailing commas after the last item in an array or object, and ensuring all strings are double-quoted.",
            },
            {
              question: "What indentation should I use for JSON?",
              answer:
                "2 spaces is the most common convention in JavaScript/TypeScript projects. 4 spaces is popular in Python and Java ecosystems. Tabs are preferred by developers who want customizable visual width. For minified production JSON, no indentation is used.",
            },
            {
              question: "What is the tree view?",
              answer:
                "The tree view displays your JSON as a collapsible, interactive tree structure. Each object and array can be expanded or collapsed, making it easy to navigate deeply nested data. Data types are color-coded: strings in green, numbers in blue, booleans in yellow, null in red, arrays in purple, and objects in cyan.",
            },
            {
              question: "How do I pretty print JSON?",
              answer:
                "Paste your raw or minified JSON into the input area and click 'Format / Beautify'. Choose your preferred indentation (2 spaces, 4 spaces, or tabs) from the dropdown. The output panel will show your JSON with syntax highlighting and line numbers for easy reading.",
            },
            {
              question: "How do I format JSON in the command line?",
              answer:
                "You can use 'python -m json.tool file.json' or 'jq . file.json' on Linux/macOS, or pipe JSON via 'echo {\"key\":\"value\"} | jq .'. However, this online tool is faster for one-off formatting and provides syntax highlighting, tree view, and validation that CLI tools don't offer.",
            },
            {
              question: "Is my data safe?",
              answer:
                "Yes. All processing happens entirely in your browser using JavaScript's built-in JSON.parse and JSON.stringify. No data is sent to any server.",
            },
          ]),
        ]}
      />

      <div className="min-h-screen bg-slate-900 text-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <ToolBreadcrumb slug="json-formatter" />

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
              JSON Formatter & Validator
            </h1>
            <p className="text-slate-400 max-w-2xl text-lg">
              Paste your JSON to format, validate, beautify, or minify it
              instantly. Syntax highlighting with line numbers, interactive tree
              view, and 2-space, 4-space, or tab indentation. Pretty print JSON
              online and download formatted output as a .json file.
            </p>
          </div>

          {/* AdSense top unit */}
          <AdUnit slot="TOP_SLOT" format="horizontal" className="mb-6" />

          {/* Controls */}
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <button
              onClick={formatJson}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              Format / Beautify
            </button>
            <button
              onClick={minifyJson}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors"
            >
              Minify
            </button>
            <button
              onClick={validateJson}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors"
            >
              Validate
            </button>
            <button
              onClick={copyOutput}
              disabled={!output}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {copied ? "Copied!" : "Copy"}
            </button>
            <button
              onClick={downloadJson}
              disabled={!output}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Download .json
            </button>
            <button
              onClick={clearAll}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors"
            >
              Clear
            </button>
            <button
              onClick={loadExample}
              className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
            >
              Load example
            </button>
            <label className="text-xs text-slate-500 hover:text-slate-300 transition-colors cursor-pointer">
              Upload .json
              <input
                type="file"
                accept=".json,application/json"
                onChange={handleFileInput}
                className="hidden"
              />
            </label>

            <div className="ml-auto flex items-center gap-4">
              {/* View mode toggle */}
              <div className="flex items-center bg-slate-800 border border-slate-600 rounded-lg overflow-hidden">
                <button
                  onClick={() => setViewMode("text")}
                  className={`px-3 py-1 text-sm font-medium transition-colors ${
                    viewMode === "text"
                      ? "bg-blue-600 text-white"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  Text
                </button>
                <button
                  onClick={() => setViewMode("tree")}
                  className={`px-3 py-1 text-sm font-medium transition-colors ${
                    viewMode === "tree"
                      ? "bg-blue-600 text-white"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  Tree
                </button>
              </div>

              <div className="flex items-center gap-2">
                <label className="text-sm text-slate-400">Indent:</label>
                <select
                  value={indentMode}
                  onChange={(e) =>
                    setIndentMode(e.target.value as IndentMode)
                  }
                  className="bg-slate-800 border border-slate-600 text-slate-200 rounded px-2 py-1 text-sm"
                >
                  <option value="2">2 spaces</option>
                  <option value="4">4 spaces</option>
                  <option value="tab">Tabs</option>
                </select>
              </div>

              {/* Validation indicator */}
              {input.trim().length > 0 && (
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-block w-3 h-3 rounded-full ${
                      isValid ? "bg-green-500" : "bg-red-500"
                    }`}
                  />
                  <span
                    className={`text-sm font-medium ${
                      isValid ? "text-green-400" : "text-red-400"
                    }`}
                  >
                    {isValid ? "Valid JSON" : "Invalid JSON"}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-4 p-3 bg-red-900/40 border border-red-700 rounded-lg text-sm font-mono space-y-1">
              <div className="text-red-300">
                <span className="font-bold">Error:</span> {error}
                {lineInfo && (
                  <span className="ml-2 text-red-400">({lineInfo})</span>
                )}
              </div>
              {edgeCaseHint && (
                <div className="text-amber-400 text-xs mt-1">
                  {edgeCaseHint}
                </div>
              )}
            </div>
          )}

          {/* Panels */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
            {/* Input */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-slate-300">
                  Input
                </label>
                <span className="text-xs text-slate-500">
                  {inputChars} chars | {inputLines} lines
                </span>
              </div>
              <div
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                className="relative"
              >
                <textarea
                  value={input}
                  onChange={(e) => {
                    setInput(e.target.value);
                    setError(null);
                    setOutput("");
                    setParsedData(undefined);
                  }}
                  placeholder={'Paste your JSON here or drag & drop a .json file...\n\n{"example": "value"}'}
                  className={`w-full h-96 bg-slate-800 border rounded-lg p-4 font-mono text-sm text-slate-200 placeholder-slate-500 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    error ? "border-red-600" : "border-slate-600"
                  }`}
                  spellCheck={false}
                />
              </div>
            </div>

            {/* Output — text or tree */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-slate-300">
                  {viewMode === "text" ? "Output" : "Tree View"}
                </label>
                {viewMode === "text" && (
                  <span className="text-xs text-slate-500">
                    {output
                      ? `${outputChars} chars | ${outputLines} lines`
                      : ""}
                  </span>
                )}
                {viewMode === "tree" && parsedData !== undefined && (
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

              {viewMode === "text" ? (
                output ? (
                  <div className="w-full h-96 bg-slate-800 border border-slate-600 rounded-lg p-4 font-mono text-sm overflow-auto">
                    <div className="table w-full">
                      {highlightJson(output)}
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-96 bg-slate-800 border border-slate-600 rounded-lg p-4 font-mono text-sm text-slate-500 flex items-center justify-center">
                    Formatted JSON will appear here...
                  </div>
                )
              ) : (
                <div className="w-full h-96 bg-slate-800 border border-slate-600 rounded-lg p-4 font-mono text-sm overflow-auto">
                  {parsedData === undefined ? (
                    <div className="h-full flex items-center justify-center text-slate-500">
                      {input.trim()
                        ? "Fix JSON errors or click Format to see tree"
                        : "Paste JSON and click Format to see tree"}
                    </div>
                  ) : (
                    <TreeNode
                      keyName={null}
                      value={parsedData}
                      path="$"
                      depth={0}
                      expandedPaths={expandedPaths}
                      toggleExpand={toggleExpand}
                    />
                  )}
                </div>
              )}

              {/* Type legend for tree view */}
              {viewMode === "tree" && parsedData !== undefined && (
                <div className="mt-2 flex flex-wrap gap-3 text-xs">
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

          {/* Best Practices */}
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 mb-6">
            <h2 className="text-lg font-semibold text-white mb-4">
              JSON Formatting Tips
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
              {[
                {
                  name: "Validate before shipping",
                  tip: "Always validate JSON before sending to APIs or saving to config files. A single trailing comma can break everything.",
                },
                {
                  name: "Choose your indentation",
                  tip: "2 spaces for JS/TS projects, 4 spaces for Python/Java, tabs for personal preference. Stay consistent within a project.",
                },
                {
                  name: "Minify for production",
                  tip: "Remove whitespace to reduce payload size. A 50KB formatted JSON file can shrink to 20KB minified.",
                },
                {
                  name: "Use double quotes",
                  tip: "JSON requires double quotes for strings and keys. Single quotes, unquoted keys, and trailing commas are not valid JSON.",
                },
                {
                  name: "Check nested structures",
                  tip: "Errors often hide in deeply nested objects or arrays. Use tree view to visually inspect the structure level by level.",
                },
                {
                  name: "Handle special characters",
                  tip: "Escape backslashes, quotes, and control characters in strings. Use \\n for newlines and \\t for tabs inside JSON values.",
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

          {/* AdSense bottom unit */}
          <AdUnit slot="BOTTOM_SLOT" format="auto" className="mb-6" />

          <RelatedTools currentSlug="json-formatter" />

          {/* FAQ Section */}
          <section className="mt-16 border-t border-slate-700 pt-10">
            <h2 className="text-2xl font-bold text-white mb-6">
              Frequently Asked Questions
            </h2>

            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  What is JSON formatting?
                </h3>
                <p className="text-slate-400">
                  JSON formatting (also called &ldquo;pretty-printing&rdquo; or
                  &ldquo;beautifying&rdquo;) adds consistent indentation and
                  line breaks to raw JSON data, making it easier to read and
                  debug. This tool parses your JSON and re-serializes it with
                  your chosen indentation level (2 spaces, 4 spaces, or tabs).
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  What does minifying JSON do?
                </h3>
                <p className="text-slate-400">
                  Minifying removes all unnecessary whitespace from JSON,
                  producing the smallest possible output. This is useful for
                  reducing payload sizes when sending JSON over a network or
                  storing it in databases.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  How do I fix &ldquo;Unexpected token&rdquo; errors?
                </h3>
                <p className="text-slate-400">
                  This usually means your JSON has a syntax error such as a
                  trailing comma, missing quote, or unescaped special character.
                  Check the line and column number shown in the error message to
                  locate the issue. Common fixes include removing trailing
                  commas after the last item in an array or object, and ensuring
                  all strings are double-quoted.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  What indentation should I use for JSON?
                </h3>
                <p className="text-slate-400">
                  2 spaces is the most common convention in JavaScript and
                  TypeScript projects. 4 spaces is popular in Python and Java
                  ecosystems. Tabs are preferred by developers who want
                  customizable visual width. For minified production JSON, no
                  indentation is used.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  What is the tree view?
                </h3>
                <p className="text-slate-400">
                  The tree view displays your parsed JSON as a collapsible,
                  interactive tree structure. Each object and array can be
                  expanded or collapsed individually, making it easy to navigate
                  deeply nested data. Data types are color-coded so you can
                  identify strings, numbers, booleans, nulls, arrays, and
                  objects at a glance.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  How do I pretty print JSON?
                </h3>
                <p className="text-slate-400">
                  Paste your raw or minified JSON into the input area and click
                  &ldquo;Format / Beautify&rdquo;. Choose your preferred
                  indentation (2 spaces, 4 spaces, or tabs) from the dropdown.
                  The output panel will show your JSON with syntax highlighting
                  and line numbers for easy reading.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  How do I format JSON in the command line?
                </h3>
                <p className="text-slate-400">
                  You can use <code className="text-slate-300">python -m json.tool file.json</code> or{" "}
                  <code className="text-slate-300">jq . file.json</code> on Linux/macOS,
                  or pipe JSON via <code className="text-slate-300">echo &#123;&quot;key&quot;:&quot;value&quot;&#125; | jq .</code>.
                  However, this online tool is faster for one-off formatting and
                  provides syntax highlighting, tree view, and validation that
                  CLI tools don&apos;t offer.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Is my data safe?
                </h3>
                <p className="text-slate-400">
                  Yes. All processing happens entirely in your browser using
                  JavaScript&apos;s built-in JSON.parse and JSON.stringify. No
                  data is sent to any server.
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
