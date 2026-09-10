package com.hallyu.designsystem

import androidx.compose.ui.graphics.Color

/**
 * Central color tokens (design/DESIGN_SYSTEM.md §1).
 * Gradient fills must run light-stop-first so white text sits on the blue half (WCAG AA).
 */
object HallyuColors {
    // Brand
    val BrandGradientStart = Color(0xFF4A1C6E)
    val BrandGradientEnd = Color(0xFF2D6CDF)
    val Accent = Color(0xFFFF6B6B)

    // Surfaces
    val Background = Color(0xFF0F0F0F)
    val Surface = Color(0xFF1A1A1E)
    val SurfaceElevated = Color(0xFF22222A)
    val SurfaceGlass = Color(0xB814141A) // 72%
    val Scrim = Color(0x99000000) // 60%

    // Content
    val OnBackground = Color(0xFFF5F5F7)
    val OnSurface = Color(0xFFECECF1)
    val TextSecondary = Color(0xFF9A9AA5)
    val TextTertiary = Color(0xFF6A6A75)
    val Outline = Color(0xFF2A2A33)

    // Semantic
    val Success = Color(0xFF34D399)
    val Warning = Color(0xFFFBBF24)
    val Info = Color(0xFF38BDF8)
    val Error = Color(0xFFFF6B6B)
}
