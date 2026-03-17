"use client";

import { useState, useCallback, useRef } from "react";
import JsonLd from "@/components/JsonLd";
import RelatedTools from "@/components/RelatedTools";
import {
  generateFAQSchema,
  generateWebAppSchema,
  generateBreadcrumbSchema,
} from "@/lib/jsonld";

interface ImageInfo {
  width: number;
  height: number;
  name: string;
  size: number;
  type: string;
  url: string;
}

type OutputFormat = "jpeg" | "webp" | "png";

const formatBytes = (bytes: number): string => {
  if (bytes === 0) return "0 B";
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(2) + " MB";
};

const compressionPresets: { label: string; quality: number; desc: string }[] = [
  { label: "Maximum", quality: 95, desc: "Minimal compression, best quality" },
  { label: "High", quality: 85, desc: "Recommended — good balance" },
  { label: "Medium", quality: 70, desc: "Noticeable compression, smaller files" },
  { label: "Low", quality: 50, desc: "Heavy compression, much smaller" },
  { label: "Minimum", quality: 20, desc: "Maximum compression, lowest quality" },
];

export default function ImageCompressorPage() {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [imageInfo, setImageInfo] = useState<ImageInfo | null>(null);
  const [format, setFormat] = useState<OutputFormat>("jpeg");
  const [quality, setQuality] = useState(85);
  const [maxWidth, setMaxWidth] = useState(0); // 0 = no resize
  const [compressedUrl, setCompressedUrl] = useState<string | null>(null);
  const [compressedSize, setCompressedSize] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) return;

    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      setImage(img);
      setImageInfo({
        width: img.naturalWidth,
        height: img.naturalHeight,
        name: file.name,
        size: file.size,
        type: file.type,
        url,
      });
      setMaxWidth(0);
      setCompressedUrl(null);
      setCompressedSize(0);
    };
    img.src = url;
  }, []);

  const handleCompress = useCallback(() => {
    if (!image || !canvasRef.current) return;
    setIsProcessing(true);

    // Use requestAnimationFrame to allow UI update
    requestAnimationFrame(() => {
      const canvas = canvasRef.current!;
      const ctx = canvas.getContext("2d")!;

      let targetW = image.naturalWidth;
      let targetH = image.naturalHeight;

      // Apply max width constraint if set
      if (maxWidth > 0 && targetW > maxWidth) {
        const ratio = maxWidth / targetW;
        targetW = maxWidth;
        targetH = Math.round(targetH * ratio);
      }

      canvas.width = targetW;
      canvas.height = targetH;

      // Use high-quality rendering
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(image, 0, 0, targetW, targetH);

      const mimeType = `image/${format}`;
      const qualityVal = format === "png" ? undefined : quality / 100;

      canvas.toBlob(
        (blob) => {
          if (blob) {
            if (compressedUrl) URL.revokeObjectURL(compressedUrl);
            const url = URL.createObjectURL(blob);
            setCompressedUrl(url);
            setCompressedSize(blob.size);
          }
          setIsProcessing(false);
        },
        mimeType,
        qualityVal
      );
    });
  }, [image, format, quality, maxWidth, compressedUrl]);

  const handleDownload = useCallback(() => {
    if (!compressedUrl || !imageInfo) return;
    const ext = format === "jpeg" ? "jpg" : format;
    const baseName = imageInfo.name.replace(/\.[^.]+$/, "");
    const a = document.createElement("a");
    a.href = compressedUrl;
    a.download = `${baseName}-compressed.${ext}`;
    a.click();
  }, [compressedUrl, imageInfo, format]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const savings = imageInfo && compressedSize > 0
    ? Math.round((1 - compressedSize / imageInfo.size) * 100)
    : 0;

  const maxWidthOptions = [
    { label: "Original", value: 0 },
    { label: "3840px (4K)", value: 3840 },
    { label: "1920px (Full HD)", value: 1920 },
    { label: "1280px (HD)", value: 1280 },
    { label: "1024px", value: 1024 },
    { label: "800px", value: 800 },
    { label: "640px", value: 640 },
  ];

  return (
    <main className="min-h-screen bg-slate-900 text-white">
      <title>Image Compressor - Free Online Tool | DevTools Hub</title>
      <meta
        name="description"
        content="Compress JPEG, PNG, and WebP images in your browser with adjustable quality. Free, private, no upload required."
      />
      <JsonLd
        data={[
          generateWebAppSchema({
            slug: "image-compressor",
            name: "Image Compressor",
            description: "Compress JPEG, PNG, and WebP images in your browser with adjustable quality",
            category: "design",
          }),
          generateBreadcrumbSchema({
            slug: "image-compressor",
            name: "Image Compressor",
            description: "Compress JPEG, PNG, and WebP images in your browser with adjustable quality",
            category: "design",
          }),
          generateFAQSchema([
            { question: "Is my image uploaded to a server?", answer: "No. All compression happens entirely in your browser using the HTML5 Canvas API. Your images never leave your device \u2014 no data is sent to any server. This makes it completely private and works offline too." },
            { question: "What quality setting should I use?", answer: "For photos and social media, 75-85% offers the best balance of quality and file size \u2014 typically 60-80% size reduction with minimal visible quality loss. For print or professional use, stay above 90%. For thumbnails or email, 50-70% is usually fine." },
            { question: "Which format should I choose?", answer: "JPEG is best for photographs and complex images (no transparency). WebP offers 25-35% better compression than JPEG with transparency support \u2014 ideal for web use if your target browsers support it (all modern browsers do). PNG is best when you need lossless quality or transparency in graphics/logos." },
            { question: "Why is my PNG file getting larger after 'compression'?", answer: "PNG is a lossless format \u2014 the browser's Canvas API re-encodes it without guaranteed size reduction. For photos, switch to JPEG or WebP for significant compression. PNG works best for graphics with flat colors, text, and screenshots." },
            { question: "Can I compress multiple images at once?", answer: "Currently this tool handles one image at a time for the best quality control. Upload a new image after downloading the compressed version. For bulk compression, consider using the same tool repeatedly \u2014 each compression takes just seconds." },
          ]),
        ]}
      />
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-8">
          <a href="/" className="text-blue-400 hover:text-blue-300 text-sm mb-4 inline-block">
            ← Back to all tools
          </a>
          <h1 className="text-3xl font-bold mb-2">Image Compressor</h1>
          <p className="text-slate-400">
            Compress images to reduce file size while maintaining quality. Supports JPEG, WebP, and PNG output. All processing happens in your browser — no uploads to any server.
          </p>
        </div>

        {/* Upload Area */}
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
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
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
            }}
            className="hidden"
          />
          {imageInfo ? (
            <div className="space-y-2">
              <div className="text-lg font-medium">{imageInfo.name}</div>
              <div className="text-sm text-slate-400">
                {imageInfo.width} x {imageInfo.height} · {formatBytes(imageInfo.size)} · {imageInfo.type}
              </div>
              <div className="text-xs text-slate-500">Click or drop to replace</div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="text-4xl">🖼️</div>
              <div className="text-lg font-medium">Drop an image here or click to upload</div>
              <div className="text-sm text-slate-400">Supports JPEG, PNG, WebP, GIF, BMP, SVG</div>
            </div>
          )}
        </div>

        {/* Controls */}
        {imageInfo && (
          <div className="bg-slate-800 rounded-lg p-6 mb-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              {/* Output Format */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Output Format
                </label>
                <select
                  value={format}
                  onChange={(e) => { setFormat(e.target.value as OutputFormat); setCompressedUrl(null); }}
                  className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="jpeg">JPEG — Best compression for photos</option>
                  <option value="webp">WebP — Modern, best size/quality ratio</option>
                  <option value="png">PNG — Lossless, larger files</option>
                </select>
              </div>

              {/* Max Width */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Max Width (optional resize)
                </label>
                <select
                  value={maxWidth}
                  onChange={(e) => { setMaxWidth(parseInt(e.target.value, 10)); setCompressedUrl(null); }}
                  className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {maxWidthOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                      {opt.value > 0 && imageInfo.width > opt.value
                        ? ` (from ${imageInfo.width}px)`
                        : opt.value > 0 && imageInfo.width <= opt.value
                        ? " (no change needed)"
                        : ""}
                    </option>
                  ))}
                </select>
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
                    {quality >= 90 ? "Maximum" : quality >= 75 ? "High" : quality >= 55 ? "Medium" : quality >= 30 ? "Low" : "Minimum"}
                  </span>
                </div>
                <input
                  type="range"
                  min={5}
                  max={100}
                  value={quality}
                  onChange={(e) => { setQuality(parseInt(e.target.value, 10)); setCompressedUrl(null); }}
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
                    onClick={() => { setQuality(preset.quality); setCompressedUrl(null); }}
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

            {/* Compress Button */}
            <button
              onClick={handleCompress}
              disabled={isProcessing}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 text-white font-medium py-3 px-6 rounded transition-colors"
            >
              {isProcessing ? "Compressing..." : "Compress Image"}
            </button>
          </div>
        )}

        {/* Results */}
        {compressedUrl && imageInfo && (
          <div className="bg-slate-800 rounded-lg p-6 mb-6">
            <h2 className="text-sm font-medium text-slate-400 mb-3">Compression Results</h2>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="bg-slate-900 rounded p-3 text-center">
                <div className="text-xs text-slate-400 mb-1">Original</div>
                <div className="text-lg font-mono font-medium">{formatBytes(imageInfo.size)}</div>
              </div>
              <div className="bg-slate-900 rounded p-3 text-center">
                <div className="text-xs text-slate-400 mb-1">Compressed</div>
                <div className="text-lg font-mono font-medium">{formatBytes(compressedSize)}</div>
              </div>
              <div className="bg-slate-900 rounded p-3 text-center">
                <div className="text-xs text-slate-400 mb-1">Savings</div>
                <div className={`text-lg font-mono font-medium ${savings > 0 ? "text-green-400" : savings < 0 ? "text-red-400" : "text-slate-300"}`}>
                  {savings > 0 ? `-${savings}%` : savings < 0 ? `+${Math.abs(savings)}%` : "0%"}
                </div>
              </div>
            </div>

            {/* Size bar */}
            {savings > 0 && (
              <div className="mb-4">
                <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500 rounded-full transition-all duration-500"
                    style={{ width: `${100 - savings}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-slate-500 mt-1">
                  <span>Compressed ({100 - savings}% of original)</span>
                  <span>{formatBytes(imageInfo.size - compressedSize)} saved</span>
                </div>
              </div>
            )}

            {/* Preview */}
            <div className="mb-4">
              <img
                src={compressedUrl}
                alt="Compressed preview"
                className="max-w-full max-h-64 mx-auto rounded border border-slate-700"
              />
            </div>

            {/* Download */}
            <button
              onClick={handleDownload}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-6 rounded transition-colors"
            >
              Download Compressed Image ({formatBytes(compressedSize)})
            </button>
          </div>
        )}

        {/* Hidden canvas */}
        <canvas ref={canvasRef} className="hidden" />

        <RelatedTools currentSlug="image-compressor" />

        {/* Compression Guide */}
        <div className="bg-slate-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Format Comparison</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left py-2 text-slate-400 font-medium">Format</th>
                  <th className="text-left py-2 text-slate-400 font-medium">Best For</th>
                  <th className="text-left py-2 text-slate-400 font-medium">Compression</th>
                  <th className="text-left py-2 text-slate-400 font-medium">Transparency</th>
                </tr>
              </thead>
              <tbody className="text-slate-300">
                {[
                  ["JPEG", "Photos, complex images", "Lossy — excellent size reduction", "No"],
                  ["WebP", "Web images, modern browsers", "Lossy or lossless — best ratio", "Yes"],
                  ["PNG", "Graphics, screenshots, logos", "Lossless — larger files", "Yes"],
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
          <h2 className="text-xl font-semibold mb-4">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {[
              {
                q: "Is my image uploaded to a server?",
                a: "No. All compression happens entirely in your browser using the HTML5 Canvas API. Your images never leave your device — no data is sent to any server. This makes it completely private and works offline too."
              },
              {
                q: "What quality setting should I use?",
                a: "For photos and social media, 75-85% offers the best balance of quality and file size — typically 60-80% size reduction with minimal visible quality loss. For print or professional use, stay above 90%. For thumbnails or email, 50-70% is usually fine."
              },
              {
                q: "Which format should I choose?",
                a: "JPEG is best for photographs and complex images (no transparency). WebP offers 25-35% better compression than JPEG with transparency support — ideal for web use if your target browsers support it (all modern browsers do). PNG is best when you need lossless quality or transparency in graphics/logos."
              },
              {
                q: "Why is my PNG file getting larger after 'compression'?",
                a: "PNG is a lossless format — the browser's Canvas API re-encodes it without guaranteed size reduction. For photos, switch to JPEG or WebP for significant compression. PNG works best for graphics with flat colors, text, and screenshots."
              },
              {
                q: "Can I compress multiple images at once?",
                a: "Currently this tool handles one image at a time for the best quality control. Upload a new image after downloading the compressed version. For bulk compression, consider using the same tool repeatedly — each compression takes just seconds."
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
