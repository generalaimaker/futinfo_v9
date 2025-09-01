// Manual team mapping for 2024-25 season
// Find missing team IDs by testing known transfers or using brute force

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY || 'bd09a1efecmshf47e95710709f44p1dcafdjsn072eabc66aa4';

// Teams we need to find (2024-25 season)
const MISSING_TEAMS = {
  // La Liga (2024-25) - 3 teams
  'Osasuna': { apiFootballId: 727, hints: ['Pamplona', 'CA Osasuna'] },
  'Espanyol': { apiFootballId: 540, hints: ['RCD Espanyol', 'Espanyol Barcelona'] },
  'Real Valladolid': { apiFootballId: 720, hints: ['Valladolid', 'Real Valladolid CF'] },
  
  // Serie A (2024-25) - 8 teams
  'Napoli': { apiFootballId: 492, hints: ['SSC Napoli', 'Napoli', 'Naples'] },
  'Lazio': { apiFootballId: 487, hints: ['SS Lazio', 'Lazio Roma'] },
  'Bologna': { apiFootballId: 500, hints: ['Bologna FC', 'Bologna 1909'] },
  'Torino': { apiFootballId: 503, hints: ['Torino FC', 'Toro'] },
  'Cagliari': { apiFootballId: 490, hints: ['Cagliari Calcio'] },
  'Parma': { apiFootballId: 521, hints: ['Parma Calcio', 'Parma 1913'] },
  'Lecce': { apiFootballId: 867, hints: ['US Lecce'] },
  'Monza': { apiFootballId: 1579, hints: ['AC Monza', 'Monza 1912'] },
  
  // Bundesliga (2024-25) - 3 teams  
  'Borussia Mönchengladbach': { apiFootballId: 163, hints: ['Gladbach', 'M\'gladbach', 'BMG'] },
  'Holstein Kiel': { apiFootballId: 175, hints: ['Holstein', 'KSV Holstein'] },
  'VfL Bochum': { apiFootballId: 176, hints: ['Bochum', 'VfL Bochum 1848'] },
  
  // Ligue 1 (2024-25) - 4 teams
  'Paris Saint-Germain': { apiFootballId: 85, hints: ['PSG', 'Paris SG', 'Paris-SG', 'Paris Saint Germain'] },
  'Angers': { apiFootballId: 77, hints: ['Angers SCO', 'SCO Angers'] },
  'Reims': { apiFootballId: 93, hints: ['Stade de Reims', 'Stade Reims'] },
  'Saint-Étienne': { apiFootballId: 1063, hints: ['ASSE', 'AS Saint-Étienne', 'St-Etienne'] },
};

// Method 1: Search by testing team logo endpoint with ID ranges
async function findTeamByIdRange(teamName: string, startId: number, endId: number) {
  console.log(`Searching ${teamName} in range ${startId}-${endId}...`);
  
  for (let id = startId; id <= endId; id++) {
    try {
      const response = await fetch(
        `https://free-api-live-football-data.p.rapidapi.com/football-team-logo?teamid=${id}`,
        {
          headers: {
            'X-RapidAPI-Key': RAPIDAPI_KEY,
            'X-RapidAPI-Host': 'free-api-live-football-data.p.rapidapi.com',
          },
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        
        // Also try to get team name from transfers
        const transferResponse = await fetch(
          `https://free-api-live-football-data.p.rapidapi.com/football-get-team-players-in-transfers?teamid=${id}`,
          {
            headers: {
              'X-RapidAPI-Key': RAPIDAPI_KEY,
              'X-RapidAPI-Host': 'free-api-live-football-data.p.rapidapi.com',
            },
          }
        );
        
        if (transferResponse.ok) {
          const transferData = await transferResponse.json();
          const transfers = transferData?.response?.transfers || transferData?.response || transferData || [];
          
          if (Array.isArray(transfers) && transfers.length > 0) {
            const transfer = transfers[0];
            const foundName = transfer.toClubId === id ? transfer.toClub : transfer.fromClub;
            
            if (foundName) {
              console.log(`  ID ${id}: ${foundName}`);
              
              // Check if this matches our target
              const normalizedFound = foundName.toLowerCase();
              const normalizedTarget = teamName.toLowerCase();
              
              if (normalizedFound.includes(normalizedTarget) || 
                  normalizedTarget.includes(normalizedFound) ||
                  MISSING_TEAMS[teamName]?.hints.some(hint => 
                    normalizedFound.includes(hint.toLowerCase()))) {
                console.log(`  ✅ FOUND ${teamName}: ${id} (${foundName})`);
                return { id, name: foundName };
              }
            }
          }
        }
      }
    } catch (error) {
      // Ignore errors and continue
    }
    
    // Rate limiting
    if (id % 10 === 0) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  return null;
}

// Method 2: Search by known recent transfers
async function findByKnownTransfers() {
  const knownTransfers = {
    // PSG recent transfers
    'PSG': ['Kylian Mbappé', 'Ousmane Dembélé', 'Marco Asensio', 'Lucas Hernández'],
    // Napoli recent transfers  
    'Napoli': ['Victor Osimhen', 'Khvicha Kvaratskhelia', 'Giovanni Simeone'],
    // Lazio recent transfers
    'Lazio': ['Ciro Immobile', 'Luis Alberto', 'Sergej Milinković-Savić'],
  };
  
  console.log('Searching by known transfers...');
  
  const response = await fetch(
    `https://free-api-live-football-data.p.rapidapi.com/football-get-all-transfers?page=1`,
    {
      headers: {
        'X-RapidAPI-Key': RAPIDAPI_KEY,
        'X-RapidAPI-Host': 'free-api-live-football-data.p.rapidapi.com',
      },
    }
  );
  
  if (response.ok) {
    const data = await response.json();
    const transfers = data?.response?.transfers || data?.response || data || [];
    
    const foundTeams = new Map<string, Set<number>>();
    
    transfers.forEach((transfer: any) => {
      Object.entries(knownTransfers).forEach(([team, players]) => {
        if (players.some(player => transfer.name?.includes(player))) {
          if (!foundTeams.has(team)) {
            foundTeams.set(team, new Set());
          }
          if (transfer.fromClubId) foundTeams.get(team)!.add(transfer.fromClubId);
          if (transfer.toClubId) foundTeams.get(team)!.add(transfer.toClubId);
          
          console.log(`  Found ${team} candidate: ${transfer.fromClub || transfer.toClub} (${transfer.fromClubId || transfer.toClubId})`);
        }
      });
    });
    
    return foundTeams;
  }
  
  return new Map();
}

// Method 3: Use common ID patterns
async function searchByPatterns() {
  // Based on observed patterns:
  // Premier League: 8000-11000
  // La Liga: 7000-11000  
  // Serie A: 7000-11000
  // Bundesliga: 6000-11000
  // Ligue 1: 8000-11000
  
  const searchRanges = [
    { start: 8000, end: 8100, priority: ['PSG', 'Napoli'] },
    { start: 8300, end: 8400, priority: ['Lazio', 'Bologna'] },
    { start: 8500, end: 8600, priority: ['PSG', 'Napoli'] },
    { start: 8700, end: 8800, priority: ['Osasuna', 'Espanyol'] },
    { start: 9700, end: 9800, priority: ['Gladbach', 'Reims'] },
    { start: 9800, end: 9900, priority: ['PSG', 'Angers'] },
    { start: 10100, end: 10200, priority: ['Monza', 'Lecce'] },
  ];
  
  const results: Record<string, any> = {};
  
  for (const range of searchRanges) {
    console.log(`\nSearching range ${range.start}-${range.end} for priority teams: ${range.priority.join(', ')}`);
    
    for (const teamName of range.priority) {
      if (!results[teamName] && MISSING_TEAMS[teamName]) {
        const found = await findTeamByIdRange(teamName, range.start, range.end);
        if (found) {
          results[teamName] = found;
        }
      }
    }
  }
  
  return results;
}

// Main execution
async function findMissingTeams() {
  console.log('Starting manual team mapping for 2024-25 season...\n');
  console.log('=' .repeat(80));
  
  // Method 1: Search by known transfers
  console.log('\n1. SEARCHING BY KNOWN TRANSFERS\n');
  const transferResults = await findByKnownTransfers();
  
  // Method 2: Search by ID patterns
  console.log('\n2. SEARCHING BY ID PATTERNS\n');
  const patternResults = await searchByPatterns();
  
  // Method 3: Brute force for PSG (most important)
  console.log('\n3. FOCUSED SEARCH FOR PSG\n');
  const psgResult = await findTeamByIdRange('Paris Saint-Germain', 8000, 10000);
  
  // Compile results
  console.log('\n' + '=' .repeat(80));
  console.log('MANUAL MAPPING RESULTS\n');
  
  const finalMappings: Record<string, number> = {};
  
  // From pattern search
  Object.entries(patternResults).forEach(([team, data]: [string, any]) => {
    const apiId = Object.entries(MISSING_TEAMS).find(([name]) => name === team)?.[1].apiFootballId;
    if (apiId) {
      finalMappings[apiId] = data.id;
      console.log(`✅ ${team}: ${apiId} -> ${data.id} (${data.name})`);
    }
  });
  
  // PSG special case
  if (psgResult) {
    finalMappings[85] = psgResult.id;
    console.log(`✅ PSG: 85 -> ${psgResult.id} (${psgResult.name})`);
  }
  
  // Generate code
  console.log('\n// Add these to MATCHED_TEAMS:');
  Object.entries(finalMappings).forEach(([apiId, freeId]) => {
    const team = Object.entries(MISSING_TEAMS).find(([, data]) => data.apiFootballId === parseInt(apiId))?.[0];
    console.log(`  ${apiId}: ${freeId}, // ${team}`);
  });
  
  // Save results
  const fs = await import('fs');
  fs.writeFileSync(
    './scripts/manual-mapping-results.json',
    JSON.stringify({
      found: finalMappings,
      transferHints: Array.from(transferResults.entries()).map(([team, ids]) => ({
        team,
        candidateIds: Array.from(ids),
      })),
      timestamp: new Date().toISOString(),
    }, null, 2)
  );
  
  console.log('\nResults saved to: scripts/manual-mapping-results.json');
}

// Run the manual mapping
if (require.main === module) {
  findMissingTeams()
    .then(() => {
      console.log('\nManual mapping completed!');
      process.exit(0);
    })
    .catch(error => {
      console.error('Error:', error);
      process.exit(1);
    });
}