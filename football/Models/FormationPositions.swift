struct FormationPositions {
    /// Map of formation → position group → list of [x, y] coordinates.
    /// TODO: Populate with actual data. Leaving empty avoids compile‑time errors when
    /// FormationView looks up `formationData`.
    /// Pre‑computed coordinates for common formations on a 10 × 10 grid.
    /// Keys: formation string → position group → array of [x, y] points.
    static let formationData: [String: [String: [[Double]]]] = [
        // 4-3-3: 기본 포메이션
        "4-3-3": [
            "GK":  [[5, 1]],
            "DEF": [[1, 3], [3, 3], [7, 3], [9, 3]],          // LB‑LCB‑RCB‑RB
            "MID": [[2, 5.5], [5, 5.5], [8, 5.5]],            // LCM‑CM‑RCM
            "FW":  [[2, 8.5], [5, 9], [8, 8.5]]               // LW‑ST‑RW
        ],
        
        // 4-2-3-1: 가장 많이 사용되는 4줄 포메이션
        "4-2-3-1": [
            "GK":  [[5, 1]],
            "DEF": [[1, 3], [3, 3], [7, 3], [9, 3]],          // LB-LCB-RCB-RB
            "CDM": [[3, 5], [7, 5]],                          // 더 넓게 분리된 더블 피봇
            "LW":  [[1.5, 7]],                                // 왼쪽 윙어 (더 왼쪽으로)
            "CAM": [[5, 7]],                                  // 중앙 공격형 미드필더
            "RW":  [[8.5, 7]],                                // 오른쪽 윙어 (더 오른쪽으로)
            "FW":  [[5, 9]]                                   // 최전방 스트라이커
        ],
        
        // 4-4-1-1: 전통적인 4줄 포메이션
        "4-4-1-1": [
            "GK":  [[5, 1]],
            "DEF": [[1, 3], [3, 3], [7, 3], [9, 3]],          // 백 4
            "MID": [[1.5, 5.5], [3.5, 5.5], [6.5, 5.5], [8.5, 5.5]], // 미드필드 4명
            "CAM": [[5, 7.5]],                                // 중앙 공격형 미드필더
            "FW":  [[5, 9]]                                   // 최전방 스트라이커
        ],
        
        // 4-3-2-1: 크리스마스 트리 포메이션
        "4-3-2-1": [
            "GK":  [[5, 1]],
            "DEF": [[1, 3], [3, 3], [7, 3], [9, 3]],          // 백 4
            "MID": [[2, 5], [5, 5], [8, 5]],                  // 미드필드 3명
            "CAM": [[3, 7], [7, 7]],                          // 더 넓게 분리된 2명의 CAM
            "FW":  [[5, 9]]                                   // 최전방 스트라이커
        ],
        
        // 4-1-4-1: 수비적인 4줄 포메이션
        "4-1-4-1": [
            "GK":  [[5, 1]],
            "DEF": [[1, 3], [3, 3], [7, 3], [9, 3]],          // 백 4
            "CDM": [[5, 4.5]],                                // 단일 수비형 미드필더
            "LM":  [[1.5, 6.5]],                              // 왼쪽 미드필더
            "LCM": [[3.5, 6.5]],                              // 왼쪽 중앙 미드필더
            "RCM": [[6.5, 6.5]],                              // 오른쪽 중앙 미드필더
            "RM":  [[8.5, 6.5]],                              // 오른쪽 미드필더
            "FW":  [[5, 9]]                                   // 최전방 스트라이커
        ],
        
        // 3-5-1-1: 3백 시스템의 4줄 포메이션
        "3-5-1-1": [
            "GK":  [[5, 1]],
            "DEF": [[2, 3], [5, 3], [8, 3]],                  // 백 3
            "MID": [[1, 5], [3, 5], [5, 5], [7, 5], [9, 5]],  // 미드필드 5명
            "CAM": [[5, 7.5]],                                // 중앙 공격형 미드필더
            "FW":  [[5, 9]]                                   // 최전방 스트라이커
        ],
        
        // 3-4-2-1: 현대적인 3백 시스템
        "3-4-2-1": [
            "GK":  [[5,1]],
            "DEF": [[2,3], [5,3], [8,3]],            // LCB-CB-RCB
            "MID": [[1,5], [4,5], [6,5], [9,5]],     // LWB-CM-CM-RWB
            "CAM": [[3,7], [7,7]],                   // ❗ 두 명 모두 커버
            "FW":  [[5,9]]                           // ST
        ],
        
        // 3-4-1-2: 공격적인 3백 시스템
        "3-4-1-2": [
            "GK":  [[5, 1]],
            "DEF": [[2, 3], [5, 3], [8, 3]],                  // 백 3
            "MID": [[1, 5.5], [3.5, 5.5], [6.5, 5.5], [9, 5.5]], // 미드필드 4명
            "CAM": [[5, 7.5]],                                // 중앙 공격형 미드필더
            "FW":  [[3.5, 9], [6.5, 9]]                       // 2명의 스트라이커
        ],
        
        // 3-1-4-2: 또 다른 3백 변형
        "3-1-4-2": [
            "GK":  [[5, 1]],
            "DEF": [[2, 3], [5, 3], [8, 3]],                  // 백 3
            "CDM": [[5, 4.5]],                                // 단일 수비형 미드필더
            "MID": [[1.5, 6.5], [3.5, 6.5], [6.5, 6.5], [8.5, 6.5]], // 미드필드 4명
            "FW":  [[3.5, 9], [6.5, 9]]                       // 2명의 스트라이커
        ]
    ]
// MARK: - Position → Group mapper
static func getPositionGroup(for position: String) -> String {
    let p = position.uppercased()
    // 간단하게 공백만 제거 (Swift 버전 호환성 문제로 인해 단순화)
    let compact = p

    // 1. Goalkeeper ----------------------------------------------------
    if compact == "G" || compact.contains("GK") || compact.contains("GOALKEEPER") {
        return "GK"
    }

    // 2. Defenders -----------------------------------------------------
    let defKw = ["D","CB","LB","RB","LWB","RWB","DEF","BACK",
                 "LEFTBACK","RIGHTBACK","CENTERBACK","CENTREBACK"]
    if defKw.contains(where: { compact.contains($0) }) {
        return "DEF"
    }

    // 3. Defensive‑mid (CDM) ------------------------------------------
    if compact.contains("CDM") || compact.contains("DMF") || compact == "DM" {
        return "CDM"
    }

    // 4. Attacking‑mid (CAM, AM, AMC, AML, AMR, LAM, RAM) -----------
    let camKw = ["CAM", "AMC", "AM", "AMF", "AML", "AMR", "LAM", "RAM"]
    if camKw.contains(where: { compact.contains($0) }) {
        return "CAM"
    }

    // 5. Generic midfield ---------------------------------------------
    let midKw = ["M","CM","CMF","LM","RM","MID","DM","B2B","MEZZALA"]
    if midKw.contains(where: { compact.contains($0) }) {
        return "MID"
    }

    // 6. Forwards / wingers -------------------------------------------
    let fwKw = ["F","FW","ST","CF","LW","RW","LF","RF",
                "STRIKER","FORWARD","WING","WINGER","WG","ATT"]
    if fwKw.contains(where: { compact.contains($0) }) {
        return "FW"
    }

    // Fallback --------------------------------------------------------
    return "MID"
}

    // MARK: - Coordinate helper
    /// Returns `(x, y)` grid coordinate for a player in the given formation,
    /// or `nil` if the formation / position / index combo is out of range.
    static func getPlayerPosition(formation: String,
                                  position: String,
                                  playerIndex: Int) -> (x: Double, y: Double)? {
        guard let group = formationData[formation]?[position],
              playerIndex < group.count else {
            return nil
        }
        let coord = group[playerIndex]
        return (x: coord[0], y: coord[1])
    }
}
