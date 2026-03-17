"use client";

import { useState, useCallback } from "react";
import JsonLd from "@/components/JsonLd";
import RelatedTools from "@/components/RelatedTools";
import {
  generateFAQSchema,
  generateWebAppSchema,
  generateBreadcrumbSchema,
} from "@/lib/jsonld";

type CaseType =
  | "upper"
  | "lower"
  | "title"
  | "sentence"
  | "camel"
  | "pascal"
  | "snake"
  | "kebab"
  | "constant"
  | "dot"
  | "path"
  | "alternating"
  | "inverse";

function toWords(text: string): string[] {
  // Split on camelCase, PascalCase, snake_case, kebab-case, spaces, dots, slashes
  return text
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
    .replace(/[_\-./\\]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .filter((w) => w.length > 0);
}

function convertCase(text: string, caseType: CaseType): string {
  switch (caseType) {
    case "upper":
      return text.toUpperCase();
    case "lower":
      return text.toLowerCase();
    case "title":
      return text.replace(/\b\w/g, (ch) => ch.toUpperCase());
    case "sentence": {
      const sentences = text.split(/([.!?]\s*)/);
      return sentences
        .map((segment, i) => {
          if (i % 2 === 0 && segment.length > 0) {
            return segment.charAt(0).toUpperCase() + segment.slice(1).toLowerCase();
          }
          return segment;
        })
        .join("");
    }
    case "camel": {
      const words = toWords(text);
      return words
        .map((w, i) =>
          i === 0
            ? w.toLowerCase()
            : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()
        )
        .join("");
    }
    case "pascal": {
      const words = toWords(text);
      return words
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join("");
    }
    case "snake": {
      const words = toWords(text);
      return words.map((w) => w.toLowerCase()).join("_");
    }
    case "kebab": {
      const words = toWords(text);
      return words.map((w) => w.toLowerCase()).join("-");
    }
    case "constant": {
      const words = toWords(text);
      return words.map((w) => w.toUpperCase()).join("_");
    }
    case "dot": {
      const words = toWords(text);
      return words.map((w) => w.toLowerCase()).join(".");
    }
    case "path": {
      const words = toWords(text);
      return words.map((w) => w.toLowerCase()).join("/");
    }
    case "alternating": {
      let upper = false;
      return text
        .split("")
        .map((ch) => {
          if (/[a-zA-Z]/.test(ch)) {
            upper = !upper;
            return upper ? ch.toUpperCase() : ch.toLowerCase();
          }
          return ch;
        })
        .join("");
    }
    case "inverse":
      return text
        .split("")
        .map((ch) => {
          if (ch === ch.toUpperCase()) return ch.toLowerCase();
          return ch.toUpperCase();
        })
        .join("");
    default:
      return text;
  }
}

const CASES: { type: CaseType; label: string; example: string }[] = [
  { type: "upper", label: "UPPERCASE", example: "HELLO WORLD" },
  { type: "lower", label: "lowercase", example: "hello world" },
  { type: "title", label: "Title Case", example: "Hello World" },
  { type: "sentence", label: "Sentence case", example: "Hello world" },
  { type: "camel", label: "camelCase", example: "helloWorld" },
  { type: "pascal", label: "PascalCase", example: "HelloWorld" },
  { type: "snake", label: "snake_case", example: "hello_world" },
  { type: "kebab", label: "kebab-case", example: "hello-world" },
  { type: "constant", label: "CONSTANT_CASE", example: "HELLO_WORLD" },
  { type: "dot", label: "dot.case", example: "hello.world" },
  { type: "path", label: "path/case", example: "hello/world" },
  { type: "alternating", label: "aLtErNaTiNg", example: "hElLo WoRlD" },
  { type: "inverse", label: "InVeRsE", example: "hELLO wORLD" },
];

export default function TextCaseConverterPage() {
  const [input, setInput] = useState("");
  const [selectedCase, setSelectedCase] = useState<CaseType>("upper");
  const [copied, setCopied] = useState<string | null>(null);

  const output = input ? convertCase(input, selectedCase) : "";

  const copyText = useCallback(async (text: string, label: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  }, []);

  const wordCount = input.trim() ? input.trim().split(/\s+/).length : 0;
  const charCount = input.length;

  return (
    <>
      <title>Text Case Converter - Free Online Tool | DevTools Hub</title>
      <meta
        name="description"
        content="Convert text between UPPERCASE, lowercase, Title Case, camelCase, snake_case, kebab-case, and more. 13 case formats available. Free, instant, runs in your browser."
      />
      <JsonLd
        data={[
          generateWebAppSchema({
            slug: "text-case-converter",
            name: "Text Case Converter",
            description: "Convert text between uppercase, lowercase, title case, sentence case, and more",
            category: "text",
          }),
          generateBreadcrumbSchema({
            slug: "text-case-converter",
            name: "Text Case Converter",
            description: "Convert text between uppercase, lowercase, title case, sentence case, and more",
            category: "text",
          }),
          generateFAQSchema([
            { question: "What is camelCase vs PascalCase?", answer: "In camelCase, the first word starts with a lowercase letter and each subsequent word starts with an uppercase letter (e.g., \"myVariableName\"). PascalCase is the same pattern but the first word also starts uppercase (e.g., \"MyComponentName\"). camelCase is the standard in JavaScript for variables and functions, while PascalCase is used for classes and React components." },
            { question: "What is the difference between snake_case and kebab-case?", answer: "snake_case uses underscores between words (e.g., \"my_variable_name\") and is standard in Python, Ruby, and SQL. kebab-case uses hyphens (e.g., \"my-css-class\") and is standard in CSS class names, URLs, and HTML data attributes. Both are lowercase." },
            { question: "Can I convert between programming naming conventions?", answer: "Yes. This tool intelligently splits input text on camelCase boundaries, underscores, hyphens, dots, slashes, and spaces. This means you can paste \"myVariableName\" and convert it directly to \"my_variable_name\" or \"my-variable-name\" without manually reformatting." },
            { question: "Is my text data safe?", answer: "Yes. All text conversion happens entirely in your browser using JavaScript string operations. No text is sent to any server. You can safely convert confidential text, code, and other sensitive content." },
          ]),
        ]}
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
                <a href="/tools" className="hover:text-white transition-colors">Text Tools</a>
              </li>
              <li><span className="mx-1">/</span></li>
              <li className="text-slate-200">Text Case Converter</li>
            </ol>
          </nav>

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
              Text Case Converter
            </h1>
            <p className="text-slate-400 max-w-2xl text-lg">
              Convert text between 13 different case formats including
              UPPERCASE, lowercase, Title Case, camelCase, snake_case,
              kebab-case, and more. Everything runs in your browser.
            </p>
          </div>

          {/* Input */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-slate-300">
                Input Text
              </label>
              <span className="text-xs text-slate-500">
                {wordCount} words | {charCount} characters
              </span>
            </div>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type or paste your text here..."
              className="w-full h-40 bg-slate-800 border border-slate-600 rounded-lg p-4 text-sm text-slate-200 placeholder-slate-500 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              spellCheck={false}
            />
          </div>

          {/* Case Selector Grid */}
          <div className="mb-6">
            <label className="text-sm font-medium text-slate-300 mb-3 block">
              Select Case
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
              {CASES.map((c) => (
                <button
                  key={c.type}
                  onClick={() => setSelectedCase(c.type)}
                  className={`px-3 py-3 rounded-lg text-left transition-colors border ${
                    selectedCase === c.type
                      ? "bg-blue-600 border-blue-500 text-white"
                      : "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"
                  }`}
                >
                  <span className="block text-sm font-medium">{c.label}</span>
                  <span className={`block text-xs mt-0.5 ${
                    selectedCase === c.type ? "text-blue-200" : "text-slate-500"
                  }`}>
                    {c.example}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Output */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-slate-300">
                Output — {CASES.find((c) => c.type === selectedCase)?.label}
              </label>
            </div>
            <div className="bg-slate-800 border border-slate-600 rounded-lg p-4 min-h-[10rem]">
              <pre className="text-sm text-green-400 whitespace-pre-wrap break-words font-mono select-all">
                {output || "Converted text will appear here..."}
              </pre>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <button
              onClick={() => copyText(output, "output")}
              disabled={!output}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {copied === "output" ? "Copied!" : "Copy Output"}
            </button>
            <button
              onClick={() => { setInput(""); }}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors"
            >
              Clear
            </button>
            <button
              onClick={() =>
                setInput(
                  "the quick brown fox jumps over the lazy dog. how vexingly quick daft zebras jump!"
                )
              }
              className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
            >
              Load example
            </button>
          </div>

          {/* All Conversions At Once */}
          {input && (
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-5 mb-6">
              <h2 className="text-sm font-semibold text-white mb-3">
                All Conversions
              </h2>
              <div className="space-y-2">
                {CASES.map((c) => {
                  const converted = convertCase(input, c.type);
                  return (
                    <div
                      key={c.type}
                      className="flex items-start gap-3 bg-slate-900 rounded px-3 py-2"
                    >
                      <span className="text-xs text-slate-500 w-28 shrink-0 pt-0.5">
                        {c.label}
                      </span>
                      <code className="text-xs font-mono text-slate-300 flex-1 break-all select-all">
                        {converted.length > 200
                          ? converted.substring(0, 200) + "..."
                          : converted}
                      </code>
                      <button
                        onClick={() => copyText(converted, c.type)}
                        className="text-xs text-slate-400 hover:text-white transition-colors shrink-0"
                      >
                        {copied === c.type ? "Copied!" : "Copy"}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Use Case Reference */}
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 mb-6">
            <h2 className="text-lg font-semibold text-white mb-4">
              When to Use Each Case
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
              {[
                { name: "camelCase", use: "JavaScript/TypeScript variables, function names" },
                { name: "PascalCase", use: "React components, class names, TypeScript types" },
                { name: "snake_case", use: "Python variables, Ruby, database columns" },
                { name: "kebab-case", use: "CSS classes, URL slugs, HTML attributes" },
                { name: "CONSTANT_CASE", use: "Environment variables, constants, config keys" },
                { name: "Title Case", use: "Headings, titles, button labels" },
              ].map((item) => (
                <div key={item.name}>
                  <h3 className="text-sm font-medium text-white mb-1 font-mono">
                    {item.name}
                  </h3>
                  <p className="text-xs text-slate-400">{item.use}</p>
                </div>
              ))}
            </div>
          </div>

          <RelatedTools currentSlug="text-case-converter" />

          {/* FAQ Section */}
          <section className="mt-16 border-t border-slate-700 pt-10">
            <h2 className="text-2xl font-bold text-white mb-6">
              Frequently Asked Questions
            </h2>

            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  What is camelCase vs PascalCase?
                </h3>
                <p className="text-slate-400">
                  In camelCase, the first word starts with a lowercase letter and
                  each subsequent word starts with an uppercase letter (e.g.,
                  &ldquo;myVariableName&rdquo;). PascalCase is the same pattern
                  but the first word also starts uppercase (e.g.,
                  &ldquo;MyComponentName&rdquo;). camelCase is the standard in
                  JavaScript for variables and functions, while PascalCase is used
                  for classes and React components.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  What is the difference between snake_case and kebab-case?
                </h3>
                <p className="text-slate-400">
                  snake_case uses underscores between words (e.g.,
                  &ldquo;my_variable_name&rdquo;) and is standard in Python,
                  Ruby, and SQL. kebab-case uses hyphens (e.g.,
                  &ldquo;my-css-class&rdquo;) and is standard in CSS class
                  names, URLs, and HTML data attributes. Both are lowercase.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Can I convert between programming naming conventions?
                </h3>
                <p className="text-slate-400">
                  Yes. This tool intelligently splits input text on camelCase
                  boundaries, underscores, hyphens, dots, slashes, and spaces.
                  This means you can paste &ldquo;myVariableName&rdquo; and
                  convert it directly to &ldquo;my_variable_name&rdquo; or
                  &ldquo;my-variable-name&rdquo; without manually reformatting.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Is my text data safe?
                </h3>
                <p className="text-slate-400">
                  Yes. All text conversion happens entirely in your browser
                  using JavaScript string operations. No text is sent to any
                  server. You can safely convert confidential text, code, and
                  other sensitive content.
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
