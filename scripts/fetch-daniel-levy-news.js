const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://uutmymaxkkytibuiiaax.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV1dG15bWF4a2t5dGlidWlpYWF4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTg5NjMzNSwiZXhwIjoyMDY3NDcyMzM1fQ.gJTjwXwQFTSHjcrcJcn7-wK2Ak1lhH8eNydLOoJPb74'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Daniel Levy 관련 뉴스들
const danielLevyNews = [
  {
    title: "Daniel Levy: Tottenham executive chairman exits role after 24 years in charge",
    description: "Daniel Levy has left Tottenham after almost 25 years as executive chairman of the Premier League club.",
    url: "https://www.bbc.com/sport/football/articles/c9qng2rj38do",
    source: "BBC Sport",
    source_tier: 1,
    trust_score: 95,
    published_at: new Date('2025-09-04T12:00:00Z').toISOString(),
    image_url: "https://ichef.bbci.co.uk/news/1024/cpsprodpb/vivo/live/images/2025/9/4/6f8e5b0f-d8f5-40b5-84ae-e5b0f8e5f5b5.jpg",
    category: "general",
    is_breaking: true,
    is_featured: true,
    importance_score: 100,
    tags: ["tottenham", "daniel-levy", "chairman", "breaking"],
    collected_at: new Date().toISOString()
  },
  {
    title: "Levy Steps Down From Premier League Team Tottenham Hotspur",
    description: "Daniel Levy is stepping down from his role as executive chairman at English Premier League club Tottenham Hotspur after almost 25 years.",
    url: "https://www.bloomberg.com/news/articles/2025-09-04/levy-steps-down-from-premier-league-team-tottenham-hotspur",
    source: "Bloomberg",
    source_tier: 1,
    trust_score: 90,
    published_at: new Date('2025-09-04T11:30:00Z').toISOString(),
    image_url: null,
    category: "general",
    is_breaking: true,
    is_featured: true,
    importance_score: 95,
    tags: ["tottenham", "daniel-levy", "business"],
    collected_at: new Date().toISOString()
  },
  {
    title: "Tottenham chairman Levy steps down after nearly 25 years",
    description: "Tottenham Hotspur's long-serving executive chairman Daniel Levy is stepping down from his role after nearly 25 years, the Premier League club announced on Thursday.",
    url: "https://www.reuters.com/sports/soccer/tottenham-chairman-levy-steps-down-after-nearly-25-years-2025-09-04/",
    source: "Reuters",
    source_tier: 1,
    trust_score: 90,
    published_at: new Date('2025-09-04T11:00:00Z').toISOString(),
    image_url: null,
    category: "general",
    is_breaking: true,
    is_featured: true,
    importance_score: 95,
    tags: ["tottenham", "daniel-levy", "premier-league"],
    collected_at: new Date().toISOString()
  },
  {
    title: "What will be Levy's legacy as his Spurs era ends?",
    description: "Tottenham's success off the field under chairman Daniel Levy will always be overshadowed by failures on it, says chief football writer Phil McNulty.",
    url: "https://www.bbc.com/sport/football/articles/cn76l4z3m2mo",
    source: "BBC Sport",
    source_tier: 1,
    trust_score: 95,
    published_at: new Date('2025-09-04T14:00:00Z').toISOString(),
    image_url: null,
    category: "analysis",
    is_breaking: false,
    is_featured: true,
    importance_score: 85,
    tags: ["tottenham", "daniel-levy", "analysis"],
    collected_at: new Date().toISOString()
  },
  {
    title: "Daniel Levy steps down as Tottenham Hotspur chairman after nearly 25 years",
    description: "Levy first appointed as executive chairman at Spurs in 2000 and has stepped down after nearly 25 years in the role",
    url: "https://www.skysports.com/football/news/11675/13425060/daniel-levy-steps-down-as-tottenham-hotspur-chairman-after-25-years",
    source: "Sky Sports",
    source_tier: 1,
    trust_score: 90,
    published_at: new Date('2025-09-04T12:30:00Z').toISOString(),
    image_url: null,
    category: "general",
    is_breaking: true,
    is_featured: true,
    importance_score: 95,
    tags: ["tottenham", "daniel-levy", "breaking"],
    collected_at: new Date().toISOString()
  }
]

async function insertNews() {
  console.log('Inserting Daniel Levy news into database...')
  
  for (const article of danielLevyNews) {
    const { data, error } = await supabase
      .from('news_articles')
      .upsert(article, {
        onConflict: 'url',
        ignoreDuplicates: true
      })
      .select()
    
    if (error) {
      console.error('Error inserting:', article.title, error)
    } else {
      console.log('✅ Inserted:', article.title)
    }
  }
  
  console.log('Done!')
}

insertNews()