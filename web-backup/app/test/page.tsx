import { largeMockFixturesData } from '@/lib/supabase/largeMockData'

export default function TestPage() {
  return (
    <div style={{ padding: '20px', backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      <h1 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '20px', color: '#333' }}>
        FUTINFO - 축구 정보
      </h1>
      
      <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        <h2 style={{ fontSize: '24px', marginBottom: '16px', color: '#333' }}>
          오늘의 경기 ({largeMockFixturesData.results}개)
        </h2>
        
        {largeMockFixturesData.response.slice(0, 5).map((fixture) => (
          <div key={fixture.fixture.id} style={{ 
            padding: '16px', 
            marginBottom: '12px', 
            backgroundColor: '#f8f9fa',
            borderRadius: '6px',
            border: '1px solid #e9ecef'
          }}>
            <div style={{ marginBottom: '8px', color: '#666', fontSize: '14px' }}>
              {fixture.league.name} - {fixture.league.country}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: '500' }}>{fixture.teams.home.name}</span>
              <span style={{ margin: '0 16px', fontSize: '18px', fontWeight: 'bold' }}>
                {fixture.goals?.home ?? '-'} : {fixture.goals?.away ?? '-'}
              </span>
              <span style={{ fontWeight: '500' }}>{fixture.teams.away.name}</span>
            </div>
            <div style={{ marginTop: '8px', color: '#888', fontSize: '12px' }}>
              {fixture.fixture.status.long}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}