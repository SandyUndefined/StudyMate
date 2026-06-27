import type { NextConfig } from 'next'
import path from 'path'

const sharedSrc = path.resolve(__dirname, '../../packages/shared/src')

const nextConfig: NextConfig = {
  turbopack: {
    resolveAlias: {
      '@studymate/shared': '../../packages/shared/src/index.ts',
    },
  },
  webpack(config) {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@studymate/shared': sharedSrc,
    }
    return config
  },
}

export default nextConfig
