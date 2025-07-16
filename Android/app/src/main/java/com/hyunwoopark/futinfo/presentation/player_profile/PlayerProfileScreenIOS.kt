package com.hyunwoopark.futinfo.presentation.player_profile

import androidx.compose.animation.*
import androidx.compose.animation.core.*
import androidx.compose.foundation.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.*
import androidx.compose.foundation.pager.*
import androidx.compose.material3.TabRowDefaults.tabIndicatorOffset
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import kotlinx.coroutines.launch
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.*
import androidx.compose.ui.graphics.*
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
import com.hyunwoopark.futinfo.domain.model.*
import com.hyunwoopark.futinfo.presentation.theme.FutInfoDesignSystem
import com.hyunwoopark.futinfo.presentation.design_system.DesignSystem
import kotlin.math.roundToInt

/**
 * iOS 스타일 선수 프로필 화면
 * 팬들이 감동할 수 있는 디자인과 정보를 제공
 */
@OptIn(ExperimentalMaterial3Api::class, ExperimentalFoundationApi::class)
@Composable
fun PlayerProfileScreenIOS(
    onNavigateBack: () -> Unit,
    onTeamClick: (Int) -> Unit = {},
    viewModel: PlayerProfileViewModel = hiltViewModel()
) {
    val state by viewModel.state.collectAsStateWithLifecycle()
    val pagerState = rememberPagerState(pageCount = { 4 })
    val scrollState = rememberScrollState()
    val coroutineScope = rememberCoroutineScope()
    
    Scaffold(
        containerColor = DesignSystem.Colors.background,
        topBar = {
            CenterAlignedTopAppBar(
                title = {
                    Text(
                        text = state.playerProfile?.player?.name ?: "선수 프로필",
                        fontWeight = FontWeight.Bold,
                        color = DesignSystem.Colors.textPrimary,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Icon(
                            imageVector = Icons.Default.ArrowBack,
                            contentDescription = "뒤로가기",
                            tint = DesignSystem.Colors.accent
                        )
                    }
                },
                colors = TopAppBarDefaults.centerAlignedTopAppBarColors(
                    containerColor = DesignSystem.Colors.background
                )
            )
        }
    ) { paddingValues ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
        ) {
            when {
                state.isLoading -> {
                    Box(
                        modifier = Modifier.fillMaxSize(),
                        contentAlignment = Alignment.Center
                    ) {
                        CircularProgressIndicator(
                            color = DesignSystem.Colors.accent
                        )
                    }
                }
                state.error != null -> {
                    Box(
                        modifier = Modifier.fillMaxSize(),
                        contentAlignment = Alignment.Center
                    ) {
                        Column(
                            horizontalAlignment = Alignment.CenterHorizontally,
                            verticalArrangement = Arrangement.spacedBy(16.dp)
                        ) {
                            Icon(
                                imageVector = Icons.Default.Error,
                                contentDescription = null,
                                modifier = Modifier.size(64.dp),
                                tint = DesignSystem.Colors.destructive
                            )
                            Text(
                                text = state.error ?: "오류가 발생했습니다",
                                style = MaterialTheme.typography.bodyLarge,
                                color = DesignSystem.Colors.textSecondary,
                                textAlign = TextAlign.Center
                            )
                        }
                    }
                }
                state.playerProfile != null -> {
                    val playerProfile = state.playerProfile!!
                    Column(
                        modifier = Modifier.fillMaxSize()
                    ) {
                        // 선수 헤더 정보
                        PlayerHeaderSection(
                            playerProfile = playerProfile,
                            onTeamClick = onTeamClick
                        )
                        
                        // 탭 바
                        ScrollableTabRow(
                            selectedTabIndex = pagerState.currentPage,
                            containerColor = DesignSystem.Colors.background,
                            contentColor = DesignSystem.Colors.textPrimary,
                            edgePadding = 16.dp,
                            indicator = { tabPositions ->
                                Box(
                                    modifier = Modifier
                                        .tabIndicatorOffset(tabPositions[pagerState.currentPage])
                                        .fillMaxWidth()
                                        .height(3.dp)
                                        .background(
                                            color = DesignSystem.Colors.accent,
                                            shape = RoundedCornerShape(topStart = 3.dp, topEnd = 3.dp)
                                        )
                                )
                            }
                        ) {
                            val tabs = listOf("통계", "경기별", "경력", "정보")
                            tabs.forEachIndexed { index, title ->
                                Tab(
                                    selected = pagerState.currentPage == index,
                                    onClick = {
                                        coroutineScope.launch {
                                            pagerState.animateScrollToPage(index)
                                        }
                                    },
                                    text = {
                                        Text(
                                            text = title,
                                            fontWeight = if (pagerState.currentPage == index) 
                                                FontWeight.Bold else FontWeight.Normal
                                        )
                                    }
                                )
                            }
                        }
                        
                        // 탭 컨텐츠
                        HorizontalPager(
                            state = pagerState,
                            modifier = Modifier.fillMaxSize()
                        ) { page ->
                            when (page) {
                                0 -> PlayerStatsTab(playerProfile = playerProfile)
                                1 -> PlayerMatchesTab(playerProfile = playerProfile)
                                2 -> PlayerCareerTab(playerProfile = playerProfile, onTeamClick = onTeamClick)
                                3 -> PlayerInfoTab(playerProfile = playerProfile)
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun PlayerHeaderSection(
    playerProfile: PlayerProfile,
    onTeamClick: (Int) -> Unit
) {
    val currentStats = playerProfile.statistics.firstOrNull()
    
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(16.dp),
        shape = RoundedCornerShape(20.dp),
        colors = CardDefaults.cardColors(
            containerColor = DesignSystem.Colors.surface
        )
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(20.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(16.dp),
                verticalAlignment = Alignment.Top
            ) {
                // 선수 사진
                Card(
                    modifier = Modifier.size(120.dp),
                    shape = CircleShape,
                    colors = CardDefaults.cardColors(
                        containerColor = DesignSystem.Colors.background
                    )
                ) {
                    AsyncImage(
                        model = ImageRequest.Builder(LocalContext.current)
                            .data(playerProfile.player.photo)
                            .crossfade(true)
                            .build(),
                        contentDescription = playerProfile.player.name,
                        modifier = Modifier.fillMaxSize(),
                        contentScale = ContentScale.Crop
                    )
                }
                
                // 선수 정보
                Column(
                    modifier = Modifier.weight(1f),
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Text(
                        text = playerProfile.player.name,
                        style = MaterialTheme.typography.headlineSmall,
                        fontWeight = FontWeight.Bold,
                        color = DesignSystem.Colors.textPrimary
                    )
                    
                    currentStats?.team?.let { team ->
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(8.dp),
                            modifier = Modifier.clickable { onTeamClick(team.id) }
                        ) {
                            AsyncImage(
                                model = team.logo,
                                contentDescription = team.name,
                                modifier = Modifier.size(24.dp)
                            )
                            Text(
                                text = team.name,
                                style = MaterialTheme.typography.bodyLarge,
                                color = DesignSystem.Colors.accent
                            )
                        }
                    }
                    
                    Row(
                        horizontalArrangement = Arrangement.spacedBy(16.dp)
                    ) {
                        playerProfile.player.nationality?.let { nationality ->
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(4.dp)
                            ) {
                                Icon(
                                    imageVector = Icons.Default.Flag,
                                    contentDescription = null,
                                    modifier = Modifier.size(16.dp),
                                    tint = DesignSystem.Colors.textSecondary
                                )
                                Text(
                                    text = nationality,
                                    style = MaterialTheme.typography.bodyMedium,
                                    color = DesignSystem.Colors.textSecondary
                                )
                            }
                        }
                        
                        playerProfile.player.age?.let { age ->
                            Text(
                                text = "${age}세",
                                style = MaterialTheme.typography.bodyMedium,
                                color = DesignSystem.Colors.textSecondary
                            )
                        }
                    }
                    
                    currentStats?.games?.let { games ->
                        Row(
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            games.position?.let { position ->
                                Surface(
                                    shape = RoundedCornerShape(12.dp),
                                    color = DesignSystem.Colors.accent.copy(alpha = 0.1f)
                                ) {
                                    Text(
                                        text = getPositionKoreanName(position),
                                        modifier = Modifier.padding(horizontal = 12.dp, vertical = 4.dp),
                                        style = MaterialTheme.typography.labelMedium,
                                        fontWeight = FontWeight.SemiBold,
                                        color = DesignSystem.Colors.accent
                                    )
                                }
                            }
                            
                            games.number?.let { number ->
                                Surface(
                                    shape = RoundedCornerShape(12.dp),
                                    color = DesignSystem.Colors.textTertiary.copy(alpha = 0.1f)
                                ) {
                                    Text(
                                        text = "#$number",
                                        modifier = Modifier.padding(horizontal = 12.dp, vertical = 4.dp),
                                        style = MaterialTheme.typography.labelMedium,
                                        fontWeight = FontWeight.Bold,
                                        color = DesignSystem.Colors.textPrimary
                                    )
                                }
                            }
                        }
                    }
                }
            }
            
            // 주요 스탯 요약
            currentStats?.let { stats ->
                Spacer(modifier = Modifier.height(20.dp))
                Divider(color = DesignSystem.Colors.border.copy(alpha = 0.3f))
                Spacer(modifier = Modifier.height(16.dp))
                
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceEvenly
                ) {
                    StatItem(
                        value = stats.goals?.total?.toString() ?: "0",
                        label = "골",
                        icon = Icons.Default.SportsSoccer
                    )
                    StatItem(
                        value = stats.goals?.assists?.toString() ?: "0",
                        label = "어시스트",
                        icon = Icons.Default.AssistWalker
                    )
                    StatItem(
                        value = stats.games?.appearances?.toString() ?: "0",
                        label = "경기",
                        icon = Icons.Default.Stadium
                    )
                    StatItem(
                        value = stats.games?.rating?.let { 
                            String.format("%.1f", it.toDoubleOrNull() ?: 0.0) 
                        } ?: "-",
                        label = "평점",
                        icon = Icons.Default.Star
                    )
                }
            }
        }
    }
}

@Composable
private fun StatItem(
    value: String,
    label: String,
    icon: androidx.compose.ui.graphics.vector.ImageVector
) {
    Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(4.dp)
    ) {
        Icon(
            imageVector = icon,
            contentDescription = null,
            modifier = Modifier.size(20.dp),
            tint = DesignSystem.Colors.textTertiary
        )
        Text(
            text = value,
            style = MaterialTheme.typography.titleLarge,
            fontWeight = FontWeight.Bold,
            color = DesignSystem.Colors.accent
        )
        Text(
            text = label,
            style = MaterialTheme.typography.bodySmall,
            color = DesignSystem.Colors.textSecondary
        )
    }
}

@Composable
private fun PlayerStatsTab(playerProfile: PlayerProfile) {
    val stats = playerProfile.statistics.firstOrNull()
    
    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // 공격 스탯
        item {
            StatsCard(
                title = "공격",
                icon = Icons.Default.SportsSoccer,
                stats = listOf(
                    PlayerStatRow("골", stats?.goals?.total?.toString() ?: "0"),
                    PlayerStatRow("어시스트", stats?.goals?.assists?.toString() ?: "0"),
                    PlayerStatRow("슈팅", stats?.shots?.total?.toString() ?: "0"),
                    PlayerStatRow("유효 슈팅", stats?.shots?.on?.toString() ?: "0"),
                    PlayerStatRow("드리블 시도", stats?.dribbles?.attempts?.toString() ?: "0"),
                    PlayerStatRow("드리블 성공", stats?.dribbles?.success?.toString() ?: "0")
                )
            )
        }
        
        // 패스 스탯
        item {
            StatsCard(
                title = "패스",
                icon = Icons.Default.SwapHoriz,
                stats = listOf(
                    PlayerStatRow("총 패스", stats?.passes?.total?.toString() ?: "0"),
                    PlayerStatRow("키 패스", stats?.passes?.key?.toString() ?: "0"),
                    PlayerStatRow("패스 정확도", stats?.passes?.accuracy ?: "-")
                )
            )
        }
        
        // 수비 스탯
        item {
            StatsCard(
                title = "수비",
                icon = Icons.Default.Shield,
                stats = listOf(
                    PlayerStatRow("태클", stats?.tackles?.total?.toString() ?: "0"),
                    PlayerStatRow("인터셉트", stats?.tackles?.interceptions?.toString() ?: "0"),
                    PlayerStatRow("블록", stats?.tackles?.blocks?.toString() ?: "0"),
                    PlayerStatRow("듀얼 시도", stats?.duels?.total?.toString() ?: "0"),
                    PlayerStatRow("듀얼 승리", stats?.duels?.won?.toString() ?: "0")
                )
            )
        }
        
        // 징계 스탯
        item {
            StatsCard(
                title = "징계",
                icon = Icons.Default.Warning,
                stats = listOf(
                    PlayerStatRow("옐로우 카드", stats?.cards?.yellow?.toString() ?: "0"),
                    PlayerStatRow("레드 카드", stats?.cards?.red?.toString() ?: "0"),
                    PlayerStatRow("파울", stats?.fouls?.committed?.toString() ?: "0"),
                    PlayerStatRow("파울 유도", stats?.fouls?.drawn?.toString() ?: "0")
                )
            )
        }
        
        // 경기 스탯
        item {
            StatsCard(
                title = "경기",
                icon = Icons.Default.Timer,
                stats = listOf(
                    PlayerStatRow("출전", stats?.games?.appearances?.toString() ?: "0"),
                    PlayerStatRow("선발", stats?.games?.lineups?.toString() ?: "0"),
                    PlayerStatRow("교체 투입", stats?.substitutes?.`in`?.toString() ?: "0"),
                    PlayerStatRow("교체 아웃", stats?.substitutes?.out?.toString() ?: "0"),
                    PlayerStatRow("출전 시간", "${stats?.games?.minutes ?: 0}분")
                )
            )
        }
    }
}

@Composable
private fun StatsCard(
    title: String,
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    stats: List<PlayerStatRow>
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(
            containerColor = DesignSystem.Colors.surface
        )
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp)
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                modifier = Modifier.padding(bottom = 12.dp)
            ) {
                Icon(
                    imageVector = icon,
                    contentDescription = null,
                    modifier = Modifier.size(24.dp),
                    tint = DesignSystem.Colors.accent
                )
                Text(
                    text = title,
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold,
                    color = DesignSystem.Colors.textPrimary
                )
            }
            
            stats.forEach { stat ->
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = 8.dp),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Text(
                        text = stat.label,
                        style = MaterialTheme.typography.bodyMedium,
                        color = DesignSystem.Colors.textSecondary
                    )
                    Text(
                        text = stat.value,
                        style = MaterialTheme.typography.bodyMedium,
                        fontWeight = FontWeight.SemiBold,
                        color = DesignSystem.Colors.textPrimary
                    )
                }
                if (stat != stats.last()) {
                    Divider(
                        color = DesignSystem.Colors.border.copy(alpha = 0.2f),
                        modifier = Modifier.padding(vertical = 4.dp)
                    )
                }
            }
        }
    }
}

data class PlayerStatRow(val label: String, val value: String)

@Composable
private fun PlayerMatchesTab(playerProfile: PlayerProfile) {
    // 최근 경기별 성과 표시
    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        item {
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(
                    containerColor = DesignSystem.Colors.surface
                )
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp),
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    Icon(
                        imageVector = Icons.Default.CalendarMonth,
                        contentDescription = null,
                        modifier = Modifier.size(64.dp),
                        tint = DesignSystem.Colors.textTertiary
                    )
                    Text(
                        text = "경기별 상세 통계는",
                        style = MaterialTheme.typography.bodyLarge,
                        color = DesignSystem.Colors.textSecondary
                    )
                    Text(
                        text = "곧 업데이트 예정입니다",
                        style = MaterialTheme.typography.bodyMedium,
                        color = DesignSystem.Colors.textTertiary
                    )
                }
            }
        }
    }
}

@Composable
private fun PlayerCareerTab(
    playerProfile: PlayerProfile,
    onTeamClick: (Int) -> Unit
) {
    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // 현재 시즌
        playerProfile.statistics.forEach { stats ->
            item {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(
                        containerColor = DesignSystem.Colors.surface
                    )
                ) {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(16.dp)
                    ) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.Top
                        ) {
                            Column(
                                modifier = Modifier.weight(1f)
                            ) {
                                stats.league?.let { league ->
                                    Text(
                                        text = "${league.season}/${(league.season + 1).toString().takeLast(2)}",
                                        style = MaterialTheme.typography.titleMedium,
                                        fontWeight = FontWeight.Bold,
                                        color = DesignSystem.Colors.textPrimary
                                    )
                                    Spacer(modifier = Modifier.height(4.dp))
                                    Row(
                                        verticalAlignment = Alignment.CenterVertically,
                                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                                    ) {
                                        AsyncImage(
                                            model = league.logo,
                                            contentDescription = league.name,
                                            modifier = Modifier.size(24.dp)
                                        )
                                        Text(
                                            text = league.name,
                                            style = MaterialTheme.typography.bodyMedium,
                                            color = DesignSystem.Colors.textSecondary
                                        )
                                    }
                                }
                                
                                stats.team?.let { team ->
                                    Spacer(modifier = Modifier.height(8.dp))
                                    Row(
                                        verticalAlignment = Alignment.CenterVertically,
                                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                                        modifier = Modifier.clickable { onTeamClick(team.id) }
                                    ) {
                                        AsyncImage(
                                            model = team.logo,
                                            contentDescription = team.name,
                                            modifier = Modifier.size(32.dp)
                                        )
                                        Text(
                                            text = team.name,
                                            style = MaterialTheme.typography.bodyLarge,
                                            fontWeight = FontWeight.SemiBold,
                                            color = DesignSystem.Colors.accent
                                        )
                                    }
                                }
                            }
                            
                            // 주요 스탯 표시
                            Column(
                                horizontalAlignment = Alignment.End
                            ) {
                                Row(
                                    horizontalArrangement = Arrangement.spacedBy(16.dp)
                                ) {
                                    Column(
                                        horizontalAlignment = Alignment.CenterHorizontally
                                    ) {
                                        Text(
                                            text = stats.goals?.total?.toString() ?: "0",
                                            style = MaterialTheme.typography.titleLarge,
                                            fontWeight = FontWeight.Bold,
                                            color = DesignSystem.Colors.accent
                                        )
                                        Text(
                                            text = "골",
                                            style = MaterialTheme.typography.bodySmall,
                                            color = DesignSystem.Colors.textSecondary
                                        )
                                    }
                                    Column(
                                        horizontalAlignment = Alignment.CenterHorizontally
                                    ) {
                                        Text(
                                            text = stats.goals?.assists?.toString() ?: "0",
                                            style = MaterialTheme.typography.titleLarge,
                                            fontWeight = FontWeight.Bold,
                                            color = DesignSystem.Colors.accent
                                        )
                                        Text(
                                            text = "어시스트",
                                            style = MaterialTheme.typography.bodySmall,
                                            color = DesignSystem.Colors.textSecondary
                                        )
                                    }
                                    Column(
                                        horizontalAlignment = Alignment.CenterHorizontally
                                    ) {
                                        Text(
                                            text = stats.games?.appearances?.toString() ?: "0",
                                            style = MaterialTheme.typography.titleLarge,
                                            fontWeight = FontWeight.Bold,
                                            color = DesignSystem.Colors.textPrimary
                                        )
                                        Text(
                                            text = "경기",
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
    }
}

@Composable
private fun PlayerInfoTab(playerProfile: PlayerProfile) {
    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // 기본 정보
        item {
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(
                    containerColor = DesignSystem.Colors.surface
                )
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp)
                ) {
                    Text(
                        text = "기본 정보",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold,
                        color = DesignSystem.Colors.textPrimary,
                        modifier = Modifier.padding(bottom = 12.dp)
                    )
                    
                    InfoRow("전체 이름", 
                        "${playerProfile.player.firstname ?: ""} ${playerProfile.player.lastname ?: ""}".trim()
                            .ifEmpty { playerProfile.player.name }
                    )
                    InfoRow("나이", playerProfile.player.age?.let { "${it}세" } ?: "-")
                    InfoRow("국적", playerProfile.player.nationality ?: "-")
                    InfoRow("신장", playerProfile.player.height ?: "-")
                    InfoRow("체중", playerProfile.player.weight ?: "-")
                }
            }
        }
        
        // 출생 정보
        playerProfile.player.birth?.let { birth ->
            item {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(
                        containerColor = DesignSystem.Colors.surface
                    )
                ) {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(16.dp)
                    ) {
                        Text(
                            text = "출생 정보",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold,
                            color = DesignSystem.Colors.textPrimary,
                            modifier = Modifier.padding(bottom = 12.dp)
                        )
                        
                        InfoRow("생년월일", birth.date ?: "-")
                        InfoRow("출생지", birth.place ?: "-")
                        InfoRow("출생 국가", birth.country ?: "-")
                    }
                }
            }
        }
        
        // 경기 정보
        playerProfile.statistics.firstOrNull()?.let { stats ->
            item {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(
                        containerColor = DesignSystem.Colors.surface
                    )
                ) {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(16.dp)
                    ) {
                        Text(
                            text = "경기 정보",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold,
                            color = DesignSystem.Colors.textPrimary,
                            modifier = Modifier.padding(bottom = 12.dp)
                        )
                        
                        InfoRow("포지션", stats.games?.position ?: "-")
                        InfoRow("등번호", stats.games?.number?.toString() ?: "-")
                        InfoRow("주장", if (stats.games?.captain == true) "예" else "아니오")
                        InfoRow("부상", if (playerProfile.player.injured) "부상 중" else "정상")
                    }
                }
            }
        }
    }
}

@Composable
private fun InfoRow(label: String, value: String) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 8.dp),
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Text(
            text = label,
            style = MaterialTheme.typography.bodyMedium,
            color = DesignSystem.Colors.textSecondary
        )
        Text(
            text = value,
            style = MaterialTheme.typography.bodyMedium,
            fontWeight = FontWeight.SemiBold,
            color = DesignSystem.Colors.textPrimary
        )
    }
    Divider(
        color = DesignSystem.Colors.border.copy(alpha = 0.2f),
        modifier = Modifier.padding(vertical = 4.dp)
    )
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