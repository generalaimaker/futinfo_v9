import SwiftUI
import Kingfisher

// Kingfisher 캐시 설정
extension KingfisherManager {
    static func setupCache() {
        // 디스크 캐시 설정 (30일 유지)
        ImageCache.default.diskStorage.config.expiration = .days(30)
        
        // 메모리 캐시 설정 (50MB 제한)
        ImageCache.default.memoryStorage.config.totalCostLimit = 1024 * 1024 * 50
        
        // 캐시 정책 설정
        ImageDownloader.default.downloadTimeout = 15.0 // 15초 타임아웃
        
        print("✅ Kingfisher 캐시 설정 완료: 디스크 캐시 30일, 메모리 캐시 50MB")
    }
    
    // 이미지 프리페치 메서드
    static func prefetchTeamLogos(urls: [URL]) {
        let prefetcher = ImagePrefetcher(urls: urls)
        prefetcher.start()
        print("✅ 팀 로고 프리페치 시작: \(urls.count)개")
    }
}

// 캐싱된 이미지 뷰 (Kingfisher 사용)
struct CachedImageView: View {
    let url: URL?
    let placeholder: Image
    let failureImage: Image
    let contentMode: SwiftUI.ContentMode
    
    init(url: URL?, placeholder: Image = Image(systemName: "photo"), failureImage: Image = Image(systemName: "exclamationmark.triangle"), contentMode: SwiftUI.ContentMode = SwiftUI.ContentMode.fit) {
        self.url = url
        self.placeholder = placeholder
        self.failureImage = failureImage
        self.contentMode = contentMode
    }
    
    var body: some View {
        if let url = url {
            KFImage(url)
                .setProcessor(DownsamplingImageProcessor(size: CGSize(width: 300, height: 300)))
                .cacheOriginalImage() // 원본 이미지 디스크에 저장
                .fade(duration: 0.25) // 부드러운 페이드 효과
                .placeholder {
                    placeholder
                        .resizable()
                        .aspectRatio(contentMode: contentMode)
                        .overlay(
                            ProgressView()
                                .progressViewStyle(CircularProgressViewStyle(tint: .gray))
                                .scaleEffect(0.7)
                        )
                }
                .onFailure { error in
                    print("⚠️ 이미지 로드 실패: \(url), 에러: \(error.localizedDescription)")
                }
                .resizable()
                .aspectRatio(contentMode: contentMode)
        } else {
            failureImage
                .resizable()
                .aspectRatio(contentMode: contentMode)
                .foregroundColor(.gray)
        }
    }
}

// 팀 로고 뷰
struct TeamLogoView: View {
    let logoUrl: String?
    let size: CGFloat
    
    var body: some View {
        CachedImageView(
            url: logoUrl != nil ? URL(string: logoUrl!) : nil,
            placeholder: Image(systemName: "sportscourt.fill"),
            failureImage: Image(systemName: "sportscourt.fill"),
            contentMode: SwiftUI.ContentMode.fit
        )
        .frame(width: size, height: size)
    }
}

// 리그 로고 뷰
struct LeagueLogoView: View {
    let logoUrl: String?
    let size: CGFloat
    
    var body: some View {
        CachedImageView(
            url: logoUrl != nil ? URL(string: logoUrl!) : nil,
            placeholder: Image(systemName: "trophy.fill"),
            failureImage: Image(systemName: "trophy.fill"),
            contentMode: SwiftUI.ContentMode.fit
        )
        .frame(width: size, height: size)
    }
}

// 트로피 이미지 뷰
struct TrophyImageView: View {
    let imageUrl: String?
    let size: CGFloat
    
    var body: some View {
        CachedImageView(
            url: imageUrl != nil ? URL(string: imageUrl!) : nil,
            placeholder: Image(systemName: "trophy.fill"),
            failureImage: Image(systemName: "trophy.fill"),
            contentMode: SwiftUI.ContentMode.fit
        )
        .frame(width: size, height: size)
    }
}