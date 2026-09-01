#!/usr/bin/env node
/* ════════════════════════════════════════════════════════════
   PER-PAGE script-src HASHES FOR THE PRERENDERED HTML.

   Every prerendered page carries a handful of inline `<script>` blocks that
   Next.js emits to stream the flight payload (`self.__next_f.push(...)`).
   The middleware answers those with a per-request nonce, but the middleware
   only runs inside the Worker — and a prerendered page is served straight off
   the Cloudflare asset layer, which never invokes it (see public/_headers).
   A nonce cannot be minted for a file that was written at build time, so the
   asset layer used to fall back to `script-src 'self' 'unsafe-inline'`, which
   is the same as having no script CSP at all: an injected inline script would
   run. Mozilla Observatory scored it -20 for exactly that reason.

   A hash is the nonce's static counterpart. The bytes of each inline script
   are fixed the moment the page is prerendered, so this script reads them out
   of the build output, hashes them, and writes one `Content-Security-Policy`
   rule per page with those hashes in `script-src`. `'unsafe-inline'` is gone;
   only the exact scripts that shipped with the page may run.

   WHY THE POLICY LEAVES THE `/*` BLOCK. Cloudflare MERGES every rule whose
   pattern matches — it does not let a specific rule override `/*` — and two
   rules setting the same header produce one comma-joined value, which a
   browser reads as two policies and enforces as their intersection. A global
   `script-src 'self'` intersected with a per-page hash list allows nothing at
   all. So CSP is removed from `/*` here and re-emitted per page; every other
   header stays global and is inherited unchanged. Non-document responses
   (JS, CSS, fonts, `.rsc` payloads) are then left without a CSP, which costs
   nothing: a policy only ever constrains a document.

   Run against the deploy output, after the framework build:
     node scripts/build-csp-headers.mjs .vercel/output/static
   ════════════════════════════════════════════════════════════ */

import { createHash } from "node:crypto";
import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join, relative, sep } from "node:path";

const CSP = "Content-Security-Policy";
/* Cloudflare's own documented ceilings for a _headers file. Blowing either one
   fails silently in production — the rule is dropped, the page ships without a
   policy — so they are checked here instead. */
const MAX_LINE = 2000;
const MAX_RULES = 100;

const outDir = process.argv[2];
if (!outDir) {
  fail("usage: build-csp-headers.mjs <static-output-dir>");
}

function fail(message) {
  console.error(`build-csp-headers: ${message}`);
  process.exit(1);
}

/* ── the base header set, as written by hand in public/_headers ── */

function parseHeaders(raw) {
  const blocks = [];
  let current = null;
  for (const line of raw.split("\n")) {
    if (!line.trim() || line.trimStart().startsWith("#")) continue;
    if (!/^\s/.test(line)) {
      current = { pattern: line.trim(), headers: [] };
      blocks.push(current);
      continue;
    }
    if (!current) continue;
    const separator = line.indexOf(":");
    if (separator === -1) continue;
    current.headers.push({
      key: line.slice(0, separator).trim(),
      value: line.slice(separator + 1).trim(),
    });
  }
  return blocks;
}

/* ── inline scripts ── */

// Only blocks with no `src`: an external script is covered by `'self'`, and
// hashing its tag would do nothing (a hash matches the *body* it encloses).
const INLINE_SCRIPT = /<script(?![^>]*\ssrc=)([^>]*)>([\s\S]*?)<\/script>/gi;

function inlineScriptHashes(html) {
  const hashes = new Set();
  for (const [, attributes, body] of html.matchAll(INLINE_SCRIPT)) {
    // A JSON payload in a <script type="application/json"> is data the browser
    // never executes, so CSP has no say over it and a hash would be noise.
    const type = /\stype=["']?([^"'\s>]+)/i.exec(attributes)?.[1]?.toLowerCase();
    if (type && !["module", "text/javascript", "application/javascript"].includes(type)) continue;
    if (!body) continue;
    hashes.add(`'sha256-${createHash("sha256").update(body, "utf8").digest("base64")}'`);
  }
  return [...hashes];
}

function htmlFiles(dir) {
  const found = [];
  for (const entry of readdirSync(dir)) {
    // `_worker.js` is a directory of server bundles, ignored by the asset
    // layer (.assetsignore); `cdn-cgi` is Cloudflare's own reserved path and
    // is served by Cloudflare, not from these assets.
    if (entry === "_worker.js" || entry === "cdn-cgi") continue;
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) found.push(...htmlFiles(path));
    else if (entry.endsWith(".html")) found.push(path);
  }
  return found;
}

// `index.html` is served at `/`; `login.html` at `/login`. The request path is
// what _headers matches, so that is what the rule has to name.
function requestPath(file, root) {
  const parts = relative(root, file).split(sep);
  const last = parts.pop().replace(/\.html$/, "");
  const segments = last === "index" ? parts : [...parts, last];
  return `/${segments.join("/")}`;
}

/* ── generate ── */

const headersPath = join(outDir, "_headers");
let source;
try {
  source = readFileSync(headersPath, "utf8");
} catch {
  fail(`${headersPath} not found — the build output should carry public/_headers.`);
}

const blocks = parseHeaders(source);
const global = blocks.find((block) => block.pattern === "/*");
if (!global) fail(`${headersPath} has no /* block to build on.`);
/* Anything else in the file is a rule the framework build appended for
   itself (next-on-pages adds an immutable cache rule for /_next/static/*).
   Those are carried through untouched — but not if one sets a policy of its
   own, because that would comma-merge with the per-page policy below. */
const passthrough = blocks.filter((block) => block.pattern !== "/*");
if (passthrough.some((block) => block.headers.some((header) => header.key.toLowerCase() === CSP.toLowerCase()))) {
  fail("a path-specific rule already sets a Content-Security-Policy; it would merge with the generated ones.");
}

let basePolicy = global.headers.find((header) => header.key.toLowerCase() === CSP.toLowerCase())?.value;
if (!basePolicy) fail("the /* block declares no Content-Security-Policy.");

/* ── the backend origin ──
   public/_headers is a static file and cannot know where the API lives; the
   value is only fixed at build time, in NEXT_PUBLIC_API_BASE_URL. Without it
   in connect-src, every prerendered page — /login, /forgot-password,
   /reset-password among them — ships a policy that refuses the very calls the
   page is built to make, and the failure reads as "the server is down".
   Mirrors the same addition in middleware.ts, which covers the pages the
   Worker renders. */
const configuredApi = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "").trim();
if (configuredApi) {
  let origin;
  try {
    origin = new URL(configuredApi).origin;
  } catch {
    fail(`NEXT_PUBLIC_API_BASE_URL is not a URL: ${configuredApi}`);
  }
  if (!/(^|;)\s*connect-src\s/.test(basePolicy)) {
    fail("the policy has no connect-src directive to add the API origin to.");
  }
  if (!basePolicy.includes(origin)) {
    basePolicy = basePolicy.replace(
      /(^|;)(\s*connect-src\s[^;]*)/,
      (match, lead, directive) => `${lead}${directive} ${origin}`,
    );
  }
  console.log(`build-csp-headers: connect-src includes ${origin}.`);
}
if (/script-src[^;]*'unsafe-inline'/.test(basePolicy)) {
  fail("script-src still allows 'unsafe-inline' — remove it; the hashes generated here replace it.");
}
if (!/(^|;)\s*script-src\s/.test(basePolicy)) {
  fail("the policy has no script-src directive to add hashes to.");
}

const pages = htmlFiles(outDir)
  .map((file) => ({ path: requestPath(file, outDir), hashes: inlineScriptHashes(readFileSync(file, "utf8")) }))
  .sort((a, b) => a.path.localeCompare(b.path));

if (pages.length === 0) fail(`no prerendered HTML found under ${outDir} — nothing would carry a policy.`);

const withHashes = (hashes) =>
  basePolicy.replace(/(^|;)(\s*script-src\s[^;]*)/, (match, lead, directive) =>
    hashes.length ? `${lead}${directive} ${hashes.join(" ")}` : match,
  );

const lines = [
  "# ════════════════════════════════════════════════════════════",
  "#  GENERATED BY scripts/build-csp-headers.mjs — DO NOT EDIT.",
  "#  Edit public/_headers; this file is rebuilt from it on every deploy.",
  "#",
  "#  The /* block carries every header except the Content-Security-Policy,",
  "#  which is emitted once per prerendered page with the sha256 of that",
  "#  page's inline scripts — Cloudflare merges matching rules rather than",
  "#  overriding them, so a global policy would intersect with these and",
  "#  block everything. See the script for the full reasoning.",
  "# ════════════════════════════════════════════════════════════",
  "",
  "/*",
  ...global.headers
    .filter((header) => header.key.toLowerCase() !== CSP.toLowerCase())
    .map((header) => `  ${header.key}: ${header.value}`),
  "",
];

for (const block of passthrough) {
  lines.push(block.pattern, ...block.headers.map((header) => `  ${header.key}: ${header.value}`), "");
}

for (const page of pages) {
  lines.push(page.path, `  ${CSP}: ${withHashes(page.hashes)}`, "");
}

const ruleCount = pages.length + passthrough.length + 1;
if (ruleCount > MAX_RULES) {
  fail(`${ruleCount} rules exceeds Cloudflare's limit of ${MAX_RULES}; rules past the limit are dropped.`);
}
const tooLong = lines.filter((line) => line.length > MAX_LINE);
if (tooLong.length) {
  fail(`${tooLong.length} line(s) exceed Cloudflare's ${MAX_LINE}-character limit, starting with "${tooLong[0].slice(0, 60)}…".`);
}

writeFileSync(headersPath, `${lines.join("\n")}\n`);

const longest = Math.max(...lines.map((line) => line.length));
const hashed = pages.reduce((total, page) => total + page.hashes.length, 0);
console.log(
  `build-csp-headers: ${pages.length} page(s), ${hashed} inline script hash(es), ` +
    `${ruleCount} rules, longest line ${longest}/${MAX_LINE} chars.`,
);
