package com.hyunwoopark.futinfo.domain.model

/**
 * 리그 순위표 도메인 모델
 */
data class LeagueStanding(
    val league: StandingLeagueInfo,
    val standings: List<List<Standing>>?
)

/**
 * 순위표 리그 정보 도메인 모델
 */
data class StandingLeagueInfo(
    val id: Int,
    val name: String,
    val country: String,
    val logo: String,
    val flag: String?,
    val season: Int
)

/**
 * 팀 순위 도메인 모델
 */
data class Standing(
    val rank: Int,
    val team: StandingTeam,
    val points: Int,
    val goalsDiff: Int,
    val group: String?,
    val form: String?,
    val status: String?,
    val description: String?,
    val all: StandingStats,
    val home: StandingStats,
    val away: StandingStats,
    val update: String
) {
    /**
     * 승률 계산
     */
    val winRate: Double
        get() = if (all.played > 0) all.win.toDouble() / all.played else 0.0
    
    /**
     * 최근 폼 상태 (W: 승, D: 무, L: 패)
     */
    val recentForm: List<String>
        get() = form?.toCharArray()?.map { it.toString() } ?: emptyList()
    
    /**
     * 홈/원정 경기력 비교
     */
    val homeAdvantage: Double
        get() {
            val homeWinRate = if (home.played > 0) home.win.toDouble() / home.played else 0.0
            val awayWinRate = if (away.played > 0) away.win.toDouble() / away.played else 0.0
            return homeWinRate - awayWinRate
        }
}

/**
 * 순위표 팀 정보 도메인 모델
 */
data class StandingTeam(
    val id: Int,
    val name: String,
    val logo: String
)

/**
 * 순위표 통계 도메인 모델
 */
data class StandingStats(
    val played: Int,
    val win: Int,
    val draw: Int,
    val lose: Int,
    val goals: StandingGoals
) {
    /**
     * 승점 계산 (승: 3점, 무: 1점, 패: 0점)
     */
    val points: Int
        get() = win * 3 + draw
    
    /**
     * 득실차 계산
     */
    val goalDifference: Int
        get() = goals.`for` - goals.against
    
    /**
     * 승률 계산
     */
    val winPercentage: Double
        get() = if (played > 0) win.toDouble() / played * 100 else 0.0
}

/**
 * 순위표 득점/실점 도메인 모델
 */
data class StandingGoals(
    val `for`: Int,
    val against: Int
) {
    /**
     * 경기당 평균 득점
     */
    fun averageGoalsFor(played: Int): Double = if (played > 0) `for`.toDouble() / played else 0.0
    
    /**
     * 경기당 평균 실점
     */
    fun averageGoalsAgainst(played: Int): Double = if (played > 0) against.toDouble() / played else 0.0
}