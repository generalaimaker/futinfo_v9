package com.hyunwoopark.futinfo.domain.model

/**
 * 토너먼트 대진표 도메인 모델
 */
data class Bracket(
    val rounds: List<BracketRound>
)

/**
 * 대진표 라운드 도메인 모델
 */
data class BracketRound(
    val round: String,
    val fixtures: List<BracketFixture>
)

/**
 * 대진표 경기 도메인 모델
 */
data class BracketFixture(
    val id: Int,
    val date: String,
    val timestamp: Long,
    val status: BracketFixtureStatus,
    val venue: BracketVenue?,
    val homeTeam: BracketTeam,
    val awayTeam: BracketTeam,
    val homeScore: Int?,
    val awayScore: Int?
) {
    /**
     * 경기가 완료되었는지 확인
     */
    val isFinished: Boolean
        get() = status.short in listOf("FT", "AET", "PEN")
    
    /**
     * 경기가 진행 중인지 확인
     */
    val isLive: Boolean
        get() = status.short in listOf("1H", "HT", "2H", "ET", "BT", "P")
    
    /**
     * 승자 결정
     */
    fun getWinner(): BracketTeam? {
        return when {
            !isFinished -> null
            homeScore == null || awayScore == null -> null
            homeScore > awayScore -> homeTeam
            awayScore > homeScore -> awayTeam
            else -> null // 무승부
        }
    }
}

/**
 * 대진표 팀 도메인 모델
 */
data class BracketTeam(
    val id: Int,
    val name: String,
    val logo: String
)

/**
 * 대진표 경기 상태 도메인 모델
 */
data class BracketFixtureStatus(
    val long: String,
    val short: String,
    val elapsed: Int?
)

/**
 * 대진표 경기장 도메인 모델
 */
data class BracketVenue(
    val id: Int?,
    val name: String?,
    val city: String?
)