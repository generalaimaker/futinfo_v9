package com.hyunwoopark.futinfo.domain.service

import com.hyunwoopark.futinfo.domain.model.Fixture
import com.hyunwoopark.futinfo.domain.model.toDomainModel
import com.hyunwoopark.futinfo.domain.repository.FootballRepository
import kotlinx.coroutines.*
import kotlinx.coroutines.flow.*
import javax.inject.Inject
import javax.inject.Singleton
import java.time.LocalDate

/**
 * 라이브 경기 업데이트 서비스
 * iOS의 LiveMatchService와 동일한 기능
 */
@Singleton
class LiveMatchService @Inject constructor(
    private val footballRepository: FootballRepository
) {
    
    private val _liveFixtures = MutableStateFlow<List<Fixture>>(emptyList())
    val liveFixtures: StateFlow<List<Fixture>> = _liveFixtures.asStateFlow()
    
    private val _isLiveUpdateActive = MutableStateFlow(false)
    val isLiveUpdateActive: StateFlow<Boolean> = _isLiveUpdateActive.asStateFlow()
    
    private var liveUpdateJob: Job? = null
    private val scope = CoroutineScope(Dispatchers.Default + SupervisorJob())
    
    companion object {
        private const val LIVE_UPDATE_INTERVAL = 30_000L // 30초
        private const val LIVE_FIXTURES_UPDATE_INTERVAL = 60_000L // 1분
    }
    
    /**
     * 라이브 업데이트 시작
     */
    fun startLiveUpdates() {
        if (_isLiveUpdateActive.value) return
        
        _isLiveUpdateActive.value = true
        
        liveUpdateJob = scope.launch {
            while (isActive && _isLiveUpdateActive.value) {
                try {
                    updateLiveFixtures()
                    delay(LIVE_UPDATE_INTERVAL)
                } catch (e: Exception) {
                    // 에러 무시하고 계속 시도
                    delay(LIVE_UPDATE_INTERVAL)
                }
            }
        }
    }
    
    /**
     * 라이브 업데이트 중지
     */
    fun stopLiveUpdates() {
        _isLiveUpdateActive.value = false
        liveUpdateJob?.cancel()
        liveUpdateJob = null
    }
    
    /**
     * 라이브 경기 정보 업데이트
     */
    private suspend fun updateLiveFixtures() {
        try {
            val today = LocalDate.now()
            val mainLeagues = listOf(39, 140, 135, 78, 61) // Premier League, La Liga, Serie A, Bundesliga, Ligue 1
            val fixtures = try {
                footballRepository.getFixtures(
                    date = today.toString(),
                    leagueIds = mainLeagues
                ).response
            } catch (e: Exception) {
                emptyList()
            }
            
            // 현재 진행 중인 경기만 필터링하고 도메인 모델로 변환
            val liveFixtures = fixtures
                .filter { fixture ->
                    val status = fixture.fixture.status.short
                    status == "1H" || status == "2H" || 
                    status == "HT" || status == "ET" || 
                    status == "BT" || status == "P" ||
                    status == "LIVE"
                }
                .map { fixtureDto ->
                    // FixtureDto를 Fixture 도메인 모델로 변환
                    fixtureDto.toDomainModel()
                }
            
            _liveFixtures.value = liveFixtures
        } catch (e: Exception) {
            // 에러 무시
        }
    }
    
    /**
     * 특정 경기가 라이브인지 확인
     */
    fun isFixtureLive(fixtureId: Int): Boolean {
        return _liveFixtures.value.any { it.id == fixtureId }
    }
    
    /**
     * 라이브 경기 수 반환
     */
    fun getLiveFixtureCount(): Int {
        return _liveFixtures.value.size
    }
    
    /**
     * 서비스 정리
     */
    fun dispose() {
        stopLiveUpdates()
        scope.cancel()
    }
}