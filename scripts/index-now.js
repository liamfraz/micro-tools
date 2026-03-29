#!/usr/bin/env node

/**
 * IndexNow API submission script for devtools.page
 * Pings Bing and Yandex with all tool URLs for faster indexing.
 *
 * Usage: node scripts/index-now.js
 */

const https = require("https");
const fs = require("fs");
const path = require("path");

const HOST = "devtools.page";
const KEY_FILE = "IndexNow-key.txt";
const KEY = fs.readFileSync(
  path.join(__dirname, "..", "public", KEY_FILE),
  "utf-8"
).trim();

// Load tool slugs from manifest
const manifest = JSON.parse(
  fs.readFileSync(
    path.join(__dirname, "..", "src", "lib", "tools-manifest.json"),
    "utf-8"
  )
);

const liveTools = manifest.tools.filter((t) => t.status === "live");
const categories = Object.keys(manifest.categories);

// Build full URL list
const urls = [
  `https://${HOST}`,
  `https://${HOST}/tools`,
  `https://${HOST}/privacy`,
  `https://${HOST}/terms`,
  ...categories.map((c) => `https://${HOST}/tools/category/${c}`),
  ...liveTools.map((t) => `https://${HOST}/tools/${t.slug}`),
];

console.log(`IndexNow: submitting ${urls.length} URLs for ${HOST}`);
console.log(`Key: ${KEY.slice(0, 8)}...`);
console.log("");

// IndexNow API endpoints (Bing and Yandex both support the protocol)
const ENDPOINTS = [
  { name: "Bing", host: "api.indexnow.org" },
  { name: "Yandex", host: "yandex.com" },
];

function submitBatch(endpoint) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      host: HOST,
      key: KEY,
      keyLocation: `https://${HOST}/${KEY_FILE}`,
      urlList: urls,
    });

    const options = {
      hostname: endpoint.host,
      port: 443,
      path: "/indexnow",
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Length": Buffer.byteLength(body),
      },
    };

    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        const status = res.statusCode;
        // 200 = OK, 202 = Accepted (both are success)
        if (status === 200 || status === 202) {
          console.log(`  ${endpoint.name}: OK (${status})`);
        } else {
          console.log(`  ${endpoint.name}: ${status} — ${data || "(no body)"}`);
        }
        resolve(status);
      });
    });

    req.on("error", (err) => {
      console.log(`  ${endpoint.name}: ERROR — ${err.message}`);
      resolve(0);
    });

    req.write(body);
    req.end();
  });
}

async function main() {
  for (const endpoint of ENDPOINTS) {
    await submitBatch(endpoint);
  }
  console.log(`\nDone. Submitted ${urls.length} URLs to ${ENDPOINTS.length} endpoints.`);
}

main();
