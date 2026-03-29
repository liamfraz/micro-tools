"use client";

import { useState, useMemo, useCallback } from "react";
import JsonLd from "@/components/JsonLd";
import RelatedTools from "@/components/RelatedTools";
import ToolBreadcrumb from "@/components/ToolBreadcrumb";
import {
  generateFAQSchema,
  generateWebAppSchema,
  generateBreadcrumbSchema,
} from "@/lib/jsonld";

interface ParsedHeader {
  name: string;
  value: string;
  category: HeaderCategory;
  explanation: string;
}

type HeaderCategory = "Security" | "Caching" | "CORS" | "Content" | "Custom";

const CATEGORY_COLORS: Record<HeaderCategory, { bg: string; text: string }> = {
  Security: { bg: "bg-red-900/40", text: "text-red-300" },
  Caching: { bg: "bg-amber-900/40", text: "text-amber-300" },
  CORS: { bg: "bg-purple-900/40", text: "text-purple-300" },
  Content: { bg: "bg-blue-900/40", text: "text-blue-300" },
  Custom: { bg: "bg-slate-700/60", text: "text-slate-300" },
};

const SECURITY_HEADERS: Record<string, { name: string; description: string }> = {
  "strict-transport-security": {
    name: "Strict-Transport-Security (HSTS)",
    description: "Forces browsers to use HTTPS for all future requests to this domain",
  },
  "content-security-policy": {
    name: "Content-Security-Policy (CSP)",
    description: "Controls which resources the browser is allowed to load, preventing XSS and injection attacks",
  },
  "x-frame-options": {
    name: "X-Frame-Options",
    description: "Prevents the page from being loaded in an iframe, protecting against clickjacking",
  },
  "x-content-type-options": {
    name: "X-Content-Type-Options",
    description: "Prevents browsers from MIME-sniffing a response away from the declared Content-Type",
  },
  "referrer-policy": {
    name: "Referrer-Policy",
    description: "Controls how much referrer information is sent with requests from this page",
  },
  "permissions-policy": {
    name: "Permissions-Policy",
    description: "Controls which browser features (camera, microphone, geolocation) the page can use",
  },
};

const HEADER_EXPLANATIONS: Record<string, string> = {
  // Content headers
  "content-type": "Tells the browser what type of data is in the response (e.g. HTML, JSON, image)",
  "content-length": "The size of the response body in bytes",
  "content-encoding": "The compression algorithm used (e.g. gzip, br) — browsers decompress automatically",
  "content-language": "The natural language of the content (e.g. en, fr)",
  "content-disposition": "Tells the browser to download the file instead of displaying it, and suggests a filename",
  "transfer-encoding": "How the response body is encoded for transfer (e.g. chunked for streaming)",
  // Caching headers
  "cache-control": "Directives for caching: how long to store, whether to revalidate, public vs private",
  "etag": "A unique fingerprint for this version of the resource — used for conditional requests",
  "last-modified": "When the resource was last changed — used for cache validation",
  "expires": "The date/time after which the response is considered stale (older mechanism, Cache-Control takes precedence)",
  "age": "How many seconds the response has been in a proxy cache",
  "vary": "Lists which request headers affect caching — different header values get separate cached copies",
  "pragma": "Legacy HTTP/1.0 cache directive; use Cache-Control instead",
  "if-none-match": "Conditional request: only send the resource if the ETag has changed",
  "if-modified-since": "Conditional request: only send the resource if modified after this date",
  // Security headers
  "strict-transport-security": "Forces HTTPS connections for this domain. max-age sets duration; includeSubDomains extends to subdomains",
  "content-security-policy": "Allowlist of content sources — blocks inline scripts, unauthorized domains, and injection attacks",
  "content-security-policy-report-only": "Like CSP but only reports violations without blocking — useful for testing policies",
  "x-frame-options": "DENY blocks all framing; SAMEORIGIN allows same-origin framing. Prevents clickjacking",
  "x-content-type-options": "Set to 'nosniff' to prevent browsers from guessing content types, which can enable attacks",
  "referrer-policy": "Controls the Referer header on navigation. 'strict-origin-when-cross-origin' is a good default",
  "permissions-policy": "Restricts browser APIs (camera, mic, geolocation) the page can access",
  "x-xss-protection": "Legacy XSS filter (deprecated). Modern browsers rely on CSP instead",
  "x-permitted-cross-domain-policies": "Controls Adobe Flash/PDF cross-domain access. 'none' blocks all",
  "cross-origin-opener-policy": "Isolates the browsing context to prevent cross-origin attacks like Spectre",
  "cross-origin-embedder-policy": "Requires resources to explicitly opt-in to being loaded cross-origin",
  "cross-origin-resource-policy": "Controls which origins can include this resource (same-origin, same-site, cross-origin)",
  // CORS headers
  "access-control-allow-origin": "Which origins can access this resource. '*' means any origin, or a specific domain",
  "access-control-allow-methods": "HTTP methods allowed in cross-origin requests (GET, POST, PUT, etc.)",
  "access-control-allow-headers": "Which request headers are allowed in cross-origin requests",
  "access-control-allow-credentials": "Whether cookies and auth headers can be sent with cross-origin requests",
  "access-control-expose-headers": "Which response headers the browser can expose to frontend JavaScript",
  "access-control-max-age": "How long (seconds) the browser can cache a preflight OPTIONS response",
  // Server/connection
  "server": "Identifies the web server software handling the request",
  "date": "When the response was generated by the server",
  "connection": "Controls whether the network connection stays open after the current request",
  "keep-alive": "Parameters for persistent connections (timeout, max requests)",
  "x-powered-by": "Identifies the backend framework or technology. Often removed for security",
  "x-request-id": "A unique identifier for this request — useful for debugging and log correlation",
  "x-correlation-id": "Links related requests across distributed services for tracing",
  // Redirect & location
  "location": "The URL to redirect to (used with 3xx status codes)",
  // Auth
  "www-authenticate": "Tells the client what authentication scheme to use (e.g. Bearer, Basic)",
  "authorization": "Contains credentials for authenticating the client with the server",
  // Cookies
  "set-cookie": "Sends a cookie to the browser. Attributes control expiry, security, and scope",
  "cookie": "Sends stored cookies back to the server with each request",
  // Rate limiting
  "retry-after": "How many seconds to wait before retrying (used with 429 or 503 status codes)",
  "x-ratelimit-limit": "The maximum number of requests allowed in the current window",
  "x-ratelimit-remaining": "How many requests remain in the current rate limit window",
  "x-ratelimit-reset": "When the rate limit window resets (usually a Unix timestamp)",
  // CDN/proxy
  "x-cache": "Whether the response was served from a CDN/proxy cache (HIT) or origin server (MISS)",
  "cf-ray": "Cloudflare request identifier — useful for Cloudflare support tickets",
  "cf-cache-status": "Cloudflare cache status: HIT, MISS, DYNAMIC, BYPASS, etc.",
  "x-cdn": "Identifies which CDN served the response",
  "via": "Intermediate proxies or gateways between client and server",
  "x-forwarded-for": "The original client IP when behind a proxy or load balancer",
  "x-forwarded-proto": "The original protocol (http/https) before proxy termination",
  "x-forwarded-host": "The original Host header before proxy forwarding",
  // Accept
  "accept": "Content types the client can handle (e.g. text/html, application/json)",
  "accept-encoding": "Compression algorithms the client supports (gzip, br, deflate)",
  "accept-language": "Preferred languages for the response content",
  // Misc
  "host": "The domain name and port of the server being requested",
  "user-agent": "Identifies the client software (browser, bot, or HTTP library)",
  "x-dns-prefetch-control": "Controls DNS prefetching — 'off' can improve privacy",
  "expect-ct": "Enforces Certificate Transparency for detecting misissued TLS certificates (deprecated)",
  "alt-svc": "Advertises alternative services (e.g. HTTP/3 over QUIC) for future requests",
  "link": "Specifies relationships to other resources (preload, prefetch, canonical, etc.)",
};

function categorizeHeader(name: string): HeaderCategory {
  const lower = name.toLowerCase();

  const securityHeaders = [
    "strict-transport-security", "content-security-policy", "content-security-policy-report-only",
    "x-frame-options", "x-content-type-options", "x-xss-protection", "referrer-policy",
    "permissions-policy", "x-permitted-cross-domain-policies", "cross-origin-opener-policy",
    "cross-origin-embedder-policy", "cross-origin-resource-policy", "x-dns-prefetch-control",
    "expect-ct",
  ];
  if (securityHeaders.includes(lower)) return "Security";

  const cachingHeaders = [
    "cache-control", "etag", "last-modified", "expires", "age", "vary", "pragma",
    "if-none-match", "if-modified-since",
  ];
  if (cachingHeaders.includes(lower)) return "Caching";

  const corsHeaders = [
    "access-control-allow-origin", "access-control-allow-methods",
    "access-control-allow-headers", "access-control-allow-credentials",
    "access-control-expose-headers", "access-control-max-age",
  ];
  if (corsHeaders.includes(lower)) return "CORS";

  const contentHeaders = [
    "content-type", "content-length", "content-encoding", "content-language",
    "content-disposition", "transfer-encoding", "accept", "accept-encoding",
    "accept-language",
  ];
  if (contentHeaders.includes(lower)) return "Content";

  return "Custom";
}

function getExplanation(name: string, value: string): string {
  const lower = name.toLowerCase();
  const known = HEADER_EXPLANATIONS[lower];
  if (known) return known;

  // Generic fallback for unknown headers
  if (lower.startsWith("x-")) return `Custom extension header set by the server or application`;
  return `Non-standard or application-specific header with value: ${value.substring(0, 80)}${value.length > 80 ? "..." : ""}`;
}

function parseHeaders(raw: string): ParsedHeader[] {
  const headers: ParsedHeader[] = [];
  const lines = raw.split("\n");

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Skip HTTP status line (e.g. "HTTP/1.1 200 OK")
    if (/^HTTP\/[\d.]+\s+\d+/.test(trimmed)) continue;

    const colonIndex = trimmed.indexOf(":");
    if (colonIndex === -1) continue;

    const name = trimmed.substring(0, colonIndex).trim();
    const value = trimmed.substring(colonIndex + 1).trim();

    if (!name) continue;

    const category = categorizeHeader(name);
    const explanation = getExplanation(name, value);

    headers.push({ name, value, category, explanation });
  }

  return headers;
}

const SAMPLE_HEADERS = `HTTP/2 200 OK
Content-Type: text/html; charset=utf-8
Content-Length: 45320
Content-Encoding: br
Cache-Control: public, max-age=3600, s-maxage=86400
ETag: "a1b2c3d4e5f6"
Vary: Accept-Encoding
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
Access-Control-Allow-Origin: https://example.com
Access-Control-Allow-Methods: GET, POST, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
Server: nginx/1.24.0
Date: Sat, 29 Mar 2026 10:00:00 GMT
X-Request-Id: req_abc123def456
Set-Cookie: session=abc123; Path=/; HttpOnly; Secure; SameSite=Strict
X-Powered-By: Next.js`;

export default function HttpHeadersAnalyzerPage() {
  const [input, setInput] = useState("");
  const [copiedState, setCopiedState] = useState<"curl" | "json" | null>(null);

  const headers = useMemo(() => parseHeaders(input), [input]);

  const securityAudit = useMemo(() => {
    if (headers.length === 0) return null;

    const presentNames = new Set(headers.map((h) => h.name.toLowerCase()));
    const results = Object.entries(SECURITY_HEADERS).map(([key, info]) => ({
      key,
      ...info,
      present: presentNames.has(key),
    }));

    const present = results.filter((r) => r.present).length;
    const total = results.length;
    const score = Math.round((present / total) * 100);

    return { results, score, present, total };
  }, [headers]);

  const categoryCounts = useMemo(() => {
    const counts: Record<HeaderCategory, number> = {
      Security: 0, Caching: 0, CORS: 0, Content: 0, Custom: 0,
    };
    for (const h of headers) counts[h.category]++;
    return counts;
  }, [headers]);

  const copyAsCurl = useCallback(async () => {
    if (headers.length === 0) return;
    const parts = headers.map((h) => `-H '${h.name}: ${h.value}'`);
    const cmd = `curl ${parts.join(" \\\n  ")} \\\n  'https://example.com'`;
    await navigator.clipboard.writeText(cmd);
    setCopiedState("curl");
    setTimeout(() => setCopiedState(null), 2000);
  }, [headers]);

  const copyAsJson = useCallback(async () => {
    if (headers.length === 0) return;
    const obj: Record<string, string> = {};
    for (const h of headers) obj[h.name] = h.value;
    await navigator.clipboard.writeText(JSON.stringify(obj, null, 2));
    setCopiedState("json");
    setTimeout(() => setCopiedState(null), 2000);
  }, [headers]);

  const loadSample = useCallback(() => {
    setInput(SAMPLE_HEADERS);
  }, []);

  const clearAll = useCallback(() => {
    setInput("");
  }, []);

  return (
    <>
      <title>HTTP Headers Analyzer — Parse, Audit & Explain HTTP Headers | devtools.page</title>
      <meta
        name="description"
        content="Paste raw HTTP headers to instantly parse, categorize, and audit them. Get plain-English explanations, security header scoring, and export as curl or JSON. Free, runs in your browser."
      />
      <JsonLd
        data={[
          generateWebAppSchema({
            slug: "http-headers-analyzer",
            name: "HTTP Headers Analyzer",
            description: "Parse, categorize, and audit HTTP headers with plain-English explanations and security scoring",
            category: "developer",
          }),
          generateBreadcrumbSchema({
            slug: "http-headers-analyzer",
            name: "HTTP Headers Analyzer",
            description: "Parse, categorize, and audit HTTP headers with plain-English explanations and security scoring",
            category: "developer",
          }),
          generateFAQSchema([
            {
              question: "What does the HTTP Headers Analyzer do?",
              answer: "It parses raw HTTP headers (from browser DevTools, curl, or any HTTP client), categorizes each header (Security, Caching, CORS, Content, or Custom), provides a plain-English explanation of what each header does, and audits your security headers with a completeness score.",
            },
            {
              question: "Which security headers does it check for?",
              answer: "The tool checks for six critical security headers: Strict-Transport-Security (HSTS), Content-Security-Policy (CSP), X-Frame-Options, X-Content-Type-Options, Referrer-Policy, and Permissions-Policy. Missing any of these may leave your site vulnerable to common web attacks.",
            },
            {
              question: "Is my header data safe?",
              answer: "Yes. All parsing and analysis happens entirely in your browser using JavaScript. No data is sent to any server. However, avoid pasting headers that contain sensitive tokens or credentials.",
            },
            {
              question: "How do I get HTTP headers to paste?",
              answer: "In Chrome/Edge DevTools: open Network tab, click any request, and copy the Response Headers. With curl: use 'curl -I https://example.com' to see headers. In Firefox: Network tab → Headers panel. You can also use tools like httpie or Postman.",
            },
          ]),
        ]}
      />

      <div className="min-h-screen bg-slate-900 text-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <ToolBreadcrumb slug="http-headers-analyzer" />

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
              HTTP Headers Analyzer
            </h1>
            <p className="text-slate-400 max-w-2xl text-lg">
              Paste raw HTTP headers from browser DevTools or curl to instantly
              parse, categorize, and audit them. Get plain-English explanations
              and a security completeness score. All processing happens in your
              browser.
            </p>
          </div>

          {/* Controls */}
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <button
              onClick={loadSample}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              Sample Headers
            </button>
            <button
              onClick={copyAsCurl}
              disabled={headers.length === 0}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {copiedState === "curl" ? "Copied!" : "Copy as curl"}
            </button>
            <button
              onClick={copyAsJson}
              disabled={headers.length === 0}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {copiedState === "json" ? "Copied!" : "Copy as JSON"}
            </button>
            <button
              onClick={clearAll}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors"
            >
              Clear
            </button>

            {/* Security score badge */}
            {securityAudit && (
              <div className="ml-auto flex items-center gap-2">
                <span
                  className={`inline-block w-3 h-3 rounded-full ${
                    securityAudit.score >= 80
                      ? "bg-green-500"
                      : securityAudit.score >= 50
                        ? "bg-amber-500"
                        : "bg-red-500"
                  }`}
                />
                <span
                  className={`text-sm font-medium ${
                    securityAudit.score >= 80
                      ? "text-green-400"
                      : securityAudit.score >= 50
                        ? "text-amber-400"
                        : "text-red-400"
                  }`}
                >
                  Security: {securityAudit.score}% ({securityAudit.present}/{securityAudit.total})
                </span>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="mb-6">
            <label className="text-sm font-medium text-slate-300 mb-2 block">
              Raw HTTP Headers
            </label>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={`Paste raw HTTP headers here, e.g.:\n\nHTTP/2 200 OK\nContent-Type: text/html; charset=utf-8\nCache-Control: public, max-age=3600\nStrict-Transport-Security: max-age=31536000`}
              className="w-full h-48 bg-slate-800 border border-slate-600 rounded-lg p-4 font-mono text-sm text-slate-200 placeholder-slate-500 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              spellCheck={false}
            />
          </div>

          {/* Category summary pills */}
          {headers.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {(Object.entries(categoryCounts) as [HeaderCategory, number][])
                .filter(([, count]) => count > 0)
                .map(([cat, count]) => (
                  <span
                    key={cat}
                    className={`px-3 py-1 rounded-full text-xs font-medium ${CATEGORY_COLORS[cat].bg} ${CATEGORY_COLORS[cat].text}`}
                  >
                    {cat}: {count}
                  </span>
                ))}
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-slate-700 text-slate-300">
                Total: {headers.length}
              </span>
            </div>
          )}

          {/* Parsed Headers Table */}
          {headers.length > 0 && (
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-white mb-3">
                Parsed Headers
              </h2>
              <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-700 text-slate-400">
                      <th className="text-left px-4 py-2 font-medium w-48">Header</th>
                      <th className="text-left px-4 py-2 font-medium w-24">Category</th>
                      <th className="text-left px-4 py-2 font-medium">Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {headers.map((h, i) => (
                      <tr
                        key={`${h.name}-${i}`}
                        className="border-b border-slate-700/50 hover:bg-slate-700/30"
                      >
                        <td className="px-4 py-3 align-top">
                          <span className="font-mono text-blue-400 font-medium">
                            {h.name}
                          </span>
                        </td>
                        <td className="px-4 py-3 align-top">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${CATEGORY_COLORS[h.category].bg} ${CATEGORY_COLORS[h.category].text}`}
                          >
                            {h.category}
                          </span>
                        </td>
                        <td className="px-4 py-3 align-top">
                          <div className="font-mono text-slate-200 break-all text-xs">
                            {h.value}
                          </div>
                          <div className="text-slate-400 text-xs mt-1">
                            {h.explanation}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Security Audit */}
          {securityAudit && (
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-white mb-3">
                Security Header Audit
              </h2>
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
                {/* Score bar */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-slate-300">
                      Security Completeness
                    </span>
                    <span
                      className={`text-2xl font-bold ${
                        securityAudit.score >= 80
                          ? "text-green-400"
                          : securityAudit.score >= 50
                            ? "text-amber-400"
                            : "text-red-400"
                      }`}
                    >
                      {securityAudit.score}%
                    </span>
                  </div>
                  <div className="w-full h-3 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        securityAudit.score >= 80
                          ? "bg-green-500"
                          : securityAudit.score >= 50
                            ? "bg-amber-500"
                            : "bg-red-500"
                      }`}
                      style={{ width: `${securityAudit.score}%` }}
                    />
                  </div>
                </div>

                {/* Checklist */}
                <div className="space-y-3">
                  {securityAudit.results.map((r) => (
                    <div
                      key={r.key}
                      className={`flex items-start gap-3 p-3 rounded-lg ${
                        r.present ? "bg-green-900/20" : "bg-red-900/20"
                      }`}
                    >
                      <span className="text-lg mt-0.5">
                        {r.present ? (
                          <span className="text-green-400">&#10003;</span>
                        ) : (
                          <span className="text-red-400">&#10007;</span>
                        )}
                      </span>
                      <div>
                        <div
                          className={`font-medium text-sm ${
                            r.present ? "text-green-300" : "text-red-300"
                          }`}
                        >
                          {r.name}
                        </div>
                        <div className="text-slate-400 text-xs mt-0.5">
                          {r.description}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <RelatedTools currentSlug="http-headers-analyzer" />

          {/* FAQ Section */}
          <section className="mt-16 border-t border-slate-700 pt-10">
            <h2 className="text-2xl font-bold text-white mb-6">
              Frequently Asked Questions
            </h2>

            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  What does the HTTP Headers Analyzer do?
                </h3>
                <p className="text-slate-400">
                  It parses raw HTTP headers (from browser DevTools, curl, or
                  any HTTP client), categorizes each header (Security, Caching,
                  CORS, Content, or Custom), provides a plain-English
                  explanation of what each header does, and audits your security
                  headers with a completeness score.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Which security headers does it check for?
                </h3>
                <p className="text-slate-400">
                  The tool checks for six critical security headers:
                  Strict-Transport-Security (HSTS), Content-Security-Policy
                  (CSP), X-Frame-Options, X-Content-Type-Options,
                  Referrer-Policy, and Permissions-Policy. Missing any of these
                  may leave your site vulnerable to common web attacks.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Is my header data safe?
                </h3>
                <p className="text-slate-400">
                  Yes. All parsing and analysis happens entirely in your browser
                  using JavaScript. No data is sent to any server. However,
                  avoid pasting headers that contain sensitive tokens or
                  credentials.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  How do I get HTTP headers to paste?
                </h3>
                <p className="text-slate-400">
                  In Chrome/Edge DevTools: open the Network tab, click any
                  request, and copy the Response Headers. With curl: use{" "}
                  <code className="bg-slate-800 px-1 rounded">
                    curl -I https://example.com
                  </code>{" "}
                  to see headers. In Firefox: Network tab → Headers panel. You
                  can also use tools like httpie or Postman.
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
