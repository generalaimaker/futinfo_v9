'use client'

import { useState } from 'react'
import { X, Shield, Trophy, Star, Check, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { FanLevel } from '@/lib/types/community'

interface FanAuthModalProps {
  isOpen: boolean
  onClose: () => void
  teamId: number
  teamName: string
  currentLevel: FanLevel
  onLevelUp: (newLevel: FanLevel) => void
}

export default function FanAuthModal({
  isOpen,
  onClose,
  teamId,
  teamName,
  currentLevel,
  onLevelUp
}: FanAuthModalProps) {
  const [selectedLevel, setSelectedLevel] = useState<FanLevel>(FanLevel.BASIC)
  const [isAuthenticating, setIsAuthenticating] = useState(false)

  if (!isOpen) return null

  const handleAuthenticate = async () => {
    setIsAuthenticating(true)
    
    // 실제로는 서버에서 인증 처리
    setTimeout(() => {
      onLevelUp(selectedLevel)
      setIsAuthenticating(false)
      onClose()
    }, 1500)
  }

  const levels = [
    {
      level: FanLevel.BASIC,
      title: '간단 인증',
      icon: <Shield className="h-6 w-6" />,
      color: 'text-gray-600',
      bgColor: 'bg-gray-100',
      description: '팀 선택만으로 시작',
      benefits: [
        '게시글 읽기',
        '좋아요 누르기',
        '제한적 댓글 작성'
      ]
    },
    {
      level: FanLevel.VERIFIED,
      title: '정식 팬 인증',
      icon: <Star className="h-6 w-6" />,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      description: '퀴즈와 활동으로 인증',
      benefits: [
        '모든 기본 기능',
        '게시글 작성',
        '팬 전용 기능 접근',
        '팬 뱃지 획득'
      ]
    },
    {
      level: FanLevel.VIP,
      title: 'VIP 팬',
      icon: <Trophy className="h-6 w-6" />,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
      description: '시즌티켓 홀더 & 장기 팬',
      benefits: [
        '모든 인증 팬 기능',
        'VIP 라운지 접근',
        '특별 뱃지',
        '우선 순위 표시',
        '독점 콘텐츠'
      ]
    }
  ]

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* 헤더 */}
        <div className="sticky top-0 bg-white dark:bg-gray-900 border-b p-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">
              {teamName} 팬 인증
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              인증 레벨을 선택하고 팬 커뮤니티에 참여하세요
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* 인증 레벨 선택 */}
        <div className="p-6 space-y-4">
          {levels.map((levelInfo) => {
            const isSelected = selectedLevel === levelInfo.level
            const isUnlocked = levelInfo.level <= FanLevel.VERIFIED // VIP는 특별 조건 필요
            const isCurrent = currentLevel === levelInfo.level

            return (
              <Card
                key={levelInfo.level}
                className={cn(
                  "p-6 cursor-pointer transition-all",
                  isSelected && "ring-2 ring-blue-500",
                  !isUnlocked && "opacity-50 cursor-not-allowed",
                  isCurrent && "bg-green-50 dark:bg-green-900/20"
                )}
                onClick={() => isUnlocked && setSelectedLevel(levelInfo.level)}
              >
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-lg ${levelInfo.bgColor}`}>
                    <div className={levelInfo.color}>
                      {levelInfo.icon}
                    </div>
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-lg">{levelInfo.title}</h3>
                      {isCurrent && (
                        <span className="text-xs bg-green-500 text-white px-2 py-1 rounded-full">
                          현재 레벨
                        </span>
                      )}
                      {!isUnlocked && (
                        <span className="text-xs bg-gray-500 text-white px-2 py-1 rounded-full">
                          조건 필요
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      {levelInfo.description}
                    </p>
                    
                    <div className="space-y-1">
                      {levelInfo.benefits.map((benefit, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-sm">
                          <Check className="h-4 w-4 text-green-500" />
                          <span>{benefit}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {isSelected && (
                    <ChevronRight className="h-5 w-5 text-blue-500" />
                  )}
                </div>
              </Card>
            )
          })}
        </div>

        {/* 액션 버튼 */}
        <div className="sticky bottom-0 bg-white dark:bg-gray-900 border-t p-6">
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              취소
            </Button>
            <Button
              onClick={handleAuthenticate}
              disabled={selectedLevel <= currentLevel || isAuthenticating}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              {isAuthenticating ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  인증 중...
                </span>
              ) : (
                `Level ${selectedLevel} 인증하기`
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ')
}