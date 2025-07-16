package com.hyunwoopark.futinfo.presentation.fixture_detail

import androidx.compose.animation.*
import androidx.compose.animation.core.*
import androidx.compose.foundation.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.pager.HorizontalPager
import androidx.compose.foundation.pager.rememberPagerState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.blur
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.scale
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import coil.compose.AsyncImage
import com.hyunwoopark.futinfo.data.remote.dto.FixtureDto
import com.hyunwoopark.futinfo.data.remote.dto.TeamDto
import com.hyunwoopark.futinfo.domain.model.FixtureDetailBundle
import com.hyunwoopark.futinfo.presentation.fixture_detail.tabs.*
import com.hyunwoopark.futinfo.presentation.components.*
import com.hyunwoopark.futinfo.presentation.theme.FutInfoDesignSystem
import com.hyunwoopark.futinfo.util.LeagueNameLocalizer
import com.hyunwoopark.futinfo.util.Resource
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.*

/**
 * iOS 스타일로 완전히 재설계된 경기 상세 화면
 * - 미니멀하고 직관적인 디자인
 * - 부드러운 애니메이션과 트랜지션
 * - 아름다운 그라데이션과 블러 효과
 */
@OptIn(ExperimentalMaterial3Api::class, ExperimentalFoundationApi::class)
@Composable
fun FixtureDetailScreenV2(
    fixtureId: Int,
    viewModel: FixtureDetailViewModel = hiltViewModel(),
    onBackClick: () -> Unit = {},
    onTeamClick: (Int) -> Unit = {}
) {
    val state by viewModel.state.collectAsStateWithLifecycle()
    val selectedTabIndex by viewModel.selectedTabIndex.collectAsStateWithLifecycle()
    val tabLoadingStates by viewModel.tabLoadingStates.collectAsStateWithLifecycle()
    val standingsState by viewModel.standingsState.collectAsStateWithLifecycle()
    
    LaunchedEffect(fixtureId) {
        viewModel.loadFixtureDetail(fixtureId)
    }
    
    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(FutInfoDesignSystem.Colors.SystemGroupedBackground)
    ) {
        when (val currentState = state) {
            is FixtureDetailState.Loading -> {
                IOSStyleFixtureDetailSkeletonV2()
            }
            
            is FixtureDetailState.Error -> {
                IOSStyleErrorView(
                    message = currentState.message,
                    onRetry = { viewModel.refreshFixtureDetail() }
                )
            }
            
            is FixtureDetailState.Success -> {
                IOSStyleFixtureDetailContentV2(
                    data = currentState.data,
                    selectedTabIndex = selectedTabIndex,
                    tabLoadingStates = tabLoadingStates,
                    standingsState = standingsState,
                    onTabSelected = { viewModel.selectTab(it) },
                    onTeamClick = onTeamClick,
                    viewModel = viewModel,
                    onBackClick = onBackClick
                )
            }
        }
    }
}

/**
 * iOS 스타일 경기 상세 컨텐츠
 */
@OptIn(ExperimentalFoundationApi::class)
@Composable
private fun IOSStyleFixtureDetailContentV2(
    data: FixtureDetailBundle,
    selectedTabIndex: Int,
    tabLoadingStates: Map<Int, Boolean>,
    standingsState: Resource<com.hyunwoopark.futinfo.data.remote.dto.StandingsResponseDto>?,
    onTabSelected: (Int) -> Unit,
    onTeamClick: (Int) -> Unit,
    viewModel: FixtureDetailViewModel,
    onBackClick: () -> Unit
) {
    val scrollState = rememberScrollState()
    val tabs = data.fixture?.let { viewModel.getTabsForFixture(it) } ?: emptyList()
    val pagerState = rememberPagerState(pageCount = { tabs.size })
    val coroutineScope = rememberCoroutineScope()
    
    Column(
        modifier = Modifier.fillMaxSize()
    ) {
        // 경기 헤더
        data.fixture?.let { fixture ->
            IOSStyleFixtureHeaderV2(
                fixture = fixture,
                onTeamClick = onTeamClick,
                onBackClick = onBackClick,
                scrollOffset = scrollState.value
            )
        }
        
        // 탭 바
        if (tabs.isNotEmpty()) {
            IOSStyleTabBarV2(
                tabs = tabs.mapIndexed { index, title ->
                    TabItemV2(
                        title = title,
                        icon = getTabIcon(title),
                        isLoading = tabLoadingStates[index] == true
                    )
                },
                selectedTab = pagerState.currentPage,
                onTabSelected = { index ->
                    coroutineScope.launch {
                        pagerState.animateScrollToPage(index)
                    }
                    onTabSelected(index)
                }
            )
            
            // 탭 컨텐츠
            HorizontalPager(
                state = pagerState,
                modifier = Modifier.fillMaxSize()
            ) { page ->
                val tabTitle = tabs.getOrNull(page) ?: return@HorizontalPager
                
                IOSStyleTabContentV2(
                    tabTitle = tabTitle,
                    data = data,
                    fixture = data.fixture!!,
                    standingsState = standingsState,
                    isLoading = tabLoadingStates[page] == true,
                    onTeamClick = onTeamClick
                )
            }
        }
    }
}

/**
 * iOS 스타일 경기 헤더 V2
 */
@Composable
private fun IOSStyleFixtureHeaderV2(
    fixture: FixtureDto,
    onTeamClick: (Int) -> Unit,
    onBackClick: () -> Unit,
    scrollOffset: Int
) {
    val headerHeight = 280.dp
    val parallaxFactor = 0.5f
    val blurRadius = (scrollOffset / 100f).coerceIn(0f, 20f)
    
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .height(headerHeight)
    ) {
        // 배경 그라데이션
        Box(
            modifier = Modifier
                .fillMaxSize()
                .graphicsLayer {
                    translationY = scrollOffset * parallaxFactor
                }
                .background(
                    Brush.verticalGradient(
                        colors = listOf(
                            FutInfoDesignSystem.Colors.RoyalBlue.copy(alpha = 0.1f),
                            FutInfoDesignSystem.Colors.SystemBackground
                        )
                    )
                )
        )
        
        // 블러 오버레이
        if (blurRadius > 0) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .blur(blurRadius.dp)
                    .background(Color.White.copy(alpha = 0.3f))
            )
        }
        
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(horizontal = 20.dp)
        ) {
            // 상단 네비게이션
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(top = 40.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                IconButton(
                    onClick = onBackClick,
                    modifier = Modifier
                        .size(40.dp)
                        .background(
                            color = FutInfoDesignSystem.Colors.SystemBackground.copy(alpha = 0.9f),
                            shape = CircleShape
                        )
                ) {
                    Icon(
                        imageVector = Icons.Default.ArrowBack,
                        contentDescription = "뒤로",
                        tint = FutInfoDesignSystem.Colors.Label
                    )
                }
                
                // 리그 정보
                Surface(
                    shape = RoundedCornerShape(20.dp),
                    color = FutInfoDesignSystem.Colors.SystemBackground.copy(alpha = 0.9f)
                ) {
                    Row(
                        modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        AsyncImage(
                            model = fixture.league.logo,
                            contentDescription = null,
                            modifier = Modifier.size(20.dp)
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = LeagueNameLocalizer.getLocalizedName(fixture.league.id, fixture.league.name),
                            style = FutInfoDesignSystem.Typography.Caption1,
                            fontWeight = FontWeight.Medium
                        )
                    }
                }
            }
            
            Spacer(modifier = Modifier.weight(1f))
            
            // 팀 정보
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(bottom = 20.dp),
                horizontalArrangement = Arrangement.SpaceEvenly,
                verticalAlignment = Alignment.CenterVertically
            ) {
                // 홈팀
                TeamInfoV2(
                    team = TeamDto(
                        id = fixture.teams.home.id,
                        name = fixture.teams.home.name,
                        logo = fixture.teams.home.logo
                    ),
                    score = fixture.goals?.home,
                    isWinner = isWinner(fixture.teams.home.id, fixture),
                    onClick = { onTeamClick(fixture.teams.home.id) }
                )
                
                // 스코어 또는 시간
                MatchCenterInfoV2(fixture)
                
                // 원정팀
                TeamInfoV2(
                    team = TeamDto(
                        id = fixture.teams.away.id,
                        name = fixture.teams.away.name,
                        logo = fixture.teams.away.logo
                    ),
                    score = fixture.goals?.away,
                    isWinner = isWinner(fixture.teams.away.id, fixture),
                    onClick = { onTeamClick(fixture.teams.away.id) }
                )
            }
            
            // 경기 상태
            MatchStatusBarV2(fixture)
            
            Spacer(modifier = Modifier.height(20.dp))
        }
    }
}

/**
 * 팀 정보 컴포넌트 V2
 */
@Composable
private fun TeamInfoV2(
    team: TeamDto,
    score: Int?,
    isWinner: Boolean,
    onClick: () -> Unit
) {
    Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        modifier = Modifier
            .clip(RoundedCornerShape(12.dp))
            .clickable { onClick() }
            .padding(8.dp)
    ) {
        Box(
            modifier = Modifier.size(80.dp)
        ) {
            AsyncImage(
                model = team.logo,
                contentDescription = team.name,
                modifier = Modifier
                    .fillMaxSize()
                    .scale(if (isWinner) 1.1f else 1f)
                    .animateContentSize()
            )
            
            if (isWinner) {
                Box(
                    modifier = Modifier
                        .align(Alignment.TopEnd)
                        .size(24.dp)
                        .background(FutInfoDesignSystem.Colors.Gold, CircleShape),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        imageVector = Icons.Default.Star,
                        contentDescription = "승리",
                        tint = Color.White,
                        modifier = Modifier.size(16.dp)
                    )
                }
            }
        }
        
        Spacer(modifier = Modifier.height(8.dp))
        
        Text(
            text = team.name,
            style = FutInfoDesignSystem.Typography.Caption1,
            fontWeight = FontWeight.Medium,
            maxLines = 2,
            textAlign = TextAlign.Center,
            modifier = Modifier.width(100.dp)
        )
        
        score?.let {
            Text(
                text = it.toString(),
                style = FutInfoDesignSystem.Typography.Title1,
                fontWeight = FontWeight.Bold,
                color = if (isWinner) FutInfoDesignSystem.Colors.RoyalBlue else FutInfoDesignSystem.Colors.SecondaryLabel
            )
        }
    }
}

/**
 * 경기 중앙 정보 V2
 */
@Composable
private fun MatchCenterInfoV2(fixture: FixtureDto) {
    Column(
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        when {
            fixture.fixture.status.short == "FT" -> {
                Text(
                    text = "종료",
                    style = FutInfoDesignSystem.Typography.Caption1,
                    color = FutInfoDesignSystem.Colors.SecondaryLabel
                )
                fixture.goals?.let { _ ->
                    // 승부차기 정보가 있으면 표시 (향후 구현)
                    // Penalty shootout info can be added here
                }
            }
            fixture.fixture.status.short in listOf("1H", "2H", "HT", "ET", "P") -> {
                Surface(
                    color = Color.Red,
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Text(
                        text = "${fixture.fixture.status.elapsed ?: 0}'",
                        style = FutInfoDesignSystem.Typography.Caption1,
                        fontWeight = FontWeight.Bold,
                        color = Color.White,
                        modifier = Modifier.padding(horizontal = 12.dp, vertical = 4.dp)
                    )
                }
            }
            else -> {
                Text(
                    text = formatKickoffTime(fixture.fixture.date),
                    style = FutInfoDesignSystem.Typography.Body,
                    fontWeight = FontWeight.Medium
                )
            }
        }
        
        Text(
            text = "vs",
            style = FutInfoDesignSystem.Typography.Caption2,
            color = FutInfoDesignSystem.Colors.TertiaryLabel,
            modifier = Modifier.padding(vertical = 4.dp)
        )
    }
}

/**
 * 경기 상태 바 V2
 */
@Composable
private fun MatchStatusBarV2(fixture: FixtureDto) {
    Surface(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(12.dp),
        color = FutInfoDesignSystem.Colors.SystemGray6
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(12.dp),
            horizontalArrangement = Arrangement.SpaceEvenly
        ) {
            // 경기장
            Row(
                verticalAlignment = Alignment.CenterVertically
            ) {
                Icon(
                    imageVector = Icons.Default.LocationOn,
                    contentDescription = null,
                    modifier = Modifier.size(16.dp),
                    tint = FutInfoDesignSystem.Colors.SecondaryLabel
                )
                Spacer(modifier = Modifier.width(4.dp))
                Text(
                    text = fixture.fixture.venue?.name ?: "경기장 정보 없음",
                    style = FutInfoDesignSystem.Typography.Caption2,
                    color = FutInfoDesignSystem.Colors.SecondaryLabel,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
            }
            
            // 날짜
            Row(
                verticalAlignment = Alignment.CenterVertically
            ) {
                Icon(
                    imageVector = Icons.Default.CalendarToday,
                    contentDescription = null,
                    modifier = Modifier.size(16.dp),
                    tint = FutInfoDesignSystem.Colors.SecondaryLabel
                )
                Spacer(modifier = Modifier.width(4.dp))
                Text(
                    text = formatMatchDate(fixture.fixture.date),
                    style = FutInfoDesignSystem.Typography.Caption2,
                    color = FutInfoDesignSystem.Colors.SecondaryLabel
                )
            }
        }
    }
}

/**
 * iOS 스타일 탭 바 V2
 */
@Composable
private fun IOSStyleTabBarV2(
    tabs: List<TabItemV2>,
    selectedTab: Int,
    onTabSelected: (Int) -> Unit
) {
    Surface(
        modifier = Modifier.fillMaxWidth(),
        color = FutInfoDesignSystem.Colors.SystemBackground,
        shadowElevation = 0.5.dp
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .horizontalScroll(rememberScrollState())
                .padding(horizontal = 16.dp, vertical = 8.dp),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            tabs.forEachIndexed { index, tab ->
                TabItemV2(
                    tab = tab,
                    isSelected = selectedTab == index,
                    onClick = { onTabSelected(index) }
                )
            }
        }
    }
}

/**
 * 탭 아이템 V2
 */
@Composable
private fun TabItemV2(
    tab: TabItemV2,
    isSelected: Boolean,
    onClick: () -> Unit
) {
    val animatedColor by animateColorAsState(
        targetValue = if (isSelected) FutInfoDesignSystem.Colors.RoyalBlue else FutInfoDesignSystem.Colors.SystemGray5,
        animationSpec = tween(300)
    )
    
    Surface(
        onClick = onClick,
        shape = RoundedCornerShape(20.dp),
        color = animatedColor
    ) {
        Row(
            modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(
                imageVector = tab.icon,
                contentDescription = tab.title,
                modifier = Modifier.size(18.dp),
                tint = if (isSelected) Color.White else FutInfoDesignSystem.Colors.SecondaryLabel
            )
            
            if (isSelected || tab.isLoading) {
                Spacer(modifier = Modifier.width(8.dp))
                
                if (tab.isLoading) {
                    CircularProgressIndicator(
                        modifier = Modifier.size(16.dp),
                        strokeWidth = 2.dp,
                        color = if (isSelected) Color.White else FutInfoDesignSystem.Colors.SecondaryLabel
                    )
                } else {
                    Text(
                        text = tab.title,
                        style = FutInfoDesignSystem.Typography.Caption1,
                        fontWeight = FontWeight.Medium,
                        color = Color.White
                    )
                }
            }
        }
    }
}

/**
 * iOS 스타일 탭 컨텐츠 V2
 */
@Composable
private fun IOSStyleTabContentV2(
    tabTitle: String,
    data: FixtureDetailBundle,
    fixture: FixtureDto,
    standingsState: Resource<com.hyunwoopark.futinfo.data.remote.dto.StandingsResponseDto>?,
    isLoading: Boolean,
    onTeamClick: (Int) -> Unit
) {
    when (tabTitle) {
        "정보" -> {
            // 경기가 끝났거나 진행 중이면 경기 요약(이벤트) 표시
            if (fixture.fixture.status.short in listOf("FT", "AET", "PEN", "1H", "2H", "HT", "ET", "P")) {
                MatchSummaryScreen(
                    data = data,
                    isLoading = isLoading
                )
            } else {
                // 예정된 경기는 기본 정보 표시
                MatchInfoScreen(
                    fixture = fixture,
                    isLoading = isLoading
                )
            }
        }
        "라인업" -> LineupsScreen(
            data = data,
            isLoading = isLoading
        )
        "통계" -> StatisticsScreen(
            data = data,
            isLoading = isLoading
        )
        "H2H" -> HeadToHeadScreen(
            fixture = fixture,
            isLoading = isLoading
        )
        "순위" -> StandingsScreen(
            standingsState = standingsState
        )
        "예측" -> IOSStyleEmptyState(message = "예측 정보가 없습니다")
        "부상" -> IOSStyleEmptyState(message = "부상 정보가 없습니다")
    }
}

/**
 * iOS 스타일 스켈레톤 V2
 */
@Composable
private fun IOSStyleFixtureDetailSkeletonV2() {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(FutInfoDesignSystem.Colors.SystemGroupedBackground)
    ) {
        // 헤더 스켈레톤
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(280.dp)
                .background(
                    shimmerBrush()
                )
        )
        
        // 탭 바 스켈레톤
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            repeat(4) {
                Box(
                    modifier = Modifier
                        .width(80.dp)
                        .height(36.dp)
                        .background(
                            shimmerBrush(),
                            RoundedCornerShape(20.dp)
                        )
                )
            }
        }
        
        // 컨텐츠 스켈레톤
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            repeat(5) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(60.dp)
                        .background(
                            shimmerBrush(),
                            RoundedCornerShape(12.dp)
                        )
                )
            }
        }
    }
}

// 탭 아이템 데이터 클래스
data class TabItemV2(
    val title: String,
    val icon: ImageVector,
    val isLoading: Boolean = false
)

// 유틸리티 함수들
private fun getTabIcon(tabTitle: String): ImageVector {
    return when (tabTitle) {
        "정보" -> Icons.Default.Info
        "라인업" -> Icons.Default.Groups
        "통계" -> Icons.Default.BarChart
        "H2H" -> Icons.Default.CompareArrows
        "순위" -> Icons.Default.EmojiEvents
        "예측" -> Icons.Default.Analytics
        "부상" -> Icons.Default.LocalHospital
        else -> Icons.Default.Info
    }
}

private fun isWinner(teamId: Int, fixture: FixtureDto): Boolean {
    val homeGoals = fixture.goals?.home ?: 0
    val awayGoals = fixture.goals?.away ?: 0
    
    return when {
        homeGoals > awayGoals && teamId == fixture.teams.home.id -> true
        awayGoals > homeGoals && teamId == fixture.teams.away.id -> true
        else -> false
    }
}

private fun formatKickoffTime(dateString: String): String {
    return try {
        val inputFormat = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ssXXX", Locale.getDefault())
        val outputFormat = SimpleDateFormat("HH:mm", Locale.getDefault())
        val date = inputFormat.parse(dateString)
        outputFormat.format(date ?: Date())
    } catch (e: Exception) {
        "시간 정보 없음"
    }
}

private fun formatMatchDate(dateString: String): String {
    return try {
        val inputFormat = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ssXXX", Locale.getDefault())
        val outputFormat = SimpleDateFormat("MM월 dd일", Locale.KOREAN)
        val date = inputFormat.parse(dateString)
        outputFormat.format(date ?: Date())
    } catch (e: Exception) {
        "날짜 정보 없음"
    }
}

@Composable
private fun shimmerBrush(): Brush {
    val shimmerColors = listOf(
        FutInfoDesignSystem.Colors.SystemGray6,
        FutInfoDesignSystem.Colors.SystemGray5,
        FutInfoDesignSystem.Colors.SystemGray6
    )
    
    val transition = rememberInfiniteTransition()
    val translateAnimation = transition.animateFloat(
        initialValue = 0f,
        targetValue = 1000f,
        animationSpec = infiniteRepeatable(
            animation = tween(800),
            repeatMode = RepeatMode.Restart
        )
    )
    
    return Brush.linearGradient(
        colors = shimmerColors,
        start = androidx.compose.ui.geometry.Offset.Zero,
        end = androidx.compose.ui.geometry.Offset(x = translateAnimation.value, y = translateAnimation.value)
    )
}