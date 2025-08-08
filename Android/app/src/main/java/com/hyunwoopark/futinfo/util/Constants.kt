package com.hyunwoopark.futinfo.util

/**
 * 앱 전반에서 사용되는 상수들
 */
object Constants {
    
    /**
     * 유럽 주요 팀 ID 목록 (친선경기 우선순위용)
     * Web과 iOS와 동일한 목록 유지
     */
    val MAJOR_EUROPEAN_TEAMS = listOf(
        // 잉글랜드
        33,  // Manchester United
        40,  // Liverpool
        50,  // Manchester City
        47,  // Tottenham
        42,  // Arsenal
        49,  // Chelsea
        
        // 스페인
        529, // Barcelona
        541, // Real Madrid
        530, // Atletico Madrid
        
        // 이탈리아
        489, // AC Milan
        505, // Inter Milan
        496, // Juventus
        
        // 독일
        157, // Bayern Munich
        165, // Borussia Dortmund
        
        // 프랑스
        85   // PSG
    )
    
    /**
     * 클럽 친선경기 리그 ID
     */
    const val CLUB_FRIENDLIES_LEAGUE_ID = 667
}