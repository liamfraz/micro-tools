"use client";

import { useState, useCallback } from "react";

const gcd = (a: number, b: number): number => {
  a = Math.abs(Math.round(a));
  b = Math.abs(Math.round(b));
  while (b) {
    const t = b;
    b = a % t;
    a = t;
  }
  return a;
};

const simplifyRatio = (w: number, h: number): string => {
  if (w <= 0 || h <= 0) return "—";
  const d = gcd(w, h);
  return `${w / d}:${h / d}`;
};

const decimalRatio = (w: number, h: number): string => {
  if (w <= 0 || h <= 0) return "—";
  return (w / h).toFixed(4);
};

interface Preset {
  label: string;
  w: number;
  h: number;
  category: string;
}

const PRESETS: Preset[] = [
  // Video / Display
  { label: "HD (16:9)", w: 1920, h: 1080, category: "Video" },
  { label: "4K UHD", w: 3840, h: 2160, category: "Video" },
  { label: "720p", w: 1280, h: 720, category: "Video" },
  { label: "Ultrawide (21:9)", w: 2560, h: 1080, category: "Video" },
  { label: "Standard (4:3)", w: 1024, h: 768, category: "Video" },
  { label: "Cinema (2.39:1)", w: 2390, h: 1000, category: "Video" },
  // Social Media
  { label: "Instagram Post", w: 1080, h: 1080, category: "Social" },
  { label: "Instagram Story", w: 1080, h: 1920, category: "Social" },
  { label: "Instagram Reel", w: 1080, h: 1920, category: "Social" },
  { label: "YouTube Thumbnail", w: 1280, h: 720, category: "Social" },
  { label: "Twitter Post", w: 1200, h: 675, category: "Social" },
  { label: "Facebook Cover", w: 820, h: 312, category: "Social" },
  { label: "TikTok Video", w: 1080, h: 1920, category: "Social" },
  { label: "LinkedIn Banner", w: 1584, h: 396, category: "Social" },
  // Photo / Print
  { label: "Photo 4x6", w: 1800, h: 1200, category: "Photo" },
  { label: "Photo 5x7", w: 2100, h: 1500, category: "Photo" },
  { label: "Photo 8x10", w: 3000, h: 2400, category: "Photo" },
  { label: "A4 Paper", w: 2480, h: 3508, category: "Photo" },
  { label: "US Letter", w: 2550, h: 3300, category: "Photo" },
  { label: "Square (1:1)", w: 1000, h: 1000, category: "Photo" },
];

type CalcMode = "width" | "height" | "both";

export default function AspectRatioCalculatorPage() {
  const [width1, setWidth1] = useState(1920);
  const [height1, setHeight1] = useState(1080);
  const [width2, setWidth2] = useState(1280);
  const [height2, setHeight2] = useState(720);
  const [calcMode, setCalcMode] = useState<CalcMode>("height");
  const [activePresetCategory, setActivePresetCategory] = useState<string | null>(null);

  const ratio = simplifyRatio(width1, height1);
  const decimal = decimalRatio(width1, height1);

  // Calculate the missing dimension based on mode
  const handleCalcWidth = useCallback(() => {
    if (height1 > 0 && height2 > 0) {
      const newWidth = Math.round((width1 / height1) * height2);
      setWidth2(newWidth);
    }
  }, [width1, height1, height2]);

  const handleCalcHeight = useCallback(() => {
    if (width1 > 0 && width2 > 0) {
      const newHeight = Math.round((height1 / width1) * width2);
      setHeight2(newHeight);
    }
  }, [width1, height1, width2]);

  const handleWidth2Change = useCallback((val: number) => {
    setWidth2(val);
    if (calcMode === "height" && width1 > 0 && val > 0) {
      setHeight2(Math.round((height1 / width1) * val));
    }
  }, [calcMode, width1, height1]);

  const handleHeight2Change = useCallback((val: number) => {
    setHeight2(val);
    if (calcMode === "width" && height1 > 0 && val > 0) {
      setWidth2(Math.round((width1 / height1) * val));
    }
  }, [calcMode, width1, height1]);

  const handlePreset = useCallback((preset: Preset) => {
    setWidth1(preset.w);
    setHeight1(preset.h);
    if (calcMode === "height" && width2 > 0) {
      setHeight2(Math.round((preset.h / preset.w) * width2));
    } else if (calcMode === "width" && height2 > 0) {
      setWidth2(Math.round((preset.w / preset.h) * height2));
    }
  }, [calcMode, width2, height2]);

  const handleSwapDimensions = useCallback(() => {
    setWidth1(height1);
    setHeight1(width1);
    setWidth2(height2);
    setHeight2(width2);
  }, [width1, height1, width2, height2]);

  const presetCategories = ["Video", "Social", "Photo"];

  // Visual preview proportions (max 200px on either side)
  const previewMaxSize = 200;
  const previewScale = Math.min(previewMaxSize / width1, previewMaxSize / height1, 1);
  const previewW = Math.max(Math.round(width1 * previewScale), 20);
  const previewH = Math.max(Math.round(height1 * previewScale), 20);

  return (
    <main className="min-h-screen bg-slate-900 text-white">
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-8">
          <a href="/" className="text-blue-400 hover:text-blue-300 text-sm mb-4 inline-block">
            ← Back to all tools
          </a>
          <h1 className="text-3xl font-bold mb-2">Aspect Ratio Calculator</h1>
          <p className="text-slate-400">
            Calculate and convert aspect ratios for images, videos, and screens. Find the right dimensions for social media, print, and display.
          </p>
        </div>

        {/* Main Calculator */}
        <div className="bg-slate-800 rounded-lg p-6 mb-6">
          <h2 className="text-sm font-medium text-slate-400 mb-4">Original Dimensions</h2>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Width (px)</label>
              <input
                type="number"
                min={1}
                value={width1}
                onChange={(e) => setWidth1(parseInt(e.target.value) || 0)}
                className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Height (px)</label>
              <input
                type="number"
                min={1}
                value={height1}
                onChange={(e) => setHeight1(parseInt(e.target.value) || 0)}
                className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Swap button */}
          <div className="flex justify-center mb-4">
            <button
              onClick={handleSwapDimensions}
              className="px-3 py-1 text-xs bg-slate-700 hover:bg-slate-600 rounded text-slate-300 transition-colors"
              title="Swap width and height"
            >
              ⇄ Swap W×H
            </button>
          </div>

          {/* Ratio Display */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-slate-900 rounded p-4 text-center">
              <div className="text-xs text-slate-400 mb-1">Aspect Ratio</div>
              <div className="text-2xl font-bold text-blue-400">{ratio}</div>
            </div>
            <div className="bg-slate-900 rounded p-4 text-center">
              <div className="text-xs text-slate-400 mb-1">Decimal</div>
              <div className="text-2xl font-bold text-slate-200">{decimal}</div>
            </div>
          </div>

          {/* Visual Preview */}
          {width1 > 0 && height1 > 0 && (
            <div className="flex justify-center mb-4">
              <div
                className="border-2 border-blue-500 rounded flex items-center justify-center text-xs text-slate-400"
                style={{ width: `${previewW}px`, height: `${previewH}px` }}
              >
                {width1}×{height1}
              </div>
            </div>
          )}
        </div>

        {/* Resize Calculator */}
        <div className="bg-slate-800 rounded-lg p-6 mb-6">
          <h2 className="text-sm font-medium text-slate-400 mb-4">Resize (Maintain Ratio)</h2>

          {/* Mode Selection */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            {([
              { value: "height" as CalcMode, label: "Set Width → Get Height" },
              { value: "width" as CalcMode, label: "Set Height → Get Width" },
              { value: "both" as CalcMode, label: "Manual (both)" },
            ]).map((opt) => (
              <button
                key={opt.value}
                onClick={() => setCalcMode(opt.value)}
                className={`py-2 px-3 rounded text-xs font-medium transition-colors ${
                  calcMode === opt.value
                    ? "bg-blue-600 text-white"
                    : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1">
                New Width {calcMode === "width" ? "(calculated)" : ""}
              </label>
              <input
                type="number"
                min={1}
                value={width2}
                onChange={(e) => handleWidth2Change(parseInt(e.target.value) || 0)}
                readOnly={calcMode === "width"}
                className={`w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  calcMode === "width" ? "text-green-400" : "text-white"
                }`}
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">
                New Height {calcMode === "height" ? "(calculated)" : ""}
              </label>
              <input
                type="number"
                min={1}
                value={height2}
                onChange={(e) => handleHeight2Change(parseInt(e.target.value) || 0)}
                readOnly={calcMode === "height"}
                className={`w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  calcMode === "height" ? "text-green-400" : "text-white"
                }`}
              />
            </div>
          </div>

          {calcMode === "both" && (
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleCalcHeight}
                className="bg-blue-600 hover:bg-blue-700 text-white text-sm py-2 rounded transition-colors"
              >
                Calculate Height
              </button>
              <button
                onClick={handleCalcWidth}
                className="bg-blue-600 hover:bg-blue-700 text-white text-sm py-2 rounded transition-colors"
              >
                Calculate Width
              </button>
            </div>
          )}

          {width2 > 0 && height2 > 0 && (
            <div className="mt-3 text-sm text-slate-400 text-center">
              New ratio: <span className="text-white font-medium">{simplifyRatio(width2, height2)}</span>
              {simplifyRatio(width2, height2) !== ratio && ratio !== "—" && (
                <span className="text-yellow-400 ml-2">(not matching original)</span>
              )}
            </div>
          )}
        </div>

        {/* Presets */}
        <div className="bg-slate-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Common Aspect Ratios</h2>

          {/* Category tabs */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setActivePresetCategory(null)}
              className={`px-3 py-1 text-xs rounded transition-colors ${
                activePresetCategory === null
                  ? "bg-blue-600 text-white"
                  : "bg-slate-700 text-slate-300 hover:bg-slate-600"
              }`}
            >
              All
            </button>
            {presetCategories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActivePresetCategory(activePresetCategory === cat ? null : cat)}
                className={`px-3 py-1 text-xs rounded transition-colors ${
                  activePresetCategory === cat
                    ? "bg-blue-600 text-white"
                    : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {PRESETS
              .filter((p) => !activePresetCategory || p.category === activePresetCategory)
              .map((preset) => (
                <button
                  key={preset.label}
                  onClick={() => handlePreset(preset)}
                  className="text-left bg-slate-700/50 hover:bg-slate-700 rounded p-3 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-white">{preset.label}</span>
                    <span className="text-xs font-mono text-blue-400">
                      {simplifyRatio(preset.w, preset.h)}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 mt-1">
                    {preset.w} × {preset.h}px
                  </div>
                </button>
              ))}
          </div>
        </div>

        {/* Related Tools */}
        <div className="bg-slate-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Related Tools</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { name: "Image Resizer", slug: "image-resizer", desc: "Resize images with presets" },
              { name: "Image Compressor", slug: "image-compressor", desc: "Compress images to reduce size" },
              { name: "CSS Gradient Generator", slug: "css-gradient-generator", desc: "Create CSS gradients visually" },
            ].map((tool) => (
              <a
                key={tool.slug}
                href={`/tools/${tool.slug}`}
                className="bg-slate-700/50 hover:bg-slate-700 rounded p-3 transition-colors block"
              >
                <div className="font-medium text-blue-400 text-sm">{tool.name}</div>
                <div className="text-xs text-slate-400 mt-1">{tool.desc}</div>
              </a>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div className="bg-slate-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {[
              {
                q: "What is an aspect ratio?",
                a: "An aspect ratio describes the proportional relationship between an image's width and height. For example, 16:9 means for every 16 units of width, there are 9 units of height. It's commonly used in video, photography, and display design to ensure content looks correct across different sizes."
              },
              {
                q: "What aspect ratio is best for YouTube videos?",
                a: "YouTube recommends 16:9 (1920×1080 for Full HD, 3840×2160 for 4K). YouTube Shorts use 9:16 (1080×1920). Using the correct aspect ratio prevents black bars and ensures your video fills the player."
              },
              {
                q: "How do I resize an image without distortion?",
                a: "Maintain the same aspect ratio when resizing. Enter your original dimensions above, then use the resize section to calculate the matching height or width. As long as the ratio stays the same (e.g., 16:9), the image won't stretch or squish."
              },
              {
                q: "What's the difference between 16:9 and 4:3?",
                a: "16:9 is the modern widescreen standard used by HDTVs, monitors, and most video platforms. 4:3 is the older standard (classic TV shape). 16:9 is wider and more cinematic, while 4:3 is more square-shaped. Most content today uses 16:9."
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
