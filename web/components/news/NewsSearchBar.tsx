'use client'

import { useState, useRef, useEffect } from 'react'
import { Search, X, Loader2, TrendingUp, Clock, Shield } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
// Removed unused imports - these hooks were deleted
import { formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'
import { cn } from '@/lib/utils'

// 인기 검색어
const POPULAR_SEARCHES = [
  'Manchester United transfer',
  'Premier League news',
  'Champions League',
  'Cristiano Ronaldo',
  'Messi Inter Miami',
  'Arsenal signing',
  'Liverpool injury',
  'Real Madrid',
  'Barcelona transfer'
]

interface NewsSearchBarProps {
  onSearch?: (query: string) => void
  className?: string
}

export function NewsSearchBar({ onSearch, className }: NewsSearchBarProps) {
  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  
  // Removed deleted hooks - using local state instead
  const [searchResults, setSearchResults] = useState<any>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [searchHistory, setSearchHistory] = useState<string[]>([])
  
  // 검색 실행
  const handleSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) return
    
    setQuery(searchQuery)
    setShowResults(true)
    setIsOpen(false)
    setIsSearching(true)
    
    // 히스토리 저장 (로컬)
    setSearchHistory(prev => {
      const updated = [searchQuery, ...prev.filter(q => q !== searchQuery)]
      return updated.slice(0, 10) // 최대 10개 저장
    })
    
    // 검색 실행 시뮬레이션 (실제 API 연동 필요시 추가)
    try {
      // TODO: 실제 검색 API 구현 필요
      setSearchResults({
        total: 0,
        articles: []
      })
    } catch (error) {
      console.error('Search error:', error)
    } finally {
      setIsSearching(false)
    }
    
    onSearch?.(searchQuery)
  }
  
  // 빠른 검색
  const handleQuickSearch = (searchQuery: string) => {
    setQuery(searchQuery)
    handleSearch(searchQuery)
  }
  
  // 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])
  
  return (
    <div className={cn("relative", className)}>
      {/* 검색 입력창 */}
      <div className="relative">
        <Input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsOpen(true)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleSearch(query)
            }
          }}
          placeholder="팀, 선수, 이벤트 검색..."
          className="pr-20 pl-10"
        />
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {query && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setQuery('')
                setShowResults(false)
                inputRef.current?.focus()
              }}
              className="h-7 w-7 p-0"
            >
              <X className="w-3 h-3" />
            </Button>
          )}
          <Button
            size="sm"
            onClick={() => handleSearch(query)}
            disabled={!query.trim() || isSearching}
            className="h-7 px-2"
          >
            {isSearching ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              '검색'
            )}
          </Button>
        </div>
      </div>
      
      {/* 검색 제안 드롭다운 */}
      {isOpen && !showResults && (
        <div
          ref={dropdownRef}
          className="absolute top-full mt-2 w-full bg-white dark:bg-gray-900 rounded-lg shadow-lg border z-50 max-h-96 overflow-auto"
        >
          {/* 최근 검색 */}
          {searchHistory.length > 0 && (
            <div className="p-3 border-b">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  최근 검색
                </h4>
              </div>
              <div className="space-y-1">
                {searchHistory.slice(0, 5).map((item, index) => (
                  <button
                    key={index}
                    onClick={() => handleQuickSearch(item)}
                    className="w-full text-left px-2 py-1.5 text-sm rounded hover:bg-muted transition-colors"
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          )}
          
          {/* 인기 검색어 */}
          <div className="p-3">
            <h4 className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              인기 검색어
            </h4>
            <div className="flex flex-wrap gap-2">
              {POPULAR_SEARCHES.map((item) => (
                <Badge
                  key={item}
                  variant="secondary"
                  className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                  onClick={() => handleQuickSearch(item)}
                >
                  {item}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      )}
      
      {/* 검색 결과 */}
      {showResults && searchResults && (
        <div className="absolute top-full mt-2 w-full bg-white dark:bg-gray-900 rounded-lg shadow-lg border z-50 max-h-[600px] overflow-auto">
          <div className="p-3 border-b sticky top-0 bg-white dark:bg-gray-900">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">
                검색 결과: {searchResults.total}개
              </h3>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setShowResults(false)
                  setQuery('')
                }}
              >
                닫기
              </Button>
            </div>
          </div>
          
          <div className="divide-y">
            {searchResults.articles.map((article: any, index: number) => (
              <a
                key={index}
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block p-4 hover:bg-muted/50 transition-colors"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-medium text-sm line-clamp-2 flex-1">
                      {article.title}
                    </h4>
                    <div className="flex items-center gap-1 text-xs">
                      <Shield className={cn(
                        "w-3 h-3",
                        article.trust_score >= 80 ? "text-green-500" :
                        article.trust_score >= 60 ? "text-yellow-500" :
                        "text-red-500"
                      )} />
                      <span className={cn(
                        article.trust_score >= 80 ? "text-green-500" :
                        article.trust_score >= 60 ? "text-yellow-500" :
                        "text-red-500"
                      )}>
                        {article.trust_score}%
                      </span>
                    </div>
                  </div>
                  
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {article.description}
                  </p>
                  
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>{article.source}</span>
                    <span>•</span>
                    <span>
                      {formatDistanceToNow(new Date(article.published_at), {
                        addSuffix: true,
                        locale: ko
                      })}
                    </span>
                    {article.category && (
                      <>
                        <span>•</span>
                        <Badge variant="outline" className="text-[10px] px-1 py-0">
                          {article.category}
                        </Badge>
                      </>
                    )}
                  </div>
                </div>
              </a>
            ))}
          </div>
          
          {searchResults.articles.length === 0 && (
            <div className="p-8 text-center text-muted-foreground">
              검색 결과가 없습니다
            </div>
          )}
        </div>
      )}
    </div>
  )
}