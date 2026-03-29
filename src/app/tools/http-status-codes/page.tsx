"use client";

import { useState, useMemo } from "react";
import JsonLd from "@/components/JsonLd";
import RelatedTools from "@/components/RelatedTools";
import ToolBreadcrumb from "@/components/ToolBreadcrumb";
import {
  generateFAQSchema,
  generateWebAppSchema,
  generateBreadcrumbSchema,
} from "@/lib/jsonld";

type CategoryKey = "all" | "1xx" | "2xx" | "3xx" | "4xx" | "5xx";

interface StatusCode {
  code: number;
  name: string;
  description: string;
  useCases: string[];
  category: CategoryKey;
}

const CATEGORIES: { key: CategoryKey; label: string; color: string }[] = [
  { key: "all", label: "All", color: "bg-slate-600" },
  { key: "1xx", label: "1xx Informational", color: "bg-blue-600" },
  { key: "2xx", label: "2xx Success", color: "bg-green-600" },
  { key: "3xx", label: "3xx Redirection", color: "bg-yellow-600" },
  { key: "4xx", label: "4xx Client Error", color: "bg-orange-600" },
  { key: "5xx", label: "5xx Server Error", color: "bg-red-600" },
];

const CATEGORY_COLORS: Record<string, string> = {
  "1xx": "border-blue-500/40 bg-blue-500/5",
  "2xx": "border-green-500/40 bg-green-500/5",
  "3xx": "border-yellow-500/40 bg-yellow-500/5",
  "4xx": "border-orange-500/40 bg-orange-500/5",
  "5xx": "border-red-500/40 bg-red-500/5",
};

const BADGE_COLORS: Record<string, string> = {
  "1xx": "bg-blue-500/20 text-blue-300",
  "2xx": "bg-green-500/20 text-green-300",
  "3xx": "bg-yellow-500/20 text-yellow-300",
  "4xx": "bg-orange-500/20 text-orange-300",
  "5xx": "bg-red-500/20 text-red-300",
};

const STATUS_CODES: StatusCode[] = [
  // 1xx Informational
  { code: 100, name: "Continue", category: "1xx", description: "The server has received the request headers and the client should proceed to send the request body.", useCases: ["Large file uploads where the server confirms it will accept the request before the client sends the body", "HTTP/1.1 clients sending Expect: 100-continue header"] },
  { code: 101, name: "Switching Protocols", category: "1xx", description: "The server is switching to a different protocol as requested by the client via the Upgrade header.", useCases: ["Upgrading from HTTP to WebSocket connections", "Protocol negotiation in real-time applications"] },
  { code: 102, name: "Processing", category: "1xx", description: "The server has received and is processing the request, but no response is available yet. Prevents the client from timing out.", useCases: ["WebDAV operations that take a long time to process", "Preventing client timeout on slow server operations"] },
  { code: 103, name: "Early Hints", category: "1xx", description: "Used to return some response headers before the final HTTP message, allowing the browser to start preloading resources.", useCases: ["Preloading CSS, fonts, and JavaScript while the server prepares the full response", "Improving page load performance with Link headers"] },

  // 2xx Success
  { code: 200, name: "OK", category: "2xx", description: "The request has succeeded. The meaning depends on the HTTP method: GET returns the resource, POST returns the result of the action.", useCases: ["Successful GET request returning data", "Successful form submission or API call", "Standard successful response for most operations"] },
  { code: 201, name: "Created", category: "2xx", description: "The request has been fulfilled and a new resource has been created. Typically returned after POST or PUT requests.", useCases: ["Creating a new user account", "Adding a new item to a database via REST API", "File upload completed successfully"] },
  { code: 202, name: "Accepted", category: "2xx", description: "The request has been accepted for processing, but the processing has not been completed. The request might or might not eventually be acted upon.", useCases: ["Queueing a background job (email sending, report generation)", "Asynchronous API operations that return immediately", "Batch processing requests"] },
  { code: 203, name: "Non-Authoritative Information", category: "2xx", description: "The returned metadata is not exactly the same as available from the origin server, but collected from a local or third-party copy.", useCases: ["Proxy servers returning modified headers", "CDN responses with transformed metadata", "Caching intermediaries providing slightly modified responses"] },
  { code: 204, name: "No Content", category: "2xx", description: "The server has successfully fulfilled the request and there is no additional content to return in the response body.", useCases: ["Successful DELETE request with nothing to return", "Saving preferences or settings where no response body is needed", "Successful PUT/PATCH with no need to return the updated resource"] },
  { code: 205, name: "Reset Content", category: "2xx", description: "The server has fulfilled the request and the client should reset the document view (e.g., clear a form).", useCases: ["After submitting a form, telling the browser to clear form fields", "Resetting a document editor after saving"] },
  { code: 206, name: "Partial Content", category: "2xx", description: "The server is delivering only part of the resource due to a Range header sent by the client.", useCases: ["Video streaming — serving chunks of a large video file", "Resuming interrupted file downloads", "PDF viewers loading specific page ranges"] },
  { code: 207, name: "Multi-Status", category: "2xx", description: "Provides status for multiple independent operations in a single response (WebDAV).", useCases: ["WebDAV batch operations on multiple files", "Bulk API operations where each item has its own status"] },
  { code: 208, name: "Already Reported", category: "2xx", description: "Used inside a DAV: propstat response to avoid enumerating internal members of multiple bindings to the same collection repeatedly.", useCases: ["WebDAV collection operations to reduce redundant data", "Avoiding duplicate entries in multi-status responses"] },
  { code: 226, name: "IM Used", category: "2xx", description: "The server has fulfilled a GET request for the resource, and the response is a representation of the result of one or more instance-manipulations.", useCases: ["Delta encoding — sending only changes since last request", "Bandwidth optimization for frequently updated resources"] },

  // 3xx Redirection
  { code: 300, name: "Multiple Choices", category: "3xx", description: "The request has more than one possible response. The user or user agent should choose one of them.", useCases: ["Content negotiation — resource available in multiple formats (HTML, JSON, XML)", "Language-specific versions of a page"] },
  { code: 301, name: "Moved Permanently", category: "3xx", description: "The resource has been permanently moved to a new URL. All future requests should use the new URL. Search engines transfer link equity.", useCases: ["Domain migration (old-domain.com → new-domain.com)", "Changing URL structure permanently", "SEO: consolidating duplicate pages under a canonical URL"] },
  { code: 302, name: "Found", category: "3xx", description: "The resource is temporarily located at a different URL. The client should continue to use the original URL for future requests.", useCases: ["Temporary maintenance page redirect", "A/B testing redirecting users to different page versions", "Redirecting after a form POST (though 303 is preferred)"] },
  { code: 303, name: "See Other", category: "3xx", description: "The response to the request can be found at another URL using a GET method. Often used after POST to redirect to a result page.", useCases: ["Post/Redirect/Get pattern — redirecting after form submission to prevent duplicate submissions", "Redirecting to a status page after initiating a long operation"] },
  { code: 304, name: "Not Modified", category: "3xx", description: "The resource has not been modified since the last request. The client can use the cached version, saving bandwidth.", useCases: ["Browser cache validation using If-Modified-Since or ETag headers", "API responses for unchanged data, reducing payload size", "CDN cache validation"] },
  { code: 307, name: "Temporary Redirect", category: "3xx", description: "The resource is temporarily at a different URL. Unlike 302, the request method must NOT be changed (POST stays POST).", useCases: ["HTTPS enforcement — redirecting HTTP to HTTPS temporarily", "Load balancing to a different server temporarily", "API versioning redirects that must preserve the HTTP method"] },
  { code: 308, name: "Permanent Redirect", category: "3xx", description: "The resource has permanently moved to a new URL. Like 301, but the HTTP method must NOT be changed.", useCases: ["Permanent URL change for API endpoints where method must be preserved", "Moving REST API to a new base URL without breaking POST/PUT/DELETE requests"] },

  // 4xx Client Error
  { code: 400, name: "Bad Request", category: "4xx", description: "The server cannot process the request due to malformed syntax, invalid request message framing, or deceptive request routing.", useCases: ["Invalid JSON in request body", "Missing required query parameters", "Malformed URL or headers"] },
  { code: 401, name: "Unauthorized", category: "4xx", description: "The request requires user authentication. The client must authenticate itself to get the requested response.", useCases: ["API request without an authentication token", "Expired JWT or session token", "Accessing a protected resource without logging in"] },
  { code: 402, name: "Payment Required", category: "4xx", description: "Reserved for future use. Originally intended for digital payment systems, now sometimes used for paywalled content.", useCases: ["SaaS API rate limit exceeded on free tier", "Paywall enforcement for premium content", "Subscription required to access a feature"] },
  { code: 403, name: "Forbidden", category: "4xx", description: "The server understood the request but refuses to authorize it. Unlike 401, re-authenticating will not help — the user simply lacks permission.", useCases: ["User is authenticated but lacks admin privileges", "IP address blocked by firewall rules", "Accessing another user's private resource"] },
  { code: 404, name: "Not Found", category: "4xx", description: "The server cannot find the requested resource. The URL is not recognised. This is the most common error on the web.", useCases: ["Broken links to deleted pages", "Typo in URL", "API endpoint that does not exist", "Resource deleted from database"] },
  { code: 405, name: "Method Not Allowed", category: "4xx", description: "The request HTTP method is not supported for the target resource. The response must include an Allow header listing valid methods.", useCases: ["Sending POST to an endpoint that only accepts GET", "Trying to DELETE a read-only resource", "API endpoint misconfiguration"] },
  { code: 406, name: "Not Acceptable", category: "4xx", description: "The server cannot produce a response matching the Accept headers sent by the client.", useCases: ["Requesting application/xml from an API that only returns JSON", "Content negotiation failure", "Unsupported media type in Accept header"] },
  { code: 407, name: "Proxy Authentication Required", category: "4xx", description: "Similar to 401, but the client must first authenticate with a proxy server.", useCases: ["Corporate proxy requiring credentials", "VPN gateway authentication", "Intermediate proxy servers requiring authentication"] },
  { code: 408, name: "Request Timeout", category: "4xx", description: "The server timed out waiting for the request. The client did not produce a request within the time the server was prepared to wait.", useCases: ["Slow client connection that takes too long to send data", "Idle connection cleanup by the server", "Upload timeout on large files over slow networks"] },
  { code: 409, name: "Conflict", category: "4xx", description: "The request conflicts with the current state of the server, such as an edit conflict between multiple simultaneous updates.", useCases: ["Trying to create a resource that already exists (duplicate username)", "Concurrent edit conflict on the same document", "Version mismatch in optimistic locking"] },
  { code: 410, name: "Gone", category: "4xx", description: "The resource is no longer available at the server and no forwarding address is known. Unlike 404, this is a permanent condition.", useCases: ["API endpoint permanently retired", "Content intentionally removed with no replacement", "SEO: telling search engines to de-index a URL permanently"] },
  { code: 411, name: "Length Required", category: "4xx", description: "The server refuses the request because the Content-Length header is missing.", useCases: ["POST request without Content-Length header", "Servers requiring explicit content length for security or resource allocation"] },
  { code: 412, name: "Precondition Failed", category: "4xx", description: "One or more conditions given in the request header fields evaluated to false when tested on the server.", useCases: ["If-Match header with a stale ETag (optimistic concurrency control)", "Conditional requests where the resource state has changed", "If-Unmodified-Since with a resource that was modified"] },
  { code: 413, name: "Content Too Large", category: "4xx", description: "The request body is larger than the server is willing or able to process.", useCases: ["File upload exceeding the server's maximum size limit", "API request with a payload that exceeds the configured limit", "nginx/Apache body size limits"] },
  { code: 414, name: "URI Too Long", category: "4xx", description: "The URI requested by the client is longer than the server is willing to interpret.", useCases: ["Extremely long query strings from misconfigured forms", "Accidental redirect loops appending query parameters", "GET request that should have been POST"] },
  { code: 415, name: "Unsupported Media Type", category: "4xx", description: "The media format of the requested data is not supported by the server, so the server rejects the request.", useCases: ["Sending XML to an endpoint that only accepts JSON", "Missing or incorrect Content-Type header", "Uploading an unsupported file format"] },
  { code: 416, name: "Range Not Satisfiable", category: "4xx", description: "The range specified in the Range header of the request cannot be fulfilled. The range may be outside the size of the target resource.", useCases: ["Requesting byte range beyond file size during download resume", "Invalid Range header in video streaming", "Corrupted download client sending impossible ranges"] },
  { code: 417, name: "Expectation Failed", category: "4xx", description: "The expectation given in the Expect header of the request could not be met by the server.", useCases: ["Server cannot meet Expect: 100-continue requirement", "Proxy server that does not support the Expect header"] },
  { code: 418, name: "I'm a Teapot", category: "4xx", description: "The server refuses the attempt to brew coffee with a teapot. Defined in RFC 2324 (Hyper Text Coffee Pot Control Protocol) as an April Fools' joke.", useCases: ["Easter egg responses in APIs", "Humorous error handling in development", "The most famous joke HTTP status code — still referenced in many frameworks"] },
  { code: 421, name: "Misdirected Request", category: "4xx", description: "The request was directed at a server that is not able to produce a response. Sent by a server that is not configured for the request URI's scheme and authority combination.", useCases: ["HTTP/2 connection coalescing issues", "TLS certificate mismatch when multiplexing connections", "CDN routing to wrong origin server"] },
  { code: 422, name: "Unprocessable Content", category: "4xx", description: "The server understands the content type and syntax of the request, but the contained instructions are semantically invalid.", useCases: ["Form validation errors — well-formed JSON but invalid field values", "API request with valid structure but impossible data (end date before start date)", "Database constraint violations"] },
  { code: 423, name: "Locked", category: "4xx", description: "The resource that is being accessed is locked (WebDAV).", useCases: ["WebDAV file locked for editing by another user", "Document management systems preventing concurrent edits"] },
  { code: 424, name: "Failed Dependency", category: "4xx", description: "The request failed because it depended on another request that also failed (WebDAV).", useCases: ["WebDAV batch operations where one step fails, invalidating subsequent steps", "Cascading failures in dependent operations"] },
  { code: 425, name: "Too Early", category: "4xx", description: "The server is unwilling to risk processing a request that might be replayed, to avoid potential replay attacks.", useCases: ["TLS 1.3 early data (0-RTT) requests that could be replayed", "Security-sensitive endpoints rejecting early data"] },
  { code: 426, name: "Upgrade Required", category: "4xx", description: "The server refuses to perform the request using the current protocol but might do so after the client upgrades to a different protocol.", useCases: ["Server requiring TLS (HTTPS) when client uses HTTP", "WebSocket upgrade required for real-time endpoints"] },
  { code: 428, name: "Precondition Required", category: "4xx", description: "The server requires the request to be conditional (e.g., include If-Match header) to prevent lost updates.", useCases: ["API requiring ETag-based concurrency control", "Preventing the 'lost update' problem in collaborative editing", "Server enforcing optimistic locking on PUT/PATCH requests"] },
  { code: 429, name: "Too Many Requests", category: "4xx", description: "The user has sent too many requests in a given amount of time (rate limiting). Retry-After header may indicate when to retry.", useCases: ["API rate limit exceeded", "DDoS protection triggered", "Login attempt throttling after too many failed tries", "Web scraping detection"] },
  { code: 431, name: "Request Header Fields Too Large", category: "4xx", description: "The server refuses the request because the header fields are too large, either individually or in total.", useCases: ["Excessively large cookies (cookie bloat)", "Too many or too large custom headers", "Accumulated authentication tokens exceeding limits"] },
  { code: 451, name: "Unavailable For Legal Reasons", category: "4xx", description: "The resource is unavailable due to legal demands — such as government censorship or court-ordered takedown. Named after Fahrenheit 451.", useCases: ["Content blocked due to GDPR or regional privacy laws", "Government censorship or court-ordered content removal", "DMCA takedown of copyrighted material"] },

  // 5xx Server Error
  { code: 500, name: "Internal Server Error", category: "5xx", description: "The server has encountered a situation it does not know how to handle. A generic catch-all server error.", useCases: ["Unhandled exception in application code", "Database connection failure", "Misconfigured server or missing dependencies", "Null pointer or runtime errors"] },
  { code: 501, name: "Not Implemented", category: "5xx", description: "The request method is not supported by the server and cannot be handled. Servers are required to support GET and HEAD.", useCases: ["Server does not support the PATCH method", "Unimplemented API endpoint stub", "Proxy server that doesn't support certain methods"] },
  { code: 502, name: "Bad Gateway", category: "5xx", description: "The server, while acting as a gateway or proxy, received an invalid response from the upstream server.", useCases: ["Reverse proxy (nginx) cannot reach the application server", "Upstream service crashed or is unreachable", "CDN unable to connect to origin server", "Microservice communication failure"] },
  { code: 503, name: "Service Unavailable", category: "5xx", description: "The server is not ready to handle the request. Common causes are maintenance downtime or server overload.", useCases: ["Planned maintenance window", "Server overloaded with too many connections", "Application still starting up / deploying", "Circuit breaker open in microservices architecture"] },
  { code: 504, name: "Gateway Timeout", category: "5xx", description: "The server, while acting as a gateway or proxy, did not get a response in time from the upstream server.", useCases: ["Slow database query causing upstream timeout", "Upstream service taking too long to respond", "Network issues between proxy and application server", "Long-running API request exceeding proxy timeout"] },
  { code: 505, name: "HTTP Version Not Supported", category: "5xx", description: "The HTTP version used in the request is not supported by the server.", useCases: ["Client using HTTP/3 on a server that only supports HTTP/1.1", "Legacy systems that don't support newer HTTP versions"] },
  { code: 506, name: "Variant Also Negotiates", category: "5xx", description: "The server has an internal configuration error: the chosen variant resource is itself configured to engage in content negotiation, creating a circular reference.", useCases: ["Misconfigured content negotiation on the server", "Circular reference in server's variant resources"] },
  { code: 507, name: "Insufficient Storage", category: "5xx", description: "The server is unable to store the representation needed to complete the request (WebDAV).", useCases: ["Server disk full during file upload", "WebDAV storage quota exceeded", "Cloud storage limit reached"] },
  { code: 508, name: "Loop Detected", category: "5xx", description: "The server detected an infinite loop while processing the request (WebDAV).", useCases: ["Circular references in WebDAV collections", "Infinite redirect loops detected server-side"] },
  { code: 510, name: "Not Extended", category: "5xx", description: "Further extensions to the request are required for the server to fulfill it.", useCases: ["Server requires additional HTTP extensions not present in the request", "Rarely used in practice"] },
  { code: 511, name: "Network Authentication Required", category: "5xx", description: "The client needs to authenticate to gain network access. Intended for use by intercepting proxies (captive portals).", useCases: ["Hotel, airport, or cafe Wi-Fi captive portal login page", "Corporate network requiring authentication before internet access"] },
];

export default function HttpStatusCodesPage() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<CategoryKey>("all");
  const [expandedCode, setExpandedCode] = useState<number | null>(null);

  const filtered = useMemo(() => {
    return STATUS_CODES.filter((sc) => {
      if (activeCategory !== "all" && sc.category !== activeCategory) return false;
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        sc.code.toString().includes(q) ||
        sc.name.toLowerCase().includes(q) ||
        sc.description.toLowerCase().includes(q)
      );
    });
  }, [search, activeCategory]);

  const counts = useMemo(() => {
    const map: Record<string, number> = { all: STATUS_CODES.length };
    for (const sc of STATUS_CODES) {
      map[sc.category] = (map[sc.category] || 0) + 1;
    }
    return map;
  }, []);

  return (
    <>
      <title>
        HTTP Status Codes Reference — Complete List with Descriptions | DevTools Hub
      </title>
      <meta
        name="description"
        content="Complete HTTP status codes reference. Search all HTTP response codes from 100 to 511 with descriptions, common use cases, and categories. Find what 404, 500, 301, 429 and every other status code means."
      />
      <meta
        name="keywords"
        content="http status codes, http 404 meaning, http response codes list, http error codes, 500 internal server error, 301 redirect, 403 forbidden, 429 too many requests, http status code reference"
      />
      <JsonLd
        data={[
          generateWebAppSchema({
            slug: "http-status-codes",
            name: "HTTP Status Codes Reference",
            description:
              "Complete HTTP status codes reference. Search all HTTP response codes from 100 to 511 with descriptions and common use cases.",
            category: "developer",
          }),
          generateBreadcrumbSchema({
            slug: "http-status-codes",
            name: "HTTP Status Codes Reference",
            description:
              "Complete HTTP status codes reference with descriptions and use cases.",
            category: "developer",
          }),
          generateFAQSchema([
            {
              question: "What are HTTP status codes?",
              answer:
                "HTTP status codes are three-digit numbers returned by a web server in response to a client request. They indicate whether the request was successful, redirected, resulted in a client error, or caused a server error. Status codes are grouped into five classes: 1xx (Informational), 2xx (Success), 3xx (Redirection), 4xx (Client Error), and 5xx (Server Error).",
            },
            {
              question: "What does HTTP 404 mean?",
              answer:
                "HTTP 404 (Not Found) means the server cannot find the requested resource. The URL is not recognised. This is the most common error on the web, typically caused by broken links, typos in URLs, or deleted pages.",
            },
            {
              question: "What is the difference between 401 and 403?",
              answer:
                "HTTP 401 (Unauthorized) means the request requires authentication — the client has not provided valid credentials. HTTP 403 (Forbidden) means the server understood the request but refuses to authorize it — the client is authenticated but lacks the necessary permissions. Re-authenticating will fix a 401 but not a 403.",
            },
            {
              question: "What does HTTP 500 Internal Server Error mean?",
              answer:
                "HTTP 500 is a generic catch-all error indicating the server encountered an unexpected condition that prevented it from fulfilling the request. Common causes include unhandled exceptions in application code, database connection failures, and misconfigured servers.",
            },
            {
              question: "When should I use 301 vs 302 redirect?",
              answer:
                "Use 301 (Moved Permanently) when a resource has permanently moved to a new URL — search engines will transfer link equity to the new URL. Use 302 (Found) for temporary redirects where the original URL will be valid again in the future, such as during maintenance. For POST requests, prefer 303 (See Other) or 307 (Temporary Redirect) to control whether the method changes.",
            },
            {
              question: "What does HTTP 429 Too Many Requests mean?",
              answer:
                "HTTP 429 means the user or client has sent too many requests in a given time period (rate limiting). The server may include a Retry-After header indicating how long to wait before making new requests. Common in APIs, DDoS protection, and login throttling.",
            },
          ]),
        ]}
      />

      <div className="min-h-screen bg-slate-900 text-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <ToolBreadcrumb slug="http-status-codes" />

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
              HTTP Status Codes Reference
            </h1>
            <p className="text-slate-400 max-w-2xl text-lg">
              Complete reference of all HTTP response status codes from 1xx to
              5xx. Search by code number or description, filter by category, and
              see common use cases for each status code.
            </p>
          </div>

          {/* Search */}
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 mb-6">
            <div className="relative">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by code (e.g. 404) or description (e.g. not found)..."
                className="w-full bg-slate-900 border border-slate-600 rounded-lg pl-10 pr-4 py-3 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                spellCheck={false}
              />
            </div>

            {/* Category Filters */}
            <div className="flex flex-wrap gap-2 mt-4">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.key}
                  onClick={() => setActiveCategory(cat.key)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    activeCategory === cat.key
                      ? `${cat.color} text-white`
                      : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                  }`}
                >
                  {cat.label}
                  <span className="ml-1.5 opacity-70">({counts[cat.key] || 0})</span>
                </button>
              ))}
            </div>
          </div>

          {/* Results count */}
          <p className="text-sm text-slate-500 mb-4">
            Showing {filtered.length} of {STATUS_CODES.length} status codes
          </p>

          {/* Status Code List */}
          <div className="space-y-3">
            {filtered.map((sc) => {
              const isExpanded = expandedCode === sc.code;
              return (
                <div
                  key={sc.code}
                  className={`border rounded-lg transition-colors ${CATEGORY_COLORS[sc.category]}`}
                >
                  <button
                    onClick={() =>
                      setExpandedCode(isExpanded ? null : sc.code)
                    }
                    className="w-full flex items-center gap-4 px-5 py-4 text-left"
                  >
                    <span className="text-2xl font-bold font-mono text-white shrink-0 w-16">
                      {sc.code}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-white">
                          {sc.name}
                        </span>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full ${BADGE_COLORS[sc.category]}`}
                        >
                          {sc.category === "1xx" && "Informational"}
                          {sc.category === "2xx" && "Success"}
                          {sc.category === "3xx" && "Redirection"}
                          {sc.category === "4xx" && "Client Error"}
                          {sc.category === "5xx" && "Server Error"}
                        </span>
                      </div>
                      <p className="text-sm text-slate-400 mt-1 line-clamp-1">
                        {sc.description}
                      </p>
                    </div>
                    <svg
                      className={`w-5 h-5 text-slate-500 shrink-0 transition-transform ${
                        isExpanded ? "rotate-180" : ""
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>

                  {isExpanded && (
                    <div className="px-5 pb-5 pt-0">
                      <div className="border-t border-slate-700/50 pt-4">
                        <p className="text-slate-300 mb-4">{sc.description}</p>
                        <div>
                          <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2">
                            Common Use Cases
                          </h4>
                          <ul className="space-y-1.5">
                            {sc.useCases.map((uc, i) => (
                              <li
                                key={i}
                                className="flex items-start gap-2 text-sm text-slate-300"
                              >
                                <span className="text-slate-600 mt-1 shrink-0">
                                  &bull;
                                </span>
                                {uc}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {filtered.length === 0 && (
              <div className="text-center py-12 text-slate-500">
                <p className="text-lg">No status codes match your search.</p>
                <p className="text-sm mt-1">
                  Try searching by code number (e.g. &quot;404&quot;) or keyword (e.g. &quot;not found&quot;).
                </p>
              </div>
            )}
          </div>

          <RelatedTools currentSlug="http-status-codes" />

          {/* FAQ Section */}
          <section className="mt-16 border-t border-slate-700 pt-10">
            <h2 className="text-2xl font-bold text-white mb-6">
              Frequently Asked Questions
            </h2>

            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  What are HTTP status codes?
                </h3>
                <p className="text-slate-400">
                  HTTP status codes are three-digit numbers returned by a web
                  server in response to a client request. They indicate whether
                  the request was successful, redirected, resulted in a client
                  error, or caused a server error. Status codes are grouped into
                  five classes: 1xx (Informational), 2xx (Success), 3xx
                  (Redirection), 4xx (Client Error), and 5xx (Server Error).
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  What does HTTP 404 mean?
                </h3>
                <p className="text-slate-400">
                  HTTP 404 (Not Found) means the server cannot find the
                  requested resource. The URL is not recognised. This is the most
                  common error on the web, typically caused by broken links,
                  typos in URLs, or deleted pages.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  What is the difference between 401 and 403?
                </h3>
                <p className="text-slate-400">
                  HTTP 401 (Unauthorized) means the request requires
                  authentication — the client has not provided valid credentials.
                  HTTP 403 (Forbidden) means the server understood the request
                  but refuses to authorize it — the client is authenticated but
                  lacks the necessary permissions. Re-authenticating will fix a
                  401 but not a 403.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  What does HTTP 500 Internal Server Error mean?
                </h3>
                <p className="text-slate-400">
                  HTTP 500 is a generic catch-all error indicating the server
                  encountered an unexpected condition that prevented it from
                  fulfilling the request. Common causes include unhandled
                  exceptions in application code, database connection failures,
                  and misconfigured servers.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  When should I use 301 vs 302 redirect?
                </h3>
                <p className="text-slate-400">
                  Use 301 (Moved Permanently) when a resource has permanently
                  moved to a new URL — search engines will transfer link equity
                  to the new URL. Use 302 (Found) for temporary redirects where
                  the original URL will be valid again in the future, such as
                  during maintenance. For POST requests, prefer 303 (See Other)
                  or 307 (Temporary Redirect) to control whether the method
                  changes.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  What does HTTP 429 Too Many Requests mean?
                </h3>
                <p className="text-slate-400">
                  HTTP 429 means the user or client has sent too many requests in
                  a given time period (rate limiting). The server may include a
                  Retry-After header indicating how long to wait before making
                  new requests. Common in APIs, DDoS protection, and login
                  throttling.
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
