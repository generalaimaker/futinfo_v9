package com.hyunwoopark.futinfo.presentation.fixture_detail

import com.hyunwoopark.futinfo.domain.model.FixtureDetailBundle

/**
 * 경기 상세 정보 화면의 UI 상태를 나타내는 sealed class
 */
sealed class FixtureDetailState {
    object Loading : FixtureDetailState()
    data class Success(val data: FixtureDetailBundle) : FixtureDetailState()
    data class Error(val message: String) : FixtureDetailState()
}