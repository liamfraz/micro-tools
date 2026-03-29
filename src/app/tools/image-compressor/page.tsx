"use client";

import { useState, useCallback, useRef, useEffect } from "react";
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
  file: File;
  name: string;
  originalSize: number;
  originalUrl: string;
  compressedUrl: string | null;
  compressedBlob: Blob | null;
  compressedSize: number;
  width: number;
  height: number;
  outputWidth: number;
  outputHeight: number;
  status: "pending" | "compressing" | "done" | "error";
}

type OutputFormat = "original" | "jpeg" | "webp";

/* ─── Helpers ─── */
const formatBytes = (bytes: number): string => {
  if (bytes === 0) return "0 B";
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(2) + " MB";
};

const calcSavings = (original: number, compressed: number): number =>
  original > 0 ? Math.round((1 - compressed / original) * 100) : 0;

function getMimeForFormat(format: OutputFormat, originalType: string): string {
  if (format === "jpeg") return "image/jpeg";
  if (format === "webp") return "image/webp";
  // "original" — keep the source format
  if (originalType === "image/png") return "image/png";
  if (originalType === "image/webp") return "image/webp";
  return "image/jpeg";
}

function getExtForFormat(format: OutputFormat, originalName: string): string {
  if (format === "jpeg") return "jpg";
  if (format === "webp") return "webp";
  const ext = originalName.split(".").pop()?.toLowerCase() || "jpg";
  return ext;
}

/* ─── Minimal ZIP builder (no external deps) ─── */
async function buildZip(
  files: { name: string; data: Uint8Array }[]
): Promise<Blob> {
  const entries: { name: Uint8Array; data: Uint8Array; offset: number }[] = [];
  const parts: Uint8Array[] = [];
  let offset = 0;
  const encoder = new TextEncoder();

  for (const file of files) {
    const nameBytes = encoder.encode(file.name);
    const data = file.data;

    const header = new ArrayBuffer(30 + nameBytes.length);
    const hv = new DataView(header);
    hv.setUint32(0, 0x04034b50, true);
    hv.setUint16(4, 20, true);
    hv.setUint16(6, 0, true);
    hv.setUint16(8, 0, true);
    hv.setUint16(10, 0, true);
    hv.setUint16(12, 0, true);
    hv.setUint32(14, 0, true);
    hv.setUint32(18, data.length, true);
    hv.setUint32(22, data.length, true);
    hv.setUint16(26, nameBytes.length, true);
    hv.setUint16(28, 0, true);
    new Uint8Array(header).set(nameBytes, 30);

    const headerBytes = new Uint8Array(header);
    parts.push(headerBytes);
    parts.push(data);
    entries.push({ name: nameBytes, data, offset });
    offset += headerBytes.length + data.length;
  }

  const cdStart = offset;
  for (const entry of entries) {
    const cd = new ArrayBuffer(46 + entry.name.length);
    const cv = new DataView(cd);
    cv.setUint32(0, 0x02014b50, true);
    cv.setUint16(4, 20, true);
    cv.setUint16(6, 20, true);
    cv.setUint16(8, 0, true);
    cv.setUint16(10, 0, true);
    cv.setUint16(12, 0, true);
    cv.setUint16(14, 0, true);
    cv.setUint32(16, 0, true);
    cv.setUint32(20, entry.data.length, true);
    cv.setUint32(24, entry.data.length, true);
    cv.setUint16(28, entry.name.length, true);
    cv.setUint16(30, 0, true);
    cv.setUint16(32, 0, true);
    cv.setUint16(34, 0, true);
    cv.setUint16(36, 0, true);
    cv.setUint32(38, 0, true);
    cv.setUint32(42, entry.offset, true);
    new Uint8Array(cd).set(entry.name, 46);
    const cdBytes = new Uint8Array(cd);
    parts.push(cdBytes);
    offset += cdBytes.length;
  }

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

const MAX_IMAGES = 20;

/* ─── Component ─── */
export default function ImageCompressorPage() {
  const [images, setImages] = useState<CompressedImage[]>([]);
  const [format, setFormat] = useState<OutputFormat>("original");
  const [quality, setQuality] = useState(80);
  const [maxDimension, setMaxDimension] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  /* ── Compress a single image ── */
  const compressSingle = useCallback(
    async (entry: CompressedImage): Promise<Partial<CompressedImage>> => {
      return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
          let w = img.naturalWidth;
          let h = img.naturalHeight;

          // Apply max dimension resize
          if (maxDimension > 0 && (w > maxDimension || h > maxDimension)) {
            if (w > h) {
              h = Math.round((h / w) * maxDimension);
              w = maxDimension;
            } else {
              w = Math.round((w / h) * maxDimension);
              h = maxDimension;
            }
          }

          const canvas = canvasRef.current ?? document.createElement("canvas");
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            resolve({ status: "error" });
            return;
          }

          const mime = getMimeForFormat(format, entry.file.type);
          // Fill white bg for JPEG (no transparency)
          if (mime === "image/jpeg") {
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(0, 0, w, h);
          }

          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = "high";
          ctx.drawImage(img, 0, 0, w, h);

          const q = mime === "image/png" ? undefined : quality / 100;
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                resolve({ status: "error" });
                return;
              }
              const url = URL.createObjectURL(blob);
              resolve({
                compressedUrl: url,
                compressedBlob: blob,
                compressedSize: blob.size,
                outputWidth: w,
                outputHeight: h,
                status: "done" as const,
              });
            },
            mime,
            q
          );
        };
        img.onerror = () => resolve({ status: "error" });
        img.src = entry.originalUrl;
      });
    },
    [format, quality, maxDimension]
  );

  /* ── Process a batch ── */
  const processImages = useCallback(
    async (entries: CompressedImage[]) => {
      for (const entry of entries) {
        setImages((prev) =>
          prev.map((i) =>
            i.id === entry.id ? { ...i, status: "compressing" as const } : i
          )
        );
        const result = await compressSingle(entry);
        setImages((prev) =>
          prev.map((i) => (i.id === entry.id ? { ...i, ...result } : i))
        );
      }
    },
    [compressSingle]
  );

  /* ── Add files (auto-compress) ── */
  const addFiles = useCallback(
    (fileList: FileList | File[]) => {
      const validTypes = ["image/png", "image/jpeg", "image/webp", "image/jpg"];
      const fileArr = Array.from(fileList).filter((f) =>
        validTypes.includes(f.type)
      );
      if (fileArr.length === 0) return;

      const newEntries: CompressedImage[] = [];
      setImages((prev) => {
        const remaining = MAX_IMAGES - prev.length;
        const toAdd = fileArr.slice(0, remaining);

        for (const file of toAdd) {
          const id = crypto.randomUUID();
          const url = URL.createObjectURL(file);
          const imgEl = new Image();
          imgEl.src = url;
          imgEl.onload = () => {
            setImages((curr) =>
              curr.map((item) =>
                item.id === id
                  ? { ...item, width: imgEl.naturalWidth, height: imgEl.naturalHeight }
                  : item
              )
            );
          };

          const entry: CompressedImage = {
            id,
            file,
            name: file.name,
            originalSize: file.size,
            originalUrl: url,
            compressedUrl: null,
            compressedBlob: null,
            compressedSize: 0,
            width: 0,
            height: 0,
            outputWidth: 0,
            outputHeight: 0,
            status: "pending",
          };
          newEntries.push(entry);
        }

        if (!selectedId && newEntries.length > 0) {
          setSelectedId(newEntries[0].id);
        }

        return [...prev, ...newEntries];
      });

      // Auto-compress
      if (newEntries.length > 0) {
        processImages(newEntries);
      }
    },
    [selectedId, processImages]
  );

  /* ── Recompress all when settings change ── */
  useEffect(() => {
    if (images.length === 0) return;
    const toRecompress = images.filter(
      (img) => img.status === "done" || img.status === "error"
    );
    if (toRecompress.length === 0) return;

    // Revoke old URLs
    toRecompress.forEach((img) => {
      if (img.compressedUrl) URL.revokeObjectURL(img.compressedUrl);
    });

    setImages((prev) =>
      prev.map((img) =>
        img.status === "done" || img.status === "error"
          ? {
              ...img,
              status: "pending" as const,
              compressedUrl: null,
              compressedBlob: null,
              compressedSize: 0,
            }
          : img
      )
    );

    processImages(toRecompress);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quality, format, maxDimension]);

  /* ── Download single ── */
  const downloadOne = useCallback(
    (img: CompressedImage) => {
      if (!img.compressedUrl) return;
      const ext = getExtForFormat(format, img.name);
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
    const done = images.filter((i) => i.status === "done" && i.compressedBlob);
    if (done.length === 0) return;
    if (done.length === 1) {
      downloadOne(done[0]);
      return;
    }

    const ext = getExtForFormat(format, "file.jpg");
    const entries: { name: string; data: Uint8Array }[] = [];

    for (const img of done) {
      const buf = await img.compressedBlob!.arrayBuffer();
      const baseName = img.name.replace(/\.[^.]+$/, "");
      entries.push({
        name: `${baseName}-compressed.${ext}`,
        data: new Uint8Array(buf),
      });
    }

    const zipBlob = await buildZip(entries);
    const a = document.createElement("a");
    a.href = URL.createObjectURL(zipBlob);
    a.download = "compressed-images.zip";
    a.click();
    URL.revokeObjectURL(a.href);
  }, [images, format, downloadOne]);

  /* ── Remove / Clear ── */
  const removeImage = useCallback(
    (id: string) => {
      setImages((prev) => {
        const img = prev.find((i) => i.id === id);
        if (img) {
          URL.revokeObjectURL(img.originalUrl);
          if (img.compressedUrl) URL.revokeObjectURL(img.compressedUrl);
        }
        return prev.filter((i) => i.id !== id);
      });
      if (selectedId === id) {
        setSelectedId((prev) => {
          const remaining = images.filter((f) => f.id !== id);
          return remaining.length > 0 ? remaining[0].id : null;
        });
      }
    },
    [selectedId, images]
  );

  const clearAll = useCallback(() => {
    images.forEach((img) => {
      URL.revokeObjectURL(img.originalUrl);
      if (img.compressedUrl) URL.revokeObjectURL(img.compressedUrl);
    });
    setImages([]);
    setSelectedId(null);
  }, [images]);

  /* ── Drop handler ── */
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      addFiles(e.dataTransfer.files);
    },
    [addFiles]
  );

  /* ── Derived state ── */
  const totalOriginal = images.reduce((s, i) => s + i.originalSize, 0);
  const totalCompressed = images
    .filter((i) => i.status === "done")
    .reduce((s, i) => s + i.compressedSize, 0);
  const totalSavings = calcSavings(totalOriginal, totalCompressed);
  const doneCount = images.filter((i) => i.status === "done").length;
  const allDone = images.length > 0 && images.every((i) => i.status === "done");
  const selectedImage = images.find((i) => i.id === selectedId) ?? null;

  const checkerBg = {
    backgroundImage:
      "linear-gradient(45deg, #1e293b 25%, transparent 25%), linear-gradient(-45deg, #1e293b 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #1e293b 75%), linear-gradient(-45deg, transparent 75%, #1e293b 75%)",
    backgroundSize: "16px 16px",
    backgroundPosition: "0 0, 0 8px, 8px -8px, -8px 0px",
  };

  return (
    <main className="min-h-screen bg-slate-900 text-white">
      <title>Image Compressor - Reduce File Size Online Free | DevTools</title>
      <meta
        name="description"
        content="Free online image compressor. Reduce JPEG, PNG and WebP file sizes by up to 80%. Batch compress multiple images at once. No upload — runs entirely in your browser."
      />
      <meta
        name="keywords"
        content="image compressor, compress images online, reduce image size, compress png, compress jpg, compress webp, image optimizer, reduce file size, batch image compression, image compression tool, free image compressor, convert to webp"
      />
      <JsonLd
        data={[
          generateWebAppSchema({
            slug: "image-compressor",
            name: "Image Compressor - Reduce File Size Online",
            description:
              "Free online image compressor. Reduce JPEG, PNG and WebP file sizes by up to 80%. Batch compress up to 20 images at once — all in your browser.",
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
                "You can batch compress up to 20 images at once. Simply drag and drop multiple files or select them from the file picker. Each image is compressed individually with the same quality settings.",
            },
            {
              question: "What quality setting should I use?",
              answer:
                "For photos and social media, 75-85% offers the best balance of quality and file size — typically 60-80% size reduction with minimal visible quality loss. For print or professional use, stay above 90%. For thumbnails or email, 50-70% is usually fine.",
            },
            {
              question: "Which format should I choose?",
              answer:
                "Keep Original preserves the source format. JPEG is best for photographs (no transparency). WebP offers 25-35% better compression than JPEG with transparency support — ideal for web use. All modern browsers support WebP.",
            },
            {
              question:
                "Why is my PNG file getting larger after compression?",
              answer:
                "PNG is a lossless format — the browser re-encodes it without guaranteed size reduction. For photos, switch to JPEG or WebP for significant compression.",
            },
            {
              question: "What does the max dimension resize option do?",
              answer:
                "It scales down images so that neither width nor height exceeds the value you set, while preserving the aspect ratio. This is useful for reducing very large images from cameras (e.g., 6000px wide) to a web-friendly size like 1920px.",
            },
            {
              question: "Can I see a before and after comparison?",
              answer:
                "Yes. Click on any image in the list to see a side-by-side before/after preview showing both the original and compressed versions with file sizes, dimensions, and compression ratio.",
            },
          ]),
        ]}
      />

      <div className="max-w-6xl mx-auto px-4 py-12">
        <ToolBreadcrumb slug="image-compressor" />

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Image Compressor</h1>
          <p className="text-slate-400 max-w-2xl">
            Compress PNG, JPG, and WebP images with adjustable quality, format
            conversion, and dimension resize. Batch process up to 20 images —
            all client-side. Your images never leave your browser.
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
          <svg
            className="w-10 h-10 mx-auto text-slate-400 mb-3"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
            />
          </svg>
          <p className="text-lg font-medium text-slate-300">
            {images.length > 0
              ? `${images.length}/${MAX_IMAGES} images — drop more or click to add`
              : "Drop images here or click to upload"}
          </p>
          <p className="text-sm text-slate-500 mt-1">
            PNG, JPG, WebP — up to {MAX_IMAGES} images at once
          </p>
        </div>

        {/* Controls */}
        <div className="bg-slate-800 rounded-lg p-5 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Quality */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Quality: {quality}%
              </label>
              <input
                type="range"
                min={1}
                max={100}
                value={quality}
                onChange={(e) => setQuality(Number(e.target.value))}
                className="w-full accent-blue-500"
              />
              <div className="flex justify-between text-xs text-slate-500 mt-1">
                <span>Smaller file</span>
                <span>Better quality</span>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {compressionPresets.map((p) => (
                  <button
                    key={p.label}
                    onClick={() => setQuality(p.quality)}
                    className={`px-2 py-0.5 text-xs rounded transition-colors ${
                      quality === p.quality
                        ? "bg-blue-600 text-white"
                        : "bg-slate-700 text-slate-400 hover:bg-slate-600"
                    }`}
                    title={p.desc}
                  >
                    {p.quality}%
                  </button>
                ))}
              </div>
            </div>

            {/* Output format */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Output Format
              </label>
              <div className="flex flex-col gap-1.5">
                {(
                  [
                    ["original", "Keep Original"],
                    ["webp", "WebP"],
                    ["jpeg", "JPG"],
                  ] as [OutputFormat, string][]
                ).map(([val, label]) => (
                  <button
                    key={val}
                    onClick={() => setFormat(val)}
                    className={`px-3 py-1.5 rounded text-sm font-medium transition-colors text-left ${
                      format === val
                        ? "bg-blue-600 text-white"
                        : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Max dimension */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Max Dimension (px)
              </label>
              <input
                type="number"
                min={0}
                max={10000}
                step={100}
                value={maxDimension || ""}
                onChange={(e) =>
                  setMaxDimension(Math.max(0, Number(e.target.value)))
                }
                placeholder="No limit"
                className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 font-mono text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-slate-500 mt-1">
                Scales down larger images, keeps aspect ratio
              </p>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {[0, 1920, 1280, 800].map((d) => (
                  <button
                    key={d}
                    onClick={() => setMaxDimension(d)}
                    className={`px-2 py-0.5 text-xs rounded transition-colors ${
                      maxDimension === d
                        ? "bg-blue-600 text-white"
                        : "bg-slate-700 text-slate-400 hover:bg-slate-600"
                    }`}
                  >
                    {d === 0 ? "None" : `${d}px`}
                  </button>
                ))}
              </div>
            </div>

            {/* Summary */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Summary
              </label>
              <div className="text-sm space-y-1">
                <p className="text-slate-400">
                  {images.length} image{images.length !== 1 && "s"} &middot;{" "}
                  {doneCount} compressed
                </p>
                {totalOriginal > 0 && (
                  <p className="text-slate-400">
                    Original: {formatBytes(totalOriginal)}
                  </p>
                )}
                {totalCompressed > 0 && (
                  <p className="text-green-400 font-medium">
                    Compressed: {formatBytes(totalCompressed)} ({totalSavings}%
                    saved)
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* File list + Before/After preview */}
        {images.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* File list */}
            <div className="lg:col-span-1 space-y-2 max-h-[520px] overflow-y-auto pr-1">
              {images.map((img) => {
                const savings = calcSavings(img.originalSize, img.compressedSize);
                return (
                  <div
                    key={img.id}
                    onClick={() => setSelectedId(img.id)}
                    className={`bg-slate-800 border rounded-lg p-3 cursor-pointer transition-colors flex items-center gap-3 ${
                      selectedId === img.id
                        ? "border-blue-500 bg-slate-800/80"
                        : "border-slate-700 hover:border-slate-500"
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={img.originalUrl}
                      alt={img.name}
                      className="w-12 h-12 rounded object-cover flex-shrink-0 bg-slate-700"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate">{img.name}</p>
                      <p className="text-xs text-slate-400">
                        {formatBytes(img.originalSize)}
                        {img.status === "done" && (
                          <>
                            {" "}
                            &rarr; {formatBytes(img.compressedSize)}{" "}
                            <span
                              className={
                                savings > 0
                                  ? "text-green-400"
                                  : savings < 0
                                  ? "text-red-400"
                                  : "text-slate-400"
                              }
                            >
                              ({savings > 0 ? "-" : savings < 0 ? "+" : ""}
                              {Math.abs(savings)}%)
                            </span>
                          </>
                        )}
                        {img.status === "compressing" && (
                          <span className="text-blue-400"> Compressing...</span>
                        )}
                      </p>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      {img.status === "done" && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            downloadOne(img);
                          }}
                          className="p-1.5 rounded hover:bg-slate-600 text-slate-400 hover:text-white transition-colors"
                          title="Download"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                            />
                          </svg>
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeImage(img.id);
                        }}
                        className="p-1.5 rounded hover:bg-slate-600 text-slate-400 hover:text-red-400 transition-colors"
                        title="Remove"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Before/After preview */}
            <div className="lg:col-span-2">
              {selectedImage && selectedImage.status === "done" ? (
                <div className="space-y-4">
                  {/* Side-by-side */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-slate-300">
                          Original
                        </span>
                        <span className="text-xs text-slate-500">
                          {formatBytes(selectedImage.originalSize)}
                          {selectedImage.width > 0 &&
                            ` · ${selectedImage.width}x${selectedImage.height}`}
                        </span>
                      </div>
                      <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
                        <div className="relative" style={checkerBg}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={selectedImage.originalUrl}
                            alt="Original"
                            className="w-full max-h-72 object-contain"
                          />
                        </div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-slate-300">
                          Compressed
                        </span>
                        <span className="text-xs text-slate-500">
                          {formatBytes(selectedImage.compressedSize)}
                          {selectedImage.outputWidth > 0 &&
                            ` · ${selectedImage.outputWidth}x${selectedImage.outputHeight}`}
                        </span>
                      </div>
                      <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
                        <div className="relative" style={checkerBg}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={selectedImage.compressedUrl!}
                            alt="Compressed"
                            className="w-full max-h-72 object-contain"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                      <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wider">
                          Original
                        </p>
                        <p className="text-lg font-semibold text-white">
                          {formatBytes(selectedImage.originalSize)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wider">
                          Compressed
                        </p>
                        <p className="text-lg font-semibold text-green-400">
                          {formatBytes(selectedImage.compressedSize)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wider">
                          Saved
                        </p>
                        <p className="text-lg font-semibold text-blue-400">
                          {formatBytes(
                            selectedImage.originalSize -
                              selectedImage.compressedSize
                          )}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wider">
                          Ratio
                        </p>
                        <p className="text-lg font-semibold text-amber-400">
                          {calcSavings(
                            selectedImage.originalSize,
                            selectedImage.compressedSize
                          )}
                          %
                        </p>
                      </div>
                    </div>
                    {calcSavings(
                      selectedImage.originalSize,
                      selectedImage.compressedSize
                    ) > 0 && (
                      <div className="mt-3">
                        <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-green-500 rounded-full transition-all duration-500"
                            style={{
                              width: `${
                                100 -
                                calcSavings(
                                  selectedImage.originalSize,
                                  selectedImage.compressedSize
                                )
                              }%`,
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : selectedImage ? (
                <div className="bg-slate-800 border border-slate-700 rounded-lg min-h-[300px] flex items-center justify-center">
                  <p className="text-slate-500 text-sm">
                    {selectedImage.status === "compressing"
                      ? "Compressing..."
                      : selectedImage.status === "error"
                      ? "Compression failed"
                      : "Processing..."}
                  </p>
                </div>
              ) : (
                <div className="bg-slate-800 border border-slate-700 rounded-lg min-h-[300px] flex items-center justify-center">
                  <p className="text-slate-500 text-sm">
                    Select an image to see before/after preview
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Batch download + clear */}
        {images.length > 0 && (
          <div className="flex flex-wrap items-center gap-3 mb-6">
            {allDone && (
              <button
                onClick={downloadAllZip}
                className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-semibold transition-colors"
              >
                {doneCount > 1
                  ? `Download All as ZIP (${doneCount} files · ${formatBytes(totalCompressed)})`
                  : `Download Compressed (${formatBytes(totalCompressed)})`}
              </button>
            )}
            <button
              onClick={clearAll}
              className="px-4 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Clear All
            </button>
            {allDone && totalSavings > 0 && (
              <span className="text-sm text-green-400 font-medium">
                Total: {formatBytes(totalOriginal)} &rarr;{" "}
                {formatBytes(totalCompressed)} ({totalSavings}% saved)
              </span>
            )}
          </div>
        )}

        {/* Hidden canvas */}
        <canvas ref={canvasRef} className="hidden" />

        {/* How it works */}
        <div className="bg-slate-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">
            How Image Compression Works
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              {
                step: "1",
                title: "Upload Images",
                desc: "Drag and drop or click to upload PNG, JPG, or WebP images. Multiple files supported for batch processing.",
              },
              {
                step: "2",
                title: "Adjust Settings",
                desc: "Set quality level, choose output format (keep original, WebP, or JPG), and optionally set a max dimension to resize.",
              },
              {
                step: "3",
                title: "Preview & Download",
                desc: "Compare before/after previews, check compression ratios, then download individually or all as a ZIP file.",
              },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-10 h-10 rounded-full bg-blue-600/20 text-blue-400 font-bold text-lg flex items-center justify-center mx-auto mb-3">
                  {item.step}
                </div>
                <h3 className="text-sm font-semibold text-white mb-1">
                  {item.title}
                </h3>
                <p className="text-xs text-slate-400">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Format comparison table */}
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
                  <th className="text-left py-2 text-slate-400 font-medium">
                    Typical Savings
                  </th>
                </tr>
              </thead>
              <tbody className="text-slate-300">
                {[
                  [
                    "WebP",
                    "Web images, modern browsers",
                    "Lossy or lossless",
                    "Yes",
                    "25-35% better than JPG",
                  ],
                  [
                    "JPEG",
                    "Photos, complex images",
                    "Lossy — excellent",
                    "No",
                    "60-80% from original",
                  ],
                  [
                    "PNG",
                    "Graphics, logos, screenshots",
                    "Lossless",
                    "Yes",
                    "Varies (convert to WebP for more)",
                  ],
                ].map((row) => (
                  <tr key={row[0]} className="border-b border-slate-700/50">
                    <td className="py-2 font-medium text-white">{row[0]}</td>
                    <td className="py-2">{row[1]}</td>
                    <td className="py-2">{row[2]}</td>
                    <td className="py-2">{row[3]}</td>
                    <td className="py-2">{row[4]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <RelatedTools currentSlug="image-compressor" />

        {/* FAQ */}
        <section className="mt-12 border-t border-slate-700 pt-10">
          <h2 className="text-2xl font-bold mb-6">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            {[
              {
                q: "Is my image uploaded to a server?",
                a: "No. All compression happens entirely in your browser using the HTML5 Canvas API. Your images never leave your device — no data is sent to any server. This makes it completely private and works offline too.",
              },
              {
                q: "How many images can I compress at once?",
                a: "You can batch compress up to 20 images at once. Simply drag and drop multiple files or use the file picker. All images are compressed with the same quality settings and can be downloaded individually or as a ZIP file.",
              },
              {
                q: "What quality setting should I use?",
                a: "For photos and social media, 75-85% offers the best balance of quality and file size — typically 60-80% size reduction with minimal visible quality loss. For print or professional use, stay above 90%. For thumbnails or email, 50-70% is usually fine.",
              },
              {
                q: "Which format should I choose?",
                a: 'Use "Keep Original" to preserve the source format. JPEG is best for photographs and complex images (no transparency). WebP offers 25-35% better compression than JPEG with transparency support — ideal for web use. All modern browsers support WebP.',
              },
              {
                q: "Why is my PNG file getting larger after compression?",
                a: "PNG is a lossless format — the browser's Canvas API re-encodes it without guaranteed size reduction. For photos, switch to JPEG or WebP for significant compression. PNG works best for graphics with flat colors, text, and screenshots.",
              },
              {
                q: "What does the max dimension option do?",
                a: "It resizes images so neither width nor height exceeds the value you set, while preserving the aspect ratio. Useful for downsizing camera photos (e.g., 6000px) to web-friendly sizes (e.g., 1920px). Set to 0 or leave empty for no resizing.",
              },
              {
                q: "Can I compare the original and compressed images?",
                a: "Yes. Click any image in the list to see a side-by-side before/after preview. You'll see both versions with file sizes, dimensions, bytes saved, and compression percentage clearly displayed.",
              },
            ].map((item) => (
              <div key={item.q}>
                <h3 className="text-lg font-semibold text-white mb-2">
                  {item.q}
                </h3>
                <p className="text-slate-400">{item.a}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
