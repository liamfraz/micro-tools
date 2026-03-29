"use client";

import { useState, useMemo, useCallback } from "react";
import JsonLd from "@/components/JsonLd";
import RelatedTools from "@/components/RelatedTools";
import ToolBreadcrumb from "@/components/ToolBreadcrumb";
import {
  generateFAQSchema,
  generateWebAppSchema,
  generateBreadcrumbSchema,
} from "@/lib/jsonld";

const BUSINESS_TYPES = [
  "General",
  "Tech",
  "Food",
  "Health",
  "Fashion",
  "Finance",
  "Creative",
  "Education",
  "Consulting",
  "Real Estate",
] as const;

const STYLES = [
  "Professional",
  "Creative",
  "Modern",
  "Playful",
  "Elegant",
  "Bold",
] as const;

const LENGTH_OPTIONS = ["Short", "Medium", "Long"] as const;

const PREFIXES: Record<string, string[]> = {
  Professional: ["Pro", "Prime", "Apex", "Elite", "Premier", "Summit", "Pinnacle", "Sterling"],
  Creative: ["Vivid", "Spark", "Bloom", "Muse", "Flair", "Whimsy", "Lush", "Bright"],
  Modern: ["Neo", "Nova", "Sync", "Flux", "Zen", "Pixel", "Aero", "Quantum"],
  Playful: ["Happy", "Buzz", "Pop", "Jolly", "Sunny", "Zippy", "Snappy", "Lucky"],
  Elegant: ["Luxe", "Aura", "Crest", "Regal", "Opulent", "Ivory", "Velvet", "Grace"],
  Bold: ["Titan", "Iron", "Blaze", "Fierce", "Volt", "Thunder", "Forge", "Vanguard"],
};

const SUFFIXES: Record<string, string[]> = {
  Professional: ["Co", "Group", "Partners", "Solutions", "Associates", "Advisors", "Global", "Corp"],
  Creative: ["Studio", "Collective", "Lab", "Works", "Workshop", "House", "Atelier", "Den"],
  Modern: ["Hub", "HQ", "IO", "App", "Tech", "Digital", "Cloud", "Base"],
  Playful: ["Box", "Spot", "Zone", "Nest", "Hive", "Pod", "Club", "Crew"],
  Elegant: ["Maison", "Boutique", "Gallery", "Salon", "Estate", "Manor", "Suite", "Pavilion"],
  Bold: ["Force", "Forge", "Works", "Engine", "Machine", "Labs", "Core", "Command"],
};

const INDUSTRY_WORDS: Record<string, string[]> = {
  General: ["venture", "bridge", "path", "link", "wave", "rise", "shift", "arc"],
  Tech: ["byte", "code", "data", "logic", "stack", "node", "algo", "cipher"],
  Food: ["taste", "flavor", "spice", "harvest", "feast", "savory", "grain", "blend"],
  Health: ["vita", "pulse", "heal", "well", "glow", "thrive", "balance", "nurture"],
  Fashion: ["thread", "stitch", "weave", "drape", "style", "chic", "trend", "loom"],
  Finance: ["capital", "ledger", "equity", "wealth", "asset", "yield", "trust", "mint"],
  Creative: ["canvas", "palette", "vision", "dream", "craft", "design", "muse", "hue"],
  Education: ["scholar", "learn", "mentor", "wisdom", "quest", "beacon", "chapter", "sage"],
  Consulting: ["insight", "strategy", "scope", "clarity", "guide", "nexus", "pivot", "lens"],
  "Real Estate": ["haven", "estate", "manor", "dwelling", "hearth", "summit", "terrace", "vista"],
};

const CONNECTOR_WORDS = ["and", "&", "plus", "with", "of", "the"];
const ALLITERATIVE_STARTERS = ["Alpha", "Beta", "Bright", "Blue", "Bold", "Craft", "Clear", "Core", "Dawn", "Delta", "Edge", "Ever", "First", "Flow", "Gold", "Grand", "High", "Key", "Light", "Meta", "Next", "Peak", "Pure", "Quick", "Rise", "Swift", "True", "Ultra", "Wise", "Zero"];

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash + char) | 0;
  }
  return Math.abs(hash);
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

function createPortmanteau(word1: string, word2: string): string {
  const mid1 = Math.ceil(word1.length / 2);
  const mid2 = Math.floor(word2.length / 2);
  return capitalize(word1.slice(0, mid1) + word2.slice(mid2));
}

function shuffle<T>(arr: T[], rand: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function generateNames(
  keywords: string,
  businessType: string,
  style: string,
  lengthPref: string,
  seed: number
): { name: string; tag: string }[] {
  const rand = seededRandom(seed);
  const names: { name: string; tag: string }[] = [];
  const seen = new Set<string>();

  const addName = (name: string, tag: string) => {
    const key = name.toLowerCase();
    if (!seen.has(key) && name.trim().length > 1) {
      seen.add(key);
      names.push({ name, tag });
    }
  };

  const kw = keywords.trim();
  const kwParts = kw
    .split(/[\s,]+/)
    .filter(Boolean)
    .map((w) => capitalize(w));
  const primaryKw = kwParts[0] || "";

  const prefixes = PREFIXES[style] || PREFIXES.Professional;
  const suffixes = SUFFIXES[style] || SUFFIXES.Professional;
  const industryWords = INDUSTRY_WORDS[businessType] || INDUSTRY_WORDS.General;

  const shuffledPrefixes = shuffle(prefixes, rand);
  const shuffledSuffixes = shuffle(suffixes, rand);
  const shuffledIndustry = shuffle(industryWords, rand);

  // Strategy 1: Prefix + Keyword
  for (let i = 0; i < 3 && primaryKw; i++) {
    addName(`${shuffledPrefixes[i % shuffledPrefixes.length]} ${primaryKw}`, style);
  }

  // Strategy 2: Keyword + Suffix
  for (let i = 0; i < 3 && primaryKw; i++) {
    addName(`${primaryKw} ${shuffledSuffixes[i % shuffledSuffixes.length]}`, style);
  }

  // Strategy 3: Portmanteaus
  if (primaryKw && primaryKw.length >= 3) {
    for (let i = 0; i < 3; i++) {
      const indWord = shuffledIndustry[i % shuffledIndustry.length];
      addName(createPortmanteau(primaryKw, indWord), "Creative");
      addName(createPortmanteau(indWord, primaryKw), "Creative");
    }
  }

  // Strategy 4: Industry word + Suffix
  for (let i = 0; i < 3; i++) {
    const indWord = capitalize(shuffledIndustry[i % shuffledIndustry.length]);
    const suf = shuffledSuffixes[(i + 3) % shuffledSuffixes.length];
    addName(`${indWord} ${suf}`, style);
  }

  // Strategy 5: Prefix + Industry word
  for (let i = 0; i < 3; i++) {
    const pre = shuffledPrefixes[(i + 3) % shuffledPrefixes.length];
    const indWord = capitalize(shuffledIndustry[(i + 3) % shuffledIndustry.length]);
    addName(`${pre} ${indWord}`, style);
  }

  // Strategy 6: Alliterative names
  if (primaryKw) {
    const firstLetter = primaryKw.charAt(0).toUpperCase();
    const matching = ALLITERATIVE_STARTERS.filter((s) => s.charAt(0) === firstLetter);
    const pool = matching.length > 0 ? matching : ALLITERATIVE_STARTERS;
    const shuffledPool = shuffle(pool, rand);
    for (let i = 0; i < 2; i++) {
      addName(`${shuffledPool[i % shuffledPool.length]} ${primaryKw}`, "Creative");
    }
  }

  // Strategy 7: Multi-word combinations for longer names
  if (primaryKw) {
    const connector = CONNECTOR_WORDS[Math.floor(rand() * CONNECTOR_WORDS.length)];
    const indWord = capitalize(shuffledIndustry[0]);
    addName(`${primaryKw} ${connector} ${indWord}`, style);

    addName(
      `${shuffledPrefixes[0]} ${primaryKw} ${shuffledSuffixes[0]}`,
      style
    );
  }

  // Strategy 8: Keyword mashups with multiple keywords
  if (kwParts.length >= 2) {
    addName(`${kwParts[0]}${kwParts[1]}`, "Modern");
    addName(createPortmanteau(kwParts[0], kwParts[1]), "Creative");
    addName(`${kwParts[0]} & ${kwParts[1]}`, "Professional");
    addName(`${kwParts[0]} ${kwParts[1]} ${shuffledSuffixes[0]}`, style);
  }

  // Strategy 9: Prefix + Keyword compounds
  if (primaryKw) {
    for (let i = 0; i < 2; i++) {
      addName(`${shuffledPrefixes[(i + 5) % shuffledPrefixes.length]}${primaryKw}`, "Modern");
    }
  }

  // Strategy 10: "The + Keyword + Suffix" pattern
  if (primaryKw) {
    addName(`The ${primaryKw} ${shuffledSuffixes[1]}`, "Elegant");
    addName(`${primaryKw} ${capitalize(shuffledIndustry[1])}`, style);
  }

  // Fallback: ensure we always have at least 20
  let fallbackIdx = 0;
  while (names.length < 24) {
    const pre = shuffledPrefixes[fallbackIdx % shuffledPrefixes.length];
    const suf = shuffledSuffixes[(fallbackIdx + 2) % shuffledSuffixes.length];
    const ind = capitalize(shuffledIndustry[fallbackIdx % shuffledIndustry.length]);
    if (fallbackIdx % 3 === 0) {
      addName(`${pre} ${ind}`, style);
    } else if (fallbackIdx % 3 === 1) {
      addName(`${ind} ${suf}`, style);
    } else {
      addName(`${pre} ${ind} ${suf}`, style);
    }
    fallbackIdx++;
    if (fallbackIdx > 50) break;
  }

  // Filter by length preference
  const filtered = names.filter((n) => {
    const wordCount = n.name.split(/\s+/).length;
    if (lengthPref === "Short") return wordCount <= 2;
    if (lengthPref === "Medium") return wordCount >= 2 && wordCount <= 3;
    if (lengthPref === "Long") return wordCount >= 3;
    return true;
  });

  return filtered.length >= 6 ? filtered : names;
}

export default function BusinessNameGeneratorPage() {
  const [keywords, setKeywords] = useState("");
  const [businessType, setBusinessType] = useState<string>("General");
  const [style, setStyle] = useState<string>("Professional");
  const [lengthPref, setLengthPref] = useState<string>("Medium");
  const [seed, setSeed] = useState(1);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [copied, setCopied] = useState<string | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);

  const names = useMemo(() => {
    const inputSeed = hashString(`${keywords}-${businessType}-${style}-${lengthPref}`) + seed;
    return generateNames(keywords, businessType, style, lengthPref, inputSeed);
  }, [keywords, businessType, style, lengthPref, seed]);

  const handleGenerate = useCallback(() => {
    setSeed((s) => s + 1);
  }, []);

  const handleCopy = useCallback(async (name: string) => {
    try {
      await navigator.clipboard.writeText(name);
      setCopied(name);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      /* clipboard not available */
    }
  }, []);

  const handleCopyAll = useCallback(async () => {
    try {
      const text = names.map((n) => n.name).join("\n");
      await navigator.clipboard.writeText(text);
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 1500);
    } catch {
      /* clipboard not available */
    }
  }, [names]);

  const toggleFavorite = useCallback((name: string) => {
    setFavorites((prev) =>
      prev.includes(name) ? prev.filter((f) => f !== name) : [...prev, name]
    );
  }, []);

  return (
    <>
      <title>
        Business Name Generator - Free Creative Name Ideas | DevTools Hub
      </title>
      <meta
        name="description"
        content="Generate creative business name ideas instantly. Free business name generator with industry-specific suggestions, styles, and name length preferences. No signup required."
      />
      <JsonLd
        data={[
          generateWebAppSchema({
            slug: "business-name-generator",
            name: "Business Name Generator",
            description:
              "Generate creative business name ideas with industry-specific suggestions and multiple naming styles",
            category: "finance",
          }),
          generateBreadcrumbSchema({
            slug: "business-name-generator",
            name: "Business Name Generator",
            description:
              "Generate creative business name ideas with industry-specific suggestions and multiple naming styles",
            category: "finance",
          }),
          generateFAQSchema([
            {
              question: "How do I choose the right business name?",
              answer:
                "A good business name should be memorable, easy to spell and pronounce, relevant to your industry, and available as a domain name. Use this generator to brainstorm options, then check domain availability and trademark databases before making your final choice.",
            },
            {
              question: "Should I check trademark availability for my business name?",
              answer:
                "Yes, absolutely. Before committing to a business name, search the USPTO trademark database (or your country's equivalent) to ensure the name isn't already trademarked. Also check domain availability and social media handles. This can save you costly legal issues later.",
            },
            {
              question: "What makes a good business name?",
              answer:
                "A great business name is short, memorable, easy to spell, and conveys your brand's personality. It should be unique enough to stand out, relevant to your industry, and scalable as your business grows. Avoid names that are too narrow or limiting.",
            },
            {
              question: "Can I use the names generated by this tool legally?",
              answer:
                "The names generated are suggestions for brainstorming purposes. While you're free to use them, you should always verify availability by checking trademark databases, domain registrars, and your local business registry before registering any name for commercial use.",
            },
          ]),
        ]}
      />

      <div className="min-h-screen bg-slate-900 text-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <ToolBreadcrumb slug="business-name-generator" />

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
              Business Name Generator
            </h1>
            <p className="text-slate-400 max-w-2xl text-lg">
              Generate creative business name ideas instantly. Enter your
              keywords, select your industry and style, and get dozens of unique
              name suggestions.
            </p>
          </div>

          {/* Controls */}
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-5 mb-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Keywords */}
              <div>
                <label
                  htmlFor="keywords"
                  className="block text-sm font-medium text-slate-300 mb-2"
                >
                  Keywords / Industry
                </label>
                <input
                  id="keywords"
                  type="text"
                  value={keywords}
                  onChange={(e) => setKeywords(e.target.value)}
                  placeholder="e.g. cloud, swift, green"
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Business Type */}
              <div>
                <label
                  htmlFor="business-type"
                  className="block text-sm font-medium text-slate-300 mb-2"
                >
                  Business Type
                </label>
                <select
                  id="business-type"
                  value={businessType}
                  onChange={(e) => setBusinessType(e.target.value)}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {BUSINESS_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              {/* Style */}
              <div>
                <label
                  htmlFor="style"
                  className="block text-sm font-medium text-slate-300 mb-2"
                >
                  Style
                </label>
                <select
                  id="style"
                  value={style}
                  onChange={(e) => setStyle(e.target.value)}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {STYLES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              {/* Length Preference */}
              <div>
                <label
                  htmlFor="length-pref"
                  className="block text-sm font-medium text-slate-300 mb-2"
                >
                  Name Length
                </label>
                <select
                  id="length-pref"
                  value={lengthPref}
                  onChange={(e) => setLengthPref(e.target.value)}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {LENGTH_OPTIONS.map((l) => (
                    <option key={l} value={l}>
                      {l} ({l === "Short" ? "1-2 words" : l === "Medium" ? "2-3 words" : "3+ words"})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 mt-5">
              <button
                onClick={handleGenerate}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Generate Names
              </button>
              <button
                onClick={handleGenerate}
                className="px-6 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-sm font-medium transition-colors"
              >
                Regenerate
              </button>
              <button
                onClick={handleCopyAll}
                className="px-6 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-sm font-medium transition-colors"
              >
                {copiedAll ? "Copied!" : "Copy All"}
              </button>
            </div>
          </div>

          {/* Generated Names */}
          {names.length > 0 && (
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-white mb-4">
                Generated Names ({names.length})
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {names.map((item, idx) => {
                  const isFav = favorites.includes(item.name);
                  return (
                    <div
                      key={`${item.name}-${idx}`}
                      className={`bg-slate-800 border rounded-lg p-4 flex items-center justify-between gap-3 transition-colors ${
                        isFav
                          ? "border-yellow-600/50 bg-yellow-900/10"
                          : "border-slate-700"
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="text-white font-semibold text-base truncate">
                          {item.name}
                        </div>
                        <span className="inline-block mt-1 text-xs px-2 py-0.5 rounded bg-slate-700 text-slate-400">
                          {item.tag}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => toggleFavorite(item.name)}
                          className={`p-1.5 rounded transition-colors ${
                            isFav
                              ? "text-yellow-400 hover:text-yellow-300"
                              : "text-slate-500 hover:text-slate-300"
                          }`}
                          title={isFav ? "Remove from favorites" : "Add to favorites"}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill={isFav ? "currentColor" : "none"}
                            stroke="currentColor"
                            strokeWidth={2}
                            className="w-4 h-4"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
                            />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleCopy(item.name)}
                          className="px-3 py-1.5 text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 rounded transition-colors"
                        >
                          {copied === item.name ? "Copied!" : "Copy"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Favorites */}
          {favorites.length > 0 && (
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-white mb-4">
                Favorites ({favorites.length})
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {favorites.map((name) => (
                  <div
                    key={name}
                    className="bg-slate-800 border border-yellow-600/50 bg-yellow-900/10 rounded-lg p-4 flex items-center justify-between gap-3"
                  >
                    <div className="text-white font-semibold text-base truncate">
                      {name}
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => toggleFavorite(name)}
                        className="p-1.5 rounded text-yellow-400 hover:text-yellow-300 transition-colors"
                        title="Remove from favorites"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                          stroke="currentColor"
                          strokeWidth={2}
                          className="w-4 h-4"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
                          />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleCopy(name)}
                        className="px-3 py-1.5 text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 rounded transition-colors"
                      >
                        {copied === name ? "Copied!" : "Copy"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* How to Use */}
          <section className="mt-12 bg-slate-800 border border-slate-700 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-4">
              How to Use the Business Name Generator
            </h2>
            <ol className="list-decimal list-inside space-y-2 text-slate-400">
              <li>
                Enter one or more keywords related to your business, product, or
                industry in the keywords field.
              </li>
              <li>
                Select the business type that best matches your industry from
                the dropdown.
              </li>
              <li>
                Choose a naming style (Professional, Creative, Modern, Playful,
                Elegant, or Bold) to match your brand personality.
              </li>
              <li>
                Pick your preferred name length: Short (1-2 words), Medium (2-3
                words), or Long (3+ words).
              </li>
              <li>
                Click &quot;Generate Names&quot; or &quot;Regenerate&quot; to get
                fresh name suggestions.
              </li>
              <li>
                Click the star icon to save your favorite names, and use the
                Copy button to copy individual names.
              </li>
            </ol>
          </section>

          <RelatedTools currentSlug="business-name-generator" />

          {/* FAQ Section */}
          <section className="mt-16 border-t border-slate-700 pt-10">
            <h2 className="text-2xl font-bold text-white mb-6">
              Frequently Asked Questions
            </h2>

            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  How do I choose the right business name?
                </h3>
                <p className="text-slate-400">
                  A good business name should be memorable, easy to spell and
                  pronounce, relevant to your industry, and available as a
                  domain name. Use this generator to brainstorm options, then
                  check domain availability and trademark databases before
                  making your final choice.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Should I check trademark availability for my business name?
                </h3>
                <p className="text-slate-400">
                  Yes, absolutely. Before committing to a business name, search
                  the USPTO trademark database (or your country&apos;s
                  equivalent) to ensure the name isn&apos;t already trademarked.
                  Also check domain availability and social media handles. This
                  can save you costly legal issues later.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  What makes a good business name?
                </h3>
                <p className="text-slate-400">
                  A great business name is short, memorable, easy to spell, and
                  conveys your brand&apos;s personality. It should be unique
                  enough to stand out, relevant to your industry, and scalable
                  as your business grows. Avoid names that are too narrow or
                  limiting.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Can I use the names generated by this tool legally?
                </h3>
                <p className="text-slate-400">
                  The names generated are suggestions for brainstorming
                  purposes. While you&apos;re free to use them, you should
                  always verify availability by checking trademark databases,
                  domain registrars, and your local business registry before
                  registering any name for commercial use.
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
