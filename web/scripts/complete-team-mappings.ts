// Script to achieve 100% team mapping coverage for all 5 major leagues
// Strategy: Fetch all teams from both APIs for each league and match them systematically

import { MATCHED_TEAMS } from '../lib/data/team-id-mapping';

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY || 'bd09a1efecmshf47e95710709f44p1dcafdjsn072eabc66aa4';

// Known manual mappings for teams that are hard to auto-match
const MANUAL_MAPPINGS: Record<string, Record<string, number>> = {
  // Serie A teams that need manual mapping
  'Lazio': { apiFootball: 487, freeApi: 0 }, // Need to find
  'AC Milan': { apiFootball: 489, freeApi: 0 },
  'Inter': { apiFootball: 505, freeApi: 0 },
  'Napoli': { apiFootball: 492, freeApi: 0 },
  'Roma': { apiFootball: 497, freeApi: 0 },
  'Bologna': { apiFootball: 500, freeApi: 0 },
  'Fiorentina': { apiFootball: 502, freeApi: 0 },
  'Torino': { apiFootball: 503, freeApi: 0 },
  'Genoa': { apiFootball: 495, freeApi: 0 },
  'Verona': { apiFootball: 504, freeApi: 0 },
  'Empoli': { apiFootball: 511, freeApi: 0 },
  'Monza': { apiFootball: 1579, freeApi: 0 },
  'Cagliari': { apiFootball: 490, freeApi: 0 },
  'Sassuolo': { apiFootball: 488, freeApi: 0 },
  'Sampdoria': { apiFootball: 498, freeApi: 0 },
  'Lecce': { apiFootball: 867, freeApi: 0 },
  'Salernitana': { apiFootball: 514, freeApi: 0 },
  'Frosinone': { apiFootball: 512, freeApi: 0 },
  'Venezia': { apiFootball: 517, freeApi: 0 },
  'Como': { apiFootball: 515, freeApi: 0 },
  'Parma': { apiFootball: 521, freeApi: 0 },
  
  // Bundesliga teams
  'Borussia Dortmund': { apiFootball: 165, freeApi: 9789 }, // Already found
  'Bayer Leverkusen': { apiFootball: 168, freeApi: 8178 }, // Already found
  'Eintracht Frankfurt': { apiFootball: 169, freeApi: 9810 }, // Already found
  'Borussia Monchengladbach': { apiFootball: 163, freeApi: 0 },
  'Union Berlin': { apiFootball: 159, freeApi: 0 },
  'FC Koln': { apiFootball: 158, freeApi: 0 },
  'Bochum': { apiFootball: 192, freeApi: 0 },
  'Heidenheim': { apiFootball: 171, freeApi: 0 },
  'Darmstadt': { apiFootball: 166, freeApi: 0 },
  'Holstein Kiel': { apiFootball: 175, freeApi: 8150 }, // Found but was wrongly assigned to St Pauli
  'St Pauli': { apiFootball: 191, freeApi: 0 }, // Need correct ID
  
  // La Liga teams
  'Osasuna': { apiFootball: 727, freeApi: 0 },
  'Alaves': { apiFootball: 542, freeApi: 0 },
  'Real Valladolid': { apiFootball: 720, freeApi: 0 },
  'Las Palmas': { apiFootball: 715, freeApi: 0 },
  'Almeria': { apiFootball: 723, freeApi: 0 },
  'Cadiz': { apiFootball: 724, freeApi: 0 },
  'Leganes': { apiFootball: 539, freeApi: 0 },
  
  // Ligue 1 teams
  'Paris Saint-Germain': { apiFootball: 85, freeApi: 0 },
  'Reims': { apiFootball: 93, freeApi: 0 },
  'Brest': { apiFootball: 106, freeApi: 0 },
  'Strasbourg': { apiFootball: 93, freeApi: 0 },
  'Lorient': { apiFootball: 97, freeApi: 0 },
  'Clermont': { apiFootball: 99, freeApi: 0 },
  'Angers': { apiFootball: 77, freeApi: 0 }, // Need correct ID (not Rangers)
  'Saint-Etienne': { apiFootball: 1063, freeApi: 0 },
};

// Method 1: Search by team name in all recent transfers
async function findTeamBySearchingTransfers(teamName: string, leagueId: string) {
  try {
    const response = await fetch(
      `https://free-api-live-football-data.p.rapidapi.com/football-get-all-transfers?page=1`,
      {
        headers: {
          'X-RapidAPI-Key': RAPIDAPI_KEY,
          'X-RapidAPI-Host': 'free-api-live-football-data.p.rapidapi.com',
        },
      }
    );
    
    if (!response.ok) return null;
    
    const data = await response.json();
    const transfers = data?.response?.transfers || data?.response || data || [];
    
    const teamIds = new Set<number>();
    const normalizedSearch = teamName.toLowerCase().replace(/[^a-z0-9]/g, '');
    
    if (Array.isArray(transfers)) {
      transfers.forEach((transfer: any) => {
        const fromClub = (transfer.fromClub || '').toLowerCase().replace(/[^a-z0-9]/g, '');
        const toClub = (transfer.toClub || '').toLowerCase().replace(/[^a-z0-9]/g, '');
        
        if (fromClub.includes(normalizedSearch) || normalizedSearch.includes(fromClub)) {
          teamIds.add(transfer.fromClubId);
        }
        if (toClub.includes(normalizedSearch) || normalizedSearch.includes(toClub)) {
          teamIds.add(transfer.toClubId);
        }
      });
    }
    
    return Array.from(teamIds)[0] || null;
  } catch (error) {
    console.error(`Error searching for ${teamName}:`, error);
    return null;
  }
}

// Method 2: Use league standings to get all teams
async function getTeamsFromLeagueStandings(leagueId: number) {
  try {
    const response = await fetch(
      `https://api-football-v1.p.rapidapi.com/v3/standings?league=${leagueId}&season=2024`,
      {
        headers: {
          'x-rapidapi-key': RAPIDAPI_KEY,
          'x-rapidapi-host': 'api-football-v1.p.rapidapi.com',
        },
      }
    );
    
    if (!response.ok) return [];
    
    const data = await response.json();
    const standings = data?.response?.[0]?.league?.standings?.[0] || [];
    
    return standings.map((team: any) => ({
      id: team.team.id,
      name: team.team.name,
      logo: team.team.logo,
    }));
  } catch (error) {
    console.error(`Error fetching standings for league ${leagueId}:`, error);
    return [];
  }
}

// Method 3: Try multiple search variations
function generateSearchVariations(teamName: string): string[] {
  const variations = [teamName];
  
  // Remove common prefixes/suffixes
  const cleanName = teamName
    .replace(/^(FC|CF|AC|AS|SS|SC|VfL|VfB|RB|FSV|TSG|1899|1\.)\s+/i, '')
    .replace(/\s+(FC|CF|AC|AS|SS|SC)$/i, '');
  
  if (cleanName !== teamName) {
    variations.push(cleanName);
  }
  
  // Add city name only (for teams like "Manchester United" -> "Manchester")
  const words = teamName.split(' ');
  if (words.length > 1) {
    variations.push(words[0]);
    variations.push(words[words.length - 1]);
  }
  
  // Special cases
  const specialCases: Record<string, string[]> = {
    'Paris Saint-Germain': ['PSG', 'Paris SG', 'Paris', 'Saint-Germain'],
    'Borussia Monchengladbach': ['Gladbach', 'M\'gladbach', 'Monchengladbach', 'BMG'],
    'Borussia Dortmund': ['Dortmund', 'BVB', 'Borussia Dortmund'],
    'Bayer Leverkusen': ['Leverkusen', 'Bayer 04'],
    'AC Milan': ['Milan', 'AC Milan', 'ACM'],
    'Inter': ['Inter Milan', 'Internazionale', 'Inter'],
    'Roma': ['AS Roma', 'Roma', 'ASR'],
  };
  
  const found = Object.entries(specialCases).find(([key]) => 
    teamName.toLowerCase().includes(key.toLowerCase())
  );
  
  if (found) {
    variations.push(...found[1]);
  }
  
  return [...new Set(variations)];
}

// Method 4: Cross-reference with player transfers
async function findTeamByPlayerTransfers(apiFootballTeamId: number) {
  try {
    // Get recent transfers from api-football
    const response = await fetch(
      `https://api-football-v1.p.rapidapi.com/v3/transfers?team=${apiFootballTeamId}`,
      {
        headers: {
          'x-rapidapi-key': RAPIDAPI_KEY,
          'x-rapidapi-host': 'api-football-v1.p.rapidapi.com',
        },
      }
    );
    
    if (!response.ok) return null;
    
    const data = await response.json();
    const transfers = data?.response || [];
    
    if (transfers.length > 0) {
      const playerName = transfers[0]?.player?.name;
      if (playerName) {
        // Search for this player in free-api transfers
        const freeApiResponse = await fetch(
          `https://free-api-live-football-data.p.rapidapi.com/football-get-all-transfers`,
          {
            headers: {
              'X-RapidAPI-Key': RAPIDAPI_KEY,
              'X-RapidAPI-Host': 'free-api-live-football-data.p.rapidapi.com',
            },
          }
        );
        
        if (freeApiResponse.ok) {
          const freeApiData = await freeApiResponse.json();
          const freeTransfers = freeApiData?.response?.transfers || freeApiData?.response || [];
          
          const matchingTransfer = freeTransfers.find((t: any) => 
            t.name?.toLowerCase().includes(playerName.toLowerCase())
          );
          
          if (matchingTransfer) {
            // Return the team ID that matches the api-football team
            return matchingTransfer.toClubId || matchingTransfer.fromClubId;
          }
        }
      }
    }
    
    return null;
  } catch (error) {
    console.error(`Error finding team by player transfers:`, error);
    return null;
  }
}

// Main function to complete all mappings
async function completeAllMappings() {
  console.log('Starting comprehensive team mapping...\n');
  console.log('=' .repeat(80));
  
  const leagues = [
    { id: 39, name: 'Premier League', freeApiId: '47' },
    { id: 140, name: 'La Liga', freeApiId: '87' },
    { id: 135, name: 'Serie A', freeApiId: '71' },
    { id: 78, name: 'Bundesliga', freeApiId: '54' },
    { id: 61, name: 'Ligue 1', freeApiId: '53' },
  ];
  
  const completeMappings: Record<number, number> = { ...MATCHED_TEAMS };
  const unmappedTeams: any[] = [];
  
  for (const league of leagues) {
    console.log(`\nProcessing ${league.name}...`);
    
    // Get all teams from league standings
    const teams = await getTeamsFromLeagueStandings(league.id);
    console.log(`Found ${teams.length} teams in ${league.name}`);
    
    for (const team of teams) {
      // Skip if already mapped
      if (completeMappings[team.id]) {
        console.log(`✅ ${team.name} already mapped`);
        continue;
      }
      
      console.log(`🔍 Searching for ${team.name}...`);
      
      // Try multiple methods to find the team
      let freeApiId = null;
      
      // Method 1: Search by name variations
      const variations = generateSearchVariations(team.name);
      for (const variation of variations) {
        freeApiId = await findTeamBySearchingTransfers(variation, league.freeApiId);
        if (freeApiId) {
          console.log(`  Found via search: ${variation} -> ${freeApiId}`);
          break;
        }
      }
      
      // Method 2: Cross-reference by player transfers
      if (!freeApiId) {
        freeApiId = await findTeamByPlayerTransfers(team.id);
        if (freeApiId) {
          console.log(`  Found via player transfers -> ${freeApiId}`);
        }
      }
      
      if (freeApiId) {
        completeMappings[team.id] = freeApiId;
        console.log(`✅ Mapped: ${team.name} (${team.id}) -> ${freeApiId}`);
      } else {
        unmappedTeams.push({ ...team, league: league.name });
        console.log(`❌ Could not find: ${team.name}`);
      }
      
      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  
  // Summary
  console.log('\n' + '=' .repeat(80));
  console.log('MAPPING COMPLETE\n');
  
  const totalTeams = Object.keys(completeMappings).length;
  console.log(`Total mapped teams: ${totalTeams}`);
  console.log(`Unmapped teams: ${unmappedTeams.length}`);
  
  if (unmappedTeams.length > 0) {
    console.log('\nUnmapped teams that need manual mapping:');
    unmappedTeams.forEach(team => {
      console.log(`  ${team.league}: ${team.name} (${team.id})`);
    });
  }
  
  // Generate updated mapping code
  console.log('\n// Complete team mappings:');
  console.log('export const COMPLETE_TEAM_MAPPINGS: Record<number, number> = {');
  
  for (const league of leagues) {
    console.log(`  // ${league.name}`);
    const teams = await getTeamsFromLeagueStandings(league.id);
    teams.forEach(team => {
      if (completeMappings[team.id]) {
        console.log(`  ${team.id}: ${completeMappings[team.id]}, // ${team.name}`);
      }
    });
  }
  
  console.log('};');
  
  // Save results
  const fs = await import('fs');
  fs.writeFileSync(
    './lib/data/complete-team-mappings.json',
    JSON.stringify({
      mappings: completeMappings,
      unmapped: unmappedTeams,
      totalMapped: totalTeams,
      completeness: ((totalTeams / (totalTeams + unmappedTeams.length)) * 100).toFixed(1) + '%'
    }, null, 2)
  );
  
  console.log('\nResults saved to: lib/data/complete-team-mappings.json');
}

// Run the script
if (require.main === module) {
  completeAllMappings()
    .then(() => {
      console.log('\nMapping completion finished!');
      process.exit(0);
    })
    .catch(error => {
      console.error('Error:', error);
      process.exit(1);
    });
}