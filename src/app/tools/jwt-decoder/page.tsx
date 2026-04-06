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

interface DecodedJWT {
  header: Record<string, unknown>;
  payload: Record<string, unknown>;
  signature: string;
}

type VerifyStatus = "idle" | "valid" | "invalid" | "error" | "unsupported";

function base64UrlEncode(str: string): string {
  return btoa(str)
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function decodeBase64Url(str: string): string {
  let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4 !== 0) {
    base64 += "=";
  }
  try {
    return atob(base64);
  } catch {
    throw new Error("Invalid Base64URL encoding");
  }
}

function base64UrlToArrayBuffer(base64url: string): ArrayBuffer {
  const base64 = base64url.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

function pemToArrayBuffer(pem: string): ArrayBuffer {
  const lines = pem
    .replace(/-----BEGIN [A-Z ]+-----/, "")
    .replace(/-----END [A-Z ]+-----/, "")
    .replace(/\s/g, "");
  const binary = atob(lines);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

async function verifyHS256(
  headerB64: string,
  payloadB64: string,
  signatureB64: string,
  secret: string
): Promise<boolean> {
  const encoder = new TextEncoder();
  const data = encoder.encode(`${headerB64}.${payloadB64}`);
  const keyData = encoder.encode(secret);
  const key = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, data);
  const bytes = new Uint8Array(sig);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const computed = btoa(binary)
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
  return computed === signatureB64;
}

async function verifyRS256(
  headerB64: string,
  payloadB64: string,
  signatureB64: string,
  publicKeyPem: string
): Promise<boolean> {
  const keyBuffer = pemToArrayBuffer(publicKeyPem);
  const key = await crypto.subtle.importKey(
    "spki",
    keyBuffer,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["verify"]
  );
  const encoder = new TextEncoder();
  const data = encoder.encode(`${headerB64}.${payloadB64}`);
  const sigBuffer = base64UrlToArrayBuffer(signatureB64);
  return crypto.subtle.verify("RSASSA-PKCS1-v1_5", key, sigBuffer, data);
}

export default function JwtDecoderPage() {
  const [token, setToken] = useState("");
  const [secret, setSecret] = useState("");
  const [verifyStatus, setVerifyStatus] = useState<VerifyStatus>("idle");
  const [verifyMsg, setVerifyMsg] = useState("");
  const [copied, setCopied] = useState<"header" | "payload" | "full" | null>(
    null
  );

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

  // Reset verify status when token or secret changes
  const handleTokenChange = useCallback((val: string) => {
    setToken(val);
    setVerifyStatus("idle");
    setVerifyMsg("");
  }, []);

  const handleSecretChange = useCallback((val: string) => {
    setSecret(val);
    setVerifyStatus("idle");
    setVerifyMsg("");
  }, []);

  const formatTimestamp = (value: unknown): string | null => {
    if (typeof value !== "number") return null;
    if (value > 1e12) return null;
    try {
      const date = new Date(value * 1000);
      if (isNaN(date.getTime())) return null;
      return date.toISOString().replace("T", " ").replace(".000Z", " UTC");
    } catch {
      return null;
    }
  };

  const tokenStatus = useMemo(() => {
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
    setSecret("");
    setVerifyStatus("idle");
    setVerifyMsg("");
  }, []);

  const generateSampleJWT = useCallback(async () => {
    const sampleSecret = "your-256-bit-secret";
    const header = base64UrlEncode(
      JSON.stringify({ alg: "HS256", typ: "JWT" })
    );
    const now = Math.floor(Date.now() / 1000);
    const payload = base64UrlEncode(
      JSON.stringify({
        sub: "1234567890",
        name: "Jane Developer",
        email: "jane@example.com",
        role: "admin",
        iat: now,
        exp: now + 3600,
        iss: "https://auth.example.com",
        aud: "https://api.example.com",
      })
    );

    // Sign with Web Crypto for a real verifiable token
    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(`${header}.${payload}`);
      const keyData = encoder.encode(sampleSecret);
      const key = await crypto.subtle.importKey(
        "raw",
        keyData,
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"]
      );
      const sig = await crypto.subtle.sign("HMAC", key, data);
      const sigBytes = new Uint8Array(sig);
      let sigBinary = "";
      for (let i = 0; i < sigBytes.length; i++) {
        sigBinary += String.fromCharCode(sigBytes[i]);
      }
      const signature = btoa(sigBinary)
        .replace(/=/g, "")
        .replace(/\+/g, "-")
        .replace(/\//g, "_");

      setToken(`${header}.${payload}.${signature}`);
      setSecret(sampleSecret);
      setVerifyStatus("idle");
      setVerifyMsg("");
    } catch {
      // Fallback: use a static signature if Web Crypto is unavailable
      const sig = "SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";
      setToken(`${header}.${payload}.${sig}`);
      setSecret(sampleSecret);
    }
  }, []);

  const handleVerify = useCallback(async () => {
    if (!decoded || !parts) return;

    const alg = String(decoded.header.alg || "").toUpperCase();

    if (!secret.trim()) {
      setVerifyStatus("error");
      setVerifyMsg(
        alg === "RS256"
          ? "Paste your RSA public key (PEM format) to verify"
          : "Enter the signing secret to verify"
      );
      return;
    }

    try {
      if (alg === "HS256") {
        const valid = await verifyHS256(parts[0], parts[1], parts[2], secret);
        setVerifyStatus(valid ? "valid" : "invalid");
        setVerifyMsg(
          valid ? "Signature is valid" : "Invalid signature — secret does not match"
        );
      } else if (alg === "RS256") {
        const valid = await verifyRS256(parts[0], parts[1], parts[2], secret);
        setVerifyStatus(valid ? "valid" : "invalid");
        setVerifyMsg(
          valid
            ? "Signature is valid"
            : "Invalid signature — public key does not match"
        );
      } else {
        setVerifyStatus("unsupported");
        setVerifyMsg(
          `Algorithm "${decoded.header.alg}" is not supported. This tool supports HS256 and RS256.`
        );
      }
    } catch (e: unknown) {
      setVerifyStatus("error");
      setVerifyMsg(
        e instanceof Error
          ? `Verification failed: ${e.message}`
          : "Verification failed — check your key format"
      );
    }
  }, [decoded, parts, secret]);

  const algName = decoded
    ? String(decoded.header.alg || "").toUpperCase()
    : "";

  return (
    <>
      <title>
        JWT Decoder & Debugger — Decode, Verify & Debug JSON Web Tokens |
        devtools.page
      </title>
      <meta
        name="description"
        content="Free online JWT decoder and debugger. Decode JWT tokens, verify HS256 & RS256 signatures, check expiration, inspect claims. No data sent to any server — 100% client-side."
      />
      <meta
        name="keywords"
        content="jwt decoder, jwt debugger, decode jwt token online, jwt verify, jwt signature verification, json web token decoder"
      />
      <JsonLd
        data={[
          generateWebAppSchema({
            slug: "jwt-decoder",
            name: "JWT Decoder & Debugger",
            description:
              "Decode, verify, and debug JSON Web Tokens — inspect header, payload, verify HS256 & RS256 signatures, check expiration",
            category: "developer",
          }),
          generateBreadcrumbSchema({
            slug: "jwt-decoder",
            name: "JWT Decoder & Debugger",
            description:
              "Decode, verify, and debug JSON Web Tokens — inspect header, payload, verify HS256 & RS256 signatures, check expiration",
            category: "developer",
          }),
          generateFAQSchema([
            {
              question: "What is a JSON Web Token (JWT)?",
              answer:
                "A JWT is a compact, URL-safe token format used for securely transmitting information between parties as a JSON object. It consists of three base64url-encoded parts separated by dots: a header (algorithm and type), a payload (claims/data), and a signature. JWTs are the industry standard (RFC 7519) for authentication and authorization in web applications.",
            },
            {
              question: "How does JWT signature verification work?",
              answer:
                "For HS256 tokens, the tool re-computes the HMAC-SHA256 signature using the secret you provide and compares it against the token's signature. For RS256, it uses the RSA public key to cryptographically verify the signature. All verification happens in your browser using the Web Crypto API — no data leaves your machine.",
            },
            {
              question: "What algorithms does this JWT debugger support?",
              answer:
                "This tool supports decoding JWTs with any algorithm, and can verify signatures for HS256 (HMAC with SHA-256) and RS256 (RSA with SHA-256) — the two most common JWT signing algorithms. For HS256, enter the shared secret. For RS256, paste the public key in PEM format.",
            },
            {
              question: "What do the standard JWT claims mean?",
              answer:
                "iss (issuer) identifies who created the token. sub (subject) identifies the user. exp (expiration) is when the token expires. iat (issued at) is when it was created. nbf (not before) is the earliest time the token is valid. aud (audience) specifies the intended recipient. jti (JWT ID) is a unique identifier for the token. These are registered claims defined in RFC 7519.",
            },
            {
              question: "Is my JWT data safe in this tool?",
              answer:
                "Yes. All decoding and signature verification happens entirely in your browser using JavaScript and the Web Crypto API. No token data is sent to any server. However, as a security best practice, avoid pasting production tokens containing sensitive information into any online tool.",
            },
            {
              question:
                "How do I check if a JWT token is expired?",
              answer:
                "Paste your JWT into this tool and it will automatically detect the exp (expiration) claim, show whether the token is expired or still valid with a color-coded status badge, and display the exact expiry time in human-readable format along with how long ago it expired or how long until it expires.",
            },
          ]),
        ]}
      />

      <div className="min-h-screen bg-slate-900 text-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <ToolBreadcrumb slug="jwt-decoder" />

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
              JWT Decoder & Debugger
            </h1>
            <p className="text-slate-400 max-w-2xl text-lg">
              Decode JWT tokens, verify HS256 & RS256 signatures, check
              expiration, and inspect all claims. 100% client-side — no data
              leaves your browser.
            </p>
          </div>

          {/* Status Badges */}
          {decoded && (
            <div className="flex flex-wrap items-center gap-3 mb-6">
              {/* Expiry badge */}
              {tokenStatus && (
                <span
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold ${
                    tokenStatus.expired
                      ? "bg-red-900/60 text-red-300 border border-red-700"
                      : "bg-green-900/60 text-green-300 border border-green-700"
                  }`}
                >
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${
                      tokenStatus.expired
                        ? "bg-red-400 animate-pulse"
                        : "bg-green-400"
                    }`}
                  />
                  {tokenStatus.expired ? "Token is Expired" : "Token is Valid"}
                  <span className="text-xs opacity-75 ml-1">
                    ({tokenStatus.text})
                  </span>
                </span>
              )}

              {/* No exp claim */}
              {!tokenStatus && (
                <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold bg-yellow-900/60 text-yellow-300 border border-yellow-700">
                  <span className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                  No Expiration Claim
                </span>
              )}

              {/* Algorithm badge */}
              <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-mono font-semibold bg-slate-800 text-slate-300 border border-slate-600">
                {String(decoded.header.alg || "Unknown")}
              </span>

              {/* Signature verification badge */}
              {verifyStatus === "valid" && (
                <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold bg-green-900/60 text-green-300 border border-green-700">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Signature Verified
                </span>
              )}
              {verifyStatus === "invalid" && (
                <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold bg-red-900/60 text-red-300 border border-red-700">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                  Invalid Signature
                </span>
              )}
            </div>
          )}

          {/* Controls */}
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <button
              onClick={generateSampleJWT}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              Generate Sample JWT
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
          </div>

          {/* Token Input */}
          <div className="mb-6">
            <label className="text-sm font-medium text-slate-300 mb-2 block">
              JWT Token
            </label>
            <textarea
              value={token}
              onChange={(e) => handleTokenChange(e.target.value)}
              placeholder="Paste your JWT token here (eyJhbGciOiJIUz...)..."
              className={`w-full h-32 bg-slate-800 border rounded-lg p-4 font-mono text-sm text-slate-200 placeholder-slate-500 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                error ? "border-red-600" : "border-slate-600"
              }`}
              spellCheck={false}
            />
            {/* Color-coded parts preview */}
            {parts && (
              <div className="mt-2 p-3 bg-slate-800 border border-slate-700 rounded-lg font-mono text-xs break-all leading-relaxed">
                <span className="text-red-400" title="Header">
                  {parts[0]}
                </span>
                <span className="text-slate-500">.</span>
                <span className="text-purple-400" title="Payload">
                  {parts[1]}
                </span>
                <span className="text-slate-500">.</span>
                <span className="text-cyan-400" title="Signature">
                  {parts[2]}
                </span>
                <div className="mt-2 flex gap-4 text-[10px] uppercase tracking-wider">
                  <span className="text-red-400">Header</span>
                  <span className="text-purple-400">Payload</span>
                  <span className="text-cyan-400">Signature</span>
                </div>
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

          {/* Signature Verification */}
          {decoded && (
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-cyan-400 mb-3">
                Signature Verification
              </h2>
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-5">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-sm font-mono text-slate-400">
                    Algorithm:
                  </span>
                  <span className="text-sm font-mono font-semibold text-white">
                    {String(decoded.header.alg || "Unknown")}
                  </span>
                  {algName === "HS256" && (
                    <span className="text-xs text-slate-500">
                      (HMAC + SHA-256 — enter shared secret)
                    </span>
                  )}
                  {algName === "RS256" && (
                    <span className="text-xs text-slate-500">
                      (RSA + SHA-256 — paste public key in PEM format)
                    </span>
                  )}
                </div>

                {algName === "RS256" ? (
                  <textarea
                    value={secret}
                    onChange={(e) => handleSecretChange(e.target.value)}
                    placeholder={"-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhk...\n-----END PUBLIC KEY-----"}
                    className="w-full h-28 bg-slate-900 border border-slate-600 rounded-lg p-3 font-mono text-sm text-slate-200 placeholder-slate-500 resize-none focus:outline-none focus:ring-2 focus:ring-cyan-500 mb-3"
                    spellCheck={false}
                  />
                ) : (
                  <input
                    type="text"
                    value={secret}
                    onChange={(e) => handleSecretChange(e.target.value)}
                    placeholder={
                      algName === "HS256"
                        ? "Enter signing secret (e.g. your-256-bit-secret)"
                        : "Enter secret or key"
                    }
                    className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 font-mono text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 mb-3"
                    spellCheck={false}
                  />
                )}

                <div className="flex items-center gap-3">
                  <button
                    onClick={handleVerify}
                    className="px-5 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-medium transition-colors"
                  >
                    Verify Signature
                  </button>

                  {verifyStatus !== "idle" && (
                    <span
                      className={`text-sm font-medium ${
                        verifyStatus === "valid"
                          ? "text-green-400"
                          : verifyStatus === "invalid"
                            ? "text-red-400"
                            : "text-yellow-400"
                      }`}
                    >
                      {verifyMsg}
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-500 mt-3">
                  All verification happens in your browser using the Web Crypto
                  API. No data is sent to any server.
                </p>
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
                      const isExpired =
                        key === "exp" &&
                        typeof value === "number" &&
                        value < Math.floor(Date.now() / 1000);
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
                            <span className={isExpired ? "text-red-400" : ""}>
                              {typeof value === "object"
                                ? JSON.stringify(value)
                                : String(value)}
                            </span>
                            {timestamp && (
                              <span
                                className={`ml-2 text-xs ${isExpired ? "text-red-500" : "text-slate-500"}`}
                              >
                                ({timestamp}
                                {isExpired && " — EXPIRED"})
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
                  consists of three base64url-encoded parts separated by dots: a
                  header (algorithm and type), a payload (claims/data), and a
                  signature. JWTs are the industry standard (RFC 7519) for
                  authentication and authorization in web applications.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  How does JWT signature verification work?
                </h3>
                <p className="text-slate-400">
                  For HS256 tokens, the tool re-computes the HMAC-SHA256
                  signature using the secret you provide and compares it against
                  the token&apos;s signature. For RS256, it uses the RSA public
                  key to cryptographically verify the signature. All
                  verification happens in your browser using the Web Crypto API —
                  no data leaves your machine.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  What algorithms does this JWT debugger support?
                </h3>
                <p className="text-slate-400">
                  This tool supports decoding JWTs with any algorithm, and can
                  verify signatures for HS256 (HMAC with SHA-256) and RS256 (RSA
                  with SHA-256) — the two most common JWT signing algorithms.
                  For HS256, enter the shared secret. For RS256, paste the
                  public key in PEM format.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  What do the standard JWT claims mean?
                </h3>
                <p className="text-slate-400">
                  <strong>iss</strong> (issuer) identifies who created the token.{" "}
                  <strong>sub</strong> (subject) identifies the user.{" "}
                  <strong>exp</strong> (expiration) is when the token expires.{" "}
                  <strong>iat</strong> (issued at) is when it was created.{" "}
                  <strong>nbf</strong> (not before) is the earliest time the
                  token is valid. <strong>aud</strong> (audience) specifies the
                  intended recipient. These are registered claims defined in RFC
                  7519.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Is my JWT data safe in this tool?
                </h3>
                <p className="text-slate-400">
                  Yes. All decoding and signature verification happens entirely
                  in your browser using JavaScript and the Web Crypto API. No
                  token data is sent to any server. However, as a security best
                  practice, avoid pasting production tokens containing sensitive
                  information into any online tool.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  How do I check if a JWT token is expired?
                </h3>
                <p className="text-slate-400">
                  Paste your JWT into this tool and it will automatically detect
                  the <strong>exp</strong> (expiration) claim, show whether the
                  token is expired or still valid with a color-coded status
                  badge, and display the exact expiry time in human-readable
                  format along with how long ago it expired or how long until it
                  expires.
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
