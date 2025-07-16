package com.hyunwoopark.futinfo.presentation.favorites

import com.hyunwoopark.futinfo.data.local.entity.FavoriteEntity

/**
 * 즐겨찾기 화면의 UI 상태를 나타내는 데이터 클래스
 */
data class FavoritesState(
    val isLoading: Boolean = false,
    val favorites: List<FavoriteEntity> = emptyList(),
    val favoriteLeagues: List<FavoriteEntity> = emptyList(),
    val favoriteTeams: List<FavoriteEntity> = emptyList(),
    val favoritePlayers: List<FavoriteEntity> = emptyList(),
    val selectedTab: FavoriteTab = FavoriteTab.ALL,
    val error: String? = null
)

/**
 * 즐겨찾기 탭 종류
 */
enum class FavoriteTab {
    ALL,        // 전체
    LEAGUES,    // 리그
    TEAMS,      // 팀
    PLAYERS     // 선수
}