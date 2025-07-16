package com.hyunwoopark.futinfo.presentation.all_leagues

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Search
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
import com.hyunwoopark.futinfo.presentation.leagues.LeaguesViewModel
import com.hyunwoopark.futinfo.util.LeagueLogoMapper
import com.hyunwoopark.futinfo.util.LeagueNameLocalizer

/**
 * 모든 리그를 표시하는 화면 (iOS 스타일)
 * 
 * 주요 리그 화면에서 "모든 리그 보기" 버튼을 눌렀을 때 표시되는 화면입니다.
 * 검색 기능과 함께 전체 리그 목록을 제공합니다.
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AllLeaguesScreen(
    viewModel: LeaguesViewModel = hiltViewModel(),
    onBackClick: () -> Unit = {},
    onLeagueClick: (Int, String) -> Unit = { _, _ -> }
) {
    val state by viewModel.state.collectAsStateWithLifecycle()
    var searchQuery by remember { mutableStateOf("") }
    
    // 모든 리그 모드로 전환
    LaunchedEffect(Unit) {
        viewModel.showAllLeagues()
    }
    
    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Text(
                        text = "모든 리그",
                        style = MaterialTheme.typography.headlineSmall,
                        fontWeight = FontWeight.Bold
                    )
                },
                navigationIcon = {
                    IconButton(onClick = onBackClick) {
                        Icon(
                            imageVector = Icons.Default.ArrowBack,
                            contentDescription = "뒤로가기",
                            tint = MaterialTheme.colorScheme.onSurface
                        )
                    }
                },
                actions = {
                    IconButton(
                        onClick = { /* TODO: 검색 기능 구현 */ }
                    ) {
                        Icon(
                            imageVector = Icons.Default.Search,
                            contentDescription = "검색",
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
                    AllLeaguesContent(
                        leagues = state.allLeagues,
                        searchQuery = searchQuery,
                        onSearchQueryChange = { searchQuery = it },
                        onLeagueClick = onLeagueClick
                    )
                }
            }
        }
    }
}

/**
 * 모든 리그 목록을 표시하는 컨텐츠
 */
@Composable
private fun AllLeaguesContent(
    leagues: List<LeagueDetailsDto>,
    searchQuery: String,
    onSearchQueryChange: (String) -> Unit,
    onLeagueClick: (Int, String) -> Unit = { _, _ -> }
) {
    // 검색 필터링
    val filteredLeagues = remember(leagues, searchQuery) {
        if (searchQuery.isBlank()) {
            leagues
        } else {
            leagues.filter { league ->
                league.league?.name?.contains(searchQuery, ignoreCase = true) == true ||
                league.country?.name?.contains(searchQuery, ignoreCase = true) == true
            }
        }
    }
    
    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
    ) {
        // 검색 바
        SearchBar(
            query = searchQuery,
            onQueryChange = onSearchQueryChange,
            modifier = Modifier.padding(16.dp)
        )
        
        // 리그 개수 표시
        Text(
            text = "${filteredLeagues.size}개의 리그",
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp)
        )
        
        if (filteredLeagues.isEmpty()) {
            EmptySearchScreen(searchQuery = searchQuery)
        } else {
            LazyColumn(
                modifier = Modifier.fillMaxSize(),
                contentPadding = PaddingValues(horizontal = 16.dp, vertical = 8.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                items(filteredLeagues) { league ->
                    CompactLeagueCard(
                        league = league,
                        onLeagueClick = onLeagueClick
                    )
                }
            }
        }
    }
}

/**
 * 검색 바 컴포넌트
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun SearchBar(
    query: String,
    onQueryChange: (String) -> Unit,
    modifier: Modifier = Modifier
) {
    OutlinedTextField(
        value = query,
        onValueChange = onQueryChange,
        placeholder = {
            Text(
                text = "리그 또는 국가 검색...",
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        },
        leadingIcon = {
            Icon(
                imageVector = Icons.Default.Search,
                contentDescription = "검색",
                tint = MaterialTheme.colorScheme.onSurfaceVariant
            )
        },
        modifier = modifier.fillMaxWidth(),
        shape = RoundedCornerShape(12.dp),
        colors = OutlinedTextFieldDefaults.colors(
            focusedBorderColor = MaterialTheme.colorScheme.primary,
            unfocusedBorderColor = MaterialTheme.colorScheme.outline
        )
    )
}

/**
 * 컴팩트한 리그 카드 (모든 리그 화면용)
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun CompactLeagueCard(
    league: LeagueDetailsDto,
    onLeagueClick: (Int, String) -> Unit = { _, _ -> }
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp),
        colors = CardDefaults.cardColors(
            containerColor = Color.White
        ),
        shape = RoundedCornerShape(8.dp),
        onClick = {
            onLeagueClick(league.league.id, league.league.name)
        }
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(12.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            // 리그 로고 (작은 사이즈)
            Box(
                modifier = Modifier
                    .size(40.dp)
                    .clip(RoundedCornerShape(8.dp))
                    .background(Color(0xFFF5F5F5)),
                contentAlignment = Alignment.Center
            ) {
                val correctLogoUrl = LeagueLogoMapper.getLeagueTabLogoUrl(league.league.id)
                AsyncImage(
                    model = correctLogoUrl,
                    contentDescription = league.league.name,
                    modifier = Modifier
                        .size(32.dp)
                        .align(Alignment.Center)
                )
            }
            
            Spacer(modifier = Modifier.width(12.dp))
            
            // 리그 정보
            Column(
                modifier = Modifier.weight(1f)
            ) {
                Text(
                    text = LeagueNameLocalizer.getLocalizedName(league.league.id, league.league.name),
                    style = MaterialTheme.typography.bodyLarge,
                    fontWeight = FontWeight.Medium,
                    color = Color.Black,
                    fontSize = 16.sp
                )
                
                league.country?.let { country ->
                    Text(
                        text = country.name,
                        style = MaterialTheme.typography.bodySmall,
                        color = Color.Gray,
                        fontSize = 13.sp
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
 * 검색 결과가 없을 때 표시하는 화면
 */
@Composable
private fun EmptySearchScreen(searchQuery: String) {
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
                text = if (searchQuery.isBlank()) "표시할 리그가 없습니다" else "'$searchQuery'에 대한 검색 결과가 없습니다",
                style = MaterialTheme.typography.bodyLarge,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                textAlign = TextAlign.Center
            )
            if (searchQuery.isNotBlank()) {
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    text = "다른 검색어를 시도해보세요",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
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