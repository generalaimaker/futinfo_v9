'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  TrendingUp, TrendingDown, Calendar, DollarSign, 
  Users, AlertCircle, Loader2, ArrowRight, Globe, 
  RefreshCw, ChevronLeft, ChevronRight, User
} from 'lucide-react'
import { 
  useFootballTransfers, 
  useFootballTopTransfers,
  useFootballTopMarketValueTransfers,
  useFootballTransfersByLeague 
} from '@/lib/football-api/hooks'
import { FOOTBALL_API_LEAGUE_IDS } from '@/lib/football-api/types'
import { cn } from '@/lib/utils'

export default function TransferPage() {
  const [selectedLeague, setSelectedLeague] = useState<string>('all')
  const [page, setPage] = useState(1)
  
  // Fetch data based on selected tab and league
  const { data: allTransfersData, isLoading: allLoading, error: allError } = useFootballTransfers(page)
  const { data: topTransfersData, isLoading: topLoading } = useFootballTopTransfers(page)
  const { data: marketValueData, isLoading: marketValueLoading } = useFootballTopMarketValueTransfers(page)
  
  // League specific transfers
  const leagueId = selectedLeague !== 'all' ? FOOTBALL_API_LEAGUE_IDS[selectedLeague] : null
  const { data: leagueTransfersData, isLoading: leagueLoading } = useFootballTransfersByLeague(
    leagueId || '', 
    page, 
    !!leagueId
  )
  
  // Use league-specific data if a league is selected, otherwise use all transfers
  const currentData = leagueId ? leagueTransfersData : allTransfersData
  const isLoading = leagueId ? leagueLoading : allLoading
  const transfers = Array.isArray(currentData?.transfers) ? currentData.transfers : []
  
  // No need to load player images anymore
  
  // League options for selector
  const leagueOptions = [
    { id: 'all', name: '전체 리그', icon: '🌍' },
    { id: 'PREMIER_LEAGUE', name: 'Premier League', icon: '🇬🇧' },
    { id: 'LA_LIGA', name: 'La Liga', icon: '🇪🇸' },
    { id: 'SERIE_A', name: 'Serie A', icon: '🇮🇹' },
    { id: 'BUNDESLIGA', name: 'Bundesliga', icon: '🇩🇪' },
    { id: 'LIGUE_1', name: 'Ligue 1', icon: '🇫🇷' },
    { id: 'K_LEAGUE_1', name: 'K League 1', icon: '🇰🇷' },
  ]
  
  // Get transfer clubs
  const getTransferClubs = (transfer: any) => {
    return {
      from: transfer.fromClub || transfer.from?.name || 'Unknown',
      to: transfer.toClub || transfer.to?.name || 'Unknown'
    }
  }
  
  // Format transfer fee with type info
  const formatFee = (transfer: any) => {
    // Check if it's a loan
    if (transfer.onLoan || transfer.fee?.feeText === 'on loan') {
      return { text: '임대', type: 'loan' }
    }
    
    // Check fee object
    if (transfer.fee) {
      const feeText = transfer.fee.feeText?.toLowerCase() || ''
      
      if (feeText.includes('free transfer') || feeText.includes('ablösefrei')) {
        return { text: '무료', type: 'free' }
      }
      
      // Check if there's a value field with actual amount
      if (transfer.fee.value && transfer.fee.value > 0) {
        const million = transfer.fee.value / 1000000
        if (million >= 1) {
          return { text: `€${million.toFixed(1)}M`, type: 'paid' }
        } else {
          return { text: `€${(transfer.fee.value / 1000).toFixed(0)}K`, type: 'paid' }
        }
      }
      
      // If feeText is just "fee" but no value, show as TBD
      if (feeText === 'fee' && !transfer.fee.value) {
        return { text: '미정', type: 'unknown' }
      }
    }
    
    // Legacy fields
    const fee = transfer.transfer_fee || transfer.transferFee
    if (!fee || fee === '0' || fee === '-') {
      return { text: '무료', type: 'free' }
    }
    return { text: fee, type: 'paid' }
  }
  
  // Get fee text color
  const getFeeTextColor = (type: string) => {
    switch (type) {
      case 'paid':
        return 'text-green-500'
      case 'loan':
        return 'text-amber-500'
      case 'free':
        return 'text-blue-500'
      default:
        return 'text-muted-foreground'
    }
  }
  
  // Format date
  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr)
      return date.toLocaleDateString('ko-KR', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      })
    } catch {
      return dateStr
    }
  }
  
  // Get transfer type badge color
  const getTransferTypeBadgeColor = (transfer: any) => {
    // 임대 - 노란색
    if (transfer.onLoan || transfer.fee?.feeText === 'on loan') {
      return 'bg-amber-500' // #F59E0B
    }
    
    // 무료이적 - 파란색
    const feeText = transfer.fee?.feeText?.toLowerCase() || ''
    if (feeText.includes('free') || feeText.includes('ablösefrei')) {
      return 'bg-blue-500' // #3B82F6
    }
    
    // 계약 연장 - 보라색
    if (transfer.contractExtension) {
      return 'bg-purple-500'
    }
    
    // 완전이적 (유료) - 초록색
    if (transfer.fee?.value && transfer.fee.value > 0) {
      return 'bg-green-500' // #22C55E
    }
    
    // Check legacy type field
    const type = transfer.type?.toLowerCase()
    if (type === 'loan') return 'bg-amber-500'
    if (type === 'free') return 'bg-blue-500'
    if (type === 'end of loan') return 'bg-orange-500'
    
    return 'bg-green-500' // 기본값: 완전이적
  }
  
  // Clear cache function
  const clearCache = () => {
    if (typeof window !== 'undefined') {
      const keys = Object.keys(localStorage).filter(key => key.startsWith('football_api_cache_'))
      keys.forEach(key => localStorage.removeItem(key))
      alert(`캐시가 삭제되었습니다. ${keys.length}개 항목 제거됨`)
      window.location.reload()
    }
  }

  if (allError) {
    return (
      <div className="min-h-screen lg:ml-64 p-4 lg:p-6">
        <div className="max-w-7xl mx-auto">
          <Card className="dark-card p-8 text-center">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
            <h2 className="text-xl font-semibold mb-2">오류가 발생했습니다</h2>
            <p className="text-muted-foreground mb-4">{(allError as Error).message}</p>
            <Button onClick={clearCache} variant="outline">
              캐시 삭제 후 새로고침
            </Button>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen lg:ml-64 p-4 lg:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <Globe className="w-8 h-8 text-primary" />
            이적 시장
          </h1>
          <p className="text-muted-foreground">
            최신 이적 정보를 확인하세요
          </p>
        </div>


        {/* Transfer Type Legend */}
        <div className="flex flex-wrap items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span>완전이적</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-amber-500" />
            <span>임대</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500" />
            <span>무료이적</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-purple-500" />
            <span>계약연장</span>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="dark-card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">전체 이적</p>
                <p className="text-2xl font-bold">{currentData?.total || 0}</p>
              </div>
              <Users className="w-8 h-8 text-primary opacity-20" />
            </div>
          </Card>
          <Card className="dark-card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">정규 이적</p>
                <p className="text-2xl font-bold text-green-500">
                  {Array.isArray(transfers) ? transfers.filter(t => t.fee?.value && t.fee.value > 0).length : 0}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-500 opacity-20" />
            </div>
          </Card>
          <Card className="dark-card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">임대 이적</p>
                <p className="text-2xl font-bold text-amber-500">
                  {Array.isArray(transfers) ? transfers.filter(t => t.onLoan === true || t.fee?.feeText === 'on loan').length : 0}
                </p>
              </div>
              <TrendingDown className="w-8 h-8 text-amber-500 opacity-20" />
            </div>
          </Card>
          <Card className="dark-card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">자유 이적</p>
                <p className="text-2xl font-bold text-blue-500">
                  {Array.isArray(transfers) ? transfers.filter(t => t.fee?.feeText?.toLowerCase().includes('free') || (!t.fee?.value && t.fee?.feeText === 'fee')).length : 0}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-blue-500 opacity-20" />
            </div>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="recent" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 gap-2">
            <TabsTrigger value="recent">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>최근 이적</span>
              </div>
            </TabsTrigger>
            <TabsTrigger value="top">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                <span>주요 이적</span>
              </div>
            </TabsTrigger>
            <TabsTrigger value="market-value">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                <span>시장가치 TOP</span>
              </div>
            </TabsTrigger>
          </TabsList>

          {/* Recent Transfers */}
          <TabsContent value="recent" className="space-y-4">
            {/* League Selector */}
            <Card className="dark-card p-4">
              <h3 className="text-sm font-semibold mb-3">리그 선택</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
                {leagueOptions.map((league) => (
                  <button
                    key={league.id}
                    onClick={() => {
                      setSelectedLeague(league.id)
                      setPage(1)
                    }}
                    className={cn(
                      "p-2 rounded-lg border-2 transition-all hover:scale-105 text-center",
                      selectedLeague === league.id
                        ? "border-primary bg-primary/10"
                        : "border-secondary bg-secondary/50 hover:border-primary/50"
                    )}
                  >
                    <div className="text-xl mb-1">{league.icon}</div>
                    <div className="text-xs font-medium">{league.name}</div>
                  </button>
                ))}
              </div>
            </Card>
            
            <Card className="dark-card p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">
                  {selectedLeague === 'all' ? '전체 리그' : leagueOptions.find(l => l.id === selectedLeague)?.name} 최근 이적
                </h3>
                <div className="flex items-center gap-2">
                  <Button onClick={clearCache} variant="outline" size="sm">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    캐시 삭제
                  </Button>
                </div>
              </div>
              
              {isLoading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="w-8 h-8 animate-spin" />
                </div>
              ) : transfers.length === 0 ? (
                <div className="text-center py-20 text-muted-foreground">
                  <Users className="w-12 h-12 mx-auto mb-4" />
                  <p>이적 정보가 없습니다</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {transfers.map((transfer, index) => (
                    <div
                      key={`${transfer.player?.id || transfer.playerId || index}-${index}`}
                      className="group relative overflow-hidden rounded-xl border border-secondary bg-gradient-to-r from-secondary/30 to-secondary/10 hover:from-secondary/50 hover:to-secondary/20 transition-all duration-300"
                    >
                      <div className="p-6">
                        <div className="flex items-center gap-6">
                          {/* Transfer Type Indicator */}
                          <div className={cn(
                            "absolute left-0 top-0 bottom-0 w-1",
                            getTransferTypeBadgeColor(transfer)
                          )} />
                          
                          {/* Player Icon */}
                          <div className="relative">
                            <div className="w-20 h-20 rounded-full overflow-hidden ring-2 ring-white/10 bg-gradient-to-br from-white/20 to-white/5 flex items-center justify-center">
                              <User className="w-10 h-10 text-muted-foreground" />
                            </div>
                            {transfer.position?.label && (
                              <div className="absolute -bottom-1 -right-1 px-2 py-0.5 bg-primary text-primary-foreground text-xs font-medium rounded-full">
                                {transfer.position.label}
                              </div>
                            )}
                          </div>
                          
                          {/* Transfer Details */}
                          <div className="flex-1">
                            <h4 className="text-lg font-semibold mb-2">{transfer.name || transfer.player?.name || 'Unknown Player'}</h4>
                            
                            {/* Club Transfer */}
                            <div className="flex items-center gap-3 mb-3">
                              {(() => {
                                const { from, to } = getTransferClubs(transfer)
                                return (
                                  <>
                                    <div className="flex items-center gap-2">
                                      <span className="text-sm font-medium">{from}</span>
                                    </div>
                                    <ArrowRight className="w-5 h-5 text-primary" />
                                    <div className="flex items-center gap-2">
                                      <span className="text-sm font-medium">{to}</span>
                                    </div>
                                  </>
                                )
                              })()}
                            </div>
                            
                            {/* Market Value */}
                            {transfer.marketValue && (
                              <div className="text-xs text-muted-foreground">
                                시장가치: €{(transfer.marketValue / 1000000).toFixed(1)}M
                              </div>
                            )}
                          </div>
                          
                          {/* Transfer Fee */}
                          <div className="text-right">
                            {(() => {
                              const fee = formatFee(transfer)
                              return (
                                <div className={cn("text-2xl font-bold mb-1", getFeeTextColor(fee.type))}>
                                  {fee.text}
                                </div>
                              )
                            })()}
                            <div className="text-xs text-muted-foreground">
                              {formatDate(transfer.transferDate || transfer.date)}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Pagination */}
              {currentData && currentData.pagination && (
                <div className="flex items-center justify-center gap-4 mt-6">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    페이지 {currentData.pagination.current} / {currentData.pagination.total}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(page + 1)}
                    disabled={page >= currentData.pagination.total}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </Card>
          </TabsContent>

          {/* Top Transfers */}
          <TabsContent value="top" className="space-y-4">
            <Card className="dark-card p-6">
              <h3 className="text-lg font-semibold mb-4">전 세계 주요 이적</h3>
              
              {topLoading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="w-8 h-8 animate-spin" />
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-6">
                  {(topTransfersData?.transfers || []).slice(0, 10).map((transfer, index) => (
                    <div
                      key={`${transfer.player?.id || transfer.playerId || index}-${index}`}
                      className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-primary/20 via-primary/10 to-transparent border border-primary/30 hover:border-primary/50 transition-all duration-300"
                    >
                      <div className="p-6">
                        <div className="flex items-start gap-5">
                          <div className="relative">
                            <div className="w-24 h-24 rounded-2xl overflow-hidden ring-2 ring-primary/30 bg-gradient-to-br from-white/20 to-white/5 flex items-center justify-center">
                              <User className="w-12 h-12 text-muted-foreground" />
                            </div>
                            <div className="absolute -top-3 -right-3 w-10 h-10 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center text-primary-foreground font-bold shadow-lg">
                              {index + 1}
                            </div>
                          </div>
                          <div className="flex-1">
                            <h4 className="text-xl font-bold mb-1">{transfer.name || transfer.player?.name || 'Unknown Player'}</h4>
                            {transfer.position?.label && (
                              <Badge variant="outline" className="mb-3">
                                {transfer.position.label}
                              </Badge>
                            )}
                            
                            <div className="space-y-2">
                              <div className="flex items-center gap-2 text-sm">
                                {(() => {
                                  const { from, to } = getTransferClubs(transfer)
                                  return (
                                    <>
                                      <span className="font-medium">{from}</span>
                                      <ArrowRight className="w-4 h-4 text-primary" />
                                      <span className="font-medium">{to}</span>
                                    </>
                                  )
                                })()}
                              </div>
                              
                              <div className="flex items-center justify-between pt-3 border-t border-white/10">
                                {(() => {
                                  const fee = formatFee(transfer)
                                  return (
                                    <div className={cn("text-2xl font-bold", getFeeTextColor(fee.type))}>
                                      {fee.text}
                                    </div>
                                  )
                                })()}
                                <div className="text-xs text-muted-foreground">
                                  {formatDate(transfer.transferDate || transfer.date)}
                                </div>
                              </div>
                              
                              {transfer.marketValue && (
                                <div className="text-xs text-muted-foreground">
                                  시장가치: €{(transfer.marketValue / 1000000).toFixed(1)}M
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </TabsContent>

          {/* Market Value Top */}
          <TabsContent value="market-value" className="space-y-4">
            <Card className="dark-card p-6">
              <h3 className="text-lg font-semibold mb-4">전 세계 시장가치 TOP 이적</h3>
              
              {marketValueLoading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="w-8 h-8 animate-spin" />
                </div>
              ) : (
                <div className="space-y-4">
                  {(marketValueData?.transfers || []).map((transfer, index) => (
                    <div
                      key={`${transfer.player?.id || transfer.playerId || index}-${index}`}
                      className="group relative overflow-hidden rounded-xl border border-secondary bg-gradient-to-r from-secondary/30 to-secondary/10 hover:from-secondary/50 hover:to-secondary/20 transition-all duration-300"
                    >
                      <div className="p-5">
                        <div className="flex items-center gap-5">
                          {/* Ranking */}
                          <div className="flex-shrink-0">
                            <div className="w-14 h-14 bg-gradient-to-br from-primary to-primary/70 rounded-2xl flex items-center justify-center text-2xl font-bold text-primary-foreground shadow-lg">
                              {index + 1}
                            </div>
                          </div>
                          
                          {/* Player Icon */}
                          <div className="relative">
                            <div className="w-16 h-16 rounded-xl overflow-hidden ring-2 ring-white/10 bg-gradient-to-br from-white/20 to-white/5 flex items-center justify-center">
                              <User className="w-8 h-8 text-muted-foreground" />
                            </div>
                            {transfer.position?.label && (
                              <div className="absolute -bottom-1 -right-1 px-1.5 py-0.5 bg-primary text-primary-foreground text-[10px] font-medium rounded">
                                {transfer.position.label}
                              </div>
                            )}
                          </div>
                          
                          {/* Transfer Details */}
                          <div className="flex-1">
                            <h4 className="font-semibold text-base mb-1">{transfer.name || transfer.player?.name || 'Unknown Player'}</h4>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              {(() => {
                                const { from, to } = getTransferClubs(transfer)
                                return (
                                  <>
                                    <span>{from}</span>
                                    <ArrowRight className="w-3 h-3" />
                                    <span>{to}</span>
                                  </>
                                )
                              })()}
                            </div>
                          </div>
                          
                          {/* Values */}
                          <div className="text-right space-y-1">
                            <div>
                              <div className="text-xs text-muted-foreground">시장가치</div>
                              <div className="font-bold text-lg">
                                {transfer.marketValue ? `€${(transfer.marketValue / 1000000).toFixed(1)}M` : 'N/A'}
                              </div>
                            </div>
                            {(() => {
                              const fee = formatFee(transfer)
                              return (
                                <div className={cn("text-sm font-medium", getFeeTextColor(fee.type))}>
                                  {fee.text}
                                </div>
                              )
                            })()}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}