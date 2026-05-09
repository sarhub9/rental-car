import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "https://rental-car-upg8.onrender.com/api/:path*",
      },
      {
        source: "/v1/:path*",
        destination: "https://rental-car-upg8.onrender.com/v1/:path*",
      },
    ];
  },
};

export default nextConfig;
