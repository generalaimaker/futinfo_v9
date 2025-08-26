import type { Metadata } from 'next'
import { Inter, Noto_Sans_KR } from 'next/font/google'
import '@/styles/globals.css'
import { cn } from '@/lib/utils'
import { Providers } from './providers'
import { NavbarModern } from '@/components/layout/navbar-modern'
import dynamic from 'next/dynamic'
import { Toaster } from 'sonner'
import { AnalyticsTracker } from '@/components/layout/analytics-tracker'

// 모바일 네비게이션은 클라이언트 사이드에서만 렌더링
const MobileNav = dynamic(() => import('@/components/ui/mobile-nav'), {
  ssr: false
})

const inter = Inter({ subsets: ['latin'] })
const notoSansKR = Noto_Sans_KR({ 
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-noto-sans-kr'
})

export const metadata: Metadata = {
  title: {
    default: 'Build Up - 축구 커뮤니티',
    template: '%s | Build Up'
  },
  description: '전 세계 축구 팬들이 모이는 곳. 실시간 경기 정보, 팀별 커뮤니티, 이적 소식까지 한번에!',
  keywords: ['축구', '커뮤니티', '프리미어리그', '라리가', '세리에A', '분데스리가', '리그1', '챔피언스리그'],
  authors: [{ name: 'Build Up Team' }],
  creator: 'Build Up',
  publisher: 'Build Up',
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
    title: 'Build Up - 축구 커뮤니티',
    description: '전 세계 축구 팬들이 모이는 곳',
    siteName: 'Build Up',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Build Up - 축구 커뮤니티',
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
        notoSansKR.variable,
        "min-h-screen bg-background font-sans antialiased"
      )}>
        <Providers>
          <AnalyticsTracker />
          <NavbarModern />
          <main className="min-h-screen pt-16 pb-16 md:pb-0">
            {children}
          </main>
          <MobileNav />
          <Toaster 
            position="top-center"
            richColors
            closeButton
          />
        </Providers>
      </body>
    </html>
  )
}