package com.hyunwoopark.futinfo.presentation.team_profile

import com.hyunwoopark.futinfo.domain.model.TeamProfileDetails
import com.hyunwoopark.futinfo.data.remote.dto.StandingDto
import com.hyunwoopark.futinfo.data.remote.dto.FixtureDto

/**
 * 팀 프로필 화면의 UI 상태를 나타내는 데이터 클래스
 *
 * @param teamProfile 팀 프로필 상세 정보
 * @param isLoading 로딩 상태
 * @param errorMessage 에러 메시지
 * @param isFavorite 즐겨찾기 여부
 * @param isFavoriteLoading 즐겨찾기 상태 로딩 여부
 * @param standings 현재 시즌 순위표
 * @param recentFixtures 최근 경기 결과
 * @param upcomingFixtures 예정된 경기
 * @param isStandingsLoading 순위표 로딩 상태
 * @param isFixturesLoading 경기 일정 로딩 상태
 */
data class TeamProfileState(
    val teamProfile: TeamProfileDetails? = null,
    val isLoading: Boolean = false,
    val errorMessage: String? = null,
    val isFavorite: Boolean = false,
    val isFavoriteLoading: Boolean = false,
    val standings: List<StandingDto>? = null,
    val recentFixtures: List<FixtureDto>? = null,
    val upcomingFixtures: List<FixtureDto>? = null,
    val isStandingsLoading: Boolean = false,
    val isFixturesLoading: Boolean = false
)