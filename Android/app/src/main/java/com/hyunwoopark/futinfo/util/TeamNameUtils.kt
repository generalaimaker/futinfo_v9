package com.hyunwoopark.futinfo.util

/**
 * 팀 이름 축약 유틸리티
 * iOS의 TeamAbbreviations와 동일한 기능 제공
 */
object TeamNameUtils {
    
    private val teamAbbreviations = mapOf(
        // 프리미어리그
        "Manchester United" to "맨유",
        "Manchester City" to "맨시티",
        "Liverpool" to "리버풀",
        "Chelsea" to "첼시",
        "Arsenal" to "아스날",
        "Tottenham Hotspur" to "토트넘",
        "Leicester City" to "레스터",
        "West Ham United" to "웨스트햄",
        "Everton" to "에버턴",
        "Newcastle United" to "뉴캐슬",
        "Aston Villa" to "아스톤빌라",
        "Southampton" to "사우샘프턴",
        "Crystal Palace" to "크리스탈팰리스",
        "Brighton & Hove Albion" to "브라이튼",
        "Wolverhampton Wanderers" to "울버햄튼",
        "Leeds United" to "리즈",
        "Burnley" to "번리",
        "Fulham" to "풀럼",
        "West Bromwich Albion" to "WBA",
        "Sheffield United" to "셰필드 U",
        "Norwich City" to "노리치",
        "Watford" to "왓포드",
        "Brentford" to "브렌트포드",
        "Nottingham Forest" to "노팅엄",
        "Bournemouth" to "본머스",
        "Luton Town" to "루턴",
        
        // 라리가
        "Real Madrid" to "레알마드리드",
        "Barcelona" to "바르셀로나",
        "Atletico Madrid" to "AT마드리드",
        "Sevilla" to "세비야",
        "Real Sociedad" to "레알소시에다드",
        "Real Betis" to "베티스",
        "Villarreal" to "비야레알",
        "Athletic Club" to "빌바오",
        "Valencia" to "발렌시아",
        "Osasuna" to "오사수나",
        "Celta Vigo" to "셀타비고",
        "Rayo Vallecano" to "라요",
        "Elche" to "엘체",
        "Espanyol" to "에스파뇰",
        "Getafe" to "헤타페",
        "Cadiz" to "카디스",
        "Mallorca" to "마요르카",
        "Granada" to "그라나다",
        "Levante" to "레반테",
        "Alaves" to "알라베스",
        "Las Palmas" to "라스팔마스",
        "Almeria" to "알메리아",
        "Girona" to "지로나",
        
        // 세리에A
        "Juventus" to "유벤투스",
        "Inter" to "인터밀란",
        "AC Milan" to "AC밀란", 
        "Napoli" to "나폴리",
        "AS Roma" to "AS로마",
        "Lazio" to "라치오",
        "Atalanta" to "아탈란타",
        "Fiorentina" to "피오렌티나",
        "Torino" to "토리노",
        "Sassuolo" to "사수올로",
        "Verona" to "베로나",
        "Bologna" to "볼로냐",
        "Sampdoria" to "삼프도리아",
        "Genoa" to "제노아",
        "Cagliari" to "칼리아리",
        "Spezia" to "스페치아",
        "Salernitana" to "살레르니타나",
        "Venezia" to "베네치아",
        "Empoli" to "엠폴리",
        "Udinese" to "우디네세",
        "Monza" to "몬차",
        "Lecce" to "레체",
        "Cremonese" to "크레모네세",
        "Frosinone" to "프로시노네",
        
        // 분데스리가
        "Bayern Munich" to "바이에른",
        "Borussia Dortmund" to "도르트문트",
        "RB Leipzig" to "라이프치히",
        "Bayer Leverkusen" to "레버쿠젠",
        "Borussia Monchengladbach" to "묀헨글라드바흐",
        "Eintracht Frankfurt" to "프랑크푸르트",
        "VfL Wolfsburg" to "볼프스부르크",
        "SC Freiburg" to "프라이부르크",
        "1899 Hoffenheim" to "호펜하임",
        "FC Koln" to "쾰른",
        "Union Berlin" to "우니온베를린",
        "VfB Stuttgart" to "슈투트가르트",
        "Mainz 05" to "마인츠",
        "Hertha Berlin" to "헤르타",
        "FC Augsburg" to "아우크스부르크",
        "Arminia Bielefeld" to "빌레펠트",
        "VfL Bochum" to "보훔",
        "SpVgg Greuther Furth" to "그로이터퓌르트",
        "Werder Bremen" to "브레멘",
        "Schalke 04" to "샬케",
        "Darmstadt" to "다름슈타트",
        "Heidenheim" to "하이덴하임",
        
        // 리그앙
        "Paris Saint Germain" to "PSG",
        "Marseille" to "마르세유",
        "Lyon" to "리옹",
        "Monaco" to "모나코",
        "Lille" to "릴",
        "Nice" to "니스",
        "Rennes" to "렌",
        "Lens" to "랑스",
        "Montpellier" to "몽펠리에",
        "Nantes" to "낭트",
        "Strasbourg" to "스트라스부르",
        "Brest" to "브레스트",
        "Reims" to "랭스",
        "Angers" to "앙제",
        "Troyes" to "트루아",
        "Lorient" to "로리앙",
        "Clermont Foot" to "클레르몽",
        "Metz" to "메츠",
        "Bordeaux" to "보르도",
        "Saint-Etienne" to "생테티엔",
        "Toulouse" to "툴루즈",
        "Auxerre" to "오세르",
        "Ajaccio" to "아작시오",
        "Le Havre" to "르아브르",
        
        // K리그
        "Ulsan Hyundai FC" to "울산",
        "Jeonbuk Hyundai Motors" to "전북",
        "Pohang Steelers" to "포항",
        "FC Seoul" to "FC서울",
        "Daegu FC" to "대구",
        "Incheon United" to "인천",
        "Suwon FC" to "수원FC",
        "Gangwon FC" to "강원",
        "Gwangju FC" to "광주",
        "Jeju United" to "제주",
        "Suwon Bluewings" to "수원삼성",
        "Daejeon Citizen" to "대전",
        "Gimcheon Sangmu FC" to "김천",
        
        // 국가대표
        "South Korea" to "대한민국",
        "Brazil" to "브라질",
        "Argentina" to "아르헨티나",
        "France" to "프랑스",
        "England" to "잉글랜드",
        "Spain" to "스페인",
        "Germany" to "독일",
        "Italy" to "이탈리아",
        "Portugal" to "포르투갈",
        "Netherlands" to "네덜란드",
        "Belgium" to "벨기에",
        "Croatia" to "크로아티아",
        "Uruguay" to "우루과이",
        "Colombia" to "콜롬비아",
        "Mexico" to "멕시코",
        "USA" to "미국",
        "Japan" to "일본",
        "Australia" to "호주",
        "Saudi Arabia" to "사우디",
        "Iran" to "이란",
        "Qatar" to "카타르",
        "China PR" to "중국"
    )
    
    /**
     * 팀 이름을 축약형으로 변환
     */
    fun getShortName(teamName: String): String {
        // 직접 매칭
        teamAbbreviations[teamName]?.let { return it }
        
        // 부분 매칭
        teamAbbreviations.entries.forEach { (key, value) ->
            if (teamName.contains(key, ignoreCase = true) || 
                key.contains(teamName, ignoreCase = true)) {
                return value
            }
        }
        
        // FC 제거
        var shortName = teamName
            .replace(" FC", "")
            .replace(" CF", "")
            .replace(" SC", "")
            .replace(" AC", "")
            .replace(" AS", "")
            .replace(" United", "")
            .replace(" City", "")
            .replace(" Town", "")
            .replace(" Hotspur", "")
            .replace(" Wanderers", "")
            .replace(" Rovers", "")
            .replace(" Athletic", "")
            .replace(" Football Club", "")
            .trim()
        
        // 너무 긴 이름 처리
        if (shortName.length > 8) {
            val words = shortName.split(" ")
            shortName = if (words.size > 1) {
                // 첫 단어가 더 중요한 경우가 많음
                words.first()
            } else {
                shortName.take(8)
            }
        }
        
        return shortName
    }
}