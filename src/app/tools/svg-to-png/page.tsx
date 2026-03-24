"use client";

import { useState, useCallback, useRef } from "react";
import JsonLd from "@/components/JsonLd";
import RelatedTools from "@/components/RelatedTools";
import {
  generateFAQSchema,
  generateWebAppSchema,
  generateBreadcrumbSchema,
} from "@/lib/jsonld";

const formatBytes = (bytes: number): string => {
  if (bytes === 0) return "0 B";
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(2) + " MB";
};

type ScaleOption = 1 | 2 | 3 | 4;
type OutputFormat = "png" | "jpeg" | "webp";

export default function SvgToPngPage() {
  const [svgSource, setSvgSource] = useState<"file" | "code">("file");
  const [svgCode, setSvgCode] = useState("");
  const [svgFile, setSvgFile] = useState<File | null>(null);
  const [svgDataUrl, setSvgDataUrl] = useState<string | null>(null);
  const [svgDimensions, setSvgDimensions] = useState<{ w: number; h: number } | null>(null);
  const [scale, setScale] = useState<ScaleOption>(2);
  const [customWidth, setCustomWidth] = useState(0);
  const [customHeight, setCustomHeight] = useState(0);
  const [useCustomSize, setUseCustomSize] = useState(false);
  const [format, setFormat] = useState<OutputFormat>("png");
  const [quality, setQuality] = useState(92);
  const [bgColor, setBgColor] = useState("#ffffff");
  const [transparentBg, setTransparentBg] = useState(true);
  const [outputUrl, setOutputUrl] = useState<string | null>(null);
  const [outputSize, setOutputSize] = useState(0);
  const [outputDimensions, setOutputDimensions] = useState<{ w: number; h: number } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const parseSvgDimensions = useCallback((svgText: string): { w: number; h: number } => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgText, "image/svg+xml");
    const svg = doc.querySelector("svg");
    if (!svg) return { w: 300, h: 150 };

    let w = parseFloat(svg.getAttribute("width") || "0");
    let h = parseFloat(svg.getAttribute("height") || "0");

    if (w === 0 || h === 0) {
      const vb = svg.getAttribute("viewBox");
      if (vb) {
        const parts = vb.split(/[\s,]+/).map(Number);
        if (parts.length === 4) {
          w = parts[2];
          h = parts[3];
        }
      }
    }

    return { w: w || 300, h: h || 150 };
  }, []);

  const loadSvgFromText = useCallback((text: string) => {
    setError("");
    if (!text.trim().includes("<svg")) {
      setError("Input does not appear to be valid SVG markup.");
      return;
    }
    const dims = parseSvgDimensions(text);
    setSvgDimensions(dims);
    setCustomWidth(dims.w);
    setCustomHeight(dims.h);
    const blob = new Blob([text], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    setSvgDataUrl(url);
    setOutputUrl(null);
  }, [parseSvgDimensions]);

  const handleFile = useCallback((file: File) => {
    if (!file.name.endsWith(".svg") && file.type !== "image/svg+xml") {
      setError("Please upload an SVG file.");
      return;
    }
    setSvgFile(file);
    setError("");
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setSvgCode(text);
      loadSvgFromText(text);
    };
    reader.readAsText(file);
  }, [loadSvgFromText]);

  const handleConvert = useCallback(() => {
    if (!svgDataUrl || !canvasRef.current) return;
    setIsProcessing(true);
    setError("");

    const img = new Image();
    img.onload = () => {
      const canvas = canvasRef.current!;
      const ctx = canvas.getContext("2d")!;

      let targetW: number;
      let targetH: number;

      if (useCustomSize && customWidth > 0 && customHeight > 0) {
        targetW = customWidth;
        targetH = customHeight;
      } else if (svgDimensions) {
        targetW = Math.round(svgDimensions.w * scale);
        targetH = Math.round(svgDimensions.h * scale);
      } else {
        targetW = img.naturalWidth * scale;
        targetH = img.naturalHeight * scale;
      }

      canvas.width = targetW;
      canvas.height = targetH;

      // Background
      if (!transparentBg || format === "jpeg") {
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, targetW, targetH);
      } else {
        ctx.clearRect(0, 0, targetW, targetH);
      }

      ctx.drawImage(img, 0, 0, targetW, targetH);

      const mimeType = `image/${format}`;
      const qualityVal = format === "png" ? undefined : quality / 100;

      canvas.toBlob(
        (blob) => {
          if (blob) {
            if (outputUrl) URL.revokeObjectURL(outputUrl);
            const url = URL.createObjectURL(blob);
            setOutputUrl(url);
            setOutputSize(blob.size);
            setOutputDimensions({ w: targetW, h: targetH });
          }
          setIsProcessing(false);
        },
        mimeType,
        qualityVal
      );
    };
    img.onerror = () => {
      setError("Failed to render SVG. Check that your SVG markup is valid.");
      setIsProcessing(false);
    };
    img.src = svgDataUrl;
  }, [svgDataUrl, svgDimensions, scale, customWidth, customHeight, useCustomSize, format, quality, bgColor, transparentBg, outputUrl]);

  const handleDownload = useCallback(() => {
    if (!outputUrl) return;
    const ext = format === "jpeg" ? "jpg" : format;
    const baseName = svgFile?.name.replace(/\.svg$/i, "") || "converted";
    const a = document.createElement("a");
    a.href = outputUrl;
    a.download = `${baseName}-${outputDimensions?.w}x${outputDimensions?.h}.${ext}`;
    a.click();
  }, [outputUrl, format, svgFile, outputDimensions]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  return (
    <>
      <title>SVG to PNG Converter - Free Online Tool | DevTools Hub</title>
      <meta
        name="description"
        content="Convert SVG files to PNG, JPEG, or WebP online for free. Scale up to 4x for retina displays with custom dimensions and background options — all in your browser."
      />
      <JsonLd
        data={[
          generateWebAppSchema({
            slug: "svg-to-png",
            name: "SVG to PNG Converter",
            description: "Convert SVG files to PNG images with customizable dimensions and transparent background",
            category: "conversion",
          }),
          generateBreadcrumbSchema({
            slug: "svg-to-png",
            name: "SVG to PNG Converter",
            description: "Convert SVG files to PNG images with customizable dimensions and transparent background",
            category: "conversion",
          }),
          generateFAQSchema([
            { question: "Why convert SVG to PNG?", answer: "SVGs are great for web but many platforms (social media, email, documents, presentations) require raster images like PNG. Converting SVG to PNG also lets you control the exact pixel dimensions and create high-resolution versions for retina displays." },
            { question: "What does the scale option do?", answer: "Scale multiplies the SVG's native dimensions. A 100x100 SVG at 2x becomes a 200x200 PNG, at 4x it becomes 400x400. Higher scales produce sharper images, especially useful for icons and logos on high-DPI (retina) screens." },
            { question: "Is my SVG uploaded to a server?", answer: "No. All conversion happens entirely in your browser using the Canvas API. Your SVG files and code never leave your device -- nothing is sent to any server." },
            { question: "Can I paste SVG code directly?", answer: "Yes! Switch to the 'Paste SVG Code' tab and paste your SVG markup. This is useful when you have inline SVG from a website, design tool export, or code editor. The converter will parse the dimensions from the viewBox or width/height attributes." },
          ]),
        ]}
      />

    <main className="min-h-screen bg-slate-900 text-white">
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Breadcrumb */}
        <nav className="text-sm text-slate-400 mb-6" aria-label="Breadcrumb">
          <ol className="flex items-center gap-2">
            <li><a href="/" className="hover:text-white transition-colors">Home</a></li>
            <li><span className="mx-1">/</span></li>
            <li><a href="/tools" className="hover:text-white transition-colors">Conversion Tools</a></li>
            <li><span className="mx-1">/</span></li>
            <li className="text-slate-200">SVG to PNG Converter</li>
          </ol>
        </nav>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">SVG to PNG Converter</h1>
          <p className="text-slate-400">
            Convert SVG files to high-resolution PNG, JPEG, or WebP images. Scale up to 4x for crisp retina displays. All processing in your browser.
          </p>
        </div>

        {/* Source Selection */}
        <div className="bg-slate-800 rounded-lg p-6 mb-6">
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setSvgSource("file")}
              className={`flex-1 py-2 px-4 rounded text-sm font-medium transition-colors ${
                svgSource === "file" ? "bg-blue-600 text-white" : "bg-slate-700 text-slate-300 hover:bg-slate-600"
              }`}
            >
              Upload SVG File
            </button>
            <button
              onClick={() => setSvgSource("code")}
              className={`flex-1 py-2 px-4 rounded text-sm font-medium transition-colors ${
                svgSource === "code" ? "bg-blue-600 text-white" : "bg-slate-700 text-slate-300 hover:bg-slate-600"
              }`}
            >
              Paste SVG Code
            </button>
          </div>

          {svgSource === "file" ? (
            <div
              onDrop={handleDrop}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                isDragging ? "border-blue-500 bg-blue-500/10" : "border-slate-600 hover:border-slate-500"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".svg,image/svg+xml"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
                className="hidden"
              />
              {svgFile ? (
                <div>
                  <div className="text-lg font-medium">{svgFile.name}</div>
                  <div className="text-sm text-slate-400 mt-1">
                    {svgDimensions && `${svgDimensions.w} × ${svgDimensions.h}`} · {formatBytes(svgFile.size)}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">Click or drop to replace</div>
                </div>
              ) : (
                <div>
                  <div className="text-4xl mb-2">📐</div>
                  <div className="text-lg font-medium">Drop an SVG file here or click to upload</div>
                  <div className="text-sm text-slate-400 mt-1">Accepts .svg files</div>
                </div>
              )}
            </div>
          ) : (
            <div>
              <textarea
                value={svgCode}
                onChange={(e) => setSvgCode(e.target.value)}
                placeholder='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">...</svg>'
                className="w-full h-48 bg-slate-900 border border-slate-700 rounded p-3 text-sm font-mono text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
                spellCheck={false}
              />
              <button
                onClick={() => { if (svgCode.trim()) loadSvgFromText(svgCode); }}
                className="mt-2 w-full bg-slate-700 hover:bg-slate-600 text-white text-sm py-2 rounded transition-colors"
              >
                Load SVG
              </button>
            </div>
          )}
        </div>

        {/* SVG Preview */}
        {svgDataUrl && (
          <div className="bg-slate-800 rounded-lg p-6 mb-6">
            <h2 className="text-sm font-medium text-slate-400 mb-3">SVG Preview</h2>
            <div className="bg-white/5 border border-slate-700 rounded p-4 flex justify-center"
              style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16'%3E%3Crect width='8' height='8' fill='%23333'/%3E%3Crect x='8' y='8' width='8' height='8' fill='%23333'/%3E%3C/svg%3E\")" }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={svgDataUrl} alt="SVG preview" className="max-w-full max-h-48" loading="lazy" />
            </div>
          </div>
        )}

        {/* Conversion Settings */}
        {svgDataUrl && (
          <div className="bg-slate-800 rounded-lg p-6 mb-6">
            <h2 className="text-sm font-medium text-slate-400 mb-4">Output Settings</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              {/* Format */}
              <div>
                <label className="block text-xs text-slate-400 mb-1">Output Format</label>
                <select
                  value={format}
                  onChange={(e) => { setFormat(e.target.value as OutputFormat); setOutputUrl(null); }}
                  className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="png">PNG — Lossless with transparency</option>
                  <option value="jpeg">JPEG — Smaller, no transparency</option>
                  <option value="webp">WebP — Modern, best compression</option>
                </select>
              </div>

              {/* Scale */}
              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  Scale {!useCustomSize && svgDimensions && `(${Math.round(svgDimensions.w * scale)} × ${Math.round(svgDimensions.h * scale)}px)`}
                </label>
                <div className="flex gap-1">
                  {([1, 2, 3, 4] as ScaleOption[]).map((s) => (
                    <button
                      key={s}
                      onClick={() => { setScale(s); setUseCustomSize(false); setOutputUrl(null); }}
                      className={`flex-1 py-2 rounded text-sm font-medium transition-colors ${
                        scale === s && !useCustomSize
                          ? "bg-blue-600 text-white"
                          : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                      }`}
                    >
                      {s}x
                    </button>
                  ))}
                  <button
                    onClick={() => { setUseCustomSize(true); setOutputUrl(null); }}
                    className={`flex-1 py-2 rounded text-sm font-medium transition-colors ${
                      useCustomSize
                        ? "bg-blue-600 text-white"
                        : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                    }`}
                  >
                    Custom
                  </button>
                </div>
              </div>
            </div>

            {/* Custom Size */}
            {useCustomSize && (
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Width (px)</label>
                  <input
                    type="number"
                    min={1}
                    max={8192}
                    value={customWidth}
                    onChange={(e) => { setCustomWidth(parseInt(e.target.value) || 0); setOutputUrl(null); }}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Height (px)</label>
                  <input
                    type="number"
                    min={1}
                    max={8192}
                    value={customHeight}
                    onChange={(e) => { setCustomHeight(parseInt(e.target.value) || 0); setOutputUrl(null); }}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            )}

            {/* Background */}
            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="transparentBg"
                  checked={transparentBg && format !== "jpeg"}
                  disabled={format === "jpeg"}
                  onChange={(e) => { setTransparentBg(e.target.checked); setOutputUrl(null); }}
                  className="w-4 h-4 rounded bg-slate-700 border-slate-600 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="transparentBg" className="text-sm text-slate-300">
                  Transparent background {format === "jpeg" ? "(not supported for JPEG)" : ""}
                </label>
              </div>
              {(!transparentBg || format === "jpeg") && (
                <div className="flex items-center gap-2">
                  <label className="text-xs text-slate-400">BG Color:</label>
                  <input
                    type="color"
                    value={bgColor}
                    onChange={(e) => { setBgColor(e.target.value); setOutputUrl(null); }}
                    className="w-8 h-8 rounded border border-slate-600 cursor-pointer"
                  />
                </div>
              )}
            </div>

            {/* Quality (for JPEG/WebP) */}
            {format !== "png" && (
              <div className="mb-4">
                <label className="text-sm text-slate-300">Quality: {quality}%</label>
                <input
                  type="range"
                  min={10}
                  max={100}
                  value={quality}
                  onChange={(e) => { setQuality(parseInt(e.target.value)); setOutputUrl(null); }}
                  className="w-full accent-blue-600 mt-1"
                />
              </div>
            )}

            {/* Convert Button */}
            <button
              onClick={handleConvert}
              disabled={isProcessing}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 text-white font-medium py-3 px-6 rounded transition-colors"
            >
              {isProcessing ? "Converting..." : `Convert to ${format.toUpperCase()}`}
            </button>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-900/50 border border-red-700 rounded-lg p-4 mb-6 text-red-300 text-sm">
            {error}
          </div>
        )}

        {/* Output */}
        {outputUrl && outputDimensions && (
          <div className="bg-slate-800 rounded-lg p-6 mb-6">
            <h2 className="text-sm font-medium text-slate-400 mb-3">Result</h2>

            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="bg-slate-900 rounded p-3 text-center">
                <div className="text-xs text-slate-400 mb-1">Dimensions</div>
                <div className="text-sm font-mono font-medium">{outputDimensions.w} × {outputDimensions.h}</div>
              </div>
              <div className="bg-slate-900 rounded p-3 text-center">
                <div className="text-xs text-slate-400 mb-1">Format</div>
                <div className="text-sm font-mono font-medium">{format.toUpperCase()}</div>
              </div>
              <div className="bg-slate-900 rounded p-3 text-center">
                <div className="text-xs text-slate-400 mb-1">Size</div>
                <div className="text-sm font-mono font-medium">{formatBytes(outputSize)}</div>
              </div>
            </div>

            <div className="mb-4 flex justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={outputUrl} alt="Converted output" className="max-w-full max-h-64 rounded border border-slate-700" loading="lazy" />
            </div>

            <button
              onClick={handleDownload}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-6 rounded transition-colors"
            >
              Download {format.toUpperCase()} ({formatBytes(outputSize)})
            </button>
          </div>
        )}

        {/* Hidden canvas */}
        <canvas ref={canvasRef} className="hidden" />

        <RelatedTools currentSlug="svg-to-png" />

        {/* FAQ */}
        <div className="bg-slate-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {[
              {
                q: "Why convert SVG to PNG?",
                a: "SVGs are great for web but many platforms (social media, email, documents, presentations) require raster images like PNG. Converting SVG to PNG also lets you control the exact pixel dimensions and create high-resolution versions for retina displays."
              },
              {
                q: "What does the scale option do?",
                a: "Scale multiplies the SVG's native dimensions. A 100×100 SVG at 2x becomes a 200×200 PNG, at 4x it becomes 400×400. Higher scales produce sharper images, especially useful for icons and logos on high-DPI (retina) screens."
              },
              {
                q: "Is my SVG uploaded to a server?",
                a: "No. All conversion happens entirely in your browser using the Canvas API. Your SVG files and code never leave your device — nothing is sent to any server."
              },
              {
                q: "Can I paste SVG code directly?",
                a: "Yes! Switch to the 'Paste SVG Code' tab and paste your SVG markup. This is useful when you have inline SVG from a website, design tool export, or code editor. The converter will parse the dimensions from the viewBox or width/height attributes."
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
