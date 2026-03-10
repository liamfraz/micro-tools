"use client";

import { useState, useCallback } from "react";

export default function JsonFormatterPage() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [tabSize, setTabSize] = useState(2);
  const [copied, setCopied] = useState(false);

  const formatJson = useCallback(() => {
    if (!input.trim()) {
      setOutput("");
      setError(null);
      return;
    }
    try {
      const parsed = JSON.parse(input);
      setOutput(JSON.stringify(parsed, null, tabSize));
      setError(null);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Invalid JSON";
      setError(msg);
      setOutput("");
    }
  }, [input, tabSize]);

  const minifyJson = useCallback(() => {
    if (!input.trim()) {
      setOutput("");
      setError(null);
      return;
    }
    try {
      const parsed = JSON.parse(input);
      setOutput(JSON.stringify(parsed));
      setError(null);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Invalid JSON";
      setError(msg);
      setOutput("");
    }
  }, [input]);

  const copyOutput = useCallback(async () => {
    if (!output) return;
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [output]);

  const clearAll = useCallback(() => {
    setInput("");
    setOutput("");
    setError(null);
  }, []);

  const getLineNumber = (errorMsg: string): string | null => {
    const match = errorMsg.match(/position (\d+)/i);
    if (match && input) {
      const pos = parseInt(match[1], 10);
      const lines = input.substring(0, pos).split("\n");
      return `Line ${lines.length}, Column ${lines[lines.length - 1].length + 1}`;
    }
    return null;
  };

  const inputLines = input.split("\n").length;
  const inputChars = input.length;
  const outputLines = output.split("\n").length;
  const outputChars = output.length;

  const isValid = input.trim().length > 0 && error === null && output.length > 0;

  return (
    <>
      <title>JSON Formatter & Validator - Free Online Tool | Micro Tools</title>
      <meta
        name="description"
        content="Format, validate, and minify JSON online for free. Pretty-print JSON with customizable indentation, error highlighting with line numbers, and one-click copy."
      />

      <div className="min-h-screen bg-slate-900 text-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Breadcrumb */}
          <nav className="text-sm text-slate-400 mb-6" aria-label="Breadcrumb">
            <ol className="flex items-center gap-2">
              <li>
                <a href="/" className="hover:text-white transition-colors">
                  Home
                </a>
              </li>
              <li>
                <span className="mx-1">/</span>
              </li>
              <li>
                <a
                  href="/tools"
                  className="hover:text-white transition-colors"
                >
                  Developer Tools
                </a>
              </li>
              <li>
                <span className="mx-1">/</span>
              </li>
              <li className="text-slate-200">JSON Formatter</li>
            </ol>
          </nav>

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
              JSON Formatter & Validator
            </h1>
            <p className="text-slate-400 max-w-2xl text-lg">
              Paste your JSON data below to format, validate, or minify it
              instantly. Supports error highlighting with line numbers, custom
              indentation, and one-click copy.
            </p>
          </div>

          {/* Controls */}
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <button
              onClick={formatJson}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              Format
            </button>
            <button
              onClick={minifyJson}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors"
            >
              Minify
            </button>
            <button
              onClick={copyOutput}
              disabled={!output}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {copied ? "Copied!" : "Copy"}
            </button>
            <button
              onClick={clearAll}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors"
            >
              Clear
            </button>

            <div className="ml-auto flex items-center gap-2">
              <label className="text-sm text-slate-400">Tab Size:</label>
              <select
                value={tabSize}
                onChange={(e) => setTabSize(Number(e.target.value))}
                className="bg-slate-800 border border-slate-600 text-slate-200 rounded px-2 py-1 text-sm"
              >
                <option value={2}>2 spaces</option>
                <option value={4}>4 spaces</option>
              </select>
            </div>

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
                  {isValid ? "Valid JSON" : "Invalid JSON"}
                </span>
              </div>
            )}
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-4 p-3 bg-red-900/40 border border-red-700 rounded-lg text-red-300 text-sm font-mono">
              <span className="font-bold">Error:</span> {error}
              {getLineNumber(error) && (
                <span className="ml-2 text-red-400">
                  ({getLineNumber(error)})
                </span>
              )}
            </div>
          )}

          {/* Panels */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
            {/* Input */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-slate-300">
                  Input
                </label>
                <span className="text-xs text-slate-500">
                  {inputChars} chars | {inputLines} lines
                </span>
              </div>
              <textarea
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  setError(null);
                  setOutput("");
                }}
                placeholder='Paste your JSON here...\n\n{"example": "value"}'
                className={`w-full h-96 bg-slate-800 border rounded-lg p-4 font-mono text-sm text-slate-200 placeholder-slate-500 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  error ? "border-red-600" : "border-slate-600"
                }`}
                spellCheck={false}
              />
            </div>

            {/* Output */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-slate-300">
                  Output
                </label>
                <span className="text-xs text-slate-500">
                  {output ? `${outputChars} chars | ${outputLines} lines` : ""}
                </span>
              </div>
              <textarea
                value={output}
                readOnly
                placeholder="Formatted JSON will appear here..."
                className="w-full h-96 bg-slate-800 border border-slate-600 rounded-lg p-4 font-mono text-sm text-green-300 placeholder-slate-500 resize-none focus:outline-none"
                spellCheck={false}
              />
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
                  What is JSON formatting?
                </h3>
                <p className="text-slate-400">
                  JSON formatting (also called &ldquo;pretty-printing&rdquo;)
                  adds consistent indentation and line breaks to raw JSON data,
                  making it easier to read and debug. This tool parses your JSON
                  and re-serializes it with your chosen indentation level.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  What does minifying JSON do?
                </h3>
                <p className="text-slate-400">
                  Minifying removes all unnecessary whitespace from JSON,
                  producing the smallest possible output. This is useful for
                  reducing payload sizes when sending JSON over a network or
                  storing it in databases.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  How do I fix &ldquo;Unexpected token&rdquo; errors?
                </h3>
                <p className="text-slate-400">
                  This usually means your JSON has a syntax error such as a
                  trailing comma, missing quote, or unescaped special character.
                  Check the line and column number shown in the error message to
                  locate the issue. Common fixes include removing trailing commas
                  after the last item in an array or object, and ensuring all
                  strings are double-quoted.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Is my data safe?
                </h3>
                <p className="text-slate-400">
                  Yes. All processing happens entirely in your browser using
                  JavaScript&apos;s built-in JSON.parse and JSON.stringify. No
                  data is sent to any server.
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
