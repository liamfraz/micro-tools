"use client";

import { useState } from "react";
import JsonLd from "@/components/JsonLd";
import RelatedTools from "@/components/RelatedTools";
import ToolBreadcrumb from "@/components/ToolBreadcrumb";
import {
  generateFAQSchema,
  generateWebAppSchema,
  generateBreadcrumbSchema,
} from "@/lib/jsonld";

const ABN_WEIGHTS = [10, 1, 3, 5, 7, 9, 11, 13, 15, 17, 19];

interface ValidationResult {
  isValid: boolean;
  reason: string;
  steps: { digit: number; weight: number; product: number }[];
  adjustedFirst: number;
  sum: number;
  remainder: number;
}

function validateABN(raw: string): ValidationResult | null {
  const digits = raw.replace(/\s/g, "");
  if (digits.length === 0) return null;

  if (!/^\d+$/.test(digits)) {
    return {
      isValid: false,
      reason: "ABN must contain only digits",
      steps: [],
      adjustedFirst: 0,
      sum: 0,
      remainder: -1,
    };
  }

  if (digits.length !== 11) {
    return {
      isValid: false,
      reason: `ABN must be exactly 11 digits (you entered ${digits.length})`,
      steps: [],
      adjustedFirst: 0,
      sum: 0,
      remainder: -1,
    };
  }

  const digitArray = digits.split("").map(Number);
  const adjustedFirst = digitArray[0] - 1;
  const adjustedDigits = [adjustedFirst, ...digitArray.slice(1)];

  const steps = adjustedDigits.map((d, i) => ({
    digit: d,
    weight: ABN_WEIGHTS[i],
    product: d * ABN_WEIGHTS[i],
  }));

  const sum = steps.reduce((acc, s) => acc + s.product, 0);
  const remainder = sum % 89;

  return {
    isValid: remainder === 0,
    reason:
      remainder === 0
        ? "ABN passes the official validation algorithm"
        : "ABN fails the validation check (remainder is not 0)",
    steps,
    adjustedFirst,
    sum,
    remainder,
  };
}

function formatABN(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) return digits;
  const parts = [digits.slice(0, 2)];
  for (let i = 2; i < digits.length; i += 3) {
    parts.push(digits.slice(i, i + 3));
  }
  return parts.join(" ");
}

export default function ABNLookupPage() {
  const [input, setInput] = useState<string>("");

  const digits = input.replace(/\s/g, "");
  const result = validateABN(input);
  const formattedABN = formatABN(input);
  const potentialACN =
    result?.isValid && digits.length === 11 ? digits.slice(2) : null;

  function handleInputChange(value: string) {
    const digitsOnly = value.replace(/\D/g, "").slice(0, 11);
    setInput(formatABN(digitsOnly));
  }

  function loadExample(abn: string) {
    setInput(abn);
  }

  return (
    <>
      <title>ABN Lookup Australia 2026 - Free ABN Validator &amp; Search | DevTools Hub</title>
      <meta
        name="description"
        content="ABN lookup Australia 2026 - Validate any Australian Business Number instantly with our free ABN validator. Client-side validation using the official ABN algorithm. No data sent to any server."
      />
      <JsonLd
        data={[
          generateWebAppSchema({
            slug: "abn-lookup",
            name: "ABN Lookup Australia",
            description:
              "Validate any Australian Business Number (ABN) instantly using the official ABN validation algorithm. Free, client-side, no data sent to any server.",
            category: "finance",
          }),
          generateBreadcrumbSchema({
            slug: "abn-lookup",
            name: "ABN Lookup Australia",
            description:
              "Validate any Australian Business Number (ABN) instantly using the official ABN validation algorithm.",
            category: "finance",
          }),
          generateFAQSchema([
            {
              question: "What is an Australian Business Number (ABN)?",
              answer:
                "An Australian Business Number (ABN) is a unique 11-digit identifier issued by the Australian Business Register (ABR) to businesses and other entities operating in Australia. It is used for tax and business identification purposes, and is required for GST registration, invoicing, and interacting with government agencies.",
            },
            {
              question: "How does the ABN validation algorithm work?",
              answer:
                "The ABN validation algorithm works by: (1) subtracting 1 from the first digit, (2) multiplying each of the 11 digits by its corresponding weighting factor [10, 1, 3, 5, 7, 9, 11, 13, 15, 17, 19], (3) summing all the products, and (4) dividing the sum by 89. If the remainder is 0, the ABN is valid. This is the official algorithm specified by the Australian Business Register.",
            },
            {
              question: "Who needs an ABN in Australia?",
              answer:
                "You need an ABN if you are carrying on an enterprise (business) in Australia, including sole traders, partnerships, companies, trusts, and other entities. You also need an ABN if you want to register for GST, claim fuel tax credits, or avoid having PAYG tax withheld from payments to you. ABNs are free to apply for through the Australian Business Register.",
            },
            {
              question: "What is the difference between an ABN and an ACN?",
              answer:
                "An ABN (Australian Business Number) is an 11-digit number for all business entities, while an ACN (Australian Company Number) is a 9-digit number issued only to companies registered under the Corporations Act 2001. A company's ABN is typically formed by adding a two-digit prefix to its ACN. Not all ABN holders have an ACN — only registered companies do.",
            },
          ]),
        ]}
      />

      <div className="min-h-screen bg-slate-900 text-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <ToolBreadcrumb slug="abn-lookup" />

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
              ABN Lookup Australia
            </h1>
            <p className="text-slate-400 max-w-2xl text-lg">
              Validate any Australian Business Number (ABN) instantly using the
              official validation algorithm. All checks run client-side — no
              data is sent to any server.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left column: Input + Results */}
            <div className="lg:col-span-2 space-y-6">
              {/* Input card */}
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
                <h2 className="text-lg font-semibold text-white mb-4">
                  Enter ABN
                </h2>
                <div className="space-y-4">
                  <div>
                    <label
                      htmlFor="abn-input"
                      className="block text-sm font-medium text-slate-300 mb-1"
                    >
                      Australian Business Number
                    </label>
                    <input
                      id="abn-input"
                      type="text"
                      inputMode="numeric"
                      value={input}
                      onChange={(e) => handleInputChange(e.target.value)}
                      className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono tracking-wider"
                      placeholder="Enter an ABN e.g. 51 824 753 556"
                    />
                  </div>
                  <button
                    onClick={() => {
                      /* validation happens on input change */
                    }}
                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg transition-colors text-sm"
                  >
                    Validate
                  </button>
                </div>
              </div>

              {/* Validation Result */}
              {result && (
                <div
                  className={`bg-slate-800 border rounded-lg p-6 ${
                    result.isValid
                      ? "border-green-500/50"
                      : "border-red-500/50"
                  }`}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <span
                      className={`text-3xl ${
                        result.isValid ? "text-green-400" : "text-red-400"
                      }`}
                    >
                      {result.isValid ? "\u2713" : "\u2717"}
                    </span>
                    <div>
                      <h2
                        className={`text-xl font-bold ${
                          result.isValid ? "text-green-400" : "text-red-400"
                        }`}
                      >
                        {result.isValid ? "Valid ABN" : "Invalid ABN"}
                      </h2>
                      <p className="text-sm text-slate-400">{result.reason}</p>
                    </div>
                  </div>

                  {/* Formatted display */}
                  <div className="bg-slate-700/50 rounded-lg p-4 mb-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xs text-slate-400 mb-1">
                          Formatted ABN
                        </div>
                        <div className="text-xl font-mono text-white tracking-wider">
                          {formattedABN}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-slate-400 mb-1">
                          Raw Digits
                        </div>
                        <div className="text-xl font-mono text-slate-300">
                          {digits}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ACN extraction */}
                  {potentialACN && (
                    <div className="bg-slate-700/50 rounded-lg p-4 mb-4">
                      <div className="text-xs text-slate-400 mb-1">
                        Potential ACN (last 9 digits)
                      </div>
                      <div className="text-lg font-mono text-blue-400">
                        {potentialACN.slice(0, 3)} {potentialACN.slice(3, 6)}{" "}
                        {potentialACN.slice(6, 9)}
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        If this ABN belongs to a company, the last 9 digits form
                        its ACN.
                      </p>
                    </div>
                  )}

                  {/* Validation calculation breakdown */}
                  {result.steps.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-slate-300 mb-3">
                        Validation Calculation Breakdown
                      </h3>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-slate-700 text-slate-400">
                              <th className="text-left px-3 py-2 font-medium">
                                Position
                              </th>
                              <th className="text-right px-3 py-2 font-medium">
                                Digit
                              </th>
                              <th className="text-right px-3 py-2 font-medium">
                                Weight
                              </th>
                              <th className="text-right px-3 py-2 font-medium">
                                Product
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {result.steps.map((step, i) => (
                              <tr
                                key={i}
                                className="border-b border-slate-700/50"
                              >
                                <td className="px-3 py-2 text-slate-400">
                                  {i + 1}
                                  {i === 0 && (
                                    <span className="text-xs text-yellow-400 ml-2">
                                      (first digit - 1)
                                    </span>
                                  )}
                                </td>
                                <td className="px-3 py-2 text-right text-white font-mono">
                                  {step.digit}
                                </td>
                                <td className="px-3 py-2 text-right text-slate-300 font-mono">
                                  {step.weight}
                                </td>
                                <td className="px-3 py-2 text-right text-blue-400 font-mono">
                                  {step.product}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot>
                            <tr className="border-t border-slate-600">
                              <td
                                colSpan={3}
                                className="px-3 py-2 text-right text-slate-300 font-medium"
                              >
                                Sum:
                              </td>
                              <td className="px-3 py-2 text-right text-white font-mono font-bold">
                                {result.sum}
                              </td>
                            </tr>
                            <tr>
                              <td
                                colSpan={3}
                                className="px-3 py-2 text-right text-slate-300 font-medium"
                              >
                                {result.sum} mod 89 =
                              </td>
                              <td
                                className={`px-3 py-2 text-right font-mono font-bold ${
                                  result.remainder === 0
                                    ? "text-green-400"
                                    : "text-red-400"
                                }`}
                              >
                                {result.remainder}
                              </td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right column: Info panel + Examples */}
            <div className="space-y-6">
              {/* ABN Info Panel */}
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-5">
                <h2 className="text-lg font-semibold text-white mb-4">
                  About ABNs
                </h2>
                <div className="space-y-3 text-sm text-slate-400">
                  <p>
                    An <strong className="text-slate-300">ABN</strong>{" "}
                    (Australian Business Number) is a unique 11-digit identifier
                    assigned to businesses operating in Australia.
                  </p>
                  <div>
                    <h3 className="text-sm font-medium text-slate-300 mb-1">
                      Structure
                    </h3>
                    <ul className="list-disc list-inside space-y-1 text-slate-400">
                      <li>
                        <strong className="text-slate-300">
                          Digits 1-2:
                        </strong>{" "}
                        Check digits (derived from the remaining 9 digits)
                      </li>
                      <li>
                        <strong className="text-slate-300">
                          Digits 3-11:
                        </strong>{" "}
                        Entity identifier (for companies, this is the ACN)
                      </li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-slate-300 mb-1">
                      Validation
                    </h3>
                    <p>
                      The first two digits are check digits calculated using a
                      weighted modulus 89 algorithm. This allows instant
                      validation without needing to query a database.
                    </p>
                  </div>
                  <div className="pt-2 border-t border-slate-700">
                    <a
                      href="https://abr.business.gov.au/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 transition-colors text-sm"
                    >
                      Visit the official ABR website for full ABN lookups
                      &rarr;
                    </a>
                  </div>
                </div>
              </div>

              {/* Example ABNs */}
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-5">
                <h2 className="text-lg font-semibold text-white mb-4">
                  Example ABNs
                </h2>
                <div className="space-y-3">
                  <button
                    onClick={() => loadExample("51 824 753 556")}
                    className="w-full text-left bg-slate-700/50 hover:bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 transition-colors"
                  >
                    <div className="font-mono text-green-400 tracking-wider">
                      51 824 753 556
                    </div>
                    <div className="text-xs text-slate-400 mt-1">
                      Valid ABN
                    </div>
                  </button>
                  <button
                    onClick={() => loadExample("12 345 678 901")}
                    className="w-full text-left bg-slate-700/50 hover:bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 transition-colors"
                  >
                    <div className="font-mono text-red-400 tracking-wider">
                      12 345 678 901
                    </div>
                    <div className="text-xs text-slate-400 mt-1">
                      Invalid ABN
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* SEO Content */}
          <section className="mt-12 bg-slate-800 border border-slate-700 rounded-lg p-6">
            <h2 className="text-2xl font-bold text-white mb-4">
              What is an ABN and Who Needs One?
            </h2>
            <div className="text-slate-400 space-y-3">
              <p>
                An Australian Business Number (ABN) is a unique 11-digit
                identifier issued by the Australian Business Register (ABR) to
                all entities registered in the Australian Business Register.
                Introduced on 1 July 2000 as part of the new tax system, the ABN
                is used for dealings with government agencies, other businesses,
                and the community.
              </p>
              <p>
                You need an ABN if you are carrying on an enterprise (business)
                in Australia. This includes sole traders, partnerships,
                companies, trusts, government entities, and superannuation
                funds. An ABN is required to register for GST, claim fuel tax
                credits, claim GST credits, and avoid having PAYG tax withheld
                from payments made to you.
              </p>
              <p>
                Applying for an ABN is free through the{" "}
                <a
                  href="https://abr.business.gov.au/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 transition-colors"
                >
                  Australian Business Register website
                </a>
                . The application process is straightforward and most applicants
                receive their ABN immediately. This tool validates ABN format
                using the official modulus 89 algorithm — for full business
                details, use the official ABR lookup service.
              </p>
            </div>
          </section>

          <RelatedTools currentSlug="abn-lookup" />

          {/* FAQ Section */}
          <section className="mt-16 border-t border-slate-700 pt-10">
            <h2 className="text-2xl font-bold text-white mb-6">
              Frequently Asked Questions
            </h2>

            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  What is an Australian Business Number (ABN)?
                </h3>
                <p className="text-slate-400">
                  An Australian Business Number (ABN) is a unique 11-digit
                  identifier issued by the Australian Business Register (ABR) to
                  businesses and other entities operating in Australia. It is
                  used for tax and business identification purposes, and is
                  required for GST registration, invoicing, and interacting with
                  government agencies.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  How does the ABN validation algorithm work?
                </h3>
                <p className="text-slate-400">
                  The ABN validation algorithm works by: (1) subtracting 1 from
                  the first digit, (2) multiplying each of the 11 digits by its
                  corresponding weighting factor [10, 1, 3, 5, 7, 9, 11, 13,
                  15, 17, 19], (3) summing all the products, and (4) dividing
                  the sum by 89. If the remainder is 0, the ABN is valid. This
                  is the official algorithm specified by the Australian Business
                  Register.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Who needs an ABN in Australia?
                </h3>
                <p className="text-slate-400">
                  You need an ABN if you are carrying on an enterprise (business)
                  in Australia, including sole traders, partnerships, companies,
                  trusts, and other entities. You also need an ABN if you want to
                  register for GST, claim fuel tax credits, or avoid having PAYG
                  tax withheld from payments to you. ABNs are free to apply for
                  through the Australian Business Register.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  What is the difference between an ABN and an ACN?
                </h3>
                <p className="text-slate-400">
                  An ABN (Australian Business Number) is an 11-digit number for
                  all business entities, while an ACN (Australian Company Number)
                  is a 9-digit number issued only to companies registered under
                  the Corporations Act 2001. A company&apos;s ABN is typically
                  formed by adding a two-digit prefix to its ACN. Not all ABN
                  holders have an ACN — only registered companies do.
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
