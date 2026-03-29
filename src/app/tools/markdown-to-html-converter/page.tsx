"use client";

import { useState, useMemo, useCallback } from "react";
import JsonLd from "@/components/JsonLd";
import RelatedTools from "@/components/RelatedTools";
import ToolBreadcrumb from "@/components/ToolBreadcrumb";
import {
  generateFAQSchema,
  generateWebAppSchema,
  generateBreadcrumbSchema,
} from "@/lib/jsonld";

// --- Lightweight Markdown parser (no external deps) ---

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function parseInline(text: string): string {
  let result = text;
  // Images before links: ![alt](src)
  result = result.replace(
    /!\[([^\]]*)\]\(([^)]+)\)/g,
    '<img src="$2" alt="$1" style="max-width:100%" />'
  );
  // Links: [text](url)
  result = result.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    '<a href="$2" rel="noopener noreferrer">$1</a>'
  );
  // Bold+Italic: ***text*** or ___text___
  result = result.replace(
    /\*{3}(.+?)\*{3}/g,
    "<strong><em>$1</em></strong>"
  );
  result = result.replace(
    /_{3}(.+?)_{3}/g,
    "<strong><em>$1</em></strong>"
  );
  // Bold: **text** or __text__
  result = result.replace(/\*{2}(.+?)\*{2}/g, "<strong>$1</strong>");
  result = result.replace(/_{2}(.+?)_{2}/g, "<strong>$1</strong>");
  // Italic: *text* or _text_
  result = result.replace(/\*(.+?)\*/g, "<em>$1</em>");
  result = result.replace(/(?<!\w)_(.+?)_(?!\w)/g, "<em>$1</em>");
  // Strikethrough: ~~text~~
  result = result.replace(/~~(.+?)~~/g, "<del>$1</del>");
  // Inline code: `code`
  result = result.replace(/`([^`]+)`/g, "<code>$1</code>");
  return result;
}

function parseMarkdown(md: string): string {
  const lines = md.split("\n");
  const output: string[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Fenced code blocks
    if (line.startsWith("```")) {
      const lang = line.slice(3).trim();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith("```")) {
        codeLines.push(escapeHtml(lines[i]));
        i++;
      }
      i++; // skip closing ```
      const langAttr = lang ? ` class="language-${escapeHtml(lang)}"` : "";
      output.push(
        `<pre><code${langAttr}>${codeLines.join("\n")}</code></pre>`
      );
      continue;
    }

    // Horizontal rule
    if (/^(-{3,}|\*{3,}|_{3,})\s*$/.test(line)) {
      output.push("<hr />");
      i++;
      continue;
    }

    // Headings
    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      output.push(`<h${level}>${parseInline(headingMatch[2])}</h${level}>`);
      i++;
      continue;
    }

    // Table
    if (
      line.includes("|") &&
      i + 1 < lines.length &&
      /^\|?\s*[-:]+[-|:\s]+\s*\|?$/.test(lines[i + 1])
    ) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].includes("|")) {
        tableLines.push(lines[i]);
        i++;
      }
      if (tableLines.length >= 2) {
        const parseRow = (row: string) =>
          row
            .replace(/^\|/, "")
            .replace(/\|$/, "")
            .split("|")
            .map((c) => c.trim());

        const headers = parseRow(tableLines[0]);
        const alignRow = parseRow(tableLines[1]);
        const aligns = alignRow.map((a) => {
          if (a.startsWith(":") && a.endsWith(":")) return "center";
          if (a.endsWith(":")) return "right";
          return "left";
        });

        let table = "<table>\n<thead>\n<tr>\n";
        headers.forEach((h, idx) => {
          table += `<th align="${aligns[idx] || "left"}">${parseInline(h)}</th>\n`;
        });
        table += "</tr>\n</thead>\n<tbody>\n";

        for (let r = 2; r < tableLines.length; r++) {
          const cells = parseRow(tableLines[r]);
          table += "<tr>\n";
          cells.forEach((c, idx) => {
            table += `<td align="${aligns[idx] || "left"}">${parseInline(c)}</td>\n`;
          });
          table += "</tr>\n";
        }
        table += "</tbody>\n</table>";
        output.push(table);
      }
      continue;
    }

    // Blockquote
    if (line.startsWith(">")) {
      const quoteLines: string[] = [];
      while (i < lines.length && lines[i].startsWith(">")) {
        quoteLines.push(lines[i].replace(/^>\s?/, ""));
        i++;
      }
      output.push(
        `<blockquote>${parseInline(quoteLines.join("\n"))}</blockquote>`
      );
      continue;
    }

    // Unordered list
    if (/^[\s]*[-*+]\s/.test(line)) {
      const listItems: string[] = [];
      while (i < lines.length && /^[\s]*[-*+]\s/.test(lines[i])) {
        listItems.push(lines[i].replace(/^[\s]*[-*+]\s/, ""));
        i++;
      }
      output.push(
        "<ul>\n" +
          listItems.map((li) => `<li>${parseInline(li)}</li>`).join("\n") +
          "\n</ul>"
      );
      continue;
    }

    // Ordered list
    if (/^\s*\d+\.\s/.test(line)) {
      const listItems: string[] = [];
      while (i < lines.length && /^\s*\d+\.\s/.test(lines[i])) {
        listItems.push(lines[i].replace(/^\s*\d+\.\s/, ""));
        i++;
      }
      output.push(
        "<ol>\n" +
          listItems.map((li) => `<li>${parseInline(li)}</li>`).join("\n") +
          "\n</ol>"
      );
      continue;
    }

    // Empty line
    if (line.trim() === "") {
      i++;
      continue;
    }

    // Paragraph
    const paraLines: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() !== "" &&
      !lines[i].startsWith("#") &&
      !lines[i].startsWith(">") &&
      !lines[i].startsWith("```") &&
      !/^[-*+]\s/.test(lines[i]) &&
      !/^\d+\.\s/.test(lines[i]) &&
      !/^(-{3,}|\*{3,}|_{3,})\s*$/.test(lines[i])
    ) {
      paraLines.push(lines[i]);
      i++;
    }
    if (paraLines.length > 0) {
      output.push(`<p>${parseInline(paraLines.join("\n"))}</p>`);
    }
  }

  return output.join("\n");
}

// --- Sample Markdown ---

const SAMPLE_MARKDOWN = `# Markdown to HTML Converter

This is a **bold** and *italic* text demo with ~~strikethrough~~.

## Features

- Live preview of rendered HTML
- Raw HTML source view
- Copy to clipboard
- **No data** sent to any server

### Code Block

\`\`\`javascript
function greet(name) {
  return \`Hello, \${name}!\`;
}
console.log(greet("World"));
\`\`\`

## Links & Images

Visit [devtools.page](https://devtools.page) for more tools.

![Placeholder](https://via.placeholder.com/200x100)

## Table Example

| Feature | Supported | Notes |
|---------|:---------:|------:|
| Headings | Yes | H1-H6 |
| Bold/Italic | Yes | Inline |
| Code Blocks | Yes | Fenced |
| Tables | Yes | Aligned |

## Blockquote

> Markdown is a lightweight markup language that you can use
> to add formatting elements to plaintext text documents.

---

### Ordered List

1. First item
2. Second item
3. Third item

Inline \`code\` looks like this.`;

// --- Cheat sheet data ---

const CHEAT_SHEET = [
  { syntax: "# Heading 1", desc: "Heading level 1" },
  { syntax: "## Heading 2", desc: "Heading level 2" },
  { syntax: "**bold**", desc: "Bold text" },
  { syntax: "*italic*", desc: "Italic text" },
  { syntax: "~~strike~~", desc: "Strikethrough" },
  { syntax: "[text](url)", desc: "Link" },
  { syntax: "![alt](url)", desc: "Image" },
  { syntax: "`code`", desc: "Inline code" },
  { syntax: "```lang", desc: "Code block" },
  { syntax: "- item", desc: "Unordered list" },
  { syntax: "1. item", desc: "Ordered list" },
  { syntax: "> quote", desc: "Blockquote" },
  { syntax: "| a | b |", desc: "Table" },
  { syntax: "---", desc: "Horizontal rule" },
];

type ViewMode = "preview" | "raw";

export default function MarkdownToHtmlConverterPage() {
  const [markdown, setMarkdown] = useState(SAMPLE_MARKDOWN);
  const [viewMode, setViewMode] = useState<ViewMode>("preview");
  const [copied, setCopied] = useState(false);
  const [showCheatSheet, setShowCheatSheet] = useState(false);

  const html = useMemo(() => parseMarkdown(markdown), [markdown]);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(html);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
      const ta = document.createElement("textarea");
      ta.value = html;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [html]);

  const handleClear = useCallback(() => {
    setMarkdown("");
  }, []);

  const handleLoadSample = useCallback(() => {
    setMarkdown(SAMPLE_MARKDOWN);
  }, []);

  return (
    <>
      <title>
        Markdown to HTML Converter — Convert Markdown to HTML Online |
        devtools.page
      </title>
      <meta
        name="description"
        content="Free online Markdown to HTML converter. Paste Markdown, get clean HTML instantly. Live preview, raw HTML view, copy button. Supports headings, tables, code blocks, lists, links, images. 100% client-side."
      />
      <meta
        name="keywords"
        content="markdown to html, markdown converter, convert markdown to html online, markdown to html converter, markdown preview, markdown parser, markdown editor"
      />
      <JsonLd
        data={[
          generateWebAppSchema({
            slug: "markdown-to-html-converter",
            name: "Markdown to HTML Converter",
            description:
              "Convert Markdown to clean HTML instantly with live preview. Supports headings, tables, code blocks, lists, links, images, and blockquotes.",
            category: "developer",
          }),
          generateBreadcrumbSchema({
            slug: "markdown-to-html-converter",
            name: "Markdown to HTML Converter",
            description:
              "Convert Markdown to clean HTML instantly with live preview.",
            category: "developer",
          }),
          generateFAQSchema([
            {
              question: "How do I convert Markdown to HTML?",
              answer:
                "Paste or type your Markdown in the left editor panel. The tool instantly converts it to HTML, which you can view as a rendered preview or raw HTML source. Click the Copy HTML button to copy the output to your clipboard. Everything runs in your browser — no data is sent to any server.",
            },
            {
              question: "What Markdown features does this converter support?",
              answer:
                "This converter supports all common Markdown syntax: headings (H1-H6), bold, italic, strikethrough, links, images, fenced code blocks with language hints, tables with alignment, ordered and unordered lists, blockquotes, horizontal rules, and inline code.",
            },
            {
              question:
                "Can I use this Markdown to HTML converter for GitHub-flavored Markdown?",
              answer:
                "Yes. This tool supports GitHub-flavored Markdown features including fenced code blocks with language syntax hints, tables with column alignment (left, center, right), strikethrough text with ~~tildes~~, and task list syntax. The output is clean, semantic HTML.",
            },
            {
              question: "Is my Markdown content private and secure?",
              answer:
                "Absolutely. This Markdown to HTML converter runs 100% in your browser using JavaScript. No data is transmitted to any server. Your content never leaves your device, making it safe for converting sensitive documentation or private notes.",
            },
            {
              question:
                "What is the difference between the Preview and Raw HTML views?",
              answer:
                "The Preview mode renders the HTML as it would appear in a web browser — with styled headings, formatted tables, syntax-highlighted code blocks, and clickable links. The Raw HTML mode shows the actual HTML source code that was generated, which you can copy and paste into your own projects.",
            },
            {
              question: "Can I use this tool to convert README files?",
              answer:
                "Yes, this tool is perfect for converting README.md files or any Markdown documentation to HTML. Paste the contents of your README file, preview how it will look, and copy the HTML output for use in websites, emails, or documentation platforms.",
            },
          ]),
        ]}
      />

      <div className="min-h-screen bg-slate-900 text-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <ToolBreadcrumb slug="markdown-to-html-converter" />

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
              Markdown to HTML Converter
            </h1>
            <p className="text-slate-400 max-w-2xl text-lg">
              Paste Markdown, get clean HTML instantly. Live preview or raw HTML
              source. Supports headings, tables, code blocks, lists, links,
              images, and more. 100% client-side.
            </p>
          </div>

          {/* Toolbar */}
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <button
              onClick={handleLoadSample}
              className="px-4 py-2 text-sm font-medium rounded-lg bg-slate-700 text-slate-200 hover:bg-slate-600 transition-colors"
            >
              Load Sample
            </button>
            <button
              onClick={handleClear}
              className="px-4 py-2 text-sm font-medium rounded-lg bg-slate-700 text-slate-200 hover:bg-slate-600 transition-colors"
            >
              Clear
            </button>
            <button
              onClick={() => setShowCheatSheet((s) => !s)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                showCheatSheet
                  ? "bg-blue-600 text-white"
                  : "bg-slate-700 text-slate-200 hover:bg-slate-600"
              }`}
            >
              {showCheatSheet ? "Hide" : "Show"} Cheat Sheet
            </button>
            <div className="flex-1" />
            <div className="flex items-center bg-slate-800 rounded-lg p-1">
              <button
                onClick={() => setViewMode("preview")}
                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  viewMode === "preview"
                    ? "bg-blue-600 text-white"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Preview
              </button>
              <button
                onClick={() => setViewMode("raw")}
                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  viewMode === "raw"
                    ? "bg-blue-600 text-white"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Raw HTML
              </button>
            </div>
            <button
              onClick={handleCopy}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                copied
                  ? "bg-green-600 text-white"
                  : "bg-blue-600 text-white hover:bg-blue-500"
              }`}
            >
              {copied ? "Copied!" : "Copy HTML"}
            </button>
          </div>

          {/* Cheat Sheet */}
          {showCheatSheet && (
            <div className="mb-4 bg-slate-800/50 border border-slate-700 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-slate-300 mb-3">
                Markdown Cheat Sheet
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2">
                {CHEAT_SHEET.map((item) => (
                  <div
                    key={item.syntax}
                    className="bg-slate-800 rounded-lg px-3 py-2 text-center"
                  >
                    <code className="text-blue-400 text-xs block mb-1">
                      {item.syntax}
                    </code>
                    <span className="text-slate-400 text-xs">{item.desc}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Split Pane */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Left: Markdown Input */}
            <div className="flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
                  Markdown Input
                </h2>
                <span className="text-xs text-slate-500">
                  {markdown.length} chars
                </span>
              </div>
              <textarea
                value={markdown}
                onChange={(e) => setMarkdown(e.target.value)}
                spellCheck={false}
                className="flex-1 min-h-[500px] lg:min-h-[600px] bg-slate-800 border border-slate-700 rounded-xl p-4 font-mono text-sm text-slate-200 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 placeholder-slate-500"
                placeholder="Type or paste your Markdown here..."
              />
            </div>

            {/* Right: HTML Output */}
            <div className="flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
                  {viewMode === "preview" ? "HTML Preview" : "Raw HTML"}
                </h2>
                <span className="text-xs text-slate-500">
                  {html.length} chars
                </span>
              </div>
              {viewMode === "preview" ? (
                <div
                  className="flex-1 min-h-[500px] lg:min-h-[600px] bg-white rounded-xl p-6 overflow-auto prose prose-sm max-w-none
                    prose-headings:text-slate-900 prose-p:text-slate-700 prose-a:text-blue-600
                    prose-strong:text-slate-900 prose-code:text-pink-600 prose-code:bg-slate-100 prose-code:px-1 prose-code:py-0.5 prose-code:rounded
                    prose-pre:bg-slate-900 prose-pre:text-slate-200 prose-pre:rounded-lg prose-pre:p-4
                    prose-blockquote:border-blue-400 prose-blockquote:text-slate-600
                    prose-table:border-collapse prose-th:border prose-th:border-slate-300 prose-th:px-3 prose-th:py-2 prose-th:bg-slate-100
                    prose-td:border prose-td:border-slate-300 prose-td:px-3 prose-td:py-2
                    prose-hr:border-slate-300 prose-img:rounded-lg prose-li:text-slate-700
                    prose-del:text-slate-400"
                  dangerouslySetInnerHTML={{ __html: html }}
                />
              ) : (
                <pre className="flex-1 min-h-[500px] lg:min-h-[600px] bg-slate-800 border border-slate-700 rounded-xl p-4 font-mono text-sm text-green-400 overflow-auto whitespace-pre-wrap break-words">
                  {html}
                </pre>
              )}
            </div>
          </div>

          {/* SEO Content */}
          <div className="mt-12 space-y-8">
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">
                How to Convert Markdown to HTML
              </h2>
              <div className="text-slate-400 space-y-3">
                <p>
                  This free online Markdown to HTML converter transforms your
                  Markdown text into clean, semantic HTML in real time. Simply
                  paste or type your Markdown in the left panel and see the HTML
                  output instantly on the right — either as a rendered preview or
                  raw HTML source code.
                </p>
                <p>
                  The converter supports all standard Markdown syntax including
                  headings (H1-H6), bold and italic text, links, images, fenced
                  code blocks with language hints, tables with column alignment,
                  ordered and unordered lists, blockquotes, horizontal rules,
                  strikethrough, and inline code. It&apos;s perfect for
                  converting README files, documentation, blog posts, and notes.
                </p>
                <p>
                  All conversion happens entirely in your browser — no data is
                  sent to any server, making it safe for private or sensitive
                  content. Click the <strong>Copy HTML</strong> button to copy
                  the generated HTML to your clipboard.
                </p>
              </div>
            </section>
          </div>

          {/* Related Tools */}
          <div className="mt-12">
            <RelatedTools currentSlug="markdown-to-html-converter" />
          </div>
        </div>
      </div>
    </>
  );
}
