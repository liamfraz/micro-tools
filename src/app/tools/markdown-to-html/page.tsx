"use client";

import { useState, useCallback } from "react";
import JsonLd from "@/components/JsonLd";
import RelatedTools from "@/components/RelatedTools";
import {
  generateFAQSchema,
  generateWebAppSchema,
  generateBreadcrumbSchema,
} from "@/lib/jsonld";

// ── Markdown-to-HTML converter ──

const escapeHtml = (text: string): string =>
  text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const renderInline = (text: string): string => {
  let r = escapeHtml(text);
  // Images
  r = r.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" />');
  // Links
  r = r.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
  // Bold+Italic
  r = r.replace(/\*\*\*(.+?)\*\*\*/g, "<strong><em>$1</em></strong>");
  r = r.replace(/___(.+?)___/g, "<strong><em>$1</em></strong>");
  // Bold
  r = r.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  r = r.replace(/__(.+?)__/g, "<strong>$1</strong>");
  // Italic
  r = r.replace(/\*(.+?)\*/g, "<em>$1</em>");
  r = r.replace(/(?<!\w)_(.+?)_(?!\w)/g, "<em>$1</em>");
  // Strikethrough
  r = r.replace(/~~(.+?)~~/g, "<del>$1</del>");
  // Inline code
  r = r.replace(/`([^`]+)`/g, "<code>$1</code>");
  // Line breaks
  r = r.replace(/  \n/g, "<br />\n");
  return r;
};

const convertMarkdownToHtml = (md: string): string => {
  if (!md.trim()) return "";

  const lines = md.split("\n");
  const out: string[] = [];
  let i = 0;
  let inList = false;
  let listType = "";

  const closeList = () => {
    if (inList) {
      out.push(listType === "ol" ? "</ol>" : "</ul>");
      inList = false;
    }
  };

  while (i < lines.length) {
    const line = lines[i];

    // Fenced code block
    if (line.trim().startsWith("```")) {
      closeList();
      const lang = line.trim().slice(3).trim();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith("```")) {
        codeLines.push(escapeHtml(lines[i]));
        i++;
      }
      const langAttr = lang ? ` class="language-${escapeHtml(lang)}"` : "";
      out.push(`<pre><code${langAttr}>${codeLines.join("\n")}</code></pre>`);
      i++;
      continue;
    }

    // Heading
    const hMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (hMatch) {
      closeList();
      const lvl = hMatch[1].length;
      out.push(`<h${lvl}>${renderInline(hMatch[2])}</h${lvl}>`);
      i++;
      continue;
    }

    // Horizontal rule
    if (/^(\*{3,}|-{3,}|_{3,})\s*$/.test(line.trim())) {
      closeList();
      out.push("<hr />");
      i++;
      continue;
    }

    // Blockquote
    if (line.trim().startsWith("> ") || line.trim() === ">") {
      closeList();
      const qLines: string[] = [];
      while (i < lines.length && (lines[i].trim().startsWith("> ") || lines[i].trim() === ">")) {
        qLines.push(lines[i].trim().replace(/^>\s?/, ""));
        i++;
      }
      out.push(`<blockquote>\n<p>${renderInline(qLines.join("\n"))}</p>\n</blockquote>`);
      continue;
    }

    // Table
    if (line.includes("|") && i + 1 < lines.length && /^\|?\s*[-:]+[-|:\s]*$/.test(lines[i + 1].trim())) {
      closeList();
      const headers = line.split("|").map((c) => c.trim()).filter(Boolean);
      const sepCells = lines[i + 1].split("|").map((c) => c.trim()).filter(Boolean);
      const aligns: string[] = sepCells.map((c) => {
        if (c.startsWith(":") && c.endsWith(":")) return "center";
        if (c.endsWith(":")) return "right";
        return "left";
      });
      i += 2;
      const rows: string[][] = [];
      while (i < lines.length && lines[i].includes("|")) {
        rows.push(lines[i].split("|").map((c) => c.trim()).filter(Boolean));
        i++;
      }
      let t = "<table>\n<thead>\n<tr>\n";
      headers.forEach((h, idx) => {
        const al = aligns[idx] ? ` align="${aligns[idx]}"` : "";
        t += `<th${al}>${renderInline(h)}</th>\n`;
      });
      t += "</tr>\n</thead>\n<tbody>\n";
      for (const row of rows) {
        t += "<tr>\n";
        for (let c = 0; c < headers.length; c++) {
          const al = aligns[c] ? ` align="${aligns[c]}"` : "";
          t += `<td${al}>${renderInline(row[c] || "")}</td>\n`;
        }
        t += "</tr>\n";
      }
      t += "</tbody>\n</table>";
      out.push(t);
      continue;
    }

    // Task list
    const taskMatch = line.match(/^[-*]\s+\[([ xX])\]\s+(.+)$/);
    if (taskMatch) {
      if (!inList || listType !== "ul") { closeList(); out.push("<ul>"); inList = true; listType = "ul"; }
      const chk = taskMatch[1].toLowerCase() === "x" ? ' checked="checked" disabled="disabled"' : ' disabled="disabled"';
      out.push(`<li><input type="checkbox"${chk} /> ${renderInline(taskMatch[2])}</li>`);
      i++;
      continue;
    }

    // Unordered list
    const ulMatch = line.match(/^[-*+]\s+(.+)$/);
    if (ulMatch) {
      if (!inList || listType !== "ul") { closeList(); out.push("<ul>"); inList = true; listType = "ul"; }
      out.push(`<li>${renderInline(ulMatch[1])}</li>`);
      i++;
      continue;
    }

    // Ordered list
    const olMatch = line.match(/^\d+\.\s+(.+)$/);
    if (olMatch) {
      if (!inList || listType !== "ol") { closeList(); out.push("<ol>"); inList = true; listType = "ol"; }
      out.push(`<li>${renderInline(olMatch[1])}</li>`);
      i++;
      continue;
    }

    closeList();

    // Empty line
    if (!line.trim()) { i++; continue; }

    // Paragraph
    const pLines: string[] = [line];
    i++;
    while (
      i < lines.length &&
      lines[i].trim() &&
      !lines[i].trim().startsWith("#") &&
      !lines[i].trim().startsWith(">") &&
      !lines[i].trim().startsWith("```") &&
      !lines[i].trim().match(/^[-*+]\s/) &&
      !lines[i].trim().match(/^\d+\.\s/) &&
      !lines[i].trim().match(/^(\*{3,}|-{3,}|_{3,})\s*$/)
    ) {
      pLines.push(lines[i]);
      i++;
    }
    out.push(`<p>${renderInline(pLines.join("\n"))}</p>`);
  }

  closeList();
  return out.join("\n");
};

const prettifyHtml = (html: string): string => {
  // Simple indentation for output readability
  let indent = 0;
  const lines = html.split("\n");
  const result: string[] = [];
  const voidTags = new Set(["br", "hr", "img", "input"]);

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Check if line is a closing tag
    const closingMatch = trimmed.match(/^<\/(\w+)/);
    if (closingMatch && !voidTags.has(closingMatch[1])) {
      indent = Math.max(0, indent - 1);
    }

    result.push("  ".repeat(indent) + trimmed);

    // Check if line opens a block tag (and doesn't close it on the same line)
    const openMatch = trimmed.match(/^<(\w+)/);
    if (openMatch && !voidTags.has(openMatch[1]) && !trimmed.match(/^<\w+[^>]*\/\s*>/) && !trimmed.includes(`</${openMatch[1]}>`)) {
      indent++;
    }
  }

  return result.join("\n");
};

const EXAMPLE_MD = `# Getting Started

Welcome to our **documentation**. This guide covers the basics.

## Installation

Install the package using npm:

\`\`\`bash
npm install my-package
\`\`\`

## Features

- **Fast** — optimized for speed
- **Lightweight** — minimal dependencies
- *Easy to use* — simple API

## Configuration

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| port | number | 3000 | Server port |
| debug | boolean | false | Enable debug mode |
| timeout | string | "30s" | Request timeout |

## Task List

- [x] Initial setup
- [x] Core features
- [ ] Documentation
- [ ] Release v1.0

> "Simplicity is the ultimate sophistication." — Leonardo da Vinci

---

Learn more at [our website](https://example.com).`;

type OutputFormat = "raw" | "pretty" | "preview";

export default function MarkdownToHtmlPage() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [format, setFormat] = useState<OutputFormat>("pretty");
  const [copied, setCopied] = useState(false);
  const [wrapInDoc, setWrapInDoc] = useState(false);

  const handleConvert = useCallback(() => {
    if (!input.trim()) { setOutput(""); return; }
    let html = convertMarkdownToHtml(input);
    if (format === "pretty") {
      html = prettifyHtml(html);
    }
    if (wrapInDoc) {
      html = `<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8" />\n  <meta name="viewport" content="width=device-width, initial-scale=1.0" />\n  <title>Document</title>\n</head>\n<body>\n${html.split("\n").map((l) => "  " + l).join("\n")}\n</body>\n</html>`;
    }
    setOutput(html);
  }, [input, format, wrapInDoc]);

  const handleCopy = useCallback(async () => {
    if (!output) return;
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [output]);

  const handleDownload = useCallback(() => {
    if (!output) return;
    const blob = new Blob([output], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "converted.html";
    a.click();
    URL.revokeObjectURL(url);
  }, [output]);

  const handleClear = useCallback(() => {
    setInput("");
    setOutput("");
  }, []);

  const inputLines = input ? input.split("\n").length : 0;
  const outputLines = output ? output.split("\n").length : 0;

  return (
    <>
      <title>Markdown to HTML Converter - Free Online Tool | DevTools Hub</title>
      <meta
        name="description"
        content="Convert Markdown to clean HTML code online for free. Supports headings, lists, tables, code blocks, links, images, and task lists. Copy or download the output."
      />
      <JsonLd
        data={[
          generateWebAppSchema({
            slug: "markdown-to-html",
            name: "Markdown to HTML Converter",
            description: "Convert Markdown text to clean HTML with live preview",
            category: "conversion",
          }),
          generateBreadcrumbSchema({
            slug: "markdown-to-html",
            name: "Markdown to HTML Converter",
            description: "Convert Markdown text to clean HTML with live preview",
            category: "conversion",
          }),
          generateFAQSchema([
            { question: "What Markdown features are supported?", answer: "This converter supports headings (h1-h6), bold, italic, strikethrough, links, images, inline code, fenced code blocks with language classes, blockquotes, ordered and unordered lists, task lists with checkboxes, tables with column alignment, and horizontal rules." },
            { question: "What is the difference between Pretty HTML and Raw HTML?", answer: "Pretty HTML adds indentation and formatting to make the output easier to read and edit. Raw HTML produces compact output without extra whitespace -- ideal for embedding directly into pages or templates." },
            { question: "What does 'Wrap in full HTML document' do?", answer: "When enabled, the output includes a complete HTML5 document structure with <!DOCTYPE html>, <html>, <head> (with charset and viewport meta tags), and <body> tags. This makes the output a standalone .html file you can open directly in a browser." },
            { question: "Is my data safe?", answer: "Yes. All conversion happens entirely in your browser using JavaScript. No data is sent to any server. Your Markdown content never leaves your machine." },
          ]),
        ]}
      />

      <main className="min-h-screen bg-slate-900 text-white">
        <div className="max-w-6xl mx-auto px-4 py-12">
          {/* Breadcrumb */}
          <nav className="text-sm text-slate-400 mb-6" aria-label="Breadcrumb">
            <ol className="flex items-center gap-2">
              <li><a href="/" className="hover:text-white transition-colors">Home</a></li>
              <li><span className="mx-1">/</span></li>
              <li><a href="/tools" className="hover:text-white transition-colors">Conversion Tools</a></li>
              <li><span className="mx-1">/</span></li>
              <li className="text-slate-200">Markdown to HTML</li>
            </ol>
          </nav>

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
              Markdown to HTML Converter
            </h1>
            <p className="text-slate-400 max-w-2xl text-lg">
              Convert Markdown to clean, semantic HTML. Paste your Markdown, hit convert, and get ready-to-use HTML code with headings, lists, tables, code blocks, and more.
            </p>
          </div>

          {/* Controls */}
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <button
              onClick={handleConvert}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              Convert
            </button>
            <button
              onClick={handleCopy}
              disabled={!output}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {copied ? "Copied!" : "Copy HTML"}
            </button>
            <button
              onClick={handleDownload}
              disabled={!output}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Download .html
            </button>
            <button
              onClick={handleClear}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors"
            >
              Clear
            </button>
            <button
              onClick={() => { setInput(EXAMPLE_MD); setOutput(""); }}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors"
            >
              Example
            </button>
          </div>

          {/* Options row */}
          <div className="flex flex-wrap items-center gap-4 mb-4">
            <div className="flex items-center gap-2">
              <label className="text-sm text-slate-400">Output:</label>
              {(["pretty", "raw", "preview"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFormat(f)}
                  className={`px-3 py-1 text-xs rounded font-medium transition-colors capitalize ${
                    format === f ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                  }`}
                >
                  {f === "pretty" ? "Pretty HTML" : f === "raw" ? "Raw HTML" : "Preview"}
                </button>
              ))}
            </div>
            <label className="flex items-center gap-2 text-sm text-slate-400 cursor-pointer">
              <input
                type="checkbox"
                checked={wrapInDoc}
                onChange={(e) => setWrapInDoc(e.target.checked)}
                className="rounded border-slate-600 bg-slate-800 text-blue-600 focus:ring-blue-500"
              />
              Wrap in full HTML document
            </label>
          </div>

          {/* Panels */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
            {/* Input */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-slate-300">Markdown Input</label>
                <span className="text-xs text-slate-500">{inputLines} lines</span>
              </div>
              <textarea
                value={input}
                onChange={(e) => { setInput(e.target.value); setOutput(""); }}
                placeholder={"Paste Markdown here...\n\n# Heading\n**bold** *italic*\n- list item"}
                className="w-full h-96 bg-slate-800 border border-slate-700 rounded-lg p-4 font-mono text-sm text-slate-200 placeholder-slate-500 resize-y focus:outline-none focus:ring-2 focus:ring-blue-500"
                spellCheck={false}
              />
            </div>

            {/* Output */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-slate-300">
                  {format === "preview" ? "HTML Preview" : "HTML Output"}
                </label>
                <span className="text-xs text-slate-500">{output ? `${outputLines} lines` : ""}</span>
              </div>
              {format === "preview" ? (
                <div
                  className="w-full h-96 bg-slate-800 border border-slate-700 rounded-lg p-6 overflow-y-auto prose-md"
                  suppressHydrationWarning
                  dangerouslySetInnerHTML={{ __html: output || '<p class="text-slate-500 italic">Preview will appear here...</p>' }}
                />
              ) : (
                <textarea
                  value={output}
                  readOnly
                  placeholder="HTML output will appear here..."
                  className="w-full h-96 bg-slate-800 border border-slate-700 rounded-lg p-4 font-mono text-sm text-green-300 placeholder-slate-500 resize-y focus:outline-none"
                  spellCheck={false}
                />
              )}
            </div>
          </div>

          {/* Supported syntax */}
          <div className="bg-slate-800 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Supported Markdown Syntax</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left py-2 text-slate-400 font-medium">Markdown</th>
                    <th className="text-left py-2 text-slate-400 font-medium">HTML Output</th>
                    <th className="text-left py-2 text-slate-400 font-medium">Description</th>
                  </tr>
                </thead>
                <tbody className="text-slate-300">
                  {[
                    ["# Heading", "<h1>", "Headings h1–h6"],
                    ["**bold**", "<strong>", "Bold text"],
                    ["*italic*", "<em>", "Italic text"],
                    ["~~strike~~", "<del>", "Strikethrough"],
                    ["[text](url)", "<a href>", "Hyperlinks"],
                    ["![alt](src)", "<img>", "Images"],
                    ["`code`", "<code>", "Inline code"],
                    ["```lang", "<pre><code>", "Code blocks with language class"],
                    ["> quote", "<blockquote>", "Blockquotes"],
                    ["- item", "<ul><li>", "Unordered lists"],
                    ["1. item", "<ol><li>", "Ordered lists"],
                    ["- [x] task", '<input type="checkbox">', "Task lists"],
                    ["| a | b |", "<table>", "Tables with alignment"],
                    ["---", "<hr>", "Horizontal rules"],
                  ].map((row) => (
                    <tr key={row[0]} className="border-b border-slate-700/50">
                      <td className="py-2 font-mono text-blue-400 text-xs">{row[0]}</td>
                      <td className="py-2 font-mono text-green-400 text-xs">{row[1]}</td>
                      <td className="py-2">{row[2]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <RelatedTools currentSlug="markdown-to-html" />

          {/* FAQ */}
          <div className="bg-slate-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Frequently Asked Questions</h2>
            <div className="space-y-4">
              {[
                {
                  q: "What Markdown features are supported?",
                  a: "This converter supports headings (h1–h6), bold, italic, strikethrough, links, images, inline code, fenced code blocks with language classes, blockquotes, ordered and unordered lists, task lists with checkboxes, tables with column alignment, and horizontal rules."
                },
                {
                  q: "What is the difference between Pretty HTML and Raw HTML?",
                  a: "Pretty HTML adds indentation and formatting to make the output easier to read and edit. Raw HTML produces compact output without extra whitespace — ideal for embedding directly into pages or templates."
                },
                {
                  q: "What does 'Wrap in full HTML document' do?",
                  a: "When enabled, the output includes a complete HTML5 document structure with <!DOCTYPE html>, <html>, <head> (with charset and viewport meta tags), and <body> tags. This makes the output a standalone .html file you can open directly in a browser."
                },
                {
                  q: "Is my data safe?",
                  a: "Yes. All conversion happens entirely in your browser using JavaScript. No data is sent to any server. Your Markdown content never leaves your machine."
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

      <style>{`
        .prose-md h1 { font-size: 1.875rem; font-weight: 700; color: white; margin-bottom: 0.75rem; margin-top: 1.5rem; }
        .prose-md h2 { font-size: 1.5rem; font-weight: 700; color: white; margin-bottom: 0.5rem; margin-top: 1.25rem; }
        .prose-md h3 { font-size: 1.25rem; font-weight: 600; color: white; margin-bottom: 0.5rem; margin-top: 1rem; }
        .prose-md h4 { font-size: 1.125rem; font-weight: 600; color: white; margin-bottom: 0.5rem; }
        .prose-md p { color: #cbd5e1; margin-bottom: 0.75rem; line-height: 1.7; }
        .prose-md a { color: #60a5fa; text-decoration: underline; }
        .prose-md strong { color: white; font-weight: 700; }
        .prose-md em { font-style: italic; }
        .prose-md del { text-decoration: line-through; color: #64748b; }
        .prose-md code { background: #0f172a; color: #7dd3fc; padding: 0.125rem 0.375rem; border-radius: 0.25rem; font-size: 0.875rem; font-family: monospace; }
        .prose-md pre { background: #0f172a; border: 1px solid #334155; border-radius: 0.5rem; padding: 1rem; overflow-x: auto; margin-bottom: 1rem; }
        .prose-md pre code { background: transparent; padding: 0; color: #e2e8f0; }
        .prose-md blockquote { border-left: 3px solid #3b82f6; padding-left: 1rem; color: #94a3b8; font-style: italic; margin-bottom: 0.75rem; }
        .prose-md ul { list-style-type: disc; padding-left: 1.5rem; margin-bottom: 0.75rem; color: #cbd5e1; }
        .prose-md ol { list-style-type: decimal; padding-left: 1.5rem; margin-bottom: 0.75rem; color: #cbd5e1; }
        .prose-md li { margin-bottom: 0.25rem; line-height: 1.6; }
        .prose-md hr { border: none; border-top: 1px solid #334155; margin: 1.5rem 0; }
        .prose-md table { width: 100%; border-collapse: collapse; margin-bottom: 1rem; }
        .prose-md th { background: #0f172a; color: white; font-weight: 600; text-align: left; padding: 0.5rem 0.75rem; border: 1px solid #334155; }
        .prose-md td { padding: 0.5rem 0.75rem; border: 1px solid #334155; color: #cbd5e1; }
        .prose-md img { max-width: 100%; border-radius: 0.5rem; }
        .prose-md input[type="checkbox"] { margin-right: 0.5rem; accent-color: #3b82f6; }
      `}</style>
    </>
  );
}
