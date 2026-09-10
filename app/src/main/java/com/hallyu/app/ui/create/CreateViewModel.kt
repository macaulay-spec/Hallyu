package com.hallyu.app.ui.create

import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.hallyu.common.AppResult
import com.hallyu.common.valueOrNull
import com.hallyu.domain.model.Drama
import com.hallyu.domain.repository.DramaRepository
import com.hallyu.domain.usecase.PublishPostUseCase
import dagger.hilt.android.lifecycle.HiltViewModel
import javax.inject.Inject
import kotlinx.coroutines.launch

data class CreateState(
    val text: String = "",
    val category: String? = null,
    val dramaId: String? = null,
    val episodeNumber: Int = 0,
    val spoilerEnabled: Boolean = false,
    val dramas: List<Drama> = emptyList(),
    val loading: Boolean = false,
    val published: Boolean = false,
    val error: String? = null,
)

@HiltViewModel
class CreateViewModel @Inject constructor(
    private val publishPost: PublishPostUseCase,
    private val dramas: DramaRepository,
) : ViewModel() {

    var state by mutableStateOf(CreateState())
        private set

    init {
        viewModelScope.launch {
            state = state.copy(dramas = dramas.getAiring().valueOrNull() ?: emptyList())
        }
    }

    fun setText(text: String) = mutate { copy(text = text) }
    fun setCategory(category: String?) = mutate { copy(category = category) }
    fun setDrama(dramaId: String?) = mutate { copy(dramaId = dramaId) }
    fun setEpisode(n: Int) = mutate { copy(episodeNumber = n.coerceAtLeast(0)) }
    fun setSpoiler(enabled: Boolean) = mutate { copy(spoilerEnabled = enabled) }

    fun publish() {
        if (state.text.isBlank()) {
            state = state.copy(error = "Write something first.")
            return
        }
        viewModelScope.launch {
            state = state.copy(loading = true, error = null)
            val spoilerLevel = state.episodeNumber.takeIf { state.spoilerEnabled && it > 0 }
            when (val res = publishPost(
                text = state.text,
                category = state.category,
                dramaId = state.dramaId,
                episodeNumber = state.episodeNumber.takeIf { it > 0 },
                spoilerLevel = spoilerLevel,
                imageUrls = emptyList(),
            )) {
                is AppResult.Success -> state = state.copy(loading = false, published = true, text = "", category = null, dramaId = null, episodeNumber = 0, spoilerEnabled = false)
                is AppResult.Error -> state = state.copy(loading = false, error = res.error.description)
            }
        }
    }

    fun dismissPublished() = mutate { copy(published = false) }

    private fun mutate(block: CreateState.() -> CreateState) {
        state = state.block()
    }
}
