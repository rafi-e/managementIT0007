import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["3.41.17.176"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
    ],
  },
};

export default nextConfig;
