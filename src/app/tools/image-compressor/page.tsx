"use client";

import { useState, useCallback, useRef } from "react";
import JsonLd from "@/components/JsonLd";
import RelatedTools from "@/components/RelatedTools";
import ToolBreadcrumb from "@/components/ToolBreadcrumb";
import {
  generateFAQSchema,
  generateWebAppSchema,
  generateBreadcrumbSchema,
} from "@/lib/jsonld";

/* ─── Types ─── */
interface CompressedImage {
  id: string;
  name: string;
  originalSize: number;
  originalType: string;
  originalUrl: string;
  compressedUrl: string | null;
  compressedSize: number;
  width: number;
  height: number;
  status: "pending" | "compressing" | "done" | "error";
}

type OutputFormat = "jpeg" | "webp" | "png";

/* ─── Helpers ─── */
const formatBytes = (bytes: number): string => {
  if (bytes === 0) return "0 B";
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(2) + " MB";
};

const calcSavings = (original: number, compressed: number): number =>
  original > 0 ? Math.round((1 - compressed / original) * 100) : 0;

const loadImage = (file: File): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });

const compressImage = (
  img: HTMLImageElement,
  format: OutputFormat,
  quality: number,
  canvas: HTMLCanvasElement
): Promise<Blob> =>
  new Promise((resolve, reject) => {
    const ctx = canvas.getContext("2d")!;
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(img, 0, 0);
    const mimeType = `image/${format}`;
    const q = format === "png" ? undefined : quality / 100;
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Canvas toBlob failed"))),
      mimeType,
      q
    );
  });

/* ─── Minimal ZIP builder (no external deps) ─── */
async function buildZip(files: { name: string; data: Uint8Array }[]): Promise<Blob> {
  const entries: { name: Uint8Array; data: Uint8Array; offset: number }[] = [];
  const parts: Uint8Array[] = [];
  let offset = 0;
  const encoder = new TextEncoder();

  for (const file of files) {
    const nameBytes = encoder.encode(file.name);
    const data = file.data;

    // Local file header (store, no compression for simplicity)
    const header = new ArrayBuffer(30 + nameBytes.length);
    const hv = new DataView(header);
    hv.setUint32(0, 0x04034b50, true); // signature
    hv.setUint16(4, 20, true); // version needed
    hv.setUint16(6, 0, true); // flags
    hv.setUint16(8, 0, true); // compression: store
    hv.setUint16(10, 0, true); // mod time
    hv.setUint16(12, 0, true); // mod date
    hv.setUint32(14, 0, true); // crc32 (skip for store)
    hv.setUint32(18, data.length, true); // compressed size
    hv.setUint32(22, data.length, true); // uncompressed size
    hv.setUint16(26, nameBytes.length, true);
    hv.setUint16(28, 0, true); // extra field length
    new Uint8Array(header).set(nameBytes, 30);

    const headerBytes = new Uint8Array(header);
    parts.push(headerBytes);
    parts.push(data);
    entries.push({ name: nameBytes, data, offset });
    offset += headerBytes.length + data.length;
  }

  // Central directory
  const cdStart = offset;
  for (const entry of entries) {
    const cd = new ArrayBuffer(46 + entry.name.length);
    const cv = new DataView(cd);
    cv.setUint32(0, 0x02014b50, true); // signature
    cv.setUint16(4, 20, true); // version made by
    cv.setUint16(6, 20, true); // version needed
    cv.setUint16(8, 0, true); // flags
    cv.setUint16(10, 0, true); // compression
    cv.setUint16(12, 0, true); // mod time
    cv.setUint16(14, 0, true); // mod date
    cv.setUint32(16, 0, true); // crc32
    cv.setUint32(20, entry.data.length, true);
    cv.setUint32(24, entry.data.length, true);
    cv.setUint16(28, entry.name.length, true);
    cv.setUint16(30, 0, true); // extra
    cv.setUint16(32, 0, true); // comment
    cv.setUint16(34, 0, true); // disk
    cv.setUint16(36, 0, true); // internal attrs
    cv.setUint32(38, 0, true); // external attrs
    cv.setUint32(42, entry.offset, true);
    new Uint8Array(cd).set(entry.name, 46);
    const cdBytes = new Uint8Array(cd);
    parts.push(cdBytes);
    offset += cdBytes.length;
  }

  // End of central directory
  const eocd = new ArrayBuffer(22);
  const ev = new DataView(eocd);
  ev.setUint32(0, 0x06054b50, true);
  ev.setUint16(4, 0, true);
  ev.setUint16(6, 0, true);
  ev.setUint16(8, entries.length, true);
  ev.setUint16(10, entries.length, true);
  ev.setUint32(12, offset - cdStart, true);
  ev.setUint32(16, cdStart, true);
  ev.setUint16(20, 0, true);
  parts.push(new Uint8Array(eocd));

  return new Blob(parts as BlobPart[], { type: "application/zip" });
}

/* ─── Presets ─── */
const compressionPresets = [
  { label: "Maximum", quality: 95, desc: "Minimal compression, best quality" },
  { label: "High", quality: 85, desc: "Recommended — good balance" },
  { label: "Medium", quality: 70, desc: "Noticeable compression, smaller files" },
  { label: "Low", quality: 50, desc: "Heavy compression, much smaller" },
  { label: "Minimum", quality: 20, desc: "Maximum compression, lowest quality" },
];

const MAX_IMAGES = 10;

/* ─── Component ─── */
export default function ImageCompressorPage() {
  const [images, setImages] = useState<CompressedImage[]>([]);
  const [format, setFormat] = useState<OutputFormat>("jpeg");
  const [quality, setQuality] = useState(85);
  const [isDragging, setIsDragging] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  /* ── Add files ── */
  const addFiles = useCallback((files: FileList | File[]) => {
    const fileArr = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (fileArr.length === 0) return;

    setImages((prev) => {
      const remaining = MAX_IMAGES - prev.length;
      const toAdd = fileArr.slice(0, remaining);
      const newEntries: CompressedImage[] = toAdd.map((f) => ({
        id: crypto.randomUUID(),
        name: f.name,
        originalSize: f.size,
        originalType: f.type,
        originalUrl: URL.createObjectURL(f),
        compressedUrl: null,
        compressedSize: 0,
        width: 0,
        height: 0,
        status: "pending" as const,
      }));

      // Load dimensions
      toAdd.forEach((file, i) => {
        const img = new Image();
        img.onload = () => {
          setImages((curr) =>
            curr.map((item) =>
              item.id === newEntries[i].id
                ? { ...item, width: img.naturalWidth, height: img.naturalHeight }
                : item
            )
          );
        };
        img.src = URL.createObjectURL(file);
      });

      return [...prev, ...newEntries];
    });
  }, []);

  /* ── Compress all ── */
  const compressAll = useCallback(async () => {
    if (!canvasRef.current || images.length === 0) return;
    setIsCompressing(true);
    const canvas = canvasRef.current;

    for (const img of images) {
      if (img.status === "done") continue;
      setImages((prev) =>
        prev.map((i) => (i.id === img.id ? { ...i, status: "compressing" } : i))
      );
      try {
        const imgEl = await loadImage(
          await fetch(img.originalUrl).then((r) => r.blob()) as unknown as File
        );
        // loadImage expects File but blob works for Image src via objectURL
        const loaded = new Image();
        loaded.src = img.originalUrl;
        await new Promise<void>((res) => {
          loaded.onload = () => res();
          if (loaded.complete) res();
        });

        const blob = await compressImage(loaded, format, quality, canvas);
        const url = URL.createObjectURL(blob);
        setImages((prev) =>
          prev.map((i) =>
            i.id === img.id
              ? { ...i, compressedUrl: url, compressedSize: blob.size, status: "done" }
              : i
          )
        );
      } catch {
        setImages((prev) =>
          prev.map((i) => (i.id === img.id ? { ...i, status: "error" } : i))
        );
      }
    }
    setIsCompressing(false);
  }, [images, format, quality]);

  /* ── Download single ── */
  const downloadOne = useCallback(
    (img: CompressedImage) => {
      if (!img.compressedUrl) return;
      const ext = format === "jpeg" ? "jpg" : format;
      const baseName = img.name.replace(/\.[^.]+$/, "");
      const a = document.createElement("a");
      a.href = img.compressedUrl;
      a.download = `${baseName}-compressed.${ext}`;
      a.click();
    },
    [format]
  );

  /* ── Download all as ZIP ── */
  const downloadAllZip = useCallback(async () => {
    const done = images.filter((i) => i.status === "done" && i.compressedUrl);
    if (done.length === 0) return;

    const ext = format === "jpeg" ? "jpg" : format;
    const entries: { name: string; data: Uint8Array }[] = [];

    for (const img of done) {
      const resp = await fetch(img.compressedUrl!);
      const buf = await resp.arrayBuffer();
      const baseName = img.name.replace(/\.[^.]+$/, "");
      entries.push({ name: `${baseName}-compressed.${ext}`, data: new Uint8Array(buf) });
    }

    const zipBlob = await buildZip(entries);
    const a = document.createElement("a");
    a.href = URL.createObjectURL(zipBlob);
    a.download = "compressed-images.zip";
    a.click();
    URL.revokeObjectURL(a.href);
  }, [images, format]);

  /* ── Remove single ── */
  const removeImage = useCallback((id: string) => {
    setImages((prev) => {
      const img = prev.find((i) => i.id === id);
      if (img) {
        URL.revokeObjectURL(img.originalUrl);
        if (img.compressedUrl) URL.revokeObjectURL(img.compressedUrl);
      }
      return prev.filter((i) => i.id !== id);
    });
  }, []);

  /* ── Clear all ── */
  const clearAll = useCallback(() => {
    images.forEach((img) => {
      URL.revokeObjectURL(img.originalUrl);
      if (img.compressedUrl) URL.revokeObjectURL(img.compressedUrl);
    });
    setImages([]);
  }, [images]);

  /* ── Drag and drop ── */
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      addFiles(e.dataTransfer.files);
    },
    [addFiles]
  );

  /* ── Aggregate stats ── */
  const totalOriginal = images.reduce((s, i) => s + i.originalSize, 0);
  const totalCompressed = images
    .filter((i) => i.status === "done")
    .reduce((s, i) => s + i.compressedSize, 0);
  const totalSavings = calcSavings(totalOriginal, totalCompressed);
  const allDone = images.length > 0 && images.every((i) => i.status === "done");
  const doneCount = images.filter((i) => i.status === "done").length;

  return (
    <main className="min-h-screen bg-slate-900 text-white">
      <title>Image Compressor - Reduce File Size Online | DevTools</title>
      <meta
        name="description"
        content="Free online image compressor. Reduce JPEG, PNG and WebP file sizes by up to 80%. Batch compress up to 10 images at once. No upload — runs entirely in your browser."
      />
      <JsonLd
        data={[
          generateWebAppSchema({
            slug: "image-compressor",
            name: "Image Compressor - Reduce File Size Online",
            description:
              "Free online image compressor. Reduce JPEG, PNG and WebP file sizes by up to 80%. Batch compress up to 10 images at once — all in your browser.",
            category: "image",
          }),
          generateBreadcrumbSchema({
            slug: "image-compressor",
            name: "Image Compressor",
            description:
              "Compress images to reduce file size with quality control",
            category: "image",
          }),
          generateFAQSchema([
            {
              question: "Is my image uploaded to a server?",
              answer:
                "No. All compression happens entirely in your browser using the HTML5 Canvas API. Your images never leave your device — no data is sent to any server.",
            },
            {
              question: "How many images can I compress at once?",
              answer:
                "You can batch compress up to 10 images at once. Simply drag and drop multiple files or select them from the file picker. Each image is compressed individually with the same quality settings.",
            },
            {
              question: "What quality setting should I use?",
              answer:
                "For photos and social media, 75-85% offers the best balance of quality and file size — typically 60-80% size reduction with minimal visible quality loss. For print or professional use, stay above 90%. For thumbnails or email, 50-70% is usually fine.",
            },
            {
              question: "Which format should I choose?",
              answer:
                "JPEG is best for photographs and complex images (no transparency). WebP offers 25-35% better compression than JPEG with transparency support — ideal for web use. PNG is best when you need lossless quality or transparency in graphics/logos.",
            },
            {
              question:
                "Why is my PNG file getting larger after compression?",
              answer:
                "PNG is a lossless format — the browser re-encodes it without guaranteed size reduction. For photos, switch to JPEG or WebP for significant compression.",
            },
          ]),
        ]}
      />

      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <ToolBreadcrumb slug="image-compressor" />
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Image Compressor</h1>
          <p className="text-slate-400">
            Compress images to reduce file size while maintaining quality.
            Supports JPEG, WebP, and PNG. Batch compress up to 10 images at
            once — all processing happens in your browser.
          </p>
        </div>

        {/* Upload Area */}
        <div
          onDrop={handleDrop}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onClick={() => fileInputRef.current?.click()}
          className={`bg-slate-800 rounded-lg p-8 mb-6 border-2 border-dashed cursor-pointer transition-colors text-center ${
            isDragging
              ? "border-blue-500 bg-blue-500/10"
              : "border-slate-600 hover:border-slate-500"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            onChange={(e) => {
              if (e.target.files) addFiles(e.target.files);
              e.target.value = "";
            }}
            className="hidden"
          />
          <div className="space-y-2">
            <div className="text-4xl">📦</div>
            <div className="text-lg font-medium">
              {images.length > 0
                ? `${images.length}/${MAX_IMAGES} images added — drop more or click to add`
                : "Drop images here or click to upload"}
            </div>
            <div className="text-sm text-slate-400">
              Supports JPEG, PNG, WebP — up to {MAX_IMAGES} images at once
            </div>
          </div>
        </div>

        {/* Controls */}
        {images.length > 0 && (
          <div className="bg-slate-800 rounded-lg p-6 mb-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              {/* Output Format */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Output Format
                </label>
                <select
                  value={format}
                  onChange={(e) => setFormat(e.target.value as OutputFormat)}
                  className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="jpeg">JPEG — Best compression for photos</option>
                  <option value="webp">
                    WebP — Modern, best size/quality ratio
                  </option>
                  <option value="png">PNG — Lossless, larger files</option>
                </select>
              </div>

              {/* Batch info */}
              <div className="flex items-end">
                <div className="text-sm text-slate-400">
                  {images.length} image{images.length !== 1 ? "s" : ""} queued
                  {doneCount > 0 && ` · ${doneCount} compressed`}
                </div>
              </div>
            </div>

            {/* Quality Slider */}
            {format !== "png" && (
              <div className="mb-4">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-sm font-medium text-slate-300">
                    Quality: {quality}%
                  </label>
                  <span className="text-xs text-slate-500">
                    {quality >= 90
                      ? "Maximum"
                      : quality >= 75
                      ? "High"
                      : quality >= 55
                      ? "Medium"
                      : quality >= 30
                      ? "Low"
                      : "Minimum"}
                  </span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={100}
                  value={quality}
                  onChange={(e) => setQuality(parseInt(e.target.value, 10))}
                  className="w-full accent-blue-600"
                />
                <div className="flex justify-between text-xs text-slate-500 mt-1">
                  <span>Smaller file</span>
                  <span>Better quality</span>
                </div>
              </div>
            )}

            {/* Quality Presets */}
            {format !== "png" && (
              <div className="flex flex-wrap gap-2 mb-4">
                {compressionPresets.map((preset) => (
                  <button
                    key={preset.label}
                    onClick={() => setQuality(preset.quality)}
                    className={`px-3 py-1 text-xs rounded border transition-colors ${
                      quality === preset.quality
                        ? "bg-blue-600 border-blue-500 text-white"
                        : "bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600"
                    }`}
                    title={preset.desc}
                  >
                    {preset.label} ({preset.quality}%)
                  </button>
                ))}
              </div>
            )}

            {/* Action buttons */}
            <div className="flex gap-3">
              <button
                onClick={compressAll}
                disabled={isCompressing || images.length === 0}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 text-white font-medium py-3 px-6 rounded transition-colors"
              >
                {isCompressing
                  ? "Compressing..."
                  : `Compress ${images.length} Image${images.length !== 1 ? "s" : ""}`}
              </button>
              <button
                onClick={clearAll}
                className="bg-slate-700 hover:bg-slate-600 text-slate-300 font-medium py-3 px-4 rounded transition-colors"
              >
                Clear All
              </button>
            </div>
          </div>
        )}

        {/* Aggregate Results Banner */}
        {allDone && images.length > 1 && (
          <div className="bg-gradient-to-r from-green-900/40 to-emerald-900/40 border border-green-700/50 rounded-lg p-6 mb-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-green-300">
                Batch Compression Complete
              </h2>
              <span className="text-3xl font-bold text-green-400">
                {totalSavings > 0 ? `-${totalSavings}%` : `${totalSavings}%`}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="text-center">
                <div className="text-xs text-slate-400 mb-1">Total Original</div>
                <div className="text-lg font-mono font-medium">
                  {formatBytes(totalOriginal)}
                </div>
              </div>
              <div className="text-center">
                <div className="text-xs text-slate-400 mb-1">
                  Total Compressed
                </div>
                <div className="text-lg font-mono font-medium">
                  {formatBytes(totalCompressed)}
                </div>
              </div>
              <div className="text-center">
                <div className="text-xs text-slate-400 mb-1">Total Saved</div>
                <div className="text-lg font-mono font-medium text-green-400">
                  {formatBytes(totalOriginal - totalCompressed)}
                </div>
              </div>
            </div>
            {totalSavings > 0 && (
              <div className="mb-4">
                <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500 rounded-full transition-all duration-500"
                    style={{ width: `${100 - totalSavings}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-slate-500 mt-1">
                  <span>Compressed ({100 - totalSavings}% of original)</span>
                  <span>{formatBytes(totalOriginal - totalCompressed)} saved</span>
                </div>
              </div>
            )}
            <button
              onClick={downloadAllZip}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-6 rounded transition-colors"
            >
              Download All as ZIP ({formatBytes(totalCompressed)})
            </button>
          </div>
        )}

        {/* Individual Image Results */}
        {images.length > 0 && (
          <div className="space-y-3 mb-6">
            {images.map((img) => {
              const savings = calcSavings(img.originalSize, img.compressedSize);
              return (
                <div
                  key={img.id}
                  className="bg-slate-800 rounded-lg p-4 flex items-center gap-4"
                >
                  {/* Thumbnail */}
                  <div className="w-16 h-16 flex-shrink-0 rounded overflow-hidden bg-slate-700">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={img.compressedUrl ?? img.originalUrl}
                      alt={img.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{img.name}</div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      {img.width > 0 && `${img.width}x${img.height} · `}
                      {formatBytes(img.originalSize)}
                      {img.status === "done" && (
                        <>
                          {" → "}
                          <span className="text-white">
                            {formatBytes(img.compressedSize)}
                          </span>
                        </>
                      )}
                    </div>
                    {img.status === "compressing" && (
                      <div className="text-xs text-blue-400 mt-0.5">
                        Compressing...
                      </div>
                    )}
                    {img.status === "error" && (
                      <div className="text-xs text-red-400 mt-0.5">
                        Compression failed
                      </div>
                    )}
                  </div>

                  {/* Savings badge */}
                  {img.status === "done" && (
                    <div
                      className={`text-sm font-bold px-3 py-1 rounded-full flex-shrink-0 ${
                        savings > 0
                          ? "bg-green-900/50 text-green-400"
                          : savings < 0
                          ? "bg-red-900/50 text-red-400"
                          : "bg-slate-700 text-slate-300"
                      }`}
                    >
                      {savings > 0
                        ? `-${savings}%`
                        : savings < 0
                        ? `+${Math.abs(savings)}%`
                        : "0%"}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 flex-shrink-0">
                    {img.status === "done" && img.compressedUrl && (
                      <button
                        onClick={() => downloadOne(img)}
                        className="bg-green-600 hover:bg-green-700 text-white text-xs font-medium py-1.5 px-3 rounded transition-colors"
                        title="Download compressed image"
                      >
                        Download
                      </button>
                    )}
                    <button
                      onClick={() => removeImage(img.id)}
                      className="bg-slate-700 hover:bg-slate-600 text-slate-400 hover:text-white text-xs py-1.5 px-2 rounded transition-colors"
                      title="Remove"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Single image ZIP + download when only 1 image done */}
        {allDone && images.length === 1 && images[0].compressedUrl && (
          <div className="bg-slate-800 rounded-lg p-6 mb-6">
            <h2 className="text-sm font-medium text-slate-400 mb-3">
              Compression Results
            </h2>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="bg-slate-900 rounded p-3 text-center">
                <div className="text-xs text-slate-400 mb-1">Original</div>
                <div className="text-lg font-mono font-medium">
                  {formatBytes(images[0].originalSize)}
                </div>
              </div>
              <div className="bg-slate-900 rounded p-3 text-center">
                <div className="text-xs text-slate-400 mb-1">Compressed</div>
                <div className="text-lg font-mono font-medium">
                  {formatBytes(images[0].compressedSize)}
                </div>
              </div>
              <div className="bg-slate-900 rounded p-3 text-center">
                <div className="text-xs text-slate-400 mb-1">Savings</div>
                <div
                  className={`text-2xl font-mono font-bold ${
                    totalSavings > 0
                      ? "text-green-400"
                      : totalSavings < 0
                      ? "text-red-400"
                      : "text-slate-300"
                  }`}
                >
                  {totalSavings > 0
                    ? `-${totalSavings}%`
                    : totalSavings < 0
                    ? `+${Math.abs(totalSavings)}%`
                    : "0%"}
                </div>
              </div>
            </div>
            {totalSavings > 0 && (
              <div className="mb-4">
                <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500 rounded-full transition-all duration-500"
                    style={{ width: `${100 - totalSavings}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-slate-500 mt-1">
                  <span>
                    Compressed ({100 - totalSavings}% of original)
                  </span>
                  <span>
                    {formatBytes(
                      images[0].originalSize - images[0].compressedSize
                    )}{" "}
                    saved
                  </span>
                </div>
              </div>
            )}
            <button
              onClick={() => downloadOne(images[0])}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-6 rounded transition-colors"
            >
              Download Compressed Image ({formatBytes(images[0].compressedSize)})
            </button>
          </div>
        )}

        {/* Hidden canvas for compression */}
        <canvas ref={canvasRef} className="hidden" />

        <RelatedTools currentSlug="image-compressor" />

        {/* Format Comparison */}
        <div className="bg-slate-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Format Comparison</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left py-2 text-slate-400 font-medium">
                    Format
                  </th>
                  <th className="text-left py-2 text-slate-400 font-medium">
                    Best For
                  </th>
                  <th className="text-left py-2 text-slate-400 font-medium">
                    Compression
                  </th>
                  <th className="text-left py-2 text-slate-400 font-medium">
                    Transparency
                  </th>
                </tr>
              </thead>
              <tbody className="text-slate-300">
                {[
                  [
                    "JPEG",
                    "Photos, complex images",
                    "Lossy — excellent size reduction",
                    "No",
                  ],
                  [
                    "WebP",
                    "Web images, modern browsers",
                    "Lossy or lossless — best ratio",
                    "Yes",
                  ],
                  [
                    "PNG",
                    "Graphics, screenshots, logos",
                    "Lossless — larger files",
                    "Yes",
                  ],
                ].map((row) => (
                  <tr key={row[0]} className="border-b border-slate-700/50">
                    <td className="py-2 font-medium text-white">{row[0]}</td>
                    <td className="py-2">{row[1]}</td>
                    <td className="py-2">{row[2]}</td>
                    <td className="py-2">{row[3]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* FAQ */}
        <div className="bg-slate-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            {[
              {
                q: "Is my image uploaded to a server?",
                a: "No. All compression happens entirely in your browser using the HTML5 Canvas API. Your images never leave your device — no data is sent to any server. This makes it completely private and works offline too.",
              },
              {
                q: "How many images can I compress at once?",
                a: "You can batch compress up to 10 images at once. Simply drag and drop multiple files or use the file picker. All images are compressed with the same quality settings and can be downloaded individually or as a ZIP file.",
              },
              {
                q: "What quality setting should I use?",
                a: "For photos and social media, 75-85% offers the best balance of quality and file size — typically 60-80% size reduction with minimal visible quality loss. For print or professional use, stay above 90%. For thumbnails or email, 50-70% is usually fine.",
              },
              {
                q: "Which format should I choose?",
                a: "JPEG is best for photographs and complex images (no transparency). WebP offers 25-35% better compression than JPEG with transparency support — ideal for web use if your target browsers support it (all modern browsers do). PNG is best when you need lossless quality or transparency in graphics/logos.",
              },
              {
                q: "Why is my PNG file getting larger after compression?",
                a: "PNG is a lossless format — the browser's Canvas API re-encodes it without guaranteed size reduction. For photos, switch to JPEG or WebP for significant compression. PNG works best for graphics with flat colors, text, and screenshots.",
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
