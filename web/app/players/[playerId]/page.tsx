import footballAPIService from '@/lib/supabase/football'
import PlayerProfileClient from './page-client'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { AlertCircle } from 'lucide-react'

export default async function PlayerProfilePage({ params }: { params: { playerId: string } }) {
  const playerId = Number(params.playerId)
  
  // Validate playerId
  if (!playerId || isNaN(playerId)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">잘못된 선수 ID</h3>
              <p className="text-gray-600 mb-4">선수 ID가 올바르지 않습니다.</p>
              <Link href="/players">
                <Button>선수 목록으로 돌아가기</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }
  
  try {
    // Fetch multiple seasons of data in parallel
    const [playerProfile2025, playerProfile, playerProfile2023, playerProfile2022, playerProfile2021, transfers, injuries] = await Promise.all([
      footballAPIService.getPlayerProfile(playerId, 2025).catch(() => null),
      footballAPIService.getPlayerProfile(playerId, 2024).catch(() => null),
      footballAPIService.getPlayerProfile(playerId, 2023).catch(() => null),
      footballAPIService.getPlayerProfile(playerId, 2022).catch(() => null),
      footballAPIService.getPlayerProfile(playerId, 2021).catch(() => null),
      footballAPIService.getPlayerTransfers(playerId).catch(() => null),
      footballAPIService.getPlayerInjuries(playerId).catch(() => [])
    ])
    
    // Use the most recent available data for player info
    const playerData = playerProfile2025 || playerProfile || playerProfile2023 || playerProfile2022 || playerProfile2021
    
    if (!playerData || !playerData.player) {
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
    
    // Prepare all seasons data
    const allSeasons = [
      { data: playerProfile2025, season: '25-26' },
      { data: playerProfile, season: '24-25' },
      { data: playerProfile2023, season: '23-24' },
      { data: playerProfile2022, season: '22-23' },
      { data: playerProfile2021, season: '21-22' }
    ].filter(s => s.data && s.data.statistics && s.data.statistics.length > 0)
    
    // Calculate career totals
    const careerTotals = {
      appearances: 0,
      goals: 0,
      assists: 0,
      yellowCards: 0,
      redCards: 0
    }
    
    allSeasons.forEach(season => {
      if (season.data?.statistics) {
        season.data.statistics.forEach((stat: any) => {
          careerTotals.appearances += stat.games?.appearences || 0
          careerTotals.goals += stat.goals?.total || 0
          careerTotals.assists += stat.goals?.assists || 0
          careerTotals.yellowCards += stat.cards?.yellow || 0
          careerTotals.redCards += stat.cards?.red || 0
        })
      }
    })
    
    return (
      <PlayerProfileClient
        playerData={playerData}
        allSeasons={allSeasons}
        transfers={transfers}
        injuries={injuries}
        careerTotals={careerTotals}
      />
    )
  } catch (error) {
    console.error('Error fetching player data:', error)
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">오류 발생</h3>
              <p className="text-gray-600 mb-4">선수 정보를 불러오는 중 오류가 발생했습니다.</p>
              <Link href="/players">
                <Button>선수 목록으로 돌아가기</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }
}