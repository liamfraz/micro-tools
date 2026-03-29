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

type Delimiter = "," | "\t" | ";" | "|";
type OutputFormat = "array" | "object" | "nested";

// ── CSV parser (RFC 4180 compliant) ──

const parseCSV = (
  input: string,
  delimiter: string
): { headers: string[]; rows: string[][] } => {
  const result: string[][] = [];
  let i = 0;
  const len = input.length;

  const parseField = (): string => {
    if (i >= len) return "";

    // Quoted field
    if (input[i] === '"') {
      i++; // skip opening quote
      let field = "";
      while (i < len) {
        if (input[i] === '"') {
          if (i + 1 < len && input[i + 1] === '"') {
            // Escaped quote
            field += '"';
            i += 2;
          } else {
            // End of quoted field
            i++; // skip closing quote
            break;
          }
        } else {
          field += input[i];
          i++;
        }
      }
      return field;
    }

    // Unquoted field
    let field = "";
    while (i < len && input[i] !== delimiter && input[i] !== "\n" && input[i] !== "\r") {
      field += input[i];
      i++;
    }
    return field;
  };

  const parseRow = (): string[] => {
    const row: string[] = [];
    while (i < len) {
      const field = parseField();
      row.push(field);

      if (i >= len) break;
      if (input[i] === delimiter) {
        i++; // skip delimiter
        continue;
      }
      if (input[i] === "\r") {
        i++;
        if (i < len && input[i] === "\n") i++;
        break;
      }
      if (input[i] === "\n") {
        i++;
        break;
      }
      break;
    }
    return row;
  };

  while (i < len) {
    // Skip trailing whitespace-only lines
    if (input.slice(i).trim() === "") break;
    result.push(parseRow());
  }

  if (result.length === 0) return { headers: [], rows: [] };

  const headers = result[0];
  const rows = result.slice(1);
  return { headers, rows };
};

// ── Value type detection ──

const inferType = (value: string): string | number | boolean | null => {
  const trimmed = value.trim();
  if (trimmed === "") return "";
  if (trimmed === "null" || trimmed === "NULL") return null;
  if (trimmed === "true" || trimmed === "TRUE" || trimmed === "True") return true;
  if (trimmed === "false" || trimmed === "FALSE" || trimmed === "False") return false;

  // Integer
  if (/^-?\d+$/.test(trimmed)) {
    const n = parseInt(trimmed, 10);
    if (n >= Number.MIN_SAFE_INTEGER && n <= Number.MAX_SAFE_INTEGER) return n;
  }
  // Float
  if (/^-?\d+\.\d+$/.test(trimmed)) return parseFloat(trimmed);

  return value;
};

// ── Convert CSV to JSON ──

const csvToJson = (
  input: string,
  delimiter: Delimiter,
  format: OutputFormat,
  inferTypes: boolean,
  trimWhitespace: boolean,
  skipEmpty: boolean
): { json: string; rowCount: number; colCount: number; error: string | null } => {
  if (!input.trim()) {
    return { json: "", rowCount: 0, colCount: 0, error: "Input is empty" };
  }

  const { headers, rows } = parseCSV(input, delimiter);

  if (headers.length === 0) {
    return { json: "", rowCount: 0, colCount: 0, error: "No data found" };
  }

  const cleanHeaders = trimWhitespace ? headers.map((h) => h.trim()) : headers;

  // Filter empty rows if requested
  const filteredRows = skipEmpty
    ? rows.filter((row) => row.some((cell) => cell.trim() !== ""))
    : rows;

  if (format === "object") {
    // Output as object with first column as keys
    const obj: Record<string, string | number | boolean | null> = {};
    for (const row of filteredRows) {
      const key = trimWhitespace ? (row[0] || "").trim() : row[0] || "";
      const val = trimWhitespace ? (row[1] || "").trim() : row[1] || "";
      obj[key] = inferTypes ? inferType(val) : val;
    }
    return {
      json: JSON.stringify(obj, null, 2),
      rowCount: filteredRows.length,
      colCount: cleanHeaders.length,
      error: null,
    };
  }

  if (format === "nested") {
    // Unflatten dotted keys (e.g., "address.city" -> { address: { city: ... } })
    const result: Record<string, unknown>[] = [];
    for (const row of filteredRows) {
      const obj: Record<string, unknown> = {};
      for (let c = 0; c < cleanHeaders.length; c++) {
        const key = cleanHeaders[c];
        let val: unknown = trimWhitespace ? (row[c] || "").trim() : row[c] || "";
        if (inferTypes) val = inferType(val as string);

        const parts = key.split(".");
        if (parts.length > 1) {
          let current = obj;
          for (let p = 0; p < parts.length - 1; p++) {
            if (!(parts[p] in current) || typeof current[parts[p]] !== "object") {
              current[parts[p]] = {};
            }
            current = current[parts[p]] as Record<string, unknown>;
          }
          current[parts[parts.length - 1]] = val;
        } else {
          obj[key] = val;
        }
      }
      result.push(obj);
    }
    return {
      json: JSON.stringify(result, null, 2),
      rowCount: filteredRows.length,
      colCount: cleanHeaders.length,
      error: null,
    };
  }

  // Default: array of objects
  const result: Record<string, string | number | boolean | null>[] = [];
  for (const row of filteredRows) {
    const obj: Record<string, string | number | boolean | null> = {};
    for (let c = 0; c < cleanHeaders.length; c++) {
      const val = trimWhitespace ? (row[c] || "").trim() : row[c] || "";
      obj[cleanHeaders[c]] = inferTypes ? inferType(val) : val;
    }
    result.push(obj);
  }

  return {
    json: JSON.stringify(result, null, 2),
    rowCount: filteredRows.length,
    colCount: cleanHeaders.length,
    error: null,
  };
};

// ── Auto-detect delimiter ──

const detectDelimiter = (input: string): Delimiter => {
  const firstLine = input.split("\n")[0] || "";
  const counts: Record<string, number> = { ",": 0, "\t": 0, ";": 0, "|": 0 };
  let inQuote = false;
  for (const ch of firstLine) {
    if (ch === '"') { inQuote = !inQuote; continue; }
    if (inQuote) continue;
    if (ch in counts) counts[ch]++;
  }
  let best: Delimiter = ",";
  let bestCount = 0;
  for (const [d, c] of Object.entries(counts)) {
    if (c > bestCount) { bestCount = c; best = d as Delimiter; }
  }
  return best;
};

// ── Examples ──

const EXAMPLE_SIMPLE = `name,age,city,active
Alice,30,New York,true
Bob,25,San Francisco,false
Charlie,35,Chicago,true
Diana,28,Austin,true
Eve,32,Seattle,false`;

const EXAMPLE_QUOTED = `product,description,price,stock
"Widget A","A simple, basic widget",9.99,150
"Widget B","A ""premium"" widget",24.99,75
"Widget C","Multi-line
description here",14.99,200`;

const EXAMPLE_NESTED = `id,name,address.city,address.state,address.zip
1,Alice,New York,NY,10001
2,Bob,San Francisco,CA,94102
3,Charlie,Chicago,IL,60601`;

const EXAMPLE_TSV = `name\tscores\tdepartment\tsalary
Alice\t95\tEngineering\t120000
Bob\t87\tMarketing\t95000
Charlie\t92\tEngineering\t115000
Diana\t78\tDesign\t105000`;

export default function CsvToJsonPage() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [delimiter, setDelimiter] = useState<Delimiter>(",");
  const [format, setFormat] = useState<OutputFormat>("array");
  const [inferTypes, setInferTypes] = useState(true);
  const [trimWhitespace, setTrimWhitespace] = useState(true);
  const [skipEmpty, setSkipEmpty] = useState(true);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  const [stats, setStats] = useState({ rows: 0, cols: 0 });

  const handleConvert = useCallback(() => {
    if (!input.trim()) {
      setOutput("");
      setError("");
      setStats({ rows: 0, cols: 0 });
      return;
    }

    const result = csvToJson(input, delimiter, format, inferTypes, trimWhitespace, skipEmpty);
    if (result.error) {
      setError(result.error);
      setOutput("");
      setStats({ rows: 0, cols: 0 });
    } else {
      setError("");
      setOutput(result.json);
      setStats({ rows: result.rowCount, cols: result.colCount });
    }
  }, [input, delimiter, format, inferTypes, trimWhitespace, skipEmpty]);

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
    setStats({ rows: 0, cols: 0 });
  }, []);

  const loadExample = useCallback((csv: string, delim?: Delimiter) => {
    setInput(csv);
    if (delim) setDelimiter(delim);
    else setDelimiter(detectDelimiter(csv));
    setOutput("");
    setError("");
    setStats({ rows: 0, cols: 0 });
  }, []);

  const handleAutoDetect = useCallback(() => {
    if (input.trim()) {
      setDelimiter(detectDelimiter(input));
    }
  }, [input]);

  const handleDownload = useCallback(() => {
    if (!output) return;
    const blob = new Blob([output], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "data.json";
    a.click();
    URL.revokeObjectURL(url);
  }, [output]);

  return (
    <>
      <title>CSV to JSON Converter - Free Online Tool | DevTools Hub</title>
      <meta
        name="description"
        content="Convert CSV data to JSON online for free. Supports custom delimiters, quoted fields, auto type detection, nested key unflattening, and RFC 4180 parsing — all in your browser."
      />
      <JsonLd
        data={[
          generateWebAppSchema({
            slug: "csv-to-json",
            name: "CSV to JSON Converter",
            description: "Convert CSV data to JSON format with automatic header detection",
            category: "json",
          }),
          generateBreadcrumbSchema({
            slug: "csv-to-json",
            name: "CSV to JSON Converter",
            description: "Convert CSV data to JSON format with automatic header detection",
            category: "json",
          }),
          generateFAQSchema([
            { question: "How does CSV to JSON conversion work?", answer: "The first row of your CSV is treated as column headers, and each subsequent row becomes a JSON object with those headers as keys. The result is an array of objects. For example, a CSV with headers 'name,age' and row 'Alice,30' becomes [{\"name\": \"Alice\", \"age\": 30}]." },
            { question: "What is type inference?", answer: "When 'Detect types' is enabled, the converter automatically identifies numbers (30 \u2192 30), booleans ('true' \u2192 true, 'false' \u2192 false), and null values ('null' \u2192 null) instead of treating everything as strings. Disable this if you want all values to remain as strings." },
            { question: "What does 'Nested (unflatten dots)' do?", answer: "If your CSV headers contain dots (e.g., 'address.city', 'address.state'), the Nested format creates nested JSON objects: {\"address\": {\"city\": \"NY\", \"state\": \"NY\"}}. This is the reverse of the JSON-to-CSV flattening feature." },
            { question: "Is my data safe?", answer: "Yes. All CSV parsing and JSON conversion happens entirely in your browser using JavaScript. No data is sent to any server. Your CSV data never leaves your machine." },
          ]),
        ]}
      />

      <main className="min-h-screen bg-slate-900 text-white">
        <div className="max-w-6xl mx-auto px-4 py-12">
          <ToolBreadcrumb slug="csv-to-json" />

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
              CSV to JSON Converter
            </h1>
            <p className="text-slate-400 max-w-2xl text-lg">
              Convert CSV, TSV, and delimited data to JSON. Supports RFC 4180 quoted fields, automatic type detection, nested key unflattening, and multiple output formats.
            </p>
          </div>

          {/* Options bar */}
          <div className="flex flex-wrap items-center gap-4 mb-4">
            <div className="flex items-center gap-2">
              <label className="text-xs text-slate-400">Delimiter:</label>
              <select
                value={delimiter}
                onChange={(e) => setDelimiter(e.target.value as Delimiter)}
                className="bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value=",">Comma (,)</option>
                <option value={"\t"}>Tab (TSV)</option>
                <option value=";">Semicolon (;)</option>
                <option value="|">Pipe (|)</option>
              </select>
              <button
                onClick={handleAutoDetect}
                className="px-2 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 rounded text-slate-400 hover:text-white transition-colors"
                title="Auto-detect delimiter from input"
              >
                Auto
              </button>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs text-slate-400">Format:</label>
              <select
                value={format}
                onChange={(e) => setFormat(e.target.value as OutputFormat)}
                className="bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="array">Array of Objects</option>
                <option value="nested">Nested (unflatten dots)</option>
                <option value="object">Key-Value Object</option>
              </select>
            </div>
            <label className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={inferTypes}
                onChange={(e) => setInferTypes(e.target.checked)}
                className="rounded border-slate-600 bg-slate-800 text-blue-600 focus:ring-blue-500"
              />
              Detect types
            </label>
            <label className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={trimWhitespace}
                onChange={(e) => setTrimWhitespace(e.target.checked)}
                className="rounded border-slate-600 bg-slate-800 text-blue-600 focus:ring-blue-500"
              />
              Trim whitespace
            </label>
            <label className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={skipEmpty}
                onChange={(e) => setSkipEmpty(e.target.checked)}
                className="rounded border-slate-600 bg-slate-800 text-blue-600 focus:ring-blue-500"
              />
              Skip empty rows
            </label>
          </div>

          {/* Example buttons */}
          <div className="flex flex-wrap gap-2 mb-4">
            <button
              onClick={() => loadExample(EXAMPLE_SIMPLE)}
              className="px-2.5 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 rounded text-slate-300 transition-colors"
            >
              Simple CSV
            </button>
            <button
              onClick={() => loadExample(EXAMPLE_QUOTED)}
              className="px-2.5 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 rounded text-slate-300 transition-colors"
            >
              Quoted Fields
            </button>
            <button
              onClick={() => loadExample(EXAMPLE_NESTED)}
              className="px-2.5 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 rounded text-slate-300 transition-colors"
            >
              Nested Keys
            </button>
            <button
              onClick={() => loadExample(EXAMPLE_TSV, "\t")}
              className="px-2.5 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 rounded text-slate-300 transition-colors"
            >
              TSV Data
            </button>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap gap-2 mb-4">
            <button
              onClick={handleConvert}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors text-sm"
            >
              Convert to JSON
            </button>
            <button
              onClick={handleCopy}
              disabled={!output}
              className="px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors text-sm disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {copied ? "Copied!" : "Copy JSON"}
            </button>
            <button
              onClick={handleDownload}
              disabled={!output}
              className="px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors text-sm disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Download .json
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

          {/* Panels */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
            {/* CSV Input */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-slate-300">CSV Input</label>
                <span className="text-xs text-slate-500">{input.length} chars</span>
              </div>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={"name,age,city\nAlice,30,New York\nBob,25,San Francisco"}
                className="w-full h-80 bg-slate-800 border border-slate-700 rounded-lg p-4 font-mono text-sm text-slate-200 placeholder-slate-500 resize-y focus:outline-none focus:ring-2 focus:ring-blue-500"
                spellCheck={false}
              />
            </div>

            {/* JSON Output */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-slate-300">JSON Output</label>
                {stats.rows > 0 && (
                  <span className="text-xs text-green-400">
                    {stats.rows} row{stats.rows !== 1 ? "s" : ""} · {stats.cols} column{stats.cols !== 1 ? "s" : ""}
                  </span>
                )}
              </div>
              <textarea
                value={output}
                readOnly
                placeholder="JSON output will appear here..."
                className="w-full h-80 bg-slate-800 border border-slate-700 rounded-lg p-4 font-mono text-sm text-green-300 placeholder-slate-500 resize-y focus:outline-none"
                spellCheck={false}
              />
            </div>
          </div>

          {/* Features reference */}
          <div className="bg-slate-800 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Conversion Features</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left py-2 text-slate-400 font-medium">Feature</th>
                    <th className="text-left py-2 text-slate-400 font-medium">Description</th>
                  </tr>
                </thead>
                <tbody className="text-slate-300">
                  {[
                    ["RFC 4180 Parsing", "Handles quoted fields, escaped quotes (\"\"), and multiline values inside quotes"],
                    ["Auto Delimiter Detection", "Detects comma, tab, semicolon, or pipe delimiter automatically from the first row"],
                    ["Type Inference", "Converts numbers, booleans (true/false), and null values to their JSON types"],
                    ["Nested Key Unflattening", "Converts dotted headers (address.city) into nested JSON objects"],
                    ["Array of Objects", "Each CSV row becomes a JSON object with header keys (default format)"],
                    ["Key-Value Object", "First column becomes keys, second column becomes values"],
                    ["Trim Whitespace", "Strips leading/trailing spaces from headers and values"],
                    ["Skip Empty Rows", "Ignores rows where all fields are empty"],
                    ["TSV Support", "Tab-separated values work with the Tab delimiter option"],
                    ["File Download", "Download converted JSON as a .json file"],
                  ].map((row) => (
                    <tr key={row[0]} className="border-b border-slate-700/50">
                      <td className="py-2 font-medium text-white whitespace-nowrap">{row[0]}</td>
                      <td className="py-2">{row[1]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <RelatedTools currentSlug="csv-to-json" />

          {/* FAQ */}
          <div className="bg-slate-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Frequently Asked Questions</h2>
            <div className="space-y-4">
              {[
                {
                  q: "How does CSV to JSON conversion work?",
                  a: "The first row of your CSV is treated as column headers, and each subsequent row becomes a JSON object with those headers as keys. The result is an array of objects. For example, a CSV with headers 'name,age' and row 'Alice,30' becomes [{\"name\": \"Alice\", \"age\": 30}]."
                },
                {
                  q: "What is type inference?",
                  a: "When 'Detect types' is enabled, the converter automatically identifies numbers (30 → 30), booleans ('true' → true, 'false' → false), and null values ('null' → null) instead of treating everything as strings. Disable this if you want all values to remain as strings."
                },
                {
                  q: "What does 'Nested (unflatten dots)' do?",
                  a: "If your CSV headers contain dots (e.g., 'address.city', 'address.state'), the Nested format creates nested JSON objects: {\"address\": {\"city\": \"NY\", \"state\": \"NY\"}}. This is the reverse of the JSON-to-CSV flattening feature."
                },
                {
                  q: "Is my data safe?",
                  a: "Yes. All CSV parsing and JSON conversion happens entirely in your browser using JavaScript. No data is sent to any server. Your CSV data never leaves your machine."
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
