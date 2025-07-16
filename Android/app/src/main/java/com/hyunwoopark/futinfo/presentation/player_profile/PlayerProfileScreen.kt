package com.hyunwoopark.futinfo.presentation.player_profile

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Person
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import coil.compose.AsyncImage
import coil.request.ImageRequest
import com.hyunwoopark.futinfo.R
import com.hyunwoopark.futinfo.domain.model.PlayerProfile
import com.hyunwoopark.futinfo.domain.model.PlayerSeasonStats

/**
 * 선수 프로필 화면
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun PlayerProfileScreen(
    onNavigateBack: () -> Unit,
    viewModel: PlayerProfileViewModel = hiltViewModel()
) {
    val state by viewModel.state.collectAsStateWithLifecycle()
    
    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Text(
                        text = state.playerProfile?.player?.name ?: "선수 프로필",
                        fontWeight = FontWeight.Bold
                    )
                },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Icon(
                            imageVector = Icons.Default.ArrowBack,
                            contentDescription = "뒤로 가기"
                        )
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.surface
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
                    LoadingContent()
                }
                state.error != null -> {
                    ErrorContent(
                        error = state.error!!,
                        onRetry = { viewModel.refreshPlayerProfile() }
                    )
                }
                state.playerProfile != null -> {
                    PlayerProfileContent(
                        playerProfile = state.playerProfile!!
                    )
                }
            }
        }
    }
}

@Composable
private fun LoadingContent() {
    Box(
        modifier = Modifier.fillMaxSize(),
        contentAlignment = Alignment.Center
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            CircularProgressIndicator()
            Spacer(modifier = Modifier.height(16.dp))
            Text(
                text = "선수 정보를 불러오는 중...",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
    }
}

@Composable
private fun ErrorContent(
    error: String,
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
                text = error,
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                textAlign = TextAlign.Center
            )
            Spacer(modifier = Modifier.height(16.dp))
            Button(onClick = onRetry) {
                Text("다시 시도")
            }
        }
    }
}

@Composable
private fun PlayerProfileContent(
    playerProfile: PlayerProfile
) {
    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // 선수 기본 정보
        item {
            PlayerBasicInfoCard(playerProfile = playerProfile)
        }
        
        // 시즌별 통계
        if (playerProfile.statistics.isNotEmpty()) {
            items(playerProfile.statistics) { seasonStats ->
                PlayerSeasonStatsCard(seasonStats = seasonStats)
            }
        }
    }
}

@Composable
private fun PlayerBasicInfoCard(
    playerProfile: PlayerProfile
) {
    val player = playerProfile.player
    
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(12.dp),
        elevation = CardDefaults.cardElevation(defaultElevation = 4.dp)
    ) {
        Column(
            modifier = Modifier.padding(20.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            // 선수 사진
            AsyncImage(
                model = ImageRequest.Builder(LocalContext.current)
                    .data(player.photo)
                    .crossfade(true)
                    .build(),
                contentDescription = "${player.name} 사진",
                modifier = Modifier
                    .size(120.dp)
                    .clip(CircleShape)
                    .background(MaterialTheme.colorScheme.surfaceVariant),
                contentScale = ContentScale.Crop,
                fallback = androidx.compose.ui.res.painterResource(android.R.drawable.ic_menu_gallery)
            )
            
            Spacer(modifier = Modifier.height(16.dp))
            
            // 선수 이름
            Text(
                text = player.name,
                style = MaterialTheme.typography.headlineMedium,
                fontWeight = FontWeight.Bold,
                textAlign = TextAlign.Center
            )
            
            // 기본 정보
            Spacer(modifier = Modifier.height(16.dp))
            
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceEvenly
            ) {
                if (player.age != null) {
                    PlayerInfoItem(
                        label = "나이",
                        value = "${player.age}세"
                    )
                }
                
                if (player.nationality != null) {
                    PlayerInfoItem(
                        label = "국적",
                        value = player.nationality
                    )
                }
            }
            
            Spacer(modifier = Modifier.height(12.dp))
            
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceEvenly
            ) {
                if (player.height != null) {
                    PlayerInfoItem(
                        label = "키",
                        value = player.height
                    )
                }
                
                if (player.weight != null) {
                    PlayerInfoItem(
                        label = "몸무게",
                        value = player.weight
                    )
                }
            }
            
            // 부상 상태
            if (player.injured) {
                Spacer(modifier = Modifier.height(12.dp))
                Card(
                    colors = CardDefaults.cardColors(
                        containerColor = MaterialTheme.colorScheme.errorContainer
                    ),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Text(
                        text = "부상 중",
                        modifier = Modifier.padding(8.dp),
                        style = MaterialTheme.typography.bodyMedium,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.onErrorContainer,
                        textAlign = TextAlign.Center
                    )
                }
            }
        }
    }
}

@Composable
private fun PlayerInfoItem(
    label: String,
    value: String
) {
    Column(
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Text(
            text = label,
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
        Text(
            text = value,
            style = MaterialTheme.typography.bodyMedium,
            fontWeight = FontWeight.Medium
        )
    }
}

@Composable
private fun PlayerSeasonStatsCard(
    seasonStats: PlayerSeasonStats
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(12.dp),
        elevation = CardDefaults.cardElevation(defaultElevation = 4.dp)
    ) {
        Column(
            modifier = Modifier.padding(16.dp)
        ) {
            // 팀 및 리그 정보
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text(
                        text = seasonStats.team?.name ?: "알 수 없는 팀",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold
                    )
                    Text(
                        text = "${seasonStats.league?.name ?: "알 수 없는 리그"} ${seasonStats.league?.season ?: ""}",
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
                
                if (seasonStats.games?.position != null) {
                    Card(
                        colors = CardDefaults.cardColors(
                            containerColor = MaterialTheme.colorScheme.primaryContainer
                        )
                    ) {
                        Text(
                            text = seasonStats.games.position,
                            modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
                            style = MaterialTheme.typography.bodySmall,
                            fontWeight = FontWeight.Medium,
                            color = MaterialTheme.colorScheme.onPrimaryContainer
                        )
                    }
                }
            }
            
            Spacer(modifier = Modifier.height(16.dp))
            
            // 주요 통계
            LazyColumn(
                modifier = Modifier.height(200.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                // 경기 통계
                seasonStats.games?.let { games ->
                    item {
                        StatRow("출전 경기", "${games.appearances}")
                    }
                    item {
                        StatRow("선발 출전", "${games.lineups}")
                    }
                    item {
                        StatRow("출전 시간", "${games.minutes}분")
                    }
                    if (games.rating != null) {
                        item {
                            StatRow("평점", games.rating)
                        }
                    }
                }
                
                // 골 및 어시스트
                seasonStats.goals?.let { goals ->
                    item {
                        StatRow("골", "${goals.total}")
                    }
                    item {
                        StatRow("어시스트", "${goals.assists}")
                    }
                }
                
                // 슛 통계
                seasonStats.shots?.let { shots ->
                    item {
                        StatRow("총 슛", "${shots.total}")
                    }
                    item {
                        StatRow("유효 슛", "${shots.on}")
                    }
                }
                
                // 패스 통계
                seasonStats.passes?.let { passes ->
                    item {
                        StatRow("총 패스", "${passes.total}")
                    }
                    item {
                        StatRow("패스 성공률", passes.accuracy)
                    }
                }
                
                // 카드
                seasonStats.cards?.let { cards ->
                    if (cards.yellow > 0) {
                        item {
                            StatRow("옐로우 카드", "${cards.yellow}")
                        }
                    }
                    if (cards.red > 0) {
                        item {
                            StatRow("레드 카드", "${cards.red}")
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun StatRow(
    label: String,
    value: String
) {
    Row(
        modifier = Modifier.fillMaxWidth(),
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
            fontWeight = FontWeight.Medium
        )
    }
}