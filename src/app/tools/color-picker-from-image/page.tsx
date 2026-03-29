"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import JsonLd from "@/components/JsonLd";
import RelatedTools from "@/components/RelatedTools";
import ToolBreadcrumb from "@/components/ToolBreadcrumb";
import {
  generateFAQSchema,
  generateWebAppSchema,
  generateBreadcrumbSchema,
} from "@/lib/jsonld";

interface PickedColor {
  hex: string;
  rgb: { r: number; g: number; b: number };
  x: number;
  y: number;
}

function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) => n.toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  const rn = r / 255, gn = g / 255, bn = b / 255;
  const max = Math.max(rn, gn, bn), min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  let h = 0, s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === rn) h = ((gn - bn) / d + (gn < bn ? 6 : 0)) / 6;
    else if (max === gn) h = ((bn - rn) / d + 2) / 6;
    else h = ((rn - gn) / d + 4) / 6;
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

function getContrastColor(r: number, g: number, b: number): string {
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.5 ? "#000000" : "#ffffff";
}

function getDominantColors(ctx: CanvasRenderingContext2D, width: number, height: number, count: number): PickedColor[] {
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  const colorMap = new Map<string, { r: number; g: number; b: number; count: number }>();

  const step = Math.max(1, Math.floor(data.length / 4 / 10000));
  for (let i = 0; i < data.length; i += 4 * step) {
    const r = Math.round(data[i] / 16) * 16;
    const g = Math.round(data[i + 1] / 16) * 16;
    const b = Math.round(data[i + 2] / 16) * 16;
    const key = `${r},${g},${b}`;
    const existing = colorMap.get(key);
    if (existing) {
      existing.count++;
    } else {
      colorMap.set(key, { r, g, b, count: 1 });
    }
  }

  const sorted = Array.from(colorMap.values()).sort((a, b) => b.count - a.count);

  const result: PickedColor[] = [];
  for (const c of sorted) {
    if (result.length >= count) break;
    const hex = rgbToHex(c.r, c.g, c.b);
    const tooClose = result.some((existing) => {
      const dr = Math.abs(existing.rgb.r - c.r);
      const dg = Math.abs(existing.rgb.g - c.g);
      const db = Math.abs(existing.rgb.b - c.b);
      return dr + dg + db < 60;
    });
    if (!tooClose) {
      result.push({ hex, rgb: { r: c.r, g: c.g, b: c.b }, x: 0, y: 0 });
    }
  }

  return result;
}

export default function ColorPickerFromImagePage() {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [pickedColors, setPickedColors] = useState<PickedColor[]>([]);
  const [dominantColors, setDominantColors] = useState<PickedColor[]>([]);
  const [hoveredColor, setHoveredColor] = useState<{ hex: string; r: number; g: number; b: number } | null>(null);
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number } | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [fileName, setFileName] = useState("");
  const [zoom, setZoom] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  const loadImage = useCallback((file: File) => {
    setFileName(file.name);
    const img = new Image();
    img.onload = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const maxWidth = Math.min(1200, window.innerWidth - 64);
      const scale = img.width > maxWidth ? maxWidth / img.width : 1;
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      imgRef.current = img;
      setImageLoaded(true);
      setPickedColors([]);

      const dominant = getDominantColors(ctx, canvas.width, canvas.height, 8);
      setDominantColors(dominant);
    };
    img.src = URL.createObjectURL(file);
  }, []);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) loadImage(file);
  }, [loadImage]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) loadImage(file);
  }, [loadImage]);

  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = Math.round((e.clientX - rect.left) * scaleX);
    const y = Math.round((e.clientY - rect.top) * scaleY);
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const pixel = ctx.getImageData(x, y, 1, 1).data;
    const hex = rgbToHex(pixel[0], pixel[1], pixel[2]);
    setPickedColors((prev) => [
      { hex, rgb: { r: pixel[0], g: pixel[1], b: pixel[2] }, x, y },
      ...prev.slice(0, 19),
    ]);
  }, []);

  const handleCanvasMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = Math.round((e.clientX - rect.left) * scaleX);
    const y = Math.round((e.clientY - rect.top) * scaleY);
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const pixel = ctx.getImageData(x, y, 1, 1).data;
    setHoveredColor({ hex: rgbToHex(pixel[0], pixel[1], pixel[2]), r: pixel[0], g: pixel[1], b: pixel[2] });
    setCursorPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  }, []);

  const copyValue = useCallback(async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(text);
    setTimeout(() => setCopied(null), 2000);
  }, []);

  const clearAll = useCallback(() => {
    setPickedColors([]);
    setDominantColors([]);
    setImageLoaded(false);
    setFileName("");
    setHoveredColor(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  const exportPalette = useCallback(() => {
    const colors = [...pickedColors, ...dominantColors.filter((dc) => !pickedColors.some((pc) => pc.hex === dc.hex))];
    if (colors.length === 0) return;
    const css = colors.map((c) => `  /* ${c.hex.toUpperCase()} */\n  --color-${c.hex.slice(1)}: ${c.hex};`).join("\n");
    const text = `:root {\n${css}\n}`;
    navigator.clipboard.writeText(text);
    setCopied("palette");
    setTimeout(() => setCopied(null), 2000);
  }, [pickedColors, dominantColors]);

  return (
    <>
      <title>Color Picker from Image - Extract Colors from Any Image | DevTools Hub</title>
      <meta
        name="description"
        content="Upload an image and pick colors with a click. Extract dominant color palettes, copy HEX/RGB/HSL values. Free browser-based color picker tool."
      />
      <JsonLd
        data={[
          generateWebAppSchema({
            slug: "color-picker-from-image",
            name: "Color Picker from Image",
            description: "Extract colors from any image — click to pick hex, RGB, and HSL values instantly",
            category: "image",
          }),
          generateBreadcrumbSchema({
            slug: "color-picker-from-image",
            name: "Color Picker from Image",
            description: "Extract colors from any image — click to pick hex, RGB, and HSL values instantly",
            category: "image",
          }),
          generateFAQSchema([
            { question: "How does the color picker work?", answer: "When you upload an image, it's drawn onto an HTML canvas element in your browser. Clicking anywhere on the image reads the pixel data at that position to extract the exact color. Dominant colors are extracted by sampling pixels across the image and grouping similar colors together. No data leaves your browser." },
            { question: "What image formats are supported?", answer: "Any image format your browser supports -- PNG, JPEG, WebP, GIF, BMP, and SVG. Large images are automatically scaled down to fit the viewport while preserving color accuracy." },
            { question: "Can I export the color palette?", answer: "Yes. Click \"Export as CSS Variables\" to copy all picked and dominant colors as CSS custom properties. You can also click individual colors to copy their HEX, RGB, or HSL values." },
            { question: "Is my image uploaded to a server?", answer: "No. The entire color picking process happens in your browser using the Canvas API. Your image never leaves your device and is not stored anywhere." },
          ]),
        ]}
      />

      <div className="min-h-screen bg-slate-900 text-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <ToolBreadcrumb slug="color-picker-from-image" />

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
              Color Picker from Image
            </h1>
            <p className="text-slate-400 max-w-2xl text-lg">
              Upload any image and click to pick colors. Automatically extracts
              dominant colors into a palette. Copy HEX, RGB, or HSL values
              instantly. Everything runs in your browser.
            </p>
          </div>

          {/* Upload Area */}
          {!imageLoaded && (
            <div
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-600 hover:border-blue-500 rounded-xl p-16 text-center cursor-pointer transition-colors mb-6"
            >
              <div className="text-5xl mb-4">🖼️</div>
              <p className="text-lg text-white font-medium mb-2">
                Drop an image here or click to upload
              </p>
              <p className="text-sm text-slate-400">
                Supports PNG, JPG, WebP, GIF, BMP, SVG
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
          )}

          {imageLoaded && (
            <>
              {/* Toolbar */}
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <span className="text-sm text-slate-400 truncate max-w-xs">{fileName}</span>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 text-sm bg-slate-700 hover:bg-slate-600 rounded transition-colors"
                >
                  Change Image
                </button>
                <button
                  onClick={clearAll}
                  className="px-3 py-1.5 text-sm bg-slate-700 hover:bg-slate-600 rounded transition-colors"
                >
                  Clear
                </button>
                {(pickedColors.length > 0 || dominantColors.length > 0) && (
                  <button
                    onClick={exportPalette}
                    className="px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 rounded transition-colors"
                  >
                    {copied === "palette" ? "Copied CSS!" : "Export as CSS Variables"}
                  </button>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>

              {/* Canvas + Hover Info */}
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
                <div className="lg:col-span-3 relative" ref={containerRef}>
                  <canvas
                    ref={canvasRef}
                    onClick={handleCanvasClick}
                    onMouseMove={handleCanvasMove}
                    onMouseLeave={() => { setHoveredColor(null); setCursorPos(null); }}
                    className="w-full rounded-lg border border-slate-700 cursor-crosshair"
                  />
                  {/* Hover tooltip */}
                  {hoveredColor && cursorPos && (
                    <div
                      className="pointer-events-none absolute z-10 rounded-lg border border-slate-600 bg-slate-800 p-2 shadow-lg"
                      style={{
                        left: Math.min(cursorPos.x + 16, (containerRef.current?.clientWidth || 400) - 160),
                        top: cursorPos.y + 16,
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="w-8 h-8 rounded border border-slate-600"
                          style={{ backgroundColor: hoveredColor.hex }}
                        />
                        <div>
                          <p className="text-xs font-mono text-white">{hoveredColor.hex.toUpperCase()}</p>
                          <p className="text-xs font-mono text-slate-400">
                            rgb({hoveredColor.r}, {hoveredColor.g}, {hoveredColor.b})
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Right panel: Dominant + Picked */}
                <div className="lg:col-span-1 space-y-4">
                  {/* Dominant Colors */}
                  {dominantColors.length > 0 && (
                    <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
                      <h2 className="text-sm font-semibold text-white mb-3">Dominant Colors</h2>
                      <div className="grid grid-cols-4 gap-2 mb-3">
                        {dominantColors.map((c, i) => (
                          <button
                            key={i}
                            onClick={() => copyValue(c.hex)}
                            className="aspect-square rounded border border-slate-600 hover:ring-2 hover:ring-blue-500 transition-all relative group"
                            style={{ backgroundColor: c.hex }}
                            title={c.hex.toUpperCase()}
                          >
                            <span
                              className="absolute inset-0 flex items-center justify-center text-[8px] font-mono opacity-0 group-hover:opacity-100 transition-opacity"
                              style={{ color: getContrastColor(c.rgb.r, c.rgb.g, c.rgb.b) }}
                            >
                              {copied === c.hex ? "✓" : c.hex.toUpperCase().slice(1)}
                            </span>
                          </button>
                        ))}
                      </div>
                      {/* Gradient bar */}
                      <div
                        className="w-full h-6 rounded"
                        style={{
                          background: `linear-gradient(to right, ${dominantColors.map((c) => c.hex).join(", ")})`,
                        }}
                      />
                    </div>
                  )}

                  {/* Picked Colors */}
                  <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h2 className="text-sm font-semibold text-white">
                        Picked Colors {pickedColors.length > 0 && `(${pickedColors.length})`}
                      </h2>
                      {pickedColors.length > 0 && (
                        <button
                          onClick={() => setPickedColors([])}
                          className="text-xs text-slate-400 hover:text-white transition-colors"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                    {pickedColors.length === 0 ? (
                      <p className="text-xs text-slate-500">Click on the image to pick colors</p>
                    ) : (
                      <div className="space-y-2 max-h-96 overflow-y-auto">
                        {pickedColors.map((c, i) => {
                          const hsl = rgbToHsl(c.rgb.r, c.rgb.g, c.rgb.b);
                          return (
                            <div key={i} className="flex items-center gap-2 bg-slate-900 rounded p-2">
                              <div
                                className="w-8 h-8 rounded border border-slate-600 shrink-0"
                                style={{ backgroundColor: c.hex }}
                              />
                              <div className="flex-1 min-w-0">
                                <button
                                  onClick={() => copyValue(c.hex)}
                                  className="text-xs font-mono text-white hover:text-blue-400 transition-colors block"
                                >
                                  {copied === c.hex ? "Copied!" : c.hex.toUpperCase()}
                                </button>
                                <button
                                  onClick={() => copyValue(`rgb(${c.rgb.r}, ${c.rgb.g}, ${c.rgb.b})`)}
                                  className="text-[10px] font-mono text-slate-500 hover:text-slate-300 transition-colors block"
                                >
                                  rgb({c.rgb.r}, {c.rgb.g}, {c.rgb.b})
                                </button>
                                <button
                                  onClick={() => copyValue(`hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`)}
                                  className="text-[10px] font-mono text-slate-500 hover:text-slate-300 transition-colors block"
                                >
                                  hsl({hsl.h}, {hsl.s}%, {hsl.l}%)
                                </button>
                              </div>
                              <button
                                onClick={() => setPickedColors((prev) => prev.filter((_, j) => j !== i))}
                                className="text-slate-600 hover:text-red-400 transition-colors shrink-0 text-xs"
                              >
                                ×
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}

          <RelatedTools currentSlug="color-picker-from-image" />

          {/* FAQ Section */}
          <section className="mt-16 border-t border-slate-700 pt-10">
            <h2 className="text-2xl font-bold text-white mb-6">
              Frequently Asked Questions
            </h2>
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  How does the color picker work?
                </h3>
                <p className="text-slate-400">
                  When you upload an image, it&apos;s drawn onto an HTML canvas
                  element in your browser. Clicking anywhere on the image reads
                  the pixel data at that position to extract the exact color.
                  Dominant colors are extracted by sampling pixels across the
                  image and grouping similar colors together. No data leaves
                  your browser.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  What image formats are supported?
                </h3>
                <p className="text-slate-400">
                  Any image format your browser supports — PNG, JPEG, WebP, GIF,
                  BMP, and SVG. Large images are automatically scaled down to
                  fit the viewport while preserving color accuracy.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Can I export the color palette?
                </h3>
                <p className="text-slate-400">
                  Yes. Click &ldquo;Export as CSS Variables&rdquo; to copy all
                  picked and dominant colors as CSS custom properties. You can
                  also click individual colors to copy their HEX, RGB, or HSL
                  values.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Is my image uploaded to a server?
                </h3>
                <p className="text-slate-400">
                  No. The entire color picking process happens in your browser
                  using the Canvas API. Your image never leaves your device and
                  is not stored anywhere.
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
