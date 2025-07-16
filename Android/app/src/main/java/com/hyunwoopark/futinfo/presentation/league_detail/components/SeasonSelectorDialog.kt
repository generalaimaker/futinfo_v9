package com.hyunwoopark.futinfo.presentation.league_detail.components

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
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
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.window.Dialog
import com.hyunwoopark.futinfo.presentation.theme.FutInfoDesignSystem

/**
 * iOS 스타일 시즌 선택 다이얼로그
 */
@Composable
fun SeasonSelectorDialog(
    availableSeasons: List<Int>,
    currentSeason: Int,
    onSeasonSelected: (Int) -> Unit,
    onDismiss: () -> Unit
) {
    Dialog(onDismissRequest = onDismiss) {
        Surface(
            modifier = Modifier
                .fillMaxWidth(0.9f)
                .clip(RoundedCornerShape(16.dp)),
            color = FutInfoDesignSystem.Colors.SystemBackground,
            shadowElevation = 8.dp
        ) {
            Column(
                modifier = Modifier.padding(FutInfoDesignSystem.Spacing.Large)
            ) {
                // 헤더
                Text(
                    text = "시즌 선택",
                    style = FutInfoDesignSystem.Typography.Title3,
                    fontWeight = FontWeight.Bold,
                    textAlign = TextAlign.Center,
                    modifier = Modifier.fillMaxWidth()
                )
                
                Spacer(modifier = Modifier.height(FutInfoDesignSystem.Spacing.Medium))
                
                // 시즌 목록
                LazyColumn(
                    modifier = Modifier
                        .fillMaxWidth()
                        .heightIn(max = 400.dp),
                    verticalArrangement = Arrangement.spacedBy(FutInfoDesignSystem.Spacing.Small)
                ) {
                    items(availableSeasons.sortedDescending()) { season ->
                        SeasonItem(
                            season = season,
                            isSelected = season == currentSeason,
                            onClick = {
                                onSeasonSelected(season)
                                onDismiss()
                            }
                        )
                    }
                }
                
                Spacer(modifier = Modifier.height(FutInfoDesignSystem.Spacing.Medium))
                
                // 취소 버튼
                TextButton(
                    onClick = onDismiss,
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(48.dp),
                    colors = ButtonDefaults.textButtonColors(
                        contentColor = FutInfoDesignSystem.Colors.RoyalBlue
                    )
                ) {
                    Text(
                        text = "취소",
                        style = FutInfoDesignSystem.Typography.Callout,
                        fontWeight = FontWeight.Medium
                    )
                }
            }
        }
    }
}

@Composable
private fun SeasonItem(
    season: Int,
    isSelected: Boolean,
    onClick: () -> Unit
) {
    val seasonText = "$season/${(season + 1).toString().takeLast(2)}"
    
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(12.dp))
            .background(
                if (isSelected) FutInfoDesignSystem.Colors.RoyalBlue.copy(alpha = 0.1f)
                else Color.Transparent
            )
            .clickable { onClick() }
            .padding(
                horizontal = FutInfoDesignSystem.Spacing.Medium,
                vertical = FutInfoDesignSystem.Spacing.Medium
            ),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Column {
            Text(
                text = seasonText,
                style = FutInfoDesignSystem.Typography.Callout,
                fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Medium,
                color = if (isSelected) FutInfoDesignSystem.Colors.RoyalBlue else FutInfoDesignSystem.Colors.Label
            )
            
            // 시즌 상태 표시
            val currentYear = java.util.Calendar.getInstance().get(java.util.Calendar.YEAR)
            val currentMonth = java.util.Calendar.getInstance().get(java.util.Calendar.MONTH)
            val currentSeason = if (currentMonth >= java.util.Calendar.JULY) currentYear else currentYear - 1
            
            when {
                season == currentSeason + 1 -> {
                    Text(
                        text = "예정",
                        style = FutInfoDesignSystem.Typography.Caption2,
                        color = FutInfoDesignSystem.Colors.Orange
                    )
                }
                season == currentSeason -> {
                    Text(
                        text = "현재",
                        style = FutInfoDesignSystem.Typography.Caption2,
                        color = FutInfoDesignSystem.Colors.Green
                    )
                }
                season == 2024 && currentSeason != 2024 -> {
                    Text(
                        text = "최근 종료",
                        style = FutInfoDesignSystem.Typography.Caption2,
                        color = FutInfoDesignSystem.Colors.Gray
                    )
                }
            }
        }
        
        if (isSelected) {
            Surface(
                modifier = Modifier.size(24.dp),
                shape = RoundedCornerShape(12.dp),
                color = FutInfoDesignSystem.Colors.RoyalBlue
            ) {
                Box(
                    contentAlignment = Alignment.Center,
                    modifier = Modifier.fillMaxSize()
                ) {
                    Text(
                        text = "✓",
                        style = FutInfoDesignSystem.Typography.Caption1,
                        color = Color.White,
                        fontWeight = FontWeight.Bold
                    )
                }
            }
        }
    }
}