package com.hyunwoopark.futinfo.domain.model

import java.time.Instant

/**
 * UI에 표시될 게시글 도메인 모델
 */
data class Post(
    val id: String,
    val boardId: String,
    val title: String,
    val content: String,
    val authorId: String,
    val author: UserProfile? = null,
    val category: PostCategory,
    val tags: List<String> = emptyList(),
    val imageUrls: List<String> = emptyList(),
    val createdAt: Instant,
    val updatedAt: Instant,
    val viewCount: Int = 0,
    val likeCount: Int = 0,
    val commentCount: Int = 0,
    val isPinned: Boolean = false,
    val isNotice: Boolean = false,
    val isDeleted: Boolean = false,
    val isLiked: Boolean = false,
    val timeAgo: String = "" // "2시간 전", "1일 전" 등의 상대적 시간
)

enum class PostCategory(val displayName: String, val value: String) {
    GENERAL("일반", "general"),
    DISCUSSION("토론", "discussion"), 
    QUESTION("질문", "question"),
    NEWS("뉴스", "news"),
    MATCH("경기", "match"),
    TRANSFER("이적", "transfer"),
    TALK("잡담", "talk"),
    MEDIA("미디어", "media")
}