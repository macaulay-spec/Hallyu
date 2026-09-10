package com.hallyu.app.ui.feed

import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.hallyu.common.AppResult
import com.hallyu.common.valueOrNull
import com.hallyu.domain.model.Drama
import com.hallyu.domain.model.FeedKind
import com.hallyu.domain.model.Post
import com.hallyu.domain.repository.DramaRepository
import com.hallyu.domain.repository.PostRepository
import com.hallyu.domain.repository.SettingsRepository
import com.hallyu.domain.usecase.GetHomeFeedUseCase
import com.hallyu.domain.usecase.ToggleReactionUseCase
import dagger.hilt.android.lifecycle.HiltViewModel
import javax.inject.Inject
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch

data class FeedState(
    val loading: Boolean = false,
    val error: String? = null,
    val kind: FeedKind = FeedKind.FOR_YOU,
    val posts: List<Post> = emptyList(),
    val airing: List<Drama> = emptyList(),
    val watchProgress: Map<String, Int> = emptyMap(),
    val spoilerMode: String = "BLUR_BEYOND",
    val revealed: Set<String> = emptySet(),
)

@HiltViewModel
class FeedViewModel @Inject constructor(
    private val getFeed: GetHomeFeedUseCase,
    private val posts: PostRepository,
    private val dramas: DramaRepository,
    private val settings: SettingsRepository,
) : ViewModel() {

    var state by mutableStateOf(FeedState())
        private set

    init {
        load()
    }

    fun load(kind: FeedKind = state.kind) {
        viewModelScope.launch {
            state = state.copy(loading = true, error = null, kind = kind)
            val progress = (dramas.getMyWatchProgress().valueOrNull() ?: emptyList())
                .associate { it.dramaId to it.watchedThroughEpisode }
            val mode = settings.spoilerMode.first()
            val airing = dramas.getAiring().valueOrNull() ?: emptyList()
            when (val res = getFeed(kind, 0, 20)) {
                is AppResult.Success -> state = state.copy(
                    loading = false,
                    posts = res.value.items,
                    watchProgress = progress,
                    spoilerMode = mode,
                    airing = airing,
                )
                is AppResult.Error -> state = state.copy(loading = false, error = res.error.description)
            }
        }
    }

    fun toggleLike(post: Post) {
        val target = !post.isLiked
        state = state.copy(posts = state.posts.map { if (it.id == post.id) it.copy(isLiked = target, likeCount = (it.likeCount + if (target) 1 else -1).coerceAtLeast(0)) else it })
        viewModelScope.launch { posts.toggleLike(post.id, target) }
    }

    fun toggleBookmark(post: Post) {
        val target = !post.isBookmarked
        state = state.copy(posts = state.posts.map { if (it.id == post.id) it.copy(isBookmarked = target) else it })
        viewModelScope.launch { posts.toggleBookmark(post.id, target) }
    }

    fun toggleRepost(post: Post) {
        val target = !post.isReposted
        state = state.copy(posts = state.posts.map { if (it.id == post.id) it.copy(isReposted = target, repostCount = it.repostCount + if (target) 1 else -1) else it })
        viewModelScope.launch { posts.toggleRepost(post.id) }
    }

    fun reveal(postId: String) {
        state = state.copy(revealed = state.revealed + postId)
    }

    fun watchedThrough(dramaId: String?): Int = dramaId?.let { state.watchProgress[it] } ?: 0

    fun isRevealed(postId: String): Boolean = postId in state.revealed
}
