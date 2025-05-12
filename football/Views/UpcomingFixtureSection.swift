import SwiftUI

struct UpcomingFixtureSection: View {
    @EnvironmentObject var viewModel: TeamProfileViewModel
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("다음 경기")
                .font(.headline)
                .padding(.horizontal)
            
            // 다음 경기 찾기 (날짜 기준으로 정렬하여 현재 시간 이후의 첫 번째 경기)
            let upcomingFixtures = (viewModel.recentFixtures ?? []).filter { fixture in
                // 완료되지 않은 경기만 필터링 (FT, AET, PEN 등이 아닌 경기)
                let status = fixture.fixture.status.short
                return status != "FT" && status != "AET" && status != "PEN"
            }
            .sorted { fixture1, fixture2 in
                // 날짜순으로 정렬
                fixture1.fixture.date < fixture2.fixture.date
            }
            
            if let nextFixture = upcomingFixtures.first {
                upcomingFixtureCard(fixture: nextFixture)
            } else {
                Text("예정된 경기가 없습니다")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                    .frame(maxWidth: .infinity, alignment: .center)
                    .padding()
            }
        }
        .padding(.vertical)
        .background(Color(.systemGroupedBackground))
        .cornerRadius(15)
        .shadow(radius: 3, y: 2)
    }
    
    private func upcomingFixtureCard(fixture: Fixture) -> some View {
        VStack(spacing: 16) {
            // 리그 정보
            HStack {
                AsyncImage(url: URL(string: fixture.league.logo)) { image in
                    image.resizable().scaledToFit()
                } placeholder: {
                    Color.gray.opacity(0.3)
                }
                .frame(width: 24, height: 24)
                
                Text(fixture.league.name)
                    .font(.caption)
                    .foregroundColor(.secondary)
                
                Spacer()
                
                // 경기 날짜
                Text(formattedDate(from: fixture.fixture.date))
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            .padding(.horizontal)
            
            // 팀 정보
            HStack(spacing: 20) {
                // 홈팀
                VStack(spacing: 8) {
                    AsyncImage(url: URL(string: fixture.teams.home.logo)) { image in
                        image.resizable().scaledToFit()
                    } placeholder: {
                        Color.gray.opacity(0.3)
                    }
                    .frame(width: 50, height: 50)
                    
                    Text(fixture.teams.home.name)
                        .font(.subheadline)
                        .fontWeight(.medium)
                        .lineLimit(1)
                        .frame(width: 100)
                        .multilineTextAlignment(.center)
                }
                
                // VS 표시
                VStack {
                    Text("VS")
                        .font(.headline)
                        .fontWeight(.bold)
                        .foregroundColor(.orange)
                    
                    Text(formattedTime(from: fixture.fixture.date))
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
                
                // 원정팀
                VStack(spacing: 8) {
                    AsyncImage(url: URL(string: fixture.teams.away.logo)) { image in
                        image.resizable().scaledToFit()
                    } placeholder: {
                        Color.gray.opacity(0.3)
                    }
                    .frame(width: 50, height: 50)
                    
                    Text(fixture.teams.away.name)
                        .font(.subheadline)
                        .fontWeight(.medium)
                        .lineLimit(1)
                        .frame(width: 100)
                        .multilineTextAlignment(.center)
                }
            }
            .padding(.horizontal)
            
            // 경기장 정보 (안전한 옵셔널 체크)
            let venue = fixture.fixture.venue
            let venueName = venue.name
            
            if let name = venueName, !name.isEmpty {
                HStack {
                    Image(systemName: "mappin.circle.fill")
                        .foregroundColor(.red)
                    
                    Text(name)
                        .font(.caption)
                        .foregroundColor(.secondary)
                    
                    Spacer()
                }
                .padding(.horizontal)
            }
        }
        .padding(.vertical)
        .background(Color(.systemBackground))
        .cornerRadius(10)
        .padding(.horizontal)
    }
    
    // 날짜 포맷팅 함수
    private func formattedDate(from dateString: String) -> String {
        let inputFormatter = DateFormatter()
        inputFormatter.dateFormat = "yyyy-MM-dd'T'HH:mm:ssZ"
        inputFormatter.timeZone = TimeZone(secondsFromGMT: 0)
        
        if let date = inputFormatter.date(from: dateString) {
            let outputFormatter = DateFormatter()
            outputFormatter.dateFormat = "yyyy.MM.dd"
            outputFormatter.timeZone = TimeZone.current
            return outputFormatter.string(from: date)
        }
        return "날짜 정보 없음"
    }
    
    // 시간 포맷팅 함수
    private func formattedTime(from dateString: String) -> String {
        let inputFormatter = DateFormatter()
        inputFormatter.dateFormat = "yyyy-MM-dd'T'HH:mm:ssZ"
        inputFormatter.timeZone = TimeZone(secondsFromGMT: 0)
        
        if let date = inputFormatter.date(from: dateString) {
            let outputFormatter = DateFormatter()
            outputFormatter.dateFormat = "HH:mm"
            outputFormatter.timeZone = TimeZone.current
            return outputFormatter.string(from: date)
        }
        return "시간 정보 없음"
    }
}

#Preview {
    UpcomingFixtureSection()
        .environmentObject(TeamProfileViewModel(teamId: 33))
}
