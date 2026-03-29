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

type UnitSystem = "metric" | "imperial";

interface BMIResult {
  bmi: number;
  category: string;
  color: string;
  healthyMin: number;
  healthyMax: number;
}

function calculateBMI(
  weightKg: number,
  heightM: number
): BMIResult | null {
  if (weightKg <= 0 || heightM <= 0) return null;
  const bmi = weightKg / (heightM * heightM);
  let category: string;
  let color: string;

  if (bmi < 18.5) {
    category = "Underweight";
    color = "text-blue-400";
  } else if (bmi < 25) {
    category = "Normal";
    color = "text-green-400";
  } else if (bmi < 30) {
    category = "Overweight";
    color = "text-yellow-400";
  } else {
    category = "Obese";
    color = "text-red-400";
  }

  const healthyMin = 18.5 * (heightM * heightM);
  const healthyMax = 24.9 * (heightM * heightM);

  return { bmi, category, color, healthyMin, healthyMax };
}

function getBMIBarColor(bmi: number): string {
  if (bmi < 18.5) return "bg-blue-500";
  if (bmi < 25) return "bg-green-500";
  if (bmi < 30) return "bg-yellow-500";
  return "bg-red-500";
}

export default function BMICalculatorPage() {
  const [unitSystem, setUnitSystem] = useState<UnitSystem>("metric");
  const [weightKg, setWeightKg] = useState("");
  const [weightLbs, setWeightLbs] = useState("");
  const [heightCm, setHeightCm] = useState("");
  const [heightFt, setHeightFt] = useState("");
  const [heightIn, setHeightIn] = useState("");

  const result = useMemo(() => {
    let kg: number;
    let meters: number;

    if (unitSystem === "metric") {
      kg = parseFloat(weightKg) || 0;
      meters = (parseFloat(heightCm) || 0) / 100;
    } else {
      kg = (parseFloat(weightLbs) || 0) * 0.453592;
      const totalInches =
        (parseFloat(heightFt) || 0) * 12 + (parseFloat(heightIn) || 0);
      meters = totalInches * 0.0254;
    }

    return calculateBMI(kg, meters);
  }, [unitSystem, weightKg, weightLbs, heightCm, heightFt, heightIn]);

  const displayWeight = (kg: number): string => {
    if (unitSystem === "metric") return `${kg.toFixed(1)} kg`;
    return `${(kg * 2.20462).toFixed(1)} lbs`;
  };

  // Position on 15-40 BMI scale (clamped)
  const scalePosition = useMemo(() => {
    if (!result) return 0;
    const clamped = Math.max(15, Math.min(40, result.bmi));
    return ((clamped - 15) / (40 - 15)) * 100;
  }, [result]);

  return (
    <>
      <title>BMI Calculator - Free Body Mass Index Calculator | DevTools Hub</title>
      <meta
        name="description"
        content="Calculate your Body Mass Index (BMI) instantly. Enter your height and weight to check if you're underweight, normal, overweight, or obese. Free online BMI calculator with metric and imperial units."
      />
      <JsonLd
        data={[
          generateWebAppSchema({
            slug: "bmi-calculator",
            name: "BMI Calculator",
            description:
              "Calculate your Body Mass Index (BMI) instantly with metric and imperial units",
            category: "health",
          }),
          generateBreadcrumbSchema({
            slug: "bmi-calculator",
            name: "BMI Calculator",
            description:
              "Calculate your Body Mass Index (BMI) instantly with metric and imperial units",
            category: "health",
          }),
          generateFAQSchema([
            {
              question: "What is BMI?",
              answer:
                "BMI (Body Mass Index) is a numerical value calculated from your weight and height. It is used as a screening tool to categorize individuals into weight status categories: underweight, normal weight, overweight, and obese. The formula is weight in kilograms divided by height in meters squared.",
            },
            {
              question: "What is a healthy BMI range?",
              answer:
                "A healthy BMI is generally considered to be between 18.5 and 24.9. A BMI below 18.5 is classified as underweight, 25 to 29.9 as overweight, and 30 or above as obese. These ranges apply to most adults but may vary based on age, sex, and ethnicity.",
            },
            {
              question: "What are the limitations of BMI?",
              answer:
                "BMI does not distinguish between muscle mass and fat mass, so muscular individuals may have a high BMI without excess body fat. It also does not account for fat distribution, bone density, age, or sex differences. BMI is a screening tool and should not be used as the sole indicator of health.",
            },
            {
              question: "How is BMI calculated?",
              answer:
                "BMI is calculated by dividing your weight in kilograms by the square of your height in meters: BMI = weight (kg) / height (m)². For imperial units, the formula is BMI = (weight in pounds × 703) / (height in inches)².",
            },
          ]),
        ]}
      />

      <div className="min-h-screen bg-slate-900 text-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <ToolBreadcrumb slug="bmi-calculator" />

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
              BMI Calculator
            </h1>
            <p className="text-slate-400 max-w-2xl text-lg">
              Calculate your Body Mass Index (BMI) instantly. Enter your height
              and weight to find out if you are in a healthy weight range.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left side: Inputs */}
            <div className="lg:col-span-2 space-y-6">
              {/* Unit System Toggle */}
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-5">
                <span className="block text-sm font-medium text-slate-300 mb-3">
                  Unit System
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setUnitSystem("metric")}
                    className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${
                      unitSystem === "metric"
                        ? "bg-blue-600 text-white"
                        : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                    }`}
                  >
                    Metric (kg / cm)
                  </button>
                  <button
                    onClick={() => setUnitSystem("imperial")}
                    className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${
                      unitSystem === "imperial"
                        ? "bg-blue-600 text-white"
                        : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                    }`}
                  >
                    Imperial (lbs / ft+in)
                  </button>
                </div>
              </div>

              {/* Weight Input */}
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-5">
                <label
                  htmlFor="weight"
                  className="block text-sm font-medium text-slate-300 mb-2"
                >
                  Weight ({unitSystem === "metric" ? "kg" : "lbs"})
                </label>
                {unitSystem === "metric" ? (
                  <input
                    id="weight"
                    type="number"
                    min="0"
                    step="0.1"
                    value={weightKg}
                    onChange={(e) => setWeightKg(e.target.value)}
                    placeholder="e.g. 70"
                    className="w-full bg-slate-800 border border-slate-600 rounded-lg p-3 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <input
                    id="weight"
                    type="number"
                    min="0"
                    step="0.1"
                    value={weightLbs}
                    onChange={(e) => setWeightLbs(e.target.value)}
                    placeholder="e.g. 154"
                    className="w-full bg-slate-800 border border-slate-600 rounded-lg p-3 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                )}
              </div>

              {/* Height Input */}
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-5">
                <label
                  htmlFor="height-primary"
                  className="block text-sm font-medium text-slate-300 mb-2"
                >
                  Height ({unitSystem === "metric" ? "cm" : "ft & in"})
                </label>
                {unitSystem === "metric" ? (
                  <input
                    id="height-primary"
                    type="number"
                    min="0"
                    step="0.1"
                    value={heightCm}
                    onChange={(e) => setHeightCm(e.target.value)}
                    placeholder="e.g. 175"
                    className="w-full bg-slate-800 border border-slate-600 rounded-lg p-3 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <input
                        id="height-primary"
                        type="number"
                        min="0"
                        step="1"
                        value={heightFt}
                        onChange={(e) => setHeightFt(e.target.value)}
                        placeholder="ft"
                        className="w-full bg-slate-800 border border-slate-600 rounded-lg p-3 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="text-xs text-slate-500 mt-1 block">
                        Feet
                      </span>
                    </div>
                    <div className="flex-1">
                      <input
                        id="height-inches"
                        type="number"
                        min="0"
                        max="11"
                        step="1"
                        value={heightIn}
                        onChange={(e) => setHeightIn(e.target.value)}
                        placeholder="in"
                        className="w-full bg-slate-800 border border-slate-600 rounded-lg p-3 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="text-xs text-slate-500 mt-1 block">
                        Inches
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right side: Results */}
            <div className="space-y-4">
              {/* BMI Value Card */}
              <div
                className={`rounded-lg p-5 border ${
                  result
                    ? "bg-slate-800 border-slate-700"
                    : "bg-slate-800 border-slate-700"
                }`}
              >
                <div className="text-xs text-slate-400 mb-1">Your BMI</div>
                <div
                  className={`text-4xl font-bold ${
                    result ? result.color : "text-slate-500"
                  }`}
                >
                  {result ? result.bmi.toFixed(1) : "—"}
                </div>
              </div>

              {/* Category Card */}
              <div className="rounded-lg p-5 border bg-slate-800 border-slate-700">
                <div className="text-xs text-slate-400 mb-1">Category</div>
                <div
                  className={`text-2xl font-bold ${
                    result ? result.color : "text-slate-500"
                  }`}
                >
                  {result ? result.category : "—"}
                </div>
              </div>

              {/* Healthy Weight Range Card */}
              <div className="rounded-lg p-5 border bg-slate-800 border-slate-700">
                <div className="text-xs text-slate-400 mb-1">
                  Healthy Weight Range
                </div>
                <div className="text-lg font-semibold text-white">
                  {result
                    ? `${displayWeight(result.healthyMin)} – ${displayWeight(
                        result.healthyMax
                      )}`
                    : "—"}
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  BMI 18.5 – 24.9
                </div>
              </div>

              {/* BMI Scale */}
              <div className="rounded-lg p-5 border bg-slate-800 border-slate-700">
                <div className="text-xs text-slate-400 mb-3">BMI Scale</div>
                <div className="relative h-4 rounded-full overflow-hidden flex">
                  <div
                    className="bg-blue-500 h-full"
                    style={{ width: "14%" }}
                    title="Underweight: < 18.5"
                  />
                  <div
                    className="bg-green-500 h-full"
                    style={{ width: "26%" }}
                    title="Normal: 18.5 - 24.9"
                  />
                  <div
                    className="bg-yellow-500 h-full"
                    style={{ width: "20%" }}
                    title="Overweight: 25 - 29.9"
                  />
                  <div
                    className="bg-red-500 h-full"
                    style={{ width: "40%" }}
                    title="Obese: 30+"
                  />
                </div>
                {/* Indicator */}
                {result && (
                  <div className="relative mt-1" style={{ height: "16px" }}>
                    <div
                      className="absolute -translate-x-1/2 transition-all duration-300"
                      style={{ left: `${scalePosition}%` }}
                    >
                      <div
                        className={`w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[8px] ${getBMIBarColor(result.bmi).replace("bg-", "border-b-")}`}
                      />
                    </div>
                  </div>
                )}
                <div className="flex justify-between text-xs text-slate-500 mt-1">
                  <span>15</span>
                  <span>18.5</span>
                  <span>25</span>
                  <span>30</span>
                  <span>40</span>
                </div>
                <div className="flex justify-between text-xs mt-2">
                  <span className="text-blue-400">Under</span>
                  <span className="text-green-400">Normal</span>
                  <span className="text-yellow-400">Over</span>
                  <span className="text-red-400">Obese</span>
                </div>
              </div>
            </div>
          </div>

          {/* How to Use */}
          <section className="mt-12 bg-slate-800 border border-slate-700 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-4">
              How to Use This BMI Calculator
            </h2>
            <ol className="list-decimal list-inside space-y-2 text-slate-400">
              <li>
                Select your preferred unit system: Metric (kg/cm) or Imperial
                (lbs/ft+in).
              </li>
              <li>Enter your weight in the weight field.</li>
              <li>
                Enter your height. For imperial units, enter both feet and
                inches.
              </li>
              <li>
                Your BMI is calculated in real time and displayed with a
                color-coded category.
              </li>
              <li>
                Check the healthy weight range card to see the recommended
                weight for your height.
              </li>
            </ol>
          </section>

          <RelatedTools currentSlug="bmi-calculator" />

          {/* FAQ Section */}
          <section className="mt-16 border-t border-slate-700 pt-10">
            <h2 className="text-2xl font-bold text-white mb-6">
              Frequently Asked Questions
            </h2>

            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  What is BMI?
                </h3>
                <p className="text-slate-400">
                  BMI (Body Mass Index) is a numerical value calculated from
                  your weight and height. It is used as a screening tool to
                  categorize individuals into weight status categories:
                  underweight, normal weight, overweight, and obese. The formula
                  is weight in kilograms divided by height in meters squared.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  What is a healthy BMI range?
                </h3>
                <p className="text-slate-400">
                  A healthy BMI is generally considered to be between 18.5 and
                  24.9. A BMI below 18.5 is classified as underweight, 25 to
                  29.9 as overweight, and 30 or above as obese. These ranges
                  apply to most adults but may vary based on age, sex, and
                  ethnicity.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  What are the limitations of BMI?
                </h3>
                <p className="text-slate-400">
                  BMI does not distinguish between muscle mass and fat mass, so
                  muscular individuals may have a high BMI without excess body
                  fat. It also does not account for fat distribution, bone
                  density, age, or sex differences. BMI is a screening tool and
                  should not be used as the sole indicator of health.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  How is BMI calculated?
                </h3>
                <p className="text-slate-400">
                  BMI is calculated by dividing your weight in kilograms by the
                  square of your height in meters: BMI = weight (kg) / height
                  (m)². For imperial units, the formula is BMI = (weight in
                  pounds x 703) / (height in inches)².
                </p>
              </div>
            </div>
          </section>

          {/* Educational Content Section */}
          <section className="mt-16 border-t border-slate-700 pt-10">
            <h2 className="text-2xl font-bold text-white mb-6">
              Understanding Body Mass Index
            </h2>
            <div className="prose prose-invert max-w-none text-slate-400 space-y-4">
              <p>
                Body Mass Index (BMI) is one of the most widely used metrics in
                public health and clinical medicine for assessing weight status
                at the population level. Developed by Belgian mathematician
                Adolphe Quetelet in the 1830s, BMI provides a simple ratio of
                weight to height that correlates with body fat percentage for
                most adults. Healthcare providers use BMI as an initial
                screening tool during routine checkups to identify potential
                weight-related health risks, including cardiovascular disease,
                type 2 diabetes, and certain cancers.
              </p>
              <p>
                However, BMI has well-documented limitations. It cannot
                differentiate between lean muscle mass and body fat, meaning
                athletes and highly active individuals may be classified as
                overweight despite having low body fat percentages.
                Additionally, BMI does not indicate where fat is stored in the
                body. Visceral fat around the abdomen carries greater health
                risks than subcutaneous fat elsewhere. For a more comprehensive
                assessment, clinicians often combine BMI with waist
                circumference measurements, body composition analysis, and
                other health markers such as blood pressure, cholesterol, and
                blood glucose levels. BMI remains a useful starting point, but
                it should always be interpreted alongside other indicators of
                overall health.
              </p>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
