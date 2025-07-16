package com.hyunwoopark.futinfo.data.cache

import android.content.Context
import android.util.Log
import android.util.LruCache
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import kotlinx.serialization.Serializable
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.jsonArray
import kotlinx.serialization.json.jsonObject
import java.io.File
import java.security.MessageDigest
import javax.inject.Inject
import javax.inject.Singleton

/**
 * API 응답 캐싱을 관리하는 매니저
 * iOS의 APICacheManager와 동일한 구조로 구현
 */
@Singleton
class ApiCacheManager @Inject constructor(
    private val context: Context,
    private val json: Json
) {
    companion object {
        private const val TAG = "ApiCacheManager"
        private const val CACHE_DIR_NAME = "api_cache"
        private const val MEMORY_CACHE_SIZE = 50 * 1024 * 1024 // 50MB
        
        // 캐시 만료 시간 (밀리초)
        const val CACHE_EXPIRATION_VERY_SHORT = 5 * 60 * 1000L // 5분
        const val CACHE_EXPIRATION_SHORT = 15 * 60 * 1000L // 15분
        const val CACHE_EXPIRATION_MEDIUM = 30 * 60 * 1000L // 30분
        const val CACHE_EXPIRATION_LONG = 60 * 60 * 1000L // 1시간
        const val CACHE_EXPIRATION_VERY_LONG = 12 * 60 * 60 * 1000L // 12시간
    }
    
    // 메모리 캐시
    private val memoryCache = LruCache<String, CachedResponse>(MEMORY_CACHE_SIZE)
    
    // 디스크 캐시 디렉토리
    private val cacheDir: File by lazy {
        File(context.cacheDir, CACHE_DIR_NAME).apply {
            if (!exists()) mkdirs()
        }
    }
    
    /**
     * 캐시된 응답 데이터
     */
    @Serializable
    data class CachedResponse(
        val data: String,
        val timestamp: Long,
        val expirationTime: Long,
        val endpoint: String,
        val parameters: Map<String, String>
    )
    
    /**
     * 캐시에서 데이터 가져오기
     */
    suspend fun getCachedResponse(
        endpoint: String,
        parameters: Map<String, String>,
        forceRefresh: Boolean = false
    ): String? = withContext(Dispatchers.IO) {
        if (forceRefresh) {
            Log.d(TAG, "🔄 강제 새로고침 요청됨 - 캐시 무시")
            return@withContext null
        }
        
        val cacheKey = generateCacheKey(endpoint, parameters)
        
        // 1. 메모리 캐시 확인
        memoryCache.get(cacheKey)?.let { cached ->
            if (!isExpired(cached)) {
                Log.d(TAG, "✅ 메모리 캐시 히트: $endpoint")
                return@withContext cached.data
            } else {
                Log.d(TAG, "⏰ 메모리 캐시 만료됨: $endpoint")
                memoryCache.remove(cacheKey)
            }
        }
        
        // 2. 디스크 캐시 확인
        val cacheFile = File(cacheDir, cacheKey)
        if (cacheFile.exists()) {
            try {
                val cachedJson = cacheFile.readText()
                val cached = json.decodeFromString<CachedResponse>(cachedJson)
                
                if (!isExpired(cached)) {
                    Log.d(TAG, "💾 디스크 캐시 히트: $endpoint")
                    // 메모리 캐시에도 저장
                    memoryCache.put(cacheKey, cached)
                    return@withContext cached.data
                } else {
                    Log.d(TAG, "⏰ 디스크 캐시 만료됨: $endpoint")
                    cacheFile.delete()
                }
            } catch (e: Exception) {
                Log.e(TAG, "❌ 디스크 캐시 읽기 실패: ${e.message}")
                cacheFile.delete()
            }
        }
        
        Log.d(TAG, "❌ 캐시 미스: $endpoint")
        return@withContext null
    }
    
    /**
     * 응답을 캐시에 저장
     */
    suspend fun cacheResponse(
        endpoint: String,
        parameters: Map<String, String>,
        response: String,
        expirationTime: Long
    ) = withContext(Dispatchers.IO) {
        // 빈 응답은 캐시하지 않음 (iOS와 동일한 로직)
        if (shouldSkipCaching(endpoint, parameters, response)) {
            Log.d(TAG, "⏭️ 캐싱 스킵: $endpoint")
            return@withContext
        }
        
        val cacheKey = generateCacheKey(endpoint, parameters)
        val cachedResponse = CachedResponse(
            data = response,
            timestamp = System.currentTimeMillis(),
            expirationTime = expirationTime,
            endpoint = endpoint,
            parameters = parameters
        )
        
        // 메모리 캐시에 저장
        memoryCache.put(cacheKey, cachedResponse)
        
        // 디스크 캐시에 저장
        try {
            val cacheFile = File(cacheDir, cacheKey)
            val cachedJson = json.encodeToString(cachedResponse)
            cacheFile.writeText(cachedJson)
            Log.d(TAG, "💾 캐시 저장 완료: $endpoint (만료: ${expirationTime / 1000 / 60}분)")
        } catch (e: Exception) {
            Log.e(TAG, "❌ 디스크 캐시 저장 실패: ${e.message}")
        }
    }
    
    /**
     * 만료된 캐시 정리
     */
    suspend fun cleanExpiredCache() = withContext(Dispatchers.IO) {
        Log.d(TAG, "🧹 만료된 캐시 정리 시작...")
        
        var cleanedCount = 0
        
        // 디스크 캐시 정리
        cacheDir.listFiles()?.forEach { file ->
            try {
                val cachedJson = file.readText()
                val cached = json.decodeFromString<CachedResponse>(cachedJson)
                
                if (isExpired(cached)) {
                    file.delete()
                    cleanedCount++
                }
            } catch (e: Exception) {
                // 파싱 실패한 파일은 삭제
                file.delete()
                cleanedCount++
            }
        }
        
        Log.d(TAG, "✅ 캐시 정리 완료: ${cleanedCount}개 파일 삭제됨")
    }
    
    /**
     * 모든 캐시 삭제
     */
    suspend fun clearAllCache() = withContext(Dispatchers.IO) {
        memoryCache.evictAll()
        cacheDir.deleteRecursively()
        cacheDir.mkdirs()
        Log.d(TAG, "🗑️ 모든 캐시 삭제 완료")
    }
    
    /**
     * 캐시 크기 계산
     */
    suspend fun getCacheSize(): Long = withContext(Dispatchers.IO) {
        var size = 0L
        cacheDir.listFiles()?.forEach { file ->
            size += file.length()
        }
        return@withContext size
    }
    
    /**
     * 캐시 키 생성 (iOS와 동일한 로직)
     */
    private fun generateCacheKey(endpoint: String, parameters: Map<String, String>): String {
        val sortedParams = parameters.toSortedMap()
        val keyString = "$endpoint?${sortedParams.entries.joinToString("&") { "${it.key}=${it.value}" }}"
        
        return try {
            val digest = MessageDigest.getInstance("SHA-256")
            val hash = digest.digest(keyString.toByteArray())
            hash.joinToString("") { "%02x".format(it) }
        } catch (e: Exception) {
            // SHA-256 실패 시 간단한 해시 사용
            keyString.hashCode().toString()
        }
    }
    
    /**
     * 캐시 만료 확인
     */
    private fun isExpired(cached: CachedResponse): Boolean {
        return System.currentTimeMillis() - cached.timestamp > cached.expirationTime
    }
    
    /**
     * 캐싱을 스킵해야 하는지 확인 (iOS와 동일한 로직)
     */
    private fun shouldSkipCaching(
        endpoint: String,
        parameters: Map<String, String>,
        response: String
    ): Boolean {
        // 빈 응답 체크
        try {
            val jsonObject = json.parseToJsonElement(response)
            val responseArray = jsonObject.jsonObject["response"]?.jsonArray
            
            if (responseArray != null && responseArray.isEmpty()) {
                // 라이브 경기나 특정 날짜의 빈 응답은 캐시하지 않음
                if (endpoint.contains("fixtures") && parameters["live"] == "all") {
                    return true
                }
                
                if (endpoint.contains("fixtures") && parameters["date"] != null) {
                    return true
                }
                
                if (endpoint.contains("fixtures") && parameters["league"] != null) {
                    return true
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "응답 파싱 실패: ${e.message}")
        }
        
        return false
    }
    
    /**
     * 캐시 만료 시간 enum
     */
    enum class CacheExpiration(val duration: Long) {
        VERY_SHORT(CACHE_EXPIRATION_VERY_SHORT),
        SHORT(CACHE_EXPIRATION_SHORT),
        MEDIUM(CACHE_EXPIRATION_MEDIUM),
        LONG(CACHE_EXPIRATION_LONG),
        VERY_LONG(CACHE_EXPIRATION_VERY_LONG)
    }
    
    /**
     * 캐시에서 데이터 가져오기 (간단한 버전)
     */
    suspend fun getCache(
        endpoint: String,
        parameters: Map<String, String>
    ): String? = getCachedResponse(endpoint, parameters, false)
    
    /**
     * 캐시에 데이터 저장하기 (간단한 버전)
     */
    suspend fun setCache(
        response: String,
        endpoint: String,
        parameters: Map<String, String>,
        expiration: CacheExpiration
    ) = cacheResponse(endpoint, parameters, response, expiration.duration)
    
    /**
     * 엔드포인트별 캐시 만료 시간 결정
     */
    fun getCacheExpirationTime(endpoint: String): Long {
        return when {
            // 실시간 데이터 - 매우 짧은 캐시
            endpoint.contains("fixtures") && endpoint.contains("live") -> CACHE_EXPIRATION_VERY_SHORT
            
            // 오늘 경기 - 짧은 캐시
            endpoint.contains("fixtures") && endpoint.contains("date") -> CACHE_EXPIRATION_SHORT
            
            // 순위, 통계 - 중간 캐시
            endpoint.contains("standings") -> CACHE_EXPIRATION_MEDIUM
            endpoint.contains("statistics") -> CACHE_EXPIRATION_MEDIUM
            
            // 팀, 선수 정보 - 긴 캐시
            endpoint.contains("teams") -> CACHE_EXPIRATION_LONG
            endpoint.contains("players") -> CACHE_EXPIRATION_LONG
            
            // 리그 정보 - 매우 긴 캐시
            endpoint.contains("leagues") -> CACHE_EXPIRATION_VERY_LONG
            
            // 기본값
            else -> CACHE_EXPIRATION_MEDIUM
        }
    }
}