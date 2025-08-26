'use client'

import { useTranslatedNews } from '@/lib/hooks/useTranslatedNews'
import { formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'
import { Clock, ExternalLink, Globe } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { motion } from 'framer-motion'

interface NewsArticleCardProps {
  article: any
  index: number
  className?: string
}

export function NewsArticleCard({ article, index, className = '' }: NewsArticleCardProps) {
  const { title, description, isTranslating } = useTranslatedNews(article)

  const getCategoryBadge = (category: string) => {
    const categoryMap: Record<string, { label: string; color: string }> = {
      transfer: { label: '이적', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
      injury: { label: '부상', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
      match: { label: '경기', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
      analysis: { label: '분석', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
      general: { label: '일반', color: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400' }
    }
    return categoryMap[category] || categoryMap.general
  }

  const categoryStyle = getCategoryBadge(article.category || 'general')

  return (
    <motion.a
      href={article.url}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className={`block group ${className}`}
    >
      <div className="p-5 rounded-2xl bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm hover:bg-white dark:hover:bg-gray-800 transition-all border border-gray-100 dark:border-gray-700 hover:border-gray-200 dark:hover:border-gray-600 hover:shadow-lg">
        <div className="flex items-start gap-4">
          {article.image_url && (
            <div className="flex-shrink-0">
              <img 
                src={article.image_url} 
                alt={title}
                className="w-24 h-24 object-cover rounded-xl"
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.style.display = 'none'
                }}
              />
            </div>
          )}
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3 mb-2">
              <h3 className="text-lg font-semibold line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                {isTranslating ? (
                  <span className="inline-block animate-pulse bg-gray-200 dark:bg-gray-700 rounded h-6 w-3/4"></span>
                ) : (
                  title
                )}
              </h3>
              <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 flex-shrink-0" />
            </div>
            
            {description && (
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-3 line-clamp-2">
                {isTranslating ? (
                  <span className="inline-block animate-pulse bg-gray-200 dark:bg-gray-700 rounded h-4 w-full"></span>
                ) : (
                  description
                )}
              </p>
            )}
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Badge className={categoryStyle.color}>
                  {categoryStyle.label}
                </Badge>
                
                {article.source && (
                  <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                    <Globe className="w-3 h-3" />
                    <span>{article.source}</span>
                  </div>
                )}
                
                <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                  <Clock className="w-3 h-3" />
                  <span>
                    {formatDistanceToNow(new Date(article.published_at), { 
                      addSuffix: true,
                      locale: ko 
                    })}
                  </span>
                </div>
              </div>
              
              {article.is_featured && (
                <Badge className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
                  추천
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.a>
  )
}