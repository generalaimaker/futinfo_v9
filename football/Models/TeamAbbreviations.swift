import Foundation

class TeamAbbreviations {
    static let shared = TeamAbbreviations()

    // 3글자 약어
    private let abbreviations: [String: String] = [
        // Premier League
        "Arsenal": "ARS",
        "Aston Villa": "AVL",
        "Bournemouth": "BOU",
        "Brentford": "BRE",
        "Brighton": "BHA",
        "Burnley": "BUR",
        "Chelsea": "CHE",
        "Crystal Palace": "CRY",
        "Everton": "EVE",
        "Fulham": "FUL",
        "Liverpool": "LIV",
        "Luton Town": "LUT",
        "Manchester City": "MCI",
        "Manchester United": "MUN",
        "Newcastle United": "NEW",
        "Nottingham Forest": "NFO",
        "Sheffield United": "SHU",
        "Tottenham Hotspur": "TOT",
        "West Ham United": "WHU",
        "Wolverhampton Wanderers": "WOL",
        // La Liga
        "Real Madrid": "RMA",
        "Barcelona": "BAR",
        "Atletico Madrid": "ATM",
        "Sevilla": "SEV",
        "Real Sociedad": "RSO",
        "Real Betis": "BET",
        "Villarreal": "VIL",
        "Valencia": "VAL",
        "Athletic Club": "ATH",
        "Getafe": "GET",
        "Osasuna": "OSA",
        "Celta Vigo": "CEL",
        "Almeria": "ALM",
        "Cadiz": "CAD",
        "Granada": "GRA",
        "Mallorca": "MLL",
        "Las Palmas": "LPA",
        "Girona": "GIR",
        // Serie A
        "Inter Milan": "INT",
        "AC Milan": "MIL",
        "Juventus": "JUV",
        "Napoli": "NAP",
        "Roma": "ROM",
        "Lazio": "LAZ",
        "Atalanta": "ATA",
        "Torino": "TOR",
        "Fiorentina": "FIO",
        "Bologna": "BOL",
        "Udinese": "UDI",
        "Sassuolo": "SAS",
        "Empoli": "EMP",
        "Genoa": "GEN",
        "Lecce": "LEC",
        "Cagliari": "CAG",
        "Monza": "MON",
        "Salernitana": "SAL",
        "Hellas Verona": "VER",
        // Bundesliga
        "Bayern Munich": "FCB",
        "Bayern München": "FCB",
        "Borussia Dortmund": "BVB",
        "RB Leipzig": "RBL",
        "Bayer Leverkusen": "LEV",
        "Union Berlin": "UNB",
        "Freiburg": "SCF",
        "Eintracht Frankfurt": "SGE",
        "Wolfsburg": "WOB",
        "Mainz": "M05",
        "Borussia Mönchengladbach": "BMG",
        "Cologne": "KOE",
        "Augsburg": "FCA",
        "Stuttgart": "VFB",
        "Werder Bremen": "SVW",
        "Bochum": "BOC",
        "Heidenheim": "FCH",
        "Darmstadt": "SVD",
        "Hoffenheim": "TSG",
        "1.FC Heidenheim": "FCH",
        "1. FC Heidenheim": "FCH",
        "1 FC Heidenheim": "FCH",
        "FC Heidenheim": "FCH",
        // Ligue 1
        "Paris Saint-Germain": "PSG",
        "Paris Saint Germain": "PSG",
        "Marseille": "OM",
        "Lyon": "LYO",
        "Monaco": "ASM",
        "Lille": "LIL",
        "Rennes": "REN",
        "Nice": "OGC",
        "Lens": "LEN",
        "Toulouse": "TOU",
        "Nantes": "FCN",
        "Strasbourg": "STR",
        "Montpellier": "MON",
        "Brest": "BRE",
        "Reims": "REI",
        "Metz": "MET",
        "Clermont": "CLE",
        "Le Havre": "HAC",
        "Lorient": "LOR",

        // European Competitions (UCL & UEL Regulars)
        "Benfica": "BEN",
        "Porto": "POR",
        "Sporting CP": "SCP",
        "Celtic": "CEL",
        "Rangers": "RAN",
        "Shakhtar Donetsk": "SHA",
        "Dynamo Kyiv": "DYN",
        "Red Star Belgrade": "RSB",
        "Olympiacos": "OLY",
        "Galatasaray": "GAL",
        "Fenerbahce": "FEN",
        "Besiktas": "BES",
        "Ajax": "AJA",
        "Feyenoord": "FEY",
        "PSV": "PSV",
        "Club Brugge": "CBR",
        "Anderlecht": "AND",
        "Basel": "BAS",
        "Young Boys": "YBO",
        "Dinamo Zagreb": "DZG",
        "Sheriff Tiraspol": "SHF",
        "Slavia Prague": "SLP",
        "Sparta Prague": "SPA",
        "Ludogorets": "LUD",
        "Ferencvaros": "FER"
    ]

    // 줄임 이름 (Shortened Names)
    private let shortenedNames: [String: String] = [
        // Premier League
        "Manchester United": "Man United",
        "Manchester City": "Man City",
        "Tottenham Hotspur": "Tottenham",
        "Newcastle United": "Newcastle",
        "Nottingham Forest": "Nott'm Forest",
        "Sheffield United": "Sheffield Utd",
        "West Ham United": "West Ham",
        "Wolverhampton Wanderers": "Wolves",
        "Brighton & Hove Albion": "Brighton",
        "Brighton and Hove Albion": "Brighton",
        "Crystal Palace": "C. Palace",
        
        // La Liga
        // "Atletico Madrid": "Atlético", // 원래 이름 그대로 표시
        // "Athletic Club": "Athletic", // 원래 이름 그대로 표시
        "Real Sociedad": "R. Sociedad",
        "Real Betis": "Betis",
        "Real Valladolid": "Valladolid",
        "Celta Vigo": "Celta",
        "Espanyol Barcelona": "Espanyol",
        "Deportivo Alaves": "Alavés",
        "Rayo Vallecano": "Rayo",
        
        // Bundesliga
        // "Bayern Munich": "Bayern", // 원래 이름 그대로 표시
        // "Bayern München": "Bayern", // 원래 이름 그대로 표시
        "Borussia Dortmund": "Dortmund",
        "Borussia Mönchengladbach": "M'gladbach",
        "Bayer Leverkusen": "Leverkusen",
        "RB Leipzig": "Leipzig",
        "Eintracht Frankfurt": "Frankfurt",
        "Union Berlin": "Union",
        "Werder Bremen": "Bremen",
        "1.FC Heidenheim": "Heidenheim",
        "1. FC Heidenheim": "Heidenheim",
        "1 FC Heidenheim": "Heidenheim",
        "FC Heidenheim": "Heidenheim",
        "1899 Hoffenheim": "Hoffenheim",
        "TSG 1899 Hoffenheim": "Hoffenheim",
        "TSG Hoffenheim": "Hoffenheim",
        "FSV Mainz 05": "Mainz",
        "1. FSV Mainz 05": "Mainz",
        "1.FSV Mainz 05": "Mainz",
        "1 FSV Mainz 05": "Mainz",
        "VfL Wolfsburg": "Wolfsburg",
        "VFL Wolfsburg": "Wolfsburg",
        "SV Elversberg": "Elversberg",
        "SV 07 Elversberg": "Elversberg",
        "1. FC Köln": "Köln",
        "1.FC Köln": "Köln",
        "1 FC Köln": "Köln",
        "FC Köln": "Köln",
        "FC St. Pauli": "St. Pauli",
        "FC St Pauli": "St. Pauli",
        "St. Pauli": "St. Pauli",
        "FC Augsburg": "Augsburg",
        "VfB Stuttgart": "Stuttgart",
        "VfL Bochum": "Bochum",
        "VFL Bochum": "Bochum",
        "SC Freiburg": "Freiburg",
        "SV Darmstadt 98": "Darmstadt",
        "SV Darmstadt": "Darmstadt",
        "Fortuna Düsseldorf": "Düsseldorf",
        "Fortuna Dusseldorf": "Düsseldorf",
        "Holstein Kiel": "Kiel",
        
        // Ligue 1
        "Paris Saint-Germain": "PSG",
        "Paris Saint Germain": "PSG",
        "Olympique Lyonnais": "Lyon",
        "Olympique Marseille": "Marseille",
        "Olympique de Marseille": "Marseille",
        
        // Serie A
        "Inter Milan": "Inter",
        "AC Milan": "Milan",
        "Hellas Verona": "Verona",
        "Internazionale Milano": "Inter"
    ]

    private init() {}

    // 3글자 약어 반환
    static func abbreviation(for teamName: String) -> String {
        let normalized = teamName
            .replacingOccurrences(of: "-", with: " ")
            .trimmingCharacters(in: .whitespacesAndNewlines)
        return shared.abbreviations[normalized] ?? String(teamName.prefix(3)).uppercased()
    }
    
    // 줄임 이름 반환
    static func shortenedName(for teamName: String) -> String {
        let normalized = teamName
            .replacingOccurrences(of: "-", with: " ")
            .trimmingCharacters(in: .whitespacesAndNewlines)
        return shared.shortenedNames[normalized] ?? teamName
    }
}
