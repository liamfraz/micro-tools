"use client";

import { useState, useCallback } from "react";
import JsonLd from "@/components/JsonLd";
import RelatedTools from "@/components/RelatedTools";
import {
  generateFAQSchema,
  generateWebAppSchema,
  generateBreadcrumbSchema,
} from "@/lib/jsonld";

type EncodeMode = "named" | "decimal" | "hex" | "all";

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

const encodeHTML = (input: string, mode: EncodeMode): string => {
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

    // For "all" mode, encode everything non-ASCII
    if (mode === "all" && code > 127) {
      result += `&#x${code.toString(16).toUpperCase()};`;
      continue;
    }

    // For named mode, only encode characters that have named entities
    if (mode === "named") {
      result += char;
      continue;
    }

    // For decimal/hex modes, encode the 5 core HTML chars + non-ASCII
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
};

const decodeHTML = (input: string): string => {
  let result = input;

  // Decode named entities
  result = result.replace(/&[a-zA-Z]+;/g, (match) => {
    if (ENTITY_TO_CHAR[match]) return ENTITY_TO_CHAR[match];
    // Try browser's built-in decoder for entities we don't have
    if (typeof document !== "undefined") {
      const el = document.createElement("textarea");
      el.innerHTML = match;
      return el.value;
    }
    return match;
  });

  // Decode decimal numeric entities
  result = result.replace(/&#(\d+);/g, (_, code) => {
    return String.fromCharCode(parseInt(code, 10));
  });

  // Decode hex numeric entities
  result = result.replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => {
    return String.fromCharCode(parseInt(hex, 16));
  });

  return result;
};

const COMMON_ENTITIES: { char: string; named: string; decimal: string; hex: string; desc: string }[] = [
  { char: "&", named: "&amp;", decimal: "&#38;", hex: "&#x26;", desc: "Ampersand" },
  { char: "<", named: "&lt;", decimal: "&#60;", hex: "&#x3C;", desc: "Less than" },
  { char: ">", named: "&gt;", decimal: "&#62;", hex: "&#x3E;", desc: "Greater than" },
  { char: '"', named: "&quot;", decimal: "&#34;", hex: "&#x22;", desc: "Double quote" },
  { char: "'", named: "&apos;", decimal: "&#39;", hex: "&#x27;", desc: "Single quote / apostrophe" },
  { char: "\u00A0", named: "&nbsp;", decimal: "&#160;", hex: "&#xA0;", desc: "Non-breaking space" },
  { char: "\u00A9", named: "&copy;", decimal: "&#169;", hex: "&#xA9;", desc: "Copyright" },
  { char: "\u00AE", named: "&reg;", decimal: "&#174;", hex: "&#xAE;", desc: "Registered" },
  { char: "\u2122", named: "&trade;", decimal: "&#8482;", hex: "&#x2122;", desc: "Trademark" },
  { char: "\u20AC", named: "&euro;", decimal: "&#8364;", hex: "&#x20AC;", desc: "Euro sign" },
  { char: "\u00A3", named: "&pound;", decimal: "&#163;", hex: "&#xA3;", desc: "Pound sign" },
  { char: "\u2014", named: "&mdash;", decimal: "&#8212;", hex: "&#x2014;", desc: "Em dash" },
  { char: "\u2013", named: "&ndash;", decimal: "&#8211;", hex: "&#x2013;", desc: "En dash" },
  { char: "\u2026", named: "&hellip;", decimal: "&#8230;", hex: "&#x2026;", desc: "Ellipsis" },
  { char: "\u00B0", named: "&deg;", decimal: "&#176;", hex: "&#xB0;", desc: "Degree" },
  { char: "\u00D7", named: "&times;", decimal: "&#215;", hex: "&#xD7;", desc: "Multiplication" },
  { char: "\u00F7", named: "&divide;", decimal: "&#247;", hex: "&#xF7;", desc: "Division" },
  { char: "\u2192", named: "&rarr;", decimal: "&#8594;", hex: "&#x2192;", desc: "Right arrow" },
];

export default function HtmlEntityEncoderPage() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [mode, setMode] = useState<EncodeMode>("named");
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  const handleEncode = useCallback(() => {
    if (!input.trim()) { setOutput(""); setError(""); return; }
    try {
      setOutput(encodeHTML(input, mode));
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Encoding failed.");
    }
  }, [input, mode]);

  const handleDecode = useCallback(() => {
    if (!input.trim()) { setOutput(""); setError(""); return; }
    try {
      setOutput(decodeHTML(input));
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Decoding failed.");
    }
  }, [input]);

  const handleCopy = useCallback(async () => {
    if (!output) return;
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* ignore */ }
  }, [output]);

  const handleClear = useCallback(() => {
    setInput("");
    setOutput("");
    setError("");
  }, []);

  const handleSwap = useCallback(() => {
    if (output) {
      setInput(output);
      setOutput("");
      setError("");
    }
  }, [output]);

  const EXAMPLE_ENCODE = `<div class="alert">Price: $5 & up — "Best value" © 2026</div>`;
  const EXAMPLE_DECODE = `&lt;div class=&quot;alert&quot;&gt;Price: $5 &amp; up &mdash; &ldquo;Best value&rdquo; &copy; 2026&lt;/div&gt;`;

  return (
    <>
      <title>HTML Entity Encoder & Decoder - Free Online Tool | DevTools Hub</title>
      <meta
        name="description"
        content="Encode special characters to HTML entities or decode them back to text. Supports named, decimal, and hexadecimal entity formats."
      />
      <JsonLd
        data={[
          generateWebAppSchema({
            slug: "html-entity-encoder",
            name: "HTML Entity Encoder/Decoder",
            description: "Encode special characters to HTML entities or decode them back to text",
            category: "developer",
          }),
          generateBreadcrumbSchema({
            slug: "html-entity-encoder",
            name: "HTML Entity Encoder/Decoder",
            description: "Encode special characters to HTML entities or decode them back to text",
            category: "developer",
          }),
          generateFAQSchema([
            { question: "Why do I need to encode HTML entities?", answer: "HTML entities prevent special characters from being interpreted as HTML markup. For example, < and > in text content would be parsed as tags without encoding. Encoding also prevents XSS (cross-site scripting) attacks by neutralizing injected HTML." },
            { question: "What's the difference between named, decimal, and hex entities?", answer: "Named entities use readable names (like &amp; for &). Decimal entities use the Unicode code point in base 10 (&#38;). Hex entities use base 16 (&#x26;). All three render identically in browsers. Named entities are most readable; numeric entities work for any Unicode character." },
            { question: "Which characters must be encoded in HTML?", answer: "The 5 mandatory characters are: & (ampersand), < (less than), > (greater than), \" (double quote in attributes), and ' (single quote in attributes). All other characters can optionally be encoded for safety or to handle encoding issues." },
            { question: "What does 'All Chars' encoding mode do?", answer: "All Chars mode encodes every character that has a named entity (like &copy; for \u00A9) plus all non-ASCII characters using hex notation. This is useful when you need to ensure your HTML is pure ASCII-safe, for example in email templates or legacy systems." },
          ]),
        ]}
      />

    <main className="min-h-screen bg-slate-900 text-white">
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-8">
          <a href="/" className="text-blue-400 hover:text-blue-300 text-sm mb-4 inline-block">
            ← Back to all tools
          </a>
          <h1 className="text-3xl font-bold mb-2">HTML Entity Encoder & Decoder</h1>
          <p className="text-slate-400">
            Encode special characters to HTML entities or decode entities back to text. Supports named, decimal, and hexadecimal entity formats.
          </p>
        </div>

        {/* Input */}
        <div className="bg-slate-800 rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-medium text-slate-300">Input</label>
            <div className="flex gap-2">
              <button
                onClick={() => { setInput(EXAMPLE_ENCODE); setOutput(""); setError(""); }}
                className="px-2 py-1 text-xs bg-slate-700 hover:bg-slate-600 rounded text-slate-300 transition-colors"
              >
                Encode Example
              </button>
              <button
                onClick={() => { setInput(EXAMPLE_DECODE); setOutput(""); setError(""); }}
                className="px-2 py-1 text-xs bg-slate-700 hover:bg-slate-600 rounded text-slate-300 transition-colors"
              >
                Decode Example
              </button>
              <button
                onClick={handleClear}
                className="px-2 py-1 text-xs bg-slate-700 hover:bg-slate-600 rounded text-slate-300 transition-colors"
              >
                Clear
              </button>
            </div>
          </div>

          <textarea
            value={input}
            onChange={(e) => { setInput(e.target.value); setError(""); }}
            placeholder="Enter text to encode or HTML entities to decode..."
            className="w-full h-40 bg-slate-900 border border-slate-700 rounded p-3 text-sm font-mono text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
            spellCheck={false}
          />

          {/* Encoding Mode */}
          <div className="mt-3 mb-3">
            <label className="block text-xs text-slate-400 mb-2">Encoding Format</label>
            <div className="grid grid-cols-4 gap-2">
              {([
                { value: "named" as EncodeMode, label: "Named", desc: "&amp;" },
                { value: "decimal" as EncodeMode, label: "Decimal", desc: "&#38;" },
                { value: "hex" as EncodeMode, label: "Hex", desc: "&#x26;" },
                { value: "all" as EncodeMode, label: "All Chars", desc: "Named + non-ASCII" },
              ]).map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setMode(opt.value)}
                  className={`py-2 px-3 rounded text-sm transition-colors ${
                    mode === opt.value
                      ? "bg-blue-600 text-white"
                      : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                  }`}
                >
                  <div className="font-medium">{opt.label}</div>
                  <div className="text-xs opacity-70 font-mono">{opt.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={handleEncode}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded transition-colors text-sm"
            >
              Encode →
            </button>
            <button
              onClick={handleDecode}
              className="bg-slate-700 hover:bg-slate-600 text-white font-medium py-2 px-4 rounded transition-colors text-sm"
            >
              ← Decode
            </button>
            <button
              onClick={handleSwap}
              className="bg-slate-700 hover:bg-slate-600 text-white font-medium py-2 px-4 rounded transition-colors text-sm"
            >
              ⇄ Swap
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-900/50 border border-red-700 rounded-lg p-4 mb-6 text-red-300 text-sm">
            {error}
          </div>
        )}

        {/* Output */}
        {output && (
          <div className="bg-slate-800 rounded-lg p-6 mb-6">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-slate-300">Output</label>
              <button
                onClick={handleCopy}
                className="px-3 py-1 text-xs bg-blue-600 hover:bg-blue-700 rounded text-white transition-colors"
              >
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
            <pre className="w-full bg-slate-900 border border-slate-700 rounded p-3 text-sm font-mono text-slate-200 overflow-x-auto max-h-64 overflow-y-auto whitespace-pre-wrap break-all">
              {output}
            </pre>
          </div>
        )}

        {/* Common Entities Reference */}
        <div className="bg-slate-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Common HTML Entities</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left py-2 text-slate-400 font-medium">Character</th>
                  <th className="text-left py-2 text-slate-400 font-medium">Named</th>
                  <th className="text-left py-2 text-slate-400 font-medium">Decimal</th>
                  <th className="text-left py-2 text-slate-400 font-medium">Hex</th>
                  <th className="text-left py-2 text-slate-400 font-medium">Description</th>
                </tr>
              </thead>
              <tbody className="text-slate-300">
                {COMMON_ENTITIES.map((entity) => (
                  <tr key={entity.desc} className="border-b border-slate-700/50">
                    <td className="py-1.5 text-lg text-center w-12">{entity.char === "\u00A0" ? "⎵" : entity.char}</td>
                    <td className="py-1.5 font-mono text-blue-400 text-xs">{entity.named}</td>
                    <td className="py-1.5 font-mono text-green-400 text-xs">{entity.decimal}</td>
                    <td className="py-1.5 font-mono text-purple-400 text-xs">{entity.hex}</td>
                    <td className="py-1.5 text-xs">{entity.desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <RelatedTools currentSlug="html-entity-encoder" />

        {/* FAQ */}
        <div className="bg-slate-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {[
              {
                q: "Why do I need to encode HTML entities?",
                a: "HTML entities prevent special characters from being interpreted as HTML markup. For example, < and > in text content would be parsed as tags without encoding. Encoding also prevents XSS (cross-site scripting) attacks by neutralizing injected HTML."
              },
              {
                q: "What's the difference between named, decimal, and hex entities?",
                a: "Named entities use readable names (like &amp; for &). Decimal entities use the Unicode code point in base 10 (&#38;). Hex entities use base 16 (&#x26;). All three render identically in browsers. Named entities are most readable; numeric entities work for any Unicode character."
              },
              {
                q: "Which characters must be encoded in HTML?",
                a: "The 5 mandatory characters are: & (ampersand), < (less than), > (greater than), \" (double quote in attributes), and ' (single quote in attributes). All other characters can optionally be encoded for safety or to handle encoding issues."
              },
              {
                q: "What does 'All Chars' encoding mode do?",
                a: "All Chars mode encodes every character that has a named entity (like &copy; for ©) plus all non-ASCII characters using hex notation. This is useful when you need to ensure your HTML is pure ASCII-safe, for example in email templates or legacy systems."
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
    </>
  );
}
