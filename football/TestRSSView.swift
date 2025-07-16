import SwiftUI
import Foundation

struct TestRSSView: View {
    @State private var testResults: [String] = []
    @State private var isLoading = false
    
    var body: some View {
        NavigationView {
            VStack(spacing: 20) {
                Button("Test BBC Sport RSS") {
                    Task {
                        await testBBCRSS()
                    }
                }
                .buttonStyle(.borderedProminent)
                .disabled(isLoading)
                
                Button("Test FootballRSSService") {
                    Task {
                        await testFootballRSSService()
                    }
                }
                .buttonStyle(.borderedProminent)
                .disabled(isLoading)
                
                if isLoading {
                    ProgressView("Testing RSS feeds...")
                        .padding()
                }
                
                List(testResults, id: \.self) { result in
                    Text(result)
                        .font(.caption)
                        .padding(.vertical, 2)
                }
            }
            .navigationTitle("RSS Test")
            .padding()
        }
    }
    
    private func testBBCRSS() async {
        isLoading = true
        testResults.append("🔄 Testing BBC Sport RSS...")
        
        do {
            guard let url = URL(string: "https://feeds.bbci.co.uk/sport/football/rss.xml") else {
                testResults.append("❌ Invalid BBC RSS URL")
                isLoading = false
                return
            }
            
            let (data, response) = try await URLSession.shared.data(from: url)
            
            if let httpResponse = response as? HTTPURLResponse {
                testResults.append("✅ HTTP Status: \(httpResponse.statusCode)")
            }
            
            let dataSize = data.count
            testResults.append("✅ Data received: \(dataSize) bytes")
            
            // Try to parse as string to see if it's XML
            if let xmlString = String(data: data, encoding: .utf8) {
                let firstLine = xmlString.components(separatedBy: .newlines).first ?? ""
                testResults.append("✅ First line: \(firstLine)")
                
                if xmlString.contains("<rss") {
                    testResults.append("✅ Valid RSS XML detected")
                } else {
                    testResults.append("⚠️ Not RSS format")
                }
            }
            
        } catch {
            testResults.append("❌ Error: \(error.localizedDescription)")
        }
        
        isLoading = false
    }
    
    private func testFootballRSSService() async {
        isLoading = true
        testResults.append("🔄 Testing FootballRSSService...")
        
        do {
            let rssService = FootballRSSService.shared
            let news = try await rssService.fetchNews(category: .general)
            
            testResults.append("✅ Fetched \(news.count) news items")
            
            if let firstNews = news.first {
                testResults.append("✅ First title: \(firstNews.title)")
                testResults.append("✅ Source: \(firstNews.source)")
                testResults.append("✅ Reliability: \(firstNews.reliability)")
            }
            
        } catch {
            testResults.append("❌ FootballRSSService error: \(error.localizedDescription)")
        }
        
        isLoading = false
    }
}

#Preview {
    TestRSSView()
}