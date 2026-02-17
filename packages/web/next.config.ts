import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // Include monorepo root so serverless functions can access fixtures/samples
  outputFileTracingRoot: path.join(__dirname, '../../'),
  serverExternalPackages: ['@gov-epub/core'],
};

export default nextConfig;
