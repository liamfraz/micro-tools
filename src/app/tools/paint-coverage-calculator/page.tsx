"use client";

import { useState, useMemo } from "react";
import JsonLd from "@/components/JsonLd";
import RelatedTools from "@/components/RelatedTools";
import ToolBreadcrumb from "@/components/ToolBreadcrumb";
import {
  generateFAQSchema,
  generateWebAppSchema,
  generateBreadcrumbSchema,
} from "@/lib/jsonld";

type PaintSurface = "walls" | "walls-ceiling" | "ceiling";
type InputMode = "room" | "manual";

interface PaintType {
  label: string;
  coverage: number;
}

const PAINT_TYPES: PaintType[] = [
  { label: "Interior Flat / Matt", coverage: 12 },
  { label: "Interior Low Sheen", coverage: 14 },
  { label: "Interior Semi-Gloss", coverage: 16 },
  { label: "Interior Gloss", coverage: 16 },
  { label: "Exterior Acrylic", coverage: 12 },
  { label: "Primer / Undercoat", coverage: 12 },
  { label: "Ceiling Flat", coverage: 14 },
];

const DOOR_AREA = 2.04 * 0.82; // 1.6728 m²
const WINDOW_AREA = 1.2 * 1.2; // 1.44 m²

function calculateRoomArea(
  length: number,
  width: number,
  height: number,
  doors: number,
  windows: number,
  surface: PaintSurface
): number {
  const wallArea = 2 * (length + width) * height;
  const ceilingArea = length * width;
  const openingsArea = doors * DOOR_AREA + windows * WINDOW_AREA;

  switch (surface) {
    case "walls":
      return Math.max(0, wallArea - openingsArea);
    case "walls-ceiling":
      return Math.max(0, wallArea - openingsArea) + ceilingArea;
    case "ceiling":
      return ceilingArea;
  }
}

function calculateLitresNeeded(
  area: number,
  coats: number,
  coverageRate: number
): number {
  if (coverageRate <= 0) return 0;
  return (area * coats) / coverageRate;
}

function calculateOptimalTins(litres: number): {
  tens: number;
  fours: number;
  ones: number;
  totalLitres: number;
} {
  if (litres <= 0) return { tens: 0, fours: 0, ones: 0, totalLitres: 0 };

  // Try all combinations of 10L/4L/1L tins and pick the one with least waste
  // that still covers the needed amount
  let bestCombo = { tens: 0, fours: 0, ones: 0, totalLitres: Infinity };
  let bestWaste = Infinity;

  const maxTens = Math.ceil(litres / 10);
  for (let tens = 0; tens <= maxTens; tens++) {
    const remaining10 = litres - tens * 10;
    if (remaining10 <= 0) {
      const total = tens * 10;
      const waste = total - litres;
      if (waste < bestWaste) {
        bestWaste = waste;
        bestCombo = { tens, fours: 0, ones: 0, totalLitres: total };
      }
      continue;
    }
    const maxFours = Math.ceil(remaining10 / 4);
    for (let fours = 0; fours <= maxFours; fours++) {
      const remaining4 = remaining10 - fours * 4;
      if (remaining4 <= 0) {
        const total = tens * 10 + fours * 4;
        const waste = total - litres;
        if (waste < bestWaste) {
          bestWaste = waste;
          bestCombo = { tens, fours, ones: 0, totalLitres: total };
        }
        continue;
      }
      const ones = Math.ceil(remaining4);
      const total = tens * 10 + fours * 4 + ones;
      const waste = total - litres;
      if (waste < bestWaste) {
        bestWaste = waste;
        bestCombo = { tens, fours, ones, totalLitres: total };
      }
    }
  }

  return bestCombo;
}

export default function PaintCoverageCalculatorPage() {
  const [mode, setMode] = useState<InputMode>("room");
  const [roomLength, setRoomLength] = useState<string>("5");
  const [roomWidth, setRoomWidth] = useState<string>("4");
  const [ceilingHeight, setCeilingHeight] = useState<string>("2.4");
  const [doors, setDoors] = useState<string>("1");
  const [windows, setWindows] = useState<string>("2");
  const [surface, setSurface] = useState<PaintSurface>("walls");
  const [manualArea, setManualArea] = useState<string>("50");
  const [coats, setCoats] = useState<number>(2);
  const [paintTypeIndex, setPaintTypeIndex] = useState<number>(0);
  const [useCustomCoverage, setUseCustomCoverage] = useState<boolean>(false);
  const [customCoverage, setCustomCoverage] = useState<string>("12");
  const [pricePerLitre, setPricePerLitre] = useState<string>("");

  const results = useMemo(() => {
    const coverageRate = useCustomCoverage
      ? parseFloat(customCoverage) || 0
      : PAINT_TYPES[paintTypeIndex].coverage;

    let area = 0;
    if (mode === "room") {
      const l = parseFloat(roomLength) || 0;
      const w = parseFloat(roomWidth) || 0;
      const h = parseFloat(ceilingHeight) || 0;
      const d = parseInt(doors) || 0;
      const win = parseInt(windows) || 0;
      area = calculateRoomArea(l, w, h, d, win, surface);
    } else {
      area = parseFloat(manualArea) || 0;
    }

    const litres = calculateLitresNeeded(area, coats, coverageRate);
    const tins = calculateOptimalTins(litres);
    const price = parseFloat(pricePerLitre) || 0;
    const costEstimate = price > 0 ? litres * price : null;

    return {
      area,
      litres,
      tins,
      coverageRate,
      costEstimate,
    };
  }, [
    mode,
    roomLength,
    roomWidth,
    ceilingHeight,
    doors,
    windows,
    surface,
    manualArea,
    coats,
    paintTypeIndex,
    useCustomCoverage,
    customCoverage,
    pricePerLitre,
  ]);

  const inputClass =
    "w-full bg-slate-800 border border-slate-600 rounded-lg p-3 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500";

  return (
    <>
      <title>
        Paint Coverage Calculator - Area, Coats &amp; Litres Needed | Free
        Online Tool
      </title>
      <meta
        name="description"
        content="Free paint calculator to work out how much paint you need. Enter room dimensions, number of coats and paint type to get litres needed, tin sizes and cost estimate. Coverage rates for Australian paint brands."
      />
      <JsonLd
        data={[
          generateWebAppSchema({
            slug: "paint-coverage-calculator",
            name: "Paint Coverage Calculator",
            description:
              "Calculate how much paint you need for any room. Enter dimensions, select paint type and number of coats to get litres needed and recommended tin sizes.",
            category: "construction",
          }),
          generateBreadcrumbSchema({
            slug: "paint-coverage-calculator",
            name: "Paint Coverage Calculator",
            description:
              "Calculate how much paint you need for any room. Enter dimensions, select paint type and number of coats to get litres needed and recommended tin sizes.",
            category: "construction",
          }),
          generateFAQSchema([
            {
              question: "How much paint do I need per square metre?",
              answer:
                "Paint coverage varies by type: interior flat/matt covers about 12 m per litre, low sheen covers about 14 m per litre, and semi-gloss or gloss covers about 16 m per litre. These are typical coverage rates for brands like Dulux and Taubmans. Actual coverage depends on surface porosity, colour, and application method.",
            },
            {
              question: "How many coats of paint do I need?",
              answer:
                "Two coats is the standard recommendation for most interior and exterior painting. You may need three coats when painting a dark colour over a light one, changing from a drastically different colour, or painting over new plaster or bare timber. A single coat may suffice for touch-ups with the same colour.",
            },
            {
              question:
                "What is the standard ceiling height in Australia?",
              answer:
                "The standard ceiling height in most Australian residential homes is 2.4 metres (approximately 8 feet). Some newer builds and premium homes feature 2.7 m ceilings, while older Queenslander-style homes may have ceilings up to 3.6 m. The Building Code of Australia requires a minimum ceiling height of 2.4 m for habitable rooms.",
            },
            {
              question: "How do I calculate wall area for painting?",
              answer:
                "To calculate wall area, measure the room perimeter (2 x length + 2 x width) and multiply by the ceiling height. Then subtract the area of doors (standard Australian door is 2.04 m x 0.82 m = 1.67 m squared) and windows (a common window is 1.2 m x 1.2 m = 1.44 m squared). This gives you the net paintable wall area.",
            },
          ]),
        ]}
      />

      <div className="min-h-screen bg-slate-900 text-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <ToolBreadcrumb slug="paint-coverage-calculator" />

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
              Paint Coverage Calculator
            </h1>
            <p className="text-slate-400 max-w-2xl text-lg">
              Work out how much paint you need for your next project. Enter room
              dimensions or total area, choose your paint type and number of
              coats, and get the litres and tin sizes you need to buy.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Input form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Mode Toggle */}
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
                <h2 className="text-lg font-semibold text-white mb-4">
                  Input Mode
                </h2>
                <div className="flex gap-3">
                  <button
                    onClick={() => setMode("room")}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      mode === "room"
                        ? "bg-blue-600 text-white"
                        : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                    }`}
                  >
                    Room Dimensions
                  </button>
                  <button
                    onClick={() => setMode("manual")}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      mode === "manual"
                        ? "bg-blue-600 text-white"
                        : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                    }`}
                  >
                    Manual Area
                  </button>
                </div>
              </div>

              {/* Room Mode Inputs */}
              {mode === "room" && (
                <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 space-y-5">
                  <h2 className="text-lg font-semibold text-white mb-2">
                    Room Dimensions
                  </h2>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                    <div>
                      <label
                        htmlFor="roomLength"
                        className="block text-sm font-medium text-slate-300 mb-1"
                      >
                        Room Length (m)
                      </label>
                      <input
                        id="roomLength"
                        type="number"
                        min="0"
                        step="0.1"
                        value={roomLength}
                        onChange={(e) => setRoomLength(e.target.value)}
                        className={inputClass}
                        placeholder="5"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="roomWidth"
                        className="block text-sm font-medium text-slate-300 mb-1"
                      >
                        Room Width (m)
                      </label>
                      <input
                        id="roomWidth"
                        type="number"
                        min="0"
                        step="0.1"
                        value={roomWidth}
                        onChange={(e) => setRoomWidth(e.target.value)}
                        className={inputClass}
                        placeholder="4"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="ceilingHeight"
                        className="block text-sm font-medium text-slate-300 mb-1"
                      >
                        Ceiling Height (m)
                      </label>
                      <input
                        id="ceilingHeight"
                        type="number"
                        min="0"
                        step="0.1"
                        value={ceilingHeight}
                        onChange={(e) => setCeilingHeight(e.target.value)}
                        className={inputClass}
                        placeholder="2.4"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label
                        htmlFor="doors"
                        className="block text-sm font-medium text-slate-300 mb-1"
                      >
                        Number of Doors
                        <span className="text-slate-500 ml-1">
                          (2.04m x 0.82m each)
                        </span>
                      </label>
                      <input
                        id="doors"
                        type="number"
                        min="0"
                        step="1"
                        value={doors}
                        onChange={(e) => setDoors(e.target.value)}
                        className={inputClass}
                        placeholder="1"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="windows"
                        className="block text-sm font-medium text-slate-300 mb-1"
                      >
                        Number of Windows
                        <span className="text-slate-500 ml-1">
                          (1.2m x 1.2m each)
                        </span>
                      </label>
                      <input
                        id="windows"
                        type="number"
                        min="0"
                        step="1"
                        value={windows}
                        onChange={(e) => setWindows(e.target.value)}
                        className={inputClass}
                        placeholder="2"
                      />
                    </div>
                  </div>

                  {/* Paint Surface Toggle */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Paint Surfaces
                    </label>
                    <div className="flex flex-wrap gap-3">
                      {(
                        [
                          { value: "walls", label: "Walls Only" },
                          { value: "walls-ceiling", label: "Walls + Ceiling" },
                          { value: "ceiling", label: "Ceiling Only" },
                        ] as const
                      ).map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => setSurface(opt.value)}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                            surface === opt.value
                              ? "bg-blue-600 text-white"
                              : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Manual Mode Input */}
              {mode === "manual" && (
                <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
                  <h2 className="text-lg font-semibold text-white mb-4">
                    Total Area
                  </h2>
                  <div>
                    <label
                      htmlFor="manualArea"
                      className="block text-sm font-medium text-slate-300 mb-1"
                    >
                      Total Area to Paint (m&sup2;)
                    </label>
                    <input
                      id="manualArea"
                      type="number"
                      min="0"
                      step="1"
                      value={manualArea}
                      onChange={(e) => setManualArea(e.target.value)}
                      className={inputClass}
                      placeholder="50"
                    />
                  </div>
                </div>
              )}

              {/* Paint Options */}
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 space-y-5">
                <h2 className="text-lg font-semibold text-white mb-2">
                  Paint Options
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {/* Number of Coats */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Number of Coats
                    </label>
                    <div className="flex gap-3">
                      {[1, 2, 3].map((n) => (
                        <button
                          key={n}
                          onClick={() => setCoats(n)}
                          className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                            coats === n
                              ? "bg-blue-600 text-white"
                              : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                          }`}
                        >
                          {n} Coat{n > 1 ? "s" : ""}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Paint Type */}
                  <div>
                    <label
                      htmlFor="paintType"
                      className="block text-sm font-medium text-slate-300 mb-1"
                    >
                      Paint Type
                    </label>
                    <select
                      id="paintType"
                      value={useCustomCoverage ? "custom" : paintTypeIndex}
                      onChange={(e) => {
                        if (e.target.value === "custom") {
                          setUseCustomCoverage(true);
                        } else {
                          setUseCustomCoverage(false);
                          setPaintTypeIndex(parseInt(e.target.value));
                        }
                      }}
                      className={inputClass}
                    >
                      {PAINT_TYPES.map((pt, i) => (
                        <option key={i} value={i}>
                          {pt.label} ({pt.coverage} m&sup2;/L)
                        </option>
                      ))}
                      <option value="custom">Custom Coverage Rate</option>
                    </select>
                  </div>
                </div>

                {/* Custom Coverage Rate */}
                {useCustomCoverage && (
                  <div>
                    <label
                      htmlFor="customCoverage"
                      className="block text-sm font-medium text-slate-300 mb-1"
                    >
                      Custom Coverage Rate (m&sup2;/L)
                    </label>
                    <input
                      id="customCoverage"
                      type="number"
                      min="1"
                      step="0.5"
                      value={customCoverage}
                      onChange={(e) => setCustomCoverage(e.target.value)}
                      className={inputClass}
                      placeholder="12"
                    />
                  </div>
                )}

                {/* Cost Estimate */}
                <div>
                  <label
                    htmlFor="pricePerLitre"
                    className="block text-sm font-medium text-slate-300 mb-1"
                  >
                    Price per Litre ($AUD)
                    <span className="text-slate-500 ml-1">(optional)</span>
                  </label>
                  <input
                    id="pricePerLitre"
                    type="number"
                    min="0"
                    step="0.5"
                    value={pricePerLitre}
                    onChange={(e) => setPricePerLitre(e.target.value)}
                    className={inputClass}
                    placeholder="e.g. 15"
                  />
                </div>
              </div>
            </div>

            {/* Results sidebar */}
            <div className="space-y-6">
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-5">
                <h2 className="text-lg font-semibold text-white mb-4">
                  Results
                </h2>
                <div className="space-y-4">
                  <div>
                    <div className="text-xs text-slate-400 mb-1">
                      Total Paintable Area
                    </div>
                    <div className="text-xl font-bold text-white">
                      {results.area.toFixed(1)} m&sup2;
                    </div>
                  </div>

                  <div className="border-t border-slate-700 pt-4">
                    <div className="text-xs text-slate-400 mb-1">
                      Paint Needed
                    </div>
                    <div className="text-3xl font-bold text-green-400">
                      {results.litres.toFixed(1)} L
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      {results.area.toFixed(1)} m&sup2; x {coats} coat
                      {coats > 1 ? "s" : ""} / {results.coverageRate} m&sup2;/L
                    </div>
                  </div>

                  {results.litres > 0 && (
                    <div className="border-t border-slate-700 pt-4">
                      <div className="text-xs text-slate-400 mb-2">
                        Recommended Purchase
                      </div>
                      <div className="space-y-1.5">
                        {results.tins.tens > 0 && (
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-300">10 L tins</span>
                            <span className="text-white font-medium">
                              x {results.tins.tens}
                            </span>
                          </div>
                        )}
                        {results.tins.fours > 0 && (
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-300">4 L tins</span>
                            <span className="text-white font-medium">
                              x {results.tins.fours}
                            </span>
                          </div>
                        )}
                        {results.tins.ones > 0 && (
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-300">1 L tins</span>
                            <span className="text-white font-medium">
                              x {results.tins.ones}
                            </span>
                          </div>
                        )}
                        <div className="flex justify-between text-xs text-slate-500 pt-1 border-t border-slate-700">
                          <span>Total purchased</span>
                          <span>{results.tins.totalLitres} L</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {results.costEstimate !== null && results.costEstimate > 0 && (
                    <div className="border-t border-slate-700 pt-4">
                      <div className="text-xs text-slate-400 mb-1">
                        Estimated Cost
                      </div>
                      <div className="text-2xl font-bold text-white">
                        $
                        {results.costEstimate.toLocaleString("en-AU", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </div>
                      <div className="text-xs text-slate-500 mt-1">
                        Based on ${parseFloat(pricePerLitre).toFixed(2)}/L x{" "}
                        {results.litres.toFixed(1)} L
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Reference */}
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-5">
                <h2 className="text-lg font-semibold text-white mb-3">
                  Coverage Quick Reference
                </h2>
                <div className="space-y-2">
                  {PAINT_TYPES.map((pt, i) => (
                    <div
                      key={i}
                      className="flex justify-between text-sm"
                    >
                      <span className="text-slate-400">{pt.label}</span>
                      <span className="text-slate-300 font-medium">
                        {pt.coverage} m&sup2;/L
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* How to Use */}
          <section className="mt-12 bg-slate-800 border border-slate-700 rounded-lg p-6">
            <h2 className="text-2xl font-bold text-white mb-4">
              How to Use the Paint Coverage Calculator
            </h2>
            <div className="text-slate-400 space-y-3">
              <p>
                This calculator helps you work out exactly how much paint to buy
                for your next painting project. It supports two input modes:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-2">
                <li>
                  <strong className="text-slate-300">Room Dimensions</strong>{" "}
                  &mdash; enter your room length, width, and ceiling height.
                  The calculator automatically computes the wall and ceiling
                  area, subtracting standard door and window openings.
                </li>
                <li>
                  <strong className="text-slate-300">Manual Area</strong>{" "}
                  &mdash; enter the total area directly if you have already
                  measured it or are painting a non-standard surface like a
                  fence or feature wall.
                </li>
              </ul>
              <p>
                Select your paint type to use typical Australian coverage rates
                (based on manufacturer data from brands like Dulux and
                Taubmans), or enter a custom coverage rate from your paint tin.
                Choose the number of coats (two is standard), and the
                calculator gives you the total litres needed plus a recommended
                combination of 10 L, 4 L, and 1 L tins optimised to minimise
                waste.
              </p>
              <p>
                The formula used is{" "}
                <code className="bg-slate-700 px-1.5 py-0.5 rounded text-sm text-slate-300">
                  litres = (area x coats) / coverage rate
                </code>
                . All calculations run entirely in your browser with no data
                sent to any server.
              </p>
            </div>
          </section>

          {/* Educational Content */}
          <section className="mt-8 bg-slate-800 border border-slate-700 rounded-lg p-6">
            <h2 className="text-2xl font-bold text-white mb-4">
              Paint Types and Coverage Rates in Australia
            </h2>
            <div className="text-slate-400 space-y-3">
              <p>
                Australian paint manufacturers such as Dulux, Taubmans, and
                Wattyl publish coverage rates on every tin. These rates
                represent the area one litre of paint will cover on a smooth,
                sealed surface in a single coat. Actual coverage depends on
                surface porosity, texture, colour, and application method
                (brush, roller, or spray).
              </p>
              <h3 className="text-lg font-semibold text-white mt-4 mb-2">
                Interior Paint Types
              </h3>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>
                  <strong className="text-slate-300">Flat / Matt</strong>{" "}
                  (12 m&sup2;/L) &mdash; hides imperfections well, ideal for
                  ceilings and low-traffic walls. Not as washable.
                </li>
                <li>
                  <strong className="text-slate-300">Low Sheen</strong>{" "}
                  (14 m&sup2;/L) &mdash; the most popular choice for living
                  areas and bedrooms in Australia. Good balance of
                  appearance and washability.
                </li>
                <li>
                  <strong className="text-slate-300">Semi-Gloss</strong>{" "}
                  (16 m&sup2;/L) &mdash; more durable and washable, commonly
                  used for kitchens, bathrooms, and trims.
                </li>
                <li>
                  <strong className="text-slate-300">Gloss</strong>{" "}
                  (16 m&sup2;/L) &mdash; highly durable and easy to clean,
                  used for doors, trims, and high-moisture areas.
                </li>
              </ul>
              <h3 className="text-lg font-semibold text-white mt-4 mb-2">
                Preparation Tips
              </h3>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>
                  Always apply a primer or undercoat on new plaster, bare
                  timber, or when making a dramatic colour change.
                </li>
                <li>
                  Sand glossy surfaces lightly before repainting to ensure the
                  new coat adheres properly.
                </li>
                <li>
                  Fill cracks and holes with a quality filler, sand smooth, and
                  spot-prime before applying topcoats.
                </li>
                <li>
                  Use painter&apos;s tape to protect edges, skirting boards,
                  and window frames for a clean finish.
                </li>
                <li>
                  Buy 5&ndash;10% extra paint to account for touch-ups,
                  wastage, and surface absorption.
                </li>
              </ul>
            </div>
          </section>

          <RelatedTools currentSlug="paint-coverage-calculator" />

          {/* FAQ Section */}
          <section className="mt-16 border-t border-slate-700 pt-10">
            <h2 className="text-2xl font-bold text-white mb-6">
              Frequently Asked Questions
            </h2>

            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  How much paint do I need per square metre?
                </h3>
                <p className="text-slate-400">
                  Paint coverage varies by type. Interior flat or matt paint
                  typically covers about 12 square metres per litre, low sheen
                  covers around 14 m&sup2;/L, and semi-gloss or gloss covers
                  approximately 16 m&sup2;/L. These are average figures based
                  on smooth, sealed surfaces. Rough, porous, or textured
                  surfaces will absorb more paint and reduce coverage by
                  20&ndash;30%.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  How many coats of paint do I need?
                </h3>
                <p className="text-slate-400">
                  Two coats is the standard recommendation for most painting
                  projects. You should apply three coats when making a dramatic
                  colour change (especially dark to light), painting over
                  patched or repaired areas, or when using a lighter-coloured
                  paint that does not achieve full opacity in two coats. A
                  single coat may be sufficient for minor touch-ups with the
                  same colour.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  What is the standard ceiling height in Australia?
                </h3>
                <p className="text-slate-400">
                  The standard ceiling height in most Australian residential
                  homes built after the 1990s is 2.4 metres (approximately 8
                  feet). Many newer premium builds and project homes now offer
                  2.7 m ceilings as standard. Older homes, particularly
                  Queenslanders and Federation-era houses, may have ceiling
                  heights of 3.0 m to 3.6 m. The Building Code of Australia
                  (NCC) requires a minimum ceiling height of 2.4 m for
                  habitable rooms and 2.1 m for non-habitable rooms like
                  laundries and garages.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  How do I calculate wall area for painting?
                </h3>
                <p className="text-slate-400">
                  To calculate wall area, measure the room&apos;s perimeter (2
                  x length + 2 x width) and multiply by the ceiling height.
                  Then subtract the area of any openings: a standard Australian
                  internal door is 2.04 m x 0.82 m (1.67 m&sup2;) and a
                  typical window is approximately 1.2 m x 1.2 m (1.44 m&sup2;).
                  For example, a 5 m x 4 m room with 2.4 m ceilings, one door,
                  and two windows has a wall area of (18 m x 2.4 m) - 1.67
                  m&sup2; - (2 x 1.44 m&sup2;) = 38.65 m&sup2;.
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
