import SwiftUI

struct FixtureSkeletonView: View {
    @State private var isAnimating = false
    
    var body: some View {
        VStack(spacing: 16) {
            // 여러 개의 스켈레톤 아이템 표시
            ForEach(0..<5, id: \.self) { _ in
                skeletonItem
            }
        }
        .padding()
        .onAppear {
            // 애니메이션 시작
            withAnimation(Animation.linear(duration: 1.5).repeatForever(autoreverses: true)) {
                isAnimating = true
            }
        }
    }
    
    // 단일 스켈레톤 아이템
    private var skeletonItem: some View {
        HStack {
            // 시간 표시 영역
            RoundedRectangle(cornerRadius: 4)
                .fill(Color.gray.opacity(isAnimating ? 0.3 : 0.6))
                .frame(width: 40, height: 16)
            
            Spacer()
                .frame(width: 16)
            
            // 홈팀 영역
            HStack {
                // 팀 로고 플레이스홀더
                Circle()
                    .fill(Color.gray.opacity(isAnimating ? 0.3 : 0.6))
                    .frame(width: 24, height: 24)
                
                // 팀 이름 플레이스홀더
                RoundedRectangle(cornerRadius: 4)
                    .fill(Color.gray.opacity(isAnimating ? 0.3 : 0.6))
                    .frame(width: 80, height: 16)
            }
            
            Spacer()
            
            // 스코어 영역
            RoundedRectangle(cornerRadius: 4)
                .fill(Color.gray.opacity(isAnimating ? 0.3 : 0.6))
                .frame(width: 30, height: 20)
            
            Spacer()
            
            // 원정팀 영역
            HStack {
                // 팀 이름 플레이스홀더
                RoundedRectangle(cornerRadius: 4)
                    .fill(Color.gray.opacity(isAnimating ? 0.3 : 0.6))
                    .frame(width: 80, height: 16)
                
                // 팀 로고 플레이스홀더
                Circle()
                    .fill(Color.gray.opacity(isAnimating ? 0.3 : 0.6))
                    .frame(width: 24, height: 24)
            }
        }
        .padding(.vertical, 8)
        .padding(.horizontal, 12)
        .background(Color(UIColor.secondarySystemBackground))
        .cornerRadius(8)
    }
}

struct FixtureSkeletonView_Previews: PreviewProvider {
    static var previews: some View {
        FixtureSkeletonView()
            .previewLayout(.sizeThatFits)
            .padding()
    }
}