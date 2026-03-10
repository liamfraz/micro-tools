"use client";

import { useState, useCallback } from "react";

type EncodeMode = "component" | "full" | "query";

export default function UrlEncoderPage() {
  const [plainText, setPlainText] = useState("");
  const [encodedText, setEncodedText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<"plain" | "encoded" | null>(null);
  const [mode, setMode] = useState<EncodeMode>("component");
  const [parseResult, setParseResult] = useState<URLParts | null>(null);

  interface URLParts {
    protocol: string;
    host: string;
    pathname: string;
    search: string;
    hash: string;
    params: [string, string][];
  }

  const encode = useCallback(() => {
    setError(null);
    setParseResult(null);
    if (!plainText.trim()) {
      setEncodedText("");
      return;
    }
    try {
      let result: string;
      switch (mode) {
        case "component":
          result = encodeURIComponent(plainText);
          break;
        case "full":
          result = encodeURI(plainText);
          break;
        case "query":
          // Encode as application/x-www-form-urlencoded (spaces become +)
          result = encodeURIComponent(plainText).replace(/%20/g, "+");
          break;
        default:
          result = encodeURIComponent(plainText);
      }
      setEncodedText(result);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Encoding failed");
    }
  }, [plainText, mode]);

  const decode = useCallback(() => {
    setError(null);
    setParseResult(null);
    if (!encodedText.trim()) {
      setPlainText("");
      return;
    }
    try {
      // Handle + as space for query string decoding
      const input = encodedText.replace(/\+/g, "%20");
      let result: string;
      switch (mode) {
        case "component":
          result = decodeURIComponent(input);
          break;
        case "full":
          result = decodeURI(input);
          break;
        case "query":
          result = decodeURIComponent(input);
          break;
        default:
          result = decodeURIComponent(input);
      }
      setPlainText(result);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Invalid encoded string");
    }
  }, [encodedText, mode]);

  const parseURL = useCallback(() => {
    setError(null);
    const input = plainText.trim() || encodedText.trim();
    if (!input) {
      setError("Enter a URL in either field to parse.");
      return;
    }
    try {
      const url = new URL(input);
      const params: [string, string][] = [];
      url.searchParams.forEach((value, key) => {
        params.push([key, value]);
      });
      setParseResult({
        protocol: url.protocol,
        host: url.host,
        pathname: url.pathname,
        search: url.search,
        hash: url.hash,
        params,
      });
    } catch {
      setError("Could not parse as a URL. Enter a full URL like https://example.com/path?key=value");
    }
  }, [plainText, encodedText]);

  const copyText = useCallback(
    async (which: "plain" | "encoded") => {
      const text = which === "plain" ? plainText : encodedText;
      if (!text) return;
      await navigator.clipboard.writeText(text);
      setCopied(which);
      setTimeout(() => setCopied(null), 2000);
    },
    [plainText, encodedText]
  );

  const clearAll = useCallback(() => {
    setPlainText("");
    setEncodedText("");
    setError(null);
    setParseResult(null);
  }, []);

  const loadExample = useCallback(() => {
    setPlainText("https://example.com/search?q=hello world&lang=en&special=<script>alert('xss')</script>");
    setEncodedText("");
    setError(null);
    setParseResult(null);
  }, []);

  return (
    <>
      <title>URL Encoder & Decoder - Free Online Tool | DevTools Hub</title>
      <meta
        name="description"
        content="Encode and decode URLs online for free. Supports encodeURIComponent, encodeURI, and query string encoding. Parse URLs into components. All processing in your browser."
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
              <li className="text-slate-200">URL Encoder</li>
            </ol>
          </nav>

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
              URL Encoder & Decoder
            </h1>
            <p className="text-slate-400 max-w-2xl text-lg">
              Encode and decode URLs and URI components. Supports
              encodeURIComponent, encodeURI, and query string (+ for spaces)
              modes. Parse any URL into its components.
            </p>
          </div>

          {/* Controls */}
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <button
              onClick={encode}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              Encode
            </button>
            <button
              onClick={decode}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              Decode
            </button>
            <button
              onClick={parseURL}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors"
            >
              Parse URL
            </button>
            <button
              onClick={clearAll}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors"
            >
              Clear
            </button>
            <button
              onClick={loadExample}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors"
            >
              Example
            </button>

            <div className="ml-auto flex items-center gap-2">
              <label className="text-sm text-slate-400">Mode:</label>
              <select
                value={mode}
                onChange={(e) => setMode(e.target.value as EncodeMode)}
                className="bg-slate-800 border border-slate-600 text-slate-200 rounded px-2 py-1 text-sm"
              >
                <option value="component">encodeURIComponent</option>
                <option value="full">encodeURI</option>
                <option value="query">Query String (+)</option>
              </select>
            </div>
          </div>

          {/* Mode description */}
          <p className="text-xs text-slate-500 mb-4">
            {mode === "component" &&
              "encodeURIComponent: Encodes all special characters including :/?#[]@!$&'()*+,;= — use for individual query parameter values."}
            {mode === "full" &&
              "encodeURI: Encodes special characters but preserves URL structure characters (:/?#[]@!$&'()*+,;=) — use for full URLs."}
            {mode === "query" &&
              "Query String: Like encodeURIComponent but encodes spaces as + instead of %20 — matches HTML form submission behavior."}
          </p>

          {/* Error */}
          {error && (
            <div className="mb-4 p-3 bg-red-900/40 border border-red-700 rounded-lg text-red-300 text-sm font-mono">
              <span className="font-bold">Error:</span> {error}
            </div>
          )}

          {/* Panels */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
            {/* Plain */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-slate-300">
                  Decoded (Plain)
                </label>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-500">
                    {plainText.length} chars
                  </span>
                  <button
                    onClick={() => copyText("plain")}
                    disabled={!plainText}
                    className="text-xs text-slate-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    {copied === "plain" ? "Copied!" : "Copy"}
                  </button>
                </div>
              </div>
              <textarea
                value={plainText}
                onChange={(e) => {
                  setPlainText(e.target.value);
                  setError(null);
                  setParseResult(null);
                }}
                placeholder="Enter text or URL to encode..."
                className="w-full h-48 bg-slate-800 border border-slate-600 rounded-lg p-4 font-mono text-sm text-slate-200 placeholder-slate-500 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                spellCheck={false}
              />
            </div>

            {/* Encoded */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-slate-300">
                  Encoded
                </label>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-500">
                    {encodedText.length} chars
                  </span>
                  <button
                    onClick={() => copyText("encoded")}
                    disabled={!encodedText}
                    className="text-xs text-slate-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    {copied === "encoded" ? "Copied!" : "Copy"}
                  </button>
                </div>
              </div>
              <textarea
                value={encodedText}
                onChange={(e) => {
                  setEncodedText(e.target.value);
                  setError(null);
                  setParseResult(null);
                }}
                placeholder="Enter encoded text to decode..."
                className="w-full h-48 bg-slate-800 border border-slate-600 rounded-lg p-4 font-mono text-sm text-slate-200 placeholder-slate-500 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                spellCheck={false}
              />
            </div>
          </div>

          {/* URL Parse Result */}
          {parseResult && (
            <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden mb-6">
              <div className="p-4 border-b border-slate-700">
                <h2 className="text-lg font-semibold text-white">URL Components</h2>
              </div>
              <div className="divide-y divide-slate-700">
                {[
                  { label: "Protocol", value: parseResult.protocol },
                  { label: "Host", value: parseResult.host },
                  { label: "Path", value: parseResult.pathname },
                  { label: "Query String", value: parseResult.search },
                  { label: "Hash", value: parseResult.hash },
                ].map((row) => (
                  row.value ? (
                    <div key={row.label} className="flex items-center px-4 py-3">
                      <span className="text-sm text-slate-400 w-32 shrink-0">{row.label}</span>
                      <code className="text-sm font-mono text-slate-200 select-all">{row.value}</code>
                    </div>
                  ) : null
                ))}
              </div>
              {parseResult.params.length > 0 && (
                <div className="border-t border-slate-700">
                  <div className="p-4 pb-2">
                    <h3 className="text-sm font-semibold text-white">Query Parameters</h3>
                  </div>
                  <div className="divide-y divide-slate-700">
                    {parseResult.params.map(([key, value], idx) => (
                      <div key={idx} className="flex items-center px-4 py-2">
                        <code className="text-sm font-mono text-blue-400 w-40 shrink-0">{key}</code>
                        <code className="text-sm font-mono text-slate-200 select-all">{value}</code>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Reference Table */}
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 mb-6">
            <h2 className="text-lg font-semibold text-white mb-4">
              Common Encoded Characters
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
              {[
                { char: " ", encoded: "%20" },
                { char: "!", encoded: "%21" },
                { char: "#", encoded: "%23" },
                { char: "$", encoded: "%24" },
                { char: "&", encoded: "%26" },
                { char: "'", encoded: "%27" },
                { char: "(", encoded: "%28" },
                { char: ")", encoded: "%29" },
                { char: "+", encoded: "%2B" },
                { char: ",", encoded: "%2C" },
                { char: "/", encoded: "%2F" },
                { char: ":", encoded: "%3A" },
                { char: ";", encoded: "%3B" },
                { char: "=", encoded: "%3D" },
                { char: "?", encoded: "%3F" },
                { char: "@", encoded: "%40" },
                { char: "[", encoded: "%5B" },
                { char: "]", encoded: "%5D" },
              ].map((item) => (
                <div
                  key={item.encoded}
                  className="flex items-center justify-between bg-slate-900 rounded px-3 py-2"
                >
                  <code className="text-sm font-mono text-white">{item.char === " " ? "space" : item.char}</code>
                  <code className="text-xs font-mono text-blue-400">{item.encoded}</code>
                </div>
              ))}
            </div>
          </div>

          {/* FAQ Section */}
          <section className="mt-16 border-t border-slate-700 pt-10">
            <h2 className="text-2xl font-bold text-white mb-6">
              Frequently Asked Questions
            </h2>

            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  What is URL encoding?
                </h3>
                <p className="text-slate-400">
                  URL encoding (also called percent-encoding) converts characters
                  that are not allowed in URLs into a format that can be
                  transmitted. Special characters are replaced with a percent sign
                  (%) followed by two hexadecimal digits representing the
                  character&apos;s ASCII code. For example, a space becomes %20.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  What is the difference between encodeURI and encodeURIComponent?
                </h3>
                <p className="text-slate-400">
                  encodeURI is designed for encoding full URLs — it preserves
                  characters that have special meaning in URLs like ://?#@.
                  encodeURIComponent encodes everything except letters, digits,
                  and - _ . ~ making it suitable for encoding individual query
                  parameter values. Use encodeURIComponent for values, encodeURI
                  for complete URLs.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Why are spaces sometimes encoded as + instead of %20?
                </h3>
                <p className="text-slate-400">
                  The + encoding for spaces comes from the
                  application/x-www-form-urlencoded format used by HTML form
                  submissions. This is a different standard from RFC 3986 which
                  specifies %20. Both are valid but used in different contexts.
                  The &ldquo;Query String (+)&rdquo; mode in this tool uses the
                  form encoding convention.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Is my data safe?
                </h3>
                <p className="text-slate-400">
                  Yes. All encoding and decoding happens entirely in your browser
                  using JavaScript&apos;s built-in encodeURI, encodeURIComponent,
                  decodeURI, and decodeURIComponent functions. No data is sent to
                  any server.
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
