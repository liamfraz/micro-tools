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

type OutputFormat = "png" | "jpeg" | "webp" | "bmp" | "gif";

interface ImageInfo {
  width: number;
  height: number;
  name: string;
  size: number;
  type: string;
}

const FORMAT_OPTIONS: { value: OutputFormat; label: string; ext: string; desc: string; lossy: boolean }[] = [
  { value: "png", label: "PNG", ext: "png", desc: "Lossless, supports transparency", lossy: false },
  { value: "jpeg", label: "JPEG", ext: "jpg", desc: "Best for photos, small files", lossy: true },
  { value: "webp", label: "WebP", ext: "webp", desc: "Modern format, best compression", lossy: true },
  { value: "bmp", label: "BMP", ext: "bmp", desc: "Uncompressed bitmap", lossy: false },
  { value: "gif", label: "GIF", ext: "gif", desc: "Limited to 256 colors", lossy: false },
];

const QUICK_CONVERSIONS = [
  { from: "PNG", to: "jpeg" as OutputFormat, label: "PNG → JPG" },
  { from: "JPG", to: "png" as OutputFormat, label: "JPG → PNG" },
  { from: "WebP", to: "png" as OutputFormat, label: "WebP → PNG" },
  { from: "WebP", to: "jpeg" as OutputFormat, label: "WebP → JPG" },
  { from: "PNG", to: "webp" as OutputFormat, label: "PNG → WebP" },
  { from: "JPG", to: "webp" as OutputFormat, label: "JPG → WebP" },
  { from: "BMP", to: "png" as OutputFormat, label: "BMP → PNG" },
  { from: "GIF", to: "png" as OutputFormat, label: "GIF → PNG" },
];

const formatBytes = (bytes: number): string => {
  if (bytes === 0) return "0 B";
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(2) + " MB";
};

export default function ImageFormatConverterPage() {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [imageInfo, setImageInfo] = useState<ImageInfo | null>(null);
  const [outputFormat, setOutputFormat] = useState<OutputFormat>("jpeg");
  const [quality, setQuality] = useState(90);
  const [bgColor, setBgColor] = useState("#ffffff");
  const [fillBackground, setFillBackground] = useState(true);
  const [convertedUrl, setConvertedUrl] = useState<string | null>(null);
  const [convertedSize, setConvertedSize] = useState(0);
  const [isConverting, setIsConverting] = useState(false);
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
      });
      setConvertedUrl(null);
      setConvertedSize(0);
      URL.revokeObjectURL(url);
    };
    img.src = url;
  }, []);

  const handleConvert = useCallback(() => {
    if (!image || !canvasRef.current) return;
    setIsConverting(true);

    requestAnimationFrame(() => {
      const canvas = canvasRef.current!;
      const ctx = canvas.getContext("2d")!;

      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;

      // Fill background for formats that don't support transparency
      const needsBg = (outputFormat === "jpeg" || outputFormat === "bmp" || outputFormat === "gif") && fillBackground;
      if (needsBg) {
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(image, 0, 0);

      const mimeType = outputFormat === "jpeg" ? "image/jpeg"
        : outputFormat === "webp" ? "image/webp"
        : outputFormat === "bmp" ? "image/bmp"
        : outputFormat === "gif" ? "image/gif"
        : "image/png";

      const qualityVal = (outputFormat === "jpeg" || outputFormat === "webp") ? quality / 100 : undefined;

      canvas.toBlob(
        (blob) => {
          if (blob) {
            if (convertedUrl) URL.revokeObjectURL(convertedUrl);
            const url = URL.createObjectURL(blob);
            setConvertedUrl(url);
            setConvertedSize(blob.size);
          }
          setIsConverting(false);
        },
        mimeType,
        qualityVal
      );
    });
  }, [image, outputFormat, quality, bgColor, fillBackground, convertedUrl]);

  const handleDownload = useCallback(() => {
    if (!convertedUrl || !imageInfo) return;
    const fmt = FORMAT_OPTIONS.find((f) => f.value === outputFormat);
    const ext = fmt ? fmt.ext : outputFormat;
    const baseName = imageInfo.name.replace(/\.[^.]+$/, "");
    const a = document.createElement("a");
    a.href = convertedUrl;
    a.download = `${baseName}.${ext}`;
    a.click();
  }, [convertedUrl, imageInfo, outputFormat]);

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

  const sizeDiff = imageInfo && convertedSize > 0
    ? Math.round((1 - convertedSize / imageInfo.size) * 100)
    : 0;

  const inputFormatLabel = imageInfo
    ? imageInfo.type.replace("image/", "").toUpperCase().replace("JPEG", "JPG")
    : "";

  const noTransparency = outputFormat === "jpeg" || outputFormat === "bmp" || outputFormat === "gif";

  return (
    <main className="min-h-screen bg-slate-900 text-white">
      <title>Image Format Converter — PNG to JPG, WebP to PNG & More | Micro Tools</title>
      <meta name="description" content="Convert images between PNG, JPG, WebP, BMP, and GIF formats instantly in your browser. Free, private, no upload required." />
      <JsonLd
        data={[
          generateWebAppSchema({
            slug: "image-format-converter",
            name: "Image Format Converter",
            description: "Convert images between JPEG, PNG, WebP, and GIF formats instantly in your browser",
            category: "image",
          }),
          generateBreadcrumbSchema({
            slug: "image-format-converter",
            name: "Image Format Converter",
            description: "Convert images between JPEG, PNG, WebP, and GIF formats instantly in your browser",
            category: "image",
          }),
          generateFAQSchema([
            { question: "How do I convert PNG to JPG?", answer: "Upload your PNG image by dragging it onto the upload area or clicking to browse. Select \"JPEG\" as the output format, adjust the quality slider if desired, then click Convert. The tool handles the conversion entirely in your browser \u2014 no files are uploaded to any server." },
            { question: "What happens to transparency when converting to JPEG?", answer: "JPEG does not support transparency. When converting from PNG or WebP with transparent areas, those areas are filled with a background color (white by default). You can change the background color or disable the fill using the options below the format selector." },
            { question: "Is WebP better than JPEG and PNG?", answer: "WebP offers 25-35% better compression than JPEG for photos at equivalent visual quality, and supports both lossy and lossless compression plus transparency. The main trade-off is that some older software doesn't support WebP, though all modern browsers do. For web use, WebP is generally the best choice." },
            { question: "Are my images uploaded to a server?", answer: "No. All image conversion happens entirely in your browser using the HTML5 Canvas API. Your images never leave your device, making this tool completely private. It even works offline once the page is loaded." },
            { question: "Will converting formats reduce image quality?", answer: "Converting to a lossless format (PNG) preserves full quality. Converting to lossy formats (JPEG, WebP) applies compression controlled by the quality slider \u2014 higher values preserve more detail. Converting between lossy formats (e.g., JPEG to WebP) may introduce slight additional quality loss, so it's best to start from the highest-quality source available." },
          ]),
        ]}
      />

      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-8">
          <a href="/" className="text-blue-400 hover:text-blue-300 text-sm mb-4 inline-block">
            ← Back to all tools
          </a>
          <h1 className="text-3xl font-bold mb-2">Image Format Converter</h1>
          <p className="text-slate-400">
            Convert images between PNG, JPG, WebP, BMP, and GIF formats instantly. All processing happens in your browser — your images never leave your device. Perfect for converting PNG to JPG, WebP to PNG, and more.
          </p>
        </div>

        {/* Quick Conversion Buttons */}
        <div className="bg-slate-800 rounded-lg p-4 mb-6">
          <div className="text-xs text-slate-400 mb-2 font-medium">Popular Conversions</div>
          <div className="flex flex-wrap gap-2">
            {QUICK_CONVERSIONS.map((conv) => (
              <button
                key={conv.label}
                onClick={() => { setOutputFormat(conv.to); setConvertedUrl(null); }}
                className={`px-3 py-1.5 text-xs rounded border transition-colors ${
                  outputFormat === conv.to
                    ? "bg-blue-600 border-blue-500 text-white"
                    : "bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600"
                }`}
              >
                {conv.label}
              </button>
            ))}
          </div>
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
                {imageInfo.width} x {imageInfo.height} · {formatBytes(imageInfo.size)} · {inputFormatLabel}
              </div>
              <div className="text-xs text-slate-500">Click or drop to replace</div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="text-4xl">🔄</div>
              <div className="text-lg font-medium">Drop an image here or click to upload</div>
              <div className="text-sm text-slate-400">Supports PNG, JPEG, WebP, GIF, BMP, SVG, ICO, TIFF</div>
            </div>
          )}
        </div>

        {/* Conversion Controls */}
        {imageInfo && (
          <div className="bg-slate-800 rounded-lg p-6 mb-6">
            {/* Format Selector */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Convert {inputFormatLabel} to:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {FORMAT_OPTIONS.map((fmt) => (
                  <button
                    key={fmt.value}
                    onClick={() => { setOutputFormat(fmt.value); setConvertedUrl(null); }}
                    className={`p-3 rounded border text-center transition-colors ${
                      outputFormat === fmt.value
                        ? "bg-blue-600 border-blue-500 text-white"
                        : "bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600"
                    }`}
                  >
                    <div className="font-medium text-sm">{fmt.label}</div>
                    <div className="text-xs mt-0.5 opacity-70">{fmt.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Quality Slider (lossy formats only) */}
            {(outputFormat === "jpeg" || outputFormat === "webp") && (
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
                  onChange={(e) => { setQuality(parseInt(e.target.value, 10)); setConvertedUrl(null); }}
                  className="w-full accent-blue-600"
                />
                <div className="flex justify-between text-xs text-slate-500 mt-1">
                  <span>Smaller file</span>
                  <span>Better quality</span>
                </div>
              </div>
            )}

            {/* Background Color (for formats without transparency) */}
            {noTransparency && (
              <div className="mb-4 p-3 bg-slate-700/50 rounded border border-slate-600">
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={fillBackground}
                      onChange={(e) => { setFillBackground(e.target.checked); setConvertedUrl(null); }}
                      className="accent-blue-600 w-4 h-4"
                    />
                    <span className="text-sm text-slate-300">Fill transparent areas with background color</span>
                  </label>
                  {fillBackground && (
                    <div className="flex items-center gap-2 ml-auto">
                      <input
                        type="color"
                        value={bgColor}
                        onChange={(e) => { setBgColor(e.target.value); setConvertedUrl(null); }}
                        className="w-8 h-8 rounded border border-slate-500 cursor-pointer bg-transparent"
                      />
                      <span className="text-xs text-slate-400 font-mono">{bgColor}</span>
                    </div>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  {outputFormat.toUpperCase()} does not support transparency. Transparent pixels will be filled with the selected color.
                </p>
              </div>
            )}

            {/* Convert Button */}
            <button
              onClick={handleConvert}
              disabled={isConverting}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 text-white font-medium py-3 px-6 rounded transition-colors"
            >
              {isConverting ? "Converting..." : `Convert to ${FORMAT_OPTIONS.find((f) => f.value === outputFormat)?.label ?? outputFormat.toUpperCase()}`}
            </button>
          </div>
        )}

        {/* Results */}
        {convertedUrl && imageInfo && (
          <div className="bg-slate-800 rounded-lg p-6 mb-6">
            <h2 className="text-sm font-medium text-slate-400 mb-3">Conversion Result</h2>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="bg-slate-900 rounded p-3 text-center">
                <div className="text-xs text-slate-400 mb-1">Original ({inputFormatLabel})</div>
                <div className="text-lg font-mono font-medium">{formatBytes(imageInfo.size)}</div>
              </div>
              <div className="bg-slate-900 rounded p-3 text-center">
                <div className="text-xs text-slate-400 mb-1">Converted ({FORMAT_OPTIONS.find((f) => f.value === outputFormat)?.label})</div>
                <div className="text-lg font-mono font-medium">{formatBytes(convertedSize)}</div>
              </div>
              <div className="bg-slate-900 rounded p-3 text-center">
                <div className="text-xs text-slate-400 mb-1">Size Change</div>
                <div className={`text-lg font-mono font-medium ${sizeDiff > 0 ? "text-green-400" : sizeDiff < 0 ? "text-red-400" : "text-slate-300"}`}>
                  {sizeDiff > 0 ? `-${sizeDiff}%` : sizeDiff < 0 ? `+${Math.abs(sizeDiff)}%` : "0%"}
                </div>
              </div>
            </div>

            {/* Dimensions */}
            <div className="text-sm text-slate-400 mb-4 text-center">
              {imageInfo.width} x {imageInfo.height} pixels
            </div>

            {/* Preview */}
            <div className="mb-4 bg-slate-900 rounded p-2 flex items-center justify-center"
              style={{ backgroundImage: "repeating-conic-gradient(#374151 0% 25%, #1e293b 0% 50%)", backgroundSize: "16px 16px" }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={convertedUrl}
                alt="Converted preview"
                className="max-w-full max-h-64 rounded"
                loading="lazy"
              />
            </div>

            {/* Download */}
            <button
              onClick={handleDownload}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-6 rounded transition-colors"
            >
              Download {FORMAT_OPTIONS.find((f) => f.value === outputFormat)?.label} ({formatBytes(convertedSize)})
            </button>
          </div>
        )}

        {/* Hidden canvas */}
        <canvas ref={canvasRef} className="hidden" />

        <RelatedTools currentSlug="image-format-converter" />

        {/* Format Comparison Table */}
        <div className="bg-slate-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Image Format Comparison</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left py-2 text-slate-400 font-medium">Format</th>
                  <th className="text-left py-2 text-slate-400 font-medium">Compression</th>
                  <th className="text-left py-2 text-slate-400 font-medium">Transparency</th>
                  <th className="text-left py-2 text-slate-400 font-medium">Best For</th>
                  <th className="text-left py-2 text-slate-400 font-medium">Browser Support</th>
                </tr>
              </thead>
              <tbody className="text-slate-300">
                {[
                  ["PNG", "Lossless", "Yes (alpha)", "Screenshots, logos, graphics", "Universal"],
                  ["JPEG", "Lossy", "No", "Photos, complex images", "Universal"],
                  ["WebP", "Both", "Yes (alpha)", "Web images, best size/quality", "All modern"],
                  ["BMP", "None", "No", "Raw bitmap, Windows apps", "Universal"],
                  ["GIF", "Lossless (LZW)", "Yes (1-bit)", "Simple animations, icons", "Universal"],
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

        {/* FAQ */}
        <div className="bg-slate-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {[
              {
                q: "How do I convert PNG to JPG?",
                a: "Upload your PNG image by dragging it onto the upload area or clicking to browse. Select \"JPEG\" as the output format, adjust the quality slider if desired, then click Convert. The tool handles the conversion entirely in your browser — no files are uploaded to any server."
              },
              {
                q: "What happens to transparency when converting to JPEG?",
                a: "JPEG does not support transparency. When converting from PNG or WebP with transparent areas, those areas are filled with a background color (white by default). You can change the background color or disable the fill using the options below the format selector."
              },
              {
                q: "Is WebP better than JPEG and PNG?",
                a: "WebP offers 25-35% better compression than JPEG for photos at equivalent visual quality, and supports both lossy and lossless compression plus transparency. The main trade-off is that some older software doesn't support WebP, though all modern browsers do. For web use, WebP is generally the best choice."
              },
              {
                q: "Are my images uploaded to a server?",
                a: "No. All image conversion happens entirely in your browser using the HTML5 Canvas API. Your images never leave your device, making this tool completely private. It even works offline once the page is loaded."
              },
              {
                q: "Will converting formats reduce image quality?",
                a: "Converting to a lossless format (PNG) preserves full quality. Converting to lossy formats (JPEG, WebP) applies compression controlled by the quality slider — higher values preserve more detail. Converting between lossy formats (e.g., JPEG to WebP) may introduce slight additional quality loss, so it's best to start from the highest-quality source available."
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
