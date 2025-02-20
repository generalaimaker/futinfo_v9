import SwiftUI

public struct ProgressBar: View {
    public let leftValue: Double
    public let rightValue: Double
    public let leftColor: Color
    public let rightColor: Color
    
    public init(leftValue: Double, rightValue: Double, leftColor: Color, rightColor: Color) {
        self.leftValue = leftValue
        self.rightValue = rightValue
        self.leftColor = leftColor
        self.rightColor = rightColor
    }
    
    private var total: Double {
        leftValue + rightValue
    }
    
    private var leftRatio: Double {
        total > 0 ? leftValue / total : 0
    }
    
    private var rightRatio: Double {
        total > 0 ? rightValue / total : 0
    }
    
    public var body: some View {
        GeometryReader { geometry in
            ZStack(alignment: .leading) {
                // 배경
                RoundedRectangle(cornerRadius: 6)
                    .fill(Color(.systemGray5))
                    .frame(height: 8)
                
                // 왼쪽 값
                RoundedRectangle(cornerRadius: 6)
                    .fill(
                        LinearGradient(
                            gradient: Gradient(colors: [
                                leftColor.opacity(0.8),
                                leftColor
                            ]),
                            startPoint: .leading,
                            endPoint: .trailing
                        )
                    )
                    .frame(width: geometry.size.width * leftRatio, height: 8)
                
                // 오른쪽 값
                RoundedRectangle(cornerRadius: 6)
                    .fill(
                        LinearGradient(
                            gradient: Gradient(colors: [
                                rightColor,
                                rightColor.opacity(0.8)
                            ]),
                            startPoint: .leading,
                            endPoint: .trailing
                        )
                    )
                    .frame(width: geometry.size.width * rightRatio, height: 8)
                    .offset(x: geometry.size.width * leftRatio)
            }
            .animation(.easeInOut(duration: 0.3), value: leftRatio)
            .animation(.easeInOut(duration: 0.3), value: rightRatio)
        }
        .frame(height: 8)
    }
}
