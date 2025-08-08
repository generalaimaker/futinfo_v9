'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  ArrowLeft, Settings, User, Bell, Shield, Globe, 
  Moon, Sun, Smartphone, Mail, Lock, Trash2, 
  ChevronRight, Loader2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { CommunityService } from '@/lib/supabase/community'
import { useSupabase } from '@/lib/supabase/provider'

export default function SettingsPage() {
  const router = useRouter()
  const { user, signOut } = useSupabase()
  const [userProfile, setUserProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [settings, setSettings] = useState({
    notifications: {
      email: true,
      push: true,
      comments: true,
      likes: true,
      mentions: true,
      teamNews: true
    },
    privacy: {
      showEmail: false,
      showActivity: true,
      allowMessages: true
    },
    appearance: {
      darkMode: false,
      language: 'ko'
    }
  })

  useEffect(() => {
    if (!user) {
      router.push('/auth/login')
      return
    }
    loadUserProfile()
  }, [user])

  const loadUserProfile = async () => {
    try {
      const profile = await CommunityService.getCurrentUserProfile()
      setUserProfile(profile)
    } catch (error) {
      console.error('Error loading profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSettingChange = (category: string, setting: string, value: boolean) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [setting]: value
      }
    }))
  }

  const handleDeleteAccount = async () => {
    if (!confirm('정말로 계정을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) return
    
    const confirmText = prompt('계정 삭제를 확인하려면 "DELETE"를 입력하세요:')
    if (confirmText !== 'DELETE') return

    try {
      // 실제로는 soft delete를 구현해야 함
      alert('계정 삭제 기능은 아직 구현되지 않았습니다.')
    } catch (error) {
      console.error('Error deleting account:', error)
      alert('계정 삭제에 실패했습니다.')
    }
  }

  const handleSignOut = async () => {
    try {
      await signOut()
      router.push('/')
    } catch (error) {
      console.error('Error signing out:', error)
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
              <h1 className="text-lg font-semibold">설정</h1>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-6 max-w-2xl">
        <div className="space-y-6">
          {/* 프로필 설정 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="h-5 w-5" />
                <span>프로필</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">프로필 편집</p>
                  <p className="text-sm text-gray-500">닉네임, 응원팀 변경</p>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => router.push('/profile/edit')}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">계정 정보</p>
                  <p className="text-sm text-gray-500">{user?.email}</p>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => router.push('/profile')}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* 알림 설정 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Bell className="h-5 w-5" />
                <span>알림</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="email-notifications">이메일 알림</Label>
                <Switch
                  id="email-notifications"
                  checked={settings.notifications.email}
                  onCheckedChange={(checked) => handleSettingChange('notifications', 'email', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="push-notifications">푸시 알림</Label>
                <Switch
                  id="push-notifications"
                  checked={settings.notifications.push}
                  onCheckedChange={(checked) => handleSettingChange('notifications', 'push', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="comment-notifications">댓글 알림</Label>
                <Switch
                  id="comment-notifications"
                  checked={settings.notifications.comments}
                  onCheckedChange={(checked) => handleSettingChange('notifications', 'comments', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="like-notifications">좋아요 알림</Label>
                <Switch
                  id="like-notifications"
                  checked={settings.notifications.likes}
                  onCheckedChange={(checked) => handleSettingChange('notifications', 'likes', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="team-news">팀 뉴스 알림</Label>
                <Switch
                  id="team-news"
                  checked={settings.notifications.teamNews}
                  onCheckedChange={(checked) => handleSettingChange('notifications', 'teamNews', checked)}
                />
              </div>
            </CardContent>
          </Card>

          {/* 개인정보 설정 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="h-5 w-5" />
                <span>개인정보</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="show-email">이메일 공개</Label>
                <Switch
                  id="show-email"
                  checked={settings.privacy.showEmail}
                  onCheckedChange={(checked) => handleSettingChange('privacy', 'showEmail', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="show-activity">활동 내역 공개</Label>
                <Switch
                  id="show-activity"
                  checked={settings.privacy.showActivity}
                  onCheckedChange={(checked) => handleSettingChange('privacy', 'showActivity', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="allow-messages">메시지 수신 허용</Label>
                <Switch
                  id="allow-messages"
                  checked={settings.privacy.allowMessages}
                  onCheckedChange={(checked) => handleSettingChange('privacy', 'allowMessages', checked)}
                />
              </div>
            </CardContent>
          </Card>

          {/* 모양 설정 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Sun className="h-5 w-5" />
                <span>모양</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="dark-mode">다크 모드</Label>
                <Switch
                  id="dark-mode"
                  checked={settings.appearance.darkMode}
                  onCheckedChange={(checked) => handleSettingChange('appearance', 'darkMode', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">언어</p>
                  <p className="text-sm text-gray-500">한국어</p>
                </div>
                <Button variant="ghost" size="sm">
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* 계정 관리 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Lock className="h-5 w-5" />
                <span>계정 관리</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">비밀번호 변경</p>
                  <p className="text-sm text-gray-500">계정 보안 강화</p>
                </div>
                <Button variant="ghost" size="sm">
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">로그아웃</p>
                  <p className="text-sm text-gray-500">모든 기기에서 로그아웃</p>
                </div>
                <Button variant="ghost" size="sm" onClick={handleSignOut}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="pt-4 border-t">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-red-600">계정 삭제</p>
                    <p className="text-sm text-gray-500">모든 데이터가 삭제됩니다</p>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={handleDeleteAccount}
                  >
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 앱 정보 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Smartphone className="h-5 w-5" />
                <span>앱 정보</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="font-medium">버전</p>
                <p className="text-sm text-gray-500">1.0.0</p>
              </div>
              
              <div className="flex items-center justify-between">
                <p className="font-medium">개발자</p>
                <p className="text-sm text-gray-500">FutInfo Team</p>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">이용약관</p>
                  <p className="text-sm text-gray-500">서비스 이용 규칙</p>
                </div>
                <Button variant="ghost" size="sm">
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">개인정보 처리방침</p>
                  <p className="text-sm text-gray-500">개인정보 보호 정책</p>
                </div>
                <Button variant="ghost" size="sm">
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}