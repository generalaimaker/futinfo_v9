package com.hyunwoopark.futinfo.domain.model

import java.time.Instant

data class Comment(
    val id: String,
    val postId: String,
    val authorId: String,
    val author: UserProfile? = null,
    val content: String,
    val parentId: String? = null,
    val createdAt: Instant,
    val updatedAt: Instant,
    val likeCount: Int = 0,
    val isDeleted: Boolean = false,
    val isLiked: Boolean = false,
    val replies: List<Comment> = emptyList()
)