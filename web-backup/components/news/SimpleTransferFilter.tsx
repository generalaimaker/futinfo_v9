'use client'

import { X, Shield, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { NewsFilters } from '@/lib/supabase/news'

interface SimpleTransferFilterProps {
  filters: NewsFilters
  onFiltersChange: (filters: Partial<NewsFilters>) => void
  onClose: () => void
}

export function SimpleTransferFilter({ filters, onFiltersChange, onClose }: SimpleTransferFilterProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end sm:items-center justify-center">
      <div className="bg-white rounded-t-2xl sm:rounded-xl w-full sm:max-w-md">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b p-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">이적 뉴스 필터</h3>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>
        
        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Tier 1 소스만 */}
          <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer">
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-blue-600" />
              <div>
                <div className="font-medium">Tier 1 소스만 표시</div>
                <div className="text-sm text-gray-500">BBC, Sky Sports 등 신뢰할 수 있는 소스</div>
              </div>
            </div>
            <input
              type="checkbox"
              checked={filters.onlyTier1}
              onChange={(e) => onFiltersChange({ onlyTier1: e.target.checked })}
              className="w-5 h-5"
            />
          </label>
          
          {/* 신뢰도 선택 */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="font-medium">최소 신뢰도 점수</span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {[0, 50, 70, 90].map(score => (
                <button
                  key={score}
                  onClick={() => onFiltersChange({ minTrustScore: score })}
                  className={`py-2 px-3 rounded-lg border transition-colors ${
                    filters.minTrustScore === score 
                      ? 'bg-blue-600 text-white border-blue-600' 
                      : 'bg-white hover:bg-gray-50 border-gray-300'
                  }`}
                >
                  {score}%+
                </button>
              ))}
            </div>
          </div>
          
          {/* 신뢰도 가이드 */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <h4 className="font-medium text-sm">신뢰도 가이드</h4>
            <div className="space-y-1 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span>90-100%: 공식 발표, Tier 1 소스</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span>70-89%: 신뢰할 수 있는 기자</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <span>50-69%: 일반 루머</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Actions */}
        <div className="sticky bottom-0 bg-white border-t p-4 flex gap-2">
          <Button 
            variant="outline" 
            className="flex-1"
            onClick={() => {
              onFiltersChange({ onlyTier1: false, minTrustScore: 0 })
            }}
          >
            초기화
          </Button>
          <Button className="flex-1" onClick={onClose}>
            적용
          </Button>
        </div>
      </div>
    </div>
  )
}