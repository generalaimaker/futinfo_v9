import SwiftUI

// MARK: - 경기 셀 스켈레톤 뷰
struct FixtureSkeletonCell: View {
    @State private var isAnimating = false
    
    var body: some View {
        ZStack(alignment: .topTrailing) {
            VStack(spacing: 0) {
                // 팀 정보 스켈레톤
                HStack(alignment: .center, spacing: 8) {
                    // 홈팀
                    HStack(spacing: 6) {
                        Spacer()
                        SkeletonBox(width: 40, height: 14) // 팀명
                        SkeletonCircle(size: 24) // 로고
                    }
                    
                    // 스코어
                    SkeletonBox(width: 50, height: 24)
                        .frame(width: 50)
                    
                    // 어웨이팀
                    HStack(spacing: 6) {
                        SkeletonCircle(size: 24) // 로고
                        SkeletonBox(width: 40, height: 14) // 팀명
                        Spacer()
                    }
                }
                .padding(.vertical, 10)
                
                // 경기장 정보 스켈레톤
                HStack {
                    Spacer()
                    SkeletonBox(width: 120, height: 10)
                    Spacer()
                }
            }
            .padding(.vertical, 10)
            .padding(.horizontal, 10)
            .background(Color(.systemBackground))
            .cornerRadius(10)
            
            // 시간 스켈레톤
            SkeletonBox(width: 40, height: 16)
                .padding(6)
        }
        .shadow(color: Color.black.opacity(0.05), radius: 2, x: 0, y: 1)
        .onAppear {
            withAnimation(Animation.easeInOut(duration: 1.5).repeatForever(autoreverses: true)) {
                isAnimating = true
            }
        }
    }
}

// MARK: - 스켈레톤 박스
struct SkeletonBox: View {
    let width: CGFloat
    let height: CGFloat
    @State private var isAnimating = false
    
    var body: some View {
        RoundedRectangle(cornerRadius: 4)
            .fill(
                LinearGradient(
                    gradient: Gradient(colors: [
                        Color(.systemGray5),
                        Color(.systemGray6),
                        Color(.systemGray5)
                    ]),
                    startPoint: isAnimating ? .leading : .trailing,
                    endPoint: isAnimating ? .trailing : .leading
                )
            )
            .frame(width: width, height: height)
            .onAppear {
                withAnimation(Animation.easeInOut(duration: 1.5).repeatForever(autoreverses: false)) {
                    isAnimating.toggle()
                }
            }
    }
}

// MARK: - 스켈레톤 원형
struct SkeletonCircle: View {
    let size: CGFloat
    @State private var isAnimating = false
    
    var body: some View {
        Circle()
            .fill(
                LinearGradient(
                    gradient: Gradient(colors: [
                        Color(.systemGray5),
                        Color(.systemGray6),
                        Color(.systemGray5)
                    ]),
                    startPoint: isAnimating ? .leading : .trailing,
                    endPoint: isAnimating ? .trailing : .leading
                )
            )
            .frame(width: size, height: size)
            .onAppear {
                withAnimation(Animation.easeInOut(duration: 1.5).repeatForever(autoreverses: false)) {
                    isAnimating.toggle()
                }
            }
    }
}

// MARK: - 전체 리스트 스켈레톤
struct FixturesSkeletonView: View {
    var body: some View {
        ScrollView {
            VStack(spacing: 12) {
                ForEach(0..<5, id: \.self) { _ in
                    FixtureSkeletonCell()
                        .padding(.horizontal)
                }
            }
            .padding(.vertical)
        }
    }
}