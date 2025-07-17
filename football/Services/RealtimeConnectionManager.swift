import Foundation
import UIKit
import Combine

@MainActor
class RealtimeConnectionManager: ObservableObject {
    static let shared = RealtimeConnectionManager()
    
    private let communityService = SupabaseCommunityService.shared
    private var cancellables = Set<AnyCancellable>()
    
    @Published var showConnectionStatus = false
    @Published var connectionStatusMessage = ""
    
    private init() {
        setupObservers()
        setupConnectionStatusObserver()
    }
    
    private func setupObservers() {
        // Listen for app lifecycle events
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(appDidEnterBackground),
            name: UIApplication.didEnterBackgroundNotification,
            object: nil
        )
        
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(appWillEnterForeground),
            name: UIApplication.willEnterForegroundNotification,
            object: nil
        )
        
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(appWillTerminate),
            name: UIApplication.willTerminateNotification,
            object: nil
        )
    }
    
    private func setupConnectionStatusObserver() {
        communityService.$realtimeConnectionStatus
            .receive(on: DispatchQueue.main)
            .sink { [weak self] status in
                self?.handleConnectionStatusChange(status)
            }
            .store(in: &cancellables)
    }
    
    private func handleConnectionStatusChange(_ status: RealtimeConnectionStatus) {
        connectionStatusMessage = status.displayText
        
        switch status {
        case .connecting, .reconnecting:
            showConnectionStatus = true
            // Hide after 5 seconds if still connecting
            DispatchQueue.main.asyncAfter(deadline: .now() + 5) { [weak self] in
                if case .connecting = status {
                    self?.showConnectionStatus = false
                }
            }
            
        case .connected:
            showConnectionStatus = true
            // Hide after 2 seconds when connected
            DispatchQueue.main.asyncAfter(deadline: .now() + 2) { [weak self] in
                self?.showConnectionStatus = false
            }
            
        case .error:
            showConnectionStatus = true
            // Hide after 5 seconds for errors
            DispatchQueue.main.asyncAfter(deadline: .now() + 5) { [weak self] in
                self?.showConnectionStatus = false
            }
            
        case .disconnected:
            showConnectionStatus = false
        }
    }
    
    @objc private func appDidEnterBackground() {
        print("📱 App entered background - managing realtime connections")
        communityService.handleApplicationDidEnterBackground()
    }
    
    @objc private func appWillEnterForeground() {
        print("📱 App will enter foreground - managing realtime connections")
        communityService.handleApplicationWillEnterForeground()
    }
    
    @objc private func appWillTerminate() {
        print("📱 App will terminate - cleaning up realtime connections")
        communityService.handleApplicationWillTerminate()
    }
    
    deinit {
        NotificationCenter.default.removeObserver(self)
        cancellables.removeAll()
    }
}