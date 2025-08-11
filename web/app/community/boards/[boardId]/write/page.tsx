'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeft, Camera, Hash, X, 
  Image as ImageIcon, Send, Loader2, AlertCircle,
  Smile, MapPin, Users, AtSign, Globe,
  Sparkles, TrendingUp, Heart, ChevronRight, Shield
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useSupabase } from '@/lib/supabase/provider'
import { CommunityService } from '@/lib/supabase/community'
import { PostVisibility } from '@/lib/types/community'
import Image from 'next/image'

export default function WritePage() {
  const router = useRouter()
  const params = useParams()
  const boardId = params.boardId as string
  const { user, supabase } = useSupabase()
  
  const [content, setContent] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [uploadedImages, setUploadedImages] = useState<string[]>([])
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [privacy, setPrivacy] = useState<'public' | 'followers' | 'team'>('public')
  const [canWrite, setCanWrite] = useState<boolean | null>(null)
  const [checkingPermission, setCheckingPermission] = useState(true)
  const [userProfile, setUserProfile] = useState<any>(null)
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  
  // 자주 사용하는 이모지
  const popularEmojis = ['⚽', '🔥', '💪', '🎉', '👏', '❤️', '😍', '🤩', '😎', '🙌', '⭐', '🏆']
  
  // 인기 해시태그
  const popularHashtags = ['승리', '응원', '경기', '골', '팀워크', '챔피언', '레전드', '히어로']
  
  // 팀 게시판 권한 체크
  useEffect(() => {
    checkWritePermission()
  }, [user, boardId])
  
  const checkWritePermission = async () => {
    if (!user) {
      setCanWrite(false)
      setCheckingPermission(false)
      return
    }
    
    try {
      // 프로필 정보 가져오기
      const profile = await CommunityService.getUserProfile(user.id)
      setUserProfile(profile)
      
      // 권한 체크
      const hasPermission = await CommunityService.canWriteToTeamBoard(user.id, boardId)
      setCanWrite(hasPermission)
    } catch (error) {
      console.error('Error checking write permission:', error)
      setCanWrite(false)
    } finally {
      setCheckingPermission(false)
    }
  }

  const handleSubmit = async () => {
    if (!user) {
      router.push('/auth/login')
      return
    }

    if (!content.trim()) {
      setError('내용을 입력해주세요.')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // 첫 줄을 제목으로 사용 (인스타그램 스타일)
      const lines = content.trim().split('\n')
      const title = lines[0].substring(0, 100) || '제목 없음'
      
      console.log('[WritePage] Creating post with boardId:', boardId)
      
      const newPost = await CommunityService.createPost({
        boardId,
        title: title,
        content: content.trim(),
        tags: tags.length > 0 ? tags : undefined,
        category: 'general',
        imageUrls: uploadedImages,
        userId: user.id,
        visibility: privacy === 'team' ? PostVisibility.TEAM_ONLY : PostVisibility.PUBLIC
      }, supabase)

      // 게시판으로 리다이렉트
      router.push(`/community/boards/${boardId}`)
    } catch (err) {
      console.error('Error creating post:', err)
      setError(err instanceof Error ? err.message : '게시글 작성에 실패했습니다.')
    } finally {
      setIsLoading(false)
    }
  }
  
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
        setUploadedImages([...uploadedImages, reader.result as string])
      }
      reader.readAsDataURL(file)
    }
  }
  
  const removeImage = (index: number) => {
    setUploadedImages(uploadedImages.filter((_, i) => i !== index))
    if (uploadedImages.length === 1) {
      setImagePreview(null)
    }
  }
  
  const addEmoji = (emoji: string) => {
    setContent(content + emoji)
    setShowEmojiPicker(false)
    textareaRef.current?.focus()
  }

  const handleAddTag = () => {
    const trimmedTag = tagInput.trim().replace('#', '')
    if (trimmedTag && !tags.includes(trimmedTag) && tags.length < 10) {
      setTags([...tags, trimmedTag])
      setTagInput('')
    }
  }
  
  const addHashtag = (tag: string) => {
    if (!tags.includes(tag) && tags.length < 10) {
      setTags([...tags, tag])
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove))
  }

  // 로딩 중
  if (checkingPermission) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  // 로그인 필요
  if (!user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Card className="max-w-md w-full bg-gray-900 border-gray-800">
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-12 h-12 text-orange-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2 text-white">로그인이 필요합니다</h2>
            <p className="text-gray-400 mb-6">
              게시글을 작성하려면 먼저 로그인해주세요.
            </p>
            <Button onClick={() => router.push('/auth/login')} className="w-full bg-blue-600 hover:bg-blue-700">
              로그인하기
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // 팀 게시판 글쓰기 권한 없음
  if (canWrite === false && boardId.startsWith('team_')) {
    const teamId = parseInt(boardId.replace('team_', ''))
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Card className="max-w-md w-full bg-gray-900 border-gray-800">
          <CardContent className="p-8 text-center">
            <Shield className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2 text-white">팀 팬만 작성 가능합니다</h2>
            <p className="text-gray-400 mb-6">
              이 게시판은 팀 팬으로 등록된 사용자만 글을 작성할 수 있습니다.
              {userProfile?.favoriteTeamId && (
                <span className="block mt-2 text-sm">
                  현재 팬 팀: {userProfile.favoriteTeamName || `팀 #${userProfile.favoriteTeamId}`}
                </span>
              )}
            </p>
            <div className="space-y-3">
              <Button 
                onClick={() => router.push('/profile/setup')} 
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                팬 팀 설정하기
              </Button>
              <Button 
                onClick={() => router.back()} 
                variant="outline"
                className="w-full"
              >
                돌아가기
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black">
      {/* 인스타그램 스타일 헤더 */}
      <header className="bg-black border-b border-gray-800 sticky top-0 z-50">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="text-white hover:text-gray-300"
            >
              <X className="h-6 w-6" />
            </Button>
            
            <h1 className="text-lg font-semibold text-white">새 게시물</h1>
            
            <Button
              onClick={handleSubmit}
              disabled={isLoading || !content.trim()}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-1.5 rounded-lg disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                '공유'
              )}
            </Button>
          </div>
        </div>
      </header>

      {/* 인스타그램 스타일 작성 폼 */}
      <main className="max-w-2xl mx-auto">
        <div className="bg-gray-900 border-b border-gray-800">
          {/* 프로필 섹션 */}
          <div className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
              {user.email?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="flex-1">
              <p className="text-white font-medium">{user.email?.split('@')[0] || 'User'}</p>
              <button className="text-xs text-blue-400 hover:text-blue-300">
                {boardId.startsWith('team_') ? '팀 게시판' : '전체 게시판'}
              </button>
            </div>
          </div>
          
          {/* 이미지 업로드 영역 */}
          {uploadedImages.length > 0 ? (
            <div className="relative bg-black aspect-square max-h-[600px] overflow-hidden">
              <div className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide">
                {uploadedImages.map((img, index) => (
                  <div key={index} className="relative min-w-full snap-center">
                    <img 
                      src={img} 
                      alt={`Upload ${index + 1}`}
                      className="w-full h-full object-contain"
                    />
                    <button
                      onClick={() => removeImage(index)}
                      className="absolute top-2 right-2 bg-black/50 rounded-full p-1.5 hover:bg-black/70"
                    >
                      <X className="h-4 w-4 text-white" />
                    </button>
                  </div>
                ))}
              </div>
              {uploadedImages.length > 1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1">
                  {uploadedImages.map((_, index) => (
                    <div 
                      key={index}
                      className="w-1.5 h-1.5 bg-white/50 rounded-full"
                    />
                  ))}
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full aspect-square max-h-[400px] bg-gradient-to-br from-gray-800 to-gray-900 flex flex-col items-center justify-center hover:from-gray-700 hover:to-gray-800 transition-colors"
            >
              <Camera className="h-16 w-16 text-gray-600 mb-3" />
              <p className="text-gray-500 text-sm">사진을 추가하려면 클릭</p>
            </button>
          )}
          
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />
          
          {/* 텍스트 입력 영역 */}
          <div className="p-4">
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="문구를 작성하거나 @멘션, #해시태그를 추가하세요..."
              className="w-full bg-transparent text-white placeholder-gray-500 resize-none focus:outline-none min-h-[120px]"
              style={{ lineHeight: '1.5' }}
            />
            
            {/* 이모지 선택기 */}
            <div className="mt-4 pb-2 border-b border-gray-800">
              <div className="flex items-center justify-between">
                <div className="flex gap-1">
                  {popularEmojis.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => addEmoji(emoji)}
                      className="p-2 hover:bg-gray-800 rounded-lg transition-colors text-xl"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <Smile className="h-5 w-5 text-gray-400" />
                </button>
              </div>
            </div>
            
            {/* 인기 해시태그 */}
            <div className="mt-4">
              <p className="text-xs text-gray-500 mb-2">인기 태그</p>
              <div className="flex flex-wrap gap-2">
                {popularHashtags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => addHashtag(tag)}
                    className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                      tags.includes(tag)
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                    }`}
                  >
                    #{tag}
                  </button>
                ))}
              </div>
            </div>
            
            {/* 선택된 태그 표시 */}
            {tags.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-800">
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-blue-600/20 text-blue-400 rounded-full text-sm"
                    >
                      #{tag}
                      <button
                        onClick={() => handleRemoveTag(tag)}
                        className="hover:text-white"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          {/* 추가 옵션 */}
          <div className="p-4 border-t border-gray-800">
            <div className="space-y-3">
              <button className="w-full flex items-center justify-between p-3 hover:bg-gray-800 rounded-lg transition-colors">
                <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-gray-400" />
                  <span className="text-gray-300">위치 추가</span>
                </div>
                <ChevronRight className="h-4 w-4 text-gray-500" />
              </button>
              
              <button className="w-full flex items-center justify-between p-3 hover:bg-gray-800 rounded-lg transition-colors">
                <div className="flex items-center gap-3">
                  <Users className="h-5 w-5 text-gray-400" />
                  <span className="text-gray-300">사람 태그</span>
                </div>
                <ChevronRight className="h-4 w-4 text-gray-500" />
              </button>
              
              <button className="w-full flex items-center justify-between p-3 hover:bg-gray-800 rounded-lg transition-colors">
                <div className="flex items-center gap-3">
                  <Globe className="h-5 w-5 text-gray-400" />
                  <span className="text-gray-300">공개 범위</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">
                    {privacy === 'public' ? '전체 공개' : privacy === 'team' ? '팀 멤버만' : '팔로워만'}
                  </span>
                  <ChevronRight className="h-4 w-4 text-gray-500" />
                </div>
              </button>
            </div>
          </div>
        </div>
        
        {/* 에러 메시지 */}
        {error && (
          <div className="m-4 p-4 bg-red-900/20 border border-red-800 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-400 mt-0.5" />
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}