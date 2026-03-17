"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import JsonLd from "@/components/JsonLd";
import RelatedTools from "@/components/RelatedTools";
import {
  generateFAQSchema,
  generateWebAppSchema,
  generateBreadcrumbSchema,
} from "@/lib/jsonld";

const PRESETS: { label: string; w: number; h: number; category: string }[] = [
  // Social Media
  { label: "Instagram Post", w: 1080, h: 1080, category: "Social" },
  { label: "Instagram Story", w: 1080, h: 1920, category: "Social" },
  { label: "Facebook Cover", w: 820, h: 312, category: "Social" },
  { label: "Twitter Header", w: 1500, h: 500, category: "Social" },
  { label: "YouTube Thumbnail", w: 1280, h: 720, category: "Social" },
  { label: "LinkedIn Banner", w: 1584, h: 396, category: "Social" },
  // Web
  { label: "Full HD", w: 1920, h: 1080, category: "Web" },
  { label: "HD", w: 1280, h: 720, category: "Web" },
  { label: "Thumbnail", w: 150, h: 150, category: "Web" },
  { label: "Banner", w: 728, h: 90, category: "Web" },
  { label: "Leaderboard", w: 970, h: 250, category: "Web" },
  { label: "Hero Section", w: 1440, h: 600, category: "Web" },
  // Standard
  { label: "Square", w: 500, h: 500, category: "Standard" },
  { label: "Card", w: 350, h: 200, category: "Standard" },
  { label: "Avatar", w: 128, h: 128, category: "Standard" },
  { label: "Icon", w: 64, h: 64, category: "Standard" },
  { label: "Favicon", w: 32, h: 32, category: "Standard" },
  { label: "A4 (72 DPI)", w: 595, h: 842, category: "Standard" },
];

const COLOR_PRESETS: { label: string; bg: string; text: string }[] = [
  { label: "Gray", bg: "#94a3b8", text: "#1e293b" },
  { label: "Blue", bg: "#3b82f6", text: "#ffffff" },
  { label: "Green", bg: "#22c55e", text: "#ffffff" },
  { label: "Red", bg: "#ef4444", text: "#ffffff" },
  { label: "Purple", bg: "#a855f7", text: "#ffffff" },
  { label: "Orange", bg: "#f97316", text: "#ffffff" },
  { label: "Teal", bg: "#14b8a6", text: "#ffffff" },
  { label: "Dark", bg: "#1e293b", text: "#94a3b8" },
  { label: "Light", bg: "#e2e8f0", text: "#334155" },
  { label: "Pink", bg: "#ec4899", text: "#ffffff" },
];

type OutputFormat = "png" | "jpeg" | "webp" | "svg";

export default function PlaceholderImageGeneratorPage() {
  const [width, setWidth] = useState(800);
  const [height, setHeight] = useState(600);
  const [bgColor, setBgColor] = useState("#94a3b8");
  const [textColor, setTextColor] = useState("#1e293b");
  const [customText, setCustomText] = useState("");
  const [format, setFormat] = useState<OutputFormat>("png");
  const [presetCategory, setPresetCategory] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const displayText = customText || `${width} × ${height}`;

  const generateImage = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Background
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, width, height);

    // Border
    ctx.strokeStyle = textColor;
    ctx.globalAlpha = 0.15;
    ctx.lineWidth = Math.max(1, Math.min(width, height) * 0.005);
    ctx.strokeRect(0, 0, width, height);
    ctx.globalAlpha = 1;

    // Cross lines
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(width, height);
    ctx.moveTo(width, 0);
    ctx.lineTo(0, height);
    ctx.strokeStyle = textColor;
    ctx.globalAlpha = 0.06;
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.globalAlpha = 1;

    // Text
    const fontSize = Math.max(12, Math.min(width, height) * 0.08);
    ctx.font = `600 ${fontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
    ctx.fillStyle = textColor;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(displayText, width / 2, height / 2);

    // Sub-text with dimensions if custom text is used
    if (customText) {
      const subFontSize = Math.max(10, fontSize * 0.45);
      ctx.font = `400 ${subFontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
      ctx.globalAlpha = 0.5;
      ctx.fillText(`${width} × ${height}`, width / 2, height / 2 + fontSize * 0.8);
      ctx.globalAlpha = 1;
    }

    // Generate preview
    setPreviewUrl(canvas.toDataURL("image/png"));
  }, [width, height, bgColor, textColor, displayText, customText]);

  // Auto-generate on parameter changes
  useEffect(() => {
    generateImage();
  }, [generateImage]);

  const handleDownload = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (format === "svg") {
      // Generate SVG string
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="${width}" height="${height}" fill="${bgColor}"/>
  <rect width="${width}" height="${height}" fill="none" stroke="${textColor}" stroke-opacity="0.15" stroke-width="${Math.max(1, Math.min(width, height) * 0.005)}"/>
  <line x1="0" y1="0" x2="${width}" y2="${height}" stroke="${textColor}" stroke-opacity="0.06" stroke-width="1"/>
  <line x1="${width}" y1="0" x2="0" y2="${height}" stroke="${textColor}" stroke-opacity="0.06" stroke-width="1"/>
  <text x="${width / 2}" y="${height / 2}" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="${Math.max(12, Math.min(width, height) * 0.08)}" font-weight="600" fill="${textColor}" text-anchor="middle" dominant-baseline="central">${displayText.replace(/&/g, "&amp;").replace(/</g, "&lt;")}</text>
${customText ? `  <text x="${width / 2}" y="${height / 2 + Math.max(12, Math.min(width, height) * 0.08) * 0.8}" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="${Math.max(10, Math.max(12, Math.min(width, height) * 0.08) * 0.45)}" font-weight="400" fill="${textColor}" fill-opacity="0.5" text-anchor="middle" dominant-baseline="central">${width} × ${height}</text>` : ""}
</svg>`;
      const blob = new Blob([svg], { type: "image/svg+xml" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `placeholder-${width}x${height}.svg`;
      a.click();
      URL.revokeObjectURL(url);
      return;
    }

    const mimeType = format === "jpeg" ? "image/jpeg" : format === "webp" ? "image/webp" : "image/png";
    const ext = format;
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `placeholder-${width}x${height}.${ext}`;
        a.click();
        URL.revokeObjectURL(url);
      },
      mimeType,
      format === "jpeg" || format === "webp" ? 0.92 : undefined
    );
  }, [width, height, bgColor, textColor, displayText, customText, format]);

  const handleCopyUrl = useCallback(async () => {
    // Generate a placeholder URL-style string
    const url = `https://via.placeholder.com/${width}x${height}/${bgColor.slice(1)}/${textColor.slice(1)}?text=${encodeURIComponent(displayText)}`;
    await navigator.clipboard.writeText(url);
  }, [width, height, bgColor, textColor, displayText]);

  const applyPreset = useCallback((preset: typeof PRESETS[0]) => {
    setWidth(preset.w);
    setHeight(preset.h);
  }, []);

  const applyColorPreset = useCallback((preset: typeof COLOR_PRESETS[0]) => {
    setBgColor(preset.bg);
    setTextColor(preset.text);
  }, []);

  const categories = Array.from(new Set(PRESETS.map((p) => p.category)));
  const filteredPresets = presetCategory ? PRESETS.filter((p) => p.category === presetCategory) : PRESETS;

  return (
    <>
      <title>Placeholder Image Generator - Free Online Tool | DevTools Hub</title>
      <meta
        name="description"
        content="Generate placeholder images with custom dimensions, colors, and text. Download as PNG, JPEG, WebP, or SVG — perfect for mockups, wireframes, and prototypes."
      />
      <JsonLd
        data={[
          generateWebAppSchema({
            slug: "placeholder-image-generator",
            name: "Placeholder Image Generator",
            description: "Generate placeholder images with custom size, color, text, and format for wireframes and mockups",
            category: "design",
          }),
          generateBreadcrumbSchema({
            slug: "placeholder-image-generator",
            name: "Placeholder Image Generator",
            description: "Generate placeholder images with custom size, color, text, and format for wireframes and mockups",
            category: "design",
          }),
          generateFAQSchema([
            { question: "What is a placeholder image?", answer: "A placeholder image is a temporary image used in web design, mockups, and prototypes to represent where a real image will go. They typically display the image dimensions and a solid background color, making it easy to see the layout before final content is ready." },
            { question: "What formats are available?", answer: "You can download placeholder images in four formats: PNG (lossless, best for graphics), JPEG (compressed, smaller files), WebP (modern format, best compression), and SVG (vector, scales to any size without quality loss). SVG is ideal for responsive designs." },
            { question: "What is the maximum image size?", answer: "You can generate images up to 4096x4096 pixels. For larger dimensions, the Canvas API may have limits depending on your browser. Most browsers support up to 4096px without issues." },
            { question: "Is this tool free and private?", answer: "Yes. All image generation happens in your browser using the HTML5 Canvas API. No images are uploaded to any server. The tool is completely free with no sign-up required." },
          ]),
        ]}
      />

      <main className="min-h-screen bg-slate-900 text-white">
        <div className="max-w-6xl mx-auto px-4 py-12">
          {/* Breadcrumb */}
          <nav className="text-sm text-slate-400 mb-6" aria-label="Breadcrumb">
            <ol className="flex items-center gap-2">
              <li><a href="/" className="hover:text-white transition-colors">Home</a></li>
              <li><span className="mx-1">/</span></li>
              <li><a href="/tools" className="hover:text-white transition-colors">Design Tools</a></li>
              <li><span className="mx-1">/</span></li>
              <li className="text-slate-200">Placeholder Image Generator</li>
            </ol>
          </nav>

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
              Placeholder Image Generator
            </h1>
            <p className="text-slate-400 max-w-2xl text-lg">
              Generate placeholder images for mockups, wireframes, and prototypes. Customize dimensions, colors, and text. Download as PNG, JPEG, WebP, or SVG.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr,400px] gap-6 mb-8">
            {/* Controls */}
            <div className="space-y-6">
              {/* Dimensions */}
              <div className="bg-slate-800 rounded-lg p-5">
                <h2 className="text-sm font-medium text-slate-300 mb-3">Dimensions</h2>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">Width (px)</label>
                    <input
                      type="number"
                      value={width}
                      onChange={(e) => setWidth(Math.max(1, Math.min(4096, parseInt(e.target.value) || 1)))}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">Height (px)</label>
                    <input
                      type="number"
                      value={height}
                      onChange={(e) => setHeight(Math.max(1, Math.min(4096, parseInt(e.target.value) || 1)))}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Preset categories */}
                <div className="flex flex-wrap gap-1.5 mb-2">
                  <button
                    onClick={() => setPresetCategory(null)}
                    className={`px-2.5 py-1 text-xs rounded-full font-medium transition-colors ${
                      presetCategory === null ? "bg-blue-600 text-white" : "bg-slate-700 text-slate-400 hover:bg-slate-600"
                    }`}
                  >
                    All
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setPresetCategory(presetCategory === cat ? null : cat)}
                      className={`px-2.5 py-1 text-xs rounded-full font-medium transition-colors ${
                        presetCategory === cat ? "bg-blue-600 text-white" : "bg-slate-700 text-slate-400 hover:bg-slate-600"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {/* Size presets */}
                <div className="grid grid-cols-3 gap-1.5">
                  {filteredPresets.map((p) => (
                    <button
                      key={p.label}
                      onClick={() => applyPreset(p)}
                      className={`py-1.5 px-2 text-xs rounded transition-colors ${
                        width === p.w && height === p.h
                          ? "bg-blue-600 text-white"
                          : "bg-slate-700 text-slate-400 hover:bg-slate-600 hover:text-white"
                      }`}
                    >
                      <div className="font-medium">{p.label}</div>
                      <div className="text-[10px] opacity-70">{p.w}×{p.h}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Colors */}
              <div className="bg-slate-800 rounded-lg p-5">
                <h2 className="text-sm font-medium text-slate-300 mb-3">Colors</h2>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">Background</label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={bgColor}
                        onChange={(e) => setBgColor(e.target.value)}
                        className="w-10 h-9 rounded border border-slate-700 cursor-pointer bg-transparent"
                      />
                      <input
                        type="text"
                        value={bgColor}
                        onChange={(e) => setBgColor(e.target.value)}
                        className="flex-1 bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm font-mono text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">Text</label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={textColor}
                        onChange={(e) => setTextColor(e.target.value)}
                        className="w-10 h-9 rounded border border-slate-700 cursor-pointer bg-transparent"
                      />
                      <input
                        type="text"
                        value={textColor}
                        onChange={(e) => setTextColor(e.target.value)}
                        className="flex-1 bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm font-mono text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {COLOR_PRESETS.map((c) => (
                    <button
                      key={c.label}
                      onClick={() => applyColorPreset(c)}
                      className={`flex items-center gap-1.5 px-2 py-1 text-xs rounded transition-colors ${
                        bgColor === c.bg ? "ring-2 ring-blue-500" : ""
                      } bg-slate-700 hover:bg-slate-600 text-slate-300`}
                    >
                      <span className="w-3 h-3 rounded-full inline-block border border-slate-600" style={{ backgroundColor: c.bg }} />
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Text & Format */}
              <div className="bg-slate-800 rounded-lg p-5">
                <h2 className="text-sm font-medium text-slate-300 mb-3">Text & Format</h2>
                <div className="mb-3">
                  <label className="text-xs text-slate-400 mb-1 block">Custom Text (leave empty for dimensions)</label>
                  <input
                    type="text"
                    value={customText}
                    onChange={(e) => setCustomText(e.target.value)}
                    placeholder={`${width} × ${height}`}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="mb-3">
                  <label className="text-xs text-slate-400 mb-1 block">Download Format</label>
                  <div className="grid grid-cols-4 gap-2">
                    {(["png", "jpeg", "webp", "svg"] as OutputFormat[]).map((f) => (
                      <button
                        key={f}
                        onClick={() => setFormat(f)}
                        className={`py-2 px-3 rounded text-sm font-medium uppercase transition-colors ${
                          format === f ? "bg-blue-600 text-white" : "bg-slate-700 text-slate-400 hover:bg-slate-600"
                        }`}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={handleDownload}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-4 rounded transition-colors text-sm"
                  >
                    Download .{format}
                  </button>
                  <button
                    onClick={handleCopyUrl}
                    className="bg-slate-700 hover:bg-slate-600 text-white font-medium py-2.5 px-4 rounded transition-colors text-sm"
                  >
                    Copy URL
                  </button>
                </div>
              </div>
            </div>

            {/* Preview */}
            <div className="lg:sticky lg:top-8 h-fit">
              <div className="bg-slate-800 rounded-lg p-5">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-medium text-slate-300">Preview</h2>
                  <span className="text-xs text-slate-500">{width} × {height}</span>
                </div>
                <div className="bg-slate-900/50 rounded-lg p-3 flex items-center justify-center overflow-hidden" style={{ minHeight: 200 }}>
                  {previewUrl && (
                    <img
                      src={previewUrl}
                      alt={`Placeholder ${width}×${height}`}
                      className="max-w-full max-h-80 rounded"
                      style={{ aspectRatio: `${width}/${height}` }}
                    />
                  )}
                </div>
                <div className="mt-3 text-xs text-slate-500 text-center">
                  {displayText} &middot; {format.toUpperCase()} &middot; {bgColor} / {textColor}
                </div>
              </div>
            </div>
          </div>

          {/* Hidden canvas */}
          <canvas ref={canvasRef} className="hidden" />

          <RelatedTools currentSlug="placeholder-image-generator" />

          {/* FAQ */}
          <div className="bg-slate-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Frequently Asked Questions</h2>
            <div className="space-y-4">
              {[
                {
                  q: "What is a placeholder image?",
                  a: "A placeholder image is a temporary image used in web design, mockups, and prototypes to represent where a real image will go. They typically display the image dimensions and a solid background color, making it easy to see the layout before final content is ready."
                },
                {
                  q: "What formats are available?",
                  a: "You can download placeholder images in four formats: PNG (lossless, best for graphics), JPEG (compressed, smaller files), WebP (modern format, best compression), and SVG (vector, scales to any size without quality loss). SVG is ideal for responsive designs."
                },
                {
                  q: "What is the maximum image size?",
                  a: "You can generate images up to 4096×4096 pixels. For larger dimensions, the Canvas API may have limits depending on your browser. Most browsers support up to 4096px without issues."
                },
                {
                  q: "Is this tool free and private?",
                  a: "Yes. All image generation happens in your browser using the HTML5 Canvas API. No images are uploaded to any server. The tool is completely free with no sign-up required."
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
    </>
  );
}
