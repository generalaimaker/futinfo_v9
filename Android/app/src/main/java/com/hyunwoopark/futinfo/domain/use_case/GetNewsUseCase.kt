package com.hyunwoopark.futinfo.domain.use_case

import com.hyunwoopark.futinfo.domain.model.NewsArticle
import com.hyunwoopark.futinfo.domain.repository.FootballRepository
import com.hyunwoopark.futinfo.util.Resource
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow
import javax.inject.Inject

/**
 * 축구 뉴스를 가져오는 Use Case
 * 
 * Clean Architecture의 Domain Layer에서 비즈니스 로직을 처리합니다.
 * Repository를 통해 뉴스 데이터를 가져오고, UI에서 사용할 수 있는 형태로 변환합니다.
 */
class GetNewsUseCase @Inject constructor(
    private val repository: FootballRepository
) {
    
    /**
     * 뉴스를 가져옵니다.
     *
     * @param query 검색 쿼리 (선택사항, 기본값: "football")
     * @param maxResults 최대 결과 수 (선택사항, 기본값: 20)
     * @param startDate 시작 날짜 (YYYY-MM-DD 형식, 선택사항)
     * @param endDate 종료 날짜 (YYYY-MM-DD 형식, 선택사항)
     * @param category 카테고리 필터 (선택사항)
     *
     * @return Flow<Resource<List<NewsArticle>>> 뉴스 기사 목록을 포함한 Resource
     */
    operator fun invoke(
        query: String = "football",
        maxResults: Int = 20,
        startDate: String? = null,
        endDate: String? = null,
        category: String? = null
    ): Flow<Resource<List<NewsArticle>>> = flow {
        try {
            // 로딩 상태 방출
            emit(Resource.Loading())
            
            // Repository에서 뉴스 데이터 가져오기
            val newsArticles = repository.getNews(
                query = query,
                maxResults = maxResults,
                startDate = startDate,
                endDate = endDate,
                category = category
            )
            
            // 성공 상태와 함께 데이터 방출
            emit(Resource.Success(newsArticles))
            
        } catch (e: Exception) {
            // 에러 상태 방출
            emit(Resource.Error(
                message = e.localizedMessage ?: "뉴스를 가져오는 중 오류가 발생했습니다.",
                data = null
            ))
        }
    }
    
    /**
     * 카테고리별 뉴스를 가져옵니다.
     * 
     * @param category 뉴스 카테고리 (transfer, match, injury 등)
     * @param maxResults 최대 결과 수
     * 
     * @return Flow<Resource<List<NewsArticle>>> 카테고리별 뉴스 기사 목록
     */
    fun getNewsByCategory(
        category: String,
        maxResults: Int = 20
    ): Flow<Resource<List<NewsArticle>>> = flow {
        try {
            emit(Resource.Loading())
            
            // 카테고리에 맞는 검색 쿼리 구성
            val categoryQuery = when (category.lowercase()) {
                "transfer" -> "football transfer signing"
                "match" -> "football match result goal"
                "injury" -> "football injury player"
                "international" -> "football international national team"
                else -> "football $category"
            }
            
            val newsArticles = repository.getNews(categoryQuery, maxResults)
            
            // 카테고리별로 필터링 (추가적인 정확도를 위해)
            val filteredNews = newsArticles.filter { article ->
                when (category.lowercase()) {
                    "transfer" -> article.category.name.lowercase().contains("transfer")
                    "match" -> article.category.name.lowercase().contains("match")
                    "injury" -> article.category.name.lowercase().contains("injury")
                    "international" -> article.category.name.lowercase().contains("international")
                    else -> true
                }
            }
            
            emit(Resource.Success(filteredNews))
            
        } catch (e: Exception) {
            emit(Resource.Error(
                message = e.localizedMessage ?: "카테고리별 뉴스를 가져오는 중 오류가 발생했습니다.",
                data = null
            ))
        }
    }
    
    /**
     * 중요도별 뉴스를 가져옵니다.
     * 
     * @param importance 뉴스 중요도 (BREAKING, IMPORTANT, NORMAL)
     * @param maxResults 최대 결과 수
     * 
     * @return Flow<Resource<List<NewsArticle>>> 중요도별 뉴스 기사 목록
     */
    fun getNewsByImportance(
        importance: String,
        maxResults: Int = 20
    ): Flow<Resource<List<NewsArticle>>> = flow {
        try {
            emit(Resource.Loading())
            
            // 중요도에 맞는 검색 쿼리 구성
            val importanceQuery = when (importance.uppercase()) {
                "BREAKING" -> "football breaking news confirmed official"
                "IMPORTANT" -> "football important news"
                else -> "football"
            }
            
            val newsArticles = repository.getNews(importanceQuery, maxResults)
            
            // 중요도별로 필터링
            val filteredNews = newsArticles.filter { article ->
                article.importance.name.equals(importance, ignoreCase = true)
            }
            
            emit(Resource.Success(filteredNews))
            
        } catch (e: Exception) {
            emit(Resource.Error(
                message = e.localizedMessage ?: "중요도별 뉴스를 가져오는 중 오류가 발생했습니다.",
                data = null
            ))
        }
    }
    
    /**
     * 특정 팀 관련 뉴스를 가져옵니다.
     * 
     * @param teamName 팀 이름
     * @param maxResults 최대 결과 수
     * 
     * @return Flow<Resource<List<NewsArticle>>> 팀 관련 뉴스 기사 목록
     */
    fun getNewsByTeam(
        teamName: String,
        maxResults: Int = 20
    ): Flow<Resource<List<NewsArticle>>> = flow {
        try {
            emit(Resource.Loading())
            
            // 팀 이름을 포함한 검색 쿼리 구성
            val teamQuery = "football $teamName"
            
            val newsArticles = repository.getNews(teamQuery, maxResults)
            
            // 팀 이름이 포함된 뉴스만 필터링
            val filteredNews = newsArticles.filter { article ->
                article.title.contains(teamName, ignoreCase = true) ||
                article.summary.contains(teamName, ignoreCase = true) ||
                article.tags.any { tag -> tag.contains(teamName, ignoreCase = true) }
            }
            
            emit(Resource.Success(filteredNews))
            
        } catch (e: Exception) {
            emit(Resource.Error(
                message = e.localizedMessage ?: "팀 관련 뉴스를 가져오는 중 오류가 발생했습니다.",
                data = null
            ))
        }
    }
}