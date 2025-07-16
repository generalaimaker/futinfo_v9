package com.hyunwoopark.futinfo.presentation.team_profile

import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.hyunwoopark.futinfo.domain.use_case.AddFavoriteUseCase
import com.hyunwoopark.futinfo.domain.use_case.GetTeamProfileUseCase
import com.hyunwoopark.futinfo.domain.use_case.IsFavoriteUseCase
import com.hyunwoopark.futinfo.domain.use_case.RemoveFavoriteUseCase
import com.hyunwoopark.futinfo.domain.use_case.GetStandingsUseCase
import com.hyunwoopark.futinfo.domain.use_case.GetFixturesUseCase
import com.hyunwoopark.futinfo.util.Resource
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.launch
import javax.inject.Inject
import java.text.SimpleDateFormat
import java.util.*

/**
 * 팀 프로필 화면의 ViewModel
 * 
 * GetTeamProfileUseCase를 사용하여 팀 프로필 데이터를 가져오고,
 * StateFlow를 통해 UI 상태를 관리합니다.
 */
@HiltViewModel
class TeamProfileViewModel @Inject constructor(
    private val getTeamProfileUseCase: GetTeamProfileUseCase,
    private val addFavoriteUseCase: AddFavoriteUseCase,
    private val removeFavoriteUseCase: RemoveFavoriteUseCase,
    private val isFavoriteUseCase: IsFavoriteUseCase,
    private val getStandingsUseCase: GetStandingsUseCase,
    private val getFixturesUseCase: GetFixturesUseCase,
    private val savedStateHandle: SavedStateHandle
) : ViewModel() {
    
    private val _state = MutableStateFlow(TeamProfileState())
    val state: StateFlow<TeamProfileState> = _state.asStateFlow()
    
    private var currentTeamId: Int = 33 // 기본값
    
    init {
        getTeamProfile()
    }
    
    /**
     * 팀 프로필 정보를 가져옵니다.
     * SavedStateHandle에서 팀 ID를 추출하여 사용합니다.
     */
    private fun getTeamProfile() {
        viewModelScope.launch {
            // SavedStateHandle에서 팀 ID를 가져옴
            val teamId = savedStateHandle.get<Int>("teamId") ?: return@launch
            currentTeamId = teamId
            
            // 팀 프로필과 즐겨찾기 상태 가져오기
            combine(
                getTeamProfileUseCase(
                    teamId = teamId,
                    season = 2024 // 현재 시즌
                ),
                isFavoriteUseCase.isTeamFavorite(teamId)
            ) { profileResource, isFavorite ->
                when (profileResource) {
                    is Resource.Loading -> {
                        _state.value = _state.value.copy(
                            isLoading = true,
                            errorMessage = null
                        )
                    }
                    is Resource.Success -> {
                        _state.value = _state.value.copy(
                            teamProfile = profileResource.data,
                            isLoading = false,
                            errorMessage = null,
                            isFavorite = isFavorite
                        )
                        
                        // 팀 프로필 로드 성공 시 추가 데이터 로드
                        profileResource.data?.let { profile ->
                            loadAdditionalTeamData(teamId, profile.leagueId)
                        }
                    }
                    is Resource.Error -> {
                        _state.value = _state.value.copy(
                            isLoading = false,
                            errorMessage = profileResource.message,
                            isFavorite = isFavorite
                        )
                    }
                }
            }.collect { }
        }
    }
    
    /**
     * 팀의 추가 데이터(순위표, 경기 일정)를 로드합니다.
     */
    private fun loadAdditionalTeamData(teamId: Int, leagueId: Int?) {
        // 순위표 로드
        leagueId?.let { 
            loadStandings(it, 2024)
        }
        
        // 경기 일정 로드
        loadTeamFixtures(teamId, 2024)
    }
    
    /**
     * 리그 순위표를 로드합니다.
     */
    private fun loadStandings(leagueId: Int, season: Int) {
        viewModelScope.launch {
            _state.value = _state.value.copy(isStandingsLoading = true)
            
            getStandingsUseCase(leagueId, season).collect { resource ->
                when (resource) {
                    is Resource.Success -> {
                        // StandingsResponseDto에서 첫 번째 리그의 순위표 가져오기
                        val standingsList = resource.data?.response?.firstOrNull()?.league?.standings?.firstOrNull()
                        _state.value = _state.value.copy(
                            standings = standingsList,
                            isStandingsLoading = false
                        )
                    }
                    is Resource.Error -> {
                        _state.value = _state.value.copy(
                            isStandingsLoading = false
                        )
                    }
                    is Resource.Loading -> {
                        // Loading state already set
                    }
                }
            }
        }
    }
    
    /**
     * 팀의 경기 일정을 로드합니다.
     */
    private fun loadTeamFixtures(teamId: Int, season: Int) {
        viewModelScope.launch {
            _state.value = _state.value.copy(isFixturesLoading = true)
            
            // 현재 날짜 기준으로 최근 경기와 예정 경기 구분
            val currentDate = Date()
            val dateFormat = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ssXXX", Locale.getDefault())
            
            getFixturesUseCase(
                team = teamId,
                season = season
            ).collect { resource ->
                when (resource) {
                    is Resource.Success -> {
                        val fixturesResponse = resource.data
                        val fixtures = fixturesResponse?.response ?: emptyList()
                        
                        val recentList = mutableListOf<com.hyunwoopark.futinfo.data.remote.dto.FixtureDto>()
                        val upcomingList = mutableListOf<com.hyunwoopark.futinfo.data.remote.dto.FixtureDto>()
                        
                        fixtures.forEach { fixture ->
                            try {
                                val fixtureDate = dateFormat.parse(fixture.fixture.date)
                                if (fixtureDate?.before(currentDate) == true) {
                                    recentList.add(fixture)
                                } else {
                                    upcomingList.add(fixture)
                                }
                            } catch (e: Exception) {
                                // 날짜 파싱 실패 시 무시
                            }
                        }
                        
                        _state.value = _state.value.copy(
                            recentFixtures = recentList.sortedByDescending { it.fixture.date }.take(5),
                            upcomingFixtures = upcomingList.sortedBy { it.fixture.date }.take(5),
                            isFixturesLoading = false
                        )
                    }
                    is Resource.Error -> {
                        _state.value = _state.value.copy(
                            isFixturesLoading = false
                        )
                    }
                    is Resource.Loading -> {
                        // Loading state already set
                    }
                }
            }
        }
    }
    
    /**
     * 팀 프로필 정보를 새로고침합니다.
     */
    fun refreshTeamProfile() {
        getTeamProfile()
    }
    
    /**
     * 특정 팀의 프로필을 로드합니다.
     * 
     * @param teamId 팀 ID
     * @param season 시즌 (기본값: 2024)
     */
    fun loadTeamProfile(teamId: Int, season: Int = 2024) {
        viewModelScope.launch {
            currentTeamId = teamId
            
            combine(
                getTeamProfileUseCase(
                    teamId = teamId,
                    season = season
                ),
                isFavoriteUseCase.isTeamFavorite(teamId)
            ) { profileResource, isFavorite ->
                when (profileResource) {
                    is Resource.Loading -> {
                        _state.value = _state.value.copy(
                            isLoading = true,
                            errorMessage = null
                        )
                    }
                    is Resource.Success -> {
                        _state.value = _state.value.copy(
                            teamProfile = profileResource.data,
                            isLoading = false,
                            errorMessage = null,
                            isFavorite = isFavorite
                        )
                        
                        // 팀 프로필 로드 성공 시 추가 데이터 로드
                        profileResource.data?.let { profile ->
                            loadAdditionalTeamData(teamId, profile.leagueId)
                        }
                    }
                    is Resource.Error -> {
                        _state.value = _state.value.copy(
                            isLoading = false,
                            errorMessage = profileResource.message,
                            isFavorite = isFavorite
                        )
                    }
                }
            }.collect { }
        }
    }
    
    /**
     * 에러 메시지를 초기화합니다.
     */
    fun clearError() {
        _state.value = _state.value.copy(errorMessage = null)
    }
    
    /**
     * 팀을 즐겨찾기에 추가하거나 제거합니다.
     */
    fun toggleFavorite() {
        val teamProfile = _state.value.teamProfile ?: return
        
        viewModelScope.launch {
            try {
                _state.value = _state.value.copy(isFavoriteLoading = true)
                
                if (_state.value.isFavorite) {
                    // 즐겨찾기에서 제거
                    removeFavoriteUseCase.removeTeam(currentTeamId)
                } else {
                    // 즐겨찾기에 추가
                    addFavoriteUseCase.addTeam(
                        teamId = currentTeamId,
                        name = teamProfile.teamName,
                        imageUrl = teamProfile.teamLogo
                    )
                }
                
                _state.value = _state.value.copy(
                    isFavorite = !_state.value.isFavorite,
                    isFavoriteLoading = false
                )
            } catch (e: Exception) {
                _state.value = _state.value.copy(
                    isFavoriteLoading = false,
                    errorMessage = e.message ?: "즐겨찾기 처리 중 오류가 발생했습니다."
                )
            }
        }
    }
}