package com.hyunwoopark.futinfo.data.remote.dto

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

/**
 * Supabase likes 테이블을 매핑할 좋아요 DTO
 */
@Serializable
data class LikeDto(
    val id: String = "",
    @SerialName("user_id")
    val userId: String = "",
    @SerialName("post_id")
    val postId: String? = null,
    @SerialName("comment_id")
    val commentId: String? = null,
    @SerialName("created_at")
    val createdAt: String? = null
)