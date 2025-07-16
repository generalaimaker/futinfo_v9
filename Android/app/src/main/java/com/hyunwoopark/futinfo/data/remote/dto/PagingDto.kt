package com.hyunwoopark.futinfo.data.remote.dto

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

/**
 * API 페이징 정보 DTO
 * iOS APIPaging에 대응
 */
@Serializable
data class PagingDto(
    @SerialName("current") val current: Int,
    @SerialName("total") val total: Int
)