package com.hallyu.domain.usecase

/**
 * The spoiler boundary (spec §9): a user who has only watched through episode N
 * must not be casually exposed to discussion tagged for a later episode.
 *
 * Pure, side-effect-free — unit tested.
 */
object SpoilerPolicy {

    /**
     * @param watchedThroughEpisode the furthest episode the user has watched (0 = none)
     * @param postEpisodeNumber the episode a post is about (nullable = not episode-specific)
     * @param postSpoilerLevel the explicit spoiler level set on the post (nullable)
     * @param mode user preference: SHOW_ALL, BLUR_BEYOND, HIDE_BEYOND
     */
    fun visibility(
        watchedThroughEpisode: Int,
        postEpisodeNumber: Int?,
        postSpoilerLevel: Int?,
        mode: String,
    ): SpoilerVisibility {
        val boundary = postSpoilerLevel ?: postEpisodeNumber

        if (boundary == null) return SpoilerVisibility.VISIBLE

        val isBehind = boundary <= watchedThroughEpisode
        if (isBehind) return SpoilerVisibility.VISIBLE

        return when (mode) {
            "SHOW_ALL" -> SpoilerVisibility.VISIBLE
            "HIDE_BEYOND" -> SpoilerVisibility.HIDDEN
            else -> SpoilerVisibility.BLURRED // default: BLUR_BEYOND
        }
    }

    /** True when a post carries enough episode context to ever need protection. */
    fun isEpisodeBound(postEpisodeNumber: Int?, postSpoilerLevel: Int?): Boolean =
        (postSpoilerLevel ?: postEpisodeNumber) != null
}

enum class SpoilerVisibility { VISIBLE, BLURRED, HIDDEN }

enum class SpoilerMode(val key: String) {
    BLUR_BEYOND("BLUR_BEYOND"),
    HIDE_BEYOND("HIDE_BEYOND"),
    SHOW_ALL("SHOW_ALL");
}
