package com.hyunwoopark.futinfo.presentation.following

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.hyunwoopark.futinfo.domain.use_case.GetFavoritesUseCase
import com.hyunwoopark.futinfo.domain.use_case.RemoveFavoriteUseCase
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import javax.inject.Inject

/**
 * 팔로잉 선수 화면의 ViewModel
 */
@HiltViewModel
class FollowingPlayersViewModel @Inject constructor(
    private val getFavoritesUseCase: GetFavoritesUseCase,
    private val removeFavoriteUseCase: RemoveFavoriteUseCase
) : ViewModel() {
    
    private val _state = MutableStateFlow(FollowingPlayersState())
    val state: StateFlow<FollowingPlayersState> = _state.asStateFlow()
    
    init {
        loadFollowingPlayers()
    }
    
    private fun loadFollowingPlayers() {
        viewModelScope.launch {
            _state.update { it.copy(isLoading = true) }
            
            getFavoritesUseCase.getFavoritePlayers()
                .catch { 
                    _state.update { 
                        it.copy(
                            isLoading = false,
                            error = "선수 목록을 불러오는데 실패했습니다"
                        )
                    }
                }
                .collect { favorites ->
                    val players = favorites.map { favorite ->
                        FavoritePlayer(
                            entityId = favorite.itemId,
                            name = favorite.name,
                            imageUrl = favorite.imageUrl,
                            teamName = favorite.additionalInfo // additionalInfo를 팀 이름으로 사용
                        )
                    }
                    
                    _state.update {
                        it.copy(
                            players = players,
                            isLoading = false,
                            error = null
                        )
                    }
                }
        }
    }
    
    fun toggleEditMode() {
        _state.update { it.copy(isEditMode = !it.isEditMode) }
    }
    
    fun removePlayer(playerId: Int) {
        viewModelScope.launch {
            try {
                removeFavoriteUseCase.removePlayer(playerId)
                // 삭제 후 목록 다시 불러오기
                loadFollowingPlayers()
            } catch (e: Exception) {
                // 에러 처리 (필요시 토스트 메시지 표시)
            }
        }
    }
}

/**
 * 팔로잉 선수 화면의 상태
 */
data class FollowingPlayersState(
    val players: List<FavoritePlayer> = emptyList(),
    val isLoading: Boolean = false,
    val isEditMode: Boolean = false,
    val error: String? = null
)

/**
 * 즐겨찾기 선수 정보
 */
data class FavoritePlayer(
    val entityId: Int,
    val name: String,
    val imageUrl: String?,
    val teamName: String?
)