import SwiftUI

struct StandingsDetailView: View {
    let fixture: Fixture
    @ObservedObject var viewModel: FixtureDetailViewModel
    @State private var isLoading = false
    
    var body: some View {
        VStack(spacing: 24) {
            if isLoading {
                ProgressView()
                    .padding()
            } else if viewModel.standings.isEmpty {
                VStack(spacing: 16) {
                    Image(systemName: "list.number")
                        .font(.system(size: 48))
                        .foregroundColor(.gray.opacity(0.5))
                    
                    Text("순위 정보가 없습니다")
                        .font(.headline)
                        .foregroundColor(.gray)
                }
                .frame(maxWidth: .infinity)
                .padding(32)
            } else {
                VStack(spacing: 16) {
                    // 리그 정보
                    HStack {
                        AsyncImage(url: URL(string: fixture.league.logo)) { image in
                            image
                                .resizable()
                                .scaledToFit()
                        } placeholder: {
                            Image(systemName: "trophy.fill")
                                .foregroundColor(.gray)
                        }
                        .frame(width: 30, height: 30)
                        
                        VStack(alignment: .leading, spacing: 4) {
                            Text(fixture.league.name)
                                .font(.headline)
                            
                            Text("\(fixture.league.season) 시즌")
                                .font(.subheadline)
                                .foregroundColor(.gray)
                        }
                        
                        Spacer()
                    }
                    
                    // 순위표
                    VStack(spacing: 0) {
                        // 헤더
                        HStack {
                            Text("#")
                                .font(.caption)
                                .foregroundColor(.gray)
                                .frame(width: 30, alignment: .center)
                            
                            Text("팀")
                                .font(.caption)
                                .foregroundColor(.gray)
                                .frame(maxWidth: .infinity, alignment: .leading)
                            
                            Text("경기")
                                .font(.caption)
                                .foregroundColor(.gray)
                                .frame(width: 30, alignment: .center)
                            
                            Text("승")
                                .font(.caption)
                                .foregroundColor(.gray)
                                .frame(width: 30, alignment: .center)
                            
                            Text("무")
                                .font(.caption)
                                .foregroundColor(.gray)
                                .frame(width: 30, alignment: .center)
                            
                            Text("패")
                                .font(.caption)
                                .foregroundColor(.gray)
                                .frame(width: 30, alignment: .center)
                            
                            Text("득실")
                                .font(.caption)
                                .foregroundColor(.gray)
                                .frame(width: 40, alignment: .center)
                            
                            Text("승점")
                                .font(.caption)
                                .foregroundColor(.gray)
                                .frame(width: 30, alignment: .center)
                        }
                        .padding(.horizontal, 16)
                        .padding(.vertical, 8)
                        .background(Color(.systemGray6))
                        
                        // 팀 순위
                        ForEach(viewModel.standings) { standing in
                            HStack {
                                Text("\(standing.rank)")
                                    .font(.system(.body, design: .rounded))
                                    .fontWeight(.bold)
                                    .frame(width: 30, alignment: .center)
                                
                                HStack(spacing: 8) {
                                    AsyncImage(url: URL(string: standing.team.logo)) { image in
                                        image
                                            .resizable()
                                            .scaledToFit()
                                    } placeholder: {
                                        Image(systemName: "sportscourt.fill")
                                            .foregroundColor(.gray)
                                    }
                                    .frame(width: 20, height: 20)
                                    
                                    Text(standing.team.name)
                                        .font(.system(.body, design: .rounded))
                                        .lineLimit(1)
                                }
                                .frame(maxWidth: .infinity, alignment: .leading)
                                
                                Text("\(standing.all.played)")
                                    .font(.system(.body, design: .rounded))
                                    .frame(width: 30, alignment: .center)
                                
                                Text("\(standing.all.win)")
                                    .font(.system(.body, design: .rounded))
                                    .frame(width: 30, alignment: .center)
                                
                                Text("\(standing.all.draw)")
                                    .font(.system(.body, design: .rounded))
                                    .frame(width: 30, alignment: .center)
                                
                                Text("\(standing.all.lose)")
                                    .font(.system(.body, design: .rounded))
                                    .frame(width: 30, alignment: .center)
                                
                                Text("\(standing.goalsDiff)")
                                    .font(.system(.body, design: .rounded))
                                    .foregroundColor(standing.goalsDiff >= 0 ? .blue : .red)
                                    .frame(width: 40, alignment: .center)
                                
                                Text("\(standing.points)")
                                    .font(.system(.body, design: .rounded))
                                    .fontWeight(.bold)
                                    .frame(width: 30, alignment: .center)
                            }
                            .padding(.horizontal, 16)
                            .padding(.vertical, 12)
                            .background(
                                standing.team.id == fixture.teams.home.id ? Color.blue.opacity(0.1) :
                                standing.team.id == fixture.teams.away.id ? Color.red.opacity(0.1) :
                                Color.clear
                            )
                        }
                    }
                    .cornerRadius(8)
                    .overlay(
                        RoundedRectangle(cornerRadius: 8)
                            .stroke(Color(.systemGray5), lineWidth: 1)
                    )
                    
                    // 범례
                    VStack(spacing: 8) {
                        HStack(spacing: 16) {
                            HStack(spacing: 8) {
                                Rectangle()
                                    .fill(Color.blue.opacity(0.1))
                                    .frame(width: 12, height: 12)
                                
                                Text(fixture.teams.home.name)
                                    .font(.caption)
                            }
                            
                            HStack(spacing: 8) {
                                Rectangle()
                                    .fill(Color.red.opacity(0.1))
                                    .frame(width: 12, height: 12)
                                
                                Text(fixture.teams.away.name)
                                    .font(.caption)
                            }
                        }
                        
                        // 승격/강등 영역 표시 (있는 경우)
                        if hasPromotionRelegationZones() {
                            HStack(spacing: 16) {
                                ForEach(getZones(), id: \.self) { zone in
                                    HStack(spacing: 8) {
                                        Rectangle()
                                            .fill(zoneColor(zone))
                                            .frame(width: 12, height: 12)
                                        
                                        Text(zone)
                                            .font(.caption)
                                    }
                                }
                            }
                        }
                    }
                    .padding(.top, 8)
                }
                .frame(maxWidth: .infinity)
                .padding(16)
                .background(Color(.systemBackground))
                .cornerRadius(16)
                .shadow(color: Color.black.opacity(0.05), radius: 10)
            }
        }
        .padding(.horizontal)
        .onAppear {
            loadStandings()
        }
    }
    
    private func loadStandings() {
        isLoading = true
        Task {
            await viewModel.loadStandings()
            await MainActor.run {
                isLoading = false
            }
        }
    }
    
    private func hasPromotionRelegationZones() -> Bool {
        // 실제로는 API에서 받아온 데이터를 확인해야 함
        return fixture.league.id == 39 // 프리미어 리그
    }
    
    private func getZones() -> [String] {
        // 실제로는 API에서 받아온 데이터를 확인해야 함
        if fixture.league.id == 39 { // 프리미어 리그
            return ["챔피언스리그", "유로파리그", "강등권"]
        }
        return []
    }
    
    private func zoneColor(_ zone: String) -> Color {
        switch zone {
        case "챔피언스리그":
            return .blue
        case "유로파리그":
            return .orange
        case "강등권":
            return .red
        default:
            return .gray
        }
    }
}