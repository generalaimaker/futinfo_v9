'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Search, ChevronLeft } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import footballAPIService from '@/lib/supabase/football'
import { Skeleton } from '@/components/ui/skeleton'
import { SUPPORTED_LEAGUES } from '@/lib/types/football'

export default function TeamsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedLeague, setSelectedLeague] = useState<number | null>(null)

  // 리그 목록 가져오기
  const { data: leagues } = useQuery({
    queryKey: ['leagues'],
    queryFn: () => footballAPIService.getLeagues({ current: true })
  })

  // 선택된 리그의 팀 목록 가져오기
  const { data: standings, isLoading } = useQuery({
    queryKey: ['leagueTeams', selectedLeague],
    queryFn: async () => {
      if (!selectedLeague) return null
      const currentSeason = new Date().getFullYear()
      return footballAPIService.getStandings({ league: selectedLeague, season: currentSeason })
    },
    enabled: !!selectedLeague
  })

  // 팀 목록 추출 및 필터링
  const teams = useMemo(() => {
    if (!standings || !standings.response || standings.response.length === 0) return []
    
    const allTeams = standings.response[0].league.standings.flat().map(standing => ({
      id: standing.team.id,
      name: standing.team.name,
      logo: standing.team.logo,
      rank: standing.rank,
      points: standing.points,
      played: standing.all.played,
      win: standing.all.win,
      draw: standing.all.draw,
      lose: standing.all.lose,
      goalsDiff: standing.goalsDiff
    }))

    // 검색어로 필터링
    if (searchQuery) {
      return allTeams.filter(team => 
        team.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    return allTeams
  }, [standings, searchQuery])

  // 지원되는 리그만 필터링
  const supportedLeagues = useMemo(() => {
    if (!leagues) return []
    return leagues.response.filter(league => 
      Object.values(SUPPORTED_LEAGUES).includes(league.league.id as any)
    )
  }, [leagues])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/">
                <Button variant="ghost" size="sm">
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  홈으로
                </Button>
              </Link>
              <div className="h-6 w-px bg-gray-300" />
              <h1 className="text-xl font-semibold">팀 목록</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* 검색 및 리그 선택 */}
        <div className="mb-6 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="팀 이름으로 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* 리그 선택 버튼들 */}
          <div className="flex flex-wrap gap-2">
            {supportedLeagues.map((leagueData) => (
              <Button
                key={leagueData.league.id}
                variant={selectedLeague === leagueData.league.id ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedLeague(leagueData.league.id)}
              >
                {leagueData.league.name}
              </Button>
            ))}
          </div>
        </div>

        {/* 팀 목록 */}
        {!selectedLeague ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-gray-500">리그를 선택하여 팀 목록을 확인하세요</p>
            </CardContent>
          </Card>
        ) : isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(12)].map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
        ) : teams.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-gray-500">검색 결과가 없습니다</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {teams.map((team) => (
              <Link key={team.id} href={`/teams/${team.id}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-4">
                      <Image
                        src={team.logo}
                        alt={team.name}
                        width={48}
                        height={48}
                        className="object-contain"
                      />
                      <div className="flex-1">
                        <h3 className="font-semibold">{team.name}</h3>
                        <div className="text-sm text-gray-600">
                          {team.rank}위 · {team.points}점
                        </div>
                        <div className="text-xs text-gray-500">
                          {team.played}경기 {team.win}승 {team.draw}무 {team.lose}패
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}