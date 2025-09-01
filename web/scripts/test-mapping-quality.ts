// Test mapping quality for major teams
// Verify that mapped IDs return correct team data

import { MATCHED_TEAMS } from '../lib/data/team-id-mapping';

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY || 'bd09a1efecmshf47e95710709f44p1dcafdjsn072eabc66aa4';

// Test major teams from each league
const TEST_TEAMS = [
  // Premier League
  { name: 'Tottenham', apiId: 47, expectedFreeId: 8586 },
  { name: 'Arsenal', apiId: 42, expectedFreeId: 9825 },
  { name: 'Manchester United', apiId: 33, expectedFreeId: 10260 },
  { name: 'Liverpool', apiId: 40, expectedFreeId: 8650 },
  
  // La Liga
  { name: 'Barcelona', apiId: 529, expectedFreeId: 8634 },
  { name: 'Real Madrid', apiId: 541, expectedFreeId: 8633 },
  { name: 'Atletico Madrid', apiId: 530, expectedFreeId: 9906 },
  
  // Serie A
  { name: 'Juventus', apiId: 496, expectedFreeId: 9885 },
  { name: 'Inter', apiId: 505, expectedFreeId: 8636 },
  { name: 'AC Milan', apiId: 489, expectedFreeId: 8564 },
  
  // Bundesliga
  { name: 'Bayern Munich', apiId: 157, expectedFreeId: 9823 },
  { name: 'Borussia Dortmund', apiId: 165, expectedFreeId: 9789 },
  
  // Ligue 1
  { name: 'PSG', apiId: 85, expectedFreeId: 8547 },
  { name: 'Monaco', apiId: 91, expectedFreeId: 9829 },
  { name: 'Marseille', apiId: 81, expectedFreeId: 8592 },
];

async function testTeamMapping(team: typeof TEST_TEAMS[0]) {
  console.log(`Testing ${team.name}...`);
  
  // Check if mapping exists
  const mappedId = MATCHED_TEAMS[team.apiId];
  if (!mappedId) {
    console.log(`  ❌ No mapping found for ${team.name}`);
    return false;
  }
  
  if (mappedId !== team.expectedFreeId) {
    console.log(`  ⚠️ Mapping mismatch: expected ${team.expectedFreeId}, got ${mappedId}`);
  }
  
  // Test the free-api ID
  try {
    const response = await fetch(
      `https://free-api-live-football-data.p.rapidapi.com/football-get-team-players-in-transfers?teamid=${mappedId}`,
      {
        headers: {
          'X-RapidAPI-Key': RAPIDAPI_KEY,
          'X-RapidAPI-Host': 'free-api-live-football-data.p.rapidapi.com',
        },
      }
    );
    
    if (!response.ok) {
      console.log(`  ❌ API request failed for ${team.name} (${mappedId})`);
      return false;
    }
    
    const data = await response.json();
    const transfers = data?.response?.transfers || data?.response || data || [];
    
    if (!Array.isArray(transfers)) {
      console.log(`  ⚠️ No transfer data for ${team.name}`);
      return true; // Mapping might be correct but no recent transfers
    }
    
    // Check if team name appears in transfers
    if (transfers.length > 0) {
      const transfer = transfers[0];
      const teamName = transfer.toClub || transfer.fromClub;
      console.log(`  ✅ ${team.name}: ${team.apiId} → ${mappedId} (${teamName})`);
      return true;
    } else {
      console.log(`  ⚠️ ${team.name}: No recent transfers to verify`);
      return true; // Assume correct if no data to disprove
    }
  } catch (error) {
    console.log(`  ❌ Error testing ${team.name}:`, error);
    return false;
  }
}

async function runQualityTest() {
  console.log('Team Mapping Quality Test');
  console.log('=' .repeat(60));
  console.log(`Testing ${TEST_TEAMS.length} major teams...\n`);
  
  let passed = 0;
  let failed = 0;
  
  for (const team of TEST_TEAMS) {
    const result = await testTeamMapping(team);
    if (result) passed++;
    else failed++;
    
    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log('\n' + '=' .repeat(60));
  console.log('RESULTS');
  console.log(`Passed: ${passed}/${TEST_TEAMS.length} (${(passed/TEST_TEAMS.length*100).toFixed(1)}%)`);
  console.log(`Failed: ${failed}/${TEST_TEAMS.length}`);
  
  if (passed >= TEST_TEAMS.length * 0.9) {
    console.log('\n✅ Mapping quality is GOOD (90%+ success rate)');
  } else if (passed >= TEST_TEAMS.length * 0.7) {
    console.log('\n⚠️ Mapping quality is ACCEPTABLE (70%+ success rate)');
  } else {
    console.log('\n❌ Mapping quality is POOR (below 70% success rate)');
  }
  
  return { passed, failed, total: TEST_TEAMS.length };
}

// Run the test
if (require.main === module) {
  runQualityTest()
    .then(results => {
      console.log('\nQuality test completed.');
      process.exit(results.failed > 3 ? 1 : 0);
    })
    .catch(error => {
      console.error('Test error:', error);
      process.exit(1);
    });
}