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

type FieldMode = "every" | "specific" | "range" | "step";
type CronMode = "5-field" | "6-field";

interface FieldState {
  mode: FieldMode;
  specific: number[];
  rangeStart: number;
  rangeEnd: number;
  stepStart: number;
  stepInterval: number;
}

const defaultField = (min: number, max: number): FieldState => ({
  mode: "every",
  specific: [min],
  rangeStart: min,
  rangeEnd: max,
  stepStart: min,
  stepInterval: 1,
});

// ── Cron field → string ────────────────────────────────────────────────
const fieldToString = (f: FieldState): string => {
  switch (f.mode) {
    case "every":
      return "*";
    case "specific":
      return f.specific.length > 0 ? f.specific.sort((a, b) => a - b).join(",") : "*";
    case "range":
      return `${f.rangeStart}-${f.rangeEnd}`;
    case "step":
      return f.stepStart === 0 || f.stepStart === 1
        ? `*/${f.stepInterval}`
        : `${f.stepStart}/${f.stepInterval}`;
  }
};

// ── Parse cron string back into field states ───────────────────────────
const parseField = (raw: string, min: number, max: number): FieldState => {
  const s = raw.trim();
  if (s === "*") return defaultField(min, max);

  const stepMatch = s.match(/^(\*|(\d+))\/(\d+)$/);
  if (stepMatch) {
    const start = stepMatch[1] === "*" ? min : parseInt(stepMatch[2], 10);
    return { mode: "step", specific: [min], rangeStart: min, rangeEnd: max, stepStart: start, stepInterval: parseInt(stepMatch[3], 10) };
  }

  const rangeMatch = s.match(/^(\d+)-(\d+)$/);
  if (rangeMatch) {
    return { mode: "range", specific: [min], rangeStart: parseInt(rangeMatch[1], 10), rangeEnd: parseInt(rangeMatch[2], 10), stepStart: min, stepInterval: 1 };
  }

  const parts = s.split(",").map((p) => parseInt(p.trim(), 10)).filter((n) => !isNaN(n) && n >= min && n <= max);
  if (parts.length > 0) {
    return { mode: "specific", specific: parts, rangeStart: min, rangeEnd: max, stepStart: min, stepInterval: 1 };
  }

  return defaultField(min, max);
};

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

// ── Human-readable description ─────────────────────────────────────────
const describeCron = (expr: string, mode: CronMode): string => {
  const parts = expr.trim().split(/\s+/);
  const expectedFields = mode === "6-field" ? 6 : 5;
  if (parts.length !== expectedFields) return `Invalid: expected ${expectedFields} fields, got ${parts.length}`;

  const offset = mode === "6-field" ? 1 : 0;
  const seconds = mode === "6-field" ? expandField(parts[0], 0, 59) : null;
  const minutes = expandField(parts[offset], 0, 59);
  const hours = expandField(parts[offset + 1], 0, 23);
  const doms = expandField(parts[offset + 2], 1, 31);
  const months = expandField(parts[offset + 3], 1, 12, SHORT_MONTHS);
  const dows = expandField(parts[offset + 4], 0, 6, SHORT_DAYS);

  const desc: string[] = [];

  // Seconds part (6-field only)
  if (seconds) {
    if (seconds.length === 60) {
      desc.push("Every second");
    } else if (seconds.length === 1) {
      if (seconds[0] !== 0) desc.push(`At second ${seconds[0]}`);
    } else {
      const step = detectStep(seconds);
      desc.push(step ? `Every ${step} seconds` : `At seconds ${seconds.join(", ")}`);
    }
  }

  // Time part
  if (minutes.length === 60 && hours.length === 24) {
    if (!seconds || seconds.length === 60) desc.push("Every minute");
  } else if (minutes.length === 60) {
    desc.push(`Every minute past hour${hours.length > 1 ? "s" : ""} ${hours.join(", ")}`);
  } else if (minutes.length === 1 && hours.length === 1) {
    desc.push(`At ${String(hours[0]).padStart(2, "0")}:${String(minutes[0]).padStart(2, "0")}`);
  } else if (minutes.length === 1 && hours.length === 24) {
    desc.push(`At minute ${minutes[0]} of every hour`);
  } else {
    const minPart = minutes.length <= 5 ? `minute${minutes.length > 1 ? "s" : ""} ${minutes.join(", ")}` : `every ${detectStep(minutes) || minutes.length} minutes`;
    const hourPart = hours.length === 24 ? "every hour" : hours.length <= 5 ? `hour${hours.length > 1 ? "s" : ""} ${hours.join(", ")}` : `every ${detectStep(hours) || hours.length} hours`;
    desc.push(`At ${minPart} past ${hourPart}`);
  }

  // Day of month
  if (doms.length < 31 && parts[offset + 2] !== "*") {
    desc.push(`on day${doms.length > 1 ? "s" : ""} ${doms.join(", ")} of the month`);
  }

  // Month
  if (months.length < 12) {
    desc.push(`in ${months.map((m) => MONTHS[m]).join(", ")}`);
  }

  // Day of week
  if (dows.length < 7 && parts[offset + 4] !== "*") {
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
const calculateNextRuns = (expr: string, count: number, mode: CronMode): string[] => {
  const parts = expr.trim().split(/\s+/);
  const expectedFields = mode === "6-field" ? 6 : 5;
  if (parts.length !== expectedFields) return [];

  const offset = mode === "6-field" ? 1 : 0;
  const secondsList = mode === "6-field" ? expandField(parts[0], 0, 59) : [0];
  const minutes = expandField(parts[offset], 0, 59);
  const hours = expandField(parts[offset + 1], 0, 23);
  const doms = expandField(parts[offset + 2], 1, 31);
  const monthsList = expandField(parts[offset + 3], 1, 12, SHORT_MONTHS);
  const dows = expandField(parts[offset + 4], 0, 6, SHORT_DAYS);
  const domWild = parts[offset + 2] === "*";
  const dowWild = parts[offset + 4] === "*";

  const results: string[] = [];
  const candidate = new Date();
  candidate.setMilliseconds(0);
  if (mode === "6-field") {
    candidate.setSeconds(candidate.getSeconds() + 1);
  } else {
    candidate.setSeconds(0);
    candidate.setMinutes(candidate.getMinutes() + 1);
  }

  let safety = 0;
  const maxIter = mode === "6-field" ? 31536000 : 525600;
  while (results.length < count && safety < maxIter) {
    safety++;
    const s = candidate.getSeconds();
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
      candidate.setSeconds(0);
      continue;
    }

    const domMatch = domWild || doms.includes(dom);
    const dowMatch = dowWild || dows.includes(dow);
    const dayMatch = (domWild && dowWild) || (!domWild && !dowWild) ? (domMatch && dowMatch) : (domMatch || dowMatch);

    if (!dayMatch) {
      candidate.setDate(candidate.getDate() + 1);
      candidate.setHours(0);
      candidate.setMinutes(0);
      candidate.setSeconds(0);
      continue;
    }

    if (!hours.includes(h)) {
      candidate.setHours(candidate.getHours() + 1);
      candidate.setMinutes(0);
      candidate.setSeconds(0);
      continue;
    }

    if (!minutes.includes(m)) {
      candidate.setMinutes(candidate.getMinutes() + 1);
      candidate.setSeconds(0);
      continue;
    }

    if (mode === "6-field" && !secondsList.includes(s)) {
      candidate.setSeconds(candidate.getSeconds() + 1);
      continue;
    }

    const formatOpts: Intl.DateTimeFormatOptions = {
      weekday: "short", year: "numeric", month: "short", day: "numeric",
      hour: "2-digit", minute: "2-digit", hour12: false,
    };
    if (mode === "6-field") {
      formatOpts.second = "2-digit";
    }
    results.push(candidate.toLocaleString("en-US", formatOpts));

    if (mode === "6-field") {
      candidate.setSeconds(candidate.getSeconds() + 1);
    } else {
      candidate.setMinutes(candidate.getMinutes() + 1);
    }
  }

  return results;
};

// ── Presets ─────────────────────────────────────────────────────────────
const PRESETS_5: { label: string; cron: string }[] = [
  { label: "Every minute", cron: "* * * * *" },
  { label: "Every 5 minutes", cron: "*/5 * * * *" },
  { label: "Every 15 minutes", cron: "*/15 * * * *" },
  { label: "Every 30 minutes", cron: "*/30 * * * *" },
  { label: "Every hour", cron: "0 * * * *" },
  { label: "Every 6 hours", cron: "0 */6 * * *" },
  { label: "Daily at midnight", cron: "0 0 * * *" },
  { label: "Daily at noon", cron: "0 12 * * *" },
  { label: "Weekdays at 8 AM", cron: "0 8 * * 1-5" },
  { label: "Weekly (Mon 9 AM)", cron: "0 9 * * 1" },
  { label: "Sunday 3 AM", cron: "0 3 * * 0" },
  { label: "1st of month", cron: "0 0 1 * *" },
  { label: "Quarterly", cron: "0 0 1 1,4,7,10 *" },
  { label: "Yearly (Jan 1st)", cron: "0 0 1 1 *" },
];

const PRESETS_6: { label: string; cron: string }[] = [
  { label: "Every second", cron: "* * * * * *" },
  { label: "Every 5 seconds", cron: "*/5 * * * * *" },
  { label: "Every 10 seconds", cron: "*/10 * * * * *" },
  { label: "Every 30 seconds", cron: "*/30 * * * * *" },
  { label: "Top of every minute", cron: "0 * * * * *" },
  { label: "Every hour on the hour", cron: "0 0 * * * *" },
  { label: "Daily at midnight", cron: "0 0 0 * * *" },
  { label: "Weekdays at 8 AM", cron: "0 0 8 * * 1-5" },
];

// ── FieldEditor component ──────────────────────────────────────────────
function FieldEditor({
  label, min, max, state, onChange, nameMap,
}: {
  label: string;
  min: number;
  max: number;
  state: FieldState;
  onChange: (s: FieldState) => void;
  nameMap?: string[];
}) {
  const toggleSpecific = (val: number) => {
    const next = state.specific.includes(val)
      ? state.specific.filter((v) => v !== val)
      : [...state.specific, val];
    onChange({ ...state, specific: next.length > 0 ? next : [min] });
  };

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-white">{label}</h3>
        <select
          value={state.mode}
          onChange={(e) => onChange({ ...state, mode: e.target.value as FieldMode })}
          className="bg-slate-700 border border-slate-600 text-white rounded px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="every">Every (*)</option>
          <option value="specific">Specific values</option>
          <option value="range">Range (a-b)</option>
          <option value="step">Step (*/n)</option>
        </select>
      </div>

      {state.mode === "specific" && (
        <div className="flex flex-wrap gap-1">
          {Array.from({ length: max - min + 1 }, (_, i) => min + i).map((val) => (
            <button
              key={val}
              onClick={() => toggleSpecific(val)}
              className={`px-2 py-1 rounded text-xs font-mono transition-colors ${
                state.specific.includes(val)
                  ? "bg-blue-600 text-white"
                  : "bg-slate-700 text-slate-400 hover:bg-slate-600"
              }`}
            >
              {nameMap ? nameMap[val] : val}
            </button>
          ))}
        </div>
      )}

      {state.mode === "range" && (
        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-400">From</label>
          <select
            value={state.rangeStart}
            onChange={(e) => onChange({ ...state, rangeStart: parseInt(e.target.value, 10) })}
            className="bg-slate-700 border border-slate-600 text-white rounded px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {Array.from({ length: max - min + 1 }, (_, i) => min + i).map((v) => (
              <option key={v} value={v}>{nameMap ? nameMap[v] : v}</option>
            ))}
          </select>
          <label className="text-xs text-slate-400">to</label>
          <select
            value={state.rangeEnd}
            onChange={(e) => onChange({ ...state, rangeEnd: parseInt(e.target.value, 10) })}
            className="bg-slate-700 border border-slate-600 text-white rounded px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {Array.from({ length: max - min + 1 }, (_, i) => min + i).map((v) => (
              <option key={v} value={v}>{nameMap ? nameMap[v] : v}</option>
            ))}
          </select>
        </div>
      )}

      {state.mode === "step" && (
        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-400">Every</label>
          <input
            type="number"
            min={1}
            max={max}
            value={state.stepInterval}
            onChange={(e) => onChange({ ...state, stepInterval: Math.max(1, parseInt(e.target.value, 10) || 1) })}
            className="w-16 bg-slate-700 border border-slate-600 text-white rounded px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <label className="text-xs text-slate-400">starting at</label>
          <select
            value={state.stepStart}
            onChange={(e) => onChange({ ...state, stepStart: parseInt(e.target.value, 10) })}
            className="bg-slate-700 border border-slate-600 text-white rounded px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {Array.from({ length: max - min + 1 }, (_, i) => min + i).map((v) => (
              <option key={v} value={v}>{nameMap ? nameMap[v] : v}</option>
            ))}
          </select>
        </div>
      )}

      {state.mode === "every" && (
        <p className="text-xs text-slate-500">Matches every {label.toLowerCase()}</p>
      )}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────
export default function CronExpressionGenerator() {
  const [cronMode, setCronMode] = useState<CronMode>("5-field");
  const [second, setSecond] = useState<FieldState>(defaultField(0, 59));
  const [minute, setMinute] = useState<FieldState>(defaultField(0, 59));
  const [hour, setHour] = useState<FieldState>(defaultField(0, 23));
  const [dayOfMonth, setDayOfMonth] = useState<FieldState>(defaultField(1, 31));
  const [month, setMonth] = useState<FieldState>(defaultField(1, 12));
  const [dayOfWeek, setDayOfWeek] = useState<FieldState>(defaultField(0, 6));
  const [reverseInput, setReverseInput] = useState("");
  const [reverseResult, setReverseResult] = useState<{ description: string; nextRuns: string[] } | null>(null);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"build" | "reverse">("build");

  const expression = cronMode === "6-field"
    ? `${fieldToString(second)} ${fieldToString(minute)} ${fieldToString(hour)} ${fieldToString(dayOfMonth)} ${fieldToString(month)} ${fieldToString(dayOfWeek)}`
    : `${fieldToString(minute)} ${fieldToString(hour)} ${fieldToString(dayOfMonth)} ${fieldToString(month)} ${fieldToString(dayOfWeek)}`;

  const description = describeCron(expression, cronMode);
  const nextRuns = calculateNextRuns(expression, 10, cronMode);

  const copyExpression = useCallback(async () => {
    await navigator.clipboard.writeText(expression);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [expression]);

  const applyPreset = useCallback((cron: string) => {
    const parts = cron.split(/\s+/);
    if (cronMode === "6-field" && parts.length === 6) {
      setSecond(parseField(parts[0], 0, 59));
      setMinute(parseField(parts[1], 0, 59));
      setHour(parseField(parts[2], 0, 23));
      setDayOfMonth(parseField(parts[3], 1, 31));
      setMonth(parseField(parts[4], 1, 12));
      setDayOfWeek(parseField(parts[5], 0, 6));
    } else if (cronMode === "5-field" && parts.length === 5) {
      setMinute(parseField(parts[0], 0, 59));
      setHour(parseField(parts[1], 0, 23));
      setDayOfMonth(parseField(parts[2], 1, 31));
      setMonth(parseField(parts[3], 1, 12));
      setDayOfWeek(parseField(parts[4], 0, 6));
    }
  }, [cronMode]);

  // Auto-parse reverse input
  useEffect(() => {
    const trimmed = reverseInput.trim();
    if (!trimmed) {
      setReverseResult(null);
      return;
    }
    const parts = trimmed.split(/\s+/);
    if (parts.length === 5 || parts.length === 6) {
      const detectedMode: CronMode = parts.length === 6 ? "6-field" : "5-field";
      setReverseResult({
        description: describeCron(trimmed, detectedMode),
        nextRuns: calculateNextRuns(trimmed, 10, detectedMode),
      });
    } else {
      setReverseResult({ description: `Invalid: expected 5 or 6 fields, got ${parts.length}`, nextRuns: [] });
    }
  }, [reverseInput]);

  const presets = cronMode === "6-field" ? PRESETS_6 : PRESETS_5;

  const monthNames: string[] = [];
  for (let i = 0; i <= 12; i++) monthNames[i] = i === 0 ? "" : MONTHS[i].slice(0, 3);

  return (
    <>
      <title>Cron Expression Generator - Build Cron Schedules Visually | DevTools</title>
      <meta
        name="description"
        content="Free cron expression generator and crontab guru alternative. Build cron schedules visually with dropdowns, preset templates, human-readable descriptions, and next 10 run times. Supports 5-field standard and 6-field (with seconds) cron syntax."
      />
      <meta
        name="keywords"
        content="cron expression generator, crontab guru, cron schedule maker, cron builder, cron job generator, crontab maker, visual cron editor, crontab generator, cron syntax, cron with seconds"
      />
      <JsonLd
        data={[
          generateWebAppSchema({
            slug: "cron-expression-generator",
            name: "Cron Expression Generator",
            description: "Free cron expression generator and crontab guru alternative. Build cron schedules visually with next 10 run times preview.",
            category: "developer",
          }),
          generateBreadcrumbSchema({
            slug: "cron-expression-generator",
            name: "Cron Expression Generator",
            description: "Free cron expression generator and crontab guru alternative. Build cron schedules visually with next 10 run times preview.",
            category: "developer",
          }),
          generateFAQSchema([
            { question: "What is a cron expression?", answer: "A cron expression is a string of 5 fields (minute, hour, day-of-month, month, day-of-week) that defines a recurring schedule used by Unix cron, CI/CD pipelines, Kubernetes CronJobs, and cloud schedulers like AWS EventBridge." },
            { question: "How do I build a cron expression?", answer: "Use the visual editor above to select values for each field — minute (0-59), hour (0-23), day of month (1-31), month (1-12), and day of week (0-6). Choose from 'every', 'specific values', 'range', or 'step' modes for each field." },
            { question: "What does */5 mean in a cron expression?", answer: "*/5 means 'every 5th value'. In the minute field, */5 runs at 0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55 — effectively every 5 minutes." },
            { question: "What is the difference between 5-field and 6-field cron?", answer: "Standard 5-field cron uses minute, hour, day-of-month, month, and day-of-week. The 6-field variant adds a seconds field at the beginning, used by systems like Spring Scheduler, Quartz, and some cloud platforms that need sub-minute precision." },
            { question: "Where are cron expressions used?", answer: "Cron expressions are used in Unix/Linux crontab, GitHub Actions, AWS EventBridge/CloudWatch, Kubernetes CronJobs, Vercel Cron, Google Cloud Scheduler, Jenkins, Spring Scheduler, Quartz, and many task scheduling systems." },
          ]),
        ]}
      />

      <div className="min-h-screen bg-slate-900 text-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <ToolBreadcrumb slug="cron-expression-generator" />

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
              Cron Expression Generator
            </h1>
            <p className="text-slate-400 max-w-2xl text-lg">
              Build cron schedule expressions visually. Select values with dropdowns, use preset templates, see human-readable descriptions and next 10 run times. Supports both standard 5-field and 6-field (with seconds) cron syntax.
            </p>
          </div>

          <AdUnit slot="TOP_SLOT" format="horizontal" className="mb-6" />

          {/* Tab switcher */}
          <div className="flex items-center gap-2 mb-6 flex-wrap">
            <button
              onClick={() => setActiveTab("build")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === "build" ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-400 hover:bg-slate-700"
              }`}
            >
              Visual Builder
            </button>
            <button
              onClick={() => setActiveTab("reverse")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === "reverse" ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-400 hover:bg-slate-700"
              }`}
            >
              Reverse Parser
            </button>

            <div className="ml-auto flex items-center gap-2">
              <span className="text-xs text-slate-500">Format:</span>
              <button
                onClick={() => setCronMode("5-field")}
                className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                  cronMode === "5-field" ? "bg-green-600 text-white" : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                }`}
              >
                5-field (standard)
              </button>
              <button
                onClick={() => setCronMode("6-field")}
                className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                  cronMode === "6-field" ? "bg-green-600 text-white" : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                }`}
              >
                6-field (with seconds)
              </button>
            </div>
          </div>

          {activeTab === "build" && (
            <>
              {/* Generated expression display */}
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 mb-6">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-sm font-medium text-slate-400">Generated Expression</h2>
                  <button
                    onClick={copyExpression}
                    className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    {copied ? "Copied!" : "Copy"}
                  </button>
                </div>
                <code className="block text-2xl font-mono text-blue-400 tracking-widest text-center py-3">
                  {expression}
                </code>
                <p className="text-center text-slate-300 mt-2">{description}</p>

                {/* Field labels */}
                <div className="flex justify-center mt-3 gap-0">
                  {cronMode === "6-field" && (
                    <span className="text-[10px] text-slate-500 text-center" style={{ width: `${100 / 6}%` }}>second</span>
                  )}
                  {["minute", "hour", "day(mo)", "month", "day(wk)"].map((label) => (
                    <span key={label} className="text-[10px] text-slate-500 text-center" style={{ width: `${100 / (cronMode === "6-field" ? 6 : 5)}%` }}>
                      {label}
                    </span>
                  ))}
                </div>
              </div>

              {/* Preset templates */}
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 mb-6">
                <h2 className="text-sm font-medium text-slate-400 mb-3">Preset Templates</h2>
                <div className="flex flex-wrap gap-2">
                  {presets.map((preset) => (
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

              {/* Visual field editors */}
              <div className="space-y-4 mb-6">
                {cronMode === "6-field" && (
                  <FieldEditor label="Second" min={0} max={59} state={second} onChange={setSecond} />
                )}
                <FieldEditor label="Minute" min={0} max={59} state={minute} onChange={setMinute} />
                <FieldEditor label="Hour" min={0} max={23} state={hour} onChange={setHour} />
                <FieldEditor label="Day of Month" min={1} max={31} state={dayOfMonth} onChange={setDayOfMonth} />
                <FieldEditor label="Month" min={1} max={12} state={month} onChange={setMonth} nameMap={monthNames} />
                <FieldEditor label="Day of Week" min={0} max={6} state={dayOfWeek} onChange={setDayOfWeek} nameMap={DAYS_OF_WEEK} />
              </div>

              {/* Next 10 runs */}
              {nextRuns.length > 0 && (
                <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 mb-6">
                  <h2 className="text-sm font-medium text-slate-400 mb-3">Next 10 Scheduled Runs</h2>
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

              {/* Syntax reference */}
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 mb-6">
                <h2 className="text-lg font-semibold text-white mb-4">Cron Syntax Reference</h2>
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
                        ...(cronMode === "6-field" ? [["Second", "0-59", "* , - /"]] : []),
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
            </>
          )}

          {activeTab === "reverse" && (
            <>
              {/* Reverse parser */}
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 mb-6">
                <h2 className="text-lg font-semibold text-white mb-3">Paste a Cron Expression</h2>
                <p className="text-sm text-slate-400 mb-3">
                  Paste any 5-field or 6-field cron expression. The format is auto-detected.
                </p>
                <input
                  type="text"
                  value={reverseInput}
                  onChange={(e) => setReverseInput(e.target.value)}
                  placeholder="e.g. */15 9-17 * * 1-5  or  0 */5 * * * *"
                  className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-3 font-mono text-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 tracking-widest text-center"
                  spellCheck={false}
                />
              </div>

              {reverseResult && (
                <>
                  <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 mb-6">
                    <h2 className="text-sm font-medium text-slate-400 mb-2">Schedule Description</h2>
                    <p className="text-xl font-medium text-white">{reverseResult.description}</p>
                  </div>

                  {reverseResult.nextRuns.length > 0 && (
                    <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 mb-6">
                      <h2 className="text-sm font-medium text-slate-400 mb-3">Next 10 Scheduled Runs</h2>
                      <div className="space-y-1">
                        {reverseResult.nextRuns.map((run, i) => (
                          <div key={i} className="flex items-center gap-3 text-sm">
                            <span className="text-slate-500 w-6 text-right">{i + 1}.</span>
                            <span className="font-mono text-slate-200">{run}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </>
          )}

          <AdUnit slot="BOTTOM_SLOT" format="auto" className="mb-6" />

          <RelatedTools currentSlug="cron-expression-generator" />

          {/* FAQ */}
          <section className="mt-16 border-t border-slate-700 pt-10">
            <h2 className="text-2xl font-bold text-white mb-6">Frequently Asked Questions</h2>
            <div className="space-y-6">
              {[
                { q: "What is a cron expression?", a: "A cron expression is a string of 5 fields (minute, hour, day-of-month, month, day-of-week) that defines a recurring schedule used by Unix cron, CI/CD pipelines, Kubernetes CronJobs, and cloud schedulers like AWS EventBridge." },
                { q: "How do I build a cron expression?", a: "Use the visual editor to select values for each field. Choose from 'every', 'specific values', 'range', or 'step' modes for each field. The generated expression updates in real time." },
                { q: "What does */5 mean in a cron expression?", a: "*/5 means 'every 5th value'. In the minute field, */5 runs at minutes 0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55 \u2014 effectively every 5 minutes." },
                { q: "What is the difference between 5-field and 6-field cron?", a: "Standard 5-field cron uses minute, hour, day-of-month, month, and day-of-week. The 6-field variant adds a seconds field at the beginning, used by systems like Spring Scheduler, Quartz, and some cloud platforms that need sub-minute precision." },
                { q: "Where are cron expressions used?", a: "Cron expressions are used in Unix/Linux crontab, GitHub Actions, AWS EventBridge/CloudWatch, Kubernetes CronJobs, Vercel Cron, Google Cloud Scheduler, Jenkins, Spring Scheduler, Quartz, and many task scheduling systems." },
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
