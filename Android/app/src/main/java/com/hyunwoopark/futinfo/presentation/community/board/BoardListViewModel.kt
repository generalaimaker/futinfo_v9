package com.hyunwoopark.futinfo.presentation.community.board

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.hyunwoopark.futinfo.domain.model.Board
import com.hyunwoopark.futinfo.domain.model.UserProfile
import com.hyunwoopark.futinfo.domain.repository.FootballRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class BoardListViewModel @Inject constructor(
    private val repository: FootballRepository
) : ViewModel() {
    
    private val _state = MutableStateFlow(BoardListState())
    val state: StateFlow<BoardListState> = _state.asStateFlow()
    
    init {
        loadData()
    }
    
    private fun loadData() {
        viewModelScope.launch {
            _state.update { it.copy(isLoading = true) }
            
            try {
                // 병렬로 보드 목록과 사용자 프로필 로드
                val boards = repository.getBoards()
                val userProfile = repository.getCurrentUserProfile()
                
                _state.update { 
                    it.copy(
                        boards = boards,
                        userProfile = userProfile,
                        isLoading = false
                    )
                }
            } catch (e: Exception) {
                _state.update { 
                    it.copy(
                        isLoading = false,
                        error = e.message
                    )
                }
            }
        }
    }
    
    fun refresh() {
        loadData()
    }
}

data class BoardListState(
    val boards: List<Board> = emptyList(),
    val userProfile: UserProfile? = null,
    val isLoading: Boolean = false,
    val error: String? = null
)