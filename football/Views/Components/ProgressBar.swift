import SwiftUI

struct ProgressBar: View {
    let leftValue: Double
    let rightValue: Double
    let leftColor: Color
    let rightColor: Color
    
    var body: some View {
        GeometryReader { geometry in
            HStack(spacing: 0) {
                let total = leftValue + rightValue
                let leftWidth = total > 0 ? geometry.size.width * (leftValue / total) : 0
                let rightWidth = total > 0 ? geometry.size.width * (rightValue / total) : 0
                
                Rectangle()
                    .fill(leftColor)
                    .frame(width: leftWidth)
                
                Rectangle()
                    .fill(rightColor)
                    .frame(width: rightWidth)
            }
            .frame(height: 8)
            .clipShape(RoundedRectangle(cornerRadius: 4))
        }
        .frame(height: 8)
    }
}
