package com.hyunwoopark.futinfo.presentation.transfers

import com.hyunwoopark.futinfo.domain.model.Transfer

/**
 * 이적 시장 화면의 UI 상태를 나타내는 데이터 클래스
 */
data class TransfersState(
    val transfers: List<Transfer> = emptyList(),
    val isLoading: Boolean = false,
    val error: String = "",
    val isRefreshing: Boolean = false,
    val selectedFilter: TransferFilter = TransferFilter.ALL,
    val searchQuery: String = ""
)

/**
 * 이적 정보 필터링 옵션
 */
enum class TransferFilter(val displayName: String) {
    ALL("전체"),
    COMPLETED("완료"),
    IN_PROGRESS("진행중"),
    NEGOTIATING("협상중"),
    RUMOR("루머"),
    INTERESTED("관심");
    
    companion object {
        fun fromTransferStatus(status: com.hyunwoopark.futinfo.domain.model.TransferStatus): TransferFilter {
            return when (status) {
                com.hyunwoopark.futinfo.domain.model.TransferStatus.COMPLETED -> COMPLETED
                com.hyunwoopark.futinfo.domain.model.TransferStatus.IN_PROGRESS -> IN_PROGRESS
                com.hyunwoopark.futinfo.domain.model.TransferStatus.NEGOTIATING -> NEGOTIATING
                com.hyunwoopark.futinfo.domain.model.TransferStatus.RUMOR -> RUMOR
                com.hyunwoopark.futinfo.domain.model.TransferStatus.INTERESTED -> INTERESTED
            }
        }
    }
}