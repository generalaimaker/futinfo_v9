'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { 
  ChevronRight, 
  ChevronDown, 
  Trophy,
  Star,
  Globe,
  Flag,
  Plus,
  Settings
} from 'lucide-react'
import { useFavorites } from '@/lib/services/favorites'

export function LeftSidebar() {
  const [showAllTeams, setShowAllTeams] = useState(false)
  const [showAllLeagues, setShowAllLeagues] = useState(false)
  const [isHydrated, setIsHydrated] = useState(false)
  
  const { teams: followedTeams, leagues: followedLeagues } = useFavorites()
  
  useEffect(() => {
    setIsHydrated(true)
  }, [])

  // 기본 표시 팀들 (요청한 순서대로)
  const defaultTeams = [
    // Premier League
    { id: 40, name: 'Liverpool', logo: 'https://media.api-sports.io/football/teams/40.png' },
    { id: 33, name: 'Manchester United', logo: 'https://media.api-sports.io/football/teams/33.png' },
    { id: 49, name: 'Chelsea', logo: 'https://media.api-sports.io/football/teams/49.png' },
    { id: 50, name: 'Manchester City', logo: 'https://media.api-sports.io/football/teams/50.png' },
    { id: 42, name: 'Arsenal', logo: 'https://media.api-sports.io/football/teams/42.png' },
    { id: 47, name: 'Tottenham', logo: 'https://media.api-sports.io/football/teams/47.png' },
    // La Liga
    { id: 541, name: 'Real Madrid', logo: 'https://media.api-sports.io/football/teams/541.png' },
    { id: 529, name: 'Barcelona', logo: 'https://media.api-sports.io/football/teams/529.png' },
    { id: 530, name: 'Atlético Madrid', logo: 'https://media.api-sports.io/football/teams/530.png' },
    // Serie A
    { id: 496, name: 'Juventus', logo: 'https://media.api-sports.io/football/teams/496.png' },
    { id: 489, name: 'AC Milan', logo: 'https://media.api-sports.io/football/teams/489.png' },
    { id: 505, name: 'Inter', logo: 'https://media.api-sports.io/football/teams/505.png' },
    // Bundesliga
    { id: 157, name: 'Bayern Munich', logo: 'https://media.api-sports.io/football/teams/157.png' },
    // Ligue 1
    { id: 85, name: 'Paris Saint-Germain', logo: 'https://media.api-sports.io/football/teams/85.png' },
  ]

  const topLeagues = [
    { id: 39, name: 'Premier League', country: 'England', logo: 'https://media.api-sports.io/football/leagues/39.png' },
    { id: 140, name: 'La Liga', country: 'Spain', logo: 'https://media.api-sports.io/football/leagues/140.png' },
    { id: 135, name: 'Serie A', country: 'Italy', logo: 'https://media.api-sports.io/football/leagues/135.png' },
    { id: 78, name: 'Bundesliga', country: 'Germany', logo: 'https://media.api-sports.io/football/leagues/78.png' },
    { id: 61, name: 'Ligue 1', country: 'France', logo: 'https://media.api-sports.io/football/leagues/61.png' },
  ]

  const displayedLeagues = showAllLeagues ? followedLeagues : followedLeagues.slice(0, 5)
  
  // 항상 기본 팀 표시 (팔로우 여부와 관계없이)
  const displayedTeams = showAllTeams ? defaultTeams : defaultTeams.slice(0, 10)
  
  // Debug log
  console.log('LeftSidebar - First 3 teams:', displayedTeams.slice(0, 3).map(t => t.name))

  // Don't render until hydrated to avoid hydration mismatch
  if (!isHydrated) {
    return (
      <div className="w-full h-full bg-white border-r overflow-y-auto">
        <div className="p-4 space-y-6">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-32 mb-3"></div>
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-10 bg-gray-100 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full h-full bg-white border-r overflow-y-auto">
      <div className="p-4 space-y-6">
        {/* Popular Teams Section - Always Show */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-sm">Popular teams</h3>
          </div>
          <div className="space-y-2">
            {displayedTeams.map((team) => (
              <Link
                key={team.id}
                href={`/teams/${team.id}`}
                className="flex items-center space-x-3 py-2 px-2 rounded-lg hover:bg-gray-50 transition-colors"
              >
                {team.logo ? (
                  <Image
                    src={team.logo}
                    alt={team.name}
                    width={24}
                    height={24}
                    className="object-contain"
                  />
                ) : (
                  <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center">
                    <Flag className="h-3 w-3 text-gray-500" />
                  </div>
                )}
                <span className="text-sm">{team.name}</span>
              </Link>
            ))}
            {defaultTeams.length > 10 && !showAllTeams && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-xs"
                onClick={() => setShowAllTeams(true)}
              >
                Show all ({defaultTeams.length})
              </Button>
            )}
            {showAllTeams && defaultTeams.length > 10 && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-xs"
                onClick={() => setShowAllTeams(false)}
              >
                Show less
              </Button>
            )}
          </div>
        </div>

        {/* Followed Teams Section - Show only if user has followed teams */}
        {followedTeams.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-sm">Followed teams</h3>
              <Link href="/favorites">
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                  <Plus className="h-3 w-3" />
                </Button>
              </Link>
            </div>
            <div className="space-y-2">
              {followedTeams.slice(0, 5).map((team) => (
                <Link
                  key={team.id}
                  href={`/teams/${team.id}`}
                  className="flex items-center space-x-3 py-2 px-2 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  {team.logo ? (
                    <Image
                      src={team.logo}
                      alt={team.name}
                      width={24}
                      height={24}
                      className="object-contain"
                    />
                  ) : (
                    <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center">
                      <Flag className="h-3 w-3 text-gray-500" />
                    </div>
                  )}
                  <span className="text-sm">{team.name}</span>
                </Link>
              ))}
              {followedTeams.length > 5 && (
                <Link href="/favorites" className="text-xs text-gray-500 hover:text-gray-700">
                  View all ({followedTeams.length})
                </Link>
              )}
            </div>
          </div>
        )}

        {/* Followed Leagues */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-sm">Followed leagues</h3>
            <Link href="/leagues">
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                <Plus className="h-3 w-3" />
              </Button>
            </Link>
          </div>
          <div className="space-y-2">
            {followedLeagues.length === 0 ? (
              <Link
                href="/leagues"
                className="flex items-center justify-center py-4 px-2 rounded-lg border-2 border-dashed border-gray-200 hover:border-gray-300 transition-colors"
              >
                <Plus className="h-4 w-4 mr-2 text-gray-400" />
                <span className="text-sm text-gray-500">Add leagues</span>
              </Link>
            ) : (
              <>
                {displayedLeagues.map((league) => (
                  <Link
                    key={league.id}
                    href={`/leagues/${league.id}`}
                    className="flex items-center space-x-3 py-2 px-2 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    {league.logo ? (
                      <Image
                        src={league.logo}
                        alt={league.name}
                        width={20}
                        height={20}
                        className="object-contain"
                      />
                    ) : (
                      <Trophy className="h-4 w-4 text-gray-500" />
                    )}
                    <span className="text-sm">{league.name}</span>
                  </Link>
                ))}
                {followedLeagues.length > 5 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full mt-2 text-xs flex items-center justify-center"
                    onClick={() => setShowAllLeagues(!showAllLeagues)}
                  >
                    {showAllLeagues ? 'Show less' : `Show all (${followedLeagues.length})`}
                    {showAllLeagues ? (
                      <ChevronDown className="h-3 w-3 ml-1" />
                    ) : (
                      <ChevronRight className="h-3 w-3 ml-1" />
                    )}
                  </Button>
                )}
              </>
            )}
          </div>
        </div>

        {/* Top Leagues */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-sm">Top leagues</h3>
          </div>
          <div className="space-y-2">
            {topLeagues.map((league) => (
              <Link
                key={league.id}
                href={`/leagues/${league.id}`}
                className="flex items-center space-x-3 py-2 px-2 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Image
                  src={league.logo}
                  alt={league.name}
                  width={20}
                  height={20}
                  className="object-contain"
                />
                <span className="text-sm">{league.name}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Community Section */}
        <div className="border-t pt-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-sm">Community</h3>
          </div>
          <div className="space-y-2">
            <Link
              href="/community"
              className="flex items-center space-x-3 py-2 px-2 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Globe className="h-4 w-4 text-blue-500" />
              <span className="text-sm">All Boards</span>
            </Link>
            {followedTeams.slice(0, 3).map((team) => (
              <Link
                key={`community-${team.id}`}
                href={`/community/teams/${team.id}`}
                className="flex items-center space-x-3 py-2 px-2 rounded-lg hover:bg-gray-50 transition-colors"
              >
                {team.logo ? (
                  <Image
                    src={team.logo}
                    alt={team.name}
                    width={16}
                    height={16}
                    className="object-contain opacity-60"
                  />
                ) : (
                  <div className="w-4 h-4 bg-gray-200 rounded-full" />
                )}
                <span className="text-sm text-gray-600">{team.name} Board</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Settings */}
        <div className="border-t pt-4">
          <Link
            href="/settings"
            className="flex items-center space-x-3 py-2 px-2 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Settings className="h-4 w-4 text-gray-500" />
            <span className="text-sm">Settings</span>
          </Link>
        </div>
      </div>
    </div>
  )
}