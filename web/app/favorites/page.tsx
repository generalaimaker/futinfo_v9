'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { MainLayout } from '@/components/layout/MainLayout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Trophy, 
  Users, 
  User,
  X,
  Flag,
  Search
} from 'lucide-react'
import { useFavorites } from '@/lib/services/favorites'
import { Input } from '@/components/ui/input'

export default function FavoritesPage() {
  const [activeTab, setActiveTab] = useState('teams')
  const [searchTerm, setSearchTerm] = useState('')
  const { 
    teams, 
    players, 
    leagues, 
    removeTeam, 
    removePlayer, 
    removeLeague,
    clearAll 
  } = useFavorites()

  // Filter favorites based on search
  const filteredTeams = teams.filter(team => 
    team.name.toLowerCase().includes(searchTerm.toLowerCase())
  )
  const filteredPlayers = players.filter(player => 
    player.name.toLowerCase().includes(searchTerm.toLowerCase())
  )
  const filteredLeagues = leagues.filter(league => 
    league.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to remove all favorites?')) {
      clearAll()
    }
  }

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="bg-white rounded-lg p-6 mb-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold mb-2">My Favorites</h1>
              <p className="text-gray-600">Manage your favorite teams, players, and leagues</p>
            </div>
            <Button 
              variant="destructive" 
              size="sm"
              onClick={handleClearAll}
              disabled={teams.length === 0 && players.length === 0 && leagues.length === 0}
            >
              Clear All
            </Button>
          </div>

          {/* Search */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search favorites..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="teams" className="flex items-center space-x-2">
              <Users className="h-4 w-4" />
              <span>Teams ({filteredTeams.length})</span>
            </TabsTrigger>
            <TabsTrigger value="players" className="flex items-center space-x-2">
              <User className="h-4 w-4" />
              <span>Players ({filteredPlayers.length})</span>
            </TabsTrigger>
            <TabsTrigger value="leagues" className="flex items-center space-x-2">
              <Trophy className="h-4 w-4" />
              <span>Leagues ({filteredLeagues.length})</span>
            </TabsTrigger>
          </TabsList>

          {/* Teams Tab */}
          <TabsContent value="teams">
            {filteredTeams.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 mb-4">No favorite teams yet</p>
                  <Link href="/teams">
                    <Button>Browse Teams</Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredTeams.map((team) => (
                  <Card key={team.id} className="overflow-hidden">
                    <Link href={`/teams/${team.id}`}>
                      <CardHeader className="pb-3 hover:bg-gray-50 transition-colors">
                        <div className="flex items-center space-x-3">
                          {team.logo ? (
                            <Image
                              src={team.logo}
                              alt={team.name}
                              width={40}
                              height={40}
                              className="object-contain"
                            />
                          ) : (
                            <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                              <Flag className="h-5 w-5 text-gray-500" />
                            </div>
                          )}
                          <div>
                            <CardTitle className="text-base">{team.name}</CardTitle>
                            {team.leagueName && (
                              <p className="text-xs text-gray-500">{team.leagueName}</p>
                            )}
                          </div>
                        </div>
                      </CardHeader>
                    </Link>
                    <CardContent className="pt-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => removeTeam(team.id)}
                      >
                        <X className="h-4 w-4 mr-2" />
                        Remove
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Players Tab */}
          <TabsContent value="players">
            {filteredPlayers.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <User className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 mb-4">No favorite players yet</p>
                  <Link href="/search">
                    <Button>Search Players</Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredPlayers.map((player) => (
                  <Card key={player.id} className="overflow-hidden">
                    <Link href={`/players/${player.id}`}>
                      <CardHeader className="pb-3 hover:bg-gray-50 transition-colors">
                        <div className="flex items-center space-x-3">
                          {player.photo ? (
                            <Image
                              src={player.photo}
                              alt={player.name}
                              width={40}
                              height={40}
                              className="rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                              <User className="h-5 w-5 text-gray-500" />
                            </div>
                          )}
                          <div>
                            <CardTitle className="text-base">{player.name}</CardTitle>
                            <div className="text-xs text-gray-500">
                              {player.position && <span>{player.position}</span>}
                              {player.position && player.teamName && <span> • </span>}
                              {player.teamName && <span>{player.teamName}</span>}
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                    </Link>
                    <CardContent className="pt-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => removePlayer(player.id)}
                      >
                        <X className="h-4 w-4 mr-2" />
                        Remove
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Leagues Tab */}
          <TabsContent value="leagues">
            {filteredLeagues.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Trophy className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 mb-4">No favorite leagues yet</p>
                  <Link href="/leagues">
                    <Button>Browse Leagues</Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredLeagues.map((league) => (
                  <Card key={league.id} className="overflow-hidden">
                    <Link href={`/leagues/${league.id}`}>
                      <CardHeader className="pb-3 hover:bg-gray-50 transition-colors">
                        <div className="flex items-center space-x-3">
                          {league.logo ? (
                            <Image
                              src={league.logo}
                              alt={league.name}
                              width={40}
                              height={40}
                              className="object-contain"
                            />
                          ) : (
                            <Trophy className="h-10 w-10 text-gray-500" />
                          )}
                          <div>
                            <CardTitle className="text-base">{league.name}</CardTitle>
                            {league.country && (
                              <p className="text-xs text-gray-500">{league.country}</p>
                            )}
                          </div>
                        </div>
                      </CardHeader>
                    </Link>
                    <CardContent className="pt-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => removeLeague(league.id)}
                      >
                        <X className="h-4 w-4 mr-2" />
                        Remove
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  )
}