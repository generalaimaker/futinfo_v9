'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { MainLayout } from '@/components/layout/MainLayout'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  Calendar, 
  Trophy, 
  Users, 
  BarChart3, 
  Newspaper,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Star,
  StarOff
} from 'lucide-react'
import { useLeagueDetails, useLeagueStandings, useLeagueFixtures } from '@/lib/supabase/football'
import { formatDate, isLiveMatch, isFinishedMatch } from '@/lib/types/football'
import { cn } from '@/lib/utils'
import { useFavorites } from '@/lib/services/favorites'
import { useToast } from '@/components/ui/use-toast'

export default function LeagueDetailPage() {
  const params = useParams()
  const leagueId = Number(params.id)
  const [activeTab, setActiveTab] = useState('overview')
  const currentSeason = new Date().getFullYear()
  const { addLeague, removeLeague, isLeagueFavorite } = useFavorites()
  const { toast } = useToast()

  const { data: leagueData, isLoading: leagueLoading } = useLeagueDetails(leagueId)
  const { data: standingsData, isLoading: standingsLoading } = useLeagueStandings(leagueId, currentSeason)
  const { data: fixturesData, isLoading: fixturesLoading } = useLeagueFixtures(leagueId, currentSeason)

  const handleFollow = () => {
    const league = leagueData?.response?.[0]?.league
    if (!league) return
    
    const isFavorite = isLeagueFavorite(leagueId)
    
    if (isFavorite) {
      removeLeague(leagueId)
      toast({
        title: "즐겨찾기 제거됨",
        description: `${league.name}이(가) 즐겨찾기에서 제거되었습니다.`
      })
    } else {
      addLeague({
        id: leagueId,
        name: league.name,
        logo: league.logo,
        country: leagueData?.response?.[0]?.country?.name
      })
      toast({
        title: "즐겨찾기 추가됨", 
        description: `${league.name}이(가) 즐겨찾기에 추가되었습니다.`
      })
    }
  }

  if (leagueLoading) {
    return (
      <MainLayout>
        <div className="max-w-7xl mx-auto px-4 py-6">
          <Skeleton className="h-32 w-full mb-6" />
          <Skeleton className="h-96 w-full" />
        </div>
      </MainLayout>
    )
  }

  const league = leagueData?.response?.[0]?.league

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* League Header */}
        <div className="bg-white rounded-lg p-6 mb-6 shadow-sm">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-4">
              {league?.logo && (
                <Image
                  src={league.logo}
                  alt={league.name}
                  width={80}
                  height={80}
                  className="object-contain"
                />
              )}
              <div>
                <h1 className="text-2xl font-bold mb-1">{league?.name || `League ${leagueId}`}</h1>
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <div className="flex items-center space-x-1">
                    <Image
                      src={leagueData?.response?.[0]?.country?.flag || '/placeholder-flag.png'}
                      alt={leagueData?.response?.[0]?.country?.name || 'Country'}
                      width={20}
                      height={20}
                      className="object-contain"
                    />
                    <span>{leagueData?.response?.[0]?.country?.name}</span>
                  </div>
                  <span>•</span>
                  <span>Season {currentSeason}</span>
                </div>
              </div>
            </div>
            <Button
              variant={isLeagueFavorite(leagueId) ? "secondary" : "default"}
              size="sm"
              onClick={handleFollow}
              className="flex items-center space-x-2"
            >
              {isLeagueFavorite(leagueId) ? (
                <>
                  <Star className="h-4 w-4 fill-current" />
                  <span>Following</span>
                </>
              ) : (
                <>
                  <StarOff className="h-4 w-4" />
                  <span>Follow</span>
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5 mb-6">
            <TabsTrigger value="overview" className="flex items-center space-x-2">
              <Trophy className="h-4 w-4" />
              <span className="hidden sm:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="fixtures" className="flex items-center space-x-2">
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">Fixtures</span>
            </TabsTrigger>
            <TabsTrigger value="standings" className="flex items-center space-x-2">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Table</span>
            </TabsTrigger>
            <TabsTrigger value="stats" className="flex items-center space-x-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Stats</span>
            </TabsTrigger>
            <TabsTrigger value="news" className="flex items-center space-x-2">
              <Newspaper className="h-4 w-4" />
              <span className="hidden sm:inline">News</span>
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Latest Results */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="text-lg">Latest Results</CardTitle>
                </CardHeader>
                <CardContent>
                  {fixturesLoading ? (
                    <div className="space-y-3">
                      {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-16" />
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {fixturesData?.response
                        ?.filter(f => isFinishedMatch(f.fixture.status.short))
                        .slice(0, 5)
                        .map((fixture) => (
                          <Link
                            key={fixture.fixture.id}
                            href={`/fixtures/${fixture.fixture.id}`}
                            className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors"
                          >
                            <div className="flex items-center space-x-3 flex-1">
                              <Image
                                src={fixture.teams.home.logo}
                                alt={fixture.teams.home.name}
                                width={24}
                                height={24}
                                className="object-contain"
                              />
                              <span className={cn(
                                "text-sm",
                                fixture.teams.home.winner && "font-semibold"
                              )}>
                                {fixture.teams.home.name}
                              </span>
                            </div>
                            <div className="px-4 text-center">
                              <div className="text-lg font-semibold">
                                {fixture.goals?.home ?? 0} - {fixture.goals?.away ?? 0}
                              </div>
                              <div className="text-xs text-gray-500">FT</div>
                            </div>
                            <div className="flex items-center space-x-3 flex-1 justify-end">
                              <span className={cn(
                                "text-sm",
                                fixture.teams.away.winner && "font-semibold"
                              )}>
                                {fixture.teams.away.name}
                              </span>
                              <Image
                                src={fixture.teams.away.logo}
                                alt={fixture.teams.away.name}
                                width={24}
                                height={24}
                                className="object-contain"
                              />
                            </div>
                          </Link>
                        ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Top Scorers */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Top Scorers</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <span className="text-sm font-medium text-gray-500">{i}</span>
                          <div className="w-8 h-8 bg-gray-200 rounded-full" />
                          <div>
                            <p className="text-sm font-medium">Player {i}</p>
                            <p className="text-xs text-gray-500">Team Name</p>
                          </div>
                        </div>
                        <span className="text-sm font-semibold">{20 - i * 2}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Standings Preview */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">Standings</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setActiveTab('standings')}
                >
                  View all
                </Button>
              </CardHeader>
              <CardContent>
                {standingsLoading ? (
                  <Skeleton className="h-64" />
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="text-xs text-gray-500 border-b">
                          <th className="text-left py-2">Pos</th>
                          <th className="text-left py-2">Team</th>
                          <th className="text-center py-2">P</th>
                          <th className="text-center py-2">W</th>
                          <th className="text-center py-2">D</th>
                          <th className="text-center py-2">L</th>
                          <th className="text-center py-2">GD</th>
                          <th className="text-center py-2 font-semibold">Pts</th>
                        </tr>
                      </thead>
                      <tbody>
                        {standingsData?.response?.[0]?.league?.standings?.[0]?.slice(0, 5).map((team) => (
                          <tr key={team.team.id} className="border-b hover:bg-gray-50">
                            <td className="py-2 text-sm">{team.rank}</td>
                            <td className="py-2">
                              <Link
                                href={`/teams/${team.team.id}`}
                                className="flex items-center space-x-2 hover:text-blue-600"
                              >
                                <Image
                                  src={team.team.logo}
                                  alt={team.team.name}
                                  width={20}
                                  height={20}
                                  className="object-contain"
                                />
                                <span className="text-sm">{team.team.name}</span>
                              </Link>
                            </td>
                            <td className="text-center text-sm">{team.all.played}</td>
                            <td className="text-center text-sm">{team.all.win}</td>
                            <td className="text-center text-sm">{team.all.draw}</td>
                            <td className="text-center text-sm">{team.all.lose}</td>
                            <td className="text-center text-sm">{team.goalsDiff}</td>
                            <td className="text-center text-sm font-semibold">{team.points}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Fixtures Tab */}
          <TabsContent value="fixtures">
            <Card>
              <CardHeader>
                <CardTitle>Fixtures & Results</CardTitle>
              </CardHeader>
              <CardContent>
                {fixturesLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Skeleton key={i} className="h-20" />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {fixturesData?.response?.map((fixture) => {
                      const isLive = isLiveMatch(fixture.fixture.status.short)
                      const isFinished = isFinishedMatch(fixture.fixture.status.short)
                      const fixtureDate = new Date(fixture.fixture.date)

                      return (
                        <Link
                          key={fixture.fixture.id}
                          href={`/fixtures/${fixture.fixture.id}`}
                          className="block p-4 rounded-lg border hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs text-gray-500">
                              {formatDate(fixtureDate)}
                            </span>
                            {isLive && (
                              <Badge variant="destructive" className="text-xs">
                                LIVE {fixture.fixture.status.elapsed}'
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3 flex-1">
                              <Image
                                src={fixture.teams.home.logo}
                                alt={fixture.teams.home.name}
                                width={28}
                                height={28}
                                className="object-contain"
                              />
                              <span className={cn(
                                "text-sm",
                                fixture.teams.home.winner && "font-semibold"
                              )}>
                                {fixture.teams.home.name}
                              </span>
                            </div>
                            <div className="px-6 text-center">
                              {isFinished || isLive ? (
                                <div className="text-xl font-bold">
                                  {fixture.goals?.home ?? 0} - {fixture.goals?.away ?? 0}
                                </div>
                              ) : (
                                <div className="text-sm text-gray-600">
                                  {fixtureDate.toLocaleTimeString('en-US', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    hour12: false
                                  })}
                                </div>
                              )}
                            </div>
                            <div className="flex items-center space-x-3 flex-1 justify-end">
                              <span className={cn(
                                "text-sm",
                                fixture.teams.away.winner && "font-semibold"
                              )}>
                                {fixture.teams.away.name}
                              </span>
                              <Image
                                src={fixture.teams.away.logo}
                                alt={fixture.teams.away.name}
                                width={28}
                                height={28}
                                className="object-contain"
                              />
                            </div>
                          </div>
                        </Link>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Standings Tab */}
          <TabsContent value="standings">
            <Card>
              <CardHeader>
                <CardTitle>League Table</CardTitle>
              </CardHeader>
              <CardContent>
                {standingsLoading ? (
                  <Skeleton className="h-96" />
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="text-xs text-gray-500 border-b">
                          <th className="text-left py-3">Pos</th>
                          <th className="text-left py-3">Team</th>
                          <th className="text-center py-3">Played</th>
                          <th className="text-center py-3">Won</th>
                          <th className="text-center py-3">Drawn</th>
                          <th className="text-center py-3">Lost</th>
                          <th className="text-center py-3">GF</th>
                          <th className="text-center py-3">GA</th>
                          <th className="text-center py-3">GD</th>
                          <th className="text-center py-3 font-semibold">Points</th>
                        </tr>
                      </thead>
                      <tbody>
                        {standingsData?.response?.[0]?.league?.standings?.[0]?.map((team, index) => (
                          <tr 
                            key={team.team.id} 
                            className={cn(
                              "border-b hover:bg-gray-50 transition-colors",
                              index < 4 && "bg-green-50",
                              index >= standingsData.response[0].league.standings[0].length - 3 && "bg-red-50"
                            )}
                          >
                            <td className="py-3 px-2">
                              <span className="text-sm font-medium">{team.rank}</span>
                            </td>
                            <td className="py-3">
                              <Link
                                href={`/teams/${team.team.id}`}
                                className="flex items-center space-x-3 hover:text-blue-600"
                              >
                                <Image
                                  src={team.team.logo}
                                  alt={team.team.name}
                                  width={24}
                                  height={24}
                                  className="object-contain"
                                />
                                <span className="text-sm font-medium">{team.team.name}</span>
                              </Link>
                            </td>
                            <td className="text-center text-sm">{team.all.played}</td>
                            <td className="text-center text-sm">{team.all.win}</td>
                            <td className="text-center text-sm">{team.all.draw}</td>
                            <td className="text-center text-sm">{team.all.lose}</td>
                            <td className="text-center text-sm">{team.all.goals.for}</td>
                            <td className="text-center text-sm">{team.all.goals.against}</td>
                            <td className="text-center text-sm font-medium">
                              {team.goalsDiff > 0 && '+'}{team.goalsDiff}
                            </td>
                            <td className="text-center text-sm font-bold">{team.points}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Stats Tab */}
          <TabsContent value="stats">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Top Scorers</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                      <div key={i} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <span className="text-sm font-medium text-gray-500 w-6">{i}</span>
                          <div className="w-10 h-10 bg-gray-200 rounded-full" />
                          <div>
                            <p className="text-sm font-medium">Player Name {i}</p>
                            <p className="text-xs text-gray-500">Team Name</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold">{25 - i * 2}</p>
                          <p className="text-xs text-gray-500">goals</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Top Assists</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                      <div key={i} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <span className="text-sm font-medium text-gray-500 w-6">{i}</span>
                          <div className="w-10 h-10 bg-gray-200 rounded-full" />
                          <div>
                            <p className="text-sm font-medium">Player Name {i}</p>
                            <p className="text-xs text-gray-500">Team Name</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold">{18 - i}</p>
                          <p className="text-xs text-gray-500">assists</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* News Tab */}
          <TabsContent value="news">
            <Card>
              <CardHeader>
                <CardTitle>Latest News</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <article key={i} className="border-b pb-4 last:border-0">
                      <h3 className="font-semibold text-lg mb-2 hover:text-blue-600 cursor-pointer">
                        Breaking: Major signing confirmed for top team {i}
                      </h3>
                      <p className="text-sm text-gray-600 mb-2">
                        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
                      </p>
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <span>2 hours ago</span>
                        <span>•</span>
                        <span>Sky Sports</span>
                      </div>
                    </article>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  )
}