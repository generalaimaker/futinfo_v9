import Foundation

// MARK: - Fixture 모델 확장
extension String {
    /// 경기 상태가 라이브 상태인지 확인
    var isLiveStatus: Bool {
        return ["1H", "2H", "HT", "ET", "P", "BT"].contains(self)
    }
}