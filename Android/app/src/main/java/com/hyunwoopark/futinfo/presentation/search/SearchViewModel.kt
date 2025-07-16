package com.hyunwoopark.futinfo.presentation.search

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.hyunwoopark.futinfo.data.local.SearchMappings
import com.hyunwoopark.futinfo.domain.use_case.SearchTeamsUseCase
import com.hyunwoopark.futinfo.domain.use_case.SearchPlayersUseCase
import com.hyunwoopark.futinfo.util.Resource
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.FlowPreview
import kotlinx.coroutines.async
import kotlinx.coroutines.awaitAll
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.debounce
import kotlinx.coroutines.flow.distinctUntilChanged
import kotlinx.coroutines.flow.filter
import kotlinx.coroutines.flow.launchIn
import kotlinx.coroutines.flow.onEach
import kotlinx.coroutines.launch
import javax.inject.Inject

/**
 * 검색 화면의 ViewModel
 * 
 * 팀과 선수 통합 검색을 지원하고, 한글 검색어를 영문으로 변환합니다.
 * 디바운싱을 통해 사용자 입력이 500ms 동안 멈추었을 때만 검색을 수행합니다.
 */
@OptIn(FlowPreview::class)
@HiltViewModel
class SearchViewModel @Inject constructor(
    private val searchTeamsUseCase: SearchTeamsUseCase,
    private val searchPlayersUseCase: SearchPlayersUseCase
) : ViewModel() {
    
    private val _state = MutableStateFlow(SearchState())
    val state: StateFlow<SearchState> = _state.asStateFlow()
    
    private val _searchQuery = MutableStateFlow("")
    
    init {
        setupSearchDebouncing()
    }
    
    /**
     * 검색어 디바운싱 설정
     * 사용자 입력이 500ms 동안 멈추었을 때만 검색을 수행합니다.
     */
    private fun setupSearchDebouncing() {
        _searchQuery
            .debounce(500L) // 500ms 디바운싱
            .distinctUntilChanged() // 동일한 검색어는 무시
            .filter { it.isNotBlank() } // 빈 검색어는 무시
            .onEach { query ->
                performSearch(query)
            }
            .launchIn(viewModelScope)
    }
    
    /**
     * 사용자가 검색어를 입력할 때 호출되는 함수
     * 
     * @param query 검색어
     */
    fun onSearchQueryChange(query: String) {
        val trimmedQuery = query.trim()
        
        // 상태 업데이트
        _state.value = _state.value.copy(
            searchQuery = trimmedQuery,
            originalQuery = query,
            // 검색어가 비어있으면 결과와 에러 초기화
            searchResults = if (trimmedQuery.isBlank()) emptyList() else _state.value.searchResults,
            teamResults = if (trimmedQuery.isBlank()) emptyList() else _state.value.teamResults,
            playerResults = if (trimmedQuery.isBlank()) emptyList() else _state.value.playerResults,
            errorMessage = if (trimmedQuery.isBlank()) null else _state.value.errorMessage,
            isKoreanSearch = SearchMappings.isKoreanQuery(trimmedQuery),
            translatedQuery = null
        )
        
        // 디바운싱을 위해 검색어 Flow에 방출
        _searchQuery.value = trimmedQuery
    }
    
    /**
     * 실제 검색을 수행하는 함수
     * 
     * @param query 검색어
     */
    private fun performSearch(query: String) {
        viewModelScope.launch {
            _state.value = _state.value.copy(
                isLoading = true,
                errorMessage = null
            )
            
            try {
                // 검색어 정규화
                val normalizedQuery = SearchMappings.normalizeSearchQuery(query)
                
                // 한글 검색어 처리
                val searchQueries = mutableListOf(normalizedQuery)
                var translatedQuery: String? = null
                
                if (SearchMappings.isKoreanQuery(normalizedQuery)) {
                    // 한글을 영문으로 변환
                    SearchMappings.translateKoreanToEnglish(normalizedQuery)?.let { translated ->
                        searchQueries.add(translated)
                        translatedQuery = translated
                    }
                    
                    // 팀 이름으로 선수 검색 매핑 확인
                    SearchMappings.teamToPlayerMapping[normalizedQuery]?.forEach { playerName ->
                        searchQueries.add(playerName)
                    }
                }
                
                // API가 공백 포함 검색어에 문제가 있을 수 있으므로 첫 단어만 사용
                val apiSearchQueries = searchQueries.map { q ->
                    q.split(" ").firstOrNull() ?: q
                }.distinct()
                
                // 병렬로 팀과 선수 검색 수행
                val results = apiSearchQueries.flatMap { searchQuery ->
                    listOf(
                        async {
                            searchTeamsUseCase(searchQuery = searchQuery).collect { resource ->
                                when (resource) {
                                    is Resource.Success -> {
                                        resource.data?.response?.let { teams ->
                                            _state.value = _state.value.copy(
                                                teamResults = (_state.value.teamResults + teams).distinctBy { it.team.id }
                                            )
                                        }
                                    }
                                    else -> {} // Loading, Error 무시
                                }
                            }
                        },
                        // 주요 리그에서 선수 검색
                        *SearchMappings.majorLeagueIds.map { leagueId ->
                            async {
                                searchPlayersUseCase(
                                    searchQuery = searchQuery,
                                    league = leagueId,
                                    season = 2025
                                ).collect { resource ->
                                    when (resource) {
                                        is Resource.Success -> {
                                            resource.data?.response?.let { players ->
                                                _state.value = _state.value.copy(
                                                    playerResults = (_state.value.playerResults + players).distinctBy { it.player.id }
                                                )
                                            }
                                        }
                                        else -> {} // Loading, Error 무시
                                    }
                                }
                            }
                        }.toTypedArray()
                    )
                }
                
                // 모든 검색 완료 대기
                results.awaitAll()
                
                // 통합 검색 결과 생성 및 정렬
                val combinedResults = sortSearchResults(
                    teams = _state.value.teamResults,
                    players = _state.value.playerResults,
                    query = normalizedQuery
                )
                
                _state.value = _state.value.copy(
                    searchResults = combinedResults,
                    isLoading = false,
                    translatedQuery = translatedQuery
                )
                
            } catch (e: Exception) {
                _state.value = _state.value.copy(
                    isLoading = false,
                    errorMessage = e.localizedMessage ?: "검색 중 오류가 발생했습니다."
                )
            }
        }
    }
    
    /**
     * 검색 결과를 정렬합니다.
     * 1. 정확한 이름 일치 우선
     * 2. 인기 팀 우선
     * 3. 시작 문자열 일치 우선
     * 4. 이름순 정렬
     */
    private fun sortSearchResults(
        teams: List<com.hyunwoopark.futinfo.data.remote.dto.TeamSearchResultDto>,
        players: List<com.hyunwoopark.futinfo.data.remote.dto.PlayerSearchResultDto>,
        query: String
    ): List<SearchResultItem> {
        val lowerQuery = query.lowercase()
        
        // 팀 정렬
        val sortedTeams = teams.sortedWith(compareBy(
            // 1. 정확한 이름 일치
            { it.team.name.lowercase() != lowerQuery },
            // 2. 인기 팀 여부
            { !SearchMappings.popularTeamIds.contains(it.team.id) },
            // 3. 시작 문자열 일치
            { !it.team.name.lowercase().startsWith(lowerQuery) },
            // 4. 이름순
            { it.team.name }
        )).map { SearchResultItem.Team(it) }
        
        // 선수 정렬
        val sortedPlayers = players.sortedWith(compareBy(
            // 1. 정확한 이름 일치
            { it.player.name.lowercase() != lowerQuery },
            // 2. 시작 문자열 일치
            { !it.player.name.lowercase().startsWith(lowerQuery) },
            // 3. 이름순
            { it.player.name }
        )).map { SearchResultItem.Player(it) }
        
        // 팀을 먼저, 그 다음 선수를 표시
        return sortedTeams + sortedPlayers
    }
    
    /**
     * 검색 결과를 초기화합니다.
     */
    fun clearSearchResults() {
        _state.value = SearchState()
        _searchQuery.value = ""
    }
    
    /**
     * 에러 메시지를 초기화합니다.
     */
    fun clearError() {
        _state.value = _state.value.copy(errorMessage = null)
    }
    
    /**
     * 수동으로 검색을 다시 시도합니다.
     */
    fun retrySearch() {
        val currentQuery = _state.value.searchQuery
        if (currentQuery.isNotBlank()) {
            performSearch(currentQuery)
        }
    }
}