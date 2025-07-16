package com.hyunwoopark.futinfo.presentation.fixtures

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.hyunwoopark.futinfo.data.remote.dto.FixtureDto
import java.text.SimpleDateFormat
import java.util.*

/**
 * 경기 목록 화면
 * FixturesViewModel을 사용하여 경기 데이터를 표시합니다.
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun FixturesScreen(
    leagueId: Int,
    viewModel: FixturesViewModel = hiltViewModel(),
    onFixtureClick: (Int) -> Unit = {},
    onTeamClick: (Int) -> Unit = {},
    onBackClick: () -> Unit = {}
) {
    val state by viewModel.state.collectAsStateWithLifecycle()
    
    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Text(
                        text = "경기 목록",
                        style = MaterialTheme.typography.headlineSmall.copy(
                            fontWeight = FontWeight.Bold
                        )
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
                    containerColor = MaterialTheme.colorScheme.primary,
                    titleContentColor = MaterialTheme.colorScheme.onPrimary
                )
            )
        }
    ) { paddingValues ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
        ) {
            when {
                state.isLoading -> {
                    // 로딩 상태
                    Box(
                        modifier = Modifier.fillMaxSize(),
                        contentAlignment = Alignment.Center
                    ) {
                        Column(
                            horizontalAlignment = Alignment.CenterHorizontally,
                            verticalArrangement = Arrangement.Center
                        ) {
                            CircularProgressIndicator(
                                modifier = Modifier.size(48.dp),
                                color = MaterialTheme.colorScheme.primary
                            )
                            Spacer(modifier = Modifier.height(16.dp))
                            Text(
                                text = "경기 목록을 불러오는 중...",
                                style = MaterialTheme.typography.bodyMedium,
                                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f)
                            )
                        }
                    }
                }
                
                state.errorMessage != null -> {
                    // 에러 상태
                    Box(
                        modifier = Modifier.fillMaxSize(),
                        contentAlignment = Alignment.Center
                    ) {
                        Column(
                            horizontalAlignment = Alignment.CenterHorizontally,
                            verticalArrangement = Arrangement.Center,
                            modifier = Modifier.padding(16.dp)
                        ) {
                            Text(
                                text = "오류가 발생했습니다",
                                style = MaterialTheme.typography.headlineSmall,
                                color = MaterialTheme.colorScheme.error,
                                fontWeight = FontWeight.Bold
                            )
                            Spacer(modifier = Modifier.height(8.dp))
                            Text(
                                text = state.errorMessage ?: "알 수 없는 오류가 발생했습니다",
                                style = MaterialTheme.typography.bodyMedium,
                                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f),
                                textAlign = TextAlign.Center
                            )
                            Spacer(modifier = Modifier.height(16.dp))
                            Button(
                                onClick = { viewModel.refreshFixtures() }
                            ) {
                                Text("다시 시도")
                            }
                        }
                    }
                }
                
                else -> {
                    // 성공 상태 - 경기 목록 표시
                    if (state.fixtures.isEmpty()) {
                        Box(
                            modifier = Modifier.fillMaxSize(),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                text = "표시할 경기가 없습니다",
                                style = MaterialTheme.typography.bodyLarge,
                                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f)
                            )
                        }
                    } else {
                        LazyColumn(
                            modifier = Modifier.fillMaxSize(),
                            contentPadding = PaddingValues(16.dp),
                            verticalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            items(state.fixtures) { fixture ->
                                FixtureItem(
                                    fixture = fixture,
                                    onFixtureClick = onFixtureClick,
                                    onTeamClick = onTeamClick
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}

/**
 * 개별 경기 아이템 컴포저블
 * iOS의 FixtureCell을 참고하여 구현
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun FixtureItem(
    fixture: FixtureDto,
    modifier: Modifier = Modifier,
    onFixtureClick: (Int) -> Unit = {},
    onTeamClick: (Int) -> Unit = {}
) {
    Card(
        modifier = modifier
            .fillMaxWidth()
            .shadow(
                elevation = 2.dp,
                shape = RoundedCornerShape(12.dp)
            ),
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surface
        ),
        onClick = { onFixtureClick(fixture.fixture.id) }
    ) {
        Box {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(16.dp)
            ) {
                // 팀 정보와 스코어
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    // 홈팀
                    TeamInfo(
                        teamName = fixture.teams.home.name,
                        isHome = true,
                        modifier = Modifier.weight(1f)
                    )
                    
                    // 스코어 또는 경기 시간
                    ScoreSection(
                        fixture = fixture,
                        modifier = Modifier.padding(horizontal = 16.dp)
                    )
                    
                    // 원정팀
                    TeamInfo(
                        teamName = fixture.teams.away.name,
                        isHome = false,
                        modifier = Modifier.weight(1f)
                    )
                }
                
                Spacer(modifier = Modifier.height(12.dp))
                
                // 라운드 정보와 경기장
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.Center
                ) {
                    Text(
                        text = formatRound(fixture.league.round),
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
                    )
                    
                    fixture.fixture.venue.name?.let { venue ->
                        Text(
                            text = " • $venue",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f),
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis
                        )
                    }
                }
            }
            
            // 상태 뱃지 (우상단)
            StatusBadge(
                status = fixture.fixture.status.short,
                date = fixture.fixture.date,
                modifier = Modifier
                    .align(Alignment.TopEnd)
                    .padding(8.dp)
            )
        }
    }
}

/**
 * 팀 정보 컴포저블
 */
@Composable
fun TeamInfo(
    teamName: String,
    isHome: Boolean,
    modifier: Modifier = Modifier
) {
    Row(
        modifier = modifier,
        horizontalArrangement = if (isHome) Arrangement.Start else Arrangement.End,
        verticalAlignment = Alignment.CenterVertically
    ) {
        if (isHome) {
            Text(
                text = shortenTeamName(teamName),
                style = MaterialTheme.typography.bodyMedium.copy(
                    fontWeight = FontWeight.SemiBold
                ),
                maxLines = 1,
                overflow = TextOverflow.Ellipsis,
                textAlign = TextAlign.Start
            )
            Spacer(modifier = Modifier.width(8.dp))
            // 팀 로고 플레이스홀더
            Box(
                modifier = Modifier
                    .size(24.dp)
                    .clip(RoundedCornerShape(4.dp))
                    .background(MaterialTheme.colorScheme.primary.copy(alpha = 0.1f)),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = teamName.take(1),
                    style = MaterialTheme.typography.bodySmall.copy(
                        fontWeight = FontWeight.Bold
                    ),
                    color = MaterialTheme.colorScheme.primary
                )
            }
        } else {
            // 팀 로고 플레이스홀더
            Box(
                modifier = Modifier
                    .size(24.dp)
                    .clip(RoundedCornerShape(4.dp))
                    .background(MaterialTheme.colorScheme.primary.copy(alpha = 0.1f)),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = teamName.take(1),
                    style = MaterialTheme.typography.bodySmall.copy(
                        fontWeight = FontWeight.Bold
                    ),
                    color = MaterialTheme.colorScheme.primary
                )
            }
            Spacer(modifier = Modifier.width(8.dp))
            Text(
                text = shortenTeamName(teamName),
                style = MaterialTheme.typography.bodyMedium.copy(
                    fontWeight = FontWeight.SemiBold
                ),
                maxLines = 1,
                overflow = TextOverflow.Ellipsis,
                textAlign = TextAlign.End
            )
        }
    }
}

/**
 * 스코어 섹션 컴포저블
 */
@Composable
fun ScoreSection(
    fixture: FixtureDto,
    modifier: Modifier = Modifier
) {
    Box(
        modifier = modifier,
        contentAlignment = Alignment.Center
    ) {
        when (fixture.fixture.status.short) {
            "NS", "TBD" -> {
                // 경기 예정 - 시간 표시
                Text(
                    text = formatMatchTime(fixture.fixture.date),
                    style = MaterialTheme.typography.bodyMedium.copy(
                        fontWeight = FontWeight.Bold
                    ),
                    color = MaterialTheme.colorScheme.primary,
                    modifier = Modifier
                        .background(
                            color = MaterialTheme.colorScheme.primary.copy(alpha = 0.1f),
                            shape = RoundedCornerShape(6.dp)
                        )
                        .padding(horizontal = 8.dp, vertical = 4.dp)
                )
            }
            else -> {
                // 스코어 표시
                Row(
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "${fixture.goals?.home ?: 0}",
                        style = MaterialTheme.typography.headlineSmall.copy(
                            fontWeight = FontWeight.Bold
                        )
                    )
                    Text(
                        text = " : ",
                        style = MaterialTheme.typography.headlineSmall.copy(
                            fontWeight = FontWeight.Bold
                        ),
                        modifier = Modifier.padding(horizontal = 4.dp)
                    )
                    Text(
                        text = "${fixture.goals?.away ?: 0}",
                        style = MaterialTheme.typography.headlineSmall.copy(
                            fontWeight = FontWeight.Bold
                        )
                    )
                }
            }
        }
    }
}

/**
 * 상태 뱃지 컴포저블
 */
@Composable
fun StatusBadge(
    status: String,
    date: String,
    modifier: Modifier = Modifier
) {
    val (text, color) = when (status) {
        "NS", "TBD" -> formatMatchTime(date) to MaterialTheme.colorScheme.primary
        "1H", "2H", "HT", "ET", "BT", "P" -> "LIVE" to Color.Red
        "FT", "AET", "PEN" -> "FT" to MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
        else -> status to MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
    }
    
    Text(
        text = text,
        style = MaterialTheme.typography.bodySmall.copy(
            fontWeight = if (status in listOf("1H", "2H", "HT", "ET", "BT", "P")) FontWeight.Bold else FontWeight.Normal,
            fontSize = 10.sp
        ),
        color = color,
        modifier = modifier
            .background(
                color = color.copy(alpha = 0.1f),
                shape = RoundedCornerShape(4.dp)
            )
            .padding(horizontal = 6.dp, vertical = 2.dp)
    )
}

/**
 * 팀 이름을 줄이는 함수
 */
private fun shortenTeamName(name: String): String {
    return when {
        name.length <= 12 -> name
        name.contains(" ") -> {
            val words = name.split(" ")
            if (words.size >= 2) {
                "${words[0]} ${words[1].take(1)}."
            } else {
                name.take(12)
            }
        }
        else -> name.take(12)
    }
}

/**
 * 라운드 정보 포맷팅
 */
private fun formatRound(round: String): String {
    return if (round.contains("-")) {
        val parts = round.split("-")
        if (parts.size >= 2) {
            "Round - ${parts.last().trim()}"
        } else {
            round
        }
    } else {
        round
    }
}

/**
 * 경기 시간 포맷팅
 */
private fun formatMatchTime(dateString: String): String {
    return try {
        val inputFormat = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ssXXX", Locale.getDefault())
        val outputFormat = SimpleDateFormat("HH:mm", Locale.getDefault())
        outputFormat.timeZone = TimeZone.getTimeZone("Asia/Seoul")
        
        val date = inputFormat.parse(dateString)
        date?.let { outputFormat.format(it) } ?: "TBD"
    } catch (e: Exception) {
        "TBD"
    }
}