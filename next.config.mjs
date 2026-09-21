/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ["better-sqlite3"],
  poweredByHeader: false,
  compress: true,
};

export default nextConfig;
