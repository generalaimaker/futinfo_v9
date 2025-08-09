'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { 
  User, Shield, Trophy, Heart, Calendar, MessageSquare, 
  Edit2, Camera, ChevronRight, Loader2, Settings
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CommunityService } from '@/lib/supabase/community'
import { useSupabase } from '@/lib/supabase/provider'
import { formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'

export default function ProfilePage() {
  const router = useRouter()
  const { user } = useSupabase()
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState({
    posts: 0,
    comments: 0,
    likes: 0
  })

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
      
      // TODO: Load user stats from database
      // For now, using mock data
      setStats({
        posts: 15,
        comments: 42,
        likes: 128
      })
    } catch (error) {
      console.error('Error loading profile:', error)
      setError('프로필을 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-500">프로필 로딩 중...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={() => router.back()}>
            돌아가기
          </Button>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-500">프로필을 불러올 수 없습니다</p>
          <Button onClick={() => router.push('/profile/setup')} className="mt-4">
            프로필 설정하기
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">내 프로필</h1>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/profile/edit')}
            >
              <Edit2 className="h-4 w-4 mr-2" />
              프로필 편집
            </Button>
          </div>
        </div>
      </div>

      {/* Profile Content */}
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="grid gap-6">
          {/* Profile Card */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start space-x-6">
                {/* Avatar */}
                <div className="relative">
                  <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    {profile.avatarUrl ? (
                      <img 
                        src={profile.avatarUrl} 
                        alt={profile.nickname}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <User className="w-12 h-12 text-white" />
                    )}
                  </div>
                  <button className="absolute bottom-0 right-0 p-1.5 bg-white rounded-full shadow-lg border hover:bg-gray-50">
                    <Camera className="h-4 w-4 text-gray-600" />
                  </button>
                </div>

                {/* Profile Info */}
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h2 className="text-2xl font-bold">{profile.nickname}</h2>
                    {profile.favoriteTeamId && (
                      <Badge variant="secondary" className="flex items-center space-x-1">
                        <Heart className="h-3 w-3 text-red-500" />
                        <span>{profile.favoriteTeamName}</span>
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-4 text-sm text-gray-600 mb-4">
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-4 w-4" />
                      <span>
                        가입일: {formatDistanceToNow(new Date(profile.createdAt), { 
                          addSuffix: true,
                          locale: ko 
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <p className="text-2xl font-bold text-blue-600">{stats.posts}</p>
                      <p className="text-sm text-gray-600">게시글</p>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <p className="text-2xl font-bold text-green-600">{stats.comments}</p>
                      <p className="text-sm text-gray-600">댓글</p>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <p className="text-2xl font-bold text-red-600">{stats.likes}</p>
                      <p className="text-sm text-gray-600">좋아요</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Favorite Team Card */}
          {profile.favoriteTeamId && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Trophy className="h-5 w-5 text-yellow-500" />
                  <span>응원하는 팀</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <img 
                      src={`https://media.api-sports.io/football/teams/${profile.favoriteTeamId}.png`}
                      alt={profile.favoriteTeamName}
                      className="w-16 h-16 object-contain"
                    />
                    <div>
                      <h3 className="font-semibold text-lg">{profile.favoriteTeamName}</h3>
                      <p className="text-sm text-gray-600">팬 커뮤니티 멤버</p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => router.push(`/community/boards/team_${profile.favoriteTeamId}`)}
                  >
                    팬 게시판 이동
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
                
                <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-blue-900">팬 특전</p>
                      <p className="text-sm text-blue-700 mt-1">
                        팀 전용 게시판 접근, 특별 배지, 실시간 매치 토론 참여
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>빠른 메뉴</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <button
                  onClick={() => router.push('/profile/edit')}
                  className="w-full p-4 flex items-center justify-between hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <Edit2 className="h-5 w-5 text-gray-600" />
                    <span>프로필 수정</span>
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-400" />
                </button>
                
                <button
                  onClick={() => router.push('/settings')}
                  className="w-full p-4 flex items-center justify-between hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <Settings className="h-5 w-5 text-gray-600" />
                    <span>설정</span>
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-400" />
                </button>
                
                <button
                  onClick={() => router.push('/favorites')}
                  className="w-full p-4 flex items-center justify-between hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <Heart className="h-5 w-5 text-gray-600" />
                    <span>관심 팀/선수</span>
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-400" />
                </button>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MessageSquare className="h-5 w-5" />
                <span>최근 활동</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <MessageSquare className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>아직 활동 내역이 없습니다</p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => router.push('/community')}
                >
                  커뮤니티 둘러보기
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}