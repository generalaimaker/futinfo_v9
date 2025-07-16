import SwiftUI

// 팀별 전설적인 요소들 (역사, 별명, 라이벌, 특별한 순간 등)
struct TeamLegendData {
    let teamId: Int
    let founded: Int
    let stadiumName: String
    let stadiumCapacity: String
    let nicknames: [String]
    let rivals: [(teamId: Int, rivalryName: String)]
    let legendaryPlayers: [String]
    let historicMoments: [String]
    let trophyEmojis: String
    let specialPattern: String? // 유니폼 패턴이나 특별한 디자인 요소
}

class TeamLegendDataService {
    static let shared = TeamLegendDataService()
    
    private let teamLegends: [Int: TeamLegendData] = [
        // Premier League
        33: TeamLegendData(  // Manchester United
            teamId: 33,
            founded: 1878,
            stadiumName: "Old Trafford",
            stadiumCapacity: "74,310",
            nicknames: ["Red Devils", "The Theatre of Dreams"],
            rivals: [(50, "Manchester Derby"), (40, "North West Derby")],
            legendaryPlayers: ["Sir Bobby Charlton", "George Best", "Eric Cantona", "Ryan Giggs", "Paul Scholes"],
            historicMoments: ["1999 Treble", "Munich Air Disaster 1958", "Class of '92"],
            trophyEmojis: "🏆🏆🏆🏆🏆🏆🏆🏆🏆🏆🏆🏆🏆🏆🏆🏆🏆🏆🏆🏆",
            specialPattern: "red_devils"
        ),
        40: TeamLegendData(  // Liverpool
            teamId: 40,
            founded: 1892,
            stadiumName: "Anfield",
            stadiumCapacity: "53,394",
            nicknames: ["The Reds", "The Kop"],
            rivals: [(33, "North West Derby"), (45, "Merseyside Derby")],
            legendaryPlayers: ["Kenny Dalglish", "Steven Gerrard", "Ian Rush", "John Barnes", "Graeme Souness"],
            historicMoments: ["Istanbul 2005", "6 European Cups", "2020 Premier League"],
            trophyEmojis: "🏆🏆🏆🏆🏆🏆🏆🏆🏆🏆🏆🏆🏆🏆🏆🏆🏆🏆🏆",
            specialPattern: "liverbird"
        ),
        50: TeamLegendData(  // Manchester City
            teamId: 50,
            founded: 1880,
            stadiumName: "Etihad Stadium",
            stadiumCapacity: "53,400",
            nicknames: ["Citizens", "Sky Blues", "The Cityzens"],
            rivals: [(33, "Manchester Derby")],
            legendaryPlayers: ["Colin Bell", "Sergio Agüero", "David Silva", "Vincent Kompany"],
            historicMoments: ["AGUEROOOO! 2012", "Centurions 2017-18", "Treble 2022-23"],
            trophyEmojis: "🏆🏆🏆🏆🏆🏆🏆🏆🏆",
            specialPattern: "sky_blue"
        ),
        42: TeamLegendData(  // Arsenal
            teamId: 42,
            founded: 1886,
            stadiumName: "Emirates Stadium", 
            stadiumCapacity: "60,704",
            nicknames: ["The Gunners", "The Invincibles"],
            rivals: [(47, "North London Derby"), (49, "London Derby")],
            legendaryPlayers: ["Thierry Henry", "Dennis Bergkamp", "Tony Adams", "Patrick Vieira"],
            historicMoments: ["Invincibles 2003-04", "1989 Anfield", "1971 Double"],
            trophyEmojis: "🏆🏆🏆🏆🏆🏆🏆🏆🏆🏆🏆🏆🏆",
            specialPattern: "cannon"
        ),
        49: TeamLegendData(  // Chelsea
            teamId: 49,
            founded: 1905,
            stadiumName: "Stamford Bridge",
            stadiumCapacity: "40,834",
            nicknames: ["The Blues", "The Pensioners"],
            rivals: [(47, "London Derby"), (42, "London Derby"), (40, "Historic Rivalry")],
            legendaryPlayers: ["Frank Lampard", "John Terry", "Didier Drogba", "Gianfranco Zola"],
            historicMoments: ["Munich 2012", "Champions League 2021", "Jose's First Era"],
            trophyEmojis: "🏆🏆🏆🏆🏆🏆🏆🏆",
            specialPattern: "blue_pride"
        ),
        47: TeamLegendData(  // Tottenham
            teamId: 47,
            founded: 1882,
            stadiumName: "Tottenham Hotspur Stadium",
            stadiumCapacity: "62,850",
            nicknames: ["Spurs", "The Lilywhites"],
            rivals: [(42, "North London Derby"), (49, "London Derby")],
            legendaryPlayers: ["Glenn Hoddle", "Gary Lineker", "Jimmy Greaves", "Harry Kane"],
            historicMoments: ["1961 Double", "1984 UEFA Cup", "New Stadium 2019"],
            trophyEmojis: "🏆🏆🏆🏆🏆🏆🏆🏆",
            specialPattern: "cockerel"
        ),
        
        // La Liga
        541: TeamLegendData(  // Real Madrid
            teamId: 541,
            founded: 1902,
            stadiumName: "Santiago Bernabéu",
            stadiumCapacity: "81,044",
            nicknames: ["Los Blancos", "Los Merengues", "Los Vikingos"],
            rivals: [(529, "El Clásico"), (530, "Madrid Derby")],
            legendaryPlayers: ["Di Stéfano", "Cristiano Ronaldo", "Raúl", "Zidane", "Puskás"],
            historicMoments: ["14 European Cups", "La Décima", "5 in a row 1956-1960"],
            trophyEmojis: "👑🏆🏆🏆🏆🏆🏆🏆🏆🏆🏆🏆🏆🏆🏆",
            specialPattern: "royal_crown"
        ),
        529: TeamLegendData(  // Barcelona
            teamId: 529,
            founded: 1899,
            stadiumName: "Camp Nou",
            stadiumCapacity: "99,354",
            nicknames: ["Barça", "Blaugrana", "Culés"],
            rivals: [(541, "El Clásico"), (533, "Historic Rivalry")],
            legendaryPlayers: ["Messi", "Cruyff", "Xavi", "Iniesta", "Ronaldinho"],
            historicMoments: ["2009 Sextuple", "Dream Team", "La Masia"],
            trophyEmojis: "🔵🔴🏆🏆🏆🏆🏆🏆🏆🏆🏆🏆",
            specialPattern: "blaugrana_stripes"
        ),
        530: TeamLegendData(  // Atletico Madrid
            teamId: 530,
            founded: 1903,
            stadiumName: "Metropolitano",
            stadiumCapacity: "68,456",
            nicknames: ["Atleti", "Los Colchoneros", "Los Rojiblancos"],
            rivals: [(541, "Madrid Derby"), (529, "Spanish Rivalry")],
            legendaryPlayers: ["Luis Aragonés", "Fernando Torres", "Diego Forlán", "Koke"],
            historicMoments: ["2014 La Liga", "2018 Europa League", "1974 Final"],
            trophyEmojis: "🔴⚪🏆🏆🏆🏆🏆🏆🏆🏆🏆🏆🏆",
            specialPattern: "rojiblanco_stripes"
        ),
        
        // Bundesliga
        157: TeamLegendData(  // Bayern Munich
            teamId: 157,
            founded: 1900,
            stadiumName: "Allianz Arena",
            stadiumCapacity: "75,000",
            nicknames: ["Der FCB", "Die Bayern", "Rekordmeister"],
            rivals: [(165, "Der Klassiker"), (1860, "Munich Derby")],
            legendaryPlayers: ["Beckenbauer", "Gerd Müller", "Matthäus", "Rummenigge", "Lahm"],
            historicMoments: ["2013 Treble", "2020 Sextuple", "1970s Dynasty"],
            trophyEmojis: "⭐⭐⭐⭐⭐🏆🏆🏆🏆🏆🏆🏆🏆🏆🏆🏆🏆🏆🏆🏆🏆🏆🏆🏆🏆🏆🏆🏆🏆🏆🏆🏆",
            specialPattern: "bavarian_diamonds"
        ),
        165: TeamLegendData(  // Borussia Dortmund
            teamId: 165,
            founded: 1909,
            stadiumName: "Signal Iduna Park",
            stadiumCapacity: "81,365",
            nicknames: ["BVB", "Die Schwarzgelben", "Die Borussen"],
            rivals: [(157, "Der Klassiker"), (176, "Revierderby")],
            legendaryPlayers: ["Marco Reus", "Lewandowski", "Matthias Sammer", "Michael Zorc"],
            historicMoments: ["1997 Champions League", "2011-2012 Double", "Yellow Wall"],
            trophyEmojis: "🟡⚫🏆🏆🏆🏆🏆🏆🏆🏆",
            specialPattern: "yellow_wall"
        ),
        
        // Serie A
        496: TeamLegendData(  // Juventus
            teamId: 496,
            founded: 1897,
            stadiumName: "Allianz Stadium",
            stadiumCapacity: "41,507",
            nicknames: ["La Vecchia Signora", "I Bianconeri", "La Fidanzata d'Italia"],
            rivals: [(505, "Derby d'Italia"), (503, "Derby di Torino")],
            legendaryPlayers: ["Del Piero", "Platini", "Buffon", "Nedvěd", "Baggio"],
            historicMoments: ["38 Scudetti", "1996 Champions League", "2011-2020 Dynasty"],
            trophyEmojis: "⚫⚪🏆🏆🏆🏆🏆🏆🏆🏆🏆🏆🏆🏆🏆🏆🏆🏆🏆🏆🏆🏆🏆🏆🏆🏆🏆🏆🏆🏆🏆🏆🏆🏆🏆🏆🏆🏆",
            specialPattern: "zebra_stripes"
        ),
        505: TeamLegendData(  // Inter Milan
            teamId: 505,
            founded: 1908,
            stadiumName: "San Siro",
            stadiumCapacity: "75,923",
            nicknames: ["I Nerazzurri", "La Beneamata", "Il Biscione"],
            rivals: [(489, "Derby della Madonnina"), (496, "Derby d'Italia")],
            legendaryPlayers: ["Zanetti", "Meazza", "Facchetti", "Mazzola", "Ronaldo"],
            historicMoments: ["2010 Treble", "Grande Inter", "19 Scudetti"],
            trophyEmojis: "🔵⚫🏆🏆🏆🏆🏆🏆🏆🏆🏆🏆🏆🏆🏆🏆🏆🏆🏆🏆🏆",
            specialPattern: "nerazzurri_stripes"
        ),
        489: TeamLegendData(  // AC Milan
            teamId: 489,
            founded: 1899,
            stadiumName: "San Siro",
            stadiumCapacity: "75,923",
            nicknames: ["I Rossoneri", "Il Diavolo", "The Devils"],
            rivals: [(505, "Derby della Madonnina"), (496, "Italian Rivalry")],
            legendaryPlayers: ["Maldini", "Baresi", "Van Basten", "Kaká", "Shevchenko"],
            historicMoments: ["7 European Cups", "Sacchi's Milan", "2007 Champions League"],
            trophyEmojis: "🔴⚫🏆🏆🏆🏆🏆🏆🏆🏆🏆🏆🏆🏆🏆🏆🏆🏆🏆🏆🏆",
            specialPattern: "rossoneri_stripes"
        ),
        
        // PSG
        85: TeamLegendData(  // PSG
            teamId: 85,
            founded: 1970,
            stadiumName: "Parc des Princes",
            stadiumCapacity: "47,929",
            nicknames: ["Les Parisiens", "Les Rouge-et-Bleu"],
            rivals: [(81, "Le Classique")],
            legendaryPlayers: ["Ronaldinho", "Raí", "Pauleta", "Mbappé", "Neymar"],
            historicMoments: ["1996 Cup Winners' Cup", "QSI Era", "Remontada Victim"],
            trophyEmojis: "🔴🔵🏆🏆🏆🏆🏆🏆🏆🏆🏆🏆",
            specialPattern: "eiffel_tower"
        )
    ]
    
    func getLegendData(for teamId: Int) -> TeamLegendData? {
        return teamLegends[teamId]
    }
}