'use client'

import { useState } from 'react'
import { Trophy, ChevronRight, Globe, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useLeagues, useStandings } from '@/lib/supabase/football'
import { SUPPORTED_LEAGUES, getLeagueName } from '@/lib/types/football'
import Link from 'next/link'
import Image from 'next/image'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  QualificationInfo,
  getQualificationInfo, 
  getQualificationColor, 
  getQualificationDescription,
  isQualificationRelevant 
} from '@/lib/utils/standings'

export default function LeaguesPage() {
  const [selectedLeague, setSelectedLeague] = useState<number>(SUPPORTED_LEAGUES.PREMIER_LEAGUE)
  const [showAllLeagues, setShowAllLeagues] = useState(false)
  
  // 시즌 선택 관련 상태
  const currentYear = new Date().getFullYear()
  const currentMonth = new Date().getMonth() + 1
  
  // 리그별 기본 시즌 설정
  const getDefaultSeason = (leagueId: number) => {
    const isKoreanLeague = leagueId === 292 || leagueId === 293 // K League 1, 2
    const isSingleYearLeague = isKoreanLeague || [253, 98, 71].includes(leagueId) // MLS, J리그, 브라질리그
    
    if (isSingleYearLeague) {
      return currentMonth < 3 ? currentYear - 1 : currentYear
    } else {
      return currentMonth < 8 ? currentYear - 1 : currentYear
    }
  }
  
  const [selectedSeason, setSelectedSeason] = useState(getDefaultSeason(selectedLeague))
  
  // 리그 변경 시 시즌도 업데이트
  const handleLeagueChange = (leagueId: number) => {
    setSelectedLeague(leagueId)
    setSelectedSeason(getDefaultSeason(leagueId))
  }
  
  const { data: leaguesData, isLoading: leaguesLoading } = useLeagues({ current: true })
  const { data: standingsData, isLoading: standingsLoading } = useStandings({ 
    league: selectedLeague, 
    season: selectedSeason 
  })
  
  // 모든 리그 목록
  const allLeagues = [
    // 유럽 5대 리그
    { id: SUPPORTED_LEAGUES.PREMIER_LEAGUE, name: 'Premier League', country: '🇬🇧', logo: 'https://media.api-sports.io/football/leagues/39.png' },
    { id: SUPPORTED_LEAGUES.LA_LIGA, name: 'La Liga', country: '🇪🇸', logo: 'https://media.api-sports.io/football/leagues/140.png' },
    { id: SUPPORTED_LEAGUES.SERIE_A, name: 'Serie A', country: '🇮🇹', logo: 'https://media.api-sports.io/football/leagues/135.png' },
    { id: SUPPORTED_LEAGUES.BUNDESLIGA, name: 'Bundesliga', country: '🇩🇪', logo: 'https://media.api-sports.io/football/leagues/78.png' },
    { id: SUPPORTED_LEAGUES.LIGUE_1, name: 'Ligue 1', country: '🇫🇷', logo: 'https://media.api-sports.io/football/leagues/61.png' },
    { id: SUPPORTED_LEAGUES.K_LEAGUE_1, name: 'K League 1', country: '🇰🇷', logo: 'https://media.api-sports.io/football/leagues/292.png' },
    // UEFA 대회
    { id: SUPPORTED_LEAGUES.CHAMPIONS_LEAGUE, name: 'Champions League', country: '🏆', logo: 'https://media.api-sports.io/football/leagues/2.png' },
    { id: SUPPORTED_LEAGUES.EUROPA_LEAGUE, name: 'Europa League', country: '🥈', logo: 'https://media.api-sports.io/football/leagues/3.png' },
    { id: SUPPORTED_LEAGUES.CONFERENCE_LEAGUE, name: 'Conference League', country: '🥉', logo: 'https://media.api-sports.io/football/leagues/4.png' },
    // 아시아
    { id: SUPPORTED_LEAGUES.K_LEAGUE_2, name: 'K League 2', country: '🇰🇷', logo: 'https://media.api-sports.io/football/leagues/293.png' },
    { id: SUPPORTED_LEAGUES.J1_LEAGUE, name: 'J1 League', country: '🇯🇵', logo: 'https://media.api-sports.io/football/leagues/98.png' },
    { id: SUPPORTED_LEAGUES.SAUDI_PRO_LEAGUE, name: 'Saudi Pro League', country: '🇸🇦', logo: 'https://media.api-sports.io/football/leagues/307.png' },
    { id: SUPPORTED_LEAGUES.AFC_CHAMPIONS_LEAGUE, name: 'AFC Champions', country: '🌏', logo: 'https://media.api-sports.io/football/leagues/848.png' },
    // 아메리카
    { id: SUPPORTED_LEAGUES.MLS, name: 'MLS', country: '🇺🇸', logo: 'https://media.api-sports.io/football/leagues/253.png' },
    { id: SUPPORTED_LEAGUES.BRAZIL_SERIE_A, name: 'Brasileirão', country: '🇧🇷', logo: 'https://media.api-sports.io/football/leagues/71.png' },
    // 국가대표
    { id: SUPPORTED_LEAGUES.NATIONS_LEAGUE, name: 'Nations League', country: '🌍', logo: 'https://media.api-sports.io/football/leagues/5.png' },
    { id: SUPPORTED_LEAGUES.WORLD_CUP, name: 'World Cup', country: '🏆', logo: 'https://media.api-sports.io/football/leagues/1.png' },
    { id: SUPPORTED_LEAGUES.CLUB_WORLD_CUP, name: 'Club World Cup', country: '🌎', logo: 'https://media.api-sports.io/football/leagues/15.png' },
  ]
  
  // 표시할 리그 목록 (처음 6개 또는 전체)
  const displayedLeagues = showAllLeagues ? allLeagues : allLeagues.slice(0, 6)
  
  const standings = standingsData?.response?.[0]?.league?.standings?.[0] || []

  // 시즌 옵션 생성 함수
  const generateSeasonOptions = () => {
    const options = []
    const startYear = 2020
    
    // 현재 시즌까지만 표시 (미래 시즌 제외)
    const maxYear = currentYear
    
    for (let year = maxYear; year >= startYear; year--) {
      // 단일 연도 시즌 (K리그, MLS, J리그 등)
      if ([292, 293, 253, 98, 71].includes(selectedLeague)) {
        options.push({ year, label: `${year}` })
      } else {
        // 크로스 연도 시즌 (유럽 리그들)
        options.push({ year, label: `${year}/${(year + 1).toString().slice(-2)}` })
      }
    }
    
    return options
  }

  return (
    <div className="min-h-screen lg:ml-64 bg-gray-50">
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
                <h1 className="text-xl font-bold">순위</h1>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {/* 리그 선택 탭 */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">인기 리그</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAllLeagues(!showAllLeagues)}
                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
              >
                {showAllLeagues ? '접기' : `더 보기 (+${allLeagues.length - 6})`}
                <ChevronRight className={`h-4 w-4 ml-1 transition-transform ${showAllLeagues ? 'rotate-90' : ''}`} />
              </Button>
            </div>
            <div className={`grid grid-cols-2 sm:grid-cols-3 gap-3 transition-all ${
              showAllLeagues ? 'md:grid-cols-4 lg:grid-cols-6' : 'md:grid-cols-6'
            }`}>
              {displayedLeagues.map((league) => (
                <button
                  key={league.id}
                  onClick={() => handleLeagueChange(league.id)}
                  className={`p-3 rounded-lg border transition-all flex flex-col items-center justify-center ${
                    selectedLeague === league.id 
                      ? 'border-blue-600 bg-blue-50 text-blue-600' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="mb-2">
                    <Image
                      src={league.logo}
                      alt={league.name}
                      width={40}
                      height={40}
                      className="object-contain"
                    />
                  </div>
                  <div className="text-xs font-medium text-center">{league.name}</div>
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
                <h2 className="text-2xl font-bold mb-2">{getLeagueName(selectedLeague)}</h2>
                <div className="flex items-center gap-2">
                  <span className="text-gray-600">시즌</span>
                  <select 
                    value={selectedSeason}
                    onChange={(e) => setSelectedSeason(parseInt(e.target.value))}
                    className="bg-gray-50 border border-gray-300 rounded-md px-3 py-1.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer hover:bg-gray-100 transition-colors"
                  >
                    {generateSeasonOptions().map(({ year, label }) => (
                      <option key={year} value={year} className="bg-white">
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
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
                      const qualificationInfo = getQualificationInfo(standing.rank, selectedLeague, standings.length)
                      const qualificationColor = getQualificationColor(qualificationInfo, selectedLeague)
                      
                      return (
                        <tr 
                          key={standing.team.id}
                          className="border-b hover:bg-gray-50 transition-colors"
                        >
                          <td className="py-3 pr-4">
                            <div className="flex items-center">
                              {/* 진출권 색상 표시 */}
                              {qualificationInfo !== QualificationInfo.None && (
                                <div 
                                  className="w-1 h-6 mr-2 rounded-full"
                                  style={{ backgroundColor: qualificationColor }}
                                />
                              )}
                              <div className={`
                                w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold
                                ${qualificationInfo !== QualificationInfo.None 
                                  ? 'text-white' 
                                  : 'bg-gray-100 text-gray-600'}
                              `}
                              style={{
                                backgroundColor: qualificationInfo !== QualificationInfo.None 
                                  ? qualificationColor 
                                  : undefined
                              }}>
                                {standing.rank}
                              </div>
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
                              <span className="font-medium">
                                {standing.team.name}
                                {/* 과거 시즌 1위 팀에 트로피 표시 */}
                                {(() => {
                                  // 단일 연도 시즌 (K리그, MLS, J리그 등)
                                  const isSingleYearLeague = [292, 293, 253, 98, 71].includes(selectedLeague)
                                  
                                  if (standing.rank === 1) {
                                    if (isSingleYearLeague) {
                                      // 단일 연도 리그는 현재 연도보다 작으면 종료됨
                                      return selectedSeason < currentYear ? " 🏆" : ""
                                    } else {
                                      // 크로스 연도 리그 (예: 2024-25 시즌)
                                      // 2024-25 시즌은 2025년 5-6월에 종료
                                      // selectedSeason이 2024이고 현재가 2025년 6월 이후면 종료
                                      // selectedSeason이 2023 이하면 무조건 종료
                                      if (selectedSeason < currentYear - 1) {
                                        return " 🏆" // 2년 이상 지난 시즌
                                      } else if (selectedSeason === currentYear - 1 && currentMonth >= 6) {
                                        return " 🏆" // 작년 시즌이고 6월 이후 (시즌 종료)
                                      }
                                      return "" // 현재 진행 중인 시즌
                                    }
                                  }
                                  return ""
                                })()}
                              </span>
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
              <div className="mt-6">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">진출권 정보</h4>
                <div className="flex flex-wrap gap-3 text-sm">
                  {/* 챔피언스리그와 유로파리그는 다른 범례 표시 */}
                  {(selectedLeague === 2 || selectedLeague === 3) ? (
                    <>
                      {[QualificationInfo.Knockout16Direct, QualificationInfo.Knockout16Playoff].map((info) => {
                        if (getQualificationDescription(info) && isQualificationRelevant(info, selectedLeague)) {
                          return (
                            <div key={info} className="flex items-center space-x-2">
                              <div 
                                className="w-4 h-4 rounded-full"
                                style={{ backgroundColor: getQualificationColor(info, selectedLeague) }}
                              />
                              <span className="text-gray-600">{getQualificationDescription(info)}</span>
                            </div>
                          )
                        }
                        return null
                      })}
                    </>
                  ) : (
                    <>
                      {/* 일반 리그 범례 */}
                      {[
                        QualificationInfo.ChampionsLeague,
                        QualificationInfo.ChampionsLeagueQualification,
                        QualificationInfo.EuropaLeague,
                        QualificationInfo.ConferenceLeague,
                        QualificationInfo.ConferenceLeagueQualification,
                        QualificationInfo.RelegationPlayoff,
                        QualificationInfo.Relegation
                      ].map((info) => {
                        if (getQualificationDescription(info) && isQualificationRelevant(info, selectedLeague)) {
                          return (
                            <div key={info} className="flex items-center space-x-2">
                              <div 
                                className="w-4 h-4 rounded-full"
                                style={{ backgroundColor: getQualificationColor(info, selectedLeague) }}
                              />
                              <span className="text-gray-600">{getQualificationDescription(info)}</span>
                            </div>
                          )
                        }
                        return null
                      })}
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

      </main>
    </div>
  )
}