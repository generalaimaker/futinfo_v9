// Script to populate team ID mappings between api-football-v1 and free-api-live-football-data
// Run this script to fetch team data from both APIs and create mappings

import { TEAM_ID_MAPPINGS, TeamIdMapping } from '../lib/data/team-id-mapping';

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY || 'bd09a1efecmshf47e95710709f44p1dcafdjsn072eabc66aa4';

// Fetch teams from api-football-v1 for a specific league
async function fetchApiFootballTeams(leagueId: number, season: number = 2024) {
  try {
    const response = await fetch(
      `https://api-football-v1.p.rapidapi.com/v3/teams?league=${leagueId}&season=${season}`,
      {
        headers: {
          'x-rapidapi-key': RAPIDAPI_KEY,
          'x-rapidapi-host': 'api-football-v1.p.rapidapi.com',
        },
      }
    );
    
    if (!response.ok) {
      throw new Error(`Failed to fetch teams for league ${leagueId}`);
    }
    
    const data = await response.json();
    return data.response || [];
  } catch (error) {
    console.error(`Error fetching api-football teams for league ${leagueId}:`, error);
    return [];
  }
}

// Fetch teams from free-api-live-football-data
async function fetchFreeApiTeams(leagueId: string) {
  try {
    // First, we need to fetch league teams using the transfers endpoint
    // as there might not be a direct teams endpoint
    const response = await fetch(
      `https://free-api-live-football-data.p.rapidapi.com/football-get-league-transfers?leagueid=${leagueId}`,
      {
        headers: {
          'X-RapidAPI-Key': RAPIDAPI_KEY,
          'X-RapidAPI-Host': 'free-api-live-football-data.p.rapidapi.com',
        },
      }
    );
    
    if (!response.ok) {
      throw new Error(`Failed to fetch transfers for league ${leagueId}`);
    }
    
    const data = await response.json();
    console.log(`Raw response for league ${leagueId}:`, JSON.stringify(data).substring(0, 500));
    
    // Extract unique team IDs and names from transfers
    const teams = new Map<number, string>();
    
    // Handle different response structures
    let transfers = [];
    if (data?.response?.transfers && Array.isArray(data.response.transfers)) {
      transfers = data.response.transfers;
    } else if (data?.response && Array.isArray(data.response)) {
      transfers = data.response;
    } else if (Array.isArray(data)) {
      transfers = data;
    } else if (data?.transfers && Array.isArray(data.transfers)) {
      transfers = data.transfers;
    }
    
    if (Array.isArray(transfers)) {
      transfers.forEach((transfer: any) => {
        // Extract from club info
        if (transfer.fromClubId && transfer.fromClub) {
          teams.set(transfer.fromClubId, transfer.fromClub);
        }
        // Extract to club info
        if (transfer.toClubId && transfer.toClub) {
          teams.set(transfer.toClubId, transfer.toClub);
        }
      });
    }
    
    return Array.from(teams.entries()).map(([id, name]) => ({ id, name }));
  } catch (error) {
    console.error(`Error fetching free-api teams for league ${leagueId}:`, error);
    return [];
  }
}

// Normalize team name for matching
function normalizeTeamName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/^(fc|cf|ac|as|ss|sc|vf[bl]|rb|fsv|tsg)\s+/i, '')
    .replace(/\s+(fc|cf|ac|as|ss|sc)$/i, '')
    .replace(/[^a-z0-9]/g, '');
}

// Match teams by name similarity
function matchTeamByName(apiFootballName: string, freeApiTeams: any[]): number | undefined {
  const normalized = normalizeTeamName(apiFootballName);
  
  // Special cases mapping
  const specialCases: Record<string, string[]> = {
    'manchesterunited': ['manutd', 'manunited', 'united', 'manchesterunited'],
    'manchestercity': ['mancity', 'manchestercity', 'city'],
    'nottinghamforest': ['nottinghamforest', 'nottmforest', 'forest'],
    'milan': ['acmilan', 'milan'],
    'inter': ['inter', 'intermilan', 'internazionale'],
    'roma': ['asroma', 'roma'],
    'borussiamönchengladbach': ['mgladbach', 'gladbach', 'monchengladbach', 'borussiamönchengladbach'],
    'borussiadortmund': ['dortmund', 'bvb', 'borussiadortmund'],
    'bayerleverkusen': ['leverkusen', 'bayer04', 'bayerleverkusen'],
    'eintrachtfrankfurt': ['frankfurt', 'eintracht', 'eintrachtfrankfurt'],
    'mainz05': ['mainz', 'mainz05'],
  };
  
  // Check special cases first
  for (const [key, aliases] of Object.entries(specialCases)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      for (const team of freeApiTeams) {
        const freeApiNormalized = normalizeTeamName(team.name);
        if (aliases.some(alias => freeApiNormalized.includes(alias) || alias.includes(freeApiNormalized))) {
          return team.id;
        }
      }
    }
  }
  
  for (const team of freeApiTeams) {
    const freeApiNormalized = normalizeTeamName(team.name);
    
    // Exact match after normalization
    if (normalized === freeApiNormalized) {
      return team.id;
    }
    
    // Check if one contains the other (for partial matches)
    if (normalized.includes(freeApiNormalized) || freeApiNormalized.includes(normalized)) {
      // Additional check for length to avoid false positives
      if (Math.abs(normalized.length - freeApiNormalized.length) < 5) {
        return team.id;
      }
    }
  }
  
  return undefined;
}

// League configurations
const LEAGUES = [
  { apiFootballId: 39, freeApiId: '47', name: 'Premier League' },  // England
  { apiFootballId: 140, freeApiId: '87', name: 'La Liga' },        // Spain
  { apiFootballId: 135, freeApiId: '71', name: 'Serie A' },        // Italy
  { apiFootballId: 78, freeApiId: '54', name: 'Bundesliga' },      // Germany
  { apiFootballId: 61, freeApiId: '53', name: 'Ligue 1' },         // France
];

// Main function to populate mappings
async function populateMappings() {
  console.log('Starting team ID mapping population...\n');
  
  const updatedMappings: TeamIdMapping[] = [...TEAM_ID_MAPPINGS];
  let successCount = 0;
  let failedCount = 0;
  
  for (const league of LEAGUES) {
    console.log(`\nProcessing ${league.name}...`);
    
    // Fetch teams from both APIs
    const [apiFootballTeams, freeApiTeams] = await Promise.all([
      fetchApiFootballTeams(league.apiFootballId),
      fetchFreeApiTeams(league.freeApiId),
    ]);
    
    console.log(`Found ${apiFootballTeams.length} teams in api-football`);
    console.log(`Found ${freeApiTeams.length} unique teams in free-api`);
    
    // Match teams
    for (const apiTeam of apiFootballTeams) {
      const teamName = apiTeam.team?.name;
      const teamId = apiTeam.team?.id;
      
      if (!teamName || !teamId) continue;
      
      // Find in our mapping table
      const mappingIndex = updatedMappings.findIndex(
        m => m.apiFootballId === teamId
      );
      
      if (mappingIndex === -1) {
        console.log(`Warning: Team ${teamName} (${teamId}) not in mapping table`);
        continue;
      }
      
      // Try to find matching team in free-api
      const freeApiId = matchTeamByName(teamName, freeApiTeams);
      
      if (freeApiId) {
        updatedMappings[mappingIndex].freeApiId = freeApiId;
        console.log(`✓ Matched: ${teamName} -> ${freeApiId}`);
        successCount++;
      } else {
        console.log(`✗ No match found for: ${teamName}`);
        failedCount++;
      }
    }
    
    // Add delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Generate updated mapping code
  console.log('\n\n=== RESULTS ===');
  console.log(`Successfully matched: ${successCount} teams`);
  console.log(`Failed to match: ${failedCount} teams`);
  console.log('\n=== UPDATED MAPPINGS ===\n');
  
  // Print updated mappings
  const mappingsWithFreeApi = updatedMappings.filter(m => m.freeApiId !== undefined);
  
  console.log('Teams with successful mappings:');
  mappingsWithFreeApi.forEach(team => {
    console.log(`  { name: '${team.name}', apiFootballId: ${team.apiFootballId}, freeApiId: ${team.freeApiId}, league: '${team.league}' },`);
  });
  
  // Save to file
  const fs = await import('fs');
  const updatedContent = `export const MATCHED_TEAM_MAPPINGS = ${JSON.stringify(mappingsWithFreeApi, null, 2)};`;
  
  fs.writeFileSync(
    './lib/data/matched-team-mappings.json',
    JSON.stringify(mappingsWithFreeApi, null, 2)
  );
  
  console.log('\nMappings saved to: lib/data/matched-team-mappings.json');
}

// Run the script
if (require.main === module) {
  populateMappings()
    .then(() => {
      console.log('\nMapping population completed!');
      process.exit(0);
    })
    .catch(error => {
      console.error('Error:', error);
      process.exit(1);
    });
}