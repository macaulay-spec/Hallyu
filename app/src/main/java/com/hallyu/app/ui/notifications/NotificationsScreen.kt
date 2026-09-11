package com.hallyu.app.ui.notifications
import com.hallyu.designsystem.HallyuScreenBrush

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
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.LiveTv
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.outlined.ChatBubbleOutline
import androidx.compose.material.icons.outlined.Groups
import androidx.compose.material.icons.outlined.Notifications
import androidx.compose.material.icons.outlined.Star
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import androidx.navigation.NavController
import com.hallyu.app.navigation.Routes
import com.hallyu.common.AppResult
import com.hallyu.common.valueOrNull
import com.hallyu.designsystem.EmptyState
import com.hallyu.designsystem.ErrorState
import com.hallyu.designsystem.HallyuAvatar
import com.hallyu.designsystem.HallyuColors
import com.hallyu.designsystem.HallyuTopBar
import com.hallyu.designsystem.LoadingState
import com.hallyu.designsystem.Spacing
import com.hallyu.designsystem.brandGradient
import com.hallyu.domain.model.AppNotification
import com.hallyu.domain.model.NotificationType
import com.hallyu.domain.repository.NotificationRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import javax.inject.Inject
import kotlinx.coroutines.launch

@HiltViewModel
class NotificationsViewModel @Inject constructor(
    private val repository: NotificationRepository,
) : ViewModel() {

    var state by mutableStateOf(NotificationsState())
        private set

    init {
        load()
    }

    fun load() {
        viewModelScope.launch {
            state = state.copy(loading = true, error = null)
            when (val res = repository.getNotifications()) {
                is AppResult.Success -> state = state.copy(loading = false, items = res.value)
                is AppResult.Error -> state = state.copy(loading = false, error = res.error.description)
            }
        }
    }

    fun open(item: AppNotification, navController: NavController) {
        viewModelScope.launch { repository.markRead(item.id) }
        state = state.copy(items = state.items.map { if (it.id == item.id) it.copy(read = true) else it })
        val postId = item.postId
        val dramaId = item.dramaId
        val episodeNumber = item.episodeNumber
        when {
            postId != null -> navController.navigate(Routes.post(postId))
            dramaId != null && episodeNumber != null -> navController.navigate(Routes.discussion(dramaId, episodeNumber))
            dramaId != null -> navController.navigate(Routes.drama(dramaId))
        }
    }
}

data class NotificationsState(
    val loading: Boolean = false,
    val error: String? = null,
    val items: List<AppNotification> = emptyList(),
)

@Composable
fun NotificationsScreen(navController: NavController, viewModel: NotificationsViewModel = hiltViewModel()) {
    val state = viewModel.state
    Column(modifier = Modifier.fillMaxSize().background(HallyuScreenBrush)) {
        HallyuTopBar(title = "Notifications")
        when {
            state.loading && state.items.isEmpty() -> LoadingState()
            state.error != null && state.items.isEmpty() -> ErrorState(state.error ?: "", onRetry = viewModel::load)
            state.items.isEmpty() -> EmptyState(Icons.Outlined.Notifications, "You're caught up", "New episode releases, replies and mentions will show up here.")
            else -> LazyColumn(
                contentPadding = PaddingValues(vertical = Spacing.sm),
                verticalArrangement = Arrangement.spacedBy(Spacing.xs),
            ) {
                items(state.items, key = { it.id }) { item ->
                    NotificationRow(item) { viewModel.open(item, navController) }
                }
            }
        }
    }
}

@Composable
private fun NotificationRow(item: AppNotification, onClick: () -> Unit) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick)
            .background(if (item.read) HallyuColors.Background else HallyuColors.Surface)
            .padding(horizontal = Spacing.lg, vertical = Spacing.md),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Box(
            modifier = Modifier.size(44.dp).clip(CircleShape).background(brandGradient),
            contentAlignment = Alignment.Center,
        ) {
            Icon(iconFor(item.type), contentDescription = null, tint = HallyuColors.OnBackground, modifier = Modifier.size(20.dp))
        }
        Spacer(Modifier.width(Spacing.md))
        Column(Modifier.weight(1f)) {
            Text(item.title, style = MaterialTheme.typography.labelLarge, fontWeight = androidx.compose.ui.text.font.FontWeight.SemiBold)
            Text(item.body, style = MaterialTheme.typography.bodyMedium, color = HallyuColors.TextSecondary, maxLines = 2)
            Text(com.hallyu.designsystem.timeAgo(item.createdAt), style = MaterialTheme.typography.labelMedium, color = HallyuColors.TextTertiary)
        }
        val actor = item.actor
        if (actor != null) {
            Spacer(Modifier.width(Spacing.sm))
            HallyuAvatar(actor.avatarUrl, actor.username, 36)
        }
    }
}

private fun iconFor(type: NotificationType): ImageVector = when (type) {
    NotificationType.EPISODE_RELEASE -> Icons.Filled.LiveTv
    NotificationType.REPLY -> Icons.Outlined.ChatBubbleOutline
    NotificationType.MENTION -> Icons.Filled.Person
    NotificationType.COMMUNITY_ANNOUNCEMENT -> Icons.Outlined.Groups
    NotificationType.ACTOR_UPDATE, NotificationType.OFFICIAL_ANNOUNCEMENT -> Icons.Outlined.Star
    NotificationType.TRENDING_POST, NotificationType.SYSTEM -> Icons.Outlined.Notifications
}
