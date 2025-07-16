package com.hyunwoopark.futinfo.domain.model

import com.hyunwoopark.futinfo.data.remote.dto.TeamProfileDto
import com.hyunwoopark.futinfo.data.remote.dto.TeamSeasonStatisticsDto
import com.hyunwoopark.futinfo.data.remote.dto.TeamSquadResponseDto

/**
 * 팀 프로필 상세 정보를 담는 도메인 모델
 * UI에서 사용하기 위해 여러 API 응답을 조합한 데이터 클래스
 */
data class TeamProfileDetails(
    /**
     * 팀 기본 정보 (팀 정보 + 경기장 정보)
     */
    val teamProfile: TeamProfileDto,
    
    /**
     * 팀 시즌 통계 정보
     * 특정 리그와 시즌에서의 팀 성과 데이터
     */
    val statistics: TeamSeasonStatisticsDto?,
    
    /**
     * 팀 선수단 정보
     * 현재 시즌 선수 명단
     */
    val squad: TeamSquadResponseDto?
) {
    /**
     * 팀 ID
     */
    val teamId: Int
        get() = teamProfile.team.id
    
    /**
     * 팀 이름
     */
    val teamName: String
        get() = teamProfile.team.name
    
    /**
     * 팀 로고 URL
     */
    val teamLogo: String
        get() = teamProfile.team.logo
    
    /**
     * 팀 국가
     */
    val teamCountry: String?
        get() = teamProfile.team.country
    
    /**
     * 팀 설립 연도
     */
    val foundedYear: Int?
        get() = teamProfile.team.founded
    
    /**
     * 경기장 이름
     */
    val venueName: String?
        get() = teamProfile.venue.name
    
    /**
     * 경기장 수용 인원
     */
    val venueCapacity: Int?
        get() = teamProfile.venue.capacity
    
    /**
     * 경기장 도시
     */
    val venueCity: String?
        get() = teamProfile.venue.city
    
    /**
     * 팀 폼 (최근 경기 결과)
     */
    val teamForm: String?
        get() = statistics?.form
    
    /**
     * 총 경기 수
     */
    val totalGamesPlayed: Int?
        get() = statistics?.fixtures?.played?.total
    
    /**
     * 승리 수
     */
    val totalWins: Int?
        get() = statistics?.fixtures?.wins?.total
    
    /**
     * 무승부 수
     */
    val totalDraws: Int?
        get() = statistics?.fixtures?.draws?.total
    
    /**
     * 패배 수
     */
    val totalLoses: Int?
        get() = statistics?.fixtures?.loses?.total
    
    /**
     * 총 득점
     */
    val totalGoalsFor: Int?
        get() = statistics?.goals?.goalsFor?.total?.total
    
    /**
     * 총 실점
     */
    val totalGoalsAgainst: Int?
        get() = statistics?.goals?.against?.total?.total
    
    /**
     * 득실차
     */
    val goalDifference: Int?
        get() {
            val goalsFor = totalGoalsFor
            val goalsAgainst = totalGoalsAgainst
            return if (goalsFor != null && goalsAgainst != null) {
                goalsFor - goalsAgainst
            } else null
        }
    
    /**
     * 선수 수
     */
    val squadSize: Int?
        get() = squad?.players?.size
    
    /**
     * 통계 데이터가 있는지 확인
     */
    val hasStatistics: Boolean
        get() = statistics != null
    
    /**
     * 선수단 데이터가 있는지 확인
     */
    val hasSquad: Boolean
        get() = squad != null && squad.players.isNotEmpty()
        
    /**
     * 홈 경기 승리
     */
    val homeWins: Int?
        get() = statistics?.fixtures?.wins?.home
        
    /**
     * 홈 경기 무승부
     */
    val homeDraws: Int?
        get() = statistics?.fixtures?.draws?.home
        
    /**
     * 홈 경기 패배
     */
    val homeLoses: Int?
        get() = statistics?.fixtures?.loses?.home
        
    /**
     * 원정 경기 승리
     */
    val awayWins: Int?
        get() = statistics?.fixtures?.wins?.away
        
    /**
     * 원정 경기 무승부
     */
    val awayDraws: Int?
        get() = statistics?.fixtures?.draws?.away
        
    /**
     * 원정 경기 패배
     */
    val awayLoses: Int?
        get() = statistics?.fixtures?.loses?.away
        
    /**
     * 페널티 득점
     */
    val penaltyScored: Int?
        get() = statistics?.penalty?.scored?.total
        
    /**
     * 페널티 실점
     */
    val penaltyConceded: Int?
        get() = statistics?.penalty?.missed?.total
        
    /**
     * 경기장 이미지
     */
    val venueImage: String?
        get() = teamProfile.venue.image
        
    /**
     * 경기장 표면
     */
    val venueSurface: String?
        get() = teamProfile.venue.surface
        
    /**
     * 경기장 주소
     */
    val venueAddress: String?
        get() = teamProfile.venue.address
        
    /**
     * 현재 리그 ID
     */
    val leagueId: Int?
        get() = statistics?.league?.id
        
    /**
     * 현재 리그 로고
     */
    val leagueLogo: String?
        get() = statistics?.league?.logo
        
    /**
     * 현재 시즌
     */
    val currentSeason: Int?
        get() = statistics?.league?.season
        
    /**
     * 경기장 정보가 있는지 확인
     */
    val hasVenueInfo: Boolean
        get() = venueName != null || venueCity != null || venueCapacity != null
}