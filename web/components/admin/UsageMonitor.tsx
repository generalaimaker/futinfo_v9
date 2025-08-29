'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Database, HardDrive, Languages, TrendingUp, Activity, 
  RefreshCw, Loader2, AlertCircle, CheckCircle, Clock,
  BarChart3, PieChart, Zap, Globe, Server, Newspaper
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'
import { motion } from 'framer-motion'

interface UsageStats {
  news: {
    total: number
    today: number
    thisMonth: number
    translated: number
    featured: number
  }
  translation: {
    daily: {
      used: number
      limit: number
      remaining: number
    }
    monthly: {
      used: number
      limit: number
      remaining: number
      charactersUsed: number
      charactersLimit: number
      percentUsed: string
    }
  }
  storage: {
    estimatedSizeMB: string
    totalRecords: number
    averageRecordSizeKB: string
  }
  categories: Record<string, number>
  sources: Array<{
    name: string
    count: number
    avgTrustScore: string
  }>
  systemHealth: {
    newsCollector: {
      status: string
      lastRun: string
      nextRun: string
    }
    translator: {
      status: string
      todayUsed: number
      todayLimit: number
    }
    database: {
      status: string
      newsTableSize: string
      totalRecords: number
    }
  }
  growth: Array<{
    date: string
    count: number
  }>
  lastUpdated: string
}

export default function UsageMonitor() {
  const [stats, setStats] = useState<UsageStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStats = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/admin/usage-stats')
      if (!response.ok) throw new Error('Failed to fetch stats')
      const data = await response.json()
      setStats(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
    // 1분마다 자동 새로고침
    const interval = setInterval(fetchStats, 60000)
    return () => clearInterval(interval)
  }, [])

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-gray-500" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <p className="text-red-500">{error}</p>
        <Button onClick={fetchStats} className="mt-4">
          다시 시도
        </Button>
      </div>
    )
  }

  if (!stats) return null

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
      case 'healthy':
      case 'ready':
        return 'text-green-500'
      case 'quota_reached':
        return 'text-yellow-500'
      case 'error':
      case 'unhealthy':
        return 'text-red-500'
      default:
        return 'text-gray-500'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
      case 'healthy':
      case 'ready':
        return <CheckCircle className="w-4 h-4" />
      case 'quota_reached':
        return <AlertCircle className="w-4 h-4" />
      default:
        return <Clock className="w-4 h-4" />
    }
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Activity className="w-7 h-7 text-blue-500" />
          시스템 사용량 모니터링
        </h2>
        <Button
          onClick={fetchStats}
          disabled={loading}
          variant="outline"
          size="sm"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
          ) : (
            <RefreshCw className="w-4 h-4 mr-2" />
          )}
          새로고침
        </Button>
      </div>

      {/* 시스템 상태 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Newspaper className="w-5 h-5 text-green-600" />
              <span className="font-medium">뉴스 수집기</span>
            </div>
            <div className={`flex items-center gap-1 ${getStatusColor(stats.systemHealth.newsCollector.status)}`}>
              {getStatusIcon(stats.systemHealth.newsCollector.status)}
              <span className="text-sm">활성</span>
            </div>
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
            <p>마지막 실행: {formatDistanceToNow(new Date(stats.systemHealth.newsCollector.lastRun), { addSuffix: true, locale: ko })}</p>
            <p>다음 실행: {formatDistanceToNow(new Date(stats.systemHealth.newsCollector.nextRun), { addSuffix: true, locale: ko })}</p>
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Languages className="w-5 h-5 text-purple-600" />
              <span className="font-medium">번역 서비스</span>
            </div>
            <div className={`flex items-center gap-1 ${getStatusColor(stats.systemHealth.translator.status)}`}>
              {getStatusIcon(stats.systemHealth.translator.status)}
              <span className="text-sm">
                {stats.systemHealth.translator.status === 'quota_reached' ? '한도 도달' : '준비'}
              </span>
            </div>
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
            <p>오늘 사용: {stats.systemHealth.translator.todayUsed}/{stats.systemHealth.translator.todayLimit}</p>
            <p>상태: {stats.systemHealth.translator.status === 'quota_reached' ? '일일 한도 도달' : '번역 가능'}</p>
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5 text-blue-600" />
              <span className="font-medium">데이터베이스</span>
            </div>
            <div className={`flex items-center gap-1 ${getStatusColor(stats.systemHealth.database.status)}`}>
              {getStatusIcon(stats.systemHealth.database.status)}
              <span className="text-sm">정상</span>
            </div>
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
            <p>테이블 크기: {stats.systemHealth.database.newsTableSize}</p>
            <p>총 레코드: {stats.systemHealth.database.totalRecords.toLocaleString()}개</p>
          </div>
        </Card>
      </div>

      {/* 주요 통계 */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border"
        >
          <div className="flex items-center justify-between mb-2">
            <Newspaper className="w-5 h-5 text-gray-500" />
            <span className="text-xs text-gray-500">전체</span>
          </div>
          <p className="text-2xl font-bold">{stats.news.total.toLocaleString()}</p>
          <p className="text-xs text-gray-500">총 뉴스</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border"
        >
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="w-5 h-5 text-green-500" />
            <span className="text-xs text-gray-500">오늘</span>
          </div>
          <p className="text-2xl font-bold text-green-600">+{stats.news.today}</p>
          <p className="text-xs text-gray-500">신규 뉴스</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border"
        >
          <div className="flex items-center justify-between mb-2">
            <Languages className="w-5 h-5 text-purple-500" />
            <span className="text-xs text-gray-500">번역</span>
          </div>
          <p className="text-2xl font-bold text-purple-600">{stats.news.translated}</p>
          <p className="text-xs text-gray-500">번역 완료</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border"
        >
          <div className="flex items-center justify-between mb-2">
            <HardDrive className="w-5 h-5 text-blue-500" />
            <span className="text-xs text-gray-500">저장소</span>
          </div>
          <p className="text-2xl font-bold text-blue-600">{stats.storage.estimatedSizeMB}</p>
          <p className="text-xs text-gray-500">MB 사용</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border"
        >
          <div className="flex items-center justify-between mb-2">
            <Zap className="w-5 h-5 text-yellow-500" />
            <span className="text-xs text-gray-500">주요</span>
          </div>
          <p className="text-2xl font-bold text-yellow-600">{stats.news.featured}</p>
          <p className="text-xs text-gray-500">Featured</p>
        </motion.div>
      </div>

      {/* 번역 사용량 */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Languages className="w-5 h-5 text-purple-500" />
          Microsoft Translator 사용량
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 일일 사용량 */}
          <div>
            <h4 className="text-sm font-medium text-gray-600 mb-2">일일 사용량</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">사용</span>
                <span className="text-sm font-bold">{stats.translation.daily.used}/{stats.translation.daily.limit}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full transition-all"
                  style={{ width: `${(stats.translation.daily.used / stats.translation.daily.limit) * 100}%` }}
                />
              </div>
              <p className="text-xs text-gray-500">
                남은 횟수: {stats.translation.daily.remaining}개
              </p>
            </div>
          </div>

          {/* 월간 사용량 */}
          <div>
            <h4 className="text-sm font-medium text-gray-600 mb-2">월간 사용량</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">문자 사용</span>
                <span className="text-sm font-bold">{stats.translation.monthly.percentUsed}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-green-500 to-blue-500 h-2 rounded-full transition-all"
                  style={{ width: `${stats.translation.monthly.percentUsed}%` }}
                />
              </div>
              <p className="text-xs text-gray-500">
                {stats.translation.monthly.charactersUsed.toLocaleString()} / {stats.translation.monthly.charactersLimit.toLocaleString()} 문자
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* 카테고리 분포 & 소스 통계 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 카테고리 분포 */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <PieChart className="w-5 h-5 text-blue-500" />
            카테고리별 분포
          </h3>
          <div className="space-y-2">
            {Object.entries(stats.categories).map(([category, count]) => {
              const total = Object.values(stats.categories).reduce((a, b) => a + b, 0)
              const percentage = ((count / total) * 100).toFixed(1)
              return (
                <div key={category} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500" />
                    <span className="text-sm capitalize">{category}</span>
                  </div>
                  <span className="text-sm text-gray-600">
                    {count} ({percentage}%)
                  </span>
                </div>
              )
            })}
          </div>
        </Card>

        {/* 상위 소스 */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Globe className="w-5 h-5 text-green-500" />
            상위 뉴스 소스
          </h3>
          <div className="space-y-2">
            {stats.sources.map((source, index) => (
              <div key={source.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-gray-500">#{index + 1}</span>
                  <span className="text-sm">{source.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">신뢰도: {source.avgTrustScore}</span>
                  <span className="text-sm font-medium">{source.count}개</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* 성장 추세 */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-indigo-500" />
          최근 7일 뉴스 수집 추세
        </h3>
        <div className="flex items-end justify-between h-32 gap-2">
          {stats.growth.map((day) => {
            const maxCount = Math.max(...stats.growth.map(d => d.count))
            const height = maxCount > 0 ? (day.count / maxCount) * 100 : 0
            return (
              <div key={day.date} className="flex-1 flex flex-col items-center">
                <div className="w-full bg-gray-200 rounded-t relative" style={{ height: '100px' }}>
                  <div 
                    className="absolute bottom-0 w-full bg-gradient-to-t from-indigo-500 to-blue-500 rounded-t transition-all"
                    style={{ height: `${height}%` }}
                  />
                </div>
                <span className="text-xs text-gray-500 mt-1">
                  {new Date(day.date).getDate()}일
                </span>
                <span className="text-xs font-bold">
                  {day.count}
                </span>
              </div>
            )
          })}
        </div>
      </Card>

      {/* 마지막 업데이트 */}
      <div className="text-center text-sm text-gray-500">
        마지막 업데이트: {formatDistanceToNow(new Date(stats.lastUpdated), { addSuffix: true, locale: ko })}
      </div>
    </div>
  )
}