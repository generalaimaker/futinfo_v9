'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import footballAPIService from '@/lib/supabase/football'

function StandingsContent() {
  const searchParams = useSearchParams()
  const leagueId = searchParams.get('league') || '39' // Default to Premier League
  const currentYear = new Date().getFullYear()
  const season = searchParams.get('season') || currentYear.toString()
  const [standings, setStandings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadStandings()
  }, [leagueId, season])

  const loadStandings = async () => {
    try {
      setLoading(true)
      const data = await footballAPIService.getStandings({
        league: parseInt(leagueId),
        season: parseInt(season)
      })
      // API response structure: data.response[0].league.standings[0]
      if (data?.response?.[0]?.league?.standings?.[0]) {
        setStandings(data.response[0].league.standings[0])
      } else {
        setStandings([])
      }
    } catch (err) {
      setError('순위표를 불러오는데 실패했습니다.')
      console.error('Error loading standings:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-600">{error}</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">리그 순위</h1>
      
      {standings.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">순위 데이터가 없습니다.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white rounded-lg overflow-hidden">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-3 text-left">순위</th>
                <th className="px-4 py-3 text-left">팀</th>
                <th className="px-4 py-3 text-center">경기</th>
                <th className="px-4 py-3 text-center">승</th>
                <th className="px-4 py-3 text-center">무</th>
                <th className="px-4 py-3 text-center">패</th>
                <th className="px-4 py-3 text-center">득점</th>
                <th className="px-4 py-3 text-center">실점</th>
                <th className="px-4 py-3 text-center">차</th>
                <th className="px-4 py-3 text-center">점수</th>
              </tr>
            </thead>
            <tbody>
              {standings.map((team: any, index: number) => (
                <tr key={team.team.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3">{team.rank}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {team.team.logo && (
                        <img 
                          src={team.team.logo} 
                          alt={team.team.name}
                          className="w-6 h-6 object-contain"
                        />
                      )}
                      <span>{team.team.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">{team.all?.played || 0}</td>
                  <td className="px-4 py-3 text-center">{team.all?.win || 0}</td>
                  <td className="px-4 py-3 text-center">{team.all?.draw || 0}</td>
                  <td className="px-4 py-3 text-center">{team.all?.lose || 0}</td>
                  <td className="px-4 py-3 text-center">{team.all?.goals?.for || 0}</td>
                  <td className="px-4 py-3 text-center">{team.all?.goals?.against || 0}</td>
                  <td className="px-4 py-3 text-center">{team.goalsDiff || 0}</td>
                  <td className="px-4 py-3 text-center font-bold">{team.points || 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default function StandingsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    }>
      <StandingsContent />
    </Suspense>
  )
}