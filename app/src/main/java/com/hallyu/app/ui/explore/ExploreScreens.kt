package com.hallyu.app.ui.explore
import com.hallyu.designsystem.HallyuScreenBrush

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
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
import androidx.compose.material.icons.filled.Search
import androidx.compose.material.icons.outlined.Explore
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.NavController
import com.hallyu.app.navigation.Routes
import com.hallyu.designsystem.CastChip
import com.hallyu.designsystem.DramaPosterCard
import com.hallyu.designsystem.EmptyState
import com.hallyu.designsystem.FilterChips
import com.hallyu.designsystem.HallyuAvatar
import com.hallyu.designsystem.HallyuColors
import com.hallyu.designsystem.HallyuSearchBar
import com.hallyu.designsystem.HallyuTopBar
import com.hallyu.designsystem.LoadingState
import com.hallyu.designsystem.PostCard
import com.hallyu.designsystem.SectionHeader
import com.hallyu.designsystem.Spacing
import com.hallyu.designsystem.brandGradient

@Composable
fun ExploreScreen(navController: NavController, viewModel: ExploreViewModel = hiltViewModel()) {
    val state = viewModel.state
    Column(modifier = Modifier.fillMaxSize().background(HallyuScreenBrush)) {
        Column(Modifier.padding(horizontal = Spacing.lg)) {
            Spacer(Modifier.height(Spacing.sm))
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(52.dp)
                    .clip(androidx.compose.foundation.shape.RoundedCornerShape(12.dp))
                    .background(HallyuColors.Surface)
                    .clickable { navController.navigate(Routes.SEARCH) }
                    .padding(horizontal = Spacing.md),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                androidx.compose.material3.Icon(Icons.Filled.Search, contentDescription = "Search", tint = HallyuColors.TextSecondary)
                Spacer(Modifier.width(Spacing.sm))
                Text(
                    "Search dramas, actors, communities…",
                    style = MaterialTheme.typography.bodyMedium,
                    color = HallyuColors.TextTertiary,
                )
            }
        }

        if (state.loading && state.trending.isEmpty()) {
            LoadingState()
        } else {
            LazyColumn(
                contentPadding = PaddingValues(bottom = Spacing.xxl),
            ) {
                if (state.trending.isNotEmpty()) {
                    item { SectionHeader("Trending", modifier = Modifier.padding(horizontal = Spacing.lg)) }
                    items(state.trending) { topic ->
                        TrendingRow(topic.rank, topic.tag, topic.postCount) { navController.navigate(Routes.hashtag(topic.tag)) }
                    }
                }
                if (state.airing.isNotEmpty()) {
                    item { SectionHeader("Currently Airing", modifier = Modifier.padding(horizontal = Spacing.lg)) }
                    item {
                        LazyRow(
                            contentPadding = PaddingValues(horizontal = Spacing.lg),
                            horizontalArrangement = Arrangement.spacedBy(Spacing.md),
                        ) {
                            items(state.airing) { drama ->
                                DramaPosterCard(drama.posterUrl, drama.title, onClick = { navController.navigate(Routes.drama(drama.id)) })
                            }
                        }
                    }
                }
                if (state.upcoming.isNotEmpty()) {
                    item { SectionHeader("Upcoming", modifier = Modifier.padding(horizontal = Spacing.lg)) }
                    item {
                        LazyRow(
                            contentPadding = PaddingValues(horizontal = Spacing.lg),
                            horizontalArrangement = Arrangement.spacedBy(Spacing.md),
                        ) {
                            items(state.upcoming) { drama ->
                                DramaPosterCard(drama.posterUrl, drama.title, onClick = { navController.navigate(Routes.drama(drama.id)) })
                            }
                        }
                    }
                }
                if (state.actors.isNotEmpty()) {
                    item { SectionHeader("Actors", modifier = Modifier.padding(horizontal = Spacing.lg)) }
                    item {
                        LazyRow(
                            contentPadding = PaddingValues(horizontal = Spacing.lg),
                            horizontalArrangement = Arrangement.spacedBy(Spacing.md),
                        ) {
                            items(state.actors) { actor ->
                                CastChip(actor.name, actor.photoUrl, onClick = { navController.navigate(Routes.actor(actor.id)) })
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun TrendingRow(rank: Int, tag: String, count: Int, onClick: () -> Unit) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick)
            .padding(horizontal = Spacing.lg, vertical = Spacing.sm),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Text(
            text = "$rank",
            style = MaterialTheme.typography.titleLarge,
            color = if (rank <= 3) HallyuColors.BrandGradientEnd else HallyuColors.TextTertiary,
            modifier = Modifier.width(32.dp),
        )
        Column(Modifier.weight(1f)) {
            Text("#$tag", style = MaterialTheme.typography.labelLarge, fontWeight = FontWeight.SemiBold)
            Text("$count posts", style = MaterialTheme.typography.labelMedium, color = HallyuColors.TextSecondary)
        }
    }
}

@Composable
fun SearchResultsScreen(navController: NavController, viewModel: SearchViewModel = hiltViewModel()) {
    val state = viewModel.state
    val tabs = listOf("All", "Dramas", "Actors", "People", "Communities", "Posts")
    var tab by androidx.compose.runtime.remember { androidx.compose.runtime.mutableStateOf("All") }

    Column(modifier = Modifier.fillMaxSize().background(HallyuScreenBrush)) {
        HallyuTopBar(title = "Search", onBack = { navController.popBackStack() })
        Column(Modifier.padding(horizontal = Spacing.lg)) {
            HallyuSearchBar(
                query = state.query,
                onQueryChange = { viewModel.search(it) },
                placeholder = "Search…",
            )
            Spacer(Modifier.height(Spacing.sm))
            FilterChips(options = tabs, selected = tab, onSelect = { tab = it })
        }
        Spacer(Modifier.height(Spacing.sm))

        if (state.loading) {
            LoadingState()
        } else if (!state.searched) {
            EmptyState(
                icon = Icons.Filled.Search,
                title = "Find your next obsession",
                message = "Search dramas, actors, users, communities and hashtags.",
            )
        } else {
            val r = state.results
            LazyColumn(contentPadding = PaddingValues(horizontal = Spacing.lg, vertical = Spacing.md), verticalArrangement = Arrangement.spacedBy(Spacing.sm)) {
                when (tab) {
                    "Dramas" -> items(r.dramas) { d -> Row(Modifier.fillMaxWidth().clickable { navController.navigate(Routes.drama(d.id)) }.padding(vertical = Spacing.xs)) { DramaPosterCard(d.posterUrl, d.title, {}, Modifier.width(64.dp)); Spacer(Modifier.width(Spacing.md)); Text(d.title, style = MaterialTheme.typography.labelLarge, modifier = Modifier.padding(top = Spacing.md)) } }
                    "Actors" -> items(r.actors) { a -> Row(Modifier.fillMaxWidth().clickable { navController.navigate(Routes.actor(a.id)) }.padding(vertical = Spacing.xs), verticalAlignment = Alignment.CenterVertically) { HallyuAvatar(a.photoUrl, a.name, 40); Spacer(Modifier.width(Spacing.md)); Text(a.name, style = MaterialTheme.typography.labelLarge) } }
                    "People" -> items(r.users) { u -> Row(Modifier.fillMaxWidth().padding(vertical = Spacing.xs), verticalAlignment = Alignment.CenterVertically) { HallyuAvatar(u.avatarUrl, u.username, 40); Spacer(Modifier.width(Spacing.md)); Column { Text(u.displayName.ifBlank { u.username }, style = MaterialTheme.typography.labelLarge); Text("@${u.username}", style = MaterialTheme.typography.labelMedium, color = HallyuColors.TextSecondary) } } }
                    "Communities" -> items(r.communities) { c -> Row(Modifier.fillMaxWidth().clickable { navController.navigate(Routes.community(c.id)) }.padding(vertical = Spacing.xs), verticalAlignment = Alignment.CenterVertically) { HallyuAvatar(c.avatarUrl, c.name, 40); Spacer(Modifier.width(Spacing.md)); Column { Text(c.name, style = MaterialTheme.typography.labelLarge); Text("${c.memberCount} members", style = MaterialTheme.typography.labelMedium, color = HallyuColors.TextSecondary) } } }
                    "Posts" -> items(r.posts) { p -> PostCard(post = p, watchedThroughEpisode = 0, spoilerMode = "BLUR_BEYOND", onOpen = { navController.navigate(Routes.post(p.id)) }, onAuthorClick = {}, onDramaClick = {}, onLike = {}, onComment = { navController.navigate(Routes.comments(p.id)) }, onRepost = {}, onBookmark = {}, onReveal = {}) }
                    else -> {
                        items(r.dramas) { d -> Row(Modifier.fillMaxWidth().clickable { navController.navigate(Routes.drama(d.id)) }.padding(vertical = Spacing.xs), verticalAlignment = Alignment.CenterVertically) { DramaPosterCard(d.posterUrl, d.title, {}, Modifier.width(64.dp)); Spacer(Modifier.width(Spacing.md)); Text(d.title, style = MaterialTheme.typography.labelLarge) } }
                        items(r.actors) { a -> Row(Modifier.fillMaxWidth().clickable { navController.navigate(Routes.actor(a.id)) }.padding(vertical = Spacing.xs), verticalAlignment = Alignment.CenterVertically) { HallyuAvatar(a.photoUrl, a.name, 40); Spacer(Modifier.width(Spacing.md)); Text(a.name, style = MaterialTheme.typography.labelLarge) } }
                        items(r.communities) { c -> Row(Modifier.fillMaxWidth().clickable { navController.navigate(Routes.community(c.id)) }.padding(vertical = Spacing.xs), verticalAlignment = Alignment.CenterVertically) { HallyuAvatar(c.avatarUrl, c.name, 40); Spacer(Modifier.width(Spacing.md)); Text(c.name, style = MaterialTheme.typography.labelLarge) } }
                        if (r.dramas.isEmpty() && r.actors.isEmpty() && r.users.isEmpty() && r.communities.isEmpty() && r.posts.isEmpty()) {
                            item { EmptyState(Icons.Outlined.Explore, "No results", "No matching dramas, actors, users, or communities found.") }
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun HashtagScreen(tag: String, navController: NavController, viewModel: SearchViewModel = hiltViewModel()) {
    val state = viewModel.state
    LaunchedEffect(tag) { viewModel.loadHashtag(tag) }

    Column(modifier = Modifier.fillMaxSize().background(HallyuScreenBrush)) {
        HallyuTopBar(title = "#$tag", onBack = { navController.popBackStack() })
        if (state.hashtagLoading && state.hashtagPosts.isEmpty()) {
            LoadingState()
        } else if (state.hashtagPosts.isEmpty()) {
            EmptyState(Icons.Outlined.Explore, "Quiet here", "No posts with this hashtag yet.")
        } else {
            LazyColumn(contentPadding = PaddingValues(vertical = Spacing.md), verticalArrangement = Arrangement.spacedBy(Spacing.md)) {
                items(state.hashtagPosts, key = { it.id }) { post ->
                    PostCard(
                        post = post,
                        watchedThroughEpisode = 0,
                        spoilerMode = "BLUR_BEYOND",
                        onOpen = { navController.navigate(Routes.post(post.id)) },
                        onAuthorClick = {},
                        onDramaClick = { post.dramaId?.let { navController.navigate(Routes.drama(it)) } },
                        onLike = {},
                        onComment = { navController.navigate(Routes.comments(post.id)) },
                        onRepost = {},
                        onBookmark = {},
                        onReveal = {},
                        modifier = Modifier.padding(horizontal = Spacing.lg),
                    )
                }
            }
        }
    }
}
