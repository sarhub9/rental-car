import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://localhost:3000/api/:path*",
      },
      {
        source: "/v1/:path*",
        destination: "http://localhost:3000/v1/:path*",
      },
    ];
  },
};

export default nextConfig;
