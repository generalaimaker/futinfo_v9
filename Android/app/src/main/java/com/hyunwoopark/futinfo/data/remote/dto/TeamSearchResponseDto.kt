package com.hyunwoopark.futinfo.data.remote.dto

import com.hyunwoopark.futinfo.domain.model.Team
import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class TeamSearchResponseDto(
    @SerialName("get") val get: String? = null,
    @SerialName("parameters") val parameters: Map<String, String>? = null,
    @SerialName("errors") val errors: Map<String, String>? = null,
    @SerialName("results") val results: Int? = null,
    @SerialName("paging") val paging: PagingDto? = null,
    @SerialName("response") val response: List<SearchTeamDto>? = null
)

@Serializable
data class SearchTeamDto(
    @SerialName("team") val team: SearchTeamDataDto? = null,
    @SerialName("venue") val venue: VenueDto? = null
)

@Serializable
data class SearchTeamDataDto(
    @SerialName("id") val id: Int? = null,
    @SerialName("name") val name: String? = null,
    @SerialName("code") val code: String? = null,
    @SerialName("country") val country: String? = null,
    @SerialName("founded") val founded: Int? = null,
    @SerialName("national") val national: Boolean? = null,
    @SerialName("logo") val logo: String? = null
) {
    fun toDomainModel(): Team? {
        return if (id != null && name != null) {
            Team(
                id = id,
                name = name,
                code = code,
                country = country,
                founded = founded,
                national = national ?: false,
                logo = logo
            )
        } else {
            null
        }
    }
}

// Type alias for backwards compatibility  
typealias TeamSearchResultDto = SearchTeamDto