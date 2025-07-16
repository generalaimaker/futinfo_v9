# FutInfo 배포 가이드

## 1. iOS 앱 배포

### App Store 배포 준비
1. Xcode에서 프로젝트 열기
2. 버전 번호 업데이트
3. Archive 생성
4. App Store Connect 업로드

### 환경 설정
```swift
// AppConfiguration.swift
static let supabaseURL = "YOUR_PRODUCTION_URL"
static let supabaseAnonKey = "YOUR_PRODUCTION_KEY"
```

## 2. Android 앱 배포

### Google Play 배포 준비
1. Android Studio에서 프로젝트 열기
2. 버전 코드 업데이트
3. Release APK/AAB 생성
4. Google Play Console 업로드

### 환경 설정
```kotlin
// AppConfig.kt
const val SUPABASE_URL = "YOUR_PRODUCTION_URL"
const val SUPABASE_ANON_KEY = "YOUR_PRODUCTION_KEY"
```

## 3. 웹 플랫폼 배포

### Vercel 배포 (권장)
```bash
# 프로젝트 루트에서
cd web
npm install
npm run build

# Vercel CLI 사용
vercel --prod
```

### 환경 변수
`.env.production` 파일 생성:
```env
NEXT_PUBLIC_SUPABASE_URL=your_production_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_production_anon_key
NEXT_PUBLIC_SITE_URL=https://your-domain.com
```

## 4. Supabase 설정

### Edge Functions 배포
```bash
cd supabase
supabase functions deploy football-api
supabase functions deploy news-feed
```

### 데이터베이스 마이그레이션
```bash
supabase db push
```

### RLS 정책 확인
- 모든 테이블의 RLS 활성화 여부 확인
- 적절한 권한 정책 설정

## 5. 프로덕션 체크리스트

### 보안
- [ ] API 키 프로덕션 용으로 교체
- [ ] RLS 정책 활성화
- [ ] CORS 설정 확인
- [ ] 환경 변수 보안

### 성능
- [ ] 이미지 최적화
- [ ] 캐싱 정책 설정
- [ ] CDN 구성
- [ ] 데이터베이스 인덱스

### 모니터링
- [ ] 에러 트래킹 설정
- [ ] 성능 모니터링
- [ ] 사용자 분석
- [ ] 로그 수집

## 6. 배포 후 테스트

### 기능 테스트
1. 경기 일정 로딩
2. 실시간 스코어 업데이트
3. 커뮤니티 게시글 작성
4. 크로스 플랫폼 동기화

### 성능 테스트
1. 페이지 로딩 속도
2. API 응답 시간
3. 실시간 업데이트 지연

## 7. 롤백 계획

문제 발생 시:
1. Vercel에서 이전 배포로 롤백
2. App Store/Google Play에서 이전 버전 활성화
3. Supabase Edge Functions 이전 버전으로 롤백

## 8. 배포 자동화

### GitHub Actions 설정
```yaml
name: Deploy
on:
  push:
    branches: [main]

jobs:
  deploy-web:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Vercel
        run: vercel --prod --token=${{ secrets.VERCEL_TOKEN }}
```