# News Feature Fix Guide

## Problem Summary
The news feature was broken because:
1. The app was trying to call Supabase Edge Functions (`news-proxy` and `ai-proxy`) that didn't exist
2. The MultiSourceNewsCollector was failing to get authentication tokens properly
3. No fallback mechanism was in place when the edge functions failed

## Solutions Implemented

### 1. Created Missing Edge Functions
Created two new Edge Functions in `/supabase/functions/`:
- `news-proxy`: Fetches RSS feeds from BBC, Guardian, ESPN, and Sky Sports
- `ai-proxy`: Provides mock AI responses for news processing

### 2. Fixed Authentication Issues
Modified `MultiSourceNewsCollector.swift` to handle cases where there's no authenticated user:
```swift
if let session = try? await supabaseService.client.auth.session {
    request.setValue("Bearer \(session.accessToken)", forHTTPHeaderField: "Authorization")
} else {
    // Use the anon key directly if no session
    let anonKey = "your-anon-key"
    request.setValue("Bearer \(anonKey)", forHTTPHeaderField: "Authorization")
}
```

### 3. Added Fallback Mechanism
Modified `NewsView.swift` to fall back to RSS feeds when MultiSourceNewsCollector fails:
```swift
do {
    allRawNews = try await newsService.collectAllNews()
} catch {
    print("❌ MultiSourceNewsCollector failed, falling back to RSS: \(error)")
    // Fallback to RSS feeds directly
    let rssService = RSSNewsService.shared
    allRawNews = try await rssService.fetchAllRSSFeeds()
}
```

## Deployment Steps

1. **Deploy the Edge Functions:**
   ```bash
   cd /Users/hyunwoopark/Desktop/futinfo_v6/supabase
   ./deploy-functions.sh
   ```

2. **Test the News Feature:**
   - Open the app
   - Navigate to the News tab
   - The news should now load from RSS feeds

## Alternative Quick Fix
If Edge Functions deployment fails, you can modify the app to use RSS feeds directly:

1. Comment out the MultiSourceNewsCollector calls in `NewsView.swift`
2. Use RSSNewsService directly:
   ```swift
   let rssService = RSSNewsService.shared
   let allRawNews = try await rssService.fetchAllRSSFeeds()
   ```

## Future Improvements
1. Implement proper News API integration with API keys
2. Add caching to reduce API calls
3. Implement proper error handling and user feedback
4. Add more news sources