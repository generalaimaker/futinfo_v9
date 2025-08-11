'use client'

import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeft, Type, Hash, Bold, Italic, List, 
  Image as ImageIcon, Send, Loader2, AlertCircle 
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useSupabase } from '@/lib/supabase/provider'
import { CommunityService } from '@/lib/supabase/community'

export default function WritePage() {
  const router = useRouter()
  const params = useParams()
  const boardId = params.boardId as string
  const { user, supabase } = useSupabase()
  
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 에디터 도구 상태
  const [selectedText, setSelectedText] = useState('')

  const handleSubmit = async () => {
    if (!user) {
      router.push('/auth/login')
      return
    }

    if (!title.trim() || !content.trim()) {
      setError('제목과 내용을 모두 입력해주세요.')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      console.log('Creating post with data:', {
        boardId,
        title: title.trim(),
        content: content.trim(),
        tags: tags.length > 0 ? tags : undefined,
        category: 'general',
        imageUrls: []
      })
      
      // 디버그: supabase 인스턴스 확인
      console.log('[WritePage] Supabase instance exists:', !!supabase)
      console.log('[WritePage] User from context:', user?.id)
      
      // 세션 직접 확인
      const { data: { session } } = await supabase.auth.getSession()
      console.log('[WritePage] Direct session check:', !!session, session?.user?.id)

      const newPost = await CommunityService.createPost({
        boardId,
        title: title.trim(),
        content: content.trim(),
        tags: tags.length > 0 ? tags : undefined,
        category: 'general',
        imageUrls: []
      }, supabase)

      console.log('Post created successfully:', newPost)

      // 게시판으로 리다이렉트
      router.push(`/community/boards/${boardId}`)
    } catch (err) {
      console.error('Error creating post:', err)
      setError(err instanceof Error ? err.message : '게시글 작성에 실패했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddTag = () => {
    const trimmedTag = tagInput.trim()
    if (trimmedTag && !tags.includes(trimmedTag) && tags.length < 5) {
      setTags([...tags, trimmedTag])
      setTagInput('')
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove))
  }

  const insertMarkdown = (before: string, after: string = '') => {
    const textarea = document.querySelector('textarea') as HTMLTextAreaElement
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = content.substring(start, end)
    
    const newText = content.substring(0, start) + 
                   before + selectedText + after + 
                   content.substring(end)
    
    setContent(newText)
    
    // 커서 위치 조정
    setTimeout(() => {
      textarea.focus()
      const newCursorPos = start + before.length + selectedText.length
      textarea.setSelectionRange(newCursorPos, newCursorPos)
    }, 0)
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-12 h-12 text-orange-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">로그인이 필요합니다</h2>
            <p className="text-gray-600 mb-6">
              게시글을 작성하려면 먼저 로그인해주세요.
            </p>
            <Button onClick={() => router.push('/auth/login')} className="w-full">
              로그인하기
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white border-b shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href={`/community/boards/${boardId}`}>
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  게시판으로
                </Button>
              </Link>
              <h1 className="text-xl font-bold">새 글 작성</h1>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                onClick={() => router.back()}
                disabled={isLoading}
              >
                취소
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isLoading || !title.trim() || !content.trim()}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    작성 중...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    게시하기
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* 작성 폼 */}
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <Card className="border-0 shadow-lg">
          <CardContent className="p-6 space-y-6">
            {/* 제목 입력 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                제목
              </label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="제목을 입력하세요"
                className="text-lg font-semibold h-12"
                maxLength={100}
              />
              <p className="text-sm text-gray-500 mt-1 text-right">
                {title.length}/100
              </p>
            </div>

            {/* 내용 입력 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                내용
              </label>
              
              {/* 에디터 툴바 */}
              <div className="border border-b-0 rounded-t-lg bg-gray-50 p-2 flex items-center space-x-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => insertMarkdown('**', '**')}
                  title="굵게"
                >
                  <Bold className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => insertMarkdown('*', '*')}
                  title="기울임"
                >
                  <Italic className="h-4 w-4" />
                </Button>
                <div className="w-px h-6 bg-gray-300 mx-1" />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => insertMarkdown('### ')}
                  title="제목"
                >
                  <Type className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => insertMarkdown('- ')}
                  title="목록"
                >
                  <List className="h-4 w-4" />
                </Button>
                <div className="w-px h-6 bg-gray-300 mx-1" />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => insertMarkdown('![이미지](', ')')}
                  title="이미지"
                >
                  <ImageIcon className="h-4 w-4" />
                </Button>
              </div>
              
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="내용을 입력하세요...

마크다운 문법을 지원합니다:
- **굵은 글씨**
- *기울임 글씨*
- ### 제목
- 목록
- ![이미지](URL)"
                className="w-full min-h-[400px] p-4 border rounded-b-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* 태그 입력 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                태그 (선택사항)
              </label>
              <div className="flex items-center space-x-2 mb-3">
                <div className="relative flex-1">
                  <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        handleAddTag()
                      }
                    }}
                    placeholder="태그 입력 후 Enter"
                    className="pl-8"
                    disabled={tags.length >= 5}
                  />
                </div>
                <Button
                  variant="outline"
                  onClick={handleAddTag}
                  disabled={tags.length >= 5 || !tagInput.trim()}
                >
                  추가
                </Button>
              </div>
              
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="pl-2 pr-1 py-1 cursor-pointer hover:bg-gray-200"
                      onClick={() => handleRemoveTag(tag)}
                    >
                      <Hash className="h-3 w-3 mr-1" />
                      {tag}
                      <button className="ml-2 hover:bg-gray-300 rounded-full p-0.5">
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
              
              <p className="text-sm text-gray-500 mt-2">
                최대 5개까지 추가 가능 ({tags.length}/5)
              </p>
            </div>

            {/* 에러 메시지 */}
            {error && (
              <div className="bg-red-50 text-red-600 p-4 rounded-lg flex items-start space-x-3">
                <AlertCircle className="h-5 w-5 mt-0.5" />
                <p>{error}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 작성 가이드 */}
        <Card className="mt-6 border-0 bg-blue-50">
          <CardContent className="p-6">
            <h3 className="font-semibold text-blue-900 mb-3">작성 가이드</h3>
            <ul className="space-y-2 text-sm text-blue-800">
              <li>• 제목은 내용을 잘 나타낼 수 있도록 명확하게 작성해주세요.</li>
              <li>• 욕설, 비방, 광고 등 부적절한 내용은 삭제될 수 있습니다.</li>
              <li>• 이미지는 URL 형식으로 첨부할 수 있습니다.</li>
              <li>• 태그를 활용하면 다른 사용자들이 글을 찾기 쉬워집니다.</li>
            </ul>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}