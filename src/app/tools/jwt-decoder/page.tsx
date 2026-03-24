"use client";

import { useState, useMemo, useCallback } from "react";
import JsonLd from "@/components/JsonLd";
import RelatedTools from "@/components/RelatedTools";
import {
  generateFAQSchema,
  generateWebAppSchema,
  generateBreadcrumbSchema,
} from "@/lib/jsonld";

interface DecodedJWT {
  header: Record<string, unknown>;
  payload: Record<string, unknown>;
  signature: string;
}

export default function JwtDecoderPage() {
  const [token, setToken] = useState("");
  const [copied, setCopied] = useState<"header" | "payload" | "full" | null>(
    null
  );

  const decodeBase64Url = (str: string): string => {
    let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
    while (base64.length % 4 !== 0) {
      base64 += "=";
    }
    try {
      return atob(base64);
    } catch {
      throw new Error("Invalid Base64URL encoding");
    }
  };

  const { decoded, error, parts } = useMemo(() => {
    if (!token.trim()) {
      return { decoded: null, error: null, parts: null };
    }

    const segments = token.trim().split(".");
    if (segments.length !== 3) {
      return {
        decoded: null,
        error: `JWT must have 3 parts separated by dots. Found ${segments.length} part${segments.length !== 1 ? "s" : ""}.`,
        parts: null,
      };
    }

    try {
      const headerStr = decodeBase64Url(segments[0]);
      const payloadStr = decodeBase64Url(segments[1]);

      let header: Record<string, unknown>;
      let payload: Record<string, unknown>;

      try {
        header = JSON.parse(headerStr);
      } catch {
        return {
          decoded: null,
          error: "Header is not valid JSON",
          parts: null,
        };
      }

      try {
        payload = JSON.parse(payloadStr);
      } catch {
        return {
          decoded: null,
          error: "Payload is not valid JSON",
          parts: null,
        };
      }

      const result: DecodedJWT = {
        header,
        payload,
        signature: segments[2],
      };

      return { decoded: result, error: null, parts: segments };
    } catch (e: unknown) {
      return {
        decoded: null,
        error: e instanceof Error ? e.message : "Failed to decode JWT",
        parts: null,
      };
    }
  }, [token]);

  const formatTimestamp = (value: unknown): string | null => {
    if (typeof value !== "number") return null;
    // JWT timestamps are in seconds
    if (value > 1e12) return null; // Not a unix timestamp
    try {
      const date = new Date(value * 1000);
      if (isNaN(date.getTime())) return null;
      return date.toISOString().replace("T", " ").replace(".000Z", " UTC");
    } catch {
      return null;
    }
  };

  const getTokenStatus = useMemo(() => {
    if (!decoded) return null;
    const exp = decoded.payload.exp;
    if (typeof exp !== "number") return null;
    const now = Math.floor(Date.now() / 1000);
    if (exp < now) {
      const ago = now - exp;
      const days = Math.floor(ago / 86400);
      const hours = Math.floor((ago % 86400) / 3600);
      const mins = Math.floor((ago % 3600) / 60);
      let timeStr = "";
      if (days > 0) timeStr += `${days}d `;
      if (hours > 0) timeStr += `${hours}h `;
      timeStr += `${mins}m ago`;
      return { expired: true, text: `Expired ${timeStr}` };
    } else {
      const remaining = exp - now;
      const days = Math.floor(remaining / 86400);
      const hours = Math.floor((remaining % 86400) / 3600);
      const mins = Math.floor((remaining % 3600) / 60);
      let timeStr = "";
      if (days > 0) timeStr += `${days}d `;
      if (hours > 0) timeStr += `${hours}h `;
      timeStr += `${mins}m`;
      return { expired: false, text: `Expires in ${timeStr}` };
    }
  }, [decoded]);

  const knownClaims: Record<string, string> = {
    iss: "Issuer",
    sub: "Subject",
    aud: "Audience",
    exp: "Expiration Time",
    nbf: "Not Before",
    iat: "Issued At",
    jti: "JWT ID",
    name: "Full Name",
    email: "Email",
    role: "Role",
    roles: "Roles",
    scope: "Scope",
    permissions: "Permissions",
    azp: "Authorized Party",
    nonce: "Nonce",
    at_hash: "Access Token Hash",
    c_hash: "Code Hash",
  };

  const copyJson = useCallback(
    async (which: "header" | "payload" | "full") => {
      if (!decoded) return;
      let text: string;
      if (which === "header") {
        text = JSON.stringify(decoded.header, null, 2);
      } else if (which === "payload") {
        text = JSON.stringify(decoded.payload, null, 2);
      } else {
        text = JSON.stringify(
          { header: decoded.header, payload: decoded.payload },
          null,
          2
        );
      }
      try {
        await navigator.clipboard.writeText(text);
      } catch {
        // Fallback for non-secure contexts or unfocused pages
        try {
          const textarea = document.createElement("textarea");
          textarea.value = text;
          textarea.style.position = "fixed";
          textarea.style.opacity = "0";
          document.body.appendChild(textarea);
          textarea.select();
          document.execCommand("copy");
          document.body.removeChild(textarea);
        } catch {
          // Both methods failed — silently ignore
          return;
        }
      }
      setCopied(which);
      setTimeout(() => setCopied(null), 2000);
    },
    [decoded]
  );

  const clearAll = useCallback(() => {
    setToken("");
  }, []);

  const loadExample = useCallback(() => {
    // Example JWT with common claims (not a real secret)
    const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }))
      .replace(/=/g, "")
      .replace(/\+/g, "-")
      .replace(/\//g, "_");
    const now = Math.floor(Date.now() / 1000);
    const payload = btoa(
      JSON.stringify({
        sub: "1234567890",
        name: "John Doe",
        email: "john@example.com",
        role: "admin",
        iat: now,
        exp: now + 3600,
        iss: "https://auth.example.com",
      })
    )
      .replace(/=/g, "")
      .replace(/\+/g, "-")
      .replace(/\//g, "_");
    const sig = "SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";
    setToken(`${header}.${payload}.${sig}`);
  }, []);

  return (
    <>
      <title>JWT Decoder - Free Online JSON Web Token Tool | DevTools Hub</title>
      <meta
        name="description"
        content="Decode and inspect JSON Web Tokens (JWT) online for free. View header, payload claims, expiration status, and timestamps. No data sent to any server."
      />
      <JsonLd
        data={[
          generateWebAppSchema({
            slug: "jwt-decoder",
            name: "JWT Decoder",
            description: "Decode and inspect JSON Web Tokens — view header, payload claims, expiration status, and signature",
            category: "developer",
          }),
          generateBreadcrumbSchema({
            slug: "jwt-decoder",
            name: "JWT Decoder",
            description: "Decode and inspect JSON Web Tokens — view header, payload claims, expiration status, and signature",
            category: "developer",
          }),
          generateFAQSchema([
            { question: "What is a JSON Web Token (JWT)?", answer: "A JWT is a compact, URL-safe token format used for securely transmitting information between parties as a JSON object. It consists of three parts: a header (algorithm and type), a payload (claims/data), and a signature. JWTs are commonly used for authentication and authorization in web applications." },
            { question: "Can this tool verify JWT signatures?", answer: "No. This tool decodes and inspects the contents of a JWT but does not verify its signature. Signature verification requires the signing secret or public key, which should only be handled server-side. Never paste production tokens with sensitive data into online tools." },
            { question: "What do the standard claims mean?", answer: "iss (issuer) identifies who created the token. sub (subject) identifies the user. exp (expiration) is when the token expires. iat (issued at) is when it was created. aud (audience) specifies the intended recipient. These are registered claims defined in RFC 7519." },
            { question: "Is my token data safe?", answer: "Yes. All decoding happens entirely in your browser using JavaScript. No data is sent to any server. However, as a best practice, avoid pasting production tokens containing sensitive information into any online tool." },
          ]),
        ]}
      />

      <div className="min-h-screen bg-slate-900 text-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Breadcrumb */}
          <nav className="text-sm text-slate-400 mb-6" aria-label="Breadcrumb">
            <ol className="flex items-center gap-2">
              <li>
                <a href="/" className="hover:text-white transition-colors">
                  Home
                </a>
              </li>
              <li>
                <span className="mx-1">/</span>
              </li>
              <li>
                <a href="/tools" className="hover:text-white transition-colors">
                  Developer Tools
                </a>
              </li>
              <li>
                <span className="mx-1">/</span>
              </li>
              <li className="text-slate-200">JWT Decoder</li>
            </ol>
          </nav>

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
              JWT Decoder
            </h1>
            <p className="text-slate-400 max-w-2xl text-lg">
              Paste a JSON Web Token to instantly decode and inspect its header,
              payload claims, expiration status, and signature. All processing
              happens in your browser — no data is sent to any server.
            </p>
          </div>

          {/* Controls */}
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <button
              onClick={loadExample}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              Load Example
            </button>
            <button
              onClick={() => copyJson("full")}
              disabled={!decoded}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {copied === "full" ? "Copied!" : "Copy Decoded"}
            </button>
            <button
              onClick={clearAll}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors"
            >
              Clear
            </button>

            {/* Token status */}
            {getTokenStatus && (
              <div className="ml-auto flex items-center gap-2">
                <span
                  className={`inline-block w-3 h-3 rounded-full ${
                    getTokenStatus.expired ? "bg-red-500" : "bg-green-500"
                  }`}
                />
                <span
                  className={`text-sm font-medium ${
                    getTokenStatus.expired ? "text-red-400" : "text-green-400"
                  }`}
                >
                  {getTokenStatus.text}
                </span>
              </div>
            )}
          </div>

          {/* Token Input */}
          <div className="mb-6">
            <label className="text-sm font-medium text-slate-300 mb-2 block">
              JWT Token
            </label>
            <textarea
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Paste your JWT token here (eyJhbGciOiJIUz...)..."
              className={`w-full h-32 bg-slate-800 border rounded-lg p-4 font-mono text-sm text-slate-200 placeholder-slate-500 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                error ? "border-red-600" : "border-slate-600"
              }`}
              spellCheck={false}
            />
            {/* Color-coded parts preview */}
            {parts && (
              <div className="mt-2 p-3 bg-slate-800 border border-slate-700 rounded-lg font-mono text-xs break-all">
                <span className="text-red-400">{parts[0]}</span>
                <span className="text-slate-500">.</span>
                <span className="text-purple-400">{parts[1]}</span>
                <span className="text-slate-500">.</span>
                <span className="text-blue-400">{parts[2]}</span>
              </div>
            )}
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-6 p-3 bg-red-900/40 border border-red-700 rounded-lg text-red-300 text-sm font-mono">
              <span className="font-bold">Error:</span> {error}
            </div>
          )}

          {/* Decoded Output */}
          {decoded && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Header */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-lg font-semibold text-red-400">
                    Header
                  </h2>
                  <button
                    onClick={() => copyJson("header")}
                    className="text-xs text-slate-400 hover:text-white transition-colors"
                  >
                    {copied === "header" ? "Copied!" : "Copy"}
                  </button>
                </div>
                <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 font-mono text-sm">
                  <pre className="text-red-300 whitespace-pre-wrap">
                    {JSON.stringify(decoded.header, null, 2)}
                  </pre>
                </div>
              </div>

              {/* Payload */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-lg font-semibold text-purple-400">
                    Payload
                  </h2>
                  <button
                    onClick={() => copyJson("payload")}
                    className="text-xs text-slate-400 hover:text-white transition-colors"
                  >
                    {copied === "payload" ? "Copied!" : "Copy"}
                  </button>
                </div>
                <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 font-mono text-sm">
                  <pre className="text-purple-300 whitespace-pre-wrap">
                    {JSON.stringify(decoded.payload, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          )}

          {/* Claims Table */}
          {decoded && Object.keys(decoded.payload).length > 0 && (
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-white mb-3">
                Payload Claims
              </h2>
              <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-700 text-slate-400">
                      <th className="text-left px-4 py-2 font-medium">
                        Claim
                      </th>
                      <th className="text-left px-4 py-2 font-medium">
                        Description
                      </th>
                      <th className="text-left px-4 py-2 font-medium">
                        Value
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(decoded.payload).map(([key, value]) => {
                      const timestamp = formatTimestamp(value);
                      return (
                        <tr
                          key={key}
                          className="border-b border-slate-700/50 hover:bg-slate-700/30"
                        >
                          <td className="px-4 py-2 font-mono text-blue-400">
                            {key}
                          </td>
                          <td className="px-4 py-2 text-slate-400">
                            {knownClaims[key] || "Custom claim"}
                          </td>
                          <td className="px-4 py-2 font-mono text-slate-200">
                            {typeof value === "object"
                              ? JSON.stringify(value)
                              : String(value)}
                            {timestamp && (
                              <span className="ml-2 text-xs text-slate-500">
                                ({timestamp})
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Signature */}
          {decoded && (
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-blue-400 mb-2">
                Signature
              </h2>
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
                <p className="font-mono text-sm text-blue-300 break-all">
                  {decoded.signature}
                </p>
                <p className="text-xs text-slate-500 mt-2">
                  Algorithm: {String(decoded.header.alg || "Unknown")} — Note:
                  This tool decodes but does not verify signatures. Use a
                  server-side library to validate token authenticity.
                </p>
              </div>
            </div>
          )}

          <RelatedTools currentSlug="jwt-decoder" />

          {/* FAQ Section */}
          <section className="mt-16 border-t border-slate-700 pt-10">
            <h2 className="text-2xl font-bold text-white mb-6">
              Frequently Asked Questions
            </h2>

            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  What is a JSON Web Token (JWT)?
                </h3>
                <p className="text-slate-400">
                  A JWT is a compact, URL-safe token format used for securely
                  transmitting information between parties as a JSON object. It
                  consists of three parts: a header (algorithm and type), a
                  payload (claims/data), and a signature. JWTs are commonly used
                  for authentication and authorization in web applications.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Can this tool verify JWT signatures?
                </h3>
                <p className="text-slate-400">
                  No. This tool decodes and inspects the contents of a JWT but
                  does not verify its signature. Signature verification requires
                  the signing secret or public key, which should only be handled
                  server-side. Never paste production tokens with sensitive data
                  into online tools.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  What do the standard claims mean?
                </h3>
                <p className="text-slate-400">
                  <strong>iss</strong> (issuer) identifies who created the token.{" "}
                  <strong>sub</strong> (subject) identifies the user.{" "}
                  <strong>exp</strong> (expiration) is when the token expires.{" "}
                  <strong>iat</strong> (issued at) is when it was created.{" "}
                  <strong>aud</strong> (audience) specifies the intended
                  recipient. These are registered claims defined in RFC 7519.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Is my token data safe?
                </h3>
                <p className="text-slate-400">
                  Yes. All decoding happens entirely in your browser using
                  JavaScript. No data is sent to any server. However, as a best
                  practice, avoid pasting production tokens containing sensitive
                  information into any online tool.
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
