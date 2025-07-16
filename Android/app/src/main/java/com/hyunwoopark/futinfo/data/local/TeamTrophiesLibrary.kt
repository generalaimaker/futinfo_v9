package com.hyunwoopark.futinfo.data.local

/**
 * 팀 트로피 정보를 제공하는 로컬 라이브러리
 * iOS TeamTrophiesLibrary.swift와 동일한 데이터
 */
object TeamTrophiesLibrary {
    
    data class TeamTrophy(
        val competition: String,
        val competitionType: CompetitionType,
        val count: Int,
        val lastWin: Int? = null,
        val years: List<Int> = emptyList()
    )
    
    enum class CompetitionType {
        LEAGUE,
        UEFA_CHAMPIONS_LEAGUE,
        UEFA_EUROPA_LEAGUE,
        UEFA_CONFERENCE_LEAGUE,
        UEFA_CUP_WINNERS_CUP,
        UEFA_SUPER_CUP,
        DOMESTIC_CUP,
        LEAGUE_CUP,
        SUPER_CUP,
        WORLD_CUP
    }
    
    /**
     * 팀의 트로피 데이터가 있는지 확인
     */
    fun hasTrophyData(teamId: Int): Boolean {
        return when (teamId) {
            // Premier League
            33, 40, 50, 42, 49, 47, 34, 46, 48, 66, 45,
            // La Liga
            541, 529, 530, 531, 532, 548, 536, 533,
            // Bundesliga
            157, 165, 168,
            // Serie A
            496, 489, 505, 492, 497, 487,
            // Ligue 1
            85, 81, 91, 80,
            // Other
            194, 211, 212, 247, 248 -> true
            else -> false
        }
    }
    
    fun getTrophiesForTeam(teamId: Int): List<TeamTrophy> {
        return when (teamId) {
            // Manchester United
            33 -> listOf(
                TeamTrophy("Premier League", CompetitionType.LEAGUE, 20, 2013),
                TeamTrophy("FA Cup", CompetitionType.DOMESTIC_CUP, 13, 2024),
                TeamTrophy("League Cup", CompetitionType.LEAGUE_CUP, 6, 2023),
                TeamTrophy("Community Shield", CompetitionType.SUPER_CUP, 21, 2016),
                TeamTrophy("Champions League", CompetitionType.UEFA_CHAMPIONS_LEAGUE, 3, 2008),
                TeamTrophy("Europa League", CompetitionType.UEFA_EUROPA_LEAGUE, 1, 2017),
                TeamTrophy("Cup Winners' Cup", CompetitionType.UEFA_CUP_WINNERS_CUP, 1, 1991),
                TeamTrophy("UEFA Super Cup", CompetitionType.UEFA_SUPER_CUP, 1, 1991),
                TeamTrophy("Club World Cup", CompetitionType.WORLD_CUP, 1, 2008)
            )
            
            // Real Madrid
            541 -> listOf(
                TeamTrophy("La Liga", CompetitionType.LEAGUE, 36, 2024),
                TeamTrophy("Copa del Rey", CompetitionType.DOMESTIC_CUP, 20, 2023),
                TeamTrophy("Supercopa", CompetitionType.SUPER_CUP, 13, 2024),
                TeamTrophy("Champions League", CompetitionType.UEFA_CHAMPIONS_LEAGUE, 15, 2024),
                TeamTrophy("UEFA Cup", CompetitionType.UEFA_EUROPA_LEAGUE, 2, 1986),
                TeamTrophy("UEFA Super Cup", CompetitionType.UEFA_SUPER_CUP, 5, 2022),
                TeamTrophy("Club World Cup", CompetitionType.WORLD_CUP, 8, 2022)
            )
            
            // Barcelona
            529 -> listOf(
                TeamTrophy("La Liga", CompetitionType.LEAGUE, 28, 2025),
                TeamTrophy("Copa del Rey", CompetitionType.DOMESTIC_CUP, 32, 2025),
                TeamTrophy("Supercopa", CompetitionType.SUPER_CUP, 14, 2023),
                TeamTrophy("Champions League", CompetitionType.UEFA_CHAMPIONS_LEAGUE, 5, 2015),
                TeamTrophy("Cup Winners' Cup", CompetitionType.UEFA_CUP_WINNERS_CUP, 4, 1997),
                TeamTrophy("UEFA Super Cup", CompetitionType.UEFA_SUPER_CUP, 5, 2015),
                TeamTrophy("Club World Cup", CompetitionType.WORLD_CUP, 3, 2015)
            )
            
            // Bayern Munich
            157 -> listOf(
                TeamTrophy("Bundesliga", CompetitionType.LEAGUE, 34, 2025),
                TeamTrophy("DFB-Pokal", CompetitionType.DOMESTIC_CUP, 20, 2020),
                TeamTrophy("DFL-Supercup", CompetitionType.SUPER_CUP, 11, 2022),
                TeamTrophy("Champions League", CompetitionType.UEFA_CHAMPIONS_LEAGUE, 6, 2020),
                TeamTrophy("Cup Winners' Cup", CompetitionType.UEFA_CUP_WINNERS_CUP, 1, 1967),
                TeamTrophy("UEFA Cup", CompetitionType.UEFA_EUROPA_LEAGUE, 1, 1996),
                TeamTrophy("UEFA Super Cup", CompetitionType.UEFA_SUPER_CUP, 2, 2020),
                TeamTrophy("Club World Cup", CompetitionType.WORLD_CUP, 2, 2020)
            )
            
            // Liverpool
            40 -> listOf(
                TeamTrophy("Premier League", CompetitionType.LEAGUE, 20, 2025),
                TeamTrophy("FA Cup", CompetitionType.DOMESTIC_CUP, 8, 2022),
                TeamTrophy("League Cup", CompetitionType.LEAGUE_CUP, 10, 2024),
                TeamTrophy("Community Shield", CompetitionType.SUPER_CUP, 16, 2022),
                TeamTrophy("Champions League", CompetitionType.UEFA_CHAMPIONS_LEAGUE, 6, 2019),
                TeamTrophy("UEFA Cup/Europa League", CompetitionType.UEFA_EUROPA_LEAGUE, 3, 2001),
                TeamTrophy("UEFA Super Cup", CompetitionType.UEFA_SUPER_CUP, 4, 2019),
                TeamTrophy("Club World Cup", CompetitionType.WORLD_CUP, 1, 2019)
            )
            
            // Manchester City
            50 -> listOf(
                TeamTrophy("Premier League", CompetitionType.LEAGUE, 10, 2024),
                TeamTrophy("FA Cup", CompetitionType.DOMESTIC_CUP, 7, 2023),
                TeamTrophy("League Cup", CompetitionType.LEAGUE_CUP, 8, 2021),
                TeamTrophy("Community Shield", CompetitionType.SUPER_CUP, 7, 2024),
                TeamTrophy("Champions League", CompetitionType.UEFA_CHAMPIONS_LEAGUE, 1, 2023),
                TeamTrophy("Cup Winners' Cup", CompetitionType.UEFA_CUP_WINNERS_CUP, 1, 1970),
                TeamTrophy("UEFA Super Cup", CompetitionType.UEFA_SUPER_CUP, 1, 2023),
                TeamTrophy("Club World Cup", CompetitionType.WORLD_CUP, 1, 2023)
            )
            
            // Arsenal
            42 -> listOf(
                TeamTrophy("First Division/Premier League", CompetitionType.LEAGUE, 13, 2004),
                TeamTrophy("FA Cup", CompetitionType.DOMESTIC_CUP, 14, 2020),
                TeamTrophy("League Cup", CompetitionType.LEAGUE_CUP, 2, 1993),
                TeamTrophy("Community Shield", CompetitionType.SUPER_CUP, 17, 2023),
                TeamTrophy("Cup Winners' Cup", CompetitionType.UEFA_CUP_WINNERS_CUP, 1, 1994)
            )
            
            // Chelsea
            49 -> listOf(
                TeamTrophy("First Division/Premier League", CompetitionType.LEAGUE, 6, 2017),
                TeamTrophy("FA Cup", CompetitionType.DOMESTIC_CUP, 8, 2018),
                TeamTrophy("League Cup", CompetitionType.LEAGUE_CUP, 5, 2015),
                TeamTrophy("Community Shield", CompetitionType.SUPER_CUP, 4, 2009),
                TeamTrophy("Champions League", CompetitionType.UEFA_CHAMPIONS_LEAGUE, 2, 2021),
                TeamTrophy("Europa League", CompetitionType.UEFA_EUROPA_LEAGUE, 2, 2019),
                TeamTrophy("Cup Winners' Cup", CompetitionType.UEFA_CUP_WINNERS_CUP, 2, 1998),
                TeamTrophy("UEFA Super Cup", CompetitionType.UEFA_SUPER_CUP, 2, 2021),
                TeamTrophy("Club World Cup", CompetitionType.WORLD_CUP, 1, 2021)
            )
            
            // Tottenham
            47 -> listOf(
                TeamTrophy("First Division", CompetitionType.LEAGUE, 2, 1961),
                TeamTrophy("FA Cup", CompetitionType.DOMESTIC_CUP, 8, 1991),
                TeamTrophy("League Cup", CompetitionType.LEAGUE_CUP, 4, 2008),
                TeamTrophy("Community Shield", CompetitionType.SUPER_CUP, 7, 1991),
                TeamTrophy("Cup Winners' Cup", CompetitionType.UEFA_CUP_WINNERS_CUP, 1, 1963),
                TeamTrophy("UEFA Cup/Europa League", CompetitionType.UEFA_EUROPA_LEAGUE, 3, 2025)
            )
            
            // PSG
            85 -> listOf(
                TeamTrophy("Ligue 1", CompetitionType.LEAGUE, 13, 2025),
                TeamTrophy("Coupe de France", CompetitionType.DOMESTIC_CUP, 15, 2024),
                TeamTrophy("Coupe de la Ligue", CompetitionType.LEAGUE_CUP, 9, 2020),
                TeamTrophy("Trophée des Champions", CompetitionType.SUPER_CUP, 12, 2023),
                TeamTrophy("Cup Winners' Cup", CompetitionType.UEFA_CUP_WINNERS_CUP, 1, 1996)
            )
            
            // Juventus
            496 -> listOf(
                TeamTrophy("Serie A", CompetitionType.LEAGUE, 36, 2020),
                TeamTrophy("Coppa Italia", CompetitionType.DOMESTIC_CUP, 15, 2024),
                TeamTrophy("Supercoppa", CompetitionType.SUPER_CUP, 9, 2021),
                TeamTrophy("Champions League", CompetitionType.UEFA_CHAMPIONS_LEAGUE, 2, 1996),
                TeamTrophy("Cup Winners' Cup", CompetitionType.UEFA_CUP_WINNERS_CUP, 1, 1984),
                TeamTrophy("UEFA Cup", CompetitionType.UEFA_EUROPA_LEAGUE, 3, 1993),
                TeamTrophy("UEFA Super Cup", CompetitionType.UEFA_SUPER_CUP, 2, 1996)
            )
            
            // AC Milan
            489 -> listOf(
                TeamTrophy("Serie A", CompetitionType.LEAGUE, 19, 2022),
                TeamTrophy("Coppa Italia", CompetitionType.DOMESTIC_CUP, 5, 2003),
                TeamTrophy("Supercoppa", CompetitionType.SUPER_CUP, 7, 2016),
                TeamTrophy("Champions League", CompetitionType.UEFA_CHAMPIONS_LEAGUE, 7, 2007),
                TeamTrophy("Cup Winners' Cup", CompetitionType.UEFA_CUP_WINNERS_CUP, 2, 1973),
                TeamTrophy("UEFA Super Cup", CompetitionType.UEFA_SUPER_CUP, 5, 2007),
                TeamTrophy("Club World Cup", CompetitionType.WORLD_CUP, 4, 2007)
            )
            
            // Inter Milan
            505 -> listOf(
                TeamTrophy("Serie A", CompetitionType.LEAGUE, 20, 2024),
                TeamTrophy("Coppa Italia", CompetitionType.DOMESTIC_CUP, 9, 2024),
                TeamTrophy("Supercoppa", CompetitionType.SUPER_CUP, 8, 2024),
                TeamTrophy("Champions League", CompetitionType.UEFA_CHAMPIONS_LEAGUE, 3, 2010),
                TeamTrophy("UEFA Cup", CompetitionType.UEFA_EUROPA_LEAGUE, 3, 1998),
                TeamTrophy("Club World Cup", CompetitionType.WORLD_CUP, 1, 2010)
            )
            
            // Borussia Dortmund
            165 -> listOf(
                TeamTrophy("Bundesliga", CompetitionType.LEAGUE, 8, 2012),
                TeamTrophy("DFB-Pokal", CompetitionType.DOMESTIC_CUP, 5, 2021),
                TeamTrophy("DFL-Supercup", CompetitionType.SUPER_CUP, 6, 2019),
                TeamTrophy("Champions League", CompetitionType.UEFA_CHAMPIONS_LEAGUE, 1, 1997),
                TeamTrophy("Cup Winners' Cup", CompetitionType.UEFA_CUP_WINNERS_CUP, 1, 1966)
            )
            
            // Atletico Madrid
            530 -> listOf(
                TeamTrophy("La Liga", CompetitionType.LEAGUE, 11, 2021),
                TeamTrophy("Copa del Rey", CompetitionType.DOMESTIC_CUP, 10, 2013),
                TeamTrophy("Supercopa", CompetitionType.SUPER_CUP, 2, 2014),
                TeamTrophy("Europa League", CompetitionType.UEFA_EUROPA_LEAGUE, 3, 2018),
                TeamTrophy("Cup Winners' Cup", CompetitionType.UEFA_CUP_WINNERS_CUP, 1, 1962),
                TeamTrophy("UEFA Super Cup", CompetitionType.UEFA_SUPER_CUP, 3, 2018)
            )
            
            // Newcastle United
            34 -> listOf(
                TeamTrophy("First Division", CompetitionType.LEAGUE, 4, 1927),
                TeamTrophy("FA Cup", CompetitionType.DOMESTIC_CUP, 6, 1955),
                TeamTrophy("Community Shield", CompetitionType.SUPER_CUP, 1, 1909),
                TeamTrophy("Fairs Cup", CompetitionType.UEFA_EUROPA_LEAGUE, 1, 1969)
            )
            
            // Leicester City
            46 -> listOf(
                TeamTrophy("Premier League", CompetitionType.LEAGUE, 1, 2016),
                TeamTrophy("FA Cup", CompetitionType.DOMESTIC_CUP, 1, 2021),
                TeamTrophy("League Cup", CompetitionType.LEAGUE_CUP, 3, 2000),
                TeamTrophy("Community Shield", CompetitionType.SUPER_CUP, 2, 2021)
            )
            
            // West Ham United
            48 -> listOf(
                TeamTrophy("FA Cup", CompetitionType.DOMESTIC_CUP, 3, 1980),
                TeamTrophy("Community Shield", CompetitionType.SUPER_CUP, 1, 1964),
                TeamTrophy("Cup Winners' Cup", CompetitionType.UEFA_CUP_WINNERS_CUP, 1, 1965),
                TeamTrophy("Conference League", CompetitionType.UEFA_CONFERENCE_LEAGUE, 1, 2023)
            )
            
            // Aston Villa
            66 -> listOf(
                TeamTrophy("First Division", CompetitionType.LEAGUE, 7, 1981),
                TeamTrophy("FA Cup", CompetitionType.DOMESTIC_CUP, 7, 1957),
                TeamTrophy("League Cup", CompetitionType.LEAGUE_CUP, 5, 1996),
                TeamTrophy("Community Shield", CompetitionType.SUPER_CUP, 1, 1981),
                TeamTrophy("Champions League", CompetitionType.UEFA_CHAMPIONS_LEAGUE, 1, 1982)
            )
            
            // Everton
            45 -> listOf(
                TeamTrophy("First Division", CompetitionType.LEAGUE, 9, 1987),
                TeamTrophy("FA Cup", CompetitionType.DOMESTIC_CUP, 5, 1995),
                TeamTrophy("Community Shield", CompetitionType.SUPER_CUP, 9, 1995),
                TeamTrophy("Cup Winners' Cup", CompetitionType.UEFA_CUP_WINNERS_CUP, 1, 1985)
            )
            
            // Ajax
            194 -> listOf(
                TeamTrophy("Eredivisie", CompetitionType.LEAGUE, 36, 2022),
                TeamTrophy("KNVB Cup", CompetitionType.DOMESTIC_CUP, 20, 2021),
                TeamTrophy("Johan Cruijff Shield", CompetitionType.SUPER_CUP, 9, 2019),
                TeamTrophy("Champions League", CompetitionType.UEFA_CHAMPIONS_LEAGUE, 4, 1995),
                TeamTrophy("Cup Winners' Cup", CompetitionType.UEFA_CUP_WINNERS_CUP, 1, 1987),
                TeamTrophy("UEFA Cup", CompetitionType.UEFA_EUROPA_LEAGUE, 1, 1992),
                TeamTrophy("UEFA Super Cup", CompetitionType.UEFA_SUPER_CUP, 2, 1995),
                TeamTrophy("Intercontinental Cup", CompetitionType.WORLD_CUP, 2, 1995)
            )
            
            // Benfica
            211 -> listOf(
                TeamTrophy("Primeira Liga", CompetitionType.LEAGUE, 38, 2023),
                TeamTrophy("Taça de Portugal", CompetitionType.DOMESTIC_CUP, 26, 2017),
                TeamTrophy("Taça da Liga", CompetitionType.LEAGUE_CUP, 7, 2016),
                TeamTrophy("Supertaça", CompetitionType.SUPER_CUP, 8, 2019),
                TeamTrophy("Champions League", CompetitionType.UEFA_CHAMPIONS_LEAGUE, 2, 1962)
            )
            
            // Porto
            212 -> listOf(
                TeamTrophy("Primeira Liga", CompetitionType.LEAGUE, 30, 2022),
                TeamTrophy("Taça de Portugal", CompetitionType.DOMESTIC_CUP, 18, 2022),
                TeamTrophy("Taça da Liga", CompetitionType.LEAGUE_CUP, 1, 2023),
                TeamTrophy("Supertaça", CompetitionType.SUPER_CUP, 23, 2022),
                TeamTrophy("Champions League", CompetitionType.UEFA_CHAMPIONS_LEAGUE, 2, 2004),
                TeamTrophy("UEFA Cup/Europa League", CompetitionType.UEFA_EUROPA_LEAGUE, 2, 2011),
                TeamTrophy("UEFA Super Cup", CompetitionType.UEFA_SUPER_CUP, 1, 1987),
                TeamTrophy("Club World Cup", CompetitionType.WORLD_CUP, 2, 2004)
            )
            
            // Athletic Bilbao
            531 -> listOf(
                TeamTrophy("La Liga", CompetitionType.LEAGUE, 8, 1984),
                TeamTrophy("Copa del Rey", CompetitionType.DOMESTIC_CUP, 24, 2024),
                TeamTrophy("Supercopa", CompetitionType.SUPER_CUP, 3, 2021)
            )
            
            // Valencia
            532 -> listOf(
                TeamTrophy("La Liga", CompetitionType.LEAGUE, 6, 2004),
                TeamTrophy("Copa del Rey", CompetitionType.DOMESTIC_CUP, 8, 2019),
                TeamTrophy("Supercopa", CompetitionType.SUPER_CUP, 1, 1999),
                TeamTrophy("UEFA Cup/Europa League", CompetitionType.UEFA_EUROPA_LEAGUE, 1, 2004),
                TeamTrophy("UEFA Super Cup", CompetitionType.UEFA_SUPER_CUP, 2, 2004),
                TeamTrophy("Cup Winners' Cup", CompetitionType.UEFA_CUP_WINNERS_CUP, 1, 1980)
            )
            
            // Real Sociedad
            548 -> listOf(
                TeamTrophy("La Liga", CompetitionType.LEAGUE, 2, 1982),
                TeamTrophy("Copa del Rey", CompetitionType.DOMESTIC_CUP, 3, 2020),
                TeamTrophy("Supercopa", CompetitionType.SUPER_CUP, 1, 1982)
            )
            
            // Sevilla
            536 -> listOf(
                TeamTrophy("La Liga", CompetitionType.LEAGUE, 1, 1946),
                TeamTrophy("Copa del Rey", CompetitionType.DOMESTIC_CUP, 5, 2010),
                TeamTrophy("Supercopa", CompetitionType.SUPER_CUP, 1, 2007),
                TeamTrophy("UEFA Cup/Europa League", CompetitionType.UEFA_EUROPA_LEAGUE, 7, 2023),
                TeamTrophy("UEFA Super Cup", CompetitionType.UEFA_SUPER_CUP, 1, 2006)
            )
            
            // Villarreal
            533 -> listOf(
                TeamTrophy("UEFA Cup/Europa League", CompetitionType.UEFA_EUROPA_LEAGUE, 1, 2021)
            )
            
            // Napoli
            492 -> listOf(
                TeamTrophy("Serie A", CompetitionType.LEAGUE, 4, 2025),
                TeamTrophy("Coppa Italia", CompetitionType.DOMESTIC_CUP, 6, 2020),
                TeamTrophy("Supercoppa", CompetitionType.SUPER_CUP, 2, 2014),
                TeamTrophy("UEFA Cup", CompetitionType.UEFA_EUROPA_LEAGUE, 1, 1989)
            )
            
            // AS Roma
            497 -> listOf(
                TeamTrophy("Serie A", CompetitionType.LEAGUE, 3, 2001),
                TeamTrophy("Coppa Italia", CompetitionType.DOMESTIC_CUP, 9, 2008),
                TeamTrophy("Supercoppa", CompetitionType.SUPER_CUP, 2, 2007),
                TeamTrophy("Conference League", CompetitionType.UEFA_CONFERENCE_LEAGUE, 1, 2022)
            )
            
            // Lazio
            487 -> listOf(
                TeamTrophy("Serie A", CompetitionType.LEAGUE, 2, 2000),
                TeamTrophy("Coppa Italia", CompetitionType.DOMESTIC_CUP, 7, 2019),
                TeamTrophy("Supercoppa", CompetitionType.SUPER_CUP, 5, 2019),
                TeamTrophy("Cup Winners' Cup", CompetitionType.UEFA_CUP_WINNERS_CUP, 1, 1999)
            )
            
            // Bayer Leverkusen
            168 -> listOf(
                TeamTrophy("Bundesliga", CompetitionType.LEAGUE, 1, 2024),
                TeamTrophy("DFB-Pokal", CompetitionType.DOMESTIC_CUP, 2, 2024),
                TeamTrophy("DFL-Supercup", CompetitionType.SUPER_CUP, 1, 2025),
                TeamTrophy("UEFA Cup", CompetitionType.UEFA_EUROPA_LEAGUE, 1, 1988)
            )
            
            // Marseille
            81 -> listOf(
                TeamTrophy("Ligue 1", CompetitionType.LEAGUE, 9, 2010),
                TeamTrophy("Coupe de France", CompetitionType.DOMESTIC_CUP, 10, 1989),
                TeamTrophy("Coupe de la Ligue", CompetitionType.LEAGUE_CUP, 3, 2012),
                TeamTrophy("Trophée des Champions", CompetitionType.SUPER_CUP, 3, 2011),
                TeamTrophy("Champions League", CompetitionType.UEFA_CHAMPIONS_LEAGUE, 1, 1993)
            )
            
            // Monaco
            91 -> listOf(
                TeamTrophy("Ligue 1", CompetitionType.LEAGUE, 8, 2017),
                TeamTrophy("Coupe de France", CompetitionType.DOMESTIC_CUP, 5, 1991),
                TeamTrophy("Coupe de la Ligue", CompetitionType.LEAGUE_CUP, 1, 2003),
                TeamTrophy("Trophée des Champions", CompetitionType.SUPER_CUP, 4, 2000)
            )
            
            // Lyon
            80 -> listOf(
                TeamTrophy("Ligue 1", CompetitionType.LEAGUE, 7, 2008),
                TeamTrophy("Coupe de France", CompetitionType.DOMESTIC_CUP, 5, 2012),
                TeamTrophy("Coupe de la Ligue", CompetitionType.LEAGUE_CUP, 1, 2001),
                TeamTrophy("Trophée des Champions", CompetitionType.SUPER_CUP, 8, 2012)
            )
            
            // Celtic
            247 -> listOf(
                TeamTrophy("Scottish Premiership", CompetitionType.LEAGUE, 53, 2023),
                TeamTrophy("Scottish Cup", CompetitionType.DOMESTIC_CUP, 40, 2023),
                TeamTrophy("Scottish League Cup", CompetitionType.LEAGUE_CUP, 21, 2023),
                TeamTrophy("Champions League", CompetitionType.UEFA_CHAMPIONS_LEAGUE, 1, 1967)
            )
            
            // Rangers
            248 -> listOf(
                TeamTrophy("Scottish Premiership", CompetitionType.LEAGUE, 55, 2021),
                TeamTrophy("Scottish Cup", CompetitionType.DOMESTIC_CUP, 34, 2023),
                TeamTrophy("Scottish League Cup", CompetitionType.LEAGUE_CUP, 28, 2024),
                TeamTrophy("Cup Winners' Cup", CompetitionType.UEFA_CUP_WINNERS_CUP, 1, 1972)
            )
            
            else -> emptyList()
        }
    }
    
    fun getCompetitionLogo(competitionType: CompetitionType): String {
        return when (competitionType) {
            CompetitionType.UEFA_CHAMPIONS_LEAGUE -> "https://media.api-sports.io/football/leagues/2.png"
            CompetitionType.UEFA_EUROPA_LEAGUE -> "https://media.api-sports.io/football/leagues/3.png"
            CompetitionType.UEFA_CONFERENCE_LEAGUE -> "https://media.api-sports.io/football/leagues/848.png"
            CompetitionType.LEAGUE -> "https://media.api-sports.io/football/leagues/39.png" // Default to PL
            CompetitionType.DOMESTIC_CUP -> "https://media.api-sports.io/football/leagues/45.png" // FA Cup
            CompetitionType.LEAGUE_CUP -> "https://media.api-sports.io/football/leagues/48.png" // EFL Cup
            else -> ""
        }
    }
}