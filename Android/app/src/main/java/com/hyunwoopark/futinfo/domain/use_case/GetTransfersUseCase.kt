package com.hyunwoopark.futinfo.domain.use_case

import com.hyunwoopark.futinfo.domain.model.Transfer
import com.hyunwoopark.futinfo.domain.repository.FootballRepository
import com.hyunwoopark.futinfo.util.Resource
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow
import retrofit2.HttpException
import java.io.IOException
import javax.inject.Inject

/**
 * 이적 정보를 가져오는 Use Case
 * 비즈니스 로직을 캡슐화하고 Repository와 Presentation 계층 사이의 중간 역할을 합니다.
 */
class GetTransfersUseCase @Inject constructor(
    private val repository: FootballRepository
) {
    
    /**
     * 최신 이적 정보를 가져옵니다.
     *
     * @return Flow<Resource<List<Transfer>>> 이적 정보 목록을 담은 Resource Flow
     */
    operator fun invoke(): Flow<Resource<List<Transfer>>> = flow {
        try {
            emit(Resource.Loading<List<Transfer>>())
            
            val transfers = repository.getLatestTransfers()
            
            if (transfers.isEmpty()) {
                emit(Resource.Error<List<Transfer>>("이적 정보를 찾을 수 없습니다."))
            } else {
                emit(Resource.Success<List<Transfer>>(transfers))
            }
            
        } catch (e: HttpException) {
            emit(Resource.Error<List<Transfer>>(
                message = when (e.code()) {
                    403 -> "API 접근 권한이 없습니다. 구독을 확인해주세요."
                    429 -> "요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요."
                    500 -> "서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요."
                    else -> "네트워크 오류가 발생했습니다. (${e.code()})"
                }
            ))
        } catch (e: IOException) {
            emit(Resource.Error<List<Transfer>>("인터넷 연결을 확인해주세요."))
        } catch (e: Exception) {
            emit(Resource.Error<List<Transfer>>("알 수 없는 오류가 발생했습니다: ${e.localizedMessage}"))
        }
    }
    
    /**
     * 특정 조건으로 이적 정보를 가져옵니다.
     *
     * @param player 선수 ID (선택사항)
     * @param team 팀 ID (선택사항)
     * @param season 시즌 (선택사항)
     * @return Flow<Resource<List<Transfer>>> 이적 정보 목록을 담은 Resource Flow
     */
    fun getTransfersByCondition(
        player: Int? = null,
        team: Int? = null,
        season: Int? = null
    ): Flow<Resource<List<Transfer>>> = flow {
        try {
            emit(Resource.Loading<List<Transfer>>())
            
            // 실제 API 호출 (현재는 샘플 데이터 반환)
            val response = repository.getTransfers(player, team, season)
            
            // API 응답을 도메인 모델로 변환
            val transfers = convertApiResponseToTransfers(response.response)
            
            if (transfers.isEmpty()) {
                emit(Resource.Error<List<Transfer>>("해당 조건의 이적 정보를 찾을 수 없습니다."))
            } else {
                emit(Resource.Success<List<Transfer>>(transfers))
            }
            
        } catch (e: HttpException) {
            emit(Resource.Error<List<Transfer>>(
                message = when (e.code()) {
                    403 -> "API 접근 권한이 없습니다. 구독을 확인해주세요."
                    429 -> "요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요."
                    500 -> "서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요."
                    else -> "네트워크 오류가 발생했습니다. (${e.code()})"
                }
            ))
        } catch (e: IOException) {
            emit(Resource.Error<List<Transfer>>("인터넷 연결을 확인해주세요."))
        } catch (e: Exception) {
            emit(Resource.Error<List<Transfer>>("알 수 없는 오류가 발생했습니다: ${e.localizedMessage}"))
        }
    }
    
    /**
     * API 응답을 도메인 모델로 변환합니다.
     * TransferDto를 Transfer 도메인 모델로 변환하는 로직을 구현합니다.
     */
    private fun convertApiResponseToTransfers(
        transferDtos: List<com.hyunwoopark.futinfo.data.remote.dto.TransferDto>
    ): List<Transfer> {
        return transferDtos.flatMap { transferDto ->
            transferDto.transfers.map { transferDetail ->
                Transfer(
                    id = "${transferDto.player.id}_${transferDetail.date}",
                    playerName = transferDto.player.name,
                    fromClub = transferDetail.teams.teamOut.name,
                    toClub = transferDetail.teams.teamIn.name,
                    transferFee = when (transferDetail.type) {
                        "€" -> "유료 이적"
                        "Loan" -> "임대"
                        "Free" -> "자유 이적"
                        "N/A" -> "비공개"
                        else -> transferDetail.type
                    },
                    transferDate = try {
                        java.time.LocalDateTime.parse(transferDetail.date + "T00:00:00")
                    } catch (e: Exception) {
                        java.time.LocalDateTime.now()
                    },
                    contractLength = "정보 없음",
                    source = "API-Football",
                    reliability = 90,
                    status = com.hyunwoopark.futinfo.domain.model.TransferStatus.COMPLETED,
                    league = "정보 없음",
                    position = "정보 없음",
                    age = transferDto.player.age ?: 0,
                    nationality = transferDto.player.nationality ?: "정보 없음",
                    playerPhoto = transferDto.player.photo,
                    fromClubLogo = transferDetail.teams.teamOut.logo,
                    toClubLogo = transferDetail.teams.teamIn.logo
                )
            }
        }
    }
}