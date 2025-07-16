package com.futinfo.design

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

// Design System for Android (Jetpack Compose)

object DesignSystem {
    
    // Colors
    object Colors {
        val primary = Color(0xFF1E88E5)
        val primaryLight = Color(0xFF64B5F6)
        val primaryDark = Color(0xFF1565C0)
        
        object Trust {
            val official = Color(0xFF4CAF50)
            val tier1 = Color(0xFF2196F3)
            val verified = Color(0xFF9C27B0)
            val reliable = Color(0xFF00BCD4)
            val questionable = Color(0xFFFF9800)
            val unreliable = Color(0xFFF44336)
        }
        
        object Categories {
            val general = Color(0xFF757575)
            val transfer = Color(0xFFFF9800)
            val match = Color(0xFF2196F3)
            val injury = Color(0xFF9C27B0)
        }
        
        object Background {
            val primary = Color(0xFFFAFAFA)
            val secondary = Color(0xFFF5F5F5)
            val card = Color.White
            val dark = Color(0xFF121212)
        }
        
        object Text {
            val primary = Color(0xFF212121)
            val secondary = Color(0xFF757575)
            val disabled = Color(0xFFBDBDBD)
            val inverse = Color.White
        }
        
        val divider = Color(0x1F000000)
        val shadow = Color(0x1A000000)
    }
    
    // Typography
    object Typography {
        val headline = androidx.compose.ui.text.TextStyle(
            fontSize = 18.sp,
            fontWeight = FontWeight.SemiBold
        )
        
        val subheadline = androidx.compose.ui.text.TextStyle(
            fontSize = 16.sp,
            fontWeight = FontWeight.Medium
        )
        
        val body = androidx.compose.ui.text.TextStyle(
            fontSize = 16.sp,
            fontWeight = FontWeight.Normal
        )
        
        val caption = androidx.compose.ui.text.TextStyle(
            fontSize = 14.sp,
            fontWeight = FontWeight.Normal
        )
        
        val small = androidx.compose.ui.text.TextStyle(
            fontSize = 12.sp,
            fontWeight = FontWeight.Normal
        )
    }
    
    // Spacing
    object Spacing {
        val xs = 4.dp
        val sm = 8.dp
        val md = 16.dp
        val lg = 24.dp
        val xl = 32.dp
        val xxl = 48.dp
    }
    
    // Border Radius
    object BorderRadius {
        val sm = 4.dp
        val md = 8.dp
        val lg = 12.dp
        val xl = 16.dp
        val full = 50.dp
    }
}

// Common Components

@Composable
fun DSCard(
    modifier: Modifier = Modifier,
    content: @Composable ColumnScope.() -> Unit
) {
    Card(
        modifier = modifier,
        shape = RoundedCornerShape(DesignSystem.BorderRadius.lg),
        colors = CardDefaults.cardColors(
            containerColor = DesignSystem.Colors.Background.card
        ),
        elevation = CardDefaults.cardElevation(
            defaultElevation = 2.dp
        )
    ) {
        Column(
            modifier = Modifier.padding(DesignSystem.Spacing.md),
            content = content
        )
    }
}

@Composable
fun DSButton(
    text: String,
    onClick: () -> Unit,
    style: ButtonStyle = ButtonStyle.Primary,
    modifier: Modifier = Modifier
) {
    val colors = when (style) {
        ButtonStyle.Primary -> ButtonDefaults.buttonColors(
            containerColor = DesignSystem.Colors.primary,
            contentColor = DesignSystem.Colors.Text.inverse
        )
        ButtonStyle.Secondary -> ButtonDefaults.buttonColors(
            containerColor = DesignSystem.Colors.Background.secondary,
            contentColor = DesignSystem.Colors.Text.primary
        )
        ButtonStyle.Text -> ButtonDefaults.textButtonColors(
            contentColor = DesignSystem.Colors.primary
        )
    }
    
    when (style) {
        ButtonStyle.Text -> {
            TextButton(
                onClick = onClick,
                modifier = modifier,
                colors = colors
            ) {
                Text(text, style = DesignSystem.Typography.subheadline)
            }
        }
        else -> {
            Button(
                onClick = onClick,
                modifier = modifier,
                shape = RoundedCornerShape(DesignSystem.BorderRadius.full),
                colors = colors,
                contentPadding = PaddingValues(
                    horizontal = DesignSystem.Spacing.lg,
                    vertical = DesignSystem.Spacing.sm
                )
            ) {
                Text(text, style = DesignSystem.Typography.subheadline)
            }
        }
    }
}

@Composable
fun DSBadge(
    text: String,
    color: Color,
    modifier: Modifier = Modifier
) {
    Surface(
        modifier = modifier,
        shape = RoundedCornerShape(DesignSystem.BorderRadius.sm),
        color = color.copy(alpha = 0.1f)
    ) {
        Text(
            text = text,
            modifier = Modifier.padding(
                horizontal = DesignSystem.Spacing.sm,
                vertical = DesignSystem.Spacing.xs
            ),
            style = DesignSystem.Typography.small,
            color = color,
            fontWeight = FontWeight.Medium
        )
    }
}

// News Specific Components

@Composable
fun NewsTrustIndicator(
    tier: String,
    trustScore: Int,
    modifier: Modifier = Modifier
) {
    val (color, label) = when (tier) {
        "official" -> DesignSystem.Colors.Trust.official to "[OFFICIAL]"
        "tier1" -> DesignSystem.Colors.Trust.tier1 to "[Tier 1]"
        "verified" -> DesignSystem.Colors.Trust.verified to "[Verified]"
        "reliable" -> DesignSystem.Colors.Trust.reliable to "[Reliable]"
        "questionable" -> DesignSystem.Colors.Trust.questionable to "[Rumour]"
        else -> DesignSystem.Colors.Trust.unreliable to "[Unverified]"
    }
    
    Row(
        modifier = modifier,
        horizontalArrangement = Arrangement.spacedBy(DesignSystem.Spacing.xs)
    ) {
        Box(
            modifier = Modifier
                .size(6.dp)
                .background(color, shape = androidx.compose.foundation.shape.CircleShape)
        )
        
        Text(
            text = label,
            style = DesignSystem.Typography.caption,
            color = color
        )
    }
}

@Composable
fun NewsCard(
    article: NewsArticle,
    onDuplicatesClick: (() -> Unit)? = null,
    modifier: Modifier = Modifier
) {
    DSCard(modifier = modifier.fillMaxWidth()) {
        // Header
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Row(horizontalArrangement = Arrangement.spacedBy(DesignSystem.Spacing.sm)) {
                Icon(
                    imageVector = getCategoryIcon(article.category),
                    contentDescription = null,
                    tint = getCategoryColor(article.category),
                    modifier = Modifier.size(16.dp)
                )
                
                Text(
                    text = article.sourceName,
                    style = DesignSystem.Typography.caption,
                    color = DesignSystem.Colors.Text.secondary
                )
                
                NewsTrustIndicator(
                    tier = article.sourceTier,
                    trustScore = article.trustScore
                )
            }
            
            if (article.duplicateCount > 0) {
                DSBadge(
                    text = "+${article.duplicateCount}",
                    color = DesignSystem.Colors.primary,
                    modifier = Modifier.clickable { onDuplicatesClick?.invoke() }
                )
            }
        }
        
        Spacer(modifier = Modifier.height(DesignSystem.Spacing.sm))
        
        // Title
        Text(
            text = article.title,
            style = DesignSystem.Typography.headline,
            color = DesignSystem.Colors.Text.primary,
            maxLines = 2
        )
        
        if (article.summary.isNotEmpty()) {
            Spacer(modifier = Modifier.height(DesignSystem.Spacing.xs))
            
            Text(
                text = article.summary,
                style = DesignSystem.Typography.body,
                color = DesignSystem.Colors.Text.secondary,
                maxLines = 2
            )
        }
        
        Spacer(modifier = Modifier.height(DesignSystem.Spacing.sm))
        
        Text(
            text = article.timeAgo,
            style = DesignSystem.Typography.small,
            color = DesignSystem.Colors.Text.disabled
        )
    }
}

// Utility Functions

fun getCategoryColor(category: String): Color {
    return when (category) {
        "transfer" -> DesignSystem.Colors.Categories.transfer
        "match" -> DesignSystem.Colors.Categories.match
        "injury" -> DesignSystem.Colors.Categories.injury
        else -> DesignSystem.Colors.Categories.general
    }
}

fun getCategoryIcon(category: String): ImageVector {
    return when (category) {
        "transfer" -> Icons.Default.SwapHoriz
        "match" -> Icons.Default.SportsSoccer
        "injury" -> Icons.Default.LocalHospital
        else -> Icons.Default.Article
    }
}

// Enums

enum class ButtonStyle {
    Primary,
    Secondary,
    Text
}

// Data Classes

data class NewsArticle(
    val id: String,
    val title: String,
    val summary: String,
    val sourceName: String,
    val sourceTier: String,
    val trustScore: Int,
    val url: String,
    val publishedAt: String,
    val category: String,
    val duplicateCount: Int = 0,
    val duplicateSources: List<String> = emptyList(),
    val timeAgo: String
)