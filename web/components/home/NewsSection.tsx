'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Newspaper, TrendingUp, Clock, ExternalLink, Star, Filter, Shield } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'
import { usePersonalizedNews } from '@/lib/supabase/cached-news'

interface NewsSectionProps {
  className?: string
}

export function NewsSection({ className }: NewsSectionProps) {
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'general' | 'transfer' | 'injury'>('all')
  
  // 실제 뉴스 데이터 가져오기
  const { data, isLoading, error } = usePersonalizedNews({
    category: selectedCategory === 'all' ? undefined : selectedCategory,
    limit: 10
  })

  const articles = (data as any)?.articles || []
  
  // 번역된 제목/설명 우선 사용
  const getLocalizedContent = (article: any) => {
    return {
      title: article.translations?.ko?.title || article.title,
      description: article.translations?.ko?.description || article.description
    }
  }

  // 신뢰도 점수에 따른 색상
  const getTrustColor = (score?: number) => {
    if (!score) return 'text-gray-500'
    if (score >= 90) return 'text-green-500'
    if (score >= 70) return 'text-yellow-500'
    return 'text-red-500'
  }

  return (
    <Card className={cn("dark-card p-6", className)}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Newspaper className="w-5 h-5" />
          최신 축구 뉴스
        </h3>
        <Link href="/news" className="text-sm text-primary hover:underline">
          더보기
        </Link>
      </div>

      {/* 카테고리 탭 */}
      <Tabs value={selectedCategory} onValueChange={(value) => setSelectedCategory(value as any)}>
        <TabsList className="grid w-full grid-cols-4 mb-4">
          <TabsTrigger value="all">전체</TabsTrigger>
          <TabsTrigger value="general">일반</TabsTrigger>
          <TabsTrigger value="transfer">이적</TabsTrigger>
          <TabsTrigger value="injury">부상</TabsTrigger>
        </TabsList>

        <TabsContent value={selectedCategory} className="mt-0">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 bg-secondary/50 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>뉴스를 불러오는 중 오류가 발생했습니다.</p>
            </div>
          ) : articles.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>표시할 뉴스가 없습니다.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {articles.slice(0, 5).map((article: any) => {
                const { title, description } = getLocalizedContent(article)
                return (
                  <a
                    key={article.id}
                    href={article.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block p-4 rounded-lg bg-secondary/50 hover:bg-secondary transition-all group"
                  >
                    <div className="flex gap-4">
                      {/* 이미지 */}
                      {article.image_url ? (
                        <div className="w-24 h-24 rounded-lg overflow-hidden bg-secondary shrink-0">
                          <img 
                            src={article.image_url} 
                            alt={title}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none'
                            }}
                          />
                        </div>
                      ) : (
                        <div className="w-24 h-24 rounded-lg overflow-hidden bg-secondary shrink-0">
                          <div className="w-full h-full bg-gradient-to-br from-primary/20 to-transparent flex items-center justify-center">
                            <Newspaper className="w-8 h-8 text-muted-foreground" />
                          </div>
                        </div>
                      )}

                      {/* 콘텐츠 */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h4 className="font-medium line-clamp-2 group-hover:text-primary transition-colors">
                            {title}
                          </h4>
                          <ExternalLink className="w-4 h-4 text-muted-foreground shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>

                        {description && (
                          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                            {description}
                          </p>
                        )}

                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="font-medium">{article.source}</span>
                          {article.trust_score >= 80 && (
                            <div className="flex items-center gap-1">
                              <Shield className={cn("w-3 h-3", getTrustColor(article.trust_score))} />
                              <span className={getTrustColor(article.trust_score)}>
                                {article.trust_score}%
                              </span>
                            </div>
                          )}
                          {article.translations && Object.keys(article.translations).length > 0 && (
                            <Badge variant="secondary" className="text-xs">
                              번역됨
                            </Badge>
                          )}
                          <Badge variant="outline" className="text-xs">
                            {article.category === 'transfer' && '이적'}
                            {article.category === 'injury' && '부상'}
                            {article.category === 'general' && '일반'}
                          </Badge>
                          <span className="ml-auto flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {article.published_at && formatDistanceToNow(new Date(article.published_at), { 
                              addSuffix: true, 
                              locale: ko 
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </a>
                )
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* 뉴스 트렌드 - 실제 데이터 기반 */}
      {articles.length > 0 && (
        <div className="mt-4 p-3 rounded-lg bg-primary/10 border border-primary/20">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">최신 뉴스 소스</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {Array.from(new Set(articles.slice(0, 10).map((a: any) => a.source)))
              .filter(Boolean)
              .slice(0, 5)
              .map((source: any) => (
                <Badge key={source} variant="secondary" className="text-xs">
                  {source}
                </Badge>
              ))}
          </div>
        </div>
      )}
    </Card>
  )
}