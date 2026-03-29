"use client";

import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import JsonLd from "@/components/JsonLd";
import RelatedTools from "@/components/RelatedTools";
import ToolBreadcrumb from "@/components/ToolBreadcrumb";
import {
  generateFAQSchema,
  generateWebAppSchema,
  generateBreadcrumbSchema,
} from "@/lib/jsonld";

/* ─── Types ─── */
interface Point { x: number; y: number }

interface PathCommand {
  type: string;
  coords: number[];
  startIndex: number;
  raw: string;
}

/* ─── SVG Path Parser ─── */
function parsePath(d: string): PathCommand[] {
  const commands: PathCommand[] = [];
  const re = /([MmLlHhVvCcSsQqTtAaZz])([^MmLlHhVvCcSsQqTtAaZz]*)/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(d)) !== null) {
    const type = match[1];
    const raw = match[0].trim();
    const nums = match[2]
      .trim()
      .split(/[\s,]+/)
      .filter(Boolean)
      .map(Number)
      .filter((n) => !isNaN(n));
    commands.push({ type, coords: nums, startIndex: match.index, raw });
  }
  return commands;
}

function commandsToPath(commands: PathCommand[]): string {
  return commands
    .map((cmd) => {
      if (cmd.type.toUpperCase() === "Z") return cmd.type;
      return `${cmd.type}${cmd.coords.join(" ")}`;
    })
    .join(" ");
}

/* ─── Get absolute control/end points for each command ─── */
interface AbsolutePoint {
  cmdIndex: number;
  coordIndex: number;
  label: string;
  x: number;
  y: number;
  isControl: boolean;
}

function getAbsolutePoints(commands: PathCommand[]): AbsolutePoint[] {
  const points: AbsolutePoint[] = [];
  let cx = 0, cy = 0;
  let startX = 0, startY = 0;

  for (let i = 0; i < commands.length; i++) {
    const cmd = commands[i];
    const t = cmd.type;
    const c = cmd.coords;
    const isRel = t === t.toLowerCase();
    const abs = t.toUpperCase();

    if (abs === "M" && c.length >= 2) {
      const x = isRel ? cx + c[0] : c[0];
      const y = isRel ? cy + c[1] : c[1];
      points.push({ cmdIndex: i, coordIndex: 0, label: "M", x, y, isControl: false });
      cx = x; cy = y; startX = x; startY = y;
    } else if (abs === "L" && c.length >= 2) {
      const x = isRel ? cx + c[0] : c[0];
      const y = isRel ? cy + c[1] : c[1];
      points.push({ cmdIndex: i, coordIndex: 0, label: "L", x, y, isControl: false });
      cx = x; cy = y;
    } else if (abs === "H" && c.length >= 1) {
      const x = isRel ? cx + c[0] : c[0];
      points.push({ cmdIndex: i, coordIndex: 0, label: "H", x, y: cy, isControl: false });
      cx = x;
    } else if (abs === "V" && c.length >= 1) {
      const y = isRel ? cy + c[0] : c[0];
      points.push({ cmdIndex: i, coordIndex: 0, label: "V", x: cx, y, isControl: false });
      cy = y;
    } else if (abs === "C" && c.length >= 6) {
      const x1 = isRel ? cx + c[0] : c[0];
      const y1 = isRel ? cy + c[1] : c[1];
      const x2 = isRel ? cx + c[2] : c[2];
      const y2 = isRel ? cy + c[3] : c[3];
      const x = isRel ? cx + c[4] : c[4];
      const y = isRel ? cy + c[5] : c[5];
      points.push({ cmdIndex: i, coordIndex: 0, label: "C1", x: x1, y: y1, isControl: true });
      points.push({ cmdIndex: i, coordIndex: 2, label: "C2", x: x2, y: y2, isControl: true });
      points.push({ cmdIndex: i, coordIndex: 4, label: "C", x, y, isControl: false });
      cx = x; cy = y;
    } else if (abs === "S" && c.length >= 4) {
      const x2 = isRel ? cx + c[0] : c[0];
      const y2 = isRel ? cy + c[1] : c[1];
      const x = isRel ? cx + c[2] : c[2];
      const y = isRel ? cy + c[3] : c[3];
      points.push({ cmdIndex: i, coordIndex: 0, label: "S1", x: x2, y: y2, isControl: true });
      points.push({ cmdIndex: i, coordIndex: 2, label: "S", x, y, isControl: false });
      cx = x; cy = y;
    } else if (abs === "Q" && c.length >= 4) {
      const x1 = isRel ? cx + c[0] : c[0];
      const y1 = isRel ? cy + c[1] : c[1];
      const x = isRel ? cx + c[2] : c[2];
      const y = isRel ? cy + c[3] : c[3];
      points.push({ cmdIndex: i, coordIndex: 0, label: "Q1", x: x1, y: y1, isControl: true });
      points.push({ cmdIndex: i, coordIndex: 2, label: "Q", x, y, isControl: false });
      cx = x; cy = y;
    } else if (abs === "T" && c.length >= 2) {
      const x = isRel ? cx + c[0] : c[0];
      const y = isRel ? cy + c[1] : c[1];
      points.push({ cmdIndex: i, coordIndex: 0, label: "T", x, y, isControl: false });
      cx = x; cy = y;
    } else if (abs === "A" && c.length >= 7) {
      const x = isRel ? cx + c[5] : c[5];
      const y = isRel ? cy + c[6] : c[6];
      points.push({ cmdIndex: i, coordIndex: 5, label: "A", x, y, isControl: false });
      cx = x; cy = y;
    } else if (abs === "Z") {
      cx = startX; cy = startY;
    }
  }
  return points;
}

/* ─── Presets ─── */
const PRESETS: { name: string; path: string }[] = [
  {
    name: "Circle",
    path: "M50 0 A50 50 0 1 0 50 100 A50 50 0 1 0 50 0 Z",
  },
  {
    name: "Star",
    path: "M50 0 L61 35 L98 35 L68 57 L79 91 L50 70 L21 91 L32 57 L2 35 L39 35 Z",
  },
  {
    name: "Heart",
    path: "M50 30 C50 20 40 0 20 0 C0 0 0 20 0 35 C0 60 50 90 50 90 C50 90 100 60 100 35 C100 20 100 0 80 0 C60 0 50 20 50 30 Z",
  },
  {
    name: "Arrow",
    path: "M0 40 L60 40 L60 20 L100 50 L60 80 L60 60 L0 60 Z",
  },
  {
    name: "Checkmark",
    path: "M10 50 L35 75 L90 20 L80 10 L35 55 L20 40 Z",
  },
];

const CMD_COLORS: Record<string, string> = {
  M: "#3b82f6",
  L: "#10b981",
  H: "#10b981",
  V: "#10b981",
  C: "#f59e0b",
  S: "#f97316",
  Q: "#8b5cf6",
  T: "#a855f7",
  A: "#ef4444",
  Z: "#6b7280",
};

/* ─── Metadata ─── */
const toolMeta = {
  slug: "svg-path-editor",
  name: "SVG Path Editor",
  description:
    "Visual SVG path editor with live preview, draggable control points, command breakdown, shape presets, and transform controls. Edit SVG path d attributes interactively",
  category: "css",
};

const faqs = [
  {
    question: "What is an SVG path d attribute?",
    answer:
      "The d attribute in an SVG <path> element contains a series of commands and coordinates that define the shape. Commands include M (move to), L (line to), C (cubic bezier), Q (quadratic bezier), A (arc), and Z (close path). Each command can be uppercase (absolute) or lowercase (relative).",
  },
  {
    question: "How do I use the draggable control points?",
    answer:
      "Click and drag any point on the SVG preview to move it. Blue circles are endpoint/anchor points, while orange diamonds are bezier control points. The path data updates in real-time as you drag. Control lines show the relationship between control points and their anchors.",
  },
  {
    question: "What are the transform controls?",
    answer:
      "The Scale control multiplies all coordinates by a factor (e.g., 2x makes the path twice as large). Rotate spins the path around its center by the specified degrees. Translate shifts the entire path by X and Y offsets. Click Apply to modify the path data.",
  },
  {
    question: "Can I export the edited SVG?",
    answer:
      "Yes. Use 'Copy Path' to copy just the optimized d attribute to your clipboard, or 'Export SVG' to download a complete SVG file containing your path with proper viewBox and xmlns attributes.",
  },
];

export default function SvgPathEditorPage() {
  const [pathData, setPathData] = useState(PRESETS[0].path);
  const [selectedCmd, setSelectedCmd] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

  /* Transform state */
  const [scale, setScale] = useState(1);
  const [rotate, setRotate] = useState(0);
  const [translateX, setTranslateX] = useState(0);
  const [translateY, setTranslateY] = useState(0);

  /* Drag state */
  const svgRef = useRef<SVGSVGElement>(null);
  const dragRef = useRef<{ ptIdx: number; startMouse: Point; startCoords: number[] } | null>(null);

  const commands = useMemo(() => parsePath(pathData), [pathData]);
  const absPoints = useMemo(() => getAbsolutePoints(commands), [commands]);

  /* ─── Compute viewBox from path bounds ─── */
  const viewBox = useMemo(() => {
    if (absPoints.length === 0) return "-10 -10 120 120";
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const p of absPoints) {
      if (p.x < minX) minX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.x > maxX) maxX = p.x;
      if (p.y > maxY) maxY = p.y;
    }
    const pad = Math.max((maxX - minX), (maxY - minY)) * 0.15 + 5;
    return `${minX - pad} ${minY - pad} ${maxX - minX + pad * 2} ${maxY - minY + pad * 2}`;
  }, [absPoints]);

  const pointRadius = useMemo(() => {
    const parts = viewBox.split(" ").map(Number);
    return Math.max(parts[2], parts[3]) * 0.02;
  }, [viewBox]);

  /* ─── Drag handlers ─── */
  const getSvgPoint = useCallback((e: React.MouseEvent | MouseEvent): Point | null => {
    const svg = svgRef.current;
    if (!svg) return null;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const ctm = svg.getScreenCTM();
    if (!ctm) return null;
    const svgPt = pt.matrixTransform(ctm.inverse());
    return { x: svgPt.x, y: svgPt.y };
  }, []);

  const handlePointerDown = useCallback(
    (ptIdx: number, e: React.MouseEvent) => {
      e.preventDefault();
      const svgPt = getSvgPoint(e);
      if (!svgPt) return;
      const pt = absPoints[ptIdx];
      const cmd = commands[pt.cmdIndex];
      dragRef.current = {
        ptIdx,
        startMouse: svgPt,
        startCoords: [...cmd.coords],
      };
      window.addEventListener("mousemove", handlePointerMove);
      window.addEventListener("mouseup", handlePointerUp);
    },
    [absPoints, commands, getSvgPoint]
  );

  const handlePointerMove = useCallback(
    (e: MouseEvent) => {
      const drag = dragRef.current;
      if (!drag) return;
      const svgPt = getSvgPoint(e);
      if (!svgPt) return;
      const dx = svgPt.x - drag.startMouse.x;
      const dy = svgPt.y - drag.startMouse.y;
      const pt = absPoints[drag.ptIdx];
      const cmd = commands[pt.cmdIndex];
      const isRel = cmd.type === cmd.type.toLowerCase();
      const abs = cmd.type.toUpperCase();

      const newCoords = [...drag.startCoords];

      if (abs === "H") {
        newCoords[pt.coordIndex] = drag.startCoords[pt.coordIndex] + dx;
      } else if (abs === "V") {
        newCoords[pt.coordIndex] = drag.startCoords[pt.coordIndex] + dy;
      } else if (abs === "A") {
        newCoords[pt.coordIndex] = drag.startCoords[pt.coordIndex] + dx;
        newCoords[pt.coordIndex + 1] = drag.startCoords[pt.coordIndex + 1] + dy;
      } else {
        newCoords[pt.coordIndex] = drag.startCoords[pt.coordIndex] + (isRel ? dx : dx);
        newCoords[pt.coordIndex + 1] = drag.startCoords[pt.coordIndex + 1] + (isRel ? dy : dy);
      }

      // Round to 1 decimal
      for (let i = 0; i < newCoords.length; i++) {
        newCoords[i] = Math.round(newCoords[i] * 10) / 10;
      }

      const newCommands = commands.map((c, idx) =>
        idx === pt.cmdIndex ? { ...c, coords: newCoords } : c
      );
      setPathData(commandsToPath(newCommands));
    },
    [absPoints, commands, getSvgPoint]
  );

  const handlePointerUp = useCallback(() => {
    dragRef.current = null;
    window.removeEventListener("mousemove", handlePointerMove);
    window.removeEventListener("mouseup", handlePointerUp);
  }, [handlePointerMove]);

  useEffect(() => {
    return () => {
      window.removeEventListener("mousemove", handlePointerMove);
      window.removeEventListener("mouseup", handlePointerUp);
    };
  }, [handlePointerMove, handlePointerUp]);

  /* ─── Transform ─── */
  const applyTransform = useCallback(() => {
    const pts = getAbsolutePoints(commands);
    if (pts.length === 0) return;

    // Find center
    let cx = 0, cy = 0;
    for (const p of pts) { cx += p.x; cy += p.y; }
    cx /= pts.length; cy /= pts.length;

    const rad = (rotate * Math.PI) / 180;
    const cosR = Math.cos(rad), sinR = Math.sin(rad);

    const newCommands = commands.map((cmd) => {
      const abs = cmd.type.toUpperCase();
      if (abs === "Z") return cmd;
      const isRel = cmd.type === cmd.type.toLowerCase();
      const newCoords = [...cmd.coords];

      // For arcs, only transform endpoint (indices 5,6), skip radii and flags
      if (abs === "A") {
        // Scale radii
        newCoords[0] = Math.round(newCoords[0] * scale * 10) / 10;
        newCoords[1] = Math.round(newCoords[1] * scale * 10) / 10;
        // Transform endpoint
        for (let i = 5; i < 7 && i < newCoords.length; i += 2) {
          let x = newCoords[i], y = newCoords[i + 1];
          if (!isRel) {
            x -= cx; y -= cy;
          }
          const sx = x * scale, sy = y * scale;
          const rx = sx * cosR - sy * sinR;
          const ry = sx * sinR + sy * cosR;
          newCoords[i] = Math.round((isRel ? rx : rx + cx + translateX) * 10) / 10;
          newCoords[i + 1] = Math.round((isRel ? ry : ry + cy + translateY) * 10) / 10;
        }
        return { ...cmd, coords: newCoords };
      }

      // For H/V, convert to L conceptually
      if (abs === "H") {
        let x = newCoords[0];
        if (!isRel) x -= cx;
        const sx = x * scale;
        newCoords[0] = Math.round((isRel ? sx : sx + cx + translateX) * 10) / 10;
        return { ...cmd, coords: newCoords };
      }
      if (abs === "V") {
        let y = newCoords[0];
        if (!isRel) y -= cy;
        const sy = y * scale;
        newCoords[0] = Math.round((isRel ? sy : sy + cy + translateY) * 10) / 10;
        return { ...cmd, coords: newCoords };
      }

      // Generic: transform pairs of coordinates
      for (let i = 0; i + 1 < newCoords.length; i += 2) {
        let x = newCoords[i], y = newCoords[i + 1];
        if (!isRel) { x -= cx; y -= cy; }
        const sx = x * scale, sy = y * scale;
        const rx = sx * cosR - sy * sinR;
        const ry = sx * sinR + sy * cosR;
        newCoords[i] = Math.round((isRel ? rx : rx + cx + translateX) * 10) / 10;
        newCoords[i + 1] = Math.round((isRel ? ry : ry + cy + translateY) * 10) / 10;
      }
      return { ...cmd, coords: newCoords };
    });

    setPathData(commandsToPath(newCommands));
    setScale(1);
    setRotate(0);
    setTranslateX(0);
    setTranslateY(0);
  }, [commands, scale, rotate, translateX, translateY]);

  /* ─── Copy / Export ─── */
  const copyPath = useCallback(() => {
    navigator.clipboard.writeText(pathData);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }, [pathData]);

  const exportSvg = useCallback(() => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}">\n  <path d="${pathData}" fill="none" stroke="#000" stroke-width="2"/>\n</svg>`;
    const blob = new Blob([svg], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "path.svg";
    a.click();
    URL.revokeObjectURL(url);
  }, [pathData, viewBox]);

  /* ─── Control-point lines (connect control points to endpoints) ─── */
  const controlLines = useMemo(() => {
    const lines: { x1: number; y1: number; x2: number; y2: number }[] = [];
    for (let i = 0; i < absPoints.length; i++) {
      const pt = absPoints[i];
      if (pt.isControl) {
        // Find the nearest endpoint in same command
        const siblings = absPoints.filter(
          (p) => p.cmdIndex === pt.cmdIndex && !p.isControl
        );
        if (siblings.length > 0) {
          const ep = siblings[siblings.length - 1];
          lines.push({ x1: pt.x, y1: pt.y, x2: ep.x, y2: ep.y });
        }
        // Also connect first control point to previous endpoint
        if (pt.coordIndex === 0) {
          const prevEndpoints = absPoints.filter(
            (p) => p.cmdIndex < pt.cmdIndex && !p.isControl
          );
          if (prevEndpoints.length > 0) {
            const prev = prevEndpoints[prevEndpoints.length - 1];
            lines.push({ x1: pt.x, y1: pt.y, x2: prev.x, y2: prev.y });
          }
        }
      }
    }
    return lines;
  }, [absPoints]);

  return (
    <>
      <JsonLd
        data={[
          generateWebAppSchema(toolMeta),
          generateBreadcrumbSchema(toolMeta),
          generateFAQSchema(faqs),
        ]}
      />

      <div className="min-h-screen bg-slate-950 py-6 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto space-y-6">
          <ToolBreadcrumb slug="svg-path-editor" />

          <div className="text-center space-y-2">
            <h1 className="text-3xl sm:text-4xl font-bold text-white">
              SVG Path Editor
            </h1>
            <p className="text-slate-400 max-w-2xl mx-auto">
              Visual SVG path editor with live preview, draggable control
              points, command breakdown, and transform controls
            </p>
          </div>

          {/* Main editor layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Preview */}
            <div className="space-y-4">
              <div className="bg-slate-900 rounded-xl border border-slate-800 p-4">
                <h2 className="text-sm font-semibold text-slate-300 mb-3">
                  Live Preview
                </h2>
                <div className="bg-white/5 rounded-lg border border-slate-700 overflow-hidden">
                  <svg
                    ref={svgRef}
                    viewBox={viewBox}
                    className="w-full"
                    style={{ minHeight: 300 }}
                  >
                    {/* Grid */}
                    <defs>
                      <pattern
                        id="grid"
                        width="10"
                        height="10"
                        patternUnits="userSpaceOnUse"
                      >
                        <path
                          d="M 10 0 L 0 0 0 10"
                          fill="none"
                          stroke="rgba(255,255,255,0.05)"
                          strokeWidth="0.5"
                        />
                      </pattern>
                    </defs>
                    <rect
                      x={viewBox.split(" ")[0]}
                      y={viewBox.split(" ")[1]}
                      width={viewBox.split(" ")[2]}
                      height={viewBox.split(" ")[3]}
                      fill="url(#grid)"
                    />

                    {/* The path */}
                    <path
                      d={pathData}
                      fill="rgba(59,130,246,0.1)"
                      stroke="#3b82f6"
                      strokeWidth={pointRadius * 0.8}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />

                    {/* Control lines */}
                    {controlLines.map((line, i) => (
                      <line
                        key={`cl-${i}`}
                        x1={line.x1}
                        y1={line.y1}
                        x2={line.x2}
                        y2={line.y2}
                        stroke="rgba(249,115,22,0.4)"
                        strokeWidth={pointRadius * 0.3}
                        strokeDasharray={`${pointRadius * 0.5} ${pointRadius * 0.5}`}
                      />
                    ))}

                    {/* Draggable points */}
                    {absPoints.map((pt, i) =>
                      pt.isControl ? (
                        <rect
                          key={i}
                          x={pt.x - pointRadius * 0.8}
                          y={pt.y - pointRadius * 0.8}
                          width={pointRadius * 1.6}
                          height={pointRadius * 1.6}
                          rx={pointRadius * 0.2}
                          fill="#f97316"
                          stroke="#fff"
                          strokeWidth={pointRadius * 0.15}
                          className="cursor-grab active:cursor-grabbing"
                          transform={`rotate(45 ${pt.x} ${pt.y})`}
                          onMouseDown={(e) => handlePointerDown(i, e)}
                        />
                      ) : (
                        <circle
                          key={i}
                          cx={pt.x}
                          cy={pt.y}
                          r={pointRadius}
                          fill={
                            selectedCmd === pt.cmdIndex
                              ? "#f59e0b"
                              : "#3b82f6"
                          }
                          stroke="#fff"
                          strokeWidth={pointRadius * 0.2}
                          className="cursor-grab active:cursor-grabbing"
                          onMouseDown={(e) => handlePointerDown(i, e)}
                        />
                      )
                    )}
                  </svg>
                </div>
              </div>

              {/* Presets */}
              <div className="bg-slate-900 rounded-xl border border-slate-800 p-4">
                <h2 className="text-sm font-semibold text-slate-300 mb-3">
                  Shape Presets
                </h2>
                <div className="flex flex-wrap gap-2">
                  {PRESETS.map((preset) => (
                    <button
                      key={preset.name}
                      onClick={() => setPathData(preset.path)}
                      className="px-3 py-1.5 text-sm bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition-colors"
                    >
                      {preset.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Transform controls */}
              <div className="bg-slate-900 rounded-xl border border-slate-800 p-4">
                <h2 className="text-sm font-semibold text-slate-300 mb-3">
                  Transform
                </h2>
                <div className="grid grid-cols-2 gap-3">
                  <label className="space-y-1">
                    <span className="text-xs text-slate-400">Scale</span>
                    <input
                      type="number"
                      step="0.1"
                      min="0.1"
                      max="10"
                      value={scale}
                      onChange={(e) => setScale(parseFloat(e.target.value) || 1)}
                      className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm"
                    />
                  </label>
                  <label className="space-y-1">
                    <span className="text-xs text-slate-400">
                      Rotate (deg)
                    </span>
                    <input
                      type="number"
                      step="5"
                      value={rotate}
                      onChange={(e) => setRotate(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm"
                    />
                  </label>
                  <label className="space-y-1">
                    <span className="text-xs text-slate-400">
                      Translate X
                    </span>
                    <input
                      type="number"
                      step="5"
                      value={translateX}
                      onChange={(e) => setTranslateX(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm"
                    />
                  </label>
                  <label className="space-y-1">
                    <span className="text-xs text-slate-400">
                      Translate Y
                    </span>
                    <input
                      type="number"
                      step="5"
                      value={translateY}
                      onChange={(e) => setTranslateY(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm"
                    />
                  </label>
                </div>
                <button
                  onClick={applyTransform}
                  className="mt-3 w-full py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  Apply Transform
                </button>
              </div>
            </div>

            {/* Right: Path input + command breakdown */}
            <div className="space-y-4">
              {/* Path input */}
              <div className="bg-slate-900 rounded-xl border border-slate-800 p-4">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-semibold text-slate-300">
                    Path Data
                  </h2>
                  <div className="flex gap-2">
                    <button
                      onClick={copyPath}
                      className="px-3 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition-colors"
                    >
                      {copied ? "Copied!" : "Copy Path"}
                    </button>
                    <button
                      onClick={exportSvg}
                      className="px-3 py-1.5 text-xs bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
                    >
                      Export SVG
                    </button>
                  </div>
                </div>
                <textarea
                  value={pathData}
                  onChange={(e) => setPathData(e.target.value)}
                  rows={5}
                  spellCheck={false}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm font-mono resize-y focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Paste SVG path d attribute here..."
                />
              </div>

              {/* Command breakdown */}
              <div className="bg-slate-900 rounded-xl border border-slate-800 p-4">
                <h2 className="text-sm font-semibold text-slate-300 mb-3">
                  Command Breakdown
                </h2>
                <div className="space-y-1 max-h-[400px] overflow-y-auto">
                  {commands.length === 0 && (
                    <p className="text-slate-500 text-sm italic">
                      Enter a valid path to see commands
                    </p>
                  )}
                  {commands.map((cmd, i) => {
                    const abs = cmd.type.toUpperCase();
                    const color = CMD_COLORS[abs] || "#6b7280";
                    const names: Record<string, string> = {
                      M: "Move To",
                      L: "Line To",
                      H: "Horizontal Line",
                      V: "Vertical Line",
                      C: "Cubic Bezier",
                      S: "Smooth Cubic",
                      Q: "Quadratic Bezier",
                      T: "Smooth Quad",
                      A: "Arc",
                      Z: "Close Path",
                    };
                    const isRel = cmd.type === cmd.type.toLowerCase();
                    return (
                      <button
                        key={i}
                        onClick={() =>
                          setSelectedCmd(selectedCmd === i ? null : i)
                        }
                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left text-sm transition-colors ${
                          selectedCmd === i
                            ? "bg-slate-700 border border-slate-600"
                            : "bg-slate-800/50 hover:bg-slate-800 border border-transparent"
                        }`}
                      >
                        <span
                          className="inline-flex items-center justify-center w-7 h-7 rounded text-xs font-bold text-white flex-shrink-0"
                          style={{ backgroundColor: color }}
                        >
                          {cmd.type}
                        </span>
                        <span className="text-slate-400 text-xs flex-shrink-0">
                          {names[abs] || abs}
                          {isRel && abs !== "Z" ? " (rel)" : ""}
                        </span>
                        <span className="text-slate-300 font-mono text-xs truncate">
                          {cmd.coords.join(", ")}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Command legend */}
              <div className="bg-slate-900 rounded-xl border border-slate-800 p-4">
                <h2 className="text-sm font-semibold text-slate-300 mb-3">
                  Command Reference
                </h2>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                  {[
                    ["M x y", "Move to point"],
                    ["L x y", "Line to point"],
                    ["H x", "Horizontal line"],
                    ["V y", "Vertical line"],
                    ["C x1 y1 x2 y2 x y", "Cubic bezier"],
                    ["S x2 y2 x y", "Smooth cubic"],
                    ["Q x1 y1 x y", "Quadratic bezier"],
                    ["T x y", "Smooth quad"],
                    ["A rx ry rot laf sf x y", "Arc"],
                    ["Z", "Close path"],
                  ].map(([cmd, desc]) => (
                    <div key={cmd} className="flex gap-2 py-0.5">
                      <code className="text-blue-400 font-mono">{cmd}</code>
                      <span className="text-slate-500">{desc}</span>
                    </div>
                  ))}
                </div>
                <p className="text-slate-500 text-xs mt-2">
                  Uppercase = absolute coordinates. Lowercase = relative to
                  current point.
                </p>
              </div>
            </div>
          </div>

          {/* FAQ Section */}
          <section className="bg-slate-900 rounded-xl border border-slate-800 p-6">
            <h2 className="text-xl font-bold text-white mb-4">
              Frequently Asked Questions
            </h2>
            <div className="space-y-4">
              {faqs.map((faq, i) => (
                <div key={i}>
                  <h3 className="text-lg font-semibold text-white mb-2">
                    {faq.question}
                  </h3>
                  <p className="text-slate-400">{faq.answer}</p>
                </div>
              ))}
            </div>
          </section>

          <RelatedTools currentSlug="svg-path-editor" />
        </div>
      </div>
    </>
  );
}
