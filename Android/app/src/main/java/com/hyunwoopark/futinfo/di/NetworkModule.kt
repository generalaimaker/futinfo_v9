package com.hyunwoopark.futinfo.di

import android.content.Context
import com.hyunwoopark.futinfo.data.cache.ApiCacheManager
import com.hyunwoopark.futinfo.data.cache.CacheInterceptor
import com.hyunwoopark.futinfo.data.remote.FootballApiService
import com.hyunwoopark.futinfo.util.ImageCacheManager
import com.jakewharton.retrofit2.converter.kotlinx.serialization.asConverterFactory
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.android.qualifiers.ApplicationContext
import dagger.hilt.components.SingletonComponent
import kotlinx.serialization.json.Json
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import java.util.concurrent.TimeUnit
import javax.inject.Singleton
import javax.net.ssl.HostnameVerifier
import javax.net.ssl.HttpsURLConnection

/**
 * 네트워킹 관련 의존성을 제공하는 Hilt 모듈
 */
@Module
@InstallIn(SingletonComponent::class)
object NetworkModule {
    
    // IP 주소를 직접 사용하여 DNS 해결 문제 우회
    private const val BASE_URL = "https://54.150.0.156/v3/"
    private const val TIMEOUT_SECONDS = 30L
    
    /**
     * JSON 직렬화/역직렬화를 위한 Json 인스턴스를 제공합니다.
     */
    @Provides
    @Singleton
    fun provideJson(): Json = Json {
        ignoreUnknownKeys = true // API 응답에서 알 수 없는 필드 무시
        coerceInputValues = true // null 값을 기본값으로 변환
        encodeDefaults = false // 기본값은 인코딩하지 않음
    }
    
    /**
     * API 캐시 매니저를 제공합니다.
     */
    @Provides
    @Singleton
    fun provideApiCacheManager(
        @ApplicationContext context: Context,
        json: Json
    ): ApiCacheManager {
        return ApiCacheManager(context, json)
    }
    
    /**
     * 캐시 인터셉터를 제공합니다.
     */
    @Provides
    @Singleton
    fun provideCacheInterceptor(
        apiCacheManager: ApiCacheManager
    ): CacheInterceptor {
        return CacheInterceptor(apiCacheManager)
    }
    
    /**
     * HTTP 로깅 인터셉터를 제공합니다.
     * 개발 중에는 BODY 레벨로, 프로덕션에서는 NONE으로 설정해야 합니다.
     */
    @Provides
    @Singleton
    fun provideHttpLoggingInterceptor(): HttpLoggingInterceptor {
        return HttpLoggingInterceptor().apply {
            level = HttpLoggingInterceptor.Level.BODY // 개발용 - 프로덕션에서는 NONE으로 변경
        }
    }
    
    /**
     * OkHttpClient를 제공합니다.
     * 타임아웃, 로깅, API 키 헤더 등을 설정합니다.
     */
    @Provides
    @Singleton
    fun provideOkHttpClient(
        loggingInterceptor: HttpLoggingInterceptor,
        cacheInterceptor: CacheInterceptor
    ): OkHttpClient {
        // SSL 인증서 문제 해결을 위한 HostnameVerifier
        val hostnameVerifier = HostnameVerifier { hostname, session ->
            // IP 주소 54.150.0.156에 대해 *.p.rapidapi.com 인증서 허용
            when (hostname) {
                "54.150.0.156" -> {
                    android.util.Log.d("FutInfo_API", "🔒 SSL: IP 주소 54.150.0.156에 대해 *.p.rapidapi.com 인증서 허용")
                    true
                }
                else -> {
                    // 기본 호스트명 검증 사용
                    HttpsURLConnection.getDefaultHostnameVerifier().verify(hostname, session)
                }
            }
        }
        
        return OkHttpClient.Builder()
            .connectTimeout(TIMEOUT_SECONDS, TimeUnit.SECONDS)
            .readTimeout(TIMEOUT_SECONDS, TimeUnit.SECONDS)
            .writeTimeout(TIMEOUT_SECONDS, TimeUnit.SECONDS)
            .hostnameVerifier(hostnameVerifier)
            .addInterceptor(cacheInterceptor) // 캐시 인터셉터를 먼저 추가
            .addInterceptor(loggingInterceptor)
            .addInterceptor { chain ->
                // API 키 헤더를 자동으로 추가하는 인터셉터
                val originalRequest = chain.request()
                
                // 🔍 DEBUG: 요청 URL 로그
                android.util.Log.d("FutInfo_API", "🌐 Request URL: ${originalRequest.url}")
                
                val newRequest = originalRequest.newBuilder()
                    // RapidAPI 헤더 사용
                    .addHeader("X-RapidAPI-Key", "bd09a1efecmshf47e95710709f44p1dcafdjsn072eabc66aa4")
    .addHeader("X-RapidAPI-Host", "api-football-v1.p.rapidapi.com")
                    .build()
                
                // 🔍 DEBUG: 요청 헤더 로그
                android.util.Log.d("FutInfo_API", "📋 Request Headers:")
                newRequest.headers.forEach { header ->
                    android.util.Log.d("FutInfo_API", "  ${header.first}: ${header.second}")
                }
                
                try {
                    val response = chain.proceed(newRequest)
                    
                    // 🔍 DEBUG: 응답 상태 로그
                    android.util.Log.d("FutInfo_API", "📥 Response Code: ${response.code}")
                    android.util.Log.d("FutInfo_API", "📥 Response Message: ${response.message}")
                    
                    if (!response.isSuccessful) {
                        // 🔍 DEBUG: 에러 응답 본문 로그
                        val errorBody = response.peekBody(2048).string()
                        android.util.Log.e("FutInfo_API", "❌ Error Response Body: $errorBody")
                        
                        // API 에러 상세 분석
                        when (response.code) {
                            401 -> {
                                android.util.Log.e("FutInfo_API", "🔑 인증 오류: API 키가 유효하지 않거나 누락됨")
                                android.util.Log.e("FutInfo_API", "💡 해결방법: API 키를 확인하고 올바른 엔드포인트를 사용하세요")
                            }
                            403 -> {
                                android.util.Log.e("FutInfo_API", "🚫 접근 거부: API 구독이 필요하거나 권한이 부족합니다")
                                android.util.Log.e("FutInfo_API", "💡 해결방법: RapidAPI에서 올바른 플랜을 구독했는지 확인하세요")
                            }
                            429 -> {
                                android.util.Log.e("FutInfo_API", "⏰ 요청 제한: API 호출 한도 초과")
                                android.util.Log.e("FutInfo_API", "💡 해결방법: 잠시 후 다시 시도하거나 요청 간격을 늘리세요")
                                // 429 에러 시 잠시 대기
                                Thread.sleep(2000)
                            }
                            500 -> android.util.Log.e("FutInfo_API", "🔧 서버 오류: API 서버 내부 오류")
                            else -> android.util.Log.e("FutInfo_API", "❓ 알 수 없는 오류: HTTP ${response.code}")
                        }
                    } else {
                        // 성공적인 응답의 경우 응답 본문 일부 로그
                        val responseBody = response.peekBody(1024).string()
                        android.util.Log.d("FutInfo_API", "✅ Success Response Preview: ${responseBody.take(200)}...")
                    }
                    
                    response
                } catch (e: Exception) {
                    // 🔍 DEBUG: 네트워크 예외 로그
                    android.util.Log.e("FutInfo_API", "🚨 Network Exception: ${e.message}", e)
                    
                    // 예외 타입별 상세 로그
                    when (e) {
                        is java.net.UnknownHostException -> {
                            android.util.Log.e("FutInfo_API", "🌐 네트워크 연결 오류: 인터넷 연결을 확인하세요")
                        }
                        is java.net.SocketTimeoutException -> {
                            android.util.Log.e("FutInfo_API", "⏱️ 타임아웃 오류: 서버 응답 시간 초과")
                        }
                        is javax.net.ssl.SSLException -> {
                            android.util.Log.e("FutInfo_API", "🔒 SSL 오류: 보안 연결 문제")
                        }
                        else -> {
                            android.util.Log.e("FutInfo_API", "❓ 기타 네트워크 오류: ${e.javaClass.simpleName}")
                        }
                    }
                    throw e
                }
            }
            .build()
    }
    
    /**
     * Retrofit 인스턴스를 제공합니다.
     */
    @Provides
    @Singleton
    fun provideRetrofit(
        okHttpClient: OkHttpClient,
        json: Json
    ): Retrofit {
        val contentType = "application/json".toMediaType()
        return Retrofit.Builder()
            .baseUrl(BASE_URL)
            .client(okHttpClient)
            .addConverterFactory(json.asConverterFactory(contentType))
            .build()
    }
    
    /**
     * FootballApiService 인스턴스를 제공합니다.
     */
    @Provides
    @Singleton
    fun provideFootballApiService(retrofit: Retrofit): FootballApiService {
        return retrofit.create(FootballApiService::class.java)
    }
    
    /**
     * ImageCacheManager 인스턴스를 제공합니다.
     * 이미지 로딩 및 캐싱을 위한 매니저입니다.
     */
    @Provides
    @Singleton
    fun provideImageCacheManager(
        @ApplicationContext context: Context,
        okHttpClient: OkHttpClient
    ): ImageCacheManager {
        return ImageCacheManager(context, okHttpClient)
    }
}