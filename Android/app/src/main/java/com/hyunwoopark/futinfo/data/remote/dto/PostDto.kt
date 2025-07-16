package com.hyunwoopark.futinfo.data.remote.dto

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import kotlinx.datetime.Instant

/**
 * Supabase posts 테이블을 매핑할 게시글 DTO
 */
@Serializable
data class PostDto(
    val id: String = "",
    val title: String = "",
    val content: String = "",
    val author: String = "",
    @SerialName("author_id")
    val authorId: String = "",
    @SerialName("created_at")
    val createdAt: String? = null, // ISO 8601 format
    @SerialName("updated_at")
    val updatedAt: String? = null, // ISO 8601 format
    val likes: Int = 0,
    val comments: Int = 0,
    val category: String = "general", // general, discussion, question, news
    val tags: List<String> = emptyList(),
    @SerialName("is_deleted")
    val isDeleted: Boolean = false
)