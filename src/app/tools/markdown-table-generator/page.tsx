"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import JsonLd from "@/components/JsonLd";
import RelatedTools from "@/components/RelatedTools";
import ToolBreadcrumb from "@/components/ToolBreadcrumb";
import {
  generateFAQSchema,
  generateWebAppSchema,
  generateBreadcrumbSchema,
} from "@/lib/jsonld";

interface CellRef {
  row: number;
  col: number;
}

function generateMarkdown(
  headers: string[],
  alignments: ("left" | "center" | "right")[],
  rows: string[][]
): string {
  const escape = (s: string) =>
    s.replace(/\|/g, "\\|").replace(/\n/g, " ");

  const headerLine =
    "| " + headers.map((h) => escape(h || " ")).join(" | ") + " |";

  const separatorLine =
    "| " +
    alignments
      .map((a) => {
        if (a === "center") return ":---:";
        if (a === "right") return "---:";
        return "---";
      })
      .join(" | ") +
    " |";

  const dataLines = rows.map(
    (row) =>
      "| " +
      row.map((cell) => escape(cell || " ")).join(" | ") +
      " |"
  );

  return [headerLine, separatorLine, ...dataLines].join("\n");
}

export default function MarkdownTableGeneratorPage() {
  const [headers, setHeaders] = useState<string[]>(["Header 1", "Header 2", "Header 3"]);
  const [alignments, setAlignments] = useState<("left" | "center" | "right")[]>(["left", "left", "left"]);
  const [rows, setRows] = useState<string[][]>([
    ["", "", ""],
    ["", "", ""],
    ["", "", ""],
  ]);
  const [copied, setCopied] = useState(false);
  const [importText, setImportText] = useState("");
  const [showImport, setShowImport] = useState(false);
  const cellRefs = useRef<Map<string, HTMLInputElement>>(new Map());

  const markdown = generateMarkdown(headers, alignments, rows);

  const setCellRef = useCallback(
    (row: number, col: number, el: HTMLInputElement | null) => {
      const key = `${row}-${col}`;
      if (el) cellRefs.current.set(key, el);
      else cellRefs.current.delete(key);
    },
    []
  );

  const focusCell = useCallback((row: number, col: number) => {
    const el = cellRefs.current.get(`${row}-${col}`);
    if (el) {
      el.focus();
      el.select();
    }
  }, []);

  const handleCellKeyDown = useCallback(
    (e: React.KeyboardEvent, row: number, col: number, isHeader: boolean) => {
      const totalCols = headers.length;
      const totalRows = rows.length;

      if (e.key === "Tab") {
        e.preventDefault();
        let nextRow = isHeader ? -1 : row;
        let nextCol = col + (e.shiftKey ? -1 : 1);

        if (nextCol >= totalCols) {
          nextCol = 0;
          nextRow = isHeader ? 0 : nextRow + 1;
        } else if (nextCol < 0) {
          nextCol = totalCols - 1;
          nextRow = isHeader ? -1 : nextRow - 1;
        }

        if (nextRow < -1) return;
        if (nextRow >= totalRows && !isHeader) return;
        if (nextRow === -1 && isHeader && e.shiftKey) return;

        const targetRow = nextRow === -1 ? "h" : nextRow;
        const el = cellRefs.current.get(`${targetRow}-${nextCol}`);
        if (el) {
          el.focus();
          el.select();
        }
      } else if (e.key === "ArrowDown" && !isHeader) {
        if (row < totalRows - 1) focusCell(row + 1, col);
      } else if (e.key === "ArrowUp" && !isHeader) {
        if (row > 0) focusCell(row - 1, col);
        else {
          const el = cellRefs.current.get(`h-${col}`);
          if (el) { el.focus(); el.select(); }
        }
      } else if (e.key === "ArrowDown" && isHeader) {
        focusCell(0, col);
      }
    },
    [headers.length, rows.length, focusCell]
  );

  const updateHeader = useCallback((col: number, value: string) => {
    setHeaders((prev) => {
      const next = [...prev];
      next[col] = value;
      return next;
    });
  }, []);

  const updateCell = useCallback((row: number, col: number, value: string) => {
    setRows((prev) => {
      const next = prev.map((r) => [...r]);
      next[row][col] = value;
      return next;
    });
  }, []);

  const cycleAlignment = useCallback((col: number) => {
    setAlignments((prev) => {
      const next = [...prev];
      const order: ("left" | "center" | "right")[] = ["left", "center", "right"];
      const idx = order.indexOf(next[col]);
      next[col] = order[(idx + 1) % 3];
      return next;
    });
  }, []);

  const addColumn = useCallback(() => {
    setHeaders((prev) => [...prev, `Header ${prev.length + 1}`]);
    setAlignments((prev) => [...prev, "left"]);
    setRows((prev) => prev.map((row) => [...row, ""]));
  }, []);

  const removeColumn = useCallback(
    (col: number) => {
      if (headers.length <= 1) return;
      setHeaders((prev) => prev.filter((_, i) => i !== col));
      setAlignments((prev) => prev.filter((_, i) => i !== col));
      setRows((prev) => prev.map((row) => row.filter((_, i) => i !== col)));
    },
    [headers.length]
  );

  const addRow = useCallback(() => {
    setRows((prev) => [...prev, new Array(headers.length).fill("")]);
  }, [headers.length]);

  const removeRow = useCallback(
    (row: number) => {
      if (rows.length <= 1) return;
      setRows((prev) => prev.filter((_, i) => i !== row));
    },
    [rows.length]
  );

  const copyMarkdown = useCallback(async () => {
    await navigator.clipboard.writeText(markdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [markdown]);

  const importFromDelimited = useCallback(() => {
    const text = importText.trim();
    if (!text) return;

    const lines = text.split("\n").filter((l) => l.trim());
    if (lines.length === 0) return;

    const delimiter = lines[0].includes("\t") ? "\t" : ",";
    const parsed = lines.map((line) => {
      const cells: string[] = [];
      let current = "";
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"') {
          inQuotes = !inQuotes;
        } else if (ch === delimiter && !inQuotes) {
          cells.push(current.trim());
          current = "";
        } else {
          current += ch;
        }
      }
      cells.push(current.trim());
      return cells;
    });

    const maxCols = Math.max(...parsed.map((r) => r.length));
    const normalised = parsed.map((r) => {
      while (r.length < maxCols) r.push("");
      return r;
    });

    setHeaders(normalised[0]);
    setAlignments(new Array(maxCols).fill("left"));
    setRows(normalised.length > 1 ? normalised.slice(1) : [new Array(maxCols).fill("")]);
    setShowImport(false);
    setImportText("");
  }, [importText]);

  const alignIcon = (a: "left" | "center" | "right") => {
    if (a === "center") return "┅";
    if (a === "right") return "▸";
    return "◂";
  };

  return (
    <>
      <title>
        Markdown Table Generator - Free Online Tool | DevTools
      </title>
      <meta
        name="description"
        content="Free online Markdown table generator. Visual editor with live preview, CSV/TSV import, column alignment, and one-click copy. Build GitHub-flavoured Markdown tables instantly."
      />
      <meta
        name="keywords"
        content="markdown table generator, markdown table creator, csv to markdown table, github markdown table, markdown table editor, online markdown table, markdown table builder"
      />
      <JsonLd
        data={[
          generateWebAppSchema({
            slug: "markdown-table-generator",
            name: "Markdown Table Generator",
            description:
              "Visual Markdown table editor with live preview, CSV/TSV import, column alignment, and copy to clipboard.",
            category: "text",
          }),
          generateBreadcrumbSchema({
            slug: "markdown-table-generator",
            name: "Markdown Table Generator",
            description:
              "Visual Markdown table editor with live preview, CSV/TSV import, column alignment, and copy to clipboard.",
            category: "text",
          }),
          generateFAQSchema([
            {
              question: "How do I create a Markdown table?",
              answer:
                "Use the visual editor above to add headers, rows, and content. The Markdown output updates in real-time. Click 'Copy Markdown' to copy the result to your clipboard.",
            },
            {
              question: "Can I import data from a spreadsheet?",
              answer:
                "Yes. Click 'Import CSV/TSV', then paste tab-separated or comma-separated data from Excel, Google Sheets, or any other spreadsheet. The first row becomes the table header.",
            },
            {
              question: "How do I set column alignment in Markdown tables?",
              answer:
                "Click the alignment button below each column header to cycle between left, centre, and right alignment. This adds the appropriate colons to the separator row (e.g. :---: for centre).",
            },
            {
              question: "Is my data safe?",
              answer:
                "Yes. Everything runs entirely in your browser. No data is sent to any server.",
            },
          ]),
        ]}
      />

      <div className="min-h-screen bg-slate-900 text-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <ToolBreadcrumb slug="markdown-table-generator" />

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
              Markdown Table Generator
            </h1>
            <p className="text-slate-400 max-w-2xl text-lg">
              Build GitHub-flavoured Markdown tables visually. Edit cells, set
              column alignment, import from CSV/TSV, and copy the output
              instantly.
            </p>
          </div>

          {/* Toolbar */}
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 mb-6 flex flex-wrap gap-3">
            <button
              onClick={addColumn}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              + Column
            </button>
            <button
              onClick={addRow}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              + Row
            </button>
            <button
              onClick={() => setShowImport(!showImport)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                showImport
                  ? "bg-slate-600 text-white"
                  : "bg-slate-700 hover:bg-slate-600 text-white"
              }`}
            >
              Import CSV/TSV
            </button>
            <div className="ml-auto">
              <button
                onClick={copyMarkdown}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                {copied ? "Copied!" : "Copy Markdown"}
              </button>
            </div>
          </div>

          {/* Import Panel */}
          {showImport && (
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 mb-6">
              <p className="text-sm text-slate-400 mb-2">
                Paste comma-separated or tab-separated data below. The first row
                will be used as column headers.
              </p>
              <textarea
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                placeholder={"Name\tAge\tCity\nAlice\t30\tSydney\nBob\t25\tMelbourne"}
                className="w-full h-32 bg-slate-900 border border-slate-600 rounded-lg px-4 py-3 font-mono text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
                spellCheck={false}
              />
              <div className="flex gap-3 mt-3">
                <button
                  onClick={importFromDelimited}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  Import
                </button>
                <button
                  onClick={() => {
                    setShowImport(false);
                    setImportText("");
                  }}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Editor */}
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
              <h2 className="text-lg font-semibold text-white mb-4">Editor</h2>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      <th className="w-8" />
                      {headers.map((header, col) => (
                        <th key={col} className="p-1">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-1">
                              <input
                                ref={(el) => setCellRef("h" as unknown as number, col, el)}
                                value={header}
                                onChange={(e) => updateHeader(col, e.target.value)}
                                onKeyDown={(e) => handleCellKeyDown(e, -1, col, true)}
                                className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1.5 text-sm font-semibold text-white focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[80px]"
                                spellCheck={false}
                              />
                              {headers.length > 1 && (
                                <button
                                  onClick={() => removeColumn(col)}
                                  className="text-slate-500 hover:text-red-400 text-xs shrink-0"
                                  title="Remove column"
                                >
                                  ✕
                                </button>
                              )}
                            </div>
                            <button
                              onClick={() => cycleAlignment(col)}
                              className="text-xs text-slate-400 hover:text-white bg-slate-900 rounded px-2 py-0.5 transition-colors"
                              title={`Alignment: ${alignments[col]}`}
                            >
                              {alignIcon(alignments[col])} {alignments[col]}
                            </button>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, rowIdx) => (
                      <tr key={rowIdx}>
                        <td className="p-1 text-center">
                          {rows.length > 1 && (
                            <button
                              onClick={() => removeRow(rowIdx)}
                              className="text-slate-500 hover:text-red-400 text-xs"
                              title="Remove row"
                            >
                              ✕
                            </button>
                          )}
                        </td>
                        {row.map((cell, colIdx) => (
                          <td key={colIdx} className="p-1">
                            <input
                              ref={(el) => setCellRef(rowIdx, colIdx, el)}
                              value={cell}
                              onChange={(e) =>
                                updateCell(rowIdx, colIdx, e.target.value)
                              }
                              onKeyDown={(e) =>
                                handleCellKeyDown(e, rowIdx, colIdx, false)
                              }
                              className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[80px]"
                              spellCheck={false}
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Preview + Output */}
            <div className="space-y-6">
              {/* Live Preview */}
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
                <h2 className="text-lg font-semibold text-white mb-4">
                  Preview
                </h2>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-sm">
                    <thead>
                      <tr className="border-b-2 border-slate-600">
                        {headers.map((h, i) => (
                          <th
                            key={i}
                            className={`px-3 py-2 font-semibold text-white ${
                              alignments[i] === "center"
                                ? "text-center"
                                : alignments[i] === "right"
                                ? "text-right"
                                : "text-left"
                            }`}
                          >
                            {h || "\u00A0"}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((row, ri) => (
                        <tr
                          key={ri}
                          className="border-b border-slate-700 hover:bg-slate-750"
                        >
                          {row.map((cell, ci) => (
                            <td
                              key={ci}
                              className={`px-3 py-2 text-slate-300 ${
                                alignments[ci] === "center"
                                  ? "text-center"
                                  : alignments[ci] === "right"
                                  ? "text-right"
                                  : "text-left"
                              }`}
                            >
                              {cell || "\u00A0"}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Markdown Output */}
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-lg font-semibold text-white">
                    Markdown Output
                  </h2>
                  <button
                    onClick={copyMarkdown}
                    className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    {copied ? "Copied!" : "Copy"}
                  </button>
                </div>
                <pre className="bg-slate-900 border border-slate-700 rounded-lg p-4 overflow-x-auto">
                  <code className="text-sm font-mono text-slate-200 whitespace-pre">
                    {markdown}
                  </code>
                </pre>
              </div>
            </div>
          </div>

          <RelatedTools currentSlug="markdown-table-generator" />

          {/* FAQ Section */}
          <section className="mt-16 border-t border-slate-700 pt-10">
            <h2 className="text-2xl font-bold text-white mb-6">
              Frequently Asked Questions
            </h2>

            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  How do I create a Markdown table?
                </h3>
                <p className="text-slate-400">
                  Use the visual editor above to add headers, rows, and content.
                  The Markdown output updates in real-time. Click
                  &ldquo;Copy Markdown&rdquo; to copy the result to your
                  clipboard.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Can I import data from a spreadsheet?
                </h3>
                <p className="text-slate-400">
                  Yes. Click &ldquo;Import CSV/TSV&rdquo;, then paste
                  tab-separated or comma-separated data from Excel, Google
                  Sheets, or any other spreadsheet. The first row becomes the
                  table header.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  How do I set column alignment in Markdown tables?
                </h3>
                <p className="text-slate-400">
                  Click the alignment button below each column header to cycle
                  between left, centre, and right alignment. This adds the
                  appropriate colons to the separator row (e.g. :---: for
                  centre).
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Is my data safe?
                </h3>
                <p className="text-slate-400">
                  Yes. Everything runs entirely in your browser. No data is sent
                  to any server.
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
