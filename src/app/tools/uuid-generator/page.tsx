"use client";

import { useState, useCallback, useEffect } from "react";
import JsonLd from "@/components/JsonLd";
import RelatedTools from "@/components/RelatedTools";
import ToolBreadcrumb from "@/components/ToolBreadcrumb";
import {
  generateFAQSchema,
  generateWebAppSchema,
  generateBreadcrumbSchema,
} from "@/lib/jsonld";

type UUIDVersion = "v4" | "v1" | "v7" | "nil";

interface GeneratedUUID {
  value: string;
  version: UUIDVersion;
  timestamp: number;
}

function formatBytes(bytes: Uint8Array): string {
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

function generateV4(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  return formatBytes(bytes);
}

function generateV1(): string {
  const now = Date.now();
  const uuidEpoch = BigInt("122192928000000000");
  const timestamp = BigInt(now) * BigInt(10000) + uuidEpoch;

  const timeLow = Number(timestamp & BigInt(0xffffffff));
  const timeMid = Number((timestamp >> BigInt(32)) & BigInt(0xffff));
  const timeHi =
    Number((timestamp >> BigInt(48)) & BigInt(0x0fff)) | 0x1000;

  const clockSeq =
    (crypto.getRandomValues(new Uint16Array(1))[0] & 0x3fff) | 0x8000;
  const node = crypto.getRandomValues(new Uint8Array(6));

  const hex = (n: number, len: number) => n.toString(16).padStart(len, "0");
  return [
    hex(timeLow, 8),
    hex(timeMid, 4),
    hex(timeHi, 4),
    hex(clockSeq, 4),
    Array.from(node)
      .map((b) => hex(b, 2))
      .join(""),
  ].join("-");
}

function generateV7(): string {
  const now = Date.now();
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);

  // First 48 bits: Unix timestamp in milliseconds (big-endian)
  bytes[0] = (now / 2 ** 40) & 0xff;
  bytes[1] = (now / 2 ** 32) & 0xff;
  bytes[2] = (now / 2 ** 24) & 0xff;
  bytes[3] = (now / 2 ** 16) & 0xff;
  bytes[4] = (now / 2 ** 8) & 0xff;
  bytes[5] = now & 0xff;

  // Set version 7 (0111)
  bytes[6] = (bytes[6] & 0x0f) | 0x70;
  // Set variant (10xx)
  bytes[8] = (bytes[8] & 0x3f) | 0x80;

  return formatBytes(bytes);
}

function generateNil(): string {
  return "00000000-0000-0000-0000-000000000000";
}

const GENERATORS: Record<UUIDVersion, () => string> = {
  v4: generateV4,
  v1: generateV1,
  v7: generateV7,
  nil: generateNil,
};

const VERSION_DESCRIPTIONS: Record<UUIDVersion, string> = {
  v4: "Version 4: Cryptographically random. Best for most use cases.",
  v1: "Version 1: Timestamp-based with random node. Sortable by creation time.",
  v7: "Version 7: Unix epoch timestamp + random. Sortable and database-friendly (RFC 9562).",
  nil: "Nil UUID: All zeros. Used as a null/empty placeholder.",
};

const BULK_OPTIONS = [1, 5, 10, 25, 50, 100, 250, 500, 1000];

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

  const generate = useCallback(() => {
    const generator = GENERATORS[version];
    const newUuids: GeneratedUUID[] = [];
    for (let i = 0; i < count; i++) {
      let value = generator();
      if (uppercase) value = value.toUpperCase();
      if (noDashes) value = value.replace(/-/g, "");
      newUuids.push({ value, version, timestamp: Date.now() });
    }
    setUuids(newUuids);
    setCopied(null);
  }, [version, count, uppercase, noDashes]);

  // Auto-generate one UUID on mount
  useEffect(() => {
    generate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const downloadAsText = useCallback(() => {
    if (uuids.length === 0) return;
    const text = uuids.map((u) => u.value).join("\n");
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `uuids-${version}-${uuids.length}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }, [uuids, version]);

  const validateUUID = useCallback(() => {
    const input = validateInput.trim();
    if (!input) {
      setValidationResult(null);
      return;
    }

    const withDashes =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const withoutDashes = /^[0-9a-f]{32}$/i;

    let normalized = input;
    if (withoutDashes.test(input)) {
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
        message:
          "Invalid UUID format. Expected 32 hex characters with or without dashes.",
      });
      return;
    }

    if (normalized === "00000000-0000-0000-0000-000000000000") {
      setValidationResult({
        valid: true,
        version: "Nil",
        message: "Valid Nil UUID.",
      });
      return;
    }

    const versionChar = normalized.charAt(14);
    const versionNum = parseInt(versionChar, 16);

    const variantChar = normalized.charAt(19);
    const variantNum = parseInt(variantChar, 16);
    const isRFC4122 =
      (variantNum & 0x8) === 0x8 && (variantNum & 0xc) !== 0xc;

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

    const detectedVersion =
      versionNames[versionNum] || `Unknown (${versionNum})`;

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
      message: "Valid RFC 4122 UUID.",
    });
  }, [validateInput]);

  return (
    <>
      <title>
        UUID Generator - Generate UUID v4, v1, v7 Online Free | DevTools Hub
      </title>
      <meta
        name="description"
        content="Free online UUID generator. Generate UUID v4 (random), v1 (timestamp), v7 (sortable) instantly. Bulk generate up to 1000 UUIDs, copy, download, and validate. No server — 100% client-side."
      />
      <meta
        name="keywords"
        content="uuid generator, generate uuid, uuid v4 generator, bulk uuid generator, uuid v7, uuid v1, uuid validator, random uuid, unique identifier"
      />
      <JsonLd
        data={[
          generateWebAppSchema({
            slug: "uuid-generator",
            name: "UUID Generator",
            description:
              "Generate UUID v4, v1, v7 online. Bulk generation up to 1000, format options, copy, download, and validation.",
            category: "generator",
          }),
          generateBreadcrumbSchema({
            slug: "uuid-generator",
            name: "UUID Generator",
            description:
              "Generate UUID v4, v1, v7 online. Bulk generation up to 1000, format options, copy, download, and validation.",
            category: "generator",
          }),
          generateFAQSchema([
            {
              question: "What is a UUID?",
              answer:
                "A UUID (Universally Unique Identifier) is a 128-bit identifier standardized by RFC 4122. UUIDs are designed to be unique across space and time without requiring a central authority, making them ideal for distributed systems, database primary keys, and session identifiers.",
            },
            {
              question: "What is the difference between UUID v1, v4, and v7?",
              answer:
                "UUID v1 uses a timestamp and node (MAC address), making it partially sequential. UUID v4 is entirely random with 122 bits of entropy — best for most applications. UUID v7 (RFC 9562) combines a Unix timestamp with randomness, giving you both sortability and uniqueness — ideal for database primary keys.",
            },
            {
              question: "How unique are UUIDs?",
              answer:
                "UUID v4 uses 122 random bits, giving approximately 5.3 x 10^36 possible values. The probability of generating a duplicate is astronomically low — you would need to generate about 2.71 x 10^18 UUIDs to have a 50% chance of a single collision.",
            },
            {
              question: "Is my data safe?",
              answer:
                "Yes. All UUIDs are generated entirely in your browser using the Web Crypto API (crypto.getRandomValues). No data is sent to any server. The source code runs client-side only.",
            },
            {
              question: "When should I use UUID v7?",
              answer:
                "UUID v7 is ideal when you need sortable, time-ordered unique identifiers — for example, database primary keys where insert performance and chronological ordering matter. Defined in RFC 9562 (2024), v7 embeds a Unix millisecond timestamp in the first 48 bits followed by random data.",
            },
            {
              question: "Can I generate UUIDs in bulk?",
              answer:
                "Yes. This tool supports generating up to 1,000 UUIDs at once. Select your desired count from the dropdown, click Generate, then use Copy All or Download as Text to export them.",
            },
          ]),
        ]}
      />

      <div className="min-h-screen bg-slate-900 text-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <ToolBreadcrumb slug="uuid-generator" />

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
              UUID Generator
            </h1>
            <p className="text-slate-400 max-w-2xl text-lg">
              Generate universally unique identifiers instantly. Supports v1
              (timestamp), v4 (random), and v7 (sortable) UUIDs with bulk
              generation up to 1,000, format options, and validation.
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
                  <option value="v7">v7 (Sortable)</option>
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
                  {BULK_OPTIONS.map((n) => (
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
                  No Hyphens
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
              {VERSION_DESCRIPTIONS[version]}
            </p>
          </div>

          {/* Results */}
          {uuids.length > 0 && (
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-white">
                  Generated UUIDs ({uuids.length})
                </h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={downloadAsText}
                    className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    Download .txt
                  </button>
                  <button
                    onClick={copyAll}
                    className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    {copied === "all" ? "Copied All!" : "Copy All"}
                  </button>
                </div>
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
                  A UUID (Universally Unique Identifier) is a 128-bit
                  identifier standardized by RFC 4122. UUIDs are designed to be
                  unique across space and time without requiring a central
                  authority, making them ideal for distributed systems, database
                  primary keys, and session identifiers.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  What is the difference between UUID v1, v4, and v7?
                </h3>
                <p className="text-slate-400">
                  UUID v1 is based on timestamp and node (typically MAC
                  address), making it partially sequential and sortable. UUID v4
                  is entirely random, offering better uniqueness guarantees and
                  no information leakage. UUID v7 (RFC 9562) combines a Unix
                  millisecond timestamp with randomness — it is sortable,
                  database-friendly, and the recommended choice for new systems
                  that need time-ordered IDs.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  How unique are UUIDs?
                </h3>
                <p className="text-slate-400">
                  UUID v4 uses 122 random bits, giving approximately 5.3 x
                  10^36 possible values. The probability of generating a
                  duplicate is astronomically low — you would need to generate
                  about 2.71 x 10^18 UUIDs to have a 50% chance of a single
                  collision.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Is my data safe?
                </h3>
                <p className="text-slate-400">
                  Yes. All UUIDs are generated entirely in your browser using
                  the Web Crypto API (crypto.getRandomValues). No data is sent
                  to any server. The source code runs client-side only.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  When should I use UUID v7?
                </h3>
                <p className="text-slate-400">
                  UUID v7 is ideal when you need sortable, time-ordered unique
                  identifiers — for example, database primary keys where insert
                  performance and chronological ordering matter. Defined in RFC
                  9562 (2024), v7 embeds a Unix millisecond timestamp in the
                  first 48 bits followed by random data.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Can I generate UUIDs in bulk?
                </h3>
                <p className="text-slate-400">
                  Yes. This tool supports generating up to 1,000 UUIDs at once.
                  Select your desired count from the dropdown, click Generate,
                  then use Copy All or Download as Text to export them.
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
