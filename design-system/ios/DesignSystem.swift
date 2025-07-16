import SwiftUI

// MARK: - Design System for iOS

enum DesignSystem {
    
    // MARK: - Colors
    enum Colors {
        static let primary = Color(hex: "#1E88E5")
        static let primaryLight = Color(hex: "#64B5F6")
        static let primaryDark = Color(hex: "#1565C0")
        
        enum Trust {
            static let official = Color(hex: "#4CAF50")
            static let tier1 = Color(hex: "#2196F3")
            static let verified = Color(hex: "#9C27B0")
            static let reliable = Color(hex: "#00BCD4")
            static let questionable = Color(hex: "#FF9800")
            static let unreliable = Color(hex: "#F44336")
        }
        
        enum Categories {
            static let general = Color(hex: "#757575")
            static let transfer = Color(hex: "#FF9800")
            static let match = Color(hex: "#2196F3")
            static let injury = Color(hex: "#9C27B0")
        }
        
        enum Background {
            static let primary = Color(hex: "#FAFAFA")
            static let secondary = Color(hex: "#F5F5F5")
            static let card = Color.white
            static let dark = Color(hex: "#121212")
        }
        
        enum Text {
            static let primary = Color(hex: "#212121")
            static let secondary = Color(hex: "#757575")
            static let disabled = Color(hex: "#BDBDBD")
            static let inverse = Color.white
        }
        
        static let divider = Color.black.opacity(0.12)
        static let shadow = Color.black.opacity(0.1)
    }
    
    // MARK: - Typography
    enum Typography {
        static func headline() -> Font {
            .system(size: 18, weight: .semibold, design: .default)
        }
        
        static func subheadline() -> Font {
            .system(size: 16, weight: .medium, design: .default)
        }
        
        static func body() -> Font {
            .system(size: 16, weight: .regular, design: .default)
        }
        
        static func caption() -> Font {
            .system(size: 14, weight: .regular, design: .default)
        }
        
        static func small() -> Font {
            .system(size: 12, weight: .regular, design: .default)
        }
    }
    
    // MARK: - Spacing
    enum Spacing {
        static let xs: CGFloat = 4
        static let sm: CGFloat = 8
        static let md: CGFloat = 16
        static let lg: CGFloat = 24
        static let xl: CGFloat = 32
        static let xxl: CGFloat = 48
    }
    
    // MARK: - Border Radius
    enum BorderRadius {
        static let sm: CGFloat = 4
        static let md: CGFloat = 8
        static let lg: CGFloat = 12
        static let xl: CGFloat = 16
        static let full: CGFloat = 9999
    }
    
    // MARK: - Shadows
    enum Shadow {
        static func small() -> some View {
            Color.black.opacity(0.05)
                .shadow(radius: 2, x: 0, y: 1)
        }
        
        static func medium() -> some View {
            Color.black.opacity(0.1)
                .shadow(radius: 4, x: 0, y: 2)
        }
        
        static func large() -> some View {
            Color.black.opacity(0.1)
                .shadow(radius: 6, x: 0, y: 4)
        }
    }
}

// MARK: - Common Components

struct DSCard<Content: View>: View {
    let content: Content
    
    init(@ViewBuilder content: () -> Content) {
        self.content = content()
    }
    
    var body: some View {
        content
            .padding(DesignSystem.Spacing.md)
            .background(DesignSystem.Colors.Background.card)
            .cornerRadius(DesignSystem.BorderRadius.lg)
            .shadow(color: DesignSystem.Colors.shadow, radius: 2, x: 0, y: 1)
    }
}

struct DSButton: View {
    let title: String
    let style: ButtonStyle
    let action: () -> Void
    
    enum ButtonStyle {
        case primary
        case secondary
        case text
    }
    
    var body: some View {
        Button(action: action) {
            Text(title)
                .font(DesignSystem.Typography.subheadline())
                .foregroundColor(foregroundColor)
                .padding(.horizontal, DesignSystem.Spacing.lg)
                .padding(.vertical, DesignSystem.Spacing.sm)
                .background(backgroundColor)
                .cornerRadius(DesignSystem.BorderRadius.full)
        }
    }
    
    private var backgroundColor: Color {
        switch style {
        case .primary: return DesignSystem.Colors.primary
        case .secondary: return DesignSystem.Colors.Background.secondary
        case .text: return Color.clear
        }
    }
    
    private var foregroundColor: Color {
        switch style {
        case .primary: return DesignSystem.Colors.Text.inverse
        case .secondary: return DesignSystem.Colors.Text.primary
        case .text: return DesignSystem.Colors.primary
        }
    }
}

struct DSBadge: View {
    let text: String
    let color: Color
    
    var body: some View {
        Text(text)
            .font(DesignSystem.Typography.small())
            .fontWeight(.medium)
            .foregroundColor(color)
            .padding(.horizontal, DesignSystem.Spacing.sm)
            .padding(.vertical, DesignSystem.Spacing.xs)
            .background(color.opacity(0.1))
            .cornerRadius(DesignSystem.BorderRadius.sm)
    }
}

// MARK: - News Specific Components

struct NewsTrustIndicator: View {
    let tier: String
    let trustScore: Int
    
    var body: some View {
        HStack(spacing: DesignSystem.Spacing.xs) {
            Circle()
                .fill(trustColor)
                .frame(width: 6, height: 6)
            
            Text(tierLabel)
                .font(DesignSystem.Typography.caption())
                .foregroundColor(trustColor)
        }
    }
    
    private var trustColor: Color {
        switch tier {
        case "official": return DesignSystem.Colors.Trust.official
        case "tier1": return DesignSystem.Colors.Trust.tier1
        case "verified": return DesignSystem.Colors.Trust.verified
        case "reliable": return DesignSystem.Colors.Trust.reliable
        case "questionable": return DesignSystem.Colors.Trust.questionable
        default: return DesignSystem.Colors.Trust.unreliable
        }
    }
    
    private var tierLabel: String {
        switch tier {
        case "official": return "[OFFICIAL]"
        case "tier1": return "[Tier 1]"
        case "verified": return "[Verified]"
        case "reliable": return "[Reliable]"
        case "questionable": return "[Rumour]"
        default: return "[Unverified]"
        }
    }
}

// MARK: - Extensions

extension Color {
    init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)
        let a, r, g, b: UInt64
        switch hex.count {
        case 3:
            (a, r, g, b) = (255, (int >> 8) * 17, (int >> 4 & 0xF) * 17, (int & 0xF) * 17)
        case 6:
            (a, r, g, b) = (255, int >> 16, int >> 8 & 0xFF, int & 0xFF)
        case 8:
            (a, r, g, b) = (int >> 24, int >> 16 & 0xFF, int >> 8 & 0xFF, int & 0xFF)
        default:
            (a, r, g, b) = (255, 0, 0, 0)
        }
        
        self.init(
            .sRGB,
            red: Double(r) / 255,
            green: Double(g) / 255,
            blue: Double(b) / 255,
            opacity: Double(a) / 255
        )
    }
}