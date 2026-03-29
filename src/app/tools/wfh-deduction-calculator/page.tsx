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

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export default function WfhDeductionCalculatorPage() {
  const [hoursPerWeek, setHoursPerWeek] = useState<string>("35");
  const [weeksPerYear, setWeeksPerYear] = useState<string>("48");
  const [electricityBill, setElectricityBill] = useState<string>("2400");
  const [officePercent, setOfficePercent] = useState<string>("15");
  const [internetBill, setInternetBill] = useState<string>("1200");
  const [internetWorkPercent, setInternetWorkPercent] = useState<string>("60");
  const [phoneBill, setPhoneBill] = useState<string>("1800");
  const [phoneWorkPercent, setPhoneWorkPercent] = useState<string>("40");
  const [furnitureDepreciation, setFurnitureDepreciation] = useState<string>("500");
  const [stationery, setStationery] = useState<string>("200");

  const results = useMemo(() => {
    const hours = parseFloat(hoursPerWeek) || 0;
    const weeks = parseFloat(weeksPerYear) || 0;
    const electricity = parseFloat(electricityBill) || 0;
    const officePct = parseFloat(officePercent) || 0;
    const internet = parseFloat(internetBill) || 0;
    const internetPct = parseFloat(internetWorkPercent) || 0;
    const phone = parseFloat(phoneBill) || 0;
    const phonePct = parseFloat(phoneWorkPercent) || 0;
    const furniture = parseFloat(furnitureDepreciation) || 0;
    const stationeryAmt = parseFloat(stationery) || 0;

    const totalHours = hours * weeks;

    // Fixed Rate Method (2025-26): 67 cents per hour
    const fixedRateBase = totalHours * 0.67;
    // Fixed rate covers electricity, gas, phone, internet, stationery, computer consumables
    // Does NOT cover office furniture depreciation - claim separately
    const fixedRateTotal = fixedRateBase + furniture;

    // Actual Cost Method
    const totalHoursInYear = 52 * 7 * 24; // 8736 hours
    const workHoursInYear = totalHours;
    const electricityCost = electricity * (officePct / 100) * (workHoursInYear / totalHoursInYear);
    const internetCost = internet * (internetPct / 100);
    const phoneCost = phone * (phonePct / 100);
    const actualTotal = electricityCost + internetCost + phoneCost + furniture + stationeryAmt;

    const difference = Math.abs(fixedRateTotal - actualTotal);
    const recommended = fixedRateTotal >= actualTotal ? "fixed" : "actual";

    return {
      totalHours,
      fixedRateBase,
      fixedRateTotal,
      electricityCost,
      internetCost,
      phoneCost,
      actualTotal,
      difference,
      recommended,
      furniture,
      stationeryAmt,
    };
  }, [
    hoursPerWeek,
    weeksPerYear,
    electricityBill,
    officePercent,
    internetBill,
    internetWorkPercent,
    phoneBill,
    phoneWorkPercent,
    furnitureDepreciation,
    stationery,
  ]);

  const maxDeduction = Math.max(results.fixedRateTotal, results.actualTotal);
  const fixedBarWidth = maxDeduction > 0 ? (results.fixedRateTotal / maxDeduction) * 100 : 0;
  const actualBarWidth = maxDeduction > 0 ? (results.actualTotal / maxDeduction) * 100 : 0;

  return (
    <>
      <title>Work From Home Deduction Calculator Australia 2026 - Fixed Rate vs Actual Cost | DevTools Hub</title>
      <meta
        name="description"
        content="Free work from home deduction calculator australia 2026. Compare ATO fixed rate (67c/hr) vs actual cost method for the 2025-26 financial year. Find which WFH tax deduction method saves you more."
      />
      <JsonLd
        data={[
          generateWebAppSchema({
            slug: "wfh-deduction-calculator",
            name: "Work From Home Deduction Calculator Australia",
            description:
              "Compare ATO fixed rate (67c/hr) vs actual cost method for work from home tax deductions in the 2025-26 financial year.",
            category: "finance",
          }),
          generateBreadcrumbSchema({
            slug: "wfh-deduction-calculator",
            name: "Work From Home Deduction Calculator",
            description:
              "Compare ATO fixed rate vs actual cost method for work from home tax deductions in Australia.",
            category: "finance",
          }),
          generateFAQSchema([
            {
              question: "What is the ATO fixed rate for working from home in 2025-26?",
              answer:
                "For the 2025-26 financial year, the ATO fixed rate method allows you to claim 67 cents per hour worked from home. This rate covers electricity, gas, phone, internet, stationery, and computer consumables. You can claim office furniture and equipment depreciation separately on top of the fixed rate.",
            },
            {
              question: "What is the difference between the fixed rate and actual cost methods?",
              answer:
                "The fixed rate method uses a flat 67 cents per hour to cover running expenses (electricity, gas, phone, internet, stationery, computer consumables). The actual cost method requires you to calculate the precise work-related portion of each expense. The actual cost method may give a larger deduction if your expenses are high, but requires more detailed records and receipts.",
            },
            {
              question: "What records do I need to keep for WFH deductions?",
              answer:
                "For the fixed rate method, you need a record of hours worked from home (e.g., timesheets, rosters, diary) for the entire income year. For the actual cost method, you need receipts for all expenses, a method for calculating the work-related portion (e.g., floor area for electricity, usage logs for internet), and records showing how you determined each percentage.",
            },
            {
              question: "Can I claim office furniture under the fixed rate method?",
              answer:
                "Yes. The fixed rate of 67 cents per hour does NOT cover office furniture, equipment, or technology (like desks, chairs, monitors, or computers). You can claim depreciation on these items separately in addition to the fixed rate. Items costing $300 or less can be claimed as an immediate deduction, while items over $300 must be depreciated over their effective life.",
            },
          ]),
        ]}
      />

      <div className="min-h-screen bg-slate-900 text-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <ToolBreadcrumb slug="wfh-deduction-calculator" />

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
              Work From Home Deduction Calculator
            </h1>
            <p className="text-slate-400 max-w-2xl text-lg">
              Compare the ATO fixed rate method (67c/hr) with the actual cost method
              for the 2025-26 financial year. Find which approach gives you the
              bigger tax deduction.
            </p>
          </div>

          {/* Shared Inputs */}
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 mb-6">
            <h2 className="text-lg font-semibold text-white mb-4">
              Work From Home Hours
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label
                  htmlFor="hoursPerWeek"
                  className="block text-sm font-medium text-slate-300 mb-1"
                >
                  Hours Worked From Home Per Week
                </label>
                <input
                  id="hoursPerWeek"
                  type="number"
                  min="0"
                  max="168"
                  step="1"
                  value={hoursPerWeek}
                  onChange={(e) => setHoursPerWeek(e.target.value)}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="35"
                />
              </div>
              <div>
                <label
                  htmlFor="weeksPerYear"
                  className="block text-sm font-medium text-slate-300 mb-1"
                >
                  Weeks Worked From Home Per Year
                </label>
                <input
                  id="weeksPerYear"
                  type="number"
                  min="0"
                  max="52"
                  step="1"
                  value={weeksPerYear}
                  onChange={(e) => setWeeksPerYear(e.target.value)}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="48"
                />
              </div>
            </div>
            <p className="text-sm text-slate-500 mt-3">
              Total hours: {results.totalHours.toLocaleString()} hours/year
            </p>
          </div>

          {/* Two-column comparison */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Fixed Rate Method */}
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-3 h-3 rounded-full bg-blue-500" />
                <h2 className="text-lg font-semibold text-white">
                  Fixed Rate Method
                </h2>
              </div>
              <p className="text-sm text-slate-400 mb-5">
                67 cents per hour worked from home. Covers electricity, gas, phone,
                internet, stationery, and computer consumables.
              </p>

              <div className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Rate</span>
                  <span className="text-slate-200">$0.67/hour</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Total hours</span>
                  <span className="text-slate-200">
                    {results.totalHours.toLocaleString()} hrs
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Fixed rate amount</span>
                  <span className="text-slate-200">
                    {formatCurrency(results.fixedRateBase)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">
                    + Furniture depreciation
                    <span className="text-slate-500 ml-1">(claimed separately)</span>
                  </span>
                  <span className="text-slate-200">
                    {formatCurrency(results.furniture)}
                  </span>
                </div>
                <div className="border-t border-slate-600 pt-3 flex justify-between">
                  <span className="font-semibold text-white">Total Deduction</span>
                  <span className="text-2xl font-bold text-blue-400">
                    {formatCurrency(results.fixedRateTotal)}
                  </span>
                </div>
              </div>
            </div>

            {/* Actual Cost Method */}
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <h2 className="text-lg font-semibold text-white">
                  Actual Cost Method
                </h2>
              </div>
              <p className="text-sm text-slate-400 mb-5">
                Calculate the exact work-related portion of each expense. Requires
                detailed records and receipts.
              </p>

              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="electricityBill"
                    className="block text-sm font-medium text-slate-300 mb-1"
                  >
                    Annual Electricity Bill ($)
                  </label>
                  <input
                    id="electricityBill"
                    type="number"
                    min="0"
                    step="100"
                    value={electricityBill}
                    onChange={(e) => setElectricityBill(e.target.value)}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="2400"
                  />
                </div>
                <div>
                  <label
                    htmlFor="officePercent"
                    className="block text-sm font-medium text-slate-300 mb-1"
                  >
                    Percentage of Home Used as Office (%)
                  </label>
                  <input
                    id="officePercent"
                    type="number"
                    min="0"
                    max="100"
                    step="1"
                    value={officePercent}
                    onChange={(e) => setOfficePercent(e.target.value)}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="15"
                  />
                </div>
                <div>
                  <label
                    htmlFor="internetBill"
                    className="block text-sm font-medium text-slate-300 mb-1"
                  >
                    Annual Internet Bill ($)
                  </label>
                  <input
                    id="internetBill"
                    type="number"
                    min="0"
                    step="50"
                    value={internetBill}
                    onChange={(e) => setInternetBill(e.target.value)}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="1200"
                  />
                </div>
                <div>
                  <label
                    htmlFor="internetWorkPercent"
                    className="block text-sm font-medium text-slate-300 mb-1"
                  >
                    Work-Related Percentage of Internet (%)
                  </label>
                  <input
                    id="internetWorkPercent"
                    type="number"
                    min="0"
                    max="100"
                    step="5"
                    value={internetWorkPercent}
                    onChange={(e) => setInternetWorkPercent(e.target.value)}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="60"
                  />
                </div>
                <div>
                  <label
                    htmlFor="phoneBill"
                    className="block text-sm font-medium text-slate-300 mb-1"
                  >
                    Annual Phone Bill ($)
                  </label>
                  <input
                    id="phoneBill"
                    type="number"
                    min="0"
                    step="50"
                    value={phoneBill}
                    onChange={(e) => setPhoneBill(e.target.value)}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="1800"
                  />
                </div>
                <div>
                  <label
                    htmlFor="phoneWorkPercent"
                    className="block text-sm font-medium text-slate-300 mb-1"
                  >
                    Work-Related Percentage of Phone (%)
                  </label>
                  <input
                    id="phoneWorkPercent"
                    type="number"
                    min="0"
                    max="100"
                    step="5"
                    value={phoneWorkPercent}
                    onChange={(e) => setPhoneWorkPercent(e.target.value)}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="40"
                  />
                </div>
                <div>
                  <label
                    htmlFor="furnitureDepreciation"
                    className="block text-sm font-medium text-slate-300 mb-1"
                  >
                    Office Furniture & Equipment Depreciation ($)
                  </label>
                  <input
                    id="furnitureDepreciation"
                    type="number"
                    min="0"
                    step="50"
                    value={furnitureDepreciation}
                    onChange={(e) => setFurnitureDepreciation(e.target.value)}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="500"
                  />
                </div>
                <div>
                  <label
                    htmlFor="stationery"
                    className="block text-sm font-medium text-slate-300 mb-1"
                  >
                    Stationery & Consumables ($)
                  </label>
                  <input
                    id="stationery"
                    type="number"
                    min="0"
                    step="10"
                    value={stationery}
                    onChange={(e) => setStationery(e.target.value)}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="200"
                  />
                </div>

                {/* Actual cost breakdown */}
                <div className="border-t border-slate-600 pt-3 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Electricity</span>
                    <span className="text-slate-200">
                      {formatCurrency(results.electricityCost)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Internet</span>
                    <span className="text-slate-200">
                      {formatCurrency(results.internetCost)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Phone</span>
                    <span className="text-slate-200">
                      {formatCurrency(results.phoneCost)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Furniture depreciation</span>
                    <span className="text-slate-200">
                      {formatCurrency(results.furniture)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Stationery & consumables</span>
                    <span className="text-slate-200">
                      {formatCurrency(results.stationeryAmt)}
                    </span>
                  </div>
                </div>
                <div className="border-t border-slate-600 pt-3 flex justify-between">
                  <span className="font-semibold text-white">Total Deduction</span>
                  <span className="text-2xl font-bold text-green-400">
                    {formatCurrency(results.actualTotal)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Comparison Summary */}
          <div className="mt-6 bg-slate-800 border border-slate-700 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-white mb-4">
              Comparison Summary
            </h2>

            {/* Visual comparison bars */}
            <div className="space-y-3 mb-6">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-300 flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-blue-500 inline-block" />
                    Fixed Rate Method
                  </span>
                  <span className="text-blue-400 font-medium">
                    {formatCurrency(results.fixedRateTotal)}
                  </span>
                </div>
                <div className="w-full h-8 rounded-lg bg-slate-700 overflow-hidden">
                  <div
                    className="h-full bg-blue-500/80 rounded-lg transition-all duration-500"
                    style={{ width: `${fixedBarWidth}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-300 flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-green-500 inline-block" />
                    Actual Cost Method
                  </span>
                  <span className="text-green-400 font-medium">
                    {formatCurrency(results.actualTotal)}
                  </span>
                </div>
                <div className="w-full h-8 rounded-lg bg-slate-700 overflow-hidden">
                  <div
                    className="h-full bg-green-500/80 rounded-lg transition-all duration-500"
                    style={{ width: `${actualBarWidth}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Recommendation */}
            <div
              className={`rounded-lg p-4 border ${
                results.recommended === "fixed"
                  ? "bg-blue-500/10 border-blue-500/30"
                  : "bg-green-500/10 border-green-500/30"
              }`}
            >
              <p className="font-semibold text-white mb-1">
                {results.recommended === "fixed"
                  ? "Fixed Rate Method is better"
                  : "Actual Cost Method is better"}
                {" "}by {formatCurrency(results.difference)}
              </p>
              <p className="text-sm text-slate-400">
                {results.recommended === "fixed"
                  ? "The fixed rate method gives you a larger deduction with less record-keeping. You only need to track your hours worked from home."
                  : "The actual cost method gives you a larger deduction, but requires detailed records and receipts for all expenses claimed."}
              </p>
            </div>
          </div>

          {/* SEO Content */}
          <section className="mt-12 bg-slate-800 border border-slate-700 rounded-lg p-6">
            <h2 className="text-2xl font-bold text-white mb-4">
              Understanding Work From Home Tax Deductions in Australia
            </h2>
            <div className="text-slate-400 space-y-3">
              <p>
                If you work from home in Australia, you can claim a tax deduction for
                the additional expenses you incur. The ATO provides two methods for
                calculating your work from home deduction: the fixed rate method and
                the actual cost method.
              </p>
              <h3 className="text-lg font-semibold text-white pt-2">
                Fixed Rate Method (67 cents per hour)
              </h3>
              <p>
                From 1 July 2022, the revised fixed rate is 67 cents per hour worked
                from home. This rate covers the cost of electricity, gas, phone and
                internet usage, stationery, and computer consumables. You can still
                claim the decline in value of office furniture and technology (like
                desks, chairs, and monitors) separately. To use this method, you
                need a record of all hours worked from home during the income year,
                such as timesheets or a diary.
              </p>
              <h3 className="text-lg font-semibold text-white pt-2">
                Actual Cost Method
              </h3>
              <p>
                The actual cost method requires you to calculate the exact work-related
                portion of each expense. For electricity, this is typically based on the
                floor area of your home office and the hours you work from home. For
                internet and phone, you calculate the work-related percentage of usage.
                This method may result in a higher deduction if your expenses are
                significant, but it requires more detailed records including receipts
                for all expenses and a reasonable basis for your calculations.
              </p>
              <h3 className="text-lg font-semibold text-white pt-2">
                Record-Keeping Requirements
              </h3>
              <p>
                Regardless of which method you choose, the ATO requires you to keep
                records. For the fixed rate method, you need a record of hours worked
                from home for the entire year. For the actual cost method, you need
                receipts for all expenses, a record of how you calculated the
                work-related portion, and evidence of your working arrangements. All
                calculations in this tool run entirely in your browser -- no data is
                sent to any server.
              </p>
            </div>
          </section>

          <RelatedTools currentSlug="wfh-deduction-calculator" />

          {/* FAQ Section */}
          <section className="mt-16 border-t border-slate-700 pt-10">
            <h2 className="text-2xl font-bold text-white mb-6">
              Frequently Asked Questions
            </h2>

            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  What is the ATO fixed rate for working from home in 2025-26?
                </h3>
                <p className="text-slate-400">
                  For the 2025-26 financial year, the ATO fixed rate method allows
                  you to claim 67 cents per hour worked from home. This rate covers
                  electricity, gas, phone, internet, stationery, and computer
                  consumables. You can claim office furniture and equipment
                  depreciation separately on top of the fixed rate.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  What is the difference between the fixed rate and actual cost methods?
                </h3>
                <p className="text-slate-400">
                  The fixed rate method uses a flat 67 cents per hour to cover
                  running expenses (electricity, gas, phone, internet, stationery,
                  computer consumables). The actual cost method requires you to
                  calculate the precise work-related portion of each expense. The
                  actual cost method may give a larger deduction if your expenses are
                  high, but requires more detailed records and receipts.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  What records do I need to keep for WFH deductions?
                </h3>
                <p className="text-slate-400">
                  For the fixed rate method, you need a record of hours worked from
                  home (e.g., timesheets, rosters, diary) for the entire income year.
                  For the actual cost method, you need receipts for all expenses, a
                  method for calculating the work-related portion (e.g., floor area
                  for electricity, usage logs for internet), and records showing how
                  you determined each percentage.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Can I claim office furniture under the fixed rate method?
                </h3>
                <p className="text-slate-400">
                  Yes. The fixed rate of 67 cents per hour does NOT cover office
                  furniture, equipment, or technology (like desks, chairs, monitors,
                  or computers). You can claim depreciation on these items separately
                  in addition to the fixed rate. Items costing $300 or less can be
                  claimed as an immediate deduction, while items over $300 must be
                  depreciated over their effective life.
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
