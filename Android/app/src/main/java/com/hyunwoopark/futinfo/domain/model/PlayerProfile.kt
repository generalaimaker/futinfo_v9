package com.hyunwoopark.futinfo.domain.model

/**
 * 선수 프로필 도메인 모델
 */
data class PlayerProfile(
    val player: PlayerInfo,
    val statistics: List<PlayerSeasonStats>
)

data class PlayerInfo(
    val id: Int,
    val name: String,
    val firstname: String?,
    val lastname: String?,
    val age: Int?,
    val nationality: String?,
    val height: String?,
    val weight: String?,
    val photo: String?,
    val injured: Boolean,
    val birth: PlayerBirth?
)

data class PlayerBirth(
    val date: String?,
    val place: String?,
    val country: String?
)

data class PlayerSeasonStats(
    val team: Team?,
    val league: PlayerLeagueInfo?,
    val games: PlayerGameStats?,
    val substitutes: PlayerSubstitutes?,
    val shots: PlayerShots?,
    val goals: PlayerGoals?,
    val passes: PlayerPasses?,
    val tackles: PlayerTackles?,
    val duels: PlayerDuels?,
    val dribbles: PlayerDribbles?,
    val fouls: PlayerFouls?,
    val cards: PlayerCards?,
    val penalty: PlayerPenalty?
)

data class PlayerLeagueInfo(
    val id: Int,
    val name: String,
    val country: String?,
    val logo: String?,
    val season: Int,
    val flag: String?
)

data class PlayerGameStats(
    val minutes: Int,
    val number: Int?,
    val position: String?,
    val rating: String?,
    val captain: Boolean,
    val substitute: Boolean,
    val appearances: Int,
    val lineups: Int
)

data class PlayerSubstitutes(
    val `in`: Int,
    val out: Int,
    val bench: Int
)

data class PlayerShots(
    val total: Int,
    val on: Int
)

data class PlayerGoals(
    val total: Int,
    val conceded: Int,
    val assists: Int,
    val saves: Int
)

data class PlayerPasses(
    val total: Int,
    val key: Int,
    val accuracy: String
)

data class PlayerTackles(
    val total: Int,
    val blocks: Int,
    val interceptions: Int
)

data class PlayerDuels(
    val total: Int,
    val won: Int
)

data class PlayerDribbles(
    val attempts: Int,
    val success: Int,
    val past: Int
)

data class PlayerFouls(
    val drawn: Int,
    val committed: Int
)

data class PlayerCards(
    val yellow: Int,
    val yellowred: Int,
    val red: Int
)

data class PlayerPenalty(
    val won: Int,
    val committed: Int,
    val scored: Int,
    val missed: Int,
    val saved: Int
)

/**
 * 선수 프로필 포맷된 통계 (UI 표시용)
 */
data class PlayerFormattedStats(
    val goals: String,
    val assists: String,
    val appearances: String,
    val rating: String,
    val shotsTotal: String,
    val shotsOnTarget: String,
    val passAccuracy: String,
    val tacklesTotal: String,
    val interceptions: String,
    val yellowCards: String,
    val redCards: String,
    val minutesPlayed: String
)