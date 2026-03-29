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

// --- Tone vocabulary maps ---

type Tone = "luxury" | "casual" | "technical" | "playful" | "professional";
type Category =
  | "electronics"
  | "fashion"
  | "home"
  | "beauty"
  | "food"
  | "sports"
  | "general";
type DescLength = "short" | "medium" | "detailed";

const TONE_VOCAB: Record<
  Tone,
  {
    adjectives: string[];
    verbs: string[];
    openers: string[];
    closers: string[];
  }
> = {
  luxury: {
    adjectives: [
      "exquisite",
      "refined",
      "prestigious",
      "artisan-crafted",
      "sumptuous",
      "impeccable",
      "opulent",
      "distinguished",
    ],
    verbs: [
      "elevate",
      "indulge",
      "savor",
      "experience",
      "immerse",
      "discover",
      "unveil",
      "embrace",
    ],
    openers: [
      "Introducing a masterpiece of design and craftsmanship.",
      "For those who accept nothing less than extraordinary.",
      "Where uncompromising quality meets timeless elegance.",
    ],
    closers: [
      "An investment in lasting excellence.",
      "Because you deserve nothing but the finest.",
      "Redefine your standards with every use.",
    ],
  },
  casual: {
    adjectives: [
      "awesome",
      "super handy",
      "game-changing",
      "must-have",
      "brilliant",
      "top-notch",
      "solid",
      "fantastic",
    ],
    verbs: [
      "love",
      "enjoy",
      "grab",
      "check out",
      "upgrade",
      "try",
      "get",
      "rock",
    ],
    openers: [
      "Looking for something that just works? You found it.",
      "Say hello to your new favorite thing.",
      "Trust us, you are going to love this.",
    ],
    closers: [
      "Seriously, what are you waiting for?",
      "Your future self will thank you.",
      "Go ahead, treat yourself.",
    ],
  },
  technical: {
    adjectives: [
      "precision-engineered",
      "high-performance",
      "advanced",
      "optimized",
      "robust",
      "state-of-the-art",
      "efficient",
      "reliable",
    ],
    verbs: [
      "deliver",
      "optimize",
      "integrate",
      "enhance",
      "streamline",
      "maximize",
      "achieve",
      "enable",
    ],
    openers: [
      "Engineered for peak performance and reliability.",
      "Built with precision to meet demanding requirements.",
      "Advanced technology designed for measurable results.",
    ],
    closers: [
      "Backed by rigorous testing and proven specifications.",
      "Performance you can measure, quality you can trust.",
      "Specifications that speak for themselves.",
    ],
  },
  playful: {
    adjectives: [
      "amazing",
      "delightful",
      "super fun",
      "ridiculously good",
      "wow-worthy",
      "magical",
      "joyful",
      "epic",
    ],
    verbs: [
      "spark",
      "brighten",
      "transform",
      "light up",
      "supercharge",
      "unleash",
      "power up",
      "jazz up",
    ],
    openers: [
      "Ready to have your mind blown?",
      "Warning: extreme awesomeness ahead!",
      "Get ready for something truly special.",
    ],
    closers: [
      "Life is too short for boring stuff!",
      "Happiness delivered straight to your door.",
      "Join the fun and never look back!",
    ],
  },
  professional: {
    adjectives: [
      "premium",
      "industry-leading",
      "trusted",
      "proven",
      "best-in-class",
      "dependable",
      "versatile",
      "superior",
    ],
    verbs: [
      "empower",
      "ensure",
      "provide",
      "support",
      "facilitate",
      "accomplish",
      "establish",
      "maintain",
    ],
    openers: [
      "The smart choice for discerning buyers.",
      "Quality and value, perfectly balanced.",
      "Trusted by professionals who demand the best.",
    ],
    closers: [
      "A sound investment for lasting satisfaction.",
      "Your success starts with the right tools.",
      "Quality that stands the test of time.",
    ],
  },
};

const CATEGORY_CONTEXT: Record<Category, { audience: string; keywords: string[] }> = {
  electronics: {
    audience: "tech enthusiasts and everyday users",
    keywords: ["innovative", "connectivity", "smart", "powerful", "seamless"],
  },
  fashion: {
    audience: "style-conscious shoppers",
    keywords: ["trend", "wardrobe", "flattering", "versatile", "statement"],
  },
  home: {
    audience: "homeowners and decor lovers",
    keywords: ["cozy", "functional", "space", "aesthetic", "transform"],
  },
  beauty: {
    audience: "beauty enthusiasts",
    keywords: ["radiant", "glow", "nourish", "luminous", "skin"],
  },
  food: {
    audience: "food lovers and home cooks",
    keywords: ["flavor", "fresh", "delicious", "savor", "artisan"],
  },
  sports: {
    audience: "athletes and fitness enthusiasts",
    keywords: ["performance", "endurance", "strength", "agile", "champion"],
  },
  general: {
    audience: "everyday shoppers",
    keywords: ["quality", "value", "reliable", "essential", "practical"],
  },
};

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function shuffleArray<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function parseFeatures(raw: string): string[] {
  const lines = raw.split(/[\n,]+/).map((s) => s.trim()).filter((s) => s.length > 0);
  return lines;
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// --- Description generators ---

function generateFeatureBenefit(
  name: string,
  features: string[],
  tone: Tone,
  category: Category,
  length: DescLength
): string {
  const vocab = TONE_VOCAB[tone];
  const ctx = CATEGORY_CONTEXT[category];
  const adj1 = pickRandom(vocab.adjectives);
  const adj2 = pickRandom(vocab.adjectives.filter((a) => a !== adj1));
  const verb = pickRandom(vocab.verbs);

  const intro = `The ${name} is a ${adj1} solution designed for ${ctx.audience}. `;

  const benefitLines = features.slice(0, length === "short" ? 2 : length === "medium" ? 4 : 8).map((f) => {
    const benefitVerb = pickRandom(vocab.verbs);
    const benefitAdj = pickRandom(vocab.adjectives);
    return `${capitalize(f)} - ${capitalize(benefitVerb)} your experience with ${benefitAdj} quality that makes a real difference.`;
  });

  if (length === "short") {
    return `${name}: ${capitalize(adj1)}. ${capitalize(adj2)}. Built to ${verb}. ${benefitLines[0] || ""}`.trim();
  }

  const mid = benefitLines.join(" ");

  if (length === "medium") {
    return `${intro}${mid} ${pickRandom(vocab.closers)}`;
  }

  // detailed
  const keywordSentence = `Featuring ${pickRandom(ctx.keywords)} design and ${pickRandom(ctx.keywords)} engineering, the ${name} stands out in the ${category} category.`;
  return `${intro}\n\n${mid}\n\n${keywordSentence} ${pickRandom(vocab.closers)}`;
}

function generateLifestyle(
  name: string,
  features: string[],
  tone: Tone,
  category: Category,
  length: DescLength
): string {
  const vocab = TONE_VOCAB[tone];
  const ctx = CATEGORY_CONTEXT[category];
  const adj = pickRandom(vocab.adjectives);
  const verb = pickRandom(vocab.verbs);

  const scenarios: Record<Category, string[]> = {
    electronics: [
      "Picture yourself effortlessly connected, with technology that anticipates your every need.",
      "Imagine a world where every task feels seamless and every moment stays captured.",
    ],
    fashion: [
      "Step into the room and feel all eyes on you.",
      "Imagine opening your wardrobe to the perfect piece for every occasion.",
    ],
    home: [
      "Come home to a space that feels like a warm embrace.",
      "Picture your living space transformed into the sanctuary you deserve.",
    ],
    beauty: [
      "Wake up, look in the mirror, and love what you see.",
      "Imagine a morning routine that leaves you glowing with confidence.",
    ],
    food: [
      "Close your eyes and let the aroma take you somewhere wonderful.",
      "Imagine gathering your loved ones around a table full of incredible flavors.",
    ],
    sports: [
      "Feel the rush as you push past your limits with confidence.",
      "Picture your best performance, powered by gear that keeps up with you.",
    ],
    general: [
      "Imagine a product that fits your life like it was made just for you.",
      "Picture the moment when everything just clicks into place.",
    ],
  };

  const scenario = pickRandom(scenarios[category]);

  if (length === "short") {
    return `${scenario} Meet the ${name}. ${capitalize(adj)}. ${capitalize(verb)} your world.`;
  }

  const featureWoven = features
    .slice(0, length === "medium" ? 3 : 6)
    .map((f) => `With ${f.toLowerCase()}, you will ${pickRandom(vocab.verbs)} the way you ${pickRandom(["live", "work", "play", "create", "relax"])}.`)
    .join(" ");

  if (length === "medium") {
    return `${scenario} The ${name} brings together ${adj} design and thoughtful functionality. ${featureWoven} ${pickRandom(vocab.closers)}`;
  }

  // detailed
  const opener = pickRandom(vocab.openers);
  return `${opener}\n\n${scenario} The ${name} was created for ${ctx.audience} who demand ${adj} quality in every detail.\n\n${featureWoven}\n\nFrom ${features[0]?.toLowerCase() || "its core design"} to ${features[features.length - 1]?.toLowerCase() || "its finishing touches"}, every element has been thoughtfully considered. ${pickRandom(vocab.closers)}`;
}

function generateSeoOptimized(
  name: string,
  features: string[],
  tone: Tone,
  category: Category,
  length: DescLength
): string {
  const vocab = TONE_VOCAB[tone];
  const ctx = CATEGORY_CONTEXT[category];
  const adj = pickRandom(vocab.adjectives);

  const seoName = name.toLowerCase();
  const featureKeywords = features.slice(0, 4).map((f) => f.toLowerCase()).join(", ");

  if (length === "short") {
    return `Shop the ${adj} ${name} - featuring ${featureKeywords || `${pickRandom(ctx.keywords)} design`}. ${pickRandom(vocab.closers)}`;
  }

  const featureBullets = features
    .slice(0, length === "medium" ? 4 : 8)
    .map((f) => `- ${capitalize(f)}`)
    .join("\n");

  const introSeo = `Discover the ${name}, a ${adj} ${category !== "general" ? category : ""} product built with ${pickRandom(ctx.keywords)} technology for ${ctx.audience}. Whether you are searching for the best ${seoName} or a ${pickRandom(ctx.keywords)} upgrade, this is the ${pickRandom(vocab.adjectives)} choice.`;

  if (length === "medium") {
    return `${introSeo}\n\nKey features:\n${featureBullets}\n\n${pickRandom(vocab.closers)}`;
  }

  // detailed
  const midSection = `The ${name} ${pickRandom(vocab.verbs)}s exceptional value across every metric. Designed for ${ctx.audience}, it combines ${pickRandom(ctx.keywords)} innovation with ${adj} craftsmanship. Each feature has been carefully selected to ${pickRandom(vocab.verbs)} real-world results.`;

  const closingSeo = `Looking for the perfect ${seoName}? With features like ${featureKeywords || "outstanding build quality"}, the ${name} delivers on every promise. Order today and experience the difference that ${pickRandom(ctx.keywords)} quality makes.`;

  return `${introSeo}\n\n${midSection}\n\nKey features:\n${featureBullets}\n\n${closingSeo}`;
}

interface GeneratedDescription {
  label: string;
  framework: string;
  text: string;
}

function generateDescriptions(
  name: string,
  featuresRaw: string,
  tone: Tone,
  category: Category,
  length: DescLength
): GeneratedDescription[] {
  const features = parseFeatures(featuresRaw);

  if (!name.trim()) return [];

  const fallbackFeatures = features.length > 0 ? features : ["premium quality", "thoughtful design", "exceptional value"];

  return [
    {
      label: "Feature-Benefit",
      framework: "Highlights each feature and translates it into a tangible customer benefit.",
      text: generateFeatureBenefit(name.trim(), fallbackFeatures, tone, category, length),
    },
    {
      label: "Lifestyle / Story",
      framework: "Paints a vivid picture of the customer using and enjoying the product.",
      text: generateLifestyle(name.trim(), fallbackFeatures, tone, category, length),
    },
    {
      label: "SEO-Optimized",
      framework: "Naturally weaves keywords and search terms throughout the copy.",
      text: generateSeoOptimized(name.trim(), fallbackFeatures, tone, category, length),
    },
  ];
}

// --- FAQ data ---

const FAQ_DATA = [
  {
    question: "How does this AI product description generator work?",
    answer:
      "This tool uses template-based copywriting frameworks to generate product descriptions entirely in your browser. You provide the product name, features, category, and desired tone, and the generator creates multiple variations using proven copywriting techniques like feature-benefit analysis, lifestyle storytelling, and SEO-optimized formatting. No data is sent to any server.",
  },
  {
    question: "Are the generated descriptions unique?",
    answer:
      "Yes. Each generation produces unique descriptions by randomly combining vocabulary, sentence structures, and copywriting frameworks based on your inputs. The tone, category, and feature inputs all influence the final output. You can generate multiple times to get different variations.",
  },
  {
    question: "Can I use these descriptions for my online store?",
    answer:
      "Absolutely. The generated descriptions are yours to use however you like, including on e-commerce platforms like Shopify, WooCommerce, Amazon, Etsy, and more. We recommend editing the output to add your brand voice and any specific details unique to your product.",
  },
  {
    question: "Is my product data safe?",
    answer:
      "Yes. All description generation happens entirely in your browser using client-side JavaScript. No product names, features, or other data is ever sent to a server. Your product information stays completely private.",
  },
];

// --- Component ---

export default function AIProductDescriptionGeneratorPage() {
  const [productName, setProductName] = useState("");
  const [features, setFeatures] = useState("");
  const [category, setCategory] = useState<Category>("general");
  const [tone, setTone] = useState<Tone>("professional");
  const [length, setLength] = useState<DescLength>("medium");
  const [results, setResults] = useState<GeneratedDescription[]>([]);
  const [copied, setCopied] = useState<string | null>(null);

  const handleGenerate = useCallback(() => {
    const descs = generateDescriptions(productName, features, tone, category, length);
    setResults(descs);
  }, [productName, features, tone, category, length]);

  const copyText = useCallback(async (text: string, label: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  }, []);

  return (
    <>
      <title>
        Free AI Product Description Generator - E-Commerce Copy That Sells |
        DevTools
      </title>
      <meta
        name="description"
        content="Free AI product description generator for e-commerce. Create compelling product copy using proven copywriting frameworks. No signup, no API calls, runs in your browser."
      />
      <JsonLd
        data={[
          generateWebAppSchema({
            slug: "ai-product-description-generator",
            name: "AI Product Description Generator",
            description:
              "Generate compelling e-commerce product descriptions using proven copywriting frameworks. Multiple tones, categories, and lengths.",
            category: "generator",
          }),
          generateBreadcrumbSchema({
            slug: "ai-product-description-generator",
            name: "AI Product Description Generator",
            description:
              "Generate compelling e-commerce product descriptions using proven copywriting frameworks",
            category: "generator",
          }),
          generateFAQSchema(FAQ_DATA),
        ]}
      />

      <div className="min-h-screen bg-slate-900 text-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <ToolBreadcrumb slug="ai-product-description-generator" />

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
              AI Product Description Generator
            </h1>
            <p className="text-slate-400 max-w-3xl">
              Generate compelling e-commerce product descriptions using proven
              copywriting frameworks. Enter your product details, choose a tone
              and style, and get multiple description variations instantly. No
              API calls — everything runs in your browser.
            </p>
          </div>

          <AdUnit slot="TOP_SLOT" format="horizontal" className="mb-6" />

          {/* Main Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
            {/* Input Panel */}
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 space-y-5">
              <h2 className="text-lg font-semibold text-white">
                Product Details
              </h2>

              {/* Product Name */}
              <div>
                <label
                  htmlFor="product-name"
                  className="block text-sm font-medium text-slate-300 mb-1"
                >
                  Product Name
                </label>
                <input
                  id="product-name"
                  type="text"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  placeholder="e.g. AirPods Max, Ceramic Plant Pot, Running Jacket"
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-600 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Key Features */}
              <div>
                <label
                  htmlFor="features"
                  className="block text-sm font-medium text-slate-300 mb-1"
                >
                  Key Features / Details
                </label>
                <textarea
                  id="features"
                  value={features}
                  onChange={(e) => setFeatures(e.target.value)}
                  placeholder={
                    "Enter features separated by new lines or commas:\n\nActive noise cancellation\nPremium memory foam cushions\n40-hour battery life\nSpatial audio support"
                  }
                  rows={6}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-600 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y"
                />
              </div>

              {/* Category */}
              <div>
                <label
                  htmlFor="category"
                  className="block text-sm font-medium text-slate-300 mb-1"
                >
                  Category
                </label>
                <select
                  id="category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value as Category)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-600 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="general">General</option>
                  <option value="electronics">Electronics</option>
                  <option value="fashion">Fashion</option>
                  <option value="home">Home &amp; Living</option>
                  <option value="beauty">Beauty &amp; Skincare</option>
                  <option value="food">Food &amp; Beverage</option>
                  <option value="sports">Sports &amp; Fitness</option>
                </select>
              </div>

              {/* Tone */}
              <div>
                <label
                  htmlFor="tone"
                  className="block text-sm font-medium text-slate-300 mb-1"
                >
                  Tone
                </label>
                <select
                  id="tone"
                  value={tone}
                  onChange={(e) => setTone(e.target.value as Tone)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-600 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="professional">Professional</option>
                  <option value="luxury">Luxury</option>
                  <option value="casual">Casual</option>
                  <option value="technical">Technical</option>
                  <option value="playful">Playful</option>
                </select>
              </div>

              {/* Length */}
              <div>
                <label
                  htmlFor="length"
                  className="block text-sm font-medium text-slate-300 mb-1"
                >
                  Description Length
                </label>
                <select
                  id="length"
                  value={length}
                  onChange={(e) => setLength(e.target.value as DescLength)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-600 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="short">Short Tagline</option>
                  <option value="medium">Medium Paragraph</option>
                  <option value="detailed">Detailed Full Description</option>
                </select>
              </div>

              {/* Generate Button */}
              <button
                onClick={handleGenerate}
                disabled={!productName.trim()}
                className="w-full py-3 px-4 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-semibold transition-colors"
              >
                Generate Description
              </button>
            </div>

            {/* Output Panel */}
            <div className="space-y-4">
              {results.length === 0 ? (
                <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 flex items-center justify-center min-h-[400px]">
                  <p className="text-slate-500 text-center">
                    Enter your product details and click &ldquo;Generate
                    Description&rdquo; to see results here.
                  </p>
                </div>
              ) : (
                results.map((desc) => (
                  <div
                    key={desc.label}
                    className="bg-slate-800 rounded-xl border border-slate-700 p-5"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="text-sm font-semibold text-white">
                          {desc.label}
                        </h3>
                        <p className="text-xs text-slate-500">
                          {desc.framework}
                        </p>
                      </div>
                      <button
                        onClick={() => copyText(desc.text, desc.label)}
                        className="shrink-0 ml-3 px-3 py-1 text-xs rounded-md bg-slate-700 hover:bg-slate-600 text-slate-300 transition-colors"
                      >
                        {copied === desc.label ? "Copied!" : "Copy"}
                      </button>
                    </div>
                    <div className="whitespace-pre-wrap text-sm text-slate-300 leading-relaxed bg-slate-900 rounded-lg p-4 border border-slate-700">
                      {desc.text}
                    </div>
                  </div>
                ))
              )}

              {results.length > 0 && (
                <button
                  onClick={handleGenerate}
                  className="w-full py-2 px-4 rounded-lg border border-slate-600 hover:border-slate-500 text-slate-300 hover:text-white text-sm transition-colors"
                >
                  Regenerate All Variations
                </button>
              )}
            </div>
          </div>

          {/* Copywriting Tips Section */}
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 mb-10">
            <h2 className="text-xl font-bold text-white mb-4">
              Copywriting Tips for Better Product Descriptions
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                {
                  name: "Lead with benefits, not features",
                  tip: "Customers care about what a product does for them, not just what it is. Translate every feature into a benefit: 'waterproof' becomes 'stay dry in any weather'.",
                },
                {
                  name: "Know your target audience",
                  tip: "Write as if you are speaking to one specific person. A luxury watch buyer and a budget fitness tracker buyer need completely different language.",
                },
                {
                  name: "Use sensory and power words",
                  tip: "Words like 'effortless', 'transform', 'exclusive', and 'guarantee' trigger emotional responses and drive action.",
                },
                {
                  name: "Keep it scannable",
                  tip: "Use short paragraphs, bullet points, and bold key phrases. Most shoppers scan descriptions rather than reading every word.",
                },
                {
                  name: "Include social proof cues",
                  tip: "Phrases like 'best-selling', 'trusted by thousands', or 'as featured in' build credibility without needing actual reviews.",
                },
                {
                  name: "End with a clear call to action",
                  tip: "Tell the reader what to do next: 'Add to cart', 'Order today', or 'Experience the difference'. Never leave the next step ambiguous.",
                },
                {
                  name: "Optimize for search engines",
                  tip: "Include your primary keyword in the first sentence and naturally throughout. Use long-tail keywords that shoppers actually search for.",
                },
                {
                  name: "A/B test your copy",
                  tip: "Write multiple versions and test which performs better. Small wording changes can significantly impact conversion rates.",
                },
                {
                  name: "Match tone to brand identity",
                  tip: "Consistency matters. If your brand is playful, every description should feel playful. Mixing tones confuses customers and weakens trust.",
                },
              ].map((item) => (
                <div key={item.name} className="bg-slate-900 rounded-lg p-4 border border-slate-700">
                  <h3 className="text-sm font-medium text-white mb-1">
                    {item.name}
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {item.tip}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <AdUnit slot="BOTTOM_SLOT" format="auto" className="mb-6" />

          <RelatedTools currentSlug="ai-product-description-generator" />

          {/* FAQ Section */}
          <section className="mt-16 border-t border-slate-700 pt-10">
            <h2 className="text-2xl font-bold text-white mb-6">
              Frequently Asked Questions
            </h2>

            <div className="space-y-6">
              {FAQ_DATA.map((faq) => (
                <div key={faq.question}>
                  <h3 className="text-lg font-semibold text-white mb-2">
                    {faq.question}
                  </h3>
                  <p className="text-slate-400">{faq.answer}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
