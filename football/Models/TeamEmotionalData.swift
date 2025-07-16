import SwiftUI

// 팀별 감성 데이터 (슬로건, 색상, 특별 메시지 등)
struct TeamEmotionalData {
    let teamId: Int
    let primaryColor: Color
    let secondaryColor: Color
    let slogan: String
    let shortSlogan: String
    let fanChant: String?
    let emoji: String
}

class TeamEmotionalDataService {
    static let shared = TeamEmotionalDataService()
    
    private let teamData: [Int: TeamEmotionalData] = [
        // Premier League
        33: TeamEmotionalData(  // Manchester United
            teamId: 33,
            primaryColor: Color(red: 218/255, green: 41/255, blue: 28/255),
            secondaryColor: Color(red: 251/255, green: 225/255, blue: 34/255),
            slogan: "Glory Glory Man United",
            shortSlogan: "Red Devils",
            fanChant: "United! United! United!",
            emoji: "😈"
        ),
        50: TeamEmotionalData(  // Manchester City
            teamId: 50,
            primaryColor: Color(red: 108/255, green: 171/255, blue: 221/255),
            secondaryColor: Color(red: 255/255, green: 255/255, blue: 255/255),
            slogan: "Pride in Battle",
            shortSlogan: "Citizens",
            fanChant: "Blue Moon",
            emoji: "🌙"
        ),
        40: TeamEmotionalData(  // Liverpool
            teamId: 40,
            primaryColor: Color(red: 200/255, green: 16/255, blue: 46/255),
            secondaryColor: Color(red: 246/255, green: 235/255, blue: 97/255),
            slogan: "You'll Never Walk Alone",
            shortSlogan: "YNWA",
            fanChant: "Liverpool! Liverpool!",
            emoji: "🔴"
        ),
        49: TeamEmotionalData(  // Chelsea
            teamId: 49,
            primaryColor: Color(red: 3/255, green: 70/255, blue: 148/255),
            secondaryColor: Color(red: 255/255, green: 255/255, blue: 255/255),
            slogan: "Pride of London",
            shortSlogan: "The Blues",
            fanChant: "Keep the Blue Flag Flying High",
            emoji: "🦁"
        ),
        42: TeamEmotionalData(  // Arsenal
            teamId: 42,
            primaryColor: Color(red: 239/255, green: 1/255, blue: 7/255),
            secondaryColor: Color(red: 255/255, green: 255/255, blue: 255/255),
            slogan: "Victoria Concordia Crescit",
            shortSlogan: "The Gunners",
            fanChant: "One-Nil to the Arsenal",
            emoji: "🔫"
        ),
        47: TeamEmotionalData(  // Tottenham
            teamId: 47,
            primaryColor: Color(red: 19/255, green: 34/255, blue: 87/255),
            secondaryColor: Color(red: 255/255, green: 255/255, blue: 255/255),
            slogan: "To Dare Is To Do",
            shortSlogan: "COYS",
            fanChant: "Oh when the Spurs go marching in",
            emoji: "🐓"
        ),
        
        // La Liga
        529: TeamEmotionalData(  // Barcelona
            teamId: 529,
            primaryColor: Color(red: 0/255, green: 64/255, blue: 141/255),
            secondaryColor: Color(red: 165/255, green: 0/255, blue: 66/255),
            slogan: "Més que un club",
            shortSlogan: "Força Barça",
            fanChant: "Cant del Barça",
            emoji: "💙❤️"
        ),
        541: TeamEmotionalData(  // Real Madrid
            teamId: 541,
            primaryColor: Color(red: 255/255, green: 255/255, blue: 255/255),
            secondaryColor: Color(red: 0/255, green: 64/255, blue: 149/255),
            slogan: "¡Hala Madrid!",
            shortSlogan: "Los Blancos",
            fanChant: "¡Hala Madrid y nada más!",
            emoji: "👑"
        ),
        530: TeamEmotionalData(  // Atletico Madrid
            teamId: 530,
            primaryColor: Color(red: 206/255, green: 0/255, blue: 0/255),
            secondaryColor: Color(red: 255/255, green: 255/255, blue: 255/255),
            slogan: "Nunca dejes de creer",
            shortSlogan: "Aúpa Atleti",
            fanChant: "Atleti, Atleti, Atlético de Madrid",
            emoji: "🔴⚪"
        ),
        
        // Bundesliga
        157: TeamEmotionalData(  // Bayern Munich
            teamId: 157,
            primaryColor: Color(red: 220/255, green: 5/255, blue: 45/255),
            secondaryColor: Color(red: 255/255, green: 255/255, blue: 255/255),
            slogan: "Mia san mia",
            shortSlogan: "FC Bayern",
            fanChant: "FC Bayern, Stern des Südens",
            emoji: "⭐"
        ),
        165: TeamEmotionalData(  // Borussia Dortmund
            teamId: 165,
            primaryColor: Color(red: 255/255, green: 221/255, blue: 0/255),
            secondaryColor: Color(red: 0/255, green: 0/255, blue: 0/255),
            slogan: "Echte Liebe",
            shortSlogan: "BVB",
            fanChant: "Heja BVB",
            emoji: "🟡⚫"
        ),
        169: TeamEmotionalData(  // RB Leipzig
            teamId: 169,
            primaryColor: Color(red: 221/255, green: 0/255, blue: 50/255),
            secondaryColor: Color(red: 255/255, green: 255/255, blue: 255/255),
            slogan: "Die Roten Bullen",
            shortSlogan: "RB Leipzig",
            fanChant: "Leipzig! Leipzig!",
            emoji: "🐂"
        ),
        
        // Serie A
        489: TeamEmotionalData(  // AC Milan
            teamId: 489,
            primaryColor: Color(red: 251/255, green: 0/255, blue: 54/255),
            secondaryColor: Color(red: 0/255, green: 0/255, blue: 0/255),
            slogan: "Sempre Milan",
            shortSlogan: "Forza Milan",
            fanChant: "Forza Milan per sempre sarà",
            emoji: "🔴⚫"
        ),
        492: TeamEmotionalData(  // Inter Milan
            teamId: 492,
            primaryColor: Color(red: 0/255, green: 106/255, blue: 207/255),
            secondaryColor: Color(red: 0/255, green: 0/255, blue: 0/255),
            slogan: "Brothers of the World",
            shortSlogan: "Forza Inter",
            fanChant: "Pazza Inter amala",
            emoji: "🔵⚫"
        ),
        496: TeamEmotionalData(  // Juventus
            teamId: 496,
            primaryColor: Color(red: 0/255, green: 0/255, blue: 0/255),
            secondaryColor: Color(red: 255/255, green: 255/255, blue: 255/255),
            slogan: "Fino alla fine",
            shortSlogan: "Forza Juve",
            fanChant: "Storia di un grande amore",
            emoji: "⚫⚪"
        ),
        
        // Ligue 1
        85: TeamEmotionalData(  // PSG
            teamId: 85,
            primaryColor: Color(red: 0/255, green: 43/255, blue: 92/255),
            secondaryColor: Color(red: 215/255, green: 0/255, blue: 23/255),
            slogan: "Ici c'est Paris",
            shortSlogan: "Paris est magique",
            fanChant: "Allez Paris Saint-Germain",
            emoji: "🔴🔵"
        ),
        91: TeamEmotionalData(  // Monaco
            teamId: 91,
            primaryColor: Color(red: 237/255, green: 41/255, blue: 57/255),
            secondaryColor: Color(red: 255/255, green: 255/255, blue: 255/255),
            slogan: "Daghe Munegu",
            shortSlogan: "ASM",
            fanChant: "Allez Monaco",
            emoji: "🔴⚪"
        ),
        
        // Additional Premier League teams
        35: TeamEmotionalData(  // Leicester City
            teamId: 35,
            primaryColor: Color(red: 0/255, green: 83/255, blue: 160/255),
            secondaryColor: Color(red: 253/255, green: 190/255, blue: 17/255),
            slogan: "Foxes Never Quit",
            shortSlogan: "The Foxes",
            fanChant: "Leicester 'Til I Die",
            emoji: "🦊"
        ),
        48: TeamEmotionalData(  // West Ham
            teamId: 48,
            primaryColor: Color(red: 122/255, green: 38/255, blue: 58/255),
            secondaryColor: Color(red: 27/255, green: 177/255, blue: 231/255),
            slogan: "I'm Forever Blowing Bubbles",
            shortSlogan: "The Hammers",
            fanChant: "Come On You Irons",
            emoji: "⚒️"
        ),
        39: TeamEmotionalData(  // Newcastle United
            teamId: 39,
            primaryColor: Color(red: 0/255, green: 0/255, blue: 0/255),
            secondaryColor: Color(red: 255/255, green: 255/255, blue: 255/255),
            slogan: "Howay The Lads",
            shortSlogan: "The Magpies",
            fanChant: "Toon Army",
            emoji: "⚫⚪"
        ),
        45: TeamEmotionalData(  // Everton
            teamId: 45,
            primaryColor: Color(red: 39/255, green: 68/255, blue: 136/255),
            secondaryColor: Color(red: 255/255, green: 255/255, blue: 255/255),
            slogan: "Nil Satis Nisi Optimum",
            shortSlogan: "The Toffees",
            fanChant: "Grand Old Team",
            emoji: "🔵"
        ),
        66: TeamEmotionalData(  // Aston Villa
            teamId: 66,
            primaryColor: Color(red: 149/255, green: 16/255, blue: 48/255),
            secondaryColor: Color(red: 135/255, green: 169/255, blue: 187/255),
            slogan: "Prepared",
            shortSlogan: "The Villans",
            fanChant: "Villa 'Til I Die",
            emoji: "🦁"
        ),
        
        // Additional La Liga teams
        532: TeamEmotionalData(  // Valencia
            teamId: 532,
            primaryColor: Color(red: 254/255, green: 228/255, blue: 77/255),
            secondaryColor: Color(red: 0/255, green: 0/255, blue: 0/255),
            slogan: "Amunt Valencia",
            shortSlogan: "Los Che",
            fanChant: "Amunt Valencia!",
            emoji: "🦇"
        ),
        531: TeamEmotionalData(  // Athletic Bilbao
            teamId: 531,
            primaryColor: Color(red: 238/255, green: 0/255, blue: 0/255),
            secondaryColor: Color(red: 255/255, green: 255/255, blue: 255/255),
            slogan: "Con cantera y afición, no hace falta importación",
            shortSlogan: "Los Leones",
            fanChant: "Athletic, Athletic, eup!",
            emoji: "🦁"
        ),
        533: TeamEmotionalData(  // Sevilla
            teamId: 533,
            primaryColor: Color(red: 240/255, green: 1/255, blue: 0/255),
            secondaryColor: Color(red: 255/255, green: 255/255, blue: 255/255),
            slogan: "Nunca se rinde",
            shortSlogan: "Los Nervionenses",
            fanChant: "Sevilla, Sevilla",
            emoji: "⚪🔴"
        ),
        
        // Additional Bundesliga teams
        172: TeamEmotionalData(  // VfB Stuttgart
            teamId: 172,
            primaryColor: Color(red: 255/255, green: 255/255, blue: 255/255),
            secondaryColor: Color(red: 226/255, green: 0/255, blue: 26/255),
            slogan: "Furchtlos und treu",
            shortSlogan: "VfB",
            fanChant: "Auf gehts VfB",
            emoji: "⚪🔴"
        ),
        168: TeamEmotionalData(  // Bayer Leverkusen
            teamId: 168,
            primaryColor: Color(red: 225/255, green: 6/255, blue: 0/255),
            secondaryColor: Color(red: 0/255, green: 0/255, blue: 0/255),
            slogan: "Werkself",
            shortSlogan: "Die Werkself",
            fanChant: "Bayer 04",
            emoji: "🔴⚫"
        ),
        
        // Additional Serie A teams
        497: TeamEmotionalData(  // Roma
            teamId: 497,
            primaryColor: Color(red: 226/255, green: 69/255, blue: 3/255),
            secondaryColor: Color(red: 255/255, green: 204/255, blue: 0/255),
            slogan: "Roma non si discute, si ama",
            shortSlogan: "La Lupa",
            fanChant: "Roma, Roma, Roma",
            emoji: "🐺"
        ),
        487: TeamEmotionalData(  // Lazio
            teamId: 487,
            primaryColor: Color(red: 135/255, green: 185/255, blue: 234/255),
            secondaryColor: Color(red: 255/255, green: 255/255, blue: 255/255),
            slogan: "Noi non siamo da meno a nessuno",
            shortSlogan: "I Biancocelesti",
            fanChant: "Lazio, Lazio",
            emoji: "🦅"
        ),
        499: TeamEmotionalData(  // Napoli
            teamId: 499,
            primaryColor: Color(red: 0/255, green: 135/255, blue: 215/255),
            secondaryColor: Color(red: 255/255, green: 255/255, blue: 255/255),
            slogan: "Un giorno all'improvviso",
            shortSlogan: "I Partenopei",
            fanChant: "Forza Napoli",
            emoji: "🔵"
        ),
        
        // Additional teams from other leagues
        212: TeamEmotionalData(  // Ajax (Netherlands)
            teamId: 212,
            primaryColor: Color(red: 215/255, green: 25/255, blue: 32/255),
            secondaryColor: Color(red: 255/255, green: 255/255, blue: 255/255),
            slogan: "Wij zijn Ajax",
            shortSlogan: "Godenzonen",
            fanChant: "Ajax Amsterdam",
            emoji: "❌"
        ),
        215: TeamEmotionalData(  // Porto (Portugal)
            teamId: 215,
            primaryColor: Color(red: 0/255, green: 60/255, blue: 130/255),
            secondaryColor: Color(red: 255/255, green: 255/255, blue: 255/255),
            slogan: "Há só um Porto",
            shortSlogan: "Dragões",
            fanChant: "Porto! Porto!",
            emoji: "🐉"
        ),
        228: TeamEmotionalData(  // Benfica (Portugal)
            teamId: 228,
            primaryColor: Color(red: 239/255, green: 50/255, blue: 44/255),
            secondaryColor: Color(red: 255/255, green: 255/255, blue: 255/255),
            slogan: "E pluribus unum",
            shortSlogan: "As Águias",
            fanChant: "Glorioso SLB",
            emoji: "🦅"
        ),
        548: TeamEmotionalData(  // Celtic (Scotland)
            teamId: 548,
            primaryColor: Color(red: 1/255, green: 145/255, blue: 80/255),
            secondaryColor: Color(red: 255/255, green: 255/255, blue: 255/255),
            slogan: "You'll Never Walk Alone",
            shortSlogan: "The Bhoys",
            fanChant: "Hail Hail",
            emoji: "🍀"
        ),
        247: TeamEmotionalData(  // Rangers (Scotland)
            teamId: 247,
            primaryColor: Color(red: 37/255, green: 66/255, blue: 143/255),
            secondaryColor: Color(red: 220/255, green: 20/255, blue: 60/255),
            slogan: "Ready",
            shortSlogan: "The Gers",
            fanChant: "Follow Follow",
            emoji: "🔵🔴"
        )
    ]
    
    func getEmotionalData(for teamId: Int) -> TeamEmotionalData? {
        return teamData[teamId]
    }
    
    // 기본값 반환
    func getDefaultEmotionalData(teamId: Int, teamName: String) -> TeamEmotionalData {
        return TeamEmotionalData(
            teamId: teamId,
            primaryColor: .blue,
            secondaryColor: .white,
            slogan: "우리는 \(teamName)!",
            shortSlogan: "함께하는 \(teamName)",
            fanChant: nil,
            emoji: "⚽"
        )
    }
}