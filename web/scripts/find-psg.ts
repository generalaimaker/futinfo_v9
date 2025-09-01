// Focused script to find PSG and other major teams
// Using targeted search based on known patterns

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY || 'bd09a1efecmshf47e95710709f44p1dcafdjsn072eabc66aa4';

// Priority teams to find
const PRIORITY_TEAMS = [
  { name: 'PSG', apiId: 85, searchTerms: ['PSG', 'Paris', 'Saint-Germain', 'Paris SG'] },
  { name: 'Napoli', apiId: 492, searchTerms: ['Napoli', 'Naples', 'SSC'] },
  { name: 'Lazio', apiId: 487, searchTerms: ['Lazio', 'SS Lazio'] },
  { name: 'Bologna', apiId: 500, searchTerms: ['Bologna'] },
  { name: 'Borussia Mönchengladbach', apiId: 163, searchTerms: ['Gladbach', 'Mönchengladbach', 'M\'gladbach'] },
];

async function searchInRecentTransfers() {
  console.log('Searching in recent transfers...\n');
  
  try {
    // Fetch multiple pages to get more data
    for (let page = 1; page <= 3; page++) {
      const response = await fetch(
        `https://free-api-live-football-data.p.rapidapi.com/football-get-all-transfers?page=${page}`,
        {
          headers: {
            'X-RapidAPI-Key': RAPIDAPI_KEY,
            'X-RapidAPI-Host': 'free-api-live-football-data.p.rapidapi.com',
          },
        }
      );
      
      if (!response.ok) continue;
      
      const data = await response.json();
      const transfers = data?.response?.transfers || data?.response || data || [];
      
      const foundTeams = new Map<string, { id: number, name: string }>();
      
      if (Array.isArray(transfers)) {
        transfers.forEach((transfer: any) => {
          // Check each priority team
          PRIORITY_TEAMS.forEach(team => {
            team.searchTerms.forEach(term => {
              const termLower = term.toLowerCase();
              
              // Check fromClub
              if (transfer.fromClub && transfer.fromClub.toLowerCase().includes(termLower)) {
                if (!foundTeams.has(team.name) || foundTeams.get(team.name)!.id !== transfer.fromClubId) {
                  foundTeams.set(team.name, { id: transfer.fromClubId, name: transfer.fromClub });
                  console.log(`✅ Found ${team.name}: ${transfer.fromClubId} (${transfer.fromClub})`);
                }
              }
              
              // Check toClub
              if (transfer.toClub && transfer.toClub.toLowerCase().includes(termLower)) {
                if (!foundTeams.has(team.name) || foundTeams.get(team.name)!.id !== transfer.toClubId) {
                  foundTeams.set(team.name, { id: transfer.toClubId, name: transfer.toClub });
                  console.log(`✅ Found ${team.name}: ${transfer.toClubId} (${transfer.toClub})`);
                }
              }
            });
          });
        });
      }
      
      // Add delay between pages
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    return foundTeams;
  } catch (error) {
    console.error('Error searching transfers:', error);
    return new Map();
  }
}

// Test specific IDs based on patterns from existing mappings
async function testSpecificIds() {
  console.log('\nTesting specific ID ranges based on patterns...\n');
  
  // Based on existing patterns:
  // French teams: 8500-10000 (Marseille 8592, Monaco 9829, Lyon 9748)
  // Italian teams: 8500-10000 (Juventus 9885, Atalanta 8524)
  // German teams: 8000-10000 (Bayern 9823, Dortmund 9789)
  
  const testIds = [
    // Likely PSG range (near other French teams)
    ...Array.from({ length: 10 }, (_, i) => 8580 + i),
    ...Array.from({ length: 10 }, (_, i) => 9740 + i),
    ...Array.from({ length: 10 }, (_, i) => 9820 + i),
    
    // Likely Italian teams range
    ...Array.from({ length: 10 }, (_, i) => 8680 + i),
    ...Array.from({ length: 10 }, (_, i) => 9880 + i),
    
    // Likely German teams range
    ...Array.from({ length: 10 }, (_, i) => 9780 + i),
  ];
  
  const found: Record<string, any> = {};
  
  for (const id of testIds) {
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
            console.log(`  ID ${id}: ${teamName}`);
            
            // Check if this matches any priority team
            PRIORITY_TEAMS.forEach(team => {
              if (team.searchTerms.some(term => 
                teamName.toLowerCase().includes(term.toLowerCase()))) {
                found[team.name] = { id, name: teamName };
                console.log(`    ✅ Matched to ${team.name}!`);
              }
            });
          }
        }
      }
    } catch (error) {
      // Ignore and continue
    }
    
    // Rate limiting
    if (testIds.indexOf(id) % 5 === 0) {
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  }
  
  return found;
}

// Main execution
async function findPriorityTeams() {
  console.log('Finding priority teams for 2024-25 season...\n');
  console.log('=' .repeat(80));
  
  // Method 1: Search in recent transfers
  const transferResults = await searchInRecentTransfers();
  
  // Method 2: Test specific IDs
  const idTestResults = await testSpecificIds();
  
  // Compile final results
  console.log('\n' + '=' .repeat(80));
  console.log('FINAL RESULTS\n');
  
  const finalMappings: Record<number, number> = {};
  
  PRIORITY_TEAMS.forEach(team => {
    const found = transferResults.get(team.name) || idTestResults[team.name];
    
    if (found) {
      finalMappings[team.apiId] = found.id;
      console.log(`✅ ${team.name}: ${team.apiId} -> ${found.id} (${found.name})`);
    } else {
      console.log(`❌ ${team.name}: Not found`);
    }
  });
  
  // Generate code update
  if (Object.keys(finalMappings).length > 0) {
    console.log('\n// Add these mappings to MATCHED_TEAMS:');
    Object.entries(finalMappings).forEach(([apiId, freeId]) => {
      const team = PRIORITY_TEAMS.find(t => t.apiId === parseInt(apiId));
      console.log(`  ${apiId}: ${freeId}, // ${team?.name}`);
    });
  }
  
  return finalMappings;
}

// Run the script
if (require.main === module) {
  findPriorityTeams()
    .then(results => {
      console.log(`\nFound ${Object.keys(results).length} teams!`);
      process.exit(0);
    })
    .catch(error => {
      console.error('Error:', error);
      process.exit(1);
    });
}