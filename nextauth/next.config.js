/** @type {import('next').NextConfig} */
const nextConfig = {
  // Output standalone build for Docker — includes all dependencies in .next/standalone
  output: 'standalone',
}

module.exports = nextConfig
