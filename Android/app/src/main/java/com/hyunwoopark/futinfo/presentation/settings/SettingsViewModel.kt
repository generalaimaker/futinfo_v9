package com.hyunwoopark.futinfo.presentation.settings

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.hyunwoopark.futinfo.domain.use_case.GetLanguageUseCase
import com.hyunwoopark.futinfo.domain.use_case.SaveLanguageUseCase
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

/**
 * 설정 화면의 ViewModel
 * 언어 설정 등의 사용자 설정을 관리합니다
 */
@HiltViewModel
class SettingsViewModel @Inject constructor(
    private val getLanguageUseCase: GetLanguageUseCase,
    private val saveLanguageUseCase: SaveLanguageUseCase
) : ViewModel() {

    private val _uiState = MutableStateFlow(SettingsUiState())
    val uiState: StateFlow<SettingsUiState> = _uiState.asStateFlow()

    init {
        loadCurrentLanguage()
    }

    /**
     * 현재 저장된 언어 설정을 불러옵니다
     */
    private fun loadCurrentLanguage() {
        viewModelScope.launch {
            getLanguageUseCase().collect { language ->
                _uiState.value = _uiState.value.copy(
                    currentLanguage = language
                )
            }
        }
    }

    /**
     * 언어 설정을 변경합니다
     * @param language 새로운 언어 코드
     */
    fun changeLanguage(language: String) {
        viewModelScope.launch {
            try {
                _uiState.value = _uiState.value.copy(
                    isLoading = true,
                    pendingLanguage = language
                )
                saveLanguageUseCase(language)
                _uiState.value = _uiState.value.copy(
                    currentLanguage = language,
                    isLoading = false,
                    pendingLanguage = null
                )
            } catch (e: Exception) {
                _uiState.value = _uiState.value.copy(
                    isLoading = false,
                    pendingLanguage = null,
                    errorMessage = "언어 설정 변경에 실패했습니다: ${e.message}"
                )
            }
        }
    }

    /**
     * 에러 메시지를 지웁니다
     */
    fun clearError() {
        _uiState.value = _uiState.value.copy(errorMessage = null)
    }
}

/**
 * 설정 화면의 UI 상태
 */
data class SettingsUiState(
    val currentLanguage: String = "ko",
    val pendingLanguage: String? = null,
    val isLoading: Boolean = false,
    val errorMessage: String? = null
)