package com.hyunwoopark.futinfo.data.cache

/**
 * 캐시 정책을 정의하는 데이터 클래스
 */
data class CachePolicy(
    val useCache: Boolean = true,
    val forceRefresh: Boolean = false,
    val expiration: ApiCacheManager.CacheExpiration = ApiCacheManager.CacheExpiration.MEDIUM
) {
    companion object {
        // 자주 사용되는 캐시 정책들
        val DEFAULT = CachePolicy()
        val NO_CACHE = CachePolicy(useCache = false)
        val FORCE_REFRESH = CachePolicy(forceRefresh = true)
        val LIVE_MATCH = CachePolicy(expiration = ApiCacheManager.CacheExpiration.VERY_SHORT)
        val STATIC_DATA = CachePolicy(expiration = ApiCacheManager.CacheExpiration.VERY_LONG)
    }
}