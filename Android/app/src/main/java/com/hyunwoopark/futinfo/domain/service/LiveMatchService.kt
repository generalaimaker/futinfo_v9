package com.hyunwoopark.futinfo.domain.service

import com.hyunwoopark.futinfo.data.remote.realtime.LiveMatchRealtimeService
import com.hyunwoopark.futinfo.domain.model.Fixture
// FixtureEvent import 제거 - 도메인 모델에 정의되지 않음
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
 * Realtime 기능 통합
 */
@Singleton
class LiveMatchService @Inject constructor(
    private val footballRepository: FootballRepository,
    private val realtimeService: LiveMatchRealtimeService
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
        
        // Realtime 구독 시작
        scope.launch {
            try {
                realtimeService.startRealtimeSubscription()
                
                // Realtime 업데이트 구독
                realtimeService.liveMatches.collect { realtimeMatches ->
                    if (realtimeMatches.isNotEmpty()) {
                        // Realtime 데이터를 도메인 모델로 변환
                        val domainFixtures = realtimeMatches.mapNotNull { liveMatch ->
                            convertLiveMatchToFixture(liveMatch)
                        }
                        _liveFixtures.value = domainFixtures
                    }
                }
            } catch (e: Exception) {
                // Realtime 실패 시 폴링으로 전환
                startPollingFallback()
            }
        }
        
        // 폴링도 함께 시작 (백업)
        startPollingFallback()
    }
    
    private fun startPollingFallback() {
        liveUpdateJob = scope.launch {
            while (isActive && _isLiveUpdateActive.value) {
                try {
                    // Realtime이 연결되지 않은 경우에만 폴링
                    if (!realtimeService.isConnected.value) {
                        updateLiveFixtures()
                    }
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
        
        // Realtime 구독 중지
        scope.launch {
            realtimeService.stopRealtimeSubscription()
        }
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
    
    /**
     * LiveMatch를 Fixture 도메인 모델로 변환
     */
    private fun convertLiveMatchToFixture(liveMatch: com.hyunwoopark.futinfo.data.remote.realtime.LiveMatch): Fixture? {
        return try {
            Fixture(
                id = liveMatch.fixture_id,
                date = liveMatch.match_date,
                statusLong = liveMatch.status,
                statusShort = liveMatch.status_short,
                elapsed = liveMatch.elapsed,
                venueName = liveMatch.venue_name,
                venueCity = liveMatch.venue_city,
                timezone = "UTC",
                referee = liveMatch.referee,
                leagueId = liveMatch.league_id,
                leagueName = liveMatch.league_name,
                leagueLogoUrl = "", // 별도로 가져와야 함
                leagueCountry = "",
                leagueFlag = null,
                season = 2025,
                round = liveMatch.round,
                homeTeamId = liveMatch.home_team_id,
                homeTeamName = liveMatch.home_team_name,
                homeTeamLogo = liveMatch.home_team_logo ?: "",
                homeTeamWinner = null,
                awayTeamId = liveMatch.away_team_id,
                awayTeamName = liveMatch.away_team_name,
                awayTeamLogo = liveMatch.away_team_logo ?: "",
                awayTeamWinner = null,
                homeGoals = liveMatch.home_score,
                awayGoals = liveMatch.away_score
            )
        } catch (e: Exception) {
            null
        }
    }
}