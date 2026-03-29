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
type ActivityLevel =
  | "sedentary"
  | "lightly"
  | "moderately"
  | "very"
  | "extra";
type Goal = "lose" | "maintain" | "gain";
type MacroPreset = "balanced" | "lowcarb" | "highprotein" | "keto" | "custom";
type UnitSystem = "metric" | "imperial";

const ACTIVITY_LABELS: Record<ActivityLevel, string> = {
  sedentary: "Sedentary (little or no exercise)",
  lightly: "Lightly Active (1-3 days/week)",
  moderately: "Moderately Active (3-5 days/week)",
  very: "Very Active (6-7 days/week)",
  extra: "Extra Active (very hard exercise/physical job)",
};

const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  lightly: 1.375,
  moderately: 1.55,
  very: 1.725,
  extra: 1.9,
};

const GOAL_LABELS: Record<Goal, string> = {
  lose: "Lose Weight (-500 cal)",
  maintain: "Maintain Weight",
  gain: "Gain Weight (+500 cal)",
};

const GOAL_ADJUSTMENT: Record<Goal, number> = {
  lose: -500,
  maintain: 0,
  gain: 500,
};

const MACRO_PRESETS: Record<
  Exclude<MacroPreset, "custom">,
  { protein: number; carbs: number; fat: number; label: string }
> = {
  balanced: { protein: 30, carbs: 35, fat: 35, label: "Balanced" },
  lowcarb: { protein: 40, carbs: 20, fat: 40, label: "Low Carb" },
  highprotein: { protein: 40, carbs: 30, fat: 30, label: "High Protein" },
  keto: { protein: 25, carbs: 5, fat: 70, label: "Keto" },
};

const MACRO_COLORS = {
  protein: { bg: "bg-blue-500", text: "text-blue-400", label: "Protein" },
  carbs: { bg: "bg-green-500", text: "text-green-400", label: "Carbs" },
  fat: { bg: "bg-yellow-500", text: "text-yellow-400", label: "Fat" },
};

export default function MacroCalculatorPage() {
  // Step 1: TDEE inputs
  const [age, setAge] = useState("");
  const [gender, setGender] = useState<Gender>("male");
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [heightFt, setHeightFt] = useState("");
  const [heightIn, setHeightIn] = useState("");
  const [activity, setActivity] = useState<ActivityLevel>("moderately");
  const [units, setUnits] = useState<UnitSystem>("metric");

  // Step 2: Goal
  const [goal, setGoal] = useState<Goal>("maintain");

  // Step 3: Macro split
  const [preset, setPreset] = useState<MacroPreset>("balanced");
  const [customProtein, setCustomProtein] = useState("30");
  const [customCarbs, setCustomCarbs] = useState("40");
  const [customFat, setCustomFat] = useState("30");

  const weightKg = useMemo(() => {
    const w = parseFloat(weight) || 0;
    return units === "imperial" ? w * 0.453592 : w;
  }, [weight, units]);

  const heightCm = useMemo(() => {
    if (units === "imperial") {
      const ft = parseFloat(heightFt) || 0;
      const inches = parseFloat(heightIn) || 0;
      return (ft * 12 + inches) * 2.54;
    }
    return parseFloat(height) || 0;
  }, [height, heightFt, heightIn, units]);

  const parsedAge = parseFloat(age) || 0;

  const macroPercents = useMemo(() => {
    if (preset === "custom") {
      return {
        protein: parseFloat(customProtein) || 0,
        carbs: parseFloat(customCarbs) || 0,
        fat: parseFloat(customFat) || 0,
      };
    }
    return MACRO_PRESETS[preset];
  }, [preset, customProtein, customCarbs, customFat]);

  const percentTotal = macroPercents.protein + macroPercents.carbs + macroPercents.fat;

  const results = useMemo(() => {
    if (parsedAge <= 0 || weightKg <= 0 || heightCm <= 0) return null;

    // Mifflin-St Jeor
    const bmr =
      gender === "male"
        ? 10 * weightKg + 6.25 * heightCm - 5 * parsedAge + 5
        : 10 * weightKg + 6.25 * heightCm - 5 * parsedAge - 161;

    const tdee = bmr * ACTIVITY_MULTIPLIERS[activity];
    const adjustedCalories = Math.round(tdee + GOAL_ADJUSTMENT[goal]);
    const totalCalories = Math.max(adjustedCalories, 0);

    const proteinCal = totalCalories * (macroPercents.protein / 100);
    const carbsCal = totalCalories * (macroPercents.carbs / 100);
    const fatCal = totalCalories * (macroPercents.fat / 100);

    return {
      bmr: Math.round(bmr),
      tdee: Math.round(tdee),
      totalCalories,
      protein: Math.round(proteinCal / 4),
      carbs: Math.round(carbsCal / 4),
      fat: Math.round(fatCal / 9),
      proteinCal: Math.round(proteinCal),
      carbsCal: Math.round(carbsCal),
      fatCal: Math.round(fatCal),
    };
  }, [parsedAge, weightKg, heightCm, gender, activity, goal, macroPercents]);

  const isValidSplit = Math.abs(percentTotal - 100) < 0.01;

  return (
    <>
      <title>Macro Calculator - Free Macronutrient Calculator | DevTools Hub</title>
      <meta
        name="description"
        content="Calculate your daily macros for protein, carbs, and fat. Choose from balanced, low carb, high protein, or keto splits. Free macro calculator based on your TDEE and fitness goals."
      />
      <JsonLd
        data={[
          generateWebAppSchema({
            slug: "macro-calculator",
            name: "Macro Calculator",
            description:
              "Calculate your daily macronutrient targets based on TDEE and fitness goals",
            category: "health",
          }),
          generateBreadcrumbSchema({
            slug: "macro-calculator",
            name: "Macro Calculator",
            description:
              "Calculate your daily macronutrient targets based on TDEE and fitness goals",
            category: "health",
          }),
          generateFAQSchema([
            {
              question: "What are macronutrients?",
              answer:
                "Macronutrients are the three main nutrients your body needs in large amounts: protein, carbohydrates, and fat. Each provides energy (calories) and plays distinct roles in bodily functions, muscle repair, energy production, and hormone regulation.",
            },
            {
              question: "How do I calculate my daily macros?",
              answer:
                "First calculate your Total Daily Energy Expenditure (TDEE) using the Mifflin-St Jeor equation with your age, gender, weight, height, and activity level. Then adjust calories for your goal (lose, maintain, or gain weight). Finally, split those calories into protein, carbs, and fat percentages based on your preferred diet approach.",
            },
            {
              question: "What is the best macro split for weight loss?",
              answer:
                "A high-protein split (around 40% protein, 30% carbs, 30% fat) is often recommended for weight loss because protein helps preserve muscle mass during a calorie deficit and promotes satiety. However, the best split depends on your individual needs and preferences.",
            },
            {
              question: "How many calories per gram do macronutrients have?",
              answer:
                "Protein provides 4 calories per gram, carbohydrates provide 4 calories per gram, and fat provides 9 calories per gram. This is why fat is the most calorie-dense macronutrient and why fat percentages result in fewer grams compared to protein or carbs at the same calorie level.",
            },
          ]),
        ]}
      />

      <div className="min-h-screen bg-slate-900 text-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <ToolBreadcrumb slug="macro-calculator" />

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
              Macro Calculator
            </h1>
            <p className="text-slate-400 max-w-2xl text-lg">
              Calculate your daily macronutrient targets for protein, carbs, and
              fat based on your TDEE, fitness goals, and preferred diet split.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left side: Inputs */}
            <div className="lg:col-span-2 space-y-6">
              {/* Step 1: Personal Details / TDEE */}
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-5">
                <h2 className="text-lg font-semibold text-white mb-4">
                  Step 1: Your Details
                </h2>

                {/* Unit Toggle */}
                <div className="flex gap-2 mb-4">
                  {(["metric", "imperial"] as UnitSystem[]).map((u) => (
                    <button
                      key={u}
                      onClick={() => setUnits(u)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        units === u
                          ? "bg-blue-600 text-white"
                          : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                      }`}
                    >
                      {u === "metric" ? "Metric (kg/cm)" : "Imperial (lb/ft)"}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Age */}
                  <div>
                    <label
                      htmlFor="age"
                      className="block text-sm font-medium text-slate-300 mb-1"
                    >
                      Age
                    </label>
                    <input
                      id="age"
                      type="number"
                      min="1"
                      max="120"
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      placeholder="25"
                      className="w-full bg-slate-800 border border-slate-600 rounded-lg p-3 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Gender */}
                  <div>
                    <label
                      htmlFor="gender"
                      className="block text-sm font-medium text-slate-300 mb-1"
                    >
                      Gender
                    </label>
                    <select
                      id="gender"
                      value={gender}
                      onChange={(e) => setGender(e.target.value as Gender)}
                      className="w-full bg-slate-800 border border-slate-600 rounded-lg p-3 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                    </select>
                  </div>

                  {/* Weight */}
                  <div>
                    <label
                      htmlFor="weight"
                      className="block text-sm font-medium text-slate-300 mb-1"
                    >
                      Weight ({units === "metric" ? "kg" : "lb"})
                    </label>
                    <input
                      id="weight"
                      type="number"
                      min="1"
                      value={weight}
                      onChange={(e) => setWeight(e.target.value)}
                      placeholder={units === "metric" ? "70" : "154"}
                      className="w-full bg-slate-800 border border-slate-600 rounded-lg p-3 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Height */}
                  {units === "metric" ? (
                    <div>
                      <label
                        htmlFor="height"
                        className="block text-sm font-medium text-slate-300 mb-1"
                      >
                        Height (cm)
                      </label>
                      <input
                        id="height"
                        type="number"
                        min="1"
                        value={height}
                        onChange={(e) => setHeight(e.target.value)}
                        placeholder="175"
                        className="w-full bg-slate-800 border border-slate-600 rounded-lg p-3 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  ) : (
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1">
                        Height (ft / in)
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          min="1"
                          max="8"
                          value={heightFt}
                          onChange={(e) => setHeightFt(e.target.value)}
                          placeholder="5"
                          aria-label="Height feet"
                          className="w-1/2 bg-slate-800 border border-slate-600 rounded-lg p-3 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <input
                          type="number"
                          min="0"
                          max="11"
                          value={heightIn}
                          onChange={(e) => setHeightIn(e.target.value)}
                          placeholder="9"
                          aria-label="Height inches"
                          className="w-1/2 bg-slate-800 border border-slate-600 rounded-lg p-3 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Activity Level */}
                <div className="mt-4">
                  <label
                    htmlFor="activity"
                    className="block text-sm font-medium text-slate-300 mb-1"
                  >
                    Activity Level
                  </label>
                  <select
                    id="activity"
                    value={activity}
                    onChange={(e) =>
                      setActivity(e.target.value as ActivityLevel)
                    }
                    className="w-full bg-slate-800 border border-slate-600 rounded-lg p-3 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {(Object.keys(ACTIVITY_LABELS) as ActivityLevel[]).map(
                      (level) => (
                        <option key={level} value={level}>
                          {ACTIVITY_LABELS[level]}
                        </option>
                      )
                    )}
                  </select>
                </div>
              </div>

              {/* Step 2: Goal */}
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-5">
                <h2 className="text-lg font-semibold text-white mb-4">
                  Step 2: Your Goal
                </h2>
                <div className="flex flex-wrap gap-2">
                  {(Object.keys(GOAL_LABELS) as Goal[]).map((g) => (
                    <button
                      key={g}
                      onClick={() => setGoal(g)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        goal === g
                          ? "bg-blue-600 text-white"
                          : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                      }`}
                    >
                      {GOAL_LABELS[g]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Step 3: Macro Split */}
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-5">
                <h2 className="text-lg font-semibold text-white mb-4">
                  Step 3: Macro Split
                </h2>
                <div className="flex flex-wrap gap-2 mb-4">
                  {(
                    Object.keys(MACRO_PRESETS) as Exclude<
                      MacroPreset,
                      "custom"
                    >[]
                  ).map((p) => (
                    <button
                      key={p}
                      onClick={() => setPreset(p)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        preset === p
                          ? "bg-blue-600 text-white"
                          : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                      }`}
                    >
                      {MACRO_PRESETS[p].label}
                    </button>
                  ))}
                  <button
                    onClick={() => setPreset("custom")}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      preset === "custom"
                        ? "bg-blue-600 text-white"
                        : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                    }`}
                  >
                    Custom
                  </button>
                </div>

                {preset !== "custom" && (
                  <div className="text-sm text-slate-400">
                    Protein: {MACRO_PRESETS[preset].protein}% | Carbs:{" "}
                    {MACRO_PRESETS[preset].carbs}% | Fat:{" "}
                    {MACRO_PRESETS[preset].fat}%
                  </div>
                )}

                {preset === "custom" && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label
                          htmlFor="custom-protein"
                          className="block text-xs text-slate-400 mb-1"
                        >
                          Protein %
                        </label>
                        <input
                          id="custom-protein"
                          type="number"
                          min="0"
                          max="100"
                          value={customProtein}
                          onChange={(e) => setCustomProtein(e.target.value)}
                          className="w-full bg-slate-800 border border-slate-600 rounded-lg p-3 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="custom-carbs"
                          className="block text-xs text-slate-400 mb-1"
                        >
                          Carbs %
                        </label>
                        <input
                          id="custom-carbs"
                          type="number"
                          min="0"
                          max="100"
                          value={customCarbs}
                          onChange={(e) => setCustomCarbs(e.target.value)}
                          className="w-full bg-slate-800 border border-slate-600 rounded-lg p-3 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="custom-fat"
                          className="block text-xs text-slate-400 mb-1"
                        >
                          Fat %
                        </label>
                        <input
                          id="custom-fat"
                          type="number"
                          min="0"
                          max="100"
                          value={customFat}
                          onChange={(e) => setCustomFat(e.target.value)}
                          className="w-full bg-slate-800 border border-slate-600 rounded-lg p-3 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                    <div
                      className={`text-sm ${
                        isValidSplit ? "text-green-400" : "text-red-400"
                      }`}
                    >
                      Total: {percentTotal.toFixed(1)}%
                      {!isValidSplit && " (must equal 100%)"}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right side: Results */}
            <div className="space-y-4">
              {results && isValidSplit ? (
                <>
                  {/* Calorie Summary */}
                  <div className="bg-slate-800 border border-slate-700 rounded-lg p-5">
                    <div className="text-xs text-slate-400 mb-1">BMR</div>
                    <div className="text-lg font-semibold text-slate-300">
                      {results.bmr.toLocaleString()} cal
                    </div>
                    <div className="text-xs text-slate-400 mt-2 mb-1">
                      TDEE
                    </div>
                    <div className="text-lg font-semibold text-slate-300">
                      {results.tdee.toLocaleString()} cal
                    </div>
                  </div>

                  <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-5">
                    <div className="text-xs text-slate-400 mb-1">
                      Daily Calories
                    </div>
                    <div className="text-3xl font-bold text-blue-400">
                      {results.totalCalories.toLocaleString()}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      {goal === "lose"
                        ? "TDEE - 500 cal deficit"
                        : goal === "gain"
                        ? "TDEE + 500 cal surplus"
                        : "Maintenance calories"}
                    </div>
                  </div>

                  {/* Macro Cards */}
                  {(["protein", "carbs", "fat"] as const).map((macro) => (
                    <div
                      key={macro}
                      className="bg-slate-800 border border-slate-700 rounded-lg p-5"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span
                          className={`text-sm font-medium ${MACRO_COLORS[macro].text}`}
                        >
                          {MACRO_COLORS[macro].label}
                        </span>
                        <span className="text-xs text-slate-400">
                          {macroPercents[macro]}%
                        </span>
                      </div>
                      <div className="text-2xl font-bold text-white">
                        {results[macro]}g
                      </div>
                      <div className="text-xs text-slate-500">
                        {results[`${macro}Cal` as keyof typeof results]} cal
                      </div>
                    </div>
                  ))}

                  {/* Visual Breakdown Bar */}
                  <div className="bg-slate-800 border border-slate-700 rounded-lg p-5">
                    <div className="text-sm font-medium text-slate-300 mb-3">
                      Macro Breakdown
                    </div>
                    <div className="flex rounded-lg overflow-hidden h-8">
                      {macroPercents.protein > 0 && (
                        <div
                          className="bg-blue-500 flex items-center justify-center text-xs font-medium text-white transition-all"
                          style={{ width: `${macroPercents.protein}%` }}
                        >
                          {macroPercents.protein >= 10 && `${macroPercents.protein}%`}
                        </div>
                      )}
                      {macroPercents.carbs > 0 && (
                        <div
                          className="bg-green-500 flex items-center justify-center text-xs font-medium text-white transition-all"
                          style={{ width: `${macroPercents.carbs}%` }}
                        >
                          {macroPercents.carbs >= 10 && `${macroPercents.carbs}%`}
                        </div>
                      )}
                      {macroPercents.fat > 0 && (
                        <div
                          className="bg-yellow-500 flex items-center justify-center text-xs font-medium text-slate-900 transition-all"
                          style={{ width: `${macroPercents.fat}%` }}
                        >
                          {macroPercents.fat >= 10 && `${macroPercents.fat}%`}
                        </div>
                      )}
                    </div>
                    <div className="flex justify-between mt-2 text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />
                        Protein
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
                        Carbs
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-yellow-500 inline-block" />
                        Fat
                      </span>
                    </div>
                  </div>

                  {/* Gram Breakdown Bars */}
                  <div className="bg-slate-800 border border-slate-700 rounded-lg p-5">
                    <div className="text-sm font-medium text-slate-300 mb-3">
                      Daily Grams
                    </div>
                    <div className="space-y-3">
                      {(["protein", "carbs", "fat"] as const).map((macro) => {
                        const maxGrams = Math.max(
                          results.protein,
                          results.carbs,
                          results.fat,
                          1
                        );
                        const pct = (results[macro] / maxGrams) * 100;
                        return (
                          <div key={macro}>
                            <div className="flex justify-between text-xs text-slate-400 mb-1">
                              <span>{MACRO_COLORS[macro].label}</span>
                              <span>{results[macro]}g</span>
                            </div>
                            <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
                              <div
                                className={`h-full ${MACRO_COLORS[macro].bg} rounded-full transition-all`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </>
              ) : (
                <div className="bg-slate-800 border border-slate-700 rounded-lg p-5 text-center">
                  <div className="text-slate-400 text-sm">
                    {!isValidSplit
                      ? "Custom macro percentages must add up to 100%."
                      : "Enter your details to calculate your daily macros."}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* How to Use */}
          <section className="mt-12 bg-slate-800 border border-slate-700 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-4">
              How to Use This Macro Calculator
            </h2>
            <ol className="list-decimal list-inside space-y-2 text-slate-400">
              <li>
                Enter your age, gender, weight, height, and activity level to
                calculate your TDEE.
              </li>
              <li>
                Choose your fitness goal: lose weight, maintain, or gain weight.
              </li>
              <li>
                Select a macro split preset (Balanced, Low Carb, High Protein,
                Keto) or create a custom split.
              </li>
              <li>
                View your daily calorie target and the gram breakdown for
                protein, carbs, and fat on the right.
              </li>
            </ol>
          </section>

          <RelatedTools currentSlug="macro-calculator" />

          {/* FAQ Section */}
          <section className="mt-16 border-t border-slate-700 pt-10">
            <h2 className="text-2xl font-bold text-white mb-6">
              Frequently Asked Questions
            </h2>

            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  What are macronutrients?
                </h3>
                <p className="text-slate-400">
                  Macronutrients are the three main nutrients your body needs in
                  large amounts: protein, carbohydrates, and fat. Each provides
                  energy (calories) and plays distinct roles in bodily functions,
                  muscle repair, energy production, and hormone regulation.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  How do I calculate my daily macros?
                </h3>
                <p className="text-slate-400">
                  First calculate your Total Daily Energy Expenditure (TDEE)
                  using the Mifflin-St Jeor equation with your age, gender,
                  weight, height, and activity level. Then adjust calories for
                  your goal (lose, maintain, or gain weight). Finally, split
                  those calories into protein, carbs, and fat percentages based
                  on your preferred diet approach.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  What is the best macro split for weight loss?
                </h3>
                <p className="text-slate-400">
                  A high-protein split (around 40% protein, 30% carbs, 30% fat)
                  is often recommended for weight loss because protein helps
                  preserve muscle mass during a calorie deficit and promotes
                  satiety. However, the best split depends on your individual
                  needs and preferences.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  How many calories per gram do macronutrients have?
                </h3>
                <p className="text-slate-400">
                  Protein provides 4 calories per gram, carbohydrates provide 4
                  calories per gram, and fat provides 9 calories per gram. This
                  is why fat is the most calorie-dense macronutrient and why fat
                  percentages result in fewer grams compared to protein or carbs
                  at the same calorie level.
                </p>
              </div>
            </div>
          </section>

          {/* Educational Content */}
          <section className="mt-16 border-t border-slate-700 pt-10">
            <h2 className="text-2xl font-bold text-white mb-4">
              Understanding Macronutrients and Their Role in Nutrition
            </h2>
            <div className="text-slate-400 space-y-4">
              <p>
                Macronutrients are the foundation of your diet, providing the
                energy and building blocks your body needs to function. Protein
                is essential for building and repairing muscle tissue, supporting
                immune function, and producing enzymes and hormones. Most adults
                need between 0.8 and 1.2 grams of protein per kilogram of body
                weight, though active individuals and athletes may benefit from
                higher intakes.
              </p>
              <p>
                Carbohydrates are your body&apos;s preferred source of energy,
                fueling everything from brain function to intense exercise.
                Complex carbohydrates from whole grains, vegetables, and legumes
                provide sustained energy along with fiber and micronutrients.
                Simple carbs from fruit and dairy offer quick energy and
                important vitamins.
              </p>
              <p>
                Dietary fat plays a critical role in hormone production, nutrient
                absorption (particularly fat-soluble vitamins A, D, E, and K),
                and cell membrane integrity. Healthy fat sources include nuts,
                seeds, avocados, olive oil, and fatty fish. Finding the right
                balance of all three macronutrients, tailored to your activity
                level and goals, is key to sustainable nutrition and long-term
                health.
              </p>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
