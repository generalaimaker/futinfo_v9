'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Trophy, Star, Crown, Medal, Award, Sparkles,
  TrendingUp, Users, Clock, CheckCircle, AlertCircle,
  Heart, ThumbsUp, ChevronRight, Zap, Shield
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import confetti from 'canvas-confetti'

interface Player {
  id: string
  name: string
  number: number
  position: 'GK' | 'DEF' | 'MID' | 'FWD'
  photo?: string
  rating?: number
  stats?: {
    goals?: number
    assists?: number
    saves?: number
    tackles?: number
    passes?: number
    keyPasses?: number
  }
}

interface VoteResult {
  playerId: string
  votes: number
  percentage: number
  rank: number
}

interface MVPVotingProps {
  matchId: number
  homeTeam: {
    id: number
    name: string
    logo: string
    players: Player[]
  }
  awayTeam: {
    id: number
    name: string
    logo: string
    players: Player[]
  }
  currentUserId: string
  userVote?: string
  votingOpen: boolean
  votingEndTime?: Date
  results?: VoteResult[]
  totalVotes: number
  onVote: (playerId: string) => void
}

const positionOrder = { 'FWD': 0, 'MID': 1, 'DEF': 2, 'GK': 3 }
const positionColors = {
  'GK': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
  'DEF': 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  'MID': 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  'FWD': 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
}

export function MVPVoting({
  matchId,
  homeTeam,
  awayTeam,
  currentUserId,
  userVote,
  votingOpen,
  votingEndTime,
  results,
  totalVotes,
  onVote
}: MVPVotingProps) {
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(userVote || null)
  const [showResults, setShowResults] = useState(!votingOpen)
  const [timeLeft, setTimeLeft] = useState<string>('')
  const [hasVoted, setHasVoted] = useState(!!userVote)

  // Countdown timer
  useEffect(() => {
    if (!votingEndTime) return

    const timer = setInterval(() => {
      const now = new Date()
      const end = new Date(votingEndTime)
      const diff = end.getTime() - now.getTime()

      if (diff <= 0) {
        setTimeLeft('투표 종료')
        setShowResults(true)
        clearInterval(timer)
      } else {
        const hours = Math.floor(diff / (1000 * 60 * 60))
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
        const seconds = Math.floor((diff % (1000 * 60)) / 1000)
        setTimeLeft(`${hours}시간 ${minutes}분 ${seconds}초`)
      }
    }, 1000)

    return () => clearInterval(timer)
  }, [votingEndTime])

  const handleVote = () => {
    if (!selectedPlayer || hasVoted) return

    onVote(selectedPlayer)
    setHasVoted(true)
    
    // Celebration animation
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    })
  }

  const allPlayers = [
    ...homeTeam.players.map(p => ({ ...p, team: homeTeam })),
    ...awayTeam.players.map(p => ({ ...p, team: awayTeam }))
  ].sort((a, b) => {
    const posA = positionOrder[a.position]
    const posB = positionOrder[b.position]
    if (posA !== posB) return posA - posB
    return (b.rating || 0) - (a.rating || 0)
  })

  const getPlayerVoteResult = (playerId: string) => {
    return results?.find(r => r.playerId === playerId)
  }

  const topPlayers = results?.slice(0, 3) || []

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card className="bg-gradient-to-r from-yellow-50 via-orange-50 to-red-50 dark:from-yellow-950 dark:via-orange-950 dark:to-red-950 border-gray-200/50 dark:border-gray-700/50">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-yellow-500 rounded-full">
                  <Trophy className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  맨 오브 더 매치 투표
                </h2>
              </div>
              <p className="text-gray-600 dark:text-gray-400">
                오늘 경기에서 가장 뛰어난 활약을 보인 선수에게 투표하세요
              </p>
            </div>
            
            <div className="text-right">
              {votingOpen && votingEndTime && (
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">투표 마감까지</p>
                  <Badge className="bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300">
                    <Clock className="w-3 h-3 mr-1" />
                    {timeLeft}
                  </Badge>
                </div>
              )}
              {totalVotes > 0 && (
                <div className="mt-2">
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {totalVotes.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">총 투표수</p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results or Voting */}
      {showResults && results ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Top 3 Winners */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {topPlayers.map((result, index) => {
              const player = allPlayers.find(p => p.id === result.playerId)
              if (!player) return null
              
              const medals = [
                { icon: <Crown className="w-8 h-8" />, color: 'from-yellow-400 to-orange-500' },
                { icon: <Medal className="w-8 h-8" />, color: 'from-gray-400 to-gray-500' },
                { icon: <Award className="w-8 h-8" />, color: 'from-orange-600 to-orange-700' }
              ]
              
              return (
                <motion.div
                  key={result.playerId}
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: index * 0.2 }}
                >
                  <Card className={cn(
                    "relative overflow-hidden",
                    index === 0 && "ring-2 ring-yellow-500"
                  )}>
                    <div className={cn(
                      "absolute inset-0 opacity-10 bg-gradient-to-br",
                      medals[index].color
                    )} />
                    
                    <CardContent className="relative p-6">
                      <div className="flex justify-center mb-4">
                        <div className={cn(
                          "p-3 rounded-full bg-gradient-to-br text-white",
                          medals[index].color
                        )}>
                          {medals[index].icon}
                        </div>
                      </div>
                      
                      <div className="text-center">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                          {player.name}
                        </h3>
                        <div className="flex items-center justify-center gap-2 mb-3">
                          <img src={player.team.logo} alt="" className="w-5 h-5" />
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {player.team.name}
                          </span>
                        </div>
                        <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                          {result.percentage}%
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {result.votes.toLocaleString()} 표
                        </p>
                        
                        {player.stats && (
                          <div className="mt-4 flex justify-center gap-4 text-xs">
                            {player.stats.goals && player.stats.goals > 0 && (
                              <Badge variant="secondary">⚽ {player.stats.goals}</Badge>
                            )}
                            {player.stats.assists && player.stats.assists > 0 && (
                              <Badge variant="secondary">🅰️ {player.stats.assists}</Badge>
                            )}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </div>

          {/* All Results */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">전체 투표 결과</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {results.map((result) => {
                const player = allPlayers.find(p => p.id === result.playerId)
                if (!player) return null
                
                return (
                  <div
                    key={result.playerId}
                    className={cn(
                      "p-3 rounded-lg",
                      userVote === result.playerId && "bg-blue-50 dark:bg-blue-950"
                    )}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-semibold text-gray-600 dark:text-gray-400 w-8">
                          #{result.rank}
                        </span>
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={player.photo} />
                          <AvatarFallback>{player.number}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {player.name}
                            {userVote === result.playerId && (
                              <Badge className="ml-2" variant="secondary">내 투표</Badge>
                            )}
                          </p>
                          <div className="flex items-center gap-2 text-xs">
                            <Badge className={positionColors[player.position]}>
                              {player.position}
                            </Badge>
                            <span className="text-gray-600 dark:text-gray-400">
                              {player.team.name}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {result.percentage}%
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {result.votes} 표
                        </p>
                      </div>
                    </div>
                    
                    <Progress value={result.percentage} className="h-2" />
                  </div>
                )
              })}
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        <div className="space-y-4">
          {/* Voting Form */}
          {votingOpen && !hasVoted ? (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">선수 선택</CardTitle>
                </CardHeader>
                <CardContent>
                  <RadioGroup value={selectedPlayer || ''} onValueChange={setSelectedPlayer}>
                    <div className="space-y-3">
                      {['FWD', 'MID', 'DEF', 'GK'].map((pos) => {
                        const positionPlayers = allPlayers.filter(p => p.position === pos as any)
                        if (positionPlayers.length === 0) return null
                        
                        return (
                          <div key={pos}>
                            <Badge className={cn("mb-3", positionColors[pos as keyof typeof positionColors])}>
                              {pos === 'FWD' ? '공격수' : pos === 'MID' ? '미드필더' : pos === 'DEF' ? '수비수' : '골키퍼'}
                            </Badge>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              {positionPlayers.map((player) => (
                                <Label
                                  key={player.id}
                                  htmlFor={player.id}
                                  className={cn(
                                    "flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all",
                                    selectedPlayer === player.id
                                      ? "border-blue-500 bg-blue-50 dark:bg-blue-950"
                                      : "border-gray-200 dark:border-gray-700 hover:border-gray-300"
                                  )}
                                >
                                  <RadioGroupItem value={player.id} id={player.id} className="sr-only" />
                                  <Avatar className="w-10 h-10">
                                    <AvatarImage src={player.photo} />
                                    <AvatarFallback>{player.number}</AvatarFallback>
                                  </Avatar>
                                  
                                  <div className="flex-1">
                                    <p className="font-medium text-gray-900 dark:text-white">
                                      {player.name}
                                    </p>
                                    <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                                      <img src={player.team.logo} alt="" className="w-4 h-4" />
                                      <span>{player.team.name}</span>
                                      {player.rating && (
                                        <>
                                          <span>•</span>
                                          <span className="font-semibold">평점 {player.rating}</span>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                  
                                  {player.stats && (
                                    <div className="flex gap-2">
                                      {player.stats.goals && player.stats.goals > 0 && (
                                        <Badge variant="secondary" className="text-xs">
                                          ⚽ {player.stats.goals}
                                        </Badge>
                                      )}
                                      {player.stats.assists && player.stats.assists > 0 && (
                                        <Badge variant="secondary" className="text-xs">
                                          🅰️ {player.stats.assists}
                                        </Badge>
                                      )}
                                    </div>
                                  )}
                                </Label>
                              ))}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </RadioGroup>
                </CardContent>
              </Card>

              <Button
                onClick={handleVote}
                disabled={!selectedPlayer}
                className="w-full py-6 text-lg font-semibold bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white"
              >
                <Trophy className="w-5 h-5 mr-2" />
                MVP 투표하기
              </Button>
            </>
          ) : hasVoted ? (
            <Card>
              <CardContent className="py-12 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  투표 완료!
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  투표해 주셔서 감사합니다. 결과는 투표 종료 후 공개됩니다.
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">
                  투표가 아직 시작되지 않았습니다
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}