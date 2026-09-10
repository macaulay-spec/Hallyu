package com.hallyu.app.ui.profile

import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.hallyu.common.AppResult
import com.hallyu.common.valueOrNull
import com.hallyu.domain.model.Community
import com.hallyu.domain.model.Post
import com.hallyu.domain.model.Profile
import com.hallyu.domain.repository.AuthRepository
import com.hallyu.domain.repository.CommunityRepository
import com.hallyu.domain.repository.PostRepository
import com.hallyu.domain.repository.ProfileRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import javax.inject.Inject
import kotlinx.coroutines.launch

data class ProfileState(
    val loading: Boolean = false,
    val profile: Profile? = null,
    val saved: List<Post> = emptyList(),
    val followers: List<Profile> = emptyList(),
    val following: List<Profile> = emptyList(),
    val communities: List<Community> = emptyList(),
    val error: String? = null,
)

@HiltViewModel
class ProfileViewModel @Inject constructor(
    private val profileRepository: ProfileRepository,
    private val postRepository: PostRepository,
    private val communityRepository: CommunityRepository,
    private val authRepository: AuthRepository,
) : ViewModel() {

    var state by mutableStateOf(ProfileState())
        private set

    init {
        loadProfile()
    }

    fun loadProfile() {
        viewModelScope.launch {
            state = state.copy(loading = true, error = null)
            when (val res = profileRepository.getProfile("me")) {
                is AppResult.Success -> state = state.copy(loading = false, profile = res.value)
                is AppResult.Error -> state = state.copy(loading = false, error = res.error.description)
            }
        }
    }

    fun loadSaved() {
        viewModelScope.launch {
            state = state.copy(saved = postRepository.getBookmarkedPosts().valueOrNull() ?: emptyList())
        }
    }

    fun loadFollowers() {
        viewModelScope.launch {
            val id = state.profile?.id ?: return@launch
            state = state.copy(followers = profileRepository.getFollowers(id).valueOrNull() ?: emptyList())
        }
    }

    fun loadFollowing() {
        viewModelScope.launch {
            val id = state.profile?.id ?: return@launch
            state = state.copy(following = profileRepository.getFollowing(id).valueOrNull() ?: emptyList())
        }
    }

    fun loadCommunities() {
        viewModelScope.launch {
            state = state.copy(communities = communityRepository.getMyCommunities().valueOrNull() ?: emptyList())
        }
    }

    fun follow(user: Profile) {
        viewModelScope.launch { profileRepository.followUser(user.id) }
        state = state.copy(followers = state.followers.map { if (it.id == user.id) it.copy(isFollowed = true) else it })
    }

    fun unfollow(user: Profile) {
        viewModelScope.launch { profileRepository.unfollowUser(user.id) }
        state = state.copy(followers = state.followers.map { if (it.id == user.id) it.copy(isFollowed = false) else it })
    }

    fun logout() {
        viewModelScope.launch { authRepository.logout() }
    }
}
