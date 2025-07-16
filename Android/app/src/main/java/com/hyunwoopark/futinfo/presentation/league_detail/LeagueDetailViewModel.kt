package com.hyunwoopark.futinfo.presentation.league_detail

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.hyunwoopark.futinfo.domain.use_case.GetBracketUseCase
import com.hyunwoopark.futinfo.domain.use_case.GetFixturesUseCase
import com.hyunwoopark.futinfo.domain.use_case.GetStandingsUseCase
import com.hyunwoopark.futinfo.domain.use_case.GetTopScorersUseCase
import com.hyunwoopark.futinfo.domain.use_case.GetTopAssistsUseCase
import com.hyunwoopark.futinfo.domain.use_case.GetLeaguesUseCase
import com.hyunwoopark.futinfo.domain.use_case.GetTeamStatisticsUseCase
import com.hyunwoopark.futinfo.util.Resource
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import java.util.Calendar
import java.text.SimpleDateFormat
import java.util.Locale
import java.util.Date
import javax.inject.Inject

/**
 * 리그 상세 화면 ViewModel
 */
@HiltViewModel
class LeagueDetailViewModel @Inject constructor(
    private val getStandingsUseCase: GetStandingsUseCase,
    private val getFixturesUseCase: GetFixturesUseCase,
    private val getTopScorersUseCase: GetTopScorersUseCase,
    private val getTopAssistsUseCase: GetTopAssistsUseCase,
    private val getBracketUseCase: GetBracketUseCase,
    private val getLeaguesUseCase: GetLeaguesUseCase,
    private val getTeamStatisticsUseCase: GetTeamStatisticsUseCase
) : ViewModel() {

    private val _state = MutableStateFlow(LeagueDetailState())
    val state: StateFlow<LeagueDetailState> = _state.asStateFlow()

    /**
     * 현재 시즌을 계산합니다.
     * 7월부터 다음해 6월까지를 한 시즌으로 계산
     * 시즌 종료 직후에는 이전 시즌을 fallback으로 사용
     */
    private fun getCurrentSeason(): Int {
        val calendar = Calendar.getInstance()
        val currentYear = calendar.get(Calendar.YEAR)
        val currentMonth = calendar.get(Calendar.MONTH)
        
        val season = if (currentMonth >= Calendar.JULY) {
            currentYear
        } else {
            currentYear - 1
        }
        
        android.util.Log.d("LeagueDetailViewModel", "🔍 [DEBUG] 계산된 현재 시즌: $season (현재 년도: $currentYear, 현재 월: ${currentMonth + 1})")
        return season
    }

    /**
     * 가장 적절한 시즌을 결정합니다.
     * 현재 진행 중인 시즌이 없다면 가장 최근에 종료된 시즌을 사용
     */
    private fun getOptimalSeason(): Int {
        val currentSeason = getCurrentSeason()
        android.util.Log.d("LeagueDetailViewModel", "🔍 [DEBUG] 최적 시즌 결정 - 현재 시즌: $currentSeason")
        
        // TODO: 실제로는 API를 통해 해당 리그의 가장 최신 시즌 정보를 조회해야 함
        // 현재는 현재 시즌과 이전 시즌을 fallback으로 사용
        return currentSeason
    }

    /**
     * 리그 데이터를 로드합니다.
     * 가장 먼저 리그의 모든 시즌 정보를 가져와서 최적 시즌을 결정한 후 데이터를 조회합니다.
     */
    fun loadLeagueData(leagueId: Int, season: Int? = null) {
        android.util.Log.d("LeagueDetailViewModel", "🔍 [DEBUG] 리그 데이터 로드 시작 - leagueId: $leagueId, 요청된 season: $season")
        
        _state.value = _state.value.copy(
            leagueId = leagueId,
            season = season ?: getOptimalSeason()
        )
        
        viewModelScope.launch {
            try {
                // 1. 먼저 리그의 모든 시즌 정보를 가져옵니다
                android.util.Log.d("LeagueDetailViewModel", "🔍 [DEBUG] 1단계: 리그 시즌 정보 조회 시작")
                getLeaguesUseCase(id = leagueId).collect { result ->
                    when (result) {
                        is Resource.Loading -> {
                            android.util.Log.d("LeagueDetailViewModel", "🔍 [DEBUG] 리그 시즌 정보 로딩 중...")
                        }
                        is Resource.Success -> {
                            android.util.Log.d("LeagueDetailViewModel", "🔍 [DEBUG] 리그 시즌 정보 조회 성공")
                            
                            // 2. 사용 가능한 시즌 목록 추출
                            val availableSeasons = if (isCupCompetition(leagueId)) {
                                emptyList()
                            } else {
                                extractAvailableSeasons(result.data)
                            }
                            android.util.Log.d("LeagueDetailViewModel", "🔍 [DEBUG] 사용 가능한 시즌: $availableSeasons")
                            
                            // 3. 최적 시즌 결정
                            val optimalSeason = determineOptimalSeason(result.data, season)
                            android.util.Log.d("LeagueDetailViewModel", "🔍 [DEBUG] 2단계: 최적 시즌 결정 완료 - $optimalSeason")
                            
                            // 4. 결정된 시즌으로 상태 업데이트
                            _state.value = _state.value.copy(
                                season = optimalSeason,
                                availableSeasons = availableSeasons
                            )
                            
                            // 4. 모든 관련 데이터를 일관되게 동일한 시즌으로 조회
                            android.util.Log.d("LeagueDetailViewModel", "🔍 [DEBUG] 3단계: 시즌 $optimalSeason 으로 모든 데이터 조회 시작")
                            loadStandings(leagueId, optimalSeason)
                            loadFixtures(leagueId, optimalSeason)
                            loadTopScorers(leagueId, optimalSeason)
                            loadTopAssists(leagueId, optimalSeason)
                            loadBracket(leagueId, optimalSeason)
                            loadTeamStatistics(leagueId, optimalSeason)
                        }
                        is Resource.Error -> {
                            android.util.Log.e("LeagueDetailViewModel", "🔍 [DEBUG] 리그 시즌 정보 조회 실패: ${result.message}")
                            // 실패 시 fallback으로 기본 시즌 사용
                            val fallbackSeason = season ?: getOptimalSeason()
                            android.util.Log.w("LeagueDetailViewModel", "🔍 [DEBUG] Fallback 시즌 사용: $fallbackSeason")
                            
                            _state.value = _state.value.copy(season = fallbackSeason)
                            loadStandings(leagueId, fallbackSeason)
                            loadFixtures(leagueId, fallbackSeason)
                            loadTopScorers(leagueId, fallbackSeason)
                            loadTopAssists(leagueId, fallbackSeason)
                            loadBracket(leagueId, fallbackSeason)
                            loadTeamStatistics(leagueId, fallbackSeason)
                        }
                    }
                }
            } catch (e: Exception) {
                android.util.Log.e("LeagueDetailViewModel", "🔍 [DEBUG] 리그 데이터 로드 중 예외 발생: ${e.message}")
                // 예외 발생 시 fallback
                val fallbackSeason = season ?: getOptimalSeason()
                _state.value = _state.value.copy(season = fallbackSeason)
                loadStandings(leagueId, fallbackSeason)
                loadFixtures(leagueId, fallbackSeason)
                loadTopScorers(leagueId, fallbackSeason)
                loadTopAssists(leagueId, fallbackSeason)
                loadBracket(leagueId, fallbackSeason)
                loadTeamStatistics(leagueId, fallbackSeason)
            }
        }
    }
    
    /**
     * 리그의 시즌 정보를 기반으로 최적 시즌을 결정합니다.
     * 우선순위:
     * 1. current 플래그가 true인 시즌
     * 2. 가장 최근에 종료된 시즌 (end date가 과거인 시즌 중 가장 최신)
     */
    private fun determineOptimalSeason(
        leaguesResponse: com.hyunwoopark.futinfo.data.remote.dto.LeaguesResponseDto?,
        requestedSeason: Int?
    ): Int {
        android.util.Log.d("LeagueDetailViewModel", "🔍 [DEBUG] 최적 시즌 결정 로직 시작")
        
        // 요청된 시즌이 있으면 우선 사용
        if (requestedSeason != null) {
            android.util.Log.d("LeagueDetailViewModel", "🔍 [DEBUG] 요청된 시즌 사용: $requestedSeason")
            return requestedSeason
        }
        
        val leagueDetails = leaguesResponse?.response?.firstOrNull()
        val seasons = leagueDetails?.seasons
        
        android.util.Log.d("LeagueDetailViewModel", "🔍 [DEBUG] 조회된 시즌 목록: ${seasons?.map { "${it.year}(current:${it.current})" }}")
        
        if (seasons.isNullOrEmpty()) {
            val fallback = getOptimalSeason()
            android.util.Log.w("LeagueDetailViewModel", "🔍 [DEBUG] 시즌 정보 없음, fallback 사용: $fallback")
            return fallback
        }
        
        // 1. current 플래그가 true인 시즌 찾기
        val currentSeason = seasons.find { it.current }
        if (currentSeason != null) {
            android.util.Log.d("LeagueDetailViewModel", "🔍 [DEBUG] 현재 시즌 발견: ${currentSeason.year}")
            return currentSeason.year
        }
        
        // 2. 가장 최근에 종료된 시즌 찾기
        val today = Date()
        val dateFormat = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault())
        
        val endedSeasons = seasons.filter { season ->
            season.end?.let { endDateStr ->
                try {
                    val endDate = dateFormat.parse(endDateStr)
                    endDate?.before(today) ?: false
                } catch (e: Exception) {
                    android.util.Log.w("LeagueDetailViewModel", "🔍 [DEBUG] 날짜 파싱 실패: $endDateStr")
                    false
                }
            } ?: false
        }
        
        val mostRecentEndedSeason = endedSeasons.maxByOrNull { season ->
            try {
                dateFormat.parse(season.end!!)?.time ?: 0L
            } catch (e: Exception) {
                0L
            }
        }
        
        if (mostRecentEndedSeason != null) {
            android.util.Log.d("LeagueDetailViewModel", "🔍 [DEBUG] 가장 최근 종료된 시즌 발견: ${mostRecentEndedSeason.year}")
            return mostRecentEndedSeason.year
        }
        
        // 3. 모든 방법이 실패하면 가장 최신 시즌 사용
        val latestSeason = seasons.maxByOrNull { it.year }?.year
        if (latestSeason != null) {
            android.util.Log.d("LeagueDetailViewModel", "🔍 [DEBUG] 가장 최신 시즌 사용: $latestSeason")
            return latestSeason
        }
        
        // 4. 최종 fallback
        val finalFallback = getOptimalSeason()
        android.util.Log.w("LeagueDetailViewModel", "🔍 [DEBUG] 최종 fallback 사용: $finalFallback")
        return finalFallback
    }
    
    /**
     * 리그의 사용 가능한 시즌 목록을 추출합니다.
     */
    private fun extractAvailableSeasons(
        leaguesResponse: com.hyunwoopark.futinfo.data.remote.dto.LeaguesResponseDto?
    ): List<Int> {
        val leagueDetails = leaguesResponse?.response?.firstOrNull()
        val seasons = leagueDetails?.seasons
        
        if (seasons.isNullOrEmpty()) {
            // 기본값: 과거 10년 + 현재 + 미래 1년
            val currentYear = java.util.Calendar.getInstance().get(java.util.Calendar.YEAR)
            val currentMonth = java.util.Calendar.getInstance().get(java.util.Calendar.MONTH)
            
            // 현재 시즌 계산 (7월부터 다음 시즌)
            val currentSeason = if (currentMonth >= java.util.Calendar.JULY) currentYear else currentYear - 1
            
            // 과거 10년 + 현재 + 미래 1년
            return ((currentSeason + 1) downTo (currentSeason - 10)).toList()
        }
        
        // API에서 제공하는 시즌 목록 사용
        val availableSeasons = seasons.map { it.year }.toMutableSet()
        
        // 미래 시즌 추가 (현재 시즌 + 1)
        val currentYear = java.util.Calendar.getInstance().get(java.util.Calendar.YEAR)
        val currentMonth = java.util.Calendar.getInstance().get(java.util.Calendar.MONTH)
        val currentSeason = if (currentMonth >= java.util.Calendar.JULY) currentYear else currentYear - 1
        availableSeasons.add(currentSeason + 1) // 2025/26 시즌 추가
        
        return availableSeasons.sortedDescending()
    }
    
    /**
     * 컵 대회인지 확인합니다.
     * 컵 대회는 시즌 선택을 지원하지 않습니다.
     */
    private fun isCupCompetition(leagueId: Int): Boolean {
        return when (leagueId) {
            // 국가별 컵 대회
            525, // FA Cup
            556, // Copa del Rey
            529, // DFB Pokal
            547, // Coppa Italia
            528, // Coupe de France
            // 국제 컵 대회
            1, // World Cup
            4, // Euro Championship
            5, // Nations League
            9, // Copa America
            15, // Asian Cup / FIFA Club World Cup
            17, // AFC Asian Cup
            29, // Africa Cup of Nations
            530, // Copa Libertadores
            848 -> true // AFC Champions League
            else -> false
        }
    }
    
    /**
     * 토너먼트 형식의 리그인지 확인합니다.
     */
    private fun isTournamentLeague(leagueId: Int): Boolean {
        return when (leagueId) {
            2, // Champions League
            3, // Europa League
            848 -> true // AFC Champions League
            else -> false
        }
    }

    /**
     * 순위표를 로드합니다.
     */
    private fun loadStandings(leagueId: Int, season: Int) {
        android.util.Log.d("LeagueDetailViewModel", "🔍 [DEBUG] 순위표 로드 시작 - leagueId: $leagueId, season: $season")
        viewModelScope.launch {
            getStandingsUseCase(leagueId, season).collect { result ->
                when (result) {
                    is Resource.Loading -> {
                        android.util.Log.d("LeagueDetailViewModel", "🔍 [DEBUG] 순위표 로딩 중...")
                        _state.value = _state.value.copy(isStandingsLoading = true)
                    }
                    is Resource.Success -> {
                        android.util.Log.d("LeagueDetailViewModel", "🔍 [DEBUG] 순위표 로드 성공 - 데이터 존재: ${result.data != null}")
                        _state.value = _state.value.copy(
                            standings = result.data,
                            isStandingsLoading = false,
                            standingsError = null
                        )
                    }
                    is Resource.Error -> {
                        android.util.Log.e("LeagueDetailViewModel", "🔍 [DEBUG] 순위표 로드 실패 - 오류: ${result.message}")
                        _state.value = _state.value.copy(
                            isStandingsLoading = false,
                            standingsError = result.message
                        )
                    }
                }
            }
        }
    }

    /**
     * 경기 목록을 로드합니다.
     */
    private fun loadFixtures(leagueId: Int, season: Int) {
        viewModelScope.launch {
            getFixturesUseCase(league = leagueId, season = season).collect { result ->
                when (result) {
                    is Resource.Loading -> {
                        _state.value = _state.value.copy(isFixturesLoading = true)
                    }
                    is Resource.Success -> {
                        _state.value = _state.value.copy(
                            fixtures = result.data,
                            isFixturesLoading = false,
                            fixturesError = null
                        )
                    }
                    is Resource.Error -> {
                        _state.value = _state.value.copy(
                            isFixturesLoading = false,
                            fixturesError = result.message
                        )
                    }
                }
            }
        }
    }

    /**
     * 득점왕을 로드합니다.
     */
    private fun loadTopScorers(leagueId: Int, season: Int) {
        viewModelScope.launch {
            getTopScorersUseCase(leagueId, season).collect { result ->
                when (result) {
                    is Resource.Loading -> {
                        _state.value = _state.value.copy(isTopScorersLoading = true)
                    }
                    is Resource.Success -> {
                        _state.value = _state.value.copy(
                            topScorers = result.data,
                            isTopScorersLoading = false,
                            topScorersError = null
                        )
                    }
                    is Resource.Error -> {
                        _state.value = _state.value.copy(
                            isTopScorersLoading = false,
                            topScorersError = result.message
                        )
                    }
                }
            }
        }
    }

    /**
     * 도움왕을 로드합니다.
     */
    private fun loadTopAssists(leagueId: Int, season: Int) {
        viewModelScope.launch {
            getTopAssistsUseCase(leagueId, season).collect { result ->
                when (result) {
                    is Resource.Loading -> {
                        _state.value = _state.value.copy(isTopAssistsLoading = true)
                    }
                    is Resource.Success -> {
                        _state.value = _state.value.copy(
                            topAssists = result.data,
                            isTopAssistsLoading = false,
                            topAssistsError = null
                        )
                    }
                    is Resource.Error -> {
                        _state.value = _state.value.copy(
                            isTopAssistsLoading = false,
                            topAssistsError = result.message
                        )
                    }
                }
            }
        }
    }

    /**
     * 대진표를 로드합니다.
     */
    private fun loadBracket(leagueId: Int, season: Int) {
        android.util.Log.d("LeagueDetailViewModel", "🔍 [DEBUG] 대진표 로드 시작 - leagueId: $leagueId, season: $season")
        viewModelScope.launch {
            getBracketUseCase(leagueId, season).collect { result ->
                when (result) {
                    is Resource.Loading -> {
                        android.util.Log.d("LeagueDetailViewModel", "🔍 [DEBUG] 대진표 로딩 중...")
                        _state.value = _state.value.copy(isBracketLoading = true)
                    }
                    is Resource.Success -> {
                        android.util.Log.d("LeagueDetailViewModel", "🔍 [DEBUG] 대진표 로드 성공 - 라운드 개수: ${result.data?.rounds?.size ?: 0}")
                        _state.value = _state.value.copy(
                            bracket = result.data,
                            isBracketLoading = false,
                            bracketError = null
                        )
                    }
                    is Resource.Error -> {
                        android.util.Log.e("LeagueDetailViewModel", "🔍 [DEBUG] 대진표 로드 실패 - 오류: ${result.message}")
                        _state.value = _state.value.copy(
                            isBracketLoading = false,
                            bracketError = result.message
                        )
                    }
                }
            }
        }
    }

    /**
     * 팀 통계를 로드합니다.
     */
    private fun loadTeamStatistics(leagueId: Int, season: Int) {
        android.util.Log.d("LeagueDetailViewModel", "🔍 [DEBUG] 팀 통계 로드 시작 - leagueId: $leagueId, season: $season")
        viewModelScope.launch {
            getTeamStatisticsUseCase(leagueId, season).collect { result ->
                when (result) {
                    is Resource.Loading -> {
                        android.util.Log.d("LeagueDetailViewModel", "🔍 [DEBUG] 팀 통계 로딩 중...")
                        _state.value = _state.value.copy(isTeamStatisticsLoading = true)
                    }
                    is Resource.Success -> {
                        android.util.Log.d("LeagueDetailViewModel", "🔍 [DEBUG] 팀 통계 로드 성공 - 팀 개수: ${result.data?.size ?: 0}")
                        _state.value = _state.value.copy(
                            teamStatistics = result.data,
                            isTeamStatisticsLoading = false,
                            teamStatisticsError = null
                        )
                    }
                    is Resource.Error -> {
                        android.util.Log.e("LeagueDetailViewModel", "🔍 [DEBUG] 팀 통계 로드 실패 - 오류: ${result.message}")
                        _state.value = _state.value.copy(
                            isTeamStatisticsLoading = false,
                            teamStatisticsError = result.message
                        )
                    }
                }
            }
        }
    }

    /**
     * 선택된 탭을 변경합니다.
     */
    fun selectTab(tabIndex: Int) {
        _state.value = _state.value.copy(selectedTab = tabIndex)
    }
    
    /**
     * 시즌 선택 다이얼로그를 표시합니다.
     */
    fun showSeasonSelector() {
        android.util.Log.d("LeagueDetailViewModel", "🔍 [DEBUG] showSeasonSelector 호출됨")
        
        // 컵 대회는 시즌 선택을 지원하지 않음
        val currentLeagueId = _state.value.leagueId
        val availableSeasons = _state.value.availableSeasons
        
        android.util.Log.d("LeagueDetailViewModel", "🔍 [DEBUG] 현재 리그 ID: $currentLeagueId")
        android.util.Log.d("LeagueDetailViewModel", "🔍 [DEBUG] 사용 가능한 시즌: $availableSeasons")
        android.util.Log.d("LeagueDetailViewModel", "🔍 [DEBUG] 컵 대회 여부: ${currentLeagueId?.let { isCupCompetition(it) }}")
        
        if (currentLeagueId != null && !isCupCompetition(currentLeagueId) && availableSeasons.isNotEmpty()) {
            android.util.Log.d("LeagueDetailViewModel", "🔍 [DEBUG] 시즌 선택 다이얼로그 표시")
            _state.value = _state.value.copy(showSeasonSelector = true)
        } else {
            android.util.Log.d("LeagueDetailViewModel", "🔍 [DEBUG] 시즌 선택 불가 - 컵 대회: ${currentLeagueId?.let { isCupCompetition(it) }}, 사용 가능 시즌: ${availableSeasons.size}")
        }
    }
    
    /**
     * 시즌 선택 다이얼로그를 숨깁니다.
     */
    fun hideSeasonSelector() {
        _state.value = _state.value.copy(showSeasonSelector = false)
    }
    
    /**
     * 시즌을 변경합니다.
     */
    fun changeSeason(newSeason: Int) {
        val currentState = _state.value
        if (currentState.season != newSeason && currentState.leagueId != null) {
            android.util.Log.d("LeagueDetailViewModel", "🔍 [DEBUG] 시즌 변경: ${currentState.season} -> $newSeason")
            
            // 상태 초기화 및 새 시즌 설정
            _state.value = _state.value.copy(
                season = newSeason,
                showSeasonSelector = false,
                // 데이터 초기화
                standings = null,
                fixtures = null,
                topScorers = null,
                topAssists = null,
                teamStatistics = null,
                bracket = null,
                // 로딩 상태 설정
                isStandingsLoading = true,
                isFixturesLoading = true,
                isTopScorersLoading = true,
                isTopAssistsLoading = true,
                isTeamStatisticsLoading = true,
                isBracketLoading = true
            )
            
            // 새 시즌 데이터 로드
            viewModelScope.launch {
                android.util.Log.d("LeagueDetailViewModel", "🔍 [DEBUG] 새 시즌 데이터 로드 시작")
                
                // 모든 데이터 로드
                loadStandings(currentState.leagueId, newSeason)
                loadFixtures(currentState.leagueId, newSeason)
                loadTopScorers(currentState.leagueId, newSeason)
                loadTopAssists(currentState.leagueId, newSeason)
                loadTeamStatistics(currentState.leagueId, newSeason)
                
                // 대진표는 토너먼트 리그에서만 로드
                if (isTournamentLeague(currentState.leagueId)) {
                    loadBracket(currentState.leagueId, newSeason)
                }
            }
        }
    }

    /**
     * 데이터를 새로고침합니다.
     */
    fun refresh() {
        val currentState = _state.value
        if (currentState.leagueId != null) {
            loadLeagueData(currentState.leagueId, currentState.season)
        }
    }
    
    /**
     * 토너먼트 대진표가 아직 로드되지 않았다면 로드합니다.
     */
    fun ensureBracketLoaded() {
        val currentState = _state.value
        if (currentState.leagueId != null && 
            isTournamentLeague(currentState.leagueId) &&
            currentState.bracket == null && 
            !currentState.isBracketLoading) {
            loadBracket(currentState.leagueId, currentState.season)
        }
    }
}