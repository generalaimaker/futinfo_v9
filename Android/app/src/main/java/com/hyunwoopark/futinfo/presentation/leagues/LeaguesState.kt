package com.hyunwoopark.futinfo.presentation.leagues

import com.hyunwoopark.futinfo.data.remote.dto.LeagueDetailsDto

/**
 * 리그 목록 화면의 UI 상태를 나타내는 데이터 클래스
 *
 * @param featuredLeagues 주요 리그 목록 (기본 8개 + 사용자 추가)
 * @param allLeagues 전체 리그 목록
 * @param userLeagueIds 사용자가 추가한 리그 ID 목록
 * @param isLoading 로딩 상태
 * @param errorMessage 에러 메시지
 * @param showFeaturedOnly 주요 리그만 표시할지 여부
 * @param showLeagueSelectionDialog 리그 선택 다이얼로그 표시 여부
 */
data class LeaguesState(
    val featuredLeagues: List<LeagueDetailsDto> = emptyList(),
    val allLeagues: List<LeagueDetailsDto> = emptyList(),
    val userLeagueIds: List<Int> = emptyList(),
    val isLoading: Boolean = false,
    val errorMessage: String? = null,
    val showFeaturedOnly: Boolean = true,
    val showLeagueSelectionDialog: Boolean = false
) {
    // 하위 호환성을 위한 leagues 프로퍼티
    val leagues: List<LeagueDetailsDto>
        get() = if (showFeaturedOnly) featuredLeagues else allLeagues
    
    // 사용자가 추가한 리그 개수
    val userLeagueCount: Int
        get() = userLeagueIds.size
}