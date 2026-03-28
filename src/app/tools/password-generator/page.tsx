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

// Common English words for passphrase generation (EFF-inspired short wordlist)
const WORDLIST = [
  "acid", "acme", "aged", "also", "arch", "area", "army", "away",
  "back", "bail", "bake", "band", "bank", "barn", "base", "bath",
  "bead", "beam", "bean", "bear", "beat", "beef", "been", "bell",
  "belt", "bend", "best", "bike", "bind", "bird", "bite", "blow",
  "blue", "blur", "boat", "body", "bold", "bolt", "bomb", "bond",
  "bone", "book", "boot", "born", "boss", "bowl", "bulk", "bump",
  "burn", "busy", "cafe", "cage", "cake", "calm", "came", "camp",
  "cape", "card", "care", "cart", "case", "cash", "cast", "cave",
  "chef", "chin", "chip", "chop", "cite", "city", "clad", "clam",
  "clan", "clap", "claw", "clay", "clip", "club", "clue", "coal",
  "coat", "code", "coil", "coin", "cold", "cole", "colt", "come",
  "cone", "cook", "cool", "cope", "copy", "cord", "core", "cork",
  "corn", "cost", "cozy", "crop", "crow", "cube", "cult", "curb",
  "cure", "curl", "cute", "damp", "dare", "dark", "dart", "dash",
  "data", "dawn", "deal", "dean", "dear", "deck", "deed", "deem",
  "deep", "deer", "demo", "deny", "desk", "dial", "dice", "diet",
  "dire", "dirt", "disk", "dock", "does", "done", "doom", "door",
  "dose", "dove", "down", "draw", "drop", "drum", "dual", "duck",
  "duel", "duke", "dull", "dune", "dusk", "dust", "duty", "each",
  "earl", "earn", "ease", "east", "easy", "echo", "edge", "edit",
  "else", "emit", "epic", "euro", "even", "ever", "evil", "exam",
  "exit", "face", "fact", "fade", "fail", "fair", "fake", "fall",
  "fame", "fang", "fare", "farm", "fast", "fate", "fawn", "fear",
  "feat", "feed", "feel", "fell", "felt", "fern", "fest", "file",
  "fill", "film", "find", "fine", "fire", "firm", "fish", "fist",
  "five", "flag", "flat", "flaw", "fled", "flew", "flex", "flip",
  "flit", "flog", "flow", "foam", "foil", "fold", "folk", "fond",
  "font", "food", "fool", "foot", "ford", "fore", "fork", "form",
  "fort", "foul", "four", "free", "frog", "from", "fuel", "full",
  "fund", "fury", "fuse", "gain", "gale", "game", "gang", "gape",
  "garb", "gate", "gave", "gaze", "gear", "gene", "gift", "gild",
  "girl", "give", "glad", "glen", "glow", "glue", "goat", "goes",
  "gold", "golf", "gone", "good", "gore", "grab", "gram", "gray",
  "grew", "grid", "grim", "grin", "grip", "grit", "grow", "gulf",
  "guru", "gust", "hack", "hail", "hair", "hake", "half", "hall",
  "halt", "hand", "hang", "hare", "harp", "harm", "haste", "hate",
  "haul", "have", "haze", "head", "heal", "heap", "hear", "heat",
  "held", "helm", "help", "herb", "herd", "here", "hero", "hide",
  "high", "hike", "hill", "hint", "hire", "hold", "hole", "holy",
  "home", "hood", "hook", "hope", "horn", "host", "hour", "huge",
  "hull", "hung", "hunt", "hurt", "hush", "hymn", "icon", "idea",
  "inch", "info", "iron", "isle", "item", "jack", "jade", "jail",
  "jazz", "jean", "jerk", "jest", "jobs", "join", "joke", "jolt",
  "jump", "jury", "just", "keen", "keep", "kept", "kick", "kill",
  "kind", "king", "kiss", "kite", "knee", "knew", "knit", "knob",
  "knot", "know", "lace", "lack", "laid", "lake", "lamb", "lamp",
  "land", "lane", "lark", "last", "late", "lawn", "lead", "leaf",
  "leak", "lean", "leap", "left", "lend", "lens", "less", "lied",
  "lieu", "life", "lift", "like", "limb", "lime", "limp", "line",
  "link", "lion", "lips", "list", "live", "load", "loaf", "loan",
  "lock", "logo", "lone", "long", "look", "loop", "lord", "lore",
  "lose", "loss", "lost", "loud", "love", "luck", "lump", "lure",
  "lurk", "lush", "made", "mail", "main", "make", "male", "mall",
  "malt", "mane", "many", "maps", "mare", "mark", "mars", "mask",
  "mass", "mast", "mate", "maze", "meal", "mean", "meat", "meet",
  "meld", "melt", "memo", "mend", "menu", "mesh", "mild", "mile",
  "milk", "mill", "mime", "mind", "mine", "mint", "mist", "mode",
  "mold", "monk", "mood", "moon", "more", "moss", "most", "moth",
  "move", "much", "mule", "muse", "must", "myth", "nail", "name",
  "navy", "near", "neat", "neck", "need", "nest", "news", "next",
  "nice", "nine", "node", "none", "noon", "norm", "nose", "note",
  "noun", "nude", "oath", "obey", "odds", "oils", "okay", "once",
  "only", "onto", "open", "oral", "oven", "over", "pace", "pack",
  "page", "paid", "pain", "pair", "pale", "palm", "pane", "park",
  "part", "pass", "past", "path", "pave", "peak", "pear", "peel",
  "peer", "perk", "pest", "pick", "pier", "pile", "pine", "pink",
  "pipe", "pity", "plan", "play", "plea", "plod", "plot", "plow",
  "plug", "plum", "plus", "poem", "poet", "pole", "poll", "polo",
  "pond", "pool", "pope", "pork", "port", "pose", "post", "pour",
  "pray", "prey", "prop", "pull", "pulp", "pump", "punk", "pure",
  "push", "quit", "quiz", "race", "rack", "rage", "raid", "rail",
  "rain", "rake", "ramp", "rang", "rank", "rare", "rash", "rate",
  "rave", "rays", "read", "real", "reap", "rear", "reed", "reef",
  "reel", "rely", "rent", "rest", "rice", "rich", "ride", "rift",
  "ring", "riot", "rise", "risk", "road", "roam", "roar", "robe",
  "rock", "rode", "role", "roll", "roof", "room", "root", "rope",
  "rose", "ruin", "rule", "rush", "rust", "safe", "sage", "said",
  "sail", "sake", "sale", "salt", "same", "sand", "sang", "sank",
  "save", "scan", "seal", "seam", "seat", "seed", "seek", "seem",
  "seen", "self", "sell", "send", "sent", "sept", "shed", "shin",
  "ship", "shoe", "shop", "shot", "show", "shut", "side", "sigh",
  "sign", "silk", "sing", "sink", "site", "size", "skip", "slab",
  "slam", "slap", "slew", "slid", "slim", "slip", "slit", "slot",
  "slow", "slug", "snap", "snow", "soak", "soap", "soar", "sock",
  "soft", "soil", "sold", "sole", "solo", "some", "song", "soon",
  "sort", "soul", "sour", "span", "spar", "spec", "sped", "spin",
  "spit", "spot", "spur", "star", "stay", "stem", "step", "stew",
  "stir", "stop", "stow", "stub", "stud", "such", "suit", "sung",
  "sure", "surf", "swan", "swap", "swim", "tabs", "tack", "tail",
  "take", "tale", "talk", "tall", "tame", "tank", "tape", "taps",
  "tart", "task", "taxi", "team", "tear", "tell", "tend", "tent",
  "term", "test", "text", "that", "them", "then", "they", "thin",
  "this", "thou", "tick", "tide", "tidy", "tied", "tier", "tile",
  "till", "tilt", "time", "tiny", "tire", "toad", "toil", "told",
  "toll", "tomb", "tone", "took", "tool", "tops", "tore", "torn",
  "tour", "town", "trap", "tray", "tree", "trim", "trio", "trip",
  "trot", "true", "tube", "tuck", "tug", "tulip", "tune", "turn",
  "twin", "type", "ugly", "undo", "unit", "unto", "upon", "urge",
  "used", "user", "vain", "vale", "van", "vary", "vast", "veil",
  "vein", "vent", "verb", "very", "vest", "veto", "vibe", "view",
  "vine", "visa", "void", "volt", "vote", "wade", "wage", "wait",
  "wake", "walk", "wall", "wand", "ward", "warm", "warn", "warp",
  "wary", "wash", "vast", "wave", "wavy", "weak", "wear", "weed",
  "week", "well", "went", "were", "west", "what", "when", "whim",
  "whip", "whom", "wide", "wife", "wild", "will", "wilt", "wily",
  "wind", "wine", "wing", "wink", "wipe", "wire", "wise", "wish",
  "with", "woke", "wolf", "wood", "wool", "word", "wore", "work",
  "worm", "worn", "wrap", "writ", "yard", "yarn", "year", "yell",
  "yoga", "yoke", "your", "zeal", "zero", "zinc", "zone", "zoom",
];

const SEPARATORS = [
  { label: "Hyphen (-)", value: "-" },
  { label: "Space", value: " " },
  { label: "Period (.)", value: "." },
  { label: "Underscore (_)", value: "_" },
  { label: "Comma (,)", value: "," },
  { label: "None", value: "" },
];

function generatePassphrase(wordCount: number, separator: string): string {
  const array = new Uint32Array(wordCount);
  crypto.getRandomValues(array);
  return Array.from(array)
    .map((n) => WORDLIST[n % WORDLIST.length])
    .join(separator);
}

function calculatePassphraseEntropy(wordCount: number): number {
  return Math.floor(wordCount * Math.log2(WORDLIST.length));
}

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
  const [mode, setMode] = useState<"password" | "passphrase">("password");
  const [wordCount, setWordCount] = useState(4);
  const [separator, setSeparator] = useState("-");

  const generate = useCallback(() => {
    const pw = mode === "passphrase" ? generatePassphrase(wordCount, separator) : generatePassword(options);
    setPassword(pw);
    setPasswords([]);
    setShowBulk(false);
  }, [options, mode, wordCount, separator]);

  const generateBulk = useCallback(() => {
    const pws: string[] = [];
    for (let i = 0; i < bulkCount; i++) {
      pws.push(mode === "passphrase" ? generatePassphrase(wordCount, separator) : generatePassword(options));
    }
    setPasswords(pws);
    setShowBulk(true);
  }, [options, bulkCount, mode, wordCount, separator]);

  useEffect(() => {
    generate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, wordCount, separator]);

  const fallbackCopy = useCallback((text: string): boolean => {
    try {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      return true;
    } catch {
      return false;
    }
  }, []);

  const copyText = useCallback(async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      if (!fallbackCopy(text)) return;
    }
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  }, [fallbackCopy]);

  const copyAllBulk = useCallback(async () => {
    const text = passwords.join("\n");
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      if (!fallbackCopy(text)) return;
    }
    setCopied("all-bulk");
    setTimeout(() => setCopied(null), 2000);
  }, [passwords, fallbackCopy]);

  const entropy = password
    ? mode === "passphrase"
      ? calculatePassphraseEntropy(wordCount)
      : calculateEntropy(password, options)
    : 0;
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
      <title>Password Generator - Free Random Password &amp; Passphrase Generator | DevTools Hub</title>
      <meta
        name="description"
        content="Generate strong random passwords and passphrases with customizable length, character sets, and entropy-based strength analysis. Free online password generator using the Web Crypto API — no data sent anywhere."
      />
      <meta
        name="keywords"
        content="password generator, random password generator, strong password generator, secure password generator, passphrase generator, password strength meter, crypto random password"
      />
      <JsonLd
        data={[
          generateWebAppSchema({
            slug: "password-generator",
            name: "Password Generator",
            description: "Generate strong, random passwords with customizable length and character sets",
            category: "generator",
          }),
          generateBreadcrumbSchema({
            slug: "password-generator",
            name: "Password Generator",
            description: "Generate strong, random passwords with customizable length and character sets",
            category: "generator",
          }),
          generateFAQSchema([
            { question: "How are these passwords generated?", answer: "Passwords are generated using the Web Crypto API (crypto.getRandomValues()), which provides cryptographically secure random numbers. This is the same randomness source used by TLS, SSH, and other security protocols. No pseudo-random fallback is used." },
            { question: "Are my generated passwords stored or sent anywhere?", answer: "No. All password generation happens entirely in your browser. No passwords are transmitted over the network, stored in cookies, or logged anywhere. You can verify this by using the tool offline or inspecting network traffic in your browser's developer tools." },
            { question: "How long should my password be?", answer: "For most accounts, 16 characters with mixed character types provides excellent security (80+ bits of entropy). For high-security applications like master passwords or encryption keys, use 20-32 characters. A 12-character password with all character types is the minimum for reasonable security today." },
            { question: "What does \"entropy\" mean?", answer: "Entropy measures the randomness or unpredictability of a password in bits. Each bit of entropy doubles the number of possible passwords an attacker must try. A password with 80 bits of entropy has 2^80 (about 1.2 septillion) possible combinations. Higher entropy means a stronger password." },
            { question: "What is a passphrase and is it more secure?", answer: "A passphrase is a sequence of random words separated by hyphens (e.g., 'crane-bolt-mist-fork'). A 4-word passphrase from a large dictionary provides roughly 40-50 bits of entropy. While this is less than a 16-character random password, passphrases are much easier to memorize. For maximum security, use 6-8 words or combine a passphrase with numbers and symbols." },
          ]),
        ]}
      />

      <div className="min-h-screen bg-slate-900 text-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <ToolBreadcrumb slug="password-generator" />

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

          {/* Security Notice */}
          <div className="bg-green-900/20 border border-green-700/40 rounded-lg px-4 py-3 mb-6 flex items-center gap-3">
            <svg className="w-5 h-5 text-green-400 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
            </svg>
            <p className="text-sm text-green-300">
              <strong>Generated entirely in your browser.</strong> No passwords are stored or transmitted. Uses the Web Crypto API for cryptographic randomness.
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
                {[1, 5, 10, 15, 20].map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Mode Toggle */}
          <div className="flex items-center gap-1 bg-slate-800 border border-slate-700 rounded-lg p-1 mb-6 w-fit">
            <button
              onClick={() => { setMode("password"); }}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                mode === "password"
                  ? "bg-blue-600 text-white"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Password
            </button>
            <button
              onClick={() => { setMode("passphrase"); }}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                mode === "passphrase"
                  ? "bg-blue-600 text-white"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Passphrase
            </button>
          </div>

          {/* Passphrase Options */}
          {mode === "passphrase" && (
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-5 mb-6">
              <h2 className="text-sm font-semibold text-white mb-4">Passphrase Options</h2>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm text-slate-300">Number of Words</label>
                <input
                  type="number"
                  min={4}
                  max={8}
                  value={wordCount}
                  onChange={(e) => {
                    const v = Math.max(4, Math.min(8, Number(e.target.value) || 4));
                    setWordCount(v);
                  }}
                  className="w-16 bg-slate-900 border border-slate-600 rounded px-2 py-1 text-sm text-center text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <input
                type="range"
                min={4}
                max={8}
                value={wordCount}
                onChange={(e) => setWordCount(Number(e.target.value))}
                className="w-full accent-blue-500"
              />
              <div className="flex justify-between text-xs text-slate-500 mt-1">
                <span>4 words</span>
                <span>6 words</span>
                <span>8 words</span>
              </div>
              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm text-slate-300">Word Separator</label>
                  <select
                    value={separator}
                    onChange={(e) => setSeparator(e.target.value)}
                    className="bg-slate-900 border border-slate-600 rounded px-2 py-1 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {SEPARATORS.map((sep) => (
                      <option key={sep.label} value={sep.value}>{sep.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <p className="text-xs text-slate-500 mt-3">
                Passphrases use random dictionary words with your chosen separator. They are
                easier to remember while providing strong security through length and randomness.
              </p>
            </div>
          )}

          {/* Options */}
          {mode === "password" && <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Length & Presets */}
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-5">
              <h2 className="text-sm font-semibold text-white mb-4">Length & Presets</h2>

              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm text-slate-300">Password Length</label>
                  <input
                    type="number"
                    min={8}
                    max={128}
                    value={options.length}
                    onChange={(e) => {
                      const v = Math.max(8, Math.min(128, Number(e.target.value) || 8));
                      updateOption("length", v);
                    }}
                    className="w-16 bg-slate-900 border border-slate-600 rounded px-2 py-1 text-sm text-center text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <input
                  type="range"
                  min={8}
                  max={128}
                  value={options.length}
                  onChange={(e) => updateOption("length", Number(e.target.value))}
                  className="w-full accent-blue-500"
                />
                <div className="flex justify-between text-xs text-slate-500 mt-1">
                  <span>8</span>
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
          </div>}

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

          <RelatedTools currentSlug="password-generator" />

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

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  What is a passphrase and is it more secure?
                </h3>
                <p className="text-slate-400">
                  A passphrase is a sequence of random words separated by hyphens
                  (e.g., &ldquo;crane-bolt-mist-fork&rdquo;). A 4-word passphrase
                  from a large dictionary provides roughly 40-50 bits of entropy.
                  While this is less than a 16-character random password, passphrases
                  are much easier to memorize. For maximum security, use 6-8 words
                  or combine a passphrase with numbers and symbols.
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
