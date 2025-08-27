import SwiftUI

struct UpcomingBigMatchView: View {
    let fixture: Fixture
    let viewModel: FixturesOverviewViewModel
    
    var body: some View {
        VStack(spacing: 16) {
            // 헤더
            VStack(spacing: 8) {
                HStack {
                    Image(systemName: "star.fill")
                        .foregroundColor(.yellow)
                        .font(.system(size: 20))
                    
                    Text("다음 빅매치")
                        .font(.headline)
                        .foregroundColor(.primary)
                    
                    Spacer()
                    
                    // D-Day 표시
                    Text(getDaysUntilMatch())
                        .font(.caption)
                        .padding(.horizontal, 12)
                        .padding(.vertical, 6)
                        .background(Color.blue.opacity(0.15))
                        .foregroundColor(.blue)
                        .cornerRadius(12)
                }
                
                Text(viewModel.getBigMatchDescription(fixture))
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                    .frame(maxWidth: .infinity, alignment: .leading)
            }
            .padding()
            .background(
                LinearGradient(
                    colors: [Color.blue.opacity(0.05), Color.clear],
                    startPoint: .top,
                    endPoint: .bottom
                )
            )
            
            // 경기 정보
            HStack(spacing: 16) {
                // 홈 팀
                VStack(spacing: 8) {
                    if let logoUrl = URL(string: fixture.teams.home.logo) {
                        AsyncImage(url: logoUrl) { image in
                            image
                                .resizable()
                                .aspectRatio(contentMode: .fit)
                        } placeholder: {
                            ProgressView()
                        }
                        .frame(width: 60, height: 60)
                    }
                    
                    Text(TeamAbbreviations.shortenedName(for: fixture.teams.home.name))
                        .font(.system(size: 14, weight: .semibold))
                        .multilineTextAlignment(.center)
                        .lineLimit(2)
                }
                .frame(maxWidth: .infinity)
                
                // 중앙 정보
                VStack(spacing: 4) {
                    Text("VS")
                        .font(.system(size: 12, weight: .bold))
                        .foregroundColor(.secondary)
                    
                    // 날짜와 시간
                    VStack(spacing: 2) {
                        Text(getDateString())
                            .font(.system(size: 11))
                            .foregroundColor(.secondary)
                        
                        Text(getTimeString())
                            .font(.system(size: 14, weight: .semibold))
                            .foregroundColor(.primary)
                    }
                }
                
                // 원정 팀
                VStack(spacing: 8) {
                    if let logoUrl = URL(string: fixture.teams.away.logo) {
                        AsyncImage(url: logoUrl) { image in
                            image
                                .resizable()
                                .aspectRatio(contentMode: .fit)
                        } placeholder: {
                            ProgressView()
                        }
                        .frame(width: 60, height: 60)
                    }
                    
                    Text(TeamAbbreviations.shortenedName(for: fixture.teams.away.name))
                        .font(.system(size: 14, weight: .semibold))
                        .multilineTextAlignment(.center)
                        .lineLimit(2)
                }
                .frame(maxWidth: .infinity)
            }
            .padding()
            
            // 리그 정보
            HStack {
                if let logoUrl = URL(string: fixture.league.logo) {
                    AsyncImage(url: logoUrl) { image in
                        image
                            .resizable()
                            .aspectRatio(contentMode: .fit)
                    } placeholder: {
                        ProgressView()
                    }
                    .frame(width: 20, height: 20)
                }
                
                Text(fixture.league.name)
                    .font(.caption)
                    .foregroundColor(.secondary)
                
                if !fixture.league.round.isEmpty {
                    Text("•")
                        .foregroundColor(.secondary)
                        .font(.caption)
                    
                    Text(fixture.league.round)
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }
            .padding(.horizontal)
            .padding(.bottom, 12)
        }
        .background(Color(.secondarySystemBackground))
        .cornerRadius(16)
        .shadow(color: Color.black.opacity(0.05), radius: 8, x: 0, y: 4)
        .overlay(
            RoundedRectangle(cornerRadius: 16)
                .stroke(Color.blue.opacity(0.2), lineWidth: 1)
        )
    }
    
    private func getDaysUntilMatch() -> String {
        let calendar = Calendar.current
        let today = calendar.startOfDay(for: Date())
        
        // fixture.fixture.date는 String이므로 Date로 변환
        let dateFormatter = DateFormatter()
        dateFormatter.dateFormat = "yyyy-MM-dd'T'HH:mm:ssZ"
        guard let fixtureDate = dateFormatter.date(from: fixture.fixture.date) else {
            return ""
        }
        
        let matchDay = calendar.startOfDay(for: fixtureDate)
        
        let days = calendar.dateComponents([.day], from: today, to: matchDay).day ?? 0
        
        if days == 0 {
            return "오늘"
        } else if days == 1 {
            return "내일"
        } else {
            return "D-\(days)"
        }
    }
    
    private func getDateString() -> String {
        // fixture.fixture.date는 String이므로 Date로 변환
        let dateFormatter = DateFormatter()
        dateFormatter.dateFormat = "yyyy-MM-dd'T'HH:mm:ssZ"
        guard let fixtureDate = dateFormatter.date(from: fixture.fixture.date) else {
            return ""
        }
        
        let formatter = DateFormatter()
        formatter.locale = Locale(identifier: "ko_KR")
        formatter.dateFormat = "M월 d일 (E)"
        return formatter.string(from: fixtureDate)
    }
    
    private func getTimeString() -> String {
        // fixture.fixture.date는 String이므로 Date로 변환
        let dateFormatter = DateFormatter()
        dateFormatter.dateFormat = "yyyy-MM-dd'T'HH:mm:ssZ"
        guard let fixtureDate = dateFormatter.date(from: fixture.fixture.date) else {
            return ""
        }
        
        let formatter = DateFormatter()
        formatter.locale = Locale(identifier: "ko_KR")
        formatter.dateFormat = "HH:mm"
        return formatter.string(from: fixtureDate)
    }
}