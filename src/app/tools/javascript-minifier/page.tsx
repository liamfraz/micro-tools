"use client";

import { useState, useCallback } from "react";

function minifyJS(code: string): { output: string; error: string | null } {
  try {
    let result = "";
    let i = 0;
    let lastChar = "";
    let inSingleQuote = false;
    let inDoubleQuote = false;
    let inTemplate = false;
    let inRegex = false;
    let templateDepth = 0;

    while (i < code.length) {
      const ch = code[i];
      const next = i + 1 < code.length ? code[i + 1] : "";

      // Handle string literals
      if (inSingleQuote) {
        result += ch;
        if (ch === "\\" && i + 1 < code.length) {
          result += code[i + 1];
          i += 2;
          continue;
        }
        if (ch === "'") inSingleQuote = false;
        i++;
        continue;
      }

      if (inDoubleQuote) {
        result += ch;
        if (ch === "\\" && i + 1 < code.length) {
          result += code[i + 1];
          i += 2;
          continue;
        }
        if (ch === '"') inDoubleQuote = false;
        i++;
        continue;
      }

      if (inTemplate) {
        result += ch;
        if (ch === "\\" && i + 1 < code.length) {
          result += code[i + 1];
          i += 2;
          continue;
        }
        if (ch === "$" && next === "{") {
          templateDepth++;
          result += next;
          i += 2;
          continue;
        }
        if (ch === "}" && templateDepth > 0) {
          templateDepth--;
        }
        if (ch === "`" && templateDepth === 0) inTemplate = false;
        i++;
        continue;
      }

      if (inRegex) {
        result += ch;
        if (ch === "\\" && i + 1 < code.length) {
          result += code[i + 1];
          i += 2;
          continue;
        }
        if (ch === "/") {
          inRegex = false;
          // Consume flags
          i++;
          while (i < code.length && /[gimsuy]/.test(code[i])) {
            result += code[i];
            i++;
          }
          continue;
        }
        i++;
        continue;
      }

      // Single-line comment
      if (ch === "/" && next === "/") {
        i += 2;
        while (i < code.length && code[i] !== "\n") i++;
        continue;
      }

      // Multi-line comment
      if (ch === "/" && next === "*") {
        i += 2;
        while (i < code.length && !(code[i] === "*" && i + 1 < code.length && code[i + 1] === "/")) i++;
        i += 2; // skip */
        continue;
      }

      // Start of string/template
      if (ch === "'") { inSingleQuote = true; result += ch; lastChar = ch; i++; continue; }
      if (ch === '"') { inDoubleQuote = true; result += ch; lastChar = ch; i++; continue; }
      if (ch === "`") { inTemplate = true; templateDepth = 0; result += ch; lastChar = ch; i++; continue; }

      // Regex detection - after operator or keyword boundary
      if (ch === "/") {
        const trimmed = result.trimEnd();
        const prevSignificant = trimmed.length > 0 ? trimmed[trimmed.length - 1] : "";
        if ("=(:,;[!&|?{+->~^%".includes(prevSignificant) || trimmed === "" ||
            trimmed.endsWith("return") || trimmed.endsWith("typeof") || trimmed.endsWith("void") ||
            trimmed.endsWith("delete") || trimmed.endsWith("throw") || trimmed.endsWith("case") ||
            trimmed.endsWith("in") || trimmed.endsWith("of")) {
          inRegex = true;
          result += ch;
          lastChar = ch;
          i++;
          continue;
        }
      }

      // Whitespace handling
      if (/\s/.test(ch)) {
        i++;
        // Skip all consecutive whitespace
        while (i < code.length && /\s/.test(code[i])) i++;

        // Only emit a space if needed between two identifier-like chars
        if (result.length > 0 && i < code.length) {
          const prev = result[result.length - 1];
          const nxt = code[i];
          if (needsSpace(prev, nxt)) {
            result += " ";
          }
        }
        continue;
      }

      result += ch;
      lastChar = ch;
      i++;
    }

    return { output: result.trim(), error: null };
  } catch (e) {
    return { output: "", error: e instanceof Error ? e.message : "Minification error" };
  }
}

function needsSpace(prev: string, next: string): boolean {
  const isIdChar = (c: string) => /[a-zA-Z0-9_$]/.test(c);
  // Space needed between two identifier characters
  if (isIdChar(prev) && isIdChar(next)) return true;
  // Space after keywords before certain chars
  if (isIdChar(prev) && (next === "{" || next === "(")) {
    // Check if prev ends a keyword — but we just have the last char
    // This is handled by the identifier check above for most cases
    return false;
  }
  // No space needed between operators and anything else
  return false;
}

function beautifyJS(code: string, indentSize: number): { output: string; error: string | null } {
  try {
    // First minify to normalize
    const { output: minified, error } = minifyJS(code);
    if (error) return { output: "", error };
    if (!minified) return { output: "", error: null };

    const indent = " ".repeat(indentSize);
    let result = "";
    let depth = 0;
    let i = 0;
    let inSingleQuote = false;
    let inDoubleQuote = false;
    let inTemplate = false;

    while (i < minified.length) {
      const ch = minified[i];
      const next = i + 1 < minified.length ? minified[i + 1] : "";

      // Pass through strings unchanged
      if (inSingleQuote) {
        result += ch;
        if (ch === "\\" && i + 1 < minified.length) { result += minified[++i]; i++; continue; }
        if (ch === "'") inSingleQuote = false;
        i++; continue;
      }
      if (inDoubleQuote) {
        result += ch;
        if (ch === "\\" && i + 1 < minified.length) { result += minified[++i]; i++; continue; }
        if (ch === '"') inDoubleQuote = false;
        i++; continue;
      }
      if (inTemplate) {
        result += ch;
        if (ch === "\\" && i + 1 < minified.length) { result += minified[++i]; i++; continue; }
        if (ch === "`") inTemplate = false;
        i++; continue;
      }

      if (ch === "'") { inSingleQuote = true; result += ch; i++; continue; }
      if (ch === '"') { inDoubleQuote = true; result += ch; i++; continue; }
      if (ch === "`") { inTemplate = true; result += ch; i++; continue; }

      if (ch === "{") {
        result += " {\n";
        depth++;
        result += indent.repeat(depth);
        i++; continue;
      }

      if (ch === "}") {
        depth = Math.max(0, depth - 1);
        // Remove trailing whitespace on current line
        result = result.trimEnd();
        result += "\n" + indent.repeat(depth) + "}";
        if (next && next !== ";" && next !== "," && next !== ")") {
          result += "\n" + indent.repeat(depth);
        }
        i++; continue;
      }

      if (ch === ";") {
        result += ";\n" + indent.repeat(depth);
        i++; continue;
      }

      result += ch;
      i++;
    }

    // Clean up
    result = result.split("\n").map((l) => l.trimEnd()).join("\n").replace(/\n{3,}/g, "\n\n").trim();

    return { output: result, error: null };
  } catch (e) {
    return { output: "", error: e instanceof Error ? e.message : "Beautify error" };
  }
}

const EXAMPLE_JS = `// Configuration
const config = {
  apiUrl: "https://api.example.com",
  timeout: 5000,
  retries: 3,
  headers: {
    "Content-Type": "application/json",
    "Accept": "application/json"
  }
};

/**
 * Fetches data from the API with retry logic
 * @param {string} endpoint - The API endpoint
 * @param {object} options - Request options
 * @returns {Promise<object>} The response data
 */
async function fetchData(endpoint, options = {}) {
  const url = config.apiUrl + endpoint;
  let lastError = null;

  for (let attempt = 0; attempt < config.retries; attempt++) {
    try {
      const response = await fetch(url, {
        ...options,
        headers: { ...config.headers, ...options.headers },
        signal: AbortSignal.timeout(config.timeout)
      });

      if (!response.ok) {
        throw new Error(\`HTTP \${response.status}: \${response.statusText}\`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      lastError = error;
      console.warn(\`Attempt \${attempt + 1} failed:\`, error.message);

      if (attempt < config.retries - 1) {
        // Exponential backoff
        const delay = Math.pow(2, attempt) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}

// Event handler with debounce
function debounce(fn, ms) {
  let timer = null;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), ms);
  };
}

// DOM utilities
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => Array.from(document.querySelectorAll(selector));

// Initialize app
document.addEventListener("DOMContentLoaded", () => {
  const searchInput = $("#search");
  const results = $("#results");

  const handleSearch = debounce(async (event) => {
    const query = event.target.value.trim();
    if (query.length < 2) {
      results.innerHTML = "";
      return;
    }

    try {
      const data = await fetchData(\`/search?q=\${encodeURIComponent(query)}\`);
      results.innerHTML = data.items
        .map(item => \`<div class="result">\${item.title}</div>\`)
        .join("");
    } catch (error) {
      results.innerHTML = '<div class="error">Search failed</div>';
    }
  }, 300);

  searchInput.addEventListener("input", handleSearch);
});`;

export default function JavaScriptMinifierPage() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [mode, setMode] = useState<"minify" | "beautify">("minify");
  const [indentSize, setIndentSize] = useState(2);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const process = useCallback(() => {
    if (!input.trim()) {
      setOutput("");
      setError(null);
      return;
    }

    if (mode === "minify") {
      const result = minifyJS(input);
      setOutput(result.output);
      setError(result.error);
    } else {
      const result = beautifyJS(input, indentSize);
      setOutput(result.output);
      setError(result.error);
    }
  }, [input, mode, indentSize]);

  const copyOutput = useCallback(async () => {
    if (!output) return;
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [output]);

  const inputSize = new TextEncoder().encode(input).length;
  const outputSize = new TextEncoder().encode(output).length;
  const savings = inputSize > 0 && outputSize > 0 && mode === "minify"
    ? Math.round((1 - outputSize / inputSize) * 100)
    : null;

  return (
    <>
      <title>JavaScript Minifier & Beautifier - Free Online Tool | DevTools Hub</title>
      <meta
        name="description"
        content="Minify and beautify JavaScript online for free. Remove comments, whitespace, and reduce JS file size. Handles strings, template literals, and regex safely."
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
                <a href="/tools" className="hover:text-white transition-colors">Developer Tools</a>
              </li>
              <li><span className="mx-1">/</span></li>
              <li className="text-slate-200">JavaScript Minifier</li>
            </ol>
          </nav>

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
              JavaScript Minifier & Beautifier
            </h1>
            <p className="text-slate-400 max-w-2xl text-lg">
              Minify JavaScript to reduce file size or beautify for readability.
              Removes comments and whitespace while safely preserving strings,
              template literals, and regular expressions. Everything runs in your browser.
            </p>
          </div>

          {/* Mode & Options */}
          <div className="flex flex-wrap items-center gap-4 mb-4">
            <div className="flex bg-slate-800 rounded-lg p-1 border border-slate-700">
              <button
                onClick={() => setMode("minify")}
                className={`px-4 py-1.5 rounded text-sm font-medium transition-colors ${
                  mode === "minify" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"
                }`}
              >
                Minify
              </button>
              <button
                onClick={() => setMode("beautify")}
                className={`px-4 py-1.5 rounded text-sm font-medium transition-colors ${
                  mode === "beautify" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"
                }`}
              >
                Beautify
              </button>
            </div>

            {mode === "beautify" && (
              <div className="flex items-center gap-2">
                <label className="text-sm text-slate-400">Indent:</label>
                <select
                  value={indentSize}
                  onChange={(e) => setIndentSize(Number(e.target.value))}
                  className="bg-slate-800 border border-slate-600 rounded px-2 py-1 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={2}>2 Spaces</option>
                  <option value={4}>4 Spaces</option>
                </select>
              </div>
            )}

            <button
              onClick={() => { setInput(EXAMPLE_JS); setOutput(""); setError(null); }}
              className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
            >
              Load example
            </button>
          </div>

          {/* Input / Output */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-slate-300">Input JavaScript</label>
                <span className="text-xs text-slate-500">
                  {inputSize.toLocaleString()} bytes | {input.split("\n").length} lines
                </span>
              </div>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Paste your JavaScript here..."
                className="w-full h-96 bg-slate-800 border border-slate-600 rounded-lg p-4 font-mono text-sm text-slate-200 placeholder-slate-500 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                spellCheck={false}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-slate-300">
                  {mode === "minify" ? "Minified JavaScript" : "Beautified JavaScript"}
                </label>
                <div className="flex items-center gap-3">
                  {savings !== null && savings > 0 && (
                    <span className="text-xs text-green-400 font-medium">
                      -{savings}% ({(inputSize - outputSize).toLocaleString()} bytes saved)
                    </span>
                  )}
                  <span className="text-xs text-slate-500">
                    {outputSize.toLocaleString()} bytes
                  </span>
                </div>
              </div>
              <textarea
                value={error ? `Error: ${error}` : output}
                readOnly
                className={`w-full h-96 bg-slate-800 border rounded-lg p-4 font-mono text-sm resize-none focus:outline-none ${
                  error ? "border-red-500 text-red-400" : "border-slate-600 text-slate-200"
                }`}
                spellCheck={false}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <button
              onClick={process}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              {mode === "minify" ? "Minify JS" : "Beautify JS"}
            </button>
            <button
              onClick={copyOutput}
              disabled={!output || !!error}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {copied ? "Copied!" : "Copy Output"}
            </button>
            <button
              onClick={() => { setInput(""); setOutput(""); setError(null); }}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors"
            >
              Clear
            </button>
          </div>

          {/* What Gets Processed */}
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 mb-6">
            <h2 className="text-lg font-semibold text-white mb-4">What Gets Processed</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { title: "Single-line Comments", desc: "// comments are completely removed" },
                { title: "Multi-line Comments", desc: "/* block comments */ are stripped" },
                { title: "Whitespace & Newlines", desc: "Collapsed to minimum needed for valid syntax" },
                { title: "String Literals", desc: "Single, double, and template strings preserved intact" },
                { title: "Template Literals", desc: "Backtick strings with ${} expressions preserved" },
                { title: "Regular Expressions", desc: "/regex/flags patterns detected and preserved" },
              ].map((item) => (
                <div key={item.title}>
                  <h3 className="text-sm font-medium text-white mb-1">{item.title}</h3>
                  <p className="text-xs text-slate-400">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Formatter Suite */}
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 mb-6">
            <h2 className="text-lg font-semibold text-white mb-4">Code Formatter Suite</h2>
            <p className="text-sm text-slate-400 mb-4">
              This tool is part of our complete code formatter suite:
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {[
                { name: "SQL Formatter", href: "/tools/sql-formatter" },
                { name: "HTML Beautifier", href: "/tools/html-beautifier" },
                { name: "XML Formatter", href: "/tools/xml-formatter" },
                { name: "CSS Minifier", href: "/tools/css-minifier" },
                { name: "JS Minifier", href: "/tools/javascript-minifier", active: true },
              ].map((tool) => (
                <a
                  key={tool.name}
                  href={tool.href}
                  className={`block px-3 py-2 rounded text-sm text-center transition-colors ${
                    tool.active
                      ? "bg-blue-600 text-white font-medium"
                      : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                  }`}
                >
                  {tool.name}
                </a>
              ))}
            </div>
          </div>

          {/* FAQ Section */}
          <section className="mt-16 border-t border-slate-700 pt-10">
            <h2 className="text-2xl font-bold text-white mb-6">
              Frequently Asked Questions
            </h2>

            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  What is JavaScript minification?
                </h3>
                <p className="text-slate-400">
                  JavaScript minification removes unnecessary characters like
                  comments, whitespace, and newlines without changing the code&apos;s
                  behavior. This reduces file size for faster downloads and
                  improved page load times. Typical savings are 30-60% depending
                  on how much commenting and formatting the original code has.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Does this rename variables (uglification)?
                </h3>
                <p className="text-slate-400">
                  No. This tool performs whitespace and comment removal only. It
                  does not rename variables, remove dead code, or perform tree
                  shaking. For production builds with variable mangling, use tools
                  like Terser, esbuild, or webpack&apos;s built-in minifier. This tool
                  is ideal for quick minification without a build pipeline.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Will minification break my code?
                </h3>
                <p className="text-slate-400">
                  The minifier carefully preserves string literals (single, double,
                  and template strings), regular expressions, and required
                  whitespace between identifiers and keywords. It should not alter
                  your code&apos;s behavior. However, always test minified code before
                  deploying to production.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Is my code safe?
                </h3>
                <p className="text-slate-400">
                  Yes. All minification and beautification happens entirely in your
                  browser. No JavaScript code is sent to any server. You can safely
                  process proprietary code, API keys embedded in config files, and
                  any other sensitive JavaScript.
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
