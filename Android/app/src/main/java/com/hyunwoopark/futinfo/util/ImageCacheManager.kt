package com.hyunwoopark.futinfo.util

import android.content.Context
import coil.ImageLoader
import coil.disk.DiskCache
import coil.memory.MemoryCache
import coil.request.CachePolicy
import coil.util.DebugLogger
import dagger.hilt.android.qualifiers.ApplicationContext
import okhttp3.OkHttpClient
import javax.inject.Inject
import javax.inject.Singleton

/**
 * 이미지 로딩 및 캐싱을 관리하는 매니저 클래스
 * 
 * Coil 라이브러리를 사용하여 효율적인 이미지 로딩과 캐싱을 제공합니다.
 * - 메모리 캐시: 빠른 접근을 위한 RAM 캐시
 * - 디스크 캐시: 영구 저장을 위한 디스크 캐시
 * - 네트워크 최적화: OkHttp 클라이언트 재사용
 */
@Singleton
class ImageCacheManager @Inject constructor(
    @ApplicationContext private val context: Context,
    private val okHttpClient: OkHttpClient
) {
    
    /**
     * 최적화된 ImageLoader 인스턴스
     */
    val imageLoader: ImageLoader by lazy {
        ImageLoader.Builder(context)
            .okHttpClient(okHttpClient)
            .memoryCache {
                MemoryCache.Builder(context)
                    .maxSizePercent(0.25) // 사용 가능한 메모리의 25% 사용
                    .build()
            }
            .diskCache {
                DiskCache.Builder()
                    .directory(context.cacheDir.resolve("image_cache"))
                    .maxSizeBytes(50 * 1024 * 1024) // 50MB 디스크 캐시
                    .build()
            }
            .respectCacheHeaders(false) // 캐시 헤더 무시하고 강제 캐싱
            .build()
    }
    
    /**
     * 리그 로고 이미지를 위한 캐시 정책
     */
    fun getLeagueLogoCachePolicy(): CachePolicy {
        return CachePolicy.ENABLED
    }
    
    /**
     * 팀 로고 이미지를 위한 캐시 정책
     */
    fun getTeamLogoCachePolicy(): CachePolicy {
        return CachePolicy.ENABLED
    }
    
    /**
     * 플레이어 이미지를 위한 캐시 정책
     */
    fun getPlayerImageCachePolicy(): CachePolicy {
        return CachePolicy.ENABLED
    }
    
    /**
     * 캐시 크기 정보를 반환합니다.
     */
    fun getCacheInfo(): CacheInfo {
        val memoryCache = imageLoader.memoryCache
        val diskCache = imageLoader.diskCache
        
        return CacheInfo(
            memoryCacheSize = memoryCache?.size?.toLong() ?: 0L,
            memoryMaxSize = memoryCache?.maxSize?.toLong() ?: 0L,
            diskCacheSize = diskCache?.size?.toLong() ?: 0L,
            diskMaxSize = diskCache?.maxSize?.toLong() ?: 0L
        )
    }
    
    /**
     * 메모리 캐시를 정리합니다.
     */
    fun clearMemoryCache() {
        imageLoader.memoryCache?.clear()
    }
    
    /**
     * 디스크 캐시를 정리합니다.
     */
    suspend fun clearDiskCache() {
        imageLoader.diskCache?.clear()
    }
    
    /**
     * 모든 캐시를 정리합니다.
     */
    suspend fun clearAllCache() {
        clearMemoryCache()
        clearDiskCache()
    }
    
    /**
     * 캐시 정보를 담는 데이터 클래스
     */
    data class CacheInfo(
        val memoryCacheSize: Long,
        val memoryMaxSize: Long,
        val diskCacheSize: Long,
        val diskMaxSize: Long
    ) {
        val memoryUsagePercent: Float
            get() = if (memoryMaxSize > 0) (memoryCacheSize.toFloat() / memoryMaxSize) * 100 else 0f
            
        val diskUsagePercent: Float
            get() = if (diskMaxSize > 0) (diskCacheSize.toFloat() / diskMaxSize) * 100 else 0f
    }
}