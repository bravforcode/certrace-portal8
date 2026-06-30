import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin the workspace root (there's another lockfile in the home dir).
  outputFileTracingRoot: import.meta.dirname,
};

export default nextConfig;
