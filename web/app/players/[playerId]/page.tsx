'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Progress } from '@/components/ui/progress'
import { 
  User, 
  Calendar, 
  MapPin, 
  Ruler,
  Weight,
  Heart,
  Share2,
  ChevronLeft,
  Target,
  Shield,
  AlertCircle,
  TrendingUp,
  Activity
} from 'lucide-react'
import { usePlayerProfile } from '@/lib/supabase/football'
import { PlayerProfile } from '@/lib/types/player'
import { useSupabase } from '@/lib/supabase/provider'
import { useToast } from '@/components/ui/use-toast'
import { useFavorites } from '@/lib/services/favorites'
import { cn } from '@/lib/utils'

export default function PlayerProfilePage() {
  const params = useParams()
  const playerId = Number(params.playerId)
  const { user } = useSupabase()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState('overview')
  const { addPlayer, removePlayer, isPlayerFavorite } = useFavorites()
  
  const currentSeason = new Date().getFullYear()
  const { data: playerProfile, isLoading } = usePlayerProfile(playerId, currentSeason)

  // 즐겨찾기 토글
  const handleFavoriteToggle = async () => {
    if (!playerProfile) return
    
    const isFavorite = isPlayerFavorite(playerId)
    
    if (isFavorite) {
      removePlayer(playerId)
      toast({
        title: "즐겨찾기 제거됨",
        description: `${playerProfile.player.name}이(가) 즐겨찾기에서 제거되었습니다.`
      })
    } else {
      addPlayer({
        id: playerId,
        name: playerProfile.player.name,
        photo: playerProfile.player.photo,
        teamId: playerProfile.statistics[0]?.team.id,
        teamName: playerProfile.statistics[0]?.team.name,
        position: playerProfile.statistics[0]?.games.position
      })
      toast({
        title: "즐겨찾기 추가됨",
        description: `${playerProfile.player.name}이(가) 즐겨찾기에 추가되었습니다.`
      })
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-32 w-full mb-6" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Skeleton className="h-64" />
            <Skeleton className="h-64" />
            <Skeleton className="h-64" />
          </div>
        </div>
      </div>
    )
  }

  if (!playerProfile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">선수를 찾을 수 없습니다</h3>
              <p className="text-gray-600 mb-4">요청하신 선수 정보를 찾을 수 없습니다.</p>
              <Link href="/players">
                <Button>선수 목록으로 돌아가기</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const { player, statistics } = playerProfile
  const currentStats = statistics[0] // 현재 시즌 통계

  // 나이 계산
  const calculateAge = (birthDate: string) => {
    const birth = new Date(birthDate)
    const today = new Date()
    let age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--
    }
    return age
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/players">
                <Button variant="ghost" size="sm">
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  선수 목록
                </Button>
              </Link>
              <div className="h-6 w-px bg-gray-300" />
              <h1 className="text-xl font-semibold">선수 프로필</h1>
            </div>
            <div className="flex items-center space-x-2">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={handleFavoriteToggle}
                className={isPlayerFavorite(playerId) ? "text-red-500" : ""}
              >
                <Heart 
                  className={cn(
                    "h-5 w-5",
                    isPlayerFavorite(playerId) && "fill-current"
                  )} 
                />
              </Button>
              <Button variant="ghost" size="icon">
                <Share2 className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* 선수 정보 헤더 */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center space-x-6">
            <Image
              src={player.photo}
              alt={player.name}
              width={120}
              height={120}
              className="rounded-full object-cover"
            />
            <div className="flex-1">
              <h1 className="text-3xl font-bold mb-2">{player.name}</h1>
              <div className="flex items-center space-x-4 text-gray-600 mb-3">
                <div className="flex items-center space-x-1">
                  <MapPin className="h-4 w-4" />
                  <span>{player.nationality}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Calendar className="h-4 w-4" />
                  <span>{calculateAge(player.birth.date)}세</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Ruler className="h-4 w-4" />
                  <span>{player.height}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Weight className="h-4 w-4" />
                  <span>{player.weight}</span>
                </div>
              </div>
              {currentStats && (
                <div className="flex items-center space-x-4">
                  <Link href={`/teams/${currentStats.team.id}`}>
                    <div className="flex items-center space-x-2 hover:opacity-80">
                      <Image
                        src={currentStats.team.logo}
                        alt={currentStats.team.name}
                        width={24}
                        height={24}
                        className="object-contain"
                      />
                      <span className="font-medium">{currentStats.team.name}</span>
                    </div>
                  </Link>
                  <Badge>{currentStats.games.position}</Badge>
                  {currentStats.games.number && (
                    <Badge variant="outline">#{currentStats.games.number}</Badge>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 탭 네비게이션 */}
      <div className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">개요</TabsTrigger>
            <TabsTrigger value="stats">통계</TabsTrigger>
            <TabsTrigger value="career">경력</TabsTrigger>
          </TabsList>

          {/* 개요 탭 */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 기본 정보 */}
              <Card>
                <CardHeader>
                  <CardTitle>기본 정보</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">풀네임</span>
                      <span className="font-medium">{player.firstname} {player.lastname}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">생년월일</span>
                      <span className="font-medium">
                        {new Date(player.birth.date).toLocaleDateString('ko-KR')}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">출생지</span>
                      <span className="font-medium">
                        {player.birth.place}, {player.birth.country}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">부상 여부</span>
                      <span className="font-medium">
                        {player.injured ? (
                          <Badge variant="destructive">부상</Badge>
                        ) : (
                          <Badge variant="secondary">정상</Badge>
                        )}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* 시즌 요약 */}
              {currentStats && (
                <Card>
                  <CardHeader>
                    <CardTitle>시즌 요약</CardTitle>
                    <CardDescription>{currentStats.league.season} 시즌</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">출전</span>
                        <span className="font-medium">{currentStats.games.appearences}경기</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">선발</span>
                        <span className="font-medium">{currentStats.games.lineups}경기</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">출전 시간</span>
                        <span className="font-medium">{currentStats.games.minutes}분</span>
                      </div>
                      {currentStats.games.rating && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">평점</span>
                          <span className="font-medium">{currentStats.games.rating}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* 주요 통계 */}
            {currentStats && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <Target className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                      <div className="text-2xl font-bold">{currentStats.goals.total}</div>
                      <div className="text-sm text-gray-600">득점</div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <TrendingUp className="h-8 w-8 text-green-600 mx-auto mb-2" />
                      <div className="text-2xl font-bold">{currentStats.goals.assists || 0}</div>
                      <div className="text-sm text-gray-600">도움</div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <Activity className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
                      <div className="text-2xl font-bold">{currentStats.cards.yellow}</div>
                      <div className="text-sm text-gray-600">경고</div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <Shield className="h-8 w-8 text-red-600 mx-auto mb-2" />
                      <div className="text-2xl font-bold">{currentStats.cards.red}</div>
                      <div className="text-sm text-gray-600">퇴장</div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          {/* 통계 탭 */}
          <TabsContent value="stats" className="space-y-6">
            {currentStats ? (
              <div className="grid gap-6">
                {/* 공격 통계 */}
                <Card>
                  <CardHeader>
                    <CardTitle>공격 통계</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm text-gray-600">슈팅</span>
                        <span className="text-sm font-medium">{currentStats.shots.total || 0}</span>
                      </div>
                      <Progress value={(currentStats.shots.total || 0) * 2} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm text-gray-600">유효 슈팅</span>
                        <span className="text-sm font-medium">{currentStats.shots.on || 0}</span>
                      </div>
                      <Progress value={(currentStats.shots.on || 0) * 5} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm text-gray-600">드리블 성공</span>
                        <span className="text-sm font-medium">
                          {currentStats.dribbles.success || 0} / {currentStats.dribbles.attempts || 0}
                        </span>
                      </div>
                      <Progress 
                        value={currentStats.dribbles.attempts && currentStats.dribbles.success ? 
                          (currentStats.dribbles.success / currentStats.dribbles.attempts) * 100 : 0
                        } 
                        className="h-2" 
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* 패스 통계 */}
                <Card>
                  <CardHeader>
                    <CardTitle>패스 통계</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm text-gray-600">총 패스</span>
                        <span className="text-sm font-medium">{currentStats.passes.total || 0}</span>
                      </div>
                      <Progress value={Math.min((currentStats.passes.total || 0) / 10, 100)} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm text-gray-600">키 패스</span>
                        <span className="text-sm font-medium">{currentStats.passes.key || 0}</span>
                      </div>
                      <Progress value={(currentStats.passes.key || 0) * 10} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm text-gray-600">패스 정확도</span>
                        <span className="text-sm font-medium">{currentStats.passes.accuracy || 0}%</span>
                      </div>
                      <Progress value={currentStats.passes.accuracy || 0} className="h-2" />
                    </div>
                  </CardContent>
                </Card>

                {/* 수비 통계 */}
                <Card>
                  <CardHeader>
                    <CardTitle>수비 통계</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm text-gray-600">태클</span>
                        <span className="text-sm font-medium">{currentStats.tackles.total || 0}</span>
                      </div>
                      <Progress value={(currentStats.tackles.total || 0) * 3} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm text-gray-600">인터셉트</span>
                        <span className="text-sm font-medium">{currentStats.tackles.interceptions || 0}</span>
                      </div>
                      <Progress value={(currentStats.tackles.interceptions || 0) * 5} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm text-gray-600">경합 승리</span>
                        <span className="text-sm font-medium">
                          {currentStats.duels.won || 0} / {currentStats.duels.total || 0}
                        </span>
                      </div>
                      <Progress 
                        value={currentStats.duels.total && currentStats.duels.won ? 
                          (currentStats.duels.won / currentStats.duels.total) * 100 : 0
                        } 
                        className="h-2" 
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card>
                <CardContent className="py-8 text-center text-gray-500">
                  통계 정보가 없습니다
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* 경력 탭 */}
          <TabsContent value="career" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>시즌별 기록</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {statistics.map((stat, index) => (
                    <div key={index} className="border-b last:border-0 pb-4 last:pb-0">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-3">
                          <Image
                            src={stat.team.logo}
                            alt={stat.team.name}
                            width={32}
                            height={32}
                            className="object-contain"
                          />
                          <div>
                            <div className="font-medium">{stat.team.name}</div>
                            <div className="text-sm text-gray-600">
                              {stat.league.name} · {stat.league.season}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">
                            {stat.goals.total}골 {stat.goals.assists || 0}도움
                          </div>
                          <div className="text-sm text-gray-600">
                            {stat.games.appearences}경기 출전
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}