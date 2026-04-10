"use client";

import { useState, useCallback, useEffect } from "react";
import JsonLd from "@/components/JsonLd";
import RelatedTools from "@/components/RelatedTools";
import ToolBreadcrumb from "@/components/ToolBreadcrumb";
import AdUnit from "@/components/AdUnit";
import {
  generateFAQSchema,
  generateWebAppSchema,
  generateBreadcrumbSchema,
} from "@/lib/jsonld";

type Direction = "encode" | "decode";

// Essential HTML entities map
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
};

// Reverse lookup
const ENTITY_TO_CHAR: Record<string, string> = {};
for (const key of Object.keys(NAMED_ENTITIES)) {
  ENTITY_TO_CHAR[NAMED_ENTITIES[key]] = key;
}

function encodeHTML(input: string): string {
  let result = "";
  for (let i = 0; i < input.length; i++) {
    const char = input[i];
    if (NAMED_ENTITIES[char]) {
      result += NAMED_ENTITIES[char];
    } else {
      result += char;
    }
  }
  return result;
}

function decodeHTML(input: string): string {
  let result = input;

  // Decode named entities
  result = result.replace(/&[a-zA-Z]+;/g, (match) => {
    if (ENTITY_TO_CHAR[match]) return ENTITY_TO_CHAR[match];
    if (typeof document !== "undefined") {
      const el = document.createElement("textarea");
      el.innerHTML = match;
      return el.value;
    }
    return match;
  });

  // Decode decimal entities (&#123;)
  result = result.replace(/&#(\d+);/g, (_, code) =>
    String.fromCharCode(parseInt(code, 10))
  );

  // Decode hex entities (&#xAB; or &#xab;)
  result = result.replace(/&#x([0-9a-fA-F]+);/g, (_, hex) =>
    String.fromCharCode(parseInt(hex, 16))
  );

  return result;
}

const REFERENCE_ENTITIES = [
  { entity: "&amp;", char: "&", description: "Ampersand" },
  { entity: "&lt;", char: "<", description: "Less than" },
  { entity: "&gt;", char: ">", description: "Greater than" },
  { entity: "&quot;", char: '"', description: "Double quote" },
  { entity: "&apos;", char: "'", description: "Apostrophe" },
];

export default function HtmlEntityPage() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [direction, setDirection] = useState<Direction>("encode");
  const [copied, setCopied] = useState(false);

  // Live preview as you type
  useEffect(() => {
    if (!input) {
      setOutput("");
      return;
    }
    try {
      if (direction === "encode") {
        setOutput(encodeHTML(input));
      } else {
        setOutput(decodeHTML(input));
      }
    } catch {
      setOutput("");
    }
  }, [input, direction]);

  const copyToClipboard = useCallback(async () => {
    if (!output) return;
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  }, [output]);

  const handleClear = useCallback(() => {
    setInput("");
    setOutput("");
  }, []);

  return (
    <>
      <title>
        HTML Entity Encoder / Decoder - Encode &amp; Decode HTML Entities |
        DevTools Hub
      </title>
      <meta
        name="description"
        content="Encode special characters to HTML entities or decode entities back to text. Free, fast, and works entirely in your browser. Live preview as you type."
      />
      <meta
        name="keywords"
        content="html entity encoder, html entity decoder, html entities, encode html, decode html, &amp;, &lt;, &gt;, html special characters"
      />
      <JsonLd
        data={[
          generateWebAppSchema({
            slug: "html-entity",
            name: "HTML Entity Encoder / Decoder",
            description:
              "Encode special characters to HTML entities or decode entities back to text with live preview",
            category: "encoding",
          }),
          generateBreadcrumbSchema({
            slug: "html-entity",
            name: "HTML Entity Encoder / Decoder",
            description:
              "Encode special characters to HTML entities or decode entities back to text",
            category: "encoding",
          }),
          generateFAQSchema([
            {
              question: "What are HTML entities?",
              answer:
                "HTML entities are special character codes that represent reserved characters or symbols in HTML. For example, &amp; represents &, &lt; represents <, and &gt; represents >. They prevent browsers from interpreting characters as HTML markup.",
            },
            {
              question: "When should I encode text to HTML entities?",
              answer:
                "You should encode user-supplied text before displaying it in HTML to prevent XSS (cross-site scripting) attacks and to display special characters correctly. You also need to encode the 5 essential characters: &, <, >, \", and ' in HTML attributes.",
            },
            {
              question: "Can I decode HTML entities back to text?",
              answer:
                "Yes, this tool can decode named entities (&amp;), decimal entities (&#38;), and hexadecimal entities (&#x26;) back to their original characters. Just switch to Decode mode and paste the encoded text.",
            },
            {
              question: "Is my data safe?",
              answer:
                "Yes, absolutely. All encoding and decoding happens entirely in your browser using JavaScript. No data is sent to any server or stored anywhere.",
            },
          ]),
        ]}
      />

      <div className="min-h-screen bg-slate-900 text-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <ToolBreadcrumb slug="html-entity" />

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
              HTML Entity Encoder / Decoder
            </h1>
            <p className="text-slate-400 max-w-2xl text-lg">
              Encode special characters to HTML entities or decode them back to
              text. Live preview as you type. No data leaves your browser.
            </p>
          </div>

          <AdUnit slot="TOP_SLOT" format="horizontal" className="mb-6" />

          {/* Direction Toggle */}
          <div className="flex gap-3 mb-6">
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
          </div>

          {/* Input/Output Panels */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
            {/* Input */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Input
              </label>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={
                  direction === "encode"
                    ? 'Enter text to encode (e.g., <script>alert("XSS")</script>)'
                    : "Enter HTML entities to decode (e.g., &lt;div&gt;)"
                }
                className="w-full bg-slate-800 border border-slate-600 rounded-lg p-3 font-mono text-sm text-slate-200 placeholder-slate-500 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 h-48"
                spellCheck={false}
              />
            </div>

            {/* Output */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Output
              </label>
              <textarea
                value={output}
                readOnly
                className="w-full bg-slate-800 border border-slate-600 rounded-lg p-3 font-mono text-sm text-slate-200 resize-none focus:outline-none h-48"
                spellCheck={false}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 mb-6">
            <button
              onClick={copyToClipboard}
              disabled={!output}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors text-sm"
            >
              {copied ? "Copied!" : "Copy Output"}
            </button>
            <button
              onClick={handleClear}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors text-sm"
            >
              Clear
            </button>
          </div>

          {/* Essential Reference */}
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 mb-6">
            <h2 className="text-lg font-semibold text-white mb-4">
              Essential HTML Entities
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left py-2 px-3 text-slate-400 font-medium">
                      Entity
                    </th>
                    <th className="text-left py-2 px-3 text-slate-400 font-medium">
                      Character
                    </th>
                    <th className="text-left py-2 px-3 text-slate-400 font-medium">
                      Description
                    </th>
                  </tr>
                </thead>
                <tbody className="text-slate-300">
                  {REFERENCE_ENTITIES.map((item) => (
                    <tr
                      key={item.entity}
                      className="border-b border-slate-700/30 hover:bg-slate-700/30"
                    >
                      <td className="py-2 px-3 font-mono text-blue-400">
                        {item.entity}
                      </td>
                      <td className="py-2 px-3 text-center text-lg">
                        {item.char}
                      </td>
                      <td className="py-2 px-3 text-slate-400">
                        {item.description}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 mb-6">
            <h2 className="text-lg font-semibold text-white mb-3">
              How It Works
            </h2>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>
                <strong className="text-white">Encode:</strong> Converts special
                characters to their HTML entity equivalents (&amp;, &lt;, &gt;,
                etc.)
              </li>
              <li>
                <strong className="text-white">Decode:</strong> Converts HTML
                entities back to their original characters
              </li>
              <li>
                <strong className="text-white">Live Preview:</strong> Output
                updates instantly as you type
              </li>
              <li>
                <strong className="text-white">100% Safe:</strong> All
                processing happens in your browser — nothing is sent to any
                server
              </li>
            </ul>
          </div>

          <AdUnit slot="BOTTOM_SLOT" format="auto" className="my-8" />

          <RelatedTools currentSlug="html-entity" />

          {/* FAQ */}
          <section className="mt-16 border-t border-slate-700 pt-10">
            <h2 className="text-2xl font-bold text-white mb-6">
              Frequently Asked Questions
            </h2>
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  What are HTML entities?
                </h3>
                <p className="text-slate-400">
                  HTML entities are special character codes that represent
                  reserved characters or symbols in HTML. For example, &amp;amp;
                  represents &amp;, &amp;lt; represents &lt;, and &amp;gt;
                  represents &gt;. They prevent browsers from interpreting
                  characters as HTML markup.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  When should I encode text to HTML entities?
                </h3>
                <p className="text-slate-400">
                  You should encode user-supplied text before displaying it in
                  HTML to prevent XSS (cross-site scripting) attacks and to
                  display special characters correctly. You also need to encode
                  the 5 essential characters: &amp;amp;, &amp;lt;, &amp;gt;,
                  &amp;quot;, and &amp;apos; in HTML attributes.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Can I decode HTML entities back to text?
                </h3>
                <p className="text-slate-400">
                  Yes, absolutely. This tool can decode named entities
                  (&amp;amp;), decimal entities (&amp;#38;), and hexadecimal
                  entities (&amp;#x26;) back to their original characters. Just
                  switch to Decode mode and paste the encoded text.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Is my data safe?
                </h3>
                <p className="text-slate-400">
                  Yes, absolutely. All encoding and decoding happens entirely in
                  your browser using JavaScript. No data is sent to any server
                  or stored anywhere.
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
