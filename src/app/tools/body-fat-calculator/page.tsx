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

type Gender = "male" | "female";
type Unit = "metric" | "imperial";

interface Category {
  label: string;
  color: string;
  bgColor: string;
  maleRange: [number, number];
  femaleRange: [number, number];
}

const CATEGORIES: Category[] = [
  {
    label: "Essential Fat",
    color: "text-red-400",
    bgColor: "bg-red-500/20",
    maleRange: [2, 5],
    femaleRange: [10, 13],
  },
  {
    label: "Athletes",
    color: "text-blue-400",
    bgColor: "bg-blue-500/20",
    maleRange: [6, 13],
    femaleRange: [14, 20],
  },
  {
    label: "Fitness",
    color: "text-green-400",
    bgColor: "bg-green-500/20",
    maleRange: [14, 17],
    femaleRange: [21, 24],
  },
  {
    label: "Average",
    color: "text-yellow-400",
    bgColor: "bg-yellow-500/20",
    maleRange: [18, 24],
    femaleRange: [25, 31],
  },
  {
    label: "Obese",
    color: "text-red-500",
    bgColor: "bg-red-600/20",
    maleRange: [25, 100],
    femaleRange: [32, 100],
  },
];

function getCategory(bf: number, gender: Gender): Category | null {
  for (const cat of CATEGORIES) {
    const [min, max] = gender === "male" ? cat.maleRange : cat.femaleRange;
    if (bf >= min && bf <= max) return cat;
  }
  return null;
}

function inToCm(inches: number): number {
  return inches * 2.54;
}

function lbsToKg(lbs: number): number {
  return lbs * 0.453592;
}

function kgToLbs(kg: number): number {
  return kg / 0.453592;
}

export default function BodyFatCalculatorPage() {
  const [gender, setGender] = useState<Gender>("male");
  const [unit, setUnit] = useState<Unit>("metric");
  const [age, setAge] = useState<string>("30");
  const [height, setHeight] = useState<string>("175");
  const [weight, setWeight] = useState<string>("80");
  const [waist, setWaist] = useState<string>("85");
  const [neck, setNeck] = useState<string>("38");
  const [hip, setHip] = useState<string>("95");

  const results = useMemo(() => {
    const h = parseFloat(height);
    const w = parseFloat(waist);
    const n = parseFloat(neck);
    const hp = parseFloat(hip);
    const wt = parseFloat(weight);

    if (!h || !w || !n || h <= 0 || w <= 0 || n <= 0 || !wt || wt <= 0) return null;
    if (gender === "female" && (!hp || hp <= 0)) return null;

    // Convert to cm for the formula
    const heightCm = unit === "imperial" ? inToCm(h) : h;
    const waistCm = unit === "imperial" ? inToCm(w) : w;
    const neckCm = unit === "imperial" ? inToCm(n) : n;
    const hipCm = unit === "imperial" ? inToCm(hp) : hp;
    const weightKg = unit === "imperial" ? lbsToKg(wt) : wt;

    // Validate measurement relationships
    if (gender === "male" && waistCm <= neckCm) return null;
    if (gender === "female" && waistCm + hipCm <= neckCm) return null;

    let bf: number;
    if (gender === "male") {
      bf =
        86.01 * Math.log10(waistCm - neckCm) -
        70.041 * Math.log10(heightCm) +
        36.76;
    } else {
      bf =
        163.205 * Math.log10(waistCm + hipCm - neckCm) -
        97.684 * Math.log10(heightCm) -
        78.387;
    }

    // Clamp to reasonable range
    bf = Math.max(0, Math.min(60, bf));

    const fatMassKg = (bf / 100) * weightKg;
    const leanMassKg = weightKg - fatMassKg;

    const category = getCategory(bf, gender);

    return {
      bodyFatPercent: bf,
      fatMassKg,
      leanMassKg,
      fatMassLbs: kgToLbs(fatMassKg),
      leanMassLbs: kgToLbs(leanMassKg),
      category,
    };
  }, [gender, unit, height, weight, waist, neck, hip]);

  const heightLabel = unit === "metric" ? "cm" : "inches";
  const waistLabel = unit === "metric" ? "cm" : "inches";
  const weightLabel = unit === "metric" ? "kg" : "lbs";

  const faqItems = [
    {
      question: "How accurate is the US Navy body fat method?",
      answer:
        "The US Navy method is generally accurate within 1-3% of body fat compared to more advanced methods like DEXA scans. It works best for people with average body proportions. Results may be less accurate for very muscular individuals or those with unusual fat distribution patterns.",
    },
    {
      question: "What is a healthy body fat percentage?",
      answer:
        "Healthy body fat ranges differ by gender. For men, 14-17% is considered fitness level and 18-24% is average. For women, 21-24% is fitness level and 25-31% is average. Essential fat (minimum needed for health) is 2-5% for men and 10-13% for women. Going below essential fat levels is dangerous.",
    },
    {
      question: "How should I take measurements for the US Navy method?",
      answer:
        "Measure your neck circumference just below the larynx (Adam's apple), keeping the tape level. Measure your waist at the navel (belly button) level. For women, also measure hips at the widest point. Use a flexible tape measure and keep it snug but not compressing the skin. Measure first thing in the morning for consistency.",
    },
    {
      question:
        "Why does the calculator need different measurements for men and women?",
      answer:
        "Men and women store fat differently due to hormonal differences. Women typically carry more fat around the hips and thighs, so hip measurement is needed for accuracy. The US Navy formulas account for these gender-specific fat distribution patterns to provide more accurate estimates.",
    },
  ];

  return (
    <>
      <title>Body Fat Calculator - US Navy Method Body Fat Percentage | DevTools Hub</title>
      <meta
        name="description"
        content="Calculate your body fat percentage using the US Navy method. Enter your measurements to estimate body fat, lean mass, and fat mass. Free body fat calculator with categories for men and women."
      />
      <JsonLd
        data={[
          generateWebAppSchema({
            slug: "body-fat-calculator",
            name: "Body Fat Percentage Calculator",
            description:
              "Calculate your body fat percentage using the US Navy method. Enter your measurements to estimate body fat, lean mass, and fat mass.",
            category: "health",
          }),
          generateBreadcrumbSchema({
            slug: "body-fat-calculator",
            name: "Body Fat Percentage Calculator",
            description:
              "Calculate your body fat percentage using the US Navy method. Enter your measurements to estimate body fat, lean mass, and fat mass.",
            category: "health",
          }),
          generateFAQSchema(faqItems),
        ]}
      />

      <div className="min-h-screen bg-slate-900 text-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <ToolBreadcrumb slug="body-fat-calculator" />

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
              Body Fat Percentage Calculator
            </h1>
            <p className="text-slate-400 max-w-2xl text-lg">
              Estimate your body fat percentage using the US Navy method. Enter
              your tape measurements to calculate body fat, fat mass, and lean
              mass. All calculations run in your browser.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Input Card */}
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-5">
              <h2 className="text-sm font-semibold text-white mb-4">
                Your Measurements
              </h2>

              {/* Gender Toggle */}
              <div className="mb-4">
                <label className="text-sm text-slate-300 mb-2 block">
                  Gender
                </label>
                <div className="flex items-center gap-1 bg-slate-900 rounded-lg p-1">
                  <button
                    onClick={() => setGender("male")}
                    className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      gender === "male"
                        ? "bg-blue-600 text-white"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    Male
                  </button>
                  <button
                    onClick={() => setGender("female")}
                    className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      gender === "female"
                        ? "bg-blue-600 text-white"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    Female
                  </button>
                </div>
              </div>

              {/* Unit Toggle */}
              <div className="mb-4">
                <label className="text-sm text-slate-300 mb-2 block">
                  Units
                </label>
                <div className="flex items-center gap-1 bg-slate-900 rounded-lg p-1">
                  <button
                    onClick={() => setUnit("metric")}
                    className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      unit === "metric"
                        ? "bg-blue-600 text-white"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    Metric (cm/kg)
                  </button>
                  <button
                    onClick={() => setUnit("imperial")}
                    className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      unit === "imperial"
                        ? "bg-blue-600 text-white"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    Imperial (in/lbs)
                  </button>
                </div>
              </div>

              {/* Age */}
              <div className="mb-4">
                <label className="text-sm text-slate-300 mb-1 block">Age</label>
                <input
                  type="number"
                  min={10}
                  max={120}
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="30"
                  className="w-full bg-slate-800 border border-slate-600 rounded-lg p-3 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Height */}
              <div className="mb-4">
                <label className="text-sm text-slate-300 mb-1 block">
                  Height ({heightLabel})
                </label>
                <input
                  type="number"
                  min={0}
                  step="0.1"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  placeholder={unit === "metric" ? "175" : "69"}
                  className="w-full bg-slate-800 border border-slate-600 rounded-lg p-3 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Weight */}
              <div className="mb-4">
                <label className="text-sm text-slate-300 mb-1 block">
                  Weight ({weightLabel})
                </label>
                <input
                  type="number"
                  min={0}
                  step="0.1"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  placeholder={unit === "metric" ? "80" : "176"}
                  className="w-full bg-slate-800 border border-slate-600 rounded-lg p-3 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Waist */}
              <div className="mb-4">
                <label className="text-sm text-slate-300 mb-1 block">
                  Waist at navel ({waistLabel})
                </label>
                <input
                  type="number"
                  min={0}
                  step="0.1"
                  value={waist}
                  onChange={(e) => setWaist(e.target.value)}
                  placeholder={unit === "metric" ? "85" : "33"}
                  className="w-full bg-slate-800 border border-slate-600 rounded-lg p-3 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Neck */}
              <div className="mb-4">
                <label className="text-sm text-slate-300 mb-1 block">
                  Neck circumference ({waistLabel})
                </label>
                <input
                  type="number"
                  min={0}
                  step="0.1"
                  value={neck}
                  onChange={(e) => setNeck(e.target.value)}
                  placeholder={unit === "metric" ? "38" : "15"}
                  className="w-full bg-slate-800 border border-slate-600 rounded-lg p-3 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Hip (Female only) */}
              {gender === "female" && (
                <div className="mb-4">
                  <label className="text-sm text-slate-300 mb-1 block">
                    Hip circumference ({waistLabel})
                  </label>
                  <input
                    type="number"
                    min={0}
                    step="0.1"
                    value={hip}
                    onChange={(e) => setHip(e.target.value)}
                    placeholder={unit === "metric" ? "95" : "37"}
                    className="w-full bg-slate-800 border border-slate-600 rounded-lg p-3 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}
            </div>

            {/* Results Card */}
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-5">
              <h2 className="text-sm font-semibold text-white mb-4">
                Results
              </h2>

              {results ? (
                <div className="space-y-6">
                  {/* Body Fat Percentage */}
                  <div className="text-center">
                    <div
                      className={`text-5xl font-bold mb-2 ${
                        results.category?.color ?? "text-white"
                      }`}
                    >
                      {results.bodyFatPercent.toFixed(1)}%
                    </div>
                    <p className="text-slate-400 text-sm">
                      Estimated Body Fat Percentage
                    </p>
                    {results.category && (
                      <span
                        className={`inline-block mt-2 px-3 py-1 rounded-full text-sm font-medium ${results.category.bgColor} ${results.category.color}`}
                      >
                        {results.category.label}
                      </span>
                    )}
                  </div>

                  {/* Mass Breakdown */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-900 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-orange-400">
                        {unit === "metric"
                          ? `${results.fatMassKg.toFixed(1)} kg`
                          : `${results.fatMassLbs.toFixed(1)} lbs`}
                      </div>
                      <p className="text-slate-400 text-xs mt-1">Fat Mass</p>
                    </div>
                    <div className="bg-slate-900 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-green-400">
                        {unit === "metric"
                          ? `${results.leanMassKg.toFixed(1)} kg`
                          : `${results.leanMassLbs.toFixed(1)} lbs`}
                      </div>
                      <p className="text-slate-400 text-xs mt-1">Lean Mass</p>
                    </div>
                  </div>

                  {/* Visual Bar */}
                  <div>
                    <div className="flex justify-between text-xs text-slate-400 mb-1">
                      <span>Fat: {results.bodyFatPercent.toFixed(1)}%</span>
                      <span>
                        Lean: {(100 - results.bodyFatPercent).toFixed(1)}%
                      </span>
                    </div>
                    <div className="h-4 bg-slate-700 rounded-full overflow-hidden flex">
                      <div
                        className="h-full bg-orange-500 transition-all duration-300"
                        style={{
                          width: `${Math.min(100, results.bodyFatPercent)}%`,
                        }}
                      />
                      <div className="h-full bg-green-500 flex-1" />
                    </div>
                  </div>

                  {/* Category Reference */}
                  <div>
                    <h3 className="text-sm font-medium text-slate-300 mb-3">
                      Body Fat Categories (
                      {gender === "male" ? "Male" : "Female"})
                    </h3>
                    <div className="space-y-2">
                      {CATEGORIES.map((cat) => {
                        const [min, max] =
                          gender === "male"
                            ? cat.maleRange
                            : cat.femaleRange;
                        const isActive = results.category?.label === cat.label;
                        return (
                          <div
                            key={cat.label}
                            className={`flex items-center justify-between px-3 py-2 rounded text-sm ${
                              isActive
                                ? `${cat.bgColor} border border-slate-600`
                                : "bg-slate-900/50"
                            }`}
                          >
                            <span
                              className={
                                isActive ? cat.color : "text-slate-400"
                              }
                            >
                              {cat.label}
                              {isActive && " (You)"}
                            </span>
                            <span className="text-slate-500 text-xs font-mono">
                              {max >= 100 ? `${min}%+` : `${min}-${max}%`}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-slate-500">
                  <p className="text-lg mb-2">Enter your measurements</p>
                  <p className="text-sm">
                    Fill in all required fields to see your estimated body fat
                    percentage.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Measurement Tips */}
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-5 mb-6">
            <h2 className="text-sm font-semibold text-white mb-3">
              How to Measure
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-slate-400">
              <div>
                <h3 className="text-slate-200 font-medium mb-1">Neck</h3>
                <p>
                  Measure just below the larynx (Adam&apos;s apple). Keep the
                  tape level and snug but not tight.
                </p>
              </div>
              <div>
                <h3 className="text-slate-200 font-medium mb-1">Waist</h3>
                <p>
                  Measure at your navel (belly button) level. Stand relaxed and
                  don&apos;t suck in your stomach.
                </p>
              </div>
              <div>
                <h3 className="text-slate-200 font-medium mb-1">
                  Hip (Women)
                </h3>
                <p>
                  Measure at the widest point of your hips and buttocks. Keep
                  the tape level around your body.
                </p>
              </div>
            </div>
          </div>

          <RelatedTools currentSlug="body-fat-calculator" />

          {/* FAQ Section */}
          <section className="mt-16 border-t border-slate-700 pt-10">
            <h2 className="text-2xl font-bold text-white mb-6">
              Frequently Asked Questions
            </h2>

            <div className="space-y-6">
              {faqItems.map((item) => (
                <div key={item.question}>
                  <h3 className="text-lg font-semibold text-white mb-2">
                    {item.question}
                  </h3>
                  <p className="text-slate-400">{item.answer}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Educational Content Section */}
          <section className="mt-16 border-t border-slate-700 pt-10">
            <h2 className="text-2xl font-bold text-white mb-6">
              Understanding Body Fat Percentage
            </h2>

            <div className="space-y-4 text-slate-400">
              <p>
                Body fat percentage is the proportion of your total body weight
                that is composed of fat tissue. Unlike BMI, which only considers
                height and weight, body fat percentage provides a more
                meaningful picture of your body composition and overall health.
                Two people with the same BMI can have very different body fat
                levels depending on their muscle mass and fat distribution.
              </p>
              <p>
                The US Navy method, developed in the 1980s for military fitness
                assessments, estimates body fat using circumference measurements
                of the neck, waist, and hips. It applies a logarithmic formula
                to these measurements along with height to produce a body fat
                estimate. While not as precise as laboratory methods like DEXA
                scanning or hydrostatic weighing, the US Navy method is widely
                used because it requires only a tape measure, making it
                accessible for regular self-monitoring.
              </p>
              <p>
                Maintaining a healthy body fat percentage is associated with
                reduced risk of cardiovascular disease, type 2 diabetes, and
                other metabolic conditions. However, going too low can be
                equally harmful. Essential fat, needed for normal hormonal and
                reproductive function, should never be eliminated. For most
                people, aiming for the fitness or average range provides the
                best balance of health and performance. Tracking body fat over
                time is more valuable than any single measurement, as trends
                reveal whether your diet and exercise habits are moving you in
                the right direction.
              </p>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
