/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  basePath: process.env.NODE_ENV === 'production' ? '/JuzuliMP.github.io' : '',
  images: {
    unoptimized: true,
  },
  // Disable server actions for static export
  experimental: {
    serverActions: false,
  }
}

module.exports = nextConfig
