import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // "types" (packages/types) is consumed as raw .ts source, not a compiled
  // package, so it needs to go through Next's compiler like our own src/.
  transpilePackages: ["types"],
};

export default nextConfig;
