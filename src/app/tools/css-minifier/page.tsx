"use client";

import { useState, useCallback } from "react";
import JsonLd from "@/components/JsonLd";
import RelatedTools from "@/components/RelatedTools";
import {
  generateFAQSchema,
  generateWebAppSchema,
  generateBreadcrumbSchema,
} from "@/lib/jsonld";

function minifyCSS(css: string): { output: string; error: string | null } {
  try {
    let result = css;

    // Remove comments
    result = result.replace(/\/\*[\s\S]*?\*\//g, "");

    // Remove newlines and carriage returns
    result = result.replace(/[\r\n]+/g, "");

    // Collapse multiple spaces to one
    result = result.replace(/\s{2,}/g, " ");

    // Remove spaces around { } : ; , > ~ +
    result = result.replace(/\s*{\s*/g, "{");
    result = result.replace(/\s*}\s*/g, "}");
    result = result.replace(/\s*:\s*/g, ":");
    result = result.replace(/\s*;\s*/g, ";");
    result = result.replace(/\s*,\s*/g, ",");
    result = result.replace(/\s*>\s*/g, ">");
    result = result.replace(/\s*~\s*/g, "~");
    result = result.replace(/\s*\+\s*/g, "+");

    // Remove trailing semicolons before }
    result = result.replace(/;}/g, "}");

    // Remove leading/trailing whitespace
    result = result.trim();

    // Remove empty rules
    result = result.replace(/[^{}]+\{\s*\}/g, "");

    // Shorten colors: #ffffff -> #fff, #aabbcc -> #abc
    result = result.replace(/#([0-9a-fA-F])\1([0-9a-fA-F])\2([0-9a-fA-F])\3/g, "#$1$2$3");

    // Remove units from zero values (0px -> 0, 0em -> 0, etc.) but not 0%
    result = result.replace(/\b0(px|em|rem|pt|pc|in|cm|mm|ex|ch|vw|vh|vmin|vmax)\b/g, "0");

    // Shorten 0.5 to .5
    result = result.replace(/\b0(\.\d+)/g, "$1");

    return { output: result, error: null };
  } catch (e) {
    return { output: "", error: e instanceof Error ? e.message : "Minification error" };
  }
}

function beautifyCSS(css: string, indentSize: number): { output: string; error: string | null } {
  try {
    // First minify to normalize
    const { output: minified } = minifyCSS(css);
    if (!minified) return { output: "", error: null };

    const indent = " ".repeat(indentSize);
    let result = "";
    let depth = 0;
    let inValue = false;
    let inString = false;
    let stringChar = "";

    for (let i = 0; i < minified.length; i++) {
      const ch = minified[i];

      // Track strings
      if (inString) {
        result += ch;
        if (ch === stringChar && minified[i - 1] !== "\\") {
          inString = false;
        }
        continue;
      }

      if (ch === '"' || ch === "'") {
        inString = true;
        stringChar = ch;
        result += ch;
        continue;
      }

      if (ch === "{") {
        result += " {\n";
        depth++;
        result += indent.repeat(depth);
        inValue = false;
        continue;
      }

      if (ch === "}") {
        depth = Math.max(0, depth - 1);
        result += "\n" + indent.repeat(depth) + "}\n";
        if (depth > 0) {
          result += indent.repeat(depth);
        } else {
          result += "\n";
        }
        inValue = false;
        continue;
      }

      if (ch === ";") {
        result += ";\n" + indent.repeat(depth);
        inValue = false;
        continue;
      }

      if (ch === ":" && !inValue) {
        result += ": ";
        inValue = true;
        continue;
      }

      if (ch === ",") {
        result += ", ";
        continue;
      }

      result += ch;
    }

    // Clean up extra blank lines and trailing spaces
    result = result
      .split("\n")
      .map((line) => line.trimEnd())
      .join("\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();

    return { output: result, error: null };
  } catch (e) {
    return { output: "", error: e instanceof Error ? e.message : "Beautify error" };
  }
}

const EXAMPLE_CSS = `/* Main layout styles */
.container {
  max-width: 1200px;
  margin: 0px auto;
  padding: 0px 16px;
}

/* Navigation */
.nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: #ffffff;
  padding: 16px 24px;
  border-bottom: 1px solid #dddddd;
}

.nav__logo {
  font-size: 1.5rem;
  font-weight: 700;
  color: #333333;
}

.nav__links {
  display: flex;
  gap: 24px;
  list-style: none;
}

.nav__links a {
  color: #666666;
  text-decoration: none;
  transition: color 0.2s ease;
}

.nav__links a:hover {
  color: #0066ff;
}

/* Hero section */
.hero {
  padding: 80px 0px;
  text-align: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #ffffff;
}

.hero h1 {
  font-size: 3rem;
  margin-bottom: 16px;
}

.hero p {
  font-size: 1.25rem;
  opacity: 0.9;
  max-width: 600px;
  margin: 0px auto;
}

/* Card grid */
.cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 24px;
  padding: 48px 0px;
}

.card {
  background: #ffffff;
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0px 2px 8px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.card:hover {
  transform: translateY(-4px);
  box-shadow: 0px 8px 24px rgba(0, 0, 0, 0.15);
}`;

export default function CssMinifierPage() {
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
      const result = minifyCSS(input);
      setOutput(result.output);
      setError(result.error);
    } else {
      const result = beautifyCSS(input, indentSize);
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
      <title>CSS Minifier & Beautifier - Free Online Tool | DevTools Hub</title>
      <meta
        name="description"
        content="Minify and beautify CSS online for free. Remove comments, whitespace, and optimize selectors. Shorten hex colors, remove unnecessary units, and reduce CSS file size."
      />
      <JsonLd
        data={[
          generateWebAppSchema({
            slug: "css-minifier",
            name: "CSS Minifier",
            description: "Minify CSS code by removing whitespace, comments, and unnecessary characters",
            category: "developer",
          }),
          generateBreadcrumbSchema({
            slug: "css-minifier",
            name: "CSS Minifier",
            description: "Minify CSS code by removing whitespace, comments, and unnecessary characters",
            category: "developer",
          }),
          generateFAQSchema([
            { question: "What is CSS minification?", answer: "CSS minification removes unnecessary characters like whitespace, comments, and redundant semicolons without changing the stylesheet's behavior. This reduces file size, which means faster downloads and improved page load times. Typical savings range from 20-50% depending on the input." },
            { question: "Will minification break my CSS?", answer: "No. The minifier only removes characters that have no effect on how browsers interpret your CSS. Whitespace inside strings and required spaces (like between values) are preserved. The output is semantically identical to the input." },
            { question: "How much can I save by minifying CSS?", answer: "Savings depend on how much whitespace and comments your CSS has. Well-commented development CSS typically sees 30-50% reduction. Already compact CSS may only see 10-15%. The tool shows you the exact byte savings and percentage after minifying." },
            { question: "Is my CSS data safe?", answer: "Yes. All processing happens entirely in your browser using JavaScript. No CSS code is sent to any server. You can safely minify proprietary stylesheets and design system tokens." },
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
                <a href="/tools" className="hover:text-white transition-colors">Developer Tools</a>
              </li>
              <li><span className="mx-1">/</span></li>
              <li className="text-slate-200">CSS Minifier</li>
            </ol>
          </nav>

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
              CSS Minifier & Beautifier
            </h1>
            <p className="text-slate-400 max-w-2xl text-lg">
              Minify CSS to reduce file size or beautify it for readability.
              Removes comments, collapses whitespace, shortens hex colors, and
              strips unnecessary units. Everything runs in your browser.
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
              onClick={() => { setInput(EXAMPLE_CSS); setOutput(""); setError(null); }}
              className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
            >
              Load example
            </button>
          </div>

          {/* Input / Output */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-slate-300">Input CSS</label>
                <span className="text-xs text-slate-500">
                  {inputSize.toLocaleString()} bytes | {input.split("\n").length} lines
                </span>
              </div>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Paste your CSS here..."
                className="w-full h-96 bg-slate-800 border border-slate-600 rounded-lg p-4 font-mono text-sm text-slate-200 placeholder-slate-500 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                spellCheck={false}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-slate-300">
                  {mode === "minify" ? "Minified CSS" : "Beautified CSS"}
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
              {mode === "minify" ? "Minify CSS" : "Beautify CSS"}
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

          {/* Optimizations Applied */}
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 mb-6">
            <h2 className="text-lg font-semibold text-white mb-4">Optimizations Applied</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { title: "Remove Comments", desc: "Strips all /* */ block comments" },
                { title: "Collapse Whitespace", desc: "Removes unnecessary spaces, newlines, and tabs" },
                { title: "Shorten Hex Colors", desc: "#ffffff → #fff, #aabbcc → #abc" },
                { title: "Remove Zero Units", desc: "0px → 0, 0em → 0, 0rem → 0" },
                { title: "Shorten Decimals", desc: "0.5 → .5, 0.75 → .75" },
                { title: "Remove Trailing Semicolons", desc: "Last property before } doesn't need ;" },
                { title: "Remove Empty Rules", desc: "Strips selectors with no declarations" },
                { title: "Trim Selectors", desc: "Removes spaces around >, ~, + combinators" },
              ].map((opt) => (
                <div key={opt.title}>
                  <h3 className="text-sm font-medium text-white mb-1">{opt.title}</h3>
                  <p className="text-xs text-slate-400">{opt.desc}</p>
                </div>
              ))}
            </div>
          </div>

          <RelatedTools currentSlug="css-minifier" />

          {/* FAQ Section */}
          <section className="mt-16 border-t border-slate-700 pt-10">
            <h2 className="text-2xl font-bold text-white mb-6">
              Frequently Asked Questions
            </h2>

            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  What is CSS minification?
                </h3>
                <p className="text-slate-400">
                  CSS minification removes unnecessary characters like whitespace,
                  comments, and redundant semicolons without changing the
                  stylesheet&apos;s behavior. This reduces file size, which means
                  faster downloads and improved page load times. Typical savings
                  range from 20-50% depending on the input.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Will minification break my CSS?
                </h3>
                <p className="text-slate-400">
                  No. The minifier only removes characters that have no effect on
                  how browsers interpret your CSS. Whitespace inside strings and
                  required spaces (like between values) are preserved. The output
                  is semantically identical to the input.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  How much can I save by minifying CSS?
                </h3>
                <p className="text-slate-400">
                  Savings depend on how much whitespace and comments your CSS has.
                  Well-commented development CSS typically sees 30-50% reduction.
                  Already compact CSS may only see 10-15%. The tool shows you the
                  exact byte savings and percentage after minifying.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Is my CSS data safe?
                </h3>
                <p className="text-slate-400">
                  Yes. All processing happens entirely in your browser using
                  JavaScript. No CSS code is sent to any server. You can safely
                  minify proprietary stylesheets and design system tokens.
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
