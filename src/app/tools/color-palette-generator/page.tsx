"use client";

import { useState, useCallback, useEffect } from "react";
import JsonLd from "@/components/JsonLd";
import RelatedTools from "@/components/RelatedTools";
import {
  generateFAQSchema,
  generateWebAppSchema,
  generateBreadcrumbSchema,
} from "@/lib/jsonld";

interface ColorEntry {
  h: number;
  s: number;
  l: number;
  locked: boolean;
}

type HarmonyMode = "random" | "complementary" | "analogous" | "triadic";

function hslToHex(h: number, s: number, l: number): string {
  const sNorm = s / 100;
  const lNorm = l / 100;
  const c = (1 - Math.abs(2 * lNorm - 1)) * sNorm;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = lNorm - c / 2;

  let r = 0,
    g = 0,
    b = 0;
  if (h < 60) {
    r = c; g = x; b = 0;
  } else if (h < 120) {
    r = x; g = c; b = 0;
  } else if (h < 180) {
    r = 0; g = c; b = x;
  } else if (h < 240) {
    r = 0; g = x; b = c;
  } else if (h < 300) {
    r = x; g = 0; b = c;
  } else {
    r = c; g = 0; b = x;
  }

  const toHex = (v: number) =>
    Math.round((v + m) * 255)
      .toString(16)
      .padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function hslToRgb(
  h: number,
  s: number,
  l: number
): { r: number; g: number; b: number } {
  const hex = hslToHex(h, s, l).slice(1);
  return {
    r: parseInt(hex.slice(0, 2), 16),
    g: parseInt(hex.slice(2, 4), 16),
    b: parseInt(hex.slice(4, 6), 16),
  };
}

function randomColor(): ColorEntry {
  return {
    h: Math.floor(Math.random() * 360),
    s: 40 + Math.floor(Math.random() * 45), // 40-85%
    l: 35 + Math.floor(Math.random() * 35), // 35-70%
    locked: false,
  };
}

function generatePalette(
  mode: HarmonyMode,
  existing: ColorEntry[]
): ColorEntry[] {
  if (mode === "random") {
    return existing.map((c) => (c.locked ? c : randomColor()));
  }

  const baseH =
    existing.find((c) => c.locked)?.h ?? Math.floor(Math.random() * 360);
  const baseS = 50 + Math.floor(Math.random() * 30);
  const baseL = 40 + Math.floor(Math.random() * 25);

  let hues: number[];

  switch (mode) {
    case "complementary":
      hues = [baseH, (baseH + 180) % 360, (baseH + 30) % 360, (baseH + 210) % 360, (baseH + 150) % 360];
      break;
    case "analogous":
      hues = [baseH, (baseH + 30) % 360, (baseH + 60) % 360, (baseH - 30 + 360) % 360, (baseH - 60 + 360) % 360];
      break;
    case "triadic":
      hues = [baseH, (baseH + 120) % 360, (baseH + 240) % 360, (baseH + 60) % 360, (baseH + 180) % 360];
      break;
    default:
      hues = Array.from({ length: 5 }, () => Math.floor(Math.random() * 360));
  }

  return existing.map((c, i) => {
    if (c.locked) return c;
    const lightVariation = -10 + Math.floor(Math.random() * 20);
    const satVariation = -10 + Math.floor(Math.random() * 20);
    return {
      h: hues[i],
      s: Math.max(20, Math.min(90, baseS + satVariation)),
      l: Math.max(25, Math.min(75, baseL + lightVariation)),
      locked: false,
    };
  });
}

function textColor(h: number, s: number, l: number): string {
  return l > 55 ? "#1e293b" : "#f1f5f9";
}

// Static placeholder colors used for SSR to avoid hydration mismatch from Math.random()
const INITIAL_COLORS: ColorEntry[] = [
  { h: 210, s: 60, l: 50, locked: false },
  { h: 340, s: 55, l: 45, locked: false },
  { h: 120, s: 50, l: 55, locked: false },
  { h: 45, s: 65, l: 50, locked: false },
  { h: 270, s: 50, l: 50, locked: false },
];

export default function ColorPaletteGeneratorPage() {
  const [colors, setColors] = useState<ColorEntry[]>(INITIAL_COLORS);
  const [mode, setMode] = useState<HarmonyMode>("random");
  const [copied, setCopied] = useState<string | null>(null);
  // Generate random palette only after mount to avoid SSR/client mismatch
  useEffect(() => {
    setColors(generatePalette("random", Array.from({ length: 5 }, () => randomColor())));
  }, []);

  const regenerate = useCallback(() => {
    setColors((prev) => generatePalette(mode, prev));
  }, [mode]);

  const toggleLock = useCallback((index: number) => {
    setColors((prev) =>
      prev.map((c, i) => (i === index ? { ...c, locked: !c.locked } : c))
    );
  }, []);

  const copyColor = useCallback(async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(text);
    setTimeout(() => setCopied(null), 2000);
  }, []);

  const copyPalette = useCallback(async () => {
    const paletteStr = colors
      .map((c) => hslToHex(c.h, c.s, c.l))
      .join(", ");
    await navigator.clipboard.writeText(paletteStr);
    setCopied("palette");
    setTimeout(() => setCopied(null), 2000);
  }, [colors]);

  return (
    <>
      <title>
        Color Palette Generator - Free Online Tool | DevTools Hub
      </title>
      <meta
        name="description"
        content="Generate beautiful color palettes with complementary, analogous, and triadic harmony modes. Lock colors, view hex/RGB/HSL values, and copy with one click."
      />
      <JsonLd
        data={[
          generateWebAppSchema({
            slug: "color-palette-generator",
            name: "Color Palette Generator",
            description: "Generate beautiful color palettes with hex, RGB, and HSL values",
            category: "design",
          }),
          generateBreadcrumbSchema({
            slug: "color-palette-generator",
            name: "Color Palette Generator",
            description: "Generate beautiful color palettes with hex, RGB, and HSL values",
            category: "design",
          }),
          generateFAQSchema([
            { question: "What are color harmony modes?", answer: "Color harmony refers to aesthetically pleasing combinations based on their positions on the color wheel. Complementary colors sit opposite each other (high contrast). Analogous colors are neighbors (smooth, cohesive). Triadic colors are evenly spaced at 120 degrees (vibrant, balanced)." },
            { question: "How do I lock a color?", answer: "Click the lock icon on any color swatch to keep it when you regenerate the palette. Locked colors stay in place while the remaining colors are replaced. This is useful when you have found a color you like and want to build around it." },
            { question: "What color formats are supported?", answer: "Each color is displayed in three formats: Hex (e.g., #3B82F6), RGB (e.g., rgb(59, 130, 246)), and HSL (e.g., hsl(217, 91%, 60%)). Click any value to copy it to your clipboard." },
            { question: "Can I use these palettes in my projects?", answer: "Yes, absolutely. All generated palettes are free to use in personal and commercial projects. Click \"Copy Palette\" to get all five hex values at once, ready to paste into your CSS, design tool, or style guide." },
          ]),
        ]}
      />

      <div className="min-h-screen bg-slate-900 text-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Breadcrumb */}
          <nav className="text-sm text-slate-400 mb-6" aria-label="Breadcrumb">
            <ol className="flex items-center gap-2">
              <li>
                <a href="/" className="hover:text-white transition-colors">
                  Home
                </a>
              </li>
              <li>
                <span className="mx-1">/</span>
              </li>
              <li>
                <a
                  href="/tools"
                  className="hover:text-white transition-colors"
                >
                  Design Tools
                </a>
              </li>
              <li>
                <span className="mx-1">/</span>
              </li>
              <li className="text-slate-200">Color Palette Generator</li>
            </ol>
          </nav>

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
              Color Palette Generator
            </h1>
            <p className="text-slate-400 max-w-2xl text-lg">
              Generate harmonious color palettes for your designs. Choose a
              harmony mode, lock colors you like, and regenerate until you find
              the perfect combination.
            </p>
          </div>

          {/* Controls */}
          <div className="flex flex-wrap items-center gap-3 mb-8">
            <button
              onClick={regenerate}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              Generate
            </button>
            <button
              onClick={copyPalette}
              className="px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors"
            >
              {copied === "palette" ? "Copied!" : "Copy Palette"}
            </button>

            <div className="flex items-center gap-2 ml-auto">
              <label className="text-sm text-slate-400">Harmony:</label>
              <select
                value={mode}
                onChange={(e) => setMode(e.target.value as HarmonyMode)}
                className="bg-slate-800 border border-slate-600 text-slate-200 rounded px-3 py-1.5 text-sm"
              >
                <option value="random">Random</option>
                <option value="complementary">Complementary</option>
                <option value="analogous">Analogous</option>
                <option value="triadic">Triadic</option>
              </select>
            </div>
          </div>

          {/* Spacebar hint */}
          <p className="text-sm text-slate-500 mb-4">
            Tip: Press the <kbd className="px-1.5 py-0.5 bg-slate-700 rounded text-xs text-slate-300">Space</kbd> bar to regenerate quickly.
          </p>

          {/* Color swatches */}
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 mb-8">
            {colors.map((color, index) => {
              const hex = hslToHex(color.h, color.s, color.l);
              const rgb = hslToRgb(color.h, color.s, color.l);
              const fg = textColor(color.h, color.s, color.l);

              return (
                <div
                  key={index}
                  className="rounded-xl overflow-hidden border border-slate-700"
                >
                  {/* Swatch */}
                  <div
                    className="h-40 sm:h-52 flex items-end justify-between p-3 cursor-pointer relative"
                    style={{ backgroundColor: hex }}
                    onClick={() => copyColor(hex)}
                  >
                    {/* Lock button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleLock(index);
                      }}
                      className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center transition-colors"
                      style={{
                        backgroundColor: color.locked
                          ? "rgba(0,0,0,0.5)"
                          : "rgba(0,0,0,0.2)",
                        color: fg,
                      }}
                      title={color.locked ? "Unlock color" : "Lock color"}
                    >
                      {color.locked ? (
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                        >
                          <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1s3.1 1.39 3.1 3.1v2z" />
                        </svg>
                      ) : (
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                        >
                          <path d="M12 17c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm6-9h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6h1.9c0-1.71 1.39-3.1 3.1-3.1s3.1 1.39 3.1 3.1v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm0 12H6V10h12v10z" />
                        </svg>
                      )}
                    </button>

                    <span
                      className="text-sm font-bold font-mono"
                      style={{ color: fg }}
                    >
                      {copied === hex ? "Copied!" : hex}
                    </span>
                  </div>

                  {/* Color info */}
                  <div className="bg-slate-800 p-3 space-y-1">
                    <button
                      onClick={() => copyColor(hex)}
                      className="text-sm font-mono text-slate-200 hover:text-white w-full text-left transition-colors"
                    >
                      {hex.toUpperCase()}
                    </button>
                    <button
                      onClick={() =>
                        copyColor(`rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`)
                      }
                      className="text-xs font-mono text-slate-400 hover:text-slate-200 w-full text-left transition-colors"
                    >
                      rgb({rgb.r}, {rgb.g}, {rgb.b})
                    </button>
                    <button
                      onClick={() =>
                        copyColor(`hsl(${color.h}, ${color.s}%, ${color.l}%)`)
                      }
                      className="text-xs font-mono text-slate-400 hover:text-slate-200 w-full text-left transition-colors"
                    >
                      hsl({color.h}, {color.s}%, {color.l}%)
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Keyboard listener for spacebar */}
          <SpacebarListener onSpace={regenerate} />

          <RelatedTools currentSlug="color-palette-generator" />

          {/* FAQ Section */}
          <section className="mt-16 border-t border-slate-700 pt-10">
            <h2 className="text-2xl font-bold text-white mb-6">
              Frequently Asked Questions
            </h2>

            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  What are color harmony modes?
                </h3>
                <p className="text-slate-400">
                  Color harmony refers to aesthetically pleasing combinations
                  based on their positions on the color wheel.{" "}
                  <strong>Complementary</strong> colors sit opposite each other
                  (high contrast). <strong>Analogous</strong> colors are
                  neighbors (smooth, cohesive). <strong>Triadic</strong> colors
                  are evenly spaced at 120 degrees (vibrant, balanced).
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  How do I lock a color?
                </h3>
                <p className="text-slate-400">
                  Click the lock icon on any color swatch to keep it when you
                  regenerate the palette. Locked colors stay in place while the
                  remaining colors are replaced. This is useful when you have
                  found a color you like and want to build around it.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  What color formats are supported?
                </h3>
                <p className="text-slate-400">
                  Each color is displayed in three formats: Hex (e.g., #3B82F6),
                  RGB (e.g., rgb(59, 130, 246)), and HSL (e.g., hsl(217, 91%,
                  60%)). Click any value to copy it to your clipboard.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Can I use these palettes in my projects?
                </h3>
                <p className="text-slate-400">
                  Yes, absolutely. All generated palettes are free to use in
                  personal and commercial projects. Click &ldquo;Copy
                  Palette&rdquo; to get all five hex values at once, ready to
                  paste into your CSS, design tool, or style guide.
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
