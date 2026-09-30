import type { NextConfig } from "next";

// Unset by default (local dev, docker compose, `next start` at domain root
// all serve from "/"). Only set NEXT_BASE_PATH when deploying under a
// subpath, e.g. https://example.com/travel-approvals/.
const basePath = process.env.NEXT_BASE_PATH || undefined;

const nextConfig: NextConfig = {
  basePath,
};

export default nextConfig;
