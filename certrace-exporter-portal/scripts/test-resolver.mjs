/* Makes `node --test` resolve the imports this codebase actually writes.

   Node 24 runs TypeScript directly (type stripping), so the test suite needs
   no bundler and no extra dependency — but Node's ESM resolver is strict about
   specifiers, and Next.js code is not: it writes `./config` rather than
   `./config.ts`, and `@/lib/config` for the tsconfig path alias. This hook
   teaches the resolver both, and nothing else.

   Deliberately test-only: it is loaded via `--import` from the `test` script,
   never by the app, so the running product keeps Next's own resolution. */

import { registerHooks } from "node:module";
import { existsSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const CANDIDATES = [".ts", ".tsx", ".js", ".mjs", "/index.ts", "/index.tsx"];

/** First existing file for a base path, trying the extensions Next would. */
function probe(basePath) {
  if (existsSync(basePath) && path.extname(basePath)) return basePath;
  for (const ext of CANDIDATES) {
    const candidate = basePath + ext;
    if (existsSync(candidate)) return candidate;
  }
  return null;
}

registerHooks({
  resolve(specifier, context, nextResolve) {
    // tsconfig `paths`: "@/*" → project root
    if (specifier.startsWith("@/")) {
      const hit = probe(path.join(ROOT, specifier.slice(2)));
      if (hit) return { url: pathToFileURL(hit).href, shortCircuit: true };
    }

    // Relative specifier with no extension — the repo's normal style.
    if (specifier.startsWith(".") && !path.extname(specifier)) {
      const parentPath = context.parentURL?.startsWith("file:") ? fileURLToPath(context.parentURL) : null;
      if (parentPath) {
        const hit = probe(path.resolve(path.dirname(parentPath), specifier));
        if (hit) return { url: pathToFileURL(hit).href, shortCircuit: true };
      }
    }

    return nextResolve(specifier, context);
  },
});
