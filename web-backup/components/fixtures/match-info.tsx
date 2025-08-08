import Image from 'next/image'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MapPin, Calendar, Clock, Users, Trophy, TrendingUp, Shield } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MatchInfoProps {
  fixture: any // TODO: Add proper type
}

export default function MatchInfo({ fixture }: MatchInfoProps) {
  const fixtureDate = new Date(fixture.fixture.date)
  
  // 팀 최근 폼 (예시 데이터)
  const getTeamForm = (teamId: number) => {
    // 실제 구현에서는 팀의 최근 5경기 결과를 가져와야 함
    return ['W', 'W', 'D', 'L', 'W']
  }
  
  return (
    <div className="space-y-6">
      {/* 경기 정보 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center">
            <Calendar className="w-5 h-5 mr-2" />
            경기 정보
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* 날짜 및 시간 */}
            <div className="flex items-start space-x-3">
              <Clock className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <div className="font-medium">
                  {fixtureDate.toLocaleDateString('ko-KR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    weekday: 'long'
                  })}
                </div>
                <div className="text-sm text-gray-600">
                  킥오프: {fixtureDate.toLocaleTimeString('ko-KR', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
              </div>
            </div>
            
            {/* 경기장 */}
            {fixture.fixture.venue && (
              <div className="flex items-start space-x-3">
                <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <div className="font-medium">{fixture.fixture.venue.name}</div>
                  {fixture.fixture.venue.city && (
                    <div className="text-sm text-gray-600">{fixture.fixture.venue.city}</div>
                  )}
                  {fixture.fixture.venue.capacity && (
                    <div className="text-sm text-gray-600">
                      수용인원: {fixture.fixture.venue.capacity.toLocaleString()}명
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* 대회 정보 */}
            <div className="flex items-start space-x-3">
              <Trophy className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <div className="font-medium">{fixture.league.name}</div>
                {fixture.league.round && (
                  <div className="text-sm text-gray-600">{fixture.league.round}</div>
                )}
              </div>
            </div>
            
            {/* 주심 */}
            {fixture.fixture.referee && (
              <div className="flex items-start space-x-3">
                <Users className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <div className="font-medium">주심</div>
                  <div className="text-sm text-gray-600">{fixture.fixture.referee}</div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* 팀 최근 경기 결과 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center">
            <TrendingUp className="w-5 h-5 mr-2" />
            최근 5경기
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* 홈팀 */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <Image
                    src={fixture.teams.home.logo}
                    alt={fixture.teams.home.name}
                    width={24}
                    height={24}
                    className="object-contain"
                  />
                  <span className="font-medium">{fixture.teams.home.name}</span>
                </div>
                <div className="flex space-x-1">
                  {getTeamForm(fixture.teams.home.id).map((result, idx) => (
                    <div
                      key={idx}
                      className={cn(
                        "w-8 h-8 rounded text-xs font-bold flex items-center justify-center",
                        result === 'W' && "bg-green-500 text-white",
                        result === 'D' && "bg-gray-400 text-white",
                        result === 'L' && "bg-red-500 text-white"
                      )}
                    >
                      {result}
                    </div>
                  ))}
                </div>
              </div>
              
              {/* 최근 경기 상세 (예시) */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <span className="text-gray-600">vs 맨체스터 시티</span>
                  <span className="font-medium">2-1 승</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <span className="text-gray-600">@ 첼시</span>
                  <span className="font-medium">3-1 승</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <span className="text-gray-600">vs 아스날</span>
                  <span className="font-medium">1-1 무</span>
                </div>
              </div>
            </div>
            
            {/* 원정팀 */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <Image
                    src={fixture.teams.away.logo}
                    alt={fixture.teams.away.name}
                    width={24}
                    height={24}
                    className="object-contain"
                  />
                  <span className="font-medium">{fixture.teams.away.name}</span>
                </div>
                <div className="flex space-x-1">
                  {getTeamForm(fixture.teams.away.id).map((result, idx) => (
                    <div
                      key={idx}
                      className={cn(
                        "w-8 h-8 rounded text-xs font-bold flex items-center justify-center",
                        result === 'W' && "bg-green-500 text-white",
                        result === 'D' && "bg-gray-400 text-white",
                        result === 'L' && "bg-red-500 text-white"
                      )}
                    >
                      {result}
                    </div>
                  ))}
                </div>
              </div>
              
              {/* 최근 경기 상세 (예시) */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <span className="text-gray-600">@ 리버풀</span>
                  <span className="font-medium">0-2 패</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <span className="text-gray-600">vs 토트넘</span>
                  <span className="font-medium">1-0 승</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <span className="text-gray-600">vs 레스터</span>
                  <span className="font-medium">2-0 승</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* 현재 순위 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center">
            <Shield className="w-5 h-5 mr-2" />
            현재 순위
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            {/* 홈팀 순위 */}
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-3xl font-bold text-blue-600 mb-1">3위</div>
              <div className="text-sm text-gray-600">
                <div>{fixture.teams.home.name}</div>
                <div className="mt-1">승점 45</div>
              </div>
            </div>
            
            {/* 원정팀 순위 */}
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-3xl font-bold text-red-600 mb-1">7위</div>
              <div className="text-sm text-gray-600">
                <div>{fixture.teams.away.name}</div>
                <div className="mt-1">승점 38</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}