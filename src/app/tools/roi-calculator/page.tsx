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

export default function ROICalculatorPage() {
  const [initialInvestment, setInitialInvestment] = useState("");
  const [finalValue, setFinalValue] = useState("");
  const [years, setYears] = useState("");

  const results = useMemo(() => {
    const initial = parseFloat(initialInvestment);
    const final_ = parseFloat(finalValue);
    const duration = parseFloat(years);

    if (isNaN(initial) || isNaN(final_) || initial === 0) {
      return null;
    }

    const netProfit = final_ - initial;
    const roiPercent = ((final_ - initial) / initial) * 100;

    let annualizedROI: number | null = null;
    if (!isNaN(duration) && duration > 0) {
      annualizedROI =
        (Math.pow(final_ / initial, 1 / duration) - 1) * 100;
    }

    return { netProfit, roiPercent, annualizedROI };
  }, [initialInvestment, finalValue, years]);

  const isPositive = results !== null && results.roiPercent >= 0;

  return (
    <>
      <title>ROI Calculator - Calculate Return on Investment | DevTools Hub</title>
      <meta
        name="description"
        content="Calculate return on investment (ROI) instantly. Enter your investment cost and returns to see ROI percentage, net profit, and annualized ROI. Free ROI calculator."
      />
      <JsonLd
        data={[
          generateWebAppSchema({
            slug: "roi-calculator",
            name: "ROI Calculator",
            description:
              "Calculate return on investment (ROI) percentage, net profit, and annualized ROI",
            category: "finance",
          }),
          generateBreadcrumbSchema({
            slug: "roi-calculator",
            name: "ROI Calculator",
            description:
              "Calculate return on investment (ROI) percentage, net profit, and annualized ROI",
            category: "finance",
          }),
          generateFAQSchema([
            {
              question: "What is ROI and how is it calculated?",
              answer:
                "ROI (Return on Investment) measures the profitability of an investment as a percentage. It is calculated using the formula: ROI = ((Final Value - Initial Investment) / Initial Investment) x 100. For example, if you invest $1,000 and it grows to $1,500, your ROI is 50%.",
            },
            {
              question: "What is annualized ROI?",
              answer:
                "Annualized ROI adjusts the total return to reflect a yearly rate, making it easier to compare investments of different durations. It is calculated as: ((Final Value / Initial Investment)^(1/years) - 1) x 100. This gives you the equivalent annual return rate.",
            },
            {
              question: "What is a good ROI percentage?",
              answer:
                "A good ROI depends on the type of investment and its risk level. For stock markets, a 7-10% annual return is historically average. Real estate typically targets 8-12%. High-risk investments may aim for 20% or more. Any positive ROI means your investment gained value.",
            },
            {
              question: "Can ROI be negative?",
              answer:
                "Yes. A negative ROI means you lost money on the investment. For example, if you invested $1,000 and the final value is $800, the ROI is -20%. This calculator clearly indicates negative returns with red highlighting so you can quickly assess losses.",
            },
          ]),
        ]}
      />

      <div className="min-h-screen bg-slate-900 text-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <ToolBreadcrumb slug="roi-calculator" />

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
              ROI Calculator
            </h1>
            <p className="text-slate-400 max-w-2xl text-lg">
              Calculate your return on investment instantly. Enter your initial
              investment and final value to see ROI percentage, net profit, and
              annualized ROI.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Input form */}
            <div className="lg:col-span-2">
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 space-y-5">
                <h2 className="text-lg font-semibold text-white mb-2">
                  Investment Details
                </h2>

                <div>
                  <label
                    htmlFor="initial-investment"
                    className="block text-sm font-medium text-slate-300 mb-1"
                  >
                    Initial Investment ($)
                  </label>
                  <input
                    id="initial-investment"
                    type="number"
                    value={initialInvestment}
                    onChange={(e) => setInitialInvestment(e.target.value)}
                    placeholder="e.g. 10000"
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label
                    htmlFor="final-value"
                    className="block text-sm font-medium text-slate-300 mb-1"
                  >
                    Final Value / Returns ($)
                  </label>
                  <input
                    id="final-value"
                    type="number"
                    value={finalValue}
                    onChange={(e) => setFinalValue(e.target.value)}
                    placeholder="e.g. 15000"
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label
                    htmlFor="years"
                    className="block text-sm font-medium text-slate-300 mb-1"
                  >
                    Investment Duration (years){" "}
                    <span className="text-slate-500">- optional, for annualized ROI</span>
                  </label>
                  <input
                    id="years"
                    type="number"
                    value={years}
                    onChange={(e) => setYears(e.target.value)}
                    placeholder="e.g. 3"
                    min="0"
                    step="0.1"
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* How to Use section */}
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 mt-6">
                <h2 className="text-lg font-semibold text-white mb-3">
                  How to Use
                </h2>
                <div className="space-y-3 text-slate-400 text-sm">
                  <p>
                    <strong className="text-slate-300">Simple ROI:</strong> Enter
                    your initial investment amount and the final value (what you
                    got back). The calculator applies the formula:{" "}
                    <code className="bg-slate-700 px-1.5 py-0.5 rounded text-blue-400">
                      ROI = ((Final Value - Initial Investment) / Initial
                      Investment) x 100
                    </code>
                  </p>
                  <p>
                    <strong className="text-slate-300">Annualized ROI:</strong>{" "}
                    Add the investment duration in years to see the equivalent
                    annual return. This uses the compound formula:{" "}
                    <code className="bg-slate-700 px-1.5 py-0.5 rounded text-blue-400">
                      Annualized ROI = ((Final / Initial)^(1/years) - 1) x 100
                    </code>
                  </p>
                  <p>
                    <strong className="text-slate-300">When to use:</strong>{" "}
                    Compare profitability across different investments, evaluate
                    business decisions, or assess the performance of stocks, real
                    estate, or any asset over time.
                  </p>
                </div>
              </div>
            </div>

            {/* Results sidebar */}
            <div className="space-y-6">
              {/* ROI Percentage */}
              <div
                className={`bg-slate-800 border rounded-lg p-5 ${
                  results !== null
                    ? isPositive
                      ? "border-green-600"
                      : "border-red-600"
                    : "border-slate-700"
                }`}
              >
                <h2 className="text-sm font-medium text-slate-400 mb-1">
                  ROI Percentage
                </h2>
                <div
                  className={`text-3xl font-bold ${
                    results !== null
                      ? isPositive
                        ? "text-green-400"
                        : "text-red-400"
                      : "text-slate-500"
                  }`}
                >
                  {results !== null
                    ? `${results.roiPercent >= 0 ? "+" : ""}${results.roiPercent.toFixed(2)}%`
                    : "--"}
                </div>
              </div>

              {/* Net Profit */}
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-5">
                <h2 className="text-sm font-medium text-slate-400 mb-1">
                  Net Profit / Loss
                </h2>
                <div
                  className={`text-3xl font-bold ${
                    results !== null
                      ? isPositive
                        ? "text-green-400"
                        : "text-red-400"
                      : "text-slate-500"
                  }`}
                >
                  {results !== null
                    ? `${results.netProfit >= 0 ? "+" : ""}$${results.netProfit.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                    : "--"}
                </div>
              </div>

              {/* Annualized ROI */}
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-5">
                <h2 className="text-sm font-medium text-slate-400 mb-1">
                  Annualized ROI
                </h2>
                <div
                  className={`text-3xl font-bold ${
                    results !== null && results.annualizedROI !== null
                      ? results.annualizedROI >= 0
                        ? "text-green-400"
                        : "text-red-400"
                      : "text-slate-500"
                  }`}
                >
                  {results !== null && results.annualizedROI !== null
                    ? `${results.annualizedROI >= 0 ? "+" : ""}${results.annualizedROI.toFixed(2)}%`
                    : "--"}
                </div>
                {results !== null && results.annualizedROI === null && (
                  <p className="text-xs text-slate-500 mt-1">
                    Enter duration to calculate
                  </p>
                )}
              </div>

              {/* Summary */}
              {results !== null && (
                <div className="bg-slate-800 border border-slate-700 rounded-lg p-5">
                  <h2 className="text-sm font-medium text-slate-400 mb-2">
                    Summary
                  </h2>
                  <p className="text-sm text-slate-300">
                    An investment of{" "}
                    <strong className="text-white">
                      ${parseFloat(initialInvestment).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </strong>{" "}
                    returned{" "}
                    <strong className="text-white">
                      ${parseFloat(finalValue).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </strong>
                    , resulting in a{" "}
                    <strong className={isPositive ? "text-green-400" : "text-red-400"}>
                      {results.roiPercent >= 0 ? "gain" : "loss"} of{" "}
                      {Math.abs(results.roiPercent).toFixed(2)}%
                    </strong>
                    .
                    {results.annualizedROI !== null && (
                      <>
                        {" "}
                        Over{" "}
                        <strong className="text-white">
                          {parseFloat(years)} year{parseFloat(years) !== 1 ? "s" : ""}
                        </strong>
                        , that equals an annualized return of{" "}
                        <strong
                          className={
                            results.annualizedROI >= 0
                              ? "text-green-400"
                              : "text-red-400"
                          }
                        >
                          {results.annualizedROI >= 0 ? "+" : ""}
                          {results.annualizedROI.toFixed(2)}%
                        </strong>{" "}
                        per year.
                      </>
                    )}
                  </p>
                </div>
              )}
            </div>
          </div>

          <RelatedTools currentSlug="roi-calculator" />

          {/* FAQ Section */}
          <section className="mt-16 border-t border-slate-700 pt-10">
            <h2 className="text-2xl font-bold text-white mb-6">
              Frequently Asked Questions
            </h2>

            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  What is ROI and how is it calculated?
                </h3>
                <p className="text-slate-400">
                  ROI (Return on Investment) measures the profitability of an
                  investment as a percentage. It is calculated using the formula:
                  ROI = ((Final Value - Initial Investment) / Initial Investment)
                  x 100. For example, if you invest $1,000 and it grows to
                  $1,500, your ROI is 50%.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  What is annualized ROI?
                </h3>
                <p className="text-slate-400">
                  Annualized ROI adjusts the total return to reflect a yearly
                  rate, making it easier to compare investments of different
                  durations. It is calculated as: ((Final Value / Initial
                  Investment)^(1/years) - 1) x 100. This gives you the
                  equivalent annual return rate.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  What is a good ROI percentage?
                </h3>
                <p className="text-slate-400">
                  A good ROI depends on the type of investment and its risk
                  level. For stock markets, a 7-10% annual return is
                  historically average. Real estate typically targets 8-12%.
                  High-risk investments may aim for 20% or more. Any positive
                  ROI means your investment gained value.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Can ROI be negative?
                </h3>
                <p className="text-slate-400">
                  Yes. A negative ROI means you lost money on the investment.
                  For example, if you invested $1,000 and the final value is
                  $800, the ROI is -20%. This calculator clearly indicates
                  negative returns with red highlighting so you can quickly
                  assess losses.
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
