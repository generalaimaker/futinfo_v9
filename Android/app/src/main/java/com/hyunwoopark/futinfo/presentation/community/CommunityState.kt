package com.hyunwoopark.futinfo.presentation.community

import com.hyunwoopark.futinfo.domain.model.Post
import com.hyunwoopark.futinfo.domain.model.PostCategory

/**
 * 커뮤니티 화면의 UI 상태를 나타내는 데이터 클래스
 */
data class CommunityState(
    val posts: List<Post> = emptyList(),
    val isLoading: Boolean = false,
    val error: String? = null,
    val selectedCategory: PostCategory? = null,
    val isRefreshing: Boolean = false
)