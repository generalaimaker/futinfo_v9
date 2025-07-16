package com.hyunwoopark.futinfo.data.local.entity

import androidx.room.Entity
import androidx.room.PrimaryKey
import com.hyunwoopark.futinfo.data.remote.dto.*

/**
 * Room 데이터베이스용 TeamProfile Entity
 * 팀 프로필 정보를 로컬 데이터베이스에 저장하기 위한 엔티티
 */
@Entity(tableName = "team_profiles")
data class TeamProfileEntity(
    @PrimaryKey
    val id: Int,
    val name: String,
    val code: String?,
    val country: String?,
    val founded: Int?,
    val national: Boolean?,
    val logo: String,
    val venueId: Int?,
    val venueName: String?,
    val venueAddress: String?,
    val venueCity: String?,
    val venueCapacity: Int?,
    val venueSurface: String?,
    val venueImage: String?,
    val lastUpdated: Long = System.currentTimeMillis()
)

/**
 * TeamProfileDto를 TeamProfileEntity로 변환하는 확장 함수
 */
fun TeamProfileDto.toEntity(): TeamProfileEntity {
    return TeamProfileEntity(
        id = team.id,
        name = team.name,
        code = team.code,
        country = team.country,
        founded = team.founded,
        national = team.national,
        logo = team.logo,
        venueId = venue.id,
        venueName = venue.name,
        venueAddress = venue.address,
        venueCity = venue.city,
        venueCapacity = venue.capacity,
        venueSurface = venue.surface,
        venueImage = venue.image
    )
}

/**
 * TeamProfileEntity를 TeamProfileDto로 변환하는 확장 함수
 */
fun TeamProfileEntity.toDto(): TeamProfileDto {
    return TeamProfileDto(
        team = TeamInfoDto(
            id = id,
            name = name,
            code = code,
            country = country,
            founded = founded,
            national = national,
            logo = logo
        ),
        venue = VenueInfoDto(
            id = venueId,
            name = venueName,
            address = venueAddress,
            city = venueCity,
            capacity = venueCapacity,
            surface = venueSurface,
            image = venueImage
        )
    )
}