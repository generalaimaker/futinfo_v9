# Android 앱 아키텍처 설계안

iOS 앱 분석 결과를 바탕으로, 현대적이고 확장 가능한 안드로이드 앱 아키텍처를 다음과 같이 설계합니다.

### 1. **아키텍처 개요**

Google의 'Guide to app architecture'를 기반으로 한 현대적인 안드로이드 MVVM 아키텍처를 채택합니다. 이 아키텍처는 관심사의 분리(Separation of Concerns) 원칙을 따르며, 각 계층이 독립적으로 개발되고 테스트될 수 있도록 합니다.

주요 계층은 다음과 같이 구성됩니다.

*   **UI Layer (Presentation Layer):** 화면에 데이터를 표시하고 사용자 상호작용을 처리합니다.
*   **Domain Layer (Optional):** UI Layer와 Data Layer 간의 복잡한 비즈니스 로직을 캡슐화합니다. 재사용성을 높이고 UI Layer의 부담을 줄여줍니다.
*   **Data Layer:** 앱의 비즈니스 로직과 데이터 소스를 관리합니다.

```mermaid
graph TD
    A[UI Layer <br> (Activity/Composable, ViewModel)] --> B{Domain Layer <br> (UseCases)};
    B --> C[Data Layer <br> (Repositories)];
    C --> D[Data Sources <br> (Network, Database)];

    subgraph UI Layer
        A
    end

    subgraph Domain Layer
        B
    end

    subgraph Data Layer
        C
    end

    subgraph Data Sources
        D
    end
```

### 2. **기술 스택 선정**

iOS 앱의 기술 스택을 대체할 안드로이드 기술 스택은 다음과 같습니다.

| 구분 | iOS (기존) | Android (신규) | 선택 이유 |
| :--- | :--- | :--- | :--- |
| **UI** | SwiftUI | **Jetpack Compose** | 선언적 UI 툴킷으로, 생산성과 코드 유지보수성을 높입니다. |
| **언어** | Swift | **Kotlin** | Google의 공식 지원 언어로, 간결하고 안전하며 강력한 기능을 제공합니다. |
| **아키텍처** | MVVM | **Android MVVM** | Google에서 권장하는 아키텍처로, ViewModel, Repository, DataSource 패턴을 사용합니다. |
| **비동기 처리** | Swift Concurrency | **Kotlin Coroutines & Flow** | 비동기 코드를 구조화되고 간결하게 작성할 수 있도록 지원합니다. |
| **네트워킹** | `URLSession` | **Retrofit & OkHttp** | 업계 표준으로 자리 잡은 강력하고 유연한 HTTP 클라이언트 라이브러리입니다. |
| **JSON 직렬화** | `Codable` | **Kotlinx.serialization** | Kotlin과 완벽하게 통합되며, 리플렉션 없이 컴파일 타임에 코드를 생성하여 성능이 우수합니다. |
| **데이터베이스** | Core Data | **Room** | SQLite를 추상화하여 보일러플레이트 코드를 줄이고 컴파일 타임에 SQL 쿼리를 검증합니다. |
| **의존성 주입** | 수동 또는 없음 | **Hilt** | 보일러플레이트 코드를 크게 줄여주는 Android의 공식 DI 라이브러리입니다. |

### 3. **컴포넌트 매핑 계획**

iOS 앱의 주요 구성 요소를 안드로이드 아키텍처의 구성 요소로 다음과 같이 매핑합니다.

| iOS Component (Swift) | Android Component (Kotlin) | 역할 및 설명 |
| :--- | :--- | :--- |
| **View** (`SwiftUI.View`) | **Composable Function** (`@Composable`) | UI의 구조, 레이아웃, 로직을 정의하는 선언적 함수입니다. `Activity` 또는 `Fragment`가 화면의 진입점 역할을 하고, 그 안에서 Composable 함수들이 UI를 구성합니다. |
| **ViewModel** (`ObservableObject`) | **ViewModel** (`androidx.lifecycle.ViewModel`) | UI 상태(`StateFlow`)를 소유하고 UI에 노출하며, 사용자 이벤트에 대한 비즈니스 로직을 처리합니다. 생명주기를 인지하여 메모리 누수를 방지합니다. |
| **Model** (`Codable Struct/Class`) | **Data Class** (`data class`) | 불변(immutable) 데이터 객체를 표현합니다. API 응답(DTO), 데이터베이스 엔티티(Entity), UI 상태(UI State) 등 다양한 용도로 사용됩니다. |
| **Service** (e.g., `FootballAPIService`, `CoreDataManager`) | **Repository** & **DataSource** | 데이터 접근을 추상화합니다. **Repository**는 하나 이상의 데이터 소스(DataSource)를 조합하여 UI에 필요한 데이터를 제공합니다. **DataSource**는 네트워크 API, 로컬 데이터베이스 등 특정 데이터 소스와의 상호작용을 담당합니다. |

### 4. **제안하는 패키지 구조**

설계된 아키텍처를 기반으로 다음과 같은 패키지 구조를 제안합니다.

```
com.hyunwoopark.futinfo/
├── data/
│   ├── local/
│   │   ├── dao/
│   │   ├── entity/
│   │   └── FutInfoDatabase.kt
│   ├── remote/
│   │   ├── api/
│   │   └── dto/
│   └── repository/
│       └── FootballRepositoryImpl.kt
├── di/
│   └── AppModule.kt
├── domain/
│   ├── model/
│   ├── repository/
│   │   └── FootballRepository.kt
│   └── usecase/
├── ui/
│   ├── screens/
│   │   ├── playerprofile/
│   │   │   ├── PlayerProfileScreen.kt
│   │   │   └── PlayerProfileViewModel.kt
│   │   └── ...
│   ├── components/
│   └── theme/
└── FutInfoApplication.kt