package com.hyunwoopark.futinfo.presentation.fixtures

import com.hyunwoopark.futinfo.data.remote.dto.FixtureDto

/**
 * 경기 목록 화면의 UI 상태를 나타내는 데이터 클래스
 * 
 * @param fixtures 경기 목록 데이터
 * @param isLoading 로딩 상태
 * @param errorMessage 에러 메시지
 */
data class FixturesState(
    val fixtures: List<FixtureDto> = emptyList(),
    val isLoading: Boolean = false,
    val errorMessage: String? = null
)