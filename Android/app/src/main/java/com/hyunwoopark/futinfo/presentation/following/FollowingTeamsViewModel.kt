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
 * 팔로잉 팀 화면의 ViewModel
 */
@HiltViewModel
class FollowingTeamsViewModel @Inject constructor(
    private val getFavoritesUseCase: GetFavoritesUseCase,
    private val removeFavoriteUseCase: RemoveFavoriteUseCase
) : ViewModel() {
    
    private val _state = MutableStateFlow(FollowingTeamsState())
    val state: StateFlow<FollowingTeamsState> = _state.asStateFlow()
    
    init {
        loadFollowingTeams()
    }
    
    private fun loadFollowingTeams() {
        viewModelScope.launch {
            _state.update { it.copy(isLoading = true) }
            
            getFavoritesUseCase.getFavoriteTeams()
                .catch { 
                    _state.update { 
                        it.copy(
                            isLoading = false,
                            error = "팀 목록을 불러오는데 실패했습니다"
                        )
                    }
                }
                .collect { favorites ->
                    val teams = favorites.map { favorite ->
                        FavoriteTeam(
                            entityId = favorite.itemId,
                            name = favorite.name,
                            imageUrl = favorite.imageUrl
                        )
                    }
                    
                    _state.update {
                        it.copy(
                            teams = teams,
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
    
    fun removeTeam(teamId: Int) {
        viewModelScope.launch {
            try {
                removeFavoriteUseCase.removeTeam(teamId)
                // 삭제 후 목록 다시 불러오기
                loadFollowingTeams()
            } catch (e: Exception) {
                // 에러 처리 (필요시 토스트 메시지 표시)
            }
        }
    }
}

/**
 * 팔로잉 팀 화면의 상태
 */
data class FollowingTeamsState(
    val teams: List<FavoriteTeam> = emptyList(),
    val isLoading: Boolean = false,
    val isEditMode: Boolean = false,
    val error: String? = null
)

/**
 * 즐겨찾기 팀 정보
 */
data class FavoriteTeam(
    val entityId: Int,
    val name: String,
    val imageUrl: String?
)