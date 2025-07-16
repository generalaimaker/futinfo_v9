package com.hyunwoopark.futinfo.presentation.fixtures_overview

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.hyunwoopark.futinfo.data.local.UserLeaguePreferences
import com.hyunwoopark.futinfo.data.remote.dto.FixtureDto
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
 * iOS FixturesOverviewViewModel을 참고한 안드로이드 버전
 * 날짜별 경기 데이터를 관리하고 캐싱, 프리로딩 기능을 제공합니다.
 *
 * 주요 리그(Featured Leagues)의 경기만 표시하여 사용자 경험을 개선합니다.
 */
@HiltViewModel
class FixturesOverviewViewModel @Inject constructor(
    private val getFixturesUseCase: GetFixturesUseCase,
    private val userLeaguePreferences: UserLeaguePreferences
) : ViewModel() {
    
    private val _state = MutableStateFlow(FixturesOverviewState())
    val state: StateFlow<FixturesOverviewState> = _state.asStateFlow()
    
    // 날짜별 경기 데이터 캐시 (iOS의 fixtures: [Date: [Fixture]] 구조와 동일)
    private val fixturesCache = mutableMapOf<String, List<FixtureDto>>()
    
    // 캐시 만료 시간 관리 (iOS와 동일한 정책)
    private val cacheExpiryTimes = mutableMapOf<String, Long>()
    
    // 날짜 포맷터
    private val dateFormatter = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault())
    
    // 현재 선택된 날짜
    private var currentSelectedDate: String = dateFormatter.format(Date())
    
    // 프리로딩할 날짜 범위 (iOS와 동일하게 ±7일)
    private val preloadDaysRange = 7
    
    init {
        initializeDates()
        preloadFixtures()
    }
    
    /**
     * 날짜 목록을 초기화합니다 (오늘 기준 ±7일)
     */
    private fun initializeDates() {
        val calendar = Calendar.getInstance()
        val dates = mutableListOf<String>()
        
        // 과거 7일부터 미래 7일까지
        calendar.add(Calendar.DAY_OF_YEAR, -preloadDaysRange)
        
        for (i in 0..(preloadDaysRange * 2)) {
            dates.add(dateFormatter.format(calendar.time))
            calendar.add(Calendar.DAY_OF_YEAR, 1)
        }
        
        _state.value = _state.value.copy(
            availableDates = dates,
            selectedDate = currentSelectedDate,
            selectedDateIndex = dates.indexOf(currentSelectedDate).takeIf { it >= 0 } ?: preloadDaysRange
        )
    }
    
    /**
     * 경기 데이터를 프리로드합니다 (iOS의 preloadFixtures와 동일)
     */
    private fun preloadFixtures() {
        viewModelScope.launch {
            val today = dateFormatter.format(Date())
            
            // 오늘 경기를 먼저 로드
            loadFixturesForDate(today, isInitialLoad = true)
            
            // 백그라운드에서 인접한 날짜들을 프리로드
            val calendar = Calendar.getInstance()
            for (i in 1..preloadDaysRange) {
                // 미래 날짜들
                calendar.time = Date()
                calendar.add(Calendar.DAY_OF_YEAR, i)
                loadFixturesForDate(dateFormatter.format(calendar.time), isBackgroundLoad = true)
                
                // 과거 날짜들
                calendar.time = Date()
                calendar.add(Calendar.DAY_OF_YEAR, -i)
                loadFixturesForDate(dateFormatter.format(calendar.time), isBackgroundLoad = true)
            }
        }
    }
    
    /**
     * 특정 날짜의 주요 리그 경기를 로드합니다
     */
    private suspend fun loadFixturesForDate(
        date: String,
        isInitialLoad: Boolean = false,
        isBackgroundLoad: Boolean = false
    ) {
        // 캐시 확인 (iOS와 동일한 캐시 정책)
        if (isCacheValid(date)) {
            if (date == currentSelectedDate && !isBackgroundLoad) {
                updateStateWithCachedData(date)
            }
            return
        }
        
        // 날짜별 로딩 상태 관리
        if (!isBackgroundLoad) {
            _state.value = _state.value.copy(
                loadingDates = _state.value.loadingDates + date,
                isLoading = date == currentSelectedDate,
                errorMessage = null
            )
        }
        
        // 주요 리그 ID 목록 가져오기
        val featuredLeagueIds = userLeaguePreferences.getFixtureDisplayLeagues()
        
        if (featuredLeagueIds.isEmpty()) {
            // 주요 리그가 없는 경우 모든 경기 로드
            getFixturesUseCase(date = date).collect { resource ->
                handleFixtureResource(resource, date, isBackgroundLoad)
            }
        } else {
            // 주요 리그의 경기만 로드
            try {
                val allFixtures = mutableListOf<FixtureDto>()
                
                for (leagueId in featuredLeagueIds) {
                    getFixturesUseCase(league = leagueId, date = date).collect { resource ->
                        when (resource) {
                            is Resource.Success -> {
                                resource.data?.response?.let { fixtures ->
                                    allFixtures.addAll(fixtures)
                                }
                            }
                            is Resource.Error -> {
                                android.util.Log.e("FixturesOverviewVM", "Error loading fixtures for league $leagueId on $date: ${resource.message}")
                            }
                            else -> { /* Loading handled globally */ }
                        }
                    }
                }
                
                // 오늘 기준으로 스마트 정렬
                val sortedFixtures = sortFixturesForToday(allFixtures, date)
                
                // 캐시에 저장
                fixturesCache[date] = sortedFixtures
                setCacheExpiry(date, sortedFixtures)
                
                // 로딩 상태 해제
                _state.value = _state.value.copy(
                    loadingDates = _state.value.loadingDates - date
                )
                
                // 현재 선택된 날짜인 경우 UI 업데이트
                if (date == currentSelectedDate && !isBackgroundLoad) {
                    _state.value = _state.value.copy(
                        fixtures = sortedFixtures,
                        isLoading = false,
                        errorMessage = null
                    )
                }
                
            } catch (e: Exception) {
                // 로딩 상태 해제
                _state.value = _state.value.copy(
                    loadingDates = _state.value.loadingDates - date
                )
                
                if (!isBackgroundLoad && date == currentSelectedDate) {
                    _state.value = _state.value.copy(
                        isLoading = false,
                        errorMessage = "주요 리그 경기를 불러오는 중 오류가 발생했습니다: ${e.message}"
                    )
                }
            }
        }
    }
    
    /**
     * 경기 리소스 처리 (공통 로직)
     */
    private fun handleFixtureResource(
        resource: Resource<com.hyunwoopark.futinfo.data.remote.dto.FixturesResponseDto>,
        date: String,
        isBackgroundLoad: Boolean
    ) {
        when (resource) {
            is Resource.Loading -> {
                if (!isBackgroundLoad && date == currentSelectedDate) {
                    _state.value = _state.value.copy(isLoading = true)
                }
            }
            is Resource.Success -> {
                val fixtures = resource.data?.response ?: emptyList()
                
                // 캐시에 저장
                fixturesCache[date] = fixtures
                setCacheExpiry(date, fixtures)
                
                // 현재 선택된 날짜인 경우 UI 업데이트
                if (date == currentSelectedDate && !isBackgroundLoad) {
                    _state.value = _state.value.copy(
                        fixtures = fixtures,
                        isLoading = false,
                        errorMessage = null
                    )
                }
            }
            is Resource.Error -> {
                if (!isBackgroundLoad && date == currentSelectedDate) {
                    _state.value = _state.value.copy(
                        isLoading = false,
                        errorMessage = resource.message
                    )
                }
            }
        }
    }
    
    /**
     * 캐시 유효성 검사 (iOS와 동일한 정책)
     */
    private fun isCacheValid(date: String): Boolean {
        val cachedFixtures = fixturesCache[date] ?: return false
        val expiryTime = cacheExpiryTimes[date] ?: return false
        
        return System.currentTimeMillis() < expiryTime
    }
    
    /**
     * 캐시 만료 시간 설정 (iOS와 동일한 정책)
     */
    private fun setCacheExpiry(date: String, fixtures: List<FixtureDto>) {
        val now = System.currentTimeMillis()
        val expiryTime = when {
            // 라이브 경기가 있는 경우: 1분
            fixtures.any { isLiveMatch(it) } -> now + (1 * 60 * 1000)
            // 오늘 경기: 15분
            date == dateFormatter.format(Date()) -> now + (15 * 60 * 1000)
            // 완료된 경기: 2시간
            fixtures.any { isFinishedMatch(it) } -> now + (2 * 60 * 60 * 1000)
            // 과거 경기: 6시간
            isDateInPast(date) -> now + (6 * 60 * 60 * 1000)
            // 기본: 30분
            else -> now + (30 * 60 * 1000)
        }
        
        cacheExpiryTimes[date] = expiryTime
    }
    
    /**
     * 캐시된 데이터로 상태 업데이트
     */
    private fun updateStateWithCachedData(date: String) {
        val cachedFixtures = fixturesCache[date] ?: emptyList()
        _state.value = _state.value.copy(
            fixtures = cachedFixtures,
            isLoading = false,
            errorMessage = null
        )
    }
    
    /**
     * 날짜 선택 처리
     */
    fun selectDate(date: String, index: Int) {
        currentSelectedDate = date
        _state.value = _state.value.copy(
            selectedDate = date,
            selectedDateIndex = index
        )
        
        viewModelScope.launch {
            loadFixturesForDate(date)
        }
    }
    
    /**
     * 새로고침
     */
    fun refreshFixtures() {
        // 현재 날짜의 캐시 무효화
        fixturesCache.remove(currentSelectedDate)
        cacheExpiryTimes.remove(currentSelectedDate)
        
        viewModelScope.launch {
            loadFixturesForDate(currentSelectedDate)
        }
    }
    
    /**
     * 라이브 경기 확인
     */
    private fun isLiveMatch(fixture: FixtureDto): Boolean {
        return fixture.fixture.status.short in listOf("1H", "2H", "HT", "ET", "BT", "P")
    }
    
    /**
     * 완료된 경기 확인
     */
    private fun isFinishedMatch(fixture: FixtureDto): Boolean {
        return fixture.fixture.status.short in listOf("FT", "AET", "PEN")
    }
    
    /**
     * 과거 날짜 확인
     */
    private fun isDateInPast(date: String): Boolean {
        return try {
            val targetDate = dateFormatter.parse(date)
            val today = Date()
            targetDate?.before(today) ?: false
        } catch (e: Exception) {
            false
        }
    }
    
    /**
     * 라이브 경기 업데이트 (iOS의 LiveMatchService와 유사)
     */
    fun startLiveUpdates() {
        // TODO: 라이브 경기 폴링 구현
        // iOS의 LiveMatchService와 유사한 기능
    }
    
    /**
     * 라이브 업데이트 중지
     */
    fun stopLiveUpdates() {
        // TODO: 라이브 경기 폴링 중지
    }
    
    /**
     * 에러 메시지 초기화
     */
    fun clearError() {
        _state.value = _state.value.copy(errorMessage = null)
    }
    
    /**
     * 특정 날짜의 캐시된 경기 데이터 가져오기
     */
    fun getFixturesForDate(date: String): List<FixtureDto>? {
        return fixturesCache[date]
    }
    
    /**
     * 특정 날짜의 경기 데이터 로드 (외부에서 호출용)
     */
    fun loadFixturesForSpecificDate(date: String) {
        viewModelScope.launch {
            loadFixturesForDate(date, isBackgroundLoad = true)
        }
    }
    
    /**
     * 오늘 기준으로 경기를 스마트하게 정렬합니다.
     * 오늘 경기의 경우: 라이브 경기 → 예정 경기 → 완료 경기 순으로 정렬
     * 다른 날짜: 시간순 정렬
     */
    private fun sortFixturesForToday(fixtures: List<FixtureDto>, date: String): List<FixtureDto> {
        val today = dateFormatter.format(Date())
        
        return if (date == today) {
            // 오늘 경기는 상태별로 우선순위를 두어 정렬
            fixtures.sortedWith(compareBy<FixtureDto> { fixture ->
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