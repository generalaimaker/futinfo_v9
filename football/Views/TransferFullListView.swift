import SwiftUI
import Kingfisher

struct TransferFullListView: View {
    let teamId: Int
    let teamName: String
    let teamColor: Color
    
    @State private var allTransfers: [Transfer] = []
    @State private var isLoading = true
    @State private var errorMessage: String?
    @State private var selectedFilter = "all" // all, incoming, outgoing, confirmed, rumour
    
    var filteredTransfers: [Transfer] {
        switch selectedFilter {
        case "incoming":
            return allTransfers.filter { $0.type == .incoming }
        case "outgoing":
            return allTransfers.filter { $0.type == .outgoing }
        case "confirmed":
            return allTransfers.filter { !$0.isRumour }
        case "rumour":
            return allTransfers.filter { $0.isRumour }
        default:
            return allTransfers
        }
    }
    
    var body: some View {
        ScrollView {
            VStack(spacing: 20) {
                // 헤더
                VStack(spacing: 16) {
                    HStack {
                        KFImage(URL(string: "https://media.api-sports.io/football/teams/\(teamId).png"))
                            .resizable()
                            .scaledToFit()
                            .frame(width: 60, height: 60)
                        
                        VStack(alignment: .leading) {
                            Text("\(teamName)")
                                .font(.title2)
                                .fontWeight(.bold)
                            Text("이적 시장 동향")
                                .font(.subheadline)
                                .foregroundColor(.secondary)
                        }
                        
                        Spacer()
                    }
                    .padding()
                    .background(
                        LinearGradient(
                            colors: [teamColor.opacity(0.1), Color.clear],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                    )
                    
                    // 필터 버튼들
                    ScrollView(.horizontal, showsIndicators: false) {
                        HStack(spacing: 12) {
                            TransferFilterChip(title: "전체", isSelected: selectedFilter == "all", teamColor: teamColor) {
                                selectedFilter = "all"
                            }
                            TransferFilterChip(title: "영입", isSelected: selectedFilter == "incoming", teamColor: teamColor) {
                                selectedFilter = "incoming"
                            }
                            TransferFilterChip(title: "방출", isSelected: selectedFilter == "outgoing", teamColor: teamColor) {
                                selectedFilter = "outgoing"
                            }
                            TransferFilterChip(title: "확정", isSelected: selectedFilter == "confirmed", teamColor: teamColor) {
                                selectedFilter = "confirmed"
                            }
                            TransferFilterChip(title: "루머", isSelected: selectedFilter == "rumour", teamColor: teamColor) {
                                selectedFilter = "rumour"
                            }
                        }
                        .padding(.horizontal)
                    }
                }
                
                // 이적 목록
                if isLoading {
                    VStack(spacing: 20) {
                        ProgressView()
                            .scaleEffect(1.2)
                        Text("이적 정보를 불러오는 중...")
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                    }
                    .frame(maxWidth: .infinity, minHeight: 300)
                } else if let error = errorMessage {
                    VStack(spacing: 20) {
                        Image(systemName: "exclamationmark.triangle")
                            .font(.largeTitle)
                            .foregroundColor(.orange)
                        Text("오류 발생")
                            .font(.headline)
                        Text(error)
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                            .multilineTextAlignment(.center)
                    }
                    .frame(maxWidth: .infinity, minHeight: 300)
                    .padding()
                } else if filteredTransfers.isEmpty {
                    VStack(spacing: 20) {
                        Image(systemName: "arrow.left.arrow.right.slash.arrow.left.arrow.right")
                            .font(.largeTitle)
                            .foregroundColor(.gray.opacity(0.5))
                        Text("이적 정보가 없습니다")
                            .font(.headline)
                            .foregroundColor(.secondary)
                        Text("이번 시즌 이적 정보가 없습니다")
                            .font(.subheadline)
                            .foregroundColor(.secondary.opacity(0.8))
                    }
                    .frame(maxWidth: .infinity, minHeight: 300)
                } else {
                    LazyVStack(spacing: 16) {
                        ForEach(filteredTransfers, id: \.id) { transfer in
                            TransferFullCard(transfer: transfer, teamColor: teamColor)
                        }
                    }
                    .padding(.horizontal)
                }
                
                // 통계 섹션
                if !allTransfers.isEmpty {
                    TransferStatisticsSection(transfers: allTransfers, teamColor: teamColor)
                        .padding()
                }
            }
        }
        .navigationTitle("이적 시장")
        .navigationBarTitleDisplayMode(.inline)
        .onAppear {
            loadAllTransfers()
        }
    }
    
    private func loadAllTransfers() {
        print("🔄 TransferFullListView: 이적 전체 목록 로드 시작 - 팀ID: \(teamId), 팀명: \(teamName)")
        
        Task {
            isLoading = true
            errorMessage = nil
            
            var transfers: [Transfer] = []
            
            // 1. API-Football에서 확정 이적 (6개월)
            do {
                print("📡 API-Football 이적 데이터 요청 중...")
                let apiTransfers = try await FootballAPIService.shared.getTeamTransfers(teamId: teamId)
                print("📊 API-Football 응답: \(apiTransfers.count)개 이적")
                
                // 2024 시즌 이적만 (2023년 7월부터)
                let seasonStart = ISO8601DateFormatter().date(from: "2023-07-01T00:00:00Z") ?? Date()
                
                let confirmedTransfers = apiTransfers.compactMap { apiTransfer -> Transfer? in
                    guard let playerName = apiTransfer.playerName,
                          let dateString = apiTransfer.date else { 
                        print("⚠️ 이적 데이터 불완전: 선수명 또는 날짜 없음")
                        return nil 
                    }
                    
                    guard let date = ISO8601DateFormatter().date(from: dateString) else {
                        print("⚠️ 날짜 파싱 실패: \(dateString)")
                        return nil
                    }
                    
                    if date <= seasonStart {
                        print("⏩ 시즌 이전 이적 제외: \(playerName) - \(dateString)")
                        return nil
                    }
                    
                    let isIncoming = apiTransfer.teams.in.id == teamId
                    let fromClub = isIncoming ? apiTransfer.teams.out.name : apiTransfer.teams.in.name
                    let toClub = isIncoming ? apiTransfer.teams.in.name : apiTransfer.teams.out.name
                    
                    let fee = formatTransferFee(apiTransfer.type)
                    
                    return Transfer(
                        playerName: playerName,
                        fromClub: fromClub,
                        toClub: toClub,
                        transferFee: fee,
                        date: date,
                        type: isIncoming ? .incoming : .outgoing
                    )
                }
                
                transfers.append(contentsOf: confirmedTransfers)
                print("✅ 확정 이적 필터링 완료: \(confirmedTransfers.count)개 (시즌 시작: \(seasonStart))")
                
            } catch {
                print("❌ API-Football 오류: \(error.localizedDescription)")
            }
            
            // 2. Transfermarkt 루머 추가
            do {
                print("📡 Transfermarkt 루머 데이터 요청 중...")
                let rumours = try await TransfermarktAPIService.shared.getTransferRumours(for: teamId)
                print("📊 Transfermarkt 응답: \(rumours.count)개 루머")
                
                let seasonStart = ISO8601DateFormatter().date(from: "2023-07-01T00:00:00Z") ?? Date()
                
                let transferRumours = rumours.compactMap { 
                    TransfermarktAPIService.shared.convertToTransfer($0, for: teamId)
                }.filter { rumour in
                    rumour.date > seasonStart && !transfers.contains { $0.playerName == rumour.playerName }
                }
                
                transfers.append(contentsOf: transferRumours)
                print("✅ 루머 필터링 완료: \(transferRumours.count)개 추가")
                
            } catch {
                print("❌ Transfermarkt 오류: \(error.localizedDescription)")
            }
            
            // 날짜순 정렬
            let sortedTransfers = transfers.sorted { $0.date > $1.date }
            print("📊 최종 이적 데이터: 총 \(sortedTransfers.count)개")
            
            await MainActor.run {
                self.allTransfers = sortedTransfers
                self.isLoading = false
                
                if sortedTransfers.isEmpty {
                    self.errorMessage = "이번 시즌 이적 정보가 없습니다"
                    print("⚠️ 이적 데이터가 비어있음")
                } else {
                    print("✅ 이적 데이터 로드 완료: \(sortedTransfers.count)개")
                }
            }
        }
    }
    
    private func formatTransferFee(_ type: String?) -> String {
        guard let type = type else { return "비공개" }
        
        if type == "N/A" || type.isEmpty {
            return "자유이적"
        } else if type.contains("€") {
            return type
        } else if type.contains("loan") || type.lowercased().contains("loan") {
            return "임대"
        } else {
            return type
        }
    }
}

// 필터 칩
struct TransferFilterChip: View {
    let title: String
    let isSelected: Bool
    let teamColor: Color
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            Text(title)
                .font(.caption)
                .fontWeight(.medium)
                .padding(.horizontal, 16)
                .padding(.vertical, 8)
                .background(isSelected ? teamColor : Color.gray.opacity(0.2))
                .foregroundColor(isSelected ? .white : .primary)
                .clipShape(Capsule())
        }
    }
}

// 전체 이적 카드
struct TransferFullCard: View {
    let transfer: Transfer
    let teamColor: Color
    
    var body: some View {
        HStack(spacing: 16) {
            // 타입 인디케이터
            VStack {
                Image(systemName: transfer.type == .incoming ? "arrow.down.circle.fill" : "arrow.up.circle.fill")
                    .font(.title2)
                    .foregroundColor(transfer.type == .incoming ? .green : .red)
                
                Text(transfer.type == .incoming ? "영입" : "방출")
                    .font(.caption2)
                    .fontWeight(.semibold)
                    .foregroundColor(transfer.type == .incoming ? .green : .red)
            }
            .frame(width: 50)
            
            // 정보
            VStack(alignment: .leading, spacing: 8) {
                HStack {
                    Text(transfer.playerName)
                        .font(.headline)
                        .fontWeight(.semibold)
                    
                    Spacer()
                    
                    // 확정/루머 뱃지
                    HStack(spacing: 4) {
                        Image(systemName: transfer.isRumour ? "questionmark.circle.fill" : "checkmark.circle.fill")
                            .font(.caption)
                        Text(transfer.isRumour ? "루머" : "확정")
                            .font(.caption)
                            .fontWeight(.medium)
                    }
                    .foregroundColor(transfer.isRumour ? .orange : .blue)
                }
                
                HStack {
                    Label(transfer.type == .incoming ? transfer.fromClub : transfer.toClub, systemImage: "building.2")
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                }
                
                HStack {
                    Text(transfer.transferFee)
                        .font(.subheadline)
                        .fontWeight(.bold)
                        .foregroundColor(teamColor)
                    
                    if let probability = transfer.probability, transfer.isRumour {
                        Text("• 가능성: \(probability)")
                            .font(.caption)
                            .foregroundColor(.orange)
                    }
                    
                    Spacer()
                    
                    Text(formatTransferDate(transfer.date))
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }
            
            Spacer()
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(color: Color.black.opacity(0.05), radius: 5, x: 0, y: 2)
    }
    
    func formatTransferDate(_ date: Date) -> String {
        let formatter = DateFormatter()
        formatter.locale = Locale(identifier: "ko_KR")
        formatter.dateFormat = "yyyy.MM.dd"
        return formatter.string(from: date)
    }
}

// 이적 통계 섹션
struct TransferStatisticsSection: View {
    let transfers: [Transfer]
    let teamColor: Color
    
    var incomingCount: Int {
        transfers.filter { $0.type == .incoming }.count
    }
    
    var outgoingCount: Int {
        transfers.filter { $0.type == .outgoing }.count
    }
    
    var confirmedCount: Int {
        transfers.filter { !$0.isRumour }.count
    }
    
    var rumourCount: Int {
        transfers.filter { $0.isRumour }.count
    }
    
    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("이적 통계")
                .font(.headline)
            
            HStack(spacing: 20) {
                TransferStatisticItem(title: "총 이적", value: "\(transfers.count)", color: teamColor)
                TransferStatisticItem(title: "영입", value: "\(incomingCount)", color: .green)
                TransferStatisticItem(title: "방출", value: "\(outgoingCount)", color: .red)
            }
            
            HStack(spacing: 20) {
                TransferStatisticItem(title: "확정", value: "\(confirmedCount)", color: .blue)
                TransferStatisticItem(title: "루머", value: "\(rumourCount)", color: .orange)
            }
        }
        .padding()
        .background(Color.gray.opacity(0.1))
        .cornerRadius(12)
    }
}

struct TransferStatisticItem: View {
    let title: String
    let value: String
    let color: Color
    
    var body: some View {
        VStack(spacing: 4) {
            Text(value)
                .font(.title2)
                .fontWeight(.bold)
                .foregroundColor(color)
            Text(title)
                .font(.caption)
                .foregroundColor(.secondary)
        }
        .frame(maxWidth: .infinity)
    }
}