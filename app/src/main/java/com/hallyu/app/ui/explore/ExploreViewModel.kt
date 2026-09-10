package com.hallyu.app.ui.explore

import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.hallyu.common.AppResult
import com.hallyu.common.valueOrNull
import com.hallyu.domain.model.Actor
import com.hallyu.domain.model.Drama
import com.hallyu.domain.model.SearchResults
import com.hallyu.domain.model.TrendingTopic
import com.hallyu.domain.repository.DramaRepository
import com.hallyu.domain.repository.ExploreRepository
import com.hallyu.domain.usecase.SearchContentUseCase
import com.hallyu.domain.usecase.TrendingUseCase
import dagger.hilt.android.lifecycle.HiltViewModel
import javax.inject.Inject
import kotlinx.coroutines.launch

data class ExploreState(
    val loading: Boolean = false,
    val trending: List<TrendingTopic> = emptyList(),
    val airing: List<Drama> = emptyList(),
    val upcoming: List<Drama> = emptyList(),
    val actors: List<Actor> = emptyList(),
)

@HiltViewModel
class ExploreViewModel @Inject constructor(
    private val trendingUseCase: TrendingUseCase,
    private val dramas: DramaRepository,
) : ViewModel() {

    var state by mutableStateOf(ExploreState())
        private set

    init {
        load()
    }

    fun load() {
        viewModelScope.launch {
            state = state.copy(loading = true)
            val trending = trendingUseCase().valueOrNull() ?: emptyList()
            val airing = dramas.getAiring().valueOrNull() ?: emptyList()
            val upcoming = dramas.getUpcoming().valueOrNull() ?: emptyList()
            val actors = dramas.getActors().valueOrNull() ?: emptyList()
            state = state.copy(loading = false, trending = trending, airing = airing, upcoming = upcoming, actors = actors)
        }
    }
}

data class SearchState(
    val query: String = "",
    val loading: Boolean = false,
    val results: SearchResults = SearchResults(),
    val error: String? = null,
    val searched: Boolean = false,
    val hashtagPosts: List<com.hallyu.domain.model.Post> = emptyList(),
    val hashtagLoading: Boolean = false,
)

@HiltViewModel
class SearchViewModel @Inject constructor(
    private val searchContent: SearchContentUseCase,
    private val explore: ExploreRepository,
) : ViewModel() {

    var state by mutableStateOf(SearchState())
        private set

    fun search(query: String) {
        state = state.copy(query = query, loading = true, error = null, searched = true)
        viewModelScope.launch {
            when (val res = searchContent(query)) {
                is AppResult.Success -> state = state.copy(loading = false, results = res.value)
                is AppResult.Error -> state = state.copy(loading = false, error = res.error.description)
            }
        }
    }

    fun loadHashtag(tag: String) {
        state = state.copy(hashtagLoading = true)
        viewModelScope.launch {
            val posts = explore.getHashtagPosts(tag, 0, 30).valueOrNull()?.items ?: emptyList()
            state = state.copy(hashtagLoading = false, hashtagPosts = posts)
        }
    }
}
