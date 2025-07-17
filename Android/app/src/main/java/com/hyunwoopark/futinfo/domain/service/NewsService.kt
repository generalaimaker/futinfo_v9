package com.hyunwoopark.futinfo.domain.service

import android.content.Context
import android.util.Log
import kotlinx.coroutines.*
import kotlinx.coroutines.flow.*
import okhttp3.OkHttpClient
import okhttp3.Request
import org.xmlpull.v1.XmlPullParser
import org.xmlpull.v1.XmlPullParserFactory
import java.io.StringReader
import java.text.SimpleDateFormat
import java.util.*
import java.util.regex.Pattern
import javax.inject.Inject
import javax.inject.Singleton

/**
 * iOS의 NewsService와 동일한 뉴스 관리 서비스
 */
@Singleton
class NewsService @Inject constructor(
    private val context: Context,
    private val httpClient: OkHttpClient
) {
    
    companion object {
        private const val TAG = "NewsService"
        private const val NEWS_CACHE_DURATION = 15 * 60 * 1000L // 15분
        private const val MAX_NEWS_ITEMS = 100
        private const val NEWS_REFRESH_INTERVAL = 10 * 60 * 1000L // 10분
    }
    
    private val _newsItems = MutableStateFlow<List<NewsItem>>(emptyList())
    val newsItems: StateFlow<List<NewsItem>> = _newsItems.asStateFlow()
    
    private val _isLoading = MutableStateFlow(false)
    val isLoading: StateFlow<Boolean> = _isLoading.asStateFlow()
    
    private val _error = MutableStateFlow<String?>(null)
    val error: StateFlow<String?> = _error.asStateFlow()
    
    private val scope = CoroutineScope(Dispatchers.Default + SupervisorJob())
    private var refreshJob: Job? = null
    
    // RSS 피드 URL 목록 (iOS와 동일)
    private val rssFeeds = listOf(
        RSSFeed("BBC Sport Football", "https://feeds.bbci.co.uk/sport/football/rss.xml"),
        RSSFeed("ESPN Football", "https://www.espn.com/espn/rss/soccer/news"),
        RSSFeed("Sky Sports Football", "https://www.skysports.com/rss/12040"),
        RSSFeed("Goal.com", "https://www.goal.com/feeds/news"),
        RSSFeed("Football News", "https://www.football365.com/feed"),
        RSSFeed("The Guardian Football", "https://www.theguardian.com/football/rss"),
        RSSFeed("Daily Mail Football", "https://www.dailymail.co.uk/sport/football/index.rss"),
        RSSFeed("Mirror Football", "https://www.mirror.co.uk/sport/football/rss.xml"),
        RSSFeed("Telegraph Football", "https://www.telegraph.co.uk/football/rss.xml"),
        RSSFeed("Independent Football", "https://www.independent.co.uk/sport/football/rss")
    )
    
    init {
        startPeriodicRefresh()
    }
    
    /**
     * 뉴스 피드 새로고침 시작
     */
    fun startPeriodicRefresh() {
        refreshJob?.cancel()
        refreshJob = scope.launch {
            while (isActive) {
                try {
                    refreshNews()
                    delay(NEWS_REFRESH_INTERVAL)
                } catch (e: Exception) {
                    Log.e(TAG, "뉴스 새로고침 중 오류: ${e.message}")
                    delay(NEWS_REFRESH_INTERVAL)
                }
            }
        }
    }
    
    /**
     * 뉴스 새로고침
     */
    suspend fun refreshNews() {
        if (_isLoading.value) return
        
        _isLoading.value = true
        _error.value = null
        
        try {
            Log.d(TAG, "🔄 뉴스 피드 새로고침 시작...")
            
            val allNewsItems = mutableListOf<NewsItem>()
            
            // 모든 RSS 피드를 병렬로 처리
            val deferredResults = rssFeeds.map { feed ->
                scope.async {
                    try {
                        fetchRSSFeed(feed)
                    } catch (e: Exception) {
                        Log.e(TAG, "RSS 피드 가져오기 실패: ${feed.name} - ${e.message}")
                        emptyList<NewsItem>()
                    }
                }
            }
            
            // 모든 결과를 기다림
            deferredResults.forEach { deferred ->
                try {
                    val newsItems = deferred.await()
                    allNewsItems.addAll(newsItems)
                } catch (e: Exception) {
                    Log.e(TAG, "RSS 피드 처리 중 오류: ${e.message}")
                }
            }
            
            // 중복 제거 및 정렬
            val uniqueNewsItems = removeDuplicates(allNewsItems)
                .sortedByDescending { it.publishDate }
                .take(MAX_NEWS_ITEMS)
            
            _newsItems.value = uniqueNewsItems
            
            Log.d(TAG, "✅ 뉴스 피드 새로고침 완료: ${uniqueNewsItems.size}개 뉴스")
            
        } catch (e: Exception) {
            Log.e(TAG, "뉴스 새로고침 실패: ${e.message}")
            _error.value = "뉴스를 불러오는 중 오류가 발생했습니다: ${e.message}"
        } finally {
            _isLoading.value = false
        }
    }
    
    /**
     * RSS 피드 가져오기
     */
    private suspend fun fetchRSSFeed(feed: RSSFeed): List<NewsItem> = withContext(Dispatchers.IO) {
        val request = Request.Builder()
            .url(feed.url)
            .addHeader("User-Agent", "FutInfo/1.0")
            .build()
        
        val response = httpClient.newCall(request).execute()
        if (!response.isSuccessful) {
            Log.e(TAG, "RSS 피드 요청 실패: ${feed.name} - ${response.code}")
            return@withContext emptyList()
        }
        
        val xmlContent = response.body?.string() ?: return@withContext emptyList()
        
        return@withContext parseRSSFeed(xmlContent, feed.name)
    }
    
    /**
     * RSS XML 파싱
     */
    private fun parseRSSFeed(xmlContent: String, sourceName: String): List<NewsItem> {
        val newsItems = mutableListOf<NewsItem>()
        
        try {
            val factory = XmlPullParserFactory.newInstance()
            val parser = factory.newPullParser()
            parser.setInput(StringReader(xmlContent))
            
            var eventType = parser.eventType
            var currentItem: NewsItem? = null
            var currentTag = ""
            
            while (eventType != XmlPullParser.END_DOCUMENT) {
                when (eventType) {
                    XmlPullParser.START_TAG -> {
                        currentTag = parser.name
                        if (currentTag == "item") {
                            currentItem = NewsItem(
                                title = "",
                                link = "",
                                description = "",
                                publishDate = Date(),
                                source = sourceName,
                                category = "Football"
                            )
                        }
                    }
                    
                    XmlPullParser.TEXT -> {
                        currentItem?.let { item ->
                            val text = parser.text
                            when (currentTag) {
                                "title" -> currentItem = item.copy(title = text.trim())
                                "link" -> currentItem = item.copy(link = text.trim())
                                "description" -> currentItem = item.copy(description = cleanDescription(text))
                                "pubDate" -> {
                                    val date = parseDate(text)
                                    if (date != null) {
                                        currentItem = item.copy(publishDate = date)
                                    }
                                }
                            }
                        }
                    }
                    
                    XmlPullParser.END_TAG -> {
                        if (parser.name == "item" && currentItem != null) {
                            if (currentItem.title.isNotEmpty() && currentItem.link.isNotEmpty()) {
                                newsItems.add(currentItem)
                            }
                            currentItem = null
                        }
                    }
                }
                eventType = parser.next()
            }
            
        } catch (e: Exception) {
            Log.e(TAG, "RSS 파싱 오류: ${e.message}")
        }
        
        return newsItems
    }
    
    /**
     * 중복 뉴스 제거 (iOS와 동일한 로직)
     */
    private fun removeDuplicates(newsItems: List<NewsItem>): List<NewsItem> {
        val uniqueItems = mutableMapOf<String, NewsItem>()
        
        newsItems.forEach { item ->
            val key = generateUniqueKey(item)
            
            // 기존 항목보다 새로운 항목이 더 상세하거나 최신이면 교체
            val existing = uniqueItems[key]
            if (existing == null || shouldReplaceItem(existing, item)) {
                uniqueItems[key] = item
            }
        }
        
        return uniqueItems.values.toList()
    }
    
    /**
     * 뉴스 아이템의 고유 키 생성
     */
    private fun generateUniqueKey(item: NewsItem): String {
        // 제목을 정규화하여 키 생성
        val normalizedTitle = item.title
            .lowercase()
            .replace(Regex("[^a-zA-Z0-9\\s]"), "")
            .replace(Regex("\\s+"), " ")
            .trim()
        
        // 첫 50자만 사용
        return if (normalizedTitle.length > 50) {
            normalizedTitle.substring(0, 50)
        } else {
            normalizedTitle
        }
    }
    
    /**
     * 기존 아이템을 새 아이템으로 교체해야 하는지 확인
     */
    private fun shouldReplaceItem(existing: NewsItem, new: NewsItem): Boolean {
        // 더 상세한 설명을 가진 아이템 선호
        if (new.description.length > existing.description.length) {
            return true
        }
        
        // 더 최신 아이템 선호
        if (new.publishDate.after(existing.publishDate)) {
            return true
        }
        
        // 더 신뢰할 수 있는 소스 선호
        val sourceRanking = mapOf(
            "BBC Sport Football" to 1,
            "Sky Sports Football" to 2,
            "The Guardian Football" to 3,
            "ESPN Football" to 4,
            "Goal.com" to 5
        )
        
        val existingRank = sourceRanking[existing.source] ?: 10
        val newRank = sourceRanking[new.source] ?: 10
        
        return newRank < existingRank
    }
    
    /**
     * 날짜 파싱
     */
    private fun parseDate(dateString: String): Date? {
        val formats = listOf(
            "EEE, dd MMM yyyy HH:mm:ss Z",
            "EEE, dd MMM yyyy HH:mm:ss zzz",
            "yyyy-MM-dd'T'HH:mm:ssZ",
            "yyyy-MM-dd'T'HH:mm:ss.SSSZ"
        )
        
        for (format in formats) {
            try {
                val sdf = SimpleDateFormat(format, Locale.ENGLISH)
                return sdf.parse(dateString)
            } catch (e: Exception) {
                // 다음 형식 시도
            }
        }
        
        return null
    }
    
    /**
     * 설명 정리 (HTML 태그 제거 등)
     */
    private fun cleanDescription(description: String): String {
        return description
            .replace(Regex("<[^>]*>"), "") // HTML 태그 제거
            .replace(Regex("&[^;]+;"), " ") // HTML 엔티티 제거
            .replace(Regex("\\s+"), " ") // 여러 공백을 하나로
            .trim()
    }
    
    /**
     * 뉴스 검색
     */
    fun searchNews(query: String): List<NewsItem> {
        val lowercaseQuery = query.lowercase()
        return _newsItems.value.filter { newsItem ->
            newsItem.title.lowercase().contains(lowercaseQuery) ||
            newsItem.description.lowercase().contains(lowercaseQuery)
        }
    }
    
    /**
     * 카테고리별 뉴스 가져오기
     */
    fun getNewsByCategory(category: String): List<NewsItem> {
        return _newsItems.value.filter { it.category == category }
    }
    
    /**
     * 서비스 정리
     */
    fun dispose() {
        refreshJob?.cancel()
        scope.cancel()
    }
}

/**
 * RSS 피드 정보
 */
data class RSSFeed(
    val name: String,
    val url: String
)

/**
 * 뉴스 아이템
 */
data class NewsItem(
    val title: String,
    val link: String,
    val description: String,
    val publishDate: Date,
    val source: String,
    val category: String,
    val imageUrl: String? = null
)