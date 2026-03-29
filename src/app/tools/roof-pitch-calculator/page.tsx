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

type InputMode = "riserun" | "angle" | "ratio";

function radToDeg(rad: number): number {
  return (rad * 180) / Math.PI;
}

function degToRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

function calcFromRiseRun(rise: number, run: number) {
  if (rise <= 0 || run <= 0) return null;
  const angleRad = Math.atan(rise / run);
  const angleDeg = radToDeg(angleRad);
  const ratio12 = (rise / run) * 12;
  const slopePercent = (rise / run) * 100;
  const risePerMetre = (rise / run) * 1000;
  const roofAreaMultiplier = 1 / Math.cos(angleRad);
  return { angleDeg, angleRad, ratio12, slopePercent, risePerMetre, roofAreaMultiplier };
}

function calcFromAngle(angleDeg: number) {
  if (angleDeg <= 0 || angleDeg >= 90) return null;
  const angleRad = degToRad(angleDeg);
  const ratio12 = Math.tan(angleRad) * 12;
  const slopePercent = Math.tan(angleRad) * 100;
  const risePerMetre = Math.tan(angleRad) * 1000;
  const roofAreaMultiplier = 1 / Math.cos(angleRad);
  return { angleDeg, angleRad, ratio12, slopePercent, risePerMetre, roofAreaMultiplier };
}

function calcFromRatio(ratioX: number) {
  if (ratioX <= 0) return null;
  const angleRad = Math.atan(ratioX / 12);
  const angleDeg = radToDeg(angleRad);
  const slopePercent = (ratioX / 12) * 100;
  const risePerMetre = (ratioX / 12) * 1000;
  const roofAreaMultiplier = 1 / Math.cos(angleRad);
  return { angleDeg, angleRad, ratio12: ratioX, slopePercent, risePerMetre, roofAreaMultiplier };
}

function calcRafterLength(spanM: number, angleRad: number): number | null {
  if (spanM <= 0) return null;
  const cosA = Math.cos(angleRad);
  if (cosA <= 0) return null;
  return (spanM / 2) / cosA;
}

export default function RoofPitchCalculatorPage() {
  const [mode, setMode] = useState<InputMode>("riserun");
  const [rise, setRise] = useState("300");
  const [run, setRun] = useState("1000");
  const [angle, setAngle] = useState("22.5");
  const [ratioX, setRatioX] = useState("4");
  const [spanM, setSpanM] = useState("");

  const result = useMemo(() => {
    switch (mode) {
      case "riserun":
        return calcFromRiseRun(parseFloat(rise) || 0, parseFloat(run) || 0);
      case "angle":
        return calcFromAngle(parseFloat(angle) || 0);
      case "ratio":
        return calcFromRatio(parseFloat(ratioX) || 0);
      default:
        return null;
    }
  }, [mode, rise, run, angle, ratioX]);

  const rafterLength = useMemo(() => {
    if (!result) return null;
    return calcRafterLength(parseFloat(spanM) || 0, result.angleRad);
  }, [result, spanM]);

  // SVG triangle dimensions
  const svgW = 240;
  const svgH = 140;
  const padding = 20;
  const baseLen = svgW - padding * 2;
  const maxRise = svgH - padding * 2;

  const trianglePoints = useMemo(() => {
    if (!result) return null;
    const angleDeg = result.angleDeg;
    const risePixels = Math.min(Math.tan(degToRad(angleDeg)) * baseLen, maxRise);
    const bottomLeft = { x: padding, y: svgH - padding };
    const bottomRight = { x: padding + baseLen, y: svgH - padding };
    const topRight = { x: padding + baseLen, y: svgH - padding - risePixels };
    return { bottomLeft, bottomRight, topRight, risePixels };
  }, [result, baseLen, maxRise, svgH]);

  const modes: { value: InputMode; label: string }[] = [
    { value: "riserun", label: "From Rise & Run" },
    { value: "angle", label: "From Angle" },
    { value: "ratio", label: "From Ratio" },
  ];

  return (
    <>
      <title>Roof Pitch Calculator - Degrees, Rise &amp; Run, Rafter Length | Free Online Tool</title>
      <meta
        name="description"
        content="Free roof pitch calculator. Convert between degrees, rise and run, and ratio formats. Calculate rafter length and roof area multiplier. Australian roof pitch standards and BCA requirements."
      />
      <JsonLd
        data={[
          generateWebAppSchema({
            slug: "roof-pitch-calculator",
            name: "Roof Pitch Calculator",
            description:
              "Calculate roof pitch angle in degrees, rise and run, ratio, rafter length, and roof area multiplier",
            category: "construction",
          }),
          generateBreadcrumbSchema({
            slug: "roof-pitch-calculator",
            name: "Roof Pitch Calculator",
            description:
              "Calculate roof pitch angle in degrees, rise and run, ratio, rafter length, and roof area multiplier",
            category: "construction",
          }),
          generateFAQSchema([
            {
              question: "What is a standard roof pitch in Australia?",
              answer:
                "In Australia, 22.5 degrees is the most common roof pitch, particularly for Colorbond steel roofing. Typical residential roof pitches range from 15 to 25 degrees. Lower pitches (10-15 degrees) are common for skillion roofs and modern designs, while steeper pitches (25-35 degrees) suit traditional styles and areas with heavy rainfall.",
            },
            {
              question: "How do I calculate rafter length from roof pitch?",
              answer:
                "Rafter length is calculated using the formula: Rafter Length = (Span / 2) / cos(pitch angle). For example, with a 10-metre span and a 22.5-degree pitch, the rafter length is (10 / 2) / cos(22.5) = 5 / 0.924 = 5.41 metres. This gives the slope length from the wall plate to the ridge, excluding any eave overhang.",
            },
            {
              question: "What is the minimum roof pitch for metal roofing?",
              answer:
                "The minimum roof pitch for metal roofing in Australia depends on the profile. Standard corrugated iron and Colorbond requires a minimum of 5 degrees (1:12 ratio) with specific profiles like Trimdek or Klip-Lok. Most standard profiles require a minimum of 10 degrees. Always check the manufacturer specifications and local BCA requirements for your specific roofing material.",
            },
            {
              question: "What does a 4:12 roof pitch mean?",
              answer:
                "A 4:12 roof pitch means the roof rises 4 units vertically for every 12 units of horizontal run. This is equivalent to approximately 18.4 degrees. The 4:12 pitch is a moderate slope commonly used in residential construction. In metric terms, it equates to roughly 333 mm of rise per metre of run.",
            },
          ]),
        ]}
      />

      <div className="min-h-screen bg-slate-900 text-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <ToolBreadcrumb slug="roof-pitch-calculator" />

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
              Roof Pitch Calculator
            </h1>
            <p className="text-slate-400 max-w-2xl text-lg">
              Calculate roof pitch angle, rise and run, rafter length, and roof
              area multiplier. Convert between degrees, ratio, and percentage
              formats for Australian roofing projects.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left side: Inputs */}
            <div className="lg:col-span-2 space-y-6">
              {/* Input Mode Tabs */}
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-5">
                <span className="block text-sm font-medium text-slate-300 mb-3">
                  Input Method
                </span>
                <div className="flex gap-2">
                  {modes.map((m) => (
                    <button
                      key={m.value}
                      onClick={() => setMode(m.value)}
                      className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${
                        mode === m.value
                          ? "bg-blue-600 text-white"
                          : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Rise & Run Inputs */}
              {mode === "riserun" && (
                <div className="bg-slate-800 border border-slate-700 rounded-lg p-5">
                  <h2 className="text-sm font-medium text-slate-300 mb-4">
                    Rise and Run
                  </h2>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="rise"
                        className="block text-xs text-slate-400 mb-1"
                      >
                        Rise (mm)
                      </label>
                      <input
                        id="rise"
                        type="number"
                        min="0"
                        step="1"
                        value={rise}
                        onChange={(e) => setRise(e.target.value)}
                        placeholder="e.g. 300"
                        className="w-full bg-slate-800 border border-slate-600 rounded-lg p-3 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="run"
                        className="block text-xs text-slate-400 mb-1"
                      >
                        Run (mm)
                      </label>
                      <input
                        id="run"
                        type="number"
                        min="0"
                        step="1"
                        value={run}
                        onChange={(e) => setRun(e.target.value)}
                        placeholder="e.g. 1000"
                        className="w-full bg-slate-800 border border-slate-600 rounded-lg p-3 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Angle Input */}
              {mode === "angle" && (
                <div className="bg-slate-800 border border-slate-700 rounded-lg p-5">
                  <h2 className="text-sm font-medium text-slate-300 mb-4">
                    Pitch Angle
                  </h2>
                  <div>
                    <label
                      htmlFor="angle"
                      className="block text-xs text-slate-400 mb-1"
                    >
                      Angle (degrees)
                    </label>
                    <input
                      id="angle"
                      type="number"
                      min="0.1"
                      max="89.9"
                      step="0.1"
                      value={angle}
                      onChange={(e) => setAngle(e.target.value)}
                      placeholder="e.g. 22.5"
                      className="w-full bg-slate-800 border border-slate-600 rounded-lg p-3 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              )}

              {/* Ratio Input */}
              {mode === "ratio" && (
                <div className="bg-slate-800 border border-slate-700 rounded-lg p-5">
                  <h2 className="text-sm font-medium text-slate-300 mb-4">
                    Pitch Ratio
                  </h2>
                  <div className="flex items-end gap-3">
                    <div className="flex-1">
                      <label
                        htmlFor="ratioX"
                        className="block text-xs text-slate-400 mb-1"
                      >
                        Rise (X)
                      </label>
                      <input
                        id="ratioX"
                        type="number"
                        min="0.1"
                        step="0.1"
                        value={ratioX}
                        onChange={(e) => setRatioX(e.target.value)}
                        placeholder="e.g. 4"
                        className="w-full bg-slate-800 border border-slate-600 rounded-lg p-3 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="pb-3 text-slate-400 text-lg font-bold">
                      : 12
                    </div>
                  </div>
                </div>
              )}

              {/* Span Width Input */}
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-5">
                <h2 className="text-sm font-medium text-slate-300 mb-4">
                  Span Width (optional)
                </h2>
                <div>
                  <label
                    htmlFor="spanM"
                    className="block text-xs text-slate-400 mb-1"
                  >
                    Span (metres)
                  </label>
                  <input
                    id="spanM"
                    type="number"
                    min="0"
                    step="0.1"
                    value={spanM}
                    onChange={(e) => setSpanM(e.target.value)}
                    placeholder="e.g. 10"
                    className="w-full bg-slate-800 border border-slate-600 rounded-lg p-3 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Enter the building span to calculate rafter length (wall plate
                    to ridge).
                  </p>
                </div>
              </div>

              {/* SVG Roof Pitch Visual */}
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-5">
                <h2 className="text-sm font-medium text-slate-300 mb-4">
                  Roof Pitch Visualisation
                </h2>
                <svg
                  viewBox={`0 0 ${svgW} ${svgH}`}
                  className="w-full max-w-md mx-auto"
                  aria-label={`Roof pitch triangle showing ${result ? result.angleDeg.toFixed(1) : 0} degrees`}
                >
                  {trianglePoints ? (
                    <>
                      {/* Triangle fill */}
                      <polygon
                        points={`${trianglePoints.bottomLeft.x},${trianglePoints.bottomLeft.y} ${trianglePoints.bottomRight.x},${trianglePoints.bottomRight.y} ${trianglePoints.topRight.x},${trianglePoints.topRight.y}`}
                        fill="rgba(59, 130, 246, 0.15)"
                        stroke="#3b82f6"
                        strokeWidth="2"
                      />
                      {/* Run label (bottom) */}
                      <text
                        x={(trianglePoints.bottomLeft.x + trianglePoints.bottomRight.x) / 2}
                        y={trianglePoints.bottomLeft.y + 14}
                        textAnchor="middle"
                        className="fill-slate-400 text-[10px]"
                      >
                        Run
                      </text>
                      {/* Rise label (right side) */}
                      <text
                        x={trianglePoints.bottomRight.x + 14}
                        y={(trianglePoints.bottomRight.y + trianglePoints.topRight.y) / 2}
                        textAnchor="start"
                        className="fill-slate-400 text-[10px]"
                      >
                        Rise
                      </text>
                      {/* Slope label */}
                      <text
                        x={(trianglePoints.bottomLeft.x + trianglePoints.topRight.x) / 2 - 10}
                        y={(trianglePoints.bottomLeft.y + trianglePoints.topRight.y) / 2 - 6}
                        textAnchor="middle"
                        className="fill-blue-400 text-[10px]"
                      >
                        Rafter
                      </text>
                      {/* Angle arc */}
                      <path
                        d={`M ${trianglePoints.bottomLeft.x + 30},${trianglePoints.bottomLeft.y} A 30 30 0 0 0 ${trianglePoints.bottomLeft.x + 30 * Math.cos(degToRad(result!.angleDeg))},${trianglePoints.bottomLeft.y - 30 * Math.sin(degToRad(result!.angleDeg))}`}
                        fill="none"
                        stroke="#f59e0b"
                        strokeWidth="1.5"
                      />
                      {/* Angle text */}
                      <text
                        x={trianglePoints.bottomLeft.x + 40}
                        y={trianglePoints.bottomLeft.y - 8}
                        className="fill-yellow-400 text-[10px] font-medium"
                      >
                        {result!.angleDeg.toFixed(1)}°
                      </text>
                      {/* Right angle indicator */}
                      <polyline
                        points={`${trianglePoints.bottomRight.x - 10},${trianglePoints.bottomRight.y} ${trianglePoints.bottomRight.x - 10},${trianglePoints.bottomRight.y - 10} ${trianglePoints.bottomRight.x},${trianglePoints.bottomRight.y - 10}`}
                        fill="none"
                        stroke="#94a3b8"
                        strokeWidth="1"
                      />
                    </>
                  ) : (
                    <text
                      x={svgW / 2}
                      y={svgH / 2}
                      textAnchor="middle"
                      className="fill-slate-500 text-[12px]"
                    >
                      Enter values to see pitch visualisation
                    </text>
                  )}
                </svg>
              </div>
            </div>

            {/* Right side: Results */}
            <div className="space-y-4">
              {/* Pitch Angle - Primary */}
              <div className="rounded-lg p-5 border bg-slate-800 border-slate-700">
                <div className="text-xs text-slate-400 mb-1">Pitch Angle</div>
                <div className="text-4xl font-bold text-blue-400">
                  {result ? `${result.angleDeg.toFixed(1)}°` : "—"}
                </div>
              </div>

              {/* Rise per Metre Run */}
              <div className="rounded-lg p-5 border bg-slate-800 border-slate-700">
                <div className="text-xs text-slate-400 mb-1">
                  Rise per Metre Run
                </div>
                <div className="text-2xl font-bold text-white">
                  {result ? `${result.risePerMetre.toFixed(0)} mm/m` : "—"}
                </div>
              </div>

              {/* Ratio */}
              <div className="rounded-lg p-5 border bg-slate-800 border-slate-700">
                <div className="text-xs text-slate-400 mb-1">Ratio (X:12)</div>
                <div className="text-2xl font-bold text-white">
                  {result ? `${result.ratio12.toFixed(2)} : 12` : "—"}
                </div>
              </div>

              {/* Slope Percentage */}
              <div className="rounded-lg p-5 border bg-slate-800 border-slate-700">
                <div className="text-xs text-slate-400 mb-1">
                  Slope Percentage
                </div>
                <div className="text-2xl font-bold text-white">
                  {result ? `${result.slopePercent.toFixed(1)}%` : "—"}
                </div>
              </div>

              {/* Rafter Length */}
              <div className="rounded-lg p-5 border bg-slate-800 border-slate-700">
                <div className="text-xs text-slate-400 mb-1">Rafter Length</div>
                <div className="text-2xl font-bold text-white">
                  {rafterLength ? `${rafterLength.toFixed(2)} m` : "—"}
                </div>
                {!spanM && (
                  <p className="text-xs text-slate-500 mt-1">
                    Enter span width to calculate
                  </p>
                )}
              </div>

              {/* Roof Area Multiplier */}
              <div className="rounded-lg p-5 border bg-slate-800 border-slate-700">
                <div className="text-xs text-slate-400 mb-1">
                  Roof Area Multiplier
                </div>
                <div className="text-2xl font-bold text-white">
                  {result
                    ? `× ${result.roofAreaMultiplier.toFixed(4)}`
                    : "—"}
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Multiply floor area by this factor to get roof area
                </p>
              </div>
            </div>
          </div>

          {/* How to Use */}
          <section className="mt-12 bg-slate-800 border border-slate-700 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-4">
              How to Use This Roof Pitch Calculator
            </h2>
            <ol className="list-decimal list-inside space-y-2 text-slate-400">
              <li>
                Select your input method: From Rise &amp; Run (in mm), From Angle
                (in degrees), or From Ratio (X:12 format).
              </li>
              <li>
                Enter the known values. For rise and run, enter measurements in
                millimetres. For angle, enter the pitch in degrees. For ratio,
                enter the rise value per 12 units of run.
              </li>
              <li>
                Optionally enter the building span width in metres to calculate
                the rafter length from wall plate to ridge.
              </li>
              <li>
                All results update in real time including the pitch angle, rise
                per metre, ratio, slope percentage, and roof area multiplier.
              </li>
              <li>
                The SVG diagram updates to visually show the roof pitch angle,
                helping you confirm the values make sense for your project.
              </li>
            </ol>
          </section>

          <RelatedTools currentSlug="roof-pitch-calculator" />

          {/* FAQ Section */}
          <section className="mt-16 border-t border-slate-700 pt-10">
            <h2 className="text-2xl font-bold text-white mb-6">
              Frequently Asked Questions
            </h2>

            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  What is a standard roof pitch in Australia?
                </h3>
                <p className="text-slate-400">
                  In Australia, 22.5 degrees is the most common roof pitch,
                  particularly for Colorbond steel roofing. Typical residential
                  roof pitches range from 15 to 25 degrees. Lower pitches (10-15
                  degrees) are common for skillion roofs and modern designs, while
                  steeper pitches (25-35 degrees) suit traditional styles and
                  areas with heavy rainfall.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  How do I calculate rafter length from roof pitch?
                </h3>
                <p className="text-slate-400">
                  Rafter length is calculated using the formula: Rafter Length =
                  (Span / 2) / cos(pitch angle). For example, with a 10-metre
                  span and a 22.5-degree pitch, the rafter length is (10 / 2) /
                  cos(22.5°) = 5 / 0.924 = 5.41 metres. This gives the slope
                  length from the wall plate to the ridge, excluding any eave
                  overhang.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  What is the minimum roof pitch for metal roofing?
                </h3>
                <p className="text-slate-400">
                  The minimum roof pitch for metal roofing in Australia depends on
                  the profile. Standard corrugated iron and Colorbond requires a
                  minimum of 5 degrees (1:12 ratio) with specific profiles like
                  Trimdek or Klip-Lok. Most standard profiles require a minimum of
                  10 degrees. Always check the manufacturer specifications and
                  local BCA requirements for your specific roofing material.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  What does a 4:12 roof pitch mean?
                </h3>
                <p className="text-slate-400">
                  A 4:12 roof pitch means the roof rises 4 units vertically for
                  every 12 units of horizontal run. This is equivalent to
                  approximately 18.4 degrees. The 4:12 pitch is a moderate slope
                  commonly used in residential construction. In metric terms, it
                  equates to roughly 333 mm of rise per metre of run.
                </p>
              </div>
            </div>
          </section>

          {/* Educational Content Section */}
          <section className="mt-16 border-t border-slate-700 pt-10">
            <h2 className="text-2xl font-bold text-white mb-6">
              Australian Roof Pitch Standards and Requirements
            </h2>
            <div className="prose prose-invert max-w-none text-slate-400 space-y-4">
              <p>
                Roof pitch is one of the most critical design decisions in
                Australian residential and commercial construction. The pitch
                affects water drainage, wind resistance, structural loading,
                insulation performance, and the overall aesthetic of the building.
                In Australia, roof pitch is typically expressed in degrees, though
                the ratio format (X:12) is also used, particularly when
                referencing American building resources.
              </p>
              <p>
                The Building Code of Australia (BCA), now part of the National
                Construction Code (NCC), does not prescribe a specific roof pitch
                but sets performance requirements for weatherproofing and
                structural adequacy. Roofing material manufacturers provide minimum
                pitch requirements for their products. For example, BlueScope
                Steel specifies minimum pitches for each Colorbond profile:
                Trimdek can go as low as 5 degrees, while Custom Orb corrugated
                roofing typically requires a minimum of 5 degrees with specific
                installation requirements. Standing seam profiles like Klip-Lok
                770 can achieve pitches as low as 1 degree in certain
                configurations.
              </p>
              <p>
                For tile roofing, which remains popular in many Australian
                suburbs, the minimum pitch is generally higher. Concrete and
                terracotta tiles typically require a minimum pitch of 20 degrees,
                with some flat profile tiles suitable for pitches as low as 15
                degrees when installed with sarking. The steeper pitch helps
                ensure water runs off the tiles effectively and reduces the risk
                of wind-driven rain penetrating the roof.
              </p>
              <p>
                When estimating materials for a roofing project, the roof area
                multiplier is essential. A flat roof (0 degrees) has a multiplier
                of 1.0, meaning the roof area equals the floor area. At 22.5
                degrees, the multiplier is approximately 1.082, meaning you need
                about 8.2% more roofing material than the floor area. At 45
                degrees, the multiplier jumps to 1.414 (the square root of 2).
                This multiplier applies to sheets, battens, sarking, and other
                area-dependent materials.
              </p>
              <p>
                Regional factors also influence pitch selection in Australia.
                Cyclone-prone areas in northern Queensland and Western Australia
                require pitches and fastening systems that meet specific wind
                loading requirements under AS 4055 and AS 1170.2. In bushfire-prone
                areas rated BAL-12.5 and above, roofing materials and their
                installation must comply with AS 3959, which can affect material
                choices and consequently the minimum achievable pitch. In alpine
                regions, steeper pitches help shed snow loads, while in hot, dry
                areas, lower pitches with adequate insulation can reduce the
                volume of roof space that needs cooling.
              </p>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
