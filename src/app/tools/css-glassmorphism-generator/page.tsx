"use client";

import { useState, useCallback, useMemo, useRef } from "react";
import JsonLd from "@/components/JsonLd";
import RelatedTools from "@/components/RelatedTools";
import ToolBreadcrumb from "@/components/ToolBreadcrumb";
import {
  generateFAQSchema,
  generateWebAppSchema,
  generateBreadcrumbSchema,
} from "@/lib/jsonld";

const hexToRgba = (hex: string, opacity: number): string => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

const PRESET_BACKGROUNDS = [
  { name: "Gradient", value: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" },
  { name: "Sunset", value: "linear-gradient(135deg, #f093fb 0%, #f5576c 50%, #ffd452 100%)" },
  { name: "Ocean", value: "linear-gradient(135deg, #0093E9 0%, #80D0C7 100%)" },
  { name: "Forest", value: "linear-gradient(135deg, #11998e 0%, #38ef7d 100%)" },
  { name: "Night", value: "linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)" },
  { name: "Warm", value: "linear-gradient(135deg, #f97316 0%, #ec4899 100%)" },
];

interface GlassPreset {
  name: string;
  blur: number;
  opacity: number;
  borderOpacity: number;
  borderRadius: number;
  bgColor: string;
}

const GLASS_PRESETS: GlassPreset[] = [
  { name: "Subtle", blur: 8, opacity: 0.1, borderOpacity: 0.15, borderRadius: 12, bgColor: "#ffffff" },
  { name: "Light", blur: 12, opacity: 0.2, borderOpacity: 0.2, borderRadius: 16, bgColor: "#ffffff" },
  { name: "Medium", blur: 16, opacity: 0.25, borderOpacity: 0.25, borderRadius: 16, bgColor: "#ffffff" },
  { name: "Frosted", blur: 24, opacity: 0.15, borderOpacity: 0.3, borderRadius: 20, bgColor: "#ffffff" },
  { name: "Heavy", blur: 32, opacity: 0.35, borderOpacity: 0.4, borderRadius: 16, bgColor: "#ffffff" },
  { name: "Dark", blur: 16, opacity: 0.3, borderOpacity: 0.2, borderRadius: 16, bgColor: "#000000" },
  { name: "Tinted Blue", blur: 16, opacity: 0.2, borderOpacity: 0.25, borderRadius: 16, bgColor: "#3b82f6" },
  { name: "Tinted Rose", blur: 16, opacity: 0.2, borderOpacity: 0.25, borderRadius: 16, bgColor: "#f43f5e" },
];

export default function CSSGlassmorphismGeneratorPage() {
  const [blur, setBlur] = useState(16);
  const [opacity, setOpacity] = useState(0.2);
  const [borderOpacity, setBorderOpacity] = useState(0.25);
  const [borderRadius, setBorderRadius] = useState(16);
  const [bgColor, setBgColor] = useState("#ffffff");
  const [background, setBackground] = useState(PRESET_BACKGROUNDS[0].value);
  const [customImage, setCustomImage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const glassStyle = useMemo(() => {
    const rgba = hexToRgba(bgColor, opacity);
    const borderRgba = hexToRgba(bgColor, borderOpacity);
    return {
      background: rgba,
      backdropFilter: `blur(${blur}px)`,
      WebkitBackdropFilter: `blur(${blur}px)`,
      borderRadius: `${borderRadius}px`,
      border: `1px solid ${borderRgba}`,
    };
  }, [blur, opacity, borderOpacity, borderRadius, bgColor]);

  const cssCode = useMemo(() => {
    const rgba = hexToRgba(bgColor, opacity);
    const borderRgba = hexToRgba(bgColor, borderOpacity);
    return [
      `background: ${rgba};`,
      `backdrop-filter: blur(${blur}px);`,
      `-webkit-backdrop-filter: blur(${blur}px);`,
      `border-radius: ${borderRadius}px;`,
      `border: 1px solid ${borderRgba};`,
    ].join("\n");
  }, [blur, opacity, borderOpacity, borderRadius, bgColor]);

  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setCustomImage(ev.target?.result as string);
    };
    reader.readAsDataURL(file);
  }, []);

  const clearImage = useCallback(() => {
    setCustomImage(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  const applyPreset = useCallback((preset: GlassPreset) => {
    setBlur(preset.blur);
    setOpacity(preset.opacity);
    setBorderOpacity(preset.borderOpacity);
    setBorderRadius(preset.borderRadius);
    setBgColor(preset.bgColor);
  }, []);

  const copyCSS = useCallback(async () => {
    await navigator.clipboard.writeText(cssCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [cssCode]);

  const previewBg = customImage
    ? `url(${customImage}) center/cover no-repeat`
    : background;

  return (
    <>
      <title>CSS Glassmorphism Generator — Visual Editor | DevTools</title>
      <meta
        name="description"
        content="Create CSS glassmorphism effects visually with backdrop-filter blur, transparency, border, and border radius controls. Copy CSS code with Safari support."
      />
      <JsonLd
        data={[
          generateWebAppSchema({
            slug: "css-glassmorphism-generator",
            name: "CSS Glassmorphism Generator",
            description: "Create frosted glass UI effects with backdrop-filter blur, transparency, and border controls",
            category: "css",
          }),
          generateBreadcrumbSchema({
            slug: "css-glassmorphism-generator",
            name: "CSS Glassmorphism Generator",
            description: "Create frosted glass UI effects with backdrop-filter blur, transparency, and border controls",
            category: "css",
          }),
          generateFAQSchema([
            {
              question: "What is glassmorphism in CSS?",
              answer: "Glassmorphism is a UI design trend that creates a frosted glass effect using CSS backdrop-filter: blur() combined with a semi-transparent background. The blurred background shows through the element, creating a modern, layered look popular in dashboards, cards, and navigation bars.",
            },
            {
              question: "How does backdrop-filter work?",
              answer: "The CSS backdrop-filter property applies graphical effects like blur, brightness, or contrast to the area behind an element. For glassmorphism, backdrop-filter: blur() is used to blur whatever appears behind the element, while the element itself has a semi-transparent background color.",
            },
            {
              question: "Is backdrop-filter supported in all browsers?",
              answer: "backdrop-filter is supported in Chrome, Edge, Safari, Firefox, and Opera. Safari requires the -webkit-backdrop-filter prefix. This generator includes both the standard and -webkit- prefixed versions for maximum compatibility. Global browser support is over 95%.",
            },
            {
              question: "How do I create a glassmorphism effect?",
              answer: "Combine three CSS properties: a semi-transparent background (e.g., rgba(255, 255, 255, 0.2)), backdrop-filter: blur(16px) for the frosted effect, and a subtle border with a semi-transparent color. Add border-radius for rounded corners. The element must be placed over a colorful background for the effect to be visible.",
            },
          ]),
        ]}
      />

      <div className="min-h-screen bg-slate-900 text-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <ToolBreadcrumb slug="css-glassmorphism-generator" />

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
              CSS Glassmorphism Generator
            </h1>
            <p className="text-slate-400 max-w-2xl text-lg">
              Create frosted glass UI effects visually. Adjust blur, transparency,
              border, and radius — then copy the CSS code with Safari support.
            </p>
          </div>

          {/* Preview + Controls */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Live Preview */}
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
              <h2 className="text-sm font-medium text-slate-400 mb-4">Live Preview</h2>
              <div
                className="rounded-lg flex items-center justify-center overflow-hidden"
                style={{ background: previewBg, height: "320px" }}
              >
                <div
                  className="w-64 h-48 flex flex-col items-center justify-center text-center px-6"
                  style={glassStyle}
                >
                  <span className="text-white font-semibold text-lg mb-1">Glass Card</span>
                  <span className="text-white/70 text-sm">
                    Frosted glass effect using backdrop-filter
                  </span>
                </div>
              </div>

              {/* Background Selection */}
              <div className="mt-4">
                <label className="block text-xs text-slate-400 mb-2">Background</label>
                <div className="flex gap-2 flex-wrap">
                  {PRESET_BACKGROUNDS.map((bg) => (
                    <button
                      key={bg.name}
                      onClick={() => { setBackground(bg.value); clearImage(); }}
                      className={`w-8 h-8 rounded-md border-2 transition-colors ${
                        !customImage && background === bg.value
                          ? "border-blue-500"
                          : "border-slate-600 hover:border-slate-400"
                      }`}
                      style={{ background: bg.value }}
                      title={bg.name}
                    />
                  ))}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className={`h-8 px-3 rounded-md border-2 text-xs transition-colors ${
                      customImage
                        ? "border-blue-500 bg-slate-700 text-white"
                        : "border-slate-600 bg-slate-800 text-slate-400 hover:border-slate-400"
                    }`}
                  >
                    {customImage ? "Image ✓" : "Upload Image"}
                  </button>
                  {customImage && (
                    <button
                      onClick={clearImage}
                      className="h-8 px-2 rounded-md border-2 border-slate-600 bg-slate-800 text-slate-500 hover:text-red-400 hover:border-red-400 text-xs transition-colors"
                    >
                      Clear
                    </button>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>
            </div>

            {/* Controls */}
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
              <h2 className="text-sm font-medium text-slate-400 mb-4">Controls</h2>

              <div className="space-y-5">
                {/* Blur */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-sm font-medium text-slate-300">Blur</label>
                    <span className="text-xs font-mono text-slate-400">{blur}px</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={50}
                    value={blur}
                    onChange={(e) => setBlur(parseInt(e.target.value, 10))}
                    className="w-full accent-blue-500"
                  />
                </div>

                {/* Transparency */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-sm font-medium text-slate-300">Transparency</label>
                    <span className="text-xs font-mono text-slate-400">{Math.round(opacity * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={Math.round(opacity * 100)}
                    onChange={(e) => setOpacity(parseInt(e.target.value, 10) / 100)}
                    className="w-full accent-blue-500"
                  />
                </div>

                {/* Border Opacity */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-sm font-medium text-slate-300">Border Opacity</label>
                    <span className="text-xs font-mono text-slate-400">{Math.round(borderOpacity * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={Math.round(borderOpacity * 100)}
                    onChange={(e) => setBorderOpacity(parseInt(e.target.value, 10) / 100)}
                    className="w-full accent-blue-500"
                  />
                </div>

                {/* Border Radius */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-sm font-medium text-slate-300">Border Radius</label>
                    <span className="text-xs font-mono text-slate-400">{borderRadius}px</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={50}
                    value={borderRadius}
                    onChange={(e) => setBorderRadius(parseInt(e.target.value, 10))}
                    className="w-full accent-blue-500"
                  />
                </div>

                {/* Background Color */}
                <div>
                  <label className="text-sm font-medium text-slate-300 mb-1 block">Background Color</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={bgColor}
                      onChange={(e) => setBgColor(e.target.value)}
                      className="w-10 h-10 rounded border border-slate-600 cursor-pointer bg-transparent"
                    />
                    <span className="text-sm font-mono text-slate-400">{bgColor}</span>
                    <div className="flex gap-2 ml-auto">
                      <button
                        onClick={() => setBgColor("#ffffff")}
                        className={`w-7 h-7 rounded-full border-2 ${bgColor === "#ffffff" ? "border-blue-500" : "border-slate-600"}`}
                        style={{ background: "#ffffff" }}
                        title="White"
                      />
                      <button
                        onClick={() => setBgColor("#000000")}
                        className={`w-7 h-7 rounded-full border-2 ${bgColor === "#000000" ? "border-blue-500" : "border-slate-600"}`}
                        style={{ background: "#000000" }}
                        title="Black"
                      />
                      <button
                        onClick={() => setBgColor("#3b82f6")}
                        className={`w-7 h-7 rounded-full border-2 ${bgColor === "#3b82f6" ? "border-blue-500" : "border-slate-600"}`}
                        style={{ background: "#3b82f6" }}
                        title="Blue"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* CSS Output */}
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 mb-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-white">CSS Code</h2>
              <button
                onClick={copyCSS}
                className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-lg transition-colors font-medium"
              >
                {copied ? "Copied!" : "Copy CSS"}
              </button>
            </div>
            <div className="bg-slate-900 rounded-lg p-4">
              <code className="text-sm font-mono text-green-400 whitespace-pre select-all">
                {cssCode}
              </code>
            </div>

            {/* Browser Support Note */}
            <div className="mt-4 bg-slate-900/60 border border-slate-700 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <span className="text-amber-400 text-lg leading-none mt-0.5">&#9432;</span>
                <div>
                  <p className="text-sm text-slate-300 font-medium">Browser Support</p>
                  <p className="text-sm text-slate-400 mt-1">
                    <code className="text-xs bg-slate-800 px-1.5 py-0.5 rounded">backdrop-filter</code> is supported
                    in Chrome 76+, Edge 79+, Firefox 103+, Safari 9+ (with <code className="text-xs bg-slate-800 px-1.5 py-0.5 rounded">-webkit-</code> prefix),
                    and Opera 63+. Global support is over 95%.
                    The generated CSS includes the <code className="text-xs bg-slate-800 px-1.5 py-0.5 rounded">-webkit-backdrop-filter</code> prefix
                    for Safari compatibility.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Presets */}
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 mb-6">
            <h2 className="text-lg font-semibold text-white mb-4">Presets</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {GLASS_PRESETS.map((preset) => {
                const previewRgba = hexToRgba(preset.bgColor, preset.opacity);
                const previewBorder = hexToRgba(preset.bgColor, preset.borderOpacity);
                return (
                  <button
                    key={preset.name}
                    onClick={() => applyPreset(preset)}
                    className="group"
                  >
                    <div
                      className="h-20 rounded-lg border border-slate-600 group-hover:border-blue-500 transition-colors mb-1 flex items-center justify-center overflow-hidden"
                      style={{ background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" }}
                    >
                      <div
                        className="w-16 h-12 rounded flex items-center justify-center"
                        style={{
                          background: previewRgba,
                          backdropFilter: `blur(${preset.blur}px)`,
                          WebkitBackdropFilter: `blur(${preset.blur}px)`,
                          border: `1px solid ${previewBorder}`,
                          borderRadius: `${Math.min(preset.borderRadius, 12)}px`,
                        }}
                      >
                        <span className="text-white/80 text-[10px] font-medium">{preset.name}</span>
                      </div>
                    </div>
                    <span className="text-xs text-slate-400 group-hover:text-white transition-colors">
                      {preset.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Properties Reference */}
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Glassmorphism Properties</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left py-2 text-slate-400 font-medium">Property</th>
                    <th className="text-left py-2 text-slate-400 font-medium">Description</th>
                    <th className="text-left py-2 text-slate-400 font-medium">Typical Values</th>
                  </tr>
                </thead>
                <tbody className="text-slate-300">
                  {[
                    ["backdrop-filter: blur()", "Blurs the area behind the element", "4px – 32px"],
                    ["background: rgba()", "Semi-transparent background color", "0.05 – 0.4 alpha"],
                    ["border", "Subtle border for edge definition", "1px solid rgba(255,255,255,0.2)"],
                    ["border-radius", "Rounded corners for the glass card", "8px – 24px"],
                    ["-webkit-backdrop-filter", "Safari prefix for backdrop-filter", "Same as backdrop-filter"],
                  ].map((row) => (
                    <tr key={row[0]} className="border-b border-slate-700/50">
                      <td className="py-2 font-medium text-white font-mono text-xs">{row[0]}</td>
                      <td className="py-2">{row[1]}</td>
                      <td className="py-2 text-slate-400">{row[2]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <RelatedTools currentSlug="css-glassmorphism-generator" />

          {/* FAQ */}
          <section className="mt-16 border-t border-slate-700 pt-10">
            <h2 className="text-2xl font-bold text-white mb-6">
              Frequently Asked Questions
            </h2>
            <div className="space-y-6">
              {[
                {
                  q: "What is glassmorphism in CSS?",
                  a: "Glassmorphism is a UI design trend that creates a frosted glass effect using CSS backdrop-filter: blur() combined with a semi-transparent background. The blurred background shows through the element, creating a modern, layered look popular in dashboards, cards, and navigation bars.",
                },
                {
                  q: "How does backdrop-filter work?",
                  a: "The CSS backdrop-filter property applies graphical effects like blur, brightness, or contrast to the area behind an element. For glassmorphism, backdrop-filter: blur() is used to blur whatever appears behind the element, while the element itself has a semi-transparent background color.",
                },
                {
                  q: "Is backdrop-filter supported in all browsers?",
                  a: "backdrop-filter is supported in Chrome, Edge, Safari, Firefox, and Opera. Safari requires the -webkit-backdrop-filter prefix. This generator includes both the standard and -webkit- prefixed versions for maximum compatibility. Global browser support is over 95%.",
                },
                {
                  q: "How do I create a glassmorphism effect?",
                  a: "Combine three CSS properties: a semi-transparent background (e.g., rgba(255, 255, 255, 0.2)), backdrop-filter: blur(16px) for the frosted effect, and a subtle border with a semi-transparent color. Add border-radius for rounded corners. The element must be placed over a colorful background for the effect to be visible.",
                },
              ].map((item) => (
                <div key={item.q}>
                  <h3 className="text-lg font-semibold text-white mb-2">{item.q}</h3>
                  <p className="text-slate-400">{item.a}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
