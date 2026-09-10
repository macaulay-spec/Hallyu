package com.hallyu.app.ui.profile

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Switch
import androidx.compose.material3.SwitchDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import androidx.navigation.NavController
import com.hallyu.designsystem.FilterChips
import com.hallyu.designsystem.HallyuColors
import com.hallyu.designsystem.HallyuTopBar
import com.hallyu.designsystem.Spacing
import com.hallyu.domain.repository.SettingsRepository
import com.hallyu.domain.usecase.SpoilerMode
import dagger.hilt.android.lifecycle.HiltViewModel
import javax.inject.Inject
import kotlinx.coroutines.launch

@HiltViewModel
class SettingsViewModel @Inject constructor(
    private val settings: SettingsRepository,
) : ViewModel() {

    fun setSpoilerMode(mode: String) = viewModelScope.launch { settings.setSpoilerMode(mode) }
    fun setQuietHours(enabled: Boolean) = viewModelScope.launch { settings.setQuietHours(enabled) }
}

@Composable
fun SettingsScreen(navController: NavController, viewModel: SettingsViewModel = hiltViewModel()) {
    Column(modifier = Modifier.fillMaxSize().background(HallyuColors.Background)) {
        HallyuTopBar(title = "Settings", onBack = { navController.popBackStack() })
        Column(modifier = Modifier.verticalScroll(rememberScrollState()).padding(horizontal = Spacing.lg)) {
            SectionTitle("Spoilers")
            Spacer(Modifier.height(Spacing.sm))
            FilterChips(
                options = listOf("Blur beyond", "Hide beyond", "Show all"),
                selected = "Blur beyond",
                onSelect = { label ->
                    val mode = when (label) {
                        "Hide beyond" -> SpoilerMode.HIDE_BEYOND.key
                        "Show all" -> SpoilerMode.SHOW_ALL.key
                        else -> SpoilerMode.BLUR_BEYOND.key
                    }
                    viewModel.setSpoilerMode(mode)
                },
            )
            Text(
                "Posts about episodes you haven't watched yet are blurred or hidden by default.",
                style = MaterialTheme.typography.labelMedium,
                color = HallyuColors.TextSecondary,
            )
            Spacer(Modifier.height(Spacing.lg))

            SectionTitle("Notifications")
            QuietHoursRow(enabled = false, onToggle = viewModel::setQuietHours)

            Spacer(Modifier.height(Spacing.lg))
            SectionTitle("Appearance")
            Row(Modifier.fillMaxWidth().padding(vertical = Spacing.sm), verticalAlignment = Alignment.CenterVertically) {
                Text("Theme", style = MaterialTheme.typography.labelLarge, modifier = Modifier.weight(1f))
                Text("Dark", style = MaterialTheme.typography.labelMedium, color = HallyuColors.TextSecondary)
            }
        }
    }
}

@Composable
private fun SectionTitle(title: String) {
    Text(
        title,
        style = MaterialTheme.typography.titleLarge,
        modifier = Modifier.padding(top = Spacing.lg, bottom = Spacing.xs),
    )
}

@Composable
private fun QuietHoursRow(enabled: Boolean, onToggle: (Boolean) -> Unit) {
    Row(Modifier.fillMaxWidth().padding(vertical = Spacing.sm), verticalAlignment = Alignment.CenterVertically) {
        Column(Modifier.weight(1f)) {
            Text("Quiet hours", style = MaterialTheme.typography.labelLarge)
            Text("Pause push notifications overnight", style = MaterialTheme.typography.labelMedium, color = HallyuColors.TextSecondary)
        }
        Switch(checked = enabled, onCheckedChange = onToggle, colors = SwitchDefaults.colors(checkedTrackColor = HallyuColors.BrandGradientEnd))
    }
}
