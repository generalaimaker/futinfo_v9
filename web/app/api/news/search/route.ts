import { NextRequest, NextResponse } from 'next/server'

// 샘플 뉴스 데이터
const ALL_NEWS = [
  {
    id: 'news1',
    title: '리버풀, 챔피언스리그서 레알 마드리드와 대결',
    description: '리버풀이 챔피언스리그 16강에서 레알 마드리드와 맞붙게 되었습니다.',
    url: 'https://example.com/news1',
    urlToImage: 'https://picsum.photos/400/300?random=1',
    publishedAt: new Date().toISOString(),
    source: { id: null, name: 'Sports News' }
  },
  {
    id: 'news2',
    title: '손흥민, 토트넘과 재계약 협상 진행 중',
    description: '손흥민이 토트넘과 재계약 협상을 진행 중인 것으로 알려졌습니다.',
    url: 'https://example.com/news2',
    urlToImage: 'https://picsum.photos/400/300?random=2',
    publishedAt: new Date(Date.now() - 3600000).toISOString(),
    source: { id: null, name: 'Football Daily' }
  },
  {
    id: 'news3',
    title: '맨체스터 시티, 프리미어리그 선두 유지',
    description: '맨체스터 시티가 최근 경기에서 승리하며 프리미어리그 선두를 유지했습니다.',
    url: 'https://example.com/news3',
    urlToImage: 'https://picsum.photos/400/300?random=3',
    publishedAt: new Date(Date.now() - 7200000).toISOString(),
    source: { id: null, name: 'Premier League News' }
  },
  {
    id: 'news4',
    title: '바르셀로나, 라리가에서 중요한 승리',
    description: '바르셀로나가 라리가 경기에서 중요한 승리를 거두며 순위를 끌어올렸습니다.',
    url: 'https://example.com/news4',
    urlToImage: 'https://picsum.photos/400/300?random=4',
    publishedAt: new Date(Date.now() - 10800000).toISOString(),
    source: { id: null, name: 'La Liga Today' }
  },
  {
    id: 'news5',
    title: '첼시, 새로운 공격수 영입 임박',
    description: '첼시가 겨울 이적시장에서 새로운 공격수 영입을 앞두고 있습니다.',
    url: 'https://example.com/news5',
    urlToImage: 'https://picsum.photos/400/300?random=5',
    publishedAt: new Date(Date.now() - 14400000).toISOString(),
    source: { id: null, name: 'Transfer News' }
  },
  {
    id: 'news6',
    title: 'PSG, 챔피언스리그 우승 목표',
    description: 'PSG가 이번 시즌 챔피언스리그 우승을 목표로 전력을 강화하고 있습니다.',
    url: 'https://example.com/news6',
    urlToImage: 'https://picsum.photos/400/300?random=6',
    publishedAt: new Date(Date.now() - 18000000).toISOString(),
    source: { id: null, name: 'Champions League News' }
  },
  {
    id: 'news7',
    title: '아스날, 젊은 선수들과 함께 미래 준비',
    description: '아스날이 젊은 선수들을 중심으로 팀을 재건하며 미래를 준비하고 있습니다.',
    url: 'https://example.com/news7',
    urlToImage: 'https://picsum.photos/400/300?random=7',
    publishedAt: new Date(Date.now() - 21600000).toISOString(),
    source: { id: null, name: 'Arsenal FC News' }
  },
  {
    id: 'news8',
    title: '레알 마드리드, 갈락티코 2.0 프로젝트',
    description: '레알 마드리드가 새로운 갈락티코 프로젝트를 추진하고 있습니다.',
    url: 'https://example.com/news8',
    urlToImage: 'https://picsum.photos/400/300?random=8',
    publishedAt: new Date(Date.now() - 25200000).toISOString(),
    source: { id: null, name: 'Real Madrid News' }
  }
]

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const query = searchParams.get('q')
  
  if (!query) {
    return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 })
  }

  try {
    // 검색어로 필터링
    const filteredNews = ALL_NEWS.filter(article => 
      article.title.toLowerCase().includes(query.toLowerCase()) ||
      article.description.toLowerCase().includes(query.toLowerCase())
    )

    // 검색 결과가 없으면 전체 뉴스 반환
    const results = filteredNews.length > 0 ? filteredNews : ALL_NEWS

    return NextResponse.json({ 
      articles: results,
      totalResults: results.length,
      status: 'ok'
    })
  } catch (error) {
    console.error('Error fetching news:', error)
    return NextResponse.json(
      { error: 'Failed to fetch news' },
      { status: 500 }
    )
  }
}