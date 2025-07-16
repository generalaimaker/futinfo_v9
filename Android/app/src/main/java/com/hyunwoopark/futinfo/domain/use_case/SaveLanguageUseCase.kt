package com.hyunwoopark.futinfo.domain.use_case

import com.hyunwoopark.futinfo.data.local.UserPreferencesRepository
import javax.inject.Inject

/**
 * 언어 설정을 저장하는 UseCase
 */
class SaveLanguageUseCase @Inject constructor(
    private val userPreferencesRepository: UserPreferencesRepository
) {
    /**
     * 언어 설정을 저장합니다
     * @param language 저장할 언어 코드 (예: "ko", "en")
     */
    suspend operator fun invoke(language: String) {
        userPreferencesRepository.saveLanguage(language)
    }
}