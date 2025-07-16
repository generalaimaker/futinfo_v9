package com.hyunwoopark.futinfo.data.remote.dto

import com.google.gson.annotations.SerializedName

/**
 * 뉴스 API 응답을 위한 DTO 클래스들
 */

/**
 * 뉴스 API 메인 응답 (News API 전용)
 */
data class NewsApiResponseDto(
    @SerializedName("status")
    val status: String,
    @SerializedName("totalResults")
    val totalResults: Int,
    @SerializedName("articles")
    val articles: List<NewsArticleDto>
)

/**
 * Football API 뉴스 응답 (Football API 전용)
 */
data class NewsResponseDto(
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
    val response: List<NewsArticleDto>
)

/**
 * 뉴스 기사 DTO
 */
data class NewsArticleDto(
    @SerializedName("source")
    val source: NewsSourceDto,
    @SerializedName("author")
    val author: String?,
    @SerializedName("title")
    val title: String,
    @SerializedName("description")
    val description: String?,
    @SerializedName("url")
    val url: String,
    @SerializedName("urlToImage")
    val urlToImage: String?,
    @SerializedName("publishedAt")
    val publishedAt: String,
    @SerializedName("content")
    val content: String?
)

/**
 * 뉴스 소스 DTO
 */
data class NewsSourceDto(
    @SerializedName("id")
    val id: String?,
    @SerializedName("name")
    val name: String
)

/**
 * 뉴스 카테고리 enum
 */
enum class NewsCategoryDto(val value: String) {
    TRANSFER("transfer"),
    MATCH("match"),
    INJURY("injury"),
    GENERAL("general"),
    INTERNATIONAL("international")
}

/**
 * 뉴스 중요도 enum
 */
enum class NewsImportanceDto(val value: String) {
    BREAKING("breaking"),
    IMPORTANT("important"),
    NORMAL("normal")
}

/**
 * 뉴스 신뢰도 enum
 */
enum class NewsCredibilityDto(val value: String) {
    HIGH("high"),
    MEDIUM("medium"),
    LOW("low")
}

/**
 * 뉴스 관심도 enum
 */
enum class NewsInterestLevelDto(val value: String) {
    VERY_HIGH("very_high"),
    HIGH("high"),
    MEDIUM("medium"),
    LOW("low")
}