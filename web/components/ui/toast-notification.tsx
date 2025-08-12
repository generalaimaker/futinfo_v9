'use client'

import { useEffect, useState } from 'react'
import { animated, useSpring } from '@react-spring/web'
import { X, Trophy, AlertCircle, ArrowRightLeft, Activity } from 'lucide-react'
import Image from 'next/image'
import { cn } from '@/lib/utils'

export interface ToastEvent {
  id: string
  type: 'goal' | 'card' | 'substitution' | 'var' | 'penalty'
  team: {
    name: string
    logo: string
  }
  player?: string
  assist?: string
  minute: number
  detail?: string
  timestamp: number
}

interface ToastNotificationProps {
  event: ToastEvent
  onClose: () => void
  duration?: number
}

export function ToastNotification({ event, onClose, duration = 5000 }: ToastNotificationProps) {
  const [isVisible, setIsVisible] = useState(true)

  // 애니메이션 설정
  const slideIn = useSpring({
    from: { transform: 'translateY(-100%)', opacity: 0 },
    to: { transform: 'translateY(0%)', opacity: 1 },
    config: { tension: 250, friction: 25 }
  })

  // 자동 닫기
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false)
      setTimeout(onClose, 300)
    }, duration)

    return () => clearTimeout(timer)
  }, [duration, onClose])

  // 아이콘 및 색상 설정
  const getEventStyle = () => {
    switch (event.type) {
      case 'goal':
        return {
          icon: Trophy,
          bgColor: 'from-green-500 to-green-600',
          borderColor: 'border-green-500',
          textColor: 'text-white',
          emoji: '⚽'
        }
      case 'card':
        return {
          icon: AlertCircle,
          bgColor: event.detail === 'Red Card' ? 'from-red-500 to-red-600' : 'from-yellow-500 to-yellow-600',
          borderColor: event.detail === 'Red Card' ? 'border-red-500' : 'border-yellow-500',
          textColor: 'text-white',
          emoji: event.detail === 'Red Card' ? '🟥' : '🟨'
        }
      case 'substitution':
        return {
          icon: ArrowRightLeft,
          bgColor: 'from-blue-500 to-blue-600',
          borderColor: 'border-blue-500',
          textColor: 'text-white',
          emoji: '🔄'
        }
      case 'var':
        return {
          icon: Activity,
          bgColor: 'from-purple-500 to-purple-600',
          borderColor: 'border-purple-500',
          textColor: 'text-white',
          emoji: '📺'
        }
      case 'penalty':
        return {
          icon: Trophy,
          bgColor: 'from-orange-500 to-orange-600',
          borderColor: 'border-orange-500',
          textColor: 'text-white',
          emoji: '🎯'
        }
      default:
        return {
          icon: Activity,
          bgColor: 'from-gray-500 to-gray-600',
          borderColor: 'border-gray-500',
          textColor: 'text-white',
          emoji: '📢'
        }
    }
  }

  const style = getEventStyle()
  const Icon = style.icon

  return (
    <animated.div
      style={slideIn}
      className={cn(
        "fixed top-4 right-4 z-50 max-w-md transition-all",
        !isVisible && "opacity-0 transform -translate-y-full"
      )}
    >
      <div className={cn(
        "relative rounded-xl border-2 shadow-2xl overflow-hidden",
        style.borderColor
      )}>
        {/* 배경 그라데이션 */}
        <div className={cn(
          "absolute inset-0 bg-gradient-to-r opacity-95",
          style.bgColor
        )} />
        
        {/* 콘텐츠 */}
        <div className="relative p-4 pr-10">
          <div className="flex items-start gap-3">
            {/* 팀 로고 */}
            <div className="shrink-0 bg-white rounded-lg p-2">
              <Image
                src={event.team.logo}
                alt={event.team.name}
                width={32}
                height={32}
                className="object-contain"
              />
            </div>
            
            {/* 이벤트 정보 */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-2xl">{style.emoji}</span>
                <span className={cn("font-bold text-sm", style.textColor)}>
                  {event.minute}'
                </span>
              </div>
              
              <p className={cn("font-semibold", style.textColor)}>
                {event.type === 'goal' && `골! ${event.player}`}
                {event.type === 'card' && `${event.detail} - ${event.player}`}
                {event.type === 'substitution' && `교체: ${event.player} → ${event.assist}`}
                {event.type === 'var' && `VAR 판정: ${event.detail}`}
                {event.type === 'penalty' && `페널티 킥! ${event.player}`}
              </p>
              
              {event.assist && event.type === 'goal' && (
                <p className={cn("text-sm opacity-90", style.textColor)}>
                  어시스트: {event.assist}
                </p>
              )}
              
              <p className={cn("text-xs mt-1 opacity-80", style.textColor)}>
                {event.team.name}
              </p>
            </div>
          </div>
        </div>
        
        {/* 닫기 버튼 */}
        <button
          onClick={() => {
            setIsVisible(false)
            setTimeout(onClose, 300)
          }}
          className="absolute top-2 right-2 p-1 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
        >
          <X className="w-4 h-4 text-white" />
        </button>
        
        {/* 진행 바 */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/20">
          <animated.div
            className="h-full bg-white/50"
            style={useSpring({
              from: { width: '100%' },
              to: { width: '0%' },
              config: { duration }
            })}
          />
        </div>
      </div>
    </animated.div>
  )
}

// Toast Manager Hook
export function useToastNotification() {
  const [events, setEvents] = useState<ToastEvent[]>([])

  const showToast = (event: Omit<ToastEvent, 'id' | 'timestamp'>) => {
    const newEvent: ToastEvent = {
      ...event,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: Date.now()
    }
    
    setEvents(prev => [...prev, newEvent])
    
    // 사운드 재생 (옵션)
    if (typeof window !== 'undefined' && event.type === 'goal') {
      // 골 사운드 재생
      const audio = new Audio('/sounds/goal.mp3')
      audio.play().catch(() => {})
    }
  }

  const removeToast = (id: string) => {
    setEvents(prev => prev.filter(e => e.id !== id))
  }

  return {
    events,
    showToast,
    removeToast
  }
}