'use client'

import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { ArrowLeft, ExternalLink, Clock, Shield, Calendar, User, Tag, Share2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'
import { useNews } from '@/lib/supabase/news'
import Image from 'next/image'

export default function NewsDetailPage() {
  const params = useParams()
  const router = useRouter()
  const newsId = params.id as string
  const { data: newsData } = useNews({ category: 'all' })
  const [article, setArticle] = useState<any>(null)

  useEffect(() => {
    // 뉴스 데이터에서 해당 ID의 기사 찾기
    if (newsData?.articles) {
      const foundArticle = newsData.articles.find(a => a.id === newsId)
      if (foundArticle) {
        setArticle(foundArticle)
      }
    }

    // URL 형식이면 외부 링크로 이동
    if (newsId && newsId.startsWith('http')) {
      window.location.href = decodeURIComponent(newsId)
    }
  }, [newsId, newsData])

  if (!article) {
    return (
      <div className="min-h-screen">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">뉴스 불러오는 중...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <div className="bg-background border-b">
        <div className="container mx-auto px-4 py-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            뒤로가기
          </Button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card className="p-6 md:p-8">
          {/* 헤더 정보 */}
          <div className="flex items-center gap-3 mb-4">
            <Badge variant={article.category === 'transfer' ? 'default' : article.category === 'injury' ? 'destructive' : 'secondary'}>
              {article.category === 'transfer' ? '이적시장' : article.category === 'injury' ? '부상' : '뉴스'}
            </Badge>
            <span className="text-sm text-muted-foreground">{article.source}</span>
            {article.trustScore && (
              <div className="flex items-center gap-1">
                <Shield className="w-4 h-4 text-green-500" />
                <span className="text-sm text-green-500">{article.trustScore}/10</span>
              </div>
            )}
          </div>

          {/* 제목 */}
          <h1 className="text-2xl md:text-4xl font-bold mb-4">{article.title}</h1>

          {/* 메타 정보 */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-6">
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <span>
                {formatDistanceToNow(new Date(article.publishedAt), {
                  addSuffix: true,
                  locale: ko
                })}
              </span>
            </div>
          </div>

          <Separator className="mb-6" />

          {/* 이미지 */}
          {article.imageUrl && (
            <div className="mb-6">
              <Image
                src={article.imageUrl}
                alt={article.title}
                width={800}
                height={450}
                className="w-full rounded-lg object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none'
                }}
              />
            </div>
          )}

          {/* 본문 */}
          <div className="prose prose-lg dark:prose-invert max-w-none">
            <p className="text-lg leading-relaxed mb-6">{article.description}</p>
            
            {/* 실제 뉴스 본문이 있다면 여기에 표시 */}
            <div className="bg-muted/50 rounded-lg p-6 mt-8">
              <p className="text-sm text-muted-foreground mb-4">
                이 뉴스는 외부 소스에서 제공된 요약본입니다. 
                전체 기사를 읽으려면 원본 링크를 방문하세요.
              </p>
              
              {article.url && (
                <Button 
                  variant="outline" 
                  className="w-full sm:w-auto"
                  onClick={() => window.open(article.url, '_blank')}
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  원본 기사 보기
                </Button>
              )}
            </div>
          </div>

          {/* 공유 버튼 */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                navigator.clipboard.writeText(window.location.href)
                alert('링크가 복사되었습니다!')
              }}
            >
              <Share2 className="w-4 h-4 mr-2" />
              공유하기
            </Button>
          </div>
        </Card>

        {/* 관련 뉴스 */}
        {newsData?.articles && newsData.articles.length > 1 && (
          <div className="mt-8">
            <h2 className="text-xl font-bold mb-4">다른 뉴스</h2>
            <div className="grid gap-4">
              {newsData.articles
                .filter(a => a.id !== newsId)
                .slice(0, 3)
                .map(relatedArticle => (
                  <Card 
                    key={relatedArticle.id} 
                    className="p-4 hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => router.push(`/news/${relatedArticle.id}`)}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="font-semibold mb-1 line-clamp-2">{relatedArticle.title}</h3>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          <span>{relatedArticle.source}</span>
                          <span>
                            {formatDistanceToNow(new Date(relatedArticle.publishedAt), {
                              addSuffix: true,
                              locale: ko
                            })}
                          </span>
                        </div>
                      </div>
                      {relatedArticle.imageUrl && (
                        <Image
                          src={relatedArticle.imageUrl}
                          alt=""
                          width={80}
                          height={60}
                          className="rounded object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none'
                          }}
                        />
                      )}
                    </div>
                  </Card>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}