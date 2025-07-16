package com.hyunwoopark.futinfo.presentation.components

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Sports
import androidx.compose.material.icons.filled.SportsFootball
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import coil.compose.SubcomposeAsyncImage
import coil.request.ImageRequest
import com.hyunwoopark.futinfo.util.ImageCacheManager

/**
 * 리그 로고를 표시하는 컴포넌트
 * 
 * @param logoUrl 리그 로고 URL
 * @param contentDescription 접근성을 위한 설명
 * @param size 이미지 크기
 * @param imageCacheManager 이미지 캐시 매니저
 * @param modifier Modifier
 */
@Composable
fun LeagueLogoImage(
    logoUrl: String?,
    contentDescription: String? = null,
    size: Dp = 32.dp,
    imageCacheManager: ImageCacheManager,
    modifier: Modifier = Modifier
) {
    CachedAsyncImage(
        imageUrl = logoUrl,
        contentDescription = contentDescription,
        size = size,
        imageCacheManager = imageCacheManager,
        placeholderIcon = Icons.Default.Sports,
        shape = CircleShape,
        modifier = modifier
    )
}

/**
 * 팀 로고를 표시하는 컴포넌트
 * 
 * @param logoUrl 팀 로고 URL
 * @param contentDescription 접근성을 위한 설명
 * @param size 이미지 크기
 * @param imageCacheManager 이미지 캐시 매니저
 * @param modifier Modifier
 */
@Composable
fun TeamLogoImage(
    logoUrl: String?,
    contentDescription: String? = null,
    size: Dp = 32.dp,
    imageCacheManager: ImageCacheManager,
    modifier: Modifier = Modifier
) {
    CachedAsyncImage(
        imageUrl = logoUrl,
        contentDescription = contentDescription,
        size = size,
        imageCacheManager = imageCacheManager,
        placeholderIcon = Icons.Default.SportsFootball,
        shape = CircleShape,
        modifier = modifier
    )
}

/**
 * 플레이어 이미지를 표시하는 컴포넌트
 * 
 * @param imageUrl 플레이어 이미지 URL
 * @param contentDescription 접근성을 위한 설명
 * @param size 이미지 크기
 * @param imageCacheManager 이미지 캐시 매니저
 * @param modifier Modifier
 */
@Composable
fun PlayerImage(
    imageUrl: String?,
    contentDescription: String? = null,
    size: Dp = 48.dp,
    imageCacheManager: ImageCacheManager,
    modifier: Modifier = Modifier
) {
    CachedAsyncImage(
        imageUrl = imageUrl,
        contentDescription = contentDescription,
        size = size,
        imageCacheManager = imageCacheManager,
        placeholderIcon = Icons.Default.Sports,
        shape = CircleShape,
        modifier = modifier
    )
}

/**
 * 캐시된 비동기 이미지 컴포넌트
 * 
 * @param imageUrl 이미지 URL
 * @param contentDescription 접근성을 위한 설명
 * @param size 이미지 크기
 * @param imageCacheManager 이미지 캐시 매니저
 * @param placeholderIcon 플레이스홀더 아이콘
 * @param shape 이미지 모양
 * @param modifier Modifier
 */
@Composable
private fun CachedAsyncImage(
    imageUrl: String?,
    contentDescription: String?,
    size: Dp,
    imageCacheManager: ImageCacheManager,
    placeholderIcon: ImageVector,
    shape: androidx.compose.ui.graphics.Shape,
    modifier: Modifier = Modifier
) {
    val context = LocalContext.current
    
    Box(
        modifier = modifier
            .size(size)
            .clip(shape)
            .background(
                color = MaterialTheme.colorScheme.surfaceVariant,
                shape = shape
            ),
        contentAlignment = Alignment.Center
    ) {
        if (!imageUrl.isNullOrBlank()) {
            SubcomposeAsyncImage(
                model = ImageRequest.Builder(context)
                    .data(imageUrl)
                    .memoryCachePolicy(imageCacheManager.getLeagueLogoCachePolicy())
                    .diskCachePolicy(imageCacheManager.getLeagueLogoCachePolicy())
                    .crossfade(true)
                    .build(),
                contentDescription = contentDescription,
                imageLoader = imageCacheManager.imageLoader,
                contentScale = ContentScale.Crop,
                loading = {
                    CircularProgressIndicator(
                        modifier = Modifier.size(size / 2),
                        strokeWidth = 2.dp,
                        color = MaterialTheme.colorScheme.primary
                    )
                },
                error = {
                    Icon(
                        imageVector = placeholderIcon,
                        contentDescription = contentDescription,
                        modifier = Modifier.size(size / 2),
                        tint = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                },
                modifier = Modifier.size(size)
            )
        } else {
            Icon(
                imageVector = placeholderIcon,
                contentDescription = contentDescription,
                modifier = Modifier.size(size / 2),
                tint = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
    }
}

/**
 * 국가 국기를 표시하는 컴포넌트
 * 
 * @param flagUrl 국기 이미지 URL
 * @param contentDescription 접근성을 위한 설명
 * @param size 이미지 크기
 * @param imageCacheManager 이미지 캐시 매니저
 * @param modifier Modifier
 */
@Composable
fun CountryFlagImage(
    flagUrl: String?,
    contentDescription: String? = null,
    size: Dp = 24.dp,
    imageCacheManager: ImageCacheManager,
    modifier: Modifier = Modifier
) {
    CachedAsyncImage(
        imageUrl = flagUrl,
        contentDescription = contentDescription,
        size = size,
        imageCacheManager = imageCacheManager,
        placeholderIcon = Icons.Default.Sports,
        shape = RoundedCornerShape(4.dp),
        modifier = modifier
    )
}

/**
 * 경기장 이미지를 표시하는 컴포넌트
 * 
 * @param imageUrl 경기장 이미지 URL
 * @param contentDescription 접근성을 위한 설명
 * @param width 이미지 너비
 * @param height 이미지 높이
 * @param imageCacheManager 이미지 캐시 매니저
 * @param modifier Modifier
 */
@Composable
fun VenueImage(
    imageUrl: String?,
    contentDescription: String? = null,
    width: Dp = 120.dp,
    height: Dp = 80.dp,
    imageCacheManager: ImageCacheManager,
    modifier: Modifier = Modifier
) {
    val context = LocalContext.current
    
    Box(
        modifier = modifier
            .size(width, height)
            .clip(RoundedCornerShape(8.dp))
            .background(
                color = MaterialTheme.colorScheme.surfaceVariant,
                shape = RoundedCornerShape(8.dp)
            ),
        contentAlignment = Alignment.Center
    ) {
        if (!imageUrl.isNullOrBlank()) {
            SubcomposeAsyncImage(
                model = ImageRequest.Builder(context)
                    .data(imageUrl)
                    .memoryCachePolicy(imageCacheManager.getLeagueLogoCachePolicy())
                    .diskCachePolicy(imageCacheManager.getLeagueLogoCachePolicy())
                    .crossfade(true)
                    .build(),
                contentDescription = contentDescription,
                imageLoader = imageCacheManager.imageLoader,
                contentScale = ContentScale.Crop,
                loading = {
                    CircularProgressIndicator(
                        modifier = Modifier.size(24.dp),
                        strokeWidth = 2.dp,
                        color = MaterialTheme.colorScheme.primary
                    )
                },
                error = {
                    Icon(
                        imageVector = Icons.Default.Sports,
                        contentDescription = contentDescription,
                        modifier = Modifier.size(32.dp),
                        tint = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                },
                modifier = Modifier.size(width, height)
            )
        } else {
            Icon(
                imageVector = Icons.Default.Sports,
                contentDescription = contentDescription,
                modifier = Modifier.size(32.dp),
                tint = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
    }
}