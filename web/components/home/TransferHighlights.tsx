'use client'

import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { ArrowRight, TrendingUp, ChevronRight } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { useTransferHighlights } from '@/lib/hooks/useMajorTransfers'

export function TransferHighlights() {
  const { data: transfers, isLoading } = useTransferHighlights()
  
  if (isLoading) {
    return (
      <Card className="relative overflow-hidden border-0 rounded-3xl shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-br from-green-50 via-white to-emerald-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 opacity-50" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-green-100/20 via-transparent to-transparent dark:from-green-900/10" />
        
        <div className="relative">
          <div className="px-4 py-3 flex items-center gap-2 border-b border-gray-200/50 dark:border-gray-700/50">
            <div className="p-1.5 bg-green-500/10 rounded-lg">
              <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold">이적 하이라이트</h2>
              <p className="text-xs text-muted-foreground">25/26 시즌</p>
            </div>
          </div>
          <div className="px-4 py-3">
            <div className="space-y-2">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="p-3 animate-pulse rounded-lg bg-white/50 dark:bg-gray-800/50">
                  <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>
    )
  }
  
  // 데이터가 없을 때
  if (!transfers || transfers.length === 0) {
    return null // 이적 데이터가 없으면 섹션 자체를 표시하지 않음
  }
  
  return (
    <Card className="relative overflow-hidden border-0 rounded-3xl shadow-2xl">
      {/* 배경 그라디언트 효과 */}
      <div className="absolute inset-0 bg-gradient-to-br from-green-50 via-white to-emerald-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 opacity-50" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-green-100/20 via-transparent to-transparent dark:from-green-900/10" />
      
      <div className="relative flex flex-col">
        {/* Compact Header */}
        <div className="px-4 py-3 flex items-center justify-between border-b border-gray-200/50 dark:border-gray-700/50">
          <div className="flex items-center gap-2">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-green-500 to-emerald-600 blur-xl opacity-40" />
              <div className="relative p-1.5 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-lg">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div>
              <h3 className="text-lg font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                이적 하이라이트
              </h3>
              <p className="text-[10px] text-gray-500 dark:text-gray-400">25/26 시즌 주요 이적</p>
            </div>
          </div>
          
          {/* View All Link */}
          <Link href="/transfers">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-3 py-1.5 rounded-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/80 transition-all shadow-sm flex items-center gap-1 group"
            >
              <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">더보기</span>
              <ChevronRight className="w-3 h-3 text-gray-500 group-hover:translate-x-0.5 transition-transform" />
            </motion.button>
          </Link>
        </div>
        
        {/* Transfer List - Vertical */}
        <div className="px-4 py-3">
          <div className="space-y-2">
            {transfers?.slice(0, 8).map((transfer, index) => (
              <TransferListItem key={transfer.id} transfer={transfer} index={index} />
            ))}
          </div>
        </div>
      </div>
    </Card>
  )
}

// 리스트 형태의 이적 아이템
function TransferListItem({ transfer, index }: { transfer: any, index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.03 }}
      whileHover={{ x: 2 }}
      className="relative group"
    >
      <div className="relative overflow-hidden rounded-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 hover:bg-white dark:hover:bg-gray-800 transition-all shadow-sm hover:shadow-md p-3">
        <div className="flex items-center gap-3">
          {/* Player Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-sm truncate">
                {transfer.playerName}
              </h3>
              {transfer.position && (
                <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-gray-600 dark:text-gray-400">
                  {transfer.position}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-muted-foreground truncate max-w-[80px]">
                {transfer.fromClub.name}
              </span>
              <ArrowRight className="w-2.5 h-2.5 text-gray-400 flex-shrink-0" />
              <span className="font-medium truncate max-w-[80px]">
                {transfer.toClub.name}
              </span>
            </div>
          </div>
          
          {/* Fee */}
          <div className="text-right flex-shrink-0">
            <div className="font-bold text-sm text-green-600 dark:text-green-400">
              {transfer.fee?.text || 'Free'}
            </div>
            <div className="text-[10px] text-muted-foreground">
              {new Date(transfer.transferDate).toLocaleDateString('ko-KR', {
                month: 'numeric',
                day: 'numeric'
              })}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// Grid 형태의 카드 (기존 코드 보존용)
function TransferCard({ transfer, index }: { transfer: any, index: number }) {
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ y: -2 }}
      className="relative group"
    >
      <div className="relative overflow-hidden rounded-2xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 hover:bg-white dark:hover:bg-gray-800 transition-all shadow-sm hover:shadow-md">
      <div className="p-4 space-y-3">
        {/* Player Name & Fee */}
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-sm truncate flex-1 mr-2">
            {transfer.playerName}
          </h3>
          <span className="font-bold text-green-600 dark:text-green-400 text-sm whitespace-nowrap">
            {transfer.fee?.text || 'Free'}
          </span>
        </div>
        
        {/* Clubs with Logos */}
        <div className="flex items-center gap-2">
          {/* From Club */}
          <div className="flex items-center gap-1.5 flex-1">
            {transfer.fromClub.logo && (
              <Image
                src={transfer.fromClub.logo}
                alt={transfer.fromClub.name}
                width={20}
                height={20}
                className="object-contain"
              />
            )}
            <span className="text-xs text-muted-foreground truncate">
              {transfer.fromClub.name}
            </span>
          </div>
          
          {/* Arrow */}
          <ArrowRight className="w-3 h-3 text-gray-400 flex-shrink-0" />
          
          {/* To Club */}
          <div className="flex items-center gap-1.5 flex-1 justify-end">
            <span className="text-xs font-medium truncate">
              {transfer.toClub.name}
            </span>
            {transfer.toClub.logo && (
              <Image
                src={transfer.toClub.logo}
                alt={transfer.toClub.name}
                width={20}
                height={20}
                className="object-contain"
              />
            )}
          </div>
        </div>
      </div>
      </div>
    </motion.div>
  )
}