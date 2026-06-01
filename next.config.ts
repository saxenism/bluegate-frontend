import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactCompiler: true,
  devIndicators: false,
  turbopack: { rules: { '*.svg': { loaders: ['@svgr/webpack'], as: '*.js' } } },
}

export default nextConfig
