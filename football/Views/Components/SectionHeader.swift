import SwiftUI

struct SectionHeader: View {
    let title: String
    let icon: String
    
    var body: some View {
        HStack {
            Image(systemName: icon)
                .font(.headline)
                .foregroundColor(.blue)
            
            Text(title)
                .font(.headline)
                .foregroundColor(.primary)
            
            Spacer()
        }
        .padding(.horizontal)
        .padding(.top, 8)
    }
}

#Preview {
    SectionHeader(title: "테스트 섹션", icon: "sportscourt")
}