/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      'media.api-sports.io',
      'logos.api-sports.io', 
      'supabase.com',
      'github.com'
    ],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
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