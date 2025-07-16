import SwiftUI

struct TransferNewsFilterView: View {
    @Binding var showOnlyTier1: Bool
    @Binding var showRumours: Bool
    @Binding var showOfficialOnly: Bool
    @Environment(\.dismiss) private var dismiss
    
    var body: some View {
        NavigationView {
            Form {
                Section(header: Text("신뢰도 필터")) {
                    Toggle(isOn: $showOfficialOnly) {
                        HStack {
                            Image(systemName: "checkmark.seal.fill")
                                .foregroundColor(.green)
                            VStack(alignment: .leading) {
                                Text("공식 발표만")
                                    .font(.headline)
                                Text("클럽 확인된 이적만 표시")
                                    .font(.caption)
                                    .foregroundColor(.secondary)
                            }
                        }
                    }
                    
                    Toggle(isOn: $showOnlyTier1) {
                        HStack {
                            Image(systemName: "star.circle.fill")
                                .foregroundColor(.blue)
                            VStack(alignment: .leading) {
                                Text("Tier 1 소스만")
                                    .font(.headline)
                                Text("가장 신뢰할 수 있는 기자/매체")
                                    .font(.caption)
                                    .foregroundColor(.secondary)
                            }
                        }
                    }
                    
                    Toggle(isOn: $showRumours) {
                        HStack {
                            Image(systemName: "bubble.left.and.bubble.right")
                                .foregroundColor(.orange)
                            VStack(alignment: .leading) {
                                Text("루머 포함")
                                    .font(.headline)
                                Text("검증되지 않은 소식도 표시")
                                    .font(.caption)
                                    .foregroundColor(.secondary)
                            }
                        }
                    }
                }
                
                Section(header: Text("신뢰도 설명")) {
                    VStack(alignment: .leading, spacing: 12) {
                        ReliabilityRow(
                            icon: "checkmark.seal.fill",
                            color: .green,
                            title: "[OFFICIAL]",
                            description: "공식 발표, 클럽 확인"
                        )
                        
                        ReliabilityRow(
                            icon: "star.circle.fill",
                            color: .blue,
                            title: "[Tier 1]",
                            description: "Fabrizio Romano, David Ornstein 등"
                        )
                        
                        ReliabilityRow(
                            icon: "checkmark.circle.fill",
                            color: .purple,
                            title: "[Verified]",
                            description: "BBC, Sky Sports 등 검증된 매체"
                        )
                        
                        ReliabilityRow(
                            icon: "shield.fill",
                            color: .orange,
                            title: "[Reliable]",
                            description: "신뢰할 만한 소스"
                        )
                        
                        ReliabilityRow(
                            icon: "bubble.left.and.bubble.right",
                            color: .gray,
                            title: "[Rumour]",
                            description: "미확인 루머, 추측성 기사"
                        )
                    }
                }
            }
            .navigationTitle("이적 뉴스 필터")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("완료") {
                        dismiss()
                    }
                }
            }
        }
    }
}

struct ReliabilityRow: View {
    let icon: String
    let color: Color
    let title: String
    let description: String
    
    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: icon)
                .font(.title3)
                .foregroundColor(color)
                .frame(width: 30)
            
            VStack(alignment: .leading, spacing: 2) {
                Text(title)
                    .font(.subheadline)
                    .fontWeight(.semibold)
                Text(description)
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            
            Spacer()
        }
    }
}

#Preview {
    TransferNewsFilterView(
        showOnlyTier1: .constant(false),
        showRumours: .constant(true),
        showOfficialOnly: .constant(false)
    )
}