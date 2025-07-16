package com.hyunwoopark.futinfo.presentation.navigation

/**
 * 앱의 모든 화면 경로를 정의하는 sealed class
 */
sealed class Screen(val route: String) {
    object Community : Screen("community")
    object Leagues : Screen("leagues")
    object FixturesOverview : Screen("fixtures_overview")
    object News : Screen("news")
    object Settings : Screen("settings")
    object Fixtures : Screen("fixtures")
    object TeamProfile : Screen("team_profile")
    object FixtureDetail : Screen("fixture_detail")
    object Search : Screen("search")
    object LeagueDetail : Screen("league_detail")
    object AllLeagues : Screen("all_leagues")
    object PlayerProfile : Screen("player_profile")
    object Transfers : Screen("transfers")
    object FollowingTeams : Screen("following_teams")
    object FollowingPlayers : Screen("following_players")
    object LanguageSettings : Screen("language_settings")
    
    // 파라미터가 있는 경로들
    fun withArgs(vararg args: String): String {
        return buildString {
            append(route)
            args.forEach { arg ->
                append("/$arg")
            }
        }
    }
}