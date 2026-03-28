"use client";

import { useState, useCallback, useEffect } from "react";
import JsonLd from "@/components/JsonLd";
import RelatedTools from "@/components/RelatedTools";
import ToolBreadcrumb from "@/components/ToolBreadcrumb";
import AdUnit from "@/components/AdUnit";
import {
  generateFAQSchema,
  generateWebAppSchema,
  generateBreadcrumbSchema,
} from "@/lib/jsonld";

// ── Constants ──────────────────────────────────────────────────────────
const MONTHS = ["", "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const DAYS_OF_WEEK = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const SHORT_MONTHS = ["", "JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
const SHORT_DAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

const PRESETS: { label: string; cron: string }[] = [
  { label: "Every minute", cron: "* * * * *" },
  { label: "Every 5 minutes", cron: "*/5 * * * *" },
  { label: "Every 15 minutes", cron: "*/15 * * * *" },
  { label: "Every 30 minutes", cron: "*/30 * * * *" },
  { label: "Every hour", cron: "0 * * * *" },
  { label: "Every 6 hours", cron: "0 */6 * * *" },
  { label: "Daily at midnight", cron: "0 0 * * *" },
  { label: "Daily at 9 AM", cron: "0 9 * * *" },
  { label: "Daily at noon", cron: "0 12 * * *" },
  { label: "Weekdays at 8 AM", cron: "0 8 * * 1-5" },
  { label: "Every Monday at 9 AM", cron: "0 9 * * 1" },
  { label: "Sunday at 3 AM", cron: "0 3 * * 0" },
  { label: "1st of every month", cron: "0 0 1 * *" },
  { label: "Quarterly (Jan, Apr, Jul, Oct)", cron: "0 0 1 1,4,7,10 *" },
  { label: "Yearly (Jan 1st)", cron: "0 0 1 1 *" },
];

// ── Expand cron field to list of matching values ───────────────────────
const expandField = (raw: string, min: number, max: number, names?: string[]): number[] => {
  let f = raw.toUpperCase();
  if (names) {
    for (let i = 0; i < names.length; i++) {
      if (names[i]) f = f.replace(new RegExp(names[i], "g"), String(i));
    }
  }
  const values = new Set<number>();
  const parts = f.split(",");
  for (const part of parts) {
    const stepMatch = part.match(/^(.+)\/(\d+)$/);
    const range = stepMatch ? stepMatch[1] : part;
    const step = stepMatch ? parseInt(stepMatch[2], 10) : 1;
    if (range === "*") {
      for (let i = min; i <= max; i += step) values.add(i);
      continue;
    }
    const rangeMatch = range.match(/^(\d+)-(\d+)$/);
    if (rangeMatch) {
      const start = parseInt(rangeMatch[1], 10);
      const end = parseInt(rangeMatch[2], 10);
      for (let i = start; i <= end; i += step) {
        if (i >= min && i <= max) values.add(i);
      }
      continue;
    }
    const val = parseInt(range, 10);
    if (!isNaN(val) && val >= min && val <= max) values.add(val);
  }
  return Array.from(values).sort((a, b) => a - b);
};

// ── Validate a cron expression ─────────────────────────────────────────
const validateCron = (expr: string): { valid: boolean; error?: string } => {
  const parts = expr.trim().split(/\s+/);
  if (parts.length !== 5) return { valid: false, error: `Expected 5 fields, got ${parts.length}` };
  const fieldDefs = [
    { name: "Minute", min: 0, max: 59 },
    { name: "Hour", min: 0, max: 23 },
    { name: "Day of Month", min: 1, max: 31 },
    { name: "Month", min: 1, max: 12 },
    { name: "Day of Week", min: 0, max: 6 },
  ];
  for (let i = 0; i < 5; i++) {
    const field = parts[i];
    const def = fieldDefs[i];
    if (field === "*") continue;
    const segments = field.split(",");
    for (const seg of segments) {
      const stepMatch = seg.match(/^(.+)\/(\d+)$/);
      const base = stepMatch ? stepMatch[1] : seg;
      const stepVal = stepMatch ? parseInt(stepMatch[2], 10) : null;
      if (stepVal !== null && (isNaN(stepVal) || stepVal < 1)) {
        return { valid: false, error: `${def.name}: invalid step value "${stepMatch![2]}"` };
      }
      if (base === "*") continue;
      const rangeMatch = base.match(/^(\d+)-(\d+)$/);
      if (rangeMatch) {
        const s = parseInt(rangeMatch[1], 10);
        const e = parseInt(rangeMatch[2], 10);
        if (s < def.min || s > def.max || e < def.min || e > def.max) {
          return { valid: false, error: `${def.name}: range ${s}-${e} out of bounds (${def.min}-${def.max})` };
        }
        if (s > e) {
          return { valid: false, error: `${def.name}: range start ${s} > end ${e}` };
        }
        continue;
      }
      // Handle named values for month/dow
      let numVal = parseInt(base, 10);
      if (isNaN(numVal)) {
        if (i === 3) {
          const idx = SHORT_MONTHS.indexOf(base.toUpperCase());
          if (idx > 0) { numVal = idx; } else {
            return { valid: false, error: `${def.name}: invalid value "${base}"` };
          }
        } else if (i === 4) {
          const idx = SHORT_DAYS.indexOf(base.toUpperCase());
          if (idx >= 0) { numVal = idx; } else {
            return { valid: false, error: `${def.name}: invalid value "${base}"` };
          }
        } else {
          return { valid: false, error: `${def.name}: invalid value "${base}"` };
        }
      }
      if (numVal < def.min || numVal > def.max) {
        return { valid: false, error: `${def.name}: value ${numVal} out of range (${def.min}-${def.max})` };
      }
    }
  }
  return { valid: true };
};

// ── Human-readable description ─────────────────────────────────────────
const describeCron = (expr: string): string => {
  const parts = expr.trim().split(/\s+/);
  if (parts.length !== 5) return `Invalid: expected 5 fields, got ${parts.length}`;

  const minutes = expandField(parts[0], 0, 59);
  const hours = expandField(parts[1], 0, 23);
  const doms = expandField(parts[2], 1, 31);
  const months = expandField(parts[3], 1, 12, SHORT_MONTHS);
  const dows = expandField(parts[4], 0, 6, SHORT_DAYS);

  const desc: string[] = [];

  // Time part
  if (minutes.length === 60 && hours.length === 24) {
    desc.push("Every minute");
  } else if (minutes.length === 60) {
    desc.push(`Every minute past hour${hours.length > 1 ? "s" : ""} ${hours.join(", ")}`);
  } else if (minutes.length === 1 && hours.length === 1) {
    const h = hours[0];
    const m = minutes[0];
    const ampm = h >= 12 ? "PM" : "AM";
    const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
    desc.push(`At ${h12}:${String(m).padStart(2, "0")} ${ampm}`);
  } else if (minutes.length === 1 && hours.length === 24) {
    desc.push(`At minute ${minutes[0]} of every hour`);
  } else {
    const step = detectStep(minutes);
    const minPart = step ? `every ${step} minutes` : minutes.length <= 5 ? `minute${minutes.length > 1 ? "s" : ""} ${minutes.join(", ")}` : `${minutes.length} specific minutes`;
    const hourStep = detectStep(hours);
    const hourPart = hours.length === 24 ? "every hour" : hourStep ? `every ${hourStep} hours` : hours.length <= 5 ? `hour${hours.length > 1 ? "s" : ""} ${hours.join(", ")}` : `${hours.length} specific hours`;
    desc.push(`At ${minPart} past ${hourPart}`);
  }

  // Day of month
  if (doms.length < 31 && parts[2] !== "*") {
    desc.push(`on day${doms.length > 1 ? "s" : ""} ${doms.join(", ")} of the month`);
  }

  // Month
  if (months.length < 12) {
    desc.push(`in ${months.map((m) => MONTHS[m]).join(", ")}`);
  }

  // Day of week
  if (dows.length < 7 && parts[4] !== "*") {
    desc.push(`on ${dows.map((d) => DAYS_OF_WEEK[d]).join(", ")}`);
  }

  return desc.join(", ");
};

const detectStep = (values: number[]): number | null => {
  if (values.length < 2) return null;
  const diffs = new Set<number>();
  for (let i = 1; i < values.length; i++) diffs.add(values[i] - values[i - 1]);
  if (diffs.size === 1) return Array.from(diffs)[0];
  return null;
};

// ── Next N runs calculator ─────────────────────────────────────────────
const calculateNextRuns = (expr: string, count: number): string[] => {
  const parts = expr.trim().split(/\s+/);
  if (parts.length !== 5) return [];

  const minutes = expandField(parts[0], 0, 59);
  const hours = expandField(parts[1], 0, 23);
  const doms = expandField(parts[2], 1, 31);
  const monthsList = expandField(parts[3], 1, 12, SHORT_MONTHS);
  const dows = expandField(parts[4], 0, 6, SHORT_DAYS);
  const domWild = parts[2] === "*";
  const dowWild = parts[4] === "*";

  const results: string[] = [];
  const candidate = new Date();
  candidate.setMilliseconds(0);
  candidate.setSeconds(0);
  candidate.setMinutes(candidate.getMinutes() + 1);

  let safety = 0;
  while (results.length < count && safety < 525600) {
    safety++;
    const m = candidate.getMinutes();
    const h = candidate.getHours();
    const dom = candidate.getDate();
    const mon = candidate.getMonth() + 1;
    const dow = candidate.getDay();

    if (!monthsList.includes(mon)) {
      candidate.setMonth(candidate.getMonth() + 1);
      candidate.setDate(1);
      candidate.setHours(0);
      candidate.setMinutes(0);
      continue;
    }

    const domMatch = domWild || doms.includes(dom);
    const dowMatch = dowWild || dows.includes(dow);
    const dayMatch = (domWild && dowWild) || (!domWild && !dowWild) ? (domMatch && dowMatch) : (domMatch || dowMatch);

    if (!dayMatch) {
      candidate.setDate(candidate.getDate() + 1);
      candidate.setHours(0);
      candidate.setMinutes(0);
      continue;
    }

    if (!hours.includes(h)) {
      candidate.setHours(candidate.getHours() + 1);
      candidate.setMinutes(0);
      continue;
    }

    if (!minutes.includes(m)) {
      candidate.setMinutes(candidate.getMinutes() + 1);
      continue;
    }

    results.push(candidate.toLocaleString("en-US", {
      weekday: "short", year: "numeric", month: "short", day: "numeric",
      hour: "2-digit", minute: "2-digit", hour12: true,
    }));

    candidate.setMinutes(candidate.getMinutes() + 1);
  }

  return results;
};

// ── Build cron from visual state ───────────────────────────────────────
interface FieldConfig {
  value: string;
}

const buildFromDropdowns = (
  minuteVal: string,
  hourVal: string,
  domVal: string,
  monthVal: string,
  dowVal: string,
): string => {
  return `${minuteVal} ${hourVal} ${domVal} ${monthVal} ${dowVal}`;
};

// ── Main component ─────────────────────────────────────────────────────
export default function CronBuilder() {
  // Visual builder state
  const [minuteMode, setMinuteMode] = useState<"every" | "specific" | "step">("specific");
  const [minuteSpecific, setMinuteSpecific] = useState("0");
  const [minuteStep, setMinuteStep] = useState("5");
  const [hourMode, setHourMode] = useState<"every" | "specific" | "step">("specific");
  const [hourSpecific, setHourSpecific] = useState("9");
  const [hourStep, setHourStep] = useState("2");
  const [domMode, setDomMode] = useState<"every" | "specific">("every");
  const [domSpecific, setDomSpecific] = useState("1");
  const [monthMode, setMonthMode] = useState<"every" | "specific">("every");
  const [monthSpecific, setMonthSpecific] = useState("1");
  const [dowMode, setDowMode] = useState<"every" | "specific">("every");
  const [dowSpecific, setDowSpecific] = useState("1");

  // Manual input state
  const [manualInput, setManualInput] = useState("");
  const [manualValidation, setManualValidation] = useState<{ valid: boolean; error?: string } | null>(null);

  const [copied, setCopied] = useState(false);

  // Build expression from visual state
  const getFieldValue = (mode: string, specific: string, step?: string): string => {
    if (mode === "every") return "*";
    if (mode === "step") return `*/${step}`;
    return specific;
  };

  const expression = buildFromDropdowns(
    getFieldValue(minuteMode, minuteSpecific, minuteStep),
    getFieldValue(hourMode, hourSpecific, hourStep),
    getFieldValue(domMode, domSpecific),
    getFieldValue(monthMode, monthSpecific),
    getFieldValue(dowMode, dowSpecific),
  );

  const description = describeCron(expression);
  const nextRuns = calculateNextRuns(expression, 5);

  const copyExpression = useCallback(async () => {
    await navigator.clipboard.writeText(expression);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [expression]);

  const applyPreset = useCallback((cron: string) => {
    const parts = cron.split(/\s+/);
    if (parts.length !== 5) return;

    // Minute
    if (parts[0] === "*") { setMinuteMode("every"); }
    else if (parts[0].startsWith("*/")) { setMinuteMode("step"); setMinuteStep(parts[0].slice(2)); }
    else { setMinuteMode("specific"); setMinuteSpecific(parts[0]); }

    // Hour
    if (parts[1] === "*") { setHourMode("every"); }
    else if (parts[1].startsWith("*/")) { setHourMode("step"); setHourStep(parts[1].slice(2)); }
    else { setHourMode("specific"); setHourSpecific(parts[1]); }

    // Day of month
    if (parts[2] === "*") { setDomMode("every"); }
    else { setDomMode("specific"); setDomSpecific(parts[2]); }

    // Month
    if (parts[3] === "*") { setMonthMode("every"); }
    else { setMonthMode("specific"); setMonthSpecific(parts[3]); }

    // Day of week
    if (parts[4] === "*") { setDowMode("every"); }
    else { setDowMode("specific"); setDowSpecific(parts[4]); }
  }, []);

  // Validate manual input live
  useEffect(() => {
    const trimmed = manualInput.trim();
    if (!trimmed) { setManualValidation(null); return; }
    setManualValidation(validateCron(trimmed));
  }, [manualInput]);

  const loadManualInput = useCallback(() => {
    const trimmed = manualInput.trim();
    if (!trimmed) return;
    const v = validateCron(trimmed);
    if (v.valid) applyPreset(trimmed);
  }, [manualInput, applyPreset]);

  return (
    <>
      <title>Cron Expression Builder — Visual Cron Generator | DevTools</title>
      <meta
        name="description"
        content="Free online cron expression builder. Create cron schedules visually with dropdowns, see plain English descriptions, preview next 5 run times, and validate cron strings. Common presets included."
      />
      <meta
        name="keywords"
        content="cron expression builder, cron builder, visual cron generator, cron schedule builder, crontab builder, cron job builder, cron maker, build cron expression, cron syntax builder, cron helper"
      />
      <JsonLd
        data={[
          generateWebAppSchema({
            slug: "cron-builder",
            name: "Cron Expression Builder",
            description: "Free online cron expression builder. Create cron schedules visually with dropdowns, plain English descriptions, and next 5 run times preview.",
            category: "developer",
          }),
          generateBreadcrumbSchema({
            slug: "cron-builder",
            name: "Cron Expression Builder",
            description: "Free online cron expression builder with visual dropdowns and schedule preview.",
            category: "developer",
          }),
          generateFAQSchema([
            { question: "What is a cron expression builder?", answer: "A cron expression builder is a visual tool that helps you create cron schedule strings without memorizing cron syntax. Use dropdowns to select minute, hour, day, month, and weekday values, and the builder generates the correct cron expression automatically." },
            { question: "How do I read a cron expression?", answer: "A standard cron expression has 5 fields: minute (0-59), hour (0-23), day of month (1-31), month (1-12), day of week (0-6, where 0 is Sunday). An asterisk (*) means 'every', a slash (/) means 'every Nth', a comma separates specific values, and a dash defines a range." },
            { question: "What does '0 9 * * 1-5' mean?", answer: "This cron expression means 'At 9:00 AM, Monday through Friday'. The 0 means minute 0, 9 means hour 9 (9 AM), the two asterisks mean every day of the month and every month, and 1-5 means Monday through Friday." },
            { question: "How do I schedule a cron job to run every day at midnight?", answer: "Use the cron expression '0 0 * * *'. This sets minute 0, hour 0 (midnight), with wildcards for day, month, and weekday — meaning it runs at 00:00 every day." },
            { question: "Where can I use cron expressions?", answer: "Cron expressions are used in Linux/Unix crontab, GitHub Actions (schedule trigger), AWS EventBridge, Kubernetes CronJobs, Google Cloud Scheduler, Vercel Cron Jobs, Jenkins pipelines, and many other scheduling systems." },
          ]),
        ]}
      />

      <div className="min-h-screen bg-slate-900 text-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <ToolBreadcrumb slug="cron-builder" />

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
              Cron Expression Builder
            </h1>
            <p className="text-slate-400 max-w-2xl text-lg">
              Build cron expressions visually with simple dropdowns. See a plain English description of your schedule and preview the next 5 run times instantly.
            </p>
          </div>

          <AdUnit slot="TOP_SLOT" format="horizontal" className="mb-6" />

          {/* Common Presets */}
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 mb-6">
            <h2 className="text-sm font-medium text-slate-400 mb-3">Common Presets</h2>
            <div className="flex flex-wrap gap-2">
              {PRESETS.map((preset) => (
                <button
                  key={preset.cron}
                  onClick={() => applyPreset(preset.cron)}
                  className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded text-xs font-medium transition-colors"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Visual Builder */}
          <div className="space-y-4 mb-6">
            {/* Minute */}
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-white">Minute</h3>
                <select
                  value={minuteMode}
                  onChange={(e) => setMinuteMode(e.target.value as "every" | "specific" | "step")}
                  className="bg-slate-700 border border-slate-600 text-white rounded px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="every">Every minute (*)</option>
                  <option value="specific">Specific minute</option>
                  <option value="step">Every N minutes</option>
                </select>
              </div>
              {minuteMode === "specific" && (
                <select
                  value={minuteSpecific}
                  onChange={(e) => setMinuteSpecific(e.target.value)}
                  className="bg-slate-700 border border-slate-600 text-white rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {Array.from({ length: 60 }, (_, i) => (
                    <option key={i} value={String(i)}>{String(i).padStart(2, "0")}</option>
                  ))}
                </select>
              )}
              {minuteMode === "step" && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">Every</span>
                  <select
                    value={minuteStep}
                    onChange={(e) => setMinuteStep(e.target.value)}
                    className="bg-slate-700 border border-slate-600 text-white rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {[1, 2, 3, 5, 10, 15, 20, 30].map((v) => (
                      <option key={v} value={String(v)}>{v}</option>
                    ))}
                  </select>
                  <span className="text-xs text-slate-400">minutes</span>
                </div>
              )}
              {minuteMode === "every" && (
                <p className="text-xs text-slate-500">Runs every minute</p>
              )}
            </div>

            {/* Hour */}
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-white">Hour</h3>
                <select
                  value={hourMode}
                  onChange={(e) => setHourMode(e.target.value as "every" | "specific" | "step")}
                  className="bg-slate-700 border border-slate-600 text-white rounded px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="every">Every hour (*)</option>
                  <option value="specific">Specific hour</option>
                  <option value="step">Every N hours</option>
                </select>
              </div>
              {hourMode === "specific" && (
                <select
                  value={hourSpecific}
                  onChange={(e) => setHourSpecific(e.target.value)}
                  className="bg-slate-700 border border-slate-600 text-white rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {Array.from({ length: 24 }, (_, i) => {
                    const ampm = i >= 12 ? "PM" : "AM";
                    const h12 = i === 0 ? 12 : i > 12 ? i - 12 : i;
                    return <option key={i} value={String(i)}>{`${h12}:00 ${ampm} (${i})`}</option>;
                  })}
                </select>
              )}
              {hourMode === "step" && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">Every</span>
                  <select
                    value={hourStep}
                    onChange={(e) => setHourStep(e.target.value)}
                    className="bg-slate-700 border border-slate-600 text-white rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {[1, 2, 3, 4, 6, 8, 12].map((v) => (
                      <option key={v} value={String(v)}>{v}</option>
                    ))}
                  </select>
                  <span className="text-xs text-slate-400">hours</span>
                </div>
              )}
              {hourMode === "every" && (
                <p className="text-xs text-slate-500">Runs every hour</p>
              )}
            </div>

            {/* Day of Month */}
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-white">Day of Month</h3>
                <select
                  value={domMode}
                  onChange={(e) => setDomMode(e.target.value as "every" | "specific")}
                  className="bg-slate-700 border border-slate-600 text-white rounded px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="every">Every day (*)</option>
                  <option value="specific">Specific day(s)</option>
                </select>
              </div>
              {domMode === "specific" && (
                <select
                  value={domSpecific}
                  onChange={(e) => setDomSpecific(e.target.value)}
                  className="bg-slate-700 border border-slate-600 text-white rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {Array.from({ length: 31 }, (_, i) => (
                    <option key={i + 1} value={String(i + 1)}>{i + 1}</option>
                  ))}
                </select>
              )}
              {domMode === "every" && (
                <p className="text-xs text-slate-500">Runs every day of the month</p>
              )}
            </div>

            {/* Month */}
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-white">Month</h3>
                <select
                  value={monthMode}
                  onChange={(e) => setMonthMode(e.target.value as "every" | "specific")}
                  className="bg-slate-700 border border-slate-600 text-white rounded px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="every">Every month (*)</option>
                  <option value="specific">Specific month</option>
                </select>
              </div>
              {monthMode === "specific" && (
                <select
                  value={monthSpecific}
                  onChange={(e) => setMonthSpecific(e.target.value)}
                  className="bg-slate-700 border border-slate-600 text-white rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {MONTHS.slice(1).map((name, i) => (
                    <option key={i + 1} value={String(i + 1)}>{name}</option>
                  ))}
                </select>
              )}
              {monthMode === "every" && (
                <p className="text-xs text-slate-500">Runs every month</p>
              )}
            </div>

            {/* Day of Week */}
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-white">Day of Week</h3>
                <select
                  value={dowMode}
                  onChange={(e) => setDowMode(e.target.value as "every" | "specific")}
                  className="bg-slate-700 border border-slate-600 text-white rounded px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="every">Every day (*)</option>
                  <option value="specific">Specific day(s)</option>
                </select>
              </div>
              {dowMode === "specific" && (
                <select
                  value={dowSpecific}
                  onChange={(e) => setDowSpecific(e.target.value)}
                  className="bg-slate-700 border border-slate-600 text-white rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {DAYS_OF_WEEK.map((name, i) => (
                    <option key={i} value={String(i)}>{name}</option>
                  ))}
                </select>
              )}
              {dowMode === "every" && (
                <p className="text-xs text-slate-500">Runs every day of the week</p>
              )}
            </div>
          </div>

          {/* Generated Expression Display */}
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 mb-6">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-medium text-slate-400">Generated Cron Expression</h2>
              <button
                onClick={copyExpression}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors"
              >
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
            <code className="block text-2xl sm:text-3xl font-mono text-blue-400 tracking-widest text-center py-4">
              {expression}
            </code>

            {/* Field labels */}
            <div className="flex justify-center mt-1 gap-0">
              {["minute", "hour", "day(mo)", "month", "day(wk)"].map((label) => (
                <span key={label} className="text-[10px] text-slate-500 text-center" style={{ width: "20%" }}>
                  {label}
                </span>
              ))}
            </div>

            {/* Plain English description */}
            <div className="mt-4 p-3 bg-slate-900 rounded-lg border border-slate-700">
              <p className="text-sm text-slate-400 mb-1">Plain English</p>
              <p className="text-lg font-medium text-white">{description}</p>
            </div>
          </div>

          {/* Next 5 Runs */}
          {nextRuns.length > 0 && (
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 mb-6">
              <h2 className="text-sm font-medium text-slate-400 mb-3">Next 5 Scheduled Runs</h2>
              <div className="space-y-1">
                {nextRuns.map((run, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm">
                    <span className="text-slate-500 w-6 text-right">{i + 1}.</span>
                    <span className="font-mono text-slate-200">{run}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <AdUnit slot="MID_SLOT" format="rectangle" className="mb-6" />

          {/* Manual Cron Input with Validation */}
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 mb-6">
            <h2 className="text-lg font-semibold text-white mb-3">Validate a Cron Expression</h2>
            <p className="text-sm text-slate-400 mb-3">
              Paste a cron expression to validate it and see its schedule description.
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                placeholder="e.g. */15 9-17 * * 1-5"
                className="flex-1 bg-slate-900 border border-slate-600 rounded-lg px-4 py-3 font-mono text-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 tracking-widest"
                spellCheck={false}
              />
              <button
                onClick={loadManualInput}
                disabled={!manualValidation?.valid}
                className="px-4 py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-lg text-sm font-medium transition-colors whitespace-nowrap"
              >
                Load into Builder
              </button>
            </div>

            {manualValidation && (
              <div className={`mt-3 p-3 rounded-lg border ${
                manualValidation.valid
                  ? "bg-green-900/30 border-green-700 text-green-300"
                  : "bg-red-900/30 border-red-700 text-red-300"
              }`}>
                {manualValidation.valid ? (
                  <>
                    <p className="text-sm font-medium mb-1">Valid cron expression</p>
                    <p className="text-sm">{describeCron(manualInput.trim())}</p>
                    {calculateNextRuns(manualInput.trim(), 5).length > 0 && (
                      <div className="mt-2 space-y-0.5">
                        <p className="text-xs text-green-400 mb-1">Next runs:</p>
                        {calculateNextRuns(manualInput.trim(), 5).map((run, i) => (
                          <p key={i} className="text-xs font-mono">{i + 1}. {run}</p>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-sm">{manualValidation.error}</p>
                )}
              </div>
            )}
          </div>

          {/* Syntax Reference */}
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 mb-6">
            <h2 className="text-lg font-semibold text-white mb-4">Cron Syntax Quick Reference</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left py-2 text-slate-400 font-medium">Field</th>
                    <th className="text-left py-2 text-slate-400 font-medium">Range</th>
                    <th className="text-left py-2 text-slate-400 font-medium">Special Characters</th>
                  </tr>
                </thead>
                <tbody className="text-slate-300">
                  {[
                    ["Minute", "0-59", "* , - /"],
                    ["Hour", "0-23", "* , - /"],
                    ["Day of Month", "1-31", "* , - /"],
                    ["Month", "1-12 or JAN-DEC", "* , - /"],
                    ["Day of Week", "0-6 or SUN-SAT", "* , - /"],
                  ].map(([field, range, special]) => (
                    <tr key={field} className="border-b border-slate-700/50">
                      <td className="py-2 font-medium text-white">{field}</td>
                      <td className="py-2 font-mono text-blue-400">{range}</td>
                      <td className="py-2 font-mono">{special}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 space-y-2 text-sm text-slate-400">
              <p><code className="text-blue-400">*</code> — matches all values</p>
              <p><code className="text-blue-400">,</code> — list separator (e.g. 1,3,5)</p>
              <p><code className="text-blue-400">-</code> — range (e.g. 1-5)</p>
              <p><code className="text-blue-400">/</code> — step (e.g. */5 = every 5)</p>
            </div>
          </div>

          <AdUnit slot="BOTTOM_SLOT" format="auto" className="mb-6" />

          <RelatedTools currentSlug="cron-builder" />

          {/* FAQ */}
          <section className="mt-16 border-t border-slate-700 pt-10">
            <h2 className="text-2xl font-bold text-white mb-6">Frequently Asked Questions</h2>
            <div className="space-y-6">
              {[
                { q: "What is a cron expression builder?", a: "A cron expression builder is a visual tool that helps you create cron schedule strings without memorizing cron syntax. Use dropdowns to select minute, hour, day, month, and weekday values, and the builder generates the correct cron expression automatically." },
                { q: "How do I read a cron expression?", a: "A standard cron expression has 5 fields: minute (0-59), hour (0-23), day of month (1-31), month (1-12), day of week (0-6, where 0 is Sunday). An asterisk (*) means 'every', a slash (/) means 'every Nth', a comma separates specific values, and a dash defines a range." },
                { q: "What does '0 9 * * 1-5' mean?", a: "This cron expression means 'At 9:00 AM, Monday through Friday'. The 0 means minute 0, 9 means hour 9 (9 AM), the two asterisks mean every day of the month and every month, and 1-5 means Monday through Friday." },
                { q: "How do I schedule a cron job to run every day at midnight?", a: "Use the cron expression '0 0 * * *'. This sets minute 0, hour 0 (midnight), with wildcards for day, month, and weekday \u2014 meaning it runs at 00:00 every day." },
                { q: "Where can I use cron expressions?", a: "Cron expressions are used in Linux/Unix crontab, GitHub Actions (schedule trigger), AWS EventBridge, Kubernetes CronJobs, Google Cloud Scheduler, Vercel Cron Jobs, Jenkins pipelines, and many other scheduling systems." },
              ].map((item) => (
                <div key={item.q}>
                  <h3 className="text-lg font-semibold text-white mb-2">{item.q}</h3>
                  <p className="text-slate-400">{item.a}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
