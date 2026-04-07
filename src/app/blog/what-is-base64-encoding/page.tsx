import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "What Is Base64 Encoding and How Does It Work?",
  description:
    "A practical guide to Base64 encoding — what it is, why it exists, how it works under the hood, and when you should (and shouldn't) use it in your projects.",
  alternates: {
    canonical: "/blog/what-is-base64-encoding",
  },
};

export default function Base64BlogPage() {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-300">
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center gap-3 text-sm text-slate-500 mb-4">
            <span className="bg-slate-800 text-slate-300 px-2.5 py-0.5 rounded-full text-xs font-medium">
              Encoding
            </span>
            <time dateTime="2026-04-07">April 7, 2026</time>
            <span>8 min read</span>
          </div>
          <h1 className="text-4xl font-extrabold text-white mb-4">
            What Is Base64 Encoding and How Does It Work?
          </h1>
          <p className="text-lg text-slate-400 leading-relaxed">
            Base64 is everywhere in web development, but many developers use it
            without fully understanding what's happening under the hood. This
            guide breaks down the algorithm, explores real-world use cases, and
            helps you decide when to use it—and when to avoid it.
          </p>
        </div>

        {/* Content */}
        <article className="space-y-8 leading-relaxed">
          {/* Section 1 */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">
              What Is Base64 and Why Does It Exist?
            </h2>
            <p>
              Base64 is an encoding scheme that converts binary data into a
              text-based format using only 64 printable ASCII characters. These
              64 characters are: uppercase letters (A-Z), lowercase letters
              (a-z), digits (0-9), plus (+), and forward slash (/). An equals
              sign (=) is used for padding.
            </p>
            <p className="mt-4">
              But why do we need this? The internet was originally designed to
              transmit text, not binary data. Before Base64, sending images,
              files, or other binary data over email or HTTP was problematic.
              Many systems would corrupt binary data because they expected
              text-only content. Base64 solved this by encoding binary data into
              text that could safely travel through any system without corruption.
            </p>
            <p className="mt-4">
              Today, even though modern systems handle binary data fine, Base64
              remains useful for embedding data directly in text formats like
              JSON, HTML, CSS, and URLs.
            </p>
          </section>

          {/* Section 2 */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">
              How Base64 Encoding Actually Works
            </h2>
            <p>
              Base64 encoding converts every 3 bytes of input into 4 characters
              of output. Here's the step-by-step process:
            </p>

            <div className="mt-6 space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Step 1: Break Input Into 3-Byte Chunks
                </h3>
                <p>
                  Take your input data and split it into groups of 3 bytes (24
                  bits). If the input isn't a multiple of 3, the last group will
                  have fewer bytes—we'll handle that with padding.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Step 2: Split Each 24-Bit Chunk Into Four 6-Bit Groups
                </h3>
                <p>
                  Each 3-byte chunk (24 bits) is split into four 6-bit groups.
                  Six bits can represent numbers from 0–63 (2^6 = 64 possible
                  values).
                </p>
                <div className="mt-3 bg-slate-800 rounded-lg p-4 font-mono text-sm overflow-x-auto">
                  <div className="text-slate-300">
                    Example: Letter "A" = 65 (ASCII) = 01000001 (binary)
                  </div>
                  <div className="text-slate-300 mt-2">
                    + Next 2 bytes from input = 24 bits total
                  </div>
                  <div className="text-slate-300 mt-2">
                    24 bits → split into four 6-bit groups
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Step 3: Map Each 6-Bit Group to the Base64 Alphabet
                </h3>
                <p>
                  Use the 6-bit value as an index into the Base64 alphabet:
                </p>
                <div className="mt-3 bg-slate-800 rounded-lg p-4 font-mono text-sm">
                  <div className="text-slate-300">
                    A-Z (0-25), a-z (26-51), 0-9 (52-61), + (62), / (63)
                  </div>
                </div>
                <p className="mt-3">
                  So if a 6-bit group equals 5, it maps to 'F'. If it equals 28,
                  it maps to 'c'.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Step 4: Handle Padding
                </h3>
                <p>
                  If the input isn't a multiple of 3 bytes, pad with zeros and
                  mark the output with equals signs:
                </p>
                <div className="mt-3 bg-slate-800 rounded-lg p-4 font-mono text-sm">
                  <div className="text-slate-300">
                    • 1 remaining byte → 2 output characters + "=="
                  </div>
                  <div className="text-slate-300 mt-1">
                    • 2 remaining bytes → 3 output characters + "="
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 bg-slate-800 rounded-lg p-4 font-mono text-sm">
              <p className="text-slate-300">
                <strong>Real Example:</strong>
              </p>
              <p className="text-slate-300 mt-2">Input: "Hi" (2 bytes)</p>
              <p className="text-slate-300 mt-1">
                Hex: 0x48 0x69 → Binary: 01001000 01101001
              </p>
              <p className="text-slate-300 mt-1">
                Split into 6-bit: 010010 | 000110 | 100100 (pad)
              </p>
              <p className="text-slate-300 mt-1">
                Decimal: 18 | 6 | 36 → Map to Base64: S | G | k
              </p>
              <p className="text-slate-300 mt-1">Output: "SGk=" (with padding)</p>
            </div>
          </section>

          {/* Section 3 */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">
              Common Use Cases: Where Base64 Shines
            </h2>

            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  1. Data URIs in HTML and CSS
                </h3>
                <p>
                  Embed small images directly into HTML or CSS without external
                  requests. This avoids extra HTTP round trips and can improve
                  page load time for tiny assets.
                </p>
                <div className="mt-3 bg-slate-800 rounded-lg p-4 font-mono text-sm overflow-x-auto">
                  <div className="text-slate-300">
                    &lt;img src="data:image/png;base64,iVBORw0KG..." /&gt;
                  </div>
                </div>
                <p className="mt-3 text-slate-400 text-sm">
                  Downside: The URI becomes long and non-human-readable.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  2. Email Attachments (MIME)
                </h3>
                <p>
                  Email servers originally expected 7-bit ASCII text. To attach
                  files (images, PDFs, etc.), they must be Base64 encoded. The
                  MIME standard uses Base64 for all non-text attachments.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  3. JWT (JSON Web Tokens)
                </h3>
                <p>
                  JWTs use Base64URL encoding (a variant we'll cover next) to
                  encode the header and payload. The token becomes a
                  compact string safe for URLs and HTTP headers.
                </p>
                <div className="mt-3 bg-slate-800 rounded-lg p-4 font-mono text-sm overflow-x-auto">
                  <div className="text-slate-300 break-all">
                    eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiI...Mm9MJ.TJVA
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  4. API Payloads and Configuration
                </h3>
                <p>
                  When you need to embed binary data in JSON requests (like
                  sending file data to an API), Base64 is the standard. It keeps
                  the payload valid JSON without character escaping issues.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  5. Password/Credential Storage in Transit
                </h3>
                <p>
                  Although Base64 is <strong>not</strong> encryption, it's often
                  used to safely transmit credentials in HTTP Basic
                  Authentication headers. Always combine with HTTPS.
                </p>
              </div>
            </div>
          </section>

          {/* Section 4 */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">
              URL-Safe Base64: The Variant You Should Know About
            </h2>
            <p>
              Standard Base64 uses + and / characters, which have special meaning
              in URLs. The + means space, and / is a path separator. This causes
              problems when you try to pass Base64 data in URL query parameters.
            </p>
            <p className="mt-4">
              <strong>URL-safe Base64</strong> (also called Base64URL) swaps these
              characters:
            </p>
            <div className="mt-3 bg-slate-800 rounded-lg p-4 font-mono text-sm">
              <div className="text-slate-300">
                Standard: + and /
              </div>
              <div className="text-slate-300 mt-1">
                URL-safe: - (hyphen) and _ (underscore)
              </div>
            </div>
            <p className="mt-4">
              JWTs, OAuth 2.0 PKCE, and other web standards use Base64URL.
              JavaScript has built-in methods for this:
            </p>
            <div className="mt-3 bg-slate-800 rounded-lg p-4 font-mono text-sm overflow-x-auto">
              <div className="text-slate-300">
                {/* Standard Base64 */}
              </div>
              <div className="text-slate-300">
                btoa("Hello") // Standard: SGVsbG8=
              </div>
              <div className="text-slate-300 mt-3">
                {/* URL-safe requires manual conversion */}
              </div>
              <div className="text-slate-300">
                btoa("Hello").replace(/\+/g, '-').replace(/\//g, '_')
              </div>
              <div className="text-slate-300 mt-1">
                // URL-safe: SGVsbG8=
              </div>
            </div>
          </section>

          {/* Section 5 */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">
              The Size Overhead: What You're Trading
            </h2>
            <p>
              Here's the trade-off you're making with Base64: every 3 bytes of
              input becomes 4 bytes of output. That's a <strong>33% overhead</strong>.
            </p>
            <div className="mt-4 space-y-3">
              <p>
                <strong>Example:</strong>
              </p>
              <div className="bg-slate-800 rounded-lg p-4 font-mono text-sm">
                <div className="text-slate-300">
                  Original image: 300 KB
                </div>
                <div className="text-slate-300 mt-1">
                  Base64 encoded: 400 KB (33% larger)
                </div>
              </div>
            </div>
            <p className="mt-4">
              This overhead matters when:
            </p>
            <ul className="mt-3 space-y-2 text-slate-300 ml-4">
              <li>
                • <strong>Bandwidth is limited:</strong> Encoding large files
                balloons their size unnecessarily
              </li>
              <li>
                • <strong>Network latency is critical:</strong> Sending 33% more
                data takes longer
              </li>
              <li>
                • <strong>Storage is a constraint:</strong> Databases or caches
                store the larger encoded version
              </li>
            </ul>
            <p className="mt-4">
              The overhead is worth it when the convenience of embedding data
              directly in text formats outweighs the size cost.
            </p>
          </section>

          {/* Section 6 */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">
              When NOT to Use Base64
            </h2>
            <p>
              Base64 is useful, but it's not a solution to every problem. Avoid
              it when:
            </p>

            <div className="space-y-4 mt-4">
              <div>
                <h3 className="font-semibold text-white">1. Large Files</h3>
                <p className="text-slate-300 mt-1">
                  Never encode a 100 MB file to Base64. The 33% overhead means
                  you'll create a 133 MB payload. Use binary transfer instead
                  (HTTP multipart/form-data for file uploads).
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-white">
                  2. When Binary Transport Is Available
                </h3>
                <p className="text-slate-300 mt-1">
                  Modern HTTP supports binary content natively. If you're
                  building an API, send images as image/png and files as
                  application/octet-stream. No encoding needed.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-white">3. Security</h3>
                <p className="text-slate-300 mt-1">
                  Base64 is <strong>not encryption</strong>. Anyone can decode
                  it instantly. Never use it to hide sensitive data. Use
                  encryption (AES, TLS) instead.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-white">4. Hashing</h3>
                <p className="text-slate-300 mt-1">
                  Don't use Base64 for checksums or fingerprints. Use proper
                  hash functions (SHA-256, MD5). Base64 is just an encoding, not
                  a hash.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-white">
                  5. When the Format Has Native Binary Support
                </h3>
                <p className="text-slate-300 mt-1">
                  Protocol Buffers, MessagePack, and BSON handle binary data
                  natively without encoding. Use them for APIs where efficiency
                  matters.
                </p>
              </div>
            </div>
          </section>

          {/* Section 7 */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">
              Quick Reference: Base64 in Practice
            </h2>

            <div className="space-y-4 mt-4">
              <div>
                <h3 className="font-semibold text-white mb-2">
                  Encoding in JavaScript
                </h3>
                <div className="bg-slate-800 rounded-lg p-4 font-mono text-sm overflow-x-auto">
                  <div className="text-slate-300">
                    const text = "Hello, World!"
                  </div>
                  <div className="text-slate-300 mt-1">
                    const encoded = btoa(text)
                  </div>
                  <div className="text-slate-300 mt-1">
                    console.log(encoded) // "SGVsbG8sIFdvcmxkIQ=="
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-white mb-2">
                  Decoding in JavaScript
                </h3>
                <div className="bg-slate-800 rounded-lg p-4 font-mono text-sm overflow-x-auto">
                  <div className="text-slate-300">
                    const encoded = "SGVsbG8sIFdvcmxkIQ=="
                  </div>
                  <div className="text-slate-300 mt-1">
                    const decoded = atob(encoded)
                  </div>
                  <div className="text-slate-300 mt-1">
                    console.log(decoded) // "Hello, World!"
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-white mb-2">
                  Encoding in Python
                </h3>
                <div className="bg-slate-800 rounded-lg p-4 font-mono text-sm overflow-x-auto">
                  <div className="text-slate-300">
                    import base64
                  </div>
                  <div className="text-slate-300 mt-1">
                    text = "Hello, World!"
                  </div>
                  <div className="text-slate-300 mt-1">
                    encoded = base64.b64encode(text.encode())
                  </div>
                  <div className="text-slate-300 mt-1">
                    print(encoded) # b'SGVsbG8sIFdvcmxkIQ=='
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Section 8 */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">
              Try It Yourself
            </h2>
            <p>
              Want to experiment with Base64 encoding and decoding? Try our free
              Base64 Encoder tool:
            </p>
            <div className="mt-4">
              <Link
                href="/tools/base64-encoder"
                className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
              >
                Open Base64 Encoder →
              </Link>
            </div>
            <p className="mt-4 text-slate-400 text-sm">
              Use it to encode text, files, or data URIs. See how the output
              changes with different inputs and understand Base64 in action.
            </p>
          </section>

          {/* Conclusion */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">
              Key Takeaways
            </h2>
            <ul className="space-y-3 text-slate-300 ml-4">
              <li>
                • <strong>Base64</strong> converts binary data to printable ASCII
                text using 64 characters
              </li>
              <li>
                • Every <strong>3 bytes</strong> become <strong>4 characters</strong>
                {" "}
                (33% overhead)
              </li>
              <li>
                • Use it for: <strong>data URIs, email attachments, JWTs, API
                  payloads</strong>
              </li>
              <li>
                • <strong>URL-safe Base64</strong> swaps + and / for - and _
              </li>
              <li>
                • <strong>Don't</strong> use it for: large files, encryption,
                hashing, or when binary transport is available
              </li>
              <li>
                • It's an <strong>encoding</strong>, not encryption—anyone can
                decode it
              </li>
            </ul>
          </section>
        </article>

        {/* Footer */}
        <div className="mt-16 pt-8 border-t border-slate-800">
          <p className="text-slate-400 text-sm">
            Have feedback on this guide? Found an error?{" "}
            <a
              href="https://github.com/yourusername/devtools-hub"
              className="text-blue-400 hover:text-blue-300 transition-colors"
            >
              Let us know on GitHub
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
