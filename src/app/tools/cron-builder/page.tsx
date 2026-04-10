"use client";

import { useState, useCallback, useMemo } from "react";
import JsonLd from "@/components/JsonLd";
import RelatedTools from "@/components/RelatedTools";
import ToolBreadcrumb from "@/components/ToolBreadcrumb";
import {
  generateFAQSchema,
  generateWebAppSchema,
  generateBreadcrumbSchema,
} from "@/lib/jsonld";

type CronMode = "every" | "specific" | "range" | "step";

interface CronField {
  mode: CronMode;
  every: string;
  specific: number[];
  rangeFrom: number;
  rangeTo: number;
  step: number;
}

interface CronState {
  minute: CronField;
  hour: CronField;
  dayOfMonth: CronField;
  month: CronField;
  dayOfWeek: CronField;
}

const PRESETS = [
  { name: "Every minute", cron: "* * * * *" },
  { name: "Every 5 minutes", cron: "*/5 * * * *" },
  { name: "Every hour", cron: "0 * * * *" },
  { name: "Daily midnight", cron: "0 0 * * *" },
  { name: "Daily 9am", cron: "0 9 * * *" },
  { name: "Weekdays 9am", cron: "0 9 * * 1-5" },
  { name: "Every Sunday midnight", cron: "0 0 * * 0" },
  { name: "Monthly 1st midnight", cron: "0 0 1 * *" },
  { name: "Weekly Monday 9am", cron: "0 9 * * 1" },
];

const FIELD_RANGES = {
  minute: { min: 0, max: 59, label: "Minute (0-59)" },
  hour: { min: 0, max: 23, label: "Hour (0-23)" },
  dayOfMonth: { min: 1, max: 31, label: "Day of Month (1-31)" },
  month: { min: 1, max: 12, label: "Month (1-12)" },
  dayOfWeek: { min: 0, max: 6, label: "Day of Week (0-6, 0=Sunday)" },
};

const DEFAULT_CRON: CronState = {
  minute: { mode: "every", every: "*", specific: [], rangeFrom: 0, rangeTo: 59, step: 1 },
  hour: { mode: "every", every: "*", specific: [], rangeFrom: 0, rangeTo: 23, step: 1 },
  dayOfMonth: { mode: "every", every: "*", specific: [], rangeFrom: 1, rangeTo: 31, step: 1 },
  month: { mode: "every", every: "*", specific: [], rangeFrom: 1, rangeTo: 12, step: 1 },
  dayOfWeek: { mode: "every", every: "*", specific: [], rangeFrom: 0, rangeTo: 6, step: 1 },
};

function parseCronExpression(expr: string): CronState {
  const parts = expr.trim().split(/\s+/);
  if (parts.length !== 5) return { ...DEFAULT_CRON };

  const [minute, hour, dayOfMonth, month, dayOfWeek] = parts;

  const parseField = (value: string): CronField => {
    if (value === "*") {
      return { mode: "every", every: "*", specific: [], rangeFrom: 0, rangeTo: 59, step: 1 };
    }
    if (value.startsWith("*/")) {
      const step = parseInt(value.slice(2), 10);
      return { mode: "step", every: "*", specific: [], rangeFrom: 0, rangeTo: 59, step: isNaN(step) ? 1 : step };
    }
    if (value.includes("-")) {
      const [from, to] = value.split("-");
      const rangeFrom = parseInt(from, 10);
      const rangeTo = parseInt(to, 10);
      return { mode: "range", every: "*", specific: [], rangeFrom: isNaN(rangeFrom) ? 0 : rangeFrom, rangeTo: isNaN(rangeTo) ? 59 : rangeTo, step: 1 };
    }
    if (value.includes(",")) {
      const specific = value.split(",").map((v) => parseInt(v, 10)).filter((v) => !isNaN(v));
      return { mode: "specific", every: "*", specific, rangeFrom: 0, rangeTo: 59, step: 1 };
    }
    const num = parseInt(value, 10);
    if (!isNaN(num)) {
      return { mode: "specific", every: "*", specific: [num], rangeFrom: 0, rangeTo: 59, step: 1 };
    }
    return { mode: "every", every: "*", specific: [], rangeFrom: 0, rangeTo: 59, step: 1 };
  };

  return {
    minute: parseField(minute),
    hour: parseField(hour),
    dayOfMonth: parseField(dayOfMonth),
    month: parseField(month),
    dayOfWeek: parseField(dayOfWeek),
  };
}

function buildCronExpression(state: CronState): string {
  const buildField = (field: CronField): string => {
    switch (field.mode) {
      case "every":
        return "*";
      case "specific":
        return field.specific.sort((a, b) => a - b).join(",");
      case "range":
        return `${field.rangeFrom}-${field.rangeTo}`;
      case "step":
        return `*/${field.step}`;
      default:
        return "*";
    }
  };

  return [
    buildField(state.minute),
    buildField(state.hour),
    buildField(state.dayOfMonth),
    buildField(state.month),
    buildField(state.dayOfWeek),
  ].join(" ");
}

function describeCron(state: CronState): string {
  const minute = state.minute;
  const hour = state.hour;
  const dayOfMonth = state.dayOfMonth;
  const month = state.month;
  const dayOfWeek = state.dayOfWeek;

  let parts: string[] = [];

  // Minute
  if (minute.mode === "every") {
    parts.push("every minute");
  } else if (minute.mode === "step") {
    parts.push(`every ${minute.step} minute${minute.step !== 1 ? "s" : ""}`);
  } else if (minute.mode === "specific" && minute.specific.length === 1) {
    parts.push(`at minute ${minute.specific[0]}`);
  } else if (minute.mode === "range") {
    parts.push(`between minutes ${minute.rangeFrom}-${minute.rangeTo}`);
  }

  // Hour
  if (hour.mode === "every") {
    parts.push("of every hour");
  } else if (hour.mode === "step") {
    parts.push(`at every ${hour.step} hour${hour.step !== 1 ? "s" : ""}`);
  } else if (hour.mode === "specific" && hour.specific.length === 1) {
    const h = hour.specific[0];
    const ampm = h >= 12 ? "PM" : "AM";
    const display = h % 12 === 0 ? 12 : h % 12;
    parts.push(`at ${String(display).padStart(2, "0")}:${String(minute.mode === "specific" && minute.specific.length === 1 ? minute.specific[0] : 0).padStart(2, "0")} ${ampm}`);
  } else if (hour.mode === "range") {
    parts.push(`between ${hour.rangeFrom}:00 and ${hour.rangeTo}:59`);
  }

  // Day of week vs day of month
  if (dayOfWeek.mode !== "every" && dayOfMonth.mode !== "every") {
    if (dayOfWeek.mode === "specific" && dayOfWeek.specific.length === 1) {
      const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
      parts.push(`on ${days[dayOfWeek.specific[0]]}`);
    } else if (dayOfWeek.mode === "range") {
      const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
      parts.push(`on ${days[dayOfWeek.rangeFrom]} through ${days[dayOfWeek.rangeTo]}`);
    }
  } else if (dayOfWeek.mode !== "every") {
    if (dayOfWeek.mode === "specific" && dayOfWeek.specific.length === 1) {
      const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
      parts.push(`on ${days[dayOfWeek.specific[0]]}`);
    } else if (dayOfWeek.mode === "range") {
      if (dayOfWeek.rangeFrom === 1 && dayOfWeek.rangeTo === 5) {
        parts.push("on weekdays");
      } else {
        const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
        parts.push(`on ${days[dayOfWeek.rangeFrom]} through ${days[dayOfWeek.rangeTo]}`);
      }
    }
  } else if (dayOfMonth.mode !== "every") {
    if (dayOfMonth.mode === "specific" && dayOfMonth.specific.length === 1) {
      const d = dayOfMonth.specific[0];
      const suffix = d === 1 || d === 21 || d === 31 ? "st" : d === 2 || d === 22 ? "nd" : d === 3 || d === 23 ? "rd" : "th";
      parts.push(`on the ${d}${suffix}`);
    } else if (dayOfMonth.mode === "range") {
      parts.push(`between the ${dayOfMonth.rangeFrom} and ${dayOfMonth.rangeTo}`);
    }
  }

  // Month
  if (month.mode !== "every") {
    const months = ["", "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    if (month.mode === "specific" && month.specific.length === 1) {
      parts.push(`of ${months[month.specific[0]]}`);
    } else if (month.mode === "range") {
      parts.push(`of ${months[month.rangeFrom]} through ${months[month.rangeTo]}`);
    }
  }

  if (parts.length === 0) return "Every minute of every day";
  return "At " + parts.join(" ");
}

function getNextRunTimes(cron: string, count: number = 5): Date[] {
  const parts = cron.trim().split(/\s+/);
  if (parts.length !== 5) return [];

  const [minuteStr, hourStr, dayOfMonthStr, monthStr, dayOfWeekStr] = parts;

  const parseField = (value: string, min: number, max: number): number[] => {
    if (value === "*") return Array.from({ length: max - min + 1 }, (_, i) => min + i);
    if (value.startsWith("*/")) {
      const step = parseInt(value.slice(2), 10);
      const result: number[] = [];
      for (let i = min; i <= max; i += step) result.push(i);
      return result;
    }
    if (value.includes("-")) {
      const [from, to] = value.split("-").map((v) => parseInt(v, 10));
      const result: number[] = [];
      for (let i = from; i <= to; i++) result.push(i);
      return result;
    }
    if (value.includes(",")) return value.split(",").map((v) => parseInt(v, 10)).filter((v) => !isNaN(v));
    const num = parseInt(value, 10);
    return isNaN(num) ? [] : [num];
  };

  const minutes = parseField(minuteStr, 0, 59);
  const hours = parseField(hourStr, 0, 23);
  const daysOfMonth = parseField(dayOfMonthStr, 1, 31);
  const months = parseField(monthStr, 1, 12);
  const daysOfWeek = parseField(dayOfWeekStr, 0, 6);

  const result: Date[] = [];
  const now = new Date();
  let current = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), now.getMinutes(), 0, 0);
  current.setMinutes(current.getMinutes() + 1);
  current.setSeconds(0);

  const maxIterations = 525600;
  let iterations = 0;

  while (result.length < count && iterations < maxIterations) {
    iterations++;

    const m = current.getMonth() + 1;
    const d = current.getDate();
    const dw = current.getDay();
    const min = current.getMinutes();
    const h = current.getHours();

    const matchMonth = months.includes(m);
    const matchDayOfMonth = daysOfMonth.includes(d);
    const matchDayOfWeek = daysOfWeek.includes(dw);
    const matchDayCheck = dayOfMonthStr === "*" && dayOfWeekStr === "*" ? true : dayOfMonthStr === "*" ? matchDayOfWeek : dayOfWeekStr === "*" ? matchDayOfMonth : matchDayOfMonth || matchDayOfWeek;
    const matchHour = hours.includes(h);
    const matchMinute = minutes.includes(min);

    if (matchMonth && matchDayCheck && matchHour && matchMinute) {
      result.push(new Date(current));
    }

    current.setMinutes(current.getMinutes() + 1);
  }

  return result;
}

export default function CronBuilderPage() {
  const [cronInput, setCronInput] = useState("* * * * *");
  const [state, setState] = useState<CronState>(DEFAULT_CRON);
  const [copied, setCopied] = useState(false);

  const cron = useMemo(() => buildCronExpression(state), [state]);

  const handleCronInputChange = useCallback((value: string) => {
    setCronInput(value);
    const newState = parseCronExpression(value);
    setState(newState);
  }, []);

  const handleStateChange = useCallback((field: keyof CronState, newFieldState: CronField) => {
    setState((prev) => ({ ...prev, [field]: newFieldState }));
    setCronInput(buildCronExpression({ ...state, [field]: newFieldState }));
  }, [state]);

  const description = useMemo(() => describeCron(state), [state]);
  const nextRuns = useMemo(() => getNextRunTimes(cron, 5), [cron]);

  const copyCron = useCallback(async () => {
    await navigator.clipboard.writeText(cron);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [cron]);

  const applyPreset = useCallback((preset: (typeof PRESETS)[number]) => {
    setCronInput(preset.cron);
    const newState = parseCronExpression(preset.cron);
    setState(newState);
  }, []);

  const resetCron = useCallback(() => {
    const defaultCron = "* * * * *";
    setCronInput(defaultCron);
    setState(DEFAULT_CRON);
  }, []);

  const FieldSelector = ({ fieldKey, field, range }: { fieldKey: keyof CronState; field: CronField; range: (typeof FIELD_RANGES)[keyof typeof FIELD_RANGES] }) => {
    const values = Array.from({ length: range.max - range.min + 1 }, (_, i) => range.min + i);

    return (
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
        <label className="text-sm font-medium text-slate-300 mb-4 block">{range.label}</label>

        {/* Mode Tabs */}
        <div className="flex gap-2 mb-4 flex-wrap">
          {(["every", "specific", "range", "step"] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => {
                const newField = { ...field, mode };
                if (mode === "every") newField.every = "*";
                else if (mode === "specific") newField.specific = [range.min];
                else if (mode === "range") {
                  newField.rangeFrom = range.min;
                  newField.rangeTo = range.max;
                }
                else if (mode === "step") newField.step = 1;
                handleStateChange(fieldKey, newField);
              }}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                field.mode === mode ? "bg-blue-600 text-white" : "bg-slate-700 hover:bg-slate-600 text-slate-200"
              }`}
            >
              {mode.charAt(0).toUpperCase() + mode.slice(1)}
            </button>
          ))}
        </div>

        {/* Mode-specific UI */}
        {field.mode === "every" && <p className="text-slate-400 text-sm">* (every value)</p>}

        {field.mode === "specific" && (
          <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
            {values.map((v) => (
              <button
                key={v}
                onClick={() => {
                  const newSpecific = field.specific.includes(v) ? field.specific.filter((x) => x !== v) : [...field.specific, v];
                  handleStateChange(fieldKey, { ...field, specific: newSpecific });
                }}
                className={`px-2 py-1 rounded text-sm font-medium transition-colors ${
                  field.specific.includes(v) ? "bg-blue-600 text-white" : "bg-slate-700 hover:bg-slate-600 text-slate-200"
                }`}
              >
                {v}
              </button>
            ))}
          </div>
        )}

        {field.mode === "range" && (
          <div className="flex gap-4 items-end">
            <div>
              <label className="text-xs text-slate-400 block mb-1">From</label>
              <input
                type="number"
                min={range.min}
                max={range.max}
                value={field.rangeFrom}
                onChange={(e) => handleStateChange(fieldKey, { ...field, rangeFrom: parseInt(e.target.value, 10) })}
                className="bg-slate-700 border border-slate-600 text-white rounded px-2 py-1 w-16"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">To</label>
              <input
                type="number"
                min={range.min}
                max={range.max}
                value={field.rangeTo}
                onChange={(e) => handleStateChange(fieldKey, { ...field, rangeTo: parseInt(e.target.value, 10) })}
                className="bg-slate-700 border border-slate-600 text-white rounded px-2 py-1 w-16"
              />
            </div>
          </div>
        )}

        {field.mode === "step" && (
          <div>
            <label className="text-xs text-slate-400 block mb-1">Every N units</label>
            <input
              type="number"
              min="1"
              max={range.max}
              value={field.step}
              onChange={(e) => handleStateChange(fieldKey, { ...field, step: Math.max(1, parseInt(e.target.value, 10)) })}
              className="bg-slate-700 border border-slate-600 text-white rounded px-2 py-1 w-20"
            />
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <title>Cron Expression Generator - Free Online Tool | DevTools Hub</title>
      <meta
        name="description"
        content="Free online cron expression generator. Visually build cron schedules with minute/hour/day/month/weekday selectors. See human-readable description and next 5 run times instantly."
      />
      <JsonLd
        data={[
          generateWebAppSchema({
            slug: "cron-builder",
            name: "Cron Expression Generator",
            description: "Visually build cron schedules with minute/hour/day/month/weekday selectors. See human-readable description and next 5 run times.",
            category: "developer",
          }),
          generateBreadcrumbSchema({
            slug: "cron-builder",
            name: "Cron Expression Generator",
            description: "Visually build cron schedules with minute/hour/day/month/weekday selectors. See human-readable description and next 5 run times.",
            category: "developer",
          }),
          generateFAQSchema([
            { question: "What is a cron expression?", answer: "A cron expression is a time-based job scheduler format used in Unix/Linux. It consists of 5 fields: minute (0-59), hour (0-23), day of month (1-31), month (1-12), and day of week (0-6). Each field can be a specific value, a range, a step value, or a wildcard (*). For example, '0 9 * * 1-5' runs at 9:00 AM on weekdays." },
            { question: "What does * mean in cron?", answer: "The asterisk (*) is a wildcard that means 'any' or 'every'. It matches all valid values in that field. For example, '* * * * *' means every minute of every hour of every day of every month on every day of the week." },
            { question: "How do I run a job every 5 minutes?", answer: "Use the step syntax: */5 in the minute field. For example, '*/5 * * * *' runs every 5 minutes. You can use this syntax in any field: */10 for every 10 hours, */2 for every 2 days, etc." },
            { question: "What is the difference between day of month and day of week?", answer: "Day of month (field 3) specifies a calendar date (1-31), while day of week (field 5) specifies a day by name (0=Sunday through 6=Saturday). If you specify both, the job runs when EITHER condition matches. To avoid conflicts, set one field to * and the other to your desired value." },
            { question: "How do I schedule a job on weekdays only?", answer: "Use '1-5' for the day of week field. For example, '0 9 * * 1-5' runs at 9:00 AM Monday through Friday. The values 1-5 represent Monday through Friday (0=Sunday, 6=Saturday)." },
          ]),
        ]}
      />

      <div className="min-h-screen bg-slate-900 text-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <ToolBreadcrumb slug="cron-builder" />

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">Cron Expression Generator</h1>
            <p className="text-slate-400 max-w-2xl text-lg">Visually build cron schedules with intuitive controls. Define minute, hour, day, month, and weekday patterns. See the next 5 run times instantly.</p>
          </div>

          {/* Cron Expression Display */}
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 mb-8">
            <label className="text-sm font-medium text-slate-300 block mb-2">Cron Expression</label>
            <div className="flex gap-2 flex-col sm:flex-row">
              <input
                type="text"
                value={cronInput}
                onChange={(e) => handleCronInputChange(e.target.value)}
                className="flex-1 bg-slate-950 border border-slate-600 text-white rounded px-4 py-3 font-mono text-lg focus:outline-none focus:border-blue-500"
                placeholder="* * * * *"
              />
              <button
                onClick={copyCron}
                className="px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                {copied ? "Copied!" : "Copy"}
              </button>
              <button
                onClick={resetCron}
                className="px-4 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors"
              >
                Reset
              </button>
            </div>
          </div>

          {/* Description */}
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 mb-8">
            <label className="text-sm font-medium text-slate-300 block mb-2">Description</label>
            <p className="text-slate-300 text-lg">{description}</p>
          </div>

          {/* Presets */}
          <div className="mb-8">
            <label className="text-sm font-medium text-slate-300 block mb-3">Common Presets</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {PRESETS.map((preset) => (
                <button
                  key={preset.cron}
                  onClick={() => applyPreset(preset)}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors text-sm text-left"
                >
                  {preset.name}
                </button>
              ))}
            </div>
          </div>

          {/* Field Selectors */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <FieldSelector fieldKey="minute" field={state.minute} range={FIELD_RANGES.minute} />
            <FieldSelector fieldKey="hour" field={state.hour} range={FIELD_RANGES.hour} />
            <FieldSelector fieldKey="dayOfMonth" field={state.dayOfMonth} range={FIELD_RANGES.dayOfMonth} />
            <FieldSelector fieldKey="month" field={state.month} range={FIELD_RANGES.month} />
          </div>

          {/* Day of Week - Full Width */}
          <div className="mb-8">
            <FieldSelector fieldKey="dayOfWeek" field={state.dayOfWeek} range={FIELD_RANGES.dayOfWeek} />
          </div>

          {/* Next Run Times */}
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 mb-8">
            <h2 className="text-lg font-semibold text-white mb-4">Next 5 Run Times</h2>
            {nextRuns.length > 0 ? (
              <ul className="space-y-2">
                {nextRuns.map((date, idx) => (
                  <li key={idx} className="text-slate-300 font-mono">
                    {date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })} at{" "}
                    {date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true })}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-slate-400">Invalid cron expression</p>
            )}
          </div>

          {/* FAQ Section */}
          <section className="bg-slate-800 border border-slate-700 rounded-lg p-6">
            <h2 className="text-xl font-bold text-white mb-6">Frequently Asked Questions</h2>
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">What is a cron expression?</h3>
                <p className="text-slate-400">
                  A cron expression is a time-based job scheduler format used in Unix/Linux systems. It consists of 5 fields representing minute, hour, day of month, month, and day of week. Each field can contain a specific value, a range, a step value, or a wildcard (*) to mean &quot;every.&quot; For example, &apos;0 9 * * 1-5&apos; means 9:00 AM on weekdays.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">What does * mean in cron?</h3>
                <p className="text-slate-400">
                  The asterisk (*) is a wildcard that means &quot;any&quot; or &quot;every.&quot; It matches all valid values in that field. &apos;* * * * *&apos; means every minute of every hour of every day of every month on every day of the week — essentially, every single minute of the year.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">How do I run a job every 5 minutes?</h3>
                <p className="text-slate-400">
                  Use the step syntax with an asterisk and a divisor: */5 in the minute field. For example, &apos;*/5 * * * *&apos; runs every 5 minutes. You can apply the same syntax to any field: */10 for every 10 hours, */2 for every 2 days, or */3 for every 3 months.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">What is the difference between day of month and day of week?</h3>
                <p className="text-slate-400">
                  Day of month (field 3) specifies a calendar date from 1 to 31, while day of week (field 5) specifies a day by name: 0 = Sunday, 1 = Monday, ..., 6 = Saturday. If you specify both fields (neither is *), the job runs when EITHER condition matches. To avoid conflicts, set one to * and the other to your desired value.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">How do I schedule a job on weekdays only?</h3>
                <p className="text-slate-400">
                  Use 1-5 for the day of week field to specify Monday through Friday. For example, &apos;0 9 * * 1-5&apos; runs at 9:00 AM Monday through Friday. Remember that 0 = Sunday and 6 = Saturday, so 1-5 covers all weekdays.
                </p>
              </div>
            </div>
          </section>

          <div className="mt-12">
            <RelatedTools currentSlug="cron-builder" />
          </div>
        </div>
      </div>
    </>
  );
}
