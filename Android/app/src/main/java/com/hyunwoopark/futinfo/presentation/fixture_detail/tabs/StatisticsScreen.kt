package com.hyunwoopark.futinfo.presentation.fixture_detail.tabs

import androidx.compose.foundation.Canvas
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
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.hyunwoopark.futinfo.data.remote.dto.TeamStatisticsDto
import com.hyunwoopark.futinfo.domain.model.FixtureDetailBundle

/**
 * 통계 탭 전용 화면
 * 
 * iOS StatisticsView와 동일한 기능:
 * - 점유율, 슈팅 등 상세 스탯 표시
 * - 시각적 비교 차트
 * - 팀별 통계 비교
 * - 주요 통계 하이라이트
 */
@Composable
fun StatisticsScreen(
    data: FixtureDetailBundle,
    isLoading: Boolean = false,
    modifier: Modifier = Modifier
) {
    if (isLoading) {
        StatisticsLoadingState(modifier = modifier)
    } else if (data.statistics.isNotEmpty()) {
        StatisticsContent(
            statistics = data.statistics,
            modifier = modifier
        )
    } else {
        StatisticsEmptyState(modifier = modifier)
    }
}

@Composable
private fun StatisticsContent(
    statistics: List<TeamStatisticsDto>,
    modifier: Modifier = Modifier
) {
    val homeStats = statistics.firstOrNull()
    val awayStats = statistics.getOrNull(1)
    
    if (homeStats != null && awayStats != null) {
        LazyColumn(
            modifier = modifier
                .fillMaxSize()
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            item {
                Text(
                    text = "경기 통계",
                    style = MaterialTheme.typography.titleLarge,
                    fontWeight = FontWeight.Bold
                )
            }
            
            item {
                TeamStatsHeader(
                    homeTeam = homeStats.team.name,
                    awayTeam = awayStats.team.name
                )
            }
            
            // 주요 통계들을 카테고리별로 그룹화
            val groupedStats = groupStatistics(homeStats.statistics, awayStats.statistics)
            
            items(groupedStats) { (category, stats) ->
                StatsCategoryCard(
                    category = category,
                    stats = stats
                )
            }
        }
    }
}

@Composable
private fun TeamStatsHeader(
    homeTeam: String,
    awayTeam: String
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        elevation = CardDefaults.cardElevation(defaultElevation = 4.dp),
        shape = RoundedCornerShape(16.dp)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(20.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = homeTeam,
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold,
                modifier = Modifier.weight(1f),
                textAlign = TextAlign.Start
            )
            
            Icon(
                imageVector = Icons.Default.CompareArrows,
                contentDescription = "VS",
                tint = MaterialTheme.colorScheme.primary,
                modifier = Modifier.size(24.dp)
            )
            
            Text(
                text = awayTeam,
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold,
                modifier = Modifier.weight(1f),
                textAlign = TextAlign.End
            )
        }
    }
}

@Composable
private fun StatsCategoryCard(
    category: String,
    stats: List<StatComparison>
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
        shape = RoundedCornerShape(12.dp)
    ) {
        Column(
            modifier = Modifier.padding(16.dp)
        ) {
            Text(
                text = category,
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.SemiBold,
                color = MaterialTheme.colorScheme.primary,
                modifier = Modifier.padding(bottom = 12.dp)
            )
            
            stats.forEach { stat ->
                StatComparisonRow(stat = stat)
                Spacer(modifier = Modifier.height(12.dp))
            }
        }
    }
}

@Composable
private fun StatComparisonRow(
    stat: StatComparison
) {
    Column {
        // 통계 이름
        Text(
            text = stat.name,
            style = MaterialTheme.typography.bodyMedium,
            fontWeight = FontWeight.Medium,
            textAlign = TextAlign.Center,
            modifier = Modifier.fillMaxWidth()
        )
        
        Spacer(modifier = Modifier.height(8.dp))
        
        // 값과 비교 바
        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically
        ) {
            // 홈팀 값
            Text(
                text = stat.homeValue,
                style = MaterialTheme.typography.titleSmall,
                fontWeight = FontWeight.Bold,
                modifier = Modifier.width(50.dp),
                textAlign = TextAlign.Center
            )
            
            // 비교 바
            StatComparisonBar(
                homeValue = stat.homeNumericValue,
                awayValue = stat.awayNumericValue,
                modifier = Modifier.weight(1f)
            )
            
            // 어웨이팀 값
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
private fun StatComparisonBar(
    homeValue: Float,
    awayValue: Float,
    modifier: Modifier = Modifier
) {
    val total = homeValue + awayValue
    val homePercentage = if (total > 0) homeValue / total else 0.5f
    
    Box(
        modifier = modifier
            .height(8.dp)
            .padding(horizontal = 16.dp)
    ) {
        // 배경
        Box(
            modifier = Modifier
                .fillMaxSize()
                .clip(RoundedCornerShape(4.dp))
                .background(MaterialTheme.colorScheme.outline.copy(alpha = 0.2f))
        )
        
        // 홈팀 바
        Box(
            modifier = Modifier
                .fillMaxHeight()
                .fillMaxWidth(homePercentage)
                .clip(RoundedCornerShape(4.dp))
                .background(MaterialTheme.colorScheme.primary)
        )
    }
}

@Composable
private fun StatisticsLoadingState(
    modifier: Modifier = Modifier
) {
    LazyColumn(
        modifier = modifier
            .fillMaxSize()
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        item {
            // 제목 스켈레톤
            Box(
                modifier = Modifier
                    .width(120.dp)
                    .height(24.dp)
                    .shimmerEffect()
            )
        }
        
        item {
            // 헤더 스켈레톤
            Card(
                modifier = Modifier.fillMaxWidth(),
                elevation = CardDefaults.cardElevation(defaultElevation = 4.dp)
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(20.dp),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Box(
                        modifier = Modifier
                            .width(100.dp)
                            .height(20.dp)
                            .shimmerEffect()
                    )
                    Box(
                        modifier = Modifier
                            .size(24.dp)
                            .shimmerEffect()
                    )
                    Box(
                        modifier = Modifier
                            .width(100.dp)
                            .height(20.dp)
                            .shimmerEffect()
                    )
                }
            }
        }
        
        items(4) {
            StatsCategoryCardSkeleton()
        }
    }
}

@Composable
private fun StatsCategoryCardSkeleton() {
    Card(
        modifier = Modifier.fillMaxWidth(),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Column(
            modifier = Modifier.padding(16.dp)
        ) {
            Box(
                modifier = Modifier
                    .width(80.dp)
                    .height(20.dp)
                    .shimmerEffect()
            )
            
            Spacer(modifier = Modifier.height(12.dp))
            
            repeat(3) {
                StatComparisonRowSkeleton()
                Spacer(modifier = Modifier.height(12.dp))
            }
        }
    }
}

@Composable
private fun StatComparisonRowSkeleton() {
    Column {
        Box(
            modifier = Modifier
                .width(100.dp)
                .height(16.dp)
                .align(Alignment.CenterHorizontally)
                .shimmerEffect()
        )
        
        Spacer(modifier = Modifier.height(8.dp))
        
        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Box(
                modifier = Modifier
                    .width(50.dp)
                    .height(16.dp)
                    .shimmerEffect()
            )
            
            Box(
                modifier = Modifier
                    .weight(1f)
                    .height(8.dp)
                    .padding(horizontal = 16.dp)
                    .shimmerEffect()
            )
            
            Box(
                modifier = Modifier
                    .width(50.dp)
                    .height(16.dp)
                    .shimmerEffect()
            )
        }
    }
}

@Composable
private fun StatisticsEmptyState(
    modifier: Modifier = Modifier
) {
    Column(
        modifier = modifier
            .fillMaxSize()
            .padding(32.dp),
        verticalArrangement = Arrangement.Center,
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Icon(
            imageVector = Icons.Default.BarChart,
            contentDescription = null,
            modifier = Modifier.size(64.dp),
            tint = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.6f)
        )
        
        Spacer(modifier = Modifier.height(16.dp))
        
        Text(
            text = "통계 정보가 없습니다",
            style = MaterialTheme.typography.titleMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            textAlign = TextAlign.Center
        )
        
        Text(
            text = "경기가 진행되면 상세한 통계가 여기에 표시됩니다",
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.7f),
            textAlign = TextAlign.Center,
            modifier = Modifier.padding(top = 8.dp)
        )
    }
}

// 데이터 클래스 및 유틸리티 함수들
data class StatComparison(
    val name: String,
    val homeValue: String,
    val awayValue: String,
    val homeNumericValue: Float,
    val awayNumericValue: Float
)

private fun groupStatistics(
    homeStats: List<com.hyunwoopark.futinfo.data.remote.dto.FixtureStatisticDto>,
    awayStats: List<com.hyunwoopark.futinfo.data.remote.dto.FixtureStatisticDto>
): List<Pair<String, List<StatComparison>>> {
    val statMap = mutableMapOf<String, StatComparison>()
    
    // 홈팀과 어웨이팀 통계를 매칭
    homeStats.forEachIndexed { index, homeStat ->
        val awayStat = awayStats.getOrNull(index)
        if (awayStat != null && homeStat.type == awayStat.type) {
            val homeValue = homeStat.getDisplayValue()
            val awayValue = awayStat.getDisplayValue()
            
            statMap[homeStat.type] = StatComparison(
                name = translateStatName(homeStat.type),
                homeValue = homeValue,
                awayValue = awayValue,
                homeNumericValue = parseStatValue(homeValue),
                awayNumericValue = parseStatValue(awayValue)
            )
        }
    }
    
    // 카테고리별로 그룹화
    return groupStatsByCategory(statMap.values.toList())
}

private fun groupStatsByCategory(stats: List<StatComparison>): List<Pair<String, List<StatComparison>>> {
    val categories = mutableMapOf<String, MutableList<StatComparison>>()
    
    stats.forEach { stat ->
        val category = getCategoryForStat(stat.name)
        categories.getOrPut(category) { mutableListOf() }.add(stat)
    }
    
    return categories.toList().sortedBy { getCategoryOrder(it.first) }
}

private fun getCategoryForStat(statName: String): String {
    return when {
        statName.contains("점유율") || statName.contains("패스") -> "볼 컨트롤"
        statName.contains("슈팅") || statName.contains("골") -> "공격"
        statName.contains("파울") || statName.contains("카드") || statName.contains("오프사이드") -> "규율"
        else -> "기타"
    }
}

private fun getCategoryOrder(category: String): Int {
    return when (category) {
        "볼 컨트롤" -> 1
        "공격" -> 2
        "규율" -> 3
        else -> 4
    }
}

private fun translateStatName(statType: String): String {
    return when (statType.lowercase()) {
        "ball possession" -> "볼 점유율"
        "total shots" -> "총 슈팅"
        "shots on goal" -> "유효 슈팅"
        "shots off goal" -> "무효 슈팅"
        "blocked shots" -> "차단된 슈팅"
        "shots insidebox" -> "박스 안 슈팅"
        "shots outsidebox" -> "박스 밖 슈팅"
        "fouls" -> "파울"
        "corner kicks" -> "코너킥"
        "offsides" -> "오프사이드"
        "yellow cards" -> "옐로카드"
        "red cards" -> "레드카드"
        "goalkeeper saves" -> "골키퍼 선방"
        "total passes" -> "총 패스"
        "passes accurate" -> "정확한 패스"
        "passes %" -> "패스 성공률"
        else -> statType
    }
}

private fun parseStatValue(value: String): Float {
    return try {
        // 퍼센트 제거
        val cleanValue = value.replace("%", "").replace(",", "")
        cleanValue.toFloatOrNull() ?: 0f
    } catch (e: Exception) {
        0f
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