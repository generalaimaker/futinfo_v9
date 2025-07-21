package com.hyunwoopark.futinfo.presentation.auth

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.hyunwoopark.futinfo.domain.repository.AuthRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class LoginViewModel @Inject constructor(
    private val authRepository: AuthRepository
) : ViewModel() {
    
    private val _state = MutableStateFlow(LoginState())
    val state: StateFlow<LoginState> = _state.asStateFlow()
    
    fun login(email: String, password: String) {
        if (email.isBlank() || password.isBlank()) {
            _state.update { it.copy(error = "이메일과 비밀번호를 입력해주세요") }
            return
        }
        
        viewModelScope.launch {
            _state.update { it.copy(isLoading = true, error = null) }
            
            try {
                val result = authRepository.signInWithEmail(email, password)
                if (result.isSuccess) {
                    _state.update { it.copy(isLoading = false, isSuccess = true) }
                } else {
                    _state.update { 
                        it.copy(
                            isLoading = false, 
                            error = result.exceptionOrNull()?.message ?: "로그인 실패"
                        )
                    }
                }
            } catch (e: Exception) {
                _state.update { 
                    it.copy(
                        isLoading = false, 
                        error = e.message ?: "알 수 없는 오류가 발생했습니다"
                    )
                }
            }
        }
    }
    
    fun loginWithGoogle() {
        viewModelScope.launch {
            _state.update { it.copy(isLoading = true, error = null) }
            
            try {
                // TODO: Google OAuth 구현
                _state.update { 
                    it.copy(
                        isLoading = false, 
                        error = "Google 로그인은 준비 중입니다"
                    )
                }
            } catch (e: Exception) {
                _state.update { 
                    it.copy(
                        isLoading = false, 
                        error = e.message ?: "Google 로그인 실패"
                    )
                }
            }
        }
    }
    
    fun loginWithApple() {
        viewModelScope.launch {
            _state.update { it.copy(isLoading = true, error = null) }
            
            try {
                // TODO: Apple OAuth 구현
                _state.update { 
                    it.copy(
                        isLoading = false, 
                        error = "Apple 로그인은 준비 중입니다"
                    )
                }
            } catch (e: Exception) {
                _state.update { 
                    it.copy(
                        isLoading = false, 
                        error = e.message ?: "Apple 로그인 실패"
                    )
                }
            }
        }
    }
    
    fun clearError() {
        _state.update { it.copy(error = null) }
    }
}

data class LoginState(
    val isLoading: Boolean = false,
    val isSuccess: Boolean = false,
    val error: String? = null
)