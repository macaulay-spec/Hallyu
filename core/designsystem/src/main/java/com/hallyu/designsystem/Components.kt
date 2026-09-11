package com.hallyu.designsystem

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.RowScope
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.Notifications
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Search
import androidx.compose.material.icons.filled.Verified
import androidx.compose.material.icons.filled.VisibilityOff
import androidx.compose.material3.FilterChip
import androidx.compose.material3.FilterChipDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.blur
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage

val brandGradient: Brush = Brush.horizontalGradient(
    listOf(HallyuColors.BrandGradientStart, HallyuColors.BrandGradientEnd),
)

val brandGradientVertical: Brush = Brush.verticalGradient(
    listOf(HallyuColors.BrandGradientStart, HallyuColors.BrandGradientEnd),
)

/** The charcoal stage every screen sits on — violet at the top, blue at the bottom (BLUEPRINT.md §2). */
val HallyuScreenBrush: Brush = Brush.linearGradient(
    colors = listOf(HallyuColors.SceneTop, HallyuColors.SceneMid, HallyuColors.SceneBottom),
    start = Offset(0f, 0f),
    end = Offset(1000f, 1900f),
)

/** Curated cinematic gradient palette for poster/monogram artwork, keyed by any stable string. */
private val PosterPalettes = listOf(
    listOf(Color(0xFF2B1E54), Color(0xFF7C3AED)),
    listOf(Color(0xFF0E2A4A), Color(0xFF2D6CDF)),
    listOf(Color(0xFF3A1030), Color(0xFFDB2777)),
    listOf(Color(0xFF0F3B33), Color(0xFF10B981)),
    listOf(Color(0xFF4A1414), Color(0xFFF43F5E)),
    listOf(Color(0xFF123A52), Color(0xFF38BDF8)),
    listOf(Color(0xFF3A2A10), Color(0xFFF59E0B)),
    listOf(Color(0xFF1E1B4B), Color(0xFF6366F1)),
)

fun posterGradient(seed: String): Brush {
    val idx = (seed.hashCode() and Int.MAX_VALUE) % PosterPalettes.size
    val c = PosterPalettes[idx]
    return Brush.verticalGradient(listOf(c[0], c[1]))
}

/** Ambient scene wrapper — deep charcoal with soft violet/blue glow. Screens render inside this. */
@Composable
fun HallyuBackground(
    modifier: Modifier = Modifier,
    content: @Composable () -> Unit,
) {
    Box(modifier = modifier.fillMaxSize().background(HallyuScreenBrush)) {
        Box(
            Modifier
                .fillMaxSize()
                .background(
                    Brush.radialGradient(
                        colors = listOf(HallyuColors.GlowViolet, Color.Transparent),
                        center = Offset(0f, 0f),
                        radius = 1200f,
                    )
                )
        )
        Box(
            Modifier
                .fillMaxSize()
                .background(
                    Brush.radialGradient(
                        colors = listOf(HallyuColors.GlowBlue, Color.Transparent),
                        center = Offset(1200f, 2400f),
                        radius = 1400f,
                    )
                )
        )
        content()
    }
}

// ---------------------------------------------------------------------------
// Buttons
// ---------------------------------------------------------------------------

@Composable
fun HallyuButton(
    text: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    enabled: Boolean = true,
) {
    val bg = if (enabled) brandGradient else Brush.horizontalGradient(
        listOf(HallyuColors.TextTertiary, HallyuColors.TextTertiary),
    )
    Box(
        modifier = modifier
            .fillMaxWidth()
            .height(50.dp)
            .clip(RoundedCornerShape(14.dp))
            .background(bg)
            .clickable(enabled = enabled, onClick = onClick),
        contentAlignment = Alignment.Center,
    ) {
        Text(
            text = text,
            color = Color.White,
            style = MaterialTheme.typography.labelLarge,
            fontWeight = FontWeight.SemiBold,
        )
    }
}

@Composable
fun HallyuOutlinedButton(
    text: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    accent: Boolean = false,
) {
    Box(
        modifier = modifier
            .fillMaxWidth()
            .height(50.dp)
            .clip(RoundedCornerShape(14.dp))
            .border(
                width = 1.dp,
                color = if (accent) HallyuColors.Accent else HallyuColors.Outline,
                shape = RoundedCornerShape(14.dp),
            )
            .clickable(onClick = onClick),
        contentAlignment = Alignment.Center,
    ) {
        Text(
            text = text,
            color = if (accent) HallyuColors.Accent else HallyuColors.OnSurface,
            style = MaterialTheme.typography.labelLarge,
            fontWeight = FontWeight.SemiBold,
        )
    }
}

// ---------------------------------------------------------------------------
// Bars
// ---------------------------------------------------------------------------

@Composable
fun HallyuTopBar(
    title: String,
    modifier: Modifier = Modifier,
    onBack: (() -> Unit)? = null,
    actions: @Composable () -> Unit = {},
) {
    Row(
        modifier = modifier
            .fillMaxWidth()
            .height(56.dp)
            .padding(horizontal = Spacing.md),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        if (onBack != null) {
            IconButton(onClick = onBack) {
                Icon(Icons.Filled.ArrowBack, contentDescription = "Back", tint = HallyuColors.OnBackground)
            }
            Spacer(Modifier.width(Spacing.xs))
        }
        Text(
            text = title,
            style = MaterialTheme.typography.headlineSmall,
            maxLines = 1,
            overflow = TextOverflow.Ellipsis,
            modifier = Modifier.weight(1f),
        )
        actions()
    }
}

@Composable
fun GlassBottomNav(
    selected: Int,
    onSelect: (Int) -> Unit,
    onCreate: () -> Unit,
    modifier: Modifier = Modifier,
) {
    Row(
        modifier = modifier
            .fillMaxWidth()
            .height(66.dp)
            .clip(RoundedCornerShape(topStart = 20.dp, topEnd = 20.dp))
            .background(HallyuColors.SurfaceGlass)
            .border(width = 0.5.dp, color = HallyuColors.Outline),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        NavTab(Icons.Filled.Home, "Home", selected == 0) { onSelect(0) }
        NavTab(Icons.Filled.Search, "Explore", selected == 1) { onSelect(1) }
        Box(modifier = Modifier.weight(1f), contentAlignment = Alignment.Center) {
            Box(
                modifier = Modifier
                    .size(56.dp)
                    .clip(CircleShape)
                    .background(brandGradient)
                    .clickable(onClick = onCreate),
                contentAlignment = Alignment.Center,
            ) {
                Icon(Icons.Filled.Add, contentDescription = "Create", tint = Color.White)
            }
        }
        NavTab(Icons.Filled.Notifications, "Notifications", selected == 3) { onSelect(3) }
        NavTab(Icons.Filled.Person, "Profile", selected == 4) { onSelect(4) }
    }
}

@Composable
private fun RowScope.NavTab(icon: ImageVector, label: String, selected: Boolean, onClick: () -> Unit) {
    Column(
        modifier = Modifier
            .weight(1f)
            .clickable(onClick = onClick)
            .padding(vertical = Spacing.sm),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center,
    ) {
        Icon(
            imageVector = icon,
            contentDescription = label,
            tint = if (selected) HallyuColors.BrandGradientEnd else HallyuColors.TextSecondary,
            modifier = Modifier.size(24.dp),
        )
        Text(
            text = label,
            fontSize = 10.sp,
            color = if (selected) HallyuColors.BrandGradientEnd else HallyuColors.TextSecondary,
        )
    }
}

// ---------------------------------------------------------------------------
// Identity
// ---------------------------------------------------------------------------

@Composable
fun HallyuAvatar(url: String?, name: String, size: Int = 40) {
    if (url.isNullOrBlank()) {
        Box(
            modifier = Modifier
                .size(size.dp)
                .clip(CircleShape)
                .background(posterGradient(name)),
            contentAlignment = Alignment.Center,
        ) {
            Text(
                text = name.take(1).uppercase(),
                color = Color.White,
                fontWeight = FontWeight.Bold,
                fontSize = (size / 2.4f).sp,
            )
        }
    } else {
        AsyncImage(
            model = url,
            contentDescription = name,
            contentScale = ContentScale.Crop,
            modifier = Modifier
                .size(size.dp)
                .clip(CircleShape),
        )
    }
}

@Composable
fun VerifiedBadge(modifier: Modifier = Modifier) {
    Icon(
        imageVector = Icons.Filled.Verified,
        contentDescription = "Verified",
        tint = HallyuColors.Info,
        modifier = modifier.size(14.dp),
    )
}

// ---------------------------------------------------------------------------
// Drama context
// ---------------------------------------------------------------------------

@Composable
fun DramaContextChip(
    dramaTitle: String,
    episodeNumber: Int?,
    onClick: (() -> Unit)? = null,
    modifier: Modifier = Modifier,
) {
    val label = if (episodeNumber != null) "$dramaTitle · Ep $episodeNumber" else dramaTitle
    val base = modifier
        .clip(RoundedCornerShape(999.dp))
        .background(HallyuColors.BrandGradientStart.copy(alpha = 0.35f))
        .border(width = 0.5.dp, color = HallyuColors.BrandGradientStart.copy(alpha = 0.6f), shape = RoundedCornerShape(999.dp))
    val clickable = if (onClick != null) base.clickable(onClick = onClick) else base
    Text(
        text = label,
        style = MaterialTheme.typography.labelMedium,
        color = HallyuColors.OnBackground,
        maxLines = 1,
        overflow = TextOverflow.Ellipsis,
        modifier = clickable.padding(horizontal = 10.dp, vertical = 4.dp),
    )
}

// ---------------------------------------------------------------------------
// Spoiler
// ---------------------------------------------------------------------------

@Composable
fun SpoilerOverlay(
    spoiled: Boolean,
    content: @Composable () -> Unit,
    onReveal: () -> Unit,
    modifier: Modifier = Modifier,
) {
    if (!spoiled) {
        content()
        return
    }
    Box(modifier = modifier) {
        Box(modifier = Modifier.blur(16.dp)) { content() }
        Box(
            modifier = Modifier
                .matchParentSize()
                .background(HallyuColors.Scrim),
            contentAlignment = Alignment.Center,
        ) {
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                Icon(Icons.Filled.VisibilityOff, contentDescription = null, tint = HallyuColors.Accent)
                Spacer(Modifier.height(Spacing.sm))
                Text(
                    "Spoiler for a later episode",
                    style = MaterialTheme.typography.labelLarge,
                    color = HallyuColors.OnBackground,
                )
                Spacer(Modifier.height(Spacing.md))
                OutlinedButton(
                    onClick = onReveal,
                    shape = RoundedCornerShape(999.dp),
                    border = androidx.compose.foundation.BorderStroke(1.dp, HallyuColors.Accent),
                    contentPadding = PaddingValues(horizontal = 20.dp, vertical = 8.dp),
                ) {
                    Text("Reveal spoiler", color = HallyuColors.Accent)
                }
            }
        }
    }
}

// ---------------------------------------------------------------------------
// Cards & chips
// ---------------------------------------------------------------------------

@Composable
fun StoryRing(
    imageUrl: String?,
    label: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
) {
    Column(
        modifier = modifier.width(64.dp).clickable(onClick = onClick),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Box(
            modifier = Modifier
                .size(60.dp)
                .clip(CircleShape)
                .background(brandGradient)
                .padding(2.dp),
        ) {
            HallyuAvatar(url = imageUrl, name = label, size = 56)
        }
        Spacer(Modifier.height(Spacing.xs))
        Text(
            text = label,
            style = MaterialTheme.typography.labelMedium,
            color = HallyuColors.TextSecondary,
            maxLines = 1,
            overflow = TextOverflow.Ellipsis,
        )
    }
}

@Composable
fun DramaPosterCard(
    posterUrl: String?,
    title: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    follow: Boolean = false,
    followed: Boolean = false,
    onFollow: (() -> Unit)? = null,
) {
    Column(modifier = modifier.width(120.dp).clickable(onClick = onClick)) {
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(168.dp)
                .clip(RoundedCornerShape(16.dp))
                .background(posterGradient(title)),
        ) {
            if (posterUrl.isNullOrBlank()) {
                Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    Text(
                        text = title.take(1).uppercase(),
                        color = Color.White.copy(alpha = 0.92f),
                        fontSize = 34.sp,
                        fontWeight = FontWeight.Bold,
                    )
                }
                // subtle diagonal light streak for depth
                Box(
                    Modifier
                        .fillMaxSize()
                        .background(
                            Brush.linearGradient(
                                colors = listOf(Color.White.copy(alpha = 0f), Color.White.copy(alpha = 0.14f), Color.White.copy(alpha = 0f)),
                                start = Offset(0f, 0f),
                                end = Offset(400f, 700f),
                            )
                        )
                )
            } else {
                AsyncImage(
                    model = posterUrl,
                    contentDescription = title,
                    contentScale = ContentScale.Crop,
                    modifier = Modifier.fillMaxSize(),
                )
            }
            if (follow && onFollow != null) {
                Box(
                    modifier = Modifier
                        .align(Alignment.TopEnd)
                        .padding(6.dp)
                        .size(28.dp)
                        .clip(CircleShape)
                        .background(if (followed) HallyuColors.Accent else HallyuColors.Scrim)
                        .clickable(onClick = onFollow),
                    contentAlignment = Alignment.Center,
                ) {
                    if (followed) {
                        Icon(Icons.Filled.Check, contentDescription = "Following", tint = Color.White, modifier = Modifier.size(16.dp))
                    } else {
                        Icon(Icons.Filled.Add, contentDescription = "Follow", tint = Color.White, modifier = Modifier.size(16.dp))
                    }
                }
            }
        }
        Spacer(Modifier.height(Spacing.xs))
        Text(
            text = title,
            style = MaterialTheme.typography.labelMedium,
            color = HallyuColors.OnSurface,
            maxLines = 1,
            overflow = TextOverflow.Ellipsis,
        )
    }
}

@Composable
fun CastChip(name: String, photoUrl: String?, onClick: () -> Unit, modifier: Modifier = Modifier) {
    Column(
        modifier = modifier.width(76.dp).clickable(onClick = onClick),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        HallyuAvatar(url = photoUrl, name = name, size = 64)
        Spacer(Modifier.height(Spacing.xs))
        Text(
            text = name,
            style = MaterialTheme.typography.labelMedium,
            color = HallyuColors.OnSurface,
            maxLines = 1,
            overflow = TextOverflow.Ellipsis,
        )
    }
}

@Composable
fun SectionHeader(title: String, modifier: Modifier = Modifier, action: String? = null, onAction: (() -> Unit)? = null) {
    Row(
        modifier = modifier.fillMaxWidth().padding(vertical = Spacing.sm),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Text(
            text = title,
            style = MaterialTheme.typography.headlineSmall,
            modifier = Modifier.weight(1f),
        )
        if (action != null && onAction != null) {
            Text(
                text = action,
                style = MaterialTheme.typography.labelLarge,
                color = HallyuColors.BrandGradientEnd,
                modifier = Modifier.clickable(onClick = onAction),
            )
        }
    }
}

// ---------------------------------------------------------------------------
// Search & filters
// ---------------------------------------------------------------------------

@Composable
fun HallyuSearchBar(
    query: String,
    onQueryChange: (String) -> Unit,
    modifier: Modifier = Modifier,
    placeholder: String = "Search dramas, actors, communities…",
) {
    OutlinedTextField(
        value = query,
        onValueChange = onQueryChange,
        modifier = modifier.fillMaxWidth(),
        placeholder = { Text(placeholder, color = HallyuColors.TextTertiary) },
        leadingIcon = { Icon(Icons.Filled.Search, contentDescription = "Search", tint = HallyuColors.TextSecondary) },
        singleLine = true,
        shape = RoundedCornerShape(14.dp),
        colors = OutlinedTextFieldDefaults.colors(
            focusedBorderColor = HallyuColors.BrandGradientEnd,
            unfocusedBorderColor = HallyuColors.Outline,
            focusedTextColor = HallyuColors.OnSurface,
            unfocusedTextColor = HallyuColors.OnSurface,
            focusedContainerColor = HallyuColors.Surface,
            unfocusedContainerColor = HallyuColors.Surface,
        ),
    )
}

@Composable
fun FilterChips(
    options: List<String>,
    selected: String,
    onSelect: (String) -> Unit,
    modifier: Modifier = Modifier,
) {
    Row(
        modifier = modifier
            .fillMaxWidth()
            .horizontalScroll(rememberScrollState()),
        horizontalArrangement = Arrangement.spacedBy(Spacing.sm),
    ) {
        options.forEach { option ->
            val isSelected = option == selected
            FilterChip(
                selected = isSelected,
                onClick = { onSelect(option) },
                label = { Text(option, textAlign = TextAlign.Center) },
                colors = FilterChipDefaults.filterChipColors(
                    containerColor = HallyuColors.Surface,
                    labelColor = if (isSelected) HallyuColors.OnBackground else HallyuColors.TextSecondary,
                    selectedContainerColor = HallyuColors.BrandGradientStart.copy(alpha = 0.5f),
                    selectedLabelColor = HallyuColors.OnBackground,
                ),
            )
        }
    }
}
