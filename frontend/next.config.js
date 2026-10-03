/** @type {import('next').NextConfig} */
const nextConfig = {
  // `standalone` produces a self-contained server bundle for Docker.
  // Vercel manages its own runtime, so keep it off there.
  ...(process.env.VERCEL ? {} : { output: "standalone" }),
  reactStrictMode: true,
};

module.exports = nextConfig;
