"use client";

import { useState, useCallback, useEffect } from "react";
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

const SLUG = "ai-color-palette-generator";

const toolInfo = {
  slug: SLUG,
  name: "AI Color Palette Generator",
  description:
    "Enter a mood or brand description and get 5 harmonious colors with hex, RGB, and Tailwind CSS classes. Free AI-powered color palette generator",
  category: "ai",
};

interface ColorResult {
  name: string;
  hex: string;
  rgb: string;
  tailwind: string;
}

export default function AIColorPaletteGeneratorPage() {
  const [description, setDescription] = useState("");
  const [colors, setColors] = useState<ColorResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [remaining, setRemaining] = useState(5);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  useEffect(() => {
    setRemaining(getRemainingUses(SLUG));
  }, []);

  const handleGenerate = useCallback(async () => {
    if (!description.trim()) return;

    const uses = getRemainingUses(SLUG);
    if (uses <= 0) {
      setError("Daily limit reached. Come back tomorrow for 5 more free generations.");
      return;
    }

    setLoading(true);
    setError("");
    setColors([]);
    setCopiedIndex(null);

    try {
      const response = await callAI("color-palette", { description: description.trim() });

      if (response.error) {
        setError(response.error);
        return;
      }

      const data = response.result as { colors: ColorResult[] } | undefined;
      if (!data?.colors || !Array.isArray(data.colors)) {
        setError("Unexpected response format. Please try again.");
        return;
      }

      setColors(data.colors);
      recordUsage(SLUG);
      setRemaining(getRemainingUses(SLUG));
    } catch {
      setError("Failed to generate palette. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }, [description]);

  const copyHex = useCallback(async (hex: string, index: number) => {
    try {
      await navigator.clipboard.writeText(hex);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch {
      /* clipboard not available */
    }
  }, []);

  return (
    <main className="min-h-screen bg-slate-900 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <ToolBreadcrumb slug={SLUG} />

        <JsonLd
          data={[
            generateWebAppSchema(toolInfo),
            generateBreadcrumbSchema(toolInfo),
            generateFAQSchema([
              {
                question: "How does the AI Color Palette Generator work?",
                answer:
                  "Enter a mood, theme, or brand description (e.g. 'calm ocean vibes' or 'bold startup energy') and the AI analyzes your input to generate 5 harmonious colors. Each color includes its hex code, RGB value, and closest Tailwind CSS class for easy use in your projects.",
              },
              {
                question: "How many palettes can I generate for free?",
                answer:
                  "You get 5 free palette generations per day. The limit resets every 24 hours. No account or sign-up is required -- just start generating palettes right away.",
              },
              {
                question:
                  "Can I use the generated color palettes in my projects?",
                answer:
                  "Yes, all generated palettes are free to use in any project -- websites, apps, presentations, branding, social media graphics, and more. Each color comes with hex, RGB, and Tailwind CSS class values so you can copy and paste directly into your code or design tool.",
              },
            ]),
          ]}
        />

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
            AI Color Palette Generator
          </h1>
          <p className="text-slate-400 max-w-2xl text-lg">
            Describe a mood, theme, or brand and get 5 harmonious colors with
            hex codes, RGB values, and Tailwind CSS classes -- powered by AI.
          </p>
          <span className="inline-block mt-3 px-3 py-1 text-xs font-medium bg-violet-600/20 text-violet-300 border border-violet-500/30 rounded-full">
            Powered by AI
          </span>
        </div>

        <AdUnit slot="1234567890" format="horizontal" className="my-6" />

        {/* Input Section */}
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 mb-6">
          <label className="text-xs text-slate-400 mb-1.5 block">
            Mood or Brand Description
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && description.trim() && !loading) handleGenerate();
            }}
            placeholder="e.g., calm ocean vibes, bold startup energy, cozy autumn cafe"
            className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-3 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-4"
          />

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleGenerate}
              disabled={!description.trim() || loading || remaining <= 0}
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
              {loading ? "Generating..." : "Generate Palette"}
            </button>
            <span className="text-sm text-slate-400">
              {remaining}/5 free generations remaining today
            </span>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-900/30 border border-red-700/50 rounded-lg p-4 mb-6">
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        )}

        {/* Results Section */}
        {colors.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-white mb-4">
              Generated Palette
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {colors.map((color, index) => (
                <div
                  key={index}
                  className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden"
                >
                  <div
                    className="w-full h-28 rounded-t-lg"
                    style={{ backgroundColor: color.hex }}
                  />
                  <div className="p-3 space-y-1.5">
                    <p className="text-sm font-medium text-white truncate">
                      {color.name}
                    </p>
                    <p className="text-xs text-slate-400 font-mono">
                      {color.hex}
                    </p>
                    <p className="text-xs text-slate-400 font-mono">
                      {color.rgb}
                    </p>
                    <p className="text-xs text-slate-500 font-mono truncate">
                      {color.tailwind}
                    </p>
                    <button
                      onClick={() => copyHex(color.hex, index)}
                      className="w-full mt-1 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white rounded text-xs font-medium transition-colors"
                    >
                      {copiedIndex === index ? "Copied!" : "Copy hex"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {colors.length === 0 && !loading && !error && (
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-8 mb-6 text-center">
            <p className="text-slate-500">
              Describe a mood, brand, or theme above and click &ldquo;Generate
              Palette&rdquo; to get 5 harmonious colors.
            </p>
          </div>
        )}

        {/* How It Works */}
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold text-white mb-4">
            How It Works
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
            <div>
              <h3 className="text-sm font-medium text-white mb-1">
                1. Describe Your Vision
              </h3>
              <p className="text-xs text-slate-400">
                Enter a mood, brand personality, or theme. Be as creative or
                specific as you like -- &ldquo;minimalist Japanese garden&rdquo;
                or &ldquo;90s retro arcade&rdquo; both work.
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-white mb-1">
                2. AI Generates Colors
              </h3>
              <p className="text-xs text-slate-400">
                The AI analyzes your description and selects 5 harmonious colors
                that match the mood, considering color theory principles like
                contrast and complementary tones.
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-white mb-1">
                3. Copy and Use
              </h3>
              <p className="text-xs text-slate-400">
                Each color comes with hex, RGB, and Tailwind CSS class values.
                Click &ldquo;Copy hex&rdquo; to grab any color code for your
                design tool or codebase.
              </p>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <section className="border-t border-slate-700 pt-10 mb-6">
          <h2 className="text-2xl font-bold text-white mb-6">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">
                How does the AI Color Palette Generator work?
              </h3>
              <p className="text-slate-400">
                Enter a mood, theme, or brand description (e.g. &ldquo;calm
                ocean vibes&rdquo; or &ldquo;bold startup energy&rdquo;) and the
                AI analyzes your input to generate 5 harmonious colors. Each
                color includes its hex code, RGB value, and closest Tailwind CSS
                class for easy use in your projects.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">
                How many palettes can I generate for free?
              </h3>
              <p className="text-slate-400">
                You get 5 free palette generations per day. The limit resets
                every 24 hours. No account or sign-up is required -- just start
                generating palettes right away.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">
                Can I use the generated color palettes in my projects?
              </h3>
              <p className="text-slate-400">
                Yes, all generated palettes are free to use in any project --
                websites, apps, presentations, branding, social media graphics,
                and more. Each color comes with hex, RGB, and Tailwind CSS class
                values so you can copy and paste directly into your code or
                design tool.
              </p>
            </div>
          </div>
        </section>

        <AdUnit slot="0987654321" format="rectangle" className="my-6" />

        <RelatedTools currentSlug={SLUG} />
      </div>
    </main>
  );
}
