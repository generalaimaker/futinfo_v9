package com.hyunwoopark.futinfo.data.remote.dto

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

/**
 * Supabase posts 테이블을 매핑할 게시글 DTO
 */
@Serializable
data class PostDto(
    val id: String = "",
    @SerialName("board_id")
    val boardId: String = "",
    val title: String = "",
    val content: String = "",
    @SerialName("author_id")
    val authorId: String = "",
    val author: UserProfileDto? = null,
    val category: String = "general",
    val tags: List<String> = emptyList(),
    @SerialName("image_urls")
    val imageUrls: List<String> = emptyList(),
    @SerialName("created_at")
    val createdAt: String? = null,
    @SerialName("updated_at")
    val updatedAt: String? = null,
    @SerialName("view_count")
    val viewCount: Int = 0,
    @SerialName("like_count")
    val likeCount: Int = 0,
    @SerialName("comment_count")
    val commentCount: Int = 0,
    @SerialName("is_pinned")
    val isPinned: Boolean = false,
    @SerialName("is_notice")
    val isNotice: Boolean = false,
    @SerialName("is_deleted")
    val isDeleted: Boolean = false
)

fun PostDto.toPost(isLiked: Boolean = false, timeAgo: String = ""): com.hyunwoopark.futinfo.domain.model.Post {
    return com.hyunwoopark.futinfo.domain.model.Post(
        id = id,
        boardId = boardId,
        title = title,
        content = content,
        authorId = authorId,
        author = author?.toUserProfile(),
        category = when (category) {
            "general" -> com.hyunwoopark.futinfo.domain.model.PostCategory.GENERAL
            "discussion" -> com.hyunwoopark.futinfo.domain.model.PostCategory.DISCUSSION
            "question" -> com.hyunwoopark.futinfo.domain.model.PostCategory.QUESTION
            "news" -> com.hyunwoopark.futinfo.domain.model.PostCategory.NEWS
            "match" -> com.hyunwoopark.futinfo.domain.model.PostCategory.MATCH
            "transfer" -> com.hyunwoopark.futinfo.domain.model.PostCategory.TRANSFER
            "talk" -> com.hyunwoopark.futinfo.domain.model.PostCategory.TALK
            "media" -> com.hyunwoopark.futinfo.domain.model.PostCategory.MEDIA
            else -> com.hyunwoopark.futinfo.domain.model.PostCategory.GENERAL
        },
        tags = tags,
        imageUrls = imageUrls,
        createdAt = java.time.Instant.parse(createdAt ?: "1970-01-01T00:00:00Z"),
        updatedAt = java.time.Instant.parse(updatedAt ?: createdAt ?: "1970-01-01T00:00:00Z"),
        viewCount = viewCount,
        likeCount = likeCount,
        commentCount = commentCount,
        isPinned = isPinned,
        isNotice = isNotice,
        isDeleted = isDeleted,
        isLiked = isLiked,
        timeAgo = timeAgo
    )
}