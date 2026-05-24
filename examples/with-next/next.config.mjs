/** @type {import('next').NextConfig} */
const nextConfig = {
  // BullMQ relies on native node APIs; keep it server-only.
  serverExternalPackages: ["bullmq", "ioredis"],
};

export default nextConfig;
