'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Trophy, Target, TrendingUp, Star, Award, Zap,
  Clock, Users, ChevronRight, Lock, CheckCircle,
  AlertCircle, Coins, Gift, Crown, Shield
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'

interface Match {
  id: number
  homeTeam: {
    id: number
    name: string
    logo: string
    form: string[]
    odds: number
  }
  awayTeam: {
    id: number
    name: string
    logo: string
    form: string[]
    odds: number
  }
  date: Date
  competition: string
}

interface Prediction {
  matchId: number
  userId: string
  prediction: 'home' | 'draw' | 'away'
  scoreHome?: number
  scoreAway?: number
  confidence: number
  stake: number
  timestamp: Date
  locked: boolean
  result?: 'win' | 'lose' | 'pending'
  points?: number
}

interface LeaderboardEntry {
  rank: number
  userId: string
  userName: string
  userAvatar?: string
  points: number
  predictions: number
  accuracy: number
  streak: number
  badge?: 'gold' | 'silver' | 'bronze'
}

interface PredictionGameProps {
  userId: string
  userName: string
  userPoints: number
  matches: Match[]
  predictions: Prediction[]
  leaderboard: LeaderboardEntry[]
  onPredict: (prediction: Omit<Prediction, 'userId' | 'timestamp' | 'locked' | 'result' | 'points'>) => void
}

export function PredictionGame({
  userId,
  userName,
  userPoints,
  matches,
  predictions,
  leaderboard,
  onPredict
}: PredictionGameProps) {
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(matches[0] || null)
  const [prediction, setPrediction] = useState<'home' | 'draw' | 'away' | null>(null)
  const [scoreHome, setScoreHome] = useState<number>(0)
  const [scoreAway, setScoreAway] = useState<number>(0)
  const [confidence, setConfidence] = useState<number>(50)
  const [stake, setStake] = useState<number>(10)
  const [activeTab, setActiveTab] = useState<'predict' | 'history' | 'leaderboard'>('predict')

  const userRank = leaderboard.findIndex(entry => entry.userId === userId) + 1
  const userStats = leaderboard.find(entry => entry.userId === userId)
  const canPredict = selectedMatch && new Date(selectedMatch.date) > new Date()

  const handleSubmitPrediction = () => {
    if (!selectedMatch || !prediction) return

    onPredict({
      matchId: selectedMatch.id,
      prediction,
      scoreHome,
      scoreAway,
      confidence,
      stake
    })

    // Reset form
    setPrediction(null)
    setScoreHome(0)
    setScoreAway(0)
    setConfidence(50)
    setStake(10)
  }

  const getPredictionForMatch = (matchId: number) => {
    return predictions.find(p => p.matchId === matchId)
  }

  const getOddsMultiplier = (prediction: 'home' | 'draw' | 'away', match: Match) => {
    switch (prediction) {
      case 'home': return match.homeTeam.odds
      case 'draw': return 3.5
      case 'away': return match.awayTeam.odds
    }
  }

  const potentialWin = selectedMatch && prediction 
    ? Math.floor(stake * getOddsMultiplier(prediction, selectedMatch))
    : 0

  return (
    <div className="space-y-6">
      {/* User Stats Card */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 border-gray-200/50 dark:border-gray-700/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">내 포인트</p>
                <div className="flex items-center gap-2">
                  <Coins className="w-6 h-6 text-yellow-500" />
                  <span className="text-3xl font-bold text-gray-900 dark:text-white">
                    {userPoints.toLocaleString()}
                  </span>
                </div>
              </div>
              
              <div className="flex gap-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">{userStats?.accuracy || 0}%</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">적중률</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-purple-600">#{userRank || '-'}</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">순위</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-orange-600">{userStats?.streak || 0}</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">연승</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="predict">
            <Target className="w-4 h-4 mr-2" />
            예측하기
          </TabsTrigger>
          <TabsTrigger value="history">
            <Clock className="w-4 h-4 mr-2" />
            내 예측
          </TabsTrigger>
          <TabsTrigger value="leaderboard">
            <Trophy className="w-4 h-4 mr-2" />
            리더보드
          </TabsTrigger>
        </TabsList>

        {/* Predict Tab */}
        <TabsContent value="predict" className="space-y-4">
          {/* Match Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">경기 선택</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {matches.map((match) => {
                const existingPrediction = getPredictionForMatch(match.id)
                const isLocked = new Date(match.date) < new Date()
                
                return (
                  <motion.div
                    key={match.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <button
                      onClick={() => !isLocked && !existingPrediction && setSelectedMatch(match)}
                      disabled={isLocked || !!existingPrediction}
                      className={cn(
                        "w-full p-4 rounded-xl border-2 transition-all",
                        selectedMatch?.id === match.id
                          ? "border-blue-500 bg-blue-50 dark:bg-blue-950"
                          : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600",
                        (isLocked || existingPrediction) && "opacity-50 cursor-not-allowed"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <img src={match.homeTeam.logo} alt={match.homeTeam.name} className="w-8 h-8" />
                          <span className="font-medium">{match.homeTeam.name}</span>
                        </div>
                        <div className="text-center">
                          <Badge variant="outline" className="mb-1">
                            {match.competition}
                          </Badge>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            {new Date(match.date).toLocaleDateString('ko-KR')}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-medium">{match.awayTeam.name}</span>
                          <img src={match.awayTeam.logo} alt={match.awayTeam.name} className="w-8 h-8" />
                        </div>
                      </div>
                      
                      {existingPrediction && (
                        <div className="mt-2 flex items-center justify-center gap-2 text-green-600">
                          <CheckCircle className="w-4 h-4" />
                          <span className="text-sm">예측 완료</span>
                        </div>
                      )}
                      
                      {isLocked && !existingPrediction && (
                        <div className="mt-2 flex items-center justify-center gap-2 text-gray-500">
                          <Lock className="w-4 h-4" />
                          <span className="text-sm">예측 마감</span>
                        </div>
                      )}
                    </button>
                  </motion.div>
                )
              })}
            </CardContent>
          </Card>

          {/* Prediction Form */}
          {selectedMatch && canPredict && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">승부 예측</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Winner Prediction */}
                  <div>
                    <Label className="mb-3 block">승부 예측</Label>
                    <RadioGroup value={prediction || ''} onValueChange={(v) => setPrediction(v as any)}>
                      <div className="grid grid-cols-3 gap-3">
                        <Label
                          htmlFor="home"
                          className={cn(
                            "flex flex-col items-center gap-2 p-4 rounded-xl border-2 cursor-pointer transition-all",
                            prediction === 'home'
                              ? "border-blue-500 bg-blue-50 dark:bg-blue-950"
                              : "border-gray-200 dark:border-gray-700 hover:border-gray-300"
                          )}
                        >
                          <RadioGroupItem value="home" id="home" className="sr-only" />
                          <img src={selectedMatch.homeTeam.logo} alt="" className="w-12 h-12" />
                          <span className="font-medium">{selectedMatch.homeTeam.name}</span>
                          <Badge className="bg-blue-100 text-blue-700">
                            x{selectedMatch.homeTeam.odds}
                          </Badge>
                        </Label>
                        
                        <Label
                          htmlFor="draw"
                          className={cn(
                            "flex flex-col items-center gap-2 p-4 rounded-xl border-2 cursor-pointer transition-all",
                            prediction === 'draw'
                              ? "border-gray-500 bg-gray-50 dark:bg-gray-900"
                              : "border-gray-200 dark:border-gray-700 hover:border-gray-300"
                          )}
                        >
                          <RadioGroupItem value="draw" id="draw" className="sr-only" />
                          <div className="w-12 h-12 flex items-center justify-center text-2xl font-bold text-gray-500">
                            =
                          </div>
                          <span className="font-medium">무승부</span>
                          <Badge className="bg-gray-100 text-gray-700">
                            x3.5
                          </Badge>
                        </Label>
                        
                        <Label
                          htmlFor="away"
                          className={cn(
                            "flex flex-col items-center gap-2 p-4 rounded-xl border-2 cursor-pointer transition-all",
                            prediction === 'away'
                              ? "border-red-500 bg-red-50 dark:bg-red-950"
                              : "border-gray-200 dark:border-gray-700 hover:border-gray-300"
                          )}
                        >
                          <RadioGroupItem value="away" id="away" className="sr-only" />
                          <img src={selectedMatch.awayTeam.logo} alt="" className="w-12 h-12" />
                          <span className="font-medium">{selectedMatch.awayTeam.name}</span>
                          <Badge className="bg-red-100 text-red-700">
                            x{selectedMatch.awayTeam.odds}
                          </Badge>
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>

                  {/* Score Prediction */}
                  <div>
                    <Label className="mb-3 block">스코어 예측 (보너스 포인트)</Label>
                    <div className="flex items-center gap-4 justify-center">
                      <div className="text-center">
                        <img src={selectedMatch.homeTeam.logo} alt="" className="w-8 h-8 mx-auto mb-2" />
                        <input
                          type="number"
                          min="0"
                          max="10"
                          value={scoreHome}
                          onChange={(e) => setScoreHome(parseInt(e.target.value) || 0)}
                          className="w-16 h-12 text-2xl font-bold text-center border-2 rounded-lg"
                        />
                      </div>
                      <span className="text-2xl font-bold text-gray-500">:</span>
                      <div className="text-center">
                        <img src={selectedMatch.awayTeam.logo} alt="" className="w-8 h-8 mx-auto mb-2" />
                        <input
                          type="number"
                          min="0"
                          max="10"
                          value={scoreAway}
                          onChange={(e) => setScoreAway(parseInt(e.target.value) || 0)}
                          className="w-16 h-12 text-2xl font-bold text-center border-2 rounded-lg"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Confidence & Stake */}
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-2">
                        <Label>확신도</Label>
                        <span className="text-sm font-semibold">{confidence}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={confidence}
                        onChange={(e) => setConfidence(parseInt(e.target.value))}
                        className="w-full"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between mb-2">
                        <Label>베팅 포인트</Label>
                        <span className="text-sm text-gray-600">보유: {userPoints}P</span>
                      </div>
                      <div className="flex gap-2">
                        {[10, 50, 100, 500].map((amount) => (
                          <Button
                            key={amount}
                            variant={stake === amount ? "default" : "outline"}
                            size="sm"
                            onClick={() => setStake(amount)}
                            disabled={amount > userPoints}
                          >
                            {amount}P
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Potential Win */}
                  {prediction && (
                    <div className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-950 dark:to-orange-950 rounded-xl p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">예상 획득 포인트</span>
                        <div className="flex items-center gap-2">
                          <Trophy className="w-5 h-5 text-yellow-500" />
                          <span className="text-2xl font-bold text-yellow-600">
                            +{potentialWin.toLocaleString()}P
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Submit Button */}
                  <Button
                    onClick={handleSubmitPrediction}
                    disabled={!prediction}
                    className="w-full py-6 text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                  >
                    <Target className="w-5 h-5 mr-2" />
                    예측 제출
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-4">
          {predictions.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">아직 예측한 경기가 없습니다</p>
              </CardContent>
            </Card>
          ) : (
            predictions.map((pred) => {
              const match = matches.find(m => m.id === pred.matchId)
              if (!match) return null
              
              return (
                <Card key={pred.matchId}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <img src={match.homeTeam.logo} alt="" className="w-6 h-6" />
                        <span className="font-medium">{match.homeTeam.name}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-medium">{match.awayTeam.name}</span>
                        <img src={match.awayTeam.logo} alt="" className="w-6 h-6" />
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <Badge variant={pred.result === 'win' ? 'default' : pred.result === 'lose' ? 'destructive' : 'secondary'}>
                        {pred.result === 'win' ? '적중' : pred.result === 'lose' ? '실패' : '대기중'}
                      </Badge>
                      
                      <div className="flex items-center gap-4 text-sm">
                        <span>예측: {pred.prediction === 'home' ? match.homeTeam.name : pred.prediction === 'away' ? match.awayTeam.name : '무승부'}</span>
                        {pred.scoreHome !== undefined && (
                          <span>{pred.scoreHome} - {pred.scoreAway}</span>
                        )}
                        <span className="font-semibold">
                          {pred.points ? `+${pred.points}P` : `${pred.stake}P`}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })
          )}
        </TabsContent>

        {/* Leaderboard Tab */}
        <TabsContent value="leaderboard">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-500" />
                예측왕 리더보드
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {leaderboard.map((entry) => (
                  <div
                    key={entry.userId}
                    className={cn(
                      "flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors",
                      entry.userId === userId && "bg-blue-50 dark:bg-blue-950"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 text-center">
                        {entry.rank <= 3 ? (
                          <div className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center text-white font-bold",
                            entry.rank === 1 && "bg-gradient-to-r from-yellow-400 to-orange-500",
                            entry.rank === 2 && "bg-gradient-to-r from-gray-400 to-gray-500",
                            entry.rank === 3 && "bg-gradient-to-r from-orange-600 to-orange-700"
                          )}>
                            {entry.rank}
                          </div>
                        ) : (
                          <span className="text-lg font-semibold text-gray-600">{entry.rank}</span>
                        )}
                      </div>
                      
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {entry.userName}
                          {entry.userId === userId && (
                            <Badge className="ml-2" variant="secondary">나</Badge>
                          )}
                        </p>
                        <div className="flex items-center gap-3 text-xs text-gray-600 dark:text-gray-400">
                          <span>적중률 {entry.accuracy}%</span>
                          <span>연승 {entry.streak}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <p className="text-xl font-bold text-gray-900 dark:text-white">
                        {entry.points.toLocaleString()}P
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {entry.predictions}회 예측
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}