'use client'

import { useState, useCallback, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Search, ChevronLeft, Users, User, Loader2 } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import footballAPIService from '@/lib/supabase/football'
import { Skeleton } from '@/components/ui/skeleton'
import { convertKoreanToEnglish, isKoreanQuery } from '@/lib/utils/korean-search-mapping'

export default function SearchPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [activeTab, setActiveTab] = useState('teams')

  // Custom debounce implementation
  const debouncedSearch = useCallback(() => {
    let timeoutId: NodeJS.Timeout
    return (query: string) => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(() => {
        setDebouncedQuery(query)
      }, 500)
    }
  }, [])()

  useEffect(() => {
    if (searchQuery.length >= 2) {
      debouncedSearch(searchQuery)
    } else {
      setDebouncedQuery('')
    }
  }, [searchQuery, debouncedSearch])

  // 한국어 검색어 처리
  const searchQueries = debouncedQuery.length >= 2 
    ? [debouncedQuery, ...(isKoreanQuery(debouncedQuery) ? convertKoreanToEnglish(debouncedQuery) : [])]
    : []

  // 팀 검색
  const { data: teamsData, isLoading: teamsLoading } = useQuery({
    queryKey: ['searchTeams', searchQueries],
    queryFn: async () => {
      const results: any[] = []
      const seenIds = new Set<number>()
      
      for (const query of searchQueries) {
        try {
          const data = await footballAPIService.searchTeams(query)
          // 중복 제거
          data.forEach((team: any) => {
            if (!seenIds.has(team.team.id)) {
              seenIds.add(team.team.id)
              results.push(team)
            }
          })
        } catch (error) {
          console.error('Team search error:', error)
        }
      }
      
      return results
    },
    enabled: searchQueries.length > 0
  })

  // 선수 검색
  const { data: playersData, isLoading: playersLoading } = useQuery({
    queryKey: ['searchPlayers', searchQueries],
    queryFn: async () => {
      const results: any[] = []
      const seenIds = new Set<number>()
      
      for (const query of searchQueries) {
        try {
          const data = await footballAPIService.searchPlayers(query)
          // 중복 제거
          data.forEach((player: any) => {
            if (!seenIds.has(player.player.id)) {
              seenIds.add(player.player.id)
              results.push(player)
            }
          })
        } catch (error) {
          console.error('Player search error:', error)
        }
      }
      
      return results
    },
    enabled: searchQueries.length > 0
  })

  const isSearching = debouncedQuery.length >= 2 && (teamsLoading || playersLoading)
  const hasResults = teamsData?.length || playersData?.length

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
              <h1 className="text-xl font-semibold">검색</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* 검색 입력 */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              type="text"
              placeholder="팀 또는 선수 이름으로 검색... (한글/영문)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 text-lg"
              autoFocus
            />
            {isSearching && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 animate-spin" />
            )}
          </div>
          <p className="text-sm text-gray-500 mt-2">
            최소 2글자 이상 입력하세요 • 한국어 검색 지원 (예: 맨유, 손흥민)
          </p>
          {debouncedQuery && isKoreanQuery(debouncedQuery) && (
            <p className="text-sm text-blue-600 mt-1">
              한국어 검색 활성화 - 영문으로도 검색 중...
            </p>
          )}
        </div>

        {/* 검색 결과 */}
        {debouncedQuery.length >= 2 ? (
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="teams" className="flex items-center space-x-2">
                <Users className="h-4 w-4" />
                <span>팀 ({teamsData?.length || 0})</span>
              </TabsTrigger>
              <TabsTrigger value="players" className="flex items-center space-x-2">
                <User className="h-4 w-4" />
                <span>선수 ({playersData?.length || 0})</span>
              </TabsTrigger>
            </TabsList>

            {/* 팀 검색 결과 */}
            <TabsContent value="teams" className="mt-6">
              {teamsLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-20" />
                  ))}
                </div>
              ) : teamsData && teamsData.length > 0 ? (
                <div className="grid gap-4">
                  {teamsData.map((team: any) => (
                    <Link key={team.team.id} href={`/teams/${team.team.id}`}>
                      <Card className="hover:shadow-md transition-shadow cursor-pointer">
                        <CardContent className="p-4">
                          <div className="flex items-center space-x-4">
                            <Image
                              src={team.team.logo}
                              alt={team.team.name}
                              width={48}
                              height={48}
                              className="object-contain"
                            />
                            <div className="flex-1">
                              <h3 className="font-semibold">{team.team.name}</h3>
                              <div className="flex items-center space-x-2 text-sm text-gray-600">
                                <span>{team.team.country}</span>
                                {team.team.founded && (
                                  <>
                                    <span>·</span>
                                    <span>창단 {team.team.founded}년</span>
                                  </>
                                )}
                              </div>
                            </div>
                            {team.venue && (
                              <div className="text-right text-sm text-gray-600">
                                <div>{team.venue.name}</div>
                                <div>수용인원: {team.venue.capacity?.toLocaleString()}</div>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">검색 결과가 없습니다</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* 선수 검색 결과 */}
            <TabsContent value="players" className="mt-6">
              {playersLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-20" />
                  ))}
                </div>
              ) : playersData && playersData.length > 0 ? (
                <div className="grid gap-4">
                  {playersData.map((data: any) => {
                    const player = data.player
                    const stats = data.statistics[0]
                    
                    return (
                      <Link key={player.id} href={`/players/${player.id}`}>
                        <Card className="hover:shadow-md transition-shadow cursor-pointer">
                          <CardContent className="p-4">
                            <div className="flex items-center space-x-4">
                              <Image
                                src={player.photo}
                                alt={player.name}
                                width={48}
                                height={48}
                                className="rounded-full object-cover"
                              />
                              <div className="flex-1">
                                <h3 className="font-semibold">{player.name}</h3>
                                <div className="flex items-center space-x-2 text-sm text-gray-600">
                                  <span>{player.nationality}</span>
                                  <span>·</span>
                                  <span>{player.age}세</span>
                                  {stats && (
                                    <>
                                      <span>·</span>
                                      <Badge variant="outline" className="text-xs">
                                        {stats.games.position}
                                      </Badge>
                                    </>
                                  )}
                                </div>
                              </div>
                              {stats && (
                                <div className="flex items-center space-x-3">
                                  <Image
                                    src={stats.team.logo}
                                    alt={stats.team.name}
                                    width={32}
                                    height={32}
                                    className="object-contain"
                                  />
                                  <div className="text-sm">
                                    <div className="font-medium">{stats.team.name}</div>
                                    <div className="text-gray-600">
                                      {stats.league.name}
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    )
                  })}
                </div>
              ) : (
                <Card>
                  <CardContent className="py-12 text-center">
                    <User className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">검색 결과가 없습니다</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        ) : searchQuery.length > 0 && searchQuery.length < 2 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Search className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">최소 2글자 이상 입력해주세요</p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <Search className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">팀 또는 선수를 검색해보세요</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}