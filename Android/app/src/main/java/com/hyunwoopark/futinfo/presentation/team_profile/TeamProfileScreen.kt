package com.hyunwoopark.futinfo.presentation.team_profile

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Shield
import androidx.compose.material.icons.filled.Sports
import androidx.compose.material.icons.filled.Stadium
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
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

/**
 * 팀 프로필 화면
 * 
 * TeamProfileViewModel을 사용하여 팀 프로필 데이터를 표시합니다.
 * iOS의 TeamProfileView를 참고하여 구현되었습니다.
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun TeamProfileScreen(
    teamId: Int,
    viewModel: TeamProfileViewModel = hiltViewModel(),
    onBackClick: () -> Unit = {},
    onFixtureClick: (Int) -> Unit = {}
) {
    val state by viewModel.state.collectAsStateWithLifecycle()
    
    Column(
        modifier = Modifier.fillMaxSize()
    ) {
        // 상단 앱바
        TopAppBar(
            title = {
                Text(
                    text = state.teamProfile?.teamName ?: "팀 프로필",
                    style = MaterialTheme.typography.titleLarge,
                    fontWeight = FontWeight.Bold
                )
            },
            navigationIcon = {
                IconButton(onClick = onBackClick) {
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
        
        // 상태에 따른 UI 분기
        when {
            state.isLoading -> {
                LoadingContent()
            }
            state.errorMessage != null -> {
                ErrorContent(
                    message = state.errorMessage ?: "알 수 없는 오류가 발생했습니다",
                    onRetry = { viewModel.refreshTeamProfile() }
                )
            }
            state.teamProfile != null -> {
                state.teamProfile?.let { teamProfile ->
                    TeamProfileContent(teamProfile = teamProfile)
                }
            }
        }
    }
}

/**
 * 로딩 상태 UI
 */
@Composable
private fun LoadingContent() {
    Box(
        modifier = Modifier.fillMaxSize(),
        contentAlignment = Alignment.Center
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            CircularProgressIndicator(
                modifier = Modifier.size(48.dp),
                color = MaterialTheme.colorScheme.primary
            )
            Text(
                text = "팀 프로필 정보를 불러오는 중...",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
    }
}

/**
 * 에러 상태 UI
 */
@Composable
private fun ErrorContent(
    message: String,
    onRetry: () -> Unit
) {
    Box(
        modifier = Modifier.fillMaxSize(),
        contentAlignment = Alignment.Center
    ) {
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            colors = CardDefaults.cardColors(
                containerColor = MaterialTheme.colorScheme.errorContainer
            )
        ) {
            Column(
                modifier = Modifier.padding(24.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                Icon(
                    imageVector = Icons.Default.Shield,
                    contentDescription = null,
                    modifier = Modifier.size(48.dp),
                    tint = MaterialTheme.colorScheme.onErrorContainer
                )
                
                Text(
                    text = "오류가 발생했습니다",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.onErrorContainer
                )
                
                Text(
                    text = message,
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onErrorContainer,
                    textAlign = TextAlign.Center
                )
                
                Button(
                    onClick = onRetry,
                    colors = ButtonDefaults.buttonColors(
                        containerColor = MaterialTheme.colorScheme.error
                    )
                ) {
                    Text("다시 시도")
                }
            }
        }
    }
}

/**
 * 팀 프로필 성공 상태 UI
 */
@Composable
private fun TeamProfileContent(
    teamProfile: com.hyunwoopark.futinfo.domain.model.TeamProfileDetails
) {
    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // 팀 헤더 섹션
        item {
            TeamHeaderSection(teamProfile = teamProfile)
        }
        
        // 팀 기본 정보 섹션
        item {
            TeamBasicInfoSection(teamProfile = teamProfile)
        }
        
        // 팀 통계 섹션 (통계가 있는 경우에만 표시)
        if (teamProfile.hasStatistics) {
            item {
                TeamStatisticsSection(teamProfile = teamProfile)
            }
        }
        
        // 경기장 정보 섹션
        item {
            VenueInfoSection(teamProfile = teamProfile)
        }
        
        // 선수단 섹션 (선수단 데이터가 있는 경우에만 표시)
        if (teamProfile.hasSquad) {
            item {
                SquadSection(teamProfile = teamProfile)
            }
        }
    }
}

/**
 * 팀 헤더 섹션 (팀 로고, 이름, 국가)
 */
@Composable
private fun TeamHeaderSection(
    teamProfile: com.hyunwoopark.futinfo.domain.model.TeamProfileDetails
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.primaryContainer
        )
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(24.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(16.dp)
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
                    .background(MaterialTheme.colorScheme.surface),
                contentScale = ContentScale.Fit
            )
            
            // 팀 이름
            Text(
                text = teamProfile.teamName,
                style = MaterialTheme.typography.headlineMedium,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.onPrimaryContainer,
                textAlign = TextAlign.Center
            )
            
            // 팀 국가와 설립 연도
            Row(
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                teamProfile.teamCountry?.let { country ->
                    Text(
                        text = country,
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onPrimaryContainer
                    )
                }
                
                teamProfile.foundedYear?.let { founded ->
                    Text(
                        text = "• 창단: ${founded}년",
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onPrimaryContainer
                    )
                }
            }
        }
    }
}

/**
 * 팀 기본 정보 섹션
 */
@Composable
private fun TeamBasicInfoSection(
    teamProfile: com.hyunwoopark.futinfo.domain.model.TeamProfileDetails
) {
    Card(
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Text(
                text = "팀 정보",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold
            )
            
            InfoRow(
                icon = Icons.Default.Shield,
                label = "팀 ID",
                value = teamProfile.teamId.toString()
            )
            
            teamProfile.teamCountry?.let { country ->
                InfoRow(
                    icon = Icons.Default.Sports,
                    label = "국가",
                    value = country
                )
            }
            
            teamProfile.foundedYear?.let { founded ->
                InfoRow(
                    icon = Icons.Default.Stadium,
                    label = "창단 연도",
                    value = "${founded}년"
                )
            }
        }
    }
}

/**
 * 팀 통계 섹션
 */
@Composable
private fun TeamStatisticsSection(
    teamProfile: com.hyunwoopark.futinfo.domain.model.TeamProfileDetails
) {
    Card(
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            Text(
                text = "시즌 통계",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold
            )
            
            // 경기 기록
            teamProfile.totalGamesPlayed?.let { games ->
                StatisticsGrid(
                    title = "경기 기록",
                    stats = listOf(
                        StatItem("총 경기", games.toString(), Color(0xFF6B7280)),
                        StatItem("승리", teamProfile.totalWins?.toString() ?: "0", Color(0xFF10B981)),
                        StatItem("무승부", teamProfile.totalDraws?.toString() ?: "0", Color(0xFFF59E0B)),
                        StatItem("패배", teamProfile.totalLoses?.toString() ?: "0", Color(0xFFEF4444))
                    )
                )
            }
            
            // 득실점
            if (teamProfile.totalGoalsFor != null || teamProfile.totalGoalsAgainst != null) {
                StatisticsGrid(
                    title = "득실점",
                    stats = listOf(
                        StatItem("득점", teamProfile.totalGoalsFor?.toString() ?: "0", Color(0xFF3B82F6)),
                        StatItem("실점", teamProfile.totalGoalsAgainst?.toString() ?: "0", Color(0xFFEF4444)),
                        StatItem("득실차", teamProfile.goalDifference?.let { 
                            if (it >= 0) "+$it" else it.toString() 
                        } ?: "0", if ((teamProfile.goalDifference ?: 0) >= 0) Color(0xFF10B981) else Color(0xFFEF4444))
                    )
                )
            }
            
            // 팀 폼
            teamProfile.teamForm?.let { form ->
                InfoRow(
                    icon = Icons.Default.Sports,
                    label = "최근 폼",
                    value = form
                )
            }
        }
    }
}

/**
 * 경기장 정보 섹션
 */
@Composable
private fun VenueInfoSection(
    teamProfile: com.hyunwoopark.futinfo.domain.model.TeamProfileDetails
) {
    Card(
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Text(
                text = "홈 구장",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold
            )
            
            teamProfile.venueName?.let { name ->
                InfoRow(
                    icon = Icons.Default.Stadium,
                    label = "구장명",
                    value = name
                )
            }
            
            teamProfile.venueCity?.let { city ->
                InfoRow(
                    icon = Icons.Default.Sports,
                    label = "도시",
                    value = city
                )
            }
            
            teamProfile.venueCapacity?.let { capacity ->
                InfoRow(
                    icon = Icons.Default.Person,
                    label = "수용 인원",
                    value = "${capacity.toString().replace(Regex("(\\d)(?=(\\d{3})+$)"), "$1,")}명"
                )
            }
        }
    }
}

/**
 * 선수단 섹션
 */
@Composable
private fun SquadSection(
    teamProfile: com.hyunwoopark.futinfo.domain.model.TeamProfileDetails
) {
    Card(
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Text(
                text = "선수단",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold
            )
            
            teamProfile.squadSize?.let { size ->
                InfoRow(
                    icon = Icons.Default.Person,
                    label = "선수 수",
                    value = "${size}명"
                )
            }
            
            // 선수 목록 (처음 몇 명만 표시)
            teamProfile.squad?.players?.take(5)?.let { players ->
                Text(
                    text = "주요 선수",
                    style = MaterialTheme.typography.bodyMedium,
                    fontWeight = FontWeight.Medium,
                    modifier = Modifier.padding(top = 8.dp)
                )
                
                LazyRow(
                    horizontalArrangement = Arrangement.spacedBy(12.dp),
                    contentPadding = PaddingValues(vertical = 8.dp)
                ) {
                    items(players) { player ->
                        PlayerCard(player = player)
                    }
                }
            }
        }
    }
}

/**
 * 통계 그리드
 */
@Composable
private fun StatisticsGrid(
    title: String,
    stats: List<StatItem>
) {
    Column(
        verticalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        Text(
            text = title,
            style = MaterialTheme.typography.bodyMedium,
            fontWeight = FontWeight.Medium
        )
        
        LazyRow(
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            items(stats) { stat ->
                StatCard(stat = stat)
            }
        }
    }
}

/**
 * 통계 카드
 */
@Composable
private fun StatCard(stat: StatItem) {
    Card(
        modifier = Modifier.width(80.dp),
        colors = CardDefaults.cardColors(
            containerColor = stat.color.copy(alpha = 0.1f)
        )
    ) {
        Column(
            modifier = Modifier.padding(12.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(4.dp)
        ) {
            Text(
                text = stat.value,
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold,
                color = stat.color
            )
            Text(
                text = stat.label,
                style = MaterialTheme.typography.bodySmall,
                textAlign = TextAlign.Center,
                maxLines = 2,
                overflow = TextOverflow.Ellipsis
            )
        }
    }
}

/**
 * 선수 카드
 */
@Composable
private fun PlayerCard(
    player: com.hyunwoopark.futinfo.data.remote.dto.SquadPlayerDto
) {
    Card(
        modifier = Modifier.width(100.dp)
    ) {
        Column(
            modifier = Modifier.padding(8.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            // 선수 사진 (플레이스홀더)
            Box(
                modifier = Modifier
                    .size(60.dp)
                    .clip(CircleShape)
                    .background(MaterialTheme.colorScheme.surfaceVariant),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = Icons.Default.Person,
                    contentDescription = null,
                    modifier = Modifier.size(32.dp),
                    tint = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
            
            // 선수 이름
            Text(
                text = player.name,
                style = MaterialTheme.typography.bodySmall,
                textAlign = TextAlign.Center,
                maxLines = 2,
                overflow = TextOverflow.Ellipsis
            )
        }
    }
}

/**
 * 정보 행
 */
@Composable
private fun InfoRow(
    icon: ImageVector,
    label: String,
    value: String
) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        Icon(
            imageVector = icon,
            contentDescription = null,
            modifier = Modifier.size(20.dp),
            tint = MaterialTheme.colorScheme.primary
        )
        
        Text(
            text = label,
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            modifier = Modifier.weight(1f)
        )
        
        Text(
            text = value,
            style = MaterialTheme.typography.bodyMedium,
            fontWeight = FontWeight.Medium
        )
    }
}

/**
 * 통계 아이템 데이터 클래스
 */
private data class StatItem(
    val label: String,
    val value: String,
    val color: Color
)