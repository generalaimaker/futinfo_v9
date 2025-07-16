package com.hyunwoopark.futinfo.presentation.search

import com.hyunwoopark.futinfo.data.remote.dto.TeamSearchResultDto
import com.hyunwoopark.futinfo.data.remote.dto.PlayerSearchResultDto

/**
 * 검색 결과 아이템 (팀, 선수 통합)
 */
sealed class SearchResultItem {
    data class Team(val data: TeamSearchResultDto) : SearchResultItem()
    data class Player(val data: PlayerSearchResultDto) : SearchResultItem()
}

/**
 * 검색 화면의 UI 상태를 나타내는 데이터 클래스
 * 
 * @param searchQuery 현재 검색어
 * @param originalQuery 원본 검색어 (한글 포함)
 * @param searchResults 통합 검색 결과 목록
 * @param teamResults 팀 검색 결과 목록
 * @param playerResults 선수 검색 결과 목록
 * @param isLoading 로딩 상태
 * @param errorMessage 에러 메시지
 * @param isKoreanSearch 한글 검색 여부
 * @param translatedQuery 번역된 검색어
 */
data class SearchState(
    val searchQuery: String = "",
    val originalQuery: String = "",
    val searchResults: List<SearchResultItem> = emptyList(),
    val teamResults: List<TeamSearchResultDto> = emptyList(),
    val playerResults: List<PlayerSearchResultDto> = emptyList(),
    val isLoading: Boolean = false,
    val errorMessage: String? = null,
    val isKoreanSearch: Boolean = false,
    val translatedQuery: String? = null
)