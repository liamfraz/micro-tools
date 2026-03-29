"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import JsonLd from "@/components/JsonLd";
import RelatedTools from "@/components/RelatedTools";
import ToolBreadcrumb from "@/components/ToolBreadcrumb";
import {
  generateFAQSchema,
  generateWebAppSchema,
  generateBreadcrumbSchema,
} from "@/lib/jsonld";

type InputMode = "toDate" | "toTimestamp";

type TimestampUnit = "seconds" | "milliseconds" | "microseconds" | "nanoseconds";

const UNIT_DIVISORS: Record<TimestampUnit, number> = {
  seconds: 1,
  milliseconds: 1_000,
  microseconds: 1_000_000,
  nanoseconds: 1_000_000_000,
};

interface ConversionResult {
  unix: number;
  unixMs: number;
  unixUs: number;
  unixNs: string;
  iso8601: string;
  utc: string;
  localFormatted: string;
  rfc2822: string;
  relative: string;
  dayOfWeek: string;
  dayOfYear: number;
  weekNumber: number;
  isLeapYear: boolean;
}

const COMMON_TIMEZONES = [
  "UTC",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Toronto",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Europe/Moscow",
  "Asia/Tokyo",
  "Asia/Shanghai",
  "Asia/Kolkata",
  "Asia/Dubai",
  "Asia/Singapore",
  "Australia/Sydney",
  "Australia/Melbourne",
  "Australia/Perth",
  "Pacific/Auckland",
  "Africa/Johannesburg",
  "America/Sao_Paulo",
];

const REFERENCE_TIMESTAMPS = [
  { label: "Unix Epoch", ts: 0, date: "Jan 1, 1970 00:00:00 UTC" },
  { label: "Y2K", ts: 946684800, date: "Jan 1, 2000 00:00:00 UTC" },
  { label: "Year 2010", ts: 1262304000, date: "Jan 1, 2010 00:00:00 UTC" },
  { label: "Year 2020", ts: 1577836800, date: "Jan 1, 2020 00:00:00 UTC" },
  { label: "Year 2025", ts: 1735689600, date: "Jan 1, 2025 00:00:00 UTC" },
  { label: "32-bit Max (Y2038)", ts: 2147483647, date: "Jan 19, 2038 03:14:07 UTC" },
  { label: "Year 2050", ts: 2524608000, date: "Jan 1, 2050 00:00:00 UTC" },
  { label: "Year 2100", ts: 4102444800, date: "Jan 1, 2100 00:00:00 UTC" },
];

export default function UnixTimestampConverterPage() {
  const [inputMode, setInputMode] = useState<InputMode>("toDate");
  const [timestampInput, setTimestampInput] = useState("");
  const [dateInput, setDateInput] = useState("");
  const [timeInput, setTimeInput] = useState("");
  const [timezone, setTimezone] = useState("UTC");
  const [timestampUnit, setTimestampUnit] = useState<TimestampUnit>("seconds");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ConversionResult | null>(null);
  const [liveTimestamp, setLiveTimestamp] = useState<number | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setLiveTimestamp(Math.floor(Date.now() / 1000));
    const interval = setInterval(() => {
      setLiveTimestamp(Math.floor(Date.now() / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const localTimezone = useMemo(() => {
    if (!mounted) return "UTC";
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch {
      return "UTC";
    }
  }, [mounted]);

  const getRelativeTime = useCallback((date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const absDiff = Math.abs(diffMs);
    const isFuture = diffMs < 0;

    const seconds = Math.floor(absDiff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    const months = Math.floor(days / 30);
    const years = Math.floor(days / 365);

    let text: string;
    if (seconds < 60) text = `${seconds} second${seconds !== 1 ? "s" : ""}`;
    else if (minutes < 60) text = `${minutes} minute${minutes !== 1 ? "s" : ""}`;
    else if (hours < 24) text = `${hours} hour${hours !== 1 ? "s" : ""}`;
    else if (days < 30) text = `${days} day${days !== 1 ? "s" : ""}`;
    else if (months < 12) text = `${months} month${months !== 1 ? "s" : ""}`;
    else text = `${years} year${years !== 1 ? "s" : ""}`;

    return isFuture ? `in ${text}` : `${text} ago`;
  }, []);

  const getDayOfYear = useCallback((date: Date): number => {
    const start = new Date(date.getFullYear(), 0, 0);
    return Math.floor((date.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  }, []);

  const getWeekNumber = useCallback((date: Date): number => {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  }, []);

  const formatInTimezone = useCallback(
    (date: Date, tz: string, options?: Intl.DateTimeFormatOptions): string => {
      try {
        return new Intl.DateTimeFormat("en-US", {
          ...options,
          timeZone: tz,
        }).format(date);
      } catch {
        return date.toLocaleString();
      }
    },
    []
  );

  const buildResult = useCallback(
    (unixSeconds: number) => {
      const date = new Date(unixSeconds * 1000);
      if (isNaN(date.getTime())) {
        setError("Invalid timestamp value.");
        setResult(null);
        return;
      }

      const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
      const year = date.getFullYear();
      const isLeap = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;

      const localFormatted = formatInTimezone(date, timezone, {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
        timeZoneName: "short",
      });

      setResult({
        unix: unixSeconds,
        unixMs: unixSeconds * 1000,
        unixUs: unixSeconds * 1_000_000,
        unixNs: String(BigInt(Math.round(unixSeconds)) * BigInt(1_000_000_000)),
        iso8601: date.toISOString(),
        utc: date.toUTCString(),
        localFormatted,
        rfc2822: date.toUTCString(),
        relative: getRelativeTime(date),
        dayOfWeek: days[date.getUTCDay()],
        dayOfYear: getDayOfYear(date),
        weekNumber: getWeekNumber(date),
        isLeapYear: isLeap,
      });
      setError(null);
    },
    [timezone, getRelativeTime, getDayOfYear, getWeekNumber, formatInTimezone]
  );

  const handleTimestampConvert = useCallback(() => {
    const input = timestampInput.trim();
    if (!input) {
      setError("Enter a Unix timestamp.");
      return;
    }

    const num = Number(input);
    if (isNaN(num)) {
      setError("Invalid number. Enter a numeric Unix timestamp.");
      return;
    }

    const seconds = num / UNIT_DIVISORS[timestampUnit];
    buildResult(seconds);
  }, [timestampInput, timestampUnit, buildResult]);

  const handleDateConvert = useCallback(() => {
    const d = dateInput.trim();
    const t = timeInput.trim() || "00:00:00";
    if (!d) {
      setError("Enter a date.");
      return;
    }

    const dateStr = `${d}T${t}`;
    let date: Date;

    if (timezone === "UTC") {
      date = new Date(dateStr + "Z");
    } else {
      date = new Date(dateStr);
      try {
        const formatter = new Intl.DateTimeFormat("en-US", {
          timeZone: timezone,
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        });
        const parts = formatter.formatToParts(date);
        const get = (type: string) => parts.find((p) => p.type === type)?.value || "0";
        const tzDate = new Date(
          `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}:${get("second")}Z`
        );
        const offset = tzDate.getTime() - date.getTime();
        date = new Date(date.getTime() - offset);
      } catch {
        date = new Date(dateStr);
      }
    }

    if (isNaN(date.getTime())) {
      setError("Could not parse date. Use format: YYYY-MM-DD and HH:MM:SS");
      return;
    }

    const unix = Math.floor(date.getTime() / 1000);
    buildResult(unix);
  }, [dateInput, timeInput, timezone, buildResult]);

  const handleConvert = useCallback(() => {
    if (inputMode === "toDate") {
      handleTimestampConvert();
    } else {
      handleDateConvert();
    }
  }, [inputMode, handleTimestampConvert, handleDateConvert]);

  const formatLiveForUnit = useCallback(
    (ts: number): string => {
      switch (timestampUnit) {
        case "seconds":
          return String(ts);
        case "milliseconds":
          return String(ts * 1000);
        case "microseconds":
          return String(ts * 1_000_000);
        case "nanoseconds":
          return String(BigInt(ts) * BigInt(1_000_000_000));
      }
    },
    [timestampUnit]
  );

  const useCurrentTime = useCallback(() => {
    const now = Math.floor(Date.now() / 1000);
    if (inputMode === "toDate") {
      setTimestampInput(formatLiveForUnit(now));
    }
    buildResult(now);
  }, [inputMode, formatLiveForUnit, buildResult]);

  const copyValue = useCallback(async (label: string, value: string) => {
    await navigator.clipboard.writeText(value);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  }, []);

  const resultRows = useMemo(() => {
    if (!result) return [];
    return [
      { label: "Unix (seconds)", value: String(result.unix) },
      { label: "Unix (milliseconds)", value: String(result.unixMs) },
      { label: "Unix (microseconds)", value: String(result.unixUs) },
      { label: "Unix (nanoseconds)", value: result.unixNs },
      { label: "ISO 8601", value: result.iso8601 },
      { label: "RFC 2822 / UTC", value: result.utc },
      { label: `Time in ${timezone}`, value: result.localFormatted },
      { label: "Relative", value: result.relative },
      { label: "Day of Week", value: result.dayOfWeek },
      { label: "Day of Year", value: String(result.dayOfYear) },
      { label: "ISO Week", value: String(result.weekNumber) },
      { label: "Leap Year", value: result.isLeapYear ? "Yes" : "No" },
    ];
  }, [result, timezone]);

  const unitPlaceholders: Record<TimestampUnit, string> = {
    seconds: "e.g. 1700000000",
    milliseconds: "e.g. 1700000000000",
    microseconds: "e.g. 1700000000000000",
    nanoseconds: "e.g. 1700000000000000000",
  };

  return (
    <>
      <title>Unix Timestamp Converter - Epoch Time Tool | DevTools</title>
      <meta
        name="description"
        content="Convert Unix timestamps to human-readable dates and dates to epoch time. Supports seconds, milliseconds, microseconds, nanoseconds. Live counter, timezone selector, and common timestamps reference."
      />
      <meta
        name="keywords"
        content="unix timestamp converter, epoch converter, unix time, epoch time, timestamp to date, date to timestamp, unix epoch, milliseconds converter"
      />
      <JsonLd
        data={[
          generateWebAppSchema({
            slug: "unix-timestamp-converter",
            name: "Unix Timestamp Converter",
            description:
              "Convert Unix timestamps to human-readable dates and dates to epoch time. Supports seconds, milliseconds, microseconds, and nanoseconds with timezone support.",
            category: "date-time",
          }),
          generateBreadcrumbSchema({
            slug: "unix-timestamp-converter",
            name: "Unix Timestamp Converter",
            description:
              "Convert Unix timestamps to human-readable dates and dates to epoch time with timezone support.",
            category: "date-time",
          }),
          generateFAQSchema([
            {
              question: "What is a Unix timestamp?",
              answer:
                "A Unix timestamp (also called Epoch time or POSIX time) is the number of seconds elapsed since January 1, 1970 00:00:00 UTC. It is a universal, timezone-independent way to represent time used in programming, databases, and APIs.",
            },
            {
              question: "How do I convert a Unix timestamp to a date?",
              answer:
                "Enter the Unix timestamp in the input field, select the unit (seconds, milliseconds, microseconds, or nanoseconds), and click Convert. The tool will display the corresponding date in multiple formats including ISO 8601, UTC, RFC 2822, and your selected timezone.",
            },
            {
              question: "What is the difference between seconds, milliseconds, microseconds, and nanoseconds timestamps?",
              answer:
                "Seconds timestamps are typically 10 digits (e.g. 1700000000). Milliseconds are 13 digits — JavaScript's Date.now() returns milliseconds. Microseconds are 16 digits, used in some databases and languages. Nanoseconds are 19 digits, used in Go's time.UnixNano() and high-precision systems.",
            },
            {
              question: "What is the Year 2038 problem?",
              answer:
                "Systems using 32-bit signed integers for Unix timestamps can only represent dates up to January 19, 2038 03:14:07 UTC (2147483647). After that, the value overflows. Most modern systems use 64-bit integers to avoid this limitation.",
            },
          ]),
        ]}
      />

      <div className="min-h-screen bg-slate-900 text-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <ToolBreadcrumb slug="unix-timestamp-converter" />

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
              Unix Timestamp Converter
            </h1>
            <p className="text-slate-400 max-w-2xl text-lg">
              Convert between Unix epoch timestamps and human-readable dates.
              Supports seconds, milliseconds, microseconds, and nanoseconds.
              Timezone selector, live counter, and relative time display. All
              processing happens in your browser.
            </p>
          </div>

          {/* Live Clock */}
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 mb-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <span className="text-sm text-slate-400">Current Unix Timestamp:</span>
                <span className="ml-2 font-mono text-xl text-white font-bold">
                  {liveTimestamp !== null ? formatLiveForUnit(liveTimestamp) : "\u2014"}
                </span>
              </div>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => {
                    if (liveTimestamp !== null) {
                      copyValue("live", formatLiveForUnit(liveTimestamp));
                    }
                  }}
                  className="text-xs px-3 py-1 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded transition-colors"
                >
                  {copied === "live" ? "Copied!" : "Copy"}
                </button>
              </div>
            </div>
            <div className="mt-2 text-sm text-slate-400 font-mono">
              {liveTimestamp !== null ? new Date(liveTimestamp * 1000).toUTCString() : "\u2014"}
            </div>
          </div>

          {/* Controls row: timezone + unit selector */}
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 mb-6 flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <label htmlFor="tz-select" className="text-sm text-slate-400">
                Timezone:
              </label>
              <select
                id="tz-select"
                value={timezone}
                onChange={(e) => {
                  setTimezone(e.target.value);
                  if (result) buildResult(result.unix);
                }}
                className="bg-slate-900 border border-slate-600 rounded-lg px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {mounted && !COMMON_TIMEZONES.includes(localTimezone) && (
                  <option value={localTimezone}>{localTimezone} (Local)</option>
                )}
                {COMMON_TIMEZONES.map((tz) => (
                  <option key={tz} value={tz}>
                    {tz}
                    {mounted && tz === localTimezone ? " (Local)" : ""}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label htmlFor="unit-select" className="text-sm text-slate-400">
                Input unit:
              </label>
              <select
                id="unit-select"
                value={timestampUnit}
                onChange={(e) => setTimestampUnit(e.target.value as TimestampUnit)}
                className="bg-slate-900 border border-slate-600 rounded-lg px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="seconds">Seconds</option>
                <option value="milliseconds">Milliseconds</option>
                <option value="microseconds">Microseconds</option>
                <option value="nanoseconds">Nanoseconds</option>
              </select>
            </div>
          </div>

          {/* Input */}
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 mb-6">
            {/* Mode toggle */}
            <div className="flex items-center gap-2 mb-4">
              <button
                onClick={() => setInputMode("toDate")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  inputMode === "toDate"
                    ? "bg-blue-600 text-white"
                    : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                }`}
              >
                Timestamp &rarr; Date
              </button>
              <button
                onClick={() => setInputMode("toTimestamp")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  inputMode === "toTimestamp"
                    ? "bg-blue-600 text-white"
                    : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                }`}
              >
                Date &rarr; Timestamp
              </button>
            </div>

            {inputMode === "toDate" ? (
              <div className="flex gap-3">
                <input
                  type="text"
                  value={timestampInput}
                  onChange={(e) => {
                    setTimestampInput(e.target.value);
                    setError(null);
                  }}
                  onKeyDown={(e) => e.key === "Enter" && handleConvert()}
                  placeholder={unitPlaceholders[timestampUnit]}
                  className="flex-1 bg-slate-900 border border-slate-600 rounded-lg px-4 py-2 font-mono text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  spellCheck={false}
                />
                <button
                  onClick={handleConvert}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors shrink-0"
                >
                  Convert
                </button>
                <button
                  onClick={useCurrentTime}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors shrink-0"
                >
                  Now
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="text-xs text-slate-500 mb-1 block">Date</label>
                    <input
                      type="date"
                      value={dateInput}
                      onChange={(e) => {
                        setDateInput(e.target.value);
                        setError(null);
                      }}
                      className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2 font-mono text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-xs text-slate-500 mb-1 block">Time (optional)</label>
                    <input
                      type="time"
                      step="1"
                      value={timeInput}
                      onChange={(e) => {
                        setTimeInput(e.target.value);
                        setError(null);
                      }}
                      className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2 font-mono text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handleConvert}
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                  >
                    Convert
                  </button>
                  <button
                    onClick={() => {
                      const now = new Date();
                      setDateInput(now.toISOString().slice(0, 10));
                      setTimeInput(now.toTimeString().slice(0, 8));
                    }}
                    className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors"
                  >
                    Now
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 p-3 bg-red-900/40 border border-red-700 rounded-lg text-red-300 text-sm font-mono">
              <span className="font-bold">Error:</span> {error}
            </div>
          )}

          {/* Results */}
          {result && (
            <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden mb-6">
              <div className="p-4 border-b border-slate-700">
                <h2 className="text-lg font-semibold text-white">Conversion Result</h2>
              </div>
              <div className="divide-y divide-slate-700">
                {resultRows.map((row) => (
                  <div
                    key={row.label}
                    className="flex items-center justify-between px-4 py-3 group hover:bg-slate-750"
                  >
                    <span className="text-sm text-slate-400 w-52 shrink-0">{row.label}</span>
                    <code className="text-sm font-mono text-slate-200 flex-1 text-right select-all break-all">
                      {row.value}
                    </code>
                    <button
                      onClick={() => copyValue(row.label, row.value)}
                      className="ml-4 text-xs text-slate-500 hover:text-white opacity-0 group-hover:opacity-100 transition-all shrink-0"
                    >
                      {copied === row.label ? "Copied!" : "Copy"}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Common Timestamps Reference */}
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 mb-6">
            <h2 className="text-lg font-semibold text-white mb-4">
              Common Timestamps Reference
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {REFERENCE_TIMESTAMPS.map((item) => (
                <button
                  key={item.label}
                  onClick={() => {
                    setTimestampInput(String(item.ts * UNIT_DIVISORS[timestampUnit]));
                    setInputMode("toDate");
                    buildResult(item.ts);
                  }}
                  className="text-left bg-slate-900 rounded-lg p-3 hover:bg-slate-700 transition-colors"
                >
                  <div className="text-sm font-medium text-white">{item.label}</div>
                  <div className="text-xs text-slate-400 font-mono">
                    {item.ts * UNIT_DIVISORS[timestampUnit]}
                  </div>
                  <div className="text-xs text-slate-500">{item.date}</div>
                </button>
              ))}
            </div>
          </div>

          <RelatedTools currentSlug="unix-timestamp-converter" />

          {/* FAQ */}
          <section className="mt-16 border-t border-slate-700 pt-10">
            <h2 className="text-2xl font-bold text-white mb-6">
              Frequently Asked Questions
            </h2>
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  What is a Unix timestamp?
                </h3>
                <p className="text-slate-400">
                  A Unix timestamp (also called Epoch time or POSIX time) is the
                  number of seconds elapsed since January 1, 1970 00:00:00 UTC.
                  It is a universal, timezone-independent way to represent time
                  used in programming, databases, and APIs.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  How do I convert a Unix timestamp to a date?
                </h3>
                <p className="text-slate-400">
                  Enter the Unix timestamp in the input field, select your unit
                  (seconds, milliseconds, microseconds, or nanoseconds), and
                  click Convert. The tool displays the corresponding date in
                  multiple formats including ISO 8601, RFC 2822, UTC, and your
                  selected timezone.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  What is the difference between timestamp units?
                </h3>
                <p className="text-slate-400">
                  Seconds timestamps are typically 10 digits (e.g. 1700000000).
                  Milliseconds are 13 digits &mdash; JavaScript&apos;s Date.now() returns
                  milliseconds. Microseconds (16 digits) are used in some databases.
                  Nanoseconds (19 digits) are used in Go&apos;s time.UnixNano() and
                  high-precision systems.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  What is the Year 2038 problem?
                </h3>
                <p className="text-slate-400">
                  Systems using 32-bit signed integers for Unix timestamps can
                  only represent dates up to January 19, 2038 03:14:07 UTC
                  (2147483647). After that, the integer overflows. Modern systems
                  use 64-bit integers to avoid this.
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
