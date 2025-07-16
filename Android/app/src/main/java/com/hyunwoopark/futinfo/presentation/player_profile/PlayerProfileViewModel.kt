package com.hyunwoopark.futinfo.presentation.player_profile

import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.hyunwoopark.futinfo.domain.use_case.GetPlayerProfileUseCase
import com.hyunwoopark.futinfo.util.Resource
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.launchIn
import kotlinx.coroutines.flow.onEach
import javax.inject.Inject

/**
 * 선수 프로필 화면의 ViewModel
 */
@HiltViewModel
class PlayerProfileViewModel @Inject constructor(
    private val getPlayerProfileUseCase: GetPlayerProfileUseCase,
    savedStateHandle: SavedStateHandle
) : ViewModel() {
    
    private val _state = MutableStateFlow(PlayerProfileState())
    val state: StateFlow<PlayerProfileState> = _state.asStateFlow()
    
    init {
        // SavedStateHandle에서 playerId 추출
        val playerId = savedStateHandle.get<Int>("playerId")
            ?: savedStateHandle.get<String>("playerId")?.toIntOrNull()
        
        println("PlayerProfileViewModel - Received playerId: $playerId")
        println("PlayerProfileViewModel - SavedStateHandle keys: ${savedStateHandle.keys()}")
        
        if (playerId != null) {
            println("PlayerProfileViewModel - Loading profile for player: $playerId")
            getPlayerProfile(playerId)
        } else {
            println("PlayerProfileViewModel - No valid playerId found")
            _state.value = _state.value.copy(
                isLoading = false,
                error = "선수 ID가 유효하지 않습니다"
            )
        }
    }
    
    /**
     * 선수 프로필 정보를 가져옵니다.
     */
    private fun getPlayerProfile(playerId: Int, season: Int? = null, team: Int? = null) {
        getPlayerProfileUseCase(
            playerId = playerId,
            season = season,
            team = team
        ).onEach { result ->
            when (result) {
                is Resource.Success -> {
                    _state.value = _state.value.copy(
                        playerProfile = result.data,
                        isLoading = false,
                        error = null
                    )
                }
                is Resource.Error -> {
                    _state.value = _state.value.copy(
                        playerProfile = null,
                        isLoading = false,
                        error = result.message ?: "알 수 없는 오류가 발생했습니다"
                    )
                }
                is Resource.Loading -> {
                    _state.value = _state.value.copy(
                        isLoading = true,
                        error = null
                    )
                }
            }
        }.launchIn(viewModelScope)
    }
    
    /**
     * 오류 상태를 초기화합니다.
     */
    fun clearError() {
        _state.value = _state.value.copy(error = null)
    }
    
    /**
     * 선수 프로필을 새로고침합니다.
     */
    fun refreshPlayerProfile() {
        val currentProfile = _state.value.playerProfile
        if (currentProfile != null) {
            getPlayerProfile(currentProfile.player.id)
        }
    }
}