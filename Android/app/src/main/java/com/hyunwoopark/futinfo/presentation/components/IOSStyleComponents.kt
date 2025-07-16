package com.hyunwoopark.futinfo.presentation.components

import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Shape
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import com.hyunwoopark.futinfo.presentation.theme.FutInfoDesignSystem

/**
 * iOS 스타일 헤더 컴포넌트
 * iOS LeagueHeaderView와 동일한 디자인
 */
@Composable
fun IOSStyleHeader(
    title: String,
    subtitle: String? = null,
    logoUrl: String? = null,
    countryFlag: String? = null,
    seasonText: String? = null,
    onSeasonClick: (() -> Unit)? = null,
    modifier: Modifier = Modifier
) {
    Card(
        modifier = modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = FutInfoDesignSystem.Colors.SystemBackground
        ),
        shape = FutInfoDesignSystem.Shapes.Medium,
        elevation = CardDefaults.cardElevation(
            defaultElevation = FutInfoDesignSystem.Elevation.Small
        )
    ) {
        Column(
            modifier = Modifier.padding(FutInfoDesignSystem.Spacing.Large)
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically
            ) {
                // 로고 또는 플레이스홀더
                Box(
                    modifier = Modifier
                        .size(60.dp)
                        .clip(CircleShape)
                        .background(FutInfoDesignSystem.Colors.SystemGray6),
                    contentAlignment = Alignment.Center
                ) {
                    if (logoUrl != null) {
                        AsyncImage(
                            model = logoUrl,
                            contentDescription = title,
                            modifier = Modifier.size(52.dp)
                        )
                    } else {
                        Text(
                            text = title.take(2).uppercase(),
                            color = FutInfoDesignSystem.Colors.RoyalBlue,
                            style = FutInfoDesignSystem.Typography.Headline,
                            fontWeight = FontWeight.Bold
                        )
                    }
                }
                
                Spacer(modifier = Modifier.width(FutInfoDesignSystem.Spacing.Large))
                
                Column {
                    Text(
                        text = title,
                        style = FutInfoDesignSystem.Typography.Title2,
                        fontWeight = FontWeight.Bold
                    )
                    
                    if (subtitle != null) {
                        Spacer(modifier = Modifier.height(FutInfoDesignSystem.Spacing.ExtraSmall))
                        
                        Row(
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            if (countryFlag != null) {
                                Text(
                                    text = countryFlag,
                                    fontSize = 16.sp
                                )
                                Spacer(modifier = Modifier.width(FutInfoDesignSystem.Spacing.ExtraSmall))
                            }
                            Text(
                                text = subtitle,
                                style = FutInfoDesignSystem.Typography.Subhead,
                                color = FutInfoDesignSystem.Colors.Gray
                            )
                        }
                    }
                }
                
                Spacer(modifier = Modifier.weight(1f))
                
                // 시즌 선택
                if (seasonText != null && onSeasonClick != null) {
                    Surface(
                        modifier = Modifier
                            .clip(FutInfoDesignSystem.Shapes.Small)
                            .clickable {
                                android.util.Log.d("IOSStyleHeader", "🔍 시즌 선택 클릭")
                                onSeasonClick()
                            },
                        color = FutInfoDesignSystem.Colors.SystemGray6,
                        shape = FutInfoDesignSystem.Shapes.Small
                    ) {
                        Row(
                            modifier = Modifier.padding(
                                horizontal = FutInfoDesignSystem.Spacing.Medium,
                                vertical = FutInfoDesignSystem.Spacing.Small
                            ),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(
                                text = seasonText,
                                style = FutInfoDesignSystem.Typography.Subhead,
                                fontWeight = FontWeight.Medium
                            )
                            Spacer(modifier = Modifier.width(4.dp))
                            Text(
                                text = "▼",
                                style = FutInfoDesignSystem.Typography.Caption1,
                                color = FutInfoDesignSystem.Colors.Gray
                            )
                        }
                    }
                }
            }
        }
    }
}

/**
 * iOS 스타일 탭 바 컴포넌트
 * iOS CustomTabBar와 동일한 디자인
 */
@Composable
fun IOSStyleTabBar(
    tabs: List<String>,
    selectedTabIndex: Int,
    onTabSelected: (Int) -> Unit,
    modifier: Modifier = Modifier
) {
    Card(
        modifier = modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = FutInfoDesignSystem.Colors.SystemBackground
        ),
        shape = FutInfoDesignSystem.Shapes.Medium,
        elevation = CardDefaults.cardElevation(
            defaultElevation = FutInfoDesignSystem.Elevation.Small
        )
    ) {
        Column {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(FutInfoDesignSystem.Spacing.Small)
            ) {
                tabs.forEachIndexed { index, tab ->
                    val isSelected = selectedTabIndex == index
                    
                    Box(
                        modifier = Modifier
                            .weight(1f)
                            .background(
                                color = if (isSelected) FutInfoDesignSystem.Colors.RoyalBlue 
                                       else Color.Transparent,
                                shape = FutInfoDesignSystem.Shapes.Small
                            )
                            .clickable { onTabSelected(index) }
                            .padding(vertical = FutInfoDesignSystem.Spacing.TabPadding),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = tab,
                            color = if (isSelected) Color.White 
                                   else FutInfoDesignSystem.Colors.Gray,
                            style = FutInfoDesignSystem.Typography.Subhead,
                            fontWeight = if (isSelected) FontWeight.Bold 
                                        else FontWeight.Normal,
                            textAlign = TextAlign.Center
                        )
                    }
                }
            }
            
            Divider(color = FutInfoDesignSystem.Colors.SystemGray5)
        }
    }
}

/**
 * iOS 스타일 세그먼트 탭 바 (언더라인 스타일)
 * iOS TabBarButton과 동일한 디자인
 */
@Composable
fun IOSStyleSegmentedTabBar(
    tabs: List<String>,
    selectedTabIndex: Int,
    onTabSelected: (Int) -> Unit,
    modifier: Modifier = Modifier
) {
    Card(
        modifier = modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = FutInfoDesignSystem.Colors.SystemBackground
        ),
        elevation = CardDefaults.cardElevation(
            defaultElevation = FutInfoDesignSystem.Elevation.Small
        )
    ) {
        Column {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(top = FutInfoDesignSystem.Spacing.Small)
            ) {
                tabs.forEachIndexed { index, tab ->
                    val isSelected = selectedTabIndex == index
                    
                    Column(
                        modifier = Modifier
                            .weight(1f)
                            .clickable { onTabSelected(index) }
                            .padding(vertical = FutInfoDesignSystem.Spacing.Small),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Text(
                            text = tab,
                            color = if (isSelected) FutInfoDesignSystem.Colors.RoyalBlue 
                                   else FutInfoDesignSystem.Colors.Gray,
                            style = FutInfoDesignSystem.Typography.Subhead,
                            fontWeight = if (isSelected) FontWeight.SemiBold 
                                        else FontWeight.Medium,
                            textAlign = TextAlign.Center
                        )
                        
                        Spacer(modifier = Modifier.height(FutInfoDesignSystem.Spacing.Small))
                        
                        // 선택 인디케이터
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(2.dp)
                                .background(
                                    color = if (isSelected) FutInfoDesignSystem.Colors.RoyalBlue 
                                           else Color.Transparent,
                                    shape = FutInfoDesignSystem.Shapes.TabIndicator
                                )
                        )
                    }
                }
            }
            
            Divider(color = FutInfoDesignSystem.Colors.SystemGray5)
        }
    }
}

/**
 * iOS 스타일 카드 컴포넌트
 */
@Composable
fun IOSStyleCard(
    modifier: Modifier = Modifier,
    onClick: (() -> Unit)? = null,
    content: @Composable ColumnScope.() -> Unit
) {
    Card(
        modifier = modifier
            .fillMaxWidth()
            .then(
                if (onClick != null) Modifier.clickable { onClick() }
                else Modifier
            ),
        colors = CardDefaults.cardColors(
            containerColor = FutInfoDesignSystem.Colors.SystemBackground
        ),
        shape = FutInfoDesignSystem.Shapes.Medium,
        elevation = CardDefaults.cardElevation(
            defaultElevation = FutInfoDesignSystem.Elevation.Small
        )
    ) {
        Column(
            modifier = Modifier.padding(FutInfoDesignSystem.Spacing.CardPadding),
            content = content
        )
    }
}

/**
 * iOS 스타일 섹션 헤더
 */
@Composable
fun IOSStyleSectionHeader(
    title: String,
    modifier: Modifier = Modifier
) {
    Text(
        text = title,
        style = FutInfoDesignSystem.Typography.Headline,
        fontWeight = FontWeight.Bold,
        modifier = modifier.padding(
            horizontal = FutInfoDesignSystem.Spacing.Large,
            vertical = FutInfoDesignSystem.Spacing.Small
        )
    )
}

/**
 * iOS 스타일 빈 상태 뷰
 */
@Composable
fun IOSStyleEmptyState(
    message: String,
    modifier: Modifier = Modifier
) {
    Column(
        modifier = modifier
            .fillMaxWidth()
            .padding(FutInfoDesignSystem.Spacing.XXXLarge),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Text(
            text = "⚽",
            fontSize = 40.sp
        )
        
        Spacer(modifier = Modifier.height(FutInfoDesignSystem.Spacing.Large))
        
        Text(
            text = message,
            style = FutInfoDesignSystem.Typography.Headline,
            color = FutInfoDesignSystem.Colors.Gray,
            textAlign = TextAlign.Center
        )
    }
}

/**
 * iOS 스타일 로딩 뷰
 */
@Composable
fun IOSStyleLoadingView(
    message: String = "데이터를 불러오는 중...",
    modifier: Modifier = Modifier
) {
    Box(
        modifier = modifier.fillMaxSize(),
        contentAlignment = Alignment.Center
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            CircularProgressIndicator(
                color = FutInfoDesignSystem.Colors.RoyalBlue,
                strokeWidth = 3.dp
            )
            
            Spacer(modifier = Modifier.height(FutInfoDesignSystem.Spacing.Large))
            
            Text(
                text = message,
                style = FutInfoDesignSystem.Typography.Headline,
                color = FutInfoDesignSystem.Colors.Gray
            )
        }
    }
}

/**
 * iOS 스타일 에러 뷰
 */
@Composable
fun IOSStyleErrorView(
    message: String,
    onRetry: () -> Unit,
    modifier: Modifier = Modifier
) {
    Column(
        modifier = modifier
            .fillMaxWidth()
            .padding(FutInfoDesignSystem.Spacing.XXXLarge),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Text(
            text = "⚠️",
            fontSize = 40.sp
        )
        
        Spacer(modifier = Modifier.height(FutInfoDesignSystem.Spacing.Large))
        
        Text(
            text = message,
            style = FutInfoDesignSystem.Typography.Headline,
            color = FutInfoDesignSystem.Colors.Red,
            textAlign = TextAlign.Center
        )
        
        Spacer(modifier = Modifier.height(FutInfoDesignSystem.Spacing.Large))
        
        Button(
            onClick = onRetry,
            colors = ButtonDefaults.buttonColors(
                containerColor = FutInfoDesignSystem.Colors.RoyalBlue
            ),
            shape = FutInfoDesignSystem.Shapes.Small
        ) {
            Text(
                text = "다시 시도",
                color = Color.White,
                style = FutInfoDesignSystem.Typography.Callout,
                fontWeight = FontWeight.SemiBold
            )
        }
    }
}

/**
 * iOS 스타일 스켈레톤 로딩 컴포넌트
 */
@Composable
fun IOSStyleSkeleton(
    modifier: Modifier = Modifier
) {
    val alpha by animateFloatAsState(
        targetValue = 0.3f,
        animationSpec = tween(1000),
        label = "skeleton_alpha"
    )
    
    Box(
        modifier = modifier
            .background(
                color = FutInfoDesignSystem.Colors.SystemGray4.copy(alpha = alpha),
                shape = FutInfoDesignSystem.Shapes.Small
            )
    )
}

/**
 * iOS 스타일 진출권 인디케이터
 */
@Composable
fun QualificationIndicator(
    leagueId: Int,
    rank: Int,
    modifier: Modifier = Modifier
) {
    val color = com.hyunwoopark.futinfo.presentation.theme.getQualificationColor(leagueId, rank)
    
    if (color != Color.Transparent) {
        Box(
            modifier = modifier
                .width(3.dp)
                .height(40.dp)
                .background(color)
        )
    }
}

/**
 * iOS 스타일 배지 컴포넌트
 */
@Composable
fun IOSStyleBadge(
    text: String,
    backgroundColor: Color = FutInfoDesignSystem.Colors.RoyalBlue,
    textColor: Color = Color.White,
    modifier: Modifier = Modifier
) {
    Surface(
        modifier = modifier,
        color = backgroundColor,
        shape = FutInfoDesignSystem.Shapes.Badge
    ) {
        Text(
            text = text,
            color = textColor,
            style = FutInfoDesignSystem.Typography.Caption1,
            fontWeight = FontWeight.Bold,
            modifier = Modifier.padding(
                horizontal = FutInfoDesignSystem.Spacing.Medium,
                vertical = FutInfoDesignSystem.Spacing.ExtraSmall
            )
        )
    }
}

/**
 * iOS 스타일 스켈레톤 박스 컴포넌트
 */
@Composable
fun IOSStyleSkeletonBox(
    modifier: Modifier = Modifier,
    width: androidx.compose.ui.unit.Dp? = null,
    height: androidx.compose.ui.unit.Dp,
    shape: Shape = FutInfoDesignSystem.Shapes.Small
) {
    val alpha by animateFloatAsState(
        targetValue = 0.3f,
        animationSpec = tween(1000),
        label = "skeleton_alpha"
    )
    
    Box(
        modifier = modifier
            .then(if (width != null) Modifier.width(width) else Modifier)
            .height(height)
            .background(
                color = FutInfoDesignSystem.Colors.SystemGray4.copy(alpha = alpha),
                shape = shape
            )
    )
}

/**
 * iOS 스타일 경기 상세 컨텐츠
 */
@Composable
fun IOSStyleFixtureDetailContent(
    data: com.hyunwoopark.futinfo.domain.model.FixtureDetailBundle,
    selectedTabIndex: Int,
    tabLoadingStates: Map<Int, Boolean>,
    standingsState: com.hyunwoopark.futinfo.util.Resource<com.hyunwoopark.futinfo.data.remote.dto.StandingsResponseDto>?,
    onTabSelected: (Int) -> Unit,
    onTeamClick: (Int) -> Unit,
    viewModel: com.hyunwoopark.futinfo.presentation.fixture_detail.FixtureDetailViewModel,
    modifier: Modifier = Modifier
) {
    Column(
        modifier = modifier.fillMaxSize()
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
            
            IOSStyleDynamicTabRow(
                tabs = tabs,
                selectedTabIndex = selectedTabIndex,
                tabLoadingStates = tabLoadingStates,
                onTabSelected = onTabSelected
            )
            
            // 탭 컨텐츠
            IOSStyleTabContent(
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

/**
 * iOS 스타일 동적 탭 로우
 */
@Composable
fun IOSStyleDynamicTabRow(
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
                    modifier = Modifier,
                    color = FutInfoDesignSystem.Colors.RoyalBlue
                )
            }
        }
    ) {
        tabs.forEachIndexed { index, title ->
            Tab(
                selected = selectedTabIndex == index,
                onClick = { onTabSelected(index) },
                text = {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Text(
                            text = title,
                            fontWeight = if (selectedTabIndex == index)
                                FontWeight.Bold else FontWeight.Normal,
                            style = FutInfoDesignSystem.Typography.Subhead
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

/**
 * iOS 스타일 탭 컨텐츠
 */
@Composable
fun IOSStyleTabContent(
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
            "경기요약" -> com.hyunwoopark.futinfo.presentation.fixture_detail.tabs.MatchSummaryScreen(
                data = data,
                isLoading = isLoading
            )
            "통계" -> com.hyunwoopark.futinfo.presentation.fixture_detail.tabs.StatisticsScreen(
                data = data,
                isLoading = isLoading
            )
            "라인업" -> com.hyunwoopark.futinfo.presentation.fixture_detail.tabs.LineupsScreen(
                data = data,
                isLoading = isLoading
            )
            "정보" -> com.hyunwoopark.futinfo.presentation.fixture_detail.tabs.MatchInfoScreen(
                fixture = fixture,
                isLoading = isLoading
            )
            "부상" -> IOSStyleInjuriesTab(fixture = fixture, isLoading = isLoading)
            "순위" -> com.hyunwoopark.futinfo.presentation.fixture_detail.tabs.StandingsScreen(
                standingsState = standingsState
            )
            "상대전적" -> com.hyunwoopark.futinfo.presentation.fixture_detail.tabs.HeadToHeadScreen(
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
fun IOSStyleFixtureHeader(
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
                text = fixture.league.name,
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
fun IOSStyleTeamSection(
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
            AsyncImage(
                model = team.logo,
                contentDescription = team.name,
                modifier = Modifier.size(56.dp)
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
fun IOSStyleScoreSection(
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

/**
 * iOS 스타일 부상 탭
 */
@Composable
fun IOSStyleInjuriesTab(
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
            style = FutInfoDesignSystem.Typography.Title2,
            fontWeight = FontWeight.Bold
        )
        Spacer(modifier = Modifier.height(8.dp))
        Text(
            text = "곧 제공될 예정입니다",
            style = FutInfoDesignSystem.Typography.Body,
            color = FutInfoDesignSystem.Colors.SecondaryLabel
        )
    }
}

// 유틸리티 함수
private fun formatFixtureDateTime(dateString: String): String {
    return try {
        // 간단한 날짜 포맷팅 (실제로는 더 정교한 포맷팅 필요)
        dateString.substring(0, 16).replace("T", " ")
    } catch (e: Exception) {
        dateString
    }
}
/**
 * iOS 스타일 빈 상태 뷰 (아이콘 포함)
 */
@Composable
fun IOSStyleEmptyView(
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    title: String,
    description: String,
    modifier: Modifier = Modifier
) {
    Column(
        modifier = modifier
            .fillMaxWidth()
            .padding(FutInfoDesignSystem.Spacing.XXXLarge),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Icon(
            imageVector = icon,
            contentDescription = title,
            modifier = Modifier.size(64.dp),
            tint = FutInfoDesignSystem.Colors.SystemGray
        )
        
        Spacer(modifier = Modifier.height(FutInfoDesignSystem.Spacing.Large))
        
        Text(
            text = title,
            style = FutInfoDesignSystem.Typography.Title2,
            fontWeight = FontWeight.Bold,
            color = FutInfoDesignSystem.Colors.Label,
            textAlign = TextAlign.Center
        )
        
        Spacer(modifier = Modifier.height(FutInfoDesignSystem.Spacing.Small))
        
        Text(
            text = description,
            style = FutInfoDesignSystem.Typography.Body,
            color = FutInfoDesignSystem.Colors.SecondaryLabel,
            textAlign = TextAlign.Center
        )
    }
}