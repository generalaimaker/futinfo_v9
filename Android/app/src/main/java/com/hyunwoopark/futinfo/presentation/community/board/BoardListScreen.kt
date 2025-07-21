package com.hyunwoopark.futinfo.presentation.community.board

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Groups
import androidx.compose.material.icons.filled.Sports
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.NavController
import coil.compose.AsyncImage
import com.hyunwoopark.futinfo.domain.model.Board
import com.hyunwoopark.futinfo.domain.model.BoardType
import com.hyunwoopark.futinfo.domain.model.UserProfile
import com.hyunwoopark.futinfo.R
// import com.hyunwoopark.futinfo.presentation.common.LoadingOverlay // TODO: Implement LoadingOverlay
// import com.hyunwoopark.futinfo.presentation.theme.Colors // TODO: Implement Colors

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun BoardListScreen(
    navController: NavController,
    viewModel: BoardListViewModel = hiltViewModel()
) {
    val state by viewModel.state.collectAsState()
    
    Scaffold(
        topBar = {
            TopAppBar(
                title = { 
                    Text(
                        text = "락커룸",
                        style = MaterialTheme.typography.titleLarge.copy(
                            fontWeight = FontWeight.Bold
                        )
                    )
                },
                navigationIcon = {
                    IconButton(onClick = { navController.navigateUp() }) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "뒤로 가기")
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.surface
                )
            )
        }
    ) { paddingValues ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
        ) {
            Column(
                modifier = Modifier.fillMaxSize()
            ) {
                // 사용자 프로필 카드
                state.userProfile?.let { profile ->
                    UserProfileCard(
                        profile = profile,
                        onProfileClick = {
                            // TODO: 프로필 설정 화면으로 이동
                        }
                    )
                }
                
                // 보드 목록
                if (state.boards.isNotEmpty()) {
                    LazyColumn(
                        modifier = Modifier.fillMaxSize(),
                        contentPadding = PaddingValues(16.dp),
                        verticalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        // 전체 보드
                        val allBoard = state.boards.find { it.type == BoardType.ALL }
                        allBoard?.let { board ->
                            item {
                                BoardSection(
                                    title = "전체 게시판",
                                    boards = listOf(board),
                                    onBoardClick = { boardId ->
                                        navController.navigate("community/board/$boardId")
                                    }
                                )
                                Spacer(modifier = Modifier.height(16.dp))
                            }
                        }
                        
                        // 리그별로 팀 보드 그룹핑
                        val teamBoardsByLeague = state.boards
                            .filter { it.type == BoardType.TEAM }
                            .groupBy { it.leagueId }
                        
                        teamBoardsByLeague.forEach { (leagueId, boards) ->
                            item {
                                val leagueName = getLeagueName(leagueId)
                                BoardSection(
                                    title = leagueName,
                                    boards = boards.sortedBy { it.name },
                                    onBoardClick = { boardId ->
                                        navController.navigate("community/board/$boardId")
                                    }
                                )
                                Spacer(modifier = Modifier.height(16.dp))
                            }
                        }
                    }
                } else if (!state.isLoading) {
                    // 빈 상태
                    Box(
                        modifier = Modifier.fillMaxSize(),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = "게시판이 없습니다",
                            style = MaterialTheme.typography.bodyLarge,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
            }
            
            // 로딩 오버레이
            if (state.isLoading) {
                Box(
                modifier = Modifier.fillMaxSize(),
                contentAlignment = Alignment.Center
            ) {
                CircularProgressIndicator()
            }
            }
        }
    }
}

@Composable
private fun UserProfileCard(
    profile: UserProfile,
    onProfileClick: () -> Unit
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(16.dp)
            .clickable { onProfileClick() },
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.primaryContainer
        )
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            // 프로필 이미지 또는 기본 아이콘
            Box(
                modifier = Modifier
                    .size(56.dp)
                    .clip(RoundedCornerShape(28.dp))
                    .background(MaterialTheme.colorScheme.primary),
                contentAlignment = Alignment.Center
            ) {
                if (profile.avatarUrl != null) {
                    AsyncImage(
                        model = profile.avatarUrl,
                        contentDescription = "프로필 이미지",
                        modifier = Modifier.fillMaxSize(),
                        contentScale = ContentScale.Crop
                    )
                } else {
                    Text(
                        text = profile.nickname.firstOrNull()?.toString() ?: "?",
                        style = MaterialTheme.typography.titleLarge,
                        color = MaterialTheme.colorScheme.onPrimary
                    )
                }
            }
            
            Spacer(modifier = Modifier.width(16.dp))
            
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = profile.nickname,
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold
                )
                if (profile.favoriteTeamName != null) {
                    Text(
                        text = profile.favoriteTeamName,
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onPrimaryContainer
                    )
                }
            }
            
            Column(horizontalAlignment = Alignment.End) {
                Text(
                    text = "게시글 ${profile.postCount}",
                    style = MaterialTheme.typography.bodySmall
                )
                Text(
                    text = "댓글 ${profile.commentCount}",
                    style = MaterialTheme.typography.bodySmall
                )
            }
        }
    }
}

@Composable
private fun BoardSection(
    title: String,
    boards: List<Board>,
    onBoardClick: (String) -> Unit
) {
    Column {
        Text(
            text = title,
            style = MaterialTheme.typography.titleMedium,
            fontWeight = FontWeight.Bold,
            modifier = Modifier.padding(bottom = 8.dp)
        )
        
        boards.forEach { board ->
            BoardItem(
                board = board,
                onClick = { onBoardClick(board.id) }
            )
        }
    }
}

@Composable
private fun BoardItem(
    board: Board,
    onClick: () -> Unit
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 4.dp)
            .clickable { onClick() },
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surface
        ),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            // 보드 아이콘
            Box(
                modifier = Modifier
                    .size(40.dp)
                    .clip(RoundedCornerShape(8.dp))
                    .background(
                        if (board.type == BoardType.ALL) 
                            MaterialTheme.colorScheme.primary.copy(alpha = 0.1f)
                        else 
                            MaterialTheme.colorScheme.secondary.copy(alpha = 0.1f)
                    ),
                contentAlignment = Alignment.Center
            ) {
                when {
                    board.iconUrl != null -> {
                        AsyncImage(
                            model = board.iconUrl,
                            contentDescription = "${board.name} 로고",
                            modifier = Modifier.size(28.dp)
                        )
                    }
                    board.type == BoardType.ALL -> {
                        Icon(
                            imageVector = Icons.Default.Groups,
                            contentDescription = "전체 게시판",
                            tint = MaterialTheme.colorScheme.primary,
                            modifier = Modifier.size(24.dp)
                        )
                    }
                    else -> {
                        Icon(
                            imageVector = Icons.Default.Sports,
                            contentDescription = "팀 게시판",
                            tint = MaterialTheme.colorScheme.secondary,
                            modifier = Modifier.size(24.dp)
                        )
                    }
                }
            }
            
            Spacer(modifier = Modifier.width(12.dp))
            
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = board.name,
                    style = MaterialTheme.typography.bodyLarge,
                    fontWeight = FontWeight.Medium
                )
                board.description?.let { desc ->
                    Text(
                        text = desc,
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        maxLines = 1
                    )
                }
            }
            
            Column(horizontalAlignment = Alignment.End) {
                Text(
                    text = "${board.postCount}",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                Text(
                    text = "게시글",
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }
    }
}

private fun getLeagueName(leagueId: Int?): String {
    return when (leagueId) {
        39 -> "프리미어리그"
        140 -> "라리가"
        135 -> "세리에 A"
        78 -> "분데스리가"
        61 -> "리그 1"
        94 -> "에레디비지에"
        88 -> "챔피언스리그"
        2 -> "UEFA 챔피언스리그"
        3 -> "UEFA 유로파리그"
        848 -> "UEFA 유로파 컨퍼런스리그"
        292 -> "K리그 1"
        293 -> "K리그 2"
        else -> "기타 리그"
    }
}