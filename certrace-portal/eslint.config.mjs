import { FlatCompat } from "@eslint/eslintrc";
import path from "node:path";
import { fileURLToPath } from "node:url";

const baseDirectory = path.dirname(fileURLToPath(import.meta.url));
const compat = new FlatCompat({ baseDirectory });

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
      "lib/api/validators.js",
    ],
  },
  ...compat.extends("next/core-web-vitals", "next/typescript"),

  /* next/core-web-vitals turns on only six jsx-a11y rules, and none of them
     look at interaction handlers. That is how the supplier attestation — the
     control that records "I confirm this data is accurate and I am authorised
     to submit it" — shipped as a <span onClick>: no tab stop, no role, no
     announced state, unusable by keyboard or screen reader, on the one
     control in the product with legal weight.

     These five close that gap. They fire on the shape of the mistake (a
     handler on an element that is not a control, a <label> with no control
     inside it), so the next one is caught in review rather than in an audit. */
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
      "jsx-a11y/no-static-element-interactions": [
        "error",
        {
          handlers: [
            "onClick",
            "onMouseDown",
            "onMouseUp",
            "onKeyPress",
            "onKeyDown",
            "onKeyUp",
          ],
        },
      ],
      "jsx-a11y/no-noninteractive-element-interactions": "error",
      "jsx-a11y/interactive-supports-focus": "error",
      "jsx-a11y/label-has-associated-control": [
        "error",
        { assert: "either", depth: 6 },
      ],
    },
  },
];

export default config;
