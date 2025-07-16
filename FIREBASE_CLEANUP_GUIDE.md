# 🧹 Firebase 레거시 코드 정리 가이드

## 완료된 작업 ✅

### iOS 앱에서 Firebase 참조 제거
1. **FootballAPIService.swift**
   - `Firebase Functions` → `Supabase Edge Functions` 주석 변경 완료

2. **DirectAPIService.swift**
   - `Firebase Functions를 우회하는` → `Edge Functions를 우회하는` 변경 완료

3. **FootballAPIError.swift**
   - `firebaseFunctionError` → `edgeFunctionError` 타입 변경 완료

4. **APIRequestManager.swift**
   - Firebase 관련 에러 및 주석 변경 완료

5. **SupabaseFootballAPIService.swift**
   - Firebase 관련 주석 변경 완료

6. **FixturesOverviewViewModel.swift**
   - Firebase Functions 관련 주석 변경 완료

## 삭제 가능한 Firebase 레거시 코드 🗑️

### 1. Firebase Functions 서버 디렉토리
```bash
# 전체 디렉토리 삭제
rm -rf /Users/hyunwoopark/Desktop/futinfo_v6/footdata-server
```

이 디렉토리에는:
- Firebase Functions 코드 (index.js)
- Firebase 설정 파일 (.firebaserc, firebase.json)
- Firestore 규칙 및 인덱스
- 배포 스크립트
- 모든 관련 의존성

### 2. Firebase 로그 파일
```bash
rm /Users/hyunwoopark/Desktop/futinfo_v6/firebase-debug.log
```

## Android 앱 상태 ⚠️

Android 앱은 여전히 Firebase를 사용 중입니다:
- **Firebase Firestore**: 데이터 저장용
- **Firebase Auth**: 인증용
- **google-services.json**: Firebase 설정 파일

### Android 마이그레이션 필요 사항:
1. Firestore → Supabase Database
2. Firebase Auth → Supabase Auth
3. Firebase 의존성 제거
4. google-services.json 삭제

## 권장 정리 순서

### 1단계: iOS 정리 (완료) ✅
- 모든 Firebase 참조를 Supabase로 변경 완료

### 2단계: Firebase Functions 서버 삭제
```bash
# 백업 생성 (선택사항)
tar -czf footdata-server-backup.tar.gz footdata-server/

# 디렉토리 삭제
rm -rf footdata-server/

# Firebase 로그 삭제
rm firebase-debug.log
```

### 3단계: Git에서 제거
```bash
git add -A
git commit -m "Remove Firebase Functions server - migrated to Supabase Edge Functions"
```

### 4단계: Android 마이그레이션 (향후 작업)
Android 앱을 Supabase로 마이그레이션하려면:
1. Supabase Android SDK 추가
2. Firebase 코드를 Supabase로 교체
3. Firebase 의존성 제거
4. google-services.json 삭제

## 주의사항 ⚠️

1. **서버 삭제 전 확인**:
   - Supabase Edge Functions가 정상 작동 중인지 확인
   - 모든 API 요청이 Supabase를 통해 처리되는지 확인

2. **Android 앱**:
   - Android 앱이 Firebase를 사용 중이므로, Android 마이그레이션 전까지는 Firebase 프로젝트를 유지해야 함
   - Firebase Console에서 프로젝트를 삭제하지 말 것

## 최종 확인 사항 ✓

- [x] iOS 앱에서 모든 Firebase 참조 제거
- [x] Supabase Edge Functions 정상 작동 확인
- [ ] Firebase Functions 서버 디렉토리 삭제
- [ ] Git 커밋으로 변경사항 저장
- [ ] Android 앱 마이그레이션 계획 수립