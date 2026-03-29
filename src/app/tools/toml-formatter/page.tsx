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

// ── TOML parser + formatter (subset: tables, key-value, arrays, inline tables, strings, numbers, booleans, dates) ──

type TomlValue = string | number | boolean | Date | TomlValue[] | TomlTable;
interface TomlTable {
  [key: string]: TomlValue;
}

interface ParsedEntry {
  type: "comment" | "blank" | "kv" | "table" | "array-table";
  key?: string;
  value?: string;
  raw?: string;
  comment?: string;
}

const parseTomlEntries = (input: string): ParsedEntry[] => {
  const lines = input.split("\n");
  const entries: ParsedEntry[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (trimmed === "") {
      entries.push({ type: "blank" });
      continue;
    }

    if (trimmed.startsWith("#")) {
      entries.push({ type: "comment", raw: trimmed });
      continue;
    }

    // Array of tables [[...]]
    const arrTableMatch = trimmed.match(/^\[\[(.+?)\]\]\s*(#.*)?$/);
    if (arrTableMatch) {
      entries.push({ type: "array-table", key: arrTableMatch[1].trim(), comment: arrTableMatch[2] || "" });
      continue;
    }

    // Table header [...]
    const tableMatch = trimmed.match(/^\[(.+?)\]\s*(#.*)?$/);
    if (tableMatch) {
      entries.push({ type: "table", key: tableMatch[1].trim(), comment: tableMatch[2] || "" });
      continue;
    }

    // Key = Value
    const kvMatch = trimmed.match(/^([^\s=]+(?:\s*\.\s*[^\s=]+)*)\s*=\s*(.*)/);
    if (kvMatch) {
      let key = kvMatch[1].trim();
      let value = kvMatch[2].trim();
      let comment = "";

      // Handle multiline basic strings (""")
      if (value.startsWith('"""') && !value.slice(3).includes('"""')) {
        const mlLines = [value];
        while (i + 1 < lines.length) {
          i++;
          mlLines.push(lines[i]);
          if (lines[i].includes('"""')) break;
        }
        value = mlLines.join("\n");
      }
      // Handle multiline literal strings (''')
      else if (value.startsWith("'''") && !value.slice(3).includes("'''")) {
        const mlLines = [value];
        while (i + 1 < lines.length) {
          i++;
          mlLines.push(lines[i]);
          if (lines[i].includes("'''")) break;
        }
        value = mlLines.join("\n");
      }
      // Handle multiline arrays [ ... ]
      else if (value.startsWith("[") && !isBalanced(value, "[", "]")) {
        const mlLines = [value];
        while (i + 1 < lines.length) {
          i++;
          mlLines.push(lines[i]);
          const joined = mlLines.join("\n");
          if (isBalanced(joined, "[", "]")) break;
        }
        value = mlLines.join("\n");
      }
      // Handle multiline inline tables { ... }
      else if (value.startsWith("{") && !isBalanced(value, "{", "}")) {
        const mlLines = [value];
        while (i + 1 < lines.length) {
          i++;
          mlLines.push(lines[i]);
          const joined = mlLines.join("\n");
          if (isBalanced(joined, "{", "}")) break;
        }
        value = mlLines.join("\n");
      }
      // Inline comment detection (outside strings)
      else {
        const inlineComment = extractInlineComment(value);
        if (inlineComment.comment) {
          value = inlineComment.value;
          comment = inlineComment.comment;
        }
      }

      entries.push({ type: "kv", key, value, comment });
      continue;
    }

    // Fallback — treat as raw
    entries.push({ type: "comment", raw: trimmed });
  }

  return entries;
};

const isBalanced = (s: string, open: string, close: string): boolean => {
  let depth = 0;
  let inStr = false;
  let strChar = "";
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (inStr) {
      if (ch === strChar && s[i - 1] !== "\\") inStr = false;
      continue;
    }
    if (ch === '"' || ch === "'") { inStr = true; strChar = ch; continue; }
    if (ch === open) depth++;
    if (ch === close) depth--;
  }
  return depth === 0;
};

const extractInlineComment = (value: string): { value: string; comment: string } => {
  let inStr = false;
  let strChar = "";
  for (let i = 0; i < value.length; i++) {
    const ch = value[i];
    if (inStr) {
      if (ch === strChar && value[i - 1] !== "\\") inStr = false;
      continue;
    }
    if (ch === '"' || ch === "'") { inStr = true; strChar = ch; continue; }
    if (ch === "#" && i > 0 && value[i - 1] === " ") {
      return { value: value.slice(0, i).trimEnd(), comment: value.slice(i) };
    }
  }
  return { value, comment: "" };
};

type IndentStyle = "2" | "4" | "tab";

const formatToml = (input: string, indent: string, alignEquals: boolean): string => {
  const entries = parseTomlEntries(input);
  const lines: string[] = [];

  // Group entries by table sections for alignment
  let kvGroup: ParsedEntry[] = [];

  const flushKvGroup = () => {
    if (kvGroup.length === 0) return;

    if (alignEquals) {
      const maxKeyLen = Math.max(...kvGroup.map((e) => (e.key || "").length));
      for (const entry of kvGroup) {
        const padded = (entry.key || "").padEnd(maxKeyLen);
        const val = formatValue(entry.value || "", indent);
        const comment = entry.comment ? " " + entry.comment : "";
        lines.push(`${padded} = ${val}${comment}`);
      }
    } else {
      for (const entry of kvGroup) {
        const val = formatValue(entry.value || "", indent);
        const comment = entry.comment ? " " + entry.comment : "";
        lines.push(`${entry.key} = ${val}${comment}`);
      }
    }
    kvGroup = [];
  };

  for (const entry of entries) {
    if (entry.type === "kv") {
      kvGroup.push(entry);
      continue;
    }

    flushKvGroup();

    if (entry.type === "blank") {
      lines.push("");
    } else if (entry.type === "comment") {
      lines.push(entry.raw || "");
    } else if (entry.type === "table") {
      // Add blank line before table headers (unless start of file)
      if (lines.length > 0 && lines[lines.length - 1] !== "") {
        lines.push("");
      }
      const comment = entry.comment ? " " + entry.comment : "";
      lines.push(`[${entry.key}]${comment}`);
    } else if (entry.type === "array-table") {
      if (lines.length > 0 && lines[lines.length - 1] !== "") {
        lines.push("");
      }
      const comment = entry.comment ? " " + entry.comment : "";
      lines.push(`[[${entry.key}]]${comment}`);
    }
  }

  flushKvGroup();

  // Clean up multiple consecutive blank lines
  const result: string[] = [];
  let lastBlank = false;
  for (const line of lines) {
    if (line === "") {
      if (!lastBlank) result.push(line);
      lastBlank = true;
    } else {
      result.push(line);
      lastBlank = false;
    }
  }

  // Trim leading/trailing blank lines
  while (result.length > 0 && result[0] === "") result.shift();
  while (result.length > 0 && result[result.length - 1] === "") result.pop();

  return result.join("\n");
};

const formatValue = (value: string, indent: string): string => {
  const trimmed = value.trim();

  // Multiline strings — preserve as-is
  if (trimmed.startsWith('"""') || trimmed.startsWith("'''")) {
    return trimmed;
  }

  // Array — try to format nicely
  if (trimmed.startsWith("[")) {
    return formatArray(trimmed, indent);
  }

  // Inline table
  if (trimmed.startsWith("{")) {
    return formatInlineTable(trimmed);
  }

  return trimmed;
};

const formatArray = (value: string, indent: string): string => {
  // Remove outer brackets
  const inner = value.slice(1, value.lastIndexOf("]")).trim();
  if (inner === "") return "[]";

  // Parse array elements (respecting strings and nested structures)
  const elements = splitArrayElements(inner);

  // If short enough, keep inline
  const inlineStr = "[" + elements.map((e) => e.trim()).join(", ") + "]";
  if (inlineStr.length <= 80 && !inlineStr.includes("\n")) {
    return inlineStr;
  }

  // Multi-line
  const formatted = elements.map((e) => `${indent}${e.trim()},`);
  return "[\n" + formatted.join("\n") + "\n]";
};

const splitArrayElements = (inner: string): string[] => {
  const elements: string[] = [];
  let current = "";
  let depth = 0;
  let inStr = false;
  let strChar = "";

  for (let i = 0; i < inner.length; i++) {
    const ch = inner[i];
    if (inStr) {
      current += ch;
      if (ch === strChar && inner[i - 1] !== "\\") inStr = false;
      continue;
    }
    if (ch === '"' || ch === "'") { inStr = true; strChar = ch; current += ch; continue; }
    if (ch === "[" || ch === "{") { depth++; current += ch; continue; }
    if (ch === "]" || ch === "}") { depth--; current += ch; continue; }
    if (ch === "," && depth === 0) {
      if (current.trim()) elements.push(current.trim());
      current = "";
      continue;
    }
    // Skip comments in arrays
    if (ch === "#" && depth === 0) {
      while (i < inner.length && inner[i] !== "\n") i++;
      continue;
    }
    current += ch;
  }
  if (current.trim()) elements.push(current.trim());
  return elements;
};

const formatInlineTable = (value: string): string => {
  // Normalize whitespace inside inline table
  const inner = value.slice(1, value.lastIndexOf("}")).trim();
  if (inner === "") return "{}";

  const pairs = inner.split(",").map((p) => {
    const trimmed = p.trim();
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) return trimmed;
    const k = trimmed.slice(0, eqIdx).trim();
    const v = trimmed.slice(eqIdx + 1).trim();
    return `${k} = ${v}`;
  });

  return "{ " + pairs.join(", ") + " }";
};

const minifyToml = (input: string): string => {
  const entries = parseTomlEntries(input);
  const lines: string[] = [];

  for (const entry of entries) {
    if (entry.type === "blank" || entry.type === "comment") continue;
    if (entry.type === "table") {
      lines.push(`[${entry.key}]`);
    } else if (entry.type === "array-table") {
      lines.push(`[[${entry.key}]]`);
    } else if (entry.type === "kv") {
      const val = (entry.value || "").replace(/\n/g, " ").replace(/\s+/g, " ").trim();
      lines.push(`${entry.key}=${val}`);
    }
  }

  return lines.join("\n");
};

const sortTomlKeys = (input: string, indent: string, alignEquals: boolean): string => {
  const entries = parseTomlEntries(input);

  // Group entries by section
  interface Section {
    header: ParsedEntry | null;
    entries: ParsedEntry[];
  }

  const sections: Section[] = [];
  let currentSection: Section = { header: null, entries: [] };

  for (const entry of entries) {
    if (entry.type === "table" || entry.type === "array-table") {
      if (currentSection.header || currentSection.entries.length > 0) {
        sections.push(currentSection);
      }
      currentSection = { header: entry, entries: [] };
    } else if (entry.type === "kv") {
      currentSection.entries.push(entry);
    } else if (entry.type === "comment" && currentSection.entries.length === 0) {
      // Comments before any kv in the section — keep attached
      currentSection.entries.push(entry);
    }
  }
  if (currentSection.header || currentSection.entries.length > 0) {
    sections.push(currentSection);
  }

  // Sort KV entries within each section
  for (const section of sections) {
    const comments: ParsedEntry[] = [];
    const kvs: ParsedEntry[] = [];
    for (const e of section.entries) {
      if (e.type === "kv") kvs.push(e);
      else comments.push(e);
    }
    kvs.sort((a, b) => (a.key || "").localeCompare(b.key || ""));
    section.entries = [...comments, ...kvs];
  }

  // Sort table sections (keep root section first)
  const rootSection = sections.find((s) => s.header === null);
  const tableSections = sections.filter((s) => s.header !== null);
  tableSections.sort((a, b) => (a.header?.key || "").localeCompare(b.header?.key || ""));

  const sorted: ParsedEntry[] = [];
  if (rootSection) {
    sorted.push(...rootSection.entries);
  }
  for (const section of tableSections) {
    if (section.header) sorted.push(section.header);
    sorted.push(...section.entries);
  }

  // Re-serialize
  const rebuiltInput = sorted.map((e) => {
    if (e.type === "blank") return "";
    if (e.type === "comment") return e.raw || "";
    if (e.type === "table") return `[${e.key}]${e.comment ? " " + e.comment : ""}`;
    if (e.type === "array-table") return `[[${e.key}]]${e.comment ? " " + e.comment : ""}`;
    if (e.type === "kv") return `${e.key} = ${e.value}${e.comment ? " " + e.comment : ""}`;
    return "";
  }).join("\n");

  return formatToml(rebuiltInput, indent, alignEquals);
};

const validateToml = (input: string): string[] => {
  const errors: string[] = [];
  const lines = input.split("\n");
  const tables = new Set<string>();

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    const lineNum = i + 1;

    if (trimmed === "" || trimmed.startsWith("#")) continue;

    // Check table headers
    const tableMatch = trimmed.match(/^\[([^\[\]]+)\]\s*(#.*)?$/);
    if (tableMatch) {
      const tableName = tableMatch[1].trim();
      if (tables.has(tableName)) {
        errors.push(`Line ${lineNum}: Duplicate table [${tableName}]`);
      }
      tables.add(tableName);
      continue;
    }

    // Array tables are allowed to repeat
    const arrMatch = trimmed.match(/^\[\[(.+?)\]\]\s*(#.*)?$/);
    if (arrMatch) continue;

    // Check for malformed table headers
    if (trimmed.startsWith("[") && !trimmed.match(/^\[.+\]/)) {
      errors.push(`Line ${lineNum}: Malformed table header`);
      continue;
    }

    // Check key-value pairs
    const kvMatch = trimmed.match(/^([^\s=]+(?:\s*\.\s*[^\s=]+)*)\s*=\s*(.*)/);
    if (kvMatch) {
      const val = kvMatch[2].trim();
      // Basic string validation
      if (val.startsWith('"') && !val.startsWith('"""')) {
        if (!val.endsWith('"') || val.length < 2) {
          // Check if multiline
          if (!val.startsWith('"""')) {
            errors.push(`Line ${lineNum}: Unterminated string value`);
          }
        }
      }
      // Check for bare key validity
      const key = kvMatch[1].trim();
      const keyParts = key.split(".");
      for (const part of keyParts) {
        const bare = part.trim();
        if (bare && !bare.match(/^[A-Za-z0-9_-]+$/) && !bare.match(/^".*"$/) && !bare.match(/^'.*'$/)) {
          errors.push(`Line ${lineNum}: Key "${bare}" contains invalid characters (must be alphanumeric, dash, or underscore, or quoted)`);
        }
      }
      continue;
    }

    // If we get here, line is not recognized
    if (!trimmed.startsWith("[")) {
      errors.push(`Line ${lineNum}: Unrecognized syntax`);
    }
  }

  return errors;
};

// ── Examples ──

const EXAMPLE_CARGO = `# Cargo.toml — Rust package manifest
[package]
name = "my-app"
version = "0.1.0"
edition = "2021"
authors = ["Dev <dev@example.com>"]
description = "A sample Rust application"
license = "MIT"
readme = "README.md"

[dependencies]
serde = { version = "1.0", features = ["derive"] }
tokio = { version = "1", features = ["full"] }
axum = "0.7"
sqlx = { version = "0.7", features = ["runtime-tokio", "postgres"] }
tracing = "0.1"

[dev-dependencies]
criterion = "0.5"
mockall = "0.12"

[profile.release]
opt-level = 3
lto = true
strip = true`;

const EXAMPLE_PYPROJECT = `# pyproject.toml — Python project config
[build-system]
requires = ["setuptools>=68.0", "wheel"]
build-backend = "setuptools.build_meta"

[project]
name = "my-python-app"
version = "1.0.0"
description = "A Python application"
readme = "README.md"
license = {text = "MIT"}
requires-python = ">=3.10"
dependencies = [
    "fastapi>=0.100.0",
    "uvicorn>=0.23.0",
    "pydantic>=2.0",
    "sqlalchemy>=2.0",
    "httpx>=0.24.0",
]

[project.optional-dependencies]
dev = ["pytest>=7.0", "ruff>=0.1.0", "mypy>=1.5"]
docs = ["mkdocs>=1.5", "mkdocs-material>=9.0"]

[tool.ruff]
line-length = 88
target-version = "py310"

[tool.ruff.lint]
select = ["E", "F", "I", "N", "W"]

[tool.pytest.ini_options]
testpaths = ["tests"]
addopts = "-v --tb=short"`;

const EXAMPLE_CONFIG = `# Application config
title = "My App"
debug = false

[server]
host = "0.0.0.0"
port = 8080
workers = 4
max_connections = 1000

[database]
url = "postgres://localhost:5432/mydb"
pool_size = 10
timeout = 30

[logging]
level = "info"
format = "json"
file = "/var/log/app.log"

[[services]]
name = "auth"
url = "http://auth:3000"
timeout = 5

[[services]]
name = "email"
url = "http://email:3001"
timeout = 10`;

export default function TomlFormatterPage() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [indentStyle, setIndentStyle] = useState<IndentStyle>("2");
  const [alignEquals, setAlignEquals] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const getIndent = useCallback((): string => {
    if (indentStyle === "tab") return "\t";
    return " ".repeat(parseInt(indentStyle, 10));
  }, [indentStyle]);

  const handleFormat = useCallback(() => {
    if (!input.trim()) { setOutput(""); setError(""); setValidationErrors([]); return; }
    try {
      const formatted = formatToml(input, getIndent(), alignEquals);
      setOutput(formatted);
      setError("");
      setValidationErrors([]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to format TOML.");
    }
  }, [input, getIndent, alignEquals]);

  const handleMinify = useCallback(() => {
    if (!input.trim()) { setOutput(""); setError(""); setValidationErrors([]); return; }
    try {
      setOutput(minifyToml(input));
      setError("");
      setValidationErrors([]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to minify TOML.");
    }
  }, [input]);

  const handleSortKeys = useCallback(() => {
    if (!input.trim()) { setOutput(""); setError(""); setValidationErrors([]); return; }
    try {
      const sorted = sortTomlKeys(input, getIndent(), alignEquals);
      setOutput(sorted);
      setError("");
      setValidationErrors([]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to sort keys.");
    }
  }, [input, getIndent, alignEquals]);

  const handleValidate = useCallback(() => {
    if (!input.trim()) { setValidationErrors([]); return; }
    const errs = validateToml(input);
    setValidationErrors(errs);
    if (errs.length === 0) {
      setOutput("# ✓ No issues found — TOML looks valid!");
    }
  }, [input]);

  const handleCopy = useCallback(async () => {
    if (!output) return;
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [output]);

  const handleClear = useCallback(() => {
    setInput("");
    setOutput("");
    setError("");
    setValidationErrors([]);
  }, []);

  const inputLines = input ? input.split("\n").length : 0;
  const inputChars = input.length;
  const outputLines = output ? output.split("\n").length : 0;
  const outputChars = output.length;
  const savings = inputChars > 0 && outputChars > 0 && outputChars < inputChars
    ? Math.round((1 - outputChars / inputChars) * 100)
    : 0;

  return (
    <>
      <title>TOML Formatter & Validator - Free Online Tool | DevTools Hub</title>
      <meta
        name="description"
        content="Format, beautify, minify, sort, and validate TOML files online for free. Perfect for Cargo.toml, pyproject.toml, and config files — all in your browser."
      />
      <JsonLd
        data={[
          generateWebAppSchema({
            slug: "toml-formatter",
            name: "TOML Formatter & Validator",
            description: "Format, validate, and convert TOML to JSON with syntax highlighting",
            category: "developer",
          }),
          generateBreadcrumbSchema({
            slug: "toml-formatter",
            name: "TOML Formatter & Validator",
            description: "Format, validate, and convert TOML to JSON with syntax highlighting",
            category: "developer",
          }),
          generateFAQSchema([
            { question: "What is TOML?", answer: "TOML (Tom's Obvious Minimal Language) is a configuration file format designed to be easy to read and write. It's used by Rust's Cargo (Cargo.toml), Python's pyproject.toml, Hugo, and many other tools. It maps clearly to a hash table structure." },
            { question: "What's the difference between TOML and YAML?", answer: "TOML uses explicit section headers ([table]) and = for assignment, while YAML uses indentation. TOML doesn't have the 'Norway problem' (no implicit type coercion \u2014 booleans must be true/false). TOML is simpler but less flexible for deeply nested data. YAML supports anchors and aliases; TOML does not." },
            { question: "What does 'Align = signs' do?", answer: "When enabled, all key-value pairs within the same section are padded so their = signs line up vertically. This improves readability for tables with many keys of different lengths (common in Cargo.toml dependencies)." },
            { question: "Is my data safe?", answer: "Yes. All formatting, sorting, and validation happens entirely in your browser using JavaScript. No data is sent to any server. Your TOML files never leave your machine." },
          ]),
        ]}
      />

      <main className="min-h-screen bg-slate-900 text-white">
        <div className="max-w-6xl mx-auto px-4 py-12">
          <ToolBreadcrumb slug="toml-formatter" />

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
              TOML Formatter & Validator
            </h1>
            <p className="text-slate-400 max-w-2xl text-lg">
              Format, beautify, minify, sort, and validate TOML files. Perfect for Cargo.toml, pyproject.toml, Hugo config, and any TOML configuration file.
            </p>
          </div>

          {/* Options bar */}
          <div className="flex flex-wrap items-center gap-4 mb-4">
            <div className="flex items-center gap-2">
              <label className="text-xs text-slate-400">Indent:</label>
              <select
                value={indentStyle}
                onChange={(e) => setIndentStyle(e.target.value as IndentStyle)}
                className="bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="2">2 spaces</option>
                <option value="4">4 spaces</option>
                <option value="tab">Tab</option>
              </select>
            </div>
            <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={alignEquals}
                onChange={(e) => setAlignEquals(e.target.checked)}
                className="rounded border-slate-600 bg-slate-800 text-blue-600 focus:ring-blue-500"
              />
              Align = signs
            </label>
            <div className="flex gap-2 ml-auto">
              <button
                onClick={() => setInput(EXAMPLE_CARGO)}
                className="px-2.5 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 rounded text-slate-300 transition-colors"
              >
                Cargo.toml
              </button>
              <button
                onClick={() => setInput(EXAMPLE_PYPROJECT)}
                className="px-2.5 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 rounded text-slate-300 transition-colors"
              >
                pyproject.toml
              </button>
              <button
                onClick={() => setInput(EXAMPLE_CONFIG)}
                className="px-2.5 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 rounded text-slate-300 transition-colors"
              >
                App Config
              </button>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap gap-2 mb-4">
            <button
              onClick={handleFormat}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors text-sm"
            >
              Beautify
            </button>
            <button
              onClick={handleMinify}
              className="px-5 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors text-sm"
            >
              Minify
            </button>
            <button
              onClick={handleSortKeys}
              className="px-5 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors text-sm"
            >
              Sort Keys
            </button>
            <button
              onClick={handleValidate}
              className="px-5 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors text-sm"
            >
              Validate
            </button>
            <button
              onClick={handleCopy}
              disabled={!output}
              className="px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors text-sm disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {copied ? "Copied!" : "Copy Output"}
            </button>
            <button
              onClick={handleClear}
              className="px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors text-sm"
            >
              Clear
            </button>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 p-4 bg-red-900/40 border border-red-700 rounded-lg text-red-300 text-sm">
              {error}
            </div>
          )}

          {/* Validation errors */}
          {validationErrors.length > 0 && (
            <div className="mb-4 p-4 bg-yellow-900/30 border border-yellow-700/50 rounded-lg">
              <div className="text-sm font-medium text-yellow-400 mb-2">
                {validationErrors.length} issue{validationErrors.length !== 1 ? "s" : ""} found:
              </div>
              <ul className="space-y-1">
                {validationErrors.map((err, i) => (
                  <li key={i} className="text-sm text-yellow-300 font-mono">{err}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Panels */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
            {/* Input */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-slate-300">Input TOML</label>
                {inputChars > 0 && (
                  <span className="text-xs text-slate-500">{inputLines} lines · {inputChars} chars</span>
                )}
              </div>
              <textarea
                value={input}
                onChange={(e) => { setInput(e.target.value); setError(""); setValidationErrors([]); }}
                placeholder="Paste your TOML here..."
                className="w-full h-96 bg-slate-800 border border-slate-700 rounded-lg p-4 font-mono text-sm text-slate-200 placeholder-slate-500 resize-y focus:outline-none focus:ring-2 focus:ring-blue-500"
                spellCheck={false}
              />
            </div>

            {/* Output */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-slate-300">Output</label>
                {outputChars > 0 && (
                  <span className="text-xs text-slate-500">
                    {outputLines} lines · {outputChars} chars
                    {savings > 0 && <span className="text-green-400 ml-1">({savings}% smaller)</span>}
                  </span>
                )}
              </div>
              <textarea
                value={output}
                readOnly
                placeholder="Formatted output will appear here..."
                className="w-full h-96 bg-slate-800 border border-slate-700 rounded-lg p-4 font-mono text-sm text-green-300 placeholder-slate-500 resize-y focus:outline-none"
                spellCheck={false}
              />
            </div>
          </div>

          {/* TOML Syntax Reference */}
          <div className="bg-slate-800 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">TOML Syntax Reference</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left py-2 text-slate-400 font-medium">Construct</th>
                    <th className="text-left py-2 text-slate-400 font-medium">Syntax</th>
                    <th className="text-left py-2 text-slate-400 font-medium">Description</th>
                  </tr>
                </thead>
                <tbody className="text-slate-300">
                  {[
                    ["Key-Value", 'key = "value"', "Basic assignment with = sign"],
                    ["Table", "[table]", "Section header / object"],
                    ["Dotted Key", "server.port = 8080", "Nested key shorthand"],
                    ["Array of Tables", "[[items]]", "Repeated section creates array"],
                    ["String", '"hello"', "Basic string with escapes"],
                    ["Literal String", "'no\\escapes'", "Single-quoted, no escapes"],
                    ["Multiline String", '"""...."""', "Triple-quoted multiline"],
                    ["Integer", "port = 8080", "Decimal, hex (0x), octal (0o), binary (0b)"],
                    ["Float", "pi = 3.14159", "IEEE 754 float, inf, nan"],
                    ["Boolean", "enabled = true", "true or false (lowercase)"],
                    ["Date-Time", "2024-01-15T10:30:00Z", "RFC 3339 datetime"],
                    ["Array", "ports = [80, 443]", "Comma-separated list in brackets"],
                    ["Inline Table", '{k = "v"}', "Single-line table in braces"],
                    ["Comment", "# comment", "Hash to end of line"],
                  ].map((row) => (
                    <tr key={row[0]} className="border-b border-slate-700/50">
                      <td className="py-2 font-medium text-white whitespace-nowrap">{row[0]}</td>
                      <td className="py-2 font-mono text-blue-400 text-xs">{row[1]}</td>
                      <td className="py-2">{row[2]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <RelatedTools currentSlug="toml-formatter" />

          {/* FAQ */}
          <div className="bg-slate-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Frequently Asked Questions</h2>
            <div className="space-y-4">
              {[
                {
                  q: "What is TOML?",
                  a: "TOML (Tom's Obvious Minimal Language) is a configuration file format designed to be easy to read and write. It's used by Rust's Cargo (Cargo.toml), Python's pyproject.toml, Hugo, and many other tools. It maps clearly to a hash table structure."
                },
                {
                  q: "What's the difference between TOML and YAML?",
                  a: "TOML uses explicit section headers ([table]) and = for assignment, while YAML uses indentation. TOML doesn't have the 'Norway problem' (no implicit type coercion — booleans must be true/false). TOML is simpler but less flexible for deeply nested data. YAML supports anchors and aliases; TOML does not."
                },
                {
                  q: "What does 'Align = signs' do?",
                  a: "When enabled, all key-value pairs within the same section are padded so their = signs line up vertically. This improves readability for tables with many keys of different lengths (common in Cargo.toml dependencies)."
                },
                {
                  q: "Is my data safe?",
                  a: "Yes. All formatting, sorting, and validation happens entirely in your browser using JavaScript. No data is sent to any server. Your TOML files never leave your machine."
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
