package com.hyunwoopark.futinfo.presentation.community

import androidx.compose.runtime.State
import androidx.compose.runtime.mutableStateOf
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.hyunwoopark.futinfo.domain.model.PostCategory
import com.hyunwoopark.futinfo.domain.use_case.GetPostsUseCase
import com.hyunwoopark.futinfo.util.Resource
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.Job
import kotlinx.coroutines.flow.launchIn
import kotlinx.coroutines.flow.onEach
import javax.inject.Inject

/**
 * 커뮤니티 화면의 ViewModel
 */
@HiltViewModel
class CommunityViewModel @Inject constructor(
    private val getPostsUseCase: GetPostsUseCase
) : ViewModel() {

    private val _state = mutableStateOf(CommunityState())
    val state: State<CommunityState> = _state

    private var getPostsJob: Job? = null

    init {
        getPosts()
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
}