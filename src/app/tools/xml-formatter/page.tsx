"use client";

import { useState, useCallback } from "react";
import JsonLd from "@/components/JsonLd";
import RelatedTools from "@/components/RelatedTools";
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

function parseXML(xml: string): { nodes: TokenNode[]; error: string | null } {
  const nodes: TokenNode[] = [];
  let pos = 0;

  const skipWhitespace = () => {
    while (pos < xml.length && /\s/.test(xml[pos])) pos++;
  };

  const parseNodes = (): TokenNode[] => {
    const result: TokenNode[] = [];

    while (pos < xml.length) {
      if (xml[pos] === "<") {
        // Check closing tag
        if (xml[pos + 1] === "/") break;

        // Comment
        if (xml.substring(pos, pos + 4) === "<!--") {
          const end = xml.indexOf("-->", pos + 4);
          if (end === -1) return result;
          result.push({ type: "comment", content: xml.substring(pos + 4, end).trim() });
          pos = end + 3;
          continue;
        }

        // CDATA
        if (xml.substring(pos, pos + 9) === "<![CDATA[") {
          const end = xml.indexOf("]]>", pos + 9);
          if (end === -1) return result;
          result.push({ type: "cdata", content: xml.substring(pos + 9, end) });
          pos = end + 3;
          continue;
        }

        // Processing instruction
        if (xml.substring(pos, pos + 2) === "<?") {
          const end = xml.indexOf("?>", pos + 2);
          if (end === -1) return result;
          result.push({ type: "processing", content: xml.substring(pos + 2, end).trim() });
          pos = end + 2;
          continue;
        }

        // DOCTYPE
        if (xml.substring(pos, pos + 9).toUpperCase() === "<!DOCTYPE") {
          const end = xml.indexOf(">", pos + 9);
          if (end === -1) return result;
          result.push({ type: "doctype", content: xml.substring(pos + 2, end).trim() });
          pos = end + 1;
          continue;
        }

        // Element
        pos++; // skip <
        skipWhitespace();

        // Read tag name
        let tag = "";
        while (pos < xml.length && !/[\s/>]/.test(xml[pos])) {
          tag += xml[pos];
          pos++;
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
        if (pos < xml.length && xml[pos] === ">") pos++;

        const node: TokenNode = { type: "element", tag, selfClosing };
        if (attrs) node.attrs = attrs;

        if (!selfClosing) {
          node.children = parseNodes();
          // Skip closing tag
          if (pos < xml.length && xml[pos] === "<" && xml[pos + 1] === "/") {
            const closeEnd = xml.indexOf(">", pos + 2);
            if (closeEnd !== -1) pos = closeEnd + 1;
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
    const result = parseNodes();
    return { nodes: result, error: null };
  } catch (e) {
    return { nodes: [], error: e instanceof Error ? e.message : "Parse error" };
  }
}

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

  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];

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
          // Inline short text
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
  // Remove comments
  let result = xml.replace(/<!--[\s\S]*?-->/g, "");
  // Collapse whitespace between tags
  result = result.replace(/>\s+</g, "><");
  // Trim leading/trailing whitespace per line
  result = result.trim();
  return result;
}

const EXAMPLE_XML = `<?xml version="1.0" encoding="UTF-8"?>
<catalog><book id="bk101"><author>Gambardella, Matthew</author><title>XML Developer's Guide</title><genre>Computer</genre><price>44.95</price><publish_date>2000-10-01</publish_date><description>An in-depth look at creating applications with XML.</description></book><book id="bk102"><author>Ralls, Kim</author><title>Midnight Rain</title><genre>Fantasy</genre><price>5.95</price><publish_date>2000-12-16</publish_date><description>A former architect battles corporate zombies.</description></book></catalog>`;

const EXAMPLE_NESTED = `<root><users><user active="true" role="admin" id="1"><name>Alice</name><email>alice@example.com</email><address><city>London</city><country>UK</country></address></user><user active="false" role="viewer" id="2"><name>Bob</name><!-- Bob's email is pending --><email>bob@example.com</email><address><city>Paris</city><country>France</country></address></user></users></root>`;

export default function XmlFormatterPage() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [options, setOptions] = useState<FormatOptions>({
    indentStyle: "2-spaces",
    preserveComments: true,
    sortAttributes: false,
  });
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [mode, setMode] = useState<"format" | "minify">("format");

  const format = useCallback(() => {
    if (!input.trim()) {
      setOutput("");
      setError(null);
      return;
    }

    if (mode === "minify") {
      setOutput(minifyXML(input));
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
  }, [input, options, mode]);

  const copyOutput = useCallback(async () => {
    if (!output) return;
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [output]);

  const loadExample = useCallback(
    (example: string) => {
      setInput(example);
      setOutput("");
      setError(null);
    },
    []
  );

  const inputStats = input
    ? {
        chars: input.length,
        lines: input.split("\n").length,
        tags: (input.match(/<[a-zA-Z][^>]*>/g) || []).length,
      }
    : null;

  const outputStats = output
    ? {
        chars: output.length,
        lines: output.split("\n").length,
      }
    : null;

  return (
    <>
      <title>XML Formatter & Beautifier - Free Online Tool | DevTools Hub</title>
      <meta
        name="description"
        content="Format, beautify, and minify XML online for free. Supports nested elements, comments, CDATA, processing instructions, attribute sorting, and customizable indentation."
      />
      <JsonLd
        data={[
          generateWebAppSchema({
            slug: "xml-formatter",
            name: "XML Formatter",
            description: "Format and beautify XML documents with proper indentation",
            category: "developer",
          }),
          generateBreadcrumbSchema({
            slug: "xml-formatter",
            name: "XML Formatter",
            description: "Format and beautify XML documents with proper indentation",
            category: "developer",
          }),
          generateFAQSchema([
            { question: "What does this XML formatter do?", answer: "This tool takes unformatted or minified XML and adds proper indentation, line breaks, and structure to make it readable. It can also minify formatted XML by removing all unnecessary whitespace and comments, reducing file size for production use." },
            { question: "Does this tool validate XML?", answer: "This tool performs basic structural parsing to format your XML. It will detect malformed tags, unclosed elements, and syntax errors. However, it does not validate against an XSD schema or DTD. For full schema validation, use a dedicated XML validator." },
            { question: "What is attribute sorting?", answer: "When enabled, attribute sorting alphabetically orders the attributes on each element. This makes XML more consistent and easier to compare in diffs. For example, <tag z=\"1\" a=\"2\"> becomes <tag a=\"2\" z=\"1\">." },
            { question: "Is my XML data safe?", answer: "Yes. All XML parsing and formatting happens entirely in your browser using JavaScript. No data is sent to any server. You can safely format sensitive XML documents including configuration files and API responses." },
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
              <li className="text-slate-200">XML Formatter</li>
            </ol>
          </nav>

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
              XML Formatter & Beautifier
            </h1>
            <p className="text-slate-400 max-w-2xl text-lg">
              Format, beautify, and minify XML with proper indentation. Supports
              comments, CDATA sections, processing instructions, and attribute
              sorting. Everything runs in your browser.
            </p>
          </div>

          {/* Options Bar */}
          <div className="flex flex-wrap items-center gap-4 mb-4">
            <div className="flex bg-slate-800 rounded-lg p-1 border border-slate-700">
              <button
                onClick={() => setMode("format")}
                className={`px-4 py-1.5 rounded text-sm font-medium transition-colors ${
                  mode === "format" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"
                }`}
              >
                Beautify
              </button>
              <button
                onClick={() => setMode("minify")}
                className={`px-4 py-1.5 rounded text-sm font-medium transition-colors ${
                  mode === "minify" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"
                }`}
              >
                Minify
              </button>
            </div>

            {mode === "format" && (
              <>
                <div className="flex items-center gap-2">
                  <label className="text-sm text-slate-400">Indent:</label>
                  <select
                    value={options.indentStyle}
                    onChange={(e) =>
                      setOptions((prev) => ({ ...prev, indentStyle: e.target.value as IndentStyle }))
                    }
                    className="bg-slate-800 border border-slate-600 rounded px-2 py-1 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="2-spaces">2 Spaces</option>
                    <option value="4-spaces">4 Spaces</option>
                    <option value="tab">Tab</option>
                  </select>
                </div>

                <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={options.preserveComments}
                    onChange={(e) =>
                      setOptions((prev) => ({ ...prev, preserveComments: e.target.checked }))
                    }
                    className="w-4 h-4 rounded bg-slate-700 border-slate-600 text-blue-500 focus:ring-blue-500"
                  />
                  Preserve comments
                </label>

                <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={options.sortAttributes}
                    onChange={(e) =>
                      setOptions((prev) => ({ ...prev, sortAttributes: e.target.checked }))
                    }
                    className="w-4 h-4 rounded bg-slate-700 border-slate-600 text-blue-500 focus:ring-blue-500"
                  />
                  Sort attributes
                </label>
              </>
            )}
          </div>

          {/* Input / Output */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-slate-300">Input XML</label>
                <div className="flex items-center gap-2">
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
                  {inputStats && (
                    <span className="text-xs text-slate-500">
                      {inputStats.chars} chars | {inputStats.tags} tags
                    </span>
                  )}
                </div>
              </div>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Paste your XML here..."
                className="w-full h-80 bg-slate-800 border border-slate-600 rounded-lg p-4 font-mono text-sm text-slate-200 placeholder-slate-500 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                spellCheck={false}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-slate-300">
                  {mode === "format" ? "Formatted XML" : "Minified XML"}
                </label>
                {outputStats && (
                  <span className="text-xs text-slate-500">
                    {outputStats.chars} chars | {outputStats.lines} lines
                  </span>
                )}
              </div>
              <textarea
                value={error ? `Error: ${error}` : output}
                readOnly
                className={`w-full h-80 bg-slate-800 border rounded-lg p-4 font-mono text-sm resize-none focus:outline-none ${
                  error ? "border-red-500 text-red-400" : "border-slate-600 text-slate-200"
                }`}
                spellCheck={false}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <button
              onClick={format}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              {mode === "format" ? "Format XML" : "Minify XML"}
            </button>
            <button
              onClick={copyOutput}
              disabled={!output || !!error}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {copied ? "Copied!" : "Copy Output"}
            </button>
            <button
              onClick={() => {
                setInput("");
                setOutput("");
                setError(null);
              }}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors"
            >
              Clear
            </button>
          </div>

          {/* XML Reference */}
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

          <RelatedTools currentSlug="xml-formatter" />

          {/* FAQ Section */}
          <section className="mt-16 border-t border-slate-700 pt-10">
            <h2 className="text-2xl font-bold text-white mb-6">
              Frequently Asked Questions
            </h2>

            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  What does this XML formatter do?
                </h3>
                <p className="text-slate-400">
                  This tool takes unformatted or minified XML and adds proper
                  indentation, line breaks, and structure to make it readable.
                  It can also minify formatted XML by removing all unnecessary
                  whitespace and comments, reducing file size for production use.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Does this tool validate XML?
                </h3>
                <p className="text-slate-400">
                  This tool performs basic structural parsing to format your XML.
                  It will detect malformed tags, unclosed elements, and syntax
                  errors. However, it does not validate against an XSD schema or
                  DTD. For full schema validation, use a dedicated XML validator.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  What is attribute sorting?
                </h3>
                <p className="text-slate-400">
                  When enabled, attribute sorting alphabetically orders the
                  attributes on each element. This makes XML more consistent and
                  easier to compare in diffs. For example,{" "}
                  <code className="text-slate-300">{`<tag z="1" a="2">`}</code>{" "}
                  becomes{" "}
                  <code className="text-slate-300">{`<tag a="2" z="1">`}</code>.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Is my XML data safe?
                </h3>
                <p className="text-slate-400">
                  Yes. All XML parsing and formatting happens entirely in your
                  browser using JavaScript. No data is sent to any server. You
                  can safely format sensitive XML documents including
                  configuration files and API responses.
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
