'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Heart, MessageSquare, Share2, Bookmark, MoreHorizontal,
  ThumbsUp, Laugh, Angry, Trophy, Goal, Shield, Crown,
  Flag, Eye, Clock, TrendingUp, ChevronUp, ChevronDown,
  Play, Pause, Volume2, VolumeX, Maximize2, Star
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { CommunityPost, PostReactions, FanLevel } from '@/lib/types/community'
import { formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'
import Image from 'next/image'

interface InteractivePostProps {
  post: CommunityPost
  currentUserId?: string
  userFanLevel?: FanLevel
  onLike: (postId: string) => void
  onReact: (postId: string, reaction: keyof PostReactions) => void
  onComment: (postId: string) => void
  onShare: (postId: string) => void
  onBookmark: (postId: string) => void
  onReport: (postId: string) => void
  onDelete?: (postId: string) => void
  onVote?: (postId: string, optionIndex: number) => void
}

// 리액션 아이콘 매핑
const reactionIcons: Record<keyof PostReactions, { icon: React.ReactNode; color: string; label: string }> = {
  like: { icon: <ThumbsUp className="w-5 h-5" />, color: 'text-blue-600', label: '좋아요' },
  love: { icon: <Heart className="w-5 h-5" />, color: 'text-red-600', label: '사랑해요' },
  haha: { icon: <Laugh className="w-5 h-5" />, color: 'text-yellow-600', label: '웃겨요' },
  wow: { icon: <Star className="w-5 h-5" />, color: 'text-purple-600', label: '놀라워요' },
  sad: { icon: <Heart className="w-5 h-5" />, color: 'text-gray-600', label: '슬퍼요' },
  angry: { icon: <Angry className="w-5 h-5" />, color: 'text-orange-600', label: '화나요' },
  teamLove: { icon: <Shield className="w-5 h-5" />, color: 'text-green-600', label: '팀 사랑' },
  goal: { icon: <Trophy className="w-5 h-5" />, color: 'text-yellow-500', label: '골!' },
  trophy: { icon: <Trophy className="w-5 h-5" />, color: 'text-gold-600', label: '우승' },
}

export function InteractivePost({
  post,
  currentUserId,
  userFanLevel = FanLevel.NONE,
  onLike,
  onReact,
  onComment,
  onShare,
  onBookmark,
  onReport,
  onDelete,
  onVote
}: InteractivePostProps) {
  const [showReactions, setShowReactions] = useState(false)
  const [selectedReaction, setSelectedReaction] = useState<keyof PostReactions | null>(null)
  const [isExpanded, setIsExpanded] = useState(false)
  const [imageIndex, setImageIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [votedOption, setVotedOption] = useState<number | null>(null)

  const isAuthor = currentUserId === post.authorId
  const hasImages = post.imageUrls && post.imageUrls.length > 0
  const hasMultipleImages = post.imageUrls && post.imageUrls.length > 1
  const contentPreview = post.content.length > 300 ? post.content.slice(0, 300) + '...' : post.content
  
  // 투표 데이터 (예시)
  const poll = (post as any).poll
  const totalVotes = poll?.votes?.reduce((sum: number, v: number) => sum + v, 0) || 0

  const handleReaction = (reaction: keyof PostReactions) => {
    setSelectedReaction(reaction)
    setShowReactions(false)
    onReact(post.id, reaction)
  }

  const handleVote = (optionIndex: number) => {
    if (!votedOption && onVote) {
      setVotedOption(optionIndex)
      onVote(post.id, optionIndex)
    }
  }

  // 팬 레벨 배지
  const getFanLevelBadge = () => {
    const level = post.author?.fanLevel || FanLevel.NONE
    switch (level) {
      case FanLevel.VIP:
        return <Crown className="w-4 h-4 text-purple-600" />
      case FanLevel.VERIFIED:
        return <Shield className="w-4 h-4 text-blue-600" />
      case FanLevel.BASIC:
        return <Star className="w-4 h-4 text-green-600" />
      default:
        return null
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="overflow-hidden bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl border-gray-200/50 dark:border-gray-700/50 hover:shadow-xl transition-all">
        <CardContent className="p-0">
          {/* Post Header */}
          <div className="p-4 pb-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="w-10 h-10 border-2 border-gray-200 dark:border-gray-700">
                  <AvatarImage src={post.author?.avatarUrl} />
                  <AvatarFallback>
                    {post.author?.nickname?.charAt(0).toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {post.author?.nickname || '익명'}
                    </span>
                    {getFanLevelBadge()}
                    {post.author?.fanTeam && (
                      <Badge variant="outline" className="text-xs">
                        {post.author.fanTeam.teamName}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Clock className="w-3 h-3" />
                    <span>
                      {formatDistanceToNow(new Date(post.createdAt), { 
                        addSuffix: true, 
                        locale: ko 
                      })}
                    </span>
                    {post.viewCount > 0 && (
                      <>
                        <span>·</span>
                        <Eye className="w-3 h-3" />
                        <span>{post.viewCount.toLocaleString()}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreHorizontal className="w-5 h-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onBookmark(post.id)}>
                    <Bookmark className="w-4 h-4 mr-2" />
                    북마크
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onShare(post.id)}>
                    <Share2 className="w-4 h-4 mr-2" />
                    공유
                  </DropdownMenuItem>
                  {!isAuthor && (
                    <DropdownMenuItem onClick={() => onReport(post.id)} className="text-red-600">
                      <Flag className="w-4 h-4 mr-2" />
                      신고
                    </DropdownMenuItem>
                  )}
                  {isAuthor && onDelete && (
                    <DropdownMenuItem onClick={() => onDelete(post.id)} className="text-red-600">
                      삭제
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Category & Tags */}
            <div className="flex items-center gap-2 mt-3">
              {post.category && (
                <Badge variant="secondary">
                  {post.category === 'match' && <Trophy className="w-3 h-3 mr-1" />}
                  {post.category}
                </Badge>
              )}
              {post.isPinned && (
                <Badge className="bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300">
                  📌 고정
                </Badge>
              )}
              {post.isNotice && (
                <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                  📢 공지
                </Badge>
              )}
              {post.tags?.map(tag => (
                <Badge key={tag} variant="outline" className="text-xs">
                  #{tag}
                </Badge>
              ))}
            </div>
          </div>

          {/* Post Content */}
          <div className="px-4 pb-3">
            {post.title && (
              <h3 className="text-lg font-bold mb-2 text-gray-900 dark:text-white">
                {post.title}
              </h3>
            )}
            <div className="text-gray-700 dark:text-gray-300">
              <p className="whitespace-pre-wrap">
                {isExpanded ? post.content : contentPreview}
              </p>
              {post.content.length > 300 && (
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium mt-2 flex items-center gap-1"
                >
                  {isExpanded ? (
                    <>
                      접기 <ChevronUp className="w-4 h-4" />
                    </>
                  ) : (
                    <>
                      더보기 <ChevronDown className="w-4 h-4" />
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Media Content */}
          {hasImages && (
            <div className="relative">
              <div className="relative aspect-video bg-gray-100 dark:bg-gray-900">
                <Image
                  src={post.imageUrls![imageIndex]}
                  alt={`Post image ${imageIndex + 1}`}
                  fill
                  className="object-cover"
                />
                
                {hasMultipleImages && (
                  <>
                    <button
                      onClick={() => setImageIndex(Math.max(0, imageIndex - 1))}
                      className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
                      disabled={imageIndex === 0}
                    >
                      <ChevronUp className="w-5 h-5 rotate-90" />
                    </button>
                    <button
                      onClick={() => setImageIndex(Math.min(post.imageUrls!.length - 1, imageIndex + 1))}
                      className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
                      disabled={imageIndex === post.imageUrls!.length - 1}
                    >
                      <ChevronDown className="w-5 h-5 rotate-90" />
                    </button>
                    
                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                      {post.imageUrls!.map((_, idx) => (
                        <button
                          key={idx}
                          onClick={() => setImageIndex(idx)}
                          className={cn(
                            "w-2 h-2 rounded-full transition-all",
                            idx === imageIndex 
                              ? "bg-white w-6" 
                              : "bg-white/50 hover:bg-white/70"
                          )}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Poll */}
          {poll && (
            <div className="px-4 pb-3">
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <p className="font-semibold mb-3 text-gray-900 dark:text-white">
                  {poll.question}
                </p>
                <div className="space-y-2">
                  {poll.options.map((option: string, index: number) => {
                    const votes = poll.votes?.[index] || 0
                    const percentage = totalVotes > 0 ? (votes / totalVotes) * 100 : 0
                    const isVoted = votedOption === index

                    return (
                      <button
                        key={index}
                        onClick={() => handleVote(index)}
                        disabled={votedOption !== null}
                        className="w-full text-left relative overflow-hidden rounded-lg border border-gray-200 dark:border-gray-600 p-3 transition-all hover:border-blue-400"
                      >
                        <div className="relative z-10 flex items-center justify-between">
                          <span className={cn(
                            "font-medium",
                            isVoted && "text-blue-600 dark:text-blue-400"
                          )}>
                            {option}
                          </span>
                          {votedOption !== null && (
                            <span className="text-sm font-semibold">
                              {percentage.toFixed(1)}%
                            </span>
                          )}
                        </div>
                        {votedOption !== null && (
                          <div 
                            className="absolute inset-0 bg-blue-100 dark:bg-blue-900 opacity-30"
                            style={{ width: `${percentage}%` }}
                          />
                        )}
                      </button>
                    )
                  })}
                </div>
                {votedOption !== null && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                    총 {totalVotes.toLocaleString()}명 참여
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Reactions Bar */}
          {post.reactions && Object.values(post.reactions).some(v => v > 0) && (
            <div className="px-4 pb-2">
              <div className="flex items-center gap-2">
                {Object.entries(post.reactions).map(([key, count]) => {
                  if (!count || count === 0) return null
                  const reaction = reactionIcons[key as keyof PostReactions]
                  return (
                    <div
                      key={key}
                      className="flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-full"
                    >
                      <span className={reaction.color}>{reaction.icon}</span>
                      <span className="text-xs font-medium">{count}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Action Bar */}
          <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                {/* Reaction Button */}
                <div className="relative">
                  <Button
                    variant="ghost"
                    size="sm"
                    onMouseEnter={() => setShowReactions(true)}
                    onMouseLeave={() => setTimeout(() => setShowReactions(false), 300)}
                    onClick={() => onLike(post.id)}
                    className={cn(
                      selectedReaction && reactionIcons[selectedReaction].color
                    )}
                  >
                    {selectedReaction ? (
                      <>
                        {reactionIcons[selectedReaction].icon}
                        <span className="ml-1">{reactionIcons[selectedReaction].label}</span>
                      </>
                    ) : (
                      <>
                        <Heart className="w-4 h-4 mr-1" />
                        좋아요
                      </>
                    )}
                    {post.likeCount > 0 && (
                      <span className="ml-1">{post.likeCount}</span>
                    )}
                  </Button>

                  {/* Reaction Picker */}
                  <AnimatePresence>
                    {showReactions && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.9 }}
                        className="absolute bottom-full left-0 mb-2 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-2 flex gap-2 z-50"
                        onMouseEnter={() => setShowReactions(true)}
                        onMouseLeave={() => setShowReactions(false)}
                      >
                        {Object.entries(reactionIcons).map(([key, reaction]) => (
                          <button
                            key={key}
                            onClick={() => handleReaction(key as keyof PostReactions)}
                            className={cn(
                              "p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors",
                              reaction.color
                            )}
                            title={reaction.label}
                          >
                            {reaction.icon}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Comment Button */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onComment(post.id)}
                >
                  <MessageSquare className="w-4 h-4 mr-1" />
                  댓글
                  {post.commentCount > 0 && (
                    <span className="ml-1">{post.commentCount}</span>
                  )}
                </Button>

                {/* Share Button */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onShare(post.id)}
                >
                  <Share2 className="w-4 h-4 mr-1" />
                  공유
                </Button>
              </div>

              {/* Bookmark */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onBookmark(post.id)}
                className={cn(
                  post.isBookmarked && "text-yellow-600"
                )}
              >
                <Bookmark className={cn(
                  "w-4 h-4",
                  post.isBookmarked && "fill-current"
                )} />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}