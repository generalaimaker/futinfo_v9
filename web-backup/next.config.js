/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  
  // Memory and stability optimizations
  experimental: {
    // Reduce memory usage during development
    workerThreads: false,
    cpus: 1,
  },
  
  // Webpack configuration for better stability
  webpack: (config, { dev, isServer }) => {
    // Disable cache in development for stability
    if (dev) {
      config.cache = false;
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
      };
    }
    
    // Add memory optimizations
    config.optimization = {
      ...config.optimization,
      minimize: !dev,
      splitChunks: dev ? false : config.optimization.splitChunks,
    };
    
    return config;
  },
  
  images: {
    domains: [
      'media.api-sports.io',
      'logos.api-sports.io', 
      'supabase.com',
      'github.com',
      'images.fotmob.com',
      'prod-files.livefootballdata.com'
    ],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
    // Disable image optimization in development for stability
    unoptimized: process.env.NODE_ENV === 'development',
  },
  
  // ngrok을 위한 설정 추가
  assetPrefix: process.env.NODE_ENV === 'production' ? '' : '',
  compress: true,
  poweredByHeader: false,
  generateEtags: false,
  async rewrites() {
    return [
      {
        source: '/:path*',
        destination: '/:path*',
      },
    ]
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
      // CSS 파일에 대한 헤더
      {
        source: '/_next/static/css/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig