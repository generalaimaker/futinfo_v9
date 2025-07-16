import { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { BoardList } from '@/components/community/board-list'
import { Trophy, Users, MessageCircle, ArrowLeft } from 'lucide-react'

export const metadata: Metadata = {
  title: '커뮤니티',
  description: '전 세계 축구 팬들과 함께 소통하고 정보를 공유하세요',
}

export default function CommunityPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white border-b shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  홈으로
                </Button>
              </Link>
              <div className="flex items-center space-x-2">
                <Trophy className="h-6 w-6 text-blue-600" />
                <h1 className="text-xl font-bold text-gray-900">FutInfo 커뮤니티</h1>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Link href="/auth/login">
                <Button variant="outline" size="sm">
                  로그인
                </Button>
              </Link>
              <Link href="/auth/register">
                <Button size="sm">
                  회원가입
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            축구 커뮤니티에 오신 것을 환영합니다
          </h2>
          <p className="text-lg text-gray-600 mb-6">
            전 세계 축구 팬들과 함께 경기를 즐기고, 정보를 공유하며, 열정을 나누어보세요.
          </p>
          
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 max-w-md">
            <div className="text-center p-4 bg-white rounded-lg border">
              <div className="flex items-center justify-center mb-2">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900">12.5K</div>
              <div className="text-sm text-gray-600">활성 멤버</div>
            </div>
            <div className="text-center p-4 bg-white rounded-lg border">
              <div className="flex items-center justify-center mb-2">
                <MessageCircle className="h-5 w-5 text-green-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900">85.2K</div>
              <div className="text-sm text-gray-600">총 게시글</div>
            </div>
            <div className="text-center p-4 bg-white rounded-lg border">
              <div className="flex items-center justify-center mb-2">
                <Trophy className="h-5 w-5 text-yellow-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900">32</div>
              <div className="text-sm text-gray-600">팀 게시판</div>
            </div>
          </div>
        </div>

        {/* Boards */}
        <BoardList />

        {/* Footer CTA */}
        <div className="mt-12 text-center p-8 bg-white rounded-2xl border">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            모바일에서도 즐기세요
          </h3>
          <p className="text-gray-600 mb-6">
            iOS와 Android 앱에서도 동일한 커뮤니티 경험을 누릴 수 있습니다.
            실시간 동기화로 어디서든 연결되어 있어요.
          </p>
          <div className="flex items-center justify-center space-x-4">
            <Button variant="outline" asChild>
              <Link href="/download">
                앱 다운로드
              </Link>
            </Button>
            <Button asChild>
              <Link href="/community/boards/all">
                지금 시작하기
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </main>
  )
}