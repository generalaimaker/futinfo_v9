'use client'

import { useState } from 'react'
import { Globe, Check, Loader2 } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { useUserLanguage, type SupportedLanguage } from '@/lib/hooks/useUserLanguage'
import { cn } from '@/lib/utils'

const LANGUAGES = [
  { code: 'ko', name: '한국어', flag: '🇰🇷' },
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'ja', name: '日本語', flag: '🇯🇵' },
  { code: 'zh', name: '中文', flag: '🇨🇳' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
] as const

export function LanguageSettings() {
  const { 
    language, 
    autoTranslate, 
    isLoading,
    updateLanguage, 
    updateAutoTranslate 
  } = useUserLanguage()
  
  const [selectedLang, setSelectedLang] = useState<SupportedLanguage>(language)
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async () => {
    setIsSaving(true)
    await updateLanguage(selectedLang)
    setIsSaving(false)
  }

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-6">
      <div className="space-y-6">
        {/* 헤더 */}
        <div className="flex items-center gap-2">
          <Globe className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold">언어 설정</h3>
        </div>

        {/* 언어 선택 */}
        <div className="space-y-3">
          <Label>선호 언어</Label>
          <RadioGroup
            value={selectedLang}
            onValueChange={(value) => setSelectedLang(value as SupportedLanguage)}
          >
            {LANGUAGES.map((lang) => (
              <div
                key={lang.code}
                className={cn(
                  "flex items-center space-x-3 rounded-lg border p-3 cursor-pointer hover:bg-muted/50 transition-colors",
                  selectedLang === lang.code && "border-primary bg-primary/5"
                )}
                onClick={() => setSelectedLang(lang.code)}
              >
                <RadioGroupItem value={lang.code} id={lang.code} />
                <Label
                  htmlFor={lang.code}
                  className="flex items-center gap-2 cursor-pointer flex-1"
                >
                  <span className="text-xl">{lang.flag}</span>
                  <span>{lang.name}</span>
                  {language === lang.code && selectedLang === lang.code && (
                    <span className="ml-auto text-xs text-muted-foreground">
                      현재 설정
                    </span>
                  )}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>

        {/* 자동 번역 설정 */}
        <div className="flex items-center justify-between space-x-2 rounded-lg border p-4">
          <div className="space-y-0.5">
            <Label htmlFor="auto-translate" className="text-base">
              뉴스 자동 번역
            </Label>
            <p className="text-sm text-muted-foreground">
              영어 뉴스를 선택한 언어로 자동 번역합니다
            </p>
          </div>
          <Switch
            id="auto-translate"
            checked={autoTranslate}
            onCheckedChange={updateAutoTranslate}
          />
        </div>

        {/* 저장 버튼 */}
        {selectedLang !== language && (
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => setSelectedLang(language)}
              disabled={isSaving}
            >
              취소
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  저장 중...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  저장
                </>
              )}
            </Button>
          </div>
        )}

        {/* 안내 메시지 */}
        <div className="rounded-lg bg-blue-50 dark:bg-blue-950/30 p-4">
          <p className="text-sm text-blue-900 dark:text-blue-100">
            <strong>참고:</strong> 언어 설정은 뉴스, 경기 정보 등의 콘텐츠에 적용됩니다.
            일부 콘텐츠는 원본 언어로만 제공될 수 있습니다.
          </p>
        </div>
      </div>
    </Card>
  )
}