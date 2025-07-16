package com.hyunwoopark.futinfo.presentation.favorites

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.hyunwoopark.futinfo.domain.use_case.AddFavoriteUseCase
import com.hyunwoopark.futinfo.domain.use_case.GetFavoritesUseCase
import com.hyunwoopark.futinfo.domain.use_case.RemoveFavoriteUseCase
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.launch
import javax.inject.Inject

/**
 * 즐겨찾기 화면의 ViewModel
 * 
 * 즐겨찾기 목록 조회, 추가, 삭제 등의 비즈니스 로직을 처리합니다.
 */
@HiltViewModel
class FavoritesViewModel @Inject constructor(
    private val getFavoritesUseCase: GetFavoritesUseCase,
    private val addFavoriteUseCase: AddFavoriteUseCase,
    private val removeFavoriteUseCase: RemoveFavoriteUseCase
) : ViewModel() {

    private val _state = MutableStateFlow(FavoritesState())
    val state: StateFlow<FavoritesState> = _state.asStateFlow()

    init {
        loadFavorites()
    }

    /**
     * 즐겨찾기 목록을 로드합니다.
     */
    private fun loadFavorites() {
        viewModelScope.launch {
            _state.value = _state.value.copy(isLoading = true, error = null)
            
            try {
                combine(
                    getFavoritesUseCase(),
                    getFavoritesUseCase.getFavoriteLeagues(),
                    getFavoritesUseCase.getFavoriteTeams(),
                    getFavoritesUseCase.getFavoritePlayers()
                ) { allFavorites, leagues, teams, players ->
                    _state.value = _state.value.copy(
                        isLoading = false,
                        favorites = allFavorites,
                        favoriteLeagues = leagues,
                        favoriteTeams = teams,
                        favoritePlayers = players,
                        error = null
                    )
                }.collect { }
            } catch (e: Exception) {
                _state.value = _state.value.copy(
                    isLoading = false,
                    error = e.message ?: "알 수 없는 오류가 발생했습니다."
                )
            }
        }
    }

    /**
     * 탭을 선택합니다.
     * 
     * @param tab 선택할 탭
     */
    fun selectTab(tab: FavoriteTab) {
        _state.value = _state.value.copy(selectedTab = tab)
    }

    /**
     * 즐겨찾기에서 항목을 제거합니다.
     * 
     * @param id 항목 ID
     * @param type 항목 타입
     */
    fun removeFavorite(id: Int, type: String) {
        viewModelScope.launch {
            try {
                val favoriteId = "${type}_$id"
                removeFavoriteUseCase(favoriteId)
            } catch (e: Exception) {
                _state.value = _state.value.copy(
                    error = e.message ?: "즐겨찾기 제거 중 오류가 발생했습니다."
                )
            }
        }
    }

    /**
     * 리그를 즐겨찾기에서 제거합니다.
     * 
     * @param leagueId 리그 ID
     */
    fun removeLeagueFavorite(leagueId: Int) {
        removeFavorite(leagueId, "league")
    }

    /**
     * 팀을 즐겨찾기에서 제거합니다.
     * 
     * @param teamId 팀 ID
     */
    fun removeTeamFavorite(teamId: Int) {
        removeFavorite(teamId, "team")
    }

    /**
     * 선수를 즐겨찾기에서 제거합니다.
     * 
     * @param playerId 선수 ID
     */
    fun removePlayerFavorite(playerId: Int) {
        removeFavorite(playerId, "player")
    }

    /**
     * 오류 메시지를 지웁니다.
     */
    fun clearError() {
        _state.value = _state.value.copy(error = null)
    }

    /**
     * 즐겨찾기 목록을 새로고침합니다.
     */
    fun refresh() {
        loadFavorites()
    }
}