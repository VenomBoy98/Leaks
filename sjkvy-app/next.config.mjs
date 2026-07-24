/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // The public certificate-verification + catalogue calls hit the existing sjkvy-api.
  env: { NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8080" },
};
export default nextConfig;
