### **'일정' 탭 기능 개선 구현 계획**

이 문서는 '일정' 탭의 기능을 개선하여 사용자가 선택한 날짜의 모든 주요 경기(주요 리그, 컵대회, 국제 대회)를 종합적으로 볼 수 있도록 하는 구현 계획을 상세히 기술합니다.

**1. API 분석 및 데이터 소스 정의**

*   **1.1. 최적 API 엔드포인트 식별:**
    *   `FootballApiService.kt` 분석 결과, `getFixtures(date: String, league: Int, ...)` 함수가 특정 날짜와 리그의 경기 정보를 가져오는 데 가장 적합한 엔드포인트임을 확인했습니다.
    *   사용자가 날짜를 선택하면, 해당 날짜를 `date` 파라미터로 전달하고, 미리 정의된 주요 리그 ID 목록을 `league` 파라미터에 순차적으로 또는 동시에 전달하여 경기 정보를 요청합니다.

*   **1.2. 주요 대회 ID 목록:**
    *   `getLeagues(name: String)` 또는 `getLeagues(country: String)` API를 호출하여 아래 주요 대회의 ID를 사전에 확보하고, 앱 내의 상수나 설정 파일에 저장하여 관리합니다.
        *   **유럽 5대 리그:**
            *   프리미어리그 (Premier League)
            *   라리가 (La Liga)
            *   세리에 A (Serie A)
            *   분데스리가 (Bundesliga)
            *   리그 1 (Ligue 1)
        *   **주요 컵 대회:**
            *   FA컵 (FA Cup)
            *   코파 델 레이 (Copa del Rey)
            *   DFB-포칼 (DFB-Pokal)
            *   UEFA 챔피언스리그 (UEFA Champions League)
            *   UEFA 유로파리그 (UEFA Europa League)
        *   **국제 대회:**
            *   FIFA 월드컵 (FIFA World Cup)
            *   FIFA 클럽 월드컵 (FIFA Club World Cup)
            *   각 대륙별 네이션스컵 (예: AFC 아시안컵, UEFA 유로)

*   **1.3. 데이터 호출 전략:**
    *   **전략: 병렬 API 호출 후 결과 조합**
    *   **장점:**
        *   **응답 속도 최적화:** 여러 리그의 경기 정보를 동시에 요청하므로, 순차적으로 호출하는 것보다 전체 대기 시간을 크게 단축할 수 있습니다. Coroutine의 `async/await`을 활용하여 병렬 처리를 구현합니다.
        *   **독립적인 오류 처리:** 특정 리그의 API 호출이 실패하더라도 다른 리그의 결과에는 영향을 주지 않아, 부분적인 데이터 표시가 가능합니다.
    *   **단점:**
        *   **일시적인 API 부하 증가:** 단시간에 여러 번의 API 호출이 발생하지만, 주요 리그 수가 제한적이므로 서버에 큰 부담을 주지는 않을 것으로 예상됩니다.
    *   **결론:** 사용자 경험 측면에서 응답 속도가 매우 중요하므로, **병렬 호출 방식**을 채택하는 것이 가장 효율적입니다.

**2. UI/UX 설계 제안**

*   **2.1. 날짜 선택 UI:**
    *   `FixturesScreen.kt` 상단에 수평으로 스크롤 가능한 캘린더 UI를 추가합니다.
    *   사용자는 이 캘린더를 통해 원하는 날짜를 쉽게 선택할 수 있으며, 선택된 날짜는 시각적으로 강조 표시됩니다.
    *   기본적으로는 오늘 날짜가 선택되어 있도록 합니다.
    *   Mermaid 다이어그램:
        ```mermaid
        graph TD
            A[FixturesScreen] --> B{Horizontal Calendar};
            B --> C[Date Selection];
            C --> D[Update Fixtures List];
        ```

*   **2.2. 경기 목록 UI:**
    *   가져온 경기 목록은 `LazyColumn`을 사용하여 표시합니다.
    *   `stickyHeader`를 사용하여 각 리그/대회 이름을 헤더로 표시하고, 그 아래에 해당 대회의 경기들을 목록 형태로 보여줍니다.
    *   예시:
        *   **프리미어리그**
            *   맨체스터 유나이TED vs 첼시
            *   리버풀 vs 아스날
        *   **라리가**
            *   레알 마드리드 vs 바르셀로나
    *   Mermaid 다이어그램:
        ```mermaid
        sequenceDiagram
            participant User
            participant FixturesScreen
            User->>FixturesScreen: Selects a date
            FixturesScreen->>FixturesScreen: Displays grouped fixtures
        ```

**3. 아키텍처 및 데이터 흐름 설계**

*   **3.1. 데이터 흐름:**
    1.  **View (`FixturesScreen`):** 사용자가 캘린더에서 날짜를 선택하면, `FixturesViewModel`의 `loadFixtures(date)` 함수를 호출합니다.
    2.  **ViewModel (`FixturesViewModel`):** `GetFixturesUseCase`를 주입받아, 선택된 날짜를 인자로 전달하여 `invoke()` 함수를 호출합니다.
    3.  **UseCase (`GetFixturesUseCase`):** `FootballRepository`를 통해 주요 리그 목록에 대한 경기 정보를 병렬로 요청하고, 결과를 조합하여 ViewModel에 전달합니다.
    4.  **Repository (`FootballRepositoryImpl`):**
        *   `FootballApiService`를 사용하여 각 리그의 경기 정보를 API로부터 가져옵니다.
        *   가져온 데이터를 `FixtureEntity`로 변환하여 Room DB에 캐싱합니다.
        *   DB에 캐시된 데이터가 유효한 경우(예: 특정 시간 내), API 호출 대신 캐시된 데이터를 반환합니다.
    5.  **ViewModel:** UseCase로부터 받은 경기 목록 데이터를 리그별로 그룹화하여 `FixturesState`를 업데이트합니다.
    6.  **View:** `FixturesState`의 변경을 감지하고, 그룹화된 경기 목록을 UI에 렌더링합니다.
    *   Mermaid 다이어그램:
        ```mermaid
        graph TD
            A[FixturesScreen] -- 1. Select Date --> B[FixturesViewModel];
            B -- 2. loadFixtures(date) --> C[GetFixturesUseCase];
            C -- 3. getFixtures(date, leagueIds) --> D[FootballRepositoryImpl];
            D -- 4. API Call / DB Cache --> E[FootballApiService / Room DB];
            E -- 5. Return Data --> D;
            D -- 6. Return Combined Data --> C;
            C -- 7. Return Grouped Data --> B;
            B -- 8. Update State --> A;
            A -- 9. Render UI --> F[User];
        ```

*   **3.2. 캐싱 전략:**
    *   **전략:** "Cache-then-network"
    *   **구현:**
        1.  `FootballRepositoryImpl`에서 경기 정보를 요청받으면, 먼저 Room DB에서 해당 날짜와 리그에 대한 데이터가 있는지 확인합니다.
        2.  캐시된 데이터가 있고, 마지막으로 업데이트된 시간이 일정 시간(예: 5분) 이내라면 캐시된 데이터를 즉시 반환합니다.
        3.  캐시가 없거나 오래되었다면, API를 통해 새로운 데이터를 가져옵니다.
        4.  가져온 새로운 데이터는 Room DB에 저장(기존 데이터는 덮어쓰기)하고, 사용자에게 반환합니다.
    *   **장점:** 오프라인 지원 및 빠른 초기 로딩 속도를 제공하며, 불필요한 API 호출을 줄여 비용을 절감합니다.

*   **3.3. 데이터 모델 변경:**
    *   **DTO (`FixtureDto.kt`):** API 응답 구조에 맞게 유지합니다.
    *   **Entity (`FixtureEntity.kt`):** `leagueId`와 `leagueName` 필드를 추가하여, 어떤 리그에 속한 경기인지 식별할 수 있도록 합니다.
    *   **Domain Model (`Fixture.kt`):** 기존 구조를 유지하되, UI에서 리그별 그룹화를 위해 `Map<League, List<Fixture>>` 형태의 데이터 구조를 사용하도록 `GetFixturesUseCase` 또는 `FixturesViewModel`에서 데이터를 가공합니다.