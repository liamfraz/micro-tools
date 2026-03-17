"use client";

import { useState, useCallback, useEffect } from "react";
import JsonLd from "@/components/JsonLd";
import RelatedTools from "@/components/RelatedTools";
import {
  generateFAQSchema,
  generateWebAppSchema,
  generateBreadcrumbSchema,
} from "@/lib/jsonld";

// Cron field definitions
const MONTHS = ["", "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const DAYS_OF_WEEK = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const SHORT_MONTHS = ["", "JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
const SHORT_DAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

interface CronField {
  label: string;
  min: number;
  max: number;
  allowed: number[];
}

const parseField = (field: string, min: number, max: number, names?: string[]): number[] => {
  // Replace named values (JAN-DEC, SUN-SAT)
  let f = field.toUpperCase();
  if (names) {
    for (let i = 0; i < names.length; i++) {
      if (names[i]) {
        f = f.replace(new RegExp(names[i], "g"), String(i));
      }
    }
  }

  const values = new Set<number>();

  const parts = f.split(",");
  for (const part of parts) {
    // Handle step: */n or range/n
    const stepMatch = part.match(/^(.+)\/(\d+)$/);
    let range = stepMatch ? stepMatch[1] : part;
    const step = stepMatch ? parseInt(stepMatch[2], 10) : 1;

    if (range === "*") {
      for (let i = min; i <= max; i += step) values.add(i);
      continue;
    }

    // Handle range: a-b
    const rangeMatch = range.match(/^(\d+)-(\d+)$/);
    if (rangeMatch) {
      const start = parseInt(rangeMatch[1], 10);
      const end = parseInt(rangeMatch[2], 10);
      for (let i = start; i <= end; i += step) {
        if (i >= min && i <= max) values.add(i);
      }
      continue;
    }

    // Single value
    const val = parseInt(range, 10);
    if (!isNaN(val) && val >= min && val <= max) {
      values.add(val);
    }
  }

  return Array.from(values).sort((a, b) => a - b);
};

const describeField = (values: number[], min: number, max: number, unit: string, nameMap?: string[]): string => {
  if (values.length === 0) return `no ${unit}s`;
  if (values.length === max - min + 1) return `every ${unit}`;

  const names = values.map((v) => nameMap ? nameMap[v] : String(v));

  // Check for step pattern
  if (values.length > 2) {
    const diffs = new Set<number>();
    for (let i = 1; i < values.length; i++) {
      diffs.add(values[i] - values[i - 1]);
    }
    if (diffs.size === 1) {
      const step = Array.from(diffs)[0];
      if (values[0] === min) {
        return `every ${step} ${unit}s`;
      }
      return `every ${step} ${unit}s starting at ${nameMap ? nameMap[values[0]] : values[0]}`;
    }
  }

  if (values.length === 1) {
    return `at ${unit} ${names[0]}`;
  }

  if (values.length <= 5) {
    return `at ${unit}s ${names.join(", ")}`;
  }

  return `at ${values.length} specific ${unit}s`;
};

const parseCron = (expression: string): { description: string; fields: CronField[]; nextRuns: string[]; error: string } => {
  const parts = expression.trim().split(/\s+/);
  if (parts.length < 5 || parts.length > 5) {
    return {
      description: "",
      fields: [],
      nextRuns: [],
      error: `Expected 5 fields (minute hour day month weekday), got ${parts.length}.`
    };
  }

  try {
    const minutes = parseField(parts[0], 0, 59);
    const hours = parseField(parts[1], 0, 23);
    const daysOfMonth = parseField(parts[2], 1, 31);
    const months = parseField(parts[3], 1, 12, SHORT_MONTHS);
    const daysOfWeek = parseField(parts[4], 0, 6, SHORT_DAYS);

    const fields: CronField[] = [
      { label: "Minute", min: 0, max: 59, allowed: minutes },
      { label: "Hour", min: 0, max: 23, allowed: hours },
      { label: "Day of Month", min: 1, max: 31, allowed: daysOfMonth },
      { label: "Month", min: 1, max: 12, allowed: months },
      { label: "Day of Week", min: 0, max: 6, allowed: daysOfWeek },
    ];

    // Build description
    const descParts: string[] = [];

    // Time
    if (minutes.length === 1 && hours.length === 1) {
      descParts.push(`At ${String(hours[0]).padStart(2, "0")}:${String(minutes[0]).padStart(2, "0")}`);
    } else if (minutes.length === 60 && hours.length === 24) {
      descParts.push("Every minute");
    } else if (minutes.length === 60) {
      descParts.push(`Every minute during hour${hours.length > 1 ? "s" : ""} ${hours.join(", ")}`);
    } else if (hours.length === 24) {
      descParts.push(describeField(minutes, 0, 59, "minute"));
    } else {
      const minDesc = describeField(minutes, 0, 59, "minute");
      const hourDesc = describeField(hours, 0, 23, "hour");
      descParts.push(`${minDesc}, ${hourDesc}`);
    }

    // Day of month
    if (daysOfMonth.length < 31 && parts[2] !== "*") {
      descParts.push(`on day${daysOfMonth.length > 1 ? "s" : ""} ${daysOfMonth.join(", ")} of the month`);
    }

    // Month
    if (months.length < 12) {
      const monthNames = months.map((m) => MONTHS[m]);
      descParts.push(`in ${monthNames.join(", ")}`);
    }

    // Day of week
    if (daysOfWeek.length < 7 && parts[4] !== "*") {
      const dayNames = daysOfWeek.map((d) => DAYS_OF_WEEK[d]);
      descParts.push(`on ${dayNames.join(", ")}`);
    }

    const description = descParts.join(", ");

    // Calculate next 5 runs
    const nextRuns = calculateNextRuns(minutes, hours, daysOfMonth, months, daysOfWeek, parts[2] === "*", parts[4] === "*", 5);

    return { description, fields, nextRuns, error: "" };
  } catch (e) {
    return {
      description: "",
      fields: [],
      nextRuns: [],
      error: e instanceof Error ? e.message : "Failed to parse cron expression."
    };
  }
};

const calculateNextRuns = (
  minutes: number[], hours: number[], daysOfMonth: number[],
  months: number[], daysOfWeek: number[],
  domWild: boolean, dowWild: boolean,
  count: number
): string[] => {
  const results: string[] = [];
  const now = new Date();
  const candidate = new Date(now);
  candidate.setSeconds(0);
  candidate.setMilliseconds(0);
  candidate.setMinutes(candidate.getMinutes() + 1);

  let safety = 0;
  const maxIterations = 525600; // 1 year of minutes

  while (results.length < count && safety < maxIterations) {
    safety++;
    const m = candidate.getMinutes();
    const h = candidate.getHours();
    const dom = candidate.getDate();
    const mon = candidate.getMonth() + 1;
    const dow = candidate.getDay();

    if (!months.includes(mon)) {
      candidate.setMonth(candidate.getMonth() + 1);
      candidate.setDate(1);
      candidate.setHours(0);
      candidate.setMinutes(0);
      continue;
    }

    // Day matching — if both dom and dow are specified (not wild), match either
    const domMatch = domWild || daysOfMonth.includes(dom);
    const dowMatch = dowWild || daysOfWeek.includes(dow);
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
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    }));

    candidate.setMinutes(candidate.getMinutes() + 1);
  }

  return results;
};

const PRESETS: { label: string; cron: string; desc: string }[] = [
  { label: "Every minute", cron: "* * * * *", desc: "Runs every single minute" },
  { label: "Every hour", cron: "0 * * * *", desc: "At minute 0 of every hour" },
  { label: "Every day at midnight", cron: "0 0 * * *", desc: "Once daily at 00:00" },
  { label: "Every day at noon", cron: "0 12 * * *", desc: "Once daily at 12:00" },
  { label: "Every Monday at 9 AM", cron: "0 9 * * 1", desc: "Weekly on Monday" },
  { label: "Weekdays at 8 AM", cron: "0 8 * * 1-5", desc: "Mon-Fri at 08:00" },
  { label: "Every 15 minutes", cron: "*/15 * * * *", desc: "At :00, :15, :30, :45" },
  { label: "Every 6 hours", cron: "0 */6 * * *", desc: "At 00:00, 06:00, 12:00, 18:00" },
  { label: "1st of every month", cron: "0 0 1 * *", desc: "Monthly at midnight" },
  { label: "Sundays at 3 AM", cron: "0 3 * * 0", desc: "Weekly maintenance window" },
];

export default function CronExpressionParser() {
  const [expression, setExpression] = useState("0 9 * * 1-5");
  const [result, setResult] = useState<ReturnType<typeof parseCron> | null>(null);

  const handleParse = useCallback(() => {
    if (!expression.trim()) return;
    setResult(parseCron(expression));
  }, [expression]);

  // Auto-parse on load and changes
  useEffect(() => {
    if (expression.trim()) {
      setResult(parseCron(expression));
    }
  }, [expression]);

  const fieldLabels = ["Minute", "Hour", "Day (month)", "Month", "Day (week)"];
  const fieldRanges = ["0-59", "0-23", "1-31", "1-12", "0-6"];

  return (
    <>
      <title>Cron Expression Parser - Free Online Tool | DevTools Hub</title>
      <meta
        name="description"
        content="Parse and explain cron schedule expressions with next run times. Understand cron syntax with human-readable descriptions and scheduled run previews."
      />
      <JsonLd
        data={[
          generateWebAppSchema({
            slug: "cron-expression-parser",
            name: "Cron Expression Parser",
            description: "Parse and explain cron schedule expressions with next run times",
            category: "developer",
          }),
          generateBreadcrumbSchema({
            slug: "cron-expression-parser",
            name: "Cron Expression Parser",
            description: "Parse and explain cron schedule expressions with next run times",
            category: "developer",
          }),
          generateFAQSchema([
            { question: "What is a cron expression?", answer: "A cron expression is a string of 5 fields (minute, hour, day-of-month, month, day-of-week) that defines a recurring schedule. It's used by Unix/Linux cron daemon, CI/CD pipelines, task schedulers, and cloud services like AWS CloudWatch." },
            { question: "What's the difference between */5 and 0,5,10,15...?", answer: "They produce the same result. */5 means 'every 5th value starting from 0', which expands to 0,5,10,15,20,25,30,35,40,45,50,55. The step syntax (/) is just shorthand." },
            { question: "Can I use day names like MON, TUE?", answer: "Yes! This parser supports both numbered (0-6) and named (SUN-SAT) day-of-week values, and both numbered (1-12) and named (JAN-DEC) month values. Names are case-insensitive." },
            { question: "How do day-of-month and day-of-week interact?", answer: "If both are specified (not *), the schedule runs when EITHER condition matches (OR logic). If only one is specified and the other is *, only the specified field is checked." },
            { question: "Where are cron expressions commonly used?", answer: "Unix/Linux crontab, GitHub Actions (schedule trigger), AWS EventBridge/CloudWatch, Kubernetes CronJobs, Vercel Cron, Google Cloud Scheduler, CI/CD pipelines, and database maintenance jobs." },
          ]),
        ]}
      />

    <main className="min-h-screen bg-slate-900 text-white">
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-8">
          <a href="/" className="text-blue-400 hover:text-blue-300 text-sm mb-4 inline-block">
            ← Back to all tools
          </a>
          <h1 className="text-3xl font-bold mb-2">Cron Expression Parser</h1>
          <p className="text-slate-400">
            Parse and understand cron expressions. See human-readable descriptions and next scheduled run times.
          </p>
        </div>

        {/* Input */}
        <div className="bg-slate-800 rounded-lg p-6 mb-6">
          {/* Field Labels */}
          <div className="grid grid-cols-5 gap-2 mb-2 text-center">
            {fieldLabels.map((label, i) => (
              <div key={label} className="text-xs text-slate-400">
                <div className="font-medium">{label}</div>
                <div className="text-slate-500">{fieldRanges[i]}</div>
              </div>
            ))}
          </div>

          {/* Expression Input */}
          <input
            type="text"
            value={expression}
            onChange={(e) => setExpression(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleParse(); }}
            placeholder="* * * * *"
            className="w-full bg-slate-900 border border-slate-700 rounded px-4 py-3 text-lg font-mono text-center text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 tracking-widest mb-3"
            spellCheck={false}
          />

          {/* Parse Button */}
          <button
            onClick={handleParse}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded transition-colors"
          >
            Parse Expression
          </button>
        </div>

        {/* Result */}
        {result && !result.error && (
          <>
            {/* Description */}
            <div className="bg-slate-800 rounded-lg p-6 mb-6">
              <h2 className="text-sm font-medium text-slate-400 mb-2">Schedule Description</h2>
              <p className="text-xl font-medium text-white">{result.description}</p>
            </div>

            {/* Field Breakdown */}
            <div className="bg-slate-800 rounded-lg p-6 mb-6">
              <h2 className="text-sm font-medium text-slate-400 mb-3">Field Breakdown</h2>
              <div className="space-y-2">
                {result.fields.map((field, i) => {
                  const parts = expression.trim().split(/\s+/);
                  const isAll = field.allowed.length === field.max - field.min + 1;
                  return (
                    <div key={field.label} className="flex items-center gap-3 text-sm">
                      <span className="w-28 text-slate-400 shrink-0">{field.label}</span>
                      <code className="bg-slate-900 px-2 py-1 rounded text-blue-400 font-mono min-w-[60px] text-center">
                        {parts[i] || "*"}
                      </code>
                      <span className="text-slate-300">
                        {isAll ? (
                          <span className="text-green-400">Every {field.label.toLowerCase()}</span>
                        ) : (
                          field.allowed.length <= 10
                            ? field.allowed.map((v) => {
                                if (field.label === "Month") return MONTHS[v];
                                if (field.label === "Day of Week") return DAYS_OF_WEEK[v];
                                return v;
                              }).join(", ")
                            : `${field.allowed.length} values`
                        )}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Next Runs */}
            {result.nextRuns.length > 0 && (
              <div className="bg-slate-800 rounded-lg p-6 mb-6">
                <h2 className="text-sm font-medium text-slate-400 mb-3">Next 5 Scheduled Runs</h2>
                <div className="space-y-1">
                  {result.nextRuns.map((run, i) => (
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

        {/* Error */}
        {result?.error && (
          <div className="bg-red-900/50 border border-red-700 rounded-lg p-4 mb-6 text-red-300 text-sm">
            {result.error}
          </div>
        )}

        {/* Presets */}
        <div className="bg-slate-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Common Cron Schedules</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {PRESETS.map((preset) => (
              <button
                key={preset.cron}
                onClick={() => setExpression(preset.cron)}
                className="text-left bg-slate-700/50 hover:bg-slate-700 rounded p-3 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-white">{preset.label}</span>
                  <code className="text-xs font-mono text-blue-400 bg-slate-900 px-2 py-0.5 rounded">
                    {preset.cron}
                  </code>
                </div>
                <div className="text-xs text-slate-400 mt-1">{preset.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Syntax Reference */}
        <div className="bg-slate-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Cron Syntax Reference</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left py-2 text-slate-400 font-medium">Symbol</th>
                  <th className="text-left py-2 text-slate-400 font-medium">Meaning</th>
                  <th className="text-left py-2 text-slate-400 font-medium">Example</th>
                </tr>
              </thead>
              <tbody className="text-slate-300">
                {[
                  ["*", "Any value (wildcard)", "* in hour = every hour"],
                  [",", "Value list separator", "1,3,5 in day-of-week = Mon, Wed, Fri"],
                  ["-", "Range of values", "1-5 in day-of-week = Monday to Friday"],
                  ["/", "Step values", "*/15 in minute = every 15 minutes"],
                  ["0-59", "Minutes", "30 = at the 30th minute"],
                  ["0-23", "Hours (24h format)", "14 = 2:00 PM"],
                  ["1-31", "Day of month", "15 = 15th of the month"],
                  ["1-12", "Month (or JAN-DEC)", "6 = June"],
                  ["0-6", "Day of week (or SUN-SAT)", "0 = Sunday, 1 = Monday"],
                ].map((row) => (
                  <tr key={row[0]} className="border-b border-slate-700/50">
                    <td className="py-2 font-mono text-blue-400">{row[0]}</td>
                    <td className="py-2">{row[1]}</td>
                    <td className="py-2 text-slate-400">{row[2]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <RelatedTools currentSlug="cron-expression-parser" />

        {/* FAQ */}
        <div className="bg-slate-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {[
              {
                q: "What is a cron expression?",
                a: "A cron expression is a string of 5 fields (minute, hour, day-of-month, month, day-of-week) that defines a recurring schedule. It's used by Unix/Linux cron daemon, CI/CD pipelines, task schedulers, and cloud services like AWS CloudWatch."
              },
              {
                q: "What's the difference between */5 and 0,5,10,15...?",
                a: "They produce the same result. */5 means 'every 5th value starting from 0', which expands to 0,5,10,15,20,25,30,35,40,45,50,55. The step syntax (/) is just shorthand."
              },
              {
                q: "Can I use day names like MON, TUE?",
                a: "Yes! This parser supports both numbered (0-6) and named (SUN-SAT) day-of-week values, and both numbered (1-12) and named (JAN-DEC) month values. Names are case-insensitive."
              },
              {
                q: "How do day-of-month and day-of-week interact?",
                a: "If both are specified (not *), the schedule runs when EITHER condition matches (OR logic). If only one is specified and the other is *, only the specified field is checked."
              },
              {
                q: "Where are cron expressions commonly used?",
                a: "Unix/Linux crontab, GitHub Actions (schedule trigger), AWS EventBridge/CloudWatch, Kubernetes CronJobs, Vercel Cron, Google Cloud Scheduler, CI/CD pipelines, and database maintenance jobs."
              },
            ].map((item) => (
              <div key={item.q}>
                <h3 className="font-medium text-white text-sm">{item.q}</h3>
                <p className="text-slate-400 text-sm mt-1">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
    </>
  );
}
