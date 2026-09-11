package com.hallyu.app.ui.profile

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
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Bookmark
import androidx.compose.material.icons.filled.Groups
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material.icons.outlined.BookmarkBorder
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.NavController
import com.hallyu.app.navigation.Routes
import com.hallyu.designsystem.EmptyState
import com.hallyu.designsystem.HallyuAvatar
import com.hallyu.designsystem.HallyuButton
import com.hallyu.designsystem.HallyuColors
import com.hallyu.designsystem.HallyuTopBar
import com.hallyu.designsystem.LoadingState
import com.hallyu.designsystem.PostCard
import com.hallyu.designsystem.Spacing
import com.hallyu.designsystem.VerifiedBadge
import com.hallyu.domain.model.Post
import com.hallyu.domain.model.Profile

@Composable
fun ProfileScreen(navController: NavController, viewModel: ProfileViewModel = hiltViewModel()) {
    val state = viewModel.state
    Column(modifier = Modifier.fillMaxSize().background(HallyuColors.Background)) {
        HallyuTopBar(title = "Profile")
        if (state.loading && state.profile == null) {
            LoadingState()
        } else {
            val profile = state.profile ?: Profile(username = "you")
            LazyColumn(contentPadding = PaddingValues(bottom = Spacing.xxl)) {
                item {
                    Column(
                        modifier = Modifier.fillMaxWidth().padding(Spacing.lg),
                        horizontalAlignment = Alignment.CenterHorizontally,
                    ) {
                        HallyuAvatar(url = profile.avatarUrl, name = profile.displayName.ifBlank { profile.username }, size = 96)
                        Spacer(Modifier.height(Spacing.md))
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Text(
                                profile.displayName.ifBlank { "@${profile.username}" },
                                style = MaterialTheme.typography.titleLarge,
                                fontWeight = FontWeight.Bold,
                            )
                            if (profile.isVerified) {
                                Spacer(Modifier.width(Spacing.xs))
                                VerifiedBadge()
                            }
                        }
                        if (profile.bio.isNotBlank()) {
                            Text(profile.bio, style = MaterialTheme.typography.bodyMedium, color = HallyuColors.TextSecondary)
                        }
                        Spacer(Modifier.height(Spacing.md))
                        Row {
                            Stat("${profile.followingCount}", "Following") { navController.navigate(Routes.FOLLOWING) }
                            Spacer(Modifier.width(Spacing.xl))
                            Stat("${profile.followerCount}", "Followers") { navController.navigate(Routes.FOLLOWERS) }
                            Spacer(Modifier.width(Spacing.xl))
                            Stat("${profile.postCount}", "Posts") {}
                        }
                        Spacer(Modifier.height(Spacing.lg))
                        ProfileLink(Icons.Filled.Bookmark, "Saved") { navController.navigate(Routes.SAVED) }
                        ProfileLink(Icons.Outlined.BookmarkBorder, "Currently watching") { navController.navigate(Routes.WATCHING) }
                        ProfileLink(Icons.Filled.Groups, "My communities") { navController.navigate(Routes.MY_COMMUNITIES) }
                        ProfileLink(Icons.Filled.Settings, "Settings") { navController.navigate(Routes.SETTINGS) }
                        ProfileLink(Icons.Filled.Warning, "Moderation") { navController.navigate(Routes.MODERATION) }
                        Spacer(Modifier.height(Spacing.lg))
                        HallyuButton(text = "Log out", onClick = {
                            viewModel.logout()
                            navController.navigate(Routes.WELCOME) {
                                popUpTo(0) { inclusive = true }
                            }
                        })
                    }
                }
            }
        }
    }
}

@Composable
private fun Stat(value: String, label: String, onClick: () -> Unit) {
    Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.clickable(onClick = onClick)) {
        Text(value, style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
        Text(label, style = MaterialTheme.typography.labelMedium, color = HallyuColors.TextSecondary)
    }
}

@Composable
private fun ProfileLink(icon: androidx.compose.ui.graphics.vector.ImageVector, label: String, onClick: () -> Unit) {
    Row(
        modifier = Modifier.fillMaxWidth().clickable(onClick = onClick).padding(vertical = Spacing.md),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        androidx.compose.material3.Icon(icon, contentDescription = label, tint = HallyuColors.TextSecondary)
        Spacer(Modifier.width(Spacing.md))
        Text(label, style = MaterialTheme.typography.labelLarge, modifier = Modifier.weight(1f))
        Text("›", color = HallyuColors.TextTertiary)
    }
}

@Composable
fun SavedScreen(navController: NavController, viewModel: ProfileViewModel = hiltViewModel()) {
    LaunchedEffect(Unit) { viewModel.loadSaved() }
    val state = viewModel.state
    Column(modifier = Modifier.fillMaxSize().background(HallyuColors.Background)) {
        HallyuTopBar(title = "Saved", onBack = { navController.popBackStack() })
        if (state.saved.isEmpty()) {
            EmptyState(Icons.Outlined.BookmarkBorder, "Nothing saved yet", "Tap the bookmark icon on any post to keep it here.")
        } else {
            LazyColumn(contentPadding = PaddingValues(vertical = Spacing.md), verticalArrangement = Arrangement.spacedBy(Spacing.md)) {
                items(state.saved, key = { it.id }) { post ->
                    PostCard(
                        post = post, watchedThroughEpisode = 0, spoilerMode = "BLUR_BEYOND",
                        onOpen = { navController.navigate(Routes.post(post.id)) },
                        onAuthorClick = {}, onDramaClick = { post.dramaId?.let { navController.navigate(Routes.drama(it)) } },
                        onLike = {}, onComment = { navController.navigate(Routes.comments(post.id)) },
                        onRepost = {}, onBookmark = {}, onReveal = {},
                        modifier = Modifier.padding(horizontal = Spacing.lg),
                    )
                }
            }
        }
    }
}

@Composable
fun FollowersScreen(navController: NavController, viewModel: ProfileViewModel = hiltViewModel()) {
    LaunchedEffect(Unit) { viewModel.loadFollowers() }
    PeopleList(title = "Followers", navController = navController, people = viewModel.state.followers, onFollow = viewModel::follow, onUnfollow = viewModel::unfollow)
}

@Composable
fun FollowingScreen(navController: NavController, viewModel: ProfileViewModel = hiltViewModel()) {
    LaunchedEffect(Unit) { viewModel.loadFollowing() }
    PeopleList(title = "Following", navController = navController, people = viewModel.state.following, onFollow = viewModel::follow, onUnfollow = viewModel::unfollow)
}

@Composable
private fun PeopleList(
    title: String,
    navController: NavController,
    people: List<Profile>,
    onFollow: (Profile) -> Unit,
    onUnfollow: (Profile) -> Unit,
) {
    Column(modifier = Modifier.fillMaxSize().background(HallyuColors.Background)) {
        HallyuTopBar(title = title, onBack = { navController.popBackStack() })
        if (people.isEmpty()) {
            EmptyState(Icons.Outlined.BookmarkBorder, "No one here yet", "Follow fans to see their posts.")
        } else {
            LazyColumn {
                items(people) { person ->
                    Row(
                        modifier = Modifier.fillMaxWidth().padding(horizontal = Spacing.lg, vertical = Spacing.sm),
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        HallyuAvatar(person.avatarUrl, person.username, 44)
                        Spacer(Modifier.width(Spacing.md))
                        Column(Modifier.weight(1f)) {
                            Text(person.displayName.ifBlank { person.username }, style = MaterialTheme.typography.labelLarge)
                            Text("@${person.username}", style = MaterialTheme.typography.labelMedium, color = HallyuColors.TextSecondary)
                        }
                        Text(
                            text = if (person.isFollowed) "Following" else "Follow",
                            style = MaterialTheme.typography.labelLarge,
                            color = if (person.isFollowed) HallyuColors.TextSecondary else HallyuColors.BrandGradientEnd,
                            modifier = Modifier.clickable { if (person.isFollowed) onUnfollow(person) else onFollow(person) },
                        )
                    }
                }
            }
        }
    }
}
