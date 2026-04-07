import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'How to Use Regular Expressions: A Practical Guide',
  description:
    'Master regex fundamentals, common patterns, advanced techniques, and best practices. Learn email validation, lookahead/lookbehind, flags, and how to avoid catastrophic backtracking.',
  alternates: { canonical: '/blog/regular-expressions-practical-guide' },
};

export default function RegexGuidePage() {
  return (
    <main className="min-h-screen bg-slate-900 text-slate-300 py-12 px-4 sm:px-6 lg:px-8">
      <article className="max-w-3xl mx-auto">
        {/* Header */}
        <header className="mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            How to Use Regular Expressions: A Practical Guide
          </h1>
          <p className="text-lg text-slate-400">
            Master regex fundamentals, patterns, advanced techniques, and best practices to write
            better validation and text processing code.
          </p>
        </header>

        {/* Content */}
        <div className="space-y-8">
          {/* Section 1: What is Regex */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">
              What is Regex and Why Do Developers Need It?
            </h2>
            <p className="mb-4">
              Regular expressions (regex) are powerful patterns used to match, validate, extract,
              and manipulate text. They're one of the most versatile tools in a developer's toolkit,
              appearing in JavaScript, Python, Java, Go, and virtually every programming language.
            </p>
            <p className="mb-4">
              You'll use regex for email validation, extracting data from strings, finding and
              replacing content, parsing logs, and validating user input formats. While they can
              look intimidating at first, mastering regex unlocks concise, efficient solutions to
              common text-processing problems.
            </p>
            <p>
              The key insight: regex is a domain-specific language for describing text patterns.
              Once you understand the syntax, you can express complex matching logic in a single
              line of code.
            </p>
          </section>

          {/* Section 2: Basic Syntax */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">Basic Syntax: Building Blocks</h2>

            <h3 className="text-xl font-semibold text-white mt-6 mb-3">Literals</h3>
            <p className="mb-4">
              The simplest regex matches exact characters. The pattern <code>/hello/</code> matches
              the word "hello" anywhere in a string.
            </p>

            <h3 className="text-xl font-semibold text-white mt-6 mb-3">Character Classes</h3>
            <p className="mb-3">
              Square brackets <code>[]</code> match any single character inside them:
            </p>
            <div className="bg-slate-800 rounded-lg p-4 font-mono text-sm mb-4 overflow-x-auto">
              {`[a-z]     # matches any lowercase letter
[0-9]     # matches any digit
[a-zA-Z0-9]  # matches alphanumeric
[^a-z]    # negation: matches anything NOT a-z`}
            </div>

            <h3 className="text-xl font-semibold text-white mt-6 mb-3">Quantifiers</h3>
            <p className="mb-3">Quantifiers specify how many times to match a character:</p>
            <div className="bg-slate-800 rounded-lg p-4 font-mono text-sm mb-4 overflow-x-auto">
              {`+      # one or more
*      # zero or more
?      # zero or one
{n}    # exactly n times
{n,m}  # between n and m times`}
            </div>
            <p className="mb-4">
              Example: <code>/[a-z]+/</code> matches one or more lowercase letters.
            </p>

            <h3 className="text-xl font-semibold text-white mt-6 mb-3">Anchors</h3>
            <p className="mb-3">Anchors match positions, not characters:</p>
            <div className="bg-slate-800 rounded-lg p-4 font-mono text-sm mb-4 overflow-x-auto">
              {`^      # start of string
$      # end of string
\\b     # word boundary`}
            </div>
            <p>
              Example: <code>/^hello$/</code> matches only if the entire string is exactly
              "hello".
            </p>
          </section>

          {/* Section 3: Common Patterns */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">Common Patterns You'll Use</h2>

            <h3 className="text-xl font-semibold text-white mt-6 mb-3">Email Validation</h3>
            <p className="mb-3">
              A practical email regex (note: RFC 5322 is complex; this covers 99% of real-world
              cases):
            </p>
            <div className="bg-slate-800 rounded-lg p-4 font-mono text-sm mb-4 overflow-x-auto">
              {`const emailRegex = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;
emailRegex.test("user@example.com"); // true`}
            </div>

            <h3 className="text-xl font-semibold text-white mt-6 mb-3">Phone Numbers</h3>
            <p className="mb-3">Match US phone numbers in multiple formats:</p>
            <div className="bg-slate-800 rounded-lg p-4 font-mono text-sm mb-4 overflow-x-auto">
              {`const phoneRegex = /^(?:\\+?1[-.]?)?\\(?\\d{3}\\)?[-.]?\\d{3}[-.]?\\d{4}$/;
phoneRegex.test("(555) 123-4567"); // true
phoneRegex.test("+1-555-123-4567"); // true`}
            </div>

            <h3 className="text-xl font-semibold text-white mt-6 mb-3">URLs</h3>
            <p className="mb-3">Match HTTP/HTTPS URLs:</p>
            <div className="bg-slate-800 rounded-lg p-4 font-mono text-sm mb-4 overflow-x-auto">
              {`const urlRegex = /^https?:\\/\\/[^\\s\\/$.?#].[^\\s]*$/i;
urlRegex.test("https://example.com/path"); // true`}
            </div>

            <h3 className="text-xl font-semibold text-white mt-6 mb-3">Dates (YYYY-MM-DD)</h3>
            <p className="mb-3">Match ISO 8601 date format:</p>
            <div className="bg-slate-800 rounded-lg p-4 font-mono text-sm mb-4 overflow-x-auto">
              {`const dateRegex = /^\\d{4}-\\d{2}-\\d{2}$/;
dateRegex.test("2024-12-25"); // true`}
            </div>
          </section>

          {/* Section 4: Groups and Captures */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">Groups and Captures</h2>

            <h3 className="text-xl font-semibold text-white mt-6 mb-3">Capturing Groups</h3>
            <p className="mb-3">
              Parentheses <code>()</code> create capturing groups to extract parts of a match:
            </p>
            <div className="bg-slate-800 rounded-lg p-4 font-mono text-sm mb-4 overflow-x-auto">
              {`const nameRegex = /^(\\w+)\\s(\\w+)$/;
const match = "John Doe".match(nameRegex);
// match[0] = "John Doe"
// match[1] = "John"
// match[2] = "Doe"`}
            </div>

            <h3 className="text-xl font-semibold text-white mt-6 mb-3">Non-Capturing Groups</h3>
            <p className="mb-3">
              Use <code>(?:)</code> when you need grouping logic but don't want to capture:
            </p>
            <div className="bg-slate-800 rounded-lg p-4 font-mono text-sm mb-4 overflow-x-auto">
              {`const regex = /(?:https?|ftp):\\/\\/[^\\s]+/;
// The protocol part is grouped but not captured`}
            </div>
            <p>
              Non-capturing groups improve performance by skipping capture overhead and make your
              intent clearer to other developers.
            </p>
          </section>

          {/* Section 5: Lookahead and Lookbehind */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">
              Lookahead and Lookbehind: Advanced Matching
            </h2>

            <p className="mb-4">
              These assertions look ahead or behind in the string without consuming characters
              (they don't get included in the match).
            </p>

            <h3 className="text-xl font-semibold text-white mt-6 mb-3">Positive Lookahead</h3>
            <p className="mb-3">
              <code>(?=...)</code> asserts that what follows matches the pattern:
            </p>
            <div className="bg-slate-800 rounded-lg p-4 font-mono text-sm mb-4 overflow-x-auto">
              {`// Match a number only if followed by a percent sign
const regex = /\\d+(?=%)/;
"Get 50% off".match(regex)[0]; // "50"`}
            </div>

            <h3 className="text-xl font-semibold text-white mt-6 mb-3">Negative Lookahead</h3>
            <p className="mb-3">
              <code>(?!...)</code> asserts that what follows does NOT match:
            </p>
            <div className="bg-slate-800 rounded-lg p-4 font-mono text-sm mb-4 overflow-x-auto">
              {`// Match "password" only if not followed by "123"
const regex = /password(?!123)/;
"password456".match(regex)[0]; // "password"
"password123".match(regex); // null`}
            </div>

            <h3 className="text-xl font-semibold text-white mt-6 mb-3">Lookbehind</h3>
            <p className="mb-3">
              <code>(?&lt;=...)</code> and <code>(?&lt;!...)</code> look at what came before:
            </p>
            <div className="bg-slate-800 rounded-lg p-4 font-mono text-sm mb-4 overflow-x-auto">
              {`// Match a number only if preceded by a $ sign
const regex = /(?<=\\$)\\d+/;
"Price: $50".match(regex)[0]; // "50"`}
            </div>
          </section>

          {/* Section 6: Flags */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">Flags: Controlling Behavior</h2>

            <p className="mb-4">
              Flags modify how regex matching works. They appear after the closing slash:
              <code>/pattern/flags</code>.
            </p>

            <div className="bg-slate-800 rounded-lg p-4 font-mono text-sm mb-4 overflow-x-auto">
              {`g   # global: find all matches, not just the first
i   # case-insensitive: ignore letter case
m   # multiline: ^ and $ match line boundaries
s   # dotall: . matches newlines too`}
            </div>

            <h3 className="text-xl font-semibold text-white mt-6 mb-3">Practical Examples</h3>
            <div className="bg-slate-800 rounded-lg p-4 font-mono text-sm mb-4 overflow-x-auto">
              {`// Find all email-like patterns
"Email: test@example.com, admin@site.org".match(
  /[\\w.]+@[\\w.]+/g
);
// ["test@example.com", "admin@site.org"]

// Case-insensitive match
/hello/i.test("HELLO"); // true

// Match across multiple lines
/^line/m.test("first line\\nsecond line"); // true`}
            </div>
          </section>

          {/* Section 7: Readable Regex */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">Writing Readable Regex</h2>

            <p className="mb-4">
              Complex regex becomes unreadable fast. Here are strategies to keep it maintainable:
            </p>

            <h3 className="text-xl font-semibold text-white mt-6 mb-3">Break Into Parts</h3>
            <p className="mb-3">Compose patterns from smaller, named pieces:</p>
            <div className="bg-slate-800 rounded-lg p-4 font-mono text-sm mb-4 overflow-x-auto">
              {"const digit = '\\\\d';\nconst twoDigits = digit + '{2}';\nconst timeRegex = new RegExp(\n  `^${twoDigits}:${twoDigits}:${twoDigits}$`\n); // Matches HH:MM:SS"}
            </div>

            <h3 className="text-xl font-semibold text-white mt-6 mb-3">Named Groups (ES2018+)</h3>
            <p className="mb-3">
              Use <code>(?&lt;name&gt;...)</code> to name captures for clarity:
            </p>
            <div className="bg-slate-800 rounded-lg p-4 font-mono text-sm mb-4 overflow-x-auto">
              {`const dateRegex = /^(?<year>\\d{4})-(?<month>\\d{2})-(?<day>\\d{2})$/;
const match = "2024-12-25".match(dateRegex);
console.log(match.groups.year);  // "2024"
console.log(match.groups.month); // "12"
console.log(match.groups.day);   // "25"`}
            </div>

            <h3 className="text-xl font-semibold text-white mt-6 mb-3">Add Comments with Verbose Mode</h3>
            <p className="mb-3">
              Use the <code>x</code> flag (where supported) or comment the code itself:
            </p>
            <div className="bg-slate-800 rounded-lg p-4 font-mono text-sm mb-4 overflow-x-auto">
              {`// Email: local-part @ domain . tld
const emailRegex = /^
  [\\w.-]+          # local part
  @                 # at symbol
  [\\w.-]+          # domain
  \\.               # dot
  [a-z]{2,}        # top-level domain
$/ix;  // Note: 'x' flag not standard in JS`}
            </div>
          </section>

          {/* Section 8: Common Pitfalls */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">Common Pitfalls to Avoid</h2>

            <h3 className="text-xl font-semibold text-white mt-6 mb-3">Catastrophic Backtracking</h3>
            <p className="mb-3">
              Patterns with overlapping quantifiers can cause exponential time complexity:
            </p>
            <div className="bg-slate-800 rounded-lg p-4 font-mono text-sm mb-4 overflow-x-auto">
              {`// SLOW: Too many nested quantifiers
/(a+)+b/  # Can freeze on "aaaaac"

// BETTER: Anchor or be specific
/^a+b$/   # Anchors prevent excessive backtracking`}
            </div>

            <h3 className="text-xl font-semibold text-white mt-6 mb-3">Greedy vs Lazy Matching</h3>
            <p className="mb-3">
              By default, quantifiers are greedy (match as much as possible). Use{" "}
              <code>?</code> to make them lazy:
            </p>
            <div className="bg-slate-800 rounded-lg p-4 font-mono text-sm mb-4 overflow-x-auto">
              {`const html = "<div>content</div>";

// Greedy: matches from first < to last >
/<.*>/.exec(html)[0];
// Result: "<div>content</div>"

// Lazy: matches from < to first >
/<.*?>/.exec(html)[0];
// Result: "<div>"`}
            </div>

            <h3 className="text-xl font-semibold text-white mt-6 mb-3">Forgetting to Escape Special Characters</h3>
            <p className="mb-3">
              Characters like <code>.</code>, <code>*</code>, <code>+</code>, <code>?</code> have
              special meaning. Escape them with backslash:
            </p>
            <div className="bg-slate-800 rounded-lg p-4 font-mono text-sm mb-4 overflow-x-auto">
              {`/example.com/  # Matches "exampleXcom" (. = any char)
/example\\.com/ # Matches only "example.com"`}
            </div>
          </section>

          {/* Section 9: CTA */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">Test Your Skills Now</h2>

            <p className="mb-6">
              Theory is great, but regex mastery comes from practice. We've built tools to help
              you experiment and debug patterns in real-time:
            </p>

            <div className="space-y-4 mb-8">
              <a
                href="/tools/regex-tester"
                className="block p-4 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 hover:border-slate-600 transition-colors"
              >
                <h3 className="text-lg font-semibold text-white mb-2">Regex Tester</h3>
                <p className="text-slate-400">
                  Write patterns, test against sample strings, and see captures in real-time. Perfect
                  for debugging and learning.
                </p>
              </a>

              <a
                href="/tools/ai-regex-generator"
                className="block p-4 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 hover:border-slate-600 transition-colors"
              >
                <h3 className="text-lg font-semibold text-white mb-2">AI Regex Generator</h3>
                <p className="text-slate-400">
                  Describe what you want to match in plain English, and our AI generates the regex
                  pattern for you.
                </p>
              </a>
            </div>

            <p className="text-slate-400">
              Start small, test often, and build your regex intuition. Before you know it, you'll be
              writing patterns without thinking twice.
            </p>
          </section>

          {/* Closing */}
          <section className="mt-12 pt-8 border-t border-slate-700">
            <p className="text-slate-400 text-sm">
              Regular expressions are a superpower for text processing. Bookmark this guide and
              refer back as you level up from basic patterns to advanced lookahead/lookbehind
              techniques. Happy regex-ing!
            </p>
          </section>
        </div>
      </article>
    </main>
  );
}
