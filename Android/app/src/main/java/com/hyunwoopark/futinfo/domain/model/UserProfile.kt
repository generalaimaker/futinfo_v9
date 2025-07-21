package com.hyunwoopark.futinfo.domain.model

import java.time.Instant

data class UserProfile(
    val id: String,
    val userId: String,
    val nickname: String,
    val avatarUrl: String? = null,
    val favoriteTeamId: Int? = null,
    val favoriteTeamName: String? = null,
    val language: String = "ko",
    val postCount: Int = 0,
    val commentCount: Int = 0,
    val createdAt: Instant,
    val updatedAt: Instant
)