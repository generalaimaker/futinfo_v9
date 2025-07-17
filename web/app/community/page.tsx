'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { 
  Users, MessageSquare, TrendingUp, Crown, Shield, Heart,
  ArrowRight, Sparkles, Trophy, Zap, Star
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CommunityService } from '@/lib/supabase/community'
import { CommunityBoard } from '@/lib/types/community'
import { useSupabase } from '@/lib/supabase/provider'
import { BoardList } from '@/components/community/board-list'

const popularTeams = [
  { id: 33, name: 'Man United', logo: 'https://media.api-sports.io/football/teams/33.png', memberCount: '2.3K' },
  { id: 40, name: 'Liverpool', logo: 'https://media.api-sports.io/football/teams/40.png', memberCount: '2.1K' },
  { id: 541, name: 'Real Madrid', logo: 'https://media.api-sports.io/football/teams/541.png', memberCount: '3.5K' },
  { id: 529, name: 'Barcelona', logo: 'https://media.api-sports.io/football/teams/529.png', memberCount: '3.2K' },
  { id: 157, name: 'Bayern', logo: 'https://media.api-sports.io/football/teams/157.png', memberCount: '1.8K' },
]

export default function CommunityPage() {
  const router = useRouter()
  const { user } = useSupabase()
  const [isLoading, setIsLoading] = useState(false)

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-4xl mx-auto">
            {/* 히어로 섹션 */}
            <div className="text-center mb-12">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mb-6 shadow-lg animate-pulse">
                <Users className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
                축구 팬들의 열정이 만나는 곳
              </h1>
              <p className="text-xl text-gray-600 mb-8">
                전 세계 축구 팬들과 함께 경기를 분석하고, 팀을 응원하며, 특별한 순간을 공유하세요
              </p>
            </div>

            {/* 특징 카드들 */}
            <div className="grid md:grid-cols-3 gap-6 mb-12">
              <Card className="hover:shadow-xl transition-all duration-300 border-0 bg-white/80 backdrop-blur transform hover:-translate-y-1">
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <MessageSquare className="w-8 h-8 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">실시간 토론</h3>
                  <p className="text-gray-600">
                    경기 중 실시간으로 다른 팬들과 소통하며 열정을 나누세요
                  </p>
                </CardContent>
              </Card>

              <Card className="hover:shadow-xl transition-all duration-300 border-0 bg-white/80 backdrop-blur transform hover:-translate-y-1">
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Shield className="w-8 h-8 text-purple-600" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">팀별 커뮤니티</h3>
                  <p className="text-gray-600">
                    응원하는 팀의 전용 공간에서 진정한 팬들과 함께하세요
                  </p>
                </CardContent>
              </Card>

              <Card className="hover:shadow-xl transition-all duration-300 border-0 bg-white/80 backdrop-blur transform hover:-translate-y-1">
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Trophy className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">전문가 분석</h3>
                  <p className="text-gray-600">
                    깊이 있는 전술 분석과 통계로 축구를 더 깊게 이해하세요
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* CTA 섹션 */}
            <div className="text-center">
              <Card className="border-0 bg-gradient-to-r from-blue-600 to-purple-600 text-white overflow-hidden relative">
                <div className="absolute inset-0 bg-black/10"></div>
                <CardContent className="p-8 relative z-10">
                  <Sparkles className="w-12 h-12 mx-auto mb-4 animate-pulse" />
                  <h2 className="text-2xl font-bold mb-4">
                    지금 시작하고 특별한 혜택을 받으세요!
                  </h2>
                  <p className="text-lg mb-6 opacity-90">
                    가입하면 좋아하는 팀의 전용 배지와 커뮤니티 특권을 드립니다
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button 
                      size="lg" 
                      variant="secondary"
                      className="font-semibold shadow-lg hover:shadow-xl transition-all"
                      onClick={() => router.push('/auth/login')}
                    >
                      로그인하기
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                    <Button 
                      size="lg" 
                      variant="outline"
                      className="bg-white/10 hover:bg-white/20 text-white border-white/30"
                      onClick={() => router.push('/auth/register')}
                    >
                      회원가입
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* 인기 팀 미리보기 */}
              <div className="mt-12">
                <h3 className="text-lg font-semibold text-gray-700 mb-4">
                  인기 팀 커뮤니티 둘러보기
                </h3>
                <div className="flex flex-wrap justify-center gap-4">
                  {popularTeams.map(team => (
                    <Card key={team.id} className="cursor-pointer hover:shadow-md transition-all transform hover:scale-105">
                      <CardContent className="p-4 flex items-center space-x-3">
                        <img 
                          src={team.logo} 
                          alt={team.name}
                          className="w-10 h-10 object-contain"
                        />
                        <div>
                          <p className="font-medium">{team.name}</p>
                          <p className="text-xs text-gray-500">{team.memberCount} 팬</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* 헤더 */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">커뮤니티</h1>
              <p className="text-gray-600">
                축구 팬들과 함께 열정을 나누고 소통하세요
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="secondary" className="px-3 py-1">
                <TrendingUp className="w-3 h-3 mr-1" />
                실시간 인기
              </Badge>
            </div>
          </div>

          {/* 빠른 통계 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4 flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">12.5K</p>
                  <p className="text-xs text-gray-600">활성 사용자</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center space-x-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">3.2K</p>
                  <p className="text-xs text-gray-600">오늘의 게시글</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <Zap className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">156</p>
                  <p className="text-xs text-gray-600">실시간 토론</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center space-x-3">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Star className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">89</p>
                  <p className="text-xs text-gray-600">인기 게시글</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* 게시판 목록 */}
        <BoardList />
      </div>
    </div>
  )
}