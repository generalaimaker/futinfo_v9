'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { 
  Search, 
  Newspaper, 
  ArrowRightLeft, 
  Settings, 
  UserCircle, 
  Bell,
  Menu,
  Trophy,
  Home,
  Globe,
  Users,
  Heart
} from 'lucide-react'
import { cn } from '@/lib/utils'

export function MainLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="px-4 lg:px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">FUTINFO</h1>
            </Link>

            {/* Search Bar - Desktop */}
            <form onSubmit={handleSearch} className="hidden md:flex items-center flex-1 max-w-md mx-8">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search teams, players..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 h-10 bg-gray-50 border-gray-200 focus:bg-white"
                />
              </div>
            </form>

            {/* Navigation - Desktop */}
            <nav className="hidden lg:flex items-center space-x-8">
              <Link
                href="/fixtures"
                className={cn(
                  "text-sm font-medium transition-colors hover:text-gray-900",
                  pathname === '/fixtures' ? 'text-gray-900' : 'text-gray-600'
                )}
              >
                Fixtures
              </Link>
              <Link
                href="/leagues"
                className={cn(
                  "text-sm font-medium transition-colors hover:text-gray-900",
                  pathname === '/leagues' ? 'text-gray-900' : 'text-gray-600'
                )}
              >
                Leagues
              </Link>
              <Link
                href="/teams"
                className={cn(
                  "text-sm font-medium transition-colors hover:text-gray-900",
                  pathname === '/teams' ? 'text-gray-900' : 'text-gray-600'
                )}
              >
                Teams
              </Link>
              <Link
                href="/news"
                className={cn(
                  "text-sm font-medium transition-colors hover:text-gray-900",
                  pathname === '/news' ? 'text-gray-900' : 'text-gray-600'
                )}
              >
                News
              </Link>
              <Link
                href="/transfers"
                className={cn(
                  "text-sm font-medium transition-colors hover:text-gray-900",
                  pathname === '/transfers' ? 'text-gray-900' : 'text-gray-600'
                )}
              >
                Transfers
              </Link>
              <Link
                href="/favorites"
                className={cn(
                  "text-sm font-medium transition-colors hover:text-gray-900",
                  pathname === '/favorites' ? 'text-gray-900' : 'text-gray-600'
                )}
              >
                Favorites
              </Link>
            </nav>

            {/* Right Actions */}
            <div className="flex items-center space-x-2 md:space-x-4">
              <Button variant="ghost" size="icon" className="hidden md:flex">
                <Settings className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" className="hidden md:flex">
                <Bell className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" className="hidden md:flex">
                <UserCircle className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Search className="h-5 w-5" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="lg:hidden"
                onClick={() => setMobileMenuOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent side="left" className="w-80">
          <SheetHeader>
            <SheetTitle className="text-left">Menu</SheetTitle>
          </SheetHeader>
          <nav className="mt-6 space-y-1">
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className={cn(
                "flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors",
                pathname === '/' ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50'
              )}
            >
              <Home className="h-5 w-5" />
              <span>Home</span>
            </Link>
            <Link
              href="/fixtures"
              onClick={() => setMobileMenuOpen(false)}
              className={cn(
                "flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors",
                pathname === '/fixtures' ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50'
              )}
            >
              <Trophy className="h-5 w-5" />
              <span>Fixtures</span>
            </Link>
            <Link
              href="/leagues"
              onClick={() => setMobileMenuOpen(false)}
              className={cn(
                "flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors",
                pathname === '/leagues' ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50'
              )}
            >
              <Globe className="h-5 w-5" />
              <span>Leagues</span>
            </Link>
            <Link
              href="/teams"
              onClick={() => setMobileMenuOpen(false)}
              className={cn(
                "flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors",
                pathname === '/teams' ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50'
              )}
            >
              <Users className="h-5 w-5" />
              <span>Teams</span>
            </Link>
            <Link
              href="/news"
              onClick={() => setMobileMenuOpen(false)}
              className={cn(
                "flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors",
                pathname === '/news' ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50'
              )}
            >
              <Newspaper className="h-5 w-5" />
              <span>News</span>
            </Link>
            <Link
              href="/transfers"
              onClick={() => setMobileMenuOpen(false)}
              className={cn(
                "flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors",
                pathname === '/transfers' ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50'
              )}
            >
              <ArrowRightLeft className="h-5 w-5" />
              <span>Transfers</span>
            </Link>
            <Link
              href="/favorites"
              onClick={() => setMobileMenuOpen(false)}
              className={cn(
                "flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors",
                pathname === '/favorites' ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50'
              )}
            >
              <Heart className="h-5 w-5" />
              <span>Favorites</span>
            </Link>
            <div className="border-t my-4"></div>
            <Link
              href="/settings"
              onClick={() => setMobileMenuOpen(false)}
              className={cn(
                "flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors",
                pathname === '/settings' ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50'
              )}
            >
              <Settings className="h-5 w-5" />
              <span>Settings</span>
            </Link>
          </nav>
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <main>{children}</main>
    </div>
  )
}