'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  ArrowRight, 
  MessageCircle,
  Eye,
  Clock,
  TrendingUp,
  Users
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'

interface CommunityPost {
  id: string
  title: string
  author: string
  teamId?: number
  teamName?: string
  views: number
  comments: number
  createdAt: string
}

interface Transfer {
  id: string
  playerName: string
  playerImage?: string
  from: string
  to: string
  fee: string
  date: string
}

export function RightSidebar() {
  const [activeTab, setActiveTab] = useState('hot')

  // Mock data
  const hotPosts: CommunityPost[] = [
    {
      id: '1',
      title: '손흥민 오늘 경기 미쳤다 ㄷㄷㄷ',
      author: 'SpursFan',
      teamId: 47,
      teamName: 'Tottenham',
      views: 15234,
      comments: 89,
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
    },
    {
      id: '2',
      title: 'K리그 이적시장 정리',
      author: 'K리그매니아',
      views: 8921,
      comments: 45,
      createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString()
    },
    {
      id: '3',
      title: '음바페 레알 마드리드 적응기',
      author: 'Madridista',
      teamId: 541,
      teamName: 'Real Madrid',
      views: 12456,
      comments: 67,
      createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString()
    }
  ]

  const topTransfers: Transfer[] = [
    {
      id: '1',
      playerName: 'Alvaro Carreras',
      from: 'Man United',
      to: 'Benfica',
      fee: '€50M',
      date: '2025-01-15'
    },
    {
      id: '2',
      playerName: 'Malik Tillman',
      from: 'Bayern',
      to: 'PSV',
      fee: '€35.1M',
      date: '2025-01-14'
    }
  ]

  return (
    <div className="w-full h-full bg-white border-l overflow-y-auto">
      <div className="p-4 space-y-6">
        {/* Community Hot Posts */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">Community</CardTitle>
              <Link href="/community">
                <Button variant="ghost" size="sm" className="h-7 text-xs">
                  View all
                  <ArrowRight className="ml-1 h-3 w-3" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2 h-8">
                <TabsTrigger value="hot" className="text-xs">인기</TabsTrigger>
                <TabsTrigger value="recent" className="text-xs">최신</TabsTrigger>
              </TabsList>
              <TabsContent value="hot" className="mt-3 space-y-3">
                {hotPosts.map((post) => (
                  <Link
                    key={post.id}
                    href={`/community/posts/${post.id}`}
                    className="block space-y-1 group"
                  >
                    <h4 className="text-sm font-medium line-clamp-2 group-hover:text-blue-600 transition-colors">
                      {post.title}
                    </h4>
                    <div className="flex items-center space-x-3 text-xs text-gray-500">
                      {post.teamName && (
                        <Badge variant="secondary" className="h-5 px-1.5">
                          {post.teamName}
                        </Badge>
                      )}
                      <span className="flex items-center">
                        <MessageCircle className="h-3 w-3 mr-1" />
                        {post.comments}
                      </span>
                      <span className="flex items-center">
                        <Eye className="h-3 w-3 mr-1" />
                        {post.views.toLocaleString()}
                      </span>
                    </div>
                  </Link>
                ))}
              </TabsContent>
              <TabsContent value="recent" className="mt-3 space-y-3">
                {/* 최신 게시글 */}
                <div className="text-sm text-gray-500 text-center py-4">
                  Loading recent posts...
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Top Transfers */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">Top transfers</CardTitle>
              <Link href="/transfers">
                <Button variant="ghost" size="sm" className="h-7 text-xs">
                  Transfer Center
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {topTransfers.map((transfer) => (
              <div key={transfer.id} className="space-y-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gray-200 rounded-full" />
                    <div>
                      <h4 className="text-sm font-medium">{transfer.playerName}</h4>
                      <div className="flex items-center space-x-1 text-xs text-gray-500">
                        <span>{transfer.from}</span>
                        <span>→</span>
                        <span>{transfer.to}</span>
                      </div>
                    </div>
                  </div>
                  <span className="text-sm font-semibold">{transfer.fee}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Predict Game */}
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">FutInfo Predict</CardTitle>
            <p className="text-xs text-gray-600">Make your predictions</p>
          </CardHeader>
          <CardContent>
            <div className="aspect-video bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
              <TrendingUp className="h-12 w-12 text-white" />
            </div>
            <Button className="w-full mt-3" size="sm">
              Start Predicting
            </Button>
          </CardContent>
        </Card>

        {/* Build Your XI */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Build your own XI</CardTitle>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full" size="sm">
              <Users className="h-4 w-4 mr-2" />
              Create Team
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}