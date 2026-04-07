import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'URL Encoding Explained: When and Why You Need It',
  description:
    'A deep dive into URL encoding (percent-encoding), reserved characters, JavaScript methods, and common pitfalls. Learn when to use encodeURIComponent vs encodeURI.',
  alternates: { canonical: '/blog/url-encoding-explained' },
  openGraph: {
    title: 'URL Encoding Explained: When and Why You Need It',
    description:
      'A deep dive into URL encoding (percent-encoding), reserved characters, JavaScript methods, and common pitfalls.',
    type: 'article',
  },
};

export default function URLEncodingBlog() {
  return (
    <article className="min-h-screen bg-slate-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            URL Encoding Explained: When and Why You Need It
          </h1>
          <div className="flex items-center gap-2 text-slate-400 text-sm">
            <time dateTime="2026-04-07">April 7, 2026</time>
            <span>•</span>
            <span>Developer Guide</span>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-8 text-slate-300 leading-relaxed">
          {/* Section 1 */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-white">
              What Is URL Encoding (Percent-Encoding)?
            </h2>
            <p>
              URL encoding, also called percent-encoding, is a mechanism for representing characters in a URL that would
              otherwise be unsafe or illegal. In its simplest form, a character is replaced by a percent sign followed
              by two hexadecimal digits representing the character's ASCII value.
            </p>
            <p>
              For example, a space character becomes <code className="text-orange-400">%20</code>, and the forward
              slash <code className="text-orange-400">/</code> can become <code className="text-orange-400">%2F</code>{' '}
              when it needs to be treated as literal data rather than a URL separator.
            </p>
            <p>
              You encounter URL encoding every day: bookmarks with query parameters, API endpoints, search queries, and
              file downloads. Without it, complex data couldn't safely travel through URLs.
            </p>
          </section>

          {/* Section 2 */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-white">
              Why URL Encoding Exists: RFC 3986 and Reserved Characters
            </h2>
            <p>
              URLs follow a strict specification defined in RFC 3986. The standard reserves certain characters for
              structural purposes:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li>
                <code className="text-orange-400">:</code> – scheme separator (http<strong>:</strong>//...)
              </li>
              <li>
                <code className="text-orange-400">//</code> – network path separator
              </li>
              <li>
                <code className="text-orange-400">@</code> – user info separator
              </li>
              <li>
                <code className="text-orange-400">?</code> – query string marker
              </li>
              <li>
                <code className="text-orange-400">#</code> – fragment identifier
              </li>
              <li>
                <code className="text-orange-400">/</code> – path segment separator
              </li>
              <li>
                <code className="text-orange-400">&</code> – parameter separator in query strings
              </li>
              <li>
                <code className="text-orange-400">=</code> – key-value separator
              </li>
            </ul>
            <p>
              When these reserved characters appear as <strong>data</strong> (not structure), they must be encoded to
              avoid ambiguity. Additionally, URLs are constrained to ASCII characters; non-ASCII characters must be
              encoded.
            </p>
          </section>

          {/* Section 3 */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-white">
              How URL Encoding Works: The Technical Process
            </h2>
            <p>URL encoding follows a three-step process:</p>
            <ol className="list-decimal list-inside space-y-3 ml-2">
              <li>
                <strong>Convert to UTF-8 bytes:</strong> The character is first encoded as UTF-8 bytes. For ASCII
                characters like "A", this is straightforward (65). For non-ASCII characters like "é", UTF-8 produces
                multiple bytes.
              </li>
              <li>
                <strong>Convert to hexadecimal:</strong> Each byte is converted to its two-digit hexadecimal
                representation.
              </li>
              <li>
                <strong>Add percent prefix:</strong> Each hex pair is prefixed with a percent sign.
              </li>
            </ol>
            <p>
              <strong>Example:</strong> The character "é" encodes to UTF-8 bytes <code className="text-orange-400">[0xC3, 0xA9]</code>, which become{' '}
              <code className="text-orange-400">%C3%A9</code> in a URL.
            </p>
          </section>

          {/* Section 4 */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-white">
              Reserved vs. Unreserved Characters
            </h2>
            <p>
              Not all characters need encoding. RFC 3986 defines <strong>unreserved characters</strong> that are safe in
              URLs:
            </p>
            <div className="bg-slate-800 rounded-lg p-4 font-mono text-sm overflow-x-auto">
              <code className="text-slate-200">
                A–Z, a–z, 0–9, hyphen (-), underscore (_), period (.), tilde (~)
              </code>
            </div>
            <p>
              These characters never need encoding. Everything else—including reserved characters when used as data,
              spaces, and special symbols—must be percent-encoded in URLs.
            </p>
            <p>
              <strong>Key takeaway:</strong> Encoding decisions depend on <em>context</em>. A forward slash is a
              structural character in paths but must be encoded when appearing in a query parameter value.
            </p>
          </section>

          {/* Section 5 */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-white">
              encodeURIComponent vs. encodeURI: The Critical Difference
            </h2>
            <p>
              JavaScript provides two encoding functions, and choosing the wrong one is a common bug. Here's the
              difference:
            </p>
            <div className="bg-slate-800 rounded-lg p-4 font-mono text-sm space-y-3 overflow-x-auto">
              <div>
                <code className="text-orange-400">encodeURIComponent()</code>
                <p className="text-slate-300 mt-2">Encodes for use in query strings, form data, or path segments.</p>
                <p className="text-slate-400 mt-1">Encodes: : / ? # [ ] @ ! $ & ' ( ) * + , ; =</p>
              </div>
            </div>
            <div className="bg-slate-800 rounded-lg p-4 font-mono text-sm space-y-3 overflow-x-auto">
              <div>
                <code className="text-orange-400">encodeURI()</code>
                <p className="text-slate-300 mt-2">Encodes a complete URI, preserving structural characters.</p>
                <p className="text-slate-400 mt-1">Does <strong>not</strong> encode: : / ? # [ ] @</p>
              </div>
            </div>
            <p className="mt-4">
              <strong>Rule:</strong> Use <code className="text-orange-400">encodeURIComponent()</code> for individual
              query parameter values, path segments, and form data. Use <code className="text-orange-400">encodeURI()</code> only when encoding an already-formed URL string (rarely needed in modern code).
            </p>
            <div className="bg-slate-800 rounded-lg p-4 font-mono text-sm space-y-3 overflow-x-auto">
              <p className="text-slate-200">
                <code>
                  {`// ✅ Correct: encode the parameter value`}
                  {'\n'}
                  {`const search = "hello world";`}
                  {'\n'}
                  {`const url = \`/api/search?q=\${encodeURIComponent(search)}\`;`}
                  {'\n'}
                  {`// Result: /api/search?q=hello%20world`}
                </code>
              </p>
            </div>
            <div className="bg-slate-800 rounded-lg p-4 font-mono text-sm space-y-3 overflow-x-auto">
              <p className="text-slate-200">
                <code>
                  {`// ❌ Wrong: encodeURI doesn't encode query separators`}
                  {'\n'}
                  {`const url = encodeURI("/api/search?q=hello world");`}
                  {'\n'}
                  {`// Result: /api/search?q=hello%20world (space encoded, but? is NOT)`}
                </code>
              </p>
            </div>
          </section>

          {/* Section 6 */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-white">
              Common URL Encoding Bugs
            </h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">1. Double Encoding</h3>
                <p>
                  Encoding a string that's already been encoded. If you receive an already-encoded parameter and encode
                  it again, <code className="text-orange-400">%20</code> becomes
                  <code className="text-orange-400">%2520</code>.
                </p>
                <div className="bg-slate-800 rounded-lg p-4 font-mono text-sm overflow-x-auto mt-2">
                  <code className="text-slate-200">
                    {`const param = "hello%20world"; // already encoded`}
                    {'\n'}
                    {`const double = encodeURIComponent(param); // WRONG`}
                    {'\n'}
                    {`// double = "hello%2520world"`}
                  </code>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">2. Forgetting to Encode</h3>
                <p>
                  Directly concatenating user input into URLs without encoding. A user entering "user@example.com"
                  without encoding breaks the URL structure.
                </p>
                <div className="bg-slate-800 rounded-lg p-4 font-mono text-sm overflow-x-auto mt-2">
                  <code className="text-slate-200">
                    {`// ❌ Broken`}
                    {'\n'}
                    {`const email = "user@example.com";`}
                    {'\n'}
                    {`const url = \`/api/users?email=\${email}\`;`}
                    {'\n'}
                    {`// Result: /api/users?email=user@example.com (@breaks parsing)`}
                    {'\n\n'}
                    {`// ✅ Fixed`}
                    {'\n'}
                    {`const url = \`/api/users?email=\${encodeURIComponent(email)}\`;`}
                    {'\n'}
                    {`// Result: /api/users?email=user%40example.com`}
                  </code>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">3. Encoding Entire URLs</h3>
                <p>
                  Using <code className="text-orange-400">encodeURIComponent()</code> on a complete URL destroys its
                  structure. Encode only the parts that are data.
                </p>
              </div>
            </div>
          </section>

          {/* Section 7 */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-white">
              URL Encoding in Different Contexts
            </h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Query Parameters</h3>
                <p>
                  Encode each parameter value with <code className="text-orange-400">encodeURIComponent()</code>. The{' '}
                  <code className="text-orange-400">?</code> and <code className="text-orange-400">&</code> are unencoded
                  (structure).
                </p>
                <div className="bg-slate-800 rounded-lg p-4 font-mono text-sm overflow-x-auto">
                  <code className="text-slate-200">
                    {`/search?q=hello+world&filter=category:tech`}
                  </code>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Path Segments</h3>
                <p>
                  Encode each segment separately to preserve <code className="text-orange-400">/</code> as a
                  separator.
                </p>
                <div className="bg-slate-800 rounded-lg p-4 font-mono text-sm overflow-x-auto">
                  <code className="text-slate-200">
                    {"/api/users/${encodeURIComponent(userId)}/profile"}
                  </code>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Form Data (application/x-www-form-urlencoded)</h3>
                <p>
                  HTML forms encode data similarly to URLs. Most frameworks handle this automatically, but you can
                  manually construct with <code className="text-orange-400">URLSearchParams</code>:
                </p>
                <div className="bg-slate-800 rounded-lg p-4 font-mono text-sm overflow-x-auto">
                  <code className="text-slate-200">
                    {`const params = new URLSearchParams({`}
                    {'\n'}
                    {`  email: 'user@example.com',`}
                    {'\n'}
                    {`  message: 'hello world'`}
                    {'\n'}
                    {`});`}
                    {'\n'}
                    {`// URLSearchParams handles encoding automatically`}
                  </code>
                </div>
              </div>
            </div>
          </section>

          {/* Section 8 */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-white">
              Space Encoding: %20 vs. +
            </h2>
            <p>
              Spaces have two valid encodings in URLs: <code className="text-orange-400">%20</code> and{' '}
              <code className="text-orange-400">+</code>. The plus sign is <strong>only</strong> valid in query strings
              under the <code className="text-orange-400">application/x-www-form-urlencoded</code> convention.
            </p>
            <div className="space-y-3">
              <div>
                <p className="font-semibold text-slate-200">
                  <code className="text-orange-400">%20</code> – Universal (anywhere)
                </p>
                <p className="text-slate-400">Safe for paths, fragments, and query parameters.</p>
              </div>
              <div>
                <p className="font-semibold text-slate-200">
                  <code className="text-orange-400">+</code> – Query strings only (form submission convention)
                </p>
                <p className="text-slate-400">
                  Modern JavaScript's <code className="text-orange-400">encodeURIComponent()</code> uses{' '}
                  <code className="text-orange-400">%20</code>. If you need <code className="text-orange-400">+</code>,
                  replace manually:
                </p>
                <div className="bg-slate-800 rounded-lg p-4 font-mono text-sm overflow-x-auto mt-2">
                  <code className="text-slate-200">
                    {`const encoded = encodeURIComponent("hello world");`}
                    {'\n'}
                    {`const withPlus = encoded.replace(/%20/g, '+'); // "hello+world"`}
                  </code>
                </div>
              </div>
            </div>
          </section>

          {/* Section 9 - CTA */}
          <section className="space-y-4 pt-4 border-t border-slate-700">
            <h2 className="text-2xl font-bold text-white">
              Try It Yourself
            </h2>
            <p>
              Understanding URL encoding is one thing; seeing it in action is another. Use our interactive URL encoder
              tools to test encoding in real-time and see exactly how different characters transform.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 mt-6">
              <a
                href="/tools/url-encoder"
                className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition"
              >
                URL Encoder Tool
              </a>
              <a
                href="/tools/url-encode-decode"
                className="inline-flex items-center justify-center px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-lg transition"
              >
                URL Encode/Decode
              </a>
            </div>
          </section>

          {/* Conclusion */}
          <section className="space-y-4 pt-4 border-t border-slate-700">
            <h2 className="text-2xl font-bold text-white">
              Key Takeaways
            </h2>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li>
                URL encoding converts unsafe characters into <code className="text-orange-400">%XX</code> format
              </li>
              <li>
                Reserved characters have structural meaning; they must be encoded when used as data
              </li>
              <li>
                <strong>Always use <code className="text-orange-400">encodeURIComponent()</code></strong> for
                query parameters, path segments, and form values
              </li>
              <li>
                Avoid double encoding by checking if data is already encoded
              </li>
              <li>
                Different contexts (paths, query strings, form data) have slightly different rules
              </li>
              <li>
                Use <code className="text-orange-400">URLSearchParams</code> to handle form data automatically
              </li>
            </ul>
          </section>
        </div>
      </div>
    </article>
  );
}
