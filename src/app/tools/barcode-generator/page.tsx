"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import JsonLd from "@/components/JsonLd";
import RelatedTools from "@/components/RelatedTools";
import {
  generateFAQSchema,
  generateWebAppSchema,
  generateBreadcrumbSchema,
} from "@/lib/jsonld";

type BarcodeFormat = "code128" | "ean13" | "upca";

// ---- Code 128 Encoding ----
const CODE128_START_B = 104;
const CODE128_STOP = 106;

const CODE128_PATTERNS: number[][] = [
  [2,1,2,2,2,2],[2,2,2,1,2,2],[2,2,2,2,2,1],[1,2,1,2,2,3],[1,2,1,3,2,2],
  [1,3,1,2,2,2],[1,2,2,2,1,3],[1,2,2,3,1,2],[1,3,2,2,1,2],[2,2,1,2,1,3],
  [2,2,1,3,1,2],[2,3,1,2,1,2],[1,1,2,2,3,2],[1,2,2,1,3,2],[1,2,2,2,3,1],
  [1,1,3,2,2,2],[1,2,3,1,2,2],[1,2,3,2,2,1],[2,2,3,2,1,1],[2,2,1,1,3,2],
  [2,2,1,2,3,1],[2,1,3,2,1,2],[2,2,3,1,1,2],[3,1,2,1,3,1],[3,1,1,2,2,2],
  [3,2,1,1,2,2],[3,2,1,2,2,1],[3,1,2,2,1,2],[3,2,2,1,1,2],[3,2,2,2,1,1],
  [2,1,2,1,2,3],[2,1,2,3,2,1],[2,3,2,1,2,1],[1,1,1,3,2,3],[1,3,1,1,2,3],
  [1,3,1,3,2,1],[1,1,2,3,1,3],[1,3,2,1,1,3],[1,3,2,3,1,1],[2,1,1,3,1,3],
  [2,3,1,1,1,3],[2,3,1,3,1,1],[1,1,2,1,3,3],[1,1,2,3,3,1],[1,3,2,1,3,1],
  [1,1,3,1,2,3],[1,1,3,3,2,1],[1,3,3,1,2,1],[3,1,3,1,2,1],[2,1,1,3,3,1],
  [2,3,1,1,3,1],[2,1,3,1,1,3],[2,1,3,3,1,1],[2,1,3,1,3,1],[3,1,1,1,2,3],
  [3,1,1,3,2,1],[3,3,1,1,2,1],[3,1,2,1,1,3],[3,1,2,3,1,1],[3,3,2,1,1,1],
  [3,1,4,1,1,1],[2,2,1,4,1,1],[4,3,1,1,1,1],[1,1,1,2,2,4],[1,1,1,4,2,2],
  [1,2,1,1,2,4],[1,2,1,4,2,1],[1,4,1,1,2,2],[1,4,1,2,2,1],[1,1,2,2,1,4],
  [1,1,2,4,1,2],[1,2,2,1,1,4],[1,2,2,4,1,1],[1,4,2,1,1,2],[1,4,2,2,1,1],
  [2,4,1,2,1,1],[2,2,1,1,1,4],[4,1,3,1,1,1],[2,4,1,1,1,2],[1,3,4,1,1,1],
  [1,1,1,2,4,2],[1,2,1,1,4,2],[1,2,1,2,4,1],[1,1,4,2,1,2],[1,2,4,1,1,2],
  [1,2,4,2,1,1],[4,1,1,2,1,2],[4,2,1,1,1,2],[4,2,1,2,1,1],[2,1,2,1,4,1],
  [2,1,4,1,2,1],[4,1,2,1,2,1],[1,1,1,1,4,3],[1,1,1,3,4,1],[1,3,1,1,4,1],
  [1,1,4,1,1,3],[1,1,4,3,1,1],[4,1,1,1,1,3],[4,1,1,3,1,1],[1,1,3,1,4,1],
  [1,1,4,1,3,1],[3,1,1,1,4,1],[4,1,1,1,3,1],[2,1,1,4,1,2],[2,1,1,2,1,4],
  [2,1,1,2,3,2],[2,3,3,1,1,1,2],
];

function encodeCode128(text: string): number[] {
  const codes: number[] = [CODE128_START_B];
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i) - 32;
    if (code < 0 || code > 95) continue;
    codes.push(code);
  }

  // Calculate checksum
  let checksum = codes[0];
  for (let i = 1; i < codes.length; i++) {
    checksum += codes[i] * i;
  }
  checksum = checksum % 103;
  codes.push(checksum);
  codes.push(CODE128_STOP);

  // Convert to bar widths
  const bars: number[] = [];
  for (const code of codes) {
    const pattern = CODE128_PATTERNS[code];
    if (pattern) bars.push(...pattern);
  }
  return bars;
}

// ---- EAN-13 Encoding ----
const EAN_ENCODINGS_L = [
  "0001101","0011001","0010011","0111101","0100011",
  "0110001","0101111","0111011","0110111","0001011",
];
const EAN_ENCODINGS_G = [
  "0100111","0110011","0011011","0100001","0011101",
  "0111001","0000101","0010001","0001001","0010111",
];
const EAN_ENCODINGS_R = [
  "1110010","1100110","1101100","1000010","1011100",
  "1001110","1010000","1000100","1001000","1110100",
];
const EAN_PARITY_PATTERNS = [
  "LLLLLL","LLGLGG","LLGGLG","LLGGGL","LGLLGG",
  "LGGLLG","LGGGLL","LGLGLG","LGLGGL","LGGLGL",
];

function calculateEAN13Check(digits: number[]): number {
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += digits[i] * (i % 2 === 0 ? 1 : 3);
  }
  return (10 - (sum % 10)) % 10;
}

function encodeEAN13(text: string): { bars: string; digits: string } | null {
  const cleaned = text.replace(/\D/g, "");
  if (cleaned.length < 12 || cleaned.length > 13) return null;

  const digits = cleaned.slice(0, 12).split("").map(Number);
  const check = calculateEAN13Check(digits);
  if (cleaned.length === 13 && Number(cleaned[12]) !== check) return null;
  digits.push(check);

  const parityPattern = EAN_PARITY_PATTERNS[digits[0]];
  let bars = "101"; // Start guard

  for (let i = 1; i <= 6; i++) {
    const encoding = parityPattern[i - 1] === "L" ? EAN_ENCODINGS_L : EAN_ENCODINGS_G;
    bars += encoding[digits[i]];
  }

  bars += "01010"; // Center guard

  for (let i = 7; i <= 12; i++) {
    bars += EAN_ENCODINGS_R[digits[i]];
  }

  bars += "101"; // End guard

  return { bars, digits: digits.join("") };
}

// ---- UPC-A Encoding ----
function calculateUPCACheck(digits: number[]): number {
  let sum = 0;
  for (let i = 0; i < 11; i++) {
    sum += digits[i] * (i % 2 === 0 ? 3 : 1);
  }
  return (10 - (sum % 10)) % 10;
}

function encodeUPCA(text: string): { bars: string; digits: string } | null {
  const cleaned = text.replace(/\D/g, "");
  if (cleaned.length < 11 || cleaned.length > 12) return null;

  const digits = cleaned.slice(0, 11).split("").map(Number);
  const check = calculateUPCACheck(digits);
  if (cleaned.length === 12 && Number(cleaned[11]) !== check) return null;
  digits.push(check);

  let bars = "101"; // Start guard

  for (let i = 0; i < 6; i++) {
    bars += EAN_ENCODINGS_L[digits[i]];
  }

  bars += "01010"; // Center guard

  for (let i = 6; i < 12; i++) {
    bars += EAN_ENCODINGS_R[digits[i]];
  }

  bars += "101"; // End guard

  return { bars, digits: digits.join("") };
}

// ---- Canvas Rendering ----
function drawCode128(
  ctx: CanvasRenderingContext2D,
  text: string,
  width: number,
  height: number,
  fgColor: string,
  bgColor: string,
  showText: boolean
) {
  const bars = encodeCode128(text);
  const totalUnits = bars.reduce((a, b) => a + b, 0);
  const margin = 20;
  const textHeight = showText ? 24 : 0;
  const barHeight = height - margin * 2 - textHeight;
  const unitWidth = (width - margin * 2) / totalUnits;

  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, width, height);

  let x = margin;
  let isBar = true;
  for (const w of bars) {
    if (isBar) {
      ctx.fillStyle = fgColor;
      ctx.fillRect(x, margin, w * unitWidth, barHeight);
    }
    x += w * unitWidth;
    isBar = !isBar;
  }

  if (showText) {
    ctx.fillStyle = fgColor;
    ctx.font = "14px monospace";
    ctx.textAlign = "center";
    ctx.fillText(text, width / 2, height - margin + 2);
  }
}

function drawEANBars(
  ctx: CanvasRenderingContext2D,
  barsStr: string,
  digits: string,
  width: number,
  height: number,
  fgColor: string,
  bgColor: string,
  showText: boolean,
  isUPCA: boolean
) {
  const margin = 20;
  const textHeight = showText ? 20 : 0;
  const barHeight = height - margin * 2 - textHeight;
  const guardExtend = showText ? 8 : 0;
  const barWidth = (width - margin * 2) / barsStr.length;

  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, width, height);

  // Draw bars
  for (let i = 0; i < barsStr.length; i++) {
    if (barsStr[i] === "1") {
      const isGuard =
        i < 3 || i >= barsStr.length - 3 ||
        (i >= 45 && i < 50 && !isUPCA) ||
        (i >= 45 && i < 50 && isUPCA);
      ctx.fillStyle = fgColor;
      ctx.fillRect(
        margin + i * barWidth,
        margin,
        barWidth,
        barHeight + (isGuard ? guardExtend : 0)
      );
    }
  }

  if (showText) {
    ctx.fillStyle = fgColor;
    ctx.font = "12px monospace";
    ctx.textAlign = "center";

    if (isUPCA) {
      // First digit
      ctx.textAlign = "right";
      ctx.fillText(digits[0], margin - 2, height - margin + 4);
      // Left half
      ctx.textAlign = "center";
      const leftStart = margin + 3 * barWidth;
      const leftWidth = 42 * barWidth;
      ctx.fillText(digits.slice(1, 6), leftStart + leftWidth / 2, height - margin + 4);
      // Right half
      const rightStart = margin + 50 * barWidth;
      const rightWidth = 42 * barWidth;
      ctx.fillText(digits.slice(6, 11), rightStart + rightWidth / 2, height - margin + 4);
      // Check digit
      ctx.textAlign = "left";
      ctx.fillText(digits[11], margin + barsStr.length * barWidth + 2, height - margin + 4);
    } else {
      // EAN-13: first digit outside, rest below bars
      ctx.textAlign = "right";
      ctx.fillText(digits[0], margin - 2, height - margin + 4);
      ctx.textAlign = "center";
      const leftStart = margin + 3 * barWidth;
      const leftWidth = 42 * barWidth;
      ctx.fillText(digits.slice(1, 7), leftStart + leftWidth / 2, height - margin + 4);
      const rightStart = margin + 50 * barWidth;
      const rightWidth = 42 * barWidth;
      ctx.fillText(digits.slice(7, 13), rightStart + rightWidth / 2, height - margin + 4);
    }
  }
}

// ---- Component ----
export default function BarcodeGeneratorPage() {
  const [text, setText] = useState("");
  const [format, setFormat] = useState<BarcodeFormat>("code128");
  const [width, setWidth] = useState(400);
  const [height, setHeight] = useState(150);
  const [fgColor, setFgColor] = useState("#000000");
  const [bgColor, setBgColor] = useState("#ffffff");
  const [showText, setShowText] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const getPlaceholder = useCallback(() => {
    switch (format) {
      case "code128": return "Enter any text (e.g. ABC-12345)";
      case "ean13": return "Enter 12 or 13 digits";
      case "upca": return "Enter 11 or 12 digits";
    }
  }, [format]);

  const getMaxLength = useCallback(() => {
    switch (format) {
      case "code128": return 80;
      case "ean13": return 13;
      case "upca": return 12;
    }
  }, [format]);

  const validateInput = useCallback((value: string): string | null => {
    if (!value.trim()) return null;
    switch (format) {
      case "code128": {
        for (let i = 0; i < value.length; i++) {
          const code = value.charCodeAt(i);
          if (code < 32 || code > 126) return `Invalid character at position ${i + 1}. Code 128 supports ASCII 32-126.`;
        }
        return null;
      }
      case "ean13": {
        const cleaned = value.replace(/\D/g, "");
        if (cleaned.length < 12) return "EAN-13 requires 12 or 13 digits.";
        if (cleaned.length > 13) return "EAN-13 cannot exceed 13 digits.";
        if (cleaned.length === 13) {
          const digits = cleaned.split("").map(Number);
          const check = calculateEAN13Check(digits);
          if (digits[12] !== check) return `Invalid check digit. Expected ${check}, got ${digits[12]}.`;
        }
        return null;
      }
      case "upca": {
        const cleaned = value.replace(/\D/g, "");
        if (cleaned.length < 11) return "UPC-A requires 11 or 12 digits.";
        if (cleaned.length > 12) return "UPC-A cannot exceed 12 digits.";
        if (cleaned.length === 12) {
          const digits = cleaned.split("").map(Number);
          const check = calculateUPCACheck(digits);
          if (digits[11] !== check) return `Invalid check digit. Expected ${check}, got ${digits[11]}.`;
        }
        return null;
      }
    }
  }, [format]);

  const drawBarcode = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = width;
    canvas.height = height;

    if (!text.trim()) {
      ctx.fillStyle = "#1e293b";
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = "#475569";
      ctx.font = "14px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("Barcode will appear here", width / 2, height / 2);
      setError(null);
      return;
    }

    const validationError = validateInput(text);
    if (validationError) {
      ctx.fillStyle = "#1e293b";
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = "#ef4444";
      ctx.font = "13px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(validationError, width / 2, height / 2);
      setError(validationError);
      return;
    }

    setError(null);

    switch (format) {
      case "code128":
        drawCode128(ctx, text, width, height, fgColor, bgColor, showText);
        break;
      case "ean13": {
        const result = encodeEAN13(text);
        if (result) {
          drawEANBars(ctx, result.bars, result.digits, width, height, fgColor, bgColor, showText, false);
        }
        break;
      }
      case "upca": {
        const result = encodeUPCA(text);
        if (result) {
          drawEANBars(ctx, result.bars, result.digits, width, height, fgColor, bgColor, showText, true);
        }
        break;
      }
    }
  }, [text, format, width, height, fgColor, bgColor, showText, validateInput]);

  useEffect(() => {
    drawBarcode();
  }, [drawBarcode]);

  const downloadBarcode = useCallback(
    (imgFormat: "png" | "svg") => {
      const canvas = canvasRef.current;
      if (!canvas || !text.trim() || error) return;

      if (imgFormat === "png") {
        const link = document.createElement("a");
        link.download = `barcode-${format}.png`;
        link.href = canvas.toDataURL("image/png");
        link.click();
      } else {
        // Simple SVG export from canvas
        const dataUrl = canvas.toDataURL("image/png");
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
  <image href="${dataUrl}" width="${width}" height="${height}"/>
</svg>`;
        const blob = new Blob([svg], { type: "image/svg+xml" });
        const link = document.createElement("a");
        link.download = `barcode-${format}.svg`;
        link.href = URL.createObjectURL(blob);
        link.click();
        URL.revokeObjectURL(link.href);
      }
    },
    [text, format, width, height, error]
  );

  const copyBarcode = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas || !text.trim() || error) return;
    try {
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/png")
      );
      if (blob) {
        await navigator.clipboard.write([
          new ClipboardItem({ "image/png": blob }),
        ]);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      setError("Copy to clipboard not supported in this browser");
    }
  }, [text, error]);

  const loadSample = useCallback((sampleFormat: BarcodeFormat) => {
    setFormat(sampleFormat);
    switch (sampleFormat) {
      case "code128": setText("ABC-12345"); break;
      case "ean13": setText("5901234123457"); break;
      case "upca": setText("012345678905"); break;
    }
  }, []);

  return (
    <>
      <title>Barcode Generator - Free Online Tool | DevTools Hub</title>
      <meta
        name="description"
        content="Generate barcodes online for free. Create Code 128, EAN-13, and UPC-A barcodes. Customize size and colors. Download as PNG. All processing in your browser."
      />
      <JsonLd
        data={[
          generateWebAppSchema({
            slug: "barcode-generator",
            name: "Barcode Generator",
            description: "Generate barcodes in Code128, EAN-13, UPC-A, and more formats — download as PNG or SVG",
            category: "developer",
          }),
          generateBreadcrumbSchema({
            slug: "barcode-generator",
            name: "Barcode Generator",
            description: "Generate barcodes in Code128, EAN-13, UPC-A, and more formats — download as PNG or SVG",
            category: "developer",
          }),
          generateFAQSchema([
            { question: "What is the difference between Code 128, EAN-13, and UPC-A?", answer: "Code 128 is a versatile barcode that encodes any ASCII character and is commonly used in logistics and shipping. EAN-13 is the international standard for retail products, encoding 13 digits. UPC-A is the North American retail standard, encoding 12 digits. EAN-13 is a superset of UPC-A (a UPC-A code is an EAN-13 with a leading zero)." },
            { question: "What is a check digit?", answer: "A check digit is the last digit of EAN-13 and UPC-A barcodes, calculated from the other digits using a weighted sum algorithm. It helps scanners detect read errors. This tool automatically calculates the check digit if you provide only the data digits (12 for EAN-13, 11 for UPC-A)." },
            { question: "Can I scan these barcodes with a real scanner?", answer: "Yes. The barcodes generated by this tool follow the official encoding standards and can be read by any standard barcode scanner. For best results, download at a larger size and ensure sufficient contrast between bar and background colors." },
            { question: "Is my data safe?", answer: "Yes. All barcode generation happens entirely in your browser using JavaScript and the Canvas API. No data is sent to any server. Your input never leaves your device." },
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
              <li><span className="mx-1">/</span></li>
              <li>
                <a href="/tools" className="hover:text-white transition-colors">
                  Developer Tools
                </a>
              </li>
              <li><span className="mx-1">/</span></li>
              <li className="text-slate-200">Barcode Generator</li>
            </ol>
          </nav>

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
              Barcode Generator
            </h1>
            <p className="text-slate-400 max-w-2xl text-lg">
              Generate barcodes from text and numbers. Supports Code 128
              (alphanumeric), EAN-13 (retail), and UPC-A (US retail). Customize
              size and colors, then download as PNG. Everything runs in your
              browser.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Input Panel */}
            <div>
              {/* Format Selection */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Barcode Format
                </label>
                <div className="flex flex-wrap gap-2">
                  {(
                    [
                      { value: "code128", label: "Code 128", desc: "Alphanumeric" },
                      { value: "ean13", label: "EAN-13", desc: "13-digit retail" },
                      { value: "upca", label: "UPC-A", desc: "12-digit US retail" },
                    ] as const
                  ).map((f) => (
                    <button
                      key={f.value}
                      onClick={() => { setFormat(f.value); setText(""); }}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${
                        format === f.value
                          ? "bg-blue-600 border-blue-500 text-white"
                          : "bg-slate-800 border-slate-600 text-slate-300 hover:border-blue-500"
                      }`}
                    >
                      {f.label}
                      <span className="block text-xs opacity-60">{f.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Text Input */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-slate-300">
                    Content
                  </label>
                  <span className="text-xs text-slate-500">
                    {text.length} / {getMaxLength()}
                  </span>
                </div>
                <input
                  type="text"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder={getPlaceholder()}
                  className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-3 font-mono text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  spellCheck={false}
                  maxLength={getMaxLength()}
                />
              </div>

              {/* Quick Samples */}
              <div className="mb-6">
                <label className="text-sm font-medium text-slate-300 mb-2 block">
                  Quick Samples
                </label>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => loadSample("code128")}
                    className="px-3 py-1.5 text-xs bg-slate-800 border border-slate-600 hover:border-blue-500 text-slate-300 hover:text-white rounded-lg transition-colors"
                  >
                    Code 128: ABC-12345
                  </button>
                  <button
                    onClick={() => loadSample("ean13")}
                    className="px-3 py-1.5 text-xs bg-slate-800 border border-slate-600 hover:border-blue-500 text-slate-300 hover:text-white rounded-lg transition-colors"
                  >
                    EAN-13: 5901234123457
                  </button>
                  <button
                    onClick={() => loadSample("upca")}
                    className="px-3 py-1.5 text-xs bg-slate-800 border border-slate-600 hover:border-blue-500 text-slate-300 hover:text-white rounded-lg transition-colors"
                  >
                    UPC-A: 012345678905
                  </button>
                </div>
              </div>

              {/* Settings */}
              <div className="space-y-4 mb-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-slate-300 mb-2 block">
                      Width: {width}px
                    </label>
                    <input
                      type="range"
                      min={200}
                      max={600}
                      step={20}
                      value={width}
                      onChange={(e) => setWidth(Number(e.target.value))}
                      className="w-full accent-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-300 mb-2 block">
                      Height: {height}px
                    </label>
                    <input
                      type="range"
                      min={80}
                      max={300}
                      step={10}
                      value={height}
                      onChange={(e) => setHeight(Number(e.target.value))}
                      className="w-full accent-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-slate-300 mb-2 block">
                      Bar Color
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={fgColor}
                        onChange={(e) => setFgColor(e.target.value)}
                        className="w-10 h-10 rounded border border-slate-600 cursor-pointer bg-transparent"
                      />
                      <input
                        type="text"
                        value={fgColor}
                        onChange={(e) => setFgColor(e.target.value)}
                        className="flex-1 bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 font-mono text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-300 mb-2 block">
                      Background
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={bgColor}
                        onChange={(e) => setBgColor(e.target.value)}
                        className="w-10 h-10 rounded border border-slate-600 cursor-pointer bg-transparent"
                      />
                      <input
                        type="text"
                        value={bgColor}
                        onChange={(e) => setBgColor(e.target.value)}
                        className="flex-1 bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 font-mono text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>

                <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showText}
                    onChange={(e) => setShowText(e.target.checked)}
                    className="w-4 h-4 rounded bg-slate-700 border-slate-600 text-blue-500 focus:ring-blue-500"
                  />
                  Show text below barcode
                </label>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => downloadBarcode("png")}
                  disabled={!text.trim() || !!error}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Download PNG
                </button>
                <button
                  onClick={copyBarcode}
                  disabled={!text.trim() || !!error}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {copied ? "Copied!" : "Copy to Clipboard"}
                </button>
                <button
                  onClick={() => {
                    setText("");
                    setFgColor("#000000");
                    setBgColor("#ffffff");
                    setWidth(400);
                    setHeight(150);
                    setShowText(true);
                  }}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors"
                >
                  Clear
                </button>
              </div>
            </div>

            {/* Preview Panel */}
            <div className="flex flex-col items-center">
              <label className="text-sm font-medium text-slate-300 mb-4 self-start">
                Preview
              </label>
              <div className="bg-white rounded-xl p-6 shadow-lg">
                <canvas
                  ref={canvasRef}
                  width={width}
                  height={height}
                  className="block max-w-full h-auto"
                />
              </div>
              {text.trim() && !error && (
                <p className="text-xs text-slate-500 mt-3">
                  {width}x{height}px &bull; {format === "code128" ? "Code 128" : format === "ean13" ? "EAN-13" : "UPC-A"} &bull; {text.length} chars
                </p>
              )}
            </div>
          </div>

          {/* Format Info */}
          <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                title: "Code 128",
                desc: "Encodes all 128 ASCII characters. Used in shipping labels, inventory management, and logistics. Variable length.",
                chars: "ASCII 32-126",
              },
              {
                title: "EAN-13",
                desc: "International standard for retail products. 13 digits including check digit. Used worldwide except North America.",
                chars: "12-13 digits",
              },
              {
                title: "UPC-A",
                desc: "Standard barcode for retail products in the United States and Canada. 12 digits including check digit.",
                chars: "11-12 digits",
              },
            ].map((info) => (
              <div
                key={info.title}
                className="bg-slate-800 border border-slate-700 rounded-lg p-4"
              >
                <h3 className="text-sm font-semibold text-white mb-1">
                  {info.title}
                </h3>
                <p className="text-xs text-slate-400 mb-2">{info.desc}</p>
                <span className="text-xs text-slate-500">Input: {info.chars}</span>
              </div>
            ))}
          </div>

          <RelatedTools currentSlug="barcode-generator" />

          {/* FAQ Section */}
          <section className="mt-16 border-t border-slate-700 pt-10">
            <h2 className="text-2xl font-bold text-white mb-6">
              Frequently Asked Questions
            </h2>

            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  What is the difference between Code 128, EAN-13, and UPC-A?
                </h3>
                <p className="text-slate-400">
                  Code 128 is a versatile barcode that encodes any ASCII character
                  and is commonly used in logistics and shipping. EAN-13 is the
                  international standard for retail products, encoding 13 digits.
                  UPC-A is the North American retail standard, encoding 12 digits.
                  EAN-13 is a superset of UPC-A (a UPC-A code is an EAN-13 with a
                  leading zero).
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  What is a check digit?
                </h3>
                <p className="text-slate-400">
                  A check digit is the last digit of EAN-13 and UPC-A barcodes,
                  calculated from the other digits using a weighted sum algorithm.
                  It helps scanners detect read errors. This tool automatically
                  calculates the check digit if you provide only the data digits
                  (12 for EAN-13, 11 for UPC-A).
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Can I scan these barcodes with a real scanner?
                </h3>
                <p className="text-slate-400">
                  Yes. The barcodes generated by this tool follow the official
                  encoding standards and can be read by any standard barcode
                  scanner. For best results, download at a larger size and ensure
                  sufficient contrast between bar and background colors.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Is my data safe?
                </h3>
                <p className="text-slate-400">
                  Yes. All barcode generation happens entirely in your browser
                  using JavaScript and the Canvas API. No data is sent to any
                  server. Your input never leaves your device.
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
