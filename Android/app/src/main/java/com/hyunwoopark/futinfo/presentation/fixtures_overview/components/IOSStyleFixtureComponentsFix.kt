package com.hyunwoopark.futinfo.presentation.fixtures_overview.components

// Goals nullable 문제를 해결하기 위한 extension 함수들

import com.hyunwoopark.futinfo.data.remote.dto.FixtureDto

// Goals 접근을 위한 안전한 extension 프로퍼티
val FixtureDto.homeGoals: Int
    get() = this.goals?.home ?: 0

val FixtureDto.awayGoals: Int
    get() = this.goals?.away ?: 0