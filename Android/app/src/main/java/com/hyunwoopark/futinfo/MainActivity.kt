package com.hyunwoopark.futinfo

import android.content.Context
import android.content.res.Configuration
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.Text
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Search
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.tooling.preview.Preview
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import com.hyunwoopark.futinfo.domain.use_case.GetLanguageUseCase
import com.hyunwoopark.futinfo.presentation.navigation.BottomNavigationBar
import com.hyunwoopark.futinfo.presentation.navigation.NavGraph
import com.hyunwoopark.futinfo.presentation.navigation.Screen
import com.hyunwoopark.futinfo.presentation.navigation.bottomNavItems
import dagger.hilt.android.AndroidEntryPoint
import io.github.jan.supabase.SupabaseClient
import io.github.jan.supabase.gotrue.auth
import java.util.Locale
import javax.inject.Inject

/**
 * 메인 액티비티
 * Hilt를 사용하여 의존성 주입을 받습니다.
 * 언어 설정을 관찰하고 앱의 로케일을 동적으로 변경합니다.
 */
@AndroidEntryPoint
class MainActivity : ComponentActivity() {
    
    @Inject
    lateinit var getLanguageUseCase: GetLanguageUseCase
    
    @Inject
    lateinit var supabaseClient: SupabaseClient
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        setContent {
            val currentLanguage by getLanguageUseCase().collectAsStateWithLifecycle(initialValue = "ko")
            
            // 언어 설정이 변경될 때마다 로케일 업데이트
            LaunchedEffect(currentLanguage) {
                updateLocale(currentLanguage)
            }
            
            FutInfoTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    FutInfoApp(supabaseClient = supabaseClient)
                }
            }
        }
    }
    
    /**
     * 앱의 로케일을 업데이트합니다
     * @param languageCode 언어 코드 (예: "ko", "en")
     */
    private fun updateLocale(languageCode: String) {
        val locale = Locale(languageCode)
        Locale.setDefault(locale)
        
        val config = Configuration(resources.configuration)
        config.setLocale(locale)
        
        val context = createConfigurationContext(config)
        resources.updateConfiguration(config, resources.displayMetrics)
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun FutInfoApp(supabaseClient: SupabaseClient) {
    val navController = rememberNavController()
    val navBackStackEntry by navController.currentBackStackEntryAsState()
    val currentRoute = navBackStackEntry?.destination?.route
    
    // 인증 상태 확인
    val isAuthenticated = supabaseClient.auth.currentUserOrNull() != null
    
    // 하단 네비게이션 바를 표시할 화면들
    val bottomNavRoutes = bottomNavItems.map { it.route }
    val showBottomBar = currentRoute in bottomNavRoutes
    val showTopBar = currentRoute in bottomNavRoutes && currentRoute != Screen.Search.route && currentRoute != Screen.FixturesOverview.route
    
    // 인증 화면에서는 상단/하단 바 숨기기
    val authRoutes = listOf(Screen.Login.route, Screen.Signup.route, Screen.ProfileSetup.route)
    val hideSystemBars = currentRoute in authRoutes
    
    // 현재 화면의 타이틀 가져오기
    val currentTitle = when (currentRoute) {
        Screen.Community.route -> "커뮤니티"
        Screen.Leagues.route -> "리그"
        Screen.FixturesOverview.route -> "경기 일정"
        Screen.News.route -> "뉴스"
        Screen.Settings.route -> "설정"
        else -> ""
    }
    
    Scaffold(
        topBar = {
            if (showTopBar && !hideSystemBars) {
                TopAppBar(
                    title = { Text(text = currentTitle) },
                    actions = {
                        // iOS와 동일하게 검색 버튼 추가
                        IconButton(
                            onClick = {
                                navController.navigate(Screen.Search.route)
                            }
                        ) {
                            Icon(
                                imageVector = Icons.Default.Search,
                                contentDescription = "검색"
                            )
                        }
                    }
                )
            }
        },
        bottomBar = {
            if (showBottomBar && !hideSystemBars) {
                BottomNavigationBar(
                    navController = navController,
                    items = bottomNavItems
                )
            }
        }
    ) { paddingValues ->
        NavGraph(
            navController = navController,
            startDestination = if (isAuthenticated) Screen.FixturesOverview.route else Screen.Login.route,
            paddingValues = paddingValues,
            supabaseClient = supabaseClient
        )
    }
}

@Composable
fun FutInfoTheme(content: @Composable () -> Unit) {
    MaterialTheme(
        content = content
    )
}

