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

const TIP_PRESETS = [10, 15, 18, 20, 25];

export default function TipCalculatorPage() {
  const [billAmount, setBillAmount] = useState("");
  const [tipPercent, setTipPercent] = useState(18);
  const [customTip, setCustomTip] = useState("");
  const [isCustom, setIsCustom] = useState(false);
  const [splitCount, setSplitCount] = useState(1);

  const activeTip = isCustom ? parseFloat(customTip) || 0 : tipPercent;
  const bill = parseFloat(billAmount) || 0;

  const results = useMemo(() => {
    const tipAmount = bill * (activeTip / 100);
    const total = bill + tipAmount;
    const perPersonTip = splitCount > 0 ? tipAmount / splitCount : 0;
    const perPersonTotal = splitCount > 0 ? total / splitCount : 0;

    return { tipAmount, total, perPersonTip, perPersonTotal };
  }, [bill, activeTip, splitCount]);

  const comparison = useMemo(() => {
    return TIP_PRESETS.map((pct) => {
      const tip = bill * (pct / 100);
      const total = bill + tip;
      const perPerson = splitCount > 0 ? total / splitCount : 0;
      return { pct, tip, total, perPerson };
    });
  }, [bill, splitCount]);

  function fmt(n: number): string {
    return n.toFixed(2);
  }

  function handlePreset(pct: number) {
    setIsCustom(false);
    setTipPercent(pct);
  }

  function handleCustomChange(value: string) {
    setIsCustom(true);
    setCustomTip(value);
  }

  return (
    <>
      <title>Tip Calculator - Calculate Tips & Split Bills | DevTools Hub</title>
      <meta
        name="description"
        content="Calculate tips and split bills easily. Choose tip percentage, split between multiple people, and see per-person amounts. Free online tip calculator."
      />
      <JsonLd
        data={[
          generateWebAppSchema({
            slug: "tip-calculator",
            name: "Tip Calculator",
            description:
              "Calculate tips and split bills easily with customizable tip percentages",
            category: "finance",
          }),
          generateBreadcrumbSchema({
            slug: "tip-calculator",
            name: "Tip Calculator",
            description:
              "Calculate tips and split bills easily with customizable tip percentages",
            category: "finance",
          }),
          generateFAQSchema([
            {
              question: "What is a standard tip percentage?",
              answer:
                "In the United States, a standard tip at restaurants is between 15% and 20% of the pre-tax bill. For exceptional service, 25% or more is common. In other countries, tipping customs vary widely — some include service charges automatically.",
            },
            {
              question: "Should I tip on the pre-tax or post-tax amount?",
              answer:
                "Etiquette experts generally recommend tipping on the pre-tax subtotal. However, tipping on the post-tax total is also common and perfectly acceptable. The difference is usually small.",
            },
            {
              question: "How do I split a bill with tip evenly?",
              answer:
                "Enter the total bill amount, select your desired tip percentage, and set the number of people splitting the bill. The calculator will show each person's share of both the tip and the total amount.",
            },
            {
              question: "Is this tip calculator free to use?",
              answer:
                "Yes, this tip calculator is completely free and runs entirely in your browser. No data is sent to any server, and there are no usage limits.",
            },
          ]),
        ]}
      />

      <div className="min-h-screen bg-slate-900 text-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <ToolBreadcrumb slug="tip-calculator" />

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
              Tip Calculator
            </h1>
            <p className="text-slate-400 max-w-2xl text-lg">
              Calculate tips and split bills easily. Choose a tip percentage,
              split between multiple people, and see per-person amounts
              instantly.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left side: Inputs */}
            <div className="lg:col-span-2 space-y-6">
              {/* Bill Amount */}
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-5">
                <label
                  htmlFor="bill-amount"
                  className="block text-sm font-medium text-slate-300 mb-2"
                >
                  Bill Amount ($)
                </label>
                <input
                  id="bill-amount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={billAmount}
                  onChange={(e) => setBillAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Tip Percentage */}
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-5">
                <span className="block text-sm font-medium text-slate-300 mb-3">
                  Tip Percentage
                </span>
                <div className="flex flex-wrap gap-2 mb-4">
                  {TIP_PRESETS.map((pct) => (
                    <button
                      key={pct}
                      onClick={() => handlePreset(pct)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        !isCustom && tipPercent === pct
                          ? "bg-blue-600 text-white"
                          : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                      }`}
                    >
                      {pct}%
                    </button>
                  ))}
                </div>
                <label
                  htmlFor="custom-tip"
                  className="block text-xs text-slate-400 mb-1"
                >
                  Custom tip %
                </label>
                <input
                  id="custom-tip"
                  type="number"
                  min="0"
                  step="1"
                  value={isCustom ? customTip : ""}
                  onChange={(e) => handleCustomChange(e.target.value)}
                  onFocus={() => setIsCustom(true)}
                  placeholder="Enter custom %"
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Split Between */}
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-5">
                <label
                  htmlFor="split-count"
                  className="block text-sm font-medium text-slate-300 mb-2"
                >
                  Split Between (people)
                </label>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setSplitCount((c) => Math.max(1, c - 1))}
                    className="w-10 h-10 rounded-lg bg-slate-700 text-slate-300 hover:bg-slate-600 flex items-center justify-center text-lg font-bold transition-colors"
                  >
                    -
                  </button>
                  <input
                    id="split-count"
                    type="number"
                    min="1"
                    value={splitCount}
                    onChange={(e) =>
                      setSplitCount(Math.max(1, parseInt(e.target.value) || 1))
                    }
                    className="w-20 text-center bg-slate-700 border border-slate-600 rounded-lg px-2 py-2 text-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={() => setSplitCount((c) => c + 1)}
                    className="w-10 h-10 rounded-lg bg-slate-700 text-slate-300 hover:bg-slate-600 flex items-center justify-center text-lg font-bold transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            {/* Right side: Results */}
            <div className="space-y-4">
              <ResultCard
                label="Tip Amount"
                value={`$${fmt(results.tipAmount)}`}
                highlight={false}
              />
              <ResultCard
                label="Total with Tip"
                value={`$${fmt(results.total)}`}
                highlight={true}
              />
              {splitCount > 1 && (
                <>
                  <ResultCard
                    label="Per Person Tip"
                    value={`$${fmt(results.perPersonTip)}`}
                    highlight={false}
                  />
                  <ResultCard
                    label="Per Person Total"
                    value={`$${fmt(results.perPersonTotal)}`}
                    highlight={true}
                  />
                </>
              )}
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 text-center">
                <span className="text-sm text-slate-400">
                  Tip: {activeTip}%
                  {splitCount > 1 ? ` | Split: ${splitCount} people` : ""}
                </span>
              </div>
            </div>
          </div>

          {/* Comparison Table */}
          {bill > 0 && (
            <section className="mt-10">
              <h2 className="text-xl font-semibold text-white mb-4">
                Tip Comparison
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full bg-slate-800 border border-slate-700 rounded-lg overflow-hidden text-sm">
                  <thead>
                    <tr className="border-b border-slate-700 bg-slate-800/50">
                      <th className="text-left px-4 py-3 text-slate-400 font-medium">
                        Tip %
                      </th>
                      <th className="text-right px-4 py-3 text-slate-400 font-medium">
                        Tip Amount
                      </th>
                      <th className="text-right px-4 py-3 text-slate-400 font-medium">
                        Total
                      </th>
                      {splitCount > 1 && (
                        <th className="text-right px-4 py-3 text-slate-400 font-medium">
                          Per Person
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {comparison.map((row) => (
                      <tr
                        key={row.pct}
                        className={`border-b border-slate-700/50 ${
                          row.pct === activeTip
                            ? "bg-blue-900/20"
                            : "hover:bg-slate-700/30"
                        }`}
                      >
                        <td className="px-4 py-3 text-slate-300 font-medium">
                          {row.pct}%
                          {row.pct === activeTip && (
                            <span className="ml-2 text-xs text-blue-400">
                              selected
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right text-slate-300">
                          ${fmt(row.tip)}
                        </td>
                        <td className="px-4 py-3 text-right text-slate-300">
                          ${fmt(row.total)}
                        </td>
                        {splitCount > 1 && (
                          <td className="px-4 py-3 text-right text-slate-300">
                            ${fmt(row.perPerson)}
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* How to Use */}
          <section className="mt-12 bg-slate-800 border border-slate-700 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-4">
              How to Use This Tip Calculator
            </h2>
            <ol className="list-decimal list-inside space-y-2 text-slate-400">
              <li>
                Enter the total bill amount in the bill field.
              </li>
              <li>
                Select a tip percentage using the quick preset buttons, or enter
                a custom percentage.
              </li>
              <li>
                If splitting the bill, increase the number of people using the
                controls.
              </li>
              <li>
                View the calculated tip amount, total, and per-person breakdown
                on the right.
              </li>
              <li>
                Use the comparison table below to see how different tip
                percentages affect the total.
              </li>
            </ol>
          </section>

          <RelatedTools currentSlug="tip-calculator" />

          {/* FAQ Section */}
          <section className="mt-16 border-t border-slate-700 pt-10">
            <h2 className="text-2xl font-bold text-white mb-6">
              Frequently Asked Questions
            </h2>

            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  What is a standard tip percentage?
                </h3>
                <p className="text-slate-400">
                  In the United States, a standard tip at restaurants is between
                  15% and 20% of the pre-tax bill. For exceptional service, 25%
                  or more is common. In other countries, tipping customs vary
                  widely — some include service charges automatically.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Should I tip on the pre-tax or post-tax amount?
                </h3>
                <p className="text-slate-400">
                  Etiquette experts generally recommend tipping on the pre-tax
                  subtotal. However, tipping on the post-tax total is also
                  common and perfectly acceptable. The difference is usually
                  small.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  How do I split a bill with tip evenly?
                </h3>
                <p className="text-slate-400">
                  Enter the total bill amount, select your desired tip
                  percentage, and set the number of people splitting the bill.
                  The calculator will show each person&apos;s share of both the
                  tip and the total amount.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Is this tip calculator free to use?
                </h3>
                <p className="text-slate-400">
                  Yes, this tip calculator is completely free and runs entirely
                  in your browser. No data is sent to any server, and there are
                  no usage limits.
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}

function ResultCard({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight: boolean;
}) {
  return (
    <div
      className={`rounded-lg p-5 border ${
        highlight
          ? "bg-blue-900/30 border-blue-700"
          : "bg-slate-800 border-slate-700"
      }`}
    >
      <div className="text-xs text-slate-400 mb-1">{label}</div>
      <div
        className={`text-2xl font-bold ${
          highlight ? "text-blue-400" : "text-white"
        }`}
      >
        {value}
      </div>
    </div>
  );
}
