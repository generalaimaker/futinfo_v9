package com.hyunwoopark.futinfo.presentation.league_detail.tabs

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import coil.request.ImageRequest
import com.hyunwoopark.futinfo.R
import com.hyunwoopark.futinfo.domain.model.Bracket
import com.hyunwoopark.futinfo.domain.model.BracketFixture
import com.hyunwoopark.futinfo.domain.model.BracketRound
import com.hyunwoopark.futinfo.domain.model.BracketTeam
import com.hyunwoopark.futinfo.presentation.components.IOSStyleCard
import com.hyunwoopark.futinfo.presentation.theme.DesignSystem

/**
 * 토너먼트 대진표 화면
 */
@Composable
fun BracketScreen(
    bracket: Bracket?,
    isLoading: Boolean,
    error: String?,
    modifier: Modifier = Modifier
) {
    Box(
        modifier = modifier
            .fillMaxSize()
            .background(DesignSystem.colors.background)
    ) {
        when {
            isLoading -> {
                BracketLoadingState()
            }
            error != null -> {
                BracketErrorState(error = error)
            }
            bracket != null -> {
                BracketContent(bracket = bracket)
            }
            else -> {
                BracketEmptyState()
            }
        }
    }
}

@Composable
private fun BracketContent(
    bracket: Bracket,
    modifier: Modifier = Modifier
) {
    LazyColumn(
        modifier = modifier.fillMaxSize(),
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(24.dp)
    ) {
        // 대진표 제목
        item {
            Text(
                text = "토너먼트 대진표",
                style = DesignSystem.typography.headlineMedium,
                color = DesignSystem.colors.onBackground,
                modifier = Modifier.padding(bottom = 8.dp)
            )
        }

        // 각 라운드별 경기들
        items(bracket.rounds) { round ->
            BracketRoundCard(round = round)
        }
    }
}

@Composable
private fun BracketRoundCard(
    round: BracketRound,
    modifier: Modifier = Modifier
) {
    IOSStyleCard(
        modifier = modifier.fillMaxWidth()
    ) {
        Column(
            modifier = Modifier.padding(16.dp)
        ) {
            // 라운드 제목
            Text(
                text = round.round,
                style = DesignSystem.typography.titleLarge,
                color = DesignSystem.colors.onSurface,
                fontWeight = FontWeight.Bold,
                modifier = Modifier.padding(bottom = 16.dp)
            )

            // 경기 목록
            round.fixtures.forEach { fixture ->
                BracketFixtureItem(
                    fixture = fixture,
                    modifier = Modifier.padding(bottom = 12.dp)
                )
            }
        }
    }
}

@Composable
private fun BracketFixtureItem(
    fixture: BracketFixture,
    modifier: Modifier = Modifier
) {
    Card(
        modifier = modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(12.dp))
            .border(
                width = 1.dp,
                color = DesignSystem.colors.outline.copy(alpha = 0.2f),
                shape = RoundedCornerShape(12.dp)
            ),
        colors = CardDefaults.cardColors(
            containerColor = DesignSystem.colors.surface
        ),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Column(
            modifier = Modifier.padding(16.dp)
        ) {
            // 경기 날짜 및 상태
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = fixture.date ?: "TBD",
                    style = DesignSystem.typography.bodySmall,
                    color = DesignSystem.colors.onSurfaceVariant
                )
                
                BracketFixtureStatusChip(status = fixture.status.short)
            }

            Spacer(modifier = Modifier.height(12.dp))

            // 팀 정보 및 스코어
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                // 홈팀
                BracketTeamInfo(
                    team = fixture.homeTeam,
                    score = fixture.homeScore,
                    isWinner = fixture.getWinner()?.id == fixture.homeTeam.id,
                    modifier = Modifier.weight(1f)
                )

                // VS 또는 스코어
                Box(
                    modifier = Modifier.padding(horizontal = 16.dp),
                    contentAlignment = Alignment.Center
                ) {
                    if (fixture.homeScore != null && fixture.awayScore != null) {
                        Text(
                            text = "${fixture.homeScore} - ${fixture.awayScore}",
                            style = DesignSystem.typography.titleLarge,
                            color = DesignSystem.colors.primary,
                            fontWeight = FontWeight.Bold
                        )
                    } else {
                        Text(
                            text = "VS",
                            style = DesignSystem.typography.bodyMedium,
                            color = DesignSystem.colors.onSurfaceVariant
                        )
                    }
                }

                // 어웨이팀
                BracketTeamInfo(
                    team = fixture.awayTeam,
                    score = fixture.awayScore,
                    isWinner = fixture.getWinner()?.id == fixture.awayTeam.id,
                    modifier = Modifier.weight(1f),
                    isReversed = true
                )
            }

            // 경기장 정보
            fixture.venue?.let { venue ->
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    text = "${venue.name}, ${venue.city}",
                    style = DesignSystem.typography.bodySmall,
                    color = DesignSystem.colors.onSurfaceVariant,
                    textAlign = TextAlign.Center,
                    modifier = Modifier.fillMaxWidth()
                )
            }
        }
    }
}

@Composable
private fun BracketTeamInfo(
    team: BracketTeam?,
    score: Int?,
    isWinner: Boolean,
    modifier: Modifier = Modifier,
    isReversed: Boolean = false
) {
    Row(
        modifier = modifier,
        horizontalArrangement = if (isReversed) Arrangement.End else Arrangement.Start,
        verticalAlignment = Alignment.CenterVertically
    ) {
        if (!isReversed) {
            // 팀 로고
            AsyncImage(
                model = ImageRequest.Builder(LocalContext.current)
                    .data(team?.logo)
                    .crossfade(true)
                    .build(),
                contentDescription = "${team?.name} 로고",
                modifier = Modifier
                    .size(32.dp)
                    .clip(RoundedCornerShape(16.dp)),
                contentScale = ContentScale.Fit,
                placeholder = painterResource(id = android.R.drawable.ic_menu_gallery),
                error = painterResource(id = android.R.drawable.ic_menu_gallery)
            )

            Spacer(modifier = Modifier.width(8.dp))
        }

        // 팀 이름
        Column(
            horizontalAlignment = if (isReversed) Alignment.End else Alignment.Start
        ) {
            Text(
                text = team?.name ?: "TBD",
                style = DesignSystem.typography.bodyMedium,
                color = if (isWinner) DesignSystem.colors.primary else DesignSystem.colors.onSurface,
                fontWeight = if (isWinner) FontWeight.Bold else FontWeight.Normal,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis
            )
        }

        if (isReversed) {
            Spacer(modifier = Modifier.width(8.dp))

            // 팀 로고
            AsyncImage(
                model = ImageRequest.Builder(LocalContext.current)
                    .data(team?.logo)
                    .crossfade(true)
                    .build(),
                contentDescription = "${team?.name} 로고",
                modifier = Modifier
                    .size(32.dp)
                    .clip(RoundedCornerShape(16.dp)),
                contentScale = ContentScale.Fit,
                placeholder = painterResource(id = android.R.drawable.ic_menu_gallery),
                error = painterResource(id = android.R.drawable.ic_menu_gallery)
            )
        }
    }
}

@Composable
private fun BracketFixtureStatusChip(
    status: String,
    modifier: Modifier = Modifier
) {
    val (backgroundColor, textColor) = when (status.uppercase()) {
        "FT" -> DesignSystem.colors.primary to DesignSystem.colors.onPrimary
        "LIVE" -> Color(0xFFE53E3E) to Color.White
        "NS" -> DesignSystem.colors.surfaceVariant to DesignSystem.colors.onSurfaceVariant
        else -> DesignSystem.colors.surfaceVariant to DesignSystem.colors.onSurfaceVariant
    }

    Surface(
        modifier = modifier,
        shape = RoundedCornerShape(12.dp),
        color = backgroundColor
    ) {
        Text(
            text = status,
            style = DesignSystem.typography.labelSmall,
            color = textColor,
            modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
        )
    }
}

@Composable
private fun BracketLoadingState(
    modifier: Modifier = Modifier
) {
    Box(
        modifier = modifier.fillMaxSize(),
        contentAlignment = Alignment.Center
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            CircularProgressIndicator(
                color = DesignSystem.colors.primary,
                modifier = Modifier.size(48.dp)
            )
            Spacer(modifier = Modifier.height(16.dp))
            Text(
                text = "대진표를 불러오는 중...",
                style = DesignSystem.typography.bodyMedium,
                color = DesignSystem.colors.onSurfaceVariant
            )
        }
    }
}

@Composable
private fun BracketErrorState(
    error: String,
    modifier: Modifier = Modifier
) {
    Box(
        modifier = modifier.fillMaxSize(),
        contentAlignment = Alignment.Center
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            Icon(
                painter = painterResource(id = android.R.drawable.ic_dialog_alert),
                contentDescription = "오류",
                tint = DesignSystem.colors.error,
                modifier = Modifier.size(48.dp)
            )
            Spacer(modifier = Modifier.height(16.dp))
            Text(
                text = "대진표를 불러올 수 없습니다",
                style = DesignSystem.typography.titleMedium,
                color = DesignSystem.colors.onSurface,
                textAlign = TextAlign.Center
            )
            Spacer(modifier = Modifier.height(8.dp))
            Text(
                text = error,
                style = DesignSystem.typography.bodyMedium,
                color = DesignSystem.colors.onSurfaceVariant,
                textAlign = TextAlign.Center
            )
        }
    }
}

@Composable
private fun BracketEmptyState(
    modifier: Modifier = Modifier
) {
    Box(
        modifier = modifier.fillMaxSize(),
        contentAlignment = Alignment.Center
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            Icon(
                painter = painterResource(id = android.R.drawable.ic_menu_agenda),
                contentDescription = "토너먼트",
                tint = DesignSystem.colors.onSurfaceVariant,
                modifier = Modifier.size(48.dp)
            )
            Spacer(modifier = Modifier.height(16.dp))
            Text(
                text = "대진표가 없습니다",
                style = DesignSystem.typography.titleMedium,
                color = DesignSystem.colors.onSurface,
                textAlign = TextAlign.Center
            )
            Spacer(modifier = Modifier.height(8.dp))
            Text(
                text = "이 리그는 토너먼트 형식이 아니거나\n아직 대진표가 확정되지 않았습니다",
                style = DesignSystem.typography.bodyMedium,
                color = DesignSystem.colors.onSurfaceVariant,
                textAlign = TextAlign.Center
            )
        }
    }
}