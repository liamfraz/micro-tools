"use client";

import { useState, useCallback } from "react";
import JsonLd from "@/components/JsonLd";
import RelatedTools from "@/components/RelatedTools";
import ToolBreadcrumb from "@/components/ToolBreadcrumb";
import {
  generateFAQSchema,
  generateWebAppSchema,
  generateBreadcrumbSchema,
} from "@/lib/jsonld";

// ── CSS Property → Tailwind class mapping ──

interface CssMapping {
  property: string;
  valueMap: Record<string, string>;
  transform?: (value: string) => string | null;
}

const SPACING_SCALE: Record<string, string> = {
  "0": "0", "0px": "0", "1px": "px", "0.125rem": "0.5", "2px": "0.5",
  "0.25rem": "1", "4px": "1", "0.375rem": "1.5", "6px": "1.5",
  "0.5rem": "2", "8px": "2", "0.625rem": "2.5", "10px": "2.5",
  "0.75rem": "3", "12px": "3", "0.875rem": "3.5", "14px": "3.5",
  "1rem": "4", "16px": "4", "1.25rem": "5", "20px": "5",
  "1.5rem": "6", "24px": "6", "1.75rem": "7", "28px": "7",
  "2rem": "8", "32px": "8", "2.25rem": "9", "36px": "9",
  "2.5rem": "10", "40px": "10", "2.75rem": "11", "44px": "11",
  "3rem": "12", "48px": "12", "3.5rem": "14", "56px": "14",
  "4rem": "16", "64px": "16", "5rem": "20", "80px": "20",
  "6rem": "24", "96px": "24", "7rem": "28", "112px": "28",
  "8rem": "32", "128px": "32", "9rem": "36", "144px": "36",
  "10rem": "40", "160px": "40", "11rem": "44", "176px": "44",
  "12rem": "48", "192px": "48", "13rem": "52", "208px": "52",
  "14rem": "56", "224px": "56", "15rem": "60", "240px": "60",
  "16rem": "64", "256px": "64", "18rem": "72", "288px": "72",
  "20rem": "80", "320px": "80", "24rem": "96", "384px": "96",
  "auto": "auto", "50%": "1/2", "33.333333%": "1/3", "66.666667%": "2/3",
  "25%": "1/4", "75%": "3/4", "100%": "full",
};

const FONT_SIZE_SCALE: Record<string, string> = {
  "0.75rem": "xs", "12px": "xs", "0.875rem": "sm", "14px": "sm",
  "1rem": "base", "16px": "base", "1.125rem": "lg", "18px": "lg",
  "1.25rem": "xl", "20px": "xl", "1.5rem": "2xl", "24px": "2xl",
  "1.875rem": "3xl", "30px": "3xl", "2.25rem": "4xl", "36px": "4xl",
  "3rem": "5xl", "48px": "5xl", "3.75rem": "6xl", "60px": "6xl",
  "4.5rem": "7xl", "72px": "7xl", "6rem": "8xl", "96px": "8xl",
  "8rem": "9xl", "128px": "9xl",
};

const FONT_WEIGHT_MAP: Record<string, string> = {
  "100": "thin", "200": "extralight", "300": "light", "400": "normal",
  "500": "medium", "600": "semibold", "700": "bold", "800": "extrabold", "900": "black",
};

const BORDER_RADIUS_MAP: Record<string, string> = {
  "0": "none", "0px": "none", "0.125rem": "sm", "2px": "sm",
  "0.25rem": "DEFAULT", "4px": "DEFAULT", "0.375rem": "md", "6px": "md",
  "0.5rem": "lg", "8px": "lg", "0.75rem": "xl", "12px": "xl",
  "1rem": "2xl", "16px": "2xl", "1.5rem": "3xl", "24px": "3xl",
  "9999px": "full", "50%": "full",
};

const OPACITY_MAP: Record<string, string> = {
  "0": "0", "0.05": "5", "0.1": "10", "0.15": "15", "0.2": "20", "0.25": "25",
  "0.3": "30", "0.35": "35", "0.4": "40", "0.45": "45", "0.5": "50",
  "0.55": "55", "0.6": "60", "0.65": "65", "0.7": "70", "0.75": "75",
  "0.8": "80", "0.85": "85", "0.9": "90", "0.95": "95", "1": "100",
};

const COLOR_MAP: Record<string, string> = {
  "#000": "black", "#000000": "black", "black": "black",
  "#fff": "white", "#ffffff": "white", "white": "white",
  "transparent": "transparent", "currentcolor": "current", "currentColor": "current",
  "inherit": "inherit",
  "#f8fafc": "slate-50", "#f1f5f9": "slate-100", "#e2e8f0": "slate-200",
  "#cbd5e1": "slate-300", "#94a3b8": "slate-400", "#64748b": "slate-500",
  "#475569": "slate-600", "#334155": "slate-700", "#1e293b": "slate-800", "#0f172a": "slate-900",
  "#fef2f2": "red-50", "#fee2e2": "red-100", "#fca5a5": "red-300",
  "#ef4444": "red-500", "#dc2626": "red-600", "#b91c1c": "red-700",
  "#fef9c3": "yellow-100", "#fde047": "yellow-300", "#eab308": "yellow-500",
  "#ecfdf5": "green-50", "#d1fae5": "green-100", "#6ee7b7": "green-300",
  "#22c55e": "green-500", "#16a34a": "green-600", "#15803d": "green-700",
  "#eff6ff": "blue-50", "#dbeafe": "blue-100", "#93c5fd": "blue-300",
  "#3b82f6": "blue-500", "#2563eb": "blue-600", "#1d4ed8": "blue-700",
  "#f5f3ff": "violet-50", "#ede9fe": "violet-100", "#c4b5fd": "violet-300",
  "#8b5cf6": "violet-500", "#7c3aed": "violet-600", "#6d28d9": "violet-700",
};

const lookupSpacing = (value: string, prefix: string): string | null => {
  const v = value.trim().toLowerCase();
  const scale = SPACING_SCALE[v];
  if (scale !== undefined) return `${prefix}-${scale}`;
  // Try arbitrary value
  if (v.match(/^-?\d+(\.\d+)?(px|rem|em|%|vh|vw)$/)) return `${prefix}-[${v}]`;
  return null;
};

const lookupColor = (value: string, prefix: string): string | null => {
  const v = value.trim().toLowerCase();
  const mapped = COLOR_MAP[v];
  if (mapped) return `${prefix}-${mapped}`;
  // Hex color as arbitrary value
  if (v.match(/^#[0-9a-f]{3,8}$/)) return `${prefix}-[${v}]`;
  // rgb/rgba as arbitrary
  if (v.startsWith("rgb")) return `${prefix}-[${v.replace(/\s+/g, "_")}]`;
  return null;
};

const CSS_TO_TAILWIND: CssMapping[] = [
  // Display
  { property: "display", valueMap: { "block": "block", "inline-block": "inline-block", "inline": "inline", "flex": "flex", "inline-flex": "inline-flex", "grid": "grid", "inline-grid": "inline-grid", "none": "hidden", "table": "table", "contents": "contents" } },
  // Position
  { property: "position", valueMap: { "static": "static", "relative": "relative", "absolute": "absolute", "fixed": "fixed", "sticky": "sticky" } },
  // Flex
  { property: "flex-direction", valueMap: { "row": "flex-row", "row-reverse": "flex-row-reverse", "column": "flex-col", "column-reverse": "flex-col-reverse" } },
  { property: "flex-wrap", valueMap: { "wrap": "flex-wrap", "nowrap": "flex-nowrap", "wrap-reverse": "flex-wrap-reverse" } },
  { property: "justify-content", valueMap: { "flex-start": "justify-start", "flex-end": "justify-end", "center": "justify-center", "space-between": "justify-between", "space-around": "justify-around", "space-evenly": "justify-evenly", "start": "justify-start", "end": "justify-end" } },
  { property: "align-items", valueMap: { "flex-start": "items-start", "flex-end": "items-end", "center": "items-center", "baseline": "items-baseline", "stretch": "items-stretch", "start": "items-start", "end": "items-end" } },
  { property: "align-self", valueMap: { "auto": "self-auto", "flex-start": "self-start", "flex-end": "self-end", "center": "self-center", "stretch": "self-stretch", "baseline": "self-baseline" } },
  { property: "flex-grow", valueMap: { "0": "grow-0", "1": "grow" } },
  { property: "flex-shrink", valueMap: { "0": "shrink-0", "1": "shrink" } },
  // Grid
  { property: "grid-template-columns", valueMap: {}, transform: (v) => {
    const match = v.match(/^repeat\((\d+),\s*minmax\(0,\s*1fr\)\)$/);
    if (match) return `grid-cols-${match[1]}`;
    const frMatch = v.match(/^repeat\((\d+),\s*1fr\)$/);
    if (frMatch) return `grid-cols-${frMatch[1]}`;
    return `grid-cols-[${v.replace(/\s+/g, "_")}]`;
  }},
  { property: "gap", valueMap: {}, transform: (v) => lookupSpacing(v, "gap") },
  { property: "row-gap", valueMap: {}, transform: (v) => lookupSpacing(v, "gap-y") },
  { property: "column-gap", valueMap: {}, transform: (v) => lookupSpacing(v, "gap-x") },
  // Spacing
  { property: "margin", valueMap: {}, transform: (v) => lookupSpacing(v, "m") },
  { property: "margin-top", valueMap: {}, transform: (v) => lookupSpacing(v, "mt") },
  { property: "margin-right", valueMap: {}, transform: (v) => lookupSpacing(v, "mr") },
  { property: "margin-bottom", valueMap: {}, transform: (v) => lookupSpacing(v, "mb") },
  { property: "margin-left", valueMap: {}, transform: (v) => lookupSpacing(v, "ml") },
  { property: "padding", valueMap: {}, transform: (v) => lookupSpacing(v, "p") },
  { property: "padding-top", valueMap: {}, transform: (v) => lookupSpacing(v, "pt") },
  { property: "padding-right", valueMap: {}, transform: (v) => lookupSpacing(v, "pr") },
  { property: "padding-bottom", valueMap: {}, transform: (v) => lookupSpacing(v, "pb") },
  { property: "padding-left", valueMap: {}, transform: (v) => lookupSpacing(v, "pl") },
  // Width / Height
  { property: "width", valueMap: { "100%": "w-full", "100vw": "w-screen", "auto": "w-auto", "min-content": "w-min", "max-content": "w-max", "fit-content": "w-fit" }, transform: (v) => lookupSpacing(v, "w") },
  { property: "min-width", valueMap: { "0": "min-w-0", "0px": "min-w-0", "100%": "min-w-full", "min-content": "min-w-min", "max-content": "min-w-max", "fit-content": "min-w-fit" } },
  { property: "max-width", valueMap: { "none": "max-w-none", "100%": "max-w-full", "min-content": "max-w-min", "max-content": "max-w-max", "fit-content": "max-w-fit" }, transform: (v) => lookupSpacing(v, "max-w") },
  { property: "height", valueMap: { "100%": "h-full", "100vh": "h-screen", "auto": "h-auto", "min-content": "h-min", "max-content": "h-max", "fit-content": "h-fit" }, transform: (v) => lookupSpacing(v, "h") },
  { property: "min-height", valueMap: { "0": "min-h-0", "0px": "min-h-0", "100%": "min-h-full", "100vh": "min-h-screen" } },
  { property: "max-height", valueMap: { "none": "max-h-none", "100%": "max-h-full", "100vh": "max-h-screen" }, transform: (v) => lookupSpacing(v, "max-h") },
  // Typography
  { property: "font-size", valueMap: {}, transform: (v) => { const s = FONT_SIZE_SCALE[v.trim()]; return s ? `text-${s}` : `text-[${v.trim()}]`; } },
  { property: "font-weight", valueMap: {}, transform: (v) => { const w = FONT_WEIGHT_MAP[v.trim()]; return w ? `font-${w}` : `font-[${v.trim()}]`; } },
  { property: "font-style", valueMap: { "italic": "italic", "normal": "not-italic" } },
  { property: "font-family", valueMap: {}, transform: (v) => {
    const vl = v.toLowerCase();
    if (vl.includes("sans-serif") || vl.includes("arial") || vl.includes("helvetica")) return "font-sans";
    if (vl.includes("serif") || vl.includes("georgia") || vl.includes("times")) return "font-serif";
    if (vl.includes("monospace") || vl.includes("courier") || vl.includes("consolas")) return "font-mono";
    return `font-[${v.replace(/\s+/g, "_")}]`;
  }},
  { property: "text-align", valueMap: { "left": "text-left", "center": "text-center", "right": "text-right", "justify": "text-justify", "start": "text-start", "end": "text-end" } },
  { property: "text-decoration", valueMap: { "underline": "underline", "line-through": "line-through", "overline": "overline", "none": "no-underline" } },
  { property: "text-transform", valueMap: { "uppercase": "uppercase", "lowercase": "lowercase", "capitalize": "capitalize", "none": "normal-case" } },
  { property: "letter-spacing", valueMap: { "-0.05em": "tracking-tighter", "-0.025em": "tracking-tight", "0": "tracking-normal", "0em": "tracking-normal", "0.025em": "tracking-wide", "0.05em": "tracking-wider", "0.1em": "tracking-widest" } },
  { property: "line-height", valueMap: { "1": "leading-none", "1.25": "leading-tight", "1.375": "leading-snug", "1.5": "leading-normal", "1.625": "leading-relaxed", "2": "leading-loose" } },
  { property: "white-space", valueMap: { "normal": "whitespace-normal", "nowrap": "whitespace-nowrap", "pre": "whitespace-pre", "pre-line": "whitespace-pre-line", "pre-wrap": "whitespace-pre-wrap", "break-spaces": "whitespace-break-spaces" } },
  { property: "word-break", valueMap: { "break-all": "break-all", "keep-all": "break-keep" } },
  { property: "overflow-wrap", valueMap: { "break-word": "break-words" } },
  // Colors
  { property: "color", valueMap: {}, transform: (v) => lookupColor(v, "text") },
  { property: "background-color", valueMap: {}, transform: (v) => lookupColor(v, "bg") },
  { property: "border-color", valueMap: {}, transform: (v) => lookupColor(v, "border") },
  // Background
  { property: "background", valueMap: {}, transform: (v) => { const c = lookupColor(v, "bg"); return c || `bg-[${v.replace(/\s+/g, "_")}]`; } },
  // Border
  { property: "border-width", valueMap: { "0": "border-0", "0px": "border-0", "1px": "border", "2px": "border-2", "4px": "border-4", "8px": "border-8" } },
  { property: "border-style", valueMap: { "solid": "border-solid", "dashed": "border-dashed", "dotted": "border-dotted", "double": "border-double", "none": "border-none" } },
  { property: "border-radius", valueMap: {}, transform: (v) => {
    const vt = v.trim();
    const r = BORDER_RADIUS_MAP[vt];
    if (r === "DEFAULT") return "rounded";
    if (r) return `rounded-${r}`;
    return `rounded-[${vt}]`;
  }},
  // Overflow
  { property: "overflow", valueMap: { "auto": "overflow-auto", "hidden": "overflow-hidden", "visible": "overflow-visible", "scroll": "overflow-scroll", "clip": "overflow-clip" } },
  { property: "overflow-x", valueMap: { "auto": "overflow-x-auto", "hidden": "overflow-x-hidden", "visible": "overflow-x-visible", "scroll": "overflow-x-scroll" } },
  { property: "overflow-y", valueMap: { "auto": "overflow-y-auto", "hidden": "overflow-y-hidden", "visible": "overflow-y-visible", "scroll": "overflow-y-scroll" } },
  // Opacity
  { property: "opacity", valueMap: {}, transform: (v) => { const o = OPACITY_MAP[v.trim()]; return o ? `opacity-${o}` : `opacity-[${v.trim()}]`; } },
  // Cursor
  { property: "cursor", valueMap: { "auto": "cursor-auto", "default": "cursor-default", "pointer": "cursor-pointer", "wait": "cursor-wait", "text": "cursor-text", "move": "cursor-move", "not-allowed": "cursor-not-allowed", "grab": "cursor-grab", "grabbing": "cursor-grabbing" } },
  // Z-index
  { property: "z-index", valueMap: { "0": "z-0", "10": "z-10", "20": "z-20", "30": "z-30", "40": "z-40", "50": "z-50", "auto": "z-auto" }, transform: (v) => `z-[${v.trim()}]` },
  // Pointer events
  { property: "pointer-events", valueMap: { "none": "pointer-events-none", "auto": "pointer-events-auto" } },
  // Visibility
  { property: "visibility", valueMap: { "visible": "visible", "hidden": "invisible", "collapse": "collapse" } },
  // Object fit
  { property: "object-fit", valueMap: { "contain": "object-contain", "cover": "object-cover", "fill": "object-fill", "none": "object-none", "scale-down": "object-scale-down" } },
  // Box shadow
  { property: "box-shadow", valueMap: { "none": "shadow-none" }, transform: (v) => {
    const vt = v.trim();
    if (vt === "0 1px 2px 0 rgb(0 0 0 / 0.05)") return "shadow-sm";
    if (vt === "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)") return "shadow";
    if (vt.includes("4px 6px")) return "shadow-md";
    if (vt.includes("10px 15px")) return "shadow-lg";
    if (vt.includes("25px")) return "shadow-xl";
    return `shadow-[${vt.replace(/\s+/g, "_")}]`;
  }},
  // Transition
  { property: "transition-property", valueMap: {}, transform: (v) => {
    const vt = v.trim();
    if (vt === "all") return "transition-all";
    if (vt === "none") return "transition-none";
    if (vt.includes("color") || vt.includes("background") || vt.includes("border")) return "transition-colors";
    if (vt.includes("opacity")) return "transition-opacity";
    if (vt.includes("transform")) return "transition-transform";
    return "transition";
  }},
  { property: "transition-duration", valueMap: {}, transform: (v) => {
    const ms = v.trim().replace("ms", "").replace("s", "000");
    return `duration-${parseInt(ms)}`;
  }},
  // Inset / Top / Right / Bottom / Left
  { property: "top", valueMap: {}, transform: (v) => lookupSpacing(v, "top") },
  { property: "right", valueMap: {}, transform: (v) => lookupSpacing(v, "right") },
  { property: "bottom", valueMap: {}, transform: (v) => lookupSpacing(v, "bottom") },
  { property: "left", valueMap: {}, transform: (v) => lookupSpacing(v, "left") },
  { property: "inset", valueMap: { "0": "inset-0", "0px": "inset-0" }, transform: (v) => lookupSpacing(v, "inset") },
  // List style
  { property: "list-style-type", valueMap: { "none": "list-none", "disc": "list-disc", "decimal": "list-decimal" } },
  // User select
  { property: "user-select", valueMap: { "none": "select-none", "text": "select-text", "all": "select-all", "auto": "select-auto" } },
  // Resize
  { property: "resize", valueMap: { "none": "resize-none", "both": "resize", "vertical": "resize-y", "horizontal": "resize-x" } },
  // Outline
  { property: "outline", valueMap: { "none": "outline-none", "0": "outline-none" } },
  // Transform
  { property: "transform", valueMap: { "none": "transform-none" } },
  // Appearance
  { property: "appearance", valueMap: { "none": "appearance-none" } },
];

const convertCssToTailwind = (css: string): { classes: string[]; unconverted: string[] } => {
  const classes: string[] = [];
  const unconverted: string[] = [];

  // Extract declarations from CSS (handle selectors, braces, etc.)
  const declarations = extractDeclarations(css);

  for (const { property, value } of declarations) {
    const prop = property.trim().toLowerCase();
    const val = value.trim();

    let found = false;
    for (const mapping of CSS_TO_TAILWIND) {
      if (mapping.property === prop) {
        // Try direct value map first
        const mapped = mapping.valueMap[val] || mapping.valueMap[val.toLowerCase()];
        if (mapped) {
          classes.push(mapped);
          found = true;
          break;
        }
        // Try transform function
        if (mapping.transform) {
          const result = mapping.transform(val);
          if (result) {
            classes.push(result);
            found = true;
            break;
          }
        }
        // If property matched but no value match, still mark as found but unconverted
        unconverted.push(`${prop}: ${val}`);
        found = true;
        break;
      }
    }

    if (!found) {
      unconverted.push(`${prop}: ${val}`);
    }
  }

  return { classes, unconverted };
};

const extractDeclarations = (css: string): { property: string; value: string }[] => {
  const results: { property: string; value: string }[] = [];

  // Remove comments
  let cleaned = css.replace(/\/\*[\s\S]*?\*\//g, "");
  // Remove selectors and braces — just grab property: value pairs
  cleaned = cleaned.replace(/[^{]*\{/g, "").replace(/\}/g, "");

  const lines = cleaned.split(";");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const colonIdx = trimmed.indexOf(":");
    if (colonIdx === -1) continue;
    const property = trimmed.slice(0, colonIdx).trim();
    const value = trimmed.slice(colonIdx + 1).trim().replace(/!important/gi, "").trim();
    if (property && value) {
      results.push({ property, value });
    }
  }

  return results;
};

// ── Tailwind → CSS mapping (reverse) ──

interface TwRule {
  pattern: RegExp;
  toCSS: (match: RegExpMatchArray) => string | null;
}

const TW_SPACING_REVERSE: Record<string, string> = {};
for (const [cssVal, twVal] of Object.entries(SPACING_SCALE)) {
  if (!TW_SPACING_REVERSE[twVal] || cssVal.endsWith("rem")) {
    TW_SPACING_REVERSE[twVal] = cssVal;
  }
}

const TW_FONT_SIZE_REVERSE: Record<string, string> = {
  "xs": "0.75rem", "sm": "0.875rem", "base": "1rem", "lg": "1.125rem",
  "xl": "1.25rem", "2xl": "1.5rem", "3xl": "1.875rem", "4xl": "2.25rem",
  "5xl": "3rem", "6xl": "3.75rem", "7xl": "4.5rem", "8xl": "6rem", "9xl": "8rem",
};

const TW_FONT_WEIGHT_REVERSE: Record<string, string> = {};
for (const [num, name] of Object.entries(FONT_WEIGHT_MAP)) {
  TW_FONT_WEIGHT_REVERSE[name] = num;
}

const TW_COLOR_REVERSE: Record<string, string> = {};
for (const [hex, name] of Object.entries(COLOR_MAP)) {
  if (hex.startsWith("#") && !TW_COLOR_REVERSE[name]) {
    TW_COLOR_REVERSE[name] = hex;
  }
}

const spacingToCSS = (prefix: string, cssProp: string) => {
  return (match: RegExpMatchArray): string | null => {
    const val = match[1];
    if (val.startsWith("[") && val.endsWith("]")) {
      return `${cssProp}: ${val.slice(1, -1).replace(/_/g, " ")}`;
    }
    const cssVal = TW_SPACING_REVERSE[val];
    return cssVal ? `${cssProp}: ${cssVal}` : null;
  };
};

const colorToCSS = (cssProp: string) => {
  return (match: RegExpMatchArray): string | null => {
    const val = match[1];
    if (val.startsWith("[") && val.endsWith("]")) {
      return `${cssProp}: ${val.slice(1, -1).replace(/_/g, " ")}`;
    }
    const hex = TW_COLOR_REVERSE[val];
    return hex ? `${cssProp}: ${hex}` : `${cssProp}: /* ${val} */`;
  };
};

const TW_RULES: TwRule[] = [
  // Display
  { pattern: /^block$/, toCSS: () => "display: block" },
  { pattern: /^inline-block$/, toCSS: () => "display: inline-block" },
  { pattern: /^inline$/, toCSS: () => "display: inline" },
  { pattern: /^flex$/, toCSS: () => "display: flex" },
  { pattern: /^inline-flex$/, toCSS: () => "display: inline-flex" },
  { pattern: /^grid$/, toCSS: () => "display: grid" },
  { pattern: /^inline-grid$/, toCSS: () => "display: inline-grid" },
  { pattern: /^hidden$/, toCSS: () => "display: none" },
  { pattern: /^table$/, toCSS: () => "display: table" },
  { pattern: /^contents$/, toCSS: () => "display: contents" },
  // Position
  { pattern: /^static$/, toCSS: () => "position: static" },
  { pattern: /^relative$/, toCSS: () => "position: relative" },
  { pattern: /^absolute$/, toCSS: () => "position: absolute" },
  { pattern: /^fixed$/, toCSS: () => "position: fixed" },
  { pattern: /^sticky$/, toCSS: () => "position: sticky" },
  // Flex direction
  { pattern: /^flex-row$/, toCSS: () => "flex-direction: row" },
  { pattern: /^flex-row-reverse$/, toCSS: () => "flex-direction: row-reverse" },
  { pattern: /^flex-col$/, toCSS: () => "flex-direction: column" },
  { pattern: /^flex-col-reverse$/, toCSS: () => "flex-direction: column-reverse" },
  { pattern: /^flex-wrap$/, toCSS: () => "flex-wrap: wrap" },
  { pattern: /^flex-nowrap$/, toCSS: () => "flex-wrap: nowrap" },
  // Justify / Align
  { pattern: /^justify-start$/, toCSS: () => "justify-content: flex-start" },
  { pattern: /^justify-end$/, toCSS: () => "justify-content: flex-end" },
  { pattern: /^justify-center$/, toCSS: () => "justify-content: center" },
  { pattern: /^justify-between$/, toCSS: () => "justify-content: space-between" },
  { pattern: /^justify-around$/, toCSS: () => "justify-content: space-around" },
  { pattern: /^justify-evenly$/, toCSS: () => "justify-content: space-evenly" },
  { pattern: /^items-start$/, toCSS: () => "align-items: flex-start" },
  { pattern: /^items-end$/, toCSS: () => "align-items: flex-end" },
  { pattern: /^items-center$/, toCSS: () => "align-items: center" },
  { pattern: /^items-baseline$/, toCSS: () => "align-items: baseline" },
  { pattern: /^items-stretch$/, toCSS: () => "align-items: stretch" },
  // Spacing
  { pattern: /^m-(.+)$/, toCSS: spacingToCSS("m", "margin") },
  { pattern: /^mt-(.+)$/, toCSS: spacingToCSS("mt", "margin-top") },
  { pattern: /^mr-(.+)$/, toCSS: spacingToCSS("mr", "margin-right") },
  { pattern: /^mb-(.+)$/, toCSS: spacingToCSS("mb", "margin-bottom") },
  { pattern: /^ml-(.+)$/, toCSS: spacingToCSS("ml", "margin-left") },
  { pattern: /^mx-(.+)$/, toCSS: (m) => { const r = spacingToCSS("mx", "margin-left")(m); return r ? `${r};\n  margin-right: ${r.split(": ")[1]}` : null; } },
  { pattern: /^my-(.+)$/, toCSS: (m) => { const r = spacingToCSS("my", "margin-top")(m); return r ? `${r};\n  margin-bottom: ${r.split(": ")[1]}` : null; } },
  { pattern: /^p-(.+)$/, toCSS: spacingToCSS("p", "padding") },
  { pattern: /^pt-(.+)$/, toCSS: spacingToCSS("pt", "padding-top") },
  { pattern: /^pr-(.+)$/, toCSS: spacingToCSS("pr", "padding-right") },
  { pattern: /^pb-(.+)$/, toCSS: spacingToCSS("pb", "padding-bottom") },
  { pattern: /^pl-(.+)$/, toCSS: spacingToCSS("pl", "padding-left") },
  { pattern: /^px-(.+)$/, toCSS: (m) => { const r = spacingToCSS("px", "padding-left")(m); return r ? `${r};\n  padding-right: ${r.split(": ")[1]}` : null; } },
  { pattern: /^py-(.+)$/, toCSS: (m) => { const r = spacingToCSS("py", "padding-top")(m); return r ? `${r};\n  padding-bottom: ${r.split(": ")[1]}` : null; } },
  // Width / Height
  { pattern: /^w-full$/, toCSS: () => "width: 100%" },
  { pattern: /^w-screen$/, toCSS: () => "width: 100vw" },
  { pattern: /^w-auto$/, toCSS: () => "width: auto" },
  { pattern: /^w-(.+)$/, toCSS: spacingToCSS("w", "width") },
  { pattern: /^h-full$/, toCSS: () => "height: 100%" },
  { pattern: /^h-screen$/, toCSS: () => "height: 100vh" },
  { pattern: /^h-auto$/, toCSS: () => "height: auto" },
  { pattern: /^h-(.+)$/, toCSS: spacingToCSS("h", "height") },
  { pattern: /^min-w-0$/, toCSS: () => "min-width: 0" },
  { pattern: /^min-w-full$/, toCSS: () => "min-width: 100%" },
  { pattern: /^min-h-0$/, toCSS: () => "min-height: 0" },
  { pattern: /^min-h-full$/, toCSS: () => "min-height: 100%" },
  { pattern: /^min-h-screen$/, toCSS: () => "min-height: 100vh" },
  { pattern: /^max-w-none$/, toCSS: () => "max-width: none" },
  { pattern: /^max-w-(.+)$/, toCSS: spacingToCSS("max-w", "max-width") },
  { pattern: /^max-h-(.+)$/, toCSS: spacingToCSS("max-h", "max-height") },
  // Gap
  { pattern: /^gap-(.+)$/, toCSS: spacingToCSS("gap", "gap") },
  { pattern: /^gap-x-(.+)$/, toCSS: spacingToCSS("gap-x", "column-gap") },
  { pattern: /^gap-y-(.+)$/, toCSS: spacingToCSS("gap-y", "row-gap") },
  // Typography
  { pattern: /^text-(xs|sm|base|lg|xl|2xl|3xl|4xl|5xl|6xl|7xl|8xl|9xl)$/, toCSS: (m) => { const s = TW_FONT_SIZE_REVERSE[m[1]]; return s ? `font-size: ${s}` : null; } },
  { pattern: /^font-(thin|extralight|light|normal|medium|semibold|bold|extrabold|black)$/, toCSS: (m) => { const w = TW_FONT_WEIGHT_REVERSE[m[1]]; return w ? `font-weight: ${w}` : null; } },
  { pattern: /^italic$/, toCSS: () => "font-style: italic" },
  { pattern: /^not-italic$/, toCSS: () => "font-style: normal" },
  { pattern: /^font-sans$/, toCSS: () => "font-family: ui-sans-serif, system-ui, sans-serif" },
  { pattern: /^font-serif$/, toCSS: () => "font-family: ui-serif, Georgia, serif" },
  { pattern: /^font-mono$/, toCSS: () => "font-family: ui-monospace, monospace" },
  { pattern: /^text-left$/, toCSS: () => "text-align: left" },
  { pattern: /^text-center$/, toCSS: () => "text-align: center" },
  { pattern: /^text-right$/, toCSS: () => "text-align: right" },
  { pattern: /^text-justify$/, toCSS: () => "text-align: justify" },
  { pattern: /^underline$/, toCSS: () => "text-decoration: underline" },
  { pattern: /^line-through$/, toCSS: () => "text-decoration: line-through" },
  { pattern: /^no-underline$/, toCSS: () => "text-decoration: none" },
  { pattern: /^uppercase$/, toCSS: () => "text-transform: uppercase" },
  { pattern: /^lowercase$/, toCSS: () => "text-transform: lowercase" },
  { pattern: /^capitalize$/, toCSS: () => "text-transform: capitalize" },
  { pattern: /^normal-case$/, toCSS: () => "text-transform: none" },
  { pattern: /^truncate$/, toCSS: () => "overflow: hidden;\n  text-overflow: ellipsis;\n  white-space: nowrap" },
  { pattern: /^leading-none$/, toCSS: () => "line-height: 1" },
  { pattern: /^leading-tight$/, toCSS: () => "line-height: 1.25" },
  { pattern: /^leading-snug$/, toCSS: () => "line-height: 1.375" },
  { pattern: /^leading-normal$/, toCSS: () => "line-height: 1.5" },
  { pattern: /^leading-relaxed$/, toCSS: () => "line-height: 1.625" },
  { pattern: /^leading-loose$/, toCSS: () => "line-height: 2" },
  // Colors
  { pattern: /^text-(.+)$/, toCSS: colorToCSS("color") },
  { pattern: /^bg-(.+)$/, toCSS: colorToCSS("background-color") },
  { pattern: /^border-(.+)$/, toCSS: colorToCSS("border-color") },
  // Border
  { pattern: /^border-0$/, toCSS: () => "border-width: 0" },
  { pattern: /^border$/, toCSS: () => "border-width: 1px" },
  { pattern: /^border-2$/, toCSS: () => "border-width: 2px" },
  { pattern: /^border-4$/, toCSS: () => "border-width: 4px" },
  { pattern: /^border-8$/, toCSS: () => "border-width: 8px" },
  { pattern: /^border-solid$/, toCSS: () => "border-style: solid" },
  { pattern: /^border-dashed$/, toCSS: () => "border-style: dashed" },
  { pattern: /^border-dotted$/, toCSS: () => "border-style: dotted" },
  { pattern: /^border-none$/, toCSS: () => "border-style: none" },
  { pattern: /^rounded$/, toCSS: () => "border-radius: 0.25rem" },
  { pattern: /^rounded-none$/, toCSS: () => "border-radius: 0" },
  { pattern: /^rounded-sm$/, toCSS: () => "border-radius: 0.125rem" },
  { pattern: /^rounded-md$/, toCSS: () => "border-radius: 0.375rem" },
  { pattern: /^rounded-lg$/, toCSS: () => "border-radius: 0.5rem" },
  { pattern: /^rounded-xl$/, toCSS: () => "border-radius: 0.75rem" },
  { pattern: /^rounded-2xl$/, toCSS: () => "border-radius: 1rem" },
  { pattern: /^rounded-3xl$/, toCSS: () => "border-radius: 1.5rem" },
  { pattern: /^rounded-full$/, toCSS: () => "border-radius: 9999px" },
  // Overflow
  { pattern: /^overflow-auto$/, toCSS: () => "overflow: auto" },
  { pattern: /^overflow-hidden$/, toCSS: () => "overflow: hidden" },
  { pattern: /^overflow-visible$/, toCSS: () => "overflow: visible" },
  { pattern: /^overflow-scroll$/, toCSS: () => "overflow: scroll" },
  // Opacity
  { pattern: /^opacity-(\d+)$/, toCSS: (m) => `opacity: ${parseInt(m[1]) / 100}` },
  // Cursor
  { pattern: /^cursor-pointer$/, toCSS: () => "cursor: pointer" },
  { pattern: /^cursor-default$/, toCSS: () => "cursor: default" },
  { pattern: /^cursor-not-allowed$/, toCSS: () => "cursor: not-allowed" },
  { pattern: /^cursor-grab$/, toCSS: () => "cursor: grab" },
  { pattern: /^cursor-text$/, toCSS: () => "cursor: text" },
  // Z-index
  { pattern: /^z-(\d+)$/, toCSS: (m) => `z-index: ${m[1]}` },
  { pattern: /^z-auto$/, toCSS: () => "z-index: auto" },
  // Shadow
  { pattern: /^shadow-sm$/, toCSS: () => "box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05)" },
  { pattern: /^shadow$/, toCSS: () => "box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)" },
  { pattern: /^shadow-md$/, toCSS: () => "box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)" },
  { pattern: /^shadow-lg$/, toCSS: () => "box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)" },
  { pattern: /^shadow-xl$/, toCSS: () => "box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)" },
  { pattern: /^shadow-2xl$/, toCSS: () => "box-shadow: 0 25px 50px -12px rgb(0 0 0 / 0.25)" },
  { pattern: /^shadow-none$/, toCSS: () => "box-shadow: none" },
  // Transition
  { pattern: /^transition$/, toCSS: () => "transition-property: color, background-color, border-color, text-decoration-color, fill, stroke, opacity, box-shadow, transform, filter, backdrop-filter;\n  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);\n  transition-duration: 150ms" },
  { pattern: /^transition-all$/, toCSS: () => "transition-property: all;\n  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);\n  transition-duration: 150ms" },
  { pattern: /^transition-colors$/, toCSS: () => "transition-property: color, background-color, border-color, text-decoration-color, fill, stroke;\n  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);\n  transition-duration: 150ms" },
  { pattern: /^transition-none$/, toCSS: () => "transition-property: none" },
  { pattern: /^duration-(\d+)$/, toCSS: (m) => `transition-duration: ${m[1]}ms` },
  // Inset
  { pattern: /^inset-(.+)$/, toCSS: spacingToCSS("inset", "inset") },
  { pattern: /^top-(.+)$/, toCSS: spacingToCSS("top", "top") },
  { pattern: /^right-(.+)$/, toCSS: spacingToCSS("right", "right") },
  { pattern: /^bottom-(.+)$/, toCSS: spacingToCSS("bottom", "bottom") },
  { pattern: /^left-(.+)$/, toCSS: spacingToCSS("left", "left") },
  // List
  { pattern: /^list-none$/, toCSS: () => "list-style-type: none" },
  { pattern: /^list-disc$/, toCSS: () => "list-style-type: disc" },
  { pattern: /^list-decimal$/, toCSS: () => "list-style-type: decimal" },
  // Select
  { pattern: /^select-none$/, toCSS: () => "user-select: none" },
  { pattern: /^select-text$/, toCSS: () => "user-select: text" },
  { pattern: /^select-all$/, toCSS: () => "user-select: all" },
  { pattern: /^select-auto$/, toCSS: () => "user-select: auto" },
  // Grid cols
  { pattern: /^grid-cols-(\d+)$/, toCSS: (m) => `grid-template-columns: repeat(${m[1]}, minmax(0, 1fr))` },
  // Resize
  { pattern: /^resize-none$/, toCSS: () => "resize: none" },
  { pattern: /^resize$/, toCSS: () => "resize: both" },
  { pattern: /^resize-y$/, toCSS: () => "resize: vertical" },
  { pattern: /^resize-x$/, toCSS: () => "resize: horizontal" },
  // Object fit
  { pattern: /^object-contain$/, toCSS: () => "object-fit: contain" },
  { pattern: /^object-cover$/, toCSS: () => "object-fit: cover" },
  { pattern: /^object-fill$/, toCSS: () => "object-fit: fill" },
  { pattern: /^object-none$/, toCSS: () => "object-fit: none" },
  // Pointer events
  { pattern: /^pointer-events-none$/, toCSS: () => "pointer-events: none" },
  { pattern: /^pointer-events-auto$/, toCSS: () => "pointer-events: auto" },
  // Visibility
  { pattern: /^visible$/, toCSS: () => "visibility: visible" },
  { pattern: /^invisible$/, toCSS: () => "visibility: hidden" },
  // Whitespace
  { pattern: /^whitespace-normal$/, toCSS: () => "white-space: normal" },
  { pattern: /^whitespace-nowrap$/, toCSS: () => "white-space: nowrap" },
  { pattern: /^whitespace-pre$/, toCSS: () => "white-space: pre" },
  { pattern: /^whitespace-pre-line$/, toCSS: () => "white-space: pre-line" },
  { pattern: /^whitespace-pre-wrap$/, toCSS: () => "white-space: pre-wrap" },
  // Grow / Shrink
  { pattern: /^grow$/, toCSS: () => "flex-grow: 1" },
  { pattern: /^grow-0$/, toCSS: () => "flex-grow: 0" },
  { pattern: /^shrink$/, toCSS: () => "flex-shrink: 1" },
  { pattern: /^shrink-0$/, toCSS: () => "flex-shrink: 0" },
  // Appearance
  { pattern: /^appearance-none$/, toCSS: () => "appearance: none" },
  // Outline
  { pattern: /^outline-none$/, toCSS: () => "outline: 2px solid transparent;\n  outline-offset: 2px" },
  // Arbitrary values
  { pattern: /^(\w[\w-]*)-\[(.+)\]$/, toCSS: (m) => {
    const val = m[2].replace(/_/g, " ");
    const propMap: Record<string, string> = {
      "w": "width", "h": "height", "p": "padding", "m": "margin",
      "pt": "padding-top", "pr": "padding-right", "pb": "padding-bottom", "pl": "padding-left",
      "mt": "margin-top", "mr": "margin-right", "mb": "margin-bottom", "ml": "margin-left",
      "text": "font-size", "font": "font-family", "bg": "background-color",
      "rounded": "border-radius", "gap": "gap", "top": "top", "right": "right",
      "bottom": "bottom", "left": "left", "z": "z-index", "opacity": "opacity",
      "max-w": "max-width", "max-h": "max-height", "min-w": "min-width", "min-h": "min-height",
    };
    const cssProp = propMap[m[1]];
    return cssProp ? `${cssProp}: ${val}` : null;
  }},
];

const convertTailwindToCSS = (input: string): { css: string; unconverted: string[] } => {
  const classes = input.trim().split(/\s+/).filter(Boolean);
  const declarations: string[] = [];
  const unconverted: string[] = [];

  for (const cls of classes) {
    // Strip responsive/state prefixes for matching
    const baseCls = cls.replace(/^(sm:|md:|lg:|xl:|2xl:|hover:|focus:|active:|disabled:|dark:|group-hover:|first:|last:|odd:|even:)+/, "");

    let found = false;
    for (const rule of TW_RULES) {
      const match = baseCls.match(rule.pattern);
      if (match) {
        const result = rule.toCSS(match);
        if (result) {
          declarations.push(result);
          found = true;
          break;
        }
      }
    }
    if (!found) {
      unconverted.push(cls);
    }
  }

  const css = declarations.length > 0
    ? `.element {\n  ${declarations.join(";\n  ")};\n}`
    : "";
  return { css, unconverted };
};

// ── Examples ──

const CSS_EXAMPLE = `.card {
  display: flex;
  flex-direction: column;
  padding: 1.5rem;
  margin-bottom: 1rem;
  background-color: #ffffff;
  border-radius: 0.5rem;
  border-width: 1px;
  border-color: #e2e8f0;
  box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
  overflow: hidden;
  cursor: pointer;
  transition-property: all;
  transition-duration: 200ms;
}`;

const TW_EXAMPLE = `flex flex-col p-6 mb-4 bg-white rounded-lg border border-slate-200 shadow overflow-hidden cursor-pointer transition-all duration-200`;

type ConversionMode = "css-to-tw" | "tw-to-css";

export default function TailwindCssConverterPage() {
  const [mode, setMode] = useState<ConversionMode>("css-to-tw");
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [unconverted, setUnconverted] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);

  const handleConvert = useCallback(() => {
    if (!input.trim()) {
      setOutput("");
      setUnconverted([]);
      return;
    }

    if (mode === "css-to-tw") {
      const result = convertCssToTailwind(input);
      setOutput(result.classes.join(" "));
      setUnconverted(result.unconverted);
    } else {
      const result = convertTailwindToCSS(input);
      setOutput(result.css);
      setUnconverted(result.unconverted);
    }
  }, [input, mode]);

  const handleCopy = useCallback(async () => {
    if (!output) return;
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [output]);

  const handleClear = useCallback(() => {
    setInput("");
    setOutput("");
    setUnconverted([]);
  }, []);

  const loadExample = useCallback(() => {
    setInput(mode === "css-to-tw" ? CSS_EXAMPLE : TW_EXAMPLE);
    setOutput("");
    setUnconverted([]);
  }, [mode]);

  const swapMode = useCallback(() => {
    const newMode = mode === "css-to-tw" ? "tw-to-css" : "css-to-tw";
    setMode(newMode as ConversionMode);
    // If output exists, swap it into input
    if (output) {
      setInput(output);
      setOutput("");
      setUnconverted([]);
    }
  }, [mode, output]);

  return (
    <>
      <title>Tailwind CSS Converter - Free Online Tool | DevTools Hub</title>
      <meta
        name="description"
        content="Convert CSS to Tailwind utility classes and Tailwind classes back to CSS. Bidirectional conversion with spacing, colors, typography, flexbox, grid, and 80+ properties — all in your browser."
      />
      <JsonLd
        data={[
          generateWebAppSchema({
            slug: "tailwind-css-converter",
            name: "Tailwind CSS Converter",
            description: "Convert between Tailwind CSS classes and plain CSS",
            category: "css",
          }),
          generateBreadcrumbSchema({
            slug: "tailwind-css-converter",
            name: "Tailwind CSS Converter",
            description: "Convert between Tailwind CSS classes and plain CSS",
            category: "css",
          }),
          generateFAQSchema([
            { question: "How does the CSS to Tailwind conversion work?", answer: "The tool parses your CSS declarations and maps each property-value pair to the corresponding Tailwind utility class. It supports the default Tailwind spacing scale, color palette, typography scale, and most common CSS properties. Unrecognized values use Tailwind's arbitrary value syntax (e.g., w-[137px])." },
            { question: "Does this handle responsive prefixes like sm: and md:?", answer: "For Tailwind \u2192 CSS conversion, responsive and state prefixes (sm:, md:, hover:, focus:, etc.) are stripped during conversion to produce the base CSS properties. For CSS \u2192 Tailwind, you'll need to add responsive prefixes manually since CSS media queries and the Tailwind responsive system map differently." },
            { question: "What Tailwind version does this target?", answer: "This converter targets Tailwind CSS v3/v4 utility class syntax, which uses the standard spacing scale (0, 0.5, 1, 2, 3, 4... 96), default color palette names, and the JIT-enabled arbitrary value bracket syntax for custom values." },
            { question: "Is my code safe? Does anything get sent to a server?", answer: "All conversion happens entirely in your browser using JavaScript. No CSS or Tailwind code is sent to any server. Your code never leaves your machine." },
          ]),
        ]}
      />

      <main className="min-h-screen bg-slate-900 text-white">
        <div className="max-w-6xl mx-auto px-4 py-12">
          <ToolBreadcrumb slug="tailwind-css-converter" />

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
              Tailwind CSS Converter
            </h1>
            <p className="text-slate-400 max-w-2xl text-lg">
              Convert between CSS properties and Tailwind utility classes. Supports spacing, colors, typography, flexbox, grid, borders, shadows, transitions, and 80+ CSS properties.
            </p>
          </div>

          {/* Mode toggle */}
          <div className="flex items-center gap-3 mb-6">
            <button
              onClick={() => { setMode("css-to-tw"); setOutput(""); setUnconverted([]); }}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                mode === "css-to-tw"
                  ? "bg-blue-600 text-white"
                  : "bg-slate-800 text-slate-400 hover:text-white"
              }`}
            >
              CSS → Tailwind
            </button>
            <button
              onClick={swapMode}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg transition-colors"
              title="Swap direction"
            >
              ⇄
            </button>
            <button
              onClick={() => { setMode("tw-to-css"); setOutput(""); setUnconverted([]); }}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                mode === "tw-to-css"
                  ? "bg-blue-600 text-white"
                  : "bg-slate-800 text-slate-400 hover:text-white"
              }`}
            >
              Tailwind → CSS
            </button>
          </div>

          {/* Controls */}
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <button
              onClick={handleConvert}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              Convert
            </button>
            <button
              onClick={handleCopy}
              disabled={!output}
              className="px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-sm"
            >
              {copied ? "Copied!" : "Copy Output"}
            </button>
            <button
              onClick={handleClear}
              className="px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors text-sm"
            >
              Clear
            </button>
            <button
              onClick={loadExample}
              className="px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors text-sm"
            >
              Load Example
            </button>
          </div>

          {/* Panels */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
            {/* Input */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-slate-300">
                  {mode === "css-to-tw" ? "CSS Input" : "Tailwind Classes"}
                </label>
                <span className="text-xs text-slate-500">{input.length} chars</span>
              </div>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={mode === "css-to-tw"
                  ? "Paste CSS declarations here...\ne.g. display: flex;\n     padding: 1rem;"
                  : "Paste Tailwind classes here...\ne.g. flex p-4 bg-white rounded-lg shadow"
                }
                className="w-full h-80 bg-slate-800 border border-slate-700 rounded-lg p-4 font-mono text-sm text-slate-200 placeholder-slate-500 resize-y focus:outline-none focus:ring-2 focus:ring-blue-500"
                spellCheck={false}
              />
            </div>

            {/* Output */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-slate-300">
                  {mode === "css-to-tw" ? "Tailwind Classes" : "CSS Output"}
                </label>
                {output && (
                  <span className="text-xs text-green-400">
                    {mode === "css-to-tw"
                      ? `${output.split(/\s+/).filter(Boolean).length} classes`
                      : `${output.split("\n").filter((l) => l.includes(":")).length} properties`
                    }
                  </span>
                )}
              </div>
              <textarea
                value={output}
                readOnly
                placeholder="Converted output will appear here..."
                className="w-full h-80 bg-slate-800 border border-slate-700 rounded-lg p-4 font-mono text-sm text-green-300 placeholder-slate-500 resize-y focus:outline-none"
                spellCheck={false}
              />
            </div>
          </div>

          {/* Unconverted */}
          {unconverted.length > 0 && (
            <div className="mb-6 p-4 bg-yellow-900/30 border border-yellow-700/50 rounded-lg">
              <div className="text-sm font-medium text-yellow-400 mb-2">
                {unconverted.length} unconverted {unconverted.length === 1 ? "item" : "items"}:
              </div>
              <div className="flex flex-wrap gap-2">
                {unconverted.map((item, i) => (
                  <span key={i} className="px-2 py-1 bg-yellow-900/40 text-yellow-300 rounded text-xs font-mono">
                    {item}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Supported properties reference */}
          <div className="bg-slate-800 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Supported CSS Properties</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-4 gap-y-1 text-sm">
              {[
                "display", "position", "flex-direction", "flex-wrap", "justify-content",
                "align-items", "align-self", "flex-grow", "flex-shrink", "grid-template-columns",
                "gap", "margin (all sides)", "padding (all sides)", "width", "height",
                "min/max width", "min/max height", "font-size", "font-weight", "font-style",
                "font-family", "text-align", "text-decoration", "text-transform",
                "letter-spacing", "line-height", "white-space", "color", "background-color",
                "border-color", "border-width", "border-style", "border-radius",
                "overflow", "opacity", "cursor", "z-index", "box-shadow",
                "transition", "top/right/bottom/left", "list-style-type", "user-select",
                "resize", "object-fit", "pointer-events", "visibility",
              ].map((prop) => (
                <div key={prop} className="text-slate-400 font-mono text-xs py-0.5">{prop}</div>
              ))}
            </div>
          </div>

          <RelatedTools currentSlug="tailwind-css-converter" />

          {/* FAQ */}
          <div className="bg-slate-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Frequently Asked Questions</h2>
            <div className="space-y-4">
              {[
                {
                  q: "How does the CSS to Tailwind conversion work?",
                  a: "The tool parses your CSS declarations and maps each property-value pair to the corresponding Tailwind utility class. It supports the default Tailwind spacing scale, color palette, typography scale, and most common CSS properties. Unrecognized values use Tailwind's arbitrary value syntax (e.g., w-[137px])."
                },
                {
                  q: "Does this handle responsive prefixes like sm: and md:?",
                  a: "For Tailwind → CSS conversion, responsive and state prefixes (sm:, md:, hover:, focus:, etc.) are stripped during conversion to produce the base CSS properties. For CSS → Tailwind, you'll need to add responsive prefixes manually since CSS media queries and the Tailwind responsive system map differently."
                },
                {
                  q: "What Tailwind version does this target?",
                  a: "This converter targets Tailwind CSS v3/v4 utility class syntax, which uses the standard spacing scale (0, 0.5, 1, 2, 3, 4... 96), default color palette names, and the JIT-enabled arbitrary value bracket syntax for custom values."
                },
                {
                  q: "Is my code safe? Does anything get sent to a server?",
                  a: "All conversion happens entirely in your browser using JavaScript. No CSS or Tailwind code is sent to any server. Your code never leaves your machine."
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
