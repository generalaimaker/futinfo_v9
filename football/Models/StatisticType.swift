import Foundation

// 통계 타입 열거형
public enum StatisticType: String {
    // 공격 관련 통계
    case shotsOnGoal = "Shots on Goal"
    case shotsOffGoal = "Shots off Goal"
    case totalShots = "Total Shots"
    case blockedShots = "Blocked Shots"
    case shotsInsideBox = "Shots insidebox"
    case shotsOutsideBox = "Shots outsidebox"
    case expectedGoals = "expected_goals"
    
    // 패스 관련 통계
    case totalPasses = "Total passes"
    case passesAccurate = "passes accurate"
    case passesPercentage = "Passes %"
    case longBallsAccurate = "Long Balls Accurate"
    case crossesTotal = "Crosses total"
    
    // 수비 관련 통계
    case saves = "Goalkeeper Saves"
    case fouls = "Fouls"
    case yellowCards = "Yellow Cards"
    case redCards = "Red Cards"
    
    // 기타 통계
    case ballPossession = "Ball Possession"
    case cornerKicks = "Corner Kicks"
    case offsides = "Offsides"
    case throwIn = "Throw In"
    case touchesInOpponentBox = "Touches in opponent box"
    
    public static func from(_ rawValue: String) -> StatisticType {
        StatisticType(rawValue: rawValue) ?? .totalShots
    }
}
