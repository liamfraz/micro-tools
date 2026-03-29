"use client";

import { useState, useCallback } from "react";
import JsonLd from "@/components/JsonLd";
import RelatedTools from "@/components/RelatedTools";
import AdUnit from "@/components/AdUnit";
import ToolBreadcrumb from "@/components/ToolBreadcrumb";
import {
  generateFAQSchema,
  generateWebAppSchema,
  generateBreadcrumbSchema,
} from "@/lib/jsonld";

type RewriteStyle =
  | "simplify"
  | "professional"
  | "creative"
  | "academic"
  | "concise"
  | "expand";

interface RewriteVariation {
  label: string;
  text: string;
  wordCount: number;
}

const STYLES: { value: RewriteStyle; label: string; description: string }[] = [
  { value: "simplify", label: "Simplify", description: "Replace complex words with simpler alternatives" },
  { value: "professional", label: "Professional", description: "Formal language with polished phrasing" },
  { value: "creative", label: "Creative", description: "Vivid language with varied sentence structure" },
  { value: "academic", label: "Academic", description: "Scholarly tone with hedging language" },
  { value: "concise", label: "Concise", description: "Remove filler words and tighten prose" },
  { value: "expand", label: "Expand", description: "Add elaboration and transitional phrases" },
];

// --- Word replacement maps (30+ entries per style) ---

const SIMPLIFY_MAP_A: Record<string, string> = {
  utilize: "use",
  implement: "do",
  facilitate: "help",
  subsequently: "then",
  approximately: "about",
  demonstrate: "show",
  endeavor: "try",
  commence: "start",
  terminate: "end",
  sufficient: "enough",
  insufficient: "not enough",
  numerous: "many",
  purchase: "buy",
  manufacture: "make",
  eliminate: "remove",
  accomplish: "do",
  obtain: "get",
  regarding: "about",
  prior: "before",
  subsequent: "after",
  nevertheless: "still",
  furthermore: "also",
  therefore: "so",
  however: "but",
  additionally: "also",
  assistance: "help",
  requirement: "need",
  modification: "change",
  acquisition: "gain",
  establishment: "setup",
  functionality: "feature",
  methodology: "method",
  optimization: "improvement",
  predominantly: "mainly",
  consequently: "so",
};

const SIMPLIFY_MAP_B: Record<string, string> = {
  utilize: "apply",
  implement: "carry out",
  facilitate: "make easier",
  subsequently: "after that",
  approximately: "roughly",
  demonstrate: "prove",
  endeavor: "attempt",
  commence: "begin",
  terminate: "stop",
  sufficient: "plenty",
  insufficient: "lacking",
  numerous: "a lot of",
  purchase: "pick up",
  manufacture: "build",
  eliminate: "cut",
  accomplish: "achieve",
  obtain: "gain",
  regarding: "on",
  prior: "earlier",
  subsequent: "later",
  nevertheless: "yet",
  furthermore: "plus",
  therefore: "thus",
  however: "yet",
  additionally: "and",
  assistance: "support",
  requirement: "must-have",
  modification: "update",
  acquisition: "pickup",
  establishment: "creation",
  functionality: "capability",
  methodology: "approach",
  optimization: "boost",
  predominantly: "mostly",
  consequently: "as a result",
};

const PROFESSIONAL_MAP_A: Record<string, string> = {
  get: "obtain",
  help: "assist",
  start: "initiate",
  end: "conclude",
  buy: "procure",
  use: "utilize",
  show: "demonstrate",
  try: "endeavor",
  need: "require",
  give: "provide",
  make: "construct",
  find: "identify",
  fix: "resolve",
  ask: "inquire",
  tell: "inform",
  think: "consider",
  want: "desire",
  keep: "maintain",
  change: "modify",
  "set up": "establish",
  "look at": "examine",
  "figure out": "determine",
  "deal with": "address",
  "come up with": "devise",
  "put together": "assemble",
  "carry out": "execute",
  "go over": "review",
  "run into": "encounter",
  "speed up": "accelerate",
  "cut down": "reduce",
  big: "substantial",
  small: "minimal",
  good: "excellent",
  bad: "adverse",
  important: "critical",
};

const PROFESSIONAL_MAP_B: Record<string, string> = {
  get: "acquire",
  help: "facilitate",
  start: "commence",
  end: "finalize",
  buy: "purchase",
  use: "employ",
  show: "illustrate",
  try: "attempt",
  need: "necessitate",
  give: "furnish",
  make: "fabricate",
  find: "locate",
  fix: "rectify",
  ask: "request",
  tell: "notify",
  think: "deliberate",
  want: "seek",
  keep: "retain",
  change: "alter",
  "set up": "configure",
  "look at": "assess",
  "figure out": "ascertain",
  "deal with": "manage",
  "come up with": "formulate",
  "put together": "compile",
  "carry out": "implement",
  "go over": "evaluate",
  "run into": "experience",
  "speed up": "expedite",
  "cut down": "diminish",
  big: "significant",
  small: "modest",
  good: "commendable",
  bad: "unfavorable",
  important: "paramount",
};

const CREATIVE_MAP_A: Record<string, string> = {
  good: "remarkable",
  bad: "dreadful",
  big: "enormous",
  small: "tiny",
  said: "declared",
  went: "ventured",
  looked: "gazed",
  happy: "elated",
  sad: "melancholy",
  nice: "delightful",
  fast: "lightning-quick",
  slow: "leisurely",
  old: "ancient",
  new: "brand-new",
  dark: "shadowy",
  bright: "radiant",
  important: "vital",
  interesting: "fascinating",
  beautiful: "stunning",
  difficult: "daunting",
  easy: "effortless",
  strong: "powerful",
  weak: "fragile",
  very: "incredibly",
  really: "truly",
  many: "countless",
  few: "a handful of",
  great: "magnificent",
  large: "vast",
  move: "surge",
  walk: "stroll",
  run: "dash",
  change: "transform",
  make: "craft",
  think: "envision",
};

const CREATIVE_MAP_B: Record<string, string> = {
  good: "exceptional",
  bad: "terrible",
  big: "massive",
  small: "miniature",
  said: "exclaimed",
  went: "journeyed",
  looked: "peered",
  happy: "overjoyed",
  sad: "sorrowful",
  nice: "charming",
  fast: "blazing",
  slow: "unhurried",
  old: "timeless",
  new: "freshly minted",
  dark: "murky",
  bright: "luminous",
  important: "essential",
  interesting: "captivating",
  beautiful: "gorgeous",
  difficult: "formidable",
  easy: "a breeze",
  strong: "mighty",
  weak: "delicate",
  very: "remarkably",
  really: "genuinely",
  many: "a multitude of",
  few: "a scattering of",
  great: "splendid",
  large: "expansive",
  move: "glide",
  walk: "wander",
  run: "sprint",
  change: "shift",
  make: "forge",
  think: "imagine",
};

const ACADEMIC_MAP_A: Record<string, string> = {
  show: "demonstrate",
  think: "postulate",
  use: "employ",
  find: "ascertain",
  help: "facilitate",
  give: "provide",
  get: "acquire",
  start: "initiate",
  end: "conclude",
  big: "substantial",
  small: "negligible",
  good: "favorable",
  bad: "detrimental",
  important: "significant",
  interesting: "noteworthy",
  change: "alter",
  make: "construct",
  many: "numerous",
  few: "a limited number of",
  try: "attempt",
  need: "necessitate",
  want: "seek to",
  keep: "retain",
  look: "examine",
  tell: "indicate",
  ask: "inquire",
  seem: "appear to",
  believe: "hypothesize",
  guess: "conjecture",
  about: "approximately",
  also: "furthermore",
  so: "consequently",
  but: "however",
  because: "due to the fact that",
  really: "substantially",
};

const ACADEMIC_MAP_B: Record<string, string> = {
  show: "illustrate",
  think: "theorize",
  use: "utilize",
  find: "identify",
  help: "aid",
  give: "furnish",
  get: "obtain",
  start: "commence",
  end: "terminate",
  big: "considerable",
  small: "marginal",
  good: "beneficial",
  bad: "adverse",
  important: "paramount",
  interesting: "compelling",
  change: "modify",
  make: "formulate",
  many: "a multitude of",
  few: "a scarcity of",
  try: "endeavor",
  need: "require",
  want: "aspire to",
  keep: "preserve",
  look: "observe",
  tell: "convey",
  ask: "request",
  seem: "suggest",
  believe: "posit",
  guess: "speculate",
  about: "roughly",
  also: "additionally",
  so: "therefore",
  but: "nevertheless",
  because: "owing to",
  really: "markedly",
};

const FILLER_WORDS = [
  "very",
  "really",
  "just",
  "actually",
  "basically",
  "literally",
  "honestly",
  "simply",
  "quite",
  "rather",
  "somewhat",
  "definitely",
  "certainly",
  "absolutely",
  "totally",
  "completely",
  "extremely",
  "incredibly",
  "essentially",
  "practically",
  "virtually",
  "merely",
  "truly",
  "obviously",
  "clearly",
  "surely",
  "perhaps",
  "kind of",
  "sort of",
  "in order to",
  "due to the fact that",
  "at the end of the day",
  "it goes without saying",
  "for all intents and purposes",
  "in my opinion",
];

const EXPAND_TRANSITIONS_A = [
  "In other words, ",
  "To elaborate, ",
  "More specifically, ",
  "For instance, ",
  "That is to say, ",
  "To put it another way, ",
  "Building on this point, ",
  "It is worth noting that ",
  "This is particularly relevant because ",
  "To provide further context, ",
];

const EXPAND_TRANSITIONS_B = [
  "Put differently, ",
  "To clarify further, ",
  "In greater detail, ",
  "As an example, ",
  "What this means is that ",
  "Expanding on this idea, ",
  "To add more depth, ",
  "Notably, ",
  "This matters because ",
  "For additional perspective, ",
];

const ACADEMIC_HEDGES_A = [
  "It appears that ",
  "Research suggests that ",
  "Evidence indicates that ",
  "It could be argued that ",
  "One might observe that ",
];

const ACADEMIC_HEDGES_B = [
  "It is plausible that ",
  "Findings point to the possibility that ",
  "Data appears to support the notion that ",
  "Scholars have noted that ",
  "It is reasonable to suggest that ",
];

const CREATIVE_OPENERS_A = [
  "Picture this: ",
  "Here is the thing: ",
  "Consider for a moment that ",
  "What stands out is that ",
  "Remarkably, ",
];

const CREATIVE_OPENERS_B = [
  "Imagine this: ",
  "The truth is, ",
  "Think about this: ",
  "What is striking is that ",
  "Surprisingly, ",
];

// --- Transformation helpers ---

function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

function applyWordMap(text: string, map: Record<string, string>): string {
  let result = text;
  const sortedKeys = Object.keys(map).sort((a, b) => b.length - a.length);
  for (const word of sortedKeys) {
    const regex = new RegExp(`\\b${word}\\b`, "gi");
    result = result.replace(regex, (match) => {
      const replacement = map[word];
      if (match[0] === match[0].toUpperCase()) {
        return replacement.charAt(0).toUpperCase() + replacement.slice(1);
      }
      return replacement;
    });
  }
  return result;
}

function removeFiller(text: string): string {
  let result = text;
  const multiWordFillers = FILLER_WORDS.filter((f) => f.includes(" "));
  for (const filler of multiWordFillers) {
    const regex = new RegExp(`\\b${filler}\\b\\s*`, "gi");
    result = result.replace(regex, (match) => {
      if (filler === "in order to") return "to ";
      if (filler === "due to the fact that") return "because ";
      return "";
    });
  }
  const singleWordFillers = FILLER_WORDS.filter((f) => !f.includes(" "));
  for (const filler of singleWordFillers) {
    const regex = new RegExp(`\\b${filler}\\b\\s*`, "gi");
    result = result.replace(regex, "");
  }
  return result.replace(/\s{2,}/g, " ").trim();
}

function countWords(text: string): number {
  return text
    .split(/\s+/)
    .filter((w) => w.length > 0).length;
}

// --- Main rewrite engine ---

function rewriteText(
  input: string,
  style: RewriteStyle,
  variation: number
): string {
  const sentences = splitSentences(input.trim());
  if (sentences.length === 0) return input;

  switch (style) {
    case "simplify": {
      const map = variation === 0 ? SIMPLIFY_MAP_A : SIMPLIFY_MAP_B;
      const simplified = sentences.map((s) => applyWordMap(s, map));
      // Variation B also shortens long sentences by splitting on commas
      if (variation === 1) {
        return simplified
          .flatMap((s) => {
            if (s.length > 120 && s.includes(",")) {
              const parts = s.split(/,\s*/);
              if (parts.length >= 2) {
                const mid = Math.ceil(parts.length / 2);
                const first = parts.slice(0, mid).join(", ").trim();
                const second = parts.slice(mid).join(", ").trim();
                const secondCap = second.charAt(0).toUpperCase() + second.slice(1);
                const firstEnd = first.endsWith(".") ? first : first + ".";
                return [firstEnd, secondCap];
              }
            }
            return [s];
          })
          .join(" ");
      }
      return simplified.join(" ");
    }

    case "professional": {
      const map = variation === 0 ? PROFESSIONAL_MAP_A : PROFESSIONAL_MAP_B;
      const transitionsA = [
        "Furthermore, ",
        "Additionally, ",
        "Moreover, ",
        "In addition, ",
        "Consequently, ",
      ];
      const transitionsB = [
        "To that end, ",
        "Accordingly, ",
        "As such, ",
        "In this regard, ",
        "With this in mind, ",
      ];
      const transitions = variation === 0 ? transitionsA : transitionsB;
      let tIdx = 0;

      return sentences
        .map((s, i) => {
          let result = applyWordMap(s, map);
          // Add transition phrase every 3rd sentence (not the first)
          if (i > 0 && i % 3 === 0 && tIdx < transitions.length) {
            const hasCapStart = /^[A-Z]/.test(result);
            if (hasCapStart) {
              result = transitions[tIdx] + result.charAt(0).toLowerCase() + result.slice(1);
            } else {
              result = transitions[tIdx] + result;
            }
            tIdx++;
          }
          return result;
        })
        .join(" ");
    }

    case "creative": {
      const map = variation === 0 ? CREATIVE_MAP_A : CREATIVE_MAP_B;
      const openers = variation === 0 ? CREATIVE_OPENERS_A : CREATIVE_OPENERS_B;
      let oIdx = 0;

      return sentences
        .map((s, i) => {
          let result = applyWordMap(s, map);
          // Add creative opener to first sentence and every 4th sentence
          if ((i === 0 || i % 4 === 0) && oIdx < openers.length) {
            const hasCapStart = /^[A-Z]/.test(result);
            if (hasCapStart) {
              result = openers[oIdx] + result.charAt(0).toLowerCase() + result.slice(1);
            } else {
              result = openers[oIdx] + result;
            }
            oIdx++;
          }
          return result;
        })
        .join(" ");
    }

    case "academic": {
      const map = variation === 0 ? ACADEMIC_MAP_A : ACADEMIC_MAP_B;
      const hedges = variation === 0 ? ACADEMIC_HEDGES_A : ACADEMIC_HEDGES_B;
      let hIdx = 0;

      return sentences
        .map((s, i) => {
          let result = applyWordMap(s, map);
          // Add hedging language to every 2nd sentence
          if (i % 2 === 1 && hIdx < hedges.length) {
            const hasCapStart = /^[A-Z]/.test(result);
            if (hasCapStart) {
              result = hedges[hIdx] + result.charAt(0).toLowerCase() + result.slice(1);
            } else {
              result = hedges[hIdx] + result;
            }
            hIdx++;
          }
          return result;
        })
        .join(" ");
    }

    case "concise": {
      let result = sentences.map((s) => removeFiller(s)).join(" ");
      // Variation B also removes redundant phrases
      if (variation === 1) {
        const redundancies: Record<string, string> = {
          "each and every": "every",
          "first and foremost": "first",
          "basic fundamentals": "basics",
          "end result": "result",
          "final outcome": "outcome",
          "free gift": "gift",
          "future plans": "plans",
          "past history": "history",
          "unexpected surprise": "surprise",
          "advance planning": "planning",
          "close proximity": "near",
          "exact same": "same",
          "general consensus": "consensus",
          "added bonus": "bonus",
          "brief moment": "moment",
          "collaborate together": "collaborate",
          "combine together": "combine",
          "continue on": "continue",
          "cooperate together": "cooperate",
          "difficult dilemma": "dilemma",
          "estimated roughly": "estimated",
          "evolve over time": "evolve",
          "gather together": "gather",
          "period of time": "period",
          "plan ahead": "plan",
          "repeat again": "repeat",
          "revert back": "revert",
          "still remains": "remains",
          "surrounding circumstances": "circumstances",
          "usual custom": "custom",
          "whether or not": "whether",
        };
        for (const [phrase, replacement] of Object.entries(redundancies)) {
          const regex = new RegExp(`\\b${phrase}\\b`, "gi");
          result = result.replace(regex, replacement);
        }
      }
      // Remove sentences that are mostly filler (under 3 words after cleanup)
      return result
        .split(/(?<=[.!?])\s+/)
        .filter((s) => countWords(s) >= 3)
        .join(" ");
    }

    case "expand": {
      const transitions = variation === 0 ? EXPAND_TRANSITIONS_A : EXPAND_TRANSITIONS_B;
      let tIdx = 0;

      return sentences
        .map((s, i) => {
          let result = s;
          // Add elaboration after every 2nd sentence
          if (i > 0 && i % 2 === 0 && tIdx < transitions.length) {
            const elaboration = transitions[tIdx] + result.charAt(0).toLowerCase() + result.slice(1);
            result = elaboration;
            tIdx++;
          }
          // Add context cues for short sentences in variation B
          if (variation === 1 && result.length < 60 && i < sentences.length - 1) {
            result = result.replace(/\.$/, "") + " — and this carries broader implications.";
          }
          return result;
        })
        .join(" ");
    }

    default:
      return input;
  }
}

function generateVariations(
  input: string,
  style: RewriteStyle
): RewriteVariation[] {
  if (!input.trim()) return [];

  return [0, 1].map((variation) => {
    const text = rewriteText(input, style, variation);
    return {
      label: variation === 0 ? "Variation A" : "Variation B",
      text,
      wordCount: countWords(text),
    };
  });
}

export default function AIParagraphRewriter() {
  const [input, setInput] = useState("");
  const [style, setStyle] = useState<RewriteStyle>("simplify");
  const [variations, setVariations] = useState<RewriteVariation[]>([]);
  const [activeTab, setActiveTab] = useState(0);
  const [copied, setCopied] = useState<string | null>(null);

  const handleRewrite = useCallback(() => {
    const results = generateVariations(input, style);
    setVariations(results);
    setActiveTab(0);
    setCopied(null);
  }, [input, style]);

  const copyText = useCallback(async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(label);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      /* clipboard not available */
    }
  }, []);

  const activeVariation = variations[activeTab] || null;
  const inputWordCount = countWords(input);

  return (
    <>
      <title>Free AI Paragraph Rewriter - Rewrite Text Instantly | DevTools</title>
      <meta
        name="description"
        content="Free online paragraph rewriter. Rewrite any text in 6 styles: simplify, professional, creative, academic, concise, or expanded. No signup required."
      />
      <meta
        name="keywords"
        content="paragraph rewriter, text rewriter, rewrite paragraph, paraphrasing tool, sentence rewriter, free paragraph rewriter, reword text, rephrase paragraph"
      />
      <JsonLd
        data={[
          generateWebAppSchema({
            slug: "ai-paragraph-rewriter",
            name: "AI Paragraph Rewriter",
            description:
              "Free online paragraph rewriter. Rewrite any text in 6 styles: simplify, professional, creative, academic, concise, or expanded. No signup required.",
            category: "ai",
          }),
          generateBreadcrumbSchema({
            slug: "ai-paragraph-rewriter",
            name: "AI Paragraph Rewriter",
            description:
              "Free online paragraph rewriter. Rewrite any text in 6 styles: simplify, professional, creative, academic, concise, or expanded. No signup required.",
            category: "ai",
          }),
          generateFAQSchema([
            {
              question: "How does this paragraph rewriter work?",
              answer:
                "This tool uses deterministic text transformations including synonym replacement, sentence restructuring, and style-specific patterns to rewrite your text. It runs entirely in your browser — no data is sent to any server or AI service.",
            },
            {
              question: "What rewriting styles are available?",
              answer:
                "Six styles are available: Simplify (replaces complex words with simpler ones), Professional (upgrades to formal business language), Creative (adds vivid and expressive language), Academic (adds scholarly hedging and formal phrasing), Concise (removes filler words and tightens prose), and Expand (adds elaboration and transitional phrases).",
            },
            {
              question: "Why does the tool generate two variations?",
              answer:
                "Each style uses two different synonym sets and transformation strategies to produce meaningfully different results. This gives you options to choose the version that best fits your needs, or to combine elements from both.",
            },
            {
              question: "Is this paragraph rewriter free to use?",
              answer:
                "Yes, completely free with no sign-up, no word limits, and no data collection. All text processing happens locally in your browser using template-based transformations. Your content is never sent to any external server.",
            },
          ]),
        ]}
      />

      <div className="min-h-screen bg-slate-900 text-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <ToolBreadcrumb slug="ai-paragraph-rewriter" />

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
              AI Paragraph Rewriter
            </h1>
            <p className="text-slate-400 max-w-2xl text-lg">
              Paste your text and choose a rewriting style. Get two unique
              variations instantly — all processing happens in your browser
              with zero data sent to any server.
            </p>
          </div>

          <AdUnit slot="TOP_SLOT" format="horizontal" className="mb-6" />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Input Column */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-medium text-slate-300">
                  Original Text
                </h2>
                <span className="text-xs text-slate-500">
                  {inputWordCount} {inputWordCount === 1 ? "word" : "words"}
                </span>
              </div>

              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Paste the paragraph or text you want to rewrite..."
                rows={10}
                className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-vertical"
              />

              {/* Style Selector */}
              <div>
                <label className="text-xs text-slate-400 mb-1.5 block">
                  Rewrite Style
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {STYLES.map((s) => (
                    <button
                      key={s.value}
                      onClick={() => setStyle(s.value)}
                      className={`text-left px-3 py-2 rounded-lg text-sm transition-colors border ${
                        style === s.value
                          ? "bg-blue-600 border-blue-500 text-white"
                          : "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"
                      }`}
                    >
                      <span className="font-medium">{s.label}</span>
                      <span className="block text-xs mt-0.5 opacity-70">
                        {s.description}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Rewrite Button */}
              <button
                onClick={handleRewrite}
                disabled={!input.trim()}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors text-sm disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Rewrite
              </button>
            </div>

            {/* Output Column */}
            <div>
              {/* Variation Tabs */}
              {variations.length > 0 && (
                <div className="flex gap-2 mb-3">
                  {variations.map((v, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setActiveTab(idx);
                        setCopied(null);
                      }}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${
                        activeTab === idx
                          ? "bg-blue-600 border-blue-500 text-white"
                          : "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"
                      }`}
                    >
                      {v.label}
                    </button>
                  ))}
                </div>
              )}

              {/* Output Display */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-sm font-medium text-slate-300">
                    Rewritten Text
                  </label>
                  {activeVariation && (
                    <span className="text-xs text-slate-500">
                      {activeVariation.wordCount}{" "}
                      {activeVariation.wordCount === 1 ? "word" : "words"}
                    </span>
                  )}
                </div>
                <div className="bg-slate-800 border border-slate-600 rounded-lg p-4 min-h-[280px] max-h-[550px] overflow-y-auto">
                  {activeVariation ? (
                    <div className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">
                      {activeVariation.text}
                    </div>
                  ) : (
                    <div className="text-sm text-slate-500 italic">
                      Paste your text, choose a style, and click
                      &quot;Rewrite&quot; to generate variations...
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 mt-3">
                <button
                  onClick={() => {
                    if (activeVariation)
                      copyText(activeVariation.text, "variation");
                  }}
                  disabled={!activeVariation}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-sm"
                >
                  {copied === "variation" ? "Copied!" : "Copy Text"}
                </button>
                <button
                  onClick={() => {
                    setVariations([]);
                    setInput("");
                    setCopied(null);
                  }}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors text-sm"
                >
                  Clear
                </button>
              </div>
            </div>
          </div>

          {/* Writing Tips */}
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 mb-6">
            <h2 className="text-lg font-semibold text-white mb-4">
              Writing Tips
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
              {[
                {
                  name: "Know Your Audience",
                  tip: "Before rewriting, consider who will read the text. Academic papers need formal language, while blog posts benefit from a conversational tone.",
                },
                {
                  name: "Preserve Key Meaning",
                  tip: "When rewriting, always ensure the core message stays intact. Changing words is fine, but altering the meaning defeats the purpose.",
                },
                {
                  name: "Vary Sentence Length",
                  tip: "Mix short, punchy sentences with longer, more detailed ones. This creates a natural rhythm that keeps readers engaged.",
                },
                {
                  name: "Eliminate Redundancy",
                  tip: "Look for repeated ideas and phrases. Saying the same thing twice in different words adds length without adding value.",
                },
                {
                  name: "Use Active Voice",
                  tip: "Active voice makes writing clearer and more direct. 'The team completed the project' is stronger than 'The project was completed by the team.'",
                },
                {
                  name: "Read It Aloud",
                  tip: "After rewriting, read the text aloud. Your ear catches awkward phrasing, rhythm issues, and unclear sentences that your eyes might miss.",
                },
              ].map((item) => (
                <div key={item.name}>
                  <h3 className="text-sm font-medium text-white mb-1">
                    {item.name}
                  </h3>
                  <p className="text-xs text-slate-400">{item.tip}</p>
                </div>
              ))}
            </div>
          </div>

          <AdUnit slot="BOTTOM_SLOT" format="auto" className="mb-6" />

          <RelatedTools currentSlug="ai-paragraph-rewriter" />

          {/* FAQ Section */}
          <section className="mt-16 border-t border-slate-700 pt-10">
            <h2 className="text-2xl font-bold text-white mb-6">
              Frequently Asked Questions
            </h2>

            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  How does this paragraph rewriter work?
                </h3>
                <p className="text-slate-400">
                  This tool uses deterministic text transformations including
                  synonym replacement, sentence restructuring, and
                  style-specific patterns to rewrite your text. It runs
                  entirely in your browser — no data is sent to any server
                  or AI service.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  What rewriting styles are available?
                </h3>
                <p className="text-slate-400">
                  Six styles are available: Simplify (replaces complex words
                  with simpler ones), Professional (upgrades to formal
                  business language), Creative (adds vivid and expressive
                  language), Academic (adds scholarly hedging and formal
                  phrasing), Concise (removes filler words and tightens
                  prose), and Expand (adds elaboration and transitional
                  phrases).
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Why does the tool generate two variations?
                </h3>
                <p className="text-slate-400">
                  Each style uses two different synonym sets and
                  transformation strategies to produce meaningfully different
                  results. This gives you options to choose the version that
                  best fits your needs, or to combine elements from both.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Is this paragraph rewriter free to use?
                </h3>
                <p className="text-slate-400">
                  Yes, completely free with no sign-up, no word limits, and
                  no data collection. All text processing happens locally in
                  your browser using template-based transformations. Your
                  content is never sent to any external server.
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
