package com.hyunwoopark.futinfo.presentation.fixture_detail.tabs

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
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
import androidx.compose.ui.graphics.drawscope.DrawScope
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.hyunwoopark.futinfo.data.remote.dto.TeamLineupDto
import com.hyunwoopark.futinfo.data.remote.dto.LineupPlayerDto
import com.hyunwoopark.futinfo.domain.model.FixtureDetailBundle

/**
 * 라인업 탭 전용 화면
 * 
 * iOS LineupsView와 동일한 기능:
 * - 선발/교체 선수 명단 및 포메이션
 * - 시각적 포메이션 표시
 * - 선수별 상세 정보
 * - 교체 선수 목록
 */
@Composable
fun LineupsScreen(
    data: FixtureDetailBundle,
    isLoading: Boolean = false,
    modifier: Modifier = Modifier
) {
    if (isLoading) {
        LineupsLoadingState(modifier = modifier)
    } else if (data.lineups.isNotEmpty()) {
        LineupsContent(
            lineups = data.lineups,
            modifier = modifier
        )
    } else {
        LineupsEmptyState(modifier = modifier)
    }
}

@Composable
private fun LineupsContent(
    lineups: List<TeamLineupDto>,
    modifier: Modifier = Modifier
) {
    LazyColumn(
        modifier = modifier
            .fillMaxSize()
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(24.dp)
    ) {
        item {
            Text(
                text = "라인업",
                style = MaterialTheme.typography.titleLarge,
                fontWeight = FontWeight.Bold
            )
        }
        
        items(lineups) { lineup ->
            TeamLineupCard(lineup = lineup)
        }
    }
}

@Composable
private fun TeamLineupCard(
    lineup: TeamLineupDto
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        elevation = CardDefaults.cardElevation(defaultElevation = 4.dp),
        shape = RoundedCornerShape(16.dp)
    ) {
        Column(
            modifier = Modifier.padding(20.dp)
        ) {
            // 팀 헤더
            TeamLineupHeader(
                teamName = lineup.team.name,
                formation = lineup.formation ?: "N/A"
            )
            
            Spacer(modifier = Modifier.height(20.dp))
            
            // 포메이션 시각화 (formation과 startXI가 있을 때만)
            if (lineup.formation != null && !lineup.startXI.isNullOrEmpty()) {
                FormationVisualization(
                    formation = lineup.formation,
                    players = lineup.startXI
                )
                
                Spacer(modifier = Modifier.height(24.dp))
            }
            
            // 선발 라인업
            if (!lineup.startXI.isNullOrEmpty()) {
                StartingLineupSection(players = lineup.startXI)
            }
            
            // 교체 선수
            if (!lineup.substitutes.isNullOrEmpty()) {
                Spacer(modifier = Modifier.height(20.dp))
                SubstitutesSection(players = lineup.substitutes)
            }
        }
    }
}

@Composable
private fun TeamLineupHeader(
    teamName: String,
    formation: String
) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(
            text = teamName,
            style = MaterialTheme.typography.titleLarge,
            fontWeight = FontWeight.Bold,
            color = MaterialTheme.colorScheme.primary
        )
        
        Surface(
            color = MaterialTheme.colorScheme.primaryContainer,
            shape = RoundedCornerShape(12.dp)
        ) {
            Text(
                text = formation,
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.SemiBold,
                color = MaterialTheme.colorScheme.onPrimaryContainer,
                modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp)
            )
        }
    }
}

@Composable
private fun FormationVisualization(
    formation: String,
    players: List<LineupPlayerDto>
) {
    val formationLines = parseFormation(formation)
    
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .height(200.dp),
        colors = CardDefaults.cardColors(
            containerColor = Color(0xFF2E7D32).copy(alpha = 0.1f)
        ),
        shape = RoundedCornerShape(12.dp)
    ) {
        Box(
            modifier = Modifier.fillMaxSize()
        ) {
            // 축구장 배경
            Canvas(
                modifier = Modifier.fillMaxSize()
            ) {
                drawFootballField()
            }
            
            // 선수 포지션
            FormationPositions(
                formationLines = formationLines,
                players = players,
                modifier = Modifier.fillMaxSize()
            )
        }
    }
}

@Composable
private fun FormationPositions(
    formationLines: List<Int>,
    players: List<LineupPlayerDto>,
    modifier: Modifier = Modifier
) {
    Box(modifier = modifier) {
        val totalLines = formationLines.size + 1 // +1 for goalkeeper
        
        // 골키퍼
        val goalkeeper = players.firstOrNull { it.player.pos == "G" }
        if (goalkeeper != null) {
            PlayerPosition(
                player = goalkeeper,
                modifier = Modifier
                    .align(Alignment.BottomCenter)
                    .offset(y = (-20).dp)
            )
        }
        
        // 필드 플레이어들
        var playerIndex = 1 // 골키퍼 제외
        formationLines.forEachIndexed { lineIndex, playersInLine ->
            val yPosition = (lineIndex + 1).toFloat() / (totalLines + 1)
            
            repeat(playersInLine) { positionIndex ->
                if (playerIndex < players.size) {
                    val player = players[playerIndex]
                    val xPosition = (positionIndex + 1).toFloat() / (playersInLine + 1)
                    
                    PlayerPosition(
                        player = player,
                        modifier = Modifier
                            .align(Alignment.TopStart)
                            .offset(
                                x = (xPosition * 300).dp,
                                y = (yPosition * 160).dp
                            )
                    )
                    playerIndex++
                }
            }
        }
    }
}

@Composable
private fun PlayerPosition(
    player: LineupPlayerDto,
    modifier: Modifier = Modifier
) {
    Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        modifier = modifier
    ) {
        // 선수 번호
        Surface(
            shape = CircleShape,
            color = MaterialTheme.colorScheme.primary,
            modifier = Modifier.size(24.dp)
        ) {
            Box(
                contentAlignment = Alignment.Center,
                modifier = Modifier.fillMaxSize()
            ) {
                Text(
                    text = "${player.player.number ?: "?"}",
                    color = Color.White,
                    fontSize = 10.sp,
                    fontWeight = FontWeight.Bold
                )
            }
        }
        
        // 선수 이름 (축약)
        Text(
            text = player.player.name?.split(" ")?.lastOrNull() ?: "",
            fontSize = 8.sp,
            color = MaterialTheme.colorScheme.onSurface,
            maxLines = 1,
            modifier = Modifier.padding(top = 2.dp)
        )
    }
}

@Composable
private fun StartingLineupSection(
    players: List<LineupPlayerDto>
) {
    Column {
        Row(
            verticalAlignment = Alignment.CenterVertically,
            modifier = Modifier.padding(bottom = 12.dp)
        ) {
            Icon(
                imageVector = Icons.Default.Groups,
                contentDescription = null,
                tint = MaterialTheme.colorScheme.primary,
                modifier = Modifier.size(20.dp)
            )
            Spacer(modifier = Modifier.width(8.dp))
            Text(
                text = "선발 라인업",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.SemiBold
            )
        }
        
        players.forEach { player ->
            PlayerListItem(
                player = player,
                isSubstitute = false
            )
        }
    }
}

@Composable
private fun SubstitutesSection(
    players: List<LineupPlayerDto>
) {
    Column {
        Row(
            verticalAlignment = Alignment.CenterVertically,
            modifier = Modifier.padding(bottom = 12.dp)
        ) {
            Icon(
                imageVector = Icons.Default.SwapHoriz,
                contentDescription = null,
                tint = MaterialTheme.colorScheme.secondary,
                modifier = Modifier.size(20.dp)
            )
            Spacer(modifier = Modifier.width(8.dp))
            Text(
                text = "교체 선수",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.SemiBold
            )
        }
        
        players.forEach { player ->
            PlayerListItem(
                player = player,
                isSubstitute = true
            )
        }
    }
}

@Composable
private fun PlayerListItem(
    player: LineupPlayerDto,
    isSubstitute: Boolean
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 6.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        // 선수 번호
        Surface(
            shape = CircleShape,
            color = if (isSubstitute) 
                MaterialTheme.colorScheme.secondaryContainer 
            else 
                MaterialTheme.colorScheme.primaryContainer,
            modifier = Modifier.size(32.dp)
        ) {
            Box(
                contentAlignment = Alignment.Center,
                modifier = Modifier.fillMaxSize()
            ) {
                Text(
                    text = "${player.player.number ?: "?"}",
                    style = MaterialTheme.typography.labelMedium,
                    fontWeight = FontWeight.Bold,
                    color = if (isSubstitute)
                        MaterialTheme.colorScheme.onSecondaryContainer
                    else
                        MaterialTheme.colorScheme.onPrimaryContainer
                )
            }
        }
        
        Spacer(modifier = Modifier.width(12.dp))
        
        // 선수 정보
        Column(
            modifier = Modifier.weight(1f)
        ) {
            Text(
                text = player.player.name ?: "Unknown",
                style = MaterialTheme.typography.bodyMedium,
                fontWeight = FontWeight.Medium
            )
            
            if (!player.player.pos.isNullOrBlank()) {
                Text(
                    text = translatePosition(player.player.pos),
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }
        
        // 포지션 배지
        if (!player.player.pos.isNullOrBlank()) {
            Surface(
                color = getPositionColor(player.player.pos),
                shape = RoundedCornerShape(6.dp)
            ) {
                Text(
                    text = player.player.pos,
                    style = MaterialTheme.typography.labelSmall,
                    color = Color.White,
                    modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                )
            }
        }
    }
}

@Composable
private fun LineupsLoadingState(
    modifier: Modifier = Modifier
) {
    LazyColumn(
        modifier = modifier
            .fillMaxSize()
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(24.dp)
    ) {
        item {
            Box(
                modifier = Modifier
                    .width(80.dp)
                    .height(24.dp)
                    .shimmerEffect()
            )
        }
        
        items(2) {
            TeamLineupCardSkeleton()
        }
    }
}

@Composable
private fun TeamLineupCardSkeleton() {
    Card(
        modifier = Modifier.fillMaxWidth(),
        elevation = CardDefaults.cardElevation(defaultElevation = 4.dp)
    ) {
        Column(
            modifier = Modifier.padding(20.dp)
        ) {
            // 헤더 스켈레톤
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Box(
                    modifier = Modifier
                        .width(120.dp)
                        .height(24.dp)
                        .shimmerEffect()
                )
                Box(
                    modifier = Modifier
                        .width(60.dp)
                        .height(24.dp)
                        .shimmerEffect()
                )
            }
            
            Spacer(modifier = Modifier.height(20.dp))
            
            // 포메이션 스켈레톤
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(200.dp)
                    .shimmerEffect()
            )
            
            Spacer(modifier = Modifier.height(24.dp))
            
            // 선수 목록 스켈레톤
            repeat(11) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = 6.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Box(
                        modifier = Modifier
                            .size(32.dp)
                            .shimmerEffect()
                    )
                    Spacer(modifier = Modifier.width(12.dp))
                    Column(
                        modifier = Modifier.weight(1f)
                    ) {
                        Box(
                            modifier = Modifier
                                .fillMaxWidth(0.7f)
                                .height(16.dp)
                                .shimmerEffect()
                        )
                        Spacer(modifier = Modifier.height(4.dp))
                        Box(
                            modifier = Modifier
                                .fillMaxWidth(0.3f)
                                .height(12.dp)
                                .shimmerEffect()
                        )
                    }
                    Box(
                        modifier = Modifier
                            .width(30.dp)
                            .height(16.dp)
                            .shimmerEffect()
                    )
                }
            }
        }
    }
}

@Composable
private fun LineupsEmptyState(
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
            imageVector = Icons.Default.Groups,
            contentDescription = null,
            modifier = Modifier.size(64.dp),
            tint = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.6f)
        )
        
        Spacer(modifier = Modifier.height(16.dp))
        
        Text(
            text = "라인업 정보가 없습니다",
            style = MaterialTheme.typography.titleMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            textAlign = TextAlign.Center
        )
        
        Text(
            text = "경기 시작 전에 라인업이 발표됩니다",
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.7f),
            textAlign = TextAlign.Center,
            modifier = Modifier.padding(top = 8.dp)
        )
    }
}

// 유틸리티 함수들
private fun parseFormation(formation: String): List<Int> {
    return formation.split("-").mapNotNull { it.toIntOrNull() }
}

private fun translatePosition(position: String): String {
    return when (position.uppercase()) {
        "G" -> "골키퍼"
        "D" -> "수비수"
        "M" -> "미드필더"
        "F" -> "공격수"
        else -> position
    }
}

private fun getPositionColor(position: String): Color {
    return when (position.uppercase()) {
        "G" -> Color(0xFFFFC107) // 노란색
        "D" -> Color(0xFF2196F3) // 파란색
        "M" -> Color(0xFF4CAF50) // 초록색
        "F" -> Color(0xFFF44336) // 빨간색
        else -> Color(0xFF757575) // 회색
    }
}

private fun DrawScope.drawFootballField() {
    val fieldColor = Color(0xFF4CAF50).copy(alpha = 0.3f)
    val lineColor = Color.White.copy(alpha = 0.8f)
    
    // 필드 배경
    drawRect(
        color = fieldColor,
        size = size
    )
    
    // 중앙선
    drawLine(
        color = lineColor,
        start = Offset(0f, size.height / 2),
        end = Offset(size.width, size.height / 2),
        strokeWidth = 2.dp.toPx()
    )
    
    // 중앙 원
    drawCircle(
        color = lineColor,
        radius = 30.dp.toPx(),
        center = Offset(size.width / 2, size.height / 2),
        style = androidx.compose.ui.graphics.drawscope.Stroke(width = 2.dp.toPx())
    )
    
    // 페널티 박스 (간단화)
    val penaltyBoxWidth = size.width * 0.3f
    val penaltyBoxHeight = 40.dp.toPx()
    
    // 상단 페널티 박스
    drawRect(
        color = lineColor,
        topLeft = Offset((size.width - penaltyBoxWidth) / 2, 0f),
        size = androidx.compose.ui.geometry.Size(penaltyBoxWidth, penaltyBoxHeight),
        style = androidx.compose.ui.graphics.drawscope.Stroke(width = 2.dp.toPx())
    )
    
    // 하단 페널티 박스
    drawRect(
        color = lineColor,
        topLeft = Offset((size.width - penaltyBoxWidth) / 2, size.height - penaltyBoxHeight),
        size = androidx.compose.ui.geometry.Size(penaltyBoxWidth, penaltyBoxHeight),
        style = androidx.compose.ui.graphics.drawscope.Stroke(width = 2.dp.toPx())
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