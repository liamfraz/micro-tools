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

type Phase = "single" | "three";
type CableMaterial = "copper" | "aluminium";
type InstallationMethod = "conduit" | "clipped" | "tray" | "underground";

const CABLE_SIZES = [1, 1.5, 2.5, 4, 6, 10, 16, 25, 35, 50, 70, 95, 120, 150, 185, 240, 300];

const COPPER_IMPEDANCE: Record<number, number> = {
  1: 44.0, 1.5: 29.0, 2.5: 18.0, 4: 11.0, 6: 7.3, 10: 4.4,
  16: 2.8, 25: 1.75, 35: 1.25, 50: 0.88, 70: 0.63, 95: 0.46,
  120: 0.37, 150: 0.30, 185: 0.245, 240: 0.19, 300: 0.155,
};

const ALUMINIUM_MULTIPLIER = 1.6;

// Simplified current capacity lookup (Amps) per cable size per installation method
// Based on representative values from AS/NZS 3008 for thermoplastic (V-75) cables
const CURRENT_CAPACITY: Record<InstallationMethod, Record<number, number>> = {
  conduit: {
    1: 14, 1.5: 17.5, 2.5: 24, 4: 32, 6: 41, 10: 56,
    16: 73, 25: 97, 35: 119, 50: 144, 70: 184, 95: 222,
    120: 259, 150: 294, 185: 336, 240: 392, 300: 446,
  },
  clipped: {
    1: 16, 1.5: 20, 2.5: 27, 4: 36, 6: 46, 10: 63,
    16: 84, 25: 110, 35: 135, 50: 164, 70: 210, 95: 253,
    120: 294, 150: 335, 185: 382, 240: 448, 300: 510,
  },
  tray: {
    1: 15, 1.5: 19, 2.5: 26, 4: 35, 6: 44, 10: 61,
    16: 80, 25: 106, 35: 130, 50: 157, 70: 200, 95: 242,
    120: 281, 150: 320, 185: 365, 240: 428, 300: 488,
  },
  underground: {
    1: 13, 1.5: 16, 2.5: 22, 4: 29, 6: 37, 10: 51,
    16: 67, 25: 89, 35: 109, 50: 132, 70: 168, 95: 203,
    120: 237, 150: 270, 185: 308, 240: 360, 300: 410,
  },
};

function getImpedance(size: number, material: CableMaterial): number {
  const copperZ = COPPER_IMPEDANCE[size] ?? 0;
  return material === "aluminium" ? copperZ * ALUMINIUM_MULTIPLIER : copperZ;
}

function getCurrentCapacity(
  size: number,
  method: InstallationMethod,
  material: CableMaterial
): number {
  const copperCapacity = CURRENT_CAPACITY[method][size] ?? 0;
  // Aluminium typically has ~77% of copper current capacity
  return material === "aluminium"
    ? Math.round(copperCapacity * 0.77)
    : copperCapacity;
}

function calculateVoltageDrop(
  phase: Phase,
  current: number,
  length: number,
  impedance: number,
  powerFactor: number
): number {
  const multiplier = phase === "single" ? 2 : 1.732;
  return (multiplier * length * current * impedance * powerFactor) / 1000;
}

interface CableSizeResult {
  size: number;
  voltageDrop: number;
  voltageDropPercent: number;
  currentCapacity: number;
  passVoltageDrop: boolean;
  passCurrentCapacity: boolean;
}

function calculateAllSizes(
  phase: Phase,
  voltage: number,
  current: number,
  length: number,
  powerFactor: number,
  material: CableMaterial,
  method: InstallationMethod,
  maxVdPercent: number
): CableSizeResult[] {
  return CABLE_SIZES.map((size) => {
    const impedance = getImpedance(size, material);
    const vd = calculateVoltageDrop(phase, current, length, impedance, powerFactor);
    const vdPercent = voltage > 0 ? (vd / voltage) * 100 : 0;
    const capacity = getCurrentCapacity(size, method, material);
    return {
      size,
      voltageDrop: vd,
      voltageDropPercent: vdPercent,
      currentCapacity: capacity,
      passVoltageDrop: vdPercent <= maxVdPercent,
      passCurrentCapacity: capacity >= current,
    };
  });
}

function findMinimumSize(results: CableSizeResult[]): CableSizeResult | null {
  return (
    results.find((r) => r.passVoltageDrop && r.passCurrentCapacity) ?? null
  );
}

const INSTALLATION_LABELS: Record<InstallationMethod, string> = {
  conduit: "Enclosed in conduit",
  clipped: "Clipped direct",
  tray: "On cable tray",
  underground: "Underground",
};

export default function ElectricalCableSizeCalculatorPage() {
  const [phase, setPhase] = useState<Phase>("single");
  const [current, setCurrent] = useState("32");
  const [length, setLength] = useState("30");
  const [powerFactor, setPowerFactor] = useState("0.8");
  const [material, setMaterial] = useState<CableMaterial>("copper");
  const [method, setMethod] = useState<InstallationMethod>("conduit");
  const [maxVdPercent, setMaxVdPercent] = useState("5");

  const voltage = phase === "single" ? 230 : 400;

  const results = useMemo(() => {
    const I = parseFloat(current) || 0;
    const L = parseFloat(length) || 0;
    const pf = parseFloat(powerFactor) || 0.8;
    const maxVd = parseFloat(maxVdPercent) || 5;
    if (I <= 0 || L <= 0) return [];
    return calculateAllSizes(phase, voltage, I, L, pf, material, method, maxVd);
  }, [phase, voltage, current, length, powerFactor, material, method, maxVdPercent]);

  const recommended = useMemo(() => findMinimumSize(results), [results]);

  return (
    <>
      <title>
        Electrical Cable Size Calculator - Voltage Drop &amp; Current Capacity |
        Free Online Tool
      </title>
      <meta
        name="description"
        content="Free electrical cable size calculator for Australian installations. Calculate voltage drop, current capacity, and minimum cable size per AS/NZS 3008. Supports copper and aluminium cables, single and three phase."
      />
      <JsonLd
        data={[
          generateWebAppSchema({
            slug: "electrical-cable-size-calculator",
            name: "Electrical Cable Size Calculator",
            description:
              "Calculate voltage drop, current capacity, and minimum cable size for Australian electrical installations per AS/NZS 3008",
            category: "construction",
          }),
          generateBreadcrumbSchema({
            slug: "electrical-cable-size-calculator",
            name: "Electrical Cable Size Calculator",
            description:
              "Calculate voltage drop, current capacity, and minimum cable size for Australian electrical installations per AS/NZS 3008",
            category: "construction",
          }),
          generateFAQSchema([
            {
              question:
                "What is the maximum voltage drop allowed in Australia?",
              answer:
                "Under AS/NZS 3000 (Wiring Rules), the maximum allowable voltage drop from the point of supply to the final subcircuit is 5%. This is measured from the main switchboard to the most distant point of the installation. For consumer mains (from the point of supply to the main switchboard), the limit is typically 2%, with the remaining 3% for submains and final subcircuits combined.",
            },
            {
              question: "What cable size do I need for a 32A circuit?",
              answer:
                "The cable size for a 32A circuit depends on the cable run length, installation method, and allowable voltage drop. For short runs (under 15 metres) in conduit, 4mm² copper cable is often sufficient. For longer runs, you may need 6mm² or even 10mm² to keep voltage drop within the 5% limit. Always use a cable size calculator and verify against AS/NZS 3008 tables.",
            },
            {
              question: "What is AS/NZS 3008?",
              answer:
                "AS/NZS 3008 is the Australian and New Zealand Standard for the selection of cables. It provides detailed tables and methods for determining the correct cable size based on current-carrying capacity, voltage drop, short-circuit capacity, and earth fault loop impedance. It is the primary reference standard used by licensed electricians for cable selection in Australia and New Zealand.",
            },
            {
              question:
                "Copper vs aluminium cable — which should I use?",
              answer:
                "Copper cable is the most common choice for residential and light commercial installations in Australia due to its superior conductivity, smaller size for the same current rating, and easier termination. Aluminium cable is more cost-effective for larger cable runs such as consumer mains and submains (typically 35mm² and above), and is commonly used in overhead power lines and underground distribution. Aluminium requires larger cross-sectional area for the same current capacity and needs special termination considerations.",
            },
          ]),
        ]}
      />

      <div className="min-h-screen bg-slate-900 text-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <ToolBreadcrumb slug="electrical-cable-size-calculator" />

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
              Electrical Cable Size Calculator
            </h1>
            <p className="text-slate-400 max-w-2xl text-lg">
              Calculate minimum cable size, voltage drop, and current capacity
              for Australian electrical installations. Based on AS/NZS 3008
              cable selection principles.
            </p>
          </div>

          {/* Disclaimer */}
          <div className="mb-6 bg-amber-900/30 border border-amber-700 rounded-lg p-4">
            <p className="text-amber-300 text-sm">
              <strong>Disclaimer:</strong> This calculator provides estimates for
              guidance only. All electrical work in Australia must comply with
              AS/NZS 3000 and AS/NZS 3008 and be performed by a licensed
              electrician.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left side: Inputs */}
            <div className="lg:col-span-2 space-y-6">
              {/* Phase Selection */}
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-5">
                <span className="block text-sm font-medium text-slate-300 mb-3">
                  Supply Voltage / Phase
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPhase("single")}
                    className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${
                      phase === "single"
                        ? "bg-blue-600 text-white"
                        : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                    }`}
                  >
                    230V Single Phase
                  </button>
                  <button
                    onClick={() => setPhase("three")}
                    className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${
                      phase === "three"
                        ? "bg-blue-600 text-white"
                        : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                    }`}
                  >
                    400V Three Phase
                  </button>
                </div>
              </div>

              {/* Cable Material */}
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-5">
                <span className="block text-sm font-medium text-slate-300 mb-3">
                  Cable Material
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setMaterial("copper")}
                    className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${
                      material === "copper"
                        ? "bg-blue-600 text-white"
                        : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                    }`}
                  >
                    Copper
                  </button>
                  <button
                    onClick={() => setMaterial("aluminium")}
                    className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${
                      material === "aluminium"
                        ? "bg-blue-600 text-white"
                        : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                    }`}
                  >
                    Aluminium
                  </button>
                </div>
              </div>

              {/* Current and Length */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-slate-800 border border-slate-700 rounded-lg p-5">
                  <label
                    htmlFor="current"
                    className="block text-sm font-medium text-slate-300 mb-2"
                  >
                    Current (Amps)
                  </label>
                  <input
                    id="current"
                    type="number"
                    min="0"
                    step="1"
                    value={current}
                    onChange={(e) => setCurrent(e.target.value)}
                    placeholder="e.g. 32"
                    className="w-full bg-slate-800 border border-slate-600 rounded-lg p-3 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="bg-slate-800 border border-slate-700 rounded-lg p-5">
                  <label
                    htmlFor="length"
                    className="block text-sm font-medium text-slate-300 mb-2"
                  >
                    Cable Length (metres, one way)
                  </label>
                  <input
                    id="length"
                    type="number"
                    min="0"
                    step="1"
                    value={length}
                    onChange={(e) => setLength(e.target.value)}
                    placeholder="e.g. 30"
                    className="w-full bg-slate-800 border border-slate-600 rounded-lg p-3 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Installation Method */}
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-5">
                <label
                  htmlFor="installation"
                  className="block text-sm font-medium text-slate-300 mb-2"
                >
                  Installation Method
                </label>
                <select
                  id="installation"
                  value={method}
                  onChange={(e) =>
                    setMethod(e.target.value as InstallationMethod)
                  }
                  className="w-full bg-slate-800 border border-slate-600 rounded-lg p-3 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {(
                    Object.entries(INSTALLATION_LABELS) as [
                      InstallationMethod,
                      string,
                    ][]
                  ).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Power Factor and Max VD */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-slate-800 border border-slate-700 rounded-lg p-5">
                  <label
                    htmlFor="power-factor"
                    className="block text-sm font-medium text-slate-300 mb-2"
                  >
                    Power Factor
                  </label>
                  <input
                    id="power-factor"
                    type="number"
                    min="0.7"
                    max="1.0"
                    step="0.05"
                    value={powerFactor}
                    onChange={(e) => setPowerFactor(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-600 rounded-lg p-3 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-xs text-slate-500 mt-1 block">
                    Range: 0.7 to 1.0 (default 0.8)
                  </span>
                </div>

                <div className="bg-slate-800 border border-slate-700 rounded-lg p-5">
                  <label
                    htmlFor="max-vd"
                    className="block text-sm font-medium text-slate-300 mb-2"
                  >
                    Max Allowable Voltage Drop (%)
                  </label>
                  <input
                    id="max-vd"
                    type="number"
                    min="1"
                    max="10"
                    step="0.5"
                    value={maxVdPercent}
                    onChange={(e) => setMaxVdPercent(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-600 rounded-lg p-3 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-xs text-slate-500 mt-1 block">
                    AS/NZS 3000 standard: 5%
                  </span>
                </div>
              </div>
            </div>

            {/* Right side: Results */}
            <div className="space-y-4">
              {/* Recommended Cable Size */}
              <div className="rounded-lg p-5 border bg-slate-800 border-slate-700">
                <div className="text-xs text-slate-400 mb-1">
                  Minimum Cable Size
                </div>
                <div
                  className={`text-4xl font-bold ${
                    recommended ? "text-green-400" : "text-slate-500"
                  }`}
                >
                  {recommended ? `${recommended.size} mm²` : "—"}
                </div>
                {!recommended && results.length > 0 && (
                  <p className="text-red-400 text-xs mt-2">
                    No standard cable size meets both voltage drop and current
                    capacity requirements. Consider reducing cable length or
                    splitting the circuit.
                  </p>
                )}
              </div>

              {/* Voltage Drop */}
              <div className="rounded-lg p-5 border bg-slate-800 border-slate-700">
                <div className="text-xs text-slate-400 mb-1">
                  Voltage Drop (selected size)
                </div>
                <div className="text-2xl font-bold text-white">
                  {recommended
                    ? `${recommended.voltageDrop.toFixed(2)} V`
                    : "—"}
                </div>
              </div>

              {/* Voltage Drop % */}
              <div className="rounded-lg p-5 border bg-slate-800 border-slate-700">
                <div className="text-xs text-slate-400 mb-1">
                  Voltage Drop (%)
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-bold text-white">
                    {recommended
                      ? `${recommended.voltageDropPercent.toFixed(2)}%`
                      : "—"}
                  </span>
                  {recommended && (
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-bold ${
                        recommended.passVoltageDrop
                          ? "bg-green-900 text-green-300"
                          : "bg-red-900 text-red-300"
                      }`}
                    >
                      {recommended.passVoltageDrop ? "PASS" : "FAIL"}
                    </span>
                  )}
                </div>
              </div>

              {/* Current Capacity */}
              <div className="rounded-lg p-5 border bg-slate-800 border-slate-700">
                <div className="text-xs text-slate-400 mb-1">
                  Current Capacity (selected size)
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-bold text-white">
                    {recommended ? `${recommended.currentCapacity} A` : "—"}
                  </span>
                  {recommended && (
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-bold ${
                        recommended.passCurrentCapacity
                          ? "bg-green-900 text-green-300"
                          : "bg-red-900 text-red-300"
                      }`}
                    >
                      {recommended.passCurrentCapacity ? "PASS" : "FAIL"}
                    </span>
                  )}
                </div>
              </div>

              {/* Summary */}
              <div className="rounded-lg p-5 border bg-slate-800 border-slate-700">
                <div className="text-xs text-slate-400 mb-2">Parameters</div>
                <div className="space-y-1 text-sm text-slate-300">
                  <div className="flex justify-between">
                    <span>Voltage</span>
                    <span className="text-white">{voltage}V</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Phase</span>
                    <span className="text-white">
                      {phase === "single" ? "Single" : "Three"} Phase
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Material</span>
                    <span className="text-white capitalize">{material}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Method</span>
                    <span className="text-white">
                      {INSTALLATION_LABELS[method]}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Cable Size Comparison Table */}
          {results.length > 0 && (
            <section className="mt-8">
              <h2 className="text-xl font-semibold text-white mb-4">
                All Cable Sizes Comparison
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr className="border-b border-slate-700 text-slate-400">
                      <th className="py-3 px-4">
                        Size (mm²)
                      </th>
                      <th className="py-3 px-4">
                        Voltage Drop (V)
                      </th>
                      <th className="py-3 px-4">
                        Voltage Drop (%)
                      </th>
                      <th className="py-3 px-4">
                        Current Capacity (A)
                      </th>
                      <th className="py-3 px-4">
                        VD Status
                      </th>
                      <th className="py-3 px-4">
                        Capacity Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((r) => {
                      const isRecommended =
                        recommended && r.size === recommended.size;
                      return (
                        <tr
                          key={r.size}
                          className={`border-b border-slate-700/50 ${
                            isRecommended
                              ? "bg-blue-900/30 border-blue-700"
                              : "hover:bg-slate-800/50"
                          }`}
                        >
                          <td className="py-2 px-4 font-medium text-white">
                            {r.size}
                            {isRecommended && (
                              <span className="ml-2 text-xs text-blue-400 font-normal">
                                Recommended
                              </span>
                            )}
                          </td>
                          <td className="py-2 px-4 text-slate-300">
                            {r.voltageDrop.toFixed(2)}
                          </td>
                          <td className="py-2 px-4 text-slate-300">
                            {r.voltageDropPercent.toFixed(2)}%
                          </td>
                          <td className="py-2 px-4 text-slate-300">
                            {r.currentCapacity}
                          </td>
                          <td className="py-2 px-4">
                            <span
                              className={`px-2 py-0.5 rounded text-xs font-bold ${
                                r.passVoltageDrop
                                  ? "bg-green-900/60 text-green-300"
                                  : "bg-red-900/60 text-red-300"
                              }`}
                            >
                              {r.passVoltageDrop ? "PASS" : "FAIL"}
                            </span>
                          </td>
                          <td className="py-2 px-4">
                            <span
                              className={`px-2 py-0.5 rounded text-xs font-bold ${
                                r.passCurrentCapacity
                                  ? "bg-green-900/60 text-green-300"
                                  : "bg-red-900/60 text-red-300"
                              }`}
                            >
                              {r.passCurrentCapacity ? "PASS" : "FAIL"}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* How to Use */}
          <section className="mt-12 bg-slate-800 border border-slate-700 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-4">
              How to Use This Cable Size Calculator
            </h2>
            <ol className="list-decimal list-inside space-y-2 text-slate-400">
              <li>
                Select the supply voltage and phase configuration (230V single
                phase or 400V three phase).
              </li>
              <li>
                Choose the cable material: copper (most common for residential)
                or aluminium (common for larger submains).
              </li>
              <li>
                Enter the circuit current in amps and the one-way cable length in
                metres.
              </li>
              <li>
                Select the installation method (conduit, clipped direct, cable
                tray, or underground).
              </li>
              <li>
                Adjust the power factor and maximum voltage drop percentage if
                needed (defaults are 0.8 and 5% per AS/NZS 3000).
              </li>
              <li>
                The calculator instantly displays the minimum cable size, voltage
                drop, current capacity, and a comparison table of all standard
                sizes.
              </li>
            </ol>
          </section>

          <RelatedTools currentSlug="electrical-cable-size-calculator" />

          {/* FAQ Section */}
          <section className="mt-16 border-t border-slate-700 pt-10">
            <h2 className="text-2xl font-bold text-white mb-6">
              Frequently Asked Questions
            </h2>

            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  What is the maximum voltage drop allowed in Australia?
                </h3>
                <p className="text-slate-400">
                  Under AS/NZS 3000 (the Australian Wiring Rules), the maximum
                  allowable voltage drop from the point of supply to the final
                  subcircuit is 5%. This is typically split as 2% for the
                  consumer mains (from point of supply to the main switchboard)
                  and 3% for submains and final subcircuits combined. Keeping
                  voltage drop within limits ensures equipment operates correctly
                  and prevents excessive energy losses in the cabling.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  What cable size do I need for a 32A circuit?
                </h3>
                <p className="text-slate-400">
                  The required cable size for a 32A circuit depends on the cable
                  run length, installation method, and allowable voltage drop.
                  For short runs under 15 metres installed in conduit, 4mm²
                  copper cable is often sufficient. However, for longer runs of
                  30 metres or more, you may need 6mm² or 10mm² to keep the
                  voltage drop within the 5% limit. Always verify using AS/NZS
                  3008 tables and consult a licensed electrician for final cable
                  selection.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  What is AS/NZS 3008?
                </h3>
                <p className="text-slate-400">
                  AS/NZS 3008 (Electrical installations — Selection of cables)
                  is the Australian and New Zealand Standard that provides
                  detailed guidance for cable selection. It contains tables for
                  current-carrying capacity, voltage drop, short-circuit
                  capacity, and earth fault loop impedance for various cable
                  types, sizes, and installation methods. Licensed electricians
                  and electrical engineers use this standard alongside AS/NZS
                  3000 (Wiring Rules) to ensure safe and compliant electrical
                  installations.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Copper vs aluminium cable — which should I use?
                </h3>
                <p className="text-slate-400">
                  Copper cable is the standard choice for residential and light
                  commercial installations in Australia. It offers superior
                  conductivity, requires smaller cable sizes for the same current
                  rating, and is easier to terminate. Aluminium cable is more
                  cost-effective for larger installations such as consumer mains
                  and submains (typically 35mm² and above) and is widely used for
                  overhead lines and underground distribution networks.
                  Aluminium requires larger cross-sectional areas than copper for
                  equivalent current capacity and has specific termination
                  requirements to prevent issues with oxidation and thermal
                  expansion.
                </p>
              </div>
            </div>
          </section>

          {/* Educational Content Section */}
          <section className="mt-16 border-t border-slate-700 pt-10">
            <h2 className="text-2xl font-bold text-white mb-6">
              Cable Sizing in Australian Electrical Installations
            </h2>
            <div className="prose prose-invert max-w-none text-slate-400 space-y-4">
              <p>
                Cable sizing is a fundamental aspect of electrical design in
                Australia, governed primarily by two key standards: AS/NZS 3000
                (Wiring Rules) and AS/NZS 3008 (Selection of Cables). Correct
                cable sizing ensures that circuits can safely carry the required
                load current without overheating, that voltage at the point of
                use remains within acceptable limits, and that protective
                devices can operate correctly under fault conditions. Undersized
                cables can lead to excessive heat generation, insulation
                degradation, fire risk, and poor equipment performance due to
                low voltage.
              </p>
              <p>
                The two primary factors in cable selection are current-carrying
                capacity and voltage drop. Current-carrying capacity (or
                ampacity) is the maximum current a cable can continuously carry
                without exceeding its rated temperature. This depends on the
                cable construction, insulation type, installation method,
                ambient temperature, and grouping with other cables. AS/NZS 3008
                provides detailed tables for each combination of these factors.
                For example, a cable enclosed in conduit has lower capacity than
                one clipped directly to a wall, because the conduit restricts
                heat dissipation.
              </p>
              <p>
                Voltage drop is the reduction in voltage along the length of a
                cable due to its inherent resistance and reactance. Long cable
                runs with high currents experience greater voltage drop, which
                can cause motors to run slowly, lights to dim, and sensitive
                electronics to malfunction. AS/NZS 3000 limits the total voltage
                drop from the point of supply to any point of use to 5% of the
                nominal voltage. In practice, this means designers must balance
                cable size against run length — longer circuits require larger
                cables to maintain adequate voltage at the load.
              </p>
              <p>
                Australian cable sizes follow a standardised series measured in
                square millimetres (mm²) of conductor cross-sectional area. The
                common sizes range from 1mm² for light-duty circuits up to
                300mm² and beyond for heavy industrial feeders. Residential
                installations typically use 1.5mm² for lighting circuits, 2.5mm²
                for general power outlets, and 4mm² to 6mm² for dedicated
                appliance circuits such as ovens, cooktops, and air conditioners.
                Submains and consumer mains cables are commonly 16mm² to 70mm²
                depending on the total load of the installation.
              </p>
              <p>
                Beyond current capacity and voltage drop, electricians must also
                consider short-circuit withstand capability, earth fault loop
                impedance (to ensure protective devices trip within required
                timeframes), and any applicable derating factors for ambient
                temperature, cable grouping, or thermal insulation. While this
                calculator provides a useful starting point for cable selection,
                a full design must account for all of these factors in accordance
                with AS/NZS 3008 and should always be verified by a licensed
                electrical professional.
              </p>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
