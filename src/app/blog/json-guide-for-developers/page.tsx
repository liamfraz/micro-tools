import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Understanding JSON: A Complete Guide for Developers',
  description: 'Learn JSON syntax, history, common mistakes, and best practices. Compare JSON vs XML, master JSON.parse() and JSON.stringify(), and explore related formats.',
  alternates: { canonical: '/blog/json-guide-for-developers' },
};

export default function JSONGuidePage() {
  return (
    <article className="min-h-screen bg-slate-900 text-slate-300 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <header className="mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">
            Understanding JSON: A Complete Guide for Developers
          </h1>
          <p className="text-lg text-slate-400">
            Master JSON syntax, avoid common pitfalls, and learn best practices for APIs and data interchange.
          </p>
          <p className="text-sm text-slate-500 mt-4">Published on DevTools Hub</p>
        </header>

        {/* Table of Contents */}
        <nav className="bg-slate-800 rounded-lg p-6 mb-8 border border-slate-700">
          <h2 className="text-white font-semibold mb-4">Table of Contents</h2>
          <ul className="space-y-2 text-slate-300">
            <li><a href="#what-is-json" className="hover:text-blue-400 transition">1. What is JSON and Its History</a></li>
            <li><a href="#syntax-rules" className="hover:text-blue-400 transition">2. JSON Syntax Rules</a></li>
            <li><a href="#common-mistakes" className="hover:text-blue-400 transition">3. Common Mistakes to Avoid</a></li>
            <li><a href="#json-vs-xml" className="hover:text-blue-400 transition">4. JSON vs XML</a></li>
            <li><a href="#javascript-handling" className="hover:text-blue-400 transition">5. Working with JSON in JavaScript</a></li>
            <li><a href="#json-apis" className="hover:text-blue-400 transition">6. JSON in APIs</a></li>
            <li><a href="#related-formats" className="hover:text-blue-400 transition">7. Related Formats</a></li>
            <li><a href="#tools" className="hover:text-blue-400 transition">8. Helpful Tools</a></li>
          </ul>
        </nav>

        {/* Content */}
        <section className="space-y-8">
          {/* Section 1 */}
          <div id="what-is-json">
            <h2 className="text-2xl font-bold text-white mb-4">1. What is JSON and Its History</h2>
            <p className="mb-4">
              JSON (JavaScript Object Notation) is a lightweight, text-based format for data interchange. It's human-readable,
              language-independent, and has become the de facto standard for APIs and configuration files across the web.
            </p>
            <p className="mb-4">
              JSON was created by <strong>Douglas Crockford</strong> in the early 2000s as a simpler alternative to XML.
              The name reflects its roots in JavaScript, but the format is completely language-agnostic—every modern programming
              language has built-in or widely-available JSON parsing libraries.
            </p>
            <p className="mb-4">
              The format was formally standardized as <strong>RFC 8259</strong> (The JavaScript Object Notation (JSON) Data Interchange Format)
              by the Internet Engineering Task Force (IETF). This standardization cemented JSON's role in web development and
              data interchange, making it a reliable foundation for APIs, cloud services, and microservices communication.
            </p>
            <p>
              Today, JSON powers everything from REST APIs (Twitter, GitHub, Stripe) to configuration files (package.json, tsconfig.json),
              NoSQL databases (MongoDB, Firebase), and messaging protocols (WebSockets). Its simplicity and efficiency have made it
              the preferred format over XML for modern applications.
            </p>
          </div>

          {/* Section 2 */}
          <div id="syntax-rules">
            <h2 className="text-2xl font-bold text-white mb-4">2. JSON Syntax Rules</h2>
            <p className="mb-6">
              JSON has a strict, minimal syntax. Understanding the rules prevents parsing errors and ensures your data is valid.
            </p>

            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold text-white mb-3">Objects</h3>
                <p className="mb-3">Objects are key-value pairs wrapped in curly braces. Keys must always be strings (in double quotes).</p>
                <div className="bg-slate-800 rounded-lg p-4 font-mono text-sm overflow-x-auto text-slate-300">
{`{
  "name": "Alice",
  "age": 30,
  "email": "alice@example.com"
}`}
                </div>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-white mb-3">Arrays</h3>
                <p className="mb-3">Arrays are ordered lists of values wrapped in square brackets.</p>
                <div className="bg-slate-800 rounded-lg p-4 font-mono text-sm overflow-x-auto text-slate-300">
{`{
  "colors": ["red", "green", "blue"],
  "numbers": [1, 2, 3, 4, 5],
  "mixed": [1, "two", true, null]
}`}
                </div>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-white mb-3">Data Types</h3>
                <p className="mb-3">JSON supports only seven data types:</p>
                <ul className="space-y-2 text-slate-300 ml-4">
                  <li><strong>String:</strong> Always in double quotes</li>
                  <li><strong>Number:</strong> Integer or float (no quotes)</li>
                  <li><strong>Boolean:</strong> true or false (lowercase, no quotes)</li>
                  <li><strong>Null:</strong> null (lowercase, no quotes)</li>
                  <li><strong>Object:</strong> {'{...}'}</li>
                  <li><strong>Array:</strong> {'[...]'}</li>
                </ul>
                <div className="bg-slate-800 rounded-lg p-4 font-mono text-sm overflow-x-auto text-slate-300 mt-3">
{`{
  "string": "hello",
  "number": 42,
  "float": 3.14,
  "boolean": true,
  "null": null,
  "object": { "key": "value" },
  "array": [1, 2, 3]
}`}
                </div>
              </div>
            </div>
          </div>

          {/* Section 3 */}
          <div id="common-mistakes">
            <h2 className="text-2xl font-bold text-white mb-4">3. Common Mistakes to Avoid</h2>
            <p className="mb-6">
              These errors will break JSON parsing. Watch out for them in your own code and API responses.
            </p>

            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
                  <span className="text-red-500">✗</span> Trailing Commas
                </h3>
                <div className="bg-slate-800 rounded-lg p-4 font-mono text-sm overflow-x-auto text-slate-300">
{`// INVALID
{
  "name": "Bob",
  "age": 25,  ← trailing comma!
}`}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
                  <span className="text-red-500">✗</span> Single Quotes Instead of Double Quotes
                </h3>
                <div className="bg-slate-800 rounded-lg p-4 font-mono text-sm overflow-x-auto text-slate-300">
{`// INVALID
{ 'name': 'Bob' }  ← single quotes!

// VALID
{ "name": "Bob" }`}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
                  <span className="text-red-500">✗</span> Comments
                </h3>
                <p className="mb-3 text-slate-300">JSON spec doesn't support comments (though extensions like JSON5 do).</p>
                <div className="bg-slate-800 rounded-lg p-4 font-mono text-sm overflow-x-auto text-slate-300">
{`// INVALID
{
  "name": "Bob", // this user's name
  "age": 25
}`}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
                  <span className="text-red-500">✗</span> Unquoted Keys
                </h3>
                <div className="bg-slate-800 rounded-lg p-4 font-mono text-sm overflow-x-auto text-slate-300">
{`// INVALID
{ name: "Bob" }  ← unquoted key!

// VALID
{ "name": "Bob" }`}
                </div>
              </div>
            </div>
          </div>

          {/* Section 4 */}
          <div id="json-vs-xml">
            <h2 className="text-2xl font-bold text-white mb-4">4. JSON vs XML: Why JSON Won</h2>
            <p className="mb-6">
              For decades, XML was the standard for data interchange. JSON eventually replaced it in most modern use cases. Here's why:
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-sm text-slate-300 border border-slate-700">
                <thead>
                  <tr className="bg-slate-800 border-b border-slate-700">
                    <th className="px-4 py-2 text-left font-semibold text-white">Aspect</th>
                    <th className="px-4 py-2 text-left font-semibold text-white">JSON</th>
                    <th className="px-4 py-2 text-left font-semibold text-white">XML</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-slate-700">
                    <td className="px-4 py-2 font-semibold">Size</td>
                    <td className="px-4 py-2">Compact</td>
                    <td className="px-4 py-2">Verbose (lots of tags)</td>
                  </tr>
                  <tr className="border-b border-slate-700">
                    <td className="px-4 py-2 font-semibold">Parsing</td>
                    <td className="px-4 py-2">Native in JavaScript</td>
                    <td className="px-4 py-2">Requires additional libraries</td>
                  </tr>
                  <tr className="border-b border-slate-700">
                    <td className="px-4 py-2 font-semibold">Readability</td>
                    <td className="px-4 py-2">Very readable for humans</td>
                    <td className="px-4 py-2">Readable but repetitive</td>
                  </tr>
                  <tr className="border-b border-slate-700">
                    <td className="px-4 py-2 font-semibold">Speed</td>
                    <td className="px-4 py-2">Faster parsing</td>
                    <td className="px-4 py-2">Slower parsing</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2 font-semibold">Web APIs</td>
                    <td className="px-4 py-2">Industry standard</td>
                    <td className="px-4 py-2">Legacy/Enterprise</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p className="mt-6">
              A quick example: the same data in JSON vs XML shows JSON's efficiency:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
              <div>
                <h4 className="font-semibold text-white mb-2">JSON (92 bytes)</h4>
                <div className="bg-slate-800 rounded-lg p-4 font-mono text-sm overflow-x-auto text-slate-300">
{`{"user":"Alice","age":30}`}
                </div>
              </div>
              <div>
                <h4 className="font-semibold text-white mb-2">XML (106 bytes)</h4>
                <div className="bg-slate-800 rounded-lg p-4 font-mono text-sm overflow-x-auto text-slate-300">
{`<user>
  <name>Alice</name>
  <age>30</age>
</user>`}
                </div>
              </div>
            </div>
          </div>

          {/* Section 5 */}
          <div id="javascript-handling">
            <h2 className="text-2xl font-bold text-white mb-4">5. Working with JSON in JavaScript</h2>
            <p className="mb-6">
              JavaScript has two essential methods for JSON: <code className="bg-slate-800 px-2 py-1 rounded text-yellow-400">JSON.parse()</code> and <code className="bg-slate-800 px-2 py-1 rounded text-yellow-400">JSON.stringify()</code>.
            </p>

            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-3">JSON.parse() — String to Object</h3>
                <p className="mb-3">Converts a JSON string into a JavaScript object:</p>
                <div className="bg-slate-800 rounded-lg p-4 font-mono text-sm overflow-x-auto text-slate-300">
{`const jsonString = '{"name":"Alice","age":30}';
const obj = JSON.parse(jsonString);
console.log(obj.name); // "Alice"`}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-3">JSON.stringify() — Object to String</h3>
                <p className="mb-3">Converts a JavaScript object into a JSON string:</p>
                <div className="bg-slate-800 rounded-lg p-4 font-mono text-sm overflow-x-auto text-slate-300">
{`const obj = { name: "Bob", age: 25 };
const jsonString = JSON.stringify(obj);
console.log(jsonString); // '{"name":"Bob","age":25}'`}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-3">Error Handling</h3>
                <p className="mb-3">Always wrap JSON.parse() in a try-catch to handle invalid JSON:</p>
                <div className="bg-slate-800 rounded-lg p-4 font-mono text-sm overflow-x-auto text-slate-300">
{`try {
  const data = JSON.parse(userInput);
} catch (error) {
  console.error("Invalid JSON:", error.message);
}`}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-3">Formatting Output</h3>
                <p className="mb-3">JSON.stringify() accepts optional parameters for pretty-printing:</p>
                <div className="bg-slate-800 rounded-lg p-4 font-mono text-sm overflow-x-auto text-slate-300">
{`const obj = { name: "Charlie", age: 35 };

// Pretty-printed with 2-space indent
const formatted = JSON.stringify(obj, null, 2);
console.log(formatted);
// {
//   "name": "Charlie",
//   "age": 35
// }`}
                </div>
              </div>
            </div>
          </div>

          {/* Section 6 */}
          <div id="json-apis">
            <h2 className="text-2xl font-bold text-white mb-4">6. JSON in APIs</h2>
            <p className="mb-6">
              JSON is the backbone of REST APIs and modern web services. Understanding how to work with JSON in requests and responses is essential.
            </p>

            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-3">HTTP Headers</h3>
                <p className="mb-3">Always set the Content-Type header when sending JSON:</p>
                <div className="bg-slate-800 rounded-lg p-4 font-mono text-sm overflow-x-auto text-slate-300">
{`Content-Type: application/json`}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-3">Fetching JSON Data</h3>
                <p className="mb-3">Using the Fetch API to GET and POST JSON:</p>
                <div className="bg-slate-800 rounded-lg p-4 font-mono text-sm overflow-x-auto text-slate-300">
{`// GET request
fetch('/api/users')
  .then(response => response.json())
  .then(data => console.log(data));

// POST request
fetch('/api/users', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ name: "Dave", age: 28 })
})
  .then(response => response.json())
  .then(data => console.log(data));`}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-3">Example API Response</h3>
                <p className="mb-3">A typical REST API returns JSON with status, data, and metadata:</p>
                <div className="bg-slate-800 rounded-lg p-4 font-mono text-sm overflow-x-auto text-slate-300">
{`{
  "status": "success",
  "data": {
    "id": 1,
    "name": "Eve",
    "email": "eve@example.com"
  },
  "timestamp": "2024-01-15T10:30:00Z"
}`}
                </div>
              </div>
            </div>
          </div>

          {/* Section 7 */}
          <div id="related-formats">
            <h2 className="text-2xl font-bold text-white mb-4">7. Related Formats and Extensions</h2>
            <p className="mb-6">
              While JSON is the standard, several related formats solve specific problems or add convenience features.
            </p>

            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">JSONL (JSON Lines)</h3>
                <p className="mb-3">
                  Newline-delimited JSON, useful for streaming large datasets or logs. Each line is a valid JSON object.
                </p>
                <div className="bg-slate-800 rounded-lg p-4 font-mono text-sm overflow-x-auto text-slate-300">
{`{"id":1,"name":"Alice"}
{"id":2,"name":"Bob"}
{"id":3,"name":"Charlie"}`}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">JSON5</h3>
                <p className="mb-3">
                  An extension of JSON that adds comments, trailing commas, single quotes, and other conveniences.
                  Popular for configuration files.
                </p>
                <div className="bg-slate-800 rounded-lg p-4 font-mono text-sm overflow-x-auto text-slate-300">
{`{
  // Comments are allowed!
  name: 'Alice',  // Single quotes OK
  age: 30,        // Trailing comma OK
}`}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">YAML</h3>
                <p className="mb-3">
                  Human-friendly format with indentation-based nesting, commonly used for configuration
                  (Kubernetes, Docker Compose). More readable but slower to parse.
                </p>
                <div className="bg-slate-800 rounded-lg p-4 font-mono text-sm overflow-x-auto text-slate-300">
{`name: Alice
age: 30
email: alice@example.com`}
                </div>
              </div>
            </div>
          </div>

          {/* Section 8 */}
          <div id="tools">
            <h2 className="text-2xl font-bold text-white mb-4">8. Helpful Tools for JSON Development</h2>
            <p className="mb-6">
              Make JSON work easier with these specialized tools on DevTools Hub:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-slate-800 rounded-lg p-6 border border-slate-700 hover:border-blue-500 transition">
                <h3 className="text-lg font-semibold text-white mb-2">
                  <Link href="/tools/json-formatter" className="hover:text-blue-400 transition">
                    JSON Formatter
                  </Link>
                </h3>
                <p className="text-slate-300">
                  Format, validate, and pretty-print JSON. Instantly catch syntax errors and beautify messy JSON.
                </p>
              </div>

              <div className="bg-slate-800 rounded-lg p-6 border border-slate-700 hover:border-blue-500 transition">
                <h3 className="text-lg font-semibold text-white mb-2">
                  <Link href="/tools/json-to-yaml" className="hover:text-blue-400 transition">
                    JSON to YAML Converter
                  </Link>
                </h3>
                <p className="text-slate-300">
                  Convert JSON to YAML format. Useful for Kubernetes configs, Docker Compose, and Ansible playbooks.
                </p>
              </div>

              <div className="bg-slate-800 rounded-lg p-6 border border-slate-700 hover:border-blue-500 transition">
                <h3 className="text-lg font-semibold text-white mb-2">
                  <Link href="/tools/csv-to-json" className="hover:text-blue-400 transition">
                    CSV to JSON Converter
                  </Link>
                </h3>
                <p className="text-slate-300">
                  Transform spreadsheet data into JSON. Perfect for migrating data or preparing datasets for APIs.
                </p>
              </div>

              <div className="bg-slate-800 rounded-lg p-6 border border-slate-700 hover:border-blue-500 transition">
                <h3 className="text-lg font-semibold text-white mb-2">DevTools Hub</h3>
                <p className="text-slate-300">
                  Browse all available tools for data transformation, conversion, and validation.
                </p>
              </div>
            </div>
          </div>

          {/* Conclusion */}
          <div className="bg-slate-800 rounded-lg p-8 border border-slate-700 mt-12">
            <h2 className="text-2xl font-bold text-white mb-4">Conclusion</h2>
            <p className="text-slate-300 mb-4">
              JSON has earned its place as the lingua franca of modern web development. Its simplicity, efficiency,
              and universal support make it the default choice for APIs, config files, and data interchange.
            </p>
            <p className="text-slate-300 mb-4">
              Master the syntax rules, avoid common pitfalls, and use the right tools for the job. Whether you're
              building REST APIs, working with NoSQL databases, or debugging configuration files, a solid understanding
              of JSON is fundamental to professional development.
            </p>
            <p className="text-slate-300">
              Keep the RFC 8259 spec bookmarked, use a JSON validator when in doubt, and don't hesitate to lean on
              DevTools Hub's JSON tools to speed up your workflow.
            </p>
          </div>
        </section>

        {/* Footer */}
        <footer className="mt-16 pt-8 border-t border-slate-700 text-slate-400 text-sm">
          <p>Last updated: 2026. JSON is maintained by the IETF under RFC 8259.</p>
        </footer>
      </div>
    </article>
  );
}
