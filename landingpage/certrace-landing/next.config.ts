import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* `next build` writes into the same .next directory a running `next dev` is
     serving from, which leaves the dev server throwing missing-chunk errors
     until it's restarted. Setting NEXT_DIST_DIR sends a build somewhere else,
     so a production check can run without disturbing a live preview. Unset in
     normal use, so `npm run build` behaves exactly as before. */
  ...(process.env.NEXT_DIST_DIR ? { distDir: process.env.NEXT_DIST_DIR } : {}),
};

export default nextConfig;
