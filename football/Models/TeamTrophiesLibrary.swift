//
//  TeamTrophies 2.swift
//  football
//
//  Created by Hyun Woo Park on 5/7/25.
//


// TeamTrophiesLibrary.swift

import Foundation

/// 구조체: 각 팀의 주요 우승 기록
struct TeamTrophies: Identifiable {
    let id = UUID()
    let teamName: String // 팀 이름 (영문)
    let abbreviation: String // 약어
    let league: String // 소속 리그

    // 리그 우승
    let leagueTitles: Int
    let leagueLastWin: String?

    // 챔피언스리그
    let championsLeagueTitles: Int
    let championsLeagueLastWin: String?

    // 유로파리그
    let europaLeagueTitles: Int
    let europaLeagueLastWin: String?

    // 슈퍼컵
    let superCupTitles: Int
    let superCupLastWin: String?

    // 컨퍼런스리그
    let conferenceLeagueTitles: Int
    let conferenceLeagueLastWin: String?

    // 국내 컵대회 (FA컵, 포칼컵, 코파 델 레이, 코파 이탈리아, 쿠프 드 프랑스)
    let domesticCupTitles: Int
    let domesticCupLastWin: String?

    /// 총 트로피 수 계산
    var totalTrophies: Int {
        return leagueTitles + championsLeagueTitles + europaLeagueTitles + superCupTitles + conferenceLeagueTitles + domesticCupTitles
    }

    /// 가장 최근 우승 연도 반환 (문자열 기준 정렬)
    var latestWinYear: String {
        let allYears = [leagueLastWin, championsLeagueLastWin, europaLeagueLastWin, superCupLastWin, conferenceLeagueLastWin, domesticCupLastWin]
        return allYears.compactMap { $0 }.sorted(by: >).first ?? "-"
    }
}

/// 정렬 옵션
enum TrophySortOption {
    case totalDescending
    case latestYearDescending
}

/// TeamTrophiesLibrary 구조체 - 트로피 데이터 및 관련 기능 제공
struct TeamTrophiesLibrary {
    /// 정렬 함수
    static func sortTeams(by option: TrophySortOption, teams: [TeamTrophies]) -> [TeamTrophies] {
        switch option {
        case .totalDescending:
            return teams.sorted { $0.totalTrophies > $1.totalTrophies }
        case .latestYearDescending:
            return teams.sorted { $0.latestWinYear > $1.latestWinYear }
        }
    }
    
    /// 유럽 주요 팀의 트로피 통합 데이터 (2025년 5월 7일 기준)
    static let majorTeamTrophies: [TeamTrophies] = [

        // Premier League
        TeamTrophies(teamName: "Manchester United", abbreviation: "MUN", league: "Premier League",
                     leagueTitles: 20, leagueLastWin: "2013",
                     championsLeagueTitles: 3, championsLeagueLastWin: "2008",
                     europaLeagueTitles: 1, europaLeagueLastWin: "2017",
                     superCupTitles: 1, superCupLastWin: "1991",
                     conferenceLeagueTitles: 0, conferenceLeagueLastWin: nil,
                     domesticCupTitles: 12, domesticCupLastWin: "2016"),

        TeamTrophies(teamName: "Chelsea", abbreviation: "CHE", league: "Premier League",
                     leagueTitles: 6, leagueLastWin: "2017",
                     championsLeagueTitles: 2, championsLeagueLastWin: "2021",
                     europaLeagueTitles: 2, europaLeagueLastWin: "2019",
                     superCupTitles: 2, superCupLastWin: "2021",
                     conferenceLeagueTitles: 0, conferenceLeagueLastWin: nil,
                     domesticCupTitles: 8, domesticCupLastWin: "2018"),
        

        TeamTrophies(teamName: "Liverpool", abbreviation: "LIV", league: "Premier League",
                     leagueTitles: 20, leagueLastWin: "2025",
                     championsLeagueTitles: 6, championsLeagueLastWin: "2019",
                     europaLeagueTitles: 3, europaLeagueLastWin: "2001",
                     superCupTitles: 4, superCupLastWin: "2019",
                     conferenceLeagueTitles: 0, conferenceLeagueLastWin: nil,
                     domesticCupTitles: 8, domesticCupLastWin: "2022"),

        TeamTrophies(teamName: "Arsenal", abbreviation: "ARS", league: "Premier League",
                     leagueTitles: 13, leagueLastWin: "2004",
                     championsLeagueTitles: 0, championsLeagueLastWin: nil,
                     europaLeagueTitles: 0, europaLeagueLastWin: nil,
                     superCupTitles: 0, superCupLastWin: nil,
                     conferenceLeagueTitles: 0, conferenceLeagueLastWin: nil,
                     domesticCupTitles: 14, domesticCupLastWin: "2020"),

        TeamTrophies(teamName: "Everton", abbreviation: "EVE", league: "Premier League",
                     leagueTitles: 9, leagueLastWin: "1987",
                     championsLeagueTitles: 0, championsLeagueLastWin: nil,
                     europaLeagueTitles: 1, europaLeagueLastWin: "1985",
                     superCupTitles: 0, superCupLastWin: nil,
                     conferenceLeagueTitles: 0, conferenceLeagueLastWin: nil,
                     domesticCupTitles: 5, domesticCupLastWin: "1995"),

        TeamTrophies(teamName: "Manchester City", abbreviation: "MCI", league: "Premier League",
                     leagueTitles: 10, leagueLastWin: "2024",
                     championsLeagueTitles: 1, championsLeagueLastWin: "2023",
                     europaLeagueTitles: 0, europaLeagueLastWin: nil,
                     superCupTitles: 1, superCupLastWin: "2023",
                     conferenceLeagueTitles: 0, conferenceLeagueLastWin: nil,
                     domesticCupTitles: 6, domesticCupLastWin: "2019"),

        TeamTrophies(teamName: "Aston Villa", abbreviation: "AVL", league: "Premier League",
                     leagueTitles: 7, leagueLastWin: "1981",
                     championsLeagueTitles: 1, championsLeagueLastWin: "1982",
                     europaLeagueTitles: 0, europaLeagueLastWin: nil,
                     superCupTitles: 1, superCupLastWin: "1982",
                     conferenceLeagueTitles: 0, conferenceLeagueLastWin: nil,
                     domesticCupTitles: 7, domesticCupLastWin: "1996"),

        TeamTrophies(teamName: "Newcastle United", abbreviation: "NEW", league: "Premier League",
                     leagueTitles: 4, leagueLastWin: "1927",
                     championsLeagueTitles: 0, championsLeagueLastWin: nil,
                     europaLeagueTitles: 0, europaLeagueLastWin: nil,
                     superCupTitles: 0, superCupLastWin: nil,
                     conferenceLeagueTitles: 0, conferenceLeagueLastWin: nil,
                     domesticCupTitles: 6, domesticCupLastWin: "1955"),
        
        TeamTrophies(teamName: "West Ham United", abbreviation: "WHU", league: "Premier League",
                     leagueTitles: 0, leagueLastWin: nil,
                     championsLeagueTitles: 0, championsLeagueLastWin: nil,
                     europaLeagueTitles: 0, europaLeagueLastWin: nil,
                     superCupTitles: 0, superCupLastWin: nil,
                     conferenceLeagueTitles: 1, conferenceLeagueLastWin: "2023",
                     domesticCupTitles: 3, domesticCupLastWin: "1980"),

    
        // La Liga
        TeamTrophies(teamName: "Real Madrid", abbreviation: "RMA", league: "LaLiga",
                     leagueTitles: 36, leagueLastWin: "2024",
                     championsLeagueTitles: 15, championsLeagueLastWin: "2024",
                     europaLeagueTitles: 2, europaLeagueLastWin: "1986",
                     superCupTitles: 5, superCupLastWin: "2022",
                     conferenceLeagueTitles: 0, conferenceLeagueLastWin: nil,
                     domesticCupTitles: 20, domesticCupLastWin: "2014"),

        TeamTrophies(teamName: "Barcelona", abbreviation: "BAR", league: "LaLiga",
                     leagueTitles: 27, leagueLastWin: "2023",
                     championsLeagueTitles: 5, championsLeagueLastWin: "2015",
                     europaLeagueTitles: 0, europaLeagueLastWin: nil,
                     superCupTitles: 5, superCupLastWin: "2015",
                     conferenceLeagueTitles: 0, conferenceLeagueLastWin: nil,
                     domesticCupTitles: 32, domesticCupLastWin: "2025"),

        TeamTrophies(teamName: "Atletico Madrid", abbreviation: "ATM", league: "LaLiga",
                     leagueTitles: 11, leagueLastWin: "2021",
                     championsLeagueTitles: 0, championsLeagueLastWin: nil,
                     europaLeagueTitles: 3, europaLeagueLastWin: "2018",
                     superCupTitles: 3, superCupLastWin: "2018",
                     conferenceLeagueTitles: 0, conferenceLeagueLastWin: nil,
                     domesticCupTitles: 10, domesticCupLastWin: "2013"),

        TeamTrophies(teamName: "Athletic Club", abbreviation: "ATH", league: "LaLiga",
                     leagueTitles: 8, leagueLastWin: "1984",
                     championsLeagueTitles: 0, championsLeagueLastWin: nil,
                     europaLeagueTitles: 0, europaLeagueLastWin: nil,
                     superCupTitles: 3, superCupLastWin: "2021",
                     conferenceLeagueTitles: 0, conferenceLeagueLastWin: nil,
                     domesticCupTitles: 24, domesticCupLastWin: "2024"),

        TeamTrophies(teamName: "Valencia", abbreviation: "VAL", league: "LaLiga",
                     leagueTitles: 6, leagueLastWin: "2004",
                     championsLeagueTitles: 0, championsLeagueLastWin: nil,
                     europaLeagueTitles: 1, europaLeagueLastWin: "2004",
                     superCupTitles: 2, superCupLastWin: "2004",
                     conferenceLeagueTitles: 0, conferenceLeagueLastWin: nil,
                     domesticCupTitles: 8, domesticCupLastWin: "2019"),

        TeamTrophies(teamName: "Real Sociedad", abbreviation: "RSO", league: "LaLiga",
                     leagueTitles: 2, leagueLastWin: "1982",
                     championsLeagueTitles: 0, championsLeagueLastWin: nil,
                     europaLeagueTitles: 0, europaLeagueLastWin: nil,
                     superCupTitles: 1, superCupLastWin: "1982",
                     conferenceLeagueTitles: 0, conferenceLeagueLastWin: nil,
                     domesticCupTitles: 3, domesticCupLastWin: "2020"),

        TeamTrophies(teamName: "Deportivo La Coruna", abbreviation: "DEP", league: "LaLiga",
                     leagueTitles: 1, leagueLastWin: "2000",
                     championsLeagueTitles: 0, championsLeagueLastWin: nil,
                     europaLeagueTitles: 0, europaLeagueLastWin: nil,
                     superCupTitles: 3, superCupLastWin: "2002",
                     conferenceLeagueTitles: 0, conferenceLeagueLastWin: nil,
                     domesticCupTitles: 2, domesticCupLastWin: "2002"),
        
        TeamTrophies(teamName: "Sevilla", abbreviation: "SEV", league: "La Liga",
                     leagueTitles: 1, leagueLastWin: "1946",
                     championsLeagueTitles: 0, championsLeagueLastWin: nil,
                     europaLeagueTitles: 7, europaLeagueLastWin: "2023",
                     superCupTitles: 1, superCupLastWin: "2006",
                     conferenceLeagueTitles: 0, conferenceLeagueLastWin: nil,
                     domesticCupTitles: 5, domesticCupLastWin: "2010"),

        TeamTrophies(teamName: "Villarreal", abbreviation: "VIL", league: "La Liga",
                     leagueTitles: 0, leagueLastWin: nil,
                     championsLeagueTitles: 0, championsLeagueLastWin: nil,
                     europaLeagueTitles: 1, europaLeagueLastWin: "2021",
                     superCupTitles: 0, superCupLastWin: nil,
                     conferenceLeagueTitles: 0, conferenceLeagueLastWin: nil,
                     domesticCupTitles: 0, domesticCupLastWin: nil),
        

    
    //Bundesliga
    TeamTrophies(teamName: "Bayern Munich", abbreviation: "FCB", league: "Bundesliga",
                 leagueTitles: 34, leagueLastWin: "2025",
                 championsLeagueTitles: 6, championsLeagueLastWin: "2020",
                 europaLeagueTitles: 1, europaLeagueLastWin: "1996",
                 superCupTitles: 2, superCupLastWin: "2020",
                 conferenceLeagueTitles: 0, conferenceLeagueLastWin: nil,
                 domesticCupTitles: 20, domesticCupLastWin: "2020"),

    TeamTrophies(teamName: "Borussia Dortmund", abbreviation: "BVB", league: "Bundesliga",
                 leagueTitles: 8, leagueLastWin: "2012",
                 championsLeagueTitles: 1, championsLeagueLastWin: "1997",
                 europaLeagueTitles: 0, europaLeagueLastWin: nil,
                 superCupTitles: 6, superCupLastWin: "2019",
                 conferenceLeagueTitles: 0, conferenceLeagueLastWin: nil,
                 domesticCupTitles: 5, domesticCupLastWin: "2021"),
        
    TeamTrophies(teamName: "Bayer Leverkusen", abbreviation: "B04", league: "Bundesliga",
                leagueTitles: 1, leagueLastWin: "2024",
                championsLeagueTitles: 0, championsLeagueLastWin: nil,
                europaLeagueTitles: 1, europaLeagueLastWin: "1993",
                superCupTitles: 1, superCupLastWin: "2025",
                conferenceLeagueTitles: 0, conferenceLeagueLastWin: nil,
                domesticCupTitles: 2, domesticCupLastWin: "2024"),

    TeamTrophies(teamName: "Hamburger SV", abbreviation: "HSV", league: "Bundesliga",
                 leagueTitles: 6, leagueLastWin: "1983",
                 championsLeagueTitles: 1, championsLeagueLastWin: "1983",
                 europaLeagueTitles: 1, europaLeagueLastWin: "1977",
                 superCupTitles: 0, superCupLastWin: nil,
                 conferenceLeagueTitles: 0, conferenceLeagueLastWin: nil,
                 domesticCupTitles: 3, domesticCupLastWin: "1987"),

    TeamTrophies(teamName: "Werder Bremen", abbreviation: "SVW", league: "Bundesliga",
                 leagueTitles: 4, leagueLastWin: "2004",
                 championsLeagueTitles: 0, championsLeagueLastWin: nil,
                 europaLeagueTitles: 1, europaLeagueLastWin: "1992",
                 superCupTitles: 3, superCupLastWin: "2009",
                 conferenceLeagueTitles: 0, conferenceLeagueLastWin: nil,
                 domesticCupTitles: 6, domesticCupLastWin: "2009"),

    TeamTrophies(teamName: "Borussia Mönchengladbach", abbreviation: "BMG", league: "Bundesliga",
                 leagueTitles: 5, leagueLastWin: "1977",
                 championsLeagueTitles: 0, championsLeagueLastWin: nil,
                 europaLeagueTitles: 2, europaLeagueLastWin: "1979",
                 superCupTitles: 0, superCupLastWin: nil,
                 conferenceLeagueTitles: 0, conferenceLeagueLastWin: nil,
                 domesticCupTitles: 3, domesticCupLastWin: "1995"),

    TeamTrophies(teamName: "Stuttgart", abbreviation: "VFB", league: "Bundesliga",
                 leagueTitles: 5, leagueLastWin: "2007",
                 championsLeagueTitles: 0, championsLeagueLastWin: nil,
                 europaLeagueTitles: 0, europaLeagueLastWin: nil,
                 superCupTitles: 1, superCupLastWin: "1992",
                 conferenceLeagueTitles: 0, conferenceLeagueLastWin: nil,
                 domesticCupTitles: 3, domesticCupLastWin: "1997"),

    TeamTrophies(teamName: "Cologne", abbreviation: "KOE", league: "Bundesliga",
                 leagueTitles: 2, leagueLastWin: "1978",
                 championsLeagueTitles: 0, championsLeagueLastWin: nil,
                 europaLeagueTitles: 0, europaLeagueLastWin: nil,
                 superCupTitles: 0, superCupLastWin: nil,
                 conferenceLeagueTitles: 0, conferenceLeagueLastWin: nil,
                 domesticCupTitles: 4, domesticCupLastWin: "1983"),

    TeamTrophies(teamName: "Kaiserslautern", abbreviation: "FCK", league: "Bundesliga",
                 leagueTitles: 4, leagueLastWin: "1998",
                 championsLeagueTitles: 0, championsLeagueLastWin: nil,
                 europaLeagueTitles: 0, europaLeagueLastWin: nil,
                 superCupTitles: 0, superCupLastWin: nil,
                 conferenceLeagueTitles: 0, conferenceLeagueLastWin: nil,
                 domesticCupTitles: 2, domesticCupLastWin: "1996"),

    TeamTrophies(teamName: "1860 Munich", abbreviation: "M60", league: "Bundesliga",
                 leagueTitles: 1, leagueLastWin: "1966",
                 championsLeagueTitles: 0, championsLeagueLastWin: nil,
                 europaLeagueTitles: 0, europaLeagueLastWin: nil,
                 superCupTitles: 0, superCupLastWin: nil,
                 conferenceLeagueTitles: 0, conferenceLeagueLastWin: nil,
                 domesticCupTitles: 2, domesticCupLastWin: "1964"),
    
        
    // Serie A
    TeamTrophies(teamName: "Juventus", abbreviation: "JUV", league: "Serie A",
                 leagueTitles: 36, leagueLastWin: "2020",
                 championsLeagueTitles: 2, championsLeagueLastWin: "1996",
                 europaLeagueTitles: 3, europaLeagueLastWin: "1993",
                 superCupTitles: 2, superCupLastWin: "1996",
                 conferenceLeagueTitles: 0, conferenceLeagueLastWin: nil,
                 domesticCupTitles: 14, domesticCupLastWin: "2021"),

    TeamTrophies(teamName: "Inter Milan", abbreviation: "INT", league: "Serie A",
                 leagueTitles: 20, leagueLastWin: "2024",
                 championsLeagueTitles: 3, championsLeagueLastWin: "2010",
                 europaLeagueTitles: 3, europaLeagueLastWin: "1998",
                 superCupTitles: 3, superCupLastWin: "2010",
                 conferenceLeagueTitles: 0, conferenceLeagueLastWin: nil,
                 domesticCupTitles: 9, domesticCupLastWin: "2023"),

    TeamTrophies(teamName: "AC Milan", abbreviation: "MIL", league: "Serie A",
                 leagueTitles: 19, leagueLastWin: "2022",
                 championsLeagueTitles: 7, championsLeagueLastWin: "2007",
                 europaLeagueTitles: 0, europaLeagueLastWin: nil,
                 superCupTitles: 5, superCupLastWin: "2007",
                 conferenceLeagueTitles: 0, conferenceLeagueLastWin: nil,
                 domesticCupTitles: 5, domesticCupLastWin: "2003"),

    TeamTrophies(teamName: "Napoli", abbreviation: "NAP", league: "Serie A",
                 leagueTitles: 3, leagueLastWin: "2023",
                 championsLeagueTitles: 0, championsLeagueLastWin: nil,
                 europaLeagueTitles: 1, europaLeagueLastWin: "1989",
                 superCupTitles: 0, superCupLastWin: nil,
                 conferenceLeagueTitles: 0, conferenceLeagueLastWin: nil,
                 domesticCupTitles: 6, domesticCupLastWin: "2020"),

    TeamTrophies(teamName: "AS Roma", abbreviation: "ROM", league: "Serie A",
                 leagueTitles: 3, leagueLastWin: "2001",
                 championsLeagueTitles: 0, championsLeagueLastWin: nil,
                 europaLeagueTitles: 0, europaLeagueLastWin: nil,
                 superCupTitles: 0, superCupLastWin: nil,
                 conferenceLeagueTitles: 1, conferenceLeagueLastWin: "2022",
                 domesticCupTitles: 9, domesticCupLastWin: "2008"),

    TeamTrophies(teamName: "Lazio", abbreviation: "LAZ", league: "Serie A",
                 leagueTitles: 2, leagueLastWin: "2000",
                 championsLeagueTitles: 0, championsLeagueLastWin: nil,
                 europaLeagueTitles: 0, europaLeagueLastWin: nil,
                 superCupTitles: 2, superCupLastWin: "2000",
                 conferenceLeagueTitles: 0, conferenceLeagueLastWin: nil,
                 domesticCupTitles: 7, domesticCupLastWin: "2019"),

    TeamTrophies(teamName: "Torino", abbreviation: "TOR", league: "Serie A",
                 leagueTitles: 7, leagueLastWin: "1976",
                 championsLeagueTitles: 0, championsLeagueLastWin: nil,
                 europaLeagueTitles: 0, europaLeagueLastWin: nil,
                 superCupTitles: 0, superCupLastWin: nil,
                 conferenceLeagueTitles: 0, conferenceLeagueLastWin: nil,
                 domesticCupTitles: 5, domesticCupLastWin: "1993"),

    TeamTrophies(teamName: "Bologna", abbreviation: "BOL", league: "Serie A",
                 leagueTitles: 7, leagueLastWin: "1964",
                 championsLeagueTitles: 0, championsLeagueLastWin: nil,
                 europaLeagueTitles: 0, europaLeagueLastWin: nil,
                 superCupTitles: 0, superCupLastWin: nil,
                 conferenceLeagueTitles: 0, conferenceLeagueLastWin: nil,
                 domesticCupTitles: 2, domesticCupLastWin: "1974"),

    TeamTrophies(teamName: "Fiorentina", abbreviation: "FIO", league: "Serie A",
                 leagueTitles: 2, leagueLastWin: "1969",
                 championsLeagueTitles: 0, championsLeagueLastWin: nil,
                 europaLeagueTitles: 0, europaLeagueLastWin: nil,
                 superCupTitles: 0, superCupLastWin: nil,
                 conferenceLeagueTitles: 0, conferenceLeagueLastWin: nil,
                 domesticCupTitles: 6, domesticCupLastWin: "2001"),
    
    
    

        
        // Ligue 1
        TeamTrophies(teamName: "Paris Saint-Germain", abbreviation: "PSG", league: "Ligue 1",
                     leagueTitles: 13, leagueLastWin: "2025",
                     championsLeagueTitles: 0, championsLeagueLastWin: nil,
                     europaLeagueTitles: 0, europaLeagueLastWin: nil,
                     superCupTitles: 9, superCupLastWin: "2023",
                     conferenceLeagueTitles: 0, conferenceLeagueLastWin: nil,
                     domesticCupTitles: 14, domesticCupLastWin: "2021"),

        TeamTrophies(teamName: "Marseille", abbreviation: "OM", league: "Ligue 1",
                     leagueTitles: 9, leagueLastWin: "2010",
                     championsLeagueTitles: 1, championsLeagueLastWin: "1993",
                     europaLeagueTitles: 0, europaLeagueLastWin: nil,
                     superCupTitles: 3, superCupLastWin: "2011",
                     conferenceLeagueTitles: 0, conferenceLeagueLastWin: nil,
                     domesticCupTitles: 10, domesticCupLastWin: "1989"),

        TeamTrophies(teamName: "Saint-Etienne", abbreviation: "ASSE", league: "Ligue 1",
                     leagueTitles: 10, leagueLastWin: "1981",
                     championsLeagueTitles: 0, championsLeagueLastWin: nil,
                     europaLeagueTitles: 0, europaLeagueLastWin: nil,
                     superCupTitles: 0, superCupLastWin: nil,
                     conferenceLeagueTitles: 0, conferenceLeagueLastWin: nil,
                     domesticCupTitles: 6, domesticCupLastWin: "1977"),

        TeamTrophies(teamName: "Monaco", abbreviation: "ASM", league: "Ligue 1",
                     leagueTitles: 8, leagueLastWin: "2017",
                     championsLeagueTitles: 0, championsLeagueLastWin: nil,
                     europaLeagueTitles: 0, europaLeagueLastWin: nil,
                     superCupTitles: 4, superCupLastWin: "2000",
                     conferenceLeagueTitles: 0, conferenceLeagueLastWin: nil,
                     domesticCupTitles: 5, domesticCupLastWin: "1991"),

        TeamTrophies(teamName: "Lyon", abbreviation: "OL", league: "Ligue 1",
                     leagueTitles: 7, leagueLastWin: "2008",
                     championsLeagueTitles: 0, championsLeagueLastWin: nil,
                     europaLeagueTitles: 0, europaLeagueLastWin: nil,
                     superCupTitles: 7, superCupLastWin: "2007",
                     conferenceLeagueTitles: 0, conferenceLeagueLastWin: nil,
                     domesticCupTitles: 5, domesticCupLastWin: "2012"),

        TeamTrophies(teamName: "Nantes", abbreviation: "FCN", league: "Ligue 1",
                     leagueTitles: 8, leagueLastWin: "2001",
                     championsLeagueTitles: 0, championsLeagueLastWin: nil,
                     europaLeagueTitles: 0, europaLeagueLastWin: nil,
                     superCupTitles: 3, superCupLastWin: "2001",
                     conferenceLeagueTitles: 0, conferenceLeagueLastWin: nil,
                     domesticCupTitles: 4, domesticCupLastWin: "2022"),

        TeamTrophies(teamName: "Bordeaux", abbreviation: "GIR", league: "Ligue 1",
                     leagueTitles: 6, leagueLastWin: "2009",
                     championsLeagueTitles: 0, championsLeagueLastWin: nil,
                     europaLeagueTitles: 0, europaLeagueLastWin: nil,
                     superCupTitles: 3, superCupLastWin: "2009",
                     conferenceLeagueTitles: 0, conferenceLeagueLastWin: nil,
                     domesticCupTitles: 4, domesticCupLastWin: "2013"),

        TeamTrophies(teamName: "Reims", abbreviation: "SDR", league: "Ligue 1",
                     leagueTitles: 6, leagueLastWin: "1962",
                     championsLeagueTitles: 0, championsLeagueLastWin: nil,
                     europaLeagueTitles: 0, europaLeagueLastWin: nil,
                     superCupTitles: 0, superCupLastWin: nil,
                     conferenceLeagueTitles: 0, conferenceLeagueLastWin: nil,
                     domesticCupTitles: 2, domesticCupLastWin: "1958"),

        TeamTrophies(teamName: "Nice", abbreviation: "OGCN", league: "Ligue 1",
                     leagueTitles: 4, leagueLastWin: "1959",
                     championsLeagueTitles: 0, championsLeagueLastWin: nil,
                     europaLeagueTitles: 0, europaLeagueLastWin: nil,
                     superCupTitles: 0, superCupLastWin: nil,
                     conferenceLeagueTitles: 0, conferenceLeagueLastWin: nil,
                     domesticCupTitles: 3, domesticCupLastWin: "1997"),
        
    
        
    //Other Leagues
    TeamTrophies(teamName: "Sunderland", abbreviation: "SUN", league: "EFL",
                 leagueTitles: 6, leagueLastWin: "1936",
                 championsLeagueTitles: 0, championsLeagueLastWin: nil,
                 europaLeagueTitles: 0, europaLeagueLastWin: nil,
                 superCupTitles: 0, superCupLastWin: nil,
                 conferenceLeagueTitles: 0, conferenceLeagueLastWin: nil,
                 domesticCupTitles: 2, domesticCupLastWin: "1973"),

    TeamTrophies(teamName: "Sheffield Wednesday", abbreviation: "SHW", league: "EFL",
                 leagueTitles: 4, leagueLastWin: "1930",
                 championsLeagueTitles: 0, championsLeagueLastWin: nil,
                 europaLeagueTitles: 0, europaLeagueLastWin: nil,
                 superCupTitles: 0, superCupLastWin: nil,
                 conferenceLeagueTitles: 0, conferenceLeagueLastWin: nil,
                 domesticCupTitles: 3, domesticCupLastWin: "1935"),
    
    TeamTrophies(teamName: "Celtic", abbreviation: "CEL", league: "Scottish Premiership",
                 leagueTitles: 53, leagueLastWin: "2023",
                 championsLeagueTitles: 1, championsLeagueLastWin: "1967",
                 europaLeagueTitles: 0, europaLeagueLastWin: nil,
                 superCupTitles: 0, superCupLastWin: nil,
                 conferenceLeagueTitles: 0, conferenceLeagueLastWin: nil,
                 domesticCupTitles: 40, domesticCupLastWin: "2023"),
    
    TeamTrophies(teamName: "Rangers", abbreviation: "RAN", league: "Scottish Premiership",
                 leagueTitles: 55, leagueLastWin: "2021",
                 championsLeagueTitles: 0, championsLeagueLastWin: nil,
                 europaLeagueTitles: 0, europaLeagueLastWin: nil,
                 superCupTitles: 0, superCupLastWin: nil,
                 conferenceLeagueTitles: 0, conferenceLeagueLastWin: nil,
                 domesticCupTitles: 34, domesticCupLastWin: "2023"),

    TeamTrophies(teamName: "Feyenoord", abbreviation: "FEY", league: "Eredivisie",
                 leagueTitles: 16, leagueLastWin: "2023",
                 championsLeagueTitles: 1, championsLeagueLastWin: "1970",
                 europaLeagueTitles: 2, europaLeagueLastWin: "2002",
                 superCupTitles: 0, superCupLastWin: nil,
                 conferenceLeagueTitles: 0, conferenceLeagueLastWin: nil,
                 domesticCupTitles: 13, domesticCupLastWin: "2018"),

    TeamTrophies(teamName: "Ajax", abbreviation: "AJA", league: "Eredivisie",
                 leagueTitles: 36, leagueLastWin: "2022",
                 championsLeagueTitles: 4, championsLeagueLastWin: "1995",
                 europaLeagueTitles: 1, europaLeagueLastWin: "1992",
                 superCupTitles: 2, superCupLastWin: "1995",
                 conferenceLeagueTitles: 0, conferenceLeagueLastWin: nil,
                 domesticCupTitles: 20, domesticCupLastWin: "2021"),

    TeamTrophies(teamName: "Porto", abbreviation: "POR", league: "Primeira Liga",
                 leagueTitles: 30, leagueLastWin: "2022",
                 championsLeagueTitles: 2, championsLeagueLastWin: "2004",
                 europaLeagueTitles: 2, europaLeagueLastWin: "2011",
                 superCupTitles: 1, superCupLastWin: "1987",
                 conferenceLeagueTitles: 0, conferenceLeagueLastWin: nil,
                 domesticCupTitles: 18, domesticCupLastWin: "2022"),

    TeamTrophies(teamName: "Benfica", abbreviation: "BEN", league: "Primeira Liga",
                 leagueTitles: 38, leagueLastWin: "2023",
                 championsLeagueTitles: 2, championsLeagueLastWin: "1962",
                 europaLeagueTitles: 0, europaLeagueLastWin: nil,
                 superCupTitles: 0, superCupLastWin: nil,
                 conferenceLeagueTitles: 0, conferenceLeagueLastWin: nil,
                 domesticCupTitles: 26, domesticCupLastWin: "2017"),

    TeamTrophies(teamName: "Red Star Belgrade", abbreviation: "RSB", league: "Serbian SuperLiga",
                 leagueTitles: 34, leagueLastWin: "2023",
                 championsLeagueTitles: 1, championsLeagueLastWin: "1991",
                 europaLeagueTitles: 0, europaLeagueLastWin: nil,
                 superCupTitles: 0, superCupLastWin: nil,
                 conferenceLeagueTitles: 0, conferenceLeagueLastWin: nil,
                 domesticCupTitles: 25, domesticCupLastWin: "2023"),

    TeamTrophies(teamName: "Steaua Bucharest", abbreviation: "STB", league: "Liga I",
                 leagueTitles: 26, leagueLastWin: "2015",
                 championsLeagueTitles: 1, championsLeagueLastWin: "1986",
                 europaLeagueTitles: 0, europaLeagueLastWin: nil,
                 superCupTitles: 1, superCupLastWin: "1986",
                 conferenceLeagueTitles: 0, conferenceLeagueLastWin: nil,
                 domesticCupTitles: 22, domesticCupLastWin: "2015")
    

    ]
    
    // 팀 이름과 ID 매핑 (확장된 매핑)
    static let teamNameToId: [String: Int] = [
        // Premier League
        "Manchester United": 33,
        "Manchester City": 50,
        "Chelsea": 49,
        "Liverpool": 40,
        "Arsenal": 42,
        "Everton": 45,
        "Aston Villa": 66,
        "Newcastle United": 34,
        "West Ham United": 48,
        
        // La Liga
        "Real Madrid": 541,
        "Barcelona": 529,
        "Atletico Madrid": 530,
        "Athletic Club": 531,
        "Valencia": 532,
        "Real Sociedad": 548,
        "Deportivo La Coruna": 724,
        "Sevilla": 536,
        "Villarreal": 533,
        
        // Bundesliga
        "Bayern Munich": 157,
        "Borussia Dortmund": 165,
        "Hamburger SV": 176,
        "Werder Bremen": 162,
        "Borussia Mönchengladbach": 163,
        "Stuttgart": 172,
        "Cologne": 192,
        "Kaiserslautern": 174,
        "1860 Munich": 182,
        
        // Serie A
        "Juventus": 496,
        "Inter Milan": 505,
        "AC Milan": 489,
        "Napoli": 492,
        "AS Roma": 497,
        "Lazio": 487,
        "Torino": 503,
        "Bologna": 500,
        "Fiorentina": 502,
        
        // Ligue 1
        "Paris Saint-Germain": 85,
        "Marseille": 81,
        "Saint-Etienne": 1063,
        "Monaco": 91,
        "Lyon": 80,
        "Nantes": 83,
        "Bordeaux": 78,
        "Reims": 93,
        "Nice": 84,
        
        
        // Other Leagues
        "Sunderland": 62,
        "Sheffield Wednesday": 63,
        "Celtic": 247,
        "Rangers": 248,
        "Feyenoord": 68,
        "Ajax": 194,
        "Porto": 212,
        "Benfica": 211,
        "Red Star Belgrade": 598,
        "Steaua Bucharest": 559,
        
        // 기타 팀들
        "Bayer Leverkusen": 168,
        "Eintracht Frankfurt": 169,
        "Shakhtar Donetsk": 550,
        "Club Brugge": 569
    ]
    
    // ID로 팀 이름을 빠르게 조회하기 위한 역방향 매핑
    static let teamIdToName: [Int: String] = Dictionary(uniqueKeysWithValues:
        teamNameToId.map { ($0.value, $0.key) }
    )
    
    // 캐싱을 위한 변수들
    private static var teamNameCache: [Int: String] = [:]
    private static var trophyCache: [String: TeamTrophies] = [:]
    private static var teamTrophyCache: [Int: [TeamTrophy]] = [:]
    private static var trophySummaryCache: [String: [String: Int]] = [:]
    private static var sortedCompetitionsCache: [String: [String]] = [:]
    private static var lastWinYearCache: [String: String] = [:]
    
    // 캐시 초기화 메서드 (필요시 호출)
    static func clearCaches() {
        teamNameCache.removeAll()
        trophyCache.removeAll()
        teamTrophyCache.removeAll()
        trophySummaryCache.removeAll()
        sortedCompetitionsCache.removeAll()
        lastWinYearCache.removeAll()
    }
    
    // ID로 팀 이름 찾기 (최적화됨)
    static func getTeamName(for teamId: Int) -> String? {
        // 캐시에서 먼저 확인
        if let cachedName = teamNameCache[teamId] {
            return cachedName
        }
        
        // 역방향 매핑에서 조회 (O(1) 시간 복잡도)
        let name = teamIdToName[teamId]
        
        // 캐시에 저장
        if let name = name {
            teamNameCache[teamId] = name
        }
        
        return name
    }
    
    // 팀 이름으로 트로피 정보 찾기 (캐싱 추가)
    static func getTrophies(forTeam teamName: String) -> TeamTrophies? {
        // 캐시에서 먼저 확인
        if let cached = trophyCache[teamName] {
            return cached
        }
        
        // 캐시에 없으면 배열에서 검색
        if let trophy = majorTeamTrophies.first(where: { $0.teamName == teamName }) {
            // 결과를 캐시에 저장
            trophyCache[teamName] = trophy
            return trophy
        }
        
        return nil
    }
    
    // 리그에 해당하는 국가 찾기
    static func getCountryForLeague(_ league: String) -> String {
        switch league {
        case "EPL", "Premier League":
            return "England"
        case "LaLiga", "La Liga":
            return "Spain"
        case "Serie A":
            return "Italy"
        case "Bundesliga":
            return "Germany"
        case "Ligue 1":
            return "France"
        case "Eredivisie":
            return "Netherlands"
        case "Primeira Liga":
            return "Portugal"
        case "Scottish Premiership":
            return "Scotland"
        case "EFL":
            return "England"
        case "Serbian SuperLiga":
            return "Serbia"
        case "Liga I":
            return "Romania"
        default:
            return "Europe"
        }
    }
    
    // 리그에 해당하는 국내 컵대회 이름 찾기
    static func getDomesticCupName(_ league: String) -> String {
        switch league {
        case "EPL", "Premier League":
            return "FA Cup"
        case "LaLiga", "La Liga":
            return "Copa del Rey"
        case "Serie A":
            return "Coppa Italia"
        case "Bundesliga":
            return "DFB-Pokal"
        case "Ligue 1":
            return "Coupe de France"
        case "Eredivisie":
            return "KNVB Cup"
        case "Primeira Liga":
            return "Taça de Portugal"
        case "Scottish Premiership":
            return "Scottish Cup"
        default:
            return "Domestic Cup"
        }
    }
    
    // 대회 로고 URL 가져오기
    static func getCompetitionLogo(forCompetition competition: String) -> String {
        switch competition {
        case "UEFA Champions League":
            return "https://media.api-sports.io/football/leagues/2.png"
        case "UEFA Europa League":
            return "https://media.api-sports.io/football/leagues/3.png"
        case "UEFA Conference League":
            return "https://media.api-sports.io/football/leagues/848.png"
        case "UEFA Super Cup":
            return "https://media.api-sports.io/football/leagues/531.png"
        case "EPL", "Premier League":
            return "https://media.api-sports.io/football/leagues/39.png"
        case "LaLiga", "La Liga":
            return "https://media.api-sports.io/football/leagues/140.png"
        case "Serie A":
            return "https://media.api-sports.io/football/leagues/135.png"
        case "Bundesliga":
            return "https://media.api-sports.io/football/leagues/78.png"
        case "Ligue 1":
            return "https://media.api-sports.io/football/leagues/61.png"
        case "FA Cup":
            return "https://media.api-sports.io/football/leagues/45.png"
        case "Copa del Rey":
            return "https://media.api-sports.io/football/leagues/143.png"
        case "Coppa Italia":
            return "https://media.api-sports.io/football/leagues/137.png"
        case "DFB-Pokal":
            return "https://media.api-sports.io/football/leagues/81.png"
        case "Coupe de France":
            return "https://media.api-sports.io/football/leagues/66.png"
        default:
            return ""
        }
    }
    
    // 팀 ID에 해당하는 트로피 데이터를 TeamTrophy 배열로 변환하는 함수 (캐싱 추가)
    static func getTrophiesForTeam(teamId: Int) -> [TeamTrophy] {
        // 캐시에서 먼저 확인
        if let cachedTrophies = teamTrophyCache[teamId] {
            return cachedTrophies
        }
        
        guard let teamName = getTeamName(for: teamId),
              let teamTrophies = getTrophies(forTeam: teamName) else {
            // 결과가 없는 경우도 캐시에 저장 (negative caching)
            teamTrophyCache[teamId] = []
            return []
        }
        
        var result: [TeamTrophy] = []
        
        // 리그 우승
        if teamTrophies.leagueTitles > 0 {
            var trophy = TeamTrophy(
                league: teamTrophies.league,
                country: getCountryForLeague(teamTrophies.league),
                season: teamTrophies.leagueLastWin ?? "N/A",
                place: "Winner"
            )
            trophy.totalCount = teamTrophies.leagueTitles
            result.append(trophy)
        }
        
        // 챔피언스리그
        if teamTrophies.championsLeagueTitles > 0 {
            var trophy = TeamTrophy(
                league: "UEFA Champions League",
                country: "Europe",
                season: teamTrophies.championsLeagueLastWin ?? "N/A",
                place: "Winner"
            )
            trophy.totalCount = teamTrophies.championsLeagueTitles
            result.append(trophy)
        }
        
        // 유로파리그
        if teamTrophies.europaLeagueTitles > 0 {
            var trophy = TeamTrophy(
                league: "UEFA Europa League",
                country: "Europe",
                season: teamTrophies.europaLeagueLastWin ?? "N/A",
                place: "Winner"
            )
            trophy.totalCount = teamTrophies.europaLeagueTitles
            result.append(trophy)
        }
        
        // 슈퍼컵
        if teamTrophies.superCupTitles > 0 {
            var trophy = TeamTrophy(
                league: "UEFA Super Cup",
                country: "Europe",
                season: teamTrophies.superCupLastWin ?? "N/A",
                place: "Winner"
            )
            trophy.totalCount = teamTrophies.superCupTitles
            result.append(trophy)
        }
        
        // 컨퍼런스리그
        if teamTrophies.conferenceLeagueTitles > 0 {
            var trophy = TeamTrophy(
                league: "UEFA Conference League",
                country: "Europe",
                season: teamTrophies.conferenceLeagueLastWin ?? "N/A",
                place: "Winner"
            )
            trophy.totalCount = teamTrophies.conferenceLeagueTitles
            result.append(trophy)
        }
        
        // 국내 컵대회
        if teamTrophies.domesticCupTitles > 0 {
            let cupName = getDomesticCupName(teamTrophies.league)
            var trophy = TeamTrophy(
                league: cupName,
                country: getCountryForLeague(teamTrophies.league),
                season: teamTrophies.domesticCupLastWin ?? "N/A",
                place: "Winner"
            )
            trophy.totalCount = teamTrophies.domesticCupTitles
            result.append(trophy)
        }
        
        // 결과를 캐시에 저장
        teamTrophyCache[teamId] = result
        
        return result
    }
    
    // 트로피 요약 정보 가져오기 (캐싱 추가)
    static func getTrophySummary(forTeam teamName: String) -> [String: Int] {
        // 캐시에서 먼저 확인
        if let cachedSummary = trophySummaryCache[teamName] {
            return cachedSummary
        }
        
        guard let teamTrophies = getTrophies(forTeam: teamName) else {
            // 결과가 없는 경우도 캐시에 저장 (negative caching)
            trophySummaryCache[teamName] = [:]
            return [:]
        }
        
        var summary: [String: Int] = [:]
        
        if teamTrophies.leagueTitles > 0 {
            summary[teamTrophies.league] = teamTrophies.leagueTitles
        }
        
        if teamTrophies.championsLeagueTitles > 0 {
            summary["UEFA Champions League"] = teamTrophies.championsLeagueTitles
        }
        
        if teamTrophies.europaLeagueTitles > 0 {
            summary["UEFA Europa League"] = teamTrophies.europaLeagueTitles
        }
        
        if teamTrophies.superCupTitles > 0 {
            summary["UEFA Super Cup"] = teamTrophies.superCupTitles
        }
        
        if teamTrophies.conferenceLeagueTitles > 0 {
            summary["UEFA Conference League"] = teamTrophies.conferenceLeagueTitles
        }
        
        if teamTrophies.domesticCupTitles > 0 {
            summary[getDomesticCupName(teamTrophies.league)] = teamTrophies.domesticCupTitles
        }
        
        // 결과를 캐시에 저장
        trophySummaryCache[teamName] = summary
        
        return summary
    }
    
    // 정렬된 대회 목록 가져오기 (캐싱 추가)
    static func getSortedCompetitions(forTeam teamName: String, sortBy criterion: String) -> [String] {
        // 캐시 키 생성 (팀 이름 + 정렬 기준)
        let cacheKey = "\(teamName)_\(criterion)"
        
        // 캐시에서 먼저 확인
        if let cachedCompetitions = sortedCompetitionsCache[cacheKey] {
            return cachedCompetitions
        }
        
        guard let teamTrophies = getTrophies(forTeam: teamName) else {
            // 결과가 없는 경우도 캐시에 저장 (negative caching)
            sortedCompetitionsCache[cacheKey] = []
            return []
        }
        
        var competitions: [String] = []
        
        if teamTrophies.leagueTitles > 0 {
            competitions.append(teamTrophies.league)
        }
        
        if teamTrophies.championsLeagueTitles > 0 {
            competitions.append("UEFA Champions League")
        }
        
        if teamTrophies.europaLeagueTitles > 0 {
            competitions.append("UEFA Europa League")
        }
        
        if teamTrophies.superCupTitles > 0 {
            competitions.append("UEFA Super Cup")
        }
        
        if teamTrophies.conferenceLeagueTitles > 0 {
            competitions.append("UEFA Conference League")
        }
        
        if teamTrophies.domesticCupTitles > 0 {
            competitions.append(getDomesticCupName(teamTrophies.league))
        }
        
        var result: [String] = []
        
        if criterion == "year" {
            // 연도별 정렬 (최신순)
            result = competitions.sorted { comp1, comp2 in
                let year1 = getLastWinYear(forTeam: teamName, competition: comp1) ?? "0"
                let year2 = getLastWinYear(forTeam: teamName, competition: comp2) ?? "0"
                return year1 > year2
            }
        } else {
            // 대회별 정렬 (알파벳순)
            result = competitions.sorted()
        }
        
        // 결과를 캐시에 저장
        sortedCompetitionsCache[cacheKey] = result
        
        return result
    }
    
    // 마지막 우승 연도 가져오기 (캐싱 추가)
    static func getLastWinYear(forTeam teamName: String, competition: String) -> String? {
        // 캐시 키 생성 (팀 이름 + 대회 이름)
        let cacheKey = "\(teamName)_\(competition)"
        
        // 캐시에서 먼저 확인
        if let cachedYear = lastWinYearCache[cacheKey] {
            return cachedYear == "nil" ? nil : cachedYear
        }
        
        guard let teamTrophies = getTrophies(forTeam: teamName) else {
            // 결과가 없는 경우도 캐시에 저장 (negative caching)
            lastWinYearCache[cacheKey] = "nil"
            return nil
        }
        
        var result: String?
        
        switch competition {
        case teamTrophies.league:
            result = teamTrophies.leagueLastWin
        case "UEFA Champions League":
            result = teamTrophies.championsLeagueLastWin
        case "UEFA Europa League":
            result = teamTrophies.europaLeagueLastWin
        case "UEFA Super Cup":
            result = teamTrophies.superCupLastWin
        case "UEFA Conference League":
            result = teamTrophies.conferenceLeagueLastWin
        case getDomesticCupName(teamTrophies.league):
            result = teamTrophies.domesticCupLastWin
        default:
            result = nil
        }
        
        // 결과를 캐시에 저장 (nil 값은 "nil" 문자열로 저장)
        lastWinYearCache[cacheKey] = result ?? "nil"
        
        return result
    }
}
