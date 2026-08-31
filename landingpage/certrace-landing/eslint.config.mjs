import { FlatCompat } from "@eslint/eslintrc";
import path from "node:path";
import { fileURLToPath } from "node:url";

const baseDirectory = path.dirname(fileURLToPath(import.meta.url));
const compat = new FlatCompat({ baseDirectory });

/* This app had no ESLint configuration at all, and `next lint` — which the
   lint script used to call — responds to that by dropping into an interactive
   "How would you like to configure ESLint?" prompt. In a terminal that is
   merely annoying; in CI it is a hang followed by a non-zero exit, which is
   why the landing page has never had a lint step anywhere. The script now
   calls `eslint .` directly, matching both portals. */

const config = [
  {
    ignores: [
      ".next/**",
      ".open-next/**",
      ".vercel/**",
      ".wrangler/**",
      "node_modules/**",
      "public/**",
      "next-env.d.ts",
    ],
  },
  ...compat.extends("next/core-web-vitals", "next/typescript"),

  /* Same five rules the portals carry, for the same reason: next/core-web-vitals
     turns on only six jsx-a11y rules and none of them look at interaction
     handlers, which is how a <span onClick> pseudo-control reached production
     in the exporter portal. Keeping the three apps on one rule set means a
     component moved between them cannot pass in one tree and fail in another. */
  {
    files: ["**/*.{ts,tsx}"],
    rules: {
      "jsx-a11y/click-events-have-key-events": "error",
      /* Scoped to activation handlers. Hover and pointer-move (the cursor-glow
         effect, a dropdown that opens on hover behind a real <button>) are
         decoration with no keyboard equivalent to demand — flagging them would
         only teach people to add blanket disables, which is how the rule that
         matters stops being read. onClick and the key handlers stay covered,
         and those are what caught the attestation checkbox. */
      "jsx-a11y/no-static-element-interactions": ["error", {
        handlers: ["onClick", "onMouseDown", "onMouseUp", "onKeyPress", "onKeyDown", "onKeyUp"],
      }],
      "jsx-a11y/no-noninteractive-element-interactions": "error",
      "jsx-a11y/interactive-supports-focus": "error",
      "jsx-a11y/label-has-associated-control": ["error", { assert: "either", depth: 6 }],
    },
  },
];

export default config;
