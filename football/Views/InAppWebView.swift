import SwiftUI
import WebKit

struct InAppWebView: UIViewRepresentable {
    let url: URL
    @Binding var isLoading: Bool
    
    func makeUIView(context: Context) -> WKWebView {
        let webView = WKWebView()
        webView.navigationDelegate = context.coordinator
        webView.allowsBackForwardNavigationGestures = true
        return webView
    }
    
    func updateUIView(_ webView: WKWebView, context: Context) {
        let request = URLRequest(url: url)
        webView.load(request)
    }
    
    func makeCoordinator() -> Coordinator {
        Coordinator(self)
    }
    
    class Coordinator: NSObject, WKNavigationDelegate {
        var parent: InAppWebView
        
        init(_ parent: InAppWebView) {
            self.parent = parent
        }
        
        func webView(_ webView: WKWebView, didStartProvisionalNavigation navigation: WKNavigation!) {
            parent.isLoading = true
        }
        
        func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
            parent.isLoading = false
        }
        
        func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) {
            parent.isLoading = false
        }
    }
}

struct WebViewContainer: View {
    let url: URL
    @State private var isLoading = false
    @State private var webView: WKWebView?
    @Environment(\.dismiss) private var dismiss
    
    var body: some View {
        NavigationStack {
            ZStack {
                InAppWebView(url: url, isLoading: $isLoading)
                    .ignoresSafeArea()
                    .onAppear {
                        // WebView 인스턴스 저장을 위한 준비
                    }
                
                if isLoading {
                    ProgressView()
                        .progressViewStyle(CircularProgressViewStyle())
                        .scaleEffect(1.5)
                        .frame(maxWidth: .infinity, maxHeight: .infinity)
                        .background(Color.black.opacity(0.3))
                }
            }
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("닫기") {
                        dismiss()
                    }
                    .fontWeight(.medium)
                }
                
                ToolbarItem(placement: .principal) {
                    HStack(spacing: 20) {
                        Button(action: {
                            // 뒤로가기 기능은 WebView의 제스처로 지원됨
                        }) {
                            Image(systemName: "chevron.left")
                                .foregroundColor(.gray)
                        }
                        .disabled(true) // WebView 제스처 사용
                        
                        Button(action: {
                            // 앞으로가기 기능은 WebView의 제스처로 지원됨
                        }) {
                            Image(systemName: "chevron.right")
                                .foregroundColor(.gray)
                        }
                        .disabled(true) // WebView 제스처 사용
                        
                        Button(action: {
                            // 새로고침은 URL 재로드로 처리
                            NotificationCenter.default.post(name: NSNotification.Name("RefreshWebView"), object: nil)
                        }) {
                            Image(systemName: "arrow.clockwise")
                        }
                    }
                    .font(.system(size: 16))
                }
                
                ToolbarItem(placement: .navigationBarTrailing) {
                    ShareLink(item: url) {
                        Image(systemName: "square.and.arrow.up")
                    }
                }
            }
        }
    }
}