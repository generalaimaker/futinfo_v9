package com.hyunwoopark.futinfo.presentation.community.board

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.hyunwoopark.futinfo.domain.model.Board
import com.hyunwoopark.futinfo.domain.model.Post
import com.hyunwoopark.futinfo.domain.model.TeamInfo
import com.hyunwoopark.futinfo.domain.repository.FootballRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import io.github.jan.supabase.SupabaseClient
import io.github.jan.supabase.realtime.RealtimeChannel
import io.github.jan.supabase.realtime.channel
import io.github.jan.supabase.realtime.postgresChangeFlow
import io.github.jan.supabase.realtime.PostgresAction
import io.github.jan.supabase.realtime.realtime
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import kotlinx.serialization.json.Json
import javax.inject.Inject

@HiltViewModel
class TeamBoardViewModel @Inject constructor(
    private val repository: FootballRepository,
    private val supabaseClient: SupabaseClient
) : ViewModel() {
    
    private val _state = MutableStateFlow(TeamBoardState())
    val state: StateFlow<TeamBoardState> = _state.asStateFlow()
    
    private var currentBoardId: String? = null
    private var currentOffset = 0
    private val pageSize = 20
    private var realtimeChannel: RealtimeChannel? = null
    
    fun loadBoard(boardId: String) {
        if (currentBoardId == boardId) return
        
        // 이전 채널 정리
        realtimeChannel?.let { channel ->
            viewModelScope.launch {
                supabaseClient.realtime.removeChannel(channel)
            }
            realtimeChannel = null
        }
        
        currentBoardId = boardId
        currentOffset = 0
        
        viewModelScope.launch {
            _state.update { it.copy(isLoading = true) }
            
            try {
                val board = repository.getBoard(boardId)
                if (board != null) {
                    _state.update { 
                        it.copy(
                            board = board,
                            teamInfo = loadTeamInfo(board.teamId)
                        )
                    }
                    
                    loadPosts(refresh = true)
                    
                    // 실시간 업데이트 구독
                    setupRealtimeSubscription(boardId)
                } else {
                    _state.update { 
                        it.copy(
                            isLoading = false,
                            error = "게시판을 찾을 수 없습니다"
                        )
                    }
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
    
    fun selectCategory(category: String?) {
        if (_state.value.selectedCategory != category) {
            _state.update { it.copy(selectedCategory = category) }
            currentOffset = 0
            loadPosts(refresh = true)
        }
    }
    
    fun loadMorePosts() {
        if (!_state.value.isLoadingMore && _state.value.hasMore) {
            loadPosts(refresh = false)
        }
    }
    
    private fun loadPosts(refresh: Boolean) {
        val boardId = currentBoardId ?: return
        
        viewModelScope.launch {
            _state.update { 
                it.copy(
                    isLoading = refresh && it.posts.isEmpty(),
                    isLoadingMore = !refresh
                )
            }
            
            try {
                val posts = repository.getPostsByBoard(
                    boardId = boardId,
                    category = _state.value.selectedCategory,
                    limit = pageSize,
                    offset = if (refresh) 0 else currentOffset
                )
                
                if (refresh) {
                    currentOffset = posts.size
                    _state.update { 
                        it.copy(
                            posts = posts,
                            hasMore = posts.size >= pageSize,
                            isLoading = false,
                            isLoadingMore = false
                        )
                    }
                } else {
                    currentOffset += posts.size
                    _state.update { 
                        it.copy(
                            posts = it.posts + posts,
                            hasMore = posts.size >= pageSize,
                            isLoadingMore = false
                        )
                    }
                }
            } catch (e: Exception) {
                _state.update { 
                    it.copy(
                        isLoading = false,
                        isLoadingMore = false,
                        error = e.message
                    )
                }
            }
        }
    }
    
    private suspend fun loadTeamInfo(teamId: Int?): TeamInfo? {
        if (teamId == null) return null
        
        return try {
            // TODO: 팀 정보 API 호출
            // 임시로 하드코딩된 데이터 반환
            when (teamId) {
                33 -> TeamInfo(
                    teamId = 33,
                    name = "Manchester United",
                    logo = "https://media.api-sports.io/football/teams/33.png",
                    primaryColor = "#DA020E",
                    secondaryColor = "#FFE500",
                    slogan = "Glory Glory Man United",
                    standing = 6,
                    points = 28,
                    form = "WDWLW"
                )
                40 -> TeamInfo(
                    teamId = 40,
                    name = "Liverpool",
                    logo = "https://media.api-sports.io/football/teams/40.png",
                    primaryColor = "#C8102E",
                    secondaryColor = "#00B2A9",
                    slogan = "You'll Never Walk Alone",
                    standing = 1,
                    points = 45,
                    form = "WWWDW"
                )
                else -> null
            }
        } catch (e: Exception) {
            null
        }
    }
    
    private fun setupRealtimeSubscription(boardId: String) {
        viewModelScope.launch {
            try {
                realtimeChannel = supabaseClient.channel("board_$boardId")
                
                // posts 테이블의 변경사항 구독
                realtimeChannel?.postgresChangeFlow<PostgresAction>("public") {
                    table = "posts"
                    filter = "board_id=eq.$boardId"
                }?.collect { change ->
                    when (change) {
                        is PostgresAction.Insert -> {
                            // 새 게시글이 추가된 경우
                            loadPosts(refresh = true)
                        }
                        is PostgresAction.Update -> {
                            // 게시글이 수정된 경우
                            loadPosts(refresh = true)
                        }
                        is PostgresAction.Delete -> {
                            // 게시글이 삭제된 경우
                            loadPosts(refresh = true)
                        }
                        else -> {}
                    }
                }
                
                realtimeChannel?.subscribe()
            } catch (e: Exception) {
                android.util.Log.e("TeamBoardViewModel", "Failed to setup realtime subscription: ${e.message}")
            }
        }
    }
    
    override fun onCleared() {
        super.onCleared()
        // 채널 정리
        realtimeChannel?.let { channel ->
            viewModelScope.launch {
                supabaseClient.realtime.removeChannel(channel)
            }
        }
    }
}

data class TeamBoardState(
    val board: Board? = null,
    val teamInfo: TeamInfo? = null,
    val posts: List<Post> = emptyList(),
    val selectedCategory: String? = null,
    val isLoading: Boolean = false,
    val isLoadingMore: Boolean = false,
    val hasMore: Boolean = false,
    val error: String? = null
)