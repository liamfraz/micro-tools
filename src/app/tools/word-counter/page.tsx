"use client";

import { useState, useMemo } from "react";

export default function WordCounterPage() {
  const [text, setText] = useState("");

  const stats = useMemo(() => {
    const trimmed = text.trim();

    const words = trimmed ? trimmed.split(/\s+/).length : 0;
    const characters = text.length;
    const charactersNoSpaces = text.replace(/\s/g, "").length;
    const sentences = trimmed
      ? (trimmed.match(/[.!?]+(?=\s|$)/g) || []).length || (trimmed.length > 0 ? 1 : 0)
      : 0;
    const paragraphs = trimmed
      ? trimmed.split(/\n\s*\n/).filter((p) => p.trim().length > 0).length
      : 0;

    // Average reading speed: 225 words per minute
    const readingTimeMinutes = words / 225;
    let readingTime: string;
    if (readingTimeMinutes < 1) {
      readingTime = "< 1 min";
    } else {
      readingTime = `${Math.ceil(readingTimeMinutes)} min`;
    }

    return { words, characters, charactersNoSpaces, sentences, paragraphs, readingTime };
  }, [text]);

  const topWords = useMemo(() => {
    const trimmed = text.trim();
    if (!trimmed) return [];

    const wordList = trimmed
      .toLowerCase()
      .replace(/[^\w\s'-]/g, "")
      .split(/\s+/)
      .filter((w) => w.length > 0);

    const freq = new Map<string, number>();
    for (const word of wordList) {
      freq.set(word, (freq.get(word) || 0) + 1);
    }

    return Array.from(freq.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
  }, [text]);

  const keywordDensity = useMemo(() => {
    if (!topWords.length || stats.words === 0) return [];
    return topWords.map(([word, count]) => ({
      word,
      count,
      density: ((count / stats.words) * 100).toFixed(1),
    }));
  }, [topWords, stats.words]);

  return (
    <>
      <title>Word & Character Counter - Free Online Tool | DevTools Hub</title>
      <meta
        name="description"
        content="Count words, characters, sentences, and paragraphs instantly. See reading time, top keywords, and keyword density analysis. Free online word counter tool."
      />

      <div className="min-h-screen bg-slate-900 text-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Breadcrumb */}
          <nav className="text-sm text-slate-400 mb-6" aria-label="Breadcrumb">
            <ol className="flex items-center gap-2">
              <li>
                <a href="/" className="hover:text-white transition-colors">
                  Home
                </a>
              </li>
              <li>
                <span className="mx-1">/</span>
              </li>
              <li>
                <a
                  href="/tools"
                  className="hover:text-white transition-colors"
                >
                  Text Tools
                </a>
              </li>
              <li>
                <span className="mx-1">/</span>
              </li>
              <li className="text-slate-200">Word Counter</li>
            </ol>
          </nav>

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
              Word & Character Counter
            </h1>
            <p className="text-slate-400 max-w-2xl text-lg">
              Paste or type your text below to get instant statistics including
              word count, character count, sentence count, reading time, and
              keyword density analysis.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Textarea */}
            <div className="lg:col-span-2">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Start typing or paste your text here..."
                className="w-full h-96 bg-slate-800 border border-slate-600 rounded-lg p-4 text-sm text-slate-200 placeholder-slate-500 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                spellCheck={false}
              />
            </div>

            {/* Stats sidebar */}
            <div className="space-y-6">
              {/* Quick stats */}
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-5">
                <h2 className="text-lg font-semibold text-white mb-4">
                  Statistics
                </h2>
                <div className="grid grid-cols-2 gap-4">
                  <StatCard label="Words" value={stats.words} />
                  <StatCard label="Characters" value={stats.characters} />
                  <StatCard
                    label="Chars (no spaces)"
                    value={stats.charactersNoSpaces}
                  />
                  <StatCard label="Sentences" value={stats.sentences} />
                  <StatCard label="Paragraphs" value={stats.paragraphs} />
                  <StatCard label="Reading Time" value={stats.readingTime} />
                </div>
              </div>

              {/* Top words */}
              {keywordDensity.length > 0 && (
                <div className="bg-slate-800 border border-slate-700 rounded-lg p-5">
                  <h2 className="text-lg font-semibold text-white mb-4">
                    Top Keywords
                  </h2>
                  <div className="space-y-2">
                    {keywordDensity.map(({ word, count, density }) => (
                      <div
                        key={word}
                        className="flex items-center justify-between text-sm"
                      >
                        <span className="text-slate-300 font-mono truncate max-w-[120px]">
                          {word}
                        </span>
                        <div className="flex items-center gap-3">
                          <span className="text-slate-500">{count}x</span>
                          <span className="text-blue-400 w-14 text-right">
                            {density}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
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
                  How are words counted?
                </h3>
                <p className="text-slate-400">
                  Words are counted by splitting the text on whitespace
                  characters (spaces, tabs, newlines). Hyphenated words like
                  &ldquo;well-known&rdquo; are counted as a single word. Empty
                  lines and extra spaces between words do not affect the count.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  How is reading time calculated?
                </h3>
                <p className="text-slate-400">
                  Reading time is estimated using an average reading speed of 225
                  words per minute, which is a widely accepted average for adult
                  readers. The actual time may vary depending on text complexity
                  and the reader&apos;s familiarity with the subject.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  What is keyword density?
                </h3>
                <p className="text-slate-400">
                  Keyword density is the percentage of times a specific word
                  appears relative to the total word count. It is commonly used
                  in SEO to ensure content does not over-use or under-use target
                  keywords. A density of 1-3% per keyword is generally
                  recommended.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Is there a character limit?
                </h3>
                <p className="text-slate-400">
                  No. This tool processes text entirely in your browser, so there
                  is no server-imposed limit. However, extremely large documents
                  (over 1 million characters) may cause some lag in the real-time
                  analysis.
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}

function StatCard({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="text-center">
      <div className="text-2xl font-bold text-white">{value}</div>
      <div className="text-xs text-slate-400 mt-1">{label}</div>
    </div>
  );
}
