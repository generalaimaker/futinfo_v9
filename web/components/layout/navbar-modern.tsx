'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { 
  Trophy, Calendar, Newspaper, Users, 
  Home, Search, Menu, X, ChevronDown,
  Shield, Star, TrendingUp, Globe,
  Moon, Sun, User, Settings, LogOut, LogIn
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useTheme } from '@/lib/theme-context'
import { useSupabase } from '@/lib/supabase/provider'
import { CommunityService } from '@/lib/supabase/community'

interface NavItem {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  badge?: string
}

const mainNavItems: NavItem[] = [
  { name: '홈', href: '/', icon: Home },
  { name: '순위', href: '/leagues', icon: Trophy },
  { name: '일정', href: '/fixtures', icon: Calendar },
  { name: '이적시장', href: '/transfer', icon: Globe },
  { name: '뉴스', href: '/news', icon: Newspaper },
  { name: '커뮤니티', href: '/community', icon: Users, badge: 'NEW' },
]

const popularLeagues = [
  { id: 39, name: 'Premier League', icon: '🇬🇧', logo: 'https://media.api-sports.io/football/leagues/39.png', count: '832' },
  { id: 140, name: 'La Liga', icon: '🇪🇸', logo: 'https://media.api-sports.io/football/leagues/140.png', count: '654' },
  { id: 135, name: 'Serie A', icon: '🇮🇹', logo: 'https://media.api-sports.io/football/leagues/135.png', count: '543' },
  { id: 78, name: 'Bundesliga', icon: '🇩🇪', logo: 'https://media.api-sports.io/football/leagues/78.png', count: '498' },
  { id: 61, name: 'Ligue 1', icon: '🇫🇷', logo: 'https://media.api-sports.io/football/leagues/61.png', count: '412' },
  { id: 2, name: 'Champions League', icon: '⭐', logo: 'https://media.api-sports.io/football/leagues/2.png', count: '1.2K' },
]

export function NavbarModern() {
  const pathname = usePathname()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [leaguesExpanded, setLeaguesExpanded] = useState(true)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [userProfile, setUserProfile] = useState<any>(null)
  const { theme, toggleTheme } = useTheme()
  const { user, session, signOut, isLoading } = useSupabase()
  
  // 디버그용 로그
  console.log('[NavbarModern] Current state - User:', user?.id, 'Session:', !!session, 'isLoading:', isLoading)

  useEffect(() => {
    console.log('[NavbarModern] Effect triggered - User:', user?.id, 'Session:', !!session, 'isLoading:', isLoading)
    if (user && !isLoading) {
      console.log('[NavbarModern] Loading user profile...')
      loadUserProfile()
    } else {
      setUserProfile(null)
    }
  }, [user, session, isLoading])

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
    try {
      await signOut()
      setShowUserMenu(false)
      router.push('/')
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  return (
    <>
      {/* Top Navigation Bar */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[hsl(var(--header-bg))] border-b border-border">
        <div className="flex items-center justify-between h-16 px-4">
          {/* Logo and Brand */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 rounded-lg hover:bg-secondary"
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-white font-bold text-lg">F</span>
              </div>
              <span className="text-xl font-bold hidden sm:inline">FutInfo</span>
            </Link>
          </div>

          {/* Center Navigation - Desktop */}
          <nav className="hidden lg:flex items-center gap-2">
            {mainNavItems.map((item) => {
              const isActive = pathname === item.href || 
                (item.href !== '/' && pathname.startsWith(item.href))
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                    isActive 
                      ? "bg-primary text-primary-foreground" 
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                  )}
                >
                  <item.icon className="w-4 h-4" />
                  <span>{item.name}</span>
                  {item.badge && (
                    <span className="ml-1 px-1.5 py-0.5 text-xs bg-red-500 text-white rounded">
                      {item.badge}
                    </span>
                  )}
                </Link>
              )
            })}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-3">
            <button className="p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground">
              <Search className="w-5 h-5" />
            </button>
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
              aria-label="테마 전환"
            >
              {theme === 'dark' ? (
                <Sun className="w-5 h-5" />
              ) : (
                <Moon className="w-5 h-5" />
              )}
            </button>
            
            {/* User Menu or Login Button */}
            {isLoading ? (
              <div className="p-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-900"></div>
              </div>
            ) : user ? (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-secondary transition-colors"
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
                  <span className="hidden md:inline text-sm font-medium">
                    {userProfile?.nickname || user.email?.split('@')[0] || '사용자'}
                  </span>
                </button>
                
                {/* Dropdown Menu */}
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-56 bg-background rounded-lg shadow-lg border py-1 z-50">
                    <div className="px-4 py-2 border-b">
                      <p className="font-medium">{userProfile?.nickname || '사용자'}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                    <Link href="/profile">
                      <button 
                        onClick={() => setShowUserMenu(false)}
                        className="w-full px-4 py-2 text-left hover:bg-secondary flex items-center gap-2"
                      >
                        <User className="h-4 w-4" />
                        <span>프로필</span>
                      </button>
                    </Link>
                    <Link href="/settings">
                      <button 
                        onClick={() => setShowUserMenu(false)}
                        className="w-full px-4 py-2 text-left hover:bg-secondary flex items-center gap-2"
                      >
                        <Settings className="h-4 w-4" />
                        <span>설정</span>
                      </button>
                    </Link>
                    <div className="border-t my-1"></div>
                    <button 
                      onClick={handleSignOut}
                      className="w-full px-4 py-2 text-left hover:bg-secondary flex items-center gap-2 text-red-600"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>로그아웃</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link href="/auth/login">
                <Button size="sm" className="flex items-center gap-2">
                  <LogIn className="h-4 w-4" />
                  <span>로그인</span>
                </Button>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Sidebar - Desktop */}
      <aside className={cn(
        "fixed left-0 top-16 bottom-0 w-64 bg-[hsl(var(--sidebar-bg))] border-r border-border overflow-y-auto transition-transform z-40",
        "hidden lg:block"
      )}>
        <div className="p-4 space-y-6">
          {/* Popular Leagues Section */}
          <div>
            <button
              onClick={() => setLeaguesExpanded(!leaguesExpanded)}
              className="flex items-center justify-between w-full text-sm font-semibold text-muted-foreground hover:text-foreground mb-3"
            >
              <span className="flex items-center gap-2">
                <Trophy className="w-4 h-4" />
                인기 리그
              </span>
              <ChevronDown className={cn(
                "w-4 h-4 transition-transform",
                leaguesExpanded && "rotate-180"
              )} />
            </button>
            
            {leaguesExpanded && (
              <div className="space-y-1">
                {popularLeagues.map((league) => (
                  <Link
                    key={league.id}
                    href={`/leagues/${league.id}`}
                    className="flex items-center justify-between p-2.5 rounded-lg hover:bg-secondary transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 flex items-center justify-center">
                        <Image
                          src={league.logo}
                          alt={league.name}
                          width={24}
                          height={24}
                          className="object-contain"
                        />
                      </div>
                      <span className="text-sm font-medium">{league.name}</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>


          {/* Featured Teams */}
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground mb-3">
              인기 팀
            </h3>
            <div className="space-y-1">
              {[
                { id: 33, name: 'Manchester United', logo: 'https://media.api-sports.io/football/teams/33.png' },
                { id: 40, name: 'Liverpool', logo: 'https://media.api-sports.io/football/teams/40.png' },
                { id: 50, name: 'Manchester City', logo: 'https://media.api-sports.io/football/teams/50.png' },
                { id: 49, name: 'Chelsea', logo: 'https://media.api-sports.io/football/teams/49.png' },
                { id: 42, name: 'Arsenal', logo: 'https://media.api-sports.io/football/teams/42.png' },
                { id: 47, name: 'Tottenham', logo: 'https://media.api-sports.io/football/teams/47.png' },
                { id: 541, name: 'Real Madrid', logo: 'https://media.api-sports.io/football/teams/541.png' },
                { id: 529, name: 'Barcelona', logo: 'https://media.api-sports.io/football/teams/529.png' },
                { id: 530, name: 'Atletico Madrid', logo: 'https://media.api-sports.io/football/teams/530.png' },
                { id: 157, name: 'Bayern Munich', logo: 'https://media.api-sports.io/football/teams/157.png' },
                { id: 165, name: 'Borussia Dortmund', logo: 'https://media.api-sports.io/football/teams/165.png' },
                { id: 496, name: 'Juventus', logo: 'https://media.api-sports.io/football/teams/496.png' },
                { id: 489, name: 'AC Milan', logo: 'https://media.api-sports.io/football/teams/489.png' },
                { id: 492, name: 'Inter Milan', logo: 'https://media.api-sports.io/football/teams/492.png' },
                { id: 85, name: 'Paris Saint-Germain', logo: 'https://media.api-sports.io/football/teams/85.png' },
              ].map((team) => (
                <Link
                  key={team.id}
                  href={`/teams/${team.id}`}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary transition-colors text-sm"
                >
                  <Image
                    src={team.logo}
                    alt={team.name}
                    width={20}
                    height={20}
                    className="object-contain"
                  />
                  <span className="font-medium">{team.name}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Sidebar */}
      <div className={cn(
        "fixed inset-0 z-50 lg:hidden",
        sidebarOpen ? "block" : "hidden"
      )}>
        <div 
          className="absolute inset-0 bg-black/50" 
          onClick={() => setSidebarOpen(false)}
        />
        <aside className="absolute left-0 top-0 bottom-0 w-64 bg-[hsl(var(--sidebar-bg))] border-r border-border overflow-y-auto">
          <div className="p-4">
            <div className="flex items-center justify-between mb-6">
              <Link href="/" className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                  <span className="text-white font-bold text-lg">F</span>
                </div>
                <span className="text-xl font-bold">FutInfo</span>
              </Link>
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-2 rounded-lg hover:bg-secondary"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mobile Navigation */}
            <nav className="space-y-1 mb-6">
              {mainNavItems.map((item) => {
                const isActive = pathname === item.href || 
                  (item.href !== '/' && pathname.startsWith(item.href))
                
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all",
                      isActive 
                        ? "bg-primary text-primary-foreground" 
                        : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                    )}
                  >
                    <item.icon className="w-5 h-5" />
                    <span>{item.name}</span>
                    {item.badge && (
                      <span className="ml-auto px-1.5 py-0.5 text-xs bg-red-500 text-white rounded">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                )
              })}
            </nav>

            {/* Popular Leagues - Mobile */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-muted-foreground">인기 리그</h3>
              <div className="space-y-1">
                {popularLeagues.slice(0, 5).map((league) => (
                  <Link
                    key={league.id}
                    href={`/leagues/${league.id}`}
                    onClick={() => setSidebarOpen(false)}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary transition-colors"
                  >
                    <span className="text-lg">{league.icon}</span>
                    <span className="text-sm">{league.name}</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </aside>
      </div>
      
      {/* Click outside to close user menu */}
      {showUserMenu && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowUserMenu(false)}
        />
      )}
    </>
  )
}