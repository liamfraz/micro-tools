"use client";

import { useState, useMemo, useCallback } from "react";
import JsonLd from "@/components/JsonLd";
import RelatedTools from "@/components/RelatedTools";
import ToolBreadcrumb from "@/components/ToolBreadcrumb";
import AdUnit from "@/components/AdUnit";
import {
  generateFAQSchema,
  generateWebAppSchema,
  generateBreadcrumbSchema,
} from "@/lib/jsonld";

const COMMON_PASSWORDS = [
  "password", "123456", "12345678", "qwerty", "abc123", "monkey", "master",
  "dragon", "111111", "baseball", "iloveyou", "trustno1", "sunshine",
  "letmein", "football", "shadow", "michael", "654321", "superman",
  "1234567890", "admin", "welcome", "login", "passw0rd", "starwars",
  "hello", "charlie", "donald", "password1", "qwerty123",
];

const COMMON_PATTERNS = [
  /^(.)\1+$/, // all same char
  /^(012|123|234|345|456|567|678|789|890)+$/,
  /^(098|987|876|765|654|543|432|321|210)+$/,
  /^(abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz)+$/i,
  /^(qwerty|asdf|zxcv)/i,
  /^[a-z]+\d{1,4}$/i, // word + short number like "mike123"
];

const KEYBOARD_ROWS = ["qwertyuiop", "asdfghjkl", "zxcvbnm"];

interface StrengthResult {
  score: number; // 0-4
  label: string;
  color: string;
  bgColor: string;
  entropy: number;
  crackTime: string;
  checks: Check[];
  suggestions: string[];
}

interface Check {
  label: string;
  passed: boolean;
}

function isKeyboardWalk(password: string): boolean {
  const lower = password.toLowerCase();
  if (lower.length < 4) return false;
  for (const row of KEYBOARD_ROWS) {
    for (let i = 0; i <= row.length - 4; i++) {
      const seq = row.slice(i, i + 4);
      if (lower.includes(seq) || lower.includes(seq.split("").reverse().join(""))) {
        return true;
      }
    }
  }
  return false;
}

function calculateEntropy(password: string): number {
  let poolSize = 0;
  if (/[a-z]/.test(password)) poolSize += 26;
  if (/[A-Z]/.test(password)) poolSize += 26;
  if (/[0-9]/.test(password)) poolSize += 10;
  if (/[^a-zA-Z0-9]/.test(password)) poolSize += 33;
  if (poolSize === 0) return 0;
  return password.length * Math.log2(poolSize);
}

function formatCrackTime(entropy: number): string {
  // Assume 10 billion guesses/second (modern GPU cluster)
  const guessesPerSecond = 1e10;
  const totalGuesses = Math.pow(2, entropy);
  const seconds = totalGuesses / guessesPerSecond / 2; // average case

  if (seconds < 0.001) return "Instant";
  if (seconds < 1) return "Less than a second";
  if (seconds < 60) return `${Math.round(seconds)} seconds`;
  if (seconds < 3600) return `${Math.round(seconds / 60)} minutes`;
  if (seconds < 86400) return `${Math.round(seconds / 3600)} hours`;
  if (seconds < 86400 * 365) return `${Math.round(seconds / 86400)} days`;
  if (seconds < 86400 * 365 * 1000) return `${Math.round(seconds / (86400 * 365))} years`;
  if (seconds < 86400 * 365 * 1e6) return `${Math.round(seconds / (86400 * 365 * 1000))}k years`;
  if (seconds < 86400 * 365 * 1e9) return `${Math.round(seconds / (86400 * 365 * 1e6))}M years`;
  return "Billions of years+";
}

function analyzePassword(password: string): StrengthResult {
  if (!password) {
    return {
      score: 0, label: "Enter a password", color: "text-slate-500",
      bgColor: "bg-slate-600", entropy: 0, crackTime: "—",
      checks: [], suggestions: [],
    };
  }

  const checks: Check[] = [
    { label: "At least 8 characters", passed: password.length >= 8 },
    { label: "At least 12 characters", passed: password.length >= 12 },
    { label: "Contains uppercase letter", passed: /[A-Z]/.test(password) },
    { label: "Contains lowercase letter", passed: /[a-z]/.test(password) },
    { label: "Contains number", passed: /[0-9]/.test(password) },
    { label: "Contains special character", passed: /[^a-zA-Z0-9]/.test(password) },
    { label: "Not a common password", passed: !COMMON_PASSWORDS.includes(password.toLowerCase()) },
    { label: "No keyboard walks (qwerty)", passed: !isKeyboardWalk(password) },
    { label: "No repeating patterns", passed: !COMMON_PATTERNS.some(p => p.test(password)) },
  ];

  const entropy = calculateEntropy(password);
  const crackTime = formatCrackTime(entropy);
  const passedCount = checks.filter(c => c.passed).length;

  const suggestions: string[] = [];
  if (password.length < 8) suggestions.push("Use at least 8 characters — 12+ is recommended");
  else if (password.length < 12) suggestions.push("Increase length to 12+ characters for better security");
  if (!/[A-Z]/.test(password)) suggestions.push("Add uppercase letters (A-Z)");
  if (!/[a-z]/.test(password)) suggestions.push("Add lowercase letters (a-z)");
  if (!/[0-9]/.test(password)) suggestions.push("Add numbers (0-9)");
  if (!/[^a-zA-Z0-9]/.test(password)) suggestions.push("Add special characters (!@#$%^&*)");
  if (COMMON_PASSWORDS.includes(password.toLowerCase())) suggestions.push("This is a commonly used password — choose something unique");
  if (isKeyboardWalk(password)) suggestions.push("Avoid keyboard patterns like 'qwerty' or 'asdf'");
  if (COMMON_PATTERNS.some(p => p.test(password))) suggestions.push("Avoid repeating characters and sequential patterns");
  if (password.length >= 12 && suggestions.length === 0) suggestions.push("Consider using a passphrase — multiple random words joined together");

  let score: number;
  if (COMMON_PASSWORDS.includes(password.toLowerCase()) || password.length < 6) {
    score = 0;
  } else if (entropy < 30 || passedCount < 4) {
    score = 1;
  } else if (entropy < 50 || passedCount < 6) {
    score = 2;
  } else if (entropy < 70 || passedCount < 8) {
    score = 3;
  } else {
    score = 4;
  }

  const labels = ["Weak", "Weak", "Fair", "Strong", "Very Strong"];
  const colors = ["text-red-400", "text-red-400", "text-yellow-400", "text-green-400", "text-emerald-400"];
  const bgColors = ["bg-red-500", "bg-red-500", "bg-yellow-500", "bg-green-500", "bg-emerald-500"];

  return {
    score, label: labels[score], color: colors[score], bgColor: bgColors[score],
    entropy, crackTime, checks, suggestions,
  };
}

function generateStrongPassword(): string {
  const lower = "abcdefghijklmnopqrstuvwxyz";
  const upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const nums = "0123456789";
  const syms = "!@#$%^&*()_+-=";
  const all = lower + upper + nums + syms;

  const array = new Uint32Array(16);
  crypto.getRandomValues(array);

  const password = Array.from(array).map(n => all[n % all.length]);

  // Ensure at least one from each set
  const sets = [lower, upper, nums, syms];
  const positions = new Uint32Array(sets.length);
  crypto.getRandomValues(positions);

  for (let i = 0; i < sets.length; i++) {
    const charArray = new Uint32Array(1);
    crypto.getRandomValues(charArray);
    password[i] = sets[i][charArray[0] % sets[i].length];
  }

  // Shuffle
  for (let i = password.length - 1; i > 0; i--) {
    const randArray = new Uint32Array(1);
    crypto.getRandomValues(randArray);
    const j = randArray[0] % (i + 1);
    [password[i], password[j]] = [password[j], password[i]];
  }

  return password.join("");
}

export default function PasswordStrengthCheckerPage() {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState(false);

  const result = useMemo(() => analyzePassword(password), [password]);

  const handleGenerate = useCallback(() => {
    const strong = generateStrongPassword();
    setPassword(strong);
    setShowPassword(true);
  }, []);

  const handleCopy = useCallback(async () => {
    if (!password) return;
    await navigator.clipboard.writeText(password);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [password]);

  return (
    <>
      <title>Password Strength Checker — How Strong Is My Password? | DevTools Hub</title>
      <meta
        name="description"
        content="Check how strong your password is with our free password strength checker. See entropy, estimated crack time, and get suggestions to improve weak passwords. 100% client-side — your password never leaves your browser."
      />
      <JsonLd
        data={[
          generateWebAppSchema({
            slug: "password-strength-checker",
            name: "Password Strength Checker",
            description: "Check how strong your password is. See entropy, estimated crack time, and get improvement suggestions. 100% client-side.",
            category: "generator",
          }),
          generateBreadcrumbSchema({
            slug: "password-strength-checker",
            name: "Password Strength Checker",
            description: "Check how strong your password is with entropy and crack time analysis",
            category: "generator",
          }),
          generateFAQSchema([
            { question: "How strong is my password?", answer: "Our tool checks your password against multiple criteria: length, character variety (uppercase, lowercase, numbers, special characters), common password lists, keyboard patterns, and sequential/repeating characters. It calculates entropy and estimates how long it would take to crack using a modern GPU cluster." },
            { question: "Is my password sent to a server?", answer: "No. All analysis is performed entirely in your browser using JavaScript. Your password never leaves your device, is never transmitted over the network, and is never stored anywhere. You can verify this by disconnecting from the internet and using the tool offline." },
            { question: "What is password entropy?", answer: "Entropy measures the randomness of a password in bits. Higher entropy means the password is harder to guess. A password with 40 bits of entropy has 2^40 (about 1 trillion) possible combinations. Experts recommend at least 60 bits for important accounts and 80+ bits for critical security." },
            { question: "How is crack time estimated?", answer: "Crack time is estimated assuming an attacker using a modern GPU cluster capable of 10 billion guesses per second. The calculation uses the password's entropy to determine the total number of possible combinations, then divides by the guess rate. The displayed time represents the average case (half of all possibilities)." },
          ]),
        ]}
      />

      <div className="min-h-screen bg-slate-900 text-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <ToolBreadcrumb slug="password-strength-checker" />

          <AdUnit slot="TOP_SLOT" format="horizontal" className="mb-6" />

          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
              Password Strength Checker
            </h1>
            <p className="text-slate-400 max-w-2xl text-lg">
              Check how strong your password is. Your password never leaves your
              browser — all analysis happens locally on your device.
            </p>
          </div>

          {/* Password Input */}
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 mb-6">
            <label htmlFor="password-input" className="block text-sm font-medium text-slate-300 mb-2">
              Enter your password
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  id="password-input"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Type or paste a password..."
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 pr-12 text-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck={false}
                />
                <button
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                      <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                      <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              </div>
              <button
                onClick={handleCopy}
                disabled={!password}
                className="px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-sm text-slate-300 hover:bg-slate-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                title="Copy password"
              >
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
            <div className="mt-3 flex gap-2">
              <button
                onClick={handleGenerate}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                Generate Strong Password
              </button>
              {password && (
                <button
                  onClick={() => { setPassword(""); setShowPassword(false); }}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm rounded-lg transition-colors"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Strength Meter */}
          {password && (
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 mb-6">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold text-white">Strength</h2>
                <span className={`text-lg font-bold ${result.color}`}>
                  {result.label}
                </span>
              </div>

              {/* Bar */}
              <div className="flex gap-1.5 mb-6">
                {[0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className={`h-2.5 flex-1 rounded-full transition-colors duration-300 ${
                      i <= result.score - 1 ? result.bgColor : "bg-slate-600"
                    }`}
                  />
                ))}
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
                <div className="bg-slate-700/50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-white">{Math.round(result.entropy)}</div>
                  <div className="text-xs text-slate-400 mt-1">Entropy (bits)</div>
                </div>
                <div className="bg-slate-700/50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-white">{password.length}</div>
                  <div className="text-xs text-slate-400 mt-1">Characters</div>
                </div>
                <div className="bg-slate-700/50 rounded-lg p-4 text-center sm:col-span-1 col-span-2">
                  <div className={`text-lg font-bold ${result.color}`}>{result.crackTime}</div>
                  <div className="text-xs text-slate-400 mt-1">Est. Crack Time</div>
                </div>
              </div>

              {/* Checks */}
              <h3 className="text-sm font-semibold text-slate-300 mb-3 uppercase tracking-wide">
                Requirements
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-6">
                {result.checks.map((check) => (
                  <div key={check.label} className="flex items-center gap-2 text-sm">
                    {check.passed ? (
                      <svg className="w-4 h-4 text-green-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4 text-red-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    )}
                    <span className={check.passed ? "text-slate-300" : "text-slate-400"}>
                      {check.label}
                    </span>
                  </div>
                ))}
              </div>

              {/* Suggestions */}
              {result.suggestions.length > 0 && result.score < 4 && (
                <>
                  <h3 className="text-sm font-semibold text-slate-300 mb-3 uppercase tracking-wide">
                    Suggestions
                  </h3>
                  <ul className="space-y-2">
                    {result.suggestions.map((s, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-yellow-300/80">
                        <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                        {s}
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          )}

          <AdUnit slot="MIDDLE_SLOT" format="rectangle" className="mb-6" />

          {/* Privacy Notice */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-5 mb-6">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
              <div>
                <h3 className="text-sm font-semibold text-white">100% Private &amp; Client-Side</h3>
                <p className="text-sm text-slate-400 mt-1">
                  Your password is never sent to any server. All strength analysis,
                  entropy calculation, and crack time estimation happens entirely
                  in your browser. You can disconnect from the internet and this
                  tool will still work.
                </p>
              </div>
            </div>
          </div>

          <RelatedTools currentSlug="password-strength-checker" />

          <AdUnit slot="BOTTOM_SLOT" format="auto" className="my-8" />

          {/* FAQ Section */}
          <section className="mt-16 border-t border-slate-700 pt-10">
            <h2 className="text-2xl font-bold text-white mb-6">
              Frequently Asked Questions
            </h2>
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  How strong is my password?
                </h3>
                <p className="text-slate-400">
                  Our tool checks your password against multiple criteria: length,
                  character variety (uppercase, lowercase, numbers, special
                  characters), common password lists, keyboard patterns, and
                  sequential/repeating characters. It calculates entropy and
                  estimates how long it would take to crack using a modern GPU
                  cluster.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Is my password sent to a server?
                </h3>
                <p className="text-slate-400">
                  No. All analysis is performed entirely in your browser using
                  JavaScript. Your password never leaves your device, is never
                  transmitted over the network, and is never stored anywhere. You
                  can verify this by disconnecting from the internet and using the
                  tool offline.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  What is password entropy?
                </h3>
                <p className="text-slate-400">
                  Entropy measures the randomness of a password in bits. Higher
                  entropy means the password is harder to guess. A password with
                  40 bits of entropy has 2^40 (about 1 trillion) possible
                  combinations. Experts recommend at least 60 bits for important
                  accounts and 80+ bits for critical security.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  How is crack time estimated?
                </h3>
                <p className="text-slate-400">
                  Crack time is estimated assuming an attacker using a modern GPU
                  cluster capable of 10 billion guesses per second. The
                  calculation uses the password&apos;s entropy to determine the
                  total number of possible combinations, then divides by the guess
                  rate. The displayed time represents the average case (half of
                  all possibilities).
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
