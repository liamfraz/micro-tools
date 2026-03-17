"use client";

import { useState, useCallback, useMemo } from "react";
import JsonLd from "@/components/JsonLd";
import RelatedTools from "@/components/RelatedTools";
import {
  generateFAQSchema,
  generateWebAppSchema,
  generateBreadcrumbSchema,
} from "@/lib/jsonld";

interface CornerRadius {
  topLeft: number;
  topRight: number;
  bottomRight: number;
  bottomLeft: number;
}

interface CornerRadiusAdvanced {
  topLeftH: number;
  topLeftV: number;
  topRightH: number;
  topRightV: number;
  bottomRightH: number;
  bottomRightV: number;
  bottomLeftH: number;
  bottomLeftV: number;
}

type Unit = "px" | "%" | "em" | "rem";

const PRESETS: { name: string; radius: CornerRadius; shape: string }[] = [
  { name: "None", radius: { topLeft: 0, topRight: 0, bottomRight: 0, bottomLeft: 0 }, shape: "Square" },
  { name: "Uniform sm", radius: { topLeft: 4, topRight: 4, bottomRight: 4, bottomLeft: 4 }, shape: "Subtle" },
  { name: "Uniform md", radius: { topLeft: 8, topRight: 8, bottomRight: 8, bottomLeft: 8 }, shape: "Medium" },
  { name: "Uniform lg", radius: { topLeft: 16, topRight: 16, bottomRight: 16, bottomLeft: 16 }, shape: "Large" },
  { name: "Uniform xl", radius: { topLeft: 24, topRight: 24, bottomRight: 24, bottomLeft: 24 }, shape: "XL" },
  { name: "Circle", radius: { topLeft: 50, topRight: 50, bottomRight: 50, bottomLeft: 50 }, shape: "Circle" },
  { name: "Pill", radius: { topLeft: 9999, topRight: 9999, bottomRight: 9999, bottomLeft: 9999 }, shape: "Pill" },
  { name: "Top Only", radius: { topLeft: 16, topRight: 16, bottomRight: 0, bottomLeft: 0 }, shape: "Tab" },
  { name: "Bottom Only", radius: { topLeft: 0, topRight: 0, bottomRight: 16, bottomLeft: 16 }, shape: "Footer" },
  { name: "Left Only", radius: { topLeft: 16, topRight: 0, bottomRight: 0, bottomLeft: 16 }, shape: "Left" },
  { name: "Right Only", radius: { topLeft: 0, topRight: 16, bottomRight: 16, bottomLeft: 0 }, shape: "Right" },
  { name: "Diagonal", radius: { topLeft: 24, topRight: 0, bottomRight: 24, bottomLeft: 0 }, shape: "Leaf" },
  { name: "Diagonal Alt", radius: { topLeft: 0, topRight: 24, bottomRight: 0, bottomLeft: 24 }, shape: "Leaf Alt" },
  { name: "Drop", radius: { topLeft: 48, topRight: 48, bottomRight: 48, bottomLeft: 0 }, shape: "Drop" },
  { name: "Ticket", radius: { topLeft: 16, topRight: 0, bottomRight: 16, bottomLeft: 0 }, shape: "Ticket" },
  { name: "Notch", radius: { topLeft: 32, topRight: 8, bottomRight: 32, bottomLeft: 8 }, shape: "Notch" },
];

export default function BorderRadiusGeneratorPage() {
  const [radius, setRadius] = useState<CornerRadius>({
    topLeft: 16, topRight: 16, bottomRight: 16, bottomLeft: 16,
  });
  const [advanced, setAdvanced] = useState<CornerRadiusAdvanced>({
    topLeftH: 16, topLeftV: 16,
    topRightH: 16, topRightV: 16,
    bottomRightH: 16, bottomRightV: 16,
    bottomLeftH: 16, bottomLeftV: 16,
  });
  const [linked, setLinked] = useState(true);
  const [useAdvanced, setUseAdvanced] = useState(false);
  const [unit, setUnit] = useState<Unit>("px");
  const [boxColor, setBoxColor] = useState("#3b82f6");
  const [bgColor, setBgColor] = useState("#0f172a");
  const [borderWidth, setBorderWidth] = useState(0);
  const [borderColor, setBorderColor] = useState("#60a5fa");
  const [boxWidth, setBoxWidth] = useState(200);
  const [boxHeight, setBoxHeight] = useState(200);
  const [copied, setCopied] = useState(false);

  const updateRadius = useCallback(
    (corner: keyof CornerRadius, value: number) => {
      if (linked) {
        setRadius({ topLeft: value, topRight: value, bottomRight: value, bottomLeft: value });
      } else {
        setRadius((prev) => ({ ...prev, [corner]: value }));
      }
    },
    [linked]
  );

  const updateAdvanced = useCallback(
    (key: keyof CornerRadiusAdvanced, value: number) => {
      setAdvanced((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const cssValue = useMemo(() => {
    const u = unit;
    if (useAdvanced) {
      const { topLeftH, topLeftV, topRightH, topRightV, bottomRightH, bottomRightV, bottomLeftH, bottomLeftV } = advanced;
      const allSameH = topLeftH === topRightH && topRightH === bottomRightH && bottomRightH === bottomLeftH;
      const allSameV = topLeftV === topRightV && topRightV === bottomRightV && bottomRightV === bottomLeftV;
      if (allSameH && allSameV && topLeftH === topLeftV) {
        return `${topLeftH}${u}`;
      }
      return `${topLeftH}${u} ${topRightH}${u} ${bottomRightH}${u} ${bottomLeftH}${u} / ${topLeftV}${u} ${topRightV}${u} ${bottomRightV}${u} ${bottomLeftV}${u}`;
    }
    const { topLeft, topRight, bottomRight, bottomLeft } = radius;
    if (topLeft === topRight && topRight === bottomRight && bottomRight === bottomLeft) {
      return `${topLeft}${u}`;
    }
    if (topLeft === bottomRight && topRight === bottomLeft) {
      return `${topLeft}${u} ${topRight}${u}`;
    }
    if (topRight === bottomLeft) {
      return `${topLeft}${u} ${topRight}${u} ${bottomRight}${u}`;
    }
    return `${topLeft}${u} ${topRight}${u} ${bottomRight}${u} ${bottomLeft}${u}`;
  }, [radius, advanced, unit, useAdvanced]);

  const fullCSS = useMemo(() => {
    let css = `border-radius: ${cssValue};`;
    if (borderWidth > 0) {
      css += `\nborder: ${borderWidth}px solid ${borderColor};`;
    }
    return css;
  }, [cssValue, borderWidth, borderColor]);

  const previewBorderRadius = useMemo(() => {
    if (useAdvanced) {
      const { topLeftH, topLeftV, topRightH, topRightV, bottomRightH, bottomRightV, bottomLeftH, bottomLeftV } = advanced;
      return `${topLeftH}${unit} ${topRightH}${unit} ${bottomRightH}${unit} ${bottomLeftH}${unit} / ${topLeftV}${unit} ${topRightV}${unit} ${bottomRightV}${unit} ${bottomLeftV}${unit}`;
    }
    return `${radius.topLeft}${unit} ${radius.topRight}${unit} ${radius.bottomRight}${unit} ${radius.bottomLeft}${unit}`;
  }, [radius, advanced, unit, useAdvanced]);

  const copyCSS = useCallback(async () => {
    await navigator.clipboard.writeText(fullCSS);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [fullCSS]);

  const applyPreset = useCallback((preset: typeof PRESETS[number]) => {
    setRadius(preset.radius);
    setAdvanced({
      topLeftH: preset.radius.topLeft, topLeftV: preset.radius.topLeft,
      topRightH: preset.radius.topRight, topRightV: preset.radius.topRight,
      bottomRightH: preset.radius.bottomRight, bottomRightV: preset.radius.bottomRight,
      bottomLeftH: preset.radius.bottomLeft, bottomLeftV: preset.radius.bottomLeft,
    });
    setUseAdvanced(false);
    setLinked(false);
  }, []);

  const maxVal = unit === "%" ? 50 : unit === "em" || unit === "rem" ? 20 : 200;

  return (
    <>
      <title>CSS Border Radius Generator - Free Online Tool | DevTools Hub</title>
      <meta
        name="description"
        content="Generate CSS border-radius visually with individual corner controls, presets, and advanced elliptical radius support. Copy CSS code instantly."
      />
      <JsonLd
        data={[
          generateWebAppSchema({
            slug: "border-radius-generator",
            name: "CSS Border Radius Generator",
            description: "Create and customize CSS border-radius values with a visual editor — adjust each corner independently",
            category: "design",
          }),
          generateBreadcrumbSchema({
            slug: "border-radius-generator",
            name: "CSS Border Radius Generator",
            description: "Create and customize CSS border-radius values with a visual editor — adjust each corner independently",
            category: "design",
          }),
          generateFAQSchema([
            { question: "What is CSS border-radius?", answer: "The CSS border-radius property rounds the corners of an element. You can set all four corners to the same value for uniform rounding, or control each corner independently. The shorthand accepts 1 to 4 values: one value applies to all corners, two values apply to top-left/bottom-right and top-right/bottom-left, three values apply to top-left, top-right/bottom-left, and bottom-right, and four values apply to each corner clockwise from top-left." },
            { question: "What are elliptical border radii?", answer: "Elliptical radii use the slash syntax (e.g. border-radius: 50px 20px / 30px 10px) to set different horizontal and vertical radii for each corner. This creates oval or egg-shaped corners instead of perfect circular arcs. Values before the slash control horizontal curvature, values after control vertical curvature." },
            { question: "How do I make a perfect circle with border-radius?", answer: "Set border-radius to 50% on an element with equal width and height. For example: width: 100px; height: 100px; border-radius: 50%. If the element is rectangular, 50% creates an ellipse. For a pill shape on a rectangular element, use a very large pixel value like 9999px." },
            { question: "What units can I use for border-radius?", answer: "You can use any CSS length unit: px (pixels) for absolute values, % (percentage) relative to the element's dimensions, em relative to the font size, or rem relative to the root font size. Percentages are most useful for responsive designs since they scale with the element. 50% always creates a circle on a square element regardless of size." },
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
              <li className="text-slate-200">Border Radius Generator</li>
            </ol>
          </nav>

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
              CSS Border Radius Generator
            </h1>
            <p className="text-slate-400 max-w-2xl text-lg">
              Create CSS border-radius values visually. Control each corner
              independently or link them together. Use advanced mode for
              elliptical corners. Pick from 16 shape presets or fine-tune your
              own.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Preview Panel */}
            <div>
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 mb-6">
                <h2 className="text-sm font-medium text-slate-400 mb-4">Live Preview</h2>
                <div
                  className="rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: bgColor, height: "320px" }}
                >
                  <div
                    className="flex items-center justify-center text-sm text-white/60 transition-all duration-200"
                    style={{
                      width: `${boxWidth}px`,
                      height: `${boxHeight}px`,
                      maxWidth: "100%",
                      maxHeight: "280px",
                      backgroundColor: boxColor,
                      borderRadius: previewBorderRadius,
                      border: borderWidth > 0 ? `${borderWidth}px solid ${borderColor}` : "none",
                    }}
                  >
                    {boxWidth} x {boxHeight}
                  </div>
                </div>

                {/* Preview Settings */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Box Color</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={boxColor}
                        onChange={(e) => setBoxColor(e.target.value)}
                        className="w-8 h-8 rounded border border-slate-600 cursor-pointer bg-transparent"
                      />
                      <span className="text-xs font-mono text-slate-300">{boxColor}</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Background</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={bgColor}
                        onChange={(e) => setBgColor(e.target.value)}
                        className="w-8 h-8 rounded border border-slate-600 cursor-pointer bg-transparent"
                      />
                      <span className="text-xs font-mono text-slate-300">{bgColor}</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Width: {boxWidth}px</label>
                    <input
                      type="range"
                      min={60}
                      max={300}
                      value={boxWidth}
                      onChange={(e) => setBoxWidth(Number(e.target.value))}
                      className="w-full accent-blue-500 mt-1"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Height: {boxHeight}px</label>
                    <input
                      type="range"
                      min={60}
                      max={300}
                      value={boxHeight}
                      onChange={(e) => setBoxHeight(Number(e.target.value))}
                      className="w-full accent-blue-500 mt-1"
                    />
                  </div>
                </div>

                {/* Border */}
                <div className="grid grid-cols-2 gap-3 mt-3">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Border: {borderWidth}px</label>
                    <input
                      type="range"
                      min={0}
                      max={10}
                      value={borderWidth}
                      onChange={(e) => setBorderWidth(Number(e.target.value))}
                      className="w-full accent-blue-500"
                    />
                  </div>
                  {borderWidth > 0 && (
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Border Color</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={borderColor}
                          onChange={(e) => setBorderColor(e.target.value)}
                          className="w-8 h-8 rounded border border-slate-600 cursor-pointer bg-transparent"
                        />
                        <span className="text-xs font-mono text-slate-300">{borderColor}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* CSS Output */}
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-medium text-slate-400">CSS Code</h2>
                  <button
                    onClick={copyCSS}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium transition-colors"
                  >
                    {copied ? "Copied!" : "Copy CSS"}
                  </button>
                </div>
                <div className="bg-slate-900 rounded-lg p-4">
                  <code className="text-sm font-mono text-green-400 whitespace-pre-wrap break-all select-all">
                    {fullCSS}
                  </code>
                </div>
              </div>
            </div>

            {/* Controls Panel */}
            <div>
              {/* Mode + Unit */}
              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-slate-300">Unit:</label>
                  <select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value as Unit)}
                    className="bg-slate-800 border border-slate-600 text-white rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="px">px</option>
                    <option value="%">%</option>
                    <option value="em">em</option>
                    <option value="rem">rem</option>
                  </select>
                </div>
                <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={linked}
                    onChange={(e) => setLinked(e.target.checked)}
                    className="w-4 h-4 rounded bg-slate-700 border-slate-600 text-blue-500 focus:ring-blue-500"
                  />
                  Link corners
                </label>
                <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={useAdvanced}
                    onChange={(e) => setUseAdvanced(e.target.checked)}
                    className="w-4 h-4 rounded bg-slate-700 border-slate-600 text-blue-500 focus:ring-blue-500"
                  />
                  Elliptical
                </label>
              </div>

              {/* Corner Controls */}
              {!useAdvanced ? (
                <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 mb-6">
                  <h2 className="text-sm font-medium text-slate-400 mb-4">Corner Radius</h2>
                  <div className="space-y-4">
                    {(
                      [
                        { key: "topLeft" as const, label: "Top Left" },
                        { key: "topRight" as const, label: "Top Right" },
                        { key: "bottomRight" as const, label: "Bottom Right" },
                        { key: "bottomLeft" as const, label: "Bottom Left" },
                      ]
                    ).map((corner) => (
                      <div key={corner.key}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-slate-300">{corner.label}</span>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              value={radius[corner.key]}
                              onChange={(e) => updateRadius(corner.key, Math.max(0, Math.min(maxVal, Number(e.target.value))))}
                              className="w-20 bg-slate-900 border border-slate-600 rounded px-2 py-1 text-sm font-mono text-slate-200 text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
                              min={0}
                              max={maxVal}
                            />
                            <span className="text-xs text-slate-500 w-6">{unit}</span>
                          </div>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={maxVal}
                          value={radius[corner.key]}
                          onChange={(e) => updateRadius(corner.key, Number(e.target.value))}
                          className="w-full accent-blue-500"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 mb-6">
                  <h2 className="text-sm font-medium text-slate-400 mb-4">
                    Elliptical Radius (Horizontal / Vertical)
                  </h2>
                  <div className="space-y-5">
                    {(
                      [
                        { h: "topLeftH" as const, v: "topLeftV" as const, label: "Top Left" },
                        { h: "topRightH" as const, v: "topRightV" as const, label: "Top Right" },
                        { h: "bottomRightH" as const, v: "bottomRightV" as const, label: "Bottom Right" },
                        { h: "bottomLeftH" as const, v: "bottomLeftV" as const, label: "Bottom Left" },
                      ]
                    ).map((corner) => (
                      <div key={corner.label}>
                        <span className="text-sm text-slate-300 block mb-2">{corner.label}</span>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs text-slate-500">Horizontal</span>
                              <span className="text-xs font-mono text-slate-400">
                                {advanced[corner.h]}{unit}
                              </span>
                            </div>
                            <input
                              type="range"
                              min={0}
                              max={maxVal}
                              value={advanced[corner.h]}
                              onChange={(e) => updateAdvanced(corner.h, Number(e.target.value))}
                              className="w-full accent-blue-500"
                            />
                          </div>
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs text-slate-500">Vertical</span>
                              <span className="text-xs font-mono text-slate-400">
                                {advanced[corner.v]}{unit}
                              </span>
                            </div>
                            <input
                              type="range"
                              min={0}
                              max={maxVal}
                              value={advanced[corner.v]}
                              onChange={(e) => updateAdvanced(corner.v, Number(e.target.value))}
                              className="w-full accent-blue-500"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Presets */}
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
                <h2 className="text-sm font-medium text-slate-400 mb-4">Presets</h2>
                <div className="grid grid-cols-4 gap-3">
                  {PRESETS.map((preset) => {
                    const r = preset.radius;
                    const previewRadius = `${r.topLeft}${unit === "%" ? "%" : "px"} ${r.topRight}${unit === "%" ? "%" : "px"} ${r.bottomRight}${unit === "%" ? "%" : "px"} ${r.bottomLeft}${unit === "%" ? "%" : "px"}`;
                    return (
                      <button
                        key={preset.name}
                        onClick={() => applyPreset(preset)}
                        className="group text-center"
                      >
                        <div className="flex items-center justify-center h-16 bg-slate-900 rounded-lg border border-slate-700 group-hover:border-blue-500 transition-colors">
                          <div
                            className="w-10 h-10"
                            style={{
                              backgroundColor: "#3b82f6",
                              borderRadius: previewRadius,
                            }}
                          />
                        </div>
                        <span className="text-xs text-slate-400 group-hover:text-white transition-colors mt-1 block">
                          {preset.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          <RelatedTools currentSlug="border-radius-generator" />

          {/* FAQ Section */}
          <section className="mt-16 border-t border-slate-700 pt-10">
            <h2 className="text-2xl font-bold text-white mb-6">
              Frequently Asked Questions
            </h2>

            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  What is CSS border-radius?
                </h3>
                <p className="text-slate-400">
                  The CSS border-radius property rounds the corners of an
                  element. You can set all four corners to the same value for
                  uniform rounding, or control each corner independently. The
                  shorthand accepts 1 to 4 values: one value applies to all
                  corners, two values apply to top-left/bottom-right and
                  top-right/bottom-left, three values apply to top-left,
                  top-right/bottom-left, and bottom-right, and four values apply
                  to each corner clockwise from top-left.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  What are elliptical border radii?
                </h3>
                <p className="text-slate-400">
                  Elliptical radii use the slash syntax (e.g.
                  border-radius: 50px 20px / 30px 10px) to set different
                  horizontal and vertical radii for each corner. This creates
                  oval or egg-shaped corners instead of perfect circular arcs.
                  Values before the slash control horizontal curvature, values
                  after control vertical curvature.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  How do I make a perfect circle with border-radius?
                </h3>
                <p className="text-slate-400">
                  Set border-radius to 50% on an element with equal width and
                  height. For example: width: 100px; height: 100px;
                  border-radius: 50%. If the element is rectangular, 50% creates
                  an ellipse. For a pill shape on a rectangular element, use a
                  very large pixel value like 9999px.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  What units can I use for border-radius?
                </h3>
                <p className="text-slate-400">
                  You can use any CSS length unit: px (pixels) for absolute
                  values, % (percentage) relative to the element&apos;s dimensions, em
                  relative to the font size, or rem relative to the root font
                  size. Percentages are most useful for responsive designs since
                  they scale with the element. 50% always creates a circle on a
                  square element regardless of size.
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
