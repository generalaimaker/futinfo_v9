import SwiftUI

struct PlayerProfileView: View {
    @StateObject private var viewModel: PlayerProfileViewModel
    @Environment(\.dismiss) private var dismiss
    
    init(playerId: Int) {
        _viewModel = StateObject(wrappedValue: PlayerProfileViewModel(playerId: playerId))
    }
    
    var body: some View {
        ScrollView {
            VStack(spacing: 20) {
                if viewModel.isLoading {
                    ProgressView()
                        .scaleEffect(1.5)
                        .padding(.top, 50)
                } else if let error = viewModel.error {
                    VStack(spacing: 12) {
                        Image(systemName: "exclamationmark.triangle")
                            .font(.largeTitle)
                            .foregroundColor(.red)
                        Text(error.localizedDescription)
                            .multilineTextAlignment(.center)
                            .foregroundColor(.secondary)
                    }
                    .padding(.top, 50)
                } else {
                    // 프로필 헤더
                    ProfileHeaderView(
                        name: viewModel.displayName,
                        team: viewModel.currentTeamName,
                        nationality: viewModel.nationality,
                        age: viewModel.age,
                        physicalInfo: viewModel.physicalInfo,
                        photoURL: viewModel.photoURL
                    )
                    
                    // 시즌 통계
                    if !viewModel.seasonalStatsFormatted.isEmpty {
                        SeasonalStatsView(stats: viewModel.seasonalStatsFormatted)
                    }
                    
                    // 커리어 히스토리
                    if !viewModel.careerHistory.isEmpty {
                        CareerHistoryView(history: viewModel.careerHistory)
                    }
                }
            }
            .padding()
        }
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .navigationBarTrailing) {
                Button(action: { dismiss() }) {
                    Image(systemName: "xmark.circle.fill")
                        .foregroundColor(.gray)
                }
            }
        }
        .onAppear {
            viewModel.loadPlayerProfile()
        }
    }
}

// MARK: - Supporting Views

private struct ProfileHeaderView: View {
    let name: String
    let team: String
    let nationality: String
    let age: String
    let physicalInfo: String
    let photoURL: String?
    
    var body: some View {
        VStack(spacing: 16) {
            // 선수 사진
            AsyncImage(url: URL(string: photoURL ?? "")) { image in
                image
                    .resizable()
                    .scaledToFit()
            } placeholder: {
                Image(systemName: "person.circle.fill")
                    .resizable()
                    .scaledToFit()
                    .foregroundColor(.gray)
            }
            .frame(width: 120, height: 120)
            .clipShape(Circle())
            .overlay(
                Circle()
                    .stroke(Color.blue, lineWidth: 2)
            )
            .shadow(color: Color.black.opacity(0.1), radius: 8)
            
            // 선수 이름과 팀
            VStack(spacing: 8) {
                Text(name)
                    .font(.title.bold())
                    .multilineTextAlignment(.center)
                Text(team)
                    .font(.title3)
                    .foregroundColor(.blue)
            }
            
            // 기본 정보
            HStack(spacing: 20) {
                InfoItem(title: "국적", value: nationality)
                InfoItem(title: "나이", value: age)
                InfoItem(title: "신체", value: physicalInfo)
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(color: Color.black.opacity(0.05), radius: 10)
    }
}

private struct SeasonalStatsView: View {
    let stats: [(String, String)]
    
    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("2023-24 시즌 통계")
                .font(.headline)
            
            LazyVGrid(columns: [
                GridItem(.flexible()),
                GridItem(.flexible())
            ], spacing: 16) {
                ForEach(stats, id: \.0) { stat in
                    StatItemView(title: stat.0, value: stat.1)
                }
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(color: Color.black.opacity(0.05), radius: 10)
    }
}

private struct CareerHistoryView: View {
    let history: [(String, String, String)]
    
    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("커리어")
                .font(.headline)
            
            ForEach(history, id: \.0) { team, period, appearances in
                VStack(alignment: .leading, spacing: 8) {
                    Text(team)
                        .font(.callout.bold())
                    
                    HStack {
                        Text(period)
                            .font(.caption)
                            .foregroundColor(.secondary)
                        Spacer()
                        Text(appearances)
                            .font(.caption)
                            .padding(.horizontal, 8)
                            .padding(.vertical, 4)
                            .background(Color.blue.opacity(0.1))
                            .cornerRadius(8)
                    }
                }
                .padding()
                .background(Color(.systemBackground))
                .cornerRadius(8)
                .shadow(color: Color.black.opacity(0.05), radius: 5)
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(color: Color.black.opacity(0.05), radius: 10)
    }
}

private struct InfoItem: View {
    let title: String
    let value: String
    
    var body: some View {
        VStack(spacing: 4) {
            Text(title)
                .font(.caption)
                .foregroundColor(.secondary)
            Text(value)
                .font(.subheadline)
        }
    }
}

private struct StatItemView: View {
    let title: String
    let value: String
    
    var body: some View {
        VStack(spacing: 8) {
            Text(value)
                .font(.title3.bold())
                .foregroundColor(.blue)
            Text(title)
                .font(.caption)
                .foregroundColor(.secondary)
        }
        .frame(maxWidth: .infinity)
        .padding()
        .background(Color.blue.opacity(0.1))
        .cornerRadius(12)
    }
}
