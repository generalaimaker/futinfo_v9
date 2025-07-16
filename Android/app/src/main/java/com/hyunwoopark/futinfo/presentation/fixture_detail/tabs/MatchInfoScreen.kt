package com.hyunwoopark.futinfo.presentation.fixture_detail.tabs

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.hyunwoopark.futinfo.data.remote.dto.FixtureDto
import com.hyunwoopark.futinfo.util.LeagueNameLocalizer

/**
 * 경기 정보 탭 전용 화면
 * 
 * iOS MatchInfoView와 동일한 기능:
 * - 경기장, 심판 정보 및 양팀 최근 폼
 * - 경기 메타데이터 표시
 * - 상세 경기 정보
 */
@Composable
fun MatchInfoScreen(
    fixture: FixtureDto,
    isLoading: Boolean = false,
    modifier: Modifier = Modifier
) {
    if (isLoading) {
        MatchInfoLoadingState(modifier = modifier)
    } else {
        MatchInfoContent(
            fixture = fixture,
            modifier = modifier
        )
    }
}

@Composable
private fun MatchInfoContent(
    fixture: FixtureDto,
    modifier: Modifier = Modifier
) {
    LazyColumn(
        modifier = modifier
            .fillMaxSize()
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        item {
            Text(
                text = "경기 정보",
                style = MaterialTheme.typography.titleLarge,
                fontWeight = FontWeight.Bold
            )
        }
        
        item {
            VenueInfoCard(fixture = fixture)
        }
        
        item {
            MatchDetailsCard(fixture = fixture)
        }
        
        item {
            LeagueInfoCard(fixture = fixture)
        }
        
        item {
            TeamsFormCard(fixture = fixture)
        }
    }
}

@Composable
private fun VenueInfoCard(
    fixture: FixtureDto
) {
    InfoCard(
        title = "경기장 정보",
        icon = Icons.Default.Stadium
    ) {
        InfoRow(
            label = "경기장",
            value = fixture.fixture.venue.name ?: "정보 없음",
            icon = Icons.Default.Stadium
        )
        
        InfoRow(
            label = "도시",
            value = fixture.fixture.venue.city ?: "정보 없음",
            icon = Icons.Default.LocationOn
        )
        
        InfoRow(
            label = "수용 인원",
            value = if (fixture.fixture.venue.capacity != null) 
                "${fixture.fixture.venue.capacity}명" else "정보 없음",
            icon = Icons.Default.People
        )
    }
}

@Composable
private fun MatchDetailsCard(
    fixture: FixtureDto
) {
    InfoCard(
        title = "경기 상세",
        icon = Icons.Default.Info
    ) {
        InfoRow(
            label = "심판",
            value = fixture.fixture.referee ?: "정보 없음",
            icon = Icons.Default.Person
        )
        
        InfoRow(
            label = "경기 날짜",
            value = formatDate(fixture.fixture.date),
            icon = Icons.Default.CalendarToday
        )
        
        InfoRow(
            label = "시간대",
            value = fixture.fixture.timezone,
            icon = Icons.Default.Schedule
        )
        
        InfoRow(
            label = "경기 상태",
            value = fixture.fixture.status.long,
            icon = Icons.Default.PlayCircle
        )
        
        if (fixture.fixture.status.elapsed != null) {
            InfoRow(
                label = "경과 시간",
                value = "${fixture.fixture.status.elapsed}분",
                icon = Icons.Default.Timer
            )
        }
    }
}

@Composable
private fun LeagueInfoCard(
    fixture: FixtureDto
) {
    InfoCard(
        title = "리그 정보",
        icon = Icons.Default.EmojiEvents
    ) {
        InfoRow(
            label = "리그",
            value = LeagueNameLocalizer.getLocalizedName(fixture.league.id, fixture.league.name),
            icon = Icons.Default.EmojiEvents
        )
        
        InfoRow(
            label = "국가",
            value = fixture.league.country,
            icon = Icons.Default.Flag
        )
        
        InfoRow(
            label = "시즌",
            value = "${fixture.league.season}",
            icon = Icons.Default.DateRange
        )
        
        InfoRow(
            label = "라운드",
            value = fixture.league.round,
            icon = Icons.Default.Numbers
        )
    }
}

@Composable
private fun TeamsFormCard(
    fixture: FixtureDto
) {
    InfoCard(
        title = "팀 정보",
        icon = Icons.Default.Groups
    ) {
        // 홈팀 정보
        TeamInfoSection(
            teamName = fixture.teams.home.name,
            isHome = true,
            winner = fixture.teams.home.winner
        )
        
        Divider(
            modifier = Modifier.padding(vertical = 12.dp),
            color = MaterialTheme.colorScheme.outline.copy(alpha = 0.3f)
        )
        
        // 어웨이팀 정보
        TeamInfoSection(
            teamName = fixture.teams.away.name,
            isHome = false,
            winner = fixture.teams.away.winner
        )
    }
}

@Composable
private fun TeamInfoSection(
    teamName: String,
    isHome: Boolean,
    winner: Boolean?
) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Row(
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(
                imageVector = if (isHome) Icons.Default.Home else Icons.Default.FlightTakeoff,
                contentDescription = if (isHome) "홈팀" else "어웨이팀",
                tint = MaterialTheme.colorScheme.primary,
                modifier = Modifier.size(20.dp)
            )
            
            Spacer(modifier = Modifier.width(8.dp))
            
            Column {
                Text(
                    text = teamName,
                    style = MaterialTheme.typography.titleSmall,
                    fontWeight = FontWeight.SemiBold
                )
                
                Text(
                    text = if (isHome) "홈팀" else "어웨이팀",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }
        
        // 승리 표시
        when (winner) {
            true -> {
                Surface(
                    color = MaterialTheme.colorScheme.primary,
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Text(
                        text = "승리",
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onPrimary,
                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                    )
                }
            }
            false -> {
                Surface(
                    color = MaterialTheme.colorScheme.error,
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Text(
                        text = "패배",
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onError,
                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                    )
                }
            }
            null -> {
                Surface(
                    color = MaterialTheme.colorScheme.outline,
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Text(
                        text = "무승부",
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onSurface,
                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                    )
                }
            }
        }
    }
}

@Composable
private fun InfoCard(
    title: String,
    icon: ImageVector,
    content: @Composable ColumnScope.() -> Unit
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
        shape = RoundedCornerShape(12.dp)
    ) {
        Column(
            modifier = Modifier.padding(16.dp)
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                modifier = Modifier.padding(bottom = 16.dp)
            ) {
                Icon(
                    imageVector = icon,
                    contentDescription = null,
                    tint = MaterialTheme.colorScheme.primary,
                    modifier = Modifier.size(24.dp)
                )
                
                Spacer(modifier = Modifier.width(8.dp))
                
                Text(
                    text = title,
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.SemiBold,
                    color = MaterialTheme.colorScheme.primary
                )
            }
            
            content()
        }
    }
}

@Composable
private fun InfoRow(
    label: String,
    value: String,
    icon: ImageVector
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 6.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Icon(
            imageVector = icon,
            contentDescription = null,
            tint = MaterialTheme.colorScheme.onSurfaceVariant,
            modifier = Modifier.size(16.dp)
        )
        
        Spacer(modifier = Modifier.width(12.dp))
        
        Text(
            text = label,
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            modifier = Modifier.weight(1f)
        )
        
        Text(
            text = value,
            style = MaterialTheme.typography.bodyMedium,
            fontWeight = FontWeight.Medium,
            textAlign = TextAlign.End
        )
    }
}

@Composable
private fun MatchInfoLoadingState(
    modifier: Modifier = Modifier
) {
    LazyColumn(
        modifier = modifier
            .fillMaxSize()
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        item {
            Box(
                modifier = Modifier
                    .width(100.dp)
                    .height(24.dp)
                    .shimmerEffect()
            )
        }
        
        items(4) {
            InfoCardSkeleton()
        }
    }
}

@Composable
private fun InfoCardSkeleton() {
    Card(
        modifier = Modifier.fillMaxWidth(),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Column(
            modifier = Modifier.padding(16.dp)
        ) {
            // 제목 스켈레톤
            Row(
                verticalAlignment = Alignment.CenterVertically,
                modifier = Modifier.padding(bottom = 16.dp)
            ) {
                Box(
                    modifier = Modifier
                        .size(24.dp)
                        .shimmerEffect()
                )
                
                Spacer(modifier = Modifier.width(8.dp))
                
                Box(
                    modifier = Modifier
                        .width(120.dp)
                        .height(20.dp)
                        .shimmerEffect()
                )
            }
            
            // 정보 행 스켈레톤
            repeat(4) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = 6.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Box(
                        modifier = Modifier
                            .size(16.dp)
                            .shimmerEffect()
                    )
                    
                    Spacer(modifier = Modifier.width(12.dp))
                    
                    Box(
                        modifier = Modifier
                            .weight(1f)
                            .height(16.dp)
                            .shimmerEffect()
                    )
                    
                    Box(
                        modifier = Modifier
                            .width(80.dp)
                            .height(16.dp)
                            .shimmerEffect()
                    )
                }
            }
        }
    }
}

// 유틸리티 함수들
private fun formatDate(dateString: String): String {
    return try {
        // 간단한 날짜 포맷팅 (실제로는 더 정교한 포맷팅 필요)
        val parts = dateString.split("T")
        if (parts.isNotEmpty()) {
            val datePart = parts[0]
            val timePart = if (parts.size > 1) parts[1].substring(0, 5) else ""
            "$datePart $timePart"
        } else {
            dateString
        }
    } catch (e: Exception) {
        dateString
    }
}

@Composable
private fun Modifier.shimmerEffect(): Modifier {
    return this.then(
        Modifier.background(
            MaterialTheme.colorScheme.outline.copy(alpha = 0.3f),
            RoundedCornerShape(4.dp)
        )
    )
}