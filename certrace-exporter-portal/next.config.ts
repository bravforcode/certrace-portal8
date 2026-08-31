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
   path-specific block added later stays asset-layer-only on purpose. */
function securityHeadersFromFile(): { key: string; value: string }[] {
  const raw = readFileSync(join(import.meta.dirname, "public", "_headers"), "utf8");
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
    headers.push({ key: line.slice(0, separator).trim(), value: line.slice(separator + 1).trim() });
  }

  if (headers.length === 0) {
    throw new Error("public/_headers produced no headers for the /* block — the build would ship unprotected.");
  }
  return headers;
}

const securityHeaders = securityHeadersFromFile();

const nextConfig: NextConfig = {
  // Pin the workspace root (there's another lockfile in the home dir).
  outputFileTracingRoot: import.meta.dirname,
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
  webpack(config, { isServer, nextRuntime, webpack }) {
    /* The Anthropic SDK is used from the browser for evidence extraction
       (lib/workspace-evidence.ts). Its credential chain lazily `import()`s
       `node:fs` and `node:path` to resolve API keys from on-disk profiles —
       a path that can never run in a browser, but which webpack still tries
       to resolve and fails on with UnhandledSchemeError.

       `resolve.fallback` alone does not fix it: a `node:` specifier is a URI
       SCHEME, rejected before module resolution is reached. So the scheme is
       first rewritten to the bare builtin name, which fallback then stubs out.

       Stubbing is safe precisely because that code is unreachable in a
       browser: the client is constructed with an explicit apiKey, so the
       on-disk credential resolution is never entered. The NODE server build
       keeps the real modules.

       THE EDGE BUNDLE NEEDS THIS TOO, and that is not obvious: an edge route
       is `isServer: true`, so the original `!isServer` guard skipped it — and
       the edge runtime has no `node:fs` at all, so the build failed outright
       the moment a route with `runtime = "edge"` pulled in anything that
       reaches the SDK. Every dynamic route here is edge, because
       `next-on-pages` requires it for Cloudflare, so the correct test is
       "anything that is not the Node server". */
    if (!isServer || nextRuntime === "edge") {
      config.plugins.push(
        new webpack.NormalModuleReplacementPlugin(/^node:(fs|path)$/, (resource: { request: string }) => {
          resource.request = resource.request.replace(/^node:/, "");
        }),
      );
      config.resolve = config.resolve ?? {};
      config.resolve.fallback = { ...config.resolve.fallback, fs: false, path: false };
    }
    return config;
  },
};

export default nextConfig;
