/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  basePath: process.env.NODE_ENV === 'production' ? '/JuzuliMP.github.io' : '',
  images: {
    unoptimized: true,
  },
  assetPrefix: process.env.NODE_ENV === 'production' ? '/JuzuliMP.github.io' : '',
  // Ensure trailing slashes are handled correctly
  trailingSlash: true,
}

module.exports = nextConfig
