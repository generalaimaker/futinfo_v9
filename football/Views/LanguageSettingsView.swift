import SwiftUI

/// 언어 설정 화면
struct LanguageSettingsView: View {
    @StateObject private var languageSettings = LanguageSettingsService.shared
    @Environment(\.dismiss) private var dismiss
    
    var body: some View {
        NavigationView {
            List {
                Section {
                    ForEach(AppLanguage.allCases) { language in
                        LanguageRow(
                            language: language,
                            isSelected: languageSettings.currentLanguage == language
                        ) {
                            languageSettings.changeLanguage(to: language)
                        }
                    }
                } header: {
                    Text("언어 선택")
                        .font(.headline)
                } footer: {
                    Text("선택한 언어로 뉴스 제목과 요약이 번역됩니다. GPT를 사용하여 축구 전문 용어를 정확하게 번역합니다.")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
                
                Section {
                    VStack(alignment: .leading, spacing: 12) {
                        HStack {
                            Image(systemName: "brain.head.profile")
                                .foregroundColor(.blue)
                            Text("AI 번역 기능")
                                .font(.headline)
                        }
                        
                        Text("• 실시간 GPT 번역")
                        Text("• 축구 전문 용어 최적화")
                        Text("• 팀명/선수명 보존")
                        Text("• 번역 캐시로 빠른 로딩")
                    }
                    .font(.caption)
                    .foregroundColor(.secondary)
                } header: {
                    Text("번역 기능")
                }
            }
            .navigationTitle("언어 설정")
            .navigationBarTitleDisplayMode(.large)
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

/// 언어 선택 행
struct LanguageRow: View {
    let language: AppLanguage
    let isSelected: Bool
    let onTap: () -> Void
    
    var body: some View {
        Button(action: onTap) {
            HStack {
                Text(language.flag)
                    .font(.title2)
                
                VStack(alignment: .leading, spacing: 2) {
                    Text(language.displayName)
                        .font(.body)
                        .foregroundColor(.primary)
                    
                    Text(language.nativeName)
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
                
                Spacer()
                
                if isSelected {
                    Image(systemName: "checkmark.circle.fill")
                        .foregroundColor(.blue)
                        .font(.title3)
                }
            }
            .contentShape(Rectangle())
        }
        .buttonStyle(PlainButtonStyle())
    }
}

#Preview {
    LanguageSettingsView()
}