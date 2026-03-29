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

// JSON to YAML converter — no external dependencies
const jsonToYaml = (value: unknown, indent: number = 0, inlineArray: boolean = false): string => {
  const pad = "  ".repeat(indent);

  if (value === null) return "null";
  if (value === undefined) return "null";
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "number") {
    if (Number.isNaN(value)) return ".nan";
    if (!Number.isFinite(value)) return value > 0 ? ".inf" : "-.inf";
    return String(value);
  }
  if (typeof value === "string") {
    // Check if string needs quoting
    if (
      value === "" ||
      value === "true" || value === "false" ||
      value === "null" || value === "~" ||
      value === "yes" || value === "no" ||
      value === "on" || value === "off" ||
      /^[\d.eE+-]+$/.test(value) ||
      /[:#{}[\],&*?|>!%@`'"]/.test(value) ||
      value.startsWith(" ") || value.endsWith(" ") ||
      value.includes("\n")
    ) {
      if (value.includes("\n")) {
        // Multiline — use literal block scalar
        const lines = value.split("\n");
        const blockPad = "  ".repeat(indent + 1);
        return "|\n" + lines.map((l) => blockPad + l).join("\n");
      }
      // Use double quotes and escape
      const escaped = value
        .replace(/\\/g, "\\\\")
        .replace(/"/g, '\\"')
        .replace(/\t/g, "\\t")
        .replace(/\r/g, "\\r");
      return `"${escaped}"`;
    }
    return value;
  }

  if (Array.isArray(value)) {
    if (value.length === 0) return "[]";
    const lines: string[] = [];
    for (let i = 0; i < value.length; i++) {
      const item = value[i];
      if (typeof item === "object" && item !== null && !Array.isArray(item)) {
        const keys = Object.keys(item);
        if (keys.length > 0) {
          const firstKey = keys[0];
          const firstVal = jsonToYaml((item as Record<string, unknown>)[firstKey], indent + 1);
          lines.push(`${pad}- ${firstKey}: ${firstVal}`);
          for (let k = 1; k < keys.length; k++) {
            const key = keys[k];
            const val = jsonToYaml((item as Record<string, unknown>)[key], indent + 1);
            if (typeof (item as Record<string, unknown>)[key] === "object" && (item as Record<string, unknown>)[key] !== null) {
              lines.push(`${pad}  ${key}:\n${val}`);
            } else {
              lines.push(`${pad}  ${key}: ${val}`);
            }
          }
        } else {
          lines.push(`${pad}- {}`);
        }
      } else {
        lines.push(`${pad}- ${jsonToYaml(item, indent + 1)}`);
      }
    }
    return lines.join("\n");
  }

  if (typeof value === "object") {
    const obj = value as Record<string, unknown>;
    const keys = Object.keys(obj);
    if (keys.length === 0) return "{}";
    const lines: string[] = [];
    for (const key of keys) {
      const yamlKey = /[:#{}[\],&*?|>!%@`'".\s]/.test(key) || key === "" ? `"${key}"` : key;
      const val = obj[key];
      if (typeof val === "object" && val !== null) {
        if (Array.isArray(val) && val.length === 0) {
          lines.push(`${pad}${yamlKey}: []`);
        } else if (!Array.isArray(val) && Object.keys(val).length === 0) {
          lines.push(`${pad}${yamlKey}: {}`);
        } else {
          lines.push(`${pad}${yamlKey}:\n${jsonToYaml(val, indent + 1)}`);
        }
      } else {
        lines.push(`${pad}${yamlKey}: ${jsonToYaml(val, indent + 1)}`);
      }
    }
    return lines.join("\n");
  }

  return String(value);
};

// YAML to JSON parser — handles common YAML constructs
const yamlToJson = (yaml: string): unknown => {
  const lines = yaml.split("\n");
  let pos = 0;

  const peekIndent = (fromPos: number): number => {
    while (fromPos < lines.length && (lines[fromPos].trim() === "" || lines[fromPos].trim().startsWith("#"))) {
      fromPos++;
    }
    if (fromPos >= lines.length) return -1;
    const match = lines[fromPos].match(/^(\s*)/);
    return match ? match[1].length : 0;
  };

  const parseValue = (raw: string): unknown => {
    const trimmed = raw.trim();
    if (trimmed === "" || trimmed === "null" || trimmed === "~") return null;
    if (trimmed === "true" || trimmed === "yes" || trimmed === "on") return true;
    if (trimmed === "false" || trimmed === "no" || trimmed === "off") return false;
    if (trimmed === ".nan") return NaN;
    if (trimmed === ".inf") return Infinity;
    if (trimmed === "-.inf") return -Infinity;
    if (trimmed === "[]") return [];
    if (trimmed === "{}") return {};

    // Quoted string
    if ((trimmed.startsWith('"') && trimmed.endsWith('"')) ||
        (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
      return trimmed.slice(1, -1)
        .replace(/\\"/g, '"')
        .replace(/\\'/g, "'")
        .replace(/\\\\/g, "\\")
        .replace(/\\n/g, "\n")
        .replace(/\\t/g, "\t");
    }

    // Number
    if (/^-?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?$/.test(trimmed)) {
      const num = Number(trimmed);
      if (!Number.isNaN(num)) return num;
    }

    // Inline array [a, b, c]
    if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
      try {
        return JSON.parse(trimmed);
      } catch {
        return trimmed;
      }
    }

    // Inline object {a: b}
    if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
      try {
        return JSON.parse(trimmed);
      } catch {
        return trimmed;
      }
    }

    // Strip inline comment
    const commentMatch = trimmed.match(/^(.+?)\s+#\s/);
    if (commentMatch) return parseValue(commentMatch[1]);

    return trimmed;
  };

  const parseBlock = (baseIndent: number): unknown => {
    // Skip blank/comment lines
    while (pos < lines.length && (lines[pos].trim() === "" || lines[pos].trim().startsWith("#"))) {
      pos++;
    }
    if (pos >= lines.length) return null;

    const line = lines[pos];
    const stripped = line.trim();

    // Detect list
    if (stripped.startsWith("- ") || stripped === "-") {
      const arr: unknown[] = [];
      while (pos < lines.length) {
        while (pos < lines.length && (lines[pos].trim() === "" || lines[pos].trim().startsWith("#"))) pos++;
        if (pos >= lines.length) break;
        const currentLine = lines[pos];
        const currentIndent = currentLine.match(/^(\s*)/)?.[1].length ?? 0;
        if (currentIndent < baseIndent) break;
        if (currentIndent > baseIndent) break;
        const currentStripped = currentLine.trim();
        if (!currentStripped.startsWith("- ") && currentStripped !== "-") break;

        const afterDash = currentStripped === "-" ? "" : currentStripped.slice(2);
        pos++;

        // Check if it's a key: value after dash
        const kvMatch = afterDash.match(/^([^:]+?):\s*(.*)/);
        if (kvMatch && !afterDash.startsWith('"') && !afterDash.startsWith("'")) {
          // It's an object inside the list
          const obj: Record<string, unknown> = {};
          const key = kvMatch[1].replace(/^["']|["']$/g, "");
          const valStr = kvMatch[2].trim();

          if (valStr === "" || valStr === "|" || valStr === ">") {
            // Block scalar or nested
            const nextIndent = peekIndent(pos);
            if (nextIndent > baseIndent) {
              obj[key] = valStr === "|" || valStr === ">" ? collectBlockScalar(nextIndent) : parseBlock(nextIndent);
            } else {
              obj[key] = null;
            }
          } else {
            obj[key] = parseValue(valStr);
          }

          // Check for more keys at indent + 2
          const objIndent = baseIndent + 2;
          while (pos < lines.length) {
            while (pos < lines.length && lines[pos].trim() === "") pos++;
            if (pos >= lines.length) break;
            const nextLine = lines[pos];
            const nextLineIndent = nextLine.match(/^(\s*)/)?.[1].length ?? 0;
            if (nextLineIndent !== objIndent) break;
            const nextStripped = nextLine.trim();
            if (nextStripped.startsWith("- ")) break;
            const nextKv = nextStripped.match(/^([^:]+?):\s*(.*)/);
            if (!nextKv) break;
            const nextKey = nextKv[1].replace(/^["']|["']$/g, "");
            const nextVal = nextKv[2].trim();
            pos++;
            if (nextVal === "" || nextVal === "|" || nextVal === ">") {
              const ni = peekIndent(pos);
              if (ni > objIndent) {
                obj[nextKey] = nextVal === "|" || nextVal === ">" ? collectBlockScalar(ni) : parseBlock(ni);
              } else {
                obj[nextKey] = null;
              }
            } else {
              obj[nextKey] = parseValue(nextVal);
            }
          }
          arr.push(obj);
        } else if (afterDash === "" || afterDash === "|" || afterDash === ">") {
          const nextIndent = peekIndent(pos);
          if (nextIndent > baseIndent) {
            arr.push(afterDash === "|" || afterDash === ">" ? collectBlockScalar(nextIndent) : parseBlock(nextIndent));
          } else {
            arr.push(null);
          }
        } else {
          arr.push(parseValue(afterDash));
        }
      }
      return arr;
    }

    // Detect mapping
    const kvMatch = stripped.match(/^([^:]+?):\s*(.*)/);
    if (kvMatch) {
      const obj: Record<string, unknown> = {};
      while (pos < lines.length) {
        while (pos < lines.length && (lines[pos].trim() === "" || lines[pos].trim().startsWith("#"))) pos++;
        if (pos >= lines.length) break;
        const currentLine = lines[pos];
        const currentIndent = currentLine.match(/^(\s*)/)?.[1].length ?? 0;
        if (currentIndent < baseIndent) break;
        if (currentIndent > baseIndent) break;
        const currentStripped = currentLine.trim();
        const currentKv = currentStripped.match(/^([^:]+?):\s*(.*)/);
        if (!currentKv) break;

        const key = currentKv[1].replace(/^["']|["']$/g, "");
        const valStr = currentKv[2].trim();
        pos++;

        if (valStr === "" || valStr === "|" || valStr === ">") {
          const nextIndent = peekIndent(pos);
          if (nextIndent > currentIndent) {
            obj[key] = valStr === "|" || valStr === ">" ? collectBlockScalar(nextIndent) : parseBlock(nextIndent);
          } else {
            obj[key] = valStr === "" ? null : "";
          }
        } else {
          obj[key] = parseValue(valStr);
        }
      }
      return obj;
    }

    // Single value
    pos++;
    return parseValue(stripped);
  };

  const collectBlockScalar = (scalarIndent: number): string => {
    const blockLines: string[] = [];
    while (pos < lines.length) {
      const line = lines[pos];
      if (line.trim() === "") {
        blockLines.push("");
        pos++;
        continue;
      }
      const lineIndent = line.match(/^(\s*)/)?.[1].length ?? 0;
      if (lineIndent < scalarIndent) break;
      blockLines.push(line.slice(scalarIndent));
      pos++;
    }
    // Trim trailing empty lines
    while (blockLines.length > 0 && blockLines[blockLines.length - 1] === "") {
      blockLines.pop();
    }
    return blockLines.join("\n");
  };

  // Skip document start markers
  while (pos < lines.length && (lines[pos].trim() === "---" || lines[pos].trim() === "" || lines[pos].trim().startsWith("#"))) {
    pos++;
  }

  return parseBlock(peekIndent(pos));
};

type Direction = "json-to-yaml" | "yaml-to-json";

const EXAMPLE_JSON = `{
  "name": "micro-tools",
  "version": "1.0.0",
  "description": "A collection of free online tools",
  "dependencies": {
    "next": "^14.0.0",
    "react": "^18.0.0",
    "tailwindcss": "^4.0.0"
  },
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start"
  },
  "keywords": ["tools", "developer", "free"],
  "private": true
}`;

const EXAMPLE_YAML = `name: micro-tools
version: "1.0.0"
description: A collection of free online tools
dependencies:
  next: "^14.0.0"
  react: "^18.0.0"
  tailwindcss: "^4.0.0"
scripts:
  dev: next dev
  build: next build
  start: next start
keywords:
  - tools
  - developer
  - free
private: true`;

export default function JsonToYaml() {
  const [direction, setDirection] = useState<Direction>("json-to-yaml");
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const handleConvert = useCallback(() => {
    setError("");
    setOutput("");
    setCopied(false);

    if (!input.trim()) {
      setError("Please enter some input to convert.");
      return;
    }

    try {
      if (direction === "json-to-yaml") {
        const parsed = JSON.parse(input);
        const yaml = jsonToYaml(parsed);
        setOutput(yaml);
      } else {
        const parsed = yamlToJson(input);
        setOutput(JSON.stringify(parsed, null, 2));
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Conversion failed. Check your input syntax.");
    }
  }, [input, direction]);

  const handleCopy = useCallback(async () => {
    if (!output) return;
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* ignore */ }
  }, [output]);

  const handleLoadExample = useCallback(() => {
    if (direction === "json-to-yaml") {
      setInput(EXAMPLE_JSON);
    } else {
      setInput(EXAMPLE_YAML);
    }
    setOutput("");
    setError("");
  }, [direction]);

  const handleSwap = useCallback(() => {
    if (output) {
      setInput(output);
      setOutput("");
      setError("");
    }
    setDirection((d) => (d === "json-to-yaml" ? "yaml-to-json" : "json-to-yaml"));
  }, [output]);

  const handleClear = useCallback(() => {
    setInput("");
    setOutput("");
    setError("");
  }, []);

  return (
    <>
      <title>JSON to YAML Converter - Free Online Tool | DevTools Hub</title>
      <meta
        name="description"
        content="Convert JSON to YAML and YAML to JSON instantly. Free bidirectional converter with support for nested objects, arrays, and multiline strings."
      />
    <main className="min-h-screen bg-slate-900 text-white">
      <JsonLd
        data={[
          generateWebAppSchema({
            slug: "json-to-yaml",
            name: "JSON to YAML Converter",
            description: "Convert JSON data to YAML format instantly",
            category: "json",
          }),
          generateBreadcrumbSchema({
            slug: "json-to-yaml",
            name: "JSON to YAML Converter",
            description: "Convert JSON data to YAML format instantly",
            category: "json",
          }),
          generateFAQSchema([
            { question: "What is YAML?", answer: "YAML (YAML Ain't Markup Language) is a human-readable data serialization format. It uses indentation instead of brackets, making it popular for configuration files in Kubernetes, Docker Compose, GitHub Actions, and other DevOps tools." },
            { question: "Can I convert YAML back to JSON?", answer: "Yes! This tool is bidirectional. Click the 'YAML -> JSON' tab to convert YAML to JSON. You can also use the swap button to move your output back to the input and reverse the direction." },
            { question: "Does this handle nested objects and arrays?", answer: "Yes. The converter handles deeply nested objects, arrays of objects, mixed types, multiline strings, and other complex structures. Nested objects become indented YAML mappings, and arrays become dash-prefixed lists." },
            { question: "Is YAML a superset of JSON?", answer: "Yes -- valid JSON is also valid YAML. This means you can use JSON syntax within YAML files. However, YAML adds features like comments, anchors, and multiline strings that JSON doesn't support." },
            { question: "Why would I convert JSON to YAML?", answer: "Common reasons: creating Kubernetes manifests from JSON API responses, converting package.json to a more readable format, migrating configuration files to YAML for better readability and comment support." },
          ]),
        ]}
      />
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-8">
          <a href="/" className="text-blue-400 hover:text-blue-300 text-sm mb-4 inline-block">
            ← Back to all tools
          </a>
          <h1 className="text-3xl font-bold mb-2">JSON to YAML Converter</h1>
          <p className="text-slate-400">
            Convert between JSON and YAML formats instantly. Bidirectional — works both ways.
          </p>
        </div>

        {/* Direction Toggle */}
        <div className="bg-slate-800 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => { setDirection("json-to-yaml"); setOutput(""); setError(""); }}
              className={`flex-1 py-2 px-4 rounded font-medium text-sm transition-colors ${
                direction === "json-to-yaml"
                  ? "bg-blue-600 text-white"
                  : "bg-slate-700 text-slate-300 hover:bg-slate-600"
              }`}
            >
              JSON → YAML
            </button>
            <button
              onClick={handleSwap}
              className="p-2 bg-slate-700 hover:bg-slate-600 rounded transition-colors"
              title="Swap direction and move output to input"
            >
              ⇄
            </button>
            <button
              onClick={() => { setDirection("yaml-to-json"); setOutput(""); setError(""); }}
              className={`flex-1 py-2 px-4 rounded font-medium text-sm transition-colors ${
                direction === "yaml-to-json"
                  ? "bg-blue-600 text-white"
                  : "bg-slate-700 text-slate-300 hover:bg-slate-600"
              }`}
            >
              YAML → JSON
            </button>
          </div>
        </div>

        {/* Input */}
        <div className="bg-slate-800 rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-slate-300">
              {direction === "json-to-yaml" ? "JSON Input" : "YAML Input"}
            </label>
            <div className="flex gap-2">
              <button
                onClick={handleLoadExample}
                className="px-3 py-1 text-xs bg-slate-700 hover:bg-slate-600 rounded text-slate-300 transition-colors"
              >
                Load Example
              </button>
              <button
                onClick={handleClear}
                className="px-3 py-1 text-xs bg-slate-700 hover:bg-slate-600 rounded text-slate-300 transition-colors"
              >
                Clear
              </button>
            </div>
          </div>
          <textarea
            value={input}
            onChange={(e) => { setInput(e.target.value); setError(""); }}
            placeholder={direction === "json-to-yaml" ? '{"key": "value"}' : "key: value"}
            className="w-full h-64 bg-slate-900 border border-slate-700 rounded p-3 text-sm font-mono text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
            spellCheck={false}
          />

          {/* Convert Button */}
          <button
            onClick={handleConvert}
            className="w-full mt-3 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded transition-colors"
          >
            Convert to {direction === "json-to-yaml" ? "YAML" : "JSON"}
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-900/50 border border-red-700 rounded-lg p-4 mb-6 text-red-300 text-sm">
            {error}
          </div>
        )}

        {/* Output */}
        {output && (
          <div className="bg-slate-800 rounded-lg p-6 mb-6">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-slate-300">
                {direction === "json-to-yaml" ? "YAML Output" : "JSON Output"}
              </label>
              <button
                onClick={handleCopy}
                className="px-3 py-1 text-xs bg-blue-600 hover:bg-blue-700 rounded text-white transition-colors"
              >
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
            <pre className="w-full bg-slate-900 border border-slate-700 rounded p-3 text-sm font-mono text-slate-200 overflow-x-auto max-h-96 overflow-y-auto whitespace-pre">
              {output}
            </pre>
          </div>
        )}

        {/* Comparison Table */}
        <div className="bg-slate-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">JSON vs YAML Comparison</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left py-2 text-slate-400 font-medium">Feature</th>
                  <th className="text-left py-2 text-slate-400 font-medium">JSON</th>
                  <th className="text-left py-2 text-slate-400 font-medium">YAML</th>
                </tr>
              </thead>
              <tbody className="text-slate-300">
                {[
                  ["Syntax", "Braces and brackets", "Indentation-based"],
                  ["Readability", "Moderate — verbose", "High — clean and minimal"],
                  ["Comments", "Not supported", "Supported (#)"],
                  ["Data types", "string, number, bool, null, array, object", "Same + dates, timestamps"],
                  ["Common use", "APIs, configs, data exchange", "K8s, Docker, CI/CD configs"],
                  ["File size", "Larger (brackets + quotes)", "Smaller (no brackets)"],
                  ["Parsing speed", "Fast (strict grammar)", "Slower (complex grammar)"],
                  ["Superset", "—", "YAML is a superset of JSON"],
                ].map((row) => (
                  <tr key={row[0]} className="border-b border-slate-700/50">
                    <td className="py-2 font-medium text-white">{row[0]}</td>
                    <td className="py-2">{row[1]}</td>
                    <td className="py-2">{row[2]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <RelatedTools currentSlug="json-to-yaml" />

        {/* FAQ */}
        <div className="bg-slate-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {[
              {
                q: "What is YAML?",
                a: "YAML (YAML Ain't Markup Language) is a human-readable data serialization format. It uses indentation instead of brackets, making it popular for configuration files in Kubernetes, Docker Compose, GitHub Actions, and other DevOps tools."
              },
              {
                q: "Can I convert YAML back to JSON?",
                a: "Yes! This tool is bidirectional. Click the 'YAML → JSON' tab to convert YAML to JSON. You can also use the swap button (⇄) to move your output back to the input and reverse the direction."
              },
              {
                q: "Does this handle nested objects and arrays?",
                a: "Yes. The converter handles deeply nested objects, arrays of objects, mixed types, multiline strings, and other complex structures. Nested objects become indented YAML mappings, and arrays become dash-prefixed lists."
              },
              {
                q: "Is YAML a superset of JSON?",
                a: "Yes — valid JSON is also valid YAML. This means you can use JSON syntax within YAML files. However, YAML adds features like comments, anchors, and multiline strings that JSON doesn't support."
              },
              {
                q: "Why would I convert JSON to YAML?",
                a: "Common reasons: creating Kubernetes manifests from JSON API responses, converting package.json to a more readable format, migrating configuration files to YAML for better readability and comment support."
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
