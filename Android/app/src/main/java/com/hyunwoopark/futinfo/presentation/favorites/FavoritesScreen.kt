package com.hyunwoopark.futinfo.presentation.favorites

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.Favorite
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Sports
import androidx.compose.material.icons.filled.SportsFootball
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.wrapContentSize
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import coil.compose.AsyncImage
import coil.request.ImageRequest
import com.hyunwoopark.futinfo.R
import com.hyunwoopark.futinfo.data.local.entity.FavoriteEntity
import com.hyunwoopark.futinfo.presentation.theme.DesignSystem

/**
 * 즐겨찾기 화면
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun FavoritesScreen(
    onNavigateToLeague: (Int) -> Unit,
    onNavigateToTeam: (Int) -> Unit,
    onNavigateToPlayer: (Int) -> Unit,
    viewModel: FavoritesViewModel = hiltViewModel()
) {
    val state by viewModel.state.collectAsStateWithLifecycle()
    
    // 오류 스낵바 표시
    state.error?.let { error ->
        LaunchedEffect(error) {
            // 스낵바 표시 로직
        }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(DesignSystem.colors.background)
    ) {
        // 상단 바
        TopAppBar(
            title = {
                Text(
                    text = stringResource(R.string.favorites),
                    style = DesignSystem.typography.headlineMedium,
                    color = DesignSystem.colors.onBackground
                )
            },
            colors = TopAppBarDefaults.topAppBarColors(
                containerColor = DesignSystem.colors.surface
            )
        )

        // 탭 바
        FavoriteTabBar(
            selectedTab = state.selectedTab,
            onTabSelected = viewModel::selectTab
        )

        // 콘텐츠
        when {
            state.isLoading -> {
                Box(
                    modifier = Modifier.fillMaxSize(),
                    contentAlignment = Alignment.Center
                ) {
                    CircularProgressIndicator(
                        color = DesignSystem.colors.primary
                    )
                }
            }
            
            else -> {
                val favorites = when (state.selectedTab) {
                    FavoriteTab.ALL -> state.favorites
                    FavoriteTab.LEAGUES -> state.favoriteLeagues
                    FavoriteTab.TEAMS -> state.favoriteTeams
                    FavoriteTab.PLAYERS -> state.favoritePlayers
                }

                if (favorites.isEmpty()) {
                    EmptyFavoritesContent(selectedTab = state.selectedTab)
                } else {
                    FavoritesList(
                        favorites = favorites,
                        onItemClick = { favorite ->
                            when (favorite.type) {
                                "league" -> onNavigateToLeague(favorite.itemId)
                                "team" -> onNavigateToTeam(favorite.itemId)
                                "player" -> onNavigateToPlayer(favorite.itemId)
                            }
                        },
                        onRemoveFavorite = { favorite ->
                            viewModel.removeFavorite(favorite.itemId, favorite.type)
                        }
                    )
                }
            }
        }
    }
}

/**
 * 즐겨찾기 탭 바
 */
@Composable
private fun FavoriteTabBar(
    selectedTab: FavoriteTab,
    onTabSelected: (FavoriteTab) -> Unit
) {
    ScrollableTabRow(
        selectedTabIndex = selectedTab.ordinal,
        containerColor = DesignSystem.colors.surface,
        contentColor = DesignSystem.colors.primary,
        indicator = { tabPositions ->
            TabRowDefaults.Indicator(
                modifier = Modifier.wrapContentSize(Alignment.BottomStart)
                    .offset(x = tabPositions[selectedTab.ordinal].left)
                    .width(tabPositions[selectedTab.ordinal].width),
                color = DesignSystem.colors.primary
            )
        }
    ) {
        FavoriteTab.values().forEach { tab ->
            Tab(
                selected = selectedTab == tab,
                onClick = { onTabSelected(tab) },
                text = {
                    Text(
                        text = when (tab) {
                            FavoriteTab.ALL -> stringResource(R.string.all)
                            FavoriteTab.LEAGUES -> stringResource(R.string.leagues)
                            FavoriteTab.TEAMS -> stringResource(R.string.teams)
                            FavoriteTab.PLAYERS -> stringResource(R.string.players)
                        },
                        style = DesignSystem.typography.labelMedium
                    )
                }
            )
        }
    }
}

/**
 * 즐겨찾기 목록
 */
@Composable
private fun FavoritesList(
    favorites: List<FavoriteEntity>,
    onItemClick: (FavoriteEntity) -> Unit,
    onRemoveFavorite: (FavoriteEntity) -> Unit
) {
    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        items(favorites) { favorite ->
            FavoriteItem(
                favorite = favorite,
                onClick = { onItemClick(favorite) },
                onRemove = { onRemoveFavorite(favorite) }
            )
        }
    }
}

/**
 * 즐겨찾기 항목
 */
@Composable
private fun FavoriteItem(
    favorite: FavoriteEntity,
    onClick: () -> Unit,
    onRemove: () -> Unit
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable { onClick() },
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(
            containerColor = DesignSystem.colors.surface
        ),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            // 아이콘 또는 이미지
            if (!favorite.imageUrl.isNullOrEmpty()) {
                AsyncImage(
                    model = ImageRequest.Builder(LocalContext.current)
                        .data(favorite.imageUrl)
                        .crossfade(true)
                        .build(),
                    contentDescription = favorite.name,
                    modifier = Modifier
                        .size(48.dp)
                        .clip(CircleShape),
                    contentScale = ContentScale.Crop
                )
            } else {
                Icon(
                    imageVector = getTypeIcon(favorite.type),
                    contentDescription = null,
                    modifier = Modifier
                        .size(48.dp)
                        .background(
                            color = DesignSystem.colors.primary.copy(alpha = 0.1f),
                            shape = CircleShape
                        )
                        .padding(12.dp),
                    tint = DesignSystem.colors.primary
                )
            }

            Spacer(modifier = Modifier.width(16.dp))

            // 정보
            Column(
                modifier = Modifier.weight(1f)
            ) {
                Text(
                    text = favorite.name,
                    style = DesignSystem.typography.titleMedium,
                    color = DesignSystem.colors.onSurface,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
                
                Text(
                    text = getTypeDisplayName(favorite.type),
                    style = DesignSystem.typography.bodySmall,
                    color = DesignSystem.colors.onSurfaceVariant
                )
            }

            // 삭제 버튼
            IconButton(
                onClick = onRemove
            ) {
                Icon(
                    imageVector = Icons.Default.Delete,
                    contentDescription = stringResource(R.string.remove_from_favorites),
                    tint = DesignSystem.colors.error
                )
            }
        }
    }
}

/**
 * 빈 즐겨찾기 콘텐츠
 */
@Composable
private fun EmptyFavoritesContent(
    selectedTab: FavoriteTab
) {
    Box(
        modifier = Modifier.fillMaxSize(),
        contentAlignment = Alignment.Center
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            Icon(
                imageVector = Icons.Default.Favorite,
                contentDescription = null,
                modifier = Modifier.size(64.dp),
                tint = DesignSystem.colors.onSurfaceVariant.copy(alpha = 0.6f)
            )
            
            Text(
                text = when (selectedTab) {
                    FavoriteTab.ALL -> stringResource(R.string.no_favorites)
                    FavoriteTab.LEAGUES -> stringResource(R.string.no_favorite_leagues)
                    FavoriteTab.TEAMS -> stringResource(R.string.no_favorite_teams)
                    FavoriteTab.PLAYERS -> stringResource(R.string.no_favorite_players)
                },
                style = DesignSystem.typography.titleMedium,
                color = DesignSystem.colors.onSurfaceVariant
            )
            
            Text(
                text = stringResource(R.string.add_favorites_hint),
                style = DesignSystem.typography.bodyMedium,
                color = DesignSystem.colors.onSurfaceVariant.copy(alpha = 0.7f)
            )
        }
    }
}

/**
 * 타입에 따른 아이콘 반환
 */
private fun getTypeIcon(type: String): ImageVector {
    return when (type) {
        "league" -> Icons.Default.Sports
        "team" -> Icons.Default.SportsFootball
        "player" -> Icons.Default.Person
        else -> Icons.Default.Favorite
    }
}

/**
 * 타입 표시명 반환
 */
@Composable
private fun getTypeDisplayName(type: String): String {
    return when (type) {
        "league" -> stringResource(R.string.league)
        "team" -> stringResource(R.string.team)
        "player" -> stringResource(R.string.player)
        else -> ""
    }
}