'use client'

import { useTranslatedNews } from '@/lib/hooks/useTranslatedNews'
import { formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'
import { Clock, Globe, ExternalLink } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { motion } from 'framer-motion'

interface NewsItemCardProps {
  article: any
  index: number
}

export function NewsItemCard({ article, index }: NewsItemCardProps) {
  const { title, description, isTranslating } = useTranslatedNews(article)

  const getCategoryColor = (category?: string) => {
    switch (category) {
      case 'transfer': return 'bg-blue-500'
      case 'injury': return 'bg-red-500'
      case 'match': return 'bg-green-500'
      default: return 'bg-gray-500'
    }
  }

  return (
    <motion.a
      href={article.url}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
      className="group relative flex items-start gap-4 p-4 rounded-2xl bg-gradient-to-r from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 hover:from-gray-50 hover:to-gray-100 dark:hover:from-gray-700 dark:hover:to-gray-800 transition-all duration-300 cursor-pointer"
    >
      <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl bg-gradient-to-b from-green-400 to-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
      
      <div className={`mt-1.5 w-2 h-2 rounded-full ${getCategoryColor(article.category)} ring-4 ring-white dark:ring-gray-800 flex-shrink-0`} />
      
      <div className="flex-1 min-w-0">
        <h4 className="font-semibold text-gray-900 dark:text-white group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors line-clamp-2">
          {isTranslating ? (
            <span className="inline-block animate-pulse bg-gray-200 dark:bg-gray-700 rounded h-5 w-3/4"></span>
          ) : (
            title
          )}
        </h4>
        
        {description && (
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 line-clamp-1">
            {isTranslating ? (
              <span className="inline-block animate-pulse bg-gray-200 dark:bg-gray-700 rounded h-4 w-full"></span>
            ) : (
              description
            )}
          </p>
        )}
        
        <div className="mt-2 flex items-center gap-3 text-xs text-gray-500 dark:text-gray-500">
          {article.source && (
            <div className="flex items-center gap-1">
              <Globe className="w-3 h-3" />
              <span>{article.source}</span>
            </div>
          )}
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>
              {formatDistanceToNow(new Date(article.published_at || article.publishedAt), { 
                addSuffix: true,
                locale: ko 
              })}
            </span>
          </div>
        </div>
      </div>
      
      <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-green-500 transition-colors flex-shrink-0 mt-1" />
    </motion.a>
  )
}