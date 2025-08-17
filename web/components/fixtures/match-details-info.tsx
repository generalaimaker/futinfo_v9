'use client'

import Image from 'next/image'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { 
  MapPin, Users, Calendar, Clock, 
  Thermometer, Wind, Droplets, Cloud, Eye, Trophy, AlertCircle
} from 'lucide-react'

interface MatchDetailsInfoProps {
  fixture: any
}

// 날씨 아이콘 매핑
const getWeatherIcon = (condition: string) => {
  const lowerCondition = condition?.toLowerCase() || ''
  if (lowerCondition.includes('cloud')) return <Cloud className="w-4 h-4" />
  if (lowerCondition.includes('rain')) return <Droplets className="w-4 h-4" />
  if (lowerCondition.includes('wind')) return <Wind className="w-4 h-4" />
  return <Thermometer className="w-4 h-4" />
}

export function MatchDetailsInfo({ fixture }: MatchDetailsInfoProps) {
  const matchDate = new Date(fixture.fixture.date)
  const venue = fixture.fixture.venue
  const referee = fixture.fixture.referee
  
  return (
    <div className="space-y-6">
      {/* 경기 정보 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            경기 정보
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 일시 */}
          <div className="flex items-start gap-3">
            <Clock className="w-5 h-5 text-gray-500 mt-0.5" />
            <div>
              <p className="font-medium">일시</p>
              <p className="text-sm text-gray-600">
                {format(matchDate, 'yyyy년 M월 d일 (EEEE)', { locale: ko })}
              </p>
              <p className="text-sm text-gray-600">
                {format(matchDate, 'HH:mm', { locale: ko })} KST
              </p>
            </div>
          </div>
          
          {/* 리그 & 라운드 */}
          <div className="flex items-start gap-3">
            <Trophy className="w-5 h-5 text-gray-500 mt-0.5" />
            <div>
              <p className="font-medium">대회</p>
              <div className="flex items-center gap-2 mt-1">
                {fixture.league.logo && (
                  <Image
                    src={fixture.league.logo}
                    alt={fixture.league.name}
                    width={20}
                    height={20}
                    className="object-contain"
                  />
                )}
                <p className="text-sm text-gray-600">{fixture.league.name}</p>
              </div>
              {fixture.league.round && (
                <p className="text-sm text-gray-600 mt-1">{fixture.league.round}</p>
              )}
            </div>
          </div>
          
          {/* 시즌 */}
          {fixture.league.season && (
            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-gray-500 mt-0.5" />
              <div>
                <p className="font-medium">시즌</p>
                <p className="text-sm text-gray-600">{fixture.league.season}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* 경기장 정보 */}
      {venue && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              경기장
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 경기장 이름 */}
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-gray-500 mt-0.5" />
              <div>
                <p className="font-medium">{venue.name || '미정'}</p>
                {venue.city && (
                  <p className="text-sm text-gray-600">{venue.city}</p>
                )}
              </div>
            </div>
            
            {/* 수용인원 */}
            {venue.capacity && (
              <div className="flex items-start gap-3">
                <Users className="w-5 h-5 text-gray-500 mt-0.5" />
                <div>
                  <p className="font-medium">수용 인원</p>
                  <p className="text-sm text-gray-600">
                    {venue.capacity.toLocaleString()}명
                  </p>
                </div>
              </div>
            )}
            
            {/* 표면 */}
            {venue.surface && (
              <div className="flex items-start gap-3">
                <Eye className="w-5 h-5 text-gray-500 mt-0.5" />
                <div>
                  <p className="font-medium">경기장 표면</p>
                  <p className="text-sm text-gray-600">
                    {venue.surface === 'grass' ? '천연 잔디' : 
                     venue.surface === 'artificial' ? '인조 잔디' : venue.surface}
                  </p>
                </div>
              </div>
            )}
            
            {/* 경기장 이미지 (있는 경우) */}
            {venue.image && (
              <div className="mt-4">
                <div className="relative aspect-video rounded-lg overflow-hidden">
                  <Image
                    src={venue.image}
                    alt={venue.name}
                    fill
                    className="object-cover"
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
      
      {/* 심판 정보 */}
      {referee && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              심판
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{referee}</p>
                <p className="text-sm text-gray-600">주심</p>
              </div>
              {/* 심판 통계 (API에서 제공하는 경우) */}
              {fixture.fixture.refereeStats && (
                <div className="text-right">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      평균 옐로카드: {fixture.fixture.refereeStats.yellowCards || 0}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      평균 레드카드: {fixture.fixture.refereeStats.redCards || 0}
                    </Badge>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* 날씨 정보 (API에서 제공하는 경우) */}
      {fixture.weather && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Cloud className="w-5 h-5" />
              날씨
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              {/* 온도 */}
              {fixture.weather.temperature && (
                <div className="flex items-center gap-2">
                  <Thermometer className="w-4 h-4 text-gray-500" />
                  <span className="text-sm">
                    {fixture.weather.temperature}°C
                  </span>
                </div>
              )}
              
              {/* 날씨 상태 */}
              {fixture.weather.description && (
                <div className="flex items-center gap-2">
                  {getWeatherIcon(fixture.weather.description)}
                  <span className="text-sm">
                    {fixture.weather.description}
                  </span>
                </div>
              )}
              
              {/* 풍속 */}
              {fixture.weather.wind && (
                <div className="flex items-center gap-2">
                  <Wind className="w-4 h-4 text-gray-500" />
                  <span className="text-sm">
                    {fixture.weather.wind} km/h
                  </span>
                </div>
              )}
              
              {/* 습도 */}
              {fixture.weather.humidity && (
                <div className="flex items-center gap-2">
                  <Droplets className="w-4 h-4 text-gray-500" />
                  <span className="text-sm">
                    {fixture.weather.humidity}%
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* 추가 정보 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">추가 정보</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* 상태 */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">경기 상태</span>
            <Badge 
              variant={
                fixture.fixture.status.short === 'FT' ? 'default' :
                fixture.fixture.status.short === 'NS' ? 'outline' :
                ['1H', '2H', 'HT', 'ET', 'P'].includes(fixture.fixture.status.short) ? 'destructive' :
                'secondary'
              }
            >
              {fixture.fixture.status.long}
            </Badge>
          </div>
          
          {/* 경과 시간 (라이브인 경우) */}
          {fixture.fixture.status.elapsed && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">경과 시간</span>
              <span className="font-medium">{fixture.fixture.status.elapsed}'</span>
            </div>
          )}
          
          {/* 타임존 */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">타임존</span>
            <span className="text-sm">{fixture.fixture.timezone || 'Asia/Seoul'}</span>
          </div>
          
          {/* Fixture ID */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">경기 ID</span>
            <span className="text-sm font-mono">{fixture.fixture.id}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// 기본 익스포트 추가
export default MatchDetailsInfo