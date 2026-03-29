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

type InputMethod = "lmp" | "conception" | "ivf3" | "ivf5";

interface Milestone {
  label: string;
  week: number;
  date: Date;
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatShortDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function daysBetween(a: Date, b: Date): number {
  const msPerDay = 1000 * 60 * 60 * 24;
  const aStart = new Date(a.getFullYear(), a.getMonth(), a.getDate());
  const bStart = new Date(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.round((bStart.getTime() - aStart.getTime()) / msPerDay);
}

export default function DueDateCalculatorPage() {
  const [inputMethod, setInputMethod] = useState<InputMethod>("lmp");
  const [dateInput, setDateInput] = useState("");

  const results = useMemo(() => {
    if (!dateInput) return null;

    const inputDate = new Date(dateInput + "T00:00:00");
    if (isNaN(inputDate.getTime())) return null;

    let dueDate: Date;
    let lmpDate: Date;

    switch (inputMethod) {
      case "lmp":
        dueDate = addDays(inputDate, 280);
        lmpDate = inputDate;
        break;
      case "conception":
        dueDate = addDays(inputDate, 266);
        lmpDate = addDays(inputDate, -14);
        break;
      case "ivf3":
        dueDate = addDays(inputDate, 263);
        lmpDate = addDays(inputDate, -17);
        break;
      case "ivf5":
        dueDate = addDays(inputDate, 261);
        lmpDate = addDays(inputDate, -19);
        break;
    }

    const today = new Date();
    const todayNorm = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );
    const totalDaysFromLmp = daysBetween(lmpDate, todayNorm);
    const gestationalWeeks = Math.floor(totalDaysFromLmp / 7);
    const gestationalDays = totalDaysFromLmp % 7;
    const isCurrentlyPregnant = totalDaysFromLmp >= 0 && totalDaysFromLmp <= 300;

    const trimester1Start = lmpDate;
    const trimester1End = addDays(lmpDate, 12 * 7 - 1);
    const trimester2Start = addDays(lmpDate, 12 * 7);
    const trimester2End = addDays(lmpDate, 27 * 7 - 1);
    const trimester3Start = addDays(lmpDate, 27 * 7);
    const trimester3End = dueDate;

    const milestones: Milestone[] = [
      {
        label: "End of First Trimester",
        week: 12,
        date: addDays(lmpDate, 12 * 7),
      },
      {
        label: "Anatomy Scan",
        week: 20,
        date: addDays(lmpDate, 20 * 7),
      },
      {
        label: "Viability Milestone",
        week: 24,
        date: addDays(lmpDate, 24 * 7),
      },
      {
        label: "Full Term",
        week: 37,
        date: addDays(lmpDate, 37 * 7),
      },
      {
        label: "Estimated Due Date",
        week: 40,
        date: dueDate,
      },
    ];

    let currentTrimester = 0;
    if (isCurrentlyPregnant) {
      if (totalDaysFromLmp < 12 * 7) currentTrimester = 1;
      else if (totalDaysFromLmp < 27 * 7) currentTrimester = 2;
      else currentTrimester = 3;
    }

    return {
      dueDate,
      lmpDate,
      gestationalWeeks,
      gestationalDays,
      isCurrentlyPregnant,
      trimester1Start,
      trimester1End,
      trimester2Start,
      trimester2End,
      trimester3Start,
      trimester3End,
      milestones,
      currentTrimester,
      totalDaysFromLmp,
    };
  }, [dateInput, inputMethod]);

  const inputLabels: Record<InputMethod, string> = {
    lmp: "Last Menstrual Period",
    conception: "Conception Date",
    ivf3: "IVF Transfer (3-Day)",
    ivf5: "IVF Transfer (5-Day)",
  };

  const inputDescriptions: Record<InputMethod, string> = {
    lmp: "Enter the first day of your last menstrual period",
    conception: "Enter the estimated date of conception",
    ivf3: "Enter the date of your 3-day embryo transfer",
    ivf5: "Enter the date of your 5-day embryo transfer",
  };

  return (
    <>
      <title>Due Date Calculator - Pregnancy Due Date Estimator | DevTools Hub</title>
      <meta
        name="description"
        content="Calculate your pregnancy due date based on your last menstrual period, conception date, or IVF transfer date. See your trimester timeline, gestational age, and key pregnancy milestones."
      />
      <JsonLd
        data={[
          generateWebAppSchema({
            slug: "due-date-calculator",
            name: "Pregnancy Due Date Calculator",
            description:
              "Calculate your pregnancy due date based on your last menstrual period, conception date, or IVF transfer date. See your trimester timeline, gestational age, and key pregnancy milestones.",
            category: "health",
          }),
          generateBreadcrumbSchema({
            slug: "due-date-calculator",
            name: "Pregnancy Due Date Calculator",
            description:
              "Calculate your pregnancy due date based on your last menstrual period, conception date, or IVF transfer date.",
            category: "health",
          }),
          generateFAQSchema([
            {
              question: "How is a pregnancy due date calculated?",
              answer:
                "The most common method uses Naegele's rule: add 280 days (40 weeks) to the first day of your last menstrual period (LMP). This assumes a 28-day cycle with ovulation on day 14. For conception dates, 266 days are added. For IVF transfers, 263 days (3-day embryo) or 261 days (5-day embryo) are added to the transfer date.",
            },
            {
              question: "How accurate is an estimated due date?",
              answer:
                "Only about 4-5% of babies are born on their exact due date. Most babies are born within a two-week window around the due date. Factors like cycle length, first vs. subsequent pregnancies, and individual variation all affect timing. An ultrasound in the first trimester can refine the estimate.",
            },
            {
              question:
                "What are the three trimesters of pregnancy?",
              answer:
                "The first trimester spans weeks 1-12, during which major organs begin forming. The second trimester covers weeks 13-27, when the baby grows rapidly and movements become noticeable. The third trimester runs from week 28 to delivery (around week 40), as the baby gains weight and prepares for birth.",
            },
            {
              question:
                "What is the difference between gestational age and fetal age?",
              answer:
                "Gestational age is measured from the first day of the last menstrual period, which is about two weeks before conception actually occurs. Fetal age (also called embryonic age) is measured from the date of conception. So gestational age is typically about two weeks longer than fetal age.",
            },
          ]),
        ]}
      />

      <div className="min-h-screen bg-slate-900 text-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <ToolBreadcrumb slug="due-date-calculator" />

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
              Pregnancy Due Date Calculator
            </h1>
            <p className="text-slate-400 max-w-2xl text-lg">
              Estimate your due date based on your last menstrual period,
              conception date, or IVF transfer date. See trimester timelines,
              gestational age, and key pregnancy milestones.
            </p>
          </div>

          {/* Input Method Toggle */}
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-5 mb-6">
            <label className="block text-sm font-medium text-slate-300 mb-3">
              Calculation Method
            </label>
            <div className="flex flex-wrap gap-2 mb-5">
              {(
                Object.keys(inputLabels) as InputMethod[]
              ).map((method) => (
                <button
                  key={method}
                  onClick={() => setInputMethod(method)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    inputMethod === method
                      ? "bg-blue-600 text-white"
                      : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                  }`}
                >
                  {inputLabels[method]}
                </button>
              ))}
            </div>

            <label className="block text-sm font-medium text-slate-300 mb-2">
              {inputDescriptions[inputMethod]}
            </label>
            <input
              type="date"
              value={dateInput}
              onChange={(e) => setDateInput(e.target.value)}
              className="bg-slate-800 border border-slate-600 rounded-lg p-3 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full max-w-xs"
            />
          </div>

          {/* Results */}
          {results && (
            <>
              {/* Due Date */}
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-5 mb-6">
                <h2 className="text-lg font-semibold text-white mb-4">
                  Estimated Due Date
                </h2>
                <p className="text-3xl font-bold text-blue-400 mb-2">
                  {formatDate(results.dueDate)}
                </p>
                {results.isCurrentlyPregnant && (
                  <p className="text-slate-400">
                    Current gestational age:{" "}
                    <span className="text-white font-semibold">
                      {results.gestationalWeeks} weeks and{" "}
                      {results.gestationalDays} day
                      {results.gestationalDays !== 1 ? "s" : ""}
                    </span>
                    {results.currentTrimester > 0 && (
                      <>
                        {" "}
                        &mdash;{" "}
                        <span className="text-emerald-400 font-medium">
                          {results.currentTrimester === 1
                            ? "First"
                            : results.currentTrimester === 2
                              ? "Second"
                              : "Third"}{" "}
                          Trimester
                        </span>
                      </>
                    )}
                  </p>
                )}
                {!results.isCurrentlyPregnant &&
                  results.totalDaysFromLmp < 0 && (
                    <p className="text-slate-500 text-sm">
                      The selected date is in the future.
                    </p>
                  )}
                {results.totalDaysFromLmp > 300 && (
                  <p className="text-slate-500 text-sm">
                    This date is more than 42 weeks ago.
                  </p>
                )}
              </div>

              {/* Trimester Breakdown */}
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-5 mb-6">
                <h2 className="text-lg font-semibold text-white mb-4">
                  Trimester Breakdown
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {[
                    {
                      num: 1,
                      label: "First Trimester",
                      weeks: "Weeks 1-12",
                      start: results.trimester1Start,
                      end: results.trimester1End,
                      color: "border-emerald-500",
                      bgColor:
                        results.currentTrimester === 1
                          ? "bg-emerald-900/20"
                          : "",
                    },
                    {
                      num: 2,
                      label: "Second Trimester",
                      weeks: "Weeks 13-27",
                      start: results.trimester2Start,
                      end: results.trimester2End,
                      color: "border-amber-500",
                      bgColor:
                        results.currentTrimester === 2
                          ? "bg-amber-900/20"
                          : "",
                    },
                    {
                      num: 3,
                      label: "Third Trimester",
                      weeks: "Weeks 28-40",
                      start: results.trimester3Start,
                      end: results.trimester3End,
                      color: "border-rose-500",
                      bgColor:
                        results.currentTrimester === 3
                          ? "bg-rose-900/20"
                          : "",
                    },
                  ].map((tri) => (
                    <div
                      key={tri.num}
                      className={`border-l-4 ${tri.color} ${tri.bgColor} rounded-r-lg p-4 bg-slate-900/50`}
                    >
                      <h3 className="font-semibold text-white text-sm mb-1">
                        {tri.label}
                      </h3>
                      <p className="text-xs text-slate-400 mb-2">
                        {tri.weeks}
                      </p>
                      <p className="text-sm text-slate-300">
                        {formatShortDate(tri.start)} &ndash;{" "}
                        {formatShortDate(tri.end)}
                      </p>
                      {results.isCurrentlyPregnant &&
                        results.currentTrimester === tri.num && (
                          <span className="inline-block mt-2 text-xs font-medium px-2 py-0.5 rounded bg-blue-600 text-white">
                            Current
                          </span>
                        )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Key Milestones */}
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-5 mb-6">
                <h2 className="text-lg font-semibold text-white mb-4">
                  Key Milestones
                </h2>
                <div className="space-y-3">
                  {results.milestones.map((milestone) => {
                    const isPast =
                      results.isCurrentlyPregnant &&
                      daysBetween(
                        milestone.date,
                        new Date(
                          new Date().getFullYear(),
                          new Date().getMonth(),
                          new Date().getDate()
                        )
                      ) > 0;
                    const isNear =
                      results.isCurrentlyPregnant &&
                      Math.abs(
                        daysBetween(
                          milestone.date,
                          new Date(
                            new Date().getFullYear(),
                            new Date().getMonth(),
                            new Date().getDate()
                          )
                        )
                      ) <= 7;

                    return (
                      <div
                        key={milestone.label}
                        className={`flex items-center justify-between py-2 px-3 rounded-lg ${
                          isPast
                            ? "bg-slate-900/30 text-slate-500"
                            : isNear
                              ? "bg-blue-900/20 border border-blue-800"
                              : "bg-slate-900/50"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className={`w-2 h-2 rounded-full shrink-0 ${
                              isPast
                                ? "bg-slate-600"
                                : isNear
                                  ? "bg-blue-400"
                                  : "bg-emerald-500"
                            }`}
                          />
                          <div>
                            <span
                              className={`text-sm font-medium ${
                                isPast ? "text-slate-500" : "text-white"
                              }`}
                            >
                              {milestone.label}
                            </span>
                            <span className="text-xs text-slate-500 ml-2">
                              Week {milestone.week}
                            </span>
                          </div>
                        </div>
                        <span
                          className={`text-sm ${
                            isPast ? "text-slate-600" : "text-slate-300"
                          }`}
                        >
                          {formatShortDate(milestone.date)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          <RelatedTools currentSlug="due-date-calculator" />

          {/* FAQ */}
          <section className="mt-16 border-t border-slate-700 pt-10">
            <h2 className="text-2xl font-bold text-white mb-6">
              Frequently Asked Questions
            </h2>

            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  How is a pregnancy due date calculated?
                </h3>
                <p className="text-slate-400">
                  The most common method uses Naegele&apos;s rule: add 280 days
                  (40 weeks) to the first day of your last menstrual period
                  (LMP). This assumes a 28-day cycle with ovulation on day 14.
                  For conception dates, 266 days are added. For IVF transfers,
                  263 days (3-day embryo) or 261 days (5-day embryo) are added
                  to the transfer date.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  How accurate is an estimated due date?
                </h3>
                <p className="text-slate-400">
                  Only about 4-5% of babies are born on their exact due date.
                  Most babies are born within a two-week window around the due
                  date. Factors like cycle length, first vs. subsequent
                  pregnancies, and individual variation all affect timing. An
                  ultrasound in the first trimester can refine the estimate.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  What are the three trimesters of pregnancy?
                </h3>
                <p className="text-slate-400">
                  The first trimester spans weeks 1-12, during which major
                  organs begin forming. The second trimester covers weeks 13-27,
                  when the baby grows rapidly and movements become noticeable.
                  The third trimester runs from week 28 to delivery (around week
                  40), as the baby gains weight and prepares for birth.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  What is the difference between gestational age and fetal age?
                </h3>
                <p className="text-slate-400">
                  Gestational age is measured from the first day of the last
                  menstrual period, which is about two weeks before conception
                  actually occurs. Fetal age (also called embryonic age) is
                  measured from the date of conception. So gestational age is
                  typically about two weeks longer than fetal age.
                </p>
              </div>
            </div>
          </section>

          {/* Educational Content */}
          <section className="mt-16 border-t border-slate-700 pt-10">
            <h2 className="text-2xl font-bold text-white mb-4">
              Understanding Pregnancy Due Dates
            </h2>
            <div className="text-slate-400 space-y-4 max-w-3xl">
              <p>
                Pregnancy due dates are typically estimated using Naegele&apos;s
                rule, a method developed by German obstetrician Franz Naegele in
                the early 1800s. The rule assumes a standard 28-day menstrual
                cycle and calculates the due date as 280 days (40 weeks) from
                the first day of the last menstrual period. Since ovulation
                usually occurs around day 14 of the cycle, this effectively
                estimates 266 days from conception.
              </p>
              <p>
                While widely used, Naegele&apos;s rule has limitations. Women
                with longer or shorter menstrual cycles may ovulate earlier or
                later than day 14, shifting the actual due date. First-time
                mothers tend to deliver slightly later than the estimated date,
                while subsequent pregnancies may arrive a few days earlier.
                Ultrasound dating, particularly in the first trimester, provides
                a more accurate estimate by measuring the embryo&apos;s
                crown-rump length.
              </p>
              <p>
                A full-term pregnancy ranges from 37 to 42 weeks. Babies born
                before 37 weeks are considered preterm, while those born after
                42 weeks are post-term. Medical professionals use the estimated
                due date as a reference point for scheduling prenatal tests,
                monitoring fetal development, and planning delivery. This
                calculator is intended for informational purposes and should not
                replace professional medical advice.
              </p>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
