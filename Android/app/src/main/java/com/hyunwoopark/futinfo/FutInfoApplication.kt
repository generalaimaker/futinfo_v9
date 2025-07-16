package com.hyunwoopark.futinfo

import android.app.Application
import com.hyunwoopark.futinfo.data.cache.ApiCacheManager
import dagger.hilt.android.HiltAndroidApp
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch
import javax.inject.Inject

/**
 * FutInfo 애플리케이션 클래스
 * Hilt를 사용하여 의존성 주입을 초기화합니다.
 */
@HiltAndroidApp
class FutInfoApplication : Application() {
    
    override fun onCreate() {
        super.onCreate()
        
        // 캐시 정리는 CacheCleanupWorker를 통해 처리
        // 앱 시작 시 및 주기적으로 만료된 캐시를 정리
        scheduleCacheCleanup()
    }
    
    private fun scheduleCacheCleanup() {
        // WorkManager를 사용하여 주기적인 캐시 정리 스케줄링
        // TODO: WorkManager 구현 필요
    }
}