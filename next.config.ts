import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Allow server-side pdf-parse
  },
  serverExternalPackages: ["pdf-parse"],
};

export default nextConfig;
