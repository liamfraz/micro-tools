"use client";

import { useState, useCallback, useRef } from "react";
import JsonLd from "@/components/JsonLd";
import RelatedTools from "@/components/RelatedTools";
import ToolBreadcrumb from "@/components/ToolBreadcrumb";
import AdUnit from "@/components/AdUnit";
import {
  generateFAQSchema,
  generateWebAppSchema,
  generateBreadcrumbSchema,
} from "@/lib/jsonld";

/* ─── Types ─── */
type Mode = "encode" | "decode";

interface ImageInfo {
  dataUri: string;
  rawBase64: string;
  mimeType: string;
  fileName: string;
  fileSize: number;
  width: number;
  height: number;
  base64Length: number;
}

/* ─── Helpers ─── */
const formatBytes = (bytes: number): string => {
  if (bytes === 0) return "0 B";
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(2) + " MB";
};

const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/gif", "image/webp", "image/svg+xml"];
const ACCEPT_STRING = ".png,.jpg,.jpeg,.gif,.webp,.svg";

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function getImageDimensions(src: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => resolve({ width: 0, height: 0 });
    img.src = src;
  });
}

function detectMimeFromBase64(b64: string): string {
  const header = atob(b64.slice(0, 16));
  const bytes = new Uint8Array(header.length);
  for (let i = 0; i < header.length; i++) bytes[i] = header.charCodeAt(i);
  if (bytes[0] === 0x89 && bytes[1] === 0x50) return "image/png";
  if (bytes[0] === 0xff && bytes[1] === 0xd8) return "image/jpeg";
  if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46) return "image/gif";
  if (bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46) return "image/webp";
  const text = new TextDecoder().decode(bytes);
  if (text.includes("<svg") || text.includes("<?xml")) return "image/svg+xml";
  return "image/png";
}

function base64ToBlob(b64: string, mime: string): Blob {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

const MIME_EXTENSIONS: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/gif": "gif",
  "image/webp": "webp",
  "image/svg+xml": "svg",
};

/* ─── Component ─── */
export default function Base64ImageEncoderPage() {
  const [mode, setMode] = useState<Mode>("encode");
  const [imageInfo, setImageInfo] = useState<ImageInfo | null>(null);
  const [decodeInput, setDecodeInput] = useState("");
  const [error, setError] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* ── Encode: process uploaded file ── */
  const processFile = useCallback(async (file: File) => {
    if (!ACCEPTED_TYPES.includes(file.type) && !file.name.endsWith(".svg")) {
      setError("Unsupported format. Use PNG, JPEG, GIF, WebP, or SVG.");
      return;
    }
    setError("");
    try {
      const dataUri = await fileToBase64(file);
      const rawBase64 = dataUri.split(",")[1] || "";
      const dims = await getImageDimensions(dataUri);
      setImageInfo({
        dataUri,
        rawBase64,
        mimeType: file.type || "image/png",
        fileName: file.name,
        fileSize: file.size,
        width: dims.width,
        height: dims.height,
        base64Length: rawBase64.length,
      });
    } catch {
      setError("Failed to read file.");
    }
  }, []);

  /* ── Decode: parse Base64 input ── */
  const decodeBase64Image = useCallback(async () => {
    setError("");
    const input = decodeInput.trim();
    if (!input) {
      setError("Paste a Base64 string or data URI.");
      return;
    }

    let rawBase64: string;
    let mimeType: string;

    const dataUriMatch = input.match(/^data:(image\/[a-zA-Z0-9+.-]+);base64,([\s\S]+)$/);
    if (dataUriMatch) {
      mimeType = dataUriMatch[1];
      rawBase64 = dataUriMatch[2].replace(/\s/g, "");
    } else {
      rawBase64 = input.replace(/\s/g, "");
      try {
        mimeType = detectMimeFromBase64(rawBase64);
      } catch {
        setError("Invalid Base64 string.");
        return;
      }
    }

    try {
      atob(rawBase64);
    } catch {
      setError("Invalid Base64 encoding.");
      return;
    }

    const dataUri = `data:${mimeType};base64,${rawBase64}`;
    const dims = await getImageDimensions(dataUri);
    if (dims.width === 0 && dims.height === 0) {
      setError("Could not render image from the provided Base64 string.");
      return;
    }

    const blob = base64ToBlob(rawBase64, mimeType);
    const ext = MIME_EXTENSIONS[mimeType] || "png";

    setImageInfo({
      dataUri,
      rawBase64,
      mimeType,
      fileName: `decoded-image.${ext}`,
      fileSize: blob.size,
      width: dims.width,
      height: dims.height,
      base64Length: rawBase64.length,
    });
  }, [decodeInput]);

  /* ── Copy helper ── */
  const copyToClipboard = useCallback(async (text: string, label: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  }, []);

  /* ── Download decoded image ── */
  const downloadImage = useCallback(() => {
    if (!imageInfo) return;
    const blob = base64ToBlob(imageInfo.rawBase64, imageInfo.mimeType);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = imageInfo.fileName;
    a.click();
    URL.revokeObjectURL(url);
  }, [imageInfo]);

  /* ── Drop handler ── */
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) processFile(file);
    },
    [processFile]
  );

  /* ── Reset ── */
  const reset = useCallback(() => {
    setImageInfo(null);
    setDecodeInput("");
    setError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  /* ── Copy snippets ── */
  const htmlImgTag = imageInfo
    ? `<img src="${imageInfo.dataUri}" alt="${imageInfo.fileName}" width="${imageInfo.width}" height="${imageInfo.height}" />`
    : "";
  const cssBgImage = imageInfo
    ? `background-image: url('${imageInfo.dataUri}');`
    : "";

  return (
    <main className="min-h-screen bg-slate-900 text-white">
      <title>Base64 Image Encoder & Decoder - Convert Images to Base64 Online | DevTools</title>
      <meta
        name="description"
        content="Free online Base64 image encoder and decoder. Convert PNG, JPEG, GIF, WebP, SVG images to Base64 data URIs. Decode Base64 strings back to images. Copy as raw Base64, data URI, HTML img tag, or CSS background-image."
      />
      <JsonLd
        data={[
          generateWebAppSchema({
            slug: "base64-image-encoder",
            name: "Base64 Image Encoder & Decoder",
            description:
              "Convert images to Base64 data URIs and decode Base64 strings back to images. Supports PNG, JPEG, GIF, WebP, and SVG. All processing in your browser.",
            category: "encoding",
          }),
          generateBreadcrumbSchema({
            slug: "base64-image-encoder",
            name: "Base64 Image Encoder & Decoder",
            description:
              "Convert images to Base64 and decode Base64 to images",
            category: "encoding",
          }),
          generateFAQSchema([
            {
              question: "What is Base64 image encoding?",
              answer:
                "Base64 image encoding converts binary image data into an ASCII text string. This allows you to embed images directly in HTML, CSS, or JSON without needing a separate image file — useful for reducing HTTP requests, embedding in emails, or storing images in databases.",
            },
            {
              question: "Are my images uploaded to a server?",
              answer:
                "No. All encoding and decoding happens entirely in your browser using the FileReader and Canvas APIs. Your images never leave your device.",
            },
            {
              question: "Why is the Base64 string larger than the original file?",
              answer:
                "Base64 encoding increases data size by approximately 33% because it represents 3 bytes of binary data as 4 ASCII characters. This trade-off is accepted for the convenience of text-based embedding.",
            },
            {
              question: "Which image formats are supported?",
              answer:
                "PNG, JPEG, GIF, WebP, and SVG are all supported. The tool automatically detects the MIME type and generates the correct data URI prefix.",
            },
            {
              question: "Can I use Base64 images in CSS?",
              answer:
                "Yes. Use the 'CSS background-image' copy button to get a ready-to-use CSS property with the Base64 data URI embedded. This is useful for small icons, patterns, or decorative elements to reduce HTTP requests.",
            },
          ]),
        ]}
      />

      <div className="max-w-4xl mx-auto px-4 py-12">
        <ToolBreadcrumb slug="base64-image-encoder" />

        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Base64 Image Encoder & Decoder</h1>
          <p className="text-slate-400">
            Convert images to Base64 data URIs or decode Base64 strings back to images.
            Supports PNG, JPEG, GIF, WebP, and SVG — all processing in your browser.
          </p>
        </div>

        <AdUnit slot="TOP_SLOT" format="horizontal" className="mb-6" />

        {/* Mode Toggle */}
        <div className="flex gap-2 mb-6">
          {(["encode", "decode"] as const).map((m) => (
            <button
              key={m}
              onClick={() => { setMode(m); reset(); }}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                mode === m
                  ? "bg-blue-600 text-white"
                  : "bg-slate-800 text-slate-400 hover:text-white"
              }`}
            >
              {m === "encode" ? "Encode Image → Base64" : "Decode Base64 → Image"}
            </button>
          ))}
        </div>

        {/* Encode Mode */}
        {mode === "encode" && !imageInfo && (
          <div
            onDrop={handleDrop}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onClick={() => fileInputRef.current?.click()}
            className={`bg-slate-800 rounded-lg p-12 mb-6 border-2 border-dashed cursor-pointer transition-colors text-center ${
              isDragging
                ? "border-blue-500 bg-blue-500/10"
                : "border-slate-600 hover:border-slate-500"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPT_STRING}
              className="hidden"
              onChange={(e) => e.target.files?.[0] && processFile(e.target.files[0])}
            />
            <svg className="w-12 h-12 mx-auto mb-3 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-slate-300 font-medium">
              Drop an image here or click to browse
            </p>
            <p className="text-sm text-slate-500 mt-1">
              PNG, JPEG, GIF, WebP, SVG
            </p>
          </div>
        )}

        {/* Decode Mode Input */}
        {mode === "decode" && !imageInfo && (
          <div className="mb-6">
            <textarea
              value={decodeInput}
              onChange={(e) => setDecodeInput(e.target.value)}
              placeholder="Paste Base64 string or data URI here..."
              className="w-full h-40 bg-slate-800 border border-slate-700 rounded-lg p-4 text-sm font-mono text-slate-300 placeholder-slate-500 focus:outline-none focus:border-blue-500 resize-y"
            />
            <button
              onClick={decodeBase64Image}
              disabled={!decodeInput.trim()}
              className="mt-3 px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:text-slate-500 rounded-lg font-medium transition-colors"
            >
              Decode Image
            </button>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-6 text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Results */}
        {imageInfo && (
          <div className="space-y-6">
            {/* Preview + Info */}
            <div className="bg-slate-800 rounded-lg p-6">
              <div className="flex items-start justify-between mb-4">
                <h2 className="text-lg font-semibold">
                  {mode === "encode" ? "Encoded Image" : "Decoded Image"}
                </h2>
                <button
                  onClick={reset}
                  className="text-sm text-slate-400 hover:text-white transition-colors"
                >
                  Clear
                </button>
              </div>

              {/* Preview */}
              <div className="bg-[url('data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20width%3D%2216%22%20height%3D%2216%22%3E%3Crect%20width%3D%228%22%20height%3D%228%22%20fill%3D%22%23334155%22/%3E%3Crect%20x%3D%228%22%20y%3D%228%22%20width%3D%228%22%20height%3D%228%22%20fill%3D%22%23334155%22/%3E%3C/svg%3E')] rounded-lg p-4 mb-4 flex justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imageInfo.dataUri}
                  alt="Preview"
                  className="max-w-full max-h-64 object-contain rounded"
                />
              </div>

              {/* Info Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-slate-700/50 rounded-lg p-3">
                  <p className="text-xs text-slate-400 uppercase tracking-wider">File Size</p>
                  <p className="text-sm font-mono mt-1">{formatBytes(imageInfo.fileSize)}</p>
                </div>
                <div className="bg-slate-700/50 rounded-lg p-3">
                  <p className="text-xs text-slate-400 uppercase tracking-wider">Dimensions</p>
                  <p className="text-sm font-mono mt-1">{imageInfo.width} × {imageInfo.height}</p>
                </div>
                <div className="bg-slate-700/50 rounded-lg p-3">
                  <p className="text-xs text-slate-400 uppercase tracking-wider">MIME Type</p>
                  <p className="text-sm font-mono mt-1">{imageInfo.mimeType}</p>
                </div>
                <div className="bg-slate-700/50 rounded-lg p-3">
                  <p className="text-xs text-slate-400 uppercase tracking-wider">Base64 Length</p>
                  <p className="text-sm font-mono mt-1">{imageInfo.base64Length.toLocaleString()} chars</p>
                </div>
              </div>
            </div>

            {/* Copy Buttons */}
            <div className="bg-slate-800 rounded-lg p-6">
              <h2 className="text-lg font-semibold mb-4">Copy Output</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { label: "Raw Base64", value: imageInfo.rawBase64 },
                  { label: "Data URI", value: imageInfo.dataUri },
                  { label: "HTML <img> Tag", value: htmlImgTag },
                  { label: "CSS background-image", value: cssBgImage },
                ].map(({ label, value }) => (
                  <button
                    key={label}
                    onClick={() => copyToClipboard(value, label)}
                    className="flex items-center justify-between bg-slate-700/50 hover:bg-slate-700 rounded-lg p-3 transition-colors text-left"
                  >
                    <span className="text-sm font-medium">{label}</span>
                    <span className="text-xs text-slate-400">
                      {copied === label ? (
                        <span className="text-green-400">Copied!</span>
                      ) : (
                        "Copy"
                      )}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Download (decode mode) */}
            {mode === "decode" && (
              <button
                onClick={downloadImage}
                className="w-full py-3 bg-green-600 hover:bg-green-700 rounded-lg font-medium transition-colors"
              >
                Download Image ({imageInfo.fileName})
              </button>
            )}

            {/* Base64 Output (encode mode) */}
            {mode === "encode" && (
              <div className="bg-slate-800 rounded-lg p-6">
                <h2 className="text-lg font-semibold mb-3">Base64 String</h2>
                <div className="relative">
                  <textarea
                    value={imageInfo.dataUri}
                    readOnly
                    className="w-full h-32 bg-slate-700/50 border border-slate-600 rounded-lg p-3 text-xs font-mono text-slate-300 resize-y focus:outline-none"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        <AdUnit slot="BOTTOM_SLOT" format="horizontal" className="mt-8" />

        {/* About Section */}
        <section className="mt-12 bg-slate-800/50 rounded-lg p-6 space-y-4">
          <h2 className="text-xl font-semibold">About Base64 Image Encoding</h2>
          <p className="text-slate-400 text-sm leading-relaxed">
            Base64 image encoding converts binary image data into a text string that can be
            embedded directly in HTML, CSS, JavaScript, JSON, or email templates. This eliminates
            the need for a separate HTTP request to load the image, which can improve performance
            for small assets like icons and logos.
          </p>
          <p className="text-slate-400 text-sm leading-relaxed">
            The trade-off is that Base64 encoding increases the data size by approximately 33%.
            For large images, it&#39;s generally better to serve them as separate files. Base64
            encoding is most effective for images under 10 KB.
          </p>
        </section>

        <RelatedTools currentSlug="base64-image-encoder" />
      </div>
    </main>
  );
}
