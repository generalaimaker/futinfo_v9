'use client'

import Link from 'next/link'
import { Newspaper, Clock, ExternalLink } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'
import { usePersonalizedNews } from '@/lib/supabase/cached-news'

interface NewsSectionProps {
  className?: string
}

export function NewsSection({ className }: NewsSectionProps) {
  // 실제 뉴스 데이터 가져오기 - 전체 카테고리만
  const { data, isLoading, error } = usePersonalizedNews({
    limit: 5 // 홈화면에는 5개만 표시
  })

  const articles = (data as any)?.articles || []
  
  // 번역된 제목 우선 사용
  const getLocalizedTitle = (article: any) => {
    return article.translations?.ko?.title || article.title
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

      {/* 뉴스 리스트 */}
      <div className="space-y-3">
        {isLoading ? (
          <>
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-secondary/50 rounded-lg animate-pulse" />
            ))}
          </>
        ) : error ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>뉴스를 불러오는 중 오류가 발생했습니다.</p>
          </div>
        ) : articles.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>표시할 뉴스가 없습니다.</p>
          </div>
        ) : (
          <>
            {articles.slice(0, 5).map((article: any) => (
                <a
                  key={article.id}
                  href={article.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block p-3 rounded-lg hover:bg-secondary/50 transition-all group"
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h4 className="font-medium text-sm line-clamp-2 group-hover:text-primary transition-colors">
                      {getLocalizedTitle(article)}
                    </h4>
                    <ExternalLink className="w-3 h-3 text-muted-foreground shrink-0 opacity-0 group-hover:opacity-100 transition-opacity mt-0.5" />
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{article.source}</span>
                    <span>•</span>
                    <span>
                      {article.published_at && formatDistanceToNow(new Date(article.published_at), { 
                        addSuffix: true, 
                        locale: ko 
                      })}
                    </span>
                    {article.translations && Object.keys(article.translations).length > 0 && (
                      <Badge variant="secondary" className="text-xs px-1 py-0 ml-auto">
                        KO
                      </Badge>
                    )}
                  </div>
                </a>
            ))}
          </>
        )}
      </div>
    </Card>
  )
}