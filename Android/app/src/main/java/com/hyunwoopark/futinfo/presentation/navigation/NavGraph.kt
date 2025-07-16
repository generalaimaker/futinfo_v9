package com.hyunwoopark.futinfo.presentation.navigation

import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.runtime.Composable
import androidx.navigation.NavHostController
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.navArgument
import com.hyunwoopark.futinfo.presentation.all_leagues.AllLeaguesScreen
import com.hyunwoopark.futinfo.presentation.community.CommunityScreen
import com.hyunwoopark.futinfo.presentation.fixture_detail.FixtureDetailScreen
import com.hyunwoopark.futinfo.presentation.fixture_detail.FixtureDetailScreenV2
import com.hyunwoopark.futinfo.presentation.fixtures.FixturesScreen
import com.hyunwoopark.futinfo.presentation.fixtures_overview.FixturesOverviewScreen
import com.hyunwoopark.futinfo.presentation.fixtures_overview.IOSStyleFixturesOverviewScreen
import com.hyunwoopark.futinfo.presentation.league_detail.LeagueDetailScreen
import com.hyunwoopark.futinfo.presentation.league_detail.LeagueDetailScreenV2
import com.hyunwoopark.futinfo.presentation.leagues.LeaguesScreen
import com.hyunwoopark.futinfo.presentation.news.NewsScreen
import com.hyunwoopark.futinfo.presentation.player_profile.PlayerProfileScreenIOS
import com.hyunwoopark.futinfo.presentation.search.SearchScreen
import com.hyunwoopark.futinfo.presentation.settings.SettingsScreen
import com.hyunwoopark.futinfo.presentation.team_profile.TeamProfileScreenIOS
import com.hyunwoopark.futinfo.presentation.transfers.TransfersScreen

/**
 * 앱의 네비게이션 그래프를 정의하는 컴포저블
 * 
 * @param navController 네비게이션을 제어하는 컨트롤러
 * @param startDestination 시작 화면의 경로
 * @param paddingValues 화면의 패딩 값
 */
@Composable
fun NavGraph(
    navController: NavHostController,
    startDestination: String = Screen.Leagues.route,
    paddingValues: PaddingValues
) {
    NavHost(
        navController = navController,
        startDestination = startDestination
    ) {
        // 커뮤니티 화면
        composable(route = Screen.Community.route) {
            CommunityScreen()
        }
        
        // 리그 목록 화면 (주요 리그만 표시)
        composable(route = Screen.Leagues.route) {
            LeaguesScreen(
                onLeagueClick = { leagueId, leagueName ->
                    navController.navigate(Screen.LeagueDetail.withArgs(leagueId.toString(), leagueName))
                },
                onShowAllLeagues = {
                    navController.navigate(Screen.AllLeagues.route)
                }
            )
        }
        
        // 모든 리그 화면 (iOS 스타일)
        composable(route = Screen.AllLeagues.route) {
            AllLeaguesScreen(
                onBackClick = {
                    navController.popBackStack()
                },
                onLeagueClick = { leagueId, leagueName ->
                    navController.navigate(Screen.LeagueDetail.withArgs(leagueId.toString(), leagueName))
                }
            )
        }
        
        // 리그 상세 화면
        composable(
            route = Screen.LeagueDetail.route + "/{leagueId}/{leagueName}",
            arguments = listOf(
                navArgument("leagueId") {
                    type = NavType.IntType
                },
                navArgument("leagueName") {
                    type = NavType.StringType
                }
            )
        ) { backStackEntry ->
            val leagueId = backStackEntry.arguments?.getInt("leagueId") ?: 0
            val leagueName = backStackEntry.arguments?.getString("leagueName") ?: ""
            LeagueDetailScreenV2(
                leagueId = leagueId,
                leagueName = leagueName,
                onBackClick = {
                    navController.popBackStack()
                },
                onTeamClick = { teamId ->
                    navController.navigate(Screen.TeamProfile.withArgs(teamId.toString()))
                },
                onFixtureClick = { fixtureId ->
                    navController.navigate(Screen.FixtureDetail.withArgs(fixtureId.toString()))
                },
                onPlayerClick = { playerId ->
                    navController.navigate(Screen.PlayerProfile.withArgs(playerId.toString()))
                }
            )
        }
        
        // 이적 시장 화면
        composable(route = Screen.Transfers.route) {
            TransfersScreen()
        }
        
        // 뉴스 화면
        composable(route = Screen.News.route) {
            NewsScreen()
        }
        
        // 설정 화면
        composable(route = Screen.Settings.route) {
            SettingsScreen(navController = navController)
        }
        
        // 경기 목록 화면 (리그 ID 파라미터 포함)
        composable(
            route = Screen.Fixtures.route + "/{leagueId}",
            arguments = listOf(
                navArgument("leagueId") {
                    type = NavType.IntType
                }
            )
        ) { backStackEntry ->
            val leagueId = backStackEntry.arguments?.getInt("leagueId") ?: 0
            FixturesScreen(
                leagueId = leagueId,
                onFixtureClick = { fixtureId ->
                    navController.navigate(Screen.FixtureDetail.withArgs(fixtureId.toString()))
                },
                onTeamClick = { teamId ->
                    navController.navigate(Screen.TeamProfile.withArgs(teamId.toString()))
                },
                onBackClick = {
                    navController.popBackStack()
                }
            )
        }
        
        // 경기 개요 화면 (iOS FixturesOverviewView와 동일한 기능)
        composable(route = Screen.FixturesOverview.route) {
            IOSStyleFixturesOverviewScreen(
                onFixtureClick = { fixtureId ->
                    navController.navigate(Screen.FixtureDetail.withArgs(fixtureId.toString()))
                },
                onTeamClick = { teamId ->
                    navController.navigate(Screen.TeamProfile.withArgs(teamId.toString()))
                }
            )
        }
        
        // 팀 프로필 화면 (팀 ID 파라미터 포함)
        composable(
            route = Screen.TeamProfile.route + "/{teamId}",
            arguments = listOf(
                navArgument("teamId") {
                    type = NavType.IntType
                }
            )
        ) { backStackEntry ->
            val teamId = backStackEntry.arguments?.getInt("teamId") ?: 0
            TeamProfileScreenIOS(
                onBackClick = {
                    navController.popBackStack()
                },
                onPlayerClick = { playerId ->
                    navController.navigate(Screen.PlayerProfile.withArgs(playerId.toString()))
                },
                onFixtureClick = { fixtureId ->
                    navController.navigate(Screen.FixtureDetail.withArgs(fixtureId.toString()))
                }
            )
        }
        
        // 경기 상세 화면 (경기 ID 파라미터 포함)
        composable(
            route = Screen.FixtureDetail.route + "/{fixtureId}",
            arguments = listOf(
                navArgument("fixtureId") {
                    type = NavType.IntType
                }
            )
        ) { backStackEntry ->
            val fixtureId = backStackEntry.arguments?.getInt("fixtureId") ?: 0
            FixtureDetailScreenV2(
                fixtureId = fixtureId,
                onBackClick = {
                    navController.popBackStack()
                },
                onTeamClick = { teamId ->
                    navController.navigate(Screen.TeamProfile.withArgs(teamId.toString()))
                }
            )
        }
        
        // 선수 프로필 화면 (선수 ID 파라미터 포함)
        composable(
            route = Screen.PlayerProfile.route + "/{playerId}",
            arguments = listOf(
                navArgument("playerId") {
                    type = NavType.IntType
                }
            )
        ) { backStackEntry ->
            val playerId = backStackEntry.arguments?.getInt("playerId") ?: 0
            PlayerProfileScreenIOS(
                onNavigateBack = {
                    navController.popBackStack()
                },
                onTeamClick = { teamId ->
                    navController.navigate(Screen.TeamProfile.withArgs(teamId.toString()))
                }
            )
        }
        
        // 검색 화면
        composable(route = Screen.Search.route) {
            SearchScreen(
                onTeamClick = { teamId ->
                    navController.navigate(Screen.TeamProfile.withArgs(teamId.toString()))
                },
                onPlayerClick = { playerId ->
                    navController.navigate(Screen.PlayerProfile.withArgs(playerId.toString()))
                }
            )
        }
        
        // 팔로잉 팀 화면
        composable(route = Screen.FollowingTeams.route) {
            com.hyunwoopark.futinfo.presentation.following.FollowingTeamsScreen(
                navController = navController
            )
        }
        
        // 팔로잉 선수 화면
        composable(route = Screen.FollowingPlayers.route) {
            com.hyunwoopark.futinfo.presentation.following.FollowingPlayersScreen(
                navController = navController
            )
        }
        
        // 언어 설정 화면
        composable(route = Screen.LanguageSettings.route) {
            com.hyunwoopark.futinfo.presentation.settings.LanguageSettingsScreen(
                navController = navController
            )
        }
    }
}