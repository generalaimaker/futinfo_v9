package com.hyunwoopark.futinfo.presentation.base

import androidx.lifecycle.ViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow

/**
 * 강제 새로고침을 지원하는 기본 ViewModel
 */
abstract class BaseViewModel : ViewModel() {
    
    // 강제 새로고침 상태
    private val _forceRefresh = MutableStateFlow(false)
    val forceRefresh = _forceRefresh.asStateFlow()
    
    /**
     * 데이터를 강제로 새로고침
     */
    open fun forceRefresh() {
        _forceRefresh.value = true
        onForceRefresh()
        _forceRefresh.value = false
    }
    
    /**
     * 하위 클래스에서 구현할 강제 새로고침 로직
     */
    protected abstract fun onForceRefresh()
    
    /**
     * 강제 새로고침 여부를 포함한 헤더 생성
     */
    protected fun createHeaders(forceRefresh: Boolean = false): Map<String, String> {
        return if (forceRefresh) {
            mapOf("X-Force-Refresh" to "true")
        } else {
            emptyMap()
        }
    }
}