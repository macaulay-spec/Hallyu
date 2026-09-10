package com.hallyu.app.ui.onboarding

import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.hallyu.common.AppResult
import com.hallyu.common.valueOrNull
import com.hallyu.domain.model.Actor
import com.hallyu.domain.model.Community
import com.hallyu.domain.model.Drama
import com.hallyu.domain.repository.CommunityRepository
import com.hallyu.domain.repository.DramaRepository
import com.hallyu.domain.repository.SettingsRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import javax.inject.Inject
import kotlinx.coroutines.launch

data class OnboardingState(
    val selectedInterests: Set<String> = emptySet(),
    val dramas: List<Drama> = emptyList(),
    val selectedDramas: Set<String> = emptySet(),
    val actors: List<Actor> = emptyList(),
    val selectedActors: Set<String> = emptySet(),
    val communities: List<Community> = emptyList(),
    val selectedCommunities: Set<String> = emptySet(),
    val loading: Boolean = false,
)

@HiltViewModel
class OnboardingViewModel @Inject constructor(
    private val dramaRepository: DramaRepository,
    private val communityRepository: CommunityRepository,
    private val settingsRepository: SettingsRepository,
) : ViewModel() {

    var state by mutableStateOf(OnboardingState())
        private set

    init {
        load()
    }

    fun load() {
        viewModelScope.launch {
            state = state.copy(loading = true)
            val dramas = dramaRepository.getAiring().valueOrNull() ?: emptyList()
            val actors = dramaRepository.getActors().valueOrNull() ?: emptyList()
            val communities = communityRepository.getCommunities().valueOrNull() ?: emptyList()
            state = state.copy(loading = false, dramas = dramas, actors = actors, communities = communities)
        }
    }

    fun toggleInterest(interest: String) {
        state = state.copy(
            selectedInterests = state.selectedInterests.toggle(interest),
        )
    }

    fun toggleDrama(id: String) {
        state = state.copy(selectedDramas = state.selectedDramas.toggle(id))
    }

    fun toggleActor(id: String) {
        state = state.copy(selectedActors = state.selectedActors.toggle(id))
    }

    fun toggleCommunity(id: String) {
        state = state.copy(selectedCommunities = state.selectedCommunities.toggle(id))
    }

    fun complete() {
        viewModelScope.launch {
            state.selectedDramas.forEach { dramaRepository.followDrama(it, true) }
            state.selectedActors.forEach { dramaRepository.followActor(it, true) }
            state.selectedCommunities.forEach { communityRepository.joinCommunity(it, true) }
            settingsRepository.setOnboarded()
        }
    }

    private fun Set<String>.toggle(value: String): Set<String> =
        if (value in this) this - value else this + value
}
