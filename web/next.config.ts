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
      {
        // Proxy uploaded files (signatures, document photos) through this origin
        // so the browser loads them same-origin — avoids cross-origin/CORP and
        // localhost base-URL issues in production (Vercel → API).
        source: "/uploads/:path*",
        destination: `${API_BASE}/uploads/:path*`,
      },
    ];
  },
};

export default nextConfig;
