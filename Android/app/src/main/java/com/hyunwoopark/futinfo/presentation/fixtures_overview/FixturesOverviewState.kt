package com.hyunwoopark.futinfo.presentation.fixtures_overview

import com.hyunwoopark.futinfo.data.remote.dto.FixtureDto

/**
 * iOS FixturesOverviewView의 상태를 참고한 안드로이드 상태 클래스
 * 날짜별 경기 데이터와 UI 상태를 관리합니다.
 */
data class FixturesOverviewState(
    // 현재 표시할 경기 목록
    val fixtures: List<FixtureDto> = emptyList(),
    
    // 사용 가능한 날짜 목록 (오늘 기준 ±7일)
    val availableDates: List<String> = emptyList(),
    
    // 현재 선택된 날짜
    val selectedDate: String = "",
    
    // 선택된 날짜의 인덱스 (HorizontalPager용)
    val selectedDateIndex: Int = 0,
    
    // 로딩 상태
    val isLoading: Boolean = false,
    
    // 날짜별 로딩 상태 (각 날짜가 개별적으로 로딩될 수 있음)
    val loadingDates: Set<String> = emptySet(),
    
    // 에러 메시지
    val errorMessage: String? = null,
    
    // 라이브 경기 업데이트 상태
    val isLiveUpdating: Boolean = false,
    
    // 새로고침 상태
    val isRefreshing: Boolean = false
)