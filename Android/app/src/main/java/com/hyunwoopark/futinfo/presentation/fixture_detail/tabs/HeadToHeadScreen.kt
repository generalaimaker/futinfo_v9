package com.hyunwoopark.futinfo.presentation.fixture_detail.tabs

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import coil.compose.AsyncImage
import com.hyunwoopark.futinfo.data.remote.dto.FixtureDto

/**
 * 상대전적 탭 전용 화면
 * 
 * iOS HeadToHeadView와 동일한 기능:
 * - 양팀 간의 과거 전적
 * - 최근 경기 결과
 * - 통계 비교
 * - 승부 기록
 */
@Composable
fun HeadToHeadScreen(
    fixture: FixtureDto,
    isLoading: Boolean = false,
    modifier: Modifier = Modifier
) {
    if (isLoading) {
        HeadToHeadLoadingState(modifier = modifier)
    } else {
        HeadToHeadContent(
            fixture = fixture,
            modifier = modifier
        )
    }
}

@Composable
private fun HeadToHeadContent(
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
                text = "상대전적",
                style = MaterialTheme.typography.titleLarge,
                fontWeight = FontWeight.Bold
            )
        }
        
        item {
            HeadToHeadSummaryCard(fixture = fixture)
        }
        
        item {
            RecentMatchesCard(fixture = fixture)
        }
        
        item {
            StatisticsComparisonCard(fixture = fixture)
        }
    }
}

@Composable
private fun HeadToHeadSummaryCard(
    fixture: FixtureDto
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        elevation = CardDefaults.cardElevation(defaultElevation = 4.dp),
        shape = RoundedCornerShape(16.dp)
    ) {
        Column(
            modifier = Modifier.padding(20.dp)
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                modifier = Modifier.padding(bottom = 16.dp)
            ) {
                Icon(
                    imageVector = Icons.Default.History,
                    contentDescription = null,
                    tint = MaterialTheme.colorScheme.primary,
                    modifier = Modifier.size(24.dp)
                )
                
                Spacer(modifier = Modifier.width(8.dp))
                
                Text(
                    text = "전체 전적",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.SemiBold,
                    color = MaterialTheme.colorScheme.primary
                )
            }
            
            // 팀 이름 및 로고 표시
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                // 홈팀
                Row(
                    modifier = Modifier.weight(1f),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.Start
                ) {
                    AsyncImage(
                        model = fixture.teams.home.logo,
                        contentDescription = fixture.teams.home.name,
                        modifier = Modifier.size(40.dp)
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        text = fixture.teams.home.name,
                        style = MaterialTheme.typography.titleSmall,
                        fontWeight = FontWeight.SemiBold,
                        textAlign = TextAlign.Start
                    )
                }
                
                Text(
                    text = "VS",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                
                // 어웨이팀
                Row(
                    modifier = Modifier.weight(1f),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.End
                ) {
                    Text(
                        text = fixture.teams.away.name,
                        style = MaterialTheme.typography.titleSmall,
                        fontWeight = FontWeight.SemiBold,
                        textAlign = TextAlign.End
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    AsyncImage(
                        model = fixture.teams.away.logo,
                        contentDescription = fixture.teams.away.name,
                        modifier = Modifier.size(40.dp)
                    )
                }
            }
            
            Spacer(modifier = Modifier.height(16.dp))
            
            // 모의 전적 데이터 (실제로는 API에서 가져와야 함)
            HeadToHeadStats(
                homeWins = 5,
                draws = 3,
                awayWins = 2,
                totalMatches = 10
            )
        }
    }
}

@Composable
private fun HeadToHeadStats(
    homeWins: Int,
    draws: Int,
    awayWins: Int,
    totalMatches: Int
) {
    Column {
        // 승부 기록
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceEvenly
        ) {
            StatItem(
                value = homeWins.toString(),
                label = "승리",
                color = MaterialTheme.colorScheme.primary
            )
            
            StatItem(
                value = draws.toString(),
                label = "무승부",
                color = MaterialTheme.colorScheme.outline
            )
            
            StatItem(
                value = awayWins.toString(),
                label = "승리",
                color = MaterialTheme.colorScheme.secondary
            )
        }
        
        Spacer(modifier = Modifier.height(16.dp))
        
        // 승률 바
        WinRateBar(
            homeWins = homeWins,
            draws = draws,
            awayWins = awayWins,
            totalMatches = totalMatches
        )
        
        Spacer(modifier = Modifier.height(8.dp))
        
        Text(
            text = "총 ${totalMatches}경기",
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            textAlign = TextAlign.Center,
            modifier = Modifier.fillMaxWidth()
        )
    }
}

@Composable
private fun StatItem(
    value: String,
    label: String,
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
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
    }
}

@Composable
private fun WinRateBar(
    homeWins: Int,
    draws: Int,
    awayWins: Int,
    totalMatches: Int
) {
    val homePercentage = homeWins.toFloat() / totalMatches
    val drawPercentage = draws.toFloat() / totalMatches
    val awayPercentage = awayWins.toFloat() / totalMatches
    
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .height(8.dp)
    ) {
        // 홈팀 승률
        Box(
            modifier = Modifier
                .weight(homePercentage)
                .fillMaxHeight()
                .background(
                    MaterialTheme.colorScheme.primary,
                    RoundedCornerShape(topStart = 4.dp, bottomStart = 4.dp)
                )
        )
        
        // 무승부
        Box(
            modifier = Modifier
                .weight(drawPercentage)
                .fillMaxHeight()
                .background(MaterialTheme.colorScheme.outline)
        )
        
        // 어웨이팀 승률
        Box(
            modifier = Modifier
                .weight(awayPercentage)
                .fillMaxHeight()
                .background(
                    MaterialTheme.colorScheme.secondary,
                    RoundedCornerShape(topEnd = 4.dp, bottomEnd = 4.dp)
                )
        )
    }
}

@Composable
private fun RecentMatchesCard(
    fixture: FixtureDto
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
                    imageVector = Icons.Default.Schedule,
                    contentDescription = null,
                    tint = MaterialTheme.colorScheme.primary,
                    modifier = Modifier.size(20.dp)
                )
                
                Spacer(modifier = Modifier.width(8.dp))
                
                Text(
                    text = "최근 경기",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.SemiBold
                )
            }
            
            // 모의 최근 경기 데이터
            val recentMatches = getRecentMatches(fixture)
            
            if (recentMatches.isNotEmpty()) {
                recentMatches.forEach { match ->
                    RecentMatchItem(match = match)
                    Spacer(modifier = Modifier.height(8.dp))
                }
            } else {
                Text(
                    text = "최근 경기 데이터가 없습니다",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    textAlign = TextAlign.Center,
                    modifier = Modifier.fillMaxWidth()
                )
            }
        }
    }
}

@Composable
private fun RecentMatchItem(
    match: RecentMatch
) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(
            text = match.date,
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            modifier = Modifier.width(80.dp)
        )
        
        Row(
            modifier = Modifier.weight(1f),
            horizontalArrangement = Arrangement.Center,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = "${match.homeScore}",
                style = MaterialTheme.typography.titleSmall,
                fontWeight = FontWeight.Bold
            )
            
            Text(
                text = " : ",
                style = MaterialTheme.typography.titleSmall
            )
            
            Text(
                text = "${match.awayScore}",
                style = MaterialTheme.typography.titleSmall,
                fontWeight = FontWeight.Bold
            )
        }
        
        Text(
            text = match.competition,
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            modifier = Modifier.width(80.dp),
            textAlign = TextAlign.End
        )
    }
}

@Composable
private fun StatisticsComparisonCard(
    fixture: FixtureDto
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
                    imageVector = Icons.Default.BarChart,
                    contentDescription = null,
                    tint = MaterialTheme.colorScheme.primary,
                    modifier = Modifier.size(20.dp)
                )
                
                Spacer(modifier = Modifier.width(8.dp))
                
                Text(
                    text = "상대전적 통계",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.SemiBold
                )
            }
            
            // 모의 통계 데이터
            val comparisonStats = getComparisonStats()
            
            comparisonStats.forEach { stat ->
                ComparisonStatItem(stat = stat)
                Spacer(modifier = Modifier.height(12.dp))
            }
        }
    }
}

@Composable
private fun ComparisonStatItem(
    stat: ComparisonStat
) {
    Column {
        Text(
            text = stat.name,
            style = MaterialTheme.typography.bodyMedium,
            fontWeight = FontWeight.Medium,
            textAlign = TextAlign.Center,
            modifier = Modifier.fillMaxWidth()
        )
        
        Spacer(modifier = Modifier.height(8.dp))
        
        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = stat.homeValue,
                style = MaterialTheme.typography.titleSmall,
                fontWeight = FontWeight.Bold,
                modifier = Modifier.width(50.dp),
                textAlign = TextAlign.Center
            )
            
            // 비교 바
            Box(
                modifier = Modifier
                    .weight(1f)
                    .height(6.dp)
                    .padding(horizontal = 16.dp)
            ) {
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .background(
                            MaterialTheme.colorScheme.outline.copy(alpha = 0.2f),
                            RoundedCornerShape(3.dp)
                        )
                )
                
                val homePercentage = stat.homeValue.toFloatOrNull() ?: 0f
                val awayPercentage = stat.awayValue.toFloatOrNull() ?: 0f
                val total = homePercentage + awayPercentage
                val homeRatio = if (total > 0) homePercentage / total else 0.5f
                
                Box(
                    modifier = Modifier
                        .fillMaxHeight()
                        .fillMaxWidth(homeRatio)
                        .background(
                            MaterialTheme.colorScheme.primary,
                            RoundedCornerShape(3.dp)
                        )
                )
            }
            
            Text(
                text = stat.awayValue,
                style = MaterialTheme.typography.titleSmall,
                fontWeight = FontWeight.Bold,
                modifier = Modifier.width(50.dp),
                textAlign = TextAlign.Center
            )
        }
    }
}

@Composable
private fun HeadToHeadLoadingState(
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
        
        items(3) {
            Card(
                modifier = Modifier.fillMaxWidth(),
                elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
            ) {
                Column(
                    modifier = Modifier.padding(16.dp)
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        modifier = Modifier.padding(bottom = 16.dp)
                    ) {
                        Box(
                            modifier = Modifier
                                .size(20.dp)
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
                    
                    repeat(4) {
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(16.dp)
                                .shimmerEffect()
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                    }
                }
            }
        }
    }
}

// 데이터 클래스들
data class RecentMatch(
    val date: String,
    val homeScore: Int,
    val awayScore: Int,
    val competition: String
)

data class ComparisonStat(
    val name: String,
    val homeValue: String,
    val awayValue: String
)

// 모의 데이터 생성 함수들
private fun getRecentMatches(fixture: FixtureDto): List<RecentMatch> {
    return listOf(
        RecentMatch("2024-01-15", 2, 1, "리그"),
        RecentMatch("2023-08-20", 0, 3, "컵대회"),
        RecentMatch("2023-03-10", 1, 1, "리그"),
        RecentMatch("2022-11-05", 2, 0, "리그"),
        RecentMatch("2022-05-18", 1, 2, "컵대회")
    )
}

private fun getComparisonStats(): List<ComparisonStat> {
    return listOf(
        ComparisonStat("평균 득점", "1.8", "1.2"),
        ComparisonStat("평균 실점", "1.1", "1.5"),
        ComparisonStat("승률 (%)", "65", "35"),
        ComparisonStat("최근 5경기 승수", "3", "1")
    )
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