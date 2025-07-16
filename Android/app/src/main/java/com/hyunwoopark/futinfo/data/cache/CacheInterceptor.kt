package com.hyunwoopark.futinfo.data.cache

import kotlinx.coroutines.runBlocking
import kotlinx.coroutines.GlobalScope
import kotlinx.coroutines.launch
import kotlinx.coroutines.Dispatchers
import okhttp3.Interceptor
import okhttp3.Response
import okhttp3.ResponseBody.Companion.toResponseBody
import okhttp3.MediaType.Companion.toMediaType
import javax.inject.Inject

/**
 * OkHttp 인터셉터로 API 응답을 캐싱하고 캐시된 응답을 반환합니다.
 */
class CacheInterceptor @Inject constructor(
    private val cacheManager: ApiCacheManager
) : Interceptor {
    
    override fun intercept(chain: Interceptor.Chain): Response {
        val request = chain.request()
        val url = request.url
        
        // API 엔드포인트와 파라미터 추출
        val endpoint = url.pathSegments.joinToString("/")
        val parameters = url.queryParameterNames.associateWith { name ->
            url.queryParameter(name) ?: ""
        }
        
        // 캐시 확인 (GET 요청만)
        if (request.method == "GET") {
            // Force refresh 헤더 확인
            val forceRefresh = request.header("X-Force-Refresh") == "true"
            
            if (!forceRefresh) {
                // 블로킹을 최소화하기 위해 짧은 시간 동안만 runBlocking 사용
                val cachedData = runBlocking {
                    cacheManager.getCache(endpoint, parameters)
                }
                
                cachedData?.let {
                    // 캐시된 응답 반환
                    return Response.Builder()
                        .request(request)
                        .protocol(okhttp3.Protocol.HTTP_1_1)
                        .code(200)
                        .message("OK (from cache)")
                        .header("X-Cache-Hit", "true")
                        .body(it.toResponseBody("application/json".toMediaType()))
                        .build()
                }
            }
        }
        
        // 실제 네트워크 요청 실행
        val response = chain.proceed(request)
        
        // 성공적인 GET 응답 캐싱
        if (request.method == "GET" && response.isSuccessful) {
            // Cache-Control 헤더 확인
            val cacheControl = response.header("Cache-Control")
            val shouldCache = cacheControl?.contains("no-cache") != true && 
                             cacheControl?.contains("no-store") != true
            
            if (shouldCache) {
                response.body?.let { body ->
                    val responseData = body.string()
                    
                    // 비동기로 캐시 저장 (블로킹하지 않음)
                    val cacheExpiration = getCacheExpiration(endpoint)
                    // 비동기로 캐시 저장
                    kotlinx.coroutines.GlobalScope.launch(kotlinx.coroutines.Dispatchers.IO) {
                        try {
                            cacheManager.setCache(responseData, endpoint, parameters, cacheExpiration)
                        } catch (e: Exception) {
                            android.util.Log.e("CacheInterceptor", "Failed to cache response: ${e.message}")
                        }
                    }
                    
                    // 새로운 응답 생성 (body는 한 번만 읽을 수 있음)
                    return response.newBuilder()
                        .header("X-Cache-Hit", "false")
                        .body(responseData.toResponseBody(body.contentType()))
                        .build()
                }
            }
        }
        
        return response
    }
    
    /**
     * 엔드포인트별 캐시 만료 시간 결정
     */
    private fun getCacheExpiration(endpoint: String): ApiCacheManager.CacheExpiration {
        return when {
            // 라이브 경기는 매우 짧은 캐시 (5분)
            endpoint.contains("fixtures") && endpoint.contains("live") -> 
                ApiCacheManager.CacheExpiration.VERY_SHORT
            
            // 특정 날짜의 경기 정보는 짧은 캐시 (15분)
            endpoint.contains("fixtures") && endpoint.contains("date") -> 
                ApiCacheManager.CacheExpiration.SHORT
            
            // 일반 경기 정보는 중간 캐시 (30분)
            endpoint.contains("fixtures") -> 
                ApiCacheManager.CacheExpiration.MEDIUM
            
            // 순위표는 중간 캐시 (30분)
            endpoint.contains("standings") -> 
                ApiCacheManager.CacheExpiration.MEDIUM
            
            // 통계 정보는 중간 캐시 (30분)
            endpoint.contains("statistics") -> 
                ApiCacheManager.CacheExpiration.MEDIUM
            
            // 팀 정보는 긴 캐시 (1시간)
            endpoint.contains("teams") -> 
                ApiCacheManager.CacheExpiration.LONG
            
            // 선수 정보는 긴 캐시 (1시간)
            endpoint.contains("players") -> 
                ApiCacheManager.CacheExpiration.LONG
            
            // 리그 정보는 매우 긴 캐시 (12시간)
            endpoint.contains("leagues") -> 
                ApiCacheManager.CacheExpiration.VERY_LONG
            
            // 기본값
            else -> ApiCacheManager.CacheExpiration.MEDIUM
        }
    }
}