import type { NextConfig } from "next";

// Every page here is per-user and reads the session cookie plus the database,
// so the app renders dynamically and Cache Components stay off.
const nextConfig: NextConfig = {
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  serverExternalPackages: ["pg"],
  experimental: {
    serverActions: {
      // Profile photos are resized client-side but still travel as data URLs.
      bodySizeLimit: "2mb",
    },
  },
};

export default nextConfig;
