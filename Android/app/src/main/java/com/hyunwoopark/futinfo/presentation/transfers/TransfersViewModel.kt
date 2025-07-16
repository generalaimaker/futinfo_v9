package com.hyunwoopark.futinfo.presentation.transfers

import androidx.compose.runtime.State
import androidx.compose.runtime.mutableStateOf
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.hyunwoopark.futinfo.domain.model.Transfer
import com.hyunwoopark.futinfo.domain.model.TransferStatus
import com.hyunwoopark.futinfo.domain.use_case.GetTransfersUseCase
import com.hyunwoopark.futinfo.util.Resource
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.launchIn
import kotlinx.coroutines.flow.onEach
import kotlinx.coroutines.launch
import javax.inject.Inject

/**
 * 이적 시장 화면의 ViewModel
 * 이적 정보의 상태 관리와 비즈니스 로직을 처리합니다.
 */
@HiltViewModel
class TransfersViewModel @Inject constructor(
    private val getTransfersUseCase: GetTransfersUseCase
) : ViewModel() {
    
    private val _state = mutableStateOf(TransfersState())
    val state: State<TransfersState> = _state
    
    private var getTransfersJob: Job? = null
    private var searchJob: Job? = null
    
    init {
        getTransfers()
    }
    
    /**
     * 이적 정보를 가져옵니다.
     */
    fun getTransfers() {
        getTransfersJob?.cancel()
        getTransfersJob = getTransfersUseCase()
            .onEach { result ->
                when (result) {
                    is Resource.Success -> {
                        _state.value = _state.value.copy(
                            transfers = result.data ?: emptyList(),
                            isLoading = false,
                            isRefreshing = false,
                            error = ""
                        )
                    }
                    is Resource.Error -> {
                        _state.value = _state.value.copy(
                            isLoading = false,
                            isRefreshing = false,
                            error = result.message ?: "알 수 없는 오류가 발생했습니다."
                        )
                    }
                    is Resource.Loading -> {
                        _state.value = _state.value.copy(
                            isLoading = true,
                            error = ""
                        )
                    }
                }
            }.launchIn(viewModelScope)
    }
    
    /**
     * 이적 정보를 새로고침합니다.
     */
    fun refreshTransfers() {
        _state.value = _state.value.copy(isRefreshing = true)
        getTransfers()
    }
    
    /**
     * 필터를 변경합니다.
     */
    fun onFilterChanged(filter: TransferFilter) {
        _state.value = _state.value.copy(selectedFilter = filter)
    }
    
    /**
     * 검색어를 변경합니다.
     */
    fun onSearchQueryChanged(query: String) {
        _state.value = _state.value.copy(searchQuery = query)
        
        // 검색어 변경 시 디바운싱 적용
        searchJob?.cancel()
        searchJob = viewModelScope.launch {
            delay(300) // 300ms 디바운싱
            // 실제 검색 로직은 여기에 구현
        }
    }
    
    /**
     * 에러 메시지를 초기화합니다.
     */
    fun clearError() {
        _state.value = _state.value.copy(error = "")
    }
    
    /**
     * 현재 필터와 검색어에 따라 필터링된 이적 목록을 반환합니다.
     */
    fun getFilteredTransfers(): List<Transfer> {
        val currentState = _state.value
        var filteredTransfers = currentState.transfers
        
        // 상태별 필터링
        if (currentState.selectedFilter != TransferFilter.ALL) {
            filteredTransfers = filteredTransfers.filter { transfer ->
                when (currentState.selectedFilter) {
                    TransferFilter.COMPLETED -> transfer.status == TransferStatus.COMPLETED
                    TransferFilter.IN_PROGRESS -> transfer.status == TransferStatus.IN_PROGRESS
                    TransferFilter.NEGOTIATING -> transfer.status == TransferStatus.NEGOTIATING
                    TransferFilter.RUMOR -> transfer.status == TransferStatus.RUMOR
                    TransferFilter.INTERESTED -> transfer.status == TransferStatus.INTERESTED
                    TransferFilter.ALL -> true
                }
            }
        }
        
        // 검색어 필터링
        if (currentState.searchQuery.isNotBlank()) {
            val query = currentState.searchQuery.lowercase()
            filteredTransfers = filteredTransfers.filter { transfer ->
                transfer.playerName.lowercase().contains(query) ||
                transfer.fromClub.lowercase().contains(query) ||
                transfer.toClub.lowercase().contains(query) ||
                transfer.league.lowercase().contains(query) ||
                transfer.position.lowercase().contains(query) ||
                transfer.nationality.lowercase().contains(query)
            }
        }
        
        return filteredTransfers.sortedByDescending { it.transferDate }
    }
    
    /**
     * 이적 상태별 개수를 반환합니다.
     */
    fun getTransferCountByStatus(): Map<TransferFilter, Int> {
        val transfers = _state.value.transfers
        return mapOf(
            TransferFilter.ALL to transfers.size,
            TransferFilter.COMPLETED to transfers.count { it.status == TransferStatus.COMPLETED },
            TransferFilter.IN_PROGRESS to transfers.count { it.status == TransferStatus.IN_PROGRESS },
            TransferFilter.NEGOTIATING to transfers.count { it.status == TransferStatus.NEGOTIATING },
            TransferFilter.RUMOR to transfers.count { it.status == TransferStatus.RUMOR },
            TransferFilter.INTERESTED to transfers.count { it.status == TransferStatus.INTERESTED }
        )
    }
    
    override fun onCleared() {
        super.onCleared()
        getTransfersJob?.cancel()
        searchJob?.cancel()
    }
}