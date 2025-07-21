'use client'

import Link from 'next/link'
import { useNews } from '@/lib/supabase/news'
import { formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'
import { Newspaper, ExternalLink, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function NewsSectionSimple() {
  const { data, isLoading, error } = useNews({ category: 'general' })
  const articles = data?.articles || []

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Newspaper className="w-5 h-5" />
          최신 뉴스
        </h2>
        <Link href="/news">
          <Button variant="ghost" size="sm">
            모두 보기
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </Link>
      </div>
      
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      ) : error ? (
        <p className="text-gray-500 text-center py-4">뉴스를 불러올 수 없습니다.</p>
      ) : articles.length === 0 ? (
        <p className="text-gray-500 text-center py-4">표시할 뉴스가 없습니다.</p>
      ) : (
        <div className="space-y-4">
          {articles.slice(0, 5).map((article) => (
            <div 
              key={article.id}
              className="border-b pb-3 last:border-0 last:pb-0 hover:bg-gray-50 -mx-2 px-2 py-2 rounded cursor-pointer transition-colors"
              onClick={() => {
                if (article.url) {
                  window.open(article.url, '_blank')
                }
              }}
            >
              <h3 className="font-medium text-sm mb-1 line-clamp-2 hover:text-blue-600 transition-colors">
                {article.title}
              </h3>
              <div className="flex items-center gap-3 text-xs text-gray-500">
                <span>{article.source}</span>
                <span>•</span>
                <span>
                  {formatDistanceToNow(new Date(article.publishedAt), { 
                    addSuffix: true,
                    locale: ko 
                  })}
                </span>
                <ExternalLink className="w-3 h-3 ml-auto" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}