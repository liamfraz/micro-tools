"use client";

import { useState, useCallback } from "react";
import JsonLd from "@/components/JsonLd";
import RelatedTools from "@/components/RelatedTools";
import ToolBreadcrumb from "@/components/ToolBreadcrumb";
import {
  generateFAQSchema,
  generateWebAppSchema,
  generateBreadcrumbSchema,
} from "@/lib/jsonld";

type PermClass = "owner" | "group" | "other";
type PermBit = "read" | "write" | "execute";

interface Permissions {
  owner: { read: boolean; write: boolean; execute: boolean };
  group: { read: boolean; write: boolean; execute: boolean };
  other: { read: boolean; write: boolean; execute: boolean };
}

const PRESETS: { label: string; numeric: string; desc: string }[] = [
  { label: "755", numeric: "755", desc: "Directories, executables" },
  { label: "644", numeric: "644", desc: "Regular files" },
  { label: "777", numeric: "777", desc: "Full access (insecure)" },
  { label: "600", numeric: "600", desc: "Private files" },
  { label: "700", numeric: "700", desc: "Private directories" },
  { label: "664", numeric: "664", desc: "Shared group files" },
  { label: "775", numeric: "775", desc: "Shared group directories" },
  { label: "400", numeric: "400", desc: "Read-only owner" },
];

const BIT_VALUES: Record<PermBit, number> = { read: 4, write: 2, execute: 1 };
const CLASSES: PermClass[] = ["owner", "group", "other"];
const BITS: PermBit[] = ["read", "write", "execute"];

function permToOctal(p: { read: boolean; write: boolean; execute: boolean }): number {
  return (p.read ? 4 : 0) + (p.write ? 2 : 0) + (p.execute ? 1 : 0);
}

function octalToPerms(n: number): { read: boolean; write: boolean; execute: boolean } {
  return { read: (n & 4) !== 0, write: (n & 2) !== 0, execute: (n & 1) !== 0 };
}

function permToSymbolic(p: { read: boolean; write: boolean; execute: boolean }): string {
  return (p.read ? "r" : "-") + (p.write ? "w" : "-") + (p.execute ? "x" : "-");
}

function defaultPerms(): Permissions {
  return {
    owner: { read: true, write: true, execute: true },
    group: { read: true, write: false, execute: true },
    other: { read: true, write: false, execute: true },
  };
}

export default function ChmodCalculatorPage() {
  const [perms, setPerms] = useState<Permissions>(defaultPerms);
  const [numericInput, setNumericInput] = useState("755");
  const [copied, setCopied] = useState<string | null>(null);

  const numeric = `${permToOctal(perms.owner)}${permToOctal(perms.group)}${permToOctal(perms.other)}`;
  const symbolic = `${permToSymbolic(perms.owner)}${permToSymbolic(perms.group)}${permToSymbolic(perms.other)}`;
  const chmodCmd = `chmod ${numeric} filename`;
  const chmodSymCmd = `chmod u=${permToSymbolic(perms.owner).replace(/-/g, "")},g=${permToSymbolic(perms.group).replace(/-/g, "")},o=${permToSymbolic(perms.other).replace(/-/g, "")} filename`;

  const toggleBit = useCallback((cls: PermClass, bit: PermBit) => {
    setPerms((prev) => {
      const next = {
        owner: { ...prev.owner },
        group: { ...prev.group },
        other: { ...prev.other },
      };
      next[cls][bit] = !next[cls][bit];
      const n = `${permToOctal(next.owner)}${permToOctal(next.group)}${permToOctal(next.other)}`;
      setNumericInput(n);
      return next;
    });
  }, []);

  const applyNumeric = useCallback((value: string) => {
    setNumericInput(value);
    if (!/^[0-7]{3}$/.test(value)) return;
    const digits = value.split("").map(Number);
    setPerms({
      owner: octalToPerms(digits[0]),
      group: octalToPerms(digits[1]),
      other: octalToPerms(digits[2]),
    });
  }, []);

  const applyPreset = useCallback((preset: string) => {
    applyNumeric(preset);
  }, [applyNumeric]);

  const copyText = useCallback(async (text: string, label: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  }, []);

  return (
    <>
      <title>
        Chmod Calculator — Unix File Permission Calculator Online Free | DevTools Hub
      </title>
      <meta
        name="description"
        content="Free chmod calculator. Convert between numeric (755, 644) and symbolic (rwxr-xr-x) Unix file permissions. Interactive checkbox grid, common presets, and ready-to-copy chmod commands."
      />
      <meta
        name="keywords"
        content="chmod calculator, linux permissions calculator, chmod 755 meaning, unix file permissions, chmod command generator, rwxr-xr-x, octal permissions, file permission calculator"
      />
      <JsonLd
        data={[
          generateWebAppSchema({
            slug: "chmod-calculator",
            name: "Chmod Calculator",
            description:
              "Convert between numeric and symbolic Unix file permissions with an interactive calculator. Common presets and ready-to-copy chmod commands.",
            category: "developer",
          }),
          generateBreadcrumbSchema({
            slug: "chmod-calculator",
            name: "Chmod Calculator",
            description:
              "Convert between numeric and symbolic Unix file permissions with an interactive calculator.",
            category: "developer",
          }),
          generateFAQSchema([
            {
              question: "What does chmod 755 mean?",
              answer:
                "chmod 755 sets owner to read/write/execute (7), group to read/execute (5), and others to read/execute (5). In symbolic notation this is rwxr-xr-x. It is the standard permission for directories and executable scripts.",
            },
            {
              question: "What does chmod 644 mean?",
              answer:
                "chmod 644 sets owner to read/write (6), group to read-only (4), and others to read-only (4). In symbolic notation this is rw-r--r--. It is the standard permission for regular files like HTML, CSS, and config files.",
            },
            {
              question: "What is the difference between numeric and symbolic chmod?",
              answer:
                "Numeric (octal) mode uses three digits (e.g., 755) where each digit represents owner, group, and other permissions. Each digit is the sum of read (4), write (2), and execute (1). Symbolic mode uses letters: r (read), w (write), x (execute) with u (user/owner), g (group), o (other).",
            },
            {
              question: "Is this chmod calculator safe to use?",
              answer:
                "Yes. This tool runs entirely in your browser. No data is sent to any server. It simply calculates permission values — it does not modify any files on your system.",
            },
            {
              question: "What are common chmod permission values?",
              answer:
                "The most common values are: 755 (directories and executables), 644 (regular files), 600 (private files like SSH keys), 700 (private directories), 777 (full access, generally insecure), and 664 (group-writable files).",
            },
          ]),
        ]}
      />

      <div className="min-h-screen bg-slate-900 text-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <ToolBreadcrumb slug="chmod-calculator" />

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
              Chmod Calculator
            </h1>
            <p className="text-slate-400 max-w-2xl text-lg">
              Interactive Unix file permission calculator. Toggle permissions with
              checkboxes or enter a numeric value. Get the chmod command
              ready to copy and paste.
            </p>
          </div>

          {/* Numeric Input */}
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 mb-6">
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Numeric (Octal) Value
            </label>
            <div className="flex items-center gap-4">
              <input
                type="text"
                value={numericInput}
                onChange={(e) => applyNumeric(e.target.value)}
                maxLength={3}
                className="w-32 bg-slate-900 border border-slate-600 rounded-lg px-4 py-3 font-mono text-3xl text-center text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="755"
                spellCheck={false}
              />
              <div className="text-lg font-mono text-slate-300">
                <span className="text-blue-400">{permToSymbolic(perms.owner)}</span>
                <span className="text-green-400">{permToSymbolic(perms.group)}</span>
                <span className="text-yellow-400">{permToSymbolic(perms.other)}</span>
              </div>
            </div>
            {numericInput.length > 0 && !/^[0-7]{3}$/.test(numericInput) && (
              <p className="text-red-400 text-sm mt-2">
                Enter exactly 3 octal digits (0-7)
              </p>
            )}
          </div>

          {/* Permission Grid */}
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 mb-6">
            <h2 className="text-lg font-semibold text-white mb-4">
              Permission Grid
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="text-left text-sm font-medium text-slate-400 pb-3 pr-6">
                      Class
                    </th>
                    {BITS.map((bit) => (
                      <th
                        key={bit}
                        className="text-center text-sm font-medium text-slate-400 pb-3 px-4"
                      >
                        {bit.charAt(0).toUpperCase() + bit.slice(1)}{" "}
                        <span className="text-slate-600">({BIT_VALUES[bit]})</span>
                      </th>
                    ))}
                    <th className="text-center text-sm font-medium text-slate-400 pb-3 px-4">
                      Octal
                    </th>
                    <th className="text-center text-sm font-medium text-slate-400 pb-3 px-4">
                      Symbolic
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {CLASSES.map((cls) => {
                    const colorMap: Record<PermClass, string> = {
                      owner: "text-blue-400",
                      group: "text-green-400",
                      other: "text-yellow-400",
                    };
                    return (
                      <tr key={cls} className="border-t border-slate-700">
                        <td className={`py-4 pr-6 font-medium capitalize ${colorMap[cls]}`}>
                          {cls === "owner" ? "Owner (u)" : cls === "group" ? "Group (g)" : "Other (o)"}
                        </td>
                        {BITS.map((bit) => (
                          <td key={bit} className="py-4 text-center px-4">
                            <button
                              onClick={() => toggleBit(cls, bit)}
                              className={`w-10 h-10 rounded-lg border-2 transition-all font-mono text-sm font-bold ${
                                perms[cls][bit]
                                  ? "bg-blue-600 border-blue-500 text-white"
                                  : "bg-slate-900 border-slate-600 text-slate-500 hover:border-slate-500"
                              }`}
                            >
                              {perms[cls][bit] ? bit.charAt(0) : "-"}
                            </button>
                          </td>
                        ))}
                        <td className="py-4 text-center px-4">
                          <span className="font-mono text-lg text-white">
                            {permToOctal(perms[cls])}
                          </span>
                        </td>
                        <td className="py-4 text-center px-4">
                          <span className={`font-mono text-lg ${colorMap[cls]}`}>
                            {permToSymbolic(perms[cls])}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Command Output */}
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 mb-6">
            <h2 className="text-lg font-semibold text-white mb-4">
              Chmod Command
            </h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between bg-slate-900 rounded-lg px-4 py-3">
                <code className="font-mono text-sm text-slate-200">
                  {chmodCmd}
                </code>
                <button
                  onClick={() => copyText(chmodCmd, "numeric")}
                  className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-medium transition-colors shrink-0 ml-4"
                >
                  {copied === "numeric" ? "Copied!" : "Copy"}
                </button>
              </div>
              <div className="flex items-center justify-between bg-slate-900 rounded-lg px-4 py-3">
                <code className="font-mono text-sm text-slate-200">
                  {chmodSymCmd}
                </code>
                <button
                  onClick={() => copyText(chmodSymCmd, "symbolic")}
                  className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-medium transition-colors shrink-0 ml-4"
                >
                  {copied === "symbolic" ? "Copied!" : "Copy"}
                </button>
              </div>
            </div>
          </div>

          {/* Presets */}
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 mb-6">
            <h2 className="text-lg font-semibold text-white mb-4">
              Common Presets
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  onClick={() => applyPreset(preset.numeric)}
                  className={`flex flex-col items-center p-3 rounded-lg border transition-all ${
                    numeric === preset.numeric
                      ? "bg-blue-600/20 border-blue-500 text-white"
                      : "bg-slate-900 border-slate-600 text-slate-300 hover:border-slate-500 hover:bg-slate-800"
                  }`}
                >
                  <span className="font-mono text-xl font-bold">{preset.label}</span>
                  <span className="text-xs text-slate-400 mt-1">{preset.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Permission Reference */}
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 mb-6">
            <h2 className="text-lg font-semibold text-white mb-4">
              Quick Reference
            </h2>
            <div className="grid sm:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium text-slate-400 mb-2">
                  Octal Values
                </h3>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between font-mono">
                    <span className="text-slate-300">4</span>
                    <span className="text-slate-400">Read (r)</span>
                  </div>
                  <div className="flex justify-between font-mono">
                    <span className="text-slate-300">2</span>
                    <span className="text-slate-400">Write (w)</span>
                  </div>
                  <div className="flex justify-between font-mono">
                    <span className="text-slate-300">1</span>
                    <span className="text-slate-400">Execute (x)</span>
                  </div>
                  <div className="flex justify-between font-mono border-t border-slate-700 pt-1 mt-1">
                    <span className="text-slate-300">7</span>
                    <span className="text-slate-400">Read + Write + Execute</span>
                  </div>
                  <div className="flex justify-between font-mono">
                    <span className="text-slate-300">6</span>
                    <span className="text-slate-400">Read + Write</span>
                  </div>
                  <div className="flex justify-between font-mono">
                    <span className="text-slate-300">5</span>
                    <span className="text-slate-400">Read + Execute</span>
                  </div>
                  <div className="flex justify-between font-mono">
                    <span className="text-slate-300">0</span>
                    <span className="text-slate-400">No permission</span>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-slate-400 mb-2">
                  Permission Classes
                </h3>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between font-mono">
                    <span className="text-blue-400">u (user)</span>
                    <span className="text-slate-400">File owner</span>
                  </div>
                  <div className="flex justify-between font-mono">
                    <span className="text-green-400">g (group)</span>
                    <span className="text-slate-400">Group members</span>
                  </div>
                  <div className="flex justify-between font-mono">
                    <span className="text-yellow-400">o (other)</span>
                    <span className="text-slate-400">Everyone else</span>
                  </div>
                  <div className="flex justify-between font-mono border-t border-slate-700 pt-1 mt-1">
                    <span className="text-slate-300">a (all)</span>
                    <span className="text-slate-400">All three classes</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <RelatedTools currentSlug="chmod-calculator" />

          {/* FAQ Section */}
          <section className="mt-16 border-t border-slate-700 pt-10">
            <h2 className="text-2xl font-bold text-white mb-6">
              Frequently Asked Questions
            </h2>

            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  What does chmod 755 mean?
                </h3>
                <p className="text-slate-400">
                  chmod 755 sets the owner to read, write, and execute (7), group
                  to read and execute (5), and others to read and execute (5). In
                  symbolic notation this is rwxr-xr-x. It is the standard
                  permission for directories and executable scripts on Linux and
                  macOS.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  What does chmod 644 mean?
                </h3>
                <p className="text-slate-400">
                  chmod 644 sets the owner to read and write (6), group to
                  read-only (4), and others to read-only (4). In symbolic notation
                  this is rw-r--r--. It is the standard permission for regular
                  files like HTML pages, CSS stylesheets, and configuration files.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  What is the difference between numeric and symbolic chmod?
                </h3>
                <p className="text-slate-400">
                  Numeric (octal) mode uses three digits (e.g., 755) where each
                  digit represents owner, group, and other permissions. Each digit
                  is the sum of read (4), write (2), and execute (1). Symbolic mode
                  uses letters: r (read), w (write), x (execute) combined with u
                  (user/owner), g (group), o (other) to set permissions more
                  granularly.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Is this chmod calculator safe to use?
                </h3>
                <p className="text-slate-400">
                  Yes. This tool runs entirely in your browser. No data is sent to
                  any server. It simply calculates permission values and generates
                  commands — it does not modify any files on your system.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  What are common chmod permission values?
                </h3>
                <p className="text-slate-400">
                  The most common values are: 755 for directories and executables,
                  644 for regular files, 600 for private files like SSH keys, 700
                  for private directories, 777 for full access (generally insecure),
                  and 664 for group-writable files.
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
