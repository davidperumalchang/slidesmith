import path from "node:path";
import { fileURLToPath } from "node:url";
import nextEnv from "@next/env";

// Single source of truth: repo-root .env (same file docker compose uses).
// @next/env is CJS — use default import for ESM next.config.mjs compatibility.
const { loadEnvConfig } = nextEnv;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
loadEnvConfig(repoRoot);

/** @type {import('next').NextConfig} */
// Local default targets the host-mapped backend. Docker Compose overrides this
// at image build time with http://backend:4000/api.
const API_INTERNAL_URL = (
  process.env.API_INTERNAL_URL ?? "http://localhost:4000/api"
).replace(/\/$/, "");

const nextConfig = {
  // Emit a minimal standalone server bundle for small production Docker images.
  output: "standalone",
  reactStrictMode: true,
  poweredByHeader: false,
  // ESLint is not a runtime dependency here; never fail production builds on it.
  eslint: { ignoreDuringBuilds: true },

  // Same-origin proxy so the session cookie stays on the frontend host.
  // Browser → /backend-api/* → backend /api/*
  async rewrites() {
    return [
      {
        source: "/backend-api/:path*",
        destination: `${API_INTERNAL_URL}/:path*`,
      },
    ];
  },
};

export default nextConfig;
