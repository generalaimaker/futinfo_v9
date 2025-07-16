package com.hyunwoopark.futinfo.presentation.league_detail

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import coil.compose.AsyncImage
import com.hyunwoopark.futinfo.data.remote.dto.FixtureDto
import com.hyunwoopark.futinfo.data.remote.dto.PlayerDto
import com.hyunwoopark.futinfo.data.remote.dto.StandingDto
import com.hyunwoopark.futinfo.data.remote.dto.TeamSeasonStatisticsDto
import com.hyunwoopark.futinfo.presentation.components.*
import com.hyunwoopark.futinfo.presentation.theme.FutInfoDesignSystem
import com.hyunwoopark.futinfo.presentation.theme.getQualificationColor
import com.hyunwoopark.futinfo.presentation.theme.getQualificationDescription
import com.hyunwoopark.futinfo.presentation.league_detail.components.SeasonSelectorDialog

/**
 * iOS 스타일로 완전히 개선된 리그 상세 화면
 * iOS LeagueProfileView.swift와 동일한 디자인 패턴 적용
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun LeagueDetailScreen(
    leagueId: Int,
    leagueName: String,
    onBackClick: () -> Unit = {},
    onTeamClick: (Int) -> Unit = {},
    onFixtureClick: (Int) -> Unit = {},
    onPlayerClick: (Int) -> Unit = {},
    viewModel: LeagueDetailViewModel = hiltViewModel()
) {
    val state by viewModel.state.collectAsStateWithLifecycle()
    val tabs = listOf("순위", "경기", "선수 통계", "팀 통계")
    
    // 리그 데이터 로드
    LaunchedEffect(leagueId) {
        viewModel.loadLeagueData(leagueId)
    }
    
    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text(
                            text = leagueName,
                            style = FutInfoDesignSystem.Typography.Title3,
                            fontWeight = FontWeight.Bold
                        )
                        Text(
                            text = "${state.season}/${(state.season + 1).toString().takeLast(2)}",
                            style = FutInfoDesignSystem.Typography.Caption1,
                            color = FutInfoDesignSystem.Colors.Gray
                        )
                    }
                },
                navigationIcon = {
                    IconButton(onClick = onBackClick) {
                        Icon(
                            imageVector = Icons.Default.ArrowBack,
                            contentDescription = "뒤로가기",
                            tint = FutInfoDesignSystem.Colors.RoyalBlue
                        )
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = FutInfoDesignSystem.Colors.SystemBackground
                )
            )
        }
    ) { paddingValues ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .background(FutInfoDesignSystem.Colors.LightGray),
            contentPadding = PaddingValues(FutInfoDesignSystem.Spacing.Large),
            verticalArrangement = Arrangement.spacedBy(FutInfoDesignSystem.Spacing.SectionSpacing)
        ) {
            // iOS 스타일 리그 헤더
            item {
                IOSStyleHeader(
                    title = leagueName,
                    subtitle = getCountryName(leagueId),
                    countryFlag = getCountryFlag(leagueId),
                    seasonText = "${state.season}/${(state.season + 1).toString().takeLast(2)}",
                    onSeasonClick = { viewModel.showSeasonSelector() }
                )
            }
            
            // iOS 스타일 탭 메뉴
            item {
                IOSStyleTabBar(
                    tabs = tabs,
                    selectedTabIndex = state.selectedTab,
                    onTabSelected = { viewModel.selectTab(it) }
                )
            }
            
            // 탭 컨텐츠
            if (state.selectedTab == 0) {
                // 순위 탭 - iOS StandingsTabView 스타일
                if (state.isStandingsLoading) {
                    items(5) {
                        IOSStyleStandingSkeleton()
                    }
                } else {
                    val standingsError = state.standingsError
                    if (standingsError != null) {
                        item {
                            IOSStyleErrorView(
                                message = standingsError,
                                onRetry = { viewModel.refresh() }
                            )
                        }
                    } else if (state.standings == null || state.standings?.response?.isEmpty() == true) {
                        // 데이터가 없는 경우 (미래 시즌 또는 데이터 없음)
                        item {
                            val currentYear = java.util.Calendar.getInstance().get(java.util.Calendar.YEAR)
                            val currentMonth = java.util.Calendar.getInstance().get(java.util.Calendar.MONTH)
                            val currentSeason = if (currentMonth >= java.util.Calendar.JULY) currentYear else currentYear - 1
                            
                            IOSStyleEmptyState(
                                message = if (state.season > currentSeason) {
                                    "${state.season}/${state.season + 1} 시즌은 아직 시작되지 않았습니다"
                                } else {
                                    "${state.season}/${state.season + 1} 시즌 순위 정보가 없습니다"
                                }
                            )
                        }
                    } else {
                        state.standings?.response?.let { standingsResponse ->
                            standingsResponse.forEach { leagueStanding ->
                                leagueStanding.league.standings?.forEach { standingsList ->
                                    items(standingsList) { standing ->
                                        IOSStyleStandingCard(
                                            standing = standing,
                                            leagueId = leagueId,
                                            onTeamClick = onTeamClick
                                        )
                                    }
                                }
                            }
                        }
                    }
                    
                    // 진출권 범례 (iOS 스타일)
                    if (!state.isStandingsLoading && state.standingsError == null) {
                        item {
                            QualificationLegend(leagueId = leagueId)
                        }
                    }
                }
            } else if (state.selectedTab == 1) {
                // 경기 탭 - iOS LeagueFixturesTabView 스타일
                if (state.isFixturesLoading) {
                    items(5) {
                        IOSStyleFixtureSkeleton()
                    }
                } else {
                    val fixturesError = state.fixturesError
                    if (fixturesError != null) {
                        item {
                            IOSStyleErrorView(
                                message = fixturesError,
                                onRetry = { viewModel.refresh() }
                            )
                        }
                    } else {
                        state.fixtures?.response?.let { fixtures ->
                            if (fixtures.isEmpty()) {
                                item {
                                    IOSStyleEmptyState(message = "경기 정보가 없습니다")
                                }
                            } else {
                                items(fixtures.take(20)) { fixture ->
                                    IOSStyleFixtureCard(
                                        fixture = fixture,
                                        onFixtureClick = onFixtureClick
                                    )
                                }
                            }
                        }
                    }
                }
            } else if (state.selectedTab == 2) {
                // 선수 통계 탭 - iOS PlayerStatsTabView 스타일
                item {
                    IOSStyleSectionHeader(title = "득점 순위")
                }
                
                if (state.isTopScorersLoading) {
                    items(3) {
                        IOSStylePlayerSkeleton()
                    }
                } else {
                    val topScorersError = state.topScorersError
                    if (topScorersError != null) {
                        item {
                            IOSStyleErrorView(
                                message = topScorersError,
                                onRetry = { viewModel.refresh() }
                            )
                        }
                    } else {
                        state.topScorers?.response?.let { players ->
                            items(players.take(10)) { player ->
                                IOSStylePlayerCard(
                                    player = player,
                                    rank = players.indexOf(player) + 1,
                                    statType = "goals",
                                    onPlayerClick = onPlayerClick
                                )
                            }
                        }
                    }
                }
                
                item {
                    Spacer(modifier = Modifier.height(FutInfoDesignSystem.Spacing.Large))
                    IOSStyleSectionHeader(title = "어시스트 순위")
                }
                
                if (state.isTopAssistsLoading) {
                    items(3) {
                        IOSStylePlayerSkeleton()
                    }
                } else {
                    val topAssistsError = state.topAssistsError
                    if (topAssistsError != null) {
                        item {
                            IOSStyleErrorView(
                                message = topAssistsError,
                                onRetry = { viewModel.refresh() }
                            )
                        }
                    } else {
                        state.topAssists?.response?.let { players ->
                            items(players.take(10)) { player ->
                                IOSStylePlayerCard(
                                    player = player,
                                    rank = players.indexOf(player) + 1,
                                    statType = "assists",
                                    onPlayerClick = onPlayerClick
                                )
                            }
                        }
                    }
                }
            } else if (state.selectedTab == 3) {
                // 팀 통계 탭 - iOS TeamStatsTabView 스타일
                if (state.isTeamStatisticsLoading) {
                    items(5) {
                        IOSStyleTeamStatsSkeleton()
                    }
                } else {
                    val teamStatsError = state.teamStatisticsError
                    if (teamStatsError != null) {
                        item {
                            IOSStyleErrorView(
                                message = teamStatsError,
                                onRetry = { viewModel.refresh() }
                            )
                        }
                    } else if (state.teamStatistics.isNullOrEmpty()) {
                        item {
                            IOSStyleEmptyState(message = "팀 통계 정보가 없습니다")
                        }
                    } else {
                        // 팀 통계 타이틀
                        item {
                            IOSStyleSectionHeader(title = "팀별 시즌 통계")
                        }
                        
                        // 팀 통계 목록
                        state.teamStatistics?.let { teamStatsList ->
                            items(teamStatsList) { teamStats ->
                                IOSStyleTeamStatsCard(
                                    teamStats = teamStats.response,
                                    onTeamClick = onTeamClick
                                )
                            }
                        }
                    }
                }
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

// iOS 스타일 컴포넌트들

/**
 * iOS 스타일 순위 카드 컴포넌트
 */
@Composable
private fun IOSStyleStandingCard(
    standing: StandingDto,
    leagueId: Int,
    onTeamClick: (Int) -> Unit
) {
    IOSStyleCard(
        onClick = { onTeamClick(standing.team.id) }
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically
        ) {
            // 진출권 인디케이터
            QualificationIndicator(
                leagueId = leagueId,
                rank = standing.rank
            )
            
            Spacer(modifier = Modifier.width(FutInfoDesignSystem.Spacing.Medium))
            
            // 순위
            Text(
                text = "${standing.rank}",
                style = FutInfoDesignSystem.Typography.Headline,
                fontWeight = FontWeight.Bold,
                color = getQualificationColor(leagueId, standing.rank).takeIf {
                    it != Color.Transparent
                } ?: FutInfoDesignSystem.Colors.DarkGray,
                modifier = Modifier.width(30.dp)
            )
            
            Spacer(modifier = Modifier.width(FutInfoDesignSystem.Spacing.Medium))
            
            // 팀 로고
            AsyncImage(
                model = standing.team.logo,
                contentDescription = standing.team.name,
                modifier = Modifier
                    .size(30.dp)
                    .clip(CircleShape)
            )
            
            Spacer(modifier = Modifier.width(FutInfoDesignSystem.Spacing.Medium))
            
            // 팀명
            Text(
                text = standing.team.name,
                style = FutInfoDesignSystem.Typography.Callout,
                fontWeight = FontWeight.Medium,
                modifier = Modifier.weight(1f),
                maxLines = 1,
                overflow = TextOverflow.Ellipsis
            )
            
            // 경기 수
            Text(
                text = "${standing.all.played}",
                style = FutInfoDesignSystem.Typography.Footnote,
                modifier = Modifier.width(25.dp),
                textAlign = TextAlign.Center
            )
            
            // 승
            Text(
                text = "${standing.all.win}",
                style = FutInfoDesignSystem.Typography.Footnote,
                modifier = Modifier.width(25.dp),
                textAlign = TextAlign.Center
            )
            
            // 무
            Text(
                text = "${standing.all.draw}",
                style = FutInfoDesignSystem.Typography.Footnote,
                modifier = Modifier.width(25.dp),
                textAlign = TextAlign.Center
            )
            
            // 패
            Text(
                text = "${standing.all.lose}",
                style = FutInfoDesignSystem.Typography.Footnote,
                modifier = Modifier.width(25.dp),
                textAlign = TextAlign.Center
            )
            
            // 득실차
            Text(
                text = if (standing.goalsDiff > 0) "+${standing.goalsDiff}" else "${standing.goalsDiff}",
                style = FutInfoDesignSystem.Typography.Footnote,
                color = when {
                    standing.goalsDiff > 0 -> FutInfoDesignSystem.Colors.Green
                    standing.goalsDiff < 0 -> FutInfoDesignSystem.Colors.Red
                    else -> FutInfoDesignSystem.Colors.DarkGray
                },
                modifier = Modifier.width(35.dp),
                textAlign = TextAlign.Center
            )
            
            // 승점
            Text(
                text = "${standing.points}",
                style = FutInfoDesignSystem.Typography.Callout,
                fontWeight = FontWeight.Bold,
                modifier = Modifier.width(35.dp),
                textAlign = TextAlign.Center
            )
        }
    }
}

/**
 * iOS 스타일 경기 카드 컴포넌트
 */
@Composable
private fun IOSStyleFixtureCard(
    fixture: FixtureDto,
    onFixtureClick: (Int) -> Unit
) {
    IOSStyleCard(
        onClick = { onFixtureClick(fixture.fixture.id) }
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceEvenly,
            verticalAlignment = Alignment.CenterVertically
        ) {
            // 홈팀
            Column(
                horizontalAlignment = Alignment.CenterHorizontally,
                modifier = Modifier.weight(1f)
            ) {
                AsyncImage(
                    model = fixture.teams.home.logo,
                    contentDescription = fixture.teams.home.name,
                    modifier = Modifier.size(30.dp)
                )
                Spacer(modifier = Modifier.height(FutInfoDesignSystem.Spacing.ExtraSmall))
                Text(
                    text = fixture.teams.home.name,
                    style = FutInfoDesignSystem.Typography.Caption1,
                    fontWeight = FontWeight.Medium,
                    textAlign = TextAlign.Center,
                    maxLines = 2,
                    overflow = TextOverflow.Ellipsis
                )
            }
            
            // 스코어
            Column(
                horizontalAlignment = Alignment.CenterHorizontally,
                modifier = Modifier.weight(1f)
            ) {
                if (fixture.goals?.home != null && fixture.goals?.away != null) {
                    Text(
                        text = "${fixture.goals.home} - ${fixture.goals.away}",
                        style = FutInfoDesignSystem.Typography.Headline,
                        fontWeight = FontWeight.Bold
                    )
                    Text(
                        text = fixture.fixture.status.short ?: "FT",
                        style = FutInfoDesignSystem.Typography.Caption2,
                        color = FutInfoDesignSystem.Colors.Gray
                    )
                } else {
                    Text(
                        text = "vs",
                        style = FutInfoDesignSystem.Typography.Callout,
                        fontWeight = FontWeight.Bold,
                        color = FutInfoDesignSystem.Colors.Gray
                    )
                    Text(
                        text = fixture.fixture.status.short ?: "예정",
                        style = FutInfoDesignSystem.Typography.Caption2,
                        color = FutInfoDesignSystem.Colors.Gray
                    )
                }
            }
            
            // 어웨이팀
            Column(
                horizontalAlignment = Alignment.CenterHorizontally,
                modifier = Modifier.weight(1f)
            ) {
                AsyncImage(
                    model = fixture.teams.away.logo,
                    contentDescription = fixture.teams.away.name,
                    modifier = Modifier.size(30.dp)
                )
                Spacer(modifier = Modifier.height(FutInfoDesignSystem.Spacing.ExtraSmall))
                Text(
                    text = fixture.teams.away.name,
                    style = FutInfoDesignSystem.Typography.Caption1,
                    fontWeight = FontWeight.Medium,
                    textAlign = TextAlign.Center,
                    maxLines = 2,
                    overflow = TextOverflow.Ellipsis
                )
            }
        }
    }
}

/**
 * iOS 스타일 선수 카드 컴포넌트
 */
@Composable
private fun IOSStylePlayerCard(
    player: PlayerDto,
    rank: Int,
    statType: String,
    onPlayerClick: (Int) -> Unit = {}
) {
    IOSStyleCard(
        onClick = { onPlayerClick(player.player.id ?: 0) }
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically
        ) {
            // 순위
            Text(
                text = "$rank",
                style = FutInfoDesignSystem.Typography.Headline,
                fontWeight = FontWeight.Bold,
                color = if (rank <= 3) FutInfoDesignSystem.Colors.RoyalBlue
                       else FutInfoDesignSystem.Colors.DarkGray,
                modifier = Modifier.width(30.dp)
            )
            
            Spacer(modifier = Modifier.width(FutInfoDesignSystem.Spacing.Medium))
            
            // 선수 사진 (플레이스홀더)
            Box(
                modifier = Modifier
                    .size(40.dp)
                    .clip(CircleShape)
                    .background(FutInfoDesignSystem.Colors.Green),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = (player.player.name ?: "").take(2).uppercase(),
                    color = Color.White,
                    style = FutInfoDesignSystem.Typography.Subhead,
                    fontWeight = FontWeight.Bold
                )
            }
            
            Spacer(modifier = Modifier.width(FutInfoDesignSystem.Spacing.Medium))
            
            // 선수 정보
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = player.player.name ?: "",
                    style = FutInfoDesignSystem.Typography.Callout,
                    fontWeight = FontWeight.Bold,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
                if (player.statistics?.isNotEmpty() == true) {
                    Text(
                        text = player.statistics[0].team?.name ?: "",
                        style = FutInfoDesignSystem.Typography.Footnote,
                        color = FutInfoDesignSystem.Colors.Gray,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                }
            }
            
            // 통계
            if (player.statistics?.isNotEmpty() == true) {
                val stats = player.statistics[0]
                Column(horizontalAlignment = Alignment.End) {
                    when (statType) {
                        "goals" -> {
                            stats.goals?.total?.let { goals ->
                                Text(
                                    text = "골: $goals",
                                    style = FutInfoDesignSystem.Typography.Subhead,
                                    fontWeight = FontWeight.Bold,
                                    color = FutInfoDesignSystem.Colors.RoyalBlue
                                )
                            }
                        }
                        "assists" -> {
                            stats.goals?.assists?.let { assists ->
                                Text(
                                    text = "도움: $assists",
                                    style = FutInfoDesignSystem.Typography.Subhead,
                                    fontWeight = FontWeight.Bold,
                                    color = FutInfoDesignSystem.Colors.RoyalBlue
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
 * 진출권 범례 컴포넌트
 */
@Composable
private fun QualificationLegend(leagueId: Int) {
    IOSStyleCard {
        Column {
            IOSStyleSectionHeader(title = "진출권 정보")
            
            Spacer(modifier = Modifier.height(FutInfoDesignSystem.Spacing.Small))
            
            val qualifications = when (leagueId) {
                2, 3 -> listOf(
                    "16강 직행" to getQualificationColor(leagueId, 1),
                    "16강 플레이오프" to getQualificationColor(leagueId, 9)
                )
                else -> listOf(
                    "챔피언스 리그" to FutInfoDesignSystem.Colors.ChampionsLeague,
                    "유로파 리그" to FutInfoDesignSystem.Colors.EuropaLeague,
                    "컨퍼런스 리그" to FutInfoDesignSystem.Colors.ConferenceLeague,
                    "강등권" to FutInfoDesignSystem.Colors.Relegation
                )
            }
            
            qualifications.forEach { (description, color) ->
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    modifier = Modifier.padding(vertical = FutInfoDesignSystem.Spacing.ExtraSmall)
                ) {
                    Box(
                        modifier = Modifier
                            .size(12.dp)
                            .background(color, CircleShape)
                    )
                    
                    Spacer(modifier = Modifier.width(FutInfoDesignSystem.Spacing.Small))
                    
                    Text(
                        text = description,
                        style = FutInfoDesignSystem.Typography.Caption1,
                        color = FutInfoDesignSystem.Colors.DarkGray
                    )
                }
            }
        }
    }
}

// 스켈레톤 컴포넌트들
@Composable
private fun IOSStyleStandingSkeleton() {
    IOSStyleCard {
        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically
        ) {
            repeat(8) {
                IOSStyleSkeleton(
                    modifier = Modifier
                        .weight(1f)
                        .height(16.dp)
                        .padding(horizontal = 2.dp)
                )
            }
        }
    }
}

@Composable
private fun IOSStyleFixtureSkeleton() {
    IOSStyleCard {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceEvenly
        ) {
            repeat(3) {
                IOSStyleSkeleton(
                    modifier = Modifier
                        .weight(1f)
                        .height(60.dp)
                        .padding(horizontal = 4.dp)
                )
            }
        }
    }
}

@Composable
private fun IOSStylePlayerSkeleton() {
    IOSStyleCard {
        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically
        ) {
            IOSStyleSkeleton(
                modifier = Modifier
                    .size(40.dp)
                    .clip(CircleShape)
            )
            
            Spacer(modifier = Modifier.width(FutInfoDesignSystem.Spacing.Medium))
            
            Column(modifier = Modifier.weight(1f)) {
                IOSStyleSkeleton(
                    modifier = Modifier
                        .fillMaxWidth(0.7f)
                        .height(16.dp)
                )
                Spacer(modifier = Modifier.height(4.dp))
                IOSStyleSkeleton(
                    modifier = Modifier
                        .fillMaxWidth(0.5f)
                        .height(12.dp)
                )
            }
            
            IOSStyleSkeleton(
                modifier = Modifier
                    .width(60.dp)
                    .height(16.dp)
            )
        }
    }
}

/**
 * iOS 스타일 팀 통계 카드 컴포넌트
 */
@Composable
private fun IOSStyleTeamStatsCard(
    teamStats: TeamSeasonStatisticsDto,
    onTeamClick: (Int) -> Unit
) {
    IOSStyleCard(
        onClick = { onTeamClick(teamStats.team.id) }
    ) {
        Column(
            modifier = Modifier.fillMaxWidth()
        ) {
            // 팀 정보 헤더
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(bottom = FutInfoDesignSystem.Spacing.Medium),
                verticalAlignment = Alignment.CenterVertically
            ) {
                // 팀 로고
                AsyncImage(
                    model = teamStats.team.logo,
                    contentDescription = teamStats.team.name,
                    modifier = Modifier
                        .size(40.dp)
                        .clip(CircleShape)
                )
                
                Spacer(modifier = Modifier.width(FutInfoDesignSystem.Spacing.Medium))
                
                // 팀명
                Text(
                    text = teamStats.team.name,
                    style = FutInfoDesignSystem.Typography.Callout,
                    fontWeight = FontWeight.Bold,
                    modifier = Modifier.weight(1f)
                )
            }
            
            // 통계 그리드
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceEvenly
            ) {
                // 경기수
                StatItem(
                    label = "경기",
                    value = teamStats.fixtures?.played?.total?.toString() ?: "0"
                )
                
                // 승
                StatItem(
                    label = "승",
                    value = teamStats.fixtures?.wins?.total?.toString() ?: "0",
                    valueColor = FutInfoDesignSystem.Colors.Green
                )
                
                // 무
                StatItem(
                    label = "무",
                    value = teamStats.fixtures?.draws?.total?.toString() ?: "0",
                    valueColor = FutInfoDesignSystem.Colors.Gray
                )
                
                // 패
                StatItem(
                    label = "패",
                    value = teamStats.fixtures?.loses?.total?.toString() ?: "0",
                    valueColor = FutInfoDesignSystem.Colors.Red
                )
            }
            
            Spacer(modifier = Modifier.height(FutInfoDesignSystem.Spacing.Medium))
            
            // 골 통계
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceEvenly
            ) {
                // 득점
                StatItem(
                    label = "득점",
                    value = teamStats.goals?.goalsFor?.total?.total?.toString() ?: "0"
                )
                
                // 실점
                StatItem(
                    label = "실점",
                    value = teamStats.goals?.against?.total?.total?.toString() ?: "0"
                )
                
                // 평균 득점
                StatItem(
                    label = "평균 듍점",
                    value = teamStats.goals?.goalsFor?.average?.total ?: "0.0"
                )
                
                // 클린시트
                StatItem(
                    label = "클린시트",
                    value = teamStats.cleanSheets?.total?.toString() ?: "0"
                )
            }
            
            // 폼
            if (!teamStats.form.isNullOrEmpty()) {
                Spacer(modifier = Modifier.height(FutInfoDesignSystem.Spacing.Medium))
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.Center
                ) {
                    Text(
                        text = "최근 폼: ",
                        style = FutInfoDesignSystem.Typography.Caption1,
                        color = FutInfoDesignSystem.Colors.Gray
                    )
                    teamStats.form.takeLast(5).forEach { result ->
                        Box(
                            modifier = Modifier
                                .padding(horizontal = 2.dp)
                                .size(20.dp)
                                .background(
                                    color = when (result) {
                                        'W' -> FutInfoDesignSystem.Colors.Green
                                        'D' -> FutInfoDesignSystem.Colors.Gray
                                        'L' -> FutInfoDesignSystem.Colors.Red
                                        else -> Color.Transparent
                                    },
                                    shape = CircleShape
                                ),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                text = result.toString(),
                                style = FutInfoDesignSystem.Typography.Caption2,
                                color = Color.White,
                                fontWeight = FontWeight.Bold
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun StatItem(
    label: String,
    value: String,
    valueColor: Color = FutInfoDesignSystem.Colors.DarkGray
) {
    Column(
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Text(
            text = label,
            style = FutInfoDesignSystem.Typography.Caption2,
            color = FutInfoDesignSystem.Colors.Gray
        )
        Spacer(modifier = Modifier.height(4.dp))
        Text(
            text = value,
            style = FutInfoDesignSystem.Typography.Callout,
            fontWeight = FontWeight.Bold,
            color = valueColor
        )
    }
}

@Composable
private fun IOSStyleTeamStatsSkeleton() {
    IOSStyleCard {
        Column(
            modifier = Modifier.fillMaxWidth()
        ) {
            // 팀 정보 헤더 스켈레톤
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(bottom = FutInfoDesignSystem.Spacing.Medium),
                verticalAlignment = Alignment.CenterVertically
            ) {
                IOSStyleSkeleton(
                    modifier = Modifier
                        .size(40.dp)
                        .clip(CircleShape)
                )
                Spacer(modifier = Modifier.width(FutInfoDesignSystem.Spacing.Medium))
                IOSStyleSkeleton(
                    modifier = Modifier
                        .width(150.dp)
                        .height(16.dp)
                )
            }
            
            // 통계 스켈레톤
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceEvenly
            ) {
                repeat(4) {
                    Column(
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        IOSStyleSkeleton(
                            modifier = Modifier
                                .width(40.dp)
                                .height(12.dp)
                        )
                        Spacer(modifier = Modifier.height(4.dp))
                        IOSStyleSkeleton(
                            modifier = Modifier
                                .width(30.dp)
                                .height(16.dp)
                        )
                    }
                }
            }
        }
    }
}

// 헬퍼 함수들
private fun getCountryName(leagueId: Int): String {
    return when (leagueId) {
        39 -> "England"
        140 -> "Spain"
        78 -> "Germany"
        135 -> "Italy"
        61 -> "France"
        2, 3 -> "UEFA"
        else -> "International"
    }
}

private fun getCountryFlag(leagueId: Int): String {
    return when (leagueId) {
        39 -> "🏴󠁧󠁢󠁥󠁮󠁧󠁿"
        140 -> "🇪🇸"
        78 -> "🇩🇪"
        135 -> "🇮🇹"
        61 -> "🇫🇷"
        2, 3 -> "🇪🇺"
        else -> "🌍"
    }
}

/**
 * 경기 카드 컴포넌트
 */
@Composable
private fun MatchCard(match: SampleMatch) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        shape = RoundedCornerShape(12.dp),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            // 홈팀
            Column(
                horizontalAlignment = Alignment.CenterHorizontally,
                modifier = Modifier.weight(1f)
            ) {
                Box(
                    modifier = Modifier
                        .size(30.dp)
                        .clip(CircleShape)
                        .background(Color(0xFF1976D2)),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = match.homeTeam.take(2),
                        color = Color.White,
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Bold
                    )
                }
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = match.homeTeam,
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Medium
                )
            }
            
            // 스코어
            Column(
                horizontalAlignment = Alignment.CenterHorizontally,
                modifier = Modifier.weight(1f)
            ) {
                Text(
                    text = "${match.homeScore} - ${match.awayScore}",
                    fontSize = 18.sp,
                    fontWeight = FontWeight.Bold
                )
                Text(
                    text = "FT",
                    fontSize = 12.sp,
                    color = Color.Gray
                )
            }
            
            // 어웨이팀
            Column(
                horizontalAlignment = Alignment.CenterHorizontally,
                modifier = Modifier.weight(1f)
            ) {
                Box(
                    modifier = Modifier
                        .size(30.dp)
                        .clip(CircleShape)
                        .background(Color(0xFFD32F2F)),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = match.awayTeam.take(2),
                        color = Color.White,
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Bold
                    )
                }
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = match.awayTeam,
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Medium
                )
            }
        }
    }
}

/**
 * 샘플 경기 데이터
 */
data class SampleMatch(
    val homeTeam: String,
    val awayTeam: String,
    val homeScore: Int,
    val awayScore: Int
)

private fun getSampleMatches(): List<SampleMatch> {
    return listOf(
        SampleMatch("Manchester City", "Arsenal", 2, 1),
        SampleMatch("Liverpool", "Chelsea", 3, 0),
        SampleMatch("Tottenham", "Manchester United", 1, 2),
        SampleMatch("Newcastle", "Brighton", 2, 2),
        SampleMatch("Aston Villa", "West Ham", 1, 0)
    )
}

/**
 * 에러 메시지 컴포넌트
 */
@Composable
private fun ErrorMessage(
    message: String,
    onRetry: () -> Unit
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        shape = RoundedCornerShape(12.dp),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text(
                text = message,
                style = MaterialTheme.typography.bodyMedium,
                color = Color.Red,
                textAlign = TextAlign.Center
            )
            Spacer(modifier = Modifier.height(8.dp))
            Button(
                onClick = onRetry,
                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF007AFF))
            ) {
                Text("다시 시도", color = Color.White)
            }
        }
    }
}

/**
 * 순위 카드 컴포넌트
 */
@Composable
private fun StandingCard(standing: StandingDto) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        shape = RoundedCornerShape(12.dp),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            // 순위
            Text(
                text = "${standing.rank}",
                fontWeight = FontWeight.Bold,
                fontSize = 16.sp,
                modifier = Modifier.width(30.dp)
            )
            
            Spacer(modifier = Modifier.width(12.dp))
            
            // 팀 로고
            Box(
                modifier = Modifier
                    .size(30.dp)
                    .clip(CircleShape)
                    .background(Color(0xFF1976D2)),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = standing.team.name.take(2),
                    color = Color.White,
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Bold
                )
            }
            
            Spacer(modifier = Modifier.width(12.dp))
            
            // 팀명
            Text(
                text = standing.team.name,
                fontWeight = FontWeight.Medium,
                modifier = Modifier.weight(1f)
            )
            
            // 승점
            Text(
                text = "${standing.points}",
                fontWeight = FontWeight.Bold,
                fontSize = 16.sp
            )
        }
    }
}

/**
 * 경기 카드 컴포넌트 (실제 데이터용)
 */
@Composable
private fun FixtureCard(fixture: FixtureDto) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        shape = RoundedCornerShape(12.dp),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            // 홈팀
            Column(
                horizontalAlignment = Alignment.CenterHorizontally,
                modifier = Modifier.weight(1f)
            ) {
                AsyncImage(
                    model = fixture.teams.home.logo,
                    contentDescription = fixture.teams.home.name,
                    modifier = Modifier.size(30.dp)
                )
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = fixture.teams.home.name,
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Medium,
                    textAlign = TextAlign.Center
                )
            }
            
            // 스코어
            Column(
                horizontalAlignment = Alignment.CenterHorizontally,
                modifier = Modifier.weight(1f)
            ) {
                if (fixture.goals?.home != null && fixture.goals?.away != null) {
                    Text(
                        text = "${fixture.goals?.home} - ${fixture.goals?.away}",
                        fontSize = 18.sp,
                        fontWeight = FontWeight.Bold
                    )
                    Text(
                        text = fixture.fixture.status.short ?: "FT",
                        fontSize = 12.sp,
                        color = Color.Gray
                    )
                } else {
                    Text(
                        text = "vs",
                        fontSize = 16.sp,
                        fontWeight = FontWeight.Bold,
                        color = Color.Gray
                    )
                    Text(
                        text = fixture.fixture.status.short ?: "예정",
                        fontSize = 12.sp,
                        color = Color.Gray
                    )
                }
            }
            
            // 어웨이팀
            Column(
                horizontalAlignment = Alignment.CenterHorizontally,
                modifier = Modifier.weight(1f)
            ) {
                AsyncImage(
                    model = fixture.teams.away.logo,
                    contentDescription = fixture.teams.away.name,
                    modifier = Modifier.size(30.dp)
                )
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = fixture.teams.away.name,
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Medium,
                    textAlign = TextAlign.Center
                )
            }
        }
    }
}

/**
 * 선수 카드 컴포넌트
 */
@Composable
private fun PlayerCard(player: PlayerDto) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        shape = RoundedCornerShape(12.dp),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            // 선수 사진 (임시)
            Box(
                modifier = Modifier
                    .size(40.dp)
                    .clip(CircleShape)
                    .background(Color(0xFF4CAF50)),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = (player.player.name ?: "").take(2),
                    color = Color.White,
                    fontSize = 14.sp,
                    fontWeight = FontWeight.Bold
                )
            }
            
            Spacer(modifier = Modifier.width(12.dp))
            
            // 선수 정보
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = player.player.name ?: "",
                    fontWeight = FontWeight.Bold,
                    fontSize = 16.sp
                )
                if (player.statistics?.isNotEmpty() == true) {
                    Text(
                        text = player.statistics[0].team?.name ?: "",
                        fontSize = 14.sp,
                        color = Color.Gray
                    )
                }
            }
            
            // 통계
            if (player.statistics?.isNotEmpty() == true) {
                val stats = player.statistics[0]
                Column(horizontalAlignment = Alignment.End) {
                    stats.goals?.total?.let { goals ->
                        Text(
                            text = "골: $goals",
                            fontWeight = FontWeight.Bold,
                            fontSize = 14.sp
                        )
                    }
                    stats.goals?.assists?.let { assists ->
                        Text(
                            text = "도움: $assists",
                            fontSize = 12.sp,
                            color = Color.Gray
                        )
                    }
                }
            }
        }
    }
}