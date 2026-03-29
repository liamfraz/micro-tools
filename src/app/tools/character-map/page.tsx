"use client";

import { useState, useCallback, useMemo } from "react";
import JsonLd from "@/components/JsonLd";
import RelatedTools from "@/components/RelatedTools";
import ToolBreadcrumb from "@/components/ToolBreadcrumb";
import {
  generateFAQSchema,
  generateWebAppSchema,
  generateBreadcrumbSchema,
} from "@/lib/jsonld";

// Unicode block ranges with labels
const BLOCKS: { label: string; start: number; end: number }[] = [
  { label: "Basic Latin", start: 0x0020, end: 0x007E },
  { label: "Latin Supplement", start: 0x00A0, end: 0x00FF },
  { label: "Latin Extended-A", start: 0x0100, end: 0x017F },
  { label: "Greek & Coptic", start: 0x0370, end: 0x03FF },
  { label: "Cyrillic", start: 0x0400, end: 0x04FF },
  { label: "General Punctuation", start: 0x2000, end: 0x206F },
  { label: "Currency Symbols", start: 0x20A0, end: 0x20CF },
  { label: "Letterlike Symbols", start: 0x2100, end: 0x214F },
  { label: "Number Forms", start: 0x2150, end: 0x218F },
  { label: "Arrows", start: 0x2190, end: 0x21FF },
  { label: "Math Operators", start: 0x2200, end: 0x22FF },
  { label: "Misc Technical", start: 0x2300, end: 0x23FF },
  { label: "Box Drawing", start: 0x2500, end: 0x257F },
  { label: "Block Elements", start: 0x2580, end: 0x259F },
  { label: "Geometric Shapes", start: 0x25A0, end: 0x25FF },
  { label: "Misc Symbols", start: 0x2600, end: 0x26FF },
  { label: "Dingbats", start: 0x2700, end: 0x27BF },
  { label: "Braille Patterns", start: 0x2800, end: 0x28FF },
  { label: "CJK Symbols", start: 0x3000, end: 0x303F },
  { label: "Emoji Symbols", start: 0x1F600, end: 0x1F64F },
  { label: "Emoji Misc", start: 0x1F300, end: 0x1F5FF },
];

// Common character names for popular characters
const CHAR_NAMES: Record<number, string> = {
  0x0020: "Space", 0x0021: "Exclamation Mark", 0x0022: "Quotation Mark",
  0x0023: "Number Sign", 0x0024: "Dollar Sign", 0x0025: "Percent Sign",
  0x0026: "Ampersand", 0x0027: "Apostrophe", 0x0028: "Left Parenthesis",
  0x0029: "Right Parenthesis", 0x002A: "Asterisk", 0x002B: "Plus Sign",
  0x002C: "Comma", 0x002D: "Hyphen-Minus", 0x002E: "Full Stop",
  0x002F: "Solidus", 0x003A: "Colon", 0x003B: "Semicolon",
  0x003C: "Less-Than Sign", 0x003D: "Equals Sign", 0x003E: "Greater-Than Sign",
  0x003F: "Question Mark", 0x0040: "Commercial At", 0x005B: "Left Square Bracket",
  0x005C: "Reverse Solidus", 0x005D: "Right Square Bracket", 0x005E: "Circumflex Accent",
  0x005F: "Low Line", 0x0060: "Grave Accent", 0x007B: "Left Curly Bracket",
  0x007C: "Vertical Line", 0x007D: "Right Curly Bracket", 0x007E: "Tilde",
  0x00A0: "No-Break Space", 0x00A9: "Copyright Sign", 0x00AE: "Registered Sign",
  0x00B0: "Degree Sign", 0x00B1: "Plus-Minus Sign", 0x00B5: "Micro Sign",
  0x00B7: "Middle Dot", 0x00D7: "Multiplication Sign", 0x00F7: "Division Sign",
  0x2013: "En Dash", 0x2014: "Em Dash", 0x2018: "Left Single Quotation Mark",
  0x2019: "Right Single Quotation Mark", 0x201C: "Left Double Quotation Mark",
  0x201D: "Right Double Quotation Mark", 0x2022: "Bullet", 0x2026: "Horizontal Ellipsis",
  0x2030: "Per Mille Sign", 0x2032: "Prime", 0x2033: "Double Prime",
  0x20AC: "Euro Sign", 0x20A3: "French Franc Sign", 0x20A4: "Lira Sign",
  0x20A7: "Peseta Sign", 0x20A8: "Rupee Sign", 0x20A9: "Won Sign",
  0x20B9: "Indian Rupee Sign", 0x20BF: "Bitcoin Sign",
  0x2190: "Leftwards Arrow", 0x2191: "Upwards Arrow", 0x2192: "Rightwards Arrow",
  0x2193: "Downwards Arrow", 0x2194: "Left Right Arrow", 0x2195: "Up Down Arrow",
  0x21D0: "Leftwards Double Arrow", 0x21D2: "Rightwards Double Arrow",
  0x2200: "For All", 0x2202: "Partial Differential", 0x2203: "There Exists",
  0x2205: "Empty Set", 0x2207: "Nabla", 0x2208: "Element Of",
  0x220F: "N-Ary Product", 0x2211: "N-Ary Summation", 0x221A: "Square Root",
  0x221E: "Infinity", 0x2227: "Logical And", 0x2228: "Logical Or",
  0x2229: "Intersection", 0x222A: "Union", 0x2248: "Almost Equal To",
  0x2260: "Not Equal To", 0x2264: "Less-Than or Equal To", 0x2265: "Greater-Than or Equal To",
  0x2318: "Place of Interest", 0x2325: "Option Key", 0x2326: "Erase to the Right",
  0x232B: "Erase to the Left", 0x23CE: "Return Symbol",
  0x25A0: "Black Square", 0x25A1: "White Square", 0x25B2: "Black Up Triangle",
  0x25B6: "Black Right Triangle", 0x25BC: "Black Down Triangle",
  0x25C0: "Black Left Triangle", 0x25CB: "White Circle", 0x25CF: "Black Circle",
  0x2605: "Black Star", 0x2606: "White Star", 0x2610: "Ballot Box",
  0x2611: "Ballot Box With Check", 0x2612: "Ballot Box With X",
  0x2620: "Skull and Crossbones", 0x2639: "White Frowning Face",
  0x263A: "White Smiling Face", 0x2665: "Black Heart Suit",
  0x2666: "Black Diamond Suit", 0x266A: "Eighth Note", 0x266B: "Beamed Eighth Notes",
  0x2713: "Check Mark", 0x2714: "Heavy Check Mark", 0x2716: "Heavy Multiplication X",
  0x2717: "Ballot X", 0x2764: "Heavy Black Heart",
};

// Quick-access categories
const QUICK_CATEGORIES = [
  { label: "Arrows", chars: [0x2190, 0x2191, 0x2192, 0x2193, 0x2194, 0x2195, 0x21D0, 0x21D2, 0x21D4, 0x2196, 0x2197, 0x2198, 0x2199, 0x21A9, 0x21AA, 0x27A1] },
  { label: "Currency", chars: [0x0024, 0x00A2, 0x00A3, 0x00A5, 0x20AC, 0x20A3, 0x20A4, 0x20A7, 0x20A8, 0x20A9, 0x20B9, 0x20BF] },
  { label: "Math", chars: [0x00B1, 0x00D7, 0x00F7, 0x2200, 0x2202, 0x2203, 0x2205, 0x2207, 0x2208, 0x220F, 0x2211, 0x221A, 0x221E, 0x2229, 0x222A, 0x2248, 0x2260, 0x2264, 0x2265] },
  { label: "Symbols", chars: [0x00A9, 0x00AE, 0x2122, 0x00B0, 0x2022, 0x2026, 0x2605, 0x2606, 0x2610, 0x2611, 0x2612, 0x2713, 0x2714, 0x2716, 0x2764, 0x263A, 0x2639, 0x266A, 0x266B] },
  { label: "Typography", chars: [0x2013, 0x2014, 0x2018, 0x2019, 0x201C, 0x201D, 0x2026, 0x00AB, 0x00BB, 0x2032, 0x2033, 0x00B7, 0x2030, 0x00A7, 0x00B6, 0x2020, 0x2021] },
];

const getCharName = (code: number): string => {
  if (CHAR_NAMES[code]) return CHAR_NAMES[code];
  if (code >= 0x0041 && code <= 0x005A) return `Latin Capital Letter ${String.fromCodePoint(code)}`;
  if (code >= 0x0061 && code <= 0x007A) return `Latin Small Letter ${String.fromCodePoint(code)}`;
  if (code >= 0x0030 && code <= 0x0039) return `Digit ${String.fromCodePoint(code)}`;
  return `U+${code.toString(16).toUpperCase().padStart(4, "0")}`;
};

const toHex = (code: number): string => `U+${code.toString(16).toUpperCase().padStart(4, "0")}`;

export default function CharacterMapPage() {
  const [selectedBlock, setSelectedBlock] = useState(0);
  const [search, setSearch] = useState("");
  const [selectedChar, setSelectedChar] = useState<number | null>(null);
  const [copied, setCopied] = useState<string>("");
  const [collected, setCollected] = useState("");
  const [quickCategory, setQuickCategory] = useState<number | null>(null);

  const blockChars = useMemo(() => {
    const block = BLOCKS[selectedBlock];
    const chars: number[] = [];
    for (let i = block.start; i <= block.end; i++) {
      // Filter out control characters and unassigned
      try {
        const s = String.fromCodePoint(i);
        if (s && s.trim().length > 0 || i === 0x0020 || i === 0x00A0) {
          chars.push(i);
        }
      } catch {
        // skip invalid code points
      }
    }
    return chars;
  }, [selectedBlock]);

  const searchResults = useMemo(() => {
    if (!search.trim()) return null;
    const q = search.toLowerCase();
    const results: number[] = [];

    // Search by hex code point
    if (q.startsWith("u+") || q.startsWith("0x")) {
      const hex = q.replace(/^(u\+|0x)/, "");
      const code = parseInt(hex, 16);
      if (!isNaN(code) && code >= 0 && code <= 0x10FFFF) {
        results.push(code);
        return results;
      }
    }

    // Search by decimal code point
    if (/^\d+$/.test(q)) {
      const code = parseInt(q, 10);
      if (code >= 0 && code <= 0x10FFFF) {
        results.push(code);
      }
    }

    // Search single character
    if (search.length === 1) {
      results.push(search.codePointAt(0)!);
      return results;
    }

    // Search by name
    for (const [codeStr, name] of Object.entries(CHAR_NAMES)) {
      if (name.toLowerCase().includes(q)) {
        results.push(parseInt(codeStr, 10));
      }
    }

    // Search common block names
    for (const block of BLOCKS) {
      if (block.label.toLowerCase().includes(q)) {
        for (let i = block.start; i <= Math.min(block.end, block.start + 48); i++) {
          try {
            const s = String.fromCodePoint(i);
            if (s && (s.trim().length > 0 || i === 0x0020 || i === 0x00A0)) {
              results.push(i);
            }
          } catch { /* skip */ }
        }
      }
    }

    return results.slice(0, 200);
  }, [search]);

  const displayChars = quickCategory !== null
    ? QUICK_CATEGORIES[quickCategory].chars
    : searchResults !== null
      ? searchResults
      : blockChars;

  const handleCopy = useCallback(async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(label);
      setTimeout(() => setCopied(""), 1500);
    } catch { /* ignore */ }
  }, []);

  const addToCollected = useCallback((code: number) => {
    setCollected((prev) => prev + String.fromCodePoint(code));
  }, []);

  return (
    <>
      <title>Unicode Character Map - Free Online Tool | DevTools Hub</title>
      <meta
        name="description"
        content="Browse and search Unicode characters by block, name, or code point. Copy characters, view hex/decimal/HTML codes, and build character strings — all in your browser."
      />
      <JsonLd
        data={[
          generateWebAppSchema({
            slug: "character-map",
            name: "Character Map & Unicode Lookup",
            description: "Browse Unicode characters, search by name, and copy special symbols",
            category: "text",
          }),
          generateBreadcrumbSchema({
            slug: "character-map",
            name: "Character Map & Unicode Lookup",
            description: "Browse Unicode characters, search by name, and copy special symbols",
            category: "text",
          }),
          generateFAQSchema([
            { question: "What is Unicode?", answer: "Unicode is the universal character encoding standard that assigns a unique number (code point) to every character across all writing systems. It covers over 150,000 characters including Latin, Greek, Cyrillic, Chinese, Japanese, Korean, emoji, math symbols, and more." },
            { question: "How do I use a Unicode character in HTML?", answer: "You can paste the character directly, use an HTML decimal entity (&#8364; for \u20AC), an HTML hex entity (&#x20AC; for \u20AC), or a CSS escape (\\20AC). All methods render the same character in browsers." },
            { question: "What do the character codes mean?", answer: "U+XXXX is the Unicode code point in hexadecimal. The decimal value is the same number in base 10. HTML entities wrap these in &#...; syntax for web use. The JavaScript escape (\\uXXXX) is used in JS strings. UTF-8 shows the byte encoding." },
            { question: "Is my data safe?", answer: "Yes. This tool runs entirely in your browser. No data is sent to any server. The character database is built into the page \u2014 no network requests are made." },
          ]),
        ]}
      />

      <main className="min-h-screen bg-slate-900 text-white">
        <div className="max-w-6xl mx-auto px-4 py-12">
          <ToolBreadcrumb slug="character-map" />

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
              Unicode Character Map
            </h1>
            <p className="text-slate-400 max-w-2xl text-lg">
              Browse, search, and copy Unicode characters. Explore 20+ character blocks including arrows, math symbols, currency signs, dingbats, and more.
            </p>
          </div>

          {/* Search */}
          <div className="mb-6">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
              <input
                type="text"
                placeholder="Search by name, character, U+hex, or decimal..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setQuickCategory(null); }}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 py-3 pl-10 pr-4 text-sm text-white placeholder-slate-500 outline-none transition-colors focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Quick categories */}
          <div className="flex flex-wrap gap-2 mb-4">
            {QUICK_CATEGORIES.map((cat, idx) => (
              <button
                key={cat.label}
                onClick={() => { setQuickCategory(quickCategory === idx ? null : idx); setSearch(""); }}
                className={`px-3 py-1.5 text-sm rounded-full font-medium transition-colors ${
                  quickCategory === idx
                    ? "bg-blue-600 text-white"
                    : "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Block selector (only when not searching) */}
          {searchResults === null && quickCategory === null && (
            <div className="mb-4">
              <select
                value={selectedBlock}
                onChange={(e) => setSelectedBlock(Number(e.target.value))}
                className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {BLOCKS.map((block, idx) => (
                  <option key={idx} value={idx}>
                    {block.label} ({toHex(block.start)}–{toHex(block.end)})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Collected characters */}
          {collected && (
            <div className="mb-4 bg-slate-800 rounded-lg p-4 flex items-center gap-3">
              <span className="text-sm text-slate-400">Collected:</span>
              <span className="font-mono text-lg text-white flex-1 break-all">{collected}</span>
              <button
                onClick={() => handleCopy(collected, "collected")}
                className="px-3 py-1 text-xs bg-blue-600 hover:bg-blue-700 rounded text-white transition-colors whitespace-nowrap"
              >
                {copied === "collected" ? "Copied!" : "Copy All"}
              </button>
              <button
                onClick={() => setCollected("")}
                className="px-3 py-1 text-xs bg-slate-700 hover:bg-slate-600 rounded text-slate-300 transition-colors"
              >
                Clear
              </button>
            </div>
          )}

          {/* Character grid */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr,320px] gap-6 mb-8">
            <div>
              {displayChars.length === 0 ? (
                <div className="py-16 text-center text-slate-500">
                  No characters found. Try a different search.
                </div>
              ) : (
                <div className="grid grid-cols-8 sm:grid-cols-10 md:grid-cols-12 gap-1">
                  {displayChars.map((code) => {
                    const char = String.fromCodePoint(code);
                    const isSelected = selectedChar === code;
                    return (
                      <button
                        key={code}
                        onClick={() => { setSelectedChar(code); addToCollected(code); }}
                        title={`${char}  ${toHex(code)}  ${getCharName(code)}`}
                        className={`aspect-square flex items-center justify-center text-lg rounded transition-colors ${
                          isSelected
                            ? "bg-blue-600 text-white ring-2 ring-blue-400"
                            : "bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white"
                        }`}
                      >
                        {code === 0x0020 || code === 0x00A0 ? "␣" : char}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Character detail panel */}
            <div className="bg-slate-800 rounded-lg p-5 h-fit lg:sticky lg:top-8">
              {selectedChar !== null ? (
                <>
                  <div className="text-center mb-4">
                    <div className="text-6xl mb-2">
                      {selectedChar === 0x0020 || selectedChar === 0x00A0 ? "␣" : String.fromCodePoint(selectedChar)}
                    </div>
                    <div className="text-sm text-slate-400">{getCharName(selectedChar)}</div>
                  </div>

                  <div className="space-y-2 text-sm">
                    {[
                      { label: "Character", value: String.fromCodePoint(selectedChar), key: "char" },
                      { label: "Unicode", value: toHex(selectedChar), key: "unicode" },
                      { label: "Decimal", value: selectedChar.toString(), key: "decimal" },
                      { label: "HTML (Dec)", value: `&#${selectedChar};`, key: "htmldec" },
                      { label: "HTML (Hex)", value: `&#x${selectedChar.toString(16).toUpperCase()};`, key: "htmlhex" },
                      { label: "CSS", value: `\\${selectedChar.toString(16).toUpperCase()}`, key: "css" },
                      { label: "JavaScript", value: selectedChar <= 0xFFFF ? `\\u${selectedChar.toString(16).toUpperCase().padStart(4, "0")}` : `\\u{${selectedChar.toString(16).toUpperCase()}}`, key: "js" },
                      { label: "UTF-8", value: (() => {
                        const encoder = new TextEncoder();
                        const bytes = encoder.encode(String.fromCodePoint(selectedChar));
                        return Array.from(bytes).map((b) => b.toString(16).toUpperCase().padStart(2, "0")).join(" ");
                      })(), key: "utf8" },
                    ].map((row) => (
                      <div key={row.key} className="flex items-center justify-between">
                        <span className="text-slate-400">{row.label}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs text-blue-400">{row.value}</span>
                          <button
                            onClick={() => handleCopy(row.value, row.key)}
                            className="px-2 py-0.5 text-[10px] bg-slate-700 hover:bg-slate-600 rounded text-slate-300 transition-colors"
                          >
                            {copied === row.key ? "OK" : "Copy"}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center text-slate-500 py-8">
                  <div className="text-4xl mb-3 opacity-30">?</div>
                  <p className="text-sm">Click a character to see details</p>
                  <p className="text-xs mt-1 text-slate-600">Clicked characters are added to the collection bar</p>
                </div>
              )}
            </div>
          </div>

          <RelatedTools currentSlug="character-map" />

          {/* FAQ */}
          <div className="bg-slate-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Frequently Asked Questions</h2>
            <div className="space-y-4">
              {[
                {
                  q: "What is Unicode?",
                  a: "Unicode is the universal character encoding standard that assigns a unique number (code point) to every character across all writing systems. It covers over 150,000 characters including Latin, Greek, Cyrillic, Chinese, Japanese, Korean, emoji, math symbols, and more."
                },
                {
                  q: "How do I use a Unicode character in HTML?",
                  a: "You can paste the character directly, use an HTML decimal entity (&#8364; for €), an HTML hex entity (&#x20AC; for €), or a CSS escape (\\20AC). All methods render the same character in browsers."
                },
                {
                  q: "What do the character codes mean?",
                  a: "U+XXXX is the Unicode code point in hexadecimal. The decimal value is the same number in base 10. HTML entities wrap these in &#...; syntax for web use. The JavaScript escape (\\uXXXX) is used in JS strings. UTF-8 shows the byte encoding."
                },
                {
                  q: "Is my data safe?",
                  a: "Yes. This tool runs entirely in your browser. No data is sent to any server. The character database is built into the page — no network requests are made."
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
