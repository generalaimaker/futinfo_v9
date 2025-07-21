package com.hyunwoopark.futinfo.presentation.community

import androidx.compose.runtime.State
import androidx.compose.runtime.mutableStateOf
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.hyunwoopark.futinfo.domain.model.PostCategory
import com.hyunwoopark.futinfo.domain.use_case.GetPostsUseCase
import com.hyunwoopark.futinfo.util.Resource
import dagger.hilt.android.lifecycle.HiltViewModel
import io.github.jan.supabase.SupabaseClient
import io.github.jan.supabase.realtime.RealtimeChannel
import io.github.jan.supabase.realtime.channel
import io.github.jan.supabase.realtime.postgresChangeFlow
import io.github.jan.supabase.realtime.PostgresAction
import io.github.jan.supabase.realtime.realtime
import kotlinx.coroutines.Job
import kotlinx.coroutines.flow.launchIn
import kotlinx.coroutines.flow.onEach
import kotlinx.coroutines.launch
import javax.inject.Inject

/**
 * 커뮤니티 화면의 ViewModel
 */
@HiltViewModel
class CommunityViewModel @Inject constructor(
    private val getPostsUseCase: GetPostsUseCase,
    private val supabaseClient: SupabaseClient
) : ViewModel() {

    private val _state = mutableStateOf(CommunityState())
    val state: State<CommunityState> = _state

    private var getPostsJob: Job? = null
    private var realtimeChannel: RealtimeChannel? = null

    init {
        getPosts()
        setupRealtimeSubscription()
    }

    /**
     * 게시글 목록을 가져옵니다.
     */
    fun getPosts(category: PostCategory? = null) {
        getPostsJob?.cancel()
        getPostsJob = getPostsUseCase(
            category = category?.value,
            limit = 20
        ).onEach { result ->
            when (result) {
                is Resource.Success -> {
                    _state.value = _state.value.copy(
                        posts = result.data ?: emptyList(),
                        isLoading = false,
                        isRefreshing = false,
                        error = null,
                        selectedCategory = category
                    )
                }
                is Resource.Error -> {
                    _state.value = _state.value.copy(
                        isLoading = false,
                        isRefreshing = false,
                        error = result.message
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
     * 새로고침을 수행합니다.
     */
    fun refresh() {
        _state.value = _state.value.copy(isRefreshing = true)
        getPosts(_state.value.selectedCategory)
    }

    /**
     * 카테고리를 선택합니다.
     */
    fun selectCategory(category: PostCategory?) {
        if (_state.value.selectedCategory != category) {
            getPosts(category)
        }
    }

    /**
     * 에러 메시지를 클리어합니다.
     */
    fun clearError() {
        _state.value = _state.value.copy(error = null)
    }
    
    /**
     * 실시간 업데이트 구독을 설정합니다.
     */
    private fun setupRealtimeSubscription() {
        viewModelScope.launch {
            try {
                realtimeChannel = supabaseClient.channel("community_posts")
                
                // posts 테이블의 변경사항 구독 (전체 게시판)
                realtimeChannel?.postgresChangeFlow<PostgresAction>("public") {
                    table = "posts"
                }?.collect { change ->
                    when (change) {
                        is PostgresAction.Insert,
                        is PostgresAction.Update,
                        is PostgresAction.Delete -> {
                            // 게시글에 변경사항이 있으면 다시 로드
                            getPosts(_state.value.selectedCategory)
                        }
                        else -> {}
                    }
                }
                
                realtimeChannel?.subscribe()
            } catch (e: Exception) {
                android.util.Log.e("CommunityViewModel", "Failed to setup realtime subscription: ${e.message}")
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
        getPostsJob?.cancel()
    }
}