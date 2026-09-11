package com.hallyu.app.ui.content

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
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
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material.icons.outlined.Movie
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import androidx.navigation.NavController
import coil.compose.AsyncImage
import com.hallyu.app.navigation.Routes
import com.hallyu.common.AppResult
import com.hallyu.common.valueOrNull
import com.hallyu.designsystem.CastChip
import com.hallyu.designsystem.EmptyState
import com.hallyu.designsystem.ErrorState
import com.hallyu.designsystem.HallyuButton
import com.hallyu.designsystem.HallyuColors
import com.hallyu.designsystem.HallyuOutlinedButton
import com.hallyu.designsystem.HallyuTopBar
import com.hallyu.designsystem.LoadingState
import com.hallyu.designsystem.PostCard
import com.hallyu.designsystem.SectionHeader
import com.hallyu.designsystem.Spacing
import com.hallyu.designsystem.brandGradientVertical
import com.hallyu.domain.model.Actor
import com.hallyu.domain.model.Drama
import com.hallyu.domain.model.Episode
import com.hallyu.domain.model.Post
import com.hallyu.domain.model.WatchingStatus
import com.hallyu.domain.repository.DramaRepository
import com.hallyu.domain.usecase.FollowDramaUseCase
import com.hallyu.domain.usecase.UpdateWatchProgressUseCase
import dagger.hilt.android.lifecycle.HiltViewModel
import javax.inject.Inject
import kotlinx.coroutines.launch

data class DramaState(
    val loading: Boolean = false,
    val error: String? = null,
    val drama: Drama? = null,
    val episodes: List<Episode> = emptyList(),
    val cast: List<Actor> = emptyList(),
    val actor: Actor? = null,
    val progress: WatchingStatus? = null,
    val discussion: List<Post> = emptyList(),
)

@HiltViewModel
class DramaViewModel @Inject constructor(
    private val dramas: DramaRepository,
    private val followDrama: FollowDramaUseCase,
    private val updateWatch: UpdateWatchProgressUseCase,
) : ViewModel() {

    var state by mutableStateOf(DramaState())
        private set

    private var dramaId: String = ""

    fun load(id: String) {
        dramaId = id
        viewModelScope.launch {
            state = state.copy(loading = true, error = null)
            val drama = dramas.getDrama(id).valueOrNull()
            val episodes = dramas.getEpisodes(id).valueOrNull() ?: emptyList()
            val cast = dramas.getCast(id).valueOrNull() ?: emptyList()
            val progress = dramas.getMyWatchProgress().valueOrNull()?.firstOrNull { it.dramaId == id }
            state = state.copy(loading = false, drama = drama, episodes = episodes, cast = cast, progress = progress)
        }
    }

    fun toggleFollow() {
        val drama = state.drama ?: return
        val target = !drama.isFollowed
        state = state.copy(drama = drama.copy(isFollowed = target))
        viewModelScope.launch { followDrama(drama.id, target) }
    }

    fun markWatched(episode: Episode) {
        viewModelScope.launch {
            updateWatch(dramaId, episode.number, "WATCHING")
            state = state.copy(
                progress = WatchingStatus(dramaId = dramaId, status = "WATCHING", watchedThroughEpisode = episode.number),
                episodes = state.episodes.map { it.copy(watched = it.number <= episode.number) },
            )
        }
    }

    fun loadDiscussion(number: Int) {
        viewModelScope.launch {
            state = state.copy(discussion = dramas.getEpisodeDiscussion(dramaId, number).valueOrNull() ?: emptyList())
        }
    }

    fun loadActor(id: String) {
        viewModelScope.launch {
            state = state.copy(loading = true, error = null)
            when (val res = dramas.getActor(id)) {
                is AppResult.Success -> state = state.copy(loading = false, actor = res.value)
                is AppResult.Error -> state = state.copy(loading = false, error = res.error.description)
            }
        }
    }

    fun toggleFollowActor() {
        val actor = state.actor ?: return
        val target = !actor.isFollowed
        state = state.copy(actor = actor.copy(isFollowed = target))
        viewModelScope.launch { dramas.followActor(actor.id, target) }
    }
}

// ---------------------------------------------------------------------------

@Composable
fun DramaHubScreen(dramaId: String, navController: NavController, viewModel: DramaViewModel = hiltViewModel()) {
    LaunchedEffect(dramaId) { viewModel.load(dramaId) }
    val state = viewModel.state

    Column(modifier = Modifier.fillMaxSize().background(HallyuColors.Background)) {
        HallyuTopBar(title = "", onBack = { navController.popBackStack() })
        when {
            state.loading && state.drama == null -> LoadingState()
            state.error != null && state.drama == null -> ErrorState(state.error ?: "", onRetry = { viewModel.load(dramaId) })
            state.drama == null -> EmptyState(Icons.Outlined.Movie, "Drama not found", "This drama may not be in the catalog yet.")
            else -> DramaHubContent(state, navController, viewModel)
        }
    }
}

@Composable
private fun DramaHubContent(state: DramaState, navController: NavController, viewModel: DramaViewModel) {
    val drama = state.drama!!
    LazyColumn(contentPadding = PaddingValues(bottom = Spacing.xxl)) {
        item {
            Box(
                Modifier.fillMaxWidth().height(220.dp).background(brandGradientVertical),
                contentAlignment = Alignment.BottomStart,
            ) {
                if (drama.backdropUrl != null || drama.posterUrl != null) {
                    AsyncImage(
                        model = drama.backdropUrl ?: drama.posterUrl,
                        contentDescription = drama.title,
                        contentScale = ContentScale.Crop,
                        modifier = Modifier.fillMaxSize(),
                    )
                }
                Column(Modifier.padding(Spacing.lg)) {
                    Text(drama.title, style = MaterialTheme.typography.headlineMedium)
                    drama.koreanTitle?.takeIf { it.isNotBlank() }?.let { koreanTitle ->
                        Text(koreanTitle, style = MaterialTheme.typography.labelMedium, color = HallyuColors.TextSecondary)
                    }
                    Text(
                        listOfNotNull(drama.status.name.lowercase().replaceFirstChar { it.uppercase() }, drama.airsOn, drama.year.takeIf { it > 0 }?.toString()).joinToString(" · "),
                        style = MaterialTheme.typography.labelMedium,
                        color = HallyuColors.TextSecondary,
                    )
                }
            }
        }
        item {
            Column(Modifier.padding(Spacing.lg)) {
                if (drama.genres.isNotEmpty()) {
                    Row(horizontalArrangement = Arrangement.spacedBy(Spacing.sm)) {
                        drama.genres.forEach { genre ->
                            Text(
                                genre,
                                style = MaterialTheme.typography.labelMedium,
                                color = HallyuColors.OnBackground,
                                modifier = Modifier
                                    .clip(RoundedCornerShape(999.dp))
                                    .background(HallyuColors.BrandGradientStart.copy(alpha = 0.35f))
                                    .padding(horizontal = 10.dp, vertical = 4.dp),
                            )
                        }
                    }
                    Spacer(Modifier.height(Spacing.md))
                }
                if (drama.synopsis.isNotBlank()) {
                    Text(drama.synopsis, style = MaterialTheme.typography.bodyMedium, color = HallyuColors.TextSecondary)
                }
                Spacer(Modifier.height(Spacing.lg))
                if (drama.isFollowed) {
                    HallyuOutlinedButton(text = "Following", onClick = viewModel::toggleFollow)
                } else {
                    HallyuButton(text = "Follow drama", onClick = viewModel::toggleFollow)
                }
                Spacer(Modifier.height(Spacing.sm))
                Text(
                    text = "Watching: ${state.progress?.watchedThroughEpisode ?: 0} / ${drama.episodeCount}",
                    style = MaterialTheme.typography.labelMedium,
                    color = HallyuColors.TextSecondary,
                )
            }
        }
        if (state.cast.isNotEmpty()) {
            item { SectionHeader("Cast", modifier = Modifier.padding(horizontal = Spacing.lg)) }
            item {
                LazyRow(contentPadding = PaddingValues(horizontal = Spacing.lg), horizontalArrangement = Arrangement.spacedBy(Spacing.md)) {
                    items(state.cast) { actor ->
                        CastChip(actor.name, actor.photoUrl, onClick = { navController.navigate(Routes.actor(actor.id)) })
                    }
                }
            }
        }
        item { SectionHeader("Episodes", modifier = Modifier.padding(horizontal = Spacing.lg)) }
        items(state.episodes, key = { it.id }) { episode ->
            EpisodeRow(episode, onOpen = { navController.navigate(Routes.episode(drama.id, episode.number)) })
        }
    }
}

@Composable
private fun EpisodeRow(episode: Episode, onOpen: () -> Unit) {
    Row(
        modifier = Modifier.fillMaxWidth().clickable(onClick = onOpen).padding(horizontal = Spacing.lg, vertical = Spacing.sm),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Box(
            modifier = Modifier.width(64.dp).height(40.dp).clip(RoundedCornerShape(8.dp)).background(HallyuColors.Surface),
            contentAlignment = Alignment.Center,
        ) {
            if (episode.watched) {
                Icon(Icons.Filled.Check, contentDescription = "Watched", tint = HallyuColors.Success)
            } else {
                Icon(Icons.Filled.PlayArrow, contentDescription = "Play", tint = HallyuColors.TextTertiary)
            }
        }
        Spacer(Modifier.width(Spacing.md))
        Column(Modifier.weight(1f)) {
            Text("Episode ${episode.number}", style = MaterialTheme.typography.labelLarge)
            episode.title?.takeIf { it.isNotBlank() }?.let { title ->
                Text(title, style = MaterialTheme.typography.labelMedium, color = HallyuColors.TextSecondary, maxLines = 1, overflow = TextOverflow.Ellipsis)
            }
            if (episode.discussionCount > 0) {
                Text("${episode.discussionCount} discussions", style = MaterialTheme.typography.labelMedium, color = HallyuColors.BrandGradientEnd)
            }
        }
    }
}

// ---------------------------------------------------------------------------

@Composable
fun EpisodePageScreen(dramaId: String, number: Int, navController: NavController, viewModel: DramaViewModel = hiltViewModel()) {
    LaunchedEffect(dramaId) { viewModel.load(dramaId) }
    val state = viewModel.state
    val episode = state.episodes.firstOrNull { it.number == number }

    Column(modifier = Modifier.fillMaxSize().background(HallyuColors.Background)) {
        HallyuTopBar(title = "Episode $number", onBack = { navController.popBackStack() })
        if (episode == null) {
            LoadingState()
        } else {
            Column(Modifier.padding(Spacing.lg)) {
                Text(
                    listOfNotNull(episode.title, episode.airDate?.let { "Airs $it" }).joinToString(" · "),
                    style = MaterialTheme.typography.labelMedium,
                    color = HallyuColors.TextSecondary,
                )
                Spacer(Modifier.height(Spacing.md))
                if (episode.synopsis.isNotBlank()) {
                    Text(episode.synopsis, style = MaterialTheme.typography.bodyLarge)
                }
                Spacer(Modifier.height(Spacing.lg))
                HallyuButton(text = if (episode.watched) "Watched" else "Mark as watched", onClick = { viewModel.markWatched(episode) })
                Spacer(Modifier.height(Spacing.sm))
                HallyuOutlinedButton(text = "Join the discussion", onClick = { navController.navigate(Routes.discussion(dramaId, number)) })
            }
        }
    }
}

@Composable
fun EpisodeDiscussionScreen(dramaId: String, number: Int, navController: NavController, viewModel: DramaViewModel = hiltViewModel()) {
    LaunchedEffect(dramaId, number) {
        viewModel.load(dramaId)
        viewModel.loadDiscussion(number)
    }
    val state = viewModel.state

    Column(modifier = Modifier.fillMaxSize().background(HallyuColors.Background)) {
        HallyuTopBar(title = "Episode $number · Discussion", onBack = { navController.popBackStack() })
        if (state.discussion.isEmpty()) {
            EmptyState(
                Icons.Outlined.Movie,
                "The conversation starts here",
                "No posts yet — be the first to react, theorize or meme.",
            )
        } else {
            LazyColumn(contentPadding = PaddingValues(vertical = Spacing.md), verticalArrangement = Arrangement.spacedBy(Spacing.md)) {
                items(state.discussion, key = { it.id }) { post ->
                    PostCard(
                        post = post,
                        watchedThroughEpisode = number,
                        spoilerMode = "BLUR_BEYOND",
                        onOpen = { navController.navigate(Routes.post(post.id)) },
                        onAuthorClick = {},
                        onDramaClick = { navController.navigate(Routes.drama(dramaId)) },
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

@Composable
fun ActorScreen(actorId: String, navController: NavController, viewModel: DramaViewModel = hiltViewModel()) {
    LaunchedEffect(actorId) { viewModel.loadActor(actorId) }
    val state = viewModel.state
    Column(modifier = Modifier.fillMaxSize().background(HallyuColors.Background)) {
        HallyuTopBar(title = "", onBack = { navController.popBackStack() })
        when {
            state.loading && state.actor == null -> LoadingState()
            state.actor == null -> EmptyState(Icons.Outlined.Movie, "Actor not found", "We couldn't find this actor.")
            else -> {
                val actor = state.actor!!
                Column(Modifier.padding(Spacing.lg)) {
                    Box(
                        Modifier.fillMaxWidth().height(200.dp).clip(RoundedCornerShape(12.dp)).background(brandGradientVertical),
                        contentAlignment = Alignment.BottomStart,
                    ) {
                        val photoUrl = actor.photoUrl
                        if (photoUrl != null) {
                            AsyncImage(model = photoUrl, contentDescription = actor.name, contentScale = ContentScale.Crop, modifier = Modifier.fillMaxSize())
                        }
                        Column(Modifier.padding(Spacing.lg)) {
                            Text(actor.name, style = MaterialTheme.typography.headlineMedium)
                            actor.koreanName?.takeIf { it.isNotBlank() }?.let { koreanName ->
                                Text(koreanName, style = MaterialTheme.typography.labelMedium, color = HallyuColors.TextSecondary)
                            }
                        }
                    }
                    Spacer(Modifier.height(Spacing.lg))
                    if (actor.bio.isNotBlank()) {
                        Text(actor.bio, style = MaterialTheme.typography.bodyMedium, color = HallyuColors.TextSecondary)
                        Spacer(Modifier.height(Spacing.lg))
                    }
                    HallyuButton(text = if (actor.isFollowed) "Following" else "Follow", onClick = viewModel::toggleFollowActor)
                }
            }
        }
    }
}
