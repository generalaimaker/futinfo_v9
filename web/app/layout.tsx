import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import '@/styles/globals.css'
import { cn } from '@/lib/utils'
import { Providers } from './providers'
import { Navbar } from '@/components/layout/navbar-simple'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: {
    default: 'FutInfo - 축구 커뮤니티',
    template: '%s | FutInfo'
  },
  description: '전 세계 축구 팬들이 모이는 곳. 실시간 경기 정보, 팀별 커뮤니티, 이적 소식까지 한번에!',
  keywords: ['축구', '커뮤니티', '프리미어리그', '라리가', '세리에A', '분데스리가', '리그1', '챔피언스리그'],
  authors: [{ name: 'FutInfo Team' }],
  creator: 'FutInfo',
  publisher: 'FutInfo',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  openGraph: {
    type: 'website',
    locale: 'ko_KR',
    url: '/',
    title: 'FutInfo - 축구 커뮤니티',
    description: '전 세계 축구 팬들이 모이는 곳',
    siteName: 'FutInfo',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FutInfo - 축구 커뮤니티',
    description: '전 세계 축구 팬들이 모이는 곳',
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body className={cn(
        inter.className,
        "min-h-screen bg-background font-sans antialiased"
      )}>
        <Providers>
          <div className="relative flex min-h-screen flex-col">
            <Navbar />
            <div className="flex-1">
              {children}
            </div>
          </div>
        </Providers>
      </body>
    </html>
  )
}