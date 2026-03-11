"use client";

import { useState, useCallback } from "react";

// Classic Lorem Ipsum vocabulary — standard words used by generators
const WORDS = [
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
  "volutpat", "vulputate"
];

const CLASSIC_FIRST = "Lorem ipsum dolor sit amet, consectetur adipiscing elit.";

type OutputType = "paragraphs" | "sentences" | "words" | "list-items";

const randInt = (min: number, max: number): number =>
  Math.floor(Math.random() * (max - min + 1)) + min;

const randWord = (): string => WORDS[randInt(0, WORDS.length - 1)];

const capitalize = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1);

const generateSentence = (minWords: number, maxWords: number): string => {
  const count = randInt(minWords, maxWords);
  const words: string[] = [];
  for (let i = 0; i < count; i++) {
    words.push(randWord());
  }
  return capitalize(words.join(" ")) + ".";
};

const generateParagraph = (minSentences: number, maxSentences: number): string => {
  const count = randInt(minSentences, maxSentences);
  const sentences: string[] = [];
  for (let i = 0; i < count; i++) {
    sentences.push(generateSentence(6, 15));
  }
  return sentences.join(" ");
};

const generateText = (
  type: OutputType,
  count: number,
  startWithLorem: boolean
): string => {
  const results: string[] = [];

  if (type === "paragraphs") {
    for (let i = 0; i < count; i++) {
      const para = generateParagraph(4, 8);
      if (i === 0 && startWithLorem) {
        results.push(CLASSIC_FIRST + " " + para);
      } else {
        results.push(para);
      }
    }
    return results.join("\n\n");
  }

  if (type === "sentences") {
    for (let i = 0; i < count; i++) {
      const sentence = generateSentence(6, 15);
      if (i === 0 && startWithLorem) {
        results.push(CLASSIC_FIRST);
      } else {
        results.push(sentence);
      }
    }
    return results.join(" ");
  }

  if (type === "words") {
    if (startWithLorem && count >= 5) {
      results.push("lorem", "ipsum", "dolor", "sit", "amet");
      for (let i = 5; i < count; i++) {
        results.push(randWord());
      }
    } else {
      for (let i = 0; i < count; i++) {
        results.push(randWord());
      }
    }
    return results.join(" ");
  }

  // list-items
  for (let i = 0; i < count; i++) {
    const sentence = generateSentence(4, 10);
    if (i === 0 && startWithLorem) {
      results.push(CLASSIC_FIRST);
    } else {
      results.push(sentence);
    }
  }
  return results.map((item, i) => `${i + 1}. ${item}`).join("\n");
};

export default function LoremIpsumGenerator() {
  const [outputType, setOutputType] = useState<OutputType>("paragraphs");
  const [count, setCount] = useState(3);
  const [startWithLorem, setStartWithLorem] = useState(true);
  const [output, setOutput] = useState("");
  const [copied, setCopied] = useState(false);
  const [htmlCopied, setHtmlCopied] = useState(false);

  const handleGenerate = useCallback(() => {
    const text = generateText(outputType, count, startWithLorem);
    setOutput(text);
    setCopied(false);
    setHtmlCopied(false);
  }, [outputType, count, startWithLorem]);

  const handleCopy = useCallback(async () => {
    if (!output) return;
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* ignore */ }
  }, [output]);

  const handleCopyHTML = useCallback(async () => {
    if (!output) return;
    let html = "";
    if (outputType === "paragraphs") {
      html = output.split("\n\n").map((p) => `<p>${p}</p>`).join("\n");
    } else if (outputType === "list-items") {
      const items = output.split("\n").map((line) => {
        const text = line.replace(/^\d+\.\s*/, "");
        return `  <li>${text}</li>`;
      });
      html = `<ol>\n${items.join("\n")}\n</ol>`;
    } else {
      html = `<p>${output}</p>`;
    }
    try {
      await navigator.clipboard.writeText(html);
      setHtmlCopied(true);
      setTimeout(() => setHtmlCopied(false), 2000);
    } catch { /* ignore */ }
  }, [output, outputType]);

  const wordCount = output ? output.split(/\s+/).filter((w) => w.length > 0).length : 0;
  const charCount = output.length;

  const typeOptions: { value: OutputType; label: string; maxCount: number }[] = [
    { value: "paragraphs", label: "Paragraphs", maxCount: 50 },
    { value: "sentences", label: "Sentences", maxCount: 100 },
    { value: "words", label: "Words", maxCount: 1000 },
    { value: "list-items", label: "List Items", maxCount: 100 },
  ];

  const currentMax = typeOptions.find((t) => t.value === outputType)?.maxCount ?? 50;

  const presets = [
    { label: "1 Paragraph", type: "paragraphs" as OutputType, count: 1 },
    { label: "3 Paragraphs", type: "paragraphs" as OutputType, count: 3 },
    { label: "5 Paragraphs", type: "paragraphs" as OutputType, count: 5 },
    { label: "10 Sentences", type: "sentences" as OutputType, count: 10 },
    { label: "50 Words", type: "words" as OutputType, count: 50 },
    { label: "100 Words", type: "words" as OutputType, count: 100 },
  ];

  return (
    <main className="min-h-screen bg-slate-900 text-white">
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-8">
          <a href="/" className="text-blue-400 hover:text-blue-300 text-sm mb-4 inline-block">
            ← Back to all tools
          </a>
          <h1 className="text-3xl font-bold mb-2">Lorem Ipsum Generator</h1>
          <p className="text-slate-400">
            Generate placeholder text for designs, mockups, and layouts. Classic Lorem Ipsum or random Latin-style filler.
          </p>
        </div>

        {/* Controls */}
        <div className="bg-slate-800 rounded-lg p-6 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            {/* Output Type */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Generate
              </label>
              <select
                value={outputType}
                onChange={(e) => {
                  const newType = e.target.value as OutputType;
                  setOutputType(newType);
                  const max = typeOptions.find((t) => t.value === newType)?.maxCount ?? 50;
                  if (count > max) setCount(max);
                }}
                className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {typeOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Count */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Count ({outputType})
              </label>
              <input
                type="number"
                min={1}
                max={currentMax}
                value={count}
                onChange={(e) => {
                  const val = Math.max(1, Math.min(currentMax, parseInt(e.target.value) || 1));
                  setCount(val);
                }}
                className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Start with Lorem */}
          <div className="flex items-center gap-2 mb-4">
            <input
              type="checkbox"
              id="startWithLorem"
              checked={startWithLorem}
              onChange={(e) => setStartWithLorem(e.target.checked)}
              className="w-4 h-4 rounded bg-slate-700 border-slate-600 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="startWithLorem" className="text-sm text-slate-300">
              Start with &quot;Lorem ipsum dolor sit amet...&quot;
            </label>
          </div>

          {/* Presets */}
          <div className="flex flex-wrap gap-2 mb-4">
            {presets.map((preset) => (
              <button
                key={preset.label}
                onClick={() => {
                  setOutputType(preset.type);
                  setCount(preset.count);
                }}
                className="px-3 py-1 text-xs bg-slate-700 hover:bg-slate-600 rounded border border-slate-600 text-slate-300 transition-colors"
              >
                {preset.label}
              </button>
            ))}
          </div>

          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded transition-colors"
          >
            Generate Lorem Ipsum
          </button>
        </div>

        {/* Output */}
        {output && (
          <div className="bg-slate-800 rounded-lg p-6 mb-6">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm text-slate-400">
                {wordCount} words · {charCount} characters
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleCopyHTML}
                  className="px-3 py-1 text-xs bg-slate-700 hover:bg-slate-600 rounded text-slate-300 transition-colors"
                >
                  {htmlCopied ? "Copied HTML!" : "Copy as HTML"}
                </button>
                <button
                  onClick={handleCopy}
                  className="px-3 py-1 text-xs bg-blue-600 hover:bg-blue-700 rounded text-white transition-colors"
                >
                  {copied ? "Copied!" : "Copy Text"}
                </button>
              </div>
            </div>
            <div className="bg-slate-900 rounded p-4 whitespace-pre-wrap text-slate-200 text-sm leading-relaxed max-h-96 overflow-y-auto font-serif">
              {output}
            </div>
          </div>
        )}

        {/* About Section */}
        <div className="bg-slate-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">What is Lorem Ipsum?</h2>
          <div className="space-y-3 text-sm text-slate-300 leading-relaxed">
            <p>
              <strong className="text-white">Lorem Ipsum</strong> is placeholder text used in the printing and typesetting industry since the 1500s. It originates from a scrambled excerpt of Cicero&apos;s &quot;De Finibus Bonorum et Malorum&quot; (45 BC), a treatise on the theory of ethics.
            </p>
            <p>
              Designers and developers use Lorem Ipsum to fill layouts with realistic-looking text before final copy is written. It helps stakeholders focus on design and layout rather than reading content.
            </p>
            <p>
              This generator produces text using the standard Lorem Ipsum vocabulary — a mix of classical Latin words that creates natural-looking paragraph structures with varied word lengths.
            </p>
          </div>
        </div>

        {/* Use Cases */}
        <div className="bg-slate-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Common Use Cases</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { title: "Web Design Mockups", desc: "Fill page layouts, cards, and sections with realistic text" },
              { title: "Graphic Design", desc: "Placeholder text for brochures, posters, and print layouts" },
              { title: "Prototyping", desc: "Populate wireframes and interactive prototypes" },
              { title: "Typography Testing", desc: "Test font choices, sizes, and line spacing" },
              { title: "Email Templates", desc: "Fill email layouts to preview formatting" },
              { title: "Presentation Slides", desc: "Placeholder content for slide deck design" },
            ].map((item) => (
              <div key={item.title} className="bg-slate-700/50 rounded p-3">
                <div className="font-medium text-white text-sm">{item.title}</div>
                <div className="text-xs text-slate-400 mt-1">{item.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div className="bg-slate-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {[
              {
                q: "Why use Lorem Ipsum instead of real text?",
                a: "Lorem Ipsum provides a natural distribution of letters and word lengths, making layouts look realistic without distracting readers with meaningful content. It helps focus attention on visual design rather than copy."
              },
              {
                q: "Is this generator free to use?",
                a: "Yes, completely free with no limits. Generate as much placeholder text as you need — all processing happens in your browser."
              },
              {
                q: "What does 'Copy as HTML' do?",
                a: "It wraps your generated text in HTML tags — paragraphs become <p> tags and list items become <ol><li> elements — ready to paste into HTML templates or CMS editors."
              },
              {
                q: "How many paragraphs should I use?",
                a: "For a typical web page mockup, 3-5 paragraphs works well. Use 1 paragraph for card components, 5-10 for long-form content layouts like blog posts."
              },
              {
                q: "Is the generated text real Latin?",
                a: "It's based on Latin vocabulary from Cicero's writings, but the sentences are randomly assembled. While individual words are real Latin, the sentences don't form coherent meaning."
              },
            ].map((item) => (
              <div key={item.q}>
                <h3 className="font-medium text-white text-sm">{item.q}</h3>
                <p className="text-slate-400 text-sm mt-1">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
