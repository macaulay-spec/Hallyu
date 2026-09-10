package com.hallyu.designsystem

import java.time.OffsetDateTime
import java.time.format.DateTimeParseException
import kotlin.math.abs

fun compactCount(n: Int): String = when {
    n < 1000 -> n.toString()
    n < 1_000_000 -> {
        val v = n / 1000f
        if (v >= 100) "${v.toInt()}K" else "${round1(v)}K"
    }
    else -> {
        val v = n / 1_000_000f
        if (v >= 100) "${v.toInt()}M" else "${round1(v)}M"
    }
}

private fun round1(v: Float): String {
    val tenths = (v * 10).toInt()
    return "${tenths / 10}.${tenths % 10}"
}

fun timeAgo(iso: String): String {
    if (iso.isBlank()) return ""
    return try {
        val then = OffsetDateTime.parse(iso)
        val seconds = java.time.Duration.between(then, OffsetDateTime.now()).seconds
        when {
            seconds < 60 -> "now"
            seconds < 3600 -> "${seconds / 60}m"
            seconds < 86400 -> "${seconds / 3600}h"
            seconds < 604800 -> "${seconds / 86400}d"
            else -> "${abs(seconds) / 604800}w"
        }
    } catch (e: DateTimeParseException) {
        iso.take(10)
    }
}
