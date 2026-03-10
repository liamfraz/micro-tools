"use client";

import { useState, useCallback, useRef } from "react";

export default function Base64EncoderPage() {
  const [plainText, setPlainText] = useState("");
  const [base64Text, setBase64Text] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<"plain" | "base64" | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const encode = useCallback(() => {
    setError(null);
    setFileName(null);
    try {
      const encoder = new TextEncoder();
      const bytes = encoder.encode(plainText);
      let binary = "";
      bytes.forEach((b) => (binary += String.fromCharCode(b)));
      const encoded = btoa(binary);
      setBase64Text(encoded);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Encoding failed");
    }
  }, [plainText]);

  const decode = useCallback(() => {
    setError(null);
    setFileName(null);
    try {
      const binary = atob(base64Text.trim());
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      const decoder = new TextDecoder("utf-8", { fatal: true });
      const decoded = decoder.decode(bytes);
      setPlainText(decoded);
    } catch (e: unknown) {
      setError(
        e instanceof Error ? e.message : "Invalid Base64 or binary content"
      );
    }
  }, [base64Text]);

  const autoDetect = useCallback(() => {
    setError(null);
    setFileName(null);
    // Try to decode the base64 field first
    if (base64Text.trim()) {
      try {
        const binary = atob(base64Text.trim());
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
          bytes[i] = binary.charCodeAt(i);
        }
        const decoder = new TextDecoder("utf-8", { fatal: true });
        const decoded = decoder.decode(bytes);
        setPlainText(decoded);
        return;
      } catch {
        // Not valid base64, fall through
      }
    }
    // Fall back to encoding the plain text
    if (plainText.trim()) {
      encode();
      return;
    }
    setError("Enter text in either field to auto-detect the operation.");
  }, [plainText, base64Text, encode]);

  const handleFileUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setError(null);
      setFileName(file.name);

      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // dataURL format: "data:mime;base64,XXXX"
        const base64 = result.split(",")[1] || "";
        setBase64Text(base64);
        setPlainText(`[File: ${file.name} (${formatBytes(file.size)})]`);
      };
      reader.onerror = () => {
        setError("Failed to read file");
      };
      reader.readAsDataURL(file);
    },
    []
  );

  const copyText = useCallback(
    async (which: "plain" | "base64") => {
      const text = which === "plain" ? plainText : base64Text;
      if (!text) return;
      await navigator.clipboard.writeText(text);
      setCopied(which);
      setTimeout(() => setCopied(null), 2000);
    },
    [plainText, base64Text]
  );

  const clearAll = useCallback(() => {
    setPlainText("");
    setBase64Text("");
    setError(null);
    setFileName(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  function formatBytes(bytes: number): string {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  }

  const plainByteSize = new TextEncoder().encode(plainText).length;
  const base64ByteSize = new TextEncoder().encode(base64Text).length;

  return (
    <>
      <title>Base64 Encoder & Decoder - Free Online Tool | Micro Tools</title>
      <meta
        name="description"
        content="Encode and decode Base64 online for free. Supports UTF-8 text and file uploads. Convert text to Base64 or decode Base64 strings instantly in your browser."
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
              <li className="text-slate-200">Base64 Encoder</li>
            </ol>
          </nav>

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
              Base64 Encoder & Decoder
            </h1>
            <p className="text-slate-400 max-w-2xl text-lg">
              Encode text or files to Base64, or decode Base64 strings back to
              plain text. All processing happens in your browser with full UTF-8
              support.
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
              onClick={autoDetect}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors"
            >
              Auto-Detect
            </button>
            <button
              onClick={clearAll}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors"
            >
              Clear
            </button>

            <div className="ml-auto">
              <label className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors cursor-pointer inline-block">
                Upload File
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
              {fileName && (
                <span className="ml-2 text-sm text-slate-400">{fileName}</span>
              )}
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-4 p-3 bg-red-900/40 border border-red-700 rounded-lg text-red-300 text-sm font-mono">
              <span className="font-bold">Error:</span> {error}
            </div>
          )}

          {/* Panels */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
            {/* Plain text */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-slate-300">
                  Plain Text
                </label>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-500">
                    {formatBytes(plainByteSize)}
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
                }}
                placeholder="Enter plain text to encode..."
                className="w-full h-80 bg-slate-800 border border-slate-600 rounded-lg p-4 font-mono text-sm text-slate-200 placeholder-slate-500 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                spellCheck={false}
              />
            </div>

            {/* Base64 */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-slate-300">
                  Base64
                </label>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-500">
                    {formatBytes(base64ByteSize)}
                  </span>
                  <button
                    onClick={() => copyText("base64")}
                    disabled={!base64Text}
                    className="text-xs text-slate-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    {copied === "base64" ? "Copied!" : "Copy"}
                  </button>
                </div>
              </div>
              <textarea
                value={base64Text}
                onChange={(e) => {
                  setBase64Text(e.target.value);
                  setError(null);
                }}
                placeholder="Enter Base64 string to decode..."
                className="w-full h-80 bg-slate-800 border border-slate-600 rounded-lg p-4 font-mono text-sm text-slate-200 placeholder-slate-500 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  What is Base64 encoding?
                </h3>
                <p className="text-slate-400">
                  Base64 is a binary-to-text encoding scheme that represents
                  binary data as an ASCII string. It uses 64 printable characters
                  (A-Z, a-z, 0-9, +, /) to encode data, making it safe to
                  transmit over text-based protocols like email or embed in JSON
                  and XML.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Why is my Base64 output larger than the input?
                </h3>
                <p className="text-slate-400">
                  Base64 encoding increases data size by approximately 33%. Every
                  3 bytes of input become 4 Base64 characters. This overhead is
                  the trade-off for being able to safely represent binary data as
                  text.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Does this tool support file encoding?
                </h3>
                <p className="text-slate-400">
                  Yes. Click the &ldquo;Upload File&rdquo; button to select any
                  file from your computer. The file will be read and converted to
                  its Base64 representation entirely in your browser. No data is
                  uploaded to any server.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  How does this tool handle UTF-8 characters?
                </h3>
                <p className="text-slate-400">
                  This tool properly encodes and decodes multi-byte UTF-8
                  characters (including emojis, accented letters, and CJK
                  characters) by using the TextEncoder and TextDecoder APIs
                  rather than the legacy btoa/atob approach alone.
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
