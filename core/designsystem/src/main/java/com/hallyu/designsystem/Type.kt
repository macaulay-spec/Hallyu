package com.hallyu.designsystem

import androidx.compose.material3.Typography
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp

// Display face (brand): Black Han Sans when bundled; SansSerif fallback keeps the
// build hermetic until the licensed font file is added to resources.
val HallyuDisplayFamily: FontFamily = FontFamily.SansSerif
val HallyuBodyFamily: FontFamily = FontFamily.SansSerif

val HallyuTypography = Typography(
    displayLarge = TextStyle(
        fontFamily = HallyuDisplayFamily,
        fontWeight = FontWeight.Normal,
        fontSize = 34.sp,
        lineHeight = 40.sp,
        color = HallyuColors.OnBackground,
    ),
    headlineMedium = TextStyle(
        fontFamily = HallyuDisplayFamily,
        fontWeight = FontWeight.Normal,
        fontSize = 24.sp,
        lineHeight = 32.sp,
        color = HallyuColors.OnBackground,
    ),
    titleLarge = TextStyle(
        fontFamily = HallyuBodyFamily,
        fontWeight = FontWeight.SemiBold,
        fontSize = 20.sp,
        lineHeight = 28.sp,
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
    labelLarge = TextStyle(
        fontFamily = HallyuBodyFamily,
        fontWeight = FontWeight.Medium,
        fontSize = 14.sp,
        lineHeight = 20.sp,
        color = HallyuColors.OnSurface,
    ),
    labelMedium = TextStyle(
        fontFamily = HallyuBodyFamily,
        fontWeight = FontWeight.Medium,
        fontSize = 12.sp,
        lineHeight = 16.sp,
        color = HallyuColors.TextSecondary,
    ),
)
