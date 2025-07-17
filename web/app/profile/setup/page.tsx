'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  User, Trophy, ChevronRight, Search, Check, 
  Sparkles, Shield, Loader2 
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useSupabase } from '@/lib/supabase/provider'
import { updateProfile, ProfileUpdate } from '@/lib/supabase/server'

// 인기 팀 목록
const popularLeagues = [
  { id: 39, name: '프리미어리그', country: '잉글랜드' },
  { id: 140, name: '라리가', country: '스페인' },
  { id: 78, name: '분데스리가', country: '독일' },
  { id: 135, name: '세리에 A', country: '이탈리아' },
  { id: 61, name: '리그 1', country: '프랑스' }
]

const popularTeams: Record<number, any[]> = {
  39: [
    { id: 33, name: 'Manchester United', logo: 'https://media.api-sports.io/football/teams/33.png' },
    { id: 40, name: 'Liverpool', logo: 'https://media.api-sports.io/football/teams/40.png' },
    { id: 50, name: 'Manchester City', logo: 'https://media.api-sports.io/football/teams/50.png' },
    { id: 42, name: 'Arsenal', logo: 'https://media.api-sports.io/football/teams/42.png' },
    { id: 47, name: 'Tottenham', logo: 'https://media.api-sports.io/football/teams/47.png' },
    { id: 49, name: 'Chelsea', logo: 'https://media.api-sports.io/football/teams/49.png' }
  ],
  140: [
    { id: 541, name: 'Real Madrid', logo: 'https://media.api-sports.io/football/teams/541.png' },
    { id: 529, name: 'Barcelona', logo: 'https://media.api-sports.io/football/teams/529.png' },
    { id: 530, name: 'Atletico Madrid', logo: 'https://media.api-sports.io/football/teams/530.png' }
  ],
  78: [
    { id: 157, name: 'Bayern Munich', logo: 'https://media.api-sports.io/football/teams/157.png' },
    { id: 165, name: 'Borussia Dortmund', logo: 'https://media.api-sports.io/football/teams/165.png' }
  ],
  135: [
    { id: 496, name: 'Juventus', logo: 'https://media.api-sports.io/football/teams/496.png' },
    { id: 505, name: 'Inter', logo: 'https://media.api-sports.io/football/teams/505.png' },
    { id: 489, name: 'AC Milan', logo: 'https://media.api-sports.io/football/teams/489.png' }
  ],
  61: [
    { id: 85, name: 'Paris Saint Germain', logo: 'https://media.api-sports.io/football/teams/85.png' }
  ]
}

export default function ProfileSetupPage() {
  const router = useRouter()
  const { user } = useSupabase()
  
  const [step, setStep] = useState(1)
  const [nickname, setNickname] = useState('')
  const [selectedLeague, setSelectedLeague] = useState<number | null>(null)
  const [selectedTeam, setSelectedTeam] = useState<any>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) {
      router.push('/auth/login')
    }
  }, [user, router])

  const filteredTeams = selectedLeague 
    ? popularTeams[selectedLeague]?.filter(team => 
        team.name.toLowerCase().includes(searchQuery.toLowerCase())
      ) || []
    : []

  const handleComplete = async () => {
    if (!user) return
    
    setIsLoading(true)
    setError(null)

    try {
      const updates: ProfileUpdate = {
        nickname: nickname.trim(),
        favoriteTeamId: selectedTeam?.id,
        favoriteTeamName: selectedTeam?.name
      }

      await updateProfile(user.id, updates)
      
      // 팀 게시판 자동 팔로우
      if (selectedTeam) {
        // TODO: 팀 게시판 팔로우 로직
      }

      router.push('/community')
    } catch (err) {
      setError(err instanceof Error ? err.message : '프로필 설정에 실패했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  const isValidNickname = nickname.trim().length >= 2 && nickname.trim().length <= 20

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12">
      <div className="container max-w-2xl mx-auto px-4">
        {/* 진행 상황 표시 */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-4">
            <div className={`flex items-center space-x-2 ${step >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200'
              }`}>
                {step > 1 ? <Check className="w-5 h-5" /> : '1'}
              </div>
              <span className="font-medium">닉네임</span>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
            <div className={`flex items-center space-x-2 ${step >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200'
              }`}>
                {step > 2 ? <Check className="w-5 h-5" /> : '2'}
              </div>
              <span className="font-medium">응원팀</span>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
            <div className={`flex items-center space-x-2 ${step >= 3 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                step >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-200'
              }`}>
                3
              </div>
              <span className="font-medium">완료</span>
            </div>
          </div>
        </div>

        {/* Step 1: 닉네임 설정 */}
        {step === 1 && (
          <Card className="border-0 shadow-xl">
            <CardHeader className="text-center pb-4">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mb-4">
                <User className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-2xl">닉네임을 설정해주세요</CardTitle>
              <p className="text-gray-600 mt-2">
                커뮤니티에서 사용할 닉네임을 입력하세요
              </p>
            </CardHeader>
            <CardContent className="p-8">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    닉네임
                  </label>
                  <Input
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    placeholder="2-20자의 닉네임"
                    maxLength={20}
                    className="h-12 text-lg"
                  />
                  <div className="flex justify-between mt-2">
                    <p className="text-sm text-gray-500">
                      한글, 영문, 숫자 사용 가능
                    </p>
                    <p className={`text-sm ${
                      isValidNickname ? 'text-green-600' : 'text-gray-500'
                    }`}>
                      {nickname.length}/20
                    </p>
                  </div>
                </div>

                <Button
                  onClick={() => setStep(2)}
                  disabled={!isValidNickname}
                  className="w-full h-12 text-base font-semibold"
                >
                  다음
                  <ChevronRight className="ml-2 h-5 w-5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: 응원팀 선택 */}
        {step === 2 && (
          <Card className="border-0 shadow-xl">
            <CardHeader className="text-center pb-4">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mb-4">
                <Trophy className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-2xl">응원하는 팀을 선택해주세요</CardTitle>
              <p className="text-gray-600 mt-2">
                선택한 팀의 전용 커뮤니티에 자동으로 가입됩니다
              </p>
            </CardHeader>
            <CardContent className="p-8">
              <div className="space-y-6">
                {/* 리그 선택 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    리그 선택
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {popularLeagues.map(league => (
                      <button
                        key={league.id}
                        onClick={() => {
                          setSelectedLeague(league.id)
                          setSearchQuery('')
                        }}
                        className={`p-4 rounded-lg border-2 transition-all ${
                          selectedLeague === league.id 
                            ? 'border-blue-600 bg-blue-50' 
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <p className="font-semibold">{league.name}</p>
                        <p className="text-sm text-gray-600">{league.country}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 팀 검색 및 선택 */}
                {selectedLeague && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      팀 선택
                    </label>
                    <div className="relative mb-4">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <Input
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="팀 이름으로 검색"
                        className="pl-10"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3 max-h-64 overflow-y-auto">
                      {filteredTeams.map(team => (
                        <button
                          key={team.id}
                          onClick={() => setSelectedTeam(team)}
                          className={`p-4 rounded-lg border-2 transition-all flex items-center space-x-3 ${
                            selectedTeam?.id === team.id 
                              ? 'border-blue-600 bg-blue-50' 
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <img 
                            src={team.logo} 
                            alt={team.name}
                            className="w-10 h-10 object-contain"
                          />
                          <span className="font-medium text-left">{team.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex space-x-3">
                  <Button
                    variant="outline"
                    onClick={() => setStep(1)}
                    className="flex-1 h-12"
                  >
                    이전
                  </Button>
                  <Button
                    onClick={() => setStep(3)}
                    className="flex-1 h-12 font-semibold"
                  >
                    {selectedTeam ? '다음' : '건너뛰기'}
                    <ChevronRight className="ml-2 h-5 w-5" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: 완료 */}
        {step === 3 && (
          <Card className="border-0 shadow-xl">
            <CardHeader className="text-center pb-4">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full mb-4">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-2xl">프로필 설정 완료!</CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              <div className="space-y-6">
                {/* 프로필 요약 */}
                <div className="bg-gray-50 rounded-lg p-6 space-y-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">닉네임</p>
                    <p className="text-lg font-semibold">{nickname}</p>
                  </div>
                  {selectedTeam && (
                    <div>
                      <p className="text-sm text-gray-600 mb-1">응원팀</p>
                      <div className="flex items-center space-x-3">
                        <img 
                          src={selectedTeam.logo} 
                          alt={selectedTeam.name}
                          className="w-8 h-8 object-contain"
                        />
                        <p className="text-lg font-semibold">{selectedTeam.name}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* 혜택 안내 */}
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                      <p className="font-medium">전용 커뮤니티 가입</p>
                      <p className="text-sm text-gray-600">
                        {selectedTeam ? `${selectedTeam.name} 팬들과 함께하세요` : '모든 팀의 소식을 받아보세요'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Trophy className="w-5 h-5 text-purple-600 mt-0.5" />
                    <div>
                      <p className="font-medium">특별 배지 획득</p>
                      <p className="text-sm text-gray-600">프로필에 팀 배지가 표시됩니다</p>
                    </div>
                  </div>
                </div>

                {error && (
                  <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
                    {error}
                  </div>
                )}

                <div className="flex space-x-3">
                  <Button
                    variant="outline"
                    onClick={() => setStep(2)}
                    className="flex-1 h-12"
                    disabled={isLoading}
                  >
                    이전
                  </Button>
                  <Button
                    onClick={handleComplete}
                    className="flex-1 h-12 font-semibold"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        설정 중...
                      </>
                    ) : (
                      <>
                        커뮤니티 시작하기
                        <ChevronRight className="ml-2 h-5 w-5" />
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}