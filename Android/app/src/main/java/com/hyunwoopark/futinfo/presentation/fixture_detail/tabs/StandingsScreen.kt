package com.hyunwoopark.futinfo.presentation.fixture_detail.tabs

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.KeyboardArrowDown
import androidx.compose.material.icons.filled.KeyboardArrowUp
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import com.hyunwoopark.futinfo.data.remote.dto.StandingDto
import com.hyunwoopark.futinfo.data.remote.dto.StandingsResponseDto
import com.hyunwoopark.futinfo.util.Resource

/**
 * 순위표 탭 화면
 * iOS StandingsView.swift를 기반으로 구현
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun StandingsScreen(
    standingsState: Resource<StandingsResponseDto>?,
    modifier: Modifier = Modifier
) {
    Column(
        modifier = modifier
            .fillMaxSize()
            .padding(16.dp)
    ) {
        when (standingsState) {
            is Resource.Loading -> {
                StandingsLoadingContent()
            }
            is Resource.Success -> {
                standingsState.data?.response?.firstOrNull()?.league?.standings?.firstOrNull()?.let { standings ->
                    StandingsContent(standings = standings)
                } ?: run {
                    StandingsEmptyContent()
                }
            }
            is Resource.Error -> {
                StandingsErrorContent(message = standingsState.message ?: "순위 정보를 불러올 수 없습니다")
            }
            null -> {
                StandingsEmptyContent()
            }
        }
    }
}

@Composable
private fun StandingsContent(
    standings: List<StandingDto>
) {
    LazyColumn(
        verticalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        // 헤더
        item {
            StandingsHeader()
        }
        
        // 순위표 항목들
        items(standings) { standing ->
            StandingItem(standing = standing)
        }
        
        // 진출권 범례
        item {
            Spacer(modifier = Modifier.height(16.dp))
            QualificationLegend()
        }
    }
}

@Composable
private fun StandingsHeader() {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.primaryContainer
        )
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(12.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = "#",
                modifier = Modifier.width(30.dp),
                fontWeight = FontWeight.Bold,
                fontSize = 12.sp,
                textAlign = TextAlign.Center
            )
            
            Text(
                text = "팀",
                modifier = Modifier.weight(1f),
                fontWeight = FontWeight.Bold,
                fontSize = 12.sp
            )
            
            Text(
                text = "경기",
                modifier = Modifier.width(40.dp),
                fontWeight = FontWeight.Bold,
                fontSize = 12.sp,
                textAlign = TextAlign.Center
            )
            
            Text(
                text = "승",
                modifier = Modifier.width(30.dp),
                fontWeight = FontWeight.Bold,
                fontSize = 12.sp,
                textAlign = TextAlign.Center
            )
            
            Text(
                text = "무",
                modifier = Modifier.width(30.dp),
                fontWeight = FontWeight.Bold,
                fontSize = 12.sp,
                textAlign = TextAlign.Center
            )
            
            Text(
                text = "패",
                modifier = Modifier.width(30.dp),
                fontWeight = FontWeight.Bold,
                fontSize = 12.sp,
                textAlign = TextAlign.Center
            )
            
            Text(
                text = "득실차",
                modifier = Modifier.width(50.dp),
                fontWeight = FontWeight.Bold,
                fontSize = 12.sp,
                textAlign = TextAlign.Center
            )
            
            Text(
                text = "승점",
                modifier = Modifier.width(40.dp),
                fontWeight = FontWeight.Bold,
                fontSize = 12.sp,
                textAlign = TextAlign.Center
            )
        }
    }
}

@Composable
private fun StandingItem(
    standing: StandingDto
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surface
        ),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(12.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            // 순위 + 진출권 표시
            Box(
                modifier = Modifier.width(30.dp),
                contentAlignment = Alignment.Center
            ) {
                // 진출권 색상 표시
                Box(
                    modifier = Modifier
                        .size(20.dp)
                        .clip(CircleShape)
                        .background(getQualificationColor(standing.description))
                )
                
                Text(
                    text = standing.rank.toString(),
                    fontWeight = FontWeight.Bold,
                    fontSize = 12.sp,
                    color = Color.White
                )
            }
            
            // 팀 정보
            Row(
                modifier = Modifier.weight(1f),
                verticalAlignment = Alignment.CenterVertically
            ) {
                AsyncImage(
                    model = standing.team.logo,
                    contentDescription = "${standing.team.name} 로고",
                    modifier = Modifier
                        .size(24.dp)
                        .clip(CircleShape),
                    contentScale = ContentScale.Crop
                )
                
                Spacer(modifier = Modifier.width(8.dp))
                
                Text(
                    text = standing.team.name,
                    fontSize = 14.sp,
                    fontWeight = FontWeight.Medium,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
            }
            
            // 경기수
            Text(
                text = standing.all.played.toString(),
                modifier = Modifier.width(40.dp),
                fontSize = 12.sp,
                textAlign = TextAlign.Center
            )
            
            // 승
            Text(
                text = standing.all.win.toString(),
                modifier = Modifier.width(30.dp),
                fontSize = 12.sp,
                textAlign = TextAlign.Center,
                color = Color(0xFF4CAF50)
            )
            
            // 무
            Text(
                text = standing.all.draw.toString(),
                modifier = Modifier.width(30.dp),
                fontSize = 12.sp,
                textAlign = TextAlign.Center,
                color = Color(0xFFFF9800)
            )
            
            // 패
            Text(
                text = standing.all.lose.toString(),
                modifier = Modifier.width(30.dp),
                fontSize = 12.sp,
                textAlign = TextAlign.Center,
                color = Color(0xFFF44336)
            )
            
            // 득실차
            val goalDiff = standing.all.goals.`for` - standing.all.goals.against
            Text(
                text = if (goalDiff > 0) "+$goalDiff" else goalDiff.toString(),
                modifier = Modifier.width(50.dp),
                fontSize = 12.sp,
                textAlign = TextAlign.Center,
                color = when {
                    goalDiff > 0 -> Color(0xFF4CAF50)
                    goalDiff < 0 -> Color(0xFFF44336)
                    else -> MaterialTheme.colorScheme.onSurface
                }
            )
            
            // 승점
            Text(
                text = standing.points.toString(),
                modifier = Modifier.width(40.dp),
                fontSize = 14.sp,
                fontWeight = FontWeight.Bold,
                textAlign = TextAlign.Center
            )
        }
    }
}

@Composable
private fun QualificationLegend() {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surfaceVariant
        )
    ) {
        Column(
            modifier = Modifier.padding(16.dp)
        ) {
            Text(
                text = "진출권 범례",
                fontWeight = FontWeight.Bold,
                fontSize = 14.sp,
                modifier = Modifier.padding(bottom = 8.dp)
            )
            
            val qualifications = listOf(
                "챔피언스리그" to Color(0xFF1976D2),
                "유로파리그" to Color(0xFFFF9800),
                "컨퍼런스리그" to Color(0xFF9C27B0),
                "강등권" to Color(0xFFF44336)
            )
            
            qualifications.forEach { (name, color) ->
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    modifier = Modifier.padding(vertical = 2.dp)
                ) {
                    Box(
                        modifier = Modifier
                            .size(12.dp)
                            .clip(CircleShape)
                            .background(color)
                    )
                    
                    Spacer(modifier = Modifier.width(8.dp))
                    
                    Text(
                        text = name,
                        fontSize = 12.sp
                    )
                }
            }
        }
    }
}

@Composable
private fun StandingsLoadingContent() {
    Column(
        modifier = Modifier.fillMaxSize(),
        verticalArrangement = Arrangement.Center,
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        CircularProgressIndicator()
        Spacer(modifier = Modifier.height(16.dp))
        Text(
            text = "순위표를 불러오는 중...",
            style = MaterialTheme.typography.bodyMedium
        )
    }
}

@Composable
private fun StandingsEmptyContent() {
    Column(
        modifier = Modifier.fillMaxSize(),
        verticalArrangement = Arrangement.Center,
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Text(
            text = "순위 정보가 없습니다",
            style = MaterialTheme.typography.bodyLarge,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
    }
}

@Composable
private fun StandingsErrorContent(message: String) {
    Column(
        modifier = Modifier.fillMaxSize(),
        verticalArrangement = Arrangement.Center,
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Text(
            text = message,
            style = MaterialTheme.typography.bodyLarge,
            color = MaterialTheme.colorScheme.error,
            textAlign = TextAlign.Center
        )
    }
}

/**
 * 진출권에 따른 색상 반환
 * iOS StandingsView의 로직을 참고
 */
private fun getQualificationColor(description: String?): Color {
    return when {
        description?.contains("Champions League", ignoreCase = true) == true -> Color(0xFF1976D2)
        description?.contains("Europa League", ignoreCase = true) == true -> Color(0xFFFF9800)
        description?.contains("Conference League", ignoreCase = true) == true -> Color(0xFF9C27B0)
        description?.contains("Relegation", ignoreCase = true) == true -> Color(0xFFF44336)
        else -> Color(0xFF757575)
    }
}