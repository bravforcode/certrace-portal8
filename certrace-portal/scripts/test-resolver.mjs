/* Makes `node --test` resolve the imports this codebase actually writes.

   Node 24 runs TypeScript directly (type stripping), so the test suite needs
   no bundler and no extra dependency — but Node's ESM resolver is strict about
   specifiers, and Next.js code is not: it writes `./config` rather than
   `./config.ts`, and `@/lib/config` for the tsconfig path alias. This hook
   teaches the resolver both, and nothing else.

   Deliberately test-only: it is loaded via `--import` from the `test` script,
   never by the app, so the running product keeps Next's own resolution. */

import { registerHooks } from "node:module";
import { existsSync, readFileSync } from "node:fs";
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
  load(url, context, nextLoad) {
    // Next imports static JSON as a module; Node's native ESM loader wants an
    // import attribute that Next's source syntax does not use.
    if (
      url.startsWith("file:") &&
      url.endsWith("/lib/data/eu-precursor-defaults-2026.json")
    ) {
      return {
        format: "module",
        source: `export default ${readFileSync(fileURLToPath(url), "utf8")}`,
        shortCircuit: true,
      };
    }
    return nextLoad(url, context);
  },
  resolve(specifier, context, nextResolve) {
    // Next's extensionless CommonJS entry points are also used by the reference language provider.
    if (/^next\/[a-z-]+$/.test(specifier)) {
      try {
        return nextResolve(specifier, context);
      } catch {
        return nextResolve(`${specifier}.js`, context);
      }
    }
    // tsconfig `paths`: "@/*" → project root
    if (specifier.startsWith("@/")) {
      const hit = probe(path.join(ROOT, specifier.slice(2)));
      if (hit) return { url: pathToFileURL(hit).href, shortCircuit: true };
    }

    // Relative specifier with no extension — the repo's normal style.
    if (specifier.startsWith(".") && !path.extname(specifier)) {
      const parentPath = context.parentURL?.startsWith("file:")
        ? fileURLToPath(context.parentURL)
        : null;
      if (parentPath) {
        const hit = probe(path.resolve(path.dirname(parentPath), specifier));
        if (hit) return { url: pathToFileURL(hit).href, shortCircuit: true };
      }
    }

    return nextResolve(specifier, context);
  },
});

// lib/i18n loads its dictionaries on demand in the app; tests call translate() synchronously,
// so every dictionary is loaded before any test file runs. Same module URL, so the same instance.
const { loadLocale } = await import(
  pathToFileURL(path.join(ROOT, "lib/i18n.ts")).href
);
await Promise.all(["th", "zh", "hi"].map((lang) => loadLocale(lang)));
