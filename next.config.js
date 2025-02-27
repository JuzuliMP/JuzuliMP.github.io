/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  basePath: '',
  // basePath: 'production' ? '/JuzuliMP.github.io' : '',
  images: {
    unoptimized: true,
  },
  // assetPrefix: process.env.NODE_ENV === 'production' ? '/JuzuliMP.github.io' : '',
  assetPrefix: '',
  // Ensure trailing slashes are handled correctly
  trailingSlash: true,
  webpack: (config) => {
    config.resolve.alias.canvas = false;
    config.resolve.fallback = {
      ...config.resolve.fallback,
      canvas: false,
    };
    return config;
  },
}

module.exports = nextConfig
