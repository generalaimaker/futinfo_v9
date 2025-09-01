// Find the final 5 teams needed for 95% coverage
// Priority: Holstein Kiel, VfL Bochum, Saint-Étienne, Espanyol, Torino

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY || 'bd09a1efecmshf47e95710709f44p1dcafdjsn072eabc66aa4';

const TARGET_TEAMS = [
  // Bundesliga
  { name: 'Holstein Kiel', apiId: 175, hints: ['Holstein', 'Kiel', 'KSV'], league: 'Bundesliga' },
  { name: 'VfL Bochum', apiId: 176, hints: ['Bochum', 'VfL', '1848'], league: 'Bundesliga' },
  
  // Ligue 1
  { name: 'Saint-Étienne', apiId: 1063, hints: ['Saint-Etienne', 'St-Etienne', 'ASSE', 'Saint Etienne'], league: 'Ligue 1' },
  
  // La Liga
  { name: 'Espanyol', apiId: 540, hints: ['Espanyol', 'RCD', 'Español'], league: 'La Liga' },
  
  // Serie A
  { name: 'Torino', apiId: 503, hints: ['Torino', 'Toro', 'FC Torino'], league: 'Serie A' },
];

// Known ID ranges by league
const LEAGUE_ID_RANGES = {
  'Bundesliga': [
    { start: 8140, end: 8160 }, // Holstein Kiel likely here (near 8150)
    { start: 9780, end: 9800 }, // Near other German teams
    { start: 6350, end: 6370 }, // St. Pauli was 6355
  ],
  'Ligue 1': [
    { start: 9840, end: 9860 }, // Near other French teams
    { start: 8570, end: 8590 }, // Near Angers/Auxerre
  ],
  'La Liga': [
    { start: 7850, end: 7870 }, // Near Leganes (7854)
    { start: 8360, end: 8380 }, // Near Rayo (8370)
    { start: 9860, end: 9880 }, // Near Alaves (9866)
  ],
  'Serie A': [
    { start: 8520, end: 8550 }, // Near other Italian teams
    { start: 9850, end: 9890 }, // Near Juventus range
    { start: 10230, end: 10250 }, // Near Genoa (10233)
  ]
};

async function testTeamId(id: number): Promise<{ id: number, name: string } | null> {
  try {
    const response = await fetch(
      `https://free-api-live-football-data.p.rapidapi.com/football-get-team-players-in-transfers?teamid=${id}`,
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
      
      if (Array.isArray(transfers) && transfers.length > 0) {
        const transfer = transfers[0];
        const teamName = transfer.toClubId === id ? transfer.toClub : 
                        transfer.fromClubId === id ? transfer.fromClub : null;
        
        if (teamName) {
          return { id, name: teamName };
        }
      }
    }
  } catch (error) {
    // Ignore
  }
  
  return null;
}

async function searchInRange(targetTeam: any, range: { start: number, end: number }) {
  console.log(`  Searching ${targetTeam.name} in range ${range.start}-${range.end}...`);
  
  for (let id = range.start; id <= range.end; id++) {
    const result = await testTeamId(id);
    
    if (result) {
      const nameLower = result.name.toLowerCase();
      
      // Check if matches any hint
      const matches = targetTeam.hints.some((hint: string) => 
        nameLower.includes(hint.toLowerCase()) || 
        hint.toLowerCase().includes(nameLower)
      );
      
      if (matches) {
        console.log(`    ✅ FOUND: ${targetTeam.name} = ${id} (${result.name})`);
        return { apiId: targetTeam.apiId, freeId: id, name: result.name };
      } else if (id % 10 === 0) {
        console.log(`    ID ${id}: ${result.name}`);
      }
    }
    
    // Rate limiting
    if (id % 5 === 0) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  return null;
}

async function findFinalTeams() {
  console.log('Finding final 5 teams for 95% coverage...\n');
  console.log('=' .repeat(60));
  
  const found: any[] = [];
  
  for (const team of TARGET_TEAMS) {
    console.log(`\nSearching for ${team.name} (${team.league})...`);
    
    const ranges = LEAGUE_ID_RANGES[team.league as keyof typeof LEAGUE_ID_RANGES] || [];
    
    for (const range of ranges) {
      const result = await searchInRange(team, range);
      
      if (result) {
        found.push(result);
        break;
      }
    }
    
    if (!found.find(f => f.apiId === team.apiId)) {
      console.log(`  ❌ Not found in expected ranges`);
      
      // Try expanded search for critical teams
      if (team.name === 'Holstein Kiel') {
        // Holstein Kiel might be wrongly assigned earlier
        console.log('  Trying expanded search for Holstein Kiel...');
        const expandedResult = await searchInRange(team, { start: 8145, end: 8155 });
        if (expandedResult) found.push(expandedResult);
      }
    }
  }
  
  console.log('\n' + '=' .repeat(60));
  console.log('RESULTS\n');
  
  if (found.length > 0) {
    console.log(`Found ${found.length} teams:\n`);
    console.log('// Add these to MATCHED_TEAMS:');
    found.forEach(team => {
      const original = TARGET_TEAMS.find(t => t.apiId === team.apiId);
      console.log(`  ${team.apiId}: ${team.freeId}, // ${original?.name} (${team.name})`);
    });
    
    const newCoverage = ((87 + found.length) / 96 * 100).toFixed(1);
    console.log(`\nNew coverage: ${87 + found.length}/96 teams (${newCoverage}%)`);
  } else {
    console.log('No additional teams found in targeted search.');
  }
  
  return found;
}

// Run the search
if (require.main === module) {
  findFinalTeams()
    .then(results => {
      console.log(`\nSearch completed. Found ${results.length} teams.`);
      process.exit(0);
    })
    .catch(error => {
      console.error('Error:', error);
      process.exit(1);
    });
}