package com.hallyu.designsystem

import androidx.compose.material3.Typography
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp

// Display/body faces. Apple-level hierarchy is achieved through weight + tight tracking rather
// than an exotic face, so the build stays hermetic (no network font fetch at runtime).
val HallyuDisplayFamily: FontFamily = FontFamily.SansSerif
val HallyuBodyFamily: FontFamily = FontFamily.SansSerif

/** Complete, tracked type scale (BLUEPRINT.md §3) — tight tracking on display/headlines, air on labels. */
val HallyuTypography = Typography(
    displayLarge = TextStyle(
        fontFamily = HallyuDisplayFamily,
        fontWeight = FontWeight.SemiBold,
        fontSize = 34.sp,
        lineHeight = 41.sp,
        letterSpacing = (-0.4).sp,
        color = HallyuColors.OnBackground,
    ),
    displayMedium = TextStyle(
        fontFamily = HallyuDisplayFamily,
        fontWeight = FontWeight.SemiBold,
        fontSize = 28.sp,
        lineHeight = 34.sp,
        letterSpacing = (-0.3).sp,
        color = HallyuColors.OnBackground,
    ),
    headlineLarge = TextStyle(
        fontFamily = HallyuDisplayFamily,
        fontWeight = FontWeight.SemiBold,
        fontSize = 26.sp,
        lineHeight = 32.sp,
        letterSpacing = (-0.2).sp,
        color = HallyuColors.OnBackground,
    ),
    headlineMedium = TextStyle(
        fontFamily = HallyuDisplayFamily,
        fontWeight = FontWeight.SemiBold,
        fontSize = 22.sp,
        lineHeight = 28.sp,
        letterSpacing = (-0.2).sp,
        color = HallyuColors.OnBackground,
    ),
    headlineSmall = TextStyle(
        fontFamily = HallyuDisplayFamily,
        fontWeight = FontWeight.SemiBold,
        fontSize = 18.sp,
        lineHeight = 24.sp,
        letterSpacing = (-0.1).sp,
        color = HallyuColors.OnBackground,
    ),
    titleLarge = TextStyle(
        fontFamily = HallyuBodyFamily,
        fontWeight = FontWeight.SemiBold,
        fontSize = 18.sp,
        lineHeight = 24.sp,
        color = HallyuColors.OnSurface,
    ),
    titleMedium = TextStyle(
        fontFamily = HallyuBodyFamily,
        fontWeight = FontWeight.SemiBold,
        fontSize = 16.sp,
        lineHeight = 22.sp,
        color = HallyuColors.OnSurface,
    ),
    titleSmall = TextStyle(
        fontFamily = HallyuBodyFamily,
        fontWeight = FontWeight.SemiBold,
        fontSize = 14.sp,
        lineHeight = 20.sp,
        color = HallyuColors.OnSurface,
    ),
    bodyLarge = TextStyle(
        fontFamily = HallyuBodyFamily,
        fontWeight = FontWeight.Normal,
        fontSize = 16.sp,
        lineHeight = 24.sp,
        color = HallyuColors.OnSurface,
    ),
    bodyMedium = TextStyle(
        fontFamily = HallyuBodyFamily,
        fontWeight = FontWeight.Normal,
        fontSize = 14.sp,
        lineHeight = 20.sp,
        color = HallyuColors.OnSurface,
    ),
    bodySmall = TextStyle(
        fontFamily = HallyuBodyFamily,
        fontWeight = FontWeight.Normal,
        fontSize = 12.sp,
        lineHeight = 16.sp,
        color = HallyuColors.TextSecondary,
    ),
    labelLarge = TextStyle(
        fontFamily = HallyuBodyFamily,
        fontWeight = FontWeight.SemiBold,
        fontSize = 14.sp,
        lineHeight = 20.sp,
        letterSpacing = 0.1.sp,
        color = HallyuColors.OnSurface,
    ),
    labelMedium = TextStyle(
        fontFamily = HallyuBodyFamily,
        fontWeight = FontWeight.Medium,
        fontSize = 12.sp,
        lineHeight = 16.sp,
        letterSpacing = 0.2.sp,
        color = HallyuColors.TextSecondary,
    ),
    labelSmall = TextStyle(
        fontFamily = HallyuBodyFamily,
        fontWeight = FontWeight.Medium,
        fontSize = 11.sp,
        lineHeight = 14.sp,
        letterSpacing = 0.5.sp,
        color = HallyuColors.TextTertiary,
    ),
)
