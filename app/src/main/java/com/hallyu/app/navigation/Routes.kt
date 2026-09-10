package com.hallyu.app.navigation

object Routes {
    const val SPLASH = "splash"
    const val WELCOME = "welcome"
    const val SIGNUP = "signup"
    const val LOGIN = "login"
    const val RECOVERY = "recovery"

    const val ONBOARDING_INTERESTS = "onboarding/interests"
    const val ONBOARDING_DRAMAS = "onboarding/dramas"
    const val ONBOARDING_ACTORS = "onboarding/actors"
    const val ONBOARDING_COMMUNITIES = "onboarding/communities"
    const val ONBOARDING_COMPLETE = "onboarding/complete"

    const val MAIN = "main"

    const val POST = "post/{postId}"
    const val COMMENTS = "comments/{postId}"
    const val DRAMA = "drama/{dramaId}"
    const val EPISODE = "episode/{dramaId}/{number}"
    const val EPISODE_DISCUSSION = "discussion/{dramaId}/{number}"
    const val ACTOR = "actor/{actorId}"
    const val COMMUNITY = "community/{communityId}"
    const val SEARCH = "search"
    const val HASHTAG = "hashtag/{tag}"

    const val SAVED = "saved"
    const val FOLLOWERS = "followers"
    const val FOLLOWING = "following"
    const val WATCHING = "watching"
    const val MY_COMMUNITIES = "my-communities"
    const val SETTINGS = "settings"
    const val MODERATION = "moderation"

    fun post(postId: String) = "post/$postId"
    fun comments(postId: String) = "comments/$postId"
    fun drama(dramaId: String) = "drama/$dramaId"
    fun episode(dramaId: String, number: Int) = "episode/$dramaId/$number"
    fun discussion(dramaId: String, number: Int) = "discussion/$dramaId/$number"
    fun actor(actorId: String) = "actor/$actorId"
    fun community(communityId: String) = "community/$communityId"
    fun hashtag(tag: String) = "hashtag/$tag"
}
