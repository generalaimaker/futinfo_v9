'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { 
  Bell, BellOff, Timer, Goal, Flag, 
  Newspaper, MessageCircle, CheckCircle2,
  Smartphone, Mail, Globe
} from 'lucide-react'
import { useUserPreferences } from '@/lib/hooks/useUserPreferences'
import { cn } from '@/lib/utils'

interface NotificationOption {
  id: keyof UserPreferences['notificationSettings']
  title: string
  description: string
  icon: React.ReactNode
}

const notificationOptions: NotificationOption[] = [
  {
    id: 'matchStart',
    title: '경기 시작 알림',
    description: '팔로우한 팀의 경기가 시작할 때 알림을 받습니다',
    icon: <Timer className="w-5 h-5" />
  },
  {
    id: 'goals',
    title: '골 알림',
    description: '팔로우한 팀이 득점하거나 실점할 때 알림을 받습니다',
    icon: <Goal className="w-5 h-5" />
  },
  {
    id: 'matchEnd',
    title: '경기 종료 알림',
    description: '팔로우한 팀의 경기가 종료되면 최종 결과를 받습니다',
    icon: <Flag className="w-5 h-5" />
  },
  {
    id: 'news',
    title: '뉴스 알림',
    description: '팔로우한 팀과 리그의 주요 뉴스를 받습니다',
    icon: <Newspaper className="w-5 h-5" />
  },
  {
    id: 'communityReplies',
    title: '커뮤니티 답글 알림',
    description: '내 게시글에 댓글이 달리면 알림을 받습니다',
    icon: <MessageCircle className="w-5 h-5" />
  }
]

export default function NotificationsPage() {
  const { preferences, updatePreferences, isAuthenticated } = useUserPreferences()
  const [isSaving, setIsSaving] = useState(false)
  const [showSaveSuccess, setShowSaveSuccess] = useState(false)

  const handleToggle = (id: keyof typeof preferences.notificationSettings) => {
    updatePreferences({
      notificationSettings: {
        ...preferences.notificationSettings,
        [id]: !preferences.notificationSettings[id]
      }
    })
  }

  const handleSave = async () => {
    setIsSaving(true)
    // 실제로는 이미 updatePreferences에서 자동 저장됨
    setTimeout(() => {
      setIsSaving(false)
      setShowSaveSuccess(true)
      setTimeout(() => setShowSaveSuccess(false), 3000)
    }, 500)
  }

  const allEnabled = Object.values(preferences.notificationSettings).every(v => v)
  const allDisabled = Object.values(preferences.notificationSettings).every(v => !v)

  const toggleAll = () => {
    const newState = !allEnabled
    updatePreferences({
      notificationSettings: {
        matchStart: newState,
        goals: newState,
        matchEnd: newState,
        news: newState,
        communityReplies: newState
      }
    })
  }

  return (
    <div className="min-h-screen lg:ml-64 p-4 lg:p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold mb-2">알림 설정</h1>
          <p className="text-muted-foreground">
            원하는 알림을 선택하여 중요한 순간을 놓치지 마세요
          </p>
        </div>

        {/* Auth Warning */}
        {!isAuthenticated && (
          <Card className="dark-card p-4 border-yellow-500/50 bg-yellow-500/10">
            <p className="text-sm text-yellow-600 dark:text-yellow-400">
              로그인하지 않은 상태입니다. 설정은 이 기기에만 저장됩니다.
            </p>
          </Card>
        )}

        {/* Master Toggle */}
        <Card className="dark-card p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {allDisabled ? (
                <BellOff className="w-6 h-6 text-muted-foreground" />
              ) : (
                <Bell className="w-6 h-6 text-primary" />
              )}
              <div>
                <h3 className="font-semibold">모든 알림</h3>
                <p className="text-sm text-muted-foreground">
                  모든 알림을 한 번에 켜거나 끌 수 있습니다
                </p>
              </div>
            </div>
            <Switch
              checked={allEnabled}
              onCheckedChange={toggleAll}
              className="data-[state=checked]:bg-primary"
            />
          </div>
        </Card>

        {/* Notification Options */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">알림 유형</h2>
          <div className="space-y-3">
            {notificationOptions.map((option) => (
              <Card key={option.id} className="dark-card p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center",
                      preferences.notificationSettings[option.id] 
                        ? "bg-primary/20 text-primary" 
                        : "bg-secondary text-muted-foreground"
                    )}>
                      {option.icon}
                    </div>
                    <div className="flex-1">
                      <Label 
                        htmlFor={option.id}
                        className="text-base font-medium cursor-pointer"
                      >
                        {option.title}
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        {option.description}
                      </p>
                    </div>
                  </div>
                  <Switch
                    id={option.id}
                    checked={preferences.notificationSettings[option.id]}
                    onCheckedChange={() => handleToggle(option.id)}
                    className="data-[state=checked]:bg-primary"
                  />
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Delivery Methods */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">알림 수신 방법</h2>
          <div className="grid sm:grid-cols-3 gap-3">
            <Card className="dark-card p-4 border-primary/50 bg-primary/5">
              <div className="flex flex-col items-center text-center gap-2">
                <Smartphone className="w-8 h-8 text-primary" />
                <p className="font-medium">푸시 알림</p>
                <p className="text-xs text-muted-foreground">앱에서 활성화</p>
              </div>
            </Card>
            <Card className="dark-card p-4 opacity-50">
              <div className="flex flex-col items-center text-center gap-2">
                <Mail className="w-8 h-8 text-muted-foreground" />
                <p className="font-medium">이메일</p>
                <p className="text-xs text-muted-foreground">준비 중</p>
              </div>
            </Card>
            <Card className="dark-card p-4 opacity-50">
              <div className="flex flex-col items-center text-center gap-2">
                <Globe className="w-8 h-8 text-muted-foreground" />
                <p className="font-medium">브라우저</p>
                <p className="text-xs text-muted-foreground">준비 중</p>
              </div>
            </Card>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end pt-4">
          <Button 
            className="dark-button-primary"
            onClick={handleSave}
            disabled={isSaving}
          >
            {showSaveSuccess ? (
              <>
                <CheckCircle2 className="w-4 h-4 mr-2" />
                저장 완료
              </>
            ) : (
              '설정 저장'
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}

interface UserPreferences {
  notificationSettings: {
    matchStart: boolean
    goals: boolean
    matchEnd: boolean
    news: boolean
    communityReplies: boolean
  }
}