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
type UnitSystem = "metric" | "imperial";
type ActivityLevel =
  | "sedentary"
  | "lightly"
  | "moderately"
  | "very"
  | "extra";

const ACTIVITY_OPTIONS: { value: ActivityLevel; label: string; multiplier: number; description: string }[] = [
  { value: "sedentary", label: "Sedentary", multiplier: 1.2, description: "Little or no exercise" },
  { value: "lightly", label: "Lightly Active", multiplier: 1.375, description: "Light exercise 1-3 days/week" },
  { value: "moderately", label: "Moderately Active", multiplier: 1.55, description: "Moderate exercise 3-5 days/week" },
  { value: "very", label: "Very Active", multiplier: 1.725, description: "Hard exercise 6-7 days/week" },
  { value: "extra", label: "Extra Active", multiplier: 1.9, description: "Very hard exercise or physical job" },
];

const FAQ_ITEMS = [
  {
    question: "What is TDEE and how is it calculated?",
    answer:
      "TDEE stands for Total Daily Energy Expenditure. It represents the total number of calories your body burns in a day, including your basal metabolic rate (BMR) and physical activity. It is calculated by multiplying your BMR by an activity multiplier that reflects your lifestyle.",
  },
  {
    question: "What is the Mifflin-St Jeor equation?",
    answer:
      "The Mifflin-St Jeor equation is a widely used formula for estimating Basal Metabolic Rate (BMR). For men: BMR = 10 x weight(kg) + 6.25 x height(cm) - 5 x age + 5. For women: BMR = 10 x weight(kg) + 6.25 x height(cm) - 5 x age - 161. It is considered one of the most accurate BMR prediction equations available.",
  },
  {
    question: "How many calories should I eat to lose weight?",
    answer:
      "A common approach is to eat 500 calories below your TDEE (maintenance calories), which creates a deficit of about 1 pound (0.45 kg) of weight loss per week. For a milder approach, a 250-calorie deficit leads to roughly half a pound per week. Always consult a healthcare professional before starting a calorie-restricted diet.",
  },
  {
    question: "What is the difference between BMR and TDEE?",
    answer:
      "BMR (Basal Metabolic Rate) is the number of calories your body needs at complete rest just to maintain basic life functions like breathing and circulation. TDEE (Total Daily Energy Expenditure) includes your BMR plus all the calories burned through daily activities and exercise. TDEE is always higher than BMR.",
  },
];

export default function CalorieCalculatorPage() {
  const [age, setAge] = useState(25);
  const [gender, setGender] = useState<Gender>("male");
  const [unitSystem, setUnitSystem] = useState<UnitSystem>("metric");
  const [weightKg, setWeightKg] = useState(70);
  const [weightLbs, setWeightLbs] = useState(154);
  const [heightCm, setHeightCm] = useState(175);
  const [heightFt, setHeightFt] = useState(5);
  const [heightIn, setHeightIn] = useState(9);
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>("moderately");

  const results = useMemo(() => {
    const weight = unitSystem === "metric" ? weightKg : weightLbs * 0.453592;
    const height =
      unitSystem === "metric" ? heightCm : heightFt * 30.48 + heightIn * 2.54;

    if (weight <= 0 || height <= 0 || age <= 0) return null;

    // Mifflin-St Jeor Equation
    const bmr =
      gender === "male"
        ? 10 * weight + 6.25 * height - 5 * age + 5
        : 10 * weight + 6.25 * height - 5 * age - 161;

    const multiplier =
      ACTIVITY_OPTIONS.find((a) => a.value === activityLevel)?.multiplier ?? 1.55;
    const tdee = bmr * multiplier;

    return {
      bmr: Math.round(bmr),
      tdee: Math.round(tdee),
      mildLoss: Math.round(tdee - 250),
      weightLoss: Math.round(tdee - 500),
      weightGain: Math.round(tdee + 500),
    };
  }, [age, gender, unitSystem, weightKg, weightLbs, heightCm, heightFt, heightIn, activityLevel]);

  const handleUnitToggle = (system: UnitSystem) => {
    if (system === unitSystem) return;
    if (system === "imperial") {
      setWeightLbs(Math.round(weightKg * 2.20462));
      const totalInches = Math.round(heightCm / 2.54);
      setHeightFt(Math.floor(totalInches / 12));
      setHeightIn(totalInches % 12);
    } else {
      setWeightKg(Math.round(weightLbs * 0.453592));
      setHeightCm(Math.round(heightFt * 30.48 + heightIn * 2.54));
    }
    setUnitSystem(system);
  };

  const inputClass =
    "w-full bg-slate-800 border border-slate-600 rounded-lg p-3 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500";
  const selectClass =
    "w-full bg-slate-800 border border-slate-600 rounded-lg p-3 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500";

  return (
    <>
      <title>Calorie Calculator - Free TDEE &amp; BMR Calculator | DevTools Hub</title>
      <meta
        name="description"
        content="Calculate your daily calorie needs with our free TDEE calculator. Uses the Mifflin-St Jeor equation to find your BMR and maintenance calories based on age, gender, height, weight, and activity level."
      />
      <div className="min-h-screen bg-slate-900 text-slate-200">
        <JsonLd
          data={[
            generateWebAppSchema({
              slug: "calorie-calculator",
              name: "Calorie Calculator",
              description:
                "Calculate your daily calorie needs with our free TDEE calculator. Uses the Mifflin-St Jeor equation to find your BMR and maintenance calories.",
              category: "health",
            }),
            generateBreadcrumbSchema({
              slug: "calorie-calculator",
              name: "Calorie Calculator",
              description:
                "Calculate your daily calorie needs with our free TDEE calculator.",
              category: "health",
            }),
            generateFAQSchema(FAQ_ITEMS),
          ]}
        />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <ToolBreadcrumb slug="calorie-calculator" />

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Calorie Calculator</h1>
            <p className="text-slate-400">
              Calculate your Basal Metabolic Rate (BMR) and Total Daily Energy
              Expenditure (TDEE) using the Mifflin-St Jeor equation. Find out how
              many calories you need to maintain, lose, or gain weight.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Input Section */}
            <div className="space-y-5">
              {/* Unit Toggle */}
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-5">
                <label className="block text-xs font-medium text-slate-400 mb-2">
                  Unit System
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(["metric", "imperial"] as UnitSystem[]).map((system) => (
                    <button
                      key={system}
                      onClick={() => handleUnitToggle(system)}
                      className={`py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                        unitSystem === system
                          ? "bg-blue-600 text-white"
                          : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                      }`}
                    >
                      {system === "metric" ? "Metric (kg, cm)" : "Imperial (lbs, ft/in)"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Age & Gender */}
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-5">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-2">
                      Age
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={120}
                      value={age}
                      onChange={(e) => setAge(parseInt(e.target.value) || 0)}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-2">
                      Gender
                    </label>
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value as Gender)}
                      className={selectClass}
                    >
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Weight */}
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-5">
                <label className="block text-xs font-medium text-slate-400 mb-2">
                  Weight ({unitSystem === "metric" ? "kg" : "lbs"})
                </label>
                {unitSystem === "metric" ? (
                  <input
                    type="number"
                    min={1}
                    value={weightKg}
                    onChange={(e) => setWeightKg(parseFloat(e.target.value) || 0)}
                    className={inputClass}
                  />
                ) : (
                  <input
                    type="number"
                    min={1}
                    value={weightLbs}
                    onChange={(e) => setWeightLbs(parseFloat(e.target.value) || 0)}
                    className={inputClass}
                  />
                )}
              </div>

              {/* Height */}
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-5">
                <label className="block text-xs font-medium text-slate-400 mb-2">
                  Height ({unitSystem === "metric" ? "cm" : "ft & in"})
                </label>
                {unitSystem === "metric" ? (
                  <input
                    type="number"
                    min={1}
                    value={heightCm}
                    onChange={(e) => setHeightCm(parseFloat(e.target.value) || 0)}
                    className={inputClass}
                  />
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">Feet</label>
                      <input
                        type="number"
                        min={0}
                        max={8}
                        value={heightFt}
                        onChange={(e) => setHeightFt(parseInt(e.target.value) || 0)}
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">Inches</label>
                      <input
                        type="number"
                        min={0}
                        max={11}
                        value={heightIn}
                        onChange={(e) => setHeightIn(parseInt(e.target.value) || 0)}
                        className={inputClass}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Activity Level */}
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-5">
                <label className="block text-xs font-medium text-slate-400 mb-2">
                  Activity Level
                </label>
                <select
                  value={activityLevel}
                  onChange={(e) => setActivityLevel(e.target.value as ActivityLevel)}
                  className={selectClass}
                >
                  {ACTIVITY_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label} — {opt.description}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Results Section */}
            <div className="space-y-5">
              {results ? (
                <>
                  {/* BMR Card */}
                  <div className="bg-slate-800 border border-slate-700 rounded-lg p-5">
                    <div className="text-xs font-medium text-slate-400 mb-1">
                      Basal Metabolic Rate (BMR)
                    </div>
                    <div className="text-3xl font-bold text-slate-200">
                      {results.bmr.toLocaleString()}{" "}
                      <span className="text-base font-normal text-slate-400">
                        cal/day
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-2">
                      Calories your body burns at complete rest
                    </p>
                  </div>

                  {/* TDEE / Maintenance Card */}
                  <div className="bg-slate-800 border border-blue-600 rounded-lg p-5">
                    <div className="text-xs font-medium text-blue-400 mb-1">
                      Maintenance Calories (TDEE)
                    </div>
                    <div className="text-3xl font-bold text-blue-400">
                      {results.tdee.toLocaleString()}{" "}
                      <span className="text-base font-normal text-blue-400/60">
                        cal/day
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-2">
                      Calories to maintain your current weight
                    </p>
                  </div>

                  {/* Weight Goals Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* Weight Loss */}
                    <div className="bg-slate-800 border border-slate-700 rounded-lg p-5">
                      <div className="text-xs font-medium text-red-400 mb-1">
                        Weight Loss
                      </div>
                      <div className="text-2xl font-bold text-red-400">
                        {results.weightLoss.toLocaleString()}
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        cal/day (-500)
                      </p>
                      <p className="text-xs text-slate-500">
                        ~1 lb / 0.45 kg per week
                      </p>
                    </div>

                    {/* Mild Weight Loss */}
                    <div className="bg-slate-800 border border-slate-700 rounded-lg p-5">
                      <div className="text-xs font-medium text-yellow-400 mb-1">
                        Mild Loss
                      </div>
                      <div className="text-2xl font-bold text-yellow-400">
                        {results.mildLoss.toLocaleString()}
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        cal/day (-250)
                      </p>
                      <p className="text-xs text-slate-500">
                        ~0.5 lb / 0.23 kg per week
                      </p>
                    </div>

                    {/* Weight Gain */}
                    <div className="bg-slate-800 border border-slate-700 rounded-lg p-5">
                      <div className="text-xs font-medium text-green-400 mb-1">
                        Weight Gain
                      </div>
                      <div className="text-2xl font-bold text-green-400">
                        {results.weightGain.toLocaleString()}
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        cal/day (+500)
                      </p>
                      <p className="text-xs text-slate-500">
                        ~1 lb / 0.45 kg per week
                      </p>
                    </div>
                  </div>

                  {/* Activity Multiplier Info */}
                  <div className="bg-slate-800 border border-slate-700 rounded-lg p-5">
                    <div className="text-xs font-medium text-slate-400 mb-3">
                      Activity Multipliers
                    </div>
                    <div className="space-y-2">
                      {ACTIVITY_OPTIONS.map((opt) => (
                        <div
                          key={opt.value}
                          className={`flex items-center justify-between text-sm ${
                            activityLevel === opt.value
                              ? "text-blue-400 font-medium"
                              : "text-slate-400"
                          }`}
                        >
                          <span>
                            {opt.label}{" "}
                            <span className="text-xs text-slate-500">
                              ({opt.description})
                            </span>
                          </span>
                          <span className="font-mono text-xs">
                            x{opt.multiplier}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <div className="bg-slate-800 border border-slate-700 rounded-lg p-5 text-center text-slate-500">
                  Enter valid values for age, weight, and height to see your
                  results.
                </div>
              )}
            </div>
          </div>

          {/* Related Tools */}
          <div className="mt-12">
            <RelatedTools currentSlug="calorie-calculator" />
          </div>

          {/* FAQ Section */}
          <div className="mt-16 border-t border-slate-700 pt-10">
            <h2 className="text-xl font-semibold mb-6">
              Frequently Asked Questions
            </h2>
            <div className="space-y-4">
              {FAQ_ITEMS.map((item) => (
                <div key={item.question}>
                  <h3 className="font-medium text-white text-sm">
                    {item.question}
                  </h3>
                  <p className="text-slate-400 text-sm mt-1">{item.answer}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Educational Content Section */}
          <section className="mt-16 border-t border-slate-700 pt-10">
            <h2 className="text-xl font-semibold mb-4">
              Understanding Calories, BMR, and TDEE
            </h2>
            <div className="text-sm text-slate-400 space-y-3">
              <p>
                Your body requires energy to function, even at rest. This baseline
                energy need is called your Basal Metabolic Rate (BMR) and accounts
                for roughly 60-70% of total daily calorie expenditure. BMR powers
                essential processes like breathing, blood circulation, cell
                production, and temperature regulation. It varies significantly
                based on age, gender, body composition, and genetics.
              </p>
              <p>
                Total Daily Energy Expenditure (TDEE) builds on BMR by factoring in
                the calories burned through physical activity, from walking and
                household chores to structured exercise. The Mifflin-St Jeor
                equation, developed in 1990, is considered the most reliable modern
                formula for estimating BMR and is recommended by the Academy of
                Nutrition and Dietetics.
              </p>
              <p>
                To lose weight, you need to consume fewer calories than your TDEE.
                A deficit of 500 calories per day typically results in about one
                pound of weight loss per week. For weight gain, a surplus of 500
                calories per day leads to roughly one pound gained per week. These
                are general guidelines and individual results vary. Always consult a
                healthcare professional for personalized dietary advice, especially
                if you have underlying health conditions.
              </p>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
