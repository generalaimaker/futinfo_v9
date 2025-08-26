import footballAPIService from '@/lib/supabase/football'

export default async function DebugPlayerPage({ params }: { params: { playerId: string } }) {
  const playerId = Number(params.playerId)
  
  // Get current season data
  const playerProfile = await footballAPIService.getPlayerProfile(playerId, 2025)
  
  if (!playerProfile || !playerProfile.statistics || playerProfile.statistics.length === 0) {
    return <div>No data</div>
  }
  
  // Get first statistics entry to see all available fields
  const stat = playerProfile.statistics[0]
  
  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold mb-4">Player Data Debug - {playerProfile.player.name}</h1>
      
      <div className="space-y-6">
        <div className="bg-white p-4 rounded shadow">
          <h2 className="font-bold mb-2">Player Info Fields:</h2>
          <pre className="text-xs overflow-auto">
            {JSON.stringify(playerProfile.player, null, 2)}
          </pre>
        </div>
        
        <div className="bg-white p-4 rounded shadow">
          <h2 className="font-bold mb-2">Statistics Fields (First Competition):</h2>
          <pre className="text-xs overflow-auto">
            {JSON.stringify(stat, null, 2)}
          </pre>
        </div>
        
        <div className="bg-white p-4 rounded shadow">
          <h2 className="font-bold mb-2">Specific Data Points:</h2>
          <ul className="text-sm space-y-1">
            <li>Games - Captain: {stat.games?.captain || 0}</li>
            <li>Games - Rating: {stat.games?.rating || 'N/A'}</li>
            <li>Shots - On target: {stat.shots?.on || 0}</li>
            <li>Shots - Total: {stat.shots?.total || 0}</li>
            <li>Goals - Conceded: {stat.goals?.conceded || 0}</li>
            <li>Goals - Saves: {stat.goals?.saves || 0}</li>
            <li>Passes - Key: {stat.passes?.key || 0}</li>
            <li>Passes - Accuracy: {stat.passes?.accuracy || 0}%</li>
            <li>Dribbles - Success: {stat.dribbles?.success || 0}</li>
            <li>Dribbles - Attempts: {stat.dribbles?.attempts || 0}</li>
            <li>Duels - Won: {stat.duels?.won || 0}</li>
            <li>Duels - Total: {stat.duels?.total || 0}</li>
            <li>Fouls - Drawn: {stat.fouls?.drawn || 0}</li>
            <li>Fouls - Committed: {stat.fouls?.committed || 0}</li>
            <li>Penalty - Won: {stat.penalty?.won || 0}</li>
            <li>Penalty - Scored: {stat.penalty?.scored || 0}</li>
            <li>Penalty - Missed: {stat.penalty?.missed || 0}</li>
            <li>Penalty - Saved: {stat.penalty?.saved || 0}</li>
          </ul>
        </div>
      </div>
    </div>
  )
}