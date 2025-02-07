# Football Info App

축구 경기 정보를 제공하는 iOS 앱입니다. API-FOOTBALL을 활용하여 실시간 경기 정보, 리그 순위, 선수 통계 등을 제공합니다.

## 주요 기능

### 리그 정보
- 주요 유럽 리그 (프리미어리그, 라리가, 세리에A, 분데스리가)
- UEFA 대회 (챔피언스리그, 유로파리그)
- 리그별 순위 및 통계

### 경기 정보
- 실시간 경기 상황
- 경기 일정 및 결과
- 상세 통계 및 이벤트
- 선수 라인업 및 평점

### 선수 통계
- 포지션별 필터링
- 상세 통계 정보
- 경기별 퍼포먼스

## 기술 스택

- SwiftUI
- MVVM 아키텍처
- API-FOOTBALL (RapidAPI)
- 비동기 데이터 처리 (async/await)

## 프로젝트 구조

```
football/
├── Models/
│   ├── Fixture.swift
│   ├── FixtureDetail.swift
│   ├── League.swift
│   ├── PlayerStatistics.swift
│   └── Standing.swift
├── Views/
│   ├── FixtureCell.swift
│   ├── FixtureDetailView.swift
│   ├── FixturesView.swift
│   ├── LeagueCell.swift
│   ├── LeaguesView.swift
│   ├── LeagueTabItem.swift
│   └── StandingsView.swift
├── ViewModels/
│   ├── FixtureDetailViewModel.swift
│   ├── FixturesViewModel.swift
│   ├── LeaguesViewModel.swift
│   └── StandingsViewModel.swift
└── Services/
    └── FootballAPIService.swift
```

## 설치 방법

1. 프로젝트 클론
```bash
git clone https://github.com/generalaimaker/football_info_app.git
```

2. API 키 설정
- RapidAPI에서 API-FOOTBALL API 키 발급
- Info.plist에 FootballAPIKey 추가

3. 프로젝트 빌드 및 실행
- Xcode로 프로젝트 열기
- 시뮬레이터 또는 실제 기기에서 실행

## 라이선스

이 프로젝트는 MIT 라이선스를 따릅니다.