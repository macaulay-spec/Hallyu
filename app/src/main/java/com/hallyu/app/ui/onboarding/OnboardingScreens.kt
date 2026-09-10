package com.hallyu.app.ui.onboarding

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.NavController
import com.hallyu.app.navigation.Routes
import com.hallyu.designsystem.CastChip
import com.hallyu.designsystem.DramaPosterCard
import com.hallyu.designsystem.HallyuAvatar
import com.hallyu.designsystem.HallyuButton
import com.hallyu.designsystem.HallyuColors
import com.hallyu.designsystem.HallyuTopBar
import com.hallyu.designsystem.LoadingState
import com.hallyu.designsystem.Spacing
import com.hallyu.designsystem.brandGradient

val kDramaGenres = listOf(
    "Romance", "Thriller", "Historical", "Comedy", "Fantasy", "Melodrama", "Mystery", "Slice of life",
)

@Composable
fun OnboardingInterestsScreen(navController: NavController, viewModel: OnboardingViewModel = hiltViewModel()) {
    OnboardingScaffold(
        title = "Pick your interests",
        subtitle = "Choose genres you love — we'll tune your feed.",
        step = 1,
        onBack = { navController.popBackStack() },
    ) {
        Column {
            kDramaGenres.chunked(2).forEach { row ->
                Row(horizontalArrangement = Arrangement.spacedBy(Spacing.sm)) {
                    row.forEach { genre ->
                        val selected = genre in viewModel.state.selectedInterests
                        Box(
                            modifier = Modifier
                                .weight(1f)
                                .height(72.dp)
                                .clip(androidx.compose.foundation.shape.RoundedCornerShape(12.dp))
                                .background(if (selected) HallyuColors.BrandGradientStart.copy(alpha = 0.45f) else HallyuColors.Surface)
                                .clickable { viewModel.toggleInterest(genre) },
                            contentAlignment = Alignment.Center,
                        ) {
                            Text(
                                text = genre,
                                style = MaterialTheme.typography.labelLarge,
                                color = if (selected) HallyuColors.OnBackground else HallyuColors.TextSecondary,
                            )
                        }
                    }
                    if (row.size == 1) Spacer(Modifier.weight(1f))
                }
                Spacer(Modifier.height(Spacing.sm))
            }
            Spacer(Modifier.height(Spacing.lg))
            HallyuButton("Continue") { navController.navigate(Routes.ONBOARDING_DRAMAS) }
            Text(
                text = "Skip for now",
                style = MaterialTheme.typography.labelMedium,
                color = HallyuColors.TextSecondary,
                modifier = Modifier.fillMaxWidth().clickable { navController.navigate(Routes.ONBOARDING_DRAMAS) }.padding(Spacing.md),
                textAlign = TextAlign.Center,
            )
        }
    }
}

@Composable
fun OnboardingDramasScreen(navController: NavController, viewModel: OnboardingViewModel = hiltViewModel()) {
    OnboardingScaffold(
        title = "Follow your favorite dramas",
        subtitle = "We'll notify you when new episodes drop.",
        step = 2,
        onBack = { navController.popBackStack() },
    ) {
        Column {
            if (viewModel.state.loading && viewModel.state.dramas.isEmpty()) {
                LoadingState()
            } else {
                LazyVerticalGrid(
                    columns = GridCells.Fixed(2),
                    verticalArrangement = Arrangement.spacedBy(Spacing.md),
                    horizontalArrangement = Arrangement.spacedBy(Spacing.md),
                    modifier = Modifier.weight(1f),
                ) {
                    items(viewModel.state.dramas) { drama ->
                        DramaPosterCard(
                            posterUrl = drama.posterUrl,
                            title = drama.title,
                            onClick = { viewModel.toggleDrama(drama.id) },
                            follow = true,
                            followed = drama.id in viewModel.state.selectedDramas,
                            onFollow = { viewModel.toggleDrama(drama.id) },
                            modifier = Modifier.fillMaxWidth(),
                        )
                    }
                }
            }
            Spacer(Modifier.height(Spacing.lg))
            HallyuButton("Continue") { navController.navigate(Routes.ONBOARDING_ACTORS) }
        }
    }
}

@Composable
fun OnboardingActorsScreen(navController: NavController, viewModel: OnboardingViewModel = hiltViewModel()) {
    OnboardingScaffold(
        title = "Follow your favorite actors",
        subtitle = "See their dramas and updates first.",
        step = 3,
        onBack = { navController.popBackStack() },
    ) {
        Column {
            if (viewModel.state.loading && viewModel.state.actors.isEmpty()) {
                LoadingState()
            } else {
                LazyVerticalGrid(
                    columns = GridCells.Fixed(3),
                    verticalArrangement = Arrangement.spacedBy(Spacing.md),
                    horizontalArrangement = Arrangement.spacedBy(Spacing.sm),
                    modifier = Modifier.weight(1f),
                ) {
                    items(viewModel.state.actors) { actor ->
                        val selected = actor.id in viewModel.state.selectedActors
                        Box(
                            modifier = Modifier
                                .clip(CircleShape)
                                .clickable { viewModel.toggleActor(actor.id) }
                                .padding(2.dp),
                        ) {
                            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                Box(
                                    modifier = Modifier
                                        .size(72.dp)
                                        .clip(CircleShape)
                                        .background(if (selected) HallyuColors.BrandGradientEnd else HallyuColors.Surface)
                                        .padding(2.dp),
                                ) {
                                    HallyuAvatar(url = actor.photoUrl, name = actor.name, size = 68)
                                }
                                Spacer(Modifier.height(4.dp))
                                Text(actor.name, style = MaterialTheme.typography.labelMedium, maxLines = 1)
                            }
                        }
                    }
                }
            }
            Spacer(Modifier.height(Spacing.lg))
            HallyuButton("Continue") { navController.navigate(Routes.ONBOARDING_COMMUNITIES) }
        }
    }
}

@Composable
fun OnboardingCommunitiesScreen(navController: NavController, viewModel: OnboardingViewModel = hiltViewModel()) {
    OnboardingScaffold(
        title = "Join communities",
        subtitle = "Find your fandom's corner.",
        step = 4,
        onBack = { navController.popBackStack() },
    ) {
        Column {
            LazyColumn(
                verticalArrangement = Arrangement.spacedBy(Spacing.sm),
                modifier = Modifier.weight(1f),
            ) {
                items(viewModel.state.communities) { community ->
                    val joined = community.id in viewModel.state.selectedCommunities
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(androidx.compose.foundation.shape.RoundedCornerShape(12.dp))
                            .background(HallyuColors.Surface)
                            .padding(Spacing.md),
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        HallyuAvatar(url = community.avatarUrl, name = community.name, size = 44)
                        Spacer(Modifier.size(Spacing.md))
                        Column(Modifier.weight(1f)) {
                            Text(community.name, style = MaterialTheme.typography.labelLarge, fontWeight = FontWeight.SemiBold)
                            Text(
                                "${community.memberCount} members",
                                style = MaterialTheme.typography.labelMedium,
                                color = HallyuColors.TextSecondary,
                            )
                        }
                        Text(
                            text = if (joined) "Joined" else "Join",
                            style = MaterialTheme.typography.labelLarge,
                            color = if (joined) HallyuColors.Success else HallyuColors.BrandGradientEnd,
                            modifier = Modifier.clickable { viewModel.toggleCommunity(community.id) },
                        )
                    }
                }
            }
            Spacer(Modifier.height(Spacing.lg))
            HallyuButton("Continue") { navController.navigate(Routes.ONBOARDING_COMPLETE) }
        }
    }
}

@Composable
fun OnboardingCompleteScreen(navController: NavController, viewModel: OnboardingViewModel = hiltViewModel()) {
    Column(
        modifier = Modifier.fillMaxSize().background(HallyuColors.Background).padding(Spacing.xl),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center,
    ) {
        Box(
            modifier = Modifier.size(120.dp).clip(CircleShape).background(brandGradient),
            contentAlignment = Alignment.Center,
        ) {
            Text("✓", fontSize = 52.sp, color = HallyuColors.OnBackground)
        }
        Spacer(Modifier.height(Spacing.xl))
        Text("You're all set!", style = MaterialTheme.typography.displayLarge, textAlign = TextAlign.Center)
        Spacer(Modifier.height(Spacing.sm))
        Text(
            "Your fandom feed is ready.",
            style = MaterialTheme.typography.bodyLarge,
            color = HallyuColors.TextSecondary,
            textAlign = TextAlign.Center,
        )
        Spacer(Modifier.height(48.dp))
        HallyuButton("Enter Hallyu") {
            viewModel.complete()
            navController.navigate(Routes.MAIN) {
                popUpTo(Routes.SPLASH) { inclusive = true }
            }
        }
    }
}

@Composable
private fun OnboardingScaffold(
    title: String,
    subtitle: String,
    step: Int,
    onBack: () -> Unit,
    content: @Composable androidx.compose.foundation.layout.ColumnScope.() -> Unit,
) {
    Column(modifier = Modifier.fillMaxSize().background(HallyuColors.Background)) {
        HallyuTopBar(title = title, onBack = onBack)
        Column(
            modifier = Modifier
                .weight(1f)
                .padding(horizontal = Spacing.lg),
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text(
                    text = subtitle,
                    style = MaterialTheme.typography.bodyMedium,
                    color = HallyuColors.TextSecondary,
                    modifier = Modifier.weight(1f),
                )
                Text("Step $step / 4", style = MaterialTheme.typography.labelMedium, color = HallyuColors.TextTertiary)
            }
            Spacer(Modifier.height(Spacing.lg))
            content()
        }
    }
}
