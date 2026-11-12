import type { NextConfig } from "next";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/* The security header set lives in public/_headers, and that file is the
   single source of truth — see the comment block at its top for why the
   asset layer, not this config, is what serves the pages visitors load.

   Parsing it here is what keeps the two in step: the asset layer reads the
   file directly, the Worker gets the same set through this function, and
   editing the policy in one place updates both. A silent drift between them
   is exactly the failure that scored the site 5/100 on Observatory.

   Cloudflare's format: a path pattern at column 0, then one indented
   `Name: value` per header. Only the `/*` block is lifted — any
   path-specific block added later stays asset-layer-only on purpose.

   The `script-src` lifted here is the hash-free base: the per-page hashes
   that scripts/build-csp-headers.mjs computes belong to prerendered files
   the Worker never serves. What the Worker does serve is rendered per
   request, and middleware.ts sets a nonce policy on those responses that
   takes precedence over this one — so the base is a floor for the paths
   middleware skips (API routes, /_next/static), none of which are
   documents. */
function securityHeadersFromFile(): { key: string; value: string }[] {
  const raw = readFileSync(
    join(import.meta.dirname, "public", "_headers"),
    "utf8",
  );
  const headers: { key: string; value: string }[] = [];
  let inGlobalBlock = false;

  for (const line of raw.split("\n")) {
    if (!line.trim() || line.trimStart().startsWith("#")) continue;
    if (!/^\s/.test(line)) {
      inGlobalBlock = line.trim() === "/*";
      continue;
    }
    if (!inGlobalBlock) continue;
    const separator = line.indexOf(":");
    if (separator === -1) continue;
    headers.push({
      key: line.slice(0, separator).trim(),
      value: line.slice(separator + 1).trim(),
    });
  }

  if (headers.length === 0) {
    throw new Error(
      "public/_headers produced no headers for the /* block — the build would ship unprotected.",
    );
  }
  return headers;
}

const securityHeaders = securityHeadersFromFile();

const nextConfig: NextConfig = {
  // Release images are built only after the independent lint/type jobs pass.
  // Ordinary local builds still perform both checks.
  eslint: {
    ignoreDuringBuilds: process.env.CERTRACE_CI_CHECKS_PASSED === "true",
  },
  typescript: {
    ignoreBuildErrors: process.env.CERTRACE_CI_CHECKS_PASSED === "true",
  },
  // Pin the workspace root (there's another lockfile in the home dir).
  outputFileTracingRoot: join(import.meta.dirname, ".."),
  output: "standalone",
  // Server source maps were ~26% of the function output (61 MB of 237 MB in
  // the Vercel build) and nothing reads them at runtime. Client maps are off by default.
  webpack(config, { dev, isServer, webpack }) {
    if (isServer) {
      config.devtool = false;
      // Dictionaries load in the browser only (lib/i18n.ts loadLocale). Edge route bundles inlined them anyway.
      config.plugins.push(
        new webpack.NormalModuleReplacementPlugin(
          /^\.\/i18n-(th-all|zh|hi)$/,
          join(import.meta.dirname, "lib", "i18n-server-stub.ts"),
        ),
      );
      // PDF.js loads from /pdf.min.mjs in the browser only (lib/pdf-loader.ts).
      config.plugins.push(
        new webpack.NormalModuleReplacementPlugin(
          /(^|\/)pdf-loader$/,
          join(import.meta.dirname, "lib", "pdf-loader-server-stub.ts"),
        ),
      );
    }
    // Production webpack cache packs were ~760 MB under .next/cache in the
    // Vercel build container (build report, 2026-11-12).
    if (!dev) config.cache = false;
    return config;
  },
  async rewrites() {
    return [
      {
        source: "/backend/:path*",
        destination: `${process.env.BACKEND_INTERNAL_URL ?? "http://backend:8000"}/:path*`,
      },
    ];
  },
  // /workspaces has subroutes but no index page; older links to it land on the workbook.
  // /workspaces/new (the installation wizard) is switched off: its links land on the workbook, which takes uploads without one.
  async redirects() {
    return [
      { source: "/workspaces", destination: "/workspace", permanent: false },
      {
        source: "/workspaces/new",
        destination: "/workspace",
        permanent: false,
      },
    ];
  },
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
};

export default nextConfig;
