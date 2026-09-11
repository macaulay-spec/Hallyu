package com.hallyu.designsystem

import androidx.compose.ui.graphics.Color

/**
 * Central color tokens (BLUEPRINT.md §2).
 *
 * The scene is a deep charcoal stage with a faint violet→blue ambient glow, per the approved
 * mockup style. Gradient fills always run light-stop-first so white text sits on the blue half
 * (WCAG AA); coral is used as text/outline, never a fill behind white text.
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

    // Scene lighting — the charcoal stage with a violet→blue ambient wash
    val SceneTop = Color(0xFF181126)
    val SceneMid = Color(0xFF0F0F10)
    val SceneBottom = Color(0xFF0D1828)
    val GlowViolet = Color(0x334A1C6E)
    val GlowBlue = Color(0x2E2D6CDF)
}
