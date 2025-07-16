package com.hyunwoopark.futinfo.presentation.fixtures_overview.components

import androidx.compose.animation.*
import androidx.compose.animation.core.*
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.drawscope.DrawScope
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import com.hyunwoopark.futinfo.data.remote.dto.FixtureDto
import com.hyunwoopark.futinfo.presentation.theme.FutInfoDesignSystem
import com.hyunwoopark.futinfo.util.TeamNameUtils
import com.hyunwoopark.futinfo.util.LeagueNameLocalizer
import com.hyunwoopark.futinfo.util.LeagueLogoMapper
import java.text.SimpleDateFormat
import java.util.*

/**
 * iOS 스타일 경기 카드 컴포넌트
 * iOS의 FixtureCardView와 동일한 디자인과 레이아웃
 */
@Composable
fun IOSStyleFixtureCard(
    fixture: FixtureDto,
    onClick: () -> Unit,
    onTeamClick: (Int) -> Unit = {},
    modifier: Modifier = Modifier
) {
    Card(
        modifier = modifier
            .fillMaxWidth()
            .clickable { onClick() }
            .shadow(
                elevation = 2.dp,
                shape = RoundedCornerShape(12.dp),
                clip = false
            ),
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(
            containerColor = Color.White
        )
    ) {
        Box {
            // 메인 콘텐츠
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(16.dp)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    // 홈팀
                    IOSStyleTeamInfo(
                        teamName = fixture.teams.home.name,
                        teamLogo = fixture.teams.home.logo,
                        isHome = true,
                        onClick = { onTeamClick(fixture.teams.home.id) },
                        modifier = Modifier.weight(1f)
                    )
                    
                    // 스코어 또는 시간
                    IOSStyleScoreView(
                        fixture = fixture,
                        modifier = Modifier.padding(horizontal = 16.dp)
                    )
                    
                    // 어웨이팀
                    IOSStyleTeamInfo(
                        teamName = fixture.teams.away.name,
                        teamLogo = fixture.teams.away.logo,
                        isHome = false,
                        onClick = { onTeamClick(fixture.teams.away.id) },
                        modifier = Modifier.weight(1f)
                    )
                }
            }
            
            // 상태 배지 (우상단)
            if (!listOf("NS", "TBD").contains(fixture.fixture.status.short)) {
                Box(
                    modifier = Modifier
                        .align(Alignment.TopEnd)
                        .padding(8.dp)
                ) {
                    IOSStyleStatusBadge(status = fixture.fixture.status.short)
                }
            }
        }
    }
}

/**
 * iOS 스타일 팀 정보 컴포넌트
 */
@Composable
fun IOSStyleTeamInfo(
    teamName: String,
    teamLogo: String,
    isHome: Boolean,
    onClick: () -> Unit = {},
    modifier: Modifier = Modifier
) {
    Row(
        modifier = modifier
            .clickable { onClick() },
        horizontalArrangement = if (isHome) Arrangement.Start else Arrangement.End,
        verticalAlignment = Alignment.CenterVertically
    ) {
        if (isHome) {
            // 홈팀: 로고 - 이름
            TeamLogo(teamLogo)
            Spacer(modifier = Modifier.width(8.dp))
            TeamName(teamName, isHome)
        } else {
            // 어웨이팀: 이름 - 로고
            TeamName(teamName, isHome)
            Spacer(modifier = Modifier.width(8.dp))
            TeamLogo(teamLogo)
        }
    }
}

@Composable
private fun TeamLogo(logoUrl: String) {
    Box(
        modifier = Modifier
            .size(36.dp)
            .clip(CircleShape)
            .background(Color(0xFFF5F5F5))
    ) {
        AsyncImage(
            model = logoUrl,
            contentDescription = null,
            modifier = Modifier
                .size(28.dp)
                .align(Alignment.Center)
        )
    }
}

@Composable
private fun TeamName(
    name: String,
    isHome: Boolean
) {
    Text(
        text = TeamNameUtils.getShortName(name),
        style = MaterialTheme.typography.bodyMedium.copy(
            fontWeight = FontWeight.SemiBold
        ),
        maxLines = 1,
        overflow = TextOverflow.Ellipsis,
        textAlign = if (isHome) TextAlign.Start else TextAlign.End
    )
}

/**
 * iOS 스타일 스코어 뷰
 */
@Composable
fun IOSStyleScoreView(
    fixture: FixtureDto,
    modifier: Modifier = Modifier
) {
    val status = fixture.fixture.status.short
    val isLive = listOf("1H", "2H", "HT", "ET", "P", "BT").contains(status)
    val isFinished = listOf("FT", "AET", "PEN").contains(status)
    
    Column(
        modifier = modifier,
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        when {
            isLive -> {
                // 라이브 경기
                LiveScoreDisplay(fixture)
            }
            isFinished -> {
                // 종료된 경기
                FinishedScoreDisplay(fixture)
            }
            else -> {
                // 예정된 경기
                ScheduledTimeDisplay(fixture)
            }
        }
    }
}

@Composable
private fun LiveScoreDisplay(fixture: FixtureDto) {
    val infiniteTransition = rememberInfiniteTransition(label = "live")
    val alpha by infiniteTransition.animateFloat(
        initialValue = 0.5f,
        targetValue = 1f,
        animationSpec = infiniteRepeatable(
            animation = tween(800),
            repeatMode = RepeatMode.Reverse
        ),
        label = "alpha"
    )
    
    Column(
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        // 경기 시간
        Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.Center
        ) {
            Canvas(
                modifier = Modifier.size(6.dp)
            ) {
                drawCircle(
                    color = Color.Red.copy(alpha = alpha),
                    radius = size.width / 2
                )
            }
            Spacer(modifier = Modifier.width(4.dp))
            Text(
                text = when (fixture.fixture.status.short) {
                    "HT" -> "HT"
                    else -> "${fixture.fixture.status.elapsed ?: 0}'"
                },
                style = MaterialTheme.typography.labelSmall.copy(
                    color = Color.Red,
                    fontWeight = FontWeight.Bold
                ),
                fontSize = 11.sp
            )
        }
        
        // 스코어
        Row(
            horizontalArrangement = Arrangement.Center,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = "${fixture.homeGoals}",
                style = MaterialTheme.typography.titleLarge.copy(
                    fontWeight = FontWeight.Bold
                ),
                fontSize = 20.sp
            )
            Text(
                text = " : ",
                style = MaterialTheme.typography.titleLarge,
                fontSize = 20.sp
            )
            Text(
                text = "${fixture.awayGoals}",
                style = MaterialTheme.typography.titleLarge.copy(
                    fontWeight = FontWeight.Bold
                ),
                fontSize = 20.sp
            )
        }
    }
}

@Composable
private fun FinishedScoreDisplay(fixture: FixtureDto) {
    Column(
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        // 종료 상태
        Text(
            text = when (fixture.fixture.status.short) {
                "AET" -> "AET"
                "PEN" -> "PEN"
                else -> "FT"
            },
            style = MaterialTheme.typography.labelSmall,
            color = Color.Gray,
            fontSize = 11.sp
        )
        
        // 스코어
        Row(
            horizontalArrangement = Arrangement.Center,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = "${fixture.homeGoals}",
                style = MaterialTheme.typography.titleLarge.copy(
                    fontWeight = FontWeight.Bold
                ),
                fontSize = 20.sp
            )
            Text(
                text = " : ",
                style = MaterialTheme.typography.titleLarge,
                fontSize = 20.sp
            )
            Text(
                text = "${fixture.awayGoals}",
                style = MaterialTheme.typography.titleLarge.copy(
                    fontWeight = FontWeight.Bold
                ),
                fontSize = 20.sp
            )
        }
    }
}

@Composable
private fun ScheduledTimeDisplay(fixture: FixtureDto) {
    val dateFormat = SimpleDateFormat("HH:mm", Locale.getDefault())
    val kickoffTime = try {
        val inputFormat = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ssXXX", Locale.getDefault())
        inputFormat.timeZone = TimeZone.getTimeZone("UTC")
        val date = inputFormat.parse(fixture.fixture.date)
        date?.let { dateFormat.format(it) } ?: "--:--"
    } catch (e: Exception) {
        "--:--"
    }
    
    Text(
        text = kickoffTime,
        style = MaterialTheme.typography.bodyLarge.copy(
            fontWeight = FontWeight.Medium
        ),
        color = FutInfoDesignSystem.Colors.Label.copy(alpha = 0.6f)
    )
}

/**
 * iOS 스타일 상태 배지
 */
@Composable
fun IOSStyleStatusBadge(
    status: String,
    modifier: Modifier = Modifier
) {
    val (text, backgroundColor, textColor) = when (status) {
        "1H", "2H", "HT", "ET", "P", "BT" -> Triple("LIVE", Color.Red, Color.White)
        "FT", "AET", "PEN" -> Triple("FT", Color.Gray, Color.White)
        "SUSP", "INT", "PST", "CANC", "ABD", "AWD", "WO" -> Triple(status, Color(0xFFFF9500), Color.White)
        else -> Triple("", Color.Transparent, Color.Transparent)
    }
    
    if (text.isNotEmpty()) {
        Surface(
            modifier = modifier,
            shape = RoundedCornerShape(4.dp),
            color = backgroundColor
        ) {
            Text(
                text = text,
                modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp),
                style = MaterialTheme.typography.labelSmall.copy(
                    fontWeight = FontWeight.Bold
                ),
                color = textColor,
                fontSize = 10.sp
            )
        }
    }
}

/**
 * iOS 스타일 리그 배너
 */
@Composable
fun IOSStyleLeagueBanner(
    leagueId: Int,
    leagueName: String,
    leagueLogo: String?,
    modifier: Modifier = Modifier
) {
    // 디버깅 로그 추가
    android.util.Log.d("IOSStyleLeagueBanner", "League ID: $leagueId, Name: $leagueName, Logo: $leagueLogo")
    
    // 클럽월드컵 특별 처리
    val actualLeagueId = if (leagueId == 15 && leagueName.contains("Club World Cup", ignoreCase = true)) {
        15 // 클럽월드컵은 ID 15 사용
    } else {
        leagueId
    }
    val gradientColors = getLeagueGradientColors(actualLeagueId)
    
    // 올바른 로고 URL 가져오기
    val correctLogoUrl = LeagueLogoMapper.getCorrectLogoUrl(leagueId, leagueName, leagueLogo)
    android.util.Log.d("IOSStyleLeagueBanner", "Correct Logo URL: $correctLogoUrl")
    
    Surface(
        modifier = modifier.fillMaxWidth(),
        shape = RoundedCornerShape(10.dp),
        color = Color.Transparent
    ) {
        Box(
            modifier = Modifier
                .background(
                    brush = Brush.horizontalGradient(gradientColors),
                    shape = RoundedCornerShape(10.dp)
                )
                .padding(horizontal = 12.dp, vertical = 8.dp)
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.Center,
                modifier = Modifier.fillMaxWidth()
            ) {
                // 리그 로고
                if (correctLogoUrl != null) {
                    Box(
                        modifier = Modifier
                            .size(40.dp)
                            .clip(RoundedCornerShape(8.dp))
                            .background(Color.White)
                    ) {
                        AsyncImage(
                            model = correctLogoUrl,
                            contentDescription = null,
                            modifier = Modifier
                                .size(36.dp)
                                .align(Alignment.Center)
                        )
                    }
                    Spacer(modifier = Modifier.width(12.dp))
                }
                
                // 리그명
                Text(
                    text = LeagueNameLocalizer.getLocalizedName(leagueId, leagueName),
                    style = MaterialTheme.typography.bodyLarge.copy(
                        fontWeight = FontWeight.Bold,
                        color = Color.White
                    ),
                    fontSize = 14.sp
                )
            }
        }
    }
}

/**
 * 리그별 그라데이션 색상
 */
private fun getLeagueGradientColors(leagueId: Int): List<Color> {
    return when (leagueId) {
        39 -> listOf(Color(0xFF480F75), Color(0xFF6B1FA8)) // 프리미어리그
        140 -> listOf(Color(0xFFE83434), Color(0xFFFF5757)) // 라리가
        135 -> listOf(Color(0xFF0019A5), Color(0xFF0033FF)) // 세리에A
        78 -> listOf(Color(0xFFEE0000), Color(0xFFFF3333)) // 분데스리가
        61 -> listOf(Color(0xFF316CF4), Color(0xFF5A8AFF)) // 리그1
        2 -> listOf(Color(0xFF003399), Color(0xFF0055DD)) // 챔피언스리그
        3 -> listOf(Color(0xFFFF6600), Color(0xFFFF8833)) // 유로파리그
        848 -> listOf(Color(0xFF1A4B84), Color(0xFF2A6BB4)) // AFC 챔피언스리그
        292 -> listOf(Color(0xFF004B87), Color(0xFF0066BB)) // K리그
        15 -> listOf(Color(0xFF8B0000), Color(0xFFCD5C5C)) // 클럽월드컵 또는 아시안컵
        17 -> listOf(Color(0xFF003366), Color(0xFF0066CC)) // 알 수 없음
        372 -> listOf(Color(0xFF666666), Color(0xFF999999)) // 알 수 없음
        else -> listOf(Color(0xFF666666), Color(0xFF999999)) // 기타
    }
}

/**
 * iOS 스타일 날짜 선택기
 */
@Composable
fun IOSStyleDateSelector(
    dates: List<String>,
    selectedIndex: Int,
    onDateSelected: (Int) -> Unit,
    loadingDates: Set<String>,
    modifier: Modifier = Modifier
) {
    Row(
        modifier = modifier
            .fillMaxWidth()
            .background(FutInfoDesignSystem.Colors.SystemBackground),
        horizontalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        dates.forEachIndexed { index, date ->
            IOSStyleDateTab(
                date = date,
                isSelected = index == selectedIndex,
                isLoading = loadingDates.contains(date),
                onClick = { onDateSelected(index) }
            )
        }
    }
}

@Composable
private fun IOSStyleDateTab(
    date: String,
    isSelected: Boolean,
    isLoading: Boolean,
    onClick: () -> Unit
) {
    val dateFormat = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault())
    val today = dateFormat.format(Date())
    val isToday = date == today
    
    Column(
        modifier = Modifier
            .clip(RoundedCornerShape(8.dp))
            .clickable { onClick() }
            .background(
                when {
                    isSelected -> FutInfoDesignSystem.Colors.RoyalBlue
                    else -> Color.Transparent
                }
            )
            .padding(horizontal = 12.dp, vertical = 8.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        // 날짜 라벨
        val label = when {
            isToday -> "오늘"
            else -> {
                try {
                    val parsed = dateFormat.parse(date)
                    val dayFormat = SimpleDateFormat("M/d", Locale.getDefault())
                    parsed?.let { dayFormat.format(it) } ?: date
                } catch (e: Exception) {
                    date
                }
            }
        }
        
        Text(
            text = label,
            style = MaterialTheme.typography.bodyMedium.copy(
                fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Medium,
                color = when {
                    isSelected -> Color.White
                    isToday -> FutInfoDesignSystem.Colors.RoyalBlue
                    else -> FutInfoDesignSystem.Colors.Label
                }
            )
        )
        
        // 선택 표시
        if (isSelected) {
            Spacer(modifier = Modifier.height(4.dp))
            Box(
                modifier = Modifier
                    .width(20.dp)
                    .height(3.dp)
                    .background(Color.White, RoundedCornerShape(1.5.dp))
            )
        }
        
        // 로딩 표시
        if (isLoading) {
            Box(
                modifier = Modifier
                    .padding(top = 4.dp)
                    .size(16.dp)
            ) {
                CircularProgressIndicator(
                    modifier = Modifier.size(16.dp),
                    strokeWidth = 2.dp,
                    color = if (isSelected) Color.White else FutInfoDesignSystem.Colors.RoyalBlue
                )
            }
        }
    }
}