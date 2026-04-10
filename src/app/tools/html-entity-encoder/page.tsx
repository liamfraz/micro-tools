"use client";

import { useState, useCallback, useEffect } from "react";
import AdUnit from "@/components/AdUnit";
import JsonLd from "@/components/JsonLd";
import RelatedTools from "@/components/RelatedTools";
import ToolBreadcrumb from "@/components/ToolBreadcrumb";
import {
  generateFAQSchema,
  generateWebAppSchema,
  generateBreadcrumbSchema,
} from "@/lib/jsonld";

type EncodeMode = "named" | "decimal" | "hex" | "all";
type Direction = "encode" | "decode";

// Named HTML entities map
const NAMED_ENTITIES: Record<string, string> = {
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;",
  "\u00A0": "&nbsp;", "\u00A9": "&copy;", "\u00AE": "&reg;", "\u2122": "&trade;",
  "\u00A3": "&pound;", "\u00A5": "&yen;", "\u20AC": "&euro;", "\u00A2": "&cent;",
  "\u00B0": "&deg;", "\u00B1": "&plusmn;", "\u00D7": "&times;", "\u00F7": "&divide;",
  "\u2260": "&ne;", "\u2264": "&le;", "\u2265": "&ge;", "\u221E": "&infin;",
  "\u00BD": "&frac12;", "\u00BC": "&frac14;", "\u00BE": "&frac34;",
  "\u2190": "&larr;", "\u2192": "&rarr;", "\u2191": "&uarr;", "\u2193": "&darr;",
  "\u2194": "&harr;", "\u2014": "&mdash;", "\u2013": "&ndash;",
  "\u2018": "&lsquo;", "\u2019": "&rsquo;", "\u201C": "&ldquo;", "\u201D": "&rdquo;",
  "\u2026": "&hellip;", "\u00AB": "&laquo;", "\u00BB": "&raquo;",
  "\u2022": "&bull;", "\u00B7": "&middot;",
  "\u00C0": "&Agrave;", "\u00C1": "&Aacute;", "\u00C2": "&Acirc;", "\u00C3": "&Atilde;",
  "\u00C4": "&Auml;", "\u00C5": "&Aring;", "\u00C6": "&AElig;", "\u00C7": "&Ccedil;",
  "\u00C8": "&Egrave;", "\u00C9": "&Eacute;", "\u00CA": "&Ecirc;", "\u00CB": "&Euml;",
  "\u00D1": "&Ntilde;", "\u00D6": "&Ouml;", "\u00DC": "&Uuml;", "\u00DF": "&szlig;",
  "\u00E0": "&agrave;", "\u00E1": "&aacute;", "\u00E2": "&acirc;", "\u00E3": "&atilde;",
  "\u00E4": "&auml;", "\u00E5": "&aring;", "\u00E6": "&aelig;", "\u00E7": "&ccedil;",
  "\u00E8": "&egrave;", "\u00E9": "&eacute;", "\u00EA": "&ecirc;", "\u00EB": "&euml;",
  "\u00F1": "&ntilde;", "\u00F6": "&ouml;", "\u00FC": "&uuml;",
};

// Reverse lookup
const ENTITY_TO_CHAR: Record<string, string> = {};
for (const key of Object.keys(NAMED_ENTITIES)) {
  ENTITY_TO_CHAR[NAMED_ENTITIES[key]] = key;
}

function encodeHTML(input: string, mode: EncodeMode): string {
  let result = "";
  for (let i = 0; i < input.length; i++) {
    const char = input[i];
    const code = input.charCodeAt(i);

    if (mode === "named" || mode === "all") {
      if (NAMED_ENTITIES[char]) {
        result += NAMED_ENTITIES[char];
        continue;
      }
    }

    if (mode === "all" && code > 127) {
      result += `&#x${code.toString(16).toUpperCase()};`;
      continue;
    }

    if (mode === "named") {
      result += char;
      continue;
    }

    if (mode === "decimal") {
      if (char === "&" || char === "<" || char === ">" || char === '"' || char === "'" || code > 127) {
        result += `&#${code};`;
      } else {
        result += char;
      }
      continue;
    }

    if (mode === "hex") {
      if (char === "&" || char === "<" || char === ">" || char === '"' || char === "'" || code > 127) {
        result += `&#x${code.toString(16).toUpperCase()};`;
      } else {
        result += char;
      }
      continue;
    }

    result += char;
  }
  return result;
}

function decodeHTML(input: string): string {
  let result = input;

  result = result.replace(/&[a-zA-Z]+;/g, (match) => {
    if (ENTITY_TO_CHAR[match]) return ENTITY_TO_CHAR[match];
    if (typeof document !== "undefined") {
      const el = document.createElement("textarea");
      el.innerHTML = match;
      return el.value;
    }
    return match;
  });

  result = result.replace(/&#(\d+);/g, (_, code) =>
    String.fromCharCode(parseInt(code, 10))
  );

  result = result.replace(/&#x([0-9a-fA-F]+);/g, (_, hex) =>
    String.fromCharCode(parseInt(hex, 16))
  );

  return result;
}

interface EntityRow {
  char: string;
  named: string;
  decimal: string;
  hex: string;
  desc: string;
  group: string;
}

const ENTITY_REFERENCE: EntityRow[] = [
  // HTML Core
  { char: "&", named: "&amp;", decimal: "&#38;", hex: "&#x26;", desc: "Ampersand", group: "HTML Core" },
  { char: "<", named: "&lt;", decimal: "&#60;", hex: "&#x3C;", desc: "Less than", group: "HTML Core" },
  { char: ">", named: "&gt;", decimal: "&#62;", hex: "&#x3E;", desc: "Greater than", group: "HTML Core" },
  { char: '"', named: "&quot;", decimal: "&#34;", hex: "&#x22;", desc: "Double quote", group: "HTML Core" },
  { char: "'", named: "&apos;", decimal: "&#39;", hex: "&#x27;", desc: "Apostrophe", group: "HTML Core" },
  { char: "\u00A0", named: "&nbsp;", decimal: "&#160;", hex: "&#xA0;", desc: "Non-breaking space", group: "HTML Core" },
  // Copyright & Trademark
  { char: "\u00A9", named: "&copy;", decimal: "&#169;", hex: "&#xA9;", desc: "Copyright", group: "Copyright & Trademark" },
  { char: "\u00AE", named: "&reg;", decimal: "&#174;", hex: "&#xAE;", desc: "Registered", group: "Copyright & Trademark" },
  { char: "\u2122", named: "&trade;", decimal: "&#8482;", hex: "&#x2122;", desc: "Trademark", group: "Copyright & Trademark" },
  // Currency
  { char: "\u20AC", named: "&euro;", decimal: "&#8364;", hex: "&#x20AC;", desc: "Euro", group: "Currency" },
  { char: "\u00A3", named: "&pound;", decimal: "&#163;", hex: "&#xA3;", desc: "Pound", group: "Currency" },
  { char: "\u00A5", named: "&yen;", decimal: "&#165;", hex: "&#xA5;", desc: "Yen", group: "Currency" },
  { char: "\u00A2", named: "&cent;", decimal: "&#162;", hex: "&#xA2;", desc: "Cent", group: "Currency" },
  // Arrows
  { char: "\u2190", named: "&larr;", decimal: "&#8592;", hex: "&#x2190;", desc: "Left arrow", group: "Arrows" },
  { char: "\u2192", named: "&rarr;", decimal: "&#8594;", hex: "&#x2192;", desc: "Right arrow", group: "Arrows" },
  { char: "\u2191", named: "&uarr;", decimal: "&#8593;", hex: "&#x2191;", desc: "Up arrow", group: "Arrows" },
  { char: "\u2193", named: "&darr;", decimal: "&#8595;", hex: "&#x2193;", desc: "Down arrow", group: "Arrows" },
  { char: "\u2194", named: "&harr;", decimal: "&#8596;", hex: "&#x2194;", desc: "Left-right arrow", group: "Arrows" },
  // Math Symbols
  { char: "\u00D7", named: "&times;", decimal: "&#215;", hex: "&#xD7;", desc: "Multiplication", group: "Math" },
  { char: "\u00F7", named: "&divide;", decimal: "&#247;", hex: "&#xF7;", desc: "Division", group: "Math" },
  { char: "\u00B1", named: "&plusmn;", decimal: "&#177;", hex: "&#xB1;", desc: "Plus-minus", group: "Math" },
  { char: "\u2260", named: "&ne;", decimal: "&#8800;", hex: "&#x2260;", desc: "Not equal", group: "Math" },
  { char: "\u2264", named: "&le;", decimal: "&#8804;", hex: "&#x2264;", desc: "Less or equal", group: "Math" },
  { char: "\u2265", named: "&ge;", decimal: "&#8805;", hex: "&#x2265;", desc: "Greater or equal", group: "Math" },
  { char: "\u221E", named: "&infin;", decimal: "&#8734;", hex: "&#x221E;", desc: "Infinity", group: "Math" },
  { char: "\u00B0", named: "&deg;", decimal: "&#176;", hex: "&#xB0;", desc: "Degree", group: "Math" },
  { char: "\u00BD", named: "&frac12;", decimal: "&#189;", hex: "&#xBD;", desc: "One half", group: "Math" },
  { char: "\u00BC", named: "&frac14;", decimal: "&#188;", hex: "&#xBC;", desc: "One quarter", group: "Math" },
  { char: "\u00BE", named: "&frac34;", decimal: "&#190;", hex: "&#xBE;", desc: "Three quarters", group: "Math" },
  // Typography
  { char: "\u2014", named: "&mdash;", decimal: "&#8212;", hex: "&#x2014;", desc: "Em dash", group: "Typography" },
  { char: "\u2013", named: "&ndash;", decimal: "&#8211;", hex: "&#x2013;", desc: "En dash", group: "Typography" },
  { char: "\u2026", named: "&hellip;", decimal: "&#8230;", hex: "&#x2026;", desc: "Ellipsis", group: "Typography" },
  { char: "\u2022", named: "&bull;", decimal: "&#8226;", hex: "&#x2022;", desc: "Bullet", group: "Typography" },
  { char: "\u00B7", named: "&middot;", decimal: "&#183;", hex: "&#xB7;", desc: "Middle dot", group: "Typography" },
  { char: "\u201C", named: "&ldquo;", decimal: "&#8220;", hex: "&#x201C;", desc: "Left double quote", group: "Typography" },
  { char: "\u201D", named: "&rdquo;", decimal: "&#8221;", hex: "&#x201D;", desc: "Right double quote", group: "Typography" },
  { char: "\u2018", named: "&lsquo;", decimal: "&#8216;", hex: "&#x2018;", desc: "Left single quote", group: "Typography" },
  { char: "\u2019", named: "&rsquo;", decimal: "&#8217;", hex: "&#x2019;", desc: "Right single quote", group: "Typography" },
  { char: "\u00AB", named: "&laquo;", decimal: "&#171;", hex: "&#xAB;", desc: "Left guillemet", group: "Typography" },
  { char: "\u00BB", named: "&raquo;", decimal: "&#187;", hex: "&#xBB;", desc: "Right guillemet", group: "Typography" },
];

const GROUPS = Array.from(new Set(ENTITY_REFERENCE.map((e) => e.group)));

export default function HtmlEntityEncoderPage() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [mode, setMode] = useState<EncodeMode>("named");
  const [direction, setDirection] = useState<Direction>("encode");
  const [copied, setCopied] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [bulkMode, setBulkMode] = useState(false);
  const [entityFilter, setEntityFilter] = useState("");

  // Live preview as you type
  useEffect(() => {
    if (!input) {
      setOutput("");
      setError("");
      return;
    }
    try {
      if (direction === "encode") {
        setOutput(encodeHTML(input, mode));
      } else {
        setOutput(decodeHTML(input));
      }
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Processing failed.");
    }
  }, [input, mode, direction]);

  const copyToClipboard = useCallback(async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied(null), 1500);
    } catch { /* ignore */ }
  }, []);

  const handleClear = useCallback(() => {
    setInput("");
    setOutput("");
    setError("");
  }, []);

  const handleSwap = useCallback(() => {
    if (output) {
      setInput(output);
      setDirection((d) => (d === "encode" ? "decode" : "encode"));
    }
  }, [output]);

  const filteredEntities = entityFilter
    ? ENTITY_REFERENCE.filter(
        (e) =>
          e.desc.toLowerCase().includes(entityFilter.toLowerCase()) ||
          e.named.toLowerCase().includes(entityFilter.toLowerCase()) ||
          e.char.includes(entityFilter)
      )
    : ENTITY_REFERENCE;

  const filteredGroups = GROUPS.filter((g) =>
    filteredEntities.some((e) => e.group === g)
  );

  return (
    <>
      <title>
        HTML Entity Encoder & Decoder Online - Free HTML Entities Tool |
        DevTools Hub
      </title>
      <meta
        name="description"
        content="Encode special characters to HTML entities or decode them back to text. Supports named (&amp;), decimal (&#38;), and hex (&#x26;) formats. Live preview, entity reference table, and bulk mode. All processing in your browser."
      />
      <meta
        name="keywords"
        content="html entity encoder, html entity decoder, html special characters, html entities list, html encode online, html decode online, html character codes, html symbols"
      />
      <JsonLd
        data={[
          generateWebAppSchema({
            slug: "html-entity-encoder",
            name: "HTML Entity Encoder & Decoder",
            description:
              "Encode special characters to HTML entities or decode them back to text with live preview",
            category: "encoding",
          }),
          generateBreadcrumbSchema({
            slug: "html-entity-encoder",
            name: "HTML Entity Encoder & Decoder",
            description:
              "Encode special characters to HTML entities or decode them back to text",
            category: "encoding",
          }),
          generateFAQSchema([
            {
              question: "Why do I need to encode HTML entities?",
              answer:
                "HTML entities prevent special characters from being interpreted as HTML markup. For example, < and > in text content would be parsed as tags without encoding. Encoding also prevents XSS (cross-site scripting) attacks by neutralizing injected HTML.",
            },
            {
              question:
                "What is the difference between named, decimal, and hex entities?",
              answer:
                "Named entities use readable names (like &amp; for &). Decimal entities use the Unicode code point in base 10 (&#38;). Hex entities use base 16 (&#x26;). All three render identically in browsers. Named entities are most readable; numeric entities work for any Unicode character.",
            },
            {
              question: "Which characters must be encoded in HTML?",
              answer:
                'The 5 mandatory characters are: & (ampersand), < (less than), > (greater than), " (double quote in attributes), and \' (single quote in attributes). All other characters can optionally be encoded for safety or to handle encoding issues.',
            },
            {
              question: "Is my data safe?",
              answer:
                "Yes. All processing happens entirely in your browser using JavaScript. No data is sent to any server.",
            },
          ]),
        ]}
      />

      <div className="min-h-screen bg-slate-900 text-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <ToolBreadcrumb slug="html-entity-encoder" />

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
              HTML Entity Encoder &amp; Decoder
            </h1>
            <p className="text-slate-400 max-w-2xl text-lg">
              Encode special characters to HTML entities or decode entities back
              to text. Live preview as you type. Supports named, decimal, and
              hexadecimal entity formats.
            </p>
          </div>

          <AdUnit slot="TOP_SLOT" format="horizontal" className="mb-6" />

          {/* Controls bar */}
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <div className="flex rounded-lg overflow-hidden border border-slate-600">
              <button
                onClick={() => setDirection("encode")}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  direction === "encode"
                    ? "bg-blue-600 text-white"
                    : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                }`}
              >
                Encode
              </button>
              <button
                onClick={() => setDirection("decode")}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  direction === "decode"
                    ? "bg-blue-600 text-white"
                    : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                }`}
              >
                Decode
              </button>
            </div>

            {direction === "encode" && (
              <div className="flex items-center gap-2">
                <label className="text-sm text-slate-400">Format:</label>
                <select
                  value={mode}
                  onChange={(e) => setMode(e.target.value as EncodeMode)}
                  className="bg-slate-800 border border-slate-600 text-slate-200 rounded px-2 py-1 text-sm"
                >
                  <option value="named">Named (&amp;amp;)</option>
                  <option value="decimal">Decimal (&amp;#38;)</option>
                  <option value="hex">Hex (&amp;#x26;)</option>
                  <option value="all">All Chars</option>
                </select>
              </div>
            )}

            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={bulkMode}
                onChange={(e) => setBulkMode(e.target.checked)}
                className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-slate-300">Bulk mode</span>
            </label>

            <button
              onClick={handleSwap}
              disabled={!output}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors text-sm"
            >
              Swap
            </button>

            <button
              onClick={handleClear}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors text-sm"
            >
              Clear
            </button>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 p-3 bg-red-900/40 border border-red-700 rounded-lg text-red-300 text-sm font-mono">
              <span className="font-bold">Error:</span> {error}
            </div>
          )}

          {/* Editor panels */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
            {/* Input */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-slate-300">
                  {direction === "encode" ? "Text (input)" : "HTML Entities (input)"}
                </label>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-500">
                    {input.length} chars
                  </span>
                  <button
                    onClick={async () => {
                      try {
                        const text = await navigator.clipboard.readText();
                        setInput(text);
                        setError("");
                      } catch { /* ignore */ }
                    }}
                    className="text-xs text-slate-400 hover:text-white transition-colors"
                  >
                    Paste
                  </button>
                </div>
              </div>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={
                  direction === "encode"
                    ? bulkMode
                      ? "Enter multiple lines to encode...\nEach line is processed separately"
                      : 'Enter text to encode (e.g. <script>alert("XSS")</script>)'
                    : bulkMode
                      ? "Enter multiple lines of HTML entities...\nEach line is decoded separately"
                      : "Enter HTML entities to decode (e.g. &lt;div&gt;)"
                }
                className={`w-full bg-slate-800 border rounded-lg p-4 font-mono text-sm text-slate-200 placeholder-slate-500 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  direction === "encode"
                    ? "border-blue-600/50"
                    : "border-slate-600"
                } ${bulkMode ? "h-60" : "h-48"}`}
                spellCheck={false}
              />
            </div>

            {/* Output */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-slate-300">
                  {direction === "encode"
                    ? "HTML Entities (output)"
                    : "Text (output)"}
                </label>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-500">
                    {output.length} chars
                  </span>
                  <button
                    onClick={() => copyToClipboard(output, "output")}
                    disabled={!output}
                    className="text-xs text-slate-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    {copied === "output" ? "Copied!" : "Copy"}
                  </button>
                </div>
              </div>
              <textarea
                value={output}
                readOnly
                className={`w-full bg-slate-800 border border-slate-600 rounded-lg p-4 font-mono text-sm text-slate-200 resize-none focus:outline-none ${
                  bulkMode ? "h-60" : "h-48"
                }`}
                spellCheck={false}
              />
            </div>
          </div>

          {/* Bulk mode info */}
          {bulkMode && (
            <div className="mb-6 p-3 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-400">
              Bulk mode: each line is processed independently. Empty lines are
              preserved.
            </div>
          )}

          {/* Entity Reference Table */}
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 mb-6">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <h2 className="text-lg font-semibold text-white">
                HTML Entity Reference
              </h2>
              <input
                type="text"
                value={entityFilter}
                onChange={(e) => setEntityFilter(e.target.value)}
                placeholder="Filter entities..."
                className="bg-slate-900 border border-slate-600 rounded px-3 py-1.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 w-48"
              />
            </div>
            <p className="text-sm text-slate-400 mb-4">
              Click any entity to copy it to your clipboard.
            </p>

            {filteredGroups.map((group) => (
              <div key={group} className="mb-4 last:mb-0">
                <h3 className="text-sm font-medium text-slate-400 mb-2">
                  {group}
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-700">
                        <th className="text-left py-1.5 px-2 text-slate-500 font-medium w-16">
                          Char
                        </th>
                        <th className="text-left py-1.5 px-2 text-slate-500 font-medium">
                          Named
                        </th>
                        <th className="text-left py-1.5 px-2 text-slate-500 font-medium">
                          Decimal
                        </th>
                        <th className="text-left py-1.5 px-2 text-slate-500 font-medium">
                          Hex
                        </th>
                        <th className="text-left py-1.5 px-2 text-slate-500 font-medium">
                          Description
                        </th>
                      </tr>
                    </thead>
                    <tbody className="text-slate-300">
                      {filteredEntities
                        .filter((e) => e.group === group)
                        .map((entity) => (
                          <tr
                            key={entity.desc}
                            className="border-b border-slate-700/30 hover:bg-slate-700/30"
                          >
                            <td className="py-1.5 px-2 text-lg text-center">
                              {entity.char === "\u00A0" ? "\u23B5" : entity.char}
                            </td>
                            <td className="py-1.5 px-2">
                              <button
                                onClick={() =>
                                  copyToClipboard(entity.named, entity.named)
                                }
                                className={`font-mono text-xs px-1.5 py-0.5 rounded transition-colors ${
                                  copied === entity.named
                                    ? "bg-green-600/30 text-green-300"
                                    : "text-blue-400 hover:bg-blue-600/20"
                                }`}
                              >
                                {copied === entity.named
                                  ? "Copied!"
                                  : entity.named}
                              </button>
                            </td>
                            <td className="py-1.5 px-2">
                              <button
                                onClick={() =>
                                  copyToClipboard(
                                    entity.decimal,
                                    entity.decimal
                                  )
                                }
                                className={`font-mono text-xs px-1.5 py-0.5 rounded transition-colors ${
                                  copied === entity.decimal
                                    ? "bg-green-600/30 text-green-300"
                                    : "text-green-400 hover:bg-green-600/20"
                                }`}
                              >
                                {copied === entity.decimal
                                  ? "Copied!"
                                  : entity.decimal}
                              </button>
                            </td>
                            <td className="py-1.5 px-2">
                              <button
                                onClick={() =>
                                  copyToClipboard(entity.hex, entity.hex)
                                }
                                className={`font-mono text-xs px-1.5 py-0.5 rounded transition-colors ${
                                  copied === entity.hex
                                    ? "bg-green-600/30 text-green-300"
                                    : "text-purple-400 hover:bg-purple-600/20"
                                }`}
                              >
                                {copied === entity.hex
                                  ? "Copied!"
                                  : entity.hex}
                              </button>
                            </td>
                            <td className="py-1.5 px-2 text-xs text-slate-400">
                              {entity.desc}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>

          {/* Tips */}
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 mb-6">
            <h2 className="text-lg font-semibold text-white mb-4">
              HTML Entity Tips
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
              {[
                {
                  name: "Prevent XSS attacks",
                  tip: 'Always encode user-supplied text before inserting into HTML. Characters like <script> become safe &lt;script&gt; entities.',
                },
                {
                  name: "Named vs numeric",
                  tip: "Named entities (&amp;) are readable but limited. Numeric entities (&#38; or &#x26;) work for any Unicode character.",
                },
                {
                  name: "Email-safe HTML",
                  tip: 'Use "All Chars" mode to convert non-ASCII characters to entities. This ensures compatibility with email clients that don\'t support UTF-8.',
                },
                {
                  name: "The 5 mandatory characters",
                  tip: "Always encode & < > \" ' in HTML content. These are the characters that can break HTML parsing.",
                },
                {
                  name: "Bulk processing",
                  tip: "Enable bulk mode to process multiple lines at once. Each line is encoded/decoded independently.",
                },
                {
                  name: "All processing is local",
                  tip: "Your data never leaves your browser. Encoding and decoding happens entirely in JavaScript.",
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

          <AdUnit slot="BOTTOM_SLOT" format="auto" className="my-8" />

          <RelatedTools currentSlug="html-entity-encoder" />

          {/* FAQ */}
          <section className="mt-16 border-t border-slate-700 pt-10">
            <h2 className="text-2xl font-bold text-white mb-6">
              Frequently Asked Questions
            </h2>
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Why do I need to encode HTML entities?
                </h3>
                <p className="text-slate-400">
                  HTML entities prevent special characters from being
                  interpreted as HTML markup. For example, &lt; and &gt; in text
                  content would be parsed as tags without encoding. Encoding
                  also prevents XSS (cross-site scripting) attacks by
                  neutralizing injected HTML.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  What is the difference between named, decimal, and hex
                  entities?
                </h3>
                <p className="text-slate-400">
                  Named entities use readable names (like &amp;amp; for &amp;).
                  Decimal entities use the Unicode code point in base 10
                  (&amp;#38;). Hex entities use base 16 (&amp;#x26;). All three
                  render identically in browsers. Named entities are most
                  readable; numeric entities work for any Unicode character.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Which characters must be encoded in HTML?
                </h3>
                <p className="text-slate-400">
                  The 5 mandatory characters are: &amp; (ampersand), &lt; (less
                  than), &gt; (greater than), &quot; (double quote in
                  attributes), and &apos; (single quote in attributes). All
                  other characters can optionally be encoded for safety or to
                  handle encoding issues.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Is my data safe?
                </h3>
                <p className="text-slate-400">
                  Yes. All processing happens entirely in your browser using
                  JavaScript. No data is sent to any server.
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
