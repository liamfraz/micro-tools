"use client";

import { useState, useCallback } from "react";
import JsonLd from "@/components/JsonLd";
import RelatedTools from "@/components/RelatedTools";
import {
  generateFAQSchema,
  generateWebAppSchema,
  generateBreadcrumbSchema,
} from "@/lib/jsonld";

interface RGB { r: number; g: number; b: number }
interface HSL { h: number; s: number; l: number }
interface HSV { h: number; s: number; v: number }
interface CMYK { c: number; m: number; y: number; k: number }

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

function hexToRgb(hex: string): RGB | null {
  const clean = hex.replace(/^#/, "");
  let r: number, g: number, b: number;
  if (clean.length === 3) {
    r = parseInt(clean[0] + clean[0], 16);
    g = parseInt(clean[1] + clean[1], 16);
    b = parseInt(clean[2] + clean[2], 16);
  } else if (clean.length === 6) {
    r = parseInt(clean.substring(0, 2), 16);
    g = parseInt(clean.substring(2, 4), 16);
    b = parseInt(clean.substring(4, 6), 16);
  } else {
    return null;
  }
  if (isNaN(r) || isNaN(g) || isNaN(b)) return null;
  return { r, g, b };
}

function rgbToHex(rgb: RGB): string {
  const toHex = (n: number) => clamp(Math.round(n), 0, 255).toString(16).padStart(2, "0");
  return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`;
}

function rgbToHsl(rgb: RGB): HSL {
  const r = rgb.r / 255, g = rgb.g / 255, b = rgb.b / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0, s = 0;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (max === g) h = ((b - r) / d + 2) / 6;
    else h = ((r - g) / d + 4) / 6;
  }

  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

function hslToRgb(hsl: HSL): RGB {
  const h = hsl.h / 360, s = hsl.s / 100, l = hsl.l / 100;

  if (s === 0) {
    const v = Math.round(l * 255);
    return { r: v, g: v, b: v };
  }

  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };

  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;

  return {
    r: Math.round(hue2rgb(p, q, h + 1 / 3) * 255),
    g: Math.round(hue2rgb(p, q, h) * 255),
    b: Math.round(hue2rgb(p, q, h - 1 / 3) * 255),
  };
}

function rgbToHsv(rgb: RGB): HSV {
  const r = rgb.r / 255, g = rgb.g / 255, b = rgb.b / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const d = max - min;
  let h = 0;
  const s = max === 0 ? 0 : d / max;
  const v = max;

  if (max !== min) {
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (max === g) h = ((b - r) / d + 2) / 6;
    else h = ((r - g) / d + 4) / 6;
  }

  return { h: Math.round(h * 360), s: Math.round(s * 100), v: Math.round(v * 100) };
}

function hsvToRgb(hsv: HSV): RGB {
  const h = hsv.h / 360, s = hsv.s / 100, v = hsv.v / 100;
  const i = Math.floor(h * 6);
  const f = h * 6 - i;
  const p = v * (1 - s);
  const q = v * (1 - f * s);
  const t = v * (1 - (1 - f) * s);

  let r = 0, g = 0, b = 0;
  switch (i % 6) {
    case 0: r = v; g = t; b = p; break;
    case 1: r = q; g = v; b = p; break;
    case 2: r = p; g = v; b = t; break;
    case 3: r = p; g = q; b = v; break;
    case 4: r = t; g = p; b = v; break;
    case 5: r = v; g = p; b = q; break;
  }

  return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) };
}

function rgbToCmyk(rgb: RGB): CMYK {
  const r = rgb.r / 255, g = rgb.g / 255, b = rgb.b / 255;
  const k = 1 - Math.max(r, g, b);
  if (k === 1) return { c: 0, m: 0, y: 0, k: 100 };
  return {
    c: Math.round(((1 - r - k) / (1 - k)) * 100),
    m: Math.round(((1 - g - k) / (1 - k)) * 100),
    y: Math.round(((1 - b - k) / (1 - k)) * 100),
    k: Math.round(k * 100),
  };
}

function cmykToRgb(cmyk: CMYK): RGB {
  const c = cmyk.c / 100, m = cmyk.m / 100, y = cmyk.y / 100, k = cmyk.k / 100;
  return {
    r: Math.round(255 * (1 - c) * (1 - k)),
    g: Math.round(255 * (1 - m) * (1 - k)),
    b: Math.round(255 * (1 - y) * (1 - k)),
  };
}

function getContrastColor(rgb: RGB): string {
  const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
  return luminance > 0.5 ? "#000000" : "#ffffff";
}

const PRESETS = [
  { name: "Red", hex: "#ff0000" },
  { name: "Green", hex: "#00ff00" },
  { name: "Blue", hex: "#0000ff" },
  { name: "Yellow", hex: "#ffff00" },
  { name: "Cyan", hex: "#00ffff" },
  { name: "Magenta", hex: "#ff00ff" },
  { name: "White", hex: "#ffffff" },
  { name: "Black", hex: "#000000" },
  { name: "Coral", hex: "#ff6b6b" },
  { name: "Teal", hex: "#20c997" },
  { name: "Purple", hex: "#7950f2" },
  { name: "Orange", hex: "#fd7e14" },
];

export default function ColorConverterPage() {
  const [rgb, setRgb] = useState<RGB>({ r: 59, g: 130, b: 246 });
  const [hexInput, setHexInput] = useState("#3b82f6");
  const [copied, setCopied] = useState<string | null>(null);

  const hex = rgbToHex(rgb);
  const hsl = rgbToHsl(rgb);
  const hsv = rgbToHsv(rgb);
  const cmyk = rgbToCmyk(rgb);
  const contrastColor = getContrastColor(rgb);

  const updateFromRgb = useCallback((newRgb: RGB) => {
    const clamped = {
      r: clamp(newRgb.r, 0, 255),
      g: clamp(newRgb.g, 0, 255),
      b: clamp(newRgb.b, 0, 255),
    };
    setRgb(clamped);
    setHexInput(rgbToHex(clamped));
  }, []);

  const updateFromHex = useCallback((value: string) => {
    setHexInput(value);
    const parsed = hexToRgb(value);
    if (parsed) setRgb(parsed);
  }, []);

  const updateFromHsl = useCallback((newHsl: HSL) => {
    const clamped = {
      h: clamp(newHsl.h, 0, 360),
      s: clamp(newHsl.s, 0, 100),
      l: clamp(newHsl.l, 0, 100),
    };
    const newRgb = hslToRgb(clamped);
    setRgb(newRgb);
    setHexInput(rgbToHex(newRgb));
  }, []);

  const updateFromHsv = useCallback((newHsv: HSV) => {
    const clamped = {
      h: clamp(newHsv.h, 0, 360),
      s: clamp(newHsv.s, 0, 100),
      v: clamp(newHsv.v, 0, 100),
    };
    const newRgb = hsvToRgb(clamped);
    setRgb(newRgb);
    setHexInput(rgbToHex(newRgb));
  }, []);

  const updateFromCmyk = useCallback((newCmyk: CMYK) => {
    const clamped = {
      c: clamp(newCmyk.c, 0, 100),
      m: clamp(newCmyk.m, 0, 100),
      y: clamp(newCmyk.y, 0, 100),
      k: clamp(newCmyk.k, 0, 100),
    };
    const newRgb = cmykToRgb(clamped);
    setRgb(newRgb);
    setHexInput(rgbToHex(newRgb));
  }, []);

  const copyValue = useCallback(async (text: string, label: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  }, []);

  const formats = [
    { label: "HEX", value: hex.toUpperCase() },
    { label: "RGB", value: `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})` },
    { label: "HSL", value: `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)` },
    { label: "HSV", value: `hsv(${hsv.h}, ${hsv.s}%, ${hsv.v}%)` },
    { label: "CMYK", value: `cmyk(${cmyk.c}%, ${cmyk.m}%, ${cmyk.y}%, ${cmyk.k}%)` },
  ];

  return (
    <>
      <title>Color Converter (HEX, RGB, HSL, HSV, CMYK) - Free Online Tool | DevTools Hub</title>
      <meta
        name="description"
        content="Convert colors between HEX, RGB, HSL, HSV, and CMYK formats instantly. Visual color picker with live preview. All processing in your browser."
      />
      <JsonLd
        data={[
          generateWebAppSchema({
            slug: "color-converter",
            name: "Color Converter",
            description: "Convert colors between HEX, RGB, HSL, and CMYK formats",
            category: "design",
          }),
          generateBreadcrumbSchema({
            slug: "color-converter",
            name: "Color Converter",
            description: "Convert colors between HEX, RGB, HSL, and CMYK formats",
            category: "design",
          }),
          generateFAQSchema([
            { question: "What is the difference between HSL and HSV?", answer: "HSL (Hue, Saturation, Lightness) and HSV (Hue, Saturation, Value) are both cylindrical color models, but they define brightness differently. In HSL, 50% lightness is the pure color, while 0% is black and 100% is white. In HSV, 100% value is the brightest version of the color. HSL is more common in CSS, while HSV is used in design tools like Photoshop and Figma." },
            { question: "When should I use CMYK instead of RGB?", answer: "Use RGB for anything displayed on a screen (websites, apps, digital media). Use CMYK for anything that will be physically printed (business cards, flyers, packaging). CMYK is a subtractive color model optimized for ink mixing, while RGB is additive and optimized for light emission. Colors may look different between RGB and CMYK because screens and printers produce color differently." },
            { question: "Why does my color look different in CMYK?", answer: "RGB screens can display a wider range of colors (gamut) than CMYK printers. Some vibrant RGB colors -- especially bright blues, greens, and saturated reds -- cannot be exactly reproduced in CMYK. The converter shows the closest CMYK approximation, but always verify with a physical proof before printing." },
            { question: "Is my color data safe?", answer: "Yes. All color conversions happen entirely in your browser using JavaScript math functions. No data is sent to any server." },
          ]),
        ]}
      />

      <div className="min-h-screen bg-slate-900 text-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Breadcrumb */}
          <nav className="text-sm text-slate-400 mb-6" aria-label="Breadcrumb">
            <ol className="flex items-center gap-2">
              <li>
                <a href="/" className="hover:text-white transition-colors">Home</a>
              </li>
              <li><span className="mx-1">/</span></li>
              <li>
                <a href="/tools" className="hover:text-white transition-colors">Design Tools</a>
              </li>
              <li><span className="mx-1">/</span></li>
              <li className="text-slate-200">Color Converter</li>
            </ol>
          </nav>

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
              Color Converter
            </h1>
            <p className="text-slate-400 max-w-2xl text-lg">
              Convert colors between HEX, RGB, HSL, HSV, and CMYK formats.
              Pick a color or enter values in any format — all others update
              instantly. Everything runs in your browser.
            </p>
          </div>

          {/* Color Preview + Picker */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <div className="lg:col-span-1">
              <div
                className="w-full h-48 rounded-lg border border-slate-700 flex items-center justify-center text-lg font-mono font-bold mb-4"
                style={{ backgroundColor: hex, color: contrastColor }}
              >
                {hex.toUpperCase()}
              </div>

              <div className="mb-4">
                <label className="text-sm text-slate-400 mb-1 block">Color Picker</label>
                <input
                  type="color"
                  value={hex}
                  onChange={(e) => updateFromHex(e.target.value)}
                  className="w-full h-12 rounded cursor-pointer bg-slate-800 border border-slate-600"
                />
              </div>

              <div>
                <label className="text-xs text-slate-500 mb-2 block">Quick Colors</label>
                <div className="grid grid-cols-6 gap-2">
                  {PRESETS.map((p) => (
                    <button
                      key={p.name}
                      onClick={() => updateFromHex(p.hex)}
                      className="w-full aspect-square rounded border border-slate-600 hover:ring-2 hover:ring-blue-500 transition-all"
                      style={{ backgroundColor: p.hex }}
                      title={p.name}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Input Panels */}
            <div className="lg:col-span-2 space-y-4">
              {/* HEX */}
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
                <label className="text-sm font-semibold text-white mb-2 block">HEX</label>
                <input
                  type="text"
                  value={hexInput}
                  onChange={(e) => updateFromHex(e.target.value)}
                  placeholder="#3b82f6"
                  className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 font-mono text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* RGB */}
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
                <label className="text-sm font-semibold text-white mb-2 block">RGB</label>
                <div className="grid grid-cols-3 gap-3">
                  {(["r", "g", "b"] as const).map((ch) => (
                    <div key={ch}>
                      <label className="text-xs text-slate-500 uppercase">{ch}</label>
                      <input
                        type="number"
                        min={0}
                        max={255}
                        value={rgb[ch]}
                        onChange={(e) => updateFromRgb({ ...rgb, [ch]: Number(e.target.value) || 0 })}
                        className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 font-mono text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* HSL */}
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
                <label className="text-sm font-semibold text-white mb-2 block">HSL</label>
                <div className="grid grid-cols-3 gap-3">
                  {([
                    { key: "h" as const, label: "H", max: 360, unit: "°" },
                    { key: "s" as const, label: "S", max: 100, unit: "%" },
                    { key: "l" as const, label: "L", max: 100, unit: "%" },
                  ]).map((field) => (
                    <div key={field.key}>
                      <label className="text-xs text-slate-500">{field.label} ({field.unit})</label>
                      <input
                        type="number"
                        min={0}
                        max={field.max}
                        value={hsl[field.key]}
                        onChange={(e) => updateFromHsl({ ...hsl, [field.key]: Number(e.target.value) || 0 })}
                        className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 font-mono text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* HSV */}
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
                <label className="text-sm font-semibold text-white mb-2 block">HSV / HSB</label>
                <div className="grid grid-cols-3 gap-3">
                  {([
                    { key: "h" as const, label: "H", max: 360, unit: "°" },
                    { key: "s" as const, label: "S", max: 100, unit: "%" },
                    { key: "v" as const, label: "V", max: 100, unit: "%" },
                  ]).map((field) => (
                    <div key={field.key}>
                      <label className="text-xs text-slate-500">{field.label} ({field.unit})</label>
                      <input
                        type="number"
                        min={0}
                        max={field.max}
                        value={hsv[field.key]}
                        onChange={(e) => updateFromHsv({ ...hsv, [field.key]: Number(e.target.value) || 0 })}
                        className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 font-mono text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* CMYK */}
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
                <label className="text-sm font-semibold text-white mb-2 block">CMYK</label>
                <div className="grid grid-cols-4 gap-3">
                  {(["c", "m", "y", "k"] as const).map((ch) => (
                    <div key={ch}>
                      <label className="text-xs text-slate-500 uppercase">{ch} (%)</label>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={cmyk[ch]}
                        onChange={(e) => updateFromCmyk({ ...cmyk, [ch]: Number(e.target.value) || 0 })}
                        className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 font-mono text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Copy All Formats */}
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-5 mb-6">
            <h2 className="text-sm font-semibold text-white mb-3">All Formats</h2>
            <div className="space-y-2">
              {formats.map((fmt) => (
                <div key={fmt.label} className="flex items-center gap-3 bg-slate-900 rounded px-3 py-2">
                  <span className="text-xs text-slate-500 w-12 shrink-0">{fmt.label}</span>
                  <code className="text-sm font-mono text-green-400 flex-1 select-all">
                    {fmt.value}
                  </code>
                  <button
                    onClick={() => copyValue(fmt.value, fmt.label)}
                    className="text-xs text-slate-400 hover:text-white transition-colors shrink-0"
                  >
                    {copied === fmt.label ? "Copied!" : "Copy"}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Color Model Reference */}
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 mb-6">
            <h2 className="text-lg font-semibold text-white mb-4">Color Model Reference</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
              {[
                { name: "HEX", desc: "Web standard. 6-digit hexadecimal (#RRGGBB). Used in CSS, HTML, design tools." },
                { name: "RGB", desc: "Additive color model. Red, Green, Blue (0-255). Used in screens, CSS, web design." },
                { name: "HSL", desc: "Hue (0-360°), Saturation (0-100%), Lightness (0-100%). Intuitive for CSS adjustments." },
                { name: "HSV/HSB", desc: "Hue, Saturation, Value/Brightness. Used in Photoshop, Figma, and design tools." },
                { name: "CMYK", desc: "Subtractive model for print. Cyan, Magenta, Yellow, Key (Black). Used in printing." },
              ].map((model) => (
                <div key={model.name}>
                  <h3 className="text-sm font-medium text-white mb-1">{model.name}</h3>
                  <p className="text-xs text-slate-400">{model.desc}</p>
                </div>
              ))}
            </div>
          </div>

          <RelatedTools currentSlug="color-converter" />

          {/* FAQ Section */}
          <section className="mt-16 border-t border-slate-700 pt-10">
            <h2 className="text-2xl font-bold text-white mb-6">
              Frequently Asked Questions
            </h2>

            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  What is the difference between HSL and HSV?
                </h3>
                <p className="text-slate-400">
                  HSL (Hue, Saturation, Lightness) and HSV (Hue, Saturation, Value)
                  are both cylindrical color models, but they define brightness
                  differently. In HSL, 50% lightness is the pure color, while 0% is
                  black and 100% is white. In HSV, 100% value is the brightest
                  version of the color. HSL is more common in CSS, while HSV is
                  used in design tools like Photoshop and Figma.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  When should I use CMYK instead of RGB?
                </h3>
                <p className="text-slate-400">
                  Use RGB for anything displayed on a screen (websites, apps,
                  digital media). Use CMYK for anything that will be physically
                  printed (business cards, flyers, packaging). CMYK is a
                  subtractive color model optimized for ink mixing, while RGB is
                  additive and optimized for light emission. Colors may look
                  different between RGB and CMYK because screens and printers
                  produce color differently.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Why does my color look different in CMYK?
                </h3>
                <p className="text-slate-400">
                  RGB screens can display a wider range of colors (gamut) than CMYK
                  printers. Some vibrant RGB colors — especially bright blues,
                  greens, and saturated reds — cannot be exactly reproduced in CMYK.
                  The converter shows the closest CMYK approximation, but always
                  verify with a physical proof before printing.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Is my color data safe?
                </h3>
                <p className="text-slate-400">
                  Yes. All color conversions happen entirely in your browser using
                  JavaScript math functions. No data is sent to any server.
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
