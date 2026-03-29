"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import JsonLd from "@/components/JsonLd";
import RelatedTools from "@/components/RelatedTools";
import ToolBreadcrumb from "@/components/ToolBreadcrumb";
import {
  generateFAQSchema,
  generateWebAppSchema,
  generateBreadcrumbSchema,
} from "@/lib/jsonld";

/* ─── Types ─── */
interface RGB {
  r: number;
  g: number;
  b: number;
}
interface HSL {
  h: number;
  s: number;
  l: number;
}
interface PaletteColor {
  hex: string;
  rgb: RGB;
  hsl: HSL;
  tailwind: string;
}

type HarmonyMode =
  | "complementary"
  | "analogous"
  | "triadic"
  | "split-complementary"
  | "monochromatic";

/* ─── Color conversion helpers ─── */
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
  const toHex = (n: number) =>
    Math.max(0, Math.min(255, Math.round(n)))
      .toString(16)
      .padStart(2, "0");
  return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`;
}

function rgbToHsl(rgb: RGB): HSL {
  const r = rgb.r / 255,
    g = rgb.g / 255,
    b = rgb.b / 255;
  const max = Math.max(r, g, b),
    min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0,
    s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (max === g) h = ((b - r) / d + 2) / 6;
    else h = ((r - g) / d + 4) / 6;
  }
  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

function hslToRgb(hsl: HSL): RGB {
  const h = hsl.h / 360,
    s = hsl.s / 100,
    l = hsl.l / 100;
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

/* ─── Tailwind color approximation ─── */
const TAILWIND_COLORS: Record<string, Record<number, string>> = {
  slate: { 50: "#f8fafc", 100: "#f1f5f9", 200: "#e2e8f0", 300: "#cbd5e1", 400: "#94a3b8", 500: "#64748b", 600: "#475569", 700: "#334155", 800: "#1e293b", 900: "#0f172a", 950: "#020617" },
  red: { 50: "#fef2f2", 100: "#fee2e2", 200: "#fecaca", 300: "#fca5a5", 400: "#f87171", 500: "#ef4444", 600: "#dc2626", 700: "#b91c1c", 800: "#991b1b", 900: "#7f1d1d", 950: "#450a0a" },
  orange: { 50: "#fff7ed", 100: "#ffedd5", 200: "#fed7aa", 300: "#fdba74", 400: "#fb923c", 500: "#f97316", 600: "#ea580c", 700: "#c2410c", 800: "#9a3412", 900: "#7c2d12", 950: "#431407" },
  amber: { 50: "#fffbeb", 100: "#fef3c7", 200: "#fde68a", 300: "#fcd34d", 400: "#fbbf24", 500: "#f59e0b", 600: "#d97706", 700: "#b45309", 800: "#92400e", 900: "#78350f", 950: "#451a03" },
  yellow: { 50: "#fefce8", 100: "#fef9c3", 200: "#fef08a", 300: "#fde047", 400: "#facc15", 500: "#eab308", 600: "#ca8a04", 700: "#a16207", 800: "#854d0e", 900: "#713f12", 950: "#422006" },
  lime: { 50: "#f7fee7", 100: "#ecfccb", 200: "#d9f99d", 300: "#bef264", 400: "#a3e635", 500: "#84cc16", 600: "#65a30d", 700: "#4d7c0f", 800: "#3f6212", 900: "#365314", 950: "#1a2e05" },
  green: { 50: "#f0fdf4", 100: "#dcfce7", 200: "#bbf7d0", 300: "#86efac", 400: "#4ade80", 500: "#22c55e", 600: "#16a34a", 700: "#15803d", 800: "#166534", 900: "#14532d", 950: "#052e16" },
  emerald: { 50: "#ecfdf5", 100: "#d1fae5", 200: "#a7f3d0", 300: "#6ee7b7", 400: "#34d399", 500: "#10b981", 600: "#059669", 700: "#047857", 800: "#065f46", 900: "#064e3b", 950: "#022c22" },
  teal: { 50: "#f0fdfa", 100: "#ccfbf1", 200: "#99f6e4", 300: "#5eead4", 400: "#2dd4bf", 500: "#14b8a6", 600: "#0d9488", 700: "#0f766e", 800: "#115e59", 900: "#134e4a", 950: "#042f2e" },
  cyan: { 50: "#ecfeff", 100: "#cffafe", 200: "#a5f3fc", 300: "#67e8f9", 400: "#22d3ee", 500: "#06b6d4", 600: "#0891b2", 700: "#0e7490", 800: "#155e75", 900: "#164e63", 950: "#083344" },
  sky: { 50: "#f0f9ff", 100: "#e0f2fe", 200: "#bae6fd", 300: "#7dd3fc", 400: "#38bdf8", 500: "#0ea5e9", 600: "#0284c7", 700: "#0369a1", 800: "#075985", 900: "#0c4a6e", 950: "#082f49" },
  blue: { 50: "#eff6ff", 100: "#dbeafe", 200: "#bfdbfe", 300: "#93c5fd", 400: "#60a5fa", 500: "#3b82f6", 600: "#2563eb", 700: "#1d4ed8", 800: "#1e40af", 900: "#1e3a8a", 950: "#172554" },
  indigo: { 50: "#eef2ff", 100: "#e0e7ff", 200: "#c7d2fe", 300: "#a5b4fc", 400: "#818cf8", 500: "#6366f1", 600: "#4f46e5", 700: "#4338ca", 800: "#3730a3", 900: "#312e81", 950: "#1e1b4b" },
  violet: { 50: "#f5f3ff", 100: "#ede9fe", 200: "#ddd6fe", 300: "#c4b5fd", 400: "#a78bfa", 500: "#8b5cf6", 600: "#7c3aed", 700: "#6d28d9", 800: "#5b21b6", 900: "#4c1d95", 950: "#2e1065" },
  purple: { 50: "#faf5ff", 100: "#f3e8ff", 200: "#e9d5ff", 300: "#d8b4fe", 400: "#c084fc", 500: "#a855f7", 600: "#9333ea", 700: "#7e22ce", 800: "#6b21a8", 900: "#581c87", 950: "#3b0764" },
  fuchsia: { 50: "#fdf4ff", 100: "#fae8ff", 200: "#f5d0fe", 300: "#f0abfc", 400: "#e879f9", 500: "#d946ef", 600: "#c026d3", 700: "#a21caf", 800: "#86198f", 900: "#701a75", 950: "#4a044e" },
  pink: { 50: "#fdf2f8", 100: "#fce7f3", 200: "#fbcfe8", 300: "#f9a8d4", 400: "#f472b6", 500: "#ec4899", 600: "#db2777", 700: "#be185d", 800: "#9d174d", 900: "#831843", 950: "#500724" },
  rose: { 50: "#fff1f2", 100: "#ffe4e6", 200: "#fecdd3", 300: "#fda4af", 400: "#fb7185", 500: "#f43f5e", 600: "#e11d48", 700: "#be123c", 800: "#9f1239", 900: "#881337", 950: "#4c0519" },
};

function colorDistance(hex1: string, hex2: string): number {
  const a = hexToRgb(hex1)!;
  const b = hexToRgb(hex2)!;
  return Math.sqrt((a.r - b.r) ** 2 + (a.g - b.g) ** 2 + (a.b - b.b) ** 2);
}

function nearestTailwind(hex: string): string {
  let best = "slate-500";
  let bestDist = Infinity;
  for (const [name, shades] of Object.entries(TAILWIND_COLORS)) {
    for (const [shade, twHex] of Object.entries(shades)) {
      const d = colorDistance(hex, twHex);
      if (d < bestDist) {
        bestDist = d;
        best = `${name}-${shade}`;
      }
    }
  }
  return best;
}

/* ─── WCAG contrast ratio ─── */
function relativeLuminance(rgb: RGB): number {
  const srgb = [rgb.r, rgb.g, rgb.b].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * srgb[0] + 0.7152 * srgb[1] + 0.0722 * srgb[2];
}

function contrastRatio(c1: RGB, c2: RGB): number {
  const l1 = relativeLuminance(c1);
  const l2 = relativeLuminance(c2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

/* ─── Palette generation from a base hex color ─── */
function makeColor(hex: string): PaletteColor {
  const rgb = hexToRgb(hex)!;
  const hsl = rgbToHsl(rgb);
  return { hex: hex.toLowerCase(), rgb, hsl, tailwind: nearestTailwind(hex) };
}

function hslColor(h: number, s: number, l: number): PaletteColor {
  const rgb = hslToRgb({
    h: ((h % 360) + 360) % 360,
    s: Math.max(0, Math.min(100, s)),
    l: Math.max(0, Math.min(100, l)),
  });
  const hex = rgbToHex(rgb);
  return makeColor(hex);
}

function generateFromBase(
  baseHex: string,
  mode: HarmonyMode
): PaletteColor[] {
  const rgb = hexToRgb(baseHex);
  if (!rgb) return [];
  const hsl = rgbToHsl(rgb);
  const { h, s, l } = hsl;

  switch (mode) {
    case "complementary":
      return [
        hslColor(h, s, l),
        hslColor(h + 180, s, l),
        hslColor(h + 180, s - 15, l + 15),
        hslColor(h, s - 10, l + 20),
        hslColor(h, s + 10, l - 15),
      ];
    case "analogous":
      return [
        hslColor(h - 30, s, l),
        hslColor(h - 15, s, l),
        hslColor(h, s, l),
        hslColor(h + 15, s, l),
        hslColor(h + 30, s, l),
      ];
    case "triadic":
      return [
        hslColor(h, s, l),
        hslColor(h + 120, s, l),
        hslColor(h + 240, s, l),
        hslColor(h + 120, s - 10, l + 15),
        hslColor(h + 240, s - 10, l + 15),
      ];
    case "split-complementary":
      return [
        hslColor(h, s, l),
        hslColor(h + 150, s, l),
        hslColor(h + 210, s, l),
        hslColor(h + 150, s - 10, l + 15),
        hslColor(h + 210, s - 10, l - 10),
      ];
    case "monochromatic":
      return [
        hslColor(h, s, Math.max(10, l - 30)),
        hslColor(h, s, Math.max(15, l - 15)),
        hslColor(h, s, l),
        hslColor(h, s, Math.min(85, l + 15)),
        hslColor(h, s, Math.min(95, l + 30)),
      ];
  }
}

function randomHex(): string {
  const r = Math.floor(Math.random() * 256);
  const g = Math.floor(Math.random() * 256);
  const b = Math.floor(Math.random() * 256);
  return rgbToHex({ r, g, b });
}

/* ─── Text color for readability on swatch ─── */
function textOnColor(rgb: RGB): string {
  return relativeLuminance(rgb) > 0.179 ? "#1e293b" : "#f1f5f9";
}

/* ─── Static initial palette for SSR ─── */
const INITIAL_BASE = "#3b82f6";
const INITIAL_MODE: HarmonyMode = "complementary";
const INITIAL_PALETTE = generateFromBase(INITIAL_BASE, INITIAL_MODE);

/* ─── Component ─── */
export default function ColorPaletteGeneratorPage() {
  const [baseColor, setBaseColor] = useState(INITIAL_BASE);
  const [inputValue, setInputValue] = useState(INITIAL_BASE);
  const [mode, setMode] = useState<HarmonyMode>(INITIAL_MODE);
  const [palette, setPalette] = useState<PaletteColor[]>(INITIAL_PALETTE);
  const [copied, setCopied] = useState<string | null>(null);
  const [contrastA, setContrastA] = useState<number | null>(null);
  const [contrastB, setContrastB] = useState<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const generate = useCallback(
    (hex: string, m: HarmonyMode) => {
      const p = generateFromBase(hex, m);
      if (p.length > 0) {
        setPalette(p);
        setContrastA(null);
        setContrastB(null);
      }
    },
    []
  );

  const handleBaseChange = useCallback(
    (val: string) => {
      setInputValue(val);
      const clean = val.startsWith("#") ? val : `#${val}`;
      if (/^#[0-9a-fA-F]{6}$/.test(clean)) {
        setBaseColor(clean);
        generate(clean, mode);
      }
    },
    [mode, generate]
  );

  const handlePickerChange = useCallback(
    (val: string) => {
      setBaseColor(val);
      setInputValue(val);
      generate(val, mode);
    },
    [mode, generate]
  );

  const handleModeChange = useCallback(
    (m: HarmonyMode) => {
      setMode(m);
      generate(baseColor, m);
    },
    [baseColor, generate]
  );

  const randomPalette = useCallback(() => {
    const hex = randomHex();
    setBaseColor(hex);
    setInputValue(hex);
    generate(hex, mode);
  }, [mode, generate]);

  const copyText = useCallback(async (text: string, label?: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(label ?? text);
    setTimeout(() => setCopied(null), 2000);
  }, []);

  const copyCSS = useCallback(async () => {
    const vars = palette
      .map((c, i) => `  --color-${i + 1}: ${c.hex};`)
      .join("\n");
    const css = `:root {\n${vars}\n}`;
    await copyText(css, "css");
  }, [palette, copyText]);

  const copyAllHex = useCallback(async () => {
    const hexStr = palette.map((c) => c.hex).join(", ");
    await copyText(hexStr, "all-hex");
  }, [palette, copyText]);

  const exportPNG = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const w = 1200,
      h = 400;
    canvas.width = w;
    canvas.height = h;
    const sw = w / palette.length;
    palette.forEach((c, i) => {
      ctx.fillStyle = c.hex;
      ctx.fillRect(i * sw, 0, sw, h * 0.75);
      ctx.fillStyle = "#1e293b";
      ctx.fillRect(i * sw, h * 0.75, sw, h * 0.25);
      ctx.fillStyle = "#f1f5f9";
      ctx.font = "bold 18px monospace";
      ctx.textAlign = "center";
      ctx.fillText(c.hex, i * sw + sw / 2, h * 0.75 + 35);
      ctx.font = "14px monospace";
      ctx.fillStyle = "#94a3b8";
      ctx.fillText(
        `rgb(${c.rgb.r}, ${c.rgb.g}, ${c.rgb.b})`,
        i * sw + sw / 2,
        h * 0.75 + 60
      );
      ctx.fillText(
        `hsl(${c.hsl.h}, ${c.hsl.s}%, ${c.hsl.l}%)`,
        i * sw + sw / 2,
        h * 0.75 + 80
      );
    });
    const link = document.createElement("a");
    link.download = "palette.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  }, [palette]);

  const handleSwatchClick = useCallback(
    (index: number) => {
      if (contrastA === null) {
        setContrastA(index);
      } else if (contrastB === null && index !== contrastA) {
        setContrastB(index);
      } else {
        setContrastA(index);
        setContrastB(null);
      }
    },
    [contrastA, contrastB]
  );

  const ratio =
    contrastA !== null && contrastB !== null
      ? contrastRatio(palette[contrastA].rgb, palette[contrastB].rgb)
      : null;

  return (
    <>
      <title>
        Color Palette Generator — Free Color Scheme Tool | DevTools
      </title>
      <meta
        name="description"
        content="Generate beautiful color palettes instantly. Pick a base color, choose complementary, analogous, triadic, split-complementary, or monochromatic harmony. Copy hex, RGB, HSL, Tailwind classes, and CSS variables. Export as PNG. Free WCAG contrast checker included."
      />
      <meta
        name="keywords"
        content="color palette generator, color scheme generator, palette generator, color palette from image, color harmony, complementary colors, analogous colors, triadic colors, WCAG contrast checker, tailwind colors"
      />
      <JsonLd
        data={[
          generateWebAppSchema({
            slug: "color-palette-generator",
            name: "Color Palette Generator",
            description:
              "Generate beautiful color palettes with complementary, analogous, triadic, split-complementary, and monochromatic harmony modes. Copy hex, RGB, HSL, Tailwind classes. Export as PNG. WCAG contrast checker.",
            category: "css",
          }),
          generateBreadcrumbSchema({
            slug: "color-palette-generator",
            name: "Color Palette Generator",
            description:
              "Generate beautiful color palettes with hex, RGB, HSL, and Tailwind values",
            category: "css",
          }),
          generateFAQSchema([
            {
              question: "What harmony modes are available?",
              answer:
                "Five modes: Complementary (opposite on the color wheel), Analogous (neighboring hues), Triadic (three evenly-spaced hues), Split-Complementary (base plus two colors adjacent to the complement), and Monochromatic (different lightness levels of the same hue).",
            },
            {
              question: "How does the WCAG contrast checker work?",
              answer:
                "Click any two swatches to compare them. The tool calculates the contrast ratio per WCAG 2.1 and shows AA (≥4.5:1 for normal text) and AAA (≥7:1) badges so you can ensure accessible color pairings.",
            },
            {
              question: "Can I export my palette?",
              answer:
                "Yes. You can copy all hex values, copy CSS custom properties (--color-1 through --color-5), or export the palette as a PNG image with color codes.",
            },
            {
              question: "What is a Tailwind class?",
              answer:
                "Tailwind CSS uses utility classes like bg-blue-500. Each palette color shows the closest matching Tailwind color class so you can use it directly in your Tailwind projects.",
            },
          ]),
        ]}
      />

      <div className="min-h-screen bg-slate-900 text-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <ToolBreadcrumb slug="color-palette-generator" />

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
              Color Palette Generator
            </h1>
            <p className="text-slate-400 max-w-2xl text-lg">
              Pick a base color or enter a hex value, choose a harmony mode, and
              generate a 5-color palette. Copy values, check WCAG contrast, or
              export as PNG.
            </p>
          </div>

          {/* Controls */}
          <div className="flex flex-wrap items-end gap-4 mb-8 bg-slate-800/50 p-5 rounded-xl border border-slate-700">
            {/* Color picker */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-400">
                Base Color
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={baseColor}
                  onChange={(e) => handlePickerChange(e.target.value)}
                  className="w-12 h-10 rounded cursor-pointer border border-slate-600 bg-transparent"
                />
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => handleBaseChange(e.target.value)}
                  placeholder="#3b82f6"
                  className="w-28 px-3 py-2 bg-slate-800 border border-slate-600 rounded text-sm font-mono text-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>
            </div>

            {/* Harmony mode */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-400">
                Harmony Mode
              </label>
              <select
                value={mode}
                onChange={(e) =>
                  handleModeChange(e.target.value as HarmonyMode)
                }
                className="px-3 py-2 bg-slate-800 border border-slate-600 rounded text-sm text-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="complementary">Complementary</option>
                <option value="analogous">Analogous</option>
                <option value="triadic">Triadic</option>
                <option value="split-complementary">Split-Complementary</option>
                <option value="monochromatic">Monochromatic</option>
              </select>
            </div>

            {/* Buttons */}
            <div className="flex items-end gap-2">
              <button
                onClick={() => generate(baseColor, mode)}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors text-sm"
              >
                Generate
              </button>
              <button
                onClick={randomPalette}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors text-sm"
              >
                Random Palette
              </button>
            </div>

            {/* Copy / Export */}
            <div className="flex items-end gap-2 sm:ml-auto">
              <button
                onClick={copyAllHex}
                className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm transition-colors"
              >
                {copied === "all-hex" ? "Copied!" : "Copy Hex"}
              </button>
              <button
                onClick={copyCSS}
                className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm transition-colors"
              >
                {copied === "css" ? "Copied!" : "Copy CSS Vars"}
              </button>
              <button
                onClick={exportPNG}
                className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm transition-colors"
              >
                Export PNG
              </button>
            </div>
          </div>

          {/* Palette swatches */}
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 mb-8">
            {palette.map((color, index) => {
              const fg = textOnColor(color.rgb);
              const isSelected = index === contrastA || index === contrastB;

              return (
                <div
                  key={index}
                  className={`rounded-xl overflow-hidden border transition-all cursor-pointer ${
                    isSelected
                      ? "border-white ring-2 ring-white/50 scale-[1.02]"
                      : "border-slate-700 hover:border-slate-500"
                  }`}
                  onClick={() => handleSwatchClick(index)}
                >
                  {/* Swatch */}
                  <div
                    className="h-36 sm:h-44 flex items-end p-3 relative"
                    style={{ backgroundColor: color.hex }}
                  >
                    {isSelected && (
                      <span
                        className="absolute top-2 right-2 text-xs font-bold px-1.5 py-0.5 rounded"
                        style={{
                          backgroundColor: "rgba(0,0,0,0.4)",
                          color: "#fff",
                        }}
                      >
                        {index === contrastA ? "A" : "B"}
                      </span>
                    )}
                    <span
                      className="text-sm font-bold font-mono"
                      style={{ color: fg }}
                    >
                      {color.hex}
                    </span>
                  </div>

                  {/* Color info */}
                  <div className="bg-slate-800 p-3 space-y-1.5">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        copyText(color.hex);
                      }}
                      className="text-sm font-mono text-slate-200 hover:text-white w-full text-left transition-colors"
                    >
                      {copied === color.hex ? "Copied!" : color.hex.toUpperCase()}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        copyText(
                          `rgb(${color.rgb.r}, ${color.rgb.g}, ${color.rgb.b})`
                        );
                      }}
                      className="text-xs font-mono text-slate-400 hover:text-slate-200 w-full text-left transition-colors"
                    >
                      rgb({color.rgb.r}, {color.rgb.g}, {color.rgb.b})
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        copyText(
                          `hsl(${color.hsl.h}, ${color.hsl.s}%, ${color.hsl.l}%)`
                        );
                      }}
                      className="text-xs font-mono text-slate-400 hover:text-slate-200 w-full text-left transition-colors"
                    >
                      hsl({color.hsl.h}, {color.hsl.s}%, {color.hsl.l}%)
                    </button>
                    <div className="flex items-center gap-1 pt-0.5">
                      <span className="text-[10px] text-slate-500 font-mono">
                        tw:
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          copyText(color.tailwind);
                        }}
                        className="text-xs font-mono text-blue-400 hover:text-blue-300 transition-colors"
                      >
                        {color.tailwind}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* WCAG Contrast Checker */}
          <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-5 mb-8">
            <h2 className="text-lg font-semibold text-white mb-3">
              WCAG Contrast Checker
            </h2>
            <p className="text-sm text-slate-400 mb-4">
              Click any two swatches above to compare their contrast ratio.
            </p>

            {contrastA !== null && contrastB !== null && ratio !== null ? (
              <div className="flex flex-wrap items-center gap-4">
                {/* Color A */}
                <div className="flex items-center gap-2">
                  <div
                    className="w-10 h-10 rounded border border-slate-600"
                    style={{ backgroundColor: palette[contrastA].hex }}
                  />
                  <span className="text-sm font-mono text-slate-300">
                    {palette[contrastA].hex}
                  </span>
                </div>

                <span className="text-slate-500">vs</span>

                {/* Color B */}
                <div className="flex items-center gap-2">
                  <div
                    className="w-10 h-10 rounded border border-slate-600"
                    style={{ backgroundColor: palette[contrastB].hex }}
                  />
                  <span className="text-sm font-mono text-slate-300">
                    {palette[contrastB].hex}
                  </span>
                </div>

                {/* Ratio */}
                <div className="flex items-center gap-3 ml-2">
                  <span className="text-xl font-bold text-white">
                    {ratio.toFixed(2)}:1
                  </span>

                  {/* AA badge */}
                  <span
                    className={`px-2 py-0.5 rounded text-xs font-bold ${
                      ratio >= 4.5
                        ? "bg-green-600/20 text-green-400 border border-green-600/40"
                        : "bg-red-600/20 text-red-400 border border-red-600/40"
                    }`}
                  >
                    AA {ratio >= 4.5 ? "Pass" : "Fail"}
                  </span>

                  {/* AAA badge */}
                  <span
                    className={`px-2 py-0.5 rounded text-xs font-bold ${
                      ratio >= 7
                        ? "bg-green-600/20 text-green-400 border border-green-600/40"
                        : "bg-red-600/20 text-red-400 border border-red-600/40"
                    }`}
                  >
                    AAA {ratio >= 7 ? "Pass" : "Fail"}
                  </span>
                </div>

                {/* Preview text */}
                <div className="flex gap-3 ml-auto">
                  <div
                    className="px-3 py-1.5 rounded text-sm font-medium"
                    style={{
                      backgroundColor: palette[contrastA].hex,
                      color: palette[contrastB].hex,
                    }}
                  >
                    Sample text
                  </div>
                  <div
                    className="px-3 py-1.5 rounded text-sm font-medium"
                    style={{
                      backgroundColor: palette[contrastB].hex,
                      color: palette[contrastA].hex,
                    }}
                  >
                    Sample text
                  </div>
                </div>
              </div>
            ) : contrastA !== null ? (
              <p className="text-sm text-slate-400">
                Color A selected ({palette[contrastA].hex}). Click another
                swatch to compare.
              </p>
            ) : (
              <p className="text-sm text-slate-500">
                No colors selected yet. Click two swatches above to check
                contrast.
              </p>
            )}
          </div>

          {/* Hidden canvas for PNG export */}
          <canvas ref={canvasRef} className="hidden" />

          {/* Spacebar listener */}
          <SpacebarListener onSpace={randomPalette} />

          <RelatedTools currentSlug="color-palette-generator" />

          {/* FAQ Section */}
          <section className="mt-16 border-t border-slate-700 pt-10">
            <h2 className="text-2xl font-bold text-white mb-6">
              Frequently Asked Questions
            </h2>

            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  What harmony modes are available?
                </h3>
                <p className="text-slate-400">
                  Five modes: <strong>Complementary</strong> (opposite on the
                  color wheel), <strong>Analogous</strong> (neighboring hues),{" "}
                  <strong>Triadic</strong> (three evenly-spaced hues),{" "}
                  <strong>Split-Complementary</strong> (base plus two colors
                  adjacent to the complement), and{" "}
                  <strong>Monochromatic</strong> (different lightness levels of
                  the same hue).
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  How does the WCAG contrast checker work?
                </h3>
                <p className="text-slate-400">
                  Click any two swatches to compare them. The tool calculates the
                  contrast ratio per WCAG 2.1 and shows AA (&ge;4.5:1 for normal
                  text) and AAA (&ge;7:1) badges so you can ensure accessible
                  color pairings.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Can I export my palette?
                </h3>
                <p className="text-slate-400">
                  Yes. You can copy all hex values, copy CSS custom properties
                  (--color-1 through --color-5), or export the palette as a PNG
                  image with color codes.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  What is a Tailwind class?
                </h3>
                <p className="text-slate-400">
                  Tailwind CSS uses utility classes like{" "}
                  <code className="text-blue-400">bg-blue-500</code>. Each
                  palette color shows the closest matching Tailwind color class
                  so you can use it directly in your Tailwind projects.
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}

function SpacebarListener({ onSpace }: { onSpace: () => void }) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (e.code === "Space") {
        e.preventDefault();
        onSpace();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onSpace]);

  return null;
}
