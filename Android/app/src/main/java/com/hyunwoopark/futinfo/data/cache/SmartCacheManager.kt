package com.hyunwoopark.futinfo.data.cache

import android.content.Context
import android.util.Log
import com.hyunwoopark.futinfo.domain.model.Fixture
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import kotlinx.serialization.json.Json
import javax.inject.Inject
import javax.inject.Singleton

/**
 * iOS의 SmartCacheManager와 동일한 지능형 캐시 관리 시스템
 * 경기 상태에 따라 캐시 전략을 동적으로 조정
 */
@Singleton
class SmartCacheManager @Inject constructor(
    private val context: Context,
    private val json: Json,
    private val apiCacheManager: ApiCacheManager
) {
    
    companion object {
        private const val TAG = "SmartCacheManager"
        
        // 경기 상태별 캐시 만료 시간
        private const val LIVE_MATCH_CACHE_DURATION = 30 * 1000L // 30초
        private const val FINISHED_MATCH_CACHE_DURATION = 24 * 60 * 60 * 1000L // 24시간
        private const val SCHEDULED_MATCH_CACHE_DURATION = 2 * 60 * 60 * 1000L // 2시간
        private const val POSTPONED_MATCH_CACHE_DURATION = 30 * 60 * 1000L // 30분
    }
    
    /**
     * 경기 상태별 캐시 전략 결정
     */
    suspend fun getCacheStrategyForFixtures(
        fixtures: List<Fixture>,
        endpoint: String,
        parameters: Map<String, String>
    ): CacheStrategy = withContext(Dispatchers.Default) {
        
        val liveMatches = fixtures.filter { isLiveMatch(it) }
        val finishedMatches = fixtures.filter { isFinishedMatch(it) }
        val scheduledMatches = fixtures.filter { isScheduledMatch(it) }
        val postponedMatches = fixtures.filter { isPostponedMatch(it) }
        
        Log.d(TAG, "🧠 경기 상태 분석 - 라이브: ${liveMatches.size}, 완료: ${finishedMatches.size}, 예정: ${scheduledMatches.size}, 연기: ${postponedMatches.size}")
        
        return@withContext when {
            // 라이브 경기가 있으면 매우 짧은 캐시
            liveMatches.isNotEmpty() -> {
                Log.d(TAG, "⚡ 라이브 경기 감지 - 짧은 캐시 적용")
                CacheStrategy(
                    duration = LIVE_MATCH_CACHE_DURATION,
                    reason = "라이브 경기 진행 중",
                    shouldCache = true
                )
            }
            
            // 연기된 경기가 있으면 중간 캐시
            postponedMatches.isNotEmpty() -> {
                Log.d(TAG, "⏸️ 연기된 경기 감지 - 중간 캐시 적용")
                CacheStrategy(
                    duration = POSTPONED_MATCH_CACHE_DURATION,
                    reason = "경기 연기됨",
                    shouldCache = true
                )
            }
            
            // 예정된 경기만 있으면 긴 캐시
            scheduledMatches.isNotEmpty() && finishedMatches.isEmpty() -> {
                Log.d(TAG, "📅 예정된 경기만 있음 - 긴 캐시 적용")
                CacheStrategy(
                    duration = SCHEDULED_MATCH_CACHE_DURATION,
                    reason = "예정된 경기만 있음",
                    shouldCache = true
                )
            }
            
            // 완료된 경기만 있으면 매우 긴 캐시
            finishedMatches.isNotEmpty() && scheduledMatches.isEmpty() -> {
                Log.d(TAG, "✅ 완료된 경기만 있음 - 매우 긴 캐시 적용")
                CacheStrategy(
                    duration = FINISHED_MATCH_CACHE_DURATION,
                    reason = "완료된 경기만 있음",
                    shouldCache = true
                )
            }
            
            // 혼합된 경기 상태
            else -> {
                Log.d(TAG, "🔄 혼합된 경기 상태 - 기본 캐시 적용")
                CacheStrategy(
                    duration = apiCacheManager.getCacheExpirationTime(endpoint),
                    reason = "혼합된 경기 상태",
                    shouldCache = true
                )
            }
        }
    }
    
    /**
     * 경기별 개별 캐시 전략 결정
     */
    suspend fun getCacheStrategyForSingleFixture(
        fixture: Fixture,
        endpoint: String
    ): CacheStrategy = withContext(Dispatchers.Default) {
        
        return@withContext when {
            isLiveMatch(fixture) -> CacheStrategy(
                duration = LIVE_MATCH_CACHE_DURATION,
                reason = "라이브 경기",
                shouldCache = true
            )
            
            isFinishedMatch(fixture) -> CacheStrategy(
                duration = FINISHED_MATCH_CACHE_DURATION,
                reason = "완료된 경기",
                shouldCache = true
            )
            
            isScheduledMatch(fixture) -> CacheStrategy(
                duration = SCHEDULED_MATCH_CACHE_DURATION,
                reason = "예정된 경기",
                shouldCache = true
            )
            
            isPostponedMatch(fixture) -> CacheStrategy(
                duration = POSTPONED_MATCH_CACHE_DURATION,
                reason = "연기된 경기",
                shouldCache = true
            )
            
            else -> CacheStrategy(
                duration = apiCacheManager.getCacheExpirationTime(endpoint),
                reason = "기본 캐시",
                shouldCache = true
            )
        }
    }
    
    /**
     * 팀 통계 캐시 전략 결정
     */
    suspend fun getCacheStrategyForTeamStats(
        teamId: Int,
        season: Int,
        endpoint: String
    ): CacheStrategy = withContext(Dispatchers.Default) {
        
        val currentSeason = getCurrentSeason()
        
        return@withContext when {
            // 현재 시즌 통계는 중간 캐시
            season == currentSeason -> CacheStrategy(
                duration = ApiCacheManager.CACHE_EXPIRATION_MEDIUM,
                reason = "현재 시즌 통계",
                shouldCache = true
            )
            
            // 과거 시즌 통계는 매우 긴 캐시
            season < currentSeason -> CacheStrategy(
                duration = ApiCacheManager.CACHE_EXPIRATION_VERY_LONG,
                reason = "과거 시즌 통계",
                shouldCache = true
            )
            
            // 미래 시즌은 캐시하지 않음
            else -> CacheStrategy(
                duration = 0L,
                reason = "미래 시즌 통계",
                shouldCache = false
            )
        }
    }
    
    /**
     * 순위 테이블 캐시 전략 결정
     */
    suspend fun getCacheStrategyForStandings(
        leagueId: Int,
        season: Int,
        endpoint: String
    ): CacheStrategy = withContext(Dispatchers.Default) {
        
        val currentSeason = getCurrentSeason()
        
        return@withContext when {
            // 현재 시즌 순위는 중간 캐시
            season == currentSeason -> {
                // 주요 리그는 더 자주 업데이트
                val duration = if (isMajorLeague(leagueId)) {
                    ApiCacheManager.CACHE_EXPIRATION_SHORT
                } else {
                    ApiCacheManager.CACHE_EXPIRATION_MEDIUM
                }
                
                CacheStrategy(
                    duration = duration,
                    reason = "현재 시즌 순위",
                    shouldCache = true
                )
            }
            
            // 과거 시즌 순위는 매우 긴 캐시
            season < currentSeason -> CacheStrategy(
                duration = ApiCacheManager.CACHE_EXPIRATION_VERY_LONG,
                reason = "과거 시즌 순위",
                shouldCache = true
            )
            
            // 미래 시즌은 캐시하지 않음
            else -> CacheStrategy(
                duration = 0L,
                reason = "미래 시즌 순위",
                shouldCache = false
            )
        }
    }
    
    /**
     * 캐시 무효화가 필요한지 확인
     */
    suspend fun shouldInvalidateCache(
        endpoint: String,
        parameters: Map<String, String>,
        newData: String
    ): Boolean = withContext(Dispatchers.Default) {
        
        // 캐시된 데이터 가져오기
        val cachedData = apiCacheManager.getCachedResponse(endpoint, parameters, false)
        
        return@withContext when {
            cachedData == null -> false // 캐시가 없으면 무효화 불필요
            
            // 라이브 경기 데이터가 변경되었으면 무효화
            endpoint.contains("fixtures") && parameters["live"] == "all" -> {
                val hasLiveDataChanged = compareLiveMatchData(cachedData, newData)
                if (hasLiveDataChanged) {
                    Log.d(TAG, "🔄 라이브 경기 데이터 변경 감지 - 캐시 무효화")
                }
                hasLiveDataChanged
            }
            
            // 순위 데이터가 변경되었으면 무효화
            endpoint.contains("standings") -> {
                val hasStandingChanged = compareStandingData(cachedData, newData)
                if (hasStandingChanged) {
                    Log.d(TAG, "🔄 순위 데이터 변경 감지 - 캐시 무효화")
                }
                hasStandingChanged
            }
            
            else -> false
        }
    }
    
    /**
     * 경기 상태 판별 메서드들
     */
    private fun isLiveMatch(fixture: Fixture): Boolean {
        return fixture.statusShort.contains("1H") || fixture.statusShort.contains("2H") || 
               fixture.statusShort.contains("HT") || fixture.statusShort.contains("ET") || 
               fixture.statusShort.contains("BT") || fixture.statusShort.contains("P") ||
               fixture.statusShort.contains("LIVE")
    }
    
    private fun isFinishedMatch(fixture: Fixture): Boolean {
        return fixture.statusShort.contains("FT") || fixture.statusShort.contains("AET") || 
               fixture.statusShort.contains("PEN")
    }
    
    private fun isScheduledMatch(fixture: Fixture): Boolean {
        return fixture.statusShort.contains("NS") || fixture.statusShort.contains("TBD")
    }
    
    private fun isPostponedMatch(fixture: Fixture): Boolean {
        return fixture.statusShort.contains("PST") || fixture.statusShort.contains("CANC") ||
               fixture.statusShort.contains("ABD") || fixture.statusShort.contains("SUSP")
    }
    
    /**
     * 주요 리그 판별
     */
    private fun isMajorLeague(leagueId: Int): Boolean {
        return leagueId in listOf(
            39,   // 프리미어 리그
            140,  // 라리가
            135,  // 세리에 A
            78,   // 분데스리가
            61,   // 리그 1
            2,    // 챔피언스 리그
            3     // 유로파 리그
        )
    }
    
    /**
     * 현재 시즌 계산
     */
    private fun getCurrentSeason(): Int {
        val currentYear = java.util.Calendar.getInstance().get(java.util.Calendar.YEAR)
        val currentMonth = java.util.Calendar.getInstance().get(java.util.Calendar.MONTH) + 1
        
        return if (currentMonth >= 8) {
            currentYear
        } else {
            currentYear - 1
        }
    }
    
    /**
     * 라이브 경기 데이터 비교
     */
    private fun compareLiveMatchData(cachedData: String, newData: String): Boolean {
        return try {
            val cachedJson = json.parseToJsonElement(cachedData)
            val newJson = json.parseToJsonElement(newData)
            
            // 간단한 문자열 비교 (실제로는 더 정교한 비교 필요)
            cachedJson.toString() != newJson.toString()
        } catch (e: Exception) {
            Log.e(TAG, "라이브 데이터 비교 실패: ${e.message}")
            true // 비교 실패 시 무효화
        }
    }
    
    /**
     * 순위 데이터 비교
     */
    private fun compareStandingData(cachedData: String, newData: String): Boolean {
        return try {
            val cachedJson = json.parseToJsonElement(cachedData)
            val newJson = json.parseToJsonElement(newData)
            
            // 간단한 문자열 비교 (실제로는 더 정교한 비교 필요)
            cachedJson.toString() != newJson.toString()
        } catch (e: Exception) {
            Log.e(TAG, "순위 데이터 비교 실패: ${e.message}")
            true // 비교 실패 시 무효화
        }
    }
}

/**
 * 캐시 전략 데이터 클래스
 */
data class CacheStrategy(
    val duration: Long,
    val reason: String,
    val shouldCache: Boolean
)