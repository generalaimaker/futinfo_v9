package com.hyunwoopark.futinfo.domain.model

import java.time.LocalDateTime

/**
 * 이적 정보 도메인 모델
 * UI에 표시될 이적 정보를 나타냅니다.
 * iOS의 RealTransferData 구조를 참고하여 구현
 */
data class Transfer(
    val id: String,
    val playerName: String,
    val fromClub: String,
    val toClub: String,
    val transferFee: String,
    val transferDate: LocalDateTime,
    val contractLength: String,
    val source: String,
    val reliability: Int, // 0-100
    val status: TransferStatus,
    val league: String,
    val position: String,
    val age: Int,
    val nationality: String,
    val playerPhoto: String? = null,
    val fromClubLogo: String? = null,
    val toClubLogo: String? = null
)

/**
 * 이적 상태를 나타내는 열거형
 */
enum class TransferStatus(val displayName: String, val color: String) {
    COMPLETED("완료", "#4CAF50"),
    IN_PROGRESS("진행중", "#FF9800"),
    NEGOTIATING("협상중", "#2196F3"),
    RUMOR("루머", "#9E9E9E"),
    INTERESTED("관심", "#673AB7");
    
    companion object {
        fun fromString(status: String): TransferStatus {
            return when (status) {
                "완료" -> COMPLETED
                "진행중" -> IN_PROGRESS
                "협상중" -> NEGOTIATING
                "루머" -> RUMOR
                "관심" -> INTERESTED
                else -> RUMOR
            }
        }
    }
}

/**
 * 이적료 타입을 나타내는 열거형
 */
enum class TransferFeeType {
    PAID,      // 유료 이적
    LOAN,      // 임대
    FREE,      // 자유 이적
    UNDISCLOSED // 비공개
}

/**
 * 이적 정보 요약 데이터 클래스
 */
data class TransferSummary(
    val totalTransfers: Int,
    val completedTransfers: Int,
    val totalTransferValue: String,
    val topTransfer: Transfer?,
    val lastUpdated: LocalDateTime
)