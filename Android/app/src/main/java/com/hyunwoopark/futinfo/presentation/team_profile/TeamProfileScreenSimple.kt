package com.hyunwoopark.futinfo.presentation.team_profile

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
import com.hyunwoopark.futinfo.domain.model.TeamProfileDetails
import com.hyunwoopark.futinfo.data.remote.dto.SquadPlayerDto
import com.hyunwoopark.futinfo.presentation.design_system.DesignSystem

/**
 * 간소화된 iOS 스타일 팀 프로필 화면
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun TeamProfileScreenSimple(
    viewModel: TeamProfileViewModel = hiltViewModel(),
    onBackClick: () -> Unit = {},
    onPlayerClick: (Int) -> Unit = {},
    onFixtureClick: (Int) -> Unit = {}
) {
    val state by viewModel.state.collectAsStateWithLifecycle()
    
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
                            text = state.errorMessage!!,
                            style = MaterialTheme.typography.bodyLarge,
                            color = DesignSystem.Colors.textSecondary,
                            textAlign = TextAlign.Center
                        )
                        Button(
                            onClick = { viewModel.refreshTeamProfile() },
                            colors = ButtonDefaults.buttonColors(
                                containerColor = DesignSystem.Colors.accent
                            )
                        ) {
                            Text("다시 시도", color = Color.White)
                        }
                    }
                }
            }
            state.teamProfile != null -> {
                LazyColumn(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(paddingValues),
                    contentPadding = PaddingValues(16.dp),
                    verticalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    // 헤더 카드
                    item {
                        TeamHeaderCard(teamProfile = state.teamProfile!!)
                    }
                    
                    // 기본 정보
                    item {
                        BasicInfoCard(teamProfile = state.teamProfile!!)
                    }
                    
                    // 통계
                    if (state.teamProfile!!.hasStatistics) {
                        item {
                            StatsCard(teamProfile = state.teamProfile!!)
                        }
                    }
                    
                    // 경기장 정보
                    item {
                        VenueCard(teamProfile = state.teamProfile!!)
                    }
                    
                    // 선수단
                    if (state.teamProfile!!.hasSquad) {
                        item {
                            Text(
                                text = "선수단",
                                style = MaterialTheme.typography.titleLarge,
                                fontWeight = FontWeight.Bold,
                                color = DesignSystem.Colors.textPrimary,
                                modifier = Modifier.padding(vertical = 8.dp)
                            )
                        }
                        
                        state.teamProfile!!.squad?.players?.let { players ->
                            items(players) { player ->
                                PlayerItem(
                                    player = player,
                                    onPlayerClick = onPlayerClick
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
private fun TeamHeaderCard(
    teamProfile: TeamProfileDetails
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(20.dp),
        colors = CardDefaults.cardColors(
            containerColor = DesignSystem.Colors.surface
        )
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(24.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            // 팀 로고
            AsyncImage(
                model = ImageRequest.Builder(LocalContext.current)
                    .data(teamProfile.teamLogo)
                    .crossfade(true)
                    .build(),
                contentDescription = "${teamProfile.teamName} 로고",
                modifier = Modifier
                    .size(80.dp)
                    .clip(CircleShape)
                    .background(Color.White),
                contentScale = ContentScale.Fit
            )
            
            Spacer(modifier = Modifier.height(12.dp))
            
            // 팀명
            Text(
                text = teamProfile.teamName,
                style = MaterialTheme.typography.headlineSmall,
                fontWeight = FontWeight.Bold,
                color = DesignSystem.Colors.textPrimary
            )
            
            // 국가 & 창단
            Row(
                horizontalArrangement = Arrangement.spacedBy(12.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                teamProfile.teamCountry?.let { country ->
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(
                            imageVector = Icons.Default.Flag,
                            contentDescription = null,
                            modifier = Modifier.size(16.dp),
                            tint = DesignSystem.Colors.textSecondary
                        )
                        Spacer(modifier = Modifier.width(4.dp))
                        Text(
                            text = country,
                            style = MaterialTheme.typography.bodyMedium,
                            color = DesignSystem.Colors.textSecondary
                        )
                    }
                }
                
                teamProfile.foundedYear?.let { year ->
                    Text(
                        text = "창단 ${year}년",
                        style = MaterialTheme.typography.bodyMedium,
                        color = DesignSystem.Colors.textSecondary
                    )
                }
            }
            
            // 최근 폼
            teamProfile.teamForm?.let { form ->
                Spacer(modifier = Modifier.height(16.dp))
                Row(
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    form.forEach { result ->
                        FormBadge(result = result)
                    }
                }
            }
        }
    }
}

@Composable
private fun BasicInfoCard(
    teamProfile: TeamProfileDetails
) {
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
            
            InfoRow("팀 ID", teamProfile.teamId.toString(), Icons.Default.Tag)
            teamProfile.teamCountry?.let {
                InfoRow("국가", it, Icons.Default.Flag)
            }
            teamProfile.foundedYear?.let {
                InfoRow("창단 연도", "${it}년", Icons.Default.CalendarToday)
            }
            teamProfile.squadSize?.let {
                InfoRow("선수 수", "${it}명", Icons.Default.People)
            }
        }
    }
}

@Composable
private fun StatsCard(
    teamProfile: TeamProfileDetails
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(
            containerColor = DesignSystem.Colors.surface
        )
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            Text(
                text = "시즌 통계",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold,
                color = DesignSystem.Colors.textPrimary
            )
            
            // 경기 기록
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceEvenly
            ) {
                TeamStatItem("총 경기", "${teamProfile.totalGamesPlayed ?: 0}", DesignSystem.Colors.textPrimary)
                TeamStatItem("승리", "${teamProfile.totalWins ?: 0}", DesignSystem.Colors.success)
                TeamStatItem("무승부", "${teamProfile.totalDraws ?: 0}", DesignSystem.Colors.warning)
                TeamStatItem("패배", "${teamProfile.totalLoses ?: 0}", DesignSystem.Colors.destructive)
            }
            
            Divider(color = DesignSystem.Colors.border)
            
            // 득실점
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceEvenly
            ) {
                TeamStatItem("득점", "${teamProfile.totalGoalsFor ?: 0}", DesignSystem.Colors.accent)
                TeamStatItem("실점", "${teamProfile.totalGoalsAgainst ?: 0}", DesignSystem.Colors.destructive)
                TeamStatItem(
                    "득실차",
                    teamProfile.goalDifference?.let { if (it >= 0) "+$it" else it.toString() } ?: "0",
                    if ((teamProfile.goalDifference ?: 0) >= 0) DesignSystem.Colors.success else DesignSystem.Colors.destructive
                )
            }
        }
    }
}

@Composable
private fun VenueCard(
    teamProfile: TeamProfileDetails
) {
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
                text = "홈 구장",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold,
                color = DesignSystem.Colors.textPrimary
            )
            
            teamProfile.venueName?.let {
                InfoRow("구장명", it, Icons.Default.SportsSoccer)
            }
            teamProfile.venueCity?.let {
                InfoRow("위치", it, Icons.Default.LocationOn)
            }
            teamProfile.venueCapacity?.let {
                InfoRow(
                    "수용 인원",
                    "${it.toString().replace(Regex("(\\d)(?=(\\d{3})+$)"), "$1,")}명",
                    Icons.Default.People
                )
            }
        }
    }
}

@Composable
private fun FormBadge(
    result: Char
) {
    val (backgroundColor, text) = when (result) {
        'W' -> DesignSystem.Colors.success to "승"
        'D' -> DesignSystem.Colors.warning to "무"
        'L' -> DesignSystem.Colors.destructive to "패"
        else -> DesignSystem.Colors.textTertiary to "?"
    }
    
    Surface(
        shape = CircleShape,
        color = backgroundColor,
        modifier = Modifier.size(32.dp)
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

@Composable
private fun TeamStatItem(
    label: String,
    value: String,
    color: Color
) {
    Column(
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
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

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun PlayerItem(
    player: SquadPlayerDto,
    onPlayerClick: (Int) -> Unit
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(
            containerColor = DesignSystem.Colors.surface
        ),
        onClick = { player.id?.let { onPlayerClick(it) } }
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(12.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            // 선수 번호
            Surface(
                shape = CircleShape,
                color = DesignSystem.Colors.background,
                modifier = Modifier.size(40.dp)
            ) {
                Box(
                    contentAlignment = Alignment.Center,
                    modifier = Modifier.fillMaxSize()
                ) {
                    Text(
                        text = player.number?.toString() ?: "?",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold,
                        color = DesignSystem.Colors.textPrimary
                    )
                }
            }
            
            Spacer(modifier = Modifier.width(12.dp))
            
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = player.name,
                    style = MaterialTheme.typography.bodyMedium,
                    fontWeight = FontWeight.Medium,
                    color = DesignSystem.Colors.textPrimary,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
                Row {
                    player.position?.let { position ->
                        Text(
                            text = getPositionKoreanName(position),
                            style = MaterialTheme.typography.bodySmall,
                            color = DesignSystem.Colors.textSecondary
                        )
                    }
                    player.age?.let { age ->
                        Text(
                            text = " • ${age}세",
                            style = MaterialTheme.typography.bodySmall,
                            color = DesignSystem.Colors.textSecondary
                        )
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

private fun getPositionKoreanName(position: String): String {
    return when (position) {
        "Goalkeeper" -> "골키퍼"
        "Defender" -> "수비수"
        "Midfielder" -> "미드필더"
        "Attacker" -> "공격수"
        else -> position
    }
}