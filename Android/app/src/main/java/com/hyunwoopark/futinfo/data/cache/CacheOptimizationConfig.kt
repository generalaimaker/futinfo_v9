package com.hyunwoopark.futinfo.data.cache

/**
 * 축구팬을 위한 최적화된 캐시 설정
 * 실시간성과 데이터 효율성의 균형을 맞춤
 */
object CacheOptimizationConfig {
    
    /**
     * 라이브 경기 업데이트 주기 (2분)
     * - 골, 카드, 교체 등의 이벤트를 빠르게 반영
     * - API 호출을 최소화하면서도 실시간성 유지
     */
    const val LIVE_MATCH_UPDATE_INTERVAL = 2 * 60 * 1000L // 2분
    
    /**
     * 오늘 경기 업데이트 주기 (10분)
     * - 킥오프 시간, 라인업 변경 등을 반영
     * - 경기 시작 전후로 자주 변경되는 정보 고려
     */
    const val TODAY_FIXTURES_UPDATE_INTERVAL = 10 * 60 * 1000L // 10분
    
    /**
     * 실시간 순위 업데이트 주기 (15분)
     * - 경기 진행 중 순위 변동 반영
     * - 경기가 없는 날은 더 긴 캐시 사용
     */
    const val LIVE_STANDINGS_UPDATE_INTERVAL = 15 * 60 * 1000L // 15분
    
    /**
     * 선수 통계 업데이트 주기 (30분)
     * - 경기 후 통계 업데이트 고려
     * - 실시간성이 덜 중요한 데이터
     */
    const val PLAYER_STATS_UPDATE_INTERVAL = 30 * 60 * 1000L // 30분
    
    /**
     * 팀 정보 업데이트 주기 (2시간)
     * - 스쿼드, 부상자 명단 등은 자주 변경되지 않음
     */
    const val TEAM_INFO_UPDATE_INTERVAL = 2 * 60 * 60 * 1000L // 2시간
    
    /**
     * 리그 정보 업데이트 주기 (24시간)
     * - 거의 변경되지 않는 정적 데이터
     */
    const val LEAGUE_INFO_UPDATE_INTERVAL = 24 * 60 * 60 * 1000L // 24시간
    
    /**
     * 경기 시간대별 캐시 정책
     */
    fun getMatchTimeBasedCachePolicy(matchStatus: String): Long {
        return when (matchStatus) {
            "LIVE", "HT", "ET", "P" -> LIVE_MATCH_UPDATE_INTERVAL // 진행 중
            "NS" -> TODAY_FIXTURES_UPDATE_INTERVAL // 시작 전
            "FT", "AET", "PEN" -> PLAYER_STATS_UPDATE_INTERVAL // 종료
            else -> TODAY_FIXTURES_UPDATE_INTERVAL
        }
    }
    
    /**
     * 주말/평일별 캐시 정책
     * 주말에는 더 많은 경기가 있으므로 짧은 캐시 사용
     */
    fun getWeekendAdjustedCache(baseCache: Long, isWeekend: Boolean): Long {
        return if (isWeekend) {
            (baseCache * 0.7).toLong() // 주말에는 30% 짧게
        } else {
            baseCache
        }
    }
}