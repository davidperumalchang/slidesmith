/** @type {import('next').NextConfig} */
const nextConfig = {
  // Emit a minimal standalone server bundle for small production Docker images.
  output: "standalone",
  reactStrictMode: true,
  poweredByHeader: false,
  // ESLint is not a runtime dependency here; never fail production builds on it.
  eslint: { ignoreDuringBuilds: true },
};

export default nextConfig;
