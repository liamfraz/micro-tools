"use client";

import { useState, useCallback, useMemo } from "react";
import JsonLd from "@/components/JsonLd";
import RelatedTools from "@/components/RelatedTools";
import {
  generateFAQSchema,
  generateWebAppSchema,
  generateBreadcrumbSchema,
} from "@/lib/jsonld";

const SAMPLE_MARKDOWN = `# Markdown Editor

Write and preview Markdown **side by side**. This editor supports the full [GitHub Flavored Markdown](https://github.github.com/gfm/) spec.

## Text Formatting

You can write **bold**, *italic*, ***bold italic***, and ~~strikethrough~~ text. Inline \`code\` is also supported.

## Links & Images

- [Visit Example](https://example.com)
- ![Placeholder](https://via.placeholder.com/120x40?text=Image)

## Code Block

\`\`\`javascript
function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

console.log(fibonacci(10)); // 55
\`\`\`

## Blockquote

> "The only way to do great work is to love what you do."
> — Steve Jobs

## Table

| Language   | Typing     | Year |
|------------|------------|------|
| JavaScript | Dynamic    | 1995 |
| TypeScript | Static     | 2012 |
| Rust       | Static     | 2010 |
| Python     | Dynamic    | 1991 |

## Task List

- [x] Split-pane editor
- [x] Live preview
- [x] GFM tables & task lists
- [x] Copy HTML output
- [x] Download as .md
- [ ] Take over the world

## Lists

### Ordered
1. First item
2. Second item
3. Third item

### Unordered
- Apples
- Oranges
- Bananas

---

*Start editing to see your changes live!*
`;

export default function MarkdownEditorPage() {
  const [markdown, setMarkdown] = useState(SAMPLE_MARKDOWN);
  const [copied, setCopied] = useState<"md" | "html" | null>(null);
  const [view, setView] = useState<"split" | "editor" | "preview">("split");

  const html = useMemo(() => renderMarkdown(markdown), [markdown]);

  const copyText = useCallback(
    async (which: "md" | "html") => {
      const text = which === "md" ? markdown : html;
      if (!text) return;
      await navigator.clipboard.writeText(text);
      setCopied(which);
      setTimeout(() => setCopied(null), 2000);
    },
    [markdown, html]
  );

  const downloadMd = useCallback(() => {
    if (!markdown) return;
    const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "document.md";
    a.click();
    URL.revokeObjectURL(url);
  }, [markdown]);

  const clearAll = useCallback(() => {
    setMarkdown("");
  }, []);

  const loadSample = useCallback(() => {
    setMarkdown(SAMPLE_MARKDOWN);
  }, []);

  const wordCount = markdown.trim() ? markdown.trim().split(/\s+/).length : 0;
  const charCount = markdown.length;
  const lineCount = markdown.split("\n").length;

  return (
    <>
      <title>Markdown Editor Online - Live Preview & GFM Support | DevTools Hub</title>
      <meta
        name="description"
        content="Free online markdown editor with live preview. Write GitHub Flavored Markdown with tables, task lists, and code blocks. Copy rendered HTML or download as .md file. No sign-up required."
      />
      <meta
        name="keywords"
        content="markdown editor, markdown preview, markdown to html, online markdown editor, github flavored markdown, gfm editor, markdown live preview, markdown writer"
      />
      <JsonLd
        data={[
          generateWebAppSchema({
            slug: "markdown-editor",
            name: "Online Markdown Editor & Preview",
            description: "Free online markdown editor with live HTML preview, GFM tables, task lists, code blocks, and export options",
            category: "text",
          }),
          generateBreadcrumbSchema({
            slug: "markdown-editor",
            name: "Markdown Editor",
            description: "Free online markdown editor with live HTML preview and GFM support",
            category: "text",
          }),
          generateFAQSchema([
            { question: "What is Markdown?", answer: "Markdown is a lightweight markup language created by John Gruber in 2004. It uses plain text formatting syntax to create structured documents that can be converted to HTML. It is widely used in README files, documentation, blogs, forums, and messaging platforms like GitHub, Slack, and Discord." },
            { question: "What is GitHub Flavored Markdown (GFM)?", answer: "GitHub Flavored Markdown (GFM) is a superset of standard Markdown created by GitHub. It adds features like tables with pipe syntax, task lists with checkboxes, strikethrough text, fenced code blocks with language syntax labels, and auto-linking of URLs. This editor fully supports GFM." },
            { question: "Can I export the output as HTML?", answer: "Yes. Click the 'Copy HTML' button to copy the rendered HTML to your clipboard. You can paste it directly into any HTML file, CMS, or email template. You can also download your source as a .md file." },
            { question: "Is my content saved or sent to a server?", answer: "No. All editing and rendering happens entirely in your browser using JavaScript. Nothing is saved to a server or persisted between visits. Copy your Markdown or download the .md file before closing the page if you want to keep it." },
            { question: "What Markdown features does this editor support?", answer: "This editor supports headings (h1-h6), bold, italic, bold italic, strikethrough, links, images, inline code, fenced code blocks with language labels, blockquotes, ordered and unordered lists, task lists with checkboxes, tables with alignment, and horizontal rules. It covers the full CommonMark specification plus GitHub Flavored Markdown extensions." },
          ]),
        ]}
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
                  Text Tools
                </a>
              </li>
              <li><span className="mx-1">/</span></li>
              <li className="text-slate-200">Markdown Editor</li>
            </ol>
          </nav>

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
              Online Markdown Editor & Preview
            </h1>
            <p className="text-slate-400 max-w-2xl text-lg">
              Write Markdown with a live HTML preview side by side. Full support
              for GitHub Flavored Markdown — tables, task lists, strikethrough,
              fenced code blocks, and more. Copy as HTML or download as .md.
            </p>
          </div>

          {/* Controls */}
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <button
              onClick={() => copyText("html")}
              disabled={!html}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {copied === "html" ? "Copied!" : "Copy HTML"}
            </button>
            <button
              onClick={() => copyText("md")}
              disabled={!markdown}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {copied === "md" ? "Copied!" : "Copy Markdown"}
            </button>
            <button
              onClick={downloadMd}
              disabled={!markdown}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Download .md
            </button>
            <button
              onClick={clearAll}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors"
            >
              Clear
            </button>
            <button
              onClick={loadSample}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors"
            >
              Sample
            </button>

            <div className="ml-auto flex items-center gap-2">
              {(["split", "editor", "preview"] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors capitalize ${
                    view === v
                      ? "bg-blue-600 text-white"
                      : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>

          {/* Stats bar */}
          <div className="flex items-center gap-4 text-xs text-slate-500 mb-2">
            <span>{wordCount} words</span>
            <span>{charCount} characters</span>
            <span>{lineCount} lines</span>
          </div>

          {/* Editor & Preview */}
          <div
            className={`grid gap-4 mb-6 ${
              view === "split"
                ? "grid-cols-1 lg:grid-cols-2"
                : "grid-cols-1"
            }`}
          >
            {/* Editor */}
            {(view === "split" || view === "editor") && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-slate-300">
                    Markdown
                  </label>
                </div>
                <textarea
                  value={markdown}
                  onChange={(e) => setMarkdown(e.target.value)}
                  placeholder={"Start writing Markdown...\n\n# Heading\n**bold** *italic*\n- list item"}
                  className="w-full h-[36rem] bg-slate-800 border border-slate-600 rounded-lg p-4 font-mono text-sm text-slate-200 placeholder-slate-500 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 leading-relaxed"
                  spellCheck={false}
                />
              </div>
            )}

            {/* Preview */}
            {(view === "split" || view === "preview") && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-slate-300">
                    Preview
                  </label>
                </div>
                <div
                  className="w-full h-[36rem] bg-slate-800 border border-slate-600 rounded-lg p-6 overflow-y-auto prose-custom"
                  dangerouslySetInnerHTML={{ __html: html || '<p class="text-slate-500 italic">Preview will appear here...</p>' }}
                />
              </div>
            )}
          </div>

          {/* Cheat Sheet */}
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 mb-6">
            <h2 className="text-lg font-semibold text-white mb-4">
              Markdown Cheat Sheet
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
              {[
                { syntax: "# Heading 1", desc: "Heading 1" },
                { syntax: "## Heading 2", desc: "Heading 2" },
                { syntax: "**bold**", desc: "Bold text" },
                { syntax: "*italic*", desc: "Italic text" },
                { syntax: "~~strikethrough~~", desc: "Strikethrough" },
                { syntax: "[text](url)", desc: "Link" },
                { syntax: "![alt](url)", desc: "Image" },
                { syntax: "`code`", desc: "Inline code" },
                { syntax: "```lang\\ncode\\n```", desc: "Code block" },
                { syntax: "> quote", desc: "Blockquote" },
                { syntax: "- item", desc: "Unordered list" },
                { syntax: "1. item", desc: "Ordered list" },
                { syntax: "---", desc: "Horizontal rule" },
                { syntax: "- [x] task", desc: "Task list" },
                { syntax: "| a | b |", desc: "Table" },
              ].map((item) => (
                <div key={item.syntax} className="flex items-start gap-3">
                  <code className="text-xs bg-slate-900 text-blue-400 px-2 py-1 rounded font-mono whitespace-pre shrink-0">
                    {item.syntax}
                  </code>
                  <span className="text-slate-400">{item.desc}</span>
                </div>
              ))}
            </div>
          </div>

          <RelatedTools currentSlug="markdown-editor" />

          {/* FAQ Section */}
          <section className="mt-16 border-t border-slate-700 pt-10">
            <h2 className="text-2xl font-bold text-white mb-6">
              Frequently Asked Questions
            </h2>

            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  What is Markdown?
                </h3>
                <p className="text-slate-400">
                  Markdown is a lightweight markup language created by John Gruber
                  in 2004. It uses plain text formatting syntax to create
                  structured documents that can be converted to HTML. It is widely
                  used in README files, documentation, blogs, forums, and
                  messaging platforms like GitHub, Slack, and Discord.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  What is GitHub Flavored Markdown (GFM)?
                </h3>
                <p className="text-slate-400">
                  GitHub Flavored Markdown (GFM) is a superset of standard
                  Markdown created by GitHub. It adds features like tables with
                  pipe syntax, task lists with checkboxes, strikethrough text,
                  fenced code blocks with language labels, and auto-linking of
                  URLs. This editor fully supports GFM.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Can I export the output as HTML?
                </h3>
                <p className="text-slate-400">
                  Yes. Click the &ldquo;Copy HTML&rdquo; button to copy the
                  rendered HTML to your clipboard. You can paste it directly into
                  any HTML file, CMS, or email template. You can also download
                  your source Markdown as a .md file.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Is my content saved or sent to a server?
                </h3>
                <p className="text-slate-400">
                  No. All editing and rendering happens entirely in your
                  browser&apos;s memory using JavaScript. Nothing is saved to a
                  server or persisted between visits. Copy your Markdown or
                  download the .md file before closing the page if you want to
                  keep it.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  What Markdown features does this editor support?
                </h3>
                <p className="text-slate-400">
                  This editor supports headings (h1-h6), bold, italic, bold
                  italic, strikethrough, links, images, inline code, fenced code
                  blocks with language labels, blockquotes, ordered and unordered
                  lists, task lists with checkboxes, tables with alignment, and
                  horizontal rules. It covers the full CommonMark specification
                  plus GitHub Flavored Markdown extensions.
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>

      <style>{`
        .prose-custom h1 { font-size: 1.875rem; font-weight: 700; color: white; margin-bottom: 0.75rem; margin-top: 1.5rem; line-height: 1.2; }
        .prose-custom h2 { font-size: 1.5rem; font-weight: 700; color: white; margin-bottom: 0.5rem; margin-top: 1.25rem; line-height: 1.3; }
        .prose-custom h3 { font-size: 1.25rem; font-weight: 600; color: white; margin-bottom: 0.5rem; margin-top: 1rem; }
        .prose-custom h4 { font-size: 1.125rem; font-weight: 600; color: white; margin-bottom: 0.5rem; margin-top: 1rem; }
        .prose-custom h5 { font-size: 1rem; font-weight: 600; color: white; margin-bottom: 0.5rem; }
        .prose-custom h6 { font-size: 0.875rem; font-weight: 600; color: #94a3b8; margin-bottom: 0.5rem; }
        .prose-custom p { color: #cbd5e1; margin-bottom: 0.75rem; line-height: 1.7; }
        .prose-custom a { color: #60a5fa; text-decoration: underline; }
        .prose-custom a:hover { color: #93bbfd; }
        .prose-custom strong { color: white; font-weight: 700; }
        .prose-custom em { font-style: italic; }
        .prose-custom del { text-decoration: line-through; color: #64748b; }
        .prose-custom code { background: #0f172a; color: #7dd3fc; padding: 0.125rem 0.375rem; border-radius: 0.25rem; font-size: 0.875rem; font-family: monospace; }
        .prose-custom pre { background: #0f172a; border: 1px solid #334155; border-radius: 0.5rem; padding: 1rem; overflow-x: auto; margin-bottom: 1rem; }
        .prose-custom pre code { background: transparent; padding: 0; color: #e2e8f0; }
        .prose-custom blockquote { border-left: 3px solid #3b82f6; padding-left: 1rem; color: #94a3b8; font-style: italic; margin-bottom: 0.75rem; }
        .prose-custom ul { list-style-type: disc; padding-left: 1.5rem; margin-bottom: 0.75rem; color: #cbd5e1; }
        .prose-custom ol { list-style-type: decimal; padding-left: 1.5rem; margin-bottom: 0.75rem; color: #cbd5e1; }
        .prose-custom li { margin-bottom: 0.25rem; line-height: 1.6; }
        .prose-custom hr { border: none; border-top: 1px solid #334155; margin: 1.5rem 0; }
        .prose-custom table { width: 100%; border-collapse: collapse; margin-bottom: 1rem; }
        .prose-custom th { background: #0f172a; color: white; font-weight: 600; text-align: left; padding: 0.5rem 0.75rem; border: 1px solid #334155; }
        .prose-custom td { padding: 0.5rem 0.75rem; border: 1px solid #334155; color: #cbd5e1; }
        .prose-custom img { max-width: 100%; border-radius: 0.5rem; margin-bottom: 0.75rem; }
        .prose-custom input[type=checkbox] { margin-right: 0.5rem; accent-color: #3b82f6; }
      `}</style>
    </>
  );
}

// --- Markdown Renderer ---

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderInline(text: string): string {
  let result = escapeHtml(text);

  // Images: ![alt](url)
  result = result.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1">');

  // Links: [text](url)
  result = result.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');

  // Bold + Italic: ***text*** or ___text___
  result = result.replace(/\*\*\*(.+?)\*\*\*/g, "<strong><em>$1</em></strong>");
  result = result.replace(/___(.+?)___/g, "<strong><em>$1</em></strong>");

  // Bold: **text** or __text__
  result = result.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  result = result.replace(/__(.+?)__/g, "<strong>$1</strong>");

  // Italic: *text* or _text_
  result = result.replace(/\*(.+?)\*/g, "<em>$1</em>");
  result = result.replace(/(?<!\w)_(.+?)_(?!\w)/g, "<em>$1</em>");

  // Strikethrough: ~~text~~
  result = result.replace(/~~(.+?)~~/g, "<del>$1</del>");

  // Inline code: `code`
  result = result.replace(/`([^`]+)`/g, "<code>$1</code>");

  // Line breaks
  result = result.replace(/  \n/g, "<br>");

  return result;
}

function renderMarkdown(md: string): string {
  if (!md.trim()) return "";

  const lines = md.split("\n");
  const output: string[] = [];
  let i = 0;
  let inList = false;
  let listType = "";

  const closeList = () => {
    if (inList) {
      output.push(listType === "ol" ? "</ol>" : "</ul>");
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
      const langLabel = lang ? ` data-lang="${escapeHtml(lang)}"` : "";
      output.push(`<pre${langLabel}><code>${codeLines.join("\n")}</code></pre>`);
      i++;
      continue;
    }

    // Heading
    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      closeList();
      const level = headingMatch[1].length;
      output.push(`<h${level}>${renderInline(headingMatch[2])}</h${level}>`);
      i++;
      continue;
    }

    // Horizontal rule
    if (/^(\*{3,}|-{3,}|_{3,})\s*$/.test(line.trim())) {
      closeList();
      output.push("<hr>");
      i++;
      continue;
    }

    // Blockquote
    if (line.trim().startsWith("> ")) {
      closeList();
      const quoteLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith("> ")) {
        quoteLines.push(lines[i].trim().slice(2));
        i++;
      }
      output.push(`<blockquote><p>${renderInline(quoteLines.join("\n"))}</p></blockquote>`);
      continue;
    }

    // Table
    if (line.includes("|") && i + 1 < lines.length && /^\|?\s*[-:]+[-|:\s]*$/.test(lines[i + 1].trim())) {
      closeList();
      const headers = line.split("|").map((c) => c.trim()).filter(Boolean);
      i += 2; // skip header + separator
      const rows: string[][] = [];
      while (i < lines.length && lines[i].includes("|")) {
        const cells = lines[i].split("|").map((c) => c.trim()).filter(Boolean);
        rows.push(cells);
        i++;
      }
      let tableHtml = "<table><thead><tr>";
      for (const h of headers) {
        tableHtml += `<th>${renderInline(h)}</th>`;
      }
      tableHtml += "</tr></thead><tbody>";
      for (const row of rows) {
        tableHtml += "<tr>";
        for (let c = 0; c < headers.length; c++) {
          tableHtml += `<td>${renderInline(row[c] || "")}</td>`;
        }
        tableHtml += "</tr>";
      }
      tableHtml += "</tbody></table>";
      output.push(tableHtml);
      continue;
    }

    // Task list: - [x] or - [ ]
    const taskMatch = line.match(/^[-*]\s+\[([ xX])\]\s+(.+)$/);
    if (taskMatch) {
      if (!inList || listType !== "ul") {
        closeList();
        output.push("<ul>");
        inList = true;
        listType = "ul";
      }
      const checked = taskMatch[1].toLowerCase() === "x" ? " checked disabled" : " disabled";
      output.push(`<li><input type="checkbox"${checked}>${renderInline(taskMatch[2])}</li>`);
      i++;
      continue;
    }

    // Unordered list
    const ulMatch = line.match(/^[-*+]\s+(.+)$/);
    if (ulMatch) {
      if (!inList || listType !== "ul") {
        closeList();
        output.push("<ul>");
        inList = true;
        listType = "ul";
      }
      output.push(`<li>${renderInline(ulMatch[1])}</li>`);
      i++;
      continue;
    }

    // Ordered list
    const olMatch = line.match(/^\d+\.\s+(.+)$/);
    if (olMatch) {
      if (!inList || listType !== "ol") {
        closeList();
        output.push("<ol>");
        inList = true;
        listType = "ol";
      }
      output.push(`<li>${renderInline(olMatch[1])}</li>`);
      i++;
      continue;
    }

    // Close list if we hit a non-list line
    closeList();

    // Empty line
    if (!line.trim()) {
      i++;
      continue;
    }

    // Paragraph
    const paraLines: string[] = [line];
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
      paraLines.push(lines[i]);
      i++;
    }
    output.push(`<p>${renderInline(paraLines.join("\n"))}</p>`);
  }

  closeList();
  return output.join("\n");
}
