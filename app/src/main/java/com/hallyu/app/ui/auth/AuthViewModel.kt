package com.hallyu.app.ui.auth

import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.hallyu.common.AppResult
import com.hallyu.domain.model.AuthSession
import com.hallyu.domain.repository.AuthRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import javax.inject.Inject
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch

data class AuthState(
    val loading: Boolean = false,
    val error: String? = null,
    val signedIn: Boolean = false,
    val recovered: Boolean = false,
)

@HiltViewModel
class AuthViewModel @Inject constructor(
    private val authRepository: AuthRepository,
) : ViewModel() {

    var state by mutableStateOf(AuthState())
        private set

    val session: StateFlow<AuthSession?> = authRepository.session
        .stateIn(viewModelScope, SharingStarted.Eagerly, null)

    val isSignedIn: StateFlow<Boolean> = session
        .map { it != null }
        .stateIn(viewModelScope, SharingStarted.Eagerly, false)

    fun signUp(email: String, password: String, username: String) {
        if (!validate(email, password)) return
        launch {
            when (val res = authRepository.signUp(email, password, username)) {
                is AppResult.Success -> state = state.copy(loading = false, signedIn = true)
                is AppResult.Error -> state = state.copy(loading = false, error = res.error.description)
            }
        }
    }

    fun login(email: String, password: String) {
        if (!validate(email, password)) return
        launch {
            when (val res = authRepository.login(email, password)) {
                is AppResult.Success -> state = state.copy(loading = false, signedIn = true)
                is AppResult.Error -> state = state.copy(loading = false, error = res.error.description)
            }
        }
    }

    fun recover(email: String) {
        if (email.isBlank()) {
            state = state.copy(error = "Enter your email first.")
            return
        }
        launch {
            when (val res = authRepository.recoverPassword(email)) {
                is AppResult.Success -> state = state.copy(loading = false, recovered = true)
                is AppResult.Error -> state = state.copy(loading = false, error = res.error.description)
            }
        }
    }

    fun logout() {
        viewModelScope.launch { authRepository.logout() }
        state = AuthState()
    }

    fun clearError() {
        state = state.copy(error = null)
    }

    private fun validate(email: String, password: String): Boolean {
        if (email.isBlank() || password.isBlank()) {
            state = state.copy(error = "Email and password are required.")
            return false
        }
        return true
    }

    private fun launch(block: suspend () -> Unit) {
        viewModelScope.launch {
            state = state.copy(loading = true, error = null)
            block()
        }
    }
}
