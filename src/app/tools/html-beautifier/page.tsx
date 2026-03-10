"use client";

import { useState, useCallback } from "react";

const VOID_ELEMENTS = new Set([
  "area", "base", "br", "col", "embed", "hr", "img", "input",
  "link", "meta", "param", "source", "track", "wbr",
]);

const INLINE_ELEMENTS = new Set([
  "a", "abbr", "acronym", "b", "bdo", "big", "br", "button", "cite",
  "code", "dfn", "em", "i", "img", "input", "kbd", "label", "map",
  "object", "output", "q", "samp", "select", "small", "span",
  "strong", "sub", "sup", "textarea", "time", "tt", "u", "var",
]);

const RAW_CONTENT_ELEMENTS = new Set(["script", "style", "pre", "code"]);

const EXAMPLE_HTML = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Example Page</title><link rel="stylesheet" href="styles.css"></head><body><header><nav><ul><li><a href="/">Home</a></li><li><a href="/about">About</a></li><li><a href="/contact">Contact</a></li></ul></nav></header><main><section class="hero"><h1>Welcome to My Site</h1><p>This is a <strong>sample</strong> HTML page for testing the beautifier.</p><img src="hero.jpg" alt="Hero image"></section><section class="content"><h2>Features</h2><ul><li>Fast performance</li><li>Easy to use</li><li>Free forever</li></ul><form action="/submit" method="post"><div><label for="name">Name:</label><input type="text" id="name" name="name" required></div><div><label for="email">Email:</label><input type="email" id="email" name="email" required></div><button type="submit">Submit</button></form></section></main><footer><p>&copy; 2024 My Site. All rights reserved.</p></footer></body></html>`;

export default function HtmlBeautifierPage() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [indentSize, setIndentSize] = useState(2);
  const [indentChar, setIndentChar] = useState<"spaces" | "tabs">("spaces");
  const [copied, setCopied] = useState(false);

  const beautifyHTML = useCallback(() => {
    if (!input.trim()) {
      setOutput("");
      return;
    }

    const indent = indentChar === "tabs" ? "\t" : " ".repeat(indentSize);
    const tokens = tokenizeHTML(input);
    const lines: string[] = [];
    let depth = 0;

    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];

      if (token.type === "doctype") {
        lines.push(indent.repeat(depth) + token.raw.trim());
        continue;
      }

      if (token.type === "comment") {
        lines.push(indent.repeat(depth) + token.raw.trim());
        continue;
      }

      if (token.type === "close") {
        depth = Math.max(0, depth - 1);
        lines.push(indent.repeat(depth) + token.raw.trim());
        continue;
      }

      if (token.type === "open") {
        lines.push(indent.repeat(depth) + token.raw.trim());
        const tagName = getTagName(token.raw);

        if (tagName && !VOID_ELEMENTS.has(tagName.toLowerCase()) && !token.selfClosing) {
          // Check if this is a raw content element — keep its content on the same line
          if (tagName && RAW_CONTENT_ELEMENTS.has(tagName.toLowerCase())) {
            // Find the matching close tag and inline everything
            let content = "";
            let j = i + 1;
            while (j < tokens.length) {
              if (tokens[j].type === "close" && getTagName(tokens[j].raw)?.toLowerCase() === tagName.toLowerCase()) {
                break;
              }
              content += tokens[j].raw;
              j++;
            }
            if (j < tokens.length) {
              // Remove the last line we just pushed and combine
              const openTag = lines.pop();
              const trimmedContent = content.trim();
              if (trimmedContent.length < 80) {
                lines.push(indent.repeat(depth) + (openTag?.trim() || "") + trimmedContent + tokens[j].raw.trim());
              } else {
                lines.push((openTag?.trim() ? indent.repeat(depth) + openTag.trim() : ""));
                depth++;
                lines.push(indent.repeat(depth) + trimmedContent);
                depth = Math.max(0, depth - 1);
                lines.push(indent.repeat(depth) + tokens[j].raw.trim());
              }
              i = j;
              continue;
            }
          }
          depth++;
        }
        continue;
      }

      if (token.type === "text") {
        const trimmed = token.raw.trim();
        if (trimmed) {
          lines.push(indent.repeat(depth) + trimmed);
        }
        continue;
      }
    }

    setOutput(lines.join("\n"));
  }, [input, indentSize, indentChar]);

  const minifyHTML = useCallback(() => {
    if (!input.trim()) {
      setOutput("");
      return;
    }
    // Remove comments, collapse whitespace
    const minified = input
      .replace(/<!--[\s\S]*?-->/g, "")
      .replace(/>\s+</g, "><")
      .replace(/\s{2,}/g, " ")
      .trim();
    setOutput(minified);
  }, [input]);

  const copyOutput = useCallback(async () => {
    if (!output) return;
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [output]);

  const clearAll = useCallback(() => {
    setInput("");
    setOutput("");
  }, []);

  const loadExample = useCallback(() => {
    setInput(EXAMPLE_HTML);
    setOutput("");
  }, []);

  const inputLines = input.split("\n").length;
  const outputLines = output.split("\n").length;

  return (
    <>
      <title>HTML Beautifier & Formatter - Free Online Tool | DevTools Hub</title>
      <meta
        name="description"
        content="Beautify, format, and minify HTML online for free. Pretty-print HTML with proper indentation, supports all HTML5 elements, void elements, and inline content."
      />

      <div className="min-h-screen bg-slate-900 text-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Breadcrumb */}
          <nav className="text-sm text-slate-400 mb-6" aria-label="Breadcrumb">
            <ol className="flex items-center gap-2">
              <li>
                <a href="/" className="hover:text-white transition-colors">
                  Home
                </a>
              </li>
              <li><span className="mx-1">/</span></li>
              <li>
                <a href="/tools" className="hover:text-white transition-colors">
                  Developer Tools
                </a>
              </li>
              <li><span className="mx-1">/</span></li>
              <li className="text-slate-200">HTML Beautifier</li>
            </ol>
          </nav>

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
              HTML Beautifier & Formatter
            </h1>
            <p className="text-slate-400 max-w-2xl text-lg">
              Format and beautify messy HTML with proper indentation. Handles
              void elements, inline tags, script/style blocks, comments, and
              DOCTYPE declarations. Minify to strip whitespace and comments.
            </p>
          </div>

          {/* Controls */}
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <button
              onClick={beautifyHTML}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              Beautify
            </button>
            <button
              onClick={minifyHTML}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors"
            >
              Minify
            </button>
            <button
              onClick={copyOutput}
              disabled={!output}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {copied ? "Copied!" : "Copy"}
            </button>
            <button
              onClick={clearAll}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors"
            >
              Clear
            </button>
            <button
              onClick={loadExample}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors"
            >
              Example
            </button>

            <div className="ml-auto flex items-center gap-4">
              <div className="flex items-center gap-2">
                <label className="text-sm text-slate-400">Indent:</label>
                <select
                  value={indentChar}
                  onChange={(e) => setIndentChar(e.target.value as "spaces" | "tabs")}
                  className="bg-slate-800 border border-slate-600 text-slate-200 rounded px-2 py-1 text-sm"
                >
                  <option value="spaces">Spaces</option>
                  <option value="tabs">Tabs</option>
                </select>
              </div>
              {indentChar === "spaces" && (
                <div className="flex items-center gap-2">
                  <label className="text-sm text-slate-400">Size:</label>
                  <select
                    value={indentSize}
                    onChange={(e) => setIndentSize(Number(e.target.value))}
                    className="bg-slate-800 border border-slate-600 text-slate-200 rounded px-2 py-1 text-sm"
                  >
                    <option value={2}>2</option>
                    <option value={4}>4</option>
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Panels */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
            {/* Input */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-slate-300">
                  Input HTML
                </label>
                <span className="text-xs text-slate-500">
                  {input.length} chars | {inputLines} lines
                </span>
              </div>
              <textarea
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  setOutput("");
                }}
                placeholder={"Paste your HTML here...\n\n<div><p>Hello world</p></div>"}
                className="w-full h-96 bg-slate-800 border border-slate-600 rounded-lg p-4 font-mono text-sm text-slate-200 placeholder-slate-500 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                spellCheck={false}
              />
            </div>

            {/* Output */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-slate-300">
                  Formatted HTML
                </label>
                <span className="text-xs text-slate-500">
                  {output ? `${output.length} chars | ${outputLines} lines` : ""}
                </span>
              </div>
              <textarea
                value={output}
                readOnly
                placeholder="Beautified HTML will appear here..."
                className="w-full h-96 bg-slate-800 border border-slate-600 rounded-lg p-4 font-mono text-sm text-green-300 placeholder-slate-500 resize-none focus:outline-none"
                spellCheck={false}
              />
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
                  What does an HTML beautifier do?
                </h3>
                <p className="text-slate-400">
                  An HTML beautifier (also called an HTML formatter or
                  pretty-printer) takes messy, minified, or poorly indented HTML
                  and reformats it with consistent indentation and line breaks.
                  This makes the code easier to read, edit, and debug without
                  changing its meaning or rendered output.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Does beautifying HTML change how the page looks?
                </h3>
                <p className="text-slate-400">
                  In most cases, no. HTML treats consecutive whitespace as a
                  single space, so adding indentation and line breaks between
                  tags does not change the visual rendering. The only exception
                  is content inside &lt;pre&gt; tags, which this tool preserves
                  as-is.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  What are void elements?
                </h3>
                <p className="text-slate-400">
                  Void elements are HTML elements that cannot have child content
                  and do not need a closing tag. Examples include &lt;br&gt;,
                  &lt;img&gt;, &lt;input&gt;, &lt;hr&gt;, &lt;meta&gt;, and
                  &lt;link&gt;. This beautifier recognizes all HTML5 void
                  elements and does not expect closing tags for them.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Is my HTML data safe?
                </h3>
                <p className="text-slate-400">
                  Yes. All formatting and minification happens entirely in your
                  browser using JavaScript. No HTML is sent to any server. Your
                  code never leaves your machine.
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}

// --- HTML Tokenizer ---

interface HTMLToken {
  type: "open" | "close" | "text" | "comment" | "doctype";
  raw: string;
  selfClosing?: boolean;
}

function tokenizeHTML(html: string): HTMLToken[] {
  const tokens: HTMLToken[] = [];
  let i = 0;

  while (i < html.length) {
    // Comment
    if (html.slice(i, i + 4) === "<!--") {
      const end = html.indexOf("-->", i + 4);
      if (end === -1) {
        tokens.push({ type: "comment", raw: html.slice(i) });
        break;
      }
      tokens.push({ type: "comment", raw: html.slice(i, end + 3) });
      i = end + 3;
      continue;
    }

    // DOCTYPE
    if (html.slice(i, i + 9).toUpperCase() === "<!DOCTYPE") {
      const end = html.indexOf(">", i);
      if (end === -1) {
        tokens.push({ type: "doctype", raw: html.slice(i) });
        break;
      }
      tokens.push({ type: "doctype", raw: html.slice(i, end + 1) });
      i = end + 1;
      continue;
    }

    // Closing tag
    if (html.slice(i, i + 2) === "</") {
      const end = html.indexOf(">", i);
      if (end === -1) {
        tokens.push({ type: "text", raw: html.slice(i) });
        break;
      }
      tokens.push({ type: "close", raw: html.slice(i, end + 1) });
      i = end + 1;
      continue;
    }

    // Opening tag
    if (html[i] === "<" && i + 1 < html.length && /[a-zA-Z]/.test(html[i + 1])) {
      // Find end of tag, being careful with quoted attributes
      let j = i + 1;
      let inSingleQuote = false;
      let inDoubleQuote = false;

      while (j < html.length) {
        if (!inSingleQuote && !inDoubleQuote && html[j] === ">") {
          break;
        }
        if (!inDoubleQuote && html[j] === "'") {
          inSingleQuote = !inSingleQuote;
        }
        if (!inSingleQuote && html[j] === '"') {
          inDoubleQuote = !inDoubleQuote;
        }
        j++;
      }

      if (j >= html.length) {
        tokens.push({ type: "text", raw: html.slice(i) });
        break;
      }

      const tag = html.slice(i, j + 1);
      const selfClosing = tag.endsWith("/>") || VOID_ELEMENTS.has((getTagName(tag) || "").toLowerCase());
      tokens.push({ type: "open", raw: tag, selfClosing });
      i = j + 1;
      continue;
    }

    // Text content
    let j = i;
    while (j < html.length && html[j] !== "<") {
      j++;
    }
    const text = html.slice(i, j);
    if (text) {
      tokens.push({ type: "text", raw: text });
    }
    i = j;
  }

  return tokens;
}

function getTagName(tag: string): string | null {
  const match = tag.match(/^<\/?([a-zA-Z][a-zA-Z0-9-]*)/);
  return match ? match[1] : null;
}
