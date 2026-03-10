"use client";

import { useState, useCallback } from "react";

type HashAlgorithm = "MD5" | "SHA-1" | "SHA-256" | "SHA-384" | "SHA-512";

// MD5 implementation (Web Crypto API doesn't support MD5)
function md5(input: string): string {
  const bytes = new TextEncoder().encode(input);

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

  // Pre-processing: adding padding bits
  const bitLen = bytes.length * 8;
  const paddedLen = ((bytes.length + 8) >>> 6 << 6) + 64;
  const padded = new Uint8Array(paddedLen);
  padded.set(bytes);
  padded[bytes.length] = 0x80;

  // Length in bits as 64-bit little-endian
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

  // Convert to hex (little-endian)
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

export default function HashGeneratorPage() {
  const [input, setInput] = useState("");
  const [hashes, setHashes] = useState<Record<HashAlgorithm, string>>({
    "MD5": "",
    "SHA-1": "",
    "SHA-256": "",
    "SHA-384": "",
    "SHA-512": "",
  });
  const [copied, setCopied] = useState<string | null>(null);
  const [uppercase, setUppercase] = useState(false);
  const [isComputing, setIsComputing] = useState(false);

  const computeHashes = useCallback(async () => {
    if (!input) {
      setHashes({ "MD5": "", "SHA-1": "", "SHA-256": "", "SHA-384": "", "SHA-512": "" });
      return;
    }

    setIsComputing(true);
    const encoded = new TextEncoder().encode(input);

    // MD5 (custom implementation)
    const md5Hash = md5(input);

    // SHA hashes via Web Crypto API
    const [sha1, sha256, sha384, sha512] = await Promise.all([
      crypto.subtle.digest("SHA-1", encoded),
      crypto.subtle.digest("SHA-256", encoded),
      crypto.subtle.digest("SHA-384", encoded),
      crypto.subtle.digest("SHA-512", encoded),
    ]);

    const toHex = (buf: ArrayBuffer) =>
      Array.from(new Uint8Array(buf))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");

    setHashes({
      "MD5": md5Hash,
      "SHA-1": toHex(sha1),
      "SHA-256": toHex(sha256),
      "SHA-384": toHex(sha384),
      "SHA-512": toHex(sha512),
    });
    setIsComputing(false);
  }, [input]);

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
    const lines = (Object.keys(hashes) as HashAlgorithm[])
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

  const clearAll = useCallback(() => {
    setInput("");
    setHashes({ "MD5": "", "SHA-1": "", "SHA-256": "", "SHA-384": "", "SHA-512": "" });
  }, []);

  const displayHash = (hash: string) => (uppercase ? hash.toUpperCase() : hash);

  const algorithms: { name: HashAlgorithm; bits: number; desc: string }[] = [
    { name: "MD5", bits: 128, desc: "Fast but cryptographically broken — use for checksums only" },
    { name: "SHA-1", bits: 160, desc: "Legacy — deprecated for security, still used in git" },
    { name: "SHA-256", bits: 256, desc: "Recommended — widely used in TLS, Bitcoin, JWT" },
    { name: "SHA-384", bits: 384, desc: "Truncated SHA-512 — used in some TLS configurations" },
    { name: "SHA-512", bits: 512, desc: "Strongest SHA-2 variant — best for password hashing" },
  ];

  return (
    <>
      <title>Hash Generator (MD5, SHA-1, SHA-256, SHA-512) - Free Online Tool | DevTools Hub</title>
      <meta
        name="description"
        content="Generate MD5, SHA-1, SHA-256, SHA-384, and SHA-512 hashes online for free. Compute all hash digests simultaneously from any text input. All processing in your browser."
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
                <a href="/tools" className="hover:text-white transition-colors">Developer Tools</a>
              </li>
              <li><span className="mx-1">/</span></li>
              <li className="text-slate-200">Hash Generator</li>
            </ol>
          </nav>

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
              Hash Generator
            </h1>
            <p className="text-slate-400 max-w-2xl text-lg">
              Generate MD5, SHA-1, SHA-256, SHA-384, and SHA-512 hashes from any
              text. All hash digests are computed simultaneously using the Web
              Crypto API. Everything runs in your browser.
            </p>
          </div>

          {/* Input */}
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
              placeholder="Enter text to hash..."
              className="w-full h-40 bg-slate-800 border border-slate-600 rounded-lg p-4 font-mono text-sm text-slate-200 placeholder-slate-500 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              spellCheck={false}
            />
          </div>

          {/* Controls */}
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <button
              onClick={computeHashes}
              disabled={isComputing}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              {isComputing ? "Computing..." : "Generate Hashes"}
            </button>
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

          {/* Hash Results */}
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
                      Hash will appear here...
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Algorithm Comparison */}
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
                    <td className="py-2 text-slate-400">Password storage, high-security applications</td>
                  </tr>
                </tbody>
              </table>
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
