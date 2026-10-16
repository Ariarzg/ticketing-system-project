import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Bundle pg instead of loading it as an external: Bun cannot resolve Turbopack's hashed external alias on Windows.
  transpilePackages: ["pg"],
  experimental: {
    // Next 16 keeps Turbopack's build cache between Vercel builds, and a restored cache served the old
    // globals.css after a theme change (the CSS goes through the custom Tailwind loader below). Always compile fresh.
    turbopackFileSystemCacheForBuild: false,
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
