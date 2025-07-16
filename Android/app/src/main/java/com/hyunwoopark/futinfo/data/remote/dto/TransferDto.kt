package com.hyunwoopark.futinfo.data.remote.dto

import com.google.gson.annotations.SerializedName

/**
 * 이적 정보 API 응답을 위한 DTO
 * iOS의 RealTransferData 구조를 참고하여 구현
 */
data class TransferResponseDto(
    @SerializedName("get")
    val get: String,
    @SerializedName("parameters")
    val parameters: Map<String, Any>,
    @SerializedName("errors")
    val errors: List<String>,
    @SerializedName("results")
    val results: Int,
    @SerializedName("paging")
    val paging: PagingDto,
    @SerializedName("response")
    val response: List<TransferDto>
)

data class TransferDto(
    @SerializedName("player")
    val player: TransferPlayerDto,
    @SerializedName("update")
    val update: String,
    @SerializedName("transfers")
    val transfers: List<TransferDetailDto>
)

data class TransferPlayerDto(
    @SerializedName("id")
    val id: Int,
    @SerializedName("name")
    val name: String,
    @SerializedName("firstname")
    val firstname: String?,
    @SerializedName("lastname")
    val lastname: String?,
    @SerializedName("age")
    val age: Int?,
    @SerializedName("birth")
    val birth: TransferPlayerBirthDto?,
    @SerializedName("nationality")
    val nationality: String?,
    @SerializedName("height")
    val height: String?,
    @SerializedName("weight")
    val weight: String?,
    @SerializedName("injured")
    val injured: Boolean?,
    @SerializedName("photo")
    val photo: String?
)

data class TransferPlayerBirthDto(
    @SerializedName("date")
    val date: String?,
    @SerializedName("place")
    val place: String?,
    @SerializedName("country")
    val country: String?
)

data class TransferDetailDto(
    @SerializedName("date")
    val date: String,
    @SerializedName("type")
    val type: String, // "€", "Loan", "Free", "N/A"
    @SerializedName("teams")
    val teams: TransferTeamsDto
)

data class TransferTeamsDto(
    @SerializedName("in")
    val teamIn: TransferTeamDto,
    @SerializedName("out")
    val teamOut: TransferTeamDto
)

data class TransferTeamDto(
    @SerializedName("id")
    val id: Int,
    @SerializedName("name")
    val name: String,
    @SerializedName("logo")
    val logo: String?
)

/**
 * 간소화된 이적 정보 DTO (샘플 데이터용)
 * iOS의 RealTransferData와 유사한 구조
 */
data class SimpleTransferDto(
    @SerializedName("id")
    val id: String,
    @SerializedName("playerName")
    val playerName: String,
    @SerializedName("fromClub")
    val fromClub: String,
    @SerializedName("toClub")
    val toClub: String,
    @SerializedName("transferFee")
    val transferFee: String,
    @SerializedName("transferDate")
    val transferDate: String, // ISO 8601 format
    @SerializedName("contractLength")
    val contractLength: String,
    @SerializedName("source")
    val source: String,
    @SerializedName("reliability")
    val reliability: Int, // 0-100
    @SerializedName("status")
    val status: String, // "완료", "진행중", "협상중", "루머", "관심"
    @SerializedName("league")
    val league: String,
    @SerializedName("position")
    val position: String,
    @SerializedName("age")
    val age: Int,
    @SerializedName("nationality")
    val nationality: String,
    @SerializedName("playerPhoto")
    val playerPhoto: String? = null,
    @SerializedName("fromClubLogo")
    val fromClubLogo: String? = null,
    @SerializedName("toClubLogo")
    val toClubLogo: String? = null
)

data class SimpleTransferResponseDto(
    @SerializedName("transfers")
    val transfers: List<SimpleTransferDto>,
    @SerializedName("lastUpdate")
    val lastUpdate: String,
    @SerializedName("totalCount")
    val totalCount: Int
)