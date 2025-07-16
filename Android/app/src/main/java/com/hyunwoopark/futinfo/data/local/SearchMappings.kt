package com.hyunwoopark.futinfo.data.local

/**
 * 검색어 매핑을 관리하는 객체
 * 한글 팀/선수 이름을 영문으로 변환하고, 닉네임을 정식 이름으로 매핑합니다.
 */
object SearchMappings {
    
    /**
     * 한글 팀 이름을 영문으로 매핑
     */
    val koreanToEnglishTeamNames = mapOf(
        // 프리미어 리그
        "맨유" to "manchester united",
        "맨체스터 유나이티드" to "manchester united",
        "맨시티" to "manchester city",
        "맨체스터 시티" to "manchester city",
        "리버풀" to "liverpool",
        "첼시" to "chelsea",
        "아스널" to "arsenal",
        "아스날" to "arsenal",
        "토트넘" to "tottenham",
        "토트넘 핫스퍼" to "tottenham",
        "뉴캐슬" to "newcastle",
        "뉴캐슬 유나이티드" to "newcastle",
        "브라이튼" to "brighton",
        "아스톤 빌라" to "aston villa",
        "브렌트포드" to "brentford",
        "브렌트퍼드" to "brentford",
        "웨스트햄" to "west ham",
        "울버햄튼" to "wolverhampton",
        "울브스" to "wolverhampton",
        "에버턴" to "everton",
        "레스터" to "leicester",
        "레스터 시티" to "leicester",
        "리즈" to "leeds",
        "리즈 유나이티드" to "leeds",
        "사우샘프턴" to "southampton",
        "노팅엄" to "nottingham",
        "노팅엄 포레스트" to "nottingham",
        "풀럼" to "fulham",
        "본머스" to "bournemouth",
        "크리스탈 팰리스" to "crystal palace",
        "팰리스" to "crystal palace",
        "셰필드" to "sheffield",
        
        // 라리가
        "레알 마드리드" to "real madrid",
        "레알" to "real madrid",
        "바르셀로나" to "barcelona",
        "바르샤" to "barcelona",
        "바르사" to "barcelona",
        "아틀레티코 마드리드" to "atletico madrid",
        "아틀레티코" to "atletico madrid",
        "알레띠" to "atletico madrid",
        "아틀레틱 빌바오" to "athletic bilbao",
        "빌바오" to "athletic bilbao",
        "세비야" to "sevilla",
        "레알 소시에다드" to "real sociedad",
        "소시에다드" to "real sociedad",
        "비야레알" to "villarreal",
        "헤타페" to "getafe",
        "발렌시아" to "valencia",
        "오사수나" to "osasuna",
        "베티스" to "betis",
        "레알 베티스" to "betis",
        "셀타 비고" to "celta vigo",
        "셀타" to "celta vigo",
        "라요 바예카노" to "rayo vallecano",
        "라요" to "rayo vallecano",
        "지로나" to "girona",
        "마요르카" to "mallorca",
        "카디스" to "cadiz",
        "엘체" to "elche",
        "에스파뇰" to "espanyol",
        "알메리아" to "almeria",
        "그라나다" to "granada",
        "라스 팔마스" to "las palmas",
        
        // 분데스리가
        "바이에른 뮌헨" to "bayern munich",
        "바이에른" to "bayern munich",
        "뮌헨" to "bayern munich",
        "도르트문트" to "borussia dortmund",
        "보루시아 도르트문트" to "borussia dortmund",
        "돌문" to "borussia dortmund",
        "라이프치히" to "rb leipzig",
        "레드불 라이프치히" to "rb leipzig",
        "프랑크푸르트" to "eintracht frankfurt",
        "아인트라흐트 프랑크푸르트" to "eintracht frankfurt",
        "레버쿠젠" to "bayer leverkusen",
        "바이어 레버쿠젠" to "bayer leverkusen",
        "볼프스부르크" to "wolfsburg",
        "호펜하임" to "hoffenheim",
        "묀헨글라트바흐" to "borussia monchengladbach",
        "보루시아 묀헨글라트바흐" to "borussia monchengladbach",
        "글라트바흐" to "borussia monchengladbach",
        "슈투트가르트" to "stuttgart",
        "마인츠" to "mainz",
        "헤르타" to "hertha",
        "헤르타 베를린" to "hertha",
        "아우크스부르크" to "augsburg",
        "쾰른" to "fc koln",
        "프라이부르크" to "freiburg",
        "샬케" to "schalke",
        
        // 세리에 A
        "유벤투스" to "juventus",
        "유베" to "juventus",
        "인터 밀란" to "inter",
        "인터" to "inter",
        "인테르" to "inter",
        "AC 밀란" to "ac milan",
        "밀란" to "ac milan",
        "나폴리" to "napoli",
        "로마" to "roma",
        "AS 로마" to "roma",
        "라치오" to "lazio",
        "아탈란타" to "atalanta",
        "피오렌티나" to "fiorentina",
        "사수올로" to "sassuolo",
        "베로나" to "verona",
        "토리노" to "torino",
        "볼로냐" to "bologna",
        "우디네세" to "udinese",
        "삼프도리아" to "sampdoria",
        "칼리아리" to "cagliari",
        "제노아" to "genoa",
        "스페치아" to "spezia",
        "살레르니타나" to "salernitana",
        "엠폴리" to "empoli",
        "베네치아" to "venezia",
        "크레모네세" to "cremonese",
        "레체" to "lecce",
        "몬차" to "monza",
        
        // 리그 1
        "파리 생제르맹" to "paris saint-germain",
        "파리" to "paris saint-germain",
        "피에스지" to "paris saint-germain",
        "PSG" to "paris saint-germain",
        "마르세유" to "marseille",
        "올림피크 마르세유" to "marseille",
        "모나코" to "monaco",
        "리옹" to "lyon",
        "올림피크 리옹" to "lyon",
        "릴" to "lille",
        "니스" to "nice",
        "렌" to "rennes",
        "스타드 렌" to "rennes",
        "랑스" to "reims",
        "스타드 드 랭스" to "reims",
        "스트라스부르" to "strasbourg",
        "낭트" to "nantes",
        "몽펠리에" to "montpellier",
        "브레스트" to "brest",
        "앙제" to "angers",
        "트루아" to "troyes",
        "로리앙" to "lorient",
        "클레르몽" to "clermont",
        "메스" to "metz",
        "생테티엔" to "saint-etienne",
        "보르도" to "bordeaux",
        "툴루즈" to "toulouse",
        "랑스" to "lens",
        
        // 기타 유럽
        "아약스" to "ajax",
        "PSV" to "psv",
        "페예노르트" to "feyenoord",
        "포르투" to "porto",
        "벤피카" to "benfica",
        "스포르팅" to "sporting cp",
        "갈라타사라이" to "galatasaray",
        "페네르바체" to "fenerbahce",
        "베식타스" to "besiktas"
    )
    
    /**
     * 한글 선수 이름을 영문으로 매핑
     */
    val koreanToEnglishPlayerNames = mapOf(
        // 한국 선수
        "손흥민" to "son heung-min",
        "이강인" to "lee kang-in",
        "황희찬" to "hwang hee-chan",
        "김민재" to "kim min-jae",
        "이재성" to "lee jae-sung",
        "황인범" to "hwang in-beom",
        "정우영" to "jeong woo-yeong",
        "조규성" to "cho gue-sung",
        "백승호" to "paik seung-ho",
        "이기제" to "lee ki-je",
        "홍현석" to "hong hyun-seok",
        "김지수" to "kim ji-soo",
        "박용우" to "park yong-woo",
        "권창훈" to "kwon chang-hoon",
        "황의조" to "hwang ui-jo",
        "나상호" to "na sang-ho",
        "송민규" to "song min-kyu",
        "김진수" to "kim jin-su",
        "김영권" to "kim young-gwon",
        "설영우" to "seol young-woo",
        "오현규" to "oh hyeon-gyu",
        "양현준" to "yang hyun-jun",
        
        // 유명 선수들
        "메시" to "messi",
        "리오넬 메시" to "lionel messi",
        "호날두" to "ronaldo",
        "크리스티아누 호날두" to "cristiano ronaldo",
        "음바페" to "mbappe",
        "킬리안 음바페" to "kylian mbappe",
        "엠바페" to "mbappe",
        "할란드" to "haaland",
        "엘링 할란드" to "erling haaland",
        "홀란드" to "haaland",
        "네이마르" to "neymar",
        "벤제마" to "benzema",
        "카림 벤제마" to "karim benzema",
        "모드리치" to "modric",
        "루카 모드리치" to "luka modric",
        "데브라이너" to "de bruyne",
        "케빈 데브라이너" to "kevin de bruyne",
        "더브라위너" to "de bruyne",
        "살라" to "salah",
        "모하메드 살라" to "mohamed salah",
        "레반도프스키" to "lewandowski",
        "로베르트 레반도프스키" to "robert lewandowski",
        "비니시우스" to "vinicius",
        "비니시우스 주니어" to "vinicius junior",
        "페드리" to "pedri",
        "가비" to "gavi",
        "벨링엄" to "bellingham",
        "주드 벨링엄" to "jude bellingham",
        "벨링험" to "bellingham",
        "케인" to "kane",
        "해리 케인" to "harry kane",
        "그릴리쉬" to "grealish",
        "잭 그릴리쉬" to "jack grealish",
        "포든" to "foden",
        "필 포든" to "phil foden",
        "라이스" to "rice",
        "데클란 라이스" to "declan rice",
        "하베르츠" to "havertz",
        "카이 하베르츠" to "kai havertz",
        "무시알라" to "musiala",
        "자말 무시알라" to "jamal musiala",
        "사카" to "saka",
        "부카요 사카" to "bukayo saka",
        "오데고르" to "odegaard",
        "외데고르" to "odegaard",
        "마르틴 오데고르" to "martin odegaard",
        "라포르테" to "laporte",
        "판데이크" to "van dijk",
        "버질 판데이크" to "virgil van dijk",
        "알리송" to "alisson",
        "에데르송" to "ederson",
        "테어슈테겐" to "ter stegen",
        "쿠르투아" to "courtois",
        "돈나룸마" to "donnarumma",
        "잔루이지 돈나룸마" to "gianluigi donnarumma",
        "키미히" to "kimmich",
        "요주아 키미히" to "joshua kimmich",
        "고레츠카" to "goretzka",
        "뮐러" to "muller",
        "토마스 뮐러" to "thomas muller",
        "노이어" to "neuer",
        "마누엘 노이어" to "manuel neuer",
        "은돔벨레" to "ndombele",
        "캉테" to "kante",
        "응골로 캉테" to "n'golo kante",
        "포그바" to "pogba",
        "폴 포그바" to "paul pogba",
        "그리즈만" to "griezmann",
        "앙투안 그리즈만" to "antoine griezmann",
        "디발라" to "dybala",
        "파울로 디발라" to "paulo dybala",
        "라우타로" to "lautaro",
        "라우타로 마르티네스" to "lautaro martinez",
        "오시멘" to "osimhen",
        "빅터 오시멘" to "victor osimhen",
        "브루누 페르난데스" to "bruno fernandes",
        "브루노 페르난데스" to "bruno fernandes"
    )
    
    /**
     * 팀 이름 기반 선수 검색 매핑
     * 팀 이름으로 검색했을 때 해당 팀의 주요 선수를 보여줍니다.
     */
    val teamToPlayerMapping = mapOf(
        "토트넘" to listOf("son"),
        "tottenham" to listOf("son"),
        "파리" to listOf("lee kang-in", "mbappe"),
        "psg" to listOf("lee kang-in", "mbappe"),
        "파리 생제르맹" to listOf("lee kang-in", "mbappe"),
        "울브스" to listOf("hwang"),
        "wolverhampton" to listOf("hwang"),
        "울버햄튼" to listOf("hwang"),
        "뮌헨" to listOf("kim min-jae", "kane"),
        "바이에른" to listOf("kim min-jae", "kane"),
        "bayern" to listOf("kim min-jae", "kane"),
        "맨시티" to listOf("haaland", "de bruyne"),
        "manchester city" to listOf("haaland", "de bruyne"),
        "레알" to listOf("bellingham", "vinicius"),
        "real madrid" to listOf("bellingham", "vinicius"),
        "바르샤" to listOf("lewandowski", "pedri"),
        "barcelona" to listOf("lewandowski", "pedri")
    )
    
    /**
     * 인기 팀 ID (정렬 우선순위용)
     */
    val popularTeamIds = listOf(
        // 프리미어 리그
        33, // Manchester United
        50, // Manchester City  
        40, // Liverpool
        49, // Chelsea
        42, // Arsenal
        47, // Tottenham
        
        // 라리가
        541, // Real Madrid
        529, // Barcelona
        530, // Atletico Madrid
        
        // 분데스리가
        157, // Bayern Munich
        165, // Borussia Dortmund
        
        // 세리에 A
        496, // Juventus
        505, // Inter
        489, // AC Milan
        492, // Napoli
        
        // 리그 1
        85  // PSG
    )
    
    /**
     * 주요 리그 ID
     */
    val majorLeagueIds = listOf(
        39,  // Premier League
        140, // La Liga
        78,  // Bundesliga
        135, // Serie A
        61   // Ligue 1
    )
    
    /**
     * 검색어 정규화
     * 특수문자 제거, 공백 정규화, 소문자 변환
     */
    fun normalizeSearchQuery(query: String): String {
        return query
            .trim()
            .lowercase()
            .replace(Regex("[^a-zA-Z0-9가-힣\\s\\-']"), "") // 영어, 숫자, 한글, 공백, 하이픈, 작은따옴표만 허용
            .replace(Regex("\\s+"), " ") // 연속된 공백을 하나로
    }
    
    /**
     * 한글 검색어인지 확인
     */
    fun isKoreanQuery(query: String): Boolean {
        return query.contains(Regex("[가-힣]"))
    }
    
    /**
     * 한글 검색어를 영문으로 변환
     */
    fun translateKoreanToEnglish(query: String): String? {
        val normalized = normalizeSearchQuery(query)
        
        // 전체 검색어 매칭
        koreanToEnglishTeamNames[normalized]?.let { return it }
        koreanToEnglishPlayerNames[normalized]?.let { return it }
        
        // 공백으로 분리하여 마지막 단어만 매칭 (예: "FC 바르셀로나" -> "바르셀로나")
        val words = normalized.split(" ")
        if (words.size > 1) {
            val lastWord = words.last()
            koreanToEnglishTeamNames[lastWord]?.let { return it }
            koreanToEnglishPlayerNames[lastWord]?.let { return it }
        }
        
        return null
    }
}