'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CommunityService } from '@/lib/supabase/community'
import { CommunityBoard } from '@/types'
import { Users, MessageSquare, Loader2 } from 'lucide-react'
import { formatNumber } from '@/lib/utils'

export function BoardList() {
  const [boards, setBoards] = useState<CommunityBoard[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadBoards() {
      try {
        setLoading(true)
        const boardsData = await CommunityService.getBoards()
        setBoards(boardsData)
      } catch (err) {
        setError('게시판을 불러오는데 실패했습니다.')
        console.error('Error loading boards:', err)
      } finally {
        setLoading(false)
      }
    }

    loadBoards()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 mb-4">{error}</p>
        <Button onClick={() => window.location.reload()} variant="outline">
          다시 시도
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* All Board */}
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <MessageSquare className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-lg">전체 게시판</CardTitle>
                <p className="text-sm text-gray-600">모든 축구 팬들이 자유롭게 소통하는 공간</p>
              </div>
            </div>
            <Link href="/community/boards/all">
              <Button>입장하기</Button>
            </Link>
          </div>
        </CardHeader>
      </Card>

      {/* Team Boards */}
      <div>
        <h2 className="text-xl font-semibold mb-4 text-gray-900">팀별 게시판</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {boards
            .filter(board => board.type === 'team')
            .map((board) => (
              <Card key={board.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center space-x-3">
                    {board.iconUrl ? (
                      <img 
                        src={board.iconUrl} 
                        alt={board.name}
                        className="w-10 h-10 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center">
                        <span className="text-xs font-medium text-gray-600">
                          {board.name.slice(0, 2)}
                        </span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base truncate">{board.name}</CardTitle>
                      {board.description && (
                        <p className="text-xs text-gray-600 truncate">{board.description}</p>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <div className="flex items-center space-x-1">
                        <Users className="h-3 w-3" />
                        <span>{formatNumber(board.memberCount)}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <MessageSquare className="h-3 w-3" />
                        <span>{formatNumber(board.postCount)}</span>
                      </div>
                    </div>
                  </div>
                  <Link href={`/community/boards/${board.id}`}>
                    <Button size="sm" className="w-full">
                      입장하기
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
        </div>
      </div>

      {/* Popular Teams (if no team boards loaded yet) */}
      {boards.filter(board => board.type === 'team').length === 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4 text-gray-900">인기 팀</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {popularTeams.map((team) => (
              <Card key={team.id} className="hover:shadow-md transition-shadow opacity-75">
                <CardHeader className="pb-3">
                  <div className="flex items-center space-x-3">
                    <img 
                      src={team.logo} 
                      alt={team.name}
                      className="w-10 h-10 rounded-lg object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base truncate">{team.name}</CardTitle>
                      <p className="text-xs text-gray-600">{team.league}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <Button size="sm" className="w-full" disabled>
                    준비 중
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// Popular teams data (fallback when no boards are loaded)
const popularTeams = [
  {
    id: 33,
    name: 'Manchester United',
    league: 'Premier League',
    logo: 'https://media.api-sports.io/football/teams/33.png'
  },
  {
    id: 40,
    name: 'Liverpool',
    league: 'Premier League', 
    logo: 'https://media.api-sports.io/football/teams/40.png'
  },
  {
    id: 42,
    name: 'Arsenal',
    league: 'Premier League',
    logo: 'https://media.api-sports.io/football/teams/42.png'
  },
  {
    id: 541,
    name: 'Real Madrid',
    league: 'La Liga',
    logo: 'https://media.api-sports.io/football/teams/541.png'
  },
  {
    id: 529,
    name: 'Barcelona',
    league: 'La Liga',
    logo: 'https://media.api-sports.io/football/teams/529.png'
  },
  {
    id: 157,
    name: 'Bayern Munich',
    league: 'Bundesliga',
    logo: 'https://media.api-sports.io/football/teams/157.png'
  }
]