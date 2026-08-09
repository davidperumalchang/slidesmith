/** @type {import('next').NextConfig} */
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
