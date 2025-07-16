package com.hyunwoopark.futinfo.domain.model

import java.util.Date

/**
 * UI에 표시될 게시글 도메인 모델
 */
data class Post(
    val id: String,
    val title: String,
    val content: String,
    val author: String,
    val authorId: String,
    val createdAt: Date,
    val updatedAt: Date?,
    val likes: Int,
    val comments: Int,
    val category: PostCategory,
    val tags: List<String>,
    val timeAgo: String // "2시간 전", "1일 전" 등의 상대적 시간
)

enum class PostCategory(val displayName: String, val value: String) {
    GENERAL("일반", "general"),
    DISCUSSION("토론", "discussion"),
    QUESTION("질문", "question"),
    NEWS("뉴스", "news")
}