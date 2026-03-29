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

interface Trade {
  id: number;
  coin: string;
  buyDate: string;
  sellDate: string;
  buyPrice: string;
  sellPrice: string;
  quantity: string;
}

interface TradeResult {
  id: number;
  coin: string;
  gainLoss: number;
  heldDays: number;
  heldOver12Months: boolean;
  discountApplied: boolean;
  discountAmount: number;
}

const TAX_BRACKETS = [
  { min: 0, max: 18200, rate: 0, base: 0 },
  { min: 18201, max: 45000, rate: 0.16, base: 0 },
  { min: 45001, max: 135000, rate: 0.30, base: 4288 },
  { min: 135001, max: 190000, rate: 0.37, base: 31288 },
  { min: 190001, max: Infinity, rate: 0.45, base: 51638 },
];

function getMarginalRate(income: number): number {
  for (let i = TAX_BRACKETS.length - 1; i >= 0; i--) {
    if (income >= TAX_BRACKETS[i].min) {
      return TAX_BRACKETS[i].rate;
    }
  }
  return 0;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

let nextId = 4;

const DEFAULT_TRADES: Trade[] = [
  {
    id: 1,
    coin: "BTC",
    buyDate: "2024-01-15",
    sellDate: "2025-06-20",
    buyPrice: "62000",
    sellPrice: "105000",
    quantity: "0.5",
  },
  {
    id: 2,
    coin: "ETH",
    buyDate: "2025-01-10",
    sellDate: "2025-06-15",
    buyPrice: "3200",
    sellPrice: "3800",
    quantity: "2",
  },
  {
    id: 3,
    coin: "SOL",
    buyDate: "2024-03-01",
    sellDate: "2025-05-01",
    buyPrice: "180",
    sellPrice: "120",
    quantity: "10",
  },
];

export default function CryptoTaxCalculatorAuPage() {
  const [trades, setTrades] = useState<Trade[]>(DEFAULT_TRADES);
  const [annualIncome, setAnnualIncome] = useState<string>("95000");

  const addTrade = () => {
    setTrades((prev) => [
      ...prev,
      {
        id: nextId++,
        coin: "",
        buyDate: "",
        sellDate: "",
        buyPrice: "",
        sellPrice: "",
        quantity: "",
      },
    ]);
  };

  const removeTrade = (id: number) => {
    setTrades((prev) => prev.filter((t) => t.id !== id));
  };

  const updateTrade = (id: number, field: keyof Trade, value: string) => {
    setTrades((prev) =>
      prev.map((t) => (t.id === id ? { ...t, [field]: value } : t))
    );
  };

  const results = useMemo(() => {
    const tradeResults: TradeResult[] = trades.map((trade) => {
      const buyPrice = parseFloat(trade.buyPrice) || 0;
      const sellPrice = parseFloat(trade.sellPrice) || 0;
      const quantity = parseFloat(trade.quantity) || 0;
      const gainLoss = (sellPrice - buyPrice) * quantity;

      let heldDays = 0;
      let heldOver12Months = false;
      if (trade.buyDate && trade.sellDate) {
        const buy = new Date(trade.buyDate);
        const sell = new Date(trade.sellDate);
        heldDays = Math.floor(
          (sell.getTime() - buy.getTime()) / (1000 * 60 * 60 * 24)
        );
        heldOver12Months = heldDays > 365;
      }

      const discountApplied = heldOver12Months && gainLoss > 0;
      const discountAmount = discountApplied ? gainLoss * 0.5 : 0;

      return {
        id: trade.id,
        coin: trade.coin,
        gainLoss,
        heldDays,
        heldOver12Months,
        discountApplied,
        discountAmount,
      };
    });

    // ATO method:
    // 1. Sum all capital gains (before discount)
    const totalGains = tradeResults.reduce(
      (sum, t) => sum + (t.gainLoss > 0 ? t.gainLoss : 0),
      0
    );

    // 2. Sum all capital losses
    const totalLosses = tradeResults.reduce(
      (sum, t) => sum + (t.gainLoss < 0 ? Math.abs(t.gainLoss) : 0),
      0
    );

    // 3. Net gain before discount (gains - losses)
    const netGainBeforeDiscount = Math.max(0, totalGains - totalLosses);

    // 4. Calculate discount: proportional to discountable gains
    // Total discountable gains (held > 12 months with positive gain)
    const totalDiscountableGains = tradeResults.reduce(
      (sum, t) => sum + (t.discountApplied ? t.gainLoss : 0),
      0
    );

    // Discount ratio: proportion of gains that are discountable
    const discountRatio =
      totalGains > 0 ? totalDiscountableGains / totalGains : 0;

    // Apply discount to the net gain proportionally
    const discountAmount = netGainBeforeDiscount * discountRatio * 0.5;

    // 5. Taxable capital gain
    const taxableCapitalGain = Math.max(0, netGainBeforeDiscount - discountAmount);

    // 6. Estimated tax using marginal rate
    const income = parseFloat(annualIncome) || 0;
    const marginalRate = getMarginalRate(income);
    const estimatedTax = taxableCapitalGain * marginalRate;

    return {
      tradeResults,
      totalGains,
      totalLosses,
      netGainBeforeDiscount,
      discountAmount,
      taxableCapitalGain,
      marginalRate,
      estimatedTax,
    };
  }, [trades, annualIncome]);

  return (
    <>
      <title>Crypto Tax Calculator Australia 2026 - Free CGT Calculator | DevTools Hub</title>
      <meta
        name="description"
        content="Free crypto tax calculator Australia 2026. Calculate capital gains tax on cryptocurrency trades with the 50% CGT discount for assets held over 12 months. ATO compliant."
      />
      <JsonLd
        data={[
          generateWebAppSchema({
            slug: "crypto-tax-calculator-au",
            name: "Crypto Tax Calculator Australia 2026",
            description:
              "Calculate capital gains tax on cryptocurrency trades with the 50% CGT discount. ATO compliant Australian crypto tax calculator.",
            category: "finance",
          }),
          generateBreadcrumbSchema({
            slug: "crypto-tax-calculator-au",
            name: "Crypto Tax Calculator Australia",
            description:
              "Calculate capital gains tax on cryptocurrency trades with the 50% CGT discount for assets held over 12 months.",
            category: "finance",
          }),
          generateFAQSchema([
            {
              question: "How is cryptocurrency taxed in Australia?",
              answer:
                "In Australia, cryptocurrency is treated as property (not currency) for tax purposes. Disposing of crypto — including selling, trading, gifting, or using it to purchase goods — triggers a Capital Gains Tax (CGT) event. You must report all capital gains and losses in your tax return. The ATO requires records of every transaction including dates, amounts in AUD, what the crypto was used for, and the other party's wallet details.",
            },
            {
              question: "What is the 50% CGT discount for crypto?",
              answer:
                "If you hold a cryptocurrency asset for more than 12 months before disposing of it, you may be eligible for the 50% CGT discount. This means only half of your net capital gain is added to your taxable income. The discount only applies to gains — it does not increase losses. Capital losses must be offset against gains before the discount is applied.",
            },
            {
              question: "Can I offset crypto losses against crypto gains?",
              answer:
                "Yes, capital losses from cryptocurrency can be offset against capital gains from other crypto assets or other CGT assets (like shares or property). If your total capital losses exceed your total capital gains, you cannot claim a net capital loss against other income (like salary), but you can carry the loss forward to offset future capital gains.",
            },
            {
              question: "What records do I need to keep for crypto tax in Australia?",
              answer:
                "The ATO requires you to keep records of all cryptocurrency transactions for at least 5 years. This includes the date of each transaction, the value in AUD at the time, what the transaction was for, the other party's wallet address, exchange records, and digital wallet records. Using a dedicated crypto tax tool or spreadsheet to track cost basis is highly recommended.",
            },
          ]),
        ]}
      />

      <div className="min-h-screen bg-slate-900 text-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <ToolBreadcrumb slug="crypto-tax-calculator-au" />

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
              Crypto Tax Calculator Australia 2026
            </h1>
            <p className="text-slate-400 max-w-2xl text-lg">
              Calculate capital gains tax on your cryptocurrency trades using
              Australian 2025-26 tax brackets. Add your trades, and the
              calculator will determine CGT discount eligibility, net capital
              gains, and estimated tax payable.
            </p>
          </div>

          {/* Annual Income Input */}
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 mb-6">
            <h2 className="text-lg font-semibold text-white mb-4">
              Your Details
            </h2>
            <div className="max-w-xs">
              <label
                htmlFor="annualIncome"
                className="block text-sm font-medium text-slate-300 mb-1"
              >
                Annual Income ($AUD)
              </label>
              <input
                id="annualIncome"
                type="number"
                min="0"
                step="1000"
                value={annualIncome}
                onChange={(e) => setAnnualIncome(e.target.value)}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="95000"
              />
              <p className="text-xs text-slate-500 mt-1">
                Used to determine your marginal tax rate (
                {(results.marginalRate * 100).toFixed(0)}%)
              </p>
            </div>
          </div>

          {/* Trades Table */}
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">
                Crypto Trades / Disposals
              </h2>
              <button
                onClick={addTrade}
                className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
              >
                + Add Trade
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700 text-slate-400">
                    <th className="text-left px-3 py-3 font-medium">Coin</th>
                    <th className="text-left px-3 py-3 font-medium">
                      Buy Date
                    </th>
                    <th className="text-left px-3 py-3 font-medium">
                      Sell Date
                    </th>
                    <th className="text-right px-3 py-3 font-medium">
                      Buy Price
                    </th>
                    <th className="text-right px-3 py-3 font-medium">
                      Sell Price
                    </th>
                    <th className="text-right px-3 py-3 font-medium">Qty</th>
                    <th className="text-right px-3 py-3 font-medium">
                      Gain/Loss
                    </th>
                    <th className="text-center px-3 py-3 font-medium">Held</th>
                    <th className="text-center px-3 py-3 font-medium">
                      Discount
                    </th>
                    <th className="px-3 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {trades.map((trade, idx) => {
                    const result = results.tradeResults[idx];
                    return (
                      <tr
                        key={trade.id}
                        className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors"
                      >
                        <td className="px-3 py-2">
                          <input
                            type="text"
                            value={trade.coin}
                            onChange={(e) =>
                              updateTrade(trade.id, "coin", e.target.value)
                            }
                            className="w-20 bg-slate-700 border border-slate-600 rounded px-2 py-1.5 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="BTC"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="date"
                            value={trade.buyDate}
                            onChange={(e) =>
                              updateTrade(trade.id, "buyDate", e.target.value)
                            }
                            className="bg-slate-700 border border-slate-600 rounded px-2 py-1.5 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="date"
                            value={trade.sellDate}
                            onChange={(e) =>
                              updateTrade(trade.id, "sellDate", e.target.value)
                            }
                            className="bg-slate-700 border border-slate-600 rounded px-2 py-1.5 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={trade.buyPrice}
                            onChange={(e) =>
                              updateTrade(trade.id, "buyPrice", e.target.value)
                            }
                            className="w-28 bg-slate-700 border border-slate-600 rounded px-2 py-1.5 text-sm text-slate-200 text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="0.00"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={trade.sellPrice}
                            onChange={(e) =>
                              updateTrade(trade.id, "sellPrice", e.target.value)
                            }
                            className="w-28 bg-slate-700 border border-slate-600 rounded px-2 py-1.5 text-sm text-slate-200 text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="0.00"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={trade.quantity}
                            onChange={(e) =>
                              updateTrade(trade.id, "quantity", e.target.value)
                            }
                            className="w-20 bg-slate-700 border border-slate-600 rounded px-2 py-1.5 text-sm text-slate-200 text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="0"
                          />
                        </td>
                        <td
                          className={`px-3 py-2 text-right font-medium ${
                            result && result.gainLoss >= 0
                              ? "text-green-400"
                              : "text-red-400"
                          }`}
                        >
                          {result
                            ? formatCurrency(result.gainLoss)
                            : "$0.00"}
                        </td>
                        <td className="px-3 py-2 text-center text-slate-400">
                          {result && result.heldDays > 0
                            ? result.heldOver12Months
                              ? `${Math.floor(result.heldDays / 30)}mo`
                              : `${result.heldDays}d`
                            : "-"}
                        </td>
                        <td className="px-3 py-2 text-center">
                          {result && result.discountApplied ? (
                            <span className="text-green-400 font-medium">
                              50%
                            </span>
                          ) : (
                            <span className="text-slate-500">-</span>
                          )}
                        </td>
                        <td className="px-3 py-2">
                          <button
                            onClick={() => removeTrade(trade.id)}
                            className="text-slate-500 hover:text-red-400 transition-colors text-lg leading-none"
                            title="Remove trade"
                          >
                            x
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {trades.length === 0 && (
              <p className="text-slate-500 text-center py-8">
                No trades added. Click &quot;+ Add Trade&quot; to get started.
              </p>
            )}
          </div>

          {/* Summary Results */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-white mb-4">
                Capital Gains Summary
              </h2>
              <div className="space-y-4">
                <ResultCard
                  label="Total Capital Gains"
                  value={formatCurrency(results.totalGains)}
                />
                <ResultCard
                  label="Total Capital Losses"
                  value={formatCurrency(results.totalLosses)}
                  negative
                />
                <ResultCard
                  label="Net Gain (Before Discount)"
                  value={formatCurrency(results.netGainBeforeDiscount)}
                />
              </div>
            </div>

            <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-white mb-4">
                CGT Discount
              </h2>
              <div className="space-y-4">
                <ResultCard
                  label="50% CGT Discount Applied"
                  value={formatCurrency(results.discountAmount)}
                />
                <ResultCard
                  label="Taxable Capital Gain"
                  value={formatCurrency(results.taxableCapitalGain)}
                  highlight
                />
              </div>
            </div>

            <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-white mb-4">
                Estimated Tax
              </h2>
              <div className="space-y-4">
                <ResultCard
                  label="Marginal Tax Rate"
                  value={`${(results.marginalRate * 100).toFixed(0)}%`}
                />
                <ResultCard
                  label="Estimated CGT Payable"
                  value={formatCurrency(results.estimatedTax)}
                  highlight
                />
              </div>
              <p className="text-xs text-slate-500 mt-4">
                Estimate only. Does not include Medicare levy (2%) or other
                offsets. Consult a registered tax agent for accurate advice.
              </p>
            </div>
          </div>

          {/* 2025-26 Tax Brackets Reference */}
          <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden mb-8">
            <div className="p-5 border-b border-slate-700">
              <h2 className="text-lg font-semibold text-white">
                2025-26 Australian Tax Brackets
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700 text-slate-400">
                    <th className="text-left px-5 py-3 font-medium">
                      Income Range
                    </th>
                    <th className="text-right px-5 py-3 font-medium">
                      Tax Rate
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { range: "$0 - $18,200", rate: "0%" },
                    { range: "$18,201 - $45,000", rate: "16%" },
                    { range: "$45,001 - $135,000", rate: "30%" },
                    { range: "$135,001 - $190,000", rate: "37%" },
                    { range: "$190,001+", rate: "45%" },
                  ].map((row) => (
                    <tr
                      key={row.range}
                      className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors"
                    >
                      <td className="px-5 py-3 text-slate-300">{row.range}</td>
                      <td className="px-5 py-3 text-right text-white font-medium">
                        {row.rate}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* SEO Content */}
          <section className="mt-12 bg-slate-800 border border-slate-700 rounded-lg p-6">
            <h2 className="text-2xl font-bold text-white mb-4">
              How Crypto is Taxed in Australia
            </h2>
            <div className="text-slate-400 space-y-3">
              <p>
                The Australian Taxation Office (ATO) treats cryptocurrency as
                property, not as currency. This means every time you dispose of
                a crypto asset — whether by selling, trading for another crypto,
                gifting, or using it to buy goods or services — you trigger a
                Capital Gains Tax (CGT) event. You must calculate the capital
                gain or loss for each disposal and report it in your tax return.
              </p>
              <p>
                Your capital gain is calculated as the difference between what
                you received (the sale price) and your cost base (the purchase
                price plus any associated costs like exchange fees). If you held
                the asset for more than 12 months before disposing of it, you
                may be eligible for the 50% CGT discount, which halves your
                taxable gain on that asset.
              </p>
              <p>
                The ATO method for calculating net capital gains follows a
                specific order: first, total all your capital gains for the
                financial year; second, subtract any capital losses (current year
                or carried forward); third, apply the 50% discount to any
                remaining net gains from assets held longer than 12 months. The
                resulting taxable capital gain is then added to your other
                taxable income and taxed at your marginal rate.
              </p>
              <p>
                It is essential to keep detailed records of every crypto
                transaction. The ATO has data-matching programs with Australian
                cryptocurrency exchanges and can identify taxpayers who have
                bought or sold crypto. Penalties for not reporting crypto gains
                can be significant. All calculations in this tool run entirely in
                your browser — no data is sent to any server.
              </p>
            </div>
          </section>

          <RelatedTools currentSlug="crypto-tax-calculator-au" />

          {/* FAQ Section */}
          <section className="mt-16 border-t border-slate-700 pt-10">
            <h2 className="text-2xl font-bold text-white mb-6">
              Frequently Asked Questions
            </h2>

            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  How is cryptocurrency taxed in Australia?
                </h3>
                <p className="text-slate-400">
                  In Australia, cryptocurrency is treated as property (not
                  currency) for tax purposes. Disposing of crypto — including
                  selling, trading, gifting, or using it to purchase goods —
                  triggers a Capital Gains Tax (CGT) event. You must report all
                  capital gains and losses in your tax return. The ATO requires
                  records of every transaction including dates, amounts in AUD,
                  what the crypto was used for, and the other party&apos;s wallet
                  details.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  What is the 50% CGT discount for crypto?
                </h3>
                <p className="text-slate-400">
                  If you hold a cryptocurrency asset for more than 12 months
                  before disposing of it, you may be eligible for the 50% CGT
                  discount. This means only half of your net capital gain is
                  added to your taxable income. The discount only applies to
                  gains — it does not increase losses. Capital losses must be
                  offset against gains before the discount is applied.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Can I offset crypto losses against crypto gains?
                </h3>
                <p className="text-slate-400">
                  Yes, capital losses from cryptocurrency can be offset against
                  capital gains from other crypto assets or other CGT assets
                  (like shares or property). If your total capital losses exceed
                  your total capital gains, you cannot claim a net capital loss
                  against other income (like salary), but you can carry the loss
                  forward to offset future capital gains.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  What records do I need to keep for crypto tax in Australia?
                </h3>
                <p className="text-slate-400">
                  The ATO requires you to keep records of all cryptocurrency
                  transactions for at least 5 years. This includes the date of
                  each transaction, the value in AUD at the time, what the
                  transaction was for, the other party&apos;s wallet address,
                  exchange records, and digital wallet records. Using a dedicated
                  crypto tax tool or spreadsheet to track cost basis is highly
                  recommended.
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
  negative,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  negative?: boolean;
}) {
  return (
    <div>
      <div className="text-xs text-slate-400 mb-1">{label}</div>
      <div
        className={`text-2xl font-bold ${
          highlight
            ? "text-green-400"
            : negative
            ? "text-red-400"
            : "text-white"
        }`}
      >
        {value}
      </div>
    </div>
  );
}
