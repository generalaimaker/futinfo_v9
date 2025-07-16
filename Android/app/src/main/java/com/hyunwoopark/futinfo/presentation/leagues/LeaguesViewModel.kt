package com.hyunwoopark.futinfo.presentation.leagues

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.hyunwoopark.futinfo.data.local.UserLeaguePreferences
import com.hyunwoopark.futinfo.data.remote.dto.LeagueDetailsDto
import com.hyunwoopark.futinfo.domain.use_case.GetLeaguesUseCase
import com.hyunwoopark.futinfo.util.Resource
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

/**
 * 리그 목록 화면의 ViewModel
 *
 * GetLeaguesUseCase를 사용하여 리그 데이터를 가져오고,
 * StateFlow를 통해 UI 상태를 관리합니다.
 * iOS 스타일로 주요 리그와 전체 리그를 분리하여 관리합니다.
 */
@HiltViewModel
class LeaguesViewModel @Inject constructor(
    private val getLeaguesUseCase: GetLeaguesUseCase,
    private val userLeaguePreferences: UserLeaguePreferences
) : ViewModel() {
    
    private val _state = MutableStateFlow(LeaguesState())
    val state: StateFlow<LeaguesState> = _state.asStateFlow()
    
    // 주요 리그 ID 목록 (iOS 버전과 동일)
    private val featuredLeagueIds = setOf(
        39,  // Premier League
        140, // La Liga
        78,  // Bundesliga
        135, // Serie A
        61,  // Ligue 1
        2,   // Champions League
        3,   // Europa League
        1,   // World Cup
        4,   // Euro Championship
        5,   // Nations League
        15,  // Copa America
        16,  // Asian Cup
        17   // Club World Cup
    )
    
    init {
        loadUserLeagues()
        getLeagues()
    }
    
    /**
     * 리그 목록을 가져옵니다.
     * iOS 스타일로 주요 리그와 전체 리그를 분리하여 처리합니다.
     */
    private fun getLeagues() {
        viewModelScope.launch {
            // 🔍 DEBUG: UseCase 호출 시작
            android.util.Log.d("FutInfo_Leagues", "🚀 Starting to fetch leagues...")
            
            getLeaguesUseCase.getSupportedLeagues().collect { resource ->
                when (resource) {
                    is Resource.Loading -> {
                        android.util.Log.d("FutInfo_Leagues", "⏳ Loading leagues...")
                        _state.value = _state.value.copy(
                            isLoading = true,
                            errorMessage = null
                        )
                    }
                    is Resource.Success -> {
                        val allLeagues = resource.data?.response ?: emptyList()
                        android.util.Log.d("FutInfo_Leagues", "✅ Successfully loaded ${allLeagues.size} leagues")
                        
                        // 주요 리그 필터링 (기본 + 사용자 추가)
                        val featuredLeagues = filterFeaturedLeagues(allLeagues)
                        android.util.Log.d("FutInfo_Leagues", "🌟 Featured leagues: ${featuredLeagues.size}")
                        
                        // 🔍 DEBUG: 주요 리그 정보 로그
                        featuredLeagues.forEach { league ->
                            android.util.Log.d("FutInfo_Leagues", "⭐ Featured: ${league.league?.name} (ID: ${league.league?.id})")
                        }
                        
                        _state.value = _state.value.copy(
                            featuredLeagues = featuredLeagues,
                            allLeagues = allLeagues,
                            isLoading = false,
                            errorMessage = null,
                            showFeaturedOnly = true
                        )
                    }
                    is Resource.Error -> {
                        android.util.Log.e("FutInfo_Leagues", "❌ Error loading leagues: ${resource.message}")
                        android.util.Log.e("FutInfo_Leagues", "🔍 Error details: ${resource.data}")
                        
                        _state.value = _state.value.copy(
                            isLoading = false,
                            errorMessage = resource.message
                        )
                    }
                }
            }
        }
    }
    
    /**
     * 사용자 리그 설정을 로드합니다.
     */
    private fun loadUserLeagues() {
        val userLeagueIds = userLeaguePreferences.getFavoriteLeagues()
        _state.value = _state.value.copy(userLeagueIds = userLeagueIds)
        android.util.Log.d("FutInfo_Leagues", "📋 Loaded user leagues: $userLeagueIds")
    }
    
    /**
     * 주요 리그를 필터링합니다.
     * 기본 주요 리그 + 사용자가 추가한 리그를 포함합니다.
     */
    private fun filterFeaturedLeagues(leagues: List<LeagueDetailsDto>): List<LeagueDetailsDto> {
        val userLeagueIds = _state.value.userLeagueIds
        val allFeaturedIds = featuredLeagueIds + userLeagueIds.toSet()
        
        return leagues.filter { league ->
            league.league?.id in allFeaturedIds
        }.sortedBy { league ->
            // 기본 주요 리그 순서대로 정렬, 사용자 추가 리그는 뒤에
            when (league.league?.id) {
                39 -> 1   // Premier League
                140 -> 2  // La Liga
                78 -> 3   // Bundesliga
                135 -> 4  // Serie A
                61 -> 5   // Ligue 1
                2 -> 6    // Champions League
                3 -> 7    // Europa League
                1 -> 8    // World Cup
                4 -> 9    // Euro Championship
                5 -> 10   // Nations League
                17 -> 11  // Club World Cup
                15 -> 12  // Copa America
                16 -> 13  // Asian Cup
                else -> {
                    if (league.league?.id in userLeagueIds) {
                        100 + userLeagueIds.indexOf(league.league?.id) // 사용자 추가 리그
                    } else {
                        999
                    }
                }
            }
        }
    }
    
    /**
     * 리그 목록을 새로고침합니다.
     */
    fun refreshLeagues() {
        getLeagues()
    }
    
    /**
     * 특정 조건으로 리그를 검색합니다.
     * 
     * @param searchQuery 검색어
     * @param country 국가명
     * @param type 리그 타입 (League, Cup)
     */
    fun searchLeagues(
        searchQuery: String? = null,
        country: String? = null,
        type: String? = null
    ) {
        viewModelScope.launch {
            getLeaguesUseCase(
                search = searchQuery,
                country = country,
                type = type,
                current = true
            ).collect { resource ->
                when (resource) {
                    is Resource.Loading -> {
                        _state.value = _state.value.copy(
                            isLoading = true,
                            errorMessage = null
                        )
                    }
                    is Resource.Success -> {
                        val allLeagues = resource.data?.response ?: emptyList()
                        val featuredLeagues = filterFeaturedLeagues(allLeagues)
                        
                        _state.value = _state.value.copy(
                            featuredLeagues = featuredLeagues,
                            allLeagues = allLeagues,
                            isLoading = false,
                            errorMessage = null
                        )
                    }
                    is Resource.Error -> {
                        _state.value = _state.value.copy(
                            isLoading = false,
                            errorMessage = resource.message
                        )
                    }
                }
            }
        }
    }
    
    /**
     * 에러 메시지를 초기화합니다.
     */
    fun clearError() {
        _state.value = _state.value.copy(errorMessage = null)
    }
    
    /**
     * 모든 리그 보기 모드로 전환합니다. (iOS 스타일)
     */
    fun showAllLeagues() {
        _state.value = _state.value.copy(showFeaturedOnly = false)
        android.util.Log.d("FutInfo_Leagues", "📋 Switched to show all leagues (${_state.value.allLeagues.size} leagues)")
    }
    
    /**
     * 주요 리그만 보기 모드로 전환합니다. (iOS 스타일)
     */
    fun showFeaturedLeagues() {
        _state.value = _state.value.copy(showFeaturedOnly = true)
        android.util.Log.d("FutInfo_Leagues", "⭐ Switched to show featured leagues (${_state.value.featuredLeagues.size} leagues)")
    }
    
    /**
     * 리그 선택 다이얼로그를 표시합니다.
     */
    fun showLeagueSelectionDialog() {
        _state.value = _state.value.copy(showLeagueSelectionDialog = true)
        android.util.Log.d("FutInfo_Leagues", "🔧 Showing league selection dialog")
    }
    
    /**
     * 리그 선택 다이얼로그를 숨깁니다.
     */
    fun hideLeagueSelectionDialog() {
        _state.value = _state.value.copy(showLeagueSelectionDialog = false)
        android.util.Log.d("FutInfo_Leagues", "🔧 Hiding league selection dialog")
    }
    
    /**
     * 사용자 리그를 추가합니다.
     */
    fun addUserLeague(league: LeagueDetailsDto) {
        val leagueId = league.league.id
        val success = userLeaguePreferences.addFavoriteLeague(leagueId)
        
        if (success) {
            // 사용자 리그 목록 업데이트
            loadUserLeagues()
            
            // 주요 리그 목록 재구성
            val updatedFeaturedLeagues = filterFeaturedLeagues(_state.value.allLeagues)
            _state.value = _state.value.copy(featuredLeagues = updatedFeaturedLeagues)
            
            android.util.Log.d("FutInfo_Leagues", "✅ Added user league: ${league.league.name} (ID: $leagueId)")
        } else {
            android.util.Log.w("FutInfo_Leagues", "❌ Failed to add user league: ${league.league.name} (ID: $leagueId)")
        }
    }
    
    /**
     * 사용자 리그를 제거합니다.
     */
    fun removeUserLeague(leagueId: Int) {
        val success = userLeaguePreferences.removeFavoriteLeague(leagueId)
        
        if (success) {
            // 사용자 리그 목록 업데이트
            loadUserLeagues()
            
            // 주요 리그 목록 재구성
            val updatedFeaturedLeagues = filterFeaturedLeagues(_state.value.allLeagues)
            _state.value = _state.value.copy(featuredLeagues = updatedFeaturedLeagues)
            
            android.util.Log.d("FutInfo_Leagues", "✅ Removed user league: ID $leagueId")
        } else {
            android.util.Log.w("FutInfo_Leagues", "❌ Failed to remove user league: ID $leagueId")
        }
    }
    
    /**
     * 모든 사용자 리그 설정을 초기화합니다.
     */
    fun clearAllUserLeagues() {
        userLeaguePreferences.clearAllPreferences()
        loadUserLeagues()
        
        // 주요 리그 목록을 기본값으로 재구성
        val updatedFeaturedLeagues = filterFeaturedLeagues(_state.value.allLeagues)
        _state.value = _state.value.copy(featuredLeagues = updatedFeaturedLeagues)
        
        android.util.Log.d("FutInfo_Leagues", "🗑️ Cleared all user leagues")
    }
    
    /**
     * 특정 리그가 사용자가 추가한 리그인지 확인합니다.
     */
    fun isFavoriteLeague(leagueId: Int): Boolean {
        return userLeaguePreferences.getFavoriteLeagues().contains(leagueId)
    }
}