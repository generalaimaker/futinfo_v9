import SwiftUI

// 이미지 캐싱을 위한 클래스
class ImageCache {
    static let shared = ImageCache()
    private let cache = NSCache<NSString, UIImage>()
    
    private init() {
        // 캐시 용량 설정
        cache.countLimit = 100 // 최대 100개 이미지 캐싱
        cache.totalCostLimit = 1024 * 1024 * 50 // 50MB 제한
    }
    
    func get(forKey key: String) -> UIImage? {
        return cache.object(forKey: key as NSString)
    }
    
    func set(_ image: UIImage, forKey key: String) {
        cache.setObject(image, forKey: key as NSString)
    }
}

// 이미지 로딩 상태
enum ImageLoadingState {
    case loading
    case success(UIImage)
    case failure
}

// 이미지 로더 클래스
class ImageLoader: ObservableObject {
    @Published var state: ImageLoadingState = .loading
    private var cancellable: URLSessionDataTask?
    private let url: URL
    
    init(url: URL) {
        self.url = url
        loadImage()
    }
    
    deinit {
        cancel()
    }
    
    func loadImage() {
        // 캐시에서 이미지 확인
        if let cachedImage = ImageCache.shared.get(forKey: url.absoluteString) {
            self.state = .success(cachedImage)
            return
        }
        
        // 캐시에 없으면 다운로드
        cancellable = URLSession.shared.dataTask(with: url) { [weak self] data, response, error in
            guard let self = self else { return }
            
            DispatchQueue.main.async {
                if let data = data, let image = UIImage(data: data) {
                    // 이미지 캐싱
                    ImageCache.shared.set(image, forKey: self.url.absoluteString)
                    self.state = .success(image)
                } else {
                    self.state = .failure
                }
            }
        }
        
        cancellable?.resume()
    }
    
    func cancel() {
        cancellable?.cancel()
    }
}

// 캐싱된 이미지 뷰
struct CachedImageView: View {
    @StateObject private var loader: ImageLoader
    let placeholder: Image
    let failureImage: Image
    let contentMode: ContentMode
    
    init(url: URL?, placeholder: Image = Image(systemName: "photo"), failureImage: Image = Image(systemName: "exclamationmark.triangle"), contentMode: ContentMode = .fit) {
        self.placeholder = placeholder
        self.failureImage = failureImage
        self.contentMode = contentMode
        
        // URL이 유효하지 않으면 로딩 실패 상태로 시작
        if let url = url {
            _loader = StateObject(wrappedValue: ImageLoader(url: url))
        } else {
            // 실패 상태를 가진 ImageLoader 생성
            let failureLoader = ImageLoader(url: URL(string: "https://invalid.url")!)
            failureLoader.state = .failure
            _loader = StateObject(wrappedValue: failureLoader)
        }
    }
    
    var body: some View {
        Group {
            switch loader.state {
            case .loading:
                placeholder
                    .resizable()
                    .aspectRatio(contentMode: contentMode)
                    .overlay(
                        ProgressView()
                            .progressViewStyle(CircularProgressViewStyle(tint: .gray))
                            .scaleEffect(0.7)
                    )
            case .success(let image):
                Image(uiImage: image)
                    .resizable()
                    .aspectRatio(contentMode: contentMode)
            case .failure:
                failureImage
                    .resizable()
                    .aspectRatio(contentMode: contentMode)
                    .foregroundColor(.gray)
            }
        }
    }
}

// 사용 예시
struct TeamLogoView: View {
    let logoUrl: String?
    let size: CGFloat
    
    var body: some View {
        CachedImageView(
            url: logoUrl != nil ? URL(string: logoUrl!) : nil,
            placeholder: Image(systemName: "sportscourt.fill"),
            failureImage: Image(systemName: "sportscourt.fill"),
            contentMode: .fit
        )
        .frame(width: size, height: size)
    }
}