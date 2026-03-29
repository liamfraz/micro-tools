"use client";

import { useState, useCallback } from "react";
import JsonLd from "@/components/JsonLd";
import RelatedTools from "@/components/RelatedTools";
import ToolBreadcrumb from "@/components/ToolBreadcrumb";
import {
  generateFAQSchema,
  generateWebAppSchema,
  generateBreadcrumbSchema,
} from "@/lib/jsonld";

type Base = 2 | 8 | 10 | 16;

const BASE_LABELS: Record<Base, string> = {
  2: "Binary (Base 2)",
  8: "Octal (Base 8)",
  10: "Decimal (Base 10)",
  16: "Hexadecimal (Base 16)",
};

const BASE_PREFIXES: Record<Base, string> = {
  2: "0b",
  8: "0o",
  10: "",
  16: "0x",
};

const BASE_PLACEHOLDERS: Record<Base, string> = {
  2: "e.g. 11010110",
  8: "e.g. 326",
  10: "e.g. 214",
  16: "e.g. D6",
};

const VALID_CHARS: Record<Base, RegExp> = {
  2: /^[01]+$/,
  8: /^[0-7]+$/,
  10: /^[0-9]+$/,
  16: /^[0-9a-fA-F]+$/,
};

const cleanInput = (value: string): string => {
  // Remove common prefixes
  let cleaned = value.trim();
  if (cleaned.startsWith("0b") || cleaned.startsWith("0B")) cleaned = cleaned.slice(2);
  else if (cleaned.startsWith("0o") || cleaned.startsWith("0O")) cleaned = cleaned.slice(2);
  else if (cleaned.startsWith("0x") || cleaned.startsWith("0X")) cleaned = cleaned.slice(2);
  // Remove spaces and underscores (common separators)
  cleaned = cleaned.replace(/[\s_]/g, "");
  return cleaned;
};

const convertBase = (input: string, fromBase: Base): Record<Base, string> | null => {
  const cleaned = cleanInput(input);
  if (!cleaned || !VALID_CHARS[fromBase].test(cleaned)) return null;

  try {
    // Use BigInt for large number support
    let decimal: bigint;
    if (fromBase === 10) {
      decimal = BigInt(cleaned);
    } else if (fromBase === 16) {
      decimal = BigInt("0x" + cleaned);
    } else if (fromBase === 8) {
      decimal = BigInt("0o" + cleaned);
    } else {
      decimal = BigInt("0b" + cleaned);
    }

    return {
      2: decimal.toString(2),
      8: decimal.toString(8),
      10: decimal.toString(10),
      16: decimal.toString(16).toUpperCase(),
    };
  } catch {
    return null;
  }
};

const formatBinary = (bin: string): string => {
  // Group in 4-bit nibbles from right
  const padded = bin.padStart(Math.ceil(bin.length / 4) * 4, "0");
  const groups: string[] = [];
  for (let i = 0; i < padded.length; i += 4) {
    groups.push(padded.slice(i, i + 4));
  }
  return groups.join(" ");
};

const formatHex = (hex: string): string => {
  // Group in pairs from right
  const padded = hex.padStart(Math.ceil(hex.length / 2) * 2, "0");
  const groups: string[] = [];
  for (let i = 0; i < padded.length; i += 2) {
    groups.push(padded.slice(i, i + 2));
  }
  return groups.join(" ");
};

const formatDecimal = (dec: string): string => {
  // Add thousand separators
  return dec.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

const PRESETS: { label: string; value: string; base: Base }[] = [
  { label: "255", value: "255", base: 10 },
  { label: "256", value: "256", base: 10 },
  { label: "1024", value: "1024", base: 10 },
  { label: "65535", value: "65535", base: 10 },
  { label: "FF", value: "FF", base: 16 },
  { label: "DEADBEEF", value: "DEADBEEF", base: 16 },
  { label: "11111111", value: "11111111", base: 2 },
  { label: "777", value: "777", base: 8 },
];

export default function NumberBaseConverterPage() {
  const [input, setInput] = useState("");
  const [fromBase, setFromBase] = useState<Base>(10);
  const [results, setResults] = useState<Record<Base, string> | null>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState<Base | null>(null);

  const handleConvert = useCallback(() => {
    setError("");
    setCopied(null);

    if (!input.trim()) {
      setResults(null);
      return;
    }

    const cleaned = cleanInput(input);
    if (!VALID_CHARS[fromBase].test(cleaned)) {
      setError(`Invalid ${BASE_LABELS[fromBase].toLowerCase()} number. Only ${fromBase === 2 ? "0-1" : fromBase === 8 ? "0-7" : fromBase === 10 ? "0-9" : "0-9, A-F"} allowed.`);
      setResults(null);
      return;
    }

    const result = convertBase(input, fromBase);
    if (!result) {
      setError("Conversion failed. Check your input.");
      setResults(null);
      return;
    }

    setResults(result);
  }, [input, fromBase]);

  // Auto-convert on input/base change
  const handleInputChange = useCallback((value: string) => {
    setInput(value);
    setError("");
    setCopied(null);
    if (!value.trim()) {
      setResults(null);
      return;
    }
    const cleaned = cleanInput(value);
    if (cleaned && VALID_CHARS[fromBase].test(cleaned)) {
      const result = convertBase(value, fromBase);
      if (result) setResults(result);
    }
  }, [fromBase]);

  const handleBaseChange = useCallback((base: Base) => {
    setFromBase(base);
    setError("");
    setCopied(null);
    if (input.trim()) {
      const cleaned = cleanInput(input);
      if (cleaned && VALID_CHARS[base].test(cleaned)) {
        const result = convertBase(input, base);
        if (result) setResults(result);
        else setResults(null);
      } else {
        setResults(null);
      }
    }
  }, [input]);

  const handleCopy = useCallback(async (base: Base) => {
    if (!results) return;
    try {
      await navigator.clipboard.writeText(results[base]);
      setCopied(base);
      setTimeout(() => setCopied(null), 2000);
    } catch { /* ignore */ }
  }, [results]);

  const handlePreset = useCallback((preset: typeof PRESETS[0]) => {
    setFromBase(preset.base);
    setInput(preset.value);
    setError("");
    const result = convertBase(preset.value, preset.base);
    if (result) setResults(result);
  }, []);

  const bases: Base[] = [2, 8, 10, 16];

  return (
    <main className="min-h-screen bg-slate-900 text-white">
      <title>Number Base Converter - Free Online Tool | DevTools Hub</title>
      <meta
        name="description"
        content="Convert numbers between binary, octal, decimal, and hexadecimal bases. Supports large numbers with BigInt precision. Free online converter."
      />
      <JsonLd
        data={[
          generateWebAppSchema({
            slug: "number-base-converter",
            name: "Number Base Converter",
            description: "Convert numbers between binary, octal, decimal, and hexadecimal bases",
            category: "encoding",
          }),
          generateBreadcrumbSchema({
            slug: "number-base-converter",
            name: "Number Base Converter",
            description: "Convert numbers between binary, octal, decimal, and hexadecimal bases",
            category: "encoding",
          }),
          generateFAQSchema([
            { question: "What number bases are supported?", answer: "This converter supports the 4 most common bases in programming: binary (base 2, used in low-level computing), octal (base 8, used in Unix file permissions), decimal (base 10, standard human notation), and hexadecimal (base 16, used in memory addresses, colors, and byte representation)." },
            { question: "Can this handle very large numbers?", answer: "Yes! The converter uses JavaScript BigInt for arbitrary precision arithmetic. You can convert numbers of any size \u2014 there's no practical upper limit. This is important for cryptography, hash values, and large binary data." },
            { question: "What are the 0b, 0o, and 0x prefixes?", answer: "These are standard programming notation prefixes: 0b for binary (0b1010 = 10), 0o for octal (0o12 = 10), and 0x for hexadecimal (0xA = 10). Most programming languages (JavaScript, Python, C, Java) use these prefixes. You can paste numbers with or without prefixes." },
            { question: "Why is hexadecimal so common in programming?", answer: "Each hex digit represents exactly 4 binary bits, making it a compact way to represent binary data. One byte (8 bits) is exactly 2 hex digits. This is why hex is used for memory addresses, color codes (#FF0000), MAC addresses, and byte sequences." },
          ]),
        ]}
      />
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-8">
          <a href="/" className="text-blue-400 hover:text-blue-300 text-sm mb-4 inline-block">
            ← Back to all tools
          </a>
          <h1 className="text-3xl font-bold mb-2">Number Base Converter</h1>
          <p className="text-slate-400">
            Convert numbers between binary, octal, decimal, and hexadecimal. Supports large numbers with BigInt precision.
          </p>
        </div>

        {/* Input */}
        <div className="bg-slate-800 rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-medium text-slate-300">Input Number</label>
            <div className="flex items-center gap-2">
              <label className="text-xs text-slate-400">From:</label>
              <select
                value={fromBase}
                onChange={(e) => handleBaseChange(parseInt(e.target.value, 10) as Base)}
                className="bg-slate-700 border border-slate-600 rounded px-2 py-1 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {bases.map((b) => (
                  <option key={b} value={b}>{BASE_LABELS[b]}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="relative">
            {BASE_PREFIXES[fromBase] && (
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-mono text-sm">
                {BASE_PREFIXES[fromBase]}
              </span>
            )}
            <input
              type="text"
              value={input}
              onChange={(e) => handleInputChange(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleConvert(); }}
              placeholder={BASE_PLACEHOLDERS[fromBase]}
              className={`w-full bg-slate-900 border border-slate-700 rounded px-3 py-3 text-lg font-mono text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 ${BASE_PREFIXES[fromBase] ? "pl-10" : ""}`}
              spellCheck={false}
            />
          </div>

          {/* Presets */}
          <div className="flex flex-wrap gap-2 mt-3">
            {PRESETS.map((preset) => (
              <button
                key={preset.label + preset.base}
                onClick={() => handlePreset(preset)}
                className="px-3 py-1 text-xs bg-slate-700 hover:bg-slate-600 rounded border border-slate-600 text-slate-300 transition-colors font-mono"
              >
                {BASE_PREFIXES[preset.base]}{preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-900/50 border border-red-700 rounded-lg p-4 mb-6 text-red-300 text-sm">
            {error}
          </div>
        )}

        {/* Results */}
        {results && (
          <div className="bg-slate-800 rounded-lg p-6 mb-6">
            <h2 className="text-sm font-medium text-slate-400 mb-4">Conversion Results</h2>
            <div className="space-y-3">
              {bases.map((base) => (
                <div key={base} className="bg-slate-900 rounded p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-slate-400 font-medium">{BASE_LABELS[base]}</span>
                    <button
                      onClick={() => handleCopy(base)}
                      className="px-2 py-0.5 text-xs bg-slate-700 hover:bg-slate-600 rounded text-slate-300 transition-colors"
                    >
                      {copied === base ? "Copied!" : "Copy"}
                    </button>
                  </div>
                  <div className="font-mono text-sm text-white break-all">
                    <span className="text-slate-500">{BASE_PREFIXES[base]}</span>
                    {base === 2 ? formatBinary(results[base]) :
                     base === 16 ? formatHex(results[base]) :
                     base === 10 ? formatDecimal(results[base]) :
                     results[base]}
                  </div>
                  {base === 2 && results[base].length > 0 && (
                    <div className="text-xs text-slate-500 mt-1">{results[base].length} bits</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Reference */}
        <div className="bg-slate-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Base Conversion Reference</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left py-2 text-slate-400 font-medium">Decimal</th>
                  <th className="text-left py-2 text-slate-400 font-medium">Binary</th>
                  <th className="text-left py-2 text-slate-400 font-medium">Octal</th>
                  <th className="text-left py-2 text-slate-400 font-medium">Hex</th>
                </tr>
              </thead>
              <tbody className="text-slate-300 font-mono">
                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map((n) => (
                  <tr key={n} className="border-b border-slate-700/50">
                    <td className="py-1">{n}</td>
                    <td className="py-1">{n.toString(2).padStart(4, "0")}</td>
                    <td className="py-1">{n.toString(8)}</td>
                    <td className="py-1">{n.toString(16).toUpperCase()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Common Values */}
        <div className="bg-slate-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Common Values in Programming</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { label: "Max unsigned byte", dec: "255", hex: "FF", bin: "1111 1111", note: "uint8" },
              { label: "Max signed byte", dec: "127", hex: "7F", bin: "0111 1111", note: "int8" },
              { label: "Max unsigned 16-bit", dec: "65,535", hex: "FFFF", bin: "16 bits all 1", note: "uint16" },
              { label: "Max signed 32-bit", dec: "2,147,483,647", hex: "7FFFFFFF", bin: "31 bits", note: "int32" },
              { label: "Unix permissions 755", dec: "493", hex: "1ED", bin: "111 101 101", note: "rwxr-xr-x" },
              { label: "Unix permissions 644", dec: "420", hex: "1A4", bin: "110 100 100", note: "rw-r--r--" },
            ].map((item) => (
              <div key={item.label} className="bg-slate-700/50 rounded p-3">
                <div className="font-medium text-white text-sm">{item.label}</div>
                <div className="text-xs text-slate-400 mt-1 font-mono">
                  {item.dec} = 0x{item.hex} = {item.bin}
                </div>
                <div className="text-xs text-slate-500 mt-0.5">{item.note}</div>
              </div>
            ))}
          </div>
        </div>

        <RelatedTools currentSlug="number-base-converter" />

        {/* FAQ */}
        <div className="bg-slate-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {[
              {
                q: "What number bases are supported?",
                a: "This converter supports the 4 most common bases in programming: binary (base 2, used in low-level computing), octal (base 8, used in Unix file permissions), decimal (base 10, standard human notation), and hexadecimal (base 16, used in memory addresses, colors, and byte representation)."
              },
              {
                q: "Can this handle very large numbers?",
                a: "Yes! The converter uses JavaScript BigInt for arbitrary precision arithmetic. You can convert numbers of any size — there's no practical upper limit. This is important for cryptography, hash values, and large binary data."
              },
              {
                q: "What are the 0b, 0o, and 0x prefixes?",
                a: "These are standard programming notation prefixes: 0b for binary (0b1010 = 10), 0o for octal (0o12 = 10), and 0x for hexadecimal (0xA = 10). Most programming languages (JavaScript, Python, C, Java) use these prefixes. You can paste numbers with or without prefixes."
              },
              {
                q: "Why is hexadecimal so common in programming?",
                a: "Each hex digit represents exactly 4 binary bits, making it a compact way to represent binary data. One byte (8 bits) is exactly 2 hex digits. This is why hex is used for memory addresses, color codes (#FF0000), MAC addresses, and byte sequences."
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
  );
}
