package com.hyunwoopark.futinfo.presentation.leagues

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import coil.compose.AsyncImage
import com.hyunwoopark.futinfo.data.remote.dto.LeagueDetailsDto
import com.hyunwoopark.futinfo.util.LeagueLogoMapper
import com.hyunwoopark.futinfo.util.LeagueNameLocalizer

/**
 * 리그 선택 다이얼로그
 * 
 * 사용자가 주요 리그에 추가할 리그를 선택할 수 있는 다이얼로그입니다.
 * 검색 기능과 선택 상태 표시를 포함합니다.
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun LeagueSelectionDialog(
    isVisible: Boolean,
    allLeagues: List<LeagueDetailsDto>,
    userLeagueIds: List<Int>,
    onDismiss: () -> Unit,
    onLeagueAdd: (LeagueDetailsDto) -> Unit,
    onLeagueRemove: (Int) -> Unit
) {
    if (!isVisible) return
    
    var searchQuery by remember { mutableStateOf("") }
    
    // 검색 필터링
    val filteredLeagues = remember(allLeagues, searchQuery) {
        if (searchQuery.isBlank()) {
            allLeagues
        } else {
            allLeagues.filter { league ->
                league.league?.name?.contains(searchQuery, ignoreCase = true) == true ||
                league.country?.name?.contains(searchQuery, ignoreCase = true) == true
            }
        }
    }
    
    Dialog(
        onDismissRequest = onDismiss,
        properties = DialogProperties(
            usePlatformDefaultWidth = false,
            dismissOnBackPress = true,
            dismissOnClickOutside = true
        )
    ) {
        Card(
            modifier = Modifier
                .fillMaxWidth(0.95f)
                .fillMaxHeight(0.85f),
            shape = RoundedCornerShape(16.dp),
            colors = CardDefaults.cardColors(
                containerColor = MaterialTheme.colorScheme.surface
            )
        ) {
            Column(
                modifier = Modifier.fillMaxSize()
            ) {
                // 헤더
                DialogHeader(
                    onDismiss = onDismiss,
                    userLeagueCount = userLeagueIds.size
                )
                
                // 검색 바
                SearchBar(
                    query = searchQuery,
                    onQueryChange = { searchQuery = it },
                    modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp)
                )
                
                // 리그 목록
                if (filteredLeagues.isEmpty()) {
                    EmptySearchResult(searchQuery = searchQuery)
                } else {
                    LazyColumn(
                        modifier = Modifier.fillMaxSize(),
                        contentPadding = PaddingValues(horizontal = 16.dp, vertical = 8.dp),
                        verticalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        items(filteredLeagues) { league ->
                            SelectableLeagueCard(
                                league = league,
                                isSelected = userLeagueIds.contains(league.league.id),
                                isDefault = isDefaultLeague(league.league.id),
                                onToggle = { isSelected ->
                                    if (isSelected) {
                                        onLeagueAdd(league)
                                    } else {
                                        onLeagueRemove(league.league.id)
                                    }
                                }
                            )
                        }
                    }
                }
            }
        }
    }
}

/**
 * 다이얼로그 헤더
 */
@Composable
private fun DialogHeader(
    onDismiss: () -> Unit,
    userLeagueCount: Int
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(16.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Column {
            Text(
                text = "리그 추가",
                style = MaterialTheme.typography.headlineSmall,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.onSurface
            )
            Text(
                text = "추가된 리그: ${userLeagueCount}개",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
        
        IconButton(onClick = onDismiss) {
            Icon(
                imageVector = Icons.Default.Close,
                contentDescription = "닫기",
                tint = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
    }
}

/**
 * 검색 바
 */
@Composable
private fun SearchBar(
    query: String,
    onQueryChange: (String) -> Unit,
    modifier: Modifier = Modifier
) {
    OutlinedTextField(
        value = query,
        onValueChange = onQueryChange,
        placeholder = {
            Text(
                text = "리그 또는 국가 검색...",
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        },
        leadingIcon = {
            Icon(
                imageVector = Icons.Default.Search,
                contentDescription = "검색",
                tint = MaterialTheme.colorScheme.onSurfaceVariant
            )
        },
        modifier = modifier.fillMaxWidth(),
        shape = RoundedCornerShape(12.dp),
        colors = OutlinedTextFieldDefaults.colors(
            focusedBorderColor = MaterialTheme.colorScheme.primary,
            unfocusedBorderColor = MaterialTheme.colorScheme.outline
        )
    )
}

/**
 * 선택 가능한 리그 카드
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun SelectableLeagueCard(
    league: LeagueDetailsDto,
    isSelected: Boolean,
    isDefault: Boolean,
    onToggle: (Boolean) -> Unit
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp),
        colors = CardDefaults.cardColors(
            containerColor = if (isSelected) {
                MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.3f)
            } else {
                Color.White
            }
        ),
        shape = RoundedCornerShape(8.dp),
        onClick = {
            if (!isDefault) {
                onToggle(!isSelected)
            }
        }
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(12.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            // 리그 로고
            Box(
                modifier = Modifier
                    .size(40.dp)
                    .clip(RoundedCornerShape(8.dp))
                    .background(Color(0xFFF5F5F5)),
                contentAlignment = Alignment.Center
            ) {
                val correctLogoUrl = LeagueLogoMapper.getLeagueTabLogoUrl(league.league.id)
                AsyncImage(
                    model = correctLogoUrl,
                    contentDescription = league.league.name,
                    modifier = Modifier
                        .size(32.dp)
                        .align(Alignment.Center)
                )
            }
            
            Spacer(modifier = Modifier.width(12.dp))
            
            // 리그 정보
            Column(
                modifier = Modifier.weight(1f)
            ) {
                Text(
                    text = LeagueNameLocalizer.getLocalizedName(league.league.id, league.league.name),
                    style = MaterialTheme.typography.bodyLarge,
                    fontWeight = FontWeight.Medium,
                    color = Color.Black,
                    fontSize = 16.sp
                )
                
                league.country?.let { country ->
                    Text(
                        text = country.name,
                        style = MaterialTheme.typography.bodySmall,
                        color = Color.Gray,
                        fontSize = 13.sp
                    )
                }
                
                // 기본 리그 표시
                if (isDefault) {
                    Text(
                        text = "기본 리그",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.primary,
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Medium
                    )
                }
            }
            
            // 선택 상태 아이콘
            if (isDefault) {
                Icon(
                    imageVector = Icons.Default.Check,
                    contentDescription = "기본 리그",
                    tint = MaterialTheme.colorScheme.primary,
                    modifier = Modifier.size(24.dp)
                )
            } else if (isSelected) {
                Icon(
                    imageVector = Icons.Default.Check,
                    contentDescription = "선택됨",
                    tint = MaterialTheme.colorScheme.primary,
                    modifier = Modifier.size(24.dp)
                )
            } else {
                Icon(
                    imageVector = Icons.Default.Add,
                    contentDescription = "추가",
                    tint = MaterialTheme.colorScheme.onSurfaceVariant,
                    modifier = Modifier.size(24.dp)
                )
            }
        }
    }
}

/**
 * 검색 결과가 없을 때 표시
 */
@Composable
private fun EmptySearchResult(searchQuery: String) {
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
                text = if (searchQuery.isBlank()) {
                    "표시할 리그가 없습니다"
                } else {
                    "'$searchQuery'에 대한 검색 결과가 없습니다"
                },
                style = MaterialTheme.typography.bodyLarge,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                textAlign = TextAlign.Center
            )
            if (searchQuery.isNotBlank()) {
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    text = "다른 검색어를 시도해보세요",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }
    }
}

/**
 * 기본 주요 리그인지 확인
 */
private fun isDefaultLeague(leagueId: Int): Boolean {
    val defaultLeagueIds = setOf(
        39,  // Premier League
        140, // La Liga
        78,  // Bundesliga
        135, // Serie A
        61,  // Ligue 1
        2,   // Champions League
        3,   // Europa League
        1    // World Cup
    )
    return leagueId in defaultLeagueIds
}

/**
 * 리그별 색상 반환
 */
private fun getLeagueColor(leagueName: String): Color {
    return when {
        leagueName.contains("Premier League", ignoreCase = true) -> Color(0xFF6A1B9A)
        leagueName.contains("La Liga", ignoreCase = true) -> Color(0xFFD32F2F)
        leagueName.contains("Serie A", ignoreCase = true) -> Color(0xFF1976D2)
        leagueName.contains("Bundesliga", ignoreCase = true) -> Color(0xFFD32F2F)
        leagueName.contains("Ligue 1", ignoreCase = true) -> Color(0xFF424242)
        leagueName.contains("Champions League", ignoreCase = true) -> Color(0xFF1976D2)
        leagueName.contains("Europa League", ignoreCase = true) -> Color(0xFFFF9800)
        else -> Color(0xFF1976D2)
    }
}

/**
 * 리그명에서 이니셜 추출
 */
private fun getLeagueInitials(leagueName: String): String {
    return when {
        leagueName.contains("Premier League", ignoreCase = true) -> "PL"
        leagueName.contains("La Liga", ignoreCase = true) -> "LL"
        leagueName.contains("Serie A", ignoreCase = true) -> "SA"
        leagueName.contains("Bundesliga", ignoreCase = true) -> "BL"
        leagueName.contains("Ligue 1", ignoreCase = true) -> "L1"
        leagueName.contains("Champions League", ignoreCase = true) -> "CL"
        leagueName.contains("Europa League", ignoreCase = true) -> "EL"
        else -> leagueName.split(" ").take(2).joinToString("") { it.take(1).uppercase() }
    }
}