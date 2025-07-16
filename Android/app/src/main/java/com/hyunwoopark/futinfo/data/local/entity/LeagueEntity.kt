package com.hyunwoopark.futinfo.data.local.entity

import androidx.room.Entity
import androidx.room.PrimaryKey
import com.hyunwoopark.futinfo.data.remote.dto.LeagueDetailsDto
import com.hyunwoopark.futinfo.data.remote.dto.LeagueInfoDto
import com.hyunwoopark.futinfo.data.remote.dto.CountryDto
import com.hyunwoopark.futinfo.data.remote.dto.SeasonDto

/**
 * Room 데이터베이스용 League Entity
 * 리그 정보를 로컬 데이터베이스에 저장하기 위한 엔티티
 */
@Entity(tableName = "leagues")
data class LeagueEntity(
    @PrimaryKey
    val id: Int,
    val name: String,
    val type: String,
    val logo: String,
    val countryName: String?,
    val countryCode: String?,
    val countryFlag: String?,
    val currentSeason: Int?,
    val seasonStart: String?,
    val seasonEnd: String?,
    val lastUpdated: Long = System.currentTimeMillis()
)

/**
 * LeagueDetailsDto를 LeagueEntity로 변환하는 확장 함수
 */
fun LeagueDetailsDto.toEntity(): LeagueEntity {
    val currentSeasonInfo = seasons?.find { it.current }
    return LeagueEntity(
        id = league.id,
        name = league.name,
        type = league.type,
        logo = league.logo,
        countryName = country?.name,
        countryCode = country?.code,
        countryFlag = country?.flag,
        currentSeason = currentSeasonInfo?.year,
        seasonStart = currentSeasonInfo?.start,
        seasonEnd = currentSeasonInfo?.end
    )
}

/**
 * LeagueEntity를 LeagueDetailsDto로 변환하는 확장 함수
 */
fun LeagueEntity.toDto(): LeagueDetailsDto {
    return LeagueDetailsDto(
        league = LeagueInfoDto(
            id = id,
            name = name,
            type = type,
            logo = logo
        ),
        country = if (countryName != null) {
            CountryDto(
                name = countryName,
                code = countryCode,
                flag = countryFlag
            )
        } else null,
        seasons = if (currentSeason != null) {
            listOf(
                SeasonDto(
                    year = currentSeason,
                    start = seasonStart,
                    end = seasonEnd,
                    current = true,
                    coverage = null
                )
            )
        } else null
    )
}