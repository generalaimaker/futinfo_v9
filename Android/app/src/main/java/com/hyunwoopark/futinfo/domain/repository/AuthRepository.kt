package com.hyunwoopark.futinfo.domain.repository

import com.hyunwoopark.futinfo.domain.model.UserProfile

interface AuthRepository {
    suspend fun signInWithEmail(email: String, password: String): Result<UserProfile?>
    suspend fun signUpWithEmail(email: String, password: String): Result<UserProfile?>
    suspend fun signOut(): Result<Unit>
    suspend fun getCurrentUser(): UserProfile?
    suspend fun isUserLoggedIn(): Boolean
}