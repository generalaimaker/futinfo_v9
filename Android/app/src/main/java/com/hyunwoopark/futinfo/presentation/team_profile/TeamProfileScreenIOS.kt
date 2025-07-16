package com.hyunwoopark.futinfo.presentation.team_profile

import androidx.compose.animation.*
import androidx.compose.foundation.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
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
import coil.request.ImageRequest
import com.hyunwoopark.futinfo.domain.model.TeamProfileDetails
import com.hyunwoopark.futinfo.data.remote.dto.SquadPlayerDto
import com.hyunwoopark.futinfo.data.remote.dto.StandingDto
import com.hyunwoopark.futinfo.data.remote.dto.FixtureDto
import com.hyunwoopark.futinfo.presentation.design_system.DesignSystem
import com.google.accompanist.pager.ExperimentalPagerApi
import com.google.accompanist.pager.HorizontalPager
import com.google.accompanist.pager.rememberPagerState
import kotlinx.coroutines.launch
import com.hyunwoopark.futinfo.data.local.TeamTrophiesLibrary
import java.time.LocalDateTime
import java.time.format.DateTimeFormatter
import java.time.ZoneId

/**
 * iOS 스타일 팀 프로필 화면
 */
@OptIn(ExperimentalMaterial3Api::class, ExperimentalPagerApi::class)
@Composable
fun TeamProfileScreenIOS(
    viewModel: TeamProfileViewModel = hiltViewModel(),
    onBackClick: () -> Unit = {},
    onPlayerClick: (Int) -> Unit = {},
    onFixtureClick: (Int) -> Unit = {}
) {
    val state by viewModel.state.collectAsStateWithLifecycle()
    val pagerState = rememberPagerState()
    val coroutineScope = rememberCoroutineScope()
    
    Scaffold(
        modifier = Modifier.background(DesignSystem.Colors.background),
        topBar = {
            TopAppBar(
                title = {
                    Text(
                        text = state.teamProfile?.teamName ?: "팀 프로필",
                        fontWeight = FontWeight.Bold,
                        color = DesignSystem.Colors.textPrimary
                    )
                },
                navigationIcon = {
                    IconButton(onClick = onBackClick) {
                        Icon(
                            imageVector = Icons.Default.ArrowBack,
                            contentDescription = "뒤로 가기",
                            tint = DesignSystem.Colors.textPrimary
                        )
                    }
                },
                actions = {
                    IconButton(
                        onClick = { viewModel.toggleFavorite() },
                        enabled = !state.isFavoriteLoading
                    ) {
                        Icon(
                            imageVector = if (state.isFavorite) Icons.Default.Star else Icons.Default.StarBorder,
                            contentDescription = if (state.isFavorite) "즐겨찾기 해제" else "즐겨찾기 추가",
                            tint = if (state.isFavorite) Color(0xFFFFD700) else DesignSystem.Colors.textSecondary
                        )
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = DesignSystem.Colors.background
                )
            )
        }
    ) { paddingValues ->
        when {
            state.isLoading -> {
                Box(
                    modifier = Modifier.fillMaxSize(),
                    contentAlignment = Alignment.Center
                ) {
                    CircularProgressIndicator(color = DesignSystem.Colors.accent)
                }
            }
            state.errorMessage != null -> {
                ErrorView(
                    errorMessage = state.errorMessage!!,
                    onRetry = { viewModel.refreshTeamProfile() }
                )
            }
            state.teamProfile != null -> {
                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(paddingValues)
                ) {
                    // 탭
                    TabRow(
                        selectedTabIndex = pagerState.currentPage,
                        containerColor = DesignSystem.Colors.background,
                        contentColor = DesignSystem.Colors.accent
                    ) {
                        Tab(
                            selected = pagerState.currentPage == 0,
                            onClick = {
                                coroutineScope.launch {
                                    pagerState.animateScrollToPage(0)
                                }
                            }
                        ) {
                            Row(
                                modifier = Modifier.padding(vertical = 16.dp),
                                horizontalArrangement = Arrangement.spacedBy(8.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Icon(
                                    imageVector = Icons.Default.Groups,
                                    contentDescription = null,
                                    modifier = Modifier.size(20.dp)
                                )
                                Text("팀 정보")
                            }
                        }
                        
                        Tab(
                            selected = pagerState.currentPage == 1,
                            onClick = {
                                coroutineScope.launch {
                                    pagerState.animateScrollToPage(1)
                                }
                            }
                        ) {
                            Row(
                                modifier = Modifier.padding(vertical = 16.dp),
                                horizontalArrangement = Arrangement.spacedBy(8.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Icon(
                                    imageVector = Icons.Default.Person,
                                    contentDescription = null,
                                    modifier = Modifier.size(20.dp)
                                )
                                Text("선수단")
                            }
                        }
                    }
                    
                    // 페이저
                    HorizontalPager(
                        count = 2,
                        state = pagerState,
                        modifier = Modifier.fillMaxSize()
                    ) { page ->
                        when (page) {
                            0 -> TeamInfoTab(
                                teamProfile = state.teamProfile!!,
                                standings = state.standings,
                                recentFixtures = state.recentFixtures,
                                upcomingFixtures = state.upcomingFixtures,
                                isFixturesLoading = state.isFixturesLoading,
                                isLoading = state.isLoading,
                                onFixtureClick = onFixtureClick,
                                onShowFullSquad = {
                                    coroutineScope.launch {
                                        pagerState.animateScrollToPage(1)
                                    }
                                }
                            )
                            1 -> TeamSquadTab(
                                teamProfile = state.teamProfile!!,
                                onPlayerClick = onPlayerClick
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun TeamInfoTab(
    teamProfile: TeamProfileDetails,
    standings: List<StandingDto>?,
    recentFixtures: List<FixtureDto>?,
    upcomingFixtures: List<FixtureDto>?,
    isFixturesLoading: Boolean,
    isLoading: Boolean,
    onFixtureClick: (Int) -> Unit,
    onShowFullSquad: () -> Unit
) {
    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // 헤더
        item {
            TeamHeaderSection(teamProfile = teamProfile)
        }
        
        // 통계
        if (teamProfile.hasStatistics) {
            item {
                TeamStatisticsSection(teamProfile = teamProfile)
            }
        }
        
        // 현재 순위
        standings?.let { standingsList ->
            item {
                CurrentStandingSection(
                    teamId = teamProfile.teamId,
                    standings = standingsList
                )
            }
        }
        
        // 최근 폼
        if (!teamProfile.teamForm.isNullOrEmpty()) {
            item {
                RecentFormSection(
                    form = teamProfile.teamForm ?: "",
                    recentFixtures = recentFixtures,
                    onFixtureClick = onFixtureClick
                )
            }
        }
        
        // 다음 경기 - 항상 표시
        item {
            UpcomingFixtureSection(
                fixtures = upcomingFixtures ?: emptyList(),
                teamId = teamProfile.teamId,
                onFixtureClick = onFixtureClick,
                isLoading = isFixturesLoading
            )
        }
        
        // 트로피/영예 - 데이터가 있는 팀만 표시
        if (TeamTrophiesLibrary.hasTrophyData(teamProfile.teamId)) {
            item {
                TrophySection(teamId = teamProfile.teamId)
            }
        }
        
        // 경기장 정보
        if (teamProfile.hasVenueInfo) {
            item {
                VenueSection(teamProfile = teamProfile)
            }
        }
        
        // 선수단 미리보기 - 항상 표시
        item {
            // 디버깅용 로그
            println("TeamProfileScreenIOS - Squad players: ${teamProfile.squad?.players?.size ?: 0}")
            
            SquadPreviewSection(
                squad = teamProfile.squad?.players ?: emptyList(),
                onShowFullSquad = onShowFullSquad,
                isLoading = isLoading
            )
        }
    }
}

@Composable
private fun TeamHeaderSection(teamProfile: TeamProfileDetails) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(20.dp),
        colors = CardDefaults.cardColors(containerColor = DesignSystem.Colors.surface),
        elevation = CardDefaults.cardElevation(defaultElevation = 4.dp)
    ) {
        Box(modifier = Modifier.fillMaxWidth()) {
            // 배경 그라디언트 - 팀 색상을 반영할 수 있도록
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(180.dp)
                    .background(
                        Brush.verticalGradient(
                            colors = listOf(
                                DesignSystem.Colors.accent.copy(alpha = 0.3f),
                                DesignSystem.Colors.accent.copy(alpha = 0.1f),
                                DesignSystem.Colors.surface
                            )
                        )
                    )
            )
            
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(24.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                // 팀 로고 - 더 크고 임팩트있게
                Box(
                    modifier = Modifier.size(140.dp),
                    contentAlignment = Alignment.Center
                ) {
                    // 로고 배경 효과
                    Box(
                        modifier = Modifier
                            .size(140.dp)
                            .background(
                                DesignSystem.Colors.accent.copy(alpha = 0.1f),
                                shape = CircleShape
                            )
                    )
                    
                    Card(
                        modifier = Modifier.size(120.dp),
                        shape = CircleShape,
                        elevation = CardDefaults.cardElevation(defaultElevation = 12.dp),
                        colors = CardDefaults.cardColors(containerColor = Color.White)
                    ) {
                        AsyncImage(
                            model = ImageRequest.Builder(LocalContext.current)
                                .data(teamProfile.teamLogo)
                                .crossfade(true)
                                .build(),
                            contentDescription = "${teamProfile.teamName} 로고",
                            modifier = Modifier
                                .fillMaxSize()
                                .padding(16.dp),
                            contentScale = ContentScale.Fit
                        )
                    }
                }
                
                Spacer(modifier = Modifier.height(20.dp))
                
                // 팀 이름 - 더 크고 눈에 띄게
                Text(
                    text = teamProfile.teamName,
                    style = MaterialTheme.typography.headlineLarge,
                    fontWeight = FontWeight.Bold,
                    color = DesignSystem.Colors.textPrimary,
                    textAlign = TextAlign.Center
                )
                
                Spacer(modifier = Modifier.height(12.dp))
                
                // 팀 정보 뱃지들
                Row(
                    horizontalArrangement = Arrangement.Center,
                    verticalAlignment = Alignment.CenterVertically,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    teamProfile.teamCountry?.let { country ->
                        Surface(
                            shape = RoundedCornerShape(16.dp),
                            color = DesignSystem.Colors.accent.copy(alpha = 0.1f)
                        ) {
                            Row(
                                modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp),
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(6.dp)
                            ) {
                                Icon(
                                    imageVector = Icons.Default.Flag,
                                    contentDescription = null,
                                    modifier = Modifier.size(14.dp),
                                    tint = DesignSystem.Colors.accent
                                )
                                Text(
                                    text = country,
                                    style = MaterialTheme.typography.bodySmall,
                                    fontWeight = FontWeight.SemiBold,
                                    color = DesignSystem.Colors.accent
                                )
                            }
                        }
                    }
                    
                    teamProfile.foundedYear?.let { year ->
                        Spacer(modifier = Modifier.width(8.dp))
                        Surface(
                            shape = RoundedCornerShape(16.dp),
                            color = DesignSystem.Colors.accent.copy(alpha = 0.1f)
                        ) {
                            Row(
                                modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp),
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(6.dp)
                            ) {
                                Icon(
                                    imageVector = Icons.Default.CalendarMonth,
                                    contentDescription = null,
                                    modifier = Modifier.size(14.dp),
                                    tint = DesignSystem.Colors.accent
                                )
                                Text(
                                    text = "Since ${year}",
                                    style = MaterialTheme.typography.bodySmall,
                                    fontWeight = FontWeight.SemiBold,
                                    color = DesignSystem.Colors.accent
                                )
                            }
                        }
                    }
                }
                
                // 팀 슬로건이나 모토 추가 (예시)
                Spacer(modifier = Modifier.height(16.dp))
                Text(
                    text = getTeamMotto(teamProfile.teamId),
                    style = MaterialTheme.typography.bodyMedium,
                    fontStyle = androidx.compose.ui.text.font.FontStyle.Italic,
                    color = DesignSystem.Colors.textSecondary,
                    textAlign = TextAlign.Center
                )
            }
        }
    }
}

@Composable
private fun TeamStatisticsSection(teamProfile: TeamProfileDetails) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = DesignSystem.Colors.surface)
    ) {
        Column(modifier = Modifier.padding(20.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "시즌 통계",
                    style = MaterialTheme.typography.titleLarge,
                    fontWeight = FontWeight.Bold,
                    color = DesignSystem.Colors.textPrimary
                )
                
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    teamProfile.leagueLogo?.let { logo ->
                        AsyncImage(
                            model = logo,
                            contentDescription = null,
                            modifier = Modifier.size(24.dp)
                        )
                    }
                    Text(
                        text = "${teamProfile.currentSeason ?: "2025"}",
                        style = MaterialTheme.typography.bodyMedium,
                        color = DesignSystem.Colors.textSecondary
                    )
                }
            }
            
            Spacer(modifier = Modifier.height(20.dp))
            
            // 경기 기록
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceEvenly
            ) {
                StatColumn("총 경기", "${teamProfile.totalGamesPlayed ?: 0}", DesignSystem.Colors.textPrimary)
                StatColumn("승리", "${teamProfile.totalWins ?: 0}", DesignSystem.Colors.success)
                StatColumn("무승부", "${teamProfile.totalDraws ?: 0}", DesignSystem.Colors.warning)
                StatColumn("패배", "${teamProfile.totalLoses ?: 0}", DesignSystem.Colors.destructive)
            }
            
            Spacer(modifier = Modifier.height(16.dp))
            Divider(color = DesignSystem.Colors.border.copy(alpha = 0.5f))
            Spacer(modifier = Modifier.height(16.dp))
            
            // 홈/원정 기록
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceEvenly
            ) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text(
                        text = "홈",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.SemiBold,
                        color = DesignSystem.Colors.textPrimary
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = "${teamProfile.homeWins ?: 0}승 ${teamProfile.homeDraws ?: 0}무 ${teamProfile.homeLoses ?: 0}패",
                        style = MaterialTheme.typography.bodyMedium,
                        color = DesignSystem.Colors.textSecondary
                    )
                }
                
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text(
                        text = "원정",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.SemiBold,
                        color = DesignSystem.Colors.textPrimary
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = "${teamProfile.awayWins ?: 0}승 ${teamProfile.awayDraws ?: 0}무 ${teamProfile.awayLoses ?: 0}패",
                        style = MaterialTheme.typography.bodyMedium,
                        color = DesignSystem.Colors.textSecondary
                    )
                }
            }
            
            Spacer(modifier = Modifier.height(16.dp))
            Divider(color = DesignSystem.Colors.border.copy(alpha = 0.5f))
            Spacer(modifier = Modifier.height(16.dp))
            
            // 득실점
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceEvenly
            ) {
                StatColumn("득점", "${teamProfile.totalGoalsFor ?: 0}", DesignSystem.Colors.accent)
                StatColumn("실점", "${teamProfile.totalGoalsAgainst ?: 0}", DesignSystem.Colors.destructive)
                StatColumn(
                    "득실차",
                    teamProfile.goalDifference?.let { if (it >= 0) "+$it" else it.toString() } ?: "0",
                    if ((teamProfile.goalDifference ?: 0) >= 0) DesignSystem.Colors.success else DesignSystem.Colors.destructive
                )
            }
        }
    }
}

@Composable
private fun StatColumn(label: String, value: String, color: Color) {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Text(
            text = value,
            style = MaterialTheme.typography.headlineSmall,
            fontWeight = FontWeight.Bold,
            color = color
        )
        Text(
            text = label,
            style = MaterialTheme.typography.bodySmall,
            color = DesignSystem.Colors.textSecondary
        )
    }
}

@Composable
private fun CurrentStandingSection(teamId: Int, standings: List<StandingDto>) {
    val teamStanding = standings.find { it.team.id == teamId } ?: return
    val teamIndex = standings.indexOf(teamStanding)
    val displayRange = maxOf(0, teamIndex - 1)..minOf(standings.lastIndex, teamIndex + 1)
    val displayStandings = standings.slice(displayRange)
    
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = DesignSystem.Colors.surface)
    ) {
        Column(modifier = Modifier.padding(20.dp)) {
            Text(
                text = "현재 순위",
                style = MaterialTheme.typography.titleLarge,
                fontWeight = FontWeight.Bold,
                color = DesignSystem.Colors.textPrimary
            )
            
            Spacer(modifier = Modifier.height(16.dp))
            
            displayStandings.forEach { standing ->
                StandingRow(
                    standing = standing,
                    isCurrentTeam = standing.team.id == teamId
                )
                if (standing != displayStandings.last()) {
                    Divider(
                        color = DesignSystem.Colors.border.copy(alpha = 0.3f),
                        modifier = Modifier.padding(vertical = 8.dp)
                    )
                }
            }
        }
    }
}

@Composable
private fun StandingRow(standing: StandingDto, isCurrentTeam: Boolean) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .background(
                if (isCurrentTeam) DesignSystem.Colors.accent.copy(alpha = 0.1f)
                else Color.Transparent,
                shape = RoundedCornerShape(8.dp)
            )
            .padding(horizontal = 12.dp, vertical = 8.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(
            text = "${standing.rank}",
            style = MaterialTheme.typography.bodyMedium,
            fontWeight = if (isCurrentTeam) FontWeight.Bold else FontWeight.Normal,
            color = if (isCurrentTeam) DesignSystem.Colors.accent else DesignSystem.Colors.textPrimary,
            modifier = Modifier.width(30.dp)
        )
        
        AsyncImage(
            model = standing.team.logo,
            contentDescription = null,
            modifier = Modifier.size(24.dp)
        )
        
        Spacer(modifier = Modifier.width(12.dp))
        
        Text(
            text = standing.team.name,
            style = MaterialTheme.typography.bodyMedium,
            fontWeight = if (isCurrentTeam) FontWeight.SemiBold else FontWeight.Normal,
            color = DesignSystem.Colors.textPrimary,
            modifier = Modifier.weight(1f)
        )
        
        Text(
            text = "${standing.all.played}",
            style = MaterialTheme.typography.bodySmall,
            color = DesignSystem.Colors.textSecondary,
            modifier = Modifier.width(30.dp),
            textAlign = TextAlign.Center
        )
        
        Text(
            text = "${standing.points}",
            style = MaterialTheme.typography.bodyMedium,
            fontWeight = FontWeight.Bold,
            color = if (isCurrentTeam) DesignSystem.Colors.accent else DesignSystem.Colors.textPrimary,
            modifier = Modifier.width(30.dp),
            textAlign = TextAlign.End
        )
    }
}

@Composable
private fun RecentFormSection(
    form: String,
    recentFixtures: List<FixtureDto>?,
    onFixtureClick: (Int) -> Unit
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = DesignSystem.Colors.surface)
    ) {
        Column(modifier = Modifier.padding(20.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "최근 경기",
                    style = MaterialTheme.typography.titleLarge,
                    fontWeight = FontWeight.Bold,
                    color = DesignSystem.Colors.textPrimary
                )
                
                // 최근 폼 요약
                if (form.isNotEmpty()) {
                    val wins = form.count { it == 'W' }
                    val draws = form.count { it == 'D' }
                    val loses = form.count { it == 'L' }
                    
                    Row(
                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = "최근 ${form.length}경기",
                            style = MaterialTheme.typography.bodySmall,
                            color = DesignSystem.Colors.textSecondary
                        )
                        Surface(
                            shape = RoundedCornerShape(12.dp),
                            color = DesignSystem.Colors.success.copy(alpha = 0.1f)
                        ) {
                            Text(
                                text = "${wins}승",
                                modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
                                style = MaterialTheme.typography.labelSmall,
                                fontWeight = FontWeight.Bold,
                                color = DesignSystem.Colors.success
                            )
                        }
                        if (draws > 0) {
                            Surface(
                                shape = RoundedCornerShape(12.dp),
                                color = DesignSystem.Colors.warning.copy(alpha = 0.1f)
                            ) {
                                Text(
                                    text = "${draws}무",
                                    modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
                                    style = MaterialTheme.typography.labelSmall,
                                    fontWeight = FontWeight.Bold,
                                    color = DesignSystem.Colors.warning
                                )
                            }
                        }
                        if (loses > 0) {
                            Surface(
                                shape = RoundedCornerShape(12.dp),
                                color = DesignSystem.Colors.destructive.copy(alpha = 0.1f)
                            ) {
                                Text(
                                    text = "${loses}패",
                                    modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
                                    style = MaterialTheme.typography.labelSmall,
                                    fontWeight = FontWeight.Bold,
                                    color = DesignSystem.Colors.destructive
                                )
                            }
                        }
                    }
                }
            }
            
            Spacer(modifier = Modifier.height(16.dp))
            
            // 폼 뱃지
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.Start
            ) {
                form.take(10).forEach { result ->
                    FormBadge(result = result)
                    Spacer(modifier = Modifier.width(6.dp))
                }
            }
            
            recentFixtures?.let { fixtures ->
                if (fixtures.isNotEmpty()) {
                    Spacer(modifier = Modifier.height(20.dp))
                    
                    LazyRow(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                        items(fixtures.take(5)) { fixture ->
                            RecentFixtureCard(
                                fixture = fixture,
                                onClick = { onFixtureClick(fixture.fixture.id) }
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun FormBadge(result: Char) {
    val (backgroundColor, text) = when (result) {
        'W' -> DesignSystem.Colors.success to "승"
        'D' -> DesignSystem.Colors.warning to "무"
        'L' -> DesignSystem.Colors.destructive to "패"
        else -> DesignSystem.Colors.textTertiary to "?"
    }
    
    Surface(
        shape = CircleShape,
        color = backgroundColor,
        modifier = Modifier.size(36.dp)
    ) {
        Box(
            contentAlignment = Alignment.Center,
            modifier = Modifier.fillMaxSize()
        ) {
            Text(
                text = text,
                style = MaterialTheme.typography.labelMedium,
                fontWeight = FontWeight.Bold,
                color = Color.White
            )
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun RecentFixtureCard(fixture: FixtureDto, onClick: () -> Unit) {
    Card(
        onClick = onClick,
        modifier = Modifier.width(200.dp),
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(containerColor = DesignSystem.Colors.background)
    ) {
        Column(
            modifier = Modifier.padding(12.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text(
                text = formatDate(fixture.fixture.date),
                style = MaterialTheme.typography.labelSmall,
                color = DesignSystem.Colors.textSecondary
            )
            
            Spacer(modifier = Modifier.height(8.dp))
            
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceEvenly,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column(
                    horizontalAlignment = Alignment.CenterHorizontally,
                    modifier = Modifier.weight(1f)
                ) {
                    AsyncImage(
                        model = fixture.teams.home.logo,
                        contentDescription = null,
                        modifier = Modifier.size(32.dp)
                    )
                    Text(
                        text = fixture.teams.home.name,
                        style = MaterialTheme.typography.labelSmall,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis,
                        textAlign = TextAlign.Center
                    )
                }
                
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text(
                        text = "${fixture.goals?.home ?: 0} - ${fixture.goals?.away ?: 0}",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold,
                        color = DesignSystem.Colors.textPrimary
                    )
                }
                
                Column(
                    horizontalAlignment = Alignment.CenterHorizontally,
                    modifier = Modifier.weight(1f)
                ) {
                    AsyncImage(
                        model = fixture.teams.away.logo,
                        contentDescription = null,
                        modifier = Modifier.size(32.dp)
                    )
                    Text(
                        text = fixture.teams.away.name,
                        style = MaterialTheme.typography.labelSmall,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis,
                        textAlign = TextAlign.Center
                    )
                }
            }
        }
    }
}

@Composable
private fun VenueSection(teamProfile: TeamProfileDetails) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = DesignSystem.Colors.surface)
    ) {
        Column(modifier = Modifier.padding(20.dp)) {
            Text(
                text = "홈 구장",
                style = MaterialTheme.typography.titleLarge,
                fontWeight = FontWeight.Bold,
                color = DesignSystem.Colors.textPrimary
            )
            
            Spacer(modifier = Modifier.height(16.dp))
            
            teamProfile.venueImage?.let { image ->
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(180.dp),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    AsyncImage(
                        model = image,
                        contentDescription = teamProfile.venueName,
                        modifier = Modifier.fillMaxSize(),
                        contentScale = ContentScale.Crop
                    )
                }
                Spacer(modifier = Modifier.height(16.dp))
            }
            
            Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                teamProfile.venueName?.let {
                    VenueInfoRow(Icons.Default.SportsSoccer, "구장명", it)
                }
                teamProfile.venueCity?.let {
                    VenueInfoRow(Icons.Default.LocationOn, "위치", it)
                }
                teamProfile.venueCapacity?.let {
                    VenueInfoRow(
                        Icons.Default.People,
                        "수용 인원",
                        "${it.toString().replace(Regex("(\\d)(?=(\\d{3})+$)"), "$1,")}명"
                    )
                }
                teamProfile.venueSurface?.let {
                    VenueInfoRow(Icons.Default.Grass, "표면", it)
                }
                teamProfile.venueAddress?.let {
                    VenueInfoRow(Icons.Default.Map, "주소", it)
                }
            }
        }
    }
}

@Composable
private fun VenueInfoRow(
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    label: String,
    value: String
) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        verticalAlignment = Alignment.Top
    ) {
        Icon(
            imageVector = icon,
            contentDescription = null,
            modifier = Modifier.size(20.dp),
            tint = DesignSystem.Colors.textSecondary
        )
        
        Spacer(modifier = Modifier.width(12.dp))
        
        Column(modifier = Modifier.weight(1f)) {
            Text(
                text = label,
                style = MaterialTheme.typography.bodySmall,
                color = DesignSystem.Colors.textSecondary
            )
            Text(
                text = value,
                style = MaterialTheme.typography.bodyMedium,
                color = DesignSystem.Colors.textPrimary
            )
        }
    }
}

@Composable
private fun SquadPreviewSection(
    squad: List<SquadPlayerDto>,
    onShowFullSquad: () -> Unit,
    isLoading: Boolean = false
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = DesignSystem.Colors.surface)
    ) {
        Column(modifier = Modifier.padding(20.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "선수단",
                    style = MaterialTheme.typography.titleLarge,
                    fontWeight = FontWeight.Bold,
                    color = DesignSystem.Colors.textPrimary
                )
                
                TextButton(onClick = onShowFullSquad) {
                    Text(text = "전체 보기", color = DesignSystem.Colors.accent)
                }
            }
            
            Spacer(modifier = Modifier.height(16.dp))
            
            when {
                isLoading -> {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(80.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        CircularProgressIndicator(
                            color = DesignSystem.Colors.accent,
                            modifier = Modifier.size(32.dp)
                        )
                    }
                }
                squad.isEmpty() -> {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(vertical = 24.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Column(
                            horizontalAlignment = Alignment.CenterHorizontally,
                            verticalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            Icon(
                                imageVector = Icons.Default.Groups,
                                contentDescription = null,
                                modifier = Modifier.size(48.dp),
                                tint = DesignSystem.Colors.textTertiary
                            )
                            Text(
                                text = "선수단 정보를 불러오는 중입니다",
                                style = MaterialTheme.typography.bodyMedium,
                                color = DesignSystem.Colors.textSecondary
                            )
                        }
                    }
                }
                else -> {
                    val positions = squad.groupBy { it.position }
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceEvenly
                    ) {
                        listOf("Goalkeeper", "Defender", "Midfielder", "Attacker").forEach { position ->
                            val count = positions[position]?.size ?: 0
                            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                Text(
                                    text = "$count",
                                    style = MaterialTheme.typography.titleLarge,
                                    fontWeight = FontWeight.Bold,
                                    color = DesignSystem.Colors.accent
                                )
                                Text(
                                    text = getPositionKoreanName(position),
                                    style = MaterialTheme.typography.bodySmall,
                                    color = DesignSystem.Colors.textSecondary
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun TeamSquadTab(
    teamProfile: TeamProfileDetails,
    onPlayerClick: (Int) -> Unit
) {
    val squad = teamProfile.squad?.players ?: emptyList()
    val groupedPlayers = squad.groupBy { it.position }
    
    // 디버깅용 로그
    println("TeamSquadTab - Squad size: ${squad.size}")
    println("TeamSquadTab - Has Squad: ${teamProfile.hasSquad}")
    if (squad.isNotEmpty()) {
        println("TeamSquadTab - First player: ${squad.first().name}")
    }
    
    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        if (squad.isEmpty()) {
            item {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = 64.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Column(
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.spacedBy(16.dp)
                    ) {
                        Icon(
                            imageVector = Icons.Default.Groups,
                            contentDescription = null,
                            modifier = Modifier.size(80.dp),
                            tint = DesignSystem.Colors.textTertiary
                        )
                        Text(
                            text = "선수단 정보를 불러오는 중입니다",
                            style = MaterialTheme.typography.titleMedium,
                            color = DesignSystem.Colors.textSecondary
                        )
                        Text(
                            text = "잠시만 기다려 주세요",
                            style = MaterialTheme.typography.bodyMedium,
                            color = DesignSystem.Colors.textTertiary
                        )
                    }
                }
            }
        } else {
            listOf("Goalkeeper", "Defender", "Midfielder", "Attacker").forEach { position ->
                val players = groupedPlayers[position] ?: emptyList()
                if (players.isNotEmpty()) {
                    item {
                        Text(
                            text = getPositionKoreanName(position),
                            style = MaterialTheme.typography.titleLarge,
                            fontWeight = FontWeight.Bold,
                            color = DesignSystem.Colors.textPrimary,
                            modifier = Modifier.padding(bottom = 12.dp)
                        )
                    }
                    
                    items(players.sortedBy { it.number ?: 99 }) { player ->
                        PlayerCard(player = player, onPlayerClick = onPlayerClick)
                    }
                }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun PlayerCard(
    player: SquadPlayerDto,
    onPlayerClick: (Int) -> Unit
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(containerColor = DesignSystem.Colors.surface),
        onClick = { 
            player.id?.let { playerId ->
                println("PlayerCard - Clicked player: ${player.name}, ID: $playerId")
                onPlayerClick(playerId)
            } ?: run {
                println("PlayerCard - Player ${player.name} has no ID")
            }
        }
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Card(
                modifier = Modifier.size(60.dp),
                shape = CircleShape,
                colors = CardDefaults.cardColors(containerColor = DesignSystem.Colors.background)
            ) {
                Box(
                    contentAlignment = Alignment.Center,
                    modifier = Modifier.fillMaxSize()
                ) {
                    player.photo?.let { photo ->
                        AsyncImage(
                            model = photo,
                            contentDescription = player.name,
                            modifier = Modifier.fillMaxSize(),
                            contentScale = ContentScale.Crop
                        )
                    } ?: Text(
                        text = player.number?.toString() ?: "?",
                        style = MaterialTheme.typography.titleLarge,
                        fontWeight = FontWeight.Bold,
                        color = DesignSystem.Colors.textPrimary
                    )
                }
            }
            
            Spacer(modifier = Modifier.width(16.dp))
            
            Column(modifier = Modifier.weight(1f)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(
                        text = player.name,
                        style = MaterialTheme.typography.bodyLarge,
                        fontWeight = FontWeight.SemiBold,
                        color = DesignSystem.Colors.textPrimary
                    )
                    
                    if (player.isCaptain == true) {
                        Spacer(modifier = Modifier.width(8.dp))
                        Surface(
                            shape = RoundedCornerShape(4.dp),
                            color = DesignSystem.Colors.warning
                        ) {
                            Text(
                                text = "C",
                                modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp),
                                style = MaterialTheme.typography.labelSmall,
                                fontWeight = FontWeight.Bold,
                                color = Color.White
                            )
                        }
                    }
                }
                
                Spacer(modifier = Modifier.height(4.dp))
                
                Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                    player.number?.let { number ->
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(4.dp)
                        ) {
                            Icon(
                                imageVector = Icons.Default.Tag,
                                contentDescription = null,
                                modifier = Modifier.size(14.dp),
                                tint = DesignSystem.Colors.textSecondary
                            )
                            Text(
                                text = number.toString(),
                                style = MaterialTheme.typography.bodySmall,
                                color = DesignSystem.Colors.textSecondary
                            )
                        }
                    }
                    
                    player.age?.let { age ->
                        Text(
                            text = "${age}세",
                            style = MaterialTheme.typography.bodySmall,
                            color = DesignSystem.Colors.textSecondary
                        )
                    }
                    
                    player.nationality?.let { nationality ->
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(4.dp)
                        ) {
                            Icon(
                                imageVector = Icons.Default.Flag,
                                contentDescription = null,
                                modifier = Modifier.size(14.dp),
                                tint = DesignSystem.Colors.textSecondary
                            )
                            Text(
                                text = nationality,
                                style = MaterialTheme.typography.bodySmall,
                                color = DesignSystem.Colors.textSecondary
                            )
                        }
                    }
                }
            }
            
            Icon(
                imageVector = Icons.Default.ArrowForward,
                contentDescription = "선수 상세보기",
                modifier = Modifier.size(16.dp),
                tint = DesignSystem.Colors.textTertiary
            )
        }
    }
}

@Composable
private fun ErrorView(errorMessage: String, onRetry: () -> Unit) {
    Box(
        modifier = Modifier.fillMaxSize(),
        contentAlignment = Alignment.Center
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            Icon(
                imageVector = Icons.Default.ErrorOutline,
                contentDescription = null,
                modifier = Modifier.size(64.dp),
                tint = DesignSystem.Colors.destructive
            )
            Text(
                text = errorMessage,
                style = MaterialTheme.typography.bodyLarge,
                color = DesignSystem.Colors.textSecondary,
                textAlign = TextAlign.Center
            )
            Button(
                onClick = onRetry,
                colors = ButtonDefaults.buttonColors(containerColor = DesignSystem.Colors.accent)
            ) {
                Text("다시 시도", color = Color.White)
            }
        }
    }
}

private fun getPositionKoreanName(position: String): String {
    return when (position) {
        "Goalkeeper" -> "골키퍼"
        "Defender" -> "수비수"
        "Midfielder" -> "미드필더"
        "Attacker" -> "공격수"
        else -> position
    }
}

private fun formatDate(dateString: String): String {
    return try {
        val inputFormat = java.text.SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ssXXX", java.util.Locale.getDefault())
        val outputFormat = java.text.SimpleDateFormat("MM/dd", java.util.Locale.getDefault())
        val date = inputFormat.parse(dateString)
        outputFormat.format(date ?: return dateString)
    } catch (e: Exception) {
        dateString
    }
}

@Composable
private fun TrophySection(teamId: Int) {
    val trophies = TeamTrophiesLibrary.getTrophiesForTeam(teamId)
    
    // 이미 hasTrophyData로 체크했으므로 데이터가 있음이 보장됨
    
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = DesignSystem.Colors.surface)
    ) {
        Column(modifier = Modifier.padding(20.dp)) {
            Text(
                text = "트로피 & 영예",
                style = MaterialTheme.typography.titleLarge,
                fontWeight = FontWeight.Bold,
                color = DesignSystem.Colors.textPrimary
            )
            
            Spacer(modifier = Modifier.height(20.dp))
            
            // 대회별로 그룹화
            val domesticTrophies = trophies.filter { 
                it.competitionType in listOf(
                    TeamTrophiesLibrary.CompetitionType.LEAGUE,
                    TeamTrophiesLibrary.CompetitionType.DOMESTIC_CUP,
                    TeamTrophiesLibrary.CompetitionType.LEAGUE_CUP,
                    TeamTrophiesLibrary.CompetitionType.SUPER_CUP
                )
            }
            
            val europeanTrophies = trophies.filter { 
                it.competitionType in listOf(
                    TeamTrophiesLibrary.CompetitionType.UEFA_CHAMPIONS_LEAGUE,
                    TeamTrophiesLibrary.CompetitionType.UEFA_EUROPA_LEAGUE,
                    TeamTrophiesLibrary.CompetitionType.UEFA_CONFERENCE_LEAGUE,
                    TeamTrophiesLibrary.CompetitionType.UEFA_CUP_WINNERS_CUP,
                    TeamTrophiesLibrary.CompetitionType.UEFA_SUPER_CUP
                )
            }
            
            val worldTrophies = trophies.filter { 
                it.competitionType == TeamTrophiesLibrary.CompetitionType.WORLD_CUP
            }
            
            // 국내 대회
            if (domesticTrophies.isNotEmpty()) {
                TrophyGroupSection("국내 대회", domesticTrophies)
                
                if (europeanTrophies.isNotEmpty() || worldTrophies.isNotEmpty()) {
                    Spacer(modifier = Modifier.height(16.dp))
                    Divider(color = DesignSystem.Colors.border.copy(alpha = 0.3f))
                    Spacer(modifier = Modifier.height(16.dp))
                }
            }
            
            // 유럽 대회
            if (europeanTrophies.isNotEmpty()) {
                TrophyGroupSection("유럽 대회", europeanTrophies)
                
                if (worldTrophies.isNotEmpty()) {
                    Spacer(modifier = Modifier.height(16.dp))
                    Divider(color = DesignSystem.Colors.border.copy(alpha = 0.3f))
                    Spacer(modifier = Modifier.height(16.dp))
                }
            }
            
            // 세계 대회
            if (worldTrophies.isNotEmpty()) {
                TrophyGroupSection("세계 대회", worldTrophies)
            }
        }
    }
}

@Composable
private fun TrophyGroupSection(title: String, trophies: List<TeamTrophiesLibrary.TeamTrophy>) {
    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
        Text(
            text = title,
            style = MaterialTheme.typography.titleMedium,
            fontWeight = FontWeight.SemiBold,
            color = DesignSystem.Colors.textSecondary
        )
        
        trophies.forEach { trophy ->
            TrophyRow(trophy)
        }
    }
}

@Composable
private fun TrophyRow(trophy: TeamTrophiesLibrary.TeamTrophy) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .background(
                DesignSystem.Colors.accent.copy(alpha = 0.05f),
                shape = RoundedCornerShape(12.dp)
            )
            .padding(16.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        // 트로피 아이콘
        Box(
            modifier = Modifier
                .size(48.dp)
                .background(
                    DesignSystem.Colors.accent.copy(alpha = 0.1f),
                    shape = CircleShape
                ),
            contentAlignment = Alignment.Center
        ) {
            Icon(
                imageVector = Icons.Default.EmojiEvents,
                contentDescription = null,
                modifier = Modifier.size(28.dp),
                tint = DesignSystem.Colors.accent
            )
        }
        
        Spacer(modifier = Modifier.width(16.dp))
        
        // 대회 정보
        Column(modifier = Modifier.weight(1f)) {
            Text(
                text = trophy.competition,
                style = MaterialTheme.typography.bodyLarge,
                fontWeight = FontWeight.SemiBold,
                color = DesignSystem.Colors.textPrimary
            )
            
            trophy.lastWin?.let { year ->
                Text(
                    text = "최근 우승: ${year}년",
                    style = MaterialTheme.typography.bodySmall,
                    color = DesignSystem.Colors.textSecondary
                )
            }
        }
        
        // 우승 횟수
        Column(horizontalAlignment = Alignment.End) {
            Text(
                text = trophy.count.toString(),
                style = MaterialTheme.typography.headlineMedium,
                fontWeight = FontWeight.Bold,
                color = DesignSystem.Colors.accent
            )
            Text(
                text = if (trophy.count > 1) "회" else "회",
                style = MaterialTheme.typography.bodySmall,
                color = DesignSystem.Colors.textSecondary
            )
        }
    }
}

@Composable
private fun UpcomingFixtureSection(
    fixtures: List<FixtureDto>,
    teamId: Int,
    onFixtureClick: (Int) -> Unit,
    isLoading: Boolean = false
) {
    val upcomingFixtures = fixtures.filter { fixture ->
        val status = fixture.fixture.status.short
        status != "FT" && status != "AET" && status != "PEN"
    }.sortedBy { it.fixture.date }.take(3)
    
    // 삭제 - 비어있어도 섹션은 표시
    
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = DesignSystem.Colors.surface)
    ) {
        Column(modifier = Modifier.padding(20.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "다음 경기",
                    style = MaterialTheme.typography.titleLarge,
                    fontWeight = FontWeight.Bold,
                    color = DesignSystem.Colors.textPrimary
                )
                
                Icon(
                    imageVector = Icons.Default.CalendarToday,
                    contentDescription = null,
                    modifier = Modifier.size(20.dp),
                    tint = DesignSystem.Colors.textSecondary
                )
            }
            
            Spacer(modifier = Modifier.height(16.dp))
            
            when {
                isLoading -> {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(100.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        CircularProgressIndicator(
                            color = DesignSystem.Colors.accent,
                            modifier = Modifier.size(32.dp)
                        )
                    }
                }
                upcomingFixtures.isEmpty() -> {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(vertical = 32.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Column(
                            horizontalAlignment = Alignment.CenterHorizontally,
                            verticalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            Icon(
                                imageVector = Icons.Default.CalendarToday,
                                contentDescription = null,
                                modifier = Modifier.size(48.dp),
                                tint = DesignSystem.Colors.textTertiary
                            )
                            Text(
                                text = "예정된 경기가 없습니다",
                                style = MaterialTheme.typography.bodyMedium,
                                color = DesignSystem.Colors.textSecondary
                            )
                        }
                    }
                }
                else -> {
                    upcomingFixtures.forEachIndexed { index, fixture ->
                        if (index > 0) {
                            Divider(
                                color = DesignSystem.Colors.border.copy(alpha = 0.3f),
                                modifier = Modifier.padding(vertical = 12.dp)
                            )
                        }
                        UpcomingFixtureRow(
                            fixture = fixture,
                            teamId = teamId,
                            onClick = { onFixtureClick(fixture.fixture.id) }
                        )
                    }
                }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun UpcomingFixtureRow(
    fixture: FixtureDto,
    teamId: Int,
    onClick: () -> Unit
) {
    val isHome = fixture.teams.home.id == teamId
    val opponent = if (isHome) fixture.teams.away else fixture.teams.home
    
    Card(
        onClick = onClick,
        colors = CardDefaults.cardColors(
            containerColor = DesignSystem.Colors.background
        ),
        shape = RoundedCornerShape(12.dp)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            // 날짜/시간 정보
            Column(
                horizontalAlignment = Alignment.CenterHorizontally,
                modifier = Modifier.width(60.dp)
            ) {
                Text(
                    text = formatDateShort(fixture.fixture.date),
                    style = MaterialTheme.typography.bodySmall,
                    fontWeight = FontWeight.SemiBold,
                    color = DesignSystem.Colors.textPrimary
                )
                Text(
                    text = formatTime(fixture.fixture.date),
                    style = MaterialTheme.typography.labelSmall,
                    color = DesignSystem.Colors.textSecondary
                )
            }
            
            Spacer(modifier = Modifier.width(16.dp))
            
            // 홈/원정 표시
            Surface(
                shape = RoundedCornerShape(4.dp),
                color = if (isHome) DesignSystem.Colors.success.copy(alpha = 0.1f) 
                       else DesignSystem.Colors.warning.copy(alpha = 0.1f)
            ) {
                Text(
                    text = if (isHome) "홈" else "원정",
                    modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
                    style = MaterialTheme.typography.labelSmall,
                    fontWeight = FontWeight.SemiBold,
                    color = if (isHome) DesignSystem.Colors.success else DesignSystem.Colors.warning
                )
            }
            
            Spacer(modifier = Modifier.width(12.dp))
            
            // 상대팀 정보
            AsyncImage(
                model = opponent.logo,
                contentDescription = null,
                modifier = Modifier.size(32.dp)
            )
            
            Spacer(modifier = Modifier.width(12.dp))
            
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = opponent.name,
                    style = MaterialTheme.typography.bodyMedium,
                    fontWeight = FontWeight.SemiBold,
                    color = DesignSystem.Colors.textPrimary
                )
                
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(4.dp)
                ) {
                    AsyncImage(
                        model = fixture.league.logo,
                        contentDescription = null,
                        modifier = Modifier.size(16.dp)
                    )
                    Text(
                        text = fixture.league.name,
                        style = MaterialTheme.typography.labelSmall,
                        color = DesignSystem.Colors.textSecondary,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                }
            }
            
            Icon(
                imageVector = Icons.Default.ArrowForward,
                contentDescription = "경기 상세보기",
                modifier = Modifier.size(16.dp),
                tint = DesignSystem.Colors.textTertiary
            )
        }
    }
}

private fun formatDateShort(dateString: String): String {
    return try {
        val inputFormat = DateTimeFormatter.ISO_DATE_TIME
        val outputFormat = DateTimeFormatter.ofPattern("MM/dd")
        val dateTime = LocalDateTime.parse(dateString, inputFormat)
        dateTime.format(outputFormat)
    } catch (e: Exception) {
        "날짜 오류"
    }
}

private fun formatTime(dateString: String): String {
    return try {
        val inputFormat = DateTimeFormatter.ISO_DATE_TIME
        val outputFormat = DateTimeFormatter.ofPattern("HH:mm")
        val dateTime = LocalDateTime.parse(dateString, inputFormat)
        val localDateTime = dateTime.atZone(ZoneId.of("UTC")).withZoneSameInstant(ZoneId.systemDefault())
        localDateTime.format(outputFormat)
    } catch (e: Exception) {
        "시간 오류"
    }
}

private fun getTeamMotto(teamId: Int): String {
    return when (teamId) {
        33 -> "Glory Glory Man United"  // Manchester United
        40 -> "You'll Never Walk Alone"  // Liverpool
        50 -> "We're Not Really Here"  // Manchester City
        42 -> "Victoria Concordia Crescit"  // Arsenal (Victory Through Harmony)
        49 -> "Pride of London"  // Chelsea
        47 -> "To Dare Is To Do"  // Tottenham
        541 -> "¡Hala Madrid!"  // Real Madrid
        529 -> "Més que un club"  // Barcelona (More than a club)
        157 -> "Mia san mia"  // Bayern Munich (We are who we are)
        496 -> "Fino alla fine"  // Juventus (Until the end)
        489 -> "Forza Milan"  // AC Milan
        505 -> "Amala"  // Inter Milan
        85 -> "Ici c'est Paris"  // PSG (This is Paris)
        530 -> "Coraje y Corazón"  // Atletico Madrid (Courage and Heart)
        165 -> "Echte Liebe"  // Borussia Dortmund (True Love)
        else -> ""
    }
}