import Foundation
import SwiftUI

/// 팀게시판 전용 오류 처리 및 복구 서비스
@MainActor
class TeamBoardErrorHandler: ObservableObject {
    static let shared = TeamBoardErrorHandler()
    
    // MARK: - Error States
    
    @Published var currentError: TeamBoardError?
    @Published var isRecovering = false
    @Published var recoveryAttempts: [Int: Int] = [:] // teamId별 복구 시도 횟수
    
    enum TeamBoardError: LocalizedError, Equatable {
        case networkFailure(teamId: Int, retryAfter: TimeInterval?)
        case apiKeyExpired
        case rateLimited(teamId: Int, retryAfter: TimeInterval)
        case dataCorrupted(teamId: Int)
        case serviceUnavailable(serviceName: String)
        case timeout(teamId: Int)
        case unknown(teamId: Int, message: String)
        
        var errorDescription: String? {
            switch self {
            case .networkFailure(let teamId, let retryAfter):
                if let retry = retryAfter {
                    return "팀 \(TeamBoardErrorHandler.getTeamName(teamId))의 정보를 불러올 수 없습니다. \(Int(retry))초 후 다시 시도됩니다."
                }
                return "팀 \(TeamBoardErrorHandler.getTeamName(teamId))의 정보를 불러올 수 없습니다. 네트워크를 확인해주세요."
                
            case .apiKeyExpired:
                return "API 인증이 만료되었습니다. 앱을 다시 시작해주세요."
                
            case .rateLimited(let teamId, let retryAfter):
                return "요청이 너무 많습니다. \(Int(retryAfter))초 후 팀 \(TeamBoardErrorHandler.getTeamName(teamId)) 정보가 자동으로 업데이트됩니다."
                
            case .dataCorrupted(let teamId):
                return "팀 \(TeamBoardErrorHandler.getTeamName(teamId))의 데이터에 오류가 있습니다. 캐시를 정리하고 다시 시도합니다."
                
            case .serviceUnavailable(let serviceName):
                return "\(serviceName) 서비스가 일시적으로 사용할 수 없습니다. 잠시 후 다시 시도해주세요."
                
            case .timeout(let teamId):
                return "팀 \(TeamBoardErrorHandler.getTeamName(teamId)) 정보 요청이 시간 초과되었습니다."
                
            case .unknown(let teamId, let message):
                return "팀 \(TeamBoardErrorHandler.getTeamName(teamId)): \(message)"
            }
        }
        
        var recoverable: Bool {
            switch self {
            case .networkFailure, .rateLimited, .timeout, .serviceUnavailable:
                return true
            case .apiKeyExpired, .dataCorrupted:
                return false
            case .unknown:
                return true
            }
        }
        
        var retryDelay: TimeInterval {
            switch self {
            case .networkFailure:
                return 5.0
            case .rateLimited(_, let retryAfter):
                return retryAfter
            case .timeout:
                return 3.0
            case .serviceUnavailable:
                return 10.0
            default:
                return 5.0
            }
        }
    }
    
    // MARK: - Properties
    
    private let maxRetryAttempts = 3
    private var retryTimers: [Int: Timer] = [:]
    
    private init() {}
    
    // MARK: - Public Methods
    
    /// 오류 처리 및 자동 복구 시작
    func handleError(_ error: Error, teamId: Int) async {
        let teamBoardError = mapToTeamBoardError(error, teamId: teamId)
        
        await MainActor.run {
            self.currentError = teamBoardError
        }
        
        print("❌ 팀게시판 오류 발생: \(teamBoardError.localizedDescription)")
        
        // 복구 가능한 오류면 자동 복구 시도
        if teamBoardError.recoverable {
            await attemptRecovery(for: teamBoardError, teamId: teamId)
        }
    }
    
    /// 수동 재시도
    func retryForTeam(_ teamId: Int) async {
        guard !isRecovering else { return }
        
        isRecovering = true
        defer { isRecovering = false }
        
        // 재시도 횟수 초기화
        recoveryAttempts[teamId] = 0
        
        do {
            _ = try await TeamBoardCacheService.shared.refreshTeamData(
                teamId: teamId,
                refreshStanding: true,
                refreshFixtures: true,
                refreshTransfers: false
            )
            
            print("✅ 팀 \(teamId) 수동 재시도 성공")
            clearError(for: teamId)
            
        } catch {
            await handleError(error, teamId: teamId)
        }
    }
    
    /// 특정 팀의 오류 상태 클리어
    func clearError(for teamId: Int? = nil) {
        if let teamId = teamId {
            if case .some(let currentError) = currentError,
               getTeamIdFromError(currentError) == teamId {
                self.currentError = nil
            }
            recoveryAttempts.removeValue(forKey: teamId)
            retryTimers[teamId]?.invalidate()
            retryTimers.removeValue(forKey: teamId)
        } else {
            currentError = nil
            recoveryAttempts.removeAll()
            retryTimers.values.forEach { $0.invalidate() }
            retryTimers.removeAll()
        }
    }
    
    /// 캐시 정리 및 강제 새로고침
    func clearCacheAndRefresh(teamId: Int) async {
        print("🧹 팀 \(teamId) 캐시 정리 및 강제 새로고침")
        
        // 캐시 정리
        TeamBoardCacheService.shared.clearCache(teamId: teamId)
        
        // 강제 새로고침
        await retryForTeam(teamId)
    }
    
    // MARK: - Private Methods
    
    private func mapToTeamBoardError(_ error: Error, teamId: Int) -> TeamBoardError {
        if let footballError = error as? FootballAPIError {
            switch footballError {
            case .rateLimitExceeded:
                return .rateLimited(teamId: teamId, retryAfter: 60)
            case .networkError:
                return .networkFailure(teamId: teamId, retryAfter: 5)
            case .invalidAPIKey:
                return .apiKeyExpired
            case .edgeFunctionError(_):
                return .serviceUnavailable(serviceName: "Supabase Edge Functions")
            default:
                return .unknown(teamId: teamId, message: footballError.localizedDescription)
            }
        }
        
        if let urlError = error as? URLError {
            switch urlError.code {
            case .notConnectedToInternet, .networkConnectionLost:
                return .networkFailure(teamId: teamId, retryAfter: nil)
            case .timedOut:
                return .timeout(teamId: teamId)
            default:
                return .networkFailure(teamId: teamId, retryAfter: 5)
            }
        }
        
        return .unknown(teamId: teamId, message: error.localizedDescription)
    }
    
    private func attemptRecovery(for error: TeamBoardError, teamId: Int) async {
        let currentAttempts = recoveryAttempts[teamId] ?? 0
        
        guard currentAttempts < maxRetryAttempts else {
            print("❌ 팀 \(teamId) 최대 재시도 횟수 초과")
            return
        }
        
        recoveryAttempts[teamId] = currentAttempts + 1
        
        let delay = error.retryDelay * Double(currentAttempts + 1) // 지수 백오프
        
        print("🔄 팀 \(teamId) 자동 복구 시도 \(currentAttempts + 1)/\(maxRetryAttempts) - \(delay)초 후")
        
        // 타이머로 지연된 재시도
        await MainActor.run {
            retryTimers[teamId] = Timer.scheduledTimer(withTimeInterval: delay, repeats: false) { [weak self] _ in
                Task {
                    await self?.performRecovery(teamId: teamId)
                }
            }
        }
    }
    
    private func performRecovery(teamId: Int) async {
        print("🔄 팀 \(teamId) 복구 시도 실행")
        
        do {
            isRecovering = true
            
            // 데이터 손상의 경우 캐시 정리
            if case .dataCorrupted = currentError {
                TeamBoardCacheService.shared.clearCache(teamId: teamId)
            }
            
            // 복구 시도
            _ = try await TeamBoardCacheService.shared.refreshTeamData(
                teamId: teamId,
                refreshStanding: true,
                refreshFixtures: true,
                refreshTransfers: false
            )
            
            print("✅ 팀 \(teamId) 자동 복구 성공")
            clearError(for: teamId)
            
        } catch {
            print("❌ 팀 \(teamId) 복구 실패: \(error)")
            await handleError(error, teamId: teamId)
        }
        
        isRecovering = false
    }
    
    private func getTeamIdFromError(_ error: TeamBoardError) -> Int {
        switch error {
        case .networkFailure(let teamId, _),
             .rateLimited(let teamId, _),
             .dataCorrupted(let teamId),
             .timeout(let teamId),
             .unknown(let teamId, _):
            return teamId
        default:
            return -1
        }
    }
    
    nonisolated static func getTeamName(_ teamId: Int) -> String {
        let teamNames: [Int: String] = [
            33: "맨유", 40: "리버풀", 42: "아스날", 47: "토트넘", 49: "첼시", 50: "맨시티",
            529: "바르셀로나", 530: "아틀레티코", 541: "레알 마드리드",
            489: "AC 밀란", 496: "유벤투스", 505: "인터",
            157: "바이에른", 165: "도르트문트", 168: "레버쿠젠",
            85: "PSG", 91: "릴", 81: "마르세유"
        ]
        return teamNames[teamId] ?? "Team \(teamId)"
    }
}

// MARK: - Error Banner Component

struct TeamBoardErrorBanner: View {
    let error: TeamBoardErrorHandler.TeamBoardError
    let onRetry: () -> Void
    let onDismiss: () -> Void
    
    var body: some View {
        HStack(spacing: 12) {
            // 오류 아이콘
            Image(systemName: errorIcon)
                .font(.title2)
                .foregroundColor(errorColor)
            
            VStack(alignment: .leading, spacing: 4) {
                Text("데이터 로드 실패")
                    .font(.headline)
                    .foregroundColor(.primary)
                
                Text(error.localizedDescription)
                    .font(.caption)
                    .foregroundColor(.secondary)
                    .lineLimit(2)
            }
            
            Spacer()
            
            // 재시도 버튼 (복구 가능한 경우)
            if error.recoverable {
                Button("재시도", action: onRetry)
                    .font(.caption)
                    .padding(.horizontal, 12)
                    .padding(.vertical, 6)
                    .background(errorColor)
                    .foregroundColor(.white)
                    .cornerRadius(8)
            }
            
            // 닫기 버튼
            Button(action: onDismiss) {
                Image(systemName: "xmark")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(color: errorColor.opacity(0.2), radius: 8, x: 0, y: 4)
        .overlay(
            RoundedRectangle(cornerRadius: 12)
                .stroke(errorColor.opacity(0.3), lineWidth: 1)
        )
        .padding(.horizontal)
    }
    
    private var errorIcon: String {
        switch error {
        case .networkFailure:
            return "wifi.exclamationmark"
        case .apiKeyExpired:
            return "key.slash"
        case .rateLimited:
            return "clock.arrow.circlepath"
        case .dataCorrupted:
            return "externaldrive.badge.xmark"
        case .serviceUnavailable:
            return "server.rack"
        case .timeout:
            return "timer.slash"
        case .unknown:
            return "exclamationmark.triangle"
        }
    }
    
    private var errorColor: Color {
        switch error {
        case .networkFailure, .timeout:
            return .orange
        case .apiKeyExpired, .dataCorrupted:
            return .red
        case .rateLimited:
            return .blue
        case .serviceUnavailable:
            return .purple
        case .unknown:
            return .gray
        }
    }
}