package com.hallyu.app.ui.content
import com.hallyu.designsystem.HallyuScreenBrush

import androidx.compose.foundation.background
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
import androidx.compose.material.icons.filled.Favorite
import androidx.compose.material.icons.filled.Send
import androidx.compose.material.icons.outlined.ChatBubbleOutline
import androidx.compose.material.icons.outlined.FavoriteBorder
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import androidx.navigation.NavController
import com.hallyu.common.AppResult
import com.hallyu.common.valueOrNull
import com.hallyu.designsystem.EmptyState
import com.hallyu.designsystem.ErrorState
import com.hallyu.designsystem.HallyuAvatar
import com.hallyu.designsystem.HallyuColors
import com.hallyu.designsystem.HallyuTopBar
import com.hallyu.designsystem.LoadingState
import com.hallyu.designsystem.PostCard
import com.hallyu.designsystem.Spacing
import com.hallyu.designsystem.timeAgo
import com.hallyu.domain.model.Comment
import com.hallyu.domain.model.Post
import com.hallyu.domain.repository.PostRepository
import com.hallyu.domain.usecase.GetPostUseCase
import dagger.hilt.android.lifecycle.HiltViewModel
import javax.inject.Inject
import kotlinx.coroutines.launch

data class PostState(
    val loading: Boolean = false,
    val error: String? = null,
    val post: Post? = null,
    val comments: List<Comment> = emptyList(),
)

@HiltViewModel
class PostViewModel @Inject constructor(
    private val getPost: GetPostUseCase,
    private val posts: PostRepository,
) : ViewModel() {

    var state by mutableStateOf(PostState())
        private set

    private var postId: String = ""

    fun load(id: String) {
        postId = id
        viewModelScope.launch {
            state = state.copy(loading = true, error = null)
            when (val res = getPost(id)) {
                is AppResult.Success -> state = state.copy(loading = false, post = res.value)
                is AppResult.Error -> state = state.copy(loading = false, error = res.error.description)
            }
            state = state.copy(comments = posts.getComments(id).valueOrNull() ?: emptyList())
        }
    }

    fun toggleLike() {
        val post = state.post ?: return
        val target = !post.isLiked
        state = state.copy(post = post.copy(isLiked = target, likeCount = (post.likeCount + if (target) 1 else -1).coerceAtLeast(0)))
        viewModelScope.launch { posts.toggleLike(post.id, target) }
    }

    fun addComment(text: String) {
        if (text.isBlank()) return
        viewModelScope.launch {
            posts.addComment(postId, text)
            state = state.copy(comments = posts.getComments(postId).valueOrNull() ?: state.comments)
        }
    }

    fun toggleCommentLike(comment: Comment) {
        val target = !comment.isLiked
        state = state.copy(comments = state.comments.map { if (it.id == comment.id) it.copy(isLiked = target, likeCount = it.likeCount + if (target) 1 else -1) else it })
        viewModelScope.launch { posts.toggleCommentLike(comment.id, target) }
    }
}

@Composable
fun PostDetailScreen(postId: String, navController: NavController, viewModel: PostViewModel = hiltViewModel()) {
    LaunchedEffect(postId) { viewModel.load(postId) }
    val state = viewModel.state

    Column(modifier = Modifier.fillMaxSize().background(HallyuScreenBrush)) {
        HallyuTopBar(title = "Post", onBack = { navController.popBackStack() })
        when {
            state.loading && state.post == null -> LoadingState()
            state.error != null && state.post == null -> ErrorState(state.error ?: "", onRetry = { viewModel.load(postId) })
            state.post == null -> EmptyState(Icons.Outlined.ChatBubbleOutline, "Post not found", "This post may have been removed.")
            else -> {
                val post = state.post!!
                Column(modifier = Modifier.fillMaxSize()) {
                    PostCard(
                        post = post,
                        watchedThroughEpisode = 0,
                        spoilerMode = "BLUR_BEYOND",
                        onOpen = {},
                        onAuthorClick = {},
                        onDramaClick = { post.dramaId?.let { navController.navigate(com.hallyu.app.navigation.Routes.drama(it)) } },
                        onLike = viewModel::toggleLike,
                        onComment = { navController.navigate(com.hallyu.app.navigation.Routes.comments(post.id)) },
                        onRepost = {},
                        onBookmark = {},
                        onReveal = {},
                        modifier = Modifier.padding(horizontal = Spacing.lg, vertical = Spacing.sm),
                    )
                    Text(
                        text = "${state.comments.size} comments",
                        style = MaterialTheme.typography.labelLarge,
                        color = HallyuColors.TextSecondary,
                        modifier = Modifier.padding(horizontal = Spacing.lg, vertical = Spacing.sm),
                    )
                    CommentList(state.comments, onLike = viewModel::toggleCommentLike, modifier = Modifier.weight(1f))
                }
            }
        }
    }
}

@Composable
fun CommentsScreen(postId: String, navController: NavController, viewModel: PostViewModel = hiltViewModel()) {
    LaunchedEffect(postId) { viewModel.load(postId) }
    val state = viewModel.state
    var draft by remember { mutableStateOf("") }

    Column(modifier = Modifier.fillMaxSize().background(HallyuScreenBrush)) {
        HallyuTopBar(title = "Comments", onBack = { navController.popBackStack() })
        CommentList(state.comments, onLike = viewModel::toggleCommentLike, modifier = Modifier.weight(1f))
        Row(
            modifier = Modifier.fillMaxWidth().background(HallyuColors.Surface).padding(Spacing.md),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            OutlinedTextField(
                value = draft,
                onValueChange = { draft = it },
                modifier = Modifier.weight(1f),
                placeholder = { Text("Add a comment…", color = HallyuColors.TextTertiary) },
                maxLines = 4,
            )
            Spacer(Modifier.width(Spacing.sm))
            IconButton(onClick = {
                viewModel.addComment(draft)
                draft = ""
            }) {
                Icon(Icons.Filled.Send, contentDescription = "Send", tint = HallyuColors.BrandGradientEnd)
            }
        }
    }
}

@Composable
private fun CommentList(comments: List<Comment>, onLike: (Comment) -> Unit, modifier: Modifier = Modifier) {
    if (comments.isEmpty()) {
        EmptyState(Icons.Outlined.ChatBubbleOutline, "No comments yet", "Be the first to react.", modifier = modifier)
        return
    }
    LazyColumn(modifier = modifier, contentPadding = PaddingValues(horizontal = Spacing.lg, vertical = Spacing.sm), verticalArrangement = Arrangement.spacedBy(Spacing.md)) {
        items(comments, key = { it.id }) { comment ->
            Row(verticalAlignment = Alignment.Top) {
                HallyuAvatar(comment.author?.avatarUrl, comment.author?.username ?: "?", 36)
                Spacer(Modifier.width(Spacing.sm))
                Column(Modifier.weight(1f)) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text(comment.author?.displayName ?: comment.author?.username ?: "unknown", style = MaterialTheme.typography.labelLarge, fontWeight = FontWeight.SemiBold)
                        Spacer(Modifier.width(Spacing.sm))
                        Text(timeAgo(comment.createdAt), style = MaterialTheme.typography.labelMedium, color = HallyuColors.TextTertiary)
                    }
                    Text(comment.text, style = MaterialTheme.typography.bodyMedium)
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        IconButton(onClick = { onLike(comment) }, modifier = Modifier.height(28.dp).width(28.dp)) {
                            Icon(
                                if (comment.isLiked) Icons.Filled.Favorite else Icons.Outlined.FavoriteBorder,
                                contentDescription = "Like",
                                tint = if (comment.isLiked) HallyuColors.Accent else HallyuColors.TextSecondary,
                                modifier = Modifier.width(16.dp),
                            )
                        }
                        Text("${comment.likeCount}", style = MaterialTheme.typography.labelMedium, color = HallyuColors.TextSecondary)
                    }
                }
            }
        }
    }
}
