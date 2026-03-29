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

/* ─── Color Types ─── */
interface RGB { r: number; g: number; b: number }
interface HSL { h: number; s: number; l: number }
interface HSV { h: number; s: number; v: number }
interface CMYK { c: number; m: number; y: number; k: number }

/* ─── Color Conversion Utilities ─── */
function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

function hsvToRgb(h: number, s: number, v: number): RGB {
  const s1 = s / 100, v1 = v / 100;
  const c = v1 * s1;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v1 - c;
  let r = 0, g = 0, b = 0;
  if (h < 60) { r = c; g = x; }
  else if (h < 120) { r = x; g = c; }
  else if (h < 180) { g = c; b = x; }
  else if (h < 240) { g = x; b = c; }
  else if (h < 300) { r = x; b = c; }
  else { r = c; b = x; }
  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255),
  };
}

function rgbToHsv(rgb: RGB): HSV {
  const r = rgb.r / 255, g = rgb.g / 255, b = rgb.b / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const d = max - min;
  let h = 0;
  if (d !== 0) {
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) * 60;
    else if (max === g) h = ((b - r) / d + 2) * 60;
    else h = ((r - g) / d + 4) * 60;
  }
  const s = max === 0 ? 0 : (d / max) * 100;
  const v = max * 100;
  return { h: Math.round(h), s: Math.round(s), v: Math.round(v) };
}

function rgbToHex(rgb: RGB): string {
  const toHex = (n: number) => clamp(Math.round(n), 0, 255).toString(16).padStart(2, "0");
  return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`;
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

function hslToRgb(h: number, s: number, l: number): RGB {
  const s1 = s / 100, l1 = l / 100;
  const c = (1 - Math.abs(2 * l1 - 1)) * s1;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l1 - c / 2;
  let r = 0, g = 0, b = 0;
  if (h < 60) { r = c; g = x; }
  else if (h < 120) { r = x; g = c; }
  else if (h < 180) { g = c; b = x; }
  else if (h < 240) { g = x; b = c; }
  else if (h < 300) { r = x; b = c; }
  else { r = c; b = x; }
  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255),
  };
}

/* ─── Palette Generation ─── */
type HarmonyType = "complementary" | "analogous" | "triadic" | "split-complementary" | "tetradic" | "monochromatic";

function generatePalette(hsl: HSL, harmony: HarmonyType): HSL[] {
  const { h, s, l } = hsl;
  switch (harmony) {
    case "complementary":
      return [hsl, { h: (h + 180) % 360, s, l }];
    case "analogous":
      return [
        { h: (h + 330) % 360, s, l },
        hsl,
        { h: (h + 30) % 360, s, l },
      ];
    case "triadic":
      return [hsl, { h: (h + 120) % 360, s, l }, { h: (h + 240) % 360, s, l }];
    case "split-complementary":
      return [hsl, { h: (h + 150) % 360, s, l }, { h: (h + 210) % 360, s, l }];
    case "tetradic":
      return [hsl, { h: (h + 90) % 360, s, l }, { h: (h + 180) % 360, s, l }, { h: (h + 270) % 360, s, l }];
    case "monochromatic":
      return [
        { h, s, l: clamp(l - 30, 5, 95) },
        { h, s, l: clamp(l - 15, 5, 95) },
        hsl,
        { h, s, l: clamp(l + 15, 5, 95) },
        { h, s, l: clamp(l + 30, 5, 95) },
      ];
    default:
      return [hsl];
  }
}

function getContrastText(rgb: RGB): string {
  const lum = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
  return lum > 0.5 ? "#000000" : "#ffffff";
}

const HARMONIES: { label: string; value: HarmonyType }[] = [
  { label: "Complementary", value: "complementary" },
  { label: "Analogous", value: "analogous" },
  { label: "Triadic", value: "triadic" },
  { label: "Split-Complementary", value: "split-complementary" },
  { label: "Tetradic", value: "tetradic" },
  { label: "Monochromatic", value: "monochromatic" },
];

export default function ColorPickerPage() {
  const [hue, setHue] = useState(217);
  const [saturation, setSaturation] = useState(80);
  const [brightness, setBrightness] = useState(75);
  const [copied, setCopied] = useState<string | null>(null);
  const [hexInput, setHexInput] = useState("");
  const [harmony, setHarmony] = useState<HarmonyType>("complementary");
  const pickerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  const rgb = hsvToRgb(hue, saturation, brightness);
  const hex = rgbToHex(rgb);
  const hsl = rgbToHsl(rgb);
  const cmyk = rgbToCmyk(rgb);

  // Sync hex input when color changes via picker
  useEffect(() => {
    setHexInput(hex);
  }, [hex]);

  const copyText = useCallback((label: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 1500);
  }, []);

  /* ─── Saturation/Brightness Picker ─── */
  const updateFromPicker = useCallback((clientX: number, clientY: number) => {
    const el = pickerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = clamp((clientX - rect.left) / rect.width, 0, 1);
    const y = clamp((clientY - rect.top) / rect.height, 0, 1);
    setSaturation(Math.round(x * 100));
    setBrightness(Math.round((1 - y) * 100));
  }, []);

  const handlePickerDown = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    isDragging.current = true;
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    updateFromPicker(clientX, clientY);
  }, [updateFromPicker]);

  useEffect(() => {
    const handleMove = (e: MouseEvent | TouchEvent) => {
      if (!isDragging.current) return;
      e.preventDefault();
      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
      const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
      updateFromPicker(clientX, clientY);
    };
    const handleUp = () => { isDragging.current = false; };
    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);
    window.addEventListener("touchmove", handleMove, { passive: false });
    window.addEventListener("touchend", handleUp);
    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
      window.removeEventListener("touchmove", handleMove);
      window.removeEventListener("touchend", handleUp);
    };
  }, [updateFromPicker]);

  /* ─── Hex Input Handler ─── */
  const applyHex = useCallback((value: string) => {
    setHexInput(value);
    const parsed = hexToRgb(value);
    if (parsed) {
      const hsv = rgbToHsv(parsed);
      setHue(hsv.h);
      setSaturation(hsv.s);
      setBrightness(hsv.v);
    }
  }, []);

  /* ─── Palette Colors ─── */
  const paletteColors = generatePalette(hsl, harmony).map((c) => {
    const pRgb = hslToRgb(c.h, c.s, c.l);
    const pHex = rgbToHex(pRgb);
    return { hsl: c, rgb: pRgb, hex: pHex };
  });

  /* ─── CSS Output Formats ─── */
  const cssFormats = [
    { label: "HEX", value: hex, key: "hex" },
    { label: "RGB", value: `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`, key: "rgb" },
    { label: "HSL", value: `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`, key: "hsl" },
    { label: "CMYK", value: `cmyk(${cmyk.c}%, ${cmyk.m}%, ${cmyk.y}%, ${cmyk.k}%)`, key: "cmyk" },
  ];

  const faqs = [
    { question: "How do I use the color picker?", answer: "Click or drag anywhere on the gradient area to select a saturation and brightness. Use the hue slider below to change the base color. You can also type a HEX value directly into the input field to jump to a specific color." },
    { question: "What color formats are supported?", answer: "The color picker converts between HEX, RGB, HSL, and CMYK formats in real-time. Click any format value to copy it to your clipboard for use in CSS, design tools, or any application." },
    { question: "What are color harmonies?", answer: "Color harmonies are combinations of colors based on their position on the color wheel. Complementary colors are opposite each other, analogous colors are adjacent, triadic colors are evenly spaced at 120 degrees, and split-complementary uses the two colors adjacent to the complement." },
    { question: "Can I use these colors in CSS?", answer: "Yes. All output formats (HEX, RGB, HSL) are valid CSS color values. Click any value to copy it, then paste it directly into your CSS stylesheet, Tailwind config, or design tool." },
    { question: "What is CMYK used for?", answer: "CMYK (Cyan, Magenta, Yellow, Key/Black) is the color model used in print design. The CMYK values shown are approximate conversions from the RGB color space and are useful for getting print-ready color specifications." },
    { question: "How does the palette generator work?", answer: "The palette generator creates harmonious color combinations based on color theory. Select a harmony type (complementary, analogous, triadic, split-complementary, tetradic, or monochromatic) and the tool generates a palette derived from your selected color." },
  ];

  return (
    <>
      <title>Color Picker - Free Online HEX Color Picker & Converter | DevTools</title>
      <meta
        name="description"
        content="Free online color picker with visual selector. Pick colors, convert between HEX, RGB, HSL, CMYK. Generate color palettes with complementary, analogous, and triadic harmonies. Copy CSS color codes instantly."
      />
      <meta name="keywords" content="color picker, hex color picker, color converter, rgb to hex, hex to rgb, hsl color picker, color palette generator, css color codes, online color picker, color wheel" />
      <JsonLd
        data={[
          generateWebAppSchema({
            slug: "color-picker",
            name: "Color Picker",
            description: "Free online color picker with visual selector. Convert between HEX, RGB, HSL, CMYK. Generate harmonious color palettes. Copy CSS color codes instantly.",
            category: "css",
          }),
          generateBreadcrumbSchema({
            slug: "color-picker",
            name: "Color Picker",
            description: "Free online color picker with visual selector. Convert between HEX, RGB, HSL, CMYK. Generate harmonious color palettes.",
            category: "css",
          }),
          generateFAQSchema(faqs),
        ]}
      />

      <div className="min-h-screen bg-slate-900 text-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <ToolBreadcrumb slug="color-picker" />

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
              Color Picker
            </h1>
            <p className="text-slate-400 max-w-2xl text-lg">
              Pick any color visually, convert between HEX, RGB, HSL, and CMYK, generate
              harmonious palettes, and copy CSS color codes with one click.
            </p>
          </div>

          {/* Main Picker Area */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 mb-8">
            {/* Saturation/Brightness Canvas */}
            <div className="space-y-4">
              <div
                ref={pickerRef}
                className="relative w-full h-64 sm:h-80 rounded-xl border border-slate-700 cursor-crosshair select-none overflow-hidden shadow-lg"
                style={{
                  background: `linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, hsl(${hue}, 100%, 50%))`,
                }}
                onMouseDown={handlePickerDown}
                onTouchStart={handlePickerDown}
              >
                {/* Picker cursor */}
                <div
                  className="absolute w-5 h-5 rounded-full border-2 border-white shadow-[0_0_0_1px_rgba(0,0,0,0.3)] pointer-events-none -translate-x-1/2 -translate-y-1/2"
                  style={{
                    left: `${saturation}%`,
                    top: `${100 - brightness}%`,
                    backgroundColor: hex,
                  }}
                />
              </div>

              {/* Hue Slider */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Hue: {hue}&deg;
                </label>
                <input
                  type="range"
                  min={0}
                  max={359}
                  value={hue}
                  onChange={(e) => setHue(Number(e.target.value))}
                  className="w-full h-4 rounded-lg appearance-none cursor-pointer"
                  style={{
                    background: "linear-gradient(to right, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)",
                  }}
                />
              </div>
            </div>

            {/* Color Info Panel */}
            <div className="space-y-4">
              {/* Large Color Preview */}
              <div
                className="w-full h-32 rounded-xl border border-slate-700 shadow-lg flex items-end justify-start p-3"
                style={{ backgroundColor: hex }}
              >
                <span
                  className="text-sm font-mono font-bold px-2 py-1 rounded bg-black/30"
                  style={{ color: getContrastText(rgb) }}
                >
                  {hex}
                </span>
              </div>

              {/* HEX Input */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">HEX</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={hexInput}
                    onChange={(e) => applyHex(e.target.value)}
                    className="flex-1 bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 font-mono text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="#3b82f6"
                    spellCheck={false}
                    maxLength={7}
                  />
                  <button
                    onClick={() => copyText("hex-input", hex)}
                    className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    {copied === "hex-input" ? "Copied!" : "Copy"}
                  </button>
                </div>
              </div>

              {/* All Formats */}
              <div className="space-y-2">
                {cssFormats.map((fmt) => (
                  <div
                    key={fmt.key}
                    className="flex items-center justify-between bg-slate-800 border border-slate-700 rounded-lg px-3 py-2"
                  >
                    <div className="min-w-0">
                      <span className="text-xs text-slate-500 block">{fmt.label}</span>
                      <code className="text-sm font-mono text-slate-200 break-all">{fmt.value}</code>
                    </div>
                    <button
                      onClick={() => copyText(fmt.key, fmt.value)}
                      className="ml-3 flex-shrink-0 text-xs text-slate-400 hover:text-white transition-colors px-2 py-1 rounded hover:bg-slate-700"
                    >
                      {copied === fmt.key ? "Copied!" : "Copy"}
                    </button>
                  </div>
                ))}
              </div>

              {/* CSS Variable Output */}
              <div className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2">
                <span className="text-xs text-slate-500 block mb-1">CSS Custom Property</span>
                <div className="flex items-center justify-between">
                  <code className="text-sm font-mono text-green-400 break-all">
                    --color-primary: {hex};
                  </code>
                  <button
                    onClick={() => copyText("css-var", `--color-primary: ${hex};`)}
                    className="ml-3 flex-shrink-0 text-xs text-slate-400 hover:text-white transition-colors px-2 py-1 rounded hover:bg-slate-700"
                  >
                    {copied === "css-var" ? "Copied!" : "Copy"}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Color Palette Generator */}
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 mb-6">
            <h2 className="text-lg font-semibold text-white mb-4">Color Palette Generator</h2>

            {/* Harmony Selector */}
            <div className="flex flex-wrap gap-2 mb-5">
              {HARMONIES.map((h) => (
                <button
                  key={h.value}
                  onClick={() => setHarmony(h.value)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    harmony === h.value
                      ? "bg-blue-600 text-white"
                      : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                  }`}
                >
                  {h.label}
                </button>
              ))}
            </div>

            {/* Palette Swatches */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {paletteColors.map((color, i) => (
                <button
                  key={`${harmony}-${i}`}
                  onClick={() => copyText(`palette-${i}`, color.hex)}
                  className="group"
                >
                  <div
                    className="h-20 rounded-lg border border-slate-600 group-hover:border-blue-500 transition-colors flex items-end justify-center p-2"
                    style={{ backgroundColor: color.hex }}
                  >
                    <span
                      className="text-xs font-mono font-medium px-1.5 py-0.5 rounded bg-black/30"
                      style={{ color: getContrastText(color.rgb) }}
                    >
                      {copied === `palette-${i}` ? "Copied!" : color.hex}
                    </span>
                  </div>
                  <div className="mt-1 text-xs text-slate-500 group-hover:text-slate-300 transition-colors text-center">
                    {`hsl(${color.hsl.h}, ${color.hsl.s}%, ${color.hsl.l}%)`}
                  </div>
                </button>
              ))}
            </div>

            {/* Export palette */}
            <div className="mt-4 flex gap-2">
              <button
                onClick={() =>
                  copyText(
                    "palette-css",
                    paletteColors
                      .map((c, i) => `  --palette-${i + 1}: ${c.hex};`)
                      .join("\n")
                  )
                }
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-medium transition-colors"
              >
                {copied === "palette-css" ? "Copied!" : "Copy as CSS Variables"}
              </button>
              <button
                onClick={() =>
                  copyText(
                    "palette-array",
                    JSON.stringify(paletteColors.map((c) => c.hex))
                  )
                }
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-medium transition-colors"
              >
                {copied === "palette-array" ? "Copied!" : "Copy as JSON Array"}
              </button>
            </div>
          </div>

          {/* Color Format Reference */}
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-white mb-4">Color Format Reference</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left py-2 text-slate-400 font-medium">Format</th>
                    <th className="text-left py-2 text-slate-400 font-medium">Description</th>
                    <th className="text-left py-2 text-slate-400 font-medium">Example</th>
                  </tr>
                </thead>
                <tbody className="text-slate-300">
                  {[
                    ["HEX", "6-digit hexadecimal notation with # prefix, widely used in CSS and web design", "#3b82f6"],
                    ["RGB", "Red, Green, Blue values from 0-255, the standard digital color model", "rgb(59, 130, 246)"],
                    ["HSL", "Hue (0-360), Saturation (0-100%), Lightness (0-100%) — intuitive for color selection", "hsl(217, 91%, 60%)"],
                    ["CMYK", "Cyan, Magenta, Yellow, Key (Black) — subtractive model used in print design", "cmyk(76%, 47%, 0%, 4%)"],
                    ["CSS Custom Property", "Reusable variable for design systems and component libraries", "--color-primary: #3b82f6;"],
                  ].map((row) => (
                    <tr key={row[0]} className="border-b border-slate-700/50">
                      <td className="py-2 font-medium text-white font-mono text-xs">{row[0]}</td>
                      <td className="py-2">{row[1]}</td>
                      <td className="py-2 text-slate-400 font-mono text-xs">{row[2]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Related CSS Tools */}
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 mb-6">
            <h2 className="text-lg font-semibold text-white mb-3">Related Color Tools</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <a
                href="/tools/color-converter"
                className="flex items-center gap-3 bg-slate-900 rounded-lg p-4 hover:bg-slate-700 transition-colors group"
              >
                <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center border border-slate-600 group-hover:border-blue-500 transition-colors">
                  <span className="text-lg">&#127912;</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-white group-hover:text-blue-400 transition-colors">Color Converter</p>
                  <p className="text-xs text-slate-400">Convert colors between HEX, RGB, HSL, HSV, CMYK</p>
                </div>
              </a>
              <a
                href="/tools/color-palette-generator"
                className="flex items-center gap-3 bg-slate-900 rounded-lg p-4 hover:bg-slate-700 transition-colors group"
              >
                <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center border border-slate-600 group-hover:border-blue-500 transition-colors">
                  <span className="text-lg">&#127752;</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-white group-hover:text-blue-400 transition-colors">Color Palette Generator</p>
                  <p className="text-xs text-slate-400">Generate beautiful color palettes with multiple formats</p>
                </div>
              </a>
            </div>
          </div>

          <RelatedTools currentSlug="color-picker" />

          {/* FAQ */}
          <section className="mt-16 border-t border-slate-700 pt-10">
            <h2 className="text-2xl font-bold text-white mb-6">
              Frequently Asked Questions
            </h2>
            <div className="space-y-6">
              {faqs.map((item) => (
                <div key={item.question}>
                  <h3 className="text-lg font-semibold text-white mb-2">{item.question}</h3>
                  <p className="text-slate-400">{item.answer}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
