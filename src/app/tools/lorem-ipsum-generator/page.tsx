"use client";

import { useState, useCallback, useMemo } from "react";
import JsonLd from "@/components/JsonLd";
import RelatedTools from "@/components/RelatedTools";
import ToolBreadcrumb from "@/components/ToolBreadcrumb";
import AdUnit from "@/components/AdUnit";
import {
  generateFAQSchema,
  generateWebAppSchema,
  generateBreadcrumbSchema,
} from "@/lib/jsonld";

// --- Word banks ---

const CLASSIC_WORDS = [
  "lorem", "ipsum", "dolor", "sit", "amet", "consectetur", "adipiscing", "elit",
  "sed", "do", "eiusmod", "tempor", "incididunt", "ut", "labore", "et", "dolore",
  "magna", "aliqua", "enim", "ad", "minim", "veniam", "quis", "nostrud",
  "exercitation", "ullamco", "laboris", "nisi", "aliquip", "ex", "ea", "commodo",
  "consequat", "duis", "aute", "irure", "in", "reprehenderit", "voluptate",
  "velit", "esse", "cillum", "fugiat", "nulla", "pariatur", "excepteur", "sint",
  "occaecat", "cupidatat", "non", "proident", "sunt", "culpa", "qui", "officia",
  "deserunt", "mollit", "anim", "id", "est", "laborum", "ac", "accumsan",
  "adipisci", "aliquam", "ante", "arcu", "at", "auctor", "augue", "bibendum",
  "blandit", "commodi", "condimentum", "congue", "consequatur", "convallis",
  "cras", "cum", "curabitur", "cursus", "dapibus", "diam", "dictum", "dignissim",
  "donec", "dui", "eget", "eleifend", "elementum", "eros", "eu", "euismod",
  "facilisi", "facilisis", "fames", "faucibus", "felis", "fermentum", "feugiat",
  "fringilla", "fusce", "gravida", "habitant", "habitasse", "hac", "hendrerit",
  "iaculis", "imperdiet", "integer", "interdum", "justo", "lacinia", "lacus",
  "laoreet", "lectus", "leo", "libero", "ligula", "lobortis", "luctus",
  "maecenas", "massa", "mattis", "mauris", "metus", "mi", "morbi", "nam",
  "natoque", "nec", "neque", "nibh", "nisl", "nullam", "nunc", "odio", "orci",
  "ornare", "pellentesque", "penatibus", "pharetra", "placerat", "platea",
  "porta", "porttitor", "posuere", "praesent", "pretium", "primis", "proin",
  "pulvinar", "purus", "quam", "quisque", "rhoncus", "ridiculus", "risus",
  "rutrum", "sagittis", "sapien", "scelerisque", "semper", "senectus",
  "sociis", "sodales", "sollicitudin", "suscipit", "suspendisse", "tellus",
  "tincidunt", "tortor", "tristique", "turpis", "ultrices", "ultricies",
  "urna", "varius", "vel", "vestibulum", "vitae", "vivamus", "viverra",
  "volutpat", "vulputate",
];

const HIPSTER_WORDS = [
  "artisan", "aesthetic", "brunch", "bushwick", "craft", "cred", "distillery",
  "dreamcatcher", "echo", "ethical", "farm-to-table", "fixie", "flannel",
  "flexitarian", "forage", "gastropub", "gentrify", "gluten-free", "hashtag",
  "helvetica", "hella", "hoodie", "humblebrag", "iceland", "intelligentsia",
  "jean", "kale", "keytar", "kinfolk", "knausgaard", "kombucha", "letterpress",
  "listicle", "lomo", "lumbersexual", "marfa", "meditation", "microdosing",
  "migas", "mixtape", "mustache", "narwhal", "neutra", "normcore", "occupy",
  "offal", "organic", "photo", "pitchfork", "plaid", "polaroid", "portland",
  "post-ironic", "pour-over", "poutine", "quinoa", "raclette", "raw", "retro",
  "ramps", "scenester", "schlitz", "selfies", "semiotics", "shoreditch",
  "single-origin", "skateboard", "slow-carb", "small-batch", "snackwave",
  "sriracha", "stumptown", "succulents", "sustainable", "swag", "tattooed",
  "thundercats", "tofu", "tote", "truffaut", "tumblr", "twee", "typewriter",
  "umami", "unicorn", "vaporware", "vegan", "venmo", "vinyl", "viral",
  "wayfarers", "woke", "wolf", "yolo", "yuccie",
];

const CORPORATE_WORDS = [
  "synergy", "leverage", "stakeholder", "bandwidth", "ecosystem", "paradigm",
  "deliverable", "scalable", "agile", "alignment", "analytics", "benchmark",
  "blockchain", "brand", "cadence", "capacity", "catalyst", "circle-back",
  "cloud", "collaboration", "competitive", "compliance", "core-competency",
  "cross-functional", "customer-centric", "data-driven", "deep-dive",
  "digital", "disrupt", "diversity", "downsizing", "drill-down", "empower",
  "engagement", "enterprise", "evangelism", "fast-track", "framework",
  "frictionless", "gamification", "go-to-market", "growth", "hack",
  "holistic", "hustle", "ideation", "impact", "incentivize", "incubator",
  "infrastructure", "innovation", "integration", "iterate", "KPI",
  "lean", "lifecycle", "low-hanging-fruit", "market-fit", "metrics",
  "milestone", "mindshare", "mission-critical", "monetize", "move-the-needle",
  "net-net", "next-gen", "north-star", "objective", "omnichannel", "onboard",
  "optimize", "outcome", "outsource", "pain-point", "parallel-path",
  "performance", "pipeline", "pivot", "platform", "proactive", "productize",
  "profit", "quarter", "quick-win", "ramp-up", "real-time", "repurpose",
  "resilient", "restructure", "return", "revenue", "roadmap", "ROI",
  "runway", "SaaS", "scale", "scope", "seamless", "silo", "sprint",
  "strategy", "streamline", "sustainability", "sync", "take-offline",
  "thought-leadership", "touchpoint", "transform", "transparency",
  "unicorn", "unpack", "upskill", "value-add", "vertical", "vision",
  "waterfall", "workflow", "zero-sum",
];

const BACON_WORDS = [
  "bacon", "ipsum", "dolor", "amet", "ribeye", "pork", "belly", "chuck",
  "sirloin", "brisket", "tenderloin", "short", "ribs", "flank", "steak",
  "drumstick", "turkey", "chicken", "hamburger", "meatball", "meatloaf",
  "sausage", "andouille", "boudin", "bresaola", "capicola", "chorizo",
  "corned", "beef", "cow", "cupim", "fatback", "filet", "mignon",
  "frankfurter", "ground", "round", "ham", "hock", "jowl", "kevin",
  "kielbasa", "landjaeger", "leberkas", "loin", "pastrami", "pancetta",
  "picanha", "pig", "porchetta", "prosciutto", "rump", "salami", "shank",
  "shankle", "shoulder", "spare", "strip", "swine", "t-bone", "tail",
  "tongue", "tri-tip", "turducken", "venison", "alcatra", "ball", "tip",
  "burgdoggen", "chislic", "doner", "jerky", "kevin", "lamb", "pepperoni",
  "pitmaster", "smoked", "grilled", "braised", "cured", "glazed",
  "marinated", "seasoned", "tender", "juicy", "crispy", "savory",
];

const CLASSIC_FIRST = "Lorem ipsum dolor sit amet, consectetur adipiscing elit.";

type OutputType = "paragraphs" | "sentences" | "words";
type Variation = "classic" | "hipster" | "corporate" | "bacon";

const VARIATION_META: Record<Variation, { label: string; description: string }> = {
  classic: { label: "Classic Latin", description: "Traditional Lorem Ipsum placeholder text" },
  hipster: { label: "Hipster Ipsum", description: "Artisan small-batch placeholder text" },
  corporate: { label: "Corporate Ipsum", description: "Synergy-driven business buzzword filler" },
  bacon: { label: "Bacon Ipsum", description: "Meaty placeholder text for carnivores" },
};

const randInt = (min: number, max: number): number =>
  Math.floor(Math.random() * (max - min + 1)) + min;

const getWordBank = (variation: Variation): string[] => {
  switch (variation) {
    case "hipster": return HIPSTER_WORDS;
    case "corporate": return CORPORATE_WORDS;
    case "bacon": return BACON_WORDS;
    default: return CLASSIC_WORDS;
  }
};

const randWord = (words: string[]): string => words[randInt(0, words.length - 1)];

const capitalize = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1);

const generateSentence = (words: string[], minW: number, maxW: number): string => {
  const count = randInt(minW, maxW);
  const parts: string[] = [];
  for (let i = 0; i < count; i++) parts.push(randWord(words));
  return capitalize(parts.join(" ")) + ".";
};

const generateParagraph = (words: string[], minS: number, maxS: number): string => {
  const count = randInt(minS, maxS);
  const sentences: string[] = [];
  for (let i = 0; i < count; i++) sentences.push(generateSentence(words, 6, 15));
  return sentences.join(" ");
};

const generateText = (
  type: OutputType,
  count: number,
  startWithLorem: boolean,
  variation: Variation
): string => {
  const words = getWordBank(variation);
  const results: string[] = [];
  const useClassicStart = startWithLorem && variation === "classic";

  if (type === "paragraphs") {
    for (let i = 0; i < count; i++) {
      const para = generateParagraph(words, 4, 8);
      if (i === 0 && useClassicStart) {
        results.push(CLASSIC_FIRST + " " + para);
      } else {
        results.push(para);
      }
    }
    return results.join("\n\n");
  }

  if (type === "sentences") {
    for (let i = 0; i < count; i++) {
      if (i === 0 && useClassicStart) {
        results.push(CLASSIC_FIRST);
      } else {
        results.push(generateSentence(words, 6, 15));
      }
    }
    return results.join(" ");
  }

  // words
  if (useClassicStart && count >= 5) {
    results.push("lorem", "ipsum", "dolor", "sit", "amet");
    for (let i = 5; i < count; i++) results.push(randWord(words));
  } else {
    for (let i = 0; i < count; i++) results.push(randWord(words));
  }
  return results.join(" ");
};

export default function LoremIpsumGenerator() {
  const [outputType, setOutputType] = useState<OutputType>("paragraphs");
  const [count, setCount] = useState(3);
  const [startWithLorem, setStartWithLorem] = useState(true);
  const [variation, setVariation] = useState<Variation>("classic");
  const [output, setOutput] = useState("");
  const [copied, setCopied] = useState<string | null>(null);

  const handleGenerate = useCallback(() => {
    setOutput(generateText(outputType, count, startWithLorem, variation));
    setCopied(null);
  }, [outputType, count, startWithLorem, variation]);

  const copyText = useCallback(async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(label);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      /* clipboard not available */
    }
  }, []);

  const htmlOutput = useMemo(() => {
    if (!output) return "";
    if (outputType === "paragraphs") {
      return output
        .split("\n\n")
        .map((p) => `<p>${p}</p>`)
        .join("\n");
    }
    return `<p>${output}</p>`;
  }, [output, outputType]);

  const wordCount = output
    ? output.split(/\s+/).filter((w) => w.length > 0).length
    : 0;
  const charCount = output.length;
  const paragraphCount = output
    ? output.split(/\n\n/).filter((p) => p.trim().length > 0).length
    : 0;

  const typeOptions: { value: OutputType; label: string }[] = [
    { value: "paragraphs", label: "Paragraphs" },
    { value: "sentences", label: "Sentences" },
    { value: "words", label: "Words" },
  ];

  const presets = [
    { label: "1 Paragraph", type: "paragraphs" as OutputType, count: 1 },
    { label: "3 Paragraphs", type: "paragraphs" as OutputType, count: 3 },
    { label: "5 Paragraphs", type: "paragraphs" as OutputType, count: 5 },
    { label: "10 Sentences", type: "sentences" as OutputType, count: 10 },
    { label: "50 Words", type: "words" as OutputType, count: 50 },
    { label: "100 Words", type: "words" as OutputType, count: 100 },
  ];

  return (
    <>
      <title>Lorem Ipsum Generator - Free Placeholder Text | DevTools</title>
      <meta
        name="description"
        content="Free lorem ipsum generator — create placeholder text in paragraphs, sentences, or words. Classic, hipster, bacon, and corporate ipsum variations. Dummy text generator for designs and mockups."
      />
      <meta
        name="keywords"
        content="lorem ipsum generator, placeholder text generator, dummy text generator, lorem ipsum, filler text, hipster ipsum, bacon ipsum, corporate ipsum"
      />
      <JsonLd
        data={[
          generateWebAppSchema({
            slug: "lorem-ipsum-generator",
            name: "Lorem Ipsum Generator",
            description:
              "Generate placeholder dummy text in paragraphs, sentences, or words with classic, hipster, bacon, and corporate ipsum variations",
            category: "generator",
          }),
          generateBreadcrumbSchema({
            slug: "lorem-ipsum-generator",
            name: "Lorem Ipsum Generator",
            description:
              "Generate placeholder dummy text in paragraphs, sentences, or words with classic, hipster, bacon, and corporate ipsum variations",
            category: "generator",
          }),
          generateFAQSchema([
            {
              question: "What is a lorem ipsum generator?",
              answer:
                "A lorem ipsum generator creates placeholder text used in design mockups, web layouts, and print templates. It helps designers and developers focus on visual design without being distracted by meaningful content.",
            },
            {
              question: "Why use dummy text instead of real content?",
              answer:
                "Dummy text like Lorem Ipsum provides a natural distribution of letters and word lengths, making layouts look realistic. It prevents stakeholders from reading and editing placeholder copy, keeping focus on design and typography.",
            },
            {
              question: "What are the different ipsum variations?",
              answer:
                "This generator offers four variations: Classic Latin (traditional Lorem Ipsum from Cicero), Hipster Ipsum (trendy artisan-themed words), Bacon Ipsum (meaty placeholder text), and Corporate Ipsum (business buzzword filler). Each produces unique placeholder text styles.",
            },
            {
              question: "How many paragraphs should I generate?",
              answer:
                "For a typical web page mockup, 3-5 paragraphs works well. Use 1 paragraph for card components, and 5-10 for long-form content layouts like blog posts or articles.",
            },
            {
              question: "Is the generated text real Latin?",
              answer:
                "Classic Lorem Ipsum is based on Latin vocabulary from Cicero's writings (45 BC), but sentences are randomly assembled. While individual words are real Latin, the sentences don't form coherent meaning. Hipster and Corporate variations use English words.",
            },
            {
              question: "Is this placeholder text generator free?",
              answer:
                "Yes, completely free with no limits. Generate as much placeholder text as you need — all processing happens in your browser with no data sent to any server.",
            },
          ]),
        ]}
      />

      <div className="min-h-screen bg-slate-900 text-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <ToolBreadcrumb slug="lorem-ipsum-generator" />

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
              Lorem Ipsum Generator
            </h1>
            <p className="text-slate-400 max-w-2xl text-lg">
              Generate placeholder dummy text for designs, mockups, and layouts.
              Choose from classic Latin, hipster, bacon, or corporate ipsum variations.
              Configure paragraphs, sentences, or word count and copy instantly.
            </p>
          </div>

          <AdUnit slot="TOP_SLOT" format="horizontal" className="mb-6" />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* Controls Column */}
            <div className="space-y-4">
              <h2 className="text-sm font-medium text-slate-300">Options</h2>

              {/* Variation Toggle */}
              <div>
                <label className="text-xs text-slate-400 mb-1.5 block">
                  Text Style
                </label>
                <div className="space-y-1.5">
                  {(Object.entries(VARIATION_META) as [Variation, { label: string; description: string }][]).map(
                    ([key, meta]) => (
                      <button
                        key={key}
                        onClick={() => setVariation(key)}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors border ${
                          variation === key
                            ? "bg-blue-600 border-blue-500 text-white"
                            : "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"
                        }`}
                      >
                        <span className="font-medium">{meta.label}</span>
                        <span className="block text-xs mt-0.5 opacity-70">
                          {meta.description}
                        </span>
                      </button>
                    )
                  )}
                </div>
              </div>

              {/* Output Type */}
              <div>
                <label className="text-xs text-slate-400 mb-1.5 block">
                  Generate
                </label>
                <div className="flex gap-2">
                  {typeOptions.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setOutputType(opt.value)}
                      className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors border ${
                        outputType === opt.value
                          ? "bg-blue-600 border-blue-500 text-white"
                          : "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Count */}
              <div>
                <label className="text-xs text-slate-400 mb-1.5 block">
                  Count: {count}
                </label>
                <input
                  type="range"
                  min={1}
                  max={100}
                  value={count}
                  onChange={(e) => setCount(Number(e.target.value))}
                  className="w-full accent-blue-600"
                />
                <div className="flex justify-between text-xs text-slate-500 mt-1">
                  <span>1</span>
                  <span>100</span>
                </div>
              </div>

              {/* Start with Lorem */}
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={startWithLorem}
                  onChange={(e) => setStartWithLorem(e.target.checked)}
                  className="w-4 h-4 rounded bg-slate-800 border-slate-600 text-blue-600 focus:ring-blue-500 focus:ring-offset-0 cursor-pointer"
                />
                <span className="text-sm text-slate-300">
                  Start with &quot;Lorem ipsum dolor sit amet...&quot;
                </span>
              </label>

              {/* Quick Presets */}
              <div>
                <label className="text-xs text-slate-400 mb-1.5 block">
                  Quick Presets
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {presets.map((preset) => (
                    <button
                      key={preset.label}
                      onClick={() => {
                        setOutputType(preset.type);
                        setCount(preset.count);
                      }}
                      className="px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700 rounded border border-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Generate Button */}
              <button
                onClick={handleGenerate}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors text-sm"
              >
                Generate {VARIATION_META[variation].label}
              </button>
            </div>

            {/* Output Column */}
            <div className="lg:col-span-2">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-slate-300">
                  Generated Text
                </label>
                {output && (
                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    {paragraphCount > 1 && <span>{paragraphCount} paragraphs</span>}
                    <span>{wordCount} words</span>
                    <span>{charCount} chars</span>
                  </div>
                )}
              </div>
              <div className="bg-slate-800 border border-slate-600 rounded-lg p-4 min-h-[300px] max-h-[500px] overflow-y-auto">
                {output ? (
                  <div className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap font-serif">
                    {output}
                  </div>
                ) : (
                  <div className="text-sm text-slate-500 italic">
                    Click &quot;Generate&quot; to create placeholder text...
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 mt-3">
                <button
                  onClick={() => copyText(output, "text")}
                  disabled={!output}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-sm"
                >
                  {copied === "text" ? "Copied!" : "Copy Text"}
                </button>
                <button
                  onClick={() => copyText(htmlOutput, "html")}
                  disabled={!output}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-sm"
                >
                  {copied === "html" ? "Copied HTML!" : "Copy as HTML"}
                </button>
                <button
                  onClick={() => {
                    setOutput("");
                    setCopied(null);
                  }}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors text-sm"
                >
                  Clear
                </button>
              </div>
            </div>
          </div>

          {/* What is Lorem Ipsum */}
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 mb-6">
            <h2 className="text-lg font-semibold text-white mb-4">
              What is Lorem Ipsum?
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
              {[
                {
                  name: "History",
                  tip: "Lorem Ipsum dates back to the 1500s, originating from Cicero's \"De Finibus Bonorum et Malorum\" (45 BC), a treatise on ethics",
                },
                {
                  name: "Purpose",
                  tip: "Designers use dummy text to fill layouts with realistic-looking content before final copy is written",
                },
                {
                  name: "Why not real text?",
                  tip: "Placeholder text prevents stakeholders from reading and editing copy, keeping focus on visual design and typography",
                },
                {
                  name: "Web Design",
                  tip: "Fill page layouts, cards, hero sections, and navigation with natural-looking text during prototyping",
                },
                {
                  name: "Print Design",
                  tip: "Placeholder text for brochures, posters, magazines, and book layouts to test typography choices",
                },
                {
                  name: "Development",
                  tip: "Populate wireframes, test text rendering, verify responsive layouts, and stress-test text containers",
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

          {/* Variation Examples */}
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 mb-6">
            <h2 className="text-lg font-semibold text-white mb-4">
              Text Style Examples
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {(
                [
                  {
                    key: "classic" as Variation,
                    sample:
                      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
                  },
                  {
                    key: "hipster" as Variation,
                    sample:
                      "Artisan pour-over kombucha aesthetic flexitarian. Gastropub dreamcatcher ethical vegan farm-to-table slow-carb sustainable mixtape.",
                  },
                  {
                    key: "corporate" as Variation,
                    sample:
                      "Leverage agile synergy to streamline cross-functional deliverables. Proactive stakeholder alignment drives scalable growth metrics and ROI.",
                  },
                  {
                    key: "bacon" as Variation,
                    sample:
                      "Bacon ipsum dolor amet ribeye brisket tenderloin. Porchetta capicola pancetta tri-tip drumstick sirloin turducken smoked crispy.",
                  },
                ] as const
              ).map((v) => (
                <div
                  key={v.key}
                  className="bg-slate-900 rounded-lg p-4 border border-slate-700"
                >
                  <h3 className="text-sm font-medium text-white mb-2">
                    {VARIATION_META[v.key].label}
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed font-serif">
                    {v.sample}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <AdUnit slot="MIDDLE_SLOT" format="rectangle" className="mb-6" />

          <RelatedTools currentSlug="lorem-ipsum-generator" />

          <AdUnit slot="BOTTOM_SLOT" format="auto" className="my-8" />

          {/* FAQ Section */}
          <section className="mt-16 border-t border-slate-700 pt-10">
            <h2 className="text-2xl font-bold text-white mb-6">
              Frequently Asked Questions
            </h2>

            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  What is a lorem ipsum generator?
                </h3>
                <p className="text-slate-400">
                  A lorem ipsum generator creates placeholder text used in design
                  mockups, web layouts, and print templates. It helps designers and
                  developers focus on visual design without being distracted by
                  meaningful content.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Why use dummy text instead of real content?
                </h3>
                <p className="text-slate-400">
                  Dummy text like Lorem Ipsum provides a natural distribution of
                  letters and word lengths, making layouts look realistic. It prevents
                  stakeholders from reading and editing placeholder copy, keeping
                  focus on design and typography.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  What are the different ipsum variations?
                </h3>
                <p className="text-slate-400">
                  This generator offers four variations: Classic Latin (traditional
                  Lorem Ipsum from Cicero), Hipster Ipsum (trendy artisan-themed
                  words), Bacon Ipsum (meaty placeholder text for carnivores),
                  and Corporate Ipsum (business buzzword filler). Each produces
                  unique placeholder text styles suited for different audiences
                  and use cases.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  How many paragraphs should I generate?
                </h3>
                <p className="text-slate-400">
                  For a typical web page mockup, 3-5 paragraphs works well. Use 1
                  paragraph for card components, and 5-10 for long-form content
                  layouts like blog posts or articles.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Is the generated text real Latin?
                </h3>
                <p className="text-slate-400">
                  Classic Lorem Ipsum is based on Latin vocabulary from Cicero&apos;s
                  writings (45 BC), but sentences are randomly assembled. While
                  individual words are real Latin, the sentences don&apos;t form
                  coherent meaning. Hipster and Corporate variations use English
                  words.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Is this placeholder text generator free?
                </h3>
                <p className="text-slate-400">
                  Yes, completely free with no limits. Generate as much placeholder
                  text as you need — all processing happens in your browser with no
                  data sent to any server.
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
