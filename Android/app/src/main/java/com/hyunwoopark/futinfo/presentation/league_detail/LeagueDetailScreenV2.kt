package com.hyunwoopark.futinfo.presentation.league_detail

import androidx.compose.animation.*
import androidx.compose.animation.core.*
import androidx.compose.foundation.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.*
import androidx.compose.foundation.lazy.grid.*
import androidx.compose.foundation.pager.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.*
import androidx.compose.ui.graphics.*
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.*
import androidx.compose.ui.unit.*
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import coil.compose.AsyncImage
import coil.request.ImageRequest
import com.hyunwoopark.futinfo.data.remote.dto.*
import com.hyunwoopark.futinfo.presentation.components.*
import com.hyunwoopark.futinfo.presentation.theme.FutInfoDesignSystem
import com.hyunwoopark.futinfo.presentation.theme.getQualificationColor
import com.hyunwoopark.futinfo.presentation.theme.getQualificationDescription
import com.hyunwoopark.futinfo.presentation.league_detail.components.SeasonSelectorDialog
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.*

/**
 * 최적화된 iOS 스타일 리그 상세 화면
 */
@OptIn(ExperimentalMaterial3Api::class, ExperimentalFoundationApi::class)
@Composable
fun LeagueDetailScreenV2(
    leagueId: Int,
    leagueName: String,
    onBackClick: () -> Unit = {},
    onTeamClick: (Int) -> Unit = {},
    onFixtureClick: (Int) -> Unit = {},
    onPlayerClick: (Int) -> Unit = {},
    viewModel: LeagueDetailViewModel = hiltViewModel()
) {
    val state by viewModel.state.collectAsStateWithLifecycle()
    val isCupCompetition = leagueId in listOf(2, 3, 848) // Champions League, Europa League, Conference League
    val pageCount = if (isCupCompetition) 5 else 4
    val pagerState = rememberPagerState(pageCount = { pageCount })
    val coroutineScope = rememberCoroutineScope()
    
    // 리그 데이터 로드
    LaunchedEffect(leagueId) {
        viewModel.loadLeagueData(leagueId)
    }
    
    // 페이저와 탭 동기화
    LaunchedEffect(pagerState.currentPage) {
        viewModel.selectTab(pagerState.currentPage)
    }
    
    LaunchedEffect(state.selectedTab) {
        pagerState.animateScrollToPage(state.selectedTab)
    }
    
    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(FutInfoDesignSystem.Colors.SystemBackground)
    ) {
        Column(
            modifier = Modifier.fillMaxSize()
        ) {
            // 커스텀 헤더
            IOSStyleLeagueHeader(
                leagueName = leagueName,
                leagueId = leagueId,
                season = state.season,
                onBackClick = onBackClick,
                onSeasonClick = { viewModel.showSeasonSelector() }
            )
            
            // 탭 바
            IOSStyleLeagueTabBar(
                selectedTab = pagerState.currentPage,
                isCupCompetition = isCupCompetition,
                onTabSelected = { index ->
                    coroutineScope.launch {
                        pagerState.animateScrollToPage(index)
                    }
                }
            )
            
            // 컨텐츠
            HorizontalPager(
                state = pagerState,
                modifier = Modifier.fillMaxSize()
            ) { page ->
                when (page) {
                    0 -> OptimizedStandingsTab(
                        state = state,
                        leagueId = leagueId,
                        onTeamClick = onTeamClick,
                        onRefresh = { viewModel.refresh() }
                    )
                    1 -> OptimizedFixturesTab(
                        state = state,
                        onFixtureClick = onFixtureClick,
                        onRefresh = { viewModel.refresh() }
                    )
                    2 -> OptimizedPlayerStatsTab(
                        state = state,
                        onPlayerClick = onPlayerClick,
                        onRefresh = { viewModel.refresh() }
                    )
                    3 -> {
                        if (isCupCompetition) {
                            OptimizedTournamentBracketTab(
                                state = state,
                                leagueId = leagueId,
                                onFixtureClick = onFixtureClick,
                                onRefresh = { viewModel.refresh() },
                                viewModel = viewModel
                            )
                        } else {
                            OptimizedTeamStatsTab(
                                state = state,
                                onTeamClick = onTeamClick,
                                onRefresh = { viewModel.refresh() }
                            )
                        }
                    }
                    4 -> OptimizedTeamStatsTab(
                        state = state,
                        onTeamClick = onTeamClick,
                        onRefresh = { viewModel.refresh() }
                    )
                }
            }
        }
        
        // 시즌 선택 다이얼로그
        if (state.showSeasonSelector && state.availableSeasons.isNotEmpty()) {
            SeasonSelectorDialog(
                availableSeasons = state.availableSeasons,
                currentSeason = state.season,
                onSeasonSelected = { viewModel.changeSeason(it) },
                onDismiss = { viewModel.hideSeasonSelector() }
            )
        }
    }
}

/**
 * iOS 스타일 리그 헤더
 */
@Composable
private fun IOSStyleLeagueHeader(
    leagueName: String,
    leagueId: Int,
    season: Int,
    onBackClick: () -> Unit,
    onSeasonClick: () -> Unit
) {
    Surface(
        modifier = Modifier.fillMaxWidth(),
        color = FutInfoDesignSystem.Colors.SystemBackground,
        shadowElevation = 0.5.dp
    ) {
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .statusBarsPadding()
                .height(120.dp)
        ) {
            // 배경 그라데이션
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .background(
                        brush = Brush.verticalGradient(
                            colors = listOf(
                                FutInfoDesignSystem.Colors.RoyalBlue.copy(alpha = 0.05f),
                                FutInfoDesignSystem.Colors.SystemBackground
                            )
                        )
                    )
            )
            
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(horizontal = 16.dp)
            ) {
                // 네비게이션 바
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(44.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    IconButton(
                        onClick = onBackClick,
                        modifier = Modifier.size(44.dp)
                    ) {
                        Icon(
                            imageVector = Icons.Default.ArrowBack,
                            contentDescription = "뒤로가기",
                            tint = FutInfoDesignSystem.Colors.RoyalBlue
                        )
                    }
                    
                    Spacer(modifier = Modifier.weight(1f))
                    
                    // 시즌 선택 버튼
                    Surface(
                        onClick = onSeasonClick,
                        modifier = Modifier.clip(RoundedCornerShape(20.dp)),
                        color = FutInfoDesignSystem.Colors.SystemGray6
                    ) {
                        Row(
                            modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(
                                text = "${season}/${(season + 1).toString().takeLast(2)}",
                                style = FutInfoDesignSystem.Typography.Caption1,
                                fontWeight = FontWeight.Medium
                            )
                            Spacer(modifier = Modifier.width(4.dp))
                            Icon(
                                imageVector = Icons.Default.KeyboardArrowDown,
                                contentDescription = null,
                                modifier = Modifier.size(16.dp),
                                tint = FutInfoDesignSystem.Colors.SecondaryLabel
                            )
                        }
                    }
                }
                
                // 리그 정보
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = 12.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    // 리그 로고
                    Surface(
                        modifier = Modifier
                            .size(48.dp)
                            .clip(CircleShape),
                        color = FutInfoDesignSystem.Colors.SystemGray6
                    ) {
                        Box(
                            contentAlignment = Alignment.Center
                        ) {
                            AsyncImage(
                                model = ImageRequest.Builder(LocalContext.current)
                                    .data(getLeagueLogo(leagueId))
                                    .crossfade(true)
                                    .build(),
                                contentDescription = leagueName,
                                modifier = Modifier.size(40.dp)
                            )
                        }
                    }
                    
                    Spacer(modifier = Modifier.width(12.dp))
                    
                    Column {
                        Text(
                            text = leagueName,
                            style = FutInfoDesignSystem.Typography.Title2,
                            fontWeight = FontWeight.Bold,
                            color = FutInfoDesignSystem.Colors.Label
                        )
                        Text(
                            text = getCountryName(leagueId),
                            style = FutInfoDesignSystem.Typography.Caption1,
                            color = FutInfoDesignSystem.Colors.SecondaryLabel
                        )
                    }
                }
            }
        }
    }
}

/**
 * iOS 스타일 탭 바
 */
@Composable
private fun IOSStyleLeagueTabBar(
    selectedTab: Int,
    isCupCompetition: Boolean,
    onTabSelected: (Int) -> Unit
) {
    val tabs = if (isCupCompetition) {
        listOf(
            TabItem("순위", Icons.Default.List),
            TabItem("경기", Icons.Default.SportsSoccer),
            TabItem("선수", Icons.Default.Person),
            TabItem("토너먼트", Icons.Default.AccountTree),
            TabItem("팀", Icons.Default.Groups)
        )
    } else {
        listOf(
            TabItem("순위", Icons.Default.List),
            TabItem("경기", Icons.Default.SportsSoccer),
            TabItem("선수", Icons.Default.Person),
            TabItem("팀", Icons.Default.Groups)
        )
    }
    
    Surface(
        modifier = Modifier.fillMaxWidth(),
        color = FutInfoDesignSystem.Colors.SystemBackground,
        shadowElevation = 0.5.dp
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .height(48.dp)
        ) {
            tabs.forEachIndexed { index, tab ->
                Box(
                    modifier = Modifier
                        .weight(1f)
                        .fillMaxHeight()
                        .clickable { onTabSelected(index) },
                    contentAlignment = Alignment.Center
                ) {
                    Column(
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(4.dp)
                        ) {
                            Icon(
                                imageVector = tab.icon,
                                contentDescription = tab.title,
                                modifier = Modifier.size(18.dp),
                                tint = if (selectedTab == index) 
                                    FutInfoDesignSystem.Colors.RoyalBlue 
                                else 
                                    FutInfoDesignSystem.Colors.TertiaryLabel
                            )
                            Text(
                                text = tab.title,
                                style = FutInfoDesignSystem.Typography.Caption1,
                                fontWeight = if (selectedTab == index) FontWeight.SemiBold else FontWeight.Medium,
                                color = if (selectedTab == index) 
                                    FutInfoDesignSystem.Colors.RoyalBlue 
                                else 
                                    FutInfoDesignSystem.Colors.TertiaryLabel
                            )
                        }
                        
                        // 인디케이터
                        Box(
                            modifier = Modifier
                                .padding(top = 4.dp)
                                .width(60.dp)
                                .height(2.dp)
                                .background(
                                    color = if (selectedTab == index) 
                                        FutInfoDesignSystem.Colors.RoyalBlue 
                                    else 
                                        Color.Transparent,
                                    shape = RoundedCornerShape(1.dp)
                                )
                        )
                    }
                }
            }
        }
    }
}

/**
 * 최적화된 순위 탭
 */
@Composable
private fun OptimizedStandingsTab(
    state: LeagueDetailState,
    leagueId: Int,
    onTeamClick: (Int) -> Unit,
    onRefresh: () -> Unit
) {
    when {
        state.isStandingsLoading -> {
            IOSStyleLoadingView(message = "순위표를 불러오는 중...")
        }
        state.standingsError != null -> {
            IOSStyleErrorView(
                message = state.standingsError,
                onRetry = onRefresh
            )
        }
        state.standings == null || state.standings.response.isEmpty() -> {
            IOSStyleEmptyState(
                message = getFutureSeasonMessage(state.season, "순위")
            )
        }
        else -> {
            LazyColumn(
                modifier = Modifier
                    .fillMaxSize()
                    .background(FutInfoDesignSystem.Colors.SystemGroupedBackground),
                contentPadding = PaddingValues(vertical = 16.dp)
            ) {
                state.standings.response.forEach { leagueStanding ->
                    leagueStanding.league.standings?.forEach { standingsList ->
                        // 순위표 헤더
                        item {
                            StandingsHeaderCard()
                        }
                        
                        // 순위 목록
                        itemsIndexed(
                            items = standingsList,
                            key = { _, standing -> standing.team.id }
                        ) { index, standing ->
                            MinimalStandingCard(
                                standing = standing,
                                leagueId = leagueId,
                                position = index + 1,
                                onTeamClick = { onTeamClick(standing.team.id) }
                            )
                        }
                        
                        // 범례
                        item {
                            StandingsLegendCard(leagueId = leagueId)
                        }
                    }
                }
            }
        }
    }
}

/**
 * 순위표 헤더 카드
 */
@Composable
private fun StandingsHeaderCard() {
    Surface(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 4.dp),
        shape = RoundedCornerShape(12.dp),
        color = FutInfoDesignSystem.Colors.SystemBackground
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp, vertical = 12.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = "#",
                style = FutInfoDesignSystem.Typography.Caption2,
                color = FutInfoDesignSystem.Colors.TertiaryLabel,
                modifier = Modifier.width(24.dp),
                textAlign = TextAlign.Center
            )
            
            Text(
                text = "팀",
                style = FutInfoDesignSystem.Typography.Caption2,
                color = FutInfoDesignSystem.Colors.TertiaryLabel,
                modifier = Modifier.weight(1f)
            )
            
            // 통계 헤더
            listOf("경기", "승점", "득실").forEach { header ->
                Text(
                    text = header,
                    style = FutInfoDesignSystem.Typography.Caption2,
                    color = FutInfoDesignSystem.Colors.TertiaryLabel,
                    modifier = Modifier.width(40.dp),
                    textAlign = TextAlign.Center
                )
            }
        }
    }
}

/**
 * 미니멀한 순위 카드
 */
@Composable
private fun MinimalStandingCard(
    standing: StandingDto,
    leagueId: Int,
    position: Int,
    onTeamClick: () -> Unit
) {
    val qualificationColor = getQualificationColor(leagueId, standing.rank)
    
    Surface(
        onClick = onTeamClick,
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 2.dp),
        shape = RoundedCornerShape(12.dp),
        color = FutInfoDesignSystem.Colors.SystemBackground
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp, vertical = 12.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            // 순위 및 진출권 인디케이터
            Box(
                modifier = Modifier.width(24.dp),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = standing.rank.toString(),
                    style = FutInfoDesignSystem.Typography.Body,
                    fontWeight = FontWeight.SemiBold,
                    color = if (qualificationColor != Color.Transparent) 
                        qualificationColor 
                    else 
                        FutInfoDesignSystem.Colors.Label
                )
            }
            
            Spacer(modifier = Modifier.width(12.dp))
            
            // 팀 정보
            Row(
                modifier = Modifier.weight(1f),
                verticalAlignment = Alignment.CenterVertically
            ) {
                AsyncImage(
                    model = standing.team.logo,
                    contentDescription = standing.team.name,
                    modifier = Modifier.size(24.dp)
                )
                
                Spacer(modifier = Modifier.width(8.dp))
                
                Text(
                    text = standing.team.name,
                    style = FutInfoDesignSystem.Typography.Body,
                    fontWeight = FontWeight.Medium,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
            }
            
            // 통계
            Text(
                text = standing.all.played.toString(),
                style = FutInfoDesignSystem.Typography.Body,
                color = FutInfoDesignSystem.Colors.SecondaryLabel,
                modifier = Modifier.width(40.dp),
                textAlign = TextAlign.Center
            )
            
            Text(
                text = standing.points.toString(),
                style = FutInfoDesignSystem.Typography.Body,
                fontWeight = FontWeight.SemiBold,
                modifier = Modifier.width(40.dp),
                textAlign = TextAlign.Center
            )
            
            Text(
                text = if (standing.goalsDiff > 0) "+${standing.goalsDiff}" else standing.goalsDiff.toString(),
                style = FutInfoDesignSystem.Typography.Body,
                color = when {
                    standing.goalsDiff > 0 -> FutInfoDesignSystem.Colors.Green
                    standing.goalsDiff < 0 -> FutInfoDesignSystem.Colors.Red
                    else -> FutInfoDesignSystem.Colors.SecondaryLabel
                },
                modifier = Modifier.width(40.dp),
                textAlign = TextAlign.Center
            )
        }
    }
}

/**
 * 순위표 범례
 */
@Composable
private fun StandingsLegendCard(leagueId: Int) {
    val legends = getQualificationLegends(leagueId)
    
    if (legends.isNotEmpty()) {
        Surface(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            shape = RoundedCornerShape(12.dp),
            color = FutInfoDesignSystem.Colors.SystemBackground
        ) {
            Column(
                modifier = Modifier.padding(16.dp)
            ) {
                Text(
                    text = "진출권",
                    style = FutInfoDesignSystem.Typography.Caption1,
                    fontWeight = FontWeight.SemiBold,
                    color = FutInfoDesignSystem.Colors.Label
                )
                
                Spacer(modifier = Modifier.height(8.dp))
                
                legends.forEach { legend ->
                    Row(
                        modifier = Modifier.padding(vertical = 2.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Box(
                            modifier = Modifier
                                .size(12.dp)
                                .clip(CircleShape)
                                .background(legend.color)
                        )
                        
                        Spacer(modifier = Modifier.width(8.dp))
                        
                        Text(
                            text = legend.description,
                            style = FutInfoDesignSystem.Typography.Caption2,
                            color = FutInfoDesignSystem.Colors.SecondaryLabel
                        )
                    }
                }
            }
        }
    }
}

/**
 * 최적화된 경기 탭
 */
@OptIn(ExperimentalFoundationApi::class)
@Composable
private fun OptimizedFixturesTab(
    state: LeagueDetailState,
    onFixtureClick: (Int) -> Unit,
    onRefresh: () -> Unit
) {
    when {
        state.isFixturesLoading -> {
            IOSStyleLoadingView(message = "경기 일정을 불러오는 중...")
        }
        state.fixturesError != null -> {
            IOSStyleErrorView(
                message = state.fixturesError,
                onRetry = onRefresh
            )
        }
        state.fixtures == null || state.fixtures.response.isEmpty() -> {
            IOSStyleEmptyState(
                message = getFutureSeasonMessage(state.season, "경기")
            )
        }
        else -> {
            val groupedFixtures = state.fixtures.response
                .sortedByDescending { it.fixture.date }
                .groupBy { fixture ->
                    SimpleDateFormat("yyyy년 MM월 dd일", Locale.KOREAN)
                        .format(SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ssZ", Locale.getDefault())
                        .parse(fixture.fixture.date) ?: Date())
                }
            
            LazyColumn(
                modifier = Modifier
                    .fillMaxSize()
                    .background(FutInfoDesignSystem.Colors.SystemGroupedBackground),
                contentPadding = PaddingValues(vertical = 16.dp)
            ) {
                groupedFixtures.forEach { (date, fixtures) ->
                    stickyHeader {
                        FixtureDateHeader(date = date)
                    }
                    
                    items(
                        items = fixtures,
                        key = { it.fixture.id }
                    ) { fixture ->
                        MinimalFixtureCard(
                            fixture = fixture,
                            onFixtureClick = { onFixtureClick(fixture.fixture.id) }
                        )
                    }
                }
            }
        }
    }
}

/**
 * 경기 날짜 헤더
 */
@Composable
private fun FixtureDateHeader(date: String) {
    Surface(
        modifier = Modifier.fillMaxWidth(),
        color = FutInfoDesignSystem.Colors.SystemGroupedBackground
    ) {
        Text(
            text = date,
            style = FutInfoDesignSystem.Typography.Caption1,
            fontWeight = FontWeight.SemiBold,
            color = FutInfoDesignSystem.Colors.SecondaryLabel,
            modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp)
        )
    }
}

/**
 * 미니멀한 경기 카드
 */
@Composable
private fun MinimalFixtureCard(
    fixture: FixtureDto,
    onFixtureClick: () -> Unit
) {
    Surface(
        onClick = onFixtureClick,
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 4.dp),
        shape = RoundedCornerShape(12.dp),
        color = FutInfoDesignSystem.Colors.SystemBackground
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            // 시간 또는 상태
            Box(
                modifier = Modifier.width(48.dp),
                contentAlignment = Alignment.Center
            ) {
                when (fixture.fixture.status.short) {
                    "FT", "AET", "PEN" -> {
                        Text(
                            text = "종료",
                            style = FutInfoDesignSystem.Typography.Caption2,
                            color = FutInfoDesignSystem.Colors.TertiaryLabel
                        )
                    }
                    "LIVE", "1H", "HT", "2H", "ET", "BT", "P" -> {
                        Row(
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(6.dp)
                                    .clip(CircleShape)
                                    .background(FutInfoDesignSystem.Colors.SystemRed)
                            )
                            Spacer(modifier = Modifier.width(4.dp))
                            Text(
                                text = "${fixture.fixture.status.elapsed}'",
                                style = FutInfoDesignSystem.Typography.Caption2,
                                fontWeight = FontWeight.SemiBold,
                                color = FutInfoDesignSystem.Colors.SystemRed
                            )
                        }
                    }
                    else -> {
                        Text(
                            text = SimpleDateFormat("HH:mm", Locale.getDefault())
                                .format(SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ssZ", Locale.getDefault())
                                .parse(fixture.fixture.date) ?: Date()),
                            style = FutInfoDesignSystem.Typography.Caption2,
                            color = FutInfoDesignSystem.Colors.SecondaryLabel
                        )
                    }
                }
            }
            
            // 홈팀
            Row(
                modifier = Modifier.weight(1f),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.End
            ) {
                Text(
                    text = fixture.teams.home.name,
                    style = FutInfoDesignSystem.Typography.Body,
                    fontWeight = if (isWinner(fixture.teams.home.winner)) FontWeight.SemiBold else FontWeight.Medium,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                    modifier = Modifier.weight(1f, fill = false),
                    textAlign = TextAlign.End
                )
                
                Spacer(modifier = Modifier.width(8.dp))
                
                AsyncImage(
                    model = fixture.teams.home.logo,
                    contentDescription = fixture.teams.home.name,
                    modifier = Modifier.size(24.dp)
                )
            }
            
            // 스코어
            Box(
                modifier = Modifier
                    .padding(horizontal = 12.dp)
                    .width(60.dp),
                contentAlignment = Alignment.Center
            ) {
                when (fixture.fixture.status.short) {
                    "NS", "TBD", "PST", "CANC", "ABD", "AWD", "WO" -> {
                        Text(
                            text = "vs",
                            style = FutInfoDesignSystem.Typography.Caption1,
                            color = FutInfoDesignSystem.Colors.TertiaryLabel
                        )
                    }
                    else -> {
                        Row(
                            horizontalArrangement = Arrangement.Center,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(
                                text = (fixture.goals?.home ?: 0).toString(),
                                style = FutInfoDesignSystem.Typography.Headline,
                                fontWeight = if (isWinner(fixture.teams.home.winner)) FontWeight.Bold else FontWeight.Medium,
                                color = if (isWinner(fixture.teams.home.winner)) 
                                    FutInfoDesignSystem.Colors.Label 
                                else 
                                    FutInfoDesignSystem.Colors.SecondaryLabel
                            )
                            
                            Text(
                                text = " - ",
                                style = FutInfoDesignSystem.Typography.Headline,
                                color = FutInfoDesignSystem.Colors.TertiaryLabel
                            )
                            
                            Text(
                                text = (fixture.goals?.away ?: 0).toString(),
                                style = FutInfoDesignSystem.Typography.Headline,
                                fontWeight = if (isWinner(fixture.teams.away.winner)) FontWeight.Bold else FontWeight.Medium,
                                color = if (isWinner(fixture.teams.away.winner)) 
                                    FutInfoDesignSystem.Colors.Label 
                                else 
                                    FutInfoDesignSystem.Colors.SecondaryLabel
                            )
                        }
                    }
                }
            }
            
            // 원정팀
            Row(
                modifier = Modifier.weight(1f),
                verticalAlignment = Alignment.CenterVertically
            ) {
                AsyncImage(
                    model = fixture.teams.away.logo,
                    contentDescription = fixture.teams.away.name,
                    modifier = Modifier.size(24.dp)
                )
                
                Spacer(modifier = Modifier.width(8.dp))
                
                Text(
                    text = fixture.teams.away.name,
                    style = FutInfoDesignSystem.Typography.Body,
                    fontWeight = if (isWinner(fixture.teams.away.winner)) FontWeight.SemiBold else FontWeight.Medium,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                    modifier = Modifier.weight(1f)
                )
            }
        }
    }
}

/**
 * 최적화된 선수 통계 탭
 */
@Composable
private fun OptimizedPlayerStatsTab(
    state: LeagueDetailState,
    onPlayerClick: (Int) -> Unit,
    onRefresh: () -> Unit
) {
    var selectedStat by remember { mutableStateOf(PlayerStatType.GOALS) }
    
    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(FutInfoDesignSystem.Colors.SystemGroupedBackground)
    ) {
        // 통계 선택 세그먼트
        PlayerStatSegmentedControl(
            selectedStat = selectedStat,
            onStatSelected = { selectedStat = it }
        )
        
        // 컨텐츠
        when (selectedStat) {
            PlayerStatType.GOALS -> {
                PlayerStatsList(
                    isLoading = state.isTopScorersLoading,
                    error = state.topScorersError,
                    players = state.topScorers?.response,
                    statType = PlayerStatType.GOALS,
                    onPlayerClick = onPlayerClick,
                    onRefresh = onRefresh
                )
            }
            PlayerStatType.ASSISTS -> {
                PlayerStatsList(
                    isLoading = state.isTopAssistsLoading,
                    error = state.topAssistsError,
                    players = state.topAssists?.response,
                    statType = PlayerStatType.ASSISTS,
                    onPlayerClick = onPlayerClick,
                    onRefresh = onRefresh
                )
            }
        }
    }
}

/**
 * 선수 통계 타입
 */
enum class PlayerStatType {
    GOALS, ASSISTS
}

/**
 * 선수 통계 세그먼트 컨트롤
 */
@Composable
private fun PlayerStatSegmentedControl(
    selectedStat: PlayerStatType,
    onStatSelected: (PlayerStatType) -> Unit
) {
    Surface(
        modifier = Modifier.fillMaxWidth(),
        color = FutInfoDesignSystem.Colors.SystemBackground,
        shadowElevation = 0.5.dp
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp)
        ) {
            Surface(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(32.dp),
                shape = RoundedCornerShape(8.dp),
                color = FutInfoDesignSystem.Colors.SystemGray6
            ) {
                Row(
                    modifier = Modifier.padding(2.dp)
                ) {
                    PlayerStatType.values().forEach { type ->
                        Surface(
                            onClick = { onStatSelected(type) },
                            modifier = Modifier
                                .weight(1f)
                                .fillMaxHeight(),
                            shape = RoundedCornerShape(6.dp),
                            color = if (selectedStat == type) 
                                FutInfoDesignSystem.Colors.SystemBackground 
                            else 
                                Color.Transparent
                        ) {
                            Box(
                                contentAlignment = Alignment.Center
                            ) {
                                Text(
                                    text = when (type) {
                                        PlayerStatType.GOALS -> "득점"
                                        PlayerStatType.ASSISTS -> "도움"
                                    },
                                    style = FutInfoDesignSystem.Typography.Caption1,
                                    fontWeight = if (selectedStat == type) 
                                        FontWeight.SemiBold 
                                    else 
                                        FontWeight.Medium,
                                    color = if (selectedStat == type) 
                                        FutInfoDesignSystem.Colors.Label 
                                    else 
                                        FutInfoDesignSystem.Colors.SecondaryLabel
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}

/**
 * 선수 통계 목록
 */
@Composable
private fun PlayerStatsList(
    isLoading: Boolean,
    error: String?,
    players: List<PlayerDto>?,
    statType: PlayerStatType,
    onPlayerClick: (Int) -> Unit,
    onRefresh: () -> Unit
) {
    when {
        isLoading -> {
            IOSStyleLoadingView(message = "선수 통계를 불러오는 중...")
        }
        error != null -> {
            IOSStyleErrorView(
                message = error,
                onRetry = onRefresh
            )
        }
        players.isNullOrEmpty() -> {
            IOSStyleEmptyState(message = "선수 통계가 없습니다")
        }
        else -> {
            LazyColumn(
                modifier = Modifier.fillMaxSize(),
                contentPadding = PaddingValues(vertical = 8.dp)
            ) {
                itemsIndexed(
                    items = players.take(20),
                    key = { _, player -> player.player.id?.toString() ?: "unknown" }
                ) { index, player ->
                    MinimalPlayerStatCard(
                        player = player,
                        rank = index + 1,
                        statType = statType,
                        onPlayerClick = { onPlayerClick(player.player.id ?: 0) }
                    )
                }
            }
        }
    }
}

/**
 * 미니멀한 선수 통계 카드
 */
@Composable
private fun MinimalPlayerStatCard(
    player: PlayerDto,
    rank: Int,
    statType: PlayerStatType,
    onPlayerClick: () -> Unit
) {
    val statValue = when (statType) {
        PlayerStatType.GOALS -> player.statistics?.firstOrNull()?.goals?.total ?: 0
        PlayerStatType.ASSISTS -> player.statistics?.firstOrNull()?.goals?.assists ?: 0
    }
    
    Surface(
        onClick = onPlayerClick,
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 2.dp),
        shape = RoundedCornerShape(12.dp),
        color = FutInfoDesignSystem.Colors.SystemBackground
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            // 순위
            Surface(
                modifier = Modifier.size(32.dp),
                shape = CircleShape,
                color = when (rank) {
                    1 -> FutInfoDesignSystem.Colors.Gold
                    2 -> FutInfoDesignSystem.Colors.Silver
                    3 -> FutInfoDesignSystem.Colors.Bronze
                    else -> FutInfoDesignSystem.Colors.SystemGray6
                }
            ) {
                Box(
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = rank.toString(),
                        style = FutInfoDesignSystem.Typography.Caption1,
                        fontWeight = FontWeight.Bold,
                        color = if (rank <= 3) Color.White else FutInfoDesignSystem.Colors.Label
                    )
                }
            }
            
            Spacer(modifier = Modifier.width(12.dp))
            
            // 선수 사진
            Surface(
                modifier = Modifier
                    .size(40.dp)
                    .clip(CircleShape),
                color = FutInfoDesignSystem.Colors.SystemGray6
            ) {
                AsyncImage(
                    model = player.player.photo,
                    contentDescription = player.player.name,
                    contentScale = ContentScale.Crop
                )
            }
            
            Spacer(modifier = Modifier.width(12.dp))
            
            // 선수 정보
            Column(
                modifier = Modifier.weight(1f)
            ) {
                Text(
                    text = player.player.name ?: "Unknown",
                    style = FutInfoDesignSystem.Typography.Body,
                    fontWeight = FontWeight.Medium,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
                Row(
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    AsyncImage(
                        model = player.statistics?.firstOrNull()?.team?.logo,
                        contentDescription = null,
                        modifier = Modifier.size(16.dp)
                    )
                    Spacer(modifier = Modifier.width(4.dp))
                    Text(
                        text = player.statistics?.firstOrNull()?.team?.name ?: "",
                        style = FutInfoDesignSystem.Typography.Caption2,
                        color = FutInfoDesignSystem.Colors.SecondaryLabel,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                }
            }
            
            // 통계
            Column(
                horizontalAlignment = Alignment.End
            ) {
                Text(
                    text = statValue.toString(),
                    style = FutInfoDesignSystem.Typography.Title3,
                    fontWeight = FontWeight.Bold,
                    color = FutInfoDesignSystem.Colors.RoyalBlue
                )
                Text(
                    text = when (statType) {
                        PlayerStatType.GOALS -> "골"
                        PlayerStatType.ASSISTS -> "도움"
                    },
                    style = FutInfoDesignSystem.Typography.Caption2,
                    color = FutInfoDesignSystem.Colors.TertiaryLabel
                )
            }
        }
    }
}

/**
 * 최적화된 팀 통계 탭
 */
@OptIn(ExperimentalFoundationApi::class)
@Composable
private fun OptimizedTeamStatsTab(
    state: LeagueDetailState,
    onTeamClick: (Int) -> Unit,
    onRefresh: () -> Unit
) {
    when {
        state.isTeamStatisticsLoading -> {
            IOSStyleLoadingView(message = "팀 통계를 불러오는 중...")
        }
        state.teamStatisticsError != null -> {
            IOSStyleErrorView(
                message = state.teamStatisticsError,
                onRetry = onRefresh
            )
        }
        state.teamStatistics.isNullOrEmpty() -> {
            IOSStyleEmptyState(message = "팀 통계가 없습니다")
        }
        else -> {
            val categories = listOf(
                TeamStatCategory("득점", "goals.for.total.total", Icons.Default.SportsSoccer),
                TeamStatCategory("실점", "goals.against.total.total", Icons.Default.Block),
                TeamStatCategory("승리", "fixtures.wins.total", Icons.Default.EmojiEvents),
                TeamStatCategory("무승부", "fixtures.draws.total", Icons.Default.Handshake)
            )
            
            LazyVerticalGrid(
                columns = GridCells.Fixed(2),
                modifier = Modifier
                    .fillMaxSize()
                    .background(FutInfoDesignSystem.Colors.SystemGroupedBackground),
                contentPadding = PaddingValues(16.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                categories.forEach { category ->
                    item {
                        TeamStatCategoryCard(
                            category = category,
                            teams = state.teamStatistics.map { it.response }.sortedByDescending { team ->
                                getTeamStatValue(team, category.key)
                            }.take(5),
                            onTeamClick = onTeamClick
                        )
                    }
                }
            }
        }
    }
}

/**
 * 팀 통계 카테고리
 */
data class TeamStatCategory(
    val title: String,
    val key: String,
    val icon: ImageVector
)

/**
 * 팀 통계 카테고리 카드
 */
@Composable
private fun TeamStatCategoryCard(
    category: TeamStatCategory,
    teams: List<TeamSeasonStatisticsDto>,
    onTeamClick: (Int) -> Unit
) {
    Surface(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(16.dp),
        color = FutInfoDesignSystem.Colors.SystemBackground
    ) {
        Column(
            modifier = Modifier.padding(16.dp)
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically
            ) {
                Icon(
                    imageVector = category.icon,
                    contentDescription = category.title,
                    modifier = Modifier.size(20.dp),
                    tint = FutInfoDesignSystem.Colors.RoyalBlue
                )
                Spacer(modifier = Modifier.width(8.dp))
                Text(
                    text = category.title,
                    style = FutInfoDesignSystem.Typography.Headline,
                    fontWeight = FontWeight.SemiBold
                )
            }
            
            Spacer(modifier = Modifier.height(12.dp))
            
            teams.forEachIndexed { index, team ->
                TeamStatItem(
                    team = team,
                    rank = index + 1,
                    statKey = category.key,
                    onClick = { onTeamClick(team.team.id) }
                )
                
                if (index < teams.lastIndex) {
                    Divider(
                        modifier = Modifier.padding(vertical = 8.dp),
                        color = FutInfoDesignSystem.Colors.SystemGray6
                    )
                }
            }
        }
    }
}

/**
 * 팀 통계 아이템
 */
@Composable
private fun TeamStatItem(
    team: TeamSeasonStatisticsDto,
    rank: Int,
    statKey: String,
    onClick: () -> Unit
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clickable { onClick() },
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(
            text = rank.toString(),
            style = FutInfoDesignSystem.Typography.Caption1,
            color = FutInfoDesignSystem.Colors.TertiaryLabel,
            modifier = Modifier.width(20.dp)
        )
        
        AsyncImage(
            model = team.team.logo,
            contentDescription = team.team.name,
            modifier = Modifier.size(20.dp)
        )
        
        Spacer(modifier = Modifier.width(8.dp))
        
        Text(
            text = team.team.name,
            style = FutInfoDesignSystem.Typography.Caption1,
            modifier = Modifier.weight(1f),
            maxLines = 1,
            overflow = TextOverflow.Ellipsis
        )
        
        Text(
            text = getTeamStatValue(team, statKey).toString(),
            style = FutInfoDesignSystem.Typography.Caption1,
            fontWeight = FontWeight.SemiBold,
            color = FutInfoDesignSystem.Colors.RoyalBlue
        )
    }
}

// Helper functions

private fun getLeagueLogo(leagueId: Int): String {
    return "https://media.api-sports.io/football/leagues/$leagueId.png"
}

private fun getCountryName(leagueId: Int): String {
    return when (leagueId) {
        39 -> "잉글랜드"
        140 -> "스페인"
        61 -> "프랑스"
        78 -> "독일"
        135 -> "이탈리아"
        2, 3, 848 -> "유럽"
        else -> ""
    }
}

private fun isWinner(winner: Boolean?): Boolean = winner == true

private fun getFutureSeasonMessage(season: Int, dataType: String): String {
    val currentYear = Calendar.getInstance().get(Calendar.YEAR)
    val currentMonth = Calendar.getInstance().get(Calendar.MONTH)
    val currentSeason = if (currentMonth >= Calendar.JULY) currentYear else currentYear - 1
    
    return if (season > currentSeason) {
        "${season}/${season + 1} 시즌은 아직 시작되지 않았습니다"
    } else {
        "${season}/${season + 1} 시즌 $dataType 정보가 없습니다"
    }
}

private fun getQualificationLegends(leagueId: Int): List<QualificationLegend> {
    return when (leagueId) {
        39, 140, 61, 78, 135 -> listOf(
            QualificationLegend(FutInfoDesignSystem.Colors.ChampionsLeague, "챔피언스 리그"),
            QualificationLegend(FutInfoDesignSystem.Colors.EuropaLeague, "유로파 리그"),
            QualificationLegend(FutInfoDesignSystem.Colors.ConferenceLeague, "컨퍼런스 리그"),
            QualificationLegend(FutInfoDesignSystem.Colors.Relegation, "강등")
        )
        else -> emptyList()
    }
}

data class QualificationLegend(
    val color: Color,
    val description: String
)

private fun getTeamStatValue(team: TeamSeasonStatisticsDto, key: String): Int {
    return when (key) {
        "goals.for.total.total" -> team.goals?.goalsFor?.total?.total ?: 0
        "goals.against.total.total" -> team.goals?.against?.total?.total ?: 0
        "fixtures.wins.total" -> team.fixtures?.wins?.total ?: 0
        "fixtures.draws.total" -> team.fixtures?.draws?.total ?: 0
        else -> 0
    }
}

/**
 * 최적화된 토너먼트 대진표 탭
 */
@Composable
private fun OptimizedTournamentBracketTab(
    state: LeagueDetailState,
    leagueId: Int,
    onFixtureClick: (Int) -> Unit,
    onRefresh: () -> Unit,
    viewModel: LeagueDetailViewModel = hiltViewModel()
) {
    LaunchedEffect(leagueId, state.season) {
        viewModel.ensureBracketLoaded()
    }
    
    when {
        state.isBracketLoading -> {
            IOSStyleLoadingView(message = "토너먼트 대진표를 불러오는 중...")
        }
        state.bracketError != null -> {
            IOSStyleErrorView(
                message = state.bracketError,
                onRetry = onRefresh
            )
        }
        state.bracket == null || state.bracket.rounds.isEmpty() -> {
            IOSStyleEmptyState(message = "토너먼트 대진표가 없습니다")
        }
        else -> {
            TournamentBracketView(
                bracket = state.bracket,
                onFixtureClick = onFixtureClick
            )
        }
    }
}

/**
 * 토너먼트 대진표 뷰 - 전통적인 세로 브라켓 스타일
 */
@Composable
private fun TournamentBracketView(
    bracket: com.hyunwoopark.futinfo.domain.model.Bracket,
    onFixtureClick: (Int) -> Unit
) {
    if (bracket.rounds.isEmpty()) {
        IOSStyleEmptyState(message = "토너먼트 대진표가 없습니다")
        return
    }
    
    // 토너먼트 라운드를 순서대로 정렬 (32강 → 16강 → 8강 → 준결승 → 결승)
    // 16강 플레이오프부터만 표시
    val sortedRounds = bracket.rounds.sortedByDescending { round ->
        val lower = round.round.lowercase()
        when {
            lower.contains("final") && !lower.contains("semi") -> 1
            lower.contains("3rd place") || lower.contains("third place") -> 2
            lower.contains("semi") || lower.contains("1/2") -> 3
            lower.contains("quarter") || lower.contains("1/4") -> 4
            lower.contains("round of 16") || lower.contains("1/8") -> 5
            lower.contains("round of 32") || lower.contains("1/16") -> 6
            lower.contains("playoffs") || lower.contains("knockout") -> 7
            else -> 99
        }
    }
    
    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(FutInfoDesignSystem.Colors.SystemGroupedBackground)
    ) {
        // 헤더
        Surface(
            modifier = Modifier.fillMaxWidth(),
            color = FutInfoDesignSystem.Colors.SystemBackground
        ) {
            Column(
                modifier = Modifier.padding(16.dp)
            ) {
                Text(
                    text = "토너먼트 대진표",
                    style = FutInfoDesignSystem.Typography.Title2,
                    fontWeight = FontWeight.Bold,
                    color = FutInfoDesignSystem.Colors.Label
                )
                Text(
                    text = "→ 스크롤하여 브라켓 탐색",
                    style = FutInfoDesignSystem.Typography.Caption1,
                    color = FutInfoDesignSystem.Colors.SecondaryLabel,
                    modifier = Modifier.padding(top = 4.dp)
                )
            }
        }
        
        // 세로 토너먼트 브라켓
        LazyRow(
            modifier = Modifier.fillMaxSize(),
            contentPadding = PaddingValues(horizontal = 16.dp, vertical = 16.dp),
            horizontalArrangement = Arrangement.spacedBy(24.dp)
        ) {
            itemsIndexed(sortedRounds) { index, round ->
                VerticalBracketColumn(
                    round = round,
                    roundIndex = index,
                    totalRounds = sortedRounds.size,
                    onFixtureClick = onFixtureClick
                )
            }
        }
    }
}

/**
 * 브라켓 연결선 - 라운드들 사이의 연결을 나타냄
 */
@Composable
private fun BracketConnector() {
    Canvas(
        modifier = Modifier
            .width(24.dp)
            .height(200.dp)
    ) {
        val strokeWidth = 3.dp.toPx()
        val color = androidx.compose.ui.graphics.Color(0xFF007AFF) // iOS Blue
        
        // 수평선들 (여러 개의 연결선)
        val lineSpacing = size.height / 4
        repeat(3) { index ->
            val y = lineSpacing * (index + 1)
            drawLine(
                color = color,
                start = androidx.compose.ui.geometry.Offset(0f, y),
                end = androidx.compose.ui.geometry.Offset(size.width, y),
                strokeWidth = strokeWidth
            )
            
            // 화살표 모양 추가
            val arrowSize = 8.dp.toPx()
            drawLine(
                color = color,
                start = androidx.compose.ui.geometry.Offset(size.width - arrowSize, y - arrowSize/2),
                end = androidx.compose.ui.geometry.Offset(size.width, y),
                strokeWidth = strokeWidth
            )
            drawLine(
                color = color,
                start = androidx.compose.ui.geometry.Offset(size.width - arrowSize, y + arrowSize/2),
                end = androidx.compose.ui.geometry.Offset(size.width, y),
                strokeWidth = strokeWidth
            )
        }
    }
}

/**
 * 세로 브라켓 칼럼 - 위/아래로 분할된 토너먼트 구조
 */
@Composable
private fun VerticalBracketColumn(
    round: com.hyunwoopark.futinfo.domain.model.BracketRound,
    roundIndex: Int,
    totalRounds: Int,
    onFixtureClick: (Int) -> Unit
) {
    val fixtures = round.fixtures
    val fixtureCount = fixtures.size
    
    // 경기 수에 따른 간격 계산
    val spacingMultiplier = when (roundIndex) {
        0 -> 1 // 16강: 기본 간격
        1 -> 2 // 8강: 2배 간격
        2 -> 4 // 준결승: 4배 간격
        3 -> 8 // 결승: 8배 간격
        else -> 1
    }
    
    Column(
        modifier = Modifier.width(280.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        // 라운드 헤더
        BracketRoundHeader(round.round)
        
        Spacer(modifier = Modifier.height(16.dp))
        
        // 경기들을 상하로 분할 배치
        when {
            fixtureCount == 1 -> {
                // 결승전은 가운데 배치
                Spacer(modifier = Modifier.height((120 * spacingMultiplier).dp))
                TournamentMatchCard(
                    fixture = fixtures[0],
                    onFixtureClick = { onFixtureClick(fixtures[0].id) }
                )
            }
            fixtureCount == 2 -> {
                // 준결승은 위/아래 배치
                TournamentMatchCard(
                    fixture = fixtures[0],
                    onFixtureClick = { onFixtureClick(fixtures[0].id) }
                )
                Spacer(modifier = Modifier.height((120 * spacingMultiplier).dp))
                TournamentMatchCard(
                    fixture = fixtures[1],
                    onFixtureClick = { onFixtureClick(fixtures[1].id) }
                )
            }
            else -> {
                // 16강, 8강 등: 균등 분할
                val topHalf = fixtures.take(fixtureCount / 2)
                val bottomHalf = fixtures.drop(fixtureCount / 2)
                
                // 상단 경기들
                topHalf.forEach { fixture ->
                    TournamentMatchCard(
                        fixture = fixture,
                        onFixtureClick = { onFixtureClick(fixture.id) }
                    )
                    if (fixture != topHalf.last()) {
                        Spacer(modifier = Modifier.height((16 * spacingMultiplier).dp))
                    }
                }
                
                // 중간 간격
                Spacer(modifier = Modifier.height((40 * spacingMultiplier).dp))
                
                // 하단 경기들
                bottomHalf.forEach { fixture ->
                    TournamentMatchCard(
                        fixture = fixture,
                        onFixtureClick = { onFixtureClick(fixture.id) }
                    )
                    if (fixture != bottomHalf.last()) {
                        Spacer(modifier = Modifier.height((16 * spacingMultiplier).dp))
                    }
                }
            }
        }
    }
}

/**
 * 브라켓 라운드 칼럼 - 세로로 배치된 경기들 (기존 버전 유지)
 */
@Composable
private fun BracketRoundColumn(
    round: com.hyunwoopark.futinfo.domain.model.BracketRound,
    onFixtureClick: (Int) -> Unit
) {
    Column(
        modifier = Modifier.width(280.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // 라운드 헤더
        BracketRoundHeader(round.round)
        
        // 경기들을 세로로 배치
        round.fixtures.forEach { fixture ->
            BracketMatchCard(
                fixture = fixture,
                onFixtureClick = { onFixtureClick(fixture.id) }
            )
        }
    }
}

/**
 * 브라켓 라운드 헤더
 */
@Composable
private fun BracketRoundHeader(roundName: String) {
    Surface(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(12.dp),
        color = FutInfoDesignSystem.Colors.RoyalBlue
    ) {
        Box(
            modifier = Modifier.padding(16.dp),
            contentAlignment = Alignment.Center
        ) {
            Text(
                text = roundName,
                style = FutInfoDesignSystem.Typography.Headline,
                fontWeight = FontWeight.Bold,
                color = Color.White,
                textAlign = TextAlign.Center
            )
        }
    }
}

/**
 * 토너먼트 매치 카드 - 세로 브라켓용 컴팩트 디자인
 */
@Composable
private fun TournamentMatchCard(
    fixture: com.hyunwoopark.futinfo.domain.model.BracketFixture,
    onFixtureClick: () -> Unit
) {
    Surface(
        onClick = onFixtureClick,
        modifier = Modifier
            .fillMaxWidth()
            .height(100.dp),
        shape = RoundedCornerShape(12.dp),
        color = FutInfoDesignSystem.Colors.SystemBackground,
        shadowElevation = 1.dp
    ) {
        Row(
            modifier = Modifier
                .fillMaxSize()
                .padding(12.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            // 홈팀
            Column(
                modifier = Modifier.weight(1f),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                AsyncImage(
                    model = fixture.homeTeam.logo,
                    contentDescription = fixture.homeTeam.name,
                    modifier = Modifier.size(24.dp)
                )
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = fixture.homeTeam.name,
                    style = FutInfoDesignSystem.Typography.Caption2,
                    fontWeight = if (fixture.getWinner()?.id == fixture.homeTeam.id) 
                        FontWeight.Bold 
                    else 
                        FontWeight.Medium,
                    color = if (fixture.getWinner()?.id == fixture.homeTeam.id) 
                        FutInfoDesignSystem.Colors.Label 
                    else 
                        FutInfoDesignSystem.Colors.SecondaryLabel,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                    textAlign = TextAlign.Center
                )
            }
            
            // 스코어 또는 VS
            Column(
                modifier = Modifier.width(40.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                if (fixture.isFinished && fixture.homeScore != null && fixture.awayScore != null) {
                    Text(
                        text = "${fixture.homeScore}",
                        style = FutInfoDesignSystem.Typography.Body,
                        fontWeight = if (fixture.getWinner()?.id == fixture.homeTeam.id) 
                            FontWeight.Bold 
                        else 
                            FontWeight.Medium,
                        color = if (fixture.getWinner()?.id == fixture.homeTeam.id) 
                            FutInfoDesignSystem.Colors.Label 
                        else 
                            FutInfoDesignSystem.Colors.SecondaryLabel
                    )
                    Text(
                        text = "-",
                        style = FutInfoDesignSystem.Typography.Caption2,
                        color = FutInfoDesignSystem.Colors.TertiaryLabel
                    )
                    Text(
                        text = "${fixture.awayScore}",
                        style = FutInfoDesignSystem.Typography.Body,
                        fontWeight = if (fixture.getWinner()?.id == fixture.awayTeam.id) 
                            FontWeight.Bold 
                        else 
                            FontWeight.Medium,
                        color = if (fixture.getWinner()?.id == fixture.awayTeam.id) 
                            FutInfoDesignSystem.Colors.Label 
                        else 
                            FutInfoDesignSystem.Colors.SecondaryLabel
                    )
                } else {
                    when {
                        fixture.isLive -> {
                            Box(
                                modifier = Modifier
                                    .size(6.dp)
                                    .clip(CircleShape)
                                    .background(FutInfoDesignSystem.Colors.SystemRed)
                            )
                            Text(
                                text = "LIVE",
                                style = FutInfoDesignSystem.Typography.Caption2,
                                fontWeight = FontWeight.Bold,
                                color = FutInfoDesignSystem.Colors.SystemRed
                            )
                        }
                        else -> {
                            Text(
                                text = "VS",
                                style = FutInfoDesignSystem.Typography.Caption1,
                                color = FutInfoDesignSystem.Colors.TertiaryLabel
                            )
                        }
                    }
                }
            }
            
            // 원정팀
            Column(
                modifier = Modifier.weight(1f),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                AsyncImage(
                    model = fixture.awayTeam.logo,
                    contentDescription = fixture.awayTeam.name,
                    modifier = Modifier.size(24.dp)
                )
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = fixture.awayTeam.name,
                    style = FutInfoDesignSystem.Typography.Caption2,
                    fontWeight = if (fixture.getWinner()?.id == fixture.awayTeam.id) 
                        FontWeight.Bold 
                    else 
                        FontWeight.Medium,
                    color = if (fixture.getWinner()?.id == fixture.awayTeam.id) 
                        FutInfoDesignSystem.Colors.Label 
                    else 
                        FutInfoDesignSystem.Colors.SecondaryLabel,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                    textAlign = TextAlign.Center
                )
            }
        }
    }
}

/**
 * 브라켓 매치 카드 - 더 컴팩트하고 시각적인 디자인
 */
@Composable
private fun BracketMatchCard(
    fixture: com.hyunwoopark.futinfo.domain.model.BracketFixture,
    onFixtureClick: () -> Unit
) {
    Surface(
        onClick = onFixtureClick,
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(16.dp),
        color = FutInfoDesignSystem.Colors.SystemBackground,
        shadowElevation = 2.dp
    ) {
        Column(
            modifier = Modifier.padding(16.dp)
        ) {
            // 경기 상태 및 날짜
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                // 상태 표시
                BracketMatchStatus(fixture)
                
                // 날짜
                Text(
                    text = fixture.date.substringBefore('T'),
                    style = FutInfoDesignSystem.Typography.Caption2,
                    color = FutInfoDesignSystem.Colors.TertiaryLabel
                )
            }
            
            Spacer(modifier = Modifier.height(12.dp))
            
            // 팀 vs 팀
            Column(
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                // 홈팀
                BracketTeamRow(
                    team = fixture.homeTeam,
                    score = fixture.homeScore,
                    isWinner = fixture.getWinner()?.id == fixture.homeTeam.id,
                    isFinished = fixture.isFinished
                )
                
                // VS 구분선
                Box(
                    modifier = Modifier.fillMaxWidth(),
                    contentAlignment = Alignment.Center
                ) {
                    Divider(
                        modifier = Modifier.fillMaxWidth(),
                        color = FutInfoDesignSystem.Colors.SystemGray5
                    )
                    Surface(
                        modifier = Modifier.padding(horizontal = 8.dp),
                        color = FutInfoDesignSystem.Colors.SystemBackground
                    ) {
                        Text(
                            text = "VS",
                            style = FutInfoDesignSystem.Typography.Caption2,
                            color = FutInfoDesignSystem.Colors.TertiaryLabel,
                            modifier = Modifier.padding(horizontal = 8.dp)
                        )
                    }
                }
                
                // 원정팀
                BracketTeamRow(
                    team = fixture.awayTeam,
                    score = fixture.awayScore,
                    isWinner = fixture.getWinner()?.id == fixture.awayTeam.id,
                    isFinished = fixture.isFinished
                )
            }
        }
    }
}

/**
 * 브라켓 매치 상태 표시
 */
@Composable
private fun BracketMatchStatus(fixture: com.hyunwoopark.futinfo.domain.model.BracketFixture) {
    when {
        fixture.isLive -> {
            Surface(
                shape = RoundedCornerShape(12.dp),
                color = FutInfoDesignSystem.Colors.SystemRed
            ) {
                Row(
                    modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Box(
                        modifier = Modifier
                            .size(6.dp)
                            .clip(CircleShape)
                            .background(Color.White)
                    )
                    Spacer(modifier = Modifier.width(4.dp))
                    Text(
                        text = "LIVE",
                        style = FutInfoDesignSystem.Typography.Caption2,
                        fontWeight = FontWeight.Bold,
                        color = Color.White
                    )
                }
            }
        }
        fixture.isFinished -> {
            Surface(
                shape = RoundedCornerShape(12.dp),
                color = FutInfoDesignSystem.Colors.SystemGreen
            ) {
                Text(
                    text = "완료",
                    style = FutInfoDesignSystem.Typography.Caption2,
                    fontWeight = FontWeight.Medium,
                    color = Color.White,
                    modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                )
            }
        }
        else -> {
            Surface(
                shape = RoundedCornerShape(12.dp),
                color = FutInfoDesignSystem.Colors.SystemGray5
            ) {
                Text(
                    text = "예정",
                    style = FutInfoDesignSystem.Typography.Caption2,
                    fontWeight = FontWeight.Medium,
                    color = FutInfoDesignSystem.Colors.SecondaryLabel,
                    modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                )
            }
        }
    }
}

/**
 * 브라켓 팀 행 - 팀 로고, 이름, 스코어
 */
@Composable
private fun BracketTeamRow(
    team: com.hyunwoopark.futinfo.domain.model.BracketTeam,
    score: Int?,
    isWinner: Boolean,
    isFinished: Boolean
) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        verticalAlignment = Alignment.CenterVertically
    ) {
        // 팀 로고
        Surface(
            modifier = Modifier.size(32.dp),
            shape = CircleShape,
            color = FutInfoDesignSystem.Colors.SystemGray6
        ) {
            AsyncImage(
                model = team.logo,
                contentDescription = team.name,
                modifier = Modifier.padding(4.dp)
            )
        }
        
        Spacer(modifier = Modifier.width(12.dp))
        
        // 팀 이름
        Text(
            text = team.name,
            style = FutInfoDesignSystem.Typography.Body,
            fontWeight = if (isWinner) FontWeight.Bold else FontWeight.Medium,
            color = if (isWinner) FutInfoDesignSystem.Colors.Label else FutInfoDesignSystem.Colors.SecondaryLabel,
            modifier = Modifier.weight(1f),
            maxLines = 1,
            overflow = TextOverflow.Ellipsis
        )
        
        // 스코어
        if (isFinished && score != null) {
            Surface(
                shape = CircleShape,
                color = if (isWinner) FutInfoDesignSystem.Colors.SystemGreen else FutInfoDesignSystem.Colors.SystemGray5
            ) {
                Text(
                    text = score.toString(),
                    style = FutInfoDesignSystem.Typography.Title3,
                    fontWeight = FontWeight.Bold,
                    color = if (isWinner) Color.White else FutInfoDesignSystem.Colors.SecondaryLabel,
                    modifier = Modifier.padding(8.dp)
                )
            }
        }
    }
}


data class TabItem(
    val title: String,
    val icon: ImageVector
)