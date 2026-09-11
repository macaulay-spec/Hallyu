package com.hallyu.app.ui.feed
import com.hallyu.designsystem.HallyuScreenBrush

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.Forum
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.navigation.NavController
import com.hallyu.app.navigation.Routes
import com.hallyu.designsystem.EmptyState
import com.hallyu.designsystem.ErrorState
import com.hallyu.designsystem.HallyuColors
import com.hallyu.designsystem.LoadingState
import com.hallyu.designsystem.PostCard
import com.hallyu.designsystem.Spacing
import com.hallyu.designsystem.StoryRing
import com.hallyu.domain.model.FeedKind
import com.hallyu.domain.model.Post

@Composable
fun HomeScreen(navController: NavController, viewModel: FeedViewModel = hiltViewModel()) {
    val state = viewModel.state

    Column(modifier = Modifier.fillMaxSize().background(HallyuScreenBrush)) {
        // Header + segmented control
        Row(
            modifier = Modifier.fillMaxWidth().padding(horizontal = Spacing.lg, vertical = Spacing.sm),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Text("Hallyu", fontSize = 22.sp, fontWeight = FontWeight.Bold, color = HallyuColors.OnBackground)
            Spacer(Modifier.width(Spacing.lg))
            Segment("For You", state.kind == FeedKind.FOR_YOU) { viewModel.load(FeedKind.FOR_YOU) }
            Spacer(Modifier.width(Spacing.sm))
            Segment("Following", state.kind == FeedKind.FOLLOWING) { viewModel.load(FeedKind.FOLLOWING) }
        }

        when {
            state.loading && state.posts.isEmpty() -> LoadingState()
            state.error != null && state.posts.isEmpty() -> ErrorState(state.error ?: "", onRetry = { viewModel.load() })
            else -> FeedList(navController, viewModel, state)
        }
    }
}

@Composable
private fun Segment(label: String, selected: Boolean, onClick: () -> Unit) {
    Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.clickable(onClick = onClick)) {
        Text(
            text = label,
            style = MaterialTheme.typography.labelLarge,
            color = if (selected) HallyuColors.OnBackground else HallyuColors.TextSecondary,
        )
        Spacer(Modifier.height(2.dp))
        Box(
            Modifier
                .width(if (selected) 28.dp else 0.dp)
                .height(2.dp)
                .background(com.hallyu.designsystem.brandGradient),
        )
    }
}

@Composable
private fun FeedList(navController: NavController, viewModel: FeedViewModel, state: FeedState) {
    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = androidx.compose.foundation.layout.PaddingValues(bottom = Spacing.xxl),
        verticalArrangement = Arrangement.spacedBy(Spacing.md),
    ) {
        if (state.airing.isNotEmpty()) {
            item {
                LazyRow(
                    contentPadding = androidx.compose.foundation.layout.PaddingValues(horizontal = Spacing.lg),
                    horizontalArrangement = Arrangement.spacedBy(Spacing.md),
                ) {
                    items(state.airing) { drama ->
                        StoryRing(
                            imageUrl = drama.posterUrl,
                            label = drama.title,
                            onClick = { navController.navigate(Routes.drama(drama.id)) },
                        )
                    }
                }
            }
        }
        if (state.posts.isEmpty()) {
            item {
                EmptyState(
                    icon = Icons.Outlined.Forum,
                    title = "Your fandom is quiet here",
                    message = "Follow a few dramas or communities to get things moving.",
                )
            }
        } else {
            items(state.posts, key = { it.id }) { post ->
                PostCard(
                    post = post,
                    watchedThroughEpisode = viewModel.watchedThrough(post.dramaId),
                    spoilerMode = state.spoilerMode,
                    revealed = viewModel.isRevealed(post.id),
                    onOpen = { navController.navigate(Routes.post(post.id)) },
                    onAuthorClick = { navController.navigate(Routes.post(post.id)) },
                    onDramaClick = { post.dramaId?.let { navController.navigate(Routes.drama(it)) } },
                    onLike = { viewModel.toggleLike(post) },
                    onComment = { navController.navigate(Routes.comments(post.id)) },
                    onRepost = { viewModel.toggleRepost(post) },
                    onBookmark = { viewModel.toggleBookmark(post) },
                    onReveal = { viewModel.reveal(post.id) },
                    modifier = Modifier.padding(horizontal = Spacing.lg),
                )
            }
        }
    }
}


