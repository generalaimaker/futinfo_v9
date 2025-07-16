import SwiftUI

// MARK: - Transfer Marketplace (쇼핑몰 스타일 이적 시장)

struct TransferMarketplaceView: View {
    @State private var selectedPosition: PlayerPosition = .all
    @State private var selectedPriceRange: PriceRange = .all
    @State private var searchText = ""
    @State private var showingFilters = false
    
    let availablePlayers = TransferPlayer.samplePlayers
    
    var body: some View {
        NavigationView {
            VStack(spacing: 0) {
                // 검색 및 필터 바
                SearchAndFilterBar(
                    searchText: $searchText,
                    selectedPosition: $selectedPosition,
                    selectedPriceRange: $selectedPriceRange,
                    showingFilters: $showingFilters
                )
                
                // 이적 시장 통계
                MarketStatsView()
                
                // 선수 그리드
                ScrollView {
                    LazyVGrid(columns: Array(repeating: GridItem(.flexible(), spacing: 12), count: 2), spacing: 16) {
                        ForEach(filteredPlayers) { player in
                            TransferPlayerCard(player: player)
                        }
                    }
                    .padding()
                }
            }
            .navigationTitle("🛒 이적 마켓플레이스")
            .sheet(isPresented: $showingFilters) {
                TransferFiltersView(
                    selectedPosition: $selectedPosition,
                    selectedPriceRange: $selectedPriceRange
                )
            }
        }
    }
    
    private var filteredPlayers: [TransferPlayer] {
        var filtered = availablePlayers
        
        // 포지션 필터
        if selectedPosition != .all {
            filtered = filtered.filter { $0.position == selectedPosition }
        }
        
        // 가격 필터
        if selectedPriceRange != .all {
            filtered = filtered.filter { selectedPriceRange.contains($0.estimatedPrice) }
        }
        
        // 검색 텍스트 필터
        if !searchText.isEmpty {
            filtered = filtered.filter { 
                $0.name.localizedCaseInsensitiveContains(searchText) ||
                $0.currentClub.localizedCaseInsensitiveContains(searchText)
            }
        }
        
        return filtered.sorted { $0.marketValue > $1.marketValue }
    }
}

struct SearchAndFilterBar: View {
    @Binding var searchText: String
    @Binding var selectedPosition: PlayerPosition
    @Binding var selectedPriceRange: PriceRange
    @Binding var showingFilters: Bool
    
    var body: some View {
        VStack(spacing: 12) {
            HStack(spacing: 12) {
                // 검색 바
                HStack {
                    Image(systemName: "magnifyingglass")
                        .foregroundColor(.gray)
                    
                    TextField("선수 이름 또는 팀 검색", text: $searchText)
                        .textFieldStyle(PlainTextFieldStyle())
                }
                .padding(.horizontal, 12)
                .padding(.vertical, 8)
                .background(Color.gray.opacity(0.1))
                .cornerRadius(8)
                
                // 필터 버튼
                Button(action: { showingFilters = true }) {
                    Image(systemName: "slider.horizontal.3")
                        .foregroundColor(.blue)
                        .padding(8)
                        .background(Color.blue.opacity(0.1))
                        .cornerRadius(8)
                }
            }
            
            // 빠른 필터 칩들
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 8) {
                    ForEach(PlayerPosition.allCases, id: \.self) { position in
                        FilterChip(
                            title: position.displayName,
                            isSelected: selectedPosition == position
                        ) {
                            selectedPosition = position
                        }
                    }
                }
                .padding(.horizontal)
            }
        }
        .padding()
        .background(Color.white)
        .shadow(color: .black.opacity(0.05), radius: 2, x: 0, y: 1)
    }
}

struct FilterChip: View {
    let title: String
    let isSelected: Bool
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            Text(title)
                .font(.caption)
                .fontWeight(.medium)
                .foregroundColor(isSelected ? .white : .blue)
                .padding(.horizontal, 12)
                .padding(.vertical, 6)
                .background(isSelected ? Color.blue : Color.blue.opacity(0.1))
                .cornerRadius(16)
        }
    }
}

struct MarketStatsView: View {
    var body: some View {
        HStack(spacing: 20) {
            MarketStatItem(title: "총 이적료", value: "€2.1B", color: .green)
            MarketStatItem(title: "활성 딜", value: "47", color: .blue)
            MarketStatItem(title: "완료된 이적", value: "156", color: .purple)
        }
        .padding()
        .background(Color.gray.opacity(0.05))
    }
}

struct MarketStatItem: View {
    let title: String
    let value: String
    let color: Color
    
    var body: some View {
        VStack(spacing: 4) {
            Text(value)
                .font(.headline)
                .fontWeight(.bold)
                .foregroundColor(color)
            
            Text(title)
                .font(.caption)
                .foregroundColor(.secondary)
        }
    }
}

struct TransferPlayerCard: View {
    let player: TransferPlayer
    @State private var showingDetail = false
    
    var body: some View {
        Button(action: { showingDetail = true }) {
            VStack(spacing: 12) {
                // 선수 이미지 플레이스홀더
                ZStack {
                    RoundedRectangle(cornerRadius: 12)
                        .fill(LinearGradient(
                            colors: [Color.blue.opacity(0.3), Color.purple.opacity(0.3)],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        ))
                        .frame(height: 120)
                    
                    VStack {
                        Text(player.name.prefix(2))
                            .font(.title)
                            .fontWeight(.bold)
                            .foregroundColor(.white)
                        
                        Text(player.position.displayName)
                            .font(.caption)
                            .foregroundColor(.white.opacity(0.8))
                    }
                }
                
                VStack(spacing: 6) {
                    // 선수 이름
                    Text(player.name)
                        .font(.subheadline)
                        .fontWeight(.bold)
                        .lineLimit(1)
                    
                    // 현재 팀
                    Text(player.currentClub)
                        .font(.caption)
                        .foregroundColor(.secondary)
                        .lineLimit(1)
                    
                    // 시장 가치
                    Text("€\(player.marketValue)M")
                        .font(.caption)
                        .fontWeight(.bold)
                        .foregroundColor(.green)
                    
                    // 이적 상태
                    TransferStatusBadge(status: player.transferStatus)
                    
                    // 관심 클럽들
                    if !player.interestedClubs.isEmpty {
                        ScrollView(.horizontal, showsIndicators: false) {
                            HStack(spacing: 4) {
                                ForEach(player.interestedClubs.prefix(3), id: \.self) { club in
                                    Text(club)
                                        .font(.caption2)
                                        .padding(.horizontal, 6)
                                        .padding(.vertical, 2)
                                        .background(Color.orange.opacity(0.2))
                                        .foregroundColor(.orange)
                                        .cornerRadius(4)
                                }
                            }
                        }
                    }
                }
                .padding(.horizontal, 8)
            }
            .padding()
            .background(Color.white)
            .cornerRadius(16)
            .shadow(color: .black.opacity(0.1), radius: 4, x: 0, y: 2)
        }
        .buttonStyle(PlainButtonStyle())
        .sheet(isPresented: $showingDetail) {
            PlayerDetailView(player: player)
        }
    }
}

struct TransferStatusBadge: View {
    let status: TransferStatus
    
    var body: some View {
        Text(status.displayName)
            .font(.caption2)
            .fontWeight(.medium)
            .foregroundColor(status.color)
            .padding(.horizontal, 8)
            .padding(.vertical, 3)
            .background(status.color.opacity(0.2))
            .cornerRadius(8)
    }
}

struct PlayerDetailView: View {
    let player: TransferPlayer
    @Environment(\.dismiss) private var dismiss
    
    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 24) {
                    // 선수 헤더
                    PlayerHeaderView(player: player)
                    
                    // 이적 정보
                    TransferInfoSection(player: player)
                    
                    // 통계
                    PlayerStatsSection(player: player)
                    
                    // 관심 클럽들
                    InterestedClubsSection(player: player)
                    
                    // 액션 버튼들
                    ActionButtonsSection(player: player)
                }
                .padding()
            }
            .navigationTitle(player.name)
            .navigationTitle(player.name)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("닫기") {
                        dismiss()
                    }
                }
            }
        }
    }
}

struct PlayerHeaderView: View {
    let player: TransferPlayer
    
    var body: some View {
        VStack(spacing: 16) {
            // 선수 이미지
            ZStack {
                Circle()
                    .fill(LinearGradient(
                        colors: [Color.blue, Color.purple],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                    ))
                    .frame(width: 120, height: 120)
                
                Text(player.name.prefix(2))
                    .font(.largeTitle)
                    .fontWeight(.bold)
                    .foregroundColor(.white)
            }
            
            VStack(spacing: 8) {
                Text(player.name)
                    .font(.title2)
                    .fontWeight(.bold)
                
                Text("\(player.position.displayName) • \(player.age)세")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                
                Text(player.currentClub)
                    .font(.headline)
                    .foregroundColor(.blue)
                
                HStack(spacing: 16) {
                    VStack {
                        Text("시장가치")
                            .font(.caption)
                            .foregroundColor(.secondary)
                        Text("€\(player.marketValue)M")
                            .font(.headline)
                            .fontWeight(.bold)
                            .foregroundColor(.green)
                    }
                    
                    VStack {
                        Text("예상 이적료")
                            .font(.caption)
                            .foregroundColor(.secondary)
                        Text("€\(player.estimatedPrice)M")
                            .font(.headline)
                            .fontWeight(.bold)
                            .foregroundColor(.orange)
                    }
                }
            }
        }
    }
}

struct TransferInfoSection: View {
    let player: TransferPlayer
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("이적 정보")
                .font(.headline)
                .fontWeight(.bold)
            
            VStack(spacing: 8) {
                TransferInfoRow(title: "계약 만료", value: player.contractExpiry)
                TransferInfoRow(title: "이적 상태", value: player.transferStatus.displayName)
                TransferInfoRow(title: "에이전트", value: player.agent)
                TransferInfoRow(title: "국적", value: player.nationality)
            }
        }
        .padding()
        .background(Color.gray.opacity(0.05))
        .cornerRadius(12)
    }
}

struct TransferInfoRow: View {
    let title: String
    let value: String
    
    var body: some View {
        HStack {
            Text(title)
                .font(.subheadline)
                .foregroundColor(.secondary)
            Spacer()
            Text(value)
                .font(.subheadline)
                .fontWeight(.medium)
        }
    }
}

struct PlayerStatsSection: View {
    let player: TransferPlayer
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("시즌 통계")
                .font(.headline)
                .fontWeight(.bold)
            
            LazyVGrid(columns: Array(repeating: GridItem(.flexible()), count: 3), spacing: 12) {
                PlayerStatCard(title: "경기", value: "\(player.stats.appearances)")
                PlayerStatCard(title: "골", value: "\(player.stats.goals)")
                PlayerStatCard(title: "어시스트", value: "\(player.stats.assists)")
                PlayerStatCard(title: "평점", value: String(format: "%.1f", player.stats.rating))
                PlayerStatCard(title: "패스 성공률", value: "\(player.stats.passAccuracy)%")
                PlayerStatCard(title: "태클", value: "\(player.stats.tackles)")
            }
        }
        .padding()
        .background(Color.gray.opacity(0.05))
        .cornerRadius(12)
    }
}

struct PlayerStatCard: View {
    let title: String
    let value: String
    
    var body: some View {
        VStack(spacing: 4) {
            Text(value)
                .font(.headline)
                .fontWeight(.bold)
                .foregroundColor(.blue)
            
            Text(title)
                .font(.caption)
                .foregroundColor(.secondary)
        }
        .padding(.vertical, 8)
        .frame(maxWidth: .infinity)
        .background(Color.white)
        .cornerRadius(8)
    }
}

struct InterestedClubsSection: View {
    let player: TransferPlayer
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("관심 클럽")
                .font(.headline)
                .fontWeight(.bold)
            
            if player.interestedClubs.isEmpty {
                Text("현재 관심을 보이는 클럽이 없습니다.")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
            } else {
                LazyVGrid(columns: Array(repeating: GridItem(.flexible()), count: 2), spacing: 8) {
                    ForEach(player.interestedClubs, id: \.self) { club in
                        Text(club)
                            .font(.subheadline)
                            .fontWeight(.medium)
                            .foregroundColor(.blue)
                            .padding()
                            .frame(maxWidth: .infinity)
                            .background(Color.blue.opacity(0.1))
                            .cornerRadius(8)
                    }
                }
            }
        }
        .padding()
        .background(Color.gray.opacity(0.05))
        .cornerRadius(12)
    }
}

struct ActionButtonsSection: View {
    let player: TransferPlayer
    
    var body: some View {
        VStack(spacing: 12) {
            Button("관심 목록에 추가") {
                // 관심 목록 추가 로직
            }
            .font(.headline)
            .foregroundColor(.white)
            .frame(maxWidth: .infinity)
            .padding()
            .background(Color.blue)
            .cornerRadius(12)
            
            HStack(spacing: 12) {
                Button("뉴스 보기") {
                    // 선수 관련 뉴스 보기
                }
                .font(.subheadline)
                .foregroundColor(.blue)
                .frame(maxWidth: .infinity)
                .padding()
                .background(Color.blue.opacity(0.1))
                .cornerRadius(8)
                
                Button("통계 상세") {
                    // 상세 통계 보기
                }
                .font(.subheadline)
                .foregroundColor(.green)
                .frame(maxWidth: .infinity)
                .padding()
                .background(Color.green.opacity(0.1))
                .cornerRadius(8)
            }
        }
    }
}

struct TransferFiltersView: View {
    @Binding var selectedPosition: PlayerPosition
    @Binding var selectedPriceRange: PriceRange
    @Environment(\.dismiss) private var dismiss
    
    var body: some View {
        NavigationView {
            VStack(alignment: .leading, spacing: 24) {
                VStack(alignment: .leading, spacing: 12) {
                    Text("포지션")
                        .font(.headline)
                        .fontWeight(.bold)
                    
                    LazyVGrid(columns: Array(repeating: GridItem(.flexible()), count: 3), spacing: 8) {
                        ForEach(PlayerPosition.allCases, id: \.self) { position in
                            FilterOptionButton(
                                title: position.displayName,
                                isSelected: selectedPosition == position
                            ) {
                                selectedPosition = position
                            }
                        }
                    }
                }
                
                VStack(alignment: .leading, spacing: 12) {
                    Text("가격대")
                        .font(.headline)
                        .fontWeight(.bold)
                    
                    VStack(spacing: 8) {
                        ForEach(PriceRange.allCases, id: \.self) { range in
                            FilterOptionButton(
                                title: range.displayName,
                                isSelected: selectedPriceRange == range
                            ) {
                                selectedPriceRange = range
                            }
                        }
                    }
                }
                
                Spacer()
                
                Button("필터 적용") {
                    dismiss()
                }
                .font(.headline)
                .foregroundColor(.white)
                .frame(maxWidth: .infinity)
                .padding()
                .background(Color.blue)
                .cornerRadius(12)
            }
            .padding()
            .navigationTitle("필터")
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("취소") {
                        dismiss()
                    }
                }
            }
        }
    }
}

struct FilterOptionButton: View {
    let title: String
    let isSelected: Bool
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            Text(title)
                .font(.subheadline)
                .fontWeight(.medium)
                .foregroundColor(isSelected ? .white : .primary)
                .frame(maxWidth: .infinity)
                .padding()
                .background(isSelected ? Color.blue : Color.gray.opacity(0.1))
                .cornerRadius(8)
        }
    }
}

// MARK: - Data Models

struct TransferPlayer: Identifiable {
    let id = UUID()
    let name: String
    let age: Int
    let position: PlayerPosition
    let currentClub: String
    let nationality: String
    let marketValue: Int // in millions
    let estimatedPrice: Int // in millions
    let contractExpiry: String
    let agent: String
    let transferStatus: TransferStatus
    let interestedClubs: [String]
    let stats: PlayerStats
    
    static let samplePlayers = [
        TransferPlayer(
            name: "Kylian Mbappé",
            age: 24,
            position: .forward,
            currentClub: "PSG",
            nationality: "프랑스",
            marketValue: 180,
            estimatedPrice: 150,
            contractExpiry: "2024년 6월",
            agent: "Fayza Lamari",
            transferStatus: .available,
            interestedClubs: ["Real Madrid", "Liverpool"],
            stats: PlayerStats(appearances: 34, goals: 29, assists: 5, rating: 8.2, passAccuracy: 83, tackles: 12)
        ),
        TransferPlayer(
            name: "Erling Haaland",
            age: 23,
            position: .forward,
            currentClub: "Manchester City",
            nationality: "노르웨이",
            marketValue: 170,
            estimatedPrice: 200,
            contractExpiry: "2027년 6월",
            agent: "Rafaela Pimenta",
            transferStatus: .notForSale,
            interestedClubs: [],
            stats: PlayerStats(appearances: 35, goals: 36, assists: 8, rating: 8.5, passAccuracy: 75, tackles: 8)
        ),
        TransferPlayer(
            name: "Jude Bellingham",
            age: 20,
            position: .midfielder,
            currentClub: "Real Madrid",
            nationality: "잉글랜드",
            marketValue: 120,
            estimatedPrice: 150,
            contractExpiry: "2029년 6월",
            agent: "Mark Bennett",
            transferStatus: .notForSale,
            interestedClubs: [],
            stats: PlayerStats(appearances: 32, goals: 14, assists: 12, rating: 8.1, passAccuracy: 89, tackles: 45)
        ),
        TransferPlayer(
            name: "Victor Osimhen",
            age: 25,
            position: .forward,
            currentClub: "Napoli",
            nationality: "나이지리아",
            marketValue: 100,
            estimatedPrice: 120,
            contractExpiry: "2026년 6월",
            agent: "Roberto Calenda",
            transferStatus: .available,
            interestedClubs: ["Chelsea", "Arsenal", "PSG"],
            stats: PlayerStats(appearances: 30, goals: 26, assists: 4, rating: 7.8, passAccuracy: 72, tackles: 15)
        )
    ]
}

struct PlayerStats {
    let appearances: Int
    let goals: Int
    let assists: Int
    let rating: Double
    let passAccuracy: Int
    let tackles: Int
}

enum PlayerPosition: CaseIterable {
    case all, goalkeeper, defender, midfielder, forward
    
    var displayName: String {
        switch self {
        case .all: return "전체"
        case .goalkeeper: return "골키퍼"
        case .defender: return "수비수"
        case .midfielder: return "미드필더"
        case .forward: return "공격수"
        }
    }
}

enum TransferStatus {
    case available, negotiating, notForSale, medical
    
    var displayName: String {
        switch self {
        case .available: return "이적 가능"
        case .negotiating: return "협상 중"
        case .notForSale: return "이적 불가"
        case .medical: return "메디컬 진행"
        }
    }
    
    var color: Color {
        switch self {
        case .available: return .green
        case .negotiating: return .orange
        case .notForSale: return .red
        case .medical: return .blue
        }
    }
}

enum PriceRange: CaseIterable {
    case all, under50, from50to100, from100to150, over150
    
    var displayName: String {
        switch self {
        case .all: return "전체 가격대"
        case .under50: return "€50M 미만"
        case .from50to100: return "€50M - €100M"
        case .from100to150: return "€100M - €150M"
        case .over150: return "€150M 이상"
        }
    }
    
    func contains(_ price: Int) -> Bool {
        switch self {
        case .all: return true
        case .under50: return price < 50
        case .from50to100: return price >= 50 && price < 100
        case .from100to150: return price >= 100 && price < 150
        case .over150: return price >= 150
        }
    }
}

#Preview {
    TransferMarketplaceView()
}