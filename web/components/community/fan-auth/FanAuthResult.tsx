'use client'

import { motion } from 'framer-motion'
import { Trophy, Award, Star, Zap, Shield, Crown, ChevronRight, Share2, RefreshCw } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import confetti from 'canvas-confetti'
import { useEffect } from 'react'

interface FanAuthResultProps {
  score: number
  totalPossible: number
  passed: boolean
  teamName: string
  teamLogo: string
  correctAnswers: number
  totalQuestions: number
  timeBonus: number
  streakBonus: number
  onRetry: () => void
  onContinue: () => void
}

interface Badge {
  id: string
  name: string
  description: string
  icon: React.ReactNode
  color: string
  earned: boolean
}

export function FanAuthResult({
  score,
  totalPossible,
  passed,
  teamName,
  teamLogo,
  correctAnswers,
  totalQuestions,
  timeBonus,
  streakBonus,
  onRetry,
  onContinue
}: FanAuthResultProps) {
  const percentage = Math.round((score / totalPossible) * 100)
  const accuracy = Math.round((correctAnswers / totalQuestions) * 100)

  // 레벨 판정
  const getLevel = () => {
    if (percentage >= 90) return { name: 'VIP 팬', color: 'from-purple-600 to-pink-600', icon: <Crown className="w-6 h-6" /> }
    if (percentage >= 70) return { name: '인증된 팬', color: 'from-blue-600 to-cyan-600', icon: <Shield className="w-6 h-6" /> }
    if (percentage >= 50) return { name: '일반 팬', color: 'from-green-600 to-emerald-600', icon: <Star className="w-6 h-6" /> }
    return { name: '입문 팬', color: 'from-gray-600 to-gray-700', icon: <Zap className="w-6 h-6" /> }
  }

  const level = getLevel()

  // 획득한 배지들
  const badges: Badge[] = [
    {
      id: 'perfect',
      name: '퍼펙트',
      description: '모든 문제 정답',
      icon: <Trophy className="w-8 h-8" />,
      color: 'from-yellow-400 to-orange-500',
      earned: correctAnswers === totalQuestions
    },
    {
      id: 'speedster',
      name: '스피드스터',
      description: '빠른 답변',
      icon: <Zap className="w-8 h-8" />,
      color: 'from-blue-400 to-cyan-500',
      earned: timeBonus > 30
    },
    {
      id: 'streak',
      name: '연속 정답',
      description: '3문제 이상 연속 정답',
      icon: <Star className="w-8 h-8" />,
      color: 'from-purple-400 to-pink-500',
      earned: streakBonus > 10
    },
    {
      id: 'expert',
      name: `${teamName} 전문가`,
      description: '70% 이상 득점',
      icon: <Award className="w-8 h-8" />,
      color: 'from-green-400 to-emerald-500',
      earned: percentage >= 70
    }
  ]

  const earnedBadges = badges.filter(b => b.earned)

  useEffect(() => {
    if (passed) {
      // 축하 애니메이션
      const duration = 3 * 1000
      const animationEnd = Date.now() + duration
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 }

      const randomInRange = (min: number, max: number) => {
        return Math.random() * (max - min) + min
      }

      const interval: any = setInterval(() => {
        const timeLeft = animationEnd - Date.now()

        if (timeLeft <= 0) {
          return clearInterval(interval)
        }

        const particleCount = 50 * (timeLeft / duration)
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
        })
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
        })
      }, 250)
    }
  }, [passed])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          {/* Result Card */}
          <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl border-gray-200/50 dark:border-gray-700/50 shadow-2xl overflow-hidden">
            {/* Header */}
            <div className={cn(
              "relative p-8 text-white bg-gradient-to-r",
              passed ? level.color : "from-red-600 to-orange-600"
            )}>
              <div className="absolute inset-0 bg-black/10" />
              <div className="relative">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
                  className="flex justify-center mb-6"
                >
                  <div className="relative">
                    <img src={teamLogo} alt={teamName} className="w-24 h-24" />
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.5 }}
                      className="absolute -bottom-2 -right-2 bg-white rounded-full p-2"
                    >
                      {passed ? (
                        <CheckCircle className="w-8 h-8 text-green-500" />
                      ) : (
                        <XCircle className="w-8 h-8 text-red-500" />
                      )}
                    </motion.div>
                  </div>
                </motion.div>

                <h1 className="text-3xl font-bold text-center mb-2">
                  {passed ? '축하합니다! 🎉' : '아쉬워요! 😢'}
                </h1>
                <p className="text-xl text-center text-white/90">
                  {passed ? `${teamName} ${level.name} 인증 완료!` : '다시 도전해보세요!'}
                </p>
              </div>
            </div>

            {/* Score Details */}
            <div className="p-8">
              {/* Main Score */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-center mb-8"
              >
                <div className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900 rounded-2xl">
                  <Trophy className="w-8 h-8 text-yellow-500" />
                  <div className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    {score} / {totalPossible}
                  </div>
                  <span className="text-2xl font-semibold text-gray-600 dark:text-gray-400">
                    ({percentage}%)
                  </span>
                </div>
              </motion.div>

              {/* Stats Grid */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
              >
                <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {correctAnswers}/{totalQuestions}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">정답</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {accuracy}%
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">정확도</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    +{timeBonus}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">시간 보너스</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    +{streakBonus}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">연속 보너스</p>
                </div>
              </motion.div>

              {/* Level Progress */}
              {passed && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="mb-8"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {level.icon}
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {level.name} 레벨
                      </span>
                    </div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      다음 레벨까지 {100 - percentage}% 남음
                    </span>
                  </div>
                  <Progress value={percentage} className="h-3" />
                </motion.div>
              )}

              {/* Earned Badges */}
              {earnedBadges.length > 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.7 }}
                  className="mb-8"
                >
                  <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                    획득한 배지
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {earnedBadges.map((badge, index) => (
                      <motion.div
                        key={badge.id}
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ delay: 0.8 + index * 0.1 }}
                        className="relative"
                      >
                        <div className={cn(
                          "bg-gradient-to-br p-4 rounded-2xl text-white text-center",
                          badge.color
                        )}>
                          <div className="flex justify-center mb-2">
                            {badge.icon}
                          </div>
                          <p className="font-semibold text-sm">{badge.name}</p>
                          <p className="text-xs opacity-90">{badge.description}</p>
                        </div>
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: 1 + index * 0.1 }}
                          className="absolute -top-2 -right-2"
                        >
                          <div className="bg-yellow-400 rounded-full p-1">
                            <Star className="w-4 h-4 text-yellow-900" />
                          </div>
                        </motion.div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Action Buttons */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.9 }}
                className="flex gap-4"
              >
                {!passed && (
                  <Button
                    onClick={onRetry}
                    variant="outline"
                    className="flex-1 py-6 text-lg font-semibold rounded-2xl"
                  >
                    <RefreshCw className="w-5 h-5 mr-2" />
                    다시 도전
                  </Button>
                )}
                <Button
                  onClick={onContinue}
                  className={cn(
                    "flex-1 py-6 text-lg font-semibold rounded-2xl",
                    passed 
                      ? "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                      : "bg-gray-600 hover:bg-gray-700 text-white"
                  )}
                >
                  {passed ? (
                    <>
                      팬 게시판 입장
                      <ChevronRight className="w-5 h-5 ml-2" />
                    </>
                  ) : (
                    '메인으로'
                  )}
                </Button>
              </motion.div>

              {/* Share Button */}
              {passed && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1 }}
                  className="mt-4 text-center"
                >
                  <Button variant="ghost" size="sm">
                    <Share2 className="w-4 h-4 mr-2" />
                    결과 공유하기
                  </Button>
                </motion.div>
              )}
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}

// Add missing imports
import { CheckCircle, XCircle } from 'lucide-react'