import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.join(__dirname),
  },
  serverExternalPackages: [
    "better-sqlite3",
    "@laserdata/laser-sdk",
    "falkordb",
    "rocketride",
    "linkup-sdk",
    "snyk",
    "@guildai/cli",
  ],
};

export default nextConfig;
