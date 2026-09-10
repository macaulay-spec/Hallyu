package com.hallyu.designsystem

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Bookmark
import androidx.compose.material.icons.filled.Favorite
import androidx.compose.material.icons.filled.Repeat
import androidx.compose.material.icons.filled.VisibilityOff
import androidx.compose.material.icons.outlined.BookmarkBorder
import androidx.compose.material.icons.outlined.ChatBubbleOutline
import androidx.compose.material.icons.outlined.FavoriteBorder
import androidx.compose.material.icons.outlined.Repeat
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import coil.compose.AsyncImage
import com.hallyu.domain.model.Post
import com.hallyu.domain.usecase.SpoilerPolicy
import com.hallyu.domain.usecase.SpoilerVisibility

/**
 * The core feed card. Spoiler behavior is driven by the domain [SpoilerPolicy]
 * (spec §9) rather than a hard-coded blur: a user who hasn't watched past an
 * episode sees that content blurred (default) or hidden, never raw.
 */
@Composable
fun PostCard(
    post: Post,
    watchedThroughEpisode: Int,
    spoilerMode: String,
    onOpen: () -> Unit,
    onAuthorClick: () -> Unit,
    onDramaClick: () -> Unit,
    onLike: () -> Unit,
    onComment: () -> Unit,
    onRepost: () -> Unit,
    onBookmark: () -> Unit,
    onReveal: () -> Unit,
    modifier: Modifier = Modifier,
    revealed: Boolean = false,
) {
    val rawVisibility = SpoilerPolicy.visibility(
        watchedThroughEpisode = watchedThroughEpisode,
        postEpisodeNumber = post.episodeNumber,
        postSpoilerLevel = post.spoilerLevel,
        mode = spoilerMode,
    )
    val visibility = if (revealed && rawVisibility != SpoilerVisibility.VISIBLE) SpoilerVisibility.VISIBLE else rawVisibility

    if (visibility == SpoilerVisibility.HIDDEN) {
        HiddenSpoilerRow(post = post, onReveal = onReveal, modifier = modifier)
        return
    }

    Column(
        modifier = modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(12.dp))
            .background(HallyuColors.Surface)
            .clickable(onClick = onOpen)
            .padding(Spacing.lg),
    ) {
        // Header
        Row(verticalAlignment = Alignment.CenterVertically) {
            Box(Modifier.clickable(onClick = onAuthorClick)) {
                HallyuAvatar(
                    url = post.author?.avatarUrl,
                    name = post.author?.displayName ?: post.author?.username ?: "?",
                    size = 40,
                )
            }
            Spacer(Modifier.width(Spacing.sm))
            Column(Modifier.weight(1f)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(
                        text = post.author?.displayName ?: post.author?.username ?: "unknown",
                        style = MaterialTheme.typography.labelLarge,
                        fontWeight = FontWeight.SemiBold,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis,
                    )
                    if (post.author?.isVerified == true) {
                        Spacer(Modifier.width(4.dp))
                        VerifiedBadge()
                    }
                }
                Text(
                    text = timeAgo(post.createdAt),
                    style = MaterialTheme.typography.labelMedium,
                    color = HallyuColors.TextSecondary,
                )
            }
            if (post.category != null) {
                Text(
                    text = com.hallyu.domain.model.Categories.label(post.category),
                    style = MaterialTheme.typography.labelMedium,
                    color = HallyuColors.TextSecondary,
                )
            }
        }

        // Drama / episode context — the product's identity element
        if (post.dramaTitle != null) {
            Spacer(Modifier.height(Spacing.sm))
            DramaContextChip(
                dramaTitle = post.dramaTitle,
                episodeNumber = post.episodeNumber,
                onClick = onDramaClick,
            )
        }

        Spacer(Modifier.height(Spacing.sm))

        // Body (spoiler-aware)
        if (post.text.isNotBlank()) {
            SpoilerOverlay(
                spoiled = visibility == SpoilerVisibility.BLURRED,
                onReveal = onReveal,
                content = {
                    Text(
                        text = post.text,
                        style = MaterialTheme.typography.bodyLarge,
                        maxLines = if (visibility == SpoilerVisibility.BLURRED) 4 else Int.MAX_VALUE,
                        overflow = TextOverflow.Ellipsis,
                    )
                },
            )
        }

        // Media
        if (post.imageUrls.isNotEmpty()) {
            Spacer(Modifier.height(Spacing.sm))
            Box(
                Modifier
                    .fillMaxWidth()
                    .height(200.dp)
                    .clip(RoundedCornerShape(12.dp)),
            ) {
                AsyncImage(
                    model = post.imageUrls.first(),
                    contentDescription = "Post image",
                    contentScale = ContentScale.Crop,
                    modifier = Modifier.fillMaxWidth().height(200.dp),
                )
                if (post.imageUrls.size > 1) {
                    Box(
                        modifier = Modifier
                            .align(Alignment.TopEnd)
                            .padding(Spacing.sm)
                            .clip(RoundedCornerShape(999.dp))
                            .background(HallyuColors.Scrim)
                            .padding(horizontal = 8.dp, vertical = 4.dp),
                    ) {
                        Text("+${post.imageUrls.size - 1}", color = Color.White, style = MaterialTheme.typography.labelMedium)
                    }
                }
            }
        }

        Spacer(Modifier.height(Spacing.md))

        // Action row
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
        ) {
            Action(Icons.Outlined.ChatBubbleOutline, compactCount(post.commentCount), onClick = onComment)
            Action(if (post.isReposted) Icons.Filled.Repeat else Icons.Outlined.Repeat, compactCount(post.repostCount), onClick = onRepost, tint = if (post.isReposted) HallyuColors.Success else null)
            Action(
                icon = if (post.isLiked) Icons.Filled.Favorite else Icons.Outlined.FavoriteBorder,
                label = compactCount(post.likeCount),
                onClick = onLike,
                tint = if (post.isLiked) HallyuColors.Accent else null,
            )
            Action(if (post.isBookmarked) Icons.Filled.Bookmark else Icons.Outlined.BookmarkBorder, null, onClick = onBookmark, tint = if (post.isBookmarked) HallyuColors.BrandGradientEnd else null)
        }
    }
}

@Composable
private fun Action(
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    label: String?,
    onClick: () -> Unit,
    tint: Color? = null,
) {
    Row(
        verticalAlignment = Alignment.CenterVertically,
        modifier = Modifier.clickable(onClick = onClick).padding(horizontal = Spacing.xs, vertical = Spacing.xs),
    ) {
        Icon(
            imageVector = icon,
            contentDescription = null,
            tint = tint ?: HallyuColors.TextSecondary,
            modifier = Modifier.size(20.dp),
        )
        if (label != null) {
            Spacer(Modifier.width(4.dp))
            Text(text = label, style = MaterialTheme.typography.labelMedium, color = tint ?: HallyuColors.TextSecondary)
        }
    }
}

@Composable
private fun HiddenSpoilerRow(post: Post, onReveal: () -> Unit, modifier: Modifier = Modifier) {
    Row(
        modifier = modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(12.dp))
            .background(HallyuColors.Surface)
            .padding(Spacing.lg),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Icon(Icons.Filled.VisibilityOff, contentDescription = null, tint = HallyuColors.Accent)
        Spacer(Modifier.width(Spacing.sm))
        Text(
            text = "Hidden spoiler · ${post.dramaTitle ?: "episode"}",
            style = MaterialTheme.typography.labelLarge,
            modifier = Modifier.weight(1f),
        )
        Text(
            text = "Reveal",
            color = HallyuColors.Accent,
            style = MaterialTheme.typography.labelLarge,
            modifier = Modifier.clickable(onClick = onReveal),
        )
    }
}
