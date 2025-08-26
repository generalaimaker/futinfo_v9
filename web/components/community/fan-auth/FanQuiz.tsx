'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Trophy, CheckCircle, XCircle, Clock, Star, Zap, Award } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface QuizQuestion {
  id: string
  question: string
  options: string[]
  correctAnswer: number
  difficulty: 'easy' | 'medium' | 'hard'
  category: 'history' | 'players' | 'matches' | 'stadium'
  points: number
}

interface FanQuizProps {
  teamId: number
  teamName: string
  teamLogo: string
  onComplete: (score: number, passed: boolean) => void
}

// 팀별 퀴즈 데이터 (실제로는 API에서 가져와야 함)
const getTeamQuizzes = (teamId: number): QuizQuestion[] => {
  // Chelsea 예제 퀴즈
  if (teamId === 49) {
    return [
      {
        id: '1',
        question: 'Chelsea FC가 창단된 연도는?',
        options: ['1903년', '1905년', '1907년', '1909년'],
        correctAnswer: 1,
        difficulty: 'easy',
        category: 'history',
        points: 10
      },
      {
        id: '2',
        question: 'Chelsea의 홈 구장 이름은?',
        options: ['올드 트래포드', '에미레이츠', '스탬포드 브릿지', '안필드'],
        correctAnswer: 2,
        difficulty: 'easy',
        category: 'stadium',
        points: 10
      },
      {
        id: '3',
        question: '2012년 UEFA 챔피언스리그 결승에서 Chelsea가 이긴 팀은?',
        options: ['바르셀로나', '레알 마드리드', '바이에른 뮌헨', '유벤투스'],
        correctAnswer: 2,
        difficulty: 'medium',
        category: 'matches',
        points: 20
      },
      {
        id: '4',
        question: 'Chelsea 역사상 최다 득점자는?',
        options: ['프랭크 램파드', '디디에 드로그바', '지안프랑코 졸라', '에덴 아자르'],
        correctAnswer: 0,
        difficulty: 'hard',
        category: 'players',
        points: 30
      },
      {
        id: '5',
        question: 'Chelsea가 Premier League를 처음 우승한 연도는?',
        options: ['2003-04', '2004-05', '2005-06', '2006-07'],
        correctAnswer: 1,
        difficulty: 'medium',
        category: 'history',
        points: 20
      }
    ]
  }
  
  // 기본 퀴즈 세트
  return [
    {
      id: '1',
      question: `${teamName}의 창단 연도는?`,
      options: ['1900년대', '1910년대', '1920년대', '1930년대'],
      correctAnswer: 0,
      difficulty: 'easy',
      category: 'history',
      points: 10
    },
    // ... 더 많은 질문
  ]
}

export function FanQuiz({ teamId, teamName, teamLogo, onComplete }: FanQuizProps) {
  const [questions] = useState<QuizQuestion[]>(getTeamQuizzes(teamId))
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [isAnswered, setIsAnswered] = useState(false)
  const [score, setScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(30)
  const [streak, setStreak] = useState(0)
  const [answers, setAnswers] = useState<boolean[]>([])

  const currentQuestion = questions[currentQuestionIndex]
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100
  const isLastQuestion = currentQuestionIndex === questions.length - 1

  useEffect(() => {
    if (timeLeft > 0 && !isAnswered) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000)
      return () => clearTimeout(timer)
    } else if (timeLeft === 0 && !isAnswered) {
      handleTimeout()
    }
  }, [timeLeft, isAnswered])

  const handleTimeout = () => {
    setIsAnswered(true)
    setAnswers([...answers, false])
    setStreak(0)
  }

  const handleAnswer = (answerIndex: number) => {
    if (isAnswered) return
    
    setSelectedAnswer(answerIndex)
    setIsAnswered(true)
    
    const isCorrect = answerIndex === currentQuestion.correctAnswer
    setAnswers([...answers, isCorrect])
    
    if (isCorrect) {
      const bonusPoints = streak > 0 ? 5 * streak : 0
      const timeBonus = Math.floor(timeLeft / 3)
      const totalPoints = currentQuestion.points + bonusPoints + timeBonus
      
      setScore(score + totalPoints)
      setStreak(streak + 1)
    } else {
      setStreak(0)
    }
  }

  const handleNext = () => {
    if (isLastQuestion) {
      const passed = score >= 50 // 50점 이상이면 통과
      onComplete(score, passed)
    } else {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
      setSelectedAnswer(null)
      setIsAnswered(false)
      setTimeLeft(30)
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'text-green-500'
      case 'medium': return 'text-yellow-500'
      case 'hard': return 'text-red-500'
      default: return 'text-gray-500'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl p-6 shadow-xl border border-gray-200/50 dark:border-gray-700/50">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <img src={teamLogo} alt={teamName} className="w-16 h-16" />
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    {teamName} 팬 인증 퀴즈
                  </h1>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    진짜 팬임을 증명하세요!
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                  {score}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">포인트</p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">
                  문제 {currentQuestionIndex + 1} / {questions.length}
                </span>
                {streak > 0 && (
                  <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500">
                    <Zap className="w-3 h-3 mr-1" />
                    {streak}연속 정답!
                  </Badge>
                )}
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          </div>
        </motion.div>

        {/* Quiz Card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestion.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl border-gray-200/50 dark:border-gray-700/50 shadow-2xl">
              <div className="p-8">
                {/* Question Header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className={getDifficultyColor(currentQuestion.difficulty)}>
                      {currentQuestion.difficulty === 'easy' && '쉬움'}
                      {currentQuestion.difficulty === 'medium' && '보통'}
                      {currentQuestion.difficulty === 'hard' && '어려움'}
                    </Badge>
                    <Badge variant="outline">
                      {currentQuestion.category === 'history' && '역사'}
                      {currentQuestion.category === 'players' && '선수'}
                      {currentQuestion.category === 'matches' && '경기'}
                      {currentQuestion.category === 'stadium' && '구장'}
                    </Badge>
                    <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                      +{currentQuestion.points}점
                    </Badge>
                  </div>
                  <div className={cn(
                    "flex items-center gap-2 px-3 py-1 rounded-full",
                    timeLeft <= 10 ? "bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-300" : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300"
                  )}>
                    <Clock className="w-4 h-4" />
                    <span className="font-mono font-bold">{timeLeft}s</span>
                  </div>
                </div>

                {/* Question */}
                <h2 className="text-2xl font-bold mb-8 text-gray-900 dark:text-white">
                  {currentQuestion.question}
                </h2>

                {/* Options */}
                <div className="grid gap-3">
                  {currentQuestion.options.map((option, index) => {
                    const isCorrect = index === currentQuestion.correctAnswer
                    const isSelected = index === selectedAnswer
                    const showResult = isAnswered

                    return (
                      <motion.button
                        key={index}
                        whileHover={!isAnswered ? { scale: 1.02 } : {}}
                        whileTap={!isAnswered ? { scale: 0.98 } : {}}
                        onClick={() => handleAnswer(index)}
                        disabled={isAnswered}
                        className={cn(
                          "relative p-4 rounded-2xl text-left transition-all duration-300",
                          "border-2",
                          !showResult && "hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950",
                          !showResult && isSelected && "border-blue-500 bg-blue-50 dark:bg-blue-950",
                          !showResult && !isSelected && "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800",
                          showResult && isCorrect && "border-green-500 bg-green-50 dark:bg-green-950",
                          showResult && !isCorrect && isSelected && "border-red-500 bg-red-50 dark:bg-red-950",
                          showResult && !isCorrect && !isSelected && "border-gray-200 dark:border-gray-700 opacity-50"
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-gray-900 dark:text-white">
                            {option}
                          </span>
                          {showResult && isCorrect && (
                            <CheckCircle className="w-5 h-5 text-green-600" />
                          )}
                          {showResult && !isCorrect && isSelected && (
                            <XCircle className="w-5 h-5 text-red-600" />
                          )}
                        </div>
                      </motion.button>
                    )
                  })}
                </div>

                {/* Result Message */}
                <AnimatePresence>
                  {isAnswered && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-6"
                    >
                      {selectedAnswer === currentQuestion.correctAnswer ? (
                        <div className="bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 p-4 rounded-xl">
                          <div className="flex items-center gap-2 font-semibold">
                            <CheckCircle className="w-5 h-5" />
                            정답입니다! +{currentQuestion.points}점
                            {streak > 1 && ` (+${5 * (streak - 1)} 연속 보너스)`}
                            {timeLeft > 20 && ` (+${Math.floor(timeLeft / 3)} 시간 보너스)`}
                          </div>
                        </div>
                      ) : (
                        <div className="bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 p-4 rounded-xl">
                          <div className="flex items-center gap-2 font-semibold">
                            <XCircle className="w-5 h-5" />
                            틀렸습니다! 정답은 "{currentQuestion.options[currentQuestion.correctAnswer]}" 입니다.
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Action Button */}
                {isAnswered && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="mt-6"
                  >
                    <Button
                      onClick={handleNext}
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-6 text-lg font-semibold rounded-2xl"
                    >
                      {isLastQuestion ? (
                        <>
                          <Trophy className="w-5 h-5 mr-2" />
                          결과 확인하기
                        </>
                      ) : (
                        '다음 문제'
                      )}
                    </Button>
                  </motion.div>
                )}
              </div>
            </Card>
          </motion.div>
        </AnimatePresence>

        {/* Answer History */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-6"
        >
          <div className="flex gap-2 justify-center">
            {questions.map((_, index) => {
              const isAnswered = index < answers.length
              const isCorrect = answers[index]
              const isCurrent = index === currentQuestionIndex

              return (
                <div
                  key={index}
                  className={cn(
                    "w-12 h-12 rounded-full flex items-center justify-center text-sm font-semibold transition-all",
                    isCurrent && "ring-4 ring-blue-400 ring-offset-2",
                    !isAnswered && "bg-gray-200 dark:bg-gray-700 text-gray-500",
                    isAnswered && isCorrect && "bg-green-500 text-white",
                    isAnswered && !isCorrect && "bg-red-500 text-white"
                  )}
                >
                  {isAnswered ? (
                    isCorrect ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />
                  ) : (
                    index + 1
                  )}
                </div>
              )
            })}
          </div>
        </motion.div>
      </div>
    </div>
  )
}