package com.hallyu.app.ui.watching

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
import androidx.compose.material.icons.outlined.LiveTv
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import androidx.navigation.NavController
import coil.compose.AsyncImage
import com.hallyu.app.navigation.Routes
import com.hallyu.common.AppResult
import com.hallyu.common.valueOrNull
import com.hallyu.designsystem.EmptyState
import com.hallyu.designsystem.HallyuColors
import com.hallyu.designsystem.HallyuTopBar
import com.hallyu.designsystem.LoadingState
import com.hallyu.designsystem.Spacing
import com.hallyu.domain.model.Drama
import com.hallyu.domain.repository.DramaRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import javax.inject.Inject
import kotlinx.coroutines.launch

data class WatchingState(
    val loading: Boolean = false,
    val dramas: List<Drama> = emptyList(),
    val progress: Map<String, Int> = emptyMap(),
)

@HiltViewModel
class WatchingViewModel @Inject constructor(
    private val repository: DramaRepository,
) : ViewModel() {

    var state by mutableStateOf(WatchingState())
        private set

    init {
        load()
    }

    fun load() {
        viewModelScope.launch {
            state = state.copy(loading = true)
            val dramas = repository.getCurrentlyWatching().valueOrNull() ?: emptyList()
            val progress = (repository.getMyWatchProgress().valueOrNull() ?: emptyList())
                .associate { it.dramaId to it.watchedThroughEpisode }
            state = state.copy(loading = false, dramas = dramas, progress = progress)
        }
    }
}

@Composable
fun WatchingScreen(navController: NavController, viewModel: WatchingViewModel = hiltViewModel()) {
    val state = viewModel.state
    Column(modifier = Modifier.fillMaxSize().background(HallyuColors.Background)) {
        HallyuTopBar(title = "Currently Watching", onBack = { navController.popBackStack() })
        when {
            state.loading && state.dramas.isEmpty() -> LoadingState()
            state.dramas.isEmpty() -> EmptyState(Icons.Outlined.LiveTv, "Nothing on your list", "Follow a drama to start tracking your watch progress.")
            else -> LazyColumn(contentPadding = PaddingValues(vertical = Spacing.sm), verticalArrangement = Arrangement.spacedBy(Spacing.sm)) {
                items(state.dramas, key = { it.id }) { drama ->
                    val watched = state.progress[drama.id] ?: 0
                    Row(
                        modifier = Modifier.fillMaxWidth().clickable { navController.navigate(Routes.drama(drama.id)) }.padding(horizontal = Spacing.lg),
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        Box(
                            Modifier.width(48.dp).height(68.dp).background(HallyuColors.Surface),
                            contentAlignment = Alignment.Center,
                        ) {
                            if (drama.posterUrl != null) {
                                AsyncImage(model = drama.posterUrl, contentDescription = drama.title, contentScale = androidx.compose.ui.layout.ContentScale.Crop, modifier = Modifier.width(48.dp).height(68.dp))
                            }
                        }
                        Spacer(Modifier.width(Spacing.md))
                        Column(Modifier.weight(1f)) {
                            Text(drama.title, style = MaterialTheme.typography.labelLarge, fontWeight = FontWeight.SemiBold)
                            Text(
                                "Episode $watched of ${drama.episodeCount}",
                                style = MaterialTheme.typography.labelMedium,
                                color = HallyuColors.TextSecondary,
                            )
                        }
                    }
                }
            }
        }
    }
}
