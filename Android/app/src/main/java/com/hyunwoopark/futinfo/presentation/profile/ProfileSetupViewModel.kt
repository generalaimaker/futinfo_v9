package com.hyunwoopark.futinfo.presentation.profile

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.hyunwoopark.futinfo.domain.model.Team
import com.hyunwoopark.futinfo.domain.model.UserProfile
import com.hyunwoopark.futinfo.domain.repository.FootballRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class ProfileSetupViewModel @Inject constructor(
    private val repository: FootballRepository
) : ViewModel() {
    
    private val _state = MutableStateFlow(ProfileSetupState())
    val state: StateFlow<ProfileSetupState> = _state.asStateFlow()
    
    private var searchJob: Job? = null
    
    init {
        loadUserProfile()
        loadPopularTeams()
    }
    
    private fun loadUserProfile() {
        viewModelScope.launch {
            try {
                val profile = repository.getCurrentUserProfile()
                _state.update { it.copy(userProfile = profile) }
            } catch (e: Exception) {
                // 프로필 로드 실패 처리
            }
        }
    }
    
    private fun loadPopularTeams() {
        viewModelScope.launch {
            try {
                // 인기 팀 목록 (하드코딩)
                val popularTeams = listOf(
                    Team(
                        id = 33,
                        name = "Manchester United",
                        code = "MUN",
                        country = "England",
                        founded = 1878,
                        national = false,
                        logo = "https://media.api-sports.io/football/teams/33.png"
                    ),
                    Team(
                        id = 40,
                        name = "Liverpool",
                        code = "LIV", 
                        country = "England",
                        founded = 1892,
                        national = false,
                        logo = "https://media.api-sports.io/football/teams/40.png"
                    ),
                    Team(
                        id = 529,
                        name = "Barcelona",
                        code = "BAR",
                        country = "Spain",
                        founded = 1899,
                        national = false,
                        logo = "https://media.api-sports.io/football/teams/529.png"
                    ),
                    Team(
                        id = 541,
                        name = "Real Madrid",
                        code = "RMA",
                        country = "Spain",
                        founded = 1902,
                        national = false,
                        logo = "https://media.api-sports.io/football/teams/541.png"
                    ),
                    Team(
                        id = 157,
                        name = "Bayern Munich",
                        code = "BAY",
                        country = "Germany",
                        founded = 1900,
                        national = false,
                        logo = "https://media.api-sports.io/football/teams/157.png"
                    ),
                    Team(
                        id = 85,
                        name = "Paris Saint Germain",
                        code = "PSG",
                        country = "France",
                        founded = 1970,
                        national = false,
                        logo = "https://media.api-sports.io/football/teams/85.png"
                    )
                )
                _state.update { it.copy(popularTeams = popularTeams) }
            } catch (e: Exception) {
                // 에러 처리
            }
        }
    }
    
    fun searchTeams(query: String) {
        if (query.isBlank()) {
            _state.update { it.copy(searchResults = emptyList()) }
            return
        }
        
        searchJob?.cancel()
        searchJob = viewModelScope.launch {
            delay(300) // 디바운싱
            
            _state.update { it.copy(isSearching = true) }
            
            try {
                val results = repository.searchTeams(search = query)
                val teams = results.response?.mapNotNull { searchTeamDto ->
                    searchTeamDto.team?.toDomainModel()
                } ?: emptyList()
                _state.update { 
                    it.copy(
                        searchResults = teams,
                        isSearching = false
                    )
                }
            } catch (e: Exception) {
                _state.update { 
                    it.copy(
                        searchResults = emptyList(),
                        isSearching = false
                    )
                }
            }
        }
    }
    
    fun selectTeam(team: Team) {
        _state.update { it.copy(selectedTeam = team) }
    }
    
    fun clearSelectedTeam() {
        _state.update { it.copy(selectedTeam = null) }
    }
    
    fun completeSetup(team: Team) {
        viewModelScope.launch {
            _state.update { it.copy(isLoading = true) }
            
            try {
                val success = repository.updateUserProfile(
                    nickname = _state.value.userProfile?.nickname ?: "",
                    favoriteTeamId = team.id,
                    favoriteTeamName = team.name,
                    avatarUrl = null
                )
                
                if (success) {
                    _state.update { it.copy(isLoading = false, isSuccess = true) }
                } else {
                    _state.update { 
                        it.copy(
                            isLoading = false,
                            error = "프로필 업데이트 실패"
                        )
                    }
                }
            } catch (e: Exception) {
                _state.update { 
                    it.copy(
                        isLoading = false,
                        error = e.message ?: "프로필 설정 실패"
                    )
                }
            }
        }
    }
}

data class ProfileSetupState(
    val userProfile: UserProfile? = null,
    val selectedTeam: Team? = null,
    val popularTeams: List<Team> = emptyList(),
    val searchResults: List<Team> = emptyList(),
    val isLoading: Boolean = false,
    val isSearching: Boolean = false,
    val isSuccess: Boolean = false,
    val error: String? = null
)