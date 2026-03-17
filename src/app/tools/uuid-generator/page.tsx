"use client";

import { useState, useCallback } from "react";
import JsonLd from "@/components/JsonLd";
import RelatedTools from "@/components/RelatedTools";
import {
  generateFAQSchema,
  generateWebAppSchema,
  generateBreadcrumbSchema,
} from "@/lib/jsonld";

type UUIDVersion = "v4" | "v1" | "nil";

interface GeneratedUUID {
  value: string;
  version: UUIDVersion;
  timestamp: number;
}

export default function UUIDGeneratorPage() {
  const [uuids, setUuids] = useState<GeneratedUUID[]>([]);
  const [version, setVersion] = useState<UUIDVersion>("v4");
  const [count, setCount] = useState(1);
  const [uppercase, setUppercase] = useState(false);
  const [noDashes, setNoDashes] = useState(false);
  const [copied, setCopied] = useState<number | "all" | null>(null);
  const [validateInput, setValidateInput] = useState("");
  const [validationResult, setValidationResult] = useState<{
    valid: boolean;
    version: string;
    message: string;
  } | null>(null);

  // UUID v4: Random
  const generateV4 = useCallback((): string => {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    // Set version bits (0100 for v4)
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    // Set variant bits (10xx for RFC 4122)
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    return formatUUID(bytes);
  }, []);

  // UUID v1-like: Timestamp-based (browser approximation — no MAC address)
  const generateV1 = useCallback((): string => {
    const now = Date.now();
    // UUID epoch offset: Oct 15, 1582
    const uuidEpoch = BigInt("122192928000000000");
    const timestamp = BigInt(now) * BigInt(10000) + uuidEpoch;

    const timeLow = Number(timestamp & BigInt(0xffffffff));
    const timeMid = Number((timestamp >> BigInt(32)) & BigInt(0xffff));
    const timeHi = Number((timestamp >> BigInt(48)) & BigInt(0x0fff)) | 0x1000; // version 1

    const clockSeq = crypto.getRandomValues(new Uint16Array(1))[0] & 0x3fff | 0x8000;
    const node = crypto.getRandomValues(new Uint8Array(6));

    const hex = (n: number, len: number) => n.toString(16).padStart(len, "0");
    return [
      hex(timeLow, 8),
      hex(timeMid, 4),
      hex(timeHi, 4),
      hex(clockSeq, 4),
      Array.from(node).map((b) => hex(b, 2)).join(""),
    ].join("-");
  }, []);

  // Nil UUID
  const generateNil = useCallback((): string => {
    return "00000000-0000-0000-0000-000000000000";
  }, []);

  function formatUUID(bytes: Uint8Array): string {
    const hex = Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    return [
      hex.slice(0, 8),
      hex.slice(8, 12),
      hex.slice(12, 16),
      hex.slice(16, 20),
      hex.slice(20, 32),
    ].join("-");
  }

  const generate = useCallback(() => {
    const newUuids: GeneratedUUID[] = [];
    const generator =
      version === "v4" ? generateV4 : version === "v1" ? generateV1 : generateNil;

    for (let i = 0; i < count; i++) {
      let value = generator();
      if (uppercase) value = value.toUpperCase();
      if (noDashes) value = value.replace(/-/g, "");
      newUuids.push({ value, version, timestamp: Date.now() });
    }
    setUuids(newUuids);
    setCopied(null);
  }, [version, count, uppercase, noDashes, generateV4, generateV1, generateNil]);

  const copyOne = useCallback(
    async (index: number) => {
      if (!uuids[index]) return;
      await navigator.clipboard.writeText(uuids[index].value);
      setCopied(index);
      setTimeout(() => setCopied(null), 2000);
    },
    [uuids]
  );

  const copyAll = useCallback(async () => {
    if (uuids.length === 0) return;
    const text = uuids.map((u) => u.value).join("\n");
    await navigator.clipboard.writeText(text);
    setCopied("all");
    setTimeout(() => setCopied(null), 2000);
  }, [uuids]);

  const validateUUID = useCallback(() => {
    const input = validateInput.trim();
    if (!input) {
      setValidationResult(null);
      return;
    }

    // Standard UUID regex (with or without dashes)
    const withDashes = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const withoutDashes = /^[0-9a-f]{32}$/i;

    let normalized = input;
    if (withoutDashes.test(input)) {
      // Add dashes for analysis
      normalized = [
        input.slice(0, 8),
        input.slice(8, 12),
        input.slice(12, 16),
        input.slice(16, 20),
        input.slice(20, 32),
      ].join("-");
    }

    if (!withDashes.test(normalized) && !withoutDashes.test(input)) {
      setValidationResult({
        valid: false,
        version: "N/A",
        message: "Invalid UUID format. Expected 32 hex characters with or without dashes.",
      });
      return;
    }

    // Check nil
    if (normalized === "00000000-0000-0000-0000-000000000000") {
      setValidationResult({ valid: true, version: "Nil", message: "Valid Nil UUID." });
      return;
    }

    // Detect version from the 13th hex character
    const versionChar = normalized.charAt(14);
    const versionNum = parseInt(versionChar, 16);

    // Check variant (character at position 19)
    const variantChar = normalized.charAt(19);
    const variantNum = parseInt(variantChar, 16);
    const isRFC4122 = (variantNum & 0x8) === 0x8 && (variantNum & 0xc) !== 0xc;

    const versionNames: Record<number, string> = {
      1: "v1 (Timestamp)",
      2: "v2 (DCE Security)",
      3: "v3 (MD5 Name-Based)",
      4: "v4 (Random)",
      5: "v5 (SHA-1 Name-Based)",
      6: "v6 (Sortable Timestamp)",
      7: "v7 (Unix Epoch Timestamp)",
      8: "v8 (Custom)",
    };

    const detectedVersion = versionNames[versionNum] || `Unknown (${versionNum})`;

    if (!isRFC4122) {
      setValidationResult({
        valid: true,
        version: detectedVersion,
        message: `Valid UUID structure but non-standard variant (${variantChar}). RFC 4122 expects variant bits 10xx.`,
      });
      return;
    }

    setValidationResult({
      valid: true,
      version: detectedVersion,
      message: `Valid RFC 4122 UUID.`,
    });
  }, [validateInput]);

  return (
    <>
      <title>UUID Generator - Free Online Tool | DevTools Hub</title>
      <meta
        name="description"
        content="Generate UUIDs (v1, v4) online for free. Bulk generation, copy to clipboard, format options, and UUID validation. All processing in your browser."
      />
      <JsonLd
        data={[
          generateWebAppSchema({
            slug: "uuid-generator",
            name: "UUID Generator",
            description: "Generate random UUIDs (v4) and decode existing UUIDs with version and variant info",
            category: "developer",
          }),
          generateBreadcrumbSchema({
            slug: "uuid-generator",
            name: "UUID Generator",
            description: "Generate random UUIDs (v4) and decode existing UUIDs with version and variant info",
            category: "developer",
          }),
          generateFAQSchema([
            { question: "What is a UUID?", answer: "A UUID (Universally Unique Identifier) is a 128-bit identifier standardized by RFC 4122. UUIDs are designed to be unique across space and time without requiring a central authority, making them ideal for distributed systems, database primary keys, and session identifiers." },
            { question: "What is the difference between UUID v1 and v4?", answer: "UUID v1 is based on timestamp and node (typically MAC address), making it partially sequential and sortable. UUID v4 is entirely random, offering better uniqueness guarantees and no information leakage. For most applications, v4 is recommended." },
            { question: "How unique are UUIDs?", answer: "UUID v4 uses 122 random bits, giving approximately 5.3 x 10^36 possible values. The probability of generating a duplicate is astronomically low -- you would need to generate about 2.71 x 10^18 UUIDs to have a 50% chance of a single collision." },
            { question: "Is my data safe?", answer: "Yes. All UUIDs are generated entirely in your browser using the Web Crypto API (crypto.getRandomValues). No data is sent to any server. The source code runs client-side only." },
            { question: "What about UUID v6, v7, and v8?", answer: "UUID v6, v7, and v8 are newer versions defined in RFC 9562 (2024). v7 is particularly notable as it uses Unix timestamps for better database indexing. Our validator can detect these versions if you paste one in. Generation support for v7 is planned." },
          ]),
        ]}
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
              <li>
                <span className="mx-1">/</span>
              </li>
              <li>
                <a href="/tools" className="hover:text-white transition-colors">
                  Developer Tools
                </a>
              </li>
              <li>
                <span className="mx-1">/</span>
              </li>
              <li className="text-slate-200">UUID Generator</li>
            </ol>
          </nav>

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
              UUID Generator
            </h1>
            <p className="text-slate-400 max-w-2xl text-lg">
              Generate universally unique identifiers (UUIDs) instantly. Supports
              v1 (timestamp), v4 (random), and nil UUIDs with bulk generation and
              format options.
            </p>
          </div>

          {/* Generator Controls */}
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 mb-6">
            <div className="flex flex-wrap items-end gap-4 mb-4">
              {/* Version */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Version
                </label>
                <select
                  value={version}
                  onChange={(e) => setVersion(e.target.value as UUIDVersion)}
                  className="bg-slate-700 border border-slate-600 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="v4">v4 (Random)</option>
                  <option value="v1">v1 (Timestamp)</option>
                  <option value="nil">Nil (All Zeros)</option>
                </select>
              </div>

              {/* Count */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Count
                </label>
                <select
                  value={count}
                  onChange={(e) => setCount(Number(e.target.value))}
                  className="bg-slate-700 border border-slate-600 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {[1, 5, 10, 25, 50, 100].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </div>

              {/* Format options */}
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={uppercase}
                    onChange={(e) => setUppercase(e.target.checked)}
                    className="w-4 h-4 rounded bg-slate-700 border-slate-600 text-blue-500 focus:ring-blue-500"
                  />
                  Uppercase
                </label>
                <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={noDashes}
                    onChange={(e) => setNoDashes(e.target.checked)}
                    className="w-4 h-4 rounded bg-slate-700 border-slate-600 text-blue-500 focus:ring-blue-500"
                  />
                  No Dashes
                </label>
              </div>

              {/* Generate button */}
              <button
                onClick={generate}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                Generate
              </button>
            </div>

            {/* Version description */}
            <p className="text-xs text-slate-500">
              {version === "v4" &&
                "Version 4: Cryptographically random. Best for most use cases."}
              {version === "v1" &&
                "Version 1: Timestamp-based with random node. Sortable by creation time."}
              {version === "nil" &&
                "Nil UUID: All zeros. Used as a null/empty placeholder."}
            </p>
          </div>

          {/* Results */}
          {uuids.length > 0 && (
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-white">
                  Generated UUIDs ({uuids.length})
                </h2>
                <button
                  onClick={copyAll}
                  className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  {copied === "all" ? "Copied All!" : "Copy All"}
                </button>
              </div>

              <div className="space-y-1 max-h-96 overflow-y-auto">
                {uuids.map((uuid, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between bg-slate-900 rounded px-4 py-2 group"
                  >
                    <code className="text-sm font-mono text-slate-200 select-all">
                      {uuid.value}
                    </code>
                    <button
                      onClick={() => copyOne(i)}
                      className="text-xs text-slate-500 hover:text-white opacity-0 group-hover:opacity-100 transition-all ml-4 shrink-0"
                    >
                      {copied === i ? "Copied!" : "Copy"}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Validator */}
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 mb-6">
            <h2 className="text-lg font-semibold text-white mb-4">
              UUID Validator
            </h2>
            <div className="flex gap-3">
              <input
                type="text"
                value={validateInput}
                onChange={(e) => {
                  setValidateInput(e.target.value);
                  setValidationResult(null);
                }}
                onKeyDown={(e) => e.key === "Enter" && validateUUID()}
                placeholder="Paste a UUID to validate..."
                className="flex-1 bg-slate-900 border border-slate-600 rounded-lg px-4 py-2 font-mono text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                spellCheck={false}
              />
              <button
                onClick={validateUUID}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors shrink-0"
              >
                Validate
              </button>
            </div>

            {validationResult && (
              <div
                className={`mt-3 p-3 rounded-lg border text-sm ${
                  validationResult.valid
                    ? "bg-green-900/30 border-green-700 text-green-300"
                    : "bg-red-900/30 border-red-700 text-red-300"
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold">
                    {validationResult.valid ? "Valid" : "Invalid"}
                  </span>
                  {validationResult.valid && (
                    <span className="text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded">
                      {validationResult.version}
                    </span>
                  )}
                </div>
                <p>{validationResult.message}</p>
              </div>
            )}
          </div>

          <RelatedTools currentSlug="uuid-generator" />

          {/* FAQ Section */}
          <section className="mt-16 border-t border-slate-700 pt-10">
            <h2 className="text-2xl font-bold text-white mb-6">
              Frequently Asked Questions
            </h2>

            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  What is a UUID?
                </h3>
                <p className="text-slate-400">
                  A UUID (Universally Unique Identifier) is a 128-bit identifier
                  standardized by RFC 4122. UUIDs are designed to be unique across
                  space and time without requiring a central authority, making them
                  ideal for distributed systems, database primary keys, and session
                  identifiers.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  What is the difference between UUID v1 and v4?
                </h3>
                <p className="text-slate-400">
                  UUID v1 is based on timestamp and node (typically MAC address),
                  making it partially sequential and sortable. UUID v4 is entirely
                  random, offering better uniqueness guarantees and no information
                  leakage. For most applications, v4 is recommended.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  How unique are UUIDs?
                </h3>
                <p className="text-slate-400">
                  UUID v4 uses 122 random bits, giving approximately 5.3 x 10^36
                  possible values. The probability of generating a duplicate is
                  astronomically low — you would need to generate about 2.71 x
                  10^18 UUIDs to have a 50% chance of a single collision.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Is my data safe?
                </h3>
                <p className="text-slate-400">
                  Yes. All UUIDs are generated entirely in your browser using the
                  Web Crypto API (crypto.getRandomValues). No data is sent to any
                  server. The source code runs client-side only.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  What about UUID v6, v7, and v8?
                </h3>
                <p className="text-slate-400">
                  UUID v6, v7, and v8 are newer versions defined in RFC 9562
                  (2024). v7 is particularly notable as it uses Unix timestamps for
                  better database indexing. Our validator can detect these versions
                  if you paste one in. Generation support for v7 is planned.
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
