package com.hyunwoopark.futinfo.domain.use_case

import com.hyunwoopark.futinfo.domain.model.FixtureDetailBundle
import com.hyunwoopark.futinfo.domain.repository.FootballRepository
import com.hyunwoopark.futinfo.util.Resource
import kotlinx.coroutines.async
import kotlinx.coroutines.coroutineScope
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow
import javax.inject.Inject

/**
 * 경기 상세 정보를 가져오는 UseCase
 * 
 * FootballRepository를 사용하여 라인업, 통계, 이벤트 데이터를 병렬로 가져오고,
 * 이를 조합하여 FixtureDetailBundle로 만들어 Flow를 통해 로딩, 성공, 실패 상태를 방출합니다.
 */
class GetFixtureDetailUseCase @Inject constructor(
    private val repository: FootballRepository
) {
    
    /**
     * 경기 상세 정보를 가져옵니다.
     * 
     * @param fixtureId 경기 ID (필수)
     * 
     * @return Flow<Resource<FixtureDetailBundle>> 경기 상세 정보를 Resource로 감싼 Flow
     */
    suspend operator fun invoke(
        fixtureId: Int
    ): Flow<Resource<FixtureDetailBundle>> = flow {
        try {
            android.util.Log.d("FutInfo_UseCase", "🔄 경기 상세 정보 로딩 시작: fixtureId=$fixtureId")
            
            // 로딩 상태 방출
            emit(Resource.Loading())
            
            // 개별 API 호출 실패가 전체를 취소하지 않도록 각각 독립적으로 처리
            android.util.Log.d("FutInfo_UseCase", "🚀 병렬 API 호출 시작 (실패 허용 모드)")
            
            // 경기 기본 정보 조회 (필수)
            val fixtureResponse = try {
                android.util.Log.d("FutInfo_UseCase", "📊 경기 기본 정보 API 호출 시작")
                val result = repository.getFixtures(id = fixtureId)
                android.util.Log.d("FutInfo_UseCase", "✅ 경기 기본 정보 API 호출 완료")
                result
            } catch (e: Exception) {
                android.util.Log.e("FutInfo_UseCase", "❌ 경기 기본 정보 API 호출 실패: ${e.message}", e)
                throw e // 경기 기본 정보는 필수이므로 실패 시 전체 실패
            }
            
            // coroutineScope를 사용하여 나머지 API 호출을 병렬로 처리 (실패 허용)
            coroutineScope {
                // 라인업 정보 조회 (선택적)
                val lineupsDeferred = async {
                    android.util.Log.d("FutInfo_UseCase", "👥 라인업 정보 API 호출 시작")
                    try {
                        val result = repository.getFixtureLineups(fixture = fixtureId)
                        android.util.Log.d("FutInfo_UseCase", "✅ 라인업 정보 API 호출 완료")
                        result
                    } catch (e: Exception) {
                        android.util.Log.w("FutInfo_UseCase", "⚠️ 라인업 정보 API 호출 실패 (계속 진행): ${e.message}")
                        // 빈 응답 반환하여 전체 프로세스가 중단되지 않도록 함
                        com.hyunwoopark.futinfo.data.remote.dto.LineupResponseDto(
                            get = "fixtures/lineups",
                            parameters = emptyMap(),
                            errors = listOf("라인업 정보 로딩 실패: ${e.message}"),
                            results = 0,
                            paging = com.hyunwoopark.futinfo.data.remote.dto.PagingDto(current = 1, total = 1),
                            response = emptyList()
                        )
                    }
                }
                
                // 경기 통계 조회 (선택적)
                val statisticsDeferred = async {
                    android.util.Log.d("FutInfo_UseCase", "📈 경기 통계 API 호출 시작")
                    try {
                        val result = repository.getFixtureStatistics(fixture = fixtureId)
                        android.util.Log.d("FutInfo_UseCase", "✅ 경기 통계 API 호출 완료")
                        result
                    } catch (e: Exception) {
                        android.util.Log.w("FutInfo_UseCase", "⚠️ 경기 통계 API 호출 실패 (계속 진행): ${e.message}")
                        // 빈 응답 반환하여 전체 프로세스가 중단되지 않도록 함
                        com.hyunwoopark.futinfo.data.remote.dto.FixtureStatsResponseDto(
                            get = "fixtures/statistics",
                            parameters = emptyMap(),
                            errors = listOf("경기 통계 정보 로딩 실패: ${e.message}"),
                            results = 0,
                            paging = com.hyunwoopark.futinfo.data.remote.dto.PagingDto(current = 1, total = 1),
                            response = emptyList()
                        )
                    }
                }
                
                // 경기 이벤트 조회 (선택적)
                val eventsDeferred = async {
                    android.util.Log.d("FutInfo_UseCase", "⚽ 경기 이벤트 API 호출 시작")
                    try {
                        val result = repository.getFixtureEvents(fixture = fixtureId)
                        android.util.Log.d("FutInfo_UseCase", "✅ 경기 이벤트 API 호출 완료")
                        result
                    } catch (e: Exception) {
                        android.util.Log.w("FutInfo_UseCase", "⚠️ 경기 이벤트 API 호출 실패 (계속 진행): ${e.message}")
                        // 빈 응답 반환하여 전체 프로세스가 중단되지 않도록 함
                        com.hyunwoopark.futinfo.data.remote.dto.FixtureEventResponseDto(
                            get = "fixtures/events",
                            parameters = emptyMap(),
                            errors = listOf("경기 이벤트 정보 로딩 실패: ${e.message}"),
                            results = 0,
                            paging = com.hyunwoopark.futinfo.data.remote.dto.PagingDto(current = 1, total = 1),
                            response = emptyList()
                        )
                    }
                }
                
                android.util.Log.d("FutInfo_UseCase", "⏳ 선택적 API 호출 완료 대기 중...")
                
                // 모든 비동기 작업 완료 대기
                val lineupsResponse = lineupsDeferred.await()
                val statisticsResponse = statisticsDeferred.await()
                val eventsResponse = eventsDeferred.await()
                
                android.util.Log.d("FutInfo_UseCase", "🎯 모든 병렬 API 호출 완료")
                
                // 응답 데이터 검증
                if (fixtureResponse.errors.isNotEmpty()) {
                    throw Exception("경기 정보 조회 중 오류 발생: ${fixtureResponse.errors.joinToString(", ")}")
                }
                
                if (lineupsResponse.errors.isNotEmpty()) {
                    throw Exception("라인업 정보 조회 중 오류 발생: ${lineupsResponse.errors.joinToString(", ")}")
                }
                
                if (statisticsResponse.errors.isNotEmpty()) {
                    throw Exception("통계 정보 조회 중 오류 발생: ${statisticsResponse.errors.joinToString(", ")}")
                }
                
                if (eventsResponse.errors.isNotEmpty()) {
                    throw Exception("이벤트 정보 조회 중 오류 발생: ${eventsResponse.errors.joinToString(", ")}")
                }
                
                // FixtureDetailBundle 객체 생성
                val fixtureDetailBundle = FixtureDetailBundle(
                    fixture = fixtureResponse.response.firstOrNull(),
                    lineups = lineupsResponse.response,
                    statistics = statisticsResponse.response,
                    events = eventsResponse.response
                )
                
                // 성공 상태 방출
                emit(Resource.Success(fixtureDetailBundle))
            }
            
        } catch (e: Exception) {
            // 에러 상태 방출
            emit(Resource.Error(
                message = e.localizedMessage ?: "경기 상세 정보를 가져오는 중 알 수 없는 오류가 발생했습니다."
            ))
        }
    }
    
    /**
     * 라인업 정보만 가져옵니다.
     * 빠르게 라인업 정보만 필요한 경우 사용합니다.
     * 
     * @param fixtureId 경기 ID (필수)
     * 
     * @return Flow<Resource<FixtureDetailBundle>> 라인업 정보만 포함된 FixtureDetailBundle을 Resource로 감싼 Flow
     */
    suspend fun getLineupsOnly(fixtureId: Int): Flow<Resource<FixtureDetailBundle>> = flow {
        try {
            // 로딩 상태 방출
            emit(Resource.Loading())
            
            // 라인업 정보만 조회
            val lineupsResponse = repository.getFixtureLineups(fixture = fixtureId)
            
            // 응답 데이터 검증
            if (lineupsResponse.errors.isNotEmpty()) {
                throw Exception("라인업 정보 조회 중 오류 발생: ${lineupsResponse.errors.joinToString(", ")}")
            }
            
            // 라인업 정보만 포함된 FixtureDetailBundle 객체 생성
            val fixtureDetailBundle = FixtureDetailBundle(
                fixture = null,
                lineups = lineupsResponse.response,
                statistics = emptyList(),
                events = emptyList()
            )
            
            // 성공 상태 방출
            emit(Resource.Success(fixtureDetailBundle))
            
        } catch (e: Exception) {
            // 에러 상태 방출
            emit(Resource.Error(
                message = e.localizedMessage ?: "라인업 정보를 가져오는 중 알 수 없는 오류가 발생했습니다."
            ))
        }
    }
    
    /**
     * 통계 정보만 가져옵니다.
     * 빠르게 통계 정보만 필요한 경우 사용합니다.
     * 
     * @param fixtureId 경기 ID (필수)
     * @param teamId 특정 팀의 통계만 조회 (선택사항)
     * 
     * @return Flow<Resource<FixtureDetailBundle>> 통계 정보만 포함된 FixtureDetailBundle을 Resource로 감싼 Flow
     */
    suspend fun getStatisticsOnly(
        fixtureId: Int,
        teamId: Int? = null
    ): Flow<Resource<FixtureDetailBundle>> = flow {
        try {
            // 로딩 상태 방출
            emit(Resource.Loading())
            
            // 통계 정보만 조회
            val statisticsResponse = repository.getFixtureStatistics(
                fixture = fixtureId,
                team = teamId
            )
            
            // 응답 데이터 검증
            if (statisticsResponse.errors.isNotEmpty()) {
                throw Exception("통계 정보 조회 중 오류 발생: ${statisticsResponse.errors.joinToString(", ")}")
            }
            
            // 통계 정보만 포함된 FixtureDetailBundle 객체 생성
            val fixtureDetailBundle = FixtureDetailBundle(
                fixture = null,
                lineups = emptyList(),
                statistics = statisticsResponse.response,
                events = emptyList()
            )
            
            // 성공 상태 방출
            emit(Resource.Success(fixtureDetailBundle))
            
        } catch (e: Exception) {
            // 에러 상태 방출
            emit(Resource.Error(
                message = e.localizedMessage ?: "통계 정보를 가져오는 중 알 수 없는 오류가 발생했습니다."
            ))
        }
    }
    
    /**
     * 이벤트 정보만 가져옵니다.
     * 빠르게 이벤트 정보만 필요한 경우 사용합니다.
     * 
     * @param fixtureId 경기 ID (필수)
     * 
     * @return Flow<Resource<FixtureDetailBundle>> 이벤트 정보만 포함된 FixtureDetailBundle을 Resource로 감싼 Flow
     */
    suspend fun getEventsOnly(fixtureId: Int): Flow<Resource<FixtureDetailBundle>> = flow {
        try {
            // 로딩 상태 방출
            emit(Resource.Loading())
            
            // 이벤트 정보만 조회
            val eventsResponse = repository.getFixtureEvents(fixture = fixtureId)
            
            // 응답 데이터 검증
            if (eventsResponse.errors.isNotEmpty()) {
                throw Exception("이벤트 정보 조회 중 오류 발생: ${eventsResponse.errors.joinToString(", ")}")
            }
            
            // 이벤트 정보만 포함된 FixtureDetailBundle 객체 생성
            val fixtureDetailBundle = FixtureDetailBundle(
                fixture = null,
                lineups = emptyList(),
                statistics = emptyList(),
                events = eventsResponse.response
            )
            
            // 성공 상태 방출
            emit(Resource.Success(fixtureDetailBundle))
            
        } catch (e: Exception) {
            // 에러 상태 방출
            emit(Resource.Error(
                message = e.localizedMessage ?: "이벤트 정보를 가져오는 중 알 수 없는 오류가 발생했습니다."
            ))
        }
    }
    
    /**
     * 경기 상세 정보를 단계별로 가져옵니다.
     * 먼저 라인업을 로드하고, 그 다음 통계와 이벤트를 병렬로 로드합니다.
     * UI에서 점진적으로 데이터를 표시하고 싶을 때 사용합니다.
     * 
     * @param fixtureId 경기 ID (필수)
     * 
     * @return Flow<Resource<FixtureDetailBundle>> 단계별로 업데이트되는 경기 상세 정보를 Resource로 감싼 Flow
     */
    suspend fun getFixtureDetailProgressive(
        fixtureId: Int
    ): Flow<Resource<FixtureDetailBundle>> = flow {
        try {
            // 로딩 상태 방출
            emit(Resource.Loading())
            
            // 1단계: 라인업 정보 먼저 로드
            val lineupsResponse = repository.getFixtureLineups(fixture = fixtureId)
            
            if (lineupsResponse.errors.isNotEmpty()) {
                throw Exception("라인업 정보 조회 중 오류 발생: ${lineupsResponse.errors.joinToString(", ")}")
            }
            
            // 라인업만 포함된 중간 결과 방출
            val partialBundle = FixtureDetailBundle(
                fixture = null,
                lineups = lineupsResponse.response,
                statistics = emptyList(),
                events = emptyList()
            )
            emit(Resource.Success(partialBundle))
            
            // 2단계: 통계와 이벤트를 병렬로 로드
            coroutineScope {
                val statisticsDeferred = async {
                    repository.getFixtureStatistics(fixture = fixtureId)
                }
                
                val eventsDeferred = async {
                    repository.getFixtureEvents(fixture = fixtureId)
                }
                
                val statisticsResponse = statisticsDeferred.await()
                val eventsResponse = eventsDeferred.await()
                
                if (statisticsResponse.errors.isNotEmpty()) {
                    throw Exception("통계 정보 조회 중 오류 발생: ${statisticsResponse.errors.joinToString(", ")}")
                }
                
                if (eventsResponse.errors.isNotEmpty()) {
                    throw Exception("이벤트 정보 조회 중 오류 발생: ${eventsResponse.errors.joinToString(", ")}")
                }
                
                // 완전한 결과 방출
                val completeBundle = FixtureDetailBundle(
                    fixture = null,
                    lineups = lineupsResponse.response,
                    statistics = statisticsResponse.response,
                    events = eventsResponse.response
                )
                emit(Resource.Success(completeBundle))
            }
            
        } catch (e: Exception) {
            // 에러 상태 방출
            emit(Resource.Error(
                message = e.localizedMessage ?: "경기 상세 정보를 가져오는 중 알 수 없는 오류가 발생했습니다."
            ))
        }
    }
}