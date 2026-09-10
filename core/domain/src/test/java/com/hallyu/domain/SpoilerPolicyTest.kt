package com.hallyu.domain

import com.hallyu.domain.usecase.SpoilerMode
import com.hallyu.domain.usecase.SpoilerPolicy
import com.hallyu.domain.usecase.SpoilerVisibility
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class SpoilerPolicyTest {

    @Test
    fun `post without episode context is always visible`() {
        val result = SpoilerPolicy.visibility(
            watchedThroughEpisode = 0,
            postEpisodeNumber = null,
            postSpoilerLevel = null,
            mode = SpoilerMode.BLUR_BEYOND.key,
        )
        assertEquals(SpoilerVisibility.VISIBLE, result)
    }

    @Test
    fun `watched past the boundary means visible`() {
        val result = SpoilerPolicy.visibility(
            watchedThroughEpisode = 8,
            postEpisodeNumber = 8,
            postSpoilerLevel = null,
            mode = SpoilerMode.BLUR_BEYOND.key,
        )
        assertEquals(SpoilerVisibility.VISIBLE, result)
    }

    @Test
    fun `episode ahead of progress is blurred by default`() {
        val result = SpoilerPolicy.visibility(
            watchedThroughEpisode = 6,
            postEpisodeNumber = 8,
            postSpoilerLevel = null,
            mode = SpoilerMode.BLUR_BEYOND.key,
        )
        assertEquals(SpoilerVisibility.BLURRED, result)
    }

    @Test
    fun `explicit spoiler level overrides episode tag`() {
        val result = SpoilerPolicy.visibility(
            watchedThroughEpisode = 6,
            postEpisodeNumber = 8,
            postSpoilerLevel = 9,
            mode = SpoilerMode.BLUR_BEYOND.key,
        )
        assertEquals(SpoilerVisibility.BLURRED, result)
    }

    @Test
    fun `hide mode hides instead of blurring`() {
        val result = SpoilerPolicy.visibility(
            watchedThroughEpisode = 6,
            postEpisodeNumber = 8,
            postSpoilerLevel = null,
            mode = SpoilerMode.HIDE_BEYOND.key,
        )
        assertEquals(SpoilerVisibility.HIDDEN, result)
    }

    @Test
    fun `show all mode never protects`() {
        val result = SpoilerPolicy.visibility(
            watchedThroughEpisode = 1,
            postEpisodeNumber = 12,
            postSpoilerLevel = null,
            mode = SpoilerMode.SHOW_ALL.key,
        )
        assertEquals(SpoilerVisibility.VISIBLE, result)
    }

    @Test
    fun `episode bound detection`() {
        assertFalse(SpoilerPolicy.isEpisodeBound(null, null))
        assertTrue(SpoilerPolicy.isEpisodeBound(3, null))
        assertTrue(SpoilerPolicy.isEpisodeBound(null, 5))
    }
}
