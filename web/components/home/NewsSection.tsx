'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Newspaper, TrendingUp, Clock, ExternalLink, Star, Filter } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'

interface NewsArticle {
  id: string
  title: string
  description: string
  url: string
  source: string
  publishedAt: string
  category: string
  imageUrl?: string
  trustScore?: number
}

interface NewsSectionProps {
  className?: string
}

// 샘플 뉴스 데이터
const SAMPLE_NEWS: NewsArticle[] = [
  {
    id: '1',
    title: '손흥민, 토트넘 복귀전에서 2골 1도움 맹활약',
    description: '부상에서 복귀한 손흥민이 첼시전에서 환상적인 활약을 펼치며 팀의 4-1 대승을 이끌었다.',
    url: '#',
    source: 'Sky Sports',
    publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    category: 'general',
    imageUrl: 'https://resources.premierleague.com/photos/2024/01/15/spurs-son.jpg',
    trustScore: 95
  },
  {
    id: '2',
    title: '레알 마드리드, 음바페 영입 임박... 이적료 1억 5천만 유로',
    description: 'PSG의 킬리안 음바페가 마침내 레알 마드리드로 이적할 것으로 보인다. 양 클럽은 이적료 협상 막바지 단계.',
    url: '#',
    source: 'Marca',
    publishedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    category: 'transfer',
    trustScore: 85
  },
  {
    id: '3',
    title: '맨시티 홀란드, 햄스트링 부상으로 3주 결장',
    description: '엘링 홀란드가 훈련 중 입은 햄스트링 부상으로 최소 3주간 결장할 것으로 예상된다.',
    url: '#',
    source: 'BBC Sport',
    publishedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    category: 'injury',
    trustScore: 90
  },
  {
    id: '4',
    title: '바르셀로나, 차비 감독 경질 검토... 후임에 클롭 거론',
    description: '부진한 성적으로 차비 감독의 경질설이 나오는 가운데, 위르겐 클롭이 유력한 후임으로 거론되고 있다.',
    url: '#',
    source: 'Sport',
    publishedAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
    category: 'general',
    trustScore: 70
  },
  {
    id: '5',
    title: '첼시, 오시멘 영입 위해 1억 2천만 파운드 준비',
    description: '첼시가 나폴리의 빅터 오시멘 영입을 위해 클럽 역대 최고 이적료를 준비하고 있다.',
    url: '#',
    source: 'Telegraph',
    publishedAt: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(),
    category: 'transfer',
    trustScore: 75
  }
]

export function NewsSection({ className }: NewsSectionProps) {
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'general' | 'transfer' | 'injury'>('all')
  const [news, setNews] = useState<NewsArticle[]>(SAMPLE_NEWS)
  const [isLoading, setIsLoading] = useState(false)

  // 카테고리별 필터링
  const filteredNews = selectedCategory === 'all' 
    ? news 
    : news.filter(article => article.category === selectedCategory)

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
          ) : (
            <div className="space-y-3">
              {filteredNews.slice(0, 5).map((article) => (
                <a
                  key={article.id}
                  href={article.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block p-4 rounded-lg bg-secondary/50 hover:bg-secondary transition-all group"
                >
                  <div className="flex gap-4">
                    {/* 이미지 */}
                    {article.imageUrl && (
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
                          {article.title}
                        </h4>
                        <ExternalLink className="w-4 h-4 text-muted-foreground shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>

                      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                        {article.description}
                      </p>

                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="font-medium">{article.source}</span>
                        {article.trustScore && (
                          <div className="flex items-center gap-1">
                            <Star className={cn("w-3 h-3", getTrustColor(article.trustScore))} />
                            <span className={getTrustColor(article.trustScore)}>
                              {article.trustScore}%
                            </span>
                          </div>
                        )}
                        <Badge variant="outline" className="text-xs">
                          {article.category === 'transfer' && '이적'}
                          {article.category === 'injury' && '부상'}
                          {article.category === 'general' && '일반'}
                        </Badge>
                        <span className="ml-auto flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDistanceToNow(new Date(article.publishedAt), { 
                            addSuffix: true, 
                            locale: ko 
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* 뉴스 트렌드 */}
      <div className="mt-4 p-3 rounded-lg bg-primary/10 border border-primary/20">
        <div className="flex items-center gap-2 mb-2">
          <TrendingUp className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium">실시간 트렌드</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {['손흥민', '음바페', '홀란드', '첼시', '레알 마드리드'].map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs">
              #{tag}
            </Badge>
          ))}
        </div>
      </div>
    </Card>
  )
}