package com.hyunwoopark.futinfo.domain.use_case

import com.hyunwoopark.futinfo.data.remote.dto.PlayersResponseDto
import com.hyunwoopark.futinfo.domain.repository.FootballRepository
import com.hyunwoopark.futinfo.util.Resource
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow
import retrofit2.HttpException
import java.io.IOException
import javax.inject.Inject

/**
 * 리그 도움왕을 가져오는 UseCase
 */
class GetTopAssistsUseCase @Inject constructor(
    private val repository: FootballRepository
) {
    operator fun invoke(
        league: Int,
        season: Int
    ): Flow<Resource<PlayersResponseDto>> = flow {
        try {
            emit(Resource.Loading())
            android.util.Log.d("GetTopAssistsUseCase", "🔍 도움왕 조회 시작 - league: $league, season: $season")
            val topAssists = repository.getTopAssists(league, season)
            android.util.Log.d("GetTopAssistsUseCase", "✅ 도움왕 조회 성공 - 선수 수: ${topAssists.response.size}")
            emit(Resource.Success(topAssists))
        } catch (e: HttpException) {
            android.util.Log.e("GetTopAssistsUseCase", "❌ HTTP 오류: ${e.code()} - ${e.message()}", e)
            emit(Resource.Error(e.localizedMessage ?: "HTTP 오류가 발생했습니다"))
        } catch (e: IOException) {
            android.util.Log.e("GetTopAssistsUseCase", "❌ 네트워크 오류: ${e.message}", e)
            emit(Resource.Error("네트워크 연결을 확인해주세요"))
        } catch (e: kotlinx.serialization.SerializationException) {
            android.util.Log.e("GetTopAssistsUseCase", "❌ 직렬화 오류: ${e.message}", e)
            android.util.Log.e("GetTopAssistsUseCase", "❌ 직렬화 상세: ${e.stackTraceToString()}")
            emit(Resource.Error("데이터 파싱 오류: ${e.message}"))
        } catch (e: Exception) {
            android.util.Log.e("GetTopAssistsUseCase", "❌ 알 수 없는 오류: ${e.message}", e)
            emit(Resource.Error(e.localizedMessage ?: "알 수 없는 오류가 발생했습니다"))
        }
    }
}