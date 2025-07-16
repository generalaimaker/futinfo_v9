package com.hyunwoopark.futinfo.presentation.player_profile

import com.hyunwoopark.futinfo.domain.model.PlayerProfile

/**
 * 선수 프로필 화면의 상태를 관리하는 데이터 클래스
 */
data class PlayerProfileState(
    val isLoading: Boolean = false,
    val playerProfile: PlayerProfile? = null,
    val error: String? = null
)