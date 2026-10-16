import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Bundle pg instead of loading it as an external: Bun cannot resolve Turbopack's hashed external alias on Windows.
  transpilePackages: ["pg"],
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
