package com.hyunwoopark.futinfo.data.repository

import com.hyunwoopark.futinfo.domain.model.UserProfile
import com.hyunwoopark.futinfo.domain.repository.AuthRepository
import io.github.jan.supabase.SupabaseClient
import io.github.jan.supabase.gotrue.auth
import io.github.jan.supabase.gotrue.providers.builtin.Email
import io.github.jan.supabase.postgrest.postgrest
import io.github.jan.supabase.postgrest.from
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class AuthRepositoryImpl @Inject constructor(
    private val supabaseClient: SupabaseClient
) : AuthRepository {
    
    override suspend fun signInWithEmail(email: String, password: String): Result<UserProfile?> {
        return try {
            supabaseClient.auth.signInWith(Email) {
                this.email = email
                this.password = password
            }
            
            // 로그인 후 사용자 프로필 가져오기
            val userId = supabaseClient.auth.currentUserOrNull()?.id
            if (userId != null) {
                val profile = getUserProfile(userId)
                Result.success(profile)
            } else {
                Result.success(null)
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    override suspend fun signUpWithEmail(email: String, password: String): Result<UserProfile?> {
        return try {
            supabaseClient.auth.signUpWith(Email) {
                this.email = email
                this.password = password
            }
            
            // 회원가입 후 기본 프로필 생성
            val userId = supabaseClient.auth.currentUserOrNull()?.id
            if (userId != null) {
                createDefaultProfile(userId, email)
                val profile = getUserProfile(userId)
                Result.success(profile)
            } else {
                Result.success(null)
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    override suspend fun signOut(): Result<Unit> {
        return try {
            supabaseClient.auth.signOut()
            Result.success(Unit)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    override suspend fun getCurrentUser(): UserProfile? {
        val userId = supabaseClient.auth.currentUserOrNull()?.id ?: return null
        return getUserProfile(userId)
    }
    
    override suspend fun isUserLoggedIn(): Boolean {
        return supabaseClient.auth.currentUserOrNull() != null
    }
    
    private suspend fun getUserProfile(userId: String): UserProfile? {
        return try {
            val response = supabaseClient.from("user_profiles")
                .select() {
                    filter {
                        eq("id", userId)
                    }
                }
                .decodeSingle<UserProfileDto>()
            
            UserProfile(
                id = response.id,
                userId = response.id, // Using id as userId for now
                nickname = response.nickname,
                avatarUrl = response.avatarUrl,
                favoriteTeamId = response.favoriteTeamId,
                favoriteTeamName = response.favoriteTeamName,
                language = "ko",
                postCount = 0,
                commentCount = 0,
                createdAt = java.time.Instant.parse(response.createdAt),
                updatedAt = response.updatedAt?.let { java.time.Instant.parse(it) } ?: java.time.Instant.parse(response.createdAt)
            )
        } catch (e: Exception) {
            null
        }
    }
    
    private suspend fun createDefaultProfile(userId: String, email: String) {
        try {
            val profile = mapOf(
                "id" to userId,
                "email" to email,
                "nickname" to email.substringBefore("@"),
                "level" to 1,
                "points" to 0
            )
            
            supabaseClient.from("user_profiles")
                .insert(profile)
        } catch (e: Exception) {
            // 프로필 생성 실패 처리
        }
    }
}

// UserProfile DTO
data class UserProfileDto(
    val id: String,
    val email: String,
    val nickname: String,
    val avatarUrl: String? = null,
    val favoriteTeamId: Int? = null,
    val favoriteTeamName: String? = null,
    val level: Int? = 1,
    val points: Int? = 0,
    val createdAt: String,
    val updatedAt: String? = null
)