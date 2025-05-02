// next.config.ts
import type { NextConfig } from "next";

const repo = "SmartCart";           //   ⬅  matches last path segment in URL above

const nextConfig: NextConfig = {
  output: "export",                          // emit static files into /out
  basePath: process.env.NODE_ENV === "production" ? `/${repo}` : "",
  assetPrefix:
    process.env.NODE_ENV === "production" ? `/${repo}/` : "",
  trailingSlash: true,                       // avoids 404s on client routes
};

export default nextConfig;
