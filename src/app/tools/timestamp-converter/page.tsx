"use client";

import { useState, useCallback, useEffect } from "react";

type InputMode = "unix" | "human";

export default function TimestampConverterPage() {
  const [unixInput, setUnixInput] = useState("");
  const [humanInput, setHumanInput] = useState("");
  const [inputMode, setInputMode] = useState<InputMode>("unix");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ConversionResult | null>(null);
  const [liveTimestamp, setLiveTimestamp] = useState(Math.floor(Date.now() / 1000));
  const [copied, setCopied] = useState<string | null>(null);

  interface ConversionResult {
    unix: number;
    unixMs: number;
    iso8601: string;
    utc: string;
    local: string;
    relative: string;
    dayOfWeek: string;
    dayOfYear: number;
    weekNumber: number;
    isLeapYear: boolean;
  }

  // Live clock
  useEffect(() => {
    const interval = setInterval(() => {
      setLiveTimestamp(Math.floor(Date.now() / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

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
    const diff = date.getTime() - start.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  }, []);

  const getWeekNumber = useCallback((date: Date): number => {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  }, []);

  const isLeapYear = useCallback((year: number): boolean => {
    return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
  }, []);

  const convertTimestamp = useCallback(
    (unixSeconds: number) => {
      const date = new Date(unixSeconds * 1000);
      if (isNaN(date.getTime())) {
        setError("Invalid timestamp value.");
        setResult(null);
        return;
      }

      const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

      setResult({
        unix: unixSeconds,
        unixMs: unixSeconds * 1000,
        iso8601: date.toISOString(),
        utc: date.toUTCString(),
        local: date.toLocaleString(),
        relative: getRelativeTime(date),
        dayOfWeek: days[date.getDay()],
        dayOfYear: getDayOfYear(date),
        weekNumber: getWeekNumber(date),
        isLeapYear: isLeapYear(date.getFullYear()),
      });
      setError(null);
    },
    [getRelativeTime, getDayOfYear, getWeekNumber, isLeapYear]
  );

  const handleUnixConvert = useCallback(() => {
    const input = unixInput.trim();
    if (!input) {
      setError("Enter a Unix timestamp.");
      return;
    }

    let num = Number(input);
    if (isNaN(num)) {
      setError("Invalid number. Enter a Unix timestamp in seconds or milliseconds.");
      return;
    }

    // Auto-detect milliseconds vs seconds
    if (num > 1e12) {
      num = Math.floor(num / 1000);
    }

    convertTimestamp(num);
  }, [unixInput, convertTimestamp]);

  const handleHumanConvert = useCallback(() => {
    const input = humanInput.trim();
    if (!input) {
      setError("Enter a date/time string.");
      return;
    }

    const date = new Date(input);
    if (isNaN(date.getTime())) {
      setError(
        "Could not parse date. Try formats like: 2024-01-15, Jan 15 2024, 2024-01-15T10:30:00Z"
      );
      return;
    }

    const unix = Math.floor(date.getTime() / 1000);
    convertTimestamp(unix);
  }, [humanInput, convertTimestamp]);

  const handleConvert = useCallback(() => {
    if (inputMode === "unix") {
      handleUnixConvert();
    } else {
      handleHumanConvert();
    }
  }, [inputMode, handleUnixConvert, handleHumanConvert]);

  const useCurrentTime = useCallback(() => {
    const now = Math.floor(Date.now() / 1000);
    setUnixInput(String(now));
    setInputMode("unix");
    convertTimestamp(now);
  }, [convertTimestamp]);

  const copyValue = useCallback(async (label: string, value: string) => {
    await navigator.clipboard.writeText(value);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  }, []);

  const presets = [
    { label: "Y2K", value: 946684800 },
    { label: "Unix Epoch", value: 0 },
    { label: "2030", value: 1893456000 },
    { label: "Max 32-bit", value: 2147483647 },
  ];

  return (
    <>
      <title>Unix Timestamp Converter - Free Online Tool | DevTools Hub</title>
      <meta
        name="description"
        content="Convert Unix timestamps to human-readable dates and vice versa. Supports seconds and milliseconds, ISO 8601, relative time, and more."
      />

      <div className="min-h-screen bg-slate-900 text-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Breadcrumb */}
          <nav className="text-sm text-slate-400 mb-6" aria-label="Breadcrumb">
            <ol className="flex items-center gap-2">
              <li>
                <a href="/" className="hover:text-white transition-colors">
                  Home
                </a>
              </li>
              <li><span className="mx-1">/</span></li>
              <li>
                <a href="/tools" className="hover:text-white transition-colors">
                  Tools
                </a>
              </li>
              <li><span className="mx-1">/</span></li>
              <li className="text-slate-200">Timestamp Converter</li>
            </ol>
          </nav>

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
              Unix Timestamp Converter
            </h1>
            <p className="text-slate-400 max-w-2xl text-lg">
              Convert between Unix timestamps and human-readable dates. Auto-detects
              seconds vs milliseconds. All processing in your browser.
            </p>
          </div>

          {/* Live Clock */}
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 mb-6 flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="text-sm text-slate-400">Current Unix Timestamp:</span>
              <span className="ml-2 font-mono text-xl text-white font-bold">
                {liveTimestamp}
              </span>
            </div>
            <div className="text-sm text-slate-400">
              {new Date(liveTimestamp * 1000).toUTCString()}
            </div>
          </div>

          {/* Input */}
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 mb-6">
            {/* Mode toggle */}
            <div className="flex items-center gap-2 mb-4">
              <button
                onClick={() => setInputMode("unix")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  inputMode === "unix"
                    ? "bg-blue-600 text-white"
                    : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                }`}
              >
                Unix Timestamp
              </button>
              <button
                onClick={() => setInputMode("human")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  inputMode === "human"
                    ? "bg-blue-600 text-white"
                    : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                }`}
              >
                Human Date
              </button>
            </div>

            <div className="flex gap-3">
              {inputMode === "unix" ? (
                <input
                  type="text"
                  value={unixInput}
                  onChange={(e) => {
                    setUnixInput(e.target.value);
                    setError(null);
                  }}
                  onKeyDown={(e) => e.key === "Enter" && handleConvert()}
                  placeholder="e.g. 1700000000 or 1700000000000"
                  className="flex-1 bg-slate-900 border border-slate-600 rounded-lg px-4 py-2 font-mono text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  spellCheck={false}
                />
              ) : (
                <input
                  type="text"
                  value={humanInput}
                  onChange={(e) => {
                    setHumanInput(e.target.value);
                    setError(null);
                  }}
                  onKeyDown={(e) => e.key === "Enter" && handleConvert()}
                  placeholder="e.g. 2024-01-15, Jan 15 2024 10:30, 2024-01-15T10:30:00Z"
                  className="flex-1 bg-slate-900 border border-slate-600 rounded-lg px-4 py-2 font-mono text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  spellCheck={false}
                />
              )}
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

            {/* Presets */}
            <div className="flex flex-wrap gap-2 mt-3">
              {presets.map((p) => (
                <button
                  key={p.label}
                  onClick={() => {
                    setUnixInput(String(p.value));
                    setInputMode("unix");
                    convertTimestamp(p.value);
                  }}
                  className="text-xs px-3 py-1 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded transition-colors"
                >
                  {p.label}
                </button>
              ))}
            </div>
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
                {[
                  { label: "Unix (seconds)", value: String(result.unix) },
                  { label: "Unix (milliseconds)", value: String(result.unixMs) },
                  { label: "ISO 8601", value: result.iso8601 },
                  { label: "UTC", value: result.utc },
                  { label: "Local Time", value: result.local },
                  { label: "Relative", value: result.relative },
                  { label: "Day of Week", value: result.dayOfWeek },
                  { label: "Day of Year", value: String(result.dayOfYear) },
                  { label: "ISO Week", value: String(result.weekNumber) },
                  { label: "Leap Year", value: result.isLeapYear ? "Yes" : "No" },
                ].map((row) => (
                  <div
                    key={row.label}
                    className="flex items-center justify-between px-4 py-3 group hover:bg-slate-750"
                  >
                    <span className="text-sm text-slate-400 w-40 shrink-0">
                      {row.label}
                    </span>
                    <code className="text-sm font-mono text-slate-200 flex-1 text-right select-all">
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
              Common Timestamps
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { label: "Unix Epoch", ts: 0, date: "Jan 1, 1970 00:00:00 UTC" },
                { label: "Y2K", ts: 946684800, date: "Jan 1, 2000 00:00:00 UTC" },
                { label: "32-bit Overflow", ts: 2147483647, date: "Jan 19, 2038 03:14:07 UTC" },
                { label: "Year 2050", ts: 2524608000, date: "Jan 1, 2050 00:00:00 UTC" },
              ].map((item) => (
                <button
                  key={item.label}
                  onClick={() => {
                    setUnixInput(String(item.ts));
                    setInputMode("unix");
                    convertTimestamp(item.ts);
                  }}
                  className="text-left bg-slate-900 rounded-lg p-3 hover:bg-slate-700 transition-colors"
                >
                  <div className="text-sm font-medium text-white">{item.label}</div>
                  <div className="text-xs text-slate-400 font-mono">{item.ts}</div>
                  <div className="text-xs text-slate-500">{item.date}</div>
                </button>
              ))}
            </div>
          </div>

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
                  number of seconds that have elapsed since January 1, 1970
                  00:00:00 UTC. It provides a universal, timezone-independent way
                  to represent a point in time and is used extensively in
                  programming, databases, and APIs.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  What is the Year 2038 problem?
                </h3>
                <p className="text-slate-400">
                  Many systems store Unix timestamps as 32-bit signed integers,
                  which can represent dates up to January 19, 2038 at 03:14:07
                  UTC (timestamp 2,147,483,647). After this point, the value
                  overflows to a negative number, causing dates to wrap back to
                  1901. Most modern systems now use 64-bit integers to avoid this
                  issue.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Seconds vs milliseconds — how do I know which one I have?
                </h3>
                <p className="text-slate-400">
                  Unix timestamps in seconds are typically 10 digits long (e.g.,
                  1700000000), while millisecond timestamps are 13 digits (e.g.,
                  1700000000000). This tool auto-detects the format: if the
                  number is greater than 1 trillion, it treats it as
                  milliseconds and divides by 1000.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  What date formats can I enter?
                </h3>
                <p className="text-slate-400">
                  You can enter dates in most common formats: ISO 8601
                  (2024-01-15T10:30:00Z), US format (Jan 15 2024), simple date
                  (2024-01-15), or date with time (2024-01-15 10:30). The tool
                  uses your browser&apos;s date parser, so most natural date
                  formats will work.
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
