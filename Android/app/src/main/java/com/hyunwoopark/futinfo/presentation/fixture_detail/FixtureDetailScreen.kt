package com.hyunwoopark.futinfo.presentation.fixture_detail

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Refresh
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
import com.hyunwoopark.futinfo.presentation.fixture_detail.tabs.*
import com.hyunwoopark.futinfo.presentation.components.*
import com.hyunwoopark.futinfo.presentation.theme.FutInfoDesignSystem
import com.hyunwoopark.futinfo.util.LeagueNameLocalizer

/**
 * iOS FixtureDetailView.swift를 기반으로 완전히 개선된 경기 상세 화면
 *
 * 주요 개선사항:
 * - iOS 스타일 디자인 시스템 적용
 * - 동적 탭 구조: 경기 상태에 따라 탭 메뉴 변경
 * - iOS 스타일 헤더 및 탭 디자인
 * - 향상된 스켈레톤 UI 및 에러 처리
 * - iOS 스타일 색상 팔레트 및 타이포그래피
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun FixtureDetailScreen(
    fixtureId: Int,
    viewModel: FixtureDetailViewModel = hiltViewModel(),
    onBackClick: () -> Unit = {},
    onTeamClick: (Int) -> Unit = {}
) {
    val state by viewModel.state.collectAsStateWithLifecycle()
    val selectedTabIndex by viewModel.selectedTabIndex.collectAsStateWithLifecycle()
    val tabLoadingStates by viewModel.tabLoadingStates.collectAsStateWithLifecycle()
    val standingsState by viewModel.standingsState.collectAsStateWithLifecycle()
    
    // 경기 데이터 로드
    LaunchedEffect(fixtureId) {
        viewModel.loadFixtureDetail(fixtureId)
    }
    
    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Text(
                        text = "경기 상세",
                        style = FutInfoDesignSystem.Typography.Title3,
                        fontWeight = FontWeight.Bold
                    )
                },
                navigationIcon = {
                    IconButton(onClick = onBackClick) {
                        Icon(
                            imageVector = Icons.Default.ArrowBack,
                            contentDescription = "뒤로 가기",
                            tint = FutInfoDesignSystem.Colors.RoyalBlue
                        )
                    }
                },
                actions = {
                    IconButton(onClick = { viewModel.refreshFixtureDetail() }) {
                        Icon(
                            imageVector = Icons.Default.Refresh,
                            contentDescription = "새로고침",
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
        when (val currentState = state) {
            is FixtureDetailState.Loading -> {
                IOSStyleFixtureDetailSkeleton(
                    modifier = Modifier.padding(paddingValues)
                )
            }
            
            is FixtureDetailState.Error -> {
                IOSStyleErrorView(
                    message = currentState.message,
                    onRetry = { viewModel.refreshFixtureDetail() }
                )
            }
            
            is FixtureDetailState.Success -> {
                IOSStyleFixtureDetailContent(
                    data = currentState.data,
                    selectedTabIndex = selectedTabIndex,
                    tabLoadingStates = tabLoadingStates,
                    standingsState = standingsState,
                    onTabSelected = { viewModel.selectTab(it) },
                    onTeamClick = onTeamClick,
                    viewModel = viewModel,
                    modifier = Modifier.padding(paddingValues)
                )
            }
        }
    }
}

@Composable
private fun FixtureDetailContent(
    data: com.hyunwoopark.futinfo.domain.model.FixtureDetailBundle,
    selectedTabIndex: Int,
    tabLoadingStates: Map<Int, Boolean>,
    standingsState: com.hyunwoopark.futinfo.util.Resource<com.hyunwoopark.futinfo.data.remote.dto.StandingsResponseDto>?,
    onTabSelected: (Int) -> Unit,
    onTeamClick: (Int) -> Unit,
    viewModel: FixtureDetailViewModel
) {
    Column(
        modifier = Modifier.fillMaxSize()
    ) {
        // 경기 헤더 정보
        data.fixture?.let { fixture ->
            IOSStyleFixtureHeader(
                fixture = fixture,
                onTeamClick = onTeamClick,
                modifier = Modifier.padding(16.dp)
            )
        }
        
        // 동적 탭 바
        data.fixture?.let { fixture ->
            val tabs = viewModel.getTabsForFixture(fixture)
            
            DynamicTabRow(
                tabs = tabs,
                selectedTabIndex = selectedTabIndex,
                tabLoadingStates = tabLoadingStates,
                onTabSelected = onTabSelected
            )
            
            // 탭 컨텐츠
            TabContent(
                tabs = tabs,
                selectedTabIndex = selectedTabIndex,
                data = data,
                fixture = fixture,
                standingsState = standingsState,
                isLoading = tabLoadingStates[selectedTabIndex] == true
            )
        }
    }
}

@Composable
private fun DynamicTabRow(
    tabs: List<String>,
    selectedTabIndex: Int,
    tabLoadingStates: Map<Int, Boolean>,
    onTabSelected: (Int) -> Unit
) {
    ScrollableTabRow(
        selectedTabIndex = selectedTabIndex,
        modifier = Modifier.fillMaxWidth(),
        containerColor = FutInfoDesignSystem.Colors.SystemBackground,
        contentColor = FutInfoDesignSystem.Colors.Label,
        indicator = { tabPositions ->
            if (selectedTabIndex < tabPositions.size) {
                TabRowDefaults.Indicator(
                    color = FutInfoDesignSystem.Colors.RoyalBlue
                )
            }
        },
        edgePadding = 0.dp
    ) {
        tabs.forEachIndexed { index, title ->
            Tab(
                selected = selectedTabIndex == index,
                onClick = { onTabSelected(index) },
                selectedContentColor = FutInfoDesignSystem.Colors.RoyalBlue,
                unselectedContentColor = FutInfoDesignSystem.Colors.SecondaryLabel,
                text = {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Text(
                            text = title,
                            fontWeight = if (selectedTabIndex == index)
                                FontWeight.Bold else FontWeight.Normal
                        )

                        // 개별 탭 로딩 인디케이터
                        if (tabLoadingStates[index] == true) {
                            CircularProgressIndicator(
                                modifier = Modifier.size(12.dp),
                                strokeWidth = 2.dp,
                                color = FutInfoDesignSystem.Colors.RoyalBlue
                            )
                        }
                    }
                }
            )
        }
    }
}

@Composable
private fun TabContent(
    tabs: List<String>,
    selectedTabIndex: Int,
    data: com.hyunwoopark.futinfo.domain.model.FixtureDetailBundle,
    fixture: com.hyunwoopark.futinfo.data.remote.dto.FixtureDto,
    standingsState: com.hyunwoopark.futinfo.util.Resource<com.hyunwoopark.futinfo.data.remote.dto.StandingsResponseDto>?,
    isLoading: Boolean
) {
    if (selectedTabIndex >= tabs.size) return
    
    val tabName = tabs[selectedTabIndex]
    
    Box(modifier = Modifier.fillMaxSize()) {
        when (tabName) {
            "경기요약" -> MatchSummaryScreen(
                data = data,
                isLoading = isLoading
            )
            "통계" -> StatisticsScreen(
                data = data,
                isLoading = isLoading
            )
            "라인업" -> LineupsScreen(
                data = data,
                isLoading = isLoading
            )
            "정보" -> MatchInfoScreen(
                fixture = fixture,
                isLoading = isLoading
            )
            "부상" -> InjuriesTab(fixture = fixture, isLoading = isLoading)
            "순위" -> StandingsScreen(
                standingsState = standingsState
            )
            "상대전적" -> HeadToHeadScreen(
                fixture = fixture,
                isLoading = isLoading
            )
        }
    }
}

/**
 * iOS 스타일 경기 헤더
 */
@Composable
private fun IOSStyleFixtureHeader(
    fixture: com.hyunwoopark.futinfo.data.remote.dto.FixtureDto,
    onTeamClick: (Int) -> Unit,
    modifier: Modifier = Modifier
) {
    IOSStyleCard(
        modifier = modifier.fillMaxWidth()
    ) {
        Column(
            modifier = Modifier.padding(FutInfoDesignSystem.Spacing.Large),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            // 리그 정보
            Text(
                text = LeagueNameLocalizer.getLocalizedName(fixture.league.id, fixture.league.name),
                style = FutInfoDesignSystem.Typography.Caption1,
                color = FutInfoDesignSystem.Colors.SecondaryLabel,
                textAlign = TextAlign.Center
            )
            
            Spacer(modifier = Modifier.height(FutInfoDesignSystem.Spacing.XSmall))
            
            // 경기 날짜/시간
            Text(
                text = formatFixtureDateTime(fixture.fixture.date),
                style = FutInfoDesignSystem.Typography.Caption2,
                color = FutInfoDesignSystem.Colors.TertiaryLabel,
                textAlign = TextAlign.Center
            )
            
            Spacer(modifier = Modifier.height(FutInfoDesignSystem.Spacing.Large))
            
            // 팀 정보 및 스코어
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceEvenly,
                verticalAlignment = Alignment.CenterVertically
            ) {
                // 홈팀
                IOSStyleTeamSection(
                    team = fixture.teams.home,
                    onClick = { onTeamClick(fixture.teams.home.id) },
                    modifier = Modifier.weight(1f)
                )
                
                // iOS 스타일 스코어
                IOSStyleScoreSection(
                    homeGoals = fixture.goals?.home,
                    awayGoals = fixture.goals?.away,
                    status = fixture.fixture.status,
                    modifier = Modifier.weight(1f)
                )
                
                // 원정팀
                IOSStyleTeamSection(
                    team = fixture.teams.away,
                    onClick = { onTeamClick(fixture.teams.away.id) },
                    modifier = Modifier.weight(1f)
                )
            }
        }
    }
}

/**
 * iOS 스타일 팀 섹션
 */
@Composable
private fun IOSStyleTeamSection(
    team: com.hyunwoopark.futinfo.data.remote.dto.TeamFixtureDto,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        modifier = modifier
            .clickable { onClick() }
            .padding(FutInfoDesignSystem.Spacing.Small)
    ) {
        // iOS 스타일 팀 로고
        Box(
            modifier = Modifier
                .size(64.dp)
                .clip(CircleShape)
                .background(FutInfoDesignSystem.Colors.SystemGray6),
            contentAlignment = Alignment.Center
        ) {
            Text(
                text = team.name.take(3).uppercase(),
                style = FutInfoDesignSystem.Typography.Title3,
                fontWeight = FontWeight.Bold,
                color = FutInfoDesignSystem.Colors.RoyalBlue
            )
        }
        
        Spacer(modifier = Modifier.height(FutInfoDesignSystem.Spacing.Small))
        
        Text(
            text = team.name,
            style = FutInfoDesignSystem.Typography.Body,
            fontWeight = FontWeight.Medium,
            textAlign = TextAlign.Center,
            maxLines = 2,
            overflow = TextOverflow.Ellipsis,
            color = FutInfoDesignSystem.Colors.Label
        )
    }
}

/**
 * iOS 스타일 스코어 섹션
 */
@Composable
private fun IOSStyleScoreSection(
    homeGoals: Int?,
    awayGoals: Int?,
    status: com.hyunwoopark.futinfo.data.remote.dto.FixtureStatusDto,
    modifier: Modifier = Modifier
) {
    Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        modifier = modifier.padding(horizontal = FutInfoDesignSystem.Spacing.Medium)
    ) {
        when (status.short) {
            "NS" -> {
                Text(
                    text = "VS",
                    style = FutInfoDesignSystem.Typography.LargeTitle,
                    fontWeight = FontWeight.Bold,
                    color = FutInfoDesignSystem.Colors.RoyalBlue
                )
            }
            "FT", "AET", "PEN" -> {
                Text(
                    text = "${homeGoals ?: 0} - ${awayGoals ?: 0}",
                    style = FutInfoDesignSystem.Typography.LargeTitle,
                    fontWeight = FontWeight.Bold,
                    color = FutInfoDesignSystem.Colors.Label
                )
                Text(
                    text = "종료",
                    style = FutInfoDesignSystem.Typography.Caption1,
                    color = FutInfoDesignSystem.Colors.SecondaryLabel
                )
            }
            else -> {
                Text(
                    text = "${homeGoals ?: 0} - ${awayGoals ?: 0}",
                    style = FutInfoDesignSystem.Typography.LargeTitle,
                    fontWeight = FontWeight.Bold,
                    color = FutInfoDesignSystem.Colors.SystemRed
                )
                if (status.elapsed != null) {
                    Text(
                        text = "${status.elapsed}'",
                        style = FutInfoDesignSystem.Typography.Caption1,
                        color = FutInfoDesignSystem.Colors.SystemRed
                    )
                }
            }
        }
    }
}

@Composable
private fun MatchMetadata(
    fixture: com.hyunwoopark.futinfo.data.remote.dto.FixtureDto
) {
    Column(
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Text(
            text = LeagueNameLocalizer.getLocalizedName(fixture.league.id, fixture.league.name),
            style = MaterialTheme.typography.bodyMedium,
            fontWeight = FontWeight.SemiBold,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
        
        Text(
            text = fixture.league.round,
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
        
        Text(
            text = fixture.fixture.date,
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
    }
}

// 임시 탭들 (아직 전용 화면이 없는 탭들)

@Composable
private fun InjuriesTab(
    fixture: com.hyunwoopark.futinfo.data.remote.dto.FixtureDto,
    isLoading: Boolean
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        verticalArrangement = Arrangement.Center,
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Text(
            text = "부상 정보",
            style = MaterialTheme.typography.titleMedium,
            fontWeight = FontWeight.Bold
        )
        Spacer(modifier = Modifier.height(8.dp))
        Text(
            text = "곧 제공될 예정입니다",
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
    }
}



// 공통 컴포넌트들
@Composable
private fun EventItem(
    event: com.hyunwoopark.futinfo.data.remote.dto.FixtureEventDto
) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(
            text = "${event.time.elapsed}'",
            style = MaterialTheme.typography.bodySmall,
            fontWeight = FontWeight.Bold,
            color = MaterialTheme.colorScheme.primary
        )
        
        Text(
            text = "${event.type} - ${event.detail}",
            style = MaterialTheme.typography.bodyMedium,
            modifier = Modifier.weight(1f).padding(horizontal = 8.dp)
        )
        
        Text(
            text = event.player.name ?: "",
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
    }
}

@Composable
private fun PlayerItem(
    player: com.hyunwoopark.futinfo.data.remote.dto.LineupPlayerDto
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 4.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(
            text = "${player.player.number}",
            style = MaterialTheme.typography.bodySmall,
            fontWeight = FontWeight.Bold,
            color = MaterialTheme.colorScheme.primary,
            modifier = Modifier.width(30.dp)
        )
        
        Text(
            text = player.player.name ?: "Unknown",
            style = MaterialTheme.typography.bodyMedium,
            modifier = Modifier.weight(1f)
        )
        
        Text(
            text = player.player.pos ?: "",
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
    }
}

@Composable
private fun StatisticItem(
    type: String,
    homeValue: String,
    awayValue: String
) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(
            text = homeValue,
            style = MaterialTheme.typography.bodyMedium,
            fontWeight = FontWeight.SemiBold,
            modifier = Modifier.weight(1f),
            textAlign = TextAlign.Start
        )
        
        Text(
            text = type,
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            modifier = Modifier.weight(1f),
            textAlign = TextAlign.Center
        )
        
        Text(
            text = awayValue,
            style = MaterialTheme.typography.bodyMedium,
            fontWeight = FontWeight.SemiBold,
            modifier = Modifier.weight(1f),
            textAlign = TextAlign.End
        )
    }
}

@Composable
private fun InfoRow(
    label: String,
    value: String
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 4.dp),
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Text(
            text = label,
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
        Text(
            text = value,
            style = MaterialTheme.typography.bodyMedium,
            fontWeight = FontWeight.SemiBold
        )
    }
}

@Composable
private fun EmptyStateCard(message: String) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .padding(32.dp),
            contentAlignment = Alignment.Center
        ) {
            Text(
                text = message,
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                textAlign = TextAlign.Center
            )
        }
    }
}

@Composable
private fun ErrorContent(
    message: String,
    onRetry: () -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        verticalArrangement = Arrangement.Center,
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Text(
            text = message,
            color = MaterialTheme.colorScheme.error,
            textAlign = TextAlign.Center,
            style = MaterialTheme.typography.bodyLarge
        )
        
        Spacer(modifier = Modifier.height(16.dp))
        
        Button(
            onClick = onRetry,
            modifier = Modifier.padding(top = 16.dp)
        ) {
            Text("다시 시도")
        }
    }
}

// 스켈레톤 UI 컴포넌트들
@Composable
private fun FixtureDetailSkeleton() {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp)
    ) {
        // 헤더 스켈레톤
        Card(
            modifier = Modifier.fillMaxWidth(),
            elevation = CardDefaults.cardElevation(defaultElevation = 4.dp),
            shape = RoundedCornerShape(16.dp)
        ) {
            Column(
                modifier = Modifier.padding(16.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                // 상태 배지 스켈레톤
                Box(
                    modifier = Modifier
                        .width(80.dp)
                        .height(24.dp)
                        .background(
                            MaterialTheme.colorScheme.outline.copy(alpha = 0.3f),
                            RoundedCornerShape(12.dp)
                        )
                )
                
                Spacer(modifier = Modifier.height(16.dp))
                
                // 팀 정보 스켈레톤
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceEvenly
                ) {
                    repeat(3) {
                        Box(
                            modifier = Modifier
                                .weight(1f)
                                .height(60.dp)
                                .background(
                                    MaterialTheme.colorScheme.outline.copy(alpha = 0.3f),
                                    RoundedCornerShape(8.dp)
                                )
                        )
                    }
                }
                
                Spacer(modifier = Modifier.height(16.dp))
                
                // 메타데이터 스켈레톤
                repeat(3) {
                    Box(
                        modifier = Modifier
                            .width(120.dp)
                            .height(16.dp)
                            .background(
                                MaterialTheme.colorScheme.outline.copy(alpha = 0.3f),
                                RoundedCornerShape(4.dp)
                            )
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                }
            }
        }
        
        Spacer(modifier = Modifier.height(16.dp))
        
        // 탭 스켈레톤
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            repeat(4) {
                Box(
                    modifier = Modifier
                        .weight(1f)
                        .height(48.dp)
                        .background(
                            MaterialTheme.colorScheme.outline.copy(alpha = 0.3f),
                            RoundedCornerShape(8.dp)
                        )
                )
            }
        }
        
        Spacer(modifier = Modifier.height(16.dp))
        
        // 컨텐츠 스켈레톤
        repeat(5) {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(60.dp)
                    .background(
                        MaterialTheme.colorScheme.outline.copy(alpha = 0.3f),
                        RoundedCornerShape(8.dp)
                    )
            )
            Spacer(modifier = Modifier.height(8.dp))
        }
    }
}

@Composable
private fun EventItemSkeleton() {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Box(
            modifier = Modifier
                .width(30.dp)
                .height(16.dp)
                .background(
                    MaterialTheme.colorScheme.outline.copy(alpha = 0.3f),
                    RoundedCornerShape(4.dp)
                )
        )
        
        Box(
            modifier = Modifier
                .weight(1f)
                .height(16.dp)
                .padding(horizontal = 8.dp)
                .background(
                    MaterialTheme.colorScheme.outline.copy(alpha = 0.3f),
                    RoundedCornerShape(4.dp)
                )
        )
        
        Box(
            modifier = Modifier
                .width(80.dp)
                .height(16.dp)
                .background(
                    MaterialTheme.colorScheme.outline.copy(alpha = 0.3f),
                    RoundedCornerShape(4.dp)
                )
        )
    }
}

@Composable
private fun StatisticsSkeleton() {
    Card(
        modifier = Modifier.fillMaxWidth(),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Column(
            modifier = Modifier.padding(16.dp)
        ) {
            Box(
                modifier = Modifier
                    .width(100.dp)
                    .height(20.dp)
                    .background(
                        MaterialTheme.colorScheme.outline.copy(alpha = 0.3f),
                        RoundedCornerShape(4.dp)
                    )
            )
            
            Spacer(modifier = Modifier.height(16.dp))
            
            // 헤더 스켈레톤
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                repeat(3) {
                    Box(
                        modifier = Modifier
                            .weight(1f)
                            .height(16.dp)
                            .background(
                                MaterialTheme.colorScheme.outline.copy(alpha = 0.3f),
                                RoundedCornerShape(4.dp)
                            )
                    )
                }
            }
            
            Spacer(modifier = Modifier.height(16.dp))
            
            // 통계 항목 스켈레톤
            repeat(8) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    repeat(3) {
                        Box(
                            modifier = Modifier
                                .weight(1f)
                                .height(16.dp)
                                .background(
                                    MaterialTheme.colorScheme.outline.copy(alpha = 0.3f),
                                    RoundedCornerShape(4.dp)
                                )
                        )
                    }
                }
                Spacer(modifier = Modifier.height(8.dp))
            }
        }
    }
}

@Composable
private fun LineupSkeleton() {
    Card(
        modifier = Modifier.fillMaxWidth(),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Column(
            modifier = Modifier.padding(16.dp)
        ) {
            // 팀 이름 스켈레톤
            Box(
                modifier = Modifier
                    .width(150.dp)
                    .height(20.dp)
                    .background(
                        MaterialTheme.colorScheme.outline.copy(alpha = 0.3f),
                        RoundedCornerShape(4.dp)
                    )
            )
            
            Spacer(modifier = Modifier.height(16.dp))
            
            // 선발 라인업 제목 스켈레톤
            Box(
                modifier = Modifier
                    .width(80.dp)
                    .height(16.dp)
                    .background(
                        MaterialTheme.colorScheme.outline.copy(alpha = 0.3f),
                        RoundedCornerShape(4.dp)
                    )
            )
            
            Spacer(modifier = Modifier.height(8.dp))
            
            // 선수 목록 스켈레톤
            repeat(11) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = 4.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Box(
                        modifier = Modifier
                            .width(30.dp)
                            .height(16.dp)
                            .background(
                                MaterialTheme.colorScheme.outline.copy(alpha = 0.3f),
                                RoundedCornerShape(4.dp)
                            )
                    )
                    
                    Spacer(modifier = Modifier.width(8.dp))
                    
                    Box(
                        modifier = Modifier
                            .weight(1f)
                            .height(16.dp)
                            .background(
                                MaterialTheme.colorScheme.outline.copy(alpha = 0.3f),
                                RoundedCornerShape(4.dp)
                            )
                    )
                    
                    Box(
                        modifier = Modifier
                            .width(40.dp)
                            .height(16.dp)
                            .background(
                                MaterialTheme.colorScheme.outline.copy(alpha = 0.3f),
                                RoundedCornerShape(4.dp)
                            )
                    )
                }
            }
        }
    }
}

@Composable
private fun MatchInfoSkeleton() {
    Card(
        modifier = Modifier.fillMaxWidth(),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Column(
            modifier = Modifier.padding(16.dp)
        ) {
            Box(
                modifier = Modifier
                    .width(100.dp)
                    .height(20.dp)
                    .background(
                        MaterialTheme.colorScheme.outline.copy(alpha = 0.3f),
                        RoundedCornerShape(4.dp)
                    )
            )
            
            Spacer(modifier = Modifier.height(16.dp))
            
            repeat(5) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = 4.dp),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Box(
                        modifier = Modifier
                            .width(80.dp)
                            .height(16.dp)
                            .background(
                                MaterialTheme.colorScheme.outline.copy(alpha = 0.3f),
                                RoundedCornerShape(4.dp)
                            )
                    )
                    
                    Box(
                        modifier = Modifier
                            .width(120.dp)
                            .height(16.dp)
                            .background(
                                MaterialTheme.colorScheme.outline.copy(alpha = 0.3f),
                                RoundedCornerShape(4.dp)
                            )
                    )
                }
            }
        }
    }
}

/**
 * iOS 스타일 스켈레톤 로딩
 */
@Composable
private fun IOSStyleFixtureDetailSkeleton(
    modifier: Modifier = Modifier
) {
    LazyColumn(
        modifier = modifier
            .fillMaxSize()
            .background(FutInfoDesignSystem.Colors.SystemBackground),
        verticalArrangement = Arrangement.spacedBy(FutInfoDesignSystem.Spacing.Medium)
    ) {
        item {
            // 헤더 스켈레톤
            IOSStyleCard(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = FutInfoDesignSystem.Spacing.Medium)
            ) {
                Column(
                    modifier = Modifier.padding(FutInfoDesignSystem.Spacing.Large),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    IOSStyleSkeletonBox(
                        width = 120.dp,
                        height = 16.dp
                    )
                    
                    Spacer(modifier = Modifier.height(FutInfoDesignSystem.Spacing.Small))
                    
                    IOSStyleSkeletonBox(
                        width = 80.dp,
                        height = 12.dp
                    )
                    
                    Spacer(modifier = Modifier.height(FutInfoDesignSystem.Spacing.Large))
                    
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceEvenly
                    ) {
                        repeat(3) {
                            Column(
                                horizontalAlignment = Alignment.CenterHorizontally
                            ) {
                                IOSStyleSkeletonBox(
                                    width = 64.dp,
                                    height = 64.dp,
                                    shape = CircleShape
                                )
                                
                                Spacer(modifier = Modifier.height(FutInfoDesignSystem.Spacing.Small))
                                
                                IOSStyleSkeletonBox(
                                    width = 80.dp,
                                    height = 12.dp
                                )
                            }
                        }
                    }
                }
            }
        }
        
        item {
            // 탭 스켈레톤
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = FutInfoDesignSystem.Spacing.Medium),
                horizontalArrangement = Arrangement.spacedBy(FutInfoDesignSystem.Spacing.Small)
            ) {
                repeat(4) {
                    IOSStyleSkeletonBox(
                        modifier = Modifier.weight(1f),
                        height = 40.dp
                    )
                }
            }
        }
        
        items(3) {
            IOSStyleCard(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = FutInfoDesignSystem.Spacing.Medium)
            ) {
                Column(
                    modifier = Modifier.padding(FutInfoDesignSystem.Spacing.Medium)
                ) {
                    IOSStyleSkeletonBox(
                        modifier = Modifier.fillMaxWidth(),
                        height = 16.dp
                    )
                    
                    Spacer(modifier = Modifier.height(FutInfoDesignSystem.Spacing.Small))
                    
                    IOSStyleSkeletonBox(
                        modifier = Modifier.fillMaxWidth(0.7f),
                        height = 12.dp
                    )
                }
            }
        }
    }
}

/**
 * iOS 스타일 탭 로딩 스켈레톤
 */
@Composable
private fun IOSStyleTabLoadingSkeleton() {
    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(horizontal = FutInfoDesignSystem.Spacing.Medium),
        verticalArrangement = Arrangement.spacedBy(FutInfoDesignSystem.Spacing.Small)
    ) {
        items(5) {
            IOSStyleCard {
                Row(
                    modifier = Modifier.padding(FutInfoDesignSystem.Spacing.Medium),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    IOSStyleSkeletonBox(
                        width = 40.dp,
                        height = 40.dp,
                        shape = CircleShape
                    )
                    
                    Spacer(modifier = Modifier.width(FutInfoDesignSystem.Spacing.Medium))
                    
                    Column {
                        IOSStyleSkeletonBox(
                            width = 120.dp,
                            height = 16.dp
                        )
                        
                        Spacer(modifier = Modifier.height(FutInfoDesignSystem.Spacing.XSmall))
                        
                        IOSStyleSkeletonBox(
                            width = 80.dp,
                            height = 12.dp
                        )
                    }
                }
            }
        }
    }
}

// 유틸리티 함수들
private fun getTabsForFixture(fixture: com.hyunwoopark.futinfo.data.remote.dto.FixtureDto): List<String> {
    return when (fixture.fixture.status.short) {
        "NS" -> listOf("경기정보", "맞대결", "순위표")
        "FT", "AET", "PEN" -> listOf("요약", "통계", "라인업", "순위표", "맞대결")
        else -> listOf("요약", "통계", "라인업", "순위표")
    }
}

private fun formatFixtureDateTime(dateString: String): String {
    return try {
        // 간단한 날짜 포맷팅 (실제로는 더 정교한 포맷팅 필요)
        dateString.substring(0, 16).replace("T", " ")
    } catch (e: Exception) {
        dateString
    }
}
