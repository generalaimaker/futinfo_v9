package com.hyunwoopark.futinfo.presentation.fixtures_overview

import androidx.compose.animation.*
import androidx.compose.animation.core.*
import androidx.compose.foundation.ExperimentalFoundationApi
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.pager.HorizontalPager
import androidx.compose.foundation.pager.rememberPagerState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.clickable
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.graphics.Brush
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.hyunwoopark.futinfo.data.remote.dto.FixtureDto
import com.hyunwoopark.futinfo.presentation.fixtures_overview.components.*
import com.hyunwoopark.futinfo.presentation.theme.FutInfoDesignSystem
import kotlinx.coroutines.launch
import kotlinx.coroutines.delay
import java.text.SimpleDateFormat
import java.util.*

/**
 * iOS 스타일로 완전히 개선된 경기 일정 화면
 * iOS의 FixturesOverviewView와 동일한 UI/UX 제공
 */
@OptIn(ExperimentalMaterial3Api::class, ExperimentalFoundationApi::class)
@Composable
fun IOSStyleFixturesOverviewScreen(
    viewModel: FixturesOverviewViewModel = hiltViewModel(),
    onFixtureClick: (Int) -> Unit = {},
    onTeamClick: (Int) -> Unit = {}
) {
    val state by viewModel.state.collectAsStateWithLifecycle()
    val pagerState = rememberPagerState(
        initialPage = state.selectedDateIndex,
        pageCount = { state.availableDates.size }
    )
    val coroutineScope = rememberCoroutineScope()
    
    // 페이지 변경 시 날짜 선택 동기화
    LaunchedEffect(pagerState.currentPage) {
        if (pagerState.currentPage < state.availableDates.size) {
            val selectedDate = state.availableDates[pagerState.currentPage]
            viewModel.selectDate(selectedDate, pagerState.currentPage)
            
            // 주변 날짜 미리 로드 (iOS처럼)
            if (pagerState.currentPage + 1 < state.availableDates.size) {
                viewModel.loadFixturesForSpecificDate(state.availableDates[pagerState.currentPage + 1])
            }
            if (pagerState.currentPage - 1 >= 0) {
                viewModel.loadFixturesForSpecificDate(state.availableDates[pagerState.currentPage - 1])
            }
        }
    }
    
    // 선택된 날짜 인덱스 변경 시 페이저 동기화
    LaunchedEffect(state.selectedDateIndex) {
        if (state.selectedDateIndex != pagerState.currentPage && 
            state.selectedDateIndex < state.availableDates.size) {
            pagerState.animateScrollToPage(state.selectedDateIndex)
        }
    }
    
    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(FutInfoDesignSystem.Colors.SystemBackground)
    ) {
            // 상단 날짜 탭 (iOS의 FixturesDateTabsView)
            if (state.availableDates.isNotEmpty()) {
                Surface(
                    modifier = Modifier.fillMaxWidth(),
                    color = FutInfoDesignSystem.Colors.SystemBackground,
                    shadowElevation = 1.dp
                ) {
                    LazyRow(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(vertical = 8.dp),
                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                        contentPadding = PaddingValues(horizontal = 16.dp),
                        state = rememberLazyListState(initialFirstVisibleItemIndex = state.selectedDateIndex)
                    ) {
                        itemsIndexed(state.availableDates) { index, date ->
                            IOSStyleDateTab(
                                date = date,
                                isSelected = index == state.selectedDateIndex,
                                isLoading = state.loadingDates.contains(date),
                                onClick = {
                                    viewModel.selectDate(date, index)
                                    coroutineScope.launch {
                                        pagerState.animateScrollToPage(index)
                                    }
                                }
                            )
                        }
                    }
                }
            }
            
            // 경기 목록 페이저 (iOS의 FixturesPageTabView)
            if (state.availableDates.isNotEmpty()) {
                HorizontalPager(
                    state = pagerState,
                    modifier = Modifier.fillMaxSize(),
                    // 양옆 페이지 미리 로드
                ) { page ->
                    val pageDate = state.availableDates.getOrNull(page) ?: ""
                    
                    IOSStyleFixturesPage(
                        date = pageDate,
                        viewModel = viewModel,
                        isCurrentPage = page == state.selectedDateIndex,
                        onFixtureClick = onFixtureClick,
                        onTeamClick = onTeamClick
                    )
                }
            } else {
                // 초기 로딩 상태
                IOSStyleLoadingView()
            }
    }
}

/**
 * iOS 스타일 날짜 탭
 */
@Composable
private fun IOSStyleDateTab(
    date: String,
    isSelected: Boolean,
    isLoading: Boolean,
    onClick: () -> Unit
) {
    val dateFormat = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault())
    val today = dateFormat.format(Date())
    val yesterday = dateFormat.format(Date(System.currentTimeMillis() - 24 * 60 * 60 * 1000))
    val tomorrow = dateFormat.format(Date(System.currentTimeMillis() + 24 * 60 * 60 * 1000))
    
    val label = when (date) {
        today -> "오늘"
        yesterday -> "어제"
        tomorrow -> "내일"
        else -> {
            try {
                val parsed = dateFormat.parse(date)
                val displayFormat = SimpleDateFormat("M/d", Locale.getDefault())
                parsed?.let { displayFormat.format(it) } ?: date
            } catch (e: Exception) {
                date
            }
        }
    }
    
    Column(
        modifier = Modifier
            .clip(RoundedCornerShape(8.dp))
            .background(
                if (isSelected) FutInfoDesignSystem.Colors.RoyalBlue else Color.Transparent
            )
            .clickable { onClick() }
            .padding(horizontal = 16.dp, vertical = 8.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Text(
            text = label,
            style = MaterialTheme.typography.bodyMedium.copy(
                fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Medium,
                color = if (isSelected) Color.White else FutInfoDesignSystem.Colors.Label
            )
        )
        
        if (isSelected) {
            Spacer(modifier = Modifier.height(4.dp))
            Box(
                modifier = Modifier
                    .width(20.dp)
                    .height(3.dp)
                    .background(Color.White, RoundedCornerShape(1.5.dp))
            )
        }
        
        if (isLoading) {
            Spacer(modifier = Modifier.height(4.dp))
            CircularProgressIndicator(
                modifier = Modifier.size(12.dp),
                strokeWidth = 1.5.dp,
                color = if (isSelected) Color.White else FutInfoDesignSystem.Colors.RoyalBlue
            )
        }
    }
}

/**
 * iOS 스타일 경기 페이지
 */
@Composable
private fun IOSStyleFixturesPage(
    date: String,
    viewModel: FixturesOverviewViewModel,
    isCurrentPage: Boolean,
    onFixtureClick: (Int) -> Unit,
    onTeamClick: (Int) -> Unit
) {
    var isRefreshing by remember { mutableStateOf(false) }
    val coroutineScope = rememberCoroutineScope()
    
    // 페이지가 표시될 때 데이터 로드
    LaunchedEffect(date) {
        if (date.isNotEmpty()) {
            val cachedFixtures = viewModel.getFixturesForDate(date)
            if (cachedFixtures == null || cachedFixtures.isEmpty()) {
                viewModel.loadFixturesForSpecificDate(date)
            }
        }
    }
    
    val state by viewModel.state.collectAsState()
    
    val fixtures = if (isCurrentPage) {
        state.fixtures
    } else {
        viewModel.getFixturesForDate(date) ?: emptyList()
    }
    
    val isLoading = state.loadingDates.contains(date) || 
                   (state.isLoading && isCurrentPage)
    
    Box(modifier = Modifier.fillMaxSize()) {
        when {
            isLoading && fixtures.isEmpty() -> {
                IOSStyleSkeletonView()
            }
            
            fixtures.isEmpty() -> {
                IOSStyleEmptyView(date = date)
            }
            
            else -> {
                IOSStyleFixturesList(
                    fixtures = fixtures,
                    onFixtureClick = onFixtureClick,
                    onTeamClick = onTeamClick
                )
            }
        }
    }
}

/**
 * iOS 스타일 경기 목록
 */
@Composable
private fun IOSStyleFixturesList(
    fixtures: List<FixtureDto>,
    onFixtureClick: (Int) -> Unit,
    onTeamClick: (Int) -> Unit
) {
    // 즐겨찾기 팀 필터링 (TODO: 실제 즐겨찾기 서비스 연동 필요)
    val favoriteFixtures = emptyList<FixtureDto>() // 임시
    
    // 리그별 그룹화
    val fixturesByLeague = fixtures
        .filterNot { favoriteFixtures.contains(it) }
        .groupBy { it.league.id }
    
    // 리그 우선순위
    val leaguePriority = listOf(
        39, 140, 135, 78, 61, // 주요 리그
        2, 3, 4, // UEFA 대회
        848, 292, 293 // 아시아 대회
    )
    
    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = PaddingValues(vertical = 16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // 즐겨찾기 섹션
        if (favoriteFixtures.isNotEmpty()) {
            item {
                IOSStyleFavoriteSection(
                    fixtures = favoriteFixtures,
                    onFixtureClick = onFixtureClick,
                    onTeamClick = onTeamClick
                )
            }
        }
        
        // 리그별 섹션
        val sortedLeagues = fixturesByLeague.keys.sortedBy { leagueId ->
            val index = leaguePriority.indexOf(leagueId)
            if (index != -1) index else Int.MAX_VALUE
        }
        
        sortedLeagues.forEach { leagueId ->
            val leagueFixtures = fixturesByLeague[leagueId] ?: return@forEach
            val firstFixture = leagueFixtures.firstOrNull() ?: return@forEach
            
            item {
                Column(
                    modifier = Modifier.padding(horizontal = 16.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    // 리그 배너
                    IOSStyleLeagueBanner(
                        leagueId = leagueId,
                        leagueName = firstFixture.league.name,
                        leagueLogo = firstFixture.league.logo
                    )
                    
                    // 경기 카드들
                    leagueFixtures.forEach { fixture ->
                        IOSStyleFixtureCard(
                            fixture = fixture,
                            onClick = { onFixtureClick(fixture.fixture.id) },
                            onTeamClick = onTeamClick
                        )
                    }
                }
            }
        }
    }
}

/**
 * iOS 스타일 즐겨찾기 섹션
 */
@Composable
private fun IOSStyleFavoriteSection(
    fixtures: List<FixtureDto>,
    onFixtureClick: (Int) -> Unit,
    onTeamClick: (Int) -> Unit
) {
    Column(
        modifier = Modifier.padding(horizontal = 16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        // 헤더
        Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Icon(
                imageVector = Icons.Default.Star,
                contentDescription = null,
                tint = Color(0xFFFFD700),
                modifier = Modifier.size(20.dp)
            )
            Text(
                text = "팔로잉",
                style = MaterialTheme.typography.headlineMedium.copy(
                    fontWeight = FontWeight.Bold,
                    fontSize = 16.sp
                )
            )
        }
        
        // 경기 카드들
        fixtures.forEach { fixture ->
            IOSStyleFixtureCard(
                fixture = fixture,
                onClick = { onFixtureClick(fixture.fixture.id) },
                onTeamClick = onTeamClick
            )
        }
        
        Divider(
            modifier = Modifier.padding(vertical = 8.dp),
            color = FutInfoDesignSystem.Colors.SystemGray6
        )
    }
}

/**
 * iOS 스타일 로딩 뷰
 */
@Composable
private fun IOSStyleLoadingView() {
    Box(
        modifier = Modifier.fillMaxSize(),
        contentAlignment = Alignment.Center
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            CircularProgressIndicator(
                modifier = Modifier.size(40.dp),
                strokeWidth = 3.dp,
                color = FutInfoDesignSystem.Colors.RoyalBlue
            )
            
            var dotCount by remember { mutableIntStateOf(0) }
            LaunchedEffect(Unit) {
                while (true) {
                    delay(500)
                    dotCount = (dotCount + 1) % 4
                }
            }
            
            Text(
                text = "경기 일정을 불러오는 중${".".repeat(dotCount)}",
                style = MaterialTheme.typography.bodyMedium,
                color = FutInfoDesignSystem.Colors.Label.copy(alpha = 0.6f)
            )
        }
    }
}

/**
 * iOS 스타일 빈 상태 뷰
 */
@Composable
private fun IOSStyleEmptyView(date: String) {
    Box(
        modifier = Modifier.fillMaxSize(),
        contentAlignment = Alignment.Center
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            Icon(
                imageVector = Icons.Default.CalendarMonth,
                contentDescription = null,
                modifier = Modifier.size(48.dp),
                tint = FutInfoDesignSystem.Colors.Label.copy(alpha = 0.6f)
            )
            Text(
                text = "해당일에 예정된 경기가 없습니다",
                style = MaterialTheme.typography.bodyMedium,
                color = FutInfoDesignSystem.Colors.Label.copy(alpha = 0.6f),
                textAlign = TextAlign.Center
            )
        }
    }
}

/**
 * iOS 스타일 스켈레톤 뷰
 */
@Composable
private fun IOSStyleSkeletonView() {
    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        // 리그 배너 스켈레톤
        item {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(48.dp)
                    .clip(RoundedCornerShape(10.dp))
                    .background(shimmerBrush)
            )
        }
        
        // 경기 카드 스켈레톤
        items(5) {
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(80.dp),
                shape = RoundedCornerShape(12.dp),
                colors = CardDefaults.cardColors(
                    containerColor = FutInfoDesignSystem.Colors.SystemGray6
                )
            ) {
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .background(shimmerBrush)
                )
            }
        }
    }
}

/**
 * 셔머 효과 브러시
 */
private val shimmerBrush: Brush
    @Composable
    get() {
    val transition = rememberInfiniteTransition(label = "shimmer")
    val translateAnim by transition.animateFloat(
        initialValue = 0f,
        targetValue = 1000f,
        animationSpec = infiniteRepeatable(
            animation = tween(durationMillis = 1200, easing = LinearEasing),
            repeatMode = RepeatMode.Restart
        ),
        label = "shimmer"
    )
    
    return Brush.horizontalGradient(
        colors = listOf(
            FutInfoDesignSystem.Colors.SystemGray6,
            FutInfoDesignSystem.Colors.SystemGray5,
            FutInfoDesignSystem.Colors.SystemGray6
        ),
        startX = translateAnim - 500f,
        endX = translateAnim
    )
}