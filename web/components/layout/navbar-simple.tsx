'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { Calendar, Users, User, LogIn, LogOut, Settings, Heart, Trophy, Newspaper } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useSupabase } from '@/lib/supabase/provider'
import { CommunityService } from '@/lib/supabase/community'

export function Navbar() {
  const router = useRouter()
  const pathname = usePathname()
  const { user, signOut, isLoading: authLoading } = useSupabase()
  const [userProfile, setUserProfile] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [profileLoading, setProfileLoading] = useState(false)

  useEffect(() => {
    // authLoading이 끝났을 때만 프로필 로드
    if (!authLoading) {
      if (user) {
        loadUserProfile()
      } else {
        setUserProfile(null)
        setProfileLoading(false)
      }
    }
  }, [user, authLoading])

  const loadUserProfile = async () => {
    if (!user) {
      setProfileLoading(false)
      return
    }
    setProfileLoading(true)
    try {
      console.log('[Navbar] Loading user profile for:', user.id)
      const profile = await CommunityService.getCurrentUserProfile()
      console.log('[Navbar] Profile loaded:', profile)
      setUserProfile(profile)
    } catch (error) {
      console.error('[Navbar] Error loading user profile:', error)
      // 프로필이 없어도 사용자 정보는 표시
      setUserProfile(null)
    } finally {
      setProfileLoading(false)
    }
  }

  const handleSignOut = async () => {
    setLoading(true)
    try {
      await signOut()
      router.push('/')
    } catch (error) {
      console.error('Error signing out:', error)
    } finally {
      setLoading(false)
    }
  }

  const isActive = (path: string) => pathname === path

  return (
    <nav className="bg-white border-b shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">F</span>
            </div>
            <span className="text-xl font-bold text-gray-900">FutInfo</span>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-1">
            <Link href="/community">
              <Button 
                variant={isActive('/community') || isActive('/community/boards') ? 'default' : 'ghost'}
                size="sm"
                className="flex items-center space-x-2"
              >
                <Users className="h-4 w-4" />
                <span>락커룸</span>
              </Button>
            </Link>
            
            <Link href="/leagues">
              <Button 
                variant={isActive('/leagues') ? 'default' : 'ghost'}
                size="sm"
                className="flex items-center space-x-2"
              >
                <Trophy className="h-4 w-4" />
                <span>순위</span>
              </Button>
            </Link>
            
            <Link href="/">
              <Button 
                variant={isActive('/') ? 'default' : 'ghost'}
                size="sm"
                className="flex items-center space-x-2"
              >
                <Calendar className="h-4 w-4" />
                <span>일정</span>
              </Button>
            </Link>
            
            <Link href="/news">
              <Button 
                variant={isActive('/news') ? 'default' : 'ghost'}
                size="sm"
                className="flex items-center space-x-2"
              >
                <Newspaper className="h-4 w-4" />
                <span>뉴스</span>
              </Button>
            </Link>

            {user && userProfile?.favoriteTeamId && (
              <Link href={`/community/boards/team_${userProfile.favoriteTeamId}`}>
                <Button 
                  variant="ghost"
                  size="sm"
                  className="flex items-center space-x-2"
                >
                  <Heart className="h-4 w-4 text-red-500" />
                  <span>MY 팀</span>
                </Button>
              </Link>
            )}
          </div>

          {/* User Menu */}
          <div className="flex items-center space-x-2">
            {authLoading || profileLoading ? (
              // 로딩 중일 때 스피너 표시
              <div className="flex items-center space-x-2 px-3 py-2">
                <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
                <span className="text-sm text-gray-500">로딩중...</span>
              </div>
            ) : user ? (
              <div className="relative">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="flex items-center space-x-2"
                  onClick={() => setShowMenu(!showMenu)}
                >
                  <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                    {userProfile?.avatarUrl ? (
                      <img 
                        src={userProfile.avatarUrl} 
                        alt={userProfile.nickname}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <User className="h-4 w-4 text-gray-600" />
                    )}
                  </div>
                  <span className="hidden md:inline">{userProfile?.nickname || user.email?.split('@')[0] || '사용자'}</span>
                </Button>
                
                {/* Simple dropdown menu */}
                {showMenu && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border py-1">
                    <div className="px-4 py-2 border-b">
                      <p className="font-medium">{userProfile?.nickname || '사용자'}</p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                    </div>
                    <Link href="/profile">
                      <button className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center space-x-2">
                        <User className="h-4 w-4" />
                        <span>프로필</span>
                      </button>
                    </Link>
                    <Link href="/settings">
                      <button className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center space-x-2">
                        <Settings className="h-4 w-4" />
                        <span>설정</span>
                      </button>
                    </Link>
                    <div className="border-t my-1"></div>
                    <button 
                      onClick={handleSignOut}
                      disabled={loading}
                      className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center space-x-2 text-red-600"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>로그아웃</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link href="/auth/login">
                <Button size="sm" className="flex items-center space-x-2">
                  <LogIn className="h-4 w-4" />
                  <span>로그인</span>
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
      
      {/* Click outside to close menu */}
      {showMenu && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowMenu(false)}
        />
      )}
    </nav>
  )
}