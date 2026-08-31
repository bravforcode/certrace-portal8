/* Fails loudly when the running Node is below the floor package.json declares.

   The unit suite is TypeScript executed directly by `node --test` — no
   bundler, no ts-node, nothing between the file and the runtime. Node itself
   strips the types, and two of the things this repo relies on landed part way
   through the 22.x line:

     22.15.0  module.registerHooks(), which scripts/test-resolver.mjs is built
              on to resolve the extensionless and `@/` specifiers Next writes
     22.18.0  type stripping without --experimental-strip-types

   Below that floor the failure is a syntax error on the first type annotation
   it meets, which reads as "the code is broken" rather than "this Node is too
   old" — and someone will spend an afternoon on it. Hence this check, which
   costs a millisecond and says the actual reason.

   Deliberately dependency-free: it runs before `npm ci` in CI, so it cannot
   import semver or anything else from node_modules. */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const packagePath = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "package.json");
const declared = JSON.parse(readFileSync(packagePath, "utf8")).engines?.node;

if (!declared) {
  console.error("package.json declares no engines.node — nothing to check against, which is itself the problem.");
  process.exit(1);
}

/* The floor is written as a range (">=22.18.0") for npm's benefit; only the
   lower bound is meaningful here. */
const floor = declared.replace(/[^0-9.]/g, "");
const parse = (version) => version.split(".").map(Number);

const [major, minor, patch] = parse(process.versions.node);
const [floorMajor, floorMinor, floorPatch] = parse(floor);

const meetsFloor =
  major > floorMajor ||
  (major === floorMajor && (minor > floorMinor || (minor === floorMinor && patch >= floorPatch)));

if (!meetsFloor) {
  console.error(
    `Node ${process.versions.node} is below the ${floor} this package requires.\n` +
      "The test suite runs .ts files through `node --test` and relies on Node's own\n" +
      "type stripping (unflagged from 22.18.0) and module.registerHooks (22.15.0).\n" +
      "Upgrade Node, or run the suite on the current LTS.",
  );
  process.exit(1);
}

console.log(`Node ${process.versions.node} meets the ${floor} floor.`);
