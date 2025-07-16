package com.hyunwoopark.futinfo.presentation.player_profile

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
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import coil.compose.AsyncImage
import coil.request.ImageRequest
import com.hyunwoopark.futinfo.domain.model.PlayerProfile
import com.hyunwoopark.futinfo.domain.model.PlayerSeasonStats
import com.hyunwoopark.futinfo.presentation.design_system.DesignSystem

/**
 * 간소화된 iOS 스타일 선수 프로필 화면
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun PlayerProfileScreenSimple(
    onNavigateBack: () -> Unit,
    onTeamClick: (Int) -> Unit = {},
    viewModel: PlayerProfileViewModel = hiltViewModel()
) {
    val state by viewModel.state.collectAsStateWithLifecycle()
    
    Scaffold(
        modifier = Modifier.background(DesignSystem.Colors.background),
        topBar = {
            TopAppBar(
                title = {
                    Text(
                        text = state.playerProfile?.player?.name ?: "선수 프로필",
                        fontWeight = FontWeight.Bold,
                        color = DesignSystem.Colors.textPrimary
                    )
                },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Icon(
                            imageVector = Icons.Default.ArrowBack,
                            contentDescription = "뒤로 가기",
                            tint = DesignSystem.Colors.textPrimary
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
                            imageVector = Icons.Default.ErrorOutline,
                            contentDescription = null,
                            modifier = Modifier.size(64.dp),
                            tint = DesignSystem.Colors.destructive
                        )
                        Text(
                            text = state.error!!,
                            style = MaterialTheme.typography.bodyLarge,
                            color = DesignSystem.Colors.textSecondary,
                            textAlign = TextAlign.Center
                        )
                        Button(
                            onClick = { viewModel.refreshPlayerProfile() },
                            colors = ButtonDefaults.buttonColors(
                                containerColor = DesignSystem.Colors.accent
                            )
                        ) {
                            Text("다시 시도", color = Color.White)
                        }
                    }
                }
            }
            state.playerProfile != null -> {
                LazyColumn(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(paddingValues),
                    contentPadding = PaddingValues(16.dp),
                    verticalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    // 헤더 카드
                    item {
                        PlayerHeaderCard(playerProfile = state.playerProfile!!)
                    }
                    
                    // 기본 정보
                    item {
                        BasicInfoCard(playerProfile = state.playerProfile!!)
                    }
                    
                    // 시즌 통계
                    items(state.playerProfile!!.statistics) { stats ->
                        SeasonStatsCard(
                            seasonStats = stats,
                            onTeamClick = onTeamClick
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun PlayerHeaderCard(
    playerProfile: PlayerProfile
) {
    val player = playerProfile.player
    
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(20.dp),
        colors = CardDefaults.cardColors(
            containerColor = DesignSystem.Colors.surface
        )
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(20.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            // 선수 사진
            AsyncImage(
                model = ImageRequest.Builder(LocalContext.current)
                    .data(player.photo)
                    .crossfade(true)
                    .build(),
                contentDescription = "${player.name} 사진",
                modifier = Modifier
                    .size(100.dp)
                    .clip(CircleShape)
                    .border(3.dp, Color.White, CircleShape)
                    .background(DesignSystem.Colors.background),
                contentScale = ContentScale.Crop
            )
            
            Spacer(modifier = Modifier.width(20.dp))
            
            // 선수 정보
            Column(
                modifier = Modifier.weight(1f)
            ) {
                Text(
                    text = player.name,
                    style = MaterialTheme.typography.headlineSmall,
                    fontWeight = FontWeight.Bold,
                    color = DesignSystem.Colors.textPrimary
                )
                
                Spacer(modifier = Modifier.height(8.dp))
                
                // 현재 팀
                playerProfile.statistics.firstOrNull()?.team?.let { team ->
                    Row(
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(
                            imageVector = Icons.Default.Groups,
                            contentDescription = null,
                            modifier = Modifier.size(16.dp),
                            tint = DesignSystem.Colors.textSecondary
                        )
                        Spacer(modifier = Modifier.width(4.dp))
                        Text(
                            text = team.name,
                            style = MaterialTheme.typography.bodyMedium,
                            color = DesignSystem.Colors.textSecondary
                        )
                    }
                }
                
                // 포지션
                playerProfile.statistics.firstOrNull()?.games?.position?.let { position ->
                    Spacer(modifier = Modifier.height(4.dp))
                    Surface(
                        shape = RoundedCornerShape(12.dp),
                        color = DesignSystem.Colors.accent.copy(alpha = 0.15f)
                    ) {
                        Text(
                            text = position,
                            modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp),
                            style = MaterialTheme.typography.labelMedium,
                            fontWeight = FontWeight.Medium,
                            color = DesignSystem.Colors.accent
                        )
                    }
                }
                
                // 부상 상태
                if (player.injured) {
                    Spacer(modifier = Modifier.height(8.dp))
                    Surface(
                        shape = RoundedCornerShape(12.dp),
                        color = DesignSystem.Colors.destructive.copy(alpha = 0.15f)
                    ) {
                        Row(
                            modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Icon(
                                imageVector = Icons.Default.LocalHospital,
                                contentDescription = null,
                                modifier = Modifier.size(14.dp),
                                tint = DesignSystem.Colors.destructive
                            )
                            Spacer(modifier = Modifier.width(4.dp))
                            Text(
                                text = "부상",
                                style = MaterialTheme.typography.labelMedium,
                                fontWeight = FontWeight.Medium,
                                color = DesignSystem.Colors.destructive
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun BasicInfoCard(
    playerProfile: PlayerProfile
) {
    val player = playerProfile.player
    
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(
            containerColor = DesignSystem.Colors.surface
        )
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Text(
                text = "기본 정보",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold,
                color = DesignSystem.Colors.textPrimary
            )
            
            InfoRow("나이", "${player.age}세", Icons.Default.Cake)
            InfoRow("국적", player.nationality ?: "-", Icons.Default.Flag)
            InfoRow("키", player.height ?: "-", Icons.Default.Person)
            InfoRow("몸무게", player.weight ?: "-", Icons.Default.Monitor)
        }
    }
}

@Composable
private fun InfoRow(
    label: String,
    value: String,
    icon: androidx.compose.ui.graphics.vector.ImageVector
) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Row(
            verticalAlignment = Alignment.CenterVertically,
            modifier = Modifier.weight(1f)
        ) {
            Icon(
                imageVector = icon,
                contentDescription = null,
                modifier = Modifier.size(20.dp),
                tint = DesignSystem.Colors.textSecondary
            )
            Spacer(modifier = Modifier.width(12.dp))
            Text(
                text = label,
                style = MaterialTheme.typography.bodyMedium,
                color = DesignSystem.Colors.textSecondary
            )
        }
        Text(
            text = value,
            style = MaterialTheme.typography.bodyMedium,
            fontWeight = FontWeight.Medium,
            color = DesignSystem.Colors.textPrimary
        )
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun SeasonStatsCard(
    seasonStats: PlayerSeasonStats,
    onTeamClick: (Int) -> Unit
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(
            containerColor = DesignSystem.Colors.surface
        ),
        onClick = { seasonStats.team?.id?.let { onTeamClick(it) } }
    ) {
        Column(
            modifier = Modifier.padding(16.dp)
        ) {
            // 헤더
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text(
                        text = seasonStats.team?.name ?: "알 수 없는 팀",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold,
                        color = DesignSystem.Colors.textPrimary
                    )
                    Text(
                        text = "${seasonStats.league?.name ?: ""} ${seasonStats.league?.season ?: ""}",
                        style = MaterialTheme.typography.bodySmall,
                        color = DesignSystem.Colors.textSecondary
                    )
                }
                Icon(
                    imageVector = Icons.Default.ArrowForward,
                    contentDescription = "팀 상세보기",
                    tint = DesignSystem.Colors.textTertiary
                )
            }
            
            Spacer(modifier = Modifier.height(16.dp))
            
            // 주요 통계
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceEvenly
            ) {
                StatItem("출전", "${seasonStats.games?.appearances ?: 0}")
                StatItem("골", "${seasonStats.goals?.total ?: 0}")
                StatItem("어시스트", "${seasonStats.goals?.assists ?: 0}")
                StatItem("평점", seasonStats.games?.rating ?: "-")
            }
            
            // 상세 통계
            var expanded by remember { mutableStateOf(false) }
            
            TextButton(
                onClick = { expanded = !expanded },
                modifier = Modifier.fillMaxWidth()
            ) {
                Text(
                    text = if (expanded) "간단히 보기" else "상세 통계",
                    color = DesignSystem.Colors.accent
                )
                Icon(
                    imageVector = if (expanded) Icons.Default.ExpandLess else Icons.Default.ExpandMore,
                    contentDescription = null,
                    tint = DesignSystem.Colors.accent
                )
            }
            
            if (expanded) {
                Divider(color = DesignSystem.Colors.border)
                Spacer(modifier = Modifier.height(8.dp))
                
                Column(
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    DetailStatRow("선발 출전", "${seasonStats.games?.lineups ?: 0}")
                    DetailStatRow("출전 시간", "${seasonStats.games?.minutes ?: 0}분")
                    
                    seasonStats.shots?.let { shots ->
                        DetailStatRow("총 슛", "${shots.total ?: 0}")
                        DetailStatRow("유효 슛", "${shots.on ?: 0}")
                    }
                    
                    seasonStats.passes?.let { passes ->
                        DetailStatRow("패스 성공률", "${passes.accuracy ?: 0}%")
                        DetailStatRow("키 패스", "${passes.key ?: 0}")
                    }
                    
                    DetailStatRow("옐로우 카드", "${seasonStats.cards?.yellow ?: 0}")
                    DetailStatRow("레드 카드", "${seasonStats.cards?.red ?: 0}")
                }
            }
        }
    }
}

@Composable
private fun StatItem(
    label: String,
    value: String
) {
    Column(
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Text(
            text = value,
            style = MaterialTheme.typography.titleMedium,
            fontWeight = FontWeight.Bold,
            color = DesignSystem.Colors.textPrimary
        )
        Text(
            text = label,
            style = MaterialTheme.typography.labelSmall,
            color = DesignSystem.Colors.textSecondary
        )
    }
}

@Composable
private fun DetailStatRow(
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
            color = DesignSystem.Colors.textSecondary
        )
        Text(
            text = value,
            style = MaterialTheme.typography.bodyMedium,
            fontWeight = FontWeight.Medium,
            color = DesignSystem.Colors.textPrimary
        )
    }
}