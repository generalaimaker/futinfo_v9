package com.hyunwoopark.futinfo.data.repository

import android.util.Log
import com.hyunwoopark.futinfo.data.remote.dto.PostDto
import com.hyunwoopark.futinfo.domain.model.Post
import io.github.jan.supabase.SupabaseClient
import io.github.jan.supabase.postgrest.from
import kotlinx.datetime.Instant
import kotlinx.datetime.toJavaInstant
import java.time.ZoneId
import java.time.format.DateTimeFormatter
import java.util.Date

/**
 * Supabase 관련 기능을 담당하는 확장 파일
 */

suspend fun SupabaseClient.getPosts(
    category: String? = null,
    limit: Int = 20
): List<Post> {
    return try {
        Log.d("FutInfo_Repository", "🔄 Supabase에서 게시글 목록 가져오기 (category: $category, limit: $limit)")
        
        // Supabase 쿼리 구성
        val query = from("posts")
            .select()
            .eq("is_deleted", false)
            .order("created_at", ascending = false)
            .limit(limit)
        
        // 카테고리 필터링
        val result = if (category != null) {
            query.eq("category", category)
        } else {
            query
        }
        
        // 쿼리 실행 및 PostDto로 디코딩
        val postDtos = result.decodeList<PostDto>()
        
        // PostDto를 Post 도메인 모델로 변환
        val posts = postDtos.map { convertToPost(it) }
        
        Log.d("FutInfo_Repository", "✅ ${posts.size}개 게시글 가져오기 완료")
        posts
        
    } catch (e: Exception) {
        Log.e("FutInfo_Repository", "❌ Supabase 게시글 가져오기 실패: ${e.message}")
        // 실패 시 빈 리스트 반환
        emptyList()
    }
}

/**
 * PostDto를 Post 도메인 모델로 변환합니다.
 */
private fun convertToPost(dto: PostDto): Post {
    // ISO 8601 문자열을 Date로 변환
    val createdAt = dto.createdAt?.let { 
        try {
            Date.from(Instant.parse(it).toJavaInstant())
        } catch (e: Exception) {
            Date()
        }
    } ?: Date()
    
    val updatedAt = dto.updatedAt?.let { 
        try {
            Date.from(Instant.parse(it).toJavaInstant())
        } catch (e: Exception) {
            null
        }
    }
    
    return Post(
        id = dto.id,
        title = dto.title,
        content = dto.content,
        author = dto.author,
        authorId = dto.authorId,
        createdAt = createdAt,
        updatedAt = updatedAt,
        likes = dto.likes,
        comments = dto.comments,
        category = dto.category,
        tags = dto.tags,
        relativeTime = getRelativeTimeString(createdAt)
    )
}

/**
 * 상대적인 시간 문자열을 반환합니다.
 */
private fun getRelativeTimeString(date: Date): String {
    val now = System.currentTimeMillis()
    val diff = now - date.time
    
    return when {
        diff < 60_000 -> "방금 전"
        diff < 3_600_000 -> "${diff / 60_000}분 전"
        diff < 86_400_000 -> "${diff / 3_600_000}시간 전"
        diff < 2_592_000_000 -> "${diff / 86_400_000}일 전"
        else -> {
            val formatter = DateTimeFormatter.ofPattern("yyyy.MM.dd")
                .withZone(ZoneId.systemDefault())
            formatter.format(date.toInstant())
        }
    }
}