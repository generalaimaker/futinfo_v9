package com.hyunwoopark.futinfo.util

import android.util.Log

/**
 * 리그명 한글화 유틸리티
 * API에서 받은 리그 ID와 이름을 한글로 변환
 */
object LeagueNameLocalizer {
    
    /**
     * 리그 ID와 기본 이름을 받아 한글화된 이름 반환
     */
    fun getLocalizedName(leagueId: Int, defaultName: String): String {
        // 디버깅을 위한 로그
        Log.d("LeagueNameLocalizer", "League ID: $leagueId, Default Name: $defaultName")
        
        // 클럽월드컵 특별 처리 - API 이름으로도 체크
        if (defaultName.contains("Club World Cup", ignoreCase = true) || 
            defaultName.contains("FIFA Club World Cup", ignoreCase = true)) {
            Log.d("LeagueNameLocalizer", "Detected Club World Cup by name")
            return "클럽월드컵"
        }
        
        return when (leagueId) {
            // 주요 리그
            39 -> "프리미어리그"
            140 -> "라리가"
            135 -> "세리에 A"
            78 -> "분데스리가"
            61 -> "리그 1"
            
            // UEFA 대회
            2 -> "챔피언스리그"
            3 -> "유로파리그"
            4 -> "컨퍼런스리그"
            
            // 국가대표 대회
            1 -> "월드컵"
            5 -> "유로"
            9 -> "코파 아메리카"
            15 -> {
                // API가 ID 15를 여러 대회에 사용하는 경우
                if (defaultName.contains("Club World Cup", ignoreCase = true)) {
                    "클럽월드컵"
                } else {
                    "아시안컵"
                }
            }
            17 -> "알 수 없는 대회"
            372 -> "알 수 없는 대회"
            
            // 아시아 대회
            848 -> "AFC 챔피언스리그"
            
            // K리그
            292 -> "K리그 1"
            293 -> "K리그 2"
            
            // 기타 주요 리그들
            88 -> "에레디비시" // 네덜란드
            94 -> "프리메이라리가" // 포르투갈
            144 -> "주피터리그" // 벨기에
            203 -> "쉬페르리그" // 터키
            179 -> "슈퍼리그" // 스위스
            
            else -> defaultName
        }
    }
}