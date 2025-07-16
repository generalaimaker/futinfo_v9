package com.hyunwoopark.futinfo.presentation.fixtures

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.hyunwoopark.futinfo.data.local.UserLeaguePreferences
import com.hyunwoopark.futinfo.domain.use_case.GetFixturesUseCase
import com.hyunwoopark.futinfo.util.Resource
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.*
import javax.inject.Inject

/**
 * 경기 목록 화면의 ViewModel
 *
 * GetFixturesUseCase를 사용하여 경기 데이터를 가져오고,
 * StateFlow를 통해 UI 상태를 관리합니다.
 *
 * 주요 리그(Featured Leagues)의 경기만 표시하여 사용자 경험을 개선합니다.
 */
@HiltViewModel
class FixturesViewModel @Inject constructor(
    private val getFixturesUseCase: GetFixturesUseCase,
    private val userLeaguePreferences: UserLeaguePreferences
) : ViewModel() {
    
    private val _state = MutableStateFlow(FixturesState())
    val state: StateFlow<FixturesState> = _state.asStateFlow()
    
    init {
        // 초기화 시 주요 리그의 오늘 날짜 경기를 가져옵니다
        getFeaturedLeaguesTodayFixtures()
    }
    
    /**
     * 주요 리그의 오늘 날짜 경기 목록을 가져옵니다.
     */
    private fun getFeaturedLeaguesTodayFixtures() {
        val dateFormat = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault())
        val today = dateFormat.format(Date())
        getFeaturedLeaguesFixtures(date = today)
    }
    
    /**
     * 오늘 날짜의 경기 목록을 가져옵니다 (모든 리그).
     */
    private fun getTodayFixtures() {
        val dateFormat = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault())
        val today = dateFormat.format(Date())
        getFixtures(date = today)
    }
    
    /**
     * 경기 목록을 가져옵니다.
     * 
     * @param id 특정 경기 ID (선택사항)
     * @param live 라이브 경기만 조회 (선택사항)
     * @param date 특정 날짜의 경기 (YYYY-MM-DD 형식) (선택사항)
     * @param league 리그 ID (선택사항)
     * @param season 시즌 (선택사항)
     * @param team 팀 ID (선택사항)
     * @param last 최근 N개 경기 (선택사항)
     * @param next 다음 N개 경기 (선택사항)
     * @param from 시작 날짜 (YYYY-MM-DD 형식) (선택사항)
     * @param to 종료 날짜 (YYYY-MM-DD 형식) (선택사항)
     * @param round 라운드 (선택사항)
     * @param status 경기 상태 (선택사항)
     * @param venue 경기장 ID (선택사항)
     * @param timezone 시간대 (선택사항)
     */
    fun getFixtures(
        id: Int? = null,
        live: String? = null,
        date: String? = null,
        league: Int? = null,
        season: Int? = null,
        team: Int? = null,
        last: Int? = null,
        next: Int? = null,
        from: String? = null,
        to: String? = null,
        round: String? = null,
        status: String? = null,
        venue: Int? = null,
        timezone: String? = null
    ) {
        viewModelScope.launch {
            getFixturesUseCase(
                id = id,
                live = live,
                date = date,
                league = league,
                season = season,
                team = team,
                last = last,
                next = next,
                from = from,
                to = to,
                round = round,
                status = status,
                venue = venue,
                timezone = timezone
            ).collect { resource ->
                when (resource) {
                    is Resource.Loading -> {
                        _state.value = _state.value.copy(
                            isLoading = true,
                            errorMessage = null
                        )
                    }
                    is Resource.Success -> {
                        _state.value = _state.value.copy(
                            fixtures = resource.data?.response ?: emptyList(),
                            isLoading = false,
                            errorMessage = null
                        )
                    }
                    is Resource.Error -> {
                        _state.value = _state.value.copy(
                            isLoading = false,
                            errorMessage = resource.message
                        )
                    }
                }
            }
        }
    }
    
    /**
     * 특정 날짜의 경기 목록을 가져옵니다.
     * 
     * @param date 날짜 (YYYY-MM-DD 형식)
     */
    fun getFixturesByDate(date: String) {
        getFixtures(date = date)
    }
    
    /**
     * 특정 리그의 경기 목록을 가져옵니다.
     * 
     * @param leagueId 리그 ID
     * @param season 시즌 (선택사항)
     */
    fun getFixturesByLeague(leagueId: Int, season: Int? = null) {
        getFixtures(league = leagueId, season = season)
    }
    
    /**
     * 특정 팀의 경기 목록을 가져옵니다.
     * 
     * @param teamId 팀 ID
     * @param season 시즌 (선택사항)
     */
    fun getFixturesByTeam(teamId: Int, season: Int? = null) {
        getFixtures(team = teamId, season = season)
    }
    
    /**
     * 라이브 경기 목록을 가져옵니다.
     */
    fun getLiveFixtures() {
        getFixtures(live = "all")
    }
    
    /**
     * 주요 리그의 경기 목록을 가져옵니다.
     *
     * @param date 특정 날짜의 경기 (YYYY-MM-DD 형식) (선택사항)
     * @param from 시작 날짜 (YYYY-MM-DD 형식) (선택사항)
     * @param to 종료 날짜 (YYYY-MM-DD 형식) (선택사항)
     */
    fun getFeaturedLeaguesFixtures(
        date: String? = null,
        from: String? = null,
        to: String? = null
    ) {
        viewModelScope.launch {
            val featuredLeagueIds = userLeaguePreferences.getFixtureDisplayLeagues()
            
            // 주요 리그가 없는 경우 기본 리그 사용
            if (featuredLeagueIds.isEmpty()) {
                android.util.Log.w("FixturesViewModel", "No featured leagues found, loading all fixtures")
                getFixtures(date = date, from = from, to = to)
                return@launch
            }
            
            _state.value = _state.value.copy(
                isLoading = true,
                errorMessage = null
            )
            
            try {
                // 각 주요 리그별로 경기를 가져와서 합치기
                val allFixtures = mutableListOf<com.hyunwoopark.futinfo.data.remote.dto.FixtureDto>()
                
                for (leagueId in featuredLeagueIds) {
                    getFixturesUseCase(
                        league = leagueId,
                        date = date,
                        from = from,
                        to = to
                    ).collect { resource ->
                        when (resource) {
                            is Resource.Success -> {
                                resource.data?.response?.let { fixtures ->
                                    allFixtures.addAll(fixtures)
                                }
                            }
                            is Resource.Error -> {
                                android.util.Log.e("FixturesViewModel", "Error loading fixtures for league $leagueId: ${resource.message}")
                            }
                            else -> { /* Loading state handled globally */ }
                        }
                    }
                }
                
                // 오늘 기준으로 스마트 정렬
                val sortedFixtures = sortFixturesForToday(allFixtures, date)
                
                _state.value = _state.value.copy(
                    fixtures = sortedFixtures,
                    isLoading = false,
                    errorMessage = null
                )
                
            } catch (e: Exception) {
                _state.value = _state.value.copy(
                    isLoading = false,
                    errorMessage = "주요 리그 경기를 불러오는 중 오류가 발생했습니다: ${e.message}"
                )
            }
        }
    }
    
    /**
     * 특정 날짜의 주요 리그 경기 목록을 가져옵니다.
     *
     * @param date 날짜 (YYYY-MM-DD 형식)
     */
    fun getFeaturedLeaguesFixturesByDate(date: String) {
        getFeaturedLeaguesFixtures(date = date)
    }
    
    /**
     * 경기 목록을 새로고침합니다.
     * 현재 상태를 유지하면서 다시 로드합니다.
     */
    fun refreshFixtures() {
        getFeaturedLeaguesTodayFixtures()
    }
    
    /**
     * 모든 리그의 경기를 새로고침합니다 (필요시 사용).
     */
    fun refreshAllFixtures() {
        getTodayFixtures()
    }
    
    /**
     * 에러 메시지를 초기화합니다.
     */
    fun clearError() {
        _state.value = _state.value.copy(errorMessage = null)
    }
    
    /**
     * 오늘 기준으로 경기를 스마트하게 정렬합니다.
     * 오늘 경기의 경우: 라이브 경기 → 예정 경기 → 완료 경기 순으로 정렬
     * 다른 날짜: 시간순 정렬
     */
    private fun sortFixturesForToday(fixtures: List<com.hyunwoopark.futinfo.data.remote.dto.FixtureDto>, date: String?): List<com.hyunwoopark.futinfo.data.remote.dto.FixtureDto> {
        val dateFormat = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault())
        val today = dateFormat.format(Date())
        
        return if (date == today) {
            // 오늘 경기는 상태별로 우선순위를 두어 정렬
            fixtures.sortedWith(compareBy<com.hyunwoopark.futinfo.data.remote.dto.FixtureDto> { fixture ->
                when (fixture.fixture.status.short) {
                    // 라이브 경기가 최우선
                    "1H", "2H", "HT", "ET", "BT", "P" -> 0
                    // 예정 경기가 두 번째
                    "NS", "TBD" -> 1
                    // 완료 경기가 마지막
                    "FT", "AET", "PEN" -> 2
                    // 기타 상태
                    else -> 3
                }
            }.thenBy { fixture ->
                // 같은 상태 내에서는 시간순 정렬
                fixture.fixture.date
            })
        } else {
            // 다른 날짜는 단순히 시간순 정렬
            fixtures.sortedBy { it.fixture.date }
        }
    }
}