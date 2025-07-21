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
class SignupViewModel @Inject constructor(
    private val authRepository: AuthRepository
) : ViewModel() {
    
    private val _state = MutableStateFlow(SignupState())
    val state: StateFlow<SignupState> = _state.asStateFlow()
    
    fun signup(
        email: String,
        password: String,
        confirmPassword: String,
        nickname: String
    ) {
        // 유효성 검사
        val emailError = validateEmail(email)
        val passwordError = validatePassword(password)
        val nicknameError = validateNickname(nickname)
        
        if (emailError != null || passwordError != null || nicknameError != null) {
            _state.update { 
                it.copy(
                    emailError = emailError,
                    passwordError = passwordError,
                    nicknameError = nicknameError
                )
            }
            return
        }
        
        if (password != confirmPassword) {
            _state.update { it.copy(error = "비밀번호가 일치하지 않습니다") }
            return
        }
        
        viewModelScope.launch {
            _state.update { it.copy(isLoading = true, error = null) }
            
            try {
                val result = authRepository.signUpWithEmail(email, password)
                if (result.isSuccess) {
                    // 회원가입 성공 - AuthRepositoryImpl에서 프로필 생성 처리
                    _state.update { it.copy(isLoading = false, isSuccess = true) }
                } else {
                    val errorMessage = when {
                        result.exceptionOrNull()?.message?.contains("already registered") == true -> 
                            "이미 사용 중인 이메일입니다"
                        else -> result.exceptionOrNull()?.message ?: "회원가입 실패"
                    }
                    _state.update { 
                        it.copy(
                            isLoading = false, 
                            error = errorMessage
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
    
    private fun validateEmail(email: String): String? {
        return when {
            email.isBlank() -> "이메일을 입력해주세요"
            !android.util.Patterns.EMAIL_ADDRESS.matcher(email).matches() -> "올바른 이메일 형식이 아닙니다"
            else -> null
        }
    }
    
    private fun validatePassword(password: String): String? {
        return when {
            password.isBlank() -> "비밀번호를 입력해주세요"
            password.length < 8 -> "비밀번호는 8자 이상이어야 합니다"
            !password.any { it.isLetter() } -> "비밀번호에 영문자가 포함되어야 합니다"
            !password.any { it.isDigit() } -> "비밀번호에 숫자가 포함되어야 합니다"
            else -> null
        }
    }
    
    private fun validateNickname(nickname: String): String? {
        val nicknameRegex = "^[가-힣a-zA-Z0-9]{2,20}$".toRegex()
        return when {
            nickname.isBlank() -> "닉네임을 입력해주세요"
            nickname.length < 2 -> "닉네임은 2자 이상이어야 합니다"
            nickname.length > 20 -> "닉네임은 20자 이하여야 합니다"
            !nicknameRegex.matches(nickname) -> "닉네임은 한글, 영문, 숫자만 사용 가능합니다"
            else -> null
        }
    }
    
    fun clearError() {
        _state.update { it.copy(error = null) }
    }
}

data class SignupState(
    val isLoading: Boolean = false,
    val isSuccess: Boolean = false,
    val error: String? = null,
    val emailError: String? = null,
    val passwordError: String? = null,
    val nicknameError: String? = null
)