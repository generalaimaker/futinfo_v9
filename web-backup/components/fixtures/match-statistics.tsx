import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Activity, Target, Shield, Zap, BarChart } from 'lucide-react'

interface MatchStatisticsProps {
  fixture: any // TODO: Add proper type
}

interface StatCategory {
  title: string
  icon: any
  stats: string[]
}

export default function MatchStatistics({ fixture }: MatchStatisticsProps) {
  if (!fixture.statistics || fixture.statistics.length < 2) {
    return (
      <div className="text-center py-8 text-gray-500">
        통계 정보가 아직 없습니다.
      </div>
    )
  }
  
  const homeStats = fixture.statistics[0].statistics
  const awayStats = fixture.statistics[1].statistics
  
  // 통계 값 가져오기
  const getStatValue = (stats: any[], type: string): any => {
    const stat = stats.find((s: any) => s.type === type)
    return stat?.value ?? 0
  }
  
  // 퍼센트 계산
  const calculatePercentage = (value: any): number => {
    if (typeof value === 'string' && value.includes('%')) {
      return parseInt(value)
    }
    return value
  }
  
  // 통계 카테고리
  const categories: StatCategory[] = [
    {
      title: '슈팅',
      icon: Target,
      stats: ['Total Shots', 'Shots on Goal', 'Shots off Goal', 'Blocked Shots', 'Shots insidebox', 'Shots outsidebox']
    },
    {
      title: '패스',
      icon: Activity,
      stats: ['Total passes', 'Passes accurate', 'Passes %']
    },
    {
      title: '수비',
      icon: Shield,
      stats: ['Fouls', 'Yellow Cards', 'Red Cards', 'Offsides']
    },
    {
      title: '공격',
      icon: Zap,
      stats: ['Corner Kicks', 'Ball Possession', 'expected_goals']
    },
    {
      title: '기타',
      icon: BarChart,
      stats: ['Goalkeeper Saves', 'Total Tackles', 'Interceptions', 'Passes %']
    }
  ]
  
  // 통계 비교 바
  const StatBar = ({ homeStat, awayStat, label }: { homeStat: any, awayStat: any, label: string }) => {
    const homeValue = calculatePercentage(homeStat)
    const awayValue = calculatePercentage(awayStat)
    const total = homeValue + awayValue || 1
    const homePercent = (homeValue / total) * 100
    const awayPercent = (awayValue / total) * 100
    
    return (
      <div className="mb-4">
        <div className="flex justify-between text-sm mb-2">
          <span className="font-medium">{homeStat ?? 0}</span>
          <span className="text-gray-600">{label}</span>
          <span className="font-medium">{awayStat ?? 0}</span>
        </div>
        <div className="flex h-2 rounded-full overflow-hidden">
          <div 
            className="bg-blue-500 transition-all duration-300"
            style={{ width: `${homePercent}%` }}
          />
          <div 
            className="bg-red-500 transition-all duration-300"
            style={{ width: `${awayPercent}%` }}
          />
        </div>
      </div>
    )
  }
  
  // 통계 이름 한글화
  const translateStatName = (statName: string): string => {
    const translations: Record<string, string> = {
      'Total Shots': '전체 슈팅',
      'Shots on Goal': '유효 슈팅',
      'Shots off Goal': '골대 벗어난 슈팅',
      'Blocked Shots': '차단된 슈팅',
      'Shots insidebox': '박스 안 슈팅',
      'Shots outsidebox': '박스 밖 슈팅',
      'Total passes': '전체 패스',
      'Passes accurate': '정확한 패스',
      'Passes %': '패스 성공률',
      'Ball Possession': '점유율',
      'Fouls': '파울',
      'Corner Kicks': '코너킥',
      'Offsides': '오프사이드',
      'Yellow Cards': '경고',
      'Red Cards': '퇴장',
      'Goalkeeper Saves': '골키퍼 선방',
      'Total Tackles': '태클',
      'Interceptions': '인터셉트',
      'expected_goals': '기대 득점(xG)'
    }
    return translations[statName] || statName
  }
  
  return (
    <div className="space-y-6">
      {/* 팀 정보 헤더 */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-blue-500 rounded-full" />
          <span className="font-medium">{fixture.teams.home.name}</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="font-medium">{fixture.teams.away.name}</span>
          <div className="w-3 h-3 bg-red-500 rounded-full" />
        </div>
      </div>
      
      {/* 통계 카테고리별 표시 */}
      {categories.map((category, idx) => {
        const categoryStats = category.stats.filter(statName => 
          homeStats.some((s: any) => s.type === statName) ||
          awayStats.some((s: any) => s.type === statName)
        )
        
        if (categoryStats.length === 0) return null
        
        return (
          <Card key={idx}>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center">
                <category.icon className="w-5 h-5 mr-2" />
                {category.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {categoryStats.map((statName) => (
                <StatBar
                  key={statName}
                  homeStat={getStatValue(homeStats, statName)}
                  awayStat={getStatValue(awayStats, statName)}
                  label={translateStatName(statName)}
                />
              ))}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}