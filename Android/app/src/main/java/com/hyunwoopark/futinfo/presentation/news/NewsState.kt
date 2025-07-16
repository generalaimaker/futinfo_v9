package com.hyunwoopark.futinfo.presentation.news

import com.hyunwoopark.futinfo.domain.model.NewsArticle

/**
 * 뉴스 화면의 UI 상태를 관리하는 데이터 클래스
 * 
 * Clean Architecture의 Presentation Layer에서 UI 상태를 정의합니다.
 * 뉴스 목록, 로딩 상태, 에러 상태, 필터링 옵션 등을 포함합니다.
 */
data class NewsState(
    // 뉴스 데이터
    val newsArticles: List<NewsArticle> = emptyList(),
    val filteredNewsArticles: List<NewsArticle> = emptyList(),
    
    // 로딩 상태
    val isLoading: Boolean = false,
    val isRefreshing: Boolean = false,
    
    // 에러 상태
    val error: String? = null,
    
    // 필터링 및 검색
    val selectedCategory: NewsCategory = NewsCategory.ALL,
    val selectedCategoryString: String? = null,
    val selectedImportance: NewsImportance = NewsImportance.ALL,
    val searchQuery: String = "",
    val isSearchActive: Boolean = false,
    val startDate: String? = null,
    val endDate: String? = null,
    val showFilterBottomSheet: Boolean = false,
    
    // UI 상태
    val showCategoryFilter: Boolean = false,
    val showImportanceFilter: Boolean = false,
    val selectedNewsArticle: NewsArticle? = null,
    
    // 페이징
    val currentPage: Int = 1,
    val hasMorePages: Boolean = true,
    val isLoadingMore: Boolean = false,
    
    // 추가 필드 (iOS 호환성을 위해)
    val hasMore: Boolean = true
) {
    // iOS 호환성을 위한 헬퍼 메서드
    fun openUrl(url: String) = NewsEvent.OpenNewsUrl(url)
    fun shareArticle(article: NewsArticle) = NewsEvent.ShareNews(article)
}

/**
 * 뉴스 카테고리 필터 옵션
 */
enum class NewsCategory(val displayName: String, val apiQuery: String) {
    ALL("전체", "football"),
    TRANSFER("이적", "transfer"),
    MATCH("경기", "match"),
    INJURY("부상", "injury"),
    INTERNATIONAL("국가대표", "international"),
    GENERAL("일반", "general")
}

/**
 * 뉴스 중요도 필터 옵션
 */
enum class NewsImportance(val displayName: String) {
    ALL("전체"),
    BREAKING("속보"),
    IMPORTANT("중요"),
    NORMAL("일반")
}

/**
 * 뉴스 정렬 옵션
 */
enum class NewsSortOption(val displayName: String) {
    LATEST("최신순"),
    IMPORTANCE("중요도순"),
    CREDIBILITY("신뢰도순"),
    INTEREST("관심도순")
}

/**
 * 뉴스 화면에서 발생할 수 있는 이벤트들
 */
sealed class NewsEvent {
    // 데이터 로딩
    object LoadNews : NewsEvent()
    object RefreshNews : NewsEvent()
    object LoadMoreNews : NewsEvent()
    
    // 검색 및 필터링
    data class SearchNews(val query: String) : NewsEvent()
    data class FilterByCategory(val category: NewsCategory) : NewsEvent()
    data class FilterByImportance(val importance: NewsImportance) : NewsEvent()
    data class SortNews(val sortOption: NewsSortOption) : NewsEvent()
    data class FilterByDateRange(val startDate: String?, val endDate: String?) : NewsEvent()
    data class ApplyAdvancedFilters(
        val keyword: String?,
        val category: String?,
        val startDate: String?,
        val endDate: String?,
        val importance: NewsImportance? = null
    ) : NewsEvent()
    
    // UI 상호작용
    data class SelectNewsArticle(val article: NewsArticle) : NewsEvent()
    object ClearSelectedArticle : NewsEvent()
    object ToggleCategoryFilter : NewsEvent()
    object ToggleImportanceFilter : NewsEvent()
    object ShowFilterBottomSheet : NewsEvent()
    object HideFilterBottomSheet : NewsEvent()
    object ClearSearch : NewsEvent()
    object ClearAllFilters : NewsEvent()
    
    // 에러 처리
    object ClearError : NewsEvent()
    
    // 외부 링크
    data class OpenNewsUrl(val url: String) : NewsEvent()
    data class ShareNews(val article: NewsArticle) : NewsEvent()
    data class BookmarkNews(val article: NewsArticle) : NewsEvent()
}

/**
 * 뉴스 화면의 UI 효과 (일회성 이벤트)
 */
sealed class NewsUiEffect {
    data class ShowError(val message: String) : NewsUiEffect()
    data class ShowSuccess(val message: String) : NewsUiEffect()
    data class NavigateToUrl(val url: String) : NewsUiEffect()
    data class ShareContent(val title: String, val url: String) : NewsUiEffect()
    object ScrollToTop : NewsUiEffect()
}

/**
 * 뉴스 목록 아이템의 표시 모드
 */
enum class NewsDisplayMode {
    CARD,       // 카드 형태 (이미지 포함)
    LIST,       // 리스트 형태 (간단한 정보)
    COMPACT     // 컴팩트 형태 (최소한의 정보)
}

/**
 * 뉴스 필터 설정
 */
data class NewsFilter(
    val category: NewsCategory = NewsCategory.ALL,
    val importance: NewsImportance = NewsImportance.ALL,
    val sortOption: NewsSortOption = NewsSortOption.LATEST,
    val searchQuery: String = "",
    val dateRange: DateRange? = null,
    val sources: List<String> = emptyList()
)

/**
 * 날짜 범위 필터
 */
data class DateRange(
    val startDate: String,
    val endDate: String
)

/**
 * 뉴스 화면의 탭 옵션
 */
enum class NewsTab(val displayName: String, val category: NewsCategory) {
    ALL("전체", NewsCategory.ALL),
    TRANSFER("이적", NewsCategory.TRANSFER),
    MATCH("경기", NewsCategory.MATCH),
    BREAKING("속보", NewsCategory.ALL) // 중요도로 필터링
}