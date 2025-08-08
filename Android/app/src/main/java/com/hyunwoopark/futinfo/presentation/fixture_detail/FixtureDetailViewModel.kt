package com.hyunwoopark.futinfo.presentation.fixture_detail

import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.hyunwoopark.futinfo.data.remote.dto.FixtureDto
import com.hyunwoopark.futinfo.data.remote.dto.StandingsResponseDto
import com.hyunwoopark.futinfo.domain.use_case.GetFixtureDetailUseCase
import com.hyunwoopark.futinfo.domain.use_case.GetStandingsUseCase
import com.hyunwoopark.futinfo.util.Resource
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import kotlinx.coroutines.Job
import javax.inject.Inject
import com.hyunwoopark.futinfo.data.remote.realtime.LiveMatchRealtimeService

/**
 * iOS 앱 구조를 기반으로 개선된 경기 상세 정보 화면의 ViewModel
 *
 * 동적 탭 구조와 경기 상태 기반 로직을 지원합니다.
 * - 경기 예정 시: "정보", "부상", "순위", "상대전적" 탭
 * - 경기 중/종료 시: "경기요약", "통계", "라인업", "순위", "상대전적" 탭
 */
@HiltViewModel
class FixtureDetailViewModel @Inject constructor(
    private val getFixtureDetailUseCase: GetFixtureDetailUseCase,
    private val getStandingsUseCase: GetStandingsUseCase,
    private val savedStateHandle: SavedStateHandle,
    private val realtimeService: LiveMatchRealtimeService
) : ViewModel() {
    
    private val _state = MutableStateFlow<FixtureDetailState>(FixtureDetailState.Loading)
    val state: StateFlow<FixtureDetailState> = _state.asStateFlow()
    
    // 현재 선택된 탭 인덱스
    private val _selectedTabIndex = MutableStateFlow(0)
    val selectedTabIndex: StateFlow<Int> = _selectedTabIndex.asStateFlow()
    
    // 탭별 로딩 상태
    private val _tabLoadingStates = MutableStateFlow<Map<Int, Boolean>>(emptyMap())
    val tabLoadingStates: StateFlow<Map<Int, Boolean>> = _tabLoadingStates.asStateFlow()
    
    // 순위 상태
    private val _standingsState = MutableStateFlow<Resource<StandingsResponseDto>?>(null)
    val standingsState: StateFlow<Resource<StandingsResponseDto>?> = _standingsState.asStateFlow()
    
    // 탭별 Job 관리 (이전 작업 취소를 위해)
    private val tabJobs = mutableMapOf<Int, Job>()
    
    // Realtime 구독 Job
    private var realtimeJob: Job? = null
    private var currentFixtureId: Int? = null
    
    init {
        getFixtureDetail()
        startRealtimeSubscription()
    }
    
    override fun onCleared() {
        super.onCleared()
        stopRealtimeSubscription()
    }
    
    /**
     * 경기 상태를 확인합니다.
     */
    fun isUpcoming(fixture: FixtureDto?): Boolean {
        return fixture?.fixture?.status?.short in listOf("TBD", "NS", "PST", "CANC", "ABD", "AWD", "WO")
    }
    
    fun isLive(fixture: FixtureDto?): Boolean {
        return fixture?.fixture?.status?.short in listOf("1H", "HT", "2H", "ET", "BT", "P", "SUSP", "INT", "LIVE")
    }
    
    fun isFinished(fixture: FixtureDto?): Boolean {
        return fixture?.fixture?.status?.short in listOf("FT", "AET", "PEN")
    }
    
    /**
     * 경기 상태에 따른 탭 목록을 반환합니다.
     */
    fun getTabsForFixture(fixture: FixtureDto?): List<String> {
        return when {
            isUpcoming(fixture) -> listOf("정보", "부상", "순위", "상대전적")
            isLive(fixture) || isFinished(fixture) -> listOf("정보", "통계", "라인업", "순위", "상대전적")
            else -> listOf("정보", "순위", "상대전적") // 기본값
        }
    }
    
    /**
     * 탭을 선택합니다.
     */
    fun selectTab(index: Int) {
        _selectedTabIndex.value = index
        
        // 현재 상태에서 fixture 정보를 가져와서 해당 탭의 데이터를 로드
        val currentState = _state.value
        if (currentState is FixtureDetailState.Success) {
            loadTabData(index, currentState.data.fixture)
        }
    }
    
    /**
     * 특정 탭의 데이터를 로드합니다.
     */
    private fun loadTabData(tabIndex: Int, fixture: FixtureDto?) {
        if (fixture == null) return
        
        val tabs = getTabsForFixture(fixture)
        if (tabIndex >= tabs.size) return
        
        val tabName = tabs[tabIndex]
        val fixtureId = fixture.fixture.id
        
        // 이전 탭 작업이 있다면 취소
        tabJobs[tabIndex]?.cancel()
        android.util.Log.d("FutInfo_FixtureDetail", "🔄 이전 탭 작업 취소: $tabName (tabIndex: $tabIndex)")
        
        // 탭별 로딩 상태 업데이트
        _tabLoadingStates.value = _tabLoadingStates.value.toMutableMap().apply {
            put(tabIndex, true)
        }
        
        // 새로운 Job 시작하고 저장
        val job = viewModelScope.launch {
            android.util.Log.d("FutInfo_FixtureDetail", "🔄 탭 데이터 로딩 시작: $tabName (tabIndex: $tabIndex, fixtureId: $fixtureId)")
            try {
                when (tabName) {
                    "정보" -> {
                        // 경기 상태에 따라 다른 데이터 로드
                        if (isLive(fixture) || isFinished(fixture)) {
                            android.util.Log.d("FutInfo_FixtureDetail", "📊 경기 이벤트 로딩 시작")
                            loadEventsOnly(fixtureId)
                        } else {
                            android.util.Log.d("FutInfo_FixtureDetail", "ℹ️ 경기 정보 로딩 시작")
                            loadMatchInfo(fixtureId)
                        }
                    }
                    "통계" -> {
                        android.util.Log.d("FutInfo_FixtureDetail", "📈 통계 데이터 로딩 시작")
                        loadStatisticsOnly(fixtureId)
                    }
                    "라인업" -> {
                        android.util.Log.d("FutInfo_FixtureDetail", "👥 라인업 데이터 로딩 시작")
                        loadLineupsOnly(fixtureId)
                    }
                    "부상" -> {
                        android.util.Log.d("FutInfo_FixtureDetail", "🏥 부상 정보 로딩 시작")
                        loadInjuries(fixtureId)
                    }
                    "순위" -> {
                        android.util.Log.d("FutInfo_FixtureDetail", "🏆 순위 데이터 로딩 시작")
                        loadStandings(fixture.league.id)
                    }
                    "상대전적" -> {
                        android.util.Log.d("FutInfo_FixtureDetail", "⚔️ 상대전적 데이터 로딩 시작")
                        loadHeadToHead(fixture.teams.home.id, fixture.teams.away.id)
                    }
                }
                android.util.Log.d("FutInfo_FixtureDetail", "✅ 탭 데이터 로딩 완료: $tabName")
            } catch (e: Exception) {
                android.util.Log.e("FutInfo_FixtureDetail", "❌ 탭 데이터 로딩 실패: $tabName - ${e.message}", e)
            } finally {
                // 로딩 상태 해제
                _tabLoadingStates.value = _tabLoadingStates.value.toMutableMap().apply {
                    put(tabIndex, false)
                }
                // Job 정리
                tabJobs.remove(tabIndex)
                android.util.Log.d("FutInfo_FixtureDetail", "🏁 탭 로딩 상태 해제 및 Job 정리: $tabName")
            }
        }
        
        // Job 저장
        tabJobs[tabIndex] = job
    }
    
    /**
     * 경기 상세 정보를 가져옵니다.
     */
    private fun getFixtureDetail() {
        viewModelScope.launch {
            // savedStateHandle에서 경기 ID를 가져옵니다
            val fixtureId = savedStateHandle.get<Int>("fixtureId") ?: run {
                _state.value = FixtureDetailState.Error("경기 ID가 제공되지 않았습니다")
                return@launch
            }
            
            getFixtureDetailUseCase(fixtureId).collect { resource ->
                when (resource) {
                    is Resource.Loading -> {
                        _state.value = FixtureDetailState.Loading
                    }
                    is Resource.Success -> {
                        resource.data?.let { data ->
                            _state.value = FixtureDetailState.Success(data)
                            currentFixtureId = fixtureId
                            // 첫 번째 탭의 데이터를 자동으로 로드
                            loadTabData(0, data.fixture)
                            // 라이브 경기인 경우 Realtime 구독 시작
                            if (isLive(data.fixture)) {
                                observeRealtimeUpdates(fixtureId)
                            }
                        } ?: run {
                            _state.value = FixtureDetailState.Error("데이터를 불러올 수 없습니다")
                        }
                    }
                    is Resource.Error -> {
                        _state.value = FixtureDetailState.Error(resource.message ?: "Unknown error")
                    }
                }
            }
        }
    }
    
    /**
     * 경기 상세 정보를 새로고침합니다.
     */
    fun refreshFixtureDetail() {
        getFixtureDetail()
    }
    
    /**
     * 특정 경기의 상세 정보를 로드합니다.
     */
    fun loadFixtureDetail(fixtureId: Int) {
        viewModelScope.launch {
            getFixtureDetailUseCase(fixtureId).collect { resource ->
                when (resource) {
                    is Resource.Loading -> {
                        _state.value = FixtureDetailState.Loading
                    }
                    is Resource.Success -> {
                        resource.data?.let { data ->
                            _state.value = FixtureDetailState.Success(data)
                        } ?: run {
                            _state.value = FixtureDetailState.Error("데이터를 불러올 수 없습니다")
                        }
                    }
                    is Resource.Error -> {
                        _state.value = FixtureDetailState.Error(resource.message ?: "Unknown error")
                    }
                }
            }
        }
    }
    
    /**
     * 라인업 정보만 로드합니다.
     */
    private fun loadLineupsOnly(fixtureId: Int) {
        viewModelScope.launch {
            getFixtureDetailUseCase.getLineupsOnly(fixtureId).collect { resource ->
                when (resource) {
                    is Resource.Loading -> {
                        // 개별 탭 로딩은 tabLoadingStates에서 관리
                    }
                    is Resource.Success -> {
                        resource.data?.let { data ->
                            // 현재 상태를 업데이트하되, 라인업 데이터만 갱신
                            val currentState = _state.value
                            if (currentState is FixtureDetailState.Success) {
                                _state.value = currentState.copy(
                                    data = currentState.data.copy(lineups = data.lineups)
                                )
                            }
                        }
                    }
                    is Resource.Error -> {
                        // 개별 탭 에러는 별도 처리 가능
                    }
                }
            }
        }
    }
    
    /**
     * 통계 정보만 로드합니다.
     */
    /**
     * Realtime 구독 시작
     */
    private fun startRealtimeSubscription() {
        viewModelScope.launch {
            if (!realtimeService.isConnected.value) {
                realtimeService.startRealtimeSubscription()
            }
        }
    }
    
    /**
     * Realtime 구독 중지
     */
    private fun stopRealtimeSubscription() {
        realtimeJob?.cancel()
        realtimeJob = null
    }
    
    /**
     * 특정 경기의 Realtime 업데이트 관찰
     */
    private fun observeRealtimeUpdates(fixtureId: Int) {
        realtimeJob?.cancel()
        realtimeJob = viewModelScope.launch {
            // 라이브 경기 업데이트 구독
            realtimeService.liveMatches.collect { liveMatches ->
                val liveMatch = liveMatches.find { it.fixture_id == fixtureId }
                if (liveMatch != null) {
                    updateFromLiveMatch(liveMatch)
                }
            }
        }
        
        // 이벤트 업데이트 구독
        viewModelScope.launch {
            realtimeService.matchEvents.collect { eventsMap ->
                val events = eventsMap[fixtureId]
                if (events != null) {
                    updateEvents(events)
                }
            }
        }
    }
    
    /**
     * LiveMatch 데이터로 상태 업데이트
     */
    private fun updateFromLiveMatch(liveMatch: com.hyunwoopark.futinfo.data.remote.realtime.LiveMatch) {
        val currentState = _state.value
        if (currentState is FixtureDetailState.Success) {
            val updatedFixture = currentState.data.fixture.copy(
                goals = currentState.data.fixture.goals.copy(
                    home = liveMatch.home_score,
                    away = liveMatch.away_score
                ),
                fixture = currentState.data.fixture.fixture.copy(
                    status = currentState.data.fixture.fixture.status.copy(
                        short = liveMatch.status_short,
                        long = liveMatch.status,
                        elapsed = liveMatch.elapsed
                    )
                )
            )
            
            _state.value = currentState.copy(
                data = currentState.data.copy(fixture = updatedFixture)
            )
            
            android.util.Log.d("FutInfo_Realtime", "⚽ 경기 상태 업데이트: ${liveMatch.home_team_name} ${liveMatch.home_score} - ${liveMatch.away_score} ${liveMatch.away_team_name}")
        }
    }
    
    /**
     * 이벤트 데이터 업데이트
     */
    private fun updateEvents(events: List<com.hyunwoopark.futinfo.data.remote.realtime.LiveMatchEvent>) {
        // 현재 탭이 "정보" 탭인 경우에만 이벤트 데이터 재로드
        if (_selectedTabIndex.value == 0) {
            currentFixtureId?.let { fixtureId ->
                loadEventsOnly(fixtureId)
            }
        }
        android.util.Log.d("FutInfo_Realtime", "🎯 이벤트 업데이트: ${events.size}개")
    }
    
    private fun loadStatisticsOnly(fixtureId: Int) {
        viewModelScope.launch {
            getFixtureDetailUseCase.getStatisticsOnly(fixtureId).collect { resource ->
                when (resource) {
                    is Resource.Success -> {
                        resource.data?.let { data ->
                            val currentState = _state.value
                            if (currentState is FixtureDetailState.Success) {
                                _state.value = currentState.copy(
                                    data = currentState.data.copy(statistics = data.statistics)
                                )
                            }
                        }
                    }
                    is Resource.Error -> {
                        // 개별 탭 에러 처리
                    }
                    else -> {}
                }
            }
        }
    }
    
    /**
     * 이벤트 정보만 로드합니다.
     */
    private fun loadEventsOnly(fixtureId: Int) {
        viewModelScope.launch {
            getFixtureDetailUseCase.getEventsOnly(fixtureId).collect { resource ->
                when (resource) {
                    is Resource.Success -> {
                        resource.data?.let { data ->
                            val currentState = _state.value
                            if (currentState is FixtureDetailState.Success) {
                                _state.value = currentState.copy(
                                    data = currentState.data.copy(events = data.events)
                                )
                            }
                        }
                    }
                    is Resource.Error -> {
                        // 개별 탭 에러 처리
                    }
                    else -> {}
                }
            }
        }
    }
    
    /**
     * 경기 정보를 로드합니다 (경기장, 심판 등).
     */
    private fun loadMatchInfo(fixtureId: Int) {
        // TODO: 경기 정보 로딩 구현
        // 현재는 fixture 정보에 이미 포함되어 있음
    }
    
    /**
     * 부상 정보를 로드합니다.
     */
    private fun loadInjuries(fixtureId: Int) {
        // TODO: 부상 정보 API 연동 구현
    }
    
    /**
     * 순위표를 로드합니다.
     */
    private fun loadStandings(leagueId: Int) {
        viewModelScope.launch {
            // 현재 시즌 계산 (2024년 기준)
            val currentSeason = 2024
            
            getStandingsUseCase(
                league = leagueId,
                season = currentSeason
            ).collect { resource ->
                _standingsState.value = resource
            }
        }
    }
    
    /**
     * 상대전적을 로드합니다.
     */
    private fun loadHeadToHead(homeTeamId: Int, awayTeamId: Int) {
        // TODO: 상대전적 API 연동 구현
    }
    
    /**
     * 에러 메시지를 초기화합니다.
     */
    fun clearError() {
        _state.value = FixtureDetailState.Loading
    }
}