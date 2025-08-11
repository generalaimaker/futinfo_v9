'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Star, Calendar, Clock, Trophy, AlertCircle, ChevronRight, Settings } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useUserPreferences, usePersonalizedFixtures } from '@/lib/hooks/useUserPreferences'
import { FootballAPIService } from '@/lib/supabase/football'
import { supabase } from '@/lib/supabase/client'

interface PersonalizedSectionProps {
  className?: string
}

export function PersonalizedSection({ className }: PersonalizedSectionProps) {
  const { preferences, isAuthenticated } = useUserPreferences()
  const { fixtures, isLoading } = usePersonalizedFixtures()
  const [userProfile, setUserProfile] = useState<any>(null)

  useEffect(() => {
    if (isAuthenticated) {
      loadUserProfile()
    }
  }, [isAuthenticated])

  const loadUserProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single()
      setUserProfile(data)
    }
  }

  // 로그인하지 않았거나 팔로우한 팀이 없으면 표시하지 않음
  if (!isAuthenticated || (preferences.favoriteTeamIds.length === 0 && preferences.favoriteLeagueIds.length === 0)) {
    return (
      <Card className={cn("dark-card p-6", className)}>
        <div className="text-center py-8">
          <Star className="w-12 h-12 mx-auto mb-4 text-yellow-500/20" />
          <h3 className="text-lg font-semibold mb-2">개인화된 콘텐츠를 받아보세요</h3>
          <p className="text-sm text-muted-foreground mb-4">
            좋아하는 팀과 리그를 팔로우하고 맞춤형 경기 일정을 확인하세요
          </p>
          <div className="flex gap-3 justify-center">
            {!isAuthenticated ? (
              <Link href="/auth/login">
                <Button className="dark-button-primary">
                  로그인하기
                </Button>
              </Link>
            ) : (
              <Link href="/follow">
                <Button className="dark-button-primary">
                  <Star className="mr-2 h-4 w-4" />
                  팀 팔로우하기
                </Button>
              </Link>
            )}
          </div>
        </div>
      </Card>
    )
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* 사용자 환영 메시지 */}
      {userProfile && (
        <Card className="dark-card p-6 bg-gradient-to-r from-primary/10 to-transparent">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold mb-1">
                안녕하세요, {userProfile.nickname || userProfile.username}님! 👋
              </h2>
              <p className="text-sm text-muted-foreground">
                {preferences.favoriteTeamIds.length}개 팀, {preferences.favoriteLeagueIds.length}개 리그를 팔로우 중
              </p>
            </div>
            <Link href="/follow">
              <Button variant="outline" size="sm">
                <Settings className="mr-2 h-4 w-4" />
                관리
              </Button>
            </Link>
          </div>
        </Card>
      )}

      {/* 내 팀 다음 경기 */}
      <Card className="dark-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-500" />
            내 팀 일정
          </h3>
          <Link href="/fixtures" className="text-sm text-primary hover:underline">
            전체 일정 보기
          </Link>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-secondary/50 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : fixtures.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="w-8 h-8 mx-auto mb-2" />
            <p>다음 7일간 예정된 경기가 없습니다</p>
          </div>
        ) : (
          <div className="space-y-3">
            {fixtures.slice(0, 5).map((fixture) => {
              const isFavoriteHome = preferences.favoriteTeamIds.includes(fixture.teams.home.id)
              const isFavoriteAway = preferences.favoriteTeamIds.includes(fixture.teams.away.id)
              const isLive = fixture.fixture.status.short === 'LIVE'
              
              return (
                <Link
                  key={fixture.fixture.id}
                  href={`/fixtures/${fixture.fixture.id}`}
                  className={cn(
                    "block p-4 rounded-lg transition-all hover:shadow-lg",
                    isLive ? "bg-green-500/10 border border-green-500/30" : "bg-secondary/50 hover:bg-secondary",
                    (isFavoriteHome || isFavoriteAway) && "ring-1 ring-yellow-500/30"
                  )}
                >
                  {/* 리그 정보 및 날짜 */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {fixture.league.name}
                      </Badge>
                      {isLive && (
                        <Badge className="bg-green-500 text-white animate-pulse">
                          LIVE {fixture.fixture.status.elapsed}'
                        </Badge>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(fixture.fixture.date).toLocaleDateString('ko-KR', {
                        month: 'short',
                        day: 'numeric',
                        weekday: 'short'
                      })} {new Date(fixture.fixture.date).toLocaleTimeString('ko-KR', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                  
                  {/* 팀 정보 */}
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <Image
                            src={fixture.teams.home.logo}
                            alt={fixture.teams.home.name}
                            width={28}
                            height={28}
                            className="object-contain"
                          />
                          <div className="flex items-center gap-2">
                            <span className={cn(
                              "font-medium",
                              isFavoriteHome && "text-yellow-500"
                            )}>
                              {fixture.teams.home.name}
                            </span>
                            {isFavoriteHome && (
                              <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                            )}
                          </div>
                        </div>
                        {isLive ? (
                          <span className="text-xl font-bold">{fixture.goals.home ?? 0}</span>
                        ) : (
                          <Badge variant="secondary">HOME</Badge>
                        )}
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Image
                            src={fixture.teams.away.logo}
                            alt={fixture.teams.away.name}
                            width={28}
                            height={28}
                            className="object-contain"
                          />
                          <div className="flex items-center gap-2">
                            <span className={cn(
                              "font-medium",
                              isFavoriteAway && "text-yellow-500"
                            )}>
                              {fixture.teams.away.name}
                            </span>
                            {isFavoriteAway && (
                              <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                            )}
                          </div>
                        </div>
                        {isLive ? (
                          <span className="text-xl font-bold">{fixture.goals.away ?? 0}</span>
                        ) : (
                          <Badge variant="secondary">AWAY</Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 경기장 정보 */}
                  {fixture.fixture.venue && (
                    <div className="mt-3 text-xs text-muted-foreground">
                      📍 {fixture.fixture.venue.name}, {fixture.fixture.venue.city}
                    </div>
                  )}
                </Link>
              )
            })}
          </div>
        )}

        {fixtures.length > 5 && (
          <div className="mt-4 text-center">
            <Link href="/fixtures">
              <Button variant="outline" className="w-full">
                더 많은 경기 보기
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        )}
      </Card>

      {/* 팀별 최근 소식 */}
      {preferences.favoriteTeamIds.length > 0 && (
        <Card className="dark-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">내 팀 소식</h3>
            <Link href="/news" className="text-sm text-primary hover:underline">
              더보기
            </Link>
          </div>
          <div className="text-center py-6 text-muted-foreground">
            <AlertCircle className="w-8 h-8 mx-auto mb-2" />
            <p className="text-sm">팀별 맞춤 뉴스를 준비 중입니다</p>
          </div>
        </Card>
      )}
    </div>
  )
}