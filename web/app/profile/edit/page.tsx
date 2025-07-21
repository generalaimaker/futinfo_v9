'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  ArrowLeft, User, Trophy, Search, Check, Loader2, 
  X, ChevronRight
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CommunityService } from '@/lib/supabase/community'
import { useSupabase } from '@/lib/supabase/provider'
import { toast } from '@/hooks/use-toast'

// 인기 팀 목록 (프로필 설정과 동일)
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

export default function EditProfilePage() {
  const router = useRouter()
  const { user } = useSupabase()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [profile, setProfile] = useState<any>(null)
  
  // Form state
  const [nickname, setNickname] = useState('')
  const [selectedLeague, setSelectedLeague] = useState<number | null>(null)
  const [selectedTeam, setSelectedTeam] = useState<any>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [showTeamSelector, setShowTeamSelector] = useState(false)

  useEffect(() => {
    if (!user) {
      router.push('/auth/login')
      return
    }
    loadProfile()
  }, [user])

  const loadProfile = async () => {
    try {
      const userProfile = await CommunityService.getCurrentUserProfile()
      if (!userProfile) {
        router.push('/profile/setup')
        return
      }
      
      setProfile(userProfile)
      setNickname(userProfile.nickname || '')
      
      if (userProfile.favoriteTeamId) {
        // Find the team and league
        for (const [leagueId, teams] of Object.entries(popularTeams)) {
          const team = teams.find(t => t.id === userProfile.favoriteTeamId)
          if (team) {
            setSelectedLeague(parseInt(leagueId))
            setSelectedTeam(team)
            break
          }
        }
      }
    } catch (error) {
      console.error('Error loading profile:', error)
      toast({
        title: '오류',
        description: '프로필을 불러오는데 실패했습니다.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const filteredTeams = selectedLeague 
    ? popularTeams[selectedLeague]?.filter(team => 
        team.name.toLowerCase().includes(searchQuery.toLowerCase())
      ) || []
    : []

  const handleSave = async () => {
    if (!nickname.trim() || nickname.trim().length < 2) {
      toast({
        title: '경고',
        description: '닉네임은 2자 이상이어야 합니다.',
        variant: 'destructive',
      })
      return
    }

    setSaving(true)

    try {
      await CommunityService.updateProfile({
        nickname: nickname.trim(),
        favoriteTeamId: selectedTeam?.id,
        favoriteTeamName: selectedTeam?.name
      })

      toast({
        title: '성공',
        description: '프로필이 업데이트되었습니다.',
      })

      router.push('/profile')
    } catch (error) {
      console.error('Error updating profile:', error)
      toast({
        title: '오류',
        description: '프로필 업데이트에 실패했습니다.',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-500">로딩 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-40">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.back()}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <h1 className="text-lg font-semibold">프로필 편집</h1>
            </div>
            <Button
              onClick={handleSave}
              disabled={saving || !nickname.trim()}
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  저장 중...
                </>
              ) : (
                '저장'
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-6 max-w-2xl">
        <div className="space-y-6">
          {/* Nickname */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="h-5 w-5" />
                <span>닉네임</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Input
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="닉네임을 입력하세요"
                maxLength={20}
                className="mb-2"
              />
              <p className="text-sm text-gray-500">
                2-20자의 닉네임 ({nickname.length}/20)
              </p>
            </CardContent>
          </Card>

          {/* Favorite Team */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Trophy className="h-5 w-5" />
                <span>응원하는 팀</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedTeam && !showTeamSelector ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <img 
                        src={selectedTeam.logo} 
                        alt={selectedTeam.name}
                        className="w-12 h-12 object-contain"
                      />
                      <div>
                        <p className="font-semibold">{selectedTeam.name}</p>
                        <p className="text-sm text-gray-600">
                          {popularLeagues.find(l => l.id === selectedLeague)?.name}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowTeamSelector(true)}
                    >
                      변경
                    </Button>
                  </div>
                  
                  <div className="p-3 bg-blue-50 rounded-lg text-sm text-blue-700">
                    팀을 변경하면 이전 팀 게시판에서 자동으로 나가집니다.
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {showTeamSelector && selectedTeam && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowTeamSelector(false)}
                      className="mb-2"
                    >
                      <X className="h-4 w-4 mr-1" />
                      취소
                    </Button>
                  )}
                  
                  {/* League Selection */}
                  <div>
                    <p className="text-sm font-medium mb-2">리그 선택</p>
                    <div className="grid grid-cols-2 gap-2">
                      {popularLeagues.map(league => (
                        <button
                          key={league.id}
                          onClick={() => {
                            setSelectedLeague(league.id)
                            setSearchQuery('')
                          }}
                          className={`p-3 rounded-lg border transition-colors text-sm ${
                            selectedLeague === league.id 
                              ? 'border-blue-600 bg-blue-50' 
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <p className="font-medium">{league.name}</p>
                          <p className="text-xs text-gray-600">{league.country}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Team Selection */}
                  {selectedLeague && (
                    <div>
                      <p className="text-sm font-medium mb-2">팀 선택</p>
                      <div className="relative mb-3">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="팀 이름으로 검색"
                          className="pl-9 h-9 text-sm"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                        {filteredTeams.map(team => (
                          <button
                            key={team.id}
                            onClick={() => {
                              setSelectedTeam(team)
                              setShowTeamSelector(false)
                            }}
                            className={`p-3 rounded-lg border transition-colors flex items-center space-x-2 ${
                              selectedTeam?.id === team.id 
                                ? 'border-blue-600 bg-blue-50' 
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <img 
                              src={team.logo} 
                              alt={team.name}
                              className="w-8 h-8 object-contain"
                            />
                            <span className="text-sm font-medium">{team.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {!selectedTeam && (
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => {
                        setSelectedTeam(null)
                        setShowTeamSelector(false)
                      }}
                    >
                      팀 선택 안함
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}