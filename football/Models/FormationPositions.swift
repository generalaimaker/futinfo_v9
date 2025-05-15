struct FormationPositions {
    /// Map of formation → position group → list of [x, y] coordinates.
    /// TODO: Populate with actual data. Leaving empty avoids compile‑time errors when
    /// FormationView looks up `formationData`.
    /// Pre‑computed coordinates for common formations on a 10 × 10 grid.
    /// Keys: formation string → position group → array of [x, y] points.
    static let formationData: [String: [String: [[Double]]]] = [
        "4-3-3": [
            "GK":  [[5, 1]],
            "DEF": [[1, 3], [3, 3], [7, 3], [9, 3]],          // LB‑LCB‑RCB‑RB
            "MID": [[2, 5], [5, 5], [8, 5]],                  // LCM‑CM‑RCM
            "FW":  [[2, 8], [5, 9], [8, 8]]                   // LW‑ST‑RW
        ],
        "4-2-3-1": [
            "GK":  [[5, 1]],
            "DEF": [[1, 3], [3, 3], [7, 3], [9, 3]],          // Back four
            "CDM": [[3, 5], [7, 5]],                          // Double pivot
            "CAM": [[2, 7], [5, 7], [8, 7]],                  // 3 attacking mids
            "FW":  [[5, 9]]                                   // Lone striker
        ],
        "3-4-2-1": [
            "GK":  [[5, 1]],
            "DEF": [[2, 3], [5, 3], [8, 3]],                  // LCB‑CB‑RCB
            "MID": [[1, 5], [4, 5], [6, 5], [9, 5]],          // Wing‑back + 2 CM + WB
            "CAM": [[4, 7], [6, 7]],                          // Two inside forwards
            "FW":  [[5, 9]]                                   // Central striker
        ]
    ]
// MARK: - Position → Group mapper
static func getPositionGroup(for position: String) -> String {
    let p = position.uppercased()
    let compact = p.replacingOccurrences(of: " ", with: "").replacingOccurrences(of: "-", with: "")

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

    // 4. Attacking‑mid (CAM) ------------------------------------------
    if compact.contains("CAM") || compact.contains("AMC") {
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
