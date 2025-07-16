# Android 앱 기능 구현 계획

이 문서는 iOS 버전에 비해 Android 앱에 누락된 주요 기능들을 구현하기 위한 포괄적인 개발 계획을 정의합니다.

## 목차
1.  [고급 뉴스 필터링 및 검색](#1-고급-뉴스-필터링-및-검색)
2.  [실시간 이적 센터](#2-실시간-이적-센터)
3.  [토너먼트 대진표](#3-토너먼트-대진표)
4.  [즐겨찾기 기능](#4-즐겨찾기-기능)

---

## 1. 고급 뉴스 필터링 및 검색

### 1.1. 구현 우선순위
**높음 (High)**
- 이유: 뉴스 기능은 사용자들이 가장 자주 사용하는 핵심 기능 중 하나입니다. 정보 탐색의 효율성을 높여 사용자 경험을 크게 향상시킬 수 있으며, 기존 기능의 확장이라 비교적 구현 부담이 적습니다.

### 1.2. 필요한 UI/UX 변경 사항
- **`NewsScreen.kt`**:
    - 상단 앱 바(Top App Bar)에 '필터' 아이콘 버튼을 추가합니다.
    - 검색 바 UI를 개선하여 키워드 입력을 더 쉽게 만듭니다.
- **`NewsFilterBottomSheet.kt` (신규 Composable):**
    - 필터 아이콘 클릭 시 화면 하단에서 올라오는 `ModalBottomSheet`를 구현합니다.
    - **키워드 필터링:** `TextField`를 통해 검색 키워드를 입력받습니다.
    - **날짜 필터링:** `DatePicker`를 사용하여 특정 날짜 또는 기간을 선택할 수 있게 합니다. (예: '최근 24시간', '최근 1주', '직접 선택')
    - **카테고리 필터링:** `ChipGroup` 형태의 UI로 '이적', '부상', '경기 결과' 등 여러 카테고리를 선택할 수 있게 합니다.
    - '적용' 버튼을 두어 필터 옵션을 확정하고 `NewsViewModel`에 전달합니다.

### 1.3. ViewModel 및 UseCase 정의
- **`NewsViewModel.kt`**:
    - 필터 상태를 관리할 `StateFlow`를 추가합니다.
      ```kotlin
      data class NewsFilterState(
          val keyword: String = "",
          val startDate: Long? = null,
          val endDate: Long? = null,
          val categories: List<String> = emptyList()
      )
      private val _filterState = MutableStateFlow(NewsFilterState())
      val filterState: StateFlow<NewsFilterState> = _filterState
      ```
    - `applyFilters(newFilterState: NewsFilterState)` 함수를 정의하여 필터를 적용하고 뉴스를 다시 불러옵니다.
- **`GetNewsUseCase.kt`**:
    - `invoke` 함수의 파라미터를 수정하여 필터링 옵션을 받을 수 있도록 합니다.
      ```kotlin
      class GetNewsUseCase @Inject constructor(private val repository: FootballRepository) {
          operator fun invoke(
              keyword: String? = null,
              startDate: String? = null, // ISO 8601 format
              endDate: String? = null,   // ISO 8601 format
              category: String? = null
          ): Flow<Resource<List<NewsArticle>>> {
              // ... Repository 호출 로직
          }
      }
      ```

### 1.4. 데이터 모델 및 API 요구사항
- **데이터 모델:**
    - 기존 `NewsDto`, `NewsArticle` 모델을 재사용합니다. 변경이 필요 없습니다.
- **API 요구사항:**
    - `GET /v3/news` (가상 엔드포인트)
    - API가 다음 쿼리 파라미터를 지원해야 합니다.
        - `q` (String): 검색 키워드
        - `from` (String, `YYYY-MM-DD`): 시작 날짜
        - `to` (String, `YYYY-MM-DD`): 종료 날짜
        - `category` (String): 쉼표로 구분된 카테고리 목록 (예: "transfers,injuries")

### 1.5. 구현 단계
1.  **API 서비스 수정:** `FootballApiService.kt`의 `getNews` 함수에 쿼리 파라미터(`@Query`)를 추가합니다.
2.  **Repository 수정:** `FootballRepository.kt` 및 `FootballRepositoryImpl.kt`의 `getNews` 함수 시그니처를 변경하여 필터 파라미터를 전달하도록 합니다.
3.  **UseCase 수정:** `GetNewsUseCase.kt`를 위 정의에 맞게 수정합니다.
4.  **ViewModel 수정:** `NewsViewModel.kt`에 `NewsFilterState` 및 관련 로직을 추가합니다.
5.  **UI 구현:** `NewsFilterBottomSheet.kt` Composable을 새로 생성합니다.
6.  **통합:** `NewsScreen.kt`에 필터 아이콘과 `NewsFilterBottomSheet`를 통합하고, ViewModel과 연결하여 필터링 기능이 동작하도록 합니다.

---

## 2. 실시간 이적 센터

### 2.1. 구현 우선순위
**높음 (High)**
- 이유: 선수 이적은 축구 팬들의 가장 큰 관심사 중 하나로, 앱의 트래픽과 사용자 참여를 크게 증대시킬 수 있는 핵심 기능입니다.

### 2.2. 필요한 UI/UX 변경 사항
- **`TransfersScreen.kt` (신규 화면):**
    - 앱의 메인 네비게이션(Bottom Navigation Bar)에 '이적' 탭을 추가합니다.
    - 화면은 `LazyColumn`을 사용하여 최신 이적 목록을 표시합니다.
    - 상단에 '주요 이적', '루머', '오피셜' 등 필터링을 위한 탭을 배치할 수 있습니다.
- **`TransferListItem.kt` (신규 Composable):**
    - 각 이적 항목을 표시하는 Composable입니다.
    - 포함될 정보: 선수 사진, 선수 이름, 이적 날짜, 이전 팀 로고 및 이름, 새로운 팀 로고 및 이름, 이적료 또는 이적 형태(임대, 자유계약 등).
    - 클릭 시 `PlayerProfileScreen`으로 이동합니다.

### 2.3. ViewModel 및 UseCase 정의
- **`TransfersViewModel.kt` (신규):**
    - `StateFlow<TransfersState>`를 통해 이적 목록, 로딩 상태, 에러 상태를 관리합니다.
    - `getTransfers()` 함수를 통해 `GetTransfersUseCase`를 호출합니다.
- **`GetTransfersUseCase.kt` (신규):**
    - `FootballRepository`를 통해 이적 데이터를 가져오는 비즈니스 로직을 담당합니다.
    - 리그별, 기간별 필터링 로직을 포함할 수 있습니다.

### 2.4. 데이터 모델 및 API 요구사항
- **데이터 모델 (신규):**
    - **`TransferDto.kt`**: API 응답을 위한 DTO
      ```kotlin
      data class TransferDto(
          val player: PlayerDto,
          val fromTeam: TeamDto,
          val toTeam: TeamDto,
          val date: String,
          val fee: String?,
          val type: String // "transfer", "loan", "free"
      )
      ```
    - **`Transfer.kt` (Domain Model)**: UI 레이어에서 사용할 모델
    - **`TransferEntity.kt` (Local Entity)**: 오프라인 캐싱을 위한 Room Entity
- **API 요구사항:**
    - `GET /v3/transfers`
    - 쿼리 파라미터:
        - `league` (Int): 특정 리그의 이적 정보 필터링
        - `player` (Int): 특정 선수의 이적 히스토리
        - `team` (Int): 특정 팀의 이적 정보

### 2.5. 구현 단계
1.  **데이터 모델 정의:** `TransferDto`, `Transfer`, `TransferEntity` 및 관련 매퍼를 작성합니다.
2.  **API 서비스 추가:** `FootballApiService.kt`에 `getTransfers()` 함수를 추가합니다.
3.  **Room DB 추가:** `TransferDao`를 정의하고 `FutInfoDatabase`에 추가합니다.
4.  **Repository 구현:** `FootballRepository.kt`에 `getTransfers` 인터페이스를 추가하고 `FootballRepositoryImpl.kt`에서 원격/로컬 데이터 소스를 결합하여 구현합니다.
5.  **UseCase 및 ViewModel 구현:** `GetTransfersUseCase.kt`와 `TransfersViewModel.kt`를 작성합니다.
6.  **UI 구현:** `TransfersScreen.kt`과 `TransferListItem.kt` Composable을 구현합니다.
7.  **네비게이션 통합:** `NavGraph.kt`와 `BottomNavigationBar.kt`에 '이적' 화면을 추가합니다.

---

## 3. 토너먼트 대진표

### 3.1. 구현 우선순위
**중간 (Medium)**
- 이유: 챔피언스리그, 월드컵 등 주요 토너먼트 기간 동안 매우 유용한 기능이지만, 상시 기능은 아닙니다. 대진표 시각화 UI 구현에 복잡성이 따를 수 있습니다.

### 3.2. 필요한 UI/UX 변경 사항
- **`TournamentBracketScreen.kt` (신규 화면):**
    - 특정 리그/컵 대회 화면(`LeagueDetailScreen`)에서 진입할 수 있는 '대진표' 탭 또는 버튼을 추가합니다.
    - `Canvas` 또는 중첩된 `Row`, `Column`과 커스텀 `Layout`을 사용하여 대진표를 시각적으로 구현합니다.
    - 대진표는 확대/축소가 가능해야 합니다.
- **`BracketNode.kt` (신규 Composable):**
    - 대진표의 각 경기(노드)를 나타내는 Composable입니다.
    - 팀 로고, 팀 이름, 경기 점수를 표시합니다.
    - 경기가 끝난 경우 승리 팀을 시각적으로 강조합니다.
    - 클릭 시 해당 `FixtureDetailScreen`으로 이동합니다.

### 3.3. ViewModel 및 UseCase 정의
- **`TournamentViewModel.kt` (신규):**
    - 특정 대회의 대진표 데이터를 관리합니다. (`competitionId`를 파라미터로 받음)
    - `getBracket(competitionId: Int)` 함수를 통해 `GetTournamentBracketUseCase`를 호출합니다.
- **`GetTournamentBracketUseCase.kt` (신규):**
    - `competitionId`를 받아 해당 대회의 대진표 데이터를 가져옵니다.

### 3.4. 데이터 모델 및 API 요구사항
- **데이터 모델 (신규):**
    - **`BracketNodeDto.kt`**: 대진표의 재귀적 구조를 표현할 수 있는 DTO가 필요합니다.
      ```kotlin
      data class BracketNodeDto(
          val fixtureId: Int?,
          val round: String,
          val team1: TeamDto?,
          val team2: TeamDto?,
          val score1: Int?,
          val score2: Int?,
          val winnerId: Int?,
          val children: List<BracketNodeDto> // 다음 라운드로 이어지는 노드
      )
      ```
    - **`BracketNode.kt` (Domain Model)**: UI에서 사용할 재귀적 데이터 구조.
- **API 요구사항:**
    - `GET /v3/competitions/{id}/bracket`
    - API 응답은 대진표 전체를 표현할 수 있는 트리(tree) 또는 그래프(graph) 형태의 JSON 구조여야 합니다.

### 3.5. 구현 단계
1.  **데이터 모델 설계:** 재귀적인 `BracketNodeDto`와 `BracketNode` 도메인 모델을 설계하고 매퍼를 작성합니다.
2.  **API 서비스 추가:** `FootballApiService.kt`에 `getTournamentBracket()` 함수를 추가합니다.
3.  **Repository 및 UseCase 구현:** `getTournamentBracket` 관련 Repository 로직과 `GetTournamentBracketUseCase`를 구현합니다.
4.  **ViewModel 구현:** `TournamentViewModel.kt`를 작성합니다.
5.  **UI 구현 (핵심 단계):**
    - `BracketNode.kt` Composable을 구현합니다.
    - `TournamentBracketScreen.kt`에서 ViewModel로부터 받은 데이터로 대진표를 동적으로 그리는 로직을 구현합니다. (복잡성이 높으므로 충분한 시간 할애 필요)
6.  **통합:** `LeagueDetailScreen` 등에서 `TournamentBracketScreen`으로 이동할 수 있도록 네비게이션을 연결합니다.

---

## 4. 즐겨찾기 기능

### 4.1. 구현 우선순위
**중간-높음 (Medium-High)**
- 이유: 앱 개인화를 통해 사용자 충성도와 재방문율을 높일 수 있는 중요한 기능입니다. 로컬 데이터베이스 작업이 주가 됩니다.

### 4.2. 필요한 UI/UX 변경 사항
- **즐겨찾기 아이콘 추가:**
    - `LeagueDetailScreen`, `TeamProfileScreen`, `PlayerProfileScreen`의 상단 앱 바에 '별(Star)' 모양의 토글 아이콘을 추가하여 즐겨찾기 추가/삭제를 할 수 있도록 합니다.
- **`FavoritesScreen.kt` (신규 화면):**
    - 메인 네비게이션에 '즐겨찾기' 탭을 추가합니다.
    - 화면 내에 '리그', '팀', '선수'를 선택할 수 있는 탭을 구성합니다.
    - 각 탭은 사용자가 즐겨찾기한 항목들의 목록을 보여줍니다.

### 4.3. ViewModel 및 UseCase 정의
- **`FavoritesViewModel.kt` (신규):**
    - `getFavoriteLeagues()`, `getFavoriteTeams()`, `getFavoritePlayers()` 함수를 통해 즐겨찾기 목록을 불러옵니다.
- **각 상세 화면 ViewModel 수정 (`TeamProfileViewModel` 등):**
    - `isFavorite(id: Int): StateFlow<Boolean>`: 해당 항목이 즐겨찾기 상태인지 확인합니다.
    - `toggleFavorite(id: Int)`: 즐겨찾기 상태를 추가하거나 삭제합니다.
- **UseCases (신규, 다수):**
    - `AddFavoriteTeamUseCase`, `RemoveFavoriteTeamUseCase`, `GetFavoriteTeamsUseCase`, `IsFavoriteTeamUseCase`
    - 리그, 선수에 대해서도 위와 동일한 UseCase 세트를 각각 정의합니다.

### 4.4. 데이터 모델 및 API 요구사항
- **데이터 모델 (신규, Local DB):**
    - **`FavoriteLeagueEntity.kt`**: `leagueId` (PK), `name`, `logoUrl` 등
    - **`FavoriteTeamEntity.kt`**: `teamId` (PK), `name`, `logoUrl` 등
    - **`FavoritePlayerEntity.kt`**: `playerId` (PK), `name`, `photoUrl` 등
    - 각 Entity에 맞는 `...Dao` 인터페이스 (예: `FavoriteTeamDao`)를 정의합니다.
- **API 요구사항:**
    - 없음. 이 기능은 전적으로 클라이언트의 로컬 데이터베이스(Room)를 사용하여 구현됩니다.

### 4.5. 구현 단계
1.  **Room DB 설계:** `Favorite...Entity`와 `...Dao`를 모두 정의하고, `FutInfoDatabase`의 `entities` 배열에 추가합니다. DB 버전을 올립니다.
2.  **Repository 구현:** `FootballRepository`에 즐겨찾기 추가/삭제/조회/확인 관련 함수들을 추가하고 `FootballRepositoryImpl`에서 DAO를 호출하여 구현합니다.
3.  **UseCase 구현:** 정의된 모든 즐겨찾기 관련 UseCase들을 구현합니다.
4.  **ViewModel 구현/수정:**
    - `FavoritesViewModel`을 새로 구현합니다.
    - `TeamProfileViewModel`, `PlayerProfileViewModel` 등 기존 ViewModel에 즐겨찾기 관련 로직과 상태를 추가합니다.
5.  **UI 구현/수정:**
    - `FavoritesScreen`을 구현합니다.
    - 각 상세 화면에 즐겨찾기 토글 아이콘을 추가하고 ViewModel과 연결합니다.
6.  **네비게이션 통합:** `NavGraph.kt`에 `FavoritesScreen`을 추가하고 네비게이션 바에 연결합니다.