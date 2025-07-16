# iOS vs Android 아키텍처 비교 분석

이 문서는 FutInfo 프로젝트의 iOS와 안드로이드 애플리케이션 아키텍처를 비교 분석합니다.
## 1. 아키텍처 비교 분석

두 플랫폼은 동일한 '축구 정보 제공'이라는 목표를 가지고 있지만, 아키텍처 설계 철학에서 뚜렷한 차이를 보입니다. iOS는 빠른 개발과 단순성에 중점을 둔 전통적인 MVVM 패턴을 사용하는 반면, 안드로이드는 계층 간의 역할을 명확히 분리하여 테스트 용이성과 유지보수성을 극대화하는 Clean Architecture를 채택했습니다.

### 1.1. 의존성 관리 (Dependency Injection)

의존성 관리는 아키텍처의 유연성과 테스트 용이성을 결정하는 핵심 요소입니다.

*   **iOS: 싱글톤 (Singleton) / 서비스 로케이터 (Service Locator)**
    *   iOS 프로젝트는 `FootballAPIService.shared`와 같이 싱글톤 패턴을 사용하여 서비스 객체에 접근합니다.
    *   **장점:** 구현이 매우 간단하고, 어느 곳에서나 쉽게 서비스에 접근할 수 있어 개발 속도가 빠릅니다.
    *   **단점:** ViewModel이 `FootballAPIService`라는 구체적인 클래스에 직접 의존하게 되어 결합도가 높아집니다. 이는 단위 테스트 시 싱글톤 객체를 Mock(가짜 객체)으로 대체하기 어렵게 만들어 테스트의 복잡성을 증가시킵니다.

*   **Android: 의존성 주입 (Hilt)**
    *   안드로이드 프로젝트는 Hilt 라이브러리를 사용하여 컴파일 타임에 의존성을 자동으로 주입합니다.
    *   `@Module`, `@Provides`, `@Inject` 등의 어노테이션을 통해 객체 생성과 주입을 프레임워크에 위임합니다.
    *   **장점:** 클래스 간의 결합도를 크게 낮춥니다. `ViewModel`은 `FootballRepository`라는 인터페이스에만 의존하므로, 테스트 시 실제 구현 대신 가짜 구현체를 쉽게 주입할 수 있어 테스트가 매우 용이합니다.
    *   **단점:** 초기 설정과 학습 곡선이 싱글톤 패턴에 비해 상대적으로 높습니다.

### 1.2. 데이터 흐름 (Data Flow)

데이터가 사용자 인터페이스까지 전달되는 과정은 아키텍처의 핵심적인 차이를 보여줍니다.

*   **iOS: 단순한 단방향 흐름 (View → ViewModel → Service)**
    *   사용자 입력은 View에서 ViewModel로 전달됩니다.
    *   ViewModel은 싱글톤 서비스(`FootballAPIService`)를 직접 호출하여 데이터를 요청합니다.
    *   서비스로부터 받은 데이터로 ViewModel의 상태(`@Published` 프로퍼티)가 업데이트되면, SwiftUI가 자동으로 View를 다시 렌더링합니다.
    ```mermaid
    graph TD
        subgraph iOS (MVVM)
            A[View] -- User Action --> B(ViewModel);
            B -- Request Data --> C{Service (Singleton)};
            C -- Response --> B;
            B -- Update State (@Published) --> A;
        end
    ```

*   **Android: 계층화된 단방향 흐름 (View → ViewModel → UseCase → Repository)**
    *   데이터 흐름이 Presentation, Domain, Data라는 명확한 계층으로 분리되어 있습니다.
    *   ViewModel은 특정 비즈니스 로직을 담고 있는 `UseCase`를 호출합니다.
    *   `UseCase`는 데이터 소스를 추상화한 `Repository` 인터페이스를 통해 데이터를 요청합니다.
    *   `Repository` 구현체(`RepositoryImpl`)가 실제 데이터 소스(API)와 통신합니다. 이 흐름을 통해 각 계층은 자신의 책임에만 집중할 수 있습니다.
    ```mermaid
    graph TD
        subgraph Android (Clean Architecture)
            A[View] -- User Action --> B(ViewModel);
            B -- Execute --> C(UseCase);
            C -- Request Data --> D{Repository (Interface)};
            D -- Fetches from --> E[DataSource (API)];
            E -- Response --> D;
            D -- Returns Data --> C;
            C -- Returns Result --> B;
            B -- Update State (StateFlow) --> A;
        end
    ```

### 1.3. 상태 관리 (State Management)

UI의 상태를 관리하고 업데이트하는 방식에서도 두 플랫폼은 다른 접근 방식을 취합니다.

*   **iOS: 개별적인 상태 선언 (`@Published`)**
    *   `FixturesViewModel.swift`를 보면, `fixtures`, `isLoading`, `errorMessage` 등 UI에 필요한 각 상태가 `@Published` 프로퍼티 래퍼를 통해 개별적으로 선언됩니다.
    *   **방식:** 상태가 변경될 때마다 해당 프로퍼티가 SwiftUI View에 변경 사항을 알리고, View는 필요한 부분만 업데이트합니다.
    *   **특징:** 직관적이고 간단하지만, 화면이 복잡해지고 관리해야 할 상태가 많아지면 상태 간의 의존성이 복잡해지거나 일관성을 잃기 쉬울 수 있습니다.

*   **Android: 단일 상태 객체 (Single State Object) 및 UDF**
    *   `FixturesState.kt`와 같이, 화면에 필요한 모든 상태(`fixtures`, `isLoading`, `errorMessage`)를 포함하는 `FixturesState`라는 단일 `data class`를 정의합니다.
    *   `FixturesViewModel.kt`에서는 이 `FixturesState` 객체를 `MutableStateFlow`로 감싸 관리합니다.
    *   **방식:** 데이터 로딩, 성공, 실패 등 이벤트가 발생할 때마다 `copy()` 메소드를 사용하여 기존 상태 객체의 복사본을 만들고 변경된 값만 업데이트하여 새로운 상태 객체를 생성합니다. 이 새로운 객체가 `StateFlow`를 통해 UI로 전달됩니다.
    *   **특징:** **단방향 데이터 흐름(Unidirectional Data Flow, UDF)**을 강제합니다. UI 상태는 항상 단 하나의 객체(Single Source of Truth)이므로 상태를 예측하고 디버깅하기 용이하며, 상태 변화의 원인을 추적하기 쉽습니다.
## 2. 기술 스택 비교

| 구분 | iOS | Android | 비고 |
| :--- | :--- | :--- | :--- |
| **UI 프레임워크** | SwiftUI | Jetpack Compose | 두 플랫폼 모두 선언형 UI 프레임워크를 사용하여 생산성을 높임 |
| **의존성 주입** | 수동 (싱글톤) | Hilt | 안드로이드가 테스트 용이성과 결합도 측면에서 더 구조적인 접근 |
| **비동기 처리** | Swift Concurrency (`async`/`await`) | Kotlin Coroutines (`Flow`) | 유사한 구조의 최신 비동기 처리 방식을 사용 |
| **네트워킹** | URLSession (내장 프레임워크) | Retrofit & OkHttp | 안드로이드는 인터페이스 기반의 타입-세이프 클라이언트를 제공하는 Retrofit을 통해 보일러플레이트 코드를 줄임 |
| **JSON 파싱** | Codable (내장 프레임워크) | Kotlinx.serialization | 두 플랫폼 모두 타입-세이프하고 효율적인 JSON 처리를 지원 |
| **이미지 로딩** | AsyncImage (SwiftUI 내장) | Coil | 안드로이드의 Coil은 캐싱, 변환 등 더 풍부한 기능을 제공하는 전문 라이브러리 |
| **데이터베이스** | Core Data | (사용 안 함) | iOS는 로컬 캐싱 및 데이터 영속성을 위해 Core Data를 활용 |

## 3. 결론

FutInfo 프로젝트의 iOS와 안드로이드 앱은 각 플랫폼의 특성과 생태계에 맞춰 서로 다른 아키텍처 전략을 채택했습니다.

*   **iOS 앱**은 SwiftUI의 기능을 최대한 활용하는 **단순하고 빠른 MVVM 아키텍처**를 선택했습니다. 싱글톤을 이용한 서비스 접근은 초기 개발 속도를 높이는 데 유리하지만, 프로젝트 규모가 커질수록 의존성 관리와 테스트 코드 작성에 어려움을 겪을 수 있습니다. 이는 신속한 프로토타이핑이나 소규모 팀에 적합한 실용적인 접근 방식일 수 있습니다.

*   **안드로이드 앱**은 **Clean Architecture**를 도입하여 장기적인 유지보수성과 확장성, 그리고 테스트 용이성을 확보했습니다. 계층 간의 역할과 책임을 명확히 분리하고 Hilt를 통해 의존성을 관리함으로써, 복잡한 비즈니스 로직을 체계적으로 다룰 수 있는 견고한 기반을 마련했습니다. 이는 대규모 프로젝트나 장기간에 걸쳐 유지보수되어야 하는 애플리케이션에 더 적합한 구조입니다.

결론적으로, 두 프로젝트는 각기 다른 장단점을 가진 아키텍처를 통해 동일한 목표를 성공적으로 구현하고 있습니다. 이는 '완벽한 아키텍처'란 없으며, 프로젝트의 요구사항, 팀의 성향, 플랫폼의 특성을 고려한 **상황에 맞는 최적의 아키텍처**를 선택하는 것이 중요함을 보여주는 좋은 사례입니다.