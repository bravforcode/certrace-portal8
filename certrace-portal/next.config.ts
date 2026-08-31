import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), browsing-topics=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
  { key: "X-XSS-Protection", value: "0" },
];

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
