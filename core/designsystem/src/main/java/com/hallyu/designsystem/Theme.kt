package com.hallyu.designsystem

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

private val HallyuDarkColorScheme = darkColorScheme(
    primary = HallyuColors.BrandGradientEnd,
    onPrimary = Color.White,
    secondary = HallyuColors.BrandGradientStart,
    onSecondary = Color.White,
    background = HallyuColors.Background,
    onBackground = HallyuColors.OnBackground,
    surface = HallyuColors.Surface,
    onSurface = HallyuColors.OnSurface,
    surfaceVariant = HallyuColors.SurfaceElevated,
    onSurfaceVariant = HallyuColors.TextSecondary,
    outline = HallyuColors.Outline,
    error = HallyuColors.Error,
)

/** Dark-only for v1 (DESIGN_SYSTEM.md §0). Tokens are centralized for a future light theme. */
@Composable
fun HallyuTheme(content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = HallyuDarkColorScheme,
        typography = HallyuTypography,
        shapes = HallyuShapes,
        content = content,
    )
}
