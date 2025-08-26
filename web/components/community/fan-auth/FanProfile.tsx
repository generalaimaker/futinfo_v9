'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Trophy, Star, Zap, Shield, Crown, Award, 
  TrendingUp, Activity, Target, Flame, Heart,
  MessageSquare, Users, Calendar, Clock,
  ChevronRight, MoreHorizontal, Settings
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import { FanLevel } from '@/lib/types/community'

interface FanProfileProps {
  userId: string
  userName: string
  userAvatar?: string
  teamId: number
  teamName: string
  teamLogo: string
  fanLevel: FanLevel
  points: {
    team: number
    global: number
  }
  stats: {
    posts: number
    comments: number
    likes: number
    matchdays: number
    quizScore: number
    joinedDays: number
  }
  badges: FanBadge[]
  achievements: Achievement[]
  onEditProfile?: () => void
}

interface FanBadge {
  id: string
  name: string
  description: string
  icon: React.ReactNode
  earnedAt: Date
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
}

interface Achievement {
  id: string
  title: string
  description: string
  progress: number
  total: number
  completed: boolean
  reward: number
}

const getLevelInfo = (level: FanLevel) => {
  switch (level) {
    case FanLevel.VIP:
      return {
        name: 'VIP 팬',
        color: 'from-purple-600 to-pink-600',
        bgColor: 'bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900 dark:to-pink-900',
        icon: <Crown className="w-6 h-6" />,
        nextLevel: null,
        benefits: ['전용 배지', 'VIP 라운지 접근', '이벤트 우선권', '특별 이모지']
      }
    case FanLevel.VERIFIED:
      return {
        name: '인증된 팬',
        color: 'from-blue-600 to-cyan-600',
        bgColor: 'bg-gradient-to-r from-blue-100 to-cyan-100 dark:from-blue-900 dark:to-cyan-900',
        icon: <Shield className="w-6 h-6" />,
        nextLevel: 'VIP',
        benefits: ['인증 배지', '팀 전용 기능', '투표 참여', '프리미엄 스티커']
      }
    case FanLevel.BASIC:
      return {
        name: '일반 팬',
        color: 'from-green-600 to-emerald-600',
        bgColor: 'bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900 dark:to-emerald-900',
        icon: <Star className="w-6 h-6" />,
        nextLevel: '인증',
        benefits: ['기본 배지', '게시판 참여', '댓글 작성']
      }
    default:
      return {
        name: '입문 팬',
        color: 'from-gray-600 to-gray-700',
        bgColor: 'bg-gray-100 dark:bg-gray-800',
        icon: <Zap className="w-6 h-6" />,
        nextLevel: '일반',
        benefits: ['게시글 읽기', '좋아요']
      }
  }
}

const getRarityColor = (rarity: string) => {
  switch (rarity) {
    case 'legendary': return 'from-yellow-400 to-orange-500'
    case 'epic': return 'from-purple-400 to-pink-500'
    case 'rare': return 'from-blue-400 to-cyan-500'
    default: return 'from-gray-400 to-gray-500'
  }
}

export function FanProfile({
  userId,
  userName,
  userAvatar,
  teamId,
  teamName,
  teamLogo,
  fanLevel,
  points,
  stats,
  badges,
  achievements,
  onEditProfile
}: FanProfileProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'badges' | 'achievements'>('overview')
  const levelInfo = getLevelInfo(fanLevel)
  const nextLevelProgress = Math.min((points.team / 1000) * 100, 100)

  // 활동 점수 계산
  const activityScore = Math.round(
    (stats.posts * 10 + stats.comments * 5 + stats.likes * 2 + stats.matchdays * 20) / 10
  )

  return (
    <div className="space-y-6">
      {/* Profile Header Card */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="overflow-hidden bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl border-gray-200/50 dark:border-gray-700/50">
          {/* Cover Image */}
          <div className={cn(
            "h-32 bg-gradient-to-r",
            levelInfo.color
          )}>
            <div className="h-full w-full bg-black/20" />
          </div>

          <CardContent className="relative pb-6">
            {/* Avatar */}
            <div className="absolute -top-12 left-6">
              <div className="relative">
                <div className="w-24 h-24 rounded-2xl bg-white dark:bg-gray-800 p-1">
                  {userAvatar ? (
                    <img src={userAvatar} alt={userName} className="w-full h-full rounded-xl object-cover" />
                  ) : (
                    <div className="w-full h-full rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-3xl font-bold">
                      {userName.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                {/* Level Badge */}
                <div className={cn(
                  "absolute -bottom-2 -right-2 p-2 rounded-full text-white bg-gradient-to-r",
                  levelInfo.color
                )}>
                  {levelInfo.icon}
                </div>
              </div>
            </div>

            {/* Edit Button */}
            {onEditProfile && (
              <Button
                variant="outline"
                size="sm"
                onClick={onEditProfile}
                className="absolute top-4 right-4"
              >
                <Settings className="w-4 h-4 mr-1" />
                편집
              </Button>
            )}

            {/* User Info */}
            <div className="mt-16 ml-32">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {userName}
                  </h2>
                  <div className="flex items-center gap-3 mt-2">
                    <Badge className={cn("px-3 py-1", levelInfo.bgColor)}>
                      {levelInfo.icon}
                      <span className="ml-1 font-semibold">{levelInfo.name}</span>
                    </Badge>
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <img src={teamLogo} alt={teamName} className="w-5 h-5" />
                      <span>{teamName} 팬</span>
                    </div>
                  </div>
                </div>

                {/* Points Display */}
                <div className="text-right">
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">팀 포인트</p>
                      <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        {points.team.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">글로벌</p>
                      <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                        {points.global.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Level Progress */}
              {levelInfo.nextLevel && (
                <div className="mt-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      다음 레벨: {levelInfo.nextLevel} 팬
                    </span>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                      {nextLevelProgress.toFixed(0)}%
                    </span>
                  </div>
                  <Progress value={nextLevelProgress} className="h-2" />
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Tabs Section */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">
            <Activity className="w-4 h-4 mr-2" />
            개요
          </TabsTrigger>
          <TabsTrigger value="badges">
            <Award className="w-4 h-4 mr-2" />
            배지 ({badges.length})
          </TabsTrigger>
          <TabsTrigger value="achievements">
            <Trophy className="w-4 h-4 mr-2" />
            업적
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <StatsCard
              icon={<MessageSquare className="w-5 h-5" />}
              label="게시글"
              value={stats.posts}
              color="text-blue-600"
            />
            <StatsCard
              icon={<Users className="w-5 h-5" />}
              label="댓글"
              value={stats.comments}
              color="text-green-600"
            />
            <StatsCard
              icon={<Heart className="w-5 h-5" />}
              label="받은 좋아요"
              value={stats.likes}
              color="text-red-600"
            />
            <StatsCard
              icon={<Trophy className="w-5 h-5" />}
              label="매치데이"
              value={stats.matchdays}
              color="text-purple-600"
            />
            <StatsCard
              icon={<Target className="w-5 h-5" />}
              label="퀴즈 점수"
              value={`${stats.quizScore}%`}
              color="text-orange-600"
            />
            <StatsCard
              icon={<Calendar className="w-5 h-5" />}
              label="가입일"
              value={`${stats.joinedDays}일`}
              color="text-gray-600"
            />
          </div>

          {/* Activity Score */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Flame className="w-5 h-5 text-orange-500" />
                  활동 점수
                </span>
                <span className="text-2xl font-bold text-orange-600">
                  {activityScore}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <ActivityBar label="게시 활동" value={stats.posts * 10} max={500} />
                <ActivityBar label="소통 활동" value={stats.comments * 5} max={500} />
                <ActivityBar label="응원 활동" value={stats.matchdays * 20} max={500} />
              </div>
            </CardContent>
          </Card>

          {/* Benefits */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-500" />
                레벨 혜택
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {levelInfo.benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">{benefit}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Badges Tab */}
        <TabsContent value="badges">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {badges.map((badge) => (
              <motion.div
                key={badge.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Card className="relative overflow-hidden">
                  <div className={cn(
                    "absolute inset-0 opacity-10 bg-gradient-to-br",
                    getRarityColor(badge.rarity)
                  )} />
                  <CardContent className="relative p-4">
                    <div className="flex justify-center mb-3">
                      <div className={cn(
                        "p-3 rounded-full bg-gradient-to-br text-white",
                        getRarityColor(badge.rarity)
                      )}>
                        {badge.icon}
                      </div>
                    </div>
                    <h3 className="font-semibold text-center text-gray-900 dark:text-white">
                      {badge.name}
                    </h3>
                    <p className="text-xs text-center text-gray-600 dark:text-gray-400 mt-1">
                      {badge.description}
                    </p>
                    <p className="text-xs text-center text-gray-500 dark:text-gray-500 mt-2">
                      {new Date(badge.earnedAt).toLocaleDateString('ko-KR')}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        {/* Achievements Tab */}
        <TabsContent value="achievements" className="space-y-4">
          {achievements.map((achievement) => (
            <Card key={achievement.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {achievement.title}
                      </h3>
                      {achievement.completed && (
                        <Badge className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                          완료
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      {achievement.description}
                    </p>
                    <div className="flex items-center gap-4">
                      <Progress 
                        value={(achievement.progress / achievement.total) * 100} 
                        className="flex-1 h-2"
                      />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {achievement.progress}/{achievement.total}
                      </span>
                    </div>
                  </div>
                  <div className="ml-4 text-right">
                    <p className="text-sm text-gray-600 dark:text-gray-400">보상</p>
                    <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                      +{achievement.reward}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Helper Components
function StatsCard({ icon, label, value, color }: any) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className={cn("flex items-center gap-2 mb-2", color)}>
          {icon}
        </div>
        <p className="text-2xl font-bold text-gray-900 dark:text-white">
          {typeof value === 'number' ? value.toLocaleString() : value}
        </p>
        <p className="text-xs text-gray-600 dark:text-gray-400">{label}</p>
      </CardContent>
    </Card>
  )
}

function ActivityBar({ label, value, max }: any) {
  const percentage = Math.min((value / max) * 100, 100)
  
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-600 dark:text-gray-400">{label}</span>
        <span className="font-semibold text-gray-900 dark:text-white">{value}</span>
      </div>
      <Progress value={percentage} className="h-2" />
    </div>
  )
}

// Add missing import
import { CheckCircle } from 'lucide-react'