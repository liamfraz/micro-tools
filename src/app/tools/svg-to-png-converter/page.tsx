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

type OutputFormat = "png" | "jpg";
type ScaleFactor = 1 | 2 | 3 | 4;

const SLUG = "svg-to-png-converter";
const TOOL_NAME = "SVG to PNG/JPG Converter";
const TOOL_DESC =
  "Convert SVG files to PNG or JPG images online. Upload or paste SVG code, set custom dimensions, choose scale factor for retina exports, and download high-quality raster images. 100% client-side.";

const FAQS = [
  {
    question: "How does SVG to PNG conversion work?",
    answer:
      "The tool loads your SVG into a browser Image element, then draws it onto an HTML5 Canvas at your chosen dimensions and scale factor. The Canvas is then exported as a PNG or JPG file. Everything runs in your browser — no server upload required.",
  },
  {
    question: "What scale factor should I use?",
    answer:
      "Use 1x for standard screens, 2x for Retina/HiDPI displays (most modern laptops and phones), 3x for extra-high-density mobile screens, and 4x for print or very large displays. Higher scale factors produce larger files but sharper images when displayed at the original dimensions.",
  },
  {
    question: "Can I convert SVG to JPG with a transparent background?",
    answer:
      "JPG does not support transparency. When converting to JPG, transparent areas are filled with the background color you choose (white by default). For transparent backgrounds, export as PNG instead.",
  },
  {
    question: "Is there a file size limit?",
    answer:
      "Since all processing happens in your browser, there is no server-imposed file size limit. However, very large or complex SVGs may take longer to render. The Canvas API handles most SVGs efficiently.",
  },
  {
    question: "Will my SVG look the same after conversion?",
    answer:
      "In most cases, yes. The conversion uses the browser's native SVG renderer, which handles gradients, filters, text, and paths accurately. Some SVGs that reference external fonts or images may need those resources embedded in the SVG for perfect rendering.",
  },
  {
    question: "What dimensions should I use?",
    answer:
      "By default, the tool uses the SVG's intrinsic width and height (from its viewBox or width/height attributes). You can override these with custom dimensions. Lock the aspect ratio to prevent distortion when changing one dimension.",
  },
];

export default function SvgToPngConverterPage() {
  const [svgSource, setSvgSource] = useState("");
  const [outputFormat, setOutputFormat] = useState<OutputFormat>("png");
  const [jpgQuality, setJpgQuality] = useState(92);
  const [scale, setScale] = useState<ScaleFactor>(1);
  const [width, setWidth] = useState<number>(0);
  const [height, setHeight] = useState<number>(0);
  const [intrinsicWidth, setIntrinsicWidth] = useState<number>(0);
  const [intrinsicHeight, setIntrinsicHeight] = useState<number>(0);
  const [lockAspect, setLockAspect] = useState(true);
  const [bgColor, setBgColor] = useState("#ffffff");
  const [transparent, setTransparent] = useState(true);
  const [error, setError] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");
  const [converting, setConverting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Parse SVG dimensions from source
  const parseSvgDimensions = useCallback((svg: string) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(svg, "image/svg+xml");
    const svgEl = doc.querySelector("svg");
    if (!svgEl) return null;

    let w = 0;
    let h = 0;

    const viewBox = svgEl.getAttribute("viewBox");
    if (viewBox) {
      const parts = viewBox.split(/[\s,]+/).map(Number);
      if (parts.length === 4) {
        w = parts[2];
        h = parts[3];
      }
    }

    const attrW = svgEl.getAttribute("width");
    const attrH = svgEl.getAttribute("height");
    if (attrW && attrH) {
      const pw = parseFloat(attrW);
      const ph = parseFloat(attrH);
      if (pw > 0 && ph > 0) {
        w = pw;
        h = ph;
      }
    }

    return w > 0 && h > 0 ? { w: Math.round(w), h: Math.round(h) } : null;
  }, []);

  // Update preview and dimensions when SVG source changes
  useEffect(() => {
    if (!svgSource.trim()) {
      setPreviewUrl("");
      setError("");
      return;
    }

    // Validate SVG
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgSource, "image/svg+xml");
    const parseError = doc.querySelector("parsererror");
    if (parseError) {
      setError("Invalid SVG: " + parseError.textContent?.slice(0, 120));
      setPreviewUrl("");
      return;
    }
    if (!doc.querySelector("svg")) {
      setError("No <svg> element found in the input.");
      setPreviewUrl("");
      return;
    }

    setError("");
    const blob = new Blob([svgSource], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    setPreviewUrl(url);

    const dims = parseSvgDimensions(svgSource);
    if (dims) {
      setIntrinsicWidth(dims.w);
      setIntrinsicHeight(dims.h);
      setWidth(dims.w);
      setHeight(dims.h);
    }

    return () => URL.revokeObjectURL(url);
  }, [svgSource, parseSvgDimensions]);

  const handleWidthChange = useCallback(
    (newW: number) => {
      setWidth(newW);
      if (lockAspect && intrinsicWidth > 0 && intrinsicHeight > 0) {
        setHeight(Math.round((newW / intrinsicWidth) * intrinsicHeight));
      }
    },
    [lockAspect, intrinsicWidth, intrinsicHeight]
  );

  const handleHeightChange = useCallback(
    (newH: number) => {
      setHeight(newH);
      if (lockAspect && intrinsicWidth > 0 && intrinsicHeight > 0) {
        setWidth(Math.round((newH / intrinsicHeight) * intrinsicWidth));
      }
    },
    [lockAspect, intrinsicWidth, intrinsicHeight]
  );

  const handleFileUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      if (!file.name.toLowerCase().endsWith(".svg") && file.type !== "image/svg+xml") {
        setError("Please upload an SVG file.");
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") {
          setSvgSource(reader.result);
        }
      };
      reader.readAsText(file);
      // Reset input so re-uploading same file works
      e.target.value = "";
    },
    []
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files?.[0];
      if (file) {
        if (!file.name.toLowerCase().endsWith(".svg") && file.type !== "image/svg+xml") {
          setError("Please drop an SVG file.");
          return;
        }
        const reader = new FileReader();
        reader.onload = () => {
          if (typeof reader.result === "string") {
            setSvgSource(reader.result);
          }
        };
        reader.readAsText(file);
      }

      // Also handle pasted SVG text from drag
      const text = e.dataTransfer.getData("text/plain");
      if (text && text.includes("<svg")) {
        setSvgSource(text);
      }
    },
    []
  );

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const text = e.clipboardData.getData("text/plain");
    if (text && text.includes("<svg")) {
      e.preventDefault();
      setSvgSource(text);
    }
  }, []);

  const convert = useCallback(async () => {
    if (!svgSource.trim() || width <= 0 || height <= 0) return;

    setConverting(true);
    setError("");

    try {
      const canvas = document.createElement("canvas");
      const outputW = width * scale;
      const outputH = height * scale;
      canvas.width = outputW;
      canvas.height = outputH;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas context not available.");

      // Fill background
      if (outputFormat === "jpg" || !transparent) {
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, outputW, outputH);
      }

      // Load SVG as image
      const blob = new Blob([svgSource], { type: "image/svg+xml;charset=utf-8" });
      const url = URL.createObjectURL(blob);

      const img = new Image();
      img.width = outputW;
      img.height = outputH;

      await new Promise<void>((resolve, reject) => {
        img.onload = () => {
          ctx.drawImage(img, 0, 0, outputW, outputH);
          URL.revokeObjectURL(url);
          resolve();
        };
        img.onerror = () => {
          URL.revokeObjectURL(url);
          reject(new Error("Failed to load SVG for rendering."));
        };
        img.src = url;
      });

      const mimeType = outputFormat === "jpg" ? "image/jpeg" : "image/png";
      const quality = outputFormat === "jpg" ? jpgQuality / 100 : undefined;
      const dataUrl = canvas.toDataURL(mimeType, quality);

      const link = document.createElement("a");
      link.download = `converted.${outputFormat === "jpg" ? "jpg" : "png"}`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Conversion failed.");
    } finally {
      setConverting(false);
    }
  }, [svgSource, width, height, scale, outputFormat, jpgQuality, transparent, bgColor]);

  const aspectRatio = intrinsicWidth > 0 && intrinsicHeight > 0
    ? (intrinsicWidth / intrinsicHeight).toFixed(2)
    : null;

  return (
    <>
      <title>{TOOL_NAME} - Free Online SVG Converter | DevTools</title>
      <meta name="description" content={TOOL_DESC} />
      <meta
        name="keywords"
        content="svg to png, svg to jpg, svg converter, convert svg online, svg to image, svg to png converter, svg to jpeg, svg to raster, svg export, svg download png"
      />
      <JsonLd
        data={[
          generateWebAppSchema({
            slug: SLUG,
            name: TOOL_NAME,
            description: TOOL_DESC,
            category: "image",
          }),
          generateBreadcrumbSchema({
            slug: SLUG,
            name: TOOL_NAME,
            description: TOOL_DESC,
            category: "image",
          }),
          generateFAQSchema(
            FAQS.map((f) => ({ question: f.question, answer: f.answer }))
          ),
        ]}
      />

      <div className="min-h-screen bg-slate-900 text-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <ToolBreadcrumb slug={SLUG} />

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
              {TOOL_NAME}
            </h1>
            <p className="text-slate-400 max-w-2xl text-lg">
              Convert SVG files to high-quality PNG or JPG images. Upload a file or paste SVG code,
              set custom dimensions and scale factor, then download. 100% client-side — your files
              never leave your browser.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Left: Input */}
            <div className="space-y-4">
              {/* Upload area */}
              <div
                className="bg-slate-800 border-2 border-dashed border-slate-600 rounded-lg p-6 text-center cursor-pointer hover:border-blue-500 transition-colors"
                onClick={() => fileInputRef.current?.click()}
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".svg,image/svg+xml"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <div className="text-3xl mb-2">
                  <svg className="w-10 h-10 mx-auto text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                  </svg>
                </div>
                <p className="text-sm text-slate-400">
                  Click to upload SVG or drag &amp; drop
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Or paste SVG code in the editor below
                </p>
              </div>

              {/* SVG code editor */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  SVG Code
                </label>
                <textarea
                  value={svgSource}
                  onChange={(e) => setSvgSource(e.target.value)}
                  onPaste={handlePaste}
                  placeholder={'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">...</svg>'}
                  className="w-full h-52 bg-slate-900 border border-slate-600 rounded-lg px-4 py-3 font-mono text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
                  spellCheck={false}
                />
              </div>

              {error && (
                <div className="bg-red-900/40 border border-red-700 rounded-lg px-4 py-3 text-sm text-red-300">
                  {error}
                </div>
              )}
            </div>

            {/* Right: Preview */}
            <div className="space-y-4">
              <label className="block text-sm font-medium text-slate-300">
                Preview
              </label>
              <div
                className="bg-slate-800 border border-slate-700 rounded-lg min-h-[280px] flex items-center justify-center relative overflow-hidden"
              >
                {/* Checkerboard background for transparency */}
                <div
                  className="absolute inset-0"
                  style={{
                    backgroundImage:
                      "linear-gradient(45deg, #1e293b 25%, transparent 25%), linear-gradient(-45deg, #1e293b 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #1e293b 75%), linear-gradient(-45deg, transparent 75%, #1e293b 75%)",
                    backgroundSize: "20px 20px",
                    backgroundPosition: "0 0, 0 10px, 10px -10px, -10px 0px",
                  }}
                />
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt="SVG Preview"
                    className="relative max-w-full max-h-80 object-contain p-4"
                  />
                ) : (
                  <p className="text-slate-500 text-sm relative">
                    Upload or paste an SVG to preview
                  </p>
                )}
              </div>
              {intrinsicWidth > 0 && intrinsicHeight > 0 && (
                <p className="text-xs text-slate-500">
                  Intrinsic size: {intrinsicWidth} &times; {intrinsicHeight}px
                  {aspectRatio && <> &middot; Aspect ratio: {aspectRatio}</>}
                </p>
              )}
            </div>
          </div>

          {/* Settings */}
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 mb-6">
            <h2 className="text-lg font-semibold text-white mb-4">Export Settings</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Output Format */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Output Format
                </label>
                <div className="flex gap-2">
                  {(["png", "jpg"] as OutputFormat[]).map((fmt) => (
                    <button
                      key={fmt}
                      onClick={() => setOutputFormat(fmt)}
                      className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors uppercase ${
                        outputFormat === fmt
                          ? "bg-blue-600 text-white"
                          : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                      }`}
                    >
                      {fmt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Scale */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Scale Factor
                </label>
                <div className="flex gap-2">
                  {([1, 2, 3, 4] as ScaleFactor[]).map((s) => (
                    <button
                      key={s}
                      onClick={() => setScale(s)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        scale === s
                          ? "bg-blue-600 text-white"
                          : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                      }`}
                    >
                      {s}x
                    </button>
                  ))}
                </div>
              </div>

              {/* Dimensions */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Dimensions (px)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    max={10000}
                    value={width || ""}
                    onChange={(e) => handleWidthChange(Math.max(1, Number(e.target.value)))}
                    placeholder="W"
                    className="w-20 bg-slate-900 border border-slate-600 rounded px-2 py-2 font-mono text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={() => setLockAspect(!lockAspect)}
                    className={`p-1.5 rounded transition-colors ${
                      lockAspect
                        ? "text-blue-400 hover:text-blue-300"
                        : "text-slate-500 hover:text-slate-400"
                    }`}
                    title={lockAspect ? "Unlock aspect ratio" : "Lock aspect ratio"}
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      {lockAspect ? (
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                      ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5V6.75a4.5 4.5 0 119 0v3.75M3.75 21.75h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H3.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                      )}
                    </svg>
                  </button>
                  <input
                    type="number"
                    min={1}
                    max={10000}
                    value={height || ""}
                    onChange={(e) => handleHeightChange(Math.max(1, Number(e.target.value)))}
                    placeholder="H"
                    className="w-20 bg-slate-900 border border-slate-600 rounded px-2 py-2 font-mono text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                {width > 0 && height > 0 && scale > 1 && (
                  <p className="text-xs text-slate-500 mt-1">
                    Output: {width * scale} &times; {height * scale}px
                  </p>
                )}
              </div>

              {/* Background */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Background
                </label>
                {outputFormat === "png" && (
                  <label className="flex items-center gap-2 mb-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={transparent}
                      onChange={(e) => setTransparent(e.target.checked)}
                      className="w-4 h-4 rounded bg-slate-700 border-slate-600 text-blue-600 focus:ring-blue-500 focus:ring-offset-0"
                    />
                    <span className="text-sm text-slate-300">Transparent</span>
                  </label>
                )}
                {(outputFormat === "jpg" || !transparent) && (
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={bgColor}
                      onChange={(e) => setBgColor(e.target.value)}
                      className="w-8 h-8 rounded cursor-pointer border border-slate-600 bg-transparent"
                    />
                    <input
                      type="text"
                      value={bgColor}
                      onChange={(e) => setBgColor(e.target.value)}
                      className="w-24 bg-slate-900 border border-slate-600 rounded px-2 py-1.5 font-mono text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* JPG Quality slider */}
            {outputFormat === "jpg" && (
              <div className="mt-4 max-w-xs">
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  JPG Quality: {jpgQuality}%
                </label>
                <input
                  type="range"
                  min={10}
                  max={100}
                  value={jpgQuality}
                  onChange={(e) => setJpgQuality(Number(e.target.value))}
                  className="w-full accent-blue-500"
                />
                <div className="flex justify-between text-xs text-slate-500 mt-1">
                  <span>Smaller file</span>
                  <span>Higher quality</span>
                </div>
              </div>
            )}
          </div>

          {/* Download */}
          <div className="flex flex-wrap items-center gap-4 mb-8">
            <button
              onClick={convert}
              disabled={!svgSource.trim() || width <= 0 || height <= 0 || converting}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg text-sm font-semibold transition-colors"
            >
              {converting
                ? "Converting..."
                : `Download ${outputFormat.toUpperCase()}`}
            </button>
            {svgSource.trim() && (
              <button
                onClick={() => {
                  setSvgSource("");
                  setWidth(0);
                  setHeight(0);
                  setIntrinsicWidth(0);
                  setIntrinsicHeight(0);
                  setError("");
                }}
                className="px-4 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Clear
              </button>
            )}
            {width > 0 && height > 0 && (
              <span className="text-sm text-slate-400">
                {width * scale} &times; {height * scale}px &middot;{" "}
                {outputFormat.toUpperCase()}
                {outputFormat === "jpg" && ` @ ${jpgQuality}%`}
                {scale > 1 && ` @ ${scale}x`}
              </span>
            )}
          </div>

          {/* How it works */}
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 mb-6">
            <h2 className="text-lg font-semibold text-white mb-4">
              How SVG to PNG/JPG Conversion Works
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                {
                  step: "1",
                  title: "Upload or Paste",
                  desc: "Drop an SVG file, click to upload, or paste raw SVG code into the editor.",
                },
                {
                  step: "2",
                  title: "Configure",
                  desc: "Choose PNG or JPG, set dimensions, pick a scale factor for retina, and set background.",
                },
                {
                  step: "3",
                  title: "Download",
                  desc: "Click Download to render via the Canvas API and save the raster image instantly.",
                },
              ].map((item) => (
                <div key={item.step} className="text-center">
                  <div className="w-10 h-10 rounded-full bg-blue-600/20 text-blue-400 font-bold text-lg flex items-center justify-center mx-auto mb-3">
                    {item.step}
                  </div>
                  <h3 className="text-sm font-semibold text-white mb-1">{item.title}</h3>
                  <p className="text-xs text-slate-400">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Reference table */}
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 mb-6">
            <h2 className="text-lg font-semibold text-white mb-4">PNG vs JPG Comparison</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-600">
                    <th className="text-left py-2 text-slate-400 font-medium">Feature</th>
                    <th className="text-left py-2 text-slate-400 font-medium">PNG</th>
                    <th className="text-left py-2 text-slate-400 font-medium">JPG</th>
                  </tr>
                </thead>
                <tbody className="text-slate-300">
                  {[
                    ["Transparency", "Yes (alpha channel)", "No (filled with background color)"],
                    ["Compression", "Lossless", "Lossy (adjustable quality)"],
                    ["Best for", "Icons, logos, UI elements, illustrations", "Photos, complex images, smaller file size"],
                    ["File size", "Larger (lossless)", "Smaller (lossy, configurable)"],
                    ["Color depth", "Up to 48-bit", "24-bit"],
                  ].map((row) => (
                    <tr key={row[0]} className="border-b border-slate-700/50">
                      <td className="py-2 font-medium text-white">{row[0]}</td>
                      <td className="py-2">{row[1]}</td>
                      <td className="py-2">{row[2]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Internal links */}
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 mb-6">
            <h2 className="text-lg font-semibold text-white mb-3">Related Tools</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <a
                href="/tools/css-gradient-generator"
                className="flex items-center gap-3 bg-slate-900 rounded-lg p-4 hover:bg-slate-700 transition-colors group"
              >
                <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center border border-slate-600 group-hover:border-blue-500 transition-colors">
                  <span className="text-lg">&#9632;</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-white group-hover:text-blue-400 transition-colors">CSS Gradient Generator</p>
                  <p className="text-xs text-slate-400">Create beautiful CSS gradients visually</p>
                </div>
              </a>
              <a
                href="/tools/base64-image-encoder"
                className="flex items-center gap-3 bg-slate-900 rounded-lg p-4 hover:bg-slate-700 transition-colors group"
              >
                <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center border border-slate-600 group-hover:border-blue-500 transition-colors">
                  <span className="text-lg">&#128247;</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-white group-hover:text-blue-400 transition-colors">Base64 Image Encoder</p>
                  <p className="text-xs text-slate-400">Convert images to Base64 data URIs</p>
                </div>
              </a>
            </div>
          </div>

          <RelatedTools currentSlug={SLUG} />

          {/* FAQ */}
          <section className="mt-16 border-t border-slate-700 pt-10">
            <h2 className="text-2xl font-bold text-white mb-6">
              Frequently Asked Questions
            </h2>
            <div className="space-y-6">
              {FAQS.map((item) => (
                <div key={item.question}>
                  <h3 className="text-lg font-semibold text-white mb-2">
                    {item.question}
                  </h3>
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
