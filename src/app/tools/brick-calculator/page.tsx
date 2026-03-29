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

type BrickPreset = "standard" | "modular" | "custom";
type BondPattern = "stretcher" | "header";

interface BrickResult {
  grossWallArea: number;
  openingsArea: number;
  netWallArea: number;
  bricksPerSqm: number;
  totalBricks: number;
  totalWithWastage: number;
  mortarBags: number;
}

function calculateBricks(
  wallLength: number,
  wallHeight: number,
  doorOpenings: number,
  windowOpenings: number,
  customOpeningArea: number,
  brickLength: number,
  brickHeight: number,
  brickWidth: number,
  mortarThickness: number,
  bondPattern: BondPattern,
  wastagePercent: number
): BrickResult | null {
  if (wallLength <= 0 || wallHeight <= 0) return null;

  const grossWallArea = wallLength * wallHeight;

  // Standard Australian openings
  const doorArea = doorOpenings * 2.04 * 0.82;
  const windowArea = windowOpenings * 1.2 * 1.2;
  const openingsArea = doorArea + windowArea + customOpeningArea;

  const netWallArea = Math.max(0, grossWallArea - openingsArea);
  if (netWallArea <= 0) return null;

  // Bricks per m² calculation
  // For stretcher bond: use brick length face
  // For header bond: use brick width face
  const faceLength =
    bondPattern === "stretcher" ? brickLength : brickWidth;

  const bricksPerSqm =
    1_000_000 / ((faceLength + mortarThickness) * (brickHeight + mortarThickness));

  const totalBricks = Math.ceil(netWallArea * bricksPerSqm);
  const totalWithWastage = Math.ceil(
    totalBricks * (1 + wastagePercent / 100)
  );

  // Mortar estimation: ~1 bag (20kg) per m² for 10mm joints
  // Scale proportionally for different joint thicknesses
  const mortarBags = Math.ceil(netWallArea * (mortarThickness / 10));

  return {
    grossWallArea,
    openingsArea,
    netWallArea,
    bricksPerSqm,
    totalBricks,
    totalWithWastage,
    mortarBags,
  };
}

const BRICK_PRESETS: Record<
  Exclude<BrickPreset, "custom">,
  { label: string; length: number; height: number; width: number }
> = {
  standard: { label: "Standard (230 x 110 x 76mm)", length: 230, height: 76, width: 110 },
  modular: { label: "Modular (290 x 90 x 90mm)", length: 290, height: 90, width: 90 },
};

export default function BrickCalculatorPage() {
  const [wallLength, setWallLength] = useState("6");
  const [wallHeight, setWallHeight] = useState("2.4");
  const [doorOpenings, setDoorOpenings] = useState("1");
  const [windowOpenings, setWindowOpenings] = useState("1");
  const [customOpeningArea, setCustomOpeningArea] = useState("");
  const [brickPreset, setBrickPreset] = useState<BrickPreset>("standard");
  const [customBrickLength, setCustomBrickLength] = useState("230");
  const [customBrickHeight, setCustomBrickHeight] = useState("76");
  const [customBrickWidth, setCustomBrickWidth] = useState("110");
  const [mortarThickness, setMortarThickness] = useState("10");
  const [bondPattern, setBondPattern] = useState<BondPattern>("stretcher");
  const [wastagePercent, setWastagePercent] = useState("5");

  const result = useMemo(() => {
    let brickLength: number;
    let brickHeight: number;
    let brickWidth: number;

    if (brickPreset === "custom") {
      brickLength = parseFloat(customBrickLength) || 0;
      brickHeight = parseFloat(customBrickHeight) || 0;
      brickWidth = parseFloat(customBrickWidth) || 0;
    } else {
      const preset = BRICK_PRESETS[brickPreset];
      brickLength = preset.length;
      brickHeight = preset.height;
      brickWidth = preset.width;
    }

    return calculateBricks(
      parseFloat(wallLength) || 0,
      parseFloat(wallHeight) || 0,
      parseInt(doorOpenings) || 0,
      parseInt(windowOpenings) || 0,
      parseFloat(customOpeningArea) || 0,
      brickLength,
      brickHeight,
      brickWidth,
      parseFloat(mortarThickness) || 10,
      bondPattern,
      parseFloat(wastagePercent) || 0
    );
  }, [
    wallLength,
    wallHeight,
    doorOpenings,
    windowOpenings,
    customOpeningArea,
    brickPreset,
    customBrickLength,
    customBrickHeight,
    customBrickWidth,
    mortarThickness,
    bondPattern,
    wastagePercent,
  ]);

  return (
    <>
      <title>
        Brick Calculator - Bricks Per Square Metre with Mortar &amp; Wastage | Free Online Tool
      </title>
      <meta
        name="description"
        content="Calculate bricks per square metre for Australian standard bricks. Estimate total bricks needed with mortar joint thickness and wastage allowance. Free brick calculator for walls, openings, and mortar bags."
      />
      <JsonLd
        data={[
          generateWebAppSchema({
            slug: "brick-calculator",
            name: "Brick Calculator",
            description:
              "Calculate bricks per square metre for Australian standard bricks with mortar and wastage estimates",
            category: "construction",
          }),
          generateBreadcrumbSchema({
            slug: "brick-calculator",
            name: "Brick Calculator",
            description:
              "Calculate bricks per square metre for Australian standard bricks with mortar and wastage estimates",
            category: "construction",
          }),
          generateFAQSchema([
            {
              question: "How many bricks per square metre?",
              answer:
                "For standard Australian bricks (230 x 110 x 76mm) with 10mm mortar joints in a stretcher bond, you need approximately 50 bricks per square metre. This is calculated as 1,000,000 / ((230 + 10) x (76 + 10)) = 48.4, rounded up to approximately 50 bricks including minor wastage.",
            },
            {
              question:
                "What is standard mortar joint thickness in Australia?",
              answer:
                "The standard mortar joint thickness in Australia is 10mm for both horizontal (bed) joints and vertical (perpend) joints. This is specified in AS 3700 - Masonry Structures. Consistent 10mm joints ensure structural integrity and a uniform appearance in brickwork.",
            },
            {
              question: "How much wastage should I allow for bricks?",
              answer:
                "A standard wastage allowance for bricks is 5% for straightforward walls with minimal cuts. For more complex patterns, curved walls, or projects requiring many cut bricks, allow 7-10% wastage. Some builders recommend up to 10-15% for intricate designs or when using recycled bricks that may have higher breakage rates.",
            },
            {
              question: "What are standard brick sizes in Australia?",
              answer:
                "The most common brick size in Australia is the standard brick at 230mm long x 110mm wide x 76mm high. Modular bricks measure 290mm x 90mm x 90mm. These dimensions are specified in AS/NZS 4455 - Masonry Units. The standard size has been used in Australian construction for decades and is the most readily available from suppliers.",
            },
          ]),
        ]}
      />

      <div className="min-h-screen bg-slate-900 text-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <ToolBreadcrumb slug="brick-calculator" />

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
              Brick Calculator
            </h1>
            <p className="text-slate-400 max-w-2xl text-lg">
              Calculate the number of bricks needed for your wall. Supports
              Australian standard and modular brick sizes with mortar joint
              thickness and wastage allowance.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left side: Inputs */}
            <div className="lg:col-span-2 space-y-6">
              {/* Wall Dimensions */}
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-5">
                <h2 className="text-sm font-medium text-slate-300 mb-4">
                  Wall Dimensions
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="wall-length"
                      className="block text-sm text-slate-400 mb-1"
                    >
                      Wall Length (m)
                    </label>
                    <input
                      id="wall-length"
                      type="number"
                      min="0"
                      step="0.1"
                      value={wallLength}
                      onChange={(e) => setWallLength(e.target.value)}
                      placeholder="e.g. 6"
                      className="w-full bg-slate-800 border border-slate-600 rounded-lg p-3 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="wall-height"
                      className="block text-sm text-slate-400 mb-1"
                    >
                      Wall Height (m)
                    </label>
                    <input
                      id="wall-height"
                      type="number"
                      min="0"
                      step="0.1"
                      value={wallHeight}
                      onChange={(e) => setWallHeight(e.target.value)}
                      placeholder="e.g. 2.4"
                      className="w-full bg-slate-800 border border-slate-600 rounded-lg p-3 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Openings */}
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-5">
                <h2 className="text-sm font-medium text-slate-300 mb-4">
                  Openings
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label
                      htmlFor="door-openings"
                      className="block text-sm text-slate-400 mb-1"
                    >
                      Door Openings (2.04 x 0.82m)
                    </label>
                    <input
                      id="door-openings"
                      type="number"
                      min="0"
                      step="1"
                      value={doorOpenings}
                      onChange={(e) => setDoorOpenings(e.target.value)}
                      placeholder="0"
                      className="w-full bg-slate-800 border border-slate-600 rounded-lg p-3 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="window-openings"
                      className="block text-sm text-slate-400 mb-1"
                    >
                      Window Openings (1.2 x 1.2m)
                    </label>
                    <input
                      id="window-openings"
                      type="number"
                      min="0"
                      step="1"
                      value={windowOpenings}
                      onChange={(e) => setWindowOpenings(e.target.value)}
                      placeholder="0"
                      className="w-full bg-slate-800 border border-slate-600 rounded-lg p-3 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="custom-opening"
                      className="block text-sm text-slate-400 mb-1"
                    >
                      Custom Opening Area (m²)
                    </label>
                    <input
                      id="custom-opening"
                      type="number"
                      min="0"
                      step="0.1"
                      value={customOpeningArea}
                      onChange={(e) => setCustomOpeningArea(e.target.value)}
                      placeholder="0"
                      className="w-full bg-slate-800 border border-slate-600 rounded-lg p-3 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Brick Size */}
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-5">
                <h2 className="text-sm font-medium text-slate-300 mb-4">
                  Brick Size
                </h2>
                <div className="flex flex-wrap gap-2 mb-4">
                  <button
                    onClick={() => setBrickPreset("standard")}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      brickPreset === "standard"
                        ? "bg-blue-600 text-white"
                        : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                    }`}
                  >
                    Standard (230 x 110 x 76mm)
                  </button>
                  <button
                    onClick={() => setBrickPreset("modular")}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      brickPreset === "modular"
                        ? "bg-blue-600 text-white"
                        : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                    }`}
                  >
                    Modular (290 x 90 x 90mm)
                  </button>
                  <button
                    onClick={() => setBrickPreset("custom")}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      brickPreset === "custom"
                        ? "bg-blue-600 text-white"
                        : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                    }`}
                  >
                    Custom
                  </button>
                </div>
                {brickPreset === "custom" && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label
                        htmlFor="brick-length"
                        className="block text-sm text-slate-400 mb-1"
                      >
                        Brick Length (mm)
                      </label>
                      <input
                        id="brick-length"
                        type="number"
                        min="0"
                        step="1"
                        value={customBrickLength}
                        onChange={(e) => setCustomBrickLength(e.target.value)}
                        placeholder="230"
                        className="w-full bg-slate-800 border border-slate-600 rounded-lg p-3 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="brick-width"
                        className="block text-sm text-slate-400 mb-1"
                      >
                        Brick Width (mm)
                      </label>
                      <input
                        id="brick-width"
                        type="number"
                        min="0"
                        step="1"
                        value={customBrickWidth}
                        onChange={(e) => setCustomBrickWidth(e.target.value)}
                        placeholder="110"
                        className="w-full bg-slate-800 border border-slate-600 rounded-lg p-3 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="brick-height"
                        className="block text-sm text-slate-400 mb-1"
                      >
                        Brick Height (mm)
                      </label>
                      <input
                        id="brick-height"
                        type="number"
                        min="0"
                        step="1"
                        value={customBrickHeight}
                        onChange={(e) => setCustomBrickHeight(e.target.value)}
                        placeholder="76"
                        className="w-full bg-slate-800 border border-slate-600 rounded-lg p-3 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Mortar, Bond & Wastage */}
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-5">
                <h2 className="text-sm font-medium text-slate-300 mb-4">
                  Mortar, Bond Pattern &amp; Wastage
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label
                      htmlFor="mortar-thickness"
                      className="block text-sm text-slate-400 mb-1"
                    >
                      Mortar Joint Thickness (mm)
                    </label>
                    <input
                      id="mortar-thickness"
                      type="number"
                      min="0"
                      max="20"
                      step="1"
                      value={mortarThickness}
                      onChange={(e) => setMortarThickness(e.target.value)}
                      placeholder="10"
                      className="w-full bg-slate-800 border border-slate-600 rounded-lg p-3 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="bond-pattern"
                      className="block text-sm text-slate-400 mb-1"
                    >
                      Bond Pattern
                    </label>
                    <select
                      id="bond-pattern"
                      value={bondPattern}
                      onChange={(e) =>
                        setBondPattern(e.target.value as BondPattern)
                      }
                      className="w-full bg-slate-800 border border-slate-600 rounded-lg p-3 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="stretcher">Stretcher Bond</option>
                      <option value="header">Header Bond</option>
                    </select>
                  </div>
                  <div>
                    <label
                      htmlFor="wastage"
                      className="block text-sm text-slate-400 mb-1"
                    >
                      Wastage (%)
                    </label>
                    <input
                      id="wastage"
                      type="number"
                      min="0"
                      max="15"
                      step="1"
                      value={wastagePercent}
                      onChange={(e) => setWastagePercent(e.target.value)}
                      placeholder="5"
                      className="w-full bg-slate-800 border border-slate-600 rounded-lg p-3 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Right side: Results */}
            <div className="space-y-4">
              {/* Total With Wastage - Primary */}
              <div className="rounded-lg p-5 border bg-slate-800 border-slate-700">
                <div className="text-xs text-slate-400 mb-1">
                  Total Bricks (with wastage)
                </div>
                <div className="text-4xl font-bold text-blue-400">
                  {result ? result.totalWithWastage.toLocaleString() : "—"}
                </div>
                {result && (
                  <div className="text-xs text-slate-500 mt-1">
                    Includes {wastagePercent}% wastage
                  </div>
                )}
              </div>

              {/* Total Bricks (no wastage) */}
              <div className="rounded-lg p-5 border bg-slate-800 border-slate-700">
                <div className="text-xs text-slate-400 mb-1">
                  Total Bricks (no wastage)
                </div>
                <div className="text-2xl font-bold text-white">
                  {result ? result.totalBricks.toLocaleString() : "—"}
                </div>
              </div>

              {/* Bricks per m² */}
              <div className="rounded-lg p-5 border bg-slate-800 border-slate-700">
                <div className="text-xs text-slate-400 mb-1">
                  Bricks per m²
                </div>
                <div className="text-2xl font-bold text-white">
                  {result ? result.bricksPerSqm.toFixed(1) : "—"}
                </div>
                {result && (
                  <div className="text-xs text-slate-500 mt-1">
                    {bondPattern === "stretcher"
                      ? "Stretcher bond"
                      : "Header bond"}
                  </div>
                )}
              </div>

              {/* Wall Area */}
              <div className="rounded-lg p-5 border bg-slate-800 border-slate-700">
                <div className="text-xs text-slate-400 mb-1">
                  Net Wall Area
                </div>
                <div className="text-lg font-semibold text-white">
                  {result ? `${result.netWallArea.toFixed(2)} m²` : "—"}
                </div>
                {result && result.openingsArea > 0 && (
                  <div className="text-xs text-slate-500 mt-1">
                    Gross: {result.grossWallArea.toFixed(2)} m² minus{" "}
                    {result.openingsArea.toFixed(2)} m² openings
                  </div>
                )}
              </div>

              {/* Mortar Bags */}
              <div className="rounded-lg p-5 border bg-slate-800 border-slate-700">
                <div className="text-xs text-slate-400 mb-1">
                  Estimated Mortar Bags
                </div>
                <div className="text-lg font-semibold text-white">
                  {result ? `${result.mortarBags} x 20kg bags` : "—"}
                </div>
                {result && (
                  <div className="text-xs text-slate-500 mt-1">
                    Approx. 1 bag per m² at 10mm joints
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* How to Use */}
          <section className="mt-12 bg-slate-800 border border-slate-700 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-4">
              How to Use This Brick Calculator
            </h2>
            <ol className="list-decimal list-inside space-y-2 text-slate-400">
              <li>
                Enter your wall length and height in metres. For multiple walls,
                calculate each separately or enter the total combined length.
              </li>
              <li>
                Specify the number of standard door and window openings, or
                enter a custom opening area in square metres for non-standard
                sizes.
              </li>
              <li>
                Select your brick size: Standard Australian (230 x 110 x 76mm),
                Modular (290 x 90 x 90mm), or enter custom dimensions.
              </li>
              <li>
                Adjust the mortar joint thickness if different from the standard
                10mm. Select your bond pattern (stretcher or header).
              </li>
              <li>
                Set your wastage percentage (5% is typical for standard walls).
                The results panel updates in real time with total bricks needed
                and mortar bag estimates.
              </li>
            </ol>
          </section>

          <RelatedTools currentSlug="brick-calculator" />

          {/* FAQ Section */}
          <section className="mt-16 border-t border-slate-700 pt-10">
            <h2 className="text-2xl font-bold text-white mb-6">
              Frequently Asked Questions
            </h2>

            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  How many bricks per square metre?
                </h3>
                <p className="text-slate-400">
                  For standard Australian bricks (230 x 110 x 76mm) with 10mm
                  mortar joints laid in a stretcher bond, you need approximately
                  50 bricks per square metre. This is calculated as 1,000,000 /
                  ((230 + 10) x (76 + 10)) = 48.4 bricks per m², which rounds
                  to approximately 50 when accounting for minor wastage and
                  cutting.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  What is standard mortar joint thickness in Australia?
                </h3>
                <p className="text-slate-400">
                  The standard mortar joint thickness in Australia is 10mm for
                  both horizontal (bed) joints and vertical (perpend) joints.
                  This is specified in AS 3700 - Masonry Structures. Consistent
                  10mm joints are important for structural integrity and achieving
                  a uniform, professional appearance in brickwork. Thinner joints
                  may compromise bond strength, while thicker joints can increase
                  material costs and drying time.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  How much wastage should I allow for bricks?
                </h3>
                <p className="text-slate-400">
                  A standard wastage allowance is 5% for straightforward walls
                  with minimal cuts. For more complex patterns, curved walls, or
                  projects requiring many cut bricks, allow 7-10% wastage. Some
                  builders recommend up to 10-15% for intricate designs, feature
                  walls, or when using recycled bricks that may have higher
                  breakage rates. It is always better to over-order slightly, as
                  matching bricks from a different batch can result in colour
                  variation.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  What are standard brick sizes in Australia?
                </h3>
                <p className="text-slate-400">
                  The most common brick size in Australia is the standard brick
                  at 230mm long x 110mm wide x 76mm high. Modular bricks
                  measure 290mm x 90mm x 90mm. These dimensions are specified in
                  AS/NZS 4455 - Masonry Units, Pavers, Flags and Segmental
                  Retaining Wall Units. The standard 230 x 110 x 76mm size has
                  been the dominant brick format in Australian residential and
                  commercial construction for decades and is the most readily
                  available from suppliers nationwide.
                </p>
              </div>
            </div>
          </section>

          {/* Educational Content Section */}
          <section className="mt-16 border-t border-slate-700 pt-10">
            <h2 className="text-2xl font-bold text-white mb-6">
              Brickwork in Australian Construction
            </h2>
            <div className="prose prose-invert max-w-none text-slate-400 space-y-4">
              <p>
                Brickwork has been a cornerstone of Australian construction since
                the early days of European settlement. Today, clay bricks remain
                one of the most popular cladding and structural materials for
                residential and commercial buildings across the country. The
                standard Australian brick (230 x 110 x 76mm) is manufactured to
                comply with AS/NZS 4455, which specifies requirements for
                dimensions, strength, durability, and salt attack resistance.
                Australian bricks are graded for exposure conditions, with
                Exposure Grade bricks required for areas subject to weathering,
                and General Purpose bricks suitable for protected or internal
                applications.
              </p>
              <p>
                Mortar plays a critical role in brickwork performance. In
                Australia, mortar is typically classified according to AS 3700 -
                Masonry Structures, with M2, M3, and M4 being the most common
                mix designations for residential construction. M3 (1 part cement
                to 1 part lime to 6 parts sand) is the standard mix for most
                above-ground brickwork. The standard 10mm joint thickness applies
                to both bed (horizontal) and perpend (vertical) joints, and
                achieving consistent joints is essential for both the structural
                performance and visual quality of the finished wall. Mortar
                should be mixed to a workable consistency and used within
                approximately one hour of mixing to ensure proper bonding.
              </p>
              <p>
                Bond patterns determine both the aesthetic appearance and
                structural behaviour of a brick wall. Stretcher bond, where
                bricks are laid lengthwise with each course offset by half a
                brick, is the most common pattern in Australia for single-skin
                walls and cavity wall construction. Header bond, where bricks are
                laid end-on, creates a different visual effect and is used in
                some decorative applications. Other patterns such as Flemish
                bond, English bond, and stack bond are used in feature walls and
                heritage restoration work. When estimating materials, the bond
                pattern directly affects the number of bricks per square metre
                and the amount of cutting required, which in turn influences the
                wastage allowance you should factor into your order.
              </p>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
