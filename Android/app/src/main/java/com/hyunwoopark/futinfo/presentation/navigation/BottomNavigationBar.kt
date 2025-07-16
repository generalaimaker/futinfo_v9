package com.hyunwoopark.futinfo.presentation.navigation

import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CalendarToday
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.Search
import androidx.compose.material.icons.filled.Sports
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material.icons.filled.Article
import androidx.compose.material.icons.filled.Group
import androidx.compose.material.icons.filled.SwapHoriz
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.navigation.NavController
import androidx.navigation.compose.currentBackStackEntryAsState

/**
 * 하단 네비게이션 바 아이템 데이터 클래스
 */
data class BottomNavItem(
    val route: String,
    val icon: ImageVector,
    val label: String
)

/**
 * 하단 네비게이션 바 컴포저블
 */
@Composable
fun BottomNavigationBar(
    navController: NavController,
    items: List<BottomNavItem>
) {
    val navBackStackEntry by navController.currentBackStackEntryAsState()
    val currentRoute = navBackStackEntry?.destination?.route
    
    NavigationBar {
        items.forEach { item ->
            NavigationBarItem(
                icon = {
                    Icon(
                        imageVector = item.icon,
                        contentDescription = item.label
                    )
                },
                label = {
                    Text(text = item.label)
                },
                selected = currentRoute == item.route,
                onClick = {
                    if (currentRoute != item.route) {
                        navController.navigate(item.route) {
                            // 백스택을 정리하여 메모리 효율성 향상
                            popUpTo(navController.graph.startDestinationId) {
                                saveState = true
                            }
                            launchSingleTop = true
                            restoreState = true
                        }
                    }
                }
            )
        }
    }
}

/**
 * 하단 네비게이션 아이템들 정의 (iOS 순서에 맞춤)
 * iOS 앱과 동일한 5개 탭 구조
 */
val bottomNavItems = listOf(
    BottomNavItem(
        route = Screen.Community.route,
        icon = Icons.Default.Group,
        label = "커뮤"
    ),
    BottomNavItem(
        route = Screen.Leagues.route,
        icon = Icons.Default.Sports,
        label = "리그"
    ),
    BottomNavItem(
        route = Screen.FixturesOverview.route,
        icon = Icons.Default.CalendarToday,
        label = "일정"
    ),
    BottomNavItem(
        route = Screen.News.route,
        icon = Icons.Default.Article,
        label = "뉴스"
    ),
    BottomNavItem(
        route = Screen.Settings.route,
        icon = Icons.Default.Settings,
        label = "설정"
    )
)