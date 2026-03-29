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

interface ImageInfo {
  width: number;
  height: number;
  name: string;
  size: number;
  type: string;
}

type OutputFormat = "png" | "jpeg" | "webp";

const PRESETS = [
  { label: "Profile Photo", w: 400, h: 400 },
  { label: "Thumbnail", w: 150, h: 150 },
  { label: "HD (1280x720)", w: 1280, h: 720 },
  { label: "Full HD (1920x1080)", w: 1920, h: 1080 },
  { label: "Instagram Post", w: 1080, h: 1080 },
  { label: "Instagram Story", w: 1080, h: 1920 },
  { label: "Twitter Header", w: 1500, h: 500 },
  { label: "Facebook Cover", w: 820, h: 312 },
  { label: "YouTube Thumbnail", w: 1280, h: 720 },
  { label: "Favicon (32x32)", w: 32, h: 32 },
];

export default function ImageResizerPage() {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [imageInfo, setImageInfo] = useState<ImageInfo | null>(null);
  const [targetWidth, setTargetWidth] = useState(800);
  const [targetHeight, setTargetHeight] = useState(600);
  const [lockAspect, setLockAspect] = useState(true);
  const [aspectRatio, setAspectRatio] = useState(4 / 3);
  const [format, setFormat] = useState<OutputFormat>("png");
  const [quality, setQuality] = useState(90);
  const [resizedUrl, setResizedUrl] = useState<string | null>(null);
  const [resizedSize, setResizedSize] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState(false);
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
      setTargetWidth(img.naturalWidth);
      setTargetHeight(img.naturalHeight);
      setAspectRatio(img.naturalWidth / img.naturalHeight);
      setResizedUrl(null);
    };
    img.src = url;
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const updateWidth = useCallback((w: number) => {
    setTargetWidth(w);
    if (lockAspect && aspectRatio > 0) {
      setTargetHeight(Math.round(w / aspectRatio));
    }
  }, [lockAspect, aspectRatio]);

  const updateHeight = useCallback((h: number) => {
    setTargetHeight(h);
    if (lockAspect && aspectRatio > 0) {
      setTargetWidth(Math.round(h * aspectRatio));
    }
  }, [lockAspect, aspectRatio]);

  const applyPreset = useCallback((w: number, h: number) => {
    setTargetWidth(w);
    setTargetHeight(h);
    setLockAspect(false);
  }, []);

  const scaleBy = useCallback((pct: number) => {
    if (!imageInfo) return;
    const w = Math.round(imageInfo.width * pct / 100);
    const h = Math.round(imageInfo.height * pct / 100);
    setTargetWidth(w);
    setTargetHeight(h);
    setLockAspect(true);
    setAspectRatio(imageInfo.width / imageInfo.height);
  }, [imageInfo]);

  const resize = useCallback(() => {
    if (!image || !canvasRef.current) return;
    setIsProcessing(true);

    const canvas = canvasRef.current;
    canvas.width = targetWidth;
    canvas.height = targetHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) { setIsProcessing(false); return; }

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(image, 0, 0, targetWidth, targetHeight);

    const mimeType = format === "jpeg" ? "image/jpeg" : format === "webp" ? "image/webp" : "image/png";
    const qualityVal = format === "png" ? undefined : quality / 100;

    canvas.toBlob(
      (blob) => {
        if (blob) {
          if (resizedUrl) URL.revokeObjectURL(resizedUrl);
          const url = URL.createObjectURL(blob);
          setResizedUrl(url);
          setResizedSize(blob.size);
        }
        setIsProcessing(false);
      },
      mimeType,
      qualityVal
    );
  }, [image, targetWidth, targetHeight, format, quality, resizedUrl]);

  const download = useCallback(() => {
    if (!resizedUrl || !imageInfo) return;
    const ext = format === "jpeg" ? "jpg" : format;
    const baseName = imageInfo.name.replace(/\.[^.]+$/, "");
    const a = document.createElement("a");
    a.href = resizedUrl;
    a.download = `${baseName}-${targetWidth}x${targetHeight}.${ext}`;
    a.click();
  }, [resizedUrl, imageInfo, format, targetWidth, targetHeight]);

  const formatBytes = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <>
      <title>Image Resizer - Free Online Tool | DevTools Hub</title>
      <meta
        name="description"
        content="Resize images online for free. Set custom dimensions, use social media presets, or scale by percentage. Supports PNG, JPEG, and WebP output. All processing in your browser."
      />
      <JsonLd
        data={[
          generateWebAppSchema({
            slug: "image-resizer",
            name: "Image Resizer",
            description: "Resize images by pixels or percentage while maintaining aspect ratio",
            category: "image",
          }),
          generateBreadcrumbSchema({
            slug: "image-resizer",
            name: "Image Resizer",
            description: "Resize images by pixels or percentage while maintaining aspect ratio",
            category: "image",
          }),
          generateFAQSchema([
            { question: "Is my image uploaded to a server?", answer: "No. All image processing happens entirely in your browser using the HTML5 Canvas API. Your image never leaves your device. You can verify this by using the tool with your internet disconnected." },
            { question: "Which output format should I choose?", answer: "PNG is best for images with transparency, screenshots, and graphics with sharp edges. JPEG is ideal for photographs and produces smaller files at the cost of some quality. WebP offers the best compression with good quality and is supported by all modern browsers." },
            { question: "What is the maximum image size?", answer: "There is no hard limit, but very large images (over 50MP) may cause your browser to slow down or run out of memory since all processing happens client-side. For best performance, the output dimensions should be under 10,000 x 10,000 pixels." },
            { question: "What do the social media presets include?", answer: "The presets include optimal dimensions for Instagram posts (1080x1080) and stories (1080x1920), Twitter/X headers (1500x500), Facebook covers (820x312), YouTube thumbnails (1280x720), and common web sizes like HD and Full HD. Presets unlock the aspect ratio so the image matches the target dimensions exactly." },
          ]),
        ]}
      />

      <div className="min-h-screen bg-slate-900 text-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <ToolBreadcrumb slug="image-resizer" />

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
              Image Resizer
            </h1>
            <p className="text-slate-400 max-w-2xl text-lg">
              Resize images to any dimension with custom sizes, social media
              presets, or percentage scaling. Export as PNG, JPEG, or WebP.
              Everything runs in your browser — no uploads to any server.
            </p>
          </div>

          {/* Upload Area */}
          {!image ? (
            <div
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-600 rounded-lg p-16 text-center cursor-pointer hover:border-blue-500 transition-colors mb-6"
            >
              <div className="text-slate-400">
                <p className="text-lg font-medium mb-2">Drop an image here or click to browse</p>
                <p className="text-sm">Supports PNG, JPEG, WebP, GIF, BMP, SVG</p>
              </div>
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
            </div>
          ) : (
            <>
              {/* Image Info */}
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 mb-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-slate-700 rounded overflow-hidden shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={image.src}
                        alt="Original"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{imageInfo?.name}</p>
                      <p className="text-xs text-slate-400">
                        {imageInfo?.width} x {imageInfo?.height} | {formatBytes(imageInfo?.size || 0)} | {imageInfo?.type}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setImage(null);
                      setImageInfo(null);
                      setResizedUrl(null);
                      if (fileInputRef.current) fileInputRef.current.value = "";
                    }}
                    className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded text-sm transition-colors"
                  >
                    Change Image
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                {/* Controls */}
                <div className="lg:col-span-1 space-y-4">
                  {/* Dimensions */}
                  <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
                    <h2 className="text-sm font-semibold text-white mb-3">Dimensions</h2>
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div>
                        <label className="text-xs text-slate-500">Width (px)</label>
                        <input
                          type="number"
                          min={1}
                          max={10000}
                          value={targetWidth}
                          onChange={(e) => updateWidth(Number(e.target.value) || 1)}
                          className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 font-mono text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-slate-500">Height (px)</label>
                        <input
                          type="number"
                          min={1}
                          max={10000}
                          value={targetHeight}
                          onChange={(e) => updateHeight(Number(e.target.value) || 1)}
                          className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 font-mono text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                    <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={lockAspect}
                        onChange={(e) => {
                          setLockAspect(e.target.checked);
                          if (e.target.checked && imageInfo) {
                            setAspectRatio(targetWidth / targetHeight);
                          }
                        }}
                        className="w-4 h-4 rounded bg-slate-700 border-slate-600 text-blue-500 focus:ring-blue-500"
                      />
                      Lock aspect ratio
                    </label>
                  </div>

                  {/* Scale */}
                  <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
                    <h2 className="text-sm font-semibold text-white mb-3">Scale by Percentage</h2>
                    <div className="flex flex-wrap gap-2">
                      {[25, 50, 75, 100, 150, 200].map((pct) => (
                        <button
                          key={pct}
                          onClick={() => scaleBy(pct)}
                          className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded text-xs font-medium transition-colors"
                        >
                          {pct}%
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Output Format */}
                  <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
                    <h2 className="text-sm font-semibold text-white mb-3">Output Format</h2>
                    <div className="flex gap-2 mb-3">
                      {(["png", "jpeg", "webp"] as OutputFormat[]).map((f) => (
                        <button
                          key={f}
                          onClick={() => setFormat(f)}
                          className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                            format === f
                              ? "bg-blue-600 text-white"
                              : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                          }`}
                        >
                          {f.toUpperCase()}
                        </button>
                      ))}
                    </div>
                    {format !== "png" && (
                      <div>
                        <div className="flex justify-between text-xs text-slate-500 mb-1">
                          <span>Quality</span>
                          <span>{quality}%</span>
                        </div>
                        <input
                          type="range"
                          min={10}
                          max={100}
                          value={quality}
                          onChange={(e) => setQuality(Number(e.target.value))}
                          className="w-full accent-blue-500"
                        />
                      </div>
                    )}
                  </div>

                  {/* Resize Button */}
                  <button
                    onClick={resize}
                    disabled={isProcessing}
                    className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                  >
                    {isProcessing ? "Processing..." : `Resize to ${targetWidth} x ${targetHeight}`}
                  </button>
                </div>

                {/* Preview + Presets */}
                <div className="lg:col-span-2 space-y-4">
                  {/* Presets */}
                  <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
                    <h2 className="text-sm font-semibold text-white mb-3">Size Presets</h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                      {PRESETS.map((preset) => (
                        <button
                          key={preset.label}
                          onClick={() => applyPreset(preset.w, preset.h)}
                          className="px-2 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded text-xs transition-colors text-center"
                        >
                          <span className="block font-medium">{preset.label}</span>
                          <span className="text-slate-400">{preset.w}x{preset.h}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Result */}
                  {resizedUrl && (
                    <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h2 className="text-sm font-semibold text-white">Resized Image</h2>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-slate-500">
                            {targetWidth} x {targetHeight} | {formatBytes(resizedSize)} | {format.toUpperCase()}
                          </span>
                          {imageInfo && resizedSize < imageInfo.size && (
                            <span className="text-xs text-green-400">
                              -{Math.round((1 - resizedSize / imageInfo.size) * 100)}% smaller
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="bg-slate-900 rounded-lg p-2 mb-3 flex items-center justify-center max-h-80 overflow-hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={resizedUrl}
                          alt="Resized"
                          className="max-w-full max-h-72 object-contain"
                          loading="lazy"
                        />
                      </div>
                      <button
                        onClick={download}
                        className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
                      >
                        Download Resized Image
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Hidden canvas for processing */}
          <canvas ref={canvasRef} className="hidden" />

          <RelatedTools currentSlug="image-resizer" />

          {/* FAQ Section */}
          <section className="mt-16 border-t border-slate-700 pt-10">
            <h2 className="text-2xl font-bold text-white mb-6">
              Frequently Asked Questions
            </h2>

            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Is my image uploaded to a server?
                </h3>
                <p className="text-slate-400">
                  No. All image processing happens entirely in your browser using
                  the HTML5 Canvas API. Your image never leaves your device. You
                  can verify this by using the tool with your internet disconnected.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Which output format should I choose?
                </h3>
                <p className="text-slate-400">
                  <strong>PNG</strong> is best for images with transparency,
                  screenshots, and graphics with sharp edges.{" "}
                  <strong>JPEG</strong> is ideal for photographs and produces
                  smaller files at the cost of some quality.{" "}
                  <strong>WebP</strong> offers the best compression with good
                  quality and is supported by all modern browsers.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  What is the maximum image size?
                </h3>
                <p className="text-slate-400">
                  There is no hard limit, but very large images (over 50MP) may
                  cause your browser to slow down or run out of memory since all
                  processing happens client-side. For best performance, the
                  output dimensions should be under 10,000 x 10,000 pixels.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  What do the social media presets include?
                </h3>
                <p className="text-slate-400">
                  The presets include optimal dimensions for Instagram posts
                  (1080x1080) and stories (1080x1920), Twitter/X headers
                  (1500x500), Facebook covers (820x312), YouTube thumbnails
                  (1280x720), and common web sizes like HD and Full HD. Presets
                  unlock the aspect ratio so the image matches the target
                  dimensions exactly.
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
