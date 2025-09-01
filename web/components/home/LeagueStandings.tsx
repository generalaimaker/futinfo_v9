'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Trophy, TrendingUp, TrendingDown, Minus, ChevronRight, Loader2 } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useStandings } from '@/lib/supabase/football'
import { useUserPreferences } from '@/lib/hooks/useUserPreferences'

// 리그 정보 매핑
const LEAGUES = [
  { id: 39, name: 'Premier League', shortName: 'PL', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
  { id: 140, name: 'La Liga', shortName: 'LL', flag: '🇪🇸' },
  { id: 135, name: 'Serie A', shortName: 'SA', flag: '🇮🇹' },
  { id: 78, name: 'Bundesliga', shortName: 'BL', flag: '🇩🇪' },
  { id: 61, name: 'Ligue 1', shortName: 'L1', flag: '🇫🇷' }
]

// 팀 이름 약어 매핑
const TEAM_ABBREVIATIONS: { [key: string]: string } = {
  // Premier League
  'Liverpool': 'LIV',
  'Manchester City': 'MCI',
  'Arsenal': 'ARS',
  'Chelsea': 'CHE',
  'Manchester United': 'MUN',
  'Tottenham': 'TOT',
  'Newcastle': 'NEW',
  'Brighton': 'BRI',
  'Aston Villa': 'AVL',
  'Fulham': 'FUL',
  'Brentford': 'BRE',
  'Crystal Palace': 'CRY',
  'Nottingham Forest': 'NFO',
  'West Ham': 'WHU',
  'Bournemouth': 'BOU',
  'Wolverhampton': 'WOL',
  'Everton': 'EVE',
  'Leicester': 'LEI',
  'Ipswich': 'IPS',
  'Southampton': 'SOU',
  // La Liga
  'Real Madrid': 'RMA',
  'Barcelona': 'BAR',
  'Atletico Madrid': 'ATM',
  'Athletic Club': 'ATH',
  'Real Sociedad': 'RSO',
  'Real Betis': 'BET',
  'Villarreal': 'VIL',
  'Valencia': 'VAL',
  'Sevilla': 'SEV',
  'Girona': 'GIR',
  'Osasuna': 'OSA',
  'Getafe': 'GET',
  'Celta Vigo': 'CEL',
  'Rayo Vallecano': 'RAY',
  'Mallorca': 'MAL',
  'Las Palmas': 'LPA',
  'Alaves': 'ALA',
  'Espanyol': 'ESP',
  'Valladolid': 'VLL',
  'Leganes': 'LEG',
  // Serie A
  'Napoli': 'NAP',
  'Inter': 'INT',
  'Juventus': 'JUV',
  'AC Milan': 'MIL',
  'Atalanta': 'ATA',
  'AS Roma': 'ROM',
  'Roma': 'ROM',
  'Lazio': 'LAZ',
  'Fiorentina': 'FIO',
  'Bologna': 'BOL',
  'Torino': 'TOR',
  'Udinese': 'UDI',
  'Genoa': 'GEN',
  'Hellas Verona': 'VER',
  'Cagliari': 'CAG',
  'Parma': 'PAR',
  'Como': 'COM',
  'Empoli': 'EMP',
  'Lecce': 'LEC',
  'Monza': 'MON',
  'Venezia': 'VEN',
  // Bundesliga
  'Bayern München': 'FCB',
  'Bayern Munich': 'FCB',
  'Bayer Leverkusen': 'B04',
  'Bayer 04 Leverkusen': 'B04',
  'Borussia Dortmund': 'BVB',
  'RB Leipzig': 'RBL',
  'Eintracht Frankfurt': 'SGE',
  'VfB Stuttgart': 'VFB',
  'Stuttgart': 'VFB',
  'Wolfsburg': 'WOB',
  'VfL Wolfsburg': 'WOB',
  'Freiburg': 'SCF',
  'SC Freiburg': 'SCF',
  'Hoffenheim': 'TSG',
  'TSG Hoffenheim': 'TSG',
  '1899 Hoffenheim': 'TSG',
  'Union Berlin': 'FCU',
  '1. FC Union Berlin': 'FCU',
  'Augsburg': 'FCA',
  'FC Augsburg': 'FCA',
  'Werder Bremen': 'BRE',
  'SV Werder Bremen': 'BRE',
  'Bremen': 'BRE',
  'Borussia Monchengladbach': 'BMG',
  'Borussia M\'gladbach': 'BMG',
  'Monchengladbach': 'BMG',
  'B. Monchengladbach': 'BMG',
  'Borussia Mönchengladbach': 'BMG',
  'Mainz 05': 'M05',
  'Mainz': 'M05',
  '1. FSV Mainz 05': 'M05',
  'FSV Mainz 05': 'M05',
  'FSV Mainz': 'M05',
  'FC Köln': 'KOE',
  'FC Cologne': 'KOE',
  '1. FC Köln': 'KOE',
  '1. FC Koln': 'KOE',
  'Koln': 'KOE',
  'Köln': 'KOE',
  '1.FC Köln': 'KOE',
  '1.FC Koln': 'KOE',
  'Heidenheim': 'HDH',
  '1. FC Heidenheim': 'HDH',
  'Bochum': 'BOC',
  'VfL Bochum': 'BOC',
  'St. Pauli': 'STP',
  'FC St. Pauli': 'STP',
  // 추가 분데스리가 팀들 (2부 리그 포함)
  'Hamburg': 'HSV',
  'Hamburger SV': 'HSV',
  'HSV': 'HSV',
  // Ligue 1
  'Paris Saint Germain': 'PSG',
  'Monaco': 'MON',
  'Marseille': 'MAR',
  'Lille': 'LIL',
  'Nice': 'NIC',
  'Lyon': 'LYO',
  'Lens': 'LEN',
  'Rennes': 'REN',
  'Toulouse': 'TOU',
  'Reims': 'REI',
  'Strasbourg': 'STR',
  'Brest': 'BRE',
  'Nantes': 'NAN',
  'Montpellier': 'MON',
  'Auxerre': 'AUX',
  'Le Havre': 'LEH',
  'Saint-Etienne': 'STE',
  'Angers': 'ANG'
}

// 팀 이름을 약어로 변환하는 함수
const getTeamAbbreviation = (teamName: string): string => {
  return TEAM_ABBREVIATIONS[teamName] || teamName.substring(0, 3).toUpperCase()
}

interface StandingTeam {
  rank: number
  team: {
    id: number
    name: string
    logo: string
  }
  points: number
  goalsDiff: number
  form: string
  all: {
    played: number
    win: number
    draw: number
    lose: number
  }
}

export function LeagueStandings() {
  const router = useRouter()
  const { preferences } = useUserPreferences()
  const [selectedLeagueId, setSelectedLeagueId] = useState(39) // 기본값: 프리미어리그
  
  // 리그 순위 데이터 가져오기 - 2025/2026 시즌
  const currentSeason = 2025
  const { data: standingsData, isLoading } = useStandings({
    league: selectedLeagueId,
    season: currentSeason
  })
  
  // 전체 팀 추출
  const topTeams = standingsData?.response?.[0]?.league?.standings?.[0] || []
  const leagueInfo = standingsData?.response?.[0]?.league
  
  // 폼 색상
  const getFormColor = (result: string) => {
    if (result === 'W') return 'bg-green-500'
    if (result === 'L') return 'bg-red-500'
    if (result === 'D') return 'bg-gray-400'
    return 'bg-gray-200'
  }
  
  if (isLoading) {
    return (
      <Card className="relative overflow-hidden border-0 rounded-3xl shadow-2xl h-full">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 opacity-50" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-100/20 via-transparent to-transparent dark:from-blue-900/10" />
        
        <div className="relative p-6 h-full flex flex-col">
          <div className="mb-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 blur-xl opacity-40" />
                <div className="relative p-2.5 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-lg">
                  <Trophy className="w-5 h-5" />
                </div>
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  리그 순위
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  2025/26 시즌
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1 justify-center">
              {LEAGUES.map(league => (
                <Skeleton key={league.id} className="w-14 h-8 rounded-lg" />
              ))}
            </div>
          </div>
          <div className="space-y-2 flex-1">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(i => (
              <Skeleton key={i} className="h-9 w-full rounded-lg" />
            ))}
          </div>
        </div>
      </Card>
    )
  }
  
  return (
    <Card className="relative overflow-hidden border-0 rounded-3xl shadow-2xl">
      {/* 배경 그라디언트 효과 */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 opacity-50" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-100/20 via-transparent to-transparent dark:from-blue-900/10" />
      
      <div className="relative">
        {/* 헤더 */}
        <div className="px-6 pt-5 pb-3">
          <div className="flex items-center gap-3 mb-3">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 blur-xl opacity-40" />
              <div className="relative p-2.5 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-lg">
                <Trophy className="w-5 h-5" />
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                리그 순위
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                2025/26 시즌
              </p>
            </div>
          </div>
          
          {/* 리그 선택 버튼들 */}
          <div className="flex items-center gap-2 justify-between">
            {LEAGUES.map(league => (
              <Button
                key={league.id}
                variant="ghost"
                size="sm"
                onClick={() => setSelectedLeagueId(league.id)}
                className={cn(
                  "flex-1 px-2 py-1.5 h-8 rounded-xl transition-all flex items-center justify-center gap-1 whitespace-nowrap",
                  selectedLeagueId === league.id
                    ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md"
                    : "hover:bg-gray-100 dark:hover:bg-gray-700"
                )}
              >
                <span className="text-sm">{league.flag}</span>
                <span className="text-xs font-medium">{league.shortName}</span>
              </Button>
            ))}
          </div>
        </div>
      
        {/* 순위 테이블 */}
        <div className="px-6 pb-4">
          <table className="w-full">
            <thead className="border-b border-gray-200/50 dark:border-gray-700/50">
              <tr>
                <th className="text-left py-2 text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  #
                </th>
                <th className="text-left py-2 pl-2 text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  팀
                </th>
                <th className="text-center py-2 text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  경기
                </th>
                <th className="text-center py-2 text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  득실
                </th>
                <th className="text-center py-2 text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  승점
                </th>
                <th className="text-center py-2 text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  폼
                </th>
              </tr>
            </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {topTeams.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                  순위 데이터를 불러올 수 없습니다.
                </td>
              </tr>
            ) : (
              topTeams.map((team: StandingTeam, index: number) => {
                const isUserTeam = preferences?.favoriteTeamIds?.includes(team.team.id)
                const totalTeams = topTeams.length
                
                // 리그별 유럽대항전 진출 및 강등권 판단
                let isChampionsLeague = false
                let isEuropaLeague = false
                let isConferenceLeague = false
                let isRelegation = false
                
                if (selectedLeagueId === 61) { // Ligue 1
                  isChampionsLeague = team.rank <= 3
                  isEuropaLeague = team.rank === 4
                  isConferenceLeague = team.rank === 5
                } else { // 나머지 4대 리그
                  isChampionsLeague = team.rank <= 4
                  isEuropaLeague = team.rank === 5
                  isConferenceLeague = team.rank === 6
                }
                
                // 강등권 (하위 3팀)
                isRelegation = team.rank > totalTeams - 3
                
                return (
                  <tr
                    key={team.team.id}
                    onClick={() => router.push(`/teams/${team.team.id}`)}
                    className={cn(
                      "border-b border-gray-100 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors relative cursor-pointer",
                      isUserTeam && "bg-blue-50/50 dark:bg-blue-900/10"
                    )}
                  >
                    <td className="py-2 pl-1">
                      <div className="flex items-center gap-1">
                        {/* 색상 띠 */}
                        <div className={cn(
                          "w-1 h-6 rounded-sm",
                          isChampionsLeague && "bg-blue-500",
                          isEuropaLeague && "bg-orange-500",
                          isConferenceLeague && "bg-green-500",
                          isRelegation && "bg-red-500",
                          !isChampionsLeague && !isEuropaLeague && !isConferenceLeague && !isRelegation && "bg-transparent"
                        )} />
                        {/* 순위 표시 */}
                        <div className="w-6 h-6 flex items-center justify-center rounded-md font-bold text-xs text-gray-600 dark:text-gray-400">
                          {team.rank}
                        </div>
                      </div>
                    </td>
                    <td className="py-2 pl-2">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 relative flex-shrink-0">
                          <Image
                            src={team.team.logo}
                            alt={team.team.name}
                            fill
                            className="object-contain"
                          />
                        </div>
                        <span className={cn(
                          "font-semibold text-xs transition-colors",
                          isUserTeam ? "text-blue-600 dark:text-blue-400" : "text-gray-900 dark:text-white"
                        )}>
                          {getTeamAbbreviation(team.team.name)}
                        </span>
                      </div>
                    </td>
                    <td className="text-center py-2 text-xs text-gray-600 dark:text-gray-400">
                      {team.all.played}
                    </td>
                    <td className="text-center py-2">
                      <span className={cn(
                        "text-xs font-semibold px-1.5 py-0.5 rounded-md",
                        team.goalsDiff > 0 && "text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20",
                        team.goalsDiff < 0 && "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20",
                        team.goalsDiff === 0 && "text-gray-600 dark:text-gray-400"
                      )}>
                        {team.goalsDiff > 0 && '+'}{team.goalsDiff}
                      </span>
                    </td>
                    <td className="text-center py-2">
                      <span className="text-sm font-bold text-gray-900 dark:text-white">
                        {team.points}
                      </span>
                    </td>
                    <td className="py-2">
                      <div className="flex items-center justify-center gap-0.5">
                        {team.form?.slice(-3).split('').reverse().map((result, i) => (
                          <div
                            key={i}
                            className={cn(
                              "w-4 h-4 rounded-md text-[9px] font-bold flex items-center justify-center text-white",
                              result === 'W' && "bg-gradient-to-br from-green-400 to-green-600",
                              result === 'L' && "bg-gradient-to-br from-red-400 to-red-600",
                              result === 'D' && "bg-gradient-to-br from-gray-400 to-gray-600",
                              result === '-' && "bg-gray-200 dark:bg-gray-700"
                            )}
                          >
                            {result === 'W' ? 'W' : result === 'L' ? 'L' : result === 'D' ? 'D' : '-'}
                          </div>
                        ))}
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
            </tbody>
          </table>
        </div>
      
        {/* 범례 및 하단 링크 */}
        <div className="px-6 py-3 border-t border-gray-200/50 dark:border-gray-700/50 space-y-3">
          {/* 범례 */}
          <div className="flex flex-wrap gap-3 justify-center text-[10px]">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-blue-500 rounded"></div>
              <span className="text-gray-600 dark:text-gray-400">챔피언스리그</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-orange-500 rounded"></div>
              <span className="text-gray-600 dark:text-gray-400">유로파리그</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-green-500 rounded"></div>
              <span className="text-gray-600 dark:text-gray-400">컨퍼런스리그</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-red-500 rounded"></div>
              <span className="text-gray-600 dark:text-gray-400">강등</span>
            </div>
          </div>
          
          {/* 전체 순위표 링크 */}
          <Link
            href="/standings"
            className="flex items-center justify-center gap-2 text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors group"
          >
            전체 순위표 보기
            <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </div>
    </Card>
  )
}