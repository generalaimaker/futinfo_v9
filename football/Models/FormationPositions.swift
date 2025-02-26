import Foundation
import SwiftUI

// MARK: - Formation Positions
struct FormationPositions {
    // 포메이션별 포지션 좌표 데이터 (사용자 제공 데이터)
    static let formationData: [String: [String: [[Double]]]] = [
        // 3줄 포메이션 (GK-DEF-FW)
        "3-0-0": [
            "GK": [[5, 2]],
            "DEF": [[2.5, 4], [5, 4], [7.5, 4]],
            "FW": [[2.5, 9], [5, 9], [7.5, 9]]
        ],
        
        // 4줄 포메이션 (GK-DEF-MID-FW)
        "3-1-4-2": [
            "FW": [[3, 9], [7, 9]],
            "MID": [[1, 7], [4, 7], [6, 7], [9, 7]],
            "CDM": [[5, 6]],
            "DEF": [[2, 4], [5, 4], [8, 4]],
            "GK": [[5, 2]]
        ],
        "3-4-1-2": [
            "FW": [[3, 9], [7, 9]],
            "CAM": [[5, 8]],
            "MID": [[1, 7], [4, 7], [6, 7], [9, 7]],
            "DEF": [[2, 4], [5, 4], [8, 4]],
            "GK": [[5, 2]]
        ],
        "3-4-2-1": [
            "FW": [[5, 9]],
            "CAM": [[3, 8], [7, 8]],
            "MID": [[1, 7], [4, 7], [6, 7], [9, 7]],
            "DEF": [[2, 4], [5, 4], [8, 4]],
            "GK": [[5, 2]]
        ],
        "3-4-3": [
            "FW": [[2, 9], [5, 9], [8, 9]],
            "MID": [[1, 7], [4, 7], [6, 7], [9, 7]],
            "DEF": [[2, 4], [5, 4], [8, 4]],
            "GK": [[5, 2]]
        ],
        "3-5-1-1": [
            "FW": [[5, 9]],
            "CAM": [[5, 8]],
            "MID": [[1, 7], [3, 7], [5, 7], [7, 7], [9, 7]],
            "DEF": [[2, 4], [5, 4], [8, 4]],
            "GK": [[5, 2]]
        ],
        "3-5-2": [
            "FW": [[3, 9], [7, 9]],
            "MID": [[1, 7], [3, 7], [5, 7], [7, 7], [9, 7]],
            "DEF": [[2, 4], [5, 4], [8, 4]],
            "GK": [[5, 2]]
        ],
        
        // 5줄 포메이션 (GK-DEF-CDM-MID/CAM-FW)
        "4-1-2-1-2": [
            "FW": [[3, 9], [7, 9]],
            "CAM": [[5, 8]],
            "MID": [[3, 7], [7, 7]],
            "CDM": [[5, 6]],
            "DEF": [[1, 4], [4, 4], [6, 4], [9, 4]],
            "GK": [[5, 2]]
        ],
        "4-1-4-1": [
            "FW": [[5, 9]],
            "MID": [[1, 7], [3, 7], [7, 7], [9, 7]],
            "CDM": [[5, 6]],
            "DEF": [[1, 4], [4, 4], [6, 4], [9, 4]],
            "GK": [[5, 2]]
        ],
        "4-2-3-1": [
            "FW": [[5, 9]],
            "CAM": [[2, 8], [5, 8], [8, 8]],
            "CDM": [[3, 6], [7, 6]],
            "DEF": [[1, 4], [4, 4], [6, 4], [9, 4]],
            "GK": [[5, 2]]
        ],
        "4-2-4": [
            "FW": [[1, 9], [4, 9], [6, 9], [9, 9]],
            "MID": [[3, 7], [7, 7]],
            "DEF": [[1, 4], [4, 4], [6, 4], [9, 4]],
            "GK": [[5, 2]]
        ],
        "4-3-2-1": [
            "FW": [[5, 9]],
            "CAM": [[3, 8], [7, 8]],
            "MID": [[2, 7], [5, 7], [8, 7]],
            "DEF": [[1, 4], [4, 4], [6, 4], [9, 4]],
            "GK": [[5, 2]]
        ],
        "4-3-3": [
            "FW": [[2, 9], [5, 9], [8, 9]],
            "MID": [[2, 7], [5, 7], [8, 7]],
            "DEF": [[1, 4], [4, 4], [6, 4], [9, 4]],
            "GK": [[5, 2]]
        ],
        "4-4-1-1": [
            "FW": [[5, 9]],
            "CAM": [[5, 8]],
            "MID": [[1, 7], [3, 7], [7, 7], [9, 7]],
            "DEF": [[1, 4], [4, 4], [6, 4], [9, 4]],
            "GK": [[5, 2]]
        ],
        "4-4-2": [
            "FW": [[3, 9], [7, 9]],
            "MID": [[1, 7], [3, 7], [7, 7], [9, 7]],
            "DEF": [[1, 4], [4, 4], [6, 4], [9, 4]],
            "GK": [[5, 2]]
        ],
        "4-5-1": [
            "FW": [[5, 9]],
            "MID": [[1, 7], [3, 7], [5, 7], [7, 7], [9, 7]],
            "DEF": [[1, 4], [4, 4], [6, 4], [9, 4]],
            "GK": [[5, 2]]
        ],
        "5-3-2": [
            "FW": [[3, 9], [7, 9]],
            "MID": [[3, 7], [5, 7], [7, 7]],
            "DEF": [[1, 4], [3, 4], [5, 4], [7, 4], [9, 4]],
            "GK": [[5, 2]]
        ]
    ]
    
    // 포지션 약어를 포지션 그룹으로 변환
    static func getPositionGroup(for position: String) -> String {
        // 대소문자 구분 없이 처리하기 위해 소문자로 변환
        let pos = position.lowercased()
        
        // 포지션이 비어있거나 nil인 경우 처리
        if pos.isEmpty {
            return "MID" // 기본값
        }
        
        // 골키퍼
        if pos.contains("gk") || pos == "g" || pos == "goalkeeper" {
            return "GK"
        }
        
        // 수비수
        if pos.contains("cb") || pos.contains("lb") || pos.contains("rb") || 
           pos.contains("wb") || pos == "d" || pos.contains("def") ||
           pos.contains("back") {
            return "DEF"
        }
        
        // 수비적 미드필더 (CDM)
        if pos.contains("cdm") || pos.contains("dmf") || pos.contains("dm") || 
           (pos.contains("cm") && pos.contains("d")) ||
           pos.contains("defensive mid") || pos.contains("holding mid") {
            return "CDM"
        }
        
        // 공격적 미드필더 (CAM)
        if pos.contains("cam") || pos.contains("amf") || pos.contains("am") || 
           (pos.contains("cm") && pos.contains("a")) ||
           pos.contains("attacking mid") || pos.contains("offensive mid") {
            return "CAM"
        }
        
        // 일반 미드필더
        if pos.contains("cm") || pos.contains("lm") || pos.contains("rm") || 
           pos == "m" || pos.contains("mid") || pos.contains("cmf") ||
           pos.contains("central mid") {
            return "MID"
        }
        
        // 공격수
        if pos.contains("st") || pos.contains("cf") || pos.contains("lw") || 
           pos.contains("rw") || pos.contains("lf") || pos.contains("rf") || 
           pos == "f" || pos.contains("fw") || pos.contains("forward") ||
           pos.contains("striker") || pos.contains("wing") {
            return "FW"
        }
        
        // 기본값 - 첫 글자로 대략적인 포지션 추정
        if pos.hasPrefix("g") {
            return "GK"
        } else if pos.hasPrefix("d") {
            return "DEF"
        } else if pos.hasPrefix("m") {
            return "MID"
        } else if pos.hasPrefix("f") {
            return "FW"
        }
        
        // 완전히 알 수 없는 경우 미드필더로 기본 설정
        return "MID"
    }
    
    // 포메이션에 맞는 선수 위치 계산
    static func getPlayerPosition(formation: String, position: String, playerIndex: Int) -> (x: Double, y: Double)? {
        // 포메이션 데이터가 없는 경우 nil 반환
        guard let formationPositions = formationData[formation] else {
            return nil
        }
        
        // 포지션 그룹 가져오기
        let positionGroup = getPositionGroup(for: position)
        
        // 해당 포지션 그룹의 좌표 배열 가져오기
        if let positions = formationPositions[positionGroup], !positions.isEmpty {
            return getPositionFromGroup(positions, playerIndex)
        }
        
        // 해당 포지션 그룹이 없는 경우 유사한 그룹 찾기
        let fallbackGroups: [String: [String]] = [
            "CDM": ["MID", "CAM"],
            "CAM": ["MID", "FW"],
            "MID": ["CDM", "CAM"],
            "DEF": ["MID"],
            "FW": ["CAM", "MID"]
        ]
        
        if let alternatives = fallbackGroups[positionGroup] {
            for altGroup in alternatives {
                if let positions = formationPositions[altGroup], !positions.isEmpty {
                    print("⚠️ Using fallback position group \(altGroup) for \(positionGroup)")
                    return getPositionFromGroup(positions, playerIndex)
                }
            }
        }
        
        // 그래도 찾지 못한 경우 nil 반환
        print("❌ No position found for \(positionGroup) in formation \(formation)")
        return nil
    }
    
    // 포지션 그룹 내에서 인덱스에 맞는 위치 반환
    private static func getPositionFromGroup(_ positions: [[Double]], _ index: Int) -> (x: Double, y: Double)? {
        // 인덱스가 범위를 벗어나면 첫 번째 위치 반환
        let safeIndex = min(index, positions.count - 1)
        if safeIndex >= 0 {
            let position = positions[safeIndex]
            return (x: position[0], y: position[1])
        }
        return nil
    }
}
