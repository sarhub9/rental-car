import type { NextConfig } from "next";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://rental-car-upg8.onrender.com";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${API_BASE}/api/:path*`,
      },
      {
        source: "/v1/:path*",
        destination: `${API_BASE}/v1/:path*`,
      },
      {
        source: "/auth/:path*",
        destination: `${API_BASE}/v1/auth/:path*`,
      },
    ];
  },
};

export default nextConfig;
