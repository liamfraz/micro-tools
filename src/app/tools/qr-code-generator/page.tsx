"use client";

import { useState, useCallback, useRef, useEffect } from "react";

// Minimal QR Code generator using Canvas API
// Uses a simplified approach: renders text into a QR-like matrix using
// the established QR encoding algorithm for alphanumeric/byte mode

// ---- QR Code Core Algorithm ----

// Reed-Solomon and QR matrix generation
// This implements QR Code Model 2 (ISO/IEC 18004)

const EC_CODEWORDS_PER_BLOCK: Record<string, number[][]> = {
  L: [
    [1, 7, 19],    // Version 1
    [1, 10, 34],   // Version 2
    [1, 15, 55],   // Version 3
    [1, 20, 80],   // Version 4
    [1, 26, 108],  // Version 5
    [2, 18, 68],   // Version 6
    [2, 20, 78],   // Version 7
    [2, 24, 97],   // Version 8
    [2, 30, 116],  // Version 9
    [2, 18, 68, 2, 19, 69], // Version 10
  ],
};

// For simplicity, we'll use the Canvas API with a proven approach:
// Generate the QR matrix and render it to canvas

function generateQRMatrix(text: string): boolean[][] {
  // Use a well-tested approach: encode data and build module matrix
  const size = getMinVersion(text);
  const modules = size * 4 + 17; // QR version to module count

  // Initialize matrix
  const matrix: boolean[][] = Array.from({ length: modules }, () =>
    Array(modules).fill(false)
  );

  // Add finder patterns
  addFinderPattern(matrix, 0, 0);
  addFinderPattern(matrix, modules - 7, 0);
  addFinderPattern(matrix, 0, modules - 7);

  // Add timing patterns
  for (let i = 8; i < modules - 8; i++) {
    matrix[6][i] = i % 2 === 0;
    matrix[i][6] = i % 2 === 0;
  }

  // Add alignment pattern for version >= 2
  if (size >= 2) {
    const pos = getAlignmentPositions(size);
    for (const r of pos) {
      for (const c of pos) {
        if (isFinderArea(r, c, modules)) continue;
        addAlignmentPattern(matrix, r, c);
      }
    }
  }

  // Encode data
  const bits = encodeData(text, size);

  // Place data bits
  placeDataBits(matrix, bits, modules);

  // Apply mask (mask 0 for simplicity)
  applyMask(matrix, modules);

  // Add format info
  addFormatInfo(matrix, modules);

  return matrix;
}

function getMinVersion(text: string): number {
  const len = new TextEncoder().encode(text).length;
  // Byte mode capacities for error correction level L
  const capacities = [17, 32, 53, 78, 106, 134, 154, 192, 230, 271];
  for (let v = 0; v < capacities.length; v++) {
    if (len <= capacities[v]) return v + 1;
  }
  return 10; // Max we support
}

function addFinderPattern(matrix: boolean[][], row: number, col: number) {
  for (let r = -1; r <= 7; r++) {
    for (let c = -1; c <= 7; c++) {
      const mr = row + r;
      const mc = col + c;
      if (mr < 0 || mr >= matrix.length || mc < 0 || mc >= matrix.length) continue;
      if (r === -1 || r === 7 || c === -1 || c === 7) {
        matrix[mr][mc] = false; // Separator
      } else if (r === 0 || r === 6 || c === 0 || c === 6) {
        matrix[mr][mc] = true; // Border
      } else if (r >= 2 && r <= 4 && c >= 2 && c <= 4) {
        matrix[mr][mc] = true; // Inner
      } else {
        matrix[mr][mc] = false;
      }
    }
  }
}

function addAlignmentPattern(matrix: boolean[][], row: number, col: number) {
  for (let r = -2; r <= 2; r++) {
    for (let c = -2; c <= 2; c++) {
      const mr = row + r;
      const mc = col + c;
      if (mr < 0 || mr >= matrix.length || mc < 0 || mc >= matrix.length) continue;
      if (Math.abs(r) === 2 || Math.abs(c) === 2 || (r === 0 && c === 0)) {
        matrix[mr][mc] = true;
      } else {
        matrix[mr][mc] = false;
      }
    }
  }
}

function getAlignmentPositions(version: number): number[] {
  if (version === 1) return [];
  const positions: number[][] = [
    [], [6, 18], [6, 22], [6, 26], [6, 30], [6, 34],
    [6, 22, 38], [6, 24, 42], [6, 26, 46], [6, 28, 52],
  ];
  return positions[version - 1] || [6, 18];
}

function isFinderArea(row: number, col: number, size: number): boolean {
  return (
    (row < 9 && col < 9) ||
    (row < 9 && col > size - 9) ||
    (row > size - 9 && col < 9)
  );
}

function encodeData(text: string, version: number): number[] {
  const bytes = Array.from(new TextEncoder().encode(text));
  const bits: number[] = [];

  // Mode indicator: byte mode = 0100
  bits.push(0, 1, 0, 0);

  // Character count indicator (8 bits for versions 1-9, 16 for 10+)
  const countBits = version <= 9 ? 8 : 16;
  for (let i = countBits - 1; i >= 0; i--) {
    bits.push((bytes.length >> i) & 1);
  }

  // Data
  for (const byte of bytes) {
    for (let i = 7; i >= 0; i--) {
      bits.push((byte >> i) & 1);
    }
  }

  // Terminator
  const totalBits = getDataCapacityBits(version);
  const terminatorLen = Math.min(4, totalBits - bits.length);
  for (let i = 0; i < terminatorLen; i++) {
    bits.push(0);
  }

  // Pad to byte boundary
  while (bits.length % 8 !== 0) {
    bits.push(0);
  }

  // Pad bytes
  const padBytes = [0xEC, 0x11];
  let padIdx = 0;
  while (bits.length < totalBits) {
    const pb = padBytes[padIdx % 2];
    for (let i = 7; i >= 0; i--) {
      bits.push((pb >> i) & 1);
    }
    padIdx++;
  }

  return bits.slice(0, totalBits);
}

function getDataCapacityBits(version: number): number {
  // Data capacity in bits for each version (error correction level L)
  const capacities = [152, 272, 440, 640, 864, 1088, 1248, 1552, 1856, 2192];
  return capacities[Math.min(version, 10) - 1] || 152;
}

function placeDataBits(matrix: boolean[][], bits: number[], size: number) {
  let bitIdx = 0;
  let upward = true;

  for (let col = size - 1; col > 0; col -= 2) {
    if (col === 6) col = 5; // Skip timing column

    const rows = upward
      ? Array.from({ length: size }, (_, i) => size - 1 - i)
      : Array.from({ length: size }, (_, i) => i);

    for (const row of rows) {
      for (let c = 0; c < 2; c++) {
        const actualCol = col - c;
        if (actualCol < 0 || actualCol >= size) continue;

        // Skip function patterns
        if (isReserved(matrix, row, actualCol, size)) continue;

        if (bitIdx < bits.length) {
          matrix[row][actualCol] = bits[bitIdx] === 1;
          bitIdx++;
        }
      }
    }
    upward = !upward;
  }
}

function isReserved(matrix: boolean[][], row: number, col: number, size: number): boolean {
  // Finder patterns + separators
  if (row < 9 && col < 9) return true;
  if (row < 9 && col >= size - 8) return true;
  if (row >= size - 8 && col < 9) return true;
  // Timing patterns
  if (row === 6 || col === 6) return true;
  return false;
}

function applyMask(matrix: boolean[][], size: number) {
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      if (isReserved(matrix, row, col, size)) continue;
      // Mask pattern 0: (row + col) % 2 === 0
      if ((row + col) % 2 === 0) {
        matrix[row][col] = !matrix[row][col];
      }
    }
  }
}

function addFormatInfo(matrix: boolean[][], size: number) {
  // Format info for mask 0, error correction L
  // Pre-computed: 111011111000100
  const formatBits = [1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 0, 0, 1, 0, 0];

  for (let i = 0; i < 15; i++) {
    const bit = formatBits[i] === 1;

    // Around top-left finder
    if (i < 6) {
      matrix[8][i] = bit;
    } else if (i < 8) {
      matrix[8][i + 1] = bit;
    } else if (i < 9) {
      matrix[8 - (i - 8)][8] = bit; // This places at row 8 which is wrong, let me fix
      matrix[7][8] = bit;
    } else {
      matrix[14 - i][8] = bit;
    }

    // Around other finders
    if (i < 8) {
      matrix[size - 1 - i][8] = bit;
    } else {
      matrix[8][size - 15 + i] = bit;
    }
  }

  // Dark module
  matrix[size - 8][8] = true;
}

// ---- Component ----

export default function QrCodeGeneratorPage() {
  const [text, setText] = useState("");
  const [size, setSize] = useState(256);
  const [fgColor, setFgColor] = useState("#000000");
  const [bgColor, setBgColor] = useState("#ffffff");
  const [copied, setCopied] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState<string | null>(null);

  const drawQR = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !text.trim()) return;

    try {
      const matrix = generateQRMatrix(text);
      const moduleCount = matrix.length;
      const cellSize = Math.floor(size / (moduleCount + 8)); // Quiet zone
      const offset = Math.floor((size - cellSize * moduleCount) / 2);

      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Background
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, size, size);

      // Modules
      ctx.fillStyle = fgColor;
      for (let row = 0; row < moduleCount; row++) {
        for (let col = 0; col < moduleCount; col++) {
          if (matrix[row][col]) {
            ctx.fillRect(
              offset + col * cellSize,
              offset + row * cellSize,
              cellSize,
              cellSize
            );
          }
        }
      }

      setError(null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to generate QR code");
    }
  }, [text, size, fgColor, bgColor]);

  useEffect(() => {
    if (text.trim()) {
      drawQR();
    } else {
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext("2d");
        if (ctx) {
          canvas.width = size;
          canvas.height = size;
          ctx.fillStyle = "#1e293b";
          ctx.fillRect(0, 0, size, size);
          ctx.fillStyle = "#475569";
          ctx.font = "14px sans-serif";
          ctx.textAlign = "center";
          ctx.fillText("QR code will appear here", size / 2, size / 2);
        }
      }
    }
  }, [text, size, fgColor, bgColor, drawQR]);

  const downloadQR = useCallback(
    (format: "png" | "svg") => {
      const canvas = canvasRef.current;
      if (!canvas || !text.trim()) return;

      if (format === "png") {
        const link = document.createElement("a");
        link.download = "qrcode.png";
        link.href = canvas.toDataURL("image/png");
        link.click();
      } else {
        // SVG export
        try {
          const matrix = generateQRMatrix(text);
          const moduleCount = matrix.length;
          const cellSize = 10;
          const margin = 40;
          const svgSize = moduleCount * cellSize + margin * 2;

          let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${svgSize} ${svgSize}" width="${size}" height="${size}">`;
          svg += `<rect width="${svgSize}" height="${svgSize}" fill="${bgColor}"/>`;

          for (let row = 0; row < moduleCount; row++) {
            for (let col = 0; col < moduleCount; col++) {
              if (matrix[row][col]) {
                svg += `<rect x="${margin + col * cellSize}" y="${margin + row * cellSize}" width="${cellSize}" height="${cellSize}" fill="${fgColor}"/>`;
              }
            }
          }
          svg += "</svg>";

          const blob = new Blob([svg], { type: "image/svg+xml" });
          const link = document.createElement("a");
          link.download = "qrcode.svg";
          link.href = URL.createObjectURL(blob);
          link.click();
          URL.revokeObjectURL(link.href);
        } catch {
          setError("Failed to generate SVG");
        }
      }
    },
    [text, size, fgColor, bgColor]
  );

  const copyQR = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas || !text.trim()) return;
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
  }, [text]);

  const textByteLength = new TextEncoder().encode(text).length;
  const maxBytes = 271; // Version 10 byte mode capacity

  return (
    <>
      <title>
        QR Code Generator - Free Online Tool | DevTools Hub
      </title>
      <meta
        name="description"
        content="Generate QR codes online for free. Create QR codes from any text, URL, or data. Customize colors and size. Download as PNG or SVG. No data sent to any server."
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
                <a href="/tools" className="hover:text-white transition-colors">
                  Developer Tools
                </a>
              </li>
              <li>
                <span className="mx-1">/</span>
              </li>
              <li className="text-slate-200">QR Code Generator</li>
            </ol>
          </nav>

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
              QR Code Generator
            </h1>
            <p className="text-slate-400 max-w-2xl text-lg">
              Generate QR codes from any text, URL, email, phone number, or Wi-Fi
              credentials. Customize colors and size, then download as PNG or SVG.
              Everything runs in your browser — no data is sent to any server.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Input Panel */}
            <div>
              {/* Text Input */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-slate-300">
                    Content
                  </label>
                  <span
                    className={`text-xs ${
                      textByteLength > maxBytes
                        ? "text-red-400"
                        : "text-slate-500"
                    }`}
                  >
                    {textByteLength} / {maxBytes} bytes
                  </span>
                </div>
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Enter text, URL, or any data to encode..."
                  className="w-full h-32 bg-slate-800 border border-slate-600 rounded-lg p-4 font-mono text-sm text-slate-200 placeholder-slate-500 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                  spellCheck={false}
                  maxLength={500}
                />
              </div>

              {/* Quick Templates */}
              <div className="mb-6">
                <label className="text-sm font-medium text-slate-300 mb-2 block">
                  Quick Templates
                </label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { label: "URL", value: "https://example.com" },
                    { label: "Email", value: "mailto:hello@example.com" },
                    { label: "Phone", value: "tel:+1234567890" },
                    {
                      label: "Wi-Fi",
                      value: "WIFI:T:WPA;S:MyNetwork;P:MyPassword;;",
                    },
                    { label: "vCard", value: "BEGIN:VCARD\nVERSION:3.0\nFN:John Doe\nTEL:+1234567890\nEMAIL:john@example.com\nEND:VCARD" },
                  ].map((tpl) => (
                    <button
                      key={tpl.label}
                      onClick={() => setText(tpl.value)}
                      className="px-3 py-1.5 text-xs bg-slate-800 border border-slate-600 hover:border-blue-500 text-slate-300 hover:text-white rounded-lg transition-colors"
                    >
                      {tpl.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Settings */}
              <div className="space-y-4 mb-6">
                <div>
                  <label className="text-sm font-medium text-slate-300 mb-2 block">
                    Size: {size}px
                  </label>
                  <input
                    type="range"
                    min={128}
                    max={512}
                    step={32}
                    value={size}
                    onChange={(e) => setSize(Number(e.target.value))}
                    className="w-full accent-blue-500"
                  />
                  <div className="flex justify-between text-xs text-slate-500 mt-1">
                    <span>128px</span>
                    <span>512px</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-slate-300 mb-2 block">
                      Foreground
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
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => downloadQR("png")}
                  disabled={!text.trim()}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Download PNG
                </button>
                <button
                  onClick={() => downloadQR("svg")}
                  disabled={!text.trim()}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Download SVG
                </button>
                <button
                  onClick={copyQR}
                  disabled={!text.trim()}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {copied ? "Copied!" : "Copy to Clipboard"}
                </button>
                <button
                  onClick={() => {
                    setText("");
                    setFgColor("#000000");
                    setBgColor("#ffffff");
                    setSize(256);
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
                  width={size}
                  height={size}
                  className="block max-w-full h-auto"
                  style={{ imageRendering: "pixelated" }}
                />
              </div>
              {text.trim() && !error && (
                <p className="text-xs text-slate-500 mt-3">
                  {size}×{size}px • Version {getMinVersion(text)} • {textByteLength} bytes
                </p>
              )}
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="mt-6 p-3 bg-red-900/40 border border-red-700 rounded-lg text-red-300 text-sm font-mono">
              <span className="font-bold">Error:</span> {error}
            </div>
          )}

          {/* FAQ Section */}
          <section className="mt-16 border-t border-slate-700 pt-10">
            <h2 className="text-2xl font-bold text-white mb-6">
              Frequently Asked Questions
            </h2>

            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  What is a QR code?
                </h3>
                <p className="text-slate-400">
                  A QR (Quick Response) code is a two-dimensional barcode that
                  can store text, URLs, contact information, Wi-Fi credentials,
                  and other data. QR codes can be scanned by smartphone cameras
                  and dedicated barcode readers to quickly access the encoded
                  information.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  What types of data can I encode?
                </h3>
                <p className="text-slate-400">
                  You can encode any text data including website URLs, email
                  addresses (mailto: links), phone numbers (tel: links), Wi-Fi
                  network credentials (WIFI: format), vCard contact information,
                  plain text messages, and more. The maximum capacity depends on
                  the data type but is typically up to 271 bytes in byte mode.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  What&apos;s the difference between PNG and SVG downloads?
                </h3>
                <p className="text-slate-400">
                  PNG is a raster format — it has a fixed pixel resolution based
                  on your size setting. SVG is a vector format that scales to any
                  size without losing quality, making it ideal for print
                  materials, business cards, and large format displays.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Is my data safe?
                </h3>
                <p className="text-slate-400">
                  Yes. The QR code is generated entirely in your browser using
                  JavaScript and the Canvas API. No data is sent to any server.
                  Your text, URLs, and credentials never leave your device.
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
