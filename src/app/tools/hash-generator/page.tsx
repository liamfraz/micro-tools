"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import JsonLd from "@/components/JsonLd";
import RelatedTools from "@/components/RelatedTools";
import ToolBreadcrumb from "@/components/ToolBreadcrumb";
import {
  generateFAQSchema,
  generateWebAppSchema,
  generateBreadcrumbSchema,
} from "@/lib/jsonld";

type HashAlgorithm = "MD5" | "SHA-1" | "SHA-224" | "SHA-256" | "SHA-384" | "SHA-512";
type Mode = "text" | "file" | "hmac" | "compare";

const ALL_ALGORITHMS: HashAlgorithm[] = ["MD5", "SHA-1", "SHA-224", "SHA-256", "SHA-384", "SHA-512"];

// MD5 implementation (Web Crypto API doesn't support MD5)
function md5(input: Uint8Array): string {
  const bytes = input;

  function toUint32(n: number) { return n >>> 0; }

  const K = [
    0xd76aa478, 0xe8c7b756, 0x242070db, 0xc1bdceee,
    0xf57c0faf, 0x4787c62a, 0xa8304613, 0xfd469501,
    0x698098d8, 0x8b44f7af, 0xffff5bb1, 0x895cd7be,
    0x6b901122, 0xfd987193, 0xa679438e, 0x49b40821,
    0xf61e2562, 0xc040b340, 0x265e5a51, 0xe9b6c7aa,
    0xd62f105d, 0x02441453, 0xd8a1e681, 0xe7d3fbc8,
    0x21e1cde6, 0xc33707d6, 0xf4d50d87, 0x455a14ed,
    0xa9e3e905, 0xfcefa3f8, 0x676f02d9, 0x8d2a4c8a,
    0xfffa3942, 0x8771f681, 0x6d9d6122, 0xfde5380c,
    0xa4beea44, 0x4bdecfa9, 0xf6bb4b60, 0xbebfbc70,
    0x289b7ec6, 0xeaa127fa, 0xd4ef3085, 0x04881d05,
    0xd9d4d039, 0xe6db99e5, 0x1fa27cf8, 0xc4ac5665,
    0xf4292244, 0x432aff97, 0xab9423a7, 0xfc93a039,
    0x655b59c3, 0x8f0ccc92, 0xffeff47d, 0x85845dd1,
    0x6fa87e4f, 0xfe2ce6e0, 0xa3014314, 0x4e0811a1,
    0xf7537e82, 0xbd3af235, 0x2ad7d2bb, 0xeb86d391,
  ];

  const S = [
    7, 12, 17, 22,  7, 12, 17, 22,  7, 12, 17, 22,  7, 12, 17, 22,
    5,  9, 14, 20,  5,  9, 14, 20,  5,  9, 14, 20,  5,  9, 14, 20,
    4, 11, 16, 23,  4, 11, 16, 23,  4, 11, 16, 23,  4, 11, 16, 23,
    6, 10, 15, 21,  6, 10, 15, 21,  6, 10, 15, 21,  6, 10, 15, 21,
  ];

  const bitLen = bytes.length * 8;
  const paddedLen = ((bytes.length + 8) >>> 6 << 6) + 64;
  const padded = new Uint8Array(paddedLen);
  padded.set(bytes);
  padded[bytes.length] = 0x80;

  const view = new DataView(padded.buffer);
  view.setUint32(paddedLen - 8, toUint32(bitLen), true);
  view.setUint32(paddedLen - 4, Math.floor(bitLen / 0x100000000), true);

  let a0 = 0x67452301;
  let b0 = 0xefcdab89;
  let c0 = 0x98badcfe;
  let d0 = 0x10325476;

  for (let offset = 0; offset < paddedLen; offset += 64) {
    const M = new Uint32Array(16);
    for (let j = 0; j < 16; j++) {
      M[j] = view.getUint32(offset + j * 4, true);
    }

    let A = a0, B = b0, C = c0, D = d0;

    for (let i = 0; i < 64; i++) {
      let F: number, g: number;
      if (i < 16) {
        F = (B & C) | (~B & D);
        g = i;
      } else if (i < 32) {
        F = (D & B) | (~D & C);
        g = (5 * i + 1) % 16;
      } else if (i < 48) {
        F = B ^ C ^ D;
        g = (3 * i + 5) % 16;
      } else {
        F = C ^ (B | ~D);
        g = (7 * i) % 16;
      }

      F = toUint32(F + A + K[i] + M[g]);
      A = D;
      D = C;
      C = B;
      B = toUint32(B + ((F << S[i]) | (F >>> (32 - S[i]))));
    }

    a0 = toUint32(a0 + A);
    b0 = toUint32(b0 + B);
    c0 = toUint32(c0 + C);
    d0 = toUint32(d0 + D);
  }

  const result = new Uint8Array(16);
  const rv = new DataView(result.buffer);
  rv.setUint32(0, a0, true);
  rv.setUint32(4, b0, true);
  rv.setUint32(8, c0, true);
  rv.setUint32(12, d0, true);

  return Array.from(result)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function toHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function computeAllHashes(data: Uint8Array): Promise<Record<HashAlgorithm, string>> {
  const buf = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) as ArrayBuffer;
  const md5Hash = md5(data);
  const [sha1, sha256, sha384, sha512, sha224Hash] = await Promise.all([
    crypto.subtle.digest("SHA-1", buf),
    crypto.subtle.digest("SHA-256", buf),
    crypto.subtle.digest("SHA-384", buf),
    crypto.subtle.digest("SHA-512", buf),
    computeSHA224(data),
  ]);

  return {
    "MD5": md5Hash,
    "SHA-1": toHex(sha1),
    "SHA-224": sha224Hash,
    "SHA-256": toHex(sha256),
    "SHA-384": toHex(sha384),
    "SHA-512": toHex(sha512),
  };
}

// SHA-224 implementation (Web Crypto API doesn't support it)
async function computeSHA224(data: Uint8Array): Promise<string> {
  // SHA-224 is SHA-256 with different initial hash values, truncated to 28 bytes
  // We implement it from scratch since Web Crypto doesn't support it

  function toUint32(n: number) { return n >>> 0; }
  function rightRotate(n: number, d: number) { return toUint32((n >>> d) | (n << (32 - d))); }

  const K = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
  ];

  // SHA-224 initial hash values (different from SHA-256)
  let h0 = 0xc1059ed8;
  let h1 = 0x367cd507;
  let h2 = 0x3070dd17;
  let h3 = 0xf70e5939;
  let h4 = 0xffc00b31;
  let h5 = 0x68581511;
  let h6 = 0x64f98fa7;
  let h7 = 0xbefa4fa4;

  // Pre-processing
  const bitLen = data.length * 8;
  const paddedLen = ((data.length + 8) >>> 6 << 6) + 64;
  const padded = new Uint8Array(paddedLen);
  padded.set(data);
  padded[data.length] = 0x80;

  const view = new DataView(padded.buffer);
  // Length in bits as 64-bit big-endian
  view.setUint32(paddedLen - 4, toUint32(bitLen), false);
  view.setUint32(paddedLen - 8, Math.floor(bitLen / 0x100000000), false);

  for (let offset = 0; offset < paddedLen; offset += 64) {
    const w = new Uint32Array(64);
    for (let i = 0; i < 16; i++) {
      w[i] = view.getUint32(offset + i * 4, false);
    }
    for (let i = 16; i < 64; i++) {
      const s0 = rightRotate(w[i - 15], 7) ^ rightRotate(w[i - 15], 18) ^ (w[i - 15] >>> 3);
      const s1 = rightRotate(w[i - 2], 17) ^ rightRotate(w[i - 2], 19) ^ (w[i - 2] >>> 10);
      w[i] = toUint32(w[i - 16] + s0 + w[i - 7] + s1);
    }

    let a = h0, b = h1, c = h2, d = h3, e = h4, f = h5, g = h6, h = h7;

    for (let i = 0; i < 64; i++) {
      const S1 = rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25);
      const ch = (e & f) ^ (~e & g);
      const temp1 = toUint32(h + S1 + ch + K[i] + w[i]);
      const S0 = rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const temp2 = toUint32(S0 + maj);

      h = g; g = f; f = e; e = toUint32(d + temp1);
      d = c; c = b; b = a; a = toUint32(temp1 + temp2);
    }

    h0 = toUint32(h0 + a); h1 = toUint32(h1 + b); h2 = toUint32(h2 + c); h3 = toUint32(h3 + d);
    h4 = toUint32(h4 + e); h5 = toUint32(h5 + f); h6 = toUint32(h6 + g); h7 = toUint32(h7 + h);
  }

  // SHA-224 truncates to first 7 words (28 bytes)
  const result = new Uint8Array(28);
  const rv = new DataView(result.buffer);
  rv.setUint32(0, h0, false);
  rv.setUint32(4, h1, false);
  rv.setUint32(8, h2, false);
  rv.setUint32(12, h3, false);
  rv.setUint32(16, h4, false);
  rv.setUint32(20, h5, false);
  rv.setUint32(24, h6, false);

  return Array.from(result).map(b => b.toString(16).padStart(2, "0")).join("");
}

async function computeHMAC(data: Uint8Array, secretKey: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secretKey);
  const keyBuf = keyData.buffer.slice(keyData.byteOffset, keyData.byteOffset + keyData.byteLength) as ArrayBuffer;
  const dataBuf = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) as ArrayBuffer;
  const key = await crypto.subtle.importKey(
    "raw",
    keyBuf,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, dataBuf);
  return toHex(signature);
}

const algorithms: { name: HashAlgorithm; bits: number; desc: string }[] = [
  { name: "MD5", bits: 128, desc: "Fast but cryptographically broken — use for checksums only" },
  { name: "SHA-1", bits: 160, desc: "Legacy — deprecated for security, still used in git" },
  { name: "SHA-224", bits: 224, desc: "Truncated SHA-256 — used in some certificate chains" },
  { name: "SHA-256", bits: 256, desc: "Recommended — widely used in TLS, Bitcoin, JWT" },
  { name: "SHA-384", bits: 384, desc: "Truncated SHA-512 — used in some TLS configurations" },
  { name: "SHA-512", bits: 512, desc: "Strongest SHA-2 variant — best for high-security apps" },
];

const emptyHashes: Record<HashAlgorithm, string> = {
  "MD5": "", "SHA-1": "", "SHA-224": "", "SHA-256": "", "SHA-384": "", "SHA-512": "",
};

export default function HashGeneratorPage() {
  const [mode, setMode] = useState<Mode>("text");
  const [input, setInput] = useState("");
  const [hashes, setHashes] = useState<Record<HashAlgorithm, string>>(emptyHashes);
  const [copied, setCopied] = useState<string | null>(null);
  const [uppercase, setUppercase] = useState(false);
  const [isComputing, setIsComputing] = useState(false);

  // File mode state
  const [fileName, setFileName] = useState("");
  const [fileSize, setFileSize] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // HMAC mode state
  const [hmacKey, setHmacKey] = useState("");
  const [hmacResult, setHmacResult] = useState("");

  // Compare mode state
  const [hash1, setHash1] = useState("");
  const [hash2, setHash2] = useState("");

  // Live hash as you type (text mode)
  useEffect(() => {
    if (mode !== "text") return;
    if (!input) {
      setHashes(emptyHashes);
      return;
    }
    let cancelled = false;
    const encoded = new TextEncoder().encode(input);
    computeAllHashes(encoded).then((result) => {
      if (!cancelled) setHashes(result);
    });
    return () => { cancelled = true; };
  }, [input, mode]);

  // Live HMAC computation
  useEffect(() => {
    if (mode !== "hmac") return;
    if (!input || !hmacKey) {
      setHmacResult("");
      return;
    }
    let cancelled = false;
    const encoded = new TextEncoder().encode(input);
    computeHMAC(encoded, hmacKey).then((result) => {
      if (!cancelled) setHmacResult(result);
    });
    return () => { cancelled = true; };
  }, [input, hmacKey, mode]);

  const handleFileHash = useCallback(async (file: File) => {
    setIsComputing(true);
    setFileName(file.name);
    setFileSize(file.size);
    setHashes(emptyHashes);

    const buffer = await file.arrayBuffer();
    const data = new Uint8Array(buffer);
    const result = await computeAllHashes(data);
    setHashes(result);
    setIsComputing(false);
  }, []);

  const handleFileDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileHash(file);
  }, [handleFileHash]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileHash(file);
  }, [handleFileHash]);

  const copyHash = useCallback(
    async (algo: string) => {
      const hash = hashes[algo as HashAlgorithm];
      if (!hash) return;
      const text = uppercase ? hash.toUpperCase() : hash;
      await navigator.clipboard.writeText(text);
      setCopied(algo);
      setTimeout(() => setCopied(null), 2000);
    },
    [hashes, uppercase]
  );

  const copyAll = useCallback(async () => {
    const lines = ALL_ALGORITHMS
      .filter((algo) => hashes[algo])
      .map((algo) => {
        const h = uppercase ? hashes[algo].toUpperCase() : hashes[algo];
        return `${algo}: ${h}`;
      })
      .join("\n");
    if (!lines) return;
    await navigator.clipboard.writeText(lines);
    setCopied("all");
    setTimeout(() => setCopied(null), 2000);
  }, [hashes, uppercase]);

  const copyHmac = useCallback(async () => {
    if (!hmacResult) return;
    const text = uppercase ? hmacResult.toUpperCase() : hmacResult;
    await navigator.clipboard.writeText(text);
    setCopied("hmac");
    setTimeout(() => setCopied(null), 2000);
  }, [hmacResult, uppercase]);

  const clearAll = useCallback(() => {
    setInput("");
    setHashes(emptyHashes);
    setFileName("");
    setFileSize(0);
    setHmacKey("");
    setHmacResult("");
    setHash1("");
    setHash2("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  const displayHash = (hash: string) => (uppercase ? hash.toUpperCase() : hash);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const compareResult = (() => {
    if (!hash1 || !hash2) return null;
    const a = hash1.trim().toLowerCase();
    const b = hash2.trim().toLowerCase();
    return a === b;
  })();

  const modes: { key: Mode; label: string; icon: string }[] = [
    { key: "text", label: "Text Hash", icon: "Aa" },
    { key: "file", label: "File Hash", icon: "📁" },
    { key: "hmac", label: "HMAC", icon: "🔑" },
    { key: "compare", label: "Compare", icon: "⚖️" },
  ];

  return (
    <>
      <title>Hash Generator (MD5, SHA-256, SHA-512) — Free Online Tool | DevTools Hub</title>
      <meta
        name="description"
        content="Free online hash generator. Compute MD5, SHA-1, SHA-224, SHA-256, SHA-384, SHA-512 hashes from text or files. HMAC-SHA256 support. Compare hashes. All processing in your browser — no data sent to any server."
      />
      <meta name="keywords" content="hash generator, md5 generator, sha256 generator, sha hash online, md5 hash generator, sha-1, sha-512, hmac, file hash, checksum" />
      <JsonLd
        data={[
          generateWebAppSchema({
            slug: "hash-generator",
            name: "Hash Generator",
            description: "Generate MD5, SHA-1, SHA-224, SHA-256, SHA-384, SHA-512 hashes from text or files. HMAC-SHA256 and hash comparison included.",
            category: "encoding",
          }),
          generateBreadcrumbSchema({
            slug: "hash-generator",
            name: "Hash Generator",
            description: "Generate MD5, SHA-1, SHA-224, SHA-256, SHA-384, SHA-512 hashes from text or files",
            category: "encoding",
          }),
          generateFAQSchema([
            { question: "What is a hash function?", answer: "A cryptographic hash function takes an input of any size and produces a fixed-size output (the \"digest\"). The same input always produces the same output, but even a tiny change in input produces a completely different hash. Hash functions are one-way — you cannot reverse a hash back to its original input." },
            { question: "Which hash algorithm should I use?", answer: "For security purposes, use SHA-256 or SHA-512. MD5 and SHA-1 have known collision vulnerabilities and should not be used for security. MD5 is still acceptable for non-security use cases like file checksums and cache keys. SHA-256 is the most widely used secure hash algorithm today." },
            { question: "What is HMAC?", answer: "HMAC (Hash-based Message Authentication Code) combines a secret key with a hash function to produce an authentication code. HMAC-SHA256 is widely used in API authentication, JWT signing, and message integrity verification. Unlike a plain hash, HMAC proves both integrity and authenticity." },
            { question: "Can I hash a file without uploading it?", answer: "Yes. This tool reads your file entirely in the browser using the File API and computes all hashes locally. No data is ever sent to a server. This makes it safe to hash sensitive or large files." },
            { question: "Can I decrypt a hash back to the original text?", answer: "No. Hash functions are one-way by design. You cannot mathematically reverse a hash to recover the original input. \"Hash cracking\" tools work by hashing many possible inputs and comparing results, not by reversing the function." },
            { question: "Is my data safe?", answer: "Yes. SHA hashes are computed using your browser's built-in Web Crypto API, and MD5 is computed with a pure JavaScript implementation. No data is sent to any server. Everything runs entirely in your browser." },
          ]),
        ]}
      />

      <div className="min-h-screen bg-slate-900 text-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <ToolBreadcrumb slug="hash-generator" />

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
              Hash Generator
            </h1>
            <p className="text-slate-400 max-w-2xl text-lg">
              Generate MD5, SHA-1, SHA-224, SHA-256, SHA-384, and SHA-512 hashes
              instantly. Hash text as you type, compute file checksums, generate
              HMAC-SHA256 signatures, or compare two hashes. Everything runs in
              your browser.
            </p>
          </div>

          {/* Security Warning */}
          <div className="mb-6 bg-amber-900/20 border border-amber-700/50 rounded-lg p-4">
            <div className="flex gap-3">
              <span className="text-amber-400 text-lg shrink-0">⚠️</span>
              <p className="text-amber-300 text-sm">
                <strong>Security note:</strong> MD5 and SHA-1 are not secure for
                password hashing. Use{" "}
                <strong>bcrypt</strong> or <strong>Argon2</strong> for passwords.
                SHA-256+ is suitable for checksums, digital signatures, and data
                integrity verification.
              </p>
            </div>
          </div>

          {/* Mode Tabs */}
          <div className="flex flex-wrap gap-2 mb-6">
            {modes.map((m) => (
              <button
                key={m.key}
                onClick={() => setMode(m.key)}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                  mode === m.key
                    ? "bg-blue-600 text-white"
                    : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                }`}
              >
                <span className="mr-1.5">{m.icon}</span>
                {m.label}
              </button>
            ))}
          </div>

          {/* Text Mode */}
          {mode === "text" && (
            <>
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-slate-300">
                    Input Text
                  </label>
                  <span className="text-xs text-slate-500">
                    {input.length} chars | {new TextEncoder().encode(input).length} bytes
                  </span>
                </div>
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Start typing to generate hashes in real time..."
                  className="w-full h-40 bg-slate-800 border border-slate-600 rounded-lg p-4 font-mono text-sm text-slate-200 placeholder-slate-500 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                  spellCheck={false}
                />
              </div>

              {/* Controls */}
              <div className="flex flex-wrap items-center gap-3 mb-6">
                <button
                  onClick={copyAll}
                  disabled={!hashes["MD5"]}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {copied === "all" ? "Copied All!" : "Copy All"}
                </button>
                <button
                  onClick={clearAll}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors"
                >
                  Clear
                </button>
                <label className="ml-auto flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={uppercase}
                    onChange={(e) => setUppercase(e.target.checked)}
                    className="w-4 h-4 rounded bg-slate-700 border-slate-600 text-blue-500 focus:ring-blue-500"
                  />
                  Uppercase
                </label>
              </div>
            </>
          )}

          {/* File Mode */}
          {mode === "file" && (
            <div className="mb-6">
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleFileDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-lg p-10 text-center cursor-pointer transition-colors ${
                  isDragging
                    ? "border-blue-500 bg-blue-900/20"
                    : "border-slate-600 hover:border-slate-500 bg-slate-800/50"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <div className="text-4xl mb-3">📂</div>
                <p className="text-slate-300 font-medium">
                  Drop a file here or click to select
                </p>
                <p className="text-slate-500 text-sm mt-1">
                  File is processed entirely in your browser — never uploaded
                </p>
              </div>
              {fileName && (
                <div className="mt-3 flex items-center gap-3 text-sm text-slate-400">
                  <span className="font-medium text-slate-300">{fileName}</span>
                  <span>({formatFileSize(fileSize)})</span>
                  {isComputing && <span className="text-blue-400">Computing...</span>}
                </div>
              )}

              {/* Controls for file mode */}
              <div className="flex flex-wrap items-center gap-3 mt-4 mb-6">
                <button
                  onClick={copyAll}
                  disabled={!hashes["MD5"]}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {copied === "all" ? "Copied All!" : "Copy All"}
                </button>
                <button
                  onClick={clearAll}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors"
                >
                  Clear
                </button>
                <label className="ml-auto flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={uppercase}
                    onChange={(e) => setUppercase(e.target.checked)}
                    className="w-4 h-4 rounded bg-slate-700 border-slate-600 text-blue-500 focus:ring-blue-500"
                  />
                  Uppercase
                </label>
              </div>
            </div>
          )}

          {/* HMAC Mode */}
          {mode === "hmac" && (
            <div className="mb-6 space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-300 mb-2 block">
                  Message
                </label>
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Enter message to authenticate..."
                  className="w-full h-32 bg-slate-800 border border-slate-600 rounded-lg p-4 font-mono text-sm text-slate-200 placeholder-slate-500 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                  spellCheck={false}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-300 mb-2 block">
                  Secret Key
                </label>
                <input
                  type="text"
                  value={hmacKey}
                  onChange={(e) => setHmacKey(e.target.value)}
                  placeholder="Enter HMAC secret key..."
                  className="w-full bg-slate-800 border border-slate-600 rounded-lg p-3 font-mono text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  spellCheck={false}
                />
              </div>
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-white">HMAC-SHA256</span>
                  <button
                    onClick={copyHmac}
                    disabled={!hmacResult}
                    className="text-xs text-slate-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    {copied === "hmac" ? "Copied!" : "Copy"}
                  </button>
                </div>
                <div className="bg-slate-900 rounded px-3 py-2 min-h-[2rem] flex items-center">
                  {hmacResult ? (
                    <code className="text-sm font-mono text-green-400 break-all select-all">
                      {displayHash(hmacResult)}
                    </code>
                  ) : (
                    <span className="text-sm text-slate-600 italic">
                      Enter a message and key to compute HMAC...
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={clearAll}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors"
              >
                Clear
              </button>
            </div>
          )}

          {/* Compare Mode */}
          {mode === "compare" && (
            <div className="mb-6 space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-300 mb-2 block">
                  Hash 1
                </label>
                <input
                  type="text"
                  value={hash1}
                  onChange={(e) => setHash1(e.target.value)}
                  placeholder="Paste first hash..."
                  className="w-full bg-slate-800 border border-slate-600 rounded-lg p-3 font-mono text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  spellCheck={false}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-300 mb-2 block">
                  Hash 2
                </label>
                <input
                  type="text"
                  value={hash2}
                  onChange={(e) => setHash2(e.target.value)}
                  placeholder="Paste second hash..."
                  className="w-full bg-slate-800 border border-slate-600 rounded-lg p-3 font-mono text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  spellCheck={false}
                />
              </div>
              {compareResult !== null && (
                <div
                  className={`rounded-lg p-4 border ${
                    compareResult
                      ? "bg-green-900/20 border-green-700/50"
                      : "bg-red-900/20 border-red-700/50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{compareResult ? "✅" : "❌"}</span>
                    <div>
                      <p className={`font-semibold ${compareResult ? "text-green-400" : "text-red-400"}`}>
                        {compareResult ? "Hashes match!" : "Hashes do not match"}
                      </p>
                      <p className="text-sm text-slate-400 mt-0.5">
                        {compareResult
                          ? "Both hashes are identical (case-insensitive comparison)."
                          : "The two hashes are different. Check for typos or ensure they were generated from the same input."}
                      </p>
                    </div>
                  </div>
                </div>
              )}
              <button
                onClick={clearAll}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors"
              >
                Clear
              </button>
            </div>
          )}

          {/* Hash Results (shown for text and file modes) */}
          {(mode === "text" || mode === "file") && (
            <div className="space-y-3 mb-6">
              {algorithms.map((algo) => (
                <div
                  key={algo.name}
                  className="bg-slate-800 border border-slate-700 rounded-lg p-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold text-white">
                        {algo.name}
                      </span>
                      <span className="text-xs text-slate-500">
                        {algo.bits} bits
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-slate-500 hidden sm:inline">
                        {algo.desc}
                      </span>
                      <button
                        onClick={() => copyHash(algo.name)}
                        disabled={!hashes[algo.name]}
                        className="text-xs text-slate-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0"
                      >
                        {copied === algo.name ? "Copied!" : "Copy"}
                      </button>
                    </div>
                  </div>
                  <div className="bg-slate-900 rounded px-3 py-2 min-h-[2rem] flex items-center">
                    {hashes[algo.name] ? (
                      <code className="text-sm font-mono text-green-400 break-all select-all">
                        {displayHash(hashes[algo.name])}
                      </code>
                    ) : (
                      <span className="text-sm text-slate-600 italic">
                        {mode === "text" ? "Start typing to see hash..." : "Select a file to compute hash..."}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Algorithm Comparison Table */}
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 mb-6">
            <h2 className="text-lg font-semibold text-white mb-4">
              Algorithm Comparison
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left py-2 pr-4 text-slate-400 font-medium">Algorithm</th>
                    <th className="text-left py-2 pr-4 text-slate-400 font-medium">Output</th>
                    <th className="text-left py-2 pr-4 text-slate-400 font-medium">Security</th>
                    <th className="text-left py-2 text-slate-400 font-medium">Use Case</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  <tr>
                    <td className="py-2 pr-4 text-white font-mono">MD5</td>
                    <td className="py-2 pr-4 text-slate-300">128 bits (32 hex)</td>
                    <td className="py-2 pr-4"><span className="text-red-400 text-xs bg-red-900/30 px-2 py-0.5 rounded">Broken</span></td>
                    <td className="py-2 text-slate-400">File checksums, non-security deduplication</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4 text-white font-mono">SHA-1</td>
                    <td className="py-2 pr-4 text-slate-300">160 bits (40 hex)</td>
                    <td className="py-2 pr-4"><span className="text-yellow-400 text-xs bg-yellow-900/30 px-2 py-0.5 rounded">Deprecated</span></td>
                    <td className="py-2 text-slate-400">Git commits, legacy systems</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4 text-white font-mono">SHA-224</td>
                    <td className="py-2 pr-4 text-slate-300">224 bits (56 hex)</td>
                    <td className="py-2 pr-4"><span className="text-green-400 text-xs bg-green-900/30 px-2 py-0.5 rounded">Secure</span></td>
                    <td className="py-2 text-slate-400">Certificate chains, constrained environments</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4 text-white font-mono">SHA-256</td>
                    <td className="py-2 pr-4 text-slate-300">256 bits (64 hex)</td>
                    <td className="py-2 pr-4"><span className="text-green-400 text-xs bg-green-900/30 px-2 py-0.5 rounded">Secure</span></td>
                    <td className="py-2 text-slate-400">TLS, Bitcoin, JWT, digital signatures</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4 text-white font-mono">SHA-384</td>
                    <td className="py-2 pr-4 text-slate-300">384 bits (96 hex)</td>
                    <td className="py-2 pr-4"><span className="text-green-400 text-xs bg-green-900/30 px-2 py-0.5 rounded">Secure</span></td>
                    <td className="py-2 text-slate-400">TLS 1.2+, government standards</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4 text-white font-mono">SHA-512</td>
                    <td className="py-2 pr-4 text-slate-300">512 bits (128 hex)</td>
                    <td className="py-2 pr-4"><span className="text-green-400 text-xs bg-green-900/30 px-2 py-0.5 rounded">Secure</span></td>
                    <td className="py-2 text-slate-400">High-security applications, password storage</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <RelatedTools currentSlug="hash-generator" />

          {/* FAQ Section */}
          <section className="mt-16 border-t border-slate-700 pt-10">
            <h2 className="text-2xl font-bold text-white mb-6">
              Frequently Asked Questions
            </h2>

            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  What is a hash function?
                </h3>
                <p className="text-slate-400">
                  A cryptographic hash function takes an input of any size and
                  produces a fixed-size output (the &ldquo;digest&rdquo;). The
                  same input always produces the same output, but even a tiny
                  change in input produces a completely different hash. Hash
                  functions are one-way — you cannot reverse a hash back to its
                  original input.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Which hash algorithm should I use?
                </h3>
                <p className="text-slate-400">
                  For security purposes, use SHA-256 or SHA-512. MD5 and SHA-1
                  have known collision vulnerabilities and should not be used for
                  security. MD5 is still acceptable for non-security use cases
                  like file checksums and cache keys. SHA-256 is the most widely
                  used secure hash algorithm today.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  What is HMAC and when should I use it?
                </h3>
                <p className="text-slate-400">
                  HMAC (Hash-based Message Authentication Code) combines a secret
                  key with a hash function to produce an authentication code.
                  HMAC-SHA256 is widely used in API authentication, JWT signing,
                  and message integrity verification. Unlike a plain hash, HMAC
                  proves both data integrity and authenticity.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Can I hash a file without uploading it?
                </h3>
                <p className="text-slate-400">
                  Yes. This tool reads your file entirely in the browser using the
                  File API and computes all hashes locally. No data is ever sent
                  to a server. This makes it safe to hash sensitive or large
                  files.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Can I decrypt a hash back to the original text?
                </h3>
                <p className="text-slate-400">
                  No. Hash functions are one-way by design. You cannot
                  mathematically reverse a hash to recover the original input.
                  &ldquo;Hash cracking&rdquo; tools work by hashing many possible
                  inputs and comparing results, not by reversing the function.
                  This is why longer, more complex inputs are harder to crack.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Is my data safe?
                </h3>
                <p className="text-slate-400">
                  Yes. SHA hashes are computed using your browser&apos;s built-in
                  Web Crypto API, and MD5 is computed with a pure JavaScript
                  implementation. No data is sent to any server. Everything runs
                  entirely in your browser.
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
