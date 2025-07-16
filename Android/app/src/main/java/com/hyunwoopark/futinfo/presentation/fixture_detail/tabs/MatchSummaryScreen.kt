package com.hyunwoopark.futinfo.presentation.fixture_detail.tabs

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.hyunwoopark.futinfo.data.remote.dto.FixtureEventDto
import com.hyunwoopark.futinfo.domain.model.FixtureDetailBundle
import com.hyunwoopark.futinfo.presentation.components.*
import com.hyunwoopark.futinfo.presentation.theme.FutInfoDesignSystem

/**
 * iOS MatchSummaryView.swift를 기반으로 완전히 개선된 경기 요약 화면
 *
 * 주요 개선사항:
 * - iOS 스타일 디자인 시스템 적용
 * - 골, 카드 등 주요 이벤트 타임라인
 * - iOS 스타일 이벤트 카드 및 아이콘
 * - 향상된 타이포그래피 및 색상 팔레트
 * - iOS 스타일 스켈레톤 로딩 및 빈 상태
 */
@Composable
fun MatchSummaryScreen(
    data: FixtureDetailBundle,
    isLoading: Boolean = false,
    modifier: Modifier = Modifier
) {
    if (isLoading) {
        IOSStyleMatchSummaryLoadingState(modifier = modifier)
    } else if (data.events.isNotEmpty()) {
        IOSStyleMatchSummaryContent(
            events = data.events,
            modifier = modifier
        )
    } else {
        IOSStyleMatchSummaryEmptyState(modifier = modifier)
    }
}

/**
 * iOS 스타일 경기 요약 컨텐츠
 */
@Composable
private fun IOSStyleMatchSummaryContent(
    events: List<FixtureEventDto>,
    modifier: Modifier = Modifier
) {
    LazyColumn(
        modifier = modifier
            .fillMaxSize()
            .background(FutInfoDesignSystem.Colors.SystemBackground)
            .padding(horizontal = FutInfoDesignSystem.Spacing.Medium),
        verticalArrangement = Arrangement.spacedBy(FutInfoDesignSystem.Spacing.Small)
    ) {
        item {
            Text(
                text = "경기 이벤트",
                style = FutInfoDesignSystem.Typography.Title2,
                fontWeight = FontWeight.Bold,
                color = FutInfoDesignSystem.Colors.Label,
                modifier = Modifier.padding(vertical = FutInfoDesignSystem.Spacing.Medium)
            )
        }
        
        // 시간순으로 정렬된 이벤트들
        items(events.sortedBy { it.time.elapsed }) { event ->
            IOSStyleEventTimelineItem(event = event)
        }
        
        item {
            Spacer(modifier = Modifier.height(FutInfoDesignSystem.Spacing.Large))
        }
    }
}

/**
 * iOS 스타일 이벤트 타임라인 아이템
 */
@Composable
private fun IOSStyleEventTimelineItem(
    event: FixtureEventDto
) {
    IOSStyleCard {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(FutInfoDesignSystem.Spacing.Medium),
            verticalAlignment = Alignment.CenterVertically
        ) {
            // iOS 스타일 시간 표시
            IOSStyleTimeIndicator(
                time = event.time.elapsed,
                extraTime = event.time.extra
            )
            
            Spacer(modifier = Modifier.width(FutInfoDesignSystem.Spacing.Medium))
            
            // iOS 스타일 이벤트 아이콘
            IOSStyleEventIcon(
                eventType = event.type,
                eventDetail = event.detail
            )
            
            Spacer(modifier = Modifier.width(FutInfoDesignSystem.Spacing.Medium))
            
            // iOS 스타일 이벤트 정보
            IOSStyleEventDetails(
                event = event,
                modifier = Modifier.weight(1f)
            )
        }
    }
}

/**
 * iOS 스타일 시간 인디케이터
 */
@Composable
private fun IOSStyleTimeIndicator(
    time: Int,
    extraTime: Int?
) {
    Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        modifier = Modifier.width(48.dp)
    ) {
        Text(
            text = "${time}'",
            style = FutInfoDesignSystem.Typography.Title3,
            fontWeight = FontWeight.Bold,
            color = FutInfoDesignSystem.Colors.RoyalBlue
        )
        
        if (extraTime != null && extraTime > 0) {
            Text(
                text = "+${extraTime}'",
                style = FutInfoDesignSystem.Typography.Caption2,
                color = FutInfoDesignSystem.Colors.SecondaryLabel
            )
        }
    }
}

/**
 * iOS 스타일 이벤트 아이콘
 */
@Composable
private fun IOSStyleEventIcon(
    eventType: String,
    eventDetail: String
) {
    val (icon, color) = getIOSStyleEventIconAndColor(eventType, eventDetail)
    
    Box(
        modifier = Modifier
            .size(44.dp)
            .clip(CircleShape)
            .background(color.copy(alpha = 0.15f)),
        contentAlignment = Alignment.Center
    ) {
        Icon(
            imageVector = icon,
            contentDescription = eventType,
            tint = color,
            modifier = Modifier.size(24.dp)
        )
    }
}

/**
 * iOS 스타일 이벤트 상세 정보
 */
@Composable
private fun IOSStyleEventDetails(
    event: FixtureEventDto,
    modifier: Modifier = Modifier
) {
    Column(
        modifier = modifier,
        verticalArrangement = Arrangement.spacedBy(FutInfoDesignSystem.Spacing.XSmall)
    ) {
        // 이벤트 타입 및 상세
        Text(
            text = "${event.type} - ${event.detail}",
            style = FutInfoDesignSystem.Typography.Headline,
            fontWeight = FontWeight.SemiBold,
            color = FutInfoDesignSystem.Colors.Label
        )
        
        // 선수 이름
        if (!event.player.name.isNullOrBlank()) {
            Text(
                text = event.player.name,
                style = FutInfoDesignSystem.Typography.Body,
                color = FutInfoDesignSystem.Colors.SecondaryLabel
            )
        }
        
        // 어시스트 선수 (골인 경우)
        if (!event.assist?.name.isNullOrBlank() && event.type == "Goal") {
            Text(
                text = "어시스트: ${event.assist?.name}",
                style = FutInfoDesignSystem.Typography.Caption1,
                color = FutInfoDesignSystem.Colors.TertiaryLabel
            )
        }
        
        // 팀 정보
        Text(
            text = event.team.name,
            style = FutInfoDesignSystem.Typography.Caption1,
            color = FutInfoDesignSystem.Colors.RoyalBlue,
            fontWeight = FontWeight.Medium
        )
    }
}

/**
 * iOS 스타일 로딩 상태
 */
@Composable
private fun IOSStyleMatchSummaryLoadingState(
    modifier: Modifier = Modifier
) {
    LazyColumn(
        modifier = modifier
            .fillMaxSize()
            .background(FutInfoDesignSystem.Colors.SystemBackground)
            .padding(horizontal = FutInfoDesignSystem.Spacing.Medium),
        verticalArrangement = Arrangement.spacedBy(FutInfoDesignSystem.Spacing.Small)
    ) {
        item {
            // 제목 스켈레톤
            IOSStyleSkeletonBox(
                width = 120.dp,
                height = 24.dp,
                modifier = Modifier.padding(vertical = FutInfoDesignSystem.Spacing.Medium)
            )
        }
        
        items(8) {
            IOSStyleEventTimelineItemSkeleton()
        }
        
        item {
            Spacer(modifier = Modifier.height(FutInfoDesignSystem.Spacing.Large))
        }
    }
}

/**
 * iOS 스타일 이벤트 타임라인 스켈레톤
 */
@Composable
private fun IOSStyleEventTimelineItemSkeleton() {
    IOSStyleCard {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(FutInfoDesignSystem.Spacing.Medium),
            verticalAlignment = Alignment.CenterVertically
        ) {
            // 시간 스켈레톤
            IOSStyleSkeletonBox(
                width = 48.dp,
                height = 20.dp
            )
            
            Spacer(modifier = Modifier.width(FutInfoDesignSystem.Spacing.Medium))
            
            // 아이콘 스켈레톤
            IOSStyleSkeletonBox(
                width = 44.dp,
                height = 44.dp,
                shape = CircleShape
            )
            
            Spacer(modifier = Modifier.width(FutInfoDesignSystem.Spacing.Medium))
            
            // 이벤트 정보 스켈레톤
            Column(
                modifier = Modifier.weight(1f),
                verticalArrangement = Arrangement.spacedBy(FutInfoDesignSystem.Spacing.XSmall)
            ) {
                IOSStyleSkeletonBox(
                    modifier = Modifier.fillMaxWidth(0.7f),
                    height = 16.dp
                )
                IOSStyleSkeletonBox(
                    modifier = Modifier.fillMaxWidth(0.5f),
                    height = 14.dp
                )
                IOSStyleSkeletonBox(
                    modifier = Modifier.fillMaxWidth(0.3f),
                    height = 12.dp
                )
            }
        }
    }
}

/**
 * iOS 스타일 빈 상태
 */
@Composable
private fun IOSStyleMatchSummaryEmptyState(
    modifier: Modifier = Modifier
) {
    IOSStyleEmptyView(
        icon = Icons.Default.SportsSoccer,
        title = "경기 이벤트가 없습니다",
        description = "경기가 시작되면 골, 카드 등의 이벤트가 여기에 표시됩니다",
        modifier = modifier
    )
}

// iOS 스타일 유틸리티 함수들
private fun getIOSStyleEventIconAndColor(eventType: String, eventDetail: String): Pair<ImageVector, Color> {
    return when (eventType.lowercase()) {
        "goal" -> when (eventDetail.lowercase()) {
            "penalty" -> Icons.Default.SportsSoccer to FutInfoDesignSystem.Colors.SystemGreen
            "own goal" -> Icons.Default.SportsSoccer to FutInfoDesignSystem.Colors.SystemOrange
            else -> Icons.Default.SportsSoccer to FutInfoDesignSystem.Colors.SystemGreen
        }
        "card" -> when (eventDetail.lowercase()) {
            "yellow card" -> Icons.Default.Rectangle to FutInfoDesignSystem.Colors.SystemYellow
            "red card" -> Icons.Default.Rectangle to FutInfoDesignSystem.Colors.SystemRed
            else -> Icons.Default.Rectangle to FutInfoDesignSystem.Colors.SystemYellow
        }
        "subst" -> Icons.Default.SwapHoriz to FutInfoDesignSystem.Colors.RoyalBlue
        "var" -> Icons.Default.Videocam to FutInfoDesignSystem.Colors.SystemPurple
        else -> Icons.Default.Info to FutInfoDesignSystem.Colors.SystemGray
    }
}