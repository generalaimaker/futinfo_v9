'use client'

import { X, Shield, Users, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import type { NewsFilters } from '@/lib/supabase/news'

interface TransferNewsFilterProps {
  filters: NewsFilters
  onFiltersChange: (filters: Partial<NewsFilters>) => void
  onClose: () => void
}

export function TransferNewsFilter({ filters, onFiltersChange, onClose }: TransferNewsFilterProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end sm:items-center justify-center">
      <div className="bg-white rounded-t-2xl sm:rounded-xl w-full sm:max-w-md max-h-[80vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b p-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">이적 뉴스 필터</h3>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>
        
        {/* Content */}
        <div className="p-4 space-y-6">
          {/* Tier 1 소스만 */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-blue-600" />
                <Label htmlFor="tier1">Tier 1 소스만 표시</Label>
              </div>
              <Switch
                id="tier1"
                checked={filters.onlyTier1}
                onCheckedChange={(checked) => onFiltersChange({ onlyTier1: checked })}
              />
            </div>
            <p className="text-sm text-gray-500">
              가장 신뢰할 수 있는 소스 (BBC, Sky Sports 등)의 뉴스만 표시합니다.
            </p>
          </div>
          
          {/* 신뢰도 점수 */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <Label>최소 신뢰도 점수: {filters.minTrustScore || 0}%</Label>
            </div>
            <Slider
              value={[filters.minTrustScore || 0]}
              onValueChange={([value]) => onFiltersChange({ minTrustScore: value })}
              min={0}
              max={100}
              step={10}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>모든 뉴스</span>
              <span>검증된 뉴스만</span>
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
                <span>70-89%: 신뢰할 수 있는 기자, 검증된 소스</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <span>50-69%: 일반 루머, 추측성 기사</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                <span>0-49%: 신뢰도 낮은 루머</span>
              </div>
            </div>
          </div>
          
          {/* 신뢰할 수 있는 기자들 */}
          <div className="space-y-3">
            <h4 className="font-medium text-sm flex items-center gap-2">
              <Users className="w-4 h-4" />
              신뢰할 수 있는 이적 전문 기자
            </h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="bg-blue-50 rounded px-3 py-2">
                <div className="font-medium">Fabrizio Romano</div>
                <div className="text-xs text-gray-600">글로벌 이적</div>
              </div>
              <div className="bg-blue-50 rounded px-3 py-2">
                <div className="font-medium">David Ornstein</div>
                <div className="text-xs text-gray-600">프리미어리그</div>
              </div>
              <div className="bg-blue-50 rounded px-3 py-2">
                <div className="font-medium">Simon Stone</div>
                <div className="text-xs text-gray-600">맨체스터 클럽</div>
              </div>
              <div className="bg-blue-50 rounded px-3 py-2">
                <div className="font-medium">Matt Law</div>
                <div className="text-xs text-gray-600">첼시</div>
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