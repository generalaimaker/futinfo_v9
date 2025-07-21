package com.hyunwoopark.futinfo.presentation.community.board

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.NavController
import coil.compose.AsyncImage
import com.hyunwoopark.futinfo.domain.model.Board
import com.hyunwoopark.futinfo.R
import com.hyunwoopark.futinfo.domain.model.Post
import com.hyunwoopark.futinfo.domain.model.PostCategory
import com.hyunwoopark.futinfo.domain.model.TeamInfo
// import com.hyunwoopark.futinfo.presentation.common.LoadingOverlay // TODO: Implement LoadingOverlay
// import com.hyunwoopark.futinfo.presentation.theme.Colors // TODO: Implement Colors
import java.time.format.DateTimeFormatter

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun TeamBoardScreen(
    boardId: String,
    navController: NavController,
    viewModel: TeamBoardViewModel = hiltViewModel()
) {
    val state by viewModel.state.collectAsState()
    
    LaunchedEffect(boardId) {
        viewModel.loadBoard(boardId)
    }
    
    Scaffold(
        topBar = {
            TopAppBar(
                title = { 
                    Text(
                        text = state.board?.name ?: "팀 게시판",
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
        },
        floatingActionButton = {
            if (state.board != null) {
                FloatingActionButton(
                    onClick = { 
                        navController.navigate("community/board/$boardId/write")
                    },
                    containerColor = MaterialTheme.colorScheme.primary
                ) {
                    Icon(Icons.Default.Edit, contentDescription = "글쓰기")
                }
            }
        }
    ) { paddingValues ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
        ) {
            state.board?.let { board ->
                LazyColumn(
                    modifier = Modifier.fillMaxSize()
                ) {
                    // 팀 정보 헤더
                    item {
                        TeamInfoHeader(
                            board = board,
                            teamInfo = state.teamInfo
                        )
                    }
                    
                    // 카테고리 필터
                    item {
                        CategoryFilter(
                            selectedCategory = state.selectedCategory,
                            onCategorySelected = viewModel::selectCategory
                        )
                    }
                    
                    // 게시글 목록
                    if (state.posts.isNotEmpty()) {
                        items(state.posts) { post ->
                            PostItem(
                                post = post,
                                onClick = {
                                    navController.navigate("community/post/${post.id}")
                                }
                            )
                        }
                        
                        // 더 보기 버튼
                        if (state.hasMore) {
                            item {
                                Box(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .padding(16.dp),
                                    contentAlignment = Alignment.Center
                                ) {
                                    TextButton(
                                        onClick = { viewModel.loadMorePosts() },
                                        enabled = !state.isLoadingMore
                                    ) {
                                        if (state.isLoadingMore) {
                                            CircularProgressIndicator(
                                                modifier = Modifier.size(16.dp),
                                                strokeWidth = 2.dp
                                            )
                                        } else {
                                            Text("더 보기")
                                        }
                                    }
                                }
                            }
                        }
                    } else if (!state.isLoading) {
                        item {
                            Box(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(32.dp),
                                contentAlignment = Alignment.Center
                            ) {
                                Column(
                                    horizontalAlignment = Alignment.CenterHorizontally
                                ) {
                                    Icon(
                                        imageVector = Icons.Default.Article,
                                        contentDescription = null,
                                        modifier = Modifier.size(48.dp),
                                        tint = MaterialTheme.colorScheme.onSurfaceVariant
                                    )
                                    Spacer(modifier = Modifier.height(8.dp))
                                    Text(
                                        text = "아직 게시글이 없습니다",
                                        style = MaterialTheme.typography.bodyLarge,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant
                                    )
                                }
                            }
                        }
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
private fun TeamInfoHeader(
    board: Board,
    teamInfo: TeamInfo?
) {
    Column {
        // 팀 배경 그라데이션
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(180.dp)
                .background(
                    brush = Brush.verticalGradient(
                        colors = listOf(
                            teamInfo?.primaryColor?.let { Color(android.graphics.Color.parseColor(it)) }
                                ?: MaterialTheme.colorScheme.primary,
                            teamInfo?.secondaryColor?.let { Color(android.graphics.Color.parseColor(it)) }
                                ?: MaterialTheme.colorScheme.primaryContainer
                        )
                    )
                )
        ) {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(16.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                // 팀 로고
                if (board.iconUrl != null) {
                    AsyncImage(
                        model = board.iconUrl,
                        contentDescription = "${board.name} 로고",
                        modifier = Modifier.size(64.dp),
                        contentScale = ContentScale.Fit
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                }
                
                // 팀 슬로건
                teamInfo?.slogan?.let { slogan ->
                    Text(
                        text = slogan,
                        style = MaterialTheme.typography.titleMedium,
                        color = Color.White,
                        fontWeight = FontWeight.Bold,
                        textAlign = TextAlign.Center
                    )
                }
            }
        }
        
        // 팀 통계
        teamInfo?.let { info ->
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(16.dp),
                horizontalArrangement = Arrangement.SpaceEvenly
            ) {
                TeamStatItem(
                    label = "순위",
                    value = info.standing?.toString() ?: "-"
                )
                TeamStatItem(
                    label = "승점",
                    value = info.points?.toString() ?: "-"
                )
                TeamStatItem(
                    label = "최근 경기",
                    value = info.form ?: "-----"
                )
            }
        }
        
        Divider()
    }
}

@Composable
private fun TeamStatItem(
    label: String,
    value: String
) {
    Column(
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Text(
            text = value,
            style = MaterialTheme.typography.titleLarge,
            fontWeight = FontWeight.Bold
        )
        Text(
            text = label,
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun CategoryFilter(
    selectedCategory: String?,
    onCategorySelected: (String?) -> Unit
) {
    val categories = listOf(
        null to "전체",
        PostCategory.MATCH.value to PostCategory.MATCH.displayName,
        PostCategory.TRANSFER.value to PostCategory.TRANSFER.displayName,
        PostCategory.NEWS.value to PostCategory.NEWS.displayName,
        PostCategory.TALK.value to PostCategory.TALK.displayName,
        PostCategory.MEDIA.value to PostCategory.MEDIA.displayName
    )
    
    LazyRow(
        modifier = Modifier.fillMaxWidth(),
        contentPadding = PaddingValues(horizontal = 16.dp, vertical = 8.dp),
        horizontalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        items(categories) { (value, label) ->
            FilterChip(
                selected = selectedCategory == value,
                onClick = { onCategorySelected(value) },
                label = { Text(label) }
            )
        }
    }
}

@Composable
private fun PostItem(
    post: Post,
    onClick: () -> Unit
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 4.dp)
            .clickable { onClick() },
        colors = CardDefaults.cardColors(
            containerColor = if (post.isPinned) 
                MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.3f)
            else 
                MaterialTheme.colorScheme.surface
        )
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp)
        ) {
            // 카테고리 및 고정 표시
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically
            ) {
                if (post.isPinned) {
                    Icon(
                        imageVector = Icons.Default.PushPin,
                        contentDescription = "고정됨",
                        modifier = Modifier.size(16.dp),
                        tint = MaterialTheme.colorScheme.primary
                    )
                    Spacer(modifier = Modifier.width(4.dp))
                }
                
                AssistChip(
                    onClick = { },
                    label = { 
                        Text(
                            text = PostCategory.values()
                                .find { it.value == post.category.value }
                                ?.displayName ?: post.category.displayName,
                            style = MaterialTheme.typography.labelSmall
                        )
                    },
                    modifier = Modifier.height(24.dp),
                    colors = AssistChipDefaults.assistChipColors(
                        containerColor = getCategoryColor(post.category).copy(alpha = 0.2f)
                    )
                )
                
                Spacer(modifier = Modifier.weight(1f))
                
                Text(
                    text = post.timeAgo,
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
            
            Spacer(modifier = Modifier.height(8.dp))
            
            // 제목
            Text(
                text = post.title,
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Medium,
                maxLines = 2,
                overflow = TextOverflow.Ellipsis
            )
            
            // 내용 미리보기
            if (post.content.isNotBlank()) {
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = post.content,
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    maxLines = 2,
                    overflow = TextOverflow.Ellipsis
                )
            }
            
            Spacer(modifier = Modifier.height(8.dp))
            
            // 작성자 및 통계
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically
            ) {
                // 작성자 정보
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    modifier = Modifier.weight(1f)
                ) {
                    Box(
                        modifier = Modifier
                            .size(20.dp)
                            .clip(CircleShape)
                            .background(MaterialTheme.colorScheme.primaryContainer),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = post.author?.nickname?.firstOrNull()?.toString() ?: "?",
                            style = MaterialTheme.typography.labelSmall,
                            fontWeight = FontWeight.Bold
                        )
                    }
                    Spacer(modifier = Modifier.width(6.dp))
                    Text(
                        text = post.author?.nickname ?: "익명",
                        style = MaterialTheme.typography.bodySmall
                    )
                }
                
                // 통계
                Row(
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(
                            imageVector = Icons.Default.Visibility,
                            contentDescription = "조회수",
                            modifier = Modifier.size(14.dp),
                            tint = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                        Spacer(modifier = Modifier.width(2.dp))
                        Text(
                            text = post.viewCount.toString(),
                            style = MaterialTheme.typography.labelSmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                    
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(
                            imageVector = if (post.isLiked) Icons.Default.Favorite else Icons.Default.FavoriteBorder,
                            contentDescription = "좋아요",
                            modifier = Modifier.size(14.dp),
                            tint = if (post.isLiked) Color.Red else MaterialTheme.colorScheme.onSurfaceVariant
                        )
                        Spacer(modifier = Modifier.width(2.dp))
                        Text(
                            text = post.likeCount.toString(),
                            style = MaterialTheme.typography.labelSmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                    
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(
                            imageVector = Icons.Default.Comment,
                            contentDescription = "댓글",
                            modifier = Modifier.size(14.dp),
                            tint = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                        Spacer(modifier = Modifier.width(2.dp))
                        Text(
                            text = post.commentCount.toString(),
                            style = MaterialTheme.typography.labelSmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
            }
        }
    }
}

private fun getCategoryColor(category: PostCategory): Color {
    return when (category) {
        PostCategory.MATCH -> Color(0xFF2196F3)
        PostCategory.TRANSFER -> Color(0xFFFF9800)
        PostCategory.NEWS -> Color(0xFF4CAF50)
        PostCategory.TALK -> Color(0xFF9C27B0)
        PostCategory.MEDIA -> Color(0xFFE91E63)
        else -> Color(0xFF607D8B)
    }
}

