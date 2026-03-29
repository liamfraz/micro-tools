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

type Shape = "slab" | "footing" | "column" | "stairs";

const CONCRETE_DENSITY_KG_M3 = 2400;
const PREMIX_BAG_VOLUME_M3 = 0.009; // 20kg bag

function calculateSlabVolume(
  lengthM: number,
  widthM: number,
  thicknessMM: number
): number {
  if (lengthM <= 0 || widthM <= 0 || thicknessMM <= 0) return 0;
  return lengthM * widthM * (thicknessMM / 1000);
}

function calculateFootingVolume(
  lengthM: number,
  widthMM: number,
  depthMM: number
): number {
  if (lengthM <= 0 || widthMM <= 0 || depthMM <= 0) return 0;
  return lengthM * (widthMM / 1000) * (depthMM / 1000);
}

function calculateColumnVolume(
  diameterMM: number,
  heightM: number,
  quantity: number
): number {
  if (diameterMM <= 0 || heightM <= 0 || quantity <= 0) return 0;
  const radiusM = diameterMM / 2000;
  return Math.PI * radiusM * radiusM * heightM * quantity;
}

function calculateStairsVolume(
  runLengthM: number,
  widthM: number,
  numberOfSteps: number,
  risePerStepMM: number
): number {
  if (runLengthM <= 0 || widthM <= 0 || numberOfSteps <= 0 || risePerStepMM <= 0)
    return 0;
  const totalRiseM = (numberOfSteps * risePerStepMM) / 1000;
  const averageThicknessM = totalRiseM / 2;
  const treadDepthM = runLengthM / numberOfSteps;
  const stepsVolume =
    numberOfSteps *
    widthM *
    treadDepthM *
    (risePerStepMM / 1000) *
    0.5;
  const slabVolume = runLengthM * widthM * averageThicknessM;
  return slabVolume + stepsVolume;
}

export default function ConcreteCalculatorPage() {
  const [shape, setShape] = useState<Shape>("slab");

  // Slab inputs
  const [slabLength, setSlabLength] = useState("");
  const [slabWidth, setSlabWidth] = useState("");
  const [slabThickness, setSlabThickness] = useState("");

  // Footing inputs
  const [footingLength, setFootingLength] = useState("");
  const [footingWidth, setFootingWidth] = useState("");
  const [footingDepth, setFootingDepth] = useState("");

  // Column inputs
  const [columnDiameter, setColumnDiameter] = useState("");
  const [columnHeight, setColumnHeight] = useState("");
  const [columnQuantity, setColumnQuantity] = useState("");

  // Stairs inputs
  const [stairsRunLength, setStairsRunLength] = useState("");
  const [stairsWidth, setStairsWidth] = useState("");
  const [stairsSteps, setStairsSteps] = useState("");
  const [stairsRise, setStairsRise] = useState("");

  const volume = useMemo(() => {
    switch (shape) {
      case "slab":
        return calculateSlabVolume(
          parseFloat(slabLength) || 0,
          parseFloat(slabWidth) || 0,
          parseFloat(slabThickness) || 0
        );
      case "footing":
        return calculateFootingVolume(
          parseFloat(footingLength) || 0,
          parseFloat(footingWidth) || 0,
          parseFloat(footingDepth) || 0
        );
      case "column":
        return calculateColumnVolume(
          parseFloat(columnDiameter) || 0,
          parseFloat(columnHeight) || 0,
          parseFloat(columnQuantity) || 0
        );
      case "stairs":
        return calculateStairsVolume(
          parseFloat(stairsRunLength) || 0,
          parseFloat(stairsWidth) || 0,
          parseFloat(stairsSteps) || 0,
          parseFloat(stairsRise) || 0
        );
      default:
        return 0;
    }
  }, [
    shape,
    slabLength,
    slabWidth,
    slabThickness,
    footingLength,
    footingWidth,
    footingDepth,
    columnDiameter,
    columnHeight,
    columnQuantity,
    stairsRunLength,
    stairsWidth,
    stairsSteps,
    stairsRise,
  ]);

  const volumeWithWastage = useMemo(() => volume * 1.1, [volume]);
  const premixBags = useMemo(
    () => (volume > 0 ? Math.ceil(volumeWithWastage / PREMIX_BAG_VOLUME_M3) : 0),
    [volume, volumeWithWastage]
  );
  const estimatedWeight = useMemo(
    () => volume * CONCRETE_DENSITY_KG_M3,
    [volume]
  );

  const shapes: { key: Shape; label: string }[] = [
    { key: "slab", label: "Slab / Pad" },
    { key: "footing", label: "Footing / Strip" },
    { key: "column", label: "Column / Pier" },
    { key: "stairs", label: "Stairs" },
  ];

  const inputClass =
    "w-full bg-slate-800 border border-slate-600 rounded-lg p-3 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500";

  return (
    <>
      <title>
        Concrete Calculator - Calculate Cubic Metres for Slabs, Footings &amp;
        Columns | Free Online Tool
      </title>
      <meta
        name="description"
        content="Calculate concrete volume in cubic metres for slabs, footings, columns, and stairs. Free concrete slab calculator with wastage allowance and pre-mix bag estimates. Australian metric units."
      />
      <JsonLd
        data={[
          generateWebAppSchema({
            slug: "concrete-calculator",
            name: "Concrete Calculator",
            description:
              "Calculate concrete volume in cubic metres for slabs, footings, columns, and stairs with wastage allowance",
            category: "construction",
          }),
          generateBreadcrumbSchema({
            slug: "concrete-calculator",
            name: "Concrete Calculator",
            description:
              "Calculate concrete volume in cubic metres for slabs, footings, columns, and stairs with wastage allowance",
            category: "construction",
          }),
          generateFAQSchema([
            {
              question: "How much concrete do I need for a slab?",
              answer:
                "To calculate concrete for a slab, multiply the length (m) by the width (m) by the thickness (converted to metres). For example, a 4m x 5m slab at 100mm thick requires 4 x 5 x 0.1 = 2.0 cubic metres. Always add 10% for wastage, bringing the order to 2.2 m\u00B3.",
            },
            {
              question:
                "What is the standard wastage allowance for concrete?",
              answer:
                "The Australian industry standard wastage allowance for concrete is 10%. This accounts for spillage, uneven subgrade, over-excavation, and minor variations in formwork. For complex pours or difficult access, some contractors allow up to 15%.",
            },
            {
              question: "How many bags of concrete per cubic metre?",
              answer:
                "You need approximately 111 x 20kg bags of pre-mix concrete per cubic metre. Each 20kg bag yields roughly 0.009 m\u00B3 of mixed concrete. Pre-mix bags are suitable for small jobs; for anything over 0.5 m\u00B3, ready-mix delivery is generally more economical.",
            },
            {
              question: "What thickness should a concrete slab be?",
              answer:
                "In Australia, residential concrete slabs are typically 100mm thick for paths, patios, and shed floors. Driveways and garage floors should be at least 100-150mm thick with steel reinforcement. Structural slabs for house foundations are typically 100-150mm on waffle pods or 200-300mm for strip footings, as specified by an engineer to comply with AS 2870.",
            },
          ]),
        ]}
      />

      <div className="min-h-screen bg-slate-900 text-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <ToolBreadcrumb slug="concrete-calculator" />

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
              Concrete Calculator
            </h1>
            <p className="text-slate-400 max-w-2xl text-lg">
              Calculate how much concrete you need in cubic metres. Supports
              slabs, footings, columns, and stairs with 10% wastage allowance
              and pre-mix bag estimates.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left side: Inputs */}
            <div className="lg:col-span-2 space-y-6">
              {/* Shape Selector */}
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-5">
                <span className="block text-sm font-medium text-slate-300 mb-3">
                  Shape Type
                </span>
                <div className="flex flex-wrap gap-2">
                  {shapes.map((s) => (
                    <button
                      key={s.key}
                      onClick={() => setShape(s.key)}
                      className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${
                        shape === s.key
                          ? "bg-blue-600 text-white"
                          : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Slab Inputs */}
              {shape === "slab" && (
                <div className="bg-slate-800 border border-slate-700 rounded-lg p-5 space-y-4">
                  <h2 className="text-lg font-semibold text-white">
                    Slab / Pad Dimensions
                  </h2>
                  <div>
                    <label
                      htmlFor="slab-length"
                      className="block text-sm font-medium text-slate-300 mb-2"
                    >
                      Length (m)
                    </label>
                    <input
                      id="slab-length"
                      type="number"
                      min="0"
                      step="0.01"
                      value={slabLength}
                      onChange={(e) => setSlabLength(e.target.value)}
                      placeholder="e.g. 5"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="slab-width"
                      className="block text-sm font-medium text-slate-300 mb-2"
                    >
                      Width (m)
                    </label>
                    <input
                      id="slab-width"
                      type="number"
                      min="0"
                      step="0.01"
                      value={slabWidth}
                      onChange={(e) => setSlabWidth(e.target.value)}
                      placeholder="e.g. 4"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="slab-thickness"
                      className="block text-sm font-medium text-slate-300 mb-2"
                    >
                      Thickness (mm)
                    </label>
                    <input
                      id="slab-thickness"
                      type="number"
                      min="0"
                      step="1"
                      value={slabThickness}
                      onChange={(e) => setSlabThickness(e.target.value)}
                      placeholder="e.g. 100"
                      className={inputClass}
                    />
                  </div>
                </div>
              )}

              {/* Footing Inputs */}
              {shape === "footing" && (
                <div className="bg-slate-800 border border-slate-700 rounded-lg p-5 space-y-4">
                  <h2 className="text-lg font-semibold text-white">
                    Footing / Strip Dimensions
                  </h2>
                  <div>
                    <label
                      htmlFor="footing-length"
                      className="block text-sm font-medium text-slate-300 mb-2"
                    >
                      Length (m)
                    </label>
                    <input
                      id="footing-length"
                      type="number"
                      min="0"
                      step="0.01"
                      value={footingLength}
                      onChange={(e) => setFootingLength(e.target.value)}
                      placeholder="e.g. 12"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="footing-width"
                      className="block text-sm font-medium text-slate-300 mb-2"
                    >
                      Width (mm)
                    </label>
                    <input
                      id="footing-width"
                      type="number"
                      min="0"
                      step="1"
                      value={footingWidth}
                      onChange={(e) => setFootingWidth(e.target.value)}
                      placeholder="e.g. 450"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="footing-depth"
                      className="block text-sm font-medium text-slate-300 mb-2"
                    >
                      Depth (mm)
                    </label>
                    <input
                      id="footing-depth"
                      type="number"
                      min="0"
                      step="1"
                      value={footingDepth}
                      onChange={(e) => setFootingDepth(e.target.value)}
                      placeholder="e.g. 300"
                      className={inputClass}
                    />
                  </div>
                </div>
              )}

              {/* Column Inputs */}
              {shape === "column" && (
                <div className="bg-slate-800 border border-slate-700 rounded-lg p-5 space-y-4">
                  <h2 className="text-lg font-semibold text-white">
                    Column / Pier Dimensions
                  </h2>
                  <div>
                    <label
                      htmlFor="column-diameter"
                      className="block text-sm font-medium text-slate-300 mb-2"
                    >
                      Diameter (mm)
                    </label>
                    <input
                      id="column-diameter"
                      type="number"
                      min="0"
                      step="1"
                      value={columnDiameter}
                      onChange={(e) => setColumnDiameter(e.target.value)}
                      placeholder="e.g. 350"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="column-height"
                      className="block text-sm font-medium text-slate-300 mb-2"
                    >
                      Height (m)
                    </label>
                    <input
                      id="column-height"
                      type="number"
                      min="0"
                      step="0.01"
                      value={columnHeight}
                      onChange={(e) => setColumnHeight(e.target.value)}
                      placeholder="e.g. 1.5"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="column-quantity"
                      className="block text-sm font-medium text-slate-300 mb-2"
                    >
                      Quantity
                    </label>
                    <input
                      id="column-quantity"
                      type="number"
                      min="1"
                      step="1"
                      value={columnQuantity}
                      onChange={(e) => setColumnQuantity(e.target.value)}
                      placeholder="e.g. 6"
                      className={inputClass}
                    />
                  </div>
                </div>
              )}

              {/* Stairs Inputs */}
              {shape === "stairs" && (
                <div className="bg-slate-800 border border-slate-700 rounded-lg p-5 space-y-4">
                  <h2 className="text-lg font-semibold text-white">
                    Stairs Dimensions
                  </h2>
                  <div>
                    <label
                      htmlFor="stairs-run"
                      className="block text-sm font-medium text-slate-300 mb-2"
                    >
                      Run Length (m)
                    </label>
                    <input
                      id="stairs-run"
                      type="number"
                      min="0"
                      step="0.01"
                      value={stairsRunLength}
                      onChange={(e) => setStairsRunLength(e.target.value)}
                      placeholder="e.g. 3"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="stairs-width"
                      className="block text-sm font-medium text-slate-300 mb-2"
                    >
                      Width (m)
                    </label>
                    <input
                      id="stairs-width"
                      type="number"
                      min="0"
                      step="0.01"
                      value={stairsWidth}
                      onChange={(e) => setStairsWidth(e.target.value)}
                      placeholder="e.g. 1.2"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="stairs-steps"
                      className="block text-sm font-medium text-slate-300 mb-2"
                    >
                      Number of Steps
                    </label>
                    <input
                      id="stairs-steps"
                      type="number"
                      min="1"
                      step="1"
                      value={stairsSteps}
                      onChange={(e) => setStairsSteps(e.target.value)}
                      placeholder="e.g. 8"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="stairs-rise"
                      className="block text-sm font-medium text-slate-300 mb-2"
                    >
                      Rise per Step (mm)
                    </label>
                    <input
                      id="stairs-rise"
                      type="number"
                      min="0"
                      step="1"
                      value={stairsRise}
                      onChange={(e) => setStairsRise(e.target.value)}
                      placeholder="e.g. 175"
                      className={inputClass}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Right side: Results */}
            <div className="space-y-4">
              {/* Volume Card */}
              <div className="rounded-lg p-5 border bg-slate-800 border-slate-700">
                <div className="text-xs text-slate-400 mb-1">
                  Volume (m&sup3;)
                </div>
                <div
                  className={`text-4xl font-bold ${
                    volume > 0 ? "text-blue-400" : "text-slate-500"
                  }`}
                >
                  {volume > 0 ? volume.toFixed(2) : "\u2014"}
                </div>
                {volume > 0 && (
                  <div className="text-xs text-slate-500 mt-1">
                    {volume.toFixed(4)} m&sup3; exact
                  </div>
                )}
              </div>

              {/* Volume + Wastage Card */}
              <div className="rounded-lg p-5 border bg-slate-800 border-slate-700">
                <div className="text-xs text-slate-400 mb-1">
                  With 10% Wastage
                </div>
                <div className="text-2xl font-bold text-white">
                  {volume > 0
                    ? `${volumeWithWastage.toFixed(2)} m\u00B3`
                    : "\u2014"}
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  Recommended order quantity
                </div>
              </div>

              {/* Pre-mix Bags Card */}
              <div className="rounded-lg p-5 border bg-slate-800 border-slate-700">
                <div className="text-xs text-slate-400 mb-1">
                  20kg Pre-Mix Bags
                </div>
                <div className="text-2xl font-bold text-white">
                  {volume > 0 ? premixBags.toLocaleString() : "\u2014"}
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  Based on 0.009 m&sup3; per bag (incl. wastage)
                </div>
              </div>

              {/* Estimated Weight Card */}
              <div className="rounded-lg p-5 border bg-slate-800 border-slate-700">
                <div className="text-xs text-slate-400 mb-1">
                  Estimated Weight
                </div>
                <div className="text-2xl font-bold text-white">
                  {volume > 0
                    ? estimatedWeight >= 1000
                      ? `${(estimatedWeight / 1000).toFixed(1)} t`
                      : `${estimatedWeight.toFixed(0)} kg`
                    : "\u2014"}
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  At 2,400 kg/m&sup3; density
                </div>
              </div>

              {/* Quick Reference Card */}
              <div className="rounded-lg p-5 border bg-slate-800 border-slate-700">
                <div className="text-xs text-slate-400 mb-3">
                  Quick Reference
                </div>
                <div className="space-y-2 text-sm text-slate-400">
                  <div className="flex justify-between">
                    <span>Path / Patio</span>
                    <span className="text-slate-300">100mm thick</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Driveway</span>
                    <span className="text-slate-300">100-150mm thick</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Garage Floor</span>
                    <span className="text-slate-300">100-150mm thick</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Shed Slab</span>
                    <span className="text-slate-300">100mm thick</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* How to Use */}
          <section className="mt-12 bg-slate-800 border border-slate-700 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-4">
              How to Use This Concrete Calculator
            </h2>
            <ol className="list-decimal list-inside space-y-2 text-slate-400">
              <li>
                Select the shape type that matches your project: Slab/Pad,
                Footing/Strip, Column/Pier, or Stairs.
              </li>
              <li>
                Enter the dimensions in the fields provided. Lengths are in
                metres, while thickness, width (for footings), depth, and
                diameter are in millimetres.
              </li>
              <li>
                The concrete volume is calculated instantly in cubic metres
                (m&sup3;) and displayed in the results panel.
              </li>
              <li>
                Use the &quot;With 10% Wastage&quot; figure as your recommended
                order quantity to account for spillage and variations.
              </li>
              <li>
                For small jobs, check the pre-mix bag count. For larger pours
                (over 0.5 m&sup3;), consider ordering ready-mix concrete
                delivery.
              </li>
            </ol>
          </section>

          <RelatedTools currentSlug="concrete-calculator" />

          {/* FAQ Section */}
          <section className="mt-16 border-t border-slate-700 pt-10">
            <h2 className="text-2xl font-bold text-white mb-6">
              Frequently Asked Questions
            </h2>

            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  How much concrete do I need for a slab?
                </h3>
                <p className="text-slate-400">
                  To calculate concrete for a slab, multiply the length (m) by
                  the width (m) by the thickness (converted to metres). For
                  example, a 4m x 5m slab at 100mm thick requires 4 x 5 x 0.1 =
                  2.0 cubic metres. Always add 10% for wastage, bringing the
                  order to 2.2 m&sup3;. This formula works for any rectangular
                  slab including paths, patios, driveways, and shed floors.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  What is the standard wastage allowance for concrete?
                </h3>
                <p className="text-slate-400">
                  The Australian industry standard wastage allowance for concrete
                  is 10%. This accounts for spillage during pouring, uneven
                  subgrade, over-excavation, and minor variations in formwork
                  dimensions. For complex pours, difficult site access, or
                  irregular shapes, some contractors allow up to 15%. Running
                  short on concrete mid-pour is far more costly than ordering a
                  small surplus.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  How many bags of concrete per cubic metre?
                </h3>
                <p className="text-slate-400">
                  You need approximately 111 x 20kg bags of pre-mix concrete per
                  cubic metre. Each 20kg bag yields roughly 0.009 m&sup3; of
                  mixed concrete. Pre-mix bags (available from Bunnings,
                  Mitre 10, and hardware stores) are suitable for small jobs like
                  post holes and minor repairs. For anything over 0.5 m&sup3;,
                  ready-mix delivery from a concrete plant is generally more
                  economical and produces a more consistent result.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  What thickness should a concrete slab be?
                </h3>
                <p className="text-slate-400">
                  In Australia, residential concrete slabs are typically 100mm
                  thick for paths, patios, and shed floors. Driveways and garage
                  floors should be at least 100-150mm thick with steel
                  reinforcement (SL72 or SL82 mesh). Structural slabs for house
                  foundations are typically 100-150mm on waffle pods or
                  200-300mm for strip footings, as specified by a structural
                  engineer to comply with AS 2870 (Residential slabs and
                  footings).
                </p>
              </div>
            </div>
          </section>

          {/* Educational Content Section */}
          <section className="mt-16 border-t border-slate-700 pt-10">
            <h2 className="text-2xl font-bold text-white mb-6">
              Ordering Concrete in Australia
            </h2>
            <div className="prose prose-invert max-w-none text-slate-400 space-y-4">
              <p>
                In Australia, concrete is measured and ordered in cubic metres
                (m&sup3;). When ordering ready-mix concrete from a batching
                plant, you will typically specify the volume in cubic metres, the
                concrete grade (e.g., N20 for general residential use, N25 for
                driveways, or N32 for structural applications), the slump
                (workability, usually 80-100mm for residential slabs), and any
                additives such as accelerators for cold weather pours or
                retarders for hot conditions. Most plants have a minimum order of
                around 0.2 to 0.5 m&sup3;, with a short-load fee applied for
                orders under 3 m&sup3; or so.
              </p>
              <p>
                For small projects such as fence post holes, letterbox footings,
                or small repair patches, pre-mix bags from hardware stores are a
                practical option. These come in 20kg bags (roughly 0.009 m&sup3;
                each) and are mixed on-site with water. The trade-off is cost and
                effort: mixing 50 or more bags by hand is labour-intensive and
                more expensive per cubic metre than ordering ready-mix delivery.
                As a rough guide, if your project requires more than 0.5 m&sup3;,
                ready-mix is almost always the better choice.
              </p>
              <p>
                Typical Australian residential applications include 100mm
                concrete paths and patios on compacted crushed rock base,
                100-150mm driveways with SL72 or SL82 reinforcing mesh,
                strip footings (typically 300-450mm wide and 300mm deep for
                single-storey homes), and pier/column footings for decks and
                pergolas. All structural concrete work should be designed by a
                qualified engineer and must comply with the National Construction
                Code (NCC), AS 2870 for residential footings, and AS 3600 for
                concrete structures. Council approval may be required depending
                on the scope of works and your local authority requirements.
              </p>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
