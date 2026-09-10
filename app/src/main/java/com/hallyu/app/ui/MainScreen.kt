package com.hallyu.app.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.navigation.NavController
import com.hallyu.app.ui.create.CreateScreen
import com.hallyu.app.ui.explore.ExploreScreen
import com.hallyu.app.ui.feed.HomeScreen
import com.hallyu.app.ui.notifications.NotificationsScreen
import com.hallyu.app.ui.profile.ProfileScreen
import com.hallyu.designsystem.GlassBottomNav
import com.hallyu.designsystem.HallyuColors

@Composable
fun MainScreen(navController: NavController) {
    var selected by rememberSaveable { mutableStateOf(0) }

    Column(modifier = Modifier.fillMaxSize().background(HallyuColors.Background)) {
        Box(Modifier.weight(1f)) {
            when (selected) {
                0 -> HomeScreen(navController)
                1 -> ExploreScreen(navController)
                2 -> CreateScreen(onPublished = { selected = 0 })
                3 -> NotificationsScreen(navController)
                else -> ProfileScreen(navController)
            }
        }
        GlassBottomNav(
            selected = selected,
            onSelect = { selected = it },
            onCreate = { selected = 2 },
        )
    }
}
