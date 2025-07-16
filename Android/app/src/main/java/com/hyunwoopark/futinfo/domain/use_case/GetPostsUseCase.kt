package com.hyunwoopark.futinfo.domain.use_case

import com.hyunwoopark.futinfo.domain.model.Post
import com.hyunwoopark.futinfo.domain.repository.FootballRepository
import com.hyunwoopark.futinfo.util.Resource
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow
import javax.inject.Inject

/**
 * 커뮤니티 게시글 목록을 가져오는 Use Case
 */
class GetPostsUseCase @Inject constructor(
    private val repository: FootballRepository
) {
    /**
     * 게시글 목록을 가져옵니다.
     *
     * @param category 카테고리별 필터링 (선택사항)
     * @param limit 가져올 게시글 수 (기본값: 20)
     * @return Flow<Resource<List<Post>>>
     */
    operator fun invoke(
        category: String? = null,
        limit: Int = 20
    ): Flow<Resource<List<Post>>> = flow {
        try {
            emit(Resource.Loading())
            
            val posts = repository.getPosts(category, limit)
            emit(Resource.Success(posts))
            
        } catch (e: Exception) {
            emit(Resource.Error(e.localizedMessage ?: "게시글을 불러오는데 실패했습니다."))
        }
    }
}