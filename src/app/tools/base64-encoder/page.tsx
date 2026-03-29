"use client";

import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import JsonLd from "@/components/JsonLd";
import RelatedTools from "@/components/RelatedTools";
import ToolBreadcrumb from "@/components/ToolBreadcrumb";
import AdUnit from "@/components/AdUnit";
import {
  generateFAQSchema,
  generateWebAppSchema,
  generateBreadcrumbSchema,
} from "@/lib/jsonld";

type CharEncoding = "utf-8" | "ascii" | "latin1";
type Mode = "encode" | "decode";

function encodeBytes(bytes: Uint8Array, urlSafe: boolean): string {
  let binary = "";
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  let encoded = btoa(binary);
  if (urlSafe) {
    encoded = encoded.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  }
  return encoded;
}

function decodeBase64(input: string, urlSafe: boolean): Uint8Array {
  let str = input.trim();
  if (urlSafe) {
    str = str.replace(/-/g, "+").replace(/_/g, "/");
    const pad = str.length % 4;
    if (pad === 2) str += "==";
    else if (pad === 3) str += "=";
  }
  const binary = atob(str);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function textToBytes(text: string, encoding: CharEncoding): Uint8Array {
  if (encoding === "utf-8") {
    return new TextEncoder().encode(text);
  }
  // ASCII and Latin-1: single-byte encodings
  const bytes = new Uint8Array(text.length);
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    if (encoding === "ascii" && code > 127) {
      throw new Error(`Character "${text[i]}" (U+${code.toString(16).padStart(4, "0")}) is outside ASCII range`);
    }
    if (encoding === "latin1" && code > 255) {
      throw new Error(`Character "${text[i]}" (U+${code.toString(16).padStart(4, "0")}) is outside Latin-1 range`);
    }
    bytes[i] = code;
  }
  return bytes;
}

function bytesToText(bytes: Uint8Array, encoding: CharEncoding): string {
  if (encoding === "utf-8") {
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  }
  // ASCII / Latin-1: single byte per character
  let text = "";
  for (let i = 0; i < bytes.length; i++) {
    if (encoding === "ascii" && bytes[i] > 127) {
      throw new Error(`Byte 0x${bytes[i].toString(16)} is outside ASCII range`);
    }
    text += String.fromCharCode(bytes[i]);
  }
  return text;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

export default function Base64EncoderPage() {
  const [plainText, setPlainText] = useState("");
  const [base64Text, setBase64Text] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<"plain" | "base64" | null>(null);
  const [mode, setMode] = useState<Mode>("encode");
  const [urlSafe, setUrlSafe] = useState(false);
  const [encoding, setEncoding] = useState<CharEncoding>("utf-8");
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileBase64, setFileBase64] = useState<string | null>(null);
  const [fileMime, setFileMime] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Live encode as user types in plain text field
  useEffect(() => {
    if (mode !== "encode" || fileName) return;
    if (!plainText) {
      setBase64Text("");
      setError(null);
      return;
    }
    try {
      const bytes = textToBytes(plainText, encoding);
      setBase64Text(encodeBytes(bytes, urlSafe));
      setError(null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Encoding failed");
    }
  }, [plainText, urlSafe, encoding, mode, fileName]);

  // Live decode as user types in base64 field
  useEffect(() => {
    if (mode !== "decode" || fileName) return;
    if (!base64Text) {
      setPlainText("");
      setError(null);
      return;
    }
    try {
      const bytes = decodeBase64(base64Text, urlSafe);
      setPlainText(bytesToText(bytes, encoding));
      setError(null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Invalid Base64 or binary content");
    }
  }, [base64Text, urlSafe, encoding, mode, fileName]);

  const handleFileUpload = useCallback(
    (file: File) => {
      setError(null);
      setFileName(file.name);
      setFileMime(file.type || "application/octet-stream");

      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(",")[1] || "";
        let output = base64;
        if (urlSafe) {
          output = output.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
        }
        setBase64Text(output);
        setFileBase64(base64);
        setPlainText(`[File: ${file.name} — ${formatBytes(file.size)}]`);
        setMode("encode");
      };
      reader.onerror = () => setError("Failed to read file");
      reader.readAsDataURL(file);
    },
    [urlSafe]
  );

  const onFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFileUpload(file);
    },
    [handleFileUpload]
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files?.[0];
      if (file) handleFileUpload(file);
    },
    [handleFileUpload]
  );

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const onDragLeave = useCallback(() => setDragOver(false), []);

  const downloadFile = useCallback(() => {
    try {
      let b64 = base64Text.trim();
      if (urlSafe) {
        b64 = b64.replace(/-/g, "+").replace(/_/g, "/");
        const pad = b64.length % 4;
        if (pad === 2) b64 += "==";
        else if (pad === 3) b64 += "=";
      }
      const binary = atob(b64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      const mime = fileMime || "application/octet-stream";
      const blob = new Blob([bytes], { type: mime });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName || "decoded-file";
      a.click();
      URL.revokeObjectURL(url);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to decode Base64 for download");
    }
  }, [base64Text, urlSafe, fileName, fileMime]);

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
    setFileBase64(null);
    setFileMime(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  const plainByteSize = new TextEncoder().encode(plainText).length;
  const base64ByteSize = new TextEncoder().encode(base64Text).length;

  // Detect if base64 content is an image and generate preview URL
  const imagePreviewUrl = useMemo(() => {
    if (!base64Text || base64Text.length < 8) return null;
    let b64 = base64Text.trim();
    if (urlSafe) {
      b64 = b64.replace(/-/g, "+").replace(/_/g, "/");
      const pad = b64.length % 4;
      if (pad === 2) b64 += "==";
      else if (pad === 3) b64 += "=";
    }
    // Check for known image magic bytes in the decoded base64
    try {
      const first16 = atob(b64.slice(0, 24));
      const bytes = Array.from(first16, (c) => c.charCodeAt(0));
      // PNG: 137 80 78 71
      if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) {
        return `data:image/png;base64,${b64}`;
      }
      // JPEG: FF D8 FF
      if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
        return `data:image/jpeg;base64,${b64}`;
      }
      // GIF: 47 49 46 38
      if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x38) {
        return `data:image/gif;base64,${b64}`;
      }
      // WebP: RIFF....WEBP
      if (bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
          bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50) {
        return `data:image/webp;base64,${b64}`;
      }
      // SVG: starts with < (likely XML/SVG)
      if (first16.trimStart().startsWith("<")) {
        if (first16.includes("svg") || atob(b64.slice(0, 200)).includes("svg")) {
          return `data:image/svg+xml;base64,${b64}`;
        }
      }
    } catch {
      // Not valid base64 yet
    }
    // If file was uploaded with a known image MIME
    if (fileMime?.startsWith("image/") && fileBase64) {
      return `data:${fileMime};base64,${b64}`;
    }
    return null;
  }, [base64Text, urlSafe, fileMime, fileBase64]);

  return (
    <>
      <title>
        Base64 Encode & Decode Online - Free Base64 to Image Converter |
        DevTools Hub
      </title>
      <meta
        name="description"
        content="Free online Base64 encode and decode tool. Base64 to image preview, image to Base64 converter, file to Base64 encoding. Supports URL-safe Base64, UTF-8, ASCII, and Latin-1. All processing in your browser — no data uploaded."
      />
      <meta
        name="keywords"
        content="base64 encode, base64 decode, base64 to image, image to base64, base64 encoder decoder, base64 to text, text to base64, file to base64, base64 image preview, url safe base64, base64 converter online, decode base64 to image"
      />
      <JsonLd
        data={[
          generateWebAppSchema({
            slug: "base64-encoder",
            name: "Base64 Encoder & Decoder",
            description:
              "Encode and decode Base64 online for free. Convert text, images, and files to Base64 with URL-safe mode and multiple character encodings.",
            category: "encoding",
          }),
          generateBreadcrumbSchema({
            slug: "base64-encoder",
            name: "Base64 Encoder & Decoder",
            description:
              "Encode and decode Base64 online for free with text, file, and image support",
            category: "encoding",
          }),
          generateFAQSchema([
            {
              question: "What is Base64 encoding?",
              answer:
                'Base64 is a binary-to-text encoding scheme that represents binary data as an ASCII string. It uses 64 printable characters (A-Z, a-z, 0-9, +, /) to encode data, making it safe to transmit over text-based protocols like email or embed in JSON and XML.',
            },
            {
              question: "What is URL-safe Base64?",
              answer:
                'URL-safe Base64 replaces the + and / characters with - and _ respectively, and removes trailing = padding. This makes the encoded string safe to use directly in URLs and filenames without percent-encoding.',
            },
            {
              question: "Why is my Base64 output larger than the input?",
              answer:
                "Base64 encoding increases data size by approximately 33%. Every 3 bytes of input become 4 Base64 characters. This overhead is the trade-off for being able to safely represent binary data as text.",
            },
            {
              question: "Can I encode images and files to Base64?",
              answer:
                "Yes. Drag and drop any file onto the drop zone or use the file picker. The file is read entirely in your browser and converted to Base64. You can also decode a Base64 string back to a downloadable file.",
            },
            {
              question: "How does this tool handle UTF-8, ASCII, and Latin-1?",
              answer:
                "Use the encoding selector to choose how text is converted to bytes before Base64 encoding. UTF-8 handles all Unicode characters (including emojis), ASCII covers 0-127, and Latin-1 (ISO 8859-1) covers 0-255. The same encoding is used for both encoding and decoding.",
            },
            {
              question: "How do I convert Base64 to an image?",
              answer:
                "Paste your Base64 string into the Base64 field and switch to Decode mode. If the data represents a valid image (PNG, JPEG, GIF, WebP, or SVG), a live preview appears automatically below the text panels. You can also click Download as File to save the decoded image.",
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
          <ToolBreadcrumb slug="base64-encoder" />

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
              Base64 Encoder & Decoder
            </h1>
            <p className="text-slate-400 max-w-2xl text-lg">
              Encode text to Base64 or decode Base64 to text with live preview.
              Upload files and images via drag-and-drop. Supports URL-safe
              Base64, UTF-8, ASCII, and Latin-1 encodings.
            </p>
          </div>

          {/* AdSense top unit */}
          <AdUnit slot="TOP_SLOT" format="horizontal" className="mb-6" />

          {/* Mode toggle + options */}
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <div className="flex rounded-lg overflow-hidden border border-slate-600">
              <button
                onClick={() => {
                  setMode("encode");
                  setError(null);
                }}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  mode === "encode"
                    ? "bg-blue-600 text-white"
                    : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                }`}
              >
                Encode
              </button>
              <button
                onClick={() => {
                  setMode("decode");
                  setError(null);
                }}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  mode === "decode"
                    ? "bg-blue-600 text-white"
                    : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                }`}
              >
                Decode
              </button>
            </div>

            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={urlSafe}
                onChange={(e) => setUrlSafe(e.target.checked)}
                className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-slate-300">URL-safe</span>
            </label>

            <div className="flex items-center gap-2">
              <label className="text-sm text-slate-400">Encoding:</label>
              <select
                value={encoding}
                onChange={(e) => setEncoding(e.target.value as CharEncoding)}
                className="bg-slate-800 border border-slate-600 text-slate-200 rounded px-2 py-1 text-sm"
              >
                <option value="utf-8">UTF-8</option>
                <option value="ascii">ASCII</option>
                <option value="latin1">Latin-1</option>
              </select>
            </div>

            <button
              onClick={clearAll}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors text-sm"
            >
              Clear
            </button>

            {base64Text && (
              <button
                onClick={downloadFile}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors text-sm"
              >
                Download as File
              </button>
            )}

            <div className="ml-auto">
              <label className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors cursor-pointer inline-block text-sm">
                Upload File
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={onFileInput}
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

          {/* File drop zone */}
          <div
            onDrop={onDrop}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            className={`mb-4 border-2 border-dashed rounded-lg p-4 text-center text-sm transition-colors ${
              dragOver
                ? "border-blue-500 bg-blue-900/20 text-blue-300"
                : "border-slate-600 text-slate-500 hover:border-slate-500"
            }`}
          >
            {dragOver
              ? "Drop file here..."
              : "Drag and drop a file here to encode it to Base64"}
          </div>

          {/* Panels */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
            {/* Plain text */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-slate-300">
                  Plain Text {mode === "encode" && "(input)"}
                  {mode === "decode" && "(output)"}
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
                  setFileName(null);
                  setFileBase64(null);
                  if (mode !== "encode") setMode("encode");
                }}
                placeholder="Enter text to encode to Base64..."
                className={`w-full h-80 bg-slate-800 border rounded-lg p-4 font-mono text-sm text-slate-200 placeholder-slate-500 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  mode === "encode" ? "border-blue-600/50" : "border-slate-600"
                }`}
                spellCheck={false}
                readOnly={!!fileName && mode === "encode"}
              />
            </div>

            {/* Base64 */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-slate-300">
                  Base64 {mode === "encode" && "(output)"}
                  {mode === "decode" && "(input)"}
                  {urlSafe && (
                    <span className="ml-2 text-xs text-blue-400">
                      URL-safe
                    </span>
                  )}
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
                  setFileName(null);
                  setFileBase64(null);
                  if (mode !== "decode") setMode("decode");
                }}
                placeholder="Enter Base64 string to decode..."
                className={`w-full h-80 bg-slate-800 border rounded-lg p-4 font-mono text-sm text-slate-200 placeholder-slate-500 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  mode === "decode" ? "border-blue-600/50" : "border-slate-600"
                }`}
                spellCheck={false}
              />
            </div>
          </div>

          {/* Size comparison */}
          {plainText && base64Text && !fileName && (
            <div className="mb-6 p-3 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-400">
              Size increase:{" "}
              <span className="text-white font-medium">
                {formatBytes(plainByteSize)}
              </span>{" "}
              →{" "}
              <span className="text-white font-medium">
                {formatBytes(base64ByteSize)}
              </span>{" "}
              (
              {plainByteSize > 0
                ? `+${Math.round(((base64ByteSize - plainByteSize) / plainByteSize) * 100)}%`
                : "—"}
              )
            </div>
          )}

          {/* Image preview for base64 images */}
          {imagePreviewUrl && (
            <div className="mb-6 p-4 bg-slate-800 border border-slate-700 rounded-lg">
              <h2 className="text-sm font-medium text-slate-300 mb-3">
                Base64 Image Preview
              </h2>
              <div className="flex justify-center bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2220%22%20height%3D%2220%22%3E%3Crect%20width%3D%2210%22%20height%3D%2210%22%20fill%3D%22%23334155%22%2F%3E%3Crect%20x%3D%2210%22%20y%3D%2210%22%20width%3D%2210%22%20height%3D%2210%22%20fill%3D%22%23334155%22%2F%3E%3C%2Fsvg%3E')] rounded-lg p-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imagePreviewUrl}
                  alt="Decoded Base64 image preview"
                  className="max-w-full max-h-96 object-contain rounded"
                />
              </div>
            </div>
          )}

          {/* AdSense middle unit */}
          <AdUnit slot="MIDDLE_SLOT" format="rectangle" className="mb-6" />

          {/* Tips section */}
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 mb-6">
            <h2 className="text-lg font-semibold text-white mb-4">
              Base64 Encoding Tips
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
              {[
                {
                  name: "Use URL-safe for URLs",
                  tip: "Standard Base64 uses + and / which need percent-encoding in URLs. Toggle URL-safe mode to use - and _ instead.",
                },
                {
                  name: "Expect 33% size increase",
                  tip: "Every 3 bytes of input become 4 Base64 characters. A 30KB image becomes ~40KB in Base64.",
                },
                {
                  name: "Embed images in CSS/HTML",
                  tip: 'Use "data:image/png;base64,..." data URIs to embed small images directly in HTML or CSS without extra HTTP requests.',
                },
                {
                  name: "Choose the right encoding",
                  tip: "UTF-8 handles all Unicode characters. Use ASCII for 7-bit data or Latin-1 for Western European text with byte-level control.",
                },
                {
                  name: "API payloads",
                  tip: "Base64 is commonly used to send binary data (images, PDFs) in JSON API payloads since JSON only supports text.",
                },
                {
                  name: "All processing is local",
                  tip: "Your data never leaves your browser. Encoding and decoding happens entirely in JavaScript — no server involved.",
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

          <RelatedTools currentSlug="base64-encoder" />

          {/* AdSense bottom unit */}
          <AdUnit slot="BOTTOM_SLOT" format="auto" className="my-8" />

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
                  binary data as an ASCII string. It uses 64 printable
                  characters (A-Z, a-z, 0-9, +, /) to encode data, making it
                  safe to transmit over text-based protocols like email or embed
                  in JSON and XML.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  What is URL-safe Base64?
                </h3>
                <p className="text-slate-400">
                  URL-safe Base64 replaces the + and / characters with - and _
                  respectively, and removes trailing = padding. This makes the
                  encoded string safe to use directly in URLs, filenames, and
                  query parameters without percent-encoding.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Why is my Base64 output larger than the input?
                </h3>
                <p className="text-slate-400">
                  Base64 encoding increases data size by approximately 33%.
                  Every 3 bytes of input become 4 Base64 characters. This
                  overhead is the trade-off for being able to safely represent
                  binary data as text.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Can I encode images and files to Base64?
                </h3>
                <p className="text-slate-400">
                  Yes. Drag and drop any file onto the drop zone or click
                  &ldquo;Upload File&rdquo; to select a file. The file is read
                  entirely in your browser and converted to its Base64
                  representation. You can also paste a Base64 string and
                  download it as a file.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  How does this tool handle different character encodings?
                </h3>
                <p className="text-slate-400">
                  Use the encoding selector to choose how text is converted to
                  bytes before Base64 encoding. UTF-8 handles all Unicode
                  characters including emojis and CJK. ASCII covers characters
                  0-127. Latin-1 (ISO 8859-1) covers 0-255 and is useful for
                  Western European text.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  How do I convert Base64 to an image?
                </h3>
                <p className="text-slate-400">
                  Paste your Base64 string into the Base64 field and switch to
                  Decode mode. If the data represents a valid image (PNG, JPEG,
                  GIF, WebP, or SVG), a live preview appears automatically below
                  the text panels. You can also click &ldquo;Download as
                  File&rdquo; to save the decoded image to your device.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Is my data safe?
                </h3>
                <p className="text-slate-400">
                  Yes. All processing happens entirely in your browser using
                  JavaScript&apos;s built-in encoding APIs. No data is sent to
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
