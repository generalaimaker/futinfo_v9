# 뉴스 성능 최적화 구현 가이드

## ✅ 구현 완료된 최적화

### 1. **OptimizedNewsCollector.swift** - API 호출 최적화
- **개선 내용**:
  - 7개 동시 API 호출 → 2-3개 순차 호출로 감소
  - 5분 캐싱 시스템 구현 (NSCache 사용)
  - 축구 관련 뉴스만 필터링
  - 중복 제거 알고리즘 개선

### 2. **OptimizedTranslationService.swift** - 번역 병목현상 해결
- **개선 내용**:
  - 순차 번역 → 배치 처리 (5개씩 묶어서 처리)
  - 병렬 처리 (최대 3개 배치 동시 실행)
  - 타임아웃 설정 (3초)
  - 더 빠른 GPT-3.5-turbo 모델 사용
  - 텍스트 길이 제한 (제목 200자, 요약 500자)

### 3. **OptimizedNewsViewModel.swift** - 메모리 누수 수정
- **개선 내용**:
  - Timer weak self 패턴 적용
  - Task 취소 가능하도록 구현
  - 진행률 표시 기능 추가

## 🔧 통합 방법

### 1단계: 기존 NewsViewModel 교체

```swift
// 기존 코드 (NewsView.swift)
@StateObject private var viewModel = NewsViewModel()

// 변경 후
@StateObject private var viewModel = OptimizedNewsViewModel()
```

### 2단계: 진행률 표시 UI 추가 (선택사항)

```swift
// NewsView.swift에 추가
if viewModel.isTranslating {
    ProgressView("번역 중...", value: viewModel.translationProgress)
        .padding()
}
```

### 3단계: 기존 서비스 비활성화

1. `MultiSourceNewsCollector.swift` 사용 중단
2. `GPTTranslationService.swift`의 순차 처리 메서드 대신 `OptimizedTranslationService` 사용

## 📊 예상 성능 개선

| 지표 | 이전 | 이후 | 개선율 |
|------|------|------|--------|
| 초기 로딩 시간 | 5-10초 | 2-3초 | 70% ↓ |
| 번역 시간 | 20-30초 | 5-7초 | 75% ↓ |
| API 호출 수 | 7회 | 2-3회 | 70% ↓ |
| 메모리 사용량 | 증가 추세 | 안정적 | - |

## 🧪 테스트 방법

### 1. 성능 테스트
```swift
// 로딩 시간 측정
let startTime = Date()
await viewModel.loadNews()
let loadTime = Date().timeIntervalSince(startTime)
print("로딩 시간: \(loadTime)초")
```

### 2. 메모리 누수 테스트
- Xcode Instruments의 Leaks 도구 사용
- 화면 전환 반복하며 메모리 증가 확인

### 3. 번역 정확도 테스트
- 다양한 언어로 전환하며 번역 품질 확인
- 캐시 적중률 모니터링

## 🚀 추가 최적화 제안

### 1. 이미지 캐싱 (다음 단계)
```swift
// SDWebImage 또는 Kingfisher 라이브러리 사용
AsyncImage(url: URL(string: imageUrl)) { image in
    image
        .resizable()
        .aspectRatio(contentMode: .fill)
} placeholder: {
    ProgressView()
}
```

### 2. 백그라운드 프리페치
```swift
// 다음 페이지 미리 로드
func prefetchNextPage() async {
    // 구현 필요
}
```

### 3. 오프라인 지원
```swift
// Core Data 또는 SQLite로 로컬 저장
func saveNewsOffline(_ news: [NewsItem]) {
    // 구현 필요
}
```

## ⚠️ 주의사항

1. **API 키 관리**: Supabase Edge Functions의 환경 변수로 관리
2. **Rate Limiting**: API 제공자의 제한 사항 준수
3. **에러 처리**: 네트워크 오류 시 적절한 피드백 제공

## 📝 마이그레이션 체크리스트

- [ ] OptimizedNewsViewModel로 교체
- [ ] 진행률 UI 추가 (선택)
- [ ] 기존 서비스 참조 제거
- [ ] 성능 테스트 수행
- [ ] 메모리 누수 확인
- [ ] 사용자 피드백 수집

## 🎯 다음 단계

1. 이미지 캐싱 시스템 구현
2. 백엔드 뉴스 수집 시스템 구축
3. WebSocket 실시간 업데이트
4. 오프라인 모드 지원

---

구현 중 문제가 발생하면 각 최적화 파일의 주석을 참고하세요.