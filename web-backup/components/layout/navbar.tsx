'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { 
  Calendar, Users, User, LogIn, LogOut, Settings, Heart, 
  MessageSquare, MessageCircle, Trophy, Edit, ChevronRight 
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useSupabase } from '@/lib/supabase/provider'
import { CommunityService } from '@/lib/supabase/community'

export function Navbar() {
  const router = useRouter()
  const pathname = usePathname()
  const { user, signOut } = useSupabase()
  const [userProfile, setUserProfile] = useState<any>(null)
  const [loading, setLoading] = useState(false)

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
      const profile = await CommunityService.getCurrentUserProfile()
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
              <Link href={`/community/boards/team_${userProfile.favoriteTeamId}`}>
                <Button 
                  variant={pathname.includes(`team_${userProfile.favoriteTeamId}`) ? 'default' : 'ghost'}
                  size="sm"
                  className="flex items-center space-x-2 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white"
                >
                  <Heart className="h-4 w-4 fill-current" />
                  <span>MY {userProfile.favoriteTeamName || '팀'}</span>
                </Button>
              </Link>
            )}
          </div>

          {/* User Menu */}
          <div className="flex items-center space-x-2">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="flex items-center space-x-2">
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
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64 z-50" sideOffset={5}>
                  <DropdownMenuLabel>
                    <div className="flex flex-col">
                      <span className="font-medium">{userProfile?.nickname || '사용자'}</span>
                      <span className="text-xs text-gray-500 font-normal">{user.email}</span>
                      {userProfile?.favoriteTeamName && (
                        <div className="flex items-center space-x-1 mt-1">
                          <Heart className="h-3 w-3 text-red-500" />
                          <span className="text-xs text-gray-600">{userProfile.favoriteTeamName} 팬</span>
                        </div>
                      )}
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  
                  {/* 프로필 관련 */}
                  <DropdownMenuItem 
                    className="cursor-pointer hover:bg-gray-100" 
                    onSelect={() => router.push('/profile')}
                  >
                    <User className="h-4 w-4 mr-2" />
                    내 프로필
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    className="cursor-pointer hover:bg-gray-100" 
                    onSelect={() => router.push('/profile/edit')}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    프로필 편집
                  </DropdownMenuItem>
                  
                  <DropdownMenuSeparator />
                  
                  {/* 내 활동 */}
                  <DropdownMenuItem 
                    className="cursor-pointer hover:bg-gray-100" 
                    onSelect={() => router.push('/profile/posts')}
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    내 게시글
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    className="cursor-pointer hover:bg-gray-100" 
                    onSelect={() => router.push('/profile/comments')}
                  >
                    <MessageCircle className="h-4 w-4 mr-2" />
                    내 댓글
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    className="cursor-pointer hover:bg-gray-100" 
                    onSelect={() => router.push('/favorites')}
                  >
                    <Heart className="h-4 w-4 mr-2" />
                    관심 목록
                  </DropdownMenuItem>
                  
                  <DropdownMenuSeparator />
                  
                  {/* 팀 관련 */}
                  {userProfile?.favoriteTeamId && (
                    <>
                      <DropdownMenuItem 
                        className="cursor-pointer hover:bg-gray-100" 
                        onSelect={() => router.push(`/community/boards/team_${userProfile.favoriteTeamId}`)}
                      >
                        <Trophy className="h-4 w-4 mr-2" />
                        {userProfile.favoriteTeamName} 게시판
                        <ChevronRight className="h-4 w-4 ml-auto" />
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                  )}
                  
                  {/* 설정 */}
                  <DropdownMenuItem 
                    className="cursor-pointer hover:bg-gray-100" 
                    onSelect={() => router.push('/settings')}
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    설정
                  </DropdownMenuItem>
                  
                  <DropdownMenuSeparator />
                  
                  <DropdownMenuItem 
                    className="cursor-pointer hover:bg-gray-100" 
                    onSelect={handleSignOut} 
                    disabled={loading}
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    로그아웃
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
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
    </nav>
  )
}