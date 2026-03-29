"use client";

import { useState, useCallback, useMemo } from "react";
import JsonLd from "@/components/JsonLd";
import RelatedTools from "@/components/RelatedTools";
import ToolBreadcrumb from "@/components/ToolBreadcrumb";
import AdUnit from "@/components/AdUnit";
import {
  generateFAQSchema,
  generateWebAppSchema,
  generateBreadcrumbSchema,
} from "@/lib/jsonld";

type IndentStyle = "2-spaces" | "4-spaces" | "tab";

interface FormatOptions {
  indentStyle: IndentStyle;
  preserveComments: boolean;
  sortAttributes: boolean;
}

interface TokenNode {
  type: "element" | "text" | "comment" | "cdata" | "processing" | "doctype";
  tag?: string;
  attrs?: string;
  children?: TokenNode[];
  content?: string;
  selfClosing?: boolean;
}

interface XmlError {
  message: string;
  line: number | null;
  column: number | null;
}

/* ─── XML Parser ─── */

function parseXML(xml: string): { nodes: TokenNode[]; error: XmlError | null } {
  let pos = 0;

  function getLineCol(): { line: number; col: number } {
    const before = xml.substring(0, pos);
    const lines = before.split("\n");
    return { line: lines.length, col: lines[lines.length - 1].length + 1 };
  }

  const skipWhitespace = () => {
    while (pos < xml.length && /\s/.test(xml[pos])) pos++;
  };

  const parseNodes = (): TokenNode[] => {
    const result: TokenNode[] = [];

    while (pos < xml.length) {
      if (xml[pos] === "<") {
        // Closing tag — parent will handle
        if (xml[pos + 1] === "/") break;

        // Comment
        if (xml.substring(pos, pos + 4) === "<!--") {
          const end = xml.indexOf("-->", pos + 4);
          if (end === -1) {
            const lc = getLineCol();
            throw { message: "Unclosed comment", line: lc.line, col: lc.col };
          }
          result.push({ type: "comment", content: xml.substring(pos + 4, end).trim() });
          pos = end + 3;
          continue;
        }

        // CDATA
        if (xml.substring(pos, pos + 9) === "<![CDATA[") {
          const end = xml.indexOf("]]>", pos + 9);
          if (end === -1) {
            const lc = getLineCol();
            throw { message: "Unclosed CDATA section", line: lc.line, col: lc.col };
          }
          result.push({ type: "cdata", content: xml.substring(pos + 9, end) });
          pos = end + 3;
          continue;
        }

        // Processing instruction
        if (xml.substring(pos, pos + 2) === "<?") {
          const end = xml.indexOf("?>", pos + 2);
          if (end === -1) {
            const lc = getLineCol();
            throw { message: "Unclosed processing instruction", line: lc.line, col: lc.col };
          }
          result.push({ type: "processing", content: xml.substring(pos + 2, end).trim() });
          pos = end + 2;
          continue;
        }

        // DOCTYPE
        if (xml.substring(pos, pos + 9).toUpperCase() === "<!DOCTYPE") {
          const end = xml.indexOf(">", pos + 9);
          if (end === -1) {
            const lc = getLineCol();
            throw { message: "Unclosed DOCTYPE declaration", line: lc.line, col: lc.col };
          }
          result.push({ type: "doctype", content: xml.substring(pos + 2, end).trim() });
          pos = end + 1;
          continue;
        }

        // Element
        const tagStartLC = getLineCol();
        pos++; // skip <
        skipWhitespace();

        // Read tag name
        let tag = "";
        while (pos < xml.length && !/[\s/>]/.test(xml[pos])) {
          tag += xml[pos];
          pos++;
        }
        if (!tag) {
          throw { message: "Expected tag name", line: tagStartLC.line, col: tagStartLC.col };
        }

        // Read attributes
        let attrs = "";
        skipWhitespace();
        while (pos < xml.length && xml[pos] !== ">" && xml[pos] !== "/") {
          if (xml[pos] === '"') {
            attrs += '"';
            pos++;
            while (pos < xml.length && xml[pos] !== '"') {
              attrs += xml[pos];
              pos++;
            }
            if (pos < xml.length) {
              attrs += '"';
              pos++;
            }
          } else if (xml[pos] === "'") {
            attrs += "'";
            pos++;
            while (pos < xml.length && xml[pos] !== "'") {
              attrs += xml[pos];
              pos++;
            }
            if (pos < xml.length) {
              attrs += "'";
              pos++;
            }
          } else {
            attrs += xml[pos];
            pos++;
          }
        }
        attrs = attrs.trim();

        // Self-closing?
        let selfClosing = false;
        if (pos < xml.length && xml[pos] === "/") {
          selfClosing = true;
          pos++;
        }
        if (pos < xml.length && xml[pos] === ">") {
          pos++;
        } else {
          throw { message: `Unclosed opening tag <${tag}>`, line: tagStartLC.line, col: tagStartLC.col };
        }

        const node: TokenNode = { type: "element", tag, selfClosing };
        if (attrs) node.attrs = attrs;

        if (!selfClosing) {
          node.children = parseNodes();
          // Expect closing tag
          if (pos < xml.length && xml[pos] === "<" && xml[pos + 1] === "/") {
            const closeStart = pos;
            const closeEnd = xml.indexOf(">", pos + 2);
            if (closeEnd === -1) {
              const lc = getLineCol();
              throw { message: `Unclosed closing tag </${tag}>`, line: lc.line, col: lc.col };
            }
            const closeTag = xml.substring(pos + 2, closeEnd).trim();
            if (closeTag !== tag) {
              const before = xml.substring(0, closeStart);
              const lines = before.split("\n");
              throw {
                message: `Mismatched tags: expected </${tag}> but found </${closeTag}>`,
                line: lines.length,
                col: lines[lines.length - 1].length + 1,
              };
            }
            pos = closeEnd + 1;
          } else {
            throw { message: `Missing closing tag </${tag}>`, line: tagStartLC.line, col: tagStartLC.col };
          }
        }

        result.push(node);
      } else {
        // Text content
        let text = "";
        while (pos < xml.length && xml[pos] !== "<") {
          text += xml[pos];
          pos++;
        }
        const trimmed = text.trim();
        if (trimmed) {
          result.push({ type: "text", content: trimmed });
        }
      }
    }

    return result;
  };

  try {
    const nodes = parseNodes();
    // Check for leftover content
    skipWhitespace();
    if (pos < xml.length) {
      const lc = getLineCol();
      return { nodes: [], error: { message: "Unexpected content after root element", line: lc.line, column: lc.col } };
    }
    return { nodes, error: null };
  } catch (e: unknown) {
    if (e && typeof e === "object" && "message" in e) {
      const err = e as { message: string; line?: number; col?: number };
      return { nodes: [], error: { message: err.message, line: err.line ?? null, column: err.col ?? null } };
    }
    return { nodes: [], error: { message: "Parse error", line: null, column: null } };
  }
}

/* ─── Formatter ─── */

function sortAttrs(attrStr: string): string {
  const attrs: { name: string; value: string }[] = [];
  const regex = /(\S+?)=(?:"([^"]*?)"|'([^']*?)')|(\S+)/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(attrStr)) !== null) {
    if (match[1]) {
      attrs.push({ name: match[1], value: match[2] !== undefined ? match[2] : (match[3] || "") });
    } else if (match[4]) {
      attrs.push({ name: match[4], value: "" });
    }
  }
  attrs.sort((a, b) => a.name.localeCompare(b.name));
  return attrs.map((a) => a.value !== "" ? `${a.name}="${a.value}"` : a.name).join(" ");
}

function formatXML(nodes: TokenNode[], options: FormatOptions, depth: number = 0): string {
  const indent = options.indentStyle === "tab" ? "\t" : options.indentStyle === "4-spaces" ? "    " : "  ";
  const pad = indent.repeat(depth);
  const lines: string[] = [];

  for (const node of nodes) {
    switch (node.type) {
      case "processing":
        lines.push(`${pad}<?${node.content}?>`);
        break;
      case "doctype":
        lines.push(`${pad}<!${node.content}>`);
        break;
      case "comment":
        if (options.preserveComments) {
          lines.push(`${pad}<!-- ${node.content} -->`);
        }
        break;
      case "cdata":
        lines.push(`${pad}<![CDATA[${node.content}]]>`);
        break;
      case "text":
        lines.push(`${pad}${node.content}`);
        break;
      case "element": {
        const attrs = node.attrs
          ? " " + (options.sortAttributes ? sortAttrs(node.attrs) : node.attrs)
          : "";
        if (node.selfClosing) {
          lines.push(`${pad}<${node.tag}${attrs} />`);
        } else if (!node.children || node.children.length === 0) {
          lines.push(`${pad}<${node.tag}${attrs}></${node.tag}>`);
        } else if (
          node.children.length === 1 &&
          node.children[0].type === "text" &&
          (node.children[0].content || "").length < 60
        ) {
          lines.push(`${pad}<${node.tag}${attrs}>${node.children[0].content}</${node.tag}>`);
        } else {
          lines.push(`${pad}<${node.tag}${attrs}>`);
          lines.push(formatXML(node.children || [], options, depth + 1));
          lines.push(`${pad}</${node.tag}>`);
        }
        break;
      }
    }
  }

  return lines.join("\n");
}

function minifyXML(xml: string): string {
  let result = xml.replace(/<!--[\s\S]*?-->/g, "");
  result = result.replace(/>\s+</g, "><");
  result = result.trim();
  return result;
}

/* ─── Syntax highlighting ─── */

function highlightXml(xml: string): React.ReactNode[] {
  const lines = xml.split("\n");
  return lines.map((line, i) => {
    const parts: React.ReactNode[] = [];
    let remaining = line;
    let key = 0;

    while (remaining.length > 0) {
      // Leading whitespace
      const wsMatch = remaining.match(/^(\s+)/);
      if (wsMatch) {
        parts.push(<span key={key++}>{wsMatch[1]}</span>);
        remaining = remaining.slice(wsMatch[1].length);
        continue;
      }

      // Processing instruction
      const piMatch = remaining.match(/^(<\?[\s\S]*?\?>)/);
      if (piMatch) {
        parts.push(
          <span key={key++} className="text-purple-400">{piMatch[1]}</span>
        );
        remaining = remaining.slice(piMatch[1].length);
        continue;
      }

      // Comment
      const commentMatch = remaining.match(/^(<!--[\s\S]*?-->)/);
      if (commentMatch) {
        parts.push(
          <span key={key++} className="text-slate-500 italic">{commentMatch[1]}</span>
        );
        remaining = remaining.slice(commentMatch[1].length);
        continue;
      }

      // CDATA
      const cdataMatch = remaining.match(/^(<!\[CDATA\[[\s\S]*?\]\]>)/);
      if (cdataMatch) {
        parts.push(
          <span key={key++} className="text-amber-400">{cdataMatch[1]}</span>
        );
        remaining = remaining.slice(cdataMatch[1].length);
        continue;
      }

      // DOCTYPE
      const doctypeMatch = remaining.match(/^(<!DOCTYPE[\s\S]*?>)/i);
      if (doctypeMatch) {
        parts.push(
          <span key={key++} className="text-purple-400">{doctypeMatch[1]}</span>
        );
        remaining = remaining.slice(doctypeMatch[1].length);
        continue;
      }

      // Opening or closing tag
      const tagMatch = remaining.match(/^(<\/?)([\w:.-]+)/);
      if (tagMatch) {
        parts.push(
          <span key={key++} className="text-slate-400">{tagMatch[1]}</span>
        );
        parts.push(
          <span key={key++} className="text-blue-400 font-medium">{tagMatch[2]}</span>
        );
        remaining = remaining.slice(tagMatch[0].length);

        // Parse attributes
        while (remaining.length > 0) {
          const attrWs = remaining.match(/^(\s+)/);
          if (attrWs) {
            parts.push(<span key={key++}>{attrWs[1]}</span>);
            remaining = remaining.slice(attrWs[1].length);
          }

          const attrMatch = remaining.match(/^([\w:.-]+)(=)("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/);
          if (attrMatch) {
            parts.push(<span key={key++} className="text-cyan-300">{attrMatch[1]}</span>);
            parts.push(<span key={key++} className="text-slate-400">{attrMatch[2]}</span>);
            parts.push(<span key={key++} className="text-green-400">{attrMatch[3]}</span>);
            remaining = remaining.slice(attrMatch[0].length);
            continue;
          }

          const endMatch = remaining.match(/^(\s*\/?>)/);
          if (endMatch) {
            parts.push(<span key={key++} className="text-slate-400">{endMatch[1]}</span>);
            remaining = remaining.slice(endMatch[1].length);
            break;
          }
          break;
        }
        continue;
      }

      // Text content
      const textMatch = remaining.match(/^([^<]+)/);
      if (textMatch) {
        parts.push(
          <span key={key++} className="text-yellow-300">{textMatch[1]}</span>
        );
        remaining = remaining.slice(textMatch[1].length);
        continue;
      }

      parts.push(<span key={key++} className="text-slate-400">{remaining[0]}</span>);
      remaining = remaining.slice(1);
    }

    return (
      <div key={i} className="table-row">
        <span className="table-cell pr-4 text-right text-slate-600 select-none w-[3ch] min-w-[3ch]">
          {i + 1}
        </span>
        <span className="table-cell">{parts}</span>
      </div>
    );
  });
}

/* ─── Examples ─── */

const EXAMPLE_XML = `<?xml version="1.0" encoding="UTF-8"?>
<catalog><book id="bk101"><author>Gambardella, Matthew</author><title>XML Developer's Guide</title><genre>Computer</genre><price>44.95</price><publish_date>2000-10-01</publish_date><description>An in-depth look at creating applications with XML.</description></book><book id="bk102"><author>Ralls, Kim</author><title>Midnight Rain</title><genre>Fantasy</genre><price>5.95</price><publish_date>2000-12-16</publish_date><description>A former architect battles corporate zombies.</description></book></catalog>`;

const EXAMPLE_NESTED = `<root><users><user active="true" role="admin" id="1"><name>Alice</name><email>alice@example.com</email><address><city>London</city><country>UK</country></address></user><user active="false" role="viewer" id="2"><name>Bob</name><!-- Bob's email is pending --><email>bob@example.com</email><address><city>Paris</city><country>France</country></address></user></users></root>`;

/* ─── Main component ─── */

export default function XmlFormatterPage() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [options, setOptions] = useState<FormatOptions>({
    indentStyle: "2-spaces",
    preserveComments: true,
    sortAttributes: false,
  });
  const [error, setError] = useState<XmlError | null>(null);
  const [copied, setCopied] = useState(false);

  const isValid = useMemo(() => {
    if (!input.trim()) return false;
    const { error: parseError } = parseXML(input);
    return !parseError;
  }, [input]);

  const format = useCallback(() => {
    if (!input.trim()) {
      setOutput("");
      setError(null);
      return;
    }
    const { nodes, error: parseError } = parseXML(input);
    if (parseError) {
      setError(parseError);
      setOutput("");
      return;
    }
    setOutput(formatXML(nodes, options));
    setError(null);
  }, [input, options]);

  const handleMinify = useCallback(() => {
    if (!input.trim()) {
      setOutput("");
      setError(null);
      return;
    }
    const { error: parseError } = parseXML(input);
    if (parseError) {
      setError(parseError);
      setOutput("");
      return;
    }
    setOutput(minifyXML(input));
    setError(null);
  }, [input]);

  const handleValidate = useCallback(() => {
    if (!input.trim()) {
      setError(null);
      setOutput("");
      return;
    }
    const { nodes, error: parseError } = parseXML(input);
    if (parseError) {
      setError(parseError);
      setOutput("");
    } else {
      setError(null);
      setOutput(formatXML(nodes, options));
    }
  }, [input, options]);

  const copyOutput = useCallback(async () => {
    if (!output) return;
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [output]);

  const downloadXml = useCallback(() => {
    if (!output) return;
    const blob = new Blob([output], { type: "application/xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "formatted.xml";
    a.click();
    URL.revokeObjectURL(url);
  }, [output]);

  const clearAll = useCallback(() => {
    setInput("");
    setOutput("");
    setError(null);
  }, []);

  const loadExample = useCallback((example: string) => {
    setInput(example);
    setOutput("");
    setError(null);
  }, []);

  const handleFileUpload = useCallback((file: File) => {
    if (!file.name.endsWith(".xml") && file.type !== "application/xml" && file.type !== "text/xml") {
      setError({ message: "Please upload an .xml file", line: null, column: null });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError({ message: "File too large (max 5 MB)", line: null, column: null });
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setInput(text);
      setError(null);
      setOutput("");
    };
    reader.readAsText(file);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file) handleFileUpload(file);
    },
    [handleFileUpload]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFileUpload(file);
    },
    [handleFileUpload]
  );

  const inputStats = input
    ? { chars: input.length, lines: input.split("\n").length, tags: (input.match(/<[a-zA-Z][^>]*>/g) || []).length }
    : null;

  const outputStats = output
    ? { chars: output.length, lines: output.split("\n").length }
    : null;

  return (
    <>
      <title>XML Formatter & Validator - Free Online XML Pretty Print Tool | DevTools Hub</title>
      <meta
        name="description"
        content="Free online XML formatter, validator, and beautifier. Format XML with syntax highlighting, line numbers, and 2-space, 4-space, or tab indentation. Validate well-formed XML with error line numbers. Minify, copy, or download as .xml file."
      />
      <meta
        name="keywords"
        content="xml formatter, xml validator, xml beautifier, xml pretty print, format xml online, validate xml, xml syntax highlighting, xml minifier, xml editor online, well-formed xml checker"
      />
      <JsonLd
        data={[
          generateWebAppSchema({
            slug: "xml-formatter",
            name: "XML Formatter & Validator",
            description:
              "Format, validate, beautify, and minify XML online for free. Supports syntax highlighting, error location with line numbers, and customizable indentation.",
            category: "developer",
          }),
          generateBreadcrumbSchema({
            slug: "xml-formatter",
            name: "XML Formatter & Validator",
            description:
              "Format, validate, beautify, and minify XML online for free",
            category: "developer",
          }),
          generateFAQSchema([
            {
              question: "What is XML formatting?",
              answer:
                "XML formatting (or pretty-printing) adds consistent indentation and line breaks to raw XML, making it easier to read and debug. This tool parses your XML and re-formats it with your chosen indentation (2 spaces, 4 spaces, or tabs), with full syntax highlighting and line numbers.",
            },
            {
              question: "What does it mean for XML to be well-formed?",
              answer:
                "Well-formed XML follows all XML syntax rules: every opening tag has a matching closing tag, tags are properly nested, attribute values are quoted, and there is exactly one root element. This validator checks all of these rules and reports the exact line and column of any error.",
            },
            {
              question: "How do I fix XML parsing errors?",
              answer:
                "Common XML errors include unclosed tags, mismatched tag names, unescaped ampersands (&), and missing quotes around attribute values. Check the line and column number in the error message to locate the issue. Use &amp; for &, &lt; for <, and &gt; for > in text content.",
            },
            {
              question: "What is the difference between XML validation and well-formedness?",
              answer:
                "Well-formedness checks basic syntax rules. Validation checks against a schema (DTD, XSD, or RelaxNG) to ensure document structure matches expected rules. This tool checks well-formedness, which is the most common need for developers working with XML.",
            },
            {
              question: "What does minifying XML do?",
              answer:
                "Minifying removes all unnecessary whitespace and comments from XML, producing the smallest possible output. This reduces file size for network transfer or storage while preserving the exact same data structure.",
            },
            {
              question: "Is my XML data safe?",
              answer:
                "Yes. All processing happens entirely in your browser using JavaScript. No data is sent to any server. Your XML never leaves your device.",
            },
          ]),
        ]}
      />

      <div className="min-h-screen bg-slate-900 text-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <ToolBreadcrumb slug="xml-formatter" />

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
              XML Formatter & Validator
            </h1>
            <p className="text-slate-400 max-w-2xl text-lg">
              Paste your XML to format, validate, beautify, or minify it
              instantly. Syntax highlighting with line numbers and 2-space,
              4-space, or tab indentation. Check well-formed XML with error
              location and download formatted output as an .xml file.
            </p>
          </div>

          {/* AdSense top unit */}
          <AdUnit slot="TOP_SLOT" format="horizontal" className="mb-6" />

          {/* Controls */}
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <button
              onClick={format}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              Format / Beautify
            </button>
            <button
              onClick={handleMinify}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors"
            >
              Minify
            </button>
            <button
              onClick={handleValidate}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors"
            >
              Validate
            </button>
            <button
              onClick={copyOutput}
              disabled={!output}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {copied ? "Copied!" : "Copy"}
            </button>
            <button
              onClick={downloadXml}
              disabled={!output}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Download .xml
            </button>
            <button
              onClick={clearAll}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors"
            >
              Clear
            </button>
            <button
              onClick={() => loadExample(EXAMPLE_XML)}
              className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
            >
              Catalog example
            </button>
            <button
              onClick={() => loadExample(EXAMPLE_NESTED)}
              className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
            >
              Nested example
            </button>
            <label className="text-xs text-slate-500 hover:text-slate-300 transition-colors cursor-pointer">
              Upload .xml
              <input
                type="file"
                accept=".xml,application/xml,text/xml"
                onChange={handleFileInput}
                className="hidden"
              />
            </label>

            <div className="ml-auto flex items-center gap-4">
              <div className="flex items-center gap-2">
                <label className="text-sm text-slate-400">Indent:</label>
                <select
                  value={options.indentStyle}
                  onChange={(e) =>
                    setOptions((prev) => ({ ...prev, indentStyle: e.target.value as IndentStyle }))
                  }
                  className="bg-slate-800 border border-slate-600 text-slate-200 rounded px-2 py-1 text-sm"
                >
                  <option value="2-spaces">2 spaces</option>
                  <option value="4-spaces">4 spaces</option>
                  <option value="tab">Tabs</option>
                </select>
              </div>

              <label className="flex items-center gap-1.5 text-xs text-slate-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={options.preserveComments}
                  onChange={(e) =>
                    setOptions((prev) => ({ ...prev, preserveComments: e.target.checked }))
                  }
                  className="w-3.5 h-3.5 rounded bg-slate-700 border-slate-600 text-blue-500"
                />
                Comments
              </label>

              <label className="flex items-center gap-1.5 text-xs text-slate-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={options.sortAttributes}
                  onChange={(e) =>
                    setOptions((prev) => ({ ...prev, sortAttributes: e.target.checked }))
                  }
                  className="w-3.5 h-3.5 rounded bg-slate-700 border-slate-600 text-blue-500"
                />
                Sort attrs
              </label>

              {/* Validation indicator */}
              {input.trim().length > 0 && (
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-block w-3 h-3 rounded-full ${
                      isValid ? "bg-green-500" : "bg-red-500"
                    }`}
                  />
                  <span
                    className={`text-sm font-medium ${
                      isValid ? "text-green-400" : "text-red-400"
                    }`}
                  >
                    {isValid ? "Valid XML" : "Invalid XML"}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-4 p-3 bg-red-900/40 border border-red-700 rounded-lg text-sm font-mono space-y-1">
              <div className="text-red-300">
                <span className="font-bold">Error:</span> {error.message}
                {error.line && (
                  <span className="ml-2 text-red-400">
                    (Line {error.line}
                    {error.column ? `, Column ${error.column}` : ""})
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Panels */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
            {/* Input */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-slate-300">Input XML</label>
                {inputStats && (
                  <span className="text-xs text-slate-500">
                    {inputStats.chars} chars | {inputStats.lines} lines | {inputStats.tags} tags
                  </span>
                )}
              </div>
              <div
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                className="relative"
              >
                <textarea
                  value={input}
                  onChange={(e) => {
                    setInput(e.target.value);
                    setError(null);
                    setOutput("");
                  }}
                  placeholder={'Paste your XML here or drag & drop an .xml file...\n\n<root>\n  <element attr="value">content</element>\n</root>'}
                  className={`w-full h-96 bg-slate-800 border rounded-lg p-4 font-mono text-sm text-slate-200 placeholder-slate-500 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    error ? "border-red-600" : "border-slate-600"
                  }`}
                  spellCheck={false}
                />
              </div>
            </div>

            {/* Output */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-slate-300">Output</label>
                {outputStats && (
                  <span className="text-xs text-slate-500">
                    {outputStats.chars} chars | {outputStats.lines} lines
                  </span>
                )}
              </div>

              {output ? (
                <div className="w-full h-96 bg-slate-800 border border-slate-600 rounded-lg p-4 font-mono text-sm overflow-auto">
                  <div className="table w-full">
                    {highlightXml(output)}
                  </div>
                </div>
              ) : (
                <div className="w-full h-96 bg-slate-800 border border-slate-600 rounded-lg p-4 font-mono text-sm text-slate-500 flex items-center justify-center">
                  Formatted XML will appear here...
                </div>
              )}
            </div>
          </div>

          {/* XML Tips */}
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 mb-6">
            <h2 className="text-lg font-semibold text-white mb-4">
              XML Formatting Tips
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
              {[
                {
                  name: "Validate before deploying",
                  tip: "Always check XML is well-formed before using it in configs, APIs, or data feeds. A single unclosed tag can break an entire pipeline.",
                },
                {
                  name: "Escape special characters",
                  tip: "Use &amp; for &, &lt; for <, &gt; for >, &quot; for \", and &apos; for ' in text content and attribute values.",
                },
                {
                  name: "One root element",
                  tip: "Every XML document must have exactly one root element. Wrap multiple elements in a container like <data> or <root> if needed.",
                },
                {
                  name: "Case-sensitive tags",
                  tip: "XML tags are case-sensitive. <Book> and <book> are different elements. Be consistent with your naming convention.",
                },
                {
                  name: "Minify for transfer",
                  tip: "Remove whitespace to reduce XML payload size for network transfer. A verbose XML file can shrink significantly when minified.",
                },
                {
                  name: "Use CDATA for raw content",
                  tip: "Wrap content with special characters in <![CDATA[...]]> sections instead of escaping every character individually.",
                },
              ].map((item) => (
                <div key={item.name}>
                  <h3 className="text-sm font-medium text-white mb-1">
                    {item.name}
                  </h3>
                  <p className="text-xs text-slate-400">{item.tip}</p>
                </div>
              ))}
            </div>
          </div>

          {/* XML Syntax Reference */}
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 mb-6">
            <h2 className="text-lg font-semibold text-white mb-4">XML Syntax Reference</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              {[
                { label: "Element", syntax: "<tag>content</tag>" },
                { label: "Self-closing", syntax: "<tag />" },
                { label: "Attributes", syntax: '<tag attr="value">' },
                { label: "Comment", syntax: "<!-- comment -->" },
                { label: "CDATA", syntax: "<![CDATA[raw text]]>" },
                { label: "Processing", syntax: '<?xml version="1.0"?>' },
                { label: "DOCTYPE", syntax: "<!DOCTYPE root>" },
                { label: "Namespace", syntax: '<root xmlns:ns="uri">' },
              ].map((ref) => (
                <div key={ref.label} className="flex gap-3">
                  <span className="text-slate-400 w-24 shrink-0">{ref.label}:</span>
                  <code className="text-green-400 font-mono text-xs">{ref.syntax}</code>
                </div>
              ))}
            </div>
          </div>

          {/* AdSense bottom unit */}
          <AdUnit slot="BOTTOM_SLOT" format="auto" className="mb-6" />

          <RelatedTools currentSlug="xml-formatter" />

          {/* FAQ Section */}
          <section className="mt-16 border-t border-slate-700 pt-10">
            <h2 className="text-2xl font-bold text-white mb-6">
              Frequently Asked Questions
            </h2>

            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  What is XML formatting?
                </h3>
                <p className="text-slate-400">
                  XML formatting (or &ldquo;pretty-printing&rdquo;) adds consistent
                  indentation and line breaks to raw XML, making it easier to read and
                  debug. This tool parses your XML and re-formats it with your chosen
                  indentation (2 spaces, 4 spaces, or tabs), with full syntax highlighting
                  and line numbers.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  What does it mean for XML to be well-formed?
                </h3>
                <p className="text-slate-400">
                  Well-formed XML follows all XML syntax rules: every opening tag has a
                  matching closing tag, tags are properly nested, attribute values are
                  quoted, and there is exactly one root element. This validator checks all
                  of these rules and reports the exact line and column of any error.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  How do I fix XML parsing errors?
                </h3>
                <p className="text-slate-400">
                  Common XML errors include unclosed tags, mismatched tag names, unescaped
                  ampersands (&amp;), and missing quotes around attribute values. Check the
                  line and column number in the error message to locate the issue. Use{" "}
                  <code className="text-slate-300">&amp;amp;</code> for &amp;,{" "}
                  <code className="text-slate-300">&amp;lt;</code> for &lt;, and{" "}
                  <code className="text-slate-300">&amp;gt;</code> for &gt; in text content.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  What is the difference between XML validation and well-formedness?
                </h3>
                <p className="text-slate-400">
                  Well-formedness checks basic syntax rules. Validation goes further by
                  checking against a schema (DTD, XSD, or RelaxNG) to ensure document
                  structure matches expected rules. This tool checks well-formedness, which
                  is the most common need for developers working with XML.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  What does minifying XML do?
                </h3>
                <p className="text-slate-400">
                  Minifying removes all unnecessary whitespace and comments from XML,
                  producing the smallest possible output. This reduces file size for
                  network transfer or storage while preserving the exact same data
                  structure.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Is my XML data safe?
                </h3>
                <p className="text-slate-400">
                  Yes. All processing happens entirely in your browser using JavaScript.
                  No data is sent to any server. Your XML never leaves your device.
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
