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

interface ImageInfo {
  width: number;
  height: number;
  name: string;
  size: number;
  type: string;
}

interface CropRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

type AspectPreset = "free" | "1:1" | "16:9" | "4:3" | "3:2";
type OutputFormat = "png" | "jpeg";

const ASPECT_PRESETS: { label: string; value: AspectPreset; ratio: number | null }[] = [
  { label: "Free", value: "free", ratio: null },
  { label: "1:1", value: "1:1", ratio: 1 },
  { label: "16:9", value: "16:9", ratio: 16 / 9 },
  { label: "4:3", value: "4:3", ratio: 4 / 3 },
  { label: "3:2", value: "3:2", ratio: 3 / 2 },
];

export default function ImageCropperPage() {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [imageInfo, setImageInfo] = useState<ImageInfo | null>(null);
  const [crop, setCrop] = useState<CropRect>({ x: 0, y: 0, w: 0, h: 0 });
  const [aspect, setAspect] = useState<AspectPreset>("free");
  const [format, setFormat] = useState<OutputFormat>("png");
  const [quality, setQuality] = useState(90);
  const [croppedUrl, setCroppedUrl] = useState<string | null>(null);
  const [croppedSize, setCroppedSize] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Scale factor between displayed image and natural image
  const [displayScale, setDisplayScale] = useState(1);
  const [displayOffset, setDisplayOffset] = useState({ x: 0, y: 0 });

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
      setCrop({ x: 0, y: 0, w: img.naturalWidth, h: img.naturalHeight });
      setCroppedUrl(null);
    };
    img.src = url;
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  // Compute display scale whenever image or container changes
  useEffect(() => {
    if (!image || !containerRef.current) return;
    const container = containerRef.current;
    const rect = container.getBoundingClientRect();
    const scaleX = rect.width / image.naturalWidth;
    const scaleY = rect.height / image.naturalHeight;
    const scale = Math.min(scaleX, scaleY, 1);
    setDisplayScale(scale);

    const displayW = image.naturalWidth * scale;
    const displayH = image.naturalHeight * scale;
    setDisplayOffset({
      x: (rect.width - displayW) / 2,
      y: (rect.height - displayH) / 2,
    });
  }, [image]);

  // Draw overlay with crop selection
  useEffect(() => {
    if (!overlayRef.current || !image) return;
    const canvas = overlayRef.current;
    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw semi-transparent overlay
    ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Clear the crop area
    const cx = displayOffset.x + crop.x * displayScale;
    const cy = displayOffset.y + crop.y * displayScale;
    const cw = crop.w * displayScale;
    const ch = crop.h * displayScale;

    ctx.clearRect(cx, cy, cw, ch);

    // Draw crop border
    ctx.strokeStyle = "#3b82f6";
    ctx.lineWidth = 2;
    ctx.strokeRect(cx, cy, cw, ch);

    // Draw corner handles
    const handleSize = 8;
    ctx.fillStyle = "#3b82f6";
    const corners = [
      [cx, cy],
      [cx + cw, cy],
      [cx, cy + ch],
      [cx + cw, cy + ch],
    ];
    for (const [hx, hy] of corners) {
      ctx.fillRect(hx - handleSize / 2, hy - handleSize / 2, handleSize, handleSize);
    }

    // Draw rule-of-thirds lines
    ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
    ctx.lineWidth = 1;
    for (let i = 1; i <= 2; i++) {
      ctx.beginPath();
      ctx.moveTo(cx + (cw * i) / 3, cy);
      ctx.lineTo(cx + (cw * i) / 3, cy + ch);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx, cy + (ch * i) / 3);
      ctx.lineTo(cx + cw, cy + (ch * i) / 3);
      ctx.stroke();
    }
  }, [crop, image, displayScale, displayOffset]);

  const toNaturalCoords = useCallback(
    (clientX: number, clientY: number) => {
      if (!containerRef.current) return { x: 0, y: 0 };
      const rect = containerRef.current.getBoundingClientRect();
      const x = (clientX - rect.left - displayOffset.x) / displayScale;
      const y = (clientY - rect.top - displayOffset.y) / displayScale;
      return { x, y };
    },
    [displayScale, displayOffset]
  );

  const clampCrop = useCallback(
    (rect: CropRect): CropRect => {
      if (!imageInfo) return rect;
      let { x, y, w, h } = rect;
      x = Math.max(0, Math.min(x, imageInfo.width));
      y = Math.max(0, Math.min(y, imageInfo.height));
      w = Math.max(0, Math.min(w, imageInfo.width - x));
      h = Math.max(0, Math.min(h, imageInfo.height - y));
      return { x: Math.round(x), y: Math.round(y), w: Math.round(w), h: Math.round(h) };
    },
    [imageInfo]
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      const { x, y } = toNaturalCoords(e.clientX, e.clientY);
      setIsDragging(true);
      setDragStart({ x, y });
      setCrop({ x, y, w: 0, h: 0 });
      setCroppedUrl(null);
    },
    [toNaturalCoords]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging || !imageInfo) return;
      const { x, y } = toNaturalCoords(e.clientX, e.clientY);

      let w = x - dragStart.x;
      let h = y - dragStart.y;

      const selectedAspect = ASPECT_PRESETS.find((p) => p.value === aspect);
      if (selectedAspect?.ratio) {
        const ratio = selectedAspect.ratio;
        if (Math.abs(w) / ratio > Math.abs(h)) {
          h = w / ratio;
        } else {
          w = h * ratio;
        }
      }

      let cropX = dragStart.x;
      let cropY = dragStart.y;
      let cropW = w;
      let cropH = h;

      // Handle negative drag direction
      if (cropW < 0) {
        cropX = dragStart.x + cropW;
        cropW = -cropW;
      }
      if (cropH < 0) {
        cropY = dragStart.y + cropH;
        cropH = -cropH;
      }

      setCrop(clampCrop({ x: cropX, y: cropY, w: cropW, h: cropH }));
    },
    [isDragging, dragStart, aspect, imageInfo, toNaturalCoords, clampCrop]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const applyCrop = useCallback(() => {
    if (!image || !canvasRef.current || crop.w < 1 || crop.h < 1) return;

    const canvas = canvasRef.current;
    canvas.width = crop.w;
    canvas.height = crop.h;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(image, crop.x, crop.y, crop.w, crop.h, 0, 0, crop.w, crop.h);

    const mimeType = format === "jpeg" ? "image/jpeg" : "image/png";
    const qualityVal = format === "png" ? undefined : quality / 100;

    canvas.toBlob(
      (blob) => {
        if (blob) {
          if (croppedUrl) URL.revokeObjectURL(croppedUrl);
          setCroppedUrl(URL.createObjectURL(blob));
          setCroppedSize(blob.size);
        }
      },
      mimeType,
      qualityVal
    );
  }, [image, crop, format, quality, croppedUrl]);

  const download = useCallback(() => {
    if (!croppedUrl || !imageInfo) return;
    const ext = format === "jpeg" ? "jpg" : "png";
    const baseName = imageInfo.name.replace(/\.[^.]+$/, "");
    const a = document.createElement("a");
    a.href = croppedUrl;
    a.download = `${baseName}-cropped-${crop.w}x${crop.h}.${ext}`;
    a.click();
  }, [croppedUrl, imageInfo, format, crop]);

  const updateCropWidth = useCallback(
    (w: number) => {
      if (!imageInfo) return;
      const selectedAspect = ASPECT_PRESETS.find((p) => p.value === aspect);
      let h = crop.h;
      if (selectedAspect?.ratio) {
        h = Math.round(w / selectedAspect.ratio);
      }
      setCrop(clampCrop({ ...crop, w, h }));
      setCroppedUrl(null);
    },
    [aspect, crop, imageInfo, clampCrop]
  );

  const updateCropHeight = useCallback(
    (h: number) => {
      if (!imageInfo) return;
      const selectedAspect = ASPECT_PRESETS.find((p) => p.value === aspect);
      let w = crop.w;
      if (selectedAspect?.ratio) {
        w = Math.round(h * selectedAspect.ratio);
      }
      setCrop(clampCrop({ ...crop, w, h }));
      setCroppedUrl(null);
    },
    [aspect, crop, imageInfo, clampCrop]
  );

  const selectAll = useCallback(() => {
    if (!imageInfo) return;
    setCrop({ x: 0, y: 0, w: imageInfo.width, h: imageInfo.height });
    setCroppedUrl(null);
  }, [imageInfo]);

  const formatBytes = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <>
      <title>Image Cropper - Free Online Tool | DevTools Hub</title>
      <meta
        name="description"
        content="Crop images online for free. Drag to select crop area, use preset aspect ratios (1:1, 16:9, 4:3, 3:2), or enter exact dimensions. Download as PNG or JPEG. All processing in your browser."
      />
      <JsonLd
        data={[
          generateWebAppSchema({
            slug: "image-cropper",
            name: "Image Cropper",
            description:
              "Crop images with drag-to-select, preset aspect ratios, and manual dimensions",
            category: "image",
          }),
          generateBreadcrumbSchema({
            slug: "image-cropper",
            name: "Image Cropper",
            description:
              "Crop images with drag-to-select, preset aspect ratios, and manual dimensions",
            category: "image",
          }),
          generateFAQSchema([
            {
              question: "Is my image uploaded to a server?",
              answer:
                "No. All image cropping happens entirely in your browser using the HTML5 Canvas API. Your image never leaves your device. You can verify this by using the tool with your internet disconnected.",
            },
            {
              question: "What aspect ratio presets are available?",
              answer:
                "The tool includes Free (unconstrained), 1:1 (square), 16:9 (widescreen), 4:3 (standard display), and 3:2 (classic photo) aspect ratio presets. You can also enter exact pixel dimensions manually.",
            },
            {
              question: "What is the maximum image size I can crop?",
              answer:
                "There is no hard limit, but very large images (over 50MP) may cause your browser to slow down since all processing happens client-side. For best performance, keep images under 10,000 x 10,000 pixels.",
            },
            {
              question: "Should I download as PNG or JPEG?",
              answer:
                "PNG preserves full quality and supports transparency, making it ideal for screenshots, graphics, and logos. JPEG produces smaller files and is better for photographs. Use the quality slider to balance JPEG file size and quality.",
            },
          ]),
        ]}
      />

      <div className="min-h-screen bg-slate-900 text-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <ToolBreadcrumb slug="image-cropper" />

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
              Image Cropper
            </h1>
            <p className="text-slate-400 max-w-2xl text-lg">
              Crop images with drag-to-select, preset aspect ratios, or exact
              pixel dimensions. Export as PNG or JPEG. Everything runs in your
              browser — no uploads to any server.
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
                <p className="text-lg font-medium mb-2">
                  Drop an image here or click to browse
                </p>
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
              {/* Image Info Bar */}
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
                      <p className="text-sm font-medium text-white">
                        {imageInfo?.name}
                      </p>
                      <p className="text-xs text-slate-400">
                        {imageInfo?.width} x {imageInfo?.height} |{" "}
                        {formatBytes(imageInfo?.size || 0)} | {imageInfo?.type}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setImage(null);
                      setImageInfo(null);
                      setCroppedUrl(null);
                      setCrop({ x: 0, y: 0, w: 0, h: 0 });
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
                  {/* Aspect Ratio */}
                  <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
                    <h2 className="text-sm font-semibold text-white mb-3">
                      Aspect Ratio
                    </h2>
                    <div className="flex flex-wrap gap-2">
                      {ASPECT_PRESETS.map((preset) => (
                        <button
                          key={preset.value}
                          onClick={() => {
                            setAspect(preset.value);
                            setCroppedUrl(null);
                          }}
                          className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                            aspect === preset.value
                              ? "bg-blue-600 text-white"
                              : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                          }`}
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Crop Dimensions */}
                  <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h2 className="text-sm font-semibold text-white">
                        Crop Area (px)
                      </h2>
                      <button
                        onClick={selectAll}
                        className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                      >
                        Select All
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div>
                        <label className="text-xs text-slate-500">X</label>
                        <input
                          type="number"
                          min={0}
                          max={imageInfo?.width || 0}
                          value={crop.x}
                          onChange={(e) => {
                            setCrop(
                              clampCrop({ ...crop, x: Number(e.target.value) || 0 })
                            );
                            setCroppedUrl(null);
                          }}
                          className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 font-mono text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-slate-500">Y</label>
                        <input
                          type="number"
                          min={0}
                          max={imageInfo?.height || 0}
                          value={crop.y}
                          onChange={(e) => {
                            setCrop(
                              clampCrop({ ...crop, y: Number(e.target.value) || 0 })
                            );
                            setCroppedUrl(null);
                          }}
                          className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 font-mono text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-slate-500">Width</label>
                        <input
                          type="number"
                          min={1}
                          max={imageInfo?.width || 0}
                          value={crop.w}
                          onChange={(e) =>
                            updateCropWidth(Number(e.target.value) || 1)
                          }
                          className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 font-mono text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-slate-500">Height</label>
                        <input
                          type="number"
                          min={1}
                          max={imageInfo?.height || 0}
                          value={crop.h}
                          onChange={(e) =>
                            updateCropHeight(Number(e.target.value) || 1)
                          }
                          className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 font-mono text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Output Format */}
                  <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
                    <h2 className="text-sm font-semibold text-white mb-3">
                      Output Format
                    </h2>
                    <div className="flex gap-2 mb-3">
                      {(["png", "jpeg"] as OutputFormat[]).map((f) => (
                        <button
                          key={f}
                          onClick={() => {
                            setFormat(f);
                            setCroppedUrl(null);
                          }}
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
                    {format === "jpeg" && (
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
                          onChange={(e) => {
                            setQuality(Number(e.target.value));
                            setCroppedUrl(null);
                          }}
                          className="w-full accent-blue-500"
                        />
                      </div>
                    )}
                  </div>

                  {/* Crop Button */}
                  <button
                    onClick={applyCrop}
                    disabled={crop.w < 1 || crop.h < 1}
                    className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                  >
                    Crop to {crop.w} x {crop.h}
                  </button>
                </div>

                {/* Crop Canvas */}
                <div className="lg:col-span-2 space-y-4">
                  <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
                    <h2 className="text-sm font-semibold text-white mb-3">
                      Drag to select crop area
                    </h2>
                    <div
                      ref={containerRef}
                      className="relative bg-slate-900 rounded-lg overflow-hidden select-none"
                      style={{
                        height: Math.min(
                          500,
                          (image.naturalHeight / image.naturalWidth) * 700
                        ),
                      }}
                      onMouseDown={handleMouseDown}
                      onMouseMove={handleMouseMove}
                      onMouseUp={handleMouseUp}
                      onMouseLeave={handleMouseUp}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={image.src}
                        alt="Source"
                        className="absolute"
                        style={{
                          left: displayOffset.x,
                          top: displayOffset.y,
                          width: image.naturalWidth * displayScale,
                          height: image.naturalHeight * displayScale,
                        }}
                        draggable={false}
                      />
                      <canvas
                        ref={overlayRef}
                        className="absolute inset-0 cursor-crosshair"
                        style={{ width: "100%", height: "100%" }}
                      />
                    </div>
                    <p className="text-xs text-slate-500 mt-2">
                      Click and drag on the image to define the crop area.
                      {aspect !== "free" &&
                        ` Aspect ratio locked to ${aspect}.`}
                    </p>
                  </div>

                  {/* Cropped Result */}
                  {croppedUrl && (
                    <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h2 className="text-sm font-semibold text-white">
                          Cropped Image
                        </h2>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-slate-500">
                            {crop.w} x {crop.h} | {formatBytes(croppedSize)} |{" "}
                            {format.toUpperCase()}
                          </span>
                          {imageInfo && croppedSize < imageInfo.size && (
                            <span className="text-xs text-green-400">
                              -
                              {Math.round(
                                (1 - croppedSize / imageInfo.size) * 100
                              )}
                              % smaller
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="bg-slate-900 rounded-lg p-2 mb-3 flex items-center justify-center max-h-80 overflow-hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={croppedUrl}
                          alt="Cropped"
                          className="max-w-full max-h-72 object-contain"
                          loading="lazy"
                        />
                      </div>
                      <button
                        onClick={download}
                        className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
                      >
                        Download Cropped Image
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Hidden canvas for processing */}
          <canvas ref={canvasRef} className="hidden" />

          <RelatedTools currentSlug="image-cropper" />

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
                  No. All image cropping happens entirely in your browser using
                  the HTML5 Canvas API. Your image never leaves your device. You
                  can verify this by using the tool with your internet
                  disconnected.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  What aspect ratio presets are available?
                </h3>
                <p className="text-slate-400">
                  The tool includes <strong>Free</strong> (unconstrained),{" "}
                  <strong>1:1</strong> (square), <strong>16:9</strong>{" "}
                  (widescreen), <strong>4:3</strong> (standard display), and{" "}
                  <strong>3:2</strong> (classic photo) aspect ratio presets. You
                  can also enter exact pixel dimensions manually.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  What is the maximum image size I can crop?
                </h3>
                <p className="text-slate-400">
                  There is no hard limit, but very large images (over 50MP) may
                  cause your browser to slow down since all processing happens
                  client-side. For best performance, keep images under 10,000 x
                  10,000 pixels.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Should I download as PNG or JPEG?
                </h3>
                <p className="text-slate-400">
                  <strong>PNG</strong> preserves full quality and supports
                  transparency, making it ideal for screenshots, graphics, and
                  logos. <strong>JPEG</strong> produces smaller files and is
                  better for photographs. Use the quality slider to balance JPEG
                  file size and quality.
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
