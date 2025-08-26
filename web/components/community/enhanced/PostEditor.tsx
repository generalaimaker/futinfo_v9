'use client'

import { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Send, Image as ImageIcon, Video, Link2, Hash, 
  Smile, MapPin, Users, Calendar, X, Upload,
  Sparkles, Trophy, Heart, Star, Shield, Lock,
  Globe, UserCheck, Bold, Italic, List
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import { PostVisibility, PostCategory } from '@/lib/types/community'
import EmojiPicker from 'emoji-picker-react'

interface PostEditorProps {
  boardId: string
  boardType: 'all' | 'team' | 'matchday'
  teamId?: number
  teamName?: string
  userFanLevel?: number
  onSubmit: (data: PostData) => void
  onCancel?: () => void
}

interface PostData {
  title: string
  content: string
  category: PostCategory
  tags: string[]
  images: File[]
  videos: File[]
  visibility: PostVisibility
  crossPost: boolean
  poll?: {
    question: string
    options: string[]
  }
}

const categories: { value: PostCategory; label: string; icon: React.ReactNode }[] = [
  { value: 'talk', label: '자유토크', icon: <Smile className="w-4 h-4" /> },
  { value: 'match', label: '경기', icon: <Trophy className="w-4 h-4" /> },
  { value: 'transfer', label: '이적', icon: <Users className="w-4 h-4" /> },
  { value: 'news', label: '뉴스', icon: <Calendar className="w-4 h-4" /> },
  { value: 'media', label: '미디어', icon: <Video className="w-4 h-4" /> },
  { value: 'fanzone', label: '팬존', icon: <Heart className="w-4 h-4" /> },
]

export function PostEditor({
  boardId,
  boardType,
  teamId,
  teamName,
  userFanLevel = 0,
  onSubmit,
  onCancel
}: PostEditorProps) {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [category, setCategory] = useState<PostCategory>('talk')
  const [tags, setTags] = useState<string[]>([])
  const [currentTag, setCurrentTag] = useState('')
  const [images, setImages] = useState<File[]>([])
  const [videos, setVideos] = useState<File[]>([])
  const [visibility, setVisibility] = useState<PostVisibility>(PostVisibility.PUBLIC)
  const [crossPost, setCrossPost] = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [activeTab, setActiveTab] = useState<'write' | 'preview'>('write')
  const [isPoll, setIsPoll] = useState(false)
  const [pollQuestion, setPollQuestion] = useState('')
  const [pollOptions, setPollOptions] = useState(['', ''])
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)
  const contentRef = useRef<HTMLTextAreaElement>(null)

  const handleAddTag = () => {
    if (currentTag && !tags.includes(currentTag)) {
      setTags([...tags, currentTag])
      setCurrentTag('')
    }
  }

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag))
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    setImages([...images, ...files])
  }

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    setVideos([...videos, ...files])
  }

  const handleRemoveImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index))
  }

  const handleRemoveVideo = (index: number) => {
    setVideos(videos.filter((_, i) => i !== index))
  }

  const handleEmojiClick = (emojiData: any) => {
    if (contentRef.current) {
      const start = contentRef.current.selectionStart
      const end = contentRef.current.selectionEnd
      const newContent = content.substring(0, start) + emojiData.emoji + content.substring(end)
      setContent(newContent)
      setShowEmojiPicker(false)
    }
  }

  const handlePollOptionChange = (index: number, value: string) => {
    const newOptions = [...pollOptions]
    newOptions[index] = value
    setPollOptions(newOptions)
  }

  const handleAddPollOption = () => {
    if (pollOptions.length < 5) {
      setPollOptions([...pollOptions, ''])
    }
  }

  const handleRemovePollOption = (index: number) => {
    if (pollOptions.length > 2) {
      setPollOptions(pollOptions.filter((_, i) => i !== index))
    }
  }

  const handleSubmit = () => {
    const postData: PostData = {
      title,
      content,
      category,
      tags,
      images,
      videos,
      visibility,
      crossPost,
      ...(isPoll && {
        poll: {
          question: pollQuestion,
          options: pollOptions.filter(opt => opt.trim())
        }
      })
    }
    onSubmit(postData)
  }

  const isValid = title.trim() && content.trim()

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl border-gray-200/50 dark:border-gray-700/50">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                새 게시글 작성
              </h2>
              {teamName && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {teamName} 게시판
                </p>
              )}
            </div>
            {onCancel && (
              <Button variant="ghost" size="icon" onClick={onCancel}>
                <X className="w-5 h-5" />
              </Button>
            )}
          </div>

          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
            <TabsList className="mb-4">
              <TabsTrigger value="write">작성</TabsTrigger>
              <TabsTrigger value="preview">미리보기</TabsTrigger>
            </TabsList>

            <TabsContent value="write" className="space-y-4">
              {/* Category & Visibility */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>카테고리</Label>
                  <Select value={category} onValueChange={(v) => setCategory(v as PostCategory)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          <div className="flex items-center gap-2">
                            {cat.icon}
                            <span>{cat.label}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>공개 범위</Label>
                  <Select value={visibility} onValueChange={(v) => setVisibility(v as PostVisibility)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={PostVisibility.PUBLIC}>
                        <div className="flex items-center gap-2">
                          <Globe className="w-4 h-4" />
                          <span>전체 공개</span>
                        </div>
                      </SelectItem>
                      {boardType === 'team' && (
                        <>
                          <SelectItem value={PostVisibility.TEAM_ONLY}>
                            <div className="flex items-center gap-2">
                              <Shield className="w-4 h-4" />
                              <span>팀 팬만</span>
                            </div>
                          </SelectItem>
                          {userFanLevel >= 2 && (
                            <SelectItem value={PostVisibility.VERIFIED_ONLY}>
                              <div className="flex items-center gap-2">
                                <UserCheck className="w-4 h-4" />
                                <span>인증 팬만</span>
                              </div>
                            </SelectItem>
                          )}
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Title */}
              <div>
                <Label>제목</Label>
                <Input
                  placeholder="제목을 입력하세요"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="text-lg font-semibold"
                />
              </div>

              {/* Content */}
              <div>
                <Label>내용</Label>
                <div className="relative">
                  <Textarea
                    ref={contentRef}
                    placeholder="내용을 입력하세요..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="min-h-[300px] resize-none"
                  />
                  
                  {/* Formatting Toolbar */}
                  <div className="absolute bottom-2 left-2 flex items-center gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    >
                      <Smile className="w-4 h-4" />
                    </Button>
                    <Button type="button" variant="ghost" size="sm">
                      <Bold className="w-4 h-4" />
                    </Button>
                    <Button type="button" variant="ghost" size="sm">
                      <Italic className="w-4 h-4" />
                    </Button>
                    <Button type="button" variant="ghost" size="sm">
                      <List className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* Emoji Picker */}
                  <AnimatePresence>
                    {showEmojiPicker && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="absolute bottom-12 left-0 z-50"
                      >
                        <EmojiPicker onEmojiClick={handleEmojiClick} />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Tags */}
              <div>
                <Label>태그</Label>
                <div className="flex items-center gap-2 mb-2">
                  <Input
                    placeholder="태그 입력 후 Enter"
                    value={currentTag}
                    onChange={(e) => setCurrentTag(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                    className="flex-1"
                  />
                  <Button type="button" onClick={handleAddTag} size="sm">
                    <Hash className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="px-2 py-1">
                      #{tag}
                      <button
                        onClick={() => handleRemoveTag(tag)}
                        className="ml-2 hover:text-red-500"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Media Upload */}
              <div className="space-y-4">
                {/* Images */}
                <div>
                  <Label>이미지</Label>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <ImageIcon className="w-4 h-4 mr-2" />
                      이미지 추가
                    </Button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </div>
                  {images.length > 0 && (
                    <div className="grid grid-cols-4 gap-2 mt-2">
                      {images.map((file, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={URL.createObjectURL(file)}
                            alt={`Upload ${index + 1}`}
                            className="w-full h-24 object-cover rounded-lg"
                          />
                          <button
                            onClick={() => handleRemoveImage(index)}
                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Videos */}
                <div>
                  <Label>동영상</Label>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => videoInputRef.current?.click()}
                    >
                      <Video className="w-4 h-4 mr-2" />
                      동영상 추가
                    </Button>
                    <input
                      ref={videoInputRef}
                      type="file"
                      accept="video/*"
                      multiple
                      onChange={handleVideoUpload}
                      className="hidden"
                    />
                  </div>
                  {videos.length > 0 && (
                    <div className="space-y-2 mt-2">
                      {videos.map((file, index) => (
                        <div key={index} className="flex items-center justify-between bg-gray-100 dark:bg-gray-700 rounded-lg p-2">
                          <span className="text-sm truncate">{file.name}</span>
                          <button
                            onClick={() => handleRemoveVideo(index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Poll */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>투표 추가</Label>
                  <Switch
                    checked={isPoll}
                    onCheckedChange={setIsPoll}
                  />
                </div>
                
                <AnimatePresence>
                  {isPoll && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-3"
                    >
                      <Input
                        placeholder="투표 질문"
                        value={pollQuestion}
                        onChange={(e) => setPollQuestion(e.target.value)}
                      />
                      {pollOptions.map((option, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <Input
                            placeholder={`선택지 ${index + 1}`}
                            value={option}
                            onChange={(e) => handlePollOptionChange(index, e.target.value)}
                          />
                          {pollOptions.length > 2 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemovePollOption(index)}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                      {pollOptions.length < 5 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleAddPollOption}
                        >
                          선택지 추가
                        </Button>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Cross-posting */}
              {boardType === 'team' && (
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        전체 게시판에도 공유
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        더 많은 팬들과 소통하세요
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={crossPost}
                    onCheckedChange={setCrossPost}
                  />
                </div>
              )}
            </TabsContent>

            <TabsContent value="preview">
              <div className="min-h-[400px] p-6 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <div className="mb-4">
                  <Badge>{categories.find(c => c.value === category)?.label}</Badge>
                  {tags.map(tag => (
                    <Badge key={tag} variant="outline" className="ml-2">#{tag}</Badge>
                  ))}
                </div>
                <h3 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
                  {title || '제목을 입력하세요'}
                </h3>
                <div className="prose prose-gray dark:prose-invert max-w-none">
                  <p className="whitespace-pre-wrap">
                    {content || '내용을 입력하세요...'}
                  </p>
                </div>
                
                {images.length > 0 && (
                  <div className="grid grid-cols-3 gap-2 mt-4">
                    {images.map((file, index) => (
                      <img
                        key={index}
                        src={URL.createObjectURL(file)}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                    ))}
                  </div>
                )}

                {isPoll && pollQuestion && (
                  <div className="mt-4 p-4 bg-white dark:bg-gray-800 rounded-lg">
                    <p className="font-semibold mb-3">{pollQuestion}</p>
                    <div className="space-y-2">
                      {pollOptions.filter(opt => opt).map((option, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded-full border-2 border-gray-300" />
                          <span>{option}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>

          {/* Actions */}
          <div className="flex items-center justify-between mt-6 pt-6 border-t">
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              {visibility === PostVisibility.PUBLIC && (
                <>
                  <Globe className="w-4 h-4" />
                  <span>모든 사람이 볼 수 있습니다</span>
                </>
              )}
              {visibility === PostVisibility.TEAM_ONLY && (
                <>
                  <Shield className="w-4 h-4" />
                  <span>팀 팬만 볼 수 있습니다</span>
                </>
              )}
              {visibility === PostVisibility.VERIFIED_ONLY && (
                <>
                  <UserCheck className="w-4 h-4" />
                  <span>인증된 팬만 볼 수 있습니다</span>
                </>
              )}
            </div>

            <div className="flex gap-3">
              {onCancel && (
                <Button variant="outline" onClick={onCancel}>
                  취소
                </Button>
              )}
              <Button
                onClick={handleSubmit}
                disabled={!isValid}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
              >
                <Send className="w-4 h-4 mr-2" />
                게시하기
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  )
}