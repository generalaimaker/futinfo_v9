package com.hyunwoopark.futinfo.domain.model

import com.hyunwoopark.futinfo.data.remote.dto.FixtureDto
import com.hyunwoopark.futinfo.data.remote.dto.FixtureEventDto
import com.hyunwoopark.futinfo.data.remote.dto.TeamLineupDto
import com.hyunwoopark.futinfo.data.remote.dto.TeamStatisticsDto

/**
 * 경기 상세 정보를 모두 포함하는 UI 친화적인 도메인 모델
 *
 * 경기 기본 정보, 라인업, 양 팀의 통계, 경기 이벤트를 모두 포함하여
 * UI에서 경기 상세 정보를 표시하는데 필요한 모든 데이터를 제공합니다.
 */
data class FixtureDetailBundle(
    /**
     * 경기 기본 정보
     */
    val fixture: FixtureDto? = null,
    
    /**
     * 경기 라인업 정보 (양 팀)
     * 첫 번째 요소는 홈팀, 두 번째 요소는 어웨이팀 라인업
     */
    val lineups: List<TeamLineupDto>,
    
    /**
     * 경기 통계 정보 (양 팀)
     * 첫 번째 요소는 홈팀, 두 번째 요소는 어웨이팀 통계
     */
    val statistics: List<TeamStatisticsDto>,
    
    /**
     * 경기 이벤트 목록
     * 시간순으로 정렬된 모든 경기 이벤트 (골, 카드, 교체 등)
     */
    val events: List<FixtureEventDto>
) {
    
    /**
     * 홈팀 라인업 정보
     */
    val homeLineup: TeamLineupDto?
        get() = lineups.firstOrNull()
    
    /**
     * 어웨이팀 라인업 정보
     */
    val awayLineup: TeamLineupDto?
        get() = lineups.getOrNull(1)
    
    /**
     * 홈팀 통계 정보
     */
    val homeStatistics: TeamStatisticsDto?
        get() = statistics.firstOrNull()
    
    /**
     * 어웨이팀 통계 정보
     */
    val awayStatistics: TeamStatisticsDto?
        get() = statistics.getOrNull(1)
    
    /**
     * 골 이벤트만 필터링
     */
    val goalEvents: List<FixtureEventDto>
        get() = events.filter { it.isActualGoal }
    
    /**
     * 카드 이벤트만 필터링
     */
    val cardEvents: List<FixtureEventDto>
        get() = events.filter { it.type.lowercase() == "card" }
    
    /**
     * 교체 이벤트만 필터링
     */
    val substitutionEvents: List<FixtureEventDto>
        get() = events.filter { it.type.lowercase() == "subst" }
    
    /**
     * VAR 이벤트만 필터링
     */
    val varEvents: List<FixtureEventDto>
        get() = events.filter { it.type.lowercase() == "var" }
    
    /**
     * 시간순으로 정렬된 이벤트 목록
     */
    val sortedEvents: List<FixtureEventDto>
        get() = events.sortedBy { it.time.elapsed }
    
    /**
     * 라인업 정보가 있는지 확인
     */
    val hasLineups: Boolean
        get() = lineups.isNotEmpty()
    
    /**
     * 통계 정보가 있는지 확인
     */
    val hasStatistics: Boolean
        get() = statistics.isNotEmpty()
    
    /**
     * 이벤트 정보가 있는지 확인
     */
    val hasEvents: Boolean
        get() = events.isNotEmpty()
    
    /**
     * 모든 데이터가 완전한지 확인
     */
    val isComplete: Boolean
        get() = hasLineups && hasStatistics && hasEvents
    
    /**
     * 특정 팀의 통계 정보 가져오기
     * 
     * @param teamId 팀 ID
     * @return 해당 팀의 통계 정보, 없으면 null
     */
    fun getStatisticsForTeam(teamId: Int): TeamStatisticsDto? {
        return statistics.find { it.team.id == teamId }
    }
    
    /**
     * 특정 팀의 라인업 정보 가져오기
     * 
     * @param teamId 팀 ID
     * @return 해당 팀의 라인업 정보, 없으면 null
     */
    fun getLineupForTeam(teamId: Int): TeamLineupDto? {
        return lineups.find { it.team.id == teamId }
    }
    
    /**
     * 특정 팀의 이벤트만 필터링
     * 
     * @param teamId 팀 ID
     * @return 해당 팀의 이벤트 목록
     */
    fun getEventsForTeam(teamId: Int): List<FixtureEventDto> {
        return events.filter { it.team.id == teamId }
    }
}