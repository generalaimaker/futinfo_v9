package com.hyunwoopark.futinfo.data.remote.dto

import com.hyunwoopark.futinfo.domain.model.Comment
import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import java.time.Instant

@Serializable
data class CommentDto(
    val id: String,
    @SerialName("post_id")
    val postId: String,
    @SerialName("author_id")
    val authorId: String,
    val author: UserProfileDto? = null,
    val content: String,
    @SerialName("parent_id")
    val parentId: String? = null,
    @SerialName("created_at")
    val createdAt: String,
    @SerialName("updated_at")
    val updatedAt: String,
    @SerialName("like_count")
    val likeCount: Int = 0,
    @SerialName("is_deleted")
    val isDeleted: Boolean = false
)

fun CommentDto.toComment(isLiked: Boolean = false, replies: List<Comment> = emptyList()): Comment {
    return Comment(
        id = id,
        postId = postId,
        authorId = authorId,
        author = author?.toUserProfile(),
        content = content,
        parentId = parentId,
        createdAt = Instant.parse(createdAt),
        updatedAt = Instant.parse(updatedAt),
        likeCount = likeCount,
        isDeleted = isDeleted,
        isLiked = isLiked,
        replies = replies
    )
}