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

type CalcMode = "cost-markup" | "cost-selling" | "selling-margin";

const MODES: { key: CalcMode; label: string; description: string }[] = [
  {
    key: "cost-markup",
    label: "Cost + Markup %",
    description: "Calculate selling price from cost and markup percentage",
  },
  {
    key: "cost-selling",
    label: "Cost + Selling Price",
    description: "Calculate markup percentage from cost and selling price",
  },
  {
    key: "selling-margin",
    label: "Selling Price + Margin %",
    description: "Calculate cost from selling price and profit margin",
  },
];

const COMMON_MARKUPS = [
  { markup: 25, margin: 20, costExample: 100, sellingPrice: 125 },
  { markup: 33.33, margin: 25, costExample: 100, sellingPrice: 133.33 },
  { markup: 50, margin: 33.33, costExample: 100, sellingPrice: 150 },
  { markup: 75, margin: 42.86, costExample: 100, sellingPrice: 175 },
  { markup: 100, margin: 50, costExample: 100, sellingPrice: 200 },
  { markup: 150, margin: 60, costExample: 100, sellingPrice: 250 },
  { markup: 200, margin: 66.67, costExample: 100, sellingPrice: 300 },
];

export default function MarkupCalculatorPage() {
  const [mode, setMode] = useState<CalcMode>("cost-markup");
  const [cost, setCost] = useState("");
  const [sellingPrice, setSellingPrice] = useState("");
  const [markupPercent, setMarkupPercent] = useState("");
  const [marginPercent, setMarginPercent] = useState("");

  const results = useMemo(() => {
    let calcCost = 0;
    let calcSellingPrice = 0;

    if (mode === "cost-markup") {
      const c = parseFloat(cost);
      const m = parseFloat(markupPercent);
      if (isNaN(c) || isNaN(m) || c < 0) return null;
      calcCost = c;
      calcSellingPrice = c * (1 + m / 100);
    } else if (mode === "cost-selling") {
      const c = parseFloat(cost);
      const s = parseFloat(sellingPrice);
      if (isNaN(c) || isNaN(s) || c <= 0) return null;
      calcCost = c;
      calcSellingPrice = s;
    } else if (mode === "selling-margin") {
      const s = parseFloat(sellingPrice);
      const mg = parseFloat(marginPercent);
      if (isNaN(s) || isNaN(mg) || mg >= 100) return null;
      calcSellingPrice = s;
      calcCost = s * (1 - mg / 100);
    }

    if (calcSellingPrice < 0 || calcCost < 0) return null;

    const profit = calcSellingPrice - calcCost;
    const markup = calcCost > 0 ? ((profit / calcCost) * 100) : 0;
    const margin = calcSellingPrice > 0 ? ((profit / calcSellingPrice) * 100) : 0;
    const costProportion = calcSellingPrice > 0 ? (calcCost / calcSellingPrice) * 100 : 0;

    return {
      cost: calcCost,
      sellingPrice: calcSellingPrice,
      profit,
      markup,
      margin,
      costProportion: Math.min(100, Math.max(0, costProportion)),
    };
  }, [mode, cost, sellingPrice, markupPercent, marginPercent]);

  const formatCurrency = (value: number) => {
    return value.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const formatPercent = (value: number) => {
    return value.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  return (
    <>
      <title>Markup Calculator - Calculate Markup &amp; Margin | DevTools Hub</title>
      <meta
        name="description"
        content="Calculate markup percentage, profit margin, and selling price from cost. Convert between markup and margin instantly. Free markup and margin calculator."
      />
      <JsonLd
        data={[
          generateWebAppSchema({
            slug: "markup-calculator",
            name: "Markup Calculator",
            description:
              "Calculate markup percentage, profit margin, and selling price from cost",
            category: "finance",
          }),
          generateBreadcrumbSchema({
            slug: "markup-calculator",
            name: "Markup Calculator",
            description:
              "Calculate markup percentage, profit margin, and selling price from cost",
            category: "finance",
          }),
          generateFAQSchema([
            {
              question: "What is the difference between markup and margin?",
              answer:
                "Markup is the percentage added to the cost price to get the selling price, calculated as ((Selling Price - Cost) / Cost) x 100. Margin is the percentage of the selling price that is profit, calculated as ((Selling Price - Cost) / Selling Price) x 100. For example, a product costing $100 sold for $150 has a 50% markup but only a 33.33% margin.",
            },
            {
              question: "How do I convert markup to margin?",
              answer:
                "To convert markup to margin, use the formula: Margin = Markup / (1 + Markup). For example, a 50% markup (0.50) gives a margin of 0.50 / 1.50 = 0.3333, or 33.33%. Conversely, to convert margin to markup: Markup = Margin / (1 - Margin).",
            },
            {
              question: "What is a good markup percentage?",
              answer:
                "A good markup percentage varies by industry. Retail clothing often uses 50-100% markup, restaurants typically use 200-300% on food items, and technology products may use 20-50%. The right markup depends on your operating costs, competition, and target profit margin.",
            },
            {
              question: "Why is markup always higher than margin?",
              answer:
                "Markup is always higher than margin because they use different denominators. Markup divides profit by the smaller number (cost), while margin divides profit by the larger number (selling price). Since cost is always less than or equal to selling price, the markup percentage will always be greater than or equal to the margin percentage.",
            },
          ]),
        ]}
      />

      <div className="min-h-screen bg-slate-900 text-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <ToolBreadcrumb slug="markup-calculator" />

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
              Markup Calculator
            </h1>
            <p className="text-slate-400 max-w-2xl text-lg">
              Calculate markup percentage, profit margin, and selling price from
              cost. Convert between markup and margin instantly.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left side: Mode selector + inputs */}
            <div className="lg:col-span-2 space-y-6">
              {/* Mode selector */}
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-5">
                <h2 className="text-lg font-semibold text-white mb-4">
                  Calculation Mode
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {MODES.map((m) => (
                    <button
                      key={m.key}
                      onClick={() => setMode(m.key)}
                      className={`p-3 rounded-lg border text-left transition-colors ${
                        mode === m.key
                          ? "bg-blue-600 border-blue-500 text-white"
                          : "bg-slate-700 border-slate-600 text-slate-300 hover:border-slate-500"
                      }`}
                    >
                      <div className="font-medium text-sm">{m.label}</div>
                      <div
                        className={`text-xs mt-1 ${
                          mode === m.key ? "text-blue-200" : "text-slate-400"
                        }`}
                      >
                        {m.description}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Input fields */}
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-5">
                <h2 className="text-lg font-semibold text-white mb-4">
                  Input Values
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {(mode === "cost-markup" || mode === "cost-selling") && (
                    <InputField
                      label="Cost Price ($)"
                      value={cost}
                      onChange={setCost}
                      placeholder="e.g. 100.00"
                    />
                  )}
                  {mode === "cost-markup" && (
                    <InputField
                      label="Markup (%)"
                      value={markupPercent}
                      onChange={setMarkupPercent}
                      placeholder="e.g. 50"
                    />
                  )}
                  {(mode === "cost-selling" || mode === "selling-margin") && (
                    <InputField
                      label="Selling Price ($)"
                      value={sellingPrice}
                      onChange={setSellingPrice}
                      placeholder="e.g. 150.00"
                    />
                  )}
                  {mode === "selling-margin" && (
                    <InputField
                      label="Profit Margin (%)"
                      value={marginPercent}
                      onChange={setMarginPercent}
                      placeholder="e.g. 33.33"
                    />
                  )}
                </div>
              </div>

              {/* Visual breakdown bar */}
              {results && results.sellingPrice > 0 && (
                <div className="bg-slate-800 border border-slate-700 rounded-lg p-5">
                  <h2 className="text-lg font-semibold text-white mb-4">
                    Price Breakdown
                  </h2>
                  <div className="space-y-3">
                    <div className="flex rounded-lg overflow-hidden h-10">
                      <div
                        className="bg-blue-600 flex items-center justify-center text-xs font-medium text-white transition-all duration-300"
                        style={{ width: `${results.costProportion}%` }}
                      >
                        {results.costProportion > 15 &&
                          `Cost: $${formatCurrency(results.cost)}`}
                      </div>
                      <div
                        className="bg-green-600 flex items-center justify-center text-xs font-medium text-white transition-all duration-300"
                        style={{
                          width: `${100 - results.costProportion}%`,
                        }}
                      >
                        {100 - results.costProportion > 15 &&
                          `Profit: $${formatCurrency(results.profit)}`}
                      </div>
                    </div>
                    <div className="flex justify-between text-xs text-slate-400">
                      <span>
                        Cost: {formatPercent(results.costProportion)}%
                      </span>
                      <span>
                        Profit: {formatPercent(100 - results.costProportion)}%
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right side: Results */}
            <div className="space-y-4">
              <ResultCard
                label="Selling Price"
                value={
                  results ? `$${formatCurrency(results.sellingPrice)}` : "--"
                }
                color="text-white"
              />
              <ResultCard
                label="Cost"
                value={results ? `$${formatCurrency(results.cost)}` : "--"}
                color="text-blue-400"
              />
              <ResultCard
                label="Markup %"
                value={
                  results ? `${formatPercent(results.markup)}%` : "--"
                }
                color="text-yellow-400"
              />
              <ResultCard
                label="Profit Margin %"
                value={
                  results ? `${formatPercent(results.margin)}%` : "--"
                }
                color="text-green-400"
              />
              <ResultCard
                label="Profit"
                value={
                  results ? `$${formatCurrency(results.profit)}` : "--"
                }
                color="text-emerald-400"
              />
            </div>
          </div>

          {/* Reference table */}
          <section className="mt-12">
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-5">
              <h2 className="text-lg font-semibold text-white mb-4">
                Common Markup &amp; Margin Conversions
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-slate-400 border-b border-slate-600">
                      <th className="py-2 pr-4">Markup %</th>
                      <th className="py-2 pr-4">Margin %</th>
                      <th className="py-2 pr-4">Cost ($100)</th>
                      <th className="py-2">Selling Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {COMMON_MARKUPS.map((row) => (
                      <tr
                        key={row.markup}
                        className="border-b border-slate-700 last:border-0"
                      >
                        <td className="py-2 pr-4 text-yellow-400">
                          {row.markup.toFixed(2)}%
                        </td>
                        <td className="py-2 pr-4 text-green-400">
                          {row.margin.toFixed(2)}%
                        </td>
                        <td className="py-2 pr-4 text-slate-300">
                          ${row.costExample.toFixed(2)}
                        </td>
                        <td className="py-2 text-white">
                          ${row.sellingPrice.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          {/* How to Use section */}
          <section className="mt-12">
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
              <h2 className="text-xl font-bold text-white mb-4">
                Understanding Markup vs Margin
              </h2>
              <div className="space-y-4 text-slate-400">
                <p>
                  <strong className="text-white">Markup</strong> and{" "}
                  <strong className="text-white">margin</strong> are two ways of
                  expressing the profit on a product, but they use different base
                  values for their calculations.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-slate-700/50 rounded-lg p-4">
                    <h3 className="text-white font-semibold mb-2">
                      Markup Formula
                    </h3>
                    <p className="text-sm font-mono text-yellow-400">
                      Markup % = ((Selling Price - Cost) / Cost) x 100
                    </p>
                    <p className="text-sm mt-2">
                      Markup is based on the <em>cost</em> of the item. A 50%
                      markup on a $100 cost item means the selling price is $150.
                    </p>
                  </div>
                  <div className="bg-slate-700/50 rounded-lg p-4">
                    <h3 className="text-white font-semibold mb-2">
                      Margin Formula
                    </h3>
                    <p className="text-sm font-mono text-green-400">
                      Margin % = ((Selling Price - Cost) / Selling Price) x 100
                    </p>
                    <p className="text-sm mt-2">
                      Margin is based on the <em>selling price</em>. A $100 cost
                      item sold for $150 has a margin of 33.33%.
                    </p>
                  </div>
                </div>
                <p>
                  <strong className="text-white">How to use this tool:</strong>{" "}
                  Select a calculation mode above based on the values you know.
                  Enter your values and the calculator will instantly show all
                  related figures including selling price, cost, markup
                  percentage, profit margin, and total profit.
                </p>
              </div>
            </div>
          </section>

          <RelatedTools currentSlug="markup-calculator" />

          {/* FAQ Section */}
          <section className="mt-16 border-t border-slate-700 pt-10">
            <h2 className="text-2xl font-bold text-white mb-6">
              Frequently Asked Questions
            </h2>

            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  What is the difference between markup and margin?
                </h3>
                <p className="text-slate-400">
                  Markup is the percentage added to the cost price to get the
                  selling price, calculated as ((Selling Price - Cost) / Cost) x
                  100. Margin is the percentage of the selling price that is
                  profit, calculated as ((Selling Price - Cost) / Selling Price) x
                  100. For example, a product costing $100 sold for $150 has a 50%
                  markup but only a 33.33% margin.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  How do I convert markup to margin?
                </h3>
                <p className="text-slate-400">
                  To convert markup to margin, use the formula: Margin = Markup /
                  (1 + Markup). For example, a 50% markup (0.50) gives a margin of
                  0.50 / 1.50 = 0.3333, or 33.33%. Conversely, to convert margin
                  to markup: Markup = Margin / (1 - Margin).
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  What is a good markup percentage?
                </h3>
                <p className="text-slate-400">
                  A good markup percentage varies by industry. Retail clothing
                  often uses 50-100% markup, restaurants typically use 200-300% on
                  food items, and technology products may use 20-50%. The right
                  markup depends on your operating costs, competition, and target
                  profit margin.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Why is markup always higher than margin?
                </h3>
                <p className="text-slate-400">
                  Markup is always higher than margin because they use different
                  denominators. Markup divides profit by the smaller number (cost),
                  while margin divides profit by the larger number (selling price).
                  Since cost is always less than or equal to selling price, the
                  markup percentage will always be greater than or equal to the
                  margin percentage.
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}

function InputField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-300 mb-1">
        {label}
      </label>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        step="any"
        min="0"
        className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  );
}

function ResultCard({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
      <div className="text-xs text-slate-400 mb-1">{label}</div>
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
    </div>
  );
}
