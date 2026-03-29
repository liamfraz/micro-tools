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

type ResidentStatus = "resident" | "foreign" | "working-holiday";

interface BracketBreakdown {
  bracket: string;
  taxableInBracket: number;
  rate: string;
  tax: number;
}

function calculateResidentTax(taxableIncome: number): {
  tax: number;
  brackets: BracketBreakdown[];
} {
  const brackets: BracketBreakdown[] = [];
  let tax = 0;

  const tiers = [
    { min: 0, max: 18200, rate: 0, label: "$0 - $18,200", rateLabel: "0%" },
    {
      min: 18200,
      max: 45000,
      rate: 0.16,
      label: "$18,201 - $45,000",
      rateLabel: "16%",
    },
    {
      min: 45000,
      max: 135000,
      rate: 0.3,
      label: "$45,001 - $135,000",
      rateLabel: "30%",
    },
    {
      min: 135000,
      max: 190000,
      rate: 0.37,
      label: "$135,001 - $190,000",
      rateLabel: "37%",
    },
    {
      min: 190000,
      max: Infinity,
      rate: 0.45,
      label: "$190,001+",
      rateLabel: "45%",
    },
  ];

  for (const tier of tiers) {
    if (taxableIncome <= tier.min) {
      brackets.push({
        bracket: tier.label,
        taxableInBracket: 0,
        rate: tier.rateLabel,
        tax: 0,
      });
      continue;
    }

    const taxableInBracket = Math.min(taxableIncome, tier.max) - tier.min;
    const bracketTax = taxableInBracket * tier.rate;
    tax += bracketTax;

    brackets.push({
      bracket: tier.label,
      taxableInBracket,
      rate: tier.rateLabel,
      tax: bracketTax,
    });
  }

  return { tax, brackets };
}

function calculateForeignResidentTax(taxableIncome: number): {
  tax: number;
  brackets: BracketBreakdown[];
} {
  const brackets: BracketBreakdown[] = [];
  let tax = 0;

  const tiers = [
    {
      min: 0,
      max: 135000,
      rate: 0.3,
      label: "$0 - $135,000",
      rateLabel: "30%",
    },
    {
      min: 135000,
      max: 190000,
      rate: 0.37,
      label: "$135,001 - $190,000",
      rateLabel: "37%",
    },
    {
      min: 190000,
      max: Infinity,
      rate: 0.45,
      label: "$190,001+",
      rateLabel: "45%",
    },
  ];

  for (const tier of tiers) {
    if (taxableIncome <= tier.min) {
      brackets.push({
        bracket: tier.label,
        taxableInBracket: 0,
        rate: tier.rateLabel,
        tax: 0,
      });
      continue;
    }

    const taxableInBracket = Math.min(taxableIncome, tier.max) - tier.min;
    const bracketTax = taxableInBracket * tier.rate;
    tax += bracketTax;

    brackets.push({
      bracket: tier.label,
      taxableInBracket,
      rate: tier.rateLabel,
      tax: bracketTax,
    });
  }

  return { tax, brackets };
}

function calculateWorkingHolidayTax(taxableIncome: number): {
  tax: number;
  brackets: BracketBreakdown[];
} {
  const brackets: BracketBreakdown[] = [];
  let tax = 0;

  const tiers = [
    {
      min: 0,
      max: 45000,
      rate: 0.15,
      label: "$0 - $45,000",
      rateLabel: "15%",
    },
    {
      min: 45000,
      max: 135000,
      rate: 0.3,
      label: "$45,001 - $135,000",
      rateLabel: "30%",
    },
    {
      min: 135000,
      max: 190000,
      rate: 0.37,
      label: "$135,001 - $190,000",
      rateLabel: "37%",
    },
    {
      min: 190000,
      max: Infinity,
      rate: 0.45,
      label: "$190,001+",
      rateLabel: "45%",
    },
  ];

  for (const tier of tiers) {
    if (taxableIncome <= tier.min) {
      brackets.push({
        bracket: tier.label,
        taxableInBracket: 0,
        rate: tier.rateLabel,
        tax: 0,
      });
      continue;
    }

    const taxableInBracket = Math.min(taxableIncome, tier.max) - tier.min;
    const bracketTax = taxableInBracket * tier.rate;
    tax += bracketTax;

    brackets.push({
      bracket: tier.label,
      taxableInBracket,
      rate: tier.rateLabel,
      tax: bracketTax,
    });
  }

  return { tax, brackets };
}

export default function SoleTraderTaxEstimatorPage() {
  const [grossIncome, setGrossIncome] = useState<string>("120000");
  const [expenses, setExpenses] = useState<string>("25000");
  const [otherIncome, setOtherIncome] = useState<string>("0");
  const [hasPrivateHealth, setHasPrivateHealth] = useState<boolean>(true);
  const [residentStatus, setResidentStatus] =
    useState<ResidentStatus>("resident");

  const results = useMemo(() => {
    const gross = parseFloat(grossIncome) || 0;
    const exp = parseFloat(expenses) || 0;
    const other = parseFloat(otherIncome) || 0;

    const taxableIncome = Math.max(0, gross - exp + other);

    let taxResult: { tax: number; brackets: BracketBreakdown[] };

    switch (residentStatus) {
      case "foreign":
        taxResult = calculateForeignResidentTax(taxableIncome);
        break;
      case "working-holiday":
        taxResult = calculateWorkingHolidayTax(taxableIncome);
        break;
      default:
        taxResult = calculateResidentTax(taxableIncome);
    }

    const incomeTax = taxResult.tax;

    // Medicare Levy: 2% for residents only
    const medicareLevy =
      residentStatus === "resident" ? taxableIncome * 0.02 : 0;

    // Medicare Levy Surcharge: 1% if no private health insurance and income > $93,000 (residents only)
    const medicareLevySurcharge =
      residentStatus === "resident" &&
      !hasPrivateHealth &&
      taxableIncome > 93000
        ? taxableIncome * 0.01
        : 0;

    const totalTax = incomeTax + medicareLevy + medicareLevySurcharge;
    const effectiveRate =
      taxableIncome > 0 ? (totalTax / taxableIncome) * 100 : 0;
    const takeHome = taxableIncome - totalTax;

    return {
      taxableIncome,
      incomeTax,
      medicareLevy,
      medicareLevySurcharge,
      totalTax,
      effectiveRate,
      takeHome,
      brackets: taxResult.brackets,
    };
  }, [grossIncome, expenses, otherIncome, hasPrivateHealth, residentStatus]);

  return (
    <>
      <title>
        Sole Trader Tax Calculator Australia 2026 - Free Tax Estimator |
        DevTools Hub
      </title>
      <meta
        name="description"
        content="Free sole trader tax calculator Australia 2026. Estimate your income tax, Medicare levy, and take-home pay using official ATO 2025-26 tax brackets. Instant results."
      />
      <JsonLd
        data={[
          generateWebAppSchema({
            slug: "sole-trader-tax-estimator",
            name: "Sole Trader Tax Calculator Australia 2026",
            description:
              "Estimate your Australian sole trader tax for the 2025-26 financial year. Calculate income tax, Medicare levy, and take-home pay using ATO rates.",
            category: "finance",
          }),
          generateBreadcrumbSchema({
            slug: "sole-trader-tax-estimator",
            name: "Sole Trader Tax Calculator Australia 2026",
            description:
              "Estimate your Australian sole trader tax for the 2025-26 financial year.",
            category: "finance",
          }),
          generateFAQSchema([
            {
              question:
                "How is sole trader income taxed in Australia for 2025-26?",
              answer:
                "Sole traders in Australia are taxed at individual income tax rates on their taxable income (business income minus allowable deductions). For the 2025-26 financial year, Australian residents pay 0% on the first $18,200, 16% on $18,201-$45,000, 30% on $45,001-$135,000, 37% on $135,001-$190,000, and 45% on income over $190,000. A 2% Medicare levy also applies.",
            },
            {
              question:
                "What deductions can sole traders claim in Australia?",
              answer:
                "Sole traders can claim deductions for expenses directly related to earning business income. Common deductions include home office expenses, vehicle and travel costs, equipment and tools, professional development, insurance, accounting fees, advertising, phone and internet costs, and depreciation on business assets. You must keep records of all expenses claimed.",
            },
            {
              question:
                "When do sole traders need to lodge their tax return?",
              answer:
                "If you lodge your own tax return, it is due by 31 October following the end of the financial year (30 June). If you use a registered tax agent, you may be eligible for an extended deadline, typically up to 15 May the following year. Sole traders with a GST turnover of $75,000 or more must also lodge Business Activity Statements (BAS) quarterly or monthly.",
            },
            {
              question:
                "What is the Medicare Levy Surcharge for sole traders?",
              answer:
                "The Medicare Levy Surcharge (MLS) is an additional 1% to 1.5% charge on top of the standard 2% Medicare levy. It applies to Australian residents who earn above $93,000 (for singles) and do not have an appropriate level of private hospital cover. The surcharge encourages higher-income earners to use the private health system, reducing demand on the public system.",
            },
          ]),
        ]}
      />

      <div className="min-h-screen bg-slate-900 text-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <ToolBreadcrumb slug="sole-trader-tax-estimator" />

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
              Sole Trader Tax Calculator Australia 2025-26
            </h1>
            <p className="text-slate-400 max-w-2xl text-lg">
              Estimate your Australian sole trader income tax, Medicare levy,
              and take-home pay for the 2025-26 financial year using official ATO
              tax brackets. All calculations run in your browser.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Input form */}
            <div className="lg:col-span-2">
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 space-y-5">
                <h2 className="text-lg font-semibold text-white mb-2">
                  Income Details
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label
                      htmlFor="grossIncome"
                      className="block text-sm font-medium text-slate-300 mb-1"
                    >
                      Gross Business Income ($)
                    </label>
                    <input
                      id="grossIncome"
                      type="number"
                      min="0"
                      step="1000"
                      value={grossIncome}
                      onChange={(e) => setGrossIncome(e.target.value)}
                      className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="120000"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="expenses"
                      className="block text-sm font-medium text-slate-300 mb-1"
                    >
                      Business Expenses / Deductions ($)
                    </label>
                    <input
                      id="expenses"
                      type="number"
                      min="0"
                      step="1000"
                      value={expenses}
                      onChange={(e) => setExpenses(e.target.value)}
                      className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="25000"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="otherIncome"
                      className="block text-sm font-medium text-slate-300 mb-1"
                    >
                      Other Income (e.g. salary, interest) ($)
                    </label>
                    <input
                      id="otherIncome"
                      type="number"
                      min="0"
                      step="1000"
                      value={otherIncome}
                      onChange={(e) => setOtherIncome(e.target.value)}
                      className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="0"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="residentStatus"
                      className="block text-sm font-medium text-slate-300 mb-1"
                    >
                      Resident Status
                    </label>
                    <select
                      id="residentStatus"
                      value={residentStatus}
                      onChange={(e) =>
                        setResidentStatus(e.target.value as ResidentStatus)
                      }
                      className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="resident">Australian Resident</option>
                      <option value="foreign">Foreign Resident</option>
                      <option value="working-holiday">
                        Working Holiday Maker
                      </option>
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Private Health Insurance
                    </label>
                    <div className="flex items-center gap-4">
                      <button
                        type="button"
                        onClick={() => setHasPrivateHealth(true)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          hasPrivateHealth
                            ? "bg-blue-600 text-white"
                            : "bg-slate-700 border border-slate-600 text-slate-300 hover:bg-slate-600"
                        }`}
                      >
                        Yes
                      </button>
                      <button
                        type="button"
                        onClick={() => setHasPrivateHealth(false)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          !hasPrivateHealth
                            ? "bg-blue-600 text-white"
                            : "bg-slate-700 border border-slate-600 text-slate-300 hover:bg-slate-600"
                        }`}
                      >
                        No
                      </button>
                      {residentStatus !== "resident" && (
                        <span className="text-xs text-slate-500">
                          (Medicare levy does not apply to non-residents)
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Results sidebar */}
            <div className="space-y-6">
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-5">
                <h2 className="text-lg font-semibold text-white mb-4">
                  Tax Summary
                </h2>
                <div className="space-y-4">
                  <ResultCard
                    label="Taxable Income"
                    value={formatCurrency(results.taxableIncome)}
                  />
                  <ResultCard
                    label="Income Tax"
                    value={formatCurrency(results.incomeTax)}
                  />
                  {residentStatus === "resident" && (
                    <>
                      <ResultCard
                        label="Medicare Levy (2%)"
                        value={formatCurrency(results.medicareLevy)}
                      />
                      {results.medicareLevySurcharge > 0 && (
                        <ResultCard
                          label="Medicare Levy Surcharge (1%)"
                          value={formatCurrency(results.medicareLevySurcharge)}
                        />
                      )}
                    </>
                  )}
                  <div className="border-t border-slate-700 pt-3">
                    <ResultCard
                      label="Total Tax"
                      value={formatCurrency(results.totalTax)}
                    />
                  </div>
                  <ResultCard
                    label="Effective Tax Rate"
                    value={`${results.effectiveRate.toFixed(1)}%`}
                  />
                  <div className="border-t border-slate-700 pt-3">
                    <ResultCard
                      label="Take-Home Amount"
                      value={formatCurrency(results.takeHome)}
                      highlight
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tax Bracket Breakdown Table */}
          {results.taxableIncome > 0 && (
            <div className="mt-8 bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
              <div className="p-5 border-b border-slate-700">
                <h2 className="text-lg font-semibold text-white">
                  Tax Bracket Breakdown
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-700 text-slate-400">
                      <th className="text-left px-5 py-3 font-medium">
                        Tax Bracket
                      </th>
                      <th className="text-right px-5 py-3 font-medium">
                        Rate
                      </th>
                      <th className="text-right px-5 py-3 font-medium">
                        Taxable Amount
                      </th>
                      <th className="text-right px-5 py-3 font-medium">
                        Tax
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.brackets.map((row, i) => (
                      <tr
                        key={i}
                        className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors"
                      >
                        <td className="px-5 py-3 text-slate-300">
                          {row.bracket}
                        </td>
                        <td className="px-5 py-3 text-right text-slate-300">
                          {row.rate}
                        </td>
                        <td className="px-5 py-3 text-right text-blue-400">
                          {formatCurrency(row.taxableInBracket)}
                        </td>
                        <td className="px-5 py-3 text-right text-white font-medium">
                          {formatCurrency(row.tax)}
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-slate-700/30 font-semibold">
                      <td className="px-5 py-3 text-white" colSpan={2}>
                        Total Income Tax
                      </td>
                      <td className="px-5 py-3 text-right text-blue-400">
                        {formatCurrency(results.taxableIncome)}
                      </td>
                      <td className="px-5 py-3 text-right text-white">
                        {formatCurrency(results.incomeTax)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* SEO Content */}
          <section className="mt-12 bg-slate-800 border border-slate-700 rounded-lg p-6">
            <h2 className="text-2xl font-bold text-white mb-4">
              Australian Sole Trader Tax Obligations 2025-26
            </h2>
            <div className="text-slate-400 space-y-3">
              <p>
                As a sole trader in Australia, you report your business income
                and expenses in your individual tax return. Your taxable income
                is calculated as your gross business income minus allowable
                business deductions, plus any other income you earn (such as
                salary from employment, interest, or rental income).
              </p>
              <p>
                For the 2025-26 financial year (1 July 2025 to 30 June 2026),
                the ATO applies individual income tax rates to your total
                taxable income. Australian residents benefit from a tax-free
                threshold of $18,200, meaning no tax is payable on the first
                $18,200 of taxable income. The marginal rates then increase
                progressively from 16% through to 45% for income over $190,000.
              </p>
              <p>
                Common sole trader deductions include home office expenses,
                motor vehicle costs, equipment depreciation, professional
                development, insurance premiums, accounting and legal fees,
                advertising, and phone and internet expenses. You must keep
                records of all deductions for at least five years and only claim
                expenses that are directly related to earning your business
                income.
              </p>
              <p>
                Sole traders with an annual GST turnover of $75,000 or more must
                register for GST and lodge Business Activity Statements (BAS).
                Even below this threshold, you may choose to register
                voluntarily. PAYG instalments may also apply if your expected tax
                liability exceeds certain thresholds. All calculations on this
                page run entirely in your browser with no data sent to any
                server.
              </p>
            </div>
          </section>

          <RelatedTools currentSlug="sole-trader-tax-estimator" />

          {/* FAQ Section */}
          <section className="mt-16 border-t border-slate-700 pt-10">
            <h2 className="text-2xl font-bold text-white mb-6">
              Frequently Asked Questions
            </h2>

            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  How is sole trader income taxed in Australia for 2025-26?
                </h3>
                <p className="text-slate-400">
                  Sole traders in Australia are taxed at individual income tax
                  rates on their taxable income (business income minus allowable
                  deductions). For the 2025-26 financial year, Australian
                  residents pay 0% on the first $18,200, 16% on
                  $18,201-$45,000, 30% on $45,001-$135,000, 37% on
                  $135,001-$190,000, and 45% on income over $190,000. A 2%
                  Medicare levy also applies.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  What deductions can sole traders claim in Australia?
                </h3>
                <p className="text-slate-400">
                  Sole traders can claim deductions for expenses directly related
                  to earning business income. Common deductions include home
                  office expenses, vehicle and travel costs, equipment and tools,
                  professional development, insurance, accounting fees,
                  advertising, phone and internet costs, and depreciation on
                  business assets. You must keep records of all expenses claimed.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  When do sole traders need to lodge their tax return?
                </h3>
                <p className="text-slate-400">
                  If you lodge your own tax return, it is due by 31 October
                  following the end of the financial year (30 June). If you use a
                  registered tax agent, you may be eligible for an extended
                  deadline, typically up to 15 May the following year. Sole
                  traders with a GST turnover of $75,000 or more must also lodge
                  Business Activity Statements (BAS) quarterly or monthly.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  What is the Medicare Levy Surcharge for sole traders?
                </h3>
                <p className="text-slate-400">
                  The Medicare Levy Surcharge (MLS) is an additional 1% to 1.5%
                  charge on top of the standard 2% Medicare levy. It applies to
                  Australian residents who earn above $93,000 (for singles) and
                  do not have an appropriate level of private hospital cover. The
                  surcharge encourages higher-income earners to use the private
                  health system, reducing demand on the public system.
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
  highlight?: boolean;
}) {
  return (
    <div>
      <div className="text-xs text-slate-400 mb-1">{label}</div>
      <div
        className={`text-2xl font-bold ${
          highlight ? "text-green-400" : "text-white"
        }`}
      >
        {value}
      </div>
    </div>
  );
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}
