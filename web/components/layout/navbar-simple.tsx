'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { Calendar, Users, User, LogIn, LogOut, Settings, Heart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useSupabase } from '@/lib/supabase/provider'
import { getUserProfile } from '@/lib/supabase/community'

export function Navbar() {
  const router = useRouter()
  const pathname = usePathname()
  const { user, signOut } = useSupabase()
  const [userProfile, setUserProfile] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [showMenu, setShowMenu] = useState(false)

  useEffect(() => {
    if (user) {
      loadUserProfile()
    } else {
      setUserProfile(null)
    }
  }, [user])

  const loadUserProfile = async () => {
    if (!user) return
    try {
      const profile = await getUserProfile(user.id)
      setUserProfile(profile)
    } catch (error) {
      console.error('Error loading user profile:', error)
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
            <Link href="/">
              <Button 
                variant={isActive('/') ? 'default' : 'ghost'}
                size="sm"
                className="flex items-center space-x-2"
              >
                <Calendar className="h-4 w-4" />
                <span>경기 일정</span>
              </Button>
            </Link>
            
            <Link href="/community">
              <Button 
                variant={isActive('/community') ? 'default' : 'ghost'}
                size="sm"
                className="flex items-center space-x-2"
              >
                <Users className="h-4 w-4" />
                <span>커뮤니티</span>
              </Button>
            </Link>

            {user && userProfile?.favoriteTeamId && (
              <Link href={`/community/boards/team-${userProfile.favoriteTeamId}`}>
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
            {user ? (
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
                  <span className="hidden md:inline">{userProfile?.nickname || '사용자'}</span>
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