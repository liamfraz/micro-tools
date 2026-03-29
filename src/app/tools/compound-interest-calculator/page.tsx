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

type CompoundingFrequency = "monthly" | "quarterly" | "semi-annually" | "annually";

const FREQUENCY_MAP: Record<CompoundingFrequency, { label: string; n: number }> = {
  monthly: { label: "Monthly (12x/year)", n: 12 },
  quarterly: { label: "Quarterly (4x/year)", n: 4 },
  "semi-annually": { label: "Semi-Annually (2x/year)", n: 2 },
  annually: { label: "Annually (1x/year)", n: 1 },
};

interface YearBreakdown {
  year: number;
  balance: number;
  interest: number;
  contributions: number;
}

export default function CompoundInterestCalculatorPage() {
  const [principal, setPrincipal] = useState<string>("10000");
  const [rate, setRate] = useState<string>("7");
  const [frequency, setFrequency] = useState<CompoundingFrequency>("monthly");
  const [years, setYears] = useState<string>("10");
  const [monthlyContribution, setMonthlyContribution] = useState<string>("100");

  const results = useMemo(() => {
    const P = parseFloat(principal) || 0;
    const annualRate = parseFloat(rate) || 0;
    const r = annualRate / 100;
    const n = FREQUENCY_MAP[frequency].n;
    const t = parseInt(years) || 0;
    const PMT = parseFloat(monthlyContribution) || 0;

    if (P <= 0 && PMT <= 0) {
      return { finalAmount: 0, totalInterest: 0, totalContributions: 0, breakdown: [] };
    }

    const breakdown: YearBreakdown[] = [];
    let currentBalance = P;
    let cumulativeContributions = P;
    let cumulativeInterest = 0;

    for (let year = 1; year <= t; year++) {
      const periodsPerYear = n;
      const contributionPerPeriod = PMT * (12 / n);

      for (let period = 0; period < periodsPerYear; period++) {
        const interestThisPeriod = currentBalance * (r / n);
        currentBalance += interestThisPeriod + contributionPerPeriod;
        cumulativeInterest += interestThisPeriod;
        cumulativeContributions += contributionPerPeriod;
      }

      breakdown.push({
        year,
        balance: currentBalance,
        interest: cumulativeInterest,
        contributions: cumulativeContributions,
      });
    }

    return {
      finalAmount: currentBalance,
      totalInterest: cumulativeInterest,
      totalContributions: cumulativeContributions,
      breakdown,
    };
  }, [principal, rate, frequency, years, monthlyContribution]);

  const principalNum = parseFloat(principal) || 0;
  const interestPortion =
    results.finalAmount > 0
      ? ((results.totalInterest / results.finalAmount) * 100).toFixed(1)
      : "0";
  const contributionPortion =
    results.finalAmount > 0
      ? (((results.totalContributions) / results.finalAmount) * 100).toFixed(1)
      : "0";

  return (
    <>
      <title>Compound Interest Calculator - Free Online Calculator | DevTools Hub</title>
      <meta
        name="description"
        content="Calculate compound interest with monthly, quarterly, or annual compounding. See how your investments grow over time with our free compound interest calculator."
      />
      <JsonLd
        data={[
          generateWebAppSchema({
            slug: "compound-interest-calculator",
            name: "Compound Interest Calculator",
            description:
              "Calculate compound interest with monthly, quarterly, or annual compounding. See how your investments grow over time.",
            category: "finance",
          }),
          generateBreadcrumbSchema({
            slug: "compound-interest-calculator",
            name: "Compound Interest Calculator",
            description:
              "Calculate compound interest with monthly, quarterly, or annual compounding. See how your investments grow over time.",
            category: "finance",
          }),
          generateFAQSchema([
            {
              question: "What is compound interest?",
              answer:
                "Compound interest is interest calculated on both the initial principal and the accumulated interest from previous periods. Unlike simple interest, which is only calculated on the principal, compound interest allows your money to grow exponentially over time as you earn interest on your interest.",
            },
            {
              question: "How does compounding frequency affect returns?",
              answer:
                "The more frequently interest is compounded, the more total interest you earn. Monthly compounding yields slightly more than quarterly, which yields more than annual compounding. However, the difference between monthly and daily compounding is relatively small for most interest rates.",
            },
            {
              question: "What is the compound interest formula?",
              answer:
                "The compound interest formula is A = P(1 + r/n)^(nt), where A is the final amount, P is the principal, r is the annual interest rate (as a decimal), n is the number of compounding periods per year, and t is the time in years. For regular contributions, the future value of annuity formula is added: PMT * (((1 + r/n)^(nt) - 1) / (r/n)).",
            },
            {
              question: "How can I maximize compound interest?",
              answer:
                "To maximize compound interest: start investing as early as possible, choose higher compounding frequencies when available, make regular contributions even if small, reinvest all returns rather than withdrawing them, and seek the highest safe interest rate for your risk tolerance. Time is the most powerful factor in compound growth.",
            },
          ]),
        ]}
      />

      <div className="min-h-screen bg-slate-900 text-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <ToolBreadcrumb slug="compound-interest-calculator" />

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
              Compound Interest Calculator
            </h1>
            <p className="text-slate-400 max-w-2xl text-lg">
              Calculate how your investments grow over time with compound interest.
              Enter your principal, interest rate, compounding frequency, and optional
              monthly contributions to see year-by-year projections.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Input form */}
            <div className="lg:col-span-2">
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 space-y-5">
                <h2 className="text-lg font-semibold text-white mb-2">
                  Investment Details
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label
                      htmlFor="principal"
                      className="block text-sm font-medium text-slate-300 mb-1"
                    >
                      Principal Amount ($)
                    </label>
                    <input
                      id="principal"
                      type="number"
                      min="0"
                      step="100"
                      value={principal}
                      onChange={(e) => setPrincipal(e.target.value)}
                      className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="10000"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="rate"
                      className="block text-sm font-medium text-slate-300 mb-1"
                    >
                      Annual Interest Rate (%)
                    </label>
                    <input
                      id="rate"
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={rate}
                      onChange={(e) => setRate(e.target.value)}
                      className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="7"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="frequency"
                      className="block text-sm font-medium text-slate-300 mb-1"
                    >
                      Compounding Frequency
                    </label>
                    <select
                      id="frequency"
                      value={frequency}
                      onChange={(e) =>
                        setFrequency(e.target.value as CompoundingFrequency)
                      }
                      className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {Object.entries(FREQUENCY_MAP).map(([key, { label }]) => (
                        <option key={key} value={key}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="years"
                      className="block text-sm font-medium text-slate-300 mb-1"
                    >
                      Time Period (Years)
                    </label>
                    <input
                      id="years"
                      type="number"
                      min="1"
                      max="100"
                      step="1"
                      value={years}
                      onChange={(e) => setYears(e.target.value)}
                      className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="10"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label
                      htmlFor="contribution"
                      className="block text-sm font-medium text-slate-300 mb-1"
                    >
                      Monthly Contribution ($)
                      <span className="text-slate-500 ml-1">(optional)</span>
                    </label>
                    <input
                      id="contribution"
                      type="number"
                      min="0"
                      step="50"
                      value={monthlyContribution}
                      onChange={(e) => setMonthlyContribution(e.target.value)}
                      className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="100"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Results sidebar */}
            <div className="space-y-6">
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-5">
                <h2 className="text-lg font-semibold text-white mb-4">Results</h2>
                <div className="space-y-4">
                  <ResultCard
                    label="Final Amount"
                    value={formatCurrency(results.finalAmount)}
                    highlight
                  />
                  <ResultCard
                    label="Total Interest Earned"
                    value={formatCurrency(results.totalInterest)}
                  />
                  <ResultCard
                    label="Total Contributions"
                    value={formatCurrency(results.totalContributions)}
                  />
                </div>
              </div>

              {/* Visual proportion bar */}
              {results.finalAmount > 0 && (
                <div className="bg-slate-800 border border-slate-700 rounded-lg p-5">
                  <h2 className="text-lg font-semibold text-white mb-4">
                    Breakdown
                  </h2>
                  <div className="w-full h-6 rounded-full overflow-hidden flex bg-slate-700">
                    <div
                      className="bg-blue-500 h-full transition-all duration-300"
                      style={{ width: `${contributionPortion}%` }}
                      title={`Contributions: ${contributionPortion}%`}
                    />
                    <div
                      className="bg-green-500 h-full transition-all duration-300"
                      style={{ width: `${interestPortion}%` }}
                      title={`Interest: ${interestPortion}%`}
                    />
                  </div>
                  <div className="flex justify-between mt-3 text-xs text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded bg-blue-500 inline-block" />
                      Contributions ({contributionPortion}%)
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded bg-green-500 inline-block" />
                      Interest ({interestPortion}%)
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Year-by-year breakdown table */}
          {results.breakdown.length > 0 && (
            <div className="mt-8 bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
              <div className="p-5 border-b border-slate-700">
                <h2 className="text-lg font-semibold text-white">
                  Year-by-Year Breakdown
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-700 text-slate-400">
                      <th className="text-left px-5 py-3 font-medium">Year</th>
                      <th className="text-right px-5 py-3 font-medium">Balance</th>
                      <th className="text-right px-5 py-3 font-medium">
                        Total Contributions
                      </th>
                      <th className="text-right px-5 py-3 font-medium">
                        Total Interest
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.breakdown.map((row) => (
                      <tr
                        key={row.year}
                        className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors"
                      >
                        <td className="px-5 py-3 text-slate-300">{row.year}</td>
                        <td className="px-5 py-3 text-right text-white font-medium">
                          {formatCurrency(row.balance)}
                        </td>
                        <td className="px-5 py-3 text-right text-blue-400">
                          {formatCurrency(row.contributions)}
                        </td>
                        <td className="px-5 py-3 text-right text-green-400">
                          {formatCurrency(row.interest)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* How to Use / SEO content */}
          <section className="mt-12 bg-slate-800 border border-slate-700 rounded-lg p-6">
            <h2 className="text-2xl font-bold text-white mb-4">
              How to Use the Compound Interest Calculator
            </h2>
            <div className="text-slate-400 space-y-3">
              <p>
                Compound interest is one of the most powerful concepts in finance. It
                allows your money to grow exponentially by earning interest not only on
                your initial investment (the principal) but also on the accumulated
                interest from previous periods.
              </p>
              <p>
                To use this calculator, enter your starting principal amount, the annual
                interest rate you expect to earn, how frequently the interest compounds,
                and the number of years you plan to invest. You can also add an optional
                monthly contribution to see how regular deposits accelerate your growth.
              </p>
              <p>
                The formula used is{" "}
                <code className="bg-slate-700 px-1.5 py-0.5 rounded text-sm text-slate-300">
                  A = P(1 + r/n)^(nt)
                </code>{" "}
                for the principal, plus the future value of annuity formula for
                recurring contributions:{" "}
                <code className="bg-slate-700 px-1.5 py-0.5 rounded text-sm text-slate-300">
                  PMT x (((1 + r/n)^(nt) - 1) / (r/n))
                </code>
                . All calculations run entirely in your browser with no data sent to any
                server.
              </p>
            </div>
          </section>

          <RelatedTools currentSlug="compound-interest-calculator" />

          {/* FAQ Section */}
          <section className="mt-16 border-t border-slate-700 pt-10">
            <h2 className="text-2xl font-bold text-white mb-6">
              Frequently Asked Questions
            </h2>

            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  What is compound interest?
                </h3>
                <p className="text-slate-400">
                  Compound interest is interest calculated on both the initial principal
                  and the accumulated interest from previous periods. Unlike simple
                  interest, which is only calculated on the principal, compound interest
                  allows your money to grow exponentially over time as you earn interest
                  on your interest.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  How does compounding frequency affect returns?
                </h3>
                <p className="text-slate-400">
                  The more frequently interest is compounded, the more total interest you
                  earn. Monthly compounding yields slightly more than quarterly, which
                  yields more than annual compounding. However, the difference between
                  monthly and daily compounding is relatively small for most interest
                  rates.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  What is the compound interest formula?
                </h3>
                <p className="text-slate-400">
                  The compound interest formula is A = P(1 + r/n)^(nt), where A is the
                  final amount, P is the principal, r is the annual interest rate (as a
                  decimal), n is the number of compounding periods per year, and t is the
                  time in years. For regular contributions, the future value of annuity
                  formula is added: PMT x (((1 + r/n)^(nt) - 1) / (r/n)).
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  How can I maximize compound interest?
                </h3>
                <p className="text-slate-400">
                  To maximize compound interest: start investing as early as possible,
                  choose higher compounding frequencies when available, make regular
                  contributions even if small, reinvest all returns rather than
                  withdrawing them, and seek the highest safe interest rate for your risk
                  tolerance. Time is the most powerful factor in compound growth.
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
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}
