import SwiftUI

// MARK: - Transfer Center Detail Views

struct TransferDeadlineTimerView: View {
    @State private var timeRemaining = TimeInterval(0)
    @State private var timer: Timer?
    
    let transferDeadline = Calendar.current.date(from: DateComponents(year: 2024, month: 9, day: 1, hour: 23, minute: 59)) ?? Date()
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Image(systemName: "clock.fill")
                    .foregroundColor(.red)
                Text("⏰ 이적 마감일 카운트다운")
                    .font(.headline)
                    .fontWeight(.bold)
                Spacer()
            }
            
            VStack(spacing: 8) {
                Text("2024 여름 이적시장 마감까지")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                
                HStack(spacing: 16) {
                    TimeUnitView(value: days, unit: "일")
                    TimeUnitView(value: hours, unit: "시간")
                    TimeUnitView(value: minutes, unit: "분")
                    TimeUnitView(value: seconds, unit: "초")
                }
                
                ProgressView(value: progressValue)
                    .progressViewStyle(LinearProgressViewStyle(tint: .red))
                    .scaleEffect(y: 2)
                
                Text("마감 임박! 빅딜이 성사될까요? 🔥")
                    .font(.caption)
                    .foregroundColor(.red)
                    .fontWeight(.medium)
            }
        }
        .padding()
        .background(Color.white)
        .cornerRadius(12)
        .shadow(color: .black.opacity(0.1), radius: 4, x: 0, y: 2)
        .onAppear {
            startTimer()
        }
        .onDisappear {
            timer?.invalidate()
        }
    }
    
    private var days: Int {
        Int(timeRemaining) / 86400
    }
    
    private var hours: Int {
        (Int(timeRemaining) % 86400) / 3600
    }
    
    private var minutes: Int {
        (Int(timeRemaining) % 3600) / 60
    }
    
    private var seconds: Int {
        Int(timeRemaining) % 60
    }
    
    private var progressValue: Double {
        let totalDuration: TimeInterval = 90 * 24 * 60 * 60 // 90일
        let elapsed = totalDuration - timeRemaining
        return min(max(elapsed / totalDuration, 0), 1)
    }
    
    private func startTimer() {
        updateTimeRemaining()
        timer = Timer.scheduledTimer(withTimeInterval: 1, repeats: true) { _ in
            updateTimeRemaining()
        }
    }
    
    private func updateTimeRemaining() {
        timeRemaining = max(transferDeadline.timeIntervalSinceNow, 0)
    }
}

struct TimeUnitView: View {
    let value: Int
    let unit: String
    
    var body: some View {
        VStack(spacing: 2) {
            Text("\(value)")
                .font(.title2)
                .fontWeight(.bold)
                .foregroundColor(.red)
            Text(unit)
                .font(.caption2)
                .foregroundColor(.secondary)
        }
        .frame(minWidth: 40)
        .padding(.vertical, 8)
        .background(Color.red.opacity(0.1))
        .cornerRadius(8)
    }
}

struct TransferPredictionDetailView: View {
    @State private var userPredictions: [String: Double] = [:]
    @State private var showingPredictionInput = false
    @State private var selectedPlayer = ""
    
    let predictions = [
        TransferPrediction(
            player: "Harry Kane",
            currentClub: "Tottenham",
            targetClub: "Bayern Munich",
            probability: 0.85,
            factors: ["계약 만료 임박", "바이에른 공식 관심", "토트넘 재계약 거부"],
            lastUpdated: Date().addingTimeInterval(-3600)
        ),
        TransferPrediction(
            player: "Kylian Mbappé",
            currentClub: "PSG",
            targetClub: "Real Madrid",
            probability: 0.92,
            factors: ["레알 마드리드 공식 오퍼", "선수 이적 의사 표명", "PSG 매각 검토"],
            lastUpdated: Date().addingTimeInterval(-1800)
        ),
        TransferPrediction(
            player: "Declan Rice",
            currentClub: "West Ham",
            targetClub: "Arsenal",
            probability: 0.78,
            factors: ["아스날 100M 오퍼", "선수 챔스리그 희망", "웨스트햄 매각 압박"],
            lastUpdated: Date().addingTimeInterval(-7200)
        )
    ]
    
    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack {
                Image(systemName: "brain.head.profile")
                    .foregroundColor(.purple)
                Text("🧠 AI 이적 예측 상세")
                    .font(.headline)
                    .fontWeight(.bold)
                Spacer()
                Button("내 예측 참여") {
                    showingPredictionInput = true
                }
                .font(.caption)
                .foregroundColor(.white)
                .padding(.horizontal, 12)
                .padding(.vertical, 6)
                .background(Color.purple)
                .cornerRadius(12)
            }
            
            ForEach(predictions, id: \.player) { prediction in
                DetailedPredictionCard(
                    prediction: prediction,
                    userPrediction: userPredictions[prediction.player]
                ) {
                    selectedPlayer = prediction.player
                    showingPredictionInput = true
                }
            }
            
            // 예측 정확도 통계
            PredictionAccuracyView()
        }
        .padding()
        .background(Color.white)
        .cornerRadius(12)
        .shadow(color: .black.opacity(0.1), radius: 4, x: 0, y: 2)
        .sheet(isPresented: $showingPredictionInput) {
            UserPredictionInputView(
                playerName: selectedPlayer,
                onSubmit: { player, prediction in
                    userPredictions[player] = prediction
                }
            )
        }
    }
}

struct TransferPrediction {
    let player: String
    let currentClub: String
    let targetClub: String
    let probability: Double
    let factors: [String]
    let lastUpdated: Date
}

struct DetailedPredictionCard: View {
    let prediction: TransferPrediction
    let userPrediction: Double?
    let onUserPredict: () -> Void
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            // 선수 정보 헤더
            HStack {
                VStack(alignment: .leading, spacing: 2) {
                    Text(prediction.player)
                        .font(.subheadline)
                        .fontWeight(.bold)
                    
                    HStack(spacing: 4) {
                        Text(prediction.currentClub)
                            .font(.caption)
                            .foregroundColor(.secondary)
                        Image(systemName: "arrow.right")
                            .font(.caption2)
                            .foregroundColor(.secondary)
                        Text(prediction.targetClub)
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                }
                
                Spacer()
                
                VStack(alignment: .trailing, spacing: 2) {
                    Text("\(Int(prediction.probability * 100))%")
                        .font(.title3)
                        .fontWeight(.bold)
                        .foregroundColor(probabilityColor)
                    
                    Text("AI 예측")
                        .font(.caption2)
                        .foregroundColor(.secondary)
                }
            }
            
            // 확률 바
            HStack(spacing: 8) {
                Text("AI")
                    .font(.caption2)
                    .foregroundColor(.secondary)
                
                ProgressView(value: prediction.probability)
                    .progressViewStyle(LinearProgressViewStyle(tint: probabilityColor))
                    .scaleEffect(y: 0.8)
                
                if let userPred = userPrediction {
                    Text("내 예측: \(Int(userPred * 100))%")
                        .font(.caption2)
                        .foregroundColor(.blue)
                }
            }
            
            // 예측 근거
            VStack(alignment: .leading, spacing: 4) {
                Text("예측 근거:")
                    .font(.caption)
                    .fontWeight(.medium)
                    .foregroundColor(.secondary)
                
                ForEach(prediction.factors, id: \.self) { factor in
                    HStack(spacing: 4) {
                        Circle()
                            .fill(Color.blue)
                            .frame(width: 4, height: 4)
                        Text(factor)
                            .font(.caption2)
                            .foregroundColor(.secondary)
                    }
                }
            }
            
            // 액션 버튼들
            HStack {
                Button("내 예측 제출") {
                    onUserPredict()
                }
                .font(.caption)
                .foregroundColor(.blue)
                
                Spacer()
                
                Text("업데이트: \(prediction.lastUpdated, style: .relative)")
                    .font(.caption2)
                    .foregroundColor(.secondary)
            }
        }
        .padding()
        .background(Color.gray.opacity(0.05))
        .cornerRadius(8)
    }
    
    private var probabilityColor: Color {
        if prediction.probability > 0.8 {
            return .green
        } else if prediction.probability > 0.6 {
            return .orange
        } else {
            return .red
        }
    }
}

struct PredictionAccuracyView: View {
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("🎯 AI 예측 정확도")
                .font(.subheadline)
                .fontWeight(.medium)
            
            HStack(spacing: 16) {
                AccuracyStatView(title: "이번 시즌", accuracy: 0.73, color: .green)
                AccuracyStatView(title: "지난 시즌", accuracy: 0.68, color: .blue)
                AccuracyStatView(title: "전체 평균", accuracy: 0.71, color: .purple)
            }
            
            Text("* 80% 이상 예측의 정확도 기준")
                .font(.caption2)
                .foregroundColor(.secondary)
        }
        .padding()
        .background(Color.blue.opacity(0.05))
        .cornerRadius(8)
    }
}

struct AccuracyStatView: View {
    let title: String
    let accuracy: Double
    let color: Color
    
    var body: some View {
        VStack(spacing: 4) {
            Text("\(Int(accuracy * 100))%")
                .font(.subheadline)
                .fontWeight(.bold)
                .foregroundColor(color)
            
            Text(title)
                .font(.caption2)
                .foregroundColor(.secondary)
        }
    }
}

struct UserPredictionInputView: View {
    let playerName: String
    let onSubmit: (String, Double) -> Void
    
    @State private var predictionValue: Double = 0.5
    @Environment(\.dismiss) private var dismiss
    
    var body: some View {
        NavigationView {
            VStack(spacing: 24) {
                VStack(spacing: 8) {
                    Text("내 예측 제출")
                        .font(.title2)
                        .fontWeight(.bold)
                    
                    Text("\(playerName)의 이적 가능성을 예측해보세요")
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                        .multilineTextAlignment(.center)
                }
                
                VStack(spacing: 16) {
                    Text("\(Int(predictionValue * 100))%")
                        .font(.largeTitle)
                        .fontWeight(.bold)
                        .foregroundColor(.blue)
                    
                    Slider(value: $predictionValue, in: 0...1, step: 0.01)
                        .accentColor(.blue)
                    
                    HStack {
                        Text("0%")
                            .font(.caption)
                            .foregroundColor(.secondary)
                        Spacer()
                        Text("50%")
                            .font(.caption)
                            .foregroundColor(.secondary)
                        Spacer()
                        Text("100%")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                }
                .padding()
                .background(Color.gray.opacity(0.05))
                .cornerRadius(12)
                
                VStack(spacing: 12) {
                    Text("예측 근거 (선택사항)")
                        .font(.subheadline)
                        .fontWeight(.medium)
                    
                    // 간단한 근거 선택 버튼들
                    LazyVGrid(columns: Array(repeating: GridItem(.flexible()), count: 2), spacing: 8) {
                        PredictionReasonButton(title: "계약 상황", isSelected: false)
                        PredictionReasonButton(title: "팀 성과", isSelected: false)
                        PredictionReasonButton(title: "언론 보도", isSelected: false)
                        PredictionReasonButton(title: "선수 의지", isSelected: false)
                    }
                }
                
                Spacer()
                
                Button("예측 제출하기") {
                    onSubmit(playerName, predictionValue)
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
            .navigationTitle("내 예측")
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

struct PredictionReasonButton: View {
    let title: String
    @State var isSelected: Bool
    
    var body: some View {
        Button(title) {
            isSelected.toggle()
        }
        .font(.caption)
        .foregroundColor(isSelected ? .white : .blue)
        .padding(.horizontal, 12)
        .padding(.vertical, 6)
        .background(isSelected ? Color.blue : Color.blue.opacity(0.1))
        .cornerRadius(8)
    }
}

struct TransferTimelineView: View {
    let timelineEvents = [
        TransferTimelineEvent(
            date: Date().addingTimeInterval(-86400),
            title: "Mbappé, 레알 마드리드 이적 공식 발표",
            type: .confirmed,
            description: "5년 계약, 이적료 무료"
        ),
        TransferTimelineEvent(
            date: Date().addingTimeInterval(-172800),
            title: "케인, 바이에른 뮌헨과 개인 합의",
            type: .rumor,
            description: "토트넘과 이적료 협상 진행 중"
        ),
        TransferTimelineEvent(
            date: Date().addingTimeInterval(-259200),
            title: "라이스, 아스날 메디컬 테스트 완료",
            type: .medical,
            description: "£105M 이적료로 합의"
        )
    ]
    
    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack {
                Image(systemName: "timeline.selection")
                    .foregroundColor(.blue)
                Text("📅 이적 타임라인")
                    .font(.headline)
                    .fontWeight(.bold)
                Spacer()
            }
            
            VStack(spacing: 12) {
                ForEach(timelineEvents, id: \.title) { event in
                    TimelineEventRow(event: event)
                }
            }
            
            Button("전체 타임라인 보기") {
                // 전체 타임라인 페이지로 이동
            }
            .font(.caption)
            .foregroundColor(.blue)
        }
        .padding()
        .background(Color.white)
        .cornerRadius(12)
        .shadow(color: .black.opacity(0.1), radius: 4, x: 0, y: 2)
    }
}

struct TransferTimelineEvent {
    let date: Date
    let title: String
    let type: EventType
    let description: String
    
    enum EventType {
        case confirmed, rumor, medical, negotiation
        
        var color: Color {
            switch self {
            case .confirmed: return .green
            case .rumor: return .orange
            case .medical: return .blue
            case .negotiation: return .purple
            }
        }
        
        var icon: String {
            switch self {
            case .confirmed: return "checkmark.circle.fill"
            case .rumor: return "questionmark.circle.fill"
            case .medical: return "stethoscope"
            case .negotiation: return "handshake.fill"
            }
        }
    }
}

struct TimelineEventRow: View {
    let event: TransferTimelineEvent
    
    var body: some View {
        HStack(spacing: 12) {
            // 타임라인 아이콘
            Image(systemName: event.type.icon)
                .foregroundColor(event.type.color)
                .frame(width: 20)
            
            VStack(alignment: .leading, spacing: 4) {
                Text(event.title)
                    .font(.subheadline)
                    .fontWeight(.medium)
                
                Text(event.description)
                    .font(.caption)
                    .foregroundColor(.secondary)
                
                Text(event.date, style: .relative)
                    .font(.caption2)
                    .foregroundColor(.secondary)
            }
            
            Spacer()
        }
        .padding(.vertical, 4)
    }
}

#Preview {
    ScrollView {
        VStack(spacing: 20) {
            TransferDeadlineTimerView()
            TransferPredictionDetailView()
            TransferTimelineView()
        }
        .padding()
    }
}