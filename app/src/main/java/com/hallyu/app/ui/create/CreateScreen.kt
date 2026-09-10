package com.hallyu.app.ui.create

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
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Switch
import androidx.compose.material3.SwitchDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.hallyu.designsystem.DramaContextChip
import com.hallyu.designsystem.FilterChips
import com.hallyu.designsystem.HallyuButton
import com.hallyu.designsystem.HallyuColors
import com.hallyu.designsystem.HallyuTopBar
import com.hallyu.designsystem.Spacing
import com.hallyu.domain.model.Categories
import com.hallyu.domain.model.PostCategory

@Composable
fun CreateScreen(onPublished: () -> Unit, viewModel: CreateViewModel = hiltViewModel()) {
    val state = viewModel.state

    LaunchedEffect(state.published) {
        if (state.published) {
            viewModel.dismissPublished()
            onPublished()
        }
    }

    Column(modifier = Modifier.fillMaxSize().background(HallyuColors.Background)) {
        HallyuTopBar(title = "Create")
        Column(
            modifier = Modifier
                .weight(1f)
                .verticalScroll(rememberScrollState())
                .padding(horizontal = Spacing.lg),
        ) {
            OutlinedTextField(
                value = state.text,
                onValueChange = viewModel::setText,
                modifier = Modifier.fillMaxWidth().height(160.dp),
                placeholder = { Text("What's happening in your drama world?", color = HallyuColors.TextTertiary) },
            )

            Spacer(Modifier.height(Spacing.md))
            Text("Category", style = MaterialTheme.typography.labelLarge)
            Spacer(Modifier.height(Spacing.sm))
            FilterChips(
                options = Categories.all.map { Categories.label(it) },
                selected = state.category?.let { Categories.label(PostCategory.valueOf(it)) } ?: "Reaction",
                onSelect = { label ->
                    val cat = Categories.all.firstOrNull { Categories.label(it) == label }
                    viewModel.setCategory(cat?.name)
                },
            )

            Spacer(Modifier.height(Spacing.lg))
            Text("Tag a drama", style = MaterialTheme.typography.labelLarge)
            Spacer(Modifier.height(Spacing.sm))
            if (state.dramas.isNotEmpty()) {
                LazyRow(horizontalArrangement = Arrangement.spacedBy(Spacing.sm)) {
                    items(state.dramas) { drama ->
                        val selected = drama.id == state.dramaId
                        DramaContextChip(
                            dramaTitle = drama.title,
                            episodeNumber = state.episodeNumber.takeIf { it > 0 && selected },
                            onClick = { viewModel.setDrama(if (selected) null else drama.id) },
                            modifier = Modifier,
                        )
                    }
                }
            } else {
                Text("Dramas load once the backend is connected.", style = MaterialTheme.typography.labelMedium, color = HallyuColors.TextTertiary)
            }

            Spacer(Modifier.height(Spacing.lg))
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(12.dp))
                    .background(HallyuColors.Surface)
                    .padding(Spacing.md),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Column(Modifier.weight(1f)) {
                    Text("Mark as spoiler", style = MaterialTheme.typography.labelLarge)
                    Text("Blur this for fans who haven't caught up", style = MaterialTheme.typography.labelMedium, color = HallyuColors.TextSecondary)
                }
                Switch(
                    checked = state.spoilerEnabled,
                    onCheckedChange = viewModel::setSpoiler,
                    colors = SwitchDefaults.colors(checkedTrackColor = HallyuColors.BrandGradientEnd),
                )
            }

            if (state.error != null) {
                Spacer(Modifier.height(Spacing.md))
                Text(state.error ?: "", style = MaterialTheme.typography.bodyMedium, color = HallyuColors.Accent)
            }

            Spacer(Modifier.height(Spacing.lg))
            HallyuButton(text = "Post", enabled = !state.loading, onClick = viewModel::publish)
            Spacer(Modifier.height(Spacing.xxl))
        }
    }
}
