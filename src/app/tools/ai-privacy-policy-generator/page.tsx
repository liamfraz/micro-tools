"use client";

import { useState, useCallback } from "react";
import JsonLd from "@/components/JsonLd";
import RelatedTools from "@/components/RelatedTools";
import AdUnit from "@/components/AdUnit";
import ToolBreadcrumb from "@/components/ToolBreadcrumb";
import {
  generateFAQSchema,
  generateWebAppSchema,
  generateBreadcrumbSchema,
} from "@/lib/jsonld";
import { getRemainingUses, recordUsage, callAI } from "@/lib/ai-helpers";

const SLUG = "ai-privacy-policy-generator";

interface PolicySection {
  heading: string;
  content: string;
}

interface PolicyResult {
  title: string;
  lastUpdated: string;
  sections: PolicySection[];
}

type BusinessType =
  | "SaaS"
  | "E-commerce"
  | "Blog"
  | "Mobile App"
  | "Marketplace"
  | "Consulting"
  | "Agency"
  | "Other";

const BUSINESS_TYPES: { value: BusinessType; label: string }[] = [
  { value: "SaaS", label: "SaaS" },
  { value: "E-commerce", label: "E-commerce" },
  { value: "Blog", label: "Blog" },
  { value: "Mobile App", label: "Mobile App" },
  { value: "Marketplace", label: "Marketplace" },
  { value: "Consulting", label: "Consulting" },
  { value: "Agency", label: "Agency" },
  { value: "Other", label: "Other" },
];

const TOOL_INFO = {
  slug: SLUG,
  name: "AI Privacy Policy Generator",
  description:
    "Generate a basic privacy policy for your website or app. Enter your business details and get a professional privacy policy instantly. Free AI-powered generator",
  category: "ai",
};

const FAQ_DATA = [
  {
    question: "Is the generated privacy policy legally binding?",
    answer:
      "The generated privacy policy is a basic template intended as a starting point. While it covers common sections like data collection, cookies, and user rights, it should be reviewed and customized by a legal professional to ensure full compliance with applicable laws such as GDPR, CCPA, and other regional regulations.",
  },
  {
    question: "What information do I need to provide?",
    answer:
      "You only need to provide your business name and select your business type. Optionally, you can add your website URL and contact email to personalize the policy further. The tool uses these details to generate a tailored privacy policy document.",
  },
  {
    question: "Can I edit the generated privacy policy?",
    answer:
      "Yes. After generating the policy, you can copy it as plain text or HTML and paste it into any document editor or directly into your website. We recommend reviewing and customizing the content to match your specific data practices before publishing.",
  },
];

export default function AIPrivacyPolicyGeneratorPage() {
  const [businessName, setBusinessName] = useState("");
  const [businessType, setBusinessType] = useState<BusinessType>("SaaS");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [result, setResult] = useState<PolicyResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copiedType, setCopiedType] = useState<string | null>(null);
  const [remaining, setRemaining] = useState(() =>
    getRemainingUses(SLUG)
  );

  const handleGenerate = useCallback(async () => {
    if (!businessName.trim()) return;

    const uses = getRemainingUses(SLUG);
    if (uses <= 0) {
      setError(
        "You have reached your daily limit of 5 free generations. Please try again tomorrow."
      );
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await callAI("privacy-policy", {
        businessName: businessName.trim(),
        businessType,
        websiteUrl: websiteUrl.trim(),
        contactEmail: contactEmail.trim(),
      });

      if (response.error) {
        setError(response.error);
        return;
      }

      const policyResult = response.result as PolicyResult;
      if (
        !policyResult ||
        !policyResult.sections ||
        !Array.isArray(policyResult.sections)
      ) {
        setError("Unexpected response format. Please try again.");
        return;
      }

      setResult(policyResult);
      recordUsage(SLUG);
      setRemaining(getRemainingUses(SLUG));
    } catch {
      setError("Failed to generate privacy policy. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [businessName, businessType, websiteUrl, contactEmail]);

  const buildPlainText = useCallback((): string => {
    if (!result) return "";
    const lines: string[] = [];
    lines.push(result.title);
    lines.push(`Last Updated: ${result.lastUpdated}`);
    lines.push("");
    for (const section of result.sections) {
      lines.push(section.heading);
      lines.push(section.content);
      lines.push("");
    }
    return lines.join("\n");
  }, [result]);

  const buildHTML = useCallback((): string => {
    if (!result) return "";
    const parts: string[] = [];
    parts.push(`<h1>${result.title}</h1>`);
    parts.push(
      `<p><em>Last Updated: ${result.lastUpdated}</em></p>`
    );
    for (const section of result.sections) {
      parts.push(`<h2>${section.heading}</h2>`);
      const paragraphs = section.content
        .split("\n")
        .filter((p) => p.trim())
        .map((p) => `<p>${p}</p>`)
        .join("\n");
      parts.push(paragraphs);
    }
    return parts.join("\n\n");
  }, [result]);

  const copyToClipboard = useCallback(
    async (type: "text" | "html") => {
      try {
        const content = type === "text" ? buildPlainText() : buildHTML();
        await navigator.clipboard.writeText(content);
        setCopiedType(type);
        setTimeout(() => setCopiedType(null), 2000);
      } catch {
        /* clipboard not available */
      }
    },
    [buildPlainText, buildHTML]
  );

  return (
    <>
      <JsonLd
        data={[
          generateWebAppSchema(TOOL_INFO),
          generateBreadcrumbSchema(TOOL_INFO),
          generateFAQSchema(FAQ_DATA),
        ]}
      />

      <div className="min-h-screen bg-slate-900 text-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <ToolBreadcrumb slug={SLUG} />

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
              AI Privacy Policy Generator
            </h1>
            <p className="text-slate-400 max-w-2xl text-lg">
              Generate a professional privacy policy for your website or app.
              Enter your business details and get a comprehensive policy
              document instantly, powered by AI.
            </p>
          </div>

          <AdUnit slot="1234567890" format="horizontal" className="my-6" />

          {/* Input Form */}
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 mb-6">
            <h2 className="text-lg font-semibold text-white mb-4">
              Business Details
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              {/* Business Name */}
              <div>
                <label className="text-xs text-slate-400 mb-1.5 block">
                  Business Name *
                </label>
                <input
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="e.g., Acme Inc."
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Business Type */}
              <div>
                <label className="text-xs text-slate-400 mb-1.5 block">
                  Business Type *
                </label>
                <select
                  value={businessType}
                  onChange={(e) =>
                    setBusinessType(e.target.value as BusinessType)
                  }
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {BUSINESS_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Website URL */}
              <div>
                <label className="text-xs text-slate-400 mb-1.5 block">
                  Website URL (optional)
                </label>
                <input
                  type="text"
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  placeholder="e.g., https://example.com"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Contact Email */}
              <div>
                <label className="text-xs text-slate-400 mb-1.5 block">
                  Contact Email (optional)
                </label>
                <input
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="e.g., privacy@example.com"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Generate Button + Remaining Uses */}
            <div className="flex flex-wrap items-center gap-4">
              <button
                onClick={handleGenerate}
                disabled={!businessName.trim() || loading || remaining <= 0}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading && (
                  <svg
                    className="animate-spin h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                )}
                {loading ? "Generating..." : "Generate Privacy Policy"}
              </button>

              <span className="text-sm text-slate-400">
                {remaining}/5 free generations remaining today
              </span>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-900/30 border border-red-700 rounded-lg p-4 mb-6">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {/* Results Display */}
          {result && (
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 mb-6">
              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 bg-slate-700 px-2 py-1 rounded">
                    Powered by AI
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => copyToClipboard("text")}
                    className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors text-sm"
                  >
                    {copiedType === "text" ? "Copied!" : "Copy as Text"}
                  </button>
                  <button
                    onClick={() => copyToClipboard("html")}
                    className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors text-sm"
                  >
                    {copiedType === "html" ? "Copied!" : "Copy as HTML"}
                  </button>
                </div>
              </div>

              {/* Rendered Policy */}
              <div className="bg-slate-900 border border-slate-700 rounded-lg p-6 sm:p-8">
                <h2 className="text-2xl font-bold text-white mb-1">
                  {result.title}
                </h2>
                <p className="text-sm text-slate-500 mb-8">
                  Last Updated: {result.lastUpdated}
                </p>

                <div className="space-y-6">
                  {result.sections.map((section, index) => (
                    <div key={index}>
                      <h3 className="text-lg font-semibold text-white mb-2">
                        {section.heading}
                      </h3>
                      <div className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
                        {section.content}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Disclaimer */}
              <div className="mt-4 p-3 bg-yellow-900/20 border border-yellow-700/40 rounded-lg">
                <p className="text-xs text-yellow-400">
                  This is a basic template. Consult a legal professional for
                  compliance advice.
                </p>
              </div>
            </div>
          )}

          {/* Empty State */}
          {!result && !loading && !error && (
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-8 mb-6 text-center">
              <p className="text-slate-500">
                Enter your business details above and click &ldquo;Generate
                Privacy Policy&rdquo; to create a professional privacy policy
                document.
              </p>
            </div>
          )}

          {/* Privacy Policy Tips */}
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 mb-6">
            <h2 className="text-lg font-semibold text-white mb-4">
              Privacy Policy Best Practices
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
              {[
                {
                  name: "Be Transparent",
                  tip: "Clearly explain what data you collect, why you collect it, and how it is used. Users trust businesses that are upfront about their data practices.",
                },
                {
                  name: "Keep It Updated",
                  tip: "Review and update your privacy policy regularly, especially when you add new features, third-party services, or change data handling procedures.",
                },
                {
                  name: "Use Plain Language",
                  tip: "Avoid legal jargon where possible. A privacy policy that users can actually understand builds more trust than one filled with complex terminology.",
                },
                {
                  name: "Cover All Data Types",
                  tip: "Include information about cookies, analytics, form submissions, payment data, and any third-party integrations that process user information.",
                },
                {
                  name: "Include User Rights",
                  tip: "Outline how users can access, modify, or delete their data. This is required by regulations like GDPR and CCPA and demonstrates respect for user privacy.",
                },
                {
                  name: "Make It Accessible",
                  tip: "Link your privacy policy prominently in the footer, during account signup, and wherever you collect personal information from users.",
                },
              ].map((item) => (
                <div key={item.name}>
                  <h3 className="text-sm font-medium text-white mb-1">
                    {item.name}
                  </h3>
                  <p className="text-xs text-slate-400">{item.tip}</p>
                </div>
              ))}
            </div>
          </div>

          <AdUnit slot="0987654321" format="rectangle" className="my-6" />

          <RelatedTools currentSlug={SLUG} />

          {/* FAQ Section */}
          <section className="mt-16 border-t border-slate-700 pt-10">
            <h2 className="text-2xl font-bold text-white mb-6">
              Frequently Asked Questions
            </h2>

            <div className="space-y-6">
              {FAQ_DATA.map((faq) => (
                <div key={faq.question}>
                  <h3 className="text-lg font-semibold text-white mb-2">
                    {faq.question}
                  </h3>
                  <p className="text-slate-400">{faq.answer}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
