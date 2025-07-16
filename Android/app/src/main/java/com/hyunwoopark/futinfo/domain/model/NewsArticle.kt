package com.hyunwoopark.futinfo.domain.model

import java.time.LocalDateTime

/**
 * 뉴스 기사 도메인 모델
 */
data class NewsArticle(
    val id: String,
    val title: String,
    val source: String,
    val url: String,
    val publishedAt: LocalDateTime,
    val summary: String,
    val credibility: NewsCredibility,
    val importance: NewsImportance,
    val category: NewsCategory,
    val interestLevel: NewsInterestLevel,
    val imageUrl: String?,
    val tags: List<String>
)

/**
 * 뉴스 카테고리
 */
enum class NewsCategory(val displayName: String, val icon: String) {
    TRANSFER("이적", "arrow_left_arrow_right"),
    MATCH("경기", "sports_soccer"),
    INJURY("부상", "medical_services"),
    GENERAL("일반", "article"),
    INTERNATIONAL("국가대표", "flag")
}

/**
 * 뉴스 중요도
 */
enum class NewsImportance(val displayName: String, val priority: Int) {
    BREAKING("속보", 3),
    IMPORTANT("중요", 2),
    NORMAL("일반", 1)
}

/**
 * 뉴스 신뢰도
 */
enum class NewsCredibility(val displayName: String, val color: String) {
    HIGH("높음", "green"),
    MEDIUM("보통", "orange"),
    LOW("낮음", "red")
}

/**
 * 뉴스 관심도 (유럽 축구팬 기준)
 */
enum class NewsInterestLevel(val displayName: String, val priority: Int) {
    VERY_HIGH("🔥 핫이슈", 4),
    HIGH("⭐ 주요뉴스", 3),
    MEDIUM("📰 일반뉴스", 2),
    LOW("📄 기타뉴스", 1)
}