'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { TrendingUp, ArrowRight, Zap, Trophy, Star, DollarSign, Calendar, Shield } from 'lucide-react'
import { cn } from '@/lib/utils'
import Image from 'next/image'

export function CompactTransferSlide({ data }: { data: any }) {
  const isTopFees = data.type === 'topFees'
  const transfers = data.transfers || []
  
  // 데이터가 없으면 렌더링하지 않음
  if (!transfers || transfers.length === 0) {
    return null
  }
  
  // 정확히 5개만 표시 (중복 제거 후)
  const uniqueTransfers = transfers.filter((transfer: any, index: number, self: any[]) => {
    return index === self.findIndex(t => 
      t.playerName === transfer.playerName && 
      t.transferDate === transfer.transferDate
    )
  })
  
  const displayTransfers = uniqueTransfers.slice(0, 5)
  
  // 5개 미만이면 빈 슬롯 추가
  while (displayTransfers.length < 5) {
    displayTransfers.push({
      id: `empty-${displayTransfers.length}`,
      playerName: '-',
      fromClub: { name: '-' },
      toClub: { name: '-' },
      fee: { text: '-' },
      transferDate: new Date().toISOString(),
      isEmpty: true
    })
  }
  
  return (
    <div className="absolute inset-0">
      {/* 애플 스타일 그라디언트 배경 */}
      <div className="absolute inset-0">
        {/* 베이스 그라디언트 */}
        <div className={cn(
          "absolute inset-0",
          isTopFees 
            ? "bg-gradient-to-br from-yellow-900/90 via-amber-950/85 to-orange-950/90"
            : "bg-gradient-to-br from-blue-950/90 via-indigo-950/85 to-purple-950/90"
        )} />
        
        {/* 다이나믹 오브 */}
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute top-0 right-0 w-[600px] h-[600px]"
          style={{
            background: isTopFees 
              ? 'radial-gradient(circle, rgba(251,191,36,0.2), transparent 70%)'
              : 'radial-gradient(circle, rgba(99,102,241,0.2), transparent 70%)',
            filter: 'blur(100px)',
          }}
        />
        
        {/* 노이즈 텍스처 */}
        <div 
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          }}
        />
      </div>
      
      {/* 메인 컨텐츠 - 애플 스타일 레이아웃 */}
      <div className="relative h-full flex flex-col justify-center py-2 px-3 sm:py-4 sm:px-8 md:px-12">
        <div className="max-w-5xl mx-auto w-full">
          {/* 헤더 - 애플 스타일 타이포그래피 */}
          <div className="mb-2 sm:mb-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
              className="flex items-center justify-between mb-1 sm:mb-2"
            >
              <div className="flex items-center gap-2 sm:gap-3">
                <div className={cn(
                  "p-1.5 sm:p-2.5 rounded-xl sm:rounded-2xl",
                  isTopFees 
                    ? "bg-gradient-to-br from-yellow-500/20 to-orange-500/20" 
                    : "bg-gradient-to-br from-blue-500/20 to-purple-500/20"
                )}>
                  {isTopFees ? (
                    <Trophy className="w-4 h-4 sm:w-6 sm:h-6 text-yellow-400" />
                  ) : (
                    <Zap className="w-4 h-4 sm:w-6 sm:h-6 text-blue-400" />
                  )}
                </div>
                <h1 className="text-xl sm:text-3xl md:text-4xl font-bold text-white tracking-tight">
                  {isTopFees ? '최고 이적료' : '최신 이적'}
                </h1>
              </div>
              {isTopFees && (
                <p className="text-[10px] sm:text-sm text-white/60 whitespace-nowrap">
                  2025/26 시즌 빅딜 TOP 5
                </p>
              )}
            </motion.div>
          </div>
          
          {/* 이적 리스트 - 애플 스타일 카드 */}
          <div className="space-y-1 sm:space-y-2">
            {displayTransfers.map((transfer: any, index: number) => (
              <motion.div
                key={transfer.id || index}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ 
                  delay: 0.1 + index * 0.08,
                  duration: 0.5,
                  ease: [0.32, 0.72, 0, 1]
                }}
              >
                <motion.div 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="relative group cursor-pointer"
                >
                  {/* 카드 배경 */}
                  <div 
                    className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    style={{
                      background: isTopFees
                        ? 'linear-gradient(135deg, rgba(251,191,36,0.1), rgba(251,146,60,0.05))'
                        : 'linear-gradient(135deg, rgba(96,165,250,0.1), rgba(147,51,234,0.05))',
                      filter: 'blur(20px)',
                    }}
                  />
                  
                  <div 
                    className="relative overflow-hidden rounded-xl sm:rounded-2xl p-2 sm:p-3"
                    style={{
                      background: 'linear-gradient(135deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))',
                      backdropFilter: 'blur(40px) saturate(150%)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      boxShadow: `
                        inset 0 1px 0 0 rgba(255,255,255,0.1),
                        0 20px 40px -8px rgba(0,0,0,0.4),
                        0 8px 16px -4px rgba(0,0,0,0.2)
                      `,
                    }}
                  >
                    <div className="flex items-center gap-2 sm:gap-3">
                      {/* 순위 - 프리미엄 디자인 */}
                      <div className="relative">
                        <motion.div
                          whileHover={{ scale: 1.1 }}
                          className={cn(
                            "w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center",
                            "bg-gradient-to-br backdrop-blur-xl relative overflow-hidden",
                            isTopFees ? (
                              transfer.rank === 1 
                                ? "from-yellow-500/40 to-amber-600/40 shadow-lg shadow-yellow-500/30" 
                                : transfer.rank === 2
                                ? "from-gray-400/20 to-gray-500/20"
                                : transfer.rank === 3
                                ? "from-orange-600/20 to-amber-700/20"
                                : "from-white/10 to-white/5"
                            ) : "from-gray-400/20 to-gray-500/20"
                          )}
                        >
                          {/* 내부 글로우 효과 */}
                          {isTopFees && transfer.rank <= 3 && (
                            <div className="absolute inset-0 bg-gradient-to-t from-transparent via-white/10 to-white/20" />
                          )}
                          {!isTopFees && (
                            <div className="absolute inset-0 bg-gradient-to-t from-transparent via-white/10 to-white/20" />
                          )}
                          <span className={cn(
                            "font-black text-sm sm:text-lg relative z-10",
                            isTopFees ? (
                              transfer.rank === 1 ? "text-yellow-300" : 
                              transfer.rank === 2 ? "text-gray-300" :
                              transfer.rank === 3 ? "text-orange-300" :
                              "text-white/70"
                            ) : "text-gray-300"
                          )}>
                            {transfer.rank || (index + 1)}
                          </span>
                        </motion.div>
                        {isTopFees && transfer.rank === 1 && (
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                            className="absolute -top-1 -right-1"
                          >
                            <Star className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-yellow-400 fill-yellow-400 drop-shadow-glow" />
                          </motion.div>
                        )}
                      </div>
                      
                      {/* 선수 정보 - 프리미엄 타이포그래피 */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <motion.h3 
                            whileHover={{ x: 2 }}
                            className={cn(
                              "font-semibold text-sm sm:text-base truncate",
                              transfer.isEmpty ? "text-white/20" :
                              transfer.rank === 1 ? "text-white" :
                              "text-white/90"
                            )}
                          >
                            {transfer.playerName}
                          </motion.h3>
                          {transfer.position && !transfer.isEmpty && (
                            <motion.span 
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              className="px-1.5 sm:px-2 py-0.5 text-[9px] sm:text-[10px] font-medium rounded-full bg-gradient-to-r from-white/15 to-white/10 text-white/80 backdrop-blur-xl border border-white/10"
                            >
                              {transfer.position}
                            </motion.span>
                          )}
                        </div>
                        {!transfer.isEmpty && (
                          <motion.div 
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 + index * 0.05 }}
                            className="flex items-center gap-1.5 sm:gap-2 mt-1 sm:mt-1.5"
                          >
                            <div className="flex items-center gap-1.5 group/from">
                              {transfer.fromClub.logo && (
                                <motion.div
                                  whileHover={{ scale: 1.2, rotate: 5 }}
                                  className="relative"
                                >
                                  <div className="absolute inset-0 bg-white/20 rounded-full blur-md group-hover/from:bg-white/30 transition-colors" />
                                  <Image 
                                    src={transfer.fromClub.logo}
                                    alt={transfer.fromClub.name}
                                    width={12}
                                    height={12}
                                    className="rounded-full relative z-10 w-3 h-3 sm:w-[14px] sm:h-[14px]"
                                  />
                                </motion.div>
                              )}
                              <span className="text-[10px] sm:text-xs text-white/50 truncate max-w-[60px] sm:max-w-[80px] group-hover/from:text-white/70 transition-colors">
                                {transfer.fromClub.name}
                              </span>
                            </div>
                            <motion.div
                              animate={{ x: [0, 3, 0] }}
                              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                            >
                              <ArrowRight className="w-3 h-3 text-white/40" />
                            </motion.div>
                            <div className="flex items-center gap-1.5 group/to">
                              {transfer.toClub.logo && (
                                <motion.div
                                  whileHover={{ scale: 1.2, rotate: -5 }}
                                  className="relative"
                                >
                                  <div className="absolute inset-0 bg-white/20 rounded-full blur-md group-hover/to:bg-white/30 transition-colors" />
                                  <Image 
                                    src={transfer.toClub.logo}
                                    alt={transfer.toClub.name}
                                    width={12}
                                    height={12}
                                    className="rounded-full relative z-10 w-3 h-3 sm:w-[14px] sm:h-[14px]"
                                  />
                                </motion.div>
                              )}
                              <span className="text-[10px] sm:text-xs text-white/70 font-medium truncate max-w-[60px] sm:max-w-[80px] group-hover/to:text-white/90 transition-colors">
                                {transfer.toClub.name}
                              </span>
                            </div>
                          </motion.div>
                        )}
                      </div>
                      
                      {/* 이적료 - 프리미엄 스타일 */}
                      <div className="text-right">
                        {!transfer.isEmpty && (
                          <motion.div 
                            whileHover={{ scale: 1.05 }}
                            className="relative"
                          >
                            {/* 이적료 글로우 효과 */}
                            {isTopFees && transfer.rank === 1 && (
                              <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/30 to-amber-400/30 blur-xl" />
                            )}
                            <div className="flex items-center gap-1 sm:gap-1.5 relative">
                              <span className={cn(
                                "font-bold text-xs sm:text-base",
                                transfer.isEmpty ? "text-white/20" :
                                isTopFees && transfer.rank === 1 ? "text-transparent bg-gradient-to-r from-yellow-300 via-yellow-400 to-amber-400 bg-clip-text animate-shimmer" :
                                isTopFees ? "text-yellow-400" : "text-white/90"
                              )}>
                                {transfer.fee?.text || 'Free'}
                              </span>
                            </div>
                          </motion.div>
                        )}
                        {!isTopFees && !transfer.isEmpty && (
                          <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="flex items-center gap-0.5 sm:gap-1 mt-0.5 sm:mt-1 justify-end"
                          >
                            <Calendar className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white/30" />
                            <span className="text-[9px] sm:text-[10px] text-white/40">
                              {new Date(transfer.transferDate).toLocaleDateString('ko-KR', {
                                month: 'numeric',
                                day: 'numeric'
                              })}
                            </span>
                          </motion.div>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}