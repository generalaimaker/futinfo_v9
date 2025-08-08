'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Star, StarOff, Search, Loader2, CheckCircle2,
  Shield, Trophy, Heart, Users
} from 'lucide-react'
import Image from 'next/image'
import { useUserPreferences } from '@/lib/hooks/useUserPreferences'
import { FootballAPIService } from '@/lib/supabase/football'
import { cn } from '@/lib/utils'

interface Team {
  team: {
    id: number
    name: string
    logo: string
  }
}

interface League {
  league: {
    id: number
    name: string
    logo: string
    type: string
  }
  country: {
    name: string
    flag: string
  }
}

export default function FollowPage() {
  const { preferences, addFavoriteTeam, removeFavoriteTeam, addFavoriteLeague, removeFavoriteLeague } = useUserPreferences()
  const [teams, setTeams] = useState<Team[]>([])
  const [leagues, setLeagues] = useState<League[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState('teams')
  const [isLoading, setIsLoading] = useState(true)
  const [teamsByLeague, setTeamsByLeague] = useState<Record<string, Team[]>>({})

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const service = new FootballAPIService()
      
      // 주요 리그 로드
      const leagueData = await service.getLeagues()
      if (leagueData?.response) {
        // 주요 리그만 필터링
        const majorLeagues = leagueData.response.filter((l: League) => 
          l.league.type === 'League' && 
          [39, 140, 135, 78, 61, 2, 94, 48].includes(l.league.id)
        )
        setLeagues(majorLeagues)
      }

      // 주요 리그의 팀들 로드
      const teamData: Record<string, Team[]> = {}
      const mainLeagues = [
        { id: 39, name: 'Premier League' },
        { id: 140, name: 'La Liga' },
        { id: 135, name: 'Serie A' },
        { id: 78, name: 'Bundesliga' },
        { id: 61, name: 'Ligue 1' },
        { id: 48, name: 'K League 1' }
      ]

      for (const league of mainLeagues) {
        const teamResponse = await service.getTeams({ league: league.id })
        if (teamResponse?.response) {
          teamData[league.name] = teamResponse.response
        }
      }

      setTeamsByLeague(teamData)
      
      // 모든 팀을 하나의 배열로 합치기
      const allTeams = Object.values(teamData).flat()
      setTeams(allTeams)
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const filteredTeams = teams.filter(t => 
    t.team.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredLeagues = leagues.filter(l => 
    l.league.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.country.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const isTeamFavorite = (teamId: number) => 
    preferences.favoriteTeamIds.includes(teamId)

  const isLeagueFavorite = (leagueId: number) => 
    preferences.favoriteLeagueIds.includes(leagueId)

  const toggleTeamFavorite = async (teamId: number) => {
    if (isTeamFavorite(teamId)) {
      await removeFavoriteTeam(teamId)
    } else {
      await addFavoriteTeam(teamId)
    }
  }

  const toggleLeagueFavorite = async (leagueId: number) => {
    if (isLeagueFavorite(leagueId)) {
      await removeFavoriteLeague(leagueId)
    } else {
      await addFavoriteLeague(leagueId)
    }
  }

  return (
    <div className="min-h-screen lg:ml-64 p-4 lg:p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold mb-2">팀 & 리그 팔로우</h1>
          <p className="text-muted-foreground">
            좋아하는 팀과 리그를 팔로우하고 맞춤형 알림을 받아보세요
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="dark-card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">팔로우한 팀</p>
                <p className="text-2xl font-bold">{preferences.favoriteTeamIds.length}</p>
              </div>
              <Shield className="w-8 h-8 text-primary opacity-20" />
            </div>
          </Card>
          <Card className="dark-card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">팔로우한 리그</p>
                <p className="text-2xl font-bold">{preferences.favoriteLeagueIds.length}</p>
              </div>
              <Trophy className="w-8 h-8 text-primary opacity-20" />
            </div>
          </Card>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="팀 또는 리그 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="teams">팀</TabsTrigger>
            <TabsTrigger value="leagues">리그</TabsTrigger>
          </TabsList>

          <TabsContent value="teams" className="mt-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin" />
              </div>
            ) : (
              <div className="space-y-6">
                {/* 팔로우한 팀 */}
                {preferences.favoriteTeamIds.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                      <Heart className="w-5 h-5 text-red-500" />
                      팔로우한 팀
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {teams
                        .filter(t => isTeamFavorite(t.team.id))
                        .map((team) => (
                          <Card 
                            key={team.team.id} 
                            className={cn(
                              "dark-card p-4 cursor-pointer transition-all",
                              "border-primary/50 bg-primary/5"
                            )}
                            onClick={() => toggleTeamFavorite(team.team.id)}
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center overflow-hidden">
                                <Image
                                  src={team.team.logo}
                                  alt={team.team.name}
                                  width={36}
                                  height={36}
                                  className="object-contain"
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium truncate">{team.team.name}</p>
                              </div>
                              <Star className="w-5 h-5 text-primary fill-primary" />
                            </div>
                          </Card>
                        ))}
                    </div>
                  </div>
                )}

                {/* 리그별 팀 목록 */}
                {Object.entries(teamsByLeague).map(([leagueName, leagueTeams]) => {
                  const displayTeams = searchQuery 
                    ? leagueTeams.filter(t => 
                        t.team.name.toLowerCase().includes(searchQuery.toLowerCase())
                      )
                    : leagueTeams

                  if (displayTeams.length === 0) return null

                  return (
                    <div key={leagueName}>
                      <h3 className="text-lg font-semibold mb-3">{leagueName}</h3>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {displayTeams.map((team) => (
                          <Card 
                            key={team.team.id} 
                            className={cn(
                              "dark-card p-4 cursor-pointer transition-all hover:border-primary/50",
                              isTeamFavorite(team.team.id) && "border-primary/50 bg-primary/5"
                            )}
                            onClick={() => toggleTeamFavorite(team.team.id)}
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center overflow-hidden">
                                <Image
                                  src={team.team.logo}
                                  alt={team.team.name}
                                  width={36}
                                  height={36}
                                  className="object-contain"
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium truncate">{team.team.name}</p>
                              </div>
                              {isTeamFavorite(team.team.id) ? (
                                <Star className="w-5 h-5 text-primary fill-primary" />
                              ) : (
                                <StarOff className="w-5 h-5 text-muted-foreground" />
                              )}
                            </div>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="leagues" className="mt-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin" />
              </div>
            ) : (
              <div className="grid gap-3">
                {filteredLeagues.map((league) => (
                  <Card 
                    key={league.league.id} 
                    className={cn(
                      "dark-card p-4 cursor-pointer transition-all hover:border-primary/50",
                      isLeagueFavorite(league.league.id) && "border-primary/50 bg-primary/5"
                    )}
                    onClick={() => toggleLeagueFavorite(league.league.id)}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-lg bg-white/10 flex items-center justify-center overflow-hidden">
                        <Image
                          src={league.league.logo}
                          alt={league.league.name}
                          width={48}
                          height={48}
                          className="object-contain"
                        />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-lg">{league.league.name}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Image
                            src={league.country.flag || '/placeholder.png'}
                            alt={league.country.name}
                            width={20}
                            height={15}
                            className="object-contain"
                          />
                          <span>{league.country.name}</span>
                        </div>
                      </div>
                      {isLeagueFavorite(league.league.id) ? (
                        <CheckCircle2 className="w-6 h-6 text-primary" />
                      ) : (
                        <div className="w-6 h-6 rounded-full border-2 border-muted-foreground/50" />
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Save button */}
        <div className="flex justify-end pt-4">
          <Button className="dark-button-primary">
            <CheckCircle2 className="w-4 h-4 mr-2" />
            설정 저장됨
          </Button>
        </div>
      </div>
    </div>
  )
}