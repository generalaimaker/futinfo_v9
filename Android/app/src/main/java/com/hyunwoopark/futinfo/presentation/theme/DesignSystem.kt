package com.hyunwoopark.futinfo.presentation.theme

import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

/**
 * iOS 스타일 디자인 시스템
 * iOS 앱의 디자인 패턴을 Android에 적용
 */
object FutInfoDesignSystem {
    
    // iOS 스타일 색상 팔레트
    object Colors {
        val RoyalBlue = Color(0xFF4169E1) // iOS 앱의 주요 색상 #4169E1
        val LightBlue = Color(0xFF42A5F5) // 보조 파란색
        val Orange = Color(0xFFFFA500) // 유로파리그 색상
        val Green = Color(0xFF4CAF50) // 컨퍼런스리그 색상
        val Red = Color(0xFFFF5722) // 강등권 색상
        val Yellow = Color(0xFFFFD700) // 맨 오브 더 매치 색상
        val Gray = Color(0xFF9E9E9E) // 보조 텍스트 색상
        val LightGray = Color(0xFFF5F5F5) // 배경 색상
        val DarkGray = Color(0xFF424242) // 진한 텍스트 색상
        
        // 시스템 색상 (iOS 스타일)
        val SystemBackground = Color(0xFFFFFFFF)
        val SystemGray6 = Color(0xFFF2F2F7)
        val SystemGray5 = Color(0xFFE5E5EA)
        val SystemGray4 = Color(0xFFD1D1D6)
        val SystemGray3 = Color(0xFFC7C7CC)
        val SystemGray2 = Color(0xFFAEAEB2)
        val SystemGray = Color(0xFF8E8E93)
        
        // 라벨 색상 (iOS 스타일)
        val Label = Color(0xFF000000)
        val SecondaryLabel = Color(0xFF3C3C43).copy(alpha = 0.6f)
        val TertiaryLabel = Color(0xFF3C3C43).copy(alpha = 0.3f)
        
        // 시스템 색상 확장
        val SystemRed = Color(0xFFFF3B30)
        val SystemOrange = Color(0xFFFF9500)
        val SystemYellow = Color(0xFFFFCC00)
        val SystemGreen = Color(0xFF34C759)
        val SystemBlue = Color(0xFF007AFF)
        val SystemPurple = Color(0xFFAF52DE)
        
        // 진출권 색상
        val ChampionsLeague = RoyalBlue
        val ChampionsLeagueQualification = LightBlue
        val EuropaLeague = Orange
        val ConferenceLeague = Green
        val Relegation = Red
        val RelegationPlayoff = Color(0xFFFF8A80) // 연한 빨간색
        
        // 메달 색상
        val Gold = Color(0xFFFFD700)
        val Silver = Color(0xFFC0C0C0)
        val Bronze = Color(0xFFCD7F32)
        
        // 추가 시스템 색상
        val SystemGroupedBackground = Color(0xFFF2F2F7)
    }
    
    // iOS 스타일 타이포그래피
    object Typography {
        val LargeTitle = TextStyle(
            fontSize = 34.sp,
            fontWeight = FontWeight.Bold,
            lineHeight = 41.sp
        )
        
        val Title1 = TextStyle(
            fontSize = 28.sp,
            fontWeight = FontWeight.Bold,
            lineHeight = 34.sp
        )
        
        val Title2 = TextStyle(
            fontSize = 22.sp,
            fontWeight = FontWeight.Bold,
            lineHeight = 28.sp
        )
        
        val Title3 = TextStyle(
            fontSize = 20.sp,
            fontWeight = FontWeight.SemiBold,
            lineHeight = 25.sp
        )
        
        val Headline = TextStyle(
            fontSize = 17.sp,
            fontWeight = FontWeight.SemiBold,
            lineHeight = 22.sp
        )
        
        val Body = TextStyle(
            fontSize = 17.sp,
            fontWeight = FontWeight.Normal,
            lineHeight = 22.sp
        )
        
        val Callout = TextStyle(
            fontSize = 16.sp,
            fontWeight = FontWeight.Normal,
            lineHeight = 21.sp
        )
        
        val Subhead = TextStyle(
            fontSize = 15.sp,
            fontWeight = FontWeight.Normal,
            lineHeight = 20.sp
        )
        
        val Footnote = TextStyle(
            fontSize = 13.sp,
            fontWeight = FontWeight.Normal,
            lineHeight = 18.sp
        )
        
        val Caption1 = TextStyle(
            fontSize = 12.sp,
            fontWeight = FontWeight.Normal,
            lineHeight = 16.sp
        )
        
        val Caption2 = TextStyle(
            fontSize = 11.sp,
            fontWeight = FontWeight.Normal,
            lineHeight = 13.sp
        )
    }
    
    // iOS 스타일 모양
    object Shapes {
        val Small = RoundedCornerShape(8.dp)
        val Medium = RoundedCornerShape(12.dp)
        val Large = RoundedCornerShape(16.dp)
        val ExtraLarge = RoundedCornerShape(20.dp)
        
        // 특별한 모양
        val TabIndicator = RoundedCornerShape(2.dp)
        val Badge = RoundedCornerShape(12.dp)
        val Button = RoundedCornerShape(8.dp)
    }
    
    // iOS 스타일 간격
    object Spacing {
        val XSmall = 2.dp
        val ExtraSmall = 4.dp
        val Small = 8.dp
        val Medium = 12.dp
        val Large = 16.dp
        val ExtraLarge = 20.dp
        val XXLarge = 24.dp
        val XXXLarge = 32.dp
        
        // 특별한 간격
        val SectionSpacing = 32.dp
        val CardPadding = 16.dp
        val TabPadding = 12.dp
    }
    
    // iOS 스타일 그림자
    object Elevation {
        val None = 0.dp
        val Small = 2.dp
        val Medium = 4.dp
        val Large = 8.dp
        val ExtraLarge = 16.dp
    }
}

/**
 * iOS 스타일 컴포저블 확장 함수들
 */
@Composable
fun iOSCardColors() = androidx.compose.material3.CardDefaults.cardColors(
    containerColor = FutInfoDesignSystem.Colors.SystemBackground
)

@Composable
fun iOSButtonColors() = androidx.compose.material3.ButtonDefaults.buttonColors(
    containerColor = FutInfoDesignSystem.Colors.RoyalBlue
)

@Composable
fun iOSTextButtonColors() = ButtonDefaults.textButtonColors(
    contentColor = FutInfoDesignSystem.Colors.RoyalBlue
)

/**
 * 진출권 색상 헬퍼 함수
 */
fun getQualificationColor(leagueId: Int, rank: Int): Color {
    return when (leagueId) {
        2, 3 -> { // 챔피언스리그, 유로파리그
            when {
                rank <= 8 -> FutInfoDesignSystem.Colors.ChampionsLeague
                rank <= 24 -> FutInfoDesignSystem.Colors.ChampionsLeagueQualification
                else -> Color.Transparent
            }
        }
        39 -> { // 프리미어리그
            when {
                rank <= 4 -> FutInfoDesignSystem.Colors.ChampionsLeague
                rank == 5 -> FutInfoDesignSystem.Colors.EuropaLeague
                rank == 6 -> FutInfoDesignSystem.Colors.ConferenceLeague
                rank >= 18 -> FutInfoDesignSystem.Colors.Relegation
                else -> Color.Transparent
            }
        }
        140 -> { // 라리가
            when {
                rank <= 4 -> FutInfoDesignSystem.Colors.ChampionsLeague
                rank in 5..6 -> FutInfoDesignSystem.Colors.EuropaLeague
                rank == 7 -> FutInfoDesignSystem.Colors.ConferenceLeague
                rank >= 18 -> FutInfoDesignSystem.Colors.Relegation
                else -> Color.Transparent
            }
        }
        78 -> { // 분데스리가
            when {
                rank <= 4 -> FutInfoDesignSystem.Colors.ChampionsLeague
                rank == 5 -> FutInfoDesignSystem.Colors.EuropaLeague
                rank == 6 -> FutInfoDesignSystem.Colors.ConferenceLeague
                rank == 16 -> FutInfoDesignSystem.Colors.RelegationPlayoff
                rank >= 17 -> FutInfoDesignSystem.Colors.Relegation
                else -> Color.Transparent
            }
        }
        135 -> { // 세리에 A
            when {
                rank <= 4 -> FutInfoDesignSystem.Colors.ChampionsLeague
                rank == 5 -> FutInfoDesignSystem.Colors.EuropaLeague
                rank == 6 -> FutInfoDesignSystem.Colors.ConferenceLeague
                rank >= 18 -> FutInfoDesignSystem.Colors.Relegation
                else -> Color.Transparent
            }
        }
        61 -> { // 리그앙
            when {
                rank <= 3 -> FutInfoDesignSystem.Colors.ChampionsLeague
                rank == 4 -> FutInfoDesignSystem.Colors.ChampionsLeagueQualification
                rank == 5 -> FutInfoDesignSystem.Colors.EuropaLeague
                rank == 6 -> FutInfoDesignSystem.Colors.ConferenceLeague
                rank == 16 -> FutInfoDesignSystem.Colors.RelegationPlayoff
                rank >= 17 -> FutInfoDesignSystem.Colors.Relegation
                else -> Color.Transparent
            }
        }
        else -> {
            when {
                rank <= 4 -> FutInfoDesignSystem.Colors.ChampionsLeague
                rank in 5..6 -> FutInfoDesignSystem.Colors.EuropaLeague
                rank >= 18 -> FutInfoDesignSystem.Colors.Relegation
                else -> Color.Transparent
            }
        }
    }
}

/**
 * 진출권 설명 헬퍼 함수
 */
fun getQualificationDescription(leagueId: Int, rank: Int): String {
    return when (leagueId) {
        2, 3 -> { // 챔피언스리그, 유로파리그
            when {
                rank <= 8 -> "16강 직행"
                rank <= 24 -> "16강 플레이오프"
                else -> ""
            }
        }
        39 -> { // 프리미어리그
            when {
                rank <= 4 -> "챔피언스 리그"
                rank == 5 -> "유로파 리그"
                rank == 6 -> "컨퍼런스 리그"
                rank >= 18 -> "강등권"
                else -> ""
            }
        }
        140 -> { // 라리가
            when {
                rank <= 4 -> "챔피언스 리그"
                rank in 5..6 -> "유로파 리그"
                rank == 7 -> "컨퍼런스 리그"
                rank >= 18 -> "강등권"
                else -> ""
            }
        }
        78 -> { // 분데스리가
            when {
                rank <= 4 -> "챔피언스 리그"
                rank == 5 -> "유로파 리그"
                rank == 6 -> "컨퍼런스 리그"
                rank == 16 -> "강등 플레이오프"
                rank >= 17 -> "강등권"
                else -> ""
            }
        }
        135 -> { // 세리에 A
            when {
                rank <= 4 -> "챔피언스 리그"
                rank == 5 -> "유로파 리그"
                rank == 6 -> "컨퍼런스 리그"
                rank >= 18 -> "강등권"
                else -> ""
            }
        }
        61 -> { // 리그앙
            when {
                rank <= 3 -> "챔피언스 리그"
                rank == 4 -> "챔피언스 리그 예선"
                rank == 5 -> "유로파 리그"
                rank == 6 -> "컨퍼런스 리그"
                rank == 16 -> "강등 플레이오프"
                rank >= 17 -> "강등권"
                else -> ""
            }
        }
        else -> {
            when {
                rank <= 4 -> "챔피언스 리그"
                rank in 5..6 -> "유로파 리그"
                rank >= 18 -> "강등권"
                else -> ""
            }
        }
    }
}

/**
 * Material3 호환 DesignSystem 객체
 * BracketScreen 등에서 사용하는 Material3 스타일 접근을 위해
 */
object DesignSystem {
    /**
     * 현재 테마의 색상 팔레트를 반환합니다.
     */
    val colors: androidx.compose.material3.ColorScheme
        @Composable
        @androidx.compose.runtime.ReadOnlyComposable
        get() = MaterialTheme.colorScheme
    
    /**
     * 현재 테마의 타이포그래피를 반환합니다.
     */
    val typography: androidx.compose.material3.Typography
        @Composable
        @androidx.compose.runtime.ReadOnlyComposable
        get() = MaterialTheme.typography
    
    /**
     * 현재 테마의 모양을 반환합니다.
     */
    val shapes: androidx.compose.material3.Shapes
        @Composable
        @androidx.compose.runtime.ReadOnlyComposable
        get() = MaterialTheme.shapes
}