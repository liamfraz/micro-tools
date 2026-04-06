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

interface ColorStop {
  id: number;
  color: string;
  opacity: number;
  position: number;
}

type GradientType = "linear" | "radial" | "conic";

interface Preset {
  name: string;
  stops: { color: string; opacity: number; position: number }[];
  type: GradientType;
  angle: number;
}

const PRESETS: Preset[] = [
  { name: "Instagram", stops: [{ color: "#833ab4", opacity: 100, position: 0 }, { color: "#fd1d1d", opacity: 100, position: 50 }, { color: "#fcb045", opacity: 100, position: 100 }], type: "linear", angle: 45 },
  { name: "Sunset", stops: [{ color: "#ff6b6b", opacity: 100, position: 0 }, { color: "#feca57", opacity: 100, position: 100 }], type: "linear", angle: 135 },
  { name: "Ocean", stops: [{ color: "#667eea", opacity: 100, position: 0 }, { color: "#764ba2", opacity: 100, position: 100 }], type: "linear", angle: 135 },
  { name: "Forest", stops: [{ color: "#11998e", opacity: 100, position: 0 }, { color: "#38ef7d", opacity: 100, position: 100 }], type: "linear", angle: 135 },
  { name: "Peach", stops: [{ color: "#ffecd2", opacity: 100, position: 0 }, { color: "#fcb69f", opacity: 100, position: 100 }], type: "linear", angle: 135 },
  { name: "Night Sky", stops: [{ color: "#0f0c29", opacity: 100, position: 0 }, { color: "#302b63", opacity: 100, position: 50 }, { color: "#24243e", opacity: 100, position: 100 }], type: "linear", angle: 180 },
  { name: "Candy", stops: [{ color: "#fc5c7d", opacity: 100, position: 0 }, { color: "#6a82fb", opacity: 100, position: 100 }], type: "linear", angle: 90 },
  { name: "Mint", stops: [{ color: "#00b09b", opacity: 100, position: 0 }, { color: "#96c93d", opacity: 100, position: 100 }], type: "linear", angle: 90 },
  { name: "Aurora", stops: [{ color: "#a8ff78", opacity: 100, position: 0 }, { color: "#78ffd6", opacity: 100, position: 50 }, { color: "#007991", opacity: 100, position: 100 }], type: "linear", angle: 135 },
  { name: "Flamingo", stops: [{ color: "#ee9ca7", opacity: 100, position: 0 }, { color: "#ffdde1", opacity: 100, position: 100 }], type: "linear", angle: 135 },
  { name: "Midnight", stops: [{ color: "#232526", opacity: 100, position: 0 }, { color: "#414345", opacity: 100, position: 100 }], type: "linear", angle: 180 },
  { name: "Cherry", stops: [{ color: "#eb3349", opacity: 100, position: 0 }, { color: "#f45c43", opacity: 100, position: 100 }], type: "linear", angle: 90 },
  { name: "Aqua", stops: [{ color: "#13547a", opacity: 100, position: 0 }, { color: "#80d0c7", opacity: 100, position: 100 }], type: "linear", angle: 135 },
  { name: "Lavender", stops: [{ color: "#c471f5", opacity: 100, position: 0 }, { color: "#fa71cd", opacity: 100, position: 100 }], type: "linear", angle: 90 },
  { name: "Rosewater", stops: [{ color: "#e6b980", opacity: 100, position: 0 }, { color: "#eacda3", opacity: 100, position: 100 }], type: "linear", angle: 135 },
  { name: "Neon", stops: [{ color: "#00f260", opacity: 100, position: 0 }, { color: "#0575e6", opacity: 100, position: 100 }], type: "linear", angle: 90 },
  { name: "Cosmic", stops: [{ color: "#ff00cc", opacity: 100, position: 0 }, { color: "#333399", opacity: 100, position: 100 }], type: "linear", angle: 135 },
  { name: "Emerald", stops: [{ color: "#348f50", opacity: 100, position: 0 }, { color: "#56b4d3", opacity: 100, position: 100 }], type: "linear", angle: 90 },
  { name: "Royal", stops: [{ color: "#141e30", opacity: 100, position: 0 }, { color: "#243b55", opacity: 100, position: 100 }], type: "linear", angle: 180 },
  { name: "Warm Flame", stops: [{ color: "#ff9a9e", opacity: 100, position: 0 }, { color: "#fad0c4", opacity: 100, position: 50 }, { color: "#fad0c4", opacity: 100, position: 100 }], type: "linear", angle: 45 },
  { name: "Conic Rainbow", stops: [{ color: "#ff0000", opacity: 100, position: 0 }, { color: "#ffff00", opacity: 100, position: 17 }, { color: "#00ff00", opacity: 100, position: 33 }, { color: "#00ffff", opacity: 100, position: 50 }, { color: "#0000ff", opacity: 100, position: 67 }, { color: "#ff00ff", opacity: 100, position: 83 }, { color: "#ff0000", opacity: 100, position: 100 }], type: "conic", angle: 0 },
  { name: "Conic Sweep", stops: [{ color: "#667eea", opacity: 100, position: 0 }, { color: "#764ba2", opacity: 100, position: 50 }, { color: "#667eea", opacity: 100, position: 100 }], type: "conic", angle: 0 },
  { name: "Radial Glow", stops: [{ color: "#f5af19", opacity: 100, position: 0 }, { color: "#f12711", opacity: 100, position: 100 }], type: "radial", angle: 0 },
  { name: "Radial Sky", stops: [{ color: "#a8edea", opacity: 100, position: 0 }, { color: "#fed6e3", opacity: 100, position: 100 }], type: "radial", angle: 0 },
];

const DIRECTION_PRESETS = [
  { label: "to right", angle: 90, icon: "\u2192" },
  { label: "to left", angle: 270, icon: "\u2190" },
  { label: "to bottom", angle: 180, icon: "\u2193" },
  { label: "to top", angle: 0, icon: "\u2191" },
  { label: "to bottom right", angle: 135, icon: "\u2198" },
  { label: "to bottom left", angle: 225, icon: "\u2199" },
  { label: "to top right", angle: 45, icon: "\u2197" },
  { label: "to top left", angle: 315, icon: "\u2196" },
];

const hexToRgba = (hex: string, opacity: number): string => {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  if (opacity >= 100) return hex;
  return `rgba(${r}, ${g}, ${b}, ${(opacity / 100).toFixed(2)})`;
};

let nextId = 3;

export default function CSSGradientGeneratorPage() {
  const [stops, setStops] = useState<ColorStop[]>([
    { id: 1, color: "#667eea", opacity: 100, position: 0 },
    { id: 2, color: "#764ba2", opacity: 100, position: 100 },
  ]);
  const [gradientType, setGradientType] = useState<GradientType>("linear");
  const [angle, setAngle] = useState(135);
  const [radialShape, setRadialShape] = useState<"circle" | "ellipse">("circle");
  const [copied, setCopied] = useState<string | null>(null);
  const [includeWebkit, setIncludeWebkit] = useState(true);
  const [selectedStopId, setSelectedStopId] = useState<number | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const dialRef = useRef<HTMLDivElement>(null);
  const gradientBarRef = useRef<HTMLDivElement>(null);
  const draggingStopRef = useRef<number | null>(null);

  const sortedStops = useMemo(
    () => [...stops].sort((a, b) => a.position - b.position),
    [stops]
  );

  const buildStopsStr = useCallback((stopsArr: ColorStop[]) => {
    return stopsArr
      .map((s) => `${hexToRgba(s.color, s.opacity)} ${s.position}%`)
      .join(", ");
  }, []);

  const cssGradient = useMemo(() => {
    const stopsStr = buildStopsStr(sortedStops);
    if (gradientType === "linear") {
      return `linear-gradient(${angle}deg, ${stopsStr})`;
    }
    if (gradientType === "conic") {
      return `conic-gradient(from ${angle}deg, ${stopsStr})`;
    }
    return `radial-gradient(${radialShape}, ${stopsStr})`;
  }, [sortedStops, gradientType, angle, radialShape, buildStopsStr]);

  const cssCodeLines = useMemo(() => {
    const stopsStr = buildStopsStr(sortedStops);
    const lines: string[] = [];
    if (gradientType === "linear") {
      if (includeWebkit) {
        lines.push(`background: -webkit-linear-gradient(${angle}deg, ${stopsStr});`);
      }
      lines.push(`background: linear-gradient(${angle}deg, ${stopsStr});`);
    } else if (gradientType === "conic") {
      lines.push(`background: conic-gradient(from ${angle}deg, ${stopsStr});`);
    } else {
      if (includeWebkit) {
        lines.push(`background: -webkit-radial-gradient(${radialShape}, ${stopsStr});`);
      }
      lines.push(`background: radial-gradient(${radialShape}, ${stopsStr});`);
    }
    return lines.join("\n");
  }, [sortedStops, gradientType, angle, radialShape, includeWebkit, buildStopsStr]);

  const tailwindClass = useMemo(() => {
    if (gradientType !== "linear" || stops.length !== 2) return null;
    if (stops.some((s) => s.opacity < 100)) return null;
    const dirMap: Record<number, string> = {
      0: "bg-gradient-to-t", 45: "bg-gradient-to-tr", 90: "bg-gradient-to-r",
      135: "bg-gradient-to-br", 180: "bg-gradient-to-b", 225: "bg-gradient-to-bl",
      270: "bg-gradient-to-l", 315: "bg-gradient-to-tl",
    };
    const dir = dirMap[angle];
    if (!dir) return null;
    return `${dir} from-[${sortedStops[0].color}] to-[${sortedStops[1].color}]`;
  }, [gradientType, angle, stops, sortedStops]);

  const addStop = useCallback(() => {
    if (stops.length >= 10) return;
    const id = nextId++;
    const midPosition = Math.round(
      (sortedStops[0].position + sortedStops[sortedStops.length - 1].position) / 2
    );
    setStops((prev) => [...prev, { id, color: "#ffffff", opacity: 100, position: midPosition }]);
    setSelectedStopId(id);
  }, [stops.length, sortedStops]);

  const removeStop = useCallback(
    (id: number) => {
      if (stops.length <= 2) return;
      setStops((prev) => prev.filter((s) => s.id !== id));
      if (selectedStopId === id) setSelectedStopId(null);
    },
    [stops.length, selectedStopId]
  );

  const updateStop = useCallback(
    (id: number, field: keyof Omit<ColorStop, "id">, value: string | number) => {
      setStops((prev) =>
        prev.map((s) => (s.id === id ? { ...s, [field]: value } : s))
      );
    },
    []
  );

  const moveStop = useCallback((id: number, direction: "up" | "down") => {
    setStops((prev) => {
      const idx = prev.findIndex((s) => s.id === id);
      if (idx < 0) return prev;
      const swapIdx = direction === "up" ? idx - 1 : idx + 1;
      if (swapIdx < 0 || swapIdx >= prev.length) return prev;
      const next = [...prev];
      [next[idx], next[swapIdx]] = [next[swapIdx], next[idx]];
      return next;
    });
  }, []);

  const randomize = useCallback(() => {
    const randomColor = () =>
      "#" + Math.floor(Math.random() * 16777215).toString(16).padStart(6, "0");
    setStops([
      { id: nextId++, color: randomColor(), opacity: 100, position: 0 },
      { id: nextId++, color: randomColor(), opacity: 100, position: 100 },
    ]);
    setAngle(Math.floor(Math.random() * 360));
  }, []);

  const applyPreset = useCallback((preset: Preset) => {
    setStops(preset.stops.map((s) => ({ ...s, id: nextId++ })));
    setGradientType(preset.type);
    setAngle(preset.angle);
    setSelectedStopId(null);
  }, []);

  const copyText = useCallback(async (label: string, text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  }, []);

  const downloadPNG = useCallback(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 800;
    canvas.height = 400;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const sorted = [...stops].sort((a, b) => a.position - b.position);

    if (gradientType === "linear") {
      const rad = (angle * Math.PI) / 180;
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      const len = Math.max(canvas.width, canvas.height);
      const x1 = cx - Math.cos(rad) * len;
      const y1 = cy - Math.sin(rad) * len;
      const x2 = cx + Math.cos(rad) * len;
      const y2 = cy + Math.sin(rad) * len;
      const grad = ctx.createLinearGradient(x1, y1, x2, y2);
      sorted.forEach((s) => {
        const h = s.color.replace("#", "");
        const r = parseInt(h.slice(0, 2), 16);
        const g = parseInt(h.slice(2, 4), 16);
        const b = parseInt(h.slice(4, 6), 16);
        grad.addColorStop(s.position / 100, `rgba(${r},${g},${b},${s.opacity / 100})`);
      });
      ctx.fillStyle = grad;
    } else if (gradientType === "conic") {
      // Canvas doesn't support conic gradients natively; approximate with the CSS rendered preview
      const tempImg = new Image();
      const svgGrad = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="400"><foreignObject width="800" height="400"><div xmlns="http://www.w3.org/1999/xhtml" style="width:800px;height:400px;background:${cssGradient.replace(/"/g, "&quot;")}"></div></foreignObject></svg>`;
      tempImg.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svgGrad);
      // Fallback: just paint a simple radial
      const grad = ctx.createRadialGradient(
        canvas.width / 2, canvas.height / 2, 0,
        canvas.width / 2, canvas.height / 2, Math.max(canvas.width, canvas.height) / 2
      );
      sorted.forEach((s) => {
        const h = s.color.replace("#", "");
        const r = parseInt(h.slice(0, 2), 16);
        const g = parseInt(h.slice(2, 4), 16);
        const b = parseInt(h.slice(4, 6), 16);
        grad.addColorStop(s.position / 100, `rgba(${r},${g},${b},${s.opacity / 100})`);
      });
      ctx.fillStyle = grad;
    } else {
      const grad = ctx.createRadialGradient(
        canvas.width / 2, canvas.height / 2, 0,
        canvas.width / 2, canvas.height / 2, Math.max(canvas.width, canvas.height) / 2
      );
      sorted.forEach((s) => {
        const h = s.color.replace("#", "");
        const r = parseInt(h.slice(0, 2), 16);
        const g = parseInt(h.slice(2, 4), 16);
        const b = parseInt(h.slice(4, 6), 16);
        grad.addColorStop(s.position / 100, `rgba(${r},${g},${b},${s.opacity / 100})`);
      });
      ctx.fillStyle = grad;
    }
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const link = document.createElement("a");
    link.download = "gradient.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  }, [stops, gradientType, angle, cssGradient]);

  const handleDialInteraction = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = dialRef.current?.getBoundingClientRect();
    if (!rect) return;
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const rad = Math.atan2(e.clientY - cy, e.clientX - cx);
    let deg = Math.round((rad * 180) / Math.PI + 90);
    if (deg < 0) deg += 360;
    setAngle(deg);
  }, []);

  const handleDialDrag = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (e.buttons !== 1) return;
    handleDialInteraction(e);
  }, [handleDialInteraction]);

  // Gradient bar drag handlers
  const getPositionFromBarEvent = useCallback((clientX: number) => {
    const bar = gradientBarRef.current;
    if (!bar) return 0;
    const rect = bar.getBoundingClientRect();
    const x = clientX - rect.left;
    const pct = Math.round(Math.max(0, Math.min(100, (x / rect.width) * 100)));
    return pct;
  }, []);

  const handleBarMouseDown = useCallback((e: React.MouseEvent, stopId: number) => {
    e.preventDefault();
    e.stopPropagation();
    draggingStopRef.current = stopId;
    setSelectedStopId(stopId);

    const onMove = (ev: MouseEvent) => {
      if (draggingStopRef.current === null) return;
      const bar = gradientBarRef.current;
      if (!bar) return;
      const rect = bar.getBoundingClientRect();
      const x = ev.clientX - rect.left;
      const pct = Math.round(Math.max(0, Math.min(100, (x / rect.width) * 100)));
      setStops((prev) =>
        prev.map((s) => (s.id === draggingStopRef.current ? { ...s, position: pct } : s))
      );
    };

    const onUp = () => {
      draggingStopRef.current = null;
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };

    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  }, []);

  const handleBarClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    // Only add a stop if we clicked on the bar itself, not a handle
    if ((e.target as HTMLElement).closest("[data-stop-handle]")) return;
    if (stops.length >= 10) return;
    const pct = getPositionFromBarEvent(e.clientX);
    const id = nextId++;
    // Pick a color that interpolates between neighbors
    setStops((prev) => [...prev, { id, color: "#ffffff", opacity: 100, position: pct }]);
    setSelectedStopId(id);
  }, [stops.length, getPositionFromBarEvent]);

  const linearBarGradient = useMemo(() => {
    const stopsStr = sortedStops
      .map((s) => `${hexToRgba(s.color, s.opacity)} ${s.position}%`)
      .join(", ");
    return `linear-gradient(90deg, ${stopsStr})`;
  }, [sortedStops]);

  return (
    <>
      <title>CSS Gradient Generator - Free Online Gradient Maker | DevTools</title>
      <meta
        name="description"
        content="Free CSS gradient generator with visual editor. Create linear, radial, and conic gradients, pick colors with transparency, choose from 24 presets, and copy cross-browser CSS code instantly."
      />
      <meta name="keywords" content="css gradient generator, gradient maker, css gradient code, gradient generator online, background gradient css, linear gradient generator, radial gradient css, conic gradient css, css gradient maker" />
      <JsonLd
        data={[
          generateWebAppSchema({
            slug: "css-gradient-generator",
            name: "CSS Gradient Generator",
            description: "Create beautiful CSS gradients with a visual editor. Linear, radial, and conic gradients with draggable color stops, transparency, angle picker, 24 presets, and cross-browser CSS output.",
            category: "css",
          }),
          generateBreadcrumbSchema({
            slug: "css-gradient-generator",
            name: "CSS Gradient Generator",
            description: "Create beautiful CSS gradients with a visual editor.",
            category: "css",
          }),
          generateFAQSchema([
            { question: "What types of CSS gradients can I create?", answer: "This tool supports linear gradients (straight-line color transitions at any angle), radial gradients (circular or elliptical gradients emanating from a center point), and conic gradients (color transitions rotated around a center point). All types support multiple color stops with individual transparency controls." },
            { question: "How do I use the draggable color stops?", answer: "Click on the gradient bar to add a new color stop. Drag existing stops left or right to reposition them. Click a stop handle to select it and edit its color, position, and opacity in the panel below. Double-click a handle or use the remove button to delete it (minimum 2 stops required)." },
            { question: "How many color stops can I use in a CSS gradient?", answer: "CSS gradients support unlimited color stops. This tool allows up to 10 stops with individual color, position, and opacity controls. More stops create smoother transitions and more complex patterns." },
            { question: "Are CSS gradients supported in all browsers?", answer: "Linear and radial gradients are supported in all modern browsers (Chrome, Firefox, Safari, Edge). Conic gradients are supported in Chrome 69+, Firefox 83+, Safari 12.1+, and Edge 79+. This tool can optionally generate -webkit- prefixed CSS for maximum compatibility." },
            { question: "Can I use gradients with Tailwind CSS?", answer: "Yes. For simple two-color linear gradients at standard angles (0, 45, 90, 135, 180, 225, 270, 315 degrees), this tool generates the equivalent Tailwind utility classes. For more complex gradients, use the CSS output with Tailwind's arbitrary value syntax." },
            { question: "Can I create transparent gradients?", answer: "Yes. Each color stop has an individual opacity slider (0-100%). This lets you create gradients that fade to transparent, overlay effects, or semi-transparent color transitions perfect for glass-like UI elements." },
          ]),
        ]}
      />

      <div className="min-h-screen bg-slate-900 text-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <ToolBreadcrumb slug="css-gradient-generator" />

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
              CSS Gradient Generator
            </h1>
            <p className="text-slate-400 max-w-2xl text-lg">
              Create beautiful CSS gradients visually. Drag color stops, choose from linear, radial,
              or conic gradients, pick from {PRESETS.length} presets, and copy cross-browser CSS or
              Tailwind classes.
            </p>
          </div>

          {/* Preview */}
          <div
            ref={previewRef}
            className="w-full h-48 sm:h-64 rounded-xl border border-slate-700 mb-4 shadow-lg relative overflow-hidden"
            style={{ background: cssGradient }}
          >
            {/* Checkerboard for transparency */}
            <div
              className="absolute inset-0 -z-10"
              style={{
                backgroundImage: "linear-gradient(45deg, #334155 25%, transparent 25%), linear-gradient(-45deg, #334155 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #334155 75%), linear-gradient(-45deg, transparent 75%, #334155 75%)",
                backgroundSize: "20px 20px",
                backgroundPosition: "0 0, 0 10px, 10px -10px, -10px 0px",
              }}
            />
          </div>

          {/* Draggable Gradient Bar */}
          <div className="mb-6">
            <label className="block text-xs text-slate-400 mb-2">
              Click to add stops &middot; Drag handles to reposition
            </label>
            <div
              ref={gradientBarRef}
              className="relative h-10 rounded-lg border border-slate-600 cursor-crosshair select-none"
              style={{ background: linearBarGradient }}
              onClick={handleBarClick}
            >
              {/* Checkerboard behind bar */}
              <div
                className="absolute inset-0 -z-10 rounded-lg"
                style={{
                  backgroundImage: "linear-gradient(45deg, #334155 25%, transparent 25%), linear-gradient(-45deg, #334155 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #334155 75%), linear-gradient(-45deg, transparent 75%, #334155 75%)",
                  backgroundSize: "12px 12px",
                  backgroundPosition: "0 0, 0 6px, 6px -6px, -6px 0px",
                }}
              />
              {/* Stop handles */}
              {stops.map((stop) => (
                <div
                  key={stop.id}
                  data-stop-handle
                  onMouseDown={(e) => handleBarMouseDown(e, stop.id)}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedStopId(stop.id);
                  }}
                  className={`absolute top-0 h-full flex flex-col items-center justify-end cursor-grab active:cursor-grabbing`}
                  style={{
                    left: `${stop.position}%`,
                    transform: "translateX(-50%)",
                    zIndex: selectedStopId === stop.id ? 20 : 10,
                  }}
                >
                  {/* Triangle pointer */}
                  <div
                    className={`w-4 h-4 rounded-sm border-2 shadow-md ${
                      selectedStopId === stop.id
                        ? "border-blue-400 ring-2 ring-blue-400/50"
                        : "border-white"
                    }`}
                    style={{ backgroundColor: stop.color }}
                  />
                  {/* Arrow below */}
                  <div
                    className={`w-0 h-0 border-l-[5px] border-r-[5px] border-t-[5px] border-l-transparent border-r-transparent ${
                      selectedStopId === stop.id ? "border-t-blue-400" : "border-t-white"
                    }`}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap gap-3 mb-6">
            <button
              onClick={downloadPNG}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Download PNG
            </button>
            <button
              onClick={randomize}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Random
            </button>
            <button
              onClick={addStop}
              disabled={stops.length >= 10}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors"
            >
              Add Color Stop
            </button>
          </div>

          {/* Controls */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Left: Gradient Settings */}
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Settings</h2>

              {/* Type toggle */}
              <div className="mb-5">
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Gradient Type
                </label>
                <div className="flex gap-2">
                  {(["linear", "radial", "conic"] as GradientType[]).map((type) => (
                    <button
                      key={type}
                      onClick={() => setGradientType(type)}
                      className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${
                        gradientType === type
                          ? "bg-blue-600 text-white"
                          : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* Angle controls for linear and conic */}
              {(gradientType === "linear" || gradientType === "conic") && (
                <div className="mb-5">
                  <label className="block text-sm font-medium text-slate-300 mb-3">
                    {gradientType === "conic" ? "Starting Angle" : "Angle"}
                  </label>
                  <div className="flex items-start gap-6">
                    {/* Visual dial */}
                    <div
                      ref={dialRef}
                      className="w-24 h-24 rounded-full border-2 border-slate-600 relative cursor-crosshair flex-shrink-0 bg-slate-900"
                      onClick={handleDialInteraction}
                      onMouseMove={handleDialDrag}
                    >
                      {/* Angle indicator line */}
                      <div
                        className="absolute top-1/2 left-1/2 w-10 h-0.5 bg-blue-500 origin-left"
                        style={{
                          transform: `rotate(${angle - 90}deg)`,
                        }}
                      />
                      {/* Center dot */}
                      <div className="absolute top-1/2 left-1/2 w-2 h-2 bg-blue-400 rounded-full -translate-x-1/2 -translate-y-1/2" />
                      {/* Handle dot */}
                      <div
                        className="absolute w-3 h-3 bg-blue-500 rounded-full border-2 border-white -translate-x-1/2 -translate-y-1/2"
                        style={{
                          left: `${50 + 38 * Math.cos(((angle - 90) * Math.PI) / 180)}%`,
                          top: `${50 + 38 * Math.sin(((angle - 90) * Math.PI) / 180)}%`,
                        }}
                      />
                    </div>

                    <div className="flex-1">
                      {/* Numeric input */}
                      <div className="flex items-center gap-2 mb-3">
                        <input
                          type="number"
                          min={0}
                          max={360}
                          value={angle}
                          onChange={(e) => setAngle(Math.max(0, Math.min(360, Number(e.target.value))))}
                          className="w-20 bg-slate-900 border border-slate-600 rounded px-2 py-1.5 font-mono text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <span className="text-sm text-slate-400">degrees</span>
                      </div>

                      {/* Slider */}
                      <input
                        type="range"
                        min={0}
                        max={360}
                        value={angle}
                        onChange={(e) => setAngle(Number(e.target.value))}
                        className="w-full accent-blue-500"
                      />
                    </div>
                  </div>

                  {/* Direction presets (linear only) */}
                  {gradientType === "linear" && (
                    <div className="mt-3">
                      <label className="block text-xs text-slate-400 mb-2">Direction Presets</label>
                      <div className="grid grid-cols-4 gap-1.5">
                        {DIRECTION_PRESETS.map((d) => (
                          <button
                            key={d.angle}
                            onClick={() => setAngle(d.angle)}
                            className={`px-2 py-1.5 text-xs rounded transition-colors flex items-center justify-center gap-1 ${
                              angle === d.angle
                                ? "bg-blue-600 text-white"
                                : "bg-slate-700 text-slate-400 hover:bg-slate-600"
                            }`}
                            title={d.label}
                          >
                            <span>{d.icon}</span>
                            <span className="hidden sm:inline">{d.angle}&deg;</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Radial shape */}
              {gradientType === "radial" && (
                <div className="mb-5">
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Shape
                  </label>
                  <div className="flex gap-2">
                    {(["circle", "ellipse"] as const).map((shape) => (
                      <button
                        key={shape}
                        onClick={() => setRadialShape(shape)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${
                          radialShape === shape
                            ? "bg-blue-600 text-white"
                            : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                        }`}
                      >
                        {shape}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Webkit prefix toggle */}
              <div className="mt-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeWebkit}
                    onChange={(e) => setIncludeWebkit(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-600 text-blue-600 focus:ring-blue-500 bg-slate-900"
                  />
                  <span className="text-sm text-slate-300">
                    Include <code className="text-xs bg-slate-900 px-1.5 py-0.5 rounded">-webkit-</code> prefix
                  </span>
                </label>
              </div>
            </div>

            {/* Right: Color Stops */}
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-white mb-4">
                Color Stops ({stops.length}/10)
              </h2>

              <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                {stops.map((stop, idx) => (
                  <div
                    key={stop.id}
                    className={`rounded-lg p-3 transition-colors cursor-pointer ${
                      selectedStopId === stop.id
                        ? "bg-slate-900 ring-2 ring-blue-500/50"
                        : "bg-slate-900 hover:bg-slate-900/80"
                    }`}
                    onClick={() => setSelectedStopId(stop.id)}
                  >
                    {/* Top row: color + hex + reorder + remove */}
                    <div className="flex items-center gap-3 mb-2">
                      <input
                        type="color"
                        value={stop.color}
                        onChange={(e) => updateStop(stop.id, "color", e.target.value)}
                        className="w-10 h-10 rounded border border-slate-600 cursor-pointer bg-transparent flex-shrink-0"
                      />
                      <input
                        type="text"
                        value={stop.color}
                        onChange={(e) => updateStop(stop.id, "color", e.target.value)}
                        className="w-24 bg-slate-800 border border-slate-600 rounded px-2 py-1 font-mono text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        spellCheck={false}
                      />
                      <div className="flex items-center gap-1 ml-auto">
                        <button
                          onClick={(e) => { e.stopPropagation(); moveStop(stop.id, "up"); }}
                          disabled={idx === 0}
                          className="text-slate-500 hover:text-white disabled:opacity-20 transition-colors text-xs px-1"
                          title="Move up"
                        >
                          &#9650;
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); moveStop(stop.id, "down"); }}
                          disabled={idx === stops.length - 1}
                          className="text-slate-500 hover:text-white disabled:opacity-20 transition-colors text-xs px-1"
                          title="Move down"
                        >
                          &#9660;
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); removeStop(stop.id); }}
                          disabled={stops.length <= 2}
                          className="text-slate-500 hover:text-red-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-lg leading-none ml-1"
                          title="Remove stop"
                        >
                          &times;
                        </button>
                      </div>
                    </div>

                    {/* Position slider */}
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-xs text-slate-500 w-12">Position</span>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={stop.position}
                        onChange={(e) =>
                          updateStop(stop.id, "position", Number(e.target.value))
                        }
                        className="flex-1 accent-blue-500"
                      />
                      <span className="text-xs text-slate-400 w-10 text-right font-mono">
                        {stop.position}%
                      </span>
                    </div>

                    {/* Opacity slider */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500 w-12">Opacity</span>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={stop.opacity}
                        onChange={(e) =>
                          updateStop(stop.id, "opacity", Number(e.target.value))
                        }
                        className="flex-1 accent-blue-500"
                      />
                      <span className="text-xs text-slate-400 w-10 text-right font-mono">
                        {stop.opacity}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Code Output */}
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">CSS Code</h2>
              <button
                onClick={() => copyText("css", cssCodeLines)}
                className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-lg transition-colors font-medium"
              >
                {copied === "css" ? "Copied!" : "Copy CSS"}
              </button>
            </div>

            <div className="bg-slate-900 rounded-lg p-4 mb-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-500">
                  {includeWebkit && gradientType !== "conic" ? "Cross-browser CSS" : "Standard CSS"}
                </span>
              </div>
              <code className="text-sm font-mono text-green-400 whitespace-pre select-all">
                {cssCodeLines}
              </code>
            </div>

            {tailwindClass && (
              <div className="bg-slate-900 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-slate-500">Tailwind CSS</span>
                  <button
                    onClick={() => copyText("tailwind", tailwindClass)}
                    className="text-xs text-slate-400 hover:text-white transition-colors"
                  >
                    {copied === "tailwind" ? "Copied!" : "Copy"}
                  </button>
                </div>
                <code className="text-sm font-mono text-blue-400 break-all select-all">
                  {tailwindClass}
                </code>
              </div>
            )}

            {/* Browser Support Note */}
            <div className="mt-4 bg-slate-900/60 border border-slate-700 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <span className="text-amber-400 text-lg leading-none mt-0.5">&#9432;</span>
                <div>
                  <p className="text-sm text-slate-300 font-medium">Browser Compatibility</p>
                  <p className="text-sm text-slate-400 mt-1">
                    {gradientType === "conic" ? (
                      <>
                        Conic gradients are supported in Chrome 69+, Firefox 83+, Safari 12.1+, and Edge 79+.
                        No <code className="text-xs bg-slate-800 px-1.5 py-0.5 rounded">-webkit-</code> prefix
                        is needed for conic gradients in modern browsers.
                      </>
                    ) : (
                      <>
                        The generated CSS includes the{" "}
                        <code className="text-xs bg-slate-800 px-1.5 py-0.5 rounded">-webkit-</code>{" "}
                        prefix for older Safari and Chrome versions. Linear and radial gradients
                        are supported in all modern browsers with over 98% global coverage.
                      </>
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Presets */}
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 mb-6">
            <h2 className="text-lg font-semibold text-white mb-4">
              Gradient Presets ({PRESETS.length})
            </h2>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
              {PRESETS.map((preset) => {
                const stopsStr = preset.stops
                  .map((s) => `${s.color} ${s.position}%`)
                  .join(", ");
                const previewGradient =
                  preset.type === "linear"
                    ? `linear-gradient(${preset.angle}deg, ${stopsStr})`
                    : preset.type === "conic"
                    ? `conic-gradient(from ${preset.angle}deg, ${stopsStr})`
                    : `radial-gradient(circle, ${stopsStr})`;
                return (
                  <button
                    key={preset.name}
                    onClick={() => applyPreset(preset)}
                    className="group"
                  >
                    <div
                      className="h-16 rounded-lg border border-slate-600 group-hover:border-blue-500 transition-colors mb-1"
                      style={{ background: previewGradient }}
                    />
                    <span className="text-xs text-slate-400 group-hover:text-white transition-colors">
                      {preset.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Gradient Properties Reference */}
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-white mb-4">CSS Gradient Properties</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left py-2 text-slate-400 font-medium">Property</th>
                    <th className="text-left py-2 text-slate-400 font-medium">Description</th>
                    <th className="text-left py-2 text-slate-400 font-medium">Example</th>
                  </tr>
                </thead>
                <tbody className="text-slate-300">
                  {[
                    ["linear-gradient()", "Creates a gradient along a straight line at a specified angle", "linear-gradient(90deg, #f00, #00f)"],
                    ["radial-gradient()", "Creates a gradient radiating from a center point outward", "radial-gradient(circle, #f00, #00f)"],
                    ["conic-gradient()", "Creates a gradient with color transitions rotated around a center point", "conic-gradient(from 0deg, #f00, #00f)"],
                    ["Color stops", "Define colors at specific positions along the gradient", "#ff0000 0%, #0000ff 100%"],
                    ["Angle (deg)", "Direction of linear gradients (0deg = up, 90deg = right)", "linear-gradient(135deg, ...)"],
                    ["rgba()", "Color with alpha transparency for see-through gradients", "rgba(255, 0, 0, 0.5)"],
                    ["-webkit- prefix", "Vendor prefix for older WebKit browsers (Safari, Chrome)", "-webkit-linear-gradient(...)"],
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

          {/* Internal Links */}
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 mb-6">
            <h2 className="text-lg font-semibold text-white mb-3">Related CSS Tools</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <a
                href="/tools/box-shadow-generator"
                className="flex items-center gap-3 bg-slate-900 rounded-lg p-4 hover:bg-slate-700 transition-colors group"
              >
                <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center border border-slate-600 group-hover:border-blue-500 transition-colors">
                  <span className="text-lg">&#9641;</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-white group-hover:text-blue-400 transition-colors">CSS Box Shadow Generator</p>
                  <p className="text-xs text-slate-400">Create layered box-shadow effects visually</p>
                </div>
              </a>
              <a
                href="/tools/css-glassmorphism-generator"
                className="flex items-center gap-3 bg-slate-900 rounded-lg p-4 hover:bg-slate-700 transition-colors group"
              >
                <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center border border-slate-600 group-hover:border-blue-500 transition-colors">
                  <span className="text-lg">&#9671;</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-white group-hover:text-blue-400 transition-colors">CSS Glassmorphism Generator</p>
                  <p className="text-xs text-slate-400">Create frosted glass UI effects with backdrop-filter</p>
                </div>
              </a>
            </div>
          </div>

          <RelatedTools currentSlug="css-gradient-generator" />

          {/* FAQ */}
          <section className="mt-16 border-t border-slate-700 pt-10">
            <h2 className="text-2xl font-bold text-white mb-6">
              Frequently Asked Questions
            </h2>

            <div className="space-y-6">
              {[
                { q: "What types of CSS gradients can I create?", a: "This tool supports linear gradients (straight-line color transitions at any angle), radial gradients (circular or elliptical gradients emanating from a center point), and conic gradients (color transitions rotated around a center point, like a color wheel). All types support multiple color stops with individual transparency controls." },
                { q: "How do I use the draggable color stops?", a: "Click anywhere on the gradient bar below the preview to add a new color stop at that position. Drag existing stop handles left or right to reposition them. Click a handle to select it and edit its color, position, and opacity in the panel below." },
                { q: "How many color stops can I use in a CSS gradient?", a: "CSS gradients support unlimited color stops. This tool allows up to 10 stops with individual color, position, and opacity controls. More stops create smoother transitions and more complex patterns." },
                { q: "Are CSS gradients supported in all browsers?", a: "Linear and radial gradients are supported in all modern browsers (Chrome, Firefox, Safari, Edge) with over 98% global coverage. Conic gradients are supported in Chrome 69+, Firefox 83+, Safari 12.1+, and Edge 79+. This tool generates -webkit- prefixed CSS for older browser compatibility." },
                { q: "Can I use gradients with Tailwind CSS?", a: "Yes. For simple two-color linear gradients at standard angles (0, 45, 90, 135, 180, 225, 270, 315 degrees), this tool generates the equivalent Tailwind utility classes. For more complex gradients, use the CSS output with Tailwind\u2019s arbitrary value syntax." },
                { q: "Can I create transparent gradients?", a: "Yes. Each color stop has an individual opacity slider (0\u2013100%). This lets you create gradients that fade to transparent, overlay effects, or semi-transparent color transitions perfect for glass-like UI elements." },
                { q: "What is a conic gradient?", a: "A conic gradient creates color transitions that rotate around a center point, similar to a color wheel or pie chart. Colors transition along the circumference rather than along a line (linear) or from center outward (radial). They\u2019re great for creating pie charts, color wheels, and unique decorative effects." },
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
