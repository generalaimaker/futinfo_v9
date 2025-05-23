import SwiftUI

// ShimmeringEffect 직접 구현
struct ShimmeringEffect: ViewModifier {
    @State private var phase: CGFloat = 0
    
    func body(content: Content) -> some View {
        content
            .overlay(
                GeometryReader { geo in
                    LinearGradient(
                        gradient: Gradient(stops: [
                            .init(color: .clear, location: phase - 0.2),
                            .init(color: .white.opacity(0.3), location: phase),
                            .init(color: .clear, location: phase + 0.2)
                        ]),
                        startPoint: .leading,
                        endPoint: .trailing
                    )
                    .mask(content)
                    .blendMode(.screen)
                }
            )
            .onAppear {
                withAnimation(Animation.linear(duration: 1.5).repeatForever(autoreverses: false)) {
                    phase = 1.2
                }
            }
    }
}

extension View {
    func shimmering() -> some View {
        self.modifier(ShimmeringEffect())
    }
}

struct FixtureSkeletonView: View {
    var body: some View {
        VStack(spacing: 16) {
            // 여러 개의 스켈레톤 아이템 표시
            ForEach(0..<5, id: \.self) { _ in
                skeletonItem
            }
        }
        .padding()
        .shimmering() // ShimmeringEffect 적용
    }
    
    // 단일 스켈레톤 아이템
    private var skeletonItem: some View {
        HStack {
            // 시간 표시 영역
            RoundedRectangle(cornerRadius: 4)
                .fill(Color.gray.opacity(0.2))
                .frame(width: 40, height: 16)
            
            Spacer()
                .frame(width: 16)
            
            // 홈팀 영역
            HStack {
                // 팀 로고 플레이스홀더
                Circle()
                    .fill(Color.gray.opacity(0.2))
                    .frame(width: 24, height: 24)
                
                // 팀 이름 플레이스홀더
                RoundedRectangle(cornerRadius: 4)
                    .fill(Color.gray.opacity(0.2))
                    .frame(width: 80, height: 16)
            }
            
            Spacer()
            
            // 스코어 영역
            RoundedRectangle(cornerRadius: 4)
                .fill(Color.gray.opacity(0.2))
                .frame(width: 30, height: 20)
            
            Spacer()
            
            // 원정팀 영역
            HStack {
                // 팀 이름 플레이스홀더
                RoundedRectangle(cornerRadius: 4)
                    .fill(Color.gray.opacity(0.2))
                    .frame(width: 80, height: 16)
                
                // 팀 로고 플레이스홀더
                Circle()
                    .fill(Color.gray.opacity(0.2))
                    .frame(width: 24, height: 24)
            }
        }
        .padding(.vertical, 8)
        .padding(.horizontal, 12)
        .background(Color.gray.opacity(0.05))
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