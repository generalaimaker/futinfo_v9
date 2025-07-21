# iOS App Community (Locker Room) Feature Analysis

## Overview
The iOS app's community features are implemented with a focus on team-specific locker rooms, providing fans with dedicated spaces for discussion and interaction.

## 1. Core Community Views

### Main Views
- **CommunityView.swift**: Main community hub showing all boards and team-specific boards
- **TeamBoardView.swift**: Team-specific locker room with emotional team data and legends
- **PostListView.swift**: List of posts for a specific board
- **PostDetailView.swift**: Individual post view with comments
- **CreatePostView.swift**: Post creation interface
- **ProfileSetupView.swift**: User profile setup and team selection

### Enhanced Features
- **EnhancedCommunityView.swift**: Advanced community features (exists but not analyzed)

## 2. Data Models (CommunityModels.swift)

### Board Types
- `BoardType`: all (전체 게시판), team (팀 게시판)
- `CommunityBoard`: Board information with team association
- `CommunityPost`: Post structure with full metadata
- `CommunityComment`: Comment system with nested replies support
- `UserProfile`: User information with favorite team and badges
- `TeamBadgeInfo`: Team verification badges
- `CommunityNotification`: Notification system for interactions

### Additional Models
- Post categories: general, match, transfer, news, talk, media
- Pagination support via `PaginatedResponse`
- Board permissions system
- User badges and levels

## 3. ViewModels

### CommunityViewModel
- Manages board listings
- Handles team board grouping by leagues (5 major European leagues)
- Supports search functionality
- Real-time subscription setup

### PostListViewModel
- Manages posts for specific boards
- Pagination support (20 posts per page)
- Real-time updates for new posts and comments
- Handles post updates (likes, comments, views)

### PostDetailViewModel
- Single post management
- Comment loading and submission
- Like toggle functionality
- Real-time comment updates

### CreatePostViewModel
- Post creation with validation
- Image upload support (up to 5 images)
- Category selection for team boards
- Content validation via CommunityValidator

## 4. Service Layer

### SupabaseCommunityService (Main Service)
- **Authentication**: Sign in/out, user session management
- **Profile Management**: User profile CRUD operations
- **Board Management**: Load boards, team-specific boards
- **Post Operations**: Create, read, update posts
- **Comment System**: Create and load comments
- **Real-time Features**: WebSocket subscriptions for live updates
- **Image Upload**: Supports image uploads to Supabase storage
- **Permissions**: Board-specific permission checking

### Supporting Services
- **CommunityValidator**: Input validation for posts, comments, and images
- **TeamBoardBatchService**: Batch operations for team boards
- **TeamBoardCacheService**: Caching for performance
- **TeamBoardErrorHandler**: Error handling utilities

## 5. Real-time Features

### Implementation
- Uses Supabase Realtime V2 channels
- Subscribes to board-specific channels
- Monitors INSERT and UPDATE actions on posts table
- Monitors INSERT actions on comments table
- NotificationCenter for UI updates

### Real-time Events
- New posts in current board
- Post updates (likes, comments, views)
- New comments on posts
- Connection status tracking (disconnected, connecting, connected, reconnecting)

## 6. Navigation Flow

1. **Main Tab**: Community tab in ContentView.swift
2. **Board Selection**: 
   - All Board (전체 게시판)
   - My Team Board (if user has selected team)
   - Other Team Boards (grouped by leagues)
3. **Post Interaction**:
   - View posts → Post details → Comments
   - Create post (with auth check)
   - Like/bookmark posts
4. **Profile Setup**: Required for team-specific features

## 7. User Authentication Integration

### Features
- Apple Sign In support
- Google Sign In support
- Email/Password authentication
- Profile setup required after first login
- Team selection for locker room access
- Auth state persistence

### Profile Features
- Nickname (max 10 characters)
- Favorite team selection
- Team badge display
- User level system
- Post/comment count tracking

## 8. Team-Specific Features

### TeamBoardView Enhancements
- Team emotional data (colors, anthem, etc.)
- Team legends information
- Team standings integration
- Upcoming fixtures display
- Recent transfers section
- Category filtering (match, transfer, news, talk, media)
- Team-specific styling with primary colors

### Team Badge System
- Verified fan badges
- Team logo display in posts/comments
- Badge verification timestamps

## 9. Image Upload Support

### Implementation
- PhotosPicker integration for image selection
- Up to 5 images per post
- JPEG compression (0.8 quality)
- Supabase storage integration
- Unique file naming with timestamp and UUID
- Image preview in post creation
- Image display in posts

## 10. Missing Features Compared to Web

### Not Implemented in iOS
1. **Profile Management**:
   - No dedicated profile view page
   - No profile editing beyond initial setup
   - No user posts/comments history view
   - No profile statistics page

2. **Advanced Community Features**:
   - No search within boards
   - No post filtering by date/popularity
   - No post editing functionality
   - No post deletion by users
   - No report/flag system

3. **Social Features**:
   - No user following system
   - No direct messaging
   - No user mentions (@username)
   - No notification center view

4. **Content Management**:
   - No draft posts
   - No scheduled posts
   - No rich text editor
   - No markdown support

## 11. Implementation Status Summary

### ✅ Fully Implemented
- Board navigation and listing
- Post creation, viewing, listing
- Comment system
- Real-time updates
- Image uploads
- User authentication
- Team selection
- Basic like system
- Team-specific locker rooms

### ⚠️ Partially Implemented
- User profiles (setup only, no management)
- Notifications (backend only, no UI)
- Search (boards only, not posts)

### ❌ Not Implemented
- Profile management views
- Post editing/deletion
- Advanced filtering
- User activity history
- Rich content editing
- Social features (following, mentions)
- Moderation tools

## 12. Unique iOS Features

1. **Native UI Components**:
   - SwiftUI navigation
   - Native image picker
   - Haptic feedback
   - Pull-to-refresh

2. **Performance Optimizations**:
   - Lazy loading with LazyVStack
   - Image caching with Kingfisher
   - Efficient real-time subscriptions

3. **Team Experience**:
   - Emotional team data integration
   - Team-specific color themes
   - Legend player showcases

## Recommendations for Feature Parity

1. **High Priority**:
   - Add profile management views
   - Implement post editing/deletion
   - Add user activity history
   - Create notification center UI

2. **Medium Priority**:
   - Add search within posts
   - Implement rich text editing
   - Add post filtering options
   - Create user mention system

3. **Low Priority**:
   - Add draft system
   - Implement following system
   - Add moderation tools
   - Create analytics dashboard