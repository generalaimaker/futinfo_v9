package com.hyunwoopark.futinfo.data.remote.dto

import com.hyunwoopark.futinfo.domain.model.UserProfile
import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import java.time.Instant

@Serializable
data class UserProfileDto(
    val id: String,
    @SerialName("user_id")
    val userId: String,
    val nickname: String,
    @SerialName("avatar_url")
    val avatarUrl: String? = null,
    @SerialName("favorite_team_id")
    val favoriteTeamId: Int? = null,
    @SerialName("favorite_team_name")
    val favoriteTeamName: String? = null,
    val language: String = "ko",
    @SerialName("post_count")
    val postCount: Int = 0,
    @SerialName("comment_count")
    val commentCount: Int = 0,
    @SerialName("created_at")
    val createdAt: String,
    @SerialName("updated_at")
    val updatedAt: String
)

fun UserProfileDto.toUserProfile(): UserProfile {
    return UserProfile(
        id = id,
        userId = userId,
        nickname = nickname,
        avatarUrl = avatarUrl,
        favoriteTeamId = favoriteTeamId,
        favoriteTeamName = favoriteTeamName,
        language = language,
        postCount = postCount,
        commentCount = commentCount,
        createdAt = Instant.parse(createdAt),
        updatedAt = Instant.parse(updatedAt)
    )
}