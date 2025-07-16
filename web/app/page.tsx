import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowRight, Users, MessageCircle, Trophy, Globe } from 'lucide-react'

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Navigation */}
      <nav className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Trophy className="h-8 w-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">FutInfo</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/community">
                <Button variant="ghost">커뮤니티</Button>
              </Link>
              <Link href="/auth/login">
                <Button>로그인</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-5xl font-bold text-gray-900 mb-6">
            전 세계 축구 팬들이
            <br />
            <span className="text-blue-600">모이는 곳</span>
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            실시간 경기 정보부터 팀별 커뮤니티까지. 
            웹과 모바일 앱에서 완벽하게 동기화된 축구 커뮤니티를 경험해보세요.
          </p>
          <div className="flex items-center justify-center space-x-4">
            <Link href="/community">
              <Button size="lg" className="text-base">
                커뮤니티 둘러보기
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/download">
              <Button variant="outline" size="lg" className="text-base">
                앱 다운로드
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <Card className="text-center">
            <CardHeader>
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <CardTitle>팀별 커뮤니티</CardTitle>
              <CardDescription>
                좋아하는 팀의 전용 게시판에서 같은 팬들과 소통하세요
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-green-100">
                <MessageCircle className="h-6 w-6 text-green-600" />
              </div>
              <CardTitle>실시간 동기화</CardTitle>
              <CardDescription>
                웹과 모바일 앱 간 완벽한 실시간 동기화로 어디서든 연결
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100">
                <Globe className="h-6 w-6 text-purple-600" />
              </div>
              <CardTitle>글로벌 커뮤니티</CardTitle>
              <CardDescription>
                전 세계 축구 팬들과 함께 경기를 즐기고 정보를 공유
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-blue-600 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h3 className="text-3xl font-bold mb-4">
            지금 바로 시작하세요
          </h3>
          <p className="text-xl mb-8 text-blue-100">
            수천 명의 축구 팬들이 이미 함께하고 있습니다
          </p>
          <Link href="/community">
            <Button size="lg" variant="secondary" className="text-base">
              커뮤니티 참여하기
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t py-8">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Trophy className="h-6 w-6 text-blue-600" />
              <span className="font-semibold text-gray-900">FutInfo</span>
            </div>
            <p className="text-gray-600">
              © 2024 FutInfo. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </main>
  )
}