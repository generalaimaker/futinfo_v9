import { NextResponse } from 'next/server'

// 하드코딩된 샘플 뉴스 데이터 (실제 API 대체용)
const SAMPLE_NEWS = [
  {
    id: 'news1',
    title: '리버풀, 챔피언스리그서 레알 마드리드와 대결',
    description: '리버풀이 챔피언스리그 16강에서 레알 마드리드와 맞붙게 되었습니다. 양 팀의 격돌이 기대됩니다.',
    url: 'https://example.com/news1',
    urlToImage: 'https://picsum.photos/400/300?random=1',
    publishedAt: new Date().toISOString(),
    source: { id: null, name: 'Sports News' },
    author: 'Sports Reporter',
    content: null
  },
  {
    id: 'news2',
    title: '손흥민, 토트넘과 재계약 협상 진행 중',
    description: '손흥민이 토트넘과 재계약 협상을 진행 중인 것으로 알려졌습니다.',
    url: 'https://example.com/news2',
    urlToImage: 'https://picsum.photos/400/300?random=2',
    publishedAt: new Date(Date.now() - 3600000).toISOString(),
    source: { id: null, name: 'Football Daily' },
    author: 'John Doe',
    content: null
  },
  {
    id: 'news3',
    title: '맨체스터 시티, 프리미어리그 선두 유지',
    description: '맨체스터 시티가 최근 경기에서 승리하며 프리미어리그 선두를 유지했습니다.',
    url: 'https://example.com/news3',
    urlToImage: 'https://picsum.photos/400/300?random=3',
    publishedAt: new Date(Date.now() - 7200000).toISOString(),
    source: { id: null, name: 'Premier League News' },
    author: 'Jane Smith',
    content: null
  },
  {
    id: 'news4',
    title: '바르셀로나, 라리가에서 중요한 승리',
    description: '바르셀로나가 라리가 경기에서 중요한 승리를 거두며 순위를 끌어올렸습니다.',
    url: 'https://example.com/news4',
    urlToImage: 'https://picsum.photos/400/300?random=4',
    publishedAt: new Date(Date.now() - 10800000).toISOString(),
    source: { id: null, name: 'La Liga Today' },
    author: 'Carlos Martinez',
    content: null
  },
  {
    id: 'news5',
    title: '첼시, 새로운 공격수 영입 임박',
    description: '첼시가 겨울 이적시장에서 새로운 공격수 영입을 앞두고 있습니다.',
    url: 'https://example.com/news5',
    urlToImage: 'https://picsum.photos/400/300?random=5',
    publishedAt: new Date(Date.now() - 14400000).toISOString(),
    source: { id: null, name: 'Transfer News' },
    author: 'Mike Johnson',
    content: null
  },
  {
    id: 'news6',
    title: 'PSG, 챔피언스리그 우승 목표',
    description: 'PSG가 이번 시즌 챔피언스리그 우승을 목표로 전력을 강화하고 있습니다.',
    url: 'https://example.com/news6',
    urlToImage: 'https://picsum.photos/400/300?random=6',
    publishedAt: new Date(Date.now() - 18000000).toISOString(),
    source: { id: null, name: 'Champions League News' },
    author: 'Pierre Dupont',
    content: null
  },
  {
    id: 'news7',
    title: '아스날, 젊은 선수들과 함께 미래 준비',
    description: '아스날이 젊은 선수들을 중심으로 팀을 재건하며 미래를 준비하고 있습니다.',
    url: 'https://example.com/news7',
    urlToImage: 'https://picsum.photos/400/300?random=7',
    publishedAt: new Date(Date.now() - 21600000).toISOString(),
    source: { id: null, name: 'Arsenal FC News' },
    author: 'David Wilson',
    content: null
  },
  {
    id: 'news8',
    title: '유벤투스, 세리에A 타이틀 경쟁',
    description: '유벤투스가 세리에A 타이틀을 위해 치열한 경쟁을 펼치고 있습니다.',
    url: 'https://example.com/news8',
    urlToImage: 'https://picsum.photos/400/300?random=8',
    publishedAt: new Date(Date.now() - 25200000).toISOString(),
    source: { id: null, name: 'Serie A News' },
    author: 'Giuseppe Rossi',
    content: null
  },
  {
    id: 'news9',
    title: '도르트문트, 분데스리가 선두 추격',
    description: '보루시아 도르트문트가 분데스리가에서 바이에른 뮌헨을 추격하고 있습니다.',
    url: 'https://example.com/news9',
    urlToImage: 'https://picsum.photos/400/300?random=9',
    publishedAt: new Date(Date.now() - 28800000).toISOString(),
    source: { id: null, name: 'Bundesliga News' },
    author: 'Hans Mueller',
    content: null
  },
  {
    id: 'news10',
    title: '월드컵 예선, 각국 대표팀 준비 상황',
    description: '월드컵 예선을 앞두고 각국 대표팀들이 준비에 박차를 가하고 있습니다.',
    url: 'https://example.com/news10',
    urlToImage: 'https://picsum.photos/400/300?random=10',
    publishedAt: new Date(Date.now() - 32400000).toISOString(),
    source: { id: null, name: 'World Cup News' },
    author: 'International Reporter',
    content: null
  }
]

export async function GET() {
  try {
    // 샘플 데이터 반환
    return NextResponse.json({ 
      articles: SAMPLE_NEWS,
      totalResults: SAMPLE_NEWS.length,
      status: 'ok'
    })
  } catch (error) {
    console.error('Error fetching latest news:', error)
    return NextResponse.json(
      { error: 'Failed to fetch latest news' },
      { status: 500 }
    )
  }
}