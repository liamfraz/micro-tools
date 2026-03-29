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

type ReportingMethod = "cash" | "accrual";
type AccountingMethod = "calculate" | "installment";

export default function BASCalculatorPage() {
  const [totalSales, setTotalSales] = useState<string>("50000");
  const [totalPurchases, setTotalPurchases] = useState<string>("30000");
  const [exportSales, setExportSales] = useState<string>("0");
  const [otherGSTFree, setOtherGSTFree] = useState<string>("5000");
  const [reportingMethod, setReportingMethod] = useState<ReportingMethod>("cash");
  const [accountingMethod, setAccountingMethod] = useState<AccountingMethod>("calculate");

  const results = useMemo(() => {
    const sales = parseFloat(totalSales) || 0;
    const purchases = parseFloat(totalPurchases) || 0;
    const exports = parseFloat(exportSales) || 0;
    const otherFree = parseFloat(otherGSTFree) || 0;

    const taxableSales = sales - exports - otherFree;
    const gstOnSales = taxableSales / 11;
    const gstOnPurchases = purchases / 11;
    const gstPayableOrRefund = gstOnSales - gstOnPurchases;

    return {
      totalSalesAmount: sales,
      gstOnSales,
      gstOnPurchases,
      gstPayableOrRefund,
      taxableSales,
      gstFreeSales: exports + otherFree,
      isRefund: gstPayableOrRefund < 0,
    };
  }, [totalSales, totalPurchases, exportSales, otherGSTFree]);

  return (
    <>
      <title>BAS Calculator Australia 2026 - Free GST Calculator | DevTools Hub</title>
      <meta
        name="description"
        content="Free BAS calculator Australia 2026. Calculate your quarterly GST amounts, estimate BAS payments or refunds, and understand your Business Activity Statement obligations."
      />
      <JsonLd
        data={[
          generateWebAppSchema({
            slug: "bas-calculator",
            name: "BAS Calculator Australia 2026",
            description:
              "Free BAS calculator for Australian businesses. Calculate quarterly GST amounts, estimate BAS payments or refunds, and understand your Business Activity Statement obligations.",
            category: "finance",
          }),
          generateBreadcrumbSchema({
            slug: "bas-calculator",
            name: "BAS Calculator Australia",
            description:
              "Calculate your quarterly GST amounts and estimate BAS payments or refunds for Australian businesses.",
            category: "finance",
          }),
          generateFAQSchema([
            {
              question: "What is a BAS (Business Activity Statement)?",
              answer:
                "A Business Activity Statement (BAS) is a form submitted to the Australian Taxation Office (ATO) by registered businesses to report and pay their tax obligations, including GST, PAYG instalments, PAYG withholding, and other taxes. Most small businesses lodge their BAS quarterly.",
            },
            {
              question: "When are quarterly BAS due dates in Australia?",
              answer:
                "Quarterly BAS due dates are: Q1 (July-September) due 28 October, Q2 (October-December) due 28 February, Q3 (January-March) due 28 April, and Q4 (April-June) due 28 July. If you lodge through a registered tax agent, you may get an extension.",
            },
            {
              question: "How is GST calculated on the BAS?",
              answer:
                "GST in Australia is 10%. If your prices include GST, divide the GST-inclusive amount by 11 to find the GST component. For example, if total sales are $110,000 (including GST), the GST amount is $110,000 / 11 = $10,000. You then subtract the GST on your purchases to determine your net GST payable or refund.",
            },
            {
              question: "What is the difference between cash and accrual BAS reporting?",
              answer:
                "Cash basis means you report GST in the period you receive or make payment. Accrual basis means you report GST in the period you issue or receive an invoice, regardless of when payment occurs. Businesses with turnover under $10 million can choose either method. Cash basis is simpler for most small businesses.",
            },
          ]),
        ]}
      />

      <div className="min-h-screen bg-slate-900 text-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <ToolBreadcrumb slug="bas-calculator" />

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
              BAS Calculator Australia 2026
            </h1>
            <p className="text-slate-400 max-w-2xl text-lg">
              Estimate your quarterly GST amounts for your Business Activity Statement.
              Enter your sales and purchase figures to calculate GST payable or refund.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Input form */}
            <div className="lg:col-span-2">
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 space-y-5">
                <h2 className="text-lg font-semibold text-white mb-2">
                  BAS Details
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label
                      htmlFor="totalSales"
                      className="block text-sm font-medium text-slate-300 mb-1"
                    >
                      Total Sales incl. GST ($)
                    </label>
                    <input
                      id="totalSales"
                      type="number"
                      min="0"
                      step="100"
                      value={totalSales}
                      onChange={(e) => setTotalSales(e.target.value)}
                      className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="50000"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="totalPurchases"
                      className="block text-sm font-medium text-slate-300 mb-1"
                    >
                      Total Purchases incl. GST ($)
                    </label>
                    <input
                      id="totalPurchases"
                      type="number"
                      min="0"
                      step="100"
                      value={totalPurchases}
                      onChange={(e) => setTotalPurchases(e.target.value)}
                      className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="30000"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="exportSales"
                      className="block text-sm font-medium text-slate-300 mb-1"
                    >
                      Export Sales (GST-free) ($)
                    </label>
                    <input
                      id="exportSales"
                      type="number"
                      min="0"
                      step="100"
                      value={exportSales}
                      onChange={(e) => setExportSales(e.target.value)}
                      className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="0"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="otherGSTFree"
                      className="block text-sm font-medium text-slate-300 mb-1"
                    >
                      Other GST-free Sales ($)
                    </label>
                    <input
                      id="otherGSTFree"
                      type="number"
                      min="0"
                      step="100"
                      value={otherGSTFree}
                      onChange={(e) => setOtherGSTFree(e.target.value)}
                      className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="5000"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="reportingMethod"
                      className="block text-sm font-medium text-slate-300 mb-1"
                    >
                      BAS Reporting Method
                    </label>
                    <select
                      id="reportingMethod"
                      value={reportingMethod}
                      onChange={(e) =>
                        setReportingMethod(e.target.value as ReportingMethod)
                      }
                      className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="cash">Cash Basis</option>
                      <option value="accrual">Accrual Basis</option>
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="accountingMethod"
                      className="block text-sm font-medium text-slate-300 mb-1"
                    >
                      GST Accounting Method
                    </label>
                    <select
                      id="accountingMethod"
                      value={accountingMethod}
                      onChange={(e) =>
                        setAccountingMethod(e.target.value as AccountingMethod)
                      }
                      className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="calculate">Calculate GST</option>
                      <option value="installment">GST Installment</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Results sidebar */}
            <div className="space-y-6">
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-5">
                <h2 className="text-lg font-semibold text-white mb-4">
                  GST Summary
                </h2>
                <div className="space-y-4">
                  <ResultCard
                    label="GST on Sales"
                    value={formatCurrency(results.gstOnSales)}
                  />
                  <ResultCard
                    label="GST on Purchases"
                    value={formatCurrency(results.gstOnPurchases)}
                  />
                  <div className="border-t border-slate-700 pt-4">
                    <ResultCard
                      label={
                        results.isRefund
                          ? "GST Refund Due to You"
                          : "GST Payable to ATO"
                      }
                      value={formatCurrency(Math.abs(results.gstPayableOrRefund))}
                      highlight
                      isRefund={results.isRefund}
                    />
                  </div>
                </div>
              </div>

              {/* Status indicator */}
              <div
                className={`border rounded-lg p-5 ${
                  results.isRefund
                    ? "bg-green-900/20 border-green-700"
                    : "bg-amber-900/20 border-amber-700"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`text-2xl ${
                      results.isRefund ? "text-green-400" : "text-amber-400"
                    }`}
                  >
                    {results.isRefund ? "$" : "$"}
                  </div>
                  <div>
                    <div
                      className={`font-semibold ${
                        results.isRefund ? "text-green-300" : "text-amber-300"
                      }`}
                    >
                      {results.isRefund ? "Refund" : "Payment Required"}
                    </div>
                    <div className="text-sm text-slate-400">
                      {results.isRefund
                        ? "You may be entitled to a GST refund from the ATO."
                        : "You owe GST to the ATO for this quarter."}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* BAS Labels Section */}
          <div className="mt-8 bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
            <div className="p-5 border-b border-slate-700">
              <h2 className="text-lg font-semibold text-white">
                BAS Label Summary
              </h2>
              <p className="text-sm text-slate-400 mt-1">
                These correspond to the labels on your official BAS form.
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700 text-slate-400">
                    <th className="text-left px-5 py-3 font-medium">Label</th>
                    <th className="text-left px-5 py-3 font-medium">Description</th>
                    <th className="text-right px-5 py-3 font-medium">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors">
                    <td className="px-5 py-3 text-blue-400 font-medium">G1</td>
                    <td className="px-5 py-3 text-slate-300">Total Sales (including GST)</td>
                    <td className="px-5 py-3 text-right text-white font-medium">
                      {formatCurrency(results.totalSalesAmount)}
                    </td>
                  </tr>
                  <tr className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors">
                    <td className="px-5 py-3 text-blue-400 font-medium">G2</td>
                    <td className="px-5 py-3 text-slate-300">Export Sales</td>
                    <td className="px-5 py-3 text-right text-white font-medium">
                      {formatCurrency(parseFloat(exportSales) || 0)}
                    </td>
                  </tr>
                  <tr className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors">
                    <td className="px-5 py-3 text-blue-400 font-medium">G3</td>
                    <td className="px-5 py-3 text-slate-300">Other GST-free Sales</td>
                    <td className="px-5 py-3 text-right text-white font-medium">
                      {formatCurrency(parseFloat(otherGSTFree) || 0)}
                    </td>
                  </tr>
                  <tr className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors">
                    <td className="px-5 py-3 text-blue-400 font-medium">G9</td>
                    <td className="px-5 py-3 text-slate-300">Taxable Sales</td>
                    <td className="px-5 py-3 text-right text-white font-medium">
                      {formatCurrency(results.taxableSales)}
                    </td>
                  </tr>
                  <tr className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors">
                    <td className="px-5 py-3 text-blue-400 font-medium">1A</td>
                    <td className="px-5 py-3 text-slate-300">GST on Sales</td>
                    <td className="px-5 py-3 text-right text-green-400 font-medium">
                      {formatCurrency(results.gstOnSales)}
                    </td>
                  </tr>
                  <tr className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors">
                    <td className="px-5 py-3 text-blue-400 font-medium">G10</td>
                    <td className="px-5 py-3 text-slate-300">Capital Purchases</td>
                    <td className="px-5 py-3 text-right text-white font-medium">
                      {formatCurrency(0)}
                    </td>
                  </tr>
                  <tr className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors">
                    <td className="px-5 py-3 text-blue-400 font-medium">G11</td>
                    <td className="px-5 py-3 text-slate-300">Non-capital Purchases</td>
                    <td className="px-5 py-3 text-right text-white font-medium">
                      {formatCurrency(parseFloat(totalPurchases) || 0)}
                    </td>
                  </tr>
                  <tr className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors">
                    <td className="px-5 py-3 text-blue-400 font-medium">1B</td>
                    <td className="px-5 py-3 text-slate-300">GST on Purchases</td>
                    <td className="px-5 py-3 text-right text-red-400 font-medium">
                      {formatCurrency(results.gstOnPurchases)}
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-700/30 transition-colors">
                    <td className="px-5 py-3 text-yellow-400 font-bold">1C</td>
                    <td className="px-5 py-3 text-white font-semibold">
                      {results.isRefund ? "Refund Due to You" : "GST Payable"}
                    </td>
                    <td
                      className={`px-5 py-3 text-right font-bold text-lg ${
                        results.isRefund ? "text-green-400" : "text-amber-400"
                      }`}
                    >
                      {formatCurrency(Math.abs(results.gstPayableOrRefund))}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* How to Use / SEO content */}
          <section className="mt-12 bg-slate-800 border border-slate-700 rounded-lg p-6">
            <h2 className="text-2xl font-bold text-white mb-4">
              What is a BAS (Business Activity Statement)?
            </h2>
            <div className="text-slate-400 space-y-3">
              <p>
                A Business Activity Statement (BAS) is a tax reporting requirement for
                all Australian businesses registered for GST. It is submitted to the
                Australian Taxation Office (ATO) either monthly, quarterly, or annually
                depending on your business size and reporting obligations. The BAS is used
                to report and pay goods and services tax (GST), pay-as-you-go (PAYG)
                instalments, PAYG withholding, and other tax obligations.
              </p>
              <p>
                Quarterly BAS lodgement dates in Australia are: Q1 (July-September) due
                28 October, Q2 (October-December) due 28 February, Q3 (January-March) due
                28 April, and Q4 (April-June) due 28 July. Late lodgement can result in
                penalties from the ATO, so it is important to lodge on time.
              </p>
              <p>
                GST in Australia is calculated at a flat rate of 10%. If your prices include
                GST, you divide by 11 to find the GST component. For example, a sale of{" "}
                <code className="bg-slate-700 px-1.5 py-0.5 rounded text-sm text-slate-300">
                  $1,100 (incl. GST)
                </code>{" "}
                contains{" "}
                <code className="bg-slate-700 px-1.5 py-0.5 rounded text-sm text-slate-300">
                  $100 GST
                </code>
                . Your net GST obligation is{" "}
                <code className="bg-slate-700 px-1.5 py-0.5 rounded text-sm text-slate-300">
                  GST on Sales - GST on Purchases = GST payable (or refund)
                </code>
                . All calculations in this tool run entirely in your browser with no data
                sent to any server.
              </p>
            </div>
          </section>

          <RelatedTools currentSlug="bas-calculator" />

          {/* FAQ Section */}
          <section className="mt-16 border-t border-slate-700 pt-10">
            <h2 className="text-2xl font-bold text-white mb-6">
              Frequently Asked Questions
            </h2>

            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  What is a BAS (Business Activity Statement)?
                </h3>
                <p className="text-slate-400">
                  A Business Activity Statement (BAS) is a form submitted to the
                  Australian Taxation Office (ATO) by registered businesses to report and
                  pay their tax obligations, including GST, PAYG instalments, PAYG
                  withholding, and other taxes. Most small businesses lodge their BAS
                  quarterly.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  When are quarterly BAS due dates in Australia?
                </h3>
                <p className="text-slate-400">
                  Quarterly BAS due dates are: Q1 (July-September) due 28 October, Q2
                  (October-December) due 28 February, Q3 (January-March) due 28 April,
                  and Q4 (April-June) due 28 July. If you lodge through a registered tax
                  agent, you may get an extension.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  How is GST calculated on the BAS?
                </h3>
                <p className="text-slate-400">
                  GST in Australia is 10%. If your prices include GST, divide the
                  GST-inclusive amount by 11 to find the GST component. For example, if
                  total sales are $110,000 (including GST), the GST amount is $110,000 /
                  11 = $10,000. You then subtract the GST on your purchases to determine
                  your net GST payable or refund.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  What is the difference between cash and accrual BAS reporting?
                </h3>
                <p className="text-slate-400">
                  Cash basis means you report GST in the period you receive or make
                  payment. Accrual basis means you report GST in the period you issue or
                  receive an invoice, regardless of when payment occurs. Businesses with
                  turnover under $10 million can choose either method. Cash basis is
                  simpler for most small businesses.
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
  isRefund,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  isRefund?: boolean;
}) {
  return (
    <div>
      <div className="text-xs text-slate-400 mb-1">{label}</div>
      <div
        className={`text-2xl font-bold ${
          highlight
            ? isRefund
              ? "text-green-400"
              : "text-amber-400"
            : "text-white"
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
