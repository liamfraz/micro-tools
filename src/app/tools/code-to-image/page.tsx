"use client";

import { useState, useCallback, useRef } from "react";
import JsonLd from "@/components/JsonLd";
import RelatedTools from "@/components/RelatedTools";
import {
  generateFAQSchema,
  generateWebAppSchema,
  generateBreadcrumbSchema,
} from "@/lib/jsonld";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type Language =
  | "auto"
  | "javascript"
  | "typescript"
  | "python"
  | "html"
  | "css"
  | "go"
  | "rust"
  | "java"
  | "generic";

type ThemeName = "dark" | "light" | "monokai" | "dracula" | "github";

interface Token {
  text: string;
  type:
    | "keyword"
    | "string"
    | "number"
    | "comment"
    | "function"
    | "operator"
    | "punctuation"
    | "tag"
    | "attribute"
    | "type"
    | "decorator"
    | "plain";
}

interface ThemeColors {
  bg: string;
  text: string;
  keyword: string;
  string: string;
  number: string;
  comment: string;
  function: string;
  operator: string;
  punctuation: string;
  tag: string;
  attribute: string;
  type: string;
  decorator: string;
}

/* ------------------------------------------------------------------ */
/*  Themes                                                             */
/* ------------------------------------------------------------------ */

const THEMES: Record<ThemeName, ThemeColors> = {
  dark: {
    bg: "#1e1e1e",
    text: "#d4d4d4",
    keyword: "#569cd6",
    string: "#ce9178",
    number: "#b5cea8",
    comment: "#6a9955",
    function: "#dcdcaa",
    operator: "#d4d4d4",
    punctuation: "#d4d4d4",
    tag: "#569cd6",
    attribute: "#9cdcfe",
    type: "#4ec9b0",
    decorator: "#dcdcaa",
  },
  light: {
    bg: "#ffffff",
    text: "#383a42",
    keyword: "#a626a4",
    string: "#50a14f",
    number: "#986801",
    comment: "#a0a1a6",
    function: "#4078f2",
    operator: "#383a42",
    punctuation: "#383a42",
    tag: "#e45649",
    attribute: "#986801",
    type: "#c18401",
    decorator: "#4078f2",
  },
  monokai: {
    bg: "#272822",
    text: "#f8f8f2",
    keyword: "#f92672",
    string: "#e6db74",
    number: "#ae81ff",
    comment: "#75715e",
    function: "#a6e22e",
    operator: "#f92672",
    punctuation: "#f8f8f2",
    tag: "#f92672",
    attribute: "#a6e22e",
    type: "#66d9ef",
    decorator: "#a6e22e",
  },
  dracula: {
    bg: "#282a36",
    text: "#f8f8f2",
    keyword: "#ff79c6",
    string: "#f1fa8c",
    number: "#bd93f9",
    comment: "#6272a4",
    function: "#50fa7b",
    operator: "#ff79c6",
    punctuation: "#f8f8f2",
    tag: "#ff79c6",
    attribute: "#50fa7b",
    type: "#8be9fd",
    decorator: "#50fa7b",
  },
  github: {
    bg: "#24292e",
    text: "#e1e4e8",
    keyword: "#f97583",
    string: "#9ecbff",
    number: "#79b8ff",
    comment: "#6a737d",
    function: "#b392f0",
    operator: "#f97583",
    punctuation: "#e1e4e8",
    tag: "#85e89d",
    attribute: "#b392f0",
    type: "#79b8ff",
    decorator: "#b392f0",
  },
};

/* ------------------------------------------------------------------ */
/*  Language keywords                                                  */
/* ------------------------------------------------------------------ */

const KEYWORDS: Record<string, Set<string>> = {
  javascript: new Set([
    "async","await","break","case","catch","class","const","continue","debugger",
    "default","delete","do","else","export","extends","finally","for","from",
    "function","if","import","in","instanceof","let","new","of","return","static",
    "super","switch","this","throw","try","typeof","var","void","while","with","yield",
    "true","false","null","undefined",
  ]),
  typescript: new Set([
    "async","await","break","case","catch","class","const","continue","debugger",
    "default","delete","do","else","enum","export","extends","finally","for","from",
    "function","if","implements","import","in","instanceof","interface","let","new",
    "of","return","static","super","switch","this","throw","try","type","typeof",
    "var","void","while","with","yield","true","false","null","undefined",
    "abstract","as","declare","is","keyof","namespace","never","readonly",
  ]),
  python: new Set([
    "and","as","assert","async","await","break","class","continue","def","del",
    "elif","else","except","finally","for","from","global","if","import","in",
    "is","lambda","nonlocal","not","or","pass","raise","return","try","while",
    "with","yield","True","False","None",
  ]),
  go: new Set([
    "break","case","chan","const","continue","default","defer","else","fallthrough",
    "for","func","go","goto","if","import","interface","map","package","range",
    "return","select","struct","switch","type","var","true","false","nil",
  ]),
  rust: new Set([
    "as","async","await","break","const","continue","crate","dyn","else","enum",
    "extern","fn","for","if","impl","in","let","loop","match","mod","move","mut",
    "pub","ref","return","self","static","struct","super","trait","type","unsafe",
    "use","where","while","true","false",
  ]),
  java: new Set([
    "abstract","assert","boolean","break","byte","case","catch","char","class",
    "const","continue","default","do","double","else","enum","extends","final",
    "finally","float","for","goto","if","implements","import","instanceof","int",
    "interface","long","native","new","package","private","protected","public",
    "return","short","static","strictfp","super","switch","synchronized","this",
    "throw","throws","transient","try","void","volatile","while","true","false","null",
  ]),
};

/* ------------------------------------------------------------------ */
/*  Tokenizer                                                          */
/* ------------------------------------------------------------------ */

function detectLanguage(code: string): Language {
  if (/^\s*<(!DOCTYPE|html|div|span|section|head|body)/im.test(code)) return "html";
  if (/^\s*(@import|@media|@keyframes|\.[a-z][\w-]*\s*\{|#[a-z][\w-]*\s*\{)/im.test(code)) return "css";
  if (/\bdef\s+\w+|import\s+\w+|from\s+\w+\s+import|print\s*\(/m.test(code)) return "python";
  if (/\bfunc\s+\w+|package\s+\w+|fmt\.\w+/m.test(code)) return "go";
  if (/\bfn\s+\w+|let\s+mut\s|impl\s+\w+|pub\s+fn/m.test(code)) return "rust";
  if (/\bpublic\s+class\s|System\.out\./m.test(code)) return "java";
  if (/:\s*(string|number|boolean|any)\b|interface\s+\w+/m.test(code)) return "typescript";
  if (/\b(const|let|var|function|=>|require\s*\(|import\s+.*\s+from)\b/m.test(code)) return "javascript";
  return "generic";
}

function tokenizeLine(line: string, lang: Language): Token[] {
  if (lang === "html") return tokenizeHTML(line);
  if (lang === "css") return tokenizeCSS(line);
  return tokenizeGeneric(line, lang);
}

function tokenizeHTML(line: string): Token[] {
  const tokens: Token[] = [];
  const re = /(<\/?)([\w-]+)|(\s)([\w-]+)(=)("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')|("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')|(<!--[\s\S]*?-->)|(>|\/>)|([^<>"']+)/g;
  let m: RegExpExecArray | null;
  let last = 0;

  // simpler approach: split on tags
  const tagRe = /(<!--[\s\S]*?-->)|(<\/?[\w-]+)(\s[^>]*)?(\/?>)/g;
  let match: RegExpExecArray | null;

  while ((match = tagRe.exec(line)) !== null) {
    if (match.index > last) {
      tokens.push({ text: line.slice(last, match.index), type: "plain" });
    }

    if (match[1]) {
      tokens.push({ text: match[1], type: "comment" });
    } else {
      tokens.push({ text: match[2], type: "tag" });
      if (match[3]) {
        // parse attributes
        const attrStr = match[3];
        const attrRe = /([\w-]+)(=)("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')|(\s+)|([\w-]+)/g;
        let am: RegExpExecArray | null;
        while ((am = attrRe.exec(attrStr)) !== null) {
          if (am[1]) {
            tokens.push({ text: am[1], type: "attribute" });
            tokens.push({ text: am[2], type: "punctuation" });
            tokens.push({ text: am[3], type: "string" });
          } else if (am[4]) {
            tokens.push({ text: am[4], type: "plain" });
          } else if (am[5]) {
            tokens.push({ text: am[5], type: "attribute" });
          }
        }
      }
      if (match[4]) {
        tokens.push({ text: match[4], type: "punctuation" });
      }
    }
    last = match.index + match[0].length;
  }

  if (last < line.length) {
    tokens.push({ text: line.slice(last), type: "plain" });
  }

  return tokens.length > 0 ? tokens : [{ text: line, type: "plain" }];
}

function tokenizeCSS(line: string): Token[] {
  const tokens: Token[] = [];
  const re = /(\/\*[\s\S]*?\*\/|\/\/[^\n]*)|(#[\da-fA-F]{3,8}\b)|("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')|(\d+(?:\.\d+)?(?:px|em|rem|%|vh|vw|s|ms|deg|fr)?)|([.#]?[\w-]+(?:\s*,\s*[.#]?[\w-]+)*\s*(?=\{))|([\w-]+(?=\s*:))|([:;{}(),])|(\s+)|([^\s:;{}(),]+)/g;
  let m: RegExpExecArray | null;

  while ((m = re.exec(line)) !== null) {
    if (m[1]) tokens.push({ text: m[1], type: "comment" });
    else if (m[2]) tokens.push({ text: m[2], type: "number" });
    else if (m[3]) tokens.push({ text: m[3], type: "string" });
    else if (m[4]) tokens.push({ text: m[4], type: "number" });
    else if (m[5]) tokens.push({ text: m[5], type: "tag" });
    else if (m[6]) tokens.push({ text: m[6], type: "attribute" });
    else if (m[7]) tokens.push({ text: m[7], type: "punctuation" });
    else if (m[8]) tokens.push({ text: m[8], type: "plain" });
    else if (m[9]) tokens.push({ text: m[9], type: "plain" });
  }

  return tokens.length > 0 ? tokens : [{ text: line, type: "plain" }];
}

function tokenizeGeneric(line: string, lang: Language): Token[] {
  const tokens: Token[] = [];
  const kw = KEYWORDS[lang] ?? new Set();
  const isPython = lang === "python";

  // Regex for tokenizing code-like languages
  const re = /(\/\/[^\n]*|#[^\n]*|\/\*[\s\S]*?\*\/)|(@\w+)|(`(?:[^`\\]|\\.)*`)|("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')|(0x[\da-fA-F]+|0b[01]+|0o[0-7]+|\d+(?:\.\d+)?(?:e[+-]?\d+)?)|([a-zA-Z_$][\w$]*)(\s*\()?|([+\-*/%=<>!&|^~?:]+)|([{}()\[\];,.])|(\s+)/g;
  let m: RegExpExecArray | null;

  while ((m = re.exec(line)) !== null) {
    if (m[1]) {
      // Comment — but for non-Python langs, # is not a comment
      if (m[1].startsWith("#") && !isPython) {
        tokens.push({ text: m[1], type: "plain" });
      } else {
        tokens.push({ text: m[1], type: "comment" });
      }
    } else if (m[2]) {
      tokens.push({ text: m[2], type: "decorator" });
    } else if (m[3]) {
      tokens.push({ text: m[3], type: "string" });
    } else if (m[4]) {
      tokens.push({ text: m[4], type: "string" });
    } else if (m[5]) {
      tokens.push({ text: m[5], type: "number" });
    } else if (m[6]) {
      if (kw.has(m[6])) {
        tokens.push({ text: m[6], type: "keyword" });
      } else if (m[7]) {
        // followed by (
        tokens.push({ text: m[6], type: "function" });
      } else if (/^[A-Z]/.test(m[6])) {
        tokens.push({ text: m[6], type: "type" });
      } else {
        tokens.push({ text: m[6], type: "plain" });
      }
      if (m[7]) {
        tokens.push({ text: m[7].trimEnd(), type: "plain" });
        const ws = m[7].length - m[7].trimEnd().length;
        if (ws > 0) tokens.push({ text: " ".repeat(ws), type: "plain" });
      }
    } else if (m[8]) {
      tokens.push({ text: m[8], type: "operator" });
    } else if (m[9]) {
      tokens.push({ text: m[9], type: "punctuation" });
    } else if (m[10]) {
      tokens.push({ text: m[10], type: "plain" });
    }
  }

  return tokens.length > 0 ? tokens : [{ text: line, type: "plain" }];
}

/* ------------------------------------------------------------------ */
/*  Canvas export                                                      */
/* ------------------------------------------------------------------ */

function measureTokenWidth(
  ctx: CanvasRenderingContext2D,
  text: string
): number {
  return ctx.measureText(text).width;
}

function exportToPNG(
  code: string,
  lang: Language,
  theme: ThemeColors,
  padding: number,
  fontSize: number,
  bgColor: string,
  borderRadius: number,
  showChrome: boolean
) {
  const resolvedLang = lang === "auto" ? detectLanguage(code) : lang;
  const lines = code.split("\n");
  const tokenized = lines.map((l) => tokenizeLine(l, resolvedLang));

  const lineHeight = fontSize * 1.6;
  const chromeHeight = showChrome ? 36 : 0;

  // Create a temporary canvas to measure text
  const tmp = document.createElement("canvas");
  const tmpCtx = tmp.getContext("2d")!;
  tmpCtx.font = `${fontSize}px "Fira Code", "Cascadia Code", "JetBrains Mono", "Source Code Pro", Consolas, "Courier New", monospace`;

  let maxWidth = 0;
  for (const lineTokens of tokenized) {
    let w = 0;
    for (const tok of lineTokens) {
      w += measureTokenWidth(tmpCtx, tok.text);
    }
    maxWidth = Math.max(maxWidth, w);
  }

  const codeWidth = maxWidth + padding * 2;
  const codeHeight = lines.length * lineHeight + padding * 2 + chromeHeight;
  const canvasWidth = codeWidth + padding * 2;
  const canvasHeight = codeHeight + padding * 2;

  const canvas = document.createElement("canvas");
  const dpr = window.devicePixelRatio || 2;
  canvas.width = canvasWidth * dpr;
  canvas.height = canvasHeight * dpr;
  const ctx = canvas.getContext("2d")!;
  ctx.scale(dpr, dpr);

  // Outer background
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  // Code window background with border radius
  const wx = padding;
  const wy = padding;
  const ww = codeWidth;
  const wh = codeHeight;

  ctx.beginPath();
  ctx.moveTo(wx + borderRadius, wy);
  ctx.lineTo(wx + ww - borderRadius, wy);
  ctx.quadraticCurveTo(wx + ww, wy, wx + ww, wy + borderRadius);
  ctx.lineTo(wx + ww, wy + wh - borderRadius);
  ctx.quadraticCurveTo(wx + ww, wy + wh, wx + ww - borderRadius, wy + wh);
  ctx.lineTo(wx + borderRadius, wy + wh);
  ctx.quadraticCurveTo(wx, wy + wh, wx, wy + wh - borderRadius);
  ctx.lineTo(wx, wy + borderRadius);
  ctx.quadraticCurveTo(wx, wy, wx + borderRadius, wy);
  ctx.closePath();
  ctx.fillStyle = theme.bg;
  ctx.fill();

  // Window chrome dots
  if (showChrome) {
    const dotY = wy + 18;
    const dotR = 6;
    const dotColors = ["#ff5f57", "#febc2e", "#28c840"];
    dotColors.forEach((color, i) => {
      ctx.beginPath();
      ctx.arc(wx + 20 + i * 20, dotY, dotR, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
    });
  }

  // Draw code
  ctx.font = `${fontSize}px "Fira Code", "Cascadia Code", "JetBrains Mono", "Source Code Pro", Consolas, "Courier New", monospace`;
  ctx.textBaseline = "top";

  const startX = wx + padding;
  const startY = wy + padding + chromeHeight;

  for (let i = 0; i < tokenized.length; i++) {
    let x = startX;
    const y = startY + i * lineHeight;
    for (const tok of tokenized[i]) {
      const color = tok.type === "plain" ? theme.text : theme[tok.type as keyof ThemeColors] ?? theme.text;
      ctx.fillStyle = color;
      ctx.fillText(tok.text, x, y);
      x += measureTokenWidth(ctx, tok.text);
    }
  }

  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "code-snippet.png";
    a.click();
    URL.revokeObjectURL(url);
  }, "image/png");
}

/* ------------------------------------------------------------------ */
/*  FAQ data                                                           */
/* ------------------------------------------------------------------ */

const faqs = [
  {
    question: "How does the code to image converter work?",
    answer:
      "It uses a custom regex-based tokenizer to parse your code into keywords, strings, numbers, comments, and other token types. Each token is colored according to the selected theme. The live preview renders via HTML, and the PNG export draws everything onto an HTML Canvas for a pixel-perfect image.",
  },
  {
    question: "What programming languages are supported?",
    answer:
      "JavaScript, TypeScript, Python, HTML, CSS, Go, Rust, and Java have dedicated syntax highlighting. There is also an auto-detect mode and a generic fallback that highlights common patterns like strings, numbers, and comments.",
  },
  {
    question: "Is my code sent to a server?",
    answer:
      "No. Everything runs 100% in your browser. Your code never leaves your device — tokenization, rendering, and PNG export all happen client-side using native browser APIs.",
  },
  {
    question: "Can I customize the exported image?",
    answer:
      "Yes. You can choose from 5 themes, adjust padding, font size, border radius, and background color. You can also toggle macOS-style window chrome (the red/yellow/green dots).",
  },
  {
    question: "What image format is exported?",
    answer:
      "The tool exports PNG images at 2x resolution (using devicePixelRatio) for crisp output on high-DPI displays. The image is generated using the native Canvas API.",
  },
];

const SLUG = "code-to-image";
const TOOL_NAME = "Code to Image Converter";
const TOOL_DESC =
  "Convert code snippets to beautiful images with syntax highlighting, themes, and window chrome. Export as PNG — all in your browser";

const SAMPLE_CODE = `function fibonacci(n) {
  if (n <= 1) return n;
  let a = 0, b = 1;
  for (let i = 2; i <= n; i++) {
    [a, b] = [b, a + b];
  }
  return b;
}

// Calculate the 10th Fibonacci number
console.log(fibonacci(10)); // 55`;

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function CodeToImagePage() {
  const [code, setCode] = useState(SAMPLE_CODE);
  const [language, setLanguage] = useState<Language>("auto");
  const [themeName, setThemeName] = useState<ThemeName>("dark");
  const [padding, setPadding] = useState(32);
  const [fontSize, setFontSize] = useState(14);
  const [bgColor, setBgColor] = useState("#667eea");
  const [borderRadius, setBorderRadius] = useState(8);
  const [showChrome, setShowChrome] = useState(true);

  const previewRef = useRef<HTMLDivElement>(null);

  const theme = THEMES[themeName];
  const resolvedLang = language === "auto" ? detectLanguage(code) : language;

  const tokenizedLines = code.split("\n").map((line) => tokenizeLine(line, resolvedLang));

  const handleExport = useCallback(() => {
    exportToPNG(code, language, theme, padding, fontSize, bgColor, borderRadius, showChrome);
  }, [code, language, theme, padding, fontSize, bgColor, borderRadius, showChrome]);

  const tokenColor = (tok: Token): string => {
    if (tok.type === "plain") return theme.text;
    return theme[tok.type as keyof ThemeColors] ?? theme.text;
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <JsonLd
          data={[
            generateWebAppSchema({
              slug: SLUG,
              name: TOOL_NAME,
              description: TOOL_DESC,
              category: "developer",
            }),
            generateBreadcrumbSchema({
              slug: SLUG,
              name: TOOL_NAME,
              description: TOOL_DESC,
              category: "developer",
            }),
            generateFAQSchema(faqs),
          ]}
        />

        {/* Breadcrumb */}
        <nav className="text-sm text-slate-400 mb-6" aria-label="Breadcrumb">
          <ol className="flex items-center gap-2">
            <li>
              <a href="/" className="hover:text-slate-200 transition-colors">
                Home
              </a>
            </li>
            <li>
              <span className="mx-1">/</span>
            </li>
            <li>
              <a href="/tools" className="hover:text-slate-200 transition-colors">
                Developer Tools
              </a>
            </li>
            <li>
              <span className="mx-1">/</span>
            </li>
            <li className="text-slate-200">Code to Image Converter</li>
          </ol>
        </nav>

        {/* Header */}
        <h1 className="text-3xl font-bold text-white mb-2">
          Code to Image Converter
        </h1>
        <p className="text-slate-400 mb-8 max-w-2xl">
          Turn your code snippets into beautiful, shareable images with syntax
          highlighting. Choose from 5 editor themes, customize padding and
          styling, then export as a high-resolution PNG.
        </p>

        {/* Main layout: two columns on lg+ */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Left: code input + language selector */}
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <label htmlFor="language" className="text-sm font-medium text-slate-300">
                Language
              </label>
              <select
                id="language"
                value={language}
                onChange={(e) => setLanguage(e.target.value as Language)}
                className="bg-slate-800 border border-slate-600 rounded-lg px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="auto">Auto-detect</option>
                <option value="javascript">JavaScript</option>
                <option value="typescript">TypeScript</option>
                <option value="python">Python</option>
                <option value="html">HTML</option>
                <option value="css">CSS</option>
                <option value="go">Go</option>
                <option value="rust">Rust</option>
                <option value="java">Java</option>
                <option value="generic">Generic</option>
              </select>
              <span className="text-xs text-slate-500">
                Detected: {resolvedLang}
              </span>
            </div>
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full h-80 bg-slate-800 border border-slate-600 rounded-lg p-4 font-mono text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
              placeholder="Paste your code here..."
              spellCheck={false}
            />
          </div>

          {/* Right: preview */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-300">Preview</p>
            <div
              ref={previewRef}
              className="rounded-lg overflow-auto border border-slate-700"
              style={{
                backgroundColor: bgColor,
                padding: `${padding}px`,
              }}
            >
              <div
                style={{
                  backgroundColor: theme.bg,
                  borderRadius: `${borderRadius}px`,
                  padding: `${padding}px`,
                  paddingTop: showChrome ? `${padding + 36}px` : `${padding}px`,
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                {/* Window chrome */}
                {showChrome && (
                  <div
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      right: 0,
                      height: "36px",
                      display: "flex",
                      alignItems: "center",
                      paddingLeft: "14px",
                      gap: "8px",
                    }}
                  >
                    <span
                      style={{
                        width: 12,
                        height: 12,
                        borderRadius: "50%",
                        backgroundColor: "#ff5f57",
                        display: "inline-block",
                      }}
                    />
                    <span
                      style={{
                        width: 12,
                        height: 12,
                        borderRadius: "50%",
                        backgroundColor: "#febc2e",
                        display: "inline-block",
                      }}
                    />
                    <span
                      style={{
                        width: 12,
                        height: 12,
                        borderRadius: "50%",
                        backgroundColor: "#28c840",
                        display: "inline-block",
                      }}
                    />
                  </div>
                )}

                {/* Code lines */}
                <pre
                  style={{
                    fontFamily:
                      '"Fira Code", "Cascadia Code", "JetBrains Mono", "Source Code Pro", Consolas, "Courier New", monospace',
                    fontSize: `${fontSize}px`,
                    lineHeight: 1.6,
                    margin: 0,
                    whiteSpace: "pre",
                    overflowX: "auto",
                  }}
                >
                  {tokenizedLines.map((lineTokens, lineIdx) => (
                    <div key={lineIdx}>
                      {lineTokens.map((tok, tokIdx) => (
                        <span
                          key={tokIdx}
                          style={{ color: tokenColor(tok) }}
                        >
                          {tok.text}
                        </span>
                      ))}
                      {lineTokens.length === 0 && "\n"}
                    </div>
                  ))}
                </pre>
              </div>
            </div>
          </div>
        </div>

        {/* Controls bar */}
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 mb-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {/* Theme */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Theme
              </label>
              <div className="flex flex-wrap gap-1">
                {(Object.keys(THEMES) as ThemeName[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => setThemeName(t)}
                    className={`px-2 py-1 text-xs rounded capitalize ${
                      themeName === t
                        ? "bg-blue-600 text-white"
                        : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                    } transition-colors`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Padding */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Padding: {padding}px
              </label>
              <input
                type="range"
                min={16}
                max={64}
                value={padding}
                onChange={(e) => setPadding(Number(e.target.value))}
                className="w-full"
              />
            </div>

            {/* Font size */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Font Size: {fontSize}px
              </label>
              <input
                type="range"
                min={12}
                max={24}
                value={fontSize}
                onChange={(e) => setFontSize(Number(e.target.value))}
                className="w-full"
              />
            </div>

            {/* Background color */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Background
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={bgColor}
                  onChange={(e) => setBgColor(e.target.value)}
                  className="w-8 h-8 rounded border border-slate-600 cursor-pointer"
                />
                <input
                  type="text"
                  value={bgColor}
                  onChange={(e) => setBgColor(e.target.value)}
                  className="bg-slate-700 border border-slate-600 rounded px-2 py-1 text-xs text-slate-200 w-20"
                />
              </div>
            </div>

            {/* Border radius */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Radius: {borderRadius}px
              </label>
              <input
                type="range"
                min={0}
                max={24}
                value={borderRadius}
                onChange={(e) => setBorderRadius(Number(e.target.value))}
                className="w-full"
              />
            </div>

            {/* Window chrome */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Window Chrome
              </label>
              <button
                onClick={() => setShowChrome(!showChrome)}
                className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-colors ${
                  showChrome
                    ? "bg-blue-600 text-white"
                    : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                }`}
              >
                {showChrome ? "On" : "Off"}
              </button>
            </div>
          </div>
        </div>

        {/* Export button */}
        <div className="mb-10">
          <button
            onClick={handleExport}
            className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold text-lg transition-colors"
          >
            Export as PNG
          </button>
        </div>

        {/* Related tools */}
        <RelatedTools currentSlug={SLUG} />

        {/* FAQ section */}
        <section className="mt-12 max-w-3xl">
          <h2 className="text-2xl font-bold text-white mb-6">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            {faqs.map((faq, i) => (
              <details
                key={i}
                className="bg-slate-800 border border-slate-700 rounded-lg"
              >
                <summary className="px-4 py-3 cursor-pointer font-medium text-slate-200 hover:text-white transition-colors">
                  {faq.question}
                </summary>
                <p className="px-4 pb-4 text-slate-400">{faq.answer}</p>
              </details>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
