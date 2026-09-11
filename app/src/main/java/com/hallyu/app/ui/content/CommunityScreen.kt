package com.hallyu.app.ui.content
import com.hallyu.designsystem.HallyuScreenBrush

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.Groups
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import androidx.navigation.NavController
import com.hallyu.app.navigation.Routes
import com.hallyu.common.AppResult
import com.hallyu.common.valueOrNull
import com.hallyu.designsystem.EmptyState
import com.hallyu.designsystem.HallyuAvatar
import com.hallyu.designsystem.HallyuButton
import com.hallyu.designsystem.HallyuColors
import com.hallyu.designsystem.HallyuOutlinedButton
import com.hallyu.designsystem.HallyuTopBar
import com.hallyu.designsystem.LoadingState
import com.hallyu.designsystem.PostCard
import com.hallyu.designsystem.Spacing
import com.hallyu.designsystem.brandGradientVertical
import com.hallyu.domain.model.Community
import com.hallyu.domain.model.Post
import com.hallyu.domain.repository.CommunityRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import javax.inject.Inject
import kotlinx.coroutines.launch

data class CommunityState(
    val loading: Boolean = false,
    val community: Community? = null,
    val feed: List<Post> = emptyList(),
)

@HiltViewModel
class CommunityViewModel @Inject constructor(
    private val repository: CommunityRepository,
) : ViewModel() {

    var state by mutableStateOf(CommunityState())
        private set

    private var communityId: String = ""

    fun load(id: String) {
        communityId = id
        viewModelScope.launch {
            state = state.copy(loading = true)
            val community = repository.getCommunity(id).valueOrNull()
            val feed = repository.getCommunityFeed(id, 0, 30).valueOrNull()?.items ?: emptyList()
            state = state.copy(loading = false, community = community, feed = feed)
        }
    }

    fun toggleJoin() {
        val community = state.community ?: return
        val target = !community.isJoined
        state = state.copy(community = community.copy(isJoined = target))
        viewModelScope.launch { repository.joinCommunity(community.id, target) }
    }
}

@Composable
fun CommunityScreen(communityId: String, navController: NavController, viewModel: CommunityViewModel = hiltViewModel()) {
    LaunchedEffect(communityId) { viewModel.load(communityId) }
    val state = viewModel.state

    Column(modifier = Modifier.fillMaxSize().background(HallyuScreenBrush)) {
        HallyuTopBar(title = "", onBack = { navController.popBackStack() })
        when {
            state.loading && state.community == null -> LoadingState()
            state.community == null -> EmptyState(Icons.Outlined.Groups, "Community not found", "This community may be private or removed.")
            else -> {
                val community = state.community!!
                LazyColumn(contentPadding = PaddingValues(bottom = Spacing.xxl)) {
                    item {
                        Box(
                            Modifier.fillMaxWidth().height(160.dp).background(brandGradientVertical),
                            contentAlignment = Alignment.BottomStart,
                        ) {
                            Column(Modifier.padding(Spacing.lg)) {
                                HallyuAvatar(community.avatarUrl, community.name, 56)
                                Spacer(Modifier.height(Spacing.sm))
                                Text(community.name, style = MaterialTheme.typography.headlineMedium)
                                Text("${community.memberCount} members", style = MaterialTheme.typography.labelMedium, color = HallyuColors.TextSecondary)
                            }
                        }
                    }
                    item {
                        Column(Modifier.padding(Spacing.lg)) {
                            if (community.description.isNotBlank()) {
                                Text(community.description, style = MaterialTheme.typography.bodyMedium, color = HallyuColors.TextSecondary)
                                Spacer(Modifier.height(Spacing.lg))
                            }
                            if (community.isJoined) {
                                HallyuOutlinedButton(text = "Joined", onClick = viewModel::toggleJoin)
                            } else {
                                HallyuButton(text = "Join community", onClick = viewModel::toggleJoin)
                            }
                        }
                    }
                    if (state.feed.isEmpty()) {
                        item { EmptyState(Icons.Outlined.Groups, "No posts yet", "Be the first to post in this community.") }
                    } else {
                        items(state.feed, key = { it.id }) { post ->
                            PostCard(
                                post = post, watchedThroughEpisode = 0, spoilerMode = "BLUR_BEYOND",
                                onOpen = { navController.navigate(Routes.post(post.id)) },
                                onAuthorClick = {},
                                onDramaClick = { post.dramaId?.let { navController.navigate(Routes.drama(it)) } },
                                onLike = {}, onComment = { navController.navigate(Routes.comments(post.id)) },
                                onRepost = {}, onBookmark = {}, onReveal = {},
                                modifier = Modifier.padding(horizontal = Spacing.lg, vertical = Spacing.sm),
                            )
                        }
                    }
                }
            }
        }
    }
}
