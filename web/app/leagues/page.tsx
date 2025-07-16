'use client'

import { useState } from 'react'
import { Trophy, ChevronRight, Globe, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useLeagues, useStandings } from '@/lib/supabase/football'
import { SUPPORTED_LEAGUES, getCurrentSeason, getLeagueName } from '@/lib/types/football'
import Link from 'next/link'
import Image from 'next/image'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default function LeaguesPage() {
  const [selectedLeague, setSelectedLeague] = useState<number>(SUPPORTED_LEAGUES.PREMIER_LEAGUE)
  const season = getCurrentSeason(selectedLeague)
  
  const { data: leaguesData, isLoading: leaguesLoading } = useLeagues({ current: true })
  const { data: standingsData, isLoading: standingsLoading } = useStandings({ 
    league: selectedLeague, 
    season 
  })
  
  // 인기 리그 목록
  const popularLeagues = [
    { id: SUPPORTED_LEAGUES.PREMIER_LEAGUE, name: 'Premier League', country: '🏴󐁧󐁢󐁥󐁮󐁧󐁿' },
    { id: SUPPORTED_LEAGUES.LA_LIGA, name: 'La Liga', country: '🇪🇸' },
    { id: SUPPORTED_LEAGUES.SERIE_A, name: 'Serie A', country: '🇮🇹' },
    { id: SUPPORTED_LEAGUES.BUNDESLIGA, name: 'Bundesliga', country: '🇩🇪' },
    { id: SUPPORTED_LEAGUES.LIGUE_1, name: 'Ligue 1', country: '🇫🇷' },
    { id: SUPPORTED_LEAGUES.K_LEAGUE, name: 'K League 1', country: '🇰🇷' },
  ]
  
  const standings = standingsData?.response?.[0]?.league?.standings?.[0] || []

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white border-b shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/">
                <Button variant="ghost" size="sm">
                  <ChevronRight className="h-4 w-4 mr-1 rotate-180" />
                  홈
                </Button>
              </Link>
              <div className="flex items-center space-x-2">
                <Trophy className="h-6 w-6 text-blue-600" />
                <h1 className="text-xl font-bold">리그</h1>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {/* 리그 선택 탭 */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="p-4">
            <h2 className="text-lg font-semibold mb-4">인기 리그</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
              {popularLeagues.map((league) => (
                <button
                  key={league.id}
                  onClick={() => setSelectedLeague(league.id)}
                  className={`p-3 rounded-lg border transition-all ${
                    selectedLeague === league.id 
                      ? 'border-blue-600 bg-blue-50 text-blue-600' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-2xl mb-1">{league.country}</div>
                  <div className="text-xs font-medium">{league.name}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 선택된 리그 정보 */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6 border-b">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold mb-1">{getLeagueName(selectedLeague)}</h2>
                <p className="text-gray-600">시즌 {season}/{season + 1}</p>
              </div>
              <div className="flex space-x-3">
                <Link href={`/fixtures?league=${selectedLeague}`}>
                  <Button variant="outline">
                    경기 일정
                  </Button>
                </Link>
                <Link href={`/leagues/${selectedLeague}/teams`}>
                  <Button>
                    <Users className="h-4 w-4 mr-2" />
                    팀 목록
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          {/* 순위표 */}
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4">순위표</h3>
            
            {standingsLoading ? (
              <div className="space-y-3">
                {[...Array(10)].map((_, i) => (
                  <div key={i} className="flex items-center space-x-4">
                    <Skeleton className="h-8 w-8" />
                    <Skeleton className="h-8 w-12" />
                    <Skeleton className="h-8 flex-1" />
                    <Skeleton className="h-8 w-20" />
                  </div>
                ))}
              </div>
            ) : standings.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-sm text-gray-600 border-b">
                      <th className="pb-3 pr-4">#</th>
                      <th className="pb-3 pr-4">팀</th>
                      <th className="pb-3 px-2 text-center">경기</th>
                      <th className="pb-3 px-2 text-center">승</th>
                      <th className="pb-3 px-2 text-center">무</th>
                      <th className="pb-3 px-2 text-center">패</th>
                      <th className="pb-3 px-2 text-center">득실</th>
                      <th className="pb-3 px-2 text-center font-semibold">승점</th>
                    </tr>
                  </thead>
                  <tbody>
                    {standings.map((standing, index) => {
                      const isTopPosition = standing.rank <= 4
                      const isRelegation = standing.rank >= standings.length - 2
                      
                      return (
                        <tr 
                          key={standing.team.id}
                          className="border-b hover:bg-gray-50 transition-colors"
                        >
                          <td className="py-3 pr-4">
                            <div className={`
                              w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold
                              ${isTopPosition ? 'bg-blue-100 text-blue-600' : 
                                isRelegation ? 'bg-red-100 text-red-600' : 
                                'bg-gray-100 text-gray-600'}
                            `}>
                              {standing.rank}
                            </div>
                          </td>
                          <td className="py-3 pr-4">
                            <Link 
                              href={`/teams/${standing.team.id}`}
                              className="flex items-center space-x-3 hover:text-blue-600 transition-colors"
                            >
                              <Image
                                src={standing.team.logo}
                                alt={standing.team.name}
                                width={24}
                                height={24}
                                className="object-contain"
                              />
                              <span className="font-medium">{standing.team.name}</span>
                            </Link>
                          </td>
                          <td className="py-3 px-2 text-center">{standing.all.played}</td>
                          <td className="py-3 px-2 text-center">{standing.all.win}</td>
                          <td className="py-3 px-2 text-center">{standing.all.draw}</td>
                          <td className="py-3 px-2 text-center">{standing.all.lose}</td>
                          <td className="py-3 px-2 text-center">
                            <span className={standing.goalsDiff > 0 ? 'text-green-600' : standing.goalsDiff < 0 ? 'text-red-600' : ''}>
                              {standing.goalsDiff > 0 && '+'}{standing.goalsDiff}
                            </span>
                          </td>
                          <td className="py-3 px-2 text-center font-bold">{standing.points}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                순위표 정보를 불러올 수 없습니다.
              </div>
            )}
            
            {/* 범례 */}
            {standings.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-4 text-sm">
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-blue-100 rounded-full"></div>
                  <span className="text-gray-600">챔피언스리그</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-red-100 rounded-full"></div>
                  <span className="text-gray-600">강등</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 다른 리그 둘러보기 */}
        <div className="mt-6 bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold mb-4">다른 리그 둘러보기</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {Object.entries(SUPPORTED_LEAGUES)
              .filter(([_, id]) => id !== selectedLeague)
              .slice(0, 6)
              .map(([key, id]) => (
                <button
                  key={id}
                  onClick={() => setSelectedLeague(id)}
                  className="flex items-center space-x-3 p-3 rounded-lg border hover:border-blue-300 hover:bg-blue-50 transition-all"
                >
                  <Globe className="h-5 w-5 text-gray-400" />
                  <span className="font-medium">{getLeagueName(id)}</span>
                  <ChevronRight className="h-4 w-4 text-gray-400 ml-auto" />
                </button>
              ))}
          </div>
        </div>
      </main>
    </div>
  )
}