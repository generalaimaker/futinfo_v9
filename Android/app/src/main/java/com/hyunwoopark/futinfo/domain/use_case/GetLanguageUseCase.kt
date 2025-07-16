package com.hyunwoopark.futinfo.domain.use_case

import com.hyunwoopark.futinfo.data.local.UserPreferencesRepository
import kotlinx.coroutines.flow.Flow
import javax.inject.Inject

/**
 * 언어 설정을 조회하는 UseCase
 */
class GetLanguageUseCase @Inject constructor(
    private val userPreferencesRepository: UserPreferencesRepository
) {
    /**
     * 저장된 언어 설정을 조회합니다
     * @return 언어 코드를 방출하는 Flow (기본값: "ko")
     */
    operator fun invoke(): Flow<String> {
        return userPreferencesRepository.getLanguage()
    }
}