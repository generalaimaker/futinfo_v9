package com.hyunwoopark.futinfo.data.remote.dto

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

/**
 * 경기 이벤트 응답 DTO
 */
@Serializable
data class FixtureEventResponseDto(
    @SerialName("get") val get: String,
    @SerialName("parameters") val parameters: Map<String, String>,
    @SerialName("errors") val errors: List<String>,
    @SerialName("results") val results: Int,
    @SerialName("paging") val paging: PagingDto,
    @SerialName("response") val response: List<FixtureEventDto>
)

/**
 * 경기 이벤트 DTO
 */
@Serializable
data class FixtureEventDto(
    @SerialName("time") val time: EventTimeDto,
    @SerialName("team") val team: TeamDto,
    @SerialName("player") val player: EventPlayerDto,
    @SerialName("assist") val assist: EventPlayerDto?,
    @SerialName("type") val type: String,
    @SerialName("detail") val detail: String,
    @SerialName("comments") val comments: String?
) {
    /**
     * 고유 ID 생성 (iOS 앱과 동일한 로직)
     */
    val id: String
        get() {
            val playerId = player.id ?: 0
            return "${time.elapsed}${team.id}${playerId}${type}${detail}"
        }

    /**
     * 연장전 여부 확인
     */
    val isExtraTime: Boolean
        get() = time.elapsed > 90

    /**
     * 실제 득점된 골인지 확인
     */
    val isActualGoal: Boolean
        get() {
            // 타입이 "Goal"이 아니면 득점이 아님
            if (type.lowercase() != "goal") return false
            
            // 페널티 획득만 한 경우 제외
            if (detail.lowercase().contains("won")) return false
            
            // 페널티 놓친 경우 제외
            if (detail.lowercase().contains("missed")) return false
            
            return true
        }

    /**
     * 이벤트 카테고리 분류
     */
    val eventCategory: EventCategory
        get() = when (type.lowercase()) {
            "goal" -> when {
                detail.lowercase().contains("normal goal") -> EventCategory.Goal(EventCategory.GoalType.NORMAL)
                detail.lowercase().contains("penalty") -> EventCategory.Goal(EventCategory.GoalType.PENALTY)
                detail.lowercase().contains("own goal") -> EventCategory.Goal(EventCategory.GoalType.OWN)
                else -> EventCategory.Goal(EventCategory.GoalType.NORMAL)
            }
            "card" -> when {
                detail.lowercase().contains("yellow") -> EventCategory.Card(EventCategory.CardType.YELLOW)
                detail.lowercase().contains("red") -> EventCategory.Card(EventCategory.CardType.RED)
                else -> EventCategory.Card(EventCategory.CardType.YELLOW)
            }
            "subst" -> EventCategory.Substitution
            "var" -> when {
                detail.lowercase().contains("goal") -> EventCategory.Var(EventCategory.VarType.GOAL)
                detail.lowercase().contains("penalty") -> EventCategory.Var(EventCategory.VarType.PENALTY)
                detail.lowercase().contains("card") -> EventCategory.Var(EventCategory.VarType.CARD)
                else -> EventCategory.Var(EventCategory.VarType.OTHER)
            }
            else -> EventCategory.Other
        }

    /**
     * 이벤트 아이콘
     */
    val icon: String
        get() {
            val category = eventCategory
            return when (category) {
                is EventCategory.Goal -> when (category.type) {
                    EventCategory.GoalType.NORMAL -> "⚽️"
                    EventCategory.GoalType.PENALTY -> "🎯"
                    EventCategory.GoalType.OWN -> "💢⚽️"
                }
                is EventCategory.Card -> when (category.type) {
                    EventCategory.CardType.YELLOW -> "🟨"
                    EventCategory.CardType.RED -> "🟥"
                }
                EventCategory.Substitution -> "🔄"
                is EventCategory.Var -> when (category.type) {
                    EventCategory.VarType.GOAL -> "🎥⚽️"
                    EventCategory.VarType.PENALTY -> "🎥🎯"
                    EventCategory.VarType.CARD -> "🎥🟨"
                    EventCategory.VarType.OTHER -> "🎥"
                }
                EventCategory.Other -> "📝"
            }
        }
}

/**
 * 이벤트 시간 DTO
 */
@Serializable
data class EventTimeDto(
    @SerialName("elapsed") val elapsed: Int,
    @SerialName("extra") val extra: Int?
) {
    /**
     * 표시용 시간 문자열
     */
    val displayTime: String
        get() = if (extra != null) {
            "${elapsed}+${extra}'"
        } else {
            "${elapsed}'"
        }
}

/**
 * 이벤트 선수 DTO
 */
@Serializable
data class EventPlayerDto(
    @SerialName("id") val id: Int?,
    @SerialName("name") val name: String?
)

/**
 * 이벤트 카테고리 sealed class
 */
sealed class EventCategory {
    enum class GoalType { NORMAL, PENALTY, OWN }
    enum class CardType { YELLOW, RED }
    enum class VarType { GOAL, PENALTY, CARD, OTHER }

    data class Goal(val type: GoalType) : EventCategory()
    data class Card(val type: CardType) : EventCategory()
    object Substitution : EventCategory()
    data class Var(val type: VarType) : EventCategory()
    object Other : EventCategory()

    /**
     * 골 이벤트인지 확인
     */
    val isGoal: Boolean
        get() = when (this) {
            is Goal -> true
            is Var -> type == VarType.GOAL
            else -> false
        }

    /**
     * 자책골인지 확인
     */
    val isOwnGoal: Boolean
        get() = when (this) {
            is Goal -> type == GoalType.OWN
            else -> false
        }
}