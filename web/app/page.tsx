'use client'

import { useEffect, useState } from 'react'
import { MatchesSectionSimple } from '@/components/home/MatchesSectionSimple'
import { useSupabase } from '@/lib/supabase/provider'
import { CommunityService } from '@/lib/supabase/community'
import { useTeamProfile, useTeamNextFixtures } from '@/lib/supabase/football'
import { Heart, Calendar, Trophy, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import Image from 'next/image'

export default function HomePage() {
  const { user } = useSupabase()
  const [userProfile, setUserProfile] = useState<any>(null)
  
  // 사용자 프로필 로드
  useEffect(() => {
    if (user) {
      loadUserProfile()
    }
  }, [user])

  const loadUserProfile = async () => {
    try {
      const profile = await CommunityService.getCurrentUserProfile()
      setUserProfile(profile)
    } catch (error) {
      console.error('Error loading user profile:', error)
    }
  }

  // 사용자가 좋아하는 팀 정보 가져오기
  const { data: teamProfile } = useTeamProfile(
    userProfile?.favoriteTeamId || 0, 
    { enabled: !!userProfile?.favoriteTeamId }
  )
  const { data: nextFixtures } = useTeamNextFixtures(
    userProfile?.favoriteTeamId || 0,
    { enabled: !!userProfile?.favoriteTeamId }
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">FutInfo Web</h1>
        
        {/* 사용자 팀 정보 섹션 */}
        {user && userProfile?.favoriteTeamId && teamProfile && (
          <Card className="mb-6 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center space-x-2">
                <Heart className="h-5 w-5 text-red-500" />
                <span>내 팀: {teamProfile.team.name}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
                  {teamProfile.team.logo ? (
                    <Image
                      src={teamProfile.team.logo}
                      alt={teamProfile.team.name}
                      width={32}
                      height={32}
                      className="rounded-full"
                    />
                  ) : (
                    <Trophy className="h-6 w-6 text-blue-600" />
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{teamProfile.team.name}</h3>
                  <p className="text-sm text-gray-600">{teamProfile.team.country}</p>
                </div>
              </div>
              
              {/* 다음 경기 */}
              {nextFixtures && nextFixtures.response && nextFixtures.response.length > 0 && (
                <div className="bg-white rounded-lg p-4 mb-4">
                  <h4 className="font-semibold mb-2 flex items-center space-x-2">
                    <Calendar className="h-4 w-4" />
                    <span>다음 경기</span>
                  </h4>
                  <div className="space-y-2">
                    {nextFixtures.response.slice(0, 2).map((fixture: any) => (
                      <div key={fixture.fixture.id} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Image
                            src={fixture.teams.home.logo}
                            alt={fixture.teams.home.name}
                            width={16}
                            height={16}
                          />
                          <span className="text-sm">{fixture.teams.home.name}</span>
                        </div>
                        <div className="text-sm text-gray-600">
                          {new Date(fixture.fixture.date).toLocaleDateString('ko-KR', { 
                            month: 'short', 
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm">{fixture.teams.away.name}</span>
                          <Image
                            src={fixture.teams.away.logo}
                            alt={fixture.teams.away.name}
                            width={16}
                            height={16}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="flex space-x-3">
                <Link href={`/community/boards/team_${userProfile.favoriteTeamId}`}>
                  <Button size="sm" className="flex items-center space-x-2">
                    <span>팀 게시판</span>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href={`/teams/${userProfile.favoriteTeamId}`}>
                  <Button variant="outline" size="sm">
                    팀 상세보기
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Main Content */}
        <main className="bg-white rounded-lg shadow h-[600px]">
          <MatchesSectionSimple />
        </main>
        
        {/* Test Links */}
        <div className="mt-4 space-x-4">
          <a href="/test-api" className="text-blue-600 hover:underline">
            API Test
          </a>
          <a href="/test-fixtures" className="text-blue-600 hover:underline">
            Fixtures Test
          </a>
          <a href="/test-edge-basic" className="text-blue-600 hover:underline">
            Basic Edge Test
          </a>
          <a href="/test-july" className="text-blue-600 hover:underline">
            July Test
          </a>
          <a href="/test-main-simple" className="text-blue-600 hover:underline">
            Simple Main Test
          </a>
          <a href="/test-compare" className="text-blue-600 hover:underline">
            Compare API Calls
          </a>
          <a href="/test-edge-direct" className="text-blue-600 hover:underline">
            Edge Direct Test
          </a>
          <a href="/test-same-as-main" className="text-blue-600 hover:underline">
            Same as Main Test
          </a>
        </div>
      </div>
    </div>
  )
}