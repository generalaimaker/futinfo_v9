'use client'

import { X, Shield, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { NewsFilters } from '@/lib/supabase/cached-news'

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
          {/* Featured only */}
          <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer">
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-blue-600" />
              <div>
                <div className="font-medium">주요 뉴스만 표시</div>
                <div className="text-sm text-gray-500">편집자가 선정한 중요 뉴스</div>
              </div>
            </div>
            <input
              type="checkbox"
              checked={filters.onlyFeatured || false}
              onChange={(e) => onFiltersChange({ onlyFeatured: e.target.checked })}
              className="w-5 h-5"
            />
          </label>
          
          {/* Breaking news only */}
          <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-red-600" />
              <div>
                <div className="font-medium">속보만 표시</div>
                <div className="text-sm text-gray-500">최신 긴급 뉴스</div>
              </div>
            </div>
            <input
              type="checkbox"
              checked={filters.onlyBreaking || false}
              onChange={(e) => onFiltersChange({ onlyBreaking: e.target.checked })}
              className="w-5 h-5"
            />
          </label>
        </div>
        
        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t p-4">
          <Button 
            className="w-full" 
            onClick={onClose}
          >
            필터 적용
          </Button>
        </div>
      </div>
    </div>
  )
}