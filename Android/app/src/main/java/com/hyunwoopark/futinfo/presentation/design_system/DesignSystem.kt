package com.hyunwoopark.futinfo.presentation.design_system

import androidx.compose.ui.graphics.Color

/**
 * iOS 스타일의 디자인 시스템
 */
object DesignSystem {
    object Colors {
        // Primary Colors
        val background = Color(0xFFF2F2F7)
        val surface = Color.White
        val surfaceVariant = Color(0xFFF9F9FB)
        
        // Text Colors
        val textPrimary = Color(0xFF000000)
        val textSecondary = Color(0xFF8E8E93)
        val textTertiary = Color(0xFFC7C7CC)
        
        // Accent Colors
        val accent = Color(0xFF007AFF)
        val accentVariant = Color(0xFF0051D5)
        
        // Semantic Colors
        val success = Color(0xFF34C759)
        val warning = Color(0xFFFF9500)
        val destructive = Color(0xFFFF3B30)
        
        // Border & Divider
        val border = Color(0xFFE5E5EA)
        val divider = Color(0xFFD1D1D6)
        
        // Gradient Colors
        val gradientStart = Color(0xFF007AFF)
        val gradientEnd = Color(0xFF5856D6)
    }
}