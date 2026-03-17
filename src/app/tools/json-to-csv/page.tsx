"use client";

import { useState, useCallback } from "react";
import JsonLd from "@/components/JsonLd";
import RelatedTools from "@/components/RelatedTools";
import {
  generateFAQSchema,
  generateWebAppSchema,
  generateBreadcrumbSchema,
} from "@/lib/jsonld";

type Delimiter = "," | "\t" | ";" | "|";

function flattenObject(obj: Record<string, unknown>, prefix = ""): Record<string, string> {
  const result: Record<string, string> = {};
  for (const key in obj) {
    if (!Object.prototype.hasOwnProperty.call(obj, key)) continue;
    const fullKey = prefix ? `${prefix}.${key}` : key;
    const value = obj[key];
    if (value !== null && typeof value === "object" && !Array.isArray(value)) {
      const nested = flattenObject(value as Record<string, unknown>, fullKey);
      for (const nk in nested) {
        result[nk] = nested[nk];
      }
    } else if (Array.isArray(value)) {
      result[fullKey] = JSON.stringify(value);
    } else if (value === null || value === undefined) {
      result[fullKey] = "";
    } else {
      result[fullKey] = String(value);
    }
  }
  return result;
}

function escapeCSVField(field: string, delimiter: string): string {
  if (
    field.includes(delimiter) ||
    field.includes('"') ||
    field.includes("\n") ||
    field.includes("\r")
  ) {
    return `"${field.replace(/"/g, '""')}"`;
  }
  return field;
}

function jsonToCSV(
  jsonStr: string,
  delimiter: Delimiter,
  includeHeaders: boolean,
  flattenNested: boolean
): { csv: string; rowCount: number; colCount: number; error: string | null } {
  try {
    const parsed = JSON.parse(jsonStr);

    let rows: Record<string, unknown>[];

    if (Array.isArray(parsed)) {
      if (parsed.length === 0) {
        return { csv: "", rowCount: 0, colCount: 0, error: "Array is empty" };
      }
      // Check if it's an array of primitives
      if (typeof parsed[0] !== "object" || parsed[0] === null) {
        const csv = parsed.map((v) => escapeCSVField(String(v ?? ""), delimiter)).join("\n");
        return { csv: includeHeaders ? `value\n${csv}` : csv, rowCount: parsed.length, colCount: 1, error: null };
      }
      rows = parsed as Record<string, unknown>[];
    } else if (typeof parsed === "object" && parsed !== null) {
      rows = [parsed as Record<string, unknown>];
    } else {
      return { csv: "", rowCount: 0, colCount: 0, error: "Input must be a JSON array or object" };
    }

    // Flatten if needed
    const flatRows = rows.map((row) =>
      flattenNested ? flattenObject(row as Record<string, unknown>) : row
    );

    // Collect all unique headers preserving insertion order
    const headerSet = new Set<string>();
    for (let i = 0; i < flatRows.length; i++) {
      const row = flatRows[i];
      const keys = Object.keys(row as Record<string, unknown>);
      for (let k = 0; k < keys.length; k++) {
        headerSet.add(keys[k]);
      }
    }
    const headers = Array.from(headerSet);

    // Build CSV
    const lines: string[] = [];

    if (includeHeaders) {
      lines.push(headers.map((h) => escapeCSVField(h, delimiter)).join(delimiter));
    }

    for (let i = 0; i < flatRows.length; i++) {
      const row = flatRows[i] as Record<string, unknown>;
      const fields = headers.map((h) => {
        const val = row[h];
        if (val === null || val === undefined) return "";
        if (typeof val === "object") return escapeCSVField(JSON.stringify(val), delimiter);
        return escapeCSVField(String(val), delimiter);
      });
      lines.push(fields.join(delimiter));
    }

    return {
      csv: lines.join("\n"),
      rowCount: flatRows.length,
      colCount: headers.length,
      error: null,
    };
  } catch (e) {
    return {
      csv: "",
      rowCount: 0,
      colCount: 0,
      error: e instanceof Error ? e.message : "Invalid JSON",
    };
  }
}

function csvToJSON(
  csvStr: string,
  delimiter: Delimiter
): { json: string; rowCount: number; error: string | null } {
  try {
    const lines = csvStr.split("\n").filter((l) => l.trim() !== "");
    if (lines.length < 2) {
      return { json: "[]", rowCount: 0, error: "Need at least a header row and one data row" };
    }

    // Parse CSV fields handling quoted values
    const parseCSVLine = (line: string, delim: string): string[] => {
      const fields: string[] = [];
      let current = "";
      let inQuotes = false;

      for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (inQuotes) {
          if (ch === '"') {
            if (i + 1 < line.length && line[i + 1] === '"') {
              current += '"';
              i++;
            } else {
              inQuotes = false;
            }
          } else {
            current += ch;
          }
        } else {
          if (ch === '"') {
            inQuotes = true;
          } else if (ch === delim) {
            fields.push(current);
            current = "";
          } else {
            current += ch;
          }
        }
      }
      fields.push(current);
      return fields;
    };

    const headers = parseCSVLine(lines[0], delimiter);
    const result: Record<string, string>[] = [];

    for (let i = 1; i < lines.length; i++) {
      const fields = parseCSVLine(lines[i], delimiter);
      const obj: Record<string, string> = {};
      for (let j = 0; j < headers.length; j++) {
        obj[headers[j]] = j < fields.length ? fields[j] : "";
      }
      result.push(obj);
    }

    return {
      json: JSON.stringify(result, null, 2),
      rowCount: result.length,
      error: null,
    };
  } catch (e) {
    return {
      json: "",
      rowCount: 0,
      error: e instanceof Error ? e.message : "Invalid CSV",
    };
  }
}

const EXAMPLE_JSON = `[
  { "name": "Alice", "age": 30, "email": "alice@example.com", "city": "London" },
  { "name": "Bob", "age": 25, "email": "bob@example.com", "city": "Paris" },
  { "name": "Charlie", "age": 35, "email": "charlie@example.com", "city": "Berlin" },
  { "name": "Diana", "age": 28, "email": "diana@example.com", "city": "Tokyo" }
]`;

const EXAMPLE_NESTED = `[
  { "name": "Alice", "address": { "city": "London", "country": "UK" }, "scores": [95, 87] },
  { "name": "Bob", "address": { "city": "Paris", "country": "France" }, "scores": [78, 92] }
]`;

export default function JsonToCsvPage() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [delimiter, setDelimiter] = useState<Delimiter>(",");
  const [includeHeaders, setIncludeHeaders] = useState(true);
  const [flattenNested, setFlattenNested] = useState(true);
  const [mode, setMode] = useState<"json-to-csv" | "csv-to-json">("json-to-csv");
  const [stats, setStats] = useState<{ rows: number; cols: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const convert = useCallback(() => {
    if (!input.trim()) {
      setOutput("");
      setStats(null);
      setError(null);
      return;
    }

    if (mode === "json-to-csv") {
      const result = jsonToCSV(input, delimiter, includeHeaders, flattenNested);
      setOutput(result.csv);
      setStats(result.error ? null : { rows: result.rowCount, cols: result.colCount });
      setError(result.error);
    } else {
      const result = csvToJSON(input, delimiter);
      setOutput(result.json);
      setStats(result.error ? null : { rows: result.rowCount, cols: 0 });
      setError(result.error);
    }
  }, [input, delimiter, includeHeaders, flattenNested, mode]);

  const copyOutput = useCallback(async () => {
    if (!output) return;
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [output]);

  const downloadFile = useCallback(() => {
    if (!output) return;
    const ext = mode === "json-to-csv" ? "csv" : "json";
    const mime = mode === "json-to-csv" ? "text/csv" : "application/json";
    const blob = new Blob([output], { type: `${mime};charset=utf-8` });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `converted.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  }, [output, mode]);

  const loadExample = useCallback((example: string) => {
    setInput(example);
    setMode("json-to-csv");
    setOutput("");
    setStats(null);
    setError(null);
  }, []);

  const swapMode = useCallback(() => {
    setMode((prev) => (prev === "json-to-csv" ? "csv-to-json" : "json-to-csv"));
    setInput(output);
    setOutput("");
    setStats(null);
    setError(null);
  }, [output]);

  const delimiterLabels: Record<Delimiter, string> = {
    ",": "Comma (,)",
    "\t": "Tab (\\t)",
    ";": "Semicolon (;)",
    "|": "Pipe (|)",
  };

  return (
    <>
      <title>JSON to CSV Converter - Free Online Tool | DevTools Hub</title>
      <meta
        name="description"
        content="Convert JSON to CSV and CSV to JSON online for free. Supports nested objects, custom delimiters, and bulk data. Download results as .csv or .json files."
      />
      <JsonLd
        data={[
          generateWebAppSchema({
            slug: "json-to-csv",
            name: "JSON to CSV Converter",
            description: "Convert JSON arrays to CSV format with customizable delimiters",
            category: "conversion",
          }),
          generateBreadcrumbSchema({
            slug: "json-to-csv",
            name: "JSON to CSV Converter",
            description: "Convert JSON arrays to CSV format with customizable delimiters",
            category: "conversion",
          }),
          generateFAQSchema([
            { question: "What JSON formats are supported?", answer: "The converter accepts JSON arrays of objects (the most common format for tabular data), single JSON objects (converted to a one-row CSV), and arrays of primitives (converted to a single-column CSV). Nested objects are automatically flattened using dot notation when the \"Flatten nested objects\" option is enabled." },
            { question: "How are nested objects handled?", answer: "When flattening is enabled, nested objects are expanded into dot-notation columns. For example, {\"address\": {\"city\": \"London\"}} becomes a column called address.city with the value \"London\". Arrays within values are preserved as JSON strings." },
            { question: "Can I convert CSV back to JSON?", answer: "Yes. Use the \"CSV \u2192 JSON\" mode to convert CSV data back to a JSON array of objects. The first row is used as headers (object keys), and each subsequent row becomes an object in the output array. Quoted fields with commas and escaped quotes are handled correctly." },
            { question: "Is there a size limit?", answer: "There is no hard limit, but very large files (10MB+) may cause your browser to slow down since all processing happens client-side. For best performance, keep input under 5MB. No data is sent to any server \u2014 everything runs entirely in your browser." },
          ]),
        ]}
      />

      <div className="min-h-screen bg-slate-900 text-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Breadcrumb */}
          <nav className="text-sm text-slate-400 mb-6" aria-label="Breadcrumb">
            <ol className="flex items-center gap-2">
              <li>
                <a href="/" className="hover:text-white transition-colors">Home</a>
              </li>
              <li><span className="mx-1">/</span></li>
              <li>
                <a href="/tools" className="hover:text-white transition-colors">Conversion Tools</a>
              </li>
              <li><span className="mx-1">/</span></li>
              <li className="text-slate-200">JSON to CSV Converter</li>
            </ol>
          </nav>

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
              JSON to CSV Converter
            </h1>
            <p className="text-slate-400 max-w-2xl text-lg">
              Convert JSON arrays to CSV and CSV back to JSON. Supports nested
              objects with automatic flattening, custom delimiters, and file
              downloads. Everything runs in your browser.
            </p>
          </div>

          {/* Mode Toggle */}
          <div className="flex items-center gap-3 mb-6">
            <div className="flex bg-slate-800 rounded-lg p-1 border border-slate-700">
              <button
                onClick={() => { setMode("json-to-csv"); setOutput(""); setStats(null); setError(null); }}
                className={`px-4 py-1.5 rounded text-sm font-medium transition-colors ${
                  mode === "json-to-csv"
                    ? "bg-blue-600 text-white"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                JSON → CSV
              </button>
              <button
                onClick={() => { setMode("csv-to-json"); setOutput(""); setStats(null); setError(null); }}
                className={`px-4 py-1.5 rounded text-sm font-medium transition-colors ${
                  mode === "csv-to-json"
                    ? "bg-blue-600 text-white"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                CSV → JSON
              </button>
            </div>

            {output && (
              <button
                onClick={swapMode}
                className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded text-sm font-medium transition-colors"
              >
                Swap ↔
              </button>
            )}
          </div>

          {/* Options */}
          <div className="flex flex-wrap items-center gap-4 mb-4">
            <div className="flex items-center gap-2">
              <label className="text-sm text-slate-400">Delimiter:</label>
              <select
                value={delimiter}
                onChange={(e) => setDelimiter(e.target.value as Delimiter)}
                className="bg-slate-800 border border-slate-600 rounded px-2 py-1 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {(Object.keys(delimiterLabels) as Delimiter[]).map((d) => (
                  <option key={d} value={d}>{delimiterLabels[d]}</option>
                ))}
              </select>
            </div>

            {mode === "json-to-csv" && (
              <>
                <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeHeaders}
                    onChange={(e) => setIncludeHeaders(e.target.checked)}
                    className="w-4 h-4 rounded bg-slate-700 border-slate-600 text-blue-500 focus:ring-blue-500"
                  />
                  Include headers
                </label>

                <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={flattenNested}
                    onChange={(e) => setFlattenNested(e.target.checked)}
                    className="w-4 h-4 rounded bg-slate-700 border-slate-600 text-blue-500 focus:ring-blue-500"
                  />
                  Flatten nested objects
                </label>
              </>
            )}
          </div>

          {/* Input / Output */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
            {/* Input */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-slate-300">
                  {mode === "json-to-csv" ? "JSON Input" : "CSV Input"}
                </label>
                <div className="flex items-center gap-2">
                  {mode === "json-to-csv" && (
                    <>
                      <button
                        onClick={() => loadExample(EXAMPLE_JSON)}
                        className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
                      >
                        Simple example
                      </button>
                      <button
                        onClick={() => loadExample(EXAMPLE_NESTED)}
                        className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
                      >
                        Nested example
                      </button>
                    </>
                  )}
                </div>
              </div>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={
                  mode === "json-to-csv"
                    ? 'Paste JSON array here...\n[\n  { "name": "Alice", "age": 30 }\n]'
                    : "Paste CSV here...\nname,age\nAlice,30"
                }
                className="w-full h-80 bg-slate-800 border border-slate-600 rounded-lg p-4 font-mono text-sm text-slate-200 placeholder-slate-500 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                spellCheck={false}
              />
            </div>

            {/* Output */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-slate-300">
                  {mode === "json-to-csv" ? "CSV Output" : "JSON Output"}
                </label>
                {stats && (
                  <span className="text-xs text-slate-500">
                    {stats.rows} rows{stats.cols > 0 ? ` × ${stats.cols} columns` : ""}
                  </span>
                )}
              </div>
              <textarea
                value={error ? `Error: ${error}` : output}
                readOnly
                className={`w-full h-80 bg-slate-800 border rounded-lg p-4 font-mono text-sm resize-none focus:outline-none ${
                  error
                    ? "border-red-500 text-red-400"
                    : "border-slate-600 text-slate-200"
                }`}
                spellCheck={false}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <button
              onClick={convert}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              Convert
            </button>
            <button
              onClick={copyOutput}
              disabled={!output || !!error}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {copied ? "Copied!" : "Copy Output"}
            </button>
            <button
              onClick={downloadFile}
              disabled={!output || !!error}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Download .{mode === "json-to-csv" ? "csv" : "json"}
            </button>
            <button
              onClick={() => { setInput(""); setOutput(""); setStats(null); setError(null); }}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors"
            >
              Clear
            </button>
          </div>

          {/* Feature Highlights */}
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 mb-6">
            <h2 className="text-lg font-semibold text-white mb-4">Features</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { title: "Nested Object Flattening", desc: 'Nested keys become dot-notation columns: address.city, address.country' },
                { title: "Bidirectional Conversion", desc: "Convert JSON → CSV or CSV → JSON with the mode toggle" },
                { title: "Custom Delimiters", desc: "Support for comma, tab, semicolon, and pipe delimiters" },
                { title: "Proper CSV Escaping", desc: "Handles commas, quotes, and newlines inside field values correctly" },
                { title: "File Download", desc: "Download converted output as .csv or .json files" },
                { title: "Array Handling", desc: "Arrays in values are preserved as JSON strings in CSV output" },
              ].map((feat) => (
                <div key={feat.title}>
                  <h3 className="text-sm font-medium text-white mb-1">{feat.title}</h3>
                  <p className="text-xs text-slate-400">{feat.desc}</p>
                </div>
              ))}
            </div>
          </div>

          <RelatedTools currentSlug="json-to-csv" />

          {/* FAQ Section */}
          <section className="mt-16 border-t border-slate-700 pt-10">
            <h2 className="text-2xl font-bold text-white mb-6">
              Frequently Asked Questions
            </h2>

            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  What JSON formats are supported?
                </h3>
                <p className="text-slate-400">
                  The converter accepts JSON arrays of objects (the most common
                  format for tabular data), single JSON objects (converted to a
                  one-row CSV), and arrays of primitives (converted to a
                  single-column CSV). Nested objects are automatically flattened
                  using dot notation when the &ldquo;Flatten nested objects&rdquo;
                  option is enabled.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  How are nested objects handled?
                </h3>
                <p className="text-slate-400">
                  When flattening is enabled, nested objects are expanded into
                  dot-notation columns. For example,{" "}
                  <code className="text-slate-300">
                    {`{"address": {"city": "London"}}`}
                  </code>{" "}
                  becomes a column called{" "}
                  <code className="text-slate-300">address.city</code> with the
                  value &ldquo;London&rdquo;. Arrays within values are preserved
                  as JSON strings.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Can I convert CSV back to JSON?
                </h3>
                <p className="text-slate-400">
                  Yes. Use the &ldquo;CSV → JSON&rdquo; mode to convert CSV data
                  back to a JSON array of objects. The first row is used as
                  headers (object keys), and each subsequent row becomes an object
                  in the output array. Quoted fields with commas and escaped
                  quotes are handled correctly.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Is there a size limit?
                </h3>
                <p className="text-slate-400">
                  There is no hard limit, but very large files (10MB+) may cause
                  your browser to slow down since all processing happens
                  client-side. For best performance, keep input under 5MB. No data
                  is sent to any server — everything runs entirely in your browser.
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
