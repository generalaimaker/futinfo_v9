import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
}

// Mock news data - 실제로는 외부 API나 데이터베이스에서 가져와야 함
const mockNewsData = {
  general: [
    {
      id: '1',
      title: '맨체스터 유나이티드, 새로운 공격수 영입 임박',
      description: '맨유가 겨울 이적시장에서 대형 영입을 준비 중인 것으로 알려졌다.',
      url: 'https://www.skysports.com/football/news',
      source: 'Sky Sports',
      publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      category: 'general',
      trustScore: 85,
      imageUrl: 'https://media.api-sports.io/football/teams/33.png'
    },
    {
      id: '2',
      title: '리버풀, 리그 선두 유지하며 우승 경쟁 박차',
      description: '클롭 감독의 리버풀이 연승 행진을 이어가며 리그 정상을 지켰다.',
      url: 'https://www.bbc.com/sport/football',
      source: 'BBC Sport',
      publishedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      category: 'general',
      trustScore: 90,
      imageUrl: 'https://media.api-sports.io/football/teams/40.png'
    },
    {
      id: '3',
      title: '첼시, 새로운 감독 후보 물색 중',
      description: '첼시가 시즌 중반 감독 교체를 고려하고 있는 것으로 전해졌다.',
      url: 'https://www.theguardian.com/football',
      source: 'The Guardian',
      publishedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
      category: 'general',
      trustScore: 75,
      imageUrl: 'https://media.api-sports.io/football/teams/49.png'
    },
    {
      id: '4',
      title: '바르셀로나, 라리가 정상 탈환 노린다',
      description: '사비 감독의 바르셀로나가 레알 마드리드와의 격차를 좁히고 있다.',
      url: 'https://www.marca.com/futbol',
      source: 'Marca',
      publishedAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
      category: 'general',
      trustScore: 80,
      imageUrl: 'https://media.api-sports.io/football/teams/529.png'
    },
    {
      id: '5',
      title: '바이에른 뮌헨, 분데스리가 10연패 도전',
      description: '바이에른이 또 다시 분데스리가 우승을 향해 순항 중이다.',
      url: 'https://www.kicker.de/bundesliga',
      source: 'Kicker',
      publishedAt: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(),
      category: 'general',
      trustScore: 85,
      imageUrl: 'https://media.api-sports.io/football/teams/157.png'
    }
  ],
  transfer: [
    {
      id: '6',
      title: '음바페, 레알 마드리드 이적 초읽기',
      description: 'PSG의 스타 플레이어가 마침내 레알 마드리드로 이적할 전망이다.',
      url: 'https://www.lequipe.fr/Football',
      source: "L'Equipe",
      publishedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
      category: 'transfer',
      trustScore: 95,
      imageUrl: 'https://media.api-sports.io/football/teams/541.png'
    },
    {
      id: '7',
      title: '토트넘, 새로운 미드필더 영입 추진',
      description: '손흥민의 동료가 될 새로운 미드필더 영입이 임박했다.',
      url: 'https://www.football.london/tottenham',
      source: 'Football London',
      publishedAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
      category: 'transfer',
      trustScore: 70,
      imageUrl: 'https://media.api-sports.io/football/teams/47.png'
    }
  ],
  injury: [
    {
      id: '8',
      title: '맨시티 핵심 선수, 햄스트링 부상으로 4주 결장',
      description: '과르디올라 감독에게 악재가 계속되고 있다.',
      url: 'https://www.manchestereveningnews.co.uk/sport',
      source: 'Manchester Evening News',
      publishedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
      category: 'injury',
      trustScore: 80,
      imageUrl: 'https://media.api-sports.io/football/teams/50.png'
    }
  ]
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { category = 'general', onlyTier1 = false, minTrustScore = 0 } = await req.json()

    // 카테고리별 뉴스 필터링
    let articles = mockNewsData[category as keyof typeof mockNewsData] || mockNewsData.general

    // 신뢰도 점수 필터링
    if (minTrustScore > 0) {
      articles = articles.filter(article => article.trustScore >= minTrustScore)
    }

    // Tier 1 소스만 필터링 (trustScore 80 이상)
    if (onlyTier1) {
      articles = articles.filter(article => article.trustScore >= 80)
    }

    const response = {
      articles,
      count: articles.length,
      sources: new Set(articles.map(a => a.source)).size
    }

    return new Response(
      JSON.stringify(response),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})