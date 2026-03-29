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

type ConversionDirection = "salary-to-hourly" | "hourly-to-salary";

export default function SalaryToHourlyCalculatorPage() {
  const [direction, setDirection] = useState<ConversionDirection>("salary-to-hourly");
  const [amount, setAmount] = useState("50000");
  const [hoursPerWeek, setHoursPerWeek] = useState("40");
  const [weeksPerYear, setWeeksPerYear] = useState("52");
  const [taxRate, setTaxRate] = useState("");

  const breakdown = useMemo(() => {
    const amt = parseFloat(amount) || 0;
    const hpw = parseFloat(hoursPerWeek) || 40;
    const wpy = parseFloat(weeksPerYear) || 52;
    const tax = parseFloat(taxRate) || 0;

    const totalHoursPerYear = hpw * wpy;

    let annual: number;
    let hourly: number;

    if (direction === "salary-to-hourly") {
      annual = amt;
      hourly = totalHoursPerYear > 0 ? amt / totalHoursPerYear : 0;
    } else {
      hourly = amt;
      annual = amt * totalHoursPerYear;
    }

    const daily = hourly * (hpw / 5);
    const weekly = hourly * hpw;
    const biWeekly = weekly * 2;
    const semiMonthly = annual / 24;
    const monthly = annual / 12;
    const quarterly = annual / 4;

    const taxMultiplier = tax > 0 ? (100 - tax) / 100 : 1;

    return {
      hourly,
      daily,
      weekly,
      biWeekly,
      semiMonthly,
      monthly,
      quarterly,
      annual,
      postTax: {
        hourly: hourly * taxMultiplier,
        daily: daily * taxMultiplier,
        weekly: weekly * taxMultiplier,
        biWeekly: biWeekly * taxMultiplier,
        semiMonthly: semiMonthly * taxMultiplier,
        monthly: monthly * taxMultiplier,
        quarterly: quarterly * taxMultiplier,
        annual: annual * taxMultiplier,
      },
      hasTax: tax > 0,
    };
  }, [amount, hoursPerWeek, weeksPerYear, taxRate, direction]);

  const fmt = (value: number) =>
    value.toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const periods = [
    { label: "Hourly", preTax: breakdown.hourly, postTax: breakdown.postTax.hourly },
    { label: "Daily", preTax: breakdown.daily, postTax: breakdown.postTax.daily },
    { label: "Weekly", preTax: breakdown.weekly, postTax: breakdown.postTax.weekly },
    { label: "Bi-Weekly", preTax: breakdown.biWeekly, postTax: breakdown.postTax.biWeekly },
    { label: "Semi-Monthly", preTax: breakdown.semiMonthly, postTax: breakdown.postTax.semiMonthly },
    { label: "Monthly", preTax: breakdown.monthly, postTax: breakdown.postTax.monthly },
    { label: "Quarterly", preTax: breakdown.quarterly, postTax: breakdown.postTax.quarterly },
    { label: "Annual", preTax: breakdown.annual, postTax: breakdown.postTax.annual },
  ];

  return (
    <>
      <title>Salary to Hourly Calculator - Convert Annual Salary to Hourly Rate | DevTools Hub</title>
      <meta
        name="description"
        content="Convert salary to hourly rate and hourly to salary instantly. Calculate your equivalent pay with custom work hours, weeks, and tax estimates. Free salary calculator."
      />
      <JsonLd
        data={[
          generateWebAppSchema({
            slug: "salary-to-hourly-calculator",
            name: "Salary to Hourly Calculator",
            description:
              "Convert salary to hourly rate and hourly to salary instantly with custom work hours, weeks, and tax estimates",
            category: "finance",
          }),
          generateBreadcrumbSchema({
            slug: "salary-to-hourly-calculator",
            name: "Salary to Hourly Calculator",
            description:
              "Convert salary to hourly rate and hourly to salary instantly with custom work hours, weeks, and tax estimates",
            category: "finance",
          }),
          generateFAQSchema([
            {
              question: "How do you convert an annual salary to an hourly rate?",
              answer:
                "Divide your annual salary by the total number of working hours in a year. For a standard full-time schedule, that is 40 hours per week multiplied by 52 weeks, giving 2,080 hours. For example, a $50,000 salary divided by 2,080 hours equals approximately $24.04 per hour.",
            },
            {
              question: "What is the standard number of work hours in a year?",
              answer:
                "The standard is 2,080 hours per year, based on 40 hours per week for 52 weeks. However, this varies by country, industry, and employment type. Some positions use fewer weeks to account for unpaid time off, such as 48 or 50 weeks per year.",
            },
            {
              question: "Does this calculator account for taxes?",
              answer:
                "The calculator includes an optional tax rate field where you can enter an estimated effective tax percentage. It then shows both pre-tax and post-tax amounts for every pay period. Note that actual taxes depend on filing status, deductions, and jurisdiction, so use this as an estimate only.",
            },
            {
              question: "Can I convert an hourly rate back to a salary?",
              answer:
                "Yes. Toggle the conversion direction to \"Hourly to Salary\" and enter your hourly rate. The calculator multiplies your hourly rate by your hours per week and weeks per year to compute the equivalent annual salary and all other pay period breakdowns.",
            },
          ]),
        ]}
      />

      <div className="min-h-screen bg-slate-900 text-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <ToolBreadcrumb slug="salary-to-hourly-calculator" />

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
              Salary to Hourly Calculator
            </h1>
            <p className="text-slate-400 max-w-2xl text-lg">
              Convert between annual salary and hourly rate instantly. Customize
              work hours, weeks per year, and see an optional tax estimate across
              every pay period.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Input form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Direction toggle */}
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-5">
                <h2 className="text-lg font-semibold text-white mb-4">
                  Conversion Direction
                </h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => setDirection("salary-to-hourly")}
                    className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-colors ${
                      direction === "salary-to-hourly"
                        ? "bg-blue-600 text-white"
                        : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                    }`}
                  >
                    Salary to Hourly
                  </button>
                  <button
                    onClick={() => setDirection("hourly-to-salary")}
                    className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-colors ${
                      direction === "hourly-to-salary"
                        ? "bg-blue-600 text-white"
                        : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                    }`}
                  >
                    Hourly to Salary
                  </button>
                </div>
              </div>

              {/* Amount input */}
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-5">
                <h2 className="text-lg font-semibold text-white mb-4">
                  {direction === "salary-to-hourly"
                    ? "Annual Salary"
                    : "Hourly Rate"}
                </h2>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">
                    $
                  </span>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder={
                      direction === "salary-to-hourly" ? "50000" : "25"
                    }
                    min="0"
                    step="any"
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg pl-8 pr-4 py-3 text-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Work schedule */}
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-5">
                <h2 className="text-lg font-semibold text-white mb-4">
                  Work Schedule
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-slate-400 mb-1.5">
                      Hours per Week
                    </label>
                    <input
                      type="number"
                      value={hoursPerWeek}
                      onChange={(e) => setHoursPerWeek(e.target.value)}
                      placeholder="40"
                      min="1"
                      max="168"
                      className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2.5 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-1.5">
                      Weeks per Year
                    </label>
                    <input
                      type="number"
                      value={weeksPerYear}
                      onChange={(e) => setWeeksPerYear(e.target.value)}
                      placeholder="52"
                      min="1"
                      max="52"
                      className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2.5 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Tax rate */}
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-5">
                <h2 className="text-lg font-semibold text-white mb-2">
                  Tax Rate
                  <span className="text-sm font-normal text-slate-400 ml-2">
                    (optional)
                  </span>
                </h2>
                <p className="text-sm text-slate-500 mb-3">
                  Enter your estimated effective tax rate to see post-tax amounts.
                </p>
                <div className="relative">
                  <input
                    type="number"
                    value={taxRate}
                    onChange={(e) => setTaxRate(e.target.value)}
                    placeholder="0"
                    min="0"
                    max="100"
                    step="0.1"
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 pr-10 py-2.5 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                    %
                  </span>
                </div>
              </div>
            </div>

            {/* Results sidebar */}
            <div className="space-y-6">
              {/* Primary result */}
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-5">
                <h2 className="text-lg font-semibold text-white mb-4">
                  {direction === "salary-to-hourly"
                    ? "Hourly Rate"
                    : "Annual Salary"}
                </h2>
                <div className="text-center py-4">
                  <div className="text-4xl font-bold text-blue-400">
                    {fmt(
                      direction === "salary-to-hourly"
                        ? breakdown.hourly
                        : breakdown.annual
                    )}
                  </div>
                  {breakdown.hasTax && (
                    <div className="text-lg text-green-400 mt-2">
                      {fmt(
                        direction === "salary-to-hourly"
                          ? breakdown.postTax.hourly
                          : breakdown.postTax.annual
                      )}{" "}
                      after tax
                    </div>
                  )}
                </div>
              </div>

              {/* All breakdowns */}
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-5">
                <h2 className="text-lg font-semibold text-white mb-4">
                  Pay Breakdown
                </h2>
                <div className="space-y-3">
                  {periods.map(({ label, preTax, postTax }) => (
                    <div
                      key={label}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="text-slate-400">{label}</span>
                      <div className="text-right">
                        <span className="text-slate-200 font-medium">
                          {fmt(preTax)}
                        </span>
                        {breakdown.hasTax && (
                          <div className="text-xs text-green-400">
                            {fmt(postTax)}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Work info */}
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-5">
                <h2 className="text-lg font-semibold text-white mb-4">
                  Work Summary
                </h2>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Hours / Week</span>
                    <span className="text-slate-200">
                      {parseFloat(hoursPerWeek) || 40}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Weeks / Year</span>
                    <span className="text-slate-200">
                      {parseFloat(weeksPerYear) || 52}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Total Hours / Year</span>
                    <span className="text-slate-200">
                      {(
                        (parseFloat(hoursPerWeek) || 40) *
                        (parseFloat(weeksPerYear) || 52)
                      ).toLocaleString()}
                    </span>
                  </div>
                  {breakdown.hasTax && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Tax Rate</span>
                      <span className="text-slate-200">
                        {parseFloat(taxRate)}%
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Comparison table */}
          {breakdown.hasTax && (
            <section className="mt-10">
              <h2 className="text-2xl font-bold text-white mb-4">
                Pre-Tax vs Post-Tax Comparison
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr className="border-b border-slate-700">
                      <th className="py-3 px-4 text-slate-400 font-medium">
                        Period
                      </th>
                      <th className="py-3 px-4 text-slate-400 font-medium text-right">
                        Pre-Tax
                      </th>
                      <th className="py-3 px-4 text-slate-400 font-medium text-right">
                        Tax Deducted
                      </th>
                      <th className="py-3 px-4 text-slate-400 font-medium text-right">
                        Post-Tax
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {periods.map(({ label, preTax, postTax }) => (
                      <tr
                        key={label}
                        className="border-b border-slate-800 hover:bg-slate-800/50"
                      >
                        <td className="py-3 px-4 text-slate-300">{label}</td>
                        <td className="py-3 px-4 text-slate-200 text-right font-medium">
                          {fmt(preTax)}
                        </td>
                        <td className="py-3 px-4 text-red-400 text-right">
                          -{fmt(preTax - postTax)}
                        </td>
                        <td className="py-3 px-4 text-green-400 text-right font-medium">
                          {fmt(postTax)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* How to Use */}
          <section className="mt-16 border-t border-slate-700 pt-10">
            <h2 className="text-2xl font-bold text-white mb-4">
              How to Use This Calculator
            </h2>
            <div className="prose prose-invert max-w-none text-slate-400 space-y-4">
              <p>
                This calculator converts between annual salary and hourly pay in
                both directions. Start by selecting your conversion direction:
                &ldquo;Salary to Hourly&rdquo; if you know your annual salary and
                want to find your hourly rate, or &ldquo;Hourly to Salary&rdquo;
                if you want to know the annual equivalent of your hourly wage.
              </p>
              <p>
                Enter your amount, then adjust the work schedule if needed. The
                defaults are 40 hours per week and 52 weeks per year (the
                standard U.S. full-time schedule of 2,080 hours). If you take
                unpaid time off, reduce the weeks accordingly &mdash; for example,
                use 50 weeks if you have 2 weeks of unpaid leave.
              </p>
              <p>
                To see after-tax estimates, enter your effective tax rate in the
                optional field. This applies a flat percentage deduction and shows
                both pre-tax and post-tax amounts for every pay period. Keep in
                mind that real tax calculations depend on your filing status,
                deductions, and local tax laws.
              </p>
            </div>
          </section>

          <RelatedTools currentSlug="salary-to-hourly-calculator" />

          {/* FAQ Section */}
          <section className="mt-16 border-t border-slate-700 pt-10">
            <h2 className="text-2xl font-bold text-white mb-6">
              Frequently Asked Questions
            </h2>

            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  How do you convert an annual salary to an hourly rate?
                </h3>
                <p className="text-slate-400">
                  Divide your annual salary by the total number of working hours
                  in a year. For a standard full-time schedule, that is 40 hours
                  per week multiplied by 52 weeks, giving 2,080 hours. For
                  example, a $50,000 salary divided by 2,080 hours equals
                  approximately $24.04 per hour.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  What is the standard number of work hours in a year?
                </h3>
                <p className="text-slate-400">
                  The standard is 2,080 hours per year, based on 40 hours per
                  week for 52 weeks. However, this varies by country, industry,
                  and employment type. Some positions use fewer weeks to account
                  for unpaid time off, such as 48 or 50 weeks per year.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Does this calculator account for taxes?
                </h3>
                <p className="text-slate-400">
                  The calculator includes an optional tax rate field where you can
                  enter an estimated effective tax percentage. It then shows both
                  pre-tax and post-tax amounts for every pay period. Note that
                  actual taxes depend on filing status, deductions, and
                  jurisdiction, so use this as an estimate only.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Can I convert an hourly rate back to a salary?
                </h3>
                <p className="text-slate-400">
                  Yes. Toggle the conversion direction to &ldquo;Hourly to
                  Salary&rdquo; and enter your hourly rate. The calculator
                  multiplies your hourly rate by your hours per week and weeks per
                  year to compute the equivalent annual salary and all other pay
                  period breakdowns.
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
