package com.hallyu.app.navigation

import androidx.compose.runtime.Composable
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navArgument
import com.hallyu.app.ui.MainScreen
import com.hallyu.app.ui.auth.LoginScreen
import com.hallyu.app.ui.auth.RecoveryScreen
import com.hallyu.app.ui.auth.SignUpScreen
import com.hallyu.app.ui.auth.SplashScreen
import com.hallyu.app.ui.auth.WelcomeScreen
import com.hallyu.app.ui.content.ActorScreen
import com.hallyu.app.ui.content.CommentsScreen
import com.hallyu.app.ui.content.CommunityScreen
import com.hallyu.app.ui.content.DramaHubScreen
import com.hallyu.app.ui.content.EpisodeDiscussionScreen
import com.hallyu.app.ui.content.EpisodePageScreen
import com.hallyu.app.ui.content.PostDetailScreen
import com.hallyu.app.ui.explore.ExploreScreen
import com.hallyu.app.ui.explore.HashtagScreen
import com.hallyu.app.ui.explore.SearchResultsScreen
import com.hallyu.app.ui.moderation.ModerationScreen
import com.hallyu.app.ui.onboarding.OnboardingActorsScreen
import com.hallyu.app.ui.onboarding.OnboardingCommunitiesScreen
import com.hallyu.app.ui.onboarding.OnboardingCompleteScreen
import com.hallyu.app.ui.onboarding.OnboardingDramasScreen
import com.hallyu.app.ui.onboarding.OnboardingInterestsScreen
import com.hallyu.app.ui.profile.FollowersScreen
import com.hallyu.app.ui.profile.FollowingScreen
import com.hallyu.app.ui.profile.MyCommunitiesScreen
import com.hallyu.app.ui.profile.SavedScreen
import com.hallyu.app.ui.profile.SettingsScreen
import com.hallyu.app.ui.watching.WatchingScreen

@Composable
fun HallyuNavHost() {
    val navController = rememberNavController()

    NavHost(navController = navController, startDestination = Routes.SPLASH) {
        composable(Routes.SPLASH) { SplashScreen(navController) }
        composable(Routes.WELCOME) { WelcomeScreen(navController) }
        composable(Routes.SIGNUP) { SignUpScreen(navController) }
        composable(Routes.LOGIN) { LoginScreen(navController) }
        composable(Routes.RECOVERY) { RecoveryScreen(navController) }

        composable(Routes.ONBOARDING_INTERESTS) { OnboardingInterestsScreen(navController) }
        composable(Routes.ONBOARDING_DRAMAS) { OnboardingDramasScreen(navController) }
        composable(Routes.ONBOARDING_ACTORS) { OnboardingActorsScreen(navController) }
        composable(Routes.ONBOARDING_COMMUNITIES) { OnboardingCommunitiesScreen(navController) }
        composable(Routes.ONBOARDING_COMPLETE) { OnboardingCompleteScreen(navController) }

        composable(Routes.MAIN) { MainScreen(navController) }

        composable(
            route = Routes.POST,
            arguments = listOf(navArgument("postId") { type = NavType.StringType }),
        ) { entry ->
            PostDetailScreen(postId = entry.arguments?.getString("postId").orEmpty(), navController = navController)
        }
        composable(
            route = Routes.COMMENTS,
            arguments = listOf(navArgument("postId") { type = NavType.StringType }),
        ) { entry ->
            CommentsScreen(postId = entry.arguments?.getString("postId").orEmpty(), navController = navController)
        }
        composable(
            route = Routes.DRAMA,
            arguments = listOf(navArgument("dramaId") { type = NavType.StringType }),
        ) { entry ->
            DramaHubScreen(dramaId = entry.arguments?.getString("dramaId").orEmpty(), navController = navController)
        }
        composable(
            route = Routes.EPISODE,
            arguments = listOf(
                navArgument("dramaId") { type = NavType.StringType },
                navArgument("number") { type = NavType.IntType },
            ),
        ) { entry ->
            EpisodePageScreen(
                dramaId = entry.arguments?.getString("dramaId").orEmpty(),
                number = entry.arguments?.getInt("number") ?: 1,
                navController = navController,
            )
        }
        composable(
            route = Routes.EPISODE_DISCUSSION,
            arguments = listOf(
                navArgument("dramaId") { type = NavType.StringType },
                navArgument("number") { type = NavType.IntType },
            ),
        ) { entry ->
            EpisodeDiscussionScreen(
                dramaId = entry.arguments?.getString("dramaId").orEmpty(),
                number = entry.arguments?.getInt("number") ?: 1,
                navController = navController,
            )
        }
        composable(
            route = Routes.ACTOR,
            arguments = listOf(navArgument("actorId") { type = NavType.StringType }),
        ) { entry ->
            ActorScreen(actorId = entry.arguments?.getString("actorId").orEmpty(), navController = navController)
        }
        composable(
            route = Routes.COMMUNITY,
            arguments = listOf(navArgument("communityId") { type = NavType.StringType }),
        ) { entry ->
            CommunityScreen(communityId = entry.arguments?.getString("communityId").orEmpty(), navController = navController)
        }
        composable(Routes.SEARCH) { SearchResultsScreen(navController) }
        composable(
            route = Routes.HASHTAG,
            arguments = listOf(navArgument("tag") { type = NavType.StringType }),
        ) { entry ->
            HashtagScreen(tag = entry.arguments?.getString("tag").orEmpty(), navController = navController)
        }

        composable(Routes.SAVED) { SavedScreen(navController) }
        composable(Routes.FOLLOWERS) { FollowersScreen(navController) }
        composable(Routes.FOLLOWING) { FollowingScreen(navController) }
        composable(Routes.WATCHING) { WatchingScreen(navController) }
        composable(Routes.MY_COMMUNITIES) { MyCommunitiesScreen(navController) }
        composable(Routes.SETTINGS) { SettingsScreen(navController) }
        composable(Routes.MODERATION) { ModerationScreen(navController) }
    }
}
