package com.hyunwoopark.futinfo.data.remote.dto

import kotlinx.serialization.Serializable

/**
 * 팀 검색 결과를 나타내는 DTO
 * API 응답의 중첩된 구조를 반영
 */
@Serializable
data class TeamSearchResultDto(
    val team: SearchTeamDto,
    val venue: VenueDto? = null
)

/**
 * 팀 정보 DTO (검색 결과용)
 */
@Serializable  
data class SearchTeamDto(
    val id: Int,
    val name: String,
    val code: String? = null,
    val country: String? = null,
    val founded: Int? = null,
    val national: Boolean? = null,
    val logo: String
)

/**
 * 팀 검색 API 응답 DTO
 */
@Serializable
data class TeamSearchResponseDto(
    val get: String,
    val parameters: Map<String, String>,
    val errors: List<String>,
    val results: Int,
    val paging: PagingDto,
    val response: List<TeamSearchResultDto>
)

/**
 * 통합 검색 결과 DTO (향후 확장을 위해)
 * 팀, 리그, 선수 등 다양한 검색 결과를 포함할 수 있음
 */
@Serializable
data class SearchResultItemDto(
    val type: String, // "team", "league", "player", "coach"
    val id: String,
    val name: String,
    val logoUrl: String? = null,
    val detail: String? = null // 추가 정보 (예: 리그의 국가, 선수의 현재 팀)
)

/**
 * 통합 검색 응답 DTO
 */
@Serializable
data class UnifiedSearchResponseDto(
    val teams: List<TeamSearchResultDto> = emptyList(),
    val leagues: List<LeagueDto> = emptyList(),
    // 향후 선수, 감독 검색 결과도 추가 가능
    val totalResults: Int
)