import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: { root: __dirname },
  experimental: {
    // Le cache disque Turbopack se corrompt sur le bind mount Docker
    // (panics « Failed to restore task data » au Fast Refresh).
    turbopackFileSystemCacheForDev: false,
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
};

export default nextConfig;
