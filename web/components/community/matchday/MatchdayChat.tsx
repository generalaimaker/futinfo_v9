'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Send, MessageSquare, Heart, Trophy, Zap, Shield,
  Clock, Users, TrendingUp, Star, Sparkles, Flag,
  Volume2, VolumeX, Settings, ChevronDown, Smile
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import { FanLevel } from '@/lib/types/community'
import data from '@emoji-mart/data'
import Picker from '@emoji-mart/react'

interface ChatMessage {
  id: string
  userId: string
  userName: string
  userAvatar?: string
  userLevel: FanLevel
  message: string
  timestamp: Date
  type: 'message' | 'goal' | 'card' | 'substitution' | 'system'
  reactions: { [emoji: string]: string[] }
  teamId?: number
  highlighted?: boolean
}

interface MatchdayChatProps {
  matchId: number
  homeTeam: {
    id: number
    name: string
    logo: string
    score: number
  }
  awayTeam: {
    id: number
    name: string
    logo: string
    score: number
  }
  currentUserId: string
  currentUserTeam?: number
  userLevel: FanLevel
  isLive: boolean
  matchTime?: number
  onlineUsers: number
}

const systemMessages = {
  goal: '⚽ 골! 골! 골!',
  redCard: '🟥 레드카드!',
  yellowCard: '🟨 옐로카드',
  substitution: '🔄 선수 교체',
  halfTime: '⏱️ 하프타임',
  fullTime: '📢 경기 종료'
}

const quickReactions = ['⚽', '🔥', '👏', '😱', '💪', '🎉']

export function MatchdayChat({
  matchId,
  homeTeam,
  awayTeam,
  currentUserId,
  currentUserTeam,
  userLevel,
  isLive,
  matchTime = 0,
  onlineUsers
}: MatchdayChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [autoScroll, setAutoScroll] = useState(true)
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  // Auto scroll to bottom
  const scrollToBottom = () => {
    if (autoScroll) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Simulate receiving messages
  useEffect(() => {
    const interval = setInterval(() => {
      if (isLive && Math.random() > 0.7) {
        const sampleMessages = [
          '대박! 이거 골각이다!',
          '수비 뭐하냐 진짜...',
          '우리팀 화이팅! 💪',
          '심판 눈 좀 떠라',
          '이번 시즌 최고의 경기다',
          'VAR 확인 필요해요'
        ]
        
        const newMessage: ChatMessage = {
          id: Date.now().toString(),
          userId: `user${Math.floor(Math.random() * 100)}`,
          userName: `팬${Math.floor(Math.random() * 100)}`,
          userLevel: [FanLevel.BASIC, FanLevel.VERIFIED, FanLevel.VIP][Math.floor(Math.random() * 3)],
          message: sampleMessages[Math.floor(Math.random() * sampleMessages.length)],
          timestamp: new Date(),
          type: 'message',
          reactions: {},
          teamId: Math.random() > 0.5 ? homeTeam.id : awayTeam.id
        }
        
        setMessages(prev => [...prev.slice(-100), newMessage])
      }
    }, 3000)

    return () => clearInterval(interval)
  }, [isLive, homeTeam.id, awayTeam.id])

  const sendMessage = () => {
    if (!inputMessage.trim()) return

    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      userId: currentUserId,
      userName: '나',
      userLevel,
      message: inputMessage,
      timestamp: new Date(),
      type: 'message',
      reactions: {},
      teamId: currentUserTeam,
      highlighted: true
    }

    setMessages(prev => [...prev, newMessage])
    setInputMessage('')
    setShowEmojiPicker(false)
  }

  const addReaction = (messageId: string, emoji: string) => {
    setMessages(prev => prev.map(msg => {
      if (msg.id === messageId) {
        const reactions = { ...msg.reactions }
        if (!reactions[emoji]) reactions[emoji] = []
        
        if (reactions[emoji].includes(currentUserId)) {
          reactions[emoji] = reactions[emoji].filter(id => id !== currentUserId)
          if (reactions[emoji].length === 0) delete reactions[emoji]
        } else {
          reactions[emoji].push(currentUserId)
        }
        
        return { ...msg, reactions }
      }
      return msg
    }))
  }

  const getLevelBadge = (level: FanLevel) => {
    switch (level) {
      case FanLevel.VIP:
        return <Badge className="bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs">VIP</Badge>
      case FanLevel.VERIFIED:
        return <Badge className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white text-xs">인증</Badge>
      case FanLevel.BASIC:
        return <Badge variant="secondary" className="text-xs">팬</Badge>
      default:
        return null
    }
  }

  const getTeamColor = (teamId?: number) => {
    if (teamId === homeTeam.id) return 'border-l-4 border-l-blue-500'
    if (teamId === awayTeam.id) return 'border-l-4 border-l-red-500'
    return ''
  }

  return (
    <Card className="h-[600px] flex flex-col bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl border-gray-200/50 dark:border-gray-700/50">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="relative">
              <MessageSquare className="w-5 h-5 text-blue-600" />
              {isLive && (
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              )}
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white">
              매치데이 채팅
            </h3>
            {isLive && (
              <Badge className="bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300">
                LIVE
              </Badge>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="font-mono">
              <Users className="w-3 h-3 mr-1" />
              {onlineUsers.toLocaleString()}
            </Badge>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMuted(!isMuted)}
              className="w-8 h-8"
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        {/* Match Score */}
        <div className="flex items-center justify-between bg-gradient-to-r from-blue-50 to-red-50 dark:from-blue-950 dark:to-red-950 rounded-lg p-2">
          <div className="flex items-center gap-2">
            <img src={homeTeam.logo} alt={homeTeam.name} className="w-6 h-6" />
            <span className="font-medium text-sm">{homeTeam.name}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xl font-bold">{homeTeam.score}</span>
            <span className="text-gray-500">-</span>
            <span className="text-xl font-bold">{awayTeam.score}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm">{awayTeam.name}</span>
            <img src={awayTeam.logo} alt={awayTeam.name} className="w-6 h-6" />
          </div>
        </div>

        {isLive && matchTime > 0 && (
          <div className="flex justify-center mt-2">
            <Badge className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
              <Clock className="w-3 h-3 mr-1" />
              {matchTime}'
            </Badge>
          </div>
        )}
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
        <div className="space-y-3">
          <AnimatePresence initial={false}>
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -100 }}
                className={cn(
                  "group",
                  message.highlighted && "animate-pulse-once"
                )}
              >
                {message.type === 'system' ? (
                  <div className="flex justify-center">
                    <Badge className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300">
                      {message.message}
                    </Badge>
                  </div>
                ) : (
                  <div className={cn(
                    "flex gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors",
                    getTeamColor(message.teamId)
                  )}>
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={message.userAvatar} />
                      <AvatarFallback className="text-xs">
                        {message.userName.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm text-gray-900 dark:text-white">
                          {message.userName}
                        </span>
                        {getLevelBadge(message.userLevel)}
                        <span className="text-xs text-gray-500">
                          {new Date(message.timestamp).toLocaleTimeString('ko-KR', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                      
                      <p className="text-gray-700 dark:text-gray-300 break-words">
                        {message.message}
                      </p>
                      
                      {/* Reactions */}
                      {Object.keys(message.reactions).length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {Object.entries(message.reactions).map(([emoji, users]) => (
                            <button
                              key={emoji}
                              onClick={() => addReaction(message.id, emoji)}
                              className={cn(
                                "px-2 py-1 rounded-full text-xs flex items-center gap-1 transition-all",
                                users.includes(currentUserId)
                                  ? "bg-blue-100 dark:bg-blue-900 border border-blue-300 dark:border-blue-700"
                                  : "bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"
                              )}
                            >
                              <span>{emoji}</span>
                              <span className="font-medium">{users.length}</span>
                            </button>
                          ))}
                        </div>
                      )}
                      
                      {/* Quick Reactions (shown on hover) */}
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 mt-2">
                        {quickReactions.map((emoji) => (
                          <button
                            key={emoji}
                            onClick={() => addReaction(message.id, emoji)}
                            className="w-7 h-7 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 flex items-center justify-center transition-colors"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
          
          {isTyping && (
            <div className="flex items-center gap-2 px-3 py-2">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100" />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200" />
              </div>
              <span className="text-xs text-gray-500">누군가 입력 중...</span>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Input
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              onFocus={() => setIsTyping(true)}
              onBlur={() => setIsTyping(false)}
              placeholder={isLive ? "응원 메시지를 입력하세요..." : "채팅이 종료되었습니다"}
              disabled={!isLive}
              className="pr-10"
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="absolute right-1 top-1/2 -translate-y-1/2 w-8 h-8"
            >
              <Smile className="w-4 h-4" />
            </Button>
            
            {/* Emoji Picker */}
            {showEmojiPicker && (
              <div className="absolute bottom-full right-0 mb-2 z-50">
                <Card className="p-2">
                  <Picker
                    data={data}
                    onEmojiSelect={(emoji: any) => {
                      setInputMessage(prev => prev + emoji.native)
                      setShowEmojiPicker(false)
                    }}
                    theme="light"
                    previewPosition="none"
                    skinTonePosition="none"
                    maxFrequentRows={1}
                  />
                </Card>
              </div>
            )}
          </div>
          
          <Button
            onClick={sendMessage}
            disabled={!isLive || !inputMessage.trim()}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
        
        {/* Quick Messages */}
        {isLive && (
          <div className="flex gap-2 mt-2 overflow-x-auto">
            {['화이팅! 💪', '골 넣자! ⚽', '수비 집중! 🛡️', '대박! 😱', 'VAR! 📺'].map((quick) => (
              <Button
                key={quick}
                variant="outline"
                size="sm"
                onClick={() => {
                  setInputMessage(quick)
                  sendMessage()
                }}
                className="whitespace-nowrap"
              >
                {quick}
              </Button>
            ))}
          </div>
        )}
      </div>
    </Card>
  )
}