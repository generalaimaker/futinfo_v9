package com.hyunwoopark.futinfo.util

import android.util.Log

/**
 * 리그 로고 매핑 유틸리티
 * API에서 잘못된 로고를 반환하는 경우 올바른 로고 URL로 매핑
 */
object LeagueLogoMapper {
    
    /**
     * 리그 ID와 이름을 기반으로 올바른 로고 URL 반환
     */
    fun getCorrectLogoUrl(leagueId: Int, leagueName: String, defaultLogoUrl: String?): String? {
        // 디버깅을 위한 로그
        Log.d("LeagueLogoMapper", "League ID: $leagueId, Name: $leagueName, Default Logo: $defaultLogoUrl")
        
        // API로부터 받은 로고 URL이 잘못된 경우를 확인
        if (defaultLogoUrl?.contains("848") == true && leagueName.contains("Club World Cup", ignoreCase = true)) {
            // AFC Champions League 로고(848)가 클럽월드컵에 잘못 사용된 경우
            Log.d("LeagueLogoMapper", "Wrong logo detected for Club World Cup - fixing it")
            return "https://media-4.api-sports.io/football/leagues/15.png"
        }
        
        // 클럽월드컵 특별 처리 - API에서 잘못된 로고를 반환하는 경우가 있음
        if (leagueName.contains("Club World Cup", ignoreCase = true) || 
            leagueName.contains("FIFA Club World Cup", ignoreCase = true)) {
            Log.d("LeagueLogoMapper", "Detected Club World Cup - forcing correct logo")
            // 클럽월드컵의 정확한 ID는 15
            return "https://media-4.api-sports.io/football/leagues/15.png"
        }
        
        // 리그 ID 기반 로고 매핑 (기본 로고가 없는 경우)
        if (defaultLogoUrl.isNullOrEmpty()) {
            return when (leagueId) {
            // 주요 리그
            39 -> "https://media-4.api-sports.io/football/leagues/39.png" // 프리미어리그
            140 -> "https://media-4.api-sports.io/football/leagues/140.png" // 라리가
            135 -> "https://media-4.api-sports.io/football/leagues/135.png" // 세리에 A
            78 -> "https://media-4.api-sports.io/football/leagues/78.png" // 분데스리가
            61 -> "https://media-4.api-sports.io/football/leagues/61.png" // 리그 1
            
            // UEFA 대회
            2 -> "https://media-4.api-sports.io/football/leagues/2.png" // 챔피언스리그
            3 -> "https://media-4.api-sports.io/football/leagues/3.png" // 유로파리그
            4 -> "https://media-4.api-sports.io/football/leagues/4.png" // 컨퍼런스리그
            
            // 국가대표 대회
            1 -> "https://media-4.api-sports.io/football/leagues/1.png" // 월드컵
            5 -> "https://media-4.api-sports.io/football/leagues/5.png" // 유로
            9 -> "https://media-4.api-sports.io/football/leagues/9.png" // 코파 아메리카
            15 -> {
                // League ID 15는 이름에 따라 다른 대회일 수 있음
                if (leagueName.contains("Club World Cup", ignoreCase = true)) {
                    "https://media-4.api-sports.io/football/leagues/15.png" // 클럽월드컵
                } else {
                    "https://media-4.api-sports.io/football/leagues/15.png" // 기타 (아시안컵 등)
                }
            }
            17 -> "https://media-4.api-sports.io/football/leagues/17.png" // 알 수 없음
            372 -> "https://media-4.api-sports.io/football/leagues/372.png" // 다른 대회
            
            // 아시아 대회
            848 -> "https://media-4.api-sports.io/football/leagues/848.png" // AFC 챔피언스리그
            
            // K리그
            292 -> "https://media-4.api-sports.io/football/leagues/292.png" // K리그 1
            293 -> "https://media-4.api-sports.io/football/leagues/293.png" // K리그 2
            
            // 기타 주요 리그들
            88 -> "https://media-4.api-sports.io/football/leagues/88.png" // 에레디비시
            94 -> "https://media-4.api-sports.io/football/leagues/94.png" // 프리메이라리가
            144 -> "https://media-4.api-sports.io/football/leagues/144.png" // 주피터리그
            203 -> "https://media-4.api-sports.io/football/leagues/203.png" // 쉬페르리그
            179 -> "https://media-4.api-sports.io/football/leagues/179.png" // 슈퍼리그
            
            // 기타 리그는 기본 로고 사용
            else -> "https://media-4.api-sports.io/football/leagues/$leagueId.png"
            }
        }
        
        // 기본 로고가 있으면 그대로 사용
        return defaultLogoUrl
    }
    
    /**
     * 리그 탭에서 사용할 로고 URL 반환
     * 일부 리그는 더 보기 좋은 대체 로고 사용
     */
    fun getLeagueTabLogoUrl(leagueId: Int): String {
        return when (leagueId) {
            // 주요 리그
            39 -> "https://media-4.api-sports.io/football/leagues/39.png"
            140 -> "https://media-4.api-sports.io/football/leagues/140.png"
            135 -> "https://media-4.api-sports.io/football/leagues/135.png"
            78 -> "https://media-4.api-sports.io/football/leagues/78.png"
            61 -> "https://media-4.api-sports.io/football/leagues/61.png"
            
            // UEFA 대회
            2 -> "https://media-4.api-sports.io/football/leagues/2.png"
            3 -> "https://media-4.api-sports.io/football/leagues/3.png"
            4 -> "https://media-4.api-sports.io/football/leagues/4.png"
            
            // 국가대표 대회
            1 -> "https://media-4.api-sports.io/football/leagues/1.png"
            5 -> "https://media-4.api-sports.io/football/leagues/5.png"
            9 -> "https://media-4.api-sports.io/football/leagues/9.png"
            15 -> "https://media-4.api-sports.io/football/leagues/15.png"
            17 -> "https://media-4.api-sports.io/football/leagues/17.png"
            372 -> "https://media-4.api-sports.io/football/leagues/372.png"
            
            // 아시아 대회
            848 -> "https://media-4.api-sports.io/football/leagues/848.png"
            
            // K리그
            292 -> "https://media-4.api-sports.io/football/leagues/292.png"
            293 -> "https://media-4.api-sports.io/football/leagues/293.png"
            
            else -> "https://media-4.api-sports.io/football/leagues/$leagueId.png"
        }
    }
}