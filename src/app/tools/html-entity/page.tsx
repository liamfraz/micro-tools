"use client";

import { useState, useCallback, useEffect } from "react";
import ToolLayout from "@/components/ToolLayout";

type EncodeMode = "named" | "decimal" | "hex";
type Direction = "encode" | "decode";

const NAMED_ENTITIES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&apos;",
  "\u00A0": "&nbsp;",
  "\u00A9": "&copy;",
  "\u00AE": "&reg;",
  "\u2122": "&trade;",
  "\u20AC": "&euro;",
  "\u00A3": "&pound;",
  "\u00A5": "&yen;",
  "\u00A2": "&cent;",
  "\u00B0": "&deg;",
  "\u00B1": "&plusmn;",
  "\u00D7": "&times;",
  "\u00F7": "&divide;",
  "\u2260": "&ne;",
  "\u2264": "&le;",
  "\u2265": "&ge;",
  "\u221E": "&infin;",
  "\u00BD": "&frac12;",
  "\u00BC": "&frac14;",
  "\u00BE": "&frac34;",
  "\u2014": "&mdash;",
  "\u2013": "&ndash;",
  "\u2026": "&hellip;",
  "\u2022": "&bull;",
  "\u201C": "&ldquo;",
  "\u201D": "&rdquo;",
  "\u2018": "&lsquo;",
  "\u2019": "&rsquo;",
  "\u00AB": "&laquo;",
  "\u00BB": "&raquo;",
  "\u2190": "&larr;",
  "\u2192": "&rarr;",
  "\u2191": "&uarr;",
  "\u2193": "&darr;",
};

const ENTITY_TO_CHAR: Record<string, string> = {};
for (const [char, entity] of Object.entries(NAMED_ENTITIES)) {
  ENTITY_TO_CHAR[entity] = char;
}

function encodeHTML(input: string, mode: EncodeMode): string {
  let result = "";
  for (let i = 0; i < input.length; i++) {
    const char = input[i];
    const code = input.charCodeAt(i);

    if (mode === "named" && NAMED_ENTITIES[char]) {
      result += NAMED_ENTITIES[char];
      continue;
    }

    if (
      char === "&" ||
      char === "<" ||
      char === ">" ||
      char === '"' ||
      char === "'" ||
      code > 127
    ) {
      if (mode === "decimal") {
        result += `&#${code};`;
      } else if (mode === "hex") {
        result += `&#x${code.toString(16).toUpperCase()};`;
      } else {
        // named fallback for non-mapped chars: use decimal
        result += `&#${code};`;
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

const QUICK_EXAMPLES = [
  { label: "<script>", value: '<script>alert("XSS")</script>' },
  { label: "& symbols", value: "AT&T, H&M, R&D — 5 > 3 & 2 < 4" },
  { label: "Quotes", value: 'She said "hello" & it\'s fine' },
  { label: "Currency", value: "€50 or £30 or ¥500 or ©2024" },
];

export default function HtmlEntityPage() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [mode, setMode] = useState<EncodeMode>("named");
  const [direction, setDirection] = useState<Direction>("encode");
  const [copied, setCopied] = useState(false);
  const [charCount, setCharCount] = useState(0);

  useEffect(() => {
    if (!input) {
      setOutput("");
      setCharCount(0);
      return;
    }
    setCharCount(input.length);
    if (direction === "encode") {
      setOutput(encodeHTML(input, mode));
    } else {
      setOutput(decodeHTML(input));
    }
  }, [input, mode, direction]);

  const copyOutput = useCallback(async () => {
    if (!output) return;
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }, [output]);

  const handleSwap = useCallback(() => {
    if (output) {
      setInput(output);
      setDirection((d) => (d === "encode" ? "decode" : "encode"));
    }
  }, [output]);

  const handleClear = useCallback(() => {
    setInput("");
    setOutput("");
  }, []);

  const loadExample = useCallback((value: string) => {
    setInput(value);
    setDirection("encode");
  }, []);

  return (
    <ToolLayout
      title="HTML Entity Encoder / Decoder"
      description="Encode special characters to HTML entities or decode entities back to plain text. Supports named (&amp;amp;), decimal (&amp;#38;), and hex (&amp;#x26;) formats."
      category="encoding"
    >
      {/* Direction + Mode controls */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        {/* Encode / Decode toggle */}
        <div className="flex rounded-lg overflow-hidden border border-slate-700">
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

        {/* Format selector (encode only) */}
        {direction === "encode" && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-400">Format:</span>
            <div className="flex rounded-lg overflow-hidden border border-slate-700">
              {(["named", "decimal", "hex"] as EncodeMode[]).map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={`px-3 py-2 text-xs font-medium transition-colors ${
                    mode === m
                      ? "bg-slate-600 text-white"
                      : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                  }`}
                >
                  {m === "named" ? "Named" : m === "decimal" ? "Decimal" : "Hex"}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-2 ml-auto">
          <button
            onClick={handleSwap}
            disabled={!output}
            title="Swap input/output and flip direction"
            className="px-3 py-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-40 disabled:cursor-not-allowed text-slate-200 rounded-lg text-sm transition-colors"
          >
            ⇄ Swap
          </button>
          <button
            onClick={handleClear}
            className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-sm transition-colors"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Quick examples */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <span className="text-xs text-slate-500">Try:</span>
        {QUICK_EXAMPLES.map((ex) => (
          <button
            key={ex.label}
            onClick={() => loadExample(ex.value)}
            className="px-2 py-1 text-xs bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded transition-colors"
          >
            {ex.label}
          </button>
        ))}
      </div>

      {/* Editor panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Input */}
        <div className="flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-slate-300">
              {direction === "encode" ? "Plain Text" : "HTML Entities"}
            </label>
            <span className="text-xs text-slate-500">{charCount} chars</span>
          </div>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              direction === "encode"
                ? 'Paste text to encode, e.g. <div class="example">'
                : "Paste HTML entities to decode, e.g. &lt;div&gt;"
            }
            className="flex-1 min-h-[180px] w-full bg-slate-800 border border-slate-600 rounded-lg p-4 font-mono text-sm text-slate-200 placeholder-slate-500 resize-y focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
            spellCheck={false}
          />
        </div>

        {/* Output */}
        <div className="flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-slate-300">
              {direction === "encode" ? "HTML Entities" : "Plain Text"}
            </label>
            <button
              onClick={copyOutput}
              disabled={!output}
              className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                copied
                  ? "bg-green-600 text-white"
                  : "bg-slate-700 hover:bg-slate-600 text-slate-200"
              }`}
            >
              {copied ? (
                <>
                  <svg className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Copied!
                </>
              ) : (
                <>
                  <svg
                    className="w-3 h-3"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                  Copy
                </>
              )}
            </button>
          </div>
          <textarea
            value={output}
            readOnly
            className="flex-1 min-h-[180px] w-full bg-slate-900 border border-slate-700 rounded-lg p-4 font-mono text-sm text-slate-200 resize-y focus:outline-none"
            spellCheck={false}
          />
        </div>
      </div>

      {/* Entity reference */}
      <div className="mt-8 bg-slate-800/60 border border-slate-700 rounded-lg p-5">
        <h2 className="text-sm font-semibold text-white mb-4">
          Common HTML Entities
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 text-xs">
          {[
            { char: "&", entity: "&amp;", label: "Ampersand" },
            { char: "<", entity: "&lt;", label: "Less than" },
            { char: ">", entity: "&gt;", label: "Greater than" },
            { char: '"', entity: "&quot;", label: "Double quote" },
            { char: "'", entity: "&apos;", label: "Apostrophe" },
            { char: "\u00A0", entity: "&nbsp;", label: "Non-breaking space" },
            { char: "©", entity: "&copy;", label: "Copyright" },
            { char: "®", entity: "&reg;", label: "Registered" },
            { char: "™", entity: "&trade;", label: "Trademark" },
            { char: "€", entity: "&euro;", label: "Euro" },
            { char: "£", entity: "&pound;", label: "Pound" },
            { char: "—", entity: "&mdash;", label: "Em dash" },
            { char: "–", entity: "&ndash;", label: "En dash" },
            { char: "…", entity: "&hellip;", label: "Ellipsis" },
            { char: "×", entity: "&times;", label: "Multiplication" },
            { char: "÷", entity: "&divide;", label: "Division" },
          ].map(({ char, entity, label }) => (
            <button
              key={entity}
              onClick={() => {
                navigator.clipboard.writeText(entity);
              }}
              title={`Copy ${entity}`}
              className="flex items-center gap-2 px-2.5 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-600 rounded transition-colors text-left group"
            >
              <span className="text-base w-5 text-center text-slate-200 group-hover:text-white">
                {char === "\u00A0" ? "·" : char}
              </span>
              <span className="flex-1 min-w-0">
                <span className="block font-mono text-blue-400 truncate">
                  {entity}
                </span>
                <span className="block text-slate-500 truncate">{label}</span>
              </span>
            </button>
          ))}
        </div>
        <p className="mt-3 text-xs text-slate-500">
          Click any entity to copy it to your clipboard.
        </p>
      </div>
    </ToolLayout>
  );
}
