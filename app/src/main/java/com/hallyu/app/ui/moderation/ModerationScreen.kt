package com.hallyu.app.ui.moderation
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
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.Gavel
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
import com.hallyu.common.AppResult
import com.hallyu.common.valueOrNull
import com.hallyu.designsystem.EmptyState
import com.hallyu.designsystem.HallyuButton
import com.hallyu.designsystem.HallyuColors
import com.hallyu.designsystem.HallyuOutlinedButton
import com.hallyu.designsystem.HallyuTopBar
import com.hallyu.designsystem.LoadingState
import com.hallyu.designsystem.Spacing
import com.hallyu.domain.model.Report
import com.hallyu.domain.repository.ModerationRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import javax.inject.Inject
import kotlinx.coroutines.launch

data class ModerationState(
    val loading: Boolean = false,
    val reports: List<Report> = emptyList(),
)

@HiltViewModel
class ModerationViewModel @Inject constructor(
    private val repository: ModerationRepository,
) : ViewModel() {

    var state by mutableStateOf(ModerationState())
        private set

    init {
        load()
    }

    fun load() {
        viewModelScope.launch {
            state = state.copy(loading = true)
            state = state.copy(loading = false, reports = repository.getOpenReports().valueOrNull() ?: emptyList())
        }
    }

    fun resolve(report: Report, action: String) {
        viewModelScope.launch {
            repository.resolveReport(report.id, action)
            state = state.copy(reports = state.reports.filterNot { it.id == report.id })
        }
    }
}

@Composable
fun ModerationScreen(navController: NavController, viewModel: ModerationViewModel = hiltViewModel()) {
    val state = viewModel.state
    Column(modifier = Modifier.fillMaxSize().background(HallyuScreenBrush)) {
        HallyuTopBar(title = "Moderation", onBack = { navController.popBackStack() })
        when {
            state.loading && state.reports.isEmpty() -> LoadingState()
            state.reports.isEmpty() -> EmptyState(Icons.Outlined.Gavel, "Queue is clear", "No open reports to review.")
            else -> LazyColumn(contentPadding = PaddingValues(vertical = Spacing.sm), verticalArrangement = Arrangement.spacedBy(Spacing.md)) {
                items(state.reports, key = { it.id }) { report ->
                    Column(
                        modifier = Modifier.fillMaxWidth().background(HallyuColors.Surface).padding(Spacing.lg),
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Text(report.reason.name.lowercase(), style = MaterialTheme.typography.labelMedium, color = HallyuColors.Warning, fontWeight = FontWeight.SemiBold)
                            Spacer(Modifier.weight(1f))
                            Text(com.hallyu.designsystem.timeAgo(report.createdAt), style = MaterialTheme.typography.labelMedium, color = HallyuColors.TextTertiary)
                        }
                        Spacer(Modifier.height(Spacing.sm))
                        if (report.preview.isNotBlank()) {
                            Text(report.preview, style = MaterialTheme.typography.bodyMedium, color = HallyuColors.TextSecondary, maxLines = 4)
                        }
                        Spacer(Modifier.height(Spacing.md))
                        Row(horizontalArrangement = Arrangement.spacedBy(Spacing.sm)) {
                            HallyuOutlinedButton(text = "Approve", onClick = { viewModel.resolve(report, "RESOLVED") }, modifier = Modifier.weight(1f))
                            HallyuButton(text = "Remove", onClick = { viewModel.resolve(report, "DISMISSED") }, modifier = Modifier.weight(1f))
                        }
                    }
                }
            }
        }
    }
}
