package com.hyunwoopark.futinfo.presentation.leagues

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.List
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.Search
import androidx.compose.material.icons.filled.Star
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import coil.compose.AsyncImage
import com.hyunwoopark.futinfo.data.remote.dto.LeagueDetailsDto
import com.hyunwoopark.futinfo.util.LeagueLogoMapper
import com.hyunwoopark.futinfo.util.LeagueNameLocalizer

/**
 * 리그 목록을 표시하는 메인 화면
 * 
 * LeaguesViewModel을 사용하여 리그 데이터를 가져오고,
 * 상태에 따라 로딩, 에러, 성공 화면을 표시합니다.
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun LeaguesScreen(
    viewModel: LeaguesViewModel = hiltViewModel(),
    onLeagueClick: (Int, String) -> Unit = { _, _ -> },
    onShowAllLeagues: () -> Unit = {}
) {
    val state by viewModel.state.collectAsStateWithLifecycle()
    
    // 주요 리그만 표시하도록 설정 (iOS 스타일)
    LaunchedEffect(Unit) {
        viewModel.showFeaturedLeagues()
    }
    
    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Text(
                        text = if (state.showFeaturedOnly) "주요 리그" else "모든 리그",
                        style = MaterialTheme.typography.headlineSmall,
                        fontWeight = FontWeight.Bold
                    )
                },
                actions = {
                    // 모드 전환 버튼
                    FilterChip(
                        onClick = {
                            if (state.showFeaturedOnly) {
                                viewModel.showAllLeagues()
                            } else {
                                viewModel.showFeaturedLeagues()
                            }
                        },
                        label = {
                            Text(
                                text = if (state.showFeaturedOnly) "모든 리그" else "주요 리그",
                                fontSize = 12.sp
                            )
                        },
                        selected = !state.showFeaturedOnly,
                        leadingIcon = {
                            Icon(
                                imageVector = if (state.showFeaturedOnly) Icons.Default.List else Icons.Default.Star,
                                contentDescription = null,
                                modifier = Modifier.size(16.dp)
                            )
                        },
                        modifier = Modifier.padding(end = 8.dp)
                    )
                    
                    IconButton(
                        onClick = { /* TODO: 검색 기능 구현 */ }
                    ) {
                        Icon(
                            imageVector = Icons.Default.Search,
                            contentDescription = "검색",
                            tint = MaterialTheme.colorScheme.onSurface
                        )
                    }
                    IconButton(
                        onClick = { viewModel.refreshLeagues() }
                    ) {
                        Icon(
                            imageVector = Icons.Default.Refresh,
                            contentDescription = "새로고침",
                            tint = MaterialTheme.colorScheme.onSurface
                        )
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.surface,
                    titleContentColor = MaterialTheme.colorScheme.onSurface
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
                    LoadingScreen()
                }
                state.errorMessage != null -> {
                    ErrorScreen(
                        errorMessage = state.errorMessage ?: "",
                        onRetry = { viewModel.refreshLeagues() }
                    )
                }
                else -> {
                    LeaguesContent(
                        leagues = state.leagues,
                        showFeaturedOnly = state.showFeaturedOnly,
                        onLeagueClick = { leagueId, leagueName ->
                            onLeagueClick(leagueId, leagueName)
                        },
                        onShowAllLeagues = { viewModel.showAllLeagues() },
                        onShowFeaturedLeagues = { viewModel.showFeaturedLeagues() },
                        onAddLeagueClick = { viewModel.showLeagueSelectionDialog() }
                    )
                    
                    // 리그 선택 다이얼로그
                    LeagueSelectionDialog(
                        isVisible = state.showLeagueSelectionDialog,
                        allLeagues = state.allLeagues,
                        userLeagueIds = state.userLeagueIds,
                        onDismiss = { viewModel.hideLeagueSelectionDialog() },
                        onLeagueAdd = { league -> viewModel.addUserLeague(league) },
                        onLeagueRemove = { leagueId -> viewModel.removeUserLeague(leagueId) }
                    )
                }
            }
        }
    }
}

/**
 * 로딩 상태를 표시하는 화면
 */
@Composable
private fun LoadingScreen() {
    Box(
        modifier = Modifier.fillMaxSize(),
        contentAlignment = Alignment.Center
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            CircularProgressIndicator(
                modifier = Modifier.size(48.dp),
                color = MaterialTheme.colorScheme.primary
            )
            Spacer(modifier = Modifier.height(16.dp))
            Text(
                text = "리그 정보를 불러오는 중...",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
    }
}

/**
 * 에러 상태를 표시하는 화면
 */
@Composable
private fun ErrorScreen(
    errorMessage: String,
    onRetry: () -> Unit
) {
    Box(
        modifier = Modifier.fillMaxSize(),
        contentAlignment = Alignment.Center
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center,
            modifier = Modifier.padding(16.dp)
        ) {
            Text(
                text = "오류가 발생했습니다",
                style = MaterialTheme.typography.headlineSmall,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.error
            )
            Spacer(modifier = Modifier.height(8.dp))
            Text(
                text = errorMessage,
                style = MaterialTheme.typography.bodyMedium,
                textAlign = TextAlign.Center,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
            Spacer(modifier = Modifier.height(16.dp))
            Button(
                onClick = onRetry,
                colors = ButtonDefaults.buttonColors(
                    containerColor = MaterialTheme.colorScheme.primary
                )
            ) {
                Text("다시 시도")
            }
        }
    }
}

/**
 * 리그 목록을 표시하는 컨텐츠 (iOS 스타일)
 */
@Composable
private fun LeaguesContent(
    leagues: List<LeagueDetailsDto>,
    showFeaturedOnly: Boolean,
    onLeagueClick: (Int, String) -> Unit = { _, _ -> },
    onShowAllLeagues: () -> Unit = {},
    onShowFeaturedLeagues: () -> Unit = {},
    onAddLeagueClick: () -> Unit = {}
) {
    if (leagues.isEmpty()) {
        EmptyScreen()
    } else {
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .background(MaterialTheme.colorScheme.background),
            contentPadding = PaddingValues(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            // 주요 리그 카드들
            items(leagues) { league ->
                IOSStyleLeagueCard(
                    league = league,
                    onLeagueClick = onLeagueClick
                )
            }
            
            // 리그 추가 버튼 (주요 리그 모드일 때만 표시)
            if (showFeaturedOnly) {
                item {
                    AddLeagueButton(
                        onClick = onAddLeagueClick
                    )
                }
            }
            
            // "모든 리그 보기" 버튼 (주요 리그 모드일 때만 표시)
            if (showFeaturedOnly) {
                item {
                    ShowAllLeaguesButton(
                        onClick = onShowAllLeagues
                    )
                }
            }
            
            // "주요 리그로 돌아가기" 버튼 (모든 리그 모드일 때만 표시)
            if (!showFeaturedOnly) {
                item {
                    BackToFeaturedButton(
                        onClick = onShowFeaturedLeagues
                    )
                }
            }
        }
    }
}

/**
 * "리그 추가" 버튼 (iOS 스타일)
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun AddLeagueButton(
    onClick: () -> Unit = {}
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(top = 8.dp),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.secondaryContainer
        ),
        shape = RoundedCornerShape(12.dp),
        onClick = onClick
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(20.dp),
            horizontalArrangement = Arrangement.Center,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(
                imageVector = Icons.Default.Add,
                contentDescription = "리그 추가",
                tint = MaterialTheme.colorScheme.onSecondaryContainer,
                modifier = Modifier.size(20.dp)
            )
            Spacer(modifier = Modifier.width(8.dp))
            Text(
                text = "리그 추가",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.onSecondaryContainer,
                fontSize = 16.sp
            )
        }
    }
}

/**
 * "모든 리그 보기" 버튼 (iOS 스타일)
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun ShowAllLeaguesButton(
    onClick: () -> Unit = {}
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(top = 8.dp),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.primaryContainer
        ),
        shape = RoundedCornerShape(12.dp),
        onClick = onClick
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(20.dp),
            horizontalArrangement = Arrangement.Center,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = "모든 리그 보기",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.onPrimaryContainer,
                fontSize = 16.sp
            )
            Spacer(modifier = Modifier.width(8.dp))
            Text(
                text = "→",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.onPrimaryContainer,
                fontSize = 16.sp
            )
        }
    }
}

/**
 * 빈 상태를 표시하는 화면
 */
@Composable
private fun EmptyScreen() {
    Box(
        modifier = Modifier.fillMaxSize(),
        contentAlignment = Alignment.Center
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            Text(
                text = "표시할 리그가 없습니다",
                style = MaterialTheme.typography.bodyLarge,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
    }
}

/**
 * iOS 스타일의 리그 카드 컴포넌트
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun IOSStyleLeagueCard(
    league: LeagueDetailsDto,
    onLeagueClick: (Int, String) -> Unit = { _, _ -> }
) {
    Card(
        modifier = Modifier
            .fillMaxWidth(),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
        colors = CardDefaults.cardColors(
            containerColor = Color.White
        ),
        shape = RoundedCornerShape(12.dp),
        onClick = {
            onLeagueClick(league.league.id, league.league.name)
        }
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            // 리그 로고 (iOS 스타일 - 큰 사이즈)
            Box(
                modifier = Modifier
                    .size(60.dp)
                    .clip(RoundedCornerShape(12.dp))
                    .background(Color(0xFFF5F5F5)),
                contentAlignment = Alignment.Center
            ) {
                val correctLogoUrl = LeagueLogoMapper.getLeagueTabLogoUrl(league.league.id)
                AsyncImage(
                    model = correctLogoUrl,
                    contentDescription = league.league.name,
                    modifier = Modifier
                        .size(48.dp)
                        .align(Alignment.Center)
                )
            }
            
            Spacer(modifier = Modifier.width(16.dp))
            
            // 리그 정보 (iOS 스타일)
            Column(
                modifier = Modifier.weight(1f)
            ) {
                Text(
                    text = LeagueNameLocalizer.getLocalizedName(league.league.id, league.league.name),
                    style = MaterialTheme.typography.titleLarge,
                    fontWeight = FontWeight.Bold,
                    color = Color.Black,
                    fontSize = 18.sp
                )
                
                Spacer(modifier = Modifier.height(4.dp))
                
                // 국가 정보 (iOS 스타일 - 회색 글씨)
                league.country?.let { country ->
                    Text(
                        text = country.name,
                        style = MaterialTheme.typography.bodyMedium,
                        color = Color.Gray,
                        fontSize = 15.sp
                    )
                }
            }
        }
    }
}

/**
 * 리그별 색상 반환 (iOS 스크린샷 기반)
 */
private fun getLeagueColor(leagueName: String): Color {
    return when {
        leagueName.contains("Premier League", ignoreCase = true) -> Color(0xFF6A1B9A) // 보라색
        leagueName.contains("La Liga", ignoreCase = true) -> Color(0xFFD32F2F) // 빨간색
        leagueName.contains("Serie A", ignoreCase = true) -> Color(0xFF1976D2) // 파란색
        leagueName.contains("Bundesliga", ignoreCase = true) -> Color(0xFFD32F2F) // 빨간색
        leagueName.contains("Ligue 1", ignoreCase = true) -> Color(0xFF424242) // 검은색
        leagueName.contains("Champions League", ignoreCase = true) -> Color(0xFF1976D2) // 파란색
        leagueName.contains("Europa League", ignoreCase = true) -> Color(0xFFFF9800) // 주황색
        else -> Color(0xFF1976D2) // 기본 파란색
    }
}

/**
 * 리그명에서 이니셜 추출
 */
private fun getLeagueInitials(leagueName: String): String {
    return when {
        leagueName.contains("Premier League", ignoreCase = true) -> "PL"
        leagueName.contains("La Liga", ignoreCase = true) -> "LL"
        leagueName.contains("Serie A", ignoreCase = true) -> "SA"
        leagueName.contains("Bundesliga", ignoreCase = true) -> "BL"
        leagueName.contains("Ligue 1", ignoreCase = true) -> "L1"
        leagueName.contains("Champions League", ignoreCase = true) -> "CL"
        leagueName.contains("Europa League", ignoreCase = true) -> "EL"
        else -> leagueName.split(" ").take(2).joinToString("") { it.take(1).uppercase() }
    }
}
/**
 * "주요 리그로 돌아가기" 버튼 (iOS 스타일)
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun BackToFeaturedButton(
    onClick: () -> Unit = {}
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(top = 8.dp),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.tertiaryContainer
        ),
        shape = RoundedCornerShape(12.dp),
        onClick = onClick
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(20.dp),
            horizontalArrangement = Arrangement.Center,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(
                imageVector = Icons.Default.Star,
                contentDescription = "주요 리그로 돌아가기",
                tint = MaterialTheme.colorScheme.onTertiaryContainer,
                modifier = Modifier.size(20.dp)
            )
            Spacer(modifier = Modifier.width(8.dp))
            Text(
                text = "주요 리그로 돌아가기",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.onTertiaryContainer,
                fontSize = 16.sp
            )
        }
    }
}