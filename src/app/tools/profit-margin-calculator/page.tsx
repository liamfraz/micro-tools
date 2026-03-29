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

type InputMode = "revenue-cost" | "revenue-profit";

const MARGIN_SCENARIOS = [5, 10, 15, 20, 25, 30, 40, 50, 60, 75];

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatPercent(value: number): string {
  return `${value.toFixed(2)}%`;
}

export default function ProfitMarginCalculatorPage() {
  const [inputMode, setInputMode] = useState<InputMode>("revenue-cost");
  const [revenue, setRevenue] = useState<string>("10000");
  const [cost, setCost] = useState<string>("6000");
  const [profit, setProfit] = useState<string>("4000");
  const [operatingExpenses, setOperatingExpenses] = useState<string>("");

  const results = useMemo(() => {
    const rev = parseFloat(revenue) || 0;
    const opEx = parseFloat(operatingExpenses) || 0;

    let grossProfit: number;
    let costOfGoods: number;

    if (inputMode === "revenue-cost") {
      costOfGoods = parseFloat(cost) || 0;
      grossProfit = rev - costOfGoods;
    } else {
      grossProfit = parseFloat(profit) || 0;
      costOfGoods = rev - grossProfit;
    }

    if (rev <= 0) {
      return null;
    }

    const profitMargin = (grossProfit / rev) * 100;
    const markup = costOfGoods > 0 ? (grossProfit / costOfGoods) * 100 : 0;
    const costRatio = (costOfGoods / rev) * 100;

    const netProfit = grossProfit - opEx;
    const netMargin = (netProfit / rev) * 100;

    const scenarios = MARGIN_SCENARIOS.map((targetMargin) => {
      const scenarioProfit = rev * (targetMargin / 100);
      const scenarioCost = rev - scenarioProfit;
      const scenarioMarkup =
        scenarioCost > 0 ? (scenarioProfit / scenarioCost) * 100 : 0;
      return {
        margin: targetMargin,
        profit: scenarioProfit,
        cost: scenarioCost,
        markup: scenarioMarkup,
      };
    });

    return {
      grossProfit,
      costOfGoods,
      profitMargin,
      markup,
      costRatio,
      netProfit,
      netMargin,
      hasOpEx: opEx > 0,
      operatingExpenses: opEx,
      revenue: rev,
      scenarios,
    };
  }, [revenue, cost, profit, operatingExpenses, inputMode]);

  const costBarWidth =
    results && results.revenue > 0
      ? Math.max(0, Math.min(100, results.costRatio))
      : 0;
  const profitBarWidth = 100 - costBarWidth;

  return (
    <>
      <title>
        Profit Margin Calculator - Calculate Gross &amp; Net Margin | DevTools
        Hub
      </title>
      <meta
        name="description"
        content="Free profit margin calculator. Calculate gross margin, net margin, markup percentage, and cost ratio instantly. Compare margin scenarios for any revenue amount."
      />
      <JsonLd
        data={[
          generateWebAppSchema({
            slug: "profit-margin-calculator",
            name: "Profit Margin Calculator",
            description:
              "Calculate gross margin, net margin, markup percentage, and cost ratio. Compare margin scenarios for any revenue amount.",
            category: "finance",
          }),
          generateBreadcrumbSchema({
            slug: "profit-margin-calculator",
            name: "Profit Margin Calculator",
            description:
              "Calculate gross margin, net margin, markup percentage, and cost ratio. Compare margin scenarios for any revenue amount.",
            category: "finance",
          }),
          generateFAQSchema([
            {
              question: "What is profit margin?",
              answer:
                "Profit margin is the percentage of revenue that remains as profit after subtracting costs. It is calculated as (Profit / Revenue) x 100. For example, if you sell a product for $100 and it costs $60 to produce, your profit margin is 40%. Profit margin measures how efficiently a business converts revenue into profit.",
            },
            {
              question:
                "What is the difference between profit margin and markup?",
              answer:
                "Profit margin and markup both measure profitability but use different bases. Margin is profit as a percentage of revenue (selling price): Margin = Profit / Revenue x 100. Markup is profit as a percentage of cost: Markup = Profit / Cost x 100. For example, a product costing $60 sold for $100 has a 40% margin but a 66.67% markup. Margin is always lower than markup for the same transaction.",
            },
            {
              question: "What is a good profit margin?",
              answer:
                "A good profit margin varies by industry. Retail businesses typically see 2-5% net margins, while software companies may achieve 20-40% or more. Service businesses often target 15-25%. Generally, a gross margin above 50% is considered strong, while a net margin above 10% is healthy for most industries. The key is comparing your margin to industry benchmarks.",
            },
            {
              question:
                "What is the difference between gross margin and net margin?",
              answer:
                "Gross margin measures profit after subtracting only the direct cost of goods sold (COGS) from revenue. Net margin goes further by also subtracting operating expenses like rent, salaries, marketing, and utilities. Gross margin shows production efficiency, while net margin shows overall business profitability. Net margin is always equal to or lower than gross margin.",
            },
          ]),
        ]}
      />

      <div className="min-h-screen bg-slate-900 text-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <ToolBreadcrumb slug="profit-margin-calculator" />

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
              Profit Margin Calculator
            </h1>
            <p className="text-slate-400 max-w-2xl text-lg">
              Calculate gross profit, profit margin, markup percentage, and cost
              ratio. Add operating expenses to compare gross vs net margin.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Input form */}
            <div className="lg:col-span-2">
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 space-y-5">
                <h2 className="text-lg font-semibold text-white mb-2">
                  Input Details
                </h2>

                {/* Mode toggle */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Input Mode
                  </label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setInputMode("revenue-cost")}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        inputMode === "revenue-cost"
                          ? "bg-blue-600 text-white"
                          : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                      }`}
                    >
                      Revenue &amp; Cost
                    </button>
                    <button
                      onClick={() => setInputMode("revenue-profit")}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        inputMode === "revenue-profit"
                          ? "bg-blue-600 text-white"
                          : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                      }`}
                    >
                      Revenue &amp; Profit
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label
                      htmlFor="revenue"
                      className="block text-sm font-medium text-slate-300 mb-1"
                    >
                      Revenue ($)
                    </label>
                    <input
                      id="revenue"
                      type="number"
                      min="0"
                      step="100"
                      value={revenue}
                      onChange={(e) => setRevenue(e.target.value)}
                      className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g. 10000"
                    />
                  </div>

                  {inputMode === "revenue-cost" ? (
                    <div>
                      <label
                        htmlFor="cost"
                        className="block text-sm font-medium text-slate-300 mb-1"
                      >
                        Cost of Goods ($)
                      </label>
                      <input
                        id="cost"
                        type="number"
                        min="0"
                        step="100"
                        value={cost}
                        onChange={(e) => setCost(e.target.value)}
                        className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g. 6000"
                      />
                    </div>
                  ) : (
                    <div>
                      <label
                        htmlFor="profit"
                        className="block text-sm font-medium text-slate-300 mb-1"
                      >
                        Profit ($)
                      </label>
                      <input
                        id="profit"
                        type="number"
                        min="0"
                        step="100"
                        value={profit}
                        onChange={(e) => setProfit(e.target.value)}
                        className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g. 4000"
                      />
                    </div>
                  )}

                  <div className="sm:col-span-2">
                    <label
                      htmlFor="operating-expenses"
                      className="block text-sm font-medium text-slate-300 mb-1"
                    >
                      Operating Expenses ($){" "}
                      <span className="text-slate-500">
                        - optional, for net margin
                      </span>
                    </label>
                    <input
                      id="operating-expenses"
                      type="number"
                      min="0"
                      step="100"
                      value={operatingExpenses}
                      onChange={(e) => setOperatingExpenses(e.target.value)}
                      className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g. 1500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Results sidebar */}
            <div className="space-y-6">
              {/* Gross Profit */}
              <div
                className={`bg-slate-800 border rounded-lg p-5 ${
                  results !== null && results.grossProfit >= 0
                    ? "border-green-600"
                    : results !== null
                      ? "border-red-600"
                      : "border-slate-700"
                }`}
              >
                <h2 className="text-sm font-medium text-slate-400 mb-1">
                  Gross Profit
                </h2>
                <div
                  className={`text-3xl font-bold ${
                    results !== null
                      ? results.grossProfit >= 0
                        ? "text-green-400"
                        : "text-red-400"
                      : "text-slate-500"
                  }`}
                >
                  {results !== null
                    ? formatCurrency(results.grossProfit)
                    : "--"}
                </div>
              </div>

              {/* Profit Margin */}
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-5">
                <h2 className="text-sm font-medium text-slate-400 mb-1">
                  Profit Margin
                </h2>
                <div
                  className={`text-3xl font-bold ${
                    results !== null
                      ? results.profitMargin >= 0
                        ? "text-green-400"
                        : "text-red-400"
                      : "text-slate-500"
                  }`}
                >
                  {results !== null
                    ? formatPercent(results.profitMargin)
                    : "--"}
                </div>
              </div>

              {/* Markup */}
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-5">
                <h2 className="text-sm font-medium text-slate-400 mb-1">
                  Markup
                </h2>
                <div
                  className={`text-3xl font-bold ${
                    results !== null ? "text-blue-400" : "text-slate-500"
                  }`}
                >
                  {results !== null ? formatPercent(results.markup) : "--"}
                </div>
              </div>

              {/* Cost Ratio */}
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-5">
                <h2 className="text-sm font-medium text-slate-400 mb-1">
                  Cost Ratio
                </h2>
                <div
                  className={`text-3xl font-bold ${
                    results !== null ? "text-amber-400" : "text-slate-500"
                  }`}
                >
                  {results !== null ? formatPercent(results.costRatio) : "--"}
                </div>
              </div>

              {/* Net Margin (only shown when operating expenses are entered) */}
              {results !== null && results.hasOpEx && (
                <div className="bg-slate-800 border border-slate-700 rounded-lg p-5">
                  <h2 className="text-sm font-medium text-slate-400 mb-1">
                    Net Profit
                  </h2>
                  <div
                    className={`text-2xl font-bold ${
                      results.netProfit >= 0 ? "text-green-400" : "text-red-400"
                    }`}
                  >
                    {formatCurrency(results.netProfit)}
                  </div>
                  <div className="mt-2 flex items-center justify-between text-sm">
                    <span className="text-slate-400">Net Margin</span>
                    <span
                      className={`font-semibold ${
                        results.netMargin >= 0
                          ? "text-green-400"
                          : "text-red-400"
                      }`}
                    >
                      {formatPercent(results.netMargin)}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center justify-between text-sm">
                    <span className="text-slate-400">Gross Margin</span>
                    <span className="font-semibold text-slate-300">
                      {formatPercent(results.profitMargin)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Visual Cost vs Profit Bar */}
          {results !== null && (
            <div className="mt-8 bg-slate-800 border border-slate-700 rounded-lg p-5">
              <h2 className="text-lg font-semibold text-white mb-4">
                Revenue Breakdown
              </h2>
              <div className="w-full h-8 rounded-full overflow-hidden flex bg-slate-700">
                <div
                  className="bg-red-500/80 h-full transition-all duration-300"
                  style={{ width: `${costBarWidth}%` }}
                  title={`Cost: ${formatPercent(results.costRatio)}`}
                />
                <div
                  className="bg-green-500/80 h-full transition-all duration-300"
                  style={{ width: `${profitBarWidth}%` }}
                  title={`Profit: ${formatPercent(results.profitMargin)}`}
                />
              </div>
              <div className="flex justify-between mt-3 text-xs text-slate-400">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-red-500/80 inline-block" />
                  Cost ({formatPercent(results.costRatio)})
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-green-500/80 inline-block" />
                  Profit ({formatPercent(results.profitMargin)})
                </div>
              </div>
              {results.hasOpEx && (
                <div className="mt-4">
                  <div className="text-xs text-slate-500 mb-2">
                    With Operating Expenses
                  </div>
                  <div className="w-full h-4 rounded-full overflow-hidden flex bg-slate-700">
                    <div
                      className="bg-red-500/80 h-full transition-all duration-300"
                      style={{ width: `${costBarWidth}%` }}
                    />
                    <div
                      className="bg-amber-500/80 h-full transition-all duration-300"
                      style={{
                        width: `${Math.max(0, Math.min(100 - costBarWidth, (results.operatingExpenses / results.revenue) * 100))}%`,
                      }}
                    />
                    <div
                      className="bg-green-500/80 h-full transition-all duration-300"
                      style={{
                        width: `${Math.max(0, (results.netProfit / results.revenue) * 100)}%`,
                      }}
                    />
                  </div>
                  <div className="flex justify-between mt-2 text-xs text-slate-500">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded bg-amber-500/80 inline-block" />
                      OpEx (
                      {formatPercent(
                        (results.operatingExpenses / results.revenue) * 100
                      )}
                      )
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded bg-green-500/80 inline-block" />
                      Net Profit ({formatPercent(results.netMargin)})
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Margin Scenarios Table */}
          {results !== null && (
            <div className="mt-8 bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
              <div className="p-5 border-b border-slate-700">
                <h2 className="text-lg font-semibold text-white">
                  Margin Scenarios for {formatCurrency(results.revenue)} Revenue
                </h2>
                <p className="text-sm text-slate-400 mt-1">
                  See what different margin targets look like at your revenue
                  level.
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-700 text-slate-400">
                      <th className="text-left px-5 py-3 font-medium">
                        Target Margin
                      </th>
                      <th className="text-right px-5 py-3 font-medium">
                        Profit
                      </th>
                      <th className="text-right px-5 py-3 font-medium">
                        Max Cost
                      </th>
                      <th className="text-right px-5 py-3 font-medium">
                        Markup
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.scenarios.map((row) => {
                      const isCurrentApprox =
                        Math.abs(row.margin - results.profitMargin) < 2.5;
                      return (
                        <tr
                          key={row.margin}
                          className={`border-b border-slate-700/50 transition-colors ${
                            isCurrentApprox
                              ? "bg-blue-500/10"
                              : "hover:bg-slate-700/30"
                          }`}
                        >
                          <td className="px-5 py-3 text-slate-300">
                            {row.margin}%
                            {isCurrentApprox && (
                              <span className="ml-2 text-xs text-blue-400 font-medium">
                                (current)
                              </span>
                            )}
                          </td>
                          <td className="px-5 py-3 text-right text-green-400 font-medium">
                            {formatCurrency(row.profit)}
                          </td>
                          <td className="px-5 py-3 text-right text-slate-300">
                            {formatCurrency(row.cost)}
                          </td>
                          <td className="px-5 py-3 text-right text-blue-400">
                            {formatPercent(row.markup)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* How to Use / SEO content */}
          <section className="mt-12 bg-slate-800 border border-slate-700 rounded-lg p-6">
            <h2 className="text-2xl font-bold text-white mb-4">
              How to Use the Profit Margin Calculator
            </h2>
            <div className="text-slate-400 space-y-3">
              <p>
                This profit margin calculator helps you quickly determine how
                much of your revenue is actual profit. Choose your input mode
                based on the data you have: enter revenue and cost of goods, or
                revenue and profit directly.
              </p>
              <p>
                The calculator computes four key metrics instantly:{" "}
                <strong className="text-slate-300">Gross Profit</strong>{" "}
                (revenue minus cost),{" "}
                <strong className="text-slate-300">Profit Margin</strong>{" "}
                (profit as a percentage of revenue),{" "}
                <strong className="text-slate-300">Markup</strong> (profit as a
                percentage of cost), and{" "}
                <strong className="text-slate-300">Cost Ratio</strong> (cost as
                a percentage of revenue). The formulas used are:{" "}
                <code className="bg-slate-700 px-1.5 py-0.5 rounded text-sm text-slate-300">
                  Margin = (Profit / Revenue) x 100
                </code>{" "}
                and{" "}
                <code className="bg-slate-700 px-1.5 py-0.5 rounded text-sm text-slate-300">
                  Markup = (Profit / Cost) x 100
                </code>
                .
              </p>
              <p>
                For a more complete picture, add your operating expenses to see
                both gross and net margins side by side. The comparison table
                below shows what different margin targets would look like at your
                current revenue level. All calculations run entirely in your
                browser with no data sent to any server.
              </p>
            </div>
          </section>

          <RelatedTools currentSlug="profit-margin-calculator" />

          {/* FAQ Section */}
          <section className="mt-16 border-t border-slate-700 pt-10">
            <h2 className="text-2xl font-bold text-white mb-6">
              Frequently Asked Questions
            </h2>

            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  What is profit margin?
                </h3>
                <p className="text-slate-400">
                  Profit margin is the percentage of revenue that remains as
                  profit after subtracting costs. It is calculated as (Profit /
                  Revenue) x 100. For example, if you sell a product for $100
                  and it costs $60 to produce, your profit margin is 40%. Profit
                  margin measures how efficiently a business converts revenue
                  into profit.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  What is the difference between profit margin and markup?
                </h3>
                <p className="text-slate-400">
                  Profit margin and markup both measure profitability but use
                  different bases. Margin is profit as a percentage of revenue
                  (selling price): Margin = Profit / Revenue x 100. Markup is
                  profit as a percentage of cost: Markup = Profit / Cost x 100.
                  For example, a product costing $60 sold for $100 has a 40%
                  margin but a 66.67% markup. Margin is always lower than markup
                  for the same transaction.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  What is a good profit margin?
                </h3>
                <p className="text-slate-400">
                  A good profit margin varies by industry. Retail businesses
                  typically see 2-5% net margins, while software companies may
                  achieve 20-40% or more. Service businesses often target
                  15-25%. Generally, a gross margin above 50% is considered
                  strong, while a net margin above 10% is healthy for most
                  industries. The key is comparing your margin to industry
                  benchmarks.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  What is the difference between gross margin and net margin?
                </h3>
                <p className="text-slate-400">
                  Gross margin measures profit after subtracting only the direct
                  cost of goods sold (COGS) from revenue. Net margin goes
                  further by also subtracting operating expenses like rent,
                  salaries, marketing, and utilities. Gross margin shows
                  production efficiency, while net margin shows overall business
                  profitability. Net margin is always equal to or lower than
                  gross margin.
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
