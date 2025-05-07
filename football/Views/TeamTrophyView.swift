import SwiftUI

struct TeamTrophyView: View {
    let trophies: [TeamTrophy]?
    
    // 트로피를 리그/컵 종류별로 그룹화
    private var groupedTrophies: [String: [TeamTrophy]] {
        guard let trophies = trophies, !trophies.isEmpty else { return [:] }
        return Dictionary(grouping: trophies, by: { $0.league })
    }
    
    // 트로피 종류 정렬 순서 정의
    private func sortedTrophyKeys() -> [String] {
        let keys = groupedTrophies.keys.sorted()
        
        // 우선순위가 높은 트로피 종류
        let priorityOrder: [String] = [
            // 1. 리그 우승 (각 국가별 리그)
            "LaLiga", "La Liga", "Premier League", "Serie A", "Bundesliga", "Ligue 1",
            // 2. 유럽 대회
            "Champions League", "UEFA Champions League", "Europa League", "UEFA Europa League",
            // 3. 국내 컵대회
            "Copa del Rey", "FA Cup", "Coppa Italia", "DFB Pokal", "Coupe de France",
            // 4. 기타 대회
            "FIFA Club World Cup", "UEFA Super Cup", "Supercopa"
        ]
        
        // 우선순위에 따라 정렬
        var sortedKeys: [String] = []
        
        // 우선순위가 높은 트로피 먼저 추가
        for priority in priorityOrder {
            for key in keys {
                if key.contains(priority) && !sortedKeys.contains(key) {
                    sortedKeys.append(key)
                }
            }
        }
        
        // 나머지 트로피 추가
        for key in keys {
            if !sortedKeys.contains(key) {
                sortedKeys.append(key)
            }
        }
        
        return sortedKeys
    }
    
    // 각 리그/컵별 마지막 우승 시즌
    private func lastWinSeason(for league: String) -> String {
        guard let leagueTrophies = groupedTrophies[league],
              let lastTrophy = leagueTrophies.sorted(by: { $0.season > $1.season }).first else {
            return "N/A"
        }
        return lastTrophy.season
    }
    
    // 리그/컵 로고 URL
    private func logoUrl(for league: String) -> String {
        let leagueName = league.lowercased()
        
        // 유럽 대회
        if leagueName.contains("champions league") {
            return "https://media-4.api-sports.io/football/leagues/2.png"
        } else if leagueName.contains("europa league") || leagueName.contains("uefa europa") {
            return "https://media-4.api-sports.io/football/leagues/3.png"
        } else if leagueName.contains("conference league") {
            return "https://media-4.api-sports.io/football/leagues/848.png"
        } else if leagueName.contains("uefa super cup") || leagueName.contains("uefa super") {
            return "https://media-4.api-sports.io/football/leagues/531.png"
        }
        
        // 국제 대회
        else if leagueName.contains("world cup") || leagueName.contains("fifa club") {
            return "https://media-4.api-sports.io/football/leagues/15.png"
        } else if leagueName.contains("intercontinental cup") || leagueName.contains("intercontinental") {
            return "https://media-4.api-sports.io/football/leagues/15.png"
        }
        
        // 스페인 대회
        else if leagueName.contains("la liga") || leagueName.contains("laliga") {
            return "https://media-4.api-sports.io/football/leagues/140.png"
        } else if leagueName.contains("copa del rey") {
            return "https://media-4.api-sports.io/football/leagues/143.png"
        } else if leagueName.contains("supercopa") || leagueName.contains("supercopa de españa") {
            return "https://media-4.api-sports.io/football/leagues/556.png"
        }
        
        // 영국 대회
        else if leagueName.contains("premier league") || leagueName.contains("epl") {
            return "https://media-4.api-sports.io/football/leagues/39.png"
        } else if leagueName.contains("fa cup") {
            return "https://media-4.api-sports.io/football/leagues/45.png"
        } else if leagueName.contains("efl cup") || leagueName.contains("league cup") || leagueName.contains("carabao cup") {
            return "https://media-4.api-sports.io/football/leagues/48.png"
        } else if leagueName.contains("community shield") || leagueName.contains("charity shield") {
            return "https://media-4.api-sports.io/football/leagues/528.png"
        }
        
        // 이탈리아 대회
        else if leagueName.contains("serie a") {
            return "https://media-4.api-sports.io/football/leagues/135.png"
        } else if leagueName.contains("coppa italia") {
            return "https://media-4.api-sports.io/football/leagues/137.png"
        } else if leagueName.contains("supercoppa italiana") {
            return "https://media-4.api-sports.io/football/leagues/547.png"
        }
        
        // 독일 대회
        else if leagueName.contains("bundesliga") {
            return "https://media-4.api-sports.io/football/leagues/78.png"
        } else if leagueName.contains("dfb pokal") || leagueName.contains("dfb-pokal") {
            return "https://media-4.api-sports.io/football/leagues/81.png"
        } else if leagueName.contains("dfl-supercup") || leagueName.contains("german super cup") {
            return "https://media-4.api-sports.io/football/leagues/529.png"
        }
        
        // 프랑스 대회
        else if leagueName.contains("ligue 1") {
            return "https://media-4.api-sports.io/football/leagues/61.png"
        } else if leagueName.contains("coupe de france") {
            return "https://media-4.api-sports.io/football/leagues/66.png"
        } else if leagueName.contains("trophée des champions") || leagueName.contains("french super cup") {
            return "https://media-4.api-sports.io/football/leagues/526.png"
        }
        
        // 기본 트로피 아이콘
        return "https://media-4.api-sports.io/football/trophies/trophy.png"
    }
    
    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("트로피")
                .font(.headline)
                .padding(.horizontal)
            
            if let trophies = trophies, !trophies.isEmpty {
                // 트로피 목록
                VStack(spacing: 12) {
                    ForEach(sortedTrophyKeys(), id: \.self) { league in
                        if let leagueTrophies = groupedTrophies[league], let firstTrophy = leagueTrophies.first {
                            TrophyItemView(
                                league: league,
                                count: firstTrophy.totalCount, // 총 우승 횟수 사용
                                lastSeason: lastWinSeason(for: league),
                                logoUrl: logoUrl(for: league)
                            )
                            
                            if league != sortedTrophyKeys().last {
                                Divider()
                                    .padding(.horizontal)
                            }
                        }
                    }
                    
                    // 트로피 정렬 버튼 추가
                    HStack {
                        Spacer()
                        Button(action: {
                            // 트로피 정렬 기준 변경 (year <-> competition)
                            // 실제 구현은 ViewModel에서 처리
                        }) {
                            Label("정렬", systemImage: "arrow.up.arrow.down")
                                .font(.caption)
                                .foregroundColor(.blue)
                        }
                        .padding(.horizontal)
                        .padding(.top, 8)
                    }
                }
                .padding(.vertical, 8)
            } else {
                Text("트로피 정보 없음")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                    .frame(maxWidth: .infinity, alignment: .center)
                    .padding()
            }
        }
        .padding(.vertical)
        .background(.regularMaterial)
        .cornerRadius(15)
        .shadow(radius: 3, y: 2)
    }
}

struct TrophyItemView: View {
    let league: String
    let count: Int
    let lastSeason: String
    let logoUrl: String
    
    var body: some View {
        HStack(spacing: 16) {
            // 리그/컵 로고
            if !logoUrl.isEmpty, let url = URL(string: logoUrl) {
                AsyncImage(url: url) { image in
                    image
                        .resizable()
                        .scaledToFit()
                } placeholder: {
                    Image(systemName: "trophy.fill")
                        .font(.title2)
                        .foregroundColor(.yellow)
                }
                .frame(width: 40, height: 40)
            } else {
                Image(systemName: "trophy.fill")
                    .font(.title2)
                    .foregroundColor(.yellow)
                    .frame(width: 40, height: 40)
            }
            
            // 리그/컵 정보
            VStack(alignment: .leading, spacing: 4) {
                Text(league)
                    .font(.headline)
                    .fontWeight(.medium)
                
                Text("마지막 우승 \(lastSeason)")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            
            Spacer()
            
            // 우승 횟수
            Text("\(count)")
                .font(.system(size: 36, weight: .bold, design: .rounded))
                .foregroundColor(.primary)
        }
        .padding(.horizontal)
        .padding(.vertical, 8)
    }
}

#Preview {
    // 미리보기용 더미 데이터
    let dummyTrophies = [
        TeamTrophy(league: "LaLiga", country: "Spain", season: "2023/2024", place: "Winner"),
        TeamTrophy(league: "LaLiga", country: "Spain", season: "2022/2023", place: "Winner"),
        TeamTrophy(league: "LaLiga", country: "Spain", season: "2021/2022", place: "Winner"),
        TeamTrophy(league: "Champions League", country: "World", season: "2023/2024", place: "Winner"),
        TeamTrophy(league: "Champions League", country: "World", season: "2022/2023", place: "Winner"),
        TeamTrophy(league: "Copa del Rey", country: "Spain", season: "2022/2023", place: "Winner"),
    ]
    
    return TeamTrophyView(trophies: dummyTrophies)
        .padding()
        .environment(\.colorScheme, .light)
}
