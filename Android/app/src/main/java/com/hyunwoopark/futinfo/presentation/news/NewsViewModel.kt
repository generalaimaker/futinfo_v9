package com.hyunwoopark.futinfo.presentation.news

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.hyunwoopark.futinfo.domain.model.NewsArticle
import com.hyunwoopark.futinfo.domain.use_case.GetNewsUseCase
import com.hyunwoopark.futinfo.util.Resource
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asSharedFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.launchIn
import kotlinx.coroutines.flow.onEach
import kotlinx.coroutines.launch
import javax.inject.Inject

/**
 * 뉴스 화면의 ViewModel
 * 
 * Clean Architecture의 Presentation Layer에서 UI 상태를 관리하고
 * Use Case를 통해 비즈니스 로직을 처리합니다.
 * Hilt를 사용한 의존성 주입을 지원합니다.
 */
@HiltViewModel
class NewsViewModel @Inject constructor(
    private val getNewsUseCase: GetNewsUseCase
) : ViewModel() {

    private val _state = MutableStateFlow(NewsState())
    val state: StateFlow<NewsState> = _state.asStateFlow()

    private val _uiEffect = MutableSharedFlow<NewsUiEffect>()
    val uiEffect = _uiEffect.asSharedFlow()

    private var searchJob: Job? = null
    private var loadNewsJob: Job? = null

    init {
        // 초기 뉴스 로드
        loadNews()
    }

    /**
     * 뉴스 이벤트를 처리합니다.
     */
    fun onEvent(event: NewsEvent) {
        when (event) {
            is NewsEvent.LoadNews -> loadNews()
            is NewsEvent.RefreshNews -> refreshNews()
            is NewsEvent.LoadMoreNews -> loadMoreNews()
            is NewsEvent.SearchNews -> searchNews(event.query)
            is NewsEvent.FilterByCategory -> filterByCategory(event.category)
            is NewsEvent.FilterByImportance -> filterByImportance(event.importance)
            is NewsEvent.SortNews -> sortNews(event.sortOption)
            is NewsEvent.SelectNewsArticle -> selectNewsArticle(event.article)
            is NewsEvent.ClearSelectedArticle -> clearSelectedArticle()
            is NewsEvent.ToggleCategoryFilter -> toggleCategoryFilter()
            is NewsEvent.ToggleImportanceFilter -> toggleImportanceFilter()
            is NewsEvent.ClearSearch -> clearSearch()
            is NewsEvent.ClearError -> clearError()
            is NewsEvent.OpenNewsUrl -> openNewsUrl(event.url)
            is NewsEvent.ShareNews -> shareNews(event.article)
            is NewsEvent.BookmarkNews -> bookmarkNews(event.article)
            // 새로운 고급 필터링 이벤트들
            is NewsEvent.FilterByDateRange -> filterByDateRange(event.startDate, event.endDate)
            is NewsEvent.ApplyAdvancedFilters -> applyAdvancedFilters(event.keyword, event.category, event.startDate, event.endDate)
            is NewsEvent.ShowFilterBottomSheet -> showFilterBottomSheet()
            is NewsEvent.HideFilterBottomSheet -> hideFilterBottomSheet()
            is NewsEvent.ClearAllFilters -> clearAllFilters()
        }
    }

    /**
     * 뉴스를 로드합니다.
     */
    private fun loadNews() {
        loadNewsJob?.cancel()
        loadNewsJob = getNewsUseCase()
            .onEach { result ->
                when (result) {
                    is Resource.Loading -> {
                        _state.value = _state.value.copy(
                            isLoading = true,
                            error = null
                        )
                    }
                    is Resource.Success -> {
                        val articles = result.data ?: emptyList()
                        _state.value = _state.value.copy(
                            newsArticles = articles,
                            filteredNewsArticles = applyFilters(articles),
                            isLoading = false,
                            error = null,
                            currentPage = 1,
                            hasMorePages = articles.size >= 20
                        )
                    }
                    is Resource.Error -> {
                        _state.value = _state.value.copy(
                            isLoading = false,
                            error = result.message
                        )
                        _uiEffect.tryEmit(NewsUiEffect.ShowError(
                            result.message ?: "뉴스를 불러오는 중 오류가 발생했습니다."
                        ))
                    }
                }
            }
            .launchIn(viewModelScope)
    }

    /**
     * 뉴스를 새로고침합니다.
     */
    private fun refreshNews() {
        loadNewsJob?.cancel()
        loadNewsJob = getNewsUseCase()
            .onEach { result ->
                when (result) {
                    is Resource.Loading -> {
                        _state.value = _state.value.copy(
                            isRefreshing = true,
                            error = null
                        )
                    }
                    is Resource.Success -> {
                        val articles = result.data ?: emptyList()
                        _state.value = _state.value.copy(
                            newsArticles = articles,
                            filteredNewsArticles = applyFilters(articles),
                            isRefreshing = false,
                            error = null,
                            currentPage = 1,
                            hasMorePages = articles.size >= 20
                        )
                        _uiEffect.tryEmit(NewsUiEffect.ScrollToTop)
                        _uiEffect.tryEmit(NewsUiEffect.ShowSuccess("뉴스가 업데이트되었습니다."))
                    }
                    is Resource.Error -> {
                        _state.value = _state.value.copy(
                            isRefreshing = false,
                            error = result.message
                        )
                        _uiEffect.tryEmit(NewsUiEffect.ShowError(
                            result.message ?: "뉴스를 새로고침하는 중 오류가 발생했습니다."
                        ))
                    }
                }
            }
            .launchIn(viewModelScope)
    }

    /**
     * 더 많은 뉴스를 로드합니다 (페이징).
     */
    private fun loadMoreNews() {
        if (_state.value.isLoadingMore || !_state.value.hasMorePages) return

        val nextPage = _state.value.currentPage + 1
        
        getNewsUseCase(maxResults = 20)
            .onEach { result ->
                when (result) {
                    is Resource.Loading -> {
                        _state.value = _state.value.copy(isLoadingMore = true)
                    }
                    is Resource.Success -> {
                        val newArticles = result.data ?: emptyList()
                        val allArticles = _state.value.newsArticles + newArticles
                        
                        _state.value = _state.value.copy(
                            newsArticles = allArticles,
                            filteredNewsArticles = applyFilters(allArticles),
                            isLoadingMore = false,
                            currentPage = nextPage,
                            hasMorePages = newArticles.size >= 20
                        )
                    }
                    is Resource.Error -> {
                        _state.value = _state.value.copy(isLoadingMore = false)
                        _uiEffect.tryEmit(NewsUiEffect.ShowError(
                            "추가 뉴스를 불러오는 중 오류가 발생했습니다."
                        ))
                    }
                }
            }
            .launchIn(viewModelScope)
    }

    /**
     * 뉴스를 검색합니다.
     */
    private fun searchNews(query: String) {
        searchJob?.cancel()
        
        _state.value = _state.value.copy(
            searchQuery = query,
            isSearchActive = query.isNotBlank()
        )

        if (query.isBlank()) {
            _state.value = _state.value.copy(
                filteredNewsArticles = applyFilters(_state.value.newsArticles)
            )
            return
        }

        searchJob = viewModelScope.launch {
            delay(300) // 디바운싱
            
            getNewsUseCase(query = query)
                .onEach { result ->
                    when (result) {
                        is Resource.Loading -> {
                            _state.value = _state.value.copy(isLoading = true)
                        }
                        is Resource.Success -> {
                            val articles = result.data ?: emptyList()
                            _state.value = _state.value.copy(
                                filteredNewsArticles = applyFilters(articles),
                                isLoading = false
                            )
                        }
                        is Resource.Error -> {
                            _state.value = _state.value.copy(isLoading = false)
                            _uiEffect.tryEmit(NewsUiEffect.ShowError(
                                "검색 중 오류가 발생했습니다."
                            ))
                        }
                    }
                }
                .launchIn(this)
        }
    }

    /**
     * 카테고리별로 필터링합니다.
     */
    private fun filterByCategory(category: NewsCategory) {
        _state.value = _state.value.copy(
            selectedCategory = category,
            filteredNewsArticles = applyFilters(_state.value.newsArticles)
        )
    }

    /**
     * 중요도별로 필터링합니다.
     */
    private fun filterByImportance(importance: NewsImportance) {
        _state.value = _state.value.copy(
            selectedImportance = importance,
            filteredNewsArticles = applyFilters(_state.value.newsArticles)
        )
    }

    /**
     * 뉴스를 정렬합니다.
     */
    private fun sortNews(sortOption: NewsSortOption) {
        val sortedArticles = when (sortOption) {
            NewsSortOption.LATEST -> _state.value.filteredNewsArticles.sortedByDescending { it.publishedAt }
            NewsSortOption.IMPORTANCE -> _state.value.filteredNewsArticles.sortedBy { 
                when (it.importance) {
                    com.hyunwoopark.futinfo.domain.model.NewsImportance.BREAKING -> 0
                    com.hyunwoopark.futinfo.domain.model.NewsImportance.IMPORTANT -> 1
                    com.hyunwoopark.futinfo.domain.model.NewsImportance.NORMAL -> 2
                }
            }
            NewsSortOption.CREDIBILITY -> _state.value.filteredNewsArticles.sortedBy {
                when (it.credibility) {
                    com.hyunwoopark.futinfo.domain.model.NewsCredibility.HIGH -> 0
                    com.hyunwoopark.futinfo.domain.model.NewsCredibility.MEDIUM -> 1
                    com.hyunwoopark.futinfo.domain.model.NewsCredibility.LOW -> 2
                }
            }
            NewsSortOption.INTEREST -> _state.value.filteredNewsArticles.sortedBy {
                when (it.interestLevel) {
                    com.hyunwoopark.futinfo.domain.model.NewsInterestLevel.VERY_HIGH -> 0
                    com.hyunwoopark.futinfo.domain.model.NewsInterestLevel.HIGH -> 1
                    com.hyunwoopark.futinfo.domain.model.NewsInterestLevel.MEDIUM -> 2
                    com.hyunwoopark.futinfo.domain.model.NewsInterestLevel.LOW -> 3
                }
            }
        }

        _state.value = _state.value.copy(filteredNewsArticles = sortedArticles)
    }

    /**
     * 필터를 적용합니다.
     */
    private fun applyFilters(articles: List<NewsArticle>): List<NewsArticle> {
        var filtered = articles

        // 카테고리 필터
        if (_state.value.selectedCategory != NewsCategory.ALL) {
            filtered = filtered.filter { article ->
                when (_state.value.selectedCategory) {
                    NewsCategory.TRANSFER -> article.category == com.hyunwoopark.futinfo.domain.model.NewsCategory.TRANSFER
                    NewsCategory.MATCH -> article.category == com.hyunwoopark.futinfo.domain.model.NewsCategory.MATCH
                    NewsCategory.INJURY -> article.category == com.hyunwoopark.futinfo.domain.model.NewsCategory.INJURY
                    NewsCategory.INTERNATIONAL -> article.category == com.hyunwoopark.futinfo.domain.model.NewsCategory.INTERNATIONAL
                    NewsCategory.GENERAL -> article.category == com.hyunwoopark.futinfo.domain.model.NewsCategory.GENERAL
                    else -> true
                }
            }
        }

        // 중요도 필터
        if (_state.value.selectedImportance != NewsImportance.ALL) {
            filtered = filtered.filter { article ->
                when (_state.value.selectedImportance) {
                    NewsImportance.BREAKING -> article.importance == com.hyunwoopark.futinfo.domain.model.NewsImportance.BREAKING
                    NewsImportance.IMPORTANT -> article.importance == com.hyunwoopark.futinfo.domain.model.NewsImportance.IMPORTANT
                    NewsImportance.NORMAL -> article.importance == com.hyunwoopark.futinfo.domain.model.NewsImportance.NORMAL
                    else -> true
                }
            }
        }

        // 검색 쿼리 필터
        if (_state.value.searchQuery.isNotBlank()) {
            val query = _state.value.searchQuery.lowercase()
            filtered = filtered.filter { article ->
                article.title.lowercase().contains(query) ||
                article.summary.lowercase().contains(query) ||
                article.source.lowercase().contains(query) ||
                article.tags.any { it.lowercase().contains(query) }
            }
        }

        return filtered
    }

    /**
     * 뉴스 기사를 선택합니다.
     */
    private fun selectNewsArticle(article: NewsArticle) {
        _state.value = _state.value.copy(selectedNewsArticle = article)
    }

    /**
     * 선택된 뉴스 기사를 해제합니다.
     */
    private fun clearSelectedArticle() {
        _state.value = _state.value.copy(selectedNewsArticle = null)
    }

    /**
     * 카테고리 필터 표시를 토글합니다.
     */
    private fun toggleCategoryFilter() {
        _state.value = _state.value.copy(
            showCategoryFilter = !_state.value.showCategoryFilter,
            showImportanceFilter = false
        )
    }

    /**
     * 중요도 필터 표시를 토글합니다.
     */
    private fun toggleImportanceFilter() {
        _state.value = _state.value.copy(
            showImportanceFilter = !_state.value.showImportanceFilter,
            showCategoryFilter = false
        )
    }

    /**
     * 검색을 초기화합니다.
     */
    private fun clearSearch() {
        searchJob?.cancel()
        _state.value = _state.value.copy(
            searchQuery = "",
            isSearchActive = false,
            filteredNewsArticles = applyFilters(_state.value.newsArticles)
        )
    }

    /**
     * 에러를 초기화합니다.
     */
    private fun clearError() {
        _state.value = _state.value.copy(error = null)
    }

    /**
     * 뉴스 URL을 엽니다.
     */
    private fun openNewsUrl(url: String) {
        viewModelScope.launch {
            _uiEffect.emit(NewsUiEffect.NavigateToUrl(url))
        }
    }

    /**
     * 뉴스를 공유합니다.
     */
    private fun shareNews(article: NewsArticle) {
        viewModelScope.launch {
            _uiEffect.emit(NewsUiEffect.ShareContent(article.title, article.url))
        }
    }

    /**
     * 뉴스를 북마크합니다.
     */
    private fun bookmarkNews(article: NewsArticle) {
        viewModelScope.launch {
            // TODO: 북마크 기능 구현
            _uiEffect.emit(NewsUiEffect.ShowSuccess("북마크에 추가되었습니다."))
        }
    }

    /**
     * 날짜 범위로 필터링합니다.
     */
    private fun filterByDateRange(startDate: String?, endDate: String?) {
        _state.value = _state.value.copy(
            startDate = startDate,
            endDate = endDate
        )
        
        // 새로운 필터 조건으로 뉴스를 다시 로드
        loadNewsWithFilters()
    }

    /**
     * 고급 필터를 적용합니다.
     */
    private fun applyAdvancedFilters(query: String?, category: String?, startDate: String?, endDate: String?) {
        _state.value = _state.value.copy(
            searchQuery = query ?: "",
            selectedCategoryString = category,
            startDate = startDate,
            endDate = endDate,
            isSearchActive = !query.isNullOrBlank(),
            showFilterBottomSheet = false
        )
        
        // 새로운 필터 조건으로 뉴스를 다시 로드
        loadNewsWithFilters()
    }

    /**
     * 필터 바텀시트를 표시합니다.
     */
    private fun showFilterBottomSheet() {
        _state.value = _state.value.copy(showFilterBottomSheet = true)
    }

    /**
     * 필터 바텀시트를 숨깁니다.
     */
    private fun hideFilterBottomSheet() {
        _state.value = _state.value.copy(showFilterBottomSheet = false)
    }

    /**
     * 모든 필터를 초기화합니다.
     */
    private fun clearAllFilters() {
        _state.value = _state.value.copy(
            searchQuery = "",
            selectedCategory = NewsCategory.ALL,
            selectedImportance = NewsImportance.ALL,
            selectedCategoryString = null,
            startDate = null,
            endDate = null,
            isSearchActive = false,
            showFilterBottomSheet = false
        )
        
        // 필터 초기화 후 기본 뉴스 로드
        loadNews()
    }

    /**
     * 필터 조건에 따라 뉴스를 로드합니다.
     */
    private fun loadNewsWithFilters() {
        loadNewsJob?.cancel()
        
        val currentState = _state.value
        loadNewsJob = getNewsUseCase(
            query = currentState.searchQuery.ifBlank { "football" },
            maxResults = 20,
            startDate = currentState.startDate,
            endDate = currentState.endDate,
            category = currentState.selectedCategoryString
        )
            .onEach { result ->
                when (result) {
                    is Resource.Loading -> {
                        _state.value = _state.value.copy(
                            isLoading = true,
                            error = null
                        )
                    }
                    is Resource.Success -> {
                        val articles = result.data ?: emptyList()
                        _state.value = _state.value.copy(
                            newsArticles = articles,
                            filteredNewsArticles = applyFilters(articles),
                            isLoading = false,
                            error = null,
                            currentPage = 1,
                            hasMorePages = articles.size >= 20
                        )
                    }
                    is Resource.Error -> {
                        _state.value = _state.value.copy(
                            isLoading = false,
                            error = result.message
                        )
                        _uiEffect.tryEmit(NewsUiEffect.ShowError(
                            result.message ?: "뉴스를 불러오는 중 오류가 발생했습니다."
                        ))
                    }
                }
            }
            .launchIn(viewModelScope)
    }
}