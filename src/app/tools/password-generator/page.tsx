"use client";

import { useState, useCallback, useEffect } from "react";

interface PasswordOptions {
  length: number;
  uppercase: boolean;
  lowercase: boolean;
  numbers: boolean;
  symbols: boolean;
  excludeAmbiguous: boolean;
  customSymbols: string;
}

const DEFAULT_SYMBOLS = "!@#$%^&*()_+-=[]{}|;:,.<>?";
const AMBIGUOUS_CHARS = "Il1O0o";

function generatePassword(options: PasswordOptions): string {
  let chars = "";
  const requiredChars: string[] = [];

  if (options.lowercase) {
    let lower = "abcdefghijklmnopqrstuvwxyz";
    if (options.excludeAmbiguous) lower = lower.replace(/[lo]/g, "");
    chars += lower;
    requiredChars.push(lower);
  }
  if (options.uppercase) {
    let upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    if (options.excludeAmbiguous) upper = upper.replace(/[IO]/g, "");
    chars += upper;
    requiredChars.push(upper);
  }
  if (options.numbers) {
    let nums = "0123456789";
    if (options.excludeAmbiguous) nums = nums.replace(/[01]/g, "");
    chars += nums;
    requiredChars.push(nums);
  }
  if (options.symbols) {
    const syms = options.customSymbols || DEFAULT_SYMBOLS;
    chars += syms;
    requiredChars.push(syms);
  }

  if (chars.length === 0) return "";

  const array = new Uint32Array(options.length);
  crypto.getRandomValues(array);

  const password = Array.from(array).map((n) => chars[n % chars.length]);

  // Ensure at least one character from each required set
  for (let i = 0; i < requiredChars.length && i < options.length; i++) {
    const setChars = requiredChars[i];
    const randomIndex = new Uint32Array(1);
    crypto.getRandomValues(randomIndex);
    password[i] = setChars[randomIndex[0] % setChars.length];
  }

  // Shuffle using Fisher-Yates
  for (let i = password.length - 1; i > 0; i--) {
    const randArr = new Uint32Array(1);
    crypto.getRandomValues(randArr);
    const j = randArr[0] % (i + 1);
    [password[i], password[j]] = [password[j], password[i]];
  }

  return password.join("");
}

function calculateEntropy(password: string, options: PasswordOptions): number {
  let poolSize = 0;
  if (options.lowercase) poolSize += options.excludeAmbiguous ? 24 : 26;
  if (options.uppercase) poolSize += options.excludeAmbiguous ? 24 : 26;
  if (options.numbers) poolSize += options.excludeAmbiguous ? 8 : 10;
  if (options.symbols) poolSize += (options.customSymbols || DEFAULT_SYMBOLS).length;
  if (poolSize === 0) return 0;
  return Math.floor(password.length * Math.log2(poolSize));
}

function getStrengthLabel(entropy: number): { label: string; color: string; bgColor: string; percent: number } {
  if (entropy < 28) return { label: "Very Weak", color: "text-red-400", bgColor: "bg-red-500", percent: 10 };
  if (entropy < 36) return { label: "Weak", color: "text-orange-400", bgColor: "bg-orange-500", percent: 25 };
  if (entropy < 60) return { label: "Fair", color: "text-yellow-400", bgColor: "bg-yellow-500", percent: 45 };
  if (entropy < 80) return { label: "Strong", color: "text-blue-400", bgColor: "bg-blue-500", percent: 70 };
  if (entropy < 128) return { label: "Very Strong", color: "text-green-400", bgColor: "bg-green-500", percent: 90 };
  return { label: "Excellent", color: "text-emerald-400", bgColor: "bg-emerald-500", percent: 100 };
}

function estimateCrackTime(entropy: number): string {
  // Assuming 10 billion guesses per second (modern GPU)
  const seconds = Math.pow(2, entropy) / 10_000_000_000;
  if (seconds < 0.001) return "Instant";
  if (seconds < 1) return "Less than a second";
  if (seconds < 60) return `${Math.round(seconds)} seconds`;
  if (seconds < 3600) return `${Math.round(seconds / 60)} minutes`;
  if (seconds < 86400) return `${Math.round(seconds / 3600)} hours`;
  if (seconds < 31536000) return `${Math.round(seconds / 86400)} days`;
  const years = seconds / 31536000;
  if (years < 1000) return `${Math.round(years)} years`;
  if (years < 1e6) return `${Math.round(years / 1000)}K years`;
  if (years < 1e9) return `${Math.round(years / 1e6)}M years`;
  if (years < 1e12) return `${Math.round(years / 1e9)}B years`;
  return `${years.toExponential(1)} years`;
}

export default function PasswordGeneratorPage() {
  const [options, setOptions] = useState<PasswordOptions>({
    length: 16,
    uppercase: true,
    lowercase: true,
    numbers: true,
    symbols: true,
    excludeAmbiguous: false,
    customSymbols: DEFAULT_SYMBOLS,
  });
  const [password, setPassword] = useState("");
  const [passwords, setPasswords] = useState<string[]>([]);
  const [bulkCount, setBulkCount] = useState(5);
  const [copied, setCopied] = useState<string | null>(null);
  const [showBulk, setShowBulk] = useState(false);

  const generate = useCallback(() => {
    const pw = generatePassword(options);
    setPassword(pw);
    setPasswords([]);
    setShowBulk(false);
  }, [options]);

  const generateBulk = useCallback(() => {
    const pws: string[] = [];
    for (let i = 0; i < bulkCount; i++) {
      pws.push(generatePassword(options));
    }
    setPasswords(pws);
    setShowBulk(true);
  }, [options, bulkCount]);

  useEffect(() => {
    generate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const copyText = useCallback(async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  }, []);

  const copyAllBulk = useCallback(async () => {
    const text = passwords.join("\n");
    await navigator.clipboard.writeText(text);
    setCopied("all-bulk");
    setTimeout(() => setCopied(null), 2000);
  }, [passwords]);

  const entropy = password ? calculateEntropy(password, options) : 0;
  const strength = getStrengthLabel(entropy);
  const crackTime = estimateCrackTime(entropy);

  const updateOption = <K extends keyof PasswordOptions>(key: K, value: PasswordOptions[K]) => {
    setOptions((prev) => ({ ...prev, [key]: value }));
  };

  const presets = [
    { label: "PIN (4 digits)", length: 4, upper: false, lower: false, nums: true, syms: false },
    { label: "Simple (8 chars)", length: 8, upper: true, lower: true, nums: true, syms: false },
    { label: "Strong (16 chars)", length: 16, upper: true, lower: true, nums: true, syms: true },
    { label: "Maximum (32 chars)", length: 32, upper: true, lower: true, nums: true, syms: true },
    { label: "Passphrase-length (64)", length: 64, upper: true, lower: true, nums: true, syms: false },
  ];

  return (
    <>
      <title>Password Generator - Free Secure Random Password Tool | DevTools Hub</title>
      <meta
        name="description"
        content="Generate cryptographically secure random passwords with customizable length, character sets, and strength analysis. All passwords generated in your browser using the Web Crypto API."
      />

      <div className="min-h-screen bg-slate-900 text-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Breadcrumb */}
          <nav className="text-sm text-slate-400 mb-6" aria-label="Breadcrumb">
            <ol className="flex items-center gap-2">
              <li>
                <a href="/" className="hover:text-white transition-colors">Home</a>
              </li>
              <li><span className="mx-1">/</span></li>
              <li>
                <a href="/tools" className="hover:text-white transition-colors">Developer Tools</a>
              </li>
              <li><span className="mx-1">/</span></li>
              <li className="text-slate-200">Password Generator</li>
            </ol>
          </nav>

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
              Password Generator
            </h1>
            <p className="text-slate-400 max-w-2xl text-lg">
              Generate cryptographically secure random passwords using the Web
              Crypto API. Customize length, character sets, and generate in bulk.
              Everything runs in your browser — no data is sent anywhere.
            </p>
          </div>

          {/* Generated Password Display */}
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 mb-6">
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-slate-300">
                Generated Password
              </label>
              <div className="flex items-center gap-2">
                <span className={`text-xs font-medium ${strength.color}`}>
                  {strength.label}
                </span>
                <span className="text-xs text-slate-500">
                  {entropy} bits entropy
                </span>
              </div>
            </div>

            <div className="bg-slate-900 rounded-lg px-4 py-3 mb-3 flex items-center gap-3">
              <code className="text-lg sm:text-xl font-mono text-green-400 break-all select-all flex-1 tracking-wide">
                {password || "Configure options below..."}
              </code>
              <button
                onClick={() => copyText(password, "main")}
                disabled={!password}
                className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded text-sm font-medium transition-colors disabled:opacity-40 shrink-0"
              >
                {copied === "main" ? "Copied!" : "Copy"}
              </button>
            </div>

            {/* Strength Bar */}
            <div className="h-2 bg-slate-700 rounded-full overflow-hidden mb-2">
              <div
                className={`h-full ${strength.bgColor} transition-all duration-300 rounded-full`}
                style={{ width: `${strength.percent}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-slate-500">
              <span>Crack time (10B guesses/sec): {crackTime}</span>
              <span>{password.length} characters</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <button
              onClick={generate}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              Generate Password
            </button>
            <button
              onClick={generateBulk}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors"
            >
              Generate {bulkCount} Passwords
            </button>
            <div className="flex items-center gap-2">
              <label className="text-sm text-slate-400">Bulk:</label>
              <select
                value={bulkCount}
                onChange={(e) => setBulkCount(Number(e.target.value))}
                className="bg-slate-800 border border-slate-600 rounded px-2 py-1 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {[5, 10, 20, 50].map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Options */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Length & Presets */}
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-5">
              <h2 className="text-sm font-semibold text-white mb-4">Length & Presets</h2>

              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm text-slate-300">Password Length</label>
                  <input
                    type="number"
                    min={1}
                    max={128}
                    value={options.length}
                    onChange={(e) => {
                      const v = Math.max(1, Math.min(128, Number(e.target.value) || 1));
                      updateOption("length", v);
                    }}
                    className="w-16 bg-slate-900 border border-slate-600 rounded px-2 py-1 text-sm text-center text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <input
                  type="range"
                  min={1}
                  max={128}
                  value={options.length}
                  onChange={(e) => updateOption("length", Number(e.target.value))}
                  className="w-full accent-blue-500"
                />
                <div className="flex justify-between text-xs text-slate-500 mt-1">
                  <span>1</span>
                  <span>32</span>
                  <span>64</span>
                  <span>128</span>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs text-slate-500 mb-1">Quick Presets</p>
                {presets.map((preset) => (
                  <button
                    key={preset.label}
                    onClick={() => {
                      setOptions((prev) => ({
                        ...prev,
                        length: preset.length,
                        uppercase: preset.upper,
                        lowercase: preset.lower,
                        numbers: preset.nums,
                        symbols: preset.syms,
                      }));
                    }}
                    className="block w-full text-left px-3 py-1.5 text-sm text-slate-300 hover:bg-slate-700 rounded transition-colors"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Character Sets */}
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-5">
              <h2 className="text-sm font-semibold text-white mb-4">Character Sets</h2>

              <div className="space-y-3">
                {[
                  { key: "lowercase" as const, label: "Lowercase (a-z)", sample: "abcdefghijklmnopqrstuvwxyz" },
                  { key: "uppercase" as const, label: "Uppercase (A-Z)", sample: "ABCDEFGHIJKLMNOPQRSTUVWXYZ" },
                  { key: "numbers" as const, label: "Numbers (0-9)", sample: "0123456789" },
                  { key: "symbols" as const, label: "Symbols (!@#$...)", sample: options.customSymbols },
                ].map((charSet) => (
                  <label key={charSet.key} className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={options[charSet.key]}
                      onChange={(e) => updateOption(charSet.key, e.target.checked)}
                      className="w-4 h-4 mt-0.5 rounded bg-slate-700 border-slate-600 text-blue-500 focus:ring-blue-500"
                    />
                    <div>
                      <span className="text-sm text-slate-200">{charSet.label}</span>
                      <p className="text-xs text-slate-500 font-mono break-all">{charSet.sample}</p>
                    </div>
                  </label>
                ))}

                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={options.excludeAmbiguous}
                    onChange={(e) => updateOption("excludeAmbiguous", e.target.checked)}
                    className="w-4 h-4 mt-0.5 rounded bg-slate-700 border-slate-600 text-blue-500 focus:ring-blue-500"
                  />
                  <div>
                    <span className="text-sm text-slate-200">Exclude ambiguous characters</span>
                    <p className="text-xs text-slate-500 font-mono">{AMBIGUOUS_CHARS}</p>
                  </div>
                </label>
              </div>

              {options.symbols && (
                <div className="mt-4">
                  <label className="text-xs text-slate-400 mb-1 block">Custom symbols</label>
                  <input
                    type="text"
                    value={options.customSymbols}
                    onChange={(e) => updateOption("customSymbols", e.target.value)}
                    className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-1.5 text-sm font-mono text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Bulk Passwords */}
          {showBulk && passwords.length > 0 && (
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-5 mb-6">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-white">
                  Bulk Passwords ({passwords.length})
                </h2>
                <button
                  onClick={copyAllBulk}
                  className="text-xs text-slate-400 hover:text-white transition-colors"
                >
                  {copied === "all-bulk" ? "Copied All!" : "Copy All"}
                </button>
              </div>
              <div className="space-y-1 max-h-64 overflow-y-auto">
                {passwords.map((pw, i) => (
                  <div key={i} className="flex items-center gap-2 bg-slate-900 rounded px-3 py-1.5">
                    <span className="text-xs text-slate-500 w-6 shrink-0">{i + 1}.</span>
                    <code className="text-sm font-mono text-green-400 break-all select-all flex-1">
                      {pw}
                    </code>
                    <button
                      onClick={() => copyText(pw, `bulk-${i}`)}
                      className="text-xs text-slate-400 hover:text-white transition-colors shrink-0"
                    >
                      {copied === `bulk-${i}` ? "Copied!" : "Copy"}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Password Tips */}
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 mb-6">
            <h2 className="text-lg font-semibold text-white mb-4">
              Password Security Guide
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-green-400">Do</h3>
                <ul className="space-y-1.5 text-sm text-slate-400">
                  <li>&#x2713; Use at least 12 characters</li>
                  <li>&#x2713; Mix uppercase, lowercase, numbers, and symbols</li>
                  <li>&#x2713; Use a unique password for every account</li>
                  <li>&#x2713; Use a password manager to store passwords</li>
                  <li>&#x2713; Enable two-factor authentication (2FA)</li>
                </ul>
              </div>
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-red-400">Don&apos;t</h3>
                <ul className="space-y-1.5 text-sm text-slate-400">
                  <li>&#x2717; Reuse passwords across accounts</li>
                  <li>&#x2717; Use personal info (names, birthdays, pets)</li>
                  <li>&#x2717; Use dictionary words or common patterns</li>
                  <li>&#x2717; Share passwords via email or messaging</li>
                  <li>&#x2717; Store passwords in plain text files</li>
                </ul>
              </div>
            </div>
          </div>

          {/* FAQ Section */}
          <section className="mt-16 border-t border-slate-700 pt-10">
            <h2 className="text-2xl font-bold text-white mb-6">
              Frequently Asked Questions
            </h2>

            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  How are these passwords generated?
                </h3>
                <p className="text-slate-400">
                  Passwords are generated using the Web Crypto API
                  (<code className="text-slate-300">crypto.getRandomValues()</code>),
                  which provides cryptographically secure random numbers. This is
                  the same randomness source used by TLS, SSH, and other security
                  protocols. No pseudo-random fallback is used.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Are my generated passwords stored or sent anywhere?
                </h3>
                <p className="text-slate-400">
                  No. All password generation happens entirely in your browser.
                  No passwords are transmitted over the network, stored in cookies,
                  or logged anywhere. You can verify this by using the tool offline
                  or inspecting network traffic in your browser&apos;s developer tools.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  How long should my password be?
                </h3>
                <p className="text-slate-400">
                  For most accounts, 16 characters with mixed character types
                  provides excellent security (80+ bits of entropy). For
                  high-security applications like master passwords or encryption
                  keys, use 20-32 characters. A 12-character password with all
                  character types is the minimum for reasonable security today.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  What does &ldquo;entropy&rdquo; mean?
                </h3>
                <p className="text-slate-400">
                  Entropy measures the randomness or unpredictability of a
                  password in bits. Each bit of entropy doubles the number of
                  possible passwords an attacker must try. A password with 80 bits
                  of entropy has 2^80 (about 1.2 septillion) possible combinations.
                  Higher entropy means a stronger password.
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
