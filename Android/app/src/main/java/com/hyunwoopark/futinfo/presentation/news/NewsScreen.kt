package com.hyunwoopark.futinfo.presentation.news

import android.content.Intent
import android.net.Uri
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilterChip
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.FilterChipDefaults
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.LazyListState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.derivedStateOf
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.input.nestedscroll.nestedScroll
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.hyunwoopark.futinfo.domain.model.NewsArticle
import com.hyunwoopark.futinfo.domain.model.NewsCategory
import java.time.format.DateTimeFormatter
import java.util.Locale

/**
 * 뉴스 탭 카테고리
 */
enum class NewsTabCategory(
    val id: String,
    val displayName: String,
    val icon: String
) {
    ALL("all", "전체", "newspaper"),
    TRANSFER("transfer", "이적센터", "swap_horiz"),
    INJURY("injury", "부상", "medical_services"),
    MATCH("match", "경기", "emoji_events"),
    OTHER("other", "기타", "more_horiz")
}

/**
 * 뉴스 화면 (iOS NewsView와 동일한 UI/UX 구현)
 * 실시간 축구 뉴스 및 이적센터를 포함한 탭 뷰 구성
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun NewsScreen(
    viewModel: NewsViewModel = hiltViewModel()
) {
    val state by viewModel.state.collectAsState()
    val snackbarHostState = remember { SnackbarHostState() }
    val context = LocalContext.current
    
    // 리스트 상태 기억
    val listState = rememberLazyListState()
    
    // 스크롤 위치에 따른 추가 로드
    val shouldLoadMore by remember {
        derivedStateOf {
            val layoutInfo = listState.layoutInfo
            val totalItems = layoutInfo.totalItemsCount
            val lastVisibleItem = layoutInfo.visibleItemsInfo.lastOrNull()?.index ?: 0
            lastVisibleItem >= totalItems - 3 && !state.isLoadingMore && state.hasMore
        }
    }
    
    LaunchedEffect(shouldLoadMore) {
        if (shouldLoadMore) {
            viewModel.onEvent(NewsEvent.LoadMoreNews)
        }
    }
    
    // URL 열기 처리
    LaunchedEffect(state.selectedNewsArticle) {
        state.selectedNewsArticle?.let { article ->
            if (article.url.isNotEmpty()) {
                val intent = Intent(Intent.ACTION_VIEW, Uri.parse(article.url))
                context.startActivity(intent)
                viewModel.onEvent(NewsEvent.ClearSelectedArticle)
            }
        }
    }
    
    // 선택된 탭 상태
    var selectedTab by remember { mutableStateOf(NewsTabCategory.ALL) }
    
    Scaffold(
        snackbarHost = { SnackbarHost(snackbarHostState) },
        topBar = {
            TopAppBar(
                title = {
                    Text(
                        text = "뉴스",
                        style = MaterialTheme.typography.titleLarge,
                        fontWeight = FontWeight.Bold
                    )
                }
            )
        }
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
        ) {
            // iOS 스타일 카테고리 탭 바
            NewsCategoryTabBar(
                selectedTab = selectedTab,
                onTabSelected = { selectedTab = it }
            )
            
            // 선택된 탭에 따른 콘텐츠
            when (selectedTab) {
                NewsTabCategory.TRANSFER -> {
                    // 이적센터 뷰 (TransfersScreen 컨텐츠 재사용)
                    TransferCenterContent()
                }
                else -> {
                    // 기존 뉴스 콘텐츠
                    NewsContent(
                        state = state,
                        viewModel = viewModel,
                        listState = listState,
                        selectedTab = selectedTab
                    )
                }
            }
        }
    }
    
    // 필터 바텀시트
    if (state.showFilterBottomSheet) {
        ModalBottomSheet(
            onDismissRequest = {
                viewModel.onEvent(NewsEvent.HideFilterBottomSheet)
            }
        ) {
            NewsFilterBottomSheet(
                searchQuery = state.searchQuery,
                selectedCategory = state.selectedCategoryString,
                startDate = state.startDate,
                endDate = state.endDate,
                onSearchQueryChange = { /* 실시간 업데이트는 하지 않음 */ },
                onCategorySelect = { /* 실시간 업데이트는 하지 않음 */ },
                onDateRangeSelect = { _, _ -> /* 실시간 업데이트는 하지 않음 */ },
                onApplyFilters = {
                    // 현재 바텀시트의 상태를 적용
                    viewModel.onEvent(NewsEvent.HideFilterBottomSheet)
                },
                onClearFilters = {
                    viewModel.onEvent(NewsEvent.ClearAllFilters)
                    viewModel.onEvent(NewsEvent.HideFilterBottomSheet)
                }
            )
        }
    }
}

/**
 * 뉴스 필터 바텀시트
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun NewsFilterBottomSheet(
    searchQuery: String,
    selectedCategory: String?,
    startDate: String?,
    endDate: String?,
    onSearchQueryChange: (String) -> Unit,
    onCategorySelect: (String?) -> Unit,
    onDateRangeSelect: (String?, String?) -> Unit,
    onApplyFilters: () -> Unit,
    onClearFilters: () -> Unit
) {
    var localSearchQuery by remember { mutableStateOf(searchQuery) }
    var localSelectedCategory by remember { mutableStateOf(selectedCategory) }
    var localStartDate by remember { mutableStateOf(startDate) }
    var localEndDate by remember { mutableStateOf(endDate) }
    
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(24.dp)
    ) {
        Text(
            text = "뉴스 필터",
            style = MaterialTheme.typography.headlineSmall,
            fontWeight = FontWeight.Bold
        )
        
        Spacer(modifier = Modifier.height(24.dp))
        
        // 검색어 입력
        OutlinedTextField(
            value = localSearchQuery,
            onValueChange = { localSearchQuery = it },
            label = { Text("검색어") },
            placeholder = { Text("키워드를 입력하세요") },
            modifier = Modifier.fillMaxWidth(),
            leadingIcon = {
                Icon(Icons.Default.Search, contentDescription = null)
            }
        )
        
        Spacer(modifier = Modifier.height(16.dp))
        
        // 카테고리 선택
        Text(
            text = "카테고리",
            style = MaterialTheme.typography.titleMedium,
            fontWeight = FontWeight.Medium
        )
        
        Spacer(modifier = Modifier.height(8.dp))
        
        LazyRow(
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            item {
                FilterChip(
                    selected = localSelectedCategory == null,
                    onClick = { localSelectedCategory = null },
                    label = { Text("전체") }
                )
            }
            items(NewsCategory.values()) { category ->
                FilterChip(
                    selected = localSelectedCategory == category.displayName,
                    onClick = { localSelectedCategory = category.displayName },
                    label = { Text(category.displayName) }
                )
            }
        }
        
        Spacer(modifier = Modifier.height(32.dp))
        
        // 버튼들
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Button(
                onClick = onClearFilters,
                modifier = Modifier.weight(1f),
                colors = ButtonDefaults.buttonColors(
                    containerColor = MaterialTheme.colorScheme.surfaceVariant
                )
            ) {
                Text("초기화")
            }
            
            Button(
                onClick = {
                    // 로컬 상태를 ViewModel로 전달
                    onSearchQueryChange(localSearchQuery)
                    onCategorySelect(localSelectedCategory)
                    onDateRangeSelect(localStartDate, localEndDate)
                    onApplyFilters()
                },
                modifier = Modifier.weight(1f)
            ) {
                Text("적용")
            }
        }
        
        Spacer(modifier = Modifier.height(24.dp))
    }
}


/**
 * 뉴스 상단 바
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun NewsTopBar(
    searchQuery: String,
    onSearchQueryChange: (String) -> Unit,
    onRefresh: () -> Unit,
    onShowFilters: () -> Unit
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 8.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        // 검색 필드
        OutlinedTextField(
            value = searchQuery,
            onValueChange = onSearchQueryChange,
            placeholder = { Text("뉴스 검색...") },
            modifier = Modifier.weight(1f),
            leadingIcon = {
                Icon(Icons.Default.Search, contentDescription = null)
            },
            singleLine = true,
            shape = RoundedCornerShape(12.dp)
        )
        
        Spacer(modifier = Modifier.width(8.dp))
        
        // 필터 버튼
        IconButton(
            onClick = onShowFilters,
            modifier = Modifier
                .size(48.dp)
                .clip(CircleShape)
                .background(MaterialTheme.colorScheme.surfaceVariant)
        ) {
            Icon(
                Icons.Default.FilterList,
                contentDescription = "필터",
                tint = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
        
        // 새로고침 버튼
        IconButton(
            onClick = onRefresh,
            modifier = Modifier
                .size(48.dp)
                .clip(CircleShape)
                .background(MaterialTheme.colorScheme.surfaceVariant)
        ) {
            Icon(
                Icons.Default.Refresh,
                contentDescription = "새로고침",
                tint = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
    }
}

/**
 * 뉴스 리스트 아이템
 */
@Composable
fun NewsListItem(
    article: NewsArticle,
    onArticleClick: () -> Unit,
    onBookmarkClick: () -> Unit,
    onShareClick: () -> Unit
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable { onArticleClick() },
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surface
        ),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
    ) {
        Column(
            modifier = Modifier.padding(16.dp)
        ) {
            // 카테고리와 시간
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                article.category.let { category ->
                    Text(
                        text = category.displayName,
                        style = MaterialTheme.typography.labelMedium,
                        color = MaterialTheme.colorScheme.primary,
                        modifier = Modifier
                            .background(
                                MaterialTheme.colorScheme.primaryContainer,
                                RoundedCornerShape(4.dp)
                            )
                            .padding(horizontal = 8.dp, vertical = 4.dp)
                    )
                }
                
                Text(
                    text = article.publishedAt.format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm")),
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
            
            Spacer(modifier = Modifier.height(8.dp))
            
            // 제목
            Text(
                text = article.title,
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold,
                maxLines = 2,
                overflow = TextOverflow.Ellipsis
            )
            
            // 설명
            // 설명
            article.summary.let { summary ->
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = summary,
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    maxLines = 2,
                    overflow = TextOverflow.Ellipsis
                )
            }
            
            Spacer(modifier = Modifier.height(12.dp))
            
            // 하단 액션
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                // 출처
                Text(
                    text = article.source,
                    style = MaterialTheme.typography.labelMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                
                // 액션 버튼들
                Row {
                    IconButton(onClick = onBookmarkClick) {
                        Icon(
                            imageVector = Icons.Default.BookmarkBorder,
                            contentDescription = "북마크",
                            tint = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                    
                    IconButton(onClick = onShareClick) {
                        Icon(
                            imageVector = Icons.Default.Share,
                            contentDescription = "공유",
                            tint = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
            }
        }
    }
}

/**
 * 로딩 콘텐츠
 */
@Composable
fun LoadingContent() {
    Box(
        modifier = Modifier.fillMaxSize(),
        contentAlignment = Alignment.Center
    ) {
        CircularProgressIndicator()
    }
}

/**
 * 에러 콘텐츠
 */
@Composable
fun ErrorContent(
    error: String,
    onRetry: () -> Unit
) {
    Box(
        modifier = Modifier.fillMaxSize(),
        contentAlignment = Alignment.Center
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            Icon(
                imageVector = Icons.Default.Error,
                contentDescription = null,
                modifier = Modifier.size(64.dp),
                tint = MaterialTheme.colorScheme.error
            )
            Spacer(modifier = Modifier.height(16.dp))
            Text(
                text = error,
                style = MaterialTheme.typography.bodyLarge,
                color = MaterialTheme.colorScheme.onSurface
            )
            Spacer(modifier = Modifier.height(16.dp))
            Button(onClick = onRetry) {
                Text("다시 시도")
            }
        }
    }
}

/**
 * 빈 콘텐츠
 */
@Composable
fun EmptyContent() {
    Box(
        modifier = Modifier.fillMaxSize(),
        contentAlignment = Alignment.Center
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            Icon(
                imageVector = Icons.Default.Article,
                contentDescription = null,
                modifier = Modifier.size(64.dp),
                tint = MaterialTheme.colorScheme.onSurfaceVariant
            )
            Spacer(modifier = Modifier.height(16.dp))
            Text(
                text = "뉴스가 없습니다",
                style = MaterialTheme.typography.bodyLarge,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
    }
}

/**
 * iOS 스타일 카테고리 탭 바
 */
@Composable
fun NewsCategoryTabBar(
    selectedTab: NewsTabCategory,
    onTabSelected: (NewsTabCategory) -> Unit
) {
    LazyRow(
        modifier = Modifier
            .fillMaxWidth()
            .background(MaterialTheme.colorScheme.background)
            .padding(horizontal = 16.dp, vertical = 8.dp),
        horizontalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        items(NewsTabCategory.values().toList()) { category ->
            NewsCategoryTab(
                category = category,
                isSelected = selectedTab == category,
                onClick = { onTabSelected(category) }
            )
        }
    }
}

/**
 * 개별 카테고리 탭 칩
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun NewsCategoryTab(
    category: NewsTabCategory,
    isSelected: Boolean,
    onClick: () -> Unit
) {
    FilterChip(
        selected = isSelected,
        onClick = onClick,
        label = {
            Row(
                horizontalArrangement = Arrangement.spacedBy(6.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Icon(
                    imageVector = when (category.icon) {
                        "newspaper" -> Icons.Default.Article
                        "swap_horiz" -> Icons.Default.SwapHoriz
                        "medical_services" -> Icons.Default.LocalHospital
                        "emoji_events" -> Icons.Default.EmojiEvents
                        "more_horiz" -> Icons.Default.MoreHoriz
                        else -> Icons.Default.Article
                    },
                    contentDescription = null,
                    modifier = Modifier.size(16.dp)
                )
                Text(
                    text = category.displayName,
                    style = MaterialTheme.typography.labelLarge
                )
            }
        },
        colors = FilterChipDefaults.filterChipColors(
            selectedContainerColor = MaterialTheme.colorScheme.primary,
            selectedLabelColor = MaterialTheme.colorScheme.onPrimary,
            selectedLeadingIconColor = MaterialTheme.colorScheme.onPrimary
        )
    )
}

/**
 * 뉴스 콘텐츠 (기존 뉴스 화면)
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun NewsContent(
    state: NewsState,
    viewModel: NewsViewModel,
    listState: LazyListState,
    selectedTab: NewsTabCategory
) {
    Column(
        modifier = Modifier.fillMaxSize()
    ) {
        // 검색 바
        NewsTopBar(
            searchQuery = state.searchQuery,
            onSearchQueryChange = { query ->
                viewModel.onEvent(NewsEvent.SearchNews(query))
            },
            onRefresh = {
                viewModel.onEvent(NewsEvent.RefreshNews)
            },
            onShowFilters = {
                viewModel.onEvent(NewsEvent.ShowFilterBottomSheet)
            }
        )
        
        // 선택된 카테고리 표시
        if (selectedTab != NewsTabCategory.ALL) {
            LazyRow(
                modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                item {
                    FilterChip(
                        selected = true,
                        onClick = { },
                        label = {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Text(text = selectedTab.displayName)
                                Spacer(modifier = Modifier.width(4.dp))
                                Icon(
                                    imageVector = Icons.Default.Close,
                                    contentDescription = "필터 제거",
                                    modifier = Modifier.size(16.dp)
                                )
                            }
                        },
                        colors = FilterChipDefaults.filterChipColors(
                            selectedContainerColor = MaterialTheme.colorScheme.primaryContainer,
                            selectedLabelColor = MaterialTheme.colorScheme.onPrimaryContainer
                        )
                    )
                }
            }
        }
        
        // 뉴스 목록
        when {
            state.isLoading && state.newsArticles.isEmpty() -> {
                LoadingContent()
            }
            state.error != null && state.newsArticles.isEmpty() -> {
                ErrorContent(
                    error = state.error,
                    onRetry = {
                        viewModel.onEvent(NewsEvent.LoadNews)
                    }
                )
            }
            state.filteredNewsArticles.isEmpty() -> {
                EmptyContent()
            }
            else -> {
                LazyColumn(
                    state = listState,
                    modifier = Modifier.fillMaxSize(),
                    contentPadding = PaddingValues(16.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    items(state.filteredNewsArticles) { article ->
                        NewsItemCard(
                            article = article,
                            onArticleClick = {
                                viewModel.onEvent(NewsEvent.OpenNewsUrl(article.url))
                            },
                            onBookmarkClick = {
                                viewModel.onEvent(NewsEvent.BookmarkNews(article))
                            },
                            onShareClick = {
                                viewModel.onEvent(NewsEvent.ShareNews(article))
                            }
                        )
                    }
                    
                    if (state.isLoadingMore) {
                        item {
                            Box(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(16.dp),
                                contentAlignment = Alignment.Center
                            ) {
                                CircularProgressIndicator()
                            }
                        }
                    }
                }
            }
        }
    }
}

/**
 * 이적센터 콘텐츠
 */
@Composable
fun TransferCenterContent() {
    Box(
        modifier = Modifier.fillMaxSize(),
        contentAlignment = Alignment.Center
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            Icon(
                imageVector = Icons.Default.SwapHoriz,
                contentDescription = null,
                modifier = Modifier.size(64.dp),
                tint = MaterialTheme.colorScheme.primary
            )
            Spacer(modifier = Modifier.height(16.dp))
            Text(
                text = "이적센터",
                style = MaterialTheme.typography.headlineMedium,
                fontWeight = FontWeight.Bold
            )
            Spacer(modifier = Modifier.height(8.dp))
            Text(
                text = "최신 이적 뉴스와 루머를 확인하세요",
                style = MaterialTheme.typography.bodyLarge,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
    }
}

/**
 * 뉴스 아이템 카드
 */
@Composable
fun NewsItemCard(
    article: NewsArticle,
    onArticleClick: () -> Unit,
    onBookmarkClick: () -> Unit,
    onShareClick: () -> Unit
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable { onArticleClick() },
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surface
        ),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Column(
            modifier = Modifier.padding(16.dp)
        ) {
            // 제목
            Text(
                text = article.title,
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold,
                maxLines = 2,
                overflow = TextOverflow.Ellipsis
            )
            
            Spacer(modifier = Modifier.height(8.dp))
            
            // 설명
            // 설명
            article.summary.let { summary ->
                Text(
                    text = summary,
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    maxLines = 3,
                    overflow = TextOverflow.Ellipsis
                )
                Spacer(modifier = Modifier.height(12.dp))
            }
            
            // 하단 정보
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                // 출처와 시간
                Row(
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = article.source,
                        style = MaterialTheme.typography.labelMedium,
                        color = MaterialTheme.colorScheme.primary
                    )
                    Text(
                        text = " • ",
                        style = MaterialTheme.typography.labelMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    Text(
                        text = article.publishedAt.format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm")),
                        style = MaterialTheme.typography.labelMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
                
                // 액션 버튼들
                Row {
                    IconButton(onClick = onBookmarkClick) {
                        Icon(
                            imageVector = Icons.Default.BookmarkBorder,
                            contentDescription = "북마크",
                            tint = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                    IconButton(onClick = onShareClick) {
                        Icon(
                            imageVector = Icons.Default.Share,
                            contentDescription = "공유",
                            tint = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
            }
        }
    }
}