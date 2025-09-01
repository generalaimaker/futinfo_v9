# 팀 페이지 이적 탭 구현 가이드

## 📊 현재 상황
- **매핑 완료**: 95.8% (92/96 팀)
- **품질 검증**: 주요 팀 100% 성공
- **API 준비**: `lib/football-api/team-transfers.ts` 완성

## 🎯 구현 목표
팀 페이지 이적 탭에 정확한 이적료와 시장가치를 표시

## 📝 구현 단계

### 1. 팀 페이지에서 새 API 사용하기

```typescript
// app/teams/[id]/page.tsx
import { useEnhancedTeamTransfers } from '@/lib/football-api/team-transfers';

export default function TeamPage({ params }: { params: { id: string } }) {
  const teamId = parseInt(params.id);
  
  // 새로운 이적 데이터 훅 사용
  const { data: transferData, isLoading } = useEnhancedTeamTransfers(teamId);
  
  // transferData 구조:
  // {
  //   in: EnhancedTransfer[]     // 영입 선수
  //   out: EnhancedTransfer[]    // 방출 선수
  //   loans: { in: [], out: [] } // 임대 선수
  //   stats: { ... }             // 통계
  //   source: 'free-api' | 'api-football' // 데이터 소스
  // }
}
```

### 2. 이적 카드 컴포넌트 업데이트

```typescript
// components/teams/TransferCard.tsx
function TransferCard({ transfer }: { transfer: EnhancedTransfer }) {
  return (
    <div className="flex items-center justify-between p-4 border-b">
      <div className="flex items-center gap-3">
        <img 
          src={`/api/player-image/${transfer.playerId}`} 
          className="w-12 h-12 rounded-full"
        />
        <div>
          <div className="font-semibold">{transfer.playerName}</div>
          <div className="text-sm text-gray-500">{transfer.position}</div>
        </div>
      </div>
      
      <div className="text-right">
        <div className="font-bold text-lg">
          {transfer.fee?.text || '비공개'}
        </div>
        {transfer.marketValue && (
          <div className="text-sm text-gray-500">
            시장가치: €{(transfer.marketValue / 1000000).toFixed(1)}M
          </div>
        )}
        {transfer.onLoan && (
          <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded">
            임대
          </span>
        )}
      </div>
    </div>
  );
}
```

### 3. 이적 탭 레이아웃

```typescript
// components/teams/TransferTab.tsx
function TransferTab({ teamId }: { teamId: number }) {
  const { data, isLoading } = useEnhancedTeamTransfers(teamId);
  
  if (isLoading) return <LoadingSpinner />;
  if (!data) return <div>이적 정보를 불러올 수 없습니다</div>;
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* 영입 섹션 */}
      <div>
        <h3 className="text-xl font-bold mb-4">
          영입 ({data.in.length}명)
          {data.stats.totalSpent > 0 && (
            <span className="text-sm text-gray-500 ml-2">
              €{(data.stats.totalSpent / 1000000).toFixed(1)}M
            </span>
          )}
        </h3>
        <div className="space-y-2">
          {data.in.map(transfer => (
            <TransferCard key={transfer.id} transfer={transfer} />
          ))}
        </div>
      </div>
      
      {/* 방출 섹션 */}
      <div>
        <h3 className="text-xl font-bold mb-4">
          방출 ({data.out.length}명)
          {data.stats.totalEarned > 0 && (
            <span className="text-sm text-gray-500 ml-2">
              €{(data.stats.totalEarned / 1000000).toFixed(1)}M
            </span>
          )}
        </h3>
        <div className="space-y-2">
          {data.out.map(transfer => (
            <TransferCard key={transfer.id} transfer={transfer} />
          ))}
        </div>
      </div>
    </div>
  );
}
```

## ⚡ 주요 기능

### 1. 자동 API 선택
- 매핑된 팀 → free-api (정확한 이적료)
- 미매핑 팀 → api-football (기본 정보)

### 2. 이적료 표시
```typescript
// 정확한 이적료 포맷
€35.5M  // 3550만 유로
€850K   // 85만 유로
자유이적
임대
비공개
```

### 3. 임대 정보
- 임대 배지 표시
- 임대 기간 표시 (있을 경우)
- 임대 통계 별도 집계

### 4. 데이터 소스 표시
```typescript
{data.source === 'free-api' ? (
  <span className="text-xs text-green-600">정확한 데이터</span>
) : (
  <span className="text-xs text-gray-500">기본 데이터</span>
)}
```

## 🔄 마이그레이션 체크리스트

- [ ] `useEnhancedTeamTransfers` 훅으로 교체
- [ ] TransferCard 컴포넌트 업데이트
- [ ] 이적료 포맷팅 적용
- [ ] 임대 배지 추가
- [ ] 시장가치 표시 (가능한 경우)
- [ ] 로딩/에러 상태 처리
- [ ] 데이터 소스 표시 (선택사항)

## 📈 예상 개선사항

### Before (api-football)
- 이적료: "Transfer", "Loan", "Free"
- 시장가치: 없음
- 정확도: 낮음

### After (free-api)
- 이적료: "€35.5M", "€2.1M", "자유이적"
- 시장가치: 표시됨
- 정확도: 높음

## 🚨 주의사항

1. **Rate Limiting**: free-api는 분당 요청 제한이 있음
2. **캐싱 필수**: React Query의 캐싱 활용
3. **Fallback 처리**: 매핑 없는 팀은 기존 API 사용
4. **PSG 매핑**: 85 → 9847 (수정 완료)

## 📊 커버리지 현황

| 리그 | 커버리지 | 미매핑 팀 |
|------|---------|-----------|
| Premier League | 100% | - |
| La Liga | 100% | - |
| Serie A | 80% | Cagliari, Parma, Lecce, Monza |
| Bundesliga | 100% | - |
| Ligue 1 | 100% | - |
| **전체** | **95.8%** | **4팀** |

## 🎯 다음 단계

1. 팀 페이지 이적 탭 업데이트
2. 이적료 통계 대시보드 추가
3. 이적 히스토리 차트 구현
4. 선수별 상세 이적 정보 페이지