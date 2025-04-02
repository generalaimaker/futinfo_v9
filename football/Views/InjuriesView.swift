import SwiftUI

struct InjuriesView: View {
    let fixture: Fixture
    @ObservedObject var viewModel: FixtureDetailViewModel
    @State private var isLoading = false
    
    var body: some View {
        VStack(spacing: 24) {
            if isLoading {
                ProgressView()
                    .padding()
            } else if viewModel.homeTeamInjuries.isEmpty && viewModel.awayTeamInjuries.isEmpty {
                VStack(spacing: 16) {
                    Image(systemName: "bandage.fill")
                        .font(.system(size: 48))
                        .foregroundColor(.gray.opacity(0.5))
                    
                    Text("부상 선수 정보가 없습니다")
                        .font(.headline)
                        .foregroundColor(.gray)
                }
                .frame(maxWidth: .infinity)
                .padding(32)
            } else {
                // 홈팀 부상 선수
                if !viewModel.homeTeamInjuries.isEmpty {
                    VStack(spacing: 16) {
                        HStack {
                            AsyncImage(url: URL(string: fixture.teams.home.logo)) { image in
                                image
                                    .resizable()
                                    .scaledToFit()
                            } placeholder: {
                                Image(systemName: "sportscourt.fill")
                                    .foregroundColor(.gray)
                            }
                            .frame(width: 24, height: 24)
                            
                            Text(fixture.teams.home.name)
                                .font(.headline)
                            
                            Spacer()
                            
                            Text("부상 선수 \(viewModel.homeTeamInjuries.count)명")
                                .font(.subheadline)
                                .foregroundColor(.gray)
                        }
                        
                        ForEach(viewModel.homeTeamInjuries) { injury in
                            InjuryPlayerCard(injury: injury)
                        }
                    }
                    .frame(maxWidth: .infinity)
                    .padding(16)
                    .background(Color(.systemBackground))
                    .cornerRadius(16)
                    .shadow(color: Color.black.opacity(0.05), radius: 10)
                }
                
                // 원정팀 부상 선수
                if !viewModel.awayTeamInjuries.isEmpty {
                    VStack(spacing: 16) {
                        HStack {
                            AsyncImage(url: URL(string: fixture.teams.away.logo)) { image in
                                image
                                    .resizable()
                                    .scaledToFit()
                            } placeholder: {
                                Image(systemName: "sportscourt.fill")
                                    .foregroundColor(.gray)
                            }
                            .frame(width: 24, height: 24)
                            
                            Text(fixture.teams.away.name)
                                .font(.headline)
                            
                            Spacer()
                            
                            Text("부상 선수 \(viewModel.awayTeamInjuries.count)명")
                                .font(.subheadline)
                                .foregroundColor(.gray)
                        }
                        
                        ForEach(viewModel.awayTeamInjuries) { injury in
                            InjuryPlayerCard(injury: injury)
                        }
                    }
                    .frame(maxWidth: .infinity)
                    .padding(16)
                    .background(Color(.systemBackground))
                    .cornerRadius(16)
                    .shadow(color: Color.black.opacity(0.05), radius: 10)
                }
            }
        }
        .padding(.horizontal)
        .onAppear {
            loadInjuries()
        }
    }
    
    private func loadInjuries() {
        isLoading = true
        Task {
            await viewModel.loadInjuries()
            await MainActor.run {
                isLoading = false
            }
        }
    }
}

struct InjuryPlayerCard: View {
    let injury: PlayerInjury
    
    var body: some View {
        HStack(spacing: 16) {
            // 선수 사진
            AsyncImage(url: URL(string: injury.player.photo)) { image in
                image
                    .resizable()
                    .scaledToFit()
                    .clipShape(Circle())
            } placeholder: {
                Image(systemName: "person.fill")
                    .foregroundColor(.gray)
            }
            .frame(width: 50, height: 50)
            .overlay(
                Circle()
                    .stroke(Color.red.opacity(0.5), lineWidth: 2)
            )
            
            // 선수 정보
            VStack(alignment: .leading, spacing: 4) {
                Text(injury.player.name)
                    .font(.system(.body, design: .rounded))
                    .fontWeight(.medium)
                
                HStack(spacing: 8) {
                    // 포지션
                    Text(injury.player.position ?? "")
                        .font(.caption)
                        .padding(.horizontal, 8)
                        .padding(.vertical, 2)
                        .background(positionColor(injury.player.position ?? ""))
                        .foregroundColor(.white)
                        .cornerRadius(4)
                    
                    // 부상 유형
                    Text(injury.injury.type)
                        .font(.caption)
                        .padding(.horizontal, 8)
                        .padding(.vertical, 2)
                        .background(Color.red.opacity(0.8))
                        .foregroundColor(.white)
                        .cornerRadius(4)
                }
                
                // 부상 설명
                if let reason = injury.injury.reason {
                    Text(reason)
                        .font(.caption)
                        .foregroundColor(.gray)
                }
            }
            
            Spacer()
            
            // 복귀 예정일
            if let date = injury.injury.date {
                VStack(alignment: .trailing, spacing: 4) {
                    Text("복귀 예정")
                        .font(.caption)
                        .foregroundColor(.gray)
                    
                    Text(formatDate(date))
                        .font(.caption)
                        .fontWeight(.medium)
                }
            }
        }
        .padding(12)
        .background(Color(.systemGray6))
        .cornerRadius(12)
    }
    
    private func positionColor(_ position: String) -> Color {
        switch position {
        case "Goalkeeper", "G":
            return .yellow
        case "Defender", "D":
            return .blue
        case "Midfielder", "M":
            return .green
        case "Attacker", "F":
            return .red
        default:
            return .gray
        }
    }
    
    private func formatDate(_ dateString: String) -> String {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        
        guard let date = formatter.date(from: dateString) else { return dateString }
        
        formatter.dateFormat = "MM/dd"
        return formatter.string(from: date)
    }
}
