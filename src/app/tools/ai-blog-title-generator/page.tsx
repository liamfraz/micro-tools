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

type Style =
  | "how-to"
  | "listicle"
  | "question"
  | "controversial"
  | "data-driven"
  | "guide";

type Tone =
  | "professional"
  | "casual"
  | "witty"
  | "urgent"
  | "inspirational";

interface GeneratedTitle {
  text: string;
  charCount: number;
}

const STYLES: { value: Style; label: string }[] = [
  { value: "how-to", label: "How-To" },
  { value: "listicle", label: "Listicle" },
  { value: "question", label: "Question" },
  { value: "controversial", label: "Controversial" },
  { value: "data-driven", label: "Data-Driven" },
  { value: "guide", label: "Guide" },
];

const TONES: { value: Tone; label: string }[] = [
  { value: "professional", label: "Professional" },
  { value: "casual", label: "Casual" },
  { value: "witty", label: "Witty" },
  { value: "urgent", label: "Urgent" },
  { value: "inspirational", label: "Inspirational" },
];

const TEMPLATES: Record<Style, string[]> = {
  "how-to": [
    "How to {topic} in {n} Simple Steps",
    "The Ultimate Guide to {topic}",
    "How to {topic} Like a Pro",
    "{topic}: A Step-by-Step Tutorial",
    "How to Master {topic} Without Breaking a Sweat",
    "How to {topic} (Even If You're a Complete Beginner)",
    "The Smartest Way to {topic} in {year}",
    "How to {topic} Faster Than You Think",
    "How to {topic} and Get Results Immediately",
    "{n} Steps to {topic} the Right Way",
    "How to Finally {topic} Without Wasting Time",
    "The Proven Method to {topic} Successfully",
    "How to {topic}: Tips From Industry Experts",
    "How to {topic} on a Budget",
    "The No-Nonsense Guide to {topic}",
  ],
  listicle: [
    "{n} {adj} {topic} Tips That Actually Work",
    "Top {n} {topic} Strategies for {year}",
    "{n} {topic} Mistakes You're Probably Making",
    "{n} Reasons Why {topic} Matters More Than Ever",
    "{n} {adj} Ways to Improve Your {topic}",
    "{n} {topic} Hacks Every Professional Should Know",
    "{n} Things I Wish I Knew About {topic} Sooner",
    "The {n} Best {topic} Tools You Need in {year}",
    "{n} {adj} {topic} Examples to Inspire You",
    "{n} {topic} Trends to Watch in {year}",
    "{n} Common {topic} Myths Debunked",
    "{n} {adj} {topic} Lessons From the Experts",
    "{n} Quick {topic} Wins You Can Implement Today",
    "The Only {n} {topic} Rules You Need to Follow",
    "{n} {topic} Secrets Nobody Talks About",
  ],
  question: [
    "Is {topic} Really Worth It?",
    "What Nobody Tells You About {topic}",
    "Why Is Everyone Talking About {topic}?",
    "What Would Happen If You Mastered {topic}?",
    "Are You Making These {topic} Mistakes?",
    "What's the Real Cost of Ignoring {topic}?",
    "Why Do So Many People Fail at {topic}?",
    "Is {topic} the Future of Your Industry?",
    "What If Everything You Know About {topic} Is Wrong?",
    "How Much Time Are You Wasting on {topic}?",
    "Ready to Transform Your Approach to {topic}?",
    "What Separates {topic} Experts From Beginners?",
    "Does {topic} Actually Work? Here's the Truth",
    "Why Aren't You Seeing Results With {topic}?",
    "Can {topic} Really Change Your Business?",
  ],
  controversial: [
    "Why Everything You Know About {topic} Is Wrong",
    "The Uncomfortable Truth About {topic}",
    "Stop Doing {topic} the Wrong Way",
    "{topic} Is Dead -- Here's What's Next",
    "The {topic} Lie That's Costing You {adj} Results",
    "Why Most {topic} Advice Is Completely Backwards",
    "The Dark Side of {topic} Nobody Talks About",
    "I Quit {topic} for 30 Days -- Here's What Happened",
    "The {topic} Industry Doesn't Want You to Know This",
    "Why {topic} Experts Are Getting It Wrong",
    "The Case Against Traditional {topic}",
    "Unpopular Opinion: {topic} Is Overrated",
    "{topic} Myths That Are Holding You Back",
    "Why I Changed My Mind About {topic}",
    "The {topic} Mistake That's Ruining Your Results",
  ],
  "data-driven": [
    "{pct}% of People Get {topic} Wrong -- Here's the Fix",
    "The Science Behind {topic}: What the Data Says",
    "We Analyzed {bigN}+ {topic} Results -- Here's What We Found",
    "{topic} by the Numbers: {year} Statistics You Need to See",
    "New Research Reveals the Best Approach to {topic}",
    "{topic}: {pct}% of Professionals Miss This Critical Step",
    "The Data Is Clear: {topic} Changes Everything",
    "A {bigN}-Case Study on {topic}: Key Findings",
    "What {bigN} Data Points Tell Us About {topic}",
    "{topic} ROI: The Numbers Don't Lie",
    "The {year} {topic} Benchmark Report: Key Takeaways",
    "How {pct}% Improvement in {topic} Transformed Our Results",
    "The Surprising {topic} Statistics for {year}",
    "Evidence-Based {topic}: What Actually Works",
    "The {topic} Metrics That Actually Matter in {year}",
  ],
  guide: [
    "The Complete {year} Guide to {topic}",
    "{topic} 101: Everything You Need to Know",
    "The Beginner's Guide to {topic}",
    "The Definitive {topic} Playbook",
    "{topic} for Beginners: Where to Start in {year}",
    "The {topic} Handbook: From Novice to Expert",
    "Your Essential {topic} Checklist for {year}",
    "The A-to-Z Guide to {topic}",
    "{topic} Made Simple: A Practical Guide",
    "The Only {topic} Resource You'll Ever Need",
    "Everything You Need to Know About {topic} in {year}",
    "{topic} Demystified: A Plain-Language Guide",
    "The Complete {topic} Blueprint for Success",
    "From Zero to Hero: Your {topic} Roadmap",
    "The {topic} Starter Kit: Everything in One Place",
  ],
};

const ADJECTIVES_BY_TONE: Record<Tone, string[]> = {
  professional: [
    "Essential",
    "Proven",
    "Strategic",
    "Critical",
    "Effective",
    "Key",
    "Actionable",
    "Powerful",
  ],
  casual: [
    "Awesome",
    "Cool",
    "Super Useful",
    "Game-Changing",
    "Fun",
    "Easy",
    "Simple",
    "Handy",
  ],
  witty: [
    "Ridiculously Good",
    "Surprisingly Simple",
    "Hilariously Effective",
    "Absurdly Useful",
    "Oddly Satisfying",
    "Sneaky",
    "Clever",
    "Genius",
  ],
  urgent: [
    "Must-Know",
    "Critical",
    "Time-Sensitive",
    "Urgent",
    "Essential",
    "Crucial",
    "Immediate",
    "Non-Negotiable",
  ],
  inspirational: [
    "Transformative",
    "Life-Changing",
    "Inspiring",
    "Remarkable",
    "Incredible",
    "Breakthrough",
    "Empowering",
    "Extraordinary",
  ],
};

function capitalize(str: string): string {
  if (!str) return str;
  return str
    .split(" ")
    .map((word) => {
      if (word.length === 0) return word;
      // Keep small words lowercase unless first word
      const smallWords = ["a", "an", "the", "and", "or", "but", "in", "on", "at", "to", "for", "of", "with", "by"];
      if (smallWords.includes(word.toLowerCase())) return word.toLowerCase();
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .map((word, i) => {
      // Always capitalize first word
      if (i === 0) return word.charAt(0).toUpperCase() + word.slice(1);
      return word;
    })
    .join(" ");
}

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return s / 2147483647;
  };
}

function shuffleArray<T>(arr: T[], rand: () => number): T[] {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function generateTitles(
  topic: string,
  style: Style,
  tone: Tone
): GeneratedTitle[] {
  const trimmed = topic.trim();
  if (!trimmed) return [];

  const formattedTopic = capitalize(trimmed);
  const year = new Date().getFullYear();
  const adjectives = ADJECTIVES_BY_TONE[tone];
  const templates = TEMPLATES[style];

  // Use current timestamp as seed for variety between generations
  const rand = seededRandom(Date.now());

  // Shuffle templates and pick 10
  const shuffled = shuffleArray(templates, rand);
  const selected = shuffled.slice(0, 10);

  // If we somehow have fewer than 10 templates, cycle through again
  while (selected.length < 10) {
    const extra = shuffleArray(templates, rand);
    for (const t of extra) {
      if (selected.length >= 10) break;
      if (!selected.includes(t)) selected.push(t);
    }
    // Safety: if all templates used, allow repeats with different numbers
    if (selected.length < 10) {
      selected.push(templates[selected.length % templates.length]);
    }
  }

  return selected.map((template) => {
    const n = Math.floor(rand() * 10) + 5; // 5-14
    const bigN = (Math.floor(rand() * 9) + 1) * 1000; // 1000-9000
    const pct = Math.floor(rand() * 40) + 55; // 55-94
    const adj = adjectives[Math.floor(rand() * adjectives.length)];

    const text = template
      .replace("{topic}", formattedTopic)
      .replace("{n}", String(n))
      .replace("{bigN}", String(bigN).replace(/\B(?=(\d{3})+(?!\d))/g, ","))
      .replace("{year}", String(year))
      .replace("{adj}", adj)
      .replace("{pct}", String(pct));

    return {
      text,
      charCount: text.length,
    };
  });
}

export default function AIBlogTitleGeneratorPage() {
  const [topic, setTopic] = useState("");
  const [style, setStyle] = useState<Style>("how-to");
  const [tone, setTone] = useState<Tone>("professional");
  const [titles, setTitles] = useState<GeneratedTitle[]>([]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);

  const handleGenerate = useCallback(() => {
    const results = generateTitles(topic, style, tone);
    setTitles(results);
    setCopiedIndex(null);
    setCopiedAll(false);
  }, [topic, style, tone]);

  const copyToClipboard = useCallback(async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch {
      /* clipboard not available */
    }
  }, []);

  const copyAll = useCallback(async () => {
    if (titles.length === 0) return;
    try {
      const allText = titles.map((t, i) => `${i + 1}. ${t.text}`).join("\n");
      await navigator.clipboard.writeText(allText);
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 2000);
    } catch {
      /* clipboard not available */
    }
  }, [titles]);

  return (
    <>
      <title>
        Free AI Blog Title Generator - 10 Catchy Headlines Instantly | DevTools
      </title>
      <meta
        name="description"
        content="Free blog title generator. Get 10 catchy, SEO-friendly blog post titles for any topic. Choose from how-to, listicle, question, and more styles. No signup required."
      />
      <meta
        name="keywords"
        content="blog title generator, headline generator, blog post title ideas, catchy title generator, seo title generator, blog headline tool, free title generator"
      />
      <JsonLd
        data={[
          generateWebAppSchema({
            slug: "ai-blog-title-generator",
            name: "AI Blog Title Generator",
            description:
              "Generate 10 catchy, SEO-friendly blog post titles for any topic. Choose from how-to, listicle, question, controversial, data-driven, and guide styles with adjustable tone.",
            category: "generator",
          }),
          generateBreadcrumbSchema({
            slug: "ai-blog-title-generator",
            name: "AI Blog Title Generator",
            description:
              "Generate 10 catchy, SEO-friendly blog post titles for any topic. Choose from how-to, listicle, question, controversial, data-driven, and guide styles with adjustable tone.",
            category: "generator",
          }),
          generateFAQSchema([
            {
              question: "How does the blog title generator work?",
              answer:
                "The tool uses a large library of proven title templates organized by style (how-to, listicle, question, etc.). When you enter a topic, it inserts your keyword into randomly selected templates and adjusts adjectives and phrasing based on your chosen tone. Everything runs in your browser with no data sent to any server.",
            },
            {
              question: "Are the generated titles SEO-friendly?",
              answer:
                "Yes. The title templates follow proven headline formulas that perform well in search results and social media. They incorporate your target keyword naturally, use power words that boost click-through rates, and keep character counts visible so you can stay within search engine display limits (typically under 60 characters).",
            },
            {
              question: "Can I use these titles for my blog posts?",
              answer:
                "Absolutely. All generated titles are free to use for any purpose including personal blogs, business content, social media posts, YouTube videos, newsletters, and more. There are no usage restrictions or attribution requirements.",
            },
            {
              question: "Why do I get different titles each time I click generate?",
              answer:
                "The tool randomly selects from a large pool of title templates and varies the numbers, adjectives, and phrasing with each generation. This ensures you always get fresh ideas. If you don't see a title you like, simply click Generate Titles again for a new set of 10 options.",
            },
          ]),
        ]}
      />

      <div className="min-h-screen bg-slate-900 text-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <ToolBreadcrumb slug="ai-blog-title-generator" />

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
              AI Blog Title Generator
            </h1>
            <p className="text-slate-400 max-w-2xl text-lg">
              Generate 10 catchy, SEO-friendly blog post titles instantly. Enter
              your topic, pick a style and tone, and get headline ideas ready to
              use — no sign-up, no API calls, everything runs in your browser.
            </p>
          </div>

          <AdUnit slot="TOP_SLOT" format="horizontal" className="mb-6" />

          {/* Input Controls */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
            {/* Topic Input */}
            <div className="lg:col-span-2">
              <label className="text-xs text-slate-400 mb-1.5 block">
                Blog Topic or Keyword *
              </label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && topic.trim()) handleGenerate();
                }}
                placeholder="e.g., content marketing, meal prep, React hooks, remote work productivity"
                className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-3 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Style Selector */}
            <div>
              <label className="text-xs text-slate-400 mb-1.5 block">
                Title Style
              </label>
              <select
                value={style}
                onChange={(e) => setStyle(e.target.value as Style)}
                className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-3 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {STYLES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Tone Selector */}
            <div>
              <label className="text-xs text-slate-400 mb-1.5 block">
                Tone
              </label>
              <select
                value={tone}
                onChange={(e) => setTone(e.target.value as Tone)}
                className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-3 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {TONES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Generate Button Row */}
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <button
              onClick={handleGenerate}
              disabled={!topic.trim()}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Generate Titles
            </button>
            {titles.length > 0 && (
              <button
                onClick={copyAll}
                className="px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors text-sm"
              >
                {copiedAll ? "Copied All!" : "Copy All Titles"}
              </button>
            )}
            {titles.length > 0 && (
              <button
                onClick={() => {
                  setTitles([]);
                  setCopiedIndex(null);
                  setCopiedAll(false);
                }}
                className="px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors text-sm"
              >
                Clear
              </button>
            )}
          </div>

          {/* Generated Titles */}
          {titles.length > 0 && (
            <div className="space-y-2 mb-6">
              <h2 className="text-lg font-semibold text-white mb-3">
                Generated Titles ({titles.length})
              </h2>
              {titles.map((title, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 group hover:border-slate-600 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <span className="text-xs font-mono bg-slate-700 text-slate-400 px-2 py-0.5 rounded shrink-0">
                      {index + 1}
                    </span>
                    <span className="text-sm text-slate-200 truncate">
                      {title.text}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 ml-3">
                    <span
                      className={`text-xs ${
                        title.charCount <= 60
                          ? "text-green-400"
                          : title.charCount <= 70
                          ? "text-yellow-400"
                          : "text-red-400"
                      }`}
                    >
                      {title.charCount} chars
                    </span>
                    <button
                      onClick={() => copyToClipboard(title.text, index)}
                      className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white rounded text-xs font-medium transition-colors"
                    >
                      {copiedIndex === index ? "Copied!" : "Copy"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty State */}
          {titles.length === 0 && (
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-8 mb-6 text-center">
              <p className="text-slate-500">
                Enter a blog topic above and click &ldquo;Generate
                Titles&rdquo; to get 10 catchy headline ideas.
              </p>
            </div>
          )}

          {/* Blog Title Tips */}
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 mb-6">
            <h2 className="text-lg font-semibold text-white mb-4">
              Blog Title Tips
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
              {[
                {
                  name: "Keep It Under 60 Characters",
                  tip: "Search engines truncate titles beyond 60 characters. Shorter titles display fully in SERPs and get higher click-through rates.",
                },
                {
                  name: "Use Numbers When Possible",
                  tip: "Headlines with numbers get 36% more clicks on average. Odd numbers like 7, 9, and 11 tend to outperform even numbers.",
                },
                {
                  name: "Front-Load Your Keyword",
                  tip: "Place your target keyword as close to the beginning of the title as possible. This helps with both SEO rankings and reader attention.",
                },
                {
                  name: "Include Power Words",
                  tip: "Words like 'ultimate', 'proven', 'essential', and 'surprising' trigger emotional responses and boost click-through rates.",
                },
                {
                  name: "Create a Curiosity Gap",
                  tip: "Hint at valuable information without revealing everything. Questions and 'what nobody tells you' formats work well for this.",
                },
                {
                  name: "Match Search Intent",
                  tip: "Align your title with what people are actually searching for. Use tools like Google autocomplete to see how users phrase queries.",
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

          <RelatedTools currentSlug="ai-blog-title-generator" />

          {/* FAQ Section */}
          <section className="mt-16 border-t border-slate-700 pt-10">
            <h2 className="text-2xl font-bold text-white mb-6">
              Frequently Asked Questions
            </h2>

            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  How does the blog title generator work?
                </h3>
                <p className="text-slate-400">
                  The tool uses a large library of proven title templates
                  organized by style (how-to, listicle, question, etc.). When
                  you enter a topic, it inserts your keyword into randomly
                  selected templates and adjusts adjectives and phrasing based
                  on your chosen tone. Everything runs in your browser with no
                  data sent to any server.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Are the generated titles SEO-friendly?
                </h3>
                <p className="text-slate-400">
                  Yes. The title templates follow proven headline formulas that
                  perform well in search results and social media. They
                  incorporate your target keyword naturally, use power words that
                  boost click-through rates, and keep character counts visible so
                  you can stay within search engine display limits (typically
                  under 60 characters).
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Can I use these titles for my blog posts?
                </h3>
                <p className="text-slate-400">
                  Absolutely. All generated titles are free to use for any
                  purpose including personal blogs, business content, social
                  media posts, YouTube videos, newsletters, and more. There are
                  no usage restrictions or attribution requirements.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Why do I get different titles each time I click generate?
                </h3>
                <p className="text-slate-400">
                  The tool randomly selects from a large pool of title templates
                  and varies the numbers, adjectives, and phrasing with each
                  generation. This ensures you always get fresh ideas. If you
                  don&apos;t see a title you like, simply click Generate Titles
                  again for a new set of 10 options.
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
